/**
 * GA4 Data API 일배치 수집기
 * - 결측 백필 모드(기본): 최근 10일(KST 오늘-2일까지 — 처리 지연 중인 부분 집계를 영구 적재하지 않게) 중
 *   테이블에 없는 날짜만 수집. 테이블별 독립 판정 (ORDER_20261006 W1)
 * - 1회성 장기 백필: `node collect_ga4.js --since 2026-07-01` (또는 BACKFILL_SINCE)
 * - ga4_daily: 차원 sessionDefaultChannelGrouping / sessionSourceMedium + 전환 이벤트 (기존 형식 유지)
 * - ga4_daily_dims: country × hostName × landingPage(언어 접두 제거 1단) × sessionSource (W3 — 봇·비운영 호스트 판독)
 * - 원본: seo_collectors.py fetch_ga4_extended 포팅
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { insertRows, getAuthOptions, getMissingDates, resolveWindow } = require('./_loader');
const { notify } = require('./_notify');

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '';
const TENANT = 'monkos';
const LOOKBACK_DAYS = 10;
const LAG_DAYS = 2;
// 언어 접두 — specs URL 정본(ko 무접두, en/ja/es 접두) 기준 + 예비 2종. /kr·/jp는 포털 페이지라 접두로 보지 않는다
const LANG_PREFIXES = new Set(['en', 'ja', 'es', 'zh', 'ko']);

function normalizeLanding(path) {
  if (!path || path === '(not set)') return path || '';
  const segs = path.split('?')[0].split('/').filter(Boolean);
  if (segs.length && LANG_PREFIXES.has(segs[0].toLowerCase())) segs.shift();
  return segs.length ? `/${segs[0]}` : '/';
}

async function runAll(client, request) {
  const rows = [];
  const limit = 100000;
  for (let offset = 0; ; offset += limit) {
    const [resp] = await client.runReport({ ...request, limit, offset });
    rows.push(...(resp.rows || []));
    if (!resp.rowCount || offset + limit >= resp.rowCount) break;
  }
  return rows;
}

async function collectDaily(client, targetDate) {
  const property = `properties/${GA4_PROPERTY_ID}`;
  const dateRanges = [{ startDate: targetDate, endDate: targetDate }];
  const metricsConfig = [
    { name: 'sessions' },
    { name: 'totalUsers' },
    { name: 'newUsers' },
    { name: 'bounceRate' },
    { name: 'averageSessionDuration' },
  ];

  // 채널 그룹 리포트 (sessionDefaultChannelGrouping 단독 — sessionSourceMedium과 비호환)
  const [channelResp] = await client.runReport({
    property, dateRanges,
    dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
    metrics: metricsConfig,
  });

  // 소스/매체 리포트 (별도 요청)
  const [smResp] = await client.runReport({
    property, dateRanges,
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: metricsConfig,
  });

  // 전환 이벤트 리포트
  const [convResp] = await client.runReport({
    property, dateRanges,
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
  });

  const convMap = {};
  for (const row of convResp.rows || []) {
    convMap[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value, 10) || 0;
  }

  function parseMetrics(r) {
    return {
      sessions: parseInt(r.metricValues[0].value, 10) || 0,
      users: parseInt(r.metricValues[1].value, 10) || 0,
      new_users: parseInt(r.metricValues[2].value, 10) || 0,
      bounce_rate: parseFloat(r.metricValues[3].value) || 0,
      avg_duration: parseFloat(r.metricValues[4].value) || 0,
      conv_free: convMap['free_generation_complete'] || 0,
      conv_signup: convMap['sign_up'] || 0,
      conv_purchase: convMap['purchase'] || 0,
    };
  }

  const rows = [];
  for (const r of channelResp.rows || []) {
    rows.push({ date: targetDate, tenant: TENANT, channel: r.dimensionValues[0].value, source_medium: '', ...parseMetrics(r) });
  }
  for (const r of smResp.rows || []) {
    rows.push({ date: targetDate, tenant: TENANT, channel: '', source_medium: r.dimensionValues[0].value, ...parseMetrics(r) });
  }
  return rows;
}

async function collectDims(client, targetDate) {
  const apiRows = await runAll(client, {
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: targetDate, endDate: targetDate }],
    dimensions: [{ name: 'country' }, { name: 'hostName' }, { name: 'landingPage' }, { name: 'sessionSource' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'engagedSessions' },
      { name: 'averageSessionDuration' },
    ],
  });

  // 랜딩 정규화 후 재집계 — 체류시간은 세션 가중 평균
  const agg = new Map();
  for (const r of apiRows) {
    const [country, host, landing, source] = r.dimensionValues.map(v => v.value);
    const key = [country, host, normalizeLanding(landing), source].join('\u0001');
    const sessions = parseInt(r.metricValues[1].value, 10) || 0;
    const cur = agg.get(key) || { active_users: 0, sessions: 0, engaged_sessions: 0, dur_x_sess: 0 };
    cur.active_users += parseInt(r.metricValues[0].value, 10) || 0;
    cur.sessions += sessions;
    cur.engaged_sessions += parseInt(r.metricValues[2].value, 10) || 0;
    cur.dur_x_sess += (parseFloat(r.metricValues[3].value) || 0) * sessions;
    agg.set(key, cur);
  }

  const rows = [];
  for (const [key, v] of agg) {
    const [country, host, landing, source] = key.split('\u0001');
    rows.push({
      date: targetDate, tenant: TENANT, country, host, landing, source,
      active_users: v.active_users,
      sessions: v.sessions,
      engaged_sessions: v.engaged_sessions,
      avg_duration: v.sessions ? v.dur_x_sess / v.sessions : 0,
    });
  }
  return rows;
}

async function backfill(table, client, collector, start, end) {
  const missing = await getMissingDates(table, start, end, TENANT);
  console.log(`[collect_ga4] ${table} 결측 ${missing.length}일: ${missing.join(' ') || '없음'}`);
  const empty = [];
  let total = 0;
  for (const d of missing) {
    const rows = await collector(client, d);
    if (rows.length === 0) {
      empty.push(d);
      console.warn(`[collect_ga4] ${table} ${d} API 0행 — 다음 실행에서 재시도`);
      continue;
    }
    const result = await insertRows(table, rows);
    total += result.inserted;
    console.log(`[collect_ga4] ${table} ${d}: ${result.inserted}행`);
  }
  if (empty.length > 0) {
    await notify(`⚠️ [MARKET_EYE] collect_ga4 ${table}: API 0행 ${empty.length}일 (${empty.join(', ')}) — 미적재, 창 안에서 재시도`);
  }
  console.log(`[collect_ga4] ${table} 완료: ${missing.length - empty.length}일 ${total}행 / 0행 ${empty.length}일`);
}

async function main() {
  const authOpts = getAuthOptions();
  if (!authOpts) {
    await notify('🔴 [MARKET_EYE] collect_ga4: GCP_SA_KEY 미설정 (로컬은 GOOGLE_APPLICATION_CREDENTIALS)');
    process.exit(1);
  }
  if (!GA4_PROPERTY_ID) {
    await notify('🔴 [MARKET_EYE] collect_ga4: GA4_PROPERTY_ID 미설정');
    process.exit(1);
  }

  const client = new BetaAnalyticsDataClient(authOpts.credentials ? { credentials: authOpts.credentials } : {});
  const { start, end, mode } = resolveWindow(LOOKBACK_DAYS, LAG_DAYS);
  console.log(`[collect_ga4] 인증=${authOpts.mode} 창=${start}~${end} (${mode})`);

  await backfill('ga4_daily', client, collectDaily, start, end);
  await backfill('ga4_daily_dims', client, collectDims, start, end);
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error(`[collect_ga4] 치명 오류: ${err.message}`);
    await notify(`🔴 [MARKET_EYE] collect_ga4 실패: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { normalizeLanding };
