/**
 * MONKOS AI 증명사진 — idphoto-kr.monkos.ai
 *
 * 한국 시장 특화 AI 증명사진 서비스
 *   a) 촬영 준비 판정 — 클라이언트 코드(capture-gate.js). Gemini Live 코칭은 2026-09-29 제거
 *   b) Imagen I2I 생성 — 증명사진 변환 (gemini-3-pro-image)
 *
 * 인증: 하이브리드 (Vertex AI ADC + Google AI Studio API Key)
 * Cloud Run 배포용 (HTTP — SSL은 Cloud Run 처리)
 * 포트: 8080 (Cloud Run 기본)
 */

import express from 'express';
import cors from 'cors';
// (2026-09-29) WebSocket 코칭 제거 — 촬영 준비 판정은 클라이언트 capture-gate.js. DESIGN_20260929 참조
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHmac, timingSafeEqual } from 'crypto';
import { readFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { saveImages, addWatermark, downloadFromGCS, getSignedUrl } from './gcs-save.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const REQUIRED_ENV = ['PROJECT_ID'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`필수 환경변수 ${key} 미설정`);
}
const PROJECT_ID = process.env.PROJECT_ID;
const LOCATION = process.env.LOCATION || 'us-central1';
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://monkos.ai';
// 토스 클라이언트 키 치환 토큰 (2026-07-25) — 정적 파일에 박힌 자리표시자. 키 값이 아니다.
const TOSS_CLIENT_KEY_TOKEN = '__TOSS_CLIENT_KEY__';

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

// === Vertex AI ADC 통합 인증 ===
// gemini-3-pro-image Vertex AI 등록 확인 (2026-06-19, 07-22 GA 전환)
// AI Studio API Key 의존 제거 → 전 모델 Vertex AI ADC로 통합

// 텍스트 전용. Gemini 3.x 텍스트 GA 모델은 global 로케이션에만 배치된다(2026-10-22 실호출 실측 —
// us-central1은 gemini-3.5-flash 404). 2.5 이전(Google 통지 10-20 기한)으로 global 전환.
const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});
const TEXT_MODEL = 'gemini-3.5-flash';

const imageAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});

log('[Vertex AI] ADC 클라이언트 초기화 (Live + Image)');
log(`[Portal API] ${PORTAL_API_URL}`);

// === 인증 토큰 검증 (portal config.js 동일 로직) ===
const AUTH_SECRET = process.env.AUTH_SECRET || '';
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const localAuthSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET;

function verifySessionToken(token) {
  if (!localAuthSecret || !token) return null;
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [userId, expiresStr, sig] = parts;
    const expires = parseInt(expiresStr, 10);
    const hmac = createHmac('sha256', localAuthSecret);
    hmac.update(`${userId}:${expiresStr}`);
    const expectedSig = hmac.digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
    if (Date.now() > expires) return null;
    return { userId, expires };
  } catch { return null; }
}

function getSessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/monkos_session=([^;]+)/);
  return match ? match[1] : null;
}

// === 크레딧 API 헬퍼 ===
async function useCredits(userId, type, cookieHeader) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (cookieHeader) headers['Cookie'] = cookieHeader;
    const response = await fetch(`${PORTAL_API_URL}/api/credits/use`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

async function refundCredits(userId, type, cookieHeader) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (cookieHeader) headers['Cookie'] = cookieHeader;
    const response = await fetch(`${PORTAL_API_URL}/api/credits/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] 환불 API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}
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
// === Base64 추출 헬퍼 ===
function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

// === 텍스트 호출 가드 (ORDER_20261022 Gemini35_타임아웃가드) ===
// 3.5-flash@global 실측(10-22): 이미지 사전분석 dev 18콜 3.3~10.9s(p95 ≈ 11s), 이상 사례 약 60콜 중 429 1·200s+ 2.
// 호출당 15s 상한. 초과·429는 재시도·폴백 없이 즉시 '사전분석 생략' — 고객 생성 흐름을 막지 않는다(과금·생성권 규칙 불변).
const PRECHECK_TIMEOUT_MS = 15000;
const IS_DEV_SERVICE = (process.env.K_SERVICE || '').endsWith('-dev');
function textGuardReason(err) {
  // SDK가 송신 중 중단을 'exception AbortError: … sending request' 일반 Error로 감싸 올리는 경우가 있어 메시지도 본다(10-22 실측)
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError' || /AbortError|TimeoutError|aborted/i.test(err?.message || '')) return 'timeout';
  if (err?.status === 429 || /\b429\b|RESOURCE_EXHAUSTED/.test(err?.message || '')) return '429';
  return null;
}
// dev 전용 강제 타임아웃 시험 — X-Precheck-Timeout-Ms 헤더 (prod는 무시)
function precheckTimeoutFor(req) {
  const v = Number(req.get('x-precheck-timeout-ms'));
  return IS_DEV_SERVICE && v > 0 ? v : PRECHECK_TIMEOUT_MS;
}

// === 사전분석 폴백 모델 ===
const PRECHECK_MODELS = [TEXT_MODEL, 'gemini-3.5-flash-lite'];

// === 사전분석 (SPA 호환 — Vertex AI ADC) ===
const PRE_CHECK_INSTRUCTION = `이 사진이 증명사진 AI 생성의 원본으로 사용 가능한지 판단해 주세요.

중요: 이것은 최종 증명사진이 아닌 AI 생성의 입력 원본입니다. 완벽하지 않아도 AI가 보정할 수 있으므로 관대하게 판정하세요. 명백한 결격(얼굴 미감지, 심한 흔들림, 눈 감음)만 불합격으로 처리합니다.

[체크 항목]
1. 얼굴 감지: 얼굴이 1개 보이는가?
2. 정면성: 대략 정면인가? (약간의 기울기는 허용)
3. 선명도: 얼굴을 식별할 수 있을 정도로 선명한가?
4. 눈: 눈을 감지 않았는가?

[응답 형식 — JSON만 출력]
{
  "suitable": true,
  "score": 85,
  "face_detected": true,
  "issues": [],
  "suggestion": "한줄 조언"
}

suitable: AI 생성 입력으로 사용 가능 여부 (true/false). 명백한 결격이 없으면 true.
score: 종합 점수 (0-100, 60 이상이면 suitable=true)
issues: 명백한 결격만 기재 (빈 배열이면 문제 없음)
suggestion: 사용자에게 보여줄 한줄 한국어 조언`;

async function runPreCheck(imageBase64, timeoutMs = PRECHECK_TIMEOUT_MS) {
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
          abortSignal: AbortSignal.timeout(timeoutMs),
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
      const reason = textGuardReason(err);
      if (reason) {
        log(`[Precheck-Skip] reason=${reason} model=${model}`, 'WARNING');
        return { suitable: true, score: 0, skipped: true, reason, note: '사전분석 생략' };
      }
      log(`[사전분석][${model}] 실패: ${err.message} → 폴백`);
      if (model === PRECHECK_MODELS[PRECHECK_MODELS.length - 1]) {
        return { suitable: true, score: 0, note: '분석 실패' };
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
    timestamp: new Date().toISOString(),
  });
});

// 서비스 정보
app.get('/api/info', (req, res) => {
  res.json({
    service: 'MONKOS AI 증명사진',
    domain: 'idphoto-kr.monkos.ai',
    features: ['AI 코칭 (WS)', 'AI 사전분석', 'AI 증명사진 생성'],
  });
});

// 사전분석 — SPA 호환 (하이픈, Vertex AI ADC)
app.post('/api/pre-check', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '이미지 필요' });
    const result = await runPreCheck(req.body.image, precheckTimeoutFor(req));
    res.json(result);
  } catch (err) {
    log(`[API][pre-check] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
});

// 사전분석 — MPA용 (연결, Vertex AI ADC)
app.post('/api/precheck', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '이미지가 필요합니다' });
    const result = await runPreCheck(req.body.image, precheckTimeoutFor(req));
    res.json(result);
  } catch (err) {
    log(`[API][precheck] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
});

// I2I 생성 — MPA용 (9필드 CF 정본, raw fetch, 크레딧 체크 포함)
app.post('/api/idgen', async (req, res) => {
  let bodyUserId = null;
  try {
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
      const creditResult = await useCredits(userId, 'generate', req.headers.cookie);
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

    const response = await imageAI.models.generateContent({
      model: 'gemini-3-pro-image',
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
      if (bodyUserId) await refundCredits(bodyUserId, 'generate', req.headers.cookie);
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
    res.status(500).json({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
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
    const creditResult = await useCredits(userId, 'download', req.headers.cookie);
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
    res.status(500).json({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
});

// 크레딧 차감
app.post('/api/credit/use', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: '로그인 필요' });
    const token = getSessionCookie(req.headers.cookie);
    const session = verifySessionToken(token);
    if (!session || session.userId !== req.body.userId) {
      return res.status(403).json({ error: '인증 필요' });
    }
    const result = await useCredits(req.body.userId, req.body.type || 'download', req.headers.cookie);
    res.status(result.success ? 200 : 402).json(result);
  } catch (err) {
    log(`[API][credit/use] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
});

// 크레딧 환불 (다운로드 실패 등)
app.post('/api/credit/refund', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: '로그인 필요' });
    const token = getSessionCookie(req.headers.cookie);
    const session = verifySessionToken(token);
    if (!session || session.userId !== req.body.userId) {
      return res.status(403).json({ error: '인증 필요' });
    }
    const result = await refundCredits(req.body.userId, req.body.type || 'download', req.headers.cookie);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    log(`[API][credit/refund] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
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

// === /config.js — 토스 클라이언트 키 치환 주입 (2026-07-25) ===
// ⚠️ express.static보다 반드시 위에 등록. 순서가 뒤바뀌면 static이 플레이스홀더 원본을 먼저 내보낸다.
app.get('/config.js', (req, res) => {
  try {
    let js = readFileSync(join(__dirname, 'public/config.js'), 'utf8');
    const tossClientKey = process.env.TOSS_CLIENT_KEY || '';
    if (js.includes(TOSS_CLIENT_KEY_TOKEN)) {
      if (!tossClientKey) {
        log('🚨 TOSS_CLIENT_KEY 미주입 — 결제 위젯이 뜨지 않습니다', 'ERROR');
      }
      js = js.split(TOSS_CLIENT_KEY_TOKEN).join(tossClientKey);
    } else {
      log('🚨 config.js에 TOSS 키 플레이스홀더가 없습니다 — 치환 배선 확인 필요', 'ERROR');
    }
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(js);
  } catch (err) {
    log(`[config.js] 서빙 실패: ${err.message}`, 'ERROR');
    res.status(500).type('application/javascript').send('// config.js 로드 실패');
  }
});

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
  log(`Imagen I2I: 활성 (gemini-3-pro-image, API Key)`);
  log(`사전분석: 활성 (${PRECHECK_MODELS.join(' → ')} @global)`);
  // 2026-07-25: 클라이언트 키는 /config.js 서빙 시 치환 주입 — 미주입이면 위젯이 조용히 안 뜬다(무음 강등 금지)
  const tossClientKey = process.env.TOSS_CLIENT_KEY || '';
  const isDevService = (process.env.K_SERVICE || '').includes('-dev');
  if (!tossClientKey) {
    log('🚨 TOSS_CLIENT_KEY 미주입 — 결제 위젯이 뜨지 않습니다', 'ERROR');
  } else if (!isDevService && !tossClientKey.startsWith('live_')) {
    log('🚨 prod인데 TOSS_CLIENT_KEY가 라이브 키가 아닙니다 — 결제 위젯이 테스트 모드입니다', 'ERROR');
  }
  log(`Toss Client Key: ${tossClientKey ? (tossClientKey.startsWith('live_') ? '설정됨 (LIVE)' : '설정됨 (TEST)') : '미설정'}`);
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
  log('='.repeat(60));
});

