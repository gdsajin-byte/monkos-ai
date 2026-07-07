/**
 * 스펙스 규격 안착 크롭 테스트 (2026-07-06, DESIGN_20260705 옵션 B)
 * - 규격 파라미터 파서: 실데이터(specs-data.json 428건) 커버리지 + 대표 규격 수치
 * - cropToSpec 폴백: 엔진 URL 부재 시 로컬 커버 크롭이 규격 비율 보장
 */

import { jest } from '@jest/globals';
import sharp from 'sharp';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log: jest.fn(),
  sendTelegramMessage: jest.fn(),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
}));

const { getSpecCropParams, cropToSpec } = await import('../lib/spec-crop.js');
const { createRequire } = await import('module');
const SPECS_DATA = createRequire(import.meta.url)('../lib/cms/specs-data.json');

describe('규격 파라미터 파서', () => {
  test('kr-passport: 35×45mm, 얼굴 3.2~3.6cm → IDPASS 산식 max(33, fMin+1) = 33mm (2026-07-07 이식)', () => {
    expect(getSpecCropParams('kr-passport')).toEqual({
      frameW: 413, frameH: 531, frameHmm: 45, faceTargetMm: 33, faceMinMm: 32, hairMarginMm: 2,
      headHeightMinMm: 32, headHeightMaxMm: 36,
    });
  });

  test('us-passport: 정사각 51×51mm, 인치 병기 mm 범위 파싱', () => {
    const p = getSpecCropParams('us-passport');
    expect(p.frameHmm).toBeCloseTo(51, 0);
    expect(p.faceTargetMm).toBeGreaterThanOrEqual(25);
    expect(p.faceTargetMm).toBeLessThanOrEqual(36);
    expect(p.faceMinMm).toBeLessThan(p.faceTargetMm);
  });

  test('전수 커버리지: 428건 중 파라미터 산출 426건 이상', () => {
    const slugs = Object.keys(SPECS_DATA);
    const ok = slugs.filter((s) => getSpecCropParams(s) !== null);
    expect(slugs.length).toBeGreaterThanOrEqual(428);
    expect(ok.length).toBeGreaterThanOrEqual(426);
    // 산출된 파라미터는 전부 기본 무결성 충족
    for (const s of ok) {
      const p = getSpecCropParams(s);
      expect(p.frameW).toBeGreaterThan(0);
      expect(p.frameH).toBeGreaterThan(0);
      expect(p.faceTargetMm).toBeLessThan(p.frameHmm);
    }
  });

  test('미등록 슬러그 → null', () => {
    expect(getSpecCropParams('no-such-slug')).toBeNull();
  });
});

describe('cropToSpec 폴백 (엔진 URL 부재)', () => {
  test('로컬 커버 크롭 → 규격 프레임 크기 보장', async () => {
    const src = await sharp({
      create: { width: 300, height: 400, channels: 3, background: { r: 200, g: 200, b: 200 } },
    }).png().toBuffer();
    const out = await cropToSpec(src.toString('base64'), 'kr-passport');
    expect(out.cropped).toBe(true);
    expect(out.engine).toBe('cover');
    const meta = await sharp(Buffer.from(out.image, 'base64')).metadata();
    expect(meta.width).toBe(413);
    expect(meta.height).toBe(531);
  });

  test('파라미터 산출 불가 슬러그 → 원본 그대로 (engine none)', async () => {
    const out = await cropToSpec('aGVsbG8=', 'no-such-slug');
    expect(out.cropped).toBe(false);
    expect(out.engine).toBe('none');
  });
});

describe('headHeight 수치 정본 (ORDER_20260707 Task 2 병합)', () => {
  test('428건 전수: headHeightMin < headHeightMax, 프레임 내 무결', () => {
    const slugs = Object.keys(SPECS_DATA);
    for (const s of slugs) {
      const d = SPECS_DATA[s];
      expect(Number.isFinite(d.headHeightMin)).toBe(true);
      expect(Number.isFinite(d.headHeightMax)).toBe(true);
      expect(d.headHeightMin).toBeLessThan(d.headHeightMax);
      expect(d.headHeightMin).toBeGreaterThan(0);
    }
  });

  test('kr-passport 수치 정본 32~36 (countries.jsonl) → 타겟 33 유지', () => {
    expect(SPECS_DATA['kr-passport'].headHeightMin).toBe(32);
    expect(SPECS_DATA['kr-passport'].headHeightMax).toBe(36);
    expect(getSpecCropParams('kr-passport').faceTargetMm).toBe(33);
  });
});
