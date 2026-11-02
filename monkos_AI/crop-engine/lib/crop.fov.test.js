/**
 * fitSpecGeometry outside 확장 — 실행: node --test lib/crop.fov.test.js (ORDER_20261102 미국비자_화각부족판정)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { fitSpecGeometry } from './crop.js';

const SPEC = { frameW: 600, frameH: 600, frameHmm: 51, faceTargetMm: 26, faceMinMm: 25 };

// 눈 중심 (cx, 400), 턱 500 → facePx 200, scale = (26 × 600/51) / 200 ≈ 1.529, 프레임 ≈ 392px 정사각
function lm(width, height, cx) {
  return { chin: { y: 500 }, leftEye: { x: cx - 40, y: 400 }, rightEye: { x: cx + 40, y: 400 }, imageWidth: width, imageHeight: height };
}

test('넉넉한 원본 — 네 방향 0', async () => {
  const r = await fitSpecGeometry(null, lm(2000, 2000, 1000), SPEC);
  assert.deepEqual(r.outside, { top: 0, bottom: 0, left: 0, right: 0 });
  assert.equal(r.meta.padded, false);
});

test('경계 — 원본 폭이 프레임과 같으면 좌우 0', async () => {
  const fit = await fitSpecGeometry(null, lm(2000, 2000, 1000), SPEC);
  const w = Math.ceil(fit.frame.w);
  const r = await fitSpecGeometry(null, lm(w, 2000, w / 2), SPEC);
  assert.equal(r.outside.left, 0);
  assert.equal(r.outside.right, 0);
});

test('좁은 원본 — 좌우 이탈이 프레임 폭 대비로 대칭 계측', async () => {
  const r = await fitSpecGeometry(null, lm(300, 2000, 150), SPEC);
  const expected = (r.frame.w - 300) / 2 / r.frame.w;
  assert.ok(Math.abs(r.outside.left - expected) < 0.001);
  assert.ok(Math.abs(r.outside.right - expected) < 0.001);
  assert.equal(r.meta.padded, true);
});

test('낮은 원본 — 아래 이탈 계측', async () => {
  const r = await fitSpecGeometry(null, lm(2000, 520, 1000), SPEC);
  assert.ok(r.outside.bottom >= 0);
  assert.equal(r.outside.top, 0);
  assert.equal(r.outside.bottom, +(Math.max(0, r.frame.y + r.frame.h - 520) / r.frame.h).toFixed(4));
});
