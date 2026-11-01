/**
 * 콜스코프 판독 — 대리 기사앱 캡처 1장 → 콜 N건 (PF_RND PoC, 어드민 비공개)
 *
 * 입력은 이미지뿐이다. 기사앱에 대한 입력·조작은 없다.
 * 모델 호출(extractFromImage)과 순수 정규화(normalize*·mergeItems·dedupeKey)를 분리한다 —
 * 안드로이드 접근성 수집기로 넘어가면 모델 호출부만 바뀌고 아래 순수 함수는 그대로 쓴다.
 */
import { createHash } from 'crypto';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
export const GLOSSARY = _require('./glossary.json');

export const APPS = ['콜마너', '카카오', '티맵', 'unknown'];

/** 정확도 측정 대상 필드 (지시서 5절) */
export const VERIFY_FIELDS = ['pickup_km', 'fare_krw', 'pay_tags', 'source_co', 'reserved_at', 'pickup_text', 'dropoff_text', 'trip_min'];

const CONF_FIELDS = ['pickup_km', 'fare', 'pay_tags', 'source_co', 'reserved', 'pickup_text', 'dropoff_text', 'trip_min'];

export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    app: { type: 'STRING', enum: APPS },
    statusbar_time: { type: 'STRING', nullable: true },
    region_header: { type: 'STRING', nullable: true },
    radius_setting: { type: 'STRING', nullable: true },
    unreadable_note: { type: 'STRING', nullable: true },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          view: { type: 'STRING', enum: ['list', 'detail'] },
          same_as_list_index: { type: 'INTEGER', nullable: true },
          pickup_km: { type: 'NUMBER', nullable: true },
          fare_raw: { type: 'STRING', nullable: true },
          pay_tags: { type: 'ARRAY', items: { type: 'STRING' } },
          badges: { type: 'ARRAY', items: { type: 'STRING' } },
          source_co: { type: 'STRING', nullable: true },
          memo_raw: { type: 'STRING', nullable: true },
          conditions: { type: 'ARRAY', items: { type: 'STRING' } },
          reserved_raw: { type: 'STRING', nullable: true },
          pickup_text: { type: 'STRING', nullable: true },
          dropoff_text: { type: 'STRING', nullable: true },
          trip_min: { type: 'NUMBER', nullable: true },
          unknown_tokens: { type: 'ARRAY', items: { type: 'STRING' } },
          confidence: {
            type: 'OBJECT',
            properties: Object.fromEntries(CONF_FIELDS.map(f => [f, { type: 'NUMBER' }])),
          },
        },
        required: ['view', 'pay_tags', 'badges', 'conditions', 'unknown_tokens'],
      },
    },
  },
  required: ['app', 'items'],
};

export function buildPrompt(appHint) {
  const known = GLOSSARY.terms
    .filter(t => t.status !== 'unknown')
    .map(t => `${t.token}=${t.meaning}${t.status === 'assumed' ? '(추정)' : ''}`)
    .join(', ');
  const hint = appHint && appHint !== 'auto' ? `\n사용자가 지정한 앱: ${appHint} (화면과 명백히 다르면 화면을 따른다).` : '';
  return `이 이미지는 한국 대리운전 기사용 앱(콜마너 / 카카오 T 대리 / 티맵 대리)의 화면 캡처다. 화면에 보이는 콜(운행 요청)을 전부 구조화해서 JSON으로 답하라.${hint}

원칙
- 화면에 실제로 보이는 글자만 옮긴다. 보이지 않는 값은 추측하지 말고 null. 잘린 글자는 보이는 데까지만.
- 목록의 각 행은 view="list" 1건. 상세 팝업·상세 화면이 있으면 view="detail" 1건을 따로 낸다. 그 상세가 목록의 어느 행과 같은 콜이면 same_as_list_index에 그 행의 0부터 센 순번을 적는다(목록 행만 센 순번). 모르면 null.
- app: 화면 형식으로 판별. 세 앱 어느 것인지 확신이 없으면 "unknown".
- statusbar_time: 화면 맨 위 상태바의 시계(HH:MM). 없으면 null.
- region_header: 화면 상단의 현재 위치 표시(예: 경기/하남시/풍산동). radius_setting: 범위 설정(예: 30km).
- pickup_km: 기사 현재 위치에서 출발지까지 거리(km) 숫자.
- fare_raw: 요금 표기를 보이는 그대로(예: "35K", "45,000원").
- pay_tags: 결제·계약 표기를 보이는 그대로 배열로(예: 후불, 법, 즉후, 후, 카드, 현금). 약어를 풀어 쓰지 않는다 — "후"라고 적혀 있으면 "후".
- badges: 추천콜 같은 배지.
- memo_raw: 메모·요청사항 칸 원문을 한 글자도 바꾸지 말고 그대로.
- source_co: 메모 맨 앞의 출처 회사 약칭(예: 메모가 "청/상담…"이면 "청"). 없으면 null.
- conditions: 메모에서 읽히는 조건(예: 상담, 비흡연, 경유).
- reserved_raw: 예약 일시 표기를 보이는 그대로(예: "10.6화)07:30", "14:10"). 예약 표기가 없으면 null — 즉시 콜이다.
- pickup_text / dropoff_text: 출발지 / 도착지 원문 그대로.
- trip_min: 예상 운행 시간(분).
- unknown_tokens: 메모·태그에서 뜻을 알 수 없는 약어. 버리지 말고 전부 적는다.
- confidence: 각 필드를 얼마나 확실히 읽었는지 0~1. 글자가 작거나 가려졌으면 낮게.
- 콜 화면이 아니거나 전혀 읽을 수 없으면 items를 빈 배열로 두고 unreadable_note에 이유를 적는다.

알려진 약어: ${known}`;
}

/** "35K" / "45,000원" / "3.5만" → 원 단위 정수. 해석 불가면 null */
export function parseFare(raw) {
  if (raw == null) return null;
  const s = String(raw).replace(/[\s,]/g, '');
  let m = s.match(/^(\d+(?:\.\d+)?)[kK]/);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  m = s.match(/^(\d+(?:\.\d+)?)만/);
  if (m) return Math.round(parseFloat(m[1]) * 10000);
  m = s.match(/^(\d+)원?$/);
  if (m) {
    const n = parseInt(m[1], 10);
    // 기사앱 목록은 천 원 단위 숫자만 적는 형식이 흔하다 — 3자리 이하는 천 원 단위로 본다
    return n < 1000 ? n * 1000 : n;
  }
  return null;
}

const pad = n => String(n).padStart(2, '0');

/** epoch ms → KST 벽시계 { y, mo, d, h, mi } */
export function kstParts(ms) {
  const d = new Date(ms + 9 * 3600 * 1000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
}

/**
 * 예약 표기 → "YYYY-MM-DD HH:MM"(KST). 날짜가 없으면 캡처 날짜를 쓴다.
 * 해석 불가면 null (원문은 reserved_raw에 남는다 — 무음 폐기 아님).
 */
export function parseReserved(raw, capturedMs) {
  if (!raw) return null;
  const s = String(raw);
  const time = s.match(/(\d{1,2}):(\d{2})/);
  if (!time) return null;
  const h = parseInt(time[1], 10), mi = parseInt(time[2], 10);
  if (h > 23 || mi > 59) return null;
  const cap = kstParts(capturedMs);
  let y = cap.y, mo = cap.mo, d = cap.d;
  const date = s.match(/(\d{1,2})[./월]\s?(\d{1,2})/);
  // "07:30"의 07·30이 날짜로 잡히지 않도록, 날짜 패턴은 시각보다 앞에 있을 때만 인정
  if (date && s.indexOf(date[0]) < s.indexOf(time[0])) {
    mo = parseInt(date[1], 10); d = parseInt(date[2], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    if (mo < cap.mo - 6) y += 1; // 연말에 본 내년 초 예약
  }
  return `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)}`;
}

/** 캡처 시각 결정 — 상태바 시계 → 파일 수정 시각 → 업로드 시각. 출처를 함께 돌려준다 */
export function resolveCapturedAt({ statusbarTime, fileMtimeMs, uploadMs }) {
  const m = statusbarTime && String(statusbarTime).match(/(\d{1,2}):(\d{2})/);
  if (m) {
    const up = kstParts(uploadMs);
    const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
    if (h <= 23 && mi <= 59) {
      let ms = Date.UTC(up.y, up.mo - 1, up.d, h, mi) - 9 * 3600 * 1000;
      if (ms > uploadMs + 5 * 60 * 1000) ms -= 24 * 3600 * 1000; // 상태바 시각이 업로드보다 미래면 전날 캡처
      return { ms, source: 'statusbar' };
    }
  }
  if (Number.isFinite(fileMtimeMs) && fileMtimeMs > 0 && fileMtimeMs < uploadMs - 60 * 1000) {
    return { ms: fileMtimeMs, source: 'file_mtime' };
  }
  return { ms: uploadMs, source: 'upload' };
}

const norm = s => (s == null ? '' : String(s).replace(/[\s.,()\[\]/·-]/g, '').toLowerCase());

/** 중복 키 = app + source_co + pickup_text + dropoff_text + fare_krw + reserved_at (지시서 3-3) */
export function dedupeKey(c) {
  const basis = [c.app, norm(c.source_co), norm(c.pickup_text), norm(c.dropoff_text), c.fare_krw ?? '', c.reserved_at ?? ''].join('|');
  return createHash('sha1').update(basis).digest('hex').slice(0, 24);
}

const uniq = a => [...new Set((a || []).map(x => String(x).trim()).filter(Boolean))];

/** 같은 콜의 목록 행 + 상세를 1건으로 — 상세 값 우선, 없는 칸은 목록 값 */
function mergePair(row, detail) {
  const out = { ...row };
  for (const k of ['pickup_km', 'fare_raw', 'source_co', 'memo_raw', 'reserved_raw', 'pickup_text', 'dropoff_text', 'trip_min']) {
    if (detail[k] != null && detail[k] !== '') out[k] = detail[k];
  }
  for (const k of ['pay_tags', 'badges', 'conditions', 'unknown_tokens']) out[k] = uniq([...(row[k] || []), ...(detail[k] || [])]);
  out.confidence = { ...(row.confidence || {}) };
  for (const [k, v] of Object.entries(detail.confidence || {})) {
    if (detail[k === 'fare' ? 'fare_raw' : k === 'reserved' ? 'reserved_raw' : k] != null) out.confidence[k] = v;
  }
  out.views = ['list', 'detail'];
  return out;
}

/** 모델 원출력 items → 목록·상세 병합된 배열 */
export function mergeItems(items) {
  const rows = [], details = [];
  for (const it of items || []) (it.view === 'detail' ? details : rows).push({ ...it, views: [it.view] });
  for (const d of details) {
    const i = d.same_as_list_index;
    if (Number.isInteger(i) && i >= 0 && i < rows.length && !rows[i].views.includes('detail')) rows[i] = mergePair(rows[i], d);
    else rows.push(d);
  }
  return rows;
}

const num = v => (Number.isFinite(v) ? v : null);
const str = v => (v == null || String(v).trim() === '' ? null : String(v).trim());

/** 모델 원출력 1장분 → 저장용 콜 배열 */
export function normalizeExtraction(raw, { appHint, fileMtimeMs, uploadMs }) {
  const app = APPS.includes(raw?.app) && raw.app !== 'unknown'
    ? raw.app
    : (APPS.includes(appHint) && appHint !== 'unknown' ? appHint : 'unknown');
  const captured = resolveCapturedAt({ statusbarTime: raw?.statusbar_time, fileMtimeMs, uploadMs });
  const calls = mergeItems(raw?.items).map(it => {
    const fareKrw = parseFare(it.fare_raw);
    const reservedAt = parseReserved(it.reserved_raw, captured.ms);
    const conf = {};
    for (const f of CONF_FIELDS) if (Number.isFinite(it.confidence?.[f])) conf[f] = Math.max(0, Math.min(1, it.confidence[f]));
    // 원문은 있는데 정규화에 실패한 칸은 신뢰도 0 — 화면에서 강조되도록
    if (it.fare_raw && fareKrw == null) conf.fare = 0;
    if (it.reserved_raw && reservedAt == null) conf.reserved = 0;
    // 값을 못 읽은 칸의 신뢰도는 의미가 없다 — 지운다
    if (it.pickup_km == null) delete conf.pickup_km;
    if (it.trip_min == null) delete conf.trip_min;
    if (!it.fare_raw) delete conf.fare;
    if (!it.reserved_raw) delete conf.reserved;
    if (!it.source_co) delete conf.source_co;
    if (!it.pickup_text) delete conf.pickup_text;
    if (!it.dropoff_text) delete conf.dropoff_text;
    const call = {
      app,
      pickup_km: num(it.pickup_km),
      fare_raw: str(it.fare_raw),
      fare_krw: fareKrw,
      pay_tags: uniq(it.pay_tags),
      badges: uniq(it.badges),
      source_co: str(it.source_co),
      memo_raw: str(it.memo_raw),
      conditions: uniq(it.conditions),
      reserved_raw: str(it.reserved_raw),
      reserved_at: reservedAt,
      pickup_text: str(it.pickup_text),
      dropoff_text: str(it.dropoff_text),
      trip_min: num(it.trip_min),
      region_header: str(raw?.region_header),
      radius_setting: str(raw?.radius_setting),
      unknown_tokens: uniq(it.unknown_tokens),
      confidence: conf,
      views: it.views,
    };
    call.key = dedupeKey(call);
    return call;
  });
  return { app, captured_at_ms: captured.ms, captured_at_source: captured.source, calls, unreadable_note: str(raw?.unreadable_note) };
}

/** 이미지 1장 판독 — 모델 호출. 실패는 던진다(무음 강등 금지) */
export async function extractFromImage({ ai, model, imageBase64, mimeType, appHint, timeoutMs }) {
  let resp;
  try {
    resp = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: buildPrompt(appHint) }] }],
      // 사고(thinking) 최소 — 글자 옮기기 작업이라 이득이 없고 응답만 늦어진다 (10-05 합성 캡처 실측: 켬 14.3초)
      // 3.x는 thinkingBudget 미지원(400 "Thinking budget is not supported") → thinkingLevel MINIMAL (10-22 실측)
      config: {
        temperature: 0, maxOutputTokens: 16384, responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA, thinkingConfig: { thinkingLevel: 'MINIMAL' },
        ...(timeoutMs ? { abortSignal: AbortSignal.timeout(timeoutMs) } : {}),
      },
    });
  } catch (e) {
    // 시간 초과·429는 원인을 그대로 밝힌다 (내부 도구 — 건너뛰지 않고 명시 오류)
    // SDK가 송신 중 중단을 'exception AbortError: … sending request' 일반 Error로 감싸는 경우가 있어 메시지도 본다(10-22 실측)
    if (e?.name === 'AbortError' || e?.name === 'TimeoutError' || /AbortError|TimeoutError|aborted/i.test(e?.message || '')) throw new Error(`판독 시간 초과 (${Math.round(timeoutMs / 1000)}초)`);
    if (e?.status === 429) throw new Error('판독 요청 한도 초과 (429) — 잠시 후 다시 시도');
    throw e;
  }
  const text = (resp.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) {
    const reason = resp.candidates?.[0]?.finishReason || resp.promptFeedback?.blockReason || 'empty';
    throw new Error(`판독 응답이 비어 있습니다 (${reason})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`판독 응답이 JSON이 아닙니다 (finish=${resp.candidates?.[0]?.finishReason || '?'}, ${text.length}자)`);
  }
}
