/**
 * 블로그 포스트 감사 스크립트 (읽기 전용)
 * Firestore blog_posts 컬렉션의 중복/누락 현황 파악
 *
 * 사용법:
 *   node scripts/blog-audit.js
 *   node scripts/blog-audit.js --fix  (중복본 비발행 처리)
 *
 * ⚠️ 실행 전 확인:
 *   - PROJECT_ID 환경변수 또는 ADC 설정 필요
 *   - --fix 없이 먼저 감사만 실행 권장
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dirname, '../monkos_AI/portal/node_modules/.package-lock.json'));
const { Firestore } = require('@google-cloud/firestore');

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const firestore = new Firestore({ projectId: PROJECT_ID });
const blogCollection = firestore.collection('blog_posts');
const FIX_MODE = process.argv.includes('--fix');

async function main() {
  console.log(`\n=== 블로그 포스트 감사 시작 ===`);
  console.log(`프로젝트: ${PROJECT_ID}`);
  console.log(`모드: ${FIX_MODE ? '🔧 FIX (비발행 처리 포함)' : '👀 감사만 (읽기 전용)'}\n`);

  // 1. 전체 문서 조회
  const snapshot = await blogCollection.get();
  const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`전체 문서 수: ${allDocs.length}\n`);

  // 2. title 기준 중복 그룹핑 (번역본 제외)
  const titleGroups = {};
  for (const doc of allDocs) {
    if (doc.autoTranslated) continue; // 번역본은 별도 점검
    const key = (doc.title || '').trim();
    if (!key) continue;
    if (!titleGroups[key]) titleGroups[key] = [];
    titleGroups[key].push(doc);
  }

  const titleDuplicates = Object.entries(titleGroups).filter(([, docs]) => docs.length > 1);
  console.log(`--- [A] 동일 title 중복 그룹 (번역본 제외) ---`);
  console.log(`중복 그룹 수: ${titleDuplicates.length}\n`);

  const unpublishTargets = [];

  for (const [title, docs] of titleDuplicates) {
    // 원본 결정: thumbnail 있는 것 우선, 그 중 가장 오래된 것
    const sorted = docs.sort((a, b) => {
      const aHasThumb = a.thumbnail && a.thumbnail.length > 0 ? 1 : 0;
      const bHasThumb = b.thumbnail && b.thumbnail.length > 0 ? 1 : 0;
      if (bHasThumb !== aHasThumb) return bHasThumb - aHasThumb; // thumbnail 있는 쪽 우선
      return (a.createdAt || '').localeCompare(b.createdAt || ''); // 오래된 순
    });

    const original = sorted[0];
    const duplicates = sorted.slice(1);

    console.log(`  📄 "${title.substring(0, 60)}..." (${docs.length}건)`);
    console.log(`     ✅ 원본: ${original.id} | thumb: ${original.thumbnail ? '✓' : '✗'} | created: ${original.createdAt || 'N/A'} | source: ${original.source || 'manual'}`);
    for (const dup of duplicates) {
      console.log(`     ❌ 중복: ${dup.id} | thumb: ${dup.thumbnail ? '✓' : '✗'} | created: ${dup.createdAt || 'N/A'} | published: ${dup.published} | source: ${dup.source || 'manual'}`);
      if (dup.published) {
        unpublishTargets.push({ id: dup.id, title: dup.title, reason: 'title-duplicate' });
      }
    }
    console.log('');
  }

  // 3. thumbnail 없는 published 문서
  const noThumbPublished = allDocs.filter(d => d.published && (!d.thumbnail || d.thumbnail.length === 0));
  console.log(`--- [B] published=true & thumbnail 없는 문서 ---`);
  console.log(`대상 수: ${noThumbPublished.length}\n`);
  for (const doc of noThumbPublished) {
    console.log(`  ⚠️  ${doc.id} | title: "${(doc.title || '').substring(0, 50)}" | lang: ${doc.lang || 'ko'} | auto: ${doc.autoTranslated || false} | source: ${doc.source || 'manual'}`);
  }
  console.log('');

  // 4. 번역본 정합성 점검
  const translations = allDocs.filter(d => d.autoTranslated);
  const originals = allDocs.filter(d => !d.autoTranslated);
  const originalSlugs = new Set(originals.map(d => d.id));

  console.log(`--- [C] 번역본 정합성 점검 ---`);
  console.log(`번역본 수: ${translations.length}\n`);

  const orphanedTranslations = [];
  const translationMap = {};

  for (const t of translations) {
    const origSlug = t.originalSlug;
    if (!origSlug || !originalSlugs.has(origSlug)) {
      console.log(`  🔗 고아 번역본: ${t.id} | originalSlug: ${origSlug || 'N/A'} | lang: ${t.lang}`);
      orphanedTranslations.push(t);
      if (t.published) {
        unpublishTargets.push({ id: t.id, title: t.title, reason: 'orphaned-translation' });
      }
    }

    // 매핑 테이블 구성
    if (origSlug) {
      if (!translationMap[origSlug]) translationMap[origSlug] = {};
      if (!translationMap[origSlug][t.lang]) translationMap[origSlug][t.lang] = [];
      translationMap[origSlug][t.lang].push(t.id);
    }
  }

  // 원본 1건에 같은 언어 번역본 2건 이상 체크
  console.log(`\n  --- 번역본 중복 (같은 원본+언어에 2건 이상) ---`);
  let dupTransCount = 0;
  for (const [origSlug, langs] of Object.entries(translationMap)) {
    for (const [lang, slugs] of Object.entries(langs)) {
      if (slugs.length > 1) {
        dupTransCount++;
        console.log(`  ⚠️  원본: ${origSlug} | ${lang}: [${slugs.join(', ')}]`);
        // 첫 번째만 유지, 나머지 비발행
        for (let i = 1; i < slugs.length; i++) {
          const dupTrans = allDocs.find(d => d.id === slugs[i]);
          if (dupTrans?.published) {
            unpublishTargets.push({ id: slugs[i], title: dupTrans.title, reason: 'duplicate-translation' });
          }
        }
      }
    }
  }
  if (dupTransCount === 0) console.log('  ✅ 번역본 중복 없음');

  // 5. 원본-번역 매핑 테이블
  console.log(`\n--- [D] 원본-번역 매핑 테이블 ---`);
  for (const [origSlug, langs] of Object.entries(translationMap)) {
    const langStr = Object.entries(langs).map(([l, s]) => `${l}:${s.join(',')}`).join(' | ');
    console.log(`  ${origSlug} → ${langStr}`);
  }

  // 5-2. 중복 원본의 번역본도 연쇄 비발행
  const dupOriginalIds = new Set(unpublishTargets.filter(t => t.reason === 'title-duplicate').map(t => t.id));
  for (const t of translations) {
    if (dupOriginalIds.has(t.originalSlug) && t.published) {
      const alreadyTargeted = unpublishTargets.some(u => u.id === t.id);
      if (!alreadyTargeted) {
        console.log(`\n  🔗 중복 원본의 번역본: ${t.id} (원본: ${t.originalSlug})`);
        unpublishTargets.push({ id: t.id, title: t.title, reason: 'translation-of-duplicate' });
      }
    }
  }

  // 6. 요약
  console.log(`\n${'='.repeat(60)}`);
  console.log(`=== 감사 요약 ===`);
  console.log(`전체 문서: ${allDocs.length}`);
  console.log(`  - 원본: ${originals.length}`);
  console.log(`  - 번역본: ${translations.length}`);
  console.log(`  - published: ${allDocs.filter(d => d.published).length}`);
  console.log(`  - unpublished: ${allDocs.filter(d => !d.published).length}`);
  console.log(`동일 title 중복 그룹: ${titleDuplicates.length}`);
  console.log(`thumbnail 없는 published 문서: ${noThumbPublished.length}`);
  console.log(`고아 번역본: ${orphanedTranslations.length}`);
  console.log(`비발행 처리 대상: ${unpublishTargets.length}`);
  console.log(`${'='.repeat(60)}\n`);

  if (unpublishTargets.length > 0) {
    console.log(`--- 비발행 처리 대상 목록 ---`);
    for (const t of unpublishTargets) {
      console.log(`  ${t.id} | reason: ${t.reason} | title: "${(t.title || '').substring(0, 50)}"`);
    }
    console.log('');
  }

  // 7. FIX 모드: 비발행 처리 실행
  if (FIX_MODE && unpublishTargets.length > 0) {
    console.log(`🔧 FIX 모드 — ${unpublishTargets.length}건 비발행 처리 시작...\n`);
    let fixed = 0;
    for (const target of unpublishTargets) {
      try {
        await blogCollection.doc(target.id).update({ published: false, updatedAt: new Date().toISOString() });
        console.log(`  ✅ 비발행 완료: ${target.id}`);
        fixed++;
      } catch (err) {
        console.log(`  ❌ 실패: ${target.id} — ${err.message}`);
      }
    }
    console.log(`\n🔧 비발행 처리 완료: ${fixed}/${unpublishTargets.length}건`);
  } else if (!FIX_MODE && unpublishTargets.length > 0) {
    console.log(`💡 비발행 처리를 실행하려면: node scripts/blog-audit.js --fix`);
  }
}

main().catch(err => {
  console.error('감사 스크립트 에러:', err.message);
  process.exit(1);
});
