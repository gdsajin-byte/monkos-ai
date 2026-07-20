---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_CITADEL
---

# 지시서: specs EN 타이틀 재생성 + 연호(2026) 전면 적용

> **[2026-07-20 18:52 KST]** iMac/쌍아 → 막내
> 작가님 지시: 2026-07-20 18:51 KST

## 배경

GSC 실측: EN specs 페이지 노출은 있으나 클릭 0 다수. 원인:
1. EN 타이틀 98%가 60자 초과 — 구글 SERP에서 잘림
2. "2026" 연호 붙은 쿼리에서 순위 급상승 실증 (denmark 2026 9.5위, belgium 2026 9.6위) — 연호 커버 부분적

## Task 1 — EN 타이틀 60자 이하 재생성

**도구**: `monkos_AI/portal/tools/seo-headterm-regen.mjs` (기존재)

EN specs 전 슬러그의 `<title>` + `og:title`을 60자 이하로 재생성.

규칙:
- 국가명 + 문서유형 + "Photo Size" + 핵심 규격(예: "3.5×4.5cm") + "2026"
- 예: `US Visa Photo Size — 2×2 inch (51×51mm) 2026`
- 60자 초과 시 규격 표기를 축약 (mm만 또는 inch만)
- 브랜드명(MONKOS)은 포함하되 자동 append 구조면 수동 삽입 불요

## Task 2 — KO/JA 타이틀 연호 점검

KO/JA 타이틀에 "2026" 연호가 빠진 슬러그 목록 추출.
- 빠진 건 수만 보고 (일괄 적용은 별건)

## Task 3 — H1 연호 동기화

`<h1>`에도 타이틀과 동일한 연호 포함 여부 점검.
- 타이틀에 2026이 있는데 h1에 없으면 동기화

## Task 4 — 배포

`./deploy.sh`

## ⚠️ 준수 조항

- URL 무변경 (타이틀·메타만)
- specs-data.json 무접촉 (타이틀은 render-specs.js 산출)
- 기존 KO 타이틀(GSC 상위 노출 중)은 무변경 — EN만 대상

## 완료 기준

- [ ] EN 타이틀 429슬러그 60자 이하 재생성
- [ ] KO/JA 연호 미포함 슬러그 수 보고
- [ ] H1 연호 동기화
- [ ] 배포 완료
- [ ] COMPLETION 보고서 + 세션 로그 + PF_CITADEL 어펜드 + 커밋 + 푸시
