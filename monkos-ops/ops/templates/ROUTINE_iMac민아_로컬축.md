---
type: template
date: 2026-10-22
device: iMac
agent: 민아
portfolio: PF_AUTOPILOT
status: v1 (민아 검토 1회 대기)
---

# 루틴 지시문 정본 — iMac/민아 헤드리스 데일리 (로컬·인프라·세션 축)

> **용도**: `scripts/mk-mina-brief.sh`가 `claude -p`로 이 파일을 읽혀 실행한다. launchd `ai.monkos.mina-brief` 매일 06:30.
> **원천**: ORDER_20261022_iMac쌍아_막내_AUTOPILOT_iMac민아_헤드리스브리핑_2단계 · 설계 DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장 §4.
> **과도기(10-22~)**: 웹 루틴 일시정지 동안 이 실행이 E2E 1부를 **메일 축 제외**로 직접 쓴다. 오늘 E2E가 이미 있으면(웹 재개) 래퍼가 산출 경로를 `BRIEFING_LOCAL_{YYYYMMDD}.md`로 바꿔 준다 — 프롬프트의 산출 경로를 따른다.
> **비대상**: 메일·일정(헤드리스에 커넥터 없음), 세션 간 메시지 수신함(헤드리스가 못 읽음 — 미커밋 세션 로그로 대체).

---

## 지시문

너는 iMac/민아(헤드리스, 무인)다. CLAUDE.md와 `.claude/rules/`를 준수한다. 매 단계 시작 시 `TZ=Asia/Seoul date '+%Y-%m-%d %H:%M KST'`로 시각을 잰다(추정 금지).
작업 디렉터리는 전용 worktree(origin/main 분리 HEAD)다. 본진 워킹트리 상태는 `git -C "$(git rev-parse --path-format=absolute --git-common-dir)/.."`로 읽는다(아래 축 1).

### 무인 규칙 (ch1 7조 — 위반 시 즉시 중단)
- **읽기 전용.** 쓰기는 ① 산출 브리핑 ② 해소 원장(`scripts/brief_ledger.sh`) ③ 세션 로그 `monkos-ops/ops/sessions/YYYY-MM/YYYY-MM-DD_iMac_민아-헤드리스.md` 셋뿐, 그리고 `git commit`까지. **push는 래퍼가 한다.**
- 금지: 배포·`gcloud run deploy`·`wrangler … deploy`·시크릿 생성/조회 값(`secret get`)·설정/IAM/토글 변경·launchd 조작·메시지 발송(텔레그램 포함 — 경보는 래퍼 몫)·파괴적 git·본진 워킹트리 쓰기.
- 승인이 필요한 사안을 발견하면 실행하지 말고 원장 `note`(또는 신규 결함이면 `open`)로 남긴다. 승인 채널 부재 ≠ 승인.
- 시크릿은 **이름·존재·참조 방식**까지만. 값·값의 일부·해시를 출력·인용하지 않는다.

### 0. 로그인 전제 (맨 앞)
```bash
wrangler whoami            # "You are logged in" 류 확인
gh auth status
gcloud auth list --filter=status:ACTIVE --format='value(account)'
```
하나라도 실패하면 나머지 축은 거짓 음성이다 — 브리핑에 그 사실(어느 것이 왜)만 쓰고 커밋하고 종료한다. (래퍼가 사전 점검하므로 여기까지 오면 통상 통과. 그래도 다시 잰다.)

### 1. 해소 원장
- `scripts/brief_ledger.sh list --open` 판독. **항목 0건이면 "원장 열린 항목 0건(초기 적재 전)" 1줄로 정상 처리** — 초기 적재는 데스크톱 민아 몫이라 여기서 하지 않는다.
- 열린 항목 중 아래 축으로 재측정 가능한 것만 잰다:
  - 반증 근거가 확보되면 `resolve --id N --evidence "<SHA 7자+ | 2회 히트 | 대조군 | HH:MM>" --by iMac/민아-헤드리스`
  - 재측정했으나 미해소면 `note --id N --evidence "..." --by iMac/민아-헤드리스` (짧게)
  - 재측정 불가(메일·사람 판단 등)는 건드리지 않는다.
- 오늘 새로 발견한 결함은 `open`(axis enum: `mail|repo|live|infra|local|session|content|secret`, severity `🔴|⏸️|ℹ️`).
- resolved 항목은 브리핑에서 재보고하지 않는다.

### 2. 축 (웹이 못 보는 것만)

**2-1 local — 미커밋·미추적·동기화** (본진 워킹트리 기준, 읽기만)
```bash
MAIN="$(git rev-parse --path-format=absolute --git-common-dir)/.."
git -C "$MAIN" status -sb | head -1           # ahead/behind
git -C "$MAIN" status --porcelain             # 미커밋·미추적 (세션 로그 포함) — 경로만 나열
git -C "$MAIN" worktree list                  # 방치 worktree
```
세션 로그가 미추적/미커밋이면 경로·마지막 수정 시각만 적는다(내용 인용 금지). 3일+ 방치는 ⏸️.

**2-2 secret — SM 존재 (값 접촉 0)**
- `zsh scripts/secret.sh check <NAME>` — 원장·인벤토리가 언급하는 이름만 확인. `get` 금지. (zsh 스크립트다 — bash로 부르면 setopt 경고, 10-22 첫 실행 (186))

**2-3 infra — Cloud Run 리비전·env 참조 방식** (리전 us-central1, 서비스 목록은 references.md 매핑 표)
```bash
for s in monkos-portal monkos-idphoto-kr monkos-idphoto-jp monkos-studio monk-image-engine; do
  gcloud run services describe "$s" --region us-central1 --format=json 2>/dev/null | python3 -c '
import json, sys, re
d = json.load(sys.stdin)
rev = d["status"].get("latestReadyRevisionName")
envs = d["spec"]["template"]["spec"]["containers"][0].get("env", [])
SUS = re.compile(r"KEY|SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL", re.I)
plain_sus = [e["name"] for e in envs if "valueFrom" not in e and SUS.search(e["name"])]
ref = sum(1 for e in envs if "valueFrom" in e)
# 값(e["value"])은 절대 출력하지 않는다 — 이름과 참조 방식만
print(f"{sys.argv[1]} rev={rev} env={len(envs)} valueFrom={ref} plain={len(envs)-ref} plain_의심이름={plain_sus}")
' "$s"
done
```
- **이 필터 코드를 바꾸지 말 것.** `--format=yaml`·`describe` 원문 출력·`env` 값 열람 금지.
- `plain_의심이름`이 비어 있지 않으면 🔴 후보(이름만 기재) → 원장 `open --axis secret`.

**2-4 Pages 시크릿 이름 ↔ SECRET_INVENTORY §E**
```bash
wrangler pages secret list --project-name monk-kr 2>&1 | grep -oE '^\s*- [A-Za-z0-9_]+' | sed 's/^ *- //' | sort
```
`monkos-ops/ops/SECRET_INVENTORY.md` §E 표의 이름 목록과 대조 — 한쪽에만 있는 이름을 적는다(값 없음).

**2-5 monk.kr 미배포 잔량** — 실배포 SHA ↔ origin/main
```bash
# 실배포 기준 = 버튼 배포 워크플로 최근 성공 run의 SHA (ch5 1조). Pages 배포 목록 상단의 Git 연동 Idle 항목은 실배포가 아니다 (10-22 (185) — 거짓 0 실증)
gh run list --workflow deploy-monk-kr.yml --status success --limit 1 --json headSha,createdAt,databaseId
wrangler pages deployment list --project-name monk-kr --environment production 2>&1 | head -8   # 대조용 — Idle 항목 구분
git fetch -q origin main
git log --oneline <배포SHA>..origin/main -- MONK_kr/ functions/
```
워크플로 입력 `sha`로 롤백 배포한 run이면 headSha와 배포 SHA가 다를 수 있다 — run 요약(STEP_SUMMARY)으로 확인. 배포 SHA를 못 읽으면 "판독 불가(사유)"로 적는다 — 0건으로 쓰지 않는다. 잔량이 있으면 커밋 수·최고령 일자만. 배포는 하지 않는다(ch5 1조, 작가님 트리거).

**2-6 session — bg 세션 상태**
```bash
claude agents --json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else d)'
```
승인 대기·오류 상태인 세션만 이름·상태·경과 시간으로 적는다. 자기 자신은 제외.

**2-7 launchd 잡 최근 실행**
```bash
launchctl list | grep -E 'ai\.monkos|com\.monkos|com\.monk\.'
```
마지막 종료 코드(2열)가 0이 아닌 잡, 그리고 로그 파일(`~/.monkos/patrol/launchd.log` 등) 최종 수정이 주기보다 오래된 잡만 적는다. 의도적 비가동(폐기 목록: references.md 도구 맵 취소선 항목)인지 먼저 배제한다.

**2-8 live — 라이브 프로브 (2회 히트 규칙, live-verify.md)**
```bash
for u in https://monkos.ai/ https://monk.kr/ https://idphoto-kr.monkos.ai/ https://idphoto-jp.monkos.ai/ https://studio.monkos.ai/ https://image.monkos.ai/; do
  curl -s -o /dev/null "$u"                                          # 1차: 재검증 트리거 (판정 미사용)
  curl -s -o /dev/null -w "$u %{http_code} %{time_total}s\n" "$u"     # 2차: 판정
done
```
4xx/5xx는 🔴 후보 — 단 대조군(같은 호스트 다른 정상 경로) 1회로 조회 유효성부터 배제한다. 매팅(`matte.monkos.ai`)은 4060 의도적 비가동(530=정상)이라 프로브하지 않는다.

### 3. 산출 — 브리핑 1부
경로는 프롬프트가 지정한 것(`BRIEFING_E2E_{YYYYMMDD}.md` 또는 `BRIEFING_LOCAL_{YYYYMMDD}.md`).

```markdown
---
type: briefing
date: YYYY-MM-DD
generated: auto (iMac/민아 헤드리스 — mk-mina-brief.sh)
device: iMac
agent: 민아
status: 마감
---

**[YYYY-MM-DD HH:MM KST]** iMac/민아(헤드리스) → 작가님

# E2E 데일리 종합보고 YYYY-MM-DD (iMac 로컬·인프라 축)

> ⚠️ 메일 축 미점검(웹 루틴 일시정지) — 고객 환불 등 법정 기한 메일은 작가님 직접 확인.
> 원장: 열린 N건 · 오늘 resolve N · open N · note N

## 🔴 긴급
## ⏸️ 정체 (3일+)
## 📋 어제 TODO 결과
## ✅ 오늘 TODO
## 📅 일정·메일        ← "미점검(헤드리스 — 커넥터 없음)" 1줄
## 📊 지표             ← 갱신일만 해석. 데이터 미갱신이면 "갱신 없음" 1줄
## 🔧 순찰             ← 축 2-1~2-8. 정상 축은 1줄씩
## 📌 승계             ← 원장 열린 항목. [나이 / 막힌 지점 / 다음 1수]
```

규율 (PROPOSAL_20260813 9원칙):
1. 정상 항목은 한 줄. 이상만 문장으로.
2. 모든 긴급·승계 항목에 `[확정|추정|미확인]` 확실성 + 영향범위.
3. 인프라 이상은 의도적 비가동 가능성을 배제한 뒤 장애로 판정.
4. 0건·404는 대조군 1회로 조회 유효성부터 배제.
5. 지표는 data_date가 갱신된 날에만 해석.
6. 승계는 같은 설명 반복 금지 — [나이 / 막힌 지점 / 다음 1수].
7. 3일+ 미실행은 ⏸️ 정체로 분리하고 결정 택1을 요구.
8. 새 TODO 앞에 전날 TODO(전날 브리핑 ✅)의 실행 여부를 먼저.
9. 법정 기한 고객 요청은 🔴 (헤드리스는 메일을 못 보므로 원장·세션 로그에 드러난 것만).
- 분량 1장. "되는 것만" 기재(헌법 2조 3항 — 에러 묵과 금지). 점검 불가 축은 불가 사유와 함께.

### 4. 마감
1. 세션 로그 `monkos-ops/ops/sessions/YYYY-MM/YYYY-MM-DD_iMac_민아-헤드리스.md`에 1항목 어펜드(없으면 YAML frontmatter로 생성): 헤더 `**[시각]** iMac/민아(헤드리스) → 작가님`, 실행 ID, 산출 경로, 원장 이벤트 수, 점검 불가 축.
2. 출력 직전 자기 점검: 산출물에 시크릿 값 형태(`AIza…`, `sk-…`, `-----BEGIN`, 봇 토큰 형태)가 없는지 `git diff --cached | grep -E` 로 확인.
3. `git add <산출 브리핑> monkos-ops/ops/briefings/LEDGER.jsonl <세션 로그>` → `git commit -m "[briefing] YYYY-MM-DD iMac민아 헤드리스 로컬축 보고"` (ch6 형식, 공동저자 줄 불요). **push 금지.**
4. 마지막 출력은 1줄: `✅ 브리핑 {경로} · 원장 resolve N/open N/note N · 점검 불가 {축 목록 또는 없음}`.
