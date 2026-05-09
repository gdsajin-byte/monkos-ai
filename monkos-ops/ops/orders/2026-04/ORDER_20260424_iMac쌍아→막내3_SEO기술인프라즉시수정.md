---
type: order
date: 2026-04-24
from: iMac/쌍아
to: iMac/막내3
status: 대기
priority: 2
---

[2026-04-24 13:37 KST] iMac/쌍아 → iMac/막내3

# ORDER: SEO 기술 인프라 즉시 수정

## 배경

Organic Search 유입이 30일간 41명(2%). 오가닉 기반이 없으면 광고 끄는 순간 트래픽 소멸.
기술적 SEO 인프라에 빈틈이 다수 발견됨. 즉시 수정 가능한 항목을 일괄 처리.

## 임무 — 아래 항목 일괄 수정

### 1. monk.kr Google Analytics 적용
- `MONK_kr/index.html`에 GA 추적 코드 추가
- GA ID: `G-JPZWSJ3323`, Ads: `G-FKG0CPTC14`
- 다른 서비스(portal, idphoto-kr)의 gtag 패턴 그대로 적용
- monk.kr 하위 주요 페이지에도 동일 적용

### 2. idphoto-kr/jp sitemap.xml 생성
- 현재 sitemap 미존재. robots.txt에만 경로 선언.
- 각 서비스 페이지 구조 분석 후 sitemap.xml 생성
- `monkos_AI/idphoto-kr/public/sitemap.xml`
- `monkos_AI/idphoto-jp/public/sitemap.xml`

### 3. og:image 부재 수정
- monkos.ai, monk.kr에 og:image 미설정
- 기존 이미지 자산(`monkos-ops/works/config/SEO_files/logo/og-image-sample.png`) 활용
- 필요 시 적절한 og:image 경로 설정

### 4. favicon-192 적용
- 전 서비스 favicon-192 미적용 상태
- SEO 체크리스트 기준 favicon-192 PWA 요구사항

### 5. monk.kr sitemap 최신화
- 현재 sitemap 최종 업데이트 2026-02-12 (2개월+ 경과)
- 이후 추가된 페이지(specs 허브 등) 반영

### 6. 배포
- monk.kr: Cloudflare Pages — `git push` 후 자동 배포
- idphoto-kr/jp: `deploy.sh` 경유

## ⚠️ 준수 조항
- 배포는 `deploy.sh` 경유 (법률 ch5 2조). monk.kr은 CF Pages이므로 git push만.
- 기존 SEO 설정(hreflang, JSON-LD 등) 절대 훼손하지 말 것

## 산출물
- `COMPLETION_20260424_막내3_SEO인프라수정.md` — 수정 항목별 before/after + 배포 확인

## 참조
- SEO 현황 매트릭스: `monkos-ops/works/config/SEO_files/` 내 체크리스트
- monk.kr: `MONK_kr/`
- portal: `monkos_AI/portal/public/`
- idphoto-kr: `monkos_AI/idphoto-kr/public/`
- idphoto-jp: `monkos_AI/idphoto-jp/public/`
- GA 데이터: Organic Search 41명/30일 (전체 2%)
