/**
 * GA4 Data API 일배치 수집기
 * - 전일 데이터 수집
 * - 차원: sessionDefaultChannelGrouping, sessionSourceMedium
 * - 원본: seo_collectors.py fetch_ga4_extended 포팅
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { insertRows, getSaKey } = require('./_loader');
const { notify } = require('./_notify');

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '';
const TENANT = 'monkos';

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const keyData = getSaKey();
  if (!keyData) {
    await notify('🔴 [MARKET_EYE] collect_ga4: GCP_SA_KEY 미설정');
    process.exit(1);
  }
  if (!GA4_PROPERTY_ID) {
    await notify('🔴 [MARKET_EYE] collect_ga4: GA4_PROPERTY_ID 미설정');
    process.exit(1);
  }

  const client = new BetaAnalyticsDataClient({ credentials: keyData });
  const targetDate = getYesterday();
  console.log(`[collect_ga4] 수집 대상일: ${targetDate}`);

  const metricsConfig = [
    { name: 'sessions' },
    { name: 'totalUsers' },
    { name: 'newUsers' },
    { name: 'bounceRate' },
    { name: 'averageSessionDuration' },
  ];

  // 채널 그룹 리포트 (sessionDefaultChannelGrouping 단독 — sessionSourceMedium과 비호환)
  const [channelResp] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: targetDate, endDate: targetDate }],
    dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
    metrics: metricsConfig,
  });

  // 소스/매체 리포트 (별도 요청)
  const [smResp] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: targetDate, endDate: targetDate }],
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: metricsConfig,
  });

  // 전환 이벤트 리포트
  const [convResp] = await client.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate: targetDate, endDate: targetDate }],
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
    rows.push({
      date: targetDate,
      tenant: TENANT,
      channel: r.dimensionValues[0].value,
      source_medium: '',
      ...parseMetrics(r),
    });
  }
  for (const r of smResp.rows || []) {
    rows.push({
      date: targetDate,
      tenant: TENANT,
      channel: '',
      source_medium: r.dimensionValues[0].value,
      ...parseMetrics(r),
    });
  }

  if (rows.length === 0) {
    await notify(`⚠️ [MARKET_EYE] collect_ga4: ${targetDate} 데이터 0행`);
    console.warn(`[collect_ga4] ${targetDate} 데이터 없음`);
    return;
  }

  const result = await insertRows('ga4_daily', rows);
  console.log(`[collect_ga4] 완료: ${result.inserted}행`);
}

main().catch(async (err) => {
  console.error(`[collect_ga4] 치명 오류: ${err.message}`);
  await notify(`🔴 [MARKET_EYE] collect_ga4 실패: ${err.message}`);
  process.exit(1);
});
