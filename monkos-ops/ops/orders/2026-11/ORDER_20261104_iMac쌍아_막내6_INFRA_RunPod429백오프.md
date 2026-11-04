---
type: order
date: 2026-11-04
from: iMac/쌍아
to: iMac/쌍아-막내6
subject: 포털 매팅 체인 RunPod 429(요청 과다) 백오프 구현 — Retry-After 존중·예산 안 재시도·초과 시 명시 실패, 브리핑 원장 (146) 해소, dev까지
status: 대기
portfolio: PF_INFRA
---

# ORDER — RunPod 429 백오프

**[2026-11-04 19:07 KST]** iMac/쌍아 → iMac/쌍아-막내6

출처: 작가님 2026-11-04 iMac 쌍아 세션 사람 턴 — 19:06 "다음 안건" → 쌍아 안건표(RunPod 429, 기한 11-15) → 19:07 "둘다 처리해". 원장: `monkos-ops/ops/briefings/LEDGER.jsonl` id 146(🔴, due 2026-11-15, "RunPod 429 백오프 미구현 · REST v1 폐기 D-24"). REST v1 → v2 이전은 11-03 6fe24aa0로 해소(민아 헤드리스 11-03 note). **남은 것 = `portal/lib/matte.js` 429 처리 0행.**

## 1. 현황 (쌍아 19:07 실측)
- `monkos_AI/portal/lib/matte.js` 449행. 체인 = `MATTE_API_URLS` 우선순위(matte-imac → RunPod). RunPod은 `/runsync` + Bearer(`isRunpod`, 124·201~227행).
- 503(포화)만 특별 처리: `parseRetryAfterMs`(52행) + 노크 대기(279~332행, `MATTE_QUEUE_KNOCK_MS` 2000, `MATTE_QUEUE_WAIT_MS` 예산). 그 외 상태는 "고장" → 다음 엔드포인트.
- RunPod이 429(rate limit)를 주면 지금은 고장으로 취급돼 체인 끝이면 곧바로 실패.

## 2. 할 일
1. `callMatteApi` 실패 경로에서 **429를 503과 같은 "일시 포화" 계열로 분류**: `Retry-After`(초·HTTP-date 둘 다 — 현 파서는 초만, HTTP-date 지원 추가) 존중, 없으면 지수 백오프+지터(시작·상한은 기존 큐 예산 안에서). 총 대기는 **기존 `MATTE_QUEUE_WAIT_MS` 예산을 넘지 않는다**(포털 요청 타임아웃·사용자 대기 보호).
2. 예산 소진 시 **명시 실패**(로그 `[Matte] ... 429 예산 소진` WARNING + 호출부가 받는 오류에 원인 표기). 유료 경로에서 강등 출고 금지 원칙 유지(메모리 feedback_paid_failure_no_degraded_delivery) — 현재 실패 처리 동선 변경 없음.
3. 체인 중간(뒤에 다른 엔드포인트가 있는) 429는 대기하지 말고 **다음 엔드포인트로 즉시** 넘기는 게 나은지 판단 — 현 503 정책과 일관되게 정하고 근거 1줄.
4. 테스트: fetch 목으로 429+Retry-After(초)·429+HTTP-date·429 헤더 없음·예산 소진·체인 중간 429 → 각 경로 단위 테스트. 기존 포털 테스트 전부 통과.
5. dev 배포(`deploy.sh dev`) 후 실호출 1회 정상(매팅 성공) 확인 — 429를 실제로 유발하지 말 것(RunPod 과금·계정 제한 위험). 로그 형식만 확인.
6. 원장 해소: `scripts/brief_ledger.sh resolve 146 --evidence "<SHA 7자+> ..."`(사용법은 `--help`).

## 3. ⚠️ 준수 조항
- 헌법 4조 1항: RunPod 키·시크릿 접촉·생성 금지(테스트는 목).
- ch5: dev까지만. prod는 작가님 '배포 승인'.
- 헌법 4조 2항·3조 1·2항: 파괴적 명령 금지, `date` 실측, 세션 로그·완료 보고·PF_INFRA 히스토리 1행.
- GitHub SSH가 간헐 거부 중(19:02 쌍아 실측, 민아 감사 중) — 푸시 실패 시 `git -c credential.helper= -c credential.helper='!gh auth git-credential' push https://github.com/gdsajin-byte/monk_project.git <브랜치>` 1회성 사용(전역·레포 설정 변경 금지).

## 4. 완료 기준
- [ ] matte.js 429 분류·백오프·예산·명시 실패 + 단위 테스트, 전체 테스트 통과
- [ ] dev 배포 rev + 실호출 1회 정상
- [ ] 원장 146 resolve
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내6_INFRA_RunPod429백오프.md`(prod 배포 대상 명기), 브랜치 푸시·origin SHA 대조

## 5. 커밋 메시지
- `[fix] 매팅 체인 RunPod 429 백오프 — Retry-After·예산·명시 실패 (PF_INFRA)`
