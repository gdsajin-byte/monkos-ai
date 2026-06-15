#!/usr/bin/env node
/**
 * 블로그 리슬러그 스크립트 — Firestore blog_posts doc ID 변경
 *
 * 사용: node scripts/reslug_blog.js [--dry-run]
 * --dry-run: 실제 변경 없이 존재 여부만 확인
 */
import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'monkos';
const firestore = new Firestore({ projectId: PROJECT_ID });
const blogCollection = firestore.collection('blog_posts');

const RESLUG_MAP = [
  {
    oldSlug: '47-20x',
    newBase: 'claude-opus-47-what-went-wrong-max-20x-user',
  },
  {
    oldSlug: '14-vs',
    newBase: 'korea-vs-japan-job-photo-hairstyle-difference',
  },
  {
    oldSlug: '5-10',
    newBase: 'interview-updo-hairstyle-5-steps-10-year-pro-tips',
  },
];

const SUFFIXES = ['kr', 'ja', 'en'];

async function findExistingDocs(baseSlug) {
  const candidates = [baseSlug, ...SUFFIXES.map(s => `${baseSlug}-${s}`)];
  const found = [];
  for (const slug of candidates) {
    const doc = await blogCollection.doc(slug).get();
    if (doc.exists) {
      found.push({ slug, data: doc.data() });
    }
  }
  return found;
}

async function reslug(oldSlug, newBase, dryRun) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 ${oldSlug} → ${newBase}`);

  const existingDocs = await findExistingDocs(oldSlug);

  if (existingDocs.length === 0) {
    console.log(`  ❌ "${oldSlug}" 관련 문서 없음 (suffix 포함 검색)`);
    return [];
  }

  const results = [];

  for (const { slug: oldDocId, data } of existingDocs) {
    const lang = data.lang || 'ko';
    const suffixMap = { ko: 'kr', ja: 'ja', en: 'en' };
    const suffix = suffixMap[lang] || 'kr';
    const newSlug = `${newBase}-${suffix}`;

    console.log(`  📄 ${oldDocId} (lang=${lang}) → ${newSlug}`);

    const newDoc = await blogCollection.doc(newSlug).get();
    if (newDoc.exists) {
      console.log(`  ⚠️  새 슬러그 "${newSlug}" 이미 존재 — 건너뜀`);
      continue;
    }

    if (dryRun) {
      console.log(`  [DRY-RUN] 변경 예정: ${oldDocId} → ${newSlug}`);
      console.log(`    제목: ${data.title || '(없음)'}`);
      console.log(`    발행: ${data.published ? '✅' : '❌'}`);
      results.push({ old: oldDocId, new: newSlug, title: data.title });
      continue;
    }

    const newData = { ...data, slug: newSlug };
    await blogCollection.doc(newSlug).set(newData);
    console.log(`  ✅ 새 문서 생성: ${newSlug}`);

    await blogCollection.doc(oldDocId).delete();
    console.log(`  🗑️  이전 문서 삭제: ${oldDocId}`);

    results.push({ old: oldDocId, new: newSlug, title: data.title });
  }

  return results;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('🏃 DRY-RUN 모드 — 변경 없이 확인만 수행\n');
  } else {
    console.log('⚡ LIVE 모드 — Firestore 변경 수행\n');
  }

  const allResults = [];

  for (const { oldSlug, newBase } of RESLUG_MAP) {
    const results = await reslug(oldSlug, newBase, dryRun);
    allResults.push(...results);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n📊 결과: ${allResults.length}건 처리`);
  for (const r of allResults) {
    console.log(`  ${r.old} → ${r.new} (${r.title})`);
  }
}

main().catch(err => {
  console.error('❌ 에러:', err.message);
  process.exit(1);
});
