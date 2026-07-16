// MONKOS Crop App — vanilla JS
// React 프로토 v4 → vanilla 전환

// ─── 샘플 이미지 (없음 — 업로드 유도) ───
const SAMPLE_IMG = "";

// ─── i18n 딕셔너리 ───
const CROP_I18N = {
  ko: {
    passport: '여권/신분증', id: '반명함',
    warnPassport: '눈썹/이마 노출 필수 · 무표정 정면',
    warnId: '헤어/의상 정돈 · 좋은 인상의 표정',
    crownLabel: '정수리', chinLabel: '턱끝', eyeLabel: '눈',
    inSpec: '✓ 규격 내', outSpec: '✗ 범위 초과',
    crownDrag: '정수리 드래그', chinLock: '턱끝 고정', scale: '스케일',
    pinHint: '↕ 드래그',
    metricTop: '상단', metricFace: '얼굴', metricBottom: '하단', metricEye: '눈위치',
    photo: '사진 선택', back: '← 돌아가기',
    reset: '↻ 초기화', preview: '👁 미리보기', download: '다운로드',
    upload: '업로드',
    sampleMsg: '정면 얼굴 사진(어깨~가슴선 노출)을 업로드하세요',
    analyzing: '얼굴 분석 중...',
    noFace: '얼굴을 감지하지 못했습니다. 정면 사진을 업로드하세요.',
    noWebGL: '이 브라우저에서는 얼굴 분석을 지원하지 않습니다.',
    noImage: '이전 단계의 이미지를 찾을 수 없습니다. 사진을 업로드하세요.',
    eyeWarnRed: (pct) => `눈 위치 ${pct}% — 허용 40~48%. 사진을 상하로 조정하세요.`,
    eyeWarnYellow: (pct) => `눈 위치 ${pct}% — 최적 43~45%. 미세 조정 권장.`,
    centerWarn: (mm, dir) => `좌우 중심 ${mm}mm 이탈 — 사진을 ${dir}으로 이동하세요.`,
    dirRight: '오른쪽', dirLeft: '왼쪽',
    faceSmall: (mm, min, max) => `얼굴 크기 ${mm}mm — 허용범위(${min}~${max}mm) 미달. 사진을 확대하세요.`,
    faceLarge: (mm, min, max) => `얼굴 크기 ${mm}mm — 허용범위(${min}~${max}mm) 초과. 사진을 축소하세요.`,
    eyeLow: (pct) => `눈 위치 ${pct}% — 허용범위(40~48%) 미달. 사진을 아래로 이동하세요.`,
    eyeHigh: (pct) => `눈 위치 ${pct}% — 허용범위(40~48%) 초과. 사진을 위로 이동하세요.`,
    idCenterWarn: (mm, dir) => `좌우 중심 ${mm}mm 이탈 — 사진을 ${dir}으로 이동하세요.`,
    idTopWarn: (mm) => `정수리 여백 ${mm}mm — 상단이 너무 가깝습니다. 사진을 아래로 이동하세요.`,
    idFaceWarn: (pct) => `얼굴 비중 ${pct}% — 50% 이상 권장. 사진을 확대하세요.`,
    icaoRange: (min, max) => `ICAO 허용범위 (${min}~${max}mm)`,
    specOutput: '출력 규격', specDpi: '해상도', specIcao: 'ICAO',
    specEyePos: '눈 위치', specGuide: '안내',
    specIcaoFace: (min, max) => `얼굴 ${min}~${max}mm`,
    specEyeRange: '40~48% (최적 43~45%)',
    modalTitle: '다운로드 확인', modalMetricsLabel: '확정 수치',
    modalFace: '얼굴', modalTop: '상단', modalBottom: '하단', modalEye: '눈위치',
    modalFaceWarn: (mm, min, max) => `얼굴 길이 ${mm}mm — ICAO 범위(${min}~${max}mm) 벗어남`,
    modalEyeWarn: (pct) => `눈 위치 ${pct}% — 허용 40~48% 벗어남`,
    consent1: '[필수] 크롭 결과에 대한 책임은 사용자에게 있음을 동의합니다.',
    consent2: '크롭 데이터를 품질 향상 목적으로 활용하는 것에 동의합니다. (선택)',
    modalDownload: '크롭 결과 다운로드', modalCancel: '취소',
  },
  ja: {
    passport: 'パスポート', id: '証明写真',
    warnPassport: '眉毛・額の露出必須 · 無表情で正面',
    warnId: 'ヘア・服装を整える · 好印象の表情',
    crownLabel: '頭頂部', chinLabel: '顎先', eyeLabel: '目',
    inSpec: '✓ 規格内', outSpec: '✗ 範囲超過',
    crownDrag: '頭頂ドラッグ', chinLock: '顎先固定', scale: 'スケール',
    pinHint: '↕ ドラッグ',
    metricTop: '上部', metricFace: '顔', metricBottom: '下部', metricEye: '目の位置',
    photo: '写真選択', back: '← 戻る',
    reset: '↻ リセット', preview: '👁 プレビュー', download: 'ダウンロード',
    upload: 'アップロード',
    sampleMsg: '正面顔写真（肩〜胸元露出）をアップロードしてください',
    analyzing: '顔分析中...',
    noFace: '顔を検出できませんでした。正面写真をアップロードしてください。',
    noWebGL: 'このブラウザでは顔分析をサポートしていません。',
    noImage: '前のステップの画像が見つかりません。写真をアップロードしてください。',
    eyeWarnRed: (pct) => `目の位置 ${pct}% — 許容 40~48%. 写真を上下に調整してください。`,
    eyeWarnYellow: (pct) => `目の位置 ${pct}% — 最適 43~45%. 微調整を推奨。`,
    centerWarn: (mm, dir) => `左右中心 ${mm}mm 逸脱 — 写真を${dir}に移動してください。`,
    dirRight: '右', dirLeft: '左',
    faceSmall: (mm, min, max) => `顔のサイズ ${mm}mm — 許容範囲(${min}~${max}mm) 未満. 写真を拡大してください。`,
    faceLarge: (mm, min, max) => `顔のサイズ ${mm}mm — 許容範囲(${min}~${max}mm) 超過. 写真を縮小してください。`,
    eyeLow: (pct) => `目の位置 ${pct}% — 許容範囲(40~48%) 未満. 写真を下に移動してください。`,
    eyeHigh: (pct) => `目の位置 ${pct}% — 許容範囲(40~48%) 超過. 写真を上に移動してください。`,
    idCenterWarn: (mm, dir) => `左右中心 ${mm}mm 逸脱 — 写真を${dir}に移動してください。`,
    idTopWarn: (mm) => `頭頂部余白 ${mm}mm — 上部が近すぎます。写真を下に移動してください。`,
    idFaceWarn: (pct) => `顔の比率 ${pct}% — 50%以上推奨。写真を拡大してください。`,
    icaoRange: (min, max) => `ICAO 許容範囲 (${min}~${max}mm)`,
    specOutput: '出力規格', specDpi: '解像度', specIcao: 'ICAO',
    specEyePos: '目の位置', specGuide: '案内',
    specIcaoFace: (min, max) => `顔 ${min}~${max}mm`,
    specEyeRange: '40~48% (最適 43~45%)',
    modalTitle: 'ダウンロード確認', modalMetricsLabel: '確定数値',
    modalFace: '顔', modalTop: '上部', modalBottom: '下部', modalEye: '目の位置',
    modalFaceWarn: (mm, min, max) => `顔の長さ ${mm}mm — ICAO 範囲(${min}~${max}mm) 逸脱`,
    modalEyeWarn: (pct) => `目の位置 ${pct}% — 許容 40~48% 逸脱`,
    consent1: '[必須] クロップ結果に対する責任はユーザーにあることに同意します。',
    consent2: 'クロップデータを品質向上目的で活用することに同意します。(任意)',
    modalDownload: 'クロップ結果ダウンロード', modalCancel: 'キャンセル',
  },
  en: {
    passport: 'Passport', id: 'ID Photo',
    warnPassport: 'Eyebrows/forehead must be visible · Neutral expression',
    warnId: 'Neat hair & clothing · Pleasant expression',
    crownLabel: 'Crown', chinLabel: 'Chin', eyeLabel: 'Eye',
    inSpec: '✓ In spec', outSpec: '✗ Out of range',
    crownDrag: 'Crown drag', chinLock: 'Chin lock', scale: 'Scale',
    pinHint: '↕ Drag',
    metricTop: 'Top', metricFace: 'Face', metricBottom: 'Bottom', metricEye: 'Eye pos.',
    photo: 'Choose Photo', back: '← Back',
    reset: '↻ Reset', preview: '👁 Preview', download: 'Download',
    upload: 'Upload',
    sampleMsg: 'Upload a front-facing photo (shoulders visible)',
    analyzing: 'Analyzing face...',
    noFace: 'No face detected. Please upload a front-facing photo.',
    noWebGL: 'Face analysis is not supported in this browser.',
    noImage: 'Image from previous step not found. Please upload a photo.',
    eyeWarnRed: (pct) => `Eye position ${pct}% — allowed 40~48%. Adjust photo up/down.`,
    eyeWarnYellow: (pct) => `Eye position ${pct}% — optimal 43~45%. Fine adjustment recommended.`,
    centerWarn: (mm, dir) => `Center offset ${mm}mm — move photo ${dir}.`,
    dirRight: 'right', dirLeft: 'left',
    faceSmall: (mm, min, max) => `Face size ${mm}mm — below range (${min}~${max}mm). Zoom in.`,
    faceLarge: (mm, min, max) => `Face size ${mm}mm — above range (${min}~${max}mm). Zoom out.`,
    eyeLow: (pct) => `Eye position ${pct}% — below range (40~48%). Move photo down.`,
    eyeHigh: (pct) => `Eye position ${pct}% — above range (40~48%). Move photo up.`,
    idCenterWarn: (mm, dir) => `Center offset ${mm}mm — move photo ${dir}.`,
    idTopWarn: (mm) => `Top margin ${mm}mm — too close. Move photo down.`,
    idFaceWarn: (pct) => `Face ratio ${pct}% — 50%+ recommended. Zoom in.`,
    icaoRange: (min, max) => `ICAO range (${min}~${max}mm)`,
    specOutput: 'Output', specDpi: 'Resolution', specIcao: 'ICAO',
    specEyePos: 'Eye position', specGuide: 'Guide',
    specIcaoFace: (min, max) => `Face ${min}~${max}mm`,
    specEyeRange: '40~48% (optimal 43~45%)',
    modalTitle: 'Download Confirm', modalMetricsLabel: 'Final metrics',
    modalFace: 'Face', modalTop: 'Top', modalBottom: 'Bottom', modalEye: 'Eye pos.',
    modalFaceWarn: (mm, min, max) => `Face length ${mm}mm — outside ICAO range (${min}~${max}mm)`,
    modalEyeWarn: (pct) => `Eye position ${pct}% — outside 40~48% range`,
    consent1: '[Required] I agree that responsibility for crop results lies with the user.',
    consent2: 'I agree to use crop data for quality improvement. (Optional)',
    modalDownload: 'Download crop result', modalCancel: 'Cancel',
  }
};
const cropLang = localStorage.getItem('monkos_lang') || 'ko';
const ct = CROP_I18N[cropLang] || CROP_I18N.ko;

// ─── 규격 데이터 ───
const SPECS = {
  passport: { id: 'passport', label: '여권/신분증', wMm: 35, hMm: 45, faceMin: 32, faceMax: 36, faceTarget: 34, topDefault: 5, bottomDefault: 6, pxW: 413, pxH: 531, warn: '눈썹/이마 노출 필수 · 무표정 정면' },
  id:       { id: 'id',       label: '반명함',      wMm: 30, hMm: 40, faceMin: 24, faceMax: 32, faceTarget: 28, topDefault: 4, bottomDefault: 5, pxW: 354, pxH: 472, warn: '헤어/의상 정돈 · 좋은 인상의 표정' },
};

// 샘플 FaceMesh 좌표 (비율, 프레임 기준)
const SAMPLE_POINTS = {
  leftPupil:  { x: 0.424, y: 0.508 },
  rightPupil: { x: 0.576, y: 0.508 },
  chin:       { x: 0.500, y: 0.714 },
  leftCheek:  { x: 0.226, y: 0.580 },
  rightCheek: { x: 0.774, y: 0.580 },
  tlCorner:   { x: 0.310, y: 0.395 },
  trCorner:   { x: 0.690, y: 0.395 },
  blCorner:   { x: 0.274, y: 0.686 },
  brCorner:   { x: 0.726, y: 0.686 },
};

const FH = 400;

// ─── 3단계 색상 판정 ───
const COLORS = {
  green: '#00B894', greenDim: 'rgba(0,184,148,0.15)',
  yellow: '#FDCB6E', yellowDim: 'rgba(253,203,110,0.15)',
  red: '#E17055', redDim: 'rgba(225,112,85,0.15)',
  accent: '#6C5CE7', gold: '#FDCB6E', muted: '#4A5568', bg: '#06080D',
};

function getFaceColor(faceMm, spec) {
  if (faceMm >= 33 && faceMm <= 35) return COLORS.green;       // 최적 (여권)
  if (faceMm >= spec.faceMin && faceMm <= spec.faceMax) return COLORS.yellow; // 허용
  return COLORS.red;                                             // 이탈
}
function getEyeColor(eyeRatio) {
  if (eyeRatio >= 0.43 && eyeRatio <= 0.45) return COLORS.green;  // 최적
  if (eyeRatio >= 0.40 && eyeRatio <= 0.48) return COLORS.yellow;  // 허용
  return COLORS.red;                                                // 이탈
}
function isBlocked(faceMm, eyeRatio, spec) {
  // 오렌지/레드 = 범위 완전 이탈 시 차단
  return faceMm < spec.faceMin || faceMm > spec.faceMax || eyeRatio < 0.40 || eyeRatio > 0.48;
}

// ─── 상태 ───
let specKey = 'passport';
let imgSrc = SAMPLE_IMG;
let isSample = true;
let imgPos = { x: 0, y: 0 };
let imgScale = 1;
let pts = {};
let dragging = null;
let dragStart = null;
let consent1 = false;
let consent2 = false;
let loadedImg = null; // Canvas 크롭용 원본 이미지 참조

// ─── FaceMesh 상태 ───
let faceMeshInstance = null;
let faceMeshReady = false;
let faceMeshResults = null;
let lastDetectedLandmarks = null; // { landmarks, natW, natH } — 규격 전환 시 재배치용

// FaceMesh 핵심 랜드마크 인덱스 (MediaPipe 478)
const FM_IDX = {
  LEFT_PUPIL: 159,   // 좌눈 중심
  RIGHT_PUPIL: 386,  // 우눈 중심
  CHIN: 152,         // 턱 최하단
  LEFT_CHEEK: 234,   // 좌측 윤곽
  RIGHT_CHEEK: 454,  // 우측 윤곽
};

// ─── DOM 참조 ───
const $ = (id) => document.getElementById(id);

function getSpec() { return SPECS[specKey]; }
function getFW() { return Math.round(FH * getSpec().wMm / getSpec().hMm); }
function getMM() { return FH / getSpec().hMm; }

// ─── 오버레이 초기화 ───
function initOverlay(sk) {
  const s = SPECS[sk];
  const fw = Math.round(FH * s.wMm / s.hMm);
  const p = SAMPLE_POINTS;
  const chinPx = p.chin.y * FH;
  const eyePx = ((p.leftPupil.y + p.rightPupil.y) / 2) * FH;
  const crownPx = eyePx - (chinPx - eyePx); // 눈~턱 1:1 반전
  return {
    crown:      { x: fw / 2,              y: crownPx },
    chin:       { x: fw / 2,              y: chinPx },
    leftPupil:  { x: p.leftPupil.x * fw,  y: p.leftPupil.y * FH },
    rightPupil: { x: p.rightPupil.x * fw, y: p.rightPupil.y * FH },
    leftCheek:  { x: p.leftCheek.x * fw,  y: p.leftCheek.y * FH },
    rightCheek: { x: p.rightCheek.x * fw, y: p.rightCheek.y * FH },
    tlCorner:   { x: p.tlCorner.x * fw,   y: p.tlCorner.y * FH },
    trCorner:   { x: p.trCorner.x * fw,   y: p.trCorner.y * FH },
    blCorner:   { x: p.blCorner.x * fw,   y: p.blCorner.y * FH },
    brCorner:   { x: p.brCorner.x * fw,   y: p.brCorner.y * FH },
  };
}

// ─── 스플라인 타원 path ───
function splinePath() {
  const { crown, chin, leftCheek, rightCheek, tlCorner, trCorner, blCorner, brCorner } = pts;
  const cp = 0.55;
  const w = rightCheek.x - leftCheek.x;
  const h = chin.y - crown.y;
  return `M ${crown.x} ${crown.y}
    C ${trCorner.x} ${crown.y + h * cp * 0.3},
      ${rightCheek.x + w * 0.05} ${rightCheek.y - h * cp * 0.3},
      ${rightCheek.x} ${rightCheek.y}
    C ${rightCheek.x + w * 0.05} ${rightCheek.y + h * cp * 0.3},
      ${brCorner.x} ${chin.y - h * cp * 0.3},
      ${chin.x} ${chin.y}
    C ${blCorner.x} ${chin.y - h * cp * 0.3},
      ${leftCheek.x - w * 0.05} ${leftCheek.y + h * cp * 0.3},
      ${leftCheek.x} ${leftCheek.y}
    C ${leftCheek.x - w * 0.05} ${leftCheek.y - h * cp * 0.3},
      ${tlCorner.x} ${crown.y + h * cp * 0.3},
      ${crown.x} ${crown.y}
    Z`;
}

// ─── 렌더 ───
function render() {
  const spec = getSpec();
  const FW = getFW();
  const MM = getMM();

  // 계산
  const isPassport = specKey === 'passport';
  const faceMm = (pts.chin.y - pts.crown.y) / MM;
  const topMm = pts.crown.y / MM;
  const bottomMm = spec.hMm - topMm - faceMm;
  const faceRatio = faceMm / spec.hMm; // 얼굴 비중 (프레임 대비)
  const eyeY = (pts.leftPupil.y + pts.rightPupil.y) / 2;
  const eyeRatio = eyeY / FH;
  const eyePct = (eyeRatio * 100).toFixed(0);
  const fc = isPassport ? getFaceColor(faceMm, spec) : COLORS.muted;
  const ec = isPassport ? getEyeColor(eyeRatio) : COLORS.muted;
  const blocked = isPassport ? isBlocked(faceMm, eyeRatio, spec) : false;

  // 프레임 크기
  const frame = $('frame');
  frame.style.width = FW + 'px';
  frame.style.height = FH + 'px';

  // 사진
  const photo = $('photo');
  photo.src = imgSrc;
  photo.classList.toggle('sample-guide', isSample);
  photo.style.transform = `translate(calc(-50% + ${imgPos.x}px), calc(-50% + ${imgPos.y}px)) scale(${imgScale})`;

  // SVG 크기
  const svg = $('overlaySvg');
  svg.setAttribute('width', FW);
  svg.setAttribute('height', FH);

  // ─── 반명함: 여권 규격 요소 숨김 ───
  const passportSvg = ['maskTop','maskBottom','ellipsePath','crownLine','chinLine','eyeLine',
    'dimLineV','dimLineTopH','dimLineBotH','pupilL','pupilR',
    'crownLabelBg','crownLabelText','chinLabelBg','chinLabelText','eyeLabelBg','eyeLabelText'];
  passportSvg.forEach(id => { const el = $(id); if (el) el.setAttribute('opacity', isPassport ? '' : '0'); });
  ['crownPin','crownHint','chinPin','badgeFace','badgeStatus'].forEach(id => {
    $(id).style.display = isPassport ? '' : 'none';
  });
  // 섹션 가시성 (legend, metrics, ICAO range bar)
  document.querySelector('.legend').style.display = isPassport ? '' : 'none';
  document.querySelector('.metrics').style.display = isPassport ? '' : 'none';
  document.querySelector('.range-bar-container').style.display = isPassport ? '' : 'none';

  // 상단 마스크
  setAttrs('maskTop', { x: 0, y: 0, width: FW, height: Math.max(0, pts.crown.y) });
  // 하단 마스크
  setAttrs('maskBottom', { x: 0, y: pts.chin.y, width: FW, height: Math.max(0, FH - pts.chin.y) });

  // 십자 가이드
  setAttrs('crossH', { x1: 0, y1: FH / 2, x2: FW, y2: FH / 2 });
  // 세로 중심선 — 좌우 이탈도에 따라 색상/가시성 변경
  const faceCenterX = (pts.leftPupil.x + pts.rightPupil.x) / 2;
  const centerOffsetPx = Math.abs(faceCenterX - FW / 2);
  const centerOffsetMm = centerOffsetPx / MM;
  let centerColor = 'rgba(255,255,255,0.30)';
  if (!isSample) {
    if (centerOffsetMm < 1) centerColor = COLORS.green + '70';
    else if (centerOffsetMm < 2) centerColor = COLORS.yellow + '90';
    else centerColor = COLORS.red + '90';
  }
  setAttrs('crossV', { x1: FW / 2, y1: 0, x2: FW / 2, y2: FH, stroke: centerColor, 'stroke-width': '1.5' });

  // 스플라인 타원
  const ep = $('ellipsePath');
  ep.setAttribute('d', splinePath());
  ep.setAttribute('stroke', COLORS.accent + '70');

  // 정수리 가이드선
  setAttrs('crownLine', { x1: 0, y1: pts.crown.y, x2: FW, y2: pts.crown.y, stroke: fc });

  // 턱끝 가이드선
  setAttrs('chinLine', { x1: 0, y1: pts.chin.y, x2: FW, y2: pts.chin.y });

  // 눈 가이드선
  setAttrs('eyeLine', { x1: 10, y1: eyeY, x2: FW - 10, y2: eyeY, stroke: ec });

  // 치수선 우측
  setAttrs('dimLineV', { x1: FW - 9, y1: pts.crown.y, x2: FW - 9, y2: pts.chin.y, stroke: fc });
  setAttrs('dimLineTopH', { x1: FW - 13, y1: pts.crown.y, x2: FW - 5, y2: pts.crown.y, stroke: fc });
  setAttrs('dimLineBotH', { x1: FW - 13, y1: pts.chin.y, x2: FW - 5, y2: pts.chin.y, stroke: fc });

  // 동공
  setAttrs('pupilL', { cx: pts.leftPupil.x, cy: pts.leftPupil.y, fill: ec });
  setAttrs('pupilR', { cx: pts.rightPupil.x, cy: pts.rightPupil.y, fill: ec });

  // 라벨: 정수리
  setAttrs('crownLabelBg', { x: 3, y: pts.crown.y - 16, width: 34, height: 13 });
  setAttrs('crownLabelText', { x: 5, y: pts.crown.y - 6, fill: fc });
  // 라벨: 턱끝
  setAttrs('chinLabelBg', { x: 3, y: pts.chin.y + 3, width: 24, height: 13 });
  setAttrs('chinLabelText', { x: 5, y: pts.chin.y + 13 });
  // 라벨: 눈 위치
  setAttrs('eyeLabelBg', { x: FW - 38, y: eyeY - 15, width: 35, height: 13 });
  const eyeLabel = $('eyeLabelText');
  eyeLabel.textContent = `${ct.eyeLabel} ${eyePct}%`;
  setAttrs('eyeLabelText', { x: FW - 36, y: eyeY - 5, fill: ec });

  // 핀: 정수리
  const crownPin = $('crownPin');
  crownPin.style.left = pts.crown.x + 'px';
  crownPin.style.top = (pts.crown.y - 4.5) + 'px';
  crownPin.style.background = fc;
  crownPin.style.boxShadow = `0 0 12px ${fc}BB`;

  // 힌트
  const hint = $('crownHint');
  hint.style.left = (pts.crown.x + 10) + 'px';
  hint.style.top = (pts.crown.y - 4.5) + 'px';
  hint.style.background = COLORS.bg + 'EE';
  hint.style.borderColor = fc + '50';
  hint.style.color = fc;

  // 핀: 턱끝
  const chinPin = $('chinPin');
  chinPin.style.left = pts.chin.x + 'px';
  chinPin.style.top = (pts.chin.y - 9) + 'px';
  chinPin.style.boxShadow = `0 0 10px ${COLORS.gold}99`;

  // 스케일 핸들
  const sh = $('scaleHandle');
  sh.style.left = Math.min(FW - 25, Math.max(15, pts.brCorner.x + 15)) + 'px';
  sh.style.top = Math.min(FH - 25, Math.max(15, pts.brCorner.y + 15)) + 'px';
  sh.style.boxShadow = `0 0 10px ${COLORS.accent}BB`;

  // 배지: faceMm
  const bf = $('badgeFace');
  bf.style.background = COLORS.bg + 'EE';
  bf.style.borderColor = fc;
  bf.style.border = `1px solid ${fc}`;
  bf.style.color = fc;
  $('badgeFaceVal').textContent = faceMm.toFixed(1) + 'mm';
  $('badgeFaceRange').textContent = `/${spec.faceMin}~${spec.faceMax}`;

  // 배지: 상태
  const faceInRange = faceMm >= spec.faceMin && faceMm <= spec.faceMax;
  const bs = $('badgeStatus');
  bs.style.background = faceInRange ? COLORS.green + '20' : COLORS.red + '20';
  bs.style.border = `1px solid ${fc}50`;
  bs.style.color = fc;
  bs.textContent = faceInRange ? ct.inSpec : ct.outSpec;

  // 배지: 스케일
  $('badgeScale').textContent = `x${imgScale.toFixed(2)}`;

  // 범례 정수리 dot
  $('legendCrownDot').style.background = fc;

  // 수치 4칸
  const topColor = topMm < 3 ? COLORS.red : COLORS.muted;
  const bottomColor = bottomMm < 2 ? COLORS.red : COLORS.muted;
  $('metricTopVal').textContent = topMm.toFixed(1) + 'mm';
  $('metricTopVal').style.color = topColor;
  $('metricFaceVal').textContent = faceMm.toFixed(1) + 'mm';
  $('metricFaceVal').style.color = fc;
  $('metricFace').style.borderColor = fc + '40';
  $('metricBottomVal').textContent = bottomMm.toFixed(1) + 'mm';
  $('metricBottomVal').style.color = bottomColor;
  $('metricEyeVal').textContent = eyePct + '%';
  $('metricEyeVal').style.color = ec;
  $('metricEye').style.borderColor = ec + '40';

  // ─── 경고 ───
  const eyeWarn = $('eyeWarning');
  const centerWarn = $('centerWarning');
  const dlBlock = $('downloadBlock');

  if (isPassport) {
    // 여권: 눈 위치 경고
    if (ec === COLORS.red) {
      eyeWarn.classList.remove('hidden');
      eyeWarn.style.background = COLORS.redDim;
      eyeWarn.style.border = `1px solid ${COLORS.red}40`;
      eyeWarn.style.color = COLORS.red;
      eyeWarn.textContent = ct.eyeWarnRed(eyePct);
    } else if (ec === COLORS.yellow) {
      eyeWarn.classList.remove('hidden');
      eyeWarn.style.background = COLORS.yellowDim;
      eyeWarn.style.border = `1px solid ${COLORS.yellow}40`;
      eyeWarn.style.color = COLORS.yellow;
      eyeWarn.textContent = ct.eyeWarnYellow(eyePct);
    } else {
      eyeWarn.classList.add('hidden');
    }

    // 여권: 좌우 중심 경고
    if (!isSample && centerOffsetMm >= 1.5) {
      centerWarn.classList.remove('hidden');
      const cwColor = centerOffsetMm >= 2 ? COLORS.red : COLORS.yellow;
      const cwDim = centerOffsetMm >= 2 ? COLORS.redDim : COLORS.yellowDim;
      centerWarn.style.background = cwDim;
      centerWarn.style.border = `1px solid ${cwColor}40`;
      centerWarn.style.color = cwColor;
      const dir = faceCenterX < FW / 2 ? ct.dirRight : ct.dirLeft;
      centerWarn.textContent = ct.centerWarn(centerOffsetMm.toFixed(1), dir);
    } else {
      centerWarn.classList.add('hidden');
    }

    // 여권: 다운로드 차단 안내
    if (blocked && !isSample) {
      dlBlock.classList.remove('hidden');
      dlBlock.style.background = COLORS.redDim;
      dlBlock.style.border = `1px solid ${COLORS.red}40`;
      dlBlock.style.color = COLORS.red;
      const reasons = [];
      if (faceMm < spec.faceMin) reasons.push(ct.faceSmall(faceMm.toFixed(1), spec.faceMin, spec.faceMax));
      if (faceMm > spec.faceMax) reasons.push(ct.faceLarge(faceMm.toFixed(1), spec.faceMin, spec.faceMax));
      if (eyeRatio < 0.40) reasons.push(ct.eyeLow(eyePct));
      if (eyeRatio > 0.48) reasons.push(ct.eyeHigh(eyePct));
      dlBlock.textContent = reasons.join(' ');
    } else {
      dlBlock.classList.add('hidden');
    }

    // 여권: ICAO 범위 바
    const rangeMin = spec.faceMin / spec.hMm * 100;
    const rangeMax = spec.faceMax / spec.hMm * 100;
    const dotPos = Math.min(97, Math.max(3, faceMm / spec.hMm * 100));
    $('rangeLabel').textContent = ct.icaoRange(spec.faceMin, spec.faceMax);
    $('rangeValue').textContent = `${faceInRange ? '✓' : '✗'} ${faceMm.toFixed(1)}mm`;
    $('rangeValue').style.color = fc;
    $('rangeFill').style.left = rangeMin + '%';
    $('rangeFill').style.width = (rangeMax - rangeMin) + '%';
    $('rangeDot').style.left = dotPos + '%';
    $('rangeDot').style.background = fc;
    $('rangeDot').style.boxShadow = `0 0 8px ${fc}`;
    $('rangeMin').textContent = spec.faceMin + 'mm';
    $('rangeMax').textContent = spec.faceMax + 'mm';

  } else {
    // ─── 반명함: 간소화 경고 (3가지만) ───
    eyeWarn.classList.add('hidden');
    const idWarnings = [];
    if (!isSample) {
      if (centerOffsetMm >= 2) idWarnings.push(ct.idCenterWarn(centerOffsetMm.toFixed(1), faceCenterX < FW / 2 ? ct.dirRight : ct.dirLeft));
      if (topMm < 2) idWarnings.push(ct.idTopWarn(topMm.toFixed(1)));
      if (faceRatio < 0.50) idWarnings.push(ct.idFaceWarn((faceRatio * 100).toFixed(0)));
    }
    if (idWarnings.length > 0) {
      centerWarn.classList.remove('hidden');
      centerWarn.style.background = COLORS.yellowDim;
      centerWarn.style.border = `1px solid ${COLORS.yellow}40`;
      centerWarn.style.color = COLORS.yellow;
      centerWarn.textContent = idWarnings.join(' ');
    } else {
      centerWarn.classList.add('hidden');
    }
    dlBlock.classList.add('hidden');
  }

  // 다운로드 버튼
  const btnDl = $('btnDownload');
  if (isSample || blocked) {
    btnDl.className = 'btn btn-download disabled';
    btnDl.disabled = true;
  } else {
    btnDl.className = 'btn btn-download enabled';
    btnDl.disabled = false;
  }

  // 헤더 정보
  $('headerInfo').textContent = `${spec.pxW}x${spec.pxH}px · 300dpi`;

  // 샘플 배너
  $('sampleBanner').classList.toggle('hidden', !isSample);

  // 규격 정보 테이블
  const specWarn = specKey === 'passport' ? ct.warnPassport : ct.warnId;
  const rows = isPassport ? [
    [ct.specOutput, `${spec.wMm}x${spec.hMm}mm · ${spec.pxW}x${spec.pxH}px`],
    [ct.specDpi, '300dpi'],
    [ct.specIcao, ct.specIcaoFace(spec.faceMin, spec.faceMax)],
    [ct.specEyePos, ct.specEyeRange],
  ] : [
    [ct.specOutput, `${spec.wMm}x${spec.hMm}mm · ${spec.pxW}x${spec.pxH}px`],
    [ct.specDpi, '300dpi'],
    [ct.specGuide, specWarn],
  ];
  $('specInfo').innerHTML = rows.map((r, i) =>
    `<div class="spec-row${i < rows.length - 1 ? '' : ''}">
      <span class="label">${r[0]}</span>
      <span class="value">${r[1]}</span>
    </div>`
  ).join('');

  // 규격 탭 활성화
  document.querySelectorAll('.spec-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.spec === specKey);
  });
}

function setAttrs(id, attrs) {
  const el = $(id);
  if (!el) return;
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
}

// ─── 리셋 ───
function reset(sk) {
  specKey = sk || specKey;
  if (lastDetectedLandmarks && !isSample) {
    // 실측 FaceMesh 데이터로 재배치 (규격 전환 시)
    const { landmarks, natW, natH } = lastDetectedLandmarks;
    pts = autoPlace(landmarks, natW, natH);
  } else {
    pts = initOverlay(specKey);
    imgPos = { x: 0, y: 0 };
    imgScale = 1;
  }
  render();
}

// ─── 드래그 ───
function onPtrDown(e, type) {
  e.preventDefault();
  e.stopPropagation();
  dragging = type;
  dragStart = {
    clientX: e.clientX, clientY: e.clientY,
    imgPos: { ...imgPos }, imgScale,
    pts: JSON.parse(JSON.stringify(pts)),
  };
  if (type === 'img') $('frame').classList.add('grabbing');
}

function onPtrMove(e) {
  if (!dragging || !dragStart) return;
  const dx = e.clientX - dragStart.clientX;
  const dy = e.clientY - dragStart.clientY;
  const FW = getFW();

  if (dragging === 'img') {
    imgPos = { x: dragStart.imgPos.x + dx, y: dragStart.imgPos.y + dy };
    const next = {};
    for (const k of Object.keys(dragStart.pts)) {
      next[k] = { x: dragStart.pts[k].x + dx, y: dragStart.pts[k].y + dy };
    }
    pts = next;

  } else if (dragging === 'crown') {
    const newY = Math.max(2, Math.min(dragStart.pts.chin.y - 20, dragStart.pts.crown.y + dy));
    pts = { ...pts, crown: { ...pts.crown, y: newY } };

  } else if (dragging === 'scale') {
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sign = (dx + dy) > 0 ? 1 : -1;
    const newScale = Math.max(0.3, Math.min(4, dragStart.imgScale + sign * dist * 0.004));
    const ratio = newScale / dragStart.imgScale;
    imgScale = newScale;
    // 스케일 중심 = 사진의 실제 시각 중심 (imgPos 반영)
    const cx = FW / 2 + dragStart.imgPos.x;
    const cy = FH / 2 + dragStart.imgPos.y;
    const next = {};
    for (const k of Object.keys(dragStart.pts)) {
      next[k] = {
        x: cx + (dragStart.pts[k].x - cx) * ratio,
        y: cy + (dragStart.pts[k].y - cy) * ratio,
      };
    }
    pts = next;
  }

  render();
}

function onPtrUp() {
  if (dragging === 'img') $('frame').classList.remove('grabbing');
  dragging = null;
  dragStart = null;
}

// ─── FaceMesh 초기화 ───
function checkWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

async function initFaceMesh() {
  if (typeof FaceMesh === 'undefined') {
    console.warn('[FaceMesh] 라이브러리 미로드 — SAMPLE_POINTS 폴백');
    return;
  }
  if (!checkWebGL()) {
    console.warn('[FaceMesh] WebGL 미지원 — SAMPLE_POINTS 폴백');
    return;
  }
  try {
    faceMeshInstance = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMeshInstance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMeshInstance.onResults((r) => { faceMeshResults = r; });
    faceMeshReady = true;
    console.log('[FaceMesh] 초기화 완료');
  } catch (err) {
    console.warn('[FaceMesh] 초기화 실패:', err.message);
    faceMeshReady = false;
  }
}

async function detectFaceLandmarks(imgEl) {
  if (!faceMeshReady || !faceMeshInstance) return null;
  try {
    faceMeshResults = null;
    await faceMeshInstance.send({ image: imgEl });
    if (!faceMeshResults || !faceMeshResults.multiFaceLandmarks ||
        faceMeshResults.multiFaceLandmarks.length === 0) {
      return null;
    }
    return faceMeshResults.multiFaceLandmarks[0]; // 478 landmarks (normalized)
  } catch (err) {
    console.warn('[FaceMesh] 감지 실패:', err.message);
    return null;
  }
}

function extractLandmarks(rawLandmarks, natW, natH) {
  // FaceMesh normalized (0~1) → 이미지 픽셀 좌표
  const lp = rawLandmarks[FM_IDX.LEFT_PUPIL];
  const rp = rawLandmarks[FM_IDX.RIGHT_PUPIL];
  const ch = rawLandmarks[FM_IDX.CHIN];
  const lc = rawLandmarks[FM_IDX.LEFT_CHEEK];
  const rc = rawLandmarks[FM_IDX.RIGHT_CHEEK];

  const leftPupil  = { x: lp.x * natW, y: lp.y * natH };
  const rightPupil = { x: rp.x * natW, y: rp.y * natH };
  const chin       = { x: ch.x * natW, y: ch.y * natH };
  const leftCheek  = { x: lc.x * natW, y: lc.y * natH };
  const rightCheek = { x: rc.x * natW, y: rc.y * natH };

  // 정수리: 눈~턱 1:1 반전
  const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
  const eyeCenterX = (leftPupil.x + rightPupil.x) / 2;
  const crownY = eyeCenterY - (chin.y - eyeCenterY);
  const crown = { x: eyeCenterX, y: crownY };

  // 모퉁이 4점 보간
  const tlCorner = {
    x: leftCheek.x + (crown.x - leftCheek.x) * 0.3,
    y: crown.y + (leftCheek.y - crown.y) * 0.4
  };
  const trCorner = {
    x: rightCheek.x + (crown.x - rightCheek.x) * 0.3,
    y: crown.y + (rightCheek.y - crown.y) * 0.4
  };
  const blCorner = {
    x: leftCheek.x + (chin.x - leftCheek.x) * 0.3,
    y: leftCheek.y + (chin.y - leftCheek.y) * 0.6
  };
  const brCorner = {
    x: rightCheek.x + (chin.x - rightCheek.x) * 0.3,
    y: rightCheek.y + (chin.y - rightCheek.y) * 0.6
  };

  return { crown, chin, leftPupil, rightPupil, leftCheek, rightCheek,
           tlCorner, trCorner, blCorner, brCorner };
}

function autoPlace(imgLandmarks, natW, natH) {
  const spec = getSpec();
  const FW = getFW();
  const MM = getMM();

  // cover 스케일 계산 (object-fit: cover 기준)
  const coverScale = Math.max(FW / natW, FH / natH);
  const displayW = natW * coverScale;
  const displayH = natH * coverScale;
  const offsetX = (displayW - FW) / 2;
  const offsetY = (displayH - FH) / 2;

  // 이미지 좌표 → cover 좌표
  function toCover(pt) {
    return { x: pt.x * coverScale - offsetX, y: pt.y * coverScale - offsetY };
  }

  const crownCover = toCover(imgLandmarks.crown);
  const chinCover  = toCover(imgLandmarks.chin);
  const eyeLCover  = toCover(imgLandmarks.leftPupil);
  const eyeRCover  = toCover(imgLandmarks.rightPupil);

  const eyeYCover = (eyeLCover.y + eyeRCover.y) / 2;
  const faceHCover = chinCover.y - crownCover.y;

  // imgScale: 얼굴이 faceTarget mm에 맞도록
  const targetFacePx = spec.faceTarget * MM;
  const newScale = targetFacePx / faceHCover;

  // imgPos.y: 눈이 43%에 오도록
  const newPosY = 0.43 * FH - FH / 2 - (eyeYCover - FH / 2) * newScale;

  // imgPos.x: 얼굴 중심이 프레임 중앙에 오도록
  const faceCenterXCover = (eyeLCover.x + eyeRCover.x) / 2;
  const newPosX = -(faceCenterXCover - FW / 2) * newScale;

  imgScale = newScale;
  imgPos = { x: newPosX, y: newPosY };

  // 모든 랜드마크를 프레임 좌표로 변환
  const result = {};
  for (const [key, imgPt] of Object.entries(imgLandmarks)) {
    const cover = toCover(imgPt);
    result[key] = {
      x: FW / 2 + (cover.x - FW / 2) * newScale + newPosX,
      y: FH / 2 + (cover.y - FH / 2) * newScale + newPosY,
    };
  }
  return result;
}

function showFaceMeshMsg(msg) {
  const el = $('facemeshLoading');
  el.classList.remove('hidden');
  el.querySelector('.facemesh-spinner').style.display = 'none';
  el.querySelector('span').textContent = msg;
  setTimeout(() => {
    el.classList.add('hidden');
    el.querySelector('.facemesh-spinner').style.display = '';
    el.querySelector('span').textContent = ct.analyzing;
  }, 2500);
}

// ─── 파일 업로드 ───
async function handleFile(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;

  const url = URL.createObjectURL(f);
  imgSrc = url;
  isSample = false;

  // 이미지 로드 후 FaceMesh 실행
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = async () => {
    loadedImg = img; // Canvas 크롭용 참조 보관
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    if (faceMeshReady) {
      // 로딩 표시
      $('facemeshLoading').classList.remove('hidden');
      // 이미지 먼저 표시 (SAMPLE_POINTS 임시)
      pts = initOverlay(specKey);
      imgPos = { x: 0, y: 0 };
      imgScale = 1;
      render();

      try {
        const rawLandmarks = await detectFaceLandmarks(img);
        $('facemeshLoading').classList.add('hidden');

        if (rawLandmarks) {
          const extracted = extractLandmarks(rawLandmarks, natW, natH);
          lastDetectedLandmarks = { landmarks: extracted, natW, natH };
          pts = autoPlace(extracted, natW, natH);
          render();
        } else {
          // 얼굴 미감지
          lastDetectedLandmarks = null;
          showFaceMeshMsg(ct.noFace);
        }
      } catch (err) {
        $('facemeshLoading').classList.add('hidden');
        lastDetectedLandmarks = null;
        console.warn('[FaceMesh] 에러:', err);
      }
    } else {
      // FaceMesh 미사용 → SAMPLE_POINTS 폴백
      lastDetectedLandmarks = null;
      if (!checkWebGL()) {
        showFaceMeshMsg(ct.noWebGL);
      }
      reset(specKey);
    }
  };
}

// ─── Canvas 크롭 다운로드 ───
function performCrop() {
  if (!loadedImg || isSample) return;
  const spec = getSpec();
  const FW = getFW();
  const outScale = spec.pxH / FH; // 프레임 → 출력 해상도 비율

  const canvas = document.createElement('canvas');
  canvas.width = spec.pxW;
  canvas.height = spec.pxH;
  const ctx = canvas.getContext('2d');

  // 출력 해상도로 스케일
  ctx.scale(outScale, outScale);

  // CSS transform 재현: translate(calc(-50% + X), calc(-50% + Y)) scale(S)
  // 사진 시각 중심으로 이동 → imgScale 적용 → 원점 복원
  ctx.translate(FW / 2 + imgPos.x, FH / 2 + imgPos.y);
  ctx.scale(imgScale, imgScale);
  ctx.translate(-FW / 2, -FH / 2);

  // object-fit: cover 재현
  const natW = loadedImg.naturalWidth;
  const natH = loadedImg.naturalHeight;
  const coverScale = Math.max(FW / natW, FH / natH);
  const dw = natW * coverScale;
  const dh = natH * coverScale;
  ctx.drawImage(loadedImg, (FW - dw) / 2, (FH - dh) / 2, dw, dh);

  // JPEG 다운로드
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

// ─── 모달 ───
function openModal() {
  if (isSample) return;
  const spec = getSpec();
  const MM = getMM();
  const faceMm = (pts.chin.y - pts.crown.y) / MM;
  const topMm = pts.crown.y / MM;
  const bottomMm = spec.hMm - topMm - faceMm;
  const eyeY = (pts.leftPupil.y + pts.rightPupil.y) / 2;
  const eyeRatio = eyeY / FH;
  const eyePct = (eyeRatio * 100).toFixed(0);
  const fc = getFaceColor(faceMm, spec);
  const ec = getEyeColor(eyeRatio);
  const faceInRange = faceMm >= spec.faceMin && faceMm <= spec.faceMax;

  $('modalMetrics').style.borderColor = faceInRange ? COLORS.green + '40' : COLORS.red + '40';

  const items = [
    { l: ct.modalFace, v: faceMm.toFixed(1) + 'mm', c: fc },
    { l: ct.modalTop, v: topMm.toFixed(1) + 'mm', c: COLORS.muted },
    { l: ct.modalBottom, v: bottomMm.toFixed(1) + 'mm', c: COLORS.muted },
    { l: ct.modalEye, v: eyePct + '%', c: ec },
  ];
  $('modalMetricsGrid').innerHTML = items.map(i =>
    `<div class="modal-metric-item">
      <div class="label">${i.l}</div>
      <div class="value" style="color:${i.c}">${i.v}</div>
    </div>`
  ).join('');

  const mw = $('modalWarning');
  const eyeOk = eyeRatio >= 0.40 && eyeRatio <= 0.48;
  if (!faceInRange || !eyeOk) {
    mw.classList.remove('hidden');
    mw.style.background = COLORS.redDim;
    mw.style.color = COLORS.red;
    mw.textContent = !faceInRange
      ? ct.modalFaceWarn(faceMm.toFixed(1), spec.faceMin, spec.faceMax)
      : ct.modalEyeWarn(eyePct);
  } else {
    mw.classList.add('hidden');
  }

  consent1 = false;
  consent2 = false;
  updateConsent();
  $('modalBackdrop').classList.remove('hidden');
}

function closeModal() {
  $('modalBackdrop').classList.add('hidden');
}

function updateConsent() {
  const c1 = $('consent1Check');
  const c2 = $('consent2Check');
  c1.textContent = consent1 ? '✓' : '';
  c1.classList.toggle('checked', consent1);
  c2.textContent = consent2 ? '✓' : '';
  c2.classList.toggle('checked', consent2);

  const cls1 = consent1 ? 'enabled' : 'disabled';
  $('modalBtnDownload').className = `modal-btn modal-btn-primary ${cls1}`;
  $('modalBtnDownload').disabled = !consent1;
}

// ─── 앱 내 진입 감지 (thankyou → crop) ───
async function checkAppEntry() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const spec = params.get('spec');

  if (from === 'thankyou') {
    // 규격 자동 선택
    if (spec && SPECS[spec]) {
      specKey = spec;
      document.querySelectorAll('.spec-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.spec === spec);
      });
    }

    // sessionStorage에서 보정 원본 로드
    const imageData = sessionStorage.getItem('monkos_image');
    if (imageData) {
      // FaceMesh 먼저 로드 (앱 진입 시 얼굴 감지 보장)
      if (!faceMeshReady) await initFaceMesh();

      imgSrc = imageData;
      isSample = false;

      const img = new Image();
      img.onload = async () => {
        loadedImg = img;
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;

        // 초기 렌더 (SAMPLE_POINTS 임시)
        pts = initOverlay(specKey);
        render();

        // FaceMesh 실행
        if (faceMeshReady) {
          $('facemeshLoading').classList.remove('hidden');
          try {
            const rawLandmarks = await detectFaceLandmarks(img);
            $('facemeshLoading').classList.add('hidden');
            if (rawLandmarks) {
              const extracted = extractLandmarks(rawLandmarks, natW, natH);
              lastDetectedLandmarks = { landmarks: extracted, natW, natH };
              pts = autoPlace(extracted, natW, natH);
              render();
            } else {
              lastDetectedLandmarks = null;
              showFaceMeshMsg(ct.noFace);
            }
          } catch (err) {
            $('facemeshLoading').classList.add('hidden');
            lastDetectedLandmarks = null;
          }
        } else {
          lastDetectedLandmarks = null;
          reset(specKey);
        }
      };
      img.src = imageData;

      // 뒤로가기 = thankyou 복귀
      window.addEventListener('popstate', () => {
        window.location.href = 'thankyou.html';
      });

      return true;
    }

    // from=thankyou이지만 세션 데이터 없음 → 안내
    const banner = $('sampleBanner');
    if (banner) {
      banner.querySelector('span').textContent = ct.noImage;
      banner.classList.remove('hidden');
    }
  }
  return false;
}

// ─── i18n DOM 적용 ───
function applyCropLang() {
  document.documentElement.lang = cropLang;
  // 규격 탭
  document.querySelectorAll('.spec-tab').forEach(tab => {
    if (tab.dataset.spec === 'passport') tab.textContent = ct.passport;
    if (tab.dataset.spec === 'id') tab.textContent = ct.id;
  });
  // 샘플 배너
  const bannerSpan = $('sampleBanner')?.querySelector('span');
  if (bannerSpan) bannerSpan.textContent = ct.sampleMsg;
  $('sampleUploadBtn').textContent = ct.upload;
  // 범례
  const legendLabels = document.querySelectorAll('.legend-label');
  if (legendLabels[0]) legendLabels[0].textContent = ct.crownDrag;
  if (legendLabels[1]) legendLabels[1].textContent = ct.chinLock;
  if (legendLabels[2]) legendLabels[2].textContent = ct.scale;
  // SVG 텍스트
  $('crownLabelText').textContent = ct.crownLabel;
  $('chinLabelText').textContent = ct.chinLabel;
  // 핀 힌트
  $('crownHint').textContent = ct.pinHint;
  // 수치 라벨
  const metricLabels = document.querySelectorAll('.metric-label');
  if (metricLabels[0]) metricLabels[0].textContent = ct.metricTop;
  if (metricLabels[1]) metricLabels[1].textContent = ct.metricFace;
  if (metricLabels[2]) metricLabels[2].textContent = ct.metricBottom;
  if (metricLabels[3]) metricLabels[3].textContent = ct.metricEye;
  // FaceMesh 로딩
  const fmSpan = $('facemeshLoading')?.querySelector('span');
  if (fmSpan) fmSpan.textContent = ct.analyzing;
  // 버튼
  $('btnReset').textContent = ct.reset;
  $('btnPreview').textContent = ct.preview;
  $('btnDownload').textContent = ct.download;
  // 모달
  const modalTitle = document.querySelector('.modal-title');
  if (modalTitle) modalTitle.textContent = ct.modalTitle;
  const modalMetricsLabel = document.querySelector('.modal-metrics-label');
  if (modalMetricsLabel) modalMetricsLabel.textContent = ct.modalMetricsLabel;
  // 동의 텍스트
  const consentTexts = document.querySelectorAll('.consent-text');
  if (consentTexts[0]) consentTexts[0].innerHTML = `<span class="consent-required">${ct.consent1.startsWith('[') ? ct.consent1.split(']')[0] + '] ' : ''}</span>${ct.consent1.replace(/^\[.*?\]\s*/, '')}`;
  if (consentTexts[1]) consentTexts[1].textContent = ct.consent2;
  // 모달 버튼
  $('modalBtnDownload').textContent = ct.modalDownload;
  $('modalBtnCancel').textContent = ct.modalCancel;
}

// ─── 초기화 ───
async function init() {
  // 이벤트: 규격 탭
  document.querySelectorAll('.spec-tab').forEach(tab => {
    tab.addEventListener('click', () => reset(tab.dataset.spec));
  });

  // 이벤트: 파일 + 앱 진입 분기
  $('fileInput').addEventListener('change', handleFile);
  const isAppEntry = new URLSearchParams(location.search).get('from') === 'thankyou';
  const btnPhoto = $('btnPhoto');
  if (isAppEntry) {
    btnPhoto.textContent = ct.back;
    btnPhoto.addEventListener('click', () => history.back());
  } else {
    btnPhoto.textContent = ct.photo;
    btnPhoto.addEventListener('click', () => $('fileInput').click());
  }
  $('sampleUploadBtn').addEventListener('click', () => $('fileInput').click());

  // 이벤트: 초기화 (사진 유지, autoPlace 상태 복원)
  $('btnReset').addEventListener('click', () => {
    reset(specKey);
  });

  // 이벤트: 드래그 (이동은 ✋ 핸들에서만)
  $('moveHandle').addEventListener('pointerdown', (e) => onPtrDown(e, 'img'));
  $('crownPin').addEventListener('pointerdown', (e) => onPtrDown(e, 'crown'));
  $('scaleHandle').addEventListener('pointerdown', (e) => onPtrDown(e, 'scale'));
  window.addEventListener('pointermove', onPtrMove);
  window.addEventListener('pointerup', onPtrUp);

  // 이벤트: 미리보기 (누르는 동안 가이드 숨김)
  const btnPreview = $('btnPreview');
  const guideIds = ['overlaySvg','crownPin','crownHint','chinPin','scaleHandle','moveHandle','badgeFace','badgeStatus','badgeScale'];
  btnPreview.addEventListener('pointerdown', () => {
    guideIds.forEach(id => { $(id).style.opacity = '0'; });
  });
  const restoreGuides = () => {
    guideIds.forEach(id => { $(id).style.opacity = ''; });
  };
  btnPreview.addEventListener('pointerup', restoreGuides);
  btnPreview.addEventListener('pointerleave', restoreGuides);

  // 이벤트: 다운로드
  $('btnDownload').addEventListener('click', openModal);

  // 이벤트: 모달
  $('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  $('modalBtnCancel').addEventListener('click', closeModal);
  $('consent1Item').addEventListener('click', () => { consent1 = !consent1; updateConsent(); });
  $('consent2Item').addEventListener('click', () => { consent2 = !consent2; updateConsent(); });

  $('modalBtnDownload').addEventListener('click', () => {
    if (consent1) { performCrop(); closeModal(); }
  });

  // i18n DOM 적용
  applyCropLang();

  // 앱 내 진입이면 자동 로드, 아니면 기존 초기화
  if (!(await checkAppEntry())) {
    pts = initOverlay('passport');
    render();
    // FaceMesh 초기화 (비동기, UI 블로킹 없음)
    initFaceMesh();
  }
}

document.addEventListener('DOMContentLoaded', init);
