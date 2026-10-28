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
  // 공유 시크릿 — CF 공용 대역만으로는 타 테넌트 워커 중계를 못 거름 (쌍아 P2-2, 2026-08-24).
  // 오리진은 대역 AND 키 일치를 모두 요구한다. 클라이언트가 보낸 동명 헤더는 위에서 이미 덮임.
  if (env.EDGE_TRUST_KEY) headers.set('X-Monkos-Edge-Key', env.EDGE_TRUST_KEY);

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

/** SSR trackPageView 재현 — 정적 서빙 페이지의 page_view를 오리진 /api/track으로 전달.
 *  issuedSid: 엣지가 이번 응답에서 발급한 monkos_sid (있으면 Cookie에 실어 세션 연속성 유지) */
function firePageView(request, env, ctx, issuedSid = null) {
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
    // 접속망 식별 (2026-10-28 크롤러 출처 확정용 — 오리진은 bot_suspect 로그에만 사용)
    'X-Monkos-Client-ASN': String(request.cf?.asn || ''),
    'X-Monkos-Client-ASOrg': (request.cf?.asOrganization || '').slice(0, 80),
  });
  if (env.EDGE_TRUST_KEY) headers.set('X-Monkos-Edge-Key', env.EDGE_TRUST_KEY); // 신뢰 판정 + page_view 허용 게이트

  const referer = request.headers.get('Referer');
  if (referer) headers.set('Referer', referer);
  let cookie = request.headers.get('Cookie') || '';
  if (issuedSid) cookie = cookie ? `${cookie}; monkos_sid=${issuedSid}` : `monkos_sid=${issuedSid}`;
  if (cookie) headers.set('Cookie', cookie); // 세션 식별용 (오리진 parseSession)
  ctx.waitUntil(fetch(`${env.ORIGIN_URL}/api/track`, { method: 'POST', headers, body: payload }).catch(() => {}));
}

// ─── Phase 2: CMS 표면 엣지 캐시 (2026-08-24) ───────────────────
// SSG 대신 캐시+백그라운드 갱신(SWR) 채택 — Firestore CMS의 "발행 훅 재빌드" 인프라 없이
// 오리진 부하 제거. 정본은 오리진 SSR 단일 유지 (이원화 없음). 발행 반영 ≤ TTL.
// board(고객 글쓰기)·headshot(유료 퍼널)은 실시간성 우선으로 캐시 제외.
const CMS_TTL_MS = 600 * 1000; // 10분
const CMS_EXACT = new Set([
  '/', '/ja', '/en', '/ja/', '/en/',
  '/blog', '/ja/blog', '/en/blog',
  '/faq', '/ja/faq', '/en/faq',
  '/pricing', '/ja/pricing', '/en/pricing',
  '/guide', '/ja/guide', '/en/guide',
  '/guide/ai-photo', '/ja/guide/ai-photo', '/en/guide/ai-photo',
  '/gallery', '/ja/gallery', '/en/gallery',
]);
const CMS_PREFIX = /^\/(?:ja\/|en\/)?blog\//;
const CMS_CACHE_PARAMS = ['lang', 'cat', 'page']; // blog 리스트 실사용 파라미터만 — utm 등은 키에서 제외 (캐시 파편화 방지)

function cmsCacheable(path) {
  return CMS_EXACT.has(path) || CMS_PREFIX.test(path);
}

/**
 * 유효 언어 판정 — 오리진 server.js detectLang 완전 미러 (2026-08-24 쌍아 P1 보정).
 * 접두사 없는 ko 기본 라우트는 monkos_lang 쿠키→Accept-Language로 본문 언어가 갈리므로
 * 이 값이 캐시 키에 반드시 들어가야 한다 (누락 시 언어 오염 — JA 방문자가 / 캐시를 채우면
 * 전 방문자가 10분간 일본어 홈 수신).
 */
function effectiveLang(request, path) {
  const m = path.match(/^\/(ja|en)(\/|$)/);
  if (m) return m[1];
  const cookie = request.headers.get('Cookie') || '';
  const cm = cookie.match(/(?:^|;\s*)monkos_lang=(ko|ja|en|es)(?:;|\s|$)/);
  if (cm) return cm[1];
  const accept = (request.headers.get('Accept-Language') || '').toLowerCase();
  if (accept.startsWith('ja')) return 'ja';
  if (accept.startsWith('en')) return 'en';
  return 'ko';
}

/** 캐시 키: 경로 + 화이트리스트 파라미터 + 유효 언어 (지역·세션 무관 — 서빙 시 지역 재작성) */
function cmsCacheKey(request) {
  const url = new URL(request.url);
  const key = new URL(`https://monkos.ai${url.pathname}`);
  for (const p of CMS_CACHE_PARAMS) {
    const v = url.searchParams.get(p);
    if (v) key.searchParams.set(p, v);
  }
  key.searchParams.set('elang', effectiveLang(request, url.pathname));
  return new Request(key.toString(), { method: 'GET' });
}

/** 오리진 fetch → 200 HTML이면 캐시 저장용 사본 반환 (저장본만 Set-Cookie 제거 — 세션 유출 방지 필수.
 *  클라이언트행 미스 응답에는 오리진 Set-Cookie를 그대로 전달해야 sid 발급이 유지된다 — 쌍아 P2 보정) */
async function fetchAndCacheCms(request, env, key, ctx) {
  const originRes = await fetch(originRequest(request, env));
  const ct = originRes.headers.get('Content-Type') || '';
  if (originRes.status !== 200 || !ct.includes('text/html')) return { res: originRes, html: null, setCookies: [] };
  let setCookies = [];
  if (typeof originRes.headers.getSetCookie === 'function') {
    setCookies = originRes.headers.getSetCookie();
  } else {
    // 런타임에 getSetCookie 부재 시 무음 강등 금지 (쌍아 관찰 2번) — 로그로 가시화하고
    // 단일 헤더 폴백 (다중 Set-Cookie는 유실될 수 있으나 sid 발급은 보존됨)
    console.warn('[edge] Headers.getSetCookie 부재 — 단일 Set-Cookie 폴백 사용. 런타임 호환성 확인 필요');
    const single = originRes.headers.get('Set-Cookie');
    if (single) setCookies = [single];
  }
  const html = await originRes.text();
  const store = new Response(html, {
    headers: {
      'Content-Type': ct,
      'X-Edge-Cached-At': String(Date.now()),
      // 저장본 CC는 캐시 가능이어야 함 — Cache API가 no-store면 저장 자체를 거부 (2026-08-24 실측).
      // 신선도 판정은 X-Edge-Cached-At + CMS_TTL_MS가 정본. 클라이언트 응답은 별도로 no-store.
      'Cache-Control': 'public, max-age=86400',
    },
  });
  ctx.waitUntil(caches.default.put(key, store));
  return { res: null, html, setCookies };
}

async function serveCms(request, env, ctx) {
  const country = request.cf?.country || '';
  const key = cmsCacheKey(request);
  const cached = await caches.default.match(key);
  if (cached) {
    const cachedAt = parseInt(cached.headers.get('X-Edge-Cached-At') || '0', 10);
    if (Date.now() - cachedAt > CMS_TTL_MS) {
      // stale-while-revalidate: 즉시 응답 + 백그라운드 갱신 (오리진 다운 시 스테일이 가용성 방어)
      ctx.waitUntil(fetchAndCacheCms(request, env, key, ctx).catch(() => {}));
    }
    // 히트 = 오리진 미도달 → sid 미발급 상태면 엣지가 오리진 동일 포맷으로 발급 (쌍아 P2 보정:
    // 신규 유입 page_view가 sessionId null로 적재되던 세션 지표 결손 봉합)
    const headers = new Headers({ 'Content-Type': cached.headers.get('Content-Type') || 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Edge-Cache': 'hit' });
    let issuedSid = null;
    if (!/(?:^|;\s*)monkos_sid=/.test(request.headers.get('Cookie') || '')) {
      issuedSid = crypto.randomUUID();
      headers.append('Set-Cookie', `monkos_sid=${issuedSid};Domain=.monkos.ai;Path=/;Max-Age=63072000;SameSite=Lax`);
    }
    firePageView(request, env, ctx, issuedSid); // 계측 대행 — 발급 sid를 실어 세션 연속성 유지
    const html = await cached.text();
    return new Response(rewriteRegion(html, country), { status: 200, headers });
  }
  // 미스: 오리진 서빙 (오리진이 직접 page_view 계측 — 중복 발사 없음.
  // 오리진 Set-Cookie는 클라이언트에 그대로 전달 — 저장본에서만 제거)
  const { res, html, setCookies } = await fetchAndCacheCms(request, env, key, ctx);
  if (html === null) return res;
  const missHeaders = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Edge-Cache': 'miss' });
  for (const c of setCookies) missHeaders.append('Set-Cookie', c);
  return new Response(rewriteRegion(html, country), { status: 200, headers: missHeaders });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 0) 관리형 인증서 갱신(ACME HTTP-01)은 워커를 거치지 않고 존 원 오리진(Cloud Run 도메인 매핑 = Google 프런트)으로.
    //    같은 존 서브리퀘스트는 워커를 재발화하지 않고 DNS 오리진으로 간다. run.app 폴백으로 보내면 404 → 갱신 실패(10-09~, 만료 11-15).
    if (path.startsWith('/.well-known/acme-challenge/')) return fetch(request);

    // 1) 동적 표면은 즉시 오리진 (자산 조회 자체를 건너뜀 — admin 인증 가드·API·SSR 정본 보호)
    const dynamicPrefix = /^\/(api|auth|admin|toss-|crop|tg)\b|^\/(llms\.txt|sitemap\.xml|sitemap-static\.xml|sitemap-blog\.xml)$/;
    if (request.method !== 'GET' && request.method !== 'HEAD') return fetch(originRequest(request, env));
    if (dynamicPrefix.test(path)) return fetch(originRequest(request, env));

    // 1.5) CMS 표면 엣지 캐시 (GET 한정 — HEAD는 오리진)
    if (request.method === 'GET' && cmsCacheable(path)) return serveCms(request, env, ctx);

    // 2) 정적 자산 시도 (specs SSG 산출물 + css/js/images/assets)
    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status !== 404) {
      const ct = assetRes.headers.get('Content-Type') || '';
      if (ct.includes('text/html')) {
        const html = await assetRes.text();
        // 정적 HTML도 오리진 미도달 → sid 무보유 신규 유입에 엣지가 발급 (쌍아 재작업 2026-08-24 —
        // CMS 캐시 히트 분기와 동일 사유: page_view sessionId null 결손 방지)
        const headers = new Headers(assetRes.headers);
        let issuedSid = null;
        if (!/(?:^|;\s*)monkos_sid=/.test(request.headers.get('Cookie') || '')) {
          issuedSid = crypto.randomUUID();
          headers.append('Set-Cookie', `monkos_sid=${issuedSid};Domain=.monkos.ai;Path=/;Max-Age=63072000;SameSite=Lax`);
        }
        firePageView(request, env, ctx, issuedSid);
        return new Response(rewriteRegion(html, request.cf?.country || ''), {
          status: assetRes.status,
          headers,
        });
      }
      return assetRes;
    }

    // 3) 오리진 폴백 (구슬러그 301·404·blog·home 등 전부)
    return fetch(originRequest(request, env));
  },
};
