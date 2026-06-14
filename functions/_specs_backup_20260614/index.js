import { getPublishedCountries } from './_lib/queries.js';
import { renderHub } from './_lib/template.js';

export async function onRequest(context) {
  try {
    const { db, lang } = context.data;
    const countries = await getPublishedCountries(db);
    const html = renderHub(countries, lang);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}
