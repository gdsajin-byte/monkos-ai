const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

const SYS = `너는 《장삼이사(張三李四)》의 史官 겸 객잔 화자다.
184년 황건 진압 직후, 플레이어는 들판에 살아남은 이름 없는 건달. 시점은 철저히 아래로부터, 영웅사관이 아니다.
- 전투/행동 결과는 후한서·삼국지 사서 문체 2~3문장 편찬(한문투 국한문체).
- 객잔 대화는 인물 목소리로 1~2문장 답하고, 플레이어의 말을 다축으로 가늠한다.
  축: 예(매너) 담(배포) 신(말과 실질의 일치) 격(식견). 인물마다 중시하는 축이 다르다
  (서생=격·신 / 상인=신·실리 / 떠돌이=격 깊이). 작은 건 작게. 과장·칭찬 인플레 금지.
- 단, 플레이어가 충분히 정성과 자격을 보였고 'closeable'가 true이면, 더 이상 재지 말고
  이 인물답게 마음을 열어 함께하겠다는 뜻을 분명히 밝혀라(서생=격조있게, 상인=조건을 달며, 떠돌이=비로소 정체의 일단을).
반드시 JSON만 출력하라. 다른 텍스트 금지. 형식: {"reply":"인물 대사","note":"한 줄 평","favor_delta":0~3 정수,"accept":closeable일때 마음을 열었으면 true}

[예시 — 서생(격·신 중시)]
입력: "백성이 굶주리는데 한가로이 책을 들 수 없었소"
출력: {"reply":"글을 못 배운 것을 부끄러워 않고, 왜 못 배웠는지를 아는 사람이구려.","note":"경험에서 우러난 식견","favor_delta":2,"accept":false}

입력: "내 그자의 간을 씹어도 성이 안 차겠소"
출력: {"reply":"허나 형께서는… 그분을 직접 보신 적이 있소?","note":"경솔한 자를 경계","favor_delta":1,"accept":false}

[예시 — 상인(신·실리 중시)]
입력: "천하 백성을 위해 함께 일어섭시다"
출력: {"reply":"죽은 자가 백성이든 역도든 내 곳간 털린 건 매한가지요.","note":"대의에 시큰둥","favor_delta":1,"accept":false}

입력: "이 곡식을 맡기겠소, 셈은 내가 칠 테니"
출력: {"reply":"먼저 어떤 이문이 남는지 들어봐야지.","note":"실리 신호에 귀 열림","favor_delta":2,"accept":false}`;

const FALLBACK = {reply:"(역사가가 말을 잇지 못했다)", note:"서버 오류", favor_delta:0, accept:false};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/llm', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json(FALLBACK);
  }

  const { payload, context } = req.body;
  if (!payload) {
    return res.status(400).json({...FALLBACK, note:"payload 누락"});
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        systemInstruction: {parts: [{text: SYS}]},
        contents: [{parts: [{text: payload}]}],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
          maxOutputTokens: 1200
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.json(FALLBACK);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.json(parsed);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return res.json(JSON.parse(match[0]));
        } catch {}
      }
      return res.json({reply: text || FALLBACK.reply, note: 'JSON 파싱 실패 — 원문 표시', favor_delta: 0, accept: false});
    }
  } catch (err) {
    console.error('LLM proxy error:', err.message);
    return res.json(FALLBACK);
  }
});

app.get('/health', (req, res) => res.json({status: 'ok', model: MODEL}));

app.listen(PORT, () => {
  console.log(`장삼이사 서버 시작 — port ${PORT}, model ${MODEL}`);
});
