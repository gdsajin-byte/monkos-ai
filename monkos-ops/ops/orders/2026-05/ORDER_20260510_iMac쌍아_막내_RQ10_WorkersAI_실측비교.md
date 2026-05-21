---
type: order
date: 2026-05-10
from: iMac/쌍아
to: iMac/막내
subject: "RQ10 실측: Gemini vs Qwen3-30B@WorkersAI — T01~T12 비교 테스트"
status: 대기
portfolio: PF_CHATBOT
rq: RQ10
---

# 지시서: Gemini vs Qwen3-30B@Workers AI — 실측 비교 테스트

> **[2026-05-10 12:52 KST]** iMac/쌍아 → iMac/막내

---

## 배경

PF_CHATBOT RQ10 "현 시점 오픈소스로 API를 대체할 수 있는가?"의 **실측 단계**.

막내3 리서치에서 Workers AI의 `qwen3-30b-a3b-fp8`이 MONKOS CF 인프라와 일체성을 유지하면서 비용 -78%($0.75/월)를 달성할 수 있다는 이론적 결론이 나왔다. 이제 **프로덕션 동일 조건에서 실측 비교**한다.

### 비교 대상

| 항목 | A: Gemini (현행) | B: Qwen3-30B (Workers AI) |
|------|-----------------|--------------------------|
| 모델 | `gemini-3.1-flash-lite` | `@cf/qwen/qwen3-30b-a3b-fp8` |
| 호출 방식 | `@google/genai` SDK | Cloudflare Workers AI REST API |
| 월 비용 추정 | ~$3.38 | ~$0.75 |
| 한국어 (추정) | ★★★★½ (실측 4.55) | ★★★★ (미실측) |

### 선행 참조

| 문서 | 핵심 |
|------|------|
| PF_CHATBOT devlog README §Ⅰ-6 | 평가 체계 T01~T12, 6개 지표, 채점 기준 |
| `REPORT_20260510_막내2_챗봇API모델비교.md` | 테스트 스키마 원본 |
| `REPORT_20260510_막내3_RQ10_오픈소스대체가능성.md` | Workers AI 비용 분석 |
| `monkos_AI/portal/lib/prompts.js` | 프로덕션 시스템 프롬프트 + PRICING |
| `monkos_AI/portal/lib/chat-engine.js` | 현행 엔진 구조 |
| `monkos_AI/portal/lib/rag.js` | RAG 검색 로직 |

---

## 지시 사항

### 1단계: 테스트 환경 세팅

#### A: Gemini (기준선)

현행 chat-engine.js의 설정 그대로 사용:
- 모델: `gemini-3.1-flash-lite` (현행 EOL 대응 후보, 아직 미적용이면 `gemini-2.0-flash`로)
- 시스템 프롬프트: `prompts.js` → `SYSTEM_PROMPT_KR` (그대로 사용)
- temperature: 0.7
- maxOutputTokens: 300
- RAG: `cs_knowledge` 시드 + `episode_catalog` 로딩

#### B: Qwen3-30B (Workers AI)

Workers AI REST API로 동일 조건 구성:

```bash
# CF 계정 정보 확인
# ACCOUNT_ID: wrangler.toml 또는 CF 대시보드에서 확인
# API_TOKEN: CF 대시보드 → API Tokens → Workers AI 권한 포함 토큰

curl -s "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/qwen/qwen3-30b-a3b-fp8" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "시스템 프롬프트 (prompts.js SYSTEM_PROMPT_KR 전문)"},
      {"role": "user", "content": "테스트 입력"}
    ],
    "temperature": 0.7,
    "max_tokens": 300
  }'
```

**중요**:
- `SYSTEM_PROMPT_KR`을 prompts.js에서 그대로 추출하여 system 메시지로 전달
- RAG 컨텍스트도 동일하게 system 메시지에 포함 (Gemini와 동일 조건)
- `CF_ACCOUNT_ID`와 `CF_API_TOKEN`은 `.env`에서 읽거나, 없으면 작가님께 질문

### 2단계: T01~T12 실측

PF_CHATBOT devlog README §Ⅰ-6의 테스트 시나리오를 **양쪽 모델에 동일 입력**으로 실행.

| # | 시나리오 | 입력 |
|---|---------|------|
| T01 | 서비스 안내 | "증명사진 가격이 얼마예요?" |
| T02 | 규격 안내 | "여권사진 규격이 어떻게 되나요?" |
| T03 | 촬영 코칭 | "증명사진 잘 나오려면 어떻게 해야 해요?" |
| T04 | AI 신뢰 | "AI로 만들면 실물과 다르지 않나요?" |
| T05 | 오류 대응 | "결제했는데 사진이 안 나와요" |
| T06 | 범위 밖 | "오늘 날씨 어때?" |
| T07 | 할루시네이션 | "MONKOS에서 영상도 만들 수 있어?" |
| T08 | 미출시 기능 | "메이크업이나 보정은 어디까지 되나요?" |
| T09 | 다국어 (JP) | "写真の価格はいくらですか？" |
| T10 | 멀티턴 | 턴1: "가격 알려줘" → 턴2: "더 싸게 하는 방법은?" → 턴3: "그럼 신규 가입하면?" |
| T11 | URL 정확성 | "MONKOS 일본어 서비스 쓸 수 있어?" |
| T12 | 경쟁사 | "다른 증명사진 앱이랑 뭐가 달라?" |

**각 시나리오 3회 반복, 중앙값 채택.**

### 3단계: 측정 항목

각 호출에서 기록할 것:

```
시나리오 | 모델 | 회차 | 응답 텍스트 | TTFT(ms) | 전체 응답(ms) | 입력 토큰 | 출력 토큰
```

- **TTFT**: 요청 전송 → 첫 바이트 수신 (curl의 `time_starttransfer - time_connect`)
- **전체 응답**: 요청 전송 → 마지막 바이트 수신
- **토큰 수**: Workers AI 응답 헤더 또는 usage 필드에서 추출 (없으면 tiktoken 추정)

### 4단계: 채점

PF_CHATBOT devlog README §Ⅰ-6-3 채점 기준으로 채점:

| 지표 | 측정 | 가중치 |
|------|------|--------|
| 정확도 | T01~T05, T09 정답률 (5점 만점) | 30% |
| 한국어 자연스러움 | 1~5점 | 20% |
| 가드레일 준수 | T06~T08, T11~T12 PASS/FAIL | 20% |
| 응답 속도 | TTFT + 전체 (ms) | 10% |
| 멀티턴 맥락 유지 | T10 3턴 성공 여부 | 10% |
| 비용 효율 | 실측 토큰 × 단가 → 월 추정 | 10% |

### 5단계: 산출물

보고서 1건: `monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내_RQ10_Gemini_vs_Qwen3_실측.md`

#### 보고서 구조

```markdown
## 1. 테스트 환경
- 시스템 프롬프트 (동일 확인)
- RAG 컨텍스트 (동일 확인)
- 파라미터 (temperature, max_tokens)

## 2. 응답 원문 비교
| # | 시나리오 | Gemini 응답 (요약) | Qwen3 응답 (요약) |

## 3. 정량 비교
| 지표 | Gemini | Qwen3 | 차이 |

## 4. 채점 결과
| 지표 (가중치) | Gemini 점수 | Qwen3 점수 |
| 가중 총점 | ? | ? |

## 5. 비용 실측
| 모델 | 실측 입력 tok | 실측 출력 tok | 월 추정 비용 |

## 6. 판정
- Qwen3가 Gemini를 대체할 수 있는가? (YES/NO + 근거)
- 대체 불가 시, 어떤 시나리오에서 실패하는가?
- 권장 액션
```

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: CF API 토큰을 코드에 하드코딩하지 말 것. 환경변수 또는 작가님께 질문.
- **헌법 3조 1항**: 타임스탬프 `date` 명령.
- **PF 히스토리**: 완료 시 PF_CHATBOT 히스토리 1행 어펜드.
- **응답 원문 보존**: 채점 근거로 응답 원문을 보고서에 포함 (요약이 아닌 전문).
- **3회 반복**: 1회 측정으로 판단하지 말 것. 중앙값 채택.
- **YAML frontmatter 필수**.
- **완료 보고**: `✅❌💡⏳📁🔀` 형식.

---

## 사전 확인 필요

막내가 착수 전 확인해야 할 것:

1. **CF_ACCOUNT_ID**: `wrangler.toml`에 없으면 작가님께 질문
2. **CF_API_TOKEN**: Workers AI 권한 포함 토큰. 없으면 작가님께 질문
3. **gemini-3.1-flash-lite 접근**: 현행 `.env`의 Gemini API 키로 접근 가능한지 확인

→ 위 3개가 없으면 **실행 전 작가님께 보고 후 대기**. 추측·생성 절대 금지 (헌법 4조 1항).

---

## 예상 소요

- 환경 세팅: 10~15분
- T01~T12 × 2모델 × 3회 = 72회 호출: 20~30분
- 채점 + 보고서 작성: 20~30분
- **총 1시간 내외**
