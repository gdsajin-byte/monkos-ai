/**
 * 이메일 매직 링크 (ORDER_20261105 GO 로그인) — 한도·돌아갈 곳·1회용·만료·주소 비노출
 */
import { jest } from '@jest/globals';

// ---- 가짜 Firestore (컬렉션별 Map, 트랜잭션은 순차 실행)
const store = new Map();
const col = (name) => ({ doc: (id) => ({
  _k: name + '/' + id,
  get: async () => { const v = store.get(name + '/' + id); return { exists: !!v, data: () => v }; },
  set: async (v, o) => { store.set(name + '/' + id, o && o.merge ? { ...(store.get(name + '/' + id) || {}), ...v } : v); },
  update: async (v) => { store.set(name + '/' + id, { ...store.get(name + '/' + id), ...v }); },
}) });
const firestore = { collection: col, runTransaction: async (fn) => fn({
  get: (ref) => ref.get(), set: (ref, v) => { store.set(ref._k, v); }, update: (ref, v) => { store.set(ref._k, { ...store.get(ref._k), ...v }); },
}) };
const logs = [];
jest.unstable_mockModule('../lib/shared/config.js', () => ({
  firestore, usersCollection: col('users'), log: (m) => logs.push(m),
  generateAuthToken: (uid, ttl) => ({ token: `tok(${uid},${ttl || 300000})`, expires: 0 }),
  parseJsonBody: async (req) => req.body,
  allowedPopupOrigins: () => ['https://monkos.ai', 'https://go.monkos.ai'],
}));
const sent = [];
class MailError extends Error { constructor(m, o = {}) { super(m); this.status = o.status || 0; } }
jest.unstable_mockModule('../lib/mailer.js', () => ({ MailError, sendMail: async (o) => { sent.push(o); return 'mail-id-1'; } }));
jest.unstable_mockModule('../lib/shared/edge-trust.js', () => ({ effectiveHost: () => 'monkos-portal-dev.example' }));
jest.unstable_mockModule('../lib/tracking.js', () => ({ trackEvent: async () => {}, linkIdentity: async () => {} }));

const M = await import('../lib/email-login.js');
const res = () => { const r = { code: 0, headers: {}, body: '' }; r.writeHead = (c, h) => { r.code = c; Object.assign(r.headers, h || {}); }; r.setHeader = (k, v) => { r.headers[k] = v; }; r.end = (b) => { r.body = b || ''; }; return r; };
const EMAIL = 'Tester.One@Example.com';

beforeEach(() => { store.clear(); sent.length = 0; logs.length = 0; });

describe('순수 함수', () => {
  test('한도 — 분당 1회·하루 10회, 날짜 바뀌면 초기화', () => {
    const t0 = Date.parse('2026-11-05T00:00:00Z');
    let s = null;
    const a = M.rateDecision(s, t0); expect(a.ok).toBe(true); s = a.next;
    expect(M.rateDecision(s, t0 + 30000)).toEqual({ ok: false, reason: 'minute' });
    for (let i = 1; i < 10; i++) { const d = M.rateDecision(s, t0 + i * 61000); expect(d.ok).toBe(true); s = d.next; }
    expect(s.count).toBe(10);
    expect(M.rateDecision(s, t0 + 11 * 61000)).toEqual({ ok: false, reason: 'day' });
    expect(M.rateDecision(s, t0 + 24 * 3600 * 1000).ok).toBe(true); // 다음 날
  });
  test('돌아갈 곳 — 내부 경로·허용 출처만', () => {
    expect(M.safeReturn('/mypage')).toBe('/mypage');
    expect(M.safeReturn('//evil.com')).toBe('/');
    expect(M.safeReturn('https://go.monkos.ai/room/1?x=1')).toBe('https://go.monkos.ai/room/1');
    expect(M.safeReturn('https://evil.com')).toBe('/');
    expect(M.safeReturn('javascript:alert(1)')).toBe('/');
  });
  test('주소 정규화·계정 id·마스킹', () => {
    expect(M.emailUserId(EMAIL)).toBe(M.emailUserId(' tester.one@example.com ')); // 대소문자·공백 무관
    expect(M.emailUserId(EMAIL)).toMatch(/^email_[0-9a-f]{24}$/);
    expect(M.maskEmail('tester.one@example.com')).toBe('t***@e***.com');
    expect(M.isEmail('a@b.co')).toBe(true);
    expect(M.isEmail('no-at-sign')).toBe(false);
    expect(M.isEmail('a@b')).toBe(false);
  });
});

describe('시작 /api/auth/email/start', () => {
  test('성공 — 토큰은 해시로만 저장, 메일은 마스킹 로그, 응답에 주소 없음', async () => {
    const r = res();
    await M.handleEmailStart({ body: { email: EMAIL, redirectApp: 'https://go.monkos.ai/', lang: 'ko' }, headers: {} }, r, { clientIp: '1.1.1.1' });
    expect(r.code).toBe(200);
    expect(r.body).not.toMatch(/example/i);
    expect(sent).toHaveLength(1);
    expect(sent[0].redactLog).toBe(true);
    const link = sent[0].text.match(/https:\/\/\S+/)[0];
    const tok = new URL(link).searchParams.get('t');
    const rec = store.get('email_login_tokens/' + M.sha256(tok));
    expect(rec.used).toBe(false);
    expect(rec.redirectApp).toBe('https://go.monkos.ai/');
    expect([...store.keys()].some((k) => k.includes(tok))).toBe(false); // 원 토큰은 키로도 저장 안 함
    expect(logs.join('\n')).not.toMatch(/tester\.one|example\.com/i);
  });
  test('같은 주소 1분 내 재요청 → 429', async () => {
    await M.handleEmailStart({ body: { email: EMAIL }, headers: {} }, res(), { clientIp: '2.2.2.2' });
    const r = res();
    await M.handleEmailStart({ body: { email: EMAIL }, headers: {} }, r, { clientIp: '2.2.2.2' });
    expect(r.code).toBe(429);
    expect(sent).toHaveLength(1);
  });
  test('잘못된 주소 → 400, 발송 없음', async () => {
    const r = res();
    await M.handleEmailStart({ body: { email: 'x' }, headers: {} }, r, { clientIp: '3.3.3.3' });
    expect(r.code).toBe(400); expect(sent).toHaveLength(0);
  });
});

describe('콜백 /auth/email/callback', () => {
  async function issue(redirectApp) {
    store.clear(); sent.length = 0;
    await M.handleEmailStart({ body: { email: EMAIL, redirectApp }, headers: {} }, res(), { clientIp: '9.9.9.' + Math.random() });
    return new URL(sent[0].text.match(/https:\/\/\S+/)[0]).searchParams.get('t');
  }
  test('1회용 — 첫 사용 성공(쿠키·계정 생성·바둑으로 5분 토큰), 두 번째는 실패', async () => {
    const t = await issue('https://go.monkos.ai/');
    const r1 = res();
    await M.handleEmailCallback({ url: '/auth/email/callback?t=' + t, headers: {} }, r1);
    expect(r1.code).toBe(302);
    expect(r1.headers['Set-Cookie']).toMatch(/^monkos_session=tok\(email_[0-9a-f]{24},2592000000\); Domain=\.monkos\.ai/);
    expect(r1.headers.Location).toBe(`https://go.monkos.ai/#monkos_xt=tok(${M.emailUserId(EMAIL)},300000)`);
    const u = store.get('users/' + M.emailUserId(EMAIL));
    expect(u).toMatchObject({ provider: 'email', emailVerified: true, credits: 10 });
    const r2 = res();
    await M.handleEmailCallback({ url: '/auth/email/callback?t=' + t, headers: {} }, r2);
    expect(r2.headers.Location).toBe('/?error=email_link_invalid');
  });
  test('만료(15분 초과) → 실패', async () => {
    const t = await issue('/');
    const k = 'email_login_tokens/' + M.sha256(t);
    store.set(k, { ...store.get(k), expiresAt: Date.now() - 1 });
    const r = res();
    await M.handleEmailCallback({ url: '/auth/email/callback?t=' + t, headers: {} }, r);
    expect(r.headers.Location).toBe('/?error=email_link_invalid');
  });
  test('재로그인은 크레딧을 다시 주지 않는다(merge)', async () => {
    let t = await issue('/');
    await M.handleEmailCallback({ url: '/auth/email/callback?t=' + t, headers: {} }, res());
    const uid = M.emailUserId(EMAIL);
    store.set('users/' + uid, { ...store.get('users/' + uid), credits: 3 });
    const keep = store.get('users/' + uid);
    store.clear(); store.set('users/' + uid, keep);
    sent.length = 0;
    await M.handleEmailStart({ body: { email: EMAIL }, headers: {} }, res(), { clientIp: '8.8.8.8' });
    t = new URL(sent[0].text.match(/https:\/\/\S+/)[0]).searchParams.get('t');
    await M.handleEmailCallback({ url: '/auth/email/callback?t=' + t, headers: {} }, res());
    expect(store.get('users/' + uid).credits).toBe(3);
  });
  test('형식이 틀린 토큰 → 실패', async () => {
    const r = res();
    await M.handleEmailCallback({ url: '/auth/email/callback?t=short', headers: {} }, r);
    expect(r.headers.Location).toBe('/?error=email_link_invalid');
  });
});
