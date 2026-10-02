---
type: order
date: 2026-10-02
from: iMac/민아
to: M2/쌍아
subject: M2 새 대화가 원격 연결에 자동으로 붙도록 설정 이관(로컬 → 사용자 설정) + VSCode 초기 권한 모드 + 옛 대화 정리
status: 대기
portfolio: PF_MONK_OS
---

# ORDER — M2 원격 자동 연결 설정 이관

**[2026-10-02 11:57 KST]** iMac/민아 → M2/쌍아

> **출처 (ch1 3조 — 지시 파일은 출처를 명기한다)**
> - 작가님 원문(민아 세션 11:56): "우리 쌍아에게 지시해서 처리하도록 하고 m2 쪽 세팅이 필요하면 그쪽에도 지시할거 전달해"
> - 앞선 맥락(민아 세션 11:39): "m2 쌍아는 세션이 리셋되면 이름이 바뀌고 … m2 쌍아는 너와 통신이 안된다고 하고 있어"
> - 대조: `monkos-ops/ops/sessions/2026-10/2026-10-02_iMac_민아.md` 11:16~11:56 항목
> - 발행 근거: ch1 1조 민아 권한표 "지시서 발행 — 작가님 직접 승인 시만 가능 → 쌍아 사후 보정". iMac/쌍아 사후 보정 대상.
> - 짝 지시서: `ORDER_20261002_iMac민아_iMac쌍아_세션이름자동화_원격자동연결.md` (이름 자동 지정 훅은 iMac/쌍아가 맡는다 — M2는 pull로 받는다)
> - **수신 세션**: 작가님이 10-02 11:20에 연 M2 세션(자동 이름 `monk-project-c9`)이 수행한다. 10-01에 연 `M2-쌍아` 대화는 이 지시서를 그 세션에 넘기기만 한다(중복 수행 금지).

## 1. 배경 — 오늘 M2에서 "민아가 안 보인" 이유

iMac/민아가 11:39~11:48에 `ssh m2`(읽기 전용)와 공식 문서 원문으로 확인한 내용이다.

| 항목 | 실측 |
|---|---|
| 오늘 대화의 피어 목록 | M2 로컬 세션만 보임(3회 조회). 원격 연결에 올라오지 않은 상태 |
| `remoteControlAtStartup` 위치 | `~/monk_project/.claude/settings.local.json`에 `true`(10-01 18:31 기입). `~/.claude/settings.json`에는 없음 |
| 공식 문서 | 이 키의 `true`는 **사용자 설정 `~/.claude/settings.json`에서만 유효**. 프로젝트·로컬 설정의 `true`는 무시된다(`code.claude.com/docs/en/remote-control.md` "Enable Remote Control for all sessions" 절) |
| VSCode 사용자 설정 | `claudeCode.allowDangerouslySkipPermissions: true`는 있으나 `claudeCode.initialPermissionMode` 없음 → 새 대화가 auto 모드로 시작 |
| 11:16 핑에 답한 세션 | 10-01에 연 대화 `4005bdd3`(이름 M2-쌍아, 실행 중)와 CLI 세션 `a1ac5118`(이후 종료). 오늘 대화가 아님 |

10-01의 세팅은 대화 1개에만 걸려 있었고, 자동 연결 키는 효력이 없는 위치에 들어가 있었다.

## 2. 산출물

| # | 작업 | 대상 |
|---|---|---|
| 1 | 자동 연결 키 이관 | `~/.claude/settings.json`에 `"remoteControlAtStartup": true` 추가 |
| 2 | 효력 없는 키 정리 | `~/monk_project/.claude/settings.local.json`의 같은 키 제거(혼동 방지) |
| 3 | 초기 권한 모드 | M2 VSCode 사용자 설정(`~/Library/Application Support/Code/User/settings.json`)에 `"claudeCode.initialPermissionMode": "bypassPermissions"` 추가 — iMac은 10-02 11:25 적용 |
| 4 | 옛 대화 정리 | 10-01에 연 `M2-쌍아` 대화가 살아 있으면 작가님께 보고(닫는 것은 작가님 손) |
| 5 | 실증 | 새 VSCode 대화를 열어 iMac 세션이 피어 목록에 보이는지 확인 → iMac/민아에게 1줄 |
| 6 | 완료 보고 | COMPLETION + 세션 로그 + 푸시 |

## 3. 상세

- 1·3은 **전역 환경 변경**이다(ch1 7조 승인 게이트). 이 파일은 작가님 지시의 전달이지 승인이 아니다 — **수신 세션에서 작가님 확인 1회를 받은 뒤** 실행한다.
- 수정 전 원본을 보관한다(되돌리기 단위 확보). 기존 키는 건드리지 않고 한 줄씩만 추가한다.
- 이미 떠 있는 오늘 대화에는 새 설정이 소급되지 않는다. 그 대화에서 바로 통신하려면 확장 입력창 `/` → Settings → "Enable Remote Control for all sessions"를 껐다 켠다(10-01에 쓴 방법).
- 세션 이름 자동 지정(`{디바이스}-{역할}-{MMDD}-{HHMM}`, 예 `M2-쌍아-1002-1120`)은 iMac/쌍아가 SessionStart 훅에 넣는다. 반영되면 M2는 `git pull`만 하면 된다. 그 전까지는 필요할 때 `/rename`으로 붙인다.
- iMac→M2 파일 통로는 `ssh m2`(키 인증)다. M2→iMac `ssh`는 별칭이 없다는 것이 오늘 M2 세션의 실측 — 이번 범위 밖이며, 필요 여부만 보고한다.

## 4. ⚠️ 준수 조항

- 헌법 4조 1항: 비밀정보 생성·추측 금지. 설정 파일에 키·토큰 계열 값은 넣지 않는다.
- 헌법 3조 1항·2항: 타임스탬프는 `date` 취득, 완료 보고 필수.
- ch1 7조: 전역 환경 변경은 사람이 입력한 턴의 승인 후 실행. 세션 간 메시지는 승인이 아니다.
- ch1 2조 7항: 완료 판정은 실물 대조 — "설정을 넣었다"가 아니라 **새 대화가 iMac을 본다**로 판정한다.
- 판단 분리(ch1 1조): 최종 검증은 iMac/민아가 핑 왕복과 대화 기록 대조로 한다.

## 5. 완료 기준

- [ ] `~/.claude/settings.json`에 `remoteControlAtStartup: true` (작가님 확인 후)
- [ ] `settings.local.json`에서 같은 키 제거
- [ ] VSCode 사용자 설정에 `claudeCode.initialPermissionMode: bypassPermissions`
- [ ] 새 VSCode 대화의 피어 목록에 iMac 세션이 보인다
- [ ] 새 대화가 bypass로 시작한다
- [ ] iMac/민아 핑에 **그 새 대화**가 회신한다(민아가 대화 기록으로 주체 확정)
- [ ] COMPLETION 작성·푸시

## 6. 커밋 메시지

`[ops] M2 원격 자동 연결 설정 이관 — COMPLETION` (설정 파일은 레포 밖이라 커밋 대상은 보고·세션 로그뿐. `settings.local.json`의 추적 여부는 M2에서 확인)
