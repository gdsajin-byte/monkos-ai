/**
 * 사주 4주(년·월·일·시) 산출 — PF_FACEREAD Phase A
 *
 * POC(apps/gwansang-poc/js/saju.js)의 년주·일주를 이식하고 월주·시주를 확장했다.
 *  - 년주: 입춘 **실데이터** 경계 (POC의 2/4 고정 근사 폐기)
 *  - 월주: 절기 12절(節) 실데이터로 월지 판정 + 오호둔(五虎遁)으로 월간 산출. 날짜 근사 없음
 *  - 일주: 1900-01-01 = 갑술일 앵커 (POC 검증분 유지)
 *  - 시주: 시간 입력 시에만 산출. 미입력 시 null + 사유 명시 (무음 강등 금지)
 *
 * 절기 정본: ./solar-terms.json (국립천문대 공표값 취득분, tools/solar-terms/ 참조)
 */
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
export const SOLAR_TERMS = _require('./solar-terms.json');

const MS_PER_DAY = 86400000;
const KST_OFFSET_MS = 9 * 3600000;

// 일주 앵커: 1900-01-01 = 갑술(60갑자 index 10). POC에서 만세력 공표값 대조 완료.
const DAY_ANCHOR_INDEX = 10;
const ANCHOR_UTC = Date.UTC(1900, 0, 1);

/** KST 벽시계 → epoch ms (실행 머신 지역시에 의존하지 않는다) */
function kstToEpoch(y, m, d, h = 0, mi = 0) {
  return Date.UTC(y, m - 1, d, h, mi) - KST_OFFSET_MS;
}

/** solar-terms.json의 "YYYY-MM-DDTHH:MM:00+09:00" → epoch ms */
function termEpoch(kstStr) {
  return kstToEpoch(
    +kstStr.slice(0, 4), +kstStr.slice(5, 7), +kstStr.slice(8, 10),
    +kstStr.slice(11, 13), +kstStr.slice(14, 16)
  );
}

export const TERM_RANGE = SOLAR_TERMS.meta.range;

/** 해당 연도 절기 목록 (없으면 null) */
function termsOf(year) {
  return SOLAR_TERMS.years[String(year)] ?? null;
}

/** 연·월·일 기준 60갑자 index → {stem, branch} */
function ganjiOf(index) {
  const i = ((index % 60) + 60) % 60;
  return { stem: i % 10, branch: i % 12 };
}

// ---------- 각 주 ----------

/** 일주: 날짜(KST 00시) 기준. 자시(23시) 경계는 v1 미반영 — caveat로 고지 */
export function dayPillar(y, m, d) {
  const days = Math.round((Date.UTC(y, m - 1, d) - ANCHOR_UTC) / MS_PER_DAY);
  return ganjiOf(days + DAY_ANCHOR_INDEX);
}

/**
 * 년주: 입춘 실측 시각 기준. 입춘 이전 출생은 전년 간지.
 * @returns {{stem,branch,effYear,springAdjusted,boundaryDay}}
 */
export function yearPillar(epoch, y) {
  const list = termsOf(y);
  if (!list) return null;
  const ipchun = list.find(t => t.lon === 315);
  const ipchunMs = termEpoch(ipchun.kst);
  const effYear = epoch < ipchunMs ? y - 1 : y;
  return {
    stem: ((effYear - 4) % 10 + 10) % 10,
    branch: ((effYear - 4) % 12 + 12) % 12,
    effYear,
    springAdjusted: effYear !== y,
    ipchun: ipchun.kst,
    boundaryDay: ipchun.kst.slice(0, 10),
  };
}

/**
 * 월주: 직전 節(12절) → 월지. 오호둔(년간→인월 천간)으로 월간 산출.
 *  - 인월(寅) 천간 = (2 + 2×년간) % 10  … 갑기년 병인, 을경년 무인, 병신년 경인, 정임년 임인, 무계년 갑인
 */
export function monthPillar(epoch, y, yearStem) {
  // 직전 節을 찾기 위해 전년도까지 훑는다 (1월 소한 이전 출생 → 전년 대설)
  const candidates = [];
  for (const yy of [y - 1, y, y + 1]) {
    for (const t of termsOf(yy) ?? []) if (t.type === 'jeol') candidates.push(t);
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => termEpoch(a.kst) - termEpoch(b.kst));

  let current = null, next = null;
  for (const t of candidates) {
    const ms = termEpoch(t.kst);
    if (ms <= epoch) current = t;
    else { next = t; break; }
  }
  if (!current) return null;

  const offset = ((current.branch - 2) % 12 + 12) % 12; // 인월=0
  return {
    stem: (2 + 2 * yearStem + offset) % 10,
    branch: current.branch,
    term: { name: current.name, kst: current.kst },
    nextTerm: next ? { name: next.name, kst: next.kst } : null,
  };
}

/**
 * 시주: 시지 12구간(23:00~00:59 자시) + 오서둔(일간→자시 천간).
 *  - 자시 천간 = (2×일간) % 10 … 갑기일 갑자, 을경일 병자, 병신일 무자, 정임일 경자, 무계일 임자
 */
export function hourPillar(hour, minute, dayStem) {
  if (hour === null || hour === undefined) return null;
  const idx = Math.floor(((hour + 1) % 24) / 2); // 자=0 … 해=11
  return {
    stem: (2 * dayStem + idx) % 10,
    branch: idx,
    lateNight: hour === 23, // 야자시 — 일주 경계 v1 미반영 고지 대상
  };
}

// ---------- 통합 ----------

/**
 * 생년월일(+선택 시각) → 사주 4주
 * @param {string} dateStr  "YYYY-MM-DD"
 * @param {string|null} timeStr "HH:MM" (선택)
 * @param {object} sajuDb   gwansang-data.json의 saju 블록
 */
export function computeSaju(dateStr, timeStr, sajuDb) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;

  const hasTime = !!(timeStr && /^\d{1,2}:\d{2}$/.test(timeStr));
  const [hh, mi] = hasTime ? timeStr.split(':').map(Number) : [null, null];

  const { from, to } = TERM_RANGE;
  if (y < from + 1 || y > to - 1) {
    return {
      error: 'out_of_range',
      message: `절기 정본 테이블 수록 범위(${from + 1}~${to - 1}년) 밖의 생년입니다. 월주·년주를 산출할 수 없어 사주를 표시하지 않습니다.`,
    };
  }

  // 시각 미입력 시 정오(12:00)를 계산 기준으로 쓰되, 경계일이면 그 사실을 명시한다.
  const epoch = kstToEpoch(y, m, d, hasTime ? hh : 12, hasTime ? mi : 0);

  const yp = yearPillar(epoch, y);
  const mp = monthPillar(epoch, y, yp.stem);
  const dp = dayPillar(y, m, d);
  const hp = hourPillar(hasTime ? hh : null, mi, dp.stem);

  const S = sajuDb.stems, B = sajuDb.branches;
  const label = (p) => `${S[p.stem].ko}${B[p.branch].ko}(${S[p.stem].hanja}${B[p.branch].hanja})`;

  // 경계 고지 — 시각 미입력 상태에서 절기 경계일/입춘 당일이면 판정이 갈릴 수 있다
  const warnings = [];
  const ymd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (!hasTime && yp.boundaryDay === ymd) {
    warnings.push(`출생일이 입춘 당일(${yp.ipchun.slice(11, 16)} KST)입니다. 태어난 시각에 따라 년주가 갈리므로 시각 입력을 권합니다.`);
  }
  if (!hasTime && mp && mp.term.kst.slice(0, 10) === ymd) {
    warnings.push(`출생일이 ${mp.term.name} 당일(${mp.term.kst.slice(11, 16)} KST)입니다. 태어난 시각에 따라 월주가 갈리므로 시각 입력을 권합니다.`);
  }
  if (hasTime && hh === 23) {
    warnings.push('야자시(23시대) 출생입니다. 본 판은 일주를 달력 날짜(00시) 기준으로 잡으므로, 일주를 다음 날로 넘기는 유파와 결과가 다를 수 있습니다.');
  }

  return {
    input: { y, m, d, time: hasTime ? timeStr : null },
    year: {
      ...yp, stem: S[yp.stem], branch: B[yp.branch],
      label: `${label(yp)}년`, animal: B[yp.branch].animal,
    },
    month: mp && {
      stem: S[mp.stem], branch: B[mp.branch],
      label: `${label(mp)}월`,
      term: mp.term, nextTerm: mp.nextTerm,
    },
    day: {
      stem: S[dp.stem], branch: B[dp.branch],
      label: `${label(dp)}일`,
    },
    hour: hp ? {
      stem: S[hp.stem], branch: B[hp.branch],
      label: `${label(hp)}시`, lateNight: hp.lateNight,
    } : null,
    hourMissing: hasTime ? null : '시주: 태어난 시각 미입력 — 3주(년·월·일)만 표시합니다.',
    dayElement: S[dp.stem].element, // 일간 오행 = 관상 오행과의 궁합 축
    warnings,
    source: SOLAR_TERMS.meta.source,
  };
}

/** 관상 오행(체) × 일간 오행(용) 관계 판정 — POC 이식 */
export function elementRelation(faceElem, dayElem, sajuDb) {
  const gen = sajuDb.generates;
  let key;
  if (faceElem === dayElem) key = 'same';
  else if (gen[faceElem] === dayElem) key = 'face_generates_day';
  else if (gen[dayElem] === faceElem) key = 'day_generates_face';
  else if (gen[gen[faceElem]] === dayElem) key = 'face_controls_day'; // 상극: 생을 건너뛴 관계
  else key = 'day_controls_face';
  return { key, ...sajuDb.relations[key] };
}
