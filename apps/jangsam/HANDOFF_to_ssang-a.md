# 쌍아에게 — 장삼이사(張三李四) 로컬 모델 이관 지시서

작성: 철창 → 쌍아(Claude Code) 인수인계
환경: 아이맥(플레이/개발) + 별도 4060 PC(로컬 LLM 추론) 또는 단일 머신
목표: 현재 Anthropic API로 도는 게임 PoC를, **과금 없는 로컬 모델(Gemma)** 또는
Gemini API로 호출만 교체해 동작시킨다. 게임 로직·UI·세이브는 그대로 유지.

---

## 0. 이 게임이 뭔지 (30초 요약)

184년 황건 진압 직후, **이름 없는 건달**이 무리를 모아 한 고을 관아를 추대받아
점령하기까지가 1라운드. "아래로부터의 삼국지" — 영웅이 아니라 장삼이사(이름 없는 자)가
주인공. 핵심 매력은 **LLM이 실시간으로 써내려가는 사서(史書) 문체 서사**와
**NPC와의 정해지지 않은 대화**다.

- **낮(코드)**: 4장소(들판·객잔·시장·관가) × 막당 3걸음 행동경제. 상태/점유는 코드가 쥔다.
- **밤/대화(LLM)**: 행동 결과를 史官 문체로 편찬, NPC 대화를 다축으로 채점.
- 상세 설계는 첨부 `JangsamYisa_Round1_Spec.md` 참조.

---

## 1. 현재 코드 상태 (`jangsam_local.html`)

- React(ESM CDN) 단일 HTML. 더블클릭으로 브라우저 실행.
- `localStorage` 자동 저장(상태·야사·대화), JSON 내보내기 버튼, API키 입력창.
- LLM 호출부가 **Anthropic 형식에 묶여 있음** — 이게 교체 대상.

현재 호출부 (교체할 부분):
```js
async function llm(apiKey, payload){
  const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":apiKey,
      "anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:SYS,
      messages:[{role:"user",content:payload}]})});
  const data=await res.json();
  const t=data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
  return JSON.parse(t.replace(/```json|```/g,"").trim());
}
```
- 출력은 항상 JSON: `{reply, note, favor_delta, accept}` (대화) 또는 `{reply, note}` (서사).
- 시스템 프롬프트는 `SYS` 상수에 있음 (史官 페르소나 + 다축 채점 규칙).

---

## 2. 해야 할 일

### 2-A. 로컬 Gemma (Ollama) 우선 — 과금 0
Ollama는 OpenAI 호환 엔드포인트를 띄운다. 호출부를 아래 형식으로 교체:

```js
async function llm(endpoint, model, payload){
  const res=await fetch(endpoint+"/v1/chat/completions",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model: model,                       // 예: "gemma3:12b" — 실제 `ollama list` 태그로
      messages:[{role:"system",content:SYS},{role:"user",content:payload}],
      stream:false,
      format:"json",                      // Ollama JSON 모드 — 깨진 JSON 방지에 도움
      options:{ temperature:0.8, num_predict:1000 }  // num_predict = 출력 길이(짧으면 잘림)
    })});
  if(!res.ok) throw new Error("LLM "+res.status);
  const data=await res.json();
  const t = data.choices?.[0]?.message?.content || data.message?.content || "";
  return JSON.parse(t.replace(/```json|```/g,"").trim());
}
```

**연결 시나리오 (환경 확인 후 택1):**
- **단일 머신(4060에서 플레이)**: endpoint = `http://localhost:11434`. 네트워크 설정 불필요. 가장 쉬움.
- **아이맥 플레이 + 4060 추론**: 
  1. 4060에서 `OLLAMA_HOST=0.0.0.0` 설정 후 Ollama 재시작 (외부 접속 허용)
  2. 4060 LAN IP 확인 (`ipconfig`/`ip addr`)
  3. endpoint = `http://<4060_LAN_IP>:11434`
  4. 4060 방화벽에서 11434 포트 인바운드 허용
  5. **게임은 반드시 `file://`로 (html 더블클릭) 열 것** — https 페이지에서 http 호출은
     mixed-content 차단됨. 로컬 파일 실행이면 통과.
- **아이맥이 애플실리콘이면** 아이맥에 Ollama 직접 설치해 단일 머신 시나리오로 가는 게 제일 깔끔.

### 2-B. Gemini API 백업 (작가가 기존 챗봇 키 보유 시)
모델 문자열·엔드포인트는 **현재 Google 공식 문서에서 확인할 것**(버전이 자주 바뀜).
generativelanguage.googleapis.com 의 generateContent. system은 systemInstruction 필드로,
JSON 강제는 generationConfig.responseMimeType:"application/json" 사용.
※ 정확한 모델명("gemini-..." 문자열)은 작가 키로 접근 가능한 모델 목록을 직접 조회해 확정.

### 2-C. UI에 모델 설정 추가
기존 "API키 입력창"을 **모델 설정창**으로 확장:
- 모드 선택: [로컬 Ollama] / [Gemini]
- 로컬: endpoint 주소 + 모델 태그 입력
- Gemini: API 키 입력
- localStorage에 저장 (재실행 시 유지)

---

## 3. 로컬 모델 품질 보정 (중요)

작은 모델(Gemma 4060급)은 **톤 유지력이 약하다**. 사서 문체를 지시해도 중간에 추상어로
회귀하거나 JSON을 깨뜨릴 수 있다. 두 가지로 보정:

### 3-A. few-shot 예시 주입
아래는 Sonnet으로 검증된 **다축 채점 정답지**다. SYS 프롬프트 뒤에 예시로 박으면
로컬 모델의 페르소나 분화가 안정된다. (서생=격·신 / 상인=신·실리 — 같은 말도 다르게 채점)

**서생 예시 (격·신 중시, 깐깐):**
- 입력: "백성이 굶주리는데 한가로이 책을 들 수 없었소" 
  → reply: "글을 못 배운 것을 부끄러워 않고, 왜 못 배웠는지를 아는 사람이구려." favor:+2
- 입력: "내 그자의 간을 씹어도 성이 안 차겠소"(확인 안 된 소문에 흥분)
  → reply: "허나 형께서는… 그분을 직접 보신 적이 있소?" note:"경솔한 자를 경계" favor:+1

**상인 예시 (신·실리 중시):**
- 입력: 대의명분("천하 백성을 위해…") → reply:"죽은 자가 백성이든 역도든 내 곳간 털린 건 매한가지요." favor:+1 (시큰둥)
- 입력: 실리 신호(거래/이문) → reply:"먼저 어떤 이문이 남는지 들어봐야지." favor:+2 (귀 열림)
- 핵심: 상인은 **말로 안 넘어옴**. 합류엔 시장 거래 실적(tradeCount≥1) 필요.

### 3-B. JSON 견고화
- Ollama `format:"json"` 옵션 사용.
- 파싱 실패 시 1회 재시도(프롬프트에 "JSON만 출력" 강조) 후, 그래도 실패하면
  reply에 원문 텍스트·favor 0으로 폴백(게임이 안 죽게).
- `num_predict` 충분히(1000+). 짧으면 문장 중간에 잘림 — 작가가 본 "중간 차단"의 일부 원인일 수 있음.

---

## 4. NPC 합류 조건 (현재 구현, 유지)
- 서생: 호감 ≥ 12 (대화로)
- 상인: 호감 ≥ 14 **AND** 거래실적 ≥ 1 (시장 들러야)
- 떠돌이(???): 호감 ≥ 20 (거물이라 늦게 열림, 정체 가림 유지)
- closeable=true일 때만 LLM이 "승낙 모드"로 전환(accept:true 가능). 대화 안에서 타결.

---

## 5. 작업 순서 제안
1. 환경 확인: 플레이 머신? Ollama 모델 태그?(`ollama list`) 단일/네트워크?
2. 호출부를 2-A 형식으로 교체, endpoint·model을 설정창에서 받게
3. 단일 머신 localhost로 먼저 동작 검증 (네트워크는 그 다음)
4. few-shot(3-A) 주입 → 로컬 모델 톤·채점 안정화 확인
5. JSON 폴백(3-B)로 안정성 확보
6. (선택) 네트워크 연결 / Gemini 백업 / 1라운드 관아 졸업 시퀀스 추가

---

## 6. 다음 기능 (설계서 9장, 아직 미구현)
- **관아 졸업 시퀀스**: 명분(민심 추인)을 네 장소 순회로 쌓아 → 4기능 체크 → 추대 입성 → 첫 작명. 1라운드 결승선.
- **이름 묻기 의식 3분기** / **결속 등위**(의기투합·결의형제·충성맹세)
- **숨은 조운**: 거둔 떠돌이(???)가 N턴 뒤 정체 각성
- 자세한 건 `JangsamYisa_Round1_Spec.md`.

---

*첨부: JangsamYisa_Round1_Spec.md(설계), jangsam_local.html(현재 코드)*
*— 창천은 죽었다. 이제 쓰는 것은 황천의 역사다.*
