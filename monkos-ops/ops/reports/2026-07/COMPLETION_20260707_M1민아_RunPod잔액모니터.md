---
type: completion
date: 2026-07-07
device: M1
agent: 민아
status: 마감
---

**[2026-07-07 15:15 KST]** M1/민아 → 작가님

# COMPLETION — RunPod 잔액 모니터링 편입

## 배경

RunPod 서버리스(monkos-matte, BiRefNet 배경제거)는 선불 충전제. 잔액 소진 시 matte 서빙이 조용히 멈추고 유료 트랙은 Gemini 폴백으로 유지되나 비용(₩1~2 → ₩50+/건)·품질 저하. 2026-07-07 기준 잔액 $5.09, 소진 속도 ~$0.25/hr 이하.

## 작업 결과

| 항목 | 내용 |
|------|------|
| ✅ 감시 스크립트 | `monkos-ops/scripts/runpod_balance_check.sh` — SM 경유 키 취득(값 미노출), GraphQL clientBalance 조회, $2 미만 또는 조회 실패 시 텔레그램 팀 채널 경보 |
| ✅ 모드 3종 | 기본(경보) / `--check-only`(헬스체크용, 부족 시 exit 1) / `--test-alert`(배선 검증) |
| ✅ 스케줄 | `com.monkos.runpod-balance.plist` — launchd 09:00·21:00 KST 1일 2회. M1 `~/Library/LaunchAgents/` 등록 완료 |
| ✅ 헬스체크 편입 | `.claude/commands/health-check.md`에 RunPod 잔액 항목 추가(`--check-only` 재사용) |
| ✅ 문서 | `monkos-ops/scripts/README.md` 야간/알림 섹션 등재 |

## 실측 검증

| 검증 | 결과 |
|------|------|
| 잔액 조회 | $5.09 — 작가님 제보값 일치 |
| 임계값 판정 | threshold=10 강제 → 🚨 부족 감지 + exit 1 정상 |
| 텔레그램 발송 | 팀 채널(-1003794441262) [테스트] 라벨 실발송 성공 |

## ⏳ 활성화 조건

launchd가 참조하는 경로는 main 정본(`/Users/developer/monk_project/monkos-ops/scripts/`). **본 브랜치(claude/sleepy-mclaren-6180d7) main 머지 + M1 pull 후 첫 스케줄(21:00 또는 09:00)부터 실동작.** 머지 전 스케줄 발화는 무해한 미발견 오류로 스킵됨(/tmp/monkos-runpod-balance-stderr.log).

## 💡 부수 발견 — prod 팀 경보 전면 침묵 (별도 태스크 칩 발행)

prod monkos-portal(rev 00417)의 `TEAM_CHAT_ID`가 **빈값** — matte 전 엔드포인트 장애, 토스 결제 실패·취소, 스펙스 규격 미보장 출고 등 기존 팀 알림이 전부 `if (!TEAM_CHAT_ID) return`으로 조용히 스킵 중.

- 원인: `monkos_AI/portal/deploy.sh` 비시크릿 정본값 블록(55행)·`--update-env-vars`(165행)에 TEAM_CHAT_ID 누락 — 4f71cbc 빈값 덮임 사고와 동일 계열
- 정본값: dev 서비스에서 `-1003794441262` 확인(비밀 아닌 설정값, SECRET_INVENTORY §0). 금일 신설 모니터가 같은 chat_id로 실발송 성공 → 채널 유효 입증
- 조치: deploy.sh 정본값 등재 + 재배포 필요 (태스크 칩 `portal prod TEAM_CHAT_ID 공백 복구` 발행)

## 📁 변경 파일

- `monkos-ops/scripts/runpod_balance_check.sh` (신설)
- `monkos-ops/scripts/com.monkos.runpod-balance.plist` (신설)
- `monkos-ops/scripts/README.md` (등재)
- `.claude/commands/health-check.md` (RunPod 잔액 항목)
- `monkos-ops/ops/sessions/2026-07/2026-07-07_M1_민아.md` (어펜드)
