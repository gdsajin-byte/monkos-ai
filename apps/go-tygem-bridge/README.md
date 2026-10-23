# go-tygem-bridge — 타이젬 웹 AI 대국 브리지 (내부 전용)

> 상태: **작업 사본 보관** (2026-10-23, 작가님 지시 "작업하면서 만든 도구는 로컬에 저장하면서 가자"). 정식 도구화(도구 맵 3요건·격자 자동 보정·종국 사석 인식·SGF/리뷰 자동·텔레그램 실패 알림)는 별도 진행.
> 실행 위치는 아직 `~/.monkos/tygem/tools/`(실행 사본). 이 폴더는 그 사본의 버전 관리용 스냅샷이다 — 고친 뒤 여기로 다시 복사해 커밋한다.
> 상대는 타이젬 '인공지능' 대국실(KataGo AI)만. 사람 대국에는 쓰지 않는다. 출시 게이트(원장 191): 내부 전용.

## 파일
| 파일 | 역할 |
|---|---|
| `tools/cdpx.py` | 최소 CDP 헬퍼(포트 9227 전용) — connect·ev·shot·click |
| `tools/step_open.py` | 창 1500×1000 지정 + web.tygem.com 열기 |
| `tools/login.py` | 로그인 — 자격은 `scripts/secret.sh get TYGEM_ID/TYGEM_PASSWORD`로 메모리만, 출력·파일 기록 없음. 먼저 login.php로 이동해 둘 것 |
| `tools/bridge.py` | 화면 판 읽기 ↔ KataGo GTP(`~/.monkos/katago`) ↔ CDP 클릭. `--color b|w --visits 300 --resume-log` |
| `tools/clk.py` | CSS 좌표 클릭 + 캡처 |
| `tools/clicktext.py` | DOM 텍스트로 찾아 클릭(대기실·대국 신청 창은 canvas라 미적용 — 로그인 페이지 등 DOM 화면용) |
| `tools/snap.py`·`inputs.py`·`clearfields.py`·`shape.py` | 캡처·입력 필드 조사 보조 |

## 실행 순서
1. `scripts/tools/cdp_setup.sh start 9227` (프로필 `~/.config/chrome-cdp/profile-9227`)
2. `python3 step_open.py` → 로그아웃 상태면 login.php 이동 후 `python3 login.py`
3. 대기실 '인공지능' → '19줄 인공지능' → 컴퓨터 수준·대국방법(P9단 선택 시 3점 접바둑으로 자동 변경 → 호선 재지정)·흑백 → 신청
4. `python3 bridge.py --color b`

## 주의
- 창 크기에 따라 CSS 뷰포트가 바뀐다(10-23 실측 1500×913 / 1500×1223 / 1571×1352). 캔버스 UI라 좌표는 캡처 px ÷ DPR(2)로 환산.
- 산출물(로그·캡처·SGF)은 레포 밖 `~/.monkos/tygem/`, `~/.monkos/katago/games/`. 커밋 금지.
