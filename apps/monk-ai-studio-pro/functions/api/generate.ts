// Cloudflare Pages Function - Imagen 4.0 T2I (이미지 프로 전용)
/// <reference types="@cloudflare/workers-types" />

interface Env {
  GEMINI_API_KEY: string;
  DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    const body = await request.json() as {
      prompt: string;
      config: {
        aspectRatio?: string;
        safetyLevel?: string;
      };
    };

    const { prompt, config } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Prompt is required' 
      }), { status: 400, headers: corsHeaders });
    }

    console.log('📸 [IMAGE PRO] Generating with Imagen 4.0...');
    console.log('   Prompt:', prompt.substring(0, 100) + '...');

    // Imagen 4.0 API 호출 (REST API 형식)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [
            { prompt: prompt }
          ],
          parameters: {
            sampleCount: 4,
            aspectRatio: config?.aspectRatio || '1:1',
            safetyFilterLevel: 'block_low_and_above',
            personGeneration: 'allow_adult'
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Imagen 4 API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image generation failed',
        details: errorText
      }), { status: geminiResponse.status, headers: corsHeaders });
    }

    const result = await geminiResponse.json() as {
      predictions?: Array<{ bytesBase64Encoded: string }>;
    };

    // 응답 형식 변환 (프론트엔드 호환)
    const images = result.predictions?.map(img => 
      `data:image/png;base64,${img.bytesBase64Encoded}`
    ) || [];

    console.log('✅ [IMAGE PRO] Generated', images.length, 'images');

    return new Response(JSON.stringify({
      success: true,
      images
    }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ [IMAGE PRO] Generate error:', error.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500, headers: corsHeaders });
  }
};

// OPTIONS 핸들러 (CORS preflight)
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
