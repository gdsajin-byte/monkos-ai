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

function createClient() {
  const keyData = getSaKey();
  if (keyData) {
    return new BigQuery({ projectId: PROJECT_ID, credentials: keyData });
  }
  return new BigQuery({ projectId: PROJECT_ID });
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

module.exports = { insertRows, getSaKey, PROJECT_ID };
