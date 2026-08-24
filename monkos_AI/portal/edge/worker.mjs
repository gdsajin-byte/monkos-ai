/**
 * monkos-portal-edge — monkos.ai 엣지 라우터 (2026-08-24)
 *
 * 구조 (REPORT_20260824 스코프 §2):
 *   1) specs 정적 자산(SSG 산출물) 우선 서빙 — HTML엔 지역 재작성 + page_view 계측
 *   2) 그 외 전부 Cloud Run 오리진 폴백 (API·auth·admin·blog·home·구슬러그 301·404)
 *
 * 원칙:
 *   - 렌더 로직 없음 — 정적본은 SSG(tools/specs-ssg)가 render-specs.js 정본을 캡처한 것
 *   - 오리진 폴백이 안전망: 자산 미스 = 오리진이 응답 (신규 spec 추가 직후 공백 흡수)
 *   - 실클라이언트 정보는 X-Monkos-Client-IP/Country로 전달 — 오리진 edge-trust.js가
 *     피어 CF 대역 검증 후에만 신뢰 (스푸핑 무효)
 */

// 오리진 정본: wrangler.toml [vars] ORIGIN_URL (ch2 7조 — 하드코딩 금지)

// 오리진으로 전달하지 않을 hop-by-hop 헤더
const HOP_HEADERS = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'expect'];

function originRequest(request, env) {
  const url = new URL(request.url);
  const originUrl = new URL(env.ORIGIN_URL);
  url.protocol = originUrl.protocol;
  url.host = originUrl.host;

  const headers = new Headers(request.headers);
  for (const h of HOP_HEADERS) headers.delete(h);
  // 실클라이언트 복원 정보 (오리진 edge-trust.js 소비)
  headers.set('X-Monkos-Client-IP', request.headers.get('CF-Connecting-IP') || '');
  headers.set('X-Monkos-Client-Country', request.cf?.country || '');
  headers.set('X-Forwarded-Host', new URL(request.url).host);

  return new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual', // 오리진 301/302를 그대로 클라이언트에 전달 (구슬러그 301·OAuth 필수)
  });
}

/** 정적 HTML의 지역 값을 요청 국가로 재작성 (SSR과 동일 동작 재현: server.js detectPaymentRegion) */
function rewriteRegion(html, country) {
  const region = country === 'KR' ? 'kr' : 'global';
  return html.replace(/window\.__REGION__='(kr|global)'/, `window.__REGION__='${region}'`);
}

/** SSR trackPageView 재현 — 정적 서빙 페이지의 page_view를 오리진 /api/track으로 전달 */
function firePageView(request, env, ctx) {
  const url = new URL(request.url);
  const utm = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = url.searchParams.get(k);
    if (v) utm[k] = v;
  }
  const langMatch = url.pathname.match(/^\/(en|ja|es|id|vi)\//);
  const country = request.cf?.country || '';
  const payload = JSON.stringify({
    events: [{
      event_name: 'page_view',
      user_id: null,
      page_path: url.pathname,
      lang: langMatch ? langMatch[1] : 'ko',
      region: country === 'KR' ? 'kr' : 'global',
      service: 'portal',
      params: Object.keys(utm).length ? utm : {},
    }],
  });
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Monkos-Client-IP': request.headers.get('CF-Connecting-IP') || '',
    'X-Monkos-Client-Country': country,
    'User-Agent': request.headers.get('User-Agent') || '',
  });
  const referer = request.headers.get('Referer');
  if (referer) headers.set('Referer', referer);
  const cookie = request.headers.get('Cookie');
  if (cookie) headers.set('Cookie', cookie); // 세션 식별용 (오리진 parseSession)
  ctx.waitUntil(fetch(`${env.ORIGIN_URL}/api/track`, { method: 'POST', headers, body: payload }).catch(() => {}));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1) 동적 표면은 즉시 오리진 (자산 조회 자체를 건너뜀 — admin 인증 가드·API·SSR 정본 보호)
    const dynamicPrefix = /^\/(api|auth|admin|toss-|crop|tg)\b|^\/(llms\.txt|sitemap\.xml|sitemap-static\.xml|sitemap-blog\.xml)$/;
    if (request.method !== 'GET' && request.method !== 'HEAD') return fetch(originRequest(request, env));
    if (dynamicPrefix.test(path)) return fetch(originRequest(request, env));

    // 2) 정적 자산 시도 (specs SSG 산출물 + css/js/images/assets)
    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status !== 404) {
      const ct = assetRes.headers.get('Content-Type') || '';
      if (ct.includes('text/html')) {
        const html = await assetRes.text();
        firePageView(request, env, ctx);
        return new Response(rewriteRegion(html, request.cf?.country || ''), {
          status: assetRes.status,
          headers: assetRes.headers,
        });
      }
      return assetRes;
    }

    // 3) 오리진 폴백 (구슬러그 301·404·blog·home 등 전부)
    return fetch(originRequest(request, env));
  },
};
