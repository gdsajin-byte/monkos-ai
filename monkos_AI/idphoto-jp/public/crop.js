// MONKOS Crop App — vanilla JS
// React プロト v4 → vanilla 変換

// ─── サンプル画像（なし — アップロード誘導） ───
const SAMPLE_IMG = "";

// ─── 規格データ ───
const SPECS = {
  passport: { id: 'passport', label: 'パスポート', wMm: 35, hMm: 45, faceMin: 32, faceMax: 36, faceTarget: 34, topDefault: 5, bottomDefault: 6, pxW: 413, pxH: 531, warn: '眉毛・額の露出必須 · 無表情で正面' },
  id:       { id: 'id',       label: '証明写真',    wMm: 30, hMm: 40, faceMin: 24, faceMax: 32, faceTarget: 28, topDefault: 4, bottomDefault: 5, pxW: 354, pxH: 472, warn: 'ヘア・服装を整える · 好印象の表情' },
};

// サンプル FaceMesh 座標（比率、フレーム基準）
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

// ─── 3段階カラー判定 ───
const COLORS = {
  green: '#00B894', greenDim: 'rgba(0,184,148,0.15)',
  yellow: '#FDCB6E', yellowDim: 'rgba(253,203,110,0.15)',
  red: '#E17055', redDim: 'rgba(225,112,85,0.15)',
  accent: '#6C5CE7', gold: '#FDCB6E', muted: '#4A5568', bg: '#06080D',
};

function getFaceColor(faceMm, spec) {
  if (faceMm >= 33 && faceMm <= 35) return COLORS.green;       // 最適（パスポート）
  if (faceMm >= spec.faceMin && faceMm <= spec.faceMax) return COLORS.yellow; // 許容
  return COLORS.red;                                             // 範囲外
}
function getEyeColor(eyeRatio) {
  if (eyeRatio >= 0.43 && eyeRatio <= 0.45) return COLORS.green;  // 最適
  if (eyeRatio >= 0.40 && eyeRatio <= 0.48) return COLORS.yellow;  // 許容
  return COLORS.red;                                                // 範囲外
}
function isBlocked(faceMm, eyeRatio, spec) {
  // オレンジ/レッド = 範囲完全逸脱時ブロック
  return faceMm < spec.faceMin || faceMm > spec.faceMax || eyeRatio < 0.40 || eyeRatio > 0.48;
}

// ─── 状態 ───
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
let loadedImg = null; // Canvas クロップ用原本画像参照

// ─── FaceMesh 状態 ───
let faceMeshInstance = null;
let faceMeshReady = false;
let faceMeshResults = null;
let lastDetectedLandmarks = null; // { landmarks, natW, natH } — 規格切替時再配置用

// FaceMesh 核心ランドマークインデックス (MediaPipe 478)
const FM_IDX = {
  LEFT_PUPIL: 159,   // 左目中心
  RIGHT_PUPIL: 386,  // 右目中心
  CHIN: 152,         // あご最下端
  LEFT_CHEEK: 234,   // 左側輪郭
  RIGHT_CHEEK: 454,  // 右側輪郭
};

// ─── DOM 参照 ───
const $ = (id) => document.getElementById(id);

function getSpec() { return SPECS[specKey]; }
function getFW() { return Math.round(FH * getSpec().wMm / getSpec().hMm); }
function getMM() { return FH / getSpec().hMm; }

// ─── オーバーレイ初期化 ───
function initOverlay(sk) {
  const s = SPECS[sk];
  const fw = Math.round(FH * s.wMm / s.hMm);
  const p = SAMPLE_POINTS;
  const chinPx = p.chin.y * FH;
  const eyePx = ((p.leftPupil.y + p.rightPupil.y) / 2) * FH;
  const crownPx = eyePx - (chinPx - eyePx); // 目~あご 1:1 反転
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

// ─── スプライン楕円 path ───
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

// ─── レンダー ───
function render() {
  const spec = getSpec();
  const FW = getFW();
  const MM = getMM();

  // 計算
  const isPassport = specKey === 'passport';
  const faceMm = (pts.chin.y - pts.crown.y) / MM;
  const topMm = pts.crown.y / MM;
  const bottomMm = spec.hMm - topMm - faceMm;
  const faceRatio = faceMm / spec.hMm; // 顔比重（フレーム対比）
  const eyeY = (pts.leftPupil.y + pts.rightPupil.y) / 2;
  const eyeRatio = eyeY / FH;
  const eyePct = (eyeRatio * 100).toFixed(0);
  const fc = isPassport ? getFaceColor(faceMm, spec) : COLORS.muted;
  const ec = isPassport ? getEyeColor(eyeRatio) : COLORS.muted;
  const blocked = isPassport ? isBlocked(faceMm, eyeRatio, spec) : false;

  // フレームサイズ
  const frame = $('frame');
  frame.style.width = FW + 'px';
  frame.style.height = FH + 'px';

  // 写真
  const photo = $('photo');
  photo.src = imgSrc;
  photo.classList.toggle('sample-guide', isSample);
  photo.style.transform = `translate(calc(-50% + ${imgPos.x}px), calc(-50% + ${imgPos.y}px)) scale(${imgScale})`;

  // SVGサイズ
  const svg = $('overlaySvg');
  svg.setAttribute('width', FW);
  svg.setAttribute('height', FH);

  // ─── 証明写真: パスポート規格要素非表示 ───
  const passportSvg = ['maskTop','maskBottom','ellipsePath','crownLine','chinLine','eyeLine',
    'dimLineV','dimLineTopH','dimLineBotH','pupilL','pupilR',
    'crownLabelBg','crownLabelText','chinLabelBg','chinLabelText','eyeLabelBg','eyeLabelText'];
  passportSvg.forEach(id => { const el = $(id); if (el) el.setAttribute('opacity', isPassport ? '' : '0'); });
  ['crownPin','crownHint','chinPin','badgeFace','badgeStatus'].forEach(id => {
    $(id).style.display = isPassport ? '' : 'none';
  });
  // セクション可視性（legend, metrics, ICAO range bar）
  document.querySelector('.legend').style.display = isPassport ? '' : 'none';
  document.querySelector('.metrics').style.display = isPassport ? '' : 'none';
  document.querySelector('.range-bar-container').style.display = isPassport ? '' : 'none';

  // 上部マスク
  setAttrs('maskTop', { x: 0, y: 0, width: FW, height: Math.max(0, pts.crown.y) });
  // 下部マスク
  setAttrs('maskBottom', { x: 0, y: pts.chin.y, width: FW, height: Math.max(0, FH - pts.chin.y) });

  // 十字ガイド
  setAttrs('crossH', { x1: 0, y1: FH / 2, x2: FW, y2: FH / 2 });
  // 縦中心線 — 左右逸脱度に応じて色/可視性変更
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

  // スプライン楕円
  const ep = $('ellipsePath');
  ep.setAttribute('d', splinePath());
  ep.setAttribute('stroke', COLORS.accent + '70');

  // 頭頂部ガイド線
  setAttrs('crownLine', { x1: 0, y1: pts.crown.y, x2: FW, y2: pts.crown.y, stroke: fc });

  // あごガイド線
  setAttrs('chinLine', { x1: 0, y1: pts.chin.y, x2: FW, y2: pts.chin.y });

  // 目ガイド線
  setAttrs('eyeLine', { x1: 10, y1: eyeY, x2: FW - 10, y2: eyeY, stroke: ec });

  // 寸法線右側
  setAttrs('dimLineV', { x1: FW - 9, y1: pts.crown.y, x2: FW - 9, y2: pts.chin.y, stroke: fc });
  setAttrs('dimLineTopH', { x1: FW - 13, y1: pts.crown.y, x2: FW - 5, y2: pts.crown.y, stroke: fc });
  setAttrs('dimLineBotH', { x1: FW - 13, y1: pts.chin.y, x2: FW - 5, y2: pts.chin.y, stroke: fc });

  // 瞳
  setAttrs('pupilL', { cx: pts.leftPupil.x, cy: pts.leftPupil.y, fill: ec });
  setAttrs('pupilR', { cx: pts.rightPupil.x, cy: pts.rightPupil.y, fill: ec });

  // ラベル: 頭頂部
  setAttrs('crownLabelBg', { x: 3, y: pts.crown.y - 16, width: 34, height: 13 });
  setAttrs('crownLabelText', { x: 5, y: pts.crown.y - 6, fill: fc });
  // ラベル: あご
  setAttrs('chinLabelBg', { x: 3, y: pts.chin.y + 3, width: 24, height: 13 });
  setAttrs('chinLabelText', { x: 5, y: pts.chin.y + 13 });
  // ラベル: 目の位置
  setAttrs('eyeLabelBg', { x: FW - 38, y: eyeY - 15, width: 35, height: 13 });
  const eyeLabel = $('eyeLabelText');
  eyeLabel.textContent = `目 ${eyePct}%`;
  setAttrs('eyeLabelText', { x: FW - 36, y: eyeY - 5, fill: ec });

  // ピン: 頭頂部
  const crownPin = $('crownPin');
  crownPin.style.left = pts.crown.x + 'px';
  crownPin.style.top = (pts.crown.y - 6) + 'px';
  crownPin.style.background = fc;
  crownPin.style.boxShadow = `0 0 12px ${fc}BB`;

  // ヒント
  const hint = $('crownHint');
  hint.style.left = (pts.crown.x + 10) + 'px';
  hint.style.top = (pts.crown.y - 6) + 'px';
  hint.style.background = COLORS.bg + 'EE';
  hint.style.borderColor = fc + '50';
  hint.style.color = fc;

  // ピン: あご
  const chinPin = $('chinPin');
  chinPin.style.left = pts.chin.x + 'px';
  chinPin.style.top = (pts.chin.y - 9) + 'px';
  chinPin.style.boxShadow = `0 0 10px ${COLORS.gold}99`;

  // スケールハンドル
  const sh = $('scaleHandle');
  sh.style.left = Math.min(FW - 25, Math.max(15, pts.brCorner.x + 15)) + 'px';
  sh.style.top = Math.min(FH - 25, Math.max(15, pts.brCorner.y + 15)) + 'px';
  sh.style.boxShadow = `0 0 10px ${COLORS.accent}BB`;

  // バッジ: faceMm
  const bf = $('badgeFace');
  bf.style.background = COLORS.bg + 'EE';
  bf.style.borderColor = fc;
  bf.style.border = `1px solid ${fc}`;
  bf.style.color = fc;
  $('badgeFaceVal').textContent = faceMm.toFixed(1) + 'mm';
  $('badgeFaceRange').textContent = `/${spec.faceMin}~${spec.faceMax}`;

  // バッジ: ステータス
  const faceInRange = faceMm >= spec.faceMin && faceMm <= spec.faceMax;
  const bs = $('badgeStatus');
  bs.style.background = faceInRange ? COLORS.green + '20' : COLORS.red + '20';
  bs.style.border = `1px solid ${fc}50`;
  bs.style.color = fc;
  bs.textContent = faceInRange ? '✓ 規格内' : '✗ 範囲超過';

  // バッジ: スケール
  $('badgeScale').textContent = `x${imgScale.toFixed(2)}`;

  // 凡例 頭頂部 dot
  $('legendCrownDot').style.background = fc;

  // 数値4カラム
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

  // ─── 警告 ───
  const eyeWarn = $('eyeWarning');
  const centerWarn = $('centerWarning');
  const dlBlock = $('downloadBlock');

  if (isPassport) {
    // パスポート: 目の位置警告
    if (ec === COLORS.red) {
      eyeWarn.classList.remove('hidden');
      eyeWarn.style.background = COLORS.redDim;
      eyeWarn.style.border = `1px solid ${COLORS.red}40`;
      eyeWarn.style.color = COLORS.red;
      eyeWarn.textContent = `目の位置 ${eyePct}% — 許容 40~48%. 写真を上下に調整してください。`;
    } else if (ec === COLORS.yellow) {
      eyeWarn.classList.remove('hidden');
      eyeWarn.style.background = COLORS.yellowDim;
      eyeWarn.style.border = `1px solid ${COLORS.yellow}40`;
      eyeWarn.style.color = COLORS.yellow;
      eyeWarn.textContent = `目の位置 ${eyePct}% — 最適 43~45%. 微調整を推奨。`;
    } else {
      eyeWarn.classList.add('hidden');
    }

    // パスポート: 左右中心警告
    if (!isSample && centerOffsetMm >= 1.5) {
      centerWarn.classList.remove('hidden');
      const cwColor = centerOffsetMm >= 2 ? COLORS.red : COLORS.yellow;
      const cwDim = centerOffsetMm >= 2 ? COLORS.redDim : COLORS.yellowDim;
      centerWarn.style.background = cwDim;
      centerWarn.style.border = `1px solid ${cwColor}40`;
      centerWarn.style.color = cwColor;
      const dir = faceCenterX < FW / 2 ? '右' : '左';
      centerWarn.textContent = `左右中心 ${centerOffsetMm.toFixed(1)}mm 逸脱 — 写真を${dir}に移動してください。`;
    } else {
      centerWarn.classList.add('hidden');
    }

    // パスポート: ダウンロードブロック案内
    if (blocked && !isSample) {
      dlBlock.classList.remove('hidden');
      dlBlock.style.background = COLORS.redDim;
      dlBlock.style.border = `1px solid ${COLORS.red}40`;
      dlBlock.style.color = COLORS.red;
      const reasons = [];
      if (faceMm < spec.faceMin) reasons.push(`顔のサイズ ${faceMm.toFixed(1)}mm — 許容範囲(${spec.faceMin}~${spec.faceMax}mm) 未満. 写真を拡大してください。`);
      if (faceMm > spec.faceMax) reasons.push(`顔のサイズ ${faceMm.toFixed(1)}mm — 許容範囲(${spec.faceMin}~${spec.faceMax}mm) 超過. 写真を縮小してください。`);
      if (eyeRatio < 0.40) reasons.push(`目の位置 ${eyePct}% — 許容範囲(40~48%) 未満. 写真を下に移動してください。`);
      if (eyeRatio > 0.48) reasons.push(`目の位置 ${eyePct}% — 許容範囲(40~48%) 超過. 写真を上に移動してください。`);
      dlBlock.textContent = reasons.join(' ');
    } else {
      dlBlock.classList.add('hidden');
    }

    // パスポート: ICAO範囲バー
    const rangeMin = spec.faceMin / spec.hMm * 100;
    const rangeMax = spec.faceMax / spec.hMm * 100;
    const dotPos = Math.min(97, Math.max(3, faceMm / spec.hMm * 100));
    $('rangeLabel').textContent = `ICAO 許容範囲 (${spec.faceMin}~${spec.faceMax}mm)`;
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
    // ─── 証明写真: 簡素化警告（3つのみ） ───
    eyeWarn.classList.add('hidden');
    const idWarnings = [];
    if (!isSample) {
      if (centerOffsetMm >= 2) idWarnings.push(`左右中心 ${centerOffsetMm.toFixed(1)}mm 逸脱 — 写真を${faceCenterX < FW / 2 ? '右' : '左'}に移動してください。`);
      if (topMm < 2) idWarnings.push(`頭頂部余白 ${topMm.toFixed(1)}mm — 上部が近すぎます。写真を下に移動してください。`);
      if (faceRatio < 0.50) idWarnings.push(`顔の比率 ${(faceRatio * 100).toFixed(0)}% — 50%以上推奨。写真を拡大してください。`);
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

  // ダウンロードボタン
  const btnDl = $('btnDownload');
  if (isSample || blocked) {
    btnDl.className = 'btn btn-download disabled';
    btnDl.disabled = true;
  } else {
    btnDl.className = 'btn btn-download enabled';
    btnDl.disabled = false;
  }

  // ヘッダー情報
  $('headerInfo').textContent = `${spec.pxW}x${spec.pxH}px · 300dpi`;

  // サンプルバナー
  $('sampleBanner').classList.toggle('hidden', !isSample);

  // 規格情報テーブル
  const rows = isPassport ? [
    ['出力規格', `${spec.wMm}x${spec.hMm}mm · ${spec.pxW}x${spec.pxH}px`],
    ['解像度', '300dpi'],
    ['ICAO', `顔 ${spec.faceMin}~${spec.faceMax}mm`],
    ['目の位置', '40~48% (最適 43~45%)'],
  ] : [
    ['出力規格', `${spec.wMm}x${spec.hMm}mm · ${spec.pxW}x${spec.pxH}px`],
    ['解像度', '300dpi'],
    ['案内', spec.warn],
  ];
  $('specInfo').innerHTML = rows.map((r, i) =>
    `<div class="spec-row${i < rows.length - 1 ? '' : ''}">
      <span class="label">${r[0]}</span>
      <span class="value">${r[1]}</span>
    </div>`
  ).join('');

  // 規格タブ活性化
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

// ─── リセット ───
function reset(sk) {
  specKey = sk || specKey;
  if (lastDetectedLandmarks && !isSample) {
    // 実測 FaceMesh データで再配置（規格切替時）
    const { landmarks, natW, natH } = lastDetectedLandmarks;
    pts = autoPlace(landmarks, natW, natH);
  } else {
    pts = initOverlay(specKey);
    imgPos = { x: 0, y: 0 };
    imgScale = 1;
  }
  render();
}

// ─── ドラッグ ───
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
    // スケール中心 = 写真の実際の視覚中心（imgPos反映）
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

// ─── FaceMesh 初期化 ───
function checkWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

async function initFaceMesh() {
  if (typeof FaceMesh === 'undefined') {
    console.warn('[FaceMesh] ライブラリ未ロード — SAMPLE_POINTS フォールバック');
    return;
  }
  if (!checkWebGL()) {
    console.warn('[FaceMesh] WebGL 非対応 — SAMPLE_POINTS フォールバック');
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
    console.log('[FaceMesh] 初期化完了');
  } catch (err) {
    console.warn('[FaceMesh] 初期化失敗:', err.message);
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
    console.warn('[FaceMesh] 検出失敗:', err.message);
    return null;
  }
}

function extractLandmarks(rawLandmarks, natW, natH) {
  // FaceMesh normalized (0~1) → 画像ピクセル座標
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

  // 頭頂部: 目~あご 1:1 反転
  const eyeCenterY = (leftPupil.y + rightPupil.y) / 2;
  const eyeCenterX = (leftPupil.x + rightPupil.x) / 2;
  const crownY = eyeCenterY - (chin.y - eyeCenterY);
  const crown = { x: eyeCenterX, y: crownY };

  // 四隅4点補間
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

  // coverスケール計算（object-fit: cover 基準）
  const coverScale = Math.max(FW / natW, FH / natH);
  const displayW = natW * coverScale;
  const displayH = natH * coverScale;
  const offsetX = (displayW - FW) / 2;
  const offsetY = (displayH - FH) / 2;

  // 画像座標 → cover座標
  function toCover(pt) {
    return { x: pt.x * coverScale - offsetX, y: pt.y * coverScale - offsetY };
  }

  const crownCover = toCover(imgLandmarks.crown);
  const chinCover  = toCover(imgLandmarks.chin);
  const eyeLCover  = toCover(imgLandmarks.leftPupil);
  const eyeRCover  = toCover(imgLandmarks.rightPupil);

  const eyeYCover = (eyeLCover.y + eyeRCover.y) / 2;
  const faceHCover = chinCover.y - crownCover.y;

  // imgScale: 顔がfaceTarget mmに合うように
  const targetFacePx = spec.faceTarget * MM;
  const newScale = targetFacePx / faceHCover;

  // imgPos.y: 目が43%に来るように
  const newPosY = 0.43 * FH - FH / 2 - (eyeYCover - FH / 2) * newScale;

  // imgPos.x: 顔中心がフレーム中央に来るように
  const faceCenterXCover = (eyeLCover.x + eyeRCover.x) / 2;
  const newPosX = -(faceCenterXCover - FW / 2) * newScale;

  imgScale = newScale;
  imgPos = { x: newPosX, y: newPosY };

  // 全ランドマークをフレーム座標に変換
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
    el.querySelector('span').textContent = 'FaceMesh 分析中...';
  }, 2500);
}

// ─── ファイルアップロード ───
async function handleFile(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;

  const url = URL.createObjectURL(f);
  imgSrc = url;
  isSample = false;

  // 画像ロード後FaceMesh実行
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = async () => {
    loadedImg = img; // Canvas クロップ用参照保管
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    if (faceMeshReady) {
      // ローディング表示
      $('facemeshLoading').classList.remove('hidden');
      // 画像を先に表示（SAMPLE_POINTS 一時）
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
          // 顔未検出
          lastDetectedLandmarks = null;
          showFaceMeshMsg('顔を検出できませんでした。正面写真をアップロードしてください。');
        }
      } catch (err) {
        $('facemeshLoading').classList.add('hidden');
        lastDetectedLandmarks = null;
        console.warn('[FaceMesh] エラー:', err);
      }
    } else {
      // FaceMesh 未使用 → SAMPLE_POINTS フォールバック
      lastDetectedLandmarks = null;
      if (!checkWebGL()) {
        showFaceMeshMsg('このブラウザでは顔分析をサポートしていません。');
      }
      reset(specKey);
    }
  };
}

// ─── Canvas クロップダウンロード ───
function performCrop() {
  if (!loadedImg || isSample) return;
  const spec = getSpec();
  const FW = getFW();
  const outScale = spec.pxH / FH; // フレーム → 出力解像度比率

  const canvas = document.createElement('canvas');
  canvas.width = spec.pxW;
  canvas.height = spec.pxH;
  const ctx = canvas.getContext('2d');

  // 出力解像度にスケール
  ctx.scale(outScale, outScale);

  // CSS transform再現: translate(calc(-50% + X), calc(-50% + Y)) scale(S)
  // 写真視覚中心に移動 → imgScale適用 → 原点復元
  ctx.translate(FW / 2 + imgPos.x, FH / 2 + imgPos.y);
  ctx.scale(imgScale, imgScale);
  ctx.translate(-FW / 2, -FH / 2);

  // object-fit: cover 再現
  const natW = loadedImg.naturalWidth;
  const natH = loadedImg.naturalHeight;
  const coverScale = Math.max(FW / natW, FH / natH);
  const dw = natW * coverScale;
  const dh = natH * coverScale;
  ctx.drawImage(loadedImg, (FW - dw) / 2, (FH - dh) / 2, dw, dh);

  // JPEGダウンロード
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

// ─── モーダル ───
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
    { l: '顔', v: faceMm.toFixed(1) + 'mm', c: fc },
    { l: '上部', v: topMm.toFixed(1) + 'mm', c: COLORS.muted },
    { l: '下部', v: bottomMm.toFixed(1) + 'mm', c: COLORS.muted },
    { l: '目の位置', v: eyePct + '%', c: ec },
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
      ? `顔の長さ ${faceMm.toFixed(1)}mm — ICAO 範囲(${spec.faceMin}~${spec.faceMax}mm) 逸脱`
      : `目の位置 ${eyePct}% — 許容 40~48% 逸脱`;
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
  $('modalBtnOverlay').className = `modal-btn modal-btn-secondary ${cls1}`;
  $('modalBtnOverlay').disabled = !consent1;
}

// ─── アプリ内遷移検知（thankyou → crop） ───
async function checkAppEntry() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const spec = params.get('spec');

  if (from === 'thankyou') {
    // 規格自動選択
    if (spec && SPECS[spec]) {
      specKey = spec;
      document.querySelectorAll('.spec-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.spec === spec);
      });
    }

    // sessionStorageから補正原本ロード
    const imageData = sessionStorage.getItem('monkos_image');
    if (imageData) {
      // FaceMesh先にロード（アプリ遷移時の顔検出保証）
      if (!faceMeshReady) await initFaceMesh();

      imgSrc = imageData;
      isSample = false;

      const img = new Image();
      img.onload = async () => {
        loadedImg = img;
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;

        // 初期レンダー（SAMPLE_POINTS 一時）
        pts = initOverlay(specKey);
        render();

        // FaceMesh実行
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
              showFaceMeshMsg('顔を検出できませんでした。');
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

      // 戻る = thankyou復帰
      window.addEventListener('popstate', () => {
        window.location.href = 'thankyou.html';
      });

      return true;
    }

    // from=thankyouだがセッションデータなし → 案内
    const banner = $('sampleBanner');
    if (banner) {
      banner.querySelector('span').textContent = '前のステップの画像が見つかりません。写真をアップロードしてください。';
      banner.classList.remove('hidden');
    }
  }
  return false;
}

// ─── 初期化 ───
async function init() {
  // イベント: 規格タブ
  document.querySelectorAll('.spec-tab').forEach(tab => {
    tab.addEventListener('click', () => reset(tab.dataset.spec));
  });

  // イベント: ファイル + アプリ遷移分岐
  $('fileInput').addEventListener('change', handleFile);
  const isAppEntry = new URLSearchParams(location.search).get('from') === 'thankyou';
  const btnPhoto = $('btnPhoto');
  if (isAppEntry) {
    btnPhoto.textContent = '\u2190 戻る';
    btnPhoto.addEventListener('click', () => history.back());
  } else {
    btnPhoto.textContent = '写真を選択';
    btnPhoto.addEventListener('click', () => $('fileInput').click());
  }
  $('sampleUploadBtn').addEventListener('click', () => $('fileInput').click());

  // イベント: リセット（写真維持、autoPlace状態復元）
  $('btnReset').addEventListener('click', () => {
    reset(specKey);
  });

  // イベント: ドラッグ（移動は✋ハンドルからのみ）
  $('moveHandle').addEventListener('pointerdown', (e) => onPtrDown(e, 'img'));
  $('crownPin').addEventListener('pointerdown', (e) => onPtrDown(e, 'crown'));
  $('scaleHandle').addEventListener('pointerdown', (e) => onPtrDown(e, 'scale'));
  window.addEventListener('pointermove', onPtrMove);
  window.addEventListener('pointerup', onPtrUp);

  // イベント: プレビュー（押している間ガイド非表示）
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

  // イベント: ダウンロード
  $('btnDownload').addEventListener('click', openModal);

  // イベント: モーダル
  $('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  $('modalBtnCancel').addEventListener('click', closeModal);
  $('consent1Item').addEventListener('click', () => { consent1 = !consent1; updateConsent(); });
  $('consent2Item').addEventListener('click', () => { consent2 = !consent2; updateConsent(); });

  $('modalBtnDownload').addEventListener('click', () => {
    if (consent1) { performCrop(); closeModal(); }
  });
  $('modalBtnOverlay').addEventListener('click', () => {
    if (consent1) { alert('ガイドオーバーレイキャプチャ保存（Canvas レンダー予定）'); closeModal(); }
  });

  // アプリ内遷移なら自動ロード、そうでなければ既存初期化
  if (!(await checkAppEntry())) {
    pts = initOverlay('passport');
    render();
    // FaceMesh初期化（非同期、UIブロッキングなし）
    initFaceMesh();
  }
}

document.addEventListener('DOMContentLoaded', init);
