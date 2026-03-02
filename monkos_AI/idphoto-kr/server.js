/**
 * MONKOS AI 증명사진 — idphoto-kr.monkos.ai
 *
 * 한국 시장 특화 AI 증명사진 서비스
 *   a) Gemini Live 코칭 — 촬영 전 실시간 가이드 (한국어)
 *   b) Imagen I2I 생성 — 증명사진 변환 (gemini-3-pro-image-preview)
 *
 * 인증: 하이브리드 (Vertex AI ADC + Google AI Studio API Key)
 * Cloud Run 배포용 (HTTP — SSL은 Cloud Run 처리)
 * 포트: 8080 (Cloud Run 기본)
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://monkos.ai';

/**
 * 구조화된 로깅 (Cloud Logging 호환)
 */
function log(msg, severity = 'INFO', meta = {}) {
  const entry = {
    severity,
    message: msg,
    timestamp: new Date().toISOString(),
    ...meta
  };
  if (process.env.K_SERVICE) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${entry.timestamp}] [${severity}] ${msg}`, meta.error || '');
  }
}

// === 하이브리드 인증 ===
// Live 코칭 → Vertex AI ADC
// Imagen I2I 생성 → Google AI Studio API Key (gemini-3-pro-image-preview는 Vertex AI 미지원)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

log('[Vertex AI] ADC 클라이언트 초기화 (Live)');
log(`[Google AI Studio] Imagen 클라이언트 초기화 (API Key ${GEMINI_API_KEY ? '설정됨' : '미설정'})`);
log(`[Portal API] ${PORTAL_API_URL}`);

// === 크레딧 API 헬퍼 ===
async function useCredits(userId, type) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

async function refundCredits(userId, type) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] 환불 API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

async function grantShareBonus(userId, platform) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/share-bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, platform }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] 공유 보너스 API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

// === 코칭 시스템 프롬프트 (한국어 네이티브) ===
const COACHING_INSTRUCTIONS = {
  id_photo: `몽코스 AI 코치입니다. 여권/증명사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (무표정 또는 자연스러운 미소)
4. 눈썹이 보이는지 (앞머리로 가리면 안됨)
5. 얼굴 라인이 드러나는지 (헤어로 덮으면 안됨)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`,

  resume: `몽코스 AI 코치입니다. 이력서 사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (자연스럽고 호감가는 미소)
4. 자세 (허리 펴고, 어깨 수평)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`,
};
// v5 alias (48시간 후 원본 키 제거)
COACHING_INSTRUCTIONS.passport = COACHING_INSTRUCTIONS.id_photo;
COACHING_INSTRUCTIONS.id = COACHING_INSTRUCTIONS.resume;

// === Imagen 프롬프트 (CF idgen.js 정본) ===
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

GOAL: "This is ME, but on my best day" - perfectly front-facing, studio flat lighting, 90% accuracy, 10% professional retouching.`;

// SPA 호환용 스타일 프롬프트 (기존 /api/generate)
const STYLE_PROMPTS = {
  id_photo: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',
  resume: 'Professional resume photo for Korean job application (이력서), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};
// v5 alias (48시간 후 원본 키 제거)
STYLE_PROMPTS.passport = STYLE_PROMPTS.id_photo;
STYLE_PROMPTS.id = STYLE_PROMPTS.resume;

// SPA 호환용 성별/연령별 의상 프롬프트 (기존 /api/generate)
function getOutfitPrompt(gender, age, style = 'id_photo') {
  const genderLabel = gender === 'female' ? 'female/woman' : 'male/man';
  const ageMap = {
    child: { label: 'young child (under 12)', outfit: gender === 'female'
      ? 'a clean white polo shirt or simple blouse, age-appropriate and neat'
      : 'a clean white polo shirt or simple dress shirt, age-appropriate and neat' },
    teen: { label: 'teenager (13-18)', outfit: gender === 'female'
      ? 'a neat school-style blouse or simple formal top, age-appropriate'
      : 'a clean dress shirt with or without tie, age-appropriate' },
    adult: { label: 'adult', outfit: style === 'resume'
      ? (gender === 'female'
        ? 'a clean white blouse with regular collar under dark navy or black business jacket, simple and professional, no frills'
        : 'a dark navy or black formal business suit with white dress shirt and solid-color subtle tie, clean and professional')
      : (gender === 'female'
        ? 'a professional blouse or women\'s business jacket, formal and clean'
        : 'a clean, dark navy or charcoal formal business suit with white dress shirt and subtle tie') },
  };
  const info = ageMap[age] || ageMap.adult;
  return `SUBJECT: This person is a ${genderLabel}, ${info.label}. OUTFIT: Dress this person in ${info.outfit}. Keep the person's face, hair, and body exactly the same — only ensure appropriate attire. DO NOT change the person's apparent gender or age.`;
}

// === 9필드 퍼널 — CF idgen.js 정본 이식 ===
const BG_PROMPTS = {
  white:  'pure white (#FFFFFF) background',
  blue:   'soft blue (#4A90D9) studio background',
  gray:   'neutral gray (#9CA3AF) studio background',
  beige:  'warm beige (#D4B896) studio background',
  pink:   'soft pink (#F5A0B8) studio background',
  yellow: 'warm yellow (#FBBF24) studio background',
};

const CLOTHING_PROMPTS = {
  as_is: null,
  suit: 'formal business suit',
  shirt: 'clean dress shirt',
  casual: 'smart casual top',
  uniform: 'neat school uniform',
};

const CLOTHING_COLOR_PROMPTS = {
  black: 'black',
  navy: 'dark navy',
  charcoal: 'charcoal gray',
  white: 'white',
  beige: 'beige',
  wine: 'wine/burgundy',
  pastel: 'soft pastel-toned',
};

const TIE_PROMPTS = {
  none: null,
  solid_navy: 'solid navy tie',
  solid_wine: 'solid wine/burgundy tie',
  stripe_blue: 'blue striped tie',
  stripe_navy: 'navy striped tie',
  stripe_wine: 'wine striped regimental tie',
};

const EXPRESSION_PROMPTS = {
  gentle_smile: 'gentle, subtle smile',
  neutral: 'neutral, composed expression',
  natural_smile: 'natural, friendly smile',
  bright_smile: 'bright, confident smile',
};

const HAIR_PROMPTS = {
  as_is: null,
  tidy: 'neatly groomed hair',
  up: 'hair tied up neatly',
  down: 'hair down, well-groomed',
};

const PURPOSE_PROMPTS = {
  passport: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, sharp focus, head straight, symmetric composition, forehead and eyebrows must be visible',
  student_id: 'Student ID photo, perfectly front-facing, clean and neat appearance, symmetric composition',
  employee_id: 'Professional corporate ID photo, perfectly front-facing, business-appropriate appearance, symmetric composition',
  resume: 'Professional resume photo for job application, perfectly front-facing looking directly at camera, business formal, 3:4 ratio, approachable yet professional',
  color_portrait: 'Professional color portrait photo, perfectly front-facing, studio lighting, clean and polished look',
};

function buildPrompt(body) {
  const { style, purpose, gender, age, clothing, clothingColor, tie, hair, background, expression } = body;

  const parts = [];

  // 1. 용도 베이스
  const purposePrompt = PURPOSE_PROMPTS[purpose] || PURPOSE_PROMPTS[style === 'id_photo' ? 'passport' : 'resume'];
  parts.push(`[STYLE] ${purposePrompt}`);

  // 2. 배경
  const bgPrompt = BG_PROMPTS[background] || BG_PROMPTS.white;
  parts.push(`[BACKGROUND] ${bgPrompt}`);

  // 3. 피사체 정보
  const genderLabel = gender === 'female' ? 'female/woman' : 'male/man';
  const ageLabels = { child: 'young child (under 12)', teen: 'teenager (13-18)', adult: 'adult' };
  parts.push(`[SUBJECT] This person is a ${genderLabel}, ${ageLabels[age] || 'adult'}.`);

  // 4. 의상
  if (clothing && clothing !== 'as_is') {
    const clothBase = CLOTHING_PROMPTS[clothing] || clothing;
    const colorMod = clothingColor ? (CLOTHING_COLOR_PROMPTS[clothingColor] || clothingColor) : '';
    const outfitDesc = colorMod ? `${colorMod} ${clothBase}` : clothBase;

    let outfitLine = `[OUTFIT] Dress this person in ${outfitDesc}.`;

    // 여성 셔츠 → 블라우스
    if (gender === 'female' && clothing === 'shirt') {
      outfitLine = `[OUTFIT] Dress this person in a ${colorMod ? colorMod + ' ' : ''}clean blouse, simple and professional.`;
    }

    // 넥타이 (남성 + 정장/셔츠)
    if (tie && tie !== 'none' && gender === 'male') {
      const tieDesc = TIE_PROMPTS[tie];
      if (tieDesc) outfitLine += ` With ${tieDesc}.`;
    }

    parts.push(outfitLine);
  } else {
    parts.push('[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.');
  }

  // 5. 헤어
  if (hair && hair !== 'as_is') {
    const hairDesc = HAIR_PROMPTS[hair];
    if (hairDesc) parts.push(`[HAIR] ${hairDesc}`);
  }

  // 6. 표정
  if (expression) {
    const exprDesc = EXPRESSION_PROMPTS[expression];
    if (exprDesc) parts.push(`[EXPRESSION] ${exprDesc}`);
  }

  // 7. 공통 제약
  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}

// === v5 프롬프트 빌더 (SCHEMA_v5_확정.md §6 정본) ===
function buildPromptV5(body) {
  const { format, gender, age, clothing, clothingColor,
          suitColor, shirtColor, tieColor, tiePattern,
          hair, bgColor } = body;

  const parts = [];

  // [1] FORMAT (SCHEMA §6-1)
  if (format === 'passport') {
    parts.push('[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. Neutral composed expression. White background mandatory.');
  } else {
    parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height. Approachable yet professional expression.');
  }

  // [2] SUBJECT (SCHEMA §6-2 — gender × age = 8조합)
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

  // [3] OUTFIT (SCHEMA §6-3)
  if (!clothing || clothing === 'default') {
    parts.push('[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.');
  } else if (clothing === 'change') {
    parts.push(`[OUTFIT] Dress this child in a clean ${clothingColor || 'white'} top, age-appropriate and neat.`);
  } else if (clothing === 'casual') {
    parts.push(`[OUTFIT] Dress this person in a ${clothingColor || 'beige'} smart casual top, clean and neat.`);
  } else if (clothing === 'suit') {
    const suit = suitColor || 'navy';
    const shirt = shirtColor || 'white';
    let tieClause = '';
    if (tieColor && tieColor !== 'notie') {
      const pattern = tiePattern === 'stripe' ? 'striped' : 'solid';
      tieClause = ` and a ${pattern} ${tieColor} tie`;
    }
    const top = gender === 'f' ? 'blouse' : 'dress shirt';
    parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${top}${tieClause}.`);
  }

  // [4] HAIR (SCHEMA §6-4)
  if (hair && hair !== 'default') {
    const HAIR_MAP = {
      tidy: 'neatly groomed and tidy hair',
      updo: 'hair styled up neatly (updo)',
    };
    if (HAIR_MAP[hair]) parts.push(`[HAIR] ${HAIR_MAP[hair]}`);
  }

  // [5] BACKGROUND (SCHEMA §6-5)
  const BG_MAP = {
    white: 'pure white (#FFFFFF) background',
    gray:  'neutral gray (#9CA3AF) studio background',
    blue:  'soft blue (#4A90D9) studio background',
    beige: 'warm beige (#D4B896) studio background',
  };
  const finalBg = format === 'passport' ? 'white' : (bgColor || 'white');
  parts.push(`[BACKGROUND] ${BG_MAP[finalBg] || BG_MAP.white}`);

  // [6] CONSTRAINT (SCHEMA §6-6)
  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}

// === QC 프롬프트 빌더 (CF qc.js 정본 이식) ===
function buildQCInstruction(gender, age) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const ageMap = { child: '유아~12세', teen: '13~18세', adult: '19세 이상' };
  const ageText = ageMap[age] || '미지정';

  return `2개의 이미지를 비교하고, 2번째 이미지(증명사진)의 품질을 종합 분석해 주세요.
1번째: 원본 (실제 촬영)
2번째: AI 생성물 (증명사진)
사용자 설정: 성별=${genderText}, 연령대=${ageText}

[판정 기준 — 모두 체크 필수]
1. 동일 인물인가? (얼굴 구조, 눈/코/입 비율)
2. 유사도 % (0-100)
3. 아이덴티티 유지 (PASS/FAIL)
4. 성별 일치: 원본 인물의 외형 성별과 생성물이 일치하는가? (설정과 무관하게 원본 기준 판단)
5. 연령대 일치: 원본 인물의 외형 나이대와 생성물이 일치하는가? (아이→어른, 어른→아이 변환 감지)
6. 과도한 보정: 헤어스타일 대폭 변경, 피부 과보정, 얼굴 윤곽 변형, 눈크기 변경 등 부자연스러운 변형이 있는가?
7. 증명사진 품질 (조명, 배경, 구도)
8. 2번째 이미지에서 얼굴의 bounding box 좌표 [ymin, xmin, ymax, xmax] (0-1000 정규화)

[FAIL 조건 — 하나라도 해당되면 identity를 FAIL로 판정]
- 성별 외형이 원본과 다르게 변환됨
- 연령대가 원본과 크게 달라짐 (10세 이상 차이 추정)
- 얼굴 윤곽, 눈크기, 코 형태 등이 원본과 다르게 변형됨
- 헤어스타일이 원본과 완전히 다름 (정돈 수준은 허용)
- similarity 70% 미만

[응답 형식 — JSON만 출력]
{
  "same_person": true,
  "similarity": 85,
  "identity": "PASS",
  "gender_match": true,
  "age_match": true,
  "over_retouched": false,
  "quality": "GOOD",
  "face_box": [180, 220, 650, 780],
  "face_ratio": 0.35,
  "face_center_x": 500,
  "head_top_margin": 80,
  "note": "한줄 코멘트"
}

face_ratio = 얼굴 높이 / 전체 이미지 높이 (0.25~0.45 적합)
face_center_x = 얼굴 중심 x좌표 (500 근처면 중앙 정렬, ±50 허용)
head_top_margin = 머리 정수리에서 이미지 상단까지 여백 (40~150 적합)`;
}

// === 클라이언트 세션 관리 ===
const sessions = new Map();

async function connectGeminiLive(session, clientId, style = 'passport') {
  function flushBuffer() {
    if (session.responseBuffer.trim() && session.ws?.readyState === 1) {
      session.ws.send(JSON.stringify({
        type: 'ai-coaching',
        text: session.responseBuffer.trim(),
        timestamp: Date.now(),
      }));
      log(`[코칭][${clientId}] ${session.responseBuffer.trim()}`);
    }
    session.responseBuffer = '';
    session.bufferFlushTimer = null;
  }

  try {
    session.gemini = await ai.live.connect({
      model: 'gemini-2.0-flash-live-preview-04-09',
      config: {
        responseModalities: ['TEXT'],
        systemInstruction: { parts: [{ text: COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.passport }] },
      },
      callbacks: {
        onopen: () => log(`[Gemini Live][${clientId}] 연결 완료`),
        onclose: (e) => {
          log(`[Gemini Live][${clientId}] 연결 종료: ${e?.code || 'unknown'}`);
          session.gemini = null;
        },
        onerror: (e) => log(`[Gemini Live][${clientId}] 에러: ${e?.message || e}`),
        onmessage: (msg) => {
          if (msg?.serverContent?.turnComplete) {
            if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
            flushBuffer();
            return;
          }
          const parts = msg?.serverContent?.modelTurn?.parts;
          if (parts) {
            const text = parts.filter(p => p.text).map(p => p.text).join('');
            if (text) {
              session.responseBuffer += text;
              if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
              session.bufferFlushTimer = setTimeout(flushBuffer, 600);
            }
          }
        },
      },
    });
    log(`[Gemini Live][${clientId}] 세션 초기화 완료`);
  } catch (err) {
    log(`[Gemini Live][${clientId}] 세션 실패: ${err.message}`);
  }
}

// === Imagen I2I 생성 (SPA 호환 — Google AI Studio SDK) ===
function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

async function generatePhoto(inputBase64, style = 'passport', gender = 'f', age = 'adult') {
  const base64Data = extractBase64(inputBase64);
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.passport;
  const outfitPrompt = getOutfitPrompt(gender, age, style);
  const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}\n\n${outfitPrompt}`;

  const response = await imagenAI.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: instruction },
      ],
    },
    config: {
      imageConfig: { aspectRatio: '3:4' },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error('이미지 생성 실패: 응답에 이미지 없음');

  return `data:image/png;base64,${part.inlineData.data}`;
}

// === 사전분석 (SPA 호환 — Gemini 2.0 Flash via Vertex AI ADC) ===
const PRE_CHECK_INSTRUCTION = `이 사진이 증명사진 원본으로 적합한지 분석해 주세요.

[체크 항목]
1. 얼굴 감지: 얼굴이 1개 명확하게 보이는가?
2. 정면성: 정면을 보고 있는가? (좌우 기울기, 고개 숙임/들림)
3. 조명: 얼굴에 심한 그림자나 역광이 없는가?
4. 선명도: 흔들림 없이 선명한가?
5. 얼굴 크기: 프레임 대비 얼굴이 충분히 큰가? (최소 20%)
6. 표정: 무표정 또는 자연스러운 미소인가?
7. 눈: 눈을 감지 않았는가?

[응답 형식 — JSON만 출력]
{
  "suitable": true,
  "score": 85,
  "face_detected": true,
  "issues": [],
  "suggestion": "한줄 조언"
}

suitable: 증명사진 생성 가능 여부 (true/false)
score: 종합 점수 (0-100, 70 이상이면 suitable=true)
issues: 문제 목록 (빈 배열이면 문제 없음)
suggestion: 사용자에게 보여줄 한줄 한국어 조언`;

async function runPreCheck(imageBase64) {
  const data = extractBase64(imageBase64);
  const model = 'gemini-2.0-flash';

  try {
    log(`[사전분석] 모델: ${model}`);
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data } },
          { text: PRE_CHECK_INSTRUCTION },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    log(`[사전분석][${model}] 응답: ${text.substring(0, 300)}`);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* JSON 파싱 실패 */ }
    return { suitable: true, score: 0, raw: text };
  } catch (err) {
    log(`[사전분석][${model}] 실패: ${err.message}`);
    return { suitable: true, score: 0, note: `분석 실패: ${err.message}` };
  }
}

// =============================================
// Express 앱
// =============================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 보안 헤더
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  next();
});

// === API 라우트 ===

// 헬스체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'monkos-idphoto-kr',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    auth: 'Hybrid (ADC + API Key)',
    geminiLive: 'ready (ADC)',
    imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
    preCheck: 'active (gemini-2.0-flash)',
  });
});

// 서비스 정보
app.get('/api/info', (req, res) => {
  res.json({
    service: 'MONKOS AI 증명사진',
    domain: 'idphoto-kr.monkos.ai',
    features: ['AI 코칭 (WS)', 'AI 사전분석', 'AI 증명사진 생성', 'AI QC 검증'],
    styles: Object.keys(STYLE_PROMPTS),
  });
});

// 사전분석 — SPA 호환 (하이픈, Vertex AI ADC)
app.post('/api/pre-check', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '이미지 필요' });
    const result = await runPreCheck(req.body.image);
    res.json(result);
  } catch (err) {
    log(`[API][pre-check] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// 사전분석 — MPA용 (연결, Vertex AI ADC)
app.post('/api/precheck', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '이미지가 필요합니다' });
    const result = await runPreCheck(req.body.image);
    res.json(result);
  } catch (err) {
    log(`[API][precheck] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// I2I 생성 — SPA 호환 (SDK, 크레딧 체크 포함)
app.post('/api/generate', async (req, res) => {
  let bodyUserId = null;
  try {
    const body = req.body;
    bodyUserId = body.userId;
    if (!body.image) return res.status(400).json({ error: '이미지 필요' });

    // 이미지 사이즈 검증 (2MB 상한)
    const base64Raw = extractBase64(body.image);
    const imageSize = Math.ceil(base64Raw.length * 0.75);
    if (imageSize > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지 크기가 2MB를 초과합니다' });
    }

    // 크레딧 체크 및 차감
    if (body.userId) {
      const creditResult = await useCredits(body.userId, 'generate');
      if (!creditResult.success) {
        return res.status(402).json({
          error: creditResult.error,
          credits: creditResult.credits ?? 0,
          required: 10,
        });
      }
      log(`[Credits] 생성 차감: ${body.userId} → ${creditResult.credits}c`);
    }

    log(`[Imagen] 생성 요청: style=${body.style}, gender=${body.gender || 'male'}, age=${body.age || 'adult'}`);
    const image = await generatePhoto(body.image, body.style, body.gender, body.age);
    res.json({ image });
  } catch (err) {
    log(`[API][generate] 에러: ${err.message}`, 'ERROR');
    // 생성 실패 시 크레딧 환불
    if (bodyUserId) {
      try {
        const refund = await refundCredits(bodyUserId, 'generate');
        if (refund.success) log(`[Credits] 생성 실패 환불: ${bodyUserId}`);
      } catch {}
    }
    res.status(500).json({ error: err.message });
  }
});

// I2I 생성 — MPA용 (9필드 CF 정본, raw fetch, 크레딧 체크 포함)
app.post('/api/idgen', async (req, res) => {
  let bodyUserId = null;
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API 키 미설정' });

    const body = req.body;
    const { image, userId } = body;
    bodyUserId = userId;
    if (!image) return res.status(400).json({ error: '이미지가 필요합니다' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    log(`[idgen] 입력 이미지: base64=${base64Data.length}chars, bytes=${byteLength}, KB=${(byteLength/1024).toFixed(1)}`);
    if (byteLength > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지가 너무 큽니다 (2MB 이하)' });
    }

    // 크레딧 차감
    if (userId) {
      const creditResult = await useCredits(userId, 'generate');
      if (!creditResult.success) {
        return res.status(402).json({
          error: creditResult.error,
          credits: creditResult.credits ?? 0,
          required: 10,
        });
      }
      log(`[Credits] idgen 차감: ${userId} → ${creditResult.credits}c`);
    } else {
      log(`[FREE-GEN] ip=${req.headers['x-forwarded-for'] || req.ip} t=${Date.now()}`);
    }

    // v5 버전 분기 (SCHEMA §9 — 48시간 하위호환)
    const schemaVersion = body.v || 4;
    if (schemaVersion >= 5) {
      if (!body.format || !body.gender || !body.age) {
        return res.status(400).json({ error: 'v5 필수값 누락: format, gender, age' });
      }
    }
    const instruction = schemaVersion >= 5
      ? buildPromptV5(body)
      : buildPrompt(body);  // 48시간 후 제거

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: instruction },
          ]}],
          generationConfig: { imageConfig: { aspectRatio: '3:4' } },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let detail = '';
      try { detail = JSON.parse(errorText)?.error?.message || errorText.substring(0, 200); } catch { detail = errorText.substring(0, 200); }
      // 생성 실패 시 크레딧 환불
      if (bodyUserId) await refundCredits(bodyUserId, 'generate');
      throw new Error(`API ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) {
      if (bodyUserId) await refundCredits(bodyUserId, 'generate');
      throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
    }

    res.json({ image: `data:image/png;base64,${imagePart.inlineData.data}` });
  } catch (err) {
    log(`[API][idgen] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// QC 검증 — MPA용 (Vertex AI ADC)
app.post('/api/qc', async (req, res) => {
  try {
    const { original, generated, gender = 'male', age = 'adult' } = req.body;
    if (!original || !generated) {
      return res.status(400).json({ error: '원본과 생성 이미지 모두 필요합니다' });
    }

    const origBase64 = original.includes(',') ? original.split(',')[1] : original;
    const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;

    const instruction = buildQCInstruction(gender, age);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'image/png', data: origBase64 } },
        { inlineData: { mimeType: 'image/png', data: genBase64 } },
        { text: instruction },
      ]}],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let result;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else result = { identity: 'ERROR', note: 'QC 분석 파싱 실패' };
    } catch {
      result = { identity: 'ERROR', note: 'QC 분석 파싱 실패' };
    }

    res.json(result);
  } catch (err) {
    log(`[API][qc] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// 크레딧 차감
app.post('/api/credit/use', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: '로그인 필요' });
    const result = await useCredits(req.body.userId, req.body.type || 'download');
    res.status(result.success ? 200 : 402).json(result);
  } catch (err) {
    log(`[API][credit/use] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// 공유 보너스
app.post('/api/credit/share-bonus', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: '로그인 필요' });
    const result = await grantShareBonus(req.body.userId, req.body.platform);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    log(`[API][credit/share-bonus] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// === 페이지 라우트 (MPA) ===
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
app.get('/app', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
app.get('/prep', (req, res) => res.sendFile(join(__dirname, 'public/prep.html')));
app.get('/camera', (req, res) => res.sendFile(join(__dirname, 'public/camera.html')));
app.get('/result', (req, res) => res.sendFile(join(__dirname, 'public/result.html')));
app.get('/thankyou', (req, res) => res.sendFile(join(__dirname, 'public/thankyou.html')));
app.get('/charge', (req, res) => res.sendFile(join(__dirname, 'public/charge.html')));

// 정적 파일 서빙 (JS/CSS 캐시 방지 — 모바일 브라우저 강제 갱신)
app.use(express.static(join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  }
}));

// === 서버 시작 + WebSocket ===
const httpServer = app.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS AI 증명사진 (KR) — Express 서버 시작');
  log('='.repeat(60));
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`리전: ${LOCATION}`);
  log(`인증: 하이브리드 (ADC + API Key)`);
  log(`Imagen I2I: 활성 (gemini-3-pro-image-preview, API Key)`);
  log(`사전분석: 활성 (gemini-2.0-flash)`);
  log('='.repeat(60));
  log('엔드포인트:');
  log('  GET  /health              — 헬스체크');
  log('  GET  /api/info            — 서비스 정보');
  log('  POST /api/pre-check       — 사전분석 (SPA)');
  log('  POST /api/precheck        — 사전분석 (MPA)');
  log('  POST /api/generate        — Imagen I2I (SPA)');
  log('  POST /api/idgen           — Imagen I2I (MPA, 9필드)');
  log('  POST /api/qc              — QC 검증 (MPA)');
  log('  POST /api/credit/use      — 크레딧 차감');
  log('  POST /api/credit/share-bonus — 공유 보너스');
  log('  GET  /                    — 랜딩페이지');
  log('  GET  /app                 — 촬영 앱 (SPA)');
  log('  GET  /prep                — 준비 (MPA)');
  log('  GET  /camera              — 촬영 (MPA)');
  log('  GET  /result              — 결과 (MPA)');
  log('  GET  /thankyou            — 수령 (MPA)');
  log('  WS   /                    — WebSocket (코칭 전용)');
  log('='.repeat(60));
});

// === WebSocket (코칭 전용 — 촬영실에서만 연결) ===
const wss = new WebSocketServer({ server: httpServer });
let clientCounter = 0;

wss.on('connection', async (ws) => {
  const clientId = `c${++clientCounter}`;
  log(`[WS][${clientId}] 코칭 세션 연결`);

  const session = { gemini: null, frameCount: 0, responseBuffer: '', bufferFlushTimer: null, ws, photoStyle: 'passport' };
  sessions.set(clientId, session);

  ws.on('message', async (data, isBinary) => {
    // 바이너리 = JPEG 프레임 → Gemini Live 코칭
    if (isBinary) {
      if (!session.gemini) {
        await connectGeminiLive(session, clientId, session.photoStyle);
        log(`[코칭][${clientId}] Gemini Live 지연 생성 (style=${session.photoStyle})`);
      }
      try {
        const base64 = Buffer.from(data).toString('base64');
        await session.gemini.sendRealtimeInput({
          media: { data: base64, mimeType: 'image/jpeg' },
        });
        session.frameCount++;
        if (session.frameCount % 5 === 1) {
          log(`[프레임][${clientId}] #${session.frameCount} (${data.length}B)`);
        }
        if (session.frameCount % 5 === 0) {
          await session.gemini.sendClientContent({ turnComplete: true });
        }
      } catch (err) {
        log(`[프레임 전송 에러][${clientId}] ${err.message}`);
      }
      return;
    }

    // 텍스트 = JSON 커맨드 (코칭 관련만)
    let msg;
    try {
      const raw = Buffer.isBuffer(data) ? data.toString() : data;
      msg = JSON.parse(raw);
    } catch { return; }

    if (msg.type === 'set-format' || msg.type === 'set-style') {
      const val = msg.format || msg.style;
      session.photoStyle = (val === 'id' || val === 'resume') ? 'id' : 'passport';
      log(`[포맷][${clientId}] ${session.photoStyle}`);
      return;
    }

    if (msg.type === 'stop-coaching') {
      log(`[코칭][${clientId}] 세션 중지`);
      if (session.gemini) {
        try { session.gemini.close(); } catch {}
        session.gemini = null;
      }
      if (session.bufferFlushTimer) {
        clearTimeout(session.bufferFlushTimer);
        session.bufferFlushTimer = null;
      }
      session.responseBuffer = '';
      return;
    }

    if (msg.type === 'restart-coaching') {
      log(`[코칭][${clientId}] 세션 재시작`);
      session.frameCount = 0;
      if (session.gemini) {
        try { session.gemini.close(); } catch {}
        session.gemini = null;
      }
      await connectGeminiLive(session, clientId, session.photoStyle);
      return;
    }
  });

  ws.on('close', () => {
    log(`[WS][${clientId}] 코칭 세션 종료`);
    if (session.gemini) {
      try { session.gemini.close(); } catch {}
    }
    if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
    sessions.delete(clientId);
  });
});
