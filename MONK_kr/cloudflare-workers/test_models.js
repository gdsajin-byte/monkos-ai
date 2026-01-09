/**
 * Workers AI 모델 성능 테스트
 * 4개 모델 동시 비교
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

    const { prompt } = await request.json();

    const systemPrompt = `당신은 MONK.KR의 AI 어시스턴트입니다.
MONK는 몽크사진관(증명사진, 프로필, 가족사진), AI LAB(4 MUSE 시스템), B2B, 아카데미를 운영합니다.
위치: 경기도 하남시 미사강변동로 95 B1029
영업시간: 평일 11:00-19:30`;

    const models = [
      {
        id: 'gpt120b',
        name: 'GPT-OSS-120B',
        model: '@cf/openai/gpt-oss-120b',
        icon: '🦖',
        size: '120B'
      },
      {
        id: 'llama31',
        name: 'Llama 3.1 8B',
        model: '@cf/meta/llama-3.1-8b-instruct-fp8',
        icon: '🦙',
        size: '8B'
      },
      {
        id: 'gemma7b',
        name: 'Gemma 7B',
        model: '@hf/google/gemma-7b-it',
        icon: '🎀',
        size: '7B'
      },
      {
        id: 'llama32',
        name: 'Llama 3.2 3B',
        model: '@cf/meta/llama-3.2-3b-instruct',
        icon: '🐑',
        size: '3B'
      }
    ];

    const results = await Promise.all(
      models.map(async (modelInfo) => {
        const startTime = Date.now();
        
        try {
          let response;
          
          // 모델별 프롬프트 형식 조정
          if (modelInfo.id === 'gemma7b') {
            response = await env.AI.run(modelInfo.model, {
              prompt: `${systemPrompt}\n\n사용자: ${prompt}\n\n답변:`,
              max_tokens: 256,
              temperature: 0.7,
            });
          } else {
            response = await env.AI.run(modelInfo.model, {
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              max_tokens: 256,
              temperature: 0.7,
            });
          }

          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);

          return {
            ...modelInfo,
            response: response?.response || response?.generated_text || '응답 없음',
            duration: `${duration}초`,
            success: true,
            timestamp: new Date().toISOString()
          };

        } catch (error) {
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);

          return {
            ...modelInfo,
            response: `오류: ${error.message}`,
            duration: `${duration}초`,
            success: false,
            error: error.message
          };
        }
      })
    );

    return new Response(JSON.stringify({
      prompt: prompt,
      results: results,
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
