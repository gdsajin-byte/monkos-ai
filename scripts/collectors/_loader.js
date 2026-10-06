/**
 * BQ 공통 로더 — market_eye 테이블에 행 삽입
 */

const { BigQuery } = require('@google-cloud/bigquery');
const { notify } = require('./_notify');

const PROJECT_ID = 'monkos';
const DATASET_ID = 'market_eye';

const SCHEMAS = {
  gsc_daily: ['date', 'tenant', 'site', 'page', 'query', 'country', 'device', 'clicks', 'impressions', 'position'],
  ga4_daily: ['date', 'tenant', 'channel', 'source_medium', 'sessions', 'users', 'new_users', 'bounce_rate', 'avg_duration', 'conv_free', 'conv_signup', 'conv_purchase'],
  ads_keyword_monthly: ['date', 'tenant', 'keyword', 'lang', 'geo', 'monthly_searches', 'competition', 'cpc_low', 'cpc_high', 'source'],
  naver_searchad_monthly: ['date', 'tenant', 'keyword', 'pc_searches', 'mobile_searches', 'pc_clicks', 'mobile_clicks', 'competition'],
  trends_monthly: ['date', 'tenant', 'keyword', 'geo', 'lang', 'interest', 'source'],
  // 2026-10-06 신설 (ORDER_20261006 W3) — 국가×호스트×랜딩(언어 접두 제거 1단)×소스. 봇·비운영 호스트 판독용
  // active_users는 랜딩 정규화로 합산한 값이라 상한 근사(동일 사용자가 여러 원 랜딩에 걸치면 중복 계수)
  ga4_daily_dims: ['date', 'tenant', 'country', 'host', 'landing', 'source', 'active_users', 'sessions', 'engaged_sessions', 'avg_duration'],
};

function getSaKey() {
  const raw = process.env.GCP_SA_KEY || '';
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
}

/**
 * 인증 옵션 — GCP_SA_KEY(CI 정본) 우선, 없으면 GOOGLE_APPLICATION_CREDENTIALS(로컬 ADC) 폴백.
 * 둘 다 없으면 null → 호출부가 🔴로 중단한다(무음 금지).
 */
function getAuthOptions() {
  const keyData = getSaKey();
  if (keyData) return { credentials: keyData, mode: 'GCP_SA_KEY' };
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return { mode: 'ADC' };
  return null;
}

function createClient() {
  const keyData = getSaKey();
  if (keyData) {
    return new BigQuery({ projectId: PROJECT_ID, credentials: keyData });
  }
  return new BigQuery({ projectId: PROJECT_ID });
}

// --- 날짜 유틸 (KST 기준 — 러너 시각이 UTC 자정을 넘겨 지연 기동해도 대상일이 흔들리지 않게) ---

function kstToday() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function dateRange(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * 백필 대상일 계산 — [start, end] 중 테이블에 행이 없는 날짜만 돌려준다.
 * 같은 날짜 재적재 금지(append-only·중복 금지)의 단일 관문.
 */
async function getMissingDates(table, start, end, tenant) {
  const bq = createClient();
  // ⚠️ DATE 파라미터는 bq.date()로 감싼다 — 문자열+types:'DATE'는 NULL로 바인딩돼 전 날짜가 "결측"으로 나온다
  //    (2026-10-06 실사고: ga4_daily 8일 중복 적재. INCIDENT_20261006_market_eye_ga4_daily_중복적재)
  const [rows] = await bq.query({
    query: `SELECT CAST(date AS STRING) AS d, COUNT(*) AS n FROM \`${PROJECT_ID}.${DATASET_ID}.${table}\`
            WHERE date BETWEEN @start AND @end AND tenant = @tenant GROUP BY d`,
    params: { start: bq.date(start), end: bq.date(end), tenant },
  });
  const have = new Set(rows.map(r => r.d));

  // 대조군 — 조회 자체가 무효(0건)인데 "전부 결측"으로 읽고 재적재하는 사고 차단 (live-verify 3조)
  const [[ctrl]] = await bq.query({
    query: `SELECT COUNT(*) AS n FROM \`${PROJECT_ID}.${DATASET_ID}.${table}\`
            WHERE date >= DATE '${start}' AND date <= DATE '${end}' AND tenant = '${tenant.replace(/'/g, '')}'`,
  });
  const lookupTotal = rows.reduce((s, r) => s + Number(r.n), 0);
  if (Number(ctrl.n) !== lookupTotal) {
    throw new Error(`${table} 존재 조회 무효 — 대조군 ${ctrl.n}행 ≠ 조회 ${lookupTotal}행. 적재 중단`);
  }
  return dateRange(start, end).filter(d => !have.has(d));
}

/**
 * CLI 백필 인자 — `--since YYYY-MM-DD` (1회성 장기 백필) 또는 환경변수 BACKFILL_SINCE.
 * 기본은 lookbackDays 창.
 */
function resolveWindow(lookbackDays, endOffsetDays) {
  const end = addDays(kstToday(), -endOffsetDays);
  const argIdx = process.argv.indexOf('--since');
  const since = (argIdx > -1 ? process.argv[argIdx + 1] : '') || process.env.BACKFILL_SINCE || '';
  if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    throw new Error(`--since 형식 오류: ${since} (YYYY-MM-DD)`);
  }
  const start = since || addDays(end, -(lookbackDays - 1));
  return { start, end, mode: since ? `backfill since ${since}` : `lookback ${lookbackDays}d` };
}

function validateRow(table, row) {
  const schema = SCHEMAS[table];
  if (!schema) return row;
  const validated = {};
  for (const field of schema) {
    if (field in row) validated[field] = row[field];
  }
  return validated;
}

async function insertRows(table, rows) {
  if (!rows || rows.length === 0) {
    const msg = `⚠️ [MARKET_EYE] ${table}: 수집 결과 0행 — 빈 응답`;
    console.warn(msg);
    await notify(msg);
    return { inserted: 0, warning: '빈 응답' };
  }

  const validated = rows.map(r => validateRow(table, r));
  const bq = createClient();
  const dataset = bq.dataset(DATASET_ID);
  const tbl = dataset.table(table);

  try {
    await tbl.insert(validated);
    console.log(`[MARKET_EYE] ${table}: ${validated.length}행 삽입 완료`);
    return { inserted: validated.length };
  } catch (err) {
    const msg = `🔴 [MARKET_EYE] ${table} 삽입 실패: ${err.message}`;
    console.error(msg);
    if (err.errors) {
      console.error(JSON.stringify(err.errors.slice(0, 3), null, 2));
    }
    await notify(msg);
    throw err;
  }
}

module.exports = {
  insertRows, getSaKey, getAuthOptions, getMissingDates, resolveWindow,
  kstToday, addDays, dateRange, PROJECT_ID, DATASET_ID,
};
