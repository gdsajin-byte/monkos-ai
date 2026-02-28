// CF Pages Function — AI 코칭 (Gemini REST 직접 호출)
// 서버(idphoto-kr) 경유 없이 CF → Gemini API 직접
// GEMINI_API_KEY: CF Pages 환경변수 (wrangler pages secret put)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

// ─── 동적 프롬프트 빌더 (9필드 활용) ───
function buildCoachingPrompt(body) {
  const { style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = body;

  const base = COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo;

  // 9필드 컨텍스트 추가
  const context = [];

  if (clothing && clothing !== 'as_is') {
    const clothingNames = { suit: '정장', shirt: '셔츠/블라우스', casual: '캐주얼', uniform: '교복' };
    context.push(`사용자 의상: ${clothingNames[clothing] || clothing}`);
    if (clothingColor) {
      const colorNames = { black: '검정', navy: '네이비', charcoal: '차콜', white: '흰색', beige: '베이지', wine: '와인', pastel: '파스텔' };
      context.push(`의상 컬러: ${colorNames[clothingColor] || clothingColor}`);
    }
  }

  if (tie && tie !== 'none' && gender === 'male') {
    const tieNames = {
      solid_navy: '무지 네이비', solid_wine: '무지 와인',
      stripe_blue: '스트라이프 블루', stripe_navy: '스트라이프 네이비', stripe_wine: '스트라이프 와인',
    };
    context.push(`넥타이: ${tieNames[tie] || '착용 예정'}`);
  }

  if (hair && hair !== 'as_is') {
    const hairNames = { tidy: '정돈', up: '올림머리', down: '내림머리' };
    context.push(`헤어 스타일: ${hairNames[hair] || hair}`);
  }

  if (expression) {
    const exprNames = { gentle_smile: '잔잔한 미소', neutral: '무표정', natural_smile: '자연스러운 미소', bright_smile: '밝은 미소' };
    context.push(`목표 표정: ${exprNames[expression] || expression}`);
  }

  if (context.length === 0) return base;

  return base + `\n\n[사용자 설정]\n${context.join('\n')}\n\n위 설정을 참고하여 촬영 전 코칭해 주세요. 의상이나 표정에 대한 구체적인 조언도 가능합니다.`;
}

export async function onRequestPost(context) {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY 미설정' }, 500);
  }

  try {
    const body = await context.request.json();
    const { image } = body;

    if (!image) {
      return jsonResponse({ error: 'image 필수' }, 400);
    }

    const instruction = buildCoachingPrompt(body);

    const geminiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: instruction }],
        },
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: image } },
            { text: '이 사진의 자세, 조명, 표정을 체크해주세요.' },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API 에러:', geminiRes.status, errText);
      // 모델 전환 실패 시 빈 응답 반환 (코칭 루프 중단하지 않음)
      return jsonResponse({ text: '', ready: false, error: `Gemini ${geminiRes.status}` });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const ready = READY_KEYWORDS.some(kw => text.includes(kw));

    return jsonResponse({ text, ready });

  } catch (err) {
    console.error('Coaching function 에러:', err);
    return jsonResponse({ text: '', ready: false });
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
