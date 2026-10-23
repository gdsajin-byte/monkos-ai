---
type: report
date: 2026-10-23
device: iMac
agent: 쌍아-막내13
status: 시제품 — 작가님 사용 중
portfolio: PF_RND
---

# MONK 바둑판 (로컬 웹) — 해설 봇 MVP 화면 시제품

**[2026-10-23 11:56 KST]** iMac/쌍아-막내13 → iMac/쌍아

> 출처: 작가님 2026-10-23 11:4x iMac 쌍아 세션 사람 턴 "ui가 영 불편해 이거부터 좀 개선해야할듯" (Sabaki 메뉴 장벽) → 쌍아 경량 지시.

## 실행

```bash
apps/go-board-web/run.sh      # http://127.0.0.1:8765/ 브라우저 자동 오픈 (이미 켜져 있으면 열기만)
```

끄기: run.sh가 출력한 `kill <PID>`. 로그 `~/.monkos/katago/go-board-web.log`.

## 구성

| 파일 | 역할 |
|---|---|
| `server.py` | 표준 라이브러리 HTTP 서버(127.0.0.1만). GTP 프로세스 2개 상주 — 최강(`gtp_play.cfg`, 300 visits·2.5초 상한) / 급수(`configs/gtp_human5k_example.cfg` + `b18c384nbt-humanv0`, `kata-set-param humanSLProfile rank_Xk`로 즉시 전환) |
| `index.html` | 단일 화면, 바둑판은 직접 SVG(외부 라이브러리·CDN 없음) |
| `run.sh` | 서버 기동 + 헬스 대기 + `open` |

- 규칙: 한국 규칙·덤 6.5. 형세 = 엔진 `scoreLead`(흑 기준).
- 대국 기록: 판마다 `~/.monkos/katago/games/YYYYMMDD_HHMMSS_작가님_vs_KataGo.sgf` 자동 저장(레포 밖).
- 리뷰 버튼: 비활성. `apps/go-commentary-pilot`(막내11 소관)은 OGS `games.json` 배치라 SGF 1판 입력 창구가 없다. 창구가 생기면 `server.py`의 `REVIEW_REASON` 자리에서 호출만 붙인다.
- 상태는 서버 1벌 — 브라우저 탭 여러 개는 같은 판을 공유한다.

## 실측 (2026-10-23 11:54)

- 최강 응수 2.47~2.50초 (3초 내), 급수 10급 응수 0.99~1.28초.
- 무르기·새 판·흑백 바꾸기·급수 전환·이미 돌 있는 자리 거부 정상.
- matte-imac `/health` 전후 200.
