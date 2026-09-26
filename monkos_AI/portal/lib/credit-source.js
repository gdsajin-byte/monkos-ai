// 크레딧 출처 판정 — 웰컴(가입 보너스) vs 구매(토스·Lemon 충전)
//
// 배경(2026-09-26): 어드민 리뷰 갤러리가 gate=credits를 전부 "유료"로 표기해
// 웰컴 10c 소진이 매출로 오독됐다. 원장(transactions)의 type='charge'(토스·Lemon 결제 적립)가
// 생성 시점 이전에 1건이라도 있으면 '구매', 없으면 '웰컴'으로 본다.
// 어드민 수동 충전(credits.sh)은 type='credit_charge'라 여기 포함되지 않는다 — 매출이 아니다.
import { firestore, log } from './shared/config.js';

export const CREDIT_SOURCE = Object.freeze({ PURCHASED: 'purchased', WELCOME: 'welcome' });

/**
 * 순수 판정 — 테스트 대상.
 * @param {Array<{createdAt?: string}>} chargeTxs  type='charge' 원장 행들
 * @param {string|null} beforeIso  이 시각 이전 결제만 인정 (null이면 전체)
 */
export function classifyCreditSource(chargeTxs, beforeIso = null) {
  if (!Array.isArray(chargeTxs) || chargeTxs.length === 0) return CREDIT_SOURCE.WELCOME;
  if (!beforeIso) return CREDIT_SOURCE.PURCHASED;
  const before = Date.parse(beforeIso);
  if (Number.isNaN(before)) return CREDIT_SOURCE.PURCHASED;
  const hit = chargeTxs.some(tx => {
    const t = Date.parse(tx?.createdAt || '');
    return !Number.isNaN(t) && t <= before;
  });
  return hit ? CREDIT_SOURCE.PURCHASED : CREDIT_SOURCE.WELCOME;
}

/**
 * Firestore 조회 + 판정. 실패 시 null(미상) — 호출부는 배지를 비우지 말고 '크레딧'으로 폴백한다.
 * 등호 필터 2개(userId, type)만 사용 — 복합 인덱스 불요.
 */
export async function resolveCreditSource(userId, beforeIso = null) {
  if (!userId) return null;
  try {
    const snap = await firestore.collection('transactions')
      .where('userId', '==', userId)
      .where('type', '==', 'charge')
      .limit(50)
      .get();
    return classifyCreditSource(snap.docs.map(d => d.data()), beforeIso);
  } catch (e) {
    log(`[CreditSource] 판정 실패(무시): ${e.message}`, 'WARNING');
    return null;
  }
}
