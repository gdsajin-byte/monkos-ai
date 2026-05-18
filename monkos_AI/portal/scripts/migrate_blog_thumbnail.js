/**
 * 1회성 마이그레이션: published 블로그 글 중 thumbnail 빈값 → content 첫 이미지 추출
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/migrate_blog_thumbnail.js [--dry-run]
 *
 * ⚠️ 프로덕션 Firestore에 직접 접근합니다.
 *   GCP 인증 필요: gcloud auth application-default login
 */

import { Firestore } from '@google-cloud/firestore';

const dryRun = process.argv.includes('--dry-run');
const db = new Firestore({ projectId: 'monkos' });
const blogCollection = db.collection('blog_posts');

async function main() {
  console.log(`[migrate_blog_thumbnail] ${dryRun ? '(DRY RUN)' : 'LIVE'} 시작`);

  const snap = await blogCollection.where('published', '==', true).get();
  console.log(`[migrate_blog_thumbnail] published 문서: ${snap.docs.length}건`);

  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const hasThumb = data.thumbnail && data.thumbnail.trim() !== '';
    const imgMatch = (data.content || '').match(/<img[^>]+src="([^"]+)"/);

    console.log(`  [${doc.id}] thumbnail: "${hasThumb ? data.thumbnail.substring(0, 60) + '...' : '(empty)'}" | content 첫img: ${imgMatch ? imgMatch[1].substring(0, 60) : 'none'}`);

    if (!hasThumb && imgMatch) {
      if (!dryRun) {
        batch.update(doc.ref, { thumbnail: imgMatch[1] });
      }
      count++;
      console.log(`    → ${dryRun ? '[DRY] would update' : 'UPDATING'}: ${imgMatch[1].substring(0, 80)}`);
    }
  }

  if (count > 0 && !dryRun) {
    await batch.commit();
  }

  console.log(`\n[migrate_blog_thumbnail] 완료: ${count}건 ${dryRun ? '대상 (미적용)' : '소급 완료'}`);
}

main().catch(err => {
  console.error('[migrate_blog_thumbnail] 에러:', err.message);
  process.exit(1);
});
