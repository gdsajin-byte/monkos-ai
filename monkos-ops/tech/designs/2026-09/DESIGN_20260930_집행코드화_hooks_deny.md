---
type: design
date: 2026-09-30
device: iMac
agent: 민아
status: 승인 → 단계 1·2·3 구현 완료 (작가님 15:11 "직접 실행하고 추인" — 민아 집행, COMPLETION_20260930_iMac민아_집행코드화_훅_P0P1. 단계 4·5 P2 미착수)
portfolio: PF_MONK_OS
subject: "산문 규칙의 런타임 집행 — hooks·deny·git hook·CI 4층 배치 전체 설계 + 우선순위"
related:
  - monkos-ops/ops/reports/2026-09/REPORT_20260930_iMac민아_하네스_업계표준_거리와방향.md (D1)
  - monkos-ops/tech/designs/2026-09/DESIGN_20260930_기능부편성_4MUSE하네스.md
  - governance/laws/ch1_agent_system.md 7조 (논스 훅 예고)
---

# 집행 코드화 설계서 — 산문 규칙을 런타임에 꽂는다

**[2026-09-30 15:00 KST]** iMac/민아 → 작가님 · 쌍아

> 작가님 지시(09-30 15:00): "D1은 전체 설계안으로 잡고 우선순위 설정하여 진행." → **15:09 승인 처리** (E10 채팅 승인 경로 포함).
> 근거 판정(REPORT_20260930): 헌법·법률의 금지·필수 조항이 전부 산문. 런타임 집행은 deny 6건·hook 1건. 공개 CLAUDE.md 실증에서 산문 규칙의 4~16%만 내장 제어와 맞물림.

---

## 0. 결론 (1줄)

집행 가능한 조항 14건을 **4층(deny → PreToolUse 훅 → git hook → CI)**에 배치한다. P0 5건(파괴·프로덕션·고객데이터·시크릿)은 막내 1일, P1 5건(규율 자동화)은 막내 1일, P2 4건은 2주 내. 집행 불가 조항 6건은 산문으로 남기고 그 사실을 명기한다.

---

## 1. 원칙

1. **차단은 코드, 판단은 산문.** 명령 문자열·파일 경로로 판별되는 것만 코드로. 아부 금지·에러 묵과 금지 같은 판단 영역은 산문 유지.
2. **deny로 되는 건 deny.** 훅은 deny 문법(접두 글로브)이 못 잡는 것만: 명령 중간(`&&` 뒤), 인자 조합, 파일 존재 여부, 승인 토큰.
3. **모호하면 `ask`, 조문에 있으면 `deny`.** 오탐이 작업을 막는 것보다 승인 1턴이 싸다. 헌법 4조 2항 열거 명령만 deny.
4. **실패 가시화.** 훅 스크립트 오류(exit 1)는 비차단이라 무음이 된다 → 스크립트 첫 줄에서 자기 오류를 stderr + `[HOOK-ERR]` 접두로 출력. 도구 3요건(등재·스모크·실패 가시화) 적용.
5. **전 디바이스 동일.** 훅은 프로젝트 `.claude/settings.json`(git 공유)에, 스크립트는 `scripts/hooks/`에. bash + python3만 사용(jq 금지 — 4060 WSL·웹 컨테이너 호환).
6. **롤백 = 커밋 1개.** settings.json 훅 블록 + scripts/hooks/ 를 한 커밋으로. 킬스위치 `MONK_HOOKS_OFF=1`(settings `env`가 아닌 셸 환경 — 에이전트가 Bash로 못 바꾸는 층).

---

## 2. 기술 기반 (공식 문서 실측 2026-09-30, code.claude.com/docs/en/hooks · memory)

| 항목 | 확인 사실 |
|------|------|
| PreToolUse 차단 | exit 2 = 차단(stderr가 사유). exit 0 + JSON `hookSpecificOutput.permissionDecision: allow\|deny\|ask` + `permissionDecisionReason` |
| 훅 입력(stdin JSON) | `tool_name`, `tool_input.command`(Bash), `tool_input.file_path`(Edit/Write), `cwd`, `permission_mode`, `session_id` |
| SessionStart | matcher `startup\|resume\|clear\|compact\|fork`. stdout → Claude 컨텍스트. JSON `additionalContext`·`sessionTitle`·`watchPaths` |
| UserPromptSubmit | stdout → 컨텍스트. `decision: block` 가능. 타임아웃 기본 30s |
| Stop | exit 2 또는 `decision: block` + `reason`으로 종료 저지. `additionalContext`로 비차단 피드백 |
| 정의 위치 | user / project / local settings, plugin, skill·agent frontmatter |
| rules 로딩 | `paths`만 인식(다른 키 무시). **D2 교정 완료(09-30 15:00)** — `globs:` 9건 → `paths:` 7건 + 전역 의도 2건은 무조건 로딩으로 |
| deny 문법 | `Bash(prefix *)` 접두 글로브. 3파일 드리프트 실측: user deny 0 / project 5 / local 6 |

---

## 3. 집행 매트릭스 — 조항 → 층 → 우선순위

### 3.1 P0 — 차단 (파괴·프로덕션·고객 데이터·시크릿) · 막내 1일

| # | 조항 | 현행 | 집행 층 | 판정 규칙 | 결정 |
|---|------|------|------|------|------|
| E1 | 헌법 4조 2항 파괴 명령 | deny 5~6, 3파일 불일치 | **deny 통일** (project settings 정본, user·local은 비우거나 동일) | `rm -rf`, `git push --force`, `git push -f`, `git reset --hard`, `git clean -f`, `git checkout -- ` | deny |
| E2 | 헌법 4조 2항 — 명령 중간 파괴 | 없음 (deny는 접두만) | **PreToolUse 훅** `guard_bash.py` | `&&`·`;`·`\|\|`·`$( )` 뒤의 E1 패턴, `--force` 위치 무관, `curl \| sh` | deny |
| E3 | ch5 2조 Cloud Run 직접 배포 | 산문 | deny + 훅 | `gcloud run deploy*`, `gcloud builds submit*` (describe·list·logs는 통과) | deny |
| E4 | ch4 10조 Firestore 직접 접근 | 산문 | 훅 | `gcloud firestore*`, `firebase firestore*`, `node -e` 인자에 `firestore\|@google-cloud/firestore` 포함 | deny (사유에 `scripts/credits.sh` 안내) |
| E5 | 헌법 4조 1항 시크릿 직접 조작 + `.env`·`secrets/`·`deploy.sh` 수정 전 승인 | 산문 | 훅 (Bash + Edit/Write) | Bash: `gcloud secrets create\|versions add`, `gh secret set`, `wrangler secret put` → **deny** (`secret` 커맨드 안내). Edit/Write: `file_path`가 `**/.env*`·`secrets/**`·`**/deploy.sh` → **ask** | deny / ask |

### 3.2 P1 — 자동화 (규율 비용 절감·승인 기계화) · 막내 1일 + 쌍아 설계 0.5일

| # | 조항 | 현행 | 집행 층 | 동작 | 결정 |
|---|------|------|------|------|------|
| E6 | 헌법 3조 1항 매 턴 `date` | UserPromptSubmit 훅이 **문구만** 리마인드 | **UserPromptSubmit 훅 교체** | `date '+%Y-%m-%d %H:%M KST'` 실행 결과 + 헤더 규칙을 컨텍스트로 주입 → 모델의 `date` 호출 1턴 절약, 추정 타임스탬프 원천 차단 | 자동 |
| E7 | ch1 5조 역할·디바이스 판별 + ch3 세션 시작 | session-start 스킬 수동 | **SessionStart 훅** (`startup\|resume\|compact`) | hostname→디바이스, KST, `git status -sb` ahead/behind, 오늘 세션 로그 존재 여부, 미푸시 커밋 수 출력. compact 시 재주입(컴팩션 후 정합 유지) | 자동 |
| E8 | 헌법 3조 2항 세션 로그 append-only | 산문 | PreToolUse 훅 (Edit/Write) | `file_path`가 `monkos-ops/ops/sessions/**`이고 **파일이 이미 존재**하면 Write·Edit **deny** (append는 Bash `>>`만) | deny |
| E9 | ch6 커밋 형식 `[카테고리]` 14종 | 산문 + CI 사후 | **git commit-msg hook** (사람 커밋도 포함) + PreToolUse `git commit -m` 사전 검사 | 정규식 `^\[(feat\|fix\|refactor\|docs\|ops\|cleanup\|deploy\|sync\|research\|정리\|정산\|헌법\|log\|briefing)\]` 불일치 → 거부 | deny |
| E10 | **ch1 7조 승인 게이트 논스** (ch5 1조 monk.kr·`deploy.sh prod`) | "기계 검증 불가 — 흔적이 유일" | **UserPromptSubmit 훅(발급) + PreToolUse 훅(검사)** | **작가님이 채팅에 치는 승인 문구가 그대로 토큰이 된다.** UserPromptSubmit 훅은 하네스가 실제 사용자 입력에만 발화시키므로 모델이 위조할 수 없는 채널이다(ch1 7조 "자기 출력 오염"이 원천 불가). 훅이 `prompt`에서 `승인` 패턴(예: `배포 승인`, `prod 승인`)을 감지하면 `.claude/approvals/<session_id>.token`(1h·1회용, gitignore) 발급. PreToolUse 훅이 `./deploy.sh prod`·`wrangler pages deploy`·`gh workflow run deploy-monk-kr`에서 **같은 session_id의** 토큰 확인·소각. 없으면 deny "작가님 승인 필요". 무인 맥락(Routines·크론)은 사용자 턴이 없어 토큰이 생길 수 없다 = ch1 7조 "승인 채널 부재 ≠ 승인"의 코드화. 터미널 `scripts/approve.sh`는 **예비 경로**(원격·무인에서 작가님이 의도적으로 열 때만) | **쌍아 설계 승인 필요** (승인 흐름 변경) |

### 3.3 P2 — 게이트·계측 · 2주 내

| # | 조항 | 집행 층 | 동작 |
|---|------|------|------|
| E11 | 헌법 3조 2항 세션 로그 어펜드 의무 | **Stop 훅** (비차단) | 이 세션에서 파일 변경이 있는데 오늘 세션 로그 mtime이 세션 시작 이전이면 `additionalContext` 경고 |
| E12 | 하네스 자기 계측 (REPORT D5) | **InstructionsLoaded 훅** | 로딩된 CLAUDE.md·rules 파일명·바이트를 `monkos-ops/ops/audit/HARNESS_LOAD.jsonl`에 기록 → D2 효과·부서제 시범 측정 1번(컨텍스트 로딩량) 데이터원 |
| E13 | ch8 내부 호칭 외부 유출 | git **pre-commit** (CI C7 선행화) | `MONK_kr/**`·`monkos_AI/*/views/**`·`public/**` 스테이징분 grep 쌍아\|민아\|막내\|용아\|소소 → 경고(차단 아님, C7과 동일 기준) |
| E14 | ch2 7조 인프라 상수 하드코딩 | git pre-commit (경고) | 서비스 코드 스테이징분에서 `us-central1`·`₩`·`\$[0-9]+`·`monkos.ai` 리터럴이 `config.js`·`references.md` 밖에 신규 추가되면 경고 |

### 3.4 집행 불가 — 산문 유지 (명기)

| 조항 | 이유 |
|------|------|
| 헌법 2조 3항 에러 묵과·아부 금지 | 판단 영역 |
| 헌법 4조 4항 챗봇 "되는 것만 응답" | 런타임 코드(RAG 프롬프트) 영역, 하네스 밖 |
| 헌법 3조 4항 정본 단일 | 중복 판정이 의미 판단. CI 파일명 중복 검사만 가능(별건) |
| ch7 지시서 범위 밖 작업 금지 | 범위가 자연어 |
| live-verify 2회 히트·대조군 | `edge/deploy.sh`·`smoke_assert`가 배포 경로에서 코드화 완료. 수동 검증은 판단 |
| 헌법 5조 4항 실행 전 적합성 검토 | 판단 영역 — 단 E10 논스가 "승인 수신"을 기계화 |

---

## 4. 구현 사양

### 4.1 파일 배치
```
scripts/hooks/
  guard_bash.py        # E2·E3·E4·E5(Bash)·E9(사전)·E10 — stdin JSON → 판정 → JSON stdout
  guard_write.py       # E5(Edit/Write ask)·E8 — file_path 판정
  session_start.sh     # E7
  prompt_submit.sh     # E6
  stop_check.py        # E11
  instructions_log.py  # E12
  commit-msg           # E9 git hook 본체 (설치: scripts/tools/install_git_hooks.sh 에 추가)
  pre-commit-extra.sh  # E13·E14 (기존 gitleaks-precommit.sh 뒤에 체인)
scripts/approve.sh     # E10 작가님 전용 승인 토큰 발급
.claude/settings.json  # hooks 블록 + deny 정본
.claude/approvals/     # gitignore
```

### 4.2 settings.json hooks 블록 (골격)
```json
"hooks": {
  "SessionStart":     [{"matcher":"startup|resume|compact","hooks":[{"type":"command","command":"bash scripts/hooks/session_start.sh","timeout":10}]}],
  "UserPromptSubmit": [{"matcher":"","hooks":[{"type":"command","command":"bash scripts/hooks/prompt_submit.sh","timeout":5}]}],
  "PreToolUse":       [{"matcher":"Bash","hooks":[{"type":"command","command":"python3 scripts/hooks/guard_bash.py","timeout":10}]},
                       {"matcher":"Edit|Write","hooks":[{"type":"command","command":"python3 scripts/hooks/guard_write.py","timeout":10}]}],
  "Stop":             [{"matcher":"","hooks":[{"type":"command","command":"python3 scripts/hooks/stop_check.py","timeout":10}]}],
  "InstructionsLoaded":[{"matcher":"","hooks":[{"type":"command","command":"python3 scripts/hooks/instructions_log.py","timeout":5}]}]
}
```
기존 UserPromptSubmit echo 훅은 E6으로 **대체**(중복 주입 방지).

### 4.3 guard_bash.py 판정표 (사유 문자열에 조항 인용 필수)
| 순 | 패턴 | 결정 | 사유 |
|----|------|------|------|
| 1 | `MONK_HOOKS_OFF=1` 환경 | allow | 킬스위치 (stderr에 `[HOOK-OFF]`) |
| 2 | E1 패턴이 명령 어디든 (토큰 분리 후) | deny | 헌법 4조 2항 |
| 3 | `gcloud run deploy`·`gcloud builds submit` | deny | ch5 2조 → `./deploy.sh {env}` |
| 4 | `gcloud firestore`·`firebase firestore`·`node -e ...firestore` | deny | ch4 10조 → `scripts/credits.sh` |
| 5 | `gcloud secrets (create\|versions add)`·`gh secret set`·`wrangler secret put` | deny | 헌법 4조 1항 → `secret` 커맨드 |
| 6 | `./deploy.sh prod`·`deploy.sh prod`·`wrangler pages deploy`·`gh workflow run deploy-monk-kr` | 토큰 있음→allow+소각 / 없음→deny | ch1 7조·ch5 1조 (E10 승인 후) |
| 7 | `git commit` with `-m` 형식 불일치 | deny | ch6 1조 14종 |
| 8 | `curl ... \| (ba)?sh`, `wget ... \| sh` | ask | 신뢰 불명 실행 |
| 9 | 그 외 | (출력 없음 = 통과) | |

### 4.4 스모크 (도구 3요건 — 미충족 = 미완료)
- 각 E마다 **양성 1 + 음성 1** 케이스를 `scripts/hooks/smoke.sh`에 고정. stdin JSON 픽스처로 훅 스크립트를 직접 호출해 exit·JSON 판정 (Claude 세션 불요).
  - 예: E4 양성 `gcloud firestore export` → deny / 음성 `gcloud run services describe` → 통과
  - 예: E8 양성 Write 기존 세션로그 → deny / 음성 Write 신규 세션로그 → 통과
- 실세션 스모크 1회: 막내가 `claude -p`로 deny 3건 실측 → COMPLETION에 기록.
- 실패 가시화: 스크립트 예외 시 `[HOOK-ERR] {script}: {msg}` stderr + exit 1(비차단). Stop 훅이 세션 중 `[HOOK-ERR]` 발생 시 경고 1줄.

---

## 5. 우선순위·일정·담당

| 단계 | 항목 | 담당 | 기한 | 게이트 |
|------|------|------|------|------|
| **1** | E1 deny 통일 + E2~E5 `guard_bash.py`·`guard_write.py` + smoke | 막내 (지시서 쌍아) | 10-02 | smoke 양/음 10케이스 PASS |
| **2** | E6·E7·E8 (prompt_submit·session_start·세션로그 append-only) | 막내 | 10-03 | 실세션 startup·compact 재주입 확인 |
| **3** | E10 논스 — 채팅 승인 문구 → 토큰 | 쌍아 설계 → 작가님 승인 → 막내 | 10-07 | 작가님 실기 1회: 토큰 없이 deny → 채팅 "배포 승인" → allow → 재시도 deny(1회용) → 다른 세션에서 deny(세션 바인딩). 실측 항목: bypass 모드에서 훅 `ask`가 다이얼로그를 띄우는지(뜨면 클릭 승인도 병행 가능) |
| **4** | E9 commit-msg + E13·E14 pre-commit | 막내 | 10-10 | 기존 gitleaks 체인 무손상 |
| **5** | E11·E12 계측 | 막내 | 10-14 | HARNESS_LOAD.jsonl 7일분 → 부서제 시범 측정 1 데이터 |

단계 1·2는 부서제 시범(10-01~)과 독립 — **먼저 간다**. 단계 3은 승인 흐름 자체를 바꾸므로 ch1 7조·ch5 1조 개정과 묶어 청구.

---

## 6. 법률 영향

| 대상 | 변경 | 수준 |
|------|------|------|
| ch1 7조 | "논스 훅 배치 전까지 한계" 문구 → E10 배치로 **한계 해소 + 승인 토큰 절차 명문화** | 법률 개정 (단계 3 후) |
| ch5 1조 | "기계 검증 불가 — 흔적이 유일" → 토큰이 기계 검증. 흔적(사유·run ID) 의무는 유지 | 법률 개정 |
| ch3 | 세션 로그 append-only에 "런타임 강제(E8)" 각주 | 경미 |
| ch6 | 커밋 형식에 "commit-msg hook 강제" 각주 | 경미 |
| 헌법 | 조문 변경 없음. 4조·3조가 집행되는 방식만 바뀜 | — |
| references.md 도구 맵 | hooks 6종·approve.sh 등재 | 규정 |

---

## 7. 리스크

| 리스크 | 완화 |
|------|------|
| 오탐이 정상 작업 차단 (예: `rm -rf node_modules`) | 헌법 열거 명령만 deny. `rm -rf`는 헌법이 무조건 금지이므로 deny 유지, 필요 시 작가님이 터미널에서 직접(훅은 에이전트 도구 호출에만 적용) |
| 훅 타임아웃으로 매 턴 지연 | 스크립트 순수 python·bash, 외부 호출 0. UserPromptSubmit 5s |
| 4060 WSL·웹 컨테이너 경로 차이 | `cwd` 기준 상대 경로, `python3` 존재 전제 (session_start가 부재 시 `[HOOK-ERR]`) |
| 에이전트가 `approve.sh`를 직접 실행 | E10 훅이 `approve.sh` 호출 자체를 deny. 토큰 디렉터리 쓰기도 guard_write에서 deny |
| 킬스위치 남용 | 셸 환경변수 — 에이전트 Bash 세션은 별 프로세스라 훅 프로세스에 전파 안 됨. 작가님 터미널 기동 시에만 유효 |
| `.claude/` 변경 = 쌍아 소관 | 본 설계는 제안. 구현 지시서 쌍아 발행. D2(rules 키 교정)만 작가님 직접 승인으로 민아 기집행 |

---

## 8. 다음 행동
1. 쌍아: 본 설계 검토 → 단계 1·2 지시서 발행 (막내 1명, 2일).
2. 작가님: 단계 3 승인 흐름(`approve.sh`) 채택 여부.
3. 민아: 단계 1 완료 후 smoke 재검증 + 부서제 시범 측정 설계에 E12 연결.
