---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내
subject: "specs-data.json 다국어 번역 데이터 보강 — validity·fileSpec·headHeight EN/JA 소급"
status: 발행
portfolio: PF_SPECS
priority: 즉시
---

# 지시서 — specs-data.json 다국어 번역 데이터 보강

> **[2026-06-15 13:26 KST] iMac/쌍아 → iMac/막내**
> 작가님 지시: 즉시 처리. 라이브 품질 문제 — EN/JA 사용자에게 한국어 텍스트 노출 중.

---

## 배경

어제(6/14) 막내2가 P0(코드 결함) 수정 + 배포 완료했으나, **데이터 자체의 번역 커버리지가 부족**하여 한국어 fallback이 그대로 노출되는 문제가 남아있다.

## 현황 (실측)

| 필드 | EN 커버리지 | JA 커버리지 | 미번역 시 영향 |
|------|-----------|-----------|--------------|
| validity | 19/445 (4%) | 19/445 (4%) | "6개월 이내" 등 한국어 노출 |
| fileSpec | 21/445 (5%) | 21/445 (5%) | "JPEG, 500KB 이하" 등 한국어 노출 |
| headHeight | 262/445 (59%) | 262/445 (59%) | "3.2~3.6cm (정수리~턱)" 등 한국어 노출 |
| background | 440/445 (99%) | 440/445 (99%) | ✅ 거의 완비 |

## 임무

### 1. 번역 데이터 생성

`monkos_AI/portal/lib/cms/specs-data.json`에서:

1. **validity** — 기존 한국어 `validity` 값을 EN/JA로 번역하여 `validityEn`, `validityJa` 필드 추가 (426건)
2. **fileSpec** — 동일하게 `fileSpecEn`, `fileSpecJa` 추가 (424건)
3. **headHeight** — 동일하게 `headHeightEn`, `headHeightJa` 추가 (183건)

### 2. 번역 규칙

- 규격 데이터이므로 의역 없이 **직역**. 숫자·단위는 그대로 유지
- 예시:
  - "6개월 이내" → EN: "Within 6 months" / JA: "6ヶ月以内"
  - "JPEG, 500KB 이하" → EN: "JPEG, 500KB or less" / JA: "JPEG、500KB以下"
  - "3.2~3.6cm (정수리~턱)" → EN: "3.2~3.6cm (top of head to chin)" / JA: "3.2~3.6cm（頭頂部〜あご先）"
- 이미 EN/JA 값이 있는 건 건드리지 않음 (덮어쓰기 금지)

### 3. 스크립트 활용 권장

445건 수동 편집은 비효율. 패턴 기반 일괄 변환 스크립트를 작성하되:
- 한국어 원문에서 고빈도 패턴 추출 → 매핑 테이블 → 일괄 적용
- 매핑에 안 잡히는 예외는 별도 리스트로 보고

### 4. 검증

- 변환 후 커버리지 재측정 (목표: 95%+)
- prod 실측: EN/JA 페이지에서 한국어 텍스트 0건 확인

### 5. 배포

- deploy.sh 경유 monkos.ai 배포 (IndexNow + robots.txt 변경분도 함께)

---

## 산출물

1. `specs-data.json` 번역 필드 보강
2. 변환 스크립트 (재사용 가능하도록)
3. COMPLETION 보고서
4. PF_SPECS 히스토리 1행 어펜드
5. 커밋 → 배포

---

## ⚠️ 준수 조항

- 기존 EN/JA 데이터 덮어쓰기 금지
- 헌법 4조 2항: 파괴적 명령 금지
- ch5 2조: 배포는 deploy.sh 경유
