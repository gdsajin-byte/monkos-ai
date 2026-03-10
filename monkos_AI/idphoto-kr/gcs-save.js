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
 * 서버단 규격 크롭 (sharp) — 얼굴 상단 기준
 * @param {Buffer} imageBuffer - 원본 PNG buffer
 * @param {string} format - 'passport' | 'id'
 * @returns {Buffer} 크롭된 PNG buffer
 */
export async function cropToSpec(imageBuffer, format = 'passport') {
  // 300 DPI 기준 픽셀 (35×45mm, 30×40mm)
  const SPECS = {
    passport: { width: 413, height: 531 },
    id: { width: 354, height: 472 },
  };
  const spec = SPECS[format] || SPECS.passport;

  return sharp(imageBuffer)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();
}

/**
 * GCS에서 이미지 다운로드 + 규격 크롭 + 원본 Signed URL 발급
 * @returns {{ croppedBuffer: Buffer, originalUrl: string }}
 */
export async function downloadAndCrop(gcsPath, format) {
  const [buffer] = await bucket.file(gcsPath).download();
  const [croppedBuffer, originalUrl] = await Promise.all([
    cropToSpec(buffer, format),
    getSignedUrl(gcsPath),
  ]);
  log(`[GCS] 크롭+URL 발급 완료: ${gcsPath} (${format})`);
  return { croppedBuffer, originalUrl };
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
