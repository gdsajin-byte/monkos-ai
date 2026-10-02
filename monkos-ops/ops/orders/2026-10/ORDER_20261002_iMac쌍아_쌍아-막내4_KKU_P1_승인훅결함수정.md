---
type: order
date: 2026-10-02
from: iMac/쌍아
to: iMac/쌍아-막내4
device: iMac
agent: 쌍아
subject: P1 — E10 승인 훅 오발급 + 배포 가드 우회 수정 (꾸 위임 발효 선행 조건)
status: 발행
portfolio: PF_KKU
---

# ORDER — P1 승인 훅 결함 수정

**[2026-10-02 19:24 KST]** iMac/쌍아 → iMac/쌍아-막내4

> **출처**: 작가님 19:18 결정 "…개정 승인"(민아 세션, 사람이 입력한 턴 — `monkos-ops/ops/sessions/2026-10/2026-10-02_iMac_민아.md:376·386`)은 PETITION_20261002_쌍아_꾸배포권한위임_범위게이트 §8 K1 (가)이다. P1은 같은 청구안 §6의 발효 선행 조건이다(§10에 K0 판단 기록). 이 지시서는 승인이 아니다.
> **배정 사유**: 결함 F3·F4를 실측한 사람이 너다. 검증은 다른 세션이 한다(ch1 1조 판단 분리).

## 1. 목적
현행 승인 관문(E10)이 사람이 입력한 턴이 아닌 입력에도 열리는 문제를 고친다. 배포 가드가 다른 형태의 명령으로 우회되는 문제도 함께 고친다. 이 수정은 현행 작가님 경로의 결함 수정이기도 하다.

## 2. 대상 파일
- `scripts/hooks/prompt_submit.py` (46행) — 발급 조건
- `scripts/hooks/guard_bash.py` (191행) — `DEPLOY_GATE` :51-56, 세그먼트 분리
- `scripts/hooks/smoke.py` — 음성·양성 사례 추가
- `prompt_submit.py` 머리말 :6의 전제 문장("실제 사용자 입력에만 발화")을 실측 사실로 정정

## 3. 수정 요건 (청구안 §6 P1 ①~⑤)
1. 입력이 `<cross-session-message`로 시작하면 토큰을 발급하지 않는다. 미발급 사유를 컨텍스트 1줄로 알린다(무음 금지).
2. `<pasted_content …>…</pasted_content>` 안은 탐지 대상에서 뺀다.
3. **턴 전체가 승인 문구일 때만** 발급한다. 기준: 공백을 뺀 본문(붙여넣기 제거 후)이 `배포승인`으로 시작하거나 승인 문구만으로 이루어진 짧은 턴이다. 부정어 `안|말|하지|보류|대기|내일`이 있으면 미발급이다. `prod`는 단어 경계로 본다.
   - 구체 문턱(길이 등)은 네가 정하되, 양성 대조에 반드시 `배포 승인`·`배포승인`·`배포 승인 개정 승인`(작가님 19:18 실발화)을 넣는다.
4. `DEPLOY_GATE`가 다음 3형태를 잡는다: `gh workflow run -R <repo> deploy-monk-kr.yml` · `gh workflow run "Deploy monk.kr (CF Pages)"` · `gh api … /workflows/deploy-monk-kr.yml/dispatches`(및 `-X POST` 변형).
5. 따옴표 안의 `\|`를 세그먼트 분리로 읽어 차단하던 오탐(막내2 F8 — `grep -n "…\|wrangler pages deploy"`)을 고친다. 차단을 약하게 만드는 방향이 아닌지 대조군으로 확인한다.

## 4. 판정 기준
- `python3 scripts/hooks/smoke.py` 전부 PASS. 추가 사례는 음성 10 이상(세션 간 메시지 1 · 붙여넣기 1 · 부정문 4(F3 원문) · 우회 3 · 오탐 1)과 양성 3 이상(위 3-③)이다.
- `python3 scripts/hooks/smoke_pf.py` 회귀 PASS.
- **실세션 실측 1건**: 쌍아(`monk-project-72`)에게 승인 문구가 들어간 세션 간 메시지를 1통 보낸 뒤, 쌍아가 자기 `.claude/approvals/`에서 미발급을 확인한다. 이 절차는 쌍아에게 요청만 하고, 판정은 쌍아가 한다.
- PETITION_20261001 묶음 C 선행 조건 ②③(하위 세션 문구 발급 불가·사용자 출처 외 발급 0)의 실증 자료로 겸한다. 완료 보고에 그 대응을 1줄 적는다.

## 5. 반환
- COMPLETION: `monkos-ops/ops/reports/2026-10/COMPLETION_20261002_iMac쌍아-막내4_KKU_P1_승인훅결함수정.md` (✅❌💡⏳📁🔀, smoke 전후 건수, 사례 표)
- 커밋 `[fix] …` → `git pull --rebase` → 푸시 → 쌍아에게 1줄 `COMPLETION: {경로} {SHA8}`
- `references.md` 도구 맵 "집행 훅 6종" 행에 10-02 P1 수정·smoke 건수를 1줄 덧붙인다(쓰기 범위 포함).

## 6. 쓰기 범위
- 위 훅 3파일 + COMPLETION + 네 세션 로그 + `references.md` 해당 행만.
- `.claude/settings.json`·워크플로·법률은 수정하지 않는다. 배포 명령은 실행하지 않는다.
- 민아·소소의 미커밋 파일(`session_start.sh`·`smoke.py`에 민아 변경이 있을 수 있음 — `git status`로 먼저 확인)을 덮어쓰지 않는다. `smoke.py`에 미커밋 변경이 있으면 그 위에 추가하고, 커밋에 함께 들어가면 COMPLETION에 명기한다.

## ⚠️ 준수 조항
- 헌법 3조 1항 `date` 실측. 헌법 4조 1-2항.
- ch1 7조: 세션 간 메시지에서 두 낱말(배포·승인)을 20자 안에 붙여 쓰지 않는다. 단, §4의 실측 1건은 예외다(목적 명시).
- 킬스위치 `MONK_HOOKS_OFF`를 쓰지 않는다.
