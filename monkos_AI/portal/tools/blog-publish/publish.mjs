/**
 * 블로그 발행 파이프라인 — 원본 md → Firestore blog_posts 발행 (2026-08-25 파일럿)
 *
 * 배경: 제작 루틴(contents/blog)은 매일 도는데 발행 관문(3개국어 자동번역→CMS)이 무거워
 * 한 달 이상 발행 0 (라이브 최종 07-23, 원본 95건 적체 — 작가님 08-25 진단).
 * 전환: 무조건 3개국어 → **콘텐츠가 frontmatter로 자기 배포를 선언** (target 언어·헤드텀·CTA).
 *
 * 사용:
 *   node publish.mjs <md파일...>            # dry-run (기본 — 쓰기 0, 문서 미리보기)
 *   node publish.mjs <md파일...> --publish  # 실발행
 *   node publish.mjs <md파일...> --publish --update  # 기존 문서 갱신 허용
 *
 * frontmatter 계약 (기존 루틴 필드 + 확장):
 *   slug(필수) lang(필수 ko|en|ja) author status tags[] summary
 *   [확장] head_term category cta_link cta_title cta_button
 *
 * 규칙: 스키마는 lib/cms/blog.js handleBlogCreate 정본을 미러 (필드 불일치 = 렌더 파손).
 * blog_posts는 고객 데이터 아님 — ch4 10조 대상 외 (seed_*.js 선례). 쓰기는 --publish 명시 시만.
 */
import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(join(__dirname, '../..')); // portal 루트 (config.js env는 호출측 주입)

const args = process.argv.slice(2);
const DO_PUBLISH = args.includes('--publish');
const ALLOW_UPDATE = args.includes('--update');
const files = args.filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('사용법: node publish.mjs <md파일...> [--publish] [--update]');
  process.exit(1);
}

const { Firestore } = await import('@google-cloud/firestore');
const db = new Firestore({ projectId: process.env.PROJECT_ID });
const col = db.collection('blog_posts');

const SUFFIX = { ko: 'kr', ja: 'ja', en: 'en' };

/** frontmatter 경량 파서 — key: value / key: [a, b] 만 지원 (루틴 템플릿 계약) */
function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: frontmatter 없음`);
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    }
    fm[kv[1]] = v;
  }
  return { fm, body: m[2].trim() };
}

function validate(fm, body, file) {
  const errs = [];
  if (!fm.slug) errs.push('slug 없음');
  if (fm.slug && (/[가-힣]/.test(fm.slug) || /https?:|\//.test(fm.slug))) errs.push(`slug 부적합: ${fm.slug}`);
  if (!SUFFIX[fm.lang]) errs.push(`lang 부적합: ${fm.lang} (ko|en|ja)`);
  const h1 = body.match(/^#\s+(.+)$/m);
  if (!h1) errs.push('본문 H1 제목 없음');
  if (body.length < 500) errs.push(`본문 과소 (${body.length}자)`);
  if (errs.length) throw new Error(`${file}: ${errs.join(' / ')}`);
  return h1[1].trim();
}

let failed = 0;
const publishedUrls = [];
for (const file of files) {
  try {
    const raw = readFileSync(file, 'utf8');
    const { fm, body } = parseFrontmatter(raw, file);
    const title = validate(fm, body, file);
    const baseSlug = fm.slug.replace(/-(kr|ja|en)$/, '');
    const docId = `${baseSlug}-${SUFFIX[fm.lang]}`;
    const now = new Date().toISOString();

    // blog.js handleBlogCreate 스키마 미러
    const post = {
      slug: docId,
      baseSlug,
      title,
      content: body,
      summary: String(fm.summary || '').substring(0, 160),
      thumbnail: '',
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      lang: fm.lang,
      published: true,
      author: fm.author || 'MONKOS',
      pinned: false,
      category: fm.category || '',
      updatedAt: now,
      viewCount: 0,
      ctaEnabled: true,
      ctaImage: '',
      ctaTitle: fm.cta_title || '',
      ctaDescription: '',
      ctaButtonText: fm.cta_button || '',
      ctaLink: fm.cta_link || '',
    };

    const existing = await col.doc(docId).get();
    if (existing.exists && !ALLOW_UPDATE) {
      throw new Error(`${docId} 이미 존재 — 갱신하려면 --update`);
    }
    if (existing.exists) {
      post.createdAt = existing.data().createdAt || now;
      post.viewCount = existing.data().viewCount || 0;
    } else {
      post.createdAt = now;
    }

    const prefix = fm.lang === 'ko' ? '' : `/${fm.lang}`;
    const url = `https://monkos.ai${prefix}/blog/${baseSlug}`;
    if (!DO_PUBLISH) {
      console.log(`[dry-run] ${docId} ← ${basename(file)} (${body.length}자, cat=${post.category || '-'}, cta=${post.ctaLink || '-'}) → ${url}`);
      continue;
    }
    await col.doc(docId).set(post);
    console.log(`✅ 발행: ${docId} → ${url}`);
    publishedUrls.push(url);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    failed++;
  }
}

// 발행 후 라이브 검증 (실패 무음 금지)
if (DO_PUBLISH) {
  for (const url of publishedUrls) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const ok = res.status === 200;
      console.log(`${ok ? '  ✓' : '  ✗'} 라이브 검증 ${res.status}: ${url}`);
      if (!ok) failed++;
    } catch (e) {
      console.error(`  ✗ 라이브 검증 실패: ${url} — ${e.message}`);
      failed++;
    }
  }
}
if (failed) { console.error(`❌ ${failed}건 실패`); process.exit(1); }
console.log(DO_PUBLISH ? '✅ 발행 파이프라인 완료' : '✅ dry-run 완료 (--publish로 실발행)');
