/**
 * 콜스코프 판독 정규화 — 순수 함수 검증 (PF_RND PoC, 2026-10-05)
 * 모델 호출은 대상 아님. 요금·예약 시각·캡처 시각·목록/상세 병합·중복 키.
 */
import { parseFare, parseReserved, resolveCapturedAt, mergeItems, normalizeExtraction, dedupeKey } from '../lib/callscope/extract.js';

// 2026-10-05 13:39 KST
const CAP = Date.UTC(2026, 9, 5, 4, 39);

describe('parseFare', () => {
  test.each([
    ['35K', 35000], ['45k', 45000], ['3.5만', 35000], ['45,000원', 45000], ['35', 35000], ['17000', 17000],
  ])('%s → %i', (raw, want) => expect(parseFare(raw)).toBe(want));
  test('해석 불가는 null', () => {
    expect(parseFare('협의')).toBeNull();
    expect(parseFare(null)).toBeNull();
  });
});

describe('parseReserved', () => {
  test('날짜+시각', () => expect(parseReserved('10.6화)07:30', CAP)).toBe('2026-10-06 07:30'));
  test('시각만이면 캡처 날짜', () => expect(parseReserved('14:10', CAP)).toBe('2026-10-05 14:10'));
  test('연말에 본 내년 초 예약', () => expect(parseReserved('1.2금)08:00', Date.UTC(2026, 11, 30, 3, 0))).toBe('2027-01-02 08:00'));
  test('시각이 없으면 null', () => {
    expect(parseReserved('예약', CAP)).toBeNull();
    expect(parseReserved(null, CAP)).toBeNull();
    expect(parseReserved('25:99', CAP)).toBeNull();
  });
});

describe('resolveCapturedAt', () => {
  test('상태바 시계 우선', () => {
    const r = resolveCapturedAt({ statusbarTime: '13:39', fileMtimeMs: CAP - 3600e3, uploadMs: CAP + 120e3 });
    expect(r).toEqual({ ms: CAP, source: 'statusbar' });
  });
  test('상태바가 업로드보다 미래면 전날', () => {
    const r = resolveCapturedAt({ statusbarTime: '23:50', uploadMs: CAP });
    expect(r.ms).toBe(Date.UTC(2026, 9, 4, 14, 50));
  });
  test('상태바 없으면 파일 시각, 그것도 없으면 업로드 시각', () => {
    expect(resolveCapturedAt({ statusbarTime: null, fileMtimeMs: CAP - 600e3, uploadMs: CAP }).source).toBe('file_mtime');
    expect(resolveCapturedAt({ statusbarTime: null, fileMtimeMs: CAP, uploadMs: CAP })).toEqual({ ms: CAP, source: 'upload' });
  });
});

const row = (over = {}) => ({
  view: 'list', pickup_km: 17, fare_raw: '35K', pay_tags: ['후불'], badges: [], source_co: '청', memo_raw: null,
  conditions: [], reserved_raw: null, pickup_text: '용인동천동', dropoff_text: '화성능동', trip_min: 31,
  unknown_tokens: [], confidence: { fare: 0.9 }, ...over,
});

describe('mergeItems', () => {
  test('상세는 지목한 목록 행에 합쳐진다 — 상세 값 우선, 배열은 합집합', () => {
    const out = mergeItems([
      row(), row({ pickup_text: '하남풍산동', fare_raw: '20K' }),
      { view: 'detail', same_as_list_index: 0, pay_tags: ['법'], badges: ['추천콜'], conditions: ['상담'], unknown_tokens: ['셀퍼만'],
        memo_raw: '청/상담', reserved_raw: '10.6화)07:30', pickup_text: '용인동천동.수지수풍로89', confidence: { pickup_text: 0.95 } },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].views).toEqual(['list', 'detail']);
    expect(out[0].pickup_text).toBe('용인동천동.수지수풍로89');
    expect(out[0].fare_raw).toBe('35K');
    expect(out[0].pay_tags).toEqual(['후불', '법']);
    expect(out[0].unknown_tokens).toEqual(['셀퍼만']);
  });
  test('짝을 모르는 상세는 따로 1건', () => {
    const out = mergeItems([row(), { view: 'detail', same_as_list_index: null, pay_tags: [], badges: [], conditions: [], unknown_tokens: [] }]);
    expect(out).toHaveLength(2);
  });
});

describe('normalizeExtraction', () => {
  const raw = { app: '콜마너', statusbar_time: '13:39', region_header: '경기/하남시/풍산동', radius_setting: '30km', items: [row({ reserved_raw: '10.6화)07:30' }), row({ fare_raw: '협의' })] };
  const out = normalizeExtraction(raw, { appHint: 'auto', uploadMs: CAP + 60e3 });

  test('요금·예약 정규화와 캡처 시각 출처', () => {
    expect(out.captured_at_source).toBe('statusbar');
    expect(out.calls[0].fare_krw).toBe(35000);
    expect(out.calls[0].reserved_at).toBe('2026-10-06 07:30');
    expect(out.calls[0].region_header).toBe('경기/하남시/풍산동');
  });
  test('원문은 있는데 해석 못 한 칸은 신뢰도 0 + 원문 보존', () => {
    expect(out.calls[1].fare_krw).toBeNull();
    expect(out.calls[1].fare_raw).toBe('협의');
    expect(out.calls[1].confidence.fare).toBe(0);
  });
  test('모델이 앱을 못 정하면 수동 지정, 그것도 없으면 unknown', () => {
    expect(normalizeExtraction({ app: 'unknown', items: [] }, { appHint: '티맵', uploadMs: CAP }).app).toBe('티맵');
    expect(normalizeExtraction({ app: 'unknown', items: [] }, { appHint: 'auto', uploadMs: CAP }).app).toBe('unknown');
  });
});

describe('dedupeKey', () => {
  const base = { app: '콜마너', source_co: '청', pickup_text: '용인동천동.수지수풍로89', dropoff_text: '화성능동', fare_krw: 35000, reserved_at: null };
  test('공백·구두점 차이는 같은 콜', () => {
    expect(dedupeKey({ ...base, pickup_text: '용인동천동 수지수풍로 89' })).toBe(dedupeKey(base));
  });
  test('요금·예약이 다르면 다른 콜', () => {
    expect(dedupeKey({ ...base, fare_krw: 40000 })).not.toBe(dedupeKey(base));
    expect(dedupeKey({ ...base, reserved_at: '2026-10-06 07:30' })).not.toBe(dedupeKey(base));
  });
});
