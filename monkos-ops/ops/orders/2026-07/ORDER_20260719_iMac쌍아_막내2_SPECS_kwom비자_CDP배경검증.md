---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내2
portfolio: PF_SPECS
status: 대기
priority: P1
prerequisite: ORDER_20260719_iMac쌍아_막내1_SPECS_kw_om배경색_공식검증.md (미확정 2건 후속)
---

# 지시서: kw-visa / om-visa 배경색 — CDP 브라우저 재시도

**[2026-07-19 14:02 KST]** iMac/쌍아 → 막내2

## 배경

②에서 kw-visa와 om-visa 배경색이 미확정으로 남았다. eVisa 포털이 JS SPA 구조라 WebFetch로 원문 확보 실패. CDP 브라우저 또는 클로드 컴퓨터유즈로 재시도.

- 막내2 보고: `REPORT_20260719_iMac막내2_kw_om배경색_공식검증.md`
- 민아 보충: om은 외무부 경유 — 발급기관(ROP) 직접 확인도 필요

## ⚠️ 준수 조항

- **공식 원문 미확보 시 데이터 교정 절대 금지** — 보고만
- 통설·제3자 블로그·AI 답변 기반 교정 금지
- eVisa 포털 로그인/개인정보 입력 금지 — 공개 페이지에서 확보 가능한 범위만

## 작업

### Task 1. kw-visa — evisa.moi.gov.kw CDP 접근

1. CDP 브라우저(`/cdp-browser`) 또는 컴퓨터유즈로 evisa.moi.gov.kw 접속
2. 사진 규격(Photo Requirements/Specifications) 페이지 탐색
3. 배경색 명시 원문 캡처 — "white", "light blue", "blue" 등
4. ICAO 준용 명시 여부 확인

### Task 2. om-visa — evisa.rop.gov.om + ROP 직접

1. CDP로 evisa.rop.gov.om 접속 — 사진 규격 페이지 탐색
2. 오만 ROP(Royal Oman Police) 공식 사이트도 별도 탐색
3. 막내2 이전 조사에서 "clear background"만 확인됨 — 색상 특정 원문 확보 시도
4. 오만 외무부(fm.gov.om)는 여권용으로 확정(흰색) — 비자는 별도인지 확인

### Task 3. 결과 보고 + 교정

보고서: 기존 `REPORT_20260719_iMac막내2_kw_om배경색_공식검증.md`에 어펜드

- 확보 성공: 원문 URL + 캡처 내용 기록 → countries.jsonl 교정 + source 필드 기입 + 배포
- 확보 실패: "CDP 재시도 실패, 수동 확인 필요" 기록. **교정 금지.**

## 완료 조건

1. 보고서 어펜드
2. 확정 시: 데이터 교정 + jest + deploy.sh
3. 미확정 시: 보고서만

## 커밋 (교정 시)

```
[fix] kw-visa/om-visa 배경색 공식 검증 반영 — CDP 원문 확보
```
