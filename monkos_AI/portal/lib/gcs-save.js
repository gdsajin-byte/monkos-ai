import { Storage } from '@google-cloud/storage';
import { log } from './shared/config.js';

const CUSTOMER_GCS_BUCKET = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';
const storage = new Storage();
const bucket = storage.bucket(CUSTOMER_GCS_BUCKET);

function toBuffer(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(raw, 'base64');
}

export async function saveImages(service, userId, style, originalImage, generatedImage, extras) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const basePath = `${service}/${userId}`;
  const originalPath = `${basePath}/${timestamp}_${style}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_${style}_generated.png`;
  const meta = { userId, service, style, createdAt: new Date().toISOString() };

  const tasks = [
    bucket.file(originalPath).save(toBuffer(originalImage), { contentType: 'image/jpeg', metadata: meta }),
    bucket.file(generatedPath).save(toBuffer(generatedImage), { contentType: 'image/png', metadata: meta }),
  ];

  let t1RawPath = null;
  if (extras?.t1Raw) {
    t1RawPath = `${basePath}/${timestamp}_${style}_t1_raw.png`;
    tasks.push(bucket.file(t1RawPath).save(toBuffer(extras.t1Raw), { contentType: 'image/png', metadata: meta }));
  }

  await Promise.all(tasks);

  log(`[GCS] 병렬 저장 완료: ${basePath}/ (원본+생성${t1RawPath ? '+나노원본' : ''})`);
  return { originalPath, generatedPath, t1RawPath };
}
