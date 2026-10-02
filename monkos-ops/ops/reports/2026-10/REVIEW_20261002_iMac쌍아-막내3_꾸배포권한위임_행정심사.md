---
type: review
date: 2026-10-02
from: iMac/쌍아-막내3
to: iMac/쌍아
device: iMac
agent: 쌍아-막내3
subject: 꾸 배포 권한 위임 청구안(PETITION_20261002) — 행정 심사(집행 가능성 영향평가)
portfolio: PF_KKU
---

# REVIEW — 꾸 배포 권한 위임 · 행정 심사

**[2026-10-02 17:05 KST]** iMac/쌍아-막내3 → iMac/쌍아

## ① 판정
**조건부 찬성.** 범위 게이트는 집행할 수 있다. 다만 §3.1 base를 1순위(CF 목록)대로 구현하면 게이트가 **빈 diff로 통과**한다(거짓 음성). 이 결함을 C1로 고쳐야 한다.

## ② 쟁점별 의견
- **J1 동의**: 러너 판정이 옳다. 단, base 산출과 diff 범위를 C1·C2로 고정한다.
- **J2 동의**: P1 선결에 동의한다. 근거: `prompt_submit.py:17`의 정규식 `(배포…){0,20}승인`은 입력의 출처를 구분하지 않는다.
- **J3 동의**: 누적분을 1회에 배포하므로 범위 밖 커밋이 1건만 끼어도 그 구간 전체가 작가님 경로로 간다. 실측 효과는 구간 기준 4/10이다(③-2).
- **J4 조건부(C5)**: 지금 설계로는 스모크가 실패하면 알림이 나가지 않는다. 메시지 주입 경로도 있다.
- **J5 동의**: "직전 base"는 C1과 같은 출처에서 구해야 한다. run의 `headSha`는 쓰면 안 된다(③-1).
- **J6 동의**.
- **J7**: 행정 관점에서 이의 없다(입법 심사 소관).

## ③ 발견 사항

**③-1 base 산출 (§3.1) — 1순위를 그대로 쓰면 거짓 음성**
- 실측 1: `npx wrangler pages deployment list --project-name monk-kr --environment production --json`
  - 최신 행부터 `488caea`·`1ecf68c`·`5cf1d23`·`4722815`·`8546c8a`·`067718d`·`68780e2`·`50f5da7` 8건이 Production이고 `Status: Idle`이다.
  - 실제 배포(GH run 36978973497)는 그 아래 `bd6d7a5`(517e5d0d, "32 minutes ago")다.
  - `bd6d7a5`에는 Idle 행(ed3cb302)도 하나 더 있다.
- 실측 2: `curl https://00c1b993.monk-kr.pages.dev/`(488caea Idle)는 **404**, `https://517e5d0d…/`는 **200**이다.
- 해석: Idle 행은 Git 연동이 푸시마다 남기는 **빌드되지 않은 기록**이다. 자동 빌드가 꺼져 있어 내용이 없다.
- 결과: "Source 첫 행 = base"로 구현하면 base가 최신 푸시(= target)가 된다. diff가 0건이면 R1~R8이 공허하게 통과하고, **미배포 누적분이 검사 없이 전부 나간다.** 이것은 청구안의 fail-closed 가정과 정반대다.
- 2순위(직전 run)도 함정이 있다. `gh run list`의 `headSha`는 디스패치한 브랜치의 HEAD다. `sha` 입력(롤백)을 쓰면 실제 배포 커밋과 달라진다. 정확한 값은 run 로그의 `배포 커밋: …` 줄(`deploy-monk-kr.yml:76`)뿐이다.
- `--commit-dirty=true`: 러너는 clean checkout이라 Source가 정확하다. 예비 경로(로컬)로 배포했을 때만 내용과 Source가 어긋난다(§7-3 유지).

**③-2 R1~R8 대입 — 최근 30일 `MONK_kr/` 커밋 116건** (스크립트 시뮬레이션, diff 범위 `MONK_kr/ functions/ .github/`)
- 커밋 단위: 통과 105, 차단 11. 차단 사유는 R1 4 · R4 3 · R6 1 · R7 4(중복 있음).
- 실제 배포 구간 10개(직전 run → 다음 run): 통과 4, 차단 6.
  - 오늘 대기 중인 `bd6d7a5..1ecf68c`(4파일)는 **통과**한다.
- 정탐: `ebee4eb9`(견적 양식 R4), `10f5b4a` 구간 `retouch.html`(성함·전화·이메일 `<input>` 신설 R4), `27202bf7`(google.com iframe R6).
- 거짓 양성(감수 가능):
  - R7 경로 일괄 차단 3건: `389f0884`·`d5cb85c9`·`a903eea3`. `print.html`의 폰트·굵기·메뉴만 바꾼 변경이다.
  - R1 3건: `4c0682ac`·`321a9fc4`는 `MONK_kr/images/` 로고·파비콘이고, `8f606ab7`은 b2b 전화번호다.
- **거짓 음성 1 — R6 도메인 단위의 구멍**:
  - `7acf53f3`이 `cdn.jsdelivr.net/npm/maplibre-gl@4.7.1` **신규 서드파티 스크립트**를 추가했는데 통과했다. 같은 도메인이 base에서 이미 쓰이고 있었기 때문이다.
  - 같은 커밋이 JS 문자열로 `tiles.openfreemap.org`에 런타임 접속하는데, 이것도 R6 패턴 밖이다.
- **거짓 음성 2 — `.js` 변경**: 통과 105건 중 `.js`를 포함한 커밋이 2건이다. `a903eea3`의 `studio-header.js` +72행(`innerHTML` 조립)은 R5 패턴에 해당하지 않는다. K2(A: `.js` 제외) 판단 근거로 쓸 수 있다.
- **R8 문턱**: 실제 구간 `a203795..8f606ab`는 190파일이었다. 200 미만이라 R8로는 통과하고, 다른 R에서 차단됐다. ch1 7조 예시 "100건+"와 맞추려면 100이 정합한다.

**③-3 notify.yml 재사용 (§3.5) — 가능. 단 2건 수정 필요**
- 호출 형식은 선례(`notify-monk-kr-pending.yml` 마지막 job: `uses` + `secrets: inherit`)를 그대로 쓸 수 있다.
- 결함 1: 별도 job은 기본값이 `needs: deploy` 성공 시에만 실행된다. 배포 후 스모크가 실패하면 **배포는 됐는데 보고는 나가지 않는다.** "미보고 구조적 불가"가 성립하지 않는다.
- 결함 2: `notify.yml` 마지막 줄이 `"${{ inputs.message }}"`를 셸에 직접 치환한다. 메시지에 자유 텍스트인 사유(`reason`)를 넣으면 `$(…)`·따옴표로 주입이 가능하다. 그 러너에는 TELEGRAM 토큰 env가 있다. `deploy-monk-kr.yml:90` 주석이 금지하는 패턴과 같다.

**③-4 P1~P5**
- `guard_bash.py:55`는 `gh workflow run deploy-monk-kr`를 E10 승인 게이트로 막는다. 그래서 P4의 "무해 dispatch"도 승인 턴 1회가 필요하다.
- P4는 `gh auth status`(토큰 범위)와 `gh api repos/{o}/{r}/actions/workflows` 읽기로 대체할 것을 권한다.
- 비용: P1 소(훅 46행, 스모크 2건 추가), P2 중(스텝 1개 + base 산출 + 음성 대조군 7종), P3 작가님 승인 1회, P4 M2 읽기 2콜, P5 꾸 1턴.

## ④ 조건 (P2 판정 기준에 편입 요청)
1. **C1 base**:
   - CF 목록의 첫 행을 쓰지 않는다. 1순위는 CF API 프로젝트 객체의 `canonical_deployment`(또는 Idle을 제외하고 stage가 success인 최신 행), 2순위는 run 로그·산출물의 실제 배포 커밋이다. `headSha`는 금지한다.
   - 두 값이 다르면 차단한다.
   - **diff 0건은 통과가 아니라 차단**한다(0건 ≠ 부재).
   - P2 음성 대조군에 "base = Idle 최신 행" 케이스를 추가한다.
2. **C2 diff 범위**: 조문에 `MONK_kr/ functions/ .github/ package.json`을 명시한다. 이유는 둘이다. 워크플로는 디스패치된 ref의 파일로 실행되므로 게이트 자신을 약화하는 커밋도 같은 run에서 돈다. 그리고 `package.json`이 wrangler 버전의 정본이다.
3. **C3 R6**: 판정 단위를 도메인에서 **신규 URL(경로 포함)**로 바꾼다. 따옴표 안의 `https://` 리터럴 전체를 대상에 넣는다. 그렇게 하지 않을 거면 K2-A를 채택한다.
4. **C4 R8**: 전체 변경 문턱을 200에서 100으로 낮춘다(ch1 7조 정합).
5. **C5 사후 보고**:
   - 알림 job은 `if: always() && needs.deploy.outputs.deployed == '1'`로 건다.
   - `notify.yml`은 env 경유로 수정하는 것을 선행한다(작가님 경로 알림에도 이득).
6. **C6 순서**: P1 → P2(C1~C5) → P4(읽기 대체) → P3 → P5. 발효 전에 `bd6d7a5..1ecf68c` 같은 실제 대기 구간 1건을 드라이런해 STEP_SUMMARY 표를 확인한다.
