// 관상×사주 리포트 — 어드민 컨트롤러 (PF_FACEREAD Phase A)
// 입력 → FaceLandmarker(478, 브라우저 내 처리) → 측정 → 14페이지 리포트 렌더
// 사주는 서버 API가 정본(절기 테이블 서버 보관). 사진은 서버로 전송되지 않는다.
import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
import { toPixels, computeMetrics, IDX } from './metrics.js';
import { buildReport, fmtValue } from './engine.js';

const $ = (sel) => document.querySelector(sel);
const state = { db: null, landmarker: null, pixels: null, img: null, report: null, saju: null, relation: null, highlight: null, page: 1 };
const DEBUG = new URLSearchParams(location.search).has('debug');
const ELEMENT_COLOR = { wood: '#3f9d63', fire: '#e05a4e', earth: '#c8963e', metal: '#8d99ae', water: '#3d6fa8' };

const esc = (s) => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };

async function authFetch(url) {
  const r = await fetch(url, { credentials: 'include' });
  if (r.status === 401) { location.href = '/admin/'; return null; }
  return r;
}

// ---------- 14페이지 정의 (PF_FACEREAD 리포트 구성 확정안, 2026-08-01) ----------
const PAGES = [
  { n: 1, title: '표지', sub: '얼굴 지도 · 오행형 · 한 줄 총평', tier: 'T0' },
  { n: 2, title: '삼정', sub: '초년·중년·말년의 세로 균형', tier: 'T1' },
  { n: 3, title: '오행형', sub: '골격이 말하는 다섯 유형', tier: 'T1' },
  { n: 4, title: '십이궁 (1)', sub: '이마·미간·눈썹·눈두덩', tier: 'T1' },
  { n: 5, title: '십이궁 (2)', sub: '눈·눈꼬리·눈 사이·코', tier: 'T1' },
  { n: 6, title: '십이궁 (3)', sub: '콧방울·인중·입·입꼬리', tier: 'T1' },
  { n: 7, title: '십이궁 (4)', sub: '턱·광대·전체 균형', tier: 'T1' },
  { n: 8, title: '종합 통변', sub: '부위 조합으로 읽는 전체 흐름', tier: 'T1', phaseB: true },
  { n: 9, title: '사주 명식', sub: '년·월·일·시 네 기둥', tier: 'T1' },
  { n: 10, title: '조후', sub: '태어난 계절의 기운 조율', tier: 'T1', phaseB: true },
  { n: 11, title: '궁합 통변', sub: '관상 오행 × 일간 오행', tier: 'T1' },
  { n: 12, title: '퍼스널 컬러', sub: '드레이핑 제안', tier: 'T1', next: true },
  { n: 13, title: '면접 전략', sub: '취업사진으로 잇기', tier: 'T1' },
  { n: 14, title: '측정 성적서', sub: '전 측정치 · 근거 · 고지', tier: 'T1' },
];

// ---------- 초기화 ----------
async function init() {
  setStatus('관상 룰 DB 로딩 중…');
  const res = await authFetch('/api/admin/gwansang/data');
  if (!res) return;
  if (!res.ok) return setStatus(`룰 DB를 불러오지 못했습니다 (HTTP ${res.status}).`, true);
  state.db = await res.json();
  $('#disclaimer').textContent = state.db.meta.disclaimer;

  setStatus('얼굴 인식 모델 로딩 중… (최초 1회, 수 초 소요 — MediaPipe CDN)');
  try {
    const resolver = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    const makeOptions = (delegate) => ({
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate
      },
      runningMode: 'IMAGE',
      numFaces: 1
    });
    try {
      state.landmarker = await FaceLandmarker.createFromOptions(resolver, makeOptions('GPU'));
    } catch (e) {
      console.warn('GPU 델리게이트 실패 → CPU 폴백', e);
      state.landmarker = await FaceLandmarker.createFromOptions(resolver, makeOptions('CPU'));
    }
  } catch (e) {
    return setStatus(`얼굴 인식 모델 로딩 실패: ${e.message} — CDN 연결을 확인해 주세요.`, true);
  }

  setStatus('준비 완료 — 셀카를 올리거나 데모 얼굴로 체험하세요.');
  $('#btn-analyze').disabled = false;
  $('#btn-demo').disabled = false;
}

function setStatus(msg, isError = false) {
  const el = $('#status');
  el.textContent = msg;
  el.className = `text-sm mt-3 ${isError ? 'text-red-600 font-semibold' : 'text-stone-500'}`;
}

// ---------- 입력 ----------
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('이미지를 열지 못했습니다'));
  img.src = src;
});

async function analyze(img) {
  if (!state.landmarker) return;
  setStatus('분석 중…');
  const t0 = performance.now();
  const result = state.landmarker.detect(img);
  if (!result.faceLandmarks?.length) {
    return setStatus('얼굴을 찾지 못했습니다. 정면 얼굴이 또렷한 사진으로 다시 시도해 주세요.', true);
  }
  state.img = img;
  state.pixels = toPixels(result.faceLandmarks[0], img.naturalWidth, img.naturalHeight);
  const metrics = computeMetrics(state.pixels);
  state.report = buildReport(metrics, state.db);
  state.highlight = null;

  await loadSaju();

  state.page = 1;
  renderNav();
  renderPage();
  window.__gwansang = { metrics, report: state.report, saju: state.saju }; // 콘솔 검증용
  setStatus(`분석 완료 (${Math.round(performance.now() - t0)}ms) — 부위 카드를 누르면 해당 점이 얼굴 지도에 표시됩니다.`);
  $('#results').classList.remove('hidden');
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 사주 — 서버 정본 호출. 실패는 무음 강등하지 않고 사유를 그대로 노출한다.
async function loadSaju() {
  state.saju = null; state.relation = null; state.sajuError = null;
  const date = $('#birthdate').value;
  if (!date) return;
  const time = $('#birthtime').value;
  const q = new URLSearchParams({ date, faceElement: state.report.ohaeng.key });
  if (time) q.set('time', time);
  try {
    const res = await authFetch(`/api/admin/gwansang/saju?${q}`);
    if (!res) return;
    const body = await res.json();
    if (!res.ok) { state.sajuError = body.message || `사주 산출 실패 (HTTP ${res.status})`; return; }
    state.saju = body.saju;
    state.relation = body.relation;
  } catch (e) {
    state.sajuError = `사주 API 호출 실패: ${e.message}`;
  }
}

// ---------- 얼굴 지도 ----------
function drawOverlay(canvas) {
  const img = state.img, P = state.pixels;
  if (!canvas || !img) return;
  const maxW = 720;
  const scale = Math.min(1, maxW / img.naturalWidth);
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const s = (p) => ({ x: p.x * scale, y: p.y * scale });

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const p of P) { const q = s(p); ctx.fillRect(q.x - 0.6, q.y - 0.6, 1.2, 1.2); }

  const xL = s(P[IDX.cheekL]).x, xR = s(P[IDX.cheekR]).x;
  ctx.strokeStyle = 'rgba(200,150,62,0.9)';
  ctx.setLineDash([6, 4]); ctx.lineWidth = 1.2;
  for (const idx of [IDX.faceTop, IDX.glabella, IDX.subnasale, IDX.chinBottom]) {
    const y = s(P[idx]).y;
    ctx.beginPath(); ctx.moveTo(xL - 14, y); ctx.lineTo(xR + 14, y); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(200,150,62,1)';
  const ys = [IDX.faceTop, IDX.glabella, IDX.subnasale, IDX.chinBottom].map(i => s(P[i]).y);
  ['상정', '중정', '하정'].forEach((z, i) => ctx.fillText(z, xR + 18, (ys[i] + ys[i + 1]) / 2 + 4));

  if (state.highlight) {
    const metricDef = state.db.metrics.find(m => m.id === state.highlight);
    if (metricDef) {
      ctx.fillStyle = '#e05a4e';
      for (const idx of metricDef.landmarks) {
        const q = s(state.pixels[idx]);
        ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  if (DEBUG) {
    ctx.font = '10px monospace';
    for (const [name, idx] of Object.entries(IDX)) {
      const q = s(state.pixels[idx]);
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffff00';
      ctx.fillText(`${name}:${idx}`, q.x + 4, q.y - 3);
    }
  }
}

// ---------- 렌더 조각 ----------
const readingBlock = (bin) => `
  <div class="space-y-1.5 mt-2 text-sm leading-relaxed">
    <p><span class="reading-tag bg-amber-100 text-amber-800">전통</span>${esc(bin.traditional)}</p>
    <p><span class="reading-tag bg-sky-100 text-sky-800">인상</span>${esc(bin.modern)}</p>
    <p><span class="reading-tag bg-emerald-100 text-emerald-800">취업</span>${esc(bin.career)}</p>
  </div>`;

const card = (inner, cls = '') => `<div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 ${cls}">${inner}</div>`;

const featureCard = (f, highlight) => `
  <button class="feature-card text-left bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-400 hover:shadow transition ${highlight === f.metric ? 'ring-2 ring-red-400' : ''}"
    data-metric="${esc(f.metric)}">
    <div class="flex items-baseline justify-between">
      <p class="text-xs text-stone-400">${esc(f.part)} · ${esc(f.palace)}</p>
      <p class="text-xs font-mono text-stone-400">${esc(f.valueDisplay)}</p>
    </div>
    <p class="font-semibold mt-1">${esc(f.bin.label)}</p>
    ${readingBlock(f.bin)}
  </button>`;

// Phase B 콘텐츠 미수급 슬롯 — 빈 화면 무음 금지 (지시서 3-3)
const phaseBSlot = (title, what) => card(`
  <div class="text-center py-10">
    <span class="inline-block text-xs font-semibold bg-amber-100 text-amber-800 rounded-full px-3 py-1 mb-3">Phase B 콘텐츠 수급 예정</span>
    <h3 class="text-lg font-bold">${esc(title)}</h3>
    <p class="text-sm text-stone-500 mt-2 max-w-xl mx-auto leading-relaxed">${esc(what)}</p>
    <p class="text-xs text-stone-400 mt-4">원전(마의상법·유장상법 계열) 인용 없는 해석은 싣지 않는다는 PF_FACEREAD 원칙 1에 따라,
      콘텐츠가 수급되기 전까지 이 페이지는 비워 둔 상태를 그대로 표시합니다.</p>
  </div>`);

const nextPhaseSlot = (title, what) => card(`
  <div class="text-center py-10">
    <span class="inline-block text-xs font-semibold bg-stone-200 text-stone-600 rounded-full px-3 py-1 mb-3">다음 페이즈</span>
    <h3 class="text-lg font-bold">${esc(title)}</h3>
    <p class="text-sm text-stone-500 mt-2 max-w-xl mx-auto leading-relaxed">${esc(what)}</p>
  </div>`);

// ---------- 페이지별 본문 ----------
function pageHtml(n) {
  const r = state.report, db = state.db;
  const oh = r.ohaeng, sj = r.samjeong;

  switch (n) {
    case 1: { // 표지 — T0 무료 훅
      const oneLiner = `${oh.label} · ${sj.label}`;
      return `
        <div class="grid lg:grid-cols-2 gap-6">
          ${card(`<h3 class="card-title mb-3">얼굴 지도 <span class="text-stone-400 font-normal text-sm">메시 478점 + 삼정 경계</span></h3>
            <canvas id="face-canvas" class="w-full rounded-xl"></canvas>
            <p class="text-xs text-stone-400 mt-2">사진은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다.</p>`)}
          ${card(`
            <p class="text-xs text-stone-400">한 줄 총평</p>
            <p class="text-2xl font-bold mt-1" style="color:${ELEMENT_COLOR[oh.key]}">${esc(oneLiner)}</p>
            ${oh.mixed ? `<p class="text-sm text-stone-500 mt-1">${esc(oh.subLabel)} 기운 혼합</p>` : ''}
            <p class="text-sm leading-relaxed mt-4">${esc(oh.modern)}</p>
            <div class="mt-5 pt-4 border-t border-stone-200 text-sm text-stone-500 leading-relaxed">
              <p>다음 장부터 삼정·오행·십이궁 열두 부위·사주 명식·면접 전략을 차례로 풀이합니다.</p>
            </div>`)}
        </div>`;
    }
    case 2:
      return card(`
        <h3 class="card-title">삼정(三停) <span class="text-stone-400 font-normal">초년 · 중년 · 말년의 균형</span></h3>
        <div class="flex h-3 rounded-full overflow-hidden my-3">
          <div class="bg-amber-400" style="width:${sj.ratios[0]}%"></div>
          <div class="bg-orange-400" style="width:${sj.ratios[1]}%"></div>
          <div class="bg-rose-400" style="width:${sj.ratios[2]}%"></div>
        </div>
        <p class="text-xs text-stone-500">상정 ${sj.ratios[0]}% · 중정 ${sj.ratios[1]}% · 하정 ${sj.ratios[2]}%
          <span class="ml-1 text-stone-400">${esc(db.samjeong.baseline_note || '(상정은 이마 최상단 기준 근사치)')}</span></p>
        <p class="font-semibold mt-2">${esc(sj.label)}</p>
        ${readingBlock(sj)}`);
    case 3:
      return card(`
        <h3 class="card-title">오행형(五行形) 얼굴</h3>
        <p class="mt-2"><span class="text-2xl font-bold" style="color:${ELEMENT_COLOR[oh.key]}">${esc(oh.label)}</span>
          ${oh.mixed ? `<span class="text-sm text-stone-500 ml-2">+ ${esc(oh.subLabel)} 기운 혼합</span>` : ''}</p>
        <p class="text-sm text-stone-500 mt-1">${esc(oh.shape)} · ${esc(db.ohaeng_face.caveat)}</p>
        ${readingBlock(oh)}`);
    case 4: case 5: case 6: case 7: {
      const slice = r.features.slice((n - 4) * 4, (n - 4) * 4 + 4);
      return `<div class="grid md:grid-cols-2 gap-4">${slice.map(f => featureCard(f, state.highlight)).join('')}</div>`;
    }
    case 8:
      return phaseBSlot('종합 통변',
        '부위 판정들을 조합해 하나의 흐름으로 읽는 장입니다. 조합 통변 약 100유닛을 원전 인용과 함께 집필한 뒤 이 자리에 들어갑니다.');
    case 9:
      return sajuHtml();
    case 10:
      return phaseBSlot('조후(調候)',
        '태어난 계절의 한난조습을 보고 사주의 균형을 조율해 읽는 장입니다. 월지·일간 조합별 조후 해설이 수급된 뒤 들어갑니다.');
    case 11:
      return relationHtml();
    case 12:
      return nextPhaseSlot('퍼스널 컬러 · 디지털 드레이핑',
        '조명 표준화와 face-parsing 마스크가 전제라 이번 페이즈에서는 다루지 않습니다. ' + (db.career_hooks.personal_color?.note || ''));
    case 13:
      return card(`
        <h3 class="card-title">이력서 사진 전략 — 관상 실측 기반</h3>
        <p class="text-sm text-stone-500 mt-1">${esc(db.career_hooks.intro)}</p>
        <ul class="mt-3 space-y-1.5 text-sm leading-relaxed list-disc list-inside">
          ${r.careerTips.map(t => `<li>${esc(t)}</li>`).join('')}
        </ul>
        <p class="mt-5 text-sm font-semibold text-emerald-700">${esc(db.career_hooks.idpass_cta)}</p>
        <p class="mt-1 text-xs text-stone-400">골격(삼정·오행형·코·턱·광대·대칭)은 바꾸지 않습니다. 표정·헤어·그루밍·조명·각도 같은 연출 축만 제안합니다.</p>
      `, 'bg-emerald-50 border-emerald-200');
    case 14:
      return scorecardHtml();
    default:
      return card('<p class="text-sm text-stone-500">해당 페이지가 없습니다.</p>');
  }
}

function sajuHtml() {
  const db = state.db;
  if (state.sajuError) {
    return card(`<h3 class="card-title">사주 명식</h3>
      <p class="mt-3 text-sm text-red-600 font-semibold">${esc(state.sajuError)}</p>
      <p class="text-xs text-stone-400 mt-2">값을 임의로 채우지 않고 실패를 그대로 표시합니다.</p>`);
  }
  if (!state.saju) {
    return card(`<h3 class="card-title">사주 명식</h3>
      <p class="mt-3 text-sm text-stone-500">생년월일을 입력하면 년·월·일주를, 태어난 시각까지 입력하면 시주를 포함한 네 기둥을 세웁니다.</p>`);
  }
  const s = state.saju;
  const pillar = (label, p, note) => `
    <div class="bg-stone-50 rounded-lg py-3 px-2 text-center">
      <p class="text-xs text-stone-400">${esc(label)}</p>
      <p class="text-lg font-bold mt-1">${p ? esc(p.label) : '—'}</p>
      <p class="text-xs text-stone-500 mt-0.5">${esc(note)}</p>
    </div>`;

  return card(`
    <h3 class="card-title">${esc(db.saju.name)}</h3>
    <p class="text-sm text-stone-500 mt-1">${esc(db.saju.desc)}</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
      ${pillar('시주 (하루의 자리)', s.hour, s.hour ? (s.hour.lateNight ? '야자시' : '태어난 시각') : '시각 미입력')}
      ${pillar('일주 (나 자신)', s.day, `일간 ${esc(db.saju.elements[s.dayElement].ko)} — ${esc(s.day.stem.keyword)}`)}
      ${pillar('월주 (계절의 기운)', s.month, s.month ? `${esc(s.month.term.name)} 이후` : '')}
      ${pillar('년주 (해의 기운)', s.year, `${esc(s.year.animal)}띠${s.year.springAdjusted ? ' · 입춘 전 → 전년 적용' : ''}`)}
    </div>
    ${s.hourMissing ? `<p class="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">${esc(s.hourMissing)}</p>` : ''}
    ${(s.warnings || []).map(w => `<p class="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 mt-2">⚠️ ${esc(w)}</p>`).join('')}
    <ul class="mt-4 text-xs text-stone-400 leading-relaxed list-disc list-inside space-y-0.5">
      ${db.saju.caveats.map(c => `<li>${esc(c)}</li>`).join('')}
    </ul>
    <p class="text-xs text-stone-400 mt-2">절기 출처: ${esc(s.source)}</p>`);
}

function relationHtml() {
  if (!state.relation) {
    return card(`<h3 class="card-title">궁합 통변 — 관상 오행 × 일간 오행</h3>
      <p class="mt-3 text-sm text-stone-500">생년월일을 입력하면 얼굴 골격의 오행(체)과 사주 일간의 오행(용) 관계를 풀이합니다.</p>`);
  }
  const rel = state.relation, oh = state.report.ohaeng, db = state.db;
  const dayKo = db.saju.elements[state.saju.dayElement].ko;
  return card(`
    <h3 class="card-title">궁합 통변 — 관상 오행 × 일간 오행</h3>
    <div class="flex items-center gap-3 my-4">
      <span class="text-lg font-bold" style="color:${ELEMENT_COLOR[oh.key]}">${esc(oh.label)}</span>
      <span class="text-stone-400">×</span>
      <span class="text-lg font-bold" style="color:${ELEMENT_COLOR[state.saju.dayElement]}">일간 ${esc(dayKo)}</span>
    </div>
    <p class="font-semibold">${esc(rel.label)}</p>
    <p class="text-sm leading-relaxed mt-1">${esc(rel.reading)}</p>`);
}

function scorecardHtml() {
  const r = state.report, db = state.db;
  const rows = db.metrics.map(m => `
    <tr class="border-b border-stone-100">
      <td class="py-1.5 pr-3 font-medium">${esc(m.name || m.id)}</td>
      <td class="py-1.5 pr-3 font-mono text-stone-600">${esc(fmtValue(m.id, r.values))}</td>
      <td class="py-1.5 text-xs text-stone-400">${esc(m.formula || '')}</td>
    </tr>`).join('');
  return `
    ${card(`
      <h3 class="card-title">측정 성적서</h3>
      <p class="text-sm text-stone-500 mt-1">모든 판정은 아래 측정치와 공식에 바인딩되어 있습니다. 측정 근거 없는 해석은 싣지 않습니다.</p>
      <div class="overflow-x-auto mt-3">
        <table class="w-full text-sm"><thead><tr class="text-left text-stone-400 border-b border-stone-200">
          <th class="py-1.5 pr-3 font-medium">측정 항목</th><th class="py-1.5 pr-3 font-medium">값</th><th class="py-1.5 font-medium">공식 (랜드마크 번호)</th>
        </tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div class="mt-4 text-xs text-stone-500 leading-relaxed">
        <p>정면성 — 요 편차 ${r.quality.yawOffset} / 롤 ${r.quality.rollDeg}° ·
          ${r.quality.frontal && r.quality.levelled ? '정면 기준 충족' : '기준 미달 — 측정 왜곡 가능'}</p>
        <p class="mt-1">보정 상태: ${esc(db.meta.calibration)}</p>
        <p class="mt-1">해석 출처: ${esc(db.meta.sources)}</p>
      </div>`)}
    ${card(`<p class="text-xs text-stone-500 leading-relaxed">${esc(db.meta.disclaimer)}</p>`, 'mt-4 bg-stone-50')}`;
}

// ---------- 네비게이션 ----------
function renderNav() {
  $('#page-nav').innerHTML = PAGES.map(p => `
    <button data-page="${p.n}" class="page-chip text-xs px-2.5 py-1 rounded-full border transition
      ${state.page === p.n ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'}">
      ${p.n}. ${esc(p.title)}${p.phaseB ? ' ·B' : ''}${p.next ? ' ·차기' : ''}
    </button>`).join('');
  document.querySelectorAll('.page-chip').forEach(b =>
    b.addEventListener('click', () => goto(Number(b.dataset.page))));
}

function renderPage() {
  const p = PAGES.find(x => x.n === state.page);
  const r = state.report;

  $('#page-head').innerHTML = `
    <div class="flex items-baseline justify-between flex-wrap gap-2">
      <div>
        <span class="text-xs font-semibold rounded-full px-2 py-0.5 ${p.tier === 'T0' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}">${p.tier}</span>
        <span class="text-lg font-bold ml-2">${p.n}. ${esc(p.title)}</span>
        <span class="text-sm text-stone-400 ml-2">${esc(p.sub)}</span>
      </div>
      <span class="text-xs text-stone-400">${p.n} / 14</span>
    </div>`;

  $('#quality-banner').innerHTML = r.quality.frontal && r.quality.levelled ? '' : `
    <div class="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
      ⚠️ 정면성 주의 — 얼굴 회전(요 ${r.quality.yawOffset}, 롤 ${r.quality.rollDeg}°)이 감지되었습니다.
      좌우 대칭·비율 측정이 왜곡될 수 있으니 정면 사진으로 다시 시도하면 정확도가 올라갑니다.
    </div>`;

  $('#page-body').innerHTML = pageHtml(state.page);

  if (state.page === 1) drawOverlay($('#face-canvas'));

  // 부위 페이지에서 선택된 부위가 있을 때만 축소 얼굴 지도를 띄운다
  const showMini = !!state.highlight && state.page >= 4 && state.page <= 7;
  $('#mini-map').classList.toggle('hidden', !showMini);
  if (showMini) drawOverlay($('#mini-canvas'));

  document.querySelectorAll('.feature-card').forEach(btn =>
    btn.addEventListener('click', () => {
      state.highlight = state.highlight === btn.dataset.metric ? null : btn.dataset.metric;
      renderPage();
    }));

  $('#btn-prev').disabled = state.page === 1;
  $('#btn-next').disabled = state.page === 14;
  renderNav();
}

function goto(n) {
  state.page = Math.min(14, Math.max(1, n));
  renderPage();
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- 이벤트 ----------
$('#file-input').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (f) analyze(await loadImage(URL.createObjectURL(f)));
});
$('#btn-analyze').addEventListener('click', () => $('#file-input').click());
$('#btn-demo').addEventListener('click', async () => {
  try { analyze(await loadImage('/admin/img/gwansang-demo.jpg')); }
  catch (e) { setStatus(`데모 이미지 로딩 실패: ${e.message}`, true); }
});
$('#btn-prev').addEventListener('click', () => goto(state.page - 1));
$('#btn-next').addEventListener('click', () => goto(state.page + 1));
// 생년월일·시각을 바꾸면 사주만 다시 부른다 (얼굴 재분석 불필요)
for (const id of ['#birthdate', '#birthtime']) {
  $(id).addEventListener('change', async () => {
    if (!state.report) return;
    await loadSaju();
    renderPage();
  });
}

init().catch(e => {
  console.error(e);
  setStatus(`초기화 실패: ${e.message}`, true);
});
