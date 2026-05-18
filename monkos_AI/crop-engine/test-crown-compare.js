import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import * as fld from '@tensorflow-models/face-landmarks-detection';
import sharp from 'sharp';
import fs from 'fs';

await tf.setBackend('cpu'); await tf.ready();
const buf = fs.readFileSync('/Users/macmini/Desktop/쌍아/main.jpg');
const {data, info} = await sharp(buf).removeAlpha().raw().toBuffer({resolveWithObject:true});
const tensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3]);
const det = await fld.createDetector(fld.SupportedModels.MediaPipeFaceMesh, {runtime:'tfjs',refineLandmarks:true,maxFaces:1});
const faces = await det.estimateFaces(tensor);
tensor.dispose();
const kp = faces[0].keypoints;

const chin = kp[152];
const forehead = kp[10];
const eyeY = (kp[159].y + kp[386].y) / 2;

const crownV2 = eyeY - (chin.y - eyeY);
const crownEllipse = 204.4;
const crownMid = forehead.y - (eyeY - forehead.y);

const distMidToForehead = (forehead.y - crownMid).toFixed(0);
const distForeheadToEye = (eyeY - forehead.y).toFixed(0);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
  <!-- 3가지 정수리 추산선 -->
  <line x1="350" y1="${crownV2}" x2="1050" y2="${crownV2}" stroke="red" stroke-width="2" stroke-dasharray="6,3"/>
  <text x="1060" y="${crownV2+5}" fill="red" font-size="20">v2 1:1 (${crownV2.toFixed(0)}px)</text>

  <line x1="350" y1="${crownMid}" x2="1050" y2="${crownMid}" stroke="lime" stroke-width="3"/>
  <text x="1060" y="${crownMid+5}" fill="lime" font-size="20">#10 중간점 (${crownMid.toFixed(0)}px)</text>

  <line x1="350" y1="${crownEllipse}" x2="1050" y2="${crownEllipse}" stroke="cyan" stroke-width="2" stroke-dasharray="6,3"/>
  <text x="1060" y="${crownEllipse+5}" fill="cyan" font-size="20">타원 (204px)</text>

  <!-- 기준점 -->
  <circle cx="${forehead.x}" cy="${forehead.y}" r="8" fill="lime" opacity="0.9"/>
  <text x="${forehead.x+15}" y="${forehead.y+5}" fill="lime" font-size="18">#10 이마</text>

  <circle cx="${(kp[159].x+kp[386].x)/2}" cy="${eyeY}" r="8" fill="yellow" opacity="0.9"/>
  <text x="${(kp[159].x+kp[386].x)/2+15}" y="${eyeY+5}" fill="yellow" font-size="18">눈</text>

  <circle cx="${chin.x}" cy="${chin.y}" r="8" fill="cyan" opacity="0.9"/>
  <text x="${chin.x+15}" y="${chin.y+5}" fill="cyan" font-size="18">#152 턱</text>

  <!-- 좌측 거리 표시 -->
  <line x1="400" y1="${crownMid}" x2="400" y2="${forehead.y}" stroke="white" stroke-width="2"/>
  <text x="355" y="${(crownMid+forehead.y)/2+5}" fill="white" font-size="16">${distMidToForehead}</text>

  <line x1="400" y1="${forehead.y}" x2="400" y2="${eyeY}" stroke="white" stroke-width="2"/>
  <text x="355" y="${(forehead.y+eyeY)/2+5}" fill="white" font-size="16">${distForeheadToEye}</text>
</svg>`;

const result = await sharp(buf)
  .resize(info.width, info.height, {fit:'fill'})
  .composite([{input: Buffer.from(svg), top:0, left:0}])
  .png().toBuffer();

fs.writeFileSync('/Users/macmini/Desktop/쌍아/crown_compare_3.png', result);
console.log('저장 완료');
