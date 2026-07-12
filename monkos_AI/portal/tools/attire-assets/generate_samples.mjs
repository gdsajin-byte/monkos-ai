/**
 * 의상 프리셋 상품컷 생성기 — 고스트 마네킹 t2i (나노2)
 *
 * 정본 설계: monkos-ops/tech/designs/2026-07/DESIGN_20260712_공유의상피커_종합설계.md §5, §10 v1.5
 * 데이터: public/components/attire-picker/attire-presets.json 의 attire_desc에서 의상 묘사를 파생.
 *
 * 실행 (portal 디렉토리에서, Vertex ADC):
 *   PROJECT_ID=monkos node tools/attire-assets/generate_samples.mjs --ids m_suit_charcoal_single_01,... [--out DIR]
 *   --ids 생략 시 thumbnail이 비어 있는 active 아이템 전부.
 *
 * 산출: {out}/{id}.png (1024급 3:4) — 검수 통과분만 GCS assets/attire/ 적재 + 썸네일 제작.
 */
import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRESETS = join(__dirname, '../../public/components/attire-picker/attire-presets.json');

const args = process.argv.slice(2);
const argVal = (k) => { const i = args.indexOf(k); return i === -1 ? null : args[i + 1]; };
const outDir = resolve(argVal('--out') || join(__dirname, 'out'));
const onlyIds = argVal('--ids') ? argVal('--ids').split(',').map(s => s.trim()) : null;

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.PROJECT_ID || 'monkos',
  location: 'global',
});
const MODEL = 'gemini-3.1-flash-image-preview'; // nano-banana-2 (MODEL_MAP 정본과 동일)

// attire_desc → 의상 묘사 구절만 추출 ("Replace current clothing with a ..." 접두/핏 문장 제거)
function outfitPhrase(attireDesc) {
  return attireDesc
    .replace(/^Replace current clothing with\s*/i, '')
    .replace(/\s*Clothing must look natural and properly fitted\.?\s*$/i, '')
    .replace(/\.\s*$/, '');
}

function buildPrompt(item) {
  const phrase = outfitPhrase(item.attire_desc);
  const wear = item.tags.gender === 'f' ? "women's" : "men's";
  return `Professional e-commerce product photograph of ${phrase}, presented as ${wear} apparel using the invisible ghost mannequin technique.
Front view, upper-torso framing (collar to mid-chest emphasis) as it would appear in an ID photo crop.
Pure white seamless background (#FFFFFF). Soft, even studio lighting with no harsh shadows.
STRICT: no person, no head, no face, no hands, no visible mannequin, no hanger, no text, no logo.
Crisp fabric texture, natural drape, properly filled shoulders (invisible-body effect), commercial catalog quality.`;
}

async function generate(item) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: buildPrompt(item) }] }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '3:4' },
    },
  });
  const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part?.inlineData) {
    const reason = res.promptFeedback?.blockReason || res.candidates?.[0]?.finishReason || 'UNKNOWN';
    throw new Error(`생성 실패 (${reason})`);
  }
  return Buffer.from(part.inlineData.data, 'base64');
}

const data = JSON.parse(readFileSync(PRESETS, 'utf8'));
const targets = data.items.filter(it =>
  onlyIds ? onlyIds.includes(it.id) : (it.active && !it.thumbnail)
);
if (!targets.length) { console.log('대상 없음'); process.exit(0); }

mkdirSync(outDir, { recursive: true });
console.log(`대상 ${targets.length}종 → ${outDir}`);
for (const item of targets) {
  const t0 = Date.now();
  try {
    const buf = await generate(item);
    const file = join(outDir, `${item.id}.png`);
    writeFileSync(file, buf);
    console.log(`✅ ${item.id} — ${(buf.length / 1024).toFixed(0)}KB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(`❌ ${item.id} — ${e.message}`);
  }
}
