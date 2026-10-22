---
type: design
date: 2026-10-22
device: iMac
agent: 쌍아
status: 범위 맞춤 완료(민아 19:06) — 1단계 지시서 발행
portfolio: PF_AUTOPILOT
subject: "E2E 데일리 브리핑 — 해소 원장 신설 → iMac 민아 로컬·인프라 축 인수 → 메일 경로 확보 시 웹 종료"
related:
  - monkos-ops/ops/templates/ROUTINE_웹민아_데일리E2E.md (현행 웹 루틴 정본 지시문)
  - monkos-ops/ops/briefings/BRIEFING_E2E_20261022.md (현행 산출물)
  - monkos-ops/ops/proposals/PROPOSAL_20260813_쌍아_브리핑개편.md
---

# 브리핑 iMac 이관 + 해소 원장 설계서

**[2026-10-22 19:05 KST]** iMac/쌍아 → 작가님 · 민아

> 출처: 작가님 2026-10-22 19:02 (iMac-민아-1022-1703 사람 턴) "쌍아에게 전달해서 진행해" — 쌍아 18:58 분석(A/B/C) + 민아 19:00 의견(순서 ①→②→③, 종착 A)을 읽고 지시. 민아 전달 19:02, 원문 대조 민아 로그 :70·:73.
> 발의: 작가님 18:55 "웹민아는 로컬을 못보니 계속 처리된 것도 반복 보고하는데".

## 1. 문제 — 반복 보고의 두 원인

1. **가시성**: 웹민아는 git 원격·라이브 URL·GitHub API·claude.ai 커넥터만 본다. SM·Cloud Run·로컬 미추적 파일·세션 간 메시지·bg 세션은 사각(10-22 브리핑: MCP 6 전부 실패, 환경 네트워크 정책으로 일부 엔드포인트 000).
2. **닫을 곳이 없다**: 승계 항목 `(NNN)`은 전날 브리핑 본문에서 매일 재서술된다. 처리한 쪽(쌍아·막내·작가님)이 "해소"를 적을 정형 자리가 없어, 웹민아가 직접 재측정하지 못하면 영원히 승계된다. → 위치를 옮겨도 원장 없이는 반복이 남는다.

## 2. 종착 구조

```
[06:30 iMac launchd] iMac 민아(bg, 읽기 전용) — 로컬·인프라·세션 축 실측
   ├─ 해소 원장: 근거 있는 항목 resolve / 새 결함 open
   ├─ BRIEFING_LOCAL_{YYYYMMDD}.md (축 분리 섹션, 짧게)
   └─ commit + push (자기 산출물만)
[07:00 웹 Routine] 웹민아 — 메일·저장소 전수 스캔 축
   ├─ git fetch → 원장·LOCAL 판독 (resolved는 재보고 금지, 재측정이 반증하면 reopen+근거)
   └─ BRIEFING_E2E_{YYYYMMDD}.md 1부 (작가님이 읽는 보고는 계속 1부)
[08:00 GitHub Actions] BRIEFING_E2E 부재 또는 LOCAL 부재 → tg_notify 경보 (어느 쪽이 빠졌는지 명기)
```

- 작가님 읽을거리는 **1부 유지**(B안의 "보고 2부" 부담 제거). iMac 결과는 웹 보고 안으로 흡수.
- 메일 경로가 iMac에 생기면(§5) 웹 루틴 종료, iMac 민아가 E2E 1부 직접 작성(A).

## 3. 해소 원장

- 위치: `monkos-ops/ops/briefings/LEDGER.jsonl` (append-only, 1행 1이벤트).
- 행: `{"ts","id","event":"open|resolve|reopen|note","axis","severity","due","title","owner","evidence","by"}`
  - `id` = 현행 승계 번호 `(NNN)` 그대로 이관(신규는 최대값+1).
  - `axis` 고정 enum: `mail|repo|live|infra|local|session|content|secret` / `severity`: `🔴|⏸️|ℹ️` / `due`: `YYYY-MM-DD`(D-day 항목만) — CLI가 검사.
  - **CLI 규칙**(민아 19:06 보완): resolve·reopen은 open/reopen 상태 id에만 허용 · `by`는 `{디바이스}/{에이전트}` 형식 · `evidence`는 SHA(7자+) / "2회 히트"·"대조군" / `HH:MM` 사람 턴 시각 중 1개 이상 포함 강제. 위반 시 거부.
- CLI: `scripts/brief_ledger.sh {open|resolve|reopen|note|list|show}` — `list --open`이 현재 열린 항목 표. 실패 가시화 `❌ brief_ledger:` + rc≠0.
- **누가 쓰나**: 처리한 주체 누구나(쌍아·민아·막내·작가님). 완료 보고 절차(`makne-finish`·`session-end`)에 "관련 승계 번호가 있으면 resolve 1행" 추가.
- **초기 적재**: 10-22 브리핑의 열린 항목 전량(🔴·⏸️·승계 번호)을 open으로 이관 — 웹민아 1회 작업(정본 해석 주체).
- 오늘 이미 해소된 것 예: (160) 포털 env 평문 시크릿 → resolve, evidence `prod rev 00567-bhd 4종 valueFrom, 6f9a2ee5`.

## 4. iMac 민아 헤드리스

- 기동: launchd `ai.monkos.mina-briefing` 06:30 → `scripts/mk-mina-brief.sh` → `claude -p`(헤드리스, 단발) + `MONK_ROLE=민아` + 정본 지시문 `ops/templates/ROUTINE_iMac민아_로컬축.md`.
- **0번 축 — 로그인 전제 생존**(맨 앞, 민아 보완): `wrangler whoami`·`gh auth status`·`gcloud auth list`. 하나라도 죽으면 나머지 축은 거짓 음성이므로 그 사실만 보고하고 종료.
- 축(웹이 못 보는 것만): Pages 시크릿 이름 ↔ SECRET_INVENTORY §E 대조(`wrangler pages secret list`, 이름만) · CF Pages 최신 배포 SHA ↔ origin/main `MONK_kr/`·`functions/` 변경 = 미배포 잔량 · 미추적·미커밋 파일(세션 로그 포함) · ahead/behind · SM 존재(`secret check`, 값 접촉 0) · Cloud Run 리비전·env 참조 방식(값 미출력 필터) · CF Pages 최신 배포 · bg 세션 상태(`claude agents --json`) · launchd 잡 최근 실행 · 원장 열린 항목 중 위 축으로 판정 가능한 것 재측정.
- 제외: 세션 간 메시지 수신함(헤드리스가 못 읽음 — 미커밋 세션 로그로 대체). Cloud Run env는 **이름·참조 방식(valueFrom/plain)만** 출력 — 값 필터를 지시문에 명문화. `claude agents --json`은 10-22 실측 존재(notify_blocked.py가 사용 중).
- **무인 맥락 규칙(ch1 7조)**: 읽기 전용. 쓰기는 자기 산출물(LOCAL·원장·세션 로그) + commit/push만. 배포·시크릿 생성·설정 변경·메시지 발송(텔레그램 경보 제외) 금지. 승인 필요 행위는 원장 note로 에스컬레이션.
- 비용: Max 쿼터(작가님 대화와 공유) → 턴 상한(`--max-turns`)·시간 상한(15분) 둔다. 모델은 사용자 기본.
- 훅: `session_start.sh` MONK_ROLE 허용값에 `민아` 추가(CLI 표면 한정, 소소와 동일 방식) + smoke 케이스.
- 실패 가시화: 스크립트 rc≠0 또는 LOCAL 미생성 → `tg_notify "❌ iMac 민아 브리핑 실패 — {사유}"`. 08:00 Actions 경보가 이중 안전망.

## 5. 메일 축 — 웹 종료의 선행 조건 (별도 결정)

웹민아의 메일 감시(고객 환불·법정 기한 추적·24h 트리아지)는 claude.ai Gmail 커넥터 의존 — 헤드리스 CLI에는 없다. iMac 경로 후보:
- (a) Gmail API OAuth 클라이언트(읽기 전용 scope) — **시크릿 신설 = 작가님 손**.
- (b) 로컬 Gmail MCP 서버.
결정 전까지 웹 루틴 유지(B 과도기). 이 설계의 1~3단계는 메일 결정과 무관하게 진행.
- 민아 선호(19:06): **(a)** — (b)도 같은 OAuth 자격이 필요하고 서버 한 겹이 더 붙는다. 스크립트 1개(`gmail.readonly`, 리프레시 토큰 SM). 전제 확인: 환불 스레드가 어느 메일함인지(작가님 gmail vs info@monkos.ai 워크스페이스).

## 6. 단계

| 단계 | 내용 | 주체 | 판정 |
|------|------|------|------|
| 1 | 원장 + CLI + 완료 보고 절차 1줄 + 웹 루틴 지시문에 "원장 먼저 읽기·resolved 재보고 금지" | 막내(CLI) · 쌍아(지시문·절차) | CLI 스모크(근거 없는 resolve 거부 음성 대조 포함), 다음 날 웹 브리핑에서 (160) 미재보고 |
| 1b | 초기 적재 | 웹민아(다음 루틴 1회) | open 건수 = 10-22 브리핑 열린 항목 수 |
| 2 | iMac 민아 헤드리스(launchd·스크립트·지시문·훅 허용값·실패 경보). **첫 launchd 기동은 1b 적재 다음 날**(그 전엔 resolve 대상 없음). 지시문 초안은 민아 검토 1회 | 막내 | 수동 1회 + launchd 실기동 1회, LOCAL 생성·push·원장 갱신 실측 |
| 3 | 웹 지시문 축 분리(로컬·인프라 축 삭제, LOCAL 흡수) + 08:00 Actions 경보 | 쌍아(지시문) · 막내(워크플로) | 3일 연속 1부 보고·반복 보고 0 |
| 4 | 메일 경로 결정 → 웹 종료(A) | 작가님 결정 후 | 별도 지시서 |

## 7. 리스크

- 웹·iMac 동시 쓰기 충돌: 원장은 append-only jsonl, 시각 분리(06:30/07:00) + 웹은 push 전 rebase. 공유 워킹트리 autostash 교훈 — iMac 헤드리스는 **전용 worktree**에서 실행하고 main에 push.
- 헤드리스가 iMac 작업 세션과 쿼터 경합: 15분 상한, 실측 후 조정.
- 원장 오용(근거 빈약한 resolve): CLI가 evidence 형식 검사, 웹민아가 반증 시 reopen.
