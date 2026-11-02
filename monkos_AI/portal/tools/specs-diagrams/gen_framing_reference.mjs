// 업로드 전 추천 화각 레퍼런스 자산 — 마스터 위쪽 흰 캔버스 확장만 수행(인물 픽셀 불변, 헌법 1조 3항)
// 확장량 계산 근거·좌표 정본: lib/framing-overlay.js
//
// gsutil cp gs://monk-ai-images/assets/specs-guides/master/prof_master_white.png /tmp/specs-diagrams/
// node monkos_AI/portal/tools/specs-diagrams/gen_framing_reference.mjs
import sharp from '../../node_modules/sharp/lib/index.js';
import path from 'path';
import { CANVAS_EXTEND_TOP, MASTER_SIZE, REF_CANVAS, REF_ASSET_PATH } from '../../lib/framing-overlay.js';

const PORTAL = path.resolve(import.meta.dirname, '../..');
const SP = process.env.SCRATCH || '/tmp/specs-diagrams';
const MASTER = process.env.MASTER || `${SP}/prof_master_white.png`;
const OUTPUT_WIDTH = 640; // 표시 최대 폭 약 300px × 2배 밀도

const meta = await sharp(MASTER).metadata();
if (meta.width !== MASTER_SIZE.width || meta.height !== MASTER_SIZE.height) {
  console.error(`❌ gen_framing_reference: 마스터 크기 불일치 ${meta.width}×${meta.height} (기대 ${MASTER_SIZE.width}×${MASTER_SIZE.height}) — FACE 좌표 재측정 필요`);
  process.exit(1);
}

const extended = await sharp(MASTER)
  .flatten({ background: '#ffffff' })
  .extend({ top: CANVAS_EXTEND_TOP, background: '#ffffff' })
  .png()
  .toBuffer();

const out = path.join(PORTAL, 'public', REF_ASSET_PATH);
const info = await sharp(extended)
  .resize({ width: OUTPUT_WIDTH })
  .webp({ quality: 84 })
  .toFile(out);

console.log(`✅ ${out} ${info.width}×${info.height} ${Math.round(info.size / 1024)}KB (캔버스 ${REF_CANVAS.width}×${REF_CANVAS.height})`);
if (process.env.EXTENDED_PNG) {
  await sharp(extended).toFile(process.env.EXTENDED_PNG);
}
