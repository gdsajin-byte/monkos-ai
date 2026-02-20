// CF Pages Function — AI 코칭 (Gemini REST 직접 호출)
// 서버(idphoto-kr) 경유 없이 CF → Gemini API 직접
// GEMINI_API_KEY: CF Pages 환경변수 (wrangler pages secret put)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const COACHING_INSTRUCTIONS = {
  id_photo: `몽코스 AI 코치입니다. 여권/증명사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (무표정 또는 자연스러운 미소)
4. 눈썹이 보이는지 (앞머리로 가리면 안됨)
5. 얼굴 라인이 드러나는지 (헤어로 덮으면 안됨)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`,

  resume: `몽코스 AI 코치입니다. 이력서 사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (자연스럽고 호감가는 미소)
4. 자세 (허리 펴고, 어깨 수평)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`,
};

// 긍정 키워드 (ready 판정용 — 서버 사이드)
const READY_KEYWORDS = ['좋아요', '완벽', '촬영하세요', 'OK', '좋습니다', '잘 맞', '훌륭', '지금'];

export async function onRequestPost(context) {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY 미설정' }, 500);
  }

  try {
    const body = await context.request.json();
    const { image, style } = body;

    if (!image) {
      return jsonResponse({ error: 'image 필수' }, 400);
    }

    const instruction = COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: instruction }],
        },
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: image } },
            { text: '이 사진의 자세, 조명, 표정을 체크해주세요.' },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 50,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API 에러:', geminiRes.status, errText);
      return jsonResponse({ error: 'AI 응답 실패', status: geminiRes.status }, 500);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const ready = READY_KEYWORDS.some(kw => text.includes(kw));

    return jsonResponse({ text, ready });

  } catch (err) {
    console.error('Coaching function 에러:', err);
    return jsonResponse({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
