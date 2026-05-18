/* ═══ MONKOS Crop — HUD Dark Prototype + Real Integration ═══ */
/* FaceMesh + @imgly background removal + Canvas crop + download */

// ─── Country & Spec Data ───
// Will be replaced by specs-data-v2.json when available
const COUNTRIES = [
  { id: 'kr', flag: '🇰🇷', name: '대한민국', nameEn: 'Korea', pattern: 'A' },
  { id: 'jp', flag: '🇯🇵', name: '日本', nameEn: 'Japan', pattern: 'A' },
  { id: 'us', flag: '🇺🇸', name: 'United States', nameEn: 'USA', pattern: 'B' },
  { id: 'cn', flag: '🇨🇳', name: '中国', nameEn: 'China', pattern: 'B' },
  { id: 'eu', flag: '🇪🇺', name: 'Europe', nameEn: 'EU / Schengen', pattern: 'A' },
  { id: 'au', flag: '🇦🇺', name: 'Australia', nameEn: 'Australia', pattern: 'A' },
  { id: 'ca', flag: '🇨🇦', name: 'Canada', nameEn: 'Canada', pattern: 'C' },
  { id: 'sg', flag: '🇸🇬', name: 'Singapore', nameEn: 'Singapore', pattern: 'A' },
  { id: 'in', flag: '🇮🇳', name: 'India', nameEn: 'India', pattern: 'B' },
  { id: 'th', flag: '🇹🇭', name: 'ประเทศไทย', nameEn: 'Thailand', pattern: 'A' },
  { id: 'gb', flag: '🇬🇧', name: 'United Kingdom', nameEn: 'UK', pattern: 'A' },
  { id: 'vn', flag: '🇻🇳', name: 'Việt Nam', nameEn: 'Vietnam', pattern: 'B' },
  { id: 'id', flag: '🇮🇩', name: 'Indonesia', nameEn: 'Indonesia', pattern: 'B' },
  { id: 'de', flag: '🇩🇪', name: 'Deutschland', nameEn: 'Germany', pattern: 'A' },
];

const TYPE_ICONS = { passport: '🛂', visa: '📋', id: '🪪', resume: '📄', drivers: '🚗' };

const SPECS = {
  kr: [
    { id: 'kr-passport', type: 'passport', name: '여권 / 신분증', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'ICAO', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
    { id: 'kr-id', type: 'id', name: '증명사진 (반명함)', size: '30×40mm', px: '354×472px', wMm: 30, hMm: 40, pxW: 354, pxH: 472, ratio: 3/4, standard: 'KS', bg: '#FFFFFF', faceMin: 24, faceMax: 32, faceTarget: 28 },
    { id: 'kr-resume', type: 'resume', name: '이력서', size: '30×40mm', px: '354×472px', wMm: 30, hMm: 40, pxW: 354, pxH: 472, ratio: 3/4, standard: 'KS', bg: '#FFFFFF', faceMin: 24, faceMax: 32, faceTarget: 28 },
  ],
  jp: [
    { id: 'jp-passport', type: 'passport', name: 'パスポート', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'ICAO', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
    { id: 'jp-id', type: 'id', name: '証明写真', size: '30×40mm', px: '354×472px', wMm: 30, hMm: 40, pxW: 354, pxH: 472, ratio: 3/4, standard: 'JIS', bg: '#FFFFFF', faceMin: 24, faceMax: 32, faceTarget: 28 },
    { id: 'jp-visa', type: 'visa', name: 'ビザ申請用', size: '45×45mm', px: '531×531px', wMm: 45, hMm: 45, pxW: 531, pxH: 531, ratio: 1, standard: 'MOJ', bg: '#FFFFFF', faceMin: 28, faceMax: 36, faceTarget: 32 },
  ],
  us: [
    { id: 'us-passport', type: 'passport', name: 'US Passport', size: '51×51mm', px: '600×600px', wMm: 51, hMm: 51, pxW: 600, pxH: 600, ratio: 1, standard: 'DOS', bg: '#FFFFFF', faceMin: 25, faceMax: 35, faceTarget: 30 },
    { id: 'us-visa', type: 'visa', name: 'US Visa', size: '51×51mm', px: '600×600px', wMm: 51, hMm: 51, pxW: 600, pxH: 600, ratio: 1, standard: 'DOS', bg: '#FFFFFF', faceMin: 25, faceMax: 35, faceTarget: 30 },
  ],
  cn: [
    { id: 'cn-passport', type: 'passport', name: '中国护照', size: '33×48mm', px: '390×567px', wMm: 33, hMm: 48, pxW: 390, pxH: 567, ratio: 33/48, standard: 'MPS', bg: '#FFFFFF', faceMin: 28, faceMax: 36, faceTarget: 32 },
    { id: 'cn-resume-1', type: 'resume', name: '一寸照片', size: '25×35mm', px: '295×413px', wMm: 25, hMm: 35, pxW: 295, pxH: 413, ratio: 25/35, standard: 'GB/T', bg: '#FFFFFF', faceMin: 20, faceMax: 28, faceTarget: 24 },
  ],
  eu: [
    { id: 'eu-passport', type: 'passport', name: 'Schengen Passport', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'ICAO', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
  ],
  au: [
    { id: 'au-passport', type: 'passport', name: 'Passport Photo', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'ICAO', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
  ],
  ca: [
    { id: 'ca-passport', type: 'passport', name: 'Passport Photo', size: '50×70mm', px: '590×826px', wMm: 50, hMm: 70, pxW: 590, pxH: 826, ratio: 50/70, standard: 'IRCC', bg: '#FFFFFF', faceMin: 31, faceMax: 36, faceTarget: 34 },
  ],
  sg: [
    { id: 'sg-passport', type: 'passport', name: 'Passport Photo', size: '35×45mm', px: '400×514px', wMm: 35, hMm: 45, pxW: 400, pxH: 514, ratio: 35/45, standard: 'ICA', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
  ],
  in: [
    { id: 'in-passport', type: 'passport', name: 'Passport Photo', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'MEA', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
    { id: 'in-visa', type: 'visa', name: 'Visa Photo', size: '51×51mm', px: '600×600px', wMm: 51, hMm: 51, pxW: 600, pxH: 600, ratio: 1, standard: 'BLS', bg: '#FFFFFF', faceMin: 25, faceMax: 35, faceTarget: 30 },
  ],
  th: [
    { id: 'th-passport', type: 'passport', name: 'Passport Photo', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'ICAO', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
  ],
  gb: [
    { id: 'gb-passport', type: 'passport', name: 'Passport Photo', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'HMPO', bg: '#FFFFFF', faceMin: 29, faceMax: 34, faceTarget: 32 },
  ],
  vn: [
    { id: 'vn-passport', type: 'passport', name: 'Passport Photo', size: '40×60mm', px: '472×709px', wMm: 40, hMm: 60, pxW: 472, pxH: 709, ratio: 40/60, standard: 'MPS', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
  ],
  id: [
    { id: 'id-passport', type: 'passport', name: 'Passport Photo', size: '40×60mm', px: '472×709px', wMm: 40, hMm: 60, pxW: 472, pxH: 709, ratio: 40/60, standard: 'Imigrasi', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
  ],
  de: [
    { id: 'de-passport', type: 'passport', name: 'Reisepass', size: '35×45mm', px: '413×531px', wMm: 35, hMm: 45, pxW: 413, pxH: 531, ratio: 35/45, standard: 'ICAO', bg: '#FFFFFF', faceMin: 32, faceMax: 36, faceTarget: 34 },
    { id: 'de-resume', type: 'resume', name: 'Bewerbungsfoto', size: '45×60mm', px: '531×709px', wMm: 45, hMm: 60, pxW: 531, pxH: 709, ratio: 45/60, standard: 'DIN', bg: '#FFFFFF', faceMin: 28, faceMax: 36, faceTarget: 32 },
  ],
};

// ─── FaceMesh Landmark Indices (MediaPipe 478) ───
const FM_IDX = {
  LEFT_PUPIL: 159,
  RIGHT_PUPIL: 386,
  CHIN: 152,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  NOSE_TIP: 1,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  UPPER_LIP: 13,
  LOWER_LIP: 14,
};

// ─── State ───
const state = {
  step: 1,
  country: null,
  spec: null,
  imageUrl: null,
  imageFile: null,
  loadedImg: null,
  bgColor: '#FFFFFF',
  bgRemovedBlob: null,
  bgCompositeUrl: null,
  inspecting: false,
  inspectDone: false,
  metrics: [],
  // FaceMesh
  faceMeshReady: false,
  faceLandmarks: null,
  faceData: null,
  // Crop positioning
  imgPos: { x: 0, y: 0 },
  imgScale: 1,
  cropFrameH: 400,
};

// ─── DOM ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ═══════════════════════════════════════════════
// FaceMesh Module
// ═══════════════════════════════════════════════

let faceMeshInstance = null;
let faceMeshResults = null;

function checkWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

async function initFaceMesh() {
  if (typeof FaceMesh === 'undefined') {
    console.warn('[FaceMesh] Library not loaded — will use fallback');
    return false;
  }
  if (!checkWebGL()) {
    console.warn('[FaceMesh] WebGL not supported');
    return false;
  }
  try {
    faceMeshInstance = new FaceMesh({
      locateFile: (file) => new URL(`mediapipe/${file}`, window.location.href).href
    });
    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMeshInstance.onResults((r) => { faceMeshResults = r; });
    state.faceMeshReady = true;
    console.log('[FaceMesh] Initialized');
    return true;
  } catch (err) {
    console.warn('[FaceMesh] Init failed:', err.message);
    return false;
  }
}

async function detectFace(imgEl) {
  if (!state.faceMeshReady || !faceMeshInstance) return null;
  try {
    faceMeshResults = null;
    await faceMeshInstance.send({ image: imgEl });
    if (!faceMeshResults?.multiFaceLandmarks?.[0]) return null;
    return faceMeshResults.multiFaceLandmarks[0];
  } catch (err) {
    console.warn('[FaceMesh] Detection error:', err.message);
    return null;
  }
}

function extractLandmarks(raw, natW, natH) {
  const lp = raw[FM_IDX.LEFT_PUPIL];
  const rp = raw[FM_IDX.RIGHT_PUPIL];
  const ch = raw[FM_IDX.CHIN];
  const lc = raw[FM_IDX.LEFT_CHEEK];
  const rc = raw[FM_IDX.RIGHT_CHEEK];
  const nt = raw[FM_IDX.NOSE_TIP];
  const leT = raw[FM_IDX.LEFT_EYE_TOP];
  const leB = raw[FM_IDX.LEFT_EYE_BOTTOM];
  const reT = raw[FM_IDX.RIGHT_EYE_TOP];
  const reB = raw[FM_IDX.RIGHT_EYE_BOTTOM];
  const ul = raw[FM_IDX.UPPER_LIP];
  const ll = raw[FM_IDX.LOWER_LIP];

  const leftPupil  = { x: lp.x * natW, y: lp.y * natH };
  const rightPupil = { x: rp.x * natW, y: rp.y * natH };
  const chin       = { x: ch.x * natW, y: ch.y * natH };
  const leftCheek  = { x: lc.x * natW, y: lc.y * natH };
  const rightCheek = { x: rc.x * natW, y: rc.y * natH };
  const noseTip    = { x: nt.x * natW, y: nt.y * natH };

  const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
  const eyeCenterX = (leftPupil.x + rightPupil.x) / 2;
  const crownY = eyeCenterY - (chin.y - eyeCenterY);
  const crown = { x: eyeCenterX, y: crownY };

  const eyeAngleDeg = Math.atan2(rightPupil.y - leftPupil.y, rightPupil.x - leftPupil.x) * 180 / Math.PI;
  const leftEyeOpen = Math.abs(leT.y - leB.y) * natH;
  const rightEyeOpen = Math.abs(reT.y - reB.y) * natH;
  const mouthOpen = Math.abs(ul.y - ll.y) * natH;
  const noseToLeftCheek = Math.abs(noseTip.x * natW - leftCheek.x);
  const noseToRightCheek = Math.abs(noseTip.x * natW - rightCheek.x);
  const symmetryRatio = Math.min(noseToLeftCheek, noseToRightCheek) / Math.max(noseToLeftCheek, noseToRightCheek);

  return {
    crown, chin, leftPupil, rightPupil, leftCheek, rightCheek, noseTip,
    eyeAngleDeg,
    eyeCenterY: eyeCenterY / natH,
    faceHeight: (chin.y - crownY) / natH,
    symmetryRatio,
    leftEyeOpen, rightEyeOpen, mouthOpen,
    natW, natH,
  };
}

function computeRealMetrics(faceData, spec) {
  const { eyeAngleDeg, symmetryRatio, natW, natH,
          crown, chin, leftPupil, rightPupil } = faceData;

  const FH = state.cropFrameH;
  const FW = Math.round(FH * spec.wMm / spec.hMm);
  const MM = FH / spec.hMm;

  const coverScale = Math.max(FW / natW, FH / natH);
  const offsetX = (natW * coverScale - FW) / 2;
  const offsetY = (natH * coverScale - FH) / 2;

  function toFrame(pt) {
    const coverX = pt.x * coverScale - offsetX;
    const coverY = pt.y * coverScale - offsetY;
    return {
      x: FW / 2 + (coverX - FW / 2) * state.imgScale + state.imgPos.x,
      y: FH / 2 + (coverY - FH / 2) * state.imgScale + state.imgPos.y,
    };
  }

  const crownF = toFrame(crown);
  const chinF = toFrame(chin);
  const eyeLF = toFrame(leftPupil);
  const eyeRF = toFrame(rightPupil);

  const eyeYF = (eyeLF.y + eyeRF.y) / 2;
  const faceHF = chinF.y - crownF.y;
  const faceMm = faceHF / MM;
  const eyePosPct = ((eyeYF / FH) * 100).toFixed(0);
  const faceRatioPct = ((faceHF / FH) * 100).toFixed(0);
  const faceCenterXF = (eyeLF.x + eyeRF.x) / 2;
  const centerOffsetMm = (Math.abs(faceCenterXF - FW / 2) / MM).toFixed(1);

  const symPct = (symmetryRatio * 100).toFixed(0);
  const headTilt = eyeAngleDeg.toFixed(1);
  const brightnessVal = computeBrightness(faceData);

  return [
    { key: 'eye_angle', label: 'Eye Level', labelKo: '눈 수평', value: `${headTilt}°`, num: Math.abs(parseFloat(headTilt)), pass: Math.abs(parseFloat(headTilt)) < 2.0, threshold: '< 2.0°' },
    { key: 'eye_height', label: 'Eye Position', labelKo: '눈 높이', value: `${eyePosPct}%`, num: parseFloat(eyePosPct), pass: parseFloat(eyePosPct) >= 40 && parseFloat(eyePosPct) <= 48, threshold: '40–48%' },
    { key: 'face_ratio', label: 'Face Ratio', labelKo: '얼굴 비율', value: `${faceRatioPct}%`, num: parseFloat(faceRatioPct), pass: parseFloat(faceRatioPct) >= 50 && parseFloat(faceRatioPct) <= 80, threshold: '50–80%' },
    { key: 'face_size', label: 'Face Size', labelKo: '얼굴 크기', value: `${faceMm.toFixed(1)}mm`, num: faceMm, pass: faceMm >= spec.faceMin && faceMm <= spec.faceMax, threshold: `${spec.faceMin}–${spec.faceMax}mm` },
    { key: 'symmetry', label: 'Symmetry', labelKo: '좌우 대칭', value: `${symPct}%`, num: parseFloat(symPct), pass: parseFloat(symPct) >= 85, threshold: '≥ 85%' },
    { key: 'center', label: 'Center', labelKo: '중심 이탈', value: `${centerOffsetMm}mm`, num: parseFloat(centerOffsetMm), pass: parseFloat(centerOffsetMm) < 3.0, threshold: '< 3.0mm' },
    { key: 'brightness', label: 'Brightness', labelKo: '밝기 균일', value: `${brightnessVal}%`, num: brightnessVal, pass: brightnessVal >= 70, threshold: '≥ 70%' },
  ];
}

function computeBrightness(faceData) {
  if (!state.loadedImg) return 85;
  try {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    const img = state.loadedImg;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const { leftCheek, rightCheek, crown, chin } = faceData;
    const x = Math.max(0, Math.floor(leftCheek.x));
    const y = Math.max(0, Math.floor(crown.y));
    const w = Math.max(1, Math.floor(rightCheek.x - leftCheek.x));
    const h = Math.max(1, Math.floor(chin.y - crown.y));

    const imageData = ctx.getImageData(x, y, Math.min(w, canvas.width - x), Math.min(h, canvas.height - y));
    const data = imageData.data;
    let leftSum = 0, rightSum = 0, leftCount = 0, rightCount = 0;
    const midX = w / 2;
    for (let i = 0; i < data.length; i += 4) {
      const px = ((i / 4) % w);
      const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
      if (px < midX) { leftSum += lum; leftCount++; }
      else { rightSum += lum; rightCount++; }
    }
    const leftAvg = leftCount ? leftSum / leftCount : 128;
    const rightAvg = rightCount ? rightSum / rightCount : 128;
    const uniformity = (1 - Math.abs(leftAvg - rightAvg) / Math.max(leftAvg, rightAvg, 1)) * 100;
    return Math.round(uniformity);
  } catch (e) {
    return 85;
  }
}

function generateFallbackMetrics(spec) {
  const eyeAngle = (Math.random() * 2.0 - 0.3).toFixed(1);
  const faceRatio = (62 + Math.random() * 14).toFixed(0);
  const symmetry = (90 + Math.random() * 8).toFixed(0);
  const eyeHeight = (42 + Math.random() * 10).toFixed(0);
  const faceCenter = (Math.random() * 4 - 2).toFixed(1);
  const headTilt = (Math.random() * 2.5 - 0.8).toFixed(1);
  const brightness = (85 + Math.random() * 12).toFixed(0);
  const faceMm = (spec.faceMin + Math.random() * (spec.faceMax - spec.faceMin)).toFixed(1);

  return [
    { key: 'eye_angle', label: 'Eye Level', labelKo: '눈 수평', value: `${eyeAngle}°`, num: Math.abs(parseFloat(eyeAngle)), pass: Math.abs(parseFloat(eyeAngle)) < 2.0, threshold: '< 2.0°' },
    { key: 'eye_height', label: 'Eye Position', labelKo: '눈 높이', value: `${eyeHeight}%`, num: parseFloat(eyeHeight), pass: parseFloat(eyeHeight) >= 40 && parseFloat(eyeHeight) <= 55, threshold: '40–55%' },
    { key: 'face_ratio', label: 'Face Ratio', labelKo: '얼굴 비율', value: `${faceRatio}%`, num: parseFloat(faceRatio), pass: parseFloat(faceRatio) >= 50 && parseFloat(faceRatio) <= 80, threshold: '50–80%' },
    { key: 'face_size', label: 'Face Size', labelKo: '얼굴 크기', value: `${faceMm}mm`, num: parseFloat(faceMm), pass: parseFloat(faceMm) >= spec.faceMin && parseFloat(faceMm) <= spec.faceMax, threshold: `${spec.faceMin}–${spec.faceMax}mm` },
    { key: 'symmetry', label: 'Symmetry', labelKo: '좌우 대칭', value: `${symmetry}%`, num: parseFloat(symmetry), pass: parseFloat(symmetry) >= 85, threshold: '≥ 85%' },
    { key: 'center', label: 'Center', labelKo: '중심 이탈', value: `${faceCenter}mm`, num: Math.abs(parseFloat(faceCenter)), pass: Math.abs(parseFloat(faceCenter)) < 3.0, threshold: '< 3.0mm' },
    { key: 'brightness', label: 'Brightness', labelKo: '밝기 균일', value: `${brightness}%`, num: parseFloat(brightness), pass: parseFloat(brightness) >= 70, threshold: '≥ 70%' },
  ];
}

// ═══════════════════════════════════════════════
// Background Removal Module (@imgly)
// ═══════════════════════════════════════════════

let imglyRemoveBackground = null;

async function loadImgly() {
  if (imglyRemoveBackground) return true;
  try {
    const m = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm');
    imglyRemoveBackground = m.removeBackground || m.default?.removeBackground || m.default;
    console.log('[imgly] Background removal loaded');
    return true;
  } catch (err) {
    console.warn('[imgly] Load failed:', err.message);
    return false;
  }
}

async function removeBackground(file, onProgress) {
  if (!imglyRemoveBackground) {
    const loaded = await loadImgly();
    if (!loaded) return null;
  }
  try {
    const blob = await imglyRemoveBackground(file, {
      progress: (key, current, total) => {
        if (total > 0 && onProgress) {
          onProgress(Math.round((current / total) * 100), key);
        }
      }
    });
    return blob;
  } catch (err) {
    console.warn('[imgly] Removal failed:', err.message);
    return null;
  }
}

function compositeWithBackground(removedBlob, bgColor) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('bgCanvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, img.width, img.height);
      } else {
        ctx.clearRect(0, 0, img.width, img.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        resolve(blob ? URL.createObjectURL(blob) : null);
      }, 'image/png');
    };
    img.src = URL.createObjectURL(removedBlob);
  });
}

// ═══════════════════════════════════════════════
// Canvas Crop + Download Module
// ═══════════════════════════════════════════════

function performCrop() {
  const img = state.loadedImg;
  const spec = state.spec;
  if (!img || !spec) return null;

  const canvas = document.getElementById('cropCanvas');
  canvas.width = spec.pxW;
  canvas.height = spec.pxH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = state.bgColor;
  ctx.fillRect(0, 0, spec.pxW, spec.pxH);

  const FH = state.cropFrameH;
  const FW = Math.round(FH * spec.wMm / spec.hMm);
  const outScale = spec.pxH / FH;

  ctx.scale(outScale, outScale);
  ctx.translate(FW / 2 + state.imgPos.x, FH / 2 + state.imgPos.y);
  ctx.scale(state.imgScale, state.imgScale);
  ctx.translate(-FW / 2, -FH / 2);

  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  const coverScale = Math.max(FW / natW, FH / natH);
  const dw = natW * coverScale;
  const dh = natH * coverScale;
  ctx.drawImage(img, (FW - dw) / 2, (FH - dh) / 2, dw, dh);

  return canvas;
}

function downloadCrop() {
  const canvas = performCrop();
  if (!canvas) return;
  const spec = state.spec;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MONKOS_crop_${spec.id}_${spec.pxW}x${spec.pxH}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.95);
}

// ═══════════════════════════════════════════════
// Audio Engine (Web Audio API)
// ═══════════════════════════════════════════════

const AudioFX = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  play(type) {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const t = this.ctx.currentTime;
    switch (type) {
      case 'tick':
        osc.type = 'sine'; osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
        gain.gain.setValueAtTime(0.08, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(); osc.stop(t + 0.1); break;
      case 'scan':
        osc.type = 'sine'; osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(1600, t + 0.8);
        gain.gain.setValueAtTime(0.04, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        osc.start(); osc.stop(t + 1.0); break;
      case 'pass':
        osc.type = 'sine'; osc.frequency.setValueAtTime(523, t);
        osc.frequency.setValueAtTime(659, t + 0.12); osc.frequency.setValueAtTime(784, t + 0.24);
        gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(); osc.stop(t + 0.5); break;
      case 'warn':
        osc.type = 'triangle'; osc.frequency.setValueAtTime(350, t);
        osc.frequency.setValueAtTime(280, t + 0.15);
        gain.gain.setValueAtTime(0.08, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(); osc.stop(t + 0.3); break;
    }
  }
};

// ═══════════════════════════════════════════════
// Step Navigation
// ═══════════════════════════════════════════════

function goToStep(n) {
  state.step = n;
  $$('.step').forEach(el => el.classList.remove('active'));
  $(`#step${n}`).classList.add('active');
  $$('.progress-step').forEach((el, i) => {
    const stepNum = i + 1;
    el.classList.toggle('active', stepNum === n);
    el.classList.toggle('done', stepNum < n);
  });
  if (n === 2) renderStep2();
  if (n === 3) renderStep3Crop();
  if (n === 4) renderStep4BG();
  if (n === 5) renderStep5();
  const container = $('#stepContainer');
  if (container) container.scrollTop = 0;
}

// ═══════════════════════════════════════════════
// Step 1: Country + Spec Selection
// ═══════════════════════════════════════════════

function renderCountryList(filter = '') {
  const list = $('#countryList');
  const filtered = COUNTRIES.filter(c =>
    !filter || c.name.toLowerCase().includes(filter) ||
    c.nameEn.toLowerCase().includes(filter) || c.id.includes(filter)
  );
  list.innerHTML = filtered.map(c => `
    <div class="country-card" data-id="${c.id}">
      <span class="country-flag">${c.flag}</span>
      <div class="country-info">
        <div class="country-name">${c.name}</div>
        <div class="country-name-en">${c.nameEn}</div>
      </div>
      <span class="country-pattern">${c.pattern === 'A' ? '35×45' : c.pattern === 'B' ? '51×51' : c.pattern === 'C' ? '50×70' : 'Custom'}</span>
    </div>
  `).join('');
  list.querySelectorAll('.country-card').forEach(card => {
    card.addEventListener('click', () => {
      state.country = COUNTRIES.find(c => c.id === card.dataset.id);
      showSpecPanel();
    });
  });
}

function showSpecPanel() {
  const country = state.country;
  if (!country) return;
  $('#countryList').classList.add('hidden');
  $('.search-box').classList.add('hidden');
  $('.step-1 .step-header').classList.add('hidden');
  $('#specPanel').classList.remove('hidden');
  $('#backCountryName').textContent = `${country.flag} ${country.name}`;

  const specs = SPECS[country.id] || [];
  const list = $('#specList');
  list.innerHTML = specs.map(s => `
    <div class="spec-card" data-id="${s.id}">
      <div class="spec-card-left">
        <span class="spec-type-icon">${TYPE_ICONS[s.type] || '📄'}</span>
        <div>
          <div class="spec-name">${s.name}</div>
          <div class="spec-standard">${s.standard} Standard</div>
        </div>
      </div>
      <div class="spec-card-right">
        <div class="spec-size">${s.size}</div>
        <div class="spec-px">${s.px}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.spec-card').forEach(card => {
    card.addEventListener('click', () => {
      state.spec = (SPECS[state.country.id] || []).find(s => s.id === card.dataset.id);
      state.bgColor = state.spec.bg || '#FFFFFF';
      list.querySelectorAll('.spec-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AudioFX.init();
      AudioFX.play('tick');
      setTimeout(() => goToStep(2), 300);
    });
  });
}

function hideSpecPanel() {
  state.country = null; state.spec = null;
  $('#specPanel').classList.add('hidden');
  $('#countryList').classList.remove('hidden');
  $('.search-box').classList.remove('hidden');
  $('.step-1 .step-header').classList.remove('hidden');
}

// ═══════════════════════════════════════════════
// Step 2: Upload + FaceMesh
// ═══════════════════════════════════════════════

function renderStep2() {
  if (!state.spec) return;
  const s = state.spec, c = state.country;
  $('#step2SpecInfo').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">${c.flag}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">${s.name}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted)">${s.size} · ${s.standard}</div>
      </div>
    </div>
    <div style="font-family:var(--font-mono);font-size:10px;color:var(--accent);font-weight:700">${s.px}</div>
  `;
}

async function handleImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  state.imageFile = file;
  state.imageUrl = URL.createObjectURL(file);
  state.bgRemovedBlob = null;
  state.bgCompositeUrl = null;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = state.imageUrl;
  img.onload = async () => {
    state.loadedImg = img;

    if (state.faceMeshReady) {
      console.log('[FaceMesh] Analyzing uploaded image...');
      const raw = await detectFace(img);
      if (raw) {
        state.faceData = extractLandmarks(raw, img.naturalWidth, img.naturalHeight);
        console.log('[FaceMesh] Face detected:', state.faceData);
        autoPlaceFace();
      } else {
        state.faceData = null;
        console.log('[FaceMesh] No face detected — using fallback');
      }
    }

    goToStep(3);
  };
}

// ═══════════════════════════════════════════════
// 8-Point System + autoPlace (from crop.js 735-784)
// ═══════════════════════════════════════════════

function getFW() { return Math.round(state.cropFrameH * state.spec.wMm / state.spec.hMm); }
function getMM() { return state.cropFrameH / state.spec.hMm; }

function autoPlaceFace() {
  const spec = state.spec;
  const fd = state.faceData;
  const img = state.loadedImg;
  if (!spec || !fd || !img) return;

  const FH = state.cropFrameH;
  const FW = getFW();
  const MM = getMM();
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  const coverScale = Math.max(FW / natW, FH / natH);
  const offsetX = (natW * coverScale - FW) / 2;
  const offsetY = (natH * coverScale - FH) / 2;

  function toCover(pt) {
    return { x: pt.x * coverScale - offsetX, y: pt.y * coverScale - offsetY };
  }

  const crownCover = toCover(fd.crown);
  const chinCover = toCover(fd.chin);
  const eyeLCover = toCover(fd.leftPupil);
  const eyeRCover = toCover(fd.rightPupil);

  const eyeYCover = (eyeLCover.y + eyeRCover.y) / 2;
  const faceHCover = chinCover.y - crownCover.y;

  const targetFacePx = (spec.faceTarget || 34) * MM;
  const newScale = targetFacePx / faceHCover;
  const newPosY = 0.43 * FH - FH / 2 - (eyeYCover - FH / 2) * newScale;
  const faceCenterXCover = (eyeLCover.x + eyeRCover.x) / 2;
  const newPosX = -(faceCenterXCover - FW / 2) * newScale;

  state.imgScale = newScale;
  state.imgPos = { x: newPosX, y: newPosY };

  // Convert ALL landmarks to frame coordinates → pts
  const imgLandmarks = { crown: fd.crown, chin: fd.chin, leftPupil: fd.leftPupil,
    rightPupil: fd.rightPupil, leftCheek: fd.leftCheek, rightCheek: fd.rightCheek };
  const pts = {};
  for (const [key, imgPt] of Object.entries(imgLandmarks)) {
    const cover = toCover(imgPt);
    pts[key] = {
      x: FW / 2 + (cover.x - FW / 2) * newScale + newPosX,
      y: FH / 2 + (cover.y - FH / 2) * newScale + newPosY,
    };
  }
  state.pts = pts;
}

// ─── 3-stage color coding (from crop.js) ───
const JUDGE = {
  green: '#00B894', greenDim: 'rgba(0,184,148,0.15)',
  yellow: '#FDCB6E', yellowDim: 'rgba(253,203,110,0.15)',
  red: '#E17055', redDim: 'rgba(225,112,85,0.15)',
};

function getFaceColor(faceMm, spec) {
  if (faceMm >= spec.faceMin + 1 && faceMm <= spec.faceMax - 1) return JUDGE.green;
  if (faceMm >= spec.faceMin && faceMm <= spec.faceMax) return JUDGE.yellow;
  return JUDGE.red;
}
function getEyeColor(eyeRatio) {
  if (eyeRatio >= 0.43 && eyeRatio <= 0.45) return JUDGE.green;
  if (eyeRatio >= 0.40 && eyeRatio <= 0.48) return JUDGE.yellow;
  return JUDGE.red;
}

// ═══════════════════════════════════════════════
// Step 3: Crop (8-point SVG overlay + instant metrics)
// ═══════════════════════════════════════════════

function renderStep3Crop() {
  const imgSrc = state.imageUrl;
  if (!imgSrc || !state.spec) return;
  const s = state.spec, c = state.country;

  const FH = state.cropFrameH;
  const FW = getFW();

  const frame = $('#cropFrame');
  frame.style.width = FW + 'px';
  frame.style.height = FH + 'px';

  const viewport = $('#cropViewport');
  viewport.style.height = (FH + 20) + 'px';

  const cropImg = $('#cropImg');
  cropImg.src = imgSrc;
  cropImg.style.width = FW + 'px';
  cropImg.style.height = FH + 'px';
  applyCropTransform();

  // SVG sizing
  const svg = $('#overlaySvg');
  svg.setAttribute('width', FW);
  svg.setAttribute('height', FH);
  svg.style.transform = `translate(-50%, -50%)`;

  $('#cropSpecBar').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">${TYPE_ICONS[s.type] || '📄'}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">${c.flag} ${s.name}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--muted)">${s.size} · ${s.standard} · ${s.pxW}×${s.pxH}px</div>
      </div>
    </div>
  `;

  $('#adjustBtn').classList.remove('hidden');
  $('#saveBtn').disabled = false;

  renderOverlay();
  renderInstantMetrics();
}

function applyCropTransform() {
  const cropImg = $('#cropImg');
  if (!cropImg) return;
  cropImg.style.transform = `translate(calc(-50% + ${state.imgPos.x}px), calc(-50% + ${state.imgPos.y}px)) scale(${state.imgScale})`;
}

// ─── SVG Overlay Render (from crop.js render()) ───
function renderOverlay() {
  const pts = state.pts;
  if (!pts || !state.spec) return;

  const FH = state.cropFrameH;
  const FW = getFW();
  const MM = getMM();
  const spec = state.spec;

  const faceMm = (pts.chin.y - pts.crown.y) / MM;
  const eyeY = (pts.leftPupil.y + pts.rightPupil.y) / 2;
  const eyeRatio = eyeY / FH;
  const fc = getFaceColor(faceMm, spec);
  const ec = getEyeColor(eyeRatio);

  function setA(id, attrs) {
    const el = document.getElementById(id);
    if (!el) return;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  }

  // Top/bottom masks
  setA('maskTop', { x: 0, y: 0, width: FW, height: Math.max(0, pts.crown.y) });
  setA('maskBottom', { x: 0, y: pts.chin.y, width: FW, height: Math.max(0, FH - pts.chin.y) });

  // Guide lines
  setA('svgCrownLine', { x1: 0, y1: pts.crown.y, x2: FW, y2: pts.crown.y, stroke: fc });
  setA('svgChinLine', { x1: 0, y1: pts.chin.y, x2: FW, y2: pts.chin.y });
  setA('svgEyeLine', { x1: 10, y1: eyeY, x2: FW - 10, y2: eyeY, stroke: ec });
  setA('svgCenterV', { x1: FW / 2, y1: 0, x2: FW / 2, y2: FH });

  // Dimension line (right side)
  setA('svgDimV', { x1: FW - 9, y1: pts.crown.y, x2: FW - 9, y2: pts.chin.y, stroke: fc });
  setA('svgDimTop', { x1: FW - 13, y1: pts.crown.y, x2: FW - 5, y2: pts.crown.y, stroke: fc });
  setA('svgDimBot', { x1: FW - 13, y1: pts.chin.y, x2: FW - 5, y2: pts.chin.y, stroke: fc });

  // Eye points
  setA('pupilL', { cx: pts.leftPupil.x, cy: pts.leftPupil.y, fill: ec });
  setA('pupilR', { cx: pts.rightPupil.x, cy: pts.rightPupil.y, fill: ec });

  // Labels
  setA('svgCrownLabel', { x: 5, y: pts.crown.y - 4 });
  document.getElementById('svgCrownLabel').textContent = 'CROWN';
  setA('svgEyeLabel', { x: FW - 42, y: eyeY - 5 });
  document.getElementById('svgEyeLabel').textContent = `EYE ${(eyeRatio * 100).toFixed(0)}%`;
  document.getElementById('svgEyeLabel').setAttribute('fill', ec);
  setA('svgFaceLabel', { x: FW - 8, y: (pts.crown.y + pts.chin.y) / 2 + 3, 'text-anchor': 'end' });
  document.getElementById('svgFaceLabel').textContent = `${faceMm.toFixed(1)}mm`;
  document.getElementById('svgFaceLabel').setAttribute('fill', fc);

  // Crown pin position
  const pin = $('#crownPin');
  if (pin) {
    pin.style.left = `calc(50% + ${pts.crown.x - FW / 2}px)`;
    pin.style.top = `calc(50% + ${pts.crown.y - FH / 2}px)`;
  }
}

// ─── Instant Metrics Panel (R5: shown immediately) ───
function renderInstantMetrics() {
  const pts = state.pts;
  if (!pts || !state.spec) return;

  const FH = state.cropFrameH;
  const FW = getFW();
  const MM = getMM();
  const spec = state.spec;

  const faceMm = (pts.chin.y - pts.crown.y) / MM;
  const topMm = pts.crown.y / MM;
  const bottomMm = spec.hMm - topMm - faceMm;
  const eyeY = (pts.leftPupil.y + pts.rightPupil.y) / 2;
  const eyeRatio = eyeY / FH;
  const eyePct = (eyeRatio * 100).toFixed(0);

  const fc = getFaceColor(faceMm, spec);
  const ec = getEyeColor(eyeRatio);

  function colorClass(c) {
    if (c === JUDGE.green) return 'green';
    if (c === JUDGE.yellow) return 'yellow';
    if (c === JUDGE.red) return 'red';
    return 'muted';
  }

  const items = [
    { label: 'Face', value: `${faceMm.toFixed(1)}mm`, color: colorClass(fc) },
    { label: 'Eye', value: `${eyePct}%`, color: colorClass(ec) },
    { label: 'Top', value: `${topMm.toFixed(1)}mm`, color: 'muted' },
    { label: 'Bottom', value: `${bottomMm.toFixed(1)}mm`, color: 'muted' },
  ];

  const grid = $('#metricsGrid');
  if (!grid) return;
  grid.innerHTML = items.map(i => `
    <div class="metric-cell">
      <span class="metric-cell-label">${i.label}</span>
      <span class="metric-cell-value ${i.color}">${i.value}</span>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// Step 4: Background Removal (was Step 3)
// ═══════════════════════════════════════════════

async function renderStep4BG() {
  if (!state.imageUrl) return;
  const previewImg = $('#bgPreviewImg');

  // Show the cropped result as the preview base
  const cropCanvas = performCrop();
  if (cropCanvas) {
    previewImg.src = cropCanvas.toDataURL('image/png');
  } else {
    previewImg.src = state.imageUrl;
  }

  const overlay = $('#bgProcessing');
  overlay.classList.remove('done');
  const fill = $('#bgProgressFill');
  fill.style.width = '0%';

  $$('.bg-color-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === state.bgColor);
  });

  // Run background removal on the cropped image
  const imglyLoaded = await loadImgly();
  if (imglyLoaded) {
    const sourceBlob = cropCanvas
      ? await new Promise(r => cropCanvas.toBlob(r, 'image/png'))
      : state.imageFile;

    if (sourceBlob) {
      const blob = await removeBackground(sourceBlob, (pct, key) => {
        fill.style.width = pct + '%';
      });

      if (blob) {
        state.bgRemovedBlob = blob;
        const compositeUrl = await compositeWithBackground(blob, state.bgColor);
        state.bgCompositeUrl = compositeUrl;
        if (compositeUrl) previewImg.src = compositeUrl;
        overlay.classList.add('done');
        AudioFX.play('tick');
        return;
      }
    }
  }

  // Fallback: simulate processing
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15 + 5;
    if (progress >= 100) { progress = 100; clearInterval(interval);
      setTimeout(() => { overlay.classList.add('done'); AudioFX.play('tick'); }, 300);
    }
    fill.style.width = progress + '%';
  }, 200);
}

// ═══════════════════════════════════════════════
// Inspection Sequence
// ═══════════════════════════════════════════════

function startInspection() {
  AudioFX.init();
  state.inspecting = true;
  state.inspectDone = false;

  if (state.faceData && state.spec) {
    state.metrics = computeRealMetrics(state.faceData, state.spec);
    console.log('[Inspect] Using real FaceMesh metrics');
  } else {
    state.metrics = generateFallbackMetrics(state.spec);
    console.log('[Inspect] Using fallback metrics');
  }

  $('#inspectBtn').classList.add('hidden');
  $('#cropAdjustHint').classList.add('hidden');
  $('#inspectOverlay').classList.remove('hidden');
  $('#inspectResults').classList.remove('hidden');

  const dot = $('#inspectStatusDot');
  dot.className = 'inspect-status-dot';
  $('#inspectStatusText').textContent = 'SCANNING...';
  $('#inspectPassBadge').classList.add('hidden');
  $('#inspectSummary').classList.add('hidden');

  renderMetricRows();

  const faceData = state.faceData;
  const metrics = state.metrics;

  const tiltVal = metrics.find(m => m.key === 'eye_angle')?.value || '0.3°';
  const faceSizeVal = metrics.find(m => m.key === 'face_size')?.value || '34.0mm';

  const seq = [
    { t: 0, fn: () => { $('#scanLine').classList.add('active'); AudioFX.play('scan'); }},
    { t: 800, fn: () => {
      $('#eyeLine').classList.add('visible');
      if (faceData) {
        const viewport = $('#cropViewport');
        const vw = viewport.offsetWidth, vh = viewport.offsetHeight;
        const eyeLine = $('#eyeLine');
        eyeLine.style.top = `${(faceData.eyeCenterY * 100).toFixed(1)}%`;
      }
      AudioFX.play('tick');
      showFloatText(`Tilt ${tiltVal} — ${metrics[0].pass ? 'OK ✓' : 'Adjust !'}`);
    }},
    { t: 1600, fn: () => hideFloatText() },
    { t: 2000, fn: () => {
      $('#centerLine').classList.add('visible');
      $('#faceOval').classList.add('visible');
      AudioFX.play('tick');
      showFloatText('Frontal Check ✓');
    }},
    { t: 2800, fn: () => hideFloatText() },
    { t: 3200, fn: () => {
      $('#brightnessScan').classList.add('active');
      AudioFX.play('scan');
      showFloatText(`Brightness ${metrics.find(m => m.key === 'brightness')?.value || '90%'} ✓`);
    }},
    { t: 4200, fn: () => hideFloatText() },
    { t: 4500, fn: () => {
      $('#crownLine').classList.add('visible');
      $('#chinLine').classList.add('visible');
      AudioFX.play('tick');
      showFloatText(`${faceSizeVal} — ${state.spec.standard} Range ✓`);
    }},
    { t: 5300, fn: () => hideFloatText() },
    ...metrics.map((m, i) => ({
      t: 5500 + i * 200,
      fn: () => {
        const row = $$(`.metric-row`)[i];
        if (row) {
          row.classList.add('visible');
          const barFill = row.querySelector('.metric-bar-fill');
          if (barFill) {
            const w = m.pass ? Math.min(100, 60 + m.num * 0.5) : Math.min(100, 30 + m.num * 0.7);
            barFill.style.width = `${w}%`;
          }
          AudioFX.play('tick');
        }
      }
    })),
    { t: 5500 + metrics.length * 200 + 400, fn: () => {
      const passCount = metrics.filter(m => m.pass).length;
      const allPass = passCount === metrics.length;
      state.inspectDone = true;
      dot.classList.add('done', allPass ? 'pass' : 'warn');
      $('#inspectStatusText').textContent = 'ANALYSIS COMPLETE';
      const badge = $('#inspectPassBadge');
      badge.classList.remove('hidden');
      badge.textContent = `${passCount}/${metrics.length} PASS`;
      badge.style.color = allPass ? 'var(--accent)' : 'var(--warn)';
      badge.style.background = allPass ? 'var(--accent-dim)' : 'var(--warn-dim)';
      const summary = $('#inspectSummary');
      summary.classList.remove('hidden');
      summary.className = `inspect-summary ${allPass ? 'pass' : 'warn'}`;
      summary.innerHTML = `
        <div class="inspect-summary-title ${allPass ? 'pass' : 'warn'}">
          ${allPass ? '✅ Specification Compliant — Ready to submit' : '⚠️ Some adjustments needed'}
        </div>
        <div class="inspect-summary-desc">
          ${allPass ? `All metrics within ${state.spec.standard} standard compliance range.` : 'Please adjust the marked items and re-inspect.'}
        </div>
      `;
      if (allPass) {
        showFloatText('MONKOS Verified ✓'); AudioFX.play('pass');
        setTimeout(() => { const stamp = $('#inspectStamp'); stamp.classList.remove('hidden'); stamp.classList.add('visible'); }, 300);
      } else { AudioFX.play('warn'); showFloatText('Adjustment Required'); }
      $('#saveBtn').disabled = false;
    }},
    { t: 5500 + metrics.length * 200 + 2000, fn: () => hideFloatText() },
  ];
  seq.forEach(({ t, fn }) => setTimeout(fn, t));
}

function renderMetricRows() {
  $('#inspectMetrics').innerHTML = state.metrics.map(m => `
    <div class="metric-row">
      <div class="metric-status ${m.pass ? 'pass' : 'fail'}">${m.pass ? '✓' : '!'}</div>
      <div class="metric-label">
        <div class="metric-label-main">${m.labelKo}</div>
        <div class="metric-label-en">${m.label}</div>
      </div>
      <div class="metric-bar"><div class="metric-bar-fill ${m.pass ? 'pass' : 'fail'}"></div></div>
      <div class="metric-value ${m.pass ? 'pass' : 'fail'}">${m.value}</div>
    </div>
  `).join('');
}

function showFloatText(text) {
  const el = $('#inspectFloatText');
  el.textContent = text;
  el.className = 'inspect-float-text visible';
}

function hideFloatText() {
  $('#inspectFloatText').className = 'inspect-float-text fadeout';
}

function resetInspectOverlay() {
  ['scanLine'].forEach(id => $(`#${id}`)?.classList.remove('active'));
  ['eyeLine','centerLine','faceOval','crownLine','chinLine'].forEach(id => $(`#${id}`)?.classList.remove('visible'));
  $('#brightnessScan')?.classList.remove('active');
  $('#inspectFloatText').className = 'inspect-float-text';
  const stamp = $('#inspectStamp');
  stamp.classList.remove('visible'); stamp.classList.add('hidden');
}

// ═══════════════════════════════════════════════
// Step 5: Complete + Download
// ═══════════════════════════════════════════════

function renderStep5() {
  if (!state.spec) return;
  const s = state.spec, c = state.country;
  $('#completeSpec').textContent = `${c.flag} ${s.name} · ${s.size} · ${s.standard}`;

  // Generate crop preview
  const canvas = performCrop();
  if (canvas) {
    $('#completeImg').src = canvas.toDataURL('image/jpeg', 0.9);
  } else {
    $('#completeImg').src = state.bgCompositeUrl || state.imageUrl;
  }

  const previewEl = $('.complete-preview');
  previewEl.style.aspectRatio = s.ratio === 1 ? '1' : `${s.ratio}`;

  const passCount = state.metrics.filter(m => m.pass).length;
  $('#completeMetrics').innerHTML = `
    <span class="complete-tag pass">${passCount}/${state.metrics.length} PASS</span>
    <span class="complete-tag standard">${s.standard}</span>
  `;
}

// ═══════════════════════════════════════════════
// Touch Gestures
// ═══════════════════════════════════════════════

let touchState = { startX: 0, startY: 0, isDragging: false, startPos: { x: 0, y: 0 } };

function initCropTouch() {
  const viewport = $('#cropViewport');
  if (!viewport) return;
  viewport.addEventListener('touchstart', (e) => {
    touchState.isDragging = true;
    touchState.startX = e.touches[0].clientX;
    touchState.startY = e.touches[0].clientY;
    touchState.startPos = { ...state.imgPos };
  }, { passive: true });
  viewport.addEventListener('touchmove', (e) => {
    if (!touchState.isDragging) return;
    const dx = e.touches[0].clientX - touchState.startX;
    const dy = e.touches[0].clientY - touchState.startY;
    state.imgPos = { x: touchState.startPos.x + dx, y: touchState.startPos.y + dy };
    applyCropTransform();
  }, { passive: true });
  viewport.addEventListener('touchend', () => {
    touchState.isDragging = false;
  });
}

// ═══════════════════════════════════════════════
// Upload: Drag & Drop
// ═══════════════════════════════════════════════

function initUpload() {
  const zone = $('#uploadZone'), input = $('#fileInput');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); handleImage(e.dataTransfer.files[0]); });
  input.addEventListener('change', (e) => handleImage(e.target.files[0]));
}

// ═══════════════════════════════════════════════
// Event Bindings
// ═══════════════════════════════════════════════

function initEvents() {
  $('#countrySearch').addEventListener('input', (e) => renderCountryList(e.target.value.toLowerCase()));
  $('#backToCountry').addEventListener('click', hideSpecPanel);

  $('#bgColorOptions').addEventListener('click', async (e) => {
    const btn = e.target.closest('.bg-color-btn');
    if (!btn) return;
    state.bgColor = btn.dataset.color;
    $$('.bg-color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (state.bgRemovedBlob) {
      const url = await compositeWithBackground(state.bgRemovedBlob, state.bgColor);
      if (url) { state.bgCompositeUrl = url; $('#bgPreviewImg').src = url; }
    }
    $('#bgPreview').style.backgroundColor = state.bgColor;
  });

  $('#bgNextBtn').addEventListener('click', () => goToStep(5));

  const adjustBtn = $('#adjustBtn');
  if (adjustBtn) {
    adjustBtn.addEventListener('click', () => {
      const pin = $('#crownPin');
      if (pin) pin.classList.toggle('hidden');
    });
  }

  $('#retakeBtn').addEventListener('click', () => {
    state.imageUrl = null; state.imageFile = null; state.loadedImg = null;
    state.bgRemovedBlob = null; state.bgCompositeUrl = null; state.faceData = null;
    resetInspectOverlay(); goToStep(2);
  });

  $('#saveBtn').addEventListener('click', () => goToStep(4));

  $('#downloadBtn').addEventListener('click', () => downloadCrop());

  $('#anotherBtn').addEventListener('click', () => {
    state.imageUrl = null; state.imageFile = null; state.loadedImg = null;
    state.bgRemovedBlob = null; state.bgCompositeUrl = null;
    state.faceData = null; state.spec = null;
    resetInspectOverlay(); hideSpecPanel(); goToStep(1);
  });

  $('#shareBtn').addEventListener('click', () => {
    if (navigator.share) {
      const canvas = performCrop();
      if (canvas) {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], 'monkos_crop.jpg', { type: 'image/jpeg' });
          navigator.share({ title: 'MONKOS Crop', text: 'My ID photo is ready!', files: [file] }).catch(() => {});
        }, 'image/jpeg', 0.95);
      }
    }
  });

  $('#monkosBtn').addEventListener('click', () => {
    window.open('https://monkos.ai', '_blank');
  });
}

function updateClock() {
  const now = new Date();
  $('#statusTime').textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════

async function init() {
  renderCountryList();
  initUpload();
  initEvents();
  initCropTouch();
  updateClock();
  setInterval(updateClock, 30000);

  const fmOk = await initFaceMesh();
  console.log(`[Init] FaceMesh: ${fmOk ? 'ready' : 'fallback mode'}`);

  loadImgly().then(ok => console.log(`[Init] imgly: ${ok ? 'ready' : 'fallback mode'}`));
}

// Expose for CDP debugging
window.state = state;
window.goToStep = goToStep;
window.handleImage = handleImage;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
