---
type: order
date: 2026-09-02
from: iMac/민아
to: iMac/막내1
subject: "G-M1 퍼널 계측 단일화 — Phase 0 사전 검수(무변경) → 작가님 승인 게이트 → Phase 1 구현"
status: 대기
portfolio: PF_ANCHOR
related: PF_IDPHOTO, PF_SPECS
gate: Phase 0 보고 후 정지. 작가님 승인 없이 Phase 1 착수 금지
---

**[2026-09-02 18:28 KST]** iMac/민아 → iMac/막내1

> [예외: 경로③] 지시서 발행은 쌍아 소관(ch1 3조). 작가님 09-02 18:25 직접 지시("지시서를 발행하되 무조건 처리가 아니라 사전 검수 후 처리토록")로 민아 발행. 쌍아 사후 추인 대상.

# 0. 이 지시서의 구조 — 두 단계, 중간에 정지

| 단계 | 성격 | 코드 변경 | 종료 조건 |
|------|------|----------|----------|
| **Phase 0 사전 검수** | 코드 판독 + GA4 읽기 전용 실측 + 결제 정본 대조 | **없음** | REPORT 파일 제출 → **정지** |
| (게이트) | 작가님이 REPORT의 수정안을 항목별 승인/반려 | — | 새 사용자 턴 승인 수신 |
| **Phase 1 구현** | 승인된 항목만 구현 → dev 배포 → 라이브 검증 | 있음 | COMPLETION 파일 |

Phase 0을 건너뛰고 Phase 1로 가는 것, Phase 0 안에서 "겸사겸사" 코드를 고치는 것 모두 **지시서 위반**이다. 이유는 §1에 있다.

# 1. 배경 — 왜 "무조건 처리"가 아닌가

PF_ANCHOR §10 #16 **MONKOS 수익 게이트 G-M1(2026-10-31)** = 퍼널 3단계 단일 표면 계측 완성 + 첫 유료 결제 1건. 그 첫 과제가 퍼널 계측 단일화다.

문제는 08-25 브리핑에서 "퍼널 세 단계가 서로 다른 표면을 세고 있다"로 확정된 뒤 **20일간 TODO로 방치**됐고, 그 사이 진단이 갱신되지 않았다는 점이다. 09-02 민아가 지시서 작성 전 실측한 결과, 결함의 실체는 08-25 진단과 **다르다**. 아래는 민아 실측(2026-09-02 18:2x, GA4 Data API + 코드 grep)이며, 막내는 이것을 **전제가 아니라 검증 대상**으로 다룬다.

## 1.1 민아 선행 실측 (검증 대상)

| # | 실측 | 근거 | 08-25 진단과의 차이 |
|---|------|------|------|
| F1 | GA4 속성은 **1개**(`521406894` monkos-3c6e4), 데이터 스트림 **1개**("MONKOS AI"). 코드는 측정 ID **2개**(`G-JPZWSJ3323` 포털 전용 + `G-FKG0CPTC14` 포털·idphoto-kr 공통) | `get_account_summaries` + `render-shell.js:67-81`, `idphoto-kr/public/index.html:6-11` | 신규. 두 ID가 한 스트림인지, 하나가 죽은 ID인지 API로 판정 불가 |
| F2 | 이벤트 파라미터 `service`(specs-v2 / headshot / idphoto-kr)는 코드에서 전 표면이 보내고 있으나, GA4에 **커스텀 측정기준 미등록** → 리포트 차원으로 사용 불가 | `run_report` `customEvent:service` → 400 "not a valid dimension" | **표면 분리 불가의 1차 원인**. 배선 문제가 아니라 GA4 관리 설정 문제 |
| F3 | 표면 분리는 **`hostName` 차원으로 지금도 가능** — 14일: monkos.ai 1,003 users / monk.kr 68 / idphoto-jp 2 / **idphoto-kr 1** | `run_report` hostName | idphoto-kr 트래픽이 사실상 0. "업로드 35명이 idphoto-kr인지 포털인지"는 hostName으로 즉시 귀속 가능했다 |
| F4 | 14일 퍼널(monkos.ai): spec_select 716u → photo_upload 96u → **free_generate_click 79u → free_generate_done 76u → free_download 51u** / 유료: generate_click 2u → begin_checkout 1u → purchase **0** | `run_report` eventName×hostName | 무료 트랙은 건강하다. 브리핑의 "generate_click 0"은 **유료 트랙만** 세고 있었다 |
| F5 | 브리핑 수집기 `FUNNEL_EVENTS`(6종)에 무료 트랙 이벤트 `free_generate_click/done/download`가 **없고**, 쿼리에 hostName 차원이 **없다** | `.github/scripts/daily_briefing.py:133-150` | 브리핑이 3주간 "업로드 후 생성 0"으로 읽은 것은 수집기의 구조적 맹점 |
| F6 | 08-25 실고객 토스 ₩9,900 결제 1건(PF_IDPHOTO 08/26 행)이 존재하나 GA4 `purchase`는 14일 0 | PF_IDPHOTO README:166 + F4 | 결제 표면 어딘가에서 purchase가 발화되지 않는다. 지점 미특정 |

## 1.2 그래서 사전 검수가 먼저인 이유

- F2·F3에 따라 수정 범위는 "계측 재설계"가 아니라 **①GA4 관리 설정(작가님 UI) ②수집기 쿼리 보정 ③purchase 미발화 지점 1곳 보강**일 가능성이 높다. 그러나 F1(ID 2개↔스트림 1개)과 F6(지점 미특정)은 **막내가 판독해야 확정**된다.
- 잘못된 전제로 코드를 고치면 08-25처럼 "고쳤다"는 기록만 남고 20일이 또 간다. 작가님 지시 취지가 그것이다.

# 2. Phase 0 — 사전 검수 (코드 변경 0건)

## 2.1 착수 전
- `monkos-ops/ops/portfolios/PF_ANCHOR/README.md` §10 #16 Read (ch7 6조 선행 참조)
- `monkos-ops/ops/briefings/BRIEFING_E2E_20260825.md` §⏸️ 1 Read (08-25 원 진단)
- `monkos-ops/ops/portfolios/PF_IDPHOTO/README.md` 08/26 행 Read (실결제 1건·계측 교정 2건 이력)

## 2.2 검수 항목 (전건 필수, 순서 무관)

**P0-A 이벤트 발화 전수표** — 표면 × 이벤트 × 파라미터 × 발화 조건(가드·회차)
- 대상 표면 5: ① 포털 specs-v2 `portal/public/js/specs-funnel.js` ② 포털 headshot `portal/public/js/headshot.js` ③ idphoto-kr `public/{camera,result,thankyou}.js` ④ idphoto-jp 동 파일 ⑤ 크레딧 충전 표면(`portal/public/credits.html`, `idphoto-kr/public/charge.html`, `thankyou.html`)
- 각 행에 `service`·`market`·`spec_type`·`payment_provider`·`value`·`currency`·`transaction_id` 유무 기재
- **주의**: 파일 존재·grep 히트가 아니라 **실제 호출 경로**(어느 함수가 어느 조건에서 발화하는지)를 판독한다. 08-25 진단은 이 판독을 했고, 08-26 이후 변경분(f8ba3d03·34c38c70)이 반영됐는지 확인

**P0-B 측정 ID ↔ 스트림 판정** (F1)
- 코드상 ID 2개의 배치 전수(어느 표면이 어느 ID를 config하는지)
- 판정 방법: 작가님 GA4 관리 → 데이터 스트림 화면 확인이 정본. API 불가. → 보고서에 **"작가님 UI 확인 요청 항목"**으로 명시하고 막내 판단으로 단정하지 않는다
- 가설 병기: (가) 두 ID가 같은 스트림 (나) 한 ID가 타 속성/폐기 (다) 한 ID가 무응답. 각 가설이 참일 때 F3 hostName 데이터가 어떻게 달라지는지 서술

**P0-C 커스텀 측정기준 등록 현황** (F2)
- 코드가 보내는 커스텀 파라미터 전수 목록(P0-A에서 파생) vs GA4 등록 여부
- 판정 방법: Data API `run_report`에 `customEvent:{param}` 차원으로 조회 → 400이면 미등록. **양성 대조군 1회 필수**(등록된 것이 확실한 표준 차원 `hostName`으로 같은 쿼리가 200을 반환하는지). 0건·400 단독으로 판정 금지
- 등록은 SA(yong-a) `can_edit: false` → **작가님 GA4 관리 UI 작업**. 등록 요청 목록(파라미터명·범위 이벤트·설명)을 보고서에 표로 제출

**P0-D 브리핑 수집기 결함 판정** (F5)
- `daily_briefing.py:133-162` `FUNNEL_EVENTS`·`_fetch_ga4_funnel` 판독
- 결함 후보 3: ① 무료 트랙 이벤트 부재 ② hostName 미분리 ③ eventCount/totalUsers 혼용 여부
- 수정안 초안(코드 diff 형태로 보고서에 첨부, **적용 금지**)

**P0-E 결제 정본 대조** (F6)
- 최근 30일 실결제 건수: `scripts/credits.sh log 200` 경유(ch4 10조 — Firestore 직접 접근 금지) → 결제 유형별(토스 충전 / 레몬 / T1 직접결제) 집계
- 각 결제 유형이 어느 표면에서 완료되는지 P0-A와 대조 → **purchase 미발화 지점 특정**
- 08-25 ₩9,900 건이 어느 경로였는지 특정(충전 후 T1 사용 = 충전 표면에서 purchase가 나가야 하는지, 아니면 T1 사용 시점인지 — **정의 문제**로 작가님 결정 항목에 올린다)

**P0-F 배포 영향 판정**
- 수정 대상 파일별 배포 경로: `specs-funnel.js`가 엣지 정적 자산에 포함되는지(`edge/deploy.sh` 대상) vs 오리진 `portal/deploy.sh` vs `.github/scripts`(배포 불요)
- 이중 소스 경고 확인(references.md §서비스 매핑)

## 2.3 Phase 0 산출물
- `monkos-ops/ops/reports/2026-09/REPORT_20260902_iMac막내1_ANCHOR_GM1_퍼널계측_사전검수.md`
- 구성: §1 F1~F6 검증 결과(정합/반박, 근거 명령·파일:행) / §2 P0-A 전수표 / §3 P0-B~F 판정 / §4 **수정안 — 항목별 분리**(각 항목에 변경 파일·배포 경로·되돌림 방법·리스크) / §5 **작가님 결정 요청 항목**(GA4 UI 확인·커스텀 측정기준 등록·purchase 정의) / §6 Phase 1 착수 시 예상 세션 수
- 보고서 제출 = 세션 로그 어펜드 + PF_ANCHOR 히스토리 1행 + 커밋 `[research] G-M1 퍼널 계측 사전 검수 — F1~F6 판정·수정안 N항`
- **제출 후 정지.** 완료 보고 헤더에 "Phase 1 착수 승인 대기" 명기

# 3. Phase 1 — 구현 (작가님 승인 후에만)

- 승인된 항목만. 승인 시 번호로 지정된 항목 외 작업 금지(ch7 3조)
- 순서 원칙: **배포 불요 항목 먼저**(`daily_briefing.py` 수집기) → 오리진 코드 → 엣지 재배포 필요 항목
- 각 항목 커밋 분리(롤백 단위 = 커밋 단위)
- dev 배포 → 라이브 검증(ch5 7조): GA4 DebugView 또는 `run_report` 당일 데이터로 발화 실측. **계측 이벤트는 비멱등 — 2회 히트 규칙 적용 금지**, 로그·리포트로 판정
- **prod 배포·GA4 설정 변경 = ch1 7조 승인 게이트** → 턴 종료 후 새 사용자 턴 승인 수신 후 실행
- 산출물: `COMPLETION_20260902_iMac막내1_ANCHOR_GM1_퍼널계측_Phase1.md` (배포 rev·검증 방법 병기)

# 4. ⚠️ 준수 조항

- **헌법 4조 1항** — GA4 측정 ID는 이미 코드에 있는 공개값이라 기재 가능. SA 키·`GA4_PROPERTY_ID` 외 시크릿 값 접촉·생성·추측 금지
- **헌법 3조 1항** — 매 턴 `date`. 로그 어펜드는 date 출력 수령 후 별도 호출로만(09-02 3회 재발)
- **헌법 3조 2항** — Phase 0·1 각각 보고 파일. 터미널 출력만으로 보고 완료 간주 불가
- **ch4 10조** — 결제 데이터는 `scripts/credits.sh` 경유. `node -e`·gcloud firestore 금지
- **ch5 2조** — 배포는 `deploy.sh` 경유. `specs-funnel.js` 변경 시 엣지 재배포 여부 P0-F 판정에 따름
- **ch5 7조 / live-verify.md** — 0건·400 ≠ 부재. 양성 대조군 1회 선행. 과거 실측(민아 18:2x) 이월 금지, 보고 시점에 재측정
- **ch1 7조** — Phase 0→1 전환, prod 배포, GA4 설정 변경은 새 사용자 턴 승인. 같은 응답 안에서 질문+승인 자가 생성 금지
- **ch7 3조** — 지시서 범위 밖 작업 금지. 검수 중 발견한 별건 결함은 보고서 §7 "별건 발견"에 기재만
- **ch7 6조** — 막힘 시 PF_ANCHOR·PF_IDPHOTO 히스토리 선행 참조

# 5. 완료 기준

**Phase 0**
- [ ] F1~F6 각각 정합/반박 판정 + 근거 (파일:행 또는 실행 명령)
- [ ] P0-A 전수표 (5표면 × 이벤트 × 파라미터)
- [ ] P0-C 양성 대조군 기록
- [ ] P0-E `credits.sh log` 경유 집계 + purchase 미발화 지점 특정(또는 "정의 미확정"으로 결정 요청)
- [ ] 수정안 항목별 분리 + 되돌림 방법
- [ ] 작가님 결정 요청 항목 표
- [ ] REPORT 파일 + 세션 로그 + PF_ANCHOR 1행 + 커밋
- [ ] **정지** (Phase 1 미착수)

**Phase 1** (승인 후 별도 판정)
- [ ] 승인 항목만 구현, 커밋 분리
- [ ] 라이브 검증 방법 병기
- [ ] COMPLETION 파일

# 6. 커밋 메시지
- Phase 0: `[research] G-M1 퍼널 계측 사전 검수 — F1~F6 판정·수정안 N항·작가님 결정 요청 M항`
- Phase 1: 항목별 `[fix] ...` / `[ops] daily_briefing 퍼널 hostName 분리+무료 트랙 편입` 등 분리
