/**
 * 크롭 목표치-게이트 정합 가드 (2026-07-17 vn-visa 자기모순 실사고 재발 방지)
 * - faceTargetExplicitMm(iOS countries.jsonl 유래)와 headHeight 게이트(웹 텍스트 유래)는
 *   계보가 달라 병합 시 모순이 생길 수 있다 — 목표가 게이트 밖이면 해당 슬러그는
 *   어떤 사진도 fit을 통과하지 못한다 (엔진이 조준한 값을 judge가 차단).
 * - 전 428 슬러그: 산출 faceTargetMm ∈ [headHeightMinMm, headHeightMaxMm] 강제.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  PROJECT_ID: 'test', LOCATION: 'test', GCS_BUCKET: 'test',
  log: () => {},
  sendTelegramMessage: async () => {},
  TELEGRAM_TEAM_API: '', TEAM_CHAT_ID: '',
  CROP_ENGINE_URL: '',
}));

const { getSpecCropParams } = await import('../lib/spec-crop.js');
const { createRequire } = await import('module');
const SPECS_DATA = createRequire(import.meta.url)('../lib/cms/specs-data.json');

describe('spec-crop 목표치-게이트 정합', () => {
  test('전 슬러그: faceTargetMm가 headHeight 게이트 안에 있다', () => {
    const violations = [];
    for (const slug of Object.keys(SPECS_DATA)) {
      const p = getSpecCropParams(slug);
      if (!p) continue;
      const { faceTargetMm, headHeightMinMm, headHeightMaxMm } = p;
      if (!Number.isFinite(faceTargetMm) || !Number.isFinite(headHeightMinMm) || !Number.isFinite(headHeightMaxMm)) continue;
      if (faceTargetMm < headHeightMinMm || faceTargetMm > headHeightMaxMm) {
        violations.push(`${slug}: target ${faceTargetMm}mm ∉ [${headHeightMinMm}~${headHeightMaxMm}]`);
      }
    }
    expect(violations).toEqual([]);
  });

  test('데이터 원본: faceTargetExplicitMm가 headHeight 범위 안에 있다', () => {
    const violations = [];
    for (const [slug, r] of Object.entries(SPECS_DATA)) {
      const t = r.faceTargetExplicitMm;
      if (!Number.isFinite(t)) continue;
      const { headHeightMin: lo, headHeightMax: hi } = r;
      if (Number.isFinite(lo) && Number.isFinite(hi) && (t < lo || t > hi)) {
        violations.push(`${slug}: explicit ${t}mm ∉ [${lo}~${hi}]`);
      }
    }
    expect(violations).toEqual([]);
  });
});
