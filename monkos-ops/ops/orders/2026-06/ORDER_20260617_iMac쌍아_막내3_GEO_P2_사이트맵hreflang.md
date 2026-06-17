---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내3
portfolio: PF_CITADEL
status: 대기
---

# 지시서 — GEO P2 사이트맵 hreflang 교차링크

> **[2026-06-17 12:17 KST] iMac/쌍아 → iMac/막내3**
> 민아 코드 실측 진단 기반. HTML `<head>` hreflang은 이미 완비(specs·블로그 양쪽). 사이트맵만 미구현.

## 배경

- specs 1,335페이지 + 블로그에 HTML hreflang 태그는 완비 (render-specs.js, render-blog.js)
- 그러나 **사이트맵(sitemap-specs.xml, sitemap-blog.xml)에는 `<xhtml:link rel="alternate" hreflang>` 미구현**
- 구글은 HTML과 사이트맵 양쪽에서 hreflang을 읽음. 양쪽 다 있으면 언어 클러스터 인식 정확도 상승
- 민아 실측: `render-sitemap.js:31-37` wrapUrlset()에 `xmlns:xhtml` 미선언, `urlEntry()`에 alternate 링크 미생성

## 태스크

### Task 1 — sitemap-specs.xml hreflang 추가

**대상**: `monkos_AI/portal/lib/cms/render-sitemap.js`

1. `wrapUrlset()` (line 31~37)에 xhtml 네임스페이스 추가:
   ```xml
   xmlns:xhtml="http://www.w3.org/1999/xhtml"
   ```

2. specs 사이트맵 생성부 (line 114~137)에서 각 URL 엔트리에 형제 언어 alternate 링크 추가:
   ```xml
   <url>
     <loc>https://monkos.ai/specs/passport-korea</loc>
     <xhtml:link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/passport-korea"/>
     <xhtml:link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/passport-korea"/>
     <xhtml:link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/passport-korea"/>
     <xhtml:link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/passport-korea"/>
     <lastmod>...</lastmod>
   </url>
   ```
   - specs는 전 문서가 ko/en/ja 3개 언어 존재 → 무조건 3+x-default = 4개 태그
   - ko/en/ja 각각의 `<url>` 엔트리에 동일한 4개 alternate 링크 삽입

### Task 2 — sitemap-blog.xml hreflang 추가

블로그는 specs와 달리 **번역이 존재하는 글만** alternate를 넣어야 한다.
- render-blog.js:253-277의 로직 참조 — published된 언어 버전만 동적 출력하는 패턴
- 사이트맵에서도 동일 로직: 해당 slug의 en/ja 번역본이 존재+published일 때만 alternate 추가
- 번역 없는 글은 ko + x-default만

### Task 3 — guide/ai-photo hreflang 비대칭 확인

민아 발견: `render-static.js:505-507` — `/guide/ai-photo`에 ko + x-default만 있고 ja/en 누락.
- `/ja/guide/ai-photo`, `/en/guide/ai-photo` 페이지가 실제 존재하는지 확인
- 존재하면 hreflang 추가, 존재하지 않으면 현행 정상 → 보고만

### Task 4 — 배포 + 실측

- `deploy.sh` 경유 monkos.ai 배포
- 배포 후 실측:
  - `curl https://monkos.ai/sitemap-specs.xml | head -50` — xhtml:link 태그 확인
  - `curl https://monkos.ai/sitemap-blog.xml | head -50` — 동일
  - specs 임의 3개 URL의 hreflang 교차 정합성 확인 (ko URL에서 en/ja 링크가 맞는지)

## ⚠️ 준수 조항

- 배포: `deploy.sh` 경유 (ch5 2조)
- sitemap XML이 깨지면 전체 색인에 영향 → 배포 전 로컬에서 XML 유효성 확인
- 시크릿 생성/추측 금지 (헌법 4조 1항)

## 완료 기준

- [ ] sitemap-specs.xml — 전 URL에 hreflang 4개(ko/en/ja/x-default) 삽입
- [ ] sitemap-blog.xml — 번역 존재 글만 동적 hreflang 삽입
- [ ] guide/ai-photo 비대칭 — 확인 후 조치 또는 정상 보고
- [ ] 배포 + 실측 확인
