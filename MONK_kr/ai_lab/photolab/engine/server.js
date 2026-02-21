/**
 * photolab-engine — MPA photolab API 백엔드
 *
 * 엔드포인트:
 *   POST /api/coaching   — AI 코칭 (gemini-2.5-flash REST)
 *   POST /api/precheck   — 사전분석 (gemini-2.5-flash)
 *   POST /api/generate   — Imagen I2I 생성 (gemini-3-pro-image-preview)
 *   POST /api/qc         — 품질검증 (gemini-2.5-flash)
 *   GET  /health         — 헬스체크
 *
 * 인증: Vertex AI ADC (코칭/프리체크/QC) + Google AI Studio API Key (Imagen)
 * Cloud Run 배포용 (빌드만, 배포 대기)
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://monkos.ai';
const IMAGEN_API_KEY = process.env.IMAGEN_API_KEY || '';

// === AI 클라이언트 ===
// Vertex AI ADC — 코칭/프리체크/QC
const ai = new GoogleGenAI({ vertexai: true, project: PROJECT_ID, location: LOCATION });

// Google AI Studio API Key — Imagen I2I
const imagenAI = IMAGEN_API_KEY ? new GoogleGenAI({ apiKey: IMAGEN_API_KEY }) : null;

// === 모델 상수 ===
const COACHING_MODEL = 'gemini-2.5-flash';
const PRECHECK_MODEL = 'gemini-2.5-flash';
const QC_MODEL = 'gemini-2.5-flash';
const IMAGEN_MODEL = 'gemini-3-pro-image-preview';

// ─── 로깅 ───
function log(msg) {
  const ts = new Date().toISOString();
  if (process.env.K_SERVICE) {
    console.log(JSON.stringify({ severity: 'INFO', message: msg, timestamp: ts }));
  } else {
    console.log(`[${ts}] ${msg}`);
  }
}

// ─── base64 추출 ───
function extractBase64(input) {
  return input.includes(',') ? input.split(',')[1] : input;
}

// ════════════════════════════════════════
//  코칭 프롬프트 (idphoto-kr/server.js 원본)
// ════════════════════════════════════════

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

// 9필드 기반 코칭 프롬프트 빌더
function buildCoachingPrompt(fields) {
  const style = fields.style || 'id_photo';
  const base = COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo;

  const context = [];
  if (fields.purpose) context.push(`용도: ${fields.purpose}`);
  if (fields.gender) context.push(`성별: ${fields.gender === 'male' ? '남성' : '여성'}`);
  if (fields.age) context.push(`연령: ${fields.age}`);
  if (fields.clothing && fields.clothing !== 'as_is') context.push(`의상: ${fields.clothing}`);
  if (fields.clothingColor) context.push(`의상색: ${fields.clothingColor}`);
  if (fields.tie) context.push(`넥타이: ${fields.tie}`);
  if (fields.hair && fields.hair !== 'as_is') context.push(`헤어: ${fields.hair}`);
  if (fields.expression) context.push(`표정: ${fields.expression}`);

  if (context.length > 0) {
    return `${base}\n\n[사용자 설정]\n${context.join('\n')}\n\n설정에 맞는 코칭을 해주세요.`;
  }
  return base;
}

const READY_KEYWORDS = ['촬영하세요', '촬영해도', '지금 촬영', 'OK', '완벽'];

// ════════════════════════════════════════
//  사전분석 프롬프트 (idphoto-kr/server.js 원본)
// ════════════════════════════════════════

const PRECHECK_PROMPT = `이 사진이 증명사진 원본으로 적합한지 분석해 주세요.

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

// ════════════════════════════════════════
//  Imagen 프롬프트 (idphoto-kr/server.js 원본)
// ════════════════════════════════════════

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
  resume: 'Professional resume photo for Korean job application, perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

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

// ════════════════════════════════════════
//  QC 프롬프트 (idphoto-jp/server.js 원본 → 한국어 변환)
// ════════════════════════════════════════

function buildQCPrompt(gender, age) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const ageMap = { child: '유아~12세', teen: '13~18세', adult: '19세 이상' };
  const ageText = ageMap[age] || '미지정';

  return `2개의 이미지를 비교하고, 2번째(증명사진)의 품질을 종합 분석해 주세요.
1번째: 원본 (실제 촬영)
2번째: AI 생성물 (증명사진)
사용자 설정: 성별=${genderText}, 연령=${ageText}

[판정 기준 — 전부 체크 필수]
1. 동일 인물인가? (얼굴 구조, 눈/코/입 비율)
2. 유사도 % (0-100)
3. 아이덴티티 유지 (PASS/FAIL)
4. 성별 일치: 원본의 외견상 성별과 생성물이 일치하는가?
5. 연령대 일치: 원본의 외견 연령과 생성물이 일치하는가?
6. 과도한 보정: 헤어스타일 대폭 변경, 피부 과보정, 윤곽 변형, 눈 크기 변경 등 부자연스러운 변형이 있는가?
7. 증명사진 품질 (조명, 배경, 구도)

[FAIL 조건 — 하나라도 해당하면 identity를 FAIL 판정]
- 성별 외견이 원본과 다르게 변환됨
- 연령대가 원본과 크게 다름 (10세 이상 차이 추정)
- 얼굴 윤곽, 눈 크기, 코 형태가 원본과 다르게 변형
- 헤어스타일이 원본과 완전히 다름 (정돈 정도는 허용)
- similarity 70% 미만

[응답 형식 — JSON만 출력]
{
  "same_person": true,
  "similarity": 85,
  "identity": "PASS",
  "gender_match": true,
  "age_match": true,
  "excessive_retouch": false,
  "photo_quality": "good",
  "issues": [],
  "suggestion": "한줄 조언",
  "face_box": [100, 200, 800, 700]
}`;
}

// ════════════════════════════════════════
//  크레딧 API 헬퍼
// ════════════════════════════════════════

async function useCredits(userId, type) {
  if (!userId) return { success: false, error: '로그인 필요' };
  try {
    const res = await fetch(`${PORTAL_API_URL}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await res.json();
  } catch (err) {
    log(`[Credits] API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

async function refundCredits(userId, type) {
  if (!userId) return { success: false, error: '로그인 필요' };
  try {
    const res = await fetch(`${PORTAL_API_URL}/api/credits/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await res.json();
  } catch (err) {
    log(`[Credits] 환불 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

// ════════════════════════════════════════
//  API 엔드포인트
// ════════════════════════════════════════

// ─── GET /health ───
app.get('/health', (req, res) => {
  res.json({
    service: 'photolab-engine',
    status: 'ok',
    timestamp: new Date().toISOString(),
    models: {
      coaching: COACHING_MODEL,
      precheck: PRECHECK_MODEL,
      qc: QC_MODEL,
      imagen: IMAGEN_MODEL,
    },
    imagen: IMAGEN_API_KEY ? 'active' : 'NO_API_KEY',
  });
});

// ─── POST /api/coaching ───
app.post('/api/coaching', async (req, res) => {
  try {
    const { image, style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = req.body;
    if (!image) return res.status(400).json({ error: '이미지 필요' });

    const base64 = extractBase64(image);
    const prompt = buildCoachingPrompt({ style, purpose, gender, age, clothing, clothingColor, tie, hair, expression });

    const response = await ai.models.generateContent({
      model: COACHING_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          { text: prompt },
        ],
      }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 50,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const ready = READY_KEYWORDS.some(kw => text.includes(kw));

    log(`[코칭] ${text.trim()} (ready=${ready})`);
    res.json({ text: text.trim(), ready });
  } catch (err) {
    log(`[코칭] 에러: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/precheck ───
app.post('/api/precheck', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: '이미지 필요' });

    const base64 = extractBase64(image);

    const response = await ai.models.generateContent({
      model: PRECHECK_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          { text: PRECHECK_PROMPT },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    log(`[사전분석] ${text.substring(0, 200)}`);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return res.json(JSON.parse(jsonMatch[0]));
    } catch { /* JSON 파싱 실패 */ }
    res.json({ suitable: true, score: 0, raw: text });
  } catch (err) {
    log(`[사전분석] 에러: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/generate ───
app.post('/api/generate', async (req, res) => {
  if (!imagenAI) return res.status(501).json({ error: 'IMAGEN_API_KEY 미설정' });

  let userId = null;
  try {
    const { image, style, gender, age } = req.body;
    userId = req.body.userId;
    if (!image) return res.status(400).json({ error: '이미지 필요' });

    // 이미지 사이즈 검증 (2MB 상한)
    const base64Raw = extractBase64(image);
    const imageSize = Math.ceil(base64Raw.length * 0.75);
    if (imageSize > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지 크기가 2MB를 초과합니다' });
    }

    // 크레딧 차감
    if (userId) {
      const creditResult = await useCredits(userId, 'generate');
      if (!creditResult.success) {
        return res.status(402).json({
          error: creditResult.error,
          credits: creditResult.credits ?? 0,
          required: 1,
        });
      }
      log(`[Credits] 생성 차감: ${userId} → ${creditResult.credits}c`);
    }

    // Imagen I2I 생성
    const useStyle = style || 'id_photo';
    const useGender = gender || 'male';
    const useAge = age || 'adult';

    const stylePrompt = STYLE_PROMPTS[useStyle] || STYLE_PROMPTS.id_photo;
    const outfitPrompt = getOutfitPrompt(useGender, useAge, useStyle);
    const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}\n\n${outfitPrompt}`;

    log(`[Imagen] 생성 요청: style=${useStyle}, gender=${useGender}, age=${useAge}`);

    const response = await imagenAI.models.generateContent({
      model: IMAGEN_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Raw, mimeType: 'image/jpeg' } },
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

    const generatedImage = `data:image/png;base64,${part.inlineData.data}`;
    log('[Imagen] 생성 완료');
    res.json({ image: generatedImage });
  } catch (err) {
    log(`[Imagen] 에러: ${err.message}`);
    // 생성 실패 시 크레딧 환불
    if (userId) {
      try {
        const refund = await refundCredits(userId, 'generate');
        if (refund.success) log(`[Credits] 생성 실패 환불: ${userId}`);
      } catch {}
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/qc ───
app.post('/api/qc', async (req, res) => {
  try {
    const { original, generated, style, gender, age } = req.body;
    if (!original || !generated) return res.status(400).json({ error: '원본/생성 이미지 필요' });

    const origData = extractBase64(original);
    const genData = extractBase64(generated);
    const qcPrompt = buildQCPrompt(gender || 'male', age || 'adult');

    log(`[QC] 모델: ${QC_MODEL}`);

    const response = await ai.models.generateContent({
      model: QC_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: origData } },
          { inlineData: { mimeType: 'image/png', data: genData } },
          { text: qcPrompt },
        ],
      }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    log(`[QC] 응답: ${text.substring(0, 300)}`);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        const pass = result.identity === 'PASS' && result.similarity >= 70;
        return res.json({ pass, ...result });
      }
    } catch { /* JSON 파싱 실패 */ }
    res.json({ pass: false, raw: text });
  } catch (err) {
    log(`[QC] 에러: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════
//  서버 시작
// ════════════════════════════════════════

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  log('═'.repeat(50));
  log('photolab-engine 시작');
  log('═'.repeat(50));
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID} / ${LOCATION}`);
  log(`코칭/프리체크/QC: ${COACHING_MODEL} (Vertex ADC)`);
  log(`Imagen: ${IMAGEN_MODEL} (API Key ${IMAGEN_API_KEY ? '설정됨' : '미설정'})`);
  log('═'.repeat(50));
  log('엔드포인트:');
  log('  GET  /health         — 헬스체크');
  log('  POST /api/coaching   — AI 코칭');
  log('  POST /api/precheck   — 사전분석');
  log('  POST /api/generate   — Imagen 생성');
  log('  POST /api/qc         — 품질검증');
  log('═'.repeat(50));
});
