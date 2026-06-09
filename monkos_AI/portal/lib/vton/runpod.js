/**
 * VTON RunPod 프록시 (PF_VTON Phase4 — 1단계)
 *
 * 어드민 VTON Studio 백엔드. 두 가지 역할:
 *  1) pod 전원 제어 (RunPod REST API) — start/stop/status
 *  2) ComfyUI API 중계 — 브라우저가 RunPod을 직접 호출하지 않도록 프록시
 *
 * RUNPOD_API_KEY는 이 백엔드(환경변수)에만 존재한다. 프론트/HTML/JS로 절대 흘리지 않는다.
 * (헌법 4조 1·2항)
 */
import { RUNPOD_API_KEY, RUNPOD_POD_ID, log } from '../shared/config.js';
import { requireAdmin } from '../cms/admin-auth.js';

const RUNPOD_REST = 'https://rest.runpod.io/v1';
const COMFY_PORT = 8188;
// RunPod http 포트는 결정적 프록시 URL로 노출된다 (8188=http, 22=tcp).
const comfyBase = () => `https://${RUNPOD_POD_ID}-${COMFY_PORT}.proxy.runpod.net`;
const COMFY_PREFIX = '/admin/api/vton/comfy';

function rpHeaders() {
  return { Authorization: `Bearer ${RUNPOD_API_KEY}`, 'Content-Type': 'application/json' };
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// 설정 검증 — 키 미설정 시 프록시 전체를 503으로 막는다 (placeholder/하드코딩 금지)
function configured(res) {
  if (!RUNPOD_API_KEY) {
    json(res, 503, { error: 'RUNPOD_API_KEY 미설정 — 백엔드 환경변수에 RunPod 키를 설정하세요' });
    return false;
  }
  return true;
}

function readRawBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function getPod() {
  const r = await fetch(`${RUNPOD_REST}/pods/${RUNPOD_POD_ID}`, { headers: rpHeaders() });
  if (!r.ok) throw new Error(`RunPod 상태 조회 실패 (${r.status})`);
  return r.json();
}

async function comfyHealthy() {
  try {
    const r = await fetch(`${comfyBase()}/system_stats`, { signal: AbortSignal.timeout(6000) });
    return r.ok;
  } catch {
    return false;
  }
}

// POST /admin/api/vton/pod/start — 부팅만 트리거하고 즉시 반환 (Cloud Run 60s 타임아웃 회피).
// 준비 완료 여부는 프론트가 /pod/status 폴링으로 확인한다.
export async function handlePodStart(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!configured(res)) return;
  try {
    const r = await fetch(`${RUNPOD_REST}/pods/${RUNPOD_POD_ID}/start`, {
      method: 'POST',
      headers: rpHeaders(),
    });
    const text = await r.text();
    log(`[VTON] pod start 요청: ${r.status}`, r.ok ? 'INFO' : 'WARNING');
    // GPU 가용성 Low 등으로 실패할 수 있음 — 프론트가 재시도
    json(res, r.ok ? 200 : 502, {
      ok: r.ok,
      message: r.ok ? '부팅 요청됨 — status 폴링으로 준비 확인' : 'pod start 실패 (GPU 가용성 등) — 재시도 필요',
      runpodStatus: r.status,
    });
  } catch (e) {
    log(`[VTON] pod start 에러: ${e.message}`, 'ERROR');
    json(res, 502, { ok: false, error: e.message });
  }
}

// GET /admin/api/vton/pod/status — pod 전원 상태 + ComfyUI 헬스(8188)
export async function handlePodStatus(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!configured(res)) return;
  try {
    const pod = await getPod();
    const podStatus = pod.desiredStatus || pod.status || 'UNKNOWN';
    const running = podStatus === 'RUNNING';
    const comfyReady = running ? await comfyHealthy() : false;
    json(res, 200, { podId: RUNPOD_POD_ID, podStatus, running, comfyReady });
  } catch (e) {
    log(`[VTON] pod status 에러: ${e.message}`, 'ERROR');
    json(res, 502, { error: e.message });
  }
}

// POST /admin/api/vton/pod/stop — 과금 정지
export async function handlePodStop(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!configured(res)) return;
  try {
    const r = await fetch(`${RUNPOD_REST}/pods/${RUNPOD_POD_ID}/stop`, {
      method: 'POST',
      headers: rpHeaders(),
    });
    log(`[VTON] pod stop 요청: ${r.status}`, r.ok ? 'INFO' : 'WARNING');
    json(res, r.ok ? 200 : 502, { ok: r.ok, runpodStatus: r.status });
  } catch (e) {
    log(`[VTON] pod stop 에러: ${e.message}`, 'ERROR');
    json(res, 502, { ok: false, error: e.message });
  }
}

// ALL /admin/api/vton/comfy/* — ComfyUI API 중계 (/prompt /upload/image /view /history /object_info /system_stats)
export async function handleComfyProxy(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!configured(res)) return;

  const idx = req.url.indexOf(COMFY_PREFIX);
  const sub = req.url.slice(idx + COMFY_PREFIX.length) || '/'; // path + query 보존
  const target = comfyBase() + sub;

  try {
    const headers = {};
    const ct = req.headers['content-type'];
    if (ct) headers['content-type'] = ct;

    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await readRawBuffer(req); // 멀티파트 업로드 등 바이너리 그대로 전달
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(55000), // Cloud Run 60s 한계 내
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
    });
    res.end(buf);
  } catch (e) {
    log(`[VTON] comfy 프록시 에러: ${e.message} (${sub})`, 'ERROR');
    json(res, 502, { error: 'ComfyUI 연결 실패 — pod/ComfyUI 기동 확인: ' + e.message });
  }
}
