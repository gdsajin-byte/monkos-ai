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
import { saveImages, addWatermark, downloadFromGCS, getSignedUrl } from './gcs-save.js';

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


// === 코칭 시스템 프롬프트 (한국어 네이티브) ===
const COACHING_INSTRUCTIONS = {
  passport: `증명사진 촬영 AI 코치입니다.

[코칭 규칙]
- 한국어 1문장, 15자 이내
- 문제 시 1가지만 지적 (고개 각도, 표정, 조명 등)
- 좋은 상태면 "좋아요!" 또는 "완벽해요!"

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (무표정 또는 자연스러운 미소)
4. 눈썹이 보이는지 (앞머리로 가리면 안됨)
5. 얼굴 라인이 드러나는지 (헤어로 덮으면 안됨)

[세션 규율]
- 인사하지 마세요. 바로 코칭만 시작하세요.
- 이전 대화를 기억하거나 언급하지 마세요.
- 3초 이내에 같은 지적을 반복하지 마세요.
- 프레임이 양호하면 침묵하세요. 할 말이 있을 때만 발화하세요.
- 촬영 준비가 완료되면 반드시 "이제 촬영할게요!" 문구를 포함하세요.
- "이제 촬영할게요!"는 시스템이 자동 촬영을 실행하는 트리거입니다. 확실할 때만 사용하세요.

[금지]
- 자기소개, 잡담, 감상, 질문
- "안녕하세요", "반갑습니다", "도움이 필요하시면" 류 발화`,

  id: `이력서 사진 촬영 AI 코치입니다.

[코칭 규칙]
- 한국어 1문장, 15자 이내
- 문제 시 1가지만 지적 (고개 각도, 표정, 조명 등)
- 좋은 상태면 "좋아요!" 또는 "완벽해요!"

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (자연스럽고 호감가는 미소)
4. 자세 (허리 펴고, 어깨 수평)
5. 헤어와 의상이 깔끔하게 정돈되었는지

[세션 규율]
- 인사하지 마세요. 바로 코칭만 시작하세요.
- 이전 대화를 기억하거나 언급하지 마세요.
- 3초 이내에 같은 지적을 반복하지 마세요.
- 프레임이 양호하면 침묵하세요. 할 말이 있을 때만 발화하세요.
- 촬영 준비가 완료되면 반드시 "이제 촬영할게요!" 문구를 포함하세요.
- "이제 촬영할게요!"는 시스템이 자동 촬영을 실행하는 트리거입니다. 확실할 때만 사용하세요.

[금지]
- 자기소개, 잡담, 감상, 질문
- "안녕하세요", "반갑습니다", "도움이 필요하시면" 류 발화`,
};

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
- Make eyes look intense, strained, or unnaturally wide — keep natural calm eye contact

GOAL: "This is ME, but on my best day" - perfectly front-facing, studio flat lighting, 90% accuracy, 10% professional retouching.`;

// === 스타일 프롬프트 ===
const STYLE_PROMPTS = {
  passport: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',
  id: 'Professional resume photo for Korean job application (이력서), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

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
  gentle_smile: 'relaxed pleasant expression with naturally soft eyes, at ease, quiet warmth in face',
  neutral: 'natural calm resting face with soft relaxed eyes, at ease and composed',
  natural_smile: 'gently pleasant face with warm relaxed eyes, approachable and at ease',
  bright_smile: 'warm friendly expression with bright relaxed eyes, naturally pleasant',
};

const HAIR_PROMPTS = {
  as_is: null,
  tidy: 'neatly groomed hair',
  up: 'hair tied up neatly',
  down: 'hair down, well-groomed',
};

// === v5 프롬프트 빌더 (SCHEMA_v5_확정.md §6 정본) ===
function buildPromptV5(body) {
  const { format, gender, age, clothing, clothingColor,
          suitColor, shirtColor, tieColor, tiePattern,
          hair, bgColor, expression } = body;

  const parts = [];

  // [1] FORMAT (SCHEMA §6-1)
  if (format === 'passport') {
    parts.push('[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. White background mandatory.');
  } else {
    parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height.');
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
    const top = 'collared dress shirt';
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

  // [6] EXPRESSION (표정 — EXPRESSION_PROMPTS 활성화)
  const expr = expression || 'gentle_smile';
  if (EXPRESSION_PROMPTS[expr]) {
    parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
  }

  // [7] CONSTRAINT (SCHEMA §6-6)
  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}


// === 클라이언트 세션 관리 ===
const sessions = new Map();

async function connectGeminiLive(session, clientId, style = 'passport') {
  function flushBuffer() {
    if (session.responseBuffer.trim() && session.ws?.readyState === 1) {
      const text = session.responseBuffer.trim();
      const isReady = /이제\s*촬영할게|완벽|좋아요|좋습니다/.test(text);
      session.ws.send(JSON.stringify({
        type: 'ai-coaching',
        text,
        ready: isReady,
        timestamp: Date.now(),
      }));
      log(`[코칭][${clientId}] ${text}${isReady ? ' [READY]' : ''}`);
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

// === Base64 추출 헬퍼 ===
function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

// === 사전분석 폴백 모델 ===
const PRECHECK_MODELS = ['gemini-2.0-flash'];

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

  for (const model of PRECHECK_MODELS) {
    try {
      log(`[사전분석] 모델 시도: ${model}`);
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
      } catch { /* JSON 파싱 실패 → 다음 모델 */ }
      return { suitable: true, score: 0, raw: text };
    } catch (err) {
      log(`[사전분석][${model}] 실패: ${err.message} → 폴백`);
      if (model === PRECHECK_MODELS[PRECHECK_MODELS.length - 1]) {
        return { suitable: true, score: 0, note: `분석 실패: ${err.message}` };
      }
    }
  }
}

/**
 * @deprecated 2026-03-12 — 크롭앱(crop.html) FaceMesh로 이관. 1주 후 제거 예정.
 * 얼굴 좌표 감지 (Gemini Flash — 서버 자동크롭용)
 */
// const FACE_DETECT_PROMPT = `이 증명사진에서 머리 영역의 좌표를 0~1 비율로 알려주세요. ...`;
// async function detectFace(imageBuffer) { ... }

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
    preCheck: 'active (gemini-2.5-flash)',
  });
});

// 서비스 정보
app.get('/api/info', (req, res) => {
  res.json({
    service: 'MONKOS AI 증명사진',
    domain: 'idphoto-kr.monkos.ai',
    features: ['AI 코칭 (WS)', 'AI 사전분석', 'AI 증명사진 생성'],
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

    if (!body.format || !body.gender || !body.age) {
      return res.status(400).json({ error: '필수값 누락: format, gender, age' });
    }
    const instruction = buildPromptV5(body);

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

    const generatedBase64 = imagePart.inlineData.data;
    const generatedBuffer = Buffer.from(generatedBase64, 'base64');

    // 로그인 유저: GCS 저장 + 워터마크 병렬 → 워터마크본 응답
    // 비로그인: 원본 그대로 응답 (GCS 저장 없음)
    if (bodyUserId) {
      const [{ generatedPath }, watermarkedBuffer] = await Promise.all([
        saveImages(bodyUserId, image, generatedBase64),
        addWatermark(generatedBuffer),
      ]);
      res.json({
        image: `data:image/png;base64,${watermarkedBuffer.toString('base64')}`,
        gcsPath: generatedPath,
      });
    } else {
      res.json({ image: `data:image/png;base64,${generatedBase64}` });
    }
  } catch (err) {
    log(`[API][idgen] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});


// 다운로드 — 보정 원본(노크롭) 반환 + Signed URL (크레딧 70c 1회 차감)
app.post('/api/download', async (req, res) => {
  try {
    const { userId, gcsPath, format } = req.body;
    if (!userId) return res.status(400).json({ error: '로그인 필요' });
    if (!gcsPath) return res.status(400).json({ error: 'gcsPath 필요' });

    if (!gcsPath.startsWith(`service/idphoto/kr/${userId}/`)) {
      return res.status(403).json({ error: '접근 권한 없음' });
    }

    // 크레딧 차감 (70c)
    const creditResult = await useCredits(userId, 'download');
    if (!creditResult.success) {
      return res.status(402).json({
        error: creditResult.error,
        credits: creditResult.credits ?? 0,
      });
    }

    // GCS에서 보정 원본 다운로드 + Signed URL 병렬 발급
    const [buffer, originalUrl] = await Promise.all([
      downloadFromGCS(gcsPath),
      getSignedUrl(gcsPath),
    ]);

    log(`[Download] ${userId} → ${gcsPath} (노크롭 원본)`);
    res.json({
      success: true,
      image: `data:image/png;base64,${buffer.toString('base64')}`,
      originalUrl,
      credits: creditResult.credits,
      format: format || 'passport',
    });
  } catch (err) {
    log(`[API][download] 에러: ${err.message}`, 'ERROR');
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

// 크레딧 환불 (다운로드 실패 등)
app.post('/api/credit/refund', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: '로그인 필요' });
    const result = await refundCredits(req.body.userId, req.body.type || 'download');
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    log(`[API][credit/refund] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});


// === favicon.ico ===
app.get('/favicon.ico', (req, res) => {
  res.sendFile(join(__dirname, 'public/favicon-32.png'));
});

// === sitemap.xml ===
app.get('/sitemap.xml', (req, res) => {
  const base = 'https://idphoto-kr.monkos.ai';
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/',                   priority: '1.0', changefreq: 'weekly',  lastmod: today },
    // /app, /camera, /prep — robots.txt 차단 (촬영 퍼널 중간진입 방지). sitemap에서 제외.
    { loc: '/policy/data',        priority: '0.4', changefreq: 'yearly',  lastmod: '2026-03-08' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>`;
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// === 페이지 라우트 (MPA) ===
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
app.get('/app', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
app.get('/prep', (req, res) => res.sendFile(join(__dirname, 'public/prep.html')));
app.get('/camera', (req, res) => res.sendFile(join(__dirname, 'public/camera.html')));
app.get('/result', (req, res) => res.sendFile(join(__dirname, 'public/result.html')));
app.get('/thankyou', (req, res) => res.sendFile(join(__dirname, 'public/thankyou.html')));
app.get('/charge', (req, res) => res.sendFile(join(__dirname, 'public/charge.html')));
app.get('/policy/data', (req, res) => res.sendFile(join(__dirname, 'public/policy-data.html')));

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
  log(`사전분석: 활성 (gemini-2.5-flash)`);
  log('='.repeat(60));
  log('엔드포인트:');
  log('  GET  /health              — 헬스체크');
  log('  GET  /api/info            — 서비스 정보');
  log('  POST /api/pre-check       — 사전분석 (SPA)');
  log('  POST /api/precheck        — 사전분석 (MPA)');
  log('  POST /api/idgen           — Imagen I2I (9필드)');
  log('  POST /api/credit/use      — 크레딧 차감');

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

    if (msg.type === 'set-format') {
      const val = msg.format;
      session.photoStyle = val === 'id' ? 'id' : 'passport';
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
