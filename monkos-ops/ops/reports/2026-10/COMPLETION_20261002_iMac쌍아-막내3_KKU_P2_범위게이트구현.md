---
type: completion
date: 2026-10-02
from: iMac/쌍아-막내3
to: iMac/쌍아
device: iMac
agent: 쌍아-막내3
subject: P2 — monk.kr 버튼 배포 범위 게이트(G-K) 구현 + notify.yml 주입 차단 (브랜치 kku-scope-gate, main 미머지)
status: 완료
portfolio: PF_KKU
---

# COMPLETION — P2 범위 게이트 구현

**[2026-10-02 19:32 KST]** iMac/쌍아-막내3 → iMac/쌍아

> 지시서: `ops/orders/2026-10/ORDER_20261002_iMac쌍아_쌍아-막내3_KKU_P2_범위게이트구현.md`. 출처는 작가님 19:18 개정 결정이며, 민아 세션로그 :376·386에서 원문을 대조했다.

## 결과
- **브랜치 `kku-scope-gate` = `dd3bf9f1`** (origin과 SHA를 대조해 확인). main에는 머지하지 않았다. 워크플로 실행·dispatch는 0회다.
- 변경 3파일:
  - `.github/workflows/deploy-monk-kr.yml` +109
  - `.github/workflows/notify.yml` ±4
  - `scripts/tools/kku_scope_gate.py` 신설 (Python 3.9 호환)

## 구현 대조 (지시서 §2)
| # | 요건 | 구현 |
|---|---|---|
| 1 | `approver` | `choice` 입력 [작가님, 꾸], 기본값 작가님 |
| 2 | ref 고정 | `github.ref==refs/heads/main`이고 target이 `origin/main`의 조상일 때만 통과. 아니면 차단 |
| 3 | base | **1순위**: 직전 실제 배포 run의 기록이다. 아티팩트 `deploy-record`를 먼저 보고, 없으면 실행 로그의 `배포 커밋:` 줄과 wrangler의 `Deployment complete!`가 **둘 다 있어야** 배포로 인정한다. 배포 전에 실패한 run은 건너뛴다. **2순위**: CF API `canonical_deployment`(stage가 success인 것만)다. 다음은 모두 차단한다: 부재·불일치·비조상·diff 0건 |
| 4 | diff 범위 | `MONK_kr/ functions/ .github/ package.json`, `--no-renames` |
| 5 | R1~R8 | 2판 그대로다(R2는 `.js` 제외, R8은 100). **§7-3 구현함**: 추가된 줄이 target 시점의 기존 `<script>` 블록 안이면 R5로 본다. JSON-LD(`application/ld+json`) 블록은 실행되지 않는 데이터라 제외했다(새로 여는 `<script` 줄은 그대로 R5) |
| 6 | 흔적 정합 | 꾸 서식 정규식을 검사한다. `approver=작가님`인데 주체에 '꾸'가 있으면 차단한다. 승인자와 무관하게 적용한다 |
| 7 | 롤백 | `sha`는 직전 run이 꾸 run이고 그 run이 기록한 base와 일치할 때만 허용한다. 그 밖은 차단한다 |
| 8 | 사후 알림 | 별도 job `notify`(`uses notify.yml`, `if: always() && deployed=='1' && approver=='꾸'`). 서식은 §3.5에 `· 배포 job {result}`를 덧붙였다. 사유는 HTML로 이스케이프한다. **notify.yml은 `MESSAGE` env 경유로 바꿨고**, 입력 이름이 같아 기존 호출처(`notify-monk-kr-pending.yml`)와 호환된다 |
| 9 | 판정 표·주석 | STEP_SUMMARY에 판정·base·target·조건·파일·줄을 남긴다. 헤더 주석에 발효 시 문안을 `(발효 전)`으로 준비했다 |
| 10 | 스크립트 분리 | `kku_scope_gate.py`: `--dry-run BASE TARGET` / `gate` / `resolve-run` / `resolve-cf`. 러너는 이 스크립트를 **`github.sha`에서 꺼내** 실행한다(롤백 대상 커밋에 스크립트가 없어도 판정이 돈다) |

- 작가님 경로 회귀 방지:
  - `approver=작가님`이면 G-K를 적용하지 않는다(흔적 정합만 본다).
  - 판정 불가(rc 2)가 나면 경고를 남기고 진행한다. 스크립트가 없을 때도 경고 후 진행한다.
  - 꾸 경로는 rc 0만 통과한다.

## 판정 표 — 로컬 실증 (실제 커밋 쌍)
| 사례 | 입력 | 결과 |
|---|---|---|
| 양성 문구 | `5cf1d232^..` | ✅ 범위 안 |
| 양성 사진 | `03abe4ed^..` (길안내 사진) | ✅ 범위 안 |
| 양성 가격 | `f271b6ca^..` | ✅ 범위 안 |
| 양성 실구간 (gate) | `bd6d7a5..1ecf68c` | ✅ rc 0 |
| 음성 R1 | `8f606ab7` b2b | ❌ R1 |
| 음성 R4 | `ebee4eb9` 견적 양식 | ❌ R4 `<form`·`<input` |
| 음성 R5 인라인·블록 내부 | `7acf53f3` | ❌ R5 `<script` 70행 + 기존 블록 내부 456·457행 |
| 음성 R6 동일 CDN 신규 경로 | `7acf53f3` | ❌ R6 `cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/…` (1차 심사 때 거짓 음성이던 건) |
| 음성 R7 | `389f0884` print 폰트 | ❌ R7 |
| 음성 base 부재 | run 또는 CF 한쪽 없음 | ❌ 차단 (2건) |
| 음성 Idle 최상단 base | CF=21eaa578(실측 최상단 Idle) | ❌ 불일치 차단 |
| 음성 diff 0건 | base=target | ❌ 차단 |
| 음성 비main ref | `refs/heads/kku-scope-gate` | ❌ 차단 |
| 추가 음성 | 비main target · headSha 오용 · 흔적 2종 · 롤백 2종 | ❌ 전부 차단 |
| 추가 양성 | 꾸 롤백(직전 꾸 base) · 작가님 경로 | ✅ rc 0 |
| **실대기 구간** | `ad8f9a09..origin/main` (`c69eb186` 포함) | ❌ **R4 6 · R5 53 · R7 1 — 기대값(R4·R7) 충족** |

- **base 산출 실측**:
  - `resolve-run`은 run 36994859500에서 `ad8f9a09`를 반환했다. 이 run의 `headSha`는 `f7851335`라서, headSha를 썼다면 base가 틀렸을 것이다.
  - 로컬 wrangler 목록은 25건 중 Idle 23건이고 최상단은 `21eaa57`(Idle)이다. Idle이 아닌 최신은 `ad8f9a0`(fe1a639a)로, run 기록과 일치한다.
- **30일 커밋 120건 재대입**: 통과 75, 차단 45. 차단 사유별로는 R5 33, R6 12, R7 5, R4 4, R1 4, R2 3, R3 1이다(중복 있음).
  - 1차 심사 시뮬레이션(105/116)보다 통과가 줄었다. R5 기존 블록 규칙(§7-3)과 R6 URL 단위 판정 때문이다.
  - R5는 지도 핀 좌표·placeholder 문구처럼 `<script>` 안의 문자열을 수정한 경우에 걸린다.
  - R6는 네이버 지도 등 신규 외부 링크에 걸린다.
  - 거짓 양성은 감수 방침(§3.2)이다. 범위 안 비율은 커밋 기준 약 62%다.
- 문법:
  - `actionlint`가 설치돼 있지 않다. 설치는 승인 대상이라 하지 않았다.
  - YAML 파싱은 2파일 OK다. 전체 `run:` 스텝을 `bash -n`으로 돌려 10/10 OK다(표현식은 치환).

## 미구현·미실증
1. **`resolve-cf` 미실증**: 로컬에 CF API 토큰이 없다(시크릿 접촉 금지). 필드 경로 `canonical_deployment.deployment_trigger.metadata.commit_hash`와 `latest_stage.status`는 문서에 근거한 것이다. 실패하면 빈 값 → base 부재로 **차단(fail-closed)**된다. 확인은 발효 직전 run 1회로 한다.
2. **러너 동작 미실증** (지시서 §3에 따라 dispatch를 금지했다): `gh run download` 아티팩트 경로, job outputs가 실패한 job에서도 전달되는지, `inputs.approver`를 job `if`에서 평가하는지. 쌍아가 계획한 승인 1회 run에서 꾸 경로 차단 1건과 작가님 경로 1건을 함께 확인할 것을 권한다.
3. **작가님 run 지연**: 매 run마다 `resolve-run`이 직전 run의 아티팩트와 로그를 조회한다. 로컬에서 약 3초였다.
4. **헤더 주석 :5 교체**는 발효 시에 한다(준비만 해 두었다).

## 📁
- 브랜치 `kku-scope-gate` `dd3bf9f1`: `.github/workflows/deploy-monk-kr.yml` · `.github/workflows/notify.yml` · `scripts/tools/kku_scope_gate.py`
- 사전 점검: `python3 scripts/tools/kku_scope_gate.py --dry-run <직전 배포 커밋> origin/main` (M2 쌍아 편의용이며 판정이 아니다)

---

## §A 후속 — 꾸 경로 스위치 (ORDER_20261002 …스위치·교차검증 §A)

**[2026-10-02 19:36 KST]** iMac/쌍아-막내3 → iMac/쌍아

- **브랜치 `kku-scope-gate` = `5a302d97`** (origin과 SHA를 대조해 확인). main에는 머지하지 않았다. dispatch는 0회다. 변경 파일은 `deploy-monk-kr.yml` +17이다.
- 구현:
  1. 워크플로 최상단에 `env: KKU_PATH_ENABLED: "false"`를 두고, 주석으로 "ch5 1조 부칙(승인·미발효) — 발효 시 쌍아가 true로"를 달았다.
  2. G-K 스텝은 판정을 끝까지 실행하고 STEP_SUMMARY 표를 남긴다. 그 뒤 `approver=꾸`이고 스위치 값이 정확히 `"true"`가 아니면, **rc와 무관하게** `exit 1`로 끝낸다. 메시지는 "꾸 경로 미발효(ch5 1조 부칙) — 판정 결과는 위 표"다.
  3. **2중 잠금**:
     - `CF Pages 배포` 스텝에 `if: inputs.approver != '꾸' || env.KKU_PATH_ENABLED == 'true'`를 달았다.
     - 반영 기록·아티팩트·스모크 스텝은 `if: steps.cf.outcome == 'success'`일 때만 돈다. 배포 스텝을 건너뛰었으면 "배포됨" 기록이 남지 않는다.
  4. 사후 알림 job은 `needs.deploy.outputs.deployed == '1'`을 조건으로 한다. `deployed`는 `mark` 스텝에서만 설정되고, 그 스텝은 cf가 성공했을 때만 돈다. 스위치가 꺼져 있으면 값이 비어 있으므로 **알림이 구조적으로 나가지 않는다.**

**스텝 순서·`if` 대조 (스위치 off · approver=꾸)**
| # | 스텝 | if | 결과 |
|---|---|---|---|
| 0~2 | 사유 서식 · checkout · 정본 확인 | success | 실행 |
| 3 | **범위 게이트 G-K** | success | 판정·표 기록 → **exit 1** (1차 잠금) |
| 4~5 | setup-node · wrangler 설치 | success | 건너뜀 (앞 스텝 실패) |
| 6 | **CF Pages 배포** | `approver!='꾸' \|\| 스위치=='true'` | 건너뜀 (앞 스텝 실패 + 식 false, 2차 잠금) |
| 7~9 | 반영 기록 · 아티팩트 · 스모크 | `steps.cf.outcome=='success'` | 건너뜀 |
| 10 | 롤백 고지 | failure() | 실행 — `DEPLOYED` 미설정 → "배포 스텝 이전 실패 — 라이브 미반영" |
| job | notify | `always() && deployed=='1' && 꾸` | 건너뜀 (`deployed` 빈 값) |

**로컬 실증** (G-K 스텝 `run:` 블록을 추출해 bash로 실행. `${{ }}`는 env로 대체, gh 조회는 실제, CF 토큰 없음):
| approver | 스위치 | 판정 rc | 스텝 exit |
|---|---|---|---|
| 꾸 | `false` | 1 (실판정) | **1** + 미발효 메시지 |
| 꾸 | 미설정 | 1 | **1** |
| 꾸 | `false` | **0 (강제)** | **1** ← 판정 통과여도 차단 |
| 꾸 | `TRUE` | 0 (강제) | **1** (셸 비교는 대소문자 구분) |
| 꾸 | `true` | 0 (강제) | 0 (발효 후 동작) |
| 작가님 | `false` | 0 | 0 (회귀 없음, "비적용" 표) |

- 문법: YAML 파싱 OK. `bash -n`으로 전 스텝 10/10 OK.
- 💡 GitHub 표현식의 문자열 비교는 **대소문자를 구분하지 않는다**. 그래서 스위치가 `TRUE`이면 6번 스텝의 `if`는 참이 된다. 하지만 1차 잠금(셸, 정확히 `"true"`)이 막으므로 배포에 도달하지 않는다. 발효 시 값은 소문자 `true`로 적어야 한다.

---

## §B 반영 — 막내4 교차 검증 조건부 합격분 (REVIEW_20261002_iMac쌍아-막내4_KKU_P2_교차검증)

**[2026-10-02 19:44 KST]** iMac/쌍아-막내3 → iMac/쌍아

- **브랜치 `kku-scope-gate` = `efbf810c`** (origin과 SHA를 대조해 확인). main에는 머지하지 않았다. dispatch는 0회다.
- 변경: `kku_scope_gate.py`와 `deploy-monk-kr.yml`.

| 항목 | 반영 | 실증 |
|---|---|---|
| **K1 필수** R5 이벤트 속성 | `(?:^\|[\s/"'])on\w+\s*=` | 음성 3건 모두 R5로 차단: `<svg/onload=…>` · `<img src="a.png"/onerror="x()">` · 줄 첫머리 `onclick=…`. 회귀: `<img src=x onerror=y>`는 계속 탐지된다. 오탐 대조 `class="online"`·`data-on=1`은 탐지되지 않는다 |
| **K2 필수** wrangler 설정 | `SCOPE`와 R3에 `wrangler.toml`·`wrangler.json`·`wrangler.jsonc` 추가 | 음성: `wrangler.toml` 변경 → R1·R3으로 차단 |
| (a) 로그 폴백 한정 | `\t정본 확인\t…배포 커밋:`과 `\tCF Pages 배포\t… ✨ Deployment complete! Take a peek over at https://…monk-kr.pages.dev`를 **해당 스텝 줄에서만** 찾는다 | 양성: run 36994859500 → `ad8f9a09` 유지. 음성: `사유 서식 검증` 스텝 줄에 두 문구를 넣은 위조 로그 → 배포로 인정되지 않음 |
| (b) 롤백의 롤백 | record에 `kind=rollback\|forward`(sha 입력 여부)를 남긴다. `resolve-run`이 kind를 전달하고, 직전 run이 `rollback`이면 꾸 롤백을 차단한다 | 음성: `--run-kind rollback` → "❌ 차단 (롤백의 롤백)". 기존 롤백 양성·음성 2건은 그대로다 |
| ③ 흔적 미검사 명기 | 작가님 경로에서 rc 2로 진행할 때 경고와 요약에 "**흔적 미검사**(주체 '꾸' 검사 생략)"를 남긴다 | 시뮬레이션에서 문구가 나오는 것을 확인 |

- 음성 시험 방법: 임시 인덱스와 `commit-tree`로 **매달린 커밋**을 만들었다. 브랜치·작업트리·main은 건드리지 않았다.
- 회귀:
  - gate 사례 16건(기존 15 + 롤백의 롤백)이 모두 기대값대로 나왔다.
  - 30일 커밋 120건 재대입 결과는 통과 75 / 차단 45로, §1과 같다. K1 확장으로 생긴 신규 오탐은 0이다.
  - 스위치 시뮬레이션 6건도 기대값대로다.
- 문법: `ast.parse` OK, YAML OK, `bash -n` 10/10.
  - 💡 K1 정규식을 처음 넣을 때 raw 문자열 안의 `'` 때문에 **SyntaxError**가 났다. 커밋 전 파싱 검사에서 잡아 문자열을 분할해 고쳤다.
  - 그 상태로 러너에 올라갔다면 꾸 경로는 rc 2로 차단되고, 작가님 경로는 rc 2 경고 후 진행했을 것이다(fail-closed는 유지).
