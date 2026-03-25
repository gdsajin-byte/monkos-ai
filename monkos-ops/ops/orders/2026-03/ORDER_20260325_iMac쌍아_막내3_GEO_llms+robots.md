---
type: ORDER
date: 2026-03-25
from: iMac/쌍아
to: 막내3
subject: GEO 보강 — llms.txt + llms-full.txt 생성 + robots.txt AI 크롤러 확인
priority: 높음
related:
  - monkos-ops/ops/reports/2026-03/REPORT_20260325_iMac민아_SEO_GEO_전체현황_종합보고.md
  - monkos-ops/works/ops/orders/ORDER_20260317_코웍이→쌍아_GEO_AEO_종합프로젝트_기획서.md
---

# 지시서 — GEO 보강: llms.txt + robots.txt AI 크롤러

**[2026-03-25 19:09 KST] iMac/쌍아 → 막내3**

---

## 배경

코웍이 3/17 CITADEL 기획서 Phase 1 항목 중 llms.txt와 robots.txt AI 크롤러 허용이 8일째 미착수. AI 검색(ChatGPT, Perplexity, Claude 등)에서 MONKOS가 인용되려면 이 파일들이 진입점이다.

---

## 작업 1: llms.txt 생성

**위치**: `MONK_kr/llms.txt` (monkos.ai 루트에 배포)

**형식** (llms.txt 표준):
```
# MONKOS.AI
> AI-powered ID photo service for Korea and Japan

## About
MONKOS is an AI photo service that creates professional ID photos, passport photos, and business headshots using AI technology.

## Services
- AI ID Photo (Korea): https://idphoto-kr.monkos.ai
- AI ID Photo (Japan): https://idphoto-jp.monkos.ai
- Portal: https://monkos.ai

## Documentation
- Blog (KO): https://monkos.ai/blog
- Blog (JA): https://monkos.ai/ja/blog
- Blog (EN): https://monkos.ai/en/blog
- FAQ: https://monkos.ai/faq

## Contact
- Email: info@monkos.ai
- Website: https://monk.kr
```

위 내용을 기반으로 하되, 실제 서비스 URL과 기능을 확인하여 정확하게 작성.

---

## 작업 2: llms-full.txt 생성

**위치**: `MONK_kr/llms-full.txt`

llms.txt의 확장 버전. 서비스별 상세 설명, 가격 정보, 기술 스택, 차별점 등을 포함. 코웍이 CITADEL 기획서와 현재 서비스 페이지를 참조하여 작성.

포함할 내용:
- 각 서비스 상세 설명 (ID Photo KR/JP, 포털)
- 지원 사진 규격 목록
- AI 기술 설명 (정체성 보존, 정수리 추정 등)
- 가격 정보
- FAQ 주요 항목

---

## 작업 3: robots.txt AI 크롤러 허용 확인

**현행 robots.txt 확인**: `MONK_kr/robots.txt` 읽기

**확인 사항**:
- `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` 가 Disallow되어 있지 않은지
- Disallow되어 있으면 제거 (AI 크롤러 허용)
- 기능 페이지(/camera, /prep, /result 등)는 Disallow 유지 (SEO 가치 없음)

**필요 시 추가**:
```
# AI Crawlers - Allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

---

## 배포

- llms.txt, llms-full.txt는 정적 파일 → CF Pages 배포 시 자동 포함
- robots.txt 수정 시 기존 SEO 크롤링에 영향 없는지 확인
- **dev 배포 후 검증**: `curl -s https://monkos.ai/llms.txt`, `curl -s https://monkos.ai/robots.txt`
- dev 통과 후 **prod 배포 승인 요청**

## ⚠️ 준수 조항

- 헌법 제4조(구속·윤리) 1항: 비밀정보 보호 — 가격 정보는 공개 정보만 기재
- 헌법 제4조(구속·윤리) 3항: 내부 기밀 보호 — 내부 호칭, 기술 스택 상세는 llms.txt에 넣지 말 것. 외부 브랜드 MONKOS 통일
- 헌법 제3조(적립) 1항: 타임스탬프
- 헌법 제3조(적립) 2항: 완료 보고 필수
