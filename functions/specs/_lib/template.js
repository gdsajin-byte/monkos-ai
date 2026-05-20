import { t, continentName, locField, CONTINENTS } from './i18n.js';
import { generateMeta, generateHubJsonLd, generateDetailJsonLd, parseFaqs, parseJsonArray, autoTitle } from './seo.js';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const PAGE_STYLE = `
:root {
  --text-bright: #1a1a2e;
  --text: #374151;
  --text-dim: #6b7280;
  --accent: #6c4fff;
  --card-bg: #ffffff;
  --border: #e5e7eb;
  --border-hover: #6c4fff;
  --surface: #f9fafb;
  --surface2: #f3f4f6;
  --bg: #fafbfc;
}
*, *::before, *::after { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  background: var(--bg); color: var(--text); margin: 0; padding: 0; line-height: 1.6;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
.specs-container { max-width: 960px; margin: 0 auto; padding: 40px 20px; }
.specs-nav { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--border); background: #fff; }
.specs-nav-brand { font-weight: 700; font-size: 18px; color: var(--text-bright); text-decoration: none; }
.specs-nav-brand:hover { text-decoration: none; }
.specs-nav-sep { color: var(--border); }
.specs-nav-link { font-size: 14px; color: var(--text-dim); text-decoration: none; }
.specs-nav-link:hover { color: var(--accent); text-decoration: none; }

.specs-hub-header { text-align: center; margin-bottom: 40px; }
.specs-hub-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.specs-hub-header p { color: var(--text-dim); font-size: 15px; }

.specs-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; justify-content: center; }
.specs-tab {
  padding: 8px 20px; border: 1px solid var(--border); background: #fff;
  color: var(--text-dim); font-size: 14px; font-weight: 500; cursor: pointer;
  border-radius: 20px; transition: all 0.2s;
}
.specs-tab:hover { border-color: var(--accent); color: var(--accent); }
.specs-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.specs-country-group { margin-bottom: 36px; }
.specs-country-group h2 {
  font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 16px;
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.specs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.specs-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 24px 20px; transition: border-color 0.2s, box-shadow 0.2s;
  text-decoration: none; display: block; color: inherit;
}
.specs-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(108,79,255,0.08); text-decoration: none; }
.specs-card-flag { font-size: 28px; margin-bottom: 8px; }
.specs-card-name { font-size: 17px; font-weight: 600; color: var(--text-bright); margin-bottom: 4px; }
.specs-card-count { font-size: 13px; color: var(--text-dim); }
.specs-card-type { font-size: 17px; font-weight: 600; color: var(--text-bright); margin-bottom: 6px; }
.specs-card-size { font-size: 14px; color: var(--accent); font-weight: 500; margin-bottom: 4px; }
.specs-card-desc { font-size: 13px; color: var(--text-dim); line-height: 1.5; }
.specs-card-badge {
  display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px;
  border-radius: 10px; margin-left: 8px;
}
.specs-card-badge.grade-S { background: #dbeafe; color: #1d4ed8; }
.specs-card-badge.grade-A { background: #dcfce7; color: #166534; }
.specs-card-badge.grade-B { background: #fef9c3; color: #854d0e; }
.specs-card-badge.grade-C { background: #f3f4f6; color: #6b7280; }

.specs-back { display: inline-block; margin-bottom: 20px; font-size: 13px; color: var(--accent); text-decoration: none; }
.specs-back:hover { text-decoration: underline; }

.specs-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 40px; }
.specs-hero-text h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); line-height: 1.3; margin-bottom: 12px; }
.specs-hero-text .specs-hero-desc { color: var(--text-dim); font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
.specs-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.specs-hero-tags span {
  background: rgba(108,79,255,0.08); color: var(--accent); padding: 4px 12px;
  border-radius: 20px; font-size: 13px; font-weight: 500;
}
.specs-diagram {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px;
  padding: 24px; display: flex; justify-content: center; align-items: center; position: relative;
}
.specs-guide-img { max-width: 100%; height: auto; border-radius: 8px; }

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

.specs-section { margin-bottom: 32px; }
.specs-section h2 { font-size: 18px; font-weight: 700; color: var(--text-bright); margin-bottom: 16px; }
.specs-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.specs-detail-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px;
  background: var(--surface2); border-radius: 8px; font-size: 14px; color: var(--text);
}
.specs-detail-item .sdi-icon { flex-shrink: 0; font-size: 16px; width: 24px; text-align: center; }

.specs-ox-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.specs-ox-card { background: var(--card-bg); border-radius: 12px; overflow: hidden; border: 2px solid var(--border); }
.specs-ox-card.ox-good { border-color: #22c55e; }
.specs-ox-card.ox-bad { border-color: #ef4444; }
.specs-ox-header { padding: 10px 16px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
.specs-ox-card.ox-good .specs-ox-header { background: rgba(34,197,94,0.08); color: #166534; }
.specs-ox-card.ox-bad .specs-ox-header { background: rgba(239,68,68,0.08); color: #991b1b; }
.specs-ox-body {
  padding: 20px; display: flex; justify-content: center; align-items: center;
  background: var(--surface2); min-height: 180px;
}
.specs-ox-body canvas { display: block; border-radius: 4px; }
.specs-ox-caption { margin-top: 10px; font-size: 12px; color: var(--text-dim); text-align: center; }
.specs-ox-points { padding: 12px 16px; border-top: 1px solid var(--border); list-style: none; margin: 0; }
.specs-ox-points li { font-size: 13px; color: var(--text-dim); padding: 3px 0; display: flex; align-items: center; gap: 6px; }

.specs-rejection-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; list-style: none; padding: 0; margin: 0; }
.specs-rejection-card {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 20px; display: flex; gap: 14px; align-items: flex-start; transition: box-shadow 0.2s;
}
.specs-rejection-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.specs-rj-badge {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #ef4444; color: #fff; font-weight: 700; font-size: 14px;
}
.specs-rj-info h4 { font-size: 14px; font-weight: 600; color: var(--text-bright); margin: 0 0 4px 0; }
.specs-rj-info p { font-size: 13px; color: var(--text-dim); margin: 0; line-height: 1.5; }

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
  content: "\\25BE"; margin-left: auto; color: var(--text-dim); font-size: 12px; transition: transform 0.2s;
}
.specs-faq-item.open .specs-faq-q::after { transform: rotate(180deg); }
.specs-faq-a {
  padding: 0 20px 16px 46px; font-size: 14px; color: var(--text-dim); line-height: 1.7; display: none;
}
.specs-faq-item.open .specs-faq-a { display: block; }

.specs-cta {
  background: linear-gradient(135deg, var(--accent) 0%, #8b6fff 100%);
  border-radius: 16px; padding: 36px 40px;
  display: flex; align-items: center; justify-content: space-between; margin: 32px 0;
}
.specs-cta-text h3 { color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 4px 0; }
.specs-cta-text p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
.specs-cta-buttons { display: flex; gap: 12px; }
.specs-cta-buttons a {
  padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
  text-decoration: none; transition: all 0.2s;
}
.specs-cta-buttons .primary { background: #fff; color: var(--accent); }
.specs-cta-buttons .primary:hover { background: #f0f0ff; }
.specs-cta-buttons .secondary { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); }

.specs-related {
  margin-top: 32px; padding: 20px 24px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
}
.specs-related h3 { font-size: 15px; font-weight: 600; color: var(--text-bright); margin-bottom: 12px; }
.specs-related-links { display: flex; flex-wrap: wrap; gap: 10px; }
.specs-related-links a {
  font-size: 13px; color: var(--accent); text-decoration: none; padding: 6px 14px;
  background: rgba(108,79,255,0.06); border-radius: 8px; transition: all 0.2s;
  border: 1px solid transparent;
}
.specs-related-links a:hover { background: rgba(108,79,255,0.12); border-color: var(--accent); text-decoration: none; }

.specs-footer {
  text-align: center; padding: 32px 20px; color: var(--text-dim); font-size: 13px;
  border-top: 1px solid var(--border); margin-top: 40px;
}
.specs-footer a { color: var(--accent); }

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
}
`;

const FAQ_SCRIPT = `document.querySelectorAll('.specs-faq-q').forEach(q=>{q.addEventListener('click',()=>{q.parentElement.classList.toggle('open')})});`;

const OX_CANVAS_SCRIPT = `
(function(){
function drawSilhouette(ctx,cx,cy,scale,tilt){
  ctx.save();ctx.translate(cx,cy);if(tilt)ctx.rotate(tilt*Math.PI/180);ctx.scale(scale,scale);
  ctx.fillStyle='#c8c8d0';ctx.beginPath();ctx.ellipse(0,-52,28,36,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(0,32,44,42,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d8d8de';ctx.beginPath();ctx.ellipse(0,-6,16,16,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawCorner(ctx,x,y,size,fx,fy){
  ctx.save();ctx.translate(x,y);ctx.scale(fx?-1:1,fy?-1:1);
  ctx.strokeStyle='#6c4fff';ctx.lineWidth=2.5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,size);ctx.lineTo(0,0);ctx.lineTo(size,0);ctx.stroke();ctx.restore();
}
function drawOx(id,pass){
  var c=document.getElementById(id);if(!c)return;
  var w=140,h=180;c.width=w;c.height=h;var x=c.getContext('2d');
  x.fillStyle=pass?'#f0fdf4':'#fef2f2';x.fillRect(0,0,w,h);
  x.strokeStyle=pass?'#22c55e':'#ef4444';x.lineWidth=2;x.strokeRect(1,1,w-2,h-2);
  drawSilhouette(x,w/2,h*0.44,0.7,pass?0:10);
  if(pass){
    drawCorner(x,8,8,12,0,0);drawCorner(x,w-8,8,12,1,0);
    drawCorner(x,8,h-8,12,0,1);drawCorner(x,w-8,h-8,12,1,1);
    x.setLineDash([4,3]);x.strokeStyle='rgba(34,197,94,0.35)';x.lineWidth=1;
    x.beginPath();x.moveTo(12,h*.22);x.lineTo(w-12,h*.22);x.stroke();
    x.beginPath();x.moveTo(12,h*.56);x.lineTo(w-12,h*.56);x.stroke();x.setLineDash([]);
    x.font='700 28px -apple-system';x.fillStyle='rgba(34,197,94,0.25)';x.textAlign='center';x.fillText('PASS',w/2,h-16);
  }else{
    x.strokeStyle='rgba(239,68,68,0.4)';x.lineWidth=2.5;
    x.beginPath();x.moveTo(w*.2,h*.15);x.lineTo(w*.8,h*.85);x.stroke();
    x.beginPath();x.moveTo(w*.8,h*.15);x.lineTo(w*.2,h*.85);x.stroke();
    x.font='700 28px -apple-system';x.fillStyle='rgba(239,68,68,0.25)';x.textAlign='center';x.fillText('FAIL',w/2,h-16);
  }
}
drawOx('ox-pass',true);drawOx('ox-fail',false);
})();
`;

const TAB_SCRIPT = `document.querySelectorAll('.specs-tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.specs-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');const c=tab.dataset.continent;document.querySelectorAll('.specs-continent-group').forEach(g=>{g.style.display=c==='all'||g.dataset.continent===c?'':'none'})})});`;

export function htmlShell({ title, lang, seoMeta, bodyContent, scripts = '' }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoMeta}
<meta name="naver-site-verification" content="4e800c0d59980f07d75c95f515409a962c8440b0">
<meta name="robots" content="index, follow">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-C2H9ZM85F7"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-C2H9ZM85F7');</script>
<style>${PAGE_STYLE}</style>
</head>
<body>
<nav class="specs-nav">
  <a href="/" class="specs-nav-brand">MONK</a>
  <span class="specs-nav-sep">/</span>
  <a href="/specs/" class="specs-nav-link">IDPASS Specs</a>
</nav>
<div class="specs-container">
${bodyContent}
</div>
<footer class="specs-footer">
  &copy; 2026 <a href="https://monk.kr">Monk Studio</a> &middot; <a href="https://monkos.ai">MONKOS AI</a>
</footer>
${scripts ? `<script>${scripts}</script>` : ''}
</body>
</html>`;
}

export function renderHub(countries, lang) {
  const i = t(lang);
  const prefix = lang === 'ko' ? '' : `/${lang}`;

  const groups = {};
  for (const c of countries) {
    const cont = c.continent || 'asia';
    if (!groups[cont]) groups[cont] = [];
    groups[cont].push(c);
  }

  const continentOrder = ['asia', 'americas', 'europe', 'middleeast', 'africa', 'oceania'];
  const activeContinents = continentOrder.filter(c => groups[c]?.length);

  const tabs = `<div class="specs-tabs">
    <button class="specs-tab active" data-continent="all">${esc(i.tabAll)}</button>
    ${activeContinents.map(c =>
      `<button class="specs-tab" data-continent="${c}">${esc(continentName(c, lang))} (${groups[c].length})</button>`
    ).join('\n    ')}
  </div>`;

  const sections = activeContinents.map(cont => {
    const cards = groups[cont].map(c => {
      const name = locField(c, 'name', lang);
      return `<a href="${prefix}/specs/${esc(c.slug)}/" class="specs-card">
        <div class="specs-card-flag">${c.flag || '🏳️'}</div>
        <div class="specs-card-name">${esc(name)}</div>
        <div class="specs-card-count">${c.doc_count}${esc(i.docCount)}</div>
      </a>`;
    }).join('\n      ');
    return `<div class="specs-continent-group" data-continent="${cont}">
      <h2>${esc(continentName(cont, lang))}</h2>
      <div class="specs-grid">${cards}</div>
    </div>`;
  }).join('\n    ');

  const jsonLd = generateHubJsonLd(countries, lang);
  const seoMeta = generateMeta({ title: i.hubTitle, description: i.hubDesc, path: '/specs/', lang }) +
    `\n<script type="application/ld+json">${jsonLd}</script>`;

  const bodyContent = `
  <div class="specs-hub-header">
    <h1>${esc(i.hubH1)}</h1>
    <p>${esc(i.hubSub)}</p>
  </div>
  ${tabs}
  ${sections}`;

  return htmlShell({ title: i.hubTitle, lang, seoMeta, bodyContent, scripts: TAB_SCRIPT });
}

export function renderCountryHub(country, documents, lang) {
  const i = t(lang);
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const countryName = locField(country, 'name', lang);
  const title = `${countryName} 증명사진 규격 | IDPASS`;
  const desc = `${countryName}의 여권, 비자, 이력서 등 증명사진 규격을 한눈에. 사이즈·배경·반려 사유까지.`;

  const seoMeta = generateMeta({ title, description: desc, path: `/specs/${country.slug}/`, lang, type: 'website' });

  const cards = documents.map(d => {
    const name = locField(d, 'name', lang);
    const seoDesc = d[`seo_description_${lang}`] || d.seo_description_ko || '';
    const shortDesc = seoDesc.length > 80 ? seoDesc.substring(0, 80) + '…' : seoDesc;
    const badge = d.reliability_grade && d.reliability_grade !== 'C'
      ? `<span class="specs-card-badge grade-${esc(d.reliability_grade)}">${esc(d.reliability_grade)}</span>` : '';
    return `<a href="${prefix}/specs/${esc(country.slug)}/${esc(d.slug)}" class="specs-card">
      <div class="specs-card-type">${esc(name)}${badge}</div>
      <div class="specs-card-size">${esc(d.size_display || '')} · ${d.px_w || ''}×${d.px_h || ''}px</div>
      <div class="specs-card-desc">${esc(shortDesc)}</div>
    </a>`;
  }).join('\n    ');

  const bodyContent = `
  <a href="${prefix}/specs/" class="specs-back">${esc(i.backToHub)}</a>
  <div class="specs-hub-header">
    <h1>${country.flag || ''} ${esc(countryName)}</h1>
    <p>${documents.length}${esc(i.docCount)}</p>
  </div>
  <div class="specs-grid">${cards}</div>`;

  return htmlShell({ title, lang, seoMeta, bodyContent });
}

export function renderDetail(data, lang) {
  const { doc, requirements, related } = data;
  const i = t(lang);
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const countryName = locField(doc, 'country_name', lang);
  const docName = locField(doc, 'name', lang);
  const title = autoTitle(doc, lang);
  const description = locField(doc, 'seo_description', lang) || locField(doc, 'details', lang);

  const jsonLd = generateDetailJsonLd(doc, lang);
  const seoMeta = generateMeta({
    title, description, path: `/specs/${doc.country_slug}/${doc.slug}`, lang, type: 'article',
  }) + `\n<script type="application/ld+json">${jsonLd}</script>`;

  const bgDetail = lang === 'en' ? doc.background_detail_en : lang === 'ja' ? doc.background_detail_ja : doc.background_detail_ko;
  const validityText = lang === 'en' ? (doc.validity_en || doc.validity) : lang === 'ja' ? (doc.validity_ja || doc.validity) : doc.validity;
  const fileSpecText = lang === 'en' ? (doc.file_spec_en || doc.file_spec) : lang === 'ja' ? (doc.file_spec_ja || doc.file_spec) : doc.file_spec;
  const headHeightDisplay = doc.head_height_min_mm && doc.head_height_max_mm
    ? `${doc.head_height_min_mm}~${doc.head_height_max_mm}mm` : '';

  const h = i.tableHeaders;
  const iconMap = { size: '📐', pixels: '🖥️', dpi: '🔍', background: '🎨', headHeight: '📏', validity: '📅', fileSpec: '📁' };
  const rows = [
    ['size', h.size, doc.size_display || ''],
    ['pixels', h.pixels, doc.px_w && doc.px_h ? `${doc.px_w}×${doc.px_h}px` : ''],
    ['dpi', h.dpi, doc.dpi ? String(doc.dpi) : ''],
    ['background', h.background, bgDetail || doc.background || ''],
    ['headHeight', h.headHeight, headHeightDisplay],
    ['validity', h.validity, validityText || ''],
    ['fileSpec', h.fileSpec, fileSpecText || ''],
  ].filter(([, , v]) => v).map(([key, label, val]) =>
    `<tr><th>${iconMap[key] || ''} ${esc(label)}</th><td>${esc(val)}</td></tr>`
  ).join('\n      ');

  const details = locField(doc, 'details', lang);
  const detailIcons = ['😐', '👓', '💇', '👂', '👔', '📸'];
  const detailLines = (details || '').split(/[.。]\s*/).filter(d => d.trim().length > 0);
  const detailGrid = detailLines.map((line, idx) =>
    `<div class="specs-detail-item"><span class="sdi-icon">${detailIcons[idx] || '📋'}</span><span>${esc(line.trim())}</span></div>`
  ).join('\n        ');

  const doReqs = requirements.filter(r => r.type === 'required' || r.type === 'do');
  const dontReqs = requirements.filter(r => r.type === 'forbidden' || r.type === 'dont');
  const doPoints = doReqs.map(r => `<li>✅ ${esc(locField(r, 'text', lang))}</li>`).join('');
  const dontPoints = dontReqs.map(r => `<li>❌ ${esc(locField(r, 'text', lang))}</li>`).join('');

  const rejections = parseJsonArray(doc[`rejection_reasons_${lang}`] || doc.rejection_reasons_ko);
  const rejectionHtml = rejections.map((r, idx) =>
    `<li class="specs-rejection-card">
      <span class="specs-rj-badge">${idx + 1}</span>
      <div class="specs-rj-info"><h4>${esc(r)}</h4></div>
    </li>`
  ).join('\n        ');

  const faqs = parseFaqs(doc[`faqs_${lang}`] || doc.faqs_ko);
  const faqHtml = faqs.map((f, idx) =>
    `<div class="specs-faq-item${idx === 0 ? ' open' : ''}">
      <div class="specs-faq-q">${esc(f.q)}</div>
      <div class="specs-faq-a">${esc(f.a)}</div>
    </div>`
  ).join('\n        ');

  const relatedLinks = related.map(r => {
    const name = locField(r, 'name', lang);
    return `<a href="${prefix}/specs/${esc(doc.country_slug)}/${esc(r.slug)}">${esc(name)}</a>`;
  }).join('\n        ');

  const noPhotoTypes = ['resume', 'headshot'];
  const needsPhoto = !noPhotoTypes.includes(doc.type);
  const photoWord = lang === 'ja' ? '写真' : lang === 'en' ? ' Photo' : '사진';
  const h1DocLabel = needsPhoto ? `${docName}${photoWord}` : docName;
  const specWordH1 = lang === 'ja' ? '規格' : lang === 'en' ? ' Specs' : ' 규격';

  const guideImgAlt = lang === 'ja' ? `${countryName} ${docName} 写真規格ガイド`
    : lang === 'en' ? `${countryName} ${docName} photo specs guide`
    : `${countryName} ${docName} 사진 규격 가이드`;

  const bodyContent = `
  <a href="${prefix}/specs/${esc(doc.country_slug)}/" class="specs-back">${esc(i.backToCountry)}</a>

  <section class="specs-hero">
    <div class="specs-hero-text">
      <h1>${doc.flag || ''} ${esc(countryName)} ${esc(h1DocLabel)}${esc(specWordH1)} 2026</h1>
      <p class="specs-hero-desc">${esc(description)}</p>
      <div class="specs-hero-tags">
        <span>${esc(doc.size_display || '')}</span>
        <span>${esc(doc.background || '')}</span>
        ${validityText ? `<span>${esc(validityText)}</span>` : ''}
        ${doc.dpi ? `<span>${doc.dpi} DPI</span>` : ''}
      </div>
    </div>
    <div class="specs-diagram">
      <img src="/images/specs/guides/size-${doc.size_w_mm || 35}x${doc.size_h_mm || 45}.webp"
           alt="${esc(guideImgAlt)}"
           width="300" loading="lazy"
           class="specs-guide-img">
    </div>
  </section>

  <table class="specs-table"><tbody>${rows}</tbody></table>

  ${detailGrid ? `<div class="specs-section">
    <h2>${esc(i.detailsTitle)}</h2>
    <div class="specs-details-grid">${detailGrid}</div>
  </div>` : ''}

  <div class="specs-section">
    <div class="specs-ox-compare">
      <div class="specs-ox-card ox-good">
        <div class="specs-ox-header">${esc(i.oxGood)}</div>
        <div class="specs-ox-body">
          <div>
            <canvas id="ox-pass" width="140" height="180"></canvas>
            <div class="specs-ox-caption">${esc(i.oxGoodCaption)}</div>
          </div>
        </div>
        ${doPoints ? `<ul class="specs-ox-points">${doPoints}</ul>` : ''}
      </div>
      <div class="specs-ox-card ox-bad">
        <div class="specs-ox-header">${esc(i.oxBad)}</div>
        <div class="specs-ox-body">
          <div>
            <canvas id="ox-fail" width="140" height="180"></canvas>
            <div class="specs-ox-caption">${esc(i.oxBadCaption)}</div>
          </div>
        </div>
        ${dontPoints ? `<ul class="specs-ox-points">${dontPoints}</ul>` : ''}
      </div>
    </div>
  </div>

  ${rejections.length ? `<div class="specs-section">
    <h2>${esc(i.rejectionTitle)}</h2>
    <ul class="specs-rejection-grid">${rejectionHtml}</ul>
  </div>` : ''}

  ${faqs.length ? `<div class="specs-section">
    <h2>${esc(i.faqTitle)}</h2>
    <div class="specs-faq">${faqHtml}</div>
  </div>` : ''}

  <div class="specs-cta">
    <div class="specs-cta-text">
      <h3>${esc(i.ctaHeadline)}</h3>
      <p>${esc(i.ctaSub)}</p>
    </div>
    <div class="specs-cta-buttons">
      <a href="https://monkos.ai" class="primary">${esc(i.ctaAI)}</a>
      <a href="https://monkos.ai/crop" class="secondary">${esc(i.ctaCrop)}</a>
    </div>
  </div>

  ${related.length ? `<div class="specs-related">
    <h3>${esc(i.sameCountryLabel)}</h3>
    <div class="specs-related-links">${relatedLinks}</div>
  </div>` : ''}`;

  return htmlShell({ title, lang, seoMeta, bodyContent, scripts: OX_CANVAS_SCRIPT + FAQ_SCRIPT });
}

export function render404(lang) {
  const i = t(lang);
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const seoMeta = `<title>404 | IDPASS</title><meta name="robots" content="noindex">`;
  const bodyContent = `
  <div style="text-align:center;padding:80px 20px;">
    <h1 style="font-size:48px;color:var(--text-dim);margin-bottom:16px;">404</h1>
    <p style="color:var(--text-dim);margin-bottom:24px;">Page not found</p>
    <a href="${prefix}/specs/">${esc(i.backToHub)}</a>
  </div>`;
  return htmlShell({ title: '404 | IDPASS', lang, seoMeta, bodyContent });
}
