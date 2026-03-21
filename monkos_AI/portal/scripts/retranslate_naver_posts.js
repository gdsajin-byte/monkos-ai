/**
 * 네이버 복구 콘텐츠 재번역 (Phase 4)
 * 막내1이 복구한 KO 원본 15건 → EN/JA 재번역
 *
 * Usage: node scripts/retranslate_naver_posts.js
 */
import { firestore, log } from '../lib/shared/config.js';
import { translateAndSaveBlogPost } from '../lib/cms/translate.js';

const DELAY_MS = 500;
const blogCollection = firestore.collection('blog_posts');

const SLUGS = [
  '20년-사진작가가-ai로-만든-증명사진-서비스-monkosai',
  'ai에-대한-서론',
  'monkos-ai-가-탄생했습니다',
  'untitled-mmqwqq8i',
  '내-손안에-사진관-monkosai-사용법을-소개합니다',
  '사진관-12년-ai-증명사진-앱개발',
  '사진관-가기-전에-꼭-읽어야-할-취준생-헤어메이크업-가이드-2026',
  '증명사진-메이크업-취업-여권-비자-한-장의-사진이-첫인상을-결정한다',
  '증명사진-면접-헤어에-도움이-되는-자연스러운-볼륨-살리는-방법',
  '증명사진-잘-나오는-표정-포즈-연습법-첫인상은-표정이-만든다',
  '증명사진-헤어스타일-메이크업-다음은-헤어-인상을-완성하는-마지막-한-수',
  '취업-증명사진-의상-컬러-선택법-옷-한-벌이-당락을-바꾼다-mmxg1kyp',
  '한-연구원-매거진-취업사진과-면접에-필요한-의상-면접머리-자신감의-시작은-나다운-모습',
  '한번쯤-고민하게-되는-아기-여권사진-사진관-안-가도-집에서-찍은-이야기-mmxg1mrn',
  '한연구원-칼럼-증명사진-면접헤어메이크업에-중요한-각질제거-청결-신뢰감의-시작',
];

console.log('\n=== 네이버 복구 콘텐츠 재번역 (15건 × EN/JA) ===\n');

const stats = { success: 0, errors: [] };

for (const slug of SLUGS) {
  try {
    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists) {
      stats.errors.push(`${slug}: 문서 없음`);
      console.log(`  ❌ ${slug} — 문서 없음`);
      continue;
    }

    const data = doc.data();
    console.log(`  [${stats.success + stats.errors.length + 1}/15] ${slug.substring(0, 50)}`);
    console.log(`    번역 중... (content: ${(data.content || '').length}자)`);

    await translateAndSaveBlogPost(slug, data);
    stats.success++;
    console.log(`    ✅ EN/JA 번역 완료`);

    await new Promise(r => setTimeout(r, DELAY_MS));
  } catch (err) {
    stats.errors.push(`${slug}: ${err.message}`);
    console.log(`    ❌ ${err.message}`);
  }
}

console.log('\n=== 결과 ===');
console.log(`성공: ${stats.success}/15`);
if (stats.errors.length) {
  console.log(`에러: ${stats.errors.length}건`);
  stats.errors.forEach(e => console.log(`  - ${e}`));
}

process.exit(0);
