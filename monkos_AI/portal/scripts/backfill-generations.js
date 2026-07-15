import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const BUCKET_NAME = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';

const storage = new Storage({ projectId: PROJECT_ID });
const bucket = storage.bucket(BUCKET_NAME);
const firestore = new Firestore({ projectId: PROJECT_ID });
const gensCol = firestore.collection('generations');

function parseTimestamp(raw) {
  // 2026-07-15T12-07-33 → 2026-07-15T12:07:33
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}T${m[2]}:${m[3]}:${m[4]}.000Z`;
  return new Date().toISOString();
}

async function main() {
  console.log(`[백필] 버킷 ${BUCKET_NAME} 스캔 시작...`);

  const [files] = await bucket.getFiles({ prefix: '' });
  console.log(`[백필] 총 ${files.length}개 파일 발견`);

  let created = 0, skipped = 0, errors = 0;

  for (const file of files) {
    if (!file.name.endsWith('_original.jpg')) continue;

    const parts = file.name.split('/');
    if (parts.length < 3) { skipped++; continue; }

    const service = parts[0];
    const userId = parts[1];
    const filename = parts[parts.length - 1];
    const match = filename.match(/^(.+?)_(.+)_original\.jpg$/);
    if (!match) { skipped++; continue; }

    const [, timestamp, style] = match;
    const generatedPath = file.name.replace('_original.jpg', '_generated.png');

    try {
      const existing = await gensCol
        .where('userId', '==', userId)
        .where('gcsOriginal', '==', file.name)
        .limit(1).get();
      if (!existing.empty) { skipped++; continue; }

      await gensCol.add({
        userId,
        service,
        style,
        slug: null,
        channel: 'monkos',
        gcsOriginal: file.name,
        gcsGenerated: generatedPath,
        gcsT1Raw: null,
        status: 'active',
        createdAt: parseTimestamp(timestamp),
      });
      created++;
      if (created % 50 === 0) console.log(`[백필] ${created}건 생성...`);
    } catch (e) {
      errors++;
      console.error(`[백필] 실패: ${file.name} — ${e.message}`);
    }
  }

  console.log(`[백필] 완료: 생성 ${created}건, 스킵 ${skipped}건, 에러 ${errors}건`);
}

main().catch(e => { console.error(e); process.exit(1); });
