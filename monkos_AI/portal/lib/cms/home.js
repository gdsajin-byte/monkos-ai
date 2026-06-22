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

const HOME_I18N = {
  ko: {
    intro: '<strong>MONKOS AI</strong>는 20년 경력 사진작가가 만든 <strong>AI 증명사진</strong> 플랫폼입니다. 여권사진, 이력서사진을 셀카 한 장으로 완성합니다. 리얼 스튜디오의 실무와 노하우를 학습한 AI가 촬영, 배경과 조명 세팅, 피부부터 의상, 헤어 세팅까지 완벽하게 맞춤 처리하며, <strong>ICAO 국제 규격</strong>에 부합하는 증명사진을 제공합니다.',
    ctaShoot: '촬영 시작하기',
    svcIdTitle: 'AI 증명사진', svcIdDesc: '여권·이력서 — 사진관 품질 AI 리터칭. ICAO 국제 규격.', svcIdLink: '촬영 시작 →',
    svcCropTitle: '무료 크롭앱', svcCropDesc: '규격 크롭·배경 제거·배경 교체. 서버 전송 없음.', svcCropLink: '/crop →',
    secHowto: '증명사진 앱 활용법', secFaq: '자주 묻는 질문', secBoard: '고객 게시판', secBlog: '최근 블로그',
    viewAll: '전체보기 →',
    howto1: '규격 선택', howto1d: '여권/신분증 또는 반명함 선택',
    howto2: '셀카 촬영', howto2d: 'AI 코칭 가이드로 완벽 촬영',
    howto3: 'AI 리터칭', howto3d: '배경·조명·피부·의상 자동 보정',
    boardAnswered: '답변완료', boardWaiting: '대기중', boardLoading: '게시글을 불러오는 중...',
    blogEmpty: '아직 포스트가 없습니다',
    sbMagazine: '매거진', sbTags: '태그', sbMore: '더보기 ▼', sbLess: '접기 ▲',
    sbShorts: 'MONKOS AI 쇼츠', sbCredit: '크레딧 안내',
    specOthers: '호주·캐나다·중국·베트남 외 8국',
    relJust: '방금 전', relMin: '분 전', relHour: '시간 전', relDay: '일 전',
  },
  en: {
    intro: '<strong>MONKOS AI</strong> is an <strong>AI ID photo</strong> platform built by a photographer with 20 years of experience. Create passport and resume photos from a single selfie. Our AI, trained on real studio expertise, handles background, lighting, skin, clothing, and hair — delivering <strong>ICAO-compliant</strong> ID photos.',
    ctaShoot: 'Start Shooting',
    svcIdTitle: 'AI ID Photos', svcIdDesc: 'Passport · Resume — Studio-quality AI retouching. ICAO international standard.', svcIdLink: 'Start →',
    svcCropTitle: 'Free Crop App', svcCropDesc: 'Spec crop · Background removal · Background swap. No server upload.', svcCropLink: '/crop →',
    secHowto: 'How to Use', secFaq: 'FAQ', secBoard: 'Community Board', secBlog: 'Recent Blog',
    viewAll: 'View All →',
    howto1: 'Choose Spec', howto1d: 'Select passport/ID or resume format',
    howto2: 'Take a Selfie', howto2d: 'AI coaching guides your perfect shot',
    howto3: 'AI Retouch', howto3d: 'Auto-correct background, lighting, skin & outfit',
    boardAnswered: 'Answered', boardWaiting: 'Pending', boardLoading: 'Loading posts...',
    blogEmpty: 'No posts yet',
    sbMagazine: 'Magazine', sbTags: 'Tags', sbMore: 'More ▼', sbLess: 'Less ▲',
    sbShorts: 'MONKOS AI Shorts', sbCredit: 'Credit Info',
    specOthers: 'AU · CA · CN · VN + 8 more',
    relJust: 'just now', relMin: 'm ago', relHour: 'h ago', relDay: 'd ago',
  },
  ja: {
    intro: '<strong>MONKOS AI</strong>は20年のキャリアを持つ写真家が作った<strong>AI証明写真</strong>プラットフォームです。パスポート写真、履歴書写真をセルフィー1枚で完成。リアルスタジオの実務とノウハウを学習したAIが背景、照明、肌、衣装、ヘアまで完璧に調整し、<strong>ICAO国際規格</strong>に準拠した証明写真を提供します。',
    ctaShoot: '撮影を開始',
    svcIdTitle: 'AI証明写真', svcIdDesc: 'パスポート·履歴書 — スタジオ品質AIリタッチ。ICAO国際規格。', svcIdLink: '撮影開始 →',
    svcCropTitle: '無料クロップアプリ', svcCropDesc: '規格クロップ·背景除去·背景交換。サーバー送信なし。', svcCropLink: '/crop →',
    secHowto: '証明写真アプリの使い方', secFaq: 'よくある質問', secBoard: 'お客様掲示板', secBlog: '最新ブログ',
    viewAll: '全て見る →',
    howto1: '規格選択', howto1d: 'パスポート/身分証または履歴書を選択',
    howto2: 'セルフィー撮影', howto2d: 'AIコーチングで完璧に撮影',
    howto3: 'AIリタッチ', howto3d: '背景·照明·肌·衣装を自動補正',
    boardAnswered: '回答済み', boardWaiting: '待機中', boardLoading: '投稿を読み込み中...',
    blogEmpty: 'まだ投稿がありません',
    sbMagazine: 'マガジン', sbTags: 'タグ', sbMore: 'もっと見る ▼', sbLess: '閉じる ▲',
    sbShorts: 'MONKOS AI ショート', sbCredit: 'クレジット案内',
    specOthers: '豪·加·中·越 他8カ国',
    relJust: 'たった今', relMin: '分前', relHour: '時間前', relDay: '日前',
  },
};

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

function relTime(dateStr, d) {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return d.relJust;
  if (m < 60) return `${m}${d.relMin}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${d.relHour}`;
  return `${Math.floor(h / 24)}${d.relDay}`;
}

function fmtDate(d) { return d ? d.substring(5, 10).replace('-', '.') : ''; }

function getTemplate() {
  if (!templateHtml) templateHtml = readFileSync(templatePath, 'utf-8');
  return templateHtml;
}

function magCard(p, i, d) {
  const emoji = EMOJI[p.category] || EMOJI.default;
  const tag = p.tags?.[0] ? `<span class="tag tip">${esc(p.tags[0])}</span>` : '';
  const summary = (p.summary || '').substring(0, 30);
  const thumbStyle = p.thumbnail
    ? `background:url('${esc(p.thumbnail)}') center/cover no-repeat; background-color:${GRADIENTS[i % 4].match(/#\w+/)?.[0] || '#f0eee8'}`
    : `background:${GRADIENTS[i % 4]}`;
  const thumbContent = p.thumbnail ? tag : `<span class="icon">${emoji}</span>${tag}`;
  return `      <a href="/blog/${esc(p.slug)}" class="mag-card"><div class="mag-img" style="${thumbStyle}">${thumbContent}</div><div class="mag-body"><h4>${esc(p.title)}</h4><p>${esc(summary)}</p><div class="meta">${esc(p.author || 'MONKOS')} · ${relTime(p.createdAt, d)}</div></div></a>`;
}

function blogCard(p, langPrefix) {
  const emoji = EMOJI[p.category] || EMOJI.default;
  const thumb = p.thumbnail
    ? `<div class="bi-thumb" style="background-image:url('${esc(p.thumbnail)}');background-size:cover;background-position:center"></div>`
    : `<div class="bi-thumb">${emoji}</div>`;
  return `      <a href="${langPrefix}/blog/${esc(p.slug)}" class="bi">${thumb}<div class="bi-info"><h3>${esc(p.title)}</h3><p>${esc(p.summary || '')}</p><div class="meta"><span class="lt">${esc((p.lang || 'ko').toUpperCase())}</span> ${esc(p.author || 'MONKOS')} · ${fmtDate(p.createdAt)}</div></div></a>`;
}

// ========== Home SSR ==========
export async function renderHome(req, res, forceLang = null) {
  try {
    let html = getTemplate();

    const [configSnap, postsSnap, gallerySnap, layoutSnap] = await Promise.all([
      siteConfigRef.get().catch(() => null),
      blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
      galleryCollection.where('published', '==', true).orderBy('order', 'asc').get().catch(() => ({ docs: [] })),
      layoutConfigRef.get().catch(() => null),
    ]);

    const allPosts = postsSnap.docs.map(d => ({ slug: d.id, ...d.data() }));

    const reqUrl = new URL(req.url, 'http://localhost');
    const lang = forceLang || req.lang || reqUrl.searchParams.get('lang') || 'ko';
    const d = HOME_I18N[lang] || HOME_I18N.ko;
    const langPrefix = lang === 'ko' ? '' : `/${lang}`;
    const langPosts = allPosts.filter(p => p.lang === lang);
    const displayPosts = (langPosts.length > 0 ? langPosts : allPosts)
      .filter(p => !p.autoTranslated)
      .filter(p => p.thumbnail && p.thumbnail.length > 0);

    // Layout 블록 헬퍼 (fallback: layout 없으면 기존 하드코딩 유지)
    const layoutSections = layoutSnap?.exists ? (layoutSnap.data().sections || []) : [];
    function getBlock(id) { return layoutSections.find(s => s.id === id); }
    function lt(obj) { return (obj && obj[lang]) || obj?.ko || ''; }

    // 0-pre. 메타 태그 언어별 치환 (SEO: JA/EN 현지화)
    const metaMap = {
      ko: {
        title: 'MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진',
        desc: 'AI 실시간 코칭으로 완벽한 증명사진을 촬영하세요. 여권, 비자, 이력서, 취업사진 지원. 고품질 AI 증명사진 생성.',
        ogTitle: 'MONKOS AI | AI 증명사진',
        ogDesc: 'AI 코치가 촬영을 실시간 가이드. 증명사진 · 여권사진 · 이력서사진 촬영.',
        canonical: 'https://monkos.ai/',
        locale: 'ko_KR',
        htmlLang: 'ko'
      },
      ja: {
        title: 'MONKOS AI | AI証明写真 · パスポート写真 · 履歴書写真',
        desc: 'AIリアルタイムコーチングで完璧な証明写真を撮影。パスポート、ビザ、履歴書対応。高品質AI証明写真生成。',
        ogTitle: 'MONKOS AI | AI証明写真',
        ogDesc: 'AIコーチがリアルタイムガイド。証明写真・パスポート写真・履歴書写真の撮影。',
        canonical: 'https://monkos.ai/ja/',
        locale: 'ja_JP',
        htmlLang: 'ja'
      },
      en: {
        title: 'MONKOS AI | AI ID Photos · Passport Photos · Resume Photos',
        desc: 'Capture perfect ID photos with AI real-time coaching. Passport, visa, resume photos supported. High-quality AI photo generation.',
        ogTitle: 'MONKOS AI | AI ID Photos',
        ogDesc: 'AI coach guides your photo session in real time. ID · Passport · Resume photos.',
        canonical: 'https://monkos.ai/en/',
        locale: 'en_US',
        htmlLang: 'en'
      }
    };
    const m = metaMap[lang] || metaMap.ko;

    html = html.replace(/<html lang="ko">/, `<html lang="${m.htmlLang}">`);
    html = html.replace(/<title>[^<]+<\/title>/, `<title>${m.title}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${m.desc}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${m.ogTitle}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${m.ogDesc}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${m.canonical}">`);
    html = html.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${m.locale}">`);
    html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${m.canonical}">`);
    html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${m.ogTitle}">`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${m.ogDesc}">`);

    // 0-a. 템플릿 내 하드코딩 텍스트 i18n 치환
    html = html.replace(/<p class="intro-text">[\s\S]*?<\/p>/, `<p class="intro-text">${d.intro}</p>`);
    html = html.replace(/<button class="btn-shoot">[^<]*<\/button>/, `<button class="btn-shoot">${esc(d.ctaShoot)}</button>`);
    html = html.replace(/>AI 증명사진<\/h3>/, `>${esc(d.svcIdTitle)}</h3>`);
    html = html.replace(/여권·이력서 — 사진관 품질 AI 리터칭\. ICAO 국제 규격\./, esc(d.svcIdDesc));
    html = html.replace(/촬영 시작 →/, esc(d.svcIdLink));
    html = html.replace(/>무료 크롭앱<\/h3>/, `>${esc(d.svcCropTitle)}</h3>`);
    html = html.replace(/규격 크롭·배경 제거·배경 교체\. 서버 전송 없음\./, esc(d.svcCropDesc));
    html = html.replace(/<h2>증명사진 앱 활용법<\/h2><a href="\/guide">전체보기 →<\/a>/, `<h2>${esc(d.secHowto)}</h2><a href="${langPrefix}/guide">${esc(d.viewAll)}</a>`);
    html = html.replace(/<h4>규격 선택<\/h4><p>여권\/신분증 또는 반명함 선택<\/p>/, `<h4>${esc(d.howto1)}</h4><p>${esc(d.howto1d)}</p>`);
    html = html.replace(/<h4>셀카 촬영<\/h4><p>AI 코칭 가이드로 완벽 촬영<\/p>/, `<h4>${esc(d.howto2)}</h4><p>${esc(d.howto2d)}</p>`);
    html = html.replace(/<h4>AI 리터칭<\/h4><p>배경·조명·피부·의상 자동 보정<\/p>/, `<h4>${esc(d.howto3)}</h4><p>${esc(d.howto3d)}</p>`);
    html = html.replace(/<h2>자주 묻는 질문<\/h2><a href="\/faq">전체보기 →<\/a>/, `<h2>${esc(d.secFaq)}</h2><a href="${langPrefix}/faq">${esc(d.viewAll)}</a>`);
    html = html.replace(/<h2>고객 게시판<\/h2><a href="\/board">전체보기 →<\/a>/, `<h2>${esc(d.secBoard)}</h2><a href="${langPrefix}/board">${esc(d.viewAll)}</a>`);
    html = html.replace(/<h2>최근 블로그<\/h2><a href="\/blog">전체보기 →<\/a>/, `<h2>${esc(d.secBlog)}</h2><a href="${langPrefix}/blog">${esc(d.viewAll)}</a>`);
    html = html.replace(/게시글을 불러오는 중\.\.\./, esc(d.boardLoading));
    html = html.replace(/>매거진<\/div>/, `>${esc(d.sbMagazine)}</div>`);
    html = html.replace(/<div class="sb-t" id="sb-tags">태그<\/div>/, `<div class="sb-t" id="sb-tags">${esc(d.sbTags)}</div>`);
    html = html.replace(/>더보기 ▼<\/button>/, `>${esc(d.sbMore)}</button>`);
    html = html.replace(/접기 ▲/, esc(d.sbLess));
    html = html.replace(/<div class="sb-t">MONKOS AI 쇼츠<\/div>/, `<div class="sb-t">${esc(d.sbShorts)}</div>`);
    html = html.replace(/<div class="sb-t" id="sb-credit">크레딧 안내<\/div>/, `<div class="sb-t" id="sb-credit">${esc(d.sbCredit)}</div>`);
    html = html.replace(/호주·캐나다·중국·베트남 외 8국/, esc(d.specOthers));
    // __LANG__/__REGION__ 주입 (i18n.js 연동)
    html = html.replace('</body>', `<script>window.__LANG__='${lang}';window.__REGION__='${lang === 'ko' ? 'kr' : 'global'}';</script>\n</body>`);
    // 다국어 nav 링크 경로 보정
    if (lang !== 'ko') {
      html = html.replace(/href="\/specs"/g, `href="${langPrefix}/specs"`);
      html = html.replace(/href="\/blog"/g, `href="${langPrefix}/blog"`);
      html = html.replace(/href="\/faq"/g, `href="${langPrefix}/faq"`);
      html = html.replace(/href="\/pricing"/g, `href="${langPrefix}/pricing"`);
      html = html.replace(/href="\/headshot"/g, `href="${langPrefix}/headshot"`);
      html = html.replace(/href="\/guide"/g, `href="${langPrefix}/guide"`);
    }

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
      const heroSubMap = { ko: 'AI 증명사진 · 26개국 규격', ja: 'AI証明写真 · 26カ国規格', en: 'AI ID Photos · 26 Countries' };
      const heroHtml = `<div class="hero"><div class="hero-inner">\n  <div class="hero-label">${hd.label || 'AI CREATIVE PLATFORM'}</div>\n  <h1>${hd.title || 'MONKOS <em>AI</em>'}</h1>\n  <p class="hero-sub" data-i18n="hero_sub">${heroSubMap[lang] || heroSubMap.ko}</p>\n</div></div>`;
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

    // 3. Nav (고정 5항목 — specs 경로 확보)
    const navItems = [
      { href: '/', label: { ko: '홈', ja: 'ホーム', en: 'Home' }, active: true },
      { href: '/specs', label: { ko: '규격', ja: '規格', en: 'Specs' } },
      { href: '/blog', label: { ko: '블로그', ja: 'ブログ', en: 'Blog' } },
      { href: '/faq', label: { ko: 'FAQ', ja: 'FAQ', en: 'FAQ' } },
      { href: '/pricing', label: { ko: '가격', ja: '料金', en: 'Pricing' } },
      { href: '/headshot', label: { ko: 'Headshot', ja: 'Headshot', en: 'Headshot' } },
    ];
    const navLinks = navItems.map(item => {
      const cls = item.active ? ' class="active"' : '';
      return `  <a href="${esc(item.href)}"${cls}>${esc(item.label[lang] || item.label.ko)}</a>`;
    }).join('\n');
    html = html.replace(
      /(<nav><div class="n-links">)\n[\s\S]*?\n(<\/div><\/nav>)/,
      `$1\n${navLinks}\n$2`
    );

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
      const magHtml = mags.map((p, i) => magCard(p, i, d)).join('\n');
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
      ? blogs.map(p => blogCard(p, langPrefix)).join('\n')
      : `      <p style="color:var(--ink-m);padding:24px 0">${esc(d.blogEmpty)}</p>`;
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

    // 10-b. specs 링크 삽입 (FAQ 프리뷰 하단)
    const specsPrefix = lang === 'ko' ? '/specs' : `/${lang}/specs`;
    const specsLabel = lang === 'ja' ? '📋 証明写真 規格ガイド →' : lang === 'en' ? '📋 ID Photo Specs Guide →' : '📋 증명사진 규격 가이드 →';
    html = html.replace(
      '<div class="sec-h" id="sec-board">',
      `<div style="text-align:center;margin:12px 0 24px;"><a href="${specsPrefix}" style="color:#6c4fff;font-size:14px;font-weight:600;text-decoration:none;">${specsLabel}</a></div>\n    <div class="sec-h" id="sec-board">`
    );

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
          ? `<span class="board-item-badge answered">${esc(d.boardAnswered)}</span>`
          : `<span class="board-item-badge">${esc(d.boardWaiting)}</span>`;
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
