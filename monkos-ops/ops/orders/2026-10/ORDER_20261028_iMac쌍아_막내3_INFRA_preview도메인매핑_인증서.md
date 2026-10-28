---
type: order
date: 2026-10-28
from: iMac/쌍아
to: iMac/막내3
subject: preview.monkos.ai 도메인 매핑 인증서 발급 정체 — ACME 404 131건 원인·정리안
status: 대기
portfolio: PF_INFRA
---

# ORDER — preview.monkos.ai 인증서 정체 정리

**[2026-10-28 18:22 KST]** iMac/쌍아 → iMac/막내3

출처: 작가님 18:21 사람 턴 "두건 모두 처리해".

## 1. 사실 (쌍아 실측 18:22)
- 포털 로그: `/.well-known/acme-challenge/…` 404 = 131건(오늘), UA Google-Certificates-Bridge, 호스트 run.app.
- `gcloud beta run domain-mappings list --region us-central1`: **preview.monkos.ai → monkos-portal = False, "Waiting for certificate provisioning … Resource readiness deadline exceeded"**. 나머지 5개(monkos.ai·idphoto-kr/jp·image·studio)는 True.
- 08-24부터 monkos.ai 존은 CF 프록시 → Google이 HTTP-01 검증을 못 하는 구조로 추정(미확정).

## 2. 할 일
1. preview.monkos.ai의 현재 실제 경로 확정: CF DNS 레코드(프록시 여부) · 엣지 워커 라우트가 preview를 받는지 · 실제로 누가 preview를 쓰는지(references.md는 portal-dev 표면으로 기재). 2회 히트 규칙(live-verify.md)으로 라이브 응답 확인.
2. monkos.ai 본 매핑(True)의 인증서 만료일·갱신 경로도 같은 구조 위험이 있는지 확인 — 엣지가 run.app으로 폴백하므로 실영향 유무를 판정.
3. 정리안 2~3개를 비용·위험과 함께 제시(예: 미사용 매핑 삭제 / DNS-only 전환 / 유지). **실행은 하지 않는다** — 도메인 매핑·DNS 변경은 작가님 승인 사안.

## 3. ⚠️ 준수
- 헌법 3조 1항 `date` · 4조 1항 비밀값 생성·추측 금지. 조회만, 변경 0.
- 완료: REPORT 파일 · 세션 로그 · PF_INFRA 히스토리(`scripts/pf.sh`). 작업 브랜치 푸시, 병합은 쌍아.

## 4. 산출물
`monkos-ops/ops/reports/2026-10/REPORT_20261028_iMac막내3_preview도메인_인증서.md` — 첫 화면 결론 1줄 + 정리안 표.
