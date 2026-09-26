---
type: order
date: 2026-09-26
from: iMac/쌍아
to: iMac/막내3
subject: "monk.kr 버튼 배포 v2.1 구현 — 워크플로·알림·CI·secret.sh·package.json (ch5 1조 개정 집행)"
status: 발행
portfolio: PF_KKU
---

# 지시서 — monk.kr 버튼 배포 v2.1 구현

**[2026-09-26 16:02 KST]** iMac/쌍아 → iMac/막내3

> 근거: ch5 1조·6조 개정(09-26 발효, PETITION_20260924 삼권심사 만장일치 v2.1 + 작가님 승인)
> 설계 정본: `monkos-ops/ops/reports/2026-09/REVIEW_20260926_iMac쌍아_심사종합_PETITION20260924.md` §3·§4·§5-2·§5-3·§8
> 배정 사유: 사법 심사역으로 워크플로 실행 이력·wrangler 소스·checkout 롤백 전제를 직접 실측했다
> 이 지시서 완료 = ch5 1조 **부칙** 해소(4·5·7·10항 기계 집행 발효)

## ⚠️ 준수 조항

- **프로덕션 배포 금지 (ch5 1조 3항 · ch1 7조 2항).** `gh workflow run deploy-monk-kr.yml` 실행·Run 버튼·`wrangler pages deploy` 전부 금지. 워크플로 검증에 실배포가 필요한 시점에서 **멈추고 작가님께 버튼 실행을 요청**한다(아래 「검증 단계」). 같은 응답 안에서 만든 승인은 승인이 아니다.
- **헌법 4조 1항**: 시크릿 값 조회·출력·생성 금지. `gh secret list`(이름·메타)·`secret map`만 허용.
- **헌법 3조 1항**: 타임스탬프는 `date` 실측. **3조 2항**: COMPLETION 파일 + 세션 로그 + PF_KKU 1행 + 커밋·푸시.
- **커밋은 경로 명시 add** (09-26 병렬 `add -A` 사고). 롤백 단위 = 커밋 — A-1~A-4를 **각각 별 커밋**으로.
- **무음 강등 금지** (ch5 6조): 건너뛰는 검사는 그 사실을 출력한다.
- **0건·404 ≠ 부재 / 200 ≠ 존재**: 판정에는 양성·음성 대조군.

## Part A — 즉시 (부칙 해소분)

### A-1. `.github/workflows/deploy-monk-kr.yml`

1. **사유 서식 검증 스텝 — 배포 스텝보다 앞.** `{주체} | {승인 수신 시각} | {사유}`. 승인 시각 = `YYYY-MM-DD HH:MM` 또는 `직접`. 불일치 시 exit 1 + 기대 서식 출력.
2. **`sha` 선택 입력** + checkout `ref: ${{ inputs.sha || github.ref }}` + **`fetch-depth: 0`** (기본 shallow면 임의 SHA가 러너에 없어 롤백이 첫 사용에서 실패 — 본인 부대 의견 ②).
3. **wrangler 버전은 `package.json`에서 읽는다** — `npm install -g wrangler@4.66.0` 하드코딩 제거. 방식은 재량(`npm ci` 후 `npx wrangler` 등). 09-24 1차 실패 원인(npm 11 npx 자동설치 거부)이 재발하지 않는 방식일 것.
4. **배포 직후 `$GITHUB_STEP_SUMMARY`**에 "배포 반영됨 — SHA·URL·사유" 기록(스모크 결과와 분리). 스모크 실패 시 "배포는 완료됨 — 롤백 판단 필요" 명시 출력 (1조 8항).
5. **콘텐츠 어서션** — `MONK_kr/smoke_assert.txt` 신설(`monkos_AI/portal/edge/smoke_assert.txt` 선례 형식). 배포 고유 URL에 대해 경로별 필수 문자열 검사. 파일 부재 시 "어서션 스킵(파일 부재)" 명시 출력. 어서션 항목은 **음성 대조군**(미존재 경로의 fallback index)으로는 통과하지 않는 문자열로 고른다 — 선정 근거를 COMPLETION에 기록.
6. **6조 게이트 1~5 비적용 사유 주석 1행** (6조 서문 신규 의무의 첫 이행 — 막내1 이의).

### A-2. 배포 대기 알림 — 신규 `.github/workflows/notify-monk-kr-pending.yml`

- `on: push` (branches: main, paths: `MONK_kr/**`, `functions/**`) → 기존 `notify.yml`(workflow_call) 호출.
- 메시지: 변경 커밋 SHA·파일 수·"배포 대기 — 버튼: Actions > Deploy monk.kr". **배포 스텝 절대 포함 금지** (1조 1항).

### A-3. `.github/workflows/governance-check.yml`

- **C11**: 순회 대상에 배포 워크플로 추가 **또는** 출력을 "배포 게이트 정적 검사 통과 (deploy.sh N본 — 배포 워크플로 미검사)"로 교정. 택1, 사유 COMPLETION 기재 (막내1 이의).
- **C13 신설**: `wrangler pages deploy` 또는 `deploy.sh` 호출을 **포함한** 워크플로에 `push`·`schedule`·`repository_dispatch` 트리거 존재 시 `::warning::`. **파일명 매칭 금지 — 내용 기준** (본인 부대 의견 ④). A-2 알림 워크플로가 오탐되지 않는지 확인.
- **C14 신설**: 배포 루트(`MONK_kr/` 등 작업 트리 직접 업로드 경로) `git ls-files --others --ignored --exclude-standard` 스캔 → 0건 아니면 `::warning::` + 목록. 빌드 산출물(`dist/`) 제외 목록 관리. **`core.quotePath=false`** 필수(한글 경로 무음 스킵 선례). 비블로킹.

### A-4. 코드 2건

- `scripts/secret.sh:301` — pathspec에 `'*.yml'` 추가. 대조군: `secret map CF_PAGES_DEPLOY_TOKEN` 소비처에 워크플로가 나타나야 한다.
- `scripts/secret.sh:161` — 오안내 교정. 문안은 막내2 행정 의견서 §2-3 교정안 그대로(인벤토리 수기 필수 + GitHub Actions 값은 `gh secret set` 별도).
- `package.json:7` — 비정본 `deploy` 스크립트 삭제 또는 1조 6항 표준 명령으로 정본화(택1). `:10` wrangler `^4.66.0` → **`4.66.0` 정확 고정**. lock 파일 정합 확인.

## Part B — 14일 내 (10-10까지)

- `scripts/tools/secret_patrol.sh` — `gh secret list --json name,updatedAt` 스냅샷(값 미접촉) + SECRET_INVENTORY 만료일 **열** 신설 + **D-30 경고**.
- `monkos-ops/ops/SECRET_INVENTORY.md` §3 GitHub Secrets **전수 보정** — 실측 26건 중 등재 13건(09-26 쌍아가 #45·#46 반영 후). 이름·용도·등록일만, 값 금지.
- governance-check **C10** — 무스탬프 파일 `continue` 무음 스킵을 명시 출력으로 전환, 또는 `.claude/rules/references.md`에 `> source:` 스탬프 부여(택1).

## 검증 단계 (Part A 커밋·푸시 후)

1. **비배포 검증 먼저**: governance-check는 push/PR로 돈다 — 결과 확인. A-2 알림은 `MONK_kr/` 변경 푸시 시 실제 발송되는지 확인(`smoke_assert.txt` 신설 커밋이 자연 트리거).
2. **배포 검증은 작가님 버튼**: 여기서 멈추고 작가님께 요청 — "Actions > Deploy monk.kr > Run workflow, reason = `작가님 | 직접 | v2.1 첫 검증`". 음성 검증(잘못된 서식 → 배포 전 exit 1)도 작가님 실행 1회로 요청 — 이것은 배포 스텝에 도달하지 않는다.
3. 결과 판정: 스텝 단위 확인 + STEP_SUMMARY + monk.kr **2회 히트** 대조(판정 방법 병기).

## 산출물

- 커밋 A-1~A-4 (각 1커밋) + `MONK_kr/smoke_assert.txt`
- `monkos-ops/ops/reports/2026-09/COMPLETION_20260926_iMac막내3_KKU_monkkr버튼배포_v21구현.md` — 변경 파일·커밋·검증 run ID·판정 방법·어서션 선정 근거
- `.claude/rules/references.md` 도구 맵 `deploy-monk-kr.yml` 행의 "콘텐츠 어서션은 v2.1 지시서 구현 중" 문구를 구현 완료로 갱신 (3요건 #3 실패 가시화 충족 기록)

## 완료 기준

- [ ] A-1 1~6 / A-2 / A-3 C11·C13·C14 / A-4 3건
- [ ] 작가님 버튼 검증 1회 성공 + 서식 불일치 음성 검증 1회(배포 전 차단)
- [ ] monk.kr 2회 히트 판정 병기
- [ ] COMPLETION + 세션 로그 + PF_KKU 1행 + 커밋·푸시
- [ ] Part B는 10-10까지 별도 COMPLETION 또는 동 파일 추기

## 커밋 메시지

`[ops] monk.kr 버튼 배포 v2.1 — {A-n 항목}` (A-1~A-4 각각)
