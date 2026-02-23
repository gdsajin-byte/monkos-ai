# 지시서: idphoto-kr 가격 v2 통일 + 공유보너스 통일 + 토스 준비중 처리

```
[2026-02-22 14:43 KST] iMac/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내2"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식
> - **네 수정 범위**: `prep.html`, `thankyou.html`, `shared.js` (3개 파일)

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | idphoto-kr 가격 v2 통일 + 공유보너스 + 토스 결제 안전 처리 |
| **수정 파일** | `monkos_AI/idphoto-kr/public/prep.html`, `thankyou.html`, `shared.js` (3개) |
| **배포 대상** | 막내1과 동일 서비스(idphoto-kr)이므로 **배포하지 않음** — 막내1이 배포 |
| **브랜치** | `develop` |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지
- **법률 제5장**: prod 배포 금지

---

## 크레딧 v2 정확한 KRW 가격

```
KR 결제 (토스페이먼츠):
  ₩1,450  → 10c   (기본)
  ₩13,050 → 100c  (10% 할인)
  ₩34,800 → 300c  (20% 할인, BEST)
  ₩50,750 → 500c  (30% 할인)

공유 보너스: 100c (1회 한정)
```

---

## 작업 내역

### TASK 1: prep.html — 크레딧 패키지 v2 교체

현재 (L75~L91): 구버전 3패키지
```html
<button class="credit-pkg" onclick="buyCreditsKR(12900, 10)">
    <div class="pkg-credits">10c</div>
    <div class="pkg-price">₩12,900</div>
</button>
<button class="credit-pkg popular" onclick="buyCreditsKR(29900, 30)">
    <div class="pkg-badge">BEST</div>
    <div class="pkg-credits">30c</div>
    <div class="pkg-price">₩29,900</div>
    <div class="pkg-save">23% 할인</div>
</button>
<button class="credit-pkg" onclick="buyCreditsKR(45900, 50)">
    <div class="pkg-credits">50c</div>
    <div class="pkg-price">₩45,900</div>
    <div class="pkg-save">29% 할인</div>
</button>
```

변경: v2 4패키지
```html
<button class="credit-pkg" onclick="buyCreditsKR(1450, 10)">
    <div class="pkg-credits">10c</div>
    <div class="pkg-price">₩1,450</div>
</button>
<button class="credit-pkg" onclick="buyCreditsKR(13050, 100)">
    <div class="pkg-credits">100c</div>
    <div class="pkg-price">₩13,050</div>
    <div class="pkg-save">10% 할인</div>
</button>
<button class="credit-pkg popular" onclick="buyCreditsKR(34800, 300)">
    <div class="pkg-badge">BEST</div>
    <div class="pkg-credits">300c</div>
    <div class="pkg-price">₩34,800</div>
    <div class="pkg-save">20% 할인</div>
</button>
<button class="credit-pkg" onclick="buyCreditsKR(50750, 500)">
    <div class="pkg-credits">500c</div>
    <div class="pkg-price">₩50,750</div>
    <div class="pkg-save">30% 할인</div>
</button>
```

### TASK 2: thankyou.html — 크레딧 패키지 v2 교체

현재 (L75~L91): prep.html과 동일한 구버전 3패키지

변경: TASK 1과 **동일한 v2 4패키지**로 교체 (코드 동일)

### TASK 3: thankyou.html — 공유 보너스 10c → 100c

현재:
```html
<p class="ty-share-title">🎁 SNS 공유하고 10크레딧 받기!</p>
```
변경:
```html
<p class="ty-share-title">🎁 SNS 공유하고 100크레딧 받기!</p>
```

현재:
```html
<span class="tg-icon">✈️</span> 텔레그램으로 10c 받기
```
변경:
```html
<span class="tg-icon">✈️</span> 텔레그램으로 100c 받기
```

현재:
```html
<p class="ty-tg-sub">텔레그램 친구추가 → 캡처 전송 → 즉시 10c 지급!</p>
```
변경:
```html
<p class="ty-tg-sub">텔레그램 친구추가 → 캡처 전송 → 즉시 100c 지급!</p>
```

### TASK 4: shared.js — 토스 결제 "준비 중" 안전 처리

현재 `buyCreditsKR()` (L107~L137): TOSS_CLIENT_KEY가 빈 문자열이면 `TossPayments('')` 호출 → 크래시

변경 — 함수 시작부에 가드 추가:
```js
export async function buyCreditsKR(amount, credits) {
  if (!store.user.id) {
    alert('로그인이 필요합니다');
    return;
  }

  // 토스 심사 중 — 클라이언트 키 없으면 안내 후 리턴
  if (!TOSS_CLIENT_KEY) {
    alert('결제 시스템 준비 중입니다.\n곧 이용 가능합니다!');
    return;
  }

  closeCreditModal();
  // ... 이하 기존 코드 유지
```

**기존 코드는 그대로 유지**. `if (!TOSS_CLIENT_KEY)` 가드만 추가. 토스 키가 들어오면 자동으로 정상 동작.

### TASK 5: 커밋 + push

```
[update] idphoto-kr 가격 v2 통일 + 공유보너스 100c + 토스 준비중 처리

- prep.html: 크레딧 패키지 3개→4개 v2 (₩1,450~₩50,750)
- thankyou.html: 크레딧 패키지 v2 + 공유보너스 10c→100c
- shared.js: TOSS_CLIENT_KEY 빈값 시 "준비 중" 안내 (크래시 방지)
지시서: TASK_20260222_막내2_idphoto_kr_price_fix.md
```

---

## 금지 사항

- `prod` 배포 금지
- **배포하지 않음** — 막내1이 idphoto-kr dev 배포 담당. 네가 배포하면 충돌 가능
- `index.html`, `result.html`, `config.js`, `server.js` 수정 금지 (네 범위 밖)
- shared.js에서 buyCreditsKR() 이외 함수 수정 금지
- `closeCreditModal()` 호출 위치 변경 금지 (가드 이후에 유지)

## 완료 조건

1. prep.html 크레딧 패키지 4개 (₩1,450/₩13,050/₩34,800/₩50,750)
2. thankyou.html 크레딧 패키지 4개 (동일)
3. thankyou.html 공유 보너스 100c 표기 (10c 잔존 0건)
4. shared.js buyCreditsKR()에 TOSS_CLIENT_KEY 빈값 가드 존재
5. develop 커밋 + push 완료
6. **배포는 막내1에게 위임 (배포 시도 금지)**

## ⚠️ 배포 순서 주의

막내1과 동일 서비스(idphoto-kr)를 수정하므로:
1. 막내2(너): 코드 수정 + 커밋 + push만
2. 막내1: index.html 수정 + 커밋 + push + **배포는 막내1이 함**
3. 둘 다 커밋 후 막내1이 pull → 배포

**네가 deploy.sh를 실행하면 안 됨!**
