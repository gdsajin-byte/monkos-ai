/**
 * GSC Search Analytics 일배치 수집기
 * - 결측 백필 모드(기본): 최근 14일(KST 오늘-3일까지, GSC 지연 반영) 중 gsc_daily에 없는 날짜만 수집
 *   → GitHub 예약 실행이 지연·누락돼도 다음 실행이 빈 날을 메운다 (ORDER_20261006 W1)
 * - 1회성 장기 백필: `node collect_gsc.js --since 2026-07-01` (또는 BACKFILL_SINCE). GSC API 보존 한계 16개월
 * - 같은 날짜 재적재 금지: 적재 전 테이블 존재 여부 조회(_loader.getMissingDates)
 * - 차원: page, query, country, device
 * - 원본: SPEC_market_eye_검증호출패턴 §4 GSC Search Analytics
 */

const { google } = require('googleapis');
const { insertRows, getAuthOptions, getMissingDates, resolveWindow } = require('./_loader');
const { notify } = require('./_notify');

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:monkos.ai';
const TENANT = 'monkos';
const LOOKBACK_DAYS = 14;
const LAG_DAYS = 3;
const PAGE_SIZE = 25000;

async function fetchDay(searchconsole, targetDate) {
  const apiRows = [];
  for (let startRow = 0; ; startRow += PAGE_SIZE) {
    const resp = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: targetDate,
        endDate: targetDate,
        dimensions: ['page', 'query', 'country', 'device'],
        rowLimit: PAGE_SIZE,
        startRow,
      },
    });
    const page = resp.data.rows || [];
    apiRows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return apiRows.map(r => ({
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
}

async function main() {
  const authOpts = getAuthOptions();
  if (!authOpts) {
    await notify('🔴 [MARKET_EYE] collect_gsc: GCP_SA_KEY 미설정 (로컬은 GOOGLE_APPLICATION_CREDENTIALS)');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    ...(authOpts.credentials ? { credentials: authOpts.credentials } : {}),
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const { start, end, mode } = resolveWindow(LOOKBACK_DAYS, LAG_DAYS);
  const missing = await getMissingDates('gsc_daily', start, end, TENANT);
  console.log(`[collect_gsc] 인증=${authOpts.mode} 창=${start}~${end} (${mode}) 결측 ${missing.length}일: ${missing.join(' ') || '없음'}`);

  const empty = [];
  let total = 0;
  for (const d of missing) {
    const rows = await fetchDay(searchconsole, d);
    if (rows.length === 0) {
      empty.push(d);
      console.warn(`[collect_gsc] ${d} API 0행 — 다음 실행에서 재시도`);
      continue;
    }
    const result = await insertRows('gsc_daily', rows);
    total += result.inserted;
    console.log(`[collect_gsc] ${d}: ${result.inserted}행`);
  }

  if (empty.length > 0) {
    await notify(`⚠️ [MARKET_EYE] collect_gsc: API 0행 ${empty.length}일 (${empty.join(', ')}) — 미적재, 창 안에서 재시도`);
  }
  console.log(`[collect_gsc] 완료: ${missing.length - empty.length}일 ${total}행 적재 / 0행 ${empty.length}일`);
}

main().catch(async (err) => {
  console.error(`[collect_gsc] 치명 오류: ${err.message}`);
  await notify(`🔴 [MARKET_EYE] collect_gsc 실패: ${err.message}`);
  process.exit(1);
});
