// 규격 레퍼런스 1:1 정방 도해 생성기 — prof 마스터(순백) 기반 26종
// 작가님 지시(2026-07-11): 1:1 정방(구글 썸네일 포석) · 세련 팔레트 · 정수리/턱선 실좌표 정합 · 얼굴 여유(kr=32mm)
import sharp from '../../node_modules/sharp/lib/index.js';
import fs from 'fs';
import path from 'path';

const SP = process.env.SCRATCH || '/tmp/specs-diagrams';
const PORTAL = path.resolve(import.meta.dirname, '../..');
const OUTDIR = `${SP}/guides_v2`;
fs.mkdirSync(OUTDIR, { recursive: true });

const MASTER = process.env.MASTER || `${SP}/prof_master_white.png`;
// crop-engine /api/fit-spec 정본 실측 (106점 랜드마크) — 2026-07-11 14:5x 호출값.
// ⚠️ hairTopY 98.2 = 거울상 정수리(눈 − (턱 − 눈) = 279.6 − 181.4)이지 매팅 머리끝이 아니다 (2026-11-04 실측 정정).
// 마스터의 실제 머리 덩어리 끝은 y≈59(제품 hair-measure.js 정의, 약 3.5mm 위) — 머리카락은 위 여백(crownMm)으로 수용된다.
// 그래서 "두상 32mm" = 거울상 32mm이며, 마스터 기준 턱~머리 덩어리 = 35.5mm·눈 47.7%·머리 위 여백 2.0mm.
// 제품(lib/hair-measure.js resolveHeadPlacement, 11-04)은 실측 두상 33mm 재배율 + 얼굴 하한 가드(거울상 ≥32)라
// 볼륨 있는 머리에서 배율이 이 도안(거울상 32)과 같아진다. 11-04 작가님 결정: 도안 32 거울상 유지(권장안 A).
// 나이브 픽셀 스캔(y=56)은 매팅 소프트 헤일로를 오검출 → 정본 좌표 고정 사용.
const FACE = { chinY: 461.0, hairTopY: 98.2, eyeY: 279.6, cx: 449.4 };

// ── 규격별 머리높이(mm) 사전 — specs-data에서 사이즈 매칭 (cm→mm, 괄호 mm 우선)
function headRangeBySize() {
  const d = JSON.parse(fs.readFileSync(`${PORTAL}/lib/cms/specs-data.json`, 'utf8'));
  const map = {};
  for (const s of Object.values(d)) {
    const sz = String(s.size || '');
    const m = sz.match(/\(?\s*(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm\s*\)?/i) || sz.match(/^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*cm/i);
    if (!m) continue;
    let W = Number(m[1]), H = Number(m[2]);
    if (/cm/i.test(m[0])) { W *= 10; H *= 10; }
    const key = `${Math.round(W)}x${Math.round(H)}`;
    if (map[key]) continue;
    const hh = String(s.headHeight || '');
    const paren = hh.match(/\(([^)]*(?:mm|cm)[^)]*)\)/i);
    const src = paren ? paren[1] : hh;
    const nums = (src.match(/[\d.]+/g) || []).map(Number).filter(n => n > 0).slice(0, 2);
    if (!nums.length) continue;
    let lo = nums[0], hi = nums.length === 2 ? nums[1] : nums[0];
    if (/cm/i.test(src) || hi < 10) { lo *= 10; hi *= 10; }
    if (lo >= H || lo < H * 0.35) continue; // 표기 오류 가드
    map[key] = { lo, hi, label: `${(lo / 10).toFixed(1).replace(/\.0$/, '')}~${(hi / 10).toFixed(1).replace(/\.0$/, '')}cm` };
  }
  return map;
}

// ── 도해 팔레트 (사이트 도면과 통일, 세련 톤)
const C = {
  bg: '#F6F6FA', card: '#FFFFFF', cardBorder: '#E4E2EE',
  dim: '#6C4FFF', dimSoft: 'rgba(108,79,255,0.55)',
  head: '#EF4444', headSoft: 'rgba(239,68,68,0.55)', headDash: 'rgba(239,68,68,0.65)',
  text: '#1A1A2E',
};
const CANVAS = 1200, PHOTO_H = 720, PHOTO_TOP = 190;

function dimSvg(photo, spec) {
  const { x, y, w, h } = photo; // 사진 배치(캔버스 좌표)
  const { Wmm, Hmm, head } = spec; // head = {topY, botY(캔버스), label} | null
  const wLabel = `${(Wmm / 10).toFixed(1).replace(/\.0$/, '')}cm`;
  const hLabel = `${(Hmm / 10).toFixed(1).replace(/\.0$/, '')}cm`;
  const cap = 14, lw = 2.5;
  const leftX = x - 56, botY = y + h + 52;
  let s = '';
  // 세로 치수 (좌측): 캡 + 선 + 라벨칩
  s += `<line x1="${leftX - cap}" y1="${y}" x2="${leftX + cap}" y2="${y}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${leftX - cap}" y1="${y + h}" x2="${leftX + cap}" y2="${y + h}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${leftX}" y1="${y}" x2="${leftX}" y2="${y + h}" stroke="${C.dimSoft}" stroke-width="1.5"/>`;
  s += `<rect x="${leftX - 52}" y="${y + h / 2 - 26}" width="104" height="52" rx="26" fill="${C.bg}"/>`;
  s += `<text x="${leftX}" y="${y + h / 2}" font-size="34" font-weight="700" fill="${C.dim}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif">${hLabel}</text>`;
  // 가로 치수 (하단)
  s += `<line x1="${x}" y1="${botY - cap}" x2="${x}" y2="${botY + cap}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${x + w}" y1="${botY - cap}" x2="${x + w}" y2="${botY + cap}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${x}" y1="${botY}" x2="${x + w}" y2="${botY}" stroke="${C.dimSoft}" stroke-width="1.5"/>`;
  s += `<rect x="${x + w / 2 - 52}" y="${botY - 26}" width="104" height="52" rx="26" fill="${C.bg}"/>`;
  s += `<text x="${x + w / 2}" y="${botY}" font-size="34" font-weight="700" fill="${C.dim}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif">${wLabel}</text>`;
  if (head) {
    const rightX = x + w + 56;
    // 정수리·턱 점선 (사진 안, 실좌표 밀착)
    s += `<line x1="${x + w * 0.06}" y1="${head.topY}" x2="${x + w * 0.94}" y2="${head.topY}" stroke="${C.headDash}" stroke-width="2.5" stroke-dasharray="9 7"/>`;
    s += `<line x1="${x + w * 0.06}" y1="${head.botY}" x2="${x + w * 0.94}" y2="${head.botY}" stroke="${C.headDash}" stroke-width="2.5" stroke-dasharray="9 7"/>`;
    // 머리높이 치수 (우측, 밴드 구간)
    s += `<line x1="${rightX - cap}" y1="${head.topY}" x2="${rightX + cap}" y2="${head.topY}" stroke="${C.head}" stroke-width="${lw}"/>`;
    s += `<line x1="${rightX - cap}" y1="${head.botY}" x2="${rightX + cap}" y2="${head.botY}" stroke="${C.head}" stroke-width="${lw}"/>`;
    s += `<line x1="${rightX}" y1="${head.topY}" x2="${rightX}" y2="${head.botY}" stroke="${C.headSoft}" stroke-width="1.5"/>`;
    const midY = (head.topY + head.botY) / 2;
    s += `<rect x="${rightX - 30}" y="${midY - 92}" width="60" height="184" rx="30" fill="${C.bg}"/>`;
    s += `<text x="${rightX}" y="${midY}" font-size="30" font-weight="700" fill="${C.head}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" transform="rotate(90 ${rightX} ${midY})">${head.label}</text>`;
  }
  return s;
}

async function generate(key, Wmm, Hmm, range, outName) {
  const hairTopY = FACE.hairTopY;
  // 머리 타깃: 좁은 범위(≤4mm)=하한(작가님: kr 32) / 넓은 범위=하한+35% / 무규정=프레임 70%
  let headMm, label = null;
  if (range) {
    headMm = (range.hi - range.lo) <= 4 ? range.lo : range.lo + (range.hi - range.lo) * 0.35;
    label = range.label;
  } else headMm = Hmm * 0.70;
  const headPx = FACE.chinY - hairTopY;
  const ppm = headPx / headMm; // master px per mm
  const fh = Hmm * ppm, fw = Wmm * ppm;
  const crownMm = Math.min(8, Math.max(2, (Hmm - headMm) * 0.42));
  const top = hairTopY - crownMm * ppm;
  const left = FACE.cx - fw / 2;
  // 마스터 밖은 흰 패딩 (마스터 배경이 순백이라 이음매 없음) — 라운딩 클램프는 extractFitRegion 준용
  const meta = await sharp(MASTER).metadata();
  const cw = Math.round(fw), ch = Math.round(fh);
  const fx = Math.round(left), fy = Math.round(top);
  const ix = Math.max(0, fx), iy = Math.max(0, fy);
  let iw = Math.min(meta.width, fx + cw) - ix, ih = Math.min(meta.height, fy + ch) - iy;
  const dx = ix - fx, dy = iy - fy;
  if (dx + iw > cw) iw = cw - dx;
  if (dy + ih > ch) ih = ch - dy;
  let crop = await sharp(MASTER).extract({ left: ix, top: iy, width: iw, height: ih }).png().toBuffer();
  if (dx || dy || iw !== cw || ih !== ch) {
    crop = await sharp({ create: { width: cw, height: ch, channels: 3, background: '#FFFFFF' } })
      .composite([{ input: crop, left: dx, top: dy }]).png().toBuffer();
  }
  // 캔버스 배치: 높이 고정 → 폭 파생
  const dispH = PHOTO_H, dispW = Math.round(dispH * (Wmm / Hmm));
  const px = Math.round((CANVAS - dispW) / 2), py = PHOTO_TOP;
  const photo = await sharp(crop).resize(dispW, dispH, { fit: 'fill' }).png().toBuffer();
  // 얼굴 라인 캔버스 좌표 (크롭 상단 = top → 캔버스 py)
  const scaleY = dispH / fh;
  const head = label ? {
    topY: py + (hairTopY - top) * scaleY,
    botY: py + (FACE.chinY - top) * scaleY,
    label,
  } : null;
  // 레이어: 바닥(배경+카드) → 사진 → 치수 오버레이(투명 SVG) — 점선이 사진 위에 살도록
  const base = `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${CANVAS}" height="${CANVAS}" fill="${C.bg}"/>
    <rect x="${px - 10}" y="${py - 10}" width="${dispW + 20}" height="${dispH + 20}" rx="18" fill="${C.card}" stroke="${C.cardBorder}" stroke-width="2"/>
  </svg>`;
  const overlay = `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
    ${dimSvg({ x: px, y: py, w: dispW, h: dispH }, { Wmm, Hmm, head })}
  </svg>`;
  const out = await sharp(Buffer.from(base))
    .composite([
      { input: photo, left: px, top: py },
      { input: Buffer.from(overlay), left: 0, top: 0 },
    ])
    .webp({ quality: 88 }).toBuffer();
  fs.writeFileSync(`${OUTDIR}/${outName}`, out);
  return { key, Wmm, Hmm, headMm: headMm.toFixed(1), label: label || '(무규정→70%)', size: out.length };
}

// ── 실행

console.log("정본 좌표: hairTop", FACE.hairTopY, "chin", FACE.chinY, "머리픽셀", (FACE.chinY - FACE.hairTopY).toFixed(1));
const ranges = headRangeBySize();
const files = fs.readdirSync(`${PORTAL}/public/images/guides`).filter(f => /^\d+x\d+\.webp$/.test(f));
const results = [];
for (const f of files) {
  const [W, H] = f.replace('.webp', '').split('x').map(Number);
  results.push(await generate(f, W, H, ranges[`${W}x${H}`] || null, f));
}
// kr-passport 전용 (35x45, 머리 32mm 고정 — 작가님 지시) + korea-passport 별칭
const krRange = { lo: 32, hi: 36, label: '3.2~3.6cm' };
results.push(await generate('kr-passport', 35, 45, { ...krRange, hi: 32.1 }, 'kr-passport.webp')); // 좁은범위 취급→lo=32 고정
fs.copyFileSync(`${OUTDIR}/kr-passport.webp`, `${OUTDIR}/korea-passport.webp`);
console.table(results.map(r => ({ 파일: r.key, 규격: `${r.Wmm}x${r.Hmm}`, 머리mm: r.headMm, 라벨: r.label, KB: (r.size / 1024).toFixed(0) })));
console.log('산출:', fs.readdirSync(OUTDIR).length, '파일 →', OUTDIR);
