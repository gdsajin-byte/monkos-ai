/**
 * GCS 이미지 저장 + 워터마크 합성 + Signed URL 발급
 * 버킷: monk-ai-images (환경변수 GCS_BUCKET)
 * 경로: service/idphoto/kr/{userId}/{timestamp}_{type}.{ext}
 */

import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

function log(msg, severity = 'INFO', meta = {}) {
  const entry = { severity, message: msg, timestamp: new Date().toISOString(), ...meta };
  if (process.env.K_SERVICE) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${entry.timestamp}] [${severity}] ${msg}`, meta.error || '');
  }
}

/**
 * base64 → Buffer 변환 (data:... 접두어 자동 strip)
 */
function toBuffer(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(raw, 'base64');
}

/**
 * 촬영 원본 + AI 생성 이미지를 GCS에 병렬 저장
 * @returns {{ generatedPath: string, originalPath: string }} GCS 경로
 */
export async function saveImages(userId, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basePath = `service/idphoto/kr/${userId}`;

  const originalPath = `${basePath}/${timestamp}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_generated.png`;
  const meta = { userId, source: 'idphoto-kr', createdAt: new Date().toISOString() };

  // 2건 병렬 업로드
  await Promise.all([
    bucket.file(originalPath).save(toBuffer(originalImage), { contentType: 'image/jpeg', metadata: meta }),
    bucket.file(generatedPath).save(toBuffer(generatedImage), { contentType: 'image/png', metadata: meta }),
  ]);

  log(`[GCS] 병렬 저장 완료: ${basePath}/ (원본+생성)`);
  return { originalPath, generatedPath };
}

/**
 * sharp로 서버단 워터마크 합성 — "MONKOS" 대각선 반복
 * @param {Buffer} imageBuffer - 원본 PNG buffer
 * @returns {Buffer} 워터마크 합성된 PNG buffer
 */
export async function addWatermark(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width;
  const h = meta.height;
  const fontSize = Math.max(Math.round(w / 8), 24);
  const gap = Math.round(h / 5);

  // SVG 워터마크 오버레이 생성
  const lines = [];
  for (let y = -h; y < h * 2; y += gap) {
    lines.push(`<text x="50%" y="${y}" font-size="${fontSize}" font-weight="bold" fill="white" fill-opacity="0.25" text-anchor="middle" transform="rotate(-30, ${w / 2}, ${h / 2})">MONKOS</text>`);
  }

  const watermarkSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${lines.join('')}</svg>`
  );

  return sharp(imageBuffer)
    .composite([{ input: watermarkSvg, gravity: 'center' }])
    .png()
    .toBuffer();
}

/**
 * 얼굴 좌표 기반 정밀 규격 크롭 (sharp)
 * 한국 여권: 35×45mm, 얼굴 25-35mm (56-78%), 상단여백 3-7mm
 * 반명함: 30×40mm
 * @param {Buffer} imageBuffer - 원본 PNG buffer
 * @param {string} format - 'passport' | 'id'
 * @param {Object|null} faceBox - Gemini 얼굴 좌표 (0-1 비율)
 * @returns {Buffer} 크롭된 PNG buffer
 */
export async function cropToSpec(imageBuffer, format = 'passport', faceBox = null) {
  const SPECS = {
    passport: { width: 413, height: 531, faceRatio: 0.65, topMargin: 0.08 },
    id: { width: 354, height: 472, faceRatio: 0.60, topMargin: 0.10 },
  };
  const spec = SPECS[format] || SPECS.passport;

  const meta = await sharp(imageBuffer).metadata();
  const srcW = meta.width;
  const srcH = meta.height;

  // 얼굴 좌표 없으면 상단 기준 커버 크롭 (폴백)
  if (!faceBox) {
    return sharp(imageBuffer)
      .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
  }

  // 얼굴 좌표 기반 정밀 크롭
  const { foreheadTop, chinBottom, faceLeft, faceRight } = faceBox;
  const faceH = (chinBottom - foreheadTop) * srcH;
  const faceCX = ((faceLeft + faceRight) / 2) * srcW;

  // 크롭 영역: 얼굴이 전체의 faceRatio를 차지하도록 계산
  const cropH = Math.round(faceH / spec.faceRatio);
  const cropW = Math.round(cropH * (spec.width / spec.height));

  // 상단 여백: 이마 위 topMargin 비율
  let top = Math.round((foreheadTop * srcH) - (cropH * spec.topMargin));
  let left = Math.round(faceCX - cropW / 2);

  // 경계 보정
  top = Math.max(0, Math.min(top, srcH - cropH));
  left = Math.max(0, Math.min(left, srcW - cropW));
  const width = Math.min(cropW, srcW - left);
  const height = Math.min(cropH, srcH - top);

  log(`[Crop] face=(${foreheadTop.toFixed(2)}-${chinBottom.toFixed(2)}) extract=${width}×${height} → ${spec.width}×${spec.height}`);

  return sharp(imageBuffer)
    .extract({ left, top, width, height })
    .resize(spec.width, spec.height)
    .png()
    .toBuffer();
}

/**
 * GCS에서 이미지 다운로드
 */
export async function downloadFromGCS(gcsPath) {
  const [buffer] = await bucket.file(gcsPath).download();
  return buffer;
}

/**
 * GCS 파일에 대한 Signed URL 발급 (24시간 만료)
 * @param {string} gcsPath - GCS 파일 경로
 * @returns {string} Signed URL
 */
export async function getSignedUrl(gcsPath) {
  const file = bucket.file(gcsPath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24시간
  });
  log(`[GCS] Signed URL 발급: ${gcsPath}`);
  return url;
}
