/**
 * 추천 화각 오버레이 — 규격 잘림 범위가 crop-engine 배치와 같은지, 추천 범위가 전 규격을 덮는지 (DESIGN_20261102 §1·§2)
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
const { recommendedRect, specCropRect, REF_CANVAS, CANVAS_EXTEND_TOP } = await import('../lib/framing-overlay.js');
const { createRequire } = await import('module');
const SPECS_DATA = createRequire(import.meta.url)('../lib/cms/specs-data.json');

// 2026-11-02 crop-engine /api/fit-spec 실측 (원본 마스터 896×1200). 엔진은 y를 이미지 안으로 클램프하므로 클램프된 건은 y=0.
// spec은 측정 때 엔진에 넣은 값을 고정한다 — 규격 데이터가 바뀌어도 배치 식 비교는 유지된다.
const ENGINE_MEASURED = {
  'us-visa 26mm': {
    spec: { frameW: 600, frameH: 600, frameHmm: 51, faceTargetMm: 26, faceMinMm: 25 },
    frame: { x: 93.7, y: 0, w: 711.6, h: 711.6 },
  },
  'kr-passport 33mm': {
    spec: { frameW: 413, frameH: 531, frameHmm: 45, faceTargetMm: 33, faceMinMm: 32 },
    frame: { x: 257.1, y: 67.1, w: 384.8, h: 494.7 },
  },
  'ca-passport 35mm': {
    spec: { frameW: 590, frameH: 826, frameHmm: 70, faceTargetMm: 35, faceMinMm: 31 },
    frame: { x: 190.6, y: 0, w: 518.3, h: 725.6 },
  },
};

describe('규격 잘림 범위', () => {
  test.each(Object.keys(ENGINE_MEASURED))('%s: 엔진 실측 프레임과 일치', (name) => {
    const { spec, frame: measured } = ENGINE_MEASURED[name];
    const rect = specCropRect(spec);
    expect(Math.abs(rect.x - measured.x)).toBeLessThan(1.5);
    expect(Math.abs(rect.w - measured.w)).toBeLessThan(1.5);
    expect(Math.abs(rect.h - measured.h)).toBeLessThan(1.5);
    const originalY = rect.y - CANVAS_EXTEND_TOP;
    expect(Math.abs(Math.max(0, originalY) - measured.y)).toBeLessThan(2);
  });

  test('규격마다 크기가 달라진다', () => {
    const us = specCropRect(getSpecCropParams('us-visa'));
    const kr = specCropRect(getSpecCropParams('kr-passport'));
    expect(us.w).toBeGreaterThan(kr.w * 1.2);
  });

  test('규격 데이터가 없으면 그리지 않는다', () => {
    expect(specCropRect(null)).toBeNull();
    expect(specCropRect(getSpecCropParams('no-such-slug'))).toBeNull();
  });
});

describe('추천 촬영 범위', () => {
  const shoot = recommendedRect();

  test('캔버스 안에 있다', () => {
    expect(shoot.x).toBeGreaterThanOrEqual(0);
    expect(shoot.y).toBeGreaterThanOrEqual(0);
    expect(shoot.x + shoot.w).toBeLessThanOrEqual(REF_CANVAS.width);
    expect(shoot.y + shoot.h).toBeLessThanOrEqual(REF_CANVAS.height);
  });

  test('전 규격 잘림 범위를 덮는다', () => {
    const outside = [];
    for (const slug of Object.keys(SPECS_DATA)) {
      const rect = specCropRect(getSpecCropParams(slug));
      if (!rect) continue;
      const inside = rect.x >= shoot.x && rect.y >= shoot.y
        && rect.x + rect.w <= shoot.x + shoot.w && rect.y + rect.h <= shoot.y + shoot.h;
      if (!inside) outside.push(`${slug}: ${JSON.stringify(rect)}`);
    }
    expect(outside).toEqual([]);
  });
});
