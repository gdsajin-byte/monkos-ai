/**
 * 키워드 월배치 수집기
 * - Google Ads 키워드 플래너: 7개국 키워드셋 조회
 * - 네이버 SearchAd: KR 키워드셋 조회
 * - 원본: ads.sh keyword_ideas + seo_collectors.py fetch_naver_searchad 포팅
 * - ⚠️ SearchAd hint 5개 상한: 배치 분할 필수
 */

const crypto = require('crypto');
const { insertRows } = require('./_loader');
const { notify } = require('./_notify');
const keywordSets = require('./keyword_sets.json');

const TENANT = 'monkos';

function getMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// --- Google Ads 키워드 플래너 ---

const ADS_API_VERSION = 'v21';
const ADS_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

async function getAdsAccessToken() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
  if (!clientId || !clientSecret || !refreshToken) return null;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await resp.json();
  return data.access_token || null;
}

async function fetchAdsKeywords(accessToken, keywords, langId, geoId) {
  const devToken = process.env.GOOGLE_ADS_DEV_TOKEN || '';
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '';
  if (!devToken || !customerId) return [];

  const resp = await fetch(`${ADS_BASE}/customers/${customerId}:generateKeywordIdeas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'login-customer-id': customerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keywordSeed: { keywords },
      language: `languageConstants/${langId}`,
      geoTargetConstants: [`geoTargetConstants/${geoId}`],
      keywordPlanNetwork: 'GOOGLE_SEARCH',
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[collect_keywords] Ads API ${resp.status}: ${errText.slice(0, 200)}`);
    return [];
  }

  const data = await resp.json();
  return data.results || [];
}

async function collectGooglePlanner(accessToken, dateStr) {
  const rows = [];

  for (const set of keywordSets.google_planner) {
    console.log(`[collect_keywords] Google Planner: ${set.geo_code} (${set.lang_code})`);
    const results = await fetchAdsKeywords(accessToken, set.keywords, set.lang, set.geo);

    for (const r of results) {
      const m = r.keywordIdeaMetrics || {};
      rows.push({
        date: dateStr,
        tenant: TENANT,
        keyword: r.text || '',
        lang: set.lang_code,
        geo: set.geo_code,
        monthly_searches: parseInt(m.avgMonthlySearches, 10) || 0,
        competition: m.competition || '',
        cpc_low: m.lowTopOfPageBidMicros ? Math.round(parseInt(m.lowTopOfPageBidMicros, 10) / 1000000) : 0,
        cpc_high: m.highTopOfPageBidMicros ? Math.round(parseInt(m.highTopOfPageBidMicros, 10) / 1000000) : 0,
        source: 'google_planner',
      });
    }
  }

  return rows;
}

// --- 네이버 SearchAd ---

async function fetchNaverSearchAd(batch) {
  const apiKey = process.env.NAVER_SEARCHAD_API_KEY || '';
  const secretKey = process.env.NAVER_SEARCHAD_SECRET_KEY || '';
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID || '';
  if (!apiKey || !secretKey || !customerId) return [];

  const uri = '/keywordstool';
  const method = 'GET';
  const timestamp = String(Date.now());
  const signStr = `${timestamp}.${method}.${uri}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(signStr)
    .digest('base64');

  const params = new URLSearchParams({
    hintKeywords: batch.map(kw => kw.replace(/ /g, '')).join(','),
    showDetail: '1',
  });

  const resp = await fetch(`https://api.searchad.naver.com${uri}?${params}`, {
    headers: {
      'X-Timestamp': timestamp,
      'X-API-KEY': apiKey,
      'X-Customer': customerId,
      'X-Signature': signature,
    },
  });

  if (!resp.ok) {
    console.error(`[collect_keywords] SearchAd ${resp.status}`);
    return [];
  }

  const data = await resp.json();
  if (!data.keywordList || data.keywordList.length === 0) {
    console.warn(`[collect_keywords] SearchAd 빈 응답 — batch: ${batch}`);
  }
  return data.keywordList || [];
}

async function collectNaverSearchAd(dateStr) {
  const rows = [];
  const matchSet = new Set();
  for (const batch of keywordSets.naver_searchad) {
    for (const kw of batch) matchSet.add(kw.replace(/ /g, ''));
  }
  const seen = new Set();

  for (const batch of keywordSets.naver_searchad) {
    if (batch.length > 5) {
      await notify(`⚠️ [MARKET_EYE] SearchAd batch ${batch.length}개 > 5개 상한! 분할 필요`);
    }
    const items = await fetchNaverSearchAd(batch);

    for (const item of items) {
      const norm = (item.relKeyword || '').replace(/ /g, '');
      if (!matchSet.has(norm) || seen.has(norm)) continue;
      seen.add(norm);

      rows.push({
        date: dateStr,
        tenant: TENANT,
        keyword: item.relKeyword,
        pc_searches: item.monthlyPcQcCnt || 0,
        mobile_searches: item.monthlyMobileQcCnt || 0,
        pc_clicks: item.monthlyAvePcClkCnt || 0,
        mobile_clicks: item.monthlyAveMobileClkCnt || 0,
        competition: item.compIdx || '',
      });
    }
  }

  return rows;
}

// --- 메인 ---

async function main() {
  const dateStr = getMonthStart();
  console.log(`[collect_keywords] 수집 기준월: ${dateStr}`);

  // Google Ads 키워드 플래너
  const accessToken = await getAdsAccessToken();
  let adsRows = [];
  if (accessToken) {
    adsRows = await collectGooglePlanner(accessToken, dateStr);
    console.log(`[collect_keywords] Google Planner: ${adsRows.length}행`);
  } else {
    console.warn('[collect_keywords] Google Ads 시크릿 미설정 — 플래너 생략');
  }

  if (adsRows.length > 0) {
    await insertRows('ads_keyword_monthly', adsRows);
  }

  // 네이버 SearchAd
  const naverRows = await collectNaverSearchAd(dateStr);
  console.log(`[collect_keywords] 네이버 SearchAd: ${naverRows.length}행`);

  if (naverRows.length > 0) {
    await insertRows('naver_searchad_monthly', naverRows);
  }

  if (adsRows.length === 0 && naverRows.length === 0) {
    await notify('⚠️ [MARKET_EYE] collect_keywords: Ads + SearchAd 모두 0행');
  }

  console.log(`[collect_keywords] 완료 — Ads: ${adsRows.length}행, SearchAd: ${naverRows.length}행`);
}

main().catch(async (err) => {
  console.error(`[collect_keywords] 치명 오류: ${err.message}`);
  await notify(`🔴 [MARKET_EYE] collect_keywords 실패: ${err.message}`);
  process.exit(1);
});
