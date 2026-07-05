---
type: order
date: 2026-07-05
device: iMac
agent: 쌍아
recipient: 막내1
portfolio: PF_SPECS
status: 대기
---

# 지시서 — 스펙스 V2 전면 배포 전 데이터 검증 (1/2: 데이터 정합성)

**[2026-07-05 18:03 KST]** iMac/쌍아 → 막내1

## 배경
스펙스 V2(사진 업로드→검수→결제→생성) 전면 배포를 앞두고 있다. 현재 kr-passport 파일럿만 V2이고, 나머지 360개 호환 슬러그는 ko 언어에서 V2 게이트가 열려있으나 **데이터 품질 검증이 안 된 상태**다.

## 목표
`specs-data.json` 428개 슬러그 전수 검증. 전면 배포 시 깨지는 페이지가 없도록 보장.

## 실행 항목

### A. 필수 필드 존재 검증 (전수)
`specs-data.json`의 모든 슬러그에 대해 아래 필드 존재 여부를 검증하라:
- `name` (한국어 이름)
- `name_en` (영어 이름)
- `name_ja` (일본어 이름) — 없으면 리포트 (필수는 아님)
- `size` (규격, "W × H" 형식 파싱 가능해야 함)
- `background` (배경색)
- `type` (passport/visa/id/resume 등)
- `country` (국가 코드)

**산출물**: 필드 누락/비정상 슬러그 목록 (`REPORT_20260705_막내1_SPECS_데이터검증.md`)

### B. V2 엔진 호환성 분류 (전수)
`isEngineCompatibleSpec()` 로직 기준으로 428개를 분류:
1. **V2 호환** (세로비율 h/w >= 1.15 + 흰배경): 예상 360개
2. **비율 부적합** (가로형/정방): 예상 50개
3. **배경 부적합** (흰/white 아닌 배경): 예상 17개 — **이 중 실제로는 흰 배경인데 표기만 다른 건 없는지 확인** (예: "White", "하얀색", "白" 등)
4. **사이즈 누락**: 예상 1개 (cn-resume)

**특히 주의**: uk-passport, fr-passport 같은 주요국이 배경 비호환으로 빠져있다. 실제 규격이 흰 배경인지 확인하고, 맞으면 `background` 필드를 수정하라.

### C. URL 슬러그 유효성 (전수)
- 슬러그에 특수문자, 공백, 대문자가 포함된 건 없는지
- 중복 슬러그 없는지
- 슬러그와 country+type 조합이 일관된지 (예: `kr-passport` = country:KR + type:passport)

## ⚠️ 준수 조항
- 코드 수정: `specs-data.json` 데이터 필드 보정만 허용. render-specs.js, server.js 등 로직 코드 수정 금지.
- 배포 금지: 이 지시서는 검증+데이터 보정만. 배포는 별도 지시.
- 기존 데이터 삭제 금지: 필드 추가/수정만 허용.

## 완료 조건
1. 보고서 파일 생성: `monkos-ops/ops/reports/2026-07/REPORT_20260705_막내1_SPECS_데이터검증.md`
2. 보정한 필드가 있으면 `specs-data.json` 커밋 포함
3. 완료 보고 (헌법 3조 2항 형식)
