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

// === 프로필 프롬프트 맵 ===
const PROFILE_FRAMING_MAP = {
  'beauty-closeup': 'Beauty close-up portrait. Face fills 80% of frame, collarbone to forehead.',
  'headshot': 'Professional headshot. Head and shoulders, face centered.',
  'bust': 'Bust shot. Chest to top of head visible.',
  'waist-up': 'Waist-up portrait. Waist to top of head visible.',
};

const PROFILE_BG_MAP = {
  'studio-white': 'pure white (#FFFFFF) studio background',
  'studio-gray': 'neutral gray studio background',
  'studio-color': 'solid colored studio background, professional',
  'office': 'modern office interior, soft bokeh background',
  'cafe': 'warm cafe interior, natural light, soft bokeh',
  'outdoor-urban': 'urban street background, shallow depth of field',
  'outdoor-nature': 'natural outdoor setting, soft sunlight, green bokeh',
};

const PROFILE_LIGHTING_MAP = {
  'flat': 'flat even lighting, minimal shadows',
  'soft-studio': 'soft diffused studio lighting, gentle shadows',
  'rembrandt': 'Rembrandt lighting, triangle shadow on cheek',
  'butterfly': 'butterfly lighting, shadow under nose, beauty style',
  'rim': 'rim light on edges, dramatic separation from background',
  'natural': 'natural window light, soft and warm',
  'high-key': 'high-key lighting, bright and airy, minimal shadows',
  'low-key': 'low-key dramatic lighting, dark background, face highlighted',
};

const PROFILE_MOOD_MAP = {
  'clean': 'clean natural color grading, minimal post-processing',
  'warm': 'warm golden tones, inviting and friendly feel',
  'cool': 'cool blue-silver tones, sleek and modern',
  'cinematic': 'cinematic color grading, teal and orange, shallow depth',
  'editorial': 'editorial magazine style, high contrast, fashion feel',
  'glamour': 'glamour lighting, skin glow, highlights emphasized',
  'moody': 'moody dark tones, film grain, emotional atmosphere',
  'fresh': 'bright fresh tones, high white balance, airy summer feel',
};

const OUTFIT_KEYWORDS = {
  'suit-navy-m':       'navy formal business suit, white collared dress shirt',
  'suit-navy-w':       'navy formal business blazer, white silk blouse',
  'suit-charcoal-m':   'charcoal gray formal suit, light blue dress shirt',
  'suit-charcoal-w':   'charcoal gray blazer, cream silk blouse',
  'suit-black-m':      'black formal suit, white dress shirt, no tie',
  'suit-black-w':      'black formal blazer, white blouse',
  'casual-knit-m':     'casual crew neck knit sweater, neutral earth tone',
  'casual-vneck-w':    'casual v-neck knit sweater, soft pastel tone',
  'casual-oxford-m':   'oxford button-down shirt, light blue, rolled sleeves',
  'casual-blouse-w':   'elegant silk blouse, soft cream ivory tone',
  'casual-polo-m':     'classic polo shirt, navy, clean collar',
  'creative-turtle-m': 'black turtleneck sweater, minimalist style',
  'creative-turtle-w': 'black turtleneck, elegant minimalist',
  'creative-leather-m':'black leather jacket, white crew neck t-shirt',
  'creative-denim-w':  'classic denim jacket, white top underneath',
  'uniform-doctor-m':  'white doctor lab coat, stethoscope',
  'uniform-chef-w':    'white double-breasted chef coat',
  'season-linen-m':    'light linen short sleeve shirt, summer casual',
  'season-summer-w':   'light cotton short sleeve top, summer fresh',
  'season-coat-w':     'camel wool coat upper body, knit scarf',
};

const HAIR_KEYWORDS = {
  'tidy-short-m':     'neatly groomed short hair, clean cut',
  'two-block-m':      'two-block haircut, trimmed sides, volume on top',
  'dandy-cut-m':      'dandy cut, slicked back sides, refined gentleman style',
  'side-part-m':      'clean side part, neatly combed',
  'comma-hair-m':     'comma hair, soft bangs curved to one side',
  'tidy-bob-f':       'neat bob cut, shoulder length, clean straight',
  'long-straight-f':  'long straight hair, sleek and shiny',
  'c-curl-bob-f':     'C-curl bob, inward curled ends, volumized',
  'wave-long-f':      'long wavy hair, soft natural waves',
  'half-updo-f':      'half-up half-down hairstyle, elegant',
  'updo-f':           'hair styled up in elegant updo',
  'low-ponytail-f':   'low ponytail, sleek and polished',
};

const POSE_KEYWORDS = {
  'front-center':       'facing directly forward, centered, symmetrical',
  'front-smile':        'facing directly forward, warm natural smile',
  'three-quarter-left': 'three-quarter turn to the left, slight angle',
  'three-quarter-right':'three-quarter turn to the right, slight angle',
  'shoulder-angle':     'slight shoulder angle, dynamic professional pose',
  'chin-rest':          'chin resting on hand, thoughtful relaxed pose',
  'arms-crossed':       'arms crossed confidently, professional stance',
  'head-tilt':          'slight head tilt, friendly approachable',
  'look-away':          'looking slightly off-camera, candid natural feel',
};

const MAKEUP_KEYWORDS = {
  'natural-minimal': 'natural minimal makeup, clean skin',
  'office-daily':    'office-appropriate daily makeup, polished',
  'glow':            'dewy glowing skin, highlight on cheekbones',
  'grooming-m':      'groomed clean skin, subtle concealer, neat brows',
  'toneup':          'brightened skin tone, even complexion',
};

const PURPOSE_ASPECT_MAP = {
  'linkedin':  '1:1',
  'sns':       '1:1',
  'corporate': '3:4',
  'dating':    '3:4',
  'artist':    '3:4',
  'speaker':   '16:9',
};

const PROFILE_MODEL_MAP = {
  'nano-banana-2':   'gemini-3.1-flash-image-preview',
  'nano-banana-pro': 'gemini-3-pro-image-preview',
};

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

  if (age === 'baby') {
    parts.push('[EXPRESSION] Keep the child\'s natural expression exactly as-is.');
  } else {
    const expr = expression || 'gentle_smile';
    if (EXPRESSION_PROMPTS[expr]) {
      parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
    }
  }

  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  const identity = (age === 'baby') ? IDENTITY_PRESERVATION_BABY : IDENTITY_PRESERVATION;
  return `${identity}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}

// === 프로필 프롬프트 빌더 ===
function buildProfilePrompt(body) {
  const { framing, background, outfit, hair, pose, makeup,
          lighting, mood, customPrompt, referenceImages } = body;

  const parts = [];
  const hasRef = (cat) => referenceImages?.some(r => r.category === cat && r.data);

  parts.push(`[FRAMING] ${PROFILE_FRAMING_MAP[framing] || PROFILE_FRAMING_MAP.headshot}`);
  parts.push(`[BACKGROUND] ${PROFILE_BG_MAP[background] || PROFILE_BG_MAP['studio-white']}`);
  parts.push(`[LIGHTING] ${PROFILE_LIGHTING_MAP[lighting] || PROFILE_LIGHTING_MAP['soft-studio']}`);
  parts.push(`[MOOD] ${PROFILE_MOOD_MAP[mood] || PROFILE_MOOD_MAP.clean}`);

  if (outfit) {
    if (hasRef('outfit')) {
      parts.push('[OUTFIT] Apply the outfit style from the reference image labeled "outfit". Keep the person\'s body exactly the same.');
    } else if (OUTFIT_KEYWORDS[outfit]) {
      parts.push(`[OUTFIT] Dress this person in: ${OUTFIT_KEYWORDS[outfit]}. Keep the person's body exactly the same.`);
    }
  }

  if (hair && !hair.startsWith('default')) {
    if (hasRef('hair')) {
      parts.push('[HAIR] Apply the hairstyle from the reference image labeled "hair". Keep the face exactly the same.');
    } else if (HAIR_KEYWORDS[hair]) {
      parts.push(`[HAIR] Style the hair as: ${HAIR_KEYWORDS[hair]}. Keep the face exactly the same.`);
    }
  }

  if (pose) {
    if (hasRef('pose')) {
      parts.push('[POSE] Match the pose and angle from the reference image labeled "pose". Keep the person\'s identity.');
    } else if (POSE_KEYWORDS[pose]) {
      parts.push(`[POSE] ${POSE_KEYWORDS[pose]}`);
    }
  }

  if (makeup) {
    if (hasRef('makeup')) {
      parts.push('[MAKEUP] Apply the makeup style from the reference image labeled "makeup". Subtle and natural.');
    } else if (MAKEUP_KEYWORDS[makeup]) {
      parts.push(`[MAKEUP] ${MAKEUP_KEYWORDS[makeup]}`);
    }
  }

  if (customPrompt) parts.push(`[ADDITIONAL] ${customPrompt}`);
  parts.push('[CONSTRAINT] Keep the person\'s face and identity exactly the same — only apply the specified styling.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE PROFILE TRANSFORM]\n${parts.join('\n')}`;
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

// 프로필 I2I 생성
app.post('/api/profiles/generate', async (req, res) => {
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API 키 미설정' });

    const body = req.body;
    const { image, model, purpose, referenceImages } = body;
    if (!image) return res.status(400).json({ error: '이미지가 필요합니다' });

    const base64Data = extractBase64(image);
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    log(`[profiles] 입력: ${(byteLength/1024).toFixed(1)}KB, 모델: ${model || 'nano-banana-2'}`);
    if (byteLength > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지가 너무 큽니다 (5MB 이하)' });
    }

    const instruction = buildProfilePrompt(body);
    const modelId = PROFILE_MODEL_MAP[model] || PROFILE_MODEL_MAP['nano-banana-2'];
    const aspectRatio = PURPOSE_ASPECT_MAP[purpose] || '3:4';

    const contentParts = [
      { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
      { text: 'This is the main person. Preserve their face 90%.' },
    ];

    if (referenceImages?.length) {
      for (const ref of referenceImages) {
        if (ref.data) {
          const refData = extractBase64(ref.data);
          contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: refData } });
          contentParts.push({ text: `Reference for ${ref.category} style only.` });
        }
      }
    }

    contentParts.push({ text: instruction });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentParts }],
          generationConfig: { imageConfig: { aspectRatio } },
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

    try {
      await saveImages('studio-profiles', image, generatedBase64);
      log('[GCS] 프로필 샘플 저장 완료');
    } catch (e) {
      log(`[GCS] 저장 실패 (무시): ${e.message}`, 'WARNING');
    }

    res.json({ image: `data:image/png;base64,${generatedBase64}` });

  } catch (err) {
    log(`[API][profiles] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// === 페이지 라우트 ===
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/app.html')));
app.get('/app', (req, res) => res.sendFile(join(__dirname, 'public/app.html')));
app.get('/profiles', (req, res) => res.sendFile(join(__dirname, 'public/profiles.html')));

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
  log('  POST /api/idgen    — Imagen I2I 생성 (증명사진)');
  log('  POST /api/profiles/generate — 프로필 I2I 생성');
  log('  GET  /             — Studio SPA');
  log('  GET  /profiles     — 프로필스 SPA');
  log('='.repeat(50));
});
