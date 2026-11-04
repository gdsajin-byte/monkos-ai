import http from 'node:http';
import { spawn } from 'node:child_process';
import { insightToAnatomy } from './lib/face-detect-insight.js';
import { cropToSpecV2, fitSpecGeometry, subjectTopRow } from './lib/crop.js';
import { SPECS } from './specs/formats.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const MAX_BODY_SIZE = 20 * 1024 * 1024; // 20MB

// === SCRFD 검출 사이드카 (InsightFace) ===
const SCRFD_PORT = parseInt(process.env.SCRFD_PORT || '5001', 10);
const SCRFD_PY = process.env.SCRFD_PY || 'python3';
const RESTART_MAX_DELAY = 30000;
let scrfdReady = false;
let scrfdRestarts = 0;

function startScrfdSidecar() {
  let proc;
  try {
    proc = spawn(SCRFD_PY, ['face_detect_scrfd.py'], { cwd: import.meta.dirname, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error(`[SCRFD] 스폰 실패: ${e.message}`);
    return;
  }
  proc.stdout.on('data', (d) => {
    const line = d.toString().trim();
    if (line) console.log(`[SCRFD] ${line}`);
    if (line.includes('ready')) { scrfdReady = true; scrfdRestarts = 0; }
  });
  proc.stderr.on('data', (d) => console.error(`[SCRFD:err] ${d.toString().trim().slice(0, 300)}`));
  proc.on('exit', (code) => {
    scrfdReady = false;
    console.error(`[SCRFD] 사이드카 종료 (code=${code})`);
    scrfdRestarts += 1;
    if (scrfdRestarts > 3) {
      const TEAM_CHAT_ID = process.env.TEAM_CHAT_ID || '';
      const TELEGRAM_TEAM_API = process.env.TELEGRAM_TEAM_API || '';
      if (TEAM_CHAT_ID && TELEGRAM_TEAM_API) {
        fetch(`${TELEGRAM_TEAM_API}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TEAM_CHAT_ID, text: `🚨 SCRFD 사이드카 반복 재시작 (${scrfdRestarts}회) — crop-engine 점검 필요`, parse_mode: 'Markdown' }),
        }).catch(() => {});
      }
    }
    const delay = Math.min(2000 * scrfdRestarts, RESTART_MAX_DELAY);
    setTimeout(startScrfdSidecar, delay);
  });
}

// scrfdReady 헬스 폴링 (2026-07-12 민아): stdout 'ready' 마커 유실 시 사이드카가 살아있어도
// 영구 FaceMesh 폴백으로 고착되는 사고 실측 — 15초 주기 실측으로 플래그를 회복/강하한다.
async function refreshScrfdReady() {
  try {
    const r = await fetch(`http://127.0.0.1:${SCRFD_PORT}/health`, { signal: AbortSignal.timeout(1500) });
    if (r.ok && !scrfdReady) console.log('[SCRFD] 헬스 폴링으로 ready 회복');
    scrfdReady = r.ok;
  } catch {
    scrfdReady = false;
  }
}
setTimeout(refreshScrfdReady, 5000);
setInterval(refreshScrfdReady, 15000).unref();

async function handleDetect(req, res) {
  if (!scrfdReady) {
    return sendJSON(res, 503, { success: false, error: 'SCRFD 미가동', code: 'DETECT_UNAVAILABLE' });
  }
  try {
    const body = await readBody(req);
    const upstream = await fetch(`http://127.0.0.1:${SCRFD_PORT}/detect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      signal: AbortSignal.timeout(15000),
    });
    const data = await upstream.json();
    sendJSON(res, upstream.status, upstream.ok ? { success: true, ...data } : { success: false, ...data });
  } catch (err) {
    console.error(`[DetectAPI] 에러: ${err.message}`);
    sendJSON(res, 500, { success: false, error: err.message });
  }
}

async function handleHeadpose(req, res) {
  if (!scrfdReady) {
    return sendJSON(res, 503, { success: false, error: 'SCRFD 미가동', code: 'DETECT_UNAVAILABLE' });
  }
  try {
    const body = await readBody(req);
    const upstream = await fetch(`http://127.0.0.1:${SCRFD_PORT}/headpose`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      signal: AbortSignal.timeout(10000),
    });
    const data = await upstream.json();
    sendJSON(res, upstream.status, { success: true, ...data });
  } catch (err) {
    console.error(`[HeadposeAPI] 에러: ${err.message}`);
    sendJSON(res, 500, { success: false, error: err.message });
  }
}

// CORS 헤더
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('요청 크기 초과 (최대 20MB)'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// === 라우트 핸들러 ===

/**
 * 최선 검출 — InsightFace(SCRFD+106점) 우선, 실패 시 FaceMesh 폴백.
 * 2026-07-12 작가님 확정: 유료 최종 크롭(crop-spec)이 신뢰도 문제로 퇴출 결정된 FaceMesh에
 * 남아있던 것이 과대 크롭의 핵심 — fit-spec에서 실전 검증된 블록을 공용화해 crop-spec도 전환.
 * 반환 landmarks.detector = 'insightface' | 'facemesh' (meta 추적용).
 */
async function detectBest(imageB64, imageBuffer) {
  if (scrfdReady) {
    try {
      const det = await fetch(`http://127.0.0.1:${SCRFD_PORT}/detect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageB64 }),
        signal: AbortSignal.timeout(10000),
      }).then(r => r.json());

      if (det.faces && det.faces.length > 0 && det.faces[0].score >= 0.4) {
        const bbox = det.faces[0].bbox;
        const [lmkRes, poseRes] = await Promise.all([
          fetch(`http://127.0.0.1:${SCRFD_PORT}/landmarks`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageB64, bbox }),
            signal: AbortSignal.timeout(10000),
          }).then(r => r.json()),
          fetch(`http://127.0.0.1:${SCRFD_PORT}/headpose`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageB64, bbox }),
            signal: AbortSignal.timeout(10000),
          }).then(r => r.json()).catch(() => ({ pose: null })),
        ]);

        if (lmkRes.landmarks && lmkRes.landmarks.length === 106) {
          const landmarks = insightToAnatomy(lmkRes.landmarks, det.imageSize.width, det.imageSize.height);
          if (poseRes.pose) landmarks.pose = poseRes.pose;
          landmarks.detector = 'insightface';
          console.log(`[DetectBest] InsightFace 106점: chin=(${landmarks.chin.y.toFixed(0)}), eye=(${landmarks.leftEye.y.toFixed(0)})${poseRes.pose ? ` pose=p${poseRes.pose.pitch}/y${poseRes.pose.yaw}/r${poseRes.pose.roll}` : ''}`);
          return landmarks;
        }
      }
    } catch (e) {
      console.error(`[DetectBest] InsightFace 실패 (${e.message})`);
    }
  }
  console.error('[DetectBest] 얼굴 감지 실패 (InsightFace 불가, 폴백 없음)');
  return null;
}

/**
 * POST /api/crop-spec — 규격 파라미터 주입형 안착 크롭 v2 (스펙스 파이프라인, 2026-07-06)
 * body: { image: base64, spec: { frameW, frameH(px), frameHmm, faceTargetMm, topMarginMm?, eyeAnchor?(0.38~0.50) } }
 * 순백 배경 입력 전제. 얼굴 감지 실패 시 프레임 비율 상단 커버 크롭 폴백.
 * 검출: InsightFace 우선(detectBest) + hairTop 실측 스캔(순백 전제 엔드포인트라 상시).
 */
async function handleCropSpec(req, res) {
  if (!scrfdReady) {
    return sendJSON(res, 503, { success: false, error: 'DETECTOR_NOT_READY', message: '얼굴 감지 엔진 준비 중' });
  }
  try {
    const body = await readBody(req);
    const { image, spec } = JSON.parse(body.toString());
    if (!image || !spec || !spec.frameW || !spec.frameH || !spec.frameHmm || !spec.faceTargetMm) {
      return sendJSON(res, 400, { success: false, error: 'image, spec{frameW,frameH,frameHmm,faceTargetMm} 필수' });
    }
    const imageBuffer = Buffer.from(image, 'base64');
    const landmarks = await detectBest(image, imageBuffer);

    if (!landmarks) {
      const { default: sharp } = await import('sharp');
      const fb = await sharp(imageBuffer)
        .resize(spec.frameW, spec.frameH, { fit: 'cover', position: 'top' })
        .withMetadata({ density: 300 }).png().toBuffer();
      return sendJSON(res, 200, {
        success: true, cropped: fb.toString('base64'), fallback: true,
        meta: { reason: '얼굴 감지 실패 — 상단 커버 크롭' },
      });
    }

    // hairTop 실측 — 순백 전제 엔드포인트라 상시 스캔. 좌표(crown 미러 추산)와 독립인
    // 외부 기준점: ① 스케일 축소 루프 활성(헤어까지 프레임 안착) ② 좌표 오검출 교차 검증 원료
    try {
      landmarks.hairTop = await subjectTopRow(imageBuffer);
    } catch { /* 스캔 실패 시 기존(crownY 폴백) 경로 유지 */ }

    const { buffer, meta } = await cropToSpecV2(imageBuffer, landmarks, spec);
    sendJSON(res, 200, {
      success: true, cropped: buffer.toString('base64'), fallback: false,
      meta: { ...meta, detector: landmarks.detector, hairTopY: landmarks.hairTop ?? null },
    });
  } catch (err) {
    console.error(`[CropSpecAPI] 에러: ${err.message}`);
    sendJSON(res, 500, { success: false, error: err.message });
  }
}


/**
 * POST /api/fit-spec — 프레임 피팅 기하만 반환 (렌더 없음, ORDER_20260707 크롭정밀도)
 * body: { image: base64, spec: {...cropSpec 동일}, hairScan?: bool (실사 원본은 false 권장) }
 * 반환: { success, detected, frame(입력좌표), lines{crownY,eyeY,chinY[,hairTopY]}, imageSize, meta }
 */
async function handleFitSpec(req, res) {
  try {
    const body = await readBody(req);
    const { image, spec, hairScan } = JSON.parse(body.toString());
    if (!image || !spec || !spec.frameW || !spec.frameH || !spec.frameHmm || !spec.faceTargetMm) {
      return sendJSON(res, 400, { success: false, error: 'image, spec{frameW,frameH,frameHmm,faceTargetMm} 필수' });
    }
    const imageBuffer = Buffer.from(image, 'base64');

    // 검출 공용화 (2026-07-12): 인라인 InsightFace 블록 → detectBest 통일 (crop-spec과 동일 경로)
    const landmarks = await detectBest(image, imageBuffer);

    if (!landmarks) {
      return sendJSON(res, 200, { success: true, detected: false });
    }
    const fit = await fitSpecGeometry(imageBuffer, landmarks, spec, { hairScan: hairScan !== false });
    sendJSON(res, 200, { success: true, detected: true, gate: landmarks.gate || null, pose: landmarks.pose || null, ...fit });
  } catch (err) {
    console.error(`[FitSpecAPI] 에러: ${err.message}`);
    sendJSON(res, 500, { success: false, error: err.message });
  }
}

function handleSpecs(_req, res) {
  const specs = Object.entries(SPECS).map(([key, spec]) => ({
    key,
    ...spec,
  }));
  sendJSON(res, 200, { specs });
}

function handleHealth(_req, res) {
  sendJSON(res, 200, { status: 'ok', scrfd: scrfdReady ? 'ready+lmk' : 'off' });
}

// === HTTP 서버 ===

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'POST' && path === '/api/crop-spec') {
    handleCropSpec(req, res);
  } else if (req.method === 'POST' && path === '/api/fit-spec') {
    handleFitSpec(req, res);
  } else if (req.method === 'POST' && path === '/api/detect') {
    handleDetect(req, res);
  } else if (req.method === 'POST' && path === '/api/headpose') {
    handleHeadpose(req, res);
  } else if (req.method === 'GET' && path === '/api/specs') {
    handleSpecs(req, res);
  } else if (req.method === 'GET' && path === '/health') {
    handleHealth(req, res);
  } else {
    sendJSON(res, 404, { error: 'Not Found' });
  }
});

// === 기동 ===

async function start() {
  startScrfdSidecar();
  server.listen(PORT, () => {
    console.log(`[CropEngine] 서버 기동: http://localhost:${PORT}`);
    console.log(`[CropEngine] 엔드포인트: POST /api/crop-spec, POST /api/fit-spec, POST /api/detect, POST /api/headpose, GET /api/specs, GET /health`);
  });
}

start().catch((err) => {
  console.error(`[CropEngine] 기동 실패: ${err.message}`);
  process.exit(1);
});
