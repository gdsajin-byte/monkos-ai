/**
 * 눈 앵커 주입 — 실행: node --test lib/crop.eye-anchor.test.js (ORDER_20261104 유료크롭_눈45정합)
 * spec.eyeAnchor 유효(0.38~0.50) → 그 값 / 생략·범위 밖·비숫자 → 기본 0.43(60mm 이상 0.42)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlacement, resolveEyeAnchor, fitSpecGeometry, EYE_ANCHOR_MIN, EYE_ANCHOR_MAX } from './crop.js';

const KR = { frameW: 413, frameH: 531, frameHmm: 45, faceTargetMm: 33, faceMinMm: 32, hairMarginMm: 2 };
const TALL = { frameW: 600, frameH: 720, frameHmm: 60, faceTargetMm: 36, faceMinMm: 34 };
// 눈 (1000, 1000), 턱 1300 → 거울상 정수리 700. hairTop 없음(헤어 가드 미개입)
const LM = { chin: { y: 1300 }, leftEye: { x: 950, y: 1000 }, rightEye: { x: 1050, y: 1000 }, imageWidth: 2000, imageHeight: 3000 };

test('주입 0.45 → 목표·실측 앵커 0.45, 출처 spec', () => {
  const p = resolvePlacement(LM, { ...KR, eyeAnchor: 0.45 });
  assert.equal(p.eyeAnchorTarget, 0.45);
  assert.equal(p.eyeAnchorSource, 'spec');
  assert.ok(Math.abs(p.eyeAnchor - 0.45) < 0.003); // extractTop 반올림 1px
});

test('생략 → 기본 0.43(45mm)·0.42(60mm), 출처 default', () => {
  const a = resolvePlacement(LM, KR);
  assert.equal(a.eyeAnchorTarget, 0.43);
  assert.equal(a.eyeAnchorSource, 'default');
  const b = resolvePlacement(LM, TALL);
  assert.equal(b.eyeAnchorTarget, 0.42);
});

test('범위 밖·비숫자 → 기본값 (하위호환)', () => {
  for (const v of [0.3, 0.51, EYE_ANCHOR_MIN - 0.001, EYE_ANCHOR_MAX + 0.001, '0.45', null, NaN, Infinity]) {
    assert.deepEqual(resolveEyeAnchor({ ...KR, eyeAnchor: v }), { ratio: 0.43, source: 'default' }, String(v));
  }
  assert.equal(resolveEyeAnchor({ ...KR, eyeAnchor: EYE_ANCHOR_MIN }).source, 'spec'); // 경계 포함
  assert.equal(resolveEyeAnchor({ ...KR, eyeAnchor: EYE_ANCHOR_MAX }).source, 'spec');
});

test('앵커 0.45는 배율 불변, 틀만 위로 2%p(= 0.9mm)', () => {
  const a = resolvePlacement(LM, KR), b = resolvePlacement(LM, { ...KR, eyeAnchor: 0.45 });
  assert.equal(a.scale, b.scale);
  const dyMm = (a.extractTop - b.extractTop) / a.mmPx;
  assert.ok(Math.abs(dyMm - 0.9) < 0.1, `dy=${dyMm}`);
});

test('fit-spec 기하도 같은 규칙 — 생략 시 기존과 같다, meta에 출처', async () => {
  const r0 = await fitSpecGeometry(null, LM, KR, { hairScan: false });
  const r1 = await fitSpecGeometry(null, LM, { ...KR, eyeAnchor: 0.45 }, { hairScan: false });
  assert.equal(r0.meta.eyeAnchorSource, 'default');
  assert.equal(r1.meta.eyeAnchorSource, 'spec');
  assert.ok(r1.frame.y < r0.frame.y);
});
