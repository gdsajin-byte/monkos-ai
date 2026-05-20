import { t, locField } from './i18n.js';

const DOMAIN = 'https://monk.kr';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function generateHreflang(path) {
  const clean = path.replace(/^\/(?:ja|en)\//, '/');
  return ['ko', 'ja', 'en'].map(l => {
    const prefix = l === 'ko' ? '' : `/${l}`;
    return `<link rel="alternate" hreflang="${l}" href="${DOMAIN}${prefix}${clean}">`;
  }).concat(
    `<link rel="alternate" hreflang="x-default" href="${DOMAIN}${clean}">`
  ).join('\n');
}

export function generateMeta({ title, description, path, lang, type = 'website' }) {
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const canonical = `${DOMAIN}${prefix}${path}`;
  return `<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="IDPASS by MONK">
<meta property="og:locale" content="${lang === 'ja' ? 'ja_JP' : lang === 'en' ? 'en_US' : 'ko_KR'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${generateHreflang(path)}`;
}

export function generateHubJsonLd(countries, lang) {
  const i = t(lang);
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: i.hubH1,
    itemListElement: countries.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${DOMAIN}${prefix}/specs/${c.slug}/`,
      name: locField(c, 'name', lang),
    })),
  });
}

export function generateDetailJsonLd(doc, lang) {
  const i = t(lang);
  const countryName = locField(doc, 'country_name', lang);
  const docName = locField(doc, 'name', lang);
  const specWord = lang === 'ja' ? '規格' : lang === 'en' ? 'Specs' : '규격';
  const title = locField(doc, 'seo_title', lang) || `${countryName} ${docName} ${specWord} 2026 | IDPASS`;

  const arr = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      author: { '@type': 'Person', name: 'Shin-jakka' },
      publisher: { '@type': 'Organization', name: 'Monk Studio' },
      datePublished: '2026-05-20',
      dateModified: doc.updated_at || '2026-05-20',
    },
  ];

  const rawFaqs = doc[`faqs_${lang}`] || doc.faqs_ko;
  const faqs = parseFaqs(rawFaqs);
  if (faqs.length) {
    arr.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  const howToName = lang === 'ja' ? `${docName}の規格に合わせて写真を準備する方法`
    : lang === 'en' ? `How to prepare a ${docName} photo`
    : `${docName} 규격에 맞게 사진 준비하는 법`;
  const steps = lang === 'ja'
    ? [['規格確認', `${doc.size_display || ''} / ${doc.background || ''}`], ['セルフィー撮影', '明るい場所で白い背景の前で撮影'], ['AI補正またはクロップ', 'MONKOS AIまたは無料クロップアプリで規格に合わせる'], ['ダウンロード', '完成写真をダウンロード']]
    : lang === 'en'
    ? [['Check specs', `${doc.size_display || ''} / ${doc.background || ''}`], ['Take a selfie', 'Take a photo in a bright area with a white background'], ['AI retouch or crop', 'Use MONKOS AI or the free crop app to fit the specs'], ['Download', 'Download the finished photo']]
    : [['규격 확인', `${doc.size_display || ''} / ${doc.background || ''}`], ['셀카 촬영', '밝은 곳에서 흰 배경 앞에 촬영'], ['AI 보정 또는 크롭', 'MONKOS AI 또는 무료 크롭앱으로 규격 맞춤'], ['다운로드', '완성 사진 다운로드']];
  arr.push({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howToName,
    step: steps.map(([name, text], idx) => ({ '@type': 'HowToStep', position: idx + 1, name, text })),
  });

  arr.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: i.hubH1, item: `${DOMAIN}/specs/` },
      { '@type': 'ListItem', position: 2, name: countryName, item: `${DOMAIN}/specs/${doc.country_slug}/` },
      { '@type': 'ListItem', position: 3, name: docName },
    ],
  });

  return JSON.stringify(arr);
}

export function parseFaqs(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

export function parseJsonArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

export function autoTitle(doc, lang) {
  const countryName = locField(doc, 'country_name', lang);
  const docName = locField(doc, 'name', lang);
  const custom = locField(doc, 'seo_title', lang);
  if (custom) return custom;

  const noPhotoTypes = ['resume', 'headshot'];
  const needsPhoto = !noPhotoTypes.includes(doc.type);
  const photoWord = lang === 'ja' ? '写真' : lang === 'en' ? ' Photo' : '사진';
  const specWord = lang === 'ja' ? '規格' : lang === 'en' ? ' Specs' : ' 규격';
  const suffix = lang === 'ja' ? ' — サイズ・背景・服装まとめ | IDPASS'
    : lang === 'en' ? ' — Size, Background & Requirements | IDPASS'
    : ' — 사이즈·배경·복장 총정리 | IDPASS';
  const docLabel = needsPhoto ? `${docName}${photoWord}` : docName;
  return `${countryName} ${docLabel}${specWord} 2026${suffix}`;
}
