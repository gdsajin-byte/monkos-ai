---
type: completion
date: 2026-10-01
device: iMac
agent: 민아
status: 진행
portfolio: PF_MONK_OS
subject: "기기 간 발신 승인 설정(isolatePeerMachines) 제거 — 웹 원격에서 버튼 병목 해소"
---

# COMPLETION — 기기 간 발신 승인 설정 제거

**[2026-10-01 19:09 KST]** iMac/민아 → 작가님 · iMac/쌍아(사후 추인)

> 출처: 작가님 원문(민아 세션, 사람이 입력한 턴) 19:06 "웹으로 들어왔는데 허용 버튼이 막혀서 즉시 통신이 안되는듯. 결정적인 승인이 아닌 상황에서 통신은 버튼이 병목이야" · 19:07 "통신이 이미 되니 너가 끄고 바로 테스트해"
> [예외] 민아 범위 초과(가드레일·규정 계층 변경) — 작가님 직접 지시. 쌍아 사후 추인 대상.

## ✅ 완료
- `.claude/settings.json`에서 `"isolatePeerMachines": true` 1줄 제거. `crossSessionInbound: accept` 유지. 커밋 `8cdd26d2`, origin/main 반영(원격 파일에서 해당 키 0건 확인).
- JSON 유효성 확인, 집행 훅 스모크 61/61 PASS.
- 19:08:31 M2-쌍아(기기 간 경로)로 왕복 시험 메시지 발신(msg_id 8c4710d1).

## ❌ 미확인
- 발신 시 iMac 쪽에 확인 창이 떴는지 — 민아는 볼 수 없다. 작가님 화면 관측 사항.
- 실행 중이던 세션에 설정 변경이 바로 반영되는지 — 문서에 명시 없음. 시험 결과로 판정.
- M2의 회신 — 본 문서 작성 시점에 미수신. M2 레포가 `8cdd26d2`를 pull하기 전에는 M2에서 나가는 메시지에 확인 창이 계속 뜬다.

## 💡 근거
- 공식 문서(code.claude.com/docs/en/cross-session-messaging): 이 설정이 켜져 있으면 기기 밖으로 나가는 메시지마다 승인을 묻고 `bypassPermissions`에서도 묻는다. 어느 설정 범위든 `true`가 하나라도 있으면 적용되므로 끄려면 그 줄을 지워야 한다. 같은 기기 세션 간에는 원래 묻지 않는다.
- 10-01 개정(ch1 3조·7조 2항): 세션 간 메시지는 알림이며 승인이 될 수 없다. 되돌릴 수 없는 행위의 차단 근거는 승인 사인이다. 통신 자체에 건 관문은 이 원칙과 겹친다.
- 이 설정은 10-01 07:42 민아 1차 세션(dbbe268e)이 `crossSessionInbound: accept`와 함께 넣은 것이다.

## ⏳ 남은 것
- M2 회신 수신 후 결과 추기, status 마감.
- 다른 기기(M1·웹 컨테이너)는 pull 시 적용.
- 모니터 #2(세션 간 메시지 보류·만료) 계속.

## 📁 파일
- `.claude/settings.json` (−1줄)
- 본 문서, `monkos-ops/ops/sessions/2026-10/2026-10-01_iMac_민아.md`

## 🔀 git
- `8cdd26d2` [ops] 기기 간 발신 승인 설정 제거 — origin/main 반영, 차이 0.
