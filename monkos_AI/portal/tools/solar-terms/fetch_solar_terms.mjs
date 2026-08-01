#!/usr/bin/env node
/**
 * 절기(24절기) 테이블 취득 도구 — Phase A / PF_FACEREAD
 *
 * 출처: 국립천문대(NAOJ) 暦計算室 「天象 長期版」 phenomena_fy.cgi
 *   - 표준시 UT+9 지정 → KST와 동일 오프셋(일본 중앙표준시 = 한국 표준시 = UTC+9)
 *   - 이용규정(https://eco.mtk.nao.ac.jp/koyomi/site/): "각 페이지 내용은 자유 이용, 신고 불요.
 *     인용 시 (C) NAOJ 등 표기" → 출처 표기 조건으로 사용
 *   - 값은 취득한 공표값을 그대로 적재한다. 계산·보간·추정으로 값을 만들지 않는다.
 *
 * 사용: node fetch_solar_terms.mjs [시작연도] [끝연도]
 *   결과: ../../lib/gwansang/solar-terms.json
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../lib/gwansang/solar-terms.json');
const CACHE = join(__dirname, '.cache');
const ENDPOINT = 'https://eco.mtk.nao.ac.jp/cgi-bin/koyomi/cande/phenomena_fy.cgi';

// 24절기 — 황경 순. 節(월 시작, 12개) / 中(중기, 12개) 구분은 소비 측(saju.js)이 황경으로 판정한다.
// 일본어 표기 → 한국어 표기 매핑 (황경도 함께 대조하여 이중 검증)
const TERMS = [
  { lon: 315, ja: '立春', ko: '입춘', type: 'jeol', branch: 2 },   // 인월
  { lon: 330, ja: '雨水', ko: '우수', type: 'jung' },
  { lon: 345, ja: '啓蟄', ko: '경칩', type: 'jeol', branch: 3 },   // 묘월
  { lon: 0, ja: '春分', ko: '춘분', type: 'jung' },
  { lon: 15, ja: '清明', ko: '청명', type: 'jeol', branch: 4 },    // 진월
  { lon: 30, ja: '穀雨', ko: '곡우', type: 'jung' },
  { lon: 45, ja: '立夏', ko: '입하', type: 'jeol', branch: 5 },    // 사월
  { lon: 60, ja: '小満', ko: '소만', type: 'jung' },
  { lon: 75, ja: '芒種', ko: '망종', type: 'jeol', branch: 6 },    // 오월
  { lon: 90, ja: '夏至', ko: '하지', type: 'jung' },
  { lon: 105, ja: '小暑', ko: '소서', type: 'jeol', branch: 7 },   // 미월
  { lon: 120, ja: '大暑', ko: '대서', type: 'jung' },
  { lon: 135, ja: '立秋', ko: '입추', type: 'jeol', branch: 8 },   // 신월
  { lon: 150, ja: '処暑', ko: '처서', type: 'jung' },
  { lon: 165, ja: '白露', ko: '백로', type: 'jeol', branch: 9 },   // 유월
  { lon: 180, ja: '秋分', ko: '추분', type: 'jung' },
  { lon: 195, ja: '寒露', ko: '한로', type: 'jeol', branch: 10 },  // 술월
  { lon: 210, ja: '霜降', ko: '상강', type: 'jung' },
  { lon: 225, ja: '立冬', ko: '입동', type: 'jeol', branch: 11 },  // 해월
  { lon: 240, ja: '小雪', ko: '소설', type: 'jung' },
  { lon: 255, ja: '大雪', ko: '대설', type: 'jeol', branch: 0 },   // 자월
  { lon: 270, ja: '冬至', ko: '동지', type: 'jung' },
  { lon: 285, ja: '小寒', ko: '소한', type: 'jeol', branch: 1 },   // 축월
  { lon: 300, ja: '大寒', ko: '대한', type: 'jung' },
];
const BY_JA = new Map(TERMS.map(t => [t.ja, t]));

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchYear(year) {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });
  const cacheFile = join(CACHE, `${year}.html`);
  if (existsSync(cacheFile)) return readFileSync(cacheFile);

  const body = new URLSearchParams({
    year: String(year), lst: '9', lsti: '9', body: '0', phenom: '50', '表示': '表示',
  }).toString();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(cacheFile, buf);
      await sleep(700); // 공공 서버 예의 — 초당 1회 미만
      return buf;
    } catch (e) {
      if (attempt === 3) throw new Error(`${year}년 취득 실패: ${e.message}`);
      await sleep(2000 * attempt);
    }
  }
}

function parseYear(buf, year) {
  const html = new TextDecoder('euc-jp').decode(buf);
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

  // "2026/01/05 17:23 太陽 二十四節気 小寒(黄経285°)"
  const re = /(\d{4})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})\s+太陽\s+二十四節気\s+(\S+?)\(黄経(\d+)°\)/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, y, mo, d, h, mi, ja, lon] = m;
    const def = BY_JA.get(ja);
    if (!def) throw new Error(`${year}년: 미등록 절기명 "${ja}"`);
    if (def.lon !== Number(lon)) {
      throw new Error(`${year}년 ${ja}: 황경 불일치 (기대 ${def.lon}°, 취득 ${lon}°)`);
    }
    if (Number(y) !== year) throw new Error(`${year}년 요청에 ${y}년 행 혼입`);
    out.push({
      name: def.ko,
      ja: def.ja,
      lon: def.lon,
      type: def.type,
      ...(def.branch !== undefined ? { branch: def.branch } : {}),
      kst: `${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${mi}:00+09:00`,
    });
  }
  if (out.length !== 24) throw new Error(`${year}년: 절기 ${out.length}건 (24건이어야 함)`);
  return out;
}

async function main() {
  const from = Number(process.argv[2] ?? 1899);
  const to = Number(process.argv[3] ?? 2031);
  const years = {};
  for (let y = from; y <= to; y++) {
    const buf = await fetchYear(y);
    years[y] = parseYear(buf, y);
    process.stdout.write(`\r취득 ${y} (${y - from + 1}/${to - from + 1})   `);
  }
  process.stdout.write('\n');

  const doc = {
    meta: {
      id: 'solar_terms',
      version: '1.0.0',
      created: new Date().toISOString().slice(0, 10),
      range: { from, to },
      timezone: 'Asia/Seoul (UTC+9, DST 미적용)',
      source: '일본 국립천문대(NAOJ, 国立天文台) 역계산실 「天象 長期版」 공표값 — 표준시 UT+9 지정 취득. (C) NAOJ',
      source_url: ENDPOINT,
      source_terms: 'https://eco.mtk.nao.ac.jp/koyomi/site/ — 자유 이용, 인용 시 출처 표기',
      note:
        '절기는 태양 황경이 15° 배수에 도달하는 순간(천문 사건)이므로 관측지와 무관하며, ' +
        '일본 중앙표준시(UTC+9)와 한국 표준시(UTC+9)는 동일 오프셋이라 시각이 그대로 KST가 된다. ' +
        '값은 공표값 원본이며 계산·보간·추정으로 생성한 값이 아니다. ' +
        `범위는 지시서 요구(1900~2030)에 월주 경계 판정용 앞뒤 1년을 덧댄 ${from}~${to}이다.`,
      verification:
        'verify_solar_terms.mjs — ① 내부 정합성 3192건 ② NAOJ 暦要項 2026 二十四節気 공표표(CGI와 독립 발표 경로) 24건 전량 일치 ' +
        '③ 홍콩천문대(HKO) Gregorian-Lunar Calendar 절기 일자표(HKT=UTC+8) 130개 연도 2590건 대조. ' +
        '상세: tools/solar-terms/verification-report.json',
      cross_check_divergence: {
        summary:
          'HKO 대조에서 홍콩 표준시 자정 ±15분 구간 6건이 일자 불일치. 값 오류가 아니라 기관 간 시각 정의(표준시 채택 이력·ΔT) 차이로 판단하여 NAOJ 공표값을 그대로 유지한다.',
        month_pillar_affected: [
          '1917-12-08T01:01:00+09:00 대설(節) — HKO는 1917/12/07',
          '1927-09-09T01:05:00+09:00 백로(節) — HKO는 1927/09/08',
        ],
        note: '나머지 4건(1912 소설·1913 추분·1923 우수·1928 하지)은 中氣라 월주 판정에 영향이 없다.',
      },
      caveats: [
        '1900~1911년 한국은 표준시가 여러 차례 변경되었다(대한제국 UTC+8:30 등). 본 테이블은 현행 KST(UTC+9) 고정 기준이므로 해당 시기 출생자의 경계 시각 해석에는 오차가 있을 수 있다.',
        '한국 서머타임 시행기(1948~1960, 1987~1988) 출생 시각은 표준시로 환산해 입력해야 한다.',
      ],
    },
    years,
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
  const total = Object.values(years).reduce((s, a) => s + a.length, 0);
  console.log(`✅ ${OUT}\n   ${to - from + 1}개 연도 / 절기 ${total}건`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
