// Cloudflare Pages Function - T2I (gemini-3-pro-image-preview)
// ⚠️ 임시: Imagen 4.0 REST API deprecated → Gemini 3 Pro로 대체
// TODO: MONKOS.AI에서 Cloud Run + SDK로 Imagen 4.0 복구 예정

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { request, env } = context;
    
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'API key not configured' 
      }), { status: 500, headers: corsHeaders });
    }

    const body = await request.json();
    const { prompt, config } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Prompt is required' 
      }), { status: 400, headers: corsHeaders });
    }

    console.log('📸 [IMAGE PRO] Generating with Gemini 3 Pro...');
    console.log('   Prompt:', prompt.substring(0, 100) + '...');

    const aspectRatio = config?.aspectRatio || '1:1';

    // Gemini 3 Pro Image Preview - T2I (photolab 검증 방식)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            imageConfig: { 
              aspectRatio: aspectRatio 
            }
          },
          // BLOCK_NONE - photolab 검증 (정체성 유지 핵심)
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image generation failed',
        details: errorText
      }), { status: geminiResponse.status, headers: corsHeaders });
    }

    const result = await geminiResponse.json();

    // 응답에서 이미지 추출 (Gemini generateContent 형식)
    const images = [];
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          images.push(`data:${mimeType};base64,${part.inlineData.data}`);
        }
      }
    }

    console.log('✅ [IMAGE PRO] Generated', images.length, 'images');

    return new Response(JSON.stringify({
      success: true,
      images
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ [IMAGE PRO] Generate error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500, headers: corsHeaders });
  }
}

// OPTIONS 핸들러 (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
