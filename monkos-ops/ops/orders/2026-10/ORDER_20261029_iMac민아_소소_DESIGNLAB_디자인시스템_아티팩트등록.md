---
type: order
date: 2026-10-29
from: iMac/민아
to: iMac/소소
subject: 디자인 시스템 아티팩트 등록 — 포털 토큰·monk.kr 팔레트를 Claude Design의 Design System으로 (1단계: 현행 그대로, 통합 결정 아님)
status: 발행
portfolio: PF_DESIGNLAB
---

# ORDER — 디자인 시스템 아티팩트 등록 (소소 1차 과제, 데스크톱 세션)

**[2026-10-29 15:11 KST]** iMac/민아 → iMac/소소

출처: 작가님 사람 턴 — 10-29 14:36 "소소 가동 환경" 논의 → 15:09 **"소소에게 맡기자"**(디자인 시스템 등록을 소소에게, 민아 경유). 소소 헌장(PROPOSAL_20261002 §1 "monkos.ai 라인은 민아가 브리프를 넘긴다")에 따른 브리프다. 알림이 아니라 범위 승인된 과제이며, 승인 범위는 아래 §2뿐이다.

## 0. 세션 형태 (10-29 작가님 결정)
- 소소는 **Claude 데스크톱 앱 Code 세션**으로 돈다(iTerm·bg 아님). 이유: 이미지 입출력·브라우저 페인·아티팩트(모바일 열람·코멘트)·Figma/Canva 커넥터가 이 표면에만 있다. 10-28 bg 기동은 데몬 env 미전달로 팀 플래그·역할이 유실됐다(민아 실측, 세션 로그 10-29 14:31).
- 훅은 데스크톱 세션을 민아로 추정한다 → 첫 턴 역할 선언(ch1 5조)으로 소소. `.claude/agents/soso.md`와 헌장을 먼저 읽고, 세션 이름을 `iMac-소소-MMDD-HHMM`으로 자가 교정(`set_session_title`). 수발신 헤더 `iMac/소소`.
- 팀원 dsn-scout·dsn-maker·dsn-critic은 이 세션에서 **서브에이전트**로 뜬다(실측). 실험용 팀 플래그는 데스크톱에서 안 켜지며, 이 과제는 팀 없이도 된다.
- 브라우저: 민아 포트 9223을 같이 쓰지 말고, 필요하면 쌍아에게 소소 포트를 요청(세션별 포트 분리안 작가님 결정 대기). 9222는 쌍아 창 — 접속 금지.

## 1. 완성 그림
우리 계정에 **Design System 아티팩트 2벌**이 등록돼 있고(monkos.ai 계열 / monk.kr 사진관), 소소가 이후 Design 캔버스로 시안을 낼 때 그 토큰·글꼴이 자동으로 적용된다. 엔스 문서: "Claude builds with your components, checks its output against your design system" — 이게 작동하는 상태.

## 2. 범위 (이것만)
1. **정본 읽기** — "정본은 코드다"(헌장·DESIGN_20261002 현행토큰 실측). 추출 원천:
   - monkos.ai: `monkos_AI/portal/public/css/portal.css` `:root`(T1, 9~47행) + `monkos_AI/portal/lib/cms/render-shell.js` `:root`(T3, 106~119행, SSR 셸·웹폰트 2) + `monkos_AI/portal/public/components/specs-funnel/tokens.css`(T2). 10-02 실측 문서 [DESIGN_20261002_iMac소소_현행토큰_실측.md](../../../tech/designs/2026-10/DESIGN_20261002_iMac소소_현행토큰_실측.md) §1 지도를 먼저 읽는다(행 번호는 10-02 기준 — 재실측).
   - monk.kr: `MONK_kr/monk_studio/id_photo/*.html` 인라인 `:root`·`tailwind.config`(T6, 꾸 지정 TEAL/GRAY). 결정권자 꾸(헌법 1조 2항 경로④) — 값은 그대로 옮기고 바꾸지 않는다.
2. **등록 방법** — 세션에 `/design-sync` 스킬이 있으면 그것으로(증분 동기화, DesignSync 도구). 없으면 Artifact 도구의 **Design System 타입**(`quickstart intent: "other"` 또는 타입 목록의 Design System)으로 README·tokens.json을 직접 쓴다. 두 벌을 **별도 아티팩트**로: 이름 "MONKOS AI"(monkos.ai 계열) / "몽크사진관"(monk.kr). 표기는 법률 ch8 4조 표기표를 따른다 — 한 도메인 표기를 다른 도메인에 끌어오지 않는다.
3. **1단계는 "현행 그대로"**: 주색이 4곳에서 다르다는 사실(#4A3ABA·#6c4fff 등)은 **통합하지 말고 README에 "같은 역할 다른 값" 표로 적는다**. 통합은 별도 결정(작가님·쌍아). 지금 기본값(default)으로 표시할 벌 = "MONKOS AI".
4. **실증 1회** — 등록 후 Design 캔버스로 작은 시안 1장(예: 허브 CTA 카드 1개)을 만들어 토큰이 자동 적용되는지 확인하고 캡처 1장. 이것이 "작동한다"의 증거다.
5. **산출** — `monkos-ops/tech/designs/2026-10/DESIGN_20261029_iMac소소_디자인시스템_아티팩트등록.md`: 아티팩트 URL 2개 · 추출 원천 행 번호 · 같은 역할 다른 값 표 · 실증 캡처 링크 · 미해결(통합 결정 대기) · 소요 토큰. PF_DESIGNLAB 히스토리 1행(`scripts/pf.sh append`). 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-29_iMac_소소.md`.

## 3. 하지 않는 것
- 서비스 코드(CSS·JS·HTML) 수정 0. 배포 0. monk.kr 값 변경 0(꾸 결정 영역). 토큰 통합·정리안 0(§2-3).
- 아티팩트는 비공개 기본값 유지. 공유 링크 발행은 작가님 지시 때만.
- 커밋은 자기 산출 파일만, 브랜치 전환 없음(공유 체크아웃 — 쌍아·민아 세션과 같은 폴더). 푸시 전 `git pull` 없이 `git fetch && git merge origin/main`(리베이스·force 금지).

## 4. 준수 조항
- 헌법 3조 1항 시각 `date` 실측(훅 주입값 복사). 3조 2항 세션 로그 어펜드·PF 갱신. 4조 1항 비밀값 생성 금지(해당 없음).
- ch8 4조 표기표 · 5조 고객 대면 표현(시안 문구는 현행 서비스에 있는 것만).
- 판단이 필요한 곳(예: 어느 `:root`가 monkos.ai 정본인지 모호)은 추측으로 메우지 않고 **닫힌 질문**으로 작가님께(소소 핵심 능력 ①).

## 5. 완료 기준
- [ ] Design System 아티팩트 2벌 등록(URL), 기본값 = MONKOS AI
- [ ] Design 캔버스 실증 1장 + 캡처
- [ ] DESIGN_20261029 산출 문서 + PF_DESIGNLAB 1행 + 세션 로그
- [ ] 완료 보고: 작가님 + 민아(이 세션, 세션 메시지 `monk-project-…` 민아 10-28 주소는 ListAgents로 확인)
