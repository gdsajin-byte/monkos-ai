---
type: ORDER
id: ORDER_20260315_iMac쌍아_막내2_FAQ_EN_JP번역검수
date: 2026-03-15
from: iMac/쌍아
to: 막내2
priority: P1
status: 대기
---

# FAQ 영어·일본어 번역본 작성 및 검수

## 배경

MONKOS AI 공식 FAQ 한국어 확정본을 기반으로 영어(EN)·일본어(JA) 번역본을 작성합니다.

## 원본 파일

`/Users/jeong-kyushin/Desktop/works/portal_v4/FAQ_20260315_MONKOS_AI.md`

## 작업 내용

### 1. 영어 번역본 작성
- 파일: `/Users/jeong-kyushin/Desktop/works/portal_v4/FAQ_20260315_MONKOS_AI_EN.md`
- 자연스러운 비즈니스 영어 (직역 금지)
- "반명함" → "Standard ID photo (3cm × 4cm)" 로 현지화
- 법적 표현 주의: "guarantee", "warranty" 사용 금지
- 통화: 달러 기준 유지 (10c = $1)
- 결제 수단: 글로벌 → Lemon Squeezy만 언급

### 2. 일본어 번역본 작성
- 파일: `/Users/jeong-kyushin/Desktop/works/portal_v4/FAQ_20260315_MONKOS_AI_JA.md`
- 자연스러운 경어체 (です·ます조)
- "반명함" → "証明写真（3cm × 4cm）" 로 현지화
- "보장" 관련 표현 금지 (景品表示法 리스크)
- 결제 수단: 일본 → Lemon Squeezy 언급
- 개인정보 관련: APPI(個人情報保護法) 맥락 반영

### 3. 번역 시 공통 유의사항
- **헌법 5조 1항**: 미출시·미확정 표현 번역 시에도 금지
- **헌법 3조 2항**: 내부 기밀 번역 시에도 보호
- 브랜드명 MONKOS AI, MONKOS CROP 통일 (번역하지 않음)
- URL(monkos.ai, crop.monkos.ai, info@monkos.ai) 그대로 유지
- Q 번호·섹션 구조 한국어와 동일하게 유지

### 4. 자체 교차 검수
- 번역 완료 후 EN↔JA 교차 비교하여 누락·불일치 체크
- 한국어 원문 대비 의미 왜곡 없는지 확인
- 각국 법적 표현 리스크 최종 점검

## 출력

번역본 2개 파일 + 검수 보고서 1개:

```
파일1: /Users/jeong-kyushin/Desktop/works/portal_v4/FAQ_20260315_MONKOS_AI_EN.md
파일2: /Users/jeong-kyushin/Desktop/works/portal_v4/FAQ_20260315_MONKOS_AI_JA.md
파일3: monkos-ops/ops/reports/2026-03/REPORT_20260315_FAQ_번역검수.md
```

보고서 형식:
```yaml
---
type: REPORT
id: REPORT_20260315_FAQ_번역검수
date: 2026-03-15
from: iMac/막내2
to: 작가님
ref: ORDER_20260315_iMac쌍아_막내2_FAQ_EN_JP번역검수
---
```

**보고서 구성:**
1. 번역 완료 요약
2. 현지화 처리 목록 (한국어 원문 → EN/JA 대조)
3. 법적 표현 점검 결과
4. 특이사항·판단이 필요한 항목

## ⚠️ 준수 조항
- 헌법 5조 1항 — 미확정 표현 금지
- 헌법 3조 2항 — 내부 기밀 보호
- 번역본은 지정 경로에 작성. 한국어 원본 수정 금지.
