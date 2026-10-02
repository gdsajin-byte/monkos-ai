---
type: completion
date: 2026-10-02
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "꾸 우체통 워처(mailbox_watcher.sh) 폐기 — 프로세스만 살아 있고 전달 기능은 07-13 이후 0"
---

# COMPLETION — 꾸 우체통 워처 폐기

**[2026-10-02 11:29 KST]** iMac/민아 → 작가님 · iMac/쌍아(사후 추인)

## 지시 출처

- 작가님 11:15 "현재 에이전트 통신상황 체크해" → 민아 점검 중 발견 → 민아 11:17 폐기 권고(launchd 해제·도구 맵에서 내림·비밀번호 줄 제거).
- 작가님 11:27 "우체통 워처는 폐기해" (사람이 입력한 턴, 이 세션).

## [예외] 범위 초과 사유 (ch1 2조 5항)

- ⑤ 규정 계층 변경: `.claude/rules/references.md` 도구 맵 1행 수정.
- ④ 가드레일·상주 프로세스 변경: launchd 에이전트 1건 해제.
- 작가님 직접 지시(경로 ③, ②항 준용). 개정 청구: 도구 맵 등재 기준에 "프로세스 생존 ≠ 가동 실측"을 명시하는 건은 쌍아 소관으로 올린다(아래 💡).

## 실측 (폐기 근거, 11:16~11:17)

| 항목 | 실측 | 대조군 |
|---|---|---|
| 프로세스 | PID 1437, 81일째 생존 | — |
| 대상 호스트 | `mac@100.93.220.17` — tailnet 목록에 없음, 22번 포트 도달 불가 | M2 실주소 `100.81.38.20` 22번 열림, `ssh m2` 접속 정상 |
| 로컬 수신 폴더 | `teams/kku/inbox` 부재 | `teams/` 자체는 존재 |
| 로그 | 스크립트 로그 경로 `monkos-ops/06_로그/` 부재, launchd 로그 마지막 기록 07-13 | — |
| M2 측 폴더 | `/Users/kku/kku` 부재 | M2 홈 목록 정상 조회(19항목) |

## 집행

| # | 행위 | 결과 |
|---|---|---|
| 1 | `launchctl bootout gui/501/com.monk.mailbox-watcher` | rc 0. 해제 후 목록에서 소멸, 워처 프로세스 0. 대조군 `com.monkos.ads-sync`는 잔존 |
| 2 | plist 이동: `~/Library/LaunchAgents/com.monk.mailbox-watcher.plist` → `monkos-ops/scripts/_legacy/` | LaunchAgents에 mailbox plist 0 (재부팅 시 재기동 없음) |
| 3 | `git mv monkos-ops/scripts/mailbox_watcher.sh → monkos-ops/scripts/_legacy/` | 이력 보존(`git log --follow`) |
| 4 | 스크립트의 평문 비밀번호 1행 제거 + 머리에 폐기 표기 | 현행 트리에서 값 0. **git 이력에는 잔존**(02-22 커밋부터) |
| 5 | 문서 4건 갱신 | `.claude/rules/references.md` 도구 맵 행(폐기 표기) · `scripts/_legacy/README.md` 1행 추가 · `scripts/README.md` 1행 · `marketing/kku/README.md` 통신 줄 |

삭제한 파일 없음(전부 이동). 커밋·푸시 없음(작업 트리 변경 상태).

## 잔여

- ⏳ `~/.bash_profile`의 별칭 `mk-mb`·`mk-mba` 2줄 — 옮겨진 스크립트를 가리켜 이제 동작하지 않는다. 셸 전역 설정이라 손대지 않았다. 제거는 작가님 결정.
- ⏳ `teams/mailbox_launchd.log`(미추적, 3.7KB) — 그대로 둠.
- ⏳ 비밀번호 값의 git 이력 잔존 — 대상 호스트가 tailnet에 없어 현재 접속 경로는 없다. 같은 값이 다른 기기·계정에 쓰이고 있는지는 민아가 알 수 없다(작가님 확인 사항). 메모리상 `sshm2` 셸 함수에도 평문 비밀번호가 내장돼 있다(별건).
- ⏳ `monkos-ops/ops/audit/TOOL_CENSUS_20261001.csv`는 10-01 시점 스냅샷이라 수정하지 않았다.

## 💡 개정 청구 (쌍아 소관)

- 10-01 도구 전수조사는 이 워처를 "가동 실측 PID 1437"로 등재했다. 프로세스 생존은 기능의 증거가 아니다(3요건 중 "스모크 — 작동 실증" 미충족). 도구 맵 등재 시 **상주 프로세스는 최근 산출물(로그·전달 건) 1건 대조**를 요건으로 넣을 것을 청구한다.
- 같은 전수조사에서 "launchd 등록(exit 0)"만으로 등재된 `ads-sync`·`secret-patrol`·`철창이-watcher`도 같은 방법으로는 기능이 증명되지 않았다(secret-patrol은 10-02 자동 커밋 `df7ca0da`가 있어 실증됨, 나머지 2건은 미확인).

## 대체 경로 (10-02 실측)

- 파일·명령: `ssh m2`(키 인증) — 11:16 접속 정상.
- 대화: 세션 메시지 `M2-쌍아` — 11:16 핑에 1분 내 회신(bypass). 11:28 목록에 1행(`5d1d78`, idle).
