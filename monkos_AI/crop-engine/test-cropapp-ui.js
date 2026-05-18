// 크롭앱 UI 시뮬레이션 — 실제 FaceMesh 데이터로 프레임+타원+수치 시각화
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as fld from '@tensorflow-models/face-landmarks-detection';
import sharp from 'sharp';
import fs from 'fs';

await tf.setBackend('cpu'); await tf.ready();

const INPUT = '/Users/macmini/Desktop/쌍아/main.jpg';
const OUTPUT = '/Users/macmini/Desktop/쌍아/cropapp_test.png';

// 1. FaceMesh 감지
const buf = fs.readFileSync(INPUT);
const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);

console.log('모델 로딩...');
const det = await fld.createDetector(fld.SupportedModels.MediaPipeFaceMesh, {
  runtime: 'tfjs', refineLandmarks: true, maxFaces: 1,
});
const faces = await det.estimateFaces(tensor);
tensor.dispose();

const kp = faces[0].keypoints;

// 2. 7개 핵심 포인트 추출
const leftEye = kp[159];
const rightEye = kp[386];
const chin = kp[152];
const leftContour = kp[234];   // 좌 광대 최돌출
const rightContour = kp[454];  // 우 광대 최돌출

// 모퉁이 4개 (이마 좌우, 턱 좌우)
const foreheadLeft = kp[54];
const foreheadRight = kp[284];
const jawLeft = kp[172];
const jawRight = kp[397];

const eyeCenterX = (leftEye.x + rightEye.x) / 2;
const eyeCenterY = (leftEye.y + rightEye.y) / 2;

// 3. 정수리 추산 (1:1)
const eyeToChin = chin.y - eyeCenterY;
const crownY = eyeCenterY - eyeToChin;

console.log('\n=== 7 포인트 ===');
console.log('동공 좌:', leftEye.x.toFixed(0), leftEye.y.toFixed(0));
console.log('동공 우:', rightEye.x.toFixed(0), rightEye.y.toFixed(0));
console.log('턱끝:', chin.x.toFixed(0), chin.y.toFixed(0));
console.log('광대 좌:', leftContour.x.toFixed(0), leftContour.y.toFixed(0));
console.log('광대 우:', rightContour.x.toFixed(0), rightContour.y.toFixed(0));
console.log('정수리 추산:', eyeCenterX.toFixed(0), crownY.toFixed(0));

// 4. 35×45 프레임 계산
// 디폴트: 얼굴 34mm, 상단 5mm, 하단 6mm
const FRAME_W_MM = 35, FRAME_H_MM = 45;
const FACE_MM = 34, TOP_MM = 5, BOTTOM_MM = 6;

const faceH_px = chin.y - crownY;  // 정수리~턱 픽셀
const mmPerPx = FACE_MM / faceH_px;
const pxPerMm = faceH_px / FACE_MM;

const frameW_px = FRAME_W_MM * pxPerMm;
const frameH_px = FRAME_H_MM * pxPerMm;
const topMargin_px = TOP_MM * pxPerMm;
const bottomMargin_px = BOTTOM_MM * pxPerMm;

// 프레임 위치 (정수리 기준)
const frameTop = crownY - topMargin_px;
const frameLeft = eyeCenterX - frameW_px / 2;

const faceMm = (chin.y - crownY) * mmPerPx;
const eyePos = (eyeCenterY - frameTop) / frameH_px * 100;

console.log('\n=== 배치 ===');
console.log('프레임:', frameW_px.toFixed(0), '×', frameH_px.toFixed(0), 'px');
console.log('얼굴:', faceMm.toFixed(1), 'mm');
console.log('눈 위치:', eyePos.toFixed(1), '%');
console.log('상단 여백:', TOP_MM, 'mm');
console.log('하단 여백:', BOTTOM_MM, 'mm');

// 5. 스플라인 타원 경로 (8점)
const points = [
  { x: eyeCenterX, y: crownY },          // 0: 정수리 (상단)
  { x: foreheadRight.x, y: foreheadRight.y }, // 1: 이마 우
  { x: rightContour.x, y: rightContour.y },   // 2: 광대 우
  { x: jawRight.x, y: jawRight.y },           // 3: 턱 우
  { x: chin.x, y: chin.y },                   // 4: 턱끝 (하단)
  { x: jawLeft.x, y: jawLeft.y },             // 5: 턱 좌
  { x: leftContour.x, y: leftContour.y },     // 6: 광대 좌
  { x: foreheadLeft.x, y: foreheadLeft.y },    // 7: 이마 좌
];

// Catmull-Rom to Cubic Bezier 변환으로 부드러운 폐곡선 생성
function catmullRomToBezier(pts) {
  const n = pts.length;
  let d = 'M ' + pts[0].x + ' ' + pts[0].y + ' ';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
  }
  return d + 'Z';
}

const ellipsePath = catmullRomToBezier(points);

// 색상 판정
const faceColor = (faceMm >= 32 && faceMm <= 36) ? '#00ff88' : '#ff4444';
const eyeColor = (eyePos >= 40 && eyePos <= 46) ? '#00ff88' : '#ff4444';

// 6. SVG 생성
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
  <!-- 프레임 -->
  <rect x="${frameLeft}" y="${frameTop}" width="${frameW_px}" height="${frameH_px}"
    fill="none" stroke="white" stroke-width="3" opacity="0.8"/>

  <!-- 십자 가이드 -->
  <line x1="${frameLeft}" y1="${frameTop + frameH_px/2}" x2="${frameLeft + frameW_px}" y2="${frameTop + frameH_px/2}"
    stroke="white" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>
  <line x1="${frameLeft + frameW_px/2}" y1="${frameTop}" x2="${frameLeft + frameW_px/2}" y2="${frameTop + frameH_px}"
    stroke="white" stroke-width="1" stroke-dasharray="4,4" opacity="0.3"/>

  <!-- 스플라인 타원 -->
  <path d="${ellipsePath}" fill="none" stroke="#8888ff" stroke-width="2" stroke-dasharray="6,3" opacity="0.7"/>

  <!-- 정수리 핀 -->
  <circle cx="${eyeCenterX}" cy="${crownY}" r="10" fill="#00ff88" stroke="white" stroke-width="2"/>
  <text x="${eyeCenterX + 15}" y="${crownY + 5}" fill="#00ff88" font-size="20" font-weight="bold">정수리 ↕ 드래그</text>

  <!-- 턱 핀 -->
  <circle cx="${chin.x}" cy="${chin.y}" r="8" fill="#ff8800" stroke="white" stroke-width="2"/>
  <text x="${chin.x + 15}" y="${chin.y + 5}" fill="#ff8800" font-size="18">턱끝 (고정)</text>

  <!-- 눈 가이드선 -->
  <line x1="${frameLeft}" y1="${eyeCenterY}" x2="${frameLeft + frameW_px}" y2="${eyeCenterY}"
    stroke="${eyeColor}" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.6"/>
  <text x="${frameLeft + frameW_px + 10}" y="${eyeCenterY + 5}" fill="${eyeColor}" font-size="16">눈 ${eyePos.toFixed(1)}%</text>

  <!-- 정수리 가이드선 -->
  <line x1="${frameLeft}" y1="${crownY}" x2="${frameLeft + frameW_px}" y2="${crownY}"
    stroke="#00ff88" stroke-width="1" stroke-dasharray="4,2" opacity="0.5"/>

  <!-- 턱 가이드선 -->
  <line x1="${frameLeft}" y1="${chin.y}" x2="${frameLeft + frameW_px}" y2="${chin.y}"
    stroke="#ff8800" stroke-width="1" stroke-dasharray="4,2" opacity="0.5"/>

  <!-- 수치 표시 (정수리~턱) -->
  <line x1="${frameLeft - 30}" y1="${crownY}" x2="${frameLeft - 30}" y2="${chin.y}" stroke="${faceColor}" stroke-width="2"/>
  <line x1="${frameLeft - 35}" y1="${crownY}" x2="${frameLeft - 25}" y2="${crownY}" stroke="${faceColor}" stroke-width="2"/>
  <line x1="${frameLeft - 35}" y1="${chin.y}" x2="${frameLeft - 25}" y2="${chin.y}" stroke="${faceColor}" stroke-width="2"/>
  <text x="${frameLeft - 80}" y="${(crownY + chin.y) / 2 + 6}" fill="${faceColor}" font-size="22" font-weight="bold">${faceMm.toFixed(1)}mm</text>

  <!-- 하단 정보 박스 -->
  <rect x="${frameLeft}" y="${frameTop + frameH_px + 15}" width="${frameW_px}" height="80" rx="8" fill="rgba(0,0,0,0.7)"/>
  <text x="${frameLeft + 10}" y="${frameTop + frameH_px + 40}" fill="white" font-size="16">상단 ${TOP_MM}mm | 얼굴 ${faceMm.toFixed(1)}mm | 하단 ${BOTTOM_MM}mm</text>
  <text x="${frameLeft + 10}" y="${frameTop + frameH_px + 65}" fill="${eyeColor}" font-size="16">눈 위치: ${eyePos.toFixed(1)}% (허용 40~46%)</text>

  <!-- 8개 경유점 표시 -->
  ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${i === 0 ? '#00ff88' : i === 4 ? '#ff8800' : '#8888ff'}" opacity="0.8"/>`).join('\n  ')}

  <!-- 스케일 핸들 표시 (우하단) -->
  <rect x="${frameLeft + frameW_px - 30}" y="${frameTop + frameH_px - 30}" width="25" height="25" rx="4" fill="rgba(100,100,255,0.6)" stroke="white" stroke-width="1"/>
  <text x="${frameLeft + frameW_px - 24}" y="${frameTop + frameH_px - 12}" fill="white" font-size="14">⤡</text>
</svg>`;

const result = await sharp(buf)
  .resize(info.width, info.height, { fit: 'fill' })
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png().toBuffer();

fs.writeFileSync(OUTPUT, result);
console.log('\n✅ 저장:', OUTPUT);
