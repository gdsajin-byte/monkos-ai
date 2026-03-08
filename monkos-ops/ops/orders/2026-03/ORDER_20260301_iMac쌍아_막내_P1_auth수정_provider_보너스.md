---
type: ORDER
date: 2026-03-01
from: iMac/쌍아
to: 막내 (배정 대기)
priority: P1
scope: 포털 백엔드 수정 (monkos_AI/portal/lib/auth.js)
---

# 지시서: P1 — Google provider 필드 추가 + 가입보너스 80c→10c

> **[2026-03-01 14:24 KST] iMac/쌍아 → 막내**
> **긴급도**: P1 — 데이터 품질 + 과금 체계 변경
> **범위**: `monkos_AI/portal/lib/auth.js` 1개 파일 + 기존 데이터 패치
> **배포**: Cloud Run `monkos-portal` 재배포 필요

---

## 작업 1: Google 가입 시 provider 필드 추가

### 현재 문제
- Kakao 가입: `provider: 'kakao'` ✅ (auth.js:74-75)
- LINE 가입: `provider: 'line'` ✅ (auth.js:252-253)
- Google 가입: **provider 필드 없음** ❌ (auth.js:394-408)

### 수정
`auth.js` 라인 394~408 부근, Google 신규 사용자 저장 객체에 추가:

```javascript
const user = {
  id: tokenInfo.sub,
  provider: 'google',    // ← 이 줄 추가
  email: tokenInfo.email,
  name: tokenInfo.name,
  // ... 나머지 동일
};
```

### 기존 Google 가입자 데이터 패치
현재 Google 가입자 11명에 `provider: 'google'` 필드 일괄 추가.

방법 (택1):
- A) 일회성 스크립트로 Firestore users 컬렉션에서 provider 필드 없는 문서에 `provider: 'google'` 추가
- B) auth.js의 기존 사용자 업데이트 로직(isNewUser가 false인 경우)에서 provider가 없으면 추가

**A 방법 권장** — 깨끗하게 한 번에 패치하고 끝.

```javascript
// 일회성 패치 (실행 후 제거)
const snapshot = await firestore.collection('users').get();
for (const doc of snapshot.docs) {
  const data = doc.data();
  if (!data.provider) {
    await doc.ref.update({ provider: 'google' });
    console.log(`Patched: ${doc.id}`);
  }
}
```

⚠️ provider가 없는 문서 = Google 가입자라는 전제. Kakao/LINE은 이미 provider 필드 있음.

---

## 작업 2: 가입보너스 80c → 10c

### 수정 대상 (3곳)

| Provider | 파일:라인 | 변경 |
|----------|----------|------|
| Kakao | auth.js:80 | `credits: 80` → `credits: 10` |
| LINE | auth.js:258 | `credits: 80` → `credits: 10` |
| Google | auth.js:406 | `credits: 80` → `credits: 10` |

### 주의사항
- **기존 가입자 잔액은 절대 변경하지 않음** — 신규 가입자부터 적용
- 가입보너스 10c = 생성 1회분 (1컷 체험)

---

## 작업 3 (조사만): events 필드 미동작 원인 확인

### 조사 내용
events.js:323-352에서 `events.{eventType}` 기록 코드가 있는데, DB에서 events 필드가 0명에게 존재하지 않음.

**확인할 것:**
1. 프론트(gate.js)에서 `/api/credits/event` API를 실제로 호출하는지
2. 호출한다면 응답이 성공인지 에러인지
3. 20명 중 이벤트 조건(채널 가입 확인 등)을 충족한 사람이 있었는지

**결론만 보고** — 원인이 "이벤트 경로에 도달한 유저 0명"이면 코드 문제 아님. gate.js는 P2에서 제거 예정이므로 수정 불필요.

---

## 검증

### 배포 전
1. auth.js에서 3곳 모두 `credits: 10`인지 확인
2. Google 가입 경로에 `provider: 'google'` 포함 확인
3. 기존 데이터 패치: Firestore에서 provider 없는 문서에 'google' 추가 확인

### 배포 후
1. 테스트 Google 계정으로 신규 가입 → credits: 10, provider: 'google' 확인
2. 기존 사용자 로그인 → 잔액 변동 없음 확인

---

## 산출물

- auth.js 변경 내역
- 기존 데이터 패치 실행 결과 (N명 패치)
- events 미동작 원인 조사 결과 (1~2줄)
- Cloud Run 배포 리비전

---

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: 기존 사용자 크레딧 잔액 변경 금지
- **헌법 제8조 (파괴적 명령 금지)**: 사용자 문서 삭제 금지
- **헌법 제2조 (완료 보고)**: `✅❌💡⏳📁🔀` 형식 보고

---

**[2026-03-01 14:24 KST] iMac/쌍아 발행**
