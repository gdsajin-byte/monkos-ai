/* callscope.js — 콜스코프 어드민 (PF_RND PoC). 캡처 업로드 → 판독 결과 열람 → 필드별 정답 표기 */

const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

const LOW_CONF = 0.7;
const MAX_EDGE = 2600;
const FIELD_LABEL = {
  pickup_km: '거리', fare_krw: '요금', pay_tags: '결제', source_co: '회사',
  reserved_at: '예약', pickup_text: '출발', dropoff_text: '도착', trip_min: '운행',
};
// 정답 표기 필드 → 신뢰도 키
const CONF_KEY = { fare_krw: 'fare', reserved_at: 'reserved' };

let state = { calls: [], summary: null, verifyFields: [], tab: 'immediate' };

async function api(url, options = {}) {
  const r = await fetch(url, { credentials: 'include', ...options });
  if (r.status === 401) { location.href = '/admin/'; throw new Error('로그인이 필요합니다'); }
  return r;
}

function kst(ms, withDate = true) {
  if (!Number.isFinite(ms)) return '';
  const d = new Date(ms + 9 * 3600 * 1000);
  const p = n => String(n).padStart(2, '0');
  const hm = `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  return withDate ? `${d.getUTCMonth() + 1}.${d.getUTCDate()} ${hm}` : hm;
}

const won = n => (n == null ? '—' : `${n.toLocaleString('ko-KR')}원`);

/** 캡처를 JPEG로 변환 — 전송량을 줄이고 형식을 통일한다. 원본은 브라우저 밖으로 나가지 않는다 */
async function toJpegBase64(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

function fieldValue(c, f) {
  switch (f) {
    case 'pickup_km': return c.pickup_km == null ? '—' : `${c.pickup_km}km`;
    case 'fare_krw': return c.fare_krw == null ? (c.fare_raw ? `${c.fare_raw} (해석 불가)` : '—') : won(c.fare_krw);
    case 'pay_tags': return c.pay_tags?.length ? c.pay_tags.join('·') : '—';
    case 'source_co': return c.source_co || '—';
    case 'reserved_at': return c.reserved_at || (c.reserved_raw ? `${c.reserved_raw} (해석 불가)` : '즉시');
    case 'trip_min': return c.trip_min == null ? '—' : `${c.trip_min}분`;
    default: return c[f] || '—';
  }
}

function chip(c, f) {
  const v = c.verify?.[f];
  const conf = c.confidence?.[CONF_KEY[f] || f];
  const cls = v === true ? 'ok' : v === false ? 'bad' : (Number.isFinite(conf) && conf < LOW_CONF ? 'low' : '');
  const mark = v === true ? '✓ ' : v === false ? '✗ ' : '';
  const confTxt = Number.isFinite(conf) ? ` · 신뢰도 ${Math.round(conf * 100)}%` : '';
  return `<button class="chip ${cls}" data-id="${esc(c.id)}" data-field="${f}" title="${esc(FIELD_LABEL[f])}${confTxt}">` +
    `<span class="k">${mark}${esc(FIELD_LABEL[f])}</span><span>${esc(fieldValue(c, f))}</span></button>`;
}

function card(c) {
  const seen = (c.seen_at || []).slice().sort((a, b) => a - b);
  const seenTxt = seen.length > 1
    ? `${seen.length}회 등장 (${kst(seen[0])} ~ ${kst(seen[seen.length - 1], false)})`
    : `${kst(c.last_seen_ms)} 캡처`;
  const tags = [...(c.badges || []), ...(c.conditions || [])].map(t => `<span class="tag">${esc(t)}</span>`).join(' ');
  const unknown = (c.unknown_tokens || []).map(t => `<span class="tag" style="background:#fde68a">? ${esc(t)}</span>`).join(' ');
  return `<article class="bg-white rounded-xl border border-stone-200 p-3">
    <div class="flex items-center gap-2 text-xs text-stone-500 mb-2">
      <span class="font-semibold text-stone-900">${esc(c.app)}</span>
      <span>${esc(seenTxt)}</span>
      ${c.views?.includes('detail') ? '<span class="tag">상세 포함</span>' : ''}
      ${c.region_header ? `<span class="ml-auto truncate">${esc(c.region_header)}${c.radius_setting ? ' · ' + esc(c.radius_setting) : ''}</span>` : ''}
    </div>
    <div class="flex flex-wrap gap-1.5">${state.verifyFields.map(f => chip(c, f)).join('')}</div>
    ${tags || unknown ? `<div class="flex flex-wrap gap-1 mt-2">${tags} ${unknown}</div>` : ''}
    ${c.memo_raw ? `<details class="mt-2 text-xs text-stone-600"><summary class="cursor-pointer text-stone-500">메모 원문</summary><p class="mt-1 break-all">${esc(c.memo_raw)}</p></details>` : ''}
  </article>`;
}

function table(title, rows) {
  if (!rows.length) return '';
  return `<div class="bg-white rounded-xl border border-stone-200 p-3 overflow-x-auto">
    <h3 class="text-sm font-semibold mb-1">${esc(title)}</h3>
    <table class="text-xs w-full"><thead><tr class="text-stone-500"><th>구분</th><th>건수</th><th>평균 요금</th><th>예약 비율</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${esc(r.key)}</td><td>${r.count}</td><td>${won(r.avg_fare)}</td><td>${Math.round(r.reserved_ratio * 100)}%</td></tr>`).join('')}</tbody></table>
  </div>`;
}

function accuracyTable(acc) {
  const apps = Object.keys(acc);
  if (!apps.length) return '';
  const cell = x => (x ? `${x.ok}/${x.total}` : '—');
  return `<div class="bg-white rounded-xl border border-stone-200 p-3 overflow-x-auto">
    <h3 class="text-sm font-semibold mb-1">필드별 정확도 (표기한 칸 기준, 맞음/전체)</h3>
    <table class="text-xs w-full"><thead><tr class="text-stone-500"><th>앱</th>${state.verifyFields.map(f => `<th>${esc(FIELD_LABEL[f])}</th>`).join('')}</tr></thead>
    <tbody>${apps.map(a => `<tr><td>${esc(a)}</td>${state.verifyFields.map(f => `<td>${cell(acc[a][f])}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </div>`;
}

function renderSummary() {
  const s = state.summary;
  if (!s) { $('summary').innerHTML = ''; return; }
  const ms = v => (v == null ? '—' : `${(v / 1000).toFixed(1)}초`);
  const cap = s.captures;
  const stat = (label, value) => `<div class="bg-white rounded-xl border border-stone-200 p-3"><div class="text-xs text-stone-500">${label}</div><div class="text-lg font-bold">${value}</div></div>`;
  const tokens = s.unknown_tokens.length
    ? `<div class="bg-white rounded-xl border border-stone-200 p-3"><h3 class="text-sm font-semibold mb-1">미상 약어</h3><div class="flex flex-wrap gap-1">${s.unknown_tokens.map(t => `<span class="tag" style="background:#fde68a">${esc(t.token)} ×${t.count}</span>`).join('')}</div></div>`
    : '';
  $('summary').innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
      ${stat('콜', `${s.total_calls}건`)}
      ${stat('캡처', `${cap.total}장${cap.failed ? ` · 실패 ${cap.failed}` : ''}`)}
      ${stat('여러 번 본 콜', `${s.multi_seen}건`)}
      ${stat('처리 시간 (중앙·최대)', `${ms(cap.client_ms.median ?? cap.server_ms.median)} · ${ms(cap.client_ms.max ?? cap.server_ms.max)}`)}
    </div>
    <div class="space-y-2">${table('앱별', s.by_app)}${table('회사별', s.by_source_co)}${accuracyTable(s.accuracy)}${tokens}</div>`;
  $('nImmediate').textContent = s.immediate;
  $('nReserved').textContent = s.reserved;
  $('nAll').textContent = s.total_calls;
}

function renderList() {
  const rows = state.calls.filter(c => state.tab === 'all' || (state.tab === 'reserved') === Boolean(c.reserved_at));
  $('list').innerHTML = rows.length
    ? rows.map(card).join('')
    : '<p class="text-sm text-stone-500 bg-white rounded-xl border border-stone-200 p-4">아직 콜이 없습니다. 위에서 캡처를 올려 주세요.</p>';
}

async function load() {
  try {
    const r = await api('/api/admin/callscope/calls');
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
    state.calls = data.calls;
    state.summary = data.summary;
    state.verifyFields = data.verify_fields;
    renderSummary();
    renderList();
  } catch (e) {
    $('list').innerHTML = `<p class="text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 p-4">콜 목록을 불러오지 못했습니다: ${esc(e.message)}</p>`;
  }
}

async function uploadAll() {
  const files = [...$('files').files];
  if (!files.length) return;
  $('uploadBtn').disabled = true;
  const box = $('progress');
  box.innerHTML = '';
  for (const [i, file] of files.entries()) {
    const line = document.createElement('div');
    line.textContent = `${i + 1}/${files.length} ${file.name} — 읽는 중…`;
    box.appendChild(line);
    const t0 = performance.now();
    try {
      const image_b64 = await toJpegBase64(file);
      const r = await api('/api/admin/callscope/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64, mime: 'image/jpeg', app_hint: $('appHint').value, file_mtime_ms: file.lastModified }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
      const ms = performance.now() - t0;
      const dup = data.calls.filter(c => c.duplicate).length;
      line.textContent = data.calls.length
        ? `${i + 1}/${files.length} ${file.name} — ${data.app} 콜 ${data.calls.length}건${dup ? ` (이미 본 콜 ${dup})` : ''} · ${(ms / 1000).toFixed(1)}초`
        : `${i + 1}/${files.length} ${file.name} — 콜을 찾지 못했습니다${data.unreadable_note ? `: ${data.unreadable_note}` : ''}`;
      if (!data.calls.length) line.className = 'text-amber-700';
      api('/api/admin/callscope/timing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_id: data.capture_id, client_ms: ms }),
      }).catch(() => {});
    } catch (e) {
      line.textContent = `${i + 1}/${files.length} ${file.name} — 실패: ${e.message}`;
      line.className = 'text-red-700';
    }
  }
  $('files').value = '';
  await load();
}

async function toggleVerify(btn) {
  const { id, field } = btn.dataset;
  const call = state.calls.find(c => c.id === id);
  if (!call) return;
  const cur = call.verify?.[field];
  const next = cur === undefined ? true : cur === true ? false : null;
  try {
    const r = await api('/api/admin/callscope/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, field, ok: next }),
    });
    if (!r.ok) throw new Error((await r.json()).message || `HTTP ${r.status}`);
    call.verify = { ...(call.verify || {}) };
    if (next === null) delete call.verify[field]; else call.verify[field] = next;
    renderList();
  } catch (e) {
    alert(`정답 표기를 저장하지 못했습니다: ${e.message}`);
  }
}

$('files').addEventListener('change', () => { $('uploadBtn').disabled = !$('files').files.length; });
$('uploadBtn').addEventListener('click', uploadAll);
$('reloadBtn').addEventListener('click', load);
$('list').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) toggleVerify(b); });
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  state.tab = t.dataset.tab;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
  renderList();
}));

load();
