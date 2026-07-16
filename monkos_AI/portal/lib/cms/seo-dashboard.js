import { log } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'node:crypto';

function memCache(ttlMs) {
  let data = null, ts = 0;
  return {
    get() { return (data && Date.now() - ts < ttlMs) ? data : null; },
    set(v) { data = v; ts = Date.now(); },
  };
}

const gscCache = memCache(3600000);
const naverCache = memCache(21600000);
const bingCache = memCache(21600000);
const perfCache = memCache(86400000);

function daysAgoISO(n) {
  var d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// === GSC ===

let gscAuth = null;
function getGscAuth() {
  if (!gscAuth) {
    gscAuth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  }
  return gscAuth;
}

async function fetchGsc(days, rowLimit) {
  const client = await getGscAuth().getClient();
  const { token } = await client.getAccessToken();
  const startDate = daysAgoISO(days);
  const endDate = daysAgoISO(1);

  async function query(dimensions) {
    const r = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Amonkos.ai/searchAnalytics/query', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
    });
    if (!r.ok) throw new Error(`GSC ${r.status}: ${await r.text()}`);
    return (await r.json()).rows || [];
  }

  const [kwRows, pgRows] = await Promise.all([query(['query']), query(['page'])]);
  return {
    keywords: kwRows.map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr * 100).toFixed(1), position: +r.position.toFixed(1) })),
    pages: pgRows.map(r => ({ page: r.keys[0].replace('https://monkos.ai', ''), clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr * 100).toFixed(1), position: +r.position.toFixed(1) })),
    period: { start: startDate, end: endDate },
  };
}

export async function handleDashboardGsc(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const cached = gscCache.get();
  if (cached) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cached)); }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    const rowLimit = parseInt(url.searchParams.get('rowLimit') || '30', 10);
    const result = await fetchGsc(days, rowLimit);
    gscCache.set(result);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Dashboard] GSC 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === Naver ===

async function fetchNaverSearchAd(keywords) {
  const apiKey = process.env.NAVER_SEARCHAD_API_KEY || '';
  const secretKey = process.env.NAVER_SEARCHAD_SECRET_KEY || '';
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID || '';
  if (!apiKey || !secretKey || !customerId) return null;

  const timestamp = String(Date.now());
  const method = 'GET';
  const uri = '/keywordstool';
  const signStr = `${timestamp}.${method}.${uri}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signStr).digest('base64');

  const params = new URLSearchParams({ hintKeywords: keywords.join(','), showDetail: '1' });
  const r = await fetch(`https://api.searchad.naver.com${uri}?${params}`, {
    headers: { 'X-Timestamp': timestamp, 'X-API-KEY': apiKey, 'X-Customer': customerId, 'X-Signature': signature },
  });
  if (!r.ok) throw new Error(`Naver SearchAd ${r.status}`);
  const data = await r.json();
  return (data.keywordList || [])
    .filter(it => keywords.includes(it.relKeyword))
    .map(it => ({
      keyword: it.relKeyword,
      pcSearch: it.monthlyPcQcCnt || 0,
      mobileSearch: it.monthlyMobileQcCnt || 0,
      totalSearch: (it.monthlyPcQcCnt || 0) + (it.monthlyMobileQcCnt || 0),
      competition: it.compIdx || '',
    }));
}

async function fetchNaverDataLab(keywords) {
  const clientId = process.env.NAVER_DATALAB_CLIENT_ID || '';
  const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) return null;

  const endDate = new Date().toISOString().slice(0, 10);
  const sd = new Date(); sd.setDate(sd.getDate() - 30);
  const startDate = sd.toISOString().slice(0, 10);

  const r = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate, endDate, timeUnit: 'week',
      keywordGroups: keywords.slice(0, 5).map(kw => ({ groupName: kw, keywords: [kw] })),
    }),
  });
  if (!r.ok) throw new Error(`Naver DataLab ${r.status}`);
  const data = await r.json();
  return (data.results || []).map(g => {
    const periods = g.data || [];
    return { keyword: g.title, trend: periods.map(p => ({ date: p.period, ratio: p.ratio })) };
  });
}

export async function handleDashboardNaver(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const cached = naverCache.get();
  if (cached) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cached)); }

  const keywords = ['증명사진', 'AI 증명사진', '여권사진', '취업사진', '취업사진 안경'];
  try {
    const [searchAd, dataLab] = await Promise.all([
      fetchNaverSearchAd(keywords).catch((e) => { log(`[Dashboard] Naver SearchAd 실패: ${e.message}`, 'WARNING'); return null; }),
      fetchNaverDataLab(keywords).catch((e) => { log(`[Dashboard] Naver DataLab 실패: ${e.message}`, 'WARNING'); return null; }),
    ]);
    const result = { searchAd, dataLab };
    // 부분 실패는 캐시하지 않음 — 일시 오류가 6h 고착되는 것 방지 (2026-07-16 민아 검증)
    if (searchAd && dataLab) naverCache.set(result);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Dashboard] Naver 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === Bing WMT ===

async function fetchBing() {
  const apiKey = process.env.BING_WMT_API_KEY || '';
  if (!apiKey) return null;

  const base = 'https://ssl.bing.com/webmaster/api.svc/json';
  const site = 'https://monkos.ai/';

  const [statsR, linksR] = await Promise.all([
    fetch(`${base}/GetQueryStats?apikey=${encodeURIComponent(apiKey)}&siteUrl=${encodeURIComponent(site)}`),
    fetch(`${base}/GetLinkCounts?apikey=${encodeURIComponent(apiKey)}&siteUrl=${encodeURIComponent(site)}`),
  ]);

  let queries = [];
  if (statsR.ok) {
    const stats = (await statsR.json()).d || [];
    queries = stats.sort((a, b) => (b.Impressions || 0) - (a.Impressions || 0)).slice(0, 10)
      .map(q => ({ query: q.Query || '', impressions: q.Impressions || 0, clicks: q.Clicks || 0, position: q.AvgImpressionPosition || 0 }));
  }

  let links = {};
  if (linksR.ok) { links = (await linksR.json()).d || {}; }

  return { queries, links };
}

export async function handleDashboardBing(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const cached = bingCache.get();
  if (cached) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cached)); }

  try {
    const result = await fetchBing();
    if (result) bingCache.set(result);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result || { queries: [], links: {} }));
  } catch (err) {
    log(`[Dashboard] Bing 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === PageSpeed ===

async function fetchPageSpeed() {
  const urls = ['https://monkos.ai/', 'https://monkos.ai/specs/passport/kr', 'https://monkos.ai/en/specs/passport/us'];
  const results = [];

  for (const url of urls) {
    for (const strategy of ['mobile', 'desktop']) {
      try {
        const params = new URLSearchParams({ url, strategy, category: 'performance' });
        const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
        if (!r.ok) continue;
        const data = await r.json();
        const lh = data.lighthouseResult || {};
        const audits = lh.audits || {};
        const score = (lh.categories?.performance?.score || 0) * 100;
        results.push({
          url: url.replace('https://monkos.ai', '') || '/',
          strategy,
          score: Math.round(score),
          lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
          cls: +(audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3),
          ttfb: Math.round(audits['server-response-time']?.numericValue || 0),
        });
      } catch { /* skip */ }
    }
  }
  return results;
}

export async function handleDashboardPerformance(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const cached = perfCache.get();
  if (cached) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cached)); }

  try {
    const result = await fetchPageSpeed();
    // 빈 결과는 캐시하지 않음 — 쿼터·일시 실패가 24h 고착되는 것 방지 (2026-07-16 민아 검증)
    if (result.length) perfCache.set(result);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Dashboard] PageSpeed 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
