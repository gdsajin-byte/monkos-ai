/**
 * MONK Imagen Proxy - Cloudflare Worker (Vertex AI)
 *
 * 지원 모드:
 * - t2i: Vertex AI Imagen 4.0 (imagen-4.0-generate-001) - 고화질
 * - i2i: Vertex AI Gemini 2.5 Flash Image (gemini-2.5-flash-image) - 지능형
 *
 * 필요한 환경 변수:
 * - GCP_PROJECT_ID: Google Cloud 프로젝트 ID
 * - GCP_LOCATION: 리전 (예: us-central1)
 * - GCP_SERVICE_ACCOUNT_KEY: Service Account JSON Base64
 * - GEMINI_API_KEY: 프롬프트 개선용 (선택)
 */

// JWT 생성 헬퍼 함수 (Service Account 인증)
async function createJWT(serviceAccountKey) {
  const serviceAccount = JSON.parse(serviceAccountKey);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };

  // Base64 URL 인코딩
  const base64url = (str) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // RSA-SHA256 서명
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64url(String.fromCharCode(...new Uint8Array(signature)));

  return `${signatureInput}.${encodedSignature}`;
}

// PEM을 바이너리로 변환
function pemToBinary(pem) {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Access Token 획득
async function getAccessToken(jwt) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`토큰 획득 실패: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

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
      const { prompt, aspectRatio = '1:1', style = 'realistic', mode = 't2i', inputImage } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: '프롬프트를 입력하세요' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // i2i 모드에서는 inputImage 필수
      if (mode === 'i2i' && !inputImage) {
        return new Response(JSON.stringify({ error: 'i2i 모드에서는 inputImage가 필요합니다' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 환경 변수 확인
      if (!env.GCP_PROJECT_ID || !env.GCP_LOCATION || !env.GCP_SERVICE_ACCOUNT_KEY) {
        return new Response(JSON.stringify({
          error: 'Vertex AI 설정이 필요합니다',
          message: 'GCP_PROJECT_ID, GCP_LOCATION, GCP_SERVICE_ACCOUNT_KEY를 설정하세요'
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

      // Gemini로 프롬프트 개선 (Google AI Studio API 사용 - 무료)
      let improvedPrompt = enhancedPrompt;

      if (env.GEMINI_API_KEY) {
        try {
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

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            improvedPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || enhancedPrompt;
          }
        } catch (err) {
          console.log('Gemini 개선 실패, 원본 사용:', err.message);
        }
      }

      // Service Account JWT 생성
      const serviceAccountKey = atob(env.GCP_SERVICE_ACCOUNT_KEY);
      const jwt = await createJWT(serviceAccountKey);
      const accessToken = await getAccessToken(jwt);

      let imageBase64;

      if (mode === 'i2i') {
        // ========== I2I: Vertex AI (gemini-2.5-flash-image) ==========
        const geminiEndpoint = `https://${env.GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GCP_PROJECT_ID}/locations/${env.GCP_LOCATION}/publishers/google/models/gemini-2.5-flash-image:generateContent`;

        // inputImage에서 base64 데이터 추출
        const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
        const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;

        // I2I 인스트럭션 생성
        const i2iInstruction = `[IMAGE-TO-IMAGE TRANSFORM] Using the provided image as a structural and thematic foundation, synthesize a new high-quality image. Maintain the identity and key features of the subject. Prompt: ${improvedPrompt}`;

        const geminiResponse = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'MONKOS-ImagePro/1.0',
            'X-Goog-User-Project': env.GCP_PROJECT_ID
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: i2iInstruction }
              ]
            }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
              temperature: 0.8
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' }
            ]
          })
        });

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          throw new Error(`Vertex AI Gemini 오류 ${geminiResponse.status}: ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        imageBase64 = imagePart?.inlineData?.data;

        if (!imageBase64) {
          console.log('Gemini I2I Response:', JSON.stringify(geminiData));
          throw new Error(`I2I 이미지 생성 실패: ${JSON.stringify(geminiData).substring(0, 200)}`);
        }

      } else {
        // ========== T2I: Imagen 4.0 (imagen-4.0-generate-001) ==========
        const imagenEndpoint = `https://${env.GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GCP_PROJECT_ID}/locations/${env.GCP_LOCATION}/publishers/google/models/imagen-4.0-generate-001:predict`;

        const imagenResponse = await fetch(imagenEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instances: [{
              prompt: improvedPrompt
            }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio
            }
          })
        });

        if (!imagenResponse.ok) {
          const errorText = await imagenResponse.text();
          throw new Error(`Vertex AI Imagen 오류 ${imagenResponse.status}: ${errorText}`);
        }

        const imagenData = await imagenResponse.json();
        imageBase64 = imagenData.predictions?.[0]?.bytesBase64Encoded;

        if (!imageBase64) {
          console.log('Vertex AI Response:', JSON.stringify(imagenData));
          throw new Error(`이미지 생성 실패: ${JSON.stringify(imagenData).substring(0, 200)}`);
        }
      }

      // Base64 이미지를 data URL로 변환
      const imageUrl = `data:image/png;base64,${imageBase64}`;

      return new Response(JSON.stringify({
        imageUrl: imageUrl,
        originalPrompt: prompt,
        improvedPrompt: improvedPrompt,
        aspectRatio: aspectRatio,
        style: style,
        mode: mode,
        model: mode === 'i2i' ? 'gemini-2.5-flash-image' : 'imagen-4.0-generate-001',
        api: 'vertex-ai',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker Error:', error);

      return new Response(JSON.stringify({
        error: '서버 오류가 발생했습니다',
        message: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
