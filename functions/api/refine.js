// Cloudflare Pages Function - I2I/Edit/Upscale (gemini-3-pro-image-preview)
// ⚠️ photolab 검증 방식 적용 (2026-01-22)

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
    const { prompt, config, inputImage, mode } = body;

    if (!inputImage) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Input image is required' 
      }), { status: 400, headers: corsHeaders });
    }

    console.log('🎨 [IMAGE PRO] Refining with Gemini 3 Pro...');
    console.log('   Mode:', mode);

    // Base64 데이터 추출
    const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    // 모드별 instruction 생성
    let instruction = '';
    switch(mode) {
      case 'UPSCALE':
        instruction = `[STRICT 4K RECONSTRUCTION] Perform high-fidelity super-resolution on this image. Target 4K resolution. Enhance details, textures, and edges while perfectly preserving the original artistic intent. ${prompt || ''}`;
        break;
      case 'EDIT':
        instruction = `[NEURAL EDITING] Modify the provided image based on these specific instructions: ${prompt}. Blend changes seamlessly.`;
        break;
      case 'I2I':
      default:
        instruction = `[IMAGE-TO-IMAGE TRANSFORM] Using the provided image as a structural and thematic foundation, synthesize a new high-quality image. Prompt: ${prompt}`;
        break;
    }

    const aspectRatio = config?.aspectRatio || '1:1';

    // Gemini 3 Pro Image Preview - photolab 검증 방식
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${env.GEMINI_API_KEY}`,
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
        error: 'Image refinement failed',
        details: errorText
      }), { status: geminiResponse.status, headers: corsHeaders });
    }

    const result = await geminiResponse.json();
    
    // 응답에서 이미지 추출
    let resultImage = null;
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const imgMimeType = part.inlineData.mimeType || 'image/png';
          resultImage = `data:${imgMimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    
    if (!resultImage) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No image in response. The model might have declined the request.'
      }), { status: 500, headers: corsHeaders });
    }

    console.log('✅ [IMAGE PRO] Image refined successfully');

    return new Response(JSON.stringify({
      success: true,
      image: resultImage
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('❌ [IMAGE PRO] Refine error:', error.message);
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
