// 관상 POC 메인 컨트롤러 — 이미지 입력 → FaceLandmarker → 측정 → 리포트 렌더
import { FaceLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
import { toPixels, computeMetrics, IDX } from './metrics.js';
import { buildReport } from './engine.js';

const $ = (sel) => document.querySelector(sel);
const state = { db: null, landmarker: null, pixels: null, img: null, report: null, highlight: null };
const DEBUG = new URLSearchParams(location.search).has('debug');

const ELEMENT_COLOR = { wood: '#3f9d63', fire: '#e05a4e', earth: '#c8963e', metal: '#8d99ae', water: '#3d6fa8' };

async function init() {
  setStatus('관상 DB 로딩 중…');
  state.db = await (await fetch('./data/gwansang_db.json')).json();
  $('#disclaimer').textContent = state.db.meta.disclaimer;

  setStatus('얼굴 인식 모델 로딩 중… (최초 1회, 수 초 소요)');
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
  setStatus('준비 완료 — 셀카를 올리거나 데모 얼굴로 체험하세요.');
  $('#btn-analyze').disabled = false;
  $('#btn-demo').disabled = false;
}

function setStatus(msg, isError = false) {
  const el = $('#status');
  el.textContent = msg;
  el.className = `text-sm mt-3 ${isError ? 'text-red-600' : 'text-stone-500'}`;
}

// ---------- 입력 ----------
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function analyze(img) {
  if (!state.landmarker) return;
  setStatus('분석 중…');
  const t0 = performance.now();
  const result = state.landmarker.detect(img);
  if (!result.faceLandmarks?.length) {
    setStatus('얼굴을 찾지 못했습니다. 정면 얼굴이 또렷한 사진으로 다시 시도해 주세요.', true);
    return;
  }
  state.img = img;
  state.pixels = toPixels(result.faceLandmarks[0], img.naturalWidth, img.naturalHeight);
  const metrics = computeMetrics(state.pixels);
  state.report = buildReport(metrics, state.db, $('#birthdate').value || null);
  state.highlight = null;

  drawOverlay();
  renderReport();
  window.__gwansang = { metrics, report: state.report }; // 콘솔 검증용
  setStatus(`분석 완료 (${Math.round(performance.now() - t0)}ms) — 카드를 누르면 해당 부위가 얼굴 지도에 표시됩니다.`);
  $('#results').classList.remove('hidden');
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- 얼굴 지도 오버레이 ----------
function drawOverlay() {
  const canvas = $('#face-canvas');
  const img = state.img, P = state.pixels;
  const maxW = 760;
  const scale = Math.min(1, maxW / img.naturalWidth);
  canvas.width = img.naturalWidth * scale;
  canvas.height = img.naturalHeight * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const s = (p) => ({ x: p.x * scale, y: p.y * scale });

  // 전체 메시 점 (은은하게)
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const p of P) {
    const q = s(p);
    ctx.fillRect(q.x - 0.6, q.y - 0.6, 1.2, 1.2);
  }

  // 삼정 경계선
  const xL = s(P[IDX.cheekL]).x, xR = s(P[IDX.cheekR]).x;
  ctx.strokeStyle = 'rgba(200,150,62,0.9)';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.2;
  for (const idx of [IDX.faceTop, IDX.glabella, IDX.subnasale, IDX.chinBottom]) {
    const y = s(P[idx]).y;
    ctx.beginPath(); ctx.moveTo(xL - 14, y); ctx.lineTo(xR + 14, y); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(200,150,62,1)';
  const zones = ['상정', '중정', '하정'];
  const ys = [IDX.faceTop, IDX.glabella, IDX.subnasale, IDX.chinBottom].map(i => s(P[i]).y);
  zones.forEach((z, i) => ctx.fillText(z, xR + 18, (ys[i] + ys[i + 1]) / 2 + 4));

  // 선택 부위 하이라이트
  if (state.highlight) {
    const metricDef = state.db.metrics.find(m => m.id === state.highlight);
    if (metricDef) {
      ctx.fillStyle = '#e05a4e';
      for (const idx of metricDef.landmarks) {
        const q = s(P[idx]);
        ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // 디버그: 핵심 앵커 라벨 (인덱스 검증용, ?debug=1)
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

// ---------- 리포트 렌더 ----------
const readingBlock = (bin) => `
  <div class="space-y-1.5 mt-2 text-sm leading-relaxed">
    <p><span class="reading-tag bg-amber-100 text-amber-800">전통</span>${bin.traditional}</p>
    <p><span class="reading-tag bg-sky-100 text-sky-800">인상</span>${bin.modern}</p>
    <p><span class="reading-tag bg-emerald-100 text-emerald-800">취업</span>${bin.career}</p>
  </div>`;

function renderReport() {
  const r = state.report;

  // 품질 게이트 배너
  $('#quality-banner').innerHTML = r.quality.frontal && r.quality.levelled ? '' : `
    <div class="bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
      ⚠️ 정면성 주의 — 얼굴 회전(요 ${r.quality.yawOffset}, 롤 ${r.quality.rollDeg}°)이 감지되었습니다.
      좌우 대칭·비율 측정이 왜곡될 수 있으니 정면 사진으로 다시 시도하면 정확도가 올라갑니다.
    </div>`;

  // 삼정
  const sj = r.samjeong;
  $('#card-samjeong').innerHTML = `
    <h3 class="card-title">삼정(三停) <span class="text-stone-400 font-normal">초년 · 중년 · 말년의 균형</span></h3>
    <div class="flex h-3 rounded-full overflow-hidden my-3">
      <div class="bg-amber-400" style="width:${sj.ratios[0]}%"></div>
      <div class="bg-orange-400" style="width:${sj.ratios[1]}%"></div>
      <div class="bg-rose-400" style="width:${sj.ratios[2]}%"></div>
    </div>
    <p class="text-xs text-stone-500">상정 ${sj.ratios[0]}% · 중정 ${sj.ratios[1]}% · 하정 ${sj.ratios[2]}%
      <span class="ml-1 text-stone-400">(상정은 이마 최상단 기준 근사치)</span></p>
    <p class="font-semibold mt-2">${sj.label}</p>
    ${readingBlock(sj)}`;

  // 오행형
  const oh = r.ohaeng;
  const ohColor = ELEMENT_COLOR[oh.key];
  $('#card-ohaeng').innerHTML = `
    <h3 class="card-title">오행형(五行形) 얼굴</h3>
    <p class="mt-2"><span class="text-2xl font-bold" style="color:${ohColor}">${oh.label}</span>
      ${oh.mixed ? `<span class="text-sm text-stone-500 ml-2">+ ${oh.subLabel} 기운 혼합</span>` : ''}</p>
    <p class="text-sm text-stone-500 mt-1">${oh.shape} · ${state.db.ohaeng_face.caveat}</p>
    ${readingBlock(oh)}`;

  // 사주
  const sajuEl = $('#card-saju');
  if (r.saju) {
    const rel = r.relation;
    const dayElemKo = state.db.saju.elements[r.saju.dayElement].ko;
    sajuEl.innerHTML = `
      <h3 class="card-title">약식 사주 × 관상 오행</h3>
      <div class="grid grid-cols-2 gap-3 my-3 text-center">
        <div class="bg-stone-50 rounded-lg py-3">
          <p class="text-xs text-stone-400">년주 (해의 기운)</p>
          <p class="text-lg font-bold mt-1">${r.saju.year.label}</p>
          <p class="text-xs text-stone-500">${r.saju.year.animal}띠${r.saju.year.springAdjusted ? ' · 입춘 전 → 전년 적용' : ''}</p>
        </div>
        <div class="bg-stone-50 rounded-lg py-3">
          <p class="text-xs text-stone-400">일주 (나의 축)</p>
          <p class="text-lg font-bold mt-1">${r.saju.day.label}</p>
          <p class="text-xs text-stone-500">일간 ${dayElemKo} — ${r.saju.day.stem.keyword}</p>
        </div>
      </div>
      <p class="font-semibold text-sm">${rel.label}</p>
      <p class="text-sm leading-relaxed mt-1">${rel.reading}</p>
      <p class="text-xs text-stone-400 mt-2">${state.db.saju.caveats[0]} · ${state.db.saju.caveats[1]}</p>`;
    sajuEl.classList.remove('hidden');
  } else {
    sajuEl.innerHTML = `
      <h3 class="card-title">약식 사주 × 관상 오행</h3>
      <p class="text-sm text-stone-500 mt-2">생년월일을 입력하면 년주·일주와 관상 오행의 궁합을 함께 풀이합니다.</p>`;
    sajuEl.classList.remove('hidden');
  }

  // 십이궁 카드
  $('#feature-grid').innerHTML = r.features.map(f => `
    <button class="feature-card text-left bg-white rounded-xl border border-stone-200 p-4 hover:border-amber-400 hover:shadow transition ${state.highlight === f.metric ? 'ring-2 ring-red-400' : ''}"
      data-metric="${f.metric}">
      <div class="flex items-baseline justify-between">
        <p class="text-xs text-stone-400">${f.part} · ${f.palace}</p>
        <p class="text-xs font-mono text-stone-400">${f.valueDisplay}</p>
      </div>
      <p class="font-semibold mt-1">${f.bin.label}</p>
      ${readingBlock(f.bin)}
    </button>`).join('');
  document.querySelectorAll('.feature-card').forEach(btn =>
    btn.addEventListener('click', () => {
      state.highlight = state.highlight === btn.dataset.metric ? null : btn.dataset.metric;
      drawOverlay();
      renderReport();
    }));

  // 취업 인상 종합
  $('#card-career').innerHTML = `
    <h3 class="card-title">이력서 사진 전략 — 관상 실측 기반</h3>
    <ul class="mt-2 space-y-1.5 text-sm leading-relaxed list-disc list-inside">
      ${r.careerTips.map(t => `<li>${t}</li>`).join('')}
    </ul>
    <p class="mt-4 text-sm font-semibold text-emerald-700">${state.db.career_hooks.idpass_cta}</p>
    <p class="mt-1 text-xs text-stone-400">퍼스널 컬러: ${state.db.career_hooks.personal_color.note}</p>`;
}

// ---------- 이벤트 바인딩 ----------
$('#file-input').addEventListener('change', async (e) => {
  if (e.target.files?.[0]) analyze(await loadImageFromFile(e.target.files[0]));
});
$('#btn-analyze').addEventListener('click', () => $('#file-input').click());
$('#btn-demo').addEventListener('click', async () => analyze(await loadImageFromUrl('./assets/demo_face.jpg')));

init().catch(e => {
  console.error(e);
  setStatus(`초기화 실패: ${e.message} — 네트워크(CDN) 연결을 확인해 주세요.`, true);
});
