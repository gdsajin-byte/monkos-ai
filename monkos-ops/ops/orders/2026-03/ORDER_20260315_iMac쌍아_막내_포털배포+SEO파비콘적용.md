---
type: ORDER
id: ORDER_20260315_iMac쌍아_막내_포털배포+SEO파비콘적용
date: 2026-03-15
from: iMac/쌍아
to: 막내
priority: P1
status: 대기
---

# 포털 배포 + SEO 파비콘 적용

## 목표

1. 모바일 좌우 흔들림 수정 반영 (이미 커밋 완료)
2. 파비콘 풀세트 적용 (Google SERP 노출 해결)
3. og:image 메타 태그 추가
4. ADMIN_UIDS 환경변수 설정 (Google OAuth 관리자 3명 등록)
5. 포털 프로덕션 배포

## Task

### Task 1: 파비콘 풀세트 배치

`monkos-ops/works/config/SEO_files/logo/`에서 포털 `public/`으로 복사:

```
favicon-192.png  → public/favicon-192.png  (신규)
favicon-512.png  → public/favicon-512.png  (신규)
```

### Task 2: index.html favicon 태그 수정

현재:
```html
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

변경:
```html
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

- PNG 32+192를 SVG보다 먼저 선언 (Google 크롤러 우선 인식)

### Task 3: og:image 메타 태그 추가

index.html `<head>` 내 og 태그 영역에 추가:
```html
<meta property="og:image" content="https://monkos.ai/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

- og-image.png는 현재 포털에 없음. idphoto-kr의 `og-image.png`를 임시 사용:
  `monkos_AI/idphoto-kr/public/og-image.png` → `monkos_AI/portal/public/og-image.png` 복사
- 포털 전용 og-image는 추후 철창이 디자인 후 교체

### Task 4: render.js SSR 페이지 favicon 태그 수정

`lib/cms/render.js`의 `layoutHead()` 함수 내 favicon 태그도 동일하게 수정:
```html
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

### Task 5: ADMIN_UIDS 환경변수 설정

포털 `.env`에 Google OAuth 관리자 3명의 sub ID를 등록:

```
ADMIN_UIDS=108827115052045057530,115646365617285208759,104267936176125475886
```

| 이름 | Google sub | 이메일 |
|------|-----------|--------|
| 작가님 | 108827115052045057530 | gdsajin@gmail.com |
| 한송이 | 115646365617285208759 | oneflower0411@gmail.com |
| 꾸 | 104267936176125475886 | gu31245@gmail.com |

- 기존 `ADMIN_UIDS` 값이 있으면 위 값으로 **교체** (카카오 UID는 제거)
- deploy.sh가 `.env`를 Cloud Run 환경변수로 전달하는지 확인. 직접 전달하지 않으면 `gcloud run services update`로 설정

### Task 6: 포털 프로덕션 배포

```bash
cd monkos_AI/portal && bash deploy.sh prod
```

배포 후 검증:
- [ ] monkos.ai 브라우저 탭 파비콘 표시 확인
- [ ] 모바일 좌우 흔들림 해소 확인 (블로그/FAQ 페이지)
- [ ] og:image 확인 (페이지 소스 또는 SNS 미리보기)
- [ ] Google 로그인 후 Admin 링크 표시 확인 (프로바이더 배지 클릭 → 팝오버)

## ⚠️ 준수 조항

- deploy.sh `.env` 경로 주의 — 전 세션 사고 참고 (환경변수 빈 값 덮어쓰기 2분 다운타임)
- `--to-latest` 플래그 사용 금지 (gcloud 550.0.0 호환 문제)

## 커밋 메시지

```
[seo] 포털 파비콘 풀세트 + og:image + 관리자 등록
```
