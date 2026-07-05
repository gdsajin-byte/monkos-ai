---
type: order
date: 2026-07-05
device: iMac
agent: 쌍아
recipient: 막내2
portfolio: PF_SPECS
status: 대기
---

# 지시서 — 스펙스 V2 전면 배포 전 페이지 렌더 검증 (2/2: 렌더링 정합성)

**[2026-07-05 18:03 KST]** iMac/쌍아 → 막내2

## 배경
스펙스 V2 전면 배포 전, 각 국가별 페이지가 정상 렌더되는지 검증한다. 데이터 정합성은 막내1이 병렬 수행 중.

## 목표
V2 호환 슬러그(약 360개)의 페이지 렌더가 깨지지 않는지 확인. dev 환경에서 검증.

## 실행 항목

### A. V2 페이지 렌더 검증 (샘플 + 엣지케이스)

dev 서버를 실행하고, 아래 기준으로 페이지 렌더를 확인하라:

**필수 샘플 (주요국 10개)**:
- `kr-passport`, `kr-visa`, `jp-passport`, `us-passport`, `us-visa`
- `cn-passport`, `de-passport`, `fr-passport`, `in-passport`, `au-passport`

**언어별 분기 (3개 × 3언어 = 9건)**:
- `/specs/kr-passport` (ko), `/en/specs/kr-passport` (en), `/ja/specs/kr-passport` (ja)
- `/specs/us-passport` (ko), `/en/specs/us-passport` (en), `/ja/specs/us-passport` (ja)
- `/specs/jp-passport` (ko), `/en/specs/jp-passport` (en), `/ja/specs/jp-passport` (ja)

**확인 항목 (각 페이지)**:
1. HTTP 200 응답 (404/500 아님)
2. 규격 정보 정상 출력 (사이즈, 배경, 이름)
3. V2 phase UI 표시 (업로드 영역, 스타일 선택 — V2 호환 슬러그만)
4. V1 슬러그(비호환)는 V1 레이아웃 정상 표시
5. 다국어 이름이 해당 언어로 표시 (ko=한국어, en=영어, ja=일본어)

### B. 비호환 슬러그 V1 폴백 검증

V2 비호환 슬러그(약 68개) 중 아래 샘플이 V1으로 정상 렌더되는지 확인:
- `eu-resume` (사이즈 누락 가능성)
- `uk-passport` (배경 비호환)
- `cn-resume` (사이즈 파싱 불가)
- 가로형 슬러그 아무거나 2개

### C. sitemap 정합성

`/sitemap-specs.xml`을 가져와서:
1. 총 URL 수 확인
2. 존재하지 않는 슬러그가 sitemap에 포함되어 있지 않은지 (404 유발)
3. V2 호환 슬러그가 빠져있지 않은지

### D. OG/메타태그 검증 (샘플 5건)

`kr-passport`, `us-passport`, `jp-passport`, `de-passport`, `in-passport`에 대해:
- `og:title`, `og:description`, `og:image` 존재 여부
- canonical URL 정상 여부
- hreflang 태그 존재 여부 (ko/en/ja)

## ⚠️ 준수 조항
- 코드 수정 금지: 이 지시서는 검증만. 문제 발견 시 보고서에 기록.
- 배포 금지: dev 환경 검증만.
- render-specs.js, server.js 등 로직 코드 수정 절대 금지.

## 완료 조건
1. 보고서 파일 생성: `monkos-ops/ops/reports/2026-07/REPORT_20260705_막내2_SPECS_렌더검증.md`
2. 깨지는 페이지 목록 (있으면)
3. 완료 보고 (헌법 3조 2항 형식)
