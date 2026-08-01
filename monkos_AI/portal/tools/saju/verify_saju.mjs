#!/usr/bin/env node
/**
 * 사주 4주 엔진 검증 — 만세력 공표값 대조 (PF_FACEREAD Phase A)
 *
 * 대조원: 한국천문연구원(KASI) 음양력 변환 공표값 (astro.kasi.re.kr/life/solc)
 *   - LUNC_ILJIN(일진) = 일주 → 정의가 동일하므로 **전 케이스 직접 대조**
 *   - LUNC_PRCN(세차)·LUNC_WLGN(월건) = KASI는 **음력(설날·삭)** 기준,
 *     사주 명식은 **절기(입춘·節)** 기준 → 정의가 갈리는 구간에서는 값이 다른 것이 정상이다.
 *     본 스크립트는 정의가 합치하는 구간에서만 직접 대조하고, 갈리는 구간은 사유와 함께 명시 기록한다.
 *
 * 사용: node verify_saju.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { computeSaju, hourPillar } from '../../lib/gwansang/saju.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, '.cache');
const DB = createRequire(import.meta.url)('../../lib/cms/gwansang-data.json');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 연대 분산 + 절기 경계일 포함 (지시서 3-2: 최소 10케이스, 경계 2건 이상)
const CASES = [
  { date: '1950-03-15', time: '10:30', note: '1950년대' },
  { date: '1955-11-08', time: '03:15', note: '1950년대 말' },
  { date: '1963-07-23', time: '21:40', note: '1960년대' },
  { date: '1971-05-02', time: '12:00', note: '1970년대' },
  { date: '1988-09-19', time: '07:05', note: '1980년대' },
  { date: '1996-12-25', time: '23:30', note: '1990년대 · 야자시' },
  { date: '2003-04-11', time: '15:20', note: '2000년대' },
  { date: '2010-08-30', time: '05:50', note: '2010년대' },
  { date: '2019-06-06', time: '18:10', note: '2010년대 말' },
  { date: '2024-11-11', time: '00:20', note: '2020년대' },
  // — 절기 경계 —
  { date: '2026-02-04', time: '04:00', note: '경계: 입춘 당일 05:02 이전 → 전년(을사) 년주', boundary: true },
  { date: '2026-02-04', time: '06:00', note: '경계: 입춘 당일 05:02 이후 → 당년(병오) 년주', boundary: true },
  { date: '2026-02-10', time: '12:00', note: '경계: 입춘(2/4) 후·설날(2/17) 전 — 사주 병오 vs KASI 세차 을사 분기 실증', boundary: true },
  { date: '2026-08-07', time: '19:00', note: '경계: 입추 당일 20:43 이전 → 미월 유지', boundary: true },
  { date: '2026-08-07', time: '22:00', note: '경계: 입추 당일 20:43 이후 → 신월 전환', boundary: true },
];

async function kasi(date) {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });
  const p = join(CACHE, `kasi_${date}.json`);
  if (!existsSync(p)) {
    const [y, m, d] = date.split('-');
    const res = await fetch(`https://astro.kasi.re.kr/life/solc?yyyy=${y}&mm=${m}&dd=${d}`);
    if (!res.ok) throw new Error(`KASI ${date}: HTTP ${res.status}`);
    writeFileSync(p, Buffer.from(await res.arrayBuffer()));
    await sleep(600);
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

const hanjaOf = (s) => (s.match(/\(([^)]+)\)/) || [, s])[1]; // "병오(丙午)" → "丙午"
const pillarHanja = (p) => p ? `${p.stem.hanja}${p.branch.hanja}` : null;

// 오서둔(일간→자시 천간) 고전 규칙표 — 엔진 산출과 대조
const OSEODUN = { 甲: '甲', 己: '甲', 乙: '丙', 庚: '丙', 丙: '戊', 辛: '戊', 丁: '庚', 壬: '庚', 戊: '壬', 癸: '壬' };
// 오호둔(년간→인월 천간) 고전 규칙표
const OHODUN = { 甲: '丙', 己: '丙', 乙: '戊', 庚: '戊', 丙: '庚', 辛: '庚', 丁: '壬', 壬: '壬', 戊: '甲', 癸: '甲' };

const rows = [];
const fails = [];

console.log('\n[1] 만세력(KASI 한국천문연구원) 공표값 대조\n');
for (const c of CASES) {
  const k = await kasi(c.date);
  const s = computeSaju(c.date, c.time, DB.saju);
  if (s.error) { fails.push(`${c.date}: ${s.message}`); continue; }

  const ours = {
    year: pillarHanja(s.year), month: pillarHanja(s.month),
    day: pillarHanja(s.day), hour: pillarHanja(s.hour),
  };
  const pub = {
    secha: hanjaOf(k.LUNC_PRCN), wolgeon: hanjaOf(k.LUNC_WLGN), iljin: hanjaOf(k.LUNC_ILJIN),
    lunar: `${k.LUNC_YYYY}-${k.LUNC_MM}-${k.LUNC_DD}`,
  };

  // 일주 — 정의 동일, 무조건 일치해야 한다
  const dayOk = ours.day === pub.iljin;
  if (!dayOk) fails.push(`${c.date} 일주: 공표 ${pub.iljin} ≠ 산출 ${ours.day}`);

  // 년주 — KASI 세차(음력 해) 와 정의가 합치하는 구간에서만 직접 대조
  const lunarYear = Number(k.LUNC_YYYY);
  const gregYear = Number(c.date.slice(0, 4));
  const yearComparable = lunarYear === gregYear && !s.year.springAdjusted;
  const yearOk = yearComparable ? ours.year === pub.secha : null;
  if (yearOk === false) fails.push(`${c.date} 년주: 공표 ${pub.secha} ≠ 산출 ${ours.year}`);

  // 월주 — 음력 월지와 절기 월지가 같은 구간에서만 직접 대조
  const lunarBranchHanja = DB.saju.branches[(Number(k.LUNC_MM) + 1) % 12].hanja;
  const monthComparable = yearComparable && s.month.branch.hanja === lunarBranchHanja;
  const monthOk = monthComparable ? ours.month === pub.wolgeon : null;
  if (monthOk === false) fails.push(`${c.date} 월주: 공표 ${pub.wolgeon} ≠ 산출 ${ours.month}`);

  // 오호둔·오서둔 규칙표 대조 (엔진 산식 ↔ 고전 규칙)
  const yStem = s.year.stem.hanja, dStem = s.day.stem.hanja;
  const inwolStem = DB.saju.stems[(2 + 2 * DB.saju.stems.findIndex(x => x.hanja === yStem)) % 10].hanja;
  if (inwolStem !== OHODUN[yStem]) fails.push(`${c.date} 오호둔: ${yStem}년 인월간 ${inwolStem} ≠ 규칙표 ${OHODUN[yStem]}`);
  const jasi = hourPillar(0, 0, DB.saju.stems.findIndex(x => x.hanja === dStem));
  if (DB.saju.stems[jasi.stem].hanja !== OSEODUN[dStem]) {
    fails.push(`${c.date} 오서둔: ${dStem}일 자시간 ${DB.saju.stems[jasi.stem].hanja} ≠ 규칙표 ${OSEODUN[dStem]}`);
  }

  const mark = (ok) => ok === null ? '–' : ok ? '✓' : '✗';
  rows.push({
    date: c.date, time: c.time, note: c.note,
    ours, pub,
    dayOk, yearOk, monthOk,
    yearNote: yearComparable ? '' : `KASI 세차는 음력 해(${pub.lunar}) 기준 — 절기(입춘) 기준과 정의 분기`,
    monthNote: monthComparable ? '' : `KASI 월건은 음력 월(${k.LUNC_MM}월) 기준 — 절기 구간(${s.month.term.name} 이후)과 정의 분기`,
    warnings: s.warnings,
  });
  console.log(`${c.date} ${c.time}  ${c.note}`);
  console.log(`   산출  년 ${ours.year} · 월 ${ours.month} · 일 ${ours.day} · 시 ${ours.hour}`);
  console.log(`   공표  세차 ${pub.secha} · 월건 ${pub.wolgeon} · 일진 ${pub.iljin} (음력 ${pub.lunar})`);
  console.log(`   대조  일주 ${mark(dayOk)} / 년주 ${mark(yearOk)} / 월주 ${mark(monthOk)}`);
  if (!yearComparable) console.log(`         ↳ 년주 정의 분기: KASI 음력 해 기준, 사주는 입춘 기준`);
  if (!monthComparable) console.log(`         ↳ 월주 정의 분기: KASI 음력 월 기준, 사주는 절기(節) 기준`);
  for (const w of s.warnings) console.log(`         ⚠ ${w}`);
  console.log();
}

// ---------- 시주 미입력 동작 ----------
console.log('[2] 시주 미입력 시 무음 강등 여부');
const noTime = computeSaju('2026-08-01', null, DB.saju);
const ok2 = noTime.hour === null && !!noTime.hourMissing;
console.log(`  ${ok2 ? '✓' : '✗'} 시주 null + 사유 문구 노출: "${noTime.hourMissing}"`);
if (!ok2) fails.push('시주 미입력 시 사유 문구 미노출');

// ---------- 범위 밖 ----------
console.log('\n[3] 절기 테이블 범위 밖 입력');
const oob = computeSaju('1850-01-01', null, DB.saju);
const ok3 = oob.error === 'out_of_range';
console.log(`  ${ok3 ? '✓' : '✗'} 명시 오류 반환: ${oob.error ?? '(없음)'}`);
if (!ok3) fails.push('범위 밖 입력이 명시 오류로 처리되지 않음');

// ---------- 결과 ----------
const dayCount = rows.filter(r => r.dayOk).length;
const yearCount = rows.filter(r => r.yearOk === true).length;
const monthCount = rows.filter(r => r.monthOk === true).length;
console.log('\n────────────────────────────');
console.log(`일주 대조 ${dayCount}/${rows.length} · 년주 직접대조 ${yearCount}건 · 월주 직접대조 ${monthCount}건`);
writeFileSync(join(__dirname, 'verification-report.json'),
  JSON.stringify({ checkedAt: new Date().toISOString(), rows, fails }, null, 2) + '\n');
if (fails.length) {
  console.log(`❌ 불일치 ${fails.length}건 — 출고 불가`);
  fails.forEach(f => console.log(`   · ${f}`));
  process.exit(1);
}
console.log('✅ 전 케이스 일치 — 출고 가능');
