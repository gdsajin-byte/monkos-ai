/**
 * 화각 판정 — 이탈량·배율·경계값 (ORDER_20261102 미국비자_화각부족판정, 정수리 지시서 §8)
 */
import { frameOutside, judgeFov, judgeWide, fovCause, assessFov, fovRejectionReason, fitCacheGet, fitCacheSet, FOV_BLOCK_ENABLED, FOV_WARN_RATIO, FOV_BLOCK_RATIO, FOV_WIDE_WARN, FOV_WIDE_BLOCK } from '../lib/fit-fov.js';

const IMG = { width: 1000, height: 1000 };
const o = (v) => ({ top: 0, bottom: 0, left: 0, right: 0, ...v });

describe('frameOutside', () => {
  test('프레임이 원본 안이면 전부 0', () => {
    expect(frameOutside({ x: 100, y: 100, w: 500, h: 500 }, IMG)).toEqual(o({}));
  });

  test('프레임이 원본과 정확히 일치하면 0 (경계)', () => {
    expect(frameOutside({ x: 0, y: 0, w: 1000, h: 1000 }, IMG)).toEqual(o({}));
  });

  test('네 방향을 프레임 크기 대비 비율로 계산', () => {
    expect(frameOutside({ x: -200, y: -100, w: 1600, h: 2000 }, IMG)).toEqual({
      top: 0.05, bottom: 0.45, left: 0.125, right: 0.25,
    });
  });
});

describe('judgeFov', () => {
  test('임계값 자체는 상향하지 않고 초과부터 상향', () => {
    expect(judgeFov(o({ left: FOV_WARN_RATIO }))).toBe('ok');
    expect(judgeFov(o({ left: FOV_WARN_RATIO + 0.0001 }))).toBe('warn');
    expect(judgeFov(o({ right: FOV_BLOCK_RATIO }))).toBe('warn');
    expect(judgeFov(o({ right: FOV_BLOCK_RATIO + 0.0001 }))).toBe('block');
  });

  test('아래 이탈도 판정 대상', () => {
    expect(judgeFov(o({ bottom: 0.5 }))).toBe('block');
  });

  test('위쪽 이탈은 판정 제외', () => {
    expect(judgeFov(o({ top: 0.9 }))).toBe('ok');
  });

  test('좌·우·아래 중 최댓값 기준', () => {
    expect(judgeFov(o({ left: 0.01, right: 0.06, bottom: 0.02 }))).toBe('warn');
  });
});

describe('judgeWide', () => {
  test('경계 — 1.0·1.5 자체는 상향하지 않는다', () => {
    expect(judgeWide(FOV_WIDE_WARN)).toBe('ok');
    expect(judgeWide(FOV_WIDE_WARN + 0.001)).toBe('warn');
    expect(judgeWide(FOV_WIDE_BLOCK)).toBe('warn');
    expect(judgeWide(FOV_WIDE_BLOCK + 0.001)).toBe('block');
  });
});

describe('fovCause', () => {
  test('한쪽만 이탈하면 off_center (c15 실측값)', () => {
    expect(fovCause(o({ left: 0.028, right: 0.117 }))).toBe('off_center');
  });

  test('경계 — 작은 쪽·아래 3%는 off_center, 초과는 narrow', () => {
    expect(fovCause(o({ left: 0.03, right: 0.1, bottom: 0.03 }))).toBe('off_center');
    expect(fovCause(o({ left: 0.0301, right: 0.1 }))).toBe('narrow');
    expect(fovCause(o({ left: 0, right: 0.1, bottom: 0.0301 }))).toBe('narrow');
  });

  test('양쪽 이탈은 narrow (selfie_c09 실측값)', () => {
    expect(fovCause(o({ left: 0.11, right: 0.081, bottom: 0.04 }))).toBe('narrow');
  });
});

describe('assessFov', () => {
  const inside = { x: 100, y: 100, w: 500, h: 500 };

  test('프레임 안 + 원본 충분 → ok, cause 없음', () => {
    const r = assessFov(inside, IMG, 400, true);
    expect(r).toMatchObject({ verdict: 'ok', cause: null, magnification: 0.8, frame: inside, imageSize: IMG });
    expect(fovRejectionReason(r)).toBeNull();
  });

  test('배율 1.2 → wide warn', () => {
    expect(assessFov(inside, IMG, 600, true)).toMatchObject({ verdict: 'warn', cause: 'wide' });
  });

  test('배율 2 → wide block + 반려 코드', () => {
    const r = assessFov(inside, IMG, 1000, true);
    expect(r).toMatchObject({ verdict: 'block', cause: 'wide' });
    expect(fovRejectionReason(r)).toBe('fov_wide');
  });

  test('이탈 block이 wide warn보다 우선', () => {
    const r = assessFov({ x: -200, y: 0, w: 1000, h: 1100 }, IMG, 1100, true);
    expect(r.verdict).toBe('block');
    expect(fovRejectionReason(r)).toBe('fov_tight_side');
  });

  test('같은 수준이면 이탈을 먼저 말한다', () => {
    expect(assessFov({ x: -60, y: 0, w: 1000, h: 1000 }, IMG, 1100, true)).toMatchObject({ verdict: 'warn', cause: 'off_center' });
  });

  test('한쪽 이탈 block → fov_off_center', () => {
    expect(fovRejectionReason(assessFov({ x: 200, y: 0, w: 900, h: 900 }, IMG, 400, true))).toBe('fov_off_center');
  });
});

describe('warn 전용 스위치', () => {
  const far = { x: 100, y: 100, w: 500, h: 500 };

  test('현행 기본값은 warn 전용', () => {
    expect(FOV_BLOCK_ENABLED).toBe(false);
  });

  test('꺼져 있으면 block도 warn으로 내보내고 원 판정은 남긴다', () => {
    expect(assessFov(far, IMG, 1000, false)).toMatchObject({ verdict: 'warn', rawVerdict: 'block', cause: 'wide' });
  });

  test('켜면 block', () => {
    expect(assessFov(far, IMG, 1000, true)).toMatchObject({ verdict: 'block', rawVerdict: 'block' });
  });

  test('warn·ok는 스위치와 무관', () => {
    expect(assessFov(far, IMG, 600, false)).toMatchObject({ verdict: 'warn', rawVerdict: 'warn' });
    expect(assessFov(far, IMG, 400, false)).toMatchObject({ verdict: 'ok', rawVerdict: 'ok', cause: null });
  });
});

describe('fitCache', () => {
  test('저장·조회·만료', () => {
    const g = { frame: { x: 1 } };
    fitCacheSet('k', g, 1000);
    expect(fitCacheGet('k', 1000)).toBe(g);
    expect(fitCacheGet('k', 1000 + 10 * 60 * 1000 + 1)).toBeNull();
    expect(fitCacheGet('k', 1000)).toBeNull();
    expect(fitCacheGet('없음')).toBeNull();
  });
});
