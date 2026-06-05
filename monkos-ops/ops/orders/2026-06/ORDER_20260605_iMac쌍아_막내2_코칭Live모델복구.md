---
type: order
date: 2026-06-05
device: iMac
agent: 쌍아
to: 막내2
status: 발행
portfolio: PF_IDPHOTO
priority: P0 (라이브 장애 — 증명앱 코칭 다운)
---

# ORDER — [INCIDENT] 코칭 Gemini Live 모델 복구 (2.5 오변경 → Live 전용 모델)

**발신**: iMac/쌍아 → **수신**: 막내2
**우선순위**: 🔴 **P0** — 증명앱이 **코칭 단계부터** 막혀 작동 불가. 원인 확정됨, 복구 집행.

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내2 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내2 → 작가님` 형식

---

## 배경 (git -L로 원인 확정 — 추론 아님)

증명앱 코칭(Gemini Live)이 막혔다. `git log -L`로 정확한 오변경 커밋을 특정했다:

```
6/2 (8e5b890e, EOL 긴급 마이그):
  - model: 'gemini-2.0-flash-live-preview-04-09'   ← 원래 (정식 Live 전용 모델)
  + model: 'gemini-2.5-flash'                       ← 오변경 (generateContent용 일반 모델)
2/10 (c0457c54): 최초 도입 = gemini-2.0-flash-live-preview-04-09
```

- **버그**: `gemini-2.5-flash`는 **Live API에서 작동하지 않는 일반 모델명**이다. `ai.live.connect`가 실패 → 코칭 다운.
- EOL 대응으로 generateContent를 2.0→2.5로 올린 건 맞으나, **Live 모델까지 일반 모델명으로 싸잡아 바꾼 것이 화근**.
- 코칭/precheck 경로는 **Vertex AI ADC**(`server.js:51` `vertexai:true`), 생성만 AI Studio 키. 즉 코칭은 **AI Studio 크레딧과 무관** — 충전으로 안 풀린 이유.

> ⚠️ **과거 함정 (작가님 — 반드시 준수)**: 이 지점은 **여러 번 마이그→롤백을 반복**한 자리다(5/18 `ce34b4ec` "idphoto-kr 롤백" 등). 작가님 명시: **"2.5 라이브 모델 자체가 늘 에러였다. 처음부터 작동 안 했다."** → **2.5 라이브 계열 재시도 절대 금지.** generateContent용 2.0-flash(6/1 EOL)와 Live용 모델은 별개다.

## 작업

### 1. Vertex Live 지원 모델 실측 (추론 금지)
- Vertex AI **Live API가 현재 지원하는 모델 목록**을 실측(문서/API).
- **`gemini-2.0-flash-live-preview-04-09` 생존 여부** 확인 — 작가님 가설: "2.0 LLM은 죽었어도 2.0 **Live**는 살아있을 것"(별개 모델).

### 2. 코칭 Live 모델명 수정
- **1순위**: `gemini-2.0-flash-live-preview-04-09`로 **롤백** (생존 시 — 원래 작동하던 것).
- **2.0 Live도 EOL이면**: 3.1 또는 현재 지원되는 Live 전용 모델로 상향.
- 🚫 **2.5 라이브 계열 금지** (작가님 확정: 늘 에러).
- ⚠️ **generateContent/precheck의 `gemini-2.5-flash`는 건드리지 마라** — 그건 EOL 대응이 올바르게 된 것. **코칭 Live 모델(`ai.live.connect`)만** 수정 대상.

### 3. KR + JP 둘 다 적용
- `monkos_AI/idphoto-kr/server.js` + `monkos_AI/idphoto-jp/server.js` 동일 구조 확인 후 둘 다 수정.

### 4. 배포 (deploy.sh 경유 필수)
- `monkos_AI/idphoto-kr/deploy.sh`, `monkos_AI/idphoto-jp/deploy.sh` 경유. **`gcloud run deploy` 직접 실행 금지**(ch5 2조).

### 5. 코칭 실작동 검증
- 배포 후 `ai.live.connect` 정상 연결 + 실제 코칭 응답(WS) 확인. 로그 `[Gemini Live]` 에러 소멸 확인.
- 가능하면 증명앱 코칭 단계 실제 시연(작가님/막내).

## ⚠️ 준수 조항

- **2.5 라이브 재시도 금지** (과거 함정 — 작가님 명시).
- **헌법 4조**: 키 값 무노출. `.env`·deploy.sh 수정 전 작가님 승인. 배포 deploy.sh 경유.
- **추론 금지**: Live 지원 모델 실측 후 결정. "될 것" 단정 금지.
- 정체성 보존(헌법 1조 3항) — 코칭은 촬영 가이드, 생성과 별개 경로.
- 막힘 시 가설 전 자료 선참조(ch7 6조). 에러 3회 시 `/에스컬레이션`.

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | 모델 수정 + deploy.sh 배포 + 코칭 실작동 검증 → 커밋+push |
| 산출물 | `monkos-ops/ops/reports/2026-06/REPORT_20260605_막내2_코칭Live복구.md` |
| 문서 유형 | INCIDENT → REPORT |
| 세션 로그 | `2026-06-05_{디바이스}_막내2.md` 어펜드 + PF_IDPHOTO 히스토리 1행 |

## 검증 (완료 기준)
- [ ] Vertex Live 지원 모델 실측 (2.0-live 생존 여부 포함)
- [ ] 코칭 Live 모델명 수정 (2.0-live 롤백 우선, 안 되면 3.1 / **2.5 회피**)
- [ ] generateContent·precheck는 미변경 확인 (Live만 수정)
- [ ] KR + JP 둘 다 적용
- [ ] deploy.sh 경유 배포
- [ ] 코칭 실작동 검증 (Live connect 정상 + 응답)
