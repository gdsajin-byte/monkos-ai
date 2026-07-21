/**
 * GSC Search Analytics 일배치 수집기
 * - 3일 전 데이터 수집 (GSC 지연 반영)
 * - 차원: page, query, country, device
 * - 원본: SPEC_market_eye_검증호출패턴 §4 GSC Search Analytics
 */

const { google } = require('googleapis');
const { insertRows, getSaKey } = require('./_loader');
const { notify } = require('./_notify');

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:monkos.ai';
const TENANT = 'monkos';

function getTargetDate() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const keyData = getSaKey();
  if (!keyData) {
    await notify('🔴 [MARKET_EYE] collect_gsc: GCP_SA_KEY 미설정');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: keyData,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const targetDate = getTargetDate();

  console.log(`[collect_gsc] 수집 대상일: ${targetDate}`);

  const resp = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: targetDate,
      endDate: targetDate,
      dimensions: ['page', 'query', 'country', 'device'],
      rowLimit: 25000,
    },
  });

  const apiRows = resp.data.rows || [];
  if (apiRows.length === 0) {
    await notify(`⚠️ [MARKET_EYE] collect_gsc: ${targetDate} 데이터 0행`);
    console.warn(`[collect_gsc] ${targetDate} 데이터 없음`);
    return;
  }

  const rows = apiRows.map(r => ({
    date: targetDate,
    tenant: TENANT,
    site: SITE_URL,
    page: r.keys[0],
    query: r.keys[1],
    country: r.keys[2],
    device: r.keys[3],
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    position: r.position || 0,
  }));

  const result = await insertRows('gsc_daily', rows);
  console.log(`[collect_gsc] 완료: ${result.inserted}행`);
}

main().catch(async (err) => {
  console.error(`[collect_gsc] 치명 오류: ${err.message}`);
  await notify(`🔴 [MARKET_EYE] collect_gsc 실패: ${err.message}`);
  process.exit(1);
});
