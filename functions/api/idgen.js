// CF Workers — 증명사진 I2I 생성 (Gemini Pro 직접 호출)
// 9필드 퍼널 반영 동적 프롬프트

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// 정체성 유지 프롬프트
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

// ─── 배경색 프롬프트 ───
const BG_PROMPTS = {
  white:  'pure white (#FFFFFF) background',
  blue:   'soft blue (#4A90D9) studio background',
  gray:   'neutral gray (#9CA3AF) studio background',
  beige:  'warm beige (#D4B896) studio background',
  pink:   'soft pink (#F5A0B8) studio background',
  yellow: 'warm yellow (#FBBF24) studio background',
};

// ─── 의상 프롬프트 ───
const CLOTHING_PROMPTS = {
  as_is: null, // 그대로 — 의상 지시 없음
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

// ─── 표정 프롬프트 ───
const EXPRESSION_PROMPTS = {
  gentle_smile: 'gentle, subtle smile',
  neutral: 'neutral, composed expression',
  natural_smile: 'natural, friendly smile',
  bright_smile: 'bright, confident smile',
};

// ─── 헤어 프롬프트 ───
const HAIR_PROMPTS = {
  as_is: null,
  tidy: 'neatly groomed hair',
  up: 'hair tied up neatly',
  down: 'hair down, well-groomed',
};

// ─── 용도별 베이스 프롬프트 ───
const PURPOSE_PROMPTS = {
  passport: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, sharp focus, head straight, symmetric composition, forehead and eyebrows must be visible',
  student_id: 'Student ID photo, perfectly front-facing, clean and neat appearance, symmetric composition',
  employee_id: 'Professional corporate ID photo, perfectly front-facing, business-appropriate appearance, symmetric composition',
  resume: 'Professional resume photo for job application, perfectly front-facing looking directly at camera, business formal, 3:4 ratio, approachable yet professional',
  color_portrait: 'Professional color portrait photo, perfectly front-facing, studio lighting, clean and polished look',
};

// ─── 동적 프롬프트 빌더 ───
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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API 키 미설정' }), { status: 500, headers: CORS });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: '이미지가 필요합니다' }), { status: 400, headers: CORS });
    }

    // data: prefix 제거
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // 이미지 크기 검증 (2MB 상한)
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    console.log(`[idgen] 입력 이미지: base64=${base64Data.length}chars, bytes=${byteLength}, KB=${(byteLength/1024).toFixed(1)}`);
    if (byteLength > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '이미지가 너무 큽니다 (2MB 이하)' }), { status: 400, headers: CORS });
    }

    // 9필드 동적 프롬프트
    const instruction = buildPrompt(body);

    // Gemini 3 Pro Image Preview (I2I 생성)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '',
          'X-Real-IP': '',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
              { text: instruction },
            ],
          }],
          generationConfig: {
            imageConfig: { aspectRatio: '3:4' },
          },
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
      console.error('Gemini API 오류:', errorText);
      // 에러 상세를 클라이언트에 전달 (디버깅용)
      let detail = '';
      try { detail = JSON.parse(errorText)?.error?.message || errorText.substring(0, 200); } catch { detail = errorText.substring(0, 200); }
      throw new Error(`API ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (!imagePart?.inlineData) {
      throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
    }

    return new Response(JSON.stringify({
      image: `data:image/png;base64,${imagePart.inlineData.data}`,
    }), { headers: CORS });
  } catch (err) {
    console.error('idgen 오류:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
