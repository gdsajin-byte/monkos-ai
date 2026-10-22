---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: iMac 민아 헤드리스 브리핑 2단계 — launchd 06:30 + mk-mina-brief.sh + 지시문 + 훅 허용값 + 실패 경보
status: 발행
portfolio: PF_AUTOPILOT
---

# ORDER — iMac 민아 헤드리스 브리핑 (2단계)

> 출처: 작가님 2026-10-22 19:02 (iMac-민아-1022-1703 사람 턴) "쌍아에게 전달해서 진행해" + 19:11 (iMac 쌍아 세션 사람 턴) "내가 일시정지 버튼 눌렀어"(웹 루틴 정지 확인 → 설계 §5·§6 10-22 개정).
> 설계: `monkos-ops/tech/designs/2026-10/DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장.md` §4·§6 2단계.

## 1. 목적

웹 루틴 일시정지 동안 iMac에서 매일 06:30 E2E 브리핑 1부를 만든다(메일 축 제외 — 명시). 로컬·인프라·세션 축은 iMac만 볼 수 있다.

## 2. 산출물

1. `monkos-ops/ops/templates/ROUTINE_iMac민아_로컬축.md` — 정본 지시문. 내용 골격:
   - 0번 축 로그인 전제(`wrangler whoami`·`gh auth status`·`gcloud auth list`) — 하나라도 실패 시 그 사실만 보고하고 종료.
   - `scripts/brief_ledger.sh list --open` 판독 → 각 항목 재측정 가능한 것만 재측정 → resolve(근거) / note.
   - 축: 미커밋·미추적 파일(세션 로그 포함), ahead/behind · SM 존재(`secret check`, 값 접촉 0) · Cloud Run 리비전·env 참조 방식(**이름·valueFrom/plain만**, 값 출력 금지 필터 코드 명시) · Pages 시크릿 이름 ↔ SECRET_INVENTORY §E · CF Pages 최신 배포 SHA ↔ origin/main `MONK_kr/`·`functions/` 미배포 잔량 · `claude agents --json` bg 세션 상태 · launchd 잡 최근 실행 · 라이브 프로브(2회 히트 규칙).
   - 산출: `monkos-ops/ops/briefings/BRIEFING_E2E_{YYYYMMDD}.md` — 현행 웹 브리핑 섹션 구조(PROPOSAL_20260813 9항 규율) 준수, 헤더에 "메일 축 미점검(웹 루틴 일시정지)" 1줄.
   - 무인 규칙: 읽기 전용. 쓰기 = 브리핑·원장·세션 로그 + commit/push만. 배포·시크릿 생성·설정 변경·메시지 발송 금지. 승인 필요 사안은 원장 note.
2. `scripts/mk-mina-brief.sh` — 전용 worktree(`.claude/worktrees/mina-brief`)에서 `git pull` → `MONK_ROLE=민아 claude -p "<지시문 경로를 읽고 수행>" --max-turns N` (상한 15분 timeout) → push. rc≠0 또는 브리핑 미생성 → `scripts/tools/tg_notify.sh --text "❌ iMac 민아 브리핑 실패 — {사유}"`. `--dry-run` 지원.
3. launchd `~/Library/LaunchAgents/ai.monkos.mina-brief.plist` (06:30 매일) — `scripts/launchd/` 등 기존 plist 보관 관례를 따르고 레포에 사본 보관. **설치(load)는 1회 수동 스모크 성공 후**.
4. `scripts/hooks/session_start.sh` MONK_ROLE 허용값에 `민아` 추가(CLI 표면 한정, 소소와 동일) + `smoke.py` 케이스(양성 1·음성 1).
5. references.md 도구 맵 1행(3요건) + DEVICE_PROFILE 또는 rules에 포인터 1줄.

## 3. 범위

**허용**: 위 신설·수정 · 수동 실행 1회(실 브리핑 생성·push) · plist 파일 작성(레포 사본).
**승인 대기**: launchd 설치(`launchctl load`)는 상주 자동화 신설(ch1 7조 승인 게이트) — 수동 스모크 결과를 쌍아에 보내고 작가님 사람 턴 승인 후 설치. 판정 5는 그때 수행.
**금지**: 웹 Routine 트리거 변경 · 메일 접근 · 시크릿 값 접촉 · 전역 사용자 설정 변경 · 원장 초기 적재(iMac 민아 데스크톱 세션 몫 — 적재 전이면 원장 단계는 "항목 0건" 정상 처리).

## 4. 판정 기준

| # | 기준 |
|---|------|
| 1 | `--dry-run` 정상 |
| 2 | 수동 1회: 브리핑 생성·push(원격 SHA 대조)·세션 로그 1건, 시크릿 값 출력 0(산출물 grep) |
| 3 | 실패 가시화: 0번 축 강제 실패(예: 존재하지 않는 gcloud 구성 지정) → 텔레그램 ❌ 1건 |
| 4 | smoke.py 전체 통과(회귀 0) |
| 5 | launchd 등록 확인(`launchctl list`) |
| 6 | 소요 시간·턴 수 실측 기재(비용 상한 조정 근거) |

## 5. 반환

COMPLETION(`reports/2026-10/`): 브랜치·커밋 SHA(원격 대조), 판정 6건, 수동 실행 브리핑 경로, 미해결.
