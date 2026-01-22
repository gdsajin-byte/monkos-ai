// Cloudflare Pages Function - Imagen 3 Pro I2I/Edit/Upscale (이미지 프로 전용)
/// <reference types="@cloudflare/workers-types" />

interface Env {
  GEMINI_API_KEY: string;
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
        imageSize?: string;
        safetyLevel?: string;
      };
      inputImage: string;
      mode: 'I2I' | 'EDIT' | 'UPSCALE';
    };

    const { prompt, config, inputImage, mode } = body;

    if (!inputImage) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Input image is required' 
      }), { status: 400, headers: corsHeaders });
    }

    console.log('🎨 [IMAGE PRO] Refining with Imagen 3 Pro...');
    console.log('   Mode:', mode);

    // Base64 데이터 추출
    const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    // 모드별 instruction 생성
    let instruction = '';
    switch(mode) {
      case 'UPSCALE':
        instruction = `[STRICT 4K RECONSTRUCTION] Perform high-fidelity super-resolution on this image. Target 4K resolution. Enhance details, textures, and edges while perfectly preserving the original artistic intent. ${prompt}`;
        break;
      case 'EDIT':
        instruction = `[NEURAL EDITING] Modify the provided image based on these specific instructions: ${prompt}. Blend changes seamlessly.`;
        break;
      case 'I2I':
      default:
        instruction = `[IMAGE-TO-IMAGE TRANSFORM] Using the provided image as a structural and thematic foundation, synthesize a new high-quality image. Prompt: ${prompt}`;
        break;
    }

    // Gemini 3 Pro Image Preview API 호출
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
              { text: instruction }
            ]
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'image/png'
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Image refinement failed',
        details: errorText
      }), { status: geminiResponse.status, headers: corsHeaders });
    }

    const result = await geminiResponse.json() as {
      candidates?: Array<{
        content?: {
          parts: Array<{ inlineData?: { data: string; mimeType: string } }>
        }
      }>;
    };

    const imagePart = result.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    
    if (!imagePart?.inlineData) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No image in response. The model might have declined the request.'
      }), { status: 500, headers: corsHeaders });
    }

    const resultImage = `data:image/png;base64,${imagePart.inlineData.data}`;

    console.log('✅ [IMAGE PRO] Image refined successfully');

    return new Response(JSON.stringify({
      success: true,
      image: resultImage
    }), { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ [IMAGE PRO] Refine error:', error.message);
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
