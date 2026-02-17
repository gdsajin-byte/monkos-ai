// Cloudflare Pages Function — idphoto API 프록시
// monk.kr/api/idphoto/* → idphoto-kr.monkos.ai/api/*

const TARGET = 'https://idphoto-kr.monkos.ai';

async function proxy(request) {
  // /api/idphoto/generate → /api/generate
  const url = new URL(request.url);
  const apiPath = url.pathname.replace('/api/idphoto', '/api');
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

// POST
export async function onRequestPost(context) {
  return proxy(context.request);
}

// GET
export async function onRequestGet(context) {
  return proxy(context.request);
}

// OPTIONS (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
