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
 * @param {Buffer} imageBuffer - PNG/JPEG 이미지 버퍼
 * @returns {object|null} 핵심 랜드마크 좌표 (픽셀 단위) 또는 null
 */
export async function detectFace(imageBuffer) {
  if (!detector) {
    throw new Error('[FaceDetect] 모델 미초기화. initFaceDetector() 먼저 호출');
  }

  let tensor;
  try {
    // sharp → raw RGB 픽셀 → tf.tensor3d
    const { data, info } = await sharp(imageBuffer)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    tensor = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, 3]
    );

    const faces = await detector.estimateFaces(tensor);

    if (!faces || faces.length === 0) {
      console.log('[FaceDetect] 얼굴 감지 실패');
      return null;
    }

    const keypoints = faces[0].keypoints;
    const forehead = keypoints[LANDMARKS.FOREHEAD_TOP];
    const chin = keypoints[LANDMARKS.CHIN];
    const leftEye = keypoints[LANDMARKS.LEFT_EYE];
    const rightEye = keypoints[LANDMARKS.RIGHT_EYE];
    const noseTip = keypoints[LANDMARKS.NOSE_TIP];
    const leftContour = keypoints[LANDMARKS.LEFT_CONTOUR];
    const rightContour = keypoints[LANDMARKS.RIGHT_CONTOUR];

    // 정수리 추산: 이마 상단에서 (이마~턱 거리 × 보정계수)만큼 위로
    const faceHeight = chin.y - forehead.y;
    const crownY = forehead.y - (faceHeight * CROWN_OFFSET_RATIO);

    const result = {
      crown:        { x: forehead.x, y: crownY },
      chin:         { x: chin.x, y: chin.y },
      leftEye:      { x: leftEye.x, y: leftEye.y },
      rightEye:     { x: rightEye.x, y: rightEye.y },
      noseTip:      { x: noseTip.x, y: noseTip.y },
      leftContour:  { x: leftContour.x, y: leftContour.y },
      rightContour: { x: rightContour.x, y: rightContour.y },
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
