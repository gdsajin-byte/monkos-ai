---
type: completion
date: 2026-06-17
device: iMac
agent: 막내2
portfolio: PF_SECURITY
status: 완료
---

# 완료 보고 — 보안 노출 표면 4건 선행 보강

> **[2026-06-17 12:05 KST]** iMac/막내2 → 작가님

## 지시서

`ORDER_20260617_iMac쌍아_막내_SECURITY_노출표면보강.md`

## 결과

| # | 태스크 | 결과 |
|---|--------|------|
| Task 1 | `/health` 모델명·인증 방식 노출 제거 (3개 서비스) | ✅ status+service+timestamp만 반환. 실측 확인 완료 |
| Task 2 | `err.message` 직통 반환 제거 | ✅ 15곳 교체 (kr 7, jp 7, portal 1) — 지시서 13곳 + 추가 발견 2곳(runPreCheck 폴백) |
| Task 3 | `/api/info` styles 키 제거 | ✅ kr, jp 양쪽 제거. 프론트엔드 사용처 없음 확인 |
| Task 4 | admin API 프롬프트 반환 확인 | ✅ `ai.js:110` prompt 필드 제거 + err.message 3곳 보강 |

## 배포

| 서비스 | 리비전 | 상태 |
|--------|--------|------|
| monkos-idphoto-kr | monkos-idphoto-kr-00197-pth | ✅ 100% |
| monkos-idphoto-jp | monkos-idphoto-jp-00122-9gl | ✅ 100% |
| monkos-portal | monkos-portal-00296-ksf | ✅ 100% |

## 추가 발견 (지시서 범위 밖)

- `runPreCheck` 함수 내 `err.message` 응답 포함 2곳 (kr, jp) — 함께 수정 완료
- `portal/lib/cms/ai.js` err.message 직통 반환 3곳 (admin 전용, 위험도 낮음) — 함께 수정 완료
- `/api/info` 엔드포인트 자체는 잔존 (service, domain, features만 반환). 프론트엔드 미사용이므로 향후 제거 또는 인증 배치 검토 가능

## 커밋

`ba32dcea` — `[fix] 보안 노출 표면 4건 보강 — PF_SECURITY 선행 조치`
