/**
 * GCS 비동기 이미지 저장 — fire-and-forget
 * 버킷: monk-ai-images (환경변수 GCS_BUCKET)
 * 경로: service/idphoto/kr/{userId}/{timestamp}_generated.png
 */

import { Storage } from '@google-cloud/storage';

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
 * AI 생성 이미지를 GCS에 비동기 저장
 * @param {string} userId - 사용자 ID
 * @param {string} base64Image - base64 인코딩 이미지 (data:image/png;base64,... 또는 raw base64)
 */
export async function saveGeneratedImage(userId, base64Image) {
  if (!userId) return;

  try {
    const raw = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const buffer = Buffer.from(raw, 'base64');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const gcsPath = `service/idphoto/kr/${userId}/${timestamp}_generated.png`;

    const file = bucket.file(gcsPath);
    await file.save(buffer, {
      contentType: 'image/png',
      metadata: {
        userId,
        source: 'idphoto-kr',
        createdAt: new Date().toISOString(),
      },
    });

    log(`[GCS] 저장 완료: ${gcsPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
  } catch (err) {
    log('[GCS] 저장 실패', 'WARNING', { error: err.message, userId });
  }
}
