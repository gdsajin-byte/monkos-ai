---
type: report
date: 2026-10-28
device: iMac
agent: 쌍아-막내1
status: 마감
portfolio: PF_MONK_OS
---

# REPORT — '피할 것'의 실체 전수조사

**[2026-10-28 14:45 KST]** iMac/쌍아-막내1 → 쌍아·작가님

출처: `ORDER_20261028_iMac쌍아_막내1_MONK_OS_피할것_실체_전수조사.md`(작가님 14:34~14:39, 쌍아 경유). 읽기 전용 조사이며 판정은 쌍아가 합니다. 아래 성격 분류(🔴🟡⚪)는 수집 단계의 **후보**입니다.

**규모**
- 원천 수집: 헌법·법률 181항목, rules·commands·skills·agents 167항목, settings deny 16건, 훅 규칙 41건, 메모리 feedback 42+13건 — 총 약 460건
- 반복을 합치면 **실체는 약 75개 금지·게이트**입니다(§4 전수표).
- 그중 🔴 후보는 22개, 압축하면 **11개**입니다.

---

## 1. 진짜 피할 것 후보 (🔴만, 11개로 압축)

| # | 피할 것 | 대표 위치 | 근거 사고 | 차단 3선 대조 |
|---|---|---|---|---|
| R1 | **시크릿 값 생성·추측·노출·직접 등록** | 헌법 4조 1항(CLAUDE.md:111-114), ch4 11조(:600-630), R/data-access.md:97-101, deny 11~14, guard_bash E5, agents 공통 문구 5곳 | 01-14 발언(사고 아님). 10-21 INCIDENT 토큰 로컬 노출(외부 0) | ③ 침입 |
| R2 | **크레딧·고객 데이터 무단 변경 / Firestore 직접 접근** | ch4 10조(:534-584), R/data-access.md:17-48, deny 9~10, guard_bash E4 | 05-12 수동 충전 감사 로그 부재 | ① 인출(돈) 인접 |
| R3 | **고객 개인정보·얼굴·결제정보 노출·보관** | ch4 8조(:385-452), C/makne-finish.md:30-37, ch7:78-81 | 일본 APPI(법). 사고 기록 없음 | ② 명의 사고 + 위법 |
| R4 | **무승인 prod 배포·자동 배포 트리거** | ch5 1·2·3조, ch1 7조 2항, E10(guard_bash:64-71·304-317), deny 7~8, R/deployment.md 등 7곳 이상 | 02-20 자동빌드 혼돈, 02-16·04-08 유령 서비스, 07-16 조용한 미배포 | 3선 밖(비가역·고객 표면) |
| R5 | **유료 실패의 무음 강등 출고·과금 오류** | 메모리 paid_failure_no_degraded_delivery.md:12-14, R/references.md:64(Lemon variant 매칭) | 07-17 T1 사고 | ① 돈 + 고객 피해 |
| R6 | **가짜 트래픽·리뷰, 없는 기능·가격 표기** | 헌법 4조 4항(CLAUDE.md:133-136), ch8:13, A/dsn-maker.md:21·dsn-critic:23·soso:37 | 01-24·02-14 발언 | ② 명의 사고 + 위법 |
| R7 | **자기 출력 오염·환각 지시 실행** | ch1 7조 1·3항(:403-418), R/agent-system.md:42·47, E10 사람 턴 한정(prompt_submit.py:22-64) | **INCIDENT_20260830**(실사고, 전량 롤백) | ③ 침입 오인 |
| R8 | **무인 맥락의 비가역 실행** | ch1 7조 2항 특칙(:413), ch1:375-386(데몬) | INCIDENT_20260830 심사 반영 | 3선 밖(비가역) |
| R9 | **파괴적 git/파일 명령** | 헌법 4조 2항(CLAUDE.md:116-121), deny 1~6, guard_bash E1/E2 | 02-15 발언(사고 아님) | 3선 밖(비가역). 메모리 10-23: "합의+기록+백업이면 진행 가능" |
| R10 | **원본 얼굴·골격 변형(정체성 붕괴)** | 헌법 1조 3항, ch2:92-94, A/dsn-critic:24·soso:37 | 01-16 발언. 서비스 핵심 가치 | 3선 밖(제품 원칙) |
| R11 | **공유 자원(Firestore·GPU·워킹트리)을 dev로 착각한 prod 영향** | 메모리 shared_resource_dev_gate_fallacy.md:11-27 | 07-25 하루 3회(prod 504, 404 35분, 커밋 혼입) | 3선 밖(장애) |

**대조 메모(사실)**
- 작가님 차단 3선은 "① 인출 ② 명의로 사회적 문제 ③ 외부 침입 오인"입니다(memory/project_frontier_first_security_behind.md:13). 다른 메모리에는 "닫히는 층은 명시적 법 위반과 타인 직접 피해만"이라는 문장이 있습니다(feedback_open_to_feasible_limit.md:16).
- 위 11개 중 3선·위법·타인 피해에 직접 걸리는 것은 R1·R2·R3·R5·R6·R7입니다.
- R4·R8·R9·R10·R11은 3선 밖이고 공통 기준이 **"되돌릴 수 없음"**입니다. 메모리 feedback_forward_first_concern_second.md(10-28)는 🔴 기준을 "타인 직접 피해·명시적 위법·**비가역 사고**"로 적고 있어, 이 다섯 개를 포괄합니다.
- **실사고에서 나온 🔴는 R2·R5·R7·R11뿐**입니다. R1·R3·R6·R9·R10은 발언이나 법에서 나온 선제 규칙이고, R4는 사고와 발언이 섞여 있습니다.

## 2. 중복·과잉 목록

### 2-1. 같은 금지가 3곳 이상
| 금지 | 반복 수 | 위치 |
|---|---|---|
| 시크릿 금지(R1) | **약 15곳** | 헌법·ch4 11조·data-access·references·deny 4·훅 3·agents 5·secret-audit·메모리 2 |
| 승인=사람이 입력한 턴만 | **9곳+** | 헌법 1조 2항·ch1 7조·R/agent-system ×2·C/deploy-cf ×2·kku-context·session-start·A/soso + 훅 |
| deploy.sh 경유·gcloud 직접 금지 | **8곳** | ch5 2조·R/deployment·references·deploy-cr ×2·deny 2·guard_bash E3 |
| 0건·404 ≠ 부재 / 대조군 | **9곳** | ch5 7조·live-verify·deployment·reader·dsn-scout·record-explorer·mcp-tools·메모리 2 |
| Firestore 직접 금지(R2) | **7곳** | ch4 10조·data-access ×2·makne-guard·deny 2·훅 |
| 승인 게이트(비가역·prod) | 5곳 + ch1 | R/agent-system ×2·escalation·deploy-cf·deployment |
| 무인 맥락 금지 | 4곳 + ch1 | 같은 패턴 |
| PF 히스토리 갱신 | 5곳 + 헌법·ch3·훅(stop_check) | pf-ops·session-end·session-checkpoint·makne-finish·pf-declare |
| 월별 폴더 배치 | 4곳 + ch4 | session-log·makne-finish·session-end·session-checkpoint |
| 캐시 2회 히트 | 4곳 + ch5 | deployment·live-verify·deploy-cr·deploy-cf |

### 2-2. 문서 간 불일치·충돌 (실측 사실)
1. **에러 반복 중단 횟수**: R/makne-guard.md:18은 3회, C/escalation.md:12와 C/cdp-browser.md:103은 5회입니다.
2. **막내 마무리**
   - ch7:41-47·72-74는 "main 커밋 + `git push origin main`"을 필수로 둡니다.
   - 같은 ch7:29·48은 "main 머지 금지"입니다.
   - 하네스(백그라운드 세션)는 main 푸시가 금지돼 있어, 실제 운용은 "작업 브랜치 → 쌍아 병합"입니다(메모리 merge_makne_branch_is_ssanga_job.md, 10-28).
3. **PF 갱신 주체**: ch3:118-120은 "PF 갱신은 쌍아가 수행, 막내는 로그·COMPLETION"입니다. R/makne-guard.md:26-28과 C/makne-finish.md:39-45는 "막내가 PF 히스토리 1행"입니다.
4. **ch3:116-117**: "`git push` 자동 허용 설정이 있어야 함"이 전제 조건으로 적혀 있습니다. 현 settings allow는 `Bash(*)`입니다.
5. **ch6:11-12**: "별도 브랜치는 완료 시 main 머지 후 삭제, 지시서에 명시"라고 적혀 있습니다. 현행 worktree 운용(지시서에 브랜치 미명시)과 다릅니다.
6. **A/record-explorer.md**: :26에 "읽기 전용"이라 선언했지만 :4의 tools에 Bash가 들어 있습니다.
7. **ch1 7조 부칙(:424)**: "쌍아 14일 내 논스 훅 제안서, 미발행 시 2항 재심사"라고 돼 있습니다. 발행 여부는 미확인입니다(E10 토큰이 사실상 대체한 것으로 보이나 문서상 연결 없음).
8. **승인 예외 목록의 범위 차이**
   - ch1 7조 2항 예시(:412)는 9종 + "닫힌 목록 아님"입니다.
   - 메모리 merge_makne(10-28)의 "물을 것"은 5종입니다: 배포·prod 즉시 도달·과금·고객 데이터·거버넌스.
   - 차이 나는 항목은 패키지·CLI 설치, 전역 환경 변경, 저장소·계정 신설, 100건+ 일괄, 시크릿, 파괴적·금전 명령입니다.

### 2-3. 근거 사고 없는 ⚪
- `pbcopy` 금지(ch1:253, C/order-write.md:46-50): "VSCode 불안정"이라는 사유만 있습니다.
- 네이밍·한국어 우선·Tailwind 우선(ch2:24-52)은 초기 규칙입니다.
- ch6 브랜치 삭제·pull 권장(:11-24)
- `curl | sh` ask(guard_bash:75)
- Claude in Chrome 금지(C/cdp-browser.md:14): 이유는 있고 날짜는 없습니다.
- CI/CD 선제 제안 금지(메모리 pre_deploy_cross_verify)
- ch1 7조 4항 "방어력 부분적" 선언
- 리전 하드코딩 금지(R/deployment.md:38): 근거는 ch5 2조의 04-08 유령 서비스로 간접 연결돼 있습니다.
- 세션 이름 교정·옛 세션 알림(C/session-start.md:36-43): 10-02 운영 지시이고 사고는 아닙니다.
- dsn 시안 토큰·375px 규칙, health-check·model-check allowed-tools 한정

### 2-4. 실제 비용이 큰 것 (record-explorer 집계, 9~10월 세션 로그 grep 기준)
| 규칙 | 비용 사례 |
|---|---|
| **ch5 1조 3항 + E10(prod·monk.kr 배포 승인)** | 배지 분리 1건에 작가님 턴 7회(09-26). M2 작업분 2일 이상 미배포(09-19~21). 09-29·09-30 복구·배포 대기. 문장 속 승인 미발급 재요청 4회(09-30·10-26·10-27 ×2). 토큰 1회 소진 후 재승인(10-27) |
| E10 설계 결함·위조 실증 | 오발급 적발·삭제 3회(10-02·03). 위조 실증 지시서 1건 + 막내 세션 3개 + 로그 오염(10-04) |
| E9 커밋 형식 훅 | 로그 어펜드+커밋 묶음 전체 미실행 오탐 2회(10-01·10-02). 09-30 히어독 오탐 교정 |
| 세션 간 메시지 권한 모드 보류 | 작가님이 각 막내 터미널에서 직접 승인·붙여넣기(09-26) |
| 하네스 "main 푸시 금지" | 막내 산출 병합 대기(10-28 2회) — 우리 규칙이 아니라 실행 환경 규칙 |
| 꾸 배포 사유 서식 게이트 | 서식 문의 왕복, 위임 미발효(10-03) |
| 실행 환경 안전 분류기·PII 정책 | 응답 중단 2회·산출 0(10-04), credits 조회 차단(09-29) — 우리 규칙 아님 |
| **헌법 2조 3항·5조 4항** | 규칙 자체로 멈춘 기록은 미확인입니다. 단 메모리 forward_first_concern_second.md(10-28)에 같은 날 과잉 우려 4건(매팅 🔴 상신, 소송 원고 프레임, 약점 분류, 시안 경고)이 있습니다. 조문 집행이 아니라 모델 성향으로 기록돼 있습니다 |

**규칙이 사고를 실제로 막은 기록**: 08-30 INCIDENT는 막은 기록이 아니라 계기입니다. `git checkout --` 차단(10-01·10-24)은 쌍아가 "정상"으로 기록한 뒤 stash로 우회했습니다. 그 외 "막았다"는 기록은 grep 범위에서 찾지 못했습니다(미확인).

## 3. 헌법 조문별 관찰 — '정방향 우선'과의 접점 (사실만)

| 조항 | 문언 | 관찰된 사실 |
|---|---|---|
| 1조 2항 핵심 흐름 | "설계가 필요한 복합 작업은 ① 경유가 원칙"(CLAUDE.md:33) | 착수 전 지시서 단계가 1개 더 생깁니다. 10-28 하루 동안 ① 경로로 막내1에 지시 4건이 당일 완료돼, 지시서 단계 자체의 지연은 작습니다(본 세션 실측) |
| 1조 3항 정체성 보존 | "원본의 정체성 보존을 최우선 원칙" | 메모리 10-28 background_composite_is_industry_standard.md: 3항 취지가 **배경 합성까지 확장 해석**돼 매팅 제외를 권고한 오판이 교정됐습니다 |
| **2조 3항** | "코딩: 계획 제시 → 승인 → 실행"(CLAUDE.md:63) | ① 붙은 근거(01-12)는 "수정·대안 즉시 제시, 에러 묵과 금지" 발언이고, **계획→승인→실행 자체의 근거 발언은 붙어 있지 않습니다**. ② ch1:138은 작가님 직접 지시 시 승인이 "내재"된 것으로 봐 완화합니다. ③ 승인 단위(행위별/범위별)는 미규정이고, 메모리 09-27은 "범위 승인으로 이동"을 정했지만 조문은 그대로입니다 |
| 3조 1·2항 기록 | `date` 실측·append-only·PF | 정방향과 직접 충돌하지는 않습니다. 비용은 E11 훅 차단(본 세션 1회, 3분 미래)과 로그 오버헤드입니다 |
| **4조 1항** | "생성/추측 절대 금지, placeholder도 금지" | 메모리 10-23 constitution_art4_intent.md는 "추측 금지이지 안전한 생성 금지 아님"으로 해석을 교정했습니다. 문언 "생성 금지"가 넓게 읽힌 실례(10-22)가 있습니다 |
| 4조 2항 | 파괴적 명령 금지, "작가님 명시 요청 시에만 예외" | 메모리 10-23은 "합의+기록+백업이면 진행 가능"으로, 문언보다 넓게 엽니다 |
| **4조 4항** | "RAG/챗봇: 미출시·미확정 표현 금지. 되는 것만 응답" | 문언 대상은 RAG/챗봇입니다. 실제로는 시안(dsn-maker:21), specs 콘텐츠(메모리 specs_content_quality_bar), **기획 단계 아이디어**까지 확장 인용됐습니다. 09-15 민아가 "4조 4항 위반"으로 축 전체를 닫은 사례가 메모리 open_to_feasible_limit.md로 교정됐습니다 |
| **5조 4항** | "모든 지시 수령 시 **실행 전** 헌법·법률·기능 적합성 검토 필수. 작가님 직접 지시에도 적용"(CLAUDE.md:171) | ① 근거 원문(02-22)은 "문제의 소지가 있을시 반드시 체크할것"으로 **조건부**인데, 조문은 "모든 지시"로 **무조건**입니다. ② 검토의 산출 형식·분량은 미규정입니다. ③ 거절 시 형식은 메모리 10-25(조항→영향→대안, 훈계 금지)가 보충합니다 |
| **ch1 7조 2항** | 판정 기준 "비가역·prod·고객·과금·전역 환경" + 예시 9종 "닫힌 목록 아님"(:411-412) | ① 직접 계기인 08-30 사고의 대상은 **패키지 설치**였고, 예시 첫 항목입니다. ② "닫힌 목록 아님"이라 확장 해석 여지가 있습니다. ③ "헌법·법률·MEMORY·AGENTS 문서의 구조적 변경"도 게이트 대상이라, 개정 청구 실행 단계에서 다시 걸립니다(단서 :414는 "이미 통과한 개정의 집행" 제외). ④ 메모리 10-28 병합 예외 목록(5종)과 범위가 다릅니다(§2-2 #8) |

## 4. 전수표 (합본 — 반복은 한 행, 위치 전부)

약어: C=CLAUDE.md, chN=governance/laws/chN, R=.claude/rules, Cm=.claude/commands, A=.claude/agents, S=.claude/skills, H=scripts/hooks, D=settings.json deny, M=메모리 feedback_/project_ 파일. "쌍아 판단" 칸은 비워 둡니다.

### 4-1. 🔴 후보

| # | 항목 | 위치 | 성격 | 근거 사고 | 실제 비용 | 중복 | 쌍아 판단 |
|---|---|---|---|---|---|---|---|
| 1 | 시크릿 생성·추측·placeholder 금지 | C:111-114; ch4:615-620; R/data-access:97; M secret_key_ops:12-16 | 🔴 | 01-14 발언 | 10-22 "생성 금지" 확대 해석(M constitution_art4_intent) | R1 묶음 | |
| 2 | 시크릿 값 채팅·파일 노출 금지 / 서브에이전트 출력 금지 | ch4:615-620; R/data-access:98; A reader·writer·dsn-* :13; S/secret-audit:18; Cm/makne-finish:30-37 | 🔴 | 10-21 INCIDENT 토큰 로컬 노출 | 미확인 | R1 | |
| 3 | 시크릿 직접 등록 금지(`secret` 경유) | ch4:607-613; R/data-access:62-71; D 11-14; H guard_bash:51-56 | 🔴 | 06-23 프로토콜 | 작가님 실행 요청 1단계 | R1 | |
| 4 | `.env`·secrets/·deploy.sh 수정 전 승인 | C:112; H guard_write:91-95(ask) | 🔴 | 01-14 | 미확인 | — | |
| 5 | 파괴적 명령(rm -rf·force push·reset --hard·clean -f·checkout --) | C:116-121; D 1-6; H guard_bash:33-39 | 🔴 | 02-15 발언(사고 없음) | checkout -- 차단 → stash 우회 2회(10-01·10-24) | R9 | |
| 6 | Firestore 직접 접근 금지·credits.sh 경유 | ch4:534-538·579-584; R/data-access:17-18·41-48; R/makne-guard:34; D 9-10; H guard_bash:46-49 | 🔴 | 05-12 감사 로그 부재 | credits 조회 PII 차단(09-29, 환경 정책) | R2 | |
| 7 | 크레딧 변경은 지시 필수·사유 필수·감사 로그 append-only·delete dry-run | ch4:551-577; R/data-access:23-39 | 🔴 | 05-12 | 미확인 | R2 | |
| 8 | 데이터 등급·결제정보 마스킹·얼굴=생체정보 서버 미보관 | ch4:385-398 | 🔴 | APPI(법) | 미확인 | R3 | |
| 9 | CS 증빙 7영업일 삭제·user-reset 소프트 삭제·개인정보 처리방침 게시 | ch4:405-452 | 🔴 | 02-28·03-02 설계(법) | 미확인 | R3 | |
| 10 | 보고·로그에 개인정보·키·내부 IP 기재 금지 | ch7:78-81; Cm/makne-finish:30-37; Cm/session-end:29 | 🔴 | Git 영구 기록 사유 | 미확인 | R3 | |
| 11 | 자동 배포 트리거 금지(push≠배포) | ch5:10; R/deployment:16 | 🔴 | 02-20 자동빌드 혼돈 | 미확인 | R4 | |
| 12 | monk.kr 배포 = 작가님 승인 후 트리거·1승인 1회·흔적 서식 | ch5:11-21; R/deployment:17-20; Cm/deploy-cf:22-56; ch7:111; R/makne-guard:33; H guard_bash:64-71 | 🔴 | 09-19~24 5일 미배포(PETITION_20260924) | 09-26 작가님 턴 7회, 09-19~21 2일 대기, 문장 속 승인 재요청 4회 | R4 | |
| 13 | Cloud Run deploy.sh 경유·gcloud deploy 직접 금지 | ch5:45-56; R/deployment:36-44; R/references:69; Cm/deploy-cr:4-22; D 7-8; H guard_bash:41-44 | 🔴 | 02-16·04-08 유령 서비스, 07-16 조용한 미배포 | 미확인 | R4 | |
| 14 | `deploy.sh prod`는 작가님/쌍아, 막내는 [특별법] 시에만 | ch5:68-71; Cm/deploy-cr:33-34; Cm/makne-finish:68; ch7:29·48; H E10 | 🔴 | 02-22 합의 | 09-29·09-30 대기 | R4 | |
| 15 | 배포 게이트 6종·무음 강등 금지 | ch5:104-117; R/deployment:58-66; Cm/deploy-cr:41-45 | 🔴 | 08-25 무음 구본, 07-16, 09-24 | 미확인 | R4 | |
| 16 | 엣지 재배포 의무(specs 변경 시) | R/references:37·70 | 🟡~🔴 | 08-24 | 미확인 | R4 | |
| 17 | E10 승인 토큰: 사람 턴·단독 문구·approve.sh 에이전트 금지 | H prompt_submit:22-68; H _common:16-99; D 15-16; H guard_write:67-70; R/references:175-176 | 🔴 | 10-01 붙여넣기 2건, 10-02 세션 메시지 오발급 | 오발급 3회, 위조 실증(10-04), 재요청 4회 | R4·R7 | |
| 18 | 자기 출력 오염 금지·발각 시 중단→롤백→포렌식 | ch1:403-418; R/agent-system:42·47; Cm/escalation:55-64; R/makne-guard:19; ch7:149 | 🔴 | **INCIDENT_20260830** | 미확인 | R7 | |
| 19 | 승인 = 사람이 입력한 턴만(세션 메시지·통지·버튼 불인정) | C:29; ch1:409; R/agent-system:26·63; Cm/deploy-cf:17·22; Cm/kku-context:90; Cm/session-start:43; A/soso:44 | 🔴 | 10-01·10-02 오발급 | 09-26 권한 모드 보류로 작가님 직접 승인 | R7 | |
| 20 | 중대 지시 승인 게이트(비가역·prod·고객·과금·전역, 예시 9종) | ch1:407-414; R/agent-system:43-46; Cm/escalation:59-60; Cm/deploy-cf:26; R/deployment:18 | 🔴 | INCIDENT_20260830 | §2-4 배포 비용 대부분 | R4·R7 | |
| 21 | 무인 맥락 대상 행위 금지·데몬 전면 금지 | ch1:375-386·413; R/agent-system:45; Cm/escalation:61; Cm/deploy-cf:27 | 🔴 | 02-22·03-02, 08-30 심사 | 09-16 웹 민아 PR 머지 보류 → 작가님 1분 결정 | R8 | |
| 22 | 긴급 예외(P0, 민아 최소 수정) | ch1:188-197 | 🔴 | 03-29 | 미확인 | — | |
| 23 | 가짜 트래픽·리뷰 금지 / 시안에 없는 기능·가격·가짜 후기 금지 | C:133-136; A/dsn-maker:21; A/dsn-critic:23; A/soso:37 | 🔴 | 01-24·02-14 발언 | 미확인 | R6 | |
| 24 | 정체성(얼굴·골격) 보존 90%↑ | C:42-44; ch2:92-94; A/dsn-critic:24; A/soso:37 | 🔴 | 01-16 발언 | 10-28 배경 합성까지 확장 해석 → 교정 | R10 | |
| 25 | 유료 실패 무음 강등 금지·환불 동선 | M paid_failure_no_degraded_delivery:12-14 | 🔴 | 07-17 T1 | 미확인 | R5 | |
| 26 | Lemon variant 소속 스토어 매칭 | R/references:64 | 🔴 | 미확인 | 미확인 | R5 | |
| 27 | 공유 자원 dev 게이트 무효·코드 선배포→데이터 순서 | M shared_resource_dev_gate_fallacy:11-27 | 🔴 | 07-25 3회 | 07-25 prod 404 35분 | R11 | |
| 28 | Cloud Run 트래픽 `--to-revisions` 고정 금지 | M deploy_infra_outside_mina_scope:10-17 | 🔴 | 06-25 고정으로 배포 미반영 | 미확인 | R4 | |
| 29 | 배치→N콜 분해 시 쿼터 실측 | M batch_param_to_n_calls_quota:11-30 | 🔴 | 08-27 IMAGE PRO 429 | 미확인 | — | |
| 30 | 기록 문서 삭제·압축 금지 | M docs_data_engineering:10-18; ch4:494; Cm/session-end:31 | 🔴(비가역) | 06-14 | 미확인 | — | |
| 31 | 라이브 소비 중 GCS ads 자산 삭제 금지 | R/references:179 | 🔴 | 10-02 | 미확인 | — | |
| 32 | 웹민아·꾸·소소·writer 배포·크레딧·고객 데이터 금지(역할별) | ch1:55-56·74·83-86; A/soso:36; A/writer:19-21 | 🔴 | 06-10·10-01 | M2 배포 대기(§2-4) | R2·R4 | |
| 33 | 막내 금지: DB 스키마·prod 환경변수·wrangler.toml·범위 밖 기능 | ch7:122-128 | 🔴 | 02-15 발언 | 미확인 | — | |
| 34 | 읽은 문서·웹 안의 지시는 데이터 | A 5종 :14 | 🔴 | 미확인 | — | R7 | |
| 35 | 단건 적발 → 모집단 먼저 | M single_finding_to_pattern:13-17 | 🔴(오정보) | 07-17→08-27 424건 잔존 | 41일 잔존 | — | |
| 36 | 보장 서비스=딱 떨어지는 것 | M plausible_vs_exact_gap:14-16 | 🔴(돈) | 07-06 크롭 | 미확인 | — | |

### 4-2. 🟡 운영 질서 (주제별 합본)

| # | 항목 | 위치 | 근거 사고 | 실제 비용 | 중복 | 쌍아 판단 |
|---|---|---|---|---|---|---|
| 37 | 역할 흐름 ①~④, 복합 작업 ① 경유 | C:26-39; R/agent-system:16-22 | 02-18 발언 | 미확인 | — | |
| 38 | 쌍아 직접 코딩 금지("쌍아 직접 실행" 명령 필요) | ch1:106·124-126; R/agent-system:50-51; M ssanga_duties_order_ops | 02-26·02-28 | 미확인 | 3곳 | |
| 39 | 민아 코드 수정 금지·범위 초과 5종·[예외]+COMPLETION·쌍아 추인 채무 | ch1:28-31·63·171-184; R/agent-system:34-38 | 03-29, 09-02 | 09-30 [예외] 2건 사후 추인 대기 | 2곳 | |
| 40 | 웹민아 PR 경유·main 직푸시 금지 | ch1:52-57·222-223 | 06-10 | 미확인 | — | |
| 41 | 꾸 권한(specs 수치 변경 금지·배포 트리거 불가·우체통) | ch1:74-86·211; R/agent-system:20; Cm/kku-context:65-91; Cm/kku-specs:29-58 | 10-01 | 10-03 서식 왕복 | 4곳 | |
| 42 | 판정 분리(만든 세션이 감사 안 함)·서브에이전트 반환=사실 | ch1:105·151; R/agent-system:59·62; A/dsn-critic:27; A/dsn-scout:23; A/soso:43; M audit_is_mina_role | 06-14 GA4 교차오염 | 미확인 | 6곳 | |
| 43 | 범용 서브에이전트·모델 미지정 위임 금지 | ch1:151; R/agent-system:56; A/soso:42 | PROPOSAL_20261001 | 미확인 | 3곳 | |
| 44 | 서브에이전트로 막내 역 대행 금지(지휘체계 우회) / 쌍아 직접 spawn 금지 | ch1:145; M subagent_legitimate_use:12-38 | 09-02 표결 대행 무효 | 표결 전부 무효 | 2곳 | |
| 45 | 위임 기록 1행 | ch3:18; R/session-log:2; R/agent-system:60; A/soso:46 | 10-01 | 기록 오버헤드 | 4곳 | |
| 46 | 수신 측 실물 대조(origin·라이브) | ch1:232; R/agent-system:61 | 10-01 쌍아 오판 | 미확인 | 2곳 | |
| 47 | 지시서 형식(역할 선언·엔드라인·PF·출처 명기·링크 전달·수신 확인 게이트) | ch1:237-273·251-253; Cm/order-write:13-57 | 02-17·02-22·08-06 7일 방치 | 미확인 | 2곳 | |
| 48 | 에스컬레이션(에러 반복·모호·server.js·충돌) | ch7:141-149; R/makne-guard:18; Cm/escalation:12-45; Cm/cdp-browser:103 | 02-15·03 | **횟수 3/5 불일치** | 3곳 | |
| 49 | 의견 요청 ≠ 실행 승인 | ch7:147; Cm/escalation:49-51 | 03 반복 | 미확인 | 2곳 | |
| 50 | 헌법·법률 충돌 시 조항 인용→승인 대기 / [개헌]·[예외] | C:151-156·171-173; Cm/escalation:35-45 | 02-22 | 미확인(조문 집행 비용 기록 없음) | 2곳 | |
| 51 | 실행 전 적합성 검토 필수(5조 4항) | C:171 | 02-22 | 미확인 | — | |
| 52 | 계획 제시→승인→실행(2조 3항) | C:63; ch1:138 | 01-12(다른 취지) | 미확인 | — | |
| 53 | 수발신 헤더·`date` 실측·E11 시각 대조 | C:58·76-79; ch1:297·307-311; ch3:16·131; R/session-log:39-42; R/makne-guard:23; H time_header·guard_*·prompt_submit | 01-15, 10-24 미래 시각 4건 | 본 세션 E11 차단 1회 | 8곳+ | |
| 54 | 세션 로그 append-only·타 에이전트 로그 편집 금지·월별 폴더 | C:83; ch3:13-15; ch7:85-86; H guard_write:72-77; M session_log_concurrent_overwrite | 06-24 덮어쓰기 | 본 세션 Edit 차단 1회 → 정정 어펜드 | 6곳 | |
| 55 | 완료 보고 형식·COMPLETION 필수·보고=마지막 출력 | C:85-87; ch6:49; R/makne-guard:24-25; Cm/makne-finish:10-79 | 02-15 | 미확인 | 4곳 | |
| 56 | PF 갱신(pf.sh만·주체) | C:84; ch3:118-120; R/pf-ops:16-42; Cm/session-end·checkpoint·makne-finish·pf-declare; H stop_check:32-41 | 03-26 | **주체 불일치**(§2-2 #3). Stop 훅 경고 본 세션 2회 | 7곳+ | |
| 57 | 마감=push 완료·ahead 실측 | ch3:110-117; Cm/session-end:55-70 | 03-04 누락, 08-13 | 미확인 | 2곳 | |
| 58 | 커밋 형식 14종(E9) | ch6:34-37; R/git-safety:11-14; H guard_bash:213-242 | 07-16 현행화 | 오탐 2회 | 3곳 | |
| 59 | 막내 마무리 main push / main 머지 금지 | ch7:29·41-48·72-74 | 02-21 | **내부 충돌 + 하네스 금지**(§2-2 #2) | 1 파일 내 | |
| 60 | 문서 규격(네이밍 15종·YAML·README·정본 단일·docs 동결) | C:91-100; ch4 전반; R/session-log:19-54; R/references:3-17 | 02-22·03-08 | 미확인 | 4곳+ | |
| 61 | 발췌본 source 스탬프 | ch4:638-650 | 08-06 5개월 동결 | 미확인 | — | |
| 62 | 내부 기밀(호칭·엔진명) 외부 금지·MONKOS 표기·고객님 호칭 | C:124-127; ch8:10-13; R/branding:13-16; A/dsn-maker:22; A/dsn-critic:25; A/soso:38; M customer_facing_honorific | 01-12, 08-13 | 미확인 | 7곳 | |
| 63 | 챗봇 RAG "되는 것만" | C:134; ch8:13; R/branding:15 | 02-14 | 기획 단계 확장 적용(09-15 교정) | 3곳 | |
| 64 | 인프라 상수 정본 import·URL 빌더 경유 | ch2:75-78; R/coding:20; R/references:91·100; Cm/portal-context:64; Cm/specs-context:14-71 | 07-16 GSC 36.2%·가격 1/7 오표기 | 미확인 | 5곳 | |
| 65 | 라이브 검증(2회 히트·대조군·재측정·방법 기재) | ch5:131-146; R/live-verify 전체; R/deployment:70-74; Cm/deploy-cr:46; Cm/deploy-cf:64-78; M empty_output·briefing_claims | 08-24~26 오판 3건, 08-13 | 미확인 | 9곳 | |
| 66 | GA4 ID 실측 후 삽입 | R/references:106-107 | INCIDENT_20260903 | 81일 데이터 이탈 | — | |
| 67 | 도구 신설 3요건(인지·스모크·실패 가시화) | R/references:119-122; Cm/4060:93-97; Cm/market-eye:96-100 | 10-01 | 미확인 | 4곳 | |
| 68 | 세션 시작 절차(역할 판별·fetch·옛 세션 처리) | ch3:140-145; Cm/session-start:17-48 | 03-05·03-26 | 미확인 | 2곳 | |
| 69 | 레지스트리 편입 작가님 승인 | ch4:254-299; Cm/registry-add | 02-22 | 미확인 | 2곳 | |
| 70 | 새 프레임워크·스택 변경 설계+승인 | ch2:12-14·61-69; R/coding:16 | 03-14 | 미확인 | 2곳 | |
| 71 | 운용 메모리 교훈군(병렬 중복 확인·진행 작업 방향 파악·autostash·원격 클론 금지·롤백 단위=커밋·소비처 확인·작은 지시서) | M parallel_agent_overlap·grasp_inflight·shared_worktree_autostash·no_remote_clone·rollback_unit·verify_consumer_check·small_orders_basics_first | 각 06-22·06-25·10-02·06-23·08-24·07-24·10-24 | 06-22 1시간 중복 진단 등 | — | |
| 72 | 대화 형식 메모리군(한국어 전용·산문·보고 짧게·마감 권유 금지·고증 원문) | M korean_only·response_format·report_brevity·no_session_close·historical_claims | 10-01·09-27·10-26 | 미확인 | — | |

### 4-3. ⚪ 예방적 우려 (근거 사고 없음)

| # | 항목 | 위치 | 근거 | 중복 | 쌍아 판단 |
|---|---|---|---|---|---|
| 73 | pbcopy 금지 | ch1:253; Cm/order-write:46-50; M ssanga_duties | "불안정" | 3곳 | |
| 74 | 네이밍·한국어 우선·Tailwind | ch2:24-52; R/coding:17-19 | 초기 규칙 | 2곳 | |
| 75 | 브랜치 머지 후 삭제·pull 권장 | ch6:11-24 | 초기 규칙 | — | |
| 76 | `curl \| sh` ask | H guard_bash:75 | 없음 | — | |
| 77 | Claude in Chrome 금지 | Cm/cdp-browser:14·78 | 단일 세션 점유(날짜 없음) | — | |
| 78 | CI/CD 선제 제안 금지 / PF status 정리 제안 금지 | M pre_deploy_cross_verify; M pf_status_leave_active | 10-25(PF) | — | |
| 79 | 7조 4항 방어력 부분적 선언·부칙 논스 훅 | ch1:420-424; R/agent-system:48 | 08-30 계열 | 2곳 | |
| 80 | 디바이스 IP 대조 | ch1:294; R/agent-system:30; R/references:26 | 10-23 오판(사고이나 경미) | 3곳 | |
| 81 | 세션 이름 교정·시작 알림 | Cm/session-start:36-43 | 10-02 지시 | — | |
| 82 | 시안 토큰·375px·health/model-check 도구 한정·market-eye 재해석 금지 | A/dsn-maker:20-24; Cm/health-check; Cm/model-check; Cm/market-eye:10-93 | 일부 07-21·10-06 | — | |

### 4-4. "막지 말라/열어라" 교정 메모리 (과잉 방어 교정 — 대조용)

| 항목 | 위치 | 교정 대상 | 날짜 |
|---|---|---|---|
| 무조건 닫지 마라(위법·타인 피해만 닫힌 선) | M open_to_feasible_limit:8-16 | 4조 4항 일괄 폐쇄 | 09-15 |
| 4조 1·2항 취지(추측 금지·합의+기록+백업) | M constitution_art4_intent:13-17 | force push 금지 오판 | 10-23 |
| 기획엔 열고 출시엔 막기 | M license_warnings_at_launch:11-21 | 저작권·사행성 경고 | 10-23·10-25 |
| 정방향 먼저, 우려는 대비 칸 1~2줄 | M forward_first_concern_second:13-15 | 같은 날 과잉 우려 4건 | 10-28 |
| 배경 합성=업계 표준 | M background_composite_is_industry_standard | 매팅 🔴 상신 | 10-28 |
| 과잉 유보 금지·판단 먼저 | M fable_owner_level_output | 판단 회피 | 미확인 |
| 도구 한계 ≠ 판단 | M tool_limit_not_judgment:8-12 | 매매 불가를 판단으로 포장 | 09-19 |
| 유지보수·보안 과잉이 세션 소진 | M maintenance_session_drain:14-16 | 과잉 방어 | 미확인 |
| 서브에이전트 기능 활용 제약 없음 | M subagent_legitimate_use:12-28 | "봉쇄" 오독 | 06-06 |
| 막내 병합은 쌍아가 묻지 말고 | M merge_makne_branch_is_ssanga_job:13-15 | 병합 보류 | 10-28 |
| 첨단에서 실험·보안은 뒤에서 / 차단 3선 | M project_frontier_first_security_behind:11-13 | 통로 차단 | 10-01 |
| 승인 병목=범위 승인 | M project_approval_bottleneck_scope_gate:10-14 | 행위별 승인 턴 7회 | 09-27 |

→ 교정 메모리 12건 중 **7건이 10-23 이후**에 쌓였습니다. 교정 대상은 전부 조문 위반이 아니라 조문의 **확대 해석·선제 적용**입니다.

## 5. 한계

- 원천 4갈래는 위임 일꾼이 Read·grep으로 수집했습니다(위치 행 번호는 일꾼이 Read로 확인한 값).
- 성격 분류는 후보입니다. 합본 과정에서 막내1이 묶었습니다(약 460건 → 82행).
- 실제 비용은 9~10월 세션 로그 키워드 grep(18건)이고 전수 읽기가 아닙니다. 8월 이전 비용은 미조사입니다.
- `session_start.sh`·`pf_autolink.py`·`notify_blocked.py` 본문, INCIDENT·PETITION 원문 내용은 열지 않았습니다.
- monk-retrieval MCP 연결 실패로 의미 검색은 쓰지 못했습니다.
