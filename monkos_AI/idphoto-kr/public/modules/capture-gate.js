/**
 * capture-gate.js — 촬영 준비 판정 (순수 함수, DOM·네트워크 없음)
 *
 * 2026-09-29 신설 (DESIGN_20260929_idphoto_촬영게이트_코드화).
 * 종전: Gemini Live가 프레임을 보고 "좋아요"를 말해야 촬영 → 프리뷰 모델 퇴역으로 촬영 전면 불능(INCIDENT_20260929).
 * 현행: MediaPipe 얼굴 박스·키포인트를 숫자로 비교. 외부 호출 0.
 *
 * 임계값 출처: roll 8° · yaw 0.15 · 복수 얼굴 30% = portal precheck 코드 게이트(portal/server.js)와 동일.
 *              크기·위치 4종은 초기값 — dev 실기기로 조정한다.
 */

export const GATE_THRESHOLDS = {
  faceToGuideMin: 0.55,   // 얼굴 높이 / 가이드 높이 하한 (BlazeFace 박스는 눈썹~턱 ≈ 머리의 70%)
  faceToGuideMax: 0.95,   // 상한
  centerToleranceX: 0.20, // 가로 편차 허용 = 가이드 폭 × 이 값
  centerToleranceY: 0.20, // 세로 편차 허용 = 가이드 높이 × 이 값
  rollMaxDeg: 8,          // portal 동일
  yawMaxRatio: 0.15,      // portal 동일
  secondFaceRatio: 0.30,  // 두 번째 얼굴 면적이 첫 얼굴의 이 비율 이상이면 복수 얼굴
  stableFrames: 4,        // 연속 ok 프레임 수 (500ms × 4 = 2초)
};

/** 판정 사유 → 안내 문구. 화면이 좌우 반전이라 좌/우 표현은 쓰지 않는다. */
export const GATE_MESSAGES = {
  no_face: '얼굴이 보이지 않아요',
  multiple_faces: '한 분만 화면에 있어야 해요',
  too_small: '조금 더 가까이 와주세요',
  too_close: '조금 더 멀리 가주세요',
  off_center_x: '얼굴을 가운데로 맞춰주세요',
  off_center_y: '얼굴을 타원 안에 맞춰주세요',
  head_tilted: '고개를 똑바로 해주세요',
  not_frontal: '정면을 봐주세요',
  ok: '좋아요, 그대로 계세요',
  unavailable: '자동 안내를 사용할 수 없어요. 얼굴을 타원에 맞추고 직접 촬영해 주세요',
};

/**
 * object-fit: cover 로 표시된 비디오의 원본 좌표 → 화면(영역) 좌표 변환 계수.
 * @returns {{scale:number, offsetX:number, offsetY:number}}
 */
export function coverTransform(videoW, videoH, areaW, areaH) {
  const scale = Math.max(areaW / videoW, areaH / videoH);
  return {
    scale,
    offsetX: (areaW - videoW * scale) / 2,
    offsetY: (areaH - videoH * scale) / 2,
  };
}

/**
 * 가이드 사각형 (app.css #face-guide::before 와 동일 기하): 중심 X = 영역 폭/2, 상단 = 영역 높이 × 0.18, 190×250px.
 */
export function guideRect(areaW, areaH, guideW = 190, guideH = 250, topRatio = 0.18) {
  return { x: areaW / 2 - guideW / 2, y: areaH * topRatio, w: guideW, h: guideH };
}

/**
 * 판정.
 * @param {Object} input
 * @param {Array<{box:{x:number,y:number,width:number,height:number}, keypoints?:Array<{x:number,y:number}>}>} input.faces
 *        MediaPipe 검출 결과(원본 픽셀 좌표). keypoints 순서: 0 우안, 1 좌안, 2 코, 3 입, 4 우귀, 5 좌귀 (BlazeFace 규약).
 *        keypoints 가 정규화(0~1) 값이면 normalizedKeypoints=true 로 알린다.
 * @param {number} input.videoW  원본 프레임 폭
 * @param {number} input.videoH  원본 프레임 높이
 * @param {number} input.areaW   표시 영역 폭 (CSS px)
 * @param {number} input.areaH   표시 영역 높이 (CSS px)
 * @param {boolean} [input.normalizedKeypoints=true]
 * @param {Object} [thresholds=GATE_THRESHOLDS]
 * @returns {{ready:boolean, reason:string, metrics:Object}}
 */
export function evaluateGate(input, thresholds = GATE_THRESHOLDS) {
  const { faces, videoW, videoH, areaW, areaH, normalizedKeypoints = true } = input;
  const t = thresholds;
  const metrics = {};

  if (!faces || faces.length === 0) return { ready: false, reason: 'no_face', metrics };

  const first = faces[0].box;
  if (faces.length > 1) {
    const a1 = first.width * first.height;
    const b = faces[1].box;
    const a2 = b.width * b.height;
    metrics.secondFaceRatio = a1 > 0 ? +(a2 / a1).toFixed(3) : 1;
    if (metrics.secondFaceRatio >= t.secondFaceRatio) return { ready: false, reason: 'multiple_faces', metrics };
  }

  const { scale, offsetX, offsetY } = coverTransform(videoW, videoH, areaW, areaH);
  const guide = guideRect(areaW, areaH);

  // 얼굴 박스 → 화면 좌표
  const fx = first.x * scale + offsetX;
  const fy = first.y * scale + offsetY;
  const fw = first.width * scale;
  const fh = first.height * scale;
  const faceCx = fx + fw / 2;
  const faceCy = fy + fh / 2;
  const guideCx = guide.x + guide.w / 2;
  const guideCy = guide.y + guide.h / 2;

  metrics.faceToGuide = +(fh / guide.h).toFixed(3);
  metrics.dx = +((faceCx - guideCx) / guide.w).toFixed(3);
  metrics.dy = +((faceCy - guideCy) / guide.h).toFixed(3);

  if (metrics.faceToGuide < t.faceToGuideMin) return { ready: false, reason: 'too_small', metrics };
  if (metrics.faceToGuide > t.faceToGuideMax) return { ready: false, reason: 'too_close', metrics };
  if (Math.abs(metrics.dx) > t.centerToleranceX) return { ready: false, reason: 'off_center_x', metrics };
  if (Math.abs(metrics.dy) > t.centerToleranceY) return { ready: false, reason: 'off_center_y', metrics };

  // 키포인트 — roll / yaw (portal precheck 와 같은 식)
  const k = faces[0].keypoints;
  if (k && k.length >= 3) {
    const sx = normalizedKeypoints ? videoW : 1;
    const sy = normalizedKeypoints ? videoH : 1;
    const eyeR = { x: k[0].x * sx, y: k[0].y * sy };
    const eyeL = { x: k[1].x * sx, y: k[1].y * sy };
    const nose = { x: k[2].x * sx, y: k[2].y * sy };
    const rollDeg = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x) * 180 / Math.PI;
    const eyeSpan = Math.hypot(eyeL.x - eyeR.x, eyeL.y - eyeR.y) || 1;
    const yawRatio = (nose.x - (eyeL.x + eyeR.x) / 2) / eyeSpan;
    metrics.rollDeg = +rollDeg.toFixed(1);
    metrics.yawRatio = +yawRatio.toFixed(3);
    if (Math.abs(rollDeg) > t.rollMaxDeg) return { ready: false, reason: 'head_tilted', metrics };
    if (Math.abs(yawRatio) > t.yawMaxRatio) return { ready: false, reason: 'not_frontal', metrics };
  }

  return { ready: true, reason: 'ok', metrics };
}

/**
 * 연속 ok 카운터. 상태를 밖에서 들고 다니지 않도록 작은 클로저로 제공.
 * @returns {{push:(ready:boolean)=>boolean, reset:()=>void, count:()=>number}} push 는 임계 도달 순간 true
 */
export function createStabilityCounter(stableFrames = GATE_THRESHOLDS.stableFrames) {
  let n = 0;
  return {
    push(ready) {
      n = ready ? n + 1 : 0;
      return n >= stableFrames;
    },
    reset() { n = 0; },
    count() { return n; },
  };
}
