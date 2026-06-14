import { getAllPublishedDocuments, getAllPublishedCountrySlugs } from './_lib/queries.js';

const DOMAIN = 'https://monk.kr';
const LANGS = ['ko', 'ja', 'en'];

function hreflangs(path) {
  return LANGS.map(l => {
    const prefix = l === 'ko' ? '' : `/${l}`;
    return `      <xhtml:link rel="alternate" hreflang="${l}" href="${DOMAIN}${prefix}${path}"/>`;
  }).concat(
    `      <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}${path}"/>`
  ).join('\n');
}

function urlEntry(path, lastmod, priority = '0.7') {
  return `  <url>
    <loc>${DOMAIN}${path}</loc>
    <lastmod>${lastmod || '2026-05-20'}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
${hreflangs(path)}
  </url>`;
}

export async function onRequest(context) {
  try {
    const db = context.data.db;
    const [docs, countries] = await Promise.all([
      getAllPublishedDocuments(db),
      getAllPublishedCountrySlugs(db),
    ]);

    const entries = [];

    entries.push(urlEntry('/specs/', '2026-05-20', '0.9'));

    for (const c of countries) {
      entries.push(urlEntry(`/specs/${c.slug}/`, c.updated_at?.split('T')[0] || '2026-05-20', '0.8'));
    }

    for (const d of docs) {
      entries.push(urlEntry(`/specs/${d.country_slug}/${d.doc_slug}`, d.updated_at?.split('T')[0] || '2026-05-20', '0.7'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (err) {
    return new Response(`<!-- Error: ${err.message} -->`, { status: 500, headers: { 'Content-Type': 'application/xml' } });
  }
}
