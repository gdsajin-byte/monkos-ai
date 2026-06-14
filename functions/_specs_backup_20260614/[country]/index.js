import { getCountryWithDocuments } from '../_lib/queries.js';
import { renderCountryHub, render404 } from '../_lib/template.js';

export async function onRequest(context) {
  try {
    const { db, lang } = context.data;
    const countrySlug = context.params.country;
    const result = await getCountryWithDocuments(db, countrySlug);

    if (!result) {
      return new Response(render404(lang), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const html = renderCountryHub(result.country, result.documents, lang);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}
