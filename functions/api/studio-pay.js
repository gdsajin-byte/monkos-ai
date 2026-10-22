// POST /api/studio-pay — 토스 결제 승인 + 꾸에게 [결제완료] 메일
// 요청: JSON { paymentKey, orderId, amount, token }
//   token = /api/studio-order 응답의 서명 토큰 (금액 정본). 없으면 토스 금액만 믿되 메일 제목에 [금액확인] 표기
// 응답: { ok, orderId, amount, method, approvedAt, receiptUrl, duplicated?, notified }
import { OrderError, json, verifyOrder, sendMail, deliveryLabel, won, kstStamp, ORDER_TO_DEFAULT, KINDS } from './_lib/studio-order.js';

export async function onRequestPost({ request, env }) {
  const t0 = Date.now();
  let orderId = '-';
  try {
    if (!env.TOSS_SECRET_KEY) throw new OrderError('결제 설정이 아직 준비되지 않았습니다', 500, 'TOSS_CONFIG');
    let body;
    try { body = await request.json(); } catch { throw new OrderError('요청을 읽을 수 없습니다', 400, 'JSON'); }
    const paymentKey = String(body.paymentKey || '').trim();
    orderId = String(body.orderId || '').trim();
    if (!paymentKey || !/^MS-\d{6}-[A-Z2-9]{4}$/.test(orderId)) throw new OrderError('paymentKey·orderId가 올바르지 않습니다', 400, 'PARAMS');

    // 주문 토큰 대조 — 있으면 토큰 금액이 정본
    let meta = null;
    if (body.token) {
      meta = await verifyOrder(env.TOSS_SECRET_KEY, String(body.token));
      if (!meta || meta.orderId !== orderId) throw new OrderError('주문 정보가 일치하지 않습니다', 400, 'TOKEN');
      if (Number(meta.exp) < Date.now()) throw new OrderError('주문 유효 시간(2시간)이 지났습니다. 다시 주문해 주세요', 400, 'TOKEN_EXPIRED');
    }
    const clientAmount = Number(body.amount);
    if (meta && Number.isFinite(clientAmount) && clientAmount !== meta.amount) {
      console.error('[studio-pay] ' + orderId + ' 금액 불일치 client=' + clientAmount + ' token=' + meta.amount);
      throw new OrderError('결제 금액이 일치하지 않습니다', 400, 'AMOUNT_MISMATCH');
    }
    const amount = meta ? meta.amount : clientAmount;
    if (!Number.isInteger(amount) || amount < 1000) throw new OrderError('결제 금액이 올바르지 않습니다', 400, 'AMOUNT');

    // 토스 승인 (payments.js handleTossDirect 이식)
    const auth = 'Basic ' + btoa(env.TOSS_SECRET_KEY + ':');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const toss = await tossRes.json().catch(() => ({}));
    if (!tossRes.ok) {
      // 같은 승인 요청이 두 번 오면(새로고침) 토스가 ALREADY_PROCESSED_PAYMENT를 준다 — 이미 끝난 결제, 메일 재발송 없음
      if (toss.code === 'ALREADY_PROCESSED_PAYMENT') {
        console.log('[studio-pay] ' + orderId + ' duplicated confirm');
        return json({ ok: true, duplicated: true, orderId, amount, notified: true });
      }
      console.error('[studio-pay] ' + orderId + ' 승인 실패 ' + toss.code + ': ' + toss.message);
      throw new OrderError(toss.message || '결제 승인에 실패했습니다', 400, toss.code || 'CONFIRM_FAILED');
    }
    if (typeof toss.totalAmount === 'number' && toss.totalAmount !== amount) {
      // 승인은 됐는데 금액이 다르다 — 있을 수 없는 경우. 돈은 받았으니 실패로 돌리지 말고 메일에 크게 적는다
      console.error('[studio-pay] ' + orderId + ' 승인 금액 불일치 toss=' + toss.totalAmount + ' server=' + amount);
    }

    const method = toss.method || '';
    const approvedAt = toss.approvedAt || new Date().toISOString();
    const receiptUrl = toss.receipt && toss.receipt.url ? toss.receipt.url : '';

    // [결제완료] 메일 — 꾸는 이 제목만 보고 바로 인화한다 (10-03 꾸 동의)
    const to = env.STUDIO_ORDER_TO || ORDER_TO_DEFAULT;
    const who = meta ? meta.name : '(이름 미상)';
    const summary = meta ? meta.summary : '(주문 요약 없음)';
    const deliv = meta ? deliveryLabel(meta.delivery) : '';
    const flag = meta ? '' : '[금액확인]';
    const mismatch = (typeof toss.totalAmount === 'number' && toss.totalAmount !== amount) ? '[금액불일치]' : '';
    const subject = '[결제완료]' + flag + mismatch + ' ' + orderId + ' ' + who + ' · ' + summary + (deliv ? ' · ' + deliv : '') + ' · ' + won(toss.totalAmount || amount);
    const lines = [
      '[몽크사진관 온라인 인화 주문 — 결제 완료] ' + orderId,
      '',
      '이름: ' + who,
      '연락처: ' + (meta ? meta.phone : '(토스 결제 내역에서 확인)'),
      '주문: ' + (meta ? KINDS[meta.kind].label + ' · ' : '') + summary + (deliv ? ' · ' + deliv : ''),
      '결제 금액: ' + won(toss.totalAmount || amount) + (mismatch ? '  ⚠️ 주문 금액 ' + won(amount) + '와 다릅니다 — 토스 콘솔에서 확인' : ''),
      '결제 수단: ' + method,
      '승인 시각: ' + approvedAt,
      receiptUrl ? '영수증: ' + receiptUrl : '',
      '',
      '사진은 같은 주문번호의 "[미결제][인화주문] ' + orderId + '" 메일에 첨부돼 있습니다.',
      flag ? '⚠️ 주문 토큰 없이 승인된 결제입니다. 금액과 사진 메일을 대조한 뒤 인화해 주세요.' : '',
      '',
      '기록 시각: ' + kstStamp(),
    ].filter(l => l !== '');
    let notified = false;
    for (let attempt = 1; attempt <= 2 && !notified; attempt++) {
      try { await sendMail(env, { to, subject, text: lines.join('\n') }); notified = true; }
      catch (err) { console.error('[studio-pay] ' + orderId + ' 결제완료 메일 실패(' + attempt + '/2): ' + err.message); }
    }
    if (!notified) console.error('[studio-pay] ' + orderId + ' ⚠️ 결제는 승인됐으나 알림 메일 미발송 — 토스 콘솔 대조 필요');

    console.log('[studio-pay] ' + orderId + ' paid amount=' + amount + ' method=' + method + ' notified=' + notified + ' ' + (Date.now() - t0) + 'ms');
    return json({ ok: true, orderId, amount: toss.totalAmount || amount, method, approvedAt, receiptUrl, notified });
  } catch (err) {
    const status = err instanceof OrderError ? err.status : 500;
    const code = err instanceof OrderError ? err.code : 'INTERNAL';
    console.error('[studio-pay] ' + orderId + ' fail ' + code + ' ' + err.message + ' ' + (Date.now() - t0) + 'ms');
    const msg = status >= 500 && !(err instanceof OrderError) ? '결제 확인 중 문제가 생겼습니다. 사진관(031-791-5030)으로 연락해 주세요' : err.message;
    return json({ ok: false, error: msg, code }, status);
  }
}

export function onRequest({ request }) {
  if (request.method === 'POST') return undefined;
  return json({ ok: false, error: 'POST only' }, 405);
}
