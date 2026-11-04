/**
 * 이메일 로그인 — 매직 링크 (포털 공용, ORDER_20261105 GO 로그인 — 작가님 07:12 "추가로 이메일로 가입도 추가")
 *
 * 비밀번호 없음. 링크 유효 15분·1회용. 남용 방지: 같은 주소 분당 1회·하루 10회(Firestore 원자), 같은 IP 시간당 30회(메모리).
 * 저장: email_login_tokens/{sha256(토큰)} — 원 토큰은 저장하지 않는다. email_login_rate/{sha256(주소)}.
 * 계정: users/email_{sha256(주소) 앞 24자} — 제공자별 신원(OAuth 계정과 자동 병합하지 않는다 — 탈취 방지, 설계서 §5).
 * 로그·응답에 주소를 쓰지 않는다(마스킹·해시). 주소 존재 여부를 응답으로 드러내지 않는다.
 * 완료 후: 포털 세션 쿠키(.monkos.ai) + 허용 출처면 그 앱으로, 앱 주소 조각(#monkos_xt=)에 5분 토큰을 실어 보낸다(쿠키가 닿지 않는 로컬 앱용).
 */
import { createHash, randomBytes } from 'crypto';
import { firestore, usersCollection, log, generateAuthToken, parseJsonBody, allowedPopupOrigins } from './shared/config.js';
import { sendMail, MailError } from './mailer.js';
import { effectiveHost } from './shared/edge-trust.js';
import { trackEvent, linkIdentity } from './tracking.js';

export const LINK_TTL_MS = 15 * 60 * 1000;
export const PER_MINUTE = 1;
export const PER_DAY = 10;
const IP_PER_HOUR = 30;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$/;

export const sha256 = (s) => createHash('sha256').update(String(s)).digest('hex');
export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const isEmail = (e) => EMAIL_RE.test(e) && e.length <= 254;
/** 로그용 마스킹 — a***@d***.com */
export const maskEmail = (e) => { const [u, d = ''] = String(e).split('@'); const [h, ...rest] = d.split('.'); return `${(u || '?')[0]}***@${(h || '?')[0]}***.${rest.join('.') || '?'}`; };
export const emailUserId = (email) => 'email_' + sha256(normEmail(email)).slice(0, 24);

/** 돌아갈 곳 — 내부 경로 또는 허용 출처만(그 밖은 포털 첫 화면) */
export function safeReturn(redirectApp, allowed = allowedPopupOrigins()) {
  const r = String(redirectApp || '');
  if (r.startsWith('/') && !r.startsWith('//')) return r;
  try { const u = new URL(r); return allowed.includes(u.origin) ? u.origin + u.pathname : '/'; } catch { return '/'; }
}

/** 순수 판정 — 분당·일 한도. state = {lastAt, day, count} */
export function rateDecision(state, now = Date.now()) {
  const day = new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST 날짜
  const s = state || {};
  if (s.lastAt && now - s.lastAt < 60 * 1000 / PER_MINUTE) return { ok: false, reason: 'minute' };
  const count = s.day === day ? (s.count || 0) : 0;
  if (count >= PER_DAY) return { ok: false, reason: 'day' };
  return { ok: true, next: { lastAt: now, day, count: count + 1 } };
}

const ipHits = new Map();
function ipOk(ip, now = Date.now()) {
  const h = (ipHits.get(ip) || []).filter((t) => now - t < 3600 * 1000);
  if (h.length >= IP_PER_HOUR) { ipHits.set(ip, h); return false; }
  h.push(now); ipHits.set(ip, h);
  if (ipHits.size > 5000) ipHits.clear();
  return true;
}

const MAIL = {
  ko: { s: 'MONKOS 로그인 링크', b: (l) => `아래 링크를 누르면 MONKOS에 로그인됩니다. 15분 동안 한 번만 쓸 수 있습니다.\n\n${l}\n\n요청하지 않았다면 이 메일을 무시하세요.` },
  ja: { s: 'MONKOS ログインリンク', b: (l) => `下のリンクを押すと MONKOS にログインします。15分間、1回だけ使えます。\n\n${l}\n\nお心当たりがない場合はこのメールを無視してください。` },
  en: { s: 'Your MONKOS sign-in link', b: (l) => `Click the link below to sign in to MONKOS. It works once and expires in 15 minutes.\n\n${l}\n\nIf you didn't request this, you can ignore this email.` },
};

/** POST /api/auth/email/start  { email, redirectApp?, lang? } → 항상 같은 성공 응답(주소 존재 여부 비노출). 한도 초과만 429 */
export async function handleEmailStart(req, res, { clientIp = '' } = {}) {
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  let body;
  try { body = await parseJsonBody(req); } catch { return send(400, { error: 'bad_json' }); }
  const email = normEmail(body?.email);
  if (!isEmail(email)) return send(400, { error: 'invalid_email' });
  if (!ipOk(clientIp)) return send(429, { error: 'rate_limited' });
  const eh = sha256(email);
  const rateRef = firestore.collection('email_login_rate').doc(eh);
  let decision;
  try {
    decision = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(rateRef);
      const d = rateDecision(snap.exists ? snap.data() : null);
      if (d.ok) tx.set(rateRef, d.next);
      return d;
    });
  } catch (e) {
    log(`[EmailLogin] 한도 확인 실패: ${e.message}`, 'ERROR');
    return send(500, { error: 'server_error' });
  }
  if (!decision.ok) {
    log(`[EmailLogin] 한도 초과(${decision.reason}) ${maskEmail(email)}`, 'WARNING');
    return send(429, { error: 'rate_limited', reason: decision.reason });
  }
  const token = randomBytes(32).toString('base64url');
  const lang = ['ko', 'ja', 'en'].includes(body?.lang) ? body.lang : 'ko';
  await firestore.collection('email_login_tokens').doc(sha256(token)).set({
    emailHash: eh, email, used: false, createdAt: Date.now(), expiresAt: Date.now() + LINK_TTL_MS,
    redirectApp: safeReturn(body?.redirectApp), lang,
  });
  const link = `https://${effectiveHost(req)}/auth/email/callback?t=${token}`;
  try {
    const id = await sendMail({ to: email, subject: MAIL[lang].s, text: MAIL[lang].b(link), redactLog: true });
    log(`[EmailLogin] 링크 발송 ${maskEmail(email)} id=${id}`);
  } catch (e) {
    log(`[EmailLogin] 발송 실패 ${maskEmail(email)}: ${e.message}`, 'ERROR');
    return send(e instanceof MailError && e.status === 429 ? 429 : 502, { error: 'mail_failed' });
  }
  return send(200, { success: true, ttlMin: LINK_TTL_MS / 60000 });
}

/** GET /auth/email/callback?t= — 1회용 소모(트랜잭션) → 계정 생성/로그인 → 세션 쿠키 → 돌아갈 곳 */
export async function handleEmailCallback(req, res) {
  const url = new URL(req.url, `http://${effectiveHost(req)}`);
  const token = url.searchParams.get('t') || '';
  const fail = (why) => { log(`[EmailLogin] 콜백 실패: ${why}`, 'WARNING'); res.writeHead(302, { Location: '/?error=email_link_invalid' }); res.end(); };
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return fail('형식');
  const ref = firestore.collection('email_login_tokens').doc(sha256(token));
  let rec;
  try {
    rec = await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { bad: '없음' };
      const d = snap.data();
      if (d.used) return { bad: '이미 사용' };
      if (Date.now() > d.expiresAt) return { bad: '만료' };
      tx.update(ref, { used: true, usedAt: Date.now() });
      return d;
    });
  } catch (e) { return fail(`트랜잭션 ${e.message}`); }
  if (rec.bad) return fail(rec.bad);

  const uid = emailUserId(rec.email);
  const userRef = usersCollection.doc(uid);
  const doc = await userRef.get();
  const isNew = !doc.exists;
  const local = rec.email.split('@')[0];
  await userRef.set({
    id: uid, provider: 'email', email: rec.email, emailVerified: true, lastLogin: new Date().toISOString(),
    ...(isNew ? { name: local.slice(0, 20), picture: '', createdAt: new Date().toISOString(), credits: 10, signupSource: 'email_link' } : {}),
  }, { merge: true });
  log(`[EmailLogin] ${isNew ? '신규 가입 (+10c)' : '로그인'}: ${uid}`);
  trackEvent({ eventName: isNew ? 'auth_signup' : 'auth_login', userId: uid, sessionId: req.sessionId, pagePath: '/auth/email/callback', service: 'portal', params: { provider: 'email' } }).catch(() => {});
  linkIdentity(req.sessionId, uid).catch(() => {});

  const { token: session } = generateAuthToken(uid, 30 * 24 * 60 * 60 * 1000);
  res.setHeader('Set-Cookie', `monkos_session=${session}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  const back = safeReturn(rec.redirectApp);
  // 외부 허용 출처(바둑 등)는 쿠키가 닿지 않을 수 있어(로컬) 5분 토큰을 주소 조각으로 — 서버로 전송되지 않는다
  const dest = back.startsWith('/') ? back : `${back}#monkos_xt=${generateAuthToken(uid).token}`;
  res.writeHead(302, { Location: dest, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  res.end();
}
