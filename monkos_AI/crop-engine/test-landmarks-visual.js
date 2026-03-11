// 478 랜드마크 빨간점 시각화 테스트
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import sharp from 'sharp';
import fs from 'fs';

await tf.setBackend('cpu');
await tf.ready();
console.log('backend:', tf.getBackend());

const INPUT = '/Users/macmini/Desktop/쌍아/main.jpg';
const OUTPUT = '/Users/macmini/Desktop/쌍아/landmarks_478.png';

// 1. 이미지 로드
const imageBuffer = fs.readFileSync(INPUT);
const meta = await sharp(imageBuffer).metadata();
console.log('원본:', meta.width, '×', meta.height);

// 2. 모델 로드
console.log('모델 로딩 중...');
const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
const detector = await faceLandmarksDetection.createDetector(model, {
  runtime: 'tfjs',
  refineLandmarks: true,
  maxFaces: 1,
});
console.log('모델 로드 완료');

// 3. 얼굴 감지
const { data, info } = await sharp(imageBuffer)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);
const t0 = Date.now();
const faces = await detector.estimateFaces(tensor);
tensor.dispose();
console.log('감지 시간:', Date.now() - t0, 'ms');

if (!faces || faces.length === 0) {
  console.log('얼굴 감지 실패');
  process.exit(1);
}

const keypoints = faces[0].keypoints;
console.log('랜드마크 수:', keypoints.length);

// 4. SVG로 빨간점 오버레이 생성
const DOT_R = Math.max(2, Math.round(Math.min(info.width, info.height) / 300));
const circles = keypoints.map((kp, i) => {
  const x = Math.round(kp.x);
  const y = Math.round(kp.y);
  return `<circle cx="${x}" cy="${y}" r="${DOT_R}" fill="red" opacity="0.8"/>`;
});

// 핵심 랜드마크는 더 크고 다른 색으로
const KEY_INDICES = {
  10: { color: 'lime', label: '#10 이마' },
  152: { color: 'cyan', label: '#152 턱' },
  159: { color: 'yellow', label: '#159 좌눈' },
  386: { color: 'yellow', label: '#386 우눈' },
  1: { color: 'magenta', label: '#1 코끝' },
  234: { color: 'orange', label: '#234 좌윤곽' },
  454: { color: 'orange', label: '#454 우윤곽' },
};

const keyCircles = Object.entries(KEY_INDICES).map(([idx, info]) => {
  const kp = keypoints[parseInt(idx)];
  const x = Math.round(kp.x);
  const y = Math.round(kp.y);
  return `<circle cx="${x}" cy="${y}" r="${DOT_R * 3}" fill="${info.color}" opacity="0.9" stroke="white" stroke-width="1"/>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
  ${circles.join('\n  ')}
  ${keyCircles.join('\n  ')}
</svg>`;

// 5. 원본 이미지에 오버레이 합성
const result = await sharp(imageBuffer)
  .resize(info.width, info.height, { fit: 'fill' })
  .composite([{
    input: Buffer.from(svg),
    top: 0,
    left: 0,
  }])
  .png()
  .toBuffer();

fs.writeFileSync(OUTPUT, result);
console.log(`\n✅ 저장: ${OUTPUT}`);
console.log(`  빨간점: ${keypoints.length}개 (전체 랜드마크)`);
console.log(`  핵심 마커: ${Object.keys(KEY_INDICES).length}개 (큰 컬러 원)`);
console.log(`  - 초록: #10 이마상단`);
console.log(`  - 시안: #152 턱`);
console.log(`  - 노랑: #159/#386 좌우눈`);
console.log(`  - 마젠타: #1 코끝`);
console.log(`  - 주황: #234/#454 좌우윤곽`);
