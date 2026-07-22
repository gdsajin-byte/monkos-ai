import { GoogleGenAI } from '@google/genai';
import { log } from './shared/config.js';

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';

const imageAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});

const PROFILE_MODEL_MAP = {
  'nano-banana-2':   'gemini-3.1-flash-image',
  'nano-banana-pro': 'gemini-3-pro-image',
};

const PURPOSE_ASPECT_MAP = {
  'linkedin_pro': '1:1',
  'corporate':    '3:4',
  'creative':     '3:4',
  'realtor':      '3:4',
  'dating':       '3:4',
  'linkedin':     '1:1',
  'professional': '3:4',
  'executive':    '3:4',
  'artist':       '3:4',
  'beauty':       '1:1',
  'fitting':      '3:4',
};

const IDENTITY_PRESERVATION_PROFILE = `IDENTITY RULE: 90% SAME PERSON + 10% STYLE ADAPTATION

PRESERVE (90%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- The person must be clearly recognizable as the SAME individual

ADAPT (10% creative freedom):
- Pose and body angle CAN change to match the reference style (3/4 turn, arms crossed, natural lean — all allowed)
- Lighting and mood CAN change to match the reference atmosphere
- Clothing and hair CAN change to match the reference style
- Expression CAN shift to be more natural, confident, or approachable

DO NOT:
- Change gender, ethnicity, or age by more than 2-3 years
- Alter fundamental facial features
- Make them unrecognizable
- Force rigid front-facing pose — allow natural professional poses

GOAL: "This is ME, styled like THAT reference" - face is mine, everything else adapts to the reference style. Natural, confident, professional.`;

function buildHeadshotPrompt(customPrompt) {
  return `${IDENTITY_PRESERVATION_PROFILE}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${customPrompt || 'Generate a professional portrait photo.'}`;
}

function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

export async function generateHeadshot({ image, purpose, model, customPrompt, userId }) {
  if (!image) throw new Error('이미지 필수');

  const base64Data = extractBase64(image);
  const byteLength = Math.ceil(base64Data.length * 3 / 4);
  log(`[Headshot] 입력: ${(byteLength / 1024).toFixed(1)}KB, 모델: ${model || 'nano-banana-pro'}, 용도: ${purpose || 'linkedin_pro'}, 유저: ${userId}`);

  if (byteLength > 7 * 1024 * 1024) {
    throw new Error('이미지가 너무 큽니다 (7MB 이하)');
  }

  const instruction = buildHeadshotPrompt(customPrompt);
  const modelId = PROFILE_MODEL_MAP[model] || PROFILE_MODEL_MAP['nano-banana-pro'];
  const aspectRatio = PURPOSE_ASPECT_MAP[purpose] || '3:4';

  const contentParts = [
    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
    { text: 'Image 1: This is the subject person. Preserve their face and identity.' },
    { text: instruction },
  ];

  const response = await imageAI.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: contentParts }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio },
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
