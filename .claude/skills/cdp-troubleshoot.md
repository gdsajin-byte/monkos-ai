---
name: CDP장애진단
description: CDP 브라우저 자동화 예외 발생 시 PF_CDP 케이스·골든패스·에디터 어댑터를 순차 점검하고, 일치 없을 시 신규 CASE 등록을 가이드한다. 호출 시점은 가설 수립 이전.
---

> 원천: .claude/rules/cdp-browser.md + PF_CDP/README.md 막힘 트리거 체크리스트 + 법률 ch7 6조
> 호출 시점: 브라우저 자동화에서 예상외 동작 포착 즉시. 가설 수립 전.

## CDP 장애 진단 절차

### 1단계 — 증상 키워드 추출

1. 이상 동작을 1-3개 키워드로 요약한다 (예: `paste`, `click`, `selection`, `typing`, `screenshot`, `file-input`).
2. 플랫폼명을 함께 추출한다 (예: `google-docs`, `naver`, `toastui`, `x`, `medium`, `note`, `tistory`, `line`).

### 2단계 — case_studies.md grep

1. `grep -iE "{증상키워드}|{플랫폼}" monkos-ops/ops/portfolios/PF_CDP/case_studies.md` 실행.
2. 일치 CASE-NNN 전체를 리드한다.
3. "재현성: 100%" + 조건이 현재 상황과 동일하면 기재된 해결책을 그대로 적용한다.
4. "재현성: 조건부/미확인"이면 조건 매트릭스 점검 후 적용.

### 3단계 — golden_paths.md 매칭

1. 대상 에디터 플랫폼의 검증된 성공 패턴(GP-NNN) 존재 여부를 확인한다.
2. 현재 방식이 해당 GP의 "실패 조건" 에 해당하는지 점검한다.
3. GP 순서대로 전환한다.

### 4단계 — editor_adapters/ 확인

1. `monkos-ops/ops/portfolios/PF_CDP/editor_adapters/{에디터}.md` 존재 시 리드한다.
2. "금지 패턴" 표에서 현재 방식이 해당되는지 확인한다.
3. "검증된 입력 방식 우선순위" 순으로 대안을 시도한다.

### 5단계 — 일치 케이스 없음 시 신규 CASE 등록

1. `case_studies.md` 최하단에 append. 번호는 기존 최대+1.
2. 필수 필드:
   - 번호(CASE-NNN), 일시(`date` 명령), 에이전트, 대상 에디터
   - 증상, 조건, 원인(가설), 해결(또는 미해결 단서)
   - 재현성 (100%/조건부/간헐/미확인)
   - 태그 (grep용 키워드 5~8개)
3. 미해결 시 "다음 조치" 목록을 3~5개 기재한다.

### 6단계 — 조사 개시

1. 1~4단계에서 일치 없음을 확인한 뒤에만 새 가설을 세운다.
2. 가설은 동시에 3개 이하로 병렬 나열하지 않는다.
3. 5회 반복 실패 시 법률 ch7 4조 에스컬레이션 준용.

## 보고 의무

- 진단 중 신규 CASE 등록 시 세션 로그에 `[CASE-NNN 등록]` 태그 기록.
- 골든패스 신규 검증 시 `golden_paths.md` 에 GP-NNN 추가 후 세션 로그에 `[GP-NNN 등록]` 기록.
