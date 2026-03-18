/**
 * MONKOS Studio — 내부용 AI 보정 앱
 *
 * idphoto-kr 기반 독립 배포
 * - 인증/결제 없음 (내부 전용)
 * - WebSocket 코칭 제거
 * - AI 파이프라인(Imagen I2I) 그대로 유지
 *
 * Cloud Run 배포: monkos-studio
 */

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { saveImages } from './gcs-save.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';

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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

log('[Studio] 내부용 AI 보정 앱 초기화');
log(`[Google AI Studio] Imagen 클라이언트 초기화 (API Key ${GEMINI_API_KEY ? '설정됨' : '미설정'})`);

// === Imagen 프롬프트 (idphoto-kr 정본 — 수정 금지) ===
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

const EXPRESSION_PROMPTS = {
  gentle_smile: 'relaxed pleasant expression with naturally soft eyes, at ease, quiet warmth in face',
  neutral: 'natural calm resting face with soft relaxed eyes, at ease and composed',
  natural_smile: 'gently pleasant face with warm relaxed eyes, approachable and at ease',
  bright_smile: 'warm friendly expression with bright relaxed eyes, naturally pleasant',
};

// === v5 프롬프트 빌더 (idphoto-kr 정본 — 수정 금지) ===
function buildPromptV5(body) {
  const { format, gender, age, clothing, clothingColor,
          suitColor, shirtColor, tieColor, tiePattern,
          hair, bgColor, expression } = body;

  const parts = [];

  if (format === 'passport') {
    parts.push('[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. White background mandatory.');
  } else {
    parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height.');
  }

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

  if (hair && hair !== 'default') {
    const HAIR_MAP = {
      tidy: 'neatly groomed and tidy hair',
      updo: 'hair styled up neatly (updo)',
    };
    if (HAIR_MAP[hair]) parts.push(`[HAIR] ${HAIR_MAP[hair]}`);
  }

  const BG_MAP = {
    white: 'pure white (#FFFFFF) background',
    gray:  'neutral gray (#9CA3AF) studio background',
    blue:  'soft blue (#4A90D9) studio background',
    beige: 'warm beige (#D4B896) studio background',
  };
  const finalBg = format === 'passport' ? 'white' : (bgColor || 'white');
  parts.push(`[BACKGROUND] ${BG_MAP[finalBg] || BG_MAP.white}`);

  const expr = expression || 'gentle_smile';
  if (EXPRESSION_PROMPTS[expr]) {
    parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
  }

  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}

// === Base64 추출 헬퍼 ===
function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

// === 사전분석 ===
const PRECHECK_MODELS = ['gemini-2.0-flash'];

const PRE_CHECK_INSTRUCTION = `이 사진이 증명사진 원본으로 적합한지 분석해 주세요.

[체크 항목]
1. 얼굴 감지: 얼굴이 1개 명확하게 보이는가?
2. 정면성: 정면을 보고 있는가?
3. 조명: 얼굴에 심한 그림자나 역광이 없는가?
4. 선명도: 흔들림 없이 선명한가?
5. 얼굴 크기: 프레임 대비 얼굴이 충분히 큰가?
6. 표정: 무표정 또는 자연스러운 미소인가?
7. 눈: 눈을 감지 않았는가?

[응답 형식 — JSON만 출력]
{
  "suitable": true,
  "score": 85,
  "face_detected": true,
  "issues": [],
  "suggestion": "한줄 조언"
}`;

async function runPreCheck(imageBase64) {
  const data = extractBase64(imageBase64);

  for (const model of PRECHECK_MODELS) {
    try {
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
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch { /* JSON 파싱 실패 → 다음 모델 */ }
      return { suitable: true, score: 0, raw: text };
    } catch (err) {
      log(`[사전분석][${model}] 실패: ${err.message}`, 'WARNING');
      if (model === PRECHECK_MODELS[PRECHECK_MODELS.length - 1]) {
        return { suitable: true, score: 0, note: `분석 실패: ${err.message}` };
      }
    }
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
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// === API 라우트 ===

// 헬스체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'monkos-studio',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    internal: true,
  });
});

// 사전분석
app.post('/api/precheck', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '이미지 필요' });
    const result = await runPreCheck(req.body.image);
    res.json(result);
  } catch (err) {
    log(`[API][precheck] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// I2I 생성 — 인증/크레딧 없이 직접 생성
app.post('/api/idgen', async (req, res) => {
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API 키 미설정' });

    const body = req.body;
    const { image } = body;
    if (!image) return res.status(400).json({ error: '이미지가 필요합니다' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    log(`[idgen] 입력: ${(byteLength/1024).toFixed(1)}KB`);
    if (byteLength > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지가 너무 큽니다 (5MB 이하)' });
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
      throw new Error(`API ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
    }

    const generatedBase64 = imagePart.inlineData.data;

    // GCS 저장 (내부 샘플 보관용 — studio 폴더)
    try {
      await saveImages('studio-internal', image, generatedBase64);
      log('[GCS] 스튜디오 샘플 저장 완료');
    } catch (e) {
      log(`[GCS] 저장 실패 (무시): ${e.message}`, 'WARNING');
    }

    // 워터마크 없이 원본 그대로 응답 (내부용)
    res.json({ image: `data:image/png;base64,${generatedBase64}` });

  } catch (err) {
    log(`[API][idgen] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// === 페이지 라우트 (v2 SPA — 단일 페이지) ===
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/app.html')));
app.get('/app', (req, res) => res.sendFile(join(__dirname, 'public/app.html')));

// 정적 파일 서빙
app.use(express.static(join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  }
}));

// === 서버 시작 (HTTP only — WebSocket 없음) ===
app.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(50));
  log('MONKOS Studio — 내부용 AI 보정 앱');
  log('='.repeat(50));
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`Imagen: ${GEMINI_API_KEY ? '활성' : 'API Key 미설정'}`);
  log('인증: 없음 (내부 전용)');
  log('결제: 없음');
  log('='.repeat(50));
  log('엔드포인트:');
  log('  GET  /health       — 헬스체크');
  log('  POST /api/precheck — 사전분석');
  log('  POST /api/idgen    — Imagen I2I 생성');
  log('  GET  /             — Studio SPA');
  log('='.repeat(50));
});
