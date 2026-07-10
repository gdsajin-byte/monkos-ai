#!/usr/bin/env node
/**
 * T1 프롬프트 튜닝 하네스 — 쌍아·작가님 프롬프트 공동 제작용 (2026-07-10 민아 제작)
 *
 * 사용:
 *   cd monkos_AI/portal
 *   CROP_ENGINE_URL=https://monkos-crop-engine-933456016842.asia-northeast3.run.app \
 *   node --env-file=.env tools/t1-prompt-harness.mjs \
 *     --person <매팅본.png> --prompt <프롬프트.txt> [--garment <상품컷.png>] \
 *     [--model nano2|pro] [--out <결과.png>] [--retries 2]
 *
 * 동작: [인물(+의상)] → 나노2 i2i 생성 → cropToSpec 재크롭 → 프레이밍 판정(눈 40~48%) → 이탈 시 재시도.
 * 결과 meta(face/eye/crown)를 stdout에 출력. 규격 안착본만 저장.
 *
 * 프롬프트 제작 실측 지식 (2026-07-10 3라운드 — 반복 금지 목록):
 *  1) 픽셀 잠금형("touch NOTHING else") → 인페인트 동작 유발 (의상만 교체, 조명·피부 미처리)
 *  2) 소프트 허용 어휘("gently reduce") → 입력에 따라 처리 생략 (동작 비일관)
 *  3) 의무 체크리스트형("YOU MUST PERFORM ALL") → 과처리·아티팩트(눈 색 오류 등) 리스크
 *  → 독트린: 인/아웃페인트 지양, 전체 재생성(스튜디오 재촬영 프레임) + 정체성·헤어는 속성 서술.
 *     강도 균형은 구 90/10 프롬프트(idphoto-generate.js IDENTITY_PRESERVATION)가 기준점.
 *  4) 프레이밍 드리프트는 프롬프트로 완전 방지 불가 → 본 하네스의 판정 루프가 프로덕션 가드의 원형.
 */
import { readFileSync, writeFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { cropToSpec } from '../lib/spec-crop.js';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
if (!args.person || !args.prompt) {
  console.error('필수: --person <매팅본> --prompt <프롬프트파일>');
  process.exit(1);
}
const MODEL = (args.model === 'pro') ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
const RETRIES = parseInt(args.retries || '2', 10);
const OUT = args.out || 'harness_result.png';

const ai = new GoogleGenAI({ vertexai: true, project: process.env.PROJECT_ID, location: 'global' });
const parts = [{ inlineData: { mimeType: 'image/png', data: readFileSync(args.person).toString('base64') } }];
if (args.garment) parts.push({ inlineData: { mimeType: 'image/png', data: readFileSync(args.garment).toString('base64') } });
parts.push({ text: readFileSync(args.prompt, 'utf8') });

for (let attempt = 1; attempt <= RETRIES; attempt++) {
  const t = Date.now();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '3:4' } },
  });
  const img = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!img) { console.log(`시도${attempt}: 이미지 미반환 (${res.candidates?.[0]?.finishReason || '?'})`); continue; }
  const crop = await cropToSpec(img.inlineData.data, 'kr-passport');
  const eye = parseFloat(crop.meta?.eyePositionPercent || '0');
  console.log(`시도${attempt}: ${((Date.now() - t) / 1000).toFixed(1)}s | face=${crop.meta?.faceMM}mm eye=${eye}% crown=${crop.meta?.crownMarginMM}mm | 모델=${MODEL}`);
  if (eye >= 40 && eye <= 48) {
    writeFileSync(OUT, Buffer.from(crop.image, 'base64'));
    console.log(`✓ 규격 안착 — 저장: ${OUT}`);
    process.exit(0);
  }
  console.log('  프레이밍 이탈 → 재시도');
}
console.log('✗ 전 시도 프레이밍 이탈 — 미저장');
process.exit(2);
