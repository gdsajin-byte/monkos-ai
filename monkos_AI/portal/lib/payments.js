/** 담당: 막내2 (리파인) */

import { usersCollection, firestore, log, logTransaction, parseJsonBody, parseRawBody, createHmac, randomBytes, directTokens, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID, LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET, LEMONSQUEEZY_STORE_ID, TOSS_SECRET_KEY, VARIANT_CREDITS, TOSS_AMOUNT_CREDITS, PRODUCTS } from './shared/config.js';

/**
 * POST /api/checkout — Lemon Squeezy 체크아웃 URL 생성
 */
export async function handleCheckout(req, res) {
  try {
    const { variantId, userId, email, redirectUrl } = await parseJsonBody(req);
    if (!variantId || !userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'variantId, userId 필수' }));
      return;
    }

    // LS 체크아웃 생성
    const attributes = {
      checkout_options: { locale: 'ja' },
      checkout_data: {
        billing_address: { country: 'JP' },
        custom: { user_id: userId },
        email: email || undefined,
      },
    };
    if (redirectUrl) {
      attributes.product_options = { redirect_url: redirectUrl };
    }

    const checkoutRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes,
          relationships: {
            store: { data: { type: 'stores', id: LEMONSQUEEZY_STORE_ID } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    });

    const checkoutData = await checkoutRes.json();

    if (!checkoutRes.ok) {
      log(`[Checkout] 에러: ${JSON.stringify(checkoutData)}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '체크아웃 생성 실패' }));
      return;
    }

    const checkoutUrl = checkoutData.data?.attributes?.url;
    log(`[Checkout] 생성: ${userId} → variant ${variantId}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url: checkoutUrl }));
  } catch (err) {
    log(`[Checkout] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/webhooks/lemonsqueezy — Lemon Squeezy 웹훅
 * HMAC 서명 검증을 위해 raw body 사용
 */
export async function handleLemonSqueezyWebhook(req, res) {
  try {
    const body = await parseRawBody(req);

    // 서명 검증
    const signature = req.headers['x-signature'];
    if (LEMONSQUEEZY_WEBHOOK_SECRET && signature) {
      const hmac = createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
      hmac.update(body);
      const digest = hmac.digest('hex');
      if (digest !== signature) {
        log('[Webhook] 서명 검증 실패');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '서명 불일치' }));
        return;
      }
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta?.event_name;
    log(`[Webhook] 이벤트: ${eventName}`);

    // 주문 완료 → 크레딧 지급
    if (eventName === 'order_created') {
      const attrs = payload.data?.attributes;
      const userId = payload.meta?.custom_data?.user_id;
      const variantId = attrs?.first_order_item?.variant_id?.toString();
      const credits = VARIANT_CREDITS[variantId] || 0;

      if (!userId || credits === 0) {
        log(`[Webhook] 크레딧 지급 불가: userId=${userId}, variantId=${variantId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, action: 'skipped' }));
        return;
      }

      // Firestore 크레딧 추가
      const userRef = usersCollection.doc(userId);
      const newBalance = await firestore.runTransaction(async (tx) => {
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists) {
          log(`[Webhook] 사용자 없음: ${userId}`);
          return null;
        }
        const current = userDoc.data()?.credits ?? 0;
        const updated = current + credits;
        tx.update(userRef, {
          credits: updated,
          lastPurchase: new Date().toISOString(),
        });
        return updated;
      });

      log(`[Webhook] 크레딧 지급: ${userId} +${credits}c (variant ${variantId}, $${attrs?.total_formatted || '?'})`);
      if (newBalance !== null) {
        logTransaction({ userId, amount: credits, type: 'charge', provider: 'lemon', balanceAfter: newBalance, description: `Lemon 결제 (+${credits}c)`, referenceId: variantId, metadata: { total: attrs?.total_formatted } });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: 'credits_added', credits }));
      return;
    }

    // 환불 → 크레딧 회수
    if (eventName === 'order_refunded') {
      const userId = payload.meta?.custom_data?.user_id;
      const variantId = payload.data?.attributes?.first_order_item?.variant_id?.toString();
      const credits = VARIANT_CREDITS[variantId] || 0;

      if (userId && credits > 0) {
        const userRef = usersCollection.doc(userId);
        const newBalance = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) return null;
          const current = userDoc.data()?.credits ?? 0;
          const updated = Math.max(0, current - credits);
          tx.update(userRef, { credits: updated });
          return updated;
        });
        log(`[Webhook] 환불 크레딧 회수: ${userId} -${credits}c`);
        if (newBalance !== null) {
          logTransaction({ userId, amount: -credits, type: 'refund', provider: 'lemon', balanceAfter: newBalance, description: `Lemon 환불 (-${credits}c)`, referenceId: variantId });
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: 'credits_revoked' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    log(`[Webhook] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/payments/toss/confirm — 토스페이먼츠 결제 확인 (KR 전용)
 */
export async function handleTossConfirm(req, res) {
  try {
    const { paymentKey, orderId, amount, userId } = await parseJsonBody(req);
    if (!paymentKey || !orderId || !amount || !userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'paymentKey, orderId, amount, userId 필수' }));
      return;
    }

    // v3: PRODUCTS에서 상품 검색 → 총 크레딧(base + bonus) 적립
    const product = Object.values(PRODUCTS).find(p => p.price === amount);
    let credits = product ? product.credits + product.bonus : null;

    // 맞춤 충전: 패키지 매핑에 없으면 정가(₩145/c) 기준 10c 배수 검증
    if (!credits) {
      const customCredits = amount / 145;
      if (customCredits >= 10 && Number.isInteger(customCredits) && customCredits % 10 === 0) {
        credits = customCredits;
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `유효하지 않은 결제 금액: ${amount} (패키지 또는 ₩145 × 10c 배수만 가능)` }));
        return;
      }
    }

    // 토스 API로 결제 승인
    const secretKey = TOSS_SECRET_KEY;
    const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      log(`[Toss] 결제 승인 실패: ${tossData.code} - ${tossData.message}`, 'ERROR', { userId, amount, orderId });
      if (TEAM_CHAT_ID) {
        sendTelegramMessage(TEAM_CHAT_ID, `🚨 *토스 결제 실패*\n코드: ${tossData.code}\n메시지: ${tossData.message}\n금액: ₩${amount}\nuserId: ${userId}\norderId: ${orderId}`, TELEGRAM_TEAM_API).catch(() => {});
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: tossData.message || '결제 승인 실패' }));
      return;
    }

    // Firestore 크레딧 추가
    const userRef = usersCollection.doc(userId);
    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('사용자 없음');
      const current = userDoc.data()?.credits ?? 0;
      const newCredits = current + credits;
      tx.update(userRef, {
        credits: newCredits,
        lastPurchase: new Date().toISOString(),
      });
      return newCredits;
    });

    log(`[Toss] 결제 완료: ${userId} +${credits}c (₩${amount}, orderId: ${orderId})`);

    // 결제 상세 Firestore payments 컬렉션 기록
    try {
      await firestore.collection('payments').add({
        type: 'toss_confirm',
        userId,
        orderId,
        amount,
        paymentKey,
        creditsAdded: credits,
        balanceAfter: result,
        createdAt: new Date().toISOString(),
      });
    } catch (logErr) {
      log(`[Toss] 결제 로그 저장 실패: ${logErr.message}`, 'WARNING');
    }

    logTransaction({ userId, amount: credits, type: 'charge', provider: 'toss', balanceAfter: result, description: `토스 결제 (+${credits}c, ₩${amount})`, referenceId: orderId, metadata: { paymentKey, amount, creditsBase: product?.credits, bonus: product?.bonus } });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      credits: result,
      creditsAdded: credits,
      orderId,
    }));
  } catch (err) {
    log(`[Toss] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    if (TEAM_CHAT_ID) {
      sendTelegramMessage(TEAM_CHAT_ID, `🚨 *토스 결제 서버 에러*\n${err.message}`, TELEGRAM_TEAM_API).catch(() => {});
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/payments/toss/direct — 비로그인 직접결제 (토스)
 */
export async function handleTossDirect(req, res) {
  try {
    const { paymentKey, orderId, amount } = await parseJsonBody(req);
    if (!paymentKey || !orderId || !amount) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'paymentKey, orderId, amount 필수' }));
      return;
    }

    // 토스 API 결제 승인
    const secretKey = TOSS_SECRET_KEY;
    const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      log(`[Toss-Direct] 결제 승인 실패: ${tossData.code} - ${tossData.message}`, 'ERROR', { amount, orderId });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: tossData.message || '결제 승인 실패' }));
      return;
    }

    // 일회용 다운로드 토큰 생성
    const downloadToken = randomBytes(32).toString('hex');
    directTokens.set(downloadToken, { created: Date.now(), orderId, amount });

    // 결제 기록 로깅 (Firestore payments/ 컬렉션)
    try {
      await firestore.collection('payments').add({
        type: 'direct',
        orderId,
        amount,
        paymentKey,
        downloadToken,
        createdAt: new Date().toISOString(),
      });
    } catch (logErr) {
      log(`[Toss-Direct] 결제 로그 저장 실패: ${logErr.message}`, 'WARNING');
    }

    log(`[Toss-Direct] 결제 완료: orderId=${orderId}, ₩${amount} → token 발급`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, downloadToken }));
  } catch (err) {
    log(`[Toss-Direct] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/download/direct — 비로그인 직접결제 다운로드 검증
 */
export async function handleDownloadDirect(req, res) {
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const token = urlParams.searchParams.get('token');

  if (!token) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '토큰 필수' }));
    return;
  }

  const tokenData = directTokens.get(token);
  if (!tokenData) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '만료된 토큰' }));
    return;
  }

  // 토큰 삭제 (1회용)
  directTokens.delete(token);
  log(`[Direct-Download] 토큰 사용: orderId=${tokenData.orderId}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}

/**
 * GET /toss-success — 토스 결제 성공 리다이렉트 (프론트에서 confirm 처리)
 */
export async function handleTossSuccess(req, res) {
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const esc = (s) => (s || '').replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c]));
  const paymentKey = esc(params.get('paymentKey'));
  const orderId = esc(params.get('orderId'));
  const amount = parseInt(params.get('amount')) || 0;
  const userId = esc(params.get('userId'));

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>결제 확인 중...</title>
<style>body{background:#0a0a1a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:40px}.spinner{width:40px;height:40px;border:3px solid rgba(167,139,250,0.2);border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 20px}
@keyframes spin{to{transform:rotate(360deg)}}.msg{font-size:1.1rem;margin-bottom:8px}.sub{color:#8892a8;font-size:0.85rem}
.ok{color:#34d399;font-size:1.2rem}.err{color:#f87171;font-size:1rem}</style></head>
<body><div class="box" id="box"><div class="spinner"></div><div class="msg">결제 확인 중...</div><div class="sub">잠시만 기다려 주세요</div></div>
<script>
(async()=>{
  const box=document.getElementById('box');
  try{
    const res=await fetch('/api/payments/toss/confirm',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({paymentKey:'${paymentKey}',orderId:'${orderId}',amount:${amount},userId:'${userId}'})});
    const data=await res.json();
    if(data.success){
      box.innerHTML='<div class="ok">\\u2705 결제 완료!</div><div class="msg" style="margin-top:12px">'+data.creditsAdded+' 크레딧이 추가되었습니다</div><div class="sub">현재 잔액: '+data.credits+'c</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div>';
    }else{
      box.innerHTML='<div class="err">결제 확인 실패</div><div class="sub" style="margin-top:8px">'+(data.error||'알 수 없는 오류')+'</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div>';
    }
  }catch(e){
    box.innerHTML='<div class="err">네트워크 오류</div><div class="sub" style="margin-top:8px">'+e.message+'</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div>';
  }
})();
</script></body></html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * GET /toss-fail — 토스 결제 실패 리다이렉트
 */
export async function handleTossFail(req, res) {
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const escFail = (s) => (s || '').replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c]));
  const message = escFail(params.get('message')) || '결제가 취소되었습니다';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>결제 실패</title>
<style>body{background:#0a0a1a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:40px}.err{color:#f87171;font-size:1.2rem;margin-bottom:12px}.sub{color:#8892a8;font-size:0.85rem}</style></head>
<body><div class="box"><div class="err">결제 실패</div><div class="sub">${message}</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div></div></body></html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}
