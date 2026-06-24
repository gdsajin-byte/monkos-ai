import { GoogleGenAI } from '@google/genai';
import { log } from './shared/config.js';

const PROJECT_ID = process.env.PROJECT_ID;

const imageAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
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

function buildPromptV5(body) {
  let { format, gender, age } = body;
  gender = gender || 'm';
  age = age || 'adult';

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
  parts.push(`[SUBJECT] ${SUBJECT_MAP[`${gender}-${age}`] || 'This person is an adult.'}`);
  parts.push('[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.');
  parts.push('[BACKGROUND] pure white (#FFFFFF) background');

  if (age === 'baby') {
    parts.push('[EXPRESSION] Keep the child\'s natural expression exactly as-is.');
  } else {
    parts.push('[EXPRESSION] Natural, relaxed, closed-mouth expression. Lips gently together. Soft calm eyes with quiet warmth — NOT stiff, NOT tense, NOT angry-looking. A subtle pleasant resting face, like a calm passport photo. NO smile, NO teeth showing, but NOT frowning either.');
  }

  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  const identity = (age === 'baby') ? IDENTITY_PRESERVATION_BABY : IDENTITY_PRESERVATION;
  return `${identity}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}

function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

const MODEL_MAP = {
  'nano-banana-2':   'gemini-3.1-flash-image-preview',
  'nano-banana-pro': 'gemini-3-pro-image-preview',
};

export async function generateIdPhoto({ image, format, gender, age, model, userId }) {
  if (!image) throw new Error('이미지 필수');

  const base64Data = extractBase64(image);
  const byteLength = Math.ceil(base64Data.length * 3 / 4);
  const modelId = MODEL_MAP[model] || MODEL_MAP['nano-banana-2'];
  log(`[IDPhoto] 입력: ${(byteLength / 1024).toFixed(1)}KB, 규격: ${format || 'passport'}, 모델: ${modelId}, 유저: ${userId}`);

  if (byteLength > 7 * 1024 * 1024) {
    throw new Error('이미지가 너무 큽니다 (7MB 이하)');
  }

  const instruction = buildPromptV5({ format: format || 'passport', gender, age });

  const response = await imageAI.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
      { text: instruction },
    ]}],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '3:4' },
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
