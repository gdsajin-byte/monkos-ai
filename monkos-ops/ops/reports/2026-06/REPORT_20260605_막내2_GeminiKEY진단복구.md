---
type: report
incident: true
date: 2026-06-05
device: iMac
agent: 막내2
status: 진단완료_승인대기
portfolio: PF_IDPHOTO
priority: P0
subject: "[INCIDENT] Gemini 라이브 장애 — 근본원인=AI Studio 선결제 크레딧 소진(빌링), 키 삭제 아님"
---

# REPORT — [INCIDENT] Gemini 키 긴급 진단

**[2026-06-05 15:26 KST] iMac/막내2 → 작가님**

> ⚠️ **본 보고는 진단까지다. 키·빌링 변경은 일절 하지 않았다(헌법 4조 승인 게이트).**
> ⚠️ **결론이 지시서 유력 가설과 다르다.** 추정에 끌려가지 않고 실측한 결과, **키 삭제와 무관한 빌링 장애**로 확정됐다.

---

## 0. 한 줄 결론

**라이브 장애의 근본 원인은 "삭제된 키"가 아니라 `AI Studio(Gemini API) 선결제 크레딧 소진(HTTP 429 RESOURCE_EXHAUSTED)`이다.** 설정된 키(MONKOS NEW)는 살아있고 정상 인증된다. **복구는 키 교체·undelete·재배포가 아니라, 작가님의 AI Studio 콘솔 빌링 충전**으로만 가능하다.

---

## 1. 실측 증거 (재현 가능)

### 1-1. GCP API 키 상태 (`gcloud services api-keys list`)

| 키 이름 | UID | 상태 |
|--------|-----|------|
| **MONKOS NEW API Key** | 5f43e91f…c2be (2026-03-30 생성) | ✅ **활성 (유일)** |
| monkosimagepro | 5759b56b… | 🗑️ 06-02 삭제 (soft, undelete 창 유효) |
| monkos_key | 5c5ceb04… | 🗑️ 06-02 삭제 |
| monk-aistudio-consol | ec9e0626… | 🗑️ 06-02 삭제 |

→ 06-02 삭제 3건은 실제로 삭제됨이 확인됨. **30일 undelete 창 유효**(2026-07-02까지).

### 1-2. GEMINI_API_KEY가 가리키는 값 = 살아있는 키 (fingerprint 대조, 값 비노출)

| 위치 | SHA256 fingerprint(앞12) | 길이 | 판정 |
|------|--------------------------|------|------|
| Secret Manager `GEMINI_API_KEY:latest` | `3560db307f8e` | 39 | = MONKOS NEW |
| Cloud Run `monkos-idphoto-kr` 런타임 env | `3560db307f8e` | 39 | = MONKOS NEW |
| Cloud Run `monkos-idphoto-jp` 런타임 env | `3560db307f8e` | 39 | = MONKOS NEW |
| Cloud Run `monk-image-engine` | valueFrom/secret → 위 Secret 참조 | — | = MONKOS NEW |
| 활성 키 `MONKOS NEW` keyString | `3560db307f8e` | 39 | 기준 |

→ **모든 서비스가 살아있는 MONKOS NEW를 가리킨다. "실사용 키를 삭제했다"는 가설은 사실이 아니다.** 삭제된 3개 키는 GEMINI_API_KEY가 한 번도 가리킨 적 없음(생성코어 무관 판정은 옳았음).

### 1-3. 라이브 API 재현 — 에러 코드 확정

| 테스트 | 결과 |
|--------|------|
| ListModels (`?key=…`) | **HTTP 200** — 키 인증 정상, 50개 모델 조회 |
| `gemini-3-pro-image-preview:generateContent` (생성코어) | **HTTP 429 RESOURCE_EXHAUSTED** |
| `gemini-2.5-flash:generateContent` (베이스라인) | **HTTP 429 RESOURCE_EXHAUSTED** |

**에러 본문(동일)**:
```json
{ "code": 429, "status": "RESOURCE_EXHAUSTED",
  "message": "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing. ..." }
```

→ **키는 인증되나(200) 생성 호출만 429.** gemini-3·gemini-2.5 **둘 다** 동일 실패 = 모델·키 문제가 아니라 **프로젝트 빌링(선결제 잔액 0)**.

### 1-4. 서버 생존 확인

- `monkos-idphoto-kr` 헬스: **HTTP 200**, `imagen: active (API Key)`, `status: healthy` — 서버·키 주입 정상.
- 즉 "서버는 살아있고 키도 꽂혀 있는데, Gemini가 돈이 없어서 거절" 상태.

---

## 2. 영향 범위 실측표

> 4개 기능 전부 **단일 `GEMINI_API_KEY` 공유** → 빌링 1점 장애 = 전면 장애.

| 기능 | 서비스 | 키 참조 | 상태 | 사인 |
|------|--------|---------|------|------|
| 증명사진 생성 (KR) | monkos-idphoto-kr | `process.env.GEMINI_API_KEY` | 🔴 다운 | 429 빌링 |
| 증명사진 생성 (JP) | monkos-idphoto-jp | `process.env.GEMINI_API_KEY` | 🔴 다운 | 429 빌링 |
| 이미지 보정/분석 | monk-image-engine `/refine`·`/analyze` | `GEMINI_API_KEY` (secret) | 🔴 다운 | 429 빌링 |
| 블로그 번역 | functions/api/translate.js | `env.GEMINI_API_KEY` | 🔴 다운 | 429 빌링 |

- 공통 원인 1개. 서버·인프라·키 설정 자체는 무결.

---

## 3. 근본 원인 판정

| 후보 | 판정 | 근거 |
|------|------|------|
| 06-02 실사용 키 오삭제 | ❌ **기각** | GEMINI_API_KEY = 살아있는 MONKOS NEW (fp 일치). 삭제 키는 참조된 적 없음 |
| 키 만료/무효(API_KEY_INVALID) | ❌ 기각 | ListModels 200, 키 인증 정상 |
| API restriction·키 제한 | ❌ 기각 | 인증·모델 조회 정상, 특정 메서드 차단 아님 |
| 모델 EOL/미지원 | ❌ 기각 | gemini-2.5도 동일 429 |
| **AI Studio 선결제 크레딧 소진(빌링)** | ✅ **확정** | 429 RESOURCE_EXHAUSTED "prepayment credits are depleted" 명시 |

> **이번 사태의 진짜 교훈**: 06-02 세션의 "키 삭제 = 무관" 판정은 **옳았다**. 장애는 그와 무관한 **별개의 빌링 소진**이 06-05에 발생한 것. 두 사건을 인과로 묶으면 엉뚱한 복구(undelete/키교체)로 시간을 날리고도 서비스는 그대로 죽어 있게 된다.

---

## 4. 복구 방향 (⚠️ 작가님 승인·실행 게이트)

### 4-1. 유효한 복구책 = 빌링 충전 (작가님 콘솔)

- **유일 복구 경로**: 작가님이 **AI Studio 콘솔(https://ai.studio/projects)** 에서 해당 프로젝트(monkos)의 **선결제(prepay) 잔액 충전 / 결제수단·빌링 상태 정상화.**
- 헌법 4조: 결제·빌링은 막내 실행 불가 영역. **막내2는 충전 행위 자체를 하지 않는다.**
- 충전 직후 검증은 막내2가 즉시 가능: 동일 `generateContent` 재호출 → **HTTP 200 실측**으로 복구 확인.

### 4-2. 하지 말아야 할 것 (헛수고 방지)

- 🚫 `undelete`(삭제 키 복원) — 무의미. 살아있는 키도 429다.
- 🚫 키 교체·Secret 새 버전·재배포 — 무의미. 빌링이 0이면 어떤 키든 거절.
- 🚫 코드 수정 — 키 참조·구조 모두 정상.

### 4-3. 부차 권고 (별건, 승인 무관 조사 항목)

- **왜 소진됐나** 빌링 명세 확인 권고: (a) 정상 트래픽 누적 소진인지, (b) 06-02 유출 의심(monkosimagepro 대만 프로빙)으로 크레딧이 빨렸는지. 단 해당 키는 삭제됨 → 추가 유출은 차단 상태.
- **단일 키 공유 = 단일 장애점(SPOF)**: 빌링 1건으로 4서비스 전면 다운. 결제 알림/잔액 임계 모니터링(소넷이 데몬) 도입 검토 권고.

---

## 5. 검증 (완료 기준 대조)

- [x] 1차 자료 정독 → 키 맥락 재구성 (06-02 삭제오더·100오류진단오더·M1 세션로그·SECRET_INVENTORY·06-03 GCP등록)
- [x] GCP 활성 키 목록 + 삭제 실행 사실 확정 (활성 MONKOS NEW 1개, 삭제 3개 confirm)
- [x] GEMINI_API_KEY가 가리키는 값의 유효성 판정 (= 살아있는 MONKOS NEW)
- [x] 깨진 엔드포인트 에러 코드 + 영향 범위 실측표 (429 빌링, 4기능)
- [ ] 진단 보고 → **작가님 승인 대기** ← 현재 지점
- [ ] (승인 후) 빌링 충전은 작가님 콘솔 → 막내2가 200 재호출 실측 검증
- [x] 키 값 무노출 확인 (fingerprint·길이만, 값 일절 미출력)

---

**[2026-06-05 15:26 KST] iMac/막내2 → 작가님**
🔴 **결론: 키 삭제 무관. AI Studio 선결제 크레딧 소진(429 빌링).** 복구는 작가님 콘솔 충전뿐 — undelete/키교체/재배포 전부 무의미합니다. 충전하시면 즉시 200 재호출로 검증하겠습니다. **승인/지시 대기합니다.**
