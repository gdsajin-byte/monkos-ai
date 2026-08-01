// 약식 사주 계산 — 년주(입춘 근사) + 일주(60갑자)
// 앵커 검증: 1900-01-01 = 갑술일(index 10) → 2026-08-01 = 정미일 (만세력 공표값 일치, 2026-08-01 실측)

const DAY_ANCHOR_INDEX = 10; // 1900-01-01 = 갑술 (갑자=0)
const ANCHOR_UTC = Date.UTC(1900, 0, 1);
const MS_PER_DAY = 86400000;

// 60갑자 index → {stem: 0~9, branch: 0~11}
function ganjiOf(index) {
  const i = ((index % 60) + 60) % 60;
  return { stem: i % 10, branch: i % 12 };
}

// 일주: 날짜(현지 자정 기준, 자시 경계 미반영 — POC 캐비앳)
export function dayPillar(y, m, d) {
  const days = Math.round((Date.UTC(y, m - 1, d) - ANCHOR_UTC) / MS_PER_DAY);
  return ganjiOf(days + DAY_ANCHOR_INDEX);
}

// 년주: 입춘(2/4 고정 근사) 이전 출생은 전년도 간지
export function yearPillar(y, m, d) {
  const effYear = (m < 2 || (m === 2 && d < 4)) ? y - 1 : y;
  return { stem: ((effYear - 4) % 10 + 10) % 10, branch: ((effYear - 4) % 12 + 12) % 12, effYear };
}

// 통합: 생년월일 → 약식 사주 객체 (db.saju 테이블 참조)
export function computeSaju(dateStr, sajuDb) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;

  const yp = yearPillar(y, m, d);
  const dp = dayPillar(y, m, d);
  const S = sajuDb.stems, B = sajuDb.branches;

  return {
    input: { y, m, d },
    year: {
      stem: S[yp.stem], branch: B[yp.branch],
      label: `${S[yp.stem].ko}${B[yp.branch].ko}(${S[yp.stem].hanja}${B[yp.branch].hanja})년`,
      animal: B[yp.branch].animal,
      springAdjusted: yp.effYear !== y
    },
    day: {
      stem: S[dp.stem], branch: B[dp.branch],
      label: `${S[dp.stem].ko}${B[dp.branch].ko}(${S[dp.stem].hanja}${B[dp.branch].hanja})일`
    },
    dayElement: S[dp.stem].element // 일간 오행 = 관상 오행과의 궁합 축
  };
}

// 관상 오행(체) × 일간 오행(용) 관계 판정
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
