---
type: completion
date: 2026-07-14
device: M1
agent: 민아
status: 완료
subject: 워크트리 16개 정리(2.3GB) + RunPod 모니터 고립 커밋 구제 + prod 팀 알림 3종 env 복구
---

# 워크트리 정리 · 모니터 구제 · 팀 알림 복구 — 완료 보고

**[2026-07-14 17:22 KST]** M1/민아 → 작가님

> 경위: 쌍아 워크트리 16개(2.3GB) 정리 제안 → 작가님 "민아 확인 후 실행" → 민아 전수 판정 중 구제 2건·부수 발견 1건 → 작가님 "승인한다 전부 처리하고 보고서 남겨".

---

## 1. ✅ 워크트리 정리 — 16 → 1 (main만 잔존)

- 전수 판정 후 15개 제거: `git worktree remove`(+더티 2개 `--force`) + `prune`. **rm -rf 미사용** (헌법 4조 2항).
- 사전 전수 판정 결과가 정리의 근거:

| 판정 | 건수 | 처분 |
|------|------|------|
| main 병합 + 클린 | 11 | 제거 |
| main 병합 + 더티(goofy-dubinsky·vigilant-bassi 기록 파일 5개) | 2 | **main 기존재 대조 확인**(중복 사본) 후 제거 |
| **미병합** (sleepy-mclaren) | 1 | **구제 머지 후** 제거 (§2) |
| **미병합** (hopeful-rubin) | 1 | 제거하되 **브랜치 존치** (커밋 보존) |
| detached 5종 | (위에 포함) | HEAD 커밋 main 병합 확인 후 제거 |

- 로컬 브랜치 정리: 병합분 15개 `-d` 안전삭제 (develop 포함 — ch6 폐기 정책 이행). **존치 2개**: `claude/hopeful-rubin`(네이버 재번역·importer, 3-4월) · `claude/goofy-dubinsky`(3/25 세션마감 로그 1커밋) — 쌍아 리뷰 후 폐기 판단 위임.
- 원격 브랜치(origin/claude/*)는 범위 외 — 쌍아 판단 사항으로 이관.
- 잔여: 빈 컨테이너 폴더 `monk_project/`(현 민아 세션 cwd라 존치)·`monk_project-worktrees/`(삭제됨). 회수 용량 ~2.3GB(쌍아 실측 기준).

## 2. ✅ RunPod 잔액 모니터 구제 (침묵 고장 7일 해소)

- 발견: sleepy-mclaren 브랜치에 **미병합 커밋 f7c45e4b**(7/7 RunPod 잔액 모니터 신설) 고립. launchd(`com.monkos.runpod-balance`, 09/21시)는 main 경로의 `monkos-ops/scripts/runpod_balance_check.sh`를 참조하나 **파일이 main에 부재** → **7/7부터 모니터 침묵 고장** (오늘 브리핑 🔴 RunPod 이월과 연관).
- 조치: 구제 머지 `6d92c5ca` — 충돌 1건(7/7 세션 로그)은 append-only 원칙대로 양측 보존·시계열 삽입(15:11↔15:18 사이 15:15). 스크립트 main 편입·구문 검증·push 완료.
- 효과: **오늘 21:00 KST 스케줄부터 실동작** ($2 미만 시 텔레그램 팀 경보).

## 3. ✅ prod 팀 알림 3종 env 복구 (작가님 승인, 헌법 4조 1항 절차)

- 발견 경위: 구제 머지된 7/7 로그 속 미해소 발견 재부상 — prod `TEAM_CHAT_ID` 빈값. 실측 결과 **3종 전부 빈값**: `TELEGRAM_TEAM_BOT_TOKEN`·`TEAM_CHAT_ID`·`TEAM_NOTIFY_SECRET` (4f71cbc 빈값 덮임 계열). 영향: matte 장애·토스 결제 실패·규격 경보 등 **서버발 팀 텔레그램 알림 전량 침묵**.
- 조치(시크릿 취급 분리):
  - `TEAM_CHAT_ID`(비시크릿 정본값): **deploy.sh ENV_VARS 정본화** — 재발 시 다음 배포가 자동 복원. 주석으로 사고 이력·승인 명기.
  - `TELEGRAM_TEAM_BOT_TOKEN`·`TEAM_NOTIFY_SECRET`(시크릿 성격): **git 비커밋** — dev 정본값을 값 비출력 파이프로 prod에 1회 직주입 (`--update-env-vars`는 미나열 키를 보존하므로 이후 배포에도 유지).
- 배포: prod rev **00471** — 3종 env "값 있음" 검증 완료 (값 비출력 검증).
- ⚠️ 후속 권고 2건: ① 토큰이 dev/prod env에 평문 상주 — **Secret Manager 이관 + SECRET_INVENTORY 등재** 안건 (쌍아). ② 실발송 스모크(테스트 경보 1회)는 다음 장애/테스트 이벤트에서 자연 검증 또는 `runpod_balance_check.sh --test-alert` 활용 가능.

## 4. 변경·산출물

| 구분 | 내용 |
|------|------|
| 커밋 | `6d92c5ca` 구제 머지 (push 완료) / deploy.sh·본 보고서·세션로그 (본 커밋) |
| 배포 | prod rev 00471 (팀 알림 env) — 앞서 00469(us-visa FAQ 정정)와 별건 |
| 인프라 | launchd 모니터 실동작 대기(21:00) / 워크트리 1개(main)·로컬 브랜치 3개(main+미병합 2) |
| 위임 | 원격 브랜치 정리·미병합 2브랜치 리뷰·토큰 SM 이관 → 쌍아 |
