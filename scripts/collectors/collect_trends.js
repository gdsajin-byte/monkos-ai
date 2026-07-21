/**
 * 트렌드 월배치 수집기
 * - Google Trends: pytrends 서브프로세스 호출 (검증 패턴 원본 포팅)
 * - 네이버 DataLab: HTTP 직접 호출 (seo_collectors.py fetch_naver_datalab 포팅)
 * - ⚠️ pytrends: 비공식 라이브러리, 파손 리스크. 실패 시 텔레그램 경고.
 * - ⚠️ DataLab keywordGroups ≤ 5개: 배치 분할
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const { insertRows } = require('./_loader');
const { notify } = require('./_notify');

const TENANT = 'monkos';

function getMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// --- Google Trends (pytrends 서브프로세스) ---

const TRENDS_QUERIES = [
  { keyword: 'passport photo', geo: 'US', lang: 'en' },
  { keyword: '証明写真', geo: 'JP', lang: 'ja' },
  { keyword: 'passbild', geo: 'DE', lang: 'de' },
  { keyword: 'ảnh thẻ', geo: 'VN', lang: 'vi' },
  { keyword: '2x2 picture', geo: 'PH', lang: 'en' },
  { keyword: 'pas foto', geo: 'ID', lang: 'id' },
  { keyword: '증명사진', geo: 'KR', lang: 'ko' },
];

function fetchGoogleTrend(keyword, geo) {
  const today = getToday();
  const fs = require('fs');
  const os = require('os');
  const path = require('path');

  const pyScript = `import json, sys
try:
    from pytrends.request import TrendReq
    pt = TrendReq(hl='en-US', tz=540)
    pt.build_payload([sys.argv[1]], timeframe=f'2016-01-01 {sys.argv[3]}', geo=sys.argv[2])
    df = pt.interest_over_time()
    if df.empty:
        print(json.dumps([]))
    else:
        rows = []
        for idx, row in df.iterrows():
            rows.append({"date": idx.strftime("%Y-%m-%d"), "interest": int(row.iloc[0])})
        print(json.dumps(rows))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    print(json.dumps([]))
`;

  const tmpFile = path.join(os.tmpdir(), '_market_eye_trends.py');
  fs.writeFileSync(tmpFile, pyScript);

  try {
    const result = execSync(
      `python3 ${tmpFile} ${JSON.stringify(keyword)} ${JSON.stringify(geo)} ${today}`,
      { timeout: 30000, encoding: 'utf-8' },
    );
    return JSON.parse(result.trim());
  } catch (err) {
    console.error(`[collect_trends] pytrends 실패 (${keyword}/${geo}): ${err.message}`);
    return [];
  }
}

async function collectGoogleTrends(dateStr) {
  const rows = [];

  for (const q of TRENDS_QUERIES) {
    console.log(`[collect_trends] Google Trends: ${q.keyword} (${q.geo})`);
    const data = fetchGoogleTrend(q.keyword, q.geo);

    if (Array.isArray(data) && data.length > 0) {
      const latest = data[data.length - 1];
      rows.push({
        date: dateStr,
        tenant: TENANT,
        keyword: q.keyword,
        geo: q.geo,
        lang: q.lang,
        interest: latest.interest || 0,
        source: 'google_trends',
      });
    }

    // 429 회피: 4초 sleep (검증 패턴 원본)
    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  return rows;
}

// --- 네이버 DataLab ---

const DATALAB_KEYWORDS = ['증명사진', 'AI증명사진', '여권사진', '취업사진', '반명함사진'];

async function collectNaverDataLab(dateStr) {
  const clientId = process.env.NAVER_DATALAB_CLIENT_ID || '';
  const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) {
    console.warn('[collect_trends] DataLab 시크릿 미설정 — 생략');
    return [];
  }

  const today = getToday();
  const body = {
    startDate: '2016-01-01',
    endDate: today,
    timeUnit: 'month',
    keywordGroups: DATALAB_KEYWORDS.slice(0, 5).map(kw => ({
      groupName: kw,
      keywords: [kw],
    })),
  };

  const resp = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[collect_trends] DataLab ${resp.status}: ${errText.slice(0, 200)}`);
    return [];
  }

  const data = await resp.json();
  const rows = [];

  for (const group of data.results || []) {
    const periods = group.data || [];
    if (periods.length === 0) continue;
    const latest = periods[periods.length - 1];
    rows.push({
      date: dateStr,
      tenant: TENANT,
      keyword: group.title,
      geo: 'KR',
      lang: 'ko',
      interest: Math.round(latest.ratio || 0),
      source: 'naver_datalab',
    });
  }

  return rows;
}

// --- 메인 ---

async function main() {
  const dateStr = getMonthStart();
  console.log(`[collect_trends] 수집 기준월: ${dateStr}`);

  // Google Trends
  let trendsRows = [];
  try {
    trendsRows = await collectGoogleTrends(dateStr);
    console.log(`[collect_trends] Google Trends: ${trendsRows.length}행`);
  } catch (err) {
    await notify(`⚠️ [MARKET_EYE] Google Trends 수집 실패 (pytrends): ${err.message}`);
    console.error(`[collect_trends] Google Trends 실패: ${err.message}`);
  }

  // 네이버 DataLab
  const datalabRows = await collectNaverDataLab(dateStr);
  console.log(`[collect_trends] 네이버 DataLab: ${datalabRows.length}행`);

  const allRows = [...trendsRows, ...datalabRows];
  if (allRows.length > 0) {
    await insertRows('trends_monthly', allRows);
  } else {
    await notify('⚠️ [MARKET_EYE] collect_trends: Trends + DataLab 모두 0행');
  }

  console.log(`[collect_trends] 완료 — Trends: ${trendsRows.length}행, DataLab: ${datalabRows.length}행`);
}

main().catch(async (err) => {
  console.error(`[collect_trends] 치명 오류: ${err.message}`);
  await notify(`🔴 [MARKET_EYE] collect_trends 실패: ${err.message}`);
  process.exit(1);
});
