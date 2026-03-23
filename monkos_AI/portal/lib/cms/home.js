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

// ========== Home SSR ==========
export async function renderHome(req, res) {
  try {
    let html = getTemplate();

    const [configSnap, postsSnap, gallerySnap, layoutSnap] = await Promise.all([
      siteConfigRef.get().catch(() => null),
      blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
      galleryCollection.where('published', '==', true).orderBy('order', 'asc').get().catch(() => ({ docs: [] })),
      layoutConfigRef.get().catch(() => null),
    ]);

    const allPosts = postsSnap.docs.map(d => ({ slug: d.id, ...d.data() }));

    // 언어별 필터 (쿼리 파라미터 ?lang= 기반, 기본값 ko)
    const reqUrl = new URL(req.url, 'http://localhost');
    const lang = reqUrl.searchParams.get('lang') || 'ko';
    const langPosts = allPosts.filter(p => p.lang === lang);
    const displayPosts = (langPosts.length > 0 ? langPosts : allPosts)
      .filter(p => !p.autoTranslated)
      .filter(p => p.thumbnail && p.thumbnail.length > 0);

    // Layout 블록 헬퍼 (fallback: layout 없으면 기존 하드코딩 유지)
    const layoutSections = layoutSnap?.exists ? (layoutSnap.data().sections || []) : [];
    function getBlock(id) { return layoutSections.find(s => s.id === id); }
    function lt(obj) { return (obj && obj[lang]) || obj?.ko || ''; }

    // 0. Gallery strip (Firestore → 동적, layout maxItems 적용)
    const galleryBlock = getBlock('gallery-strip');
    const galleryMax = galleryBlock?.data?.maxItems || 12;
    const galleryItems = gallerySnap.docs.map(d => d.data());
    if (galleryItems.length > 0) {
      const stripHtml = galleryItems.slice(0, galleryMax).map(item =>
        `  <div class="gi"><img class="gi-img" src="${esc(item.imageUrl)}" alt="${esc(item.caption || 'AI 증명사진')}" loading="lazy"></div>`
      ).join('\n');
      html = html.replace(
        /(<div class="gallery-track" id="gt">)\n[\s\S]*?(<\/div><\/div>\n\n<!-- Sticky Nav -->)/,
        `$1\n${stripHtml}\n</div></div>\n\n<!-- Sticky Nav -->`
      );
    }

    // 1. Hero
    const heroBlock = getBlock('hero');
    if (heroBlock?.visible && heroBlock.data) {
      const hd = heroBlock.data;
      const heroHtml = `<div class="hero"><div class="hero-inner">\n  <div class="hero-label">${hd.label || 'AI Creative Platform'}</div>\n  <h1>${hd.title || 'MONKOS <em>AI</em>'}</h1>\n  <div class="hero-tag">${hd.tagline || '<strong>Photography</strong> × <strong>AI</strong> × <strong>K-Beauty</strong>'}</div>\n</div></div>`;
      html = html.replace(
        /<div class="hero"><div class="hero-inner">\n[\s\S]*?<\/div><\/div>\n\n<!-- User Bar -->/,
        `${heroHtml}\n\n<!-- User Bar -->`
      );
    }

    // 2. User-bar CTA text only (onclick·class 보존)
    const userBarBlock = getBlock('user-bar');
    if (userBarBlock?.visible && userBarBlock.data?.cta) {
      html = html.replace(
        /<button class="btn-shoot">[^<]*<\/button>/,
        `<button class="btn-shoot">${esc(lt(userBarBlock.data.cta))}</button>`
      );
    }

    // 3. Nav
    const navBlock = getBlock('nav');
    if (navBlock?.visible && navBlock.items) {
      const navLinks = navBlock.items.map(item => {
        const href = item.href ? (item.href[lang] || item.href.ko || '/') : '/';
        const label = lt(item.label);
        const cls = item.active ? ' class="active"' : '';
        return `  <a href="${esc(href)}"${cls}>${esc(label)}</a>`;
      }).join('\n');
      html = html.replace(
        /(<nav><div class="n-links">)\n[\s\S]*?\n(<\/div><\/nav>)/,
        `$1\n${navLinks}\n$2`
      );
    }

    // 4. Intro text (layout 블록 우선, fallback: site_config/main)
    const introBlock = getBlock('intro-text');
    if (introBlock?.visible && introBlock.data?.text) {
      const introHtml = lt(introBlock.data.text);
      if (introHtml) html = html.replace(/<p class="intro-text">[\s\S]*?<\/p>/, `<p class="intro-text">${introHtml}</p>`);
    } else if (configSnap?.exists && configSnap.data().intro) {
      html = html.replace(/<p class="intro-text">[\s\S]*?<\/p>/, `<p class="intro-text">${configSnap.data().intro}</p>`);
    }

    // 5. Service cards (.svc.live, .svc-link class 보존)
    const svcBlock = getBlock('service-cards');
    if (svcBlock?.visible && svcBlock.items) {
      const svcHtml = svcBlock.items.map(item => {
        const title = lt(item.title);
        const desc = lt(item.desc);
        const link = lt(item.link);
        const icon = item.icon || '';
        const badgeHtml = item.badge ? `<span class="svc-bdg ${item.badge.class || ''}">${item.badge.text || ''}</span>` : '';
        if (item.cardClass === 'live') {
          return `      <div class="svc live"><div class="svc-top"><span class="svc-icon">${icon}</span>${badgeHtml}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p><span class="svc-link">${esc(link)}</span></div>`;
        }
        return `      <a href="${esc(item.url || '#')}" class="svc ${esc(item.cardClass || '')}" style="text-decoration:none;color:inherit"><div class="svc-top"><span class="svc-icon">${icon}</span>${badgeHtml}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p><span class="svc-link">${esc(link)}</span></a>`;
      }).join('\n');
      html = html.replace(
        /(<div class="svc-grid">)\n[\s\S]*?(<\/div>\n\n\s*<div class="sec-h" id="sec-howto">)/,
        `$1\n${svcHtml}\n    $2`
      );
    }

    // 6. Howto
    const howtoBlock = getBlock('howto');
    if (howtoBlock?.visible) {
      if (howtoBlock.header) {
        html = html.replace(
          /<div class="sec-h" id="sec-howto"><h2>[^<]*<\/h2><a[^>]*>[^<]*<\/a><\/div>/,
          `<div class="sec-h" id="sec-howto"><h2>${esc(lt(howtoBlock.header.title))}</h2><a href="${esc(howtoBlock.header.href || '/guide')}">${esc(lt(howtoBlock.header.link))}</a></div>`
        );
      }
      if (howtoBlock.items) {
        const howtoHtml = howtoBlock.items.map(item =>
          `      <div class="howto"><div class="num">${esc(item.num)}</div><h4>${esc(lt(item.title))}</h4><p>${esc(lt(item.desc))}</p></div>`
        ).join('\n');
        html = html.replace(
          /(<div class="howto-grid">)\n[\s\S]*?(<\/div>\n\n\s*<div class="sec-h" id="sec-faq">)/,
          `$1\n${howtoHtml}\n    $2`
        );
      }
    }

    // 7. Magazine cards (pinned → fallback latest, layout maxItems 적용)
    const magBlock = getBlock('magazine');
    const magMax = magBlock?.data?.maxItems || 4;
    const pinned = displayPosts.filter(p => p.pinned).slice(0, magMax);
    const mags = pinned.length > 0 ? pinned : displayPosts.slice(0, magMax);
    if (mags.length > 0) {
      const magHtml = mags.map((p, i) => magCard(p, i)).join('\n');
      html = html.replace(
        /(<div class="sb-t" id="sb-magazine">[^<]*<\/div>)\n[\s\S]*?(\n\s*<\/div>\n\s*<div class="sb-sec"><div class="sb-t" id="sb-tags">)/,
        `$1\n${magHtml}\n$2`
      );
    }

    // 8. Tags (aggregated, layout maxTags 적용)
    const tagsBlock = getBlock('tags');
    const maxTags = tagsBlock?.data?.maxTags || 16;
    const tagMap = {};
    for (const p of displayPosts) for (const t of (p.tags || [])) tagMap[t] = (tagMap[t] || 0) + 1;
    const tags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]).slice(0, maxTags);
    if (tags.length > 0) {
      html = html.replace(
        /<div class="sb-tags"[^>]*>[\s\S]*?<\/div>/,
        `<div class="sb-tags" id="sbTags">\n        ${tags.map(t => `<span class="sb-tag">${esc(t)}</span>`).join('')}\n      </div>`
      );
    }

    // 9. Blog cards (latest N, layout maxItems 적용)
    const blogBlock = getBlock('blog-cards');
    const blogMax = blogBlock?.data?.maxItems || 4;
    const blogs = displayPosts.slice(0, blogMax);
    const blogHtml = blogs.length > 0
      ? blogs.map(p => blogCard(p)).join('\n')
      : '      <p style="color:var(--ink-m);padding:24px 0">아직 포스트가 없습니다</p>';
    html = html.replace(
      /(최근 블로그<\/h2><a[^>]*>[^<]*<\/a><\/div>\n\s*<div class="blog-list">\n)[\s\S]*?(\n\s*<\/div>\n\s*<\/main>)/,
      `$1${blogHtml}$2`
    );

    // 10. FAQ preview (layout maxItems 적용)
    const faqBlock = getBlock('faq-preview');
    const faqMax = faqBlock?.data?.maxItems || 3;
    const faqSnap = await firestore.collection('faq_items')
      .where('published', '==', true)
      .where('lang', '==', lang)
      .orderBy('order', 'asc')
      .limit(faqMax)
      .get()
      .catch(() => ({ docs: [] }));
    if (faqSnap.docs.length > 0) {
      const faqPrefix = lang === 'ko' ? '/faq' : `/${lang}/faq`;
      const faqItems = faqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const faqHtml = faqItems.map(f => {
        const short = (f.answer || '').substring(0, 80) + (f.answer?.length > 80 ? '…' : '');
        return `      <a href="${faqPrefix}#faq-${esc(f.id)}" class="faq-item"><h4>${esc(f.question)}</h4><p>${esc(short)}</p></a>`;
      }).join('\n');
      html = html.replace(
        /(<div class="faq-list" id="faqPreview">)\n[\s\S]*?(<\/div>\n\n\s*<div class="sec-h" id="sec-board"><h2>고객 게시판)/,
        `$1\n${faqHtml}\n    $2`
      );

      // FAQ 프리뷰 JSON-LD 삽입 (서치콘솔 mainEntity 오류 수정)
      const faqJsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(f => ({
          "@type": "Question",
          "name": f.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.answer
          }
        }))
      });
      html = html.replace(
        '</head>',
        `<script type="application/ld+json">${faqJsonLd}</script>\n</head>`
      );
    }

    // 11. Board preview (layout maxItems 적용, 답변 여부 표시)
    const boardBlock = getBlock('board-preview');
    const boardMax = boardBlock?.data?.maxItems || 5;
    const boardSnap = await firestore.collection('board_posts')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(boardMax)
      .get()
      .catch(() => ({ docs: [] }));

    if (boardSnap.docs.length > 0) {
      const boardHtml = boardSnap.docs.map(d => {
        const b = d.data();
        const hasReply = Array.isArray(b.replies) && b.replies.length > 0;
        const badge = hasReply
          ? '<span class="board-item-badge answered">답변완료</span>'
          : '<span class="board-item-badge">대기중</span>';
        return `      <a href="/board#${d.id}" class="board-item"><span class="board-item-title">${esc(b.title)}</span>${badge}<span class="board-item-meta">${fmtDate(b.createdAt)}</span></a>`;
      }).join('\n');
      html = html.replace(
        /(<div class="board-preview" id="boardPreview">)\n[\s\S]*?(<\/div>\n\n\s*<div class="sec-h" id="sec-blog"><h2>최근 블로그)/,
        `$1\n${boardHtml}\n    $2`
      );
    } else {
      // 게시글 없으면 섹션 자체 숨김
      html = html.replace(
        /\s*<div class="sec-h" id="sec-board"><h2>고객 게시판<\/h2>[\s\S]*?<\/div>\n\n(\s*<div class="sec-h" id="sec-blog"><h2>최근 블로그)/,
        '\n    $1'
      );
    }

    // 12. Section headers i18n (FAQ·Board·Blog — 콘텐츠 regex 이후에 실행)
    if (faqBlock?.data?.header) {
      html = html.replace(
        /<div class="sec-h" id="sec-faq"><h2>[^<]*<\/h2><a[^>]*>[^<]*<\/a><\/div>/,
        `<div class="sec-h" id="sec-faq"><h2>${esc(lt(faqBlock.data.header.title))}</h2><a href="${esc(faqBlock.data.header.href || '/faq')}">${esc(lt(faqBlock.data.header.link))}</a></div>`
      );
    }
    if (boardBlock?.data?.header) {
      html = html.replace(
        /<div class="sec-h" id="sec-board"><h2>[^<]*<\/h2><a[^>]*>[^<]*<\/a><\/div>/,
        `<div class="sec-h" id="sec-board"><h2>${esc(lt(boardBlock.data.header.title))}</h2><a href="${esc(boardBlock.data.header.href || '/board')}">${esc(lt(boardBlock.data.header.link))}</a></div>`
      );
    }
    if (blogBlock?.data?.header) {
      html = html.replace(
        /<div class="sec-h" id="sec-blog"><h2>[^<]*<\/h2><a[^>]*>[^<]*<\/a><\/div>/,
        `<div class="sec-h" id="sec-blog"><h2>${esc(lt(blogBlock.data.header.title))}</h2><a href="${esc(blogBlock.data.header.href || '/blog')}">${esc(lt(blogBlock.data.header.link))}</a></div>`
      );
    }

    // 13. Guide cards (ID 기반 텍스트 교체)
    const guideBlock = getBlock('guide');
    if (guideBlock?.visible && guideBlock.items) {
      for (let i = 0; i < guideBlock.items.length; i++) {
        const g = guideBlock.items[i];
        const n = i + 1;
        html = html.replace(new RegExp(`(<h4 id="guide${n}-title">)[^<]*(</h4>)`), (_, g1, g2) => g1 + esc(lt(g.title)) + g2);
        html = html.replace(new RegExp(`(<p id="guide${n}-desc">)[^<]*(</p>)`), (_, g1, g2) => g1 + esc(lt(g.desc)) + g2);
        html = html.replace(new RegExp(`(<div class="now" id="guide${n}-status"[^>]*>)[^<]*(</div>)`), (_, g1, g2) => g1 + esc(lt(g.status)) + g2);
      }
    }

    // 14. Credit info ($ 기호 포함 → function 기반 replace)
    const creditBlock = getBlock('credit-info');
    if (creditBlock?.visible && creditBlock.data) {
      const cd = creditBlock.data;
      if (cd.exchange) {
        html = html.replace(/(<div class="credit-info-title" id="credit-exchange">)[^<]*(<\/div>)/, (_, g1, g2) => g1 + esc(lt(cd.exchange)) + g2);
      }
      if (cd.rows) {
        for (const row of cd.rows) {
          const lbl = esc(lt(row.label));
          if (row.label?.ko === 'AI 생성') html = html.replace(/(<span id="credit-gen-label">)[^<]*(<\/span>)/, (_, g1, g2) => g1 + lbl + g2);
          else if (row.label?.ko === '다운로드') html = html.replace(/(<span id="credit-dl-label">)[^<]*(<\/span>)/, (_, g1, g2) => g1 + lbl + g2);
          else if (row.label?.ko === '1장 완성') html = html.replace(/(<span id="credit-total-label">)[^<]*(<\/span>)/, (_, g1, g2) => g1 + lbl + g2);
        }
      }
      if (cd.promo) {
        if (cd.promo.oldPrice) html = html.replace(/(<span class="old" id="credit-old-price">)[^<]*(<\/span>)/, (_, g1, g2) => g1 + esc(lt(cd.promo.oldPrice)) + g2);
        if (cd.promo.newPrice) html = html.replace(/(<span class="price" id="credit-new-price">)[^<]*(<\/span>)/, (_, g1, g2) => g1 + esc(lt(cd.promo.newPrice)) + g2);
        if (cd.promo.bonus) html = html.replace(/(<div class="note" id="credit-bonus">)[^<]*(<\/div>)/, (_, g1, g2) => g1 + esc(lt(cd.promo.bonus)) + g2);
      }
    }

    // 15. Footer
    const footerBlock = getBlock('footer');
    if (footerBlock?.visible && footerBlock.data) {
      const fd = footerBlock.data;
      if (fd.links) {
        const ftLinks = fd.links.map(l => `    <a href="${esc(l.href)}">${esc(l.label)}</a>`).join('\n');
        html = html.replace(
          /(<footer[^>]*>\n\s*<div class="ft-links">)\n[\s\S]*?(<\/div>\n\s*<div class="ft-copy">)/,
          `$1\n${ftLinks}\n  $2`
        );
      }
      if (fd.copyright) {
        html = html.replace(/(<div class="ft-copy">)[^<]*(<\/div>)/, (_, g1, g2) => g1 + esc(fd.copyright) + g2);
      }
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
