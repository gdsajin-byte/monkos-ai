// fov_formula.mjs — 포털 precheck의 여권 화각 산식(11-04 prod 00578 계열)을 로컬에서 그대로 돌리는 측정 헬퍼.
// ORDER_20261104_iMac쌍아_막내7_IDPHOTO_여권화각_출고본대조 §2-3. fov_compare.py가 자식 프로세스로 띄운다.
//
// 고객 픽셀은 이 기기 밖으로 나가지 않는다: 검출·랜드마크 = 로컬 crop-engine(CROP_URL, 기본 127.0.0.1:8093),
// 매팅 = 로컬 vision-matte(MATTE_URL, 기본 127.0.0.1:8097). 원격 URL이면 기동을 거부한다.
//
// 산식 함수는 포털 정본을 import한다(사본 금지): hair-measure.js(checkCrownContact·resolveHeadPlacement·crownMatteRowPx)·
// fit-fov.js(assessFov). computeFitGeometry는 server.js 내부 함수(비export)라 아래에 그대로 옮겼다 — server.js L84~133과 대조할 것.
// 프로토콜: stdin 1줄 = {"path": "<정규화 이미지 JPEG>"} → stdout 1줄 JSON.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORTAL = path.resolve(HERE, '../../monkos_AI/portal');
const { checkCrownContact, resolveHeadPlacement, headPlacementSpec, crownMatteRowPx, hairPlacementApplies, HAIR_MARGIN_SLACK_ROWS } =
  await import(path.join(PORTAL, 'lib/hair-measure.js'));
const { assessFov } = await import(path.join(PORTAL, 'lib/fit-fov.js'));
const sharp = createRequire(path.join(PORTAL, 'lib/hair-measure.js'))('sharp');

const CROP_URL = process.env.CROP_URL || 'http://127.0.0.1:8093';
const MATTE_URL = process.env.MATTE_URL || 'http://127.0.0.1:8097';
for (const u of [CROP_URL, MATTE_URL]) {
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(u)) { console.error(`❌ fov_formula: 로컬 주소만 허용 (${u})`); process.exit(2); }
}

// kr-passport 규격 입력 — getSpecCropParams('kr-passport')와 같은 값. spec-crop.js는 shared/config.js(PROJECT_ID 필수)를
// 끌어와 로컬 import가 불가하므로, 원천(specs-data.json)에서 같은 규칙으로 다시 계산하고 기대값과 대조한다.
const SLUG = 'kr-passport';
const sd = createRequire(path.join(PORTAL, 'lib/spec-crop.js'))('./cms/specs-data.json')[SLUG];
const SPEC = { frameW: 413, frameH: 531, frameHmm: 45, faceTargetMm: 33, faceMinMm: 32, hairMarginMm: 2, headHeightMinMm: 32, headHeightMaxMm: 36 };
if (sd.pixels !== '413 × 531px' || sd.size !== '3.5 × 4.5cm' || sd.headHeightMin !== 32 || sd.headHeightMax !== 36 || Number.isFinite(sd.faceTargetExplicitMm)) {
  console.error('❌ fov_formula: specs-data kr-passport가 고정 입력과 다르다 — SPEC 재확인 필요'); process.exit(2);
}
// 두상 재배율 규격 입력은 포털 정본 headPlacementSpec(spec, slug)을 import한다(11-04 막내8 — 사본 제거)

const DETECT_LONG_SIDE = 1024;
const slog = (m) => process.stderr.write(m + '\n');

// ── server.js computeFitGeometry (L80~133) 이식 — 로직 불변 ──
async function computeFitGeometry({ buf, W, H, fbPx, spec, cropEngineUrl, timeoutMs = 45000 }) {
  async function buildRough(targetFaceH) {
    if (!fbPx || fbPx.w <= 10 || fbPx.h <= 10) return { buf, rx: 0, ry: 0, scale: 1 };
    const fh = fbPx.h;
    const top = Math.max(0, Math.round(fbPx.y - fh * 1.3));
    const bottom = Math.min(H, Math.round(fbPx.y + fh * 2.7));
    const cx = fbPx.x + fbPx.w / 2;
    const winH = bottom - top;
    const winW = Math.min(W, Math.round(winH * (spec.frameW / spec.frameH) * 1.4));
    const left = Math.max(0, Math.min(W - winW, Math.round(cx - winW / 2)));
    if (winH < 50 || winW < 50) return { buf, rx: 0, ry: 0, scale: 1 };
    const sc = Math.min(2, targetFaceH / fh);
    const outW = Math.max(64, Math.round(winW * sc));
    const outH = Math.max(64, Math.round(winH * sc));
    const b = await sharp(buf).extract({ left, top, width: winW, height: winH })
      .resize(outW, outH, { fit: 'fill' }).jpeg({ quality: 92 }).toBuffer();
    return { buf: b, rx: left, ry: top, scale: sc };
  }
  let frame = null, lines = null;
  for (const targetFaceH of [280, 200]) {
    const rough = await buildRough(targetFaceH);
    const fitRes = await fetch(`${cropEngineUrl}/api/fit-spec`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: rough.buf.toString('base64'), spec, hairScan: false }),
      signal: AbortSignal.timeout(timeoutMs),
    }).then((r) => r.json()).catch(() => null);
    if (!fitRes || !fitRes.success || !fitRes.detected) continue;
    const sc = rough.scale;
    const cand = {
      frame: { x: fitRes.frame.x / sc + rough.rx, y: fitRes.frame.y / sc + rough.ry, w: fitRes.frame.w / sc, h: fitRes.frame.h / sc },
      lines: {
        crownY: fitRes.lines.crownY / sc + rough.ry,
        eyeY: fitRes.lines.eyeY / sc + rough.ry,
        chinY: fitRes.lines.chinY / sc + rough.ry,
        hairTopY: (fitRes.lines.hairTopY ?? fitRes.lines.crownY) / sc + rough.ry,
        eyeCenterX: (fitRes.lines.eyeCenterX ?? 0) / sc + rough.rx,
      },
    };
    const faceH = cand.lines.chinY - cand.lines.crownY;
    const eyeChinRatio = (cand.lines.chinY - cand.lines.eyeY) / (faceH || 1);
    const ok = faceH > 30 && eyeChinRatio > 0.35 && eyeChinRatio < 0.70;
    if (ok) { frame = cand.frame; lines = cand.lines; break; }
    slog(`[Fit] 랜드마크 검증 이탈 (targetFaceH=${targetFaceH}) → 재시도`);
  }
  return { frame, lines };
}

async function runMatte(b64, bgColor) {
  const r = await fetch(`${MATTE_URL}/api/matte`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: b64, bgColor }), signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.success ? { image: j.image } : null;
}

async function measure(file) {
  const buf = readFileSync(file);
  const { width: W, height: H } = await sharp(buf).metadata();
  const out = { W, H };
  // ① 검출 (precheck L644~660 — 긴 변 1024 축소본, 좌표 역산)
  const detBuf = await sharp(buf).resize(DETECT_LONG_SIDE, DETECT_LONG_SIDE, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  const detMeta = await sharp(detBuf).metadata();
  const det = await fetch(`${CROP_URL}/api/detect`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: detBuf.toString('base64') }), signal: AbortSignal.timeout(15000),
  }).then((r) => r.json());
  const faces = (det && det.success && Array.isArray(det.faces) ? det.faces : []).filter((f) => f.score >= 0.45);
  out.nFaces = faces.length;
  if (!faces.length) return { ...out, status: 'no_face' };
  const k = W / detMeta.width;
  const [x1, y1, x2, y2] = faces[0].bbox.map((v) => v * k);
  const faceBox = { x: x1 / W, y: y1 / H, w: (x2 - x1) / W, h: (y2 - y1) / H };
  // ② 화각 기하 + ③ 정수리 매팅 (precheck 병렬 구간과 같은 입력)
  const [g, crown] = await Promise.all([
    computeFitGeometry({ buf, W, H, fbPx: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, spec: SPEC, cropEngineUrl: CROP_URL, timeoutMs: 15000 }),
    checkCrownContact({ imageBuf: buf, faceBox, slug: SLUG, engineState: 'primary', runMatte, warn: slog }),
  ]);
  out.frame0 = g.frame; out.lines = g.lines;
  out.crown = crown && { status: crown.status, hairTopRatio: crown.hairTopRatio, hairTopRawRatio: crown.hairTopRawRatio, contactRatio: crown.contactRatio, touched: crown.touched, matteRows: crown.matteRows };
  if (!g.frame) return { ...out, status: 'no_frame' };
  if (crown.status !== 'measured') return { ...out, status: 'no_matte' };
  const fov0 = assessFov(g.frame, { width: W, height: H }, SPEC.frameW);
  out.fov0 = { verdict: fov0.verdict, rawVerdict: fov0.rawVerdict, cause: fov0.cause };
  if (crown.touched) out.topTouched = true; // prod: fov_tight_top 반려 (재배율 전에 막힘)
  if (!hairPlacementApplies(SLUG, crown.hairTopRatio)) return { ...out, status: 'not_applicable' };
  const rowPx = crownMatteRowPx(W, H);
  const hp = resolveHeadPlacement({ frame: g.frame, lines: g.lines, hairTopRatio: crown.hairTopRatio, imageHeight: H, ...headPlacementSpec(SPEC, SLUG), slackPx: HAIR_MARGIN_SLACK_ROWS * rowPx });
  if (!hp) return { ...out, status: 'invalid_input' };
  // no_room이면 hp.frame은 원 프레임 — 지표는 산식이 시도한 최선 틀(hp.attemptFrame: eye_max=눈 48%, 충돌=규정 상한 틀)로 낸다
  const attempt = hp.verdict === 'no_room' ? hp.attemptFrame : hp.frame;
  const fov1 = assessFov(attempt, { width: W, height: H }, SPEC.frameW);
  return {
    ...out, status: 'ok', verdict: hp.verdict, headGuard: hp.headGuard, headGuards: hp.headGuards, conflict: hp.conflict,
    noRoomCause: hp.noRoomCause, frame: hp.frame, attempt,
    rowPx, slackMm: hp.slackMm, marginTargetMm: hp.marginTargetMm, eyeAnchor: hp.eyeAnchorPct / 100,
    hp: { headMeasuredMm: hp.headMeasuredMm, headMirrorMm: hp.headMirrorMm, eyeAfterPct: hp.eyeAfterPct, marginAfterMm: hp.marginAfterMm, chinBelowMm: hp.chinBelowMm, scaleRatio: hp.scaleRatio },
    fov1: { verdict: fov1.verdict, rawVerdict: fov1.rawVerdict, cause: fov1.cause, outside: fov1.outside },
  };
}

const rl = readline.createInterface({ input: process.stdin });
for await (const line of rl) {
  if (!line.trim()) continue;
  let res;
  try { res = await measure(JSON.parse(line).path); } catch (e) { res = { status: 'error', error: String(e.message || e) }; }
  process.stdout.write(JSON.stringify(res) + '\n');
}
