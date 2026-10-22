// 몽크사진관 인화 주문 — 공용 모듈 (Pages Functions)
// 설계: monkos-ops/ops/proposals/PROPOSAL_20261003_M2쌍아_KKU_인화주문_사진전송.md (A안)
//       + 토스 결제 연동 (작가님 2026-10-22 17:47 착수 승인, 결제 방식 (나))
// 원칙: 서버 저장 0 — 사진은 Resend로 꾸 메일함에 전달하고 끝. 로그에는 주문번호·장수·용량·결과만.
//       가격은 여기가 정본이다. 화면(print.html·photo.html)의 숫자는 표시용.

export const ORDER_TO_DEFAULT = 'smuse73@naver.com';           // 꾸 (10-03 꾸 운영 입력)
export const MAIL_FROM_DEFAULT = '몽크사진관 <info@monkos.ai>';  // 인증 도메인 (PROPOSAL D2 1단계)
export const POST_FEE = 1800;                                   // 준등기
export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;                 // 장당 20MB (화면과 동일, 서버가 다시 검사)
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;                // 주문당 20MB
export const MAIL_CHUNK_BYTES = 10 * 1024 * 1024;               // 메일 1통 원본 합계 상한 (네이버 수신 한도 대비)
export const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;                 // 주문 토큰 유효 2시간

export const KINDS = {
  id: {
    label: '증명 · 서류사진 인화',
    unit: 10000,                       // 종류 불문 매당 (print.html UNIT)
    mailAlways: true,
  },
  photo: {
    label: '일반 사진 인화',
    sizes: {                           // photo.html SIZES
      '4x6': { label: '4×6',  price: 1000,  big: false },
      '5x7': { label: '5×7',  price: 2000,  big: false },
      '8r':  { label: '8R',   price: 15000, big: true },
      'a4':  { label: 'A4',   price: 15000, big: true },
      '11r': { label: '11R',  price: 30000, big: true },
      'a3':  { label: 'A3',   price: 30000, big: true },
      'a2':  { label: 'A2',   price: 60000, big: true },
    },
    mailMin: 10,                       // 4×6·5×7 합계 10매 이상만 우편
  },
};

export class OrderError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') { super(message); this.status = status; this.code = code; }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }

// ── 주문 검증·금액 (정본) ─────────────────────────────────────────────
// 입력: { kind, name, phone, delivery, addr1, addr2, items:[{file, purpose|size, qty}] }, photoNames:[]
// 반환: { kind, name, phone, phoneDigits, delivery, addr1, addr2, items, count, itemAmount, postFee, amount, summary }
export function validateOrder(o, photoNames) {
  const kind = KINDS[o.kind] ? o.kind : null;
  if (!kind) throw new OrderError('주문 종류가 올바르지 않습니다', 400, 'KIND');
  const name = clean(o.name, 40);
  const phoneRaw = clean(o.phone, 20);
  const phoneDigits = phoneRaw.replace(/\D/g, '');
  if (!name) throw new OrderError('이름을 적어 주세요', 400, 'NAME');
  if (phoneDigits.length < 9 || phoneDigits.length > 11) throw new OrderError('연락처를 확인해 주세요', 400, 'PHONE');
  const delivery = o.delivery === 'mail' ? 'mail' : 'store';
  const addr1 = clean(o.addr1, 120), addr2 = clean(o.addr2, 120);
  if (delivery === 'mail' && !addr1) throw new OrderError('받는 주소를 적어 주세요', 400, 'ADDR');

  if (!Array.isArray(photoNames) || photoNames.length === 0) throw new OrderError('사진을 올려 주세요', 400, 'PHOTOS');
  if (!Array.isArray(o.items) || o.items.length === 0) throw new OrderError('인화 항목이 없습니다', 400, 'ITEMS');
  if (o.items.length > 20) throw new OrderError('항목이 너무 많습니다', 400, 'ITEMS');

  const items = [];
  let count = 0, itemAmount = 0, hasBig = false;
  for (const raw of o.items) {
    const qty = Number(raw && raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new OrderError('매수를 확인해 주세요', 400, 'QTY');
    const file = clean(raw.file, 200);
    if (!photoNames.includes(file)) throw new OrderError('항목의 사진이 올린 사진과 맞지 않습니다', 400, 'ITEM_FILE');
    if (kind === 'id') {
      const purpose = clean(raw.purpose, 60);
      if (!purpose) throw new OrderError('어디에 쓰실 사진인지 적어 주세요', 400, 'PURPOSE');
      items.push({ file, purpose, qty, unit: KINDS.id.unit });
      itemAmount += KINDS.id.unit * qty;
    } else {
      const sz = KINDS.photo.sizes[String(raw.size || '')];
      if (!sz) throw new OrderError('사이즈를 확인해 주세요', 400, 'SIZE');
      items.push({ file, size: String(raw.size), sizeLabel: sz.label, qty, unit: sz.price });
      itemAmount += sz.price * qty;
      if (sz.big) hasBig = true;
    }
    count += qty;
  }
  if (delivery === 'mail' && kind === 'photo') {
    if (hasBig) throw new OrderError('대형 인화는 매장 수령만 가능합니다', 400, 'MAIL_BIG');
    if (count < KINDS.photo.mailMin) throw new OrderError(KINDS.photo.mailMin + '매 이상부터 우편 발송이 가능합니다', 400, 'MAIL_MIN');
  }
  const postFee = delivery === 'mail' ? POST_FEE : 0;
  const amount = itemAmount + postFee;
  if (amount < 1000) throw new OrderError('결제 금액이 너무 작습니다', 400, 'AMOUNT');

  let summary;
  if (kind === 'id') summary = '증명 ' + items.length + '종 ' + count + '매';
  else {
    const bySize = {};
    for (const it of items) bySize[it.sizeLabel] = (bySize[it.sizeLabel] || 0) + it.qty;
    summary = Object.keys(bySize).map(k => k + ' ' + bySize[k] + '매').join(' · ');
  }
  return { kind, name, phone: phoneRaw, phoneDigits, delivery, addr1, addr2, items, count, itemAmount, postFee, amount, summary };
}

function clean(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }

export function deliveryLabel(d) { return d === 'mail' ? '우편' : '매장수령'; }

// ── 주문번호 MS-YYMMDD-XXXX (토스 orderId 규격: 6~64자 [A-Za-z0-9_-]) ──
export function newOrderId(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const ymd = String(kst.getUTCFullYear()).slice(2) + p2(kst.getUTCMonth() + 1) + p2(kst.getUTCDate());
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 혼동 글자(I·O·0·1) 제외
  const r = crypto.getRandomValues(new Uint8Array(4));
  let s = '';
  for (let i = 0; i < 4; i++) s += A[r[i] % A.length];
  return 'MS-' + ymd + '-' + s;
}
function p2(n) { return String(n).padStart(2, '0'); }

export function kstStamp(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return k.getUTCFullYear() + '-' + p2(k.getUTCMonth() + 1) + '-' + p2(k.getUTCDate()) + ' ' + p2(k.getUTCHours()) + ':' + p2(k.getUTCMinutes()) + ' KST';
}

// ── 주문 토큰 (서버 저장 0 대신 서명으로 금액 정본 보존) ───────────────
// token = base64url(JSON) . hex(HMAC-SHA256(secret, JSON))
const enc = new TextEncoder();
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode('studio-order:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signOrder(secret, payload) {
  const body = JSON.stringify(payload);
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return b64url(enc.encode(body)) + '.' + hex(sig);
}
export async function verifyOrder(secret, token) {
  if (typeof token !== 'string' || token.indexOf('.') < 0) return null;
  const [b, sig] = token.split('.');
  let body;
  try { body = new TextDecoder().decode(b64urlDecode(b)); } catch { return null; }
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), hexDecode(sig), enc.encode(body));
  if (!ok) return null;
  try { return JSON.parse(body); } catch { return null; }
}
function b64url(bytes) { return btoa(String.fromCharCode.apply(null, bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64urlDecode(s) { const t = s.replace(/-/g, '+').replace(/_/g, '/'); const bin = atob(t + '='.repeat((4 - t.length % 4) % 4)); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
function hex(buf) { return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
function hexDecode(h) { if (!/^[0-9a-f]+$/i.test(h || '') || h.length % 2) return new Uint8Array(0); const out = new Uint8Array(h.length / 2); for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16); return out; }

// ── base64 (첨부용). 32KB 단위로 끊어 호출 스택 보호 ───────────────────
export function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  const CH = 0x8000;
  let bin = '';
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
}

// ── 파일 시그니처 (확장자만 믿지 않는다) ────────────────────────────────
export function sniffImage(bytes, name) {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return 'heic';   // ....ftyp
  // 일부 기기는 확장자만 바뀐 사진을 보낸다 — 시그니처가 셋 다 아니면 거부
  void name;
  return null;
}

// ── Resend 발송 (mailer.js 규칙 이식: 실패는 throw, 메시지 id 없으면 실패) ──
export async function sendMail(env, { to, subject, text, html, replyTo, attachments }) {
  const key = env.RESEND_API_KEY;
  if (!key) throw new OrderError('RESEND_API_KEY 미설정 — 메일 발송 불가', 500, 'MAIL_CONFIG');
  const payload = { from: env.STUDIO_MAIL_FROM || MAIL_FROM_DEFAULT, to: [].concat(to), subject };
  if (text) payload.text = text;
  if (html) payload.html = html;
  if (replyTo) payload.reply_to = replyTo;
  if (attachments && attachments.length) payload.attachments = attachments;
  let res;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new OrderError('메일 발송 실패(네트워크): ' + err.message, 502, 'MAIL_NETWORK');
  }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const detail = data && (data.message || data.error) ? (data.message || data.error) : ('HTTP ' + res.status);
    throw new OrderError('메일 발송 거부: ' + detail, 502, 'MAIL_REJECTED');
  }
  if (!data || !data.id) throw new OrderError('메일 발송 응답에 id 없음 — 발송 미보장', 502, 'MAIL_NO_ID');
  return data.id;
}

export function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// 주문서 본문 (평문·HTML 쌍). 모든 메일에 전체를 반복한다 (나눠 보낼 때도).
export function orderBody(order, orderId, extra) {
  const lines = [];
  lines.push('[몽크사진관 온라인 인화 주문] ' + orderId);
  lines.push('');
  lines.push('주문 종류: ' + KINDS[order.kind].label);
  lines.push('이름: ' + order.name);
  lines.push('연락처: ' + order.phone);
  lines.push('받는 방법: ' + deliveryLabel(order.delivery) + (order.delivery === 'mail' ? ' — ' + order.addr1 + (order.addr2 ? ' ' + order.addr2 : '') : ''));
  lines.push('');
  lines.push('인화 항목:');
  order.items.forEach((it, i) => {
    lines.push('  ' + (i + 1) + '. ' + it.file + ' — ' + (order.kind === 'id' ? it.purpose : it.sizeLabel) + ' × ' + it.qty + '매 (' + won(it.unit * it.qty) + ')');
  });
  lines.push('');
  lines.push('인화 금액: ' + won(order.itemAmount));
  if (order.postFee) lines.push('우편요금: ' + won(order.postFee));
  lines.push('총 금액: ' + won(order.amount));
  if (extra && extra.length) { lines.push(''); extra.forEach(l => lines.push(l)); }
  lines.push('');
  lines.push('접수 시각: ' + kstStamp());
  const text = lines.join('\n');
  const html = '<pre style="font-family:Pretendard,Apple SD Gothic Neo,sans-serif;font-size:14px;line-height:1.6;white-space:pre-wrap">' + escapeHtml(text) + '</pre>';
  return { text, html };
}

// ── 같은 IP 10분 3건 (D1). 저장소 장애 시 경고 로그 후 통과 (주문을 막지 않는다) ──
export async function rateLimit(env, ip) {
  if (!env.DB || !ip) { console.warn('[studio-order] rate-limit 저장소 없음 — 미적용'); return true; }
  try {
    const now = Date.now();
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS studio_order_rate (ip TEXT NOT NULL, ts INTEGER NOT NULL)').run();
    await env.DB.prepare('DELETE FROM studio_order_rate WHERE ts < ?').bind(now - 10 * 60 * 1000).run();
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM studio_order_rate WHERE ip = ?').bind(ip).first();
    if (row && Number(row.n) >= 3) return false;
    await env.DB.prepare('INSERT INTO studio_order_rate (ip, ts) VALUES (?, ?)').bind(ip, now).run();
    return true;
  } catch (err) {
    console.warn('[studio-order] rate-limit 저장소 오류 — 미적용: ' + err.message);
    return true;
  }
}
