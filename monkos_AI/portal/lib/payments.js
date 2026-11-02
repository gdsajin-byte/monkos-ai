/** 담당: 막내2 (리파인) */

import { isDevService } from './shared/env-tag.js';
import { usersCollection, firestore, log, logTransaction, parseJsonBody, parseRawBody, createHmac, randomBytes, sendTelegramMessage, verifyAuthToken, TELEGRAM_TEAM_API, TEAM_CHAT_ID, LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET, LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_STORE_ID_JP, LEMON_JP_VARIANTS, LEMONSQUEEZY_VARIANT_SPECS_SINGLE, LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP, SINGLE_DOWNLOAD_VARIANTS, TOSS_SECRET_KEY, TOSS_CLIENT_KEY, VARIANT_CREDITS, TOSS_AMOUNT_CREDITS, PRODUCTS, DIRECT_PRICING, DIRECT_TOKEN_TTL_MS, DIRECT_TOKEN_MAX_GENERATES, parseCookies } from './shared/config.js';
import { trackEvent } from './tracking.js';

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
      checkout_options: {},
      checkout_data: {
        custom: { user_id: userId },
        email: email || undefined,
      },
    };
    if (redirectUrl) {
      attributes.product_options = { redirect_url: redirectUrl };
    }

    // store는 variant 실소속과 일치 필수 — 불일치 서명 링크는 실브라우저에서 404 (config.js LEMON_JP_VARIANTS)
    const storeId = LEMON_JP_VARIANTS.has(String(variantId)) ? LEMONSQUEEZY_STORE_ID_JP : LEMONSQUEEZY_STORE_ID;

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
            store: { data: { type: 'stores', id: storeId } },
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
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * POST /api/webhooks/lemonsqueezy — Lemon Squeezy 웹훅
 * HMAC 서명 검증을 위해 raw body 사용
 */
export async function handleLemonSqueezyWebhook(req, res) {
  try {
    const body = await parseRawBody(req);

    // 서명 검증 필수 — 글로벌/JP 듀얼 시크릿
    // [보안 P0] 무서명 요청은 무조건 거부. if(signature) 가드로 검증을 스킵하면
    // 위조 order_created로 무결제 토큰/크레딧 발급이 가능하므로 fail-closed.
    const signature = req.headers['x-signature'];
    if (!signature || typeof signature !== 'string') {
      log('[Webhook] x-signature 헤더 부재 — 무서명 요청 거부', 'WARNING');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '서명 필수' }));
      return;
    }

    const secrets = [
      LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL,
      LEMONSQUEEZY_WEBHOOK_SECRET,
    ].filter(Boolean);

    if (secrets.length === 0) {
      // 시크릿 미설정 = 검증 불가 → 전부 거부 (묵인 처리 금지)
      log('[Webhook] 웹훅 시크릿 미설정 — 검증 불가로 거부 (fail-closed)', 'ERROR');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '서명 검증 불가' }));
      return;
    }

    const verified = secrets.some(secret => {
      const hmac = createHmac('sha256', secret);
      hmac.update(body);
      return hmac.digest('hex') === signature;
    });

    if (!verified) {
      log('[Webhook] 서명 검증 실패 (글로벌/JP 모두 불일치)');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '서명 불일치' }));
      return;
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta?.event_name;
    log(`[Webhook] 이벤트: ${eventName}`);

    // 주문 완료 → 크레딧 지급
    if (eventName === 'order_created') {
      const attrs = payload.data?.attributes;
      const userId = payload.meta?.custom_data?.user_id;
      const variantId = attrs?.first_order_item?.variant_id?.toString();

      // specs 단건 $2 variant → 크레딧 대신 다운로드 토큰 발급 (env 미설정 시 분기 자체 비활성)
      if (variantId && SINGLE_DOWNLOAD_VARIANTS.has(variantId)) {
        const lemonOrderId = payload.data?.id?.toString() || null;
        const orderRef = payload.meta?.custom_data?.order_ref || null;

        // 멱등: 레몬 웹훅 재전송 시 토큰 이중 발급 차단 (lemon order id 기준)
        if (lemonOrderId) {
          const dup = await firestore.collection('payments')
            .where('lemonOrderId', '==', lemonOrderId)
            .where('type', '==', 'direct')
            .limit(1).get();
          if (!dup.empty) {
            log(`[Webhook] 단건 중복 수신 무시: lemonOrderId=${lemonOrderId}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true, action: 'duplicate' }));
            return;
          }
        }

        // 주문 문서에서 slug·시장 회수 (init 경유 주문)
        let order = null;
        if (orderRef) {
          try {
            const orderDoc = await firestore.collection('directOrders').doc(orderRef).get();
            if (orderDoc.exists) order = orderDoc.data();
          } catch (e) {
            log(`[Webhook] 단건 주문 조회 실패(진행): ${e.message}`, 'WARNING');
          }
        }
        const market = order?.market || (variantId === LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP ? 'jp' : 'global');

        const { token, expiresAt } = await issueDirectToken({
          orderId: orderRef, slug: order?.slug || null, market,
          amount: attrs?.total ?? null, currency: attrs?.currency || null, provider: 'lemon',
        });

        if (orderRef) {
          try {
            await firestore.collection('directOrders').doc(orderRef).update({
              status: 'paid', paymentToken: token, tokenExpiresAt: expiresAt,
              lemonOrderId, paidAt: new Date().toISOString(),
            });
          } catch (e) {
            log(`[Webhook] 단건 주문 상태 갱신 실패: ${e.message}`, 'WARNING');
          }
        }

        try {
          await firestore.collection('payments').add({
            type: 'direct',
            provider: 'lemon',
            lemonOrderId,
            orderId: orderRef,
            slug: order?.slug || null,
            market,
            amount: attrs?.total ?? null,
            currency: attrs?.currency || null,
            variantId,
            downloadToken: token,
            createdAt: new Date().toISOString(),
          });
        } catch (logErr) {
          log(`[Webhook] 단건 결제 로그 저장 실패: ${logErr.message}`, 'WARNING');
        }

        log(`[Webhook] 단건 토큰 발급: variant=${variantId}, orderRef=${orderRef}, market=${market}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, action: 'direct_token_issued' }));
        return;
      }

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
        trackEvent({
          eventName: 'credit_charge', userId,
          service: 'portal', params: { amount: credits, provider: 'lemon', variant_id: variantId, price: attrs?.total_formatted },
        }).catch(() => {});
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: 'credits_added', credits }));
      return;
    }

    // 환불 → 크레딧 회수
    if (eventName === 'order_refunded') {
      const userId = payload.meta?.custom_data?.user_id;
      const variantId = payload.data?.attributes?.first_order_item?.variant_id?.toString();

      // specs 단건 variant 환불 → 미사용 토큰 무효화 (이미 소모된 경우 로그만)
      if (variantId && SINGLE_DOWNLOAD_VARIANTS.has(variantId)) {
        const lemonOrderId = payload.data?.id?.toString() || null;
        let revoked = false;
        if (lemonOrderId) {
          const paySnap = await firestore.collection('payments')
            .where('lemonOrderId', '==', lemonOrderId)
            .where('type', '==', 'direct')
            .limit(1).get();
          const token = paySnap.empty ? null : paySnap.docs[0].data().downloadToken;
          if (token) {
            const tokenRef = firestore.collection('directTokens').doc(token);
            revoked = await firestore.runTransaction(async (tx) => {
              const doc = await tx.get(tokenRef);
              if (!doc.exists) return false;
              const d = doc.data();
              if (d.status !== 'active' || d.downloaded) return false; // 이미 소모 — 회수 불가
              tx.update(tokenRef, { status: 'revoked', revokedAt: new Date().toISOString() });
              return true;
            });
          }
        }
        log(`[Webhook] 단건 환불: lemonOrderId=${lemonOrderId}, 토큰 무효화=${revoked ? '완료' : '불가(미발급/이미 사용)'}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, action: revoked ? 'direct_token_revoked' : 'direct_token_already_used' }));
        return;
      }

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
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * POST /api/webhooks/toss — 토스페이먼츠 웹훅 (결제 취소 회수, 2026-07-06 F1)
 *
 * 페이로드 불신 원칙: body에서 paymentKey만 취하고, 토스 조회 API로 상태를 재검증한다.
 * (토스 웹훅은 서명이 없어 재조회가 유일한 위조 방어 — 시크릿 등록 불요)
 * CANCELED/PARTIAL_CANCELED 확인 시:
 *   ① toss_confirm(크레딧 충전) → 크레딧 회수 (0 하한, 부족분 팀 경보)
 *   ② direct(단건 ₩2,000) → 미소모 downloadToken revoke (이미 소모 시 팀 경보)
 * 멱등: payments 문서 cancelProcessed 플래그. 처리 불능 오류만 500(토스 재시도 유도).
 */
export async function handleTossWebhook(req, res) {
  let paymentKey = null;
  try {
    const body = await parseJsonBody(req);
    paymentKey = body?.data?.paymentKey || body?.paymentKey || null;
    if (!paymentKey || typeof paymentKey !== 'string') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: 'ignored_no_payment_key' }));
      return;
    }

    // 토스 조회 API 재검증 — 웹훅 페이로드의 상태는 신뢰하지 않는다
    const authHeader = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
    const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
      headers: { 'Authorization': authHeader },
    });
    if (!tossRes.ok) {
      log(`[Toss-Webhook] 조회 실패(${tossRes.status}) — 위조/오배송 무시: paymentKey=${paymentKey}`, 'WARNING');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: 'ignored_unverifiable' }));
      return;
    }
    const payment = await tossRes.json();
    const status = payment.status;
    if (status !== 'CANCELED' && status !== 'PARTIAL_CANCELED') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: `ignored_status_${status}` }));
      return;
    }

    // ① 크레딧 충전 취소 → 크레딧 회수
    const confirmSnap = await firestore.collection('payments')
      .where('paymentKey', '==', paymentKey)
      .where('type', '==', 'toss_confirm')
      .limit(1).get();
    if (!confirmSnap.empty) {
      const payRef = confirmSnap.docs[0].ref;
      const pay = confirmSnap.docs[0].data();

      if (status === 'PARTIAL_CANCELED') {
        // 크레딧 팩 부분 취소는 자동 회수 기준이 모호 — 수동 처리로 경보만
        log(`[Toss-Webhook] 충전 부분 취소 — 수동 처리 필요: orderId=${pay.orderId}, user=${pay.userId}`, 'WARNING');
        if (TEAM_CHAT_ID) {
          sendTelegramMessage(TEAM_CHAT_ID, `⚠️ *토스 충전 부분 취소 — 수동 회수 필요*\nuser: ${pay.userId}\norderId: ${pay.orderId}\n원충전: +${pay.creditsAdded}c (₩${pay.amount})\n→ credits.sh deduct로 비례 회수 판단 요망`, TELEGRAM_TEAM_API).catch(() => {});
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, action: 'partial_cancel_alerted' }));
        return;
      }

      const userRef = usersCollection.doc(pay.userId);
      const outcome = await firestore.runTransaction(async (tx) => {
        const payDoc = await tx.get(payRef);
        if (payDoc.data()?.cancelProcessed) return { duplicate: true };
        const userDoc = await tx.get(userRef);
        const revoke = Number(payDoc.data()?.creditsAdded) || 0;
        if (!userDoc.exists || revoke <= 0) {
          tx.update(payRef, { cancelProcessed: true, canceledAt: new Date().toISOString(), revokedCredits: 0 });
          return { noUser: true };
        }
        const current = userDoc.data()?.credits ?? 0;
        const deducted = Math.min(current, revoke);
        tx.update(userRef, { credits: current - deducted });
        tx.update(payRef, { cancelProcessed: true, canceledAt: new Date().toISOString(), revokedCredits: deducted });
        return { deducted, shortfall: revoke - deducted, balanceAfter: current - deducted };
      });

      if (outcome.duplicate) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, action: 'already_processed' }));
        return;
      }
      if (outcome.noUser) {
        log(`[Toss-Webhook] 취소 회수 불가(사용자/금액 없음): orderId=${pay.orderId}`, 'WARNING');
      } else {
        log(`[Toss-Webhook] 결제 취소 크레딧 회수: ${pay.userId} -${outcome.deducted}c (orderId=${pay.orderId})${outcome.shortfall > 0 ? ` — 부족분 ${outcome.shortfall}c (이미 소진)` : ''}`);
        logTransaction({ userId: pay.userId, amount: -outcome.deducted, type: 'refund', provider: 'toss', balanceAfter: outcome.balanceAfter, description: `토스 결제 취소 회수 (-${outcome.deducted}c)`, referenceId: pay.orderId, metadata: { paymentKey, shortfall: outcome.shortfall } });
      }
      if (TEAM_CHAT_ID) {
        sendTelegramMessage(TEAM_CHAT_ID, `↩️ *토스 결제 취소 처리*\nuser: ${pay.userId}\norderId: ${pay.orderId}\n회수: -${outcome.deducted ?? 0}c / 원충전 +${pay.creditsAdded}c (₩${pay.amount})${outcome.shortfall > 0 ? `\n⚠️ 부족분 ${outcome.shortfall}c — 이미 소진, 수동 판단 필요` : ''}`, TELEGRAM_TEAM_API).catch(() => {});
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: 'credits_revoked' }));
      return;
    }

    // ② 단건 직접결제 취소 → 토큰 revoke
    const directSnap = await firestore.collection('payments')
      .where('paymentKey', '==', paymentKey)
      .where('type', '==', 'direct')
      .limit(1).get();
    if (!directSnap.empty) {
      const payRef = directSnap.docs[0].ref;
      const pay = directSnap.docs[0].data();
      const token = pay.downloadToken || null;
      let revoked = false;
      if (token) {
        const tokenRef = firestore.collection('directTokens').doc(token);
        revoked = await firestore.runTransaction(async (tx) => {
          const doc = await tx.get(tokenRef);
          if (!doc.exists) return false;
          const d = doc.data();
          if (d.status !== 'active' || d.downloaded) return false; // 이미 소모 — 회수 불가
          tx.update(tokenRef, { status: 'revoked', revokedAt: new Date().toISOString() });
          return true;
        });
      }
      try { await payRef.update({ cancelProcessed: true, canceledAt: new Date().toISOString(), tokenRevoked: revoked }); } catch {}
      log(`[Toss-Webhook] 단건 취소: orderId=${pay.orderId}, 토큰 무효화=${revoked ? '완료' : '불가(미발급/이미 사용)'}`);
      if (TEAM_CHAT_ID && !revoked) {
        sendTelegramMessage(TEAM_CHAT_ID, `⚠️ *토스 단건 취소 — 토큰 이미 소모*\norderId: ${pay.orderId} (₩${pay.amount}, ${pay.slug || '?'})\n생성/다운로드 완료 후 취소된 건 — 수동 판단 필요`, TELEGRAM_TEAM_API).catch(() => {});
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true, action: revoked ? 'direct_token_revoked' : 'direct_token_already_used' }));
      return;
    }

    log(`[Toss-Webhook] 취소 수신했으나 매칭 결제 기록 없음: paymentKey=${paymentKey}, orderId=${payment.orderId || '?'}`, 'WARNING');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true, action: 'no_matching_payment' }));
  } catch (err) {
    log(`[Toss-Webhook] 에러: ${err.message}`, 'ERROR', { error: err.stack, paymentKey });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
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

    // 세션-계정 바인딩 (2026-07-06 F3): 결제 크레딧은 세션 본인 계정에만 적립
    const sessionCookies = parseCookies(req.headers.cookie);
    const session = sessionCookies.monkos_session ? verifyAuthToken(sessionCookies.monkos_session) : null;
    if (!session?.userId || session.userId !== userId) {
      log(`[Toss] confirm 거부: 세션(${session?.userId || '없음'}) ≠ 요청(${userId})`, 'WARNING');
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '본인 계정으로만 결제 확인 가능' }));
      return;
    }

    // 멱등성: 이미 처리된 orderId인지 확인
    const existingPayments = await firestore.collection('payments')
      .where('orderId', '==', orderId)
      .where('type', '==', 'toss_confirm')
      .limit(1).get();
    if (!existingPayments.empty) {
      const existing = existingPayments.docs[0].data();
      log(`[Toss] 중복 confirm 요청 — orderId=${orderId} 이미 처리됨`);
      const userDoc = await usersCollection.doc(userId).get();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        credits: userDoc.data()?.credits ?? existing.balanceAfter,
        creditsAdded: existing.creditsAdded,
        orderId,
      }));
      return;
    }

    // v3: PRODUCTS에서 상품 검색 → 총 크레딧(base + bonus) 적립
    const product = Object.values(PRODUCTS).find(p => p.price === amount);
    let credits = product ? product.credits + product.bonus : null;

    // 맞춤 충전: 패키지 매핑에 없으면 정가(₩150/c = 10c당 ₩1,500 = $1) 기준 10c 배수 검증 (2026-07-06 확정)
    if (!credits) {
      const customCredits = amount / 150;
      if (customCredits >= 10 && Number.isInteger(customCredits) && customCredits % 10 === 0) {
        credits = customCredits;
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `유효하지 않은 결제 금액: ${amount} (패키지 또는 ₩150 × 10c 배수만 가능)` }));
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
    const cookies = parseCookies(req.headers.cookie);
    trackEvent({
      eventName: 'credit_charge', userId, sessionId: cookies.monkos_sid || null,
      service: 'portal', params: { amount: credits, provider: 'toss', order_id: orderId, price: amount },
    }).catch(() => {});
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
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

// ============================================================
// specs 단건 직접결제 (T1) — 서버 머니패스
// 주문 정본: Firestore `directOrders` (doc id = orderId)
// 토큰 정본: Firestore `directTokens` (doc id = token, 1회성 소모 트랜잭션)
// ============================================================

const ORDER_ID_RE = /^SPECS-(kr|global|jp)-[a-z0-9]+-[a-f0-9]{8}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const TOKEN_RE = /^[a-f0-9]{64}$/;

/**
 * dev-grant 토큰·주문은 dev 서비스에서만 유효. Firestore가 dev·prod 단일이라 이 가드가 없으면
 * dev에서 발급한 토큰으로 prod 유료 생성·다운로드가 된다 (2026-11-03 최종안 §2).
 */
export function tokenEnvOk(d) {
  return !((d?.provider === 'dev-grant' || d?.devGrant) && !isDevService());
}

/**
 * 다운로드 토큰 발급 (Firestore directTokens)
 * 생성 N회(DIRECT_TOKEN_MAX_GENERATES) 허용 → 다운로드에서 최종 소모.
 */
export async function issueDirectToken({ orderId, slug, market, amount, currency, provider, devGrant }) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + DIRECT_TOKEN_TTL_MS;
  await firestore.collection('directTokens').doc(token).set({
    orderId: orderId || null,
    slug: slug || null,
    market: market || null,
    amount: amount ?? null,
    currency: currency || null,
    provider: provider || null,
    status: 'active',          // active | used | revoked
    generateCount: 0,
    maxGenerates: DIRECT_TOKEN_MAX_GENERATES,
    downloaded: false,
    createdAt: new Date(now).toISOString(),
    expiresAt,                 // epoch ms — TTL 24h
    ...(devGrant ? { devGrant: true } : {}),
  });
  return { token, expiresAt };
}

/**
 * generate 결제 게이트 — 토큰 생성 쿼터 1회 소모 (트랜잭션, 다중 인스턴스 안전)
 * @returns {ok, status, error, code, remainingGenerates, tokenData}
 */
export async function consumeGenerateQuota(paymentToken) {
  if (!paymentToken || typeof paymentToken !== 'string' || !TOKEN_RE.test(paymentToken)) {
    return { ok: false, status: 402, error: '결제가 필요합니다', code: 'PAYMENT_REQUIRED' };
  }
  const tokenRef = firestore.collection('directTokens').doc(paymentToken);
  try {
    return await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(tokenRef);
      if (!doc.exists) {
        return { ok: false, status: 402, error: '유효하지 않은 결제 토큰입니다', code: 'INVALID_TOKEN' };
      }
      const d = doc.data();
      if (!tokenEnvOk(d)) {
        return { ok: false, status: 402, error: '유효하지 않은 결제 토큰입니다', code: 'INVALID_TOKEN' };
      }
      if (d.status !== 'active' || d.downloaded) {
        return { ok: false, status: 402, error: '이미 사용된 결제 토큰입니다', code: 'TOKEN_USED' };
      }
      if (typeof d.expiresAt === 'number' && Date.now() > d.expiresAt) {
        return { ok: false, status: 402, error: '만료된 결제 토큰입니다', code: 'TOKEN_EXPIRED' };
      }
      const count = d.generateCount ?? 0;
      const max = d.maxGenerates ?? DIRECT_TOKEN_MAX_GENERATES;
      if (count >= max) {
        return { ok: false, status: 402, error: '생성 재시도 횟수를 초과했습니다. 고객센터로 문의해주세요.', code: 'GENERATE_LIMIT' };
      }
      tx.update(tokenRef, { generateCount: count + 1, lastGenerateAt: new Date().toISOString() });
      return { ok: true, remainingGenerates: max - count - 1, tokenData: d };
    });
  } catch (err) {
    log(`[Direct-Gate] 토큰 검증 에러: ${err.message}`, 'ERROR', { error: err.stack });
    return { ok: false, status: 500, error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' };
  }
}

/**
 * 생성 실패 시 쿼터 반환 (best-effort — 서버측 생성 에러에만 사용)
 */
export async function refundGenerateQuota(paymentToken) {
  if (!paymentToken || !TOKEN_RE.test(paymentToken)) return;
  const tokenRef = firestore.collection('directTokens').doc(paymentToken);
  try {
    await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(tokenRef);
      if (!doc.exists) return;
      const count = doc.data().generateCount ?? 0;
      if (count > 0) tx.update(tokenRef, { generateCount: count - 1 });
    });
  } catch (err) {
    log(`[Direct-Gate] 쿼터 반환 실패(무시): ${err.message}`, 'WARNING');
  }
}

/**
 * POST /api/payments/direct/init — 비로그인 단건 결제 시작 (orderId 서버 발급)
 * body: { slug, market: 'kr'|'global'|'jp', redirectUrl? }
 * 금액은 서버가 시장별로 확정 — 클라이언트 금액 불신.
 */
export async function handleDirectInit(req, res) {
  try {
    const body = await parseJsonBody(req);
    const { slug, market, redirectUrl } = body;

    if (!slug || typeof slug !== 'string' || !SLUG_RE.test(slug)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 slug', code: 'INVALID_SLUG' }));
      return;
    }
    const pricing = DIRECT_PRICING[market];
    if (!pricing) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 market (kr|global|jp)', code: 'INVALID_MARKET' }));
      return;
    }

    // orderId 서버 발급 — 토스 제약(6~64자, 영숫자·-·_) 충족
    const orderId = `SPECS-${market}-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    if (pricing.provider === 'toss') {
      // [KR] 토스 — 금액 서버 고정 ₩2,000
      await firestore.collection('directOrders').doc(orderId).set({
        orderId, slug, market,
        provider: 'toss',
        amount: pricing.amount,
        currency: pricing.currency,
        status: 'pending',       // pending | paid | failed | amount_mismatch | refunded
        createdAt: now,
      });
      log(`[Direct-Init] 주문 생성: ${orderId} (${slug}, ₩${pricing.amount})`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        orderId,
        provider: 'toss',
        amount: pricing.amount,
        currency: pricing.currency,
        orderName: `MONKOS 증명사진 (${slug})`,
        clientKey: TOSS_CLIENT_KEY,
      }));
      return;
    }

    // [글로벌·JP] 레몬 단건 $1.99 — 신규 트랙은 시장 불문 글로벌 스토어 USD 단일 (2026-07-05 작가님 확정.
    // JP 엔화 분기는 촬영실(idphoto-jp) 크레딧 레거시에만 존속. variant env 미설정 시 비활성)
    const variantId = LEMONSQUEEZY_VARIANT_SPECS_SINGLE;
    if (!variantId) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '해당 시장 결제가 아직 준비되지 않았습니다', code: 'LEMON_VARIANT_UNSET' }));
      return;
    }
    const storeId = LEMONSQUEEZY_STORE_ID;

    // redirect_url 검증 — monkos.ai 계열만 허용
    let safeRedirect;
    try {
      if (redirectUrl) {
        const u = new URL(redirectUrl);
        if (u.protocol === 'https:' && (u.hostname === 'monkos.ai' || u.hostname.endsWith('.monkos.ai') || u.hostname.endsWith('.run.app'))) {
          safeRedirect = redirectUrl;
        }
      }
    } catch { /* 무시 — redirect 없이 진행 */ }

    const attributes = {
      checkout_options: {},
      checkout_data: {
        custom: { order_ref: orderId },
      },
    };
    if (safeRedirect) attributes.product_options = { redirect_url: safeRedirect };

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
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    });
    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok) {
      log(`[Direct-Init] 레몬 체크아웃 실패: ${JSON.stringify(checkoutData.errors || checkoutData)}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '체크아웃 생성 실패', code: 'CHECKOUT_FAILED' }));
      return;
    }

    await firestore.collection('directOrders').doc(orderId).set({
      orderId, slug, market,
      provider: 'lemon',
      variantId: String(variantId),
      storeId,
      status: 'pending',
      createdAt: now,
    });
    log(`[Direct-Init] 레몬 주문 생성: ${orderId} (${slug}, ${market}, variant ${variantId})`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      orderId,
      provider: 'lemon',
      checkoutUrl: checkoutData.data?.attributes?.url,
    }));
  } catch (err) {
    log(`[Direct-Init] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * GET /api/payments/direct/status?orderId= — 결제 상태 폴링 (레몬 웹훅 비동기 대응, 토스도 사용 가능)
 */
export async function handleDirectStatus(req, res) {
  try {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const orderId = urlParams.searchParams.get('orderId') || '';
    if (!ORDER_ID_RE.test(orderId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 orderId', code: 'INVALID_ORDER_ID' }));
      return;
    }
    const doc = await firestore.collection('directOrders').doc(orderId).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '주문 없음', code: 'ORDER_NOT_FOUND' }));
      return;
    }
    const d = doc.data();
    // dev 주문을 prod에서 폴링: 토큰을 빼고 'paid'를 주면 프론트가 2.5초 폴링을 멈추지 않는다.
    // 'failed'는 specs-funnel.js·headshot.js 폴링의 종료 분기(failed|amount_mismatch|refunded)에 든다
    if (!tokenEnvOk(d)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ orderId, status: 'failed' }));
      return;
    }
    const out = { orderId, status: d.status };
    if (d.status === 'paid' && d.paymentToken) {
      out.paymentToken = d.paymentToken;
      out.tokenExpiresAt = d.tokenExpiresAt || null;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(out));
  } catch (err) {
    log(`[Direct-Status] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * POST /api/payments/direct/dev-grant — 에이전트 결제 E2E (dev 전용, 실결제 없음)
 * pending 주문을 paid로 넘기고 토큰 발급. 매출 원장 payments에는 쓰지 않는다.
 * 경로 등록(server.js)과 requireAdmin이 1차 게이트, 여기 dev 판별이 2차, prod 소비처 tokenEnvOk가 3차.
 */
export async function handleDirectDevGrant(req, res) {
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (!isDevService()) return send(404, { error: 'Not found' });
  try {
    const { orderId } = await parseJsonBody(req);
    if (!ORDER_ID_RE.test(orderId || '')) return send(400, { error: '유효하지 않은 orderId', code: 'INVALID_ORDER_ID' });
    const orderRef = firestore.collection('directOrders').doc(orderId);
    const doc = await orderRef.get();
    if (!doc.exists) return send(404, { error: '주문 없음', code: 'ORDER_NOT_FOUND' });
    const order = doc.data();
    if (order.status !== 'pending') return send(409, { error: 'pending 주문만 가능', code: 'ORDER_NOT_PENDING', status: order.status });
    const { token, expiresAt } = await issueDirectToken({
      orderId, slug: order.slug, market: order.market, amount: order.amount, currency: order.currency, provider: 'dev-grant', devGrant: true,
    });
    await orderRef.update({ status: 'paid', paymentToken: token, tokenExpiresAt: expiresAt, paidAt: new Date().toISOString(), devGrant: true });
    log(`[Direct-DevGrant] 발급: orderId=${orderId} (${order.slug})`);
    return send(200, { success: true, orderId, paymentToken: token, tokenExpiresAt: expiresAt });
  } catch (err) {
    log(`[Direct-DevGrant] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    return send(500, { error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
}

/**
 * POST /api/payments/direct/fail — 결제 실패 수신 (2026-09-19 신설)
 * body: { orderId, stage, code, message, vw, vh, inApp }
 *
 * 실패 사유의 정본. GA는 유실 가능하고, 종전에는 결제 시도가 꺾인 지점이 서버 어디에도 남지 않아
 * init 3명·7회 대비 승인 호출 0건이라는 사실만 있고 원인이 없었다.
 * 서버 발급 orderId(= directOrders 문서 존재)가 아니면 기록하지 않는다 — 임의 주입 차단.
 */
const FAIL_STAGES = new Set(['widget', 'request', 'return', 'confirm', 'poll']);

export async function handleDirectFail(req, res) {
  const json = (status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };
  try {
    const body = await parseJsonBody(req);
    const orderId = String(body.orderId || '');
    if (!ORDER_ID_RE.test(orderId)) return json(400, { error: '유효하지 않은 orderId', code: 'INVALID_ORDER_ID' });

    const stage = FAIL_STAGES.has(body.stage) ? body.stage : 'unknown';
    const code = String(body.code || 'UNKNOWN').slice(0, 60);
    const message = String(body.message || '').slice(0, 200);
    const vw = Number.isFinite(body.vw) ? Math.round(body.vw) : null;
    const vh = Number.isFinite(body.vh) ? Math.round(body.vh) : null;
    const inApp = body.inApp === true;
    const ua = String(req.headers['user-agent'] || '').slice(0, 300);

    const ref = firestore.collection('directOrders').doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) return json(404, { error: '주문 없음', code: 'ORDER_NOT_FOUND' });

    const prev = doc.data();
    const failCount = (prev.failCount ?? 0) + 1;
    await ref.update({
      failCount,
      lastFail: { stage, code, message, vw, vh, inApp, ua, at: new Date().toISOString() },
    });
    log(`[Direct-Fail] ${orderId} stage=${stage} code=${code} n=${failCount} vp=${vw}x${vh} inApp=${inApp} slug=${prev.slug || '?'} msg=${message}`, 'WARNING');

    // 같은 주문에서 3회 이상 꺾이면 1회만 알린다 (반복 알림 방지)
    if (failCount >= 3 && !prev.failAlertSent && TEAM_CHAT_ID) {
      await ref.update({ failAlertSent: true }).catch(() => {});
      sendTelegramMessage(
        TEAM_CHAT_ID,
        `🚨 *단건 결제 반복 실패*\norderId: ${orderId} (${prev.slug || '?'}, ${prev.market || '?'})\n누적 ${failCount}회 / 최근 ${stage} · ${code}\n뷰포트 ${vw}x${vh}${inApp ? ' · 인앱브라우저' : ''}\n${message || ''}`,
        TELEGRAM_TEAM_API
      ).catch(() => {});
    }
    return json(200, { ok: true, failCount });
  } catch (err) {
    log(`[Direct-Fail] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    return json(500, { error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
}

/**
 * POST /api/payments/fail — 주문 문서가 없는 결제 표면(크레딧 충전 등)의 실패 수신 (2026-09-20 신설)
 * body: { service, provider, stage, code, message, vw, vh, inApp }
 *
 * 충전 페이지는 directOrders 문서가 없어 handleDirectFail 을 쓸 수 없다 → 구조화 WARNING 로그 1행만 남긴다.
 * 인증 불요(실패는 세션이 깨졌을 때도 난다) · Firestore 쓰기 없음 · 텔레그램 없음.
 * 전 필드 화이트리스트/길이 제한, 모르는 필드는 무시. 남용 방어는 server.js 레이트리밋.
 */
const PAY_FAIL_PROVIDERS = new Set(['toss', 'lemon']);

export async function handlePayFail(req, res) {
  const json = (status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  };
  try {
    // 무인증 엔드포인트 — 정상 본문은 수백 바이트. 큰 본문은 읽기 전에 거절
    if (Number(req.headers['content-length'] || 0) > 4096) return json(413, { error: '요청이 너무 큽니다', code: 'PAYLOAD_TOO_LARGE' });
    const body = await parseJsonBody(req);
    const b = (body && typeof body === 'object' && !Array.isArray(body)) ? body : {};
    const service = (typeof b.service === 'string' && /^[a-z0-9_-]{1,24}$/.test(b.service)) ? b.service : 'unknown';
    const provider = PAY_FAIL_PROVIDERS.has(b.provider) ? b.provider : 'unknown';
    const stage = FAIL_STAGES.has(b.stage) ? b.stage : 'unknown';
    const code = String(b.code || 'UNKNOWN').replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 60);
    // 제어문자 제거 — 로그 행 위조 방지
    const message = String(b.message || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').slice(0, 200);
    const dim = (v) => (Number.isFinite(v) && v >= 0 && v <= 20000) ? Math.round(v) : '?';
    const inApp = b.inApp === true;
    log(`[Pay-Fail] service=${service} provider=${provider} stage=${stage} code=${code} vp=${dim(b.vw)}x${dim(b.vh)} inApp=${inApp} msg=${message}`, 'WARNING');
    return json(200, { ok: true });
  } catch (err) {
    // 본문 파싱 실패 등 — 계측 엔드포인트라 조용히 400
    return json(400, { error: '잘못된 요청', code: 'BAD_REQUEST' });
  }
}

/**
 * POST /api/payments/toss/direct — 비로그인 직접결제 confirm (토스)
 * 서버가 주문 기록 금액(₩2,000)을 강제 — 클라이언트 amount 불신.
 * 멱등: 동일 orderId 재confirm 시 기존 토큰 재응답 (성공 페이지 새로고침 보호).
 */
export async function handleTossDirect(req, res) {
  try {
    const body = await parseJsonBody(req);
    const { paymentKey, orderId } = body;
    if (!paymentKey || !orderId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'paymentKey, orderId 필수' }));
      return;
    }

    // 멱등성 — confirm보다 먼저 (이중 confirm → 토스 400 방지)
    const existingPayments = await firestore.collection('payments')
      .where('orderId', '==', orderId)
      .where('type', '==', 'direct')
      .limit(1).get();
    if (!existingPayments.empty) {
      const existing = existingPayments.docs[0].data();
      log(`[Toss-Direct] 중복 confirm — orderId=${orderId} 기존 토큰 재응답`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        paymentToken: existing.downloadToken,
        downloadToken: existing.downloadToken,
        orderId,
        duplicated: true,
      }));
      return;
    }

    // 주문 정본 조회 — 서버 발급 orderId만 승인
    const orderRef = firestore.collection('directOrders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      log(`[Toss-Direct] 알 수 없는 orderId: ${orderId}`, 'WARNING');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 주문입니다', code: 'ORDER_NOT_FOUND' }));
      return;
    }
    const order = orderDoc.data();
    if (order.provider !== 'toss') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '토스 주문이 아닙니다', code: 'PROVIDER_MISMATCH' }));
      return;
    }
    const amount = order.amount; // 서버 정본 (₩2,000)

    // 클라이언트가 amount를 보냈고 서버 정본과 다르면 = 조작 시도 → 거부·기록
    if (body.amount !== undefined && Number(body.amount) !== amount) {
      log(`[Toss-Direct] 금액 조작 시도 거부: orderId=${orderId}, client=${body.amount}, server=${amount}`, 'ERROR');
      try { await orderRef.update({ status: 'amount_mismatch', clientAmount: Number(body.amount), failedAt: new Date().toISOString() }); } catch {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '결제 금액이 일치하지 않습니다', code: 'AMOUNT_MISMATCH' }));
      return;
    }

    // 토스 API 결제 승인 — 금액은 서버 정본으로 전달
    const authHeader = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
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
      try { await orderRef.update({ status: 'failed', failReason: `${tossData.code}: ${tossData.message}`, failedAt: new Date().toISOString() }); } catch {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: tossData.message || '결제 승인 실패' }));
      return;
    }

    // 승인 응답 금액 대조 (이중 안전망)
    if (typeof tossData.totalAmount === 'number' && tossData.totalAmount !== amount) {
      log(`[Toss-Direct] 승인 금액 불일치: orderId=${orderId}, toss=${tossData.totalAmount}, server=${amount}`, 'ERROR');
      if (TEAM_CHAT_ID) {
        sendTelegramMessage(TEAM_CHAT_ID, `🚨 *토스 direct 금액 불일치*\norderId: ${orderId}\n승인: ₩${tossData.totalAmount} / 정본: ₩${amount}`, TELEGRAM_TEAM_API).catch(() => {});
      }
      try { await orderRef.update({ status: 'amount_mismatch', tossAmount: tossData.totalAmount, failedAt: new Date().toISOString() }); } catch {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '결제 금액이 일치하지 않습니다', code: 'AMOUNT_MISMATCH' }));
      return;
    }

    // 다운로드 토큰 발급 (Firestore, 1회성 소모·TTL 24h)
    const { token, expiresAt } = await issueDirectToken({
      orderId, slug: order.slug, market: order.market, amount, currency: order.currency, provider: 'toss',
    });

    try {
      await orderRef.update({ status: 'paid', paymentKey, paymentToken: token, tokenExpiresAt: expiresAt, paidAt: new Date().toISOString() });
    } catch (updErr) {
      log(`[Toss-Direct] 주문 상태 갱신 실패: ${updErr.message}`, 'WARNING');
    }

    // 결제 기록 (Firestore payments/ 컬렉션 — slug·시장 식별 포함)
    try {
      await firestore.collection('payments').add({
        type: 'direct',
        provider: 'toss',
        orderId,
        slug: order.slug || null,
        market: order.market || null,
        amount,
        paymentKey,
        downloadToken: token,
        createdAt: new Date().toISOString(),
      });
    } catch (logErr) {
      log(`[Toss-Direct] 결제 로그 저장 실패: ${logErr.message}`, 'WARNING');
    }

    log(`[Toss-Direct] 결제 완료: orderId=${orderId}, ₩${amount} (${order.slug}/${order.market}) → token 발급`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, paymentToken: token, downloadToken: token, orderId, tokenExpiresAt: expiresAt }));
  } catch (err) {
    log(`[Toss-Direct] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * GET /api/download/direct — 다운로드 시 토큰 최종 소모 (1회성, Firestore 트랜잭션)
 */
export async function handleDownloadDirect(req, res) {
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const token = urlParams.searchParams.get('token');

  if (!token || !TOKEN_RE.test(token)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '토큰 필수' }));
    return;
  }

  try {
    const tokenRef = firestore.collection('directTokens').doc(token);
    const result = await firestore.runTransaction(async (tx) => {
      const doc = await tx.get(tokenRef);
      if (!doc.exists) return { ok: false, status: 404, error: '유효하지 않은 토큰' };
      const d = doc.data();
      if (!tokenEnvOk(d)) return { ok: false, status: 404, error: '유효하지 않은 토큰', code: 'INVALID_TOKEN' };
      if (d.status !== 'active' || d.downloaded) return { ok: false, status: 409, error: '이미 사용된 토큰' };
      if (typeof d.expiresAt === 'number' && Date.now() > d.expiresAt) return { ok: false, status: 404, error: '만료된 토큰' };
      tx.update(tokenRef, { downloaded: true, status: 'used', usedAt: new Date().toISOString() });
      return { ok: true, orderId: d.orderId, slug: d.slug, market: d.market };
    });

    if (!result.ok) {
      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: result.error, ...(result.code ? { code: result.code } : {}) }));
      return;
    }

    log(`[Direct-Download] 토큰 최종 소모: orderId=${result.orderId} (${result.slug}/${result.market})`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, orderId: result.orderId }));
  } catch (err) {
    log(`[Direct-Download] 에러: ${err.message}`, 'ERROR', { error: err.stack });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
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
  const rawReturn = params.get('returnUrl') || '/';
  const returnUrl = rawReturn.startsWith('/') ? esc(rawReturn) : '/';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>결제 확인 중...</title>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JPZWSJ3323');${process.env.GOOGLE_ADS_CONVERSION_ID ? `gtag('config','AW-${process.env.GOOGLE_ADS_CONVERSION_ID}');` : ''}</script>
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
      try{gtag('event','purchase',{transaction_id:'${orderId}',currency:'KRW',value:${amount},payment_provider:'toss',service:'portal',transport_type:'beacon'});${process.env.GOOGLE_ADS_CONVERSION_ID && process.env.GOOGLE_ADS_LABEL_PURCHASE ? `gtag('event','conversion',{send_to:'AW-${process.env.GOOGLE_ADS_CONVERSION_ID}/${process.env.GOOGLE_ADS_LABEL_PURCHASE}',value:${amount},currency:'KRW',transaction_id:'${orderId}'});` : ''}}catch(e){}
      box.innerHTML='<div class="ok">\\u2705 결제 완료!</div><div class="msg" style="margin-top:12px">'+data.creditsAdded+' 크레딧이 추가되었습니다</div><div class="sub">현재 잔액: '+data.credits+'c</div><div class="sub" style="margin-top:16px"><a href="${returnUrl}" style="color:#a78bfa">돌아가기</a></div>';
    }else{
      box.innerHTML='<div class="err">결제 확인 실패</div><div class="sub" style="margin-top:8px">'+(data.error||'알 수 없는 오류')+'</div><div class="sub" style="margin-top:16px"><a href="${returnUrl}" style="color:#a78bfa">돌아가기</a></div>';
    }
  }catch(e){
    box.innerHTML='<div class="err">네트워크 오류</div><div class="sub" style="margin-top:8px">'+e.message+'</div><div class="sub" style="margin-top:16px"><a href="${returnUrl}" style="color:#a78bfa">돌아가기</a></div>';
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
  const rawReturn = params.get('returnUrl') || '/';
  const returnUrl = rawReturn.startsWith('/') ? escFail(rawReturn) : '/';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>결제 실패</title>
<style>body{background:#0a0a1a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:40px}.err{color:#f87171;font-size:1.2rem;margin-bottom:12px}.sub{color:#8892a8;font-size:0.85rem}</style></head>
<body><div class="box"><div class="err">결제 실패</div><div class="sub">${message}</div><div class="sub" style="margin-top:16px"><a href="${returnUrl}" style="color:#a78bfa">돌아가기</a></div></div></body></html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}
