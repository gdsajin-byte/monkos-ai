---
type: report
incident: true
date: 2026-06-05
device: iMac
agent: 막내2
status: 복구경로확정_결제대기
portfolio: PF_IDPHOTO
priority: P0
subject: "[INCIDENT] AI Studio 결제 복구 — 막힌 지갑은 'AI Studio Developer API prepay' 하나(Vertex·GCP빌링은 정상). 실험으로 지갑 경계 확정"
---

# REPORT — [INCIDENT] AI Studio 결제 복구

**[2026-06-05 16:31 KST] iMac/막내2 → 작가님**

> ⚠️ 결제·충전·결제수단은 일절 손대지 않았다(헌법 4조). 본 보고는 **실험·로그·실데이터 근거**의 복구 경로 식별이다.
> ⚠️ 추론 금지 원칙 준수 — 단정 대신 **재현 가능한 실험 1건이 다섯 추론을 대체**했다(아래 §1-3).

---

## 0. 한 줄 결론

**막힌 것은 단 하나, `AI Studio Gemini Developer API(generativelanguage)`의 prepay 결제 지갑이다.** 같은 프로젝트의 **Vertex AI 경로는 지금 200으로 정상 작동**한다(실측). 즉 GCP 프로젝트 빌링·크레딧·쿼터는 멀쩡하고, **AI Studio Developer API만 funded 결제원이 없어 429**다. 생성코어(`gemini-3-pro-image-preview`)는 Vertex에 없으므로(404) **AI Studio 결제 복구가 불가피**하고, 번역 등 일부는 **Vertex로 즉시 부분복구 가능**(코드 변경·승인 게이트).

---

## 1. 실험·실데이터 (재현 가능, 추론 아님)

### 1-1. 429 본문에 QuotaFailure 없음 → rate/quota cap 아님

```json
{ "code": 429, "status": "RESOURCE_EXHAUSTED",
  "message": "Your prepayment credits are depleted. Please go to AI Studio ... manage ... billing." }
```
- `details[]` 배열 **부재**. 분당/일당/월 쿼터 초과(rate cap)였다면 반드시 `@type: QuotaFailure`의 `violations[].quotaMetric/quotaId`가 붙는다 — **없다.**
- → **이 429는 쿼터 한도가 아니라 결제 지갑 레벨 차단.** (작가님 1-B "월 200불 한도" 가설은 이 raw 본문상 **소거** — 한도 위반이면 QuotaFailure가 떠야 한다.)

### 1-2. Cloud Billing은 연결·활성인데도 429

- `gcloud billing projects describe monkos`: `billingEnabled: true`, `billingAccounts/01A4D9-27F508-300352`.
- postpaid Cloud Billing이 붙어 있는데도 generativelanguage는 429 → **AI Studio Developer API는 이 postpaid 빌링에서 차감되지 않는다**(한국=prepay 마켓 구조: AI Studio는 별도 prepay 지갑).

### 1-3. ⭐ 결정 실험 — Vertex 200 vs AI Studio 429 (지갑 경계 확정)

> 충전 없이 진실을 가린 실험. **API 키(AI Studio) 경로**와 **ADC(Vertex) 경로**를 같은 프로젝트·같은 모델 계열로 동시 호출.

| 경로 | 인증 | 모델 | 결과 | 차감 지갑 |
|------|------|------|------|----------|
| AI Studio Developer API | API Key(MONKOS NEW) | gemini-2.5-flash | 🔴 **429** prepay depleted | AI Studio prepay |
| AI Studio Developer API | API Key | gemini-3-pro-image-preview | 🔴 **429** prepay depleted | AI Studio prepay |
| **Vertex AI** | **ADC/SA** | gemini-2.5-flash | 🟢 **200 정상** | GCP 빌링/크레딧 |
| **Vertex AI** | ADC/SA | gemini-2.5-flash-image | 🟢 **200 정상** | GCP 빌링/크레딧 |
| Vertex AI | ADC/SA | **gemini-3-pro-image-preview** | ⚠️ **404 NOT_FOUND** (us-central1 미제공) | — |

→ **두 지갑이 물리적으로 분리됨이 실측 확정.** GCP 지갑(ANNUAL 24% 잔존·GenAI App Builder)은 **Vertex에 적용되어 살아있고**, AI Studio prepay 지갑만 0이라 막혔다. "24% 잔존인데 429" 모순의 정체 = **돈은 Vertex 지갑에 있고, 막힌 건 AI Studio 지갑**이라서.

### 1-4. 403은 장애 아님 (분리 확정) + gcloud 로그 한계

- `generativelanguage`는 **Cloud Audit Log 미기록** → `gcloud logging read` 0건. 403/429 시간선 raw는 **AI Studio 사용량 대시보드(작가님 GUI)가 유일 정본**.
- 작가님 타임라인대로 **403 = 삭제된 monkosimagepro/unknown 외부(대만) 공격이 죽은 키로 두드리다 튕기는 방어 작동.** 우리 서비스 장애 아님 → 장애 원인에서 분리. **진짜 장애 = MONKOS NEW의 429(결제).**

---

## 2. 근본 원인 판정 (raw 근거)

| 후보 | 판정 | raw 근거 |
|------|------|---------|
| 키 미삭제/오삭제 | ❌ 기각 | 앞 보고(fp 대조): GEMINI_API_KEY=살아있는 MONKOS NEW |
| GCP GEMINI 크레딧 0 | ❌ 기각 | **Vertex 200** — GCP 지갑 살아있음 |
| rate limit / 월 spending cap(200불) | ❌ 소거 | 429에 **QuotaFailure 없음**, 월지출 ₩828≪한도, budget API 미설정 |
| **AI Studio Developer API prepay 지갑 고갈(funded 결제원 부재)** | ✅ **확정** | 429 prepay 메시지 + Vertex 200 대조 + postpaid 빌링 무관 입증 |

> ⚠️ **"prepay 0" 단순 재탕이 아님(④ 기각 가설과의 차이)**: 작가님 지적대로 prepay 잔액은 *원래 0, 바우처로 운영*돼 왔다. 새 사실은 **"그 바우처/무상 크레딧이 소진돼, 이제 AI Studio Developer API에 funded 결제원이 하나도 없다"**는 것 — postpaid 빌링도 GCP 크레딧도 이 API를 대신 안 먹인다는 게 Vertex 실험으로 처음 증명됐다. 즉 *잔액 숫자*가 아니라 *결제 경로 자체의 단절*이 원인.

---

## 3. ⭐ 복구 경로 — 작가님 결제 액션 1줄 안내

### Path A — 생성코어 정식 복구 (불가피, 작가님만)

- 생성코어 `gemini-3-pro-image-preview`는 **Vertex us-central1에 없음(404)** → **AI Studio Gemini API에 funded 결제원을 붙이는 것이 유일 경로.**
- **👉 작가님 액션 1줄**: **AI Studio(`ai.studio/projects`) → monkos 프로젝트 → Billing/Plan에서 "Set up billing(결제수단 연결)" 또는 prepay 크레딧 충전.** (콘솔이 그 화면에서 띄우는 버튼 문구 그대로 누르시면 됩니다. prepay 마켓이라 "결제수단 연결 후 paid tier 활성"이 핵심.)
- 결제 직후 막내2가 **즉시 `generateContent` 200 재호출 + 4서비스 순차 실측**으로 검증.

### Path B — 즉시 부분복구 (결제 전, 코드 변경·승인 게이트)

- Vertex에서 200 나는 기능은 **결제 없이 지금** 살릴 수 있다(남은 GCP 크레딧 사용):
  - 블로그 **번역**(gemini-2.5-flash) → Vertex ADC 전환 ✅
  - idphoto **precheck/Live 분석**(gemini-2.5-flash) → Vertex ADC 전환 ✅
- ⚠️ 코드 변경(키→ADC) → **작가님 승인 후** 별도 지시서로. 승인 주시면 막내2가 즉시 착수 가능.
- 생성코어는 Path B로 못 살림(모델 부재). 단 **차선책**으로 `gemini-2.5-flash-image`(Vertex 200)로 임시 생성 가능하나 **다른 모델 = 품질·출력 상이** → 작가님 판단 사항(정체성 보존 헌법 1조 3항 고려).

---

## 4. 보안 — 유출 ↔ 결제원 소진 인과 (미확정, GUI 확인 요)

- 핵심 질문(삭제 전 5/28~6/2 유출 대량 호출이 결제원을 빨아 정상 키까지 429?)은 **시간선상 정합**(유출 급증→6/4 이후 0, 그 시점 prepay 고갈)하나, generativelanguage Cloud Log 부재로 **gcloud로 지갑 차감 시간선 확정 불가** → **AI Studio 빌링 명세(작가님 GUI)에서 유출 호출량 급증 시점 ↔ 잔액 0 시점 겹침**을 눈으로 대조하면 인과 확정.
- 삭제된 키 403 바운스는 **성공 과금 호출 아님** → 현재 prepay 추가 소모는 없음(공격은 차단됨). 단 재발 방지로 결제 복구 후 **잔액 임계 알림(소넷이 데몬)** 권고.

---

## 5. 검증 (완료 기준 대조)

- [x] AI Studio 차단 사유·해제 경로 — 실험으로 지갑 경계 확정(Vertex 200/AI Studio 429), 결제 화면 버튼 안내 §3-A
- [x] 생성코어 실제 결제원 + 남은 크레딧 적용 가능성 — 생성코어=AI Studio prepay 전용(Vertex 404), GCP 크레딧=Vertex 적용(200)
- [x] 작가님 결제 액션 1줄 안내 — §3-A
- [ ] (결제 후) generateContent 200 + 4서비스 순차 복구 실측 ← **작가님 결제 대기**
- [x] 추론 배제·실데이터 근거 — QuotaFailure 부재·Vertex 실험·빌링 describe로만 판정. 키/결제 값 무노출

---

**[2026-06-05 16:31 KST] iMac/막내2 → 작가님**
🔴 **막힌 지갑은 'AI Studio prepay' 하나. Vertex·GCP는 200 정상(실측).** 생성코어는 Vertex에 없어(404) **AI Studio 결제수단 연결/충전이 유일 복구**입니다 → 콘솔 Billing 화면의 결제 버튼. 결제하시면 즉시 200 재현+4서비스 검증하겠습니다. **번역·분석은 승인 주시면 결제 전이라도 Vertex로 즉시 부분복구 가능**합니다. 결제/승인 대기합니다.
