// POST /api/studio-order — 몽크사진관 인화 주문 접수 (사진 → 꾸 메일, 서버 저장 0) + 토스 결제 준비
// 요청: multipart/form-data
//   order  : JSON { kind, name, phone, delivery, addr1, addr2, items:[{file, purpose|size, qty}] }
//   website: 봇 함정 (비어 있어야 한다)
//   photos : 파일 1~10장
// 응답: { ok, orderId, orderName, amount, clientKey, token }  — token은 /api/studio-pay에 되돌려 보낸다
import {
  OrderError, json, validateOrder, newOrderId, signOrder, toBase64, sniffImage, sendMail, orderBody,
  rateLimit, deliveryLabel, won, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAIL_CHUNK_BYTES, TOKEN_TTL_MS, ORDER_TO_DEFAULT, KINDS,
} from './_lib/studio-order.js';

export async function onRequestPost({ request, env }) {
  const t0 = Date.now();
  let orderId = '-';
  try {
    if (!env.TOSS_CLIENT_KEY || !env.TOSS_SECRET_KEY) throw new OrderError('결제 설정이 아직 준비되지 않았습니다', 500, 'TOSS_CONFIG');
    if (!env.RESEND_API_KEY) throw new OrderError('주문 접수 설정이 아직 준비되지 않았습니다', 500, 'MAIL_CONFIG');

    const ct = request.headers.get('Content-Type') || '';
    if (!/multipart\/form-data/i.test(ct)) throw new OrderError('요청 형식이 올바르지 않습니다', 400, 'CONTENT_TYPE');
    const form = await request.formData();

    // 봇 함정 — 채워져 있으면 조용히 성공처럼 답하고 아무것도 보내지 않는다 (사람 손님은 이 칸을 볼 수 없다)
    if (String(form.get('website') || '').trim()) {
      console.log('[studio-order] honeypot hit');
      return json({ ok: true, silent: true, orderId: newOrderId() });
    }

    let raw;
    try { raw = JSON.parse(String(form.get('order') || '')); } catch { throw new OrderError('주문 내용을 읽을 수 없습니다', 400, 'ORDER_JSON'); }

    // 사진 — 장수·용량·형식을 서버에서 다시 검사
    const files = form.getAll('photos').filter(f => f && typeof f === 'object' && typeof f.arrayBuffer === 'function');
    if (files.length === 0) throw new OrderError('사진을 올려 주세요', 400, 'PHOTOS');
    if (files.length > MAX_FILES) throw new OrderError('사진은 한 번에 ' + MAX_FILES + '장까지 올릴 수 있습니다', 400, 'TOO_MANY');
    let total = 0;
    const photos = [];
    const seen = new Set();
    for (const f of files) {
      const name = String(f.name || 'photo').replace(/[\\\/\u0000-\u001f]/g, '_').slice(0, 150);
      if (seen.has(name)) throw new OrderError('같은 이름의 사진이 두 번 올라왔습니다: ' + name, 400, 'DUP_NAME');
      seen.add(name);
      if (f.size > MAX_FILE_BYTES) throw new OrderError(name + ' — 한 장이 20MB를 넘습니다', 400, 'FILE_TOO_BIG');
      total += f.size;
      if (total > MAX_TOTAL_BYTES) throw new OrderError('사진 용량 합계가 20MB를 넘습니다', 400, 'TOTAL_TOO_BIG');
      const buf = await f.arrayBuffer();
      const kind = sniffImage(new Uint8Array(buf, 0, Math.min(16, buf.byteLength)), name);
      if (!kind) throw new OrderError(name + ' — 사진 파일(JPG·PNG·HEIC)이 아닙니다', 400, 'NOT_IMAGE');
      photos.push({ name, size: f.size, buf });
    }

    const order = validateOrder(raw, photos.map(p => p.name));

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!(await rateLimit(env, ip))) throw new OrderError('주문이 잠시 몰렸습니다. 잠시 후 다시 눌러 주세요', 429, 'RATE_LIMIT');

    orderId = newOrderId();
    const to = env.STUDIO_ORDER_TO || ORDER_TO_DEFAULT;
    const subjectCore = '[인화주문] ' + orderId + ' ' + order.name + ' · ' + order.summary + ' · ' + deliveryLabel(order.delivery) + ' · ' + won(order.amount);

    // 메일 나누기 — 원본 합계 10MB 단위. 큰 한 장은 단독 1통
    const groups = [];
    let cur = [], curBytes = 0;
    for (const p of photos) {
      if (cur.length && curBytes + p.size > MAIL_CHUNK_BYTES) { groups.push(cur); cur = []; curBytes = 0; }
      cur.push(p); curBytes += p.size;
    }
    if (cur.length) groups.push(cur);

    const body = orderBody(order, orderId, [
      '결제 상태: 미결제 — 결제가 끝나면 "[결제완료] ' + orderId + '" 메일이 따로 옵니다. 그 메일을 보고 인화해 주세요.',
      '사진 ' + photos.length + '장 (' + (total / 1024 / 1024).toFixed(1) + 'MB)' + (groups.length > 1 ? ' — 메일 ' + groups.length + '통으로 나눠 보냄' : ''),
    ]);

    const ids = [];
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const part = groups.length > 1 ? ' (' + (gi + 1) + '/' + groups.length + ')' : '';
      try {
        const id = await sendMail(env, {
          to,
          subject: '[미결제]' + subjectCore + part,
          text: body.text, html: body.html,
          attachments: g.map(p => ({ filename: p.name, content: toBase64(p.buf) })),
        });
        ids.push(id);
      } catch (err) {
        // 일부만 실패해도 실패다. 꾸에게는 '(일부 실패)' 표시 메일 1통 (best-effort)
        console.error('[studio-order] ' + orderId + ' mail ' + (gi + 1) + '/' + groups.length + ' 실패: ' + (err.code || '') + ' ' + err.message);
        if (ids.length) {
          try { await sendMail(env, { to, subject: '[일부 실패]' + subjectCore, text: '사진 메일 ' + groups.length + '통 중 ' + ids.length + '통만 전달됐습니다. 손님에게는 실패로 안내했고 다시 주문할 수 있습니다.\n\n' + body.text }); } catch {}
        }
        throw err;
      }
    }

    // 주문 토큰 — 결제 승인 때 금액 정본으로 쓴다 (서버 저장 0)
    const exp = Date.now() + TOKEN_TTL_MS;
    const token = await signOrder(env.TOSS_SECRET_KEY, {
      v: 1, orderId, amount: order.amount, kind: order.kind, name: order.name, phone: order.phone,
      summary: order.summary, delivery: order.delivery, count: order.count, exp,
    });
    const orderName = KINDS[order.kind].label + ' ' + order.summary;

    console.log('[studio-order] ' + orderId + ' ok photos=' + photos.length + ' bytes=' + total + ' mails=' + ids.length + ' amount=' + order.amount + ' ' + (Date.now() - t0) + 'ms');
    return json({ ok: true, orderId, orderName: orderName.slice(0, 100), amount: order.amount, clientKey: env.TOSS_CLIENT_KEY, token, mails: ids.length });
  } catch (err) {
    const status = err instanceof OrderError ? err.status : 500;
    const code = err instanceof OrderError ? err.code : 'INTERNAL';
    console.error('[studio-order] ' + orderId + ' fail ' + code + ' ' + err.message + ' ' + (Date.now() - t0) + 'ms');
    const msg = status >= 500 && !(err instanceof OrderError) ? '주문이 접수되지 않았습니다. 다시 눌러 주시거나 톡톡·전화로 주문해 주세요' : err.message;
    return json({ ok: false, error: msg, code }, status);
  }
}

export function onRequest({ request }) {
  if (request.method === 'POST') return undefined; // onRequestPost로
  return json({ ok: false, error: 'POST only' }, 405);
}
