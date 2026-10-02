---
type: review
date: 2026-10-02
from: iMac/쌍아-막내4
to: iMac/쌍아
device: iMac
agent: 쌍아-막내4
subject: PETITION_20261002 꾸 배포 권한 위임(범위 게이트) — 사법 심사
portfolio: PF_KKU
---

# 사법 심사 — 꾸 배포 권한 위임 청구안

**[2026-10-02 17:05 KST]** iMac/쌍아-막내4 → iMac/쌍아

## ① 판정
**조건부 찬성.** 위임 방향과 J1~J7은 타당하다. 단 §3.1 base 1순위 출처가 실측상 **fail-open**(F1)이고, 게이트가 위조 방지가 아닌 실수 방지 장치라는 한계가 조문에 없다(F2). 이 둘 미해소 시 반대로 전환.

## ② 쟁점
- J1 러너 판정: **동의** — 단 C1(base 출처)·C2(main 한정) 부가.
- J2 승인 인정: **동의** — 단 P1 범위가 좁다. 부정문·오탐 발급(F3)과 게이트 정규식 우회(F4)까지 포함(C3·C4).
- J3 1승인 1트리거: **동의.**
- J4 사후 보고: **동의** — 알림 1줄에 `approver`·`headBranch`·base SHA 추가(C8).
- J5 롤백 한정: **동의** — 대상이 직전 라이브 커밋(이미 승인된 내용)이므로 우회 통로 아님. 단 "직전 base"도 C1 정의(Idle 제외)로 산출.
- J6 판단 분리: **동의** — 민아 주간 대조에 F2 탐지 2항 추가(C2).
- J7 헌법 정합: **동의** — CLAUDE.md 1조 2항 ④ 본문에 트리거 문구 없음(실물 대조). 법률 개정으로 족함.

## ③ 발견 사항
- **F1 [치명] base 1순위가 HEAD를 가리켜 범위 판정이 빈 diff로 통과한다.** 실측 `npx wrangler pages deployment list --project-name monk-kr --environment production --json` → 25건 중 **23건 `Status: Idle`**. 버튼 배포 이후 모든 커밋(`50f5da7`~`488caea`, 문서 전용 커밋 포함)이 Idle production 항목으로 생성된다(CF Git 연동이 빌드 없는 항목을 만듦). 대조군: Idle `00c1b993` → **404**, 실배포 `517e5d0d`(bd6d7a5, 버튼 run 36978973497) → **200**. "최신 production의 Source"를 base로 쓰면 base=main HEAD → base..target 공집합 → 게이트 통과 → 현재 대기 중인 `50f5da7` 이후 7커밋이 무검사로 나간다.
- **F2 [고] 게이트는 워크플로 파일 자신이 집행하며, 그 파일은 트리거 주체가 고칠 수 있다.** `workflow_dispatch --ref <브랜치>`는 그 브랜치의 yml을 실행한다. CF 시크릿은 저장소 수준(`gh secret list`: `CF_PAGES_DEPLOY_TOKEN`·`CF_ACCOUNT_ID`), environments 0개(`gh api …/environments` → 0), 브랜치 보호는 비공개 무료 플랜이라 불가(`…/branches/main/protection` → 403). 즉 게이트 없는 yml을 브랜치에 올려 `approver=꾸`로 돌릴 수 있다. §7-2(approver 위조)와 같은 계열인데 §7에 누락.
- **F3 [중] E10 발급 정규식이 부정문·무관어에도 토큰을 발급한다.** `prompt_submit.py:17` 로컬 대조: "배포 승인 안 함"·"배포는 승인하지 마"·"product 페이지 승인했어"·"승인 대기 중인 배포 목록 보여줘" → **4/4 True**. 꾸는 대화형 사용자라 "배포 승인은 내일" 같은 문장이 그대로 토큰이 된다. 세션 간 메시지 결함(§3.3)과 같은 뿌리.
- **F4 [중] `guard_bash.py:55` DEPLOY_GATE 정규식 우회.** 정적 대조로 다음 3형태가 **미매칭**(토큰 없이 실행됨): `gh workflow run -R gdsajin-byte/monk_project deploy-monk-kr.yml`(-R 선행) / `gh workflow run "Deploy monk.kr (CF Pages)"`(표시 이름) / `gh api -X POST …/workflows/deploy-monk-kr.yml/dispatches`.
- **F5 [중] R4~R6 패턴 공백.** 미탐: 인라인 `<script>` 신설(R6은 `<script src=`만), `on*=` 이벤트 속성, `javascript:` URL, `<meta http-equiv="refresh">`·`<base href>`·`<object>`·`<embed>`·`srcdoc`, 새 외부 도메인의 `<img src>`·`<a href>`, 프로토콜 상대 `//host`, SVG 내부 `<script>`·`on*`(R2가 `.svg` 허용). 기존 `fetch(` 줄을 두고 엔드포인트 상수 줄만 바꾸는 경우도 미탐(§7-1).
- **F6 [저] `.js` 파급.** `MONK_kr/monk_studio/studio-header.js`는 사진관 전 페이지 공유 헤더 — 1파일 변경이 사이트 전 동선을 바꾼다. 현재 `monk_studio/` 내 `fetch`·`XMLHttpRequest`·`sendBeacon` 사용 0건이므로 `.js` 제외로 잃는 정상 작업은 거의 없다.
- **F7 [저] L4 연쇄 누락.** `ch1:83` 권한표 "배포 | ❌ 트리거 | …(작가님)" 행이 L4(:74·:212)에 없다. `.claude/commands/kku-context.md:65` 실재 — L5 "(있으면)" → 확정.
- **F8 [저] M2 다중 세션 추적.** E10 토큰은 session_id 바인딩이라 타 세션 소비 불가. 남는 위험은 꾸가 비지정 세션에 입력하는 경우 — 사유 서식으로 감지 가능(C6). 팀원·서브에이전트 토큰 공유는 1회용 소각이라 피해 1회 한정 — 조문 집행 수용.

## ④ 조건
1. **C1** base = **실배포 production**: CF API 프로젝트 `canonical_deployment` 또는 `latest_stage.status=success`·비Idle 항목. P2 음성 대조에 "Idle 최신 항목 base 오판" 추가. base==target 또는 base가 target의 조상 아님 → fail-closed.
2. **C2** `approver=꾸`는 `github.ref == refs/heads/main` + target이 `origin/main` 조상일 것. 조문(L2)·§7에 "범위 게이트는 실수 방지 장치이며 워크플로·자격증명 공유 행위자의 고의 우회를 막지 못한다" 명기. 민아 주간 대조에 ① run `headBranch=main` ② run 커밋의 yml == main yml 2항 추가.
3. **C3** P1 확장: 승인 인정은 **턴 전체가 승인 문구**일 때만(예: 공백 제거 본문이 `배포승인`으로 시작 + 부정어 `안|말|하지|보류|대기|내일` 부재), `prod`는 단어 경계. smoke 음성에 F3 4문장 추가.
4. **C4** P1에 DEPLOY_GATE 우회 3형태(F4) 음성 smoke 추가 + 매칭을 `deploy-monk-kr`·`Deploy monk.kr`·`/dispatches` 포함 검색으로 전환. 꾸 경로 개통 전 필수 — 실질 통로다.
5. **C5** R5·R6에 F5 항목 추가. **K2 = A(`.js` 제외) 권고.** SVG는 추가 줄에 `<script`·`on\w+=` 있으면 ❌.
6. **C6** `approver=꾸`면 사유 `{주체}`가 `^꾸 via M2/쌍아\(M2-쌍아-[0-9]{4}-[0-9]{4}\)` 일치 필수, 역으로 `approver=작가님`인데 주체에 `꾸` 포함 시 차단(흔적 정합의 기계 확인 — 저비용).
7. **C7** L4에 `ch1:83` 추가, L5 kku-context 확정.
8. **C8** 사후 알림 서식에 `approver`·`headBranch`·`base sha8` 추가.
