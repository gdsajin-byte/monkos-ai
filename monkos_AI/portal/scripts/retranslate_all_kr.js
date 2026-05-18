/**
 * -kr doc 전체 일괄 재번역 (vol36 제외 — 이미 완료)
 * translate.js의 translateAndSaveBlogPost를 직접 호출
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/retranslate_all_kr.js
 *   cd monkos_AI/portal && node scripts/retranslate_all_kr.js --execute
 */

import { translateAndSaveBlogPost } from '../lib/cms/translate.js';
import { Firestore } from '@google-cloud/firestore';

const execute = process.argv.includes('--execute');
const db = new Firestore({ projectId: 'monkos' });
const blogCollection = db.collection('blog_posts');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`\n=== -kr doc 일괄 재번역 (${execute ? 'EXECUTE' : 'DRY RUN'}) ===\n`);

  const snap = await blogCollection
    .where('lang', '==', 'ko')
    .where('published', '==', true)
    .get();

  const targets = snap.docs
    .filter(d => d.id.endsWith('-kr') && d.id !== 'vol36-kr')
    .map(d => ({ id: d.id, data: d.data() }));

  console.log(`대상: ${targets.length}건 (vol36 제외)\n`);

  if (!execute) {
    for (const t of targets) {
      console.log(`  ${t.id} | base=${t.data.baseSlug || '?'} | ${t.data.title.substring(0, 50)}`);
    }
    console.log(`\n🔍 DRY RUN. 실행: node scripts/retranslate_all_kr.js --execute`);
    return;
  }

  let ok = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < targets.length; i++) {
    const { id, data } = targets[i];
    console.log(`[${i + 1}/${targets.length}] ${id}`);
    try {
      await translateAndSaveBlogPost(id, data);
      const base = (data.baseSlug || id).replace(/-(kr|ja|en)$/, '');
      const ja = await blogCollection.doc(`${base}-ja`).get();
      const en = await blogCollection.doc(`${base}-en`).get();
      console.log(`  ja: ${ja.exists ? '✅' : '❌'}  en: ${en.exists ? '✅' : '❌'}`);
      ok++;
    } catch (err) {
      console.log(`  ❌ ${err.message}`);
      failed.push(id);
      fail++;
    }
    await sleep(1500);
  }

  console.log(`\n=== 결과 ===`);
  console.log(`성공: ${ok}건, 실패: ${fail}건`);
  if (failed.length > 0) {
    console.log(`실패 목록:`);
    for (const f of failed) console.log(`  ${f}`);
  }
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
