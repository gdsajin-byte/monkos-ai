---
type: report
id: COMPLETION_20260225_막내2_크레딧게이트_조사
date: 2026-02-25 18:09 KST
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260225_막내2_크레딧게이트_조사
result: success
status: completed
---

# 크레딧 게이트 타이밍 조사 결과 (전수조사 #7 보완)

**[2026-02-25 18:09 KST] iMac/막내2 → iMac/쌍아**

> 수정 없음 (조사 전용). 설계 판단이 필요한 이슈 3건 보고.

---

## 아키텍처 전제

idphoto-kr은 **자체 Express 서버**(server.js, 893줄)를 가진 풀스택 앱이다.
- 이미지 처리 API(`/api/precheck`, `/api/idgen`)는 idphoto-kr 서버가 직접 처리
- 크레딧 차감/환불은 idphoto-kr 서버가 **portal API(`monkos.ai`)에 프록시**
- 인증은 portal이 소유, idphoto-kr은 클라이언트가 전달하는 `userId`를 신뢰

---

## 조사 포인트 1: 비로그인 사용자 플로우

### 결론: 🔴 **전 과정 무료 이용 가능 (CRITICAL)**

| 단계 | 체크 | 비로그인 결과 | 코드 근거 |
|------|------|-------------|-----------|
| 촬영 준비 (prep.html) | 인증 ❌ 크레딧 ❌ | ✅ 통과 | 인증 체크 코드 없음 |
| AI 코칭 (camera.html) | 인증 ❌ 크레딧 ❌ | ✅ 통과 | WebSocket 연결 시 인증 없음 |
| 촬영 확인 (result.html) | 인증 ❌ 크레딧 ❌ | ✅ 통과 | sessionStorage 기반, 인증 무관 |
| **사전분석** (`/api/precheck`) | 인증 ❌ 크레딧 ❌ | ✅ **무료 통과** | server.js:566 — 이미지만 검증, userId 불요 |
| **AI 생성** (`/api/idgen`) | 인증 ⚠️ 크레딧 ⚠️ | ✅ **무료 생성** | server.js:641 — `if (userId)` 분기, userId=null이면 크레딧 차감 SKIP |
| **다운로드** (result.js) | 인증 ⚠️ 크레딧 ⚠️ | ✅ **무료 다운로드** | result.js:295-316 — `if (store.user.id)` 분기, 비로그인은 line 316으로 직행 |
| 수령처 (thankyou.html) | 인증 ❌ 크레딧 ❌ | ✅ 통과 | sessionStorage에서 이미지 로드만 수행 |

### 핵심 취약점

**서버측 (`/api/idgen`, server.js:641-651)**:
```javascript
// 크레딧 차감
if (userId) {                              // ← userId가 null/undefined면 전체 스킵
  const creditResult = await useCredits(userId, 'generate');
  if (!creditResult.success) {
    return res.status(402).json({...});    // ← 크레딧 부족 시 차단
  }
}
// → userId 없으면 크레딧 차감 없이 생성 진행
```

**클라이언트측 (result.js:291-316)**:
```javascript
async function downloadResult() {
  if (store.user.id) {                     // ← 로그인 사용자만 크레딧 체크
    if (store.user.credits < CREDIT_COST.download) {
      showCreditModal(...);
      return;
    }
    // ... creditUse API 호출 ...
    return;
  }
  await cropAndGoToThankyou();             // ← 비로그인: 무조건 통과 (line 316)
}
```

**영향**: 비로그인 사용자는 Vertex AI 연산 비용(사전분석 + 생성)을 무과금으로 소비. 다운로드까지 크레딧 차감 0.

---

## 조사 포인트 2: 크레딧 0 사용자 플로우

### 결론: ✅ **생성 단계에서 차단됨 (정상)**

| 단계 | 크레딧 0 사용자 결과 | 코드 근거 |
|------|---------------------|-----------|
| 촬영 준비 ~ 촬영 확인 | ✅ 통과 | 크레딧 체크 없음 |
| **AI 생성** | ❌ **차단** (402) | server.js:641-649 — `useCredits()` → portal 402 → 클라이언트 모달 |
| 다운로드 | ❌ 도달 불가 | 생성 실패로 `store.generated`가 null |

**차감 시점**: 생성(`/api/idgen`) 시점에서 **선차감** (10c).

- 생성 성공 → 10c 차감 확정
- 생성 실패 → 자동 환불 (server.js:681, 688 — `refundCredits()`)

**다운로드**: 생성 완료 후 다운로드 시점에서 **추가 차감** (70c).
- 총 비용: 생성 10c + 다운로드 70c = **80c**

---

## 조사 포인트 3: 게이트 위치 매핑

```
촬영 준비 → AI 코칭 → 촬영 확인 → AI 생성 → 클로즈업 → 다운로드
  (없음)     (없음)     (없음)     ↑ GATE 1    (없음)    ↑ GATE 2
                                   10c 서버측           70c 클라이언트+서버
                                   userId 필수          userId 필수
```

### GATE 1: AI 생성 (10c) — 서버 사이드

| 항목 | 값 |
|------|-----|
| 위치 | result.js `confirmAndGenerate()` → pipe.run('generate') → `/api/idgen` |
| 클라이언트 체크 | ❌ 없음 (API 호출 후 402 에러로만 차단) |
| 서버 체크 | ⚠️ `if (userId)` 조건부 — userId 없으면 스킵 |
| 차감 API | idphoto-kr `/api/idgen` → portal `/api/credits/use` (type: generate) |
| 실패 처리 | 402 → `showCreditModal(10, credits, 'generate')` |

### GATE 2: 다운로드 (70c) — 클라이언트 + 서버

| 항목 | 값 |
|------|-----|
| 위치 | result.js `downloadResult()` → pipe.run('creditUse') → `/api/credit/use` |
| 클라이언트 체크 | ⚠️ `if (store.user.id)` 조건부 — 비로그인은 바이패스 |
| 서버 체크 | idphoto-kr `/api/credit/use` → portal `/api/credits/use` (type: download) |
| 차감 API | idphoto-kr:743 → portal:1274 (Firestore 트랜잭션) |
| 실패 처리 | 402 → `showCreditModal(70, credits, 'download')` |

### 보조 게이트: 워터마크 프리뷰

| 항목 | 값 |
|------|-----|
| 위치 | result.js:229 `generateWatermarkPreview()` |
| 기능 | 클라이언트측 Canvas 워터마크 오버레이 (MONKOS 텍스트) |
| 제한 효과 | ⚠️ **표시용** — 실제 다운로드 이미지(`store.generated`)에는 워터마크 없음 |

---

## 조사 포인트 4: 서버 사이드 차단

### `/api/credit/use` (idphoto-kr server.js:743-752)

```javascript
app.post('/api/credit/use', async (req, res) => {
  if (!req.body.userId) return res.status(400).json({ error: '로그인 필요' });
  const result = await useCredits(req.body.userId, req.body.type || 'download');
  res.status(result.success ? 200 : 402).json(result);
});
```

→ portal `/api/credits/use` (server.js:1274-1330)로 프록시

### 실패 시 응답

| 시나리오 | HTTP | Body |
|---------|------|------|
| userId 미전달 | 400 | `{ error: '로그인 필요' }` |
| 크레딧 부족 | **402** | `{ success: false, error: '크레딧 부족', credits: 현재값, required: 필요값 }` |
| 유효하지 않은 type | 400 | `{ error: 'type은 generate 또는 download' }` |
| 서버 에러 | 500 | `{ error: 에러메시지 }` |

### 프론트 처리

| 응답 | 프론트 처리 | 코드 |
|------|-----------|------|
| 402 (생성) | `showCreditModal(required, credits, 'generate')` | result.js:236-237 |
| 402 (다운로드) | `showCreditModal(required, credits, 'download')` | result.js:306-307 |
| 기타 에러 | `Monk.log()` (사용자 미통지) | result.js:309 |

### 크레딧 차감하는 다른 엔드포인트

| 엔드포인트 | 위치 | 차감 방식 |
|-----------|------|----------|
| `/api/idgen` | server.js:641 | 내부에서 `useCredits()` 직접 호출 (생성 10c) |
| `/api/generate` | server.js:593 | 내부에서 `useCredits()` 직접 호출 (생성 10c) |
| `/api/credit/use` | server.js:743 | 클라이언트 직접 호출 (다운로드 70c) |

→ 생성 API는 **내부에서 크레딧을 직접 차감**하므로, 클라이언트가 별도로 `/api/credit/use`를 호출하지 않음.

---

## 조사 포인트 5: 토스 테스트키 행동

### 결론: ✅ **테스트키는 실제 결제창 팝업을 띄움**

토스페이먼츠 공식 문서 확인 결과:

| 항목 | 답변 |
|------|------|
| 결제창 팝업 | **YES** — 프로덕션과 동일한 결제창 UI 표시 |
| 자동 승인 | **NO** — 사용자가 직접 카드 정보 입력 + 인증 필요 |
| 실제 출금 | **NO** — 가상 결제만 (테스트 환경) |
| UI 차이 | 거의 없음 (라이브와 동일한 UI) |

> "테스트용 Key를 사용하면 결제의 모든 과정이 실제 결제와 동일하게 진행되며, 통장에서 결제 금액이 '출금'되는 것만 빼고 있습니다."
> — 토스페이먼츠 공식 문서

### 토스 직원이 결제창 없이 E2E 통과한 원인 분석

토스 테스트키는 결제창을 **반드시 띄우므로**, "결제창 팝업이 안 뜨고 통과"된 것은 테스트키 행동이 아닌 **크레딧 게이트 부재** 때문이다:

1. 토스 직원이 **비로그인 상태**로 테스트했을 가능성
2. 비로그인 → 생성 무료 (GATE 1 바이패스) → 다운로드 무료 (GATE 2 바이패스)
3. 결제창이 "안 뜬" 것이 아니라, **결제가 필요한 시점 자체가 없었음**

→ 결제 SDK 문제가 아닌 **비즈니스 로직 문제** (비로그인 사용자 무과금 허용)

---

## 발견 이슈 요약

| # | 심각도 | 항목 | 상태 | 설계 판단 필요 |
|---|--------|------|------|--------------|
| 1 | 🔴 **Critical** | 비로그인 사용자 무료 생성+다운로드 가능 | 📋 보고 | ✅ 서버/클라이언트 양측 게이트 설계 필요 |
| 2 | 🟡 **Medium** | 워터마크가 표시용이라 실제 다운로드 이미지는 클린 | 📋 보고 | ✅ 서버측 워터마크 삽입 또는 다운로드 게이트 강화 |
| 3 | 🟢 **Low** | 생성 버튼에 사전 크레딧 체크 없음 (API 호출 후 402) | 📋 보고 | UX 개선: 버튼 비활성화 또는 사전 체크 |

### 수정 제안 (설계 판단 대기)

**이슈 1 해결 방향** (택 1):
- A) 서버측: `/api/idgen`에서 `if (!userId)` → 401 반환 (생성 자체 차단)
- B) 클라이언트측: `confirmAndGenerate()` 진입 시 `store.user.id` 체크 + `downloadResult()`에서 비로그인 분기 삭제
- C) A+B 동시 적용 (권장: 서버=정본, 클라이언트=UX 보조)

**이슈 2 해결 방향**:
- 서버에서 생성 결과에 워터마크 삽입 → 다운로드 크레딧 차감 후 클린 버전 반환
- 또는 결과 이미지를 서버에 보관하고, 클라이언트에는 워터마크 버전만 전달

---

## 전체 플로우 차트

```
[비로그인]                          [로그인 + 크레딧 보유]
    │                                    │
    ▼                                    ▼
촬영 준비 (prep.html)              촬영 준비 (prep.html)
    │ (체크 없음)                        │ (체크 없음)
    ▼                                    ▼
AI 코칭 (camera.html)              AI 코칭 (camera.html)
    │ (체크 없음)                        │ (체크 없음)
    ▼                                    ▼
촬영 확인 (result.html)            촬영 확인 (result.html)
    │                                    │
    ▼                                    ▼
AI 생성 (/api/idgen)               AI 생성 (/api/idgen)
    │ userId=null → 차감 SKIP            │ userId 존재 → 10c 차감
    │ ✅ 무료 생성                       │ 잔액 부족 → 402 → 모달
    ▼                                    ▼
다운로드 (downloadResult)          다운로드 (downloadResult)
    │ !store.user.id → 바이패스          │ 70c 체크 → creditUse API
    │ ✅ 무료 다운로드                    │ 잔액 부족 → 402 → 모달
    ▼                                    ▼
수령처 (thankyou.html)             수령처 (thankyou.html)
    │ ✅ 클린 이미지 수령                 │ ✅ 클린 이미지 수령
```
