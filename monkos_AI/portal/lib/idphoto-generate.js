import { GoogleGenAI } from '@google/genai';
import { log } from './shared/config.js';

const OUTFIT_KEEP_CURRENT = 'Keep current clothing as-is. Only ensure it looks neat and tidy.';

const PROJECT_ID = process.env.PROJECT_ID;
const LOCATION = process.env.LOCATION || 'us-central1';

const imageAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});

const regionAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const IDENTITY_PRESERVATION = `IDENTITY RULE: 90% SAME PERSON + 10% ENHANCEMENT

PRESERVE (90%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- The person must be clearly recognizable as the SAME individual

ENHANCE (10% creative freedom):
- Slightly smoother skin, subtle beauty enhancement
- Optimal lighting and flattering angles
- Minor imperfections can be softened
- Make them look their BEST version (not a different person)

DO NOT:
- Change gender, ethnicity, or age by more than 2-3 years
- Alter fundamental facial features
- Make them unrecognizable
- Make eyes look intense, strained, or unnaturally wide — keep natural calm eye contact

GOAL: "This is ME, but on my best day" - perfectly front-facing, studio flat lighting, 90% accuracy, 10% professional retouching.`;

const IDENTITY_PRESERVATION_BABY = `IDENTITY RULE: 95% SAME CHILD + 5% CLEANUP

PRESERVE (95%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- Baby/toddler proportions — chubby cheeks, soft rounded face, baby fat
- The child must be clearly recognizable as the SAME individual
- Current facial expression (mouth open or closed — keep as-is)

CLEANUP (5% — less than adult retouching):
- Studio flat lighting and clean background
- Minor color/exposure correction
- Make them look clean and presentable (not "enhanced")

DO NOT:
- Apply adult-style beauty enhancement or skin smoothing
- Change facial expression or mouth position
- Alter fundamental facial features or baby proportions
- Make the child look older or more mature

GOAL: "This is my baby, looking clean and presentable" - studio lighting, tidy background, 95% accuracy, 5% minimal cleanup only.`;

const EXPRESSION_PROMPTS = {
  gentle_smile: 'relaxed pleasant expression with naturally soft eyes, at ease, quiet warmth in face',
  neutral: 'natural calm resting face with soft relaxed eyes, at ease and composed',
};

// 프레이밍 지시 2종 (2026-07-06): 규격 안착 크롭이 뒤따르는 specs 경로는 'wide' —
// AI가 임의로 타이트하게 잘라버리면 크롭 단계에 여백·어깨 원자재가 없어 규격 안착 불능.
const FRAMING_INSTRUCTIONS = {
  passport: 'Crop/frame to passport format: head centered, face 70-80% of frame height, 3:4 ratio',
  wide: 'Frame as a chest-up portrait: the ENTIRE head fully visible with generous empty space above the hair (about 15% of frame height), both shoulders and upper chest included. The face (chin to top of head) should occupy roughly 45-55% of the frame height. Head horizontally centered.',
};

const ZERO_TOUCH_PROMPT = `[STRICT PASSPORT PHOTO CONVERSION — ZERO MODIFICATION]

You are converting a casual photo into an official passport/ID photo.

YOUR ONLY JOBS:
1. Replace the background with pure white (#FFFFFF)
2. {{FRAMING}}

ABSOLUTELY DO NOT CHANGE:
- Face, skin, features — NOTHING. Not even "enhancement" or "improvement"
- Hair — do not restyle, shorten, lengthen, recolor, or rearrange
- Gender presentation — the person looks exactly as they are
- Age appearance — no aging or de-aging
- Clothing — keep exactly as-is
- Expression — keep exactly as-is (open mouth stays open, smile stays smile)
- Skin tone, texture, blemishes — keep all of it
- Glasses, accessories — keep as-is
- Body shape, posture — keep as-is

Think of this as: CROP + BACKGROUND REMOVAL. Nothing else.
The output must be the SAME PERSON with the SAME APPEARANCE, just on a white background in passport framing.`;

function buildPromptV5(body, model) {
  let { format, gender, age, framing } = body;
  gender = gender || 'm';
  age = age || 'adult';

  if (model === 'gemini-2.5-flash') {
    return ZERO_TOUCH_PROMPT.replace('{{FRAMING}}', FRAMING_INSTRUCTIONS[framing] || FRAMING_INSTRUCTIONS.passport);
  }

  const parts = [];
  parts.push('[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. White background mandatory.');

  const SUBJECT_MAP = {
    'f-baby':  'This person is a baby girl (infant/toddler).',
    'f-child': 'This person is a young girl (child, under 12).',
    'f-teen':  'This person is a teenage girl (13-18).',
    'f-adult': 'This person is an adult woman.',
    'm-baby':  'This person is a baby boy (infant/toddler).',
    'm-child': 'This person is a young boy (child, under 12).',
    'm-teen':  'This person is a teenage boy (13-18).',
    'm-adult': 'This person is an adult man.',
  };
  // 성별 미상 시 단정 금지 — 원본 보존 선언 (2026-07-17 성전환 P0: 'adult man' 선언이 여성 사진을 남성화)
  parts.push(`[SUBJECT] ${SUBJECT_MAP[`${gender}-${age}`] || "Preserve this person's apparent gender and age exactly as shown in the original photo."}`);
  parts.push(`[OUTFIT] ${OUTFIT_KEEP_CURRENT}`);
  parts.push('[BACKGROUND] pure white (#FFFFFF) background');

  if (age === 'baby') {
    parts.push('[EXPRESSION] Keep the child\'s natural expression exactly as-is.');
  } else {
    parts.push('[EXPRESSION] Keep the original facial expression but with mouth closed — lips gently together, no teeth visible. Eyes looking straight at the camera. A gentle soft smile is perfectly fine. Do NOT flatten the expression into a stiff blank face.');
  }

  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  const identity = (age === 'baby') ? IDENTITY_PRESERVATION_BABY : IDENTITY_PRESERVATION;
  return `${identity}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}

// T1 의상 교체 프롬프트 (2026-07-11 v4 확정 — 작가님·쌍아 공동 튜닝)
// 원본 → 나노2(의상+보정+배경+넓은화각) → crop-engine. RunPod 매팅 불필요.
// attireDesc 없을 때 기본값: 성인=정장, 아기=지금 옷 유지 (헌법 1조 3항 — 아기 옷 유지가 원칙)
const OUTFIT_DEFAULT_SUIT = "Replace current clothing with neat, professional dark business attire matching the person's gender presentation in the original photo (e.g., a dark suit with a plain light top, or an equivalent blouse/jacket). Clothing should look natural and properly fitted.";

export function buildT1Prompt(attireDesc, opts) {
  const gender = opts?.gender || '';
  const age = opts?.age || 'adult';
  const SUBJECT_MAP = {
    'f-baby':  'This person is a baby girl (infant/toddler).',
    'f-child': 'This person is a young girl (child, under 12).',
    'f-teen':  'This person is a teenage girl (13-18).',
    'f-adult': 'This person is an adult woman.',
    'm-baby':  'This person is a baby boy (infant/toddler).',
    'm-child': 'This person is a young boy (child, under 12).',
    'm-teen':  'This person is a teenage boy (13-18).',
    'm-adult': 'This person is an adult man.',
  };
  // 성별 미상 시 단정 금지 — 원본 보존 선언 (2026-07-17 성전환 P0)
  const subjectText = SUBJECT_MAP[`${gender}-${age}`] || "Preserve this person's apparent gender and age exactly as shown in the original photo.";
  const identity = (age === 'baby') ? IDENTITY_PRESERVATION_BABY : IDENTITY_PRESERVATION;
  const expression = (age === 'baby')
    ? "[EXPRESSION] Keep the child's natural expression exactly as-is."
    : '[EXPRESSION] Keep the original facial expression but with mouth closed — lips gently together, no teeth visible. Eyes looking straight at the camera. A gentle soft smile is perfectly fine. Do NOT flatten the expression into a stiff blank face.';

  return `${identity}

[IMAGE-TO-IMAGE TRANSFORM]
[FORMAT] Official passport/visa photo. White background mandatory.
[SUBJECT] ${subjectText}
[OUTFIT] ${attireDesc || (age === 'baby' ? OUTFIT_KEEP_CURRENT : OUTFIT_DEFAULT_SUIT)}
[BACKGROUND] pure white (#FFFFFF) background
${expression}
[CONSTRAINT] Keep the person's face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.
[FRAMING] Do NOT crop tightly. Output a WIDE chest-up portrait: the ENTIRE head fully visible with generous empty space above the hair, both shoulders and upper chest included. Leave plenty of margin — the photo will be cropped later by a separate system.`;
}

function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

const MODEL_MAP = {
  'nano-banana-2':   'gemini-3.1-flash-image',
  'nano-banana-pro': 'gemini-3-pro-image',
  'gemini-2.5-flash': 'gemini-2.5-flash-image',
};

const REGIONAL_MODELS = new Set(['gemini-2.5-flash-image']);

export async function generateIdPhoto({ image, format, gender, age, model, userId, framing, promptOverride }) {
  if (!image) throw new Error('이미지 필수');

  const base64Data = extractBase64(image);
  const byteLength = Math.ceil(base64Data.length * 3 / 4);
  const modelId = MODEL_MAP[model] || MODEL_MAP['nano-banana-2'];
  log(`[IDPhoto] 입력: ${(byteLength / 1024).toFixed(1)}KB, 규격: ${format || 'passport'}, 모델: ${modelId}, 유저: ${userId}${promptOverride ? ', T1' : ''}`);

  if (byteLength > 7 * 1024 * 1024) {
    throw new Error('이미지가 너무 큽니다 (7MB 이하)');
  }

  const instruction = promptOverride || buildPromptV5({ format: format || 'passport', gender, age, framing }, model);

  const client = REGIONAL_MODELS.has(modelId) ? regionAI : imageAI;
  const response = await client.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
      { text: instruction },
    ]}],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imagePart?.inlineData) {
    const cand = response.candidates?.[0];
    const finishReason = cand?.finishReason || 'UNKNOWN';
    const blockReason = response.promptFeedback?.blockReason || null;
    const reason = blockReason || finishReason;
    if (blockReason || finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') {
      throw new Error(`안전 정책상 생성이 거부되었습니다 (사유: ${reason})`);
    }
    throw new Error(`이미지 생성 실패 (사유: ${reason})`);
  }

  return imagePart.inlineData.data;
}
