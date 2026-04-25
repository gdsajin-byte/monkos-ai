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
