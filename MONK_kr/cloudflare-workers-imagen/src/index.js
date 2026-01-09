/**
 * MONK Imagen 4.0 Proxy - Cloudflare Worker
 * Google AI Studio Imagen 4.0 API 연동
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST 요청만 지원합니다' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { prompt, aspectRatio = '1:1', style = 'realistic' } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: '프롬프트를 입력하세요' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'API 키가 설정되지 않았습니다',
          message: 'Cloudflare Dashboard에서 GEMINI_API_KEY를 설정하세요'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 스타일별 프롬프트 강화
      const stylePrompts = {
        realistic: 'photorealistic, high quality, detailed, 8K resolution',
        artistic: 'artistic painting style, creative composition, vibrant colors',
        anime: 'anime style, manga illustration, cel-shaded',
        '3d': '3D rendered, CGI, octane render, realistic lighting and shadows'
      };

      const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.realistic}`;

      // Gemini로 프롬프트 개선 (이미지 생성 설명 포함)
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `이미지 생성 프롬프트를 개선해주세요. 원본: "${enhancedPrompt}". 더 자세하고 시각적인 설명으로 바꿔주세요. 한국어로 200자 이내.`
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 200
            }
          })
        }
      );

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API 오류: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      const improvedPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || enhancedPrompt;

      // Google AI Studio Imagen 4.0 호출
      const imagenResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{
              prompt: improvedPrompt
            }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio
            }
          })
        }
      );

      if (!imagenResponse.ok) {
        const errorText = await imagenResponse.text();
        throw new Error(`Imagen API 오류 ${imagenResponse.status}: ${errorText}`);
      }

      const imagenData = await imagenResponse.json();
      const imageBase64 = imagenData.predictions?.[0]?.bytesBase64Encoded 
        || imagenData.generatedImages?.[0]?.image?.imageBytes
        || imagenData.images?.[0]?.imageBytes;

      if (!imageBase64) {
        console.log('Imagen Response:', JSON.stringify(imagenData));
        throw new Error(`이미지 생성 실패: ${JSON.stringify(imagenData).substring(0, 200)}`);
      }

      // Base64 이미지를 data URL로 변환
      const imageUrl = `data:image/png;base64,${imageBase64}`;

      return new Response(JSON.stringify({
        imageUrl: imageUrl,
        originalPrompt: prompt,
        improvedPrompt: improvedPrompt,
        aspectRatio: aspectRatio,
        style: style,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker Error:', error);
      
      return new Response(JSON.stringify({ 
        error: '서버 오류가 발생했습니다',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
