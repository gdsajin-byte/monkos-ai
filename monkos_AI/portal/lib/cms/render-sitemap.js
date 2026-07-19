/**
 * CMS SSR — Sitemap 동적 생성
 * sitemap index + 3 하위맵 (static / specs / blog)
 */
import { firestore, log } from '../shared/config.js';
import { SPECS_DATA, REDIRECT_MAP } from './render-specs.js';
import { specsUrl, specsAlternates, SPECS_DOMAIN } from './specs-url.js';
import { isIndexableBlogUrl } from './seo-exclude.js';

const blogCollection = firestore.collection('blog_posts');
const DOMAIN = SPECS_DOMAIN;

// lastmod 정본 상수 — 인덱스와 하위 사이트맵의 날짜 드리프트 방지
const STATIC_LASTMOD = '2026-07-17';
const SPECS_LASTMOD = '2026-07-17';

function escXml(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;') : ''; }

function urlEntry(u) {
  let xml = `  <url>\n    <loc>${u.loc}</loc>\n`;
  if (u.alternates) {
    for (const alt of u.alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.href}"/>\n`;
    }
  }
  if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
  xml += `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n`;
  if (u.image) {
    xml += `    <image:image>\n      <image:loc>${u.image}</image:loc>\n`;
    if (u.imageTitle) xml += `      <image:title>${escXml(u.imageTitle)}</image:title>\n`;
    xml += `    </image:image>\n`;
  }
  xml += `  </url>`;
  return xml;
}

function wrapUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;
}

function sendXml(res, xml) {
  res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
  res.end(xml);
}

// GET /sitemap.xml — sitemap index
export async function renderSitemap(req, res) {
  try {
    let blogLastmod = '2026-06-14';
    try {
      const latest = await blogCollection.where('published', '==', true).orderBy('updatedAt', 'desc').limit(1).get();
      if (!latest.empty) {
        const d = latest.docs[0].data();
        blogLastmod = (d.updatedAt || d.createdAt || blogLastmod).substring(0, 10);
      }
    } catch { /* Firestore 접근 실패 시 폴백 */ }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${DOMAIN}/sitemap-static.xml</loc>
    <lastmod>${STATIC_LASTMOD}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-specs-ko.xml</loc>
    <lastmod>${SPECS_LASTMOD}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-specs-en.xml</loc>
    <lastmod>${SPECS_LASTMOD}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-specs-ja.xml</loc>
    <lastmod>${SPECS_LASTMOD}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-specs-es.xml</loc>
    <lastmod>${SPECS_LASTMOD}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${DOMAIN}/sitemap-blog.xml</loc>
    <lastmod>${blogLastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
    sendXml(res, xml);
  } catch (err) {
    log(`[CMS] sitemap index 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /sitemap-static.xml
export function renderSitemapStatic(req, res) {
  try {
    const ogImage = `${DOMAIN}/og-image.png`;
    const urls = [
      { loc: `${DOMAIN}/`, lastmod: '2026-06-01', changefreq: 'weekly', priority: '1.0', image: ogImage, imageTitle: 'MONKOS AI 증명사진' },
      { loc: `${DOMAIN}/ja/`, lastmod: '2026-06-01', changefreq: 'weekly', priority: '0.9', image: ogImage, imageTitle: 'MONKOS AI 証明写真' },
      { loc: `${DOMAIN}/en/`, lastmod: '2026-06-01', changefreq: 'weekly', priority: '0.9', image: ogImage, imageTitle: 'MONKOS AI ID Photo' },
      { loc: `${DOMAIN}/es/`, lastmod: '2026-07-15', changefreq: 'weekly', priority: '0.8', image: ogImage, imageTitle: 'MONKOS AI Foto de Identificación' },
      { loc: `${DOMAIN}/blog`, lastmod: '2026-06-14', changefreq: 'daily', priority: '0.8', image: ogImage, imageTitle: 'MONKOS AI 블로그' },
      { loc: `${DOMAIN}/ja/blog`, lastmod: '2026-06-14', changefreq: 'daily', priority: '0.7' },
      { loc: `${DOMAIN}/en/blog`, lastmod: '2026-06-14', changefreq: 'daily', priority: '0.7' },
      { loc: `${DOMAIN}/es/blog`, lastmod: '2026-07-15', changefreq: 'daily', priority: '0.6' },
      { loc: `${DOMAIN}/faq`, lastmod: '2026-03-15', changefreq: 'weekly', priority: '0.7' },
      { loc: `${DOMAIN}/ja/faq`, lastmod: '2026-03-15', changefreq: 'weekly', priority: '0.6' },
      { loc: `${DOMAIN}/en/faq`, lastmod: '2026-03-15', changefreq: 'weekly', priority: '0.6' },
      { loc: `${DOMAIN}/gallery`, lastmod: '2026-03-01', changefreq: 'weekly', priority: '0.6' },
      { loc: `${DOMAIN}/board`, lastmod: '2026-06-01', changefreq: 'daily', priority: '0.5' },
      { loc: `${DOMAIN}/pricing`, lastmod: '2026-04-27', changefreq: 'monthly', priority: '0.6' },
      { loc: `${DOMAIN}/ja/pricing`, lastmod: '2026-04-27', changefreq: 'monthly', priority: '0.5' },
      { loc: `${DOMAIN}/en/pricing`, lastmod: '2026-04-27', changefreq: 'monthly', priority: '0.5' },
      { loc: `${DOMAIN}/es/pricing`, lastmod: '2026-07-15', changefreq: 'monthly', priority: '0.4' },
      { loc: `${DOMAIN}/guide`, lastmod: '2026-03-01', changefreq: 'weekly', priority: '0.7' },
      { loc: `${DOMAIN}/guide/ai-photo`, lastmod: '2026-03-01', changefreq: 'weekly', priority: '0.8', image: ogImage, imageTitle: 'MONKOS AI 증명사진 가이드' },
      { loc: `${DOMAIN}/specs`, lastmod: '2026-05-26', changefreq: 'monthly', priority: '0.9', image: ogImage, imageTitle: 'MONKOS AI 증명사진 규격' },
      { loc: `${DOMAIN}/ja/specs`, lastmod: '2026-05-26', changefreq: 'monthly', priority: '0.8', image: ogImage, imageTitle: 'MONKOS AI 証明写真 規格' },
      { loc: `${DOMAIN}/en/specs`, lastmod: '2026-05-26', changefreq: 'monthly', priority: '0.8', image: ogImage, imageTitle: 'MONKOS AI ID Photo Specs' },
      { loc: `${DOMAIN}/es/specs`, lastmod: '2026-07-15', changefreq: 'monthly', priority: '0.7', image: ogImage, imageTitle: 'MONKOS AI Especificaciones Foto ID' },
    ];
    sendXml(res, wrapUrlset(urls.map(urlEntry)));
  } catch (err) {
    log(`[CMS] sitemap-static 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// specs 사이트맵 공통 — 지정 언어 1개분 URL 생성
function specsUrlsForLang(lang) {
  const urls = [];
  const seen = new Set();
  const priorityMap = { ko: '0.8', en: '0.7', ja: '0.7', es: '0.6' };
  for (const [slug] of Object.entries(SPECS_DATA)) {
    const canonical = REDIRECT_MAP[slug];
    const path = canonical || slug;
    if (seen.has(path)) continue;
    seen.add(path);
    urls.push({
      loc: specsUrl(path, lang),
      lastmod: SPECS_LASTMOD,
      changefreq: 'monthly',
      priority: priorityMap[lang] || '0.6',
      alternates: specsAlternates(path),
    });
  }
  return urls;
}

// GET /sitemap-specs.xml — 전체 (하위 호환)
export function renderSitemapSpecs(req, res) {
  try {
    const urls = [];
    for (const lang of ['ko', 'ja', 'en', 'es']) urls.push(...specsUrlsForLang(lang));
    sendXml(res, wrapUrlset(urls.map(urlEntry)));
  } catch (err) {
    log(`[CMS] sitemap-specs 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /sitemap-specs-{lang}.xml — 언어별 분할
export function renderSitemapSpecsLang(req, res, lang) {
  try {
    sendXml(res, wrapUrlset(specsUrlsForLang(lang).map(urlEntry)));
  } catch (err) {
    log(`[CMS] sitemap-specs-${lang} 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// GET /sitemap-blog.xml
export async function renderSitemapBlog(req, res) {
  try {
    const snapshot = await blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();
    const seen = new Set();
    const urls = [];

    const slugLangs = new Map();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docLang = data.lang || 'ko';
      const baseSlug = doc.id.replace(/-(?:kr|ja|en)$/, '');
      if (!slugLangs.has(baseSlug)) slugLangs.set(baseSlug, new Set());
      slugLangs.get(baseSlug).add(docLang);
    }

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const docLang = data.lang || 'ko';
      const baseSlug = doc.id.replace(/-(?:kr|ja|en)$/, '');
      const langPrefix = docLang === 'ko' ? '' : `/${docLang}`;
      const path = `${langPrefix}/blog/${baseSlug}`;
      const loc = `${DOMAIN}${path}`;
      if (seen.has(loc)) continue;
      seen.add(loc);
      if (!isIndexableBlogUrl(baseSlug, path)) continue;

      const existingLangs = slugLangs.get(baseSlug) || new Set();
      const alternates = [];
      for (const lang of ['ko', 'en', 'ja']) {
        if (existingLangs.has(lang)) {
          const prefix = lang === 'ko' ? '' : `/${lang}`;
          alternates.push({ lang, href: `${DOMAIN}${prefix}/blog/${baseSlug}` });
        }
      }
      if (existingLangs.has('ko')) {
        alternates.push({ lang: 'x-default', href: `${DOMAIN}/blog/${baseSlug}` });
      }

      urls.push({
        loc,
        lastmod: (data.updatedAt || data.createdAt || '').substring(0, 10),
        changefreq: 'weekly',
        priority: '0.7',
        image: data.ogImage || data.thumbnail || '',
        imageTitle: data.title || '',
        alternates: alternates.length > 1 ? alternates : undefined,
      });
    }

    sendXml(res, wrapUrlset(urls.map(urlEntry)));
  } catch (err) {
    log(`[CMS] sitemap-blog 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
