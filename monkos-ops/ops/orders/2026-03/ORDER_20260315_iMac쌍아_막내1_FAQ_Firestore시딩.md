---
type: ORDER
id: ORDER_20260315_iMac쌍아_막내1_FAQ_Firestore시딩
date: 2026-03-15
from: iMac/쌍아
to: 막내1
priority: P0
status: 대기
---

# FAQ 확정본 Firestore 시딩 — 3개 언어

## 배경

MONKOS AI 공식 FAQ가 작가님 최종 승인을 거쳐 확정되었습니다. 포털 v4의 FAQ 페이지는 Firestore CMS 기반(`faq_items` 컬렉션)으로 구현되어 있으며, 확정된 13건을 시딩합니다.

## 원본 파일

- 한국어: `/Users/jeong-kyushin/Desktop/works/portal_v4/FAQ_20260315_MONKOS_AI.md`

## 작업 내용

### 1. 기존 FAQ 데이터 확인
- Firestore `faq_items` 컬렉션에 기존 데이터가 있는지 확인
- 기존 데이터가 있으면 전부 삭제 후 신규 시딩 (확정본 기준 클린 시딩)

### 2. 한국어 FAQ 시딩 (Q1~Q13)
- 원본 파일을 읽고 Q1~Q13 각각을 Firestore에 등록
- 필드 매핑:

```json
{
  "question": "Q 질문 텍스트",
  "answer": "답변 텍스트 (마크다운 지원)",
  "category": "섹션명 (서비스 소개 / 품질과 기술 / 가격과 결제 / 촬영과 사용법 / 규격과 안전 / 고객지원)",
  "lang": "ko",
  "order": 1~13,
  "published": true,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### 3. 카테고리 매핑

| Q 번호 | 카테고리 |
|--------|----------|
| Q1~Q3 | 서비스 소개 |
| Q4~Q6 | 품질과 기술 |
| Q7~Q8 | 가격과 결제 |
| Q9~Q10 | 촬영과 사용법 |
| Q11~Q12 | 규격과 안전 |
| Q13 | 고객지원 |

### 4. FAQ 렌더링 확인
- `/faq` 페이지에서 시딩된 데이터가 올바르게 렌더링되는지 확인
- 카테고리별 섹션 구분이 동작하는지 확인
- 마크다운 (볼드, 리스트, 링크 등)이 정상 렌더링되는지 확인

### 5. 어드민 FAQ 관리 확인
- `/admin/faq.html`에서 시딩된 항목들이 보이는지 확인
- 수정·삭제 동작 테스트

## 출력

완료 보고서:

```
파일: monkos-ops/ops/reports/2026-03/REPORT_20260315_FAQ_Firestore시딩.md
```

```yaml
---
type: REPORT
id: REPORT_20260315_FAQ_Firestore시딩
date: 2026-03-15
from: iMac/막내1
to: 작가님
ref: ORDER_20260315_iMac쌍아_막내1_FAQ_Firestore시딩
---
```

**보고서 구성:**
1. 시딩 완료 요약 (건수)
2. 각 항목 ID + question 목록
3. 렌더링 확인 결과
4. 특이사항

## ⚠️ 준수 조항
- 헌법 5조 1항 — FAQ 원본 문구 그대로 시딩. 임의 수정 금지
- 헌법 4조 1항 — Firestore 접근 시 기존 데이터 백업 확인 후 진행
- 시딩 완료 후 배포 불필요 (서버 재시작 없이 Firestore 반영)
