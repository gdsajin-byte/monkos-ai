---
type: completion
date: 2026-07-15
device: M1
agent: 막내1
portfolio: PF_SPREAD
status: 완료
---

# COMPLETION: 글로벌 크레딧 팩 라이브 Variant ID 교체

**[2026-07-15 07:38 KST]** M1/막내1 → 작가님

---

## 결과

✅ `config.js` — Global USD variant ID 5종 테스트→라이브 교체 + 경고 주석 제거
✅ `credits.js` — 프론트엔드 하드코딩 variant ID 5종 교체
✅ `payments-direct.test.js` — 테스트 fixture variant ID 3곳 교체
✅ 테스트 22/22 통과
✅ PF_SPREAD 히스토리 1행 어펜드
❌ dev 서버 육안 확인 불가 (`.env` 미존재, 환경변수 부재)

## 변경 매핑

| 키 | 테스트 ID (before) | 라이브 ID (after) | 가격 | 크레딧 |
|---|---|---|---|---|
| topup_40 | `1825695` | `1909373` | $3.90 | 40c |
| single_80 | `1825706` | `1909383` | $6.90 | 80c |
| package_130 | `1825708` | `1909386` | $9.90 | 130c |
| package_420 | `1825711` | `1909388` | $26.90 | 420c |
| package_750 | `1825713` | `1909390` | $39.90 | 750c |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/shared/config.js` | VARIANT_CREDITS 5개 ID 교체 + 주석 정리 |
| `monkos_AI/portal/public/js/credits.js` | buyCreditsLS() 호출 ID 5개 교체 |
| `monkos_AI/portal/__tests__/payments-direct.test.js` | fixture variant ID 3곳 교체 |
| `monkos-ops/ops/portfolios/PF_SPREAD/README.md` | 히스토리 1행 추가 |

## 후속

- `./deploy.sh portal` — 작가님 배포 지시 대기
- 배포 후 글로벌 크레딧 페이지 + JP 경로 육안 확인 필요
