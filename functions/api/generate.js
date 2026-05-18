// Cloudflare Pages Function - Gemini Image Generation (이미지 프로 전용)
// monk.kr 독립 — Gemini API 직접 호출 (monkos.ai 교차 호출 제거)

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

    console.log('📸 [IMAGE PRO] Generating via Gemini API (독립)...');
    console.log('   Prompt:', prompt.substring(0, 100) + '...');

    const apiKey = env.GEMINI_API_KEY;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `[HIGH-QUALITY IMAGE GENERATION] Generate a professional, high-resolution image based on the following prompt. Style: photography. Aspect ratio: ${config?.aspectRatio || '1:1'}. Prompt: ${prompt}` }
            ]
          }],
          generationConfig: {
            imageConfig: {}
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ],
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
    const candidates = result.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const imageParts = parts.filter(p => p.inlineData);

    if (imageParts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image in response. The model might have declined the request.'
      }), { status: 500, headers: corsHeaders });
    }

    const images = imageParts.map(p =>
      `data:image/png;base64,${p.inlineData.data}`
    );

    console.log('✅ [IMAGE PRO] Generated', images.length, 'images via Gemini API');

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
