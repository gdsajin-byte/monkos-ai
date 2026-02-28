// Cloudflare Pages Function - Imagen 4.0 T2I (이미지 프로 전용)
// → monk-image-engine (Cloud Run + Vertex AI ADC) 프록시
// BLOCK_NONE은 Vertex AI ADC에서만 안정 동작

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = await context.request.json();
    const { prompt, config, model } = body;

    if (!prompt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt is required'
      }), { status: 400, headers: corsHeaders });
    }

    console.log('📸 [IMAGE PRO] Generating via monk-image-engine (Vertex AI)...');
    console.log('   Prompt:', prompt.substring(0, 100) + '...');

    // monk-image-engine (Cloud Run + Vertex AI ADC + block_none)
    const engineResponse = await fetch('https://image.monkos.ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        model: model || 'fast',
        aspectRatio: config?.aspectRatio || '1:1',
        safetyFilterLevel: 'block_none',
        personGeneration: 'allow_all'
      })
    });

    if (!engineResponse.ok) {
      const errorText = await engineResponse.text();
      console.error('❌ monk-image-engine error:', errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Image generation failed',
        details: errorText
      }), { status: engineResponse.status, headers: corsHeaders });
    }

    const result = await engineResponse.json();

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Generation failed'
      }), { status: 500, headers: corsHeaders });
    }

    // 응답 변환: engine { images: [{ base64 }] } → 프론트 { images: ["data:..."] }
    const images = (result.images || []).map(img =>
      typeof img === 'string' ? img : `data:image/jpeg;base64,${img.imageBase64 || img.base64}`
    );

    console.log('✅ [IMAGE PRO] Generated', images.length, 'images via Vertex AI');

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
