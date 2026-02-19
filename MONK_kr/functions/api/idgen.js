// CF Workers — 증명사진 I2I 생성 (Gemini Pro 직접 호출)
// 프록시 제거, 자체 엔진. photo.js 패턴 + idphoto-kr 프롬프트

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// 정체성 유지 프롬프트 (photo.js L6~L24)
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

// 스타일 프롬프트 (idphoto-kr/server.js L186~189)
const STYLE_PROMPTS = {
  id_photo: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',
  resume: 'Professional resume photo for Korean job application (이력서), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

// 성별/연령별 의상 프롬프트 (idphoto-kr/server.js L192~211)
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

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API 키 미설정' }), { status: 500, headers: CORS });
    }

    const body = await request.json();
    const { image, style = 'id_photo', gender = 'male', age = 'adult' } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: '이미지가 필요합니다' }), { status: 400, headers: CORS });
    }

    // data: prefix 제거
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // 이미지 크기 검증 (2MB 상한)
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    if (byteLength > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: '이미지가 너무 큽니다 (2MB 이하)' }), { status: 400, headers: CORS });
    }

    // 프롬프트 조립
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
    const outfitPrompt = getOutfitPrompt(gender, age, style);
    const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}\n\n${outfitPrompt}`;

    // Gemini 3 Pro Image Preview (I2I 생성)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/png', data: base64Data } },
              { text: instruction },
            ],
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
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
      throw new Error(`API 오류: ${response.status}`);
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
