---
type: order
date: 2026-06-24
from: iMac/쌍아
to: 막내3
portfolio: PF_CITADEL
status: 대기
---

# SEO 내부 경합 종합 감사 + 시타델 작동 검증

> **[2026-06-24 12:46 KST]** iMac/쌍아 → 막내3
> 배경: 6/18 헤드텀 자기잠식 해소(canonical 루트 통일) 후 6일 경과. "ai 증명사진" 6위까지 갔던 `/app`이 밀려나고 `/guide`가 올라온 상황. 포털 메인(`/`) 노출 부진. 시타델 전략 작동 여부 의문.
> 참조: `PF_CITADEL/README.md`, `COMPLETION_20260618_iMac막내1_CITADEL_헤드텀자기잠식해소.md`, PR #85 민아 교차검증

---

## 작업 1: GSC 실측 — "ai 증명사진" 키워드 클러스터 내부 경합 현황

GSC MCP 또는 `scripts/` 유틸을 활용하여 다음을 수집한다.

### 1-a. 키워드별 경합 페이지 맵

**핵심 키워드** (최소 이것들):
- `ai 증명사진` / `ai증명사진` / `AI 증명사진`
- `ai 취업사진`
- `증명사진 보정`
- `증명사진 앱`
- `남자 증명사진`

각 키워드에 대해:
- **어떤 URL이 노출/클릭을 받고 있는지** (최근 7일 + 최근 28일)
- 동일 키워드에 2개↑ URL이 노출되면 **경합(cannibalization)** 표시
- 순위 변동 추이 (가능하면)

### 1-b. 주요 페이지별 핵심 키워드 맵

| 페이지 | 역할 (의도) | 실제 유입 키워드 Top 5 | 클릭 | 노출 |
|--------|------------|----------------------|------|------|

대상 페이지:
- `monkos.ai/` (포털 메인)
- `idphoto-kr.monkos.ai/` (idphoto 루트)
- `idphoto-kr.monkos.ai/app` (idphoto 앱 — canonical 루트로 이관 후 상태)
- `monkos.ai/guide/ai-photo` (가이드)
- `monkos.ai/blog/selfie-to-id-photo-ai-guide` (vol38)
- `monkos.ai/blog/ai` (ai-kr)
- `monkos.ai/blog/men-s-id-photo-know-this-and-you-wont-fail`
- `monkos.ai/specs/*` 상위 5개

### 1-c. 포털 메인(`/`) 노출 부진 원인 분석

- 포털 메인이 노출되는 키워드가 있는지
- 없다면: title/H1/meta description/JSON-LD에서 타겟 키워드가 빠져있는지
- canonical/hreflang 설정 이상 여부
- 크롤링/인덱싱 상태 (GSC index inspect 가능하면)

---

## 작업 2: 시타델 전략 작동 검증

`PF_CITADEL`의 시타델 구조: **메인(킵) ← 블로그·가이드(성벽) ← specs(외곽)**

### 2-a. 내부 링크 연결 검증

- 블로그 글 → 메인/idphoto-kr 으로의 CTA 내부링크가 실제로 삽입되어 있는지
- specs → 메인/idphoto-kr 으로의 링크 존재 여부
- 가이드 → 메인 링크 여부
- **링크 역류**(메인→블로그는 OK, 하지만 블로그 간 상호링크가 메인으로의 신호를 분산시키는지)

### 2-b. 새 블로그 글의 SEO 구조 점검

최근 발행된 블로그 5편을 대상으로:
- canonical URL 정상 여부
- title/H1 중복 여부 (다른 블로그와 겹치는 H1이 있는지)
- 타겟 키워드가 메인 페이지 키워드와 충돌하는지
- JSON-LD 구조 정상 여부 (BlogPosting 적용 여부는 배포 전이므로 Article이어도 OK)

### 2-c. 헤드텀 거버넌스 작동 판정

6/18 canonical 통일 이후:
- `/app` → `/` 신호 이전이 실제로 일어났는지 (GSC 노출 추이)
- `/guide/ai-photo`가 "ai 증명사진" 키워드에서 `/`를 밀어내고 있는지
- 밀어내고 있다면: 의도적인가(가이드가 더 적합) vs 경합(같은 키워드에 두 페이지)

---

## 작업 3: GA4 실측 — 유입·전환 경로

GA4 MCP를 활용하여:

- 최근 7일 랜딩 페이지별 세션 + 신규 사용자
- Organic Search 채널의 랜딩 페이지 분포
- 블로그에서 메인/idphoto-kr로의 이동(내부 전환) 발생 여부
- 전환(begin_checkout, purchase) 발생 페이지

---

## 산출물

**보고서 1건**: `REPORT_20260624_iMac막내3_SEO내부경합종합감사.md`
배치: `monkos-ops/ops/reports/2026-06/`

보고서 구조:
1. 경합 현황 (키워드×페이지 매트릭스)
2. 포털 메인 부진 원인
3. 시타델 작동 판정 (작동/부분작동/미작동 + 근거)
4. 개선 제안 (우선순위별)

---

## ⚠️ 준수 조항

- GSC/GA4 데이터는 MCP 또는 `scripts/` 경유 조회. 직접 API 호출 금지.
- 코드 수정 없음 (read-only 감사). 수정이 필요하면 보고서에 제안으로 기재.
- PF_CITADEL 히스토리 1행 어펜드.
- 완료 보고 (헌법 3조 2항).
