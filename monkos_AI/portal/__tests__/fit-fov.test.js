/**
 * 화각 부족 판정 — 이탈량 계산·경계값·노출 범위 (ORDER_20261102 미국비자_화각부족판정)
 */
import { frameOutside, judgeFov, fovExposed, FOV_WARN_RATIO, FOV_BLOCK_RATIO } from '../lib/fit-fov.js';

const IMG = { width: 1000, height: 1000 };

describe('frameOutside', () => {
  test('프레임이 원본 안이면 전부 0', () => {
    expect(frameOutside({ x: 100, y: 100, w: 500, h: 500 }, IMG)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  });

  test('프레임이 원본과 정확히 일치하면 0 (경계)', () => {
    expect(frameOutside({ x: 0, y: 0, w: 1000, h: 1000 }, IMG)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  });

  test('네 방향을 프레임 크기 대비 비율로 계산', () => {
    expect(frameOutside({ x: -200, y: -100, w: 1600, h: 2000 }, IMG)).toEqual({
      top: 0.05, bottom: 0.45, left: 0.125, right: 0.25,
    });
  });
});

describe('judgeFov', () => {
  const o = (v) => ({ top: 0, bottom: 0, left: 0, right: 0, ...v });

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

describe('fovExposed', () => {
  test('us-visa만 노출', () => {
    expect(fovExposed('us-visa')).toBe(true);
    expect(fovExposed('kr-passport')).toBe(false);
    expect(fovExposed('us-passport')).toBe(false);
    expect(fovExposed(undefined)).toBe(false);
  });
});
