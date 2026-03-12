---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내1
subject: KR 땡큐 페이지 정리 — 이벤트/CS/인화 섹션 삭제
priority: P1
category: 프론트엔드
---

# 지시서: KR 땡큐 페이지 정리 — 이벤트/CS/인화 섹션 삭제

> **[2026-03-12 14:53 KST]** iMac/쌍아 → iMac/막내1
> 방침: 인앱은 핵심 기능만. 모든 이벤트/CS/마케팅은 외부 채널(카카오/텔레그램/포털/랜딩)에서 처리.

---

## 작업 대상

| 파일 | 경로 |
|------|------|
| thankyou.html | `monkos_AI/idphoto-kr/public/thankyou.html` |
| thankyou.js | `monkos_AI/idphoto-kr/public/thankyou.js` |

## thankyou.html — 섹션 삭제 (4건)

아래 섹션을 HTML에서 **완전 삭제**:

### 1. 인화 서비스 · CS (§2-9)
```html
<!-- §2-9 인화 서비스·CS -->
<a class="ty-cs-card" href="https://t.me/monkos_support_bot" ...>...</a>
```

### 2. SNS 인증 이벤트 (§2-10)
```html
<!-- §2-10 SNS 인증 이벤트 (로그인 시만) -->
<div class="ty-event-card" id="ty-event-section" ...>...</div>
```

### 3. 발급 보장 (§2-11)
```html
<!-- §2-11 발급 보장 -->
<div class="ty-guarantee-card">...</div>
```

### 4. 크레딧 정책 안내
```html
<!-- 크레딧 정책 안내 -->
<a href="/credits-policy.html" ...>💳 크레딧 사용 안내</a>
```

## thankyou.js — 코드 삭제

### 1. `setupSnsEvent()` 함수 전체 삭제 (178-204행)
### 2. `setupOriginalDownload()` 함수 전체 삭제 (109-129행)
- 풀샷 섹션은 이미 HTML에서 제거됨 (막내1 이전 작업). 함수도 정리.
### 3. `_originalUrl` 상태 변수 삭제 (37행)
### 4. `downloadOriginal()` 함수 전체 삭제 (92-106행)
### 5. init() 내 호출 제거:
- `setupSnsEvent()` 호출 삭제
- `setupOriginalDownload()` 호출 삭제

## 최종 thankyou 레이아웃

```
[🎉 축하 헤더]
[보정 원본 이미지]
[📥 보정 원본 다운로드]
[✂️ 규격 크롭 조정하기 · 무료]
[📸 전후 비교 저장]
[───]
[크레딧 잔고]
[🏠 홈으로]
```

## 커밋

- 이전 작업(표정+셔츠 프롬프트)과 **합쳐서 1커밋** push
- 메시지: `[refactor] KR 땡큐 이벤트/CS 섹션 정리 + 표정/셔츠 프롬프트 보정`

## ⚠️ 준수 조항

- **헌법 8조**: CSS 클래스(.ty-cs-*, .ty-event-*, .ty-guarantee-*)는 잔존해도 무해. HTML 삭제만으로 충분.
- 삭제 대상 외 기존 기능(다운로드, 크롭, 비교, 홈) 영향 없음 확인.

---

**— 지시서 끝 —**
