/**
 * CMS SSR 렌더링 엔진
 * Firestore 데이터 → HTML 페이지 (SEO 최적화)
 *
 * 구조: fragment 함수 (데이터+HTML) + layoutShell (전체 페이지 래핑)
 * - *Fragment() → { title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript }
 * - render*()   → layoutShell(fragment) → res.end(html)  (기존 호출 100% 호환)
 */
import { marked } from 'marked';
import { firestore, log } from '../shared/config.js';

const blogCollection = firestore.collection('blog_posts');
const faqCollection = firestore.collection('faq_items');
const galleryCollection = firestore.collection('gallery_items');
const boardCollection = firestore.collection('board_posts');

// SEO: 블로그 콘텐츠 내 heading 다운그레이드 (페이지 H1과 중복 방지)
const blogRenderer = new marked.Renderer();
blogRenderer.heading = function({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const level = Math.min(depth + 1, 6);
  return `<h${level}>${text}</h${level}>`;
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^>+\s?/gm, '')
    .replace(/[#*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSeoDescription(post) {
  const raw = post.summary || post.content || '';
  const cleaned = stripHtml(raw);
  return cleaned.length > 160 ? cleaned.substring(0, 157) + '...' : cleaned;
}

function layoutHead(title, description, extra = '', htmlLang = 'ko') {
  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-JPZWSJ3323');
  gtag('config', 'G-FKG0CPTC14');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#f6f7fb">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css">
${extra}
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #f6f7fb;
  --surface: #ffffff;
  --surface2: #f0f1f5;
  --accent: #6c4fff;
  --accent2: #5a3de6;
  --text: #13152a;
  --text-dim: #4a4f6e;
  --text-bright: #13152a;
  --border: #e4e6f0;
  --border-hover: rgba(108, 79, 255, 0.3);
  --card-bg: #ffffff;
  --success: #34d399;
}
html, body { overflow-x: hidden; }
body {
  font-family: 'Pretendard', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.7;
}
a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent2); }

/* Header (dark branded — mockup 준용) */
.site-header { background: #090b1a; border-bottom: 1px solid rgba(255,255,255,0.06); }
.header-top {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  height: 58px; display: flex; align-items: center; justify-content: space-between;
}
.logo {
  font-size: 15px; font-weight: 800; letter-spacing: 0.14em;
  color: #f0f2ff; text-transform: uppercase;
  display: flex; align-items: center; gap: 8px; text-decoration: none;
}
.logo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.header-nav { display: flex; gap: 2px; }
.header-nav a {
  padding: 6px 14px; border-radius: 7px; font-size: 13px;
  color: #8892b4; text-decoration: none; transition: all 0.15s;
}
.header-nav a:hover { background: rgba(255,255,255,0.07); color: #f0f2ff; }
.header-cta {
  padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
  background: var(--accent); color: #fff; text-decoration: none; transition: opacity 0.15s;
}
.header-cta:hover { opacity: 0.9; }

/* Footer */
.footer {
  text-align: center; padding: 32px 24px; margin-top: 60px;
  border-top: 1px solid var(--border); color: var(--text-dim); font-size: 13px;
}

/* Container */
.container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
</style>`;
}

function layoutNav() {
  return `<header class="site-header">
  <div class="header-top">
    <a href="/" class="logo"><span class="logo-dot"></span>MONKOS</a>
    <nav class="header-nav">
      <a href="/blog">Blog</a>
      <a href="/faq">FAQ</a>
      <a href="/gallery">Gallery</a>
      <a href="/board">Board</a>
      <a href="/guide">Guide</a>
      <a href="/pricing">Pricing</a>
    </nav>
  </div>
</header>`;
}

function layoutFooter() {
  return `<footer class="footer">
  &copy; ${new Date().getFullYear()} MONKOS. All rights reserved.
  <br><a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/refund.html">Refund</a>
</footer>`;
}

/**
 * 전체 HTML 페이지를 래핑하는 셸 함수
 * v4에서 3컬럼 레이아웃으로 교체될 진입점
 */
export function layoutShell({ title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript }) {
  return `${layoutHead(title, description, seoMeta || '', htmlLang || 'ko')}
${pageStyle ? `<style>${pageStyle}</style>` : ''}
</head>
<body>
${layoutNav()}
<div class="container">
  ${bodyContent}
</div>
${layoutFooter()}
${pageScript ? `<script>${pageScript}</script>` : ''}
</body>
</html>`;
}

// =============================================
// Blog
// =============================================

// 블로그 목록 — fragment (데이터 조회 + HTML 생성)
export async function blogListFragment(req, forceLang = null) {
  const url = new URL(req.url, 'https://monkos.ai');
  const lang = forceLang || url.searchParams.get('lang');
  const catFilter = url.searchParams.get('cat');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = 10;

  let query = blogCollection.where('published', '==', true).orderBy('createdAt', 'desc');
  if (lang) query = blogCollection.where('published', '==', true).where('lang', '==', lang).orderBy('createdAt', 'desc');

  const snapshot = await query.get();
  let allPosts = snapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() }));

  // originalSlug 기반 중복 제거 (같은 원본의 번역본이 혼재하지 않도록)
  const seenOriginals = new Set();
  allPosts = allPosts.filter(p => {
    const key = p.originalSlug || p.slug;
    if (seenOriginals.has(key)) return false;
    seenOriginals.add(key);
    return true;
  });

  // 카테고리 필터 (client-side — 복합 인덱스 불필요)
  if (catFilter) allPosts = allPosts.filter(p => p.category === catFilter);

  // 카테고리 목록 추출 (필터 전 전체에서)
  const allCategories = [...new Set(snapshot.docs.map(d => d.data().category).filter(Boolean))].sort();

  const totalPages = Math.ceil(allPosts.length / perPage);
  const posts = allPosts.slice((page - 1) * perPage, page * perPage);

  const prefix = forceLang ? `/${forceLang}` : '';
  const canonicalUrl = `https://monkos.ai${prefix}/blog`;
  const htmlLang = forceLang || 'ko';

  const seoMeta = `<meta property="og:title" content="MONKOS Blog">
<meta property="og:description" content="AI ID Photo tips, guides, and news">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/blog">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/blog">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/blog">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog">`;

  // 언어 필터 탭
  const baseUrl = forceLang ? `/${forceLang}/blog` : '/blog';
  const langTabs = [
    { code: null, label: 'ALL' },
    { code: 'ko', label: 'KO' },
    { code: 'ja', label: 'JA' },
    { code: 'en', label: 'EN' },
  ].map(t => {
    const isActive = (lang === t.code) || (!lang && !t.code);
    const href = t.code ? `${baseUrl}?lang=${t.code}${catFilter ? `&cat=${encodeURIComponent(catFilter)}` : ''}` : `${baseUrl}${catFilter ? `?cat=${encodeURIComponent(catFilter)}` : ''}`;
    return `<a href="${href}" class="filter-tab${isActive ? ' active' : ''}">${t.label}</a>`;
  }).join('');

  // 카테고리 필터 탭
  const catTabs = [
    { code: null, label: 'ALL' },
    ...allCategories.map(c => ({ code: c, label: c })),
  ].map(t => {
    const isActive = (catFilter === t.code) || (!catFilter && !t.code);
    const langParam = lang ? `lang=${lang}&` : '';
    const href = t.code ? `${baseUrl}?${langParam}cat=${encodeURIComponent(t.code)}` : `${baseUrl}${lang ? `?lang=${lang}` : ''}`;
    return `<a href="${href}" class="filter-tab${isActive ? ' active' : ''}">${escapeHtml(t.label)}</a>`;
  }).join('');

  const cardsHtml = posts.map(p => {
    let cardHref;
    const postLang = p.lang || 'ko';
    if (postLang === 'ja') {
      const baseSlug = p.slug.replace(/-ja$/, '');
      cardHref = `/ja/blog/${escapeHtml(baseSlug)}`;
    } else if (postLang === 'en') {
      const baseSlug = p.slug.replace(/-en$/, '');
      cardHref = `/en/blog/${escapeHtml(baseSlug)}`;
    } else {
      cardHref = `/blog/${escapeHtml(p.slug)}`;
    }
    return `
      <a href="${cardHref}" class="blog-card">
        ${p.thumbnail ? `<div class="card-thumb" style="background-image:url('${escapeHtml(p.thumbnail)}')"></div>` : `<div class="card-thumb card-thumb-empty"></div>`}
        <div class="card-body">
          <div class="card-meta">
            <span class="card-lang">${escapeHtml(postLang)}</span>
            <span class="card-date">${p.createdAt ? p.createdAt.substring(0, 10) : ''}</span>
          </div>
          <h2 class="card-title">${escapeHtml(p.title)}</h2>
          <p class="card-summary">${escapeHtml(stripHtml(p.summary || ''))}</p>
        </div>
      </a>`;
  }).join('');

  let paginationHtml = '';
  if (totalPages > 1) {
    const pgBase = forceLang ? `/${forceLang}/blog` : '/blog';
    const extraParams = [
      (!forceLang && lang) ? `lang=${lang}` : '',
      catFilter ? `cat=${encodeURIComponent(catFilter)}` : '',
    ].filter(Boolean).join('&');
    const pgSuffix = extraParams ? `&${extraParams}` : '';
    const links = [];
    if (page > 1) links.push(`<a href="${pgBase}?page=${page - 1}${pgSuffix}">&laquo; Prev</a>`);
    for (let i = 1; i <= totalPages; i++) {
      links.push(i === page ? `<span class="pg-current">${i}</span>` : `<a href="${pgBase}?page=${i}${pgSuffix}">${i}</a>`);
    }
    if (page < totalPages) links.push(`<a href="${pgBase}?page=${page + 1}${pgSuffix}">Next &raquo;</a>`);
    paginationHtml = `<div class="pagination">${links.join('')}</div>`;
  }

  const pageStyle = `
.blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
.blog-card {
  display: flex; flex-direction: column; background: var(--card-bg);
  border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  transition: all 0.2s; color: var(--text);
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.blog-card:hover { box-shadow: 0 8px 28px rgba(108,79,255,0.1); border-color: rgba(108,79,255,0.22); transform: translateY(-3px); }
.card-thumb { width: 100%; height: 200px; background-size: cover; background-position: center; background-color: var(--surface2); }
.card-thumb-empty { background: linear-gradient(135deg, #2a1d6e, #0f0a2e); }
.card-body { padding: 20px; flex: 1; }
.card-meta { display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px; color: var(--text-dim); }
.card-lang { background: var(--surface2); padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
.card-title { font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; line-height: 1.4; }
.card-summary { font-size: 14px; color: var(--text-dim); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.pagination a, .pagination .pg-current {
  padding: 8px 14px; border-radius: 6px; font-size: 14px;
}
.pagination a { background: var(--surface); color: var(--text-dim); border: 1px solid var(--border); }
.pagination a:hover { border-color: var(--accent); color: var(--accent); }
.pg-current { background: var(--accent); color: var(--bg); font-weight: 600; }
.blog-header { margin-bottom: 32px; }
.blog-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); }
.blog-filters { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.filter-row { display: flex; align-items: center; gap: 10px; }
.filter-label { font-size: 12px; color: var(--text-dim); font-weight: 500; min-width: 40px; }
.filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-tab {
  padding: 5px 14px; border-radius: 18px; font-size: 13px;
  background: var(--surface); border: 1px solid var(--border); color: var(--text-dim);
  transition: all 0.15s;
}
.filter-tab:hover, .filter-tab.active { border-color: var(--accent); color: var(--accent); background: rgba(108,79,255,0.04); }
@media (max-width: 600px) { .blog-grid { grid-template-columns: 1fr; } }`;

  const bodyContent = `
  <div class="blog-header">
    <h1>Blog</h1>
    <div class="blog-filters">
      <div class="filter-row">
        <span class="filter-label">언어</span>
        <div class="filter-tabs">${langTabs}</div>
      </div>
      ${allCategories.length > 0 ? `<div class="filter-row">
        <span class="filter-label">주제</span>
        <div class="filter-tabs">${catTabs}</div>
      </div>` : ''}
    </div>
  </div>
  <div class="blog-grid">${cardsHtml || '<p style="color:var(--text-dim)">No posts yet.</p>'}</div>
  ${paginationHtml}`;

  const listMeta = {
    ko: { title: 'AI 증명사진 블로그 | MONKOS AI', description: 'AI 증명사진 팁, 가이드, 최신 뉴스 | MONKOS AI 블로그' },
    ja: { title: 'AI証明写真ブログ | MONKOS AI', description: 'AI証明写真のヒント、ガイド、最新ニュース | MONKOS AI ブログ' },
    en: { title: 'AI ID Photo Blog | MONKOS AI', description: 'AI ID Photo tips, guides, and news | MONKOS AI Blog' },
  };
  const meta = listMeta[htmlLang] || listMeta.ko;

  const blogJsonLd = `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": meta.title,
  "description": meta.description,
  "url": canonicalUrl,
  "publisher": {
    "@type": "Organization",
    "name": "Monk Studio",
    "url": "https://monkos.ai",
    "logo": { "@type": "ImageObject", "url": "https://monkos.ai/monkos-icon-1024.png" }
  }
})}
</script>`;

  return { title: meta.title, description: meta.description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript: blogJsonLd };
}

// GET /blog — 목록 페이지 (기존 호출 호환)
export async function renderBlogList(req, res, forceLang = null) {
  try {
    const parts = await blogListFragment(req, forceLang);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 목록 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Blog Post
// =============================================

// 블로그 상세 — fragment
export async function blogPostFragment(req, lang = null) {
  let slug;
  if (lang === 'ja') {
    slug = decodeURIComponent(req.url.split('/ja/blog/')[1]?.split('?')[0] || '');
  } else if (lang === 'en') {
    slug = decodeURIComponent(req.url.split('/en/blog/')[1]?.split('?')[0] || '');
  } else {
    slug = decodeURIComponent(req.url.split('/blog/')[1]?.split('?')[0] || '');
  }
  if (!slug) return null; // 404 시그널

  const docId = lang ? `${slug}-${lang}` : slug;
  const doc = await blogCollection.doc(docId).get();
  if (!doc.exists || !doc.data().published) return null;

  const post = doc.data();
  const htmlLang = lang || post.lang || 'ko';

  // viewCount 비동기 증가
  blogCollection.doc(docId).update({ viewCount: (post.viewCount || 0) + 1 }).catch(() => {});

  const contentHtml = marked(post.content || '', { renderer: blogRenderer });
  const baseSlug = slug;

  // hreflang — 경로 접두어 교체 방식 (slug 영문 통일 정책, 2026-03-22)
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/blog/${slug}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/blog/${slug}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/blog/${slug}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/${slug}">`,
  ].join('\n');

  const prefix = lang ? `/${lang}` : '';
  const canonicalUrl = `https://monkos.ai${prefix}/blog/${escapeHtml(baseSlug)}`;

  const seoMeta = `
<meta property="og:title" content="${escapeHtml(post.title)}">
<meta property="og:description" content="${escapeHtml(getSeoDescription(post))}">
<meta property="og:image" content="${escapeHtml(post.thumbnail || '')}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<meta property="article:published_time" content="${post.createdAt}">
<meta property="article:modified_time" content="${post.updatedAt || post.createdAt}">
<meta property="article:author" content="${post.author || 'MONKOS'}">
<meta property="article:section" content="${post.category || 'blog'}">
${(post.tags || []).map(t => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n')}
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.title,
  "image": post.thumbnail || '',
  "author": {
    "@type": "Person",
    "name": post.author === 'MONKOS' ? 'Shin-jakka' : post.author,
    "jobTitle": "Photographer & AI Architect",
    "url": "https://monkos.ai",
    "sameAs": ["https://github.com/monkos-studio"]
  },
  "publisher": {
    "@type": "Organization",
    "name": "Monk Studio",
    "url": "https://monkos.ai",
    "logo": {
      "@type": "ImageObject",
      "url": "https://monkos.ai/monkos-icon-1024.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": canonicalUrl
  },
  "datePublished": post.createdAt,
  "dateModified": post.updatedAt,
  "description": getSeoDescription(post)
})}
</script>`;

  const tagsHtml = (post.tags || []).map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('');
  const backLink = lang ? `/${lang}/blog` : '/blog';
  const shareLabel = { ko: '공유하기', en: 'Share', ja: 'シェア' }[htmlLang] || '공유하기';

  const pageStyle = `
.post-header { margin-bottom: 32px; max-width: 800px; margin-left: auto; margin-right: auto; }
.post-header h1 { font-size: 32px; font-weight: 700; color: var(--text-bright); line-height: 1.4; margin-bottom: 16px; }
.post-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-dim); flex-wrap: wrap; align-items: center; }
.post-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
.post-tag { background: var(--surface2); padding: 4px 12px; border-radius: 12px; font-size: 12px; color: var(--accent); }
.post-thumb { max-width: 800px; margin: 0 auto 32px; border-radius: 12px; overflow: hidden; }
.post-thumb img { width: 100%; height: auto; display: block; }
.post-content {
  max-width: 800px; margin: 0 auto; font-size: 17px; line-height: 1.85; color: #2a2d48;
  background: var(--surface); border-radius: 16px; padding: 40px 48px;
  border: 1px solid var(--border); box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}
.post-content h1, .post-content h2, .post-content h3 { color: var(--text-bright); margin: 32px 0 16px; }
.post-content h2 { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.post-content h3 { font-size: 20px; }
.post-content p { margin-bottom: 16px; }
.post-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
.post-content code { background: var(--surface2); padding: 2px 6px; border-radius: 4px; font-size: 14px; }
.post-content pre { background: var(--surface); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
.post-content pre code { background: none; padding: 0; }
.post-content blockquote { border-left: 4px solid var(--accent); padding: 16px 24px; background: rgba(108,79,255,0.06); border-radius: 0 10px 10px 0; color: var(--text-dim); margin: 16px 0; font-style: italic; }
.post-content ul, .post-content ol { padding-left: 24px; margin-bottom: 16px; }
.post-content li { margin-bottom: 8px; }
.post-content a { color: var(--accent); text-decoration: underline; }
.post-content table { width: 100%; display: block; overflow-x: auto; }
.post-content iframe { max-width: 100%; height: auto; }
.post-back { display: inline-block; margin-bottom: 24px; color: var(--text-dim); font-size: 14px; }
.post-back:hover { color: var(--accent); }
.share-buttons {
  display: flex; align-items: center; gap: 10px; margin-top: 32px;
  max-width: 800px; margin-left: auto; margin-right: auto; padding: 16px 0;
}
.share-label { font-size: 13px; color: var(--text-dim); font-weight: 500; }
.share-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border);
  background: var(--surface); color: var(--text-dim); font-size: 14px;
  text-decoration: none; cursor: pointer; transition: all 0.2s;
}
.share-btn:hover { border-color: var(--accent); color: var(--accent); }
.share-copy { font-family: inherit; }
.share-more { display: none; }
@media (max-width: 600px) {
  .post-header h1 { font-size: 24px; }
  .post-content { font-size: 15px; }
  .share-more { display: inline-flex; }
}`;

  const backLabel = { ko: '블로그 목록으로', ja: 'ブログ一覧へ', en: 'Back to Blog' };
  const bodyContent = `
  <a href="${backLink}" class="post-back">&larr; ${backLabel[htmlLang] || backLabel.ko}</a>
  <article>
    <div class="post-header">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta">
        <span>${escapeHtml(post.author || 'MONKOS')}</span>
        <span>${post.createdAt ? post.createdAt.substring(0, 10) : ''}</span>
        <span>${escapeHtml(post.lang || 'ko').toUpperCase()}</span>
        <span>${post.viewCount || 0} views</span>
      </div>
      ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
    </div>
    ${post.thumbnail ? `<div class="post-thumb"><img src="${escapeHtml(post.thumbnail)}" alt="${escapeHtml(post.title)}"></div>` : ''}
    <div class="post-content">${contentHtml}</div>
  </article>
  <div class="share-buttons">
    <span class="share-label">${shareLabel}</span>
    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonicalUrl)}" target="_blank" rel="noopener" class="share-btn" title="X">\ud835\udd4f</a>
    <a href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(canonicalUrl)}" target="_blank" rel="noopener" class="share-btn" title="LINE">L</a>
    <a href="https://story.kakao.com/share?url=${encodeURIComponent(canonicalUrl)}" target="_blank" rel="noopener" class="share-btn" title="KakaoStory">\ud83d\udcac</a>
    <button class="share-btn share-copy" onclick="navigator.clipboard.writeText('${canonicalUrl}');this.textContent='\u2713';setTimeout(()=>this.textContent='\ud83d\udd17',1500)" title="Link">\ud83d\udd17</button>
    <button class="share-btn share-more" onclick="shareNative()" title="Share">\u2197</button>
  </div>`;

  const pageScript = `function shareNative(){if(navigator.share){navigator.share({title:${JSON.stringify(post.title)},url:${JSON.stringify(canonicalUrl)}}).catch(function(){})}}`;

  return { title: `${post.title} | MONKOS AI`, description: getSeoDescription(post), seoMeta, htmlLang, pageStyle, bodyContent, pageScript };
}

// GET /blog/:slug — 상세 페이지 (기존 호출 호환)
export async function renderBlogPost(req, res, lang = null) {
  try {
    const parts = await blogPostFragment(req, lang);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// FAQ
// =============================================

// FAQ — fragment
export async function faqFragment(req, forceLang = null) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const lang = forceLang || url.searchParams.get('lang') || 'ko';
  const snapshot = await faqCollection
    .where('published', '==', true)
    .where('lang', '==', lang)
    .orderBy('order', 'asc')
    .get();
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const categories = {};
  for (const item of items) {
    const cat = item.category || '일반';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  }

  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      }
    }))
  });

  const canonicalPath = lang === 'ko' ? '/faq' : `/${lang}/faq`;
  const canonicalUrl = `https://monkos.ai${canonicalPath}`;
  const ogTitleMap = { ko: 'FAQ | MONKOS AI', en: 'FAQ | MONKOS AI', ja: 'FAQ | MONKOS AI' };
  const ogDescMap = {
    ko: 'MONKOS AI 증명사진 FAQ - 자주 묻는 질문',
    en: 'MONKOS AI ID Photo FAQ - frequently asked questions',
    ja: 'MONKOS AI 証明写真 FAQ - よくある質問',
  };
  const ogTitle = ogTitleMap[lang] || ogTitleMap.ko;
  const ogDesc = ogDescMap[lang] || ogDescMap.ko;

  const seoMeta = `<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
<script type="application/ld+json">${faqJsonLd}</script>`;

  const faqHtml = Object.entries(categories).map(([cat, faqs]) => `
      <div class="faq-category">
        <h2 class="faq-cat-title">${escapeHtml(cat)}</h2>
        ${faqs.map(f => `
          <details class="faq-item" id="faq-${f.id}">
            <summary class="faq-question">${escapeHtml(f.question)}</summary>
            <div class="faq-answer">${marked(f.answer || '')}</div>
          </details>
        `).join('')}
      </div>`).join('');

  const pageStyle = `
.faq-header { margin-bottom: 32px; }
.faq-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); }
.faq-header p { color: var(--text-dim); margin-top: 8px; font-size: 15px; }
.faq-category { margin-bottom: 32px; }
.faq-cat-title {
  font-size: 18px; font-weight: 700; color: var(--accent); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.faq-item {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px;
  margin-bottom: 8px; overflow: hidden;
}
.faq-question {
  padding: 16px 20px; cursor: pointer; font-size: 15px; font-weight: 500;
  color: var(--text-bright); list-style: none; display: flex; align-items: center;
  justify-content: space-between;
}
.faq-question::after { content: '+'; font-size: 20px; color: var(--accent); flex-shrink: 0; margin-left: 12px; }
.faq-item[open] .faq-question::after { content: '-'; }
.faq-question::-webkit-details-marker { display: none; }
.faq-answer {
  padding: 0 20px 16px; font-size: 14px; color: var(--text-dim); line-height: 1.7;
}
.faq-answer p { margin-bottom: 8px; }
.faq-answer a { color: var(--accent); }`;

  const bodyContent = `
  <div class="faq-header">
    <h1>FAQ</h1>
    <p>Frequently Asked Questions</p>
  </div>
  ${faqHtml || '<p style="color:var(--text-dim)">No FAQs yet.</p>'}
  <div style="margin-top:32px;padding:16px 20px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-align:center;">
    <a href="${lang === 'ko' ? '/specs' : `/${lang}/specs`}" style="color:var(--accent);font-size:14px;font-weight:600;text-decoration:none;">📋 ${lang === 'ja' ? '国別証明写真の規格を確認する →' : lang === 'en' ? 'View ID photo specs by country →' : '국가별 증명사진 규격 상세 →'}</a>
  </div>`;

  const pageScript = `
if (location.hash) {
  var el = document.getElementById(location.hash.substring(1));
  if (el && el.tagName === 'DETAILS') {
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}`;

  return { title: ogTitle, description: ogDesc, seoMeta, htmlLang: lang, pageStyle, bodyContent, pageScript };
}

// GET /faq — FAQ 공개 페이지 (기존 호출 호환)
export async function renderFaq(req, res, forceLang = null) {
  try {
    const parts = await faqFragment(req, forceLang);
    // FAQ는 container max-width가 다름 → bodyContent를 container style로 오버라이드
    const html = `${layoutHead(parts.title, parts.description, parts.seoMeta || '', parts.htmlLang || 'ko')}
${parts.pageStyle ? `<style>${parts.pageStyle}</style>` : ''}
</head>
<body>
${layoutNav()}
<div class="container" style="max-width:800px;">
  ${parts.bodyContent}
</div>
${layoutFooter()}
${parts.pageScript ? `<script>${parts.pageScript}</script>` : ''}
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] FAQ 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Gallery
// =============================================

// 갤러리 — fragment
export async function galleryFragment(req) {
  const snapshot = await galleryCollection.where('published', '==', true).orderBy('order', 'asc').get();
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const allCategories = [...new Set(items.map(i => i.category || '일반'))];

  const seoMeta = `<meta property="og:title" content="Gallery | MONKOS AI">
<meta property="og:description" content="MONKOS AI ID Photo gallery - sample photos">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/gallery">
<link rel="canonical" href="https://monkos.ai/gallery">`;

  const imagesHtml = items.map(item => `
      <div class="gallery-item" data-category="${escapeHtml(item.category || '일반')}">
        <img src="${escapeHtml(item.imageUrl)}" alt="AI ID photo by MONKOS (monkos.ai) — ${escapeHtml(item.caption || 'Studio-quality portrait')}" loading="lazy" onclick="openLightbox(this)">
        ${item.caption ? `<p class="gallery-caption">${escapeHtml(item.caption)}</p>` : ''}
      </div>`).join('');

  const filterHtml = allCategories.map(cat =>
    `<button class="gallery-filter-btn" onclick="filterGallery('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>`
  ).join('');

  const pageStyle = `
.gallery-header { margin-bottom: 24px; }
.gallery-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); }
.gallery-filters { display: flex; gap: 8px; margin: 16px 0 24px; flex-wrap: wrap; }
.gallery-filter-btn {
  padding: 6px 16px; border-radius: 20px; font-size: 13px;
  background: var(--surface); border: 1px solid var(--border); color: var(--text-dim);
  cursor: pointer; transition: all 0.2s;
}
.gallery-filter-btn:hover, .gallery-filter-btn.active { border-color: var(--accent); color: var(--accent); }
.gallery-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px;
}
.gallery-item {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  overflow: hidden; transition: border-color 0.2s;
}
.gallery-item:hover { border-color: var(--border-hover); }
.gallery-item img {
  width: 100%; height: 280px; object-fit: cover; cursor: pointer;
  transition: transform 0.3s;
}
.gallery-item img:hover { transform: scale(1.02); }
.gallery-caption { padding: 10px 14px; font-size: 13px; color: var(--text-dim); }
/* Lightbox */
.lightbox {
  display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.9); z-index: 9999; align-items: center; justify-content: center;
  cursor: pointer;
}
.lightbox.open { display: flex; }
.lightbox img { max-width: 90%; max-height: 90%; border-radius: 8px; }
@media (max-width: 600px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } .gallery-item img { height: 180px; } }`;

  const bodyContent = `
  <div class="gallery-header">
    <h1>Gallery</h1>
  </div>
  <div class="gallery-filters">
    <button class="gallery-filter-btn active" onclick="filterGallery('all')">All</button>
    ${filterHtml}
  </div>
  <div class="gallery-grid" id="galleryGrid">${imagesHtml || '<p style="color:var(--text-dim)">No photos yet.</p>'}</div>
</div>
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <img id="lightboxImg" src="" alt="">
</div>`;

  const pageScript = `
function filterGallery(cat) {
  document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.gallery-item').forEach(el => {
    el.style.display = (cat === 'all' || el.dataset.category === cat) ? '' : 'none';
  });
}
function openLightbox(img) {
  document.getElementById('lightboxImg').src = img.src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}`;

  return { title: 'Gallery | MONKOS AI', description: 'MONKOS AI ID Photo gallery', seoMeta, htmlLang: 'ko', pageStyle, bodyContent, pageScript };
}

// GET /gallery — 갤러리 공개 페이지 (기존 호출 호환)
export async function renderGallery(req, res) {
  try {
    const parts = await galleryFragment(req);
    // 갤러리는 lightbox가 container 밖에 있으므로 커스텀 셸 사용
    const html = `${layoutHead(parts.title, parts.description, parts.seoMeta || '', parts.htmlLang || 'ko')}
${parts.pageStyle ? `<style>${parts.pageStyle}</style>` : ''}
</head>
<body>
${layoutNav()}
<div class="container">
  ${parts.bodyContent}
${layoutFooter()}
${parts.pageScript ? `<script>${parts.pageScript}</script>` : ''}
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 갤러리 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Board (게시판)
// =============================================

// 게시판 목록 — fragment
export async function boardListFragment(req) {
  const url = new URL(req.url, 'https://monkos.ai');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = 20;

  const snapshot = await boardCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();
  const allPosts = snapshot.docs.map(doc => {
    const d = doc.data();
    return { id: doc.id, author: d.author, title: d.title, category: d.category, hasReply: Array.isArray(d.replies) && d.replies.length > 0, createdAt: d.createdAt };
  });
  const totalPages = Math.ceil(allPosts.length / perPage);
  const posts = allPosts.slice((page - 1) * perPage, page * perPage);

  const seoMeta = `<meta property="og:title" content="Board | MONKOS AI">
<meta property="og:description" content="MONKOS customer board">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/board">
<link rel="canonical" href="https://monkos.ai/board">`;

  const rowsHtml = posts.map(p => `
      <a href="/board/${escapeHtml(p.id)}" class="board-row">
        <span class="board-cat">${escapeHtml(p.category || '')}</span>
        <span class="board-title">${escapeHtml(p.title)}${p.hasReply ? ' <span class="board-replied">answered</span>' : ''}</span>
        <span class="board-meta">${escapeHtml(p.author || '')} &middot; ${(p.createdAt || '').substring(0, 10)}</span>
      </a>`).join('');

  let paginationHtml = '';
  if (totalPages > 1) {
    const links = [];
    if (page > 1) links.push(`<a href="/board?page=${page - 1}">&laquo;</a>`);
    for (let i = 1; i <= totalPages; i++) {
      links.push(i === page ? `<span class="pg-current">${i}</span>` : `<a href="/board?page=${i}">${i}</a>`);
    }
    if (page < totalPages) links.push(`<a href="/board?page=${page + 1}">&raquo;</a>`);
    paginationHtml = `<div class="pagination">${links.join('')}</div>`;
  }

  const pageStyle = `
.board-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.board-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); }
.btn-write {
  padding: 10px 20px; background: var(--accent); color: var(--bg);
  border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-write:hover { background: var(--accent2); }
.board-list { display: flex; flex-direction: column; gap: 2px; }
.board-row {
  display: grid; grid-template-columns: 80px 1fr 140px; gap: 12px; align-items: center;
  padding: 14px 16px; background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); transition: border-color 0.2s;
}
.board-row:hover { border-color: var(--border-hover); }
.board-cat { font-size: 12px; color: var(--accent); background: var(--surface2); padding: 3px 10px; border-radius: 10px; text-align: center; }
.board-title { font-size: 14px; font-weight: 500; color: var(--text-bright); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.board-replied { font-size: 11px; color: var(--success); background: rgba(52,211,153,0.15); padding: 2px 8px; border-radius: 8px; margin-left: 6px; }
.board-meta { font-size: 12px; color: var(--text-dim); text-align: right; }
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 32px; }
.pagination a, .pagination .pg-current { padding: 8px 14px; border-radius: 6px; font-size: 14px; }
.pagination a { background: var(--surface); color: var(--text-dim); border: 1px solid var(--border); }
.pagination a:hover { border-color: var(--accent); color: var(--accent); }
.pg-current { background: var(--accent); color: var(--bg); font-weight: 600; }
@media (max-width: 600px) {
  .board-row { grid-template-columns: 1fr; gap: 4px; }
  .board-meta { text-align: left; }
}`;

  const bodyContent = `
  <div class="board-header">
    <h1>Board</h1>
    <a href="/board/write" class="btn-write">Write</a>
  </div>
  <div class="board-list">
    ${rowsHtml || '<p style="color:var(--text-dim);text-align:center;padding:40px">No posts yet.</p>'}
  </div>
  ${paginationHtml}`;

  return { title: 'Board | MONKOS AI', description: 'MONKOS customer board', seoMeta, htmlLang: 'ko', pageStyle, bodyContent, pageScript: null };
}

// GET /board — 게시판 목록 (기존 호출 호환)
export async function renderBoardList(req, res) {
  try {
    const parts = await boardListFragment(req);
    // Board는 container max-width가 다름
    const html = `${layoutHead(parts.title, parts.description, parts.seoMeta || '', parts.htmlLang || 'ko')}
${parts.pageStyle ? `<style>${parts.pageStyle}</style>` : ''}
</head>
<body>
${layoutNav()}
<div class="container" style="max-width:900px;">
  ${parts.bodyContent}
</div>
${layoutFooter()}
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 게시판 목록 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// 게시판 상세 — fragment
export async function boardPostFragment(req) {
  const id = decodeURIComponent(req.url.split('/board/')[1]?.split('?')[0] || '');
  if (!id || id === 'write') return null;

  const doc = await boardCollection.doc(id).get();
  if (!doc.exists || !doc.data().published) return null;

  const post = doc.data();
  const repliesHtml = (post.replies || []).map(r => `
      <div class="reply-item">
        <div class="reply-author">MONKOS</div>
        <div class="reply-text">${escapeHtml(r.text)}</div>
        <div class="reply-date">${(r.createdAt || '').substring(0, 10)}</div>
      </div>`).join('');

  const pageStyle = `
.post-back { display: inline-block; margin-bottom: 24px; color: var(--text-dim); font-size: 14px; }
.post-back:hover { color: var(--accent); }
.board-post { max-width: 800px; margin: 0 auto; }
.board-post-header { margin-bottom: 24px; }
.board-post-header h1 { font-size: 24px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.board-post-meta { font-size: 13px; color: var(--text-dim); display: flex; gap: 16px; }
.board-post-body {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 24px; font-size: 15px; line-height: 1.8; white-space: pre-wrap; color: var(--text);
  margin-bottom: 24px;
}
.replies-section h3 { font-size: 16px; color: var(--text-bright); margin-bottom: 12px; }
.reply-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  padding: 16px; margin-bottom: 8px;
}
.reply-author { font-size: 13px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }
.reply-text { font-size: 14px; color: var(--text); line-height: 1.6; white-space: pre-wrap; }
.reply-date { font-size: 12px; color: var(--text-dim); margin-top: 8px; }
.btn-delete {
  margin-top: 16px; padding: 8px 16px; background: transparent;
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-dim); font-size: 13px; cursor: pointer;
}
.btn-delete:hover { border-color: #f87171; color: #f87171; }`;

  const bodyContent = `
  <a href="/board" class="post-back">&larr; Back to Board</a>
  <div class="board-post">
    <div class="board-post-header">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="board-post-meta">
        <span>${escapeHtml(post.author || '')}</span>
        <span>${escapeHtml(post.category || '')}</span>
        <span>${(post.createdAt || '').substring(0, 10)}</span>
      </div>
    </div>
    <div class="board-post-body">${escapeHtml(post.content)}</div>
    ${repliesHtml ? `<div class="replies-section"><h3>Replies</h3>${repliesHtml}</div>` : ''}
    <button class="btn-delete" onclick="deletePost('${escapeHtml(doc.id)}')">Delete</button>
  </div>`;

  const pageScript = `
async function deletePost(id) {
  const pw = prompt('Enter password to delete');
  if (!pw) return;
  try {
    const r = await fetch('/api/board/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await r.json();
    if (data.success) { alert('Deleted'); location.href = '/board'; }
    else alert(data.error || 'Failed');
  } catch { alert('Error'); }
}`;

  return { title: `${post.title} | Board`, description: 'MONKOS Board', seoMeta: null, htmlLang: 'ko', pageStyle, bodyContent, pageScript };
}

// GET /board/:id — 게시글 상세 (기존 호출 호환)
export async function renderBoardPost(req, res) {
  try {
    const parts = await boardPostFragment(req);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 게시판 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// 게시판 글쓰기 — fragment
export async function boardWriteFragment(req) {
  const pageStyle = `
.write-form { max-width: 700px; margin: 0 auto; }
.write-form h1 { font-size: 24px; font-weight: 700; color: var(--text-bright); margin-bottom: 24px; }
.form-row { margin-bottom: 16px; }
.form-row label { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 500; }
.form-row input, .form-row select, .form-row textarea {
  width: 100%; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 14px; outline: none;
  font-family: inherit;
}
.form-row input:focus, .form-row select:focus, .form-row textarea:focus { border-color: var(--accent); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.btn-submit {
  padding: 14px 32px; background: var(--accent); color: var(--bg);
  border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
  margin-top: 8px;
}
.btn-submit:hover { background: var(--accent2); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.post-back { display: inline-block; margin-bottom: 24px; color: var(--text-dim); font-size: 14px; }
.post-back:hover { color: var(--accent); }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }`;

  const bodyContent = `
  <a href="/board" class="post-back">&larr; Back to Board</a>
  <div class="write-form">
    <h1>Write</h1>
    <div class="form-grid">
      <div class="form-row">
        <label>Nickname</label>
        <input type="text" id="author" maxlength="50" placeholder="Your name">
      </div>
      <div class="form-row">
        <label>Password (for delete)</label>
        <input type="password" id="password" maxlength="50" placeholder="Password">
      </div>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <label>Title</label>
        <input type="text" id="title" maxlength="200" placeholder="Title">
      </div>
      <div class="form-row">
        <label>Category</label>
        <select id="category">
          <option value="후기">후기 (Review)</option>
          <option value="문의">문의 (Inquiry)</option>
          <option value="건의">건의 (Suggestion)</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <label>Content</label>
      <textarea id="content" rows="10" maxlength="5000" placeholder="Write your message..."></textarea>
    </div>
    <button class="btn-submit" id="submitBtn" onclick="submitPost()">Submit</button>
  </div>`;

  const pageScript = `
async function submitPost() {
  const btn = document.getElementById('submitBtn');
  const body = {
    author: document.getElementById('author').value.trim(),
    title: document.getElementById('title').value.trim(),
    content: document.getElementById('content').value.trim(),
    password: document.getElementById('password').value,
    category: document.getElementById('category').value,
  };
  if (!body.author || !body.title || !body.content || !body.password) {
    alert('All fields are required');
    return;
  }
  btn.disabled = true;
  try {
    const r = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (r.ok && data.id) {
      location.href = '/board/' + data.id;
    } else {
      alert(data.error || 'Failed');
      btn.disabled = false;
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
  }
}`;

  return { title: 'Write | Board', description: 'Write a post on MONKOS board', seoMeta: null, htmlLang: 'ko', pageStyle, bodyContent, pageScript };
}

// GET /board/write — 글쓰기 폼 (기존 호출 호환)
export async function renderBoardWrite(req, res) {
  try {
    const parts = await boardWriteFragment(req);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 글쓰기 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Guide (사용 가이드)
// =============================================

// 가이드 — fragment
export async function guideFragment(req) {
  const guideJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "AI 증명사진 촬영 가이드",
    "description": "AI로 여권·이력서용 증명사진을 촬영하는 방법",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "규격 선택", "text": "여권, 이력서 등 용도에 맞는 증명사진 규격을 선택합니다." },
      { "@type": "HowToStep", "position": 2, "name": "셀카 촬영", "text": "밝은 곳에서 흰 배경 앞에 셀카를 촬영합니다." },
      { "@type": "HowToStep", "position": 3, "name": "AI 리터칭", "text": "AI가 배경 제거, 얼굴 보정, 규격 크롭을 자동 처리합니다." },
      { "@type": "HowToStep", "position": 4, "name": "다운로드", "text": "완성된 증명사진을 다운로드합니다." }
    ]
  });

  const seoMeta = `<meta property="og:title" content="AI 증명사진 촬영 가이드 — 여권·이력서 규격별 촬영법 | MONKOS">
<meta property="og:description" content="AI로 여권·이력서용 증명사진을 촬영하는 4단계 가이드. 규격 선택부터 다운로드까지.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/guide">
<link rel="canonical" href="https://monkos.ai/guide">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/guide">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/guide">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/guide">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/guide">
<script type="application/ld+json">${guideJsonLd}</script>`;

  const pageStyle = `
.guide-header { margin-bottom: 32px; }
.guide-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); }
.guide-header p { color: var(--text-dim); margin-top: 8px; font-size: 15px; }
.guide-section { margin-bottom: 40px; }
.guide-section h2 {
  font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.guide-steps {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;
}
.guide-step-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 24px 20px; text-align: center; transition: border-color 0.2s;
}
.guide-step-card:hover { border-color: var(--border-hover); }
.step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--accent); color: #fff; font-weight: 700; font-size: 15px;
  margin-bottom: 12px;
}
.step-title { font-size: 16px; font-weight: 600; color: var(--text-bright); margin-bottom: 8px; }
.step-desc { font-size: 14px; color: var(--text-dim); line-height: 1.6; }
.guide-tip {
  background: rgba(108,79,255,0.06); border: 1px solid var(--border);
  border-radius: 10px; padding: 16px 20px; margin-bottom: 12px;
}
.guide-tip strong { color: var(--accent); }
.guide-tip p { font-size: 14px; color: var(--text-dim); line-height: 1.7; margin-top: 4px; }
.guide-cta {
  text-align: center; margin-top: 40px; padding: 32px;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px;
}
.guide-cta h3 { font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 12px; }
.guide-cta-links { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
.guide-cta-links a {
  padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
  transition: opacity 0.2s;
}
.guide-cta-links .primary { background: var(--accent); color: #fff; }
.guide-cta-links .primary:hover { opacity: 0.9; color: #fff; }
.guide-cta-links .secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
.guide-cta-links .secondary:hover { border-color: var(--accent); color: var(--accent); }
@media (max-width: 600px) {
  .guide-steps { grid-template-columns: 1fr; }
}`;

  const bodyContent = `
  <div class="guide-header">
    <h1>사용 가이드</h1>
    <p>MONKOS AI 증명사진 촬영법과 앱 사용법을 안내합니다</p>
  </div>

  <div class="guide-section">
    <h2>AI 증명사진 촬영 가이드</h2>
    <div class="guide-steps">
      <div class="guide-step-card">
        <div class="step-num">1</div>
        <div class="step-title">규격 선택</div>
        <div class="step-desc">여권(3.5×4.5cm), 반명함(3×4cm), 신분증 등 원하는 규격을 선택합니다. <a href="/specs" style="color:var(--accent);">규격 확인하기 →</a></div>
      </div>
      <div class="guide-step-card">
        <div class="step-num">2</div>
        <div class="step-title">셀카 촬영</div>
        <div class="step-desc">AI 코칭 가이드를 따라 정면 셀카를 촬영합니다. 밝은 곳에서 촬영하면 더 좋은 결과를 얻을 수 있습니다.</div>
      </div>
      <div class="guide-step-card">
        <div class="step-num">3</div>
        <div class="step-title">AI 리터칭</div>
        <div class="step-desc">배경 정리, 조명 보정, 피부 보정, 의상 정돈까지 AI가 자동으로 처리합니다.</div>
      </div>
      <div class="guide-step-card">
        <div class="step-num">4</div>
        <div class="step-title">다운로드</div>
        <div class="step-desc">ICAO 국제 규격에 맞는 증명사진을 고화질로 다운로드합니다.</div>
      </div>
    </div>
  </div>

  <div class="guide-section">
    <h2>촬영 팁</h2>
    <div class="guide-tip">
      <strong>조명</strong>
      <p>자연광이 들어오는 창가 또는 밝은 실내 조명 아래에서 촬영하세요. 역광은 피해 주세요.</p>
    </div>
    <div class="guide-tip">
      <strong>포즈</strong>
      <p>정면을 바라보고, 어깨를 곧게 펴세요. 자연스러운 표정이 가장 좋습니다.</p>
    </div>
    <div class="guide-tip">
      <strong>배경</strong>
      <p>AI가 배경을 자동 보정하지만, 단색 배경에서 촬영하면 더 깔끔한 결과물을 얻습니다.</p>
    </div>
    <div class="guide-tip">
      <strong>복장</strong>
      <p>증명사진용 단정한 복장을 권장합니다. AI가 의상을 정돈하지만 기본 복장이 좋을수록 결과가 좋습니다.</p>
    </div>
  </div>

  <div class="guide-section">
    <h2>무료 크롭앱 사용법</h2>
    <div class="guide-steps">
      <div class="guide-step-card">
        <div class="step-num">1</div>
        <div class="step-title">사진 선택</div>
        <div class="step-desc">갤러리에서 사진을 선택하거나 카메라로 촬영합니다.</div>
      </div>
      <div class="guide-step-card">
        <div class="step-num">2</div>
        <div class="step-title">규격 크롭</div>
        <div class="step-desc">여권, 반명함 등 원하는 규격에 맞춰 자동 크롭합니다.</div>
      </div>
      <div class="guide-step-card">
        <div class="step-num">3</div>
        <div class="step-title">배경 제거/교체</div>
        <div class="step-desc">누끼(배경 제거)와 배경색 교체를 서버 전송 없이 처리합니다.</div>
      </div>
      <div class="guide-step-card">
        <div class="step-num">4</div>
        <div class="step-title">다운로드</div>
        <div class="step-desc">완성된 사진을 바로 다운로드합니다. 무료, 크레딧 소모 없음.</div>
      </div>
    </div>
  </div>

  <div class="guide-cta">
    <h3>지금 바로 시작하세요</h3>
    <div class="guide-cta-links">
      <a href="/" class="primary">AI 증명사진 촬영</a>
      <a href="/crop" class="secondary">무료 크롭앱</a>
      <a href="/specs" class="secondary">📋 규격 확인하기 →</a>
    </div>
  </div>`;

  return { title: 'AI 증명사진 촬영 가이드 — 여권·이력서 규격별 촬영법 | MONKOS', description: 'AI로 여권·이력서용 증명사진을 촬영하는 4단계 가이드. 규격 선택부터 다운로드까지.', seoMeta, htmlLang: 'ko', pageStyle, bodyContent, pageScript: null };
}

// GET /guide — 사용 가이드 (SSR)
export async function renderGuide(req, res) {
  try {
    const parts = await guideFragment(req);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 가이드 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Specs (규격 허브)
// =============================================

import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const SPECS_DATA = _require('./specs-data.json');

const SPECS_I18N = {
  ko: {
    hubTitle: '증명사진 규격 가이드 — 국가별·용도별 사이즈 총정리 | MONKOS',
    hubDesc: '한국 여권·반명함, 일본 패스포트·이력서, 미국 비자 등 증명사진 규격을 한눈에. 사이즈·배경·복장 기준과 반려 사유까지.',
    hubH1: '증명사진 규격 가이드',
    hubSub: '국가별·용도별 사이즈, 배경, 복장 기준과 반려 사유까지 한눈에 확인하세요.',
    detailSuffix: '규격 — 사이즈·배경·복장 완벽 가이드 | MONKOS',
    tableHeaders: { size: '사이즈', pixels: '해상도', dpi: 'DPI', background: '배경', headHeight: '머리 높이', validity: '유효기간', fileSpec: '파일 규격' },
    detailsTitle: '상세 규정',
    rejectionTitle: '반려 사유 TOP 5',
    faqTitle: '자주 묻는 질문',
    ctaAI: 'AI로 촬영하기 →',
    ctaCrop: '무료 크롭앱 →',
    relatedTitle: '관련 콘텐츠',
    relatedLinks: [
      { label: '사용 가이드', href: '/guide' },
      { label: '무료 크롭앱', href: '/crop' },
      { label: 'FAQ', href: '/faq' },
    ],
    sameCountryLabel: '같은 국가 다른 규격',
    specLabel: '규격 보기',
  },
  ja: {
    hubTitle: '証明写真 規格ガイド — 国別・用途別サイズ総まとめ | MONKOS',
    hubDesc: '韓国パスポート・半名刺、日本パスポート・履歴書、米国ビザなど証明写真規格を一覧で。サイズ・背景・服装基準と却下理由まで。',
    hubH1: '証明写真 規格ガイド',
    hubSub: '国別・用途別のサイズ、背景、服装基準と却下理由をまとめて確認できます。',
    detailSuffix: '規格 — サイズ・背景・服装 完全ガイド | MONKOS',
    tableHeaders: { size: 'サイズ', pixels: '解像度', dpi: 'DPI', background: '背景', headHeight: '頭の高さ', validity: '有効期限', fileSpec: 'ファイル規格' },
    detailsTitle: '詳細規定',
    rejectionTitle: '却下理由 TOP 5',
    faqTitle: 'よくある質問',
    ctaAI: 'AIで撮影する →',
    ctaCrop: '無料クロップアプリ →',
    relatedTitle: '関連コンテンツ',
    relatedLinks: [
      { label: 'ご利用ガイド', href: '/guide' },
      { label: '無料クロップアプリ', href: '/crop' },
      { label: 'FAQ', href: '/ja/faq' },
    ],
    sameCountryLabel: '同じ国の別の規格',
    specLabel: '規格を見る',
  },
  en: {
    hubTitle: 'ID Photo Specifications Guide — Size & Requirements by Country | MONKOS',
    hubDesc: 'Korea passport & resume, Japan passport & resume, US visa photo specs at a glance. Size, background, dress code and rejection reasons.',
    hubH1: 'ID Photo Specifications Guide',
    hubSub: 'Size, background, dress code standards and rejection reasons by country and purpose.',
    detailSuffix: 'Specs — Size, Background & Dress Code Complete Guide | MONKOS',
    tableHeaders: { size: 'Size', pixels: 'Resolution', dpi: 'DPI', background: 'Background', headHeight: 'Head Height', validity: 'Validity', fileSpec: 'File Spec' },
    detailsTitle: 'Detailed Requirements',
    rejectionTitle: 'Top 5 Rejection Reasons',
    faqTitle: 'Frequently Asked Questions',
    ctaAI: 'Take with AI →',
    ctaCrop: 'Free Crop App →',
    relatedTitle: 'Related Content',
    relatedLinks: [
      { label: 'User Guide', href: '/guide' },
      { label: 'Free Crop App', href: '/crop' },
      { label: 'FAQ', href: '/en/faq' },
    ],
    sameCountryLabel: 'Other specs for the same country',
    specLabel: 'View specs',
  },
};

// specs 공통 스타일
const SPECS_PAGE_STYLE = `
/* === Hub (목록) === */
.specs-hub-header { text-align: center; margin-bottom: 40px; }
.specs-hub-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.specs-hub-header p { color: var(--text-dim); font-size: 15px; }
.specs-country-group { margin-bottom: 36px; }
.specs-country-group h2 {
  font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.specs-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
}
.specs-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 24px 20px; transition: border-color 0.2s, box-shadow 0.2s;
  text-decoration: none; display: block; color: inherit;
}
.specs-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(108,79,255,0.08); }
.specs-card-type { font-size: 17px; font-weight: 600; color: var(--text-bright); margin-bottom: 6px; }
.specs-card-size { font-size: 14px; color: var(--accent); font-weight: 500; margin-bottom: 4px; }
.specs-card-desc { font-size: 13px; color: var(--text-dim); line-height: 1.5; }

/* === Detail 공통 === */
.specs-back { display: inline-block; margin-bottom: 20px; font-size: 13px; color: var(--accent); text-decoration: none; }
.specs-back:hover { text-decoration: underline; }

/* === Hero 2열 레이아웃 === */
.specs-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 40px; }
.specs-hero-text h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); line-height: 1.3; margin-bottom: 12px; }
.specs-hero-text .specs-hero-desc { color: var(--text-dim); font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
.specs-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.specs-hero-tags span {
  background: rgba(108,79,255,0.08); color: var(--accent); padding: 4px 12px;
  border-radius: 20px; font-size: 13px; font-weight: 500;
}

/* 규격 다이어그램 */
.specs-diagram {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px;
  padding: 32px; display: flex; justify-content: center; align-items: center; position: relative;
}
.specs-photo-frame {
  width: 175px; height: 225px; background: var(--surface2, #f9fafb);
  border: 2px dashed var(--accent); border-radius: 4px; position: relative;
  display: flex; align-items: center; justify-content: center;
}
.specs-photo-frame svg { opacity: 0.15; }
.specs-guide-w {
  position: absolute; bottom: -28px; left: 0; right: 0; text-align: center;
  font-size: 12px; color: var(--accent); font-weight: 600;
}
.specs-guide-h {
  position: absolute; top: 0; bottom: 0; right: -50px;
  display: flex; align-items: center; font-size: 12px; color: var(--accent); font-weight: 600;
  writing-mode: vertical-rl;
}
.specs-guide-h::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: -8px; width: 1px; background: var(--accent);
}
.specs-head-guide {
  position: absolute; top: 20px; left: -45px; height: 144px;
  display: flex; align-items: center; font-size: 11px; color: #ef4444; font-weight: 500;
  writing-mode: vertical-rl;
}
.specs-head-guide::before {
  content: ''; position: absolute; top: 0; bottom: 0; right: -6px; width: 1px;
  background: #ef4444; opacity: 0.5;
}

/* === 테이블 === */
.specs-table {
  width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 32px;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
}
.specs-table th, .specs-table td { padding: 14px 20px; text-align: left; font-size: 14px; }
.specs-table th {
  background: var(--surface2); font-weight: 600; color: var(--text-bright); width: 140px; font-size: 13px;
  border-right: 1px solid var(--border);
}
.specs-table td { color: var(--text); }
.specs-table tr:not(:last-child) th,
.specs-table tr:not(:last-child) td { border-bottom: 1px solid var(--border); }

/* === 상세 규정 그리드 === */
.specs-section { margin-bottom: 32px; }
.specs-section h2 {
  font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 16px;
}
.specs-section p { font-size: 14px; color: var(--text); line-height: 1.8; }
.specs-details-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.specs-detail-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px;
  background: var(--surface2, #f8f9fc); border-radius: 8px; font-size: 14px; color: var(--text);
}
.specs-detail-item .sdi-icon { flex-shrink: 0; font-size: 16px; width: 24px; text-align: center; }

/* === O/X 비교 카드 === */
.specs-ox-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.specs-ox-card {
  background: var(--card-bg); border-radius: 12px; overflow: hidden; border: 2px solid var(--border);
}
.specs-ox-card.ox-good { border-color: #22c55e; }
.specs-ox-card.ox-bad { border-color: #ef4444; }
.specs-ox-header { padding: 10px 16px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.specs-ox-card.ox-good .specs-ox-header { background: rgba(34,197,94,0.08); color: #166534; }
.specs-ox-card.ox-bad .specs-ox-header { background: rgba(239,68,68,0.08); color: #991b1b; }
.specs-ox-body {
  padding: 20px; display: flex; justify-content: center; align-items: center;
  background: var(--surface2, #fafafa); min-height: 180px;
}
.specs-ox-photo {
  width: 120px; height: 154px; background: var(--card-bg); border: 2px dashed #ddd;
  border-radius: 4px; display: flex; align-items: center; justify-content: center;
}
.specs-ox-card.ox-good .specs-ox-photo { border-color: #22c55e; }
.specs-ox-card.ox-bad .specs-ox-photo { border-color: #ef4444; }
.specs-ox-photo svg { opacity: 0.3; }
.specs-ox-caption { margin-top: 10px; font-size: 12px; color: var(--text-dim); text-align: center; }
.specs-ox-points { padding: 12px 16px; border-top: 1px solid var(--border); list-style: none; margin: 0; }
.specs-ox-points li {
  font-size: 13px; color: var(--text-dim); padding: 3px 0; display: flex; align-items: center; gap: 6px;
}

/* === 반려 사유 2열 카드 === */
.specs-rejection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; list-style: none; padding: 0; }
.specs-rejection-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; display: flex; gap: 14px; align-items: flex-start;
  transition: box-shadow 0.2s;
}
.specs-rejection-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.specs-rj-badge {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #ef4444; color: #fff; font-weight: 700; font-size: 14px;
}
.specs-rj-info h4 { font-size: 14px; font-weight: 600; color: var(--text-bright); margin: 0 0 4px 0; }
.specs-rj-info p { font-size: 13px; color: var(--text-dim); margin: 0; line-height: 1.5; }

/* === FAQ 아코디언 === */
.specs-faq { list-style: none; padding: 0; }
.specs-faq-item {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px;
  margin-bottom: 8px; overflow: hidden;
}
.specs-faq-q {
  padding: 16px 20px; font-weight: 600; font-size: 15px; color: var(--text-bright);
  cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none;
}
.specs-faq-q::before { content: "Q"; color: var(--accent); font-weight: 700; font-size: 14px; }
.specs-faq-q::after {
  content: "\\25BE"; margin-left: auto; color: var(--text-dim); font-size: 12px;
  transition: transform 0.2s;
}
.specs-faq-item.open .specs-faq-q::after { transform: rotate(180deg); }
.specs-faq-a {
  padding: 0 20px 16px 46px; font-size: 14px; color: var(--text-dim);
  line-height: 1.7; display: none;
}
.specs-faq-item.open .specs-faq-a { display: block; }

/* === CTA 배너 === */
.specs-cta {
  background: linear-gradient(135deg, var(--accent) 0%, #8b6fff 100%);
  border-radius: 16px; padding: 36px 40px;
  display: flex; align-items: center; justify-content: space-between;
  margin: 32px 0;
}
.specs-cta-text h3 { color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 4px 0; }
.specs-cta-text p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
.specs-cta-buttons { display: flex; gap: 12px; }
.specs-cta-buttons a {
  padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
  text-decoration: none; transition: all 0.2s;
}
.specs-cta-buttons .primary { background: #fff; color: var(--accent); }
.specs-cta-buttons .primary:hover { background: #f0f0ff; color: var(--accent); }
.specs-cta-buttons .secondary {
  background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3);
}

/* === 관련 콘텐츠 === */
.specs-related {
  margin-top: 32px; padding: 20px 24px;
  background: var(--surface, var(--card-bg)); border: 1px solid var(--border); border-radius: 12px;
}
.specs-related h3 { font-size: 15px; font-weight: 600; color: var(--text-bright); margin-bottom: 12px; }
.specs-related-links { display: flex; flex-wrap: wrap; gap: 10px; }
.specs-related-links a {
  font-size: 13px; color: var(--accent); text-decoration: none; padding: 6px 14px;
  background: rgba(108,79,255,0.06); border-radius: 8px; transition: all 0.2s;
  border: 1px solid transparent;
}
.specs-related-links a:hover { background: rgba(108,79,255,0.12); border-color: var(--accent); }

/* === 반응형 === */
@media (max-width: 768px) {
  .specs-hero { grid-template-columns: 1fr; }
  .specs-diagram { order: -1; }
  .specs-details-grid { grid-template-columns: 1fr; }
  .specs-ox-compare { grid-template-columns: 1fr; }
  .specs-rejection-grid { grid-template-columns: 1fr; }
  .specs-cta { flex-direction: column; text-align: center; gap: 20px; }
}
@media (max-width: 600px) {
  .specs-grid { grid-template-columns: 1fr; }
  .specs-table th { width: 100px; }
}`;

// 규격 허브 인덱스 (/specs)
export function specsListFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;

  // 국가별 그룹핑
  const groups = {};
  const sortedSpecs = Object.values(SPECS_DATA).sort((a, b) => a.priority - b.priority);
  for (const spec of sortedSpecs) {
    const country = lang === 'ja' ? spec.country : (lang === 'en' ? spec.countryEn : spec.country);
    if (!groups[country]) groups[country] = [];
    groups[country].push(spec);
  }

  // ItemList JSON-LD
  const itemListJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": i.hubH1,
    "itemListElement": sortedSpecs.map((spec, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://monkos.ai${prefix}/specs/${spec.slug}`,
      "name": lang === 'ja' ? (spec.typeJa || spec.type) : (lang === 'en' ? spec.typeEn : spec.type),
    })),
  });

  const canonicalUrl = lang === 'ko' ? 'https://monkos.ai/specs' : `https://monkos.ai/${lang}/specs`;
  const hreflangTags = [
    '<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs">',
    '<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs">',
    '<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs">',
    '<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs">',
  ].join('\n');

  const seoMeta = `<meta property="og:title" content="${escapeHtml(i.hubH1)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(i.hubDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${itemListJsonLd}</script>`;

  // 카드 그리드
  const groupsHtml = Object.entries(groups).map(([country, specs]) => {
    const cards = specs.map(spec => {
      const typeName = lang === 'ja' ? (spec.typeJa || spec.type) : (lang === 'en' ? spec.typeEn : spec.type);
      const detail = spec.details[lang] || spec.details.ko || spec.details.en || '';
      const shortDesc = detail.length > 60 ? detail.substring(0, 60) + '…' : detail;
      return `<a href="${prefix}/specs/${spec.slug}" class="specs-card">
        <div class="specs-card-type">${escapeHtml(typeName)}</div>
        <div class="specs-card-size">${escapeHtml(spec.size)} · ${escapeHtml(spec.pixels)}</div>
        <div class="specs-card-desc">${escapeHtml(shortDesc)}</div>
      </a>`;
    }).join('\n      ');
    return `<div class="specs-country-group">
      <h2>${escapeHtml(country)}</h2>
      <div class="specs-grid">
        ${cards}
      </div>
    </div>`;
  }).join('\n    ');

  const bodyContent = `
  <div class="specs-hub-header">
    <h1>${escapeHtml(i.hubH1)}</h1>
    <p>${escapeHtml(i.hubSub)}</p>
  </div>
  ${groupsHtml}`;

  return {
    title: i.hubTitle,
    description: i.hubDesc,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_PAGE_STYLE,
    bodyContent,
    pageScript: null,
  };
}

// 개별 규격 페이지 (/specs/:slug)
export function specsDetailFragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;

  const typeName = lang === 'ja' ? (specData.typeJa || specData.type) : (lang === 'en' ? specData.typeEn : specData.type);
  const countryName = lang === 'en' ? specData.countryEn : specData.country;
  const title = `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = specData.details[lang] || specData.details.ko || specData.details.en || '';

  const canonicalUrl = lang === 'ko' ? `https://monkos.ai/specs/${slug}` : `https://monkos.ai/${lang}/specs/${slug}`;
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/${slug}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/${slug}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/${slug}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/${slug}">`,
  ].join('\n');

  // FAQ 데이터
  const faqs = specData.faqs[lang] || specData.faqs.ko || [];

  // JSON-LD 트리플 스택
  const specsJsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      "publisher": { "@type": "Organization", "name": "Monk Studio" },
      "datePublished": "2026-03-26",
      "dateModified": "2026-03-26",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": lang === 'ja' ? `${typeName}の規格に合わせて写真を準備する方法`
             : lang === 'en' ? `How to prepare a ${typeName} photo`
             : `${typeName} 규격에 맞게 사진 준비하는 법`,
      "step": [
        { "@type": "HowToStep", "position": 1, "name": lang === 'ja' ? '規格確認' : lang === 'en' ? 'Check specs' : '규격 확인', "text": `${specData.size} / ${specData.background}` },
        { "@type": "HowToStep", "position": 2, "name": lang === 'ja' ? 'セルフィー撮影' : lang === 'en' ? 'Take a selfie' : '셀카 촬영', "text": lang === 'ja' ? '明るい場所で白い背景の前で撮影' : lang === 'en' ? 'Take a photo in a bright area with a white background' : '밝은 곳에서 흰 배경 앞에 촬영' },
        { "@type": "HowToStep", "position": 3, "name": lang === 'ja' ? 'AI補正またはクロップ' : lang === 'en' ? 'AI retouch or crop' : 'AI 보정 또는 크롭', "text": lang === 'ja' ? 'MONKOS AIまたは無料クロップアプリで規格に合わせる' : lang === 'en' ? 'Use MONKOS AI or the free crop app to fit the specs' : 'MONKOS AI 또는 무료 크롭앱으로 규격 맞춤' },
        { "@type": "HowToStep", "position": 4, "name": lang === 'ja' ? 'ダウンロード' : lang === 'en' ? 'Download' : '다운로드', "text": lang === 'ja' ? '完成写真をダウンロード' : lang === 'en' ? 'Download the finished photo' : '완성 사진 다운로드' },
      ],
    },
  ]);

  const seoMeta = `<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${specsJsonLd}</script>`;

  // 규격 테이블
  const h = i.tableHeaders;
  const tableIconMap = { size: '📐', pixels: '🖥️', dpi: '🔍', background: '🎨', headHeight: '📏', validity: '📅', fileSpec: '📁' };
  const tableRows = [
    ['size', h.size, specData.size],
    ['pixels', h.pixels, specData.pixels],
    ['dpi', h.dpi, String(specData.dpi)],
    ['background', h.background, specData.background],
    ['headHeight', h.headHeight, specData.headHeight],
    ['validity', h.validity, specData.validity],
    ['fileSpec', h.fileSpec, specData.fileSpec],
  ].map(([key, label, val]) => `<tr><th>${tableIconMap[key] || ''} ${escapeHtml(label)}</th><td>${escapeHtml(val)}</td></tr>`).join('\n      ');

  // 상세 규정 아이콘 매핑 (details 텍스트를 파싱하여 그리드 아이템으로)
  const detailIcons = ['😐', '👓', '💇', '👂', '👔', '📸'];
  const detailLines = description.split(/[.。]\s*/).filter(d => d.trim().length > 0);
  const detailGridHtml = detailLines.map((line, idx) =>
    `<div class="specs-detail-item"><span class="sdi-icon">${detailIcons[idx] || '📋'}</span><span>${escapeHtml(line.trim())}</span></div>`
  ).join('\n        ');

  // 반려 사유 (2열 카드)
  const rejections = specData.rejectionReasons[lang] || specData.rejectionReasons.ko || [];
  const rejectionHtml = rejections.map((r, idx) =>
    `<li class="specs-rejection-card">
          <span class="specs-rj-badge">${idx + 1}</span>
          <div class="specs-rj-info"><h4>${escapeHtml(r)}</h4></div>
        </li>`
  ).join('\n        ');

  // FAQ (아코디언)
  const faqHtml = faqs.map((f, idx) =>
    `<div class="specs-faq-item${idx === 0 ? ' open' : ''}">
          <div class="specs-faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.q)}</div>
          <div class="specs-faq-a">${escapeHtml(f.a)}</div>
        </div>`
  ).join('\n        ');

  // 같은 국가 다른 규격
  const sameCountry = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameCountryLinks = sameCountry.map(s => {
    const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
    return `<a href="${prefix}/specs/${s.slug}">${escapeHtml(name)}</a>`;
  }).join('\n        ');

  // 관련 링크
  const relatedLinksHtml = i.relatedLinks.map(l =>
    `<a href="${l.href}">${escapeHtml(l.label)}</a>`
  ).join('\n        ');

  const backLabel = lang === 'ja' ? '← 全規格一覧' : lang === 'en' ? '← All Specifications' : '← 전체 규격 목록';

  // O/X 비교 i18n
  const oxGoodLabel = lang === 'ja' ? '✅ 適合写真' : lang === 'en' ? '✅ Acceptable Photo' : '✅ 적합한 사진';
  const oxBadLabel = lang === 'ja' ? '❌ 却下される写真' : lang === 'en' ? '❌ Rejected Photo' : '❌ 반려되는 사진';
  const oxGoodCaption = lang === 'ja' ? '正面・無表情・白背景' : lang === 'en' ? 'Front-facing · Neutral · White BG' : '정면 · 무표정 · 흰배경';
  const oxBadCaption = lang === 'ja' ? '傾き・影・髪' : lang === 'en' ? 'Tilted · Shadow · Hair' : '기울어짐 · 그림자 · 머리카락';

  // CTA i18n
  const ctaHeadline = lang === 'ja' ? '規格に合う写真、AIが自動で' : lang === 'en' ? 'AI makes your photo spec-ready' : '규격에 맞는 사진, AI가 자동으로';
  const ctaSub = lang === 'ja' ? '背景除去・規格クロップ・補正まで一度に' : lang === 'en' ? 'Background removal · Crop · Retouch in one step' : '배경 제거 · 규격 크롭 · 보정까지 한 번에';

  const bodyContent = `
  <a href="${prefix}/specs" class="specs-back">${escapeHtml(backLabel)}</a>

  <!-- Hero 2열 -->
  <section class="specs-hero">
    <div class="specs-hero-text">
      <h1>2026 ${escapeHtml(countryName)} ${escapeHtml(typeName)}</h1>
      <p class="specs-hero-desc">${escapeHtml(description)}</p>
      <div class="specs-hero-tags">
        <span>${escapeHtml(specData.size)}</span>
        <span>${escapeHtml(specData.background)}</span>
        <span>${escapeHtml(specData.validity)}</span>
        <span>${specData.dpi} DPI</span>
      </div>
    </div>
    <div class="specs-diagram">
      <div class="specs-photo-frame">
        <svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor">
          <ellipse cx="60" cy="45" rx="30" ry="38"/>
          <ellipse cx="60" cy="140" rx="50" ry="45"/>
        </svg>
        <div class="specs-head-guide">${escapeHtml(specData.headHeight)}</div>
        <div class="specs-guide-w">${escapeHtml(specData.size.split('×')[0].trim())}cm</div>
      </div>
      <div class="specs-guide-h">${escapeHtml(specData.size.split('×')[1]?.trim() || '4.5cm')}</div>
    </div>
  </section>

  <!-- 규격 테이블 -->
  <table class="specs-table">
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- 상세 규정 그리드 -->
  <div class="specs-section">
    <h2>${escapeHtml(i.detailsTitle)}</h2>
    <div class="specs-details-grid">
      ${detailGridHtml}
    </div>
  </div>

  <!-- O/X 비교 -->
  <div class="specs-section">
    <div class="specs-ox-compare">
      <div class="specs-ox-card ox-good">
        <div class="specs-ox-header">${oxGoodLabel}</div>
        <div class="specs-ox-body">
          <div>
            <div class="specs-ox-photo">
              <svg viewBox="0 0 60 80" width="50" height="67" fill="#aaa"><ellipse cx="30" cy="22" rx="16" ry="20"/><ellipse cx="30" cy="72" rx="26" ry="22"/></svg>
            </div>
            <div class="specs-ox-caption">${oxGoodCaption}</div>
          </div>
        </div>
      </div>
      <div class="specs-ox-card ox-bad">
        <div class="specs-ox-header">${oxBadLabel}</div>
        <div class="specs-ox-body">
          <div>
            <div class="specs-ox-photo">
              <svg viewBox="0 0 60 80" width="50" height="67" fill="#aaa" style="transform:rotate(8deg)"><ellipse cx="30" cy="22" rx="16" ry="20"/><ellipse cx="30" cy="72" rx="26" ry="22"/></svg>
            </div>
            <div class="specs-ox-caption">${oxBadCaption}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 반려 사유 TOP 5 -->
  <div class="specs-section">
    <h2>${escapeHtml(i.rejectionTitle)}</h2>
    <ul class="specs-rejection-grid">
      ${rejectionHtml}
    </ul>
  </div>

  <!-- FAQ 아코디언 -->
  <div class="specs-section">
    <h2>${escapeHtml(i.faqTitle)}</h2>
    <div class="specs-faq">
      ${faqHtml}
    </div>
  </div>

  <!-- CTA 배너 -->
  <div class="specs-cta">
    <div class="specs-cta-text">
      <h3>${ctaHeadline}</h3>
      <p>${ctaSub}</p>
    </div>
    <div class="specs-cta-buttons">
      <a href="/" class="primary">${escapeHtml(i.ctaAI)}</a>
      <a href="/crop" class="secondary">${escapeHtml(i.ctaCrop)}</a>
    </div>
  </div>

  <!-- 관련 콘텐츠 -->
  <div class="specs-related">
    <h3>${escapeHtml(i.relatedTitle)}</h3>
    <div class="specs-related-links">
      ${relatedLinksHtml}
    </div>
    ${sameCountry.length > 0 ? `<h3 style="margin-top:16px;">${escapeHtml(i.sameCountryLabel)}</h3>
    <div class="specs-related-links">
      ${sameCountryLinks}
    </div>` : ''}
  </div>`;

  return {
    title,
    description,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_PAGE_STYLE,
    bodyContent,
    pageScript: null,
  };
}

// GET /specs — 규격 허브 인덱스
export function renderSpecsList(req, res, forceLang = null) {
  try {
    const parts = specsListFragment(forceLang);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 허브 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /specs/:slug — 규격 상세 페이지
export function renderSpecsDetail(req, res, forceLang = null) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.replace(/^\/(?:ja|en)\//, '/').split('/');
    const slug = pathParts[pathParts.indexOf('specs') + 1];
    const parts = specsDetailFragment(slug, forceLang);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Sitemap
// =============================================

// GET /sitemap.xml — 동적 생성
export async function renderSitemap(req, res) {
  try {
    const today = new Date().toISOString().substring(0, 10);
    const staticUrls = [
      { loc: 'https://monkos.ai/', lastmod: today, changefreq: 'weekly', priority: '1.0' },
      { loc: 'https://monkos.ai/blog', lastmod: today, changefreq: 'daily', priority: '0.8' },
      { loc: 'https://monkos.ai/faq', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/gallery', lastmod: today, changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/board', lastmod: today, changefreq: 'daily', priority: '0.5' },
      { loc: 'https://monkos.ai/pricing', lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: 'https://monkos.ai/guide', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/crop', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/ja/blog', lastmod: today, changefreq: 'daily', priority: '0.7' },
      { loc: 'https://monkos.ai/en/blog', lastmod: today, changefreq: 'daily', priority: '0.7' },
      { loc: 'https://monkos.ai/ja/', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://monkos.ai/en/', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://monkos.ai/ja/faq', lastmod: today, changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/en/faq', lastmod: today, changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/ja/pricing', lastmod: today, changefreq: 'monthly', priority: '0.5' },
      { loc: 'https://monkos.ai/en/pricing', lastmod: today, changefreq: 'monthly', priority: '0.5' },
      // specs 허브 인덱스
      { loc: 'https://monkos.ai/specs', lastmod: today, changefreq: 'monthly', priority: '0.9' },
      { loc: 'https://monkos.ai/ja/specs', lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: 'https://monkos.ai/en/specs', lastmod: today, changefreq: 'monthly', priority: '0.8' },
    ];

    // specs 개별 페이지 동적 추가
    for (const slug of Object.keys(SPECS_DATA)) {
      staticUrls.push({ loc: `https://monkos.ai/specs/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.8' });
      staticUrls.push({ loc: `https://monkos.ai/ja/specs/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
      staticUrls.push({ loc: `https://monkos.ai/en/specs/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
    }

    const snapshot = await blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();
    const blogUrls = snapshot.docs.map(doc => {
      const data = doc.data();
      const docLang = data.lang || 'ko';
      const baseSlug = doc.id.replace(/-(?:ja|en)$/, '');
      const langPrefix = docLang === 'ko' ? '' : `/${docLang}`;
      return {
        loc: `https://monkos.ai${langPrefix}/blog/${baseSlug}`,
        lastmod: (data.updatedAt || data.createdAt || '').substring(0, 10),
        changefreq: 'weekly',
        priority: '0.7',
      };
    });

    // URL 중복 제거
    const seen = new Set();
    const allUrls = [...staticUrls, ...blogUrls].filter(u => {
      if (seen.has(u.loc)) return false;
      seen.add(u.loc);
      return true;
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);
  } catch (err) {
    log(`[CMS] sitemap 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// =============================================
// Pricing
// =============================================

const PRICING_DATA = {
  ko: {
    currency: '₩', currencyPrefix: true,
    title: '가격 안내', subtitle: 'MONKOS AI 서비스 이용 크레딧 가격표',
    svcTitle: '서비스별 크레딧 소모량',
    svcHeader: ['서비스', '소모 크레딧', '비고'],
    services: [
      { name: 'AI 리터칭 (생성)', credit: '10c', note: '셀카 1장 → AI 보정' },
      { name: '고화질 다운로드', credit: '70c', note: '인화/제출용 원본' },
      { name: 'AI 증명사진 1장 완성', credit: '80c', note: '리터칭 + 다운로드', bold: true },
      { name: '무료 크롭앱', credit: '0c', note: '규격 크롭 · 배경 제거', link: '/crop' },
    ],
    packTitle: '크레딧 팩',
    packs: [
      { credits: 70, bonus: 10, price: '₩9,900', unit: '1c ≈ ₩124', badge: '추천' },
      { credits: 100, bonus: 30, price: '₩12,900', unit: '1c ≈ ₩99' },
      { credits: 300, bonus: 120, price: '₩34,900', unit: '1c ≈ ₩83', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '₩49,900', unit: '1c ≈ ₩67' },
    ],
    cta: '크레딧 충전하기',
    creditLabel: '크레딧',
    bonusLabel: '보너스 포함',
    infoTitle: '안내',
    infoItems: [
      '첫 회원가입 시 10c 보너스 증정 (AI 리터칭 1회 체험)',
      '충전한 크레딧은 MONKOS 전 서비스에서 사용 가능',
      '부가세 포함 가격',
    ],
    refundNote: '환불 정책은 <a href="/refund">여기</a>를 확인하세요',
  },
  ja: {
    currency: '¥', currencyPrefix: true,
    title: '料金案内', subtitle: 'MONKOS AIサービス利用クレジット価格表',
    svcTitle: 'サービス別クレジット消費量',
    svcHeader: ['サービス', '消費クレジット', '備考'],
    services: [
      { name: 'AIリタッチ（生成）', credit: '10c', note: 'セルフィー1枚 → AI補正' },
      { name: '高画質ダウンロード', credit: '70c', note: '印刷/提出用原本' },
      { name: 'AI証明写真 1枚完成', credit: '80c', note: 'リタッチ + ダウンロード', bold: true },
      { name: '無料クロップアプリ', credit: '0c', note: '規格クロップ・背景除去', link: '/crop' },
    ],
    packTitle: 'クレジットパック',
    packs: [
      { credits: 70, bonus: 10, price: '¥990', unit: '1c ≈ ¥12', badge: 'おすすめ' },
      { credits: 100, bonus: 30, price: '¥1,490', unit: '1c ≈ ¥11' },
      { credits: 300, bonus: 120, price: '¥3,990', unit: '1c ≈ ¥10', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '¥5,990', unit: '1c ≈ ¥8' },
    ],
    cta: 'クレジットをチャージ',
    creditLabel: 'クレジット',
    bonusLabel: 'ボーナス含む',
    infoTitle: 'ご案内',
    infoItems: [
      '初回登録時 10cボーナス進呈（AIリタッチ1回体験）',
      'チャージしたクレジットはMONKOS全サービスで使用可能',
      '税込価格',
    ],
    refundNote: '返金ポリシーは<a href="/refund">こちら</a>をご確認ください',
  },
  en: {
    currency: '$', currencyPrefix: true,
    title: 'Pricing', subtitle: 'MONKOS AI service credit pricing',
    svcTitle: 'Credit Cost per Service',
    svcHeader: ['Service', 'Credits', 'Note'],
    services: [
      { name: 'AI Retouch (Generate)', credit: '10c', note: '1 selfie → AI enhancement' },
      { name: 'HD Download', credit: '70c', note: 'Print/submission quality' },
      { name: 'AI ID Photo (Complete)', credit: '80c', note: 'Retouch + Download', bold: true },
      { name: 'Free Crop App', credit: '0c', note: 'Spec crop & BG removal', link: '/crop' },
    ],
    packTitle: 'Credit Packs',
    packs: [
      { credits: 70, bonus: 10, price: '$6.90', unit: '1c ≈ $0.09', badge: 'Recommended' },
      { credits: 100, bonus: 30, price: '$9.90', unit: '1c ≈ $0.08' },
      { credits: 300, bonus: 120, price: '$26.90', unit: '1c ≈ $0.06', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '$39.90', unit: '1c ≈ $0.05' },
    ],
    cta: 'Buy Credits',
    creditLabel: 'Credits',
    bonusLabel: 'bonus included',
    infoTitle: 'Info',
    infoItems: [
      '+10c bonus on first sign-up (1 free AI retouch)',
      'Credits can be used across all MONKOS services',
      'Prices include tax',
    ],
    refundNote: 'See our <a href="/refund">refund policy</a> for details',
  },
};

export function pricingFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const d = PRICING_DATA[lang] || PRICING_DATA.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const canonicalUrl = `https://monkos.ai${prefix}/pricing`;

  const seoMeta = `<meta property="og:title" content="${escapeHtml(d.title)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(d.subtitle)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/pricing">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/pricing">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/pricing">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/pricing">`;

  // 서비스 테이블
  const svcRows = d.services.map(s => {
    const nameHtml = s.bold ? `<strong>${escapeHtml(s.name)}</strong>` : escapeHtml(s.name);
    const creditHtml = s.bold ? `<strong>${escapeHtml(s.credit)}</strong>` : escapeHtml(s.credit);
    const noteHtml = s.link ? `<a href="${s.link}">${escapeHtml(s.note)}</a>` : escapeHtml(s.note);
    return `<tr><td>${nameHtml}</td><td class="accent">${creditHtml}</td><td>${noteHtml}</td></tr>`;
  }).join('\n        ');

  // 크레딧 팩 카드
  const packCards = d.packs.map(p => {
    const badgeHtml = p.badge
      ? `<span class="pack-badge${p.badgeBest ? ' best' : ''}">${escapeHtml(p.badge)}</span>`
      : '';
    return `<div class="pack-card">
        ${badgeHtml}
        <div class="pack-left">
          <span class="pack-name">${p.credits} ${escapeHtml(d.creditLabel)}</span>
          <span class="pack-bonus">+${p.bonus}c ${escapeHtml(d.bonusLabel)}</span>
        </div>
        <div class="pack-right">
          <div class="pack-price">${escapeHtml(p.price)}</div>
          <div class="pack-unit">${escapeHtml(p.unit)}</div>
        </div>
      </div>`;
  }).join('\n      ');

  // 안내 항목
  const infoLis = d.infoItems.map(i => `<li>${escapeHtml(i)}</li>`).join('\n      ');

  const pageStyle = `
.container { max-width: 800px; }
.page-header { text-align: center; margin-bottom: 40px; }
.page-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.page-header p { color: var(--text-dim); font-size: 15px; }
.cost-section { margin-bottom: 40px; }
.cost-section h2 {
  font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.cost-table {
  width: 100%; border-collapse: collapse;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
}
.cost-table th, .cost-table td { padding: 14px 20px; text-align: left; font-size: 14px; }
.cost-table thead th {
  background: var(--surface2); font-weight: 600; color: var(--text-bright); font-size: 13px;
}
.cost-table tbody tr { border-top: 1px solid var(--border); }
.cost-table tbody tr:hover { background: rgba(108, 79, 255, 0.03); }
.cost-table .accent { color: var(--accent); font-weight: 600; }
.pack-grid { display: flex; flex-direction: column; gap: 10px; }
.pack-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px;
  background: var(--card-bg); border: 1.5px solid var(--border); border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s; position: relative;
}
.pack-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(108,79,255,0.08); }
.pack-left { display: flex; flex-direction: column; gap: 2px; }
.pack-name { font-size: 16px; font-weight: 600; color: var(--text-bright); }
.pack-bonus { font-size: 13px; color: var(--success); }
.pack-right { text-align: right; }
.pack-price { font-size: 18px; font-weight: 700; color: var(--accent); }
.pack-unit { font-size: 12px; color: var(--text-dim); margin-top: 2px; }
.pack-badge {
  position: absolute; top: -8px; right: 16px;
  background: var(--accent); color: #fff; font-size: 11px; font-weight: 700;
  padding: 2px 10px; border-radius: 8px;
}
.pack-badge.best { background: #f59e0b; }
.cta-area { text-align: center; margin-top: 40px; }
.cta-btn {
  display: inline-block; padding: 16px 48px;
  background: var(--accent); color: #fff;
  border-radius: 12px; font-size: 16px; font-weight: 700;
  transition: opacity 0.2s; text-decoration: none;
}
.cta-btn:hover { opacity: 0.9; color: #fff; }
.info-note {
  margin-top: 32px; padding: 20px 24px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
}
.info-note h3 { font-size: 14px; font-weight: 600; color: var(--text-bright); margin-bottom: 8px; }
.info-note li { font-size: 13px; color: var(--text-dim); margin-bottom: 4px; list-style: none; }
.info-note li::before { content: "· "; color: var(--accent); }
@media (max-width: 600px) {
  .pack-card { padding: 14px 16px; }
  .pack-name { font-size: 14px; }
  .pack-price { font-size: 16px; }
  .header-nav { display: none; }
}`;

  const bodyContent = `
  <div class="page-header">
    <h1>${escapeHtml(d.title)}</h1>
    <p>${escapeHtml(d.subtitle)}</p>
  </div>

  <div class="cost-section">
    <h2>${escapeHtml(d.svcTitle)}</h2>
    <table class="cost-table">
      <thead><tr>${d.svcHeader.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${svcRows}
      </tbody>
    </table>
  </div>

  <div class="cost-section">
    <h2>${escapeHtml(d.packTitle)}</h2>
    <div class="pack-grid">
      ${packCards}
    </div>
  </div>

  <div class="cta-area">
    <a href="/credits" class="cta-btn">${escapeHtml(d.cta)}</a>
  </div>

  <div class="info-note">
    <h3>${escapeHtml(d.infoTitle)}</h3>
    <ul>
      ${infoLis}
      <li>${d.refundNote}</li>
    </ul>
  </div>`;

  return {
    title: `${d.title} | MONKOS AI`,
    description: d.subtitle,
    seoMeta,
    htmlLang: lang,
    pageStyle,
    bodyContent,
    pageScript: null,
  };
}

// GET /pricing — 가격 페이지 SSR (KR/JP/EN)
export function renderPricing(req, res, forceLang = null) {
  try {
    const parts = pricingFragment(forceLang);
    const html = `${layoutHead(parts.title, parts.description, parts.seoMeta || '', parts.htmlLang || 'ko')}
${parts.pageStyle ? `<style>${parts.pageStyle}</style>` : ''}
</head>
<body>
${layoutNav()}
<div class="container" style="max-width:800px;">
  ${parts.bodyContent}
</div>
${layoutFooter()}
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Pricing 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
