---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내7
status: 마감 (launchd 설치 = 승인 대기)
portfolio: PF_AUTOPILOT
order: monkos-ops/ops/orders/2026-10/ORDER_20261022_iMac쌍아_막내_AUTOPILOT_iMac민아_헤드리스브리핑_2단계.md
---

**[2026-10-22 19:24 KST]** iMac/쌍아-막내7 → iMac/쌍아

# COMPLETION — iMac 민아 헤드리스 브리핑 2단계

> 출처: 작가님 2026-10-22 19:02(민아 세션) "쌍아에게 전달해서 진행해" + 19:11(쌍아 세션) 웹 루틴 일시정지 확인 → 쌍아 지시서(294ea03d) → 작가님 기동 턴으로 수신.

## 결론
수동 1회 실행까지 마쳤습니다. 브리핑은 생성돼 main에 push됐습니다(4b57bc76 ⊂ origin/main). launchd 설치(판정 5)는 작가님 사람 턴 승인을 기다립니다.

## 판정

| # | 기준 | 결과 |
|---|------|------|
| 1 | `--dry-run` 정상 | ✅ 경로·산출 판정·0번 축 통과·명령 출력 |
| 2 | 수동 1회: 브리핑·push·세션 로그·시크릿 값 0 | ✅ `BRIEFING_LOCAL_20261022.md` + LEDGER 16행 + `2026-10-22_iMac_민아-헤드리스.md`. 커밋 4b57bc76, `git merge-base --is-ancestor 4b57bc76 origin/main` 통과(origin/main은 그 뒤 타 세션 머지 abe88d46). 값 형태 패턴 grep 0건(래퍼 가드 + 사후 `git show` grep) |
| 3 | 0번 축 강제 실패 → 텔레그램 ❌ | ✅ `MINA_BRIEF_GCLOUD_CONFIG=no-such-config-zz` → gcloud 실패 → message_id=457, rc 1, 헤드리스 미기동 |
| 4 | smoke.py 회귀 0 | ✅ 122/122 (118 + cli 민아 양성 1·음성 1 + sdk-cli 민아 양성 1·미설정 음성 1) |
| 5 | launchd 등록 | ⏳ 승인 대기 — 명령: `cp monkos-ops/scripts/ai.monkos.mina-brief.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/ai.monkos.mina-brief.plist` (main 병합 후. plist는 본진 체크아웃의 `scripts/mk-mina-brief.sh`를 가리킨다) |
| 6 | 소요·턴 | 40턴 · 375s(API 367.6s) · $2.06 환산(Max 쿼터 소비). 상한 80턴·900s는 여유 2배 — 1주 실측 후 조정 권고 |

## 산출물
- `scripts/mk-mina-brief.sh` — 전용 worktree(분리 HEAD) · 0번 축 사전 점검 · `claude -p` 턴/시간 상한(macOS timeout 부재 → 감시 루프) · 결과 JSON `~/.monkos/mina-brief/` · 브리핑 커밋 확인 · 시크릿 형태 가드 · push + rebase 재시도 · 원격 대조 · 실패 시 tg_notify(경보 실패 시 `last_fail.txt`)
- `monkos-ops/ops/templates/ROUTINE_iMac민아_로컬축.md` — 정본 지시문 v1(민아 검토 1회 대기). 첫 실행이 스스로 짚은 결함 2건 반영: (186) `secret.sh`는 zsh · (185) monk.kr 실배포 SHA는 버튼 워크플로 run 기준(Pages 목록 Idle 항목은 거짓 0)
- `monkos-ops/scripts/ai.monkos.mina-brief.plist` — 06:30, plutil OK, 미설치
- `scripts/hooks/session_start.sh` 허용값 민아 + `smoke.py` 2케이스
- `.claude/rules/references.md` 도구 맵 1행 · iMac `DEVICE_PROFILE.md` 포인터 1줄

## 설계와 다르게 한 것
- 산출 경로: 오늘 E2E가 이미 있으면(오늘처럼 웹 07:12 생성분) `BRIEFING_LOCAL_{날짜}.md`로 쓴다(설계 §2 LOCAL 명명). 내일 06:30부터는 E2E가 없으니 `BRIEFING_E2E_{날짜}.md`로 쓴다.
- 0번 축은 래퍼가 먼저 잰다. 실패하면 헤드리스를 띄우지 않고 경보만 낸다(쿼터 절약). 지시문에도 남겼다(이중).
- push는 래퍼가 한다. 헤드리스는 커밋까지만 한다.
- 헤드리스 세션 로그 파일은 `…_iMac_민아-헤드리스.md`로 분리했다. 데스크톱 민아 로그(본진 미커밋)와 충돌하지 않게 하기 위해서다.

## 미해결
1. ~~MONK_ROLE 헤드리스 무효~~ → **19:26 해소(쌍아 판단 회신)**: 역할 재정의 조건을 `cli`·`sdk-cli`로 확장. sdk-cli는 문맥에 역할 후보만 표시하고 세션 이름은 미지정 유지(래퍼 `--name` 몫 — 기존 스모크 "헤드리스 이름 미지정" 2건 보존). smoke 122/122(sdk-cli+민아 양성 1·미설정 음성 1 추가). 원문: **MONK_ROLE=민아 훅은 헤드리스에 효과가 없다.** `claude -p`의 실행 표면이 `sdk-cli`라 cli 한정 분기를 타지 않는다(기존 스모크 "헤드리스 이름 미지정"이 이를 고정). 역할은 프롬프트로 전달된다. 헤드리스에도 역할을 표시하려면 sdk-cli 허용 분기가 필요하다 — 쌍아 판단.
2. plist는 **본진 체크아웃**의 스크립트를 실행한다. 본진 main이 뒤처지면 구 스크립트가 돈다. 지시문은 worktree(origin/main) 정본을 우선 읽는다.
3. gcloud 로그인이 실제로 죽으면 tg_notify도 SM 토큰을 못 얻어 경보가 실패한다. 이 경우 `last_fail.txt`와 launchd.log만 남는다 → 3단계 08:00 Actions 경보가 안전망이다.
4. 첫 브리핑이 새로 연 항목: (181)(182) 평문 env 시크릿 의심 이름 · (183) Pages 시크릿 ↔ §E 10건 차 · (184) 미추적 쌍아 세션 로그 4건 · (185)(186) 지시문 교정(이번에 반영). 판단은 쌍아·작가님 몫.
5. 래퍼의 push가 specs_drift pre-push 경고를 출력했다(경고 전용, 엣지 재배포 필요 신호 — 브리핑 ✅1과 같은 건).
