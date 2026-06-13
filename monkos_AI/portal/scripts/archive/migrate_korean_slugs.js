/**
 * 한글 slug 교차오염 정리 + KO 잔재 마이그레이션
 *
 * Phase 1: 교차오염 25건 (JA/EN 경로의 한글 slug doc) 조사 + unpublish
 * Phase 2: KO 잔재 35건 (한글 slug KO doc) 마이그레이션 (별도 실행)
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/migrate_korean_slugs.js
 *   cd monkos_AI/portal && node scripts/migrate_korean_slugs.js --execute
 *   cd monkos_AI/portal && node scripts/migrate_korean_slugs.js --phase2 --execute
 *
 * ⚠️ 프로덕션 Firestore에 직접 접근합니다.
 *   GCP 인증 필요: gcloud auth application-default login
 */

import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI } from '@google/genai';

const execute = process.argv.includes('--execute');
const phase2 = process.argv.includes('--phase2');
const PROJECT_ID = 'monkos';
const LOCATION = 'us-central1';
const db = new Firestore({ projectId: PROJECT_ID });
const blogCollection = db.collection('blog_posts');

function hasKorean(str) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(str);
}

async function generateEnglishSlug(title) {
  try {
    const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `Translate this Korean blog title into English, then convert to a URL slug. Rules: translate to English first, then lowercase, hyphens only, max 60 chars, ASCII only. Do NOT romanize Korean — translate the meaning. Return ONLY the slug, nothing else.\n\nTitle: ${title}` }] }],
      config: { maxOutputTokens: 64, temperature: 0.1 },
    });
    const slug = (response.candidates?.[0]?.content?.parts?.[0]?.text || '')
      .trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
    if (slug.length >= 3) return slug;
  } catch (err) {
    console.log(`  ⚠️ AI slug 생성 실패: ${err.message}`);
  }
  return null;
}

async function phase1_crossContamination() {
  console.log('=== Phase 1: JA/EN 교차오염 조사 ===\n');

  const snapshot = await blogCollection.where('published', '==', true).get();
  const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const crossContaminated = allDocs.filter(d => {
    const lang = d.lang || 'ko';
    if (lang === 'ko') return false;
    const baseSlug = d.id.replace(/-(ja|en)$/, '');
    return hasKorean(baseSlug);
  });

  console.log(`교차오염 doc 발견: ${crossContaminated.length}건\n`);

  const redirects = [];

  for (const doc of crossContaminated) {
    const lang = doc.lang;
    const koreanSlug = doc.id;
    const baseFromKorean = koreanSlug.replace(/-(ja|en)$/, '');
    const originalSlug = doc.originalSlug || baseFromKorean;

    console.log(`[${koreanSlug}] lang=${lang}`);
    console.log(`  originalSlug: ${originalSlug}`);
    console.log(`  title: ${doc.title}`);

    // Check if English slug counterpart exists
    const enSlugQuery = await blogCollection
      .where('originalSlug', '==', originalSlug)
      .where('lang', '==', lang)
      .get();

    const englishCounterparts = enSlugQuery.docs.filter(d =>
      d.id !== koreanSlug && !hasKorean(d.id.replace(/-(ja|en)$/, ''))
    );

    if (englishCounterparts.length > 0) {
      const target = englishCounterparts[0];
      const targetBase = target.id.replace(/-(ja|en)$/, '');
      const langPrefix = lang === 'ja' ? '/ja' : '/en';
      console.log(`  ✅ Case 1: 영문 slug 대응 존재 → ${target.id}`);
      console.log(`  → 301: ${langPrefix}/blog/${baseFromKorean} → ${langPrefix}/blog/${targetBase}`);

      redirects.push({
        from: `${langPrefix}/blog/${encodeURIComponent(baseFromKorean)}`,
        to: `${langPrefix}/blog/${targetBase}`,
        koreanDocId: koreanSlug,
        case: 1,
      });

      if (execute) {
        await blogCollection.doc(koreanSlug).delete();
        console.log(`  🗑️ deleted: ${koreanSlug}`);
      }
    } else {
      console.log(`  🗑️ Case 2: 영문 slug 대응 없음 → 삭제 (재번역으로 재생성)`);
      if (execute) {
        await blogCollection.doc(koreanSlug).delete();
        console.log(`  🗑️ deleted: ${koreanSlug}`);
      }
      if (!execute) {
        console.log(`     재번역: POST /api/admin/blog/${encodeURIComponent(originalSlug)}/translate`);
      }
    }
    console.log();
  }

  // Generate server.js redirect map
  if (redirects.length > 0) {
    console.log('=== server.js blogRedirects 추가분 ===\n');
    for (const r of redirects) {
      console.log(`    '${r.from}': '${r.to}',`);
    }
  }

  console.log(`\n=== 요약 ===`);
  console.log(`교차오염: ${crossContaminated.length}건`);
  console.log(`Case 1 (영문 대응 있음): ${redirects.length}건`);
  console.log(`Case 2/3 (수동 처리 필요): ${crossContaminated.length - redirects.length}건`);
  if (!execute) console.log('\n⚠️ DRY RUN — --execute 플래그로 실행');

  return redirects;
}

async function phase2_koMigration() {
  console.log('=== Phase 2: KO 한글 slug 마이그레이션 ===\n');

  const snapshot = await blogCollection.get();
  const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const koKoreanSlugs = allDocs.filter(d => {
    const lang = d.lang || 'ko';
    if (lang !== 'ko') return false;
    return hasKorean(d.id);
  });

  console.log(`KO 한글 slug doc: ${koKoreanSlugs.length}건\n`);

  const migrations = [];

  for (const doc of koKoreanSlugs) {
    console.log(`[${doc.id}] ${doc.title}`);

    const newBase = await generateEnglishSlug(doc.title);
    if (!newBase) {
      console.log(`  ❌ slug 생성 실패 — 수동 처리 필요`);
      continue;
    }

    const newSlug = `${newBase}-kr`;
    console.log(`  → 새 slug: ${newSlug}`);

    // Check collision
    const existing = await blogCollection.doc(newSlug).get();
    if (existing.exists) {
      console.log(`  ⚠️ 충돌: ${newSlug} 이미 존재`);
      continue;
    }

    migrations.push({
      oldId: doc.id,
      newId: newSlug,
      baseSlug: newBase,
      title: doc.title,
    });

    if (execute) {
      const data = { ...doc };
      delete data.id;
      data.slug = newSlug;
      data.baseSlug = newBase;

      const batch = db.batch();
      batch.set(blogCollection.doc(newSlug), data);
      batch.update(blogCollection.doc(doc.id), { published: false });
      await batch.commit();
      console.log(`  🔧 migrated: ${doc.id} → ${newSlug}`);

      // Update translations' originalSlug
      const translations = await blogCollection
        .where('originalSlug', '==', doc.id)
        .get();
      for (const tDoc of translations.docs) {
        if (execute) {
          await blogCollection.doc(tDoc.id).update({ originalSlug: newBase });
          console.log(`  🔧 updated originalSlug: ${tDoc.id}`);
        }
      }
    }
    console.log();
  }

  // Generate 301 redirects
  if (migrations.length > 0) {
    console.log('=== server.js blogRedirects 추가분 (KO) ===\n');
    for (const m of migrations) {
      console.log(`    '/blog/${encodeURIComponent(m.oldId)}': '/blog/${m.baseSlug}',`);
    }
  }

  console.log(`\n=== 요약 ===`);
  console.log(`대상: ${koKoreanSlugs.length}건`);
  console.log(`마이그레이션 준비: ${migrations.length}건`);
  if (!execute) console.log('\n⚠️ DRY RUN — --execute 플래그로 실행');

  return migrations;
}

async function main() {
  try {
    if (phase2) {
      await phase2_koMigration();
    } else {
      await phase1_crossContamination();
    }
  } catch (err) {
    console.error('❌ 에러:', err.message);
    process.exit(1);
  }
}

main();
