---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내1
portfolio: PF_IDPHOTO
status: 발행
order_class: 광역오더(Mission Order) #2 — 🔥긴급(실서비스)
---

# ORDER — idphoto-kr Gemini 2.0 EOL 긴급 제거 + PF 현행화 커밋

**[2026-06-02 11:08 KST] M1/쌍아 → 막내1**

> 작가님 지시: **"실서비스에서 문제가 생기면 안 되는 게 우선순위."** 본 오더는 실서비스 보호 최우선 긴급 건이다.

---

## 1. 선행 — 오더 #1 산출물 커밋·푸시

쌍아 정합 검토 **통과** (append-only 준수 확인 — 삭제는 전부 Phase 현황 상태 갱신, 히스토리 행 삭제 0).
아래 **범위만** add → 커밋 → 푸시. 잡파일 제외.

```
monkos-ops/ops/portfolios/PF_AUTOPILOT/README.md
monkos-ops/ops/portfolios/PF_CHATBOT/README.md
monkos-ops/ops/portfolios/PF_IDPHOTO/README.md
monkos-ops/ops/portfolios/PF_STUDIO/README.md
monkos-ops/ops/portfolios/README.md
monkos-ops/ops/reports/2026-06/COMPLETION_20260602_막내1_PF현행성검증.md
monkos-ops/ops/orders/2026-06/ORDER_20260602_M1쌍아_막내1_PF현행성검증_상태판정합화.md
monkos-ops/ops/orders/2026-06/ORDER_20260602_M1쌍아_막내1_idphotoKR_EOL긴급제거_PF커밋.md
```

🚫 제외(add 금지): `.playwright-mcp/`, `apps/MonkosCrop/**/xcuserdata/`, `*.swiftpm/`, `og-image.png`, `monkos-ops/works`(서브모듈 포인터).

커밋 메시지: `[현행화] PF 현행성 검증 4건 — CHATBOT/IDPHOTO/AUTOPILOT/STUDIO 정합화 (광역오더 #1)`

---

## 2. 본 작업 — idphoto-kr EOL 제거 (server.js)

### 2-1. 실태 확인 (먼저, 고치기 전에)
- `gemini-2.0-flash`(precheck, server.js:374), `gemini-2.0-flash-live-preview-04-09`(Live, :332)가 **6/1 EOL 이후 실제 호출 거부되는지** 실측한다. (API 직접 호출 또는 실서비스 사진 업로드 테스트)
- 결과를 §6-체크포인트2로 보고. **깨졌으면 즉시 2-2 진행, 안 깨졌어도 EOL 모델이므로 전환은 진행하되 긴급도만 조정.**

### 2-2. 전환
- precheck + Live를 **2.5 계열**로 전환한다.
- ⚠️ **2.5 엄격 이슈 재발 방지** (5/18 롤백 사유 = 적합한 사진도 반려). 단순 모델 교체로 끝내지 말 것:
  - precheck 프롬프트의 적합성 판정 기준을 완화하거나, `gemini-2.5-flash-lite` 등 덜 엄격한 모델을 평가해 선택한다. (근거: 5/18 세션로그 `ce34b4ec` 마이그레이션 조사 문서 선행 참조)
- **로그/실코드 불일치 동시 수정**: server.js:474 `preCheck: 'active (gemini-2.5-flash)'`, :729 로그가 "2.5"로 표시되나 실코드는 2.0 — 실제 사용 모델과 **일치**시킨다.

### 2-3. 배포
- **`monkos_AI/idphoto-kr/deploy.sh` 경유 필수** (헌법 ch5 2조). `gcloud run deploy` 직접 실행 금지.

### 2-4. 배포 후 검증
- precheck 정상 동작 실측: 정상 증명사진 업로드 → **적합 판정**되는지(=엄격 이슈 재발 없는지), 부적합 사진은 거르는지 확인.

---

## 3. 범위 경계

| 한다 ✅ | 안 한다 🚫 |
|--------|-----------|
| precheck + Live 모델 2.5 전환 | **증명사진 생성 코어**(`gemini-3-pro-image-preview`) 변경 |
| 로그/실코드 모델 표기 일치 | 크레딧/Firestore 직접 접근 |
| deploy.sh 경유 배포 | `.env`·`deploy.sh` 무단 수정 |

---

## 4. 자율 재량
- 대체 모델 선택(2.5-flash vs 2.5-flash-lite), 프롬프트 완화 방식은 막내 판단.
- "엄격 이슈" 재발이 풀리지 않으면 §6으로 보고 (배포 강행 금지).

## 5. 가드레일
- deploy.sh 경유. `.env` 무단 수정 금지. 파괴적 명령 금지. 매 턴 `date` KST.

## 6. 체크포인트 (non-blocking)
1. **선행 커밋·푸시 완료** 보고.
2. **실태 확인 결과** (precheck/Live 실제 깨졌나).
3. **전환+배포+검증 완료** → COMPLETION.
4. 에러 3회 → `/에스컬레이션`.

## 7. PF 갱신
- 완료 시 `PF_IDPHOTO/README.md` 히스토리 1행 어펜드 + Phase 현황(EOL 리스크) 갱신.

---

**끝. 실서비스 보호가 최우선. 경로는 네가 설계하되, 배포 전 §2-4 검증은 반드시 통과시켜라.**
