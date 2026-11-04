---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내2
status: 마감
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내2_GO_대기실AI정리_MONKOSGo명칭.md
---

# COMPLETION — 대기실 AI 2줄 정리 · MONKOS Go 명칭

**[2026-11-05 07:12 KST]** iMac/쌍아-막내2 → iMac/쌍아

지시서: [ORDER_20261105_iMac쌍아_막내2_GO_대기실AI정리_MONKOSGo명칭](../../orders/2026-11/ORDER_20261105_iMac쌍아_막내2_GO_대기실AI정리_MONKOSGo명칭.md) (출처: 작가님 07:07, 쌍아 전달)

## 결론

대기실 AI가 "KataGo AI"와 "MONKOS Go" 두 줄로 바뀌었습니다. 급수는 대국 설정에서 고릅니다. 이름은 server.py 한 곳에서만 정의합니다. 8766 검증을 통과했고, 8765 반영은 main 병합 뒤 `launchctl kickstart`로 합니다(§3).

## 1. 바꾼 것 (`apps/go-board-web/server.py`·`index.html`)

- **이름 정본**: server.py 상단의 `BOT_NAME="MONKOS Go"`, `BOT_NAME_KO="몽코스 고"`, `BOT_STAGE="b10·4,154만"`, `MONK_TAG="MONKOS-Go-b10-s41M"`.
  - 화면은 `/api`의 `bot{name,nameKo,stage}`와 방 상태 `oppShort`로만 이름을 받습니다. index.html의 문자열은 응답이 없을 때 쓰는 대체값뿐입니다.
- **새 판 레벨 키는 `monkos`**입니다.
  - 옛 키 `monk`는 복원 전용입니다(`LEGACY_MONK`: "MONK 봇 (b10·4,154만)", "MONK 봇", `MONK-b10-s41M`).
  - 두 키 모두 같은 MONK 엔진을 씁니다(`BOT_LEVELS`).
  - 새 판 생성과 상대 변경에서 `monk`가 들어오면 `monkos`로 바꿉니다. 옛 화면 캐시가 옛 키로 새 판을 만들어도 새 이름이 붙습니다.
- **대기실 AI 2줄**:
  - "KataGo AI" — 둘째 줄 "최강·급수는 대국 설정에서 · AI · 대국 가능"
  - "MONKOS Go" — 둘째 줄 "몽코스 고 · 학습 모델 b10·4,154만 · AI · 대국 가능"
  - 급수 펼치기 버튼과 급수별 줄은 없앴습니다.
  - **보조 표기 위치의 근거**: 기존 대기실 행 문법이 "첫 줄 = 이름, 둘째 줄 = 상태·설명"입니다(사람 행은 닉네임 / 대기실·대국 중). 그래서 이름 줄은 짧게 "MONKOS Go"로 두고, 한국어 읽기 "몽코스 고"는 설명 줄 맨 앞에 붙였습니다.
- **대국 설정 수준 칸**: 상대별로 옵션을 다시 채웁니다(`fillLevels`). 숨김(hidden) 대신 다시 채우는 이유는 아이폰 Safari가 숨긴 option을 무시하기 때문입니다.

| 진입 | 수준 칸 | 기본값 |
|---|---|---|
| KataGo AI | 최강 + 급수 29 = 30개 | 마지막에 고른 KataGo 수준(`goBoardKataLevel`). 처음이면 지난 판 수준, 없으면 최강 |
| MONKOS Go | MONKOS Go 1개, 선택 잠금 | MONKOS Go |
| 대국실 [새 대국] | 기존대로 전체 31개 | 지난 판 수준 |

- 흑백, 접바둑, 시간 설정은 그대로 두었습니다.
- **대국실 표기**:
  - 상대 이름은 `oppShort`를 씁니다("MONKOS Go" / "KataGo" / 옛 판 "MONK 봇").
  - 급수 칸은 MONKOS Go 판이면 학습 단계 "b10·4,154만"입니다.
  - 결과 문구는 "MONKOS Go가 돌을 던졌습니다…"가 됩니다(`opp_short()`).
- **기보**:
  - 새 판 PB/PW는 `MONKOS-Go-b10-s41M(1500v)`이고 파일명은 `…_vs_MONKOS-Go-b10-s41M.sgf`입니다.
  - 이전 기보를 가져올 때 `MONKOS-Go-` 접두는 monkos로, `MONK-` 접두는 monk로 인식합니다.
- **유지**: 대기실의 진행 중 방·결과 표시("KataGo 5단" 등)는 그대로입니다. 소리 팩 코드와 오디오 진단 코드(막내3 반영분)는 건드리지 않았습니다.

## 2. 검증 (8766 `run.sh --test`, 공유 브라우저 새 탭 1개를 열고 닫음)

| 항목 | 결과 |
|---|---|
| 대기실 AI 줄 | 2개("KataGo AI", "MONKOS Go"), 급수 펼치기 없음 ✅ |
| KataGo AI → 설정 | 30개, MONKOS 없음, 첫 진입 기본 최강 ✅ |
| 5단 대국 시작 | 방 생성, 대국자 "KataGo"·"5단", `goBoardKataLevel=5d` 저장 ✅ |
| KataGo AI 재진입 | 기본 5단 ✅ → 최강으로 바꿔 시작, "KataGo"·"최강" ✅ |
| MONKOS Go → 설정 | 옵션 1개, 잠금, 제목 "작가님 VS MONKOS Go" ✅ |
| MONKOS Go 대국 | levelLabel "MONKOS Go", 대국자 "MONKOS Go"·"b10·4,154만", 2수 응수 1.48·1.58s ✅ |
| 새 기보 | `20261105_071036_작가님_vs_MONKOS-Go-b10-s41M.sgf`, `PW[MONKOS-Go-b10-s41M(1500v)]` ✅ |
| 옛 판 복원 | 테스트 저장소의 05:35 `monk` 방이 "MONK 봇 (b10·4,154만)"으로 표시 ✅. 옛 기보 `…_vs_MONK-b10-s41M.sgf`의 PW는 `MONK-b10-s41M(1500v)`, 수정 시각 05:37 그대로 ✅ |
| 대국실 [새 대국] | 31개(최강·MONKOS Go·급수) ✅ |
| 화면 스크립트 문법 | `node --check` 통과 ✅ |

- 콘솔 오류는 `pwa/icon-192.png` 1건입니다. worktree에 미추적 아이콘이 없어서 생긴 시험 환경 문제입니다(공용 체크아웃에는 있음).
- 결과 문구 "…가 돌을 던졌습니다"는 엔진 기권 상황을 만들기 어려워 실측하지 않았습니다. 같은 `opp_short()` 값이 `oppShort`로 "MONKOS Go"가 나오는 것까지 확인했습니다.
- 테스트 인스턴스는 07:11에 종료했습니다.

## 3. 8765 반영 — ✅ 07:12

- 근거: 쌍아 07:11 통지 — main 병합·원격 푸시·공용 체크아웃 갱신. 공용 server.py·index.html에 새 코드가 있는지 확인했습니다(`BOT_NAME`·`fillLevels` 검색).
- 진행 중인 판이 없는지 재확인했습니다. 방 파일 기준으로 미종료이면서 수가 있는 판이 0개였습니다.
- `launchctl kickstart -k gui/$(id -u)/ai.monkos.go-board`로 재기동했습니다.
  - PID 72939(launchd), KataGo 3개.
  - 기동 로그: `최강 OK, 급수 OK, MONK OK · 방 173개 복원(진행 중 0)`. health rooms 173은 재기동 전과 같습니다.
- 라이브 확인(읽기 전용 GET):
  - `/api/rooms`의 `bot`이 `{name:"MONKOS Go", nameKo:"몽코스 고", stage:"b10·4,154만", legacy{…}}`이고 `monkOk` true입니다.
  - `/` 화면에 `fillLevels` 코드가 들어 있습니다.

## 완료 보고
- ✅ 대기실 2줄 + 대국 설정 급수 선택 + MONKOS Go 표기(상수 1곳)
- ✅ 8766 검증(위 표)
- ✅ 8765 반영(07:12 launchctl kickstart, 진행 중 판 0 확인 후) — bot 이름·화면 코드 라이브 확인, 방 173 유지
- 📁 이 문서, 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-05_iMac_쌍아-막내2.md`
- 🔀 브랜치 `makne2-go-lobby-ai` (코드 bab57b22)
