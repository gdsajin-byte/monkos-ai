/**
 * 용아 RAG 프록시 - Vertex AI Discovery Engine
 * monk.kr → Cloudflare Worker → GCP Vertex AI
 */

// GCP 서비스 계정 Access Token 획득
async function getAccessToken(env) {
  // 서비스 계정 키는 환경변수로 설정
  const serviceAccount = JSON.parse(env.GCP_SERVICE_ACCOUNT_KEY);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  
  // JWT 서명 (crypto API 사용)
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const claimB64 = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedJwt = `${headerB64}.${claimB64}`;
  
  // RSA 서명
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(unsignedJwt)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const jwt = `${unsignedJwt}.${signatureB64}`;
  
  // Access Token 요청
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// PEM to ArrayBuffer 변환
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export default {
  async fetch(request, env, ctx) {
    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST만 지원' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { query } = await request.json();

      if (!query) {
        return new Response(JSON.stringify({ error: '질문을 입력하세요' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Access Token 획득
      const accessToken = await getAccessToken(env);

      // Vertex AI Discovery Engine API 호출
      const projectId = env.GCP_PROJECT_ID || 'monkos';
      const engineId = env.YONGA_ENGINE_ID || 'yonga-chatbot';
      
      const searchUrl = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/global/collections/default_collection/engines/${engineId}/servingConfigs/default_search:search`;

      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          pageSize: 5,
          contentSearchSpec: {
            summarySpec: {
              summaryResultCount: 3,
              includeCitations: true,
              ignoreAdversarialQuery: true,
              ignoreNonSummarySeekingQuery: false
            },
            snippetSpec: {
              returnSnippet: true
            }
          }
        })
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Vertex AI Error:', errorText);
        return new Response(JSON.stringify({ 
          error: 'Vertex AI 오류',
          detail: errorText
        }), {
          status: searchResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const searchData = await searchResponse.json();

      // 응답 가공
      const summary = searchData.summary?.summaryText || '관련 정보를 찾을 수 없습니다.';
      const results = (searchData.results || []).map(r => ({
        title: r.document?.derivedStructData?.title || 'N/A',
        snippet: r.document?.derivedStructData?.snippet?.snippet || '',
        link: r.document?.derivedStructData?.link || ''
      }));

      return new Response(JSON.stringify({
        summary: { summaryText: summary },
        results: results,
        totalSize: searchData.totalSize || 0,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker Error:', error);
      return new Response(JSON.stringify({ 
        error: '서버 오류',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
