/** 담당: 막내2 (리파인) */

import { usersCollection, firestore, log, logTransaction, parseJsonBody, verifyAuthToken, parseCookies, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID } from './shared/config.js';
import { trackEvent } from './tracking.js';

// === 환불 가드 (2026-07-06 F2 봉합) ===
// 환불은 "직전 차감(lastUse) 대조"로만 허용 — 무증빙 셀프 환불 차단.
// use 성공 시 user 문서에 lastUse{type,cost,at,refunded}를 남기고,
// refund는 같은 type의 미환불 lastUse가 10분 이내일 때만 그 cost를 되돌린다.
export const REFUND_WINDOW_MS = 10 * 60 * 1000;

export function refundEligibility(lastUse, type, nowMs) {
  if (!lastUse || typeof lastUse !== 'object') return { ok: false, reason: 'NO_MATCHING_USE' };
  if (lastUse.type !== type) return { ok: false, reason: 'TYPE_MISMATCH' };
  if (lastUse.refunded) return { ok: false, reason: 'ALREADY_REFUNDED' };
  const at = Date.parse(lastUse.at || '');
  if (!Number.isFinite(at) || nowMs - at > REFUND_WINDOW_MS) return { ok: false, reason: 'WINDOW_EXPIRED' };
  const cost = Number(lastUse.cost);
  if (!Number.isFinite(cost) || cost <= 0) return { ok: false, reason: 'INVALID_COST' };
  return { ok: true, cost };
}

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
  // userId 생략 = 세션 본인 조회 (specs·헤드샷 잔액 확인이 파라미터 없이 호출 —
  // 종전 400 응답을 클라이언트가 "잔액 없음"으로 오판해 충전창 유도, 2026-07-06 실사고)
  const userId = urlParams.searchParams.get('userId') || authUserId;

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
    res.end(JSON.stringify({ credits, userId, unit: '$0.10/c', krwRate: 150 }));
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
      tx.update(userRef, {
        credits: newCredits,
        // 환불 가드 원장 — refund는 이 기록 대조로만 지급
        lastUse: { type, cost, at: new Date().toISOString(), refunded: false },
      });
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

    const REFUNDABLE_TYPES = new Set(['generate', 'download', 'extra_crop', 'full_original']);
    if (!REFUNDABLE_TYPES.has(type)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 type' }));
      return;
    }

    const userRef = usersCollection.doc(userId);
    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('사용자 없음');
      const data = userDoc.data() || {};
      const elig = refundEligibility(data.lastUse, type, Date.now());
      if (!elig.ok) return { success: false, reason: elig.reason, credits: data.credits ?? 0 };
      const newCredits = (data.credits ?? 0) + elig.cost;
      tx.update(userRef, { credits: newCredits, lastUse: { ...data.lastUse, refunded: true } });
      return { success: true, credits: newCredits, refunded: elig.cost, type };
    });

    if (!result.success) {
      // fail-closed: 대조 실패 시 미지급 — 정상 흐름(생성 실패 직후 환불)에선 나오지 않는 신호라 팀 경보
      log(`[Credits] 환불 거부(${result.reason}): ${userId} (${type})`, 'WARNING');
      if (TEAM_CHAT_ID) {
        sendTelegramMessage(TEAM_CHAT_ID, `⚠️ *크레딧 환불 거부*\nuser: ${userId}\ntype: ${type}\n사유: ${result.reason}\n(악용 시도 또는 정상 환불 흐름 파손 — 확인 필요)`, TELEGRAM_TEAM_API).catch(() => {});
      }
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '환불 대상 차감 기록이 없습니다', code: result.reason }));
      return;
    }

    log(`[Credits] 환불: ${userId} +${result.refunded}c (${type}) → ${result.credits}c`);
    logTransaction({ userId, amount: result.refunded, type: 'refund', provider: 'system', balanceAfter: result.credits, description: `${type} 환불 (+${result.refunded}c)` });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Credits] 환불 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}
