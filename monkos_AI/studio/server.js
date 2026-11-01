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
import { readFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { saveImages } from './gcs-save.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
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

// === Vertex AI ADC 인증 ===
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

log('[Studio] 내부용 AI 보정 앱 초기화');
log(`[Vertex AI] 텍스트 클라이언트 초기화 (project: ${PROJECT_ID}, location: global, model: ${TEXT_MODEL})`);
log(`[Vertex AI] 이미지 생성 클라이언트 초기화 (location: global)`);

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
  'linkedin_pro':      '1:1',
  'corporate':         '3:4',
  'creative':          '3:4',
  'realtor':           '3:4',
  'dating':            '3:4',
  'linkedin':          '1:1',
  'professional':      '3:4',
  'executive':         '3:4',
  'artist':            '3:4',
  'beauty':            '1:1',
  'fitting':           '3:4',
};

const PURPOSE_PROMPT_MAP = {
  'linkedin_pro':  'Professional LinkedIn headshot. Square 1:1 crop. Head and shoulders only, tight framing. Clean solid light gray studio background. Polished professional attire appropriate for the person\'s gender and style. Soft diffused studio lighting, no harsh shadows. Natural confident smile with relaxed eyes. Face fills 70% of frame.',
  'corporate':     'Corporate team headshot for company website. Waist-up portrait, 3/4 body angle turned slightly. Solid medium gray seamless background. Formal business attire suitable for a senior professional. Premium Rembrandt studio lighting with subtle rim light. Authoritative yet approachable expression.',
  'creative':      'Creative professional portrait. Waist-up, relaxed natural pose leaning slightly. Warm golden-hour window light from the side, soft bokeh background of blurred indoor greenery. Smart casual style — relaxed, modern, effortlessly put-together. Genuine warm smile, approachable and personable. Editorial magazine feel.',
  'realtor':       'Approachable business professional headshot. Waist-up, body angled 30 degrees with face toward camera. Bright clean white background. Neat professional look with a welcoming vibe. Bright even studio lighting, energetic and trustworthy smile showing teeth. Friendly, confident, ready-to-help expression.',
  'dating':        'Attractive dating profile photo. Waist-up, natural relaxed pose. Outdoor golden hour backlight with warm soft bokeh. Stylish casual outfit that suits the person. Genuine happy smile with eye crinkle, looking directly at camera. Natural and authentic — NOT posed or stiff. Warm inviting mood.',
  'linkedin':      'Professional LinkedIn headshot. Bust shot, soft studio lighting, clean neutral background. Confident, approachable expression.',
  'professional':  'Professional portrait for expert/specialist. Upper body, arms crossed or confident pose. Clean studio background.',
  'executive':     'Executive portrait. Bust to upper body, authoritative but approachable. Premium studio lighting, subtle gradient background.',
  'artist':        'Creative artist portrait. Free framing, emotional mood lighting. Dramatic or editorial feel.',
  'beauty':        'Beauty close-up portrait. Face fills 80% of frame. Flawless skin, professional makeup. Soft diffused lighting.',
  'fitting':       'Model fitting portrait. Full body to upper body, clothing-focused. Clean studio background, even lighting.',
};

const PROFILE_MODEL_MAP = {
  'nano-banana-2':   'gemini-3.1-flash-image',
  'nano-banana-pro': 'gemini-3-pro-image',
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
  let { format, gender, age, clothing, clothingColor,
          suitColor, shirtColor, tieColor, tiePattern,
          hair, bgColor, expression } = body;

  if ((age === 'baby' || age === 'child') && clothing === 'suit') {
    clothing = 'default';
  }

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
    const isChild = (age === 'baby' || age === 'child');
    const subject = isChild ? 'this child' : 'this person';
    parts.push(`[OUTFIT] Dress ${subject} in a clean ${clothingColor || 'white'} top, ${isChild ? 'age-appropriate and ' : ''}neat.`);
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
    if (gender === 'f') {
      const FEMALE_OUTFIT = {
        black: `black formal blazer with a white collared dress shirt buttoned to top`,
        navy: `${suit} modern business blazer with a ${shirt} neat round-neck blouse`,
        gray: `${suit} smart casual blazer with a ${shirt} relaxed professional top`,
      };
      const outfitDesc = FEMALE_OUTFIT[suitColor] || FEMALE_OUTFIT['navy'];
      parts.push(`[OUTFIT] Dress this person in a ${outfitDesc}.`);
    } else {
      const topItem = 'collared dress shirt';
      parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${topItem}${tieClause}.`);
    }
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

// === 프로필 프롬프트 빌더 (마스터 + 오버라이드, 단일 모드) ===
function buildProfilePrompt(body) {
  const { customPrompt, referenceImages } = body;
  const hasMaster = referenceImages?.some(r => r.role === 'master');
  const hasOverride = (role) => referenceImages?.some(r => r.role === role);

  if (hasMaster) {
    const parts = [];
    parts.push(IDENTITY_PRESERVATION_PROFILE);
    parts.push('\n[IMAGE-TO-IMAGE STYLE TRANSFER]');
    parts.push('[PRIORITY 1 — IDENTITY] Image 1 is the SUBJECT. Preserve their face, facial structure, skin tone, and identity exactly. They must be clearly recognizable as the SAME person.');
    parts.push('[PRIORITY 2 — STYLE] From the MASTER REFERENCE image, extract and apply the STYLE: clothing style, pose type, framing, lighting mood, background atmosphere, and overall aesthetic. Do NOT copy the face or body from the reference — only interpret its style onto the subject.');
    if (hasOverride('fashion')) parts.push('[FASHION OVERRIDE] Use the clothing/outfit STYLE from the FASHION OVERRIDE image INSTEAD of the master reference clothing. Interpret the style, do not copy the image.');
    if (hasOverride('hair')) parts.push('[HAIR OVERRIDE] Use the hairstyle from the HAIR OVERRIDE image INSTEAD of the master reference hair.');
    if (hasOverride('makeup')) parts.push('[MAKEUP OVERRIDE] Use the makeup style from the MAKEUP OVERRIDE image INSTEAD of the master reference makeup.');
    if (hasOverride('background')) parts.push('[BACKGROUND OVERRIDE] Use the background/setting from the BACKGROUND OVERRIDE image INSTEAD of the master reference background.');
    if (customPrompt) parts.push(`[ADDITIONAL] ${customPrompt}`);
    parts.push('[ABSOLUTE RULE] The output must look like Image 1 person styled differently — NOT like the reference person. If in doubt, prioritize identity over style accuracy.');
    return parts.join('\n');
  }

  const purposePrompt = PURPOSE_PROMPT_MAP[body.purpose] || '';
  const promptText = `${purposePrompt}\n${customPrompt || ''}`.trim()
    || 'Generate a professional portrait photo.';
  return `${IDENTITY_PRESERVATION_PROFILE}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${promptText}`;
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

// === 사전분석 ===
const PRECHECK_MODELS = [TEXT_MODEL];

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

async function runPreCheck(imageBase64, timeoutMs = PRECHECK_TIMEOUT_MS) {
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
          abortSignal: AbortSignal.timeout(timeoutMs),
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
    const result = await runPreCheck(req.body.image, precheckTimeoutFor(req));
    res.json(result);
  } catch (err) {
    log(`[API][precheck] 에러: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// I2I 생성 — 인증/크레딧 없이 직접 생성
app.post('/api/idgen', async (req, res) => {
  try {
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
      throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
    }

    const generatedBase64 = imagePart.inlineData.data;

    // GCS 저장 (내부 샘플 보관용 — studio 폴더)
    try {
      await saveImages('idphoto', body.userId || 'anonymous', body.purpose || 'passport', image, generatedBase64);
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
    const body = req.body;
    const { image, model, purpose, referenceImages, userId } = body;

    if (!image && !referenceImages?.length) {
      return res.status(400).json({ error: '내 사진 또는 레퍼런스 이미지가 필요합니다' });
    }

    const roles = referenceImages?.map(r => r.role).join('+') || 'none';
    if (image) {
      const base64Data = extractBase64(image);
      const byteLength = Math.ceil(base64Data.length * 3 / 4);
      log(`[profiles] 입력: ${(byteLength/1024).toFixed(1)}KB, 모델: ${model || 'nano-banana-2'}, 용도: ${purpose || 'linkedin'}, refs: ${roles}`);
      if (byteLength > 5 * 1024 * 1024) {
        return res.status(400).json({ error: '이미지가 너무 큽니다 (5MB 이하)' });
      }
    } else {
      log(`[profiles] 유저사진 없음, refs: ${roles}, 모델: ${model || 'nano-banana-2'}, 용도: ${purpose || 'linkedin'}`);
    }

    const instruction = buildProfilePrompt(body);
    const modelId = PROFILE_MODEL_MAP[model] || PROFILE_MODEL_MAP['nano-banana-2'];
    const aspectRatio = PURPOSE_ASPECT_MAP[purpose] || '3:4';

    const contentParts = [];

    if (image) {
      const base64Data = extractBase64(image);
      contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      contentParts.push({ text: 'Image 1: This is the subject person. Preserve their face and identity.' });
    }

    if (referenceImages?.length) {
      const ROLE_LABELS = {
        master: 'MASTER REFERENCE. Apply everything from this image — pose, framing, clothing, hair, makeup, background, lighting, and overall mood. This is the target style.',
        fashion: 'FASHION OVERRIDE. Use this clothing/outfit style INSTEAD of the master reference clothing.',
        hair: 'HAIR OVERRIDE. Use this hairstyle INSTEAD of the master reference hair.',
        makeup: 'MAKEUP OVERRIDE. Use this makeup style INSTEAD of the master reference makeup.',
        background: 'BACKGROUND OVERRIDE. Use this background/setting INSTEAD of the master reference background.',
      };

      let imgIdx = image ? 2 : 1;
      for (const ref of referenceImages) {
        if (ref.data) {
          const refData = extractBase64(ref.data);
          contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: refData } });
          const label = ROLE_LABELS[ref.role] || `Reference for ${ref.role} style.`;
          contentParts.push({ text: `Image ${imgIdx}: ${label}` });
          imgIdx++;
        }
      }
    }

    contentParts.push({ text: instruction });

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
      const textParts = (cand?.content?.parts || []).filter(p => p.text).map(p => p.text).join(' | ');
      log(`[profiles] 이미지 없음 — finishReason: ${finishReason}, blockReason: ${blockReason || 'none'}, text: ${textParts || 'none'}`, 'WARNING');

      const reason = blockReason || finishReason;
      if (blockReason || finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') {
        throw new Error(`안전 정책상 생성이 거부되었습니다 (사유: ${reason})`);
      }
      throw new Error(`이미지 생성 실패 (사유: ${reason}${textParts ? ` — ${textParts}` : ''})`);
    }

    const generatedBase64 = imagePart.inlineData.data;

    try {
      await saveImages('headshot', body.userId || 'anonymous', purpose || 'linkedin_pro', image || 'no-user-photo', generatedBase64);
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
  log(`Imagen: Vertex AI ADC (${LOCATION})`);
  log('인증: 없음 (내부 전용)');
  log('결제: 없음');
  // 2026-07-25: 클라이언트 키는 /config.js 서빙 시 치환 주입 — 미주입이면 위젯이 조용히 안 뜬다(무음 강등 금지)
  const tossClientKey = process.env.TOSS_CLIENT_KEY || '';
  const isDevService = (process.env.K_SERVICE || '').includes('-dev');
  if (!tossClientKey) {
    log('🚨 TOSS_CLIENT_KEY 미주입 — 결제 위젯이 뜨지 않습니다', 'ERROR');
  } else if (!isDevService && !tossClientKey.startsWith('live_')) {
    log('🚨 prod인데 TOSS_CLIENT_KEY가 라이브 키가 아닙니다 — 결제 위젯이 테스트 모드입니다', 'ERROR');
  }
  log(`Toss Client Key: ${tossClientKey ? (tossClientKey.startsWith('live_') ? '설정됨 (LIVE)' : '설정됨 (TEST)') : '미설정'}`);
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
