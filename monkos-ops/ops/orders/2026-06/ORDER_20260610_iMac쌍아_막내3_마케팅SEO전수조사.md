---
type: order
date: 2026-06-10
from: iMac/쌍아
to: iMac/막내3
portfolio: PF_SPREAD
status: 완료
---

# 지시서 — 마케팅·SEO·브랜딩 전수 조사

**[2026-06-10 15:01 KST] iMac/쌍아 → iMac/막내3**

---

## 배경

Cloud/막내(Fable 5) 리포 분석에서 마케팅 전략↔실행 괴리, 기술 SEO 구조 문제, 브랜딩 위반 1건 등을 보고했다(PR #45). 본 지시서는 해당 보고를 출발점으로 마케팅·SEO·브랜딩 영역을 직접 검증하고, 누락된 항목까지 전수 조사하는 것이 목적이다.

---

## 임무

### Task 1: 브랜딩 준수 전수 검증

- **사용자 대면 코드** (HTML, JS 출력, 메타태그, JSON-LD, 이메일 템플릿) 전체에서 내부 호칭(쌍아, 막내, 소소, 용아, 민아 등) 유출 여부 grep
- 기술 엔진명(Gemini, Imagen, Vertex 등)이 사용자에게 노출되는 곳 grep — 외부 표기는 "MONKOS"여야 함 (헌법 4조 3항)
- Fable 5가 지목한 `MONK_kr/index.html:343` "Gemini Chat Panel" 주석 실재 확인
- `<title>`, `<meta description>`, OG 태그에서 브랜드명 일관성 확인

### Task 2: 기술 SEO 구조 점검

대상: `MONK_kr/` (본진), `monkos_AI/portal/` (모바일), 블로그 페이지

- **H1/H2/H3 구조**: 각 주요 페이지의 heading 계층 분석. H1 중복 여부
- **메타태그 언어 일치**: `<html lang>`, `<meta description>`, `<title>`이 해당 언어와 일치하는지
- **hreflang 양방향 검증**: ko↔ja↔en 상호 참조 완전성
- **JSON-LD 스키마**: 각 페이지 유형별 적용 현황 (Organization, Product, FAQPage 등)
- **robots.txt / sitemap.xml**: 현행 상태, 블로그 포스트 포함 여부
- **블로그 HTML**: Fable 5가 지적한 "H1 중복, H2/H3 부재, 영문 메타" 실재 여부

### Task 3: 콘텐츠·채널 현황 파악

- `monkos-ops/contents/blog/` 블로그 콘텐츠 현황 (건수, 언어별, 최근 작성일)
- `monkos-ops/marketing/` 마케팅 자산 현황 (전략 문서, 실행 산출물, outbox 상태)
- 일본 시장 콘텐츠 현황 (note.com, Blogger 연계 상태)

### Task 4: 보고서 작성

파일명: `REPORT_20260610_iMac막내3_마케팅SEO전수조사.md`
배치: `monkos-ops/ops/reports/2026-06/`

Fable 5 보고 대비 **검증 결과표**(확인/오탐/보충/신규 발견) + SEO 즉시 수정 가능 목록 포함.
코드 수정은 하지 않는다. 조사·보고 전용.

---

## ⚠️ 준수 조항

- **헌법 4조 3항**: 내부 호칭 유출 발견 시 정확한 파일:행번호 명시
- **헌법 4조 2항**: 코드 수정 금지. 조사·보고 전용
- 보고서 완료 후 커밋·푸시, PF_SPREAD 히스토리 어펜드
