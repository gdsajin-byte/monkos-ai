---
type: completion
date: 2026-09-30
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "집행 코드화 P0·P1 구현 — deny 통일 + PreToolUse/UserPromptSubmit/SessionStart 훅 + E10 채팅 승인 게이트"
order: "작가님 직접 지시 (경로③, 09-30 15:11 '직접 실행하고 추인으로 간다') — ch1 2조 5항 범위 초과 [예외] (규정 계층 .claude/ 변경 + 배포 게이트 변경). 쌍아 사후 추인 REVIEW 대상"
design: monkos-ops/tech/designs/2026-09/DESIGN_20260930_집행코드화_hooks_deny.md
---

# COMPLETION — 집행 코드화 P0·P1 (E1~E10)

**[2026-09-30 15:18 KST]** iMac/민아 → 작가님 · 쌍아

## ✅ 완료
- **E1 deny 통일**: 프로젝트 `.claude/settings.json` deny 5 → 16 (파괴 6 · 배포 직접 2 · Firestore 2 · 시크릿 직접 4 · approve.sh 2). 프로젝트 settings = 정본.
- **E2·E3·E4·E5·E9·E10 `scripts/hooks/guard_bash.py`** (PreToolUse Bash): 세그먼트 선두 판정(&&·;·||·|·$( )·개행·bash -c·xargs·eval 전개, 히어독 본문·주석 제거 → 문서 텍스트 오탐 0). 조문 인용 사유로 deny. 커밋 `[카테고리]` 14종 검사. curl|sh → ask.
- **E5·E8 `guard_write.py`** (PreToolUse Edit/Write/MultiEdit/NotebookEdit): 기존 세션 로그 수정·덮어쓰기 deny(append는 Bash `>>`만), `.env*`·`secrets/`·`deploy.sh` → ask, `.claude/approvals/` 쓰기 deny.
- **E6·E10 `prompt_submit.py`** (UserPromptSubmit): KST 시각 하네스 실측 주입(모델 date 호출 불요) + 작가님 채팅 `배포|deploy|prod` + `승인` 감지 → `.claude/approvals/<session_id>.token` 발급(60분·1회용·세션 바인딩). `설계 승인` 같은 비배포 승인은 미발급.
- **E7 `session_start.sh`** (SessionStart startup|resume|compact): 디바이스(hostname 매핑)·KST·git ahead/behind/dirty·오늘 세션 로그·session_id 출력. 컴팩션 후 재주입.
- **E10 예비 경로 `scripts/approve.sh`**: 작가님 터미널 전용. 에이전트는 deny + 훅 이중 차단.
- **공통 `_common.py`**: stdin JSON·판정 출력·킬스위치 `MONK_HOOKS_OFF=1`(작가님 셸 환경만)·실패 가시화 `[HOOK-ERR]`·토큰 발급/소각.
- **스모크 `scripts/hooks/smoke.py`**: 양성/음성 **59/59 PASS** (픽스처 직접 주입, Claude 세션 불요). 케이스: 파괴 15 · 배포 4 · Firestore 3 · 시크릿 6 · 커밋 6 · curl 2 · E10 12(발급·통과·1회용·타세션·만료·비배포 승인 미발급) · 킬스위치 1 · Write 8 · SessionStart 1 · 실패 가시화 1.
- **실세션 실측** (`claude -p --model haiku --permission-mode bypassPermissions`, 15:16): `gcloud firestore databases list` → **차단** (사유 원문 인용 회신) / 대조군 `gcloud run services list` → **통과**(결과 2건 회신). **bypass 모드에서도 훅 deny가 유효함 확정.** 부수 실증: 중첩 세션이 date 호출 없이 훅 주입 시각으로 헤더를 썼다(E6 효과).
- `.gitignore`에 `.claude/approvals/` 추가. `references.md` 도구 맵 등재(3요건: 인지·스모크·실패 가시화).

## ❌ 미완·범위 밖
- **E9 git commit-msg hook(사람 커밋 포함)·E11 Stop 경고·E12 InstructionsLoaded 계측·E13/E14 pre-commit 경고** — 설계 단계 4·5 (P2), 미착수.
- **현재 열린 세션들**(iMac/쌍아 12:29·본 세션)은 시작 시점 훅을 쓰므로 새 훅은 **다음 세션부터** 적용. `ask` 다이얼로그가 bypass 모드에서 뜨는지는 미실측(E5 ask 케이스 — deny와 달리 실세션 검증 못 함).
- 타 디바이스(M1·M2·4060·웹)는 pull 후 적용. 4060은 WSL bash·python3 전제 — 미실측.

## 💡 발견
- 설계 시 가정한 "훅 `ask`"보다 deny가 확실하다. 실세션에서 deny 사유가 모델 응답에 그대로 인용되어 **차단 자체가 교육**이 된다.
- 세그먼트 선두 판정 없이 문자열 매칭했다면 세션 로그 어펜드(조문 인용 텍스트)가 매 턴 차단됐을 것 — CI C13의 "실행 형태" 원칙이 훅에도 그대로 필요했다.

## ⏳ 후속
1. **쌍아 사후 추인 REVIEW** (ch1 2조 5항) — 본 COMPLETION + D2 rules 교정 9파일.
2. ch1 7조·ch5 1조 개정 청구: "기계 검증 불가" → E10 토큰 절차 명문화 (설계서 §6). 민아 청구안 기안 가능(09-02).
3. 설계 단계 4·5 (P2 4건) 지시서 — 쌍아.
4. 다음 세션 시작 시 SessionStart 훅 출력 실측 → 세션 로그 기록.

## 📁 변경 파일
- `.claude/settings.json` (hooks 3이벤트·deny 16) · `.gitignore`
- `scripts/hooks/{_common,guard_bash,guard_write,prompt_submit,smoke}.py`, `scripts/hooks/session_start.sh`, `scripts/approve.sh` (신규 7)
- `.claude/rules/references.md` (도구 맵 2행)
- (동일 세션 선행) `.claude/rules/*.md` 9파일 D2 `globs:`→`paths:`

## 🔀 커밋
- 본 보고 직후 3건 분리 커밋: `[ops] rules paths 교정(D2)` / `[ops] 집행 훅 P0·P1` / `[docs] 09-30 설계·보고·세션로그`. 푸시는 세션 마감 게이트.
