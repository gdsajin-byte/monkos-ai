/**
 * CMS SSR 렌더링 엔진
 * Firestore 데이터 → HTML 페이지 (SEO 최적화)
 */
import { marked } from 'marked';
import { firestore, log } from '../shared/config.js';

const blogCollection = firestore.collection('blog_posts');
const faqCollection = firestore.collection('faq_items');
const galleryCollection = firestore.collection('gallery_items');
const boardCollection = firestore.collection('board_posts');

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function layoutHead(title, description, extra = '') {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#0f0f23">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
${extra}
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #0a0a1a;
  --surface: #141428;
  --surface2: #1a1a35;
  --accent: #a78bfa;
  --accent2: #818cf8;
  --text: #e2e8f0;
  --text-dim: #8892a8;
  --text-bright: #f8fafc;
  --border: rgba(167, 139, 250, 0.12);
  --border-hover: rgba(167, 139, 250, 0.3);
  --card-bg: rgba(20, 20, 40, 0.7);
  --success: #34d399;
}
body {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.7;
}
a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent2); }

/* Nav */
.nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid var(--border);
  max-width: 1200px; margin: 0 auto;
}
.nav-logo { font-size: 20px; font-weight: 700; color: var(--text-bright); letter-spacing: 2px; }
.nav-links { display: flex; gap: 24px; }
.nav-links a { color: var(--text-dim); font-size: 14px; font-weight: 500; }
.nav-links a:hover { color: var(--accent); }

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
  return `<nav class="nav">
  <a href="/" class="nav-logo">MONKOS</a>
  <div class="nav-links">
    <a href="/blog">Blog</a>
    <a href="/faq">FAQ</a>
    <a href="/gallery">Gallery</a>
    <a href="/board">Board</a>
    <a href="/">Home</a>
  </div>
</nav>`;
}

function layoutFooter() {
  return `<footer class="footer">
  &copy; ${new Date().getFullYear()} MONKOS. All rights reserved.
  <br><a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/refund.html">Refund</a>
</footer>`;
}

// =============================================
// Blog
// =============================================

// GET /blog — 목록 페이지
export async function renderBlogList(req, res) {
  try {
    const url = new URL(req.url, 'https://monkos.ai');
    const lang = url.searchParams.get('lang');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const perPage = 10;

    let query = blogCollection.where('published', '==', true).orderBy('createdAt', 'desc');
    if (lang) query = blogCollection.where('published', '==', true).where('lang', '==', lang).orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const allPosts = snapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() }));
    const totalPages = Math.ceil(allPosts.length / perPage);
    const posts = allPosts.slice((page - 1) * perPage, page * perPage);

    const ogMeta = `<meta property="og:title" content="MONKOS Blog">
<meta property="og:description" content="AI ID Photo tips, guides, and news">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/blog">
<link rel="canonical" href="https://monkos.ai/blog">`;

    const cardsHtml = posts.map(p => `
      <a href="/blog/${escapeHtml(p.slug)}" class="blog-card">
        ${p.thumbnail ? `<div class="card-thumb" style="background-image:url('${escapeHtml(p.thumbnail)}')"></div>` : `<div class="card-thumb card-thumb-empty"></div>`}
        <div class="card-body">
          <div class="card-meta">
            <span class="card-lang">${escapeHtml(p.lang || 'ko')}</span>
            <span class="card-date">${p.createdAt ? p.createdAt.substring(0, 10) : ''}</span>
          </div>
          <h2 class="card-title">${escapeHtml(p.title)}</h2>
          <p class="card-summary">${escapeHtml(p.summary || '')}</p>
        </div>
      </a>`).join('');

    let paginationHtml = '';
    if (totalPages > 1) {
      const langParam = lang ? `&lang=${lang}` : '';
      const links = [];
      if (page > 1) links.push(`<a href="/blog?page=${page - 1}${langParam}">&laquo; Prev</a>`);
      for (let i = 1; i <= totalPages; i++) {
        links.push(i === page ? `<span class="pg-current">${i}</span>` : `<a href="/blog?page=${i}${langParam}">${i}</a>`);
      }
      if (page < totalPages) links.push(`<a href="/blog?page=${page + 1}${langParam}">Next &raquo;</a>`);
      paginationHtml = `<div class="pagination">${links.join('')}</div>`;
    }

    const html = `${layoutHead('Blog | MONKOS AI', 'AI ID Photo tips, guides, and news', ogMeta)}
<style>
.blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
.blog-card {
  display: flex; flex-direction: column; background: var(--card-bg);
  border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  transition: border-color 0.2s, transform 0.2s; color: var(--text);
}
.blog-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
.card-thumb { width: 100%; height: 200px; background-size: cover; background-position: center; background-color: var(--surface2); }
.card-thumb-empty { background: linear-gradient(135deg, var(--surface), var(--surface2)); }
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
.lang-filter { display: flex; gap: 8px; margin-top: 16px; }
.lang-filter a {
  padding: 6px 16px; border-radius: 20px; font-size: 13px;
  background: var(--surface); border: 1px solid var(--border); color: var(--text-dim);
}
.lang-filter a:hover, .lang-filter a.active { border-color: var(--accent); color: var(--accent); }
@media (max-width: 600px) { .blog-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
${layoutNav()}
<div class="container">
  <div class="blog-header">
    <h1>Blog</h1>
    <div class="lang-filter">
      <a href="/blog" class="${!lang ? 'active' : ''}">All</a>
      <a href="/blog?lang=ko" class="${lang === 'ko' ? 'active' : ''}">KO</a>
      <a href="/blog?lang=ja" class="${lang === 'ja' ? 'active' : ''}">JA</a>
      <a href="/blog?lang=en" class="${lang === 'en' ? 'active' : ''}">EN</a>
    </div>
  </div>
  <div class="blog-grid">${cardsHtml || '<p style="color:var(--text-dim)">No posts yet.</p>'}</div>
  ${paginationHtml}
</div>
${layoutFooter()}
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 목록 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /blog/:slug — 상세 페이지
export async function renderBlogPost(req, res) {
  try {
    const slug = decodeURIComponent(req.url.split('/blog/')[1]?.split('?')[0] || '');
    if (!slug) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists || !doc.data().published) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const post = doc.data();

    // viewCount 비동기 증가
    blogCollection.doc(slug).update({ viewCount: (post.viewCount || 0) + 1 }).catch(() => {});

    const contentHtml = marked(post.content || '');

    // hreflang: 동일 slug prefix의 다른 lang 버전 검색
    let hreflangTags = '';
    try {
      const allLangs = await blogCollection.where('published', '==', true).get();
      const baseSlug = slug.replace(/-(?:ko|ja|en)$/, '');
      const related = allLangs.docs.filter(d => {
        const s = d.id;
        return s !== slug && s.replace(/-(?:ko|ja|en)$/, '') === baseSlug;
      });
      hreflangTags = related.map(d => {
        const data = d.data();
        return `<link rel="alternate" hreflang="${data.lang || 'ko'}" href="https://monkos.ai/blog/${d.id}">`;
      }).join('\n');
    } catch { /* skip */ }

    const seoMeta = `
<meta property="og:title" content="${escapeHtml(post.title)}">
<meta property="og:description" content="${escapeHtml(post.summary || '')}">
<meta property="og:image" content="${escapeHtml(post.thumbnail || '')}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://monkos.ai/blog/${escapeHtml(slug)}">
<link rel="canonical" href="https://monkos.ai/blog/${escapeHtml(slug)}">
${hreflangTags}
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.title,
  "image": post.thumbnail || '',
  "author": { "@type": "Organization", "name": "MONKOS" },
  "publisher": { "@type": "Organization", "name": "MONKOS", "url": "https://monkos.ai" },
  "datePublished": post.createdAt,
  "dateModified": post.updatedAt,
  "description": post.summary || ''
})}
</script>`;

    const tagsHtml = (post.tags || []).map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('');

    const html = `${layoutHead(`${post.title} | MONKOS AI`, post.summary || '', seoMeta)}
<style>
.post-header { margin-bottom: 32px; max-width: 800px; margin-left: auto; margin-right: auto; }
.post-header h1 { font-size: 32px; font-weight: 700; color: var(--text-bright); line-height: 1.4; margin-bottom: 16px; }
.post-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-dim); flex-wrap: wrap; align-items: center; }
.post-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
.post-tag { background: var(--surface2); padding: 4px 12px; border-radius: 12px; font-size: 12px; color: var(--accent); }
.post-thumb { max-width: 800px; margin: 0 auto 32px; border-radius: 12px; overflow: hidden; }
.post-thumb img { width: 100%; height: auto; display: block; }
.post-content {
  max-width: 800px; margin: 0 auto; font-size: 16px; line-height: 1.8;
}
.post-content h1, .post-content h2, .post-content h3 { color: var(--text-bright); margin: 32px 0 16px; }
.post-content h2 { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.post-content h3 { font-size: 20px; }
.post-content p { margin-bottom: 16px; }
.post-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
.post-content code { background: var(--surface2); padding: 2px 6px; border-radius: 4px; font-size: 14px; }
.post-content pre { background: var(--surface); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
.post-content pre code { background: none; padding: 0; }
.post-content blockquote { border-left: 3px solid var(--accent); padding-left: 16px; color: var(--text-dim); margin: 16px 0; }
.post-content ul, .post-content ol { padding-left: 24px; margin-bottom: 16px; }
.post-content li { margin-bottom: 8px; }
.post-content a { color: var(--accent); text-decoration: underline; }
.post-back { display: inline-block; margin-bottom: 24px; color: var(--text-dim); font-size: 14px; }
.post-back:hover { color: var(--accent); }
@media (max-width: 600px) {
  .post-header h1 { font-size: 24px; }
  .post-content { font-size: 15px; }
}
</style>
</head>
<body>
${layoutNav()}
<div class="container">
  <a href="/blog" class="post-back">&larr; Back to Blog</a>
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
</div>
${layoutFooter()}
</body>
</html>`;

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

// GET /faq — FAQ 공개 페이지
export async function renderFaq(req, res) {
  try {
    const snapshot = await faqCollection.where('published', '==', true).orderBy('order', 'asc').get();
    const items = snapshot.docs.map(doc => doc.data());

    // 카테고리별 그룹
    const categories = {};
    for (const item of items) {
      const cat = item.category || '일반';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    }

    // FAQ JSON-LD
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

    const seoMeta = `<meta property="og:title" content="FAQ | MONKOS AI">
<meta property="og:description" content="MONKOS AI ID Photo FAQ - frequently asked questions">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/faq">
<link rel="canonical" href="https://monkos.ai/faq">
<script type="application/ld+json">${faqJsonLd}</script>`;

    const faqHtml = Object.entries(categories).map(([cat, faqs]) => `
      <div class="faq-category">
        <h2 class="faq-cat-title">${escapeHtml(cat)}</h2>
        ${faqs.map(f => `
          <details class="faq-item">
            <summary class="faq-question">${escapeHtml(f.question)}</summary>
            <div class="faq-answer">${marked(f.answer || '')}</div>
          </details>
        `).join('')}
      </div>`).join('');

    const html = `${layoutHead('FAQ | MONKOS AI', 'MONKOS AI ID Photo FAQ', seoMeta)}
<style>
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
.faq-answer a { color: var(--accent); }
</style>
</head>
<body>
${layoutNav()}
<div class="container" style="max-width:800px;">
  <div class="faq-header">
    <h1>FAQ</h1>
    <p>Frequently Asked Questions</p>
  </div>
  ${faqHtml || '<p style="color:var(--text-dim)">No FAQs yet.</p>'}
</div>
${layoutFooter()}
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

// GET /gallery — 갤러리 공개 페이지
export async function renderGallery(req, res) {
  try {
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
        <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.caption || 'MONKOS AI Photo')}" loading="lazy" onclick="openLightbox(this)">
        ${item.caption ? `<p class="gallery-caption">${escapeHtml(item.caption)}</p>` : ''}
      </div>`).join('');

    const filterHtml = allCategories.map(cat =>
      `<button class="gallery-filter-btn" onclick="filterGallery('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>`
    ).join('');

    const html = `${layoutHead('Gallery | MONKOS AI', 'MONKOS AI ID Photo gallery', seoMeta)}
<style>
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
@media (max-width: 600px) { .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } .gallery-item img { height: 180px; } }
</style>
</head>
<body>
${layoutNav()}
<div class="container">
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
</div>
${layoutFooter()}
<script>
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
}
</script>
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

// GET /board — 게시판 목록
export async function renderBoardList(req, res) {
  try {
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

    const html = `${layoutHead('Board | MONKOS AI', 'MONKOS customer board', seoMeta)}
<style>
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
}
</style>
</head>
<body>
${layoutNav()}
<div class="container" style="max-width:900px;">
  <div class="board-header">
    <h1>Board</h1>
    <a href="/board/write" class="btn-write">Write</a>
  </div>
  <div class="board-list">
    ${rowsHtml || '<p style="color:var(--text-dim);text-align:center;padding:40px">No posts yet.</p>'}
  </div>
  ${paginationHtml}
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

// GET /board/:id — 게시글 상세
export async function renderBoardPost(req, res) {
  try {
    const id = decodeURIComponent(req.url.split('/board/')[1]?.split('?')[0] || '');
    if (!id || id === 'write') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const doc = await boardCollection.doc(id).get();
    if (!doc.exists || !doc.data().published) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }

    const post = doc.data();
    const repliesHtml = (post.replies || []).map(r => `
      <div class="reply-item">
        <div class="reply-author">MONKOS</div>
        <div class="reply-text">${escapeHtml(r.text)}</div>
        <div class="reply-date">${(r.createdAt || '').substring(0, 10)}</div>
      </div>`).join('');

    const html = `${layoutHead(`${post.title} | Board`, 'MONKOS Board')}
<style>
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
.btn-delete:hover { border-color: #f87171; color: #f87171; }
</style>
</head>
<body>
${layoutNav()}
<div class="container">
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
  </div>
</div>
${layoutFooter()}
<script>
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
}
</script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 게시판 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /board/write — 글쓰기 폼
export async function renderBoardWrite(req, res) {
  try {
    const html = `${layoutHead('Write | Board', 'Write a post on MONKOS board')}
<style>
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
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
${layoutNav()}
<div class="container">
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
  </div>
</div>
${layoutFooter()}
<script>
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
}
</script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 글쓰기 렌더 에러: ${err.message}`, 'ERROR');
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
    const staticUrls = [
      { loc: 'https://monkos.ai/', changefreq: 'weekly', priority: '1.0' },
      { loc: 'https://monkos.ai/credits.html', changefreq: 'monthly', priority: '0.5' },
      { loc: 'https://monkos.ai/privacy.html', changefreq: 'monthly', priority: '0.3' },
      { loc: 'https://monkos.ai/terms.html', changefreq: 'monthly', priority: '0.3' },
      { loc: 'https://monkos.ai/refund.html', changefreq: 'monthly', priority: '0.3' },
      { loc: 'https://monkos.ai/blog', changefreq: 'daily', priority: '0.8' },
      { loc: 'https://monkos.ai/faq', changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/gallery', changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/board', changefreq: 'daily', priority: '0.5' },
    ];

    // 발행된 블로그 글 추가
    const snapshot = await blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();
    const blogUrls = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        loc: `https://monkos.ai/blog/${doc.id}`,
        lastmod: (data.updatedAt || data.createdAt || '').substring(0, 10),
        changefreq: 'weekly',
        priority: '0.7',
      };
    });

    const allUrls = [...staticUrls, ...blogUrls];
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
