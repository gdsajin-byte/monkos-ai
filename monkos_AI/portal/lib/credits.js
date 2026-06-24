/** 담당: 막내2 (리파인) */

import { usersCollection, firestore, log, logTransaction, parseJsonBody, verifyAuthToken, parseCookies } from './shared/config.js';
import { trackEvent } from './tracking.js';

function getAuthenticatedUserId(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.monkos_session;
  if (!token) return null;
  const payload = verifyAuthToken(token);
  return payload?.userId || null;
}

/**
 * GET /api/credits — 크레딧 조회
 */
export async function handleCreditsGet(req, res) {
  const authUserId = getAuthenticatedUserId(req);
  if (!authUserId) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '인증 필요' }));
    return;
  }

  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  const userId = urlParams.searchParams.get('userId');

  if (!userId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'userId 파라미터 필수' }));
    return;
  }

  if (authUserId !== userId) {
    log(`[Credits] 조회 거부: 세션(${authUserId}) ≠ 요청(${userId})`, 'WARNING');
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '본인 크레딧만 조회 가능' }));
    return;
  }

  try {
    const userRef = usersCollection.doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '사용자 없음' }));
      return;
    }

    const credits = userDoc.data()?.credits ?? 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ credits, userId, unit: '$0.10/c', krwRate: 145 }));
  } catch (err) {
    log(`[Credits] 조회 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * POST /api/credits/use — 크레딧 사용
 * type: 'generate' (-10c) | 'download' (-70c) | 'extra_crop' (-10c) | 'full_original' (-10c)
 */
export async function handleCreditsUse(req, res) {
  const authUserId = getAuthenticatedUserId(req);
  if (!authUserId) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '인증 필요' }));
    return;
  }

  try {
    const { userId, type } = await parseJsonBody(req);
    if (!userId || !type) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId, type 필드 필수' }));
      return;
    }

    if (authUserId !== userId) {
      log(`[Credits] 사용 거부: 세션(${authUserId}) ≠ 요청(${userId})`, 'WARNING');
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '본인 크레딧만 사용 가능' }));
      return;
    }

    const COST_MAP = { generate: 10, download: 70, extra_crop: 10, full_original: 10 };
    const cost = COST_MAP[type] || 0;
    if (cost === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 type' }));
      return;
    }

    const userRef = usersCollection.doc(userId);

    // 트랜잭션으로 원자적 차감
    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) {
        throw new Error('사용자 없음');
      }

      const currentCredits = userDoc.data()?.credits ?? 0;
      if (currentCredits < cost) {
        return { success: false, error: '크레딧 부족', credits: currentCredits, required: cost };
      }

      const newCredits = currentCredits - cost;
      tx.update(userRef, { credits: newCredits });
      return { success: true, credits: newCredits, used: cost, type };
    });

    if (!result.success) {
      log(`[Credits] 부족: ${userId} (${result.credits}c < ${result.required}c)`);
      res.writeHead(402, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    log(`[Credits] 사용: ${userId} -${cost}c (${type}) → ${result.credits}c`);
    logTransaction({ userId, amount: -cost, type: 'use', provider: 'system', balanceAfter: result.credits, description: `${type} 사용 (-${cost}c)` });
    trackEvent({
      eventName: 'credit_use', userId,
      service: 'portal', params: { amount: cost, use_type: type },
    }).catch(() => {});
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Credits] 사용 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

/**
 * POST /api/credits/refund — 크레딧 환불
 * 생성 실패 등으로 차감된 크레딧을 환불
 */
export async function handleCreditsRefund(req, res) {
  const authUserId = getAuthenticatedUserId(req);
  if (!authUserId) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '인증 필요' }));
    return;
  }

  try {
    const { userId, type } = await parseJsonBody(req);
    if (!userId || !type) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId, type 필드 필수' }));
      return;
    }

    if (authUserId !== userId) {
      log(`[Credits] 환불 거부: 세션(${authUserId}) ≠ 요청(${userId})`, 'WARNING');
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '본인 크레딧만 환불 가능' }));
      return;
    }

    const REFUND_MAP = { generate: 10, download: 70, extra_crop: 10, full_original: 10 };
    const refund = REFUND_MAP[type] || 0;
    if (refund === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 type' }));
      return;
    }

    const userRef = usersCollection.doc(userId);
    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('사용자 없음');
      const current = userDoc.data()?.credits ?? 0;
      const newCredits = current + refund;
      tx.update(userRef, { credits: newCredits });
      return { success: true, credits: newCredits, refunded: refund, type };
    });

    log(`[Credits] 환불: ${userId} +${refund}c (${type}) → ${result.credits}c`);
    logTransaction({ userId, amount: refund, type: 'refund', provider: 'system', balanceAfter: result.credits, description: `${type} 환불 (+${refund}c)` });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Credits] 환불 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}
