/**
 * 기존 번역글 이미지 복구 스크립트
 * - autoTranslated: true 문서에서 원본 이미지 누락분 복원
 * - thumbnail 비어있으면 원본에서 복사
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/restore_translation_images.js
 *   cd monkos_AI/portal && node scripts/restore_translation_images.js --execute
 *
 * ⚠️ 프로덕션 Firestore에 직접 접근합니다.
 *   GCP 인증 필요: gcloud auth application-default login
 */

import { Firestore } from '@google-cloud/firestore';

const execute = process.argv.includes('--execute');
const db = new Firestore({ projectId: 'monkos' });
const blogCollection = db.collection('blog_posts');

/**
 * content에서 모든 이미지 URL 추출 (HTML <img> + markdown ![alt](url) 모두 대응)
 */
function extractImageUrls(content) {
  if (!content) return [];
  const urls = new Set();

  // HTML: <img src="..." /> or <img src='...'>
  const htmlMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
  for (const m of htmlMatches) urls.add(m[1]);

  // Markdown: ![alt](url)
  const mdMatches = content.matchAll(/!\[.*?\]\(([^)]+)\)/g);
  for (const m of mdMatches) urls.add(m[1]);

  return [...urls];
}

async function main() {
  console.log(`[restore_translation_images] ${execute ? 'EXECUTE' : 'DRY-RUN'} 시작\n`);

  // 1. autoTranslated 문서 전체 조회
  const snap = await blogCollection.where('autoTranslated', '==', true).get();
  console.log(`autoTranslated 문서: ${snap.docs.length}건\n`);

  const results = [];
  const batch = db.batch();
  let updateCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const originalSlug = data.originalSlug;

    if (!originalSlug) {
      console.log(`  [${doc.id}] ⚠️ originalSlug 없음 — 스킵`);
      continue;
    }

    // 원본 조회
    const origDoc = await blogCollection.doc(originalSlug).get();
    if (!origDoc.exists) {
      console.log(`  [${doc.id}] ⚠️ 원본 "${originalSlug}" 없음 — 스킵`);
      continue;
    }

    const origData = origDoc.data();
    const origUrls = extractImageUrls(origData.content);
    const transUrls = extractImageUrls(data.content);

    // 번역본 content에 없는 원본 이미지 URL 찾기
    const missingUrls = origUrls.filter(url => !data.content?.includes(url));

    // thumbnail 체크
    const hasThumb = data.thumbnail && data.thumbnail.trim() !== '';
    const origHasThumb = origData.thumbnail && origData.thumbnail.trim() !== '';
    const needThumb = !hasThumb && origHasThumb;

    if (missingUrls.length === 0 && !needThumb) continue;

    const entry = {
      slug: doc.id,
      originalSlug,
      missingImages: missingUrls.length,
      needThumbnail: needThumb,
    };
    results.push(entry);

    console.log(`  [${doc.id}]`);
    console.log(`    원본: ${originalSlug} (이미지 ${origUrls.length}개)`);
    console.log(`    번역본 이미지: ${transUrls.length}개`);
    console.log(`    누락 이미지: ${missingUrls.length}개`);
    if (needThumb) console.log(`    thumbnail: (empty) → 원본에서 복사`);

    if (execute) {
      const updates = {};

      if (missingUrls.length > 0) {
        const appendBlock = missingUrls.map(url => `![](${url})`).join('\n\n');
        updates.content = (data.content || '') + '\n\n' + appendBlock;
      }

      if (needThumb) {
        updates.thumbnail = origData.thumbnail;
      }

      updates.updatedAt = new Date().toISOString();
      batch.update(doc.ref, updates);
      updateCount++;

      // Firestore batch는 500건 제한
      if (updateCount % 499 === 0) {
        await batch.commit();
        console.log(`    → batch commit (${updateCount}건)`);
      }
    }
  }

  if (execute && updateCount > 0) {
    await batch.commit();
  }

  // 요약 보고
  console.log('\n========== 결과 요약 ==========');
  console.log(`검사 대상: ${snap.docs.length}건`);
  console.log(`복구 대상: ${results.length}건`);

  if (results.length > 0) {
    console.log('\n| slug | 원본 | 누락이미지 | 썸네일 |');
    console.log('|------|------|-----------|--------|');
    for (const r of results) {
      console.log(`| ${r.slug} | ${r.originalSlug} | ${r.missingImages}개 | ${r.needThumbnail ? '복사필요' : 'OK'} |`);
    }
  }

  console.log(`\n${execute ? `✅ ${updateCount}건 복구 완료` : `🔍 DRY-RUN 완료 — --execute로 실행`}`);
}

main().catch(err => {
  console.error('[restore_translation_images] 에러:', err.message);
  process.exit(1);
});
