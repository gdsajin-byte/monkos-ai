// CF Workers — 촬영본 사전분석 (Gemini Flash 직접 호출)
// 프록시 제거, 자체 엔진

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const PRECHECK_PROMPT = `이 사진이 증명사진 원본으로 적합한지 분석해 주세요.

[체크 항목]
1. 얼굴 감지: 얼굴이 1개 명확하게 보이는가?
2. 정면성: 정면을 보고 있는가? (좌우 기울기, 고개 숙임/들림)
3. 조명: 얼굴에 심한 그림자나 역광이 없는가?
4. 선명도: 흔들림 없이 선명한가?
5. 얼굴 크기: 프레임 대비 얼굴이 충분히 큰가? (최소 20%)
6. 표정: 무표정 또는 자연스러운 미소인가?
7. 눈: 눈을 감지 않았는가?

[응답 형식 — JSON만 출력]
{ "suitable": true, "score": 85, "face_detected": true, "issues": [], "suggestion": "한줄 조언" }
suitable: 70 이상이면 true. issues: 문제 목록 배열.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API 키 미설정' }), { status: 500, headers: CORS });
    }

    const body = await request.json();
    const { image } = body;

    if (!image) {
      return new Response(JSON.stringify({ error: '이미지가 필요합니다' }), { status: 400, headers: CORS });
    }

    // data: prefix 제거
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { data: base64Data, mimeType: 'image/png' } },
              { text: PRECHECK_PROMPT },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API 오류:', errorText);
      throw new Error(`API 오류: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const textPart = data.candidates?.[0]?.content?.parts?.find(p => p.text);

    if (!textPart?.text) {
      throw new Error('분석 결과 없음');
    }

    let result;
    try {
      result = JSON.parse(textPart.text);
    } catch {
      result = { suitable: false, score: 0, face_detected: false, issues: ['분석 파싱 실패'], suggestion: '다시 시도해 주세요' };
    }

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    console.error('precheck 오류:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
