// Cloudflare Pages Function - Gemini Vision Analysis (이미지 프로 전용)

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
    const { imageData } = body;

    if (!imageData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image data is required' 
      }), { status: 400, headers: corsHeaders });
    }

    console.log('🧠 [IMAGE PRO] Analyzing with Gemini Vision...');

    // Base64 데이터 추출
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const mimeTypeMatch = imageData.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    // Gemini Vision API 호출
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                inlineData: { 
                  data: base64Data, 
                  mimeType: mimeType 
                } 
              },
              { 
                text: `Perform a deep neural analysis of this image. Provide:
1. A detailed English prompt that could recreate this image
2. A description of its artistic style, lighting, and mood
3. Key technical metadata tags

Respond ONLY in valid JSON format with this exact structure:
{
  "prompt": "detailed recreation prompt here",
  "style": "style and lighting description here", 
  "tags": ["tag1", "tag2", "tag3"]
}`
              }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini Vision API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image analysis failed',
        details: errorText
      }), { status: geminiResponse.status, headers: corsHeaders });
    }

    const result = await geminiResponse.json();
    const candidates = result.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const textPart = parts.find(p => p.text);
    
    if (!textPart || !textPart.text) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No analysis in response'
      }), { status: 500, headers: corsHeaders });
    }

    // JSON 파싱
    let analysis;
    try {
      analysis = JSON.parse(textPart.text);
    } catch (e) {
      // JSON 파싱 실패 시 텍스트 그대로 반환
      analysis = {
        prompt: textPart.text,
        style: 'Unable to parse',
        tags: []
      };
    }

    console.log('✅ [IMAGE PRO] Analysis complete');

    return new Response(JSON.stringify({
      success: true,
      analysis
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ [IMAGE PRO] Analysis error:', error.message);
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
