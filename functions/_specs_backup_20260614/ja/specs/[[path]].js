import { getPublishedCountries, getCountryWithDocuments, getDocumentDetail, getAllPublishedDocuments, getAllPublishedCountrySlugs } from '../../specs/_lib/queries.js';
import { renderHub, renderCountryHub, renderDetail, render404, htmlShell } from '../../specs/_lib/template.js';

const LANG = 'ja';

export async function onRequest(context) {
  const db = context.env.DB;
  const segments = (context.params.path || []).filter(s => s);

  try {
    if (segments.length === 0) {
      const countries = await getPublishedCountries(db);
      return respond(renderHub(countries, LANG));
    }

    if (segments[0] === 'sitemap.xml') {
      return sitemapResponse(db);
    }

    if (segments.length === 1) {
      const result = await getCountryWithDocuments(db, segments[0]);
      if (!result) return respond(render404(LANG), 404);
      return respond(renderCountryHub(result.country, result.documents, LANG));
    }

    if (segments.length === 2) {
      const result = await getDocumentDetail(db, segments[0], segments[1]);
      if (!result) return respond(render404(LANG), 404);
      return respond(renderDetail(result, LANG));
    }

    return respond(render404(LANG), 404);
  } catch (err) {
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}

function respond(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}

async function sitemapResponse(db) {
  const DOMAIN = 'https://monk.kr';
  const [docs, countries] = await Promise.all([
    getAllPublishedDocuments(db),
    getAllPublishedCountrySlugs(db),
  ]);

  const entries = [`  <url><loc>${DOMAIN}/ja/specs/</loc></url>`];
  for (const c of countries) entries.push(`  <url><loc>${DOMAIN}/ja/specs/${c.slug}/</loc></url>`);
  for (const d of docs) entries.push(`  <url><loc>${DOMAIN}/ja/specs/${d.country_slug}/${d.doc_slug}</loc></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
