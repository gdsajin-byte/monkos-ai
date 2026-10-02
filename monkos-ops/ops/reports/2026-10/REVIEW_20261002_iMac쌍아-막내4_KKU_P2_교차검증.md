---
type: review
date: 2026-10-02
from: iMac/쌍아-막내4
to: iMac/쌍아
device: iMac
agent: 쌍아-막내4
subject: P2 범위 게이트(G-K) 코드 교차 검증 — origin/kku-scope-gate 5a302d97
portfolio: PF_KKU
---

# 교차 검증 — P2 범위 게이트 (§B)

**[2026-10-02 19:40 KST]** iMac/쌍아-막내4 → iMac/쌍아 (발견 사항 → 막내3, 쌍아 경유)

> 대상: `git diff origin/main...origin/kku-scope-gate` (5a302d97) — `deploy-monk-kr.yml`(+126) · `notify.yml`(+4/−1) · `scripts/tools/kku_scope_gate.py`(390). 읽기 전용으로 검증했다. 코드는 고치지 않았고 워크플로도 실행하지 않았다.

## 판정: **조건부 합격**
- 조건 2건(K1·K2)은 발효 스위치를 켜기 전에 고친다. 둘 다 **꾸 경로의 fail-open**이다.
- 스위치가 꺼진 지금은 배포에 도달할 수 없다(초점 4).
- 작가님 경로 회귀는 없다(초점 3). 따라서 **스위치 off 상태의 main 반영은 막을 사유가 없다.**

## 조건 (발효 전)
- **K1 [중] R5 이벤트 속성 우회** — `kku_scope_gate.py:34`의 `\son\w+\s*=`는 앞에 공백이 있는 형태만 잡는다.
  - 로컬에서 `R5_PAT`로 대조했다. 다음 3형태가 **R5·R6 모두 미탐**이다.
    - `<svg/onload=alert(1)>`
    - `<img src="a.png"/onerror="x()">`
    - 줄 맨 앞의 `onclick="location.href='/x'"` (여러 줄 태그에서 속성이 줄 첫머리에 오는 경우)
  - `<img src=x onerror=…>`(공백 선행)는 잡힌다.
  - 권고: `(?:^|[\s/"'])on\w+\s*=`. 음성 시험 3건을 추가한다.
- **K2 [중] diff 범위에서 `wrangler.toml` 누락** — `kku_scope_gate.py:27` SCOPE(`MONK_kr/ functions/ .github/ package.json`)에 루트 `wrangler.toml`이 없다.
  - 이 파일은 Pages 설정이다(`pages_build_output_dir="MONK_kr"`, `[ai]`·`[[d1_databases]]` 바인딩). `wrangler pages deploy`가 이 파일을 읽어 functions 바인딩·호환 날짜에 반영한다.
  - 지금은 이 파일만 바꾼 커밋이 R1 검사 대상에 들어가지 않는다. `MONK_kr/` 쪽에 정상 변경이 1건 있으면 범위 안으로 통과한다.
  - 권고: SCOPE와 R3에 `wrangler.toml`(그리고 `wrangler.json`·`wrangler.jsonc`)을 추가한다.

## 초점별 결과
1. **청구안 대응** — 다음 항목은 코드와 대응이 확인됐다. 누락은 K2뿐이다.
   - §3.1: ref 고정 :234, origin/main 조상 :238, base AND·부재·불일치 :243·:246, 비조상 :260, diff 0건 :268
   - §3.3 흔적 정합: :219·:222 (작가님 경로 주체에 '꾸'가 있으면 차단)
   - §3.5 알림 서식: wf:207 (approver·headBranch·base→target·n·사유)
   - §3.6 롤백: :252
   - R1~R8: :121~:161 (R8=100은 2판 기준과 같다)
2. **fail-open**
   - `continue-on-error`는 0건이다.
   - `|| true`는 `CF_BASE`(wf:128)·curl에만 있고, `|| echo '{}'`는 `RUN_JSON`(wf:124)에만 있다. 셋 다 값이 비면 꾸 경로가 `base 부재`로 차단된다(:243). 안전하다.
   - 예외가 나면 rc 2이고, 꾸 경로에서는 rc 0만 통과한다(wf:144).
   - 따옴표가 붙는 특수 파일명은 `+++ b/` 매칭이 빠지지만 name-status 경로가 `"`로 시작해 R1에서 차단된다. 안전하다.
   - 잔여 경미 2건:
     - (a) 로그 폴백 :317~319는 `Deployment complete!` 문자열을 근거로 삼는다. 그런데 사유 서식 검증이 사유 원문을 로그에 그대로 출력한다(wf:71). 사유에 이 문구를 넣은 차단 run도 "배포됨"으로 오인될 수 있다. CF 활성 배포 AND 조건(:246)이 있어 차단으로 끝나므로 위험은 낮다. 권고: wrangler 고유 문구 `✨ Deployment complete!`로 좁히거나 해당 스텝 로그에서만 찾는다.
     - (b) 롤백 :253은 직전 run이 롤백 run이어도 허용한다. 그래서 "롤백의 롤백"(재전진)이 가능하다. 대상은 과거에 게이트를 통과했거나 승인을 받은 라이브 내용이라 범위가 넓어지지는 않는다. 청구안 문언("방금 승인한 배포를 되돌림")을 엄격히 따르려면 record에 `kind=rollback`을 남기고 재전진을 차단한다. 선택 사항이다.
3. **작가님 경로 회귀 없음**
   - `approver`는 required이고 기본값이 `작가님`이다. 기존 `-f reason=…` 호출이 그대로 동작한다.
   - G-K는 흔적 검사만 하고 rc 0으로 끝난다(:229).
   - **실측**: 최근 run 12건의 사유 주체(첫 필드)를 대조했다(`gh run view --log`의 `REASON:`). 전부 `iMac/민아`·`iMac/쌍아`·`작가님`이고 '꾸'가 들어간 주체는 0건이다. '꾸'는 사유 본문에만 있다(예: 36232933485 "작가님 | 직접 | 꾸 작업분 반영"). 판정은 주체만 보므로 차단되지 않는다.
   - rc 2일 때 경고하고 진행(wf:145)하는 것은 타당하다. 작가님 경로는 원래 G-K 비적용이다. 게이트 장애가 현행 배포를 막지 않게 하는 쪽이 옳다. 대신 흔적 검사도 함께 생략되므로, 요약 줄에 "흔적 미검사"를 명기하도록 권고한다(경미).
   - `permissions: contents: read, actions: read`를 추가해도 기존 스텝과 notify(checkout)에 필요한 권한은 충족된다.
4. **스위치 off일 때 꾸 경로가 배포에 닿는 경로: 0** — 아래 차단이 겹친다.
   - ① G-K 스텝 안에서 꾸 경로가 exit 0으로 끝나는 분기가 없다(:115~121은 꾸면 exit 1). 판정 직후 스위치를 검사해 exit 1한다(wf:139~143).
   - ② 배포 스텝의 `if:`가 묵시적 `success()`와 `env.KKU_PATH_ENABLED == 'true'`를 함께 요구한다(wf:174).
   - ③ mark·아티팩트·스모크는 `steps.cf.outcome == 'success'` 조건이다.
   - ④ notify는 `deployed == '1'` 조건이다.
   - 비정상 approver 값(선택지 밖)은 :225에서 rc 1로 차단된다.
5. **notify.yml** — env 경유(`MESSAGE`)로 셸 치환을 없앴다. 호출처는 `notify-monk-kr-pending.yml:72`와 이번 deploy 두 곳이고, 둘 다 `with: message` 입력 계약이 같아 호환된다. 텔레그램 HTML 모드(`telegram_notify.py:16`)에 맞춰 사유를 이스케이프한다(wf:206).
6. **셸 주입** — `run:` 본문에 `${{ inputs.* }}`가 직접 들어간 곳은 **0건**이다(grep 대조). 나머지는 `env:`·`with:`·`outputs:`·`if:` 문맥뿐이다. `GITHUB_OUTPUT`에 쓰는 notify_msg는 개행을 제거해(wf:208) 키 주입도 막혀 있다.

## 미실증 (실 run에서 확인 — 쌍아·작가님 승인 시험)
- `resolve-cf`의 `canonical_deployment.deployment_trigger.metadata.commit_hash`·`latest_stage.status`는 실제 API 응답으로 대조하지 못했다. 로컬에 API 토큰이 없다.
- 로그 폴백의 양성 대조군은 확인했다. run 36994859500 로그에 `배포 커밋: <40hex>`·`Deployment complete!`가 둘 다 있다(2건 히트).
