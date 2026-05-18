---
type: ORDER
date: 2026-03-25
from: iMac/민아 (작가님 지시) → iMac/쌍아 보정
to: 막내1
priority: HIGH
subject: SEO 긴급 — ja/en 블로그 hreflang 양방향 + sitemap 정리 + noindex 처리
---

# SEO 긴급 보강 지시서

**[2026-03-25 18:50 KST] iMac/민아 → 막내**

---

## 배경

monkos.ai 서치콘솔에서 72개 페이지가 "발견됨 - 색인 미생성" 상태.
원인 조사 결과, ja/en 블로그 페이지에 **hreflang 태그와 canonical이 전혀 없음** 확인.
구글 hreflang은 양방향 필수 — 현재 ko→ja/en만 있고 ja→ko, en→ko 역참조가 없어 **전체 hreflang 무효**.

---

## 작업 항목

### 작업 1: ja/en 블로그 페이지 hreflang + canonical 추가 (최우선)

**현재 상태** (실측):
```
ko /blog/ai → hreflang: ko✅ ja✅ en✅ x-default✅ / canonical✅
ja /ja/blog/... → hreflang: ❌ 0개 / canonical: ❌ 없음
en /en/blog/... → hreflang: ❌ 0개 / canonical: ❌ 없음
```

**목표 상태**:
```
모든 ja/en 블로그 페이지 <head>에:
<link rel="canonical" href="https://monkos.ai/ja/blog/{slug}" />
<link rel="alternate" hreflang="ko" href="https://monkos.ai/blog/{ko-slug}" />
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/blog/{ja-slug}" />
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/blog/{en-slug}" />
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/{ko-slug}" />
```

**구현 가이드**:
- 블로그 상세 페이지의 SSR/렌더링 로직에서 `<head>` 태그 생성 부분 확인
- ko 페이지에는 이미 구현되어 있으므로, 해당 로직을 ja/en 라우트에도 동일 적용
- **slug는 전 언어 영문 통일** (2026-03-22 확정, translate.js에 반영 완료). 따라서 3개국어 슬러그 매핑 불필요 — 경로 접두어(`/ja/`, `/en/`)만 교체하면 hreflang 완성
- **핵심**: ko 페이지의 hreflang 로직을 찾아서 ja/en에도 동일 패턴 적용
- 참고: `REPORT_20260322_쌍아_slug한글문제_보고서.md`, `ORDER_20260322_iMac쌍아_막내2_번역파이프라인_slug+태그+summary.md`

**검증 방법**:
```bash
# ja 페이지 확인
curl -s https://monkos.ai/ja/blog/{테스트슬러그} | grep -i hreflang
# en 페이지 확인
curl -s https://monkos.ai/en/blog/{테스트슬러그} | grep -i hreflang
# 각각 4개(ko, ja, en, x-default)가 나와야 정상
```

### 작업 2: sitemap.xml 중복 URL 제거

**현재 문제**: 동일 URL이 2회 등록된 케이스 존재
- `/ja/blog/5-10` — 2회
- `/en/blog/5-10` — 2회
- `/ja/blog/employment-id-photo-hair-part-best-first-impression` — 2회

**조치**: sitemap 생성 로직에서 중복 제거(dedupe) 처리. Set 또는 Map으로 URL 유일성 보장.

### 작업 3: 약관/정책 페이지 noindex 처리

**대상**: idphoto-jp.monkos.ai / idphoto-kr.monkos.ai 의 약관류 페이지
- `/terms.html`, `/refund.html`, `/credits-policy.html`, `/privacy.html`, `/tokusho.html`, `/charge`

**조치**: 해당 페이지 `<head>`에 추가
```html
<meta name="robots" content="noindex, follow">
```

**이유**: 약관 페이지는 검색 가치 없음. 구글 크롤링 예산이 블로그 등 중요 페이지에 집중되도록.

---

## ⚠️ 준수 조항

- 헌법 제4조(구속·윤리) 1항: `.env`, 배포 설정 수정 시 사전 승인
- 헌법 제2조(통신) 3항: 계획 제시 → 승인 → 실행
- 법률 ch2: 기존 코드 패턴 준수 (ko 페이지의 hreflang 구현을 참고)
- 헌법 제3조(적립) 1항: 타임스탬프 `date` 명령 취득
- 헌법 제3조(적립) 2항: 완료 보고 필수

---

## 배포

- 코드 수정 완료 후 **dev 배포로 검증** (`./deploy.sh dev`)
- dev 검증 통과 확인 후 **prod 배포 승인 요청** → 쌍아 또는 작가님 승인 후 실행
- 배포 후 `curl` 검증 필수

---

## 완료 기준

- [ ] ja/en 블로그 아무 페이지에서 `curl | grep hreflang` → 4개 태그 확인
- [ ] ja/en 블로그 페이지에서 canonical 태그 확인
- [ ] sitemap.xml에 중복 URL 0건
- [ ] 약관 페이지 noindex 태그 확인
- [ ] dev 배포 검증 완료
- [ ] prod 배포 승인 요청

---

**[민아 원안 발행: 2026-03-25 18:50 KST]**
**[쌍아 보정: 2026-03-25 18:55 KST] — 5축 조번호 갱신 + 배포 절차 추가**
