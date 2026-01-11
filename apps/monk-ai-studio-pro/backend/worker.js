/**
 * MONK AI Studio Pro - Cloudflare Worker Backend
 * 모든 API 요청을 처리하는 완전한 백엔드
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    try {
      // Health check
      if (url.pathname === '/health') {
        return jsonResponse({ status: 'ok', message: 'MONK AI Studio Pro Backend' }, corsHeaders);
      }

      // API 키 확인
      if (!env.GEMINI_API_KEY) {
        return jsonResponse({ 
          success: false, 
          error: 'API 키가 설정되지 않았습니다' 
        }, corsHeaders, 500);
      }

      // 라우팅
      if (url.pathname === '/api/generate') {
        return await handleGenerate(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/refine') {
        return await handleRefine(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/analyze') {
        return await handleAnalyze(request, env, corsHeaders);
      }

      return jsonResponse({ 
        success: false, 
        error: 'Endpoint not found' 
      }, corsHeaders, 404);

    } catch (error) {
      console.error('Worker Error:', error);
      return jsonResponse({ 
        success: false, 
        error: error.message 
      }, corsHeaders, 500);
    }
  }
};

// 1. 이미지 생성 (T2I - Imagen 4.0)
async function handleGenerate(request, env, corsHeaders) {
  try {
    const { prompt, config } = await request.json();
    
    console.log('📸 Generating with Imagen 4.0...');
    
    // Vertex AI Imagen 4.0 API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          prompt: prompt,
          numberOfImages: 4,
          aspectRatio: config.aspectRatio || '1:1'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 이미지 변환
    const images = (data.generatedImages || []).map(img => 
      `data:image/png;base64,${img.image.imageBytes}`
    );

    console.log('✅ Generated', images.length, 'images');

    return jsonResponse({
      success: true,
      images
    }, corsHeaders);

  } catch (error) {
    console.error('❌ Generation error:', error);
    return jsonResponse({ 
      success: false, 
      error: error.message 
    }, corsHeaders, 500);
  }
}

// 2. 이미지 변주/편집 (I2I - Imagen 3 Pro)
async function handleRefine(request, env, corsHeaders) {
  try {
    const { prompt, config, inputImage, mode } = await request.json();
    
    console.log('🎨 Refining with Imagen 3 Pro...');
    console.log('   Mode:', mode);
    
    // Base64 데이터 추출
    const base64Data = inputImage.includes(',') 
      ? inputImage.split(',')[1] 
      : inputImage;
    
    // 모드별 instruction
    let instruction = '';
    switch(mode) {
      case 'UPSCALE':
        instruction = `[4K UPSCALE] Enhance this image to 4K resolution with perfect detail preservation. ${prompt}`;
        break;
      case 'EDIT':
        instruction = `[EDIT] Modify this image: ${prompt}`;
        break;
      case 'I2I':
      default:
        instruction = `[VARIATION] Create a variation of this image. ${prompt}`;
        break;
    }
    
    // Gemini Vision API로 이미지 처리
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`,
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
                  mimeType: 'image/png',
                  data: base64Data
                }
              },
              { text: instruction }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 이미지 데이터 추출
    const part = data.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) {
      throw new Error('No image data in response');
    }
    
    const resultImage = `data:image/png;base64,${part.inlineData.data}`;
    
    console.log('✅ Image refined');

    return jsonResponse({
      success: true,
      image: resultImage
    }, corsHeaders);

  } catch (error) {
    console.error('❌ Refinement error:', error);
    return jsonResponse({ 
      success: false, 
      error: error.message 
    }, corsHeaders, 500);
  }
}

// 3. 이미지 분석 (Gemini Vision)
async function handleAnalyze(request, env, corsHeaders) {
  try {
    const { imageData } = await request.json();
    
    console.log('🧠 Analyzing image...');
    
    const base64Data = imageData.includes(',') 
      ? imageData.split(',')[1] 
      : imageData;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`,
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
                  mimeType: 'image/png',
                  data: base64Data
                }
              },
              { 
                text: 'Analyze this image and provide: 1) Detailed English prompt to recreate it, 2) Artistic style description, 3) Technical tags. Respond in JSON format with keys: prompt, style, tags (array).' 
              }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analysis Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const analysis = JSON.parse(analysisText);
    
    console.log('✅ Analysis complete');

    return jsonResponse({
      success: true,
      analysis
    }, corsHeaders);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return jsonResponse({ 
      success: false, 
      error: error.message 
    }, corsHeaders, 500);
  }
}

// Helper: JSON Response
function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
