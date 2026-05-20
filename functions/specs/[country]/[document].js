import { getDocumentDetail } from '../_lib/queries.js';
import { renderDetail, render404 } from '../_lib/template.js';

export async function onRequest(context) {
  try {
    const { db, lang } = context.data;
    const { country: countrySlug, document: docSlug } = context.params;
    const result = await getDocumentDetail(db, countrySlug, docSlug);

    if (!result) {
      return new Response(render404(lang), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const html = renderDetail(result, lang);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}
