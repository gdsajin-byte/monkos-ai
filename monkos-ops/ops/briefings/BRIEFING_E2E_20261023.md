---
type: briefing
date: 2026-10-23
generated: auto (iMac/민아 헤드리스 — mk-mina-brief.sh, 실행 ID 20261023-0630)
device: iMac
agent: 민아
status: 마감
---

**[2026-10-23 06:33 KST]** iMac/민아(헤드리스) → 작가님

# E2E 데일리 종합보고 2026-10-23 (iMac 로컬·인프라 축)

> ⚠️ 메일 축은 점검하지 못했습니다(웹 루틴 일시정지). 고객 환불처럼 법정 기한이 걸린 메일은 작가님이 직접 확인해 주세요.
> 원장: 열린 항목 70건 · 오늘 resolve 2 · open 2 · note 5

## 🔴 긴급
1. **(131) 고객 환불 요청 미회신 — 작가님.** [미확인 — 메일 축 미점검] 어제 기준 564시간 경과, 법정 기한이 걸린 고객 요청입니다. 헤드리스는 스레드를 볼 수 없어 원장 기재만 승계합니다.
2. **(181) 포털 prod 평문 env 의심 이름 9 → 6.** [확정] 리비전 `00568-w2l`에서 KAKAO 2개와 LINE_CHANNEL_SECRET은 valueFrom으로 전환됐습니다. 남은 것: TX_API_KEY·AUTH_SECRET·LINE_MESSAGING_CHANNEL_SECRET·LINE_MESSAGING_ACCESS_TOKEN·GITHUB_TOKEN·GOOGLE_CLIENT_SECRET. 영향범위는 포털 런타임 env를 읽을 수 있는 권한 보유자입니다. GOOGLE_CLIENT_SECRET은 SM에 없어서(06:32 check, 양성 대조군 정상) (174) 정본화가 먼저 필요합니다.
3. **(187) Gemini 2.5 마이그레이션 기한(10-20) 3일 경과.** [확정 — 코드 잔존 / 미확인 — 차단 시점] origin/main 기준 `monkos_AI`에 `gemini-2.5-flash` 20행이 남아 있습니다(_legacy 제외). 어제 가드 dev 완료 커밋은 있으나 prod 반영은 확인하지 못했습니다.

## ⏸️ 정체 (3일+)
- 원장 ⏸️ 22건은 변동이 없습니다. 오늘 재측정한 것은 (116) `BIZINFO_API_KEY` SM 부재 지속(17일째)뿐입니다. 결정 택1 요구는 어제 E2E TODO 2(막내 묶음 배정/폐기)로 유지합니다.

## 📋 어제 TODO 결과
- LOCAL-1 monk.kr 버튼 배포 + 엣지 재배포 → **✅ 실행.** run 39765783552(19:47 KST, headSha 85cdf995)가 1accc293을 포함합니다. `monkos.ai/specs/visa/ca` 2회 히트 결과 `1000 × 1400` 4건, `591 × 827` 0건, 200입니다.
- LOCAL-2 평문 시크릿 2차 SM 전환 → **부분 실행**(9→6, 위 🔴2).
- E2E-1 환불 회신 → 미확인(메일 축 미점검).
- E2E-2 막내 묶음 배정 → **부분 실행.** 10-22 쌍아-막내 세션 로그 9건이 새로 생겼지만, 묶음 5건((146)(124)(123)(102)(126))은 전부 아직 열려 있습니다.
- E2E-3 BIZINFO_API_KEY 등록 → **미실행**(06:32 SM 없음).

## ✅ 오늘 TODO
1. **[P0] 환불 메일 확인·회신 — 작가님.** (131). 판정: 스레드 메시지 수 2.
2. **[P1] 포털 평문 잔존 6개 SM 전환 — 쌍아.** (181)·(174). GOOGLE_CLIENT_SECRET은 SM 등록(값 접촉=작가님)이 먼저입니다. 판정: 재측정 시 `plain_의심이름=[]`.
3. **[P1] bg 세션 쌍아-막내9 처리 — 작가님.** (189). 약 9시간째 승인 대기(blocked) 상태이고, (187) Gemini 가드 작업 worktree입니다. 승인할지 종료할지 하나를 골라 주세요. 판정: `claude agents --json`에서 blocked가 사라짐.

## 📅 일정·메일
미점검(헤드리스 — 커넥터 없음).

## 📊 지표
이 실행 범위에서는 갱신이 없습니다(지표 축은 웹 루틴 몫).

## 🔧 순찰
- 2-1 local: 본진 `main...origin/main` 동기화 상태, 미커밋 1건(`MEMORY_CHANGELOG_iMac.md`, 세션 로그 아님). worktree 12개 중 locked 2개(makne9·makne10)는 진행 중인 작업입니다.
- 2-2 secret: BIZINFO_API_KEY·GOOGLE_CLIENT_SECRET 없음. 양성 대조군 TELEGRAM_TEAM_BOT_TOKEN은 enabled, 음성 대조군도 정상 판정입니다.
- 2-3 infra: portal `00568-w2l`(env 49, valueFrom 27, 의심 6 → 🔴2) · idphoto-kr `00211-4k7` · idphoto-jp `00131-nt9` · studio `00028-ml8` · image-engine `00032-qj6`. portal 외 4개 서비스는 의심 이름 0입니다.
- 2-4 Pages 시크릿: 6개 불변(CHAT_API_KEY·GEMINI_API_KEY·RESEND_API_KEY·TOSS_CLIENT_KEY·TOSS_SECRET_KEY·TX_API_KEY). §E에만 있는 10개는 그대로입니다((183) note).
- 2-5 monk.kr 미배포 잔량: **0커밋.** 기준은 버튼 run 85cdf995이고, 이 SHA가 origin/main 787fa097의 조상인지 확인했습니다. 전체 40커밋 중 `MONK_kr/`·`functions/` 변경은 0이며, 직전 구간 대조에서는 2건이 잡혀 조회가 유효함을 확인했습니다. wrangler 최상단 787fa09는 Git 연동 Idle이라 기준에서 제외했습니다.
- 2-6 session: 쌍아-막내9 blocked(위 TODO 3). 막내10 working, 그 외 idle입니다.
- 2-7 launchd: `ai.monkos.matte-imac-tunnel`의 마지막 종료 코드가 -9지만 현재 PID가 있고 상주 중입니다. `matte-imac.monkos.ai/health` 2회 히트 결과 200/200이며, 10-23 03:27 QUIC 재연결 로그는 자동 복구됐습니다. 나머지 잡은 종료 코드 0입니다. secret-patrol 로그는 10-22 09:30(오늘 09:30 예정, 정상)입니다.
- 2-8 live (2회 히트): monkos.ai·monk.kr·idphoto-kr·idphoto-jp·studio·image 모두 200, 0.38~0.62s.

## 📌 승계
- (187) 🔴 Gemini 2.5 [3일 초과 / prod 반영 미확인·막내9 승인 대기 / 막내9 처리 후 prod 리비전에서 모델 문자열 재측정]
- (146) 🔴 RunPod 429 백오프 [D-23 / 막내 미배정 / 묶음 배정]
- (123)(124) 🔴 es 번역·캐나다 비자 5×7 [장기 / 막내 미배정 / 묶음 배정 — (124)는 1000×1400 반영과 대조해 해소 여부 재판정]
- (189) ℹ️ 막내9 blocked [신규 / 작가님 승인 경로 / 택1]
- (190) ℹ️ 루틴 §1 note 인자명(`--evidence`≠`--text`) [신규 / 지시문 / 쌍아 1줄 정정]
- 해소: (185) 2-5 판독법·(186) 2-2 zsh 호출 — ff5a4645 반영 실측.
