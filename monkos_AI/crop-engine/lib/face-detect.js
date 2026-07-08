import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import sharp from 'sharp';

let detector = null;

// 핵심 랜드마크 인덱스 (MediaPipe FaceMesh 478)
const LANDMARKS = {
  FOREHEAD_TOP: 10,   // 이마 상단 → 정수리 추산 기준
  CHIN:         152,   // 턱 최하단
  LEFT_EYE:     159,   // 좌눈 중심
  RIGHT_EYE:    386,   // 우눈 중심
  NOSE_TIP:     1,     // 코끝 (얼굴 중심 참조)
  LEFT_CONTOUR: 234,   // 좌측 윤곽
  RIGHT_CONTOUR: 454,  // 우측 윤곽
};

// 정수리 보정 계수: #10(이마 중간)에서 위로 얼굴높이의 N%만큼 올려 정수리 추산
// #10은 이마 상단이 아닌 이마 중간 — 헤어라인+볼륨 감안하여 충분히 올려야 함
const CROWN_OFFSET_RATIO = 0.30;

/**
 * FaceMesh 모델 초기화 (서버 기동 시 1회)
 */
export async function initFaceDetector() {
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  detector = await faceLandmarksDetection.createDetector(model, {
    runtime: 'tfjs',
    refineLandmarks: true,  // 478 랜드마크 (눈동자 포함)
    maxFaces: 1,
  });
  console.log('[FaceDetect] MediaPipe FaceMesh 모델 로드 완료');
}

/**
 * 이미지 버퍼에서 얼굴 랜드마크 추출
 *
 * 멀티스케일 재시도 (2026-07-07): FaceMesh는 동일 인물·유사 구도에서도 원치수에서
 * 간헐적으로 감지를 놓친다 (07-06 새벽 us-visa 실사고 — 비결정적 미스 → 커버 폴백 출고).
 * 원치수 실패 시 640px·448px 다운스케일로 재시도하고 좌표를 원치수로 환산한다.
 *
 * @param {Buffer} imageBuffer - PNG/JPEG 이미지 버퍼
 * @returns {object|null} 핵심 랜드마크 좌표 (원본 픽셀 단위) 또는 null
 */
export async function detectFace(imageBuffer) {
  if (!detector) {
    throw new Error('[FaceDetect] 모델 미초기화. initFaceDetector() 먼저 호출');
  }

  const origMeta = await sharp(imageBuffer).metadata();
  const tryWidths = [null, 640, 448]; // null = 원치수
  for (const w of tryWidths) {
    if (w && origMeta.width <= w) continue; // 이미 그보다 작으면 스킵
    const result = await detectAtScale(imageBuffer, w, origMeta);
    if (result) {
      if (w) console.log(`[FaceDetect] ${w}px 재시도 성공 (원치수 미스 폴백)`);
      return result;
    }
  }
  console.log('[FaceDetect] 얼굴 감지 실패 (멀티스케일 전부)');
  return null;
}

async function detectAtScale(imageBuffer, targetWidth, origMeta) {
  let tensor;
  try {
    let pipeline = sharp(imageBuffer).removeAlpha();
    if (targetWidth) pipeline = pipeline.resize({ width: targetWidth });
    const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

    tensor = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, 3]
    );

    const faces = await detector.estimateFaces(tensor);

    if (!faces || faces.length === 0) return null;

    // 다운스케일 감지 시 좌표를 원치수로 환산
    const ratio = targetWidth ? origMeta.width / info.width : 1;
    if (ratio !== 1) {
      for (const kp of faces[0].keypoints) { kp.x *= ratio; kp.y *= ratio; }
    }
    info.width = origMeta.width;
    info.height = origMeta.height;

    const keypoints = faces[0].keypoints;
    const forehead = keypoints[LANDMARKS.FOREHEAD_TOP];
    // IDPASS 정본 규칙 이식 (CropEngine.swift, 2026-07-07 완전분석 P3-12):
    // ① 눈 = 동공(iris) 우선 — refineLandmarks의 홍채 중심(좌 468~472, 우 473~477 평균), 폴백 눈꺼풀점
    // ② 턱 = 얼굴 윤곽의 최대 Y — 단일점(#152)은 얼굴형에 따라 이탈 (턱 오차는 정수리 1:1 미러로 2배 증폭)
    function irisCenter(startIdx, fallbackIdx) {
      const pts = [];
      for (let i = startIdx; i < startIdx + 5; i++) {
        if (keypoints[i] && Number.isFinite(keypoints[i].x)) pts.push(keypoints[i]);
      }
      if (pts.length >= 3) {
        return {
          x: pts.reduce((a, b) => a + b.x, 0) / pts.length,
          y: pts.reduce((a, b) => a + b.y, 0) / pts.length,
        };
      }
      return keypoints[fallbackIdx];
    }
    const leftEye = irisCenter(468, LANDMARKS.LEFT_EYE);
    const rightEye = irisCenter(473, LANDMARKS.RIGHT_EYE);
    const JAW_IDX = [152, 148, 176, 149, 150, 377, 400, 378, 379];
    let chin = keypoints[LANDMARKS.CHIN];
    for (const ji of JAW_IDX) {
      const kp = keypoints[ji];
      if (kp && Number.isFinite(kp.y) && kp.y > chin.y) chin = kp;
    }
    const noseTip = keypoints[LANDMARKS.NOSE_TIP];
    const leftContour = keypoints[LANDMARKS.LEFT_CONTOUR];
    const rightContour = keypoints[LANDMARKS.RIGHT_CONTOUR];

    // 정수리 추산: 이마 상단에서 (이마~턱 거리 × 보정계수)만큼 위로
    const faceHeight = chin.y - forehead.y;
    const crownY = forehead.y - (faceHeight * CROWN_OFFSET_RATIO);

    // === 게이트 수치 (2026-07-08 검수 코드화 — 하드컷 없이 수치만 반환, 임계는 실측 후) ===
    // 입벌림 = 안쪽 입술 간격 / 입 폭 (닫힘 ~0.05, 치아 노출 웃음 0.15+)
    // 눈뜸 = 눈꺼풀 수직 간격 / 눈 가로폭 (열림 0.25~0.35, 감김 <0.12)
    // roll = 눈선 기울기(도), yaw = 코끝의 눈-입 중심선 이탈 / 눈 간격 (정면 ~0)
    function gateMetrics() {
      const p = (i) => keypoints[i];
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const g = {};
      try {
        const mouthW = dist(p(61), p(291));
        g.mouthOpen = +(Math.abs(p(14).y - p(13).y) / (mouthW || 1)).toFixed(3);
        g.eyeOpenL = +(Math.abs(p(145).y - p(159).y) / (dist(p(33), p(133)) || 1)).toFixed(3);
        g.eyeOpenR = +(Math.abs(p(374).y - p(386).y) / (dist(p(362), p(263)) || 1)).toFixed(3);
        const eyeSpan = dist(leftEye, rightEye) || 1;
        g.rollDeg = +((Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI).toFixed(1);
        const midX = (leftEye.x + rightEye.x + p(61).x + p(291).x) / 4;
        g.yawRatio = +((noseTip.x - midX) / eyeSpan).toFixed(3);
        const dL = noseTip.x - leftContour.x, dR = rightContour.x - noseTip.x;
        g.contourAsym = +(((dR - dL) / ((dR + dL) || 1))).toFixed(3);
      } catch { /* 일부 포인트 결손 시 가용 값만 */ }
      return g;
    }

    const result = {
      crown:        { x: forehead.x, y: crownY },
      chin:         { x: chin.x, y: chin.y },
      leftEye:      { x: leftEye.x, y: leftEye.y },
      rightEye:     { x: rightEye.x, y: rightEye.y },
      noseTip:      { x: noseTip.x, y: noseTip.y },
      leftContour:  { x: leftContour.x, y: leftContour.y },
      rightContour: { x: rightContour.x, y: rightContour.y },
      gate:         gateMetrics(),
      imageWidth:   info.width,
      imageHeight:  info.height,
    };

    console.log(`[FaceDetect] 성공: crown=(${crownY.toFixed(0)}), chin=(${chin.y.toFixed(0)}), faceH=${faceHeight.toFixed(0)}px`);
    return result;
  } catch (err) {
    console.error(`[FaceDetect] 에러: ${err.message}`);
    return null;
  } finally {
    if (tensor) tensor.dispose();
  }
}
