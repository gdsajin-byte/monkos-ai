/**
 * GCS 画像保存 + ウォーターマーク合成 + Signed URL 発行
 * バケット: monk-ai-images (環境変数 GCS_BUCKET)
 * パス: service/idphoto/jp/{userId}/{timestamp}_{type}.{ext}
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
 * base64 → Buffer 変換 (data:... プレフィックス自動strip)
 */
function toBuffer(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(raw, 'base64');
}

/**
 * 撮影原本 + AI生成画像をGCSに並列保存
 * @returns {{ generatedPath: string, originalPath: string }} GCSパス
 */
export async function saveImages(userId, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basePath = `service/idphoto/jp/${userId}`;

  const originalPath = `${basePath}/${timestamp}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_generated.png`;
  const meta = { userId, source: 'idphoto-jp', createdAt: new Date().toISOString() };

  // 2件並列アップロード
  await Promise.all([
    bucket.file(originalPath).save(toBuffer(originalImage), { contentType: 'image/jpeg', metadata: meta }),
    bucket.file(generatedPath).save(toBuffer(generatedImage), { contentType: 'image/png', metadata: meta }),
  ]);

  log(`[GCS] 並列保存完了: ${basePath}/ (原本+生成)`);
  return { originalPath, generatedPath };
}

/**
 * sharpでサーバー側ウォーターマーク合成 — "MONKOS" 対角線反復
 * @param {Buffer} imageBuffer - 原本 PNG buffer
 * @returns {Buffer} ウォーターマーク合成済み PNG buffer
 */
export async function addWatermark(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width;
  const h = meta.height;
  const fontSize = Math.max(Math.round(w / 8), 24);
  const gap = Math.round(h / 5);

  // SVG ウォーターマークオーバーレイ生成
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
 * 顔座標基準 精密規格クロップ (sharp)
 * 日本パスポート: 35×45mm, 顔25-35mm (56-78%), 上部余白3-7mm
 * 証明写真: 30×40mm
 * @param {Buffer} imageBuffer - 原本 PNG buffer
 * @param {string} format - 'passport' | 'id'
 * @param {Object|null} faceBox - Gemini 顔座標 (0-1 比率)
 * @returns {Buffer} クロップ済み PNG buffer
 */
export async function cropToSpec(imageBuffer, format = 'passport', faceBox = null) {
  const SPECS = {
    passport: { width: 413, height: 531, faceRatio: 0.75, topMargin: 0.12 },
    id: { width: 354, height: 472, faceRatio: 0.65, topMargin: 0.10 },
  };
  const spec = SPECS[format] || SPECS.passport;

  const meta = await sharp(imageBuffer).metadata();
  const srcW = meta.width;
  const srcH = meta.height;

  // 顔座標なし → 上部基準カバークロップ (フォールバック)
  if (!faceBox) {
    return sharp(imageBuffer)
      .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer();
  }

  // 頭頂〜顎基準 精密クロップ
  const { headTop, chinBottom, faceLeft, faceRight } = faceBox;
  const faceH = (chinBottom - headTop) * srcH;
  const faceCX = ((faceLeft + faceRight) / 2) * srcW;

  // クロップ領域: 頭部が全体のfaceRatio を占めるよう計算
  const cropH = Math.round(faceH / spec.faceRatio);
  const cropW = Math.round(cropH * (spec.width / spec.height));

  // 上部余白: 頭頂上 topMargin 比率
  let top = Math.round((headTop * srcH) - (cropH * spec.topMargin));
  let left = Math.round(faceCX - cropW / 2);

  // 境界補正
  top = Math.max(0, Math.min(top, srcH - cropH));
  left = Math.max(0, Math.min(left, srcW - cropW));
  const width = Math.min(cropW, srcW - left);
  const height = Math.min(cropH, srcH - top);

  log(`[Crop] head=(${headTop.toFixed(2)}-${chinBottom.toFixed(2)}) extract=${width}×${height} → ${spec.width}×${spec.height}`);

  return sharp(imageBuffer)
    .extract({ left, top, width, height })
    .resize(spec.width, spec.height)
    .png()
    .toBuffer();
}

/**
 * GCSから画像ダウンロード
 */
export async function downloadFromGCS(gcsPath) {
  const [buffer] = await bucket.file(gcsPath).download();
  return buffer;
}

/**
 * GCSファイルのSigned URL発行 (24時間有効)
 * @param {string} gcsPath - GCSファイルパス
 * @returns {string} Signed URL
 */
export async function getSignedUrl(gcsPath) {
  const file = bucket.file(gcsPath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24時間
  });
  log(`[GCS] Signed URL 発行: ${gcsPath}`);
  return url;
}
