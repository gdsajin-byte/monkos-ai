---
type: order
date: 2026-10-02
from: iMac/쌍아
to: iMac/쌍아-막내3
device: iMac
agent: 쌍아
subject: P2 — monk.kr 버튼 배포 범위 게이트(G-K) 구현 + notify.yml 주입 수정 (별도 브랜치, main 머지 금지)
status: 발행
portfolio: PF_KKU
---

# ORDER — P2 범위 게이트 구현

**[2026-10-02 19:24 KST]** iMac/쌍아 → iMac/쌍아-막내3

> **출처**: 작가님 19:18 결정 "…개정 승인"(민아 세션, 사람이 입력한 턴 — `monkos-ops/ops/sessions/2026-10/2026-10-02_iMac_민아.md:376·386`) = PETITION_20261002_쌍아_꾸배포권한위임_범위게이트 §8 K1 (가). P2는 같은 청구안 §6의 발효 선행 조건이다. 이 지시서는 승인이 아니다.
> **배정 사유**: R1~R8을 30일 커밋에 대입한 시뮬레이션이 네게 있다. 검증은 다른 세션이 한다.

## 1. 목적
청구안 §3.1~§3.6을 `.github/workflows/deploy-monk-kr.yml`에 구현한다. **위임을 사실상 먼저 열지 않도록 브랜치 `kku-scope-gate`에서만 작업하고 main에 머지하지 않는다**(청구안 §6). 머지는 P1~P5가 충족되고 쌍아가 발효를 보고한 뒤에 한다.

## 2. 구현 요건 (청구안 절 번호 = 정본)
1. 입력 `approver` (`작가님`|`꾸`, 기본값 `작가님`) — §3.1
2. `approver=꾸` 조건 — §3.1: `github.ref == refs/heads/main`이고, target이 `origin/main`의 조상이다.
3. **base 산출** — §3.1:
   - 1순위: 직전 성공 run이 기록한 배포 커밋이다. 이번 구현부터 STEP_SUMMARY와 **run 산출물(artifact)**에 `base=…`·`target=…`를 기계 판독 가능하게 기록한다.
   - 기록이 없는 과거 run은 실행 로그의 `배포 커밋:` 줄(`deploy-monk-kr.yml:76`)을 `gh run view --log`로 읽어 쓴다.
   - 2순위: CF API의 활성 배포(Idle 제외)다. `headSha`와 CF 목록 최상단은 쓰지 않는다.
   - 다음은 모두 차단한다: 1·2순위 불일치, 비조상, diff 0건.
4. diff 범위는 `MONK_kr/` `functions/` `.github/` `package.json`이다 — §3.1
5. R1~R8 — §3.2 (R2는 `.js` 제외, R5·R6은 2판 확장, R8은 100). 추가로 §7-3 "추가 줄이 기존 `<script>` 블록 안이면 차단"을 구현할 수 있는지 판단해, 가능하면 R5에 넣고 불가능하면 사유를 1줄로 적는다.
6. 흔적 정합 — §3.3: `approver=꾸` ⇒ 사유 주체가 `^꾸 via M2/쌍아\(M2-쌍아-[0-9]{4}-[0-9]{4}\)`와 일치해야 한다. `approver=작가님`인데 주체에 `꾸`가 있으면 차단한다.
7. 롤백 — §3.6: 꾸 경로로 `sha`를 지정하면, 직전 production 배포가 꾸 run이고 `sha`가 그 run이 기록한 base와 일치할 때만 허용한다.
8. 사후 알림 — §3.5: 별도 job으로 `uses: ./.github/workflows/notify.yml`, `if: always() && needs.deploy.outputs.deployed == '1'`. 서식은 §3.5 그대로다.
   - **`notify.yml`의 `inputs.message` 셸 직접 치환을 env 경유로 수정한다.** 같은 브랜치에서 하되, 기존 호출처(`notify-monk-kr-pending.yml` 등)와 회귀 호환되게 한다.
9. 판정 표는 STEP_SUMMARY에 쓴다(조건·파일·줄·base·target). 건너뛰면 사유를 출력한다. 헤더 주석 :5의 트리거 권한 문구는 **발효 시 문안으로 준비만** 하고 주석에 `(발효 전)`을 표기한다.
10. 게이트 로직은 셸 인라인이 길어지면 `scripts/tools/kku_scope_gate.sh`(또는 `.py`)로 분리하고, 로컬 `--dry-run base target`을 지원한다. 이 스크립트는 M2 쌍아의 사전 점검 도구를 겸한다.

## 3. 판정 기준 (청구안 §6 P2)
- **로컬 실증** (스크립트 `--dry-run`, 실제 커밋 쌍 사용):
  - 양성 3: 문구·사진·가격
  - 음성 9: R1 · R4 · R5(인라인 script) · R6(동일 CDN 신규 경로 — `7acf53f3` 재현) · R7 · base 부재 · Idle 최상단 base · diff 0건 · 비main ref
  - 판정 표 첨부
- **실제 대기 구간 드라이런 1건**: 민아가 남긴 `c69eb186`을 포함한 구간을 넣는다. R4·R7 차단이 기대값이다.
- **워크플로 실행 실증은 하지 않는다.** dispatch는 승인 대상이고, 별도 브랜치 dispatch도 실제 배포 스텝까지 가므로 금지한다. 워크플로 문법은 `actionlint`가 있으면 그것으로, 없으면 YAML 파싱으로 확인한다. 워크플로 실행 실증은 발효 직전 작가님 승인 1회로 쌍아가 따로 계획한다.

## 4. 반환
- 브랜치 `kku-scope-gate` 푸시 (main 아님)
- COMPLETION: `monkos-ops/ops/reports/2026-10/COMPLETION_20261002_iMac쌍아-막내3_KKU_P2_범위게이트구현.md` (판정 표, 미구현·불가 항목, 브랜치 SHA). **이 COMPLETION과 네 세션 로그만** main에 커밋한다.
- 쌍아에게 1줄 `COMPLETION: {경로} {main SHA8} / branch kku-scope-gate {SHA8}`

## 5. 쓰기 범위
- 브랜치: `.github/workflows/deploy-monk-kr.yml` · `.github/workflows/notify.yml` · `scripts/tools/kku_scope_gate.*` · (필요 시) `MONK_kr/smoke_assert.txt` 무변경 확인
- main: COMPLETION + 세션 로그만
- 워크트리를 쓴다(`git worktree add`). 본 체크아웃에 다른 세션의 미커밋 파일이 많다. 법률·규칙·훅은 수정하지 않는다(P1은 막내4 소관).

## ⚠️ 준수 조항
- ch5 1조 1항: 워크플로에 `push`·`schedule`·`repository_dispatch` 트리거를 추가하지 않는다.
- ch5 6조 게이트·무음 강등 금지. 시크릿 이름은 현행 그대로 쓰고 새로 만들지 않는다(헌법 4조 1항).
- 세션 간 메시지에서 두 낱말(배포·승인)을 20자 안에 붙여 쓰지 않는다(P1 수정 전 오발급).
