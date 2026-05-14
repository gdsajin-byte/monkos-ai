/**
 * CMS SSR — 블로그 목록 + 상세
 */
import { escapeHtml, stripHtml, getSeoDescription, layoutShell, blogRenderer, marked } from './render-shell.js';
import { firestore, log } from '../shared/config.js';

const blogCollection = firestore.collection('blog_posts');

const NOINDEX_SLUGS = new Set([
  'claudemax-20x-2개월-실사용-후기',
  'claude-max-20x-2-month-real-usage-review',
]);

// 블로그 목록 — fragment (데이터 조회 + HTML 생성)
export async function blogListFragment(req, forceLang = null) {
  const url = new URL(req.url, 'https://monkos.ai');
  const lang = forceLang || url.searchParams.get('lang');
  const catFilter = url.searchParams.get('cat');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = 10;

  const effectiveLang = lang || 'ko';
  let query = blogCollection.where('published', '==', true).where('lang', '==', effectiveLang).orderBy('createdAt', 'desc');

  const snapshot = await query.get();
  let allPosts = snapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() }));

  // 동일 원본의 구/신 slug doc 공존 시 중복 제거 (같은 언어 내에서만)
  const seenOriginals = new Set();
  allPosts = allPosts.filter(p => {
    const base = p.baseSlug || p.originalSlug || p.slug.replace(/-(kr|ja|en)$/, '');
    if (seenOriginals.has(base)) return false;
    seenOriginals.add(base);
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
    const baseSlug = p.slug.replace(/-(kr|ja|en)$/, '');
    if (postLang === 'ja') {
      cardHref = `/ja/blog/${escapeHtml(baseSlug)}`;
    } else if (postLang === 'en') {
      cardHref = `/en/blog/${escapeHtml(baseSlug)}`;
    } else {
      cardHref = `/blog/${escapeHtml(baseSlug)}`;
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

  const docId = lang ? `${slug}-${lang}` : `${slug}-kr`;
  let doc = await blogCollection.doc(docId).get();
  if ((!doc.exists || !doc.data().published) && !lang) {
    doc = await blogCollection.doc(slug).get();
  }
  if (!doc.exists || !doc.data().published) return null;

  const post = doc.data();
  const htmlLang = lang || post.lang || 'ko';

  // viewCount 비동기 증가
  blogCollection.doc(docId).update({ viewCount: (post.viewCount || 0) + 1 }).catch(() => {});

  const contentHtml = marked(post.content || '', { renderer: blogRenderer });
  const baseSlug = slug;

  // hreflang — 실제 존재+published 언어 버전만 출력 (2026-04-14 유령URL 근절)
  const hreflangPairs = [
    { lang: 'ko', docId: `${slug}-kr`, prefix: '' },
    { lang: 'ja', docId: `${slug}-ja`, prefix: '/ja' },
    { lang: 'en', docId: `${slug}-en`, prefix: '/en' },
  ];
  const existChecks = await Promise.all(
    hreflangPairs.map(async (p) => {
      try {
        let d = await blogCollection.doc(p.docId).get();
        if ((!d.exists || !d.data().published) && p.lang === 'ko') {
          d = await blogCollection.doc(slug).get();
        }
        return d.exists && d.data().published ? p : null;
      } catch { return null; }
    })
  );
  const existingLangs = existChecks.filter(Boolean);
  const hasKo = existingLangs.some(p => p.lang === 'ko');
  const hreflangTags = existingLangs.map(p =>
    `<link rel="alternate" hreflang="${p.lang}" href="https://monkos.ai${p.prefix}/blog/${slug}">`
  ).concat(
    hasKo
      ? [`<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/${slug}">`]
      : []
  ).join('\n');

  const prefix = lang ? `/${lang}` : '';
  const canonicalUrl = `https://monkos.ai${prefix}/blog/${escapeHtml(baseSlug)}`;

  const noindexTag = NOINDEX_SLUGS.has(baseSlug) ? '\n<meta name="robots" content="noindex">' : '';
  const seoMeta = `${noindexTag}
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

