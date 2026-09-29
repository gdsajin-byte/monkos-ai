// capture-gate 단위 테스트 — node --test (DOM 불필요)
// 실행: node --test monkos_AI/idphoto-kr/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGate, coverTransform, guideRect, createStabilityCounter, GATE_THRESHOLDS } from '../public/modules/capture-gate.js';

// 기준 장면: 비디오 480×640, 영역 360×480 (cover → scale 0.75, 오프셋 0). 가이드 = x 85, y 86.4, 190×250.
const VIDEO = { videoW: 480, videoH: 640, areaW: 360, areaH: 480 };
const guide = guideRect(VIDEO.areaW, VIDEO.areaH);

/** 가이드 중심에 맞춘 얼굴 박스(원본 좌표) 생성. ratio = 얼굴높이/가이드높이 */
function centeredFace(ratio = 0.75, dxRatio = 0, dyRatio = 0) {
  const { scale } = coverTransform(VIDEO.videoW, VIDEO.videoH, VIDEO.areaW, VIDEO.areaH);
  const fh = guide.h * ratio / scale;
  const fw = fh * 0.8;
  const cx = (guide.x + guide.w / 2 + guide.w * dxRatio) / scale;
  const cy = (guide.y + guide.h / 2 + guide.h * dyRatio) / scale;
  return { x: cx - fw / 2, y: cy - fh / 2, width: fw, height: fh };
}
/** 정면·수평 키포인트 (정규화). rollDeg·yawRatio 로 변형 */
function keypoints({ rollDeg = 0, yawRatio = 0 } = {}) {
  const span = 0.15; // 눈 간격 (정규화 x)
  const rad = rollDeg * Math.PI / 180;
  const eyeR = { x: 0.5 - span / 2 * Math.cos(rad), y: 0.4 - span / 2 * Math.sin(rad) };
  const eyeL = { x: 0.5 + span / 2 * Math.cos(rad), y: 0.4 + span / 2 * Math.sin(rad) };
  const nose = { x: 0.5 + yawRatio * span, y: 0.5 };
  return [eyeR, eyeL, nose, { x: 0.5, y: 0.58 }, { x: 0.3, y: 0.42 }, { x: 0.7, y: 0.42 }];
}
const run = (faces) => evaluateGate({ faces, ...VIDEO });

test('얼굴 없음 → no_face', () => {
  assert.equal(run([]).reason, 'no_face');
  assert.equal(run(null).reason, 'no_face');
});

test('정상 → ok / ready', () => {
  const v = run([{ box: centeredFace(0.75), keypoints: keypoints() }]);
  assert.equal(v.reason, 'ok');
  assert.equal(v.ready, true);
});

test('키포인트 없어도 박스만으로 ok', () => {
  assert.equal(run([{ box: centeredFace(0.75) }]).reason, 'ok');
});

test('두 번째 얼굴 30% 이상 → multiple_faces, 미만이면 무시', () => {
  const main = centeredFace(0.75);
  const big = { ...main, width: main.width * 0.6, height: main.height * 0.6 }; // 면적 36%
  const small = { ...main, width: main.width * 0.5, height: main.height * 0.5 }; // 면적 25%
  assert.equal(run([{ box: main }, { box: big }]).reason, 'multiple_faces');
  assert.equal(run([{ box: main }, { box: small }]).reason, 'ok');
});

test('크기 경계 — too_small / too_close', () => {
  assert.equal(run([{ box: centeredFace(GATE_THRESHOLDS.faceToGuideMin - 0.01) }]).reason, 'too_small');
  assert.equal(run([{ box: centeredFace(GATE_THRESHOLDS.faceToGuideMin + 0.01) }]).reason, 'ok');
  assert.equal(run([{ box: centeredFace(GATE_THRESHOLDS.faceToGuideMax + 0.01) }]).reason, 'too_close');
});

test('위치 경계 — off_center_x / off_center_y', () => {
  assert.equal(run([{ box: centeredFace(0.75, 0.25, 0) }]).reason, 'off_center_x');
  assert.equal(run([{ box: centeredFace(0.75, -0.25, 0) }]).reason, 'off_center_x');
  assert.equal(run([{ box: centeredFace(0.75, 0, 0.25) }]).reason, 'off_center_y');
  assert.equal(run([{ box: centeredFace(0.75, 0.1, 0.1) }]).reason, 'ok');
});

test('기울기 — head_tilted (8° 초과), 정면 아님 — not_frontal (0.15 초과)', () => {
  const box = centeredFace(0.75);
  assert.equal(run([{ box, keypoints: keypoints({ rollDeg: 12 }) }]).reason, 'head_tilted');
  assert.equal(run([{ box, keypoints: keypoints({ rollDeg: -12 }) }]).reason, 'head_tilted');
  assert.equal(run([{ box, keypoints: keypoints({ rollDeg: 5 }) }]).reason, 'ok');
  assert.equal(run([{ box, keypoints: keypoints({ yawRatio: 0.3 }) }]).reason, 'not_frontal');
  assert.equal(run([{ box, keypoints: keypoints({ yawRatio: 0.1 }) }]).reason, 'ok');
});

test('판정 순서 — 크기 문제가 기울기보다 먼저', () => {
  const v = run([{ box: centeredFace(0.3), keypoints: keypoints({ rollDeg: 20 }) }]);
  assert.equal(v.reason, 'too_small');
});

test('cover 변환 — 세로로 긴 영역에서 가로 여백 음수 오프셋', () => {
  const t = coverTransform(640, 480, 360, 640); // 가로 비디오를 세로 영역에
  assert.equal(t.scale, 640 / 480);
  assert.ok(t.offsetX < 0 && Math.abs(t.offsetY) < 1e-9);
});

test('안정 카운터 — 연속 4회에 true, 중간 실패 시 리셋', () => {
  const c = createStabilityCounter(4);
  assert.equal(c.push(true), false);
  assert.equal(c.push(true), false);
  assert.equal(c.push(false), false);
  assert.equal(c.count(), 0);
  [true, true, true].forEach((r) => assert.equal(c.push(r), false));
  assert.equal(c.push(true), true);
});
