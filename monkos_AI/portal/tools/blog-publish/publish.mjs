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
 *   slug(필수) lang(필수 ko|en|ja — KR/JP/EN 별칭 허용, 그 외 값·미표기는 에러) author status tags[] summary
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
// 기본은 정본 컬렉션. BLOG_COLLECTION은 필드 보존 계약 검증용 스크래치 컬렉션 주입구다
// (프로덕션 blog_posts에 테스트 문서를 만들지 않기 위함 — 라이브 노출·색인 방지).
const col = db.collection(process.env.BLOG_COLLECTION || 'blog_posts');

const SUFFIX = { ko: 'kr', ja: 'ja', en: 'en' };

/**
 * lang 별칭 정규화 — 원본 루틴(contents/blog)이 KR/JP/EN 표기를 써서 ko|en|ja 검증에 튕긴다.
 * 등록된 별칭만 흡수하고, 미등록 값은 원값 그대로 남겨 validate가 에러로 튕기게 한다 (무음 폴백 금지).
 * lang 필드 자체가 없으면 추정하지 않는다 — 파일명 접미사(_KR 등)는 판정 근거가 아니다 (frontmatter가 정본).
 */
const LANG_ALIAS = { KR: 'ko', kr: 'ko', ko: 'ko', JP: 'ja', jp: 'ja', ja: 'ja', EN: 'en', en: 'en' };
function normalizeLang(fm) {
  if (!fm.lang) return; // 미표기 → validate에서 '(lang 없음)' 에러
  const norm = LANG_ALIAS[fm.lang];
  if (norm) fm.lang = norm;
}

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

/**
 * 제목 중복 제거 — 템플릿(render-blog.js:525)이 post.title을 이미 <h1>으로 출력하고
 * blogRenderer(render-shell.js:9)가 본문 헤딩을 1단계 강등하므로, content 선두 H1이 <h2>로 재노출된다.
 *
 * 규칙(의도적 최소): 본문의 **첫 비어있지 않은 줄이 H1이고 그 텍스트가 추출된 title과 동일할 때만**
 * 그 한 줄을 제거한다. 그 외 위치의 `#` 헤딩은 불가침 — 섹션 헤더를 `#`로 쓰는 원본이 실존한다
 * (vol36: 첫 줄이 HTML 주석이고 `#` 8개가 전부 섹션 헤더). "선두 H1 제거"로 넓히면 그 파일이 잘려나간다.
 * validate의 title 추출 로직은 본 변경 범위 밖이다.
 */
function stripTitleH1(body, title) {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length) return body;
  const m = lines[i].match(/^#\s+(.+?)\s*$/);
  if (!m || m[1].trim() !== title) return body; // 첫 줄이 H1이 아니거나 제목과 불일치 → 불가침
  lines.splice(i, 1);
  return lines.join('\n').trim();
}

/**
 * 선택 필드 계약 — [문서 필드, frontmatter 키, 신규 문서 기본값]
 *
 * `set()`은 미기재 필드를 지운다. 따라서 원본이 선언하지 않은 선택 필드를 기본값으로 채워 쓰면,
 * 어드민·후속 도구가 넣은 값이 재발행 때마다 소멸한다 (08-26 실사고: 에세이 25건 CTA가
 * `cta_*` 미선언 탓에 전역 CTA로 원복될 뻔함. `ogImage` 보존 a6d29c73은 같은 사고의 1필드 대응이었다).
 *
 * 규칙: **원본이 선언하면 원본이 이기고, 미선언이면 기존 문서 값을 유지한다.**
 * 선언 여부는 `fm`의 **키 존재**로 판정한다 — 빈 문자열 선언(`category:`)과 미선언은 다르다.
 * 신규 문서(기존 문서 없음)는 기본값으로 종전 동작을 유지한다.
 */
const OPTIONAL_FIELDS = [
  ['summary', 'summary', ''],
  ['thumbnail', 'thumbnail', ''],
  ['tags', 'tags', []],
  ['category', 'category', ''],
  ['author', 'author', 'MONKOS'],
  ['pinned', 'pinned', false],
  ['ctaEnabled', 'cta_enabled', true],
  ['ctaImage', 'cta_image', ''],
  ['ctaTitle', 'cta_title', ''],
  ['ctaDescription', 'cta_description', ''],
  ['ctaButtonText', 'cta_button', ''],
  ['ctaLink', 'cta_link', ''],
];

/** frontmatter는 전부 문자열/배열로 파싱된다 — 스키마 타입에 맞춰 좁힌다 */
function coerceField(field, v) {
  if (field === 'summary') return String(v).substring(0, 160);
  if (field === 'tags') return Array.isArray(v) ? v : (String(v).trim() ? [String(v).trim()] : []);
  if (field === 'pinned' || field === 'ctaEnabled') return String(v).trim().toLowerCase() !== 'false';
  return v;
}

function validate(fm, body, file) {
  const errs = [];
  if (!fm.slug) errs.push('slug 없음');
  if (fm.slug && (/[가-힣]/.test(fm.slug) || /https?:|\//.test(fm.slug))) errs.push(`slug 부적합: ${fm.slug}`);
  if (!fm.lang) errs.push('lang 없음');
  else if (!SUFFIX[fm.lang]) errs.push(`lang 부적합: ${fm.lang} (ko|en|ja)`);
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
    normalizeLang(fm);
    const title = validate(fm, body, file);
    const content = stripTitleH1(body, title);
    const baseSlug = fm.slug.replace(/-(kr|ja|en)$/, '');
    const docId = `${baseSlug}-${SUFFIX[fm.lang]}`;
    const now = new Date().toISOString();

    const existing = await col.doc(docId).get();
    if (existing.exists && !ALLOW_UPDATE) {
      throw new Error(`${docId} 이미 존재 — 갱신하려면 --update`);
    }
    const prev = existing.exists ? existing.data() : null;

    // blog.js handleBlogCreate 스키마 미러
    // 도구 소유 필드 — 원본이 항상 이긴다.
    const post = {
      slug: docId,
      baseSlug,
      title,
      content,
      lang: fm.lang,
      published: true,
      updatedAt: now,
      createdAt: prev?.createdAt || now,
      viewCount: prev?.viewCount || 0,
    };

    // 선택 필드 — 원본이 선언하면 원본이 이기고, 미선언이면 기존 문서 값을 유지한다.
    const preserved = [];
    for (const [field, key, dflt] of OPTIONAL_FIELDS) {
      if (key in fm) {
        post[field] = coerceField(field, fm[key]);
      } else if (prev && field in prev) {
        post[field] = prev[field];
        preserved.push(field);
      } else {
        post[field] = dflt;
      }
    }

    // ogImage는 blog.js generateOgImage 산출물이며 본 도구가 만들지 않는다.
    // frontmatter 선언 경로가 없으므로 선택 필드 계약이 아니라 무조건 보존 대상이다.
    if (prev?.ogImage) { post.ogImage = prev.ogImage; preserved.push('ogImage'); }

    const prefix = fm.lang === 'ko' ? '' : `/${fm.lang}`;
    const url = `https://monkos.ai${prefix}/blog/${baseSlug}`;
    if (!DO_PUBLISH) {
      const h1 = content.length !== body.length ? ' H1제거' : '';
      const keep = preserved.length ? `, 보존=${preserved.join('/')}` : '';
      console.log(`[dry-run] ${docId} ← ${basename(file)} (${content.length}자${h1}, cat=${post.category || '-'}, cta=${post.ctaLink || '-'}${keep}) → ${url}`);
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
