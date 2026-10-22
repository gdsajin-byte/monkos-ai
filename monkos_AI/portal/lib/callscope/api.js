/**
 * 콜스코프 어드민 API — PF_RND 수집 PoC (어드민 비공개, 내부 도구)
 *
 *  - POST /api/admin/callscope/ingest : 캡처 1장(base64) → 판독 → 콜 저장. 원본 이미지는 저장하지 않는다
 *  - GET  /api/admin/callscope/calls  : 콜 목록 + 요약(앱·회사별, 미상 약어, 정확도, 처리 시간)
 *  - POST /api/admin/callscope/verify : 필드별 정답 표기(맞음/틀림/해제)
 *  - POST /api/admin/callscope/timing : 화면 표시까지 걸린 시간(브라우저 실측) 기록
 *
 * 콜에는 고객 주소가 담긴다 — 전 경로 requireAdmin 뒤, 로그에는 건수·시간만 남기고 본문은 남기지 않는다.
 */
import { FieldValue } from '@google-cloud/firestore';
import { requireAdmin } from '../cms/admin-auth.js';
import { ai, firestore, log, CALLSCOPE_MODEL, CALLSCOPE_TIMEOUT_MS } from '../shared/config.js';
import { extractFromImage, normalizeExtraction, APPS, VERIFY_FIELDS, GLOSSARY } from './extract.js';

const COLLECTION = 'mina_callscope';
const MAX_BODY_BYTES = 14 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const LIST_LIMIT = 1000;

const col = () => firestore.collection(COLLECTION);

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) { const e = new Error('too_large'); e.status = 413; throw e; }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** 콜 1건 저장 — 이미 있으면 재등장 시각만 쌓는다 */
async function upsertCall(call, captureId, capturedMs) {
  const ref = col().doc(`call_${call.key}`);
  const snap = await ref.get();
  if (snap.exists) {
    const prev = snap.data();
    const patch = {
      seen_at: FieldValue.arrayUnion(capturedMs),
      capture_ids: FieldValue.arrayUnion(captureId),
      last_seen_ms: Math.max(prev.last_seen_ms || 0, capturedMs),
      first_seen_ms: Math.min(prev.first_seen_ms || capturedMs, capturedMs),
    };
    if (call.unknown_tokens.length) patch.unknown_tokens = FieldValue.arrayUnion(...call.unknown_tokens);
    // 목록에서만 봤던 콜을 상세로 다시 보면 비어 있던 칸을 채운다 (값이 있던 칸은 건드리지 않는다)
    for (const k of ['pickup_km', 'trip_min', 'memo_raw', 'source_co', 'reserved_raw']) {
      if (prev[k] == null && call[k] != null) patch[k] = call[k];
    }
    await ref.update(patch);
    return { id: ref.id, duplicate: true };
  }
  await ref.set({
    kind: 'call', ...call,
    seen_at: [capturedMs], capture_ids: [captureId],
    first_seen_ms: capturedMs, last_seen_ms: capturedMs,
    verify: {}, created_ms: Date.now(),
  });
  return { id: ref.id, duplicate: false };
}

/** POST /api/admin/callscope/ingest — { image_b64, mime, app_hint?, file_mtime_ms? } */
export async function handleCallscopeIngest(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const t0 = Date.now();

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return json(res, e.status || 400, { error: e.status === 413 ? 'too_large' : 'bad_json', message: e.status === 413 ? '이미지가 너무 큽니다 (최대 약 10MB).' : '요청 본문을 읽지 못했습니다.' });
  }
  const { image_b64: imageBase64, mime, app_hint: appHintRaw, file_mtime_ms: fileMtimeMs } = body || {};
  if (!imageBase64 || typeof imageBase64 !== 'string') return json(res, 400, { error: 'no_image', message: '이미지가 없습니다.' });
  if (!ALLOWED_MIMES.includes(mime)) return json(res, 400, { error: 'bad_mime', message: `지원하지 않는 형식입니다: ${mime}` });
  const appHint = APPS.includes(appHintRaw) ? appHintRaw : 'auto';

  const captureRef = col().doc();
  const captureBase = { kind: 'capture', uploaded_ms: t0, uploaded_by: admin.userId, app_hint: appHint, bytes: Math.round(imageBase64.length * 0.75) };

  let raw;
  const tx0 = Date.now();
  try {
    raw = await extractFromImage({ ai, model: CALLSCOPE_MODEL, imageBase64, mimeType: mime, appHint, timeoutMs: CALLSCOPE_TIMEOUT_MS });
  } catch (e) {
    const ms = Date.now() - t0;
    log(`[Callscope] 판독 실패 ${ms}ms — ${e.message}`, 'ERROR');
    await captureRef.set({ ...captureBase, status: 'failed', error: String(e.message).slice(0, 300), ms_total: ms }).catch(() => {});
    return json(res, 502, { error: 'extract_failed', message: `판독에 실패했습니다: ${e.message}`, capture_id: captureRef.id });
  }
  const msExtract = Date.now() - tx0;

  const result = normalizeExtraction(raw, { appHint, fileMtimeMs: Number(fileMtimeMs), uploadMs: t0 });
  const saved = [];
  try {
    for (const call of result.calls) {
      const r = await upsertCall(call, captureRef.id, result.captured_at_ms);
      saved.push({ ...call, id: r.id, duplicate: r.duplicate });
    }
    const msTotal = Date.now() - t0;
    await captureRef.set({
      ...captureBase,
      status: result.calls.length ? 'ok' : 'empty',
      app: result.app,
      captured_at_ms: result.captured_at_ms,
      captured_at_source: result.captured_at_source,
      calls: result.calls.length,
      duplicates: saved.filter(s => s.duplicate).length,
      unreadable_note: result.unreadable_note,
      ms_extract: msExtract, ms_total: msTotal,
    });
    log(`[Callscope] 판독 ${result.app} 콜 ${result.calls.length}건(중복 ${saved.filter(s => s.duplicate).length}) ${msTotal}ms`, 'INFO');
    json(res, 200, {
      capture_id: captureRef.id, app: result.app,
      captured_at_ms: result.captured_at_ms, captured_at_source: result.captured_at_source,
      calls: saved, unreadable_note: result.unreadable_note,
      ms_extract: msExtract, ms_total: msTotal,
    });
  } catch (e) {
    log(`[Callscope] 저장 실패 — ${e.message}`, 'ERROR');
    json(res, 500, { error: 'store_failed', message: `판독은 됐지만 저장에 실패했습니다: ${e.message}` });
  }
}

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

/** 콜·캡처 문서 → 요약 (순수 함수) */
export function summarize(calls, captures) {
  const group = keyFn => {
    const m = new Map();
    for (const c of calls) {
      const k = keyFn(c);
      const g = m.get(k) || { key: k, count: 0, fareSum: 0, fareN: 0, reserved: 0 };
      g.count++; if (c.fare_krw != null) { g.fareSum += c.fare_krw; g.fareN++; } if (c.reserved_at) g.reserved++;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.count - a.count).map(g => ({
      key: g.key, count: g.count, avg_fare: g.fareN ? Math.round(g.fareSum / g.fareN) : null, reserved_ratio: +(g.reserved / g.count).toFixed(2),
    }));
  };
  const tokens = new Map();
  for (const c of calls) for (const t of c.unknown_tokens || []) tokens.set(t, (tokens.get(t) || 0) + 1);

  const accuracy = {};
  for (const c of calls) {
    for (const f of VERIFY_FIELDS) {
      const v = c.verify?.[f];
      if (v !== true && v !== false) continue;
      const a = (accuracy[c.app] ||= {});
      const cell = (a[f] ||= { ok: 0, total: 0 });
      cell.total++; if (v) cell.ok++;
    }
  }
  const okCaps = captures.filter(c => c.status === 'ok' || c.status === 'empty');
  const serverMs = okCaps.map(c => c.ms_total).filter(Number.isFinite);
  const clientMs = okCaps.map(c => c.client_ms).filter(Number.isFinite);
  return {
    total_calls: calls.length,
    immediate: calls.filter(c => !c.reserved_at).length,
    reserved: calls.filter(c => c.reserved_at).length,
    multi_seen: calls.filter(c => (c.seen_at || []).length > 1).length,
    by_app: group(c => c.app),
    by_source_co: group(c => c.source_co || '(없음)'),
    unknown_tokens: [...tokens.entries()].sort((a, b) => b[1] - a[1]).map(([token, count]) => ({ token, count })),
    accuracy,
    captures: {
      total: captures.length,
      failed: captures.filter(c => c.status === 'failed').length,
      empty: captures.filter(c => c.status === 'empty').length,
      by_app: captures.reduce((m, c) => { const k = c.app || '(판독 실패)'; m[k] = (m[k] || 0) + 1; return m; }, {}),
      server_ms: { median: median(serverMs), max: serverMs.length ? Math.max(...serverMs) : null, n: serverMs.length },
      client_ms: { median: median(clientMs), max: clientMs.length ? Math.max(...clientMs) : null, n: clientMs.length },
    },
  };
}

/** GET /api/admin/callscope/calls */
export async function handleCallscopeCalls(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const [callSnap, capSnap] = await Promise.all([
      col().where('kind', '==', 'call').limit(LIST_LIMIT).get(),
      col().where('kind', '==', 'capture').limit(LIST_LIMIT).get(),
    ]);
    const calls = callSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.last_seen_ms || 0) - (a.last_seen_ms || 0));
    const captures = capSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    json(res, 200, {
      calls, summary: summarize(calls, captures),
      verify_fields: VERIFY_FIELDS, glossary: GLOSSARY.terms,
      truncated: callSnap.size >= LIST_LIMIT,
    });
  } catch (e) {
    log(`[Callscope] 목록 조회 실패 — ${e.message}`, 'ERROR');
    json(res, 500, { error: 'list_failed', message: `콜 목록을 불러오지 못했습니다: ${e.message}` });
  }
}

/** POST /api/admin/callscope/verify — { id, field, ok: true|false|null } */
export async function handleCallscopeVerify(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const { id, field, ok } = await readJson(req);
    if (typeof id !== 'string' || !id.startsWith('call_') || !VERIFY_FIELDS.includes(field) || ![true, false, null].includes(ok)) {
      return json(res, 400, { error: 'bad_request', message: '표기 대상이 올바르지 않습니다.' });
    }
    await col().doc(id).update({ [`verify.${field}`]: ok === null ? FieldValue.delete() : ok });
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, 500, { error: 'verify_failed', message: `정답 표기를 저장하지 못했습니다: ${e.message}` });
  }
}

/** POST /api/admin/callscope/timing — { capture_id, client_ms } */
export async function handleCallscopeTiming(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const { capture_id: id, client_ms: ms } = await readJson(req);
    if (typeof id !== 'string' || !/^[A-Za-z0-9]{10,40}$/.test(id) || !Number.isFinite(ms) || ms < 0 || ms > 600000) {
      return json(res, 400, { error: 'bad_request' });
    }
    await col().doc(id).update({ client_ms: Math.round(ms) });
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, 500, { error: 'timing_failed', message: e.message });
  }
}
