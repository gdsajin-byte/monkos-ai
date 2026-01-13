// MONK AI Photo API - Cloudflare Workers
// 기반: apps/imagen3 (MONKOS 검증 로직)

// 정체성 유지 프롬프트 (MONKOS에서 검증됨)
const IDENTITY_PRESERVATION = "CRITICAL INSTRUCTION: Maintain the exact facial features, body proportions, skin tone, facial structure, eye shape, nose, lips, and overall model identity. Preserve the person's unique characteristics completely and precisely.";

// 스타일별 프롬프트
const STYLE_PROMPTS = {
  id_photo: 'Professional ID photo, studio lighting, formal white background, sharp focus, passport-style portrait',
  profile: 'Professional business profile photo, soft studio lighting, neutral background, confident expression',
  casual: 'Natural casual portrait, soft daylight, relaxed expression, lifestyle photography',
  suit: 'Professional portrait wearing formal business suit, corporate style, studio lighting',
  resume: 'Professional resume photo, clean studio background, business casual attire, approachable expression'
};

export async function onRequestPost(context) {
  const { request, env } = context;
  
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { inputImage, style = 'id_photo', aspectRatio = '3:4', preserveIdentity = true } = await request.json();

    if (!inputImage) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '입력 이미지가 필요합니다' 
      }), { status: 400, headers: corsHeaders });
    }

    // API 키 확인
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API 키가 설정되지 않았습니다' 
      }), { status: 500, headers: corsHeaders });
    }

    // Base64 파싱
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;

    // 프롬프트 구성
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
    const instruction = preserveIdentity 
      ? `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}`
      : `[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}`;

    // Google AI Studio API 호출 (gemini-3-pro-image-preview)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: instruction }
            ]
          }],
          generationConfig: {
            responseModalities: ["image", "text"],
            imagenConfig: { aspectRatio }
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API 오류: ${response.status}`);
    }

    const data = await response.json();
    
    // 이미지 추출
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
    }

    const resultImage = `data:image/png;base64,${imagePart.inlineData.data}`;

    return new Response(JSON.stringify({
      success: true,
      image: resultImage,
      metadata: {
        style,
        aspectRatio,
        identityPreserved: preserveIdentity,
        model: 'gemini-2.0-flash-exp'
      }
    }), { headers: corsHeaders });

  } catch (error) {
    console.error('Worker Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500, headers: corsHeaders });
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
