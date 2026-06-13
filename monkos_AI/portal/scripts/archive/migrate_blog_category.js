/**
 * 1회성 마이그레이션: blog_posts 카테고리 값 교체
 *
 * 매핑:
 *   증명사진     → 사진
 *   여권·비자    → 사진
 *   취업·이력서  → 사진
 *   헤어·메이크업 → 메이크업
 *   news         → news (유지)
 *   (빈값)       → (유지)
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/migrate_blog_category.js [--dry-run]
 *
 * ⚠️ 프로덕션 Firestore에 직접 접근합니다.
 *   GCP 인증 필요: gcloud auth application-default login
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({ projectId: 'monkos' });
const blogCollection = firestore.collection('blog_posts');
const dryRun = process.argv.includes('--dry-run');

const CATEGORY_MAP = {
  '증명사진': '사진',
  '여권·비자': '사진',
  '취업·이력서': '사진',
  '헤어·메이크업': '메이크업',
};

async function migrate() {
  console.log(`\n=== blog_posts 카테고리 마이그레이션 ${dryRun ? '(DRY RUN)' : ''} ===\n`);

  const snapshot = await blogCollection.get();
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const oldCat = data.category || '';
    const newCat = CATEGORY_MAP[oldCat];

    if (newCat) {
      console.log(`  [${doc.id}] "${oldCat}" → "${newCat}"`);
      if (!dryRun) {
        await blogCollection.doc(doc.id).update({ category: newCat });
      }
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\n총 ${snapshot.docs.length}건 중 ${updated}건 변경, ${skipped}건 유지${dryRun ? ' (DRY RUN — 실제 변경 없음)' : ''}\n`);
}

migrate().catch(err => {
  console.error('마이그레이션 에러:', err.message);
  process.exit(1);
});
