---
type: portfolio
id: PF_AUTOPILOT
name: "AUTOPILOT"
subject: "GitHub Actions 접착 레이어 — CF↔CR 중계 + 시크릿 통합 + 에이전트 연결"
created: 2026-05-11
owner: 작가님
leads: "쌍아(설계), 막내(구현)"
status: active
domain: 인프라
---

# PF_AUTOPILOT — 접착 레이어

> CF(정적)와 Cloud Run(엔진)은 완전 분리됐다. 둘 사이를 잇는 건 Git뿐.
> GitHub Actions는 그 Git 위에서 동작하는 **접착제** — 배포 중계, 시크릿 통합, 레포 간 연결, 웹↔로컬 에이전트 연결.

---

## 1. 비전

**"분절된 인프라와 에이전트를 Git 위에서 잇는 중계 레이어"**

### 왜 이것을 하는가

- **CF↔CR 분리 확정**: monk.kr(CF Pages, 정적) / monkos.ai(Cloud Run, 엔진) — 배포 라인이 완전히 다름. CF에서 CR 배포를 건드리면 걸리적거림 (레포 분리 시 확정된 교훈)
- **연결점은 Git뿐**: 두 인프라를 관통하는 유일한 공통 기반이 Git. GitHub Actions는 그 Git 이벤트에 반응하는 자동화 레이어
- **시크릿 분산**: `.env`(로컬 4대) + GCS + Cloud Run 환경변수 + CF Dashboard — 4곳 분산, 인벤토리 없음
- **멀티 레포 전환 시점**: 현재 모노레포 → 서비스별 분리 시 레포 간 연결점 필요
- **에이전트 분절**: 웹 에이전트(Managed Agents/Routines)와 로컬 에이전트(Claude Code)가 각각 독립 실행 — 핸드오프 경로 없음
- **PF_BRIEF 한 달 교착**: 실행 엔진 없이 Claude 로컬 세션에만 의존 → Phase 0 정체

### 성공 지표

| 지표 | 시작점 | 4주 목표 | 12주 목표 |
|------|--------|---------|----------|
| 시크릿 인벤토리 | 없음 | 전수 등록 | 자동 갱신 |
| Actions 워크플로우 | 0개 | 3개 | 6개+ |
| 배포 자동화 커버리지 | 0% | CR 스테이징 1건 | CF+CR 전체 |
| 에이전트 핸드오프 | 수동 (세션 시작 시 pull) | 자동 Issue 알림 | 풀 파이프라인 |
| 데일리 브리핑 자동 발행 | 0건 | 매일 1건 (GA4+GSC) | 3축 완전 자동 |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 04/10 | 작가님 | PF_BRIEF 발족 — 데일리 브리핑 구상 | PF_BRIEF.md | ✅ |
| 04/10 | 쌍아 | PF_BRIEF Phase 0 설계 + /schedule PoC 시도 → curl 차단으로 교착 | PF_BRIEF.md | ⚠️ |
| 04/11 | 민아 | PF_BRIEF 근본 원인 재진단 — 3개 이질 문제를 "curl 차단"으로 뭉친 오진단 판명 | 세션 로그 | ✅ |
| 05/10 | 모바일/막내 | GitHub Actions 기반 일일 보고서 7단계 설계 완료 — SA 재활용 확인 | 모바일 세션 | ✅ |
| 05/10 | 모바일/막내 | GitHub Secrets 격리 구조 설명 — 헌법 4조 1항 준수 확인 | 모바일 세션 | ✅ |
| 05/11 | 작가님 | **통합 PF 발족 지시** — GitHub Actions + Managed Agents + Routines + 시크릿 통합 | — | ✅ |
| 05/11 | 쌍아 | PF_AUTOPILOT 초안 — 3대 엔진 병렬 설계 | PF_AUTOPILOT.md v1 | ✅ |
| 05/11 | 작가님 | **아키텍처 확정** — Actions는 CF↔CR 접착제. 배포 중계 + 시크릿 통합 + 멀티레포 연결 + 에이전트 연결 | — | ✅ |
| 05/11 | 쌍아 | PF_AUTOPILOT v2 — 접착 레이어 재설계 | PF_AUTOPILOT.md v2 | ✅ |
| 05/11 | 쌍아 | 시크릿 전수 파악 — .env 35개 + CF 12개 + SA 3개. 누락 11건 발견 | SECRET_INVENTORY.md | ✅ |
| 05/11 | 쌍아 | GitHub Secrets 3개 등록 (GCP_SA_KEY, GA4_PROPERTY_ID, GSC_SITE_URL) + 로컬 키 즉시 삭제 | gh secret list | ✅ |
| 05/11 | 쌍아 | SA 권한 실측 — roles/editor가 GA4+GSC API 이미 커버 확인. 콘솔 작업 불필요 | impersonation 테스트 | ✅ |
| 05/11 | 작가님 | **PF_BRIEF + PF_SECURITY 병합 지시** — AUTOPILOT으로 통합 | — | ✅ |
| 05/11 | 쌍아 | PF_BRIEF → completed (merged). PF_SECURITY → completed (merged). AUTOPILOT에 보안 Phase 편입 | PF 3건 갱신 | ✅ |
| 05/11 | 쌍아 | 지시서 2건 동시 발행 — ①막내1: PF 양식 정비 ②막내2: 데일리 브리핑 Actions 구현 | ORDER 2건 | ✅ |
| 05/11 | 막내1 | PF 양식 정비 — 폴더형 승격 + 9섹션 구조 정합 + devlog 뼈대 + SPEC 분리 | PF_AUTOPILOT/ | ✅ |
| 05/11 | iMac/막내2 | Phase 2 데일리 브리핑 구현 — daily_briefing.py 4축 + workflow + 라벨 + workflow_dispatch 성공. Issue #1 자동 생성 | .github/scripts/, BRIEFING_20260510.md | ✅ |
| 05/11 | iMac/막내3 | Phase 2 보정 리서치 — 4건 이슈 조사 완료. 기업마당 공식 API 발견, RSS 날짜 파싱 오류, Anthropic RSS 부재(커뮤니티 피드 대안), GSC 3일 지연 사양 확인 | REPORT_20260511_막내3_브리핑스크립트_보정리서치.md | ✅ |
| 05/11 | iMac/막내3 | Phase 2 보정 실행 — 4건 코드 수정 + workflow_dispatch 재실행 검증 완료. 기업마당 API 전환, RSS 날짜 파싱, Anthropic 커뮤니티 RSS, GSC days=3 + 0값 방어 | BRIEFING_20260508.md (보정 검증) | ✅ |
| 05/11 | iMac/막내3 | R&D 마감 알림 + PF 대시보드 주간 워크플로우 구현 — rnd_deadline_check.py + pf_dashboard.py + weekly-dashboard.yml + 라벨. Issue #3 자동 생성 검증 완료 | .github/scripts/, Issue #3 | ✅ |
| 05/11 | iMac/막내2 | 텔레그램 알림 허브 — telegram_notify.py + notify.yml(reusable) + daily-briefing.yml 연동. Secrets 2개 등록 + 봇 교체(CS→팀) + HTML 모드 전환. 풀 체인(브리핑→Issue→텔레그램) 검증 완료 | telegram_notify.py, notify.yml, Issue #5 | ✅ |
| 05/11 | iMac/막내1 | works submodule 자동 동기화 Action — sync-works.yml + PAT_TOKEN 교차 레포 접근. workflow_dispatch 검증 성공 (변경분 자동 커밋 확인) | sync-works.yml | ✅ |
| 05/11 | 4060/쌍아 | n8n 전수 조사 — 워크플로우 0개 확인. 팩토리 봇은 Firebase Functions 운용 | REPORT | ✅ |
| 05/11 | iMac/쌍아 | 팩토리 봇 체계 발굴 — notify.ps1 + Firebase(notifyWriter/updateAiStatus/getCommands). 텔레그램 4봇 체계 전수 정리 | — | ✅ |
| 05/11 | 작가님 | **PF_FACTORY 발족** — 4060 GPU 팩토리 PF 분리. AUTOPILOT(클라우드) ↔ FACTORY(로컬 GPU) 짝 구조 확정 | PF_FACTORY.md | ✅ |
| 05/12 | iMac/막내1 | Phase 2 품질 보정 2차 — 노이즈 제거 6건 (날짜 표기, URL 디코딩, SEO Known Issues, RSS 키워드 필터, 피드 정체 경고, 소규모 절대수치). workflow_dispatch 검증 완료 | BRIEFING_20260509.md (보정) | ✅ |
| 05/12 | iMac/쌍아 | **날짜 불일치 버그 수정** — daily-briefing.yml의 Issue/텔레그램 step이 yesterday(5/10) 참조하여 옛날 브리핑 발송. GITHUB_OUTPUT으로 target_date 전달 방식 전환 | `a9b9adcb` | ✅ |
| 05/12 | iMac/쌍아 | **채널 전환** — 팀봇(@monkos_team_bot)→팩토리봇(@monkos_factory_bot), 팀챗→작가님DM. GCP Cloud Functions에서 토큰 추출 → GitHub Secrets 갱신 | SECRET_INVENTORY.md | ✅ |
| 06/02 | 막내1 | **[검증] PF 현행성 검증** — Phase 2(6항목 중 5항목 완료) 및 Phase 3(5항목 중 2항목 완료)이 Phase 테이블에 ❌로 잔류 발견. Phase 현황 현행화 | 광역오더 #1 | ✅ |
| 06/02 | 막내1 | **deploy.sh CWD 결함 전수 수정** — 5개 서비스(idphoto-kr/jp, portal, studio, monk_imagen4) `gcloud builds submit` 직전 `cd "$SCRIPT_DIR"` 추가. jp Dockerfile kr 주석 잔재 정정. 6/2 jp 오배포 INCIDENT 재발 방지 | `6034fa1f` | ✅ |
| 06/02 | iMac/쌍아 | **gdocs 토큰 중앙화 (광역오더 #7-A)** — iMac 정본 token.json → GCP Secret Manager `MCP_GDOCS_TOKEN` + GitHub Secrets 3종(stdin 파이프, 값 무노출). `gdocs_mcp.sh`에 부재 시 GCP 자동복원 로직 추가. 삭제→복원 **바이트 동일·권한 600** 검증. 타 디바이스 무인증 동작 확보 | gdocs_mcp.sh, COMPLETION | ✅ |
| 06/02 | iMac/쌍아 | **iMac .env 실측 + 인벤토리 현행화 (광역오더 #7-B)** — 유니크 34개 재집계(CF_WORKERS_AI_TOKEN 중복·CHAT 2종 편입·N8N iMac부재). SECRET_INVENTORY §J GCP Secret Manager 신설. M1 실측 비교는 작가님 M1 직접 pull로 이관 | SECRET_INVENTORY.md | ⏳ |
| 06/03 | iMac/쌍아 | **.env 시크릿 하이브리드 표준 적용 + GCP 일괄 등록 (광역오더 #8)** — 정본 34종을 시크릿24/설정10 분류. 시크릿 24종 GCP Secret Manager 등록(변수명 그대로, stdin 파이프 값무노출) + 해시 정합 24/24 검증. **CF_WORKERS_AI_TOKEN dead placeholder 규명**(`붙여넣기` 2행·코드 미참조)→GCP·.env 완전 제거. N8N 위치 확정(iMac .env 존재). SECRET_INVENTORY §0 표준 명문화. M1 갭 동기화는 M1 offline으로 추후 | SECRET_INVENTORY.md, COMPLETION | ✅ |
| 06/10 | 웹/민아 | 데일리 E2E 루틴 시범 가동 — 리포 기반 사이클 ✅, 외부 프로브·GSC 라이브 ❌(네트워크 정책·자격증명). 4/10 curl 차단 정체 확정. 루틴 지시문 draft + 선결 과제 3건 | REPORT_20260610_웹민아_데일리E2E시범가동.md | ⚠️ |
| 06/10 | 웹/민아 | 루틴 자립 인증·시크릿 기획 — 필요 스코프 전부 읽기 전용 실측(현행 editor SA 과잉 판정). 전용 읽기 SA 신설 + 부트스트랩 1키 + allowlist 전수 + 스크립트 드롭인 재사용 설계. 🟡 BIZINFO_API_KEY 하드코딩 발견 | PROPOSAL_20260610_웹민아_루틴자립_인증시크릿설계.md | ⏳ |
| 06/10 | 작가님+웹/민아 | **SA 전략 전환: 신설→축소** — yong-a 소비처 전수 실측, Cloud Run 실행 SA 별개 확인 → editor 제거가 가동 서비스 무관 확정. 기획서 3-1 개정(editor 제거+secretAccessor 추가+웹용 별도 키+검증 절차). 4/22 감사 MED#5·SECRET_INVENTORY 🔴 동시 해소 경로 | PROPOSAL 개정판 | ⏳ |
| 06/10 | 작가님+쌍아+웹/민아 | **SA 축소 이행 완료** — IAM Recommender 실측(편집자 11,665권한 중 사용 1개) → editor 제거. 새 키 발급(c1b7e5a7)+GCP SM 정본 등록+GH Secrets 교체+로컬 삭제(쌍아). 스모크 workflow_dispatch run 27264748215 **success 47초**(웹/민아 독립 검증). allowlist 구글 API 4종 개통 실측. 잔여: 구키 2개 삭제, 자사 도메인·텔레그램 allowlist, 루틴 1회차 | 런 27264748215 | ✅ |
| 06/10 | 작가님+웹/민아 | **루틴 "민아 일일 브리핑" 가동 개시** — 1회차(저장소 미연결, 우아한 실패) → 설정 보정 → 2회차 **합격**: 6단계 중 5단계 정상(브리핑 해석·전일 정산·메일/캘린더 트리아지·보안 순찰·TODO 제안 5건). 실질 발견: AUTH_SECRET 미배포, Google Business 게시물 삭제 통지. BRIEFING_E2E_20260610 → PR #48. 잔여: 루틴 환경 allowlist(외부 프로브·bizinfo). 매일 07:00 KST 정기 가동 | BRIEFING_E2E_20260610.md, PR #48 | ✅ |
| 06/12 | 웹/민아 | **루틴·브리핑 품질 평가 (작가님 직접 지시)** — 3회분 실측 8축 채점: 콘텐츠 상급, 병목=전달 체계(드래프트 PR 적체·지표 랙 4일·중복 트리거). 개선 7건(P0 납품 SLA·PR 적체=가드 순환결함 / P1 3줄 요약·무음실패 가드 / P2 GH Actions D-1 단축 등). 웹 GSC MCP 로컬 ADC 의존 ENOENT 재현 — 선결과제 #2 미해소 확정 | [REVIEW](../../reports/2026-06/REVIEW_20260612_웹민아_루틴브리핑_품질평가.md) | ✅ |

---

## 3. Phase 현황

### Phase 0 — 시크릿 정비 + Actions 기반 ✅ 완료 (05/11)

> 접착제를 붙이려면 먼저 접착면을 정리해야 한다. 시크릿 인벤토리 + GitHub Secrets + SA 정비.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 시크릿 인벤토리 작성 (전수 파악) | ✅ | 쌍아 | SECRET_INVENTORY.md (누락 11건 보정) |
| SA 결정: yong-a-orchestrator 통합 관리 | ✅ | 작가님 | 권한 조정 별도 진행 |
| GitHub Secrets 등록 (GCP_SA_KEY, GA4_PROPERTY_ID, GSC_SITE_URL) | ✅ | 쌍아 | gh secret set 완료 + 로컬 키 즉시 삭제 |
| SA 권한 부여 (GA4 뷰어 + GSC 읽기) | ✅ | — | roles/editor가 이미 커버. 실측 확인 완료 |
| `.github/workflows/` 생성 + 시크릿 누출 방지 Action | ✅ | 쌍아 | secret-scan.yml 배치 완료 |
| PF_SECURITY 병합 완료 — SA 재설계는 Phase 5 | ✅ | 쌍아 | PF_BRIEF + PF_SECURITY → AUTOPILOT |

### Phase 1 — 배포 중계 + 멀티레포 연결

> CF↔CR 배포 파이프라인 자동화. 멀티레포 전환 대비 레포 간 이벤트 전파.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| CR 스테이징 자동 배포 (monkos_AI/ 변경 PR 트리거) | ❌ | 막내 | deploy.sh 경유 원칙 유지 |
| works submodule 자동 갱신 (한송이 push → 본진 반영) | ✅ | 막내1 | sync-works.yml (6시간 cron + PAT_TOKEN) |
| 배포 결과 통합 알림 (Issue 또는 텔레그램) | ❌ | 막내 | |
| 멀티레포 이벤트 전파 설계 (repository_dispatch) | ❌ | 쌍아 | 분리 시점 대비 |

### Phase 2 — 데일리 브리핑 (PF_BRIEF 흡수) ✅ 완료 (05/11~05/12)

> 축1(성과) + 축2(교정) 자동화. 모바일 막내 설계 기반.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| `daily_briefing.py` (GA4+GSC+RSS 4축) | ✅ | iMac/막내2 | `05/11` + 보정 2차 (`05/12`) |
| `daily-briefing.yml` (cron + workflow_dispatch) | ✅ | iMac/막내2 | 날짜 전달 버그 수정 `a9b9adcb` |
| GitHub Issue 자동 생성 (라벨: 일일보고) | ✅ | iMac/막내2 | Issue #1 생성 확인 |
| SEO 자동 순회 (HEAD/hreflang/canonical/404) | ❌ | 막내 | Playwright headless — 미착수 |
| 브리핑 md 적립 (`monkos-ops/ops/briefings/`) | ✅ | iMac/막내2 | BRIEFING_YYYYMMDD.md 자동 생성 |
| PF_BRIEF → completed 전환 | ✅ | 쌍아 | 05/11 병합 완료 |

### Phase 3 — 에이전트 연결 (웹↔로컬) 🔄 부분 완료

> Managed Agents / Routines의 산출물을 Actions가 중계하여 로컬 에이전트에 전달.

| 항목 | 상태 | 담당 |
|------|------|------|
| Managed Agents → git commit → Issue 생성 파이프라인 | ❌ | 쌍아(설계) + 막내 | 미착수 |
| Routines → 파일 적립 → Actions 후처리 트리거 | ❌ | 쌍아(설계) + 막내 | 미착수 |
| 뉴스 크롤링 자동화 (정부자금/AI 모델/업계) | ❌ | 막내 | 미착수 |
| 텔레그램 알림 허브 | ✅ | iMac/막내2 | `05/11` telegram_notify.py + notify.yml + 봇 전환 |
| R&D 마감일 알림 (PF_RND 연동) | ✅ | iMac/막내3 | `05/11` rnd_deadline_check.py + Issue #3 |

### Phase 4 — 자율 운용

| 항목 | 상태 | 담당 |
|------|------|------|
| 이상 감지 → 지시서 초안 자동 생성 | ❌ | 설계 필요 |
| 경쟁사 모니터링 | ❌ | 설계 필요 |
| 웹 에이전트 → Actions → Routines 풀 파이프라인 | ❌ | 설계 필요 |

### Phase 5 — SA 권한 재설계 (← PF_SECURITY 병합)

> yong-a 단일 과다권한 → 축별 최소권한 분기. 기준선: [GCP 감사 보고서](../../reports/REPORT_20260422_GCP_Firebase_인프라감사.md)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| yong-a 권한 해부 (축별 실제 사용 건수) | ❌ | 막내 | Cloud Audit Log 30일 |
| USER_MANAGED 키 3개 물리 위치 확인 | ❌ | 막내 | |
| 축별 SA 분기안 설계 | ❌ | 쌍아 | impersonation 체인 포함 |
| 전용 SA 생성 + 역할 재부여 | ❌ | 막내 | 서비스별 순차 |
| 구 키 폐기 + yong-a editor 축소 | ❌ | 막내+작가님 | 최종 단계 |

---

## 4. 성과

> 실측 데이터. 측정일 명시. 추정 금지.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| — | — | — | 발족 직후 |

---

## 5. 복기

### 교훈 0: PF_BRIEF의 한 달 교착 (04/10 ~ 05/11)

**현상**: PF_BRIEF가 Phase 0에서 한 달간 정체. `/schedule` PoC 실패 후 후속 없음.
**원인**: ① 쌍아가 3개 이질 문제를 "curl 차단"으로 뭉쳐 오진단 ② 대안 엔진(GitHub Actions) 미검토 ③ 시크릿 관리 체계 부재로 GCP 인증 경로 자체가 없었음
**대응**: Actions를 접착 레이어로 도입. 수집은 Actions, 판단은 Claude — 역할 분리.

### 교훈 1: CF↔CR 완전 분리의 교훈

**현상**: CF에서 CR 배포를 건드리면 배포 라인 충돌.
**원인**: CF Pages와 Cloud Run은 배포 메커니즘이 근본적으로 다름.
**대응**: 각자 최강 영역에 집중 (CF=정적, CR=엔진). 둘 사이 연결은 Git+Actions 접착 레이어로만.

### 교훈 2: 시크릿 분산 방치

**현상**: `.env` 4대 + GCS + Cloud Run + CF — 4곳 분산. 인벤토리 없음.
**원인**: "돌아가고 있으니" 관성. PF_SECURITY blocked 상태 방치.
**대응**: Phase 0에서 인벤토리 작성 + GitHub Secrets 중앙화. PF_SECURITY 동시 해소.

---

## 6. 관련 문서 인덱스

> 이 PF에 귀속된 산출물 링크.

### 기안서 (PROPOSAL)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| 본 PF | 쌍아 | PF_AUTOPILOT 발족 — 접착 레이어 설계 | ✅ |

### 기술명세 (SPEC)

| 파일 | 주체 | 내용 |
|------|------|------|
| [SPEC_ARCHITECTURE.md](SPEC_ARCHITECTURE.md) | 쌍아 | 아키텍처 다이어그램 + 4대 역할 + PF_BRIEF 흡수 매핑 |

### 보고서 (REPORT)

| 파일 | 주체 | 내용 |
|------|------|------|
| [SECRET_INVENTORY.md](../../SECRET_INVENTORY.md) | 쌍아 | 시크릿 전수 인벤토리 (.env 35개 + CF 12개 + SA 3개) |
| [GCP 감사 보고서](../../reports/REPORT_20260422_GCP_Firebase_인프라감사.md) | 막내1 | Phase 5 기준선 — SA 6건·USER 키 3건 실측 |

### 지시서 (ORDER)

| 파일 | 수신 | 내용 | 상태 |
|------|------|------|------|
| [ORDER_20260511_막내1_PF정비](../../orders/2026-05/ORDER_20260511_iMac쌍아_막내1_AUTOPILOT_PF정비.md) | 막내1 | PF 양식 정비 + 폴더형 승격 | ✅ |
| [ORDER_20260511_막내2_브리핑](../../orders/2026-05/ORDER_20260511_iMac쌍아_막내2_데일리브리핑_Actions구현.md) | 막내2 | 데일리 브리핑 Actions 구현 | ⏳ |

### 병합 PF (히스토리 보존)

| PF | 관계 | 비고 |
|----|------|------|
| [PF_BRIEF](../PF_BRIEF.md) | ✅ 병합 완료 | 데일리 브리핑 = Phase 2 출력 |
| [PF_SECURITY](../PF_SECURITY/README.md) | ✅ 병합 완료 | SA 권한 재설계 = Phase 5 편입. 기준선: [GCP 감사 보고서](../../reports/REPORT_20260422_GCP_Firebase_인프라감사.md) |

### 수혜 PF

| PF | 수혜 내용 |
|----|----------|
| PF_CITADEL | SEO 모니터링 자동화 |
| PF_RND | 마감일 알림 |
| PF_SPREAD | 콘텐츠 소재 뉴스 |

### 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| — | 05/11 | Phase 0 커밋 (본 정비 완료 후 기록) |

---

## 7. devlog (R&D 개발 노트)

> 기술 판단의 맥락과 실험 과정을 축적한다.
> 상세: [devlog/README.md](devlog/README.md)

| # | 질문 | 시기 | 핵심 판단 | 상태 |
|---|------|------|----------|------|
| — | — | — | 착수 대기 | — |

---

## 8. 사업화 프레임

> 인프라 PF — 직접 수익 창출이 아닌 전체 서비스의 운영 효율화 기여.

### 차별성 — 뭐가 다른데?

| 차별점 | 우리 | 일반 |
|--------|------|------|
| Git 기반 멀티 인프라 접착 | CF+CR+에이전트를 Actions로 연결 | 인프라별 독립 CI/CD |
| 시크릿 중앙화 | GitHub Secrets + 인벤토리 정본 | 디바이스별 .env 분산 |
| 에이전트 핸드오프 | 웹↔로컬 자동 중계 | 수동 pull/세션 의존 |

**핵심 MOAT**: MONK 특유의 멀티 디바이스 + 멀티 에이전트 구조에 최적화된 접착 레이어. 범용 CI/CD로는 에이전트 핸드오프를 구현할 수 없음.

### 사업 모델 — 어떻게 돈 버는데?

| 수익 경로 | 메커니즘 | 현재 상태 |
|----------|---------|----------|
| 운영 비용 절감 | 수동 배포·진단·수집 시간 제거 | 계획 |
| 브리핑 자동화 → 의사결정 속도 | 오전 1시간 → 10분 | 계획 |

### 수익 전망 — 얼마 벌 거 같아?

| 항목 | 현재 | 6개월 후 | 12개월 후 |
|------|------|---------|----------|
| 운영 시간 절감 (주간) | 0h | 5h+ | 10h+ |

### 확장성 — 더 커질 수 있어?

| 확장 축 | 방향 | 난이도 | 기대 효과 |
|---------|------|--------|----------|
| 멀티레포 전환 | 서비스별 독립 레포 | 중 | 배포 격리 + 팀 분업 |
| 에이전트 자율 운용 | Phase 4 풀 파이프라인 | 높 | 무인 운영 |
| R&D 지원사업 연동 | PF_RND 마감 알림 | 낮 | 공고 놓침 방지 |

---

## 9. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| Actions 무료 쿼터 초과 | 낮음 | 월 30분 수준. 2000분 대비 1.5% |
| Managed Agents 안정성 미검증 | 중 | Phase 3 배치. Phase 0~2에서 Actions 검증 선행 |
| 멀티레포 전환 시 워크플로우 재설계 | 중 | Phase 1에서 repository_dispatch 패턴 선행 설계 |
| SA 키 관리 사고 | 낮음 | GitHub Secrets 격리 + 인벤토리 + 권한 최소화 |
| 브리핑 노이즈 | 높음 | 임계값 기반 이상 감지만 보고. 정상=무보고 |
