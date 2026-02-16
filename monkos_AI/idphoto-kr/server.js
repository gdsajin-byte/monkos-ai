/**
 * MONKOS AI 증명사진 — idphoto-kr.monkos.ai
 *
 * 한국 시장 특화 AI 증명사진 서비스
 *   a) Gemini Live 코칭 — 촬영 전 실시간 가이드 (한국어)
 *   b) Imagen I2I 생성 — 증명사진 변환 (gemini-3-pro-image-preview)
 *   c) Gemini QC — 원본 vs 생성물 유사도 검증
 *
 * 인증: 하이브리드 (Vertex AI ADC + Google AI Studio API Key)
 * Cloud Run 배포용 (HTTP — SSL은 Cloud Run 처리)
 * 포트: 8080 (Cloud Run 기본)
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';

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
// Live 코칭 + QC → Vertex AI ADC
// Imagen I2I 생성 → Google AI Studio API Key (gemini-3-pro-image-preview는 Vertex AI 미지원)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

log('[Vertex AI] ADC 클라이언트 초기화 (Live + QC)');
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

// === Imagen 프롬프트 ===
const IDENTITY_PRESERVATION = `LIGHTING (HIGHEST PRIORITY — override all lighting from input):
- Flat, even studio illumination from directly above-front (centered, 45° overhead)
- BOTH sides of face equally lit — zero shadow on cheeks, forehead, or neck
- Only shadow allowed: very soft, small shadow directly under chin
- f/8 uniform sharpness, 5500K daylight white balance
- ABSOLUTELY NO: rembrandt lighting, side light, rim light, split light, dramatic shadows, warm/cool color shifts

BACKGROUND & SCENE (STRICT):
- Pure white background (#FFFFFF), evenly lit, no falloff or gradient
- ONLY the person in the frame — nothing else visible
- NO props, NO equipment, NO lighting gear, NO softbox, NO reflector, NO studio objects
- NO text, NO watermark, NO border, NO frame

IDENTITY RULE: 90% SAME PERSON + 10% ENHANCEMENT

POSE (CRITICAL):
- MUST be perfectly front-facing, looking directly at the camera
- NO semi-profile, no side angles, no 3/4 view
- Head straight, eyes looking directly at the lens
- Both ears should be equally visible
- Symmetric face positioning

PRESERVE (90%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- The person must be clearly recognizable as the SAME individual

ENHANCE (10% creative freedom):
- Slightly smoother skin, subtle beauty enhancement
- Minor imperfections can be softened
- Make them look their BEST version (not a different person)

DO NOT:
- Use side lighting, rim lighting, or any dramatic lighting setup
- Generate side angles or semi-profile poses
- Change gender, ethnicity, or age by more than 2-3 years
- Alter fundamental facial features
- Make them unrecognizable

GOAL: "This is ME, but on my best day" - perfectly front-facing, studio flat lighting, 90% accuracy, 10% professional retouching.`;

const STYLE_PROMPTS = {
  id_photo: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',
  resume: 'Professional resume photo for Korean job application (이력서), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

// 성별/연령별 의상 프롬프트
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

// === QC 프롬프트 (한국어 — bounding box + 성별/연령/보정 체크) ===
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

async function connectGeminiLive(session, clientId, style = 'id_photo') {
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
        systemInstruction: { parts: [{ text: COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo }] },
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

// === Imagen I2I 생성 (Google AI Studio API Key) ===
async function compressImage(base64Input, maxSize = 720, quality = 70) {
  const raw = base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
  const buf = Buffer.from(raw, 'base64');
  const resized = await sharp(buf)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
  log(`[압축] ${(buf.length / 1024).toFixed(0)}KB → ${(resized.length / 1024).toFixed(0)}KB`);
  return resized.toString('base64');
}

async function generatePhoto(inputBase64, style = 'id_photo', gender = 'male', age = 'adult') {
  const base64Data = await compressImage(inputBase64, 720, 70);
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
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

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error('이미지 생성 실패: 응답에 이미지 없음');

  return `data:image/png;base64,${part.inlineData.data}`;
}

// === Gemini QC (Vertex AI ADC) — 3 Flash → 2.0 Flash 폴백 ===
const QC_MODELS = ['gemini-3-flash-preview', 'gemini-2.0-flash'];

async function runQC(originalBase64, generatedBase64, gender = 'male', age = 'adult') {
  const origData = await compressImage(originalBase64, 512, 60);
  const genData = await compressImage(generatedBase64, 512, 60);
  const qcInstruction = buildQCInstruction(gender, age);

  for (const model of QC_MODELS) {
    try {
      log(`[QC] 모델 시도: ${model} (gender=${gender}, age=${age})`);
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: origData } },
            { inlineData: { mimeType: 'image/png', data: genData } },
            { text: qcInstruction },
          ],
        }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      log(`[QC][${model}] 응답: ${text.substring(0, 300)}`);

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch { /* JSON 파싱 실패 → 다음 모델 */ }
      return { raw: text };
    } catch (err) {
      log(`[QC][${model}] 실패: ${err.message} → 폴백`);
      if (model === QC_MODELS[QC_MODELS.length - 1]) {
        return { identity: 'ERROR', note: `QC 전체 실패: ${err.message}` };
      }
    }
  }
}

// === 사전분석 (Gemini 3 Flash — 촬영본 적합성 검사) ===
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
  const data = await compressImage(imageBase64, 512, 60);

  for (const model of QC_MODELS) {
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
      if (model === QC_MODELS[QC_MODELS.length - 1]) {
        return { suitable: true, score: 0, note: `분석 실패: ${err.message}` };
      }
    }
  }
}

// === HTTP 서버 (정적 파일 + API 엔드포인트) ===
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// POST body 파서 (JSON)
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const httpServer = createServer(async (req, res) => {
  // 보안 헤더
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const urlPath = req.url.split('?')[0];

  // 헬스체크
  if (urlPath === '/health') {
    jsonResponse(res, 200, {
      status: 'healthy',
      service: 'monkos-idphoto-kr',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      auth: 'Hybrid (ADC + API Key)',
      geminiLive: 'ready (ADC)',
      imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
      qc: 'active (gemini-3-flash-preview → 2.0-flash 폴백)',
      preCheck: 'active (gemini-3-flash-preview)',
    });
    return;
  }

  // API 정보
  if (urlPath === '/api/info') {
    jsonResponse(res, 200, {
      service: 'MONKOS AI 증명사진',
      domain: 'idphoto-kr.monkos.ai',
      features: ['AI 코칭 (WS)', 'AI 사전분석', 'AI 증명사진 생성', 'AI 품질 검증'],
      styles: Object.keys(STYLE_PROMPTS),
    });
    return;
  }

  // === REST API 엔드포인트 ===

  // POST /api/pre-check — 촬영본 적합성 분석
  if (urlPath === '/api/pre-check' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.image) return jsonResponse(res, 400, { error: '이미지 필요' });
      const result = await runPreCheck(body.image);
      jsonResponse(res, 200, result);
    } catch (err) {
      log(`[API][pre-check] 에러: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/generate — Imagen I2I 생성 (크레딧 체크 포함)
  if (urlPath === '/api/generate' && req.method === 'POST') {
    let bodyUserId = null;
    try {
      const body = await parseBody(req);
      bodyUserId = body.userId;
      if (!body.image) return jsonResponse(res, 400, { error: '이미지 필요' });

      // 크레딧 체크 및 차감
      if (body.userId) {
        const creditResult = await useCredits(body.userId, 'generate');
        if (!creditResult.success) {
          return jsonResponse(res, 402, {
            error: creditResult.error,
            credits: creditResult.credits ?? 0,
            required: 1,
          });
        }
        log(`[Credits] 생성 차감: ${body.userId} → ${creditResult.credits}c`);
      }

      log(`[Imagen] 생성 요청: style=${body.style}, gender=${body.gender || 'male'}, age=${body.age || 'adult'}`);
      const image = await generatePhoto(body.image, body.style, body.gender, body.age);
      jsonResponse(res, 200, { image });
    } catch (err) {
      log(`[API][generate] 에러: ${err.message}`);
      // 생성 실패 시 크레딧 환불
      if (bodyUserId) {
        try {
          const refund = await refundCredits(bodyUserId, 'generate');
          if (refund.success) log(`[Credits] 생성 실패 환불: ${bodyUserId}`);
        } catch {}
      }
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/qc — QC 검증
  if (urlPath === '/api/qc' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.original || !body.generated) return jsonResponse(res, 400, { error: '원본/생성물 필요' });
      const result = await runQC(body.original, body.generated, body.gender, body.age);
      jsonResponse(res, 200, result);
    } catch (err) {
      log(`[API][qc] 에러: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/credit/use — 크레딧 차감 (다운로드 등)
  if (urlPath === '/api/credit/use' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.userId) return jsonResponse(res, 400, { error: '로그인 필요' });
      const result = await useCredits(body.userId, body.type || 'download');
      jsonResponse(res, result.success ? 200 : 402, result);
    } catch (err) {
      log(`[API][credit/use] 에러: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/credit/share-bonus — 공유 보너스
  if (urlPath === '/api/credit/share-bonus' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.userId) return jsonResponse(res, 400, { error: '로그인 필요' });
      const result = await grantShareBonus(body.userId, body.platform);
      jsonResponse(res, result.success ? 200 : 400, result);
    } catch (err) {
      log(`[API][credit/share-bonus] 에러: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // 정적 파일 배포
  // / → 앱으로 리다이렉트, /app → 촬영 앱 UI
  if (urlPath === '/') {
    res.writeHead(302, { 'Location': '/app' });
    res.end();
    return;
  }
  let filePath;
  if (urlPath === '/app') filePath = '/index.html';
  else filePath = urlPath;
  const fullPath = join(__dirname, 'public', filePath);
  const ext = extname(filePath);

  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// === WebSocket (코칭 전용 — 촬영실 Step 1에서만 연결) ===
const wss = new WebSocketServer({ server: httpServer });
let clientCounter = 0;

wss.on('connection', async (ws) => {
  const clientId = `c${++clientCounter}`;
  log(`[WS][${clientId}] 코칭 세션 연결`);

  const session = { gemini: null, frameCount: 0, responseBuffer: '', bufferFlushTimer: null, ws, photoStyle: 'id_photo' };
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

    if (msg.type === 'set-style') {
      session.photoStyle = msg.style === 'resume' ? 'resume' : 'id_photo';
      log(`[스타일][${clientId}] ${session.photoStyle}`);
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

// === 서버 시작 ===
httpServer.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS AI 증명사진 (KR) — 서버 시작');
  log('='.repeat(60));
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`리전: ${LOCATION}`);
  log(`인증: 하이브리드 (ADC + API Key)`);
  log(`Imagen I2I: 활성 (gemini-3-pro-image-preview, API Key)`);
  log(`QC: 활성 (gemini-3-flash-preview → 2.0-flash 폴백)`);
  log(`사전분석: 활성 (gemini-3-flash-preview)`);
  log('='.repeat(60));
  log('엔드포인트:');
  log('  GET  /health              — 헬스체크');
  log('  GET  /api/info            — 서비스 정보');
  log('  POST /api/pre-check       — 사전분석 (촬영본 적합성)');
  log('  POST /api/generate        — Imagen I2I 생성');
  log('  POST /api/qc              — QC 검증');
  log('  POST /api/credit/use      — 크레딧 차감');
  log('  POST /api/credit/share-bonus — 공유 보너스');
  log('  GET  /                    — 랜딩페이지');
  log('  GET  /app                 — 촬영 앱');
  log('  WS   /                    — WebSocket (코칭 전용)');
  log('='.repeat(60));
});
