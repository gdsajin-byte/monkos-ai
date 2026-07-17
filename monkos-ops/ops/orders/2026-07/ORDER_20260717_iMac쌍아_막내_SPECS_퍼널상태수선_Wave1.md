---
type: order
date: 2026-07-17
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_SPECS
subject: specs 퍼널 상태전이 수선 Wave 1 — 즉효 4건
---

**[2026-07-17 16:03 KST]** iMac/쌍아 → 막내

# specs 퍼널 상태전이 수선 Wave 1 — 즉효 4건

## 배경

specs-funnel.js 전체 상태 흐름 분석(쌍아) + 행 단위 교차 검증(민아)에서 결함 15건 식별. 이 중 즉효 4건을 Wave 1로 선분리. 결제 코어이므로 **부분 패치가 아닌 상태 전이 단위 일괄 수정**.

- 쌍아 분석: 세션 내 흐름도 (구두 보고)
- 민아 감사: `REVIEW_20260717_iMac민아_퍼널상태전이_전수감사.md`

## ⚠️ 준수 조항

- 헌법 4조: 결제 관련 코드 — 테스트 필수
- ch2: 기존 상태 변수·함수명 유지 (리팩토링은 Wave 2)
- **부분 패치 금지**: 4건을 하나의 커밋으로 묶되, 각 수정이 다른 경로에 영향 안 주는지 전 경로 확인

## 변경 대상

### Task 1. i18n 문구 교정 — 4언어 × 2문구 = 8곳

**파일:** `monkos_AI/portal/lib/cms/specs-i18n.js`

**(A) genLimit — "재생성 3회" → 1결제 1생성 체제 반영**

| 행 | 언어 | 현재 | 교체 |
|----|------|------|------|
| 196 | ko | `재생성 한도(3회)를 모두 사용했습니다` | `이 결제 건의 생성이 완료되었습니다. 새로 만들려면 다시 결제해 주세요.` |
| 408 | ja | (동일 구조) | `この決済の生成は完了しました。新しく作成するには再度お支払いください。` |
| 615 | en | (동일 구조) | `This payment's generation is complete. Please pay again to create a new one.` |
| 823 | es | (동일 구조) | `La generación de este pago se completó. Pague de nuevo para crear una nueva.` |

**(B) tokenExpired — "문의해주세요" → 재결제 유도**

| 행 | 언어 | 현재 | 교체 |
|----|------|------|------|
| 195 | ko | `결제 유효기간(24시간)이 지났습니다. info@monkos.ai로 문의해주세요.` | `결제 유효기간(24시간)이 지났습니다. 다시 결제해 주세요.` |
| 407 | ja | (동일 구조) | `お支払いの有効期限（24時間）が切れました。再度お支払いください。` |
| 614 | en | (동일 구조) | `This payment expired (24h). Please pay again.` |
| 822 | es | (동일 구조) | `Este pago expiró (24h). Pague de nuevo.` |

### Task 2. 토큰 만료 클라이언트 사전 검사

**파일:** `monkos_AI/portal/public/js/specs-funnel.js`

**원인:** `loadOrder()`(98행)가 sessionStorage에서 토큰을 복원할 때 만료 여부를 안 봄. `hasUsableToken()`(92행)도 만료 무지. 서버는 `tokenExpiresAt`을 이미 응답에 포함(payments.js:164,944) 하지만 클라이언트가 버리고 있음.

**수정:**

(a) `persistOrder()` — 저장 객체에 `expiresAt` 필드 추가:
```javascript
// persistOrder 내 저장 객체
{ orderId, token, remaining, slug, ts, attire, subject, expiresAt }
```
`expiresAt` 값은 서버 응답의 `tokenExpiresAt` 또는 `Date.now() + 24*60*60*1000` 폴백.

(b) `loadOrder()` — 복원 시 만료 검사 추가:
```javascript
// loadOrder 내, d.slug === CFG.slug 검사 다음에:
if (d.expiresAt && Date.now() > d.expiresAt) {
  sessionStorage.removeItem(ORDER_KEY);
  return; // 만료 토큰 조용히 버림
}
```

(c) `hasUsableToken()` — 만료 검사 추가:
```javascript
function hasUsableToken() {
  if (!pay.token) return false;
  if (pay.expiresAt && Date.now() > pay.expiresAt) {
    pay.token = null; pay.remaining = null; pay.expiresAt = null;
    return false;
  }
  return pay.remaining === null || pay.remaining > 0;
}
```

(d) 토큰 발급 시점에서 `pay.expiresAt` 설정:
- toss 확인 응답(~1089행): `pay.expiresAt = data.tokenExpiresAt || (Date.now() + 86400000);`
- lemon 폴링 성공(~848행): 동일
- `doGenerate` 응답에서 `remainingGenerates` 세팅하는 곳(~960행): `pay.expiresAt` 보존 (이미 설정됨)

### Task 3. sessionStorage 이미지 slug 스코프

**파일:** `monkos_AI/portal/public/js/specs-funnel.js`

**원인:** `IMG_KEY = 'monkos_specs_img'` 고정(21행). 다른 규격 페이지에서 저장한 이미지가 엉뚱한 규격에 복원됨.

**수정:**

(a) `IMG_KEY`를 slug 포함으로 변경하거나, 저장 시 slug을 함께 저장:

**방법 A (키 변경):**
```javascript
const IMG_KEY = `monkos_specs_img:${CFG.slug}`;
```
간단하지만 구 키(`monkos_specs_img`)에 남은 데이터가 고아됨.

**방법 B (slug 필드 추가 — 권장):**
```javascript
// persistImage 시 (191행 부근)
sessionStorage.setItem(IMG_KEY, JSON.stringify({ slug: CFG.slug, data: dataUrl }));

// loadImage 시 (137행 부근)
const raw = sessionStorage.getItem(IMG_KEY);
if (raw) {
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === 'object' && obj.slug === CFG.slug) {
      uploadedBase64 = obj.data;
    } else if (typeof obj === 'string') {
      // 구 형식 호환 — slug 미검사 대신 경고 로그
      uploadedBase64 = obj;
    }
  } catch { uploadedBase64 = raw; } // 구 형식 (plain string)
}
```

### Task 4. TOKEN 에러 시 이미지 보존

**파일:** `monkos_AI/portal/public/js/specs-funnel.js`

**원인:** TOKEN_EXPIRED/TOKEN_USED/INVALID_TOKEN 에러 시 `clearStored()`(986행)가 `ORDER_KEY`와 `IMG_KEY` 양쪽을 삭제. 유저가 돌아오면 이미지 재업로드 강요.

**수정:** 토큰 에러 시 주문만 삭제, 이미지는 보존:

```javascript
// 986행 부근 — TOKEN_EXPIRED / TOKEN_USED / INVALID_TOKEN 처리
// 현재:
// pay.token = null; pay.remaining = null; clearStored();
// 교체:
pay.token = null; pay.remaining = null; pay.expiresAt = null;
sessionStorage.removeItem(ORDER_KEY);  // 주문만 삭제
// IMG_KEY 보존 — 유저가 재결제 후 같은 이미지로 재시도 가능
```

`clearStored()` 함수 자체는 건드리지 않음 — 다른 경로(정상 다운로드 완료 후)에서 여전히 사용.

## 검증 체크리스트

- [ ] Task 1: prod에서 ko/ja/en/es 각 specs 페이지 접속 → generate 한도 초과 시 "1결제 1생성" 문구 확인
- [ ] Task 2: sessionStorage에 구 토큰(24시간 이전 ts) 수동 세팅 → 페이지 로드 시 토큰 자동 폐기 확인 → 정상 생성 흐름 진입
- [ ] Task 3: kr-passport에서 이미지 업로드 → us-passport 이동 → 이미지 미복원 확인
- [ ] Task 4: 만료 토큰으로 생성 시도 → TOKEN_EXPIRED 에러 → 이미지 보존 + 결제 화면 진입 확인
- [ ] 전 경로 회귀: 무료 생성(T0) → 결과 → 다운로드 정상
- [ ] 전 경로 회귀: 토스 결제 → 리다이렉트 → 생성 → 다운로드 정상
- [ ] 전 경로 회귀: 크레딧 결제 → 생성 → 다운로드 정상
- [ ] jest 기존 테스트 전건 통과

## 경로 충돌 체크

- specs-funnel.js, specs-i18n.js — 현재 미커밋 변경 없음
- 민아 specs-data.json 핫픽스·es 클린업은 이미 배포 완료 (무관)
- 사이트맵·어드민 리뷰 작업 완료·배포 완료 (무관)

## 완료 후

- 민아 재검증 필수 (감사=민아 본령)
- Wave 2 설계서는 별도 — 이번 지시서 범위 밖
