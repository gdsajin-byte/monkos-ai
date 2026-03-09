---
type: order
date: 2026-03-09
from: M1/쌍아
to: 막내2
priority: P1
category: research
---

# 지시서: JP/KR E2E 흐름 분석 및 후처리 이벤트 점검

**[2026-03-09 20:38 KST] M1/쌍아 → 막내2**

## 배경

JP 론칭 완료. KR/JP 분기 구조 확립.
사용자 여정 전체(E2E)와 후처리 이벤트(결제 완료 후 크레딧 적립, 리다이렉트 등)의
현재 상태를 정밀 분석해야 함.

## 임무 A: KR E2E 흐름 전체

### 대상 파일
- `monkos_AI/idphoto-kr/public/shared.js`
- `monkos_AI/idphoto-kr/public/modules/charge.js`
- `monkos_AI/idphoto-kr/server.js`
- `monkos_AI/portal/lib/payments.js`

### 확인 항목
- [ ] 결제 진입 → 결제 완료 → 크레딧 적립까지 전체 흐름
- [ ] Toss redirect 후 `initFromTossResult()` 처리 경로
- [ ] Portal `/api/payments/toss/confirm` 엔드포인트 확인
- [ ] 결제 실패/취소 시 처리 방식
- [ ] 크레딧 적립 후 UI 갱신 방식 (polling vs webhook)
- [ ] thankyou 페이지 존재 여부 및 역할

## 임무 B: JP E2E 흐름 전체

### 대상 파일
- `monkos_AI/idphoto-jp/public/shared.js`
- `monkos_AI/idphoto-jp/public/modules/charge.js`
- `monkos_AI/idphoto-jp/server.js`
- `monkos_AI/idphoto-jp/public/thankyou.js`

### 확인 항목
- [ ] Lemon Squeezy 결제 진입 → 새 탭 → Webhook → 크레딧 적립 흐름
- [ ] `initLemonSqueezy()` 폴링 로직 (2초/4초) 동작 방식
- [ ] 팝업 차단 우회 로직 (빈 탭 선점) 현황
- [ ] 결제 완료 후 thankyou 페이지 흐름

## 임무 C: 후처리 이벤트 점검

- [ ] 결제 성공 후 발생하는 모든 이벤트 목록 (KR/JP 각각)
- [ ] 크레딧 갱신 이벤트 흐름 (언제, 어디서 fetch)
- [ ] 에러 발생 시 사용자에게 보여주는 UI 확인
- [ ] 중복 결제 방지 로직 있는지
- [ ] `useCredits`, `refundCredits` 호출 시점 및 조건

## 임무 D: KR/JP 공통 vs 분기 매핑표 작성

| 항목 | KR | JP | 비고 |
|-----|----|----|------|
| 결제사 | Toss | Lemon Squeezy | |
| 팝업 방식 | | | |
| 크레딧 적립 시점 | | | |
| 실패 처리 | | | |
| thankyou 페이지 | | | |

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: API 키, 프로젝트 ID 생성/추측 금지
- **헌법 제8조 (파괴적 명령 금지)**: 코드 수정 없음

## 산출물

- **파일**: `monkos-ops/ops/reports/2026-03/REPORT_20260309_막내2_E2E분석.md`
- **형식**: 마크다운 보고서 (코드 수정 없음)
- 개선 필요 항목 별도 섹션으로 정리 (버그 가능성, 미완성 로직 등)
- 완료 후 커밋하지 말고 보고서만 제출

## 보고 형식

```
✅ E2E 분석 완료
💡 개선 필요 항목: N건
📁 보고서: monkos-ops/ops/reports/2026-03/REPORT_20260309_막내2_E2E분석.md
```
