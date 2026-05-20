#!/usr/bin/env node
/**
 * 규격별 가이드 이미지 일괄 생성
 * ref.jpg + D1 규격 데이터 → 112개 WebP 이미지
 */
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const REF_PATH = path.join(process.env.HOME, 'Desktop/CROP APP/ref.jpg');
const SPECS_PATH = '/tmp/specs_for_images.json';
const OUT_DIR = path.join(__dirname, '../../MONK_kr/images/specs/guides');

const FACE = {
  imgWidth: 1024,
  imgHeight: 1024,
  crownY: 55,
  eyeY: 340,
  chinY: 520,
  shoulderY: 680,
  centerX: 512,
};

const OUTPUT_WIDTH = 600;
const ACCENT = '#6c4fff';
const ACCENT_LIGHT = 'rgba(108,79,255,0.35)';
const ACCENT_BG = 'rgba(108,79,255,0.06)';
const GREEN = '#22c55e';
const RED = '#ef4444';
const WHITE = '#ffffff';
const BG_MAP = {
  white: '#f0f0f0',
  'light-grey': '#e8e8e8',
  blue: '#dbe8fe',
  plain: '#ededf0',
};

function drawCorner(ctx, x, y, size, flipX, flipY) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();
  ctx.restore();
}

function drawGuideLine(ctx, y, w, label, align, color) {
  ctx.save();
  ctx.setLineDash([8, 5]);
  ctx.strokeStyle = color || ACCENT_LIGHT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, y);
  ctx.lineTo(w - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (label) {
    ctx.font = 'bold 11px -apple-system, "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(108,79,255,0.7)';
    ctx.textAlign = align || 'left';
    const lx = align === 'right' ? w - 24 : 24;
    const pad = 3;
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(lx - (align === 'right' ? tw + pad : pad), y - 14, tw + pad * 2, 16);
    ctx.fillStyle = 'rgba(108,79,255,0.8)';
    ctx.fillText(label, lx, y - 3);
  }
  ctx.restore();
}

function drawDimBracket(ctx, x, y1, y2, label) {
  ctx.save();
  ctx.strokeStyle = 'rgba(108,79,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 4, y1);
  ctx.lineTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.lineTo(x - 4, y2);
  ctx.stroke();

  ctx.font = 'bold 10px -apple-system, monospace';
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'left';
  ctx.save();
  ctx.translate(x + 12, (y1 + y2) / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
  ctx.restore();
  ctx.restore();
}

function drawBadge(ctx, x, y, text, bgColor) {
  ctx.save();
  ctx.font = 'bold 11px -apple-system, monospace';
  const tw = ctx.measureText(text).width;
  const pad = 8;
  ctx.fillStyle = bgColor || 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(x, y, tw + pad * 2, 22, 5);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.fillText(text, x + pad, y + 15);
  ctx.restore();
}

async function generateImage(refImg, spec) {
  const swMm = parseFloat(spec.size_w_mm) || 35;
  const shMm = parseFloat(spec.size_h_mm) || 45;
  const photoRatio = swMm / shMm;
  const outW = OUTPUT_WIDTH;
  const outH = Math.round(outW / photoRatio);

  const headMaxMm = parseFloat(spec.head_height_max_mm) || shMm * 0.7;
  const headMinMm = parseFloat(spec.head_height_min_mm) || headMaxMm * 0.85;
  const headRatio = headMaxMm / shMm;
  const topMarginMm = (shMm - headMaxMm) * 0.35;
  const topMarginRatio = topMarginMm / shMm;

  const faceH = FACE.chinY - FACE.crownY;
  const targetFaceH = outH * headRatio;
  const scale = targetFaceH / faceH;

  const targetCrownY = outH * topMarginRatio;
  const cropCenterX = FACE.centerX;
  const cropW_src = Math.round(outW / scale);
  const cropH_src = Math.round(outH / scale);
  const cropX_src = Math.round(Math.max(0, cropCenterX - cropW_src / 2));
  const cropY_src = Math.round(Math.max(0, FACE.crownY - targetCrownY / scale));

  const cropX = Math.min(cropX_src, FACE.imgWidth - cropW_src);
  const cropY = Math.min(cropY_src, FACE.imgHeight - cropH_src);
  const cropW = Math.min(cropW_src, FACE.imgWidth - cropX);
  const cropH = Math.min(cropH_src, FACE.imgHeight - cropY);

  let croppedBuf;
  try {
    croppedBuf = await sharp(REF_PATH)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .resize(outW, outH, { fit: 'fill' })
      .toBuffer();
  } catch {
    croppedBuf = await sharp(REF_PATH)
      .resize(outW, outH, { fit: 'cover' })
      .toBuffer();
  }

  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');

  const bgColor = BG_MAP[spec.background] || BG_MAP.white;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, outW, outH);

  const img = await loadImage(croppedBuf);
  ctx.drawImage(img, 0, 0, outW, outH);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, outW, outH);

  const corner = 28;
  const pad = 10;
  drawCorner(ctx, pad, pad, corner, false, false);
  drawCorner(ctx, outW - pad, pad, corner, true, false);
  drawCorner(ctx, pad, outH - pad, corner, false, true);
  drawCorner(ctx, outW - pad, outH - pad, corner, true, true);

  const mapY = (srcY) => (srcY - cropY) / cropH * outH;
  const crownPx = mapY(FACE.crownY);
  const chinPx = mapY(FACE.chinY);
  const eyePx = spec.eye_position_min_pct && spec.eye_position_min_pct !== 'null'
    ? outH * (1 - parseFloat(spec.eye_position_min_pct) / 100)
    : mapY(FACE.eyeY);
  const shoulderPx = mapY(FACE.shoulderY);

  drawGuideLine(ctx, crownPx, outW, 'HEAD TOP', 'left');
  drawGuideLine(ctx, eyePx, outW, 'EYE LINE', 'right');
  drawGuideLine(ctx, chinPx, outW, 'CHIN', 'left');
  drawGuideLine(ctx, shoulderPx, outW, 'SHOULDER', 'right');

  if (parseFloat(spec.head_height_min_mm) && parseFloat(spec.head_height_max_mm)) {
    drawDimBracket(ctx, outW - 30, crownPx, chinPx,
      `${spec.head_height_min_mm}~${spec.head_height_max_mm}mm`);
  }

  const wCm = (swMm / 10).toFixed(1) + 'cm';
  const hCm = (shMm / 10).toFixed(1) + 'cm';

  ctx.save();
  ctx.strokeStyle = ACCENT_LIGHT;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, outH - 8);
  ctx.lineTo(outW - 30, outH - 8);
  ctx.stroke();
  ctx.font = 'bold 11px -apple-system, monospace';
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.fillText(wCm, outW / 2, outH - 12);
  ctx.restore();

  const sizeText = swMm + '×' + shMm + ' mm';
  drawBadge(ctx, 10, 10, sizeText);

  if (spec.standard && spec.standard !== 'null') {
    const tw1 = ctx.measureText(sizeText).width + 32;
    drawBadge(ctx, tw1, 10, spec.standard);
  }

  const buf = canvas.toBuffer('image/png');
  return sharp(buf).webp({ quality: 85 }).toBuffer();
}

async function main() {
  const specs = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'));
  const refImg = await loadImage(REF_PATH);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let success = 0;
  let fail = 0;

  for (const spec of specs) {
    const filename = `${spec.country_slug}-${spec.doc_slug}.webp`;
    try {
      const webp = await generateImage(refImg, spec);
      fs.writeFileSync(path.join(OUT_DIR, filename), webp);
      success++;
      if (success % 20 === 0) process.stdout.write(`${success}/${specs.length} `);
    } catch (err) {
      console.error(`FAIL: ${filename} — ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone: ${success} success, ${fail} fail out of ${specs.length}`);
}

main().catch(console.error);
