/**
 * 홈 SSR 렌더링 + site_config API
 * index.html 템플릿에 Firestore 데이터 주입
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { firestore, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../../public/index.html');
let templateHtml = null;

const blogCollection = firestore.collection('blog_posts');
const galleryCollection = firestore.collection('gallery_items');
const siteConfigRef = firestore.collection('site_config').doc('main');

const EMOJI = { '사진': '📸', '패션': '👗', '헤어': '💇', '메이크업': '💄', 'AI': '🤖', 'news': '📰', '기타': '💡', 'default': '💡' };
const GRADIENTS = [
  'linear-gradient(135deg,#f0eee8,#e8e5de)',
  'linear-gradient(135deg,#eef0f8,#e0e4f0)',
  'linear-gradient(135deg,#f5f0e8,#efe8d8)',
  'linear-gradient(135deg,#f0eef5,#e8e4f0)',
];

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function relTime(dateStr) {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function fmtDate(d) { return d ? d.substring(5, 10).replace('-', '.') : ''; }

function getTemplate() {
  if (!templateHtml) templateHtml = readFileSync(templatePath, 'utf-8');
  return templateHtml;
}

function magCard(p, i) {
  const emoji = EMOJI[p.category] || EMOJI.default;
  const tag = p.tags?.[0] ? `<span class="tag tip">${esc(p.tags[0])}</span>` : '';
  const summary = (p.summary || '').substring(0, 30);
  const thumbStyle = p.thumbnail
    ? `background:url('${esc(p.thumbnail)}') center/cover no-repeat; background-color:${GRADIENTS[i % 4].match(/#\w+/)?.[0] || '#f0eee8'}`
    : `background:${GRADIENTS[i % 4]}`;
  const thumbContent = p.thumbnail ? tag : `<span class="icon">${emoji}</span>${tag}`;
  return `      <a href="/blog/${esc(p.slug)}" class="mag-card"><div class="mag-img" style="${thumbStyle}">${thumbContent}</div><div class="mag-body"><h4>${esc(p.title)}</h4><p>${esc(summary)}</p><div class="meta">${esc(p.author || 'MONKOS')} · ${relTime(p.createdAt)}</div></div></a>`;
}

function blogCard(p) {
  const emoji = EMOJI[p.category] || EMOJI.default;
  const thumb = p.thumbnail
    ? `<div class="bi-thumb" style="background-image:url('${esc(p.thumbnail)}');background-size:cover;background-position:center"></div>`
    : `<div class="bi-thumb">${emoji}</div>`;
  return `      <a href="/blog/${esc(p.slug)}" class="bi">${thumb}<div class="bi-info"><h3>${esc(p.title)}</h3><p>${esc(p.summary || '')}</p><div class="meta"><span class="lt">${esc((p.lang || 'ko').toUpperCase())}</span> ${esc(p.author || 'MONKOS')} · ${fmtDate(p.createdAt)}</div></div></a>`;
}

function newsCard(p) {
  return `      <a href="/blog/${esc(p.slug)}" class="bi"><div class="bi-thumb" style="background:#eef;font-size:12px">📰</div><div class="bi-info"><h3>${esc(p.title)}</h3><p>${esc(p.summary || '')}</p><div class="meta"><span class="lt" style="background:#eef">NEWS</span> ${fmtDate(p.createdAt)}</div></div></a>`;
}

// ========== Home SSR ==========
export async function renderHome(req, res) {
  try {
    let html = getTemplate();

    const [configSnap, postsSnap, gallerySnap] = await Promise.all([
      siteConfigRef.get().catch(() => null),
      blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
      galleryCollection.where('published', '==', true).orderBy('order', 'asc').get().catch(() => ({ docs: [] })),
    ]);

    const allPosts = postsSnap.docs.map(d => ({ slug: d.id, ...d.data() }));

    // 언어별 필터 (쿼리 파라미터 ?lang= 기반, 기본값 ko)
    const reqUrl = new URL(req.url, 'http://localhost');
    const lang = reqUrl.searchParams.get('lang') || 'ko';
    const langPosts = allPosts.filter(p => p.lang === lang);
    const displayPosts = (langPosts.length > 0 ? langPosts : allPosts)
      .filter(p => !p.autoTranslated)
      .filter(p => p.thumbnail && p.thumbnail.length > 0);

    // 0. Gallery strip (Firestore → 동적)
    const galleryItems = gallerySnap.docs.map(d => d.data());
    if (galleryItems.length > 0) {
      const stripHtml = galleryItems.slice(0, 12).map(item =>
        `  <div class="gi"><img class="gi-img" src="${esc(item.imageUrl)}" alt="${esc(item.caption || 'AI 증명사진')}" loading="lazy"></div>`
      ).join('\n');
      html = html.replace(
        /(<div class="gallery-track" id="gt">)\n[\s\S]*?(<\/div><\/div>\n\n<!-- Sticky Nav -->)/,
        `$1\n${stripHtml}\n</div></div>\n\n<!-- Sticky Nav -->`
      );
    }

    // 1. Intro text
    if (configSnap?.exists && configSnap.data().intro) {
      html = html.replace(/<p class="intro-text">[\s\S]*?<\/p>/, `<p class="intro-text">${configSnap.data().intro}</p>`);
    }

    // 2. Magazine cards (pinned → fallback latest)
    const pinned = displayPosts.filter(p => p.pinned).slice(0, 4);
    const mags = pinned.length > 0 ? pinned : displayPosts.slice(0, 4);
    if (mags.length > 0) {
      const magHtml = mags.map((p, i) => magCard(p, i)).join('\n');
      html = html.replace(
        /(<div class="sb-t">매거진<\/div>)\n[\s\S]*?(\n\s*<\/div>\n\s*<div class="sb-sec"><div class="sb-t">태그)/,
        `$1\n${magHtml}\n$2`
      );
    }

    // 3. Tags (aggregated)
    const tagMap = {};
    for (const p of allPosts) for (const t of (p.tags || [])) tagMap[t] = (tagMap[t] || 0) + 1;
    const tags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]);
    if (tags.length > 0) {
      html = html.replace(
        /<div class="sb-tags">[\s\S]*?<\/div>/,
        `<div class="sb-tags">\n        ${tags.map(t => `<span class="sb-tag">${esc(t)}</span>`).join('')}\n      </div>`
      );
    }

    // 4. Blog cards (latest 4)
    const blogs = displayPosts.slice(0, 4);
    const blogHtml = blogs.length > 0
      ? blogs.map(p => blogCard(p)).join('\n')
      : '      <p style="color:var(--ink-m);padding:24px 0">아직 포스트가 없습니다</p>';
    html = html.replace(
      /(최근 블로그<\/h2><a[^>]*>[^<]*<\/a><\/div>\n\s*<div class="blog-list">\n)[\s\S]*?(\n\s*<\/div>\n\n\s*<div class="sec-h"><h2>업계 소식)/,
      `$1${blogHtml}$2`
    );

    // 5. News cards (category=news, latest 2)
    const news = displayPosts.filter(p => p.category === 'news').slice(0, 2);
    if (news.length > 0) {
      const newsHtml = news.map(p => newsCard(p)).join('\n');
      html = html.replace(
        /(업계 소식<\/h2><a[^>]*>[^<]*<\/a><\/div>\n\s*<div class="blog-list">\n)[\s\S]*?(\n\s*<\/div>\n\s*<\/main>)/,
        `$1${newsHtml}$2`
      );
    } else {
      // Hide news section when no news
      html = html.replace(
        /\s*<div class="sec-h"><h2>업계 소식<\/h2>[\s\S]*?<\/div>\n\s*<\/main>/,
        '\n  </main>'
      );
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[Home] SSR error: ${err.message}`, 'ERROR');
    // Fallback: serve static template
    try {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getTemplate());
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
}

// ========== Layout API ==========
const layoutConfigRef = firestore.collection('site_config').doc('layout');

export async function handleLayoutGet(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const doc = await layoutConfigRef.get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(doc.exists ? doc.data() : { sections: [] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleLayoutPut(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const body = await parseJsonBody(req);
    if (!body.sections || !Array.isArray(body.sections)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'sections 배열이 필요합니다' }));
    }
    const data = { sections: body.sections, updatedAt: new Date().toISOString() };
    await layoutConfigRef.set(data);
    log(`[Layout] Updated by ${admin.userId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// ========== Settings API ==========
export async function handleSettingsGet(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const doc = await siteConfigRef.get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(doc.exists ? doc.data() : {}));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleSettingsPut(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const body = await parseJsonBody(req);
    const updates = { updatedAt: new Date().toISOString() };
    if (body.intro !== undefined) updates.intro = body.intro;
    await siteConfigRef.set(updates, { merge: true });
    log(`[Settings] Updated by ${admin.userId}`);
    const doc = await siteConfigRef.get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(doc.data()));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
