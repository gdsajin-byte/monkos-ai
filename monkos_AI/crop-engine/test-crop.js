// CPU 백엔드 + face-detect.js 모듈 사용 (CROWN_OFFSET 반영)
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import sharp from 'sharp';
import fs from 'fs';

// face-detect.js 내부에서 tfjs를 사용하므로, 백엔드 먼저 설정
await tf.setBackend('cpu');
await tf.ready();
console.log('backend:', tf.getBackend());

// 모듈 import (백엔드 설정 후)
const { initFaceDetector, detectFace } = await import('./lib/face-detect.js');
const { cropToFrame } = await import('./lib/crop.js');

const imageBuffer = fs.readFileSync('/Users/jeong-kyushin/Desktop/쌍아/IMG_4568.JPG');
const meta = await sharp(imageBuffer).metadata();
console.log('원본:', meta.width, '×', meta.height);

console.log('모델 로딩 중...');
await initFaceDetector();

console.log('얼굴 감지 중...');
const t0 = Date.now();
const landmarks = await detectFace(imageBuffer);
console.log('감지 시간:', Date.now() - t0, 'ms');

if (landmarks) {
  console.log('정수리:', landmarks.crown);
  console.log('턱:', landmarks.chin);
  console.log('얼굴높이:', (landmarks.chin.y - landmarks.crown.y).toFixed(0), 'px');

  // 여권 크롭
  const { buffer: passportBuf, meta: pMeta } = await cropToFrame(imageBuffer, landmarks, { format: 'passport', country: 'KR' });
  fs.writeFileSync('/Users/jeong-kyushin/Desktop/쌍아/crop_passport_kr.png', passportBuf);
  console.log('여권 크롭:', pMeta);

  // 반명함 크롭
  const { buffer: idBuf, meta: iMeta } = await cropToFrame(imageBuffer, landmarks, { format: 'id', country: 'KR' });
  fs.writeFileSync('/Users/jeong-kyushin/Desktop/쌍아/crop_id_kr.png', idBuf);
  console.log('반명함 크롭:', iMeta);

  console.log('\n저장: ~/Desktop/쌍아/crop_passport_kr.png, crop_id_kr.png');
} else {
  console.log('얼굴 감지 실패');
}
