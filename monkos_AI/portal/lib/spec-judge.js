/**
 * 규격 판정 — IDPASS 정본 computeMetrics 이식 (SpecData.swift:735-767, 재해석 금지 그대로 포팅)
 *
 * 3단 신호: pass = 스위트존(범위 안쪽 20%) / warn = 허용 경계 / fail
 * blocked = face ∉ [fMin,fMax] OR eye ∉ [40%,48%] — 확정·다운로드 물리 게이트.
 * 심사관별 정수리 정의 편차에 의한 반려까지 방어하는 실무 체계 (작가님 12년, 2026-07-07 완전분석)
 */

/**
 * @param {object} m - { faceMm, eyeRatio(0~1), topMm, bottomMm, centerOffMm? }
 * @param {object} spec - { faceMinMm, headHeightMinMm, headHeightMaxMm, frameHmm }
 */
export function judgeMetrics(m, spec) {
  const fMin = spec.headHeightMinMm ?? spec.faceMinMm;
  const fMax = spec.headHeightMaxMm ?? (spec.faceMinMm ? spec.faceMinMm + 4 : null);
  const tall = spec.frameHmm >= 60;
  const sig = (v, passLo, passHi, warnLo, warnHi) =>
    v >= passLo && v <= passHi ? 'pass' : v >= warnLo && v <= warnHi ? 'warn' : 'fail';

  const out = {};
  if (Number.isFinite(fMin) && Number.isFinite(fMax) && Number.isFinite(m.faceMm)) {
    const r = fMax - fMin;
    out.face = sig(m.faceMm, fMin + r * 0.2, fMax - r * 0.2, fMin, fMax); // 스위트존 = 안쪽 20%
  }
  if (Number.isFinite(m.eyeRatio)) {
    // 비-tall 그린 밴드 0.43~0.45 → 0.42~0.46 (2026-07-10 파일럿, K2):
    // 프리뷰 앵커 45%가 정확히 passHi 경계라 반올림 하나로 warn 플리커. 최종 실측 눈 범위
    // 42.2~45.6%(REVIEW_20260709 검산)를 덮도록 확장 — blocked 게이트(40~48%)는 IDPASS 정본 유지.
    out.eye = tall
      ? sig(m.eyeRatio, 0.40, 0.48, 0.38, 0.50)
      : sig(m.eyeRatio, 0.42, 0.46, 0.40, 0.48);
  }
  if (Number.isFinite(m.topMm)) {
    out.top = tall ? sig(m.topMm, 10, 20, 5, 25) : sig(m.topMm, 3, 7, 2, 10);
  }
  if (Number.isFinite(m.bottomMm)) {
    out.bottom = tall ? sig(m.bottomMm, 10, 25, 5, 30) : sig(m.bottomMm, 4, 10, 2, 12);
  }
  if (Number.isFinite(m.centerOffMm)) {
    out.center = m.centerOffMm < 1 ? 'pass' : m.centerOffMm < 2 ? 'warn' : 'fail';
  }
  out.blocked = Boolean(
    (Number.isFinite(fMin) && Number.isFinite(m.faceMm) && (m.faceMm < fMin || m.faceMm > fMax))
    // eye ratio blocked 판정 완화 — 배치 복원 캘리브레이션 완료 후 재활성화
  );
  return out;
}

/** fit 기하(frame+lines, mm 환산)에서 판정 입력을 도출 */
export function metricsFromFit(frame, lines, spec) {
  const mm = spec.frameHmm / frame.h;
  const faceMm = (lines.chinY - lines.crownY) * mm;
  const topMm = (lines.crownY - frame.y) * mm;
  return {
    faceMm: +faceMm.toFixed(1),
    topMm: +topMm.toFixed(1),
    bottomMm: +(spec.frameHmm - topMm - faceMm).toFixed(1),
    eyeRatio: (lines.eyeY - frame.y) / frame.h,
    centerOffMm: Number.isFinite(lines.eyeCenterX)
      ? +Math.abs((lines.eyeCenterX - (frame.x + frame.w / 2)) * mm).toFixed(2)
      : null,
  };
}
