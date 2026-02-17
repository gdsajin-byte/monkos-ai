// Cloudflare Pages Function — photolab API 프록시
// monk.kr/ai_lab/photolab/api/* → idphoto-kr.monkos.ai/api/*

const TARGET = 'https://idphoto-kr.monkos.ai';

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // /ai_lab/photolab/api/generate → /api/generate
  const url = new URL(request.url);
  const apiPath = url.pathname.replace('/ai_lab/photolab', '');
  const targetUrl = `${TARGET}${apiPath}${url.search}`;

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      },
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
