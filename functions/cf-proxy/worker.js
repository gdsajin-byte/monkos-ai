// CF Workers proxy — monkos.ai CF→CR 프록시
// Pages Advanced Mode (_worker.js)로 배포 시 env.ASSETS 바인딩 사용
// env.ASSETS.fetch()는 미매칭 시 SPA 폴백(root index.html)을 반환하므로
// 정적 자산 경로만 ASSETS에 위임하고 나머지는 CR 직행

const CR_ORIGIN = 'https://monkos-portal-4jeplpqpua-uc.a.run.app';

// /specs/·/idpass/는 CR SSR 경로 — Pages SPA 폴백이 가리므로 제외. SSG 전환 후 복원
const STATIC_PREFIXES = ['/css/', '/js/', '/assets/', '/images/'];

function isStaticPath(pathname) {
  if (pathname === '/' || pathname === '/index.html') return true;
  return STATIC_PREFIXES.some(p => pathname.startsWith(p));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/_proxy/health') {
      return new Response(JSON.stringify({
        ok: true,
        mode: env.ASSETS ? 'pages-advanced' : 'standalone',
        origin: CR_ORIGIN,
        ts: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 정적 자산 경로만 Pages에 위임
    if (env.ASSETS && isStaticPath(url.pathname)) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status < 400) {
          return assetResponse;
        }
      } catch {
        // 폴스루
      }
    }

    // CR origin 프록시
    const clientIP = request.headers.get('CF-Connecting-IP') || '';
    const proxyUrl = new URL(url.pathname + url.search, CR_ORIGIN);

    const headers = new Headers(request.headers);
    headers.set('X-Real-IP', clientIP);
    headers.set('Host', new URL(CR_ORIGIN).hostname);

    if (env.WORKER_PROXY_SECRET) {
      headers.set('X-Proxy-Secret', env.WORKER_PROXY_SECRET);
    }

    headers.delete('CF-Connecting-IP');
    headers.delete('CF-IPCountry');
    headers.delete('CF-RAY');
    headers.delete('CF-Visitor');

    const crResponse = await fetch(proxyUrl.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(crResponse.headers);
    responseHeaders.set('X-Served-By', 'cf-proxy');

    return new Response(crResponse.body, {
      status: crResponse.status,
      statusText: crResponse.statusText,
      headers: responseHeaders,
    });
  },
};
