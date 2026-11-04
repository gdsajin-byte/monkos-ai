// 브랜드 도해 v5 — (2026-07-11 작가님): 수치는 사진 밖 여백(신체 위 금지)·칩 제거·46px 통일,
// 배색 캔버스 가득(흰 사진과 2단 결), 가이드선 좌/우/하 균형 배치, 점선은 사진 관통 유지
// 상단: {국기} {국가} {문서} 사진 규격(언어별) · 하단: 로고+MONKOS.AI (IDPASS 표기는 ch8 미결이라 보류)
import sharp from '../../node_modules/sharp/lib/index.js';
import fs from 'fs';
import path from 'path';

const SP = process.env.SCRATCH || '/tmp/specs-diagrams';
const PORTAL = path.resolve(import.meta.dirname, '../..');
const OUT = `${SP}/guides_v5`;
fs.mkdirSync(OUT, { recursive: true });

const MASTER = process.env.MASTER || `${SP}/prof_master_white.png`;
// hairTopY 98.2 = 거울상 정수리(눈 279.6 − (턱 461 − 눈))이지 매팅 머리끝이 아니다 — 머리 덩어리(y≈59)는 위 여백으로 수용.
// 두상 mm 라벨·배율은 거울상 기준 (2026-11-04 실측 정정·작가님 결정 A, 상세 gen_reference_diagrams.mjs 머리 주석)
const FACE = { chinY: 461.0, hairTopY: 98.2, cx: 449.4 }; // crop-engine 106점 정본
const CANVAS = 1200, PHOTO_H = 890, PHOTO_TOP = 132;
const C = {
  bg: '#F1F0F8', photoBorder: 'rgba(0,0,0,0.05)',
  dim: '#6C4FFF', dimSoft: 'rgba(108,79,255,0.75)',
  head: '#EF4444', headSoft: 'rgba(239,68,68,0.75)', headDash: 'rgba(239,68,68,0.75)',
  title: '#1A1A2E', brand: '#1A1A2E',
};

// ── 텍스트 폭 근사 (CJK=1.0em, 대문자/숫자 0.66, 소문자 0.52, 공백 0.30, 기타 0.45)
function estWidth(str, fs_) {
  let w = 0;
  for (const ch of str) {
    const c = ch.codePointAt(0);
    if (c >= 0x1100 && c <= 0xFFDC || c >= 0x3000 && c <= 0x9FFF) w += 1.0;
    else if (/[A-Z0-9]/.test(ch)) w += 0.66;
    else if (/[a-z]/.test(ch)) w += 0.52;
    else if (ch === ' ') w += 0.30;
    else w += 0.45;
  }
  return w * fs_;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── 데이터 로드
const DATA = Object.values(JSON.parse(fs.readFileSync(`${PORTAL}/lib/cms/specs-data.json`, 'utf8')));
function parseSize(s) {
  const m = String(s).match(/\(?\s*(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm\s*\)?/i) || String(s).match(/^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*cm/i);
  if (!m) return null;
  let W = Number(m[1]), H = Number(m[2]);
  if (/cm/i.test(m[0])) { W *= 10; H *= 10; }
  return { Wmm: W, Hmm: H };
}
function parseHead(hh, Hmm) {
  const paren = String(hh || '').match(/\(([^)]*(?:mm|cm)[^)]*)\)/i);
  const src = paren ? paren[1] : String(hh || '');
  const nums = (src.match(/[\d.]+/g) || []).map(Number).filter(n => n > 0).slice(0, 2);
  if (!nums.length) return null;
  let lo = nums[0], hi = nums.length === 2 ? nums[1] : nums[0];
  if (/cm/i.test(src) || hi < 10) { lo *= 10; hi *= 10; }
  if (lo >= Hmm || lo < Hmm * 0.35) return null;
  return { lo, hi, label: `${(lo / 10).toFixed(1).replace(/\.0$/, '')}~${(hi / 10).toFixed(1).replace(/\.0$/, '')}cm` };
}

// ── 로고 아이콘 라스터 (1회)
const iconPng = await sharp(`${PORTAL}/public/monkos-icon.svg`).resize(52, 52).png().toBuffer();

// ── 국기 캐시 (표시 높이 46 고정, 폭 비율 유지)
const flagCache = {};
async function flag(iso) {
  if (flagCache[iso]) return flagCache[iso];
  const p = `${SP}/flags/${iso}.png`;
  if (!fs.existsSync(p)) return null;
  const m = await sharp(p).metadata();
  const h = 52, w = Math.round(m.width * (h / m.height));
  flagCache[iso] = { buf: await sharp(p).resize(w, h).png().toBuffer(), w, h };
  return flagCache[iso];
}

// ── 크롭·사진 캐시 (규격+머리 조합별 1회)
const cropCache = {};
async function specPhoto(Wmm, Hmm, headMm) {
  const key = `${Wmm}x${Hmm}@${headMm.toFixed(1)}`;
  if (cropCache[key]) return cropCache[key];
  const headPx = FACE.chinY - FACE.hairTopY;
  const ppm = headPx / headMm;
  const fw = Wmm * ppm, fh = Hmm * ppm;
  const crownMm = Math.min(8, Math.max(2, (Hmm - headMm) * 0.42));
  const top = FACE.hairTopY - crownMm * ppm, left = FACE.cx - fw / 2;
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
  const dispH = PHOTO_H, dispW = Math.round(dispH * (Wmm / Hmm));
  const photo = await sharp(crop).resize(dispW, dispH, { fit: 'fill' }).png().toBuffer();
  const scaleY = dispH / fh;
  cropCache[key] = {
    photo, dispW, dispH,
    headTop: (FACE.hairTopY - top) * scaleY,   // 사진 로컬 y
    headBot: (FACE.chinY - top) * scaleY,
  };
  return cropCache[key];
}

// ── 치수선 SVG (v2 동일 문법, 위치 파라미터화)
function dimSvg(x, y, w, h, Wmm, Hmm, head) {
  const wl = `${(Wmm / 10).toFixed(1).replace(/\.0$/, '')}cm`, hl = `${(Hmm / 10).toFixed(1).replace(/\.0$/, '')}cm`;
  const cap = 16, lw = 3, fsz = 46;
  let s = '';
  // 세로 치수 — 사진 좌측 밖 (라벨은 선 왼쪽)
  const lx = x - 56;
  s += `<line x1="${lx - cap}" y1="${y}" x2="${lx + cap}" y2="${y}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${lx - cap}" y1="${y + h}" x2="${lx + cap}" y2="${y + h}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${lx}" y1="${y}" x2="${lx}" y2="${y + h}" stroke="${C.dimSoft}" stroke-width="2"/>`;
  s += `<rect x="${lx - 36}" y="${y + h / 2 - 90}" width="72" height="180" rx="36" fill="${C.bg}"/>`;
  s += `<text x="${lx}" y="${y + h / 2}" font-size="${fsz}" font-weight="800" fill="${C.dim}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" transform="rotate(90 ${lx} ${y + h / 2})">${hl}</text>`;
  // 가로 치수 — 사진 하단 밖
  const by = y + h + 52;
  s += `<line x1="${x}" y1="${by - cap}" x2="${x}" y2="${by + cap}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${x + w}" y1="${by - cap}" x2="${x + w}" y2="${by + cap}" stroke="${C.dim}" stroke-width="${lw}"/>`;
  s += `<line x1="${x}" y1="${by}" x2="${x + w}" y2="${by}" stroke="${C.dimSoft}" stroke-width="2"/>`;
  s += `<rect x="${x + w / 2 - 92}" y="${by - 36}" width="184" height="72" rx="36" fill="${C.bg}"/>`;
  s += `<text x="${x + w / 2}" y="${by}" font-size="${fsz}" font-weight="800" fill="${C.dim}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif">${wl}</text>`;
  if (head) {
    const rx = x + w + 56;
    // 정수리·턱 점선 — 사진 관통 + 우측 치수선까지 연장
    s += `<line x1="${x + w * 0.05}" y1="${head.topY}" x2="${rx}" y2="${head.topY}" stroke="${C.headDash}" stroke-width="3.5" stroke-dasharray="14 10"/>`;
    s += `<line x1="${x + w * 0.05}" y1="${head.botY}" x2="${rx}" y2="${head.botY}" stroke="${C.headDash}" stroke-width="3.5" stroke-dasharray="14 10"/>`;
    // 머리높이 치수 — 사진 우측 밖
    s += `<line x1="${rx - cap}" y1="${head.topY}" x2="${rx + cap}" y2="${head.topY}" stroke="${C.head}" stroke-width="${lw}"/>`;
    s += `<line x1="${rx - cap}" y1="${head.botY}" x2="${rx + cap}" y2="${head.botY}" stroke="${C.head}" stroke-width="${lw}"/>`;
    s += `<line x1="${rx}" y1="${head.topY}" x2="${rx}" y2="${head.botY}" stroke="${C.headSoft}" stroke-width="2"/>`;
    const midY = (head.topY + head.botY) / 2;
    s += `<rect x="${rx - 36}" y="${midY - 110}" width="72" height="220" rx="36" fill="${C.bg}"/>`;
    s += `<text x="${rx}" y="${midY}" font-size="${fsz - 4}" font-weight="800" fill="${C.head}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif" transform="rotate(90 ${rx} ${midY})">${head.label}</text>`;
  }
  return s;
}

const TITLE = {
  ko: (c, t) => `${c} ${t} 사진 규격`,
  en: (c, t) => `${c} ${t} Photo Size`,
  ja: (c, t) => `${c} ${t}写真の規格`,
};
const FONT = {
  ko: "'Apple SD Gothic Neo', AppleGothic, sans-serif",
  en: "Helvetica, Arial, sans-serif",
  ja: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif",
};

async function generateOne(spec, lang) {
  const { Wmm, Hmm } = spec.sz;
  const head = spec.headR;
  const headMm = head ? ((head.hi - head.lo) <= 4 ? head.lo : head.lo + (head.hi - head.lo) * 0.35) : Hmm * 0.70;
  const ph = await specPhoto(Wmm, Hmm, headMm);
  const px = Math.round((CANVAS - ph.dispW) / 2), py = PHOTO_TOP;

  // 상단 타이틀 그룹 (국기 + 텍스트) 중앙 정렬
  const country = lang === 'ja' ? (spec.countryJa || spec.country) : lang === 'en' ? (spec.countryEn || spec.country) : spec.country;
  const type = lang === 'ja' ? (spec.typeJa || spec.type) : lang === 'en' ? (spec.typeEn || spec.type) : spec.type;
  const title = TITLE[lang](country, type);
  let fs_ = 48;
  while (fs_ > 26 && estWidth(title, fs_) > 1060 - 100) fs_ -= 2;
  const fl = await flag(spec.iso);
  const textW = estWidth(title, fs_);
  const gap = fl ? 20 : 0, flagW = fl ? fl.w : 0;
  const groupW = flagW + gap + textW;
  const gx = (CANVAS - groupW) / 2, gy = 64; // 밴드 중심선 (컴팩트)
  const overlayParts = [];
  if (fl) overlayParts.push(`<rect x="${gx - 0.5}" y="${gy - fl.h / 2 - 0.5}" width="${fl.w + 1}" height="${fl.h + 1}" rx="6" fill="none" stroke="${C.cardBorder}" stroke-width="1.5"/>`);
  overlayParts.push(`<text x="${gx + flagW + gap}" y="${gy}" font-size="${fs_}" font-weight="800" fill="${C.title}" dominant-baseline="central" font-family="${FONT[lang]}">${esc(title)}</text>`);

  // 하단 브랜드 그룹 (아이콘 + MONKOS.AI) 중앙 정렬
  const brand = 'MONKOS.AI';
  const bfs = 34, bls = 5;
  const brandW = estWidth(brand, bfs) + (brand.length - 1) * bls;
  const bGroupW = 52 + 16 + brandW;
  const bx = (CANVAS - bGroupW) / 2, byC = 1148;
  overlayParts.push(`<text x="${bx + 52 + 16}" y="${byC}" font-size="${bfs}" font-weight="700" fill="${C.brand}" letter-spacing="${bls}" dominant-baseline="central" font-family="Helvetica, Arial, sans-serif">${brand}</text>`);

  overlayParts.push(dimSvg(px, py, ph.dispW, ph.dispH, Wmm, Hmm, head ? {
    topY: py + ph.headTop, botY: py + ph.headBot, label: head.label,
  } : null));

  const base = `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${CANVAS}" height="${CANVAS}" fill="${C.bg}"/>
  </svg>`;
  overlayParts.push(`<rect x="${px + 1}" y="${py + 1}" width="${ph.dispW - 2}" height="${ph.dispH - 2}" fill="none" stroke="${C.photoBorder}" stroke-width="2"/>`);
  const overlay = `<svg width="${CANVAS}" height="${CANVAS}" xmlns="http://www.w3.org/2000/svg">${overlayParts.join('')}</svg>`;
  const layers = [{ input: ph.photo, left: px, top: py }];
  if (fl) layers.push({ input: fl.buf, left: Math.round(gx), top: Math.round(gy - fl.h / 2) });
  layers.push({ input: iconPng, left: Math.round(bx), top: Math.round(byC - 26) });
  layers.push({ input: Buffer.from(overlay), left: 0, top: 0 });
  const out = await sharp(Buffer.from(base)).composite(layers).webp({ quality: 85 }).toBuffer();
  fs.writeFileSync(`${OUT}/${spec.slug}_${lang}.webp`, out);
}

// ── 실행
const only = process.argv[2] ? process.argv[2].split(',') : null; // 샘플 모드: slug 목록
const specs = [];
for (const s of DATA) {
  const sz = parseSize(s.size);
  if (!sz) { console.log('사이즈 파싱 불가 — 스킵:', s.slug, s.size); continue; }
  const m = s.slug.match(/^([a-z]{2})-/);
  specs.push({ slug: s.slug, iso: m ? m[1] : 'us', sz, headR: parseHead(s.headHeight, sz.Hmm), country: s.country, countryEn: s.countryEn, countryJa: s.countryJa, type: s.type, typeEn: s.typeEn, typeJa: s.typeJa });
}
const targets = only ? specs.filter(s => only.includes(s.slug)) : specs;
const t0 = Date.now();
let n = 0;
for (const spec of targets) {
  for (const lang of ['ko', 'en', 'ja']) { await generateOne(spec, lang); n++; }
  if (n % 300 === 0) console.log(`${n}장... (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
console.log(`완료: ${n}장 / ${((Date.now() - t0) / 1000).toFixed(0)}s → ${OUT}`);
