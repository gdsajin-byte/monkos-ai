/**
 * CMS SSR — FAQ + Gallery + Guide
 */
import { escapeHtml, layoutHead, layoutNav, layoutFooter, layoutShell, marked } from './render-shell.js';
import { firestore, log } from '../shared/config.js';

const faqCollection = firestore.collection('faq_items');
const galleryCollection = firestore.collection('gallery_items');

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

  const faqJsonLd = items.length ? JSON.stringify({
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
  }) : '';

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
${faqJsonLd ? `<script type="application/ld+json">${faqJsonLd}</script>` : ''}`;

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

// === AI 증명사진 전용 가이드 (/guide/ai-photo) ===

export function aiPhotoGuideFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const canonicalUrl = lang === 'ko' ? 'https://monkos.ai/guide/ai-photo' : `https://monkos.ai/${lang}/guide/ai-photo`;

  const i18n = {
    ko: {
      title: 'AI 증명사진 만들기 — 무료 사이트 비교·가격·사용법 총정리 2026 | MONKOS',
      desc: 'AI 증명사진 무료 사이트 비교, 사진관 vs AI 가격 차이, 셀프 촬영부터 규격 크롭까지. 여권·이력서·면허증 증명사진을 집에서 바로 만드세요.',
      h1: 'AI 증명사진 만들기 — 2026 완벽 가이드',
      intro: '사진관에 가지 않아도, 스마트폰 하나면 규격에 맞는 증명사진을 만들 수 있습니다.',
      whatTitle: 'AI 증명사진이란?',
      whatText: 'AI 증명사진은 인공지능이 자동으로 배경을 제거하고, 얼굴 위치와 크기를 규격에 맞춰 크롭하며, 자연스러운 보정까지 처리하는 서비스입니다. 셀카 한 장이면 여권·이력서·운전면허 등 모든 규격의 증명사진을 만들 수 있습니다.',
      compareTitle: '사진관 vs AI 증명사진 비교',
      compareHeaders: ['항목', '사진관', 'AI 증명사진'],
      compareRows: [
        ['가격', '10,000~20,000원', '무료~3,000원'],
        ['소요 시간', '방문 + 촬영 30분~1시간', '1~3분'],
        ['장소', '사진관 방문 필요', '집에서 스마트폰으로'],
        ['규격 정확도', '촬영사 경험에 의존', 'AI가 자동으로 규격 맞춤'],
        ['재촬영', '재방문 필요', '무제한 재시도'],
      ],
      howTitle: '사용 방법 — 3단계',
      steps: [
        { title: '1. 셀카 촬영', text: '밝은 곳에서 흰 벽 앞에서 정면 셀카를 찍으세요. 자연광이 가장 좋습니다.' },
        { title: '2. AI 자동 처리', text: 'MONKOS AI가 배경 제거, 규격 크롭, 자연 보정을 자동으로 처리합니다.' },
        { title: '3. 다운로드', text: '완성된 증명사진을 다운로드하세요. 인쇄용(300dpi)과 온라인 제출용 모두 제공.' },
      ],
      specsTitle: '지원 규격',
      specsText: '여권(3.5×4.5cm), 반명함(3×4cm), 운전면허(3.5×4.5cm), 주민등록증(35×45mm) 등 한국 주요 규격과 일본·미국·유럽 등 26개국 규격을 지원합니다.',
      faqTitle: '자주 묻는 질문',
      faqs: [
        { q: 'AI 증명사진이 실제 서류에 사용 가능한가요?', a: '네, MONKOS AI는 각국 공식 규격(사이즈, 배경색, 머리 비율)에 맞춰 생성하므로 여권·비자·이력서 제출에 사용할 수 있습니다.' },
        { q: '무료인가요?', a: '기본 크롭 기능은 무료입니다. AI 보정이 포함된 증명사진은 크레딧 차감 방식으로, 사진관 대비 90% 이상 저렴합니다.' },
        { q: '스마트폰으로만 가능한가요?', a: '스마트폰, 태블릿, PC 모두 사용 가능합니다. 웹 브라우저만 있으면 됩니다.' },
        { q: '셀카 품질이 낮아도 괜찮나요?', a: '밝은 환경에서 촬영하면 충분합니다. AI가 배경과 조명을 자동으로 보정합니다.' },
      ],
      ctaTitle: '지금 바로 만들어 보세요',
      ctaBtn1: 'AI 증명사진 만들기',
      ctaBtn2: '무료 크롭 앱',
      ctaBtn1Url: 'https://idphoto-kr.monkos.ai/',
      ctaBtn2Url: 'https://monkos.ai/crop',
    },
  };
  const t = i18n[lang] || i18n.ko;

  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": t.h1,
      "step": t.steps.map((s, idx) => ({ "@type": "HowToStep", "position": idx + 1, "name": s.title, "text": s.text })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": t.faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
    },
  ]);

  const seoMeta = `<meta property="og:title" content="${escapeHtml(t.title)}">
<meta property="og:description" content="${escapeHtml(t.desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<link rel="canonical" href="${canonicalUrl}">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/guide/ai-photo">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/guide/ai-photo">
<script type="application/ld+json">${jsonLd}</script>`;

  const compareRowsHtml = t.compareRows.map(([item, studio, ai]) =>
    `<tr><td>${escapeHtml(item)}</td><td>${escapeHtml(studio)}</td><td><strong>${escapeHtml(ai)}</strong></td></tr>`
  ).join('\n');

  const stepsHtml = t.steps.map(s =>
    `<div class="aip-step"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.text)}</p></div>`
  ).join('\n');

  const faqsHtml = t.faqs.map(f =>
    `<details class="aip-faq"><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`
  ).join('\n');

  const pageStyle = `
.aip-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
.aip-container h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.aip-intro { color: var(--text-dim); font-size: 16px; line-height: 1.7; margin-bottom: 40px; }
.aip-section { margin-bottom: 48px; }
.aip-section h2 { font-size: 22px; font-weight: 600; color: var(--text-bright); margin-bottom: 16px; border-left: 4px solid var(--accent); padding-left: 12px; }
.aip-section p { color: var(--text-dim); font-size: 15px; line-height: 1.7; }
.aip-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
.aip-table th, .aip-table td { padding: 10px 14px; border: 1px solid var(--border-dim); text-align: left; font-size: 14px; }
.aip-table th { background: var(--bg-card); color: var(--text-bright); font-weight: 600; }
.aip-table td strong { color: var(--accent); }
.aip-step { background: var(--bg-card); border: 1px solid var(--border-dim); border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; }
.aip-step h3 { font-size: 16px; font-weight: 600; color: var(--accent); margin-bottom: 6px; }
.aip-step p { font-size: 14px; color: var(--text-dim); line-height: 1.6; }
.aip-faq { border: 1px solid var(--border-dim); border-radius: 8px; margin-bottom: 8px; }
.aip-faq summary { padding: 12px 16px; font-weight: 500; cursor: pointer; font-size: 15px; color: var(--text-bright); }
.aip-faq p { padding: 0 16px 12px; font-size: 14px; color: var(--text-dim); line-height: 1.6; }
.aip-cta { text-align: center; background: var(--bg-card); border: 1px solid var(--border-dim); border-radius: 12px; padding: 32px; }
.aip-cta h2 { border: none; padding: 0; text-align: center; margin-bottom: 16px; }
.aip-cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.aip-cta-buttons a { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px; }
.aip-cta-buttons a.primary { background: var(--accent); color: #fff; }
.aip-cta-buttons a.secondary { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
`;

  const bodyContent = `
<div class="aip-container">
  <h1>${escapeHtml(t.h1)}</h1>
  <p class="aip-intro">${escapeHtml(t.intro)}</p>

  <div class="aip-section">
    <h2>${escapeHtml(t.whatTitle)}</h2>
    <p>${escapeHtml(t.whatText)}</p>
  </div>

  <div class="aip-section">
    <h2>${escapeHtml(t.compareTitle)}</h2>
    <table class="aip-table">
      <thead><tr>${t.compareHeaders.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>${compareRowsHtml}</tbody>
    </table>
  </div>

  <div class="aip-section">
    <h2>${escapeHtml(t.howTitle)}</h2>
    ${stepsHtml}
  </div>

  <div class="aip-section">
    <h2>${escapeHtml(t.specsTitle)}</h2>
    <p>${escapeHtml(t.specsText)}</p>
    <p style="margin-top:8px;"><a href="/specs" style="color:var(--accent);">전체 규격 보기 →</a></p>
  </div>

  <div class="aip-section">
    <h2>${escapeHtml(t.faqTitle)}</h2>
    ${faqsHtml}
  </div>

  <div class="aip-cta">
    <h2>${escapeHtml(t.ctaTitle)}</h2>
    <div class="aip-cta-buttons">
      <a href="${t.ctaBtn1Url}" class="primary">${escapeHtml(t.ctaBtn1)}</a>
      <a href="${t.ctaBtn2Url}" class="secondary">${escapeHtml(t.ctaBtn2)}</a>
    </div>
  </div>
</div>`;

  return { title: t.title, description: t.desc, seoMeta, htmlLang: lang, pageStyle, bodyContent, pageScript: null };
}

export function renderAiPhotoGuide(req, res, forceLang = null) {
  try {
    const parts = aiPhotoGuideFragment(forceLang);
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] AI Photo 가이드 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
