// Cloudflare Pages Function - Gemini Translation (이미지 프로 분석 번역)

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

    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return new Response(JSON.stringify({
        success: false,
        error: 'text and targetLang are required'
      }), { status: 400, headers: corsHeaders });
    }

    const langNames = {
      KO: 'Korean', JA: 'Japanese', ZH: 'Chinese',
      ES: 'Spanish', FR: 'French', DE: 'German',
      PT: 'Portuguese', AR: 'Arabic', TH: 'Thai'
    };

    const langName = langNames[targetLang] || targetLang;

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following image analysis text to ${langName}. Keep technical terms and proper nouns as-is. Return ONLY the translated text, no explanation.\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(JSON.stringify({
        success: false,
        error: 'Translation failed',
        details: errorText
      }), { status: geminiResponse.status, headers: corsHeaders });
    }

    const result = await geminiResponse.json();
    const translated = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({
      success: true,
      translated
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
