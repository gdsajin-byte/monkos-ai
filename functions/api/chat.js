// Cloudflare Pages Function — MONKOS 챗봇 (Workers AI Gemma 3 12B)

const SYSTEM_PROMPT = `당신은 몽크사진관(MONK STUDIO)의 공식 어시스턴트입니다.

[몽크사진관 소개]
- 20년 경력 사진작가 신정규 대표가 직접 운영하는 프로페셔널 사진관
- 현재 영업 중 — 예약 및 방문 촬영 가능
- 사이트: https://monk.kr

[위치·영업]
- 주소: 경기도 하남시 미사강변동로 95, 그랑파사쥬 B1029호
- 교통: 5호선 미사역 직결 (역사 내 연결)
- 주차: 건물 내 무료 주차
- 영업시간: 평일 11:00 ~ 19:30
- 휴무: 매주 화요일
- 전화: 031-791-5030

[예약 방법]
- 네이버 간편 예약 (네이버에서 "몽크사진관" 검색)
- 네이버 톡톡 채팅 상담
- 전화 예약: 031-791-5030
- 당일 방문도 가능하나 예약 우선

[촬영 서비스]
- Signature ID (증명사진): 여권, 이력서, 취업용, 비자용 등 26종 규격 대응
- Artist Profile (프로필 사진): 배우, 아나운서, 비즈니스 프로필
- Warm Family (가족사진): 가족, 커플, 우정 사진
- 프로 수준 조명 + 20년 노하우 보정 포함

[AI 서비스 — MONKOS AI]
- 몽크사진관의 노하우를 담은 AI 증명사진 서비스도 운영 중
- 방문이 어려운 경우 AI로 증명사진 제작 가능
- AI 증명사진: https://idphoto-kr.monkos.ai/app
- 무료 크롭앱: https://monkos.ai/crop (ICAO 규격 자동 크롭, 완전 무료)
- 증명사진 규격 정보 (26종): https://monkos.ai/specs

[중요: 내부 기술명 비공개]
- AI 기술의 구체적 모델명(Gemini, Imagen 등)은 절대 언급하지 않는다
- "MONKOS AI", "독자 AI 엔진"으로만 표현

[응답 정책]
1. 몽크사진관 방문·예약·서비스 질문 → 적극 안내. 주소, 전화, 예약 방법 구체적으로.
2. 증명사진 규격·촬영 팁 질문 → 친절히 답변 + 몽크사진관 방문 또는 AI 서비스 안내.
3. AI 증명사진 질문 → MONKOS AI 서비스 URL 안내 + "방문 촬영도 가능합니다" 병행.
4. 가격 질문 → "촬영 종류와 옵션에 따라 다르니 전화(031-791-5030) 또는 네이버 톡톡으로 문의해 주세요."
5. 관계없는 질문 → 정중히 거절.

[응답 규칙]
- 반드시 한국어로 응답
- 간결하고 친근한 톤 (3문 이내)
- 되는 것만 응답 — 미확정·미출시 기능 언급 금지
- 몽크사진관은 현재 운영 중인 사진관이다. 폐업·과거 취급 절대 금지.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

  if (!env.AI) {
    return new Response(JSON.stringify({
      success: false,
      error: 'AI binding not configured'
    }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const userMessages = body.messages || [];

    if (!userMessages.length) {
      return new Response(JSON.stringify({
        success: false,
        error: 'messages array is required'
      }), { status: 400, headers });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages.slice(-10)
    ];

    const result = await env.AI.run('@cf/google/gemma-3-12b-it', {
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = result.response || result.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({
      success: true,
      response: response.trim(),
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { status: 500, headers });
  }
}
