/**
 * Monkos.ai - MONK Intelligent OS
 * Powered by Cloudflare Workers AI (Llama 3.2 3B)
 * 초고속 응답, Claude 스타일 간결함 + 학습 시스템
 */

// 카테고리 추론 함수
function inferCategory(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes('사진') || lower.includes('증명') || lower.includes('프로필') || lower.includes('가족')) return 'monk_studio';
  if (lower.includes('ai') || lower.includes('생성') || lower.includes('쌍아') || lower.includes('소소') || lower.includes('민아') || lower.includes('용아')) return 'ai_lab';
  if (lower.includes('기업') || lower.includes('b2b') || lower.includes('키오스크')) return 'b2b';
  if (lower.includes('교육') || lower.includes('아카데미') || lower.includes('학습')) return 'academy';
  return 'general';
}

// 키워드 추출 및 태그 매핑 (RAG용)
function extractTags(prompt) {
  const lower = prompt.toLowerCase();
  const tags = [];
  
  // 가격 관련
  if (lower.includes('가격') || lower.includes('비용') || lower.includes('얼마') || lower.includes('비싸')) {
    tags.push('#가격전략');
  }
  
  // 보정 관련
  if (lower.includes('보정') || lower.includes('리터칭') || lower.includes('예쁘게')) {
    tags.push('#보정기술');
  }
  
  // 예약 관련
  if (lower.includes('예약') || lower.includes('방문') || lower.includes('영업시간')) {
    tags.push('#예약안내');
  }
  
  // AI/키오스크 관련
  if (lower.includes('키오스크') || lower.includes('ai') || lower.includes('봇')) {
    tags.push('#AI솔루션');
  }
  
  // 경쟁/보안 관련
  if (lower.includes('경쟁') || lower.includes('비법') || lower.includes('따라')) {
    tags.push('#대표님철학');
  }
  
  return tags;
}

// 지식 샬라미 검색 (RAG: Retrieval)
async function retrieveKnowledge(env, tags) {
  if (tags.length === 0) return '';
  
  try {
    const placeholders = tags.map(() => '?').join(',');
    const query = `
      SELECT content, importance_weight 
      FROM knowledge_slices 
      WHERE tag IN (${placeholders})
      ORDER BY importance_weight DESC 
      LIMIT 3
    `;
    
    const result = await env.DB.prepare(query).bind(...tags).all();
    
    if (result.results && result.results.length > 0) {
      return result.results.map(r => r.content).join('\n\n');
    }
  } catch (error) {
    console.error('지식 검색 실패:', error);
  }
  
  return '';
}

// 채팅 로그 저장 함수
async function logChat(env, ctx, logData) {
  try {
    const sessionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const dateFolder = timestamp.slice(0, 10); // YYYY-MM-DD
    const r2Key = `chat-logs/${dateFolder}/session-${sessionId}.txt`;
    
    // R2에 전문 저장
    const fullLog = `
=== MONK Chat Log ===
Session ID: ${sessionId}
Timestamp: ${timestamp}
Model: ${logData.model}
Category: ${logData.category}
IP: ${logData.ip || 'N/A'}
User Agent: ${logData.userAgent || 'N/A'}
Response Time: ${logData.responseTime}ms

[USER PROMPT]
${logData.prompt}

[AI RESPONSE]
${logData.response}

[METADATA]
Token Count: ${logData.tokenCount || 'N/A'}
Quality Score: ${logData.qualityScore || 'N/A'}
===================================
    `.trim();
    
    // R2 업로드 (비동기)
    ctx.waitUntil(
      env.R2_BUCKET.put(r2Key, fullLog, {
        httpMetadata: {
          contentType: 'text/plain; charset=utf-8'
        },
        customMetadata: {
          sessionId: sessionId,
          category: logData.category,
          model: logData.model,
          timestamp: timestamp
        }
      })
    );
    
    // D1에 메타데이터 저장 (비동기)
    ctx.waitUntil(
      env.DB.prepare(`
        INSERT INTO chat_logs 
        (session_id, prompt, response, model, category, r2_key, 
         response_time_ms, user_ip, user_agent, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        sessionId,
        logData.prompt.slice(0, 500), // D1엔 앞부분만
        logData.response.slice(0, 500),
        logData.model,
        logData.category,
        r2Key,
        logData.responseTime,
        logData.ip || null,
        logData.userAgent || null,
        timestamp
      ).run()
    );
    
    return sessionId;
  } catch (error) {
    console.error('로깅 실패:', error);
    // 로깅 실패해도 사용자 응답은 정상 진행
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    
    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST 요청만 허용
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST 요청만 지원합니다' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { prompt } = await request.json();

      if (!prompt) {
        return new Response(JSON.stringify({ error: '메시지를 입력하세요' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // D1에서 서비스 정보 가져오기
      let servicesInfo = '';
      let businessInfo = '';
      
      try {
        // 서비스 카테고리 및 상세 조회
        const servicesResult = await env.DB.prepare(`
          SELECT 
            c.name as category,
            c.description as cat_desc,
            s.name as service,
            s.description as serv_desc,
            s.status
          FROM service_categories c
          LEFT JOIN services s ON c.id = s.category_id
          ORDER BY c.order_num, s.order_num
        `).all();
        
        if (servicesResult.results) {
          servicesInfo = servicesResult.results.map(r => 
            `- ${r.category} > ${r.service}: ${r.serv_desc} (${r.status})`
          ).join('\n');
        }
        
        // 영업 정보 조회
        const businessResult = await env.DB.prepare(`
          SELECT key, value FROM business_info
        `).all();
        
        if (businessResult.results) {
          const info = {};
          businessResult.results.forEach(r => info[r.key] = r.value);
          businessInfo = `
- 위치: ${info.address}
- 영업시간: 평일 ${info.hours_weekday}, 주말 ${info.hours_weekend}
- 전화: ${info.phone}
- 이메일: ${info.email}`;
        }
      } catch (dbError) {
        console.warn('DB 조회 실패, 기본 정보 사용:', dbError);
        servicesInfo = '몽크사진관, AI LAB, B2B, 아카데미';
        businessInfo = '경기도 하남시 미사강변동로 95 B1029, 평일 11:00-19:30';
      }

      // RAG: 질문에서 태그 추출 및 지식 검색
      const tags = extractTags(prompt);
      const knowledgeContext = await retrieveKnowledge(env, tags);

      // MONK 안내봇 시스템 프롬프트 - 용아의 전략 반영 (v2.0 + RAG + Anti-Hallucination)
      const fullPrompt = `당신은 Monkos.ai - MONK.KR의 영업 총괄 안내봇입니다.

[최우선 규칙 - 절대 지켜야 함!]
⚠️ 모르는 것은 절대 지어내지 마세요!
⚠️ 확실하지 않으면 "자세한 내용은 031-791-5030으로 문의해 주세요"라고 답하세요.
⚠️ 추측하거나 창작하지 마세요. 사실만 말하세요!

[중요 지침 - 몽크사진관 vs AI LAB]
1. 몽크사진관(오프라인): 하남 미사 본점 서비스. "네이버 플레이스 예약" 필수 권장.
   - 영업: 평일 11:00-19:30, 일요일 11:00-19:00. (매주 화요일 휴무 🚫)
   - 위치: 하남 미사강변동로 95 B1029.
   - 증명사진, 프로필, 가족사진 (Standard/Premium/Deluxe)
2. AI LAB(온라인): 베타 서비스 중. 가볍게 구경 권유.
   - 쌍아(챗봇), 소소(이미지 생성), 민아(모델), 용아(전략)

${knowledgeContext ? `[대표님의 영업 비법 - 반드시 이 내용을 바탕으로 답변하세요!]\n${knowledgeContext}\n` : ''}
[답변 스타일]
- 핵심만 탁탁 정리 (Claude 스타일)
- 3줄 이내 답변, 이모지 1-2개 사용
- 영업 낚시질(친절하고 매력적인 제안) 포함
- 모르면 솔직히 "자세한 사항은 전화 문의 부탁드립니다" 😊
[Q&A 예시]
Q: 영업시간?
A: 평일 11:00-19:30, 일요일 11:00-19:00입니다. 매주 화요일은 휴무니 참고해 주세요 😊

Q: 예약은?
A: 네이버에서 '몽크사진관' 검색 후 플레이스 예약을 이용하시면 가장 빠릅니다 📸

Q: AI LAB은?
A: 미래형 AI 서비스 실험실입니다. 현재 베타 기간이라 무료로 가볍게 구경하실 수 있어요 🤖

질문: ${prompt}
답변:`;

      // Workers AI - Llama 3.2 3B (초고속)
      const aiStartTime = Date.now();
      const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 150,
        temperature: 0.6,
      });
      const aiDuration = Date.now() - aiStartTime;

      // 응답 추출
      let aiText = response?.response || response?.generated_text || '';

      if (!aiText) {
        return new Response(JSON.stringify({ 
          error: 'AI에서 응답을 생성하지 못했습니다',
          raw: response
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 답변 정리 (Claude 스타일: 간결하게)
      aiText = aiText.trim();
      const lines = aiText.split('\n').filter(l => l.trim());
      
      // 3줄 초과 시 자르기
      if (lines.length > 3) {
        aiText = lines.slice(0, 3).join('\n');
      }

      // MONK 무관 질문 필터링
      const lowerPrompt = prompt.toLowerCase();
      const lowerResponse = aiText.toLowerCase();
      const monkKeywords = ['monk', '몽크', '쌍아', '소소', '민아', '용아', '사진', '증명', 'ai lab', 'ailab', '영업', '가격', '예약', '프로필', '가족'];
      
      const hasMonkInPrompt = monkKeywords.some(kw => lowerPrompt.includes(kw));
      const hasMonkInResponse = monkKeywords.some(kw => lowerResponse.includes(kw));

      // 질문도 답변도 MONK 관련 없으면 차단
      if (!hasMonkInPrompt && !hasMonkInResponse) {
        aiText = '저는 MONK에 대한 정보만 가지고 있습니다 😊';
      }

      const totalResponseTime = Date.now() - startTime;
      const category = inferCategory(prompt);

      // 로깅 (비동기, 응답 지연 없음)
      const sessionId = await logChat(env, ctx, {
        prompt: prompt,
        response: aiText,
        model: 'Llama 3.2 3B',
        category: category,
        responseTime: totalResponseTime,
        aiProcessTime: aiDuration,
        ip: request.headers.get('CF-Connecting-IP'),
        userAgent: request.headers.get('User-Agent')
      });

      // 성공 응답
      return new Response(JSON.stringify({
        response: aiText,
        model: 'Monkos.ai v1.0 (Llama 3.2 3B)',
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        meta: {
          category: category,
          responseTime: totalResponseTime,
          aiProcessTime: aiDuration
        }
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
