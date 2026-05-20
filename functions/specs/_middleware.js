export async function onRequest(context) {
  const url = new URL(context.request.url);
  context.data.lang = url.searchParams.get('lang') || 'ko';
  context.data.db = context.env.DB;

  const response = await context.next();
  response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}
