---
type: report
id: COMPLETION_20260225_막내2_챗봇RAG_갱신
date: 2026-02-25 19:24 KST
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260225_막내2_챗봇RAG_갱신
result: success
status: completed
---

# 챗봇 RAG 지식베이스 갱신 완료

**[2026-02-25 19:24 KST] iMac/막내2 → iMac/쌍아**

---

## 수정 파일

| # | 파일 | 변경 |
|---|------|------|
| 1 | `monkos_AI/portal/seed_cs_knowledge.js` | credit_system + credit_purchase 갱신 |

---

## 작업 1: credit_system 문서 갱신 — ✅ 완료

| 항목 | Before | After |
|------|--------|-------|
| 가입 보너스 | 80크레딧 즉시 지급 | 카카오 로그인 시 30크레딧 (1회) |
| SNS 보너스 | 100크레딧 (1회) | SNS 공유 또는 전후사진 동의 40크레딧 (택1, 1회) |
| 텔레그램 보너스 | 30크레딧 | 삭제 (이벤트로 통합) |
| 첫 1장 무료 | 미기재 | 30c + 40c = 70c → 무료 다운로드 |
| 비회원 결제 | 미기재 | ₩10,150 직접 결제 |
| keywords | 텔레그램/telegram | 이벤트/가입/동의 |

## 작업 2: credit_purchase 문서 갱신 — ✅ 완료

| 항목 | Before | After |
|------|--------|-------|
| 1장 구매 | 미기재 | ₩11,600 (80크레딧, 추천) |
| 비회원 직접 결제 | 미기재 | ₩10,150 즉시 다운로드 |
| 300크레딧 | "추천" 표시 | 추천 태그 제거 (1장 구매에 이동) |
| 가입 보너스 | 80크레딧 자동 | 30c + 이벤트 40c = 첫 1장 무료 |
| keywords | - | 단건/직접결제/비회원 추가 |

## 작업 3: Firestore 시드 실행 — ✅ 완료

```
cs_knowledge 시드 시작...
  ✓ credit_system: 크레딧 시스템 안내
  ✓ credit_purchase: 크레딧 구매 방법
  ✓ refund_policy: 환불 정책
  ✓ photo_quality: 사진 품질 개선 가이드
  ✓ login_issue: 로그인 문제 해결
  ✓ service_urls: 서비스 URL 안내
  ✓ account_deletion: 계정 삭제 요청
  ✓ supported_photo_types: 지원하는 증명사진 종류
완료: 8건 시드됨
```

> 서버 cs_knowledge 캐시 TTL 10분 → 최대 19:34 KST까지 반영 완료 예상
