import { Storage } from '@google-cloud/storage';
import { log } from './shared/config.js';

const CUSTOMER_GCS_BUCKET = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';
const storage = new Storage();
const bucket = storage.bucket(CUSTOMER_GCS_BUCKET);

function toBuffer(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(raw, 'base64');
}

export async function saveImages(service, userId, style, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const basePath = `${service}/${userId}`;
  const originalPath = `${basePath}/${timestamp}_${style}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_${style}_generated.png`;
  const meta = { userId, service, style, createdAt: new Date().toISOString() };

  await Promise.all([
    bucket.file(originalPath).save(toBuffer(originalImage), { contentType: 'image/jpeg', metadata: meta }),
    bucket.file(generatedPath).save(toBuffer(generatedImage), { contentType: 'image/png', metadata: meta }),
  ]);

  log(`[GCS] 병렬 저장 완료: ${basePath}/ (원본+생성)`);
  return { originalPath, generatedPath };
}
