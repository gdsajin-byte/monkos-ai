import http from 'node:http';
import { spawn } from 'node:child_process';
import { initFaceDetector, detectFace } from './lib/face-detect.js';
import { insightToAnatomy } from './lib/face-detect-insight.js';
import { cropToFrame, cropToSpecV2, fitSpecGeometry, fallbackCrop } from './lib/crop.js';
import { SPECS } from './specs/formats.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const MAX_BODY_SIZE = 20 * 1024 * 1024; // 20MB

// === SCRFD 검출 사이드카 (InsightFace 도입 1단, 2026-07-08) ===
// det_10g.onnx — 실측 검증본. 실패해도 서비스는 계속 (FaceMesh 경로 무영향, /api/detect만 503).
const SCRFD_PORT = parseInt(process.env.SCRFD_PORT || '5001', 10);
const SCRFD_PY = process.env.SCRFD_PY || 'python3';
let scrfdReady = false;
let scrfdRestarts = 0;

function startScrfdSidecar() {
  let proc;
  try {
    proc = spawn(SCRFD_PY, ['face_detect_scrfd.py'], { cwd: import.meta.dirname, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error(`[SCRFD] 스폰 실패: ${e.message} — 검출 사이드카 비활성 (FaceMesh 경로 정상)`);
    return;
  }
  proc.stdout.on('data', (d) => {
    const line = d.toString().trim();
    if (line) console.log(`[SCRFD] ${line}`);
    if (line.includes('ready')) scrfdReady = true;
  });
  proc.stderr.on('data', (d) => console.error(`[SCRFD:err] ${d.toString().trim().slice(0, 300)}`));
  proc.on('exit', (code) => {
    scrfdReady = false;
    console.error(`[SCRFD] 사이드카 종료 (code=${code})`);
    if (scrfdRestarts < 3) {
      scrfdRestarts += 1;
      setTimeout(startScrfdSidecar, 2000 * scrfdRestarts);
    }
  });
}

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

async function handleCrop(req, res) {
  try {
    const body = await readBody(req);
    const payload = JSON.parse(body.toString());

    const { image, format = 'passport', country = 'KR' } = payload;
    if (!image) {
      return sendJSON(res, 400, { success: false, error: 'image 필드 필수 (base64)' });
    }

    const imageBuffer = Buffer.from(image, 'base64');

    // 얼굴 감지
    const landmarks = await detectFace(imageBuffer);

    if (!landmarks) {
      // 폴백: 얼굴 감지 실패 → 상단 커버 크롭
      const fallbackBuffer = await fallbackCrop(imageBuffer, { format, country });
      return sendJSON(res, 200, {
        success: true,
        cropped: fallbackBuffer.toString('base64'),
        fallback: true,
        meta: { reason: '얼굴 감지 실패 — 상단 중앙 커버 크롭 적용' },
      });
    }

    // 가이드 프레임 크롭
    const { buffer: croppedBuffer, meta } = await cropToFrame(imageBuffer, landmarks, { format, country });

    sendJSON(res, 200, {
      success: true,
      cropped: croppedBuffer.toString('base64'),
      fallback: false,
      meta: { ...meta, landmarks: { crown: landmarks.crown, chin: landmarks.chin } },
    });
  } catch (err) {
    console.error(`[CropAPI] 에러: ${err.message}`);
    sendJSON(res, 500, { success: false, error: err.message });
  }
}

/**
 * POST /api/crop-spec — 규격 파라미터 주입형 안착 크롭 v2 (스펙스 파이프라인, 2026-07-06)
 * body: { image: base64, spec: { frameW, frameH(px), frameHmm, faceTargetMm, topMarginMm? } }
 * 순백 배경 입력 전제. 얼굴 감지 실패 시 프레임 비율 상단 커버 크롭 폴백.
 */
async function handleCropSpec(req, res) {
  try {
    const body = await readBody(req);
    const { image, spec } = JSON.parse(body.toString());
    if (!image || !spec || !spec.frameW || !spec.frameH || !spec.frameHmm || !spec.faceTargetMm) {
      return sendJSON(res, 400, { success: false, error: 'image, spec{frameW,frameH,frameHmm,faceTargetMm} 필수' });
    }
    const imageBuffer = Buffer.from(image, 'base64');
    const landmarks = await detectFace(imageBuffer);

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

    const { buffer, meta } = await cropToSpecV2(imageBuffer, landmarks, spec);
    sendJSON(res, 200, { success: true, cropped: buffer.toString('base64'), fallback: false, meta });
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

    let landmarks = null;
    if (scrfdReady) {
      try {
        const det = await fetch(`http://127.0.0.1:${SCRFD_PORT}/detect`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
          signal: AbortSignal.timeout(10000),
        }).then(r => r.json());

        if (det.faces && det.faces.length > 0 && det.faces[0].score >= 0.4) {
          const lmk = await fetch(`http://127.0.0.1:${SCRFD_PORT}/landmarks`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image, bbox: det.faces[0].bbox }),
            signal: AbortSignal.timeout(10000),
          }).then(r => r.json());

          if (lmk.landmarks && lmk.landmarks.length === 106) {
            landmarks = insightToAnatomy(lmk.landmarks, det.imageSize.width, det.imageSize.height);
            console.log(`[FitSpec] InsightFace 106점: chin=(${landmarks.chin.y.toFixed(0)}), eye=(${landmarks.leftEye.y.toFixed(0)})`);
          }
        }
      } catch (e) {
        console.error(`[FitSpec] InsightFace 실패 (${e.message}) → FaceMesh 폴백`);
      }
    }

    if (!landmarks) {
      landmarks = await detectFace(imageBuffer);
      if (landmarks) console.log('[FitSpec] FaceMesh 폴백 사용');
    }

    if (!landmarks) {
      return sendJSON(res, 200, { success: true, detected: false });
    }
    const fit = await fitSpecGeometry(imageBuffer, landmarks, spec, { hairScan: hairScan !== false });
    sendJSON(res, 200, { success: true, detected: true, gate: landmarks.gate || null, ...fit });
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
  sendJSON(res, 200, { status: 'ok', model: detector ? 'loaded' : 'not_loaded', scrfd: scrfdReady ? 'ready+lmk' : 'off' });
}

// detector 로드 상태를 health에서 참조
let detector = false;

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

  if (req.method === 'POST' && path === '/api/crop') {
    handleCrop(req, res);
  } else if (req.method === 'POST' && path === '/api/crop-spec') {
    handleCropSpec(req, res);
  } else if (req.method === 'POST' && path === '/api/fit-spec') {
    handleFitSpec(req, res);
  } else if (req.method === 'POST' && path === '/api/detect') {
    handleDetect(req, res);
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
  startScrfdSidecar(); // FaceMesh 로딩과 병렬 기동
  console.log('[CropEngine] FaceMesh 모델 로딩 중...');
  await initFaceDetector();
  detector = true;
  console.log('[CropEngine] 모델 로드 완료');

  server.listen(PORT, () => {
    console.log(`[CropEngine] 서버 기동: http://localhost:${PORT}`);
    console.log(`[CropEngine] 엔드포인트: POST /api/crop, POST /api/fit-spec, POST /api/detect, GET /api/specs, GET /health`);
  });
}

start().catch((err) => {
  console.error(`[CropEngine] 기동 실패: ${err.message}`);
  process.exit(1);
});
