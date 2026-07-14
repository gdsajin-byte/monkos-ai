---
name: seo-query
description: SEO 데이터 즉시 조회 — 네이버/GSC/GA4/Bing/CWV 전 채널 수집
user_invocable: true
---

# /seo-query — SEO 데이터 즉시 조회

이 스킬이 호출되면 아래를 실행한다:

1. `scripts/tools/seo_collect.sh all` 실행 (Bash 도구 사용)
2. JSON 출력을 파싱하여 마크다운 테이블로 정리
3. 채널별 성과 + 이상 징후를 보고

채널별 단독 조회:
- `scripts/tools/seo_collect.sh naver-searchad` — 네이버 키워드 검색량
- `scripts/tools/seo_collect.sh naver-datalab` — 네이버 30일 트렌드
- `scripts/tools/seo_collect.sh bing` — Bing 검색 성과 + 백링크
- `scripts/tools/seo_collect.sh pagespeed` — Core Web Vitals
- `scripts/tools/seo_collect.sh ga4-device` — GA4 디바이스별 성과
- `scripts/tools/seo_collect.sh gsc-inspection` — GSC URL 색인 상태

SM 키 주입 실패 시: 해당 채널 SKIP + 경고 출력.
전 채널 실패 시: 최신 브리핑 파일(`monkos-ops/ops/briefings/`)을 Read하여 대체.
