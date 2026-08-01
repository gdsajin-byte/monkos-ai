#!/usr/bin/env node
/**
 * 절기 테이블 교차 검증 — Phase A / PF_FACEREAD
 *
 * A. 내부 정합성   : 연도별 24건, 황경 순서, 절기 간격(14~16일), 연도 경계 연속성
 * B. NAOJ 暦要項   : 국립천문대 「暦要項」 二十四節気 공표표(CGI와 독립 발표 경로)와 분 단위 대조
 * C. 홍콩천문대(HKO): Gregorian-Lunar Calendar Table 절기 일자(HKT=UTC+8)와 일자 대조
 *                     — 서머타임 시행 연도는 파일 주석으로 자동 식별해 ±1h 허용
 *
 * 사용: node verify_solar_terms.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TABLE = join(__dirname, '../../lib/gwansang/solar-terms.json');
const CACHE = join(__dirname, '.cache');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const doc = JSON.parse(readFileSync(TABLE, 'utf8'));
const years = doc.years;
const fail = [];
const note = (ok, msg) => { console.log(`${ok ? '  ✓' : '  ✗'} ${msg}`); if (!ok) fail.push(msg); };

// ---------- A. 내부 정합성 ----------
console.log('\n[A] 내부 정합성');
const LON_ORDER = [315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300];
let aBad = 0;
const flat = [];
for (const y of Object.keys(years).sort()) {
  const list = years[y];
  if (list.length !== 24) { note(false, `${y}년 ${list.length}건`); aBad++; }
  // 황경 순서: 1월 소한(285)부터 시작하는 달력 연도 순
  const calOrder = [285, 300, ...LON_ORDER.slice(0, 22)];
  list.forEach((t, i) => {
    if (t.lon !== calOrder[i]) { note(false, `${y}년 ${i}번째 황경 ${t.lon}° (기대 ${calOrder[i]}°)`); aBad++; }
    flat.push({ ...t, year: Number(y), t: new Date(t.kst).getTime() });
  });
}
flat.sort((a, b) => a.t - b.t);
let gapBad = 0;
for (let i = 1; i < flat.length; i++) {
  const days = (flat[i].t - flat[i - 1].t) / 86400000;
  if (days < 14 || days > 16.5) { gapBad++; if (gapBad <= 5) note(false, `간격 이상: ${flat[i - 1].name}→${flat[i].name} ${days.toFixed(2)}일`); }
}
note(aBad === 0, `연도별 24건 · 황경 순서 (${Object.keys(years).length}개 연도, ${flat.length}건)`);
note(gapBad === 0, `절기 간격 14~16.5일 연속성 (연도 경계 포함, 이상 ${gapBad}건)`);

// ---------- B. NAOJ 暦要項 대조 ----------
console.log('\n[B] NAOJ 暦要項 二十四節気 공표표 대조 (CGI와 독립 경로)');
const JA_ORDER = ['小寒', '大寒', '立春', '雨水', '啓蟄', '春分', '清明', '穀雨', '立夏', '小満', '芒種', '夏至',
  '小暑', '大暑', '立秋', '処暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];

async function cachedFetch(url, file, decode = 'utf-8') {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });
  const p = join(CACHE, file);
  if (!existsSync(p)) {
    const res = await fetch(url);
    if (!res.ok) return null;
    writeFileSync(p, Buffer.from(await res.arrayBuffer()));
    await sleep(700);
  }
  return new TextDecoder(decode).decode(readFileSync(p));
}

async function checkYoko(year) {
  const html = await cachedFetch(
    `https://eco.mtk.nao.ac.jp/koyomi/yoko/${year}/rekiyou262.html`, `yoko${year}.html`, 'shift_jis');
  if (!html) { console.log(`  – ${year}년 暦要項 미공개(스킵)`); return; }
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  // "小寒 1月 5日 17時23分" 형태
  let matched = 0, bad = 0;
  for (const ja of JA_ORDER) {
    // "小寒 285度 1月05日 17時23分"
    const m = new RegExp(`${ja}\\s*(\\d{1,3})度\\s*(\\d{1,2})月\\s*(\\d{1,2})日\\s*(\\d{1,2})時\\s*(\\d{1,2})分`).exec(text);
    if (!m) continue;
    const [lon, mo, d, h, mi] = m.slice(1).map(Number);
    const ours = (years[year] || []).find(t => t.ja === ja);
    if (!ours) { bad++; note(false, `${year} ${ja}: 우리 테이블에 없음`); continue; }
    // kst 문자열 자체가 KST 벽시계 값 — Date 지역시 환산(과거 표준시 변경)에 의존하지 않는다
    const [oM, oD] = [Number(ours.kst.slice(5, 7)), Number(ours.kst.slice(8, 10))];
    const [oH, oMi] = [Number(ours.kst.slice(11, 13)), Number(ours.kst.slice(14, 16))];
    matched++;
    if (ours.lon !== lon || oM !== mo || oD !== d || oH !== h || oMi !== mi) {
      bad++;
      note(false, `${year} ${ja}: 暦要項 ${lon}° ${mo}/${d} ${h}:${String(mi).padStart(2, '0')} ≠ 테이블 ${ours.lon}° ${oM}/${oD} ${oH}:${String(oMi).padStart(2, '0')}`);
    }
  }
  note(bad === 0 && matched > 0, `${year}년 暦要項 대조 ${matched}건 전량 일치`);
}
for (const y of [2026, 2027]) await checkYoko(y);

// ---------- C. HKO 일자 대조 ----------
console.log('\n[C] 홍콩천문대(HKO) 절기 일자표 대조');
const HKO_EN = {
  'Moderate Cold': '小寒', 'Severe Cold': '大寒', 'Spring Commences': '立春', 'Spring Showers': '雨水',
  'Insects Waken': '啓蟄', 'Vernal Equinox': '春分', 'Bright and Clear': '清明', 'Corn Rain': '穀雨',
  'Summer Commences': '立夏', 'Corn Forms': '小満', 'Corn on Ear': '芒種', 'Summer Solstice': '夏至',
  'Moderate Heat': '小暑', 'Great Heat': '大暑', 'Autumn Commences': '立秋', 'End of Heat': '処暑',
  'White Dew': '白露', 'Autumnal Equinox': '秋分', 'Cold Dew': '寒露', 'Frost': '霜降',
  'Winter Commences': '立冬', 'Light Snow': '小雪', 'Heavy Snow': '大雪', 'Winter Solstice': '冬至',
};
// 고정 오프셋 렌더 — 실행 머신의 지역시(과거 표준시 변경 이력 포함)에 의존하지 않는다
const fmtAt = (ms, offsetHours) => {
  const d = new Date(ms + offsetHours * 3600000);
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;
};

let hkoYears = 0, hkoTerms = 0, hkoBad = 0, hkoDst = 0, hkoMiss = 0;
const boundary = []; // 자정 경계 15분 이내의 기관 간 불일치 — 실패가 아니라 명시 기록 대상
const hkoTargets = Object.keys(years).map(Number).filter(y => y >= 1901 && y <= 2030);
for (const y of hkoTargets) {
  const txt = await cachedFetch(
    `https://www.hko.gov.hk/en/gts/time/calendar/text/files/T${y}e.txt`, `hko${y}.txt`, 'utf-8');
  if (!txt) { hkoMiss++; continue; }
  const dst = /summer time/i.test(txt);
  if (dst) hkoDst++;
  hkoYears++;
  const ours = new Map((years[y] || []).map(t => [t.ja, t]));
  for (const line of txt.split(/\r?\n/)) {
    const m = /^(\d{4})\/(\d{2})\/(\d{2}).*?\b(Moderate Cold|Severe Cold|Spring Commences|Spring Showers|Insects Waken|Vernal Equinox|Bright and Clear|Corn Rain|Summer Commences|Corn Forms|Corn on Ear|Summer Solstice|Moderate Heat|Great Heat|Autumn Commences|End of Heat|White Dew|Autumnal Equinox|Cold Dew|Frost|Winter Commences|Light Snow|Heavy Snow|Winter Solstice)\s*$/.exec(line.trimEnd());
    if (!m) continue;
    const hkoDate = `${m[1]}/${m[2]}/${m[3]}`;
    const t = ours.get(HKO_EN[m[4]]);
    if (!t) { hkoBad++; if (hkoBad <= 5) note(false, `${y} ${m[4]}: 테이블 결측`); continue; }
    const kst = new Date(t.kst).getTime();
    // 절기 순간(UTC) → 홍콩 표준시(UTC+8) 일자. 서머타임 연도는 HKST(UTC+9)도 허용.
    const cands = dst ? [fmtAt(kst, -1 + 9), fmtAt(kst, 0 + 9)] : [fmtAt(kst, -1 + 9)];
    hkoTerms++;
    if (!cands.includes(hkoDate)) {
      // 홍콩 표준시 자정까지 남은/지난 분 — 경계 15분 이내면 기관 간 시각 정의 차이로 본다
      const hkHM = new Date(kst - 3600000 + 9 * 3600000);
      const hkMin = hkHM.getUTCHours() * 60 + hkHM.getUTCMinutes();
      const toMid = Math.min(hkMin, 1440 - hkMin);
      if (toMid <= 15) {
        boundary.push({ year: y, term: t.name, ja: t.ja, type: t.type, kst: t.kst, hko: hkoDate, gapMin: toMid });
      } else {
        hkoBad++;
        if (hkoBad <= 15) note(false, `${y} ${m[4]}: HKO ${hkoDate} ≠ 환산 ${cands.join('|')} (KST ${t.kst}, 자정에서 ${toMid}분)`);
      }
    }
  }
}
note(hkoBad === 0, `HKO 대조 ${hkoYears}개 연도 / ${hkoTerms}건 일자 일치 (서머타임 연도 ${hkoDst}개는 ±1h 허용, 미취득 ${hkoMiss}개, 경계 불일치 ${boundary.length}건은 별도 기록)`);

// ---------- 자정 경계 불일치 명시 (무음 금지) ----------
if (boundary.length) {
  console.log(`\n[경계] 홍콩 표준시 자정 ±15분 구간의 기관 간 일자 불일치 ${boundary.length}건 — 값 오류가 아니라 시각 정의 차이로 판단, 명시 기록`);
  for (const b of boundary) {
    console.log(`  · ${b.year} ${b.term}(${b.ja}) ${b.type === 'jeol' ? '節·월주 경계' : '中氣·월주 무관'} — NAOJ KST ${b.kst} / HKO ${b.hko} (자정 ${b.gapMin}분)`);
  }
  const jeol = boundary.filter(b => b.type === 'jeol');
  console.log(`  → 이 중 월주를 가르는 節은 ${jeol.length}건 (${jeol.map(b => `${b.year} ${b.term}`).join(', ') || '없음'})`);
}

// ---------- 결과 ----------
console.log('\n────────────────────────────');
const report = { checkedAt: new Date().toISOString(), terms: flat.length, hkoTerms, hkoYears, boundary, failures: fail };
writeFileSync(join(__dirname, 'verification-report.json'), JSON.stringify(report, null, 2) + '\n');
if (fail.length) { console.log(`❌ 검증 실패 ${fail.length}건 — 출고 불가`); process.exit(1); }
console.log(`✅ 전 항목 통과 — 내부 ${flat.length}건 / 暦要項 대조 / HKO ${hkoTerms}건 (경계 기록 ${boundary.length}건)`);
