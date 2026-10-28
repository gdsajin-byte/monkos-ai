---
type: order
date: 2026-10-28
from: iMac/쌍아
to: iMac/막내3
subject: 집행 — M-A(ACME 경로 워커 제외 라우트) + P-A(preview.monkos.ai 도메인 매핑 삭제)
status: 대기
portfolio: PF_INFRA
---

# ORDER — M-A + P-A 집행

**[2026-10-28 18:31 KST]** iMac/쌍아 → iMac/막내3

출처: 작가님 18:29 사람 턴 "1,2 모두 진행해" — 2 = 귀하 보고(REPORT_20261028_iMac막내3_preview도메인_인증서.md)의 **M-A·P-A**. 실서비스 설정 변경이며 작가님 승인 범위는 이 두 건에 한정된다.

## 1. 순서
1. **M-A 먼저**: CF 워커 라우트에 `monkos.ai/.well-known/acme-challenge/*` → 워커 없음(bypass) 1행. 워커 코드·자산 불변. 변경 전 현행 라우트 목록 기록(원복용).
2. 검증: ① ACME 경로 요청이 워커를 거치지 않고 오리진(run.app 매핑)에 닿는지 2회 히트 ② 일반 페이지(`/`, specs 1개) 2회 히트 200 대조군 ③ 이후 Google-Certificates-Bridge 요청의 응답 코드가 404에서 바뀌는지 포털 로그 관찰 ④ 도메인 매핑 인증서 상태 재조회. 보고서의 미검증 가정 2개를 각각 판정.
3. 실패 시: 추가한 1행 삭제로 원복 → 원복 후 대조군 2회 히트 → 보고.
4. **P-A**: `gcloud beta run domain-mappings delete --domain preview.monkos.ai --region us-central1` — 실행 전 대상 재조회(여전히 False·DNS 없음)를 기록.

## 2. ⚠️ 준수
- 헌법 3조 1항 `date` 실측 · 4조 1항 비밀값 생성·추측 금지(CF 토큰은 기존 경로만).
- 범위 밖 변경 금지(다른 라우트·DNS·매핑 손대지 않음). 판단 필요 지점은 멈추고 1줄 질의.
- 라이브 판정은 live-verify.md(2회 히트·대조군) 방법을 보고서에 기재.
- COMPLETION·세션 로그·PF_INFRA(`scripts/pf.sh`). references.md 서비스 매핑 표의 preview 행·엣지 라우트 설명 갱신안은 보고서에 제시만(규정 파일 수정은 쌍아).

## 3. 산출물
`COMPLETION_20261028_iMac막내3_ACME라우트_preview삭제.md` — 결론 1줄 + 변경 전후 + 검증표 + 원복 절차.
