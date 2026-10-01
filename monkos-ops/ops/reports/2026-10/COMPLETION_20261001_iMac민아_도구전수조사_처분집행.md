---
type: completion
date: 2026-10-01
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "도구 전수조사 처분 집행 — 레거시 21 이동 · 이중 소스 2쌍 해소 · 도구 맵 범위 규칙 · 등재 20"
order: "작가님 직접 지시 (경로③, 10-01 10:05 '직접 실행처리해') — ch1 2조 5항 범위 초과 [예외] (일괄 변경 50+ · 배포 체계 게이트 변경 · 규정 계층 .claude/ 변경). 쌍아 사후 추인 대상"
design: monkos-ops/ops/reports/2026-10/REPORT_20261001_iMac민아_도구전수조사_분류.md
---

# COMPLETION — 도구 전수조사 처분 집행 (T1~T4)

**[2026-10-01 10:05 KST]** iMac/민아 → 작가님 · 쌍아

## ✅ 완료
- **T2 레거시 21건 → `_legacy/` 이동** (git mv 27 리네임, 삭제 0): `scripts/_legacy/` 7 · `scripts/tools/_legacy/` 4 · `monkos-ops/scripts/_legacy/` 13(n8n 디렉터리 포함) · `.github/workflows_legacy/` 1(signups-report — Actions 비실행 폴더). 각 폴더 README에 최종 커밋·대체물 표.
- **T1 이중 소스 2쌍 해소**: `apps/idphoto-jp-v079` → `apps/_legacy/idphoto-jp-v079`, `apps/monk_imagen4/backend` → `apps/_legacy/monk_imagen4-backend`. 정본 = `monkos_AI/idphoto-jp`(09-29 prod 00130-njn 출처) · `monkos_AI/image-pro/backend`(references 08-13 실측, index-v7 신규 자산). 두 정본 deploy.sh의 게이트 5(이중 소스 경고·확인 프롬프트) 해제 → `bash -n` 2/2. `apps/monk_imagen4/` 프론트 소스는 배포 중복 대상이 아니라 미이동.
- **참조 갱신**: references.md(폴더 위상·서비스 매핑 2행·이중 소스 블록) · SERVICE_MAP.md · deploy-cr.md(image-engine 경로) · model-check.md(server.js 경로) · launch.json(imagen4-backend cwd). 이동 파일 잔여 코드·CI·설정 참조 **0** (grep 실측).
- **T3 도구 맵 범위 규칙** references.md 머리말 1줄: 스킬 비대상, `_legacy/README`가 레거시 정본.
- **T4 등재 20건**: MCP 서버 6·래퍼 5·build_index(09:32 선반영) + mailbox_watcher(PID 1437) · ads_upload(launchd) · runpod_balance_check+plist(경로 오기 교정) · daily-briefing·e2e-briefing-notify·notify.yml(09-30 success) 등재. 실측 없는 5건(mk-pull·sync-dev-test·kimi·blog-publish·soul_sync)은 "등재(스모크 미실증)" 표기.
- **업데이트 2**: cdp 인지 경로(09:32) · `skills/secret-audit.md` 지목 도구 → `secret.sh map` + `sa_audit.sh`.
- **검증**: 집행 훅 스모크 61/61 · PF 원장 스모크 17/17 · launch.json·workflows YAML 파싱 ok · `pf.sh check` 8/8.

## ❌ 미완·범위 밖
- T4 미실증 5건의 실제 스모크(막내 1회 실행).
- `.github/scripts/*.py`·서비스 `tools/` 하위 개별 스크립트는 모집단 밖 — 다음 조사.
- 설치본 launchd plist 4(레포 외)·`portal/tools/t1-tuning` 보류 유지.
- `apps/_legacy/monk_imagen4-backend/.env`(미추적)가 디렉터리와 함께 이동됨 — 정본 측 `.env` 존재 여부는 다음 image-engine 배포 전 확인.

## 💡 발견
- `git mv -q`는 없는 옵션 — 1차 시도 전량 실패 후 재실행. 실패가 && 체인을 끊어 후속 heredoc이 무음 스킵됐고, 결과 확인 grep으로 적발. "exit 0 ≠반영" 재확인.
- 기계 판정 레거시 33 중 12가 오판(슬래시 스킬·가동 CI) — 분류 규칙에 "호출 형태가 구조적으로 코드 참조 0인 층"을 예외로 둬야 한다.

## ⏳ 후속
1. 쌍아 사후 추인 REVIEW (10-01분 [예외] 3건: 투두 1-4·specs, 전수조사 집행, + 09-30 2건).
2. ch5 6조 게이트 5 조문의 "이중 소스" 전제 소멸 → 법률 각주 (쌍아).
3. 막내: T4 미실증 5건 스모크 + `.github/scripts` 조사.

## 📁 변경 파일
- 커밋 3: `[cleanup]` 레거시 이동 27 리네임 + README 4 / `[refactor]` apps 2 이동 + deploy.sh 2 + 참조 5 / `[docs]` references.md + secret-audit.md
- 원자료: `monkos-ops/ops/audit/TOOL_CENSUS_20261001.csv`

## 🔀 커밋
- 3건 분리, 푸시 직후. 롤백 단위 = 커밋(전부 git mv·텍스트).
