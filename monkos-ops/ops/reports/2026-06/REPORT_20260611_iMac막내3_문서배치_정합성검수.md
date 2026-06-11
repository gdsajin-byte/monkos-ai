---
type: report
date: 2026-06-11
device: iMac
agent: 막내3
from: iMac/막내3
to: iMac/쌍아
portfolio: PF_MONK_OS
order: ORDER_20260611_iMac쌍아_막내3_문서배치_정합성검수
status: completed
result: partial
---

# 문서 배치 정합성 검수 보고서

**[2026-06-11 12:39 KST] iMac/막내3 → iMac/쌍아**

---

## Task 1: 최근 산출물 배치 검수 (전수)

### 1-A: 월별 폴더 미준수 — 11건 발견

sessions/ 루트에 직접 배치된 파일. ch4 4조 "sessions/ 루트에 직접 파일을 배치하지 않는다" 위반.

| # | 파일명 | 현 위치 | 이동 대상 | 우선순위 |
|---|--------|--------|----------|---------|
| 1 | `2026-05-25_iMac_막내1.md` | `sessions/` 루트 | `sessions/2026-05/` | 즉시 |
| 2 | `2026-06-05_iMac_쌍아.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 3 | `2026-06-05_iMac_막내1.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 4 | `2026-06-05_iMac_막내2.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 5 | `2026-06-05_iMac_막내3.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 6 | `2026-06-06_iMac_쌍아.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 7 | `2026-06-07_iMac_쌍아.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 8 | `2026-06-08_4060_쌍아.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 9 | `2026-06-08_iMac_민아.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 10 | `2026-06-09_iMac_민아.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |
| 11 | `2026-06-11_iMac_막내1.md` | `sessions/` 루트 | `sessions/2026-06/` | 즉시 |

reports/, orders/, incidents/ — 6월 파일 전건 월별 폴더 정위치. **위반 없음.**

---

### 1-B: 정본 위치 이탈 — 5건 발견

| # | 파일명 | 현 위치 | 정본 위치 | 위반 조항 | 조치 | 우선순위 |
|---|--------|--------|----------|----------|------|---------|
| 1 | `RESEARCH_20260510_쌍아_광고채널_데이터분석.md` | `sessions/2026-05/` | `ops/agenda/` | ch4 3조 #12, 4조 | 이동 | 즉시 |
| 2 | `PROPOSAL_20260327_민아→쌍아_GA4이벤트퍼널설계.md` | `reports/2026-03/` | `ops/proposals/` | ch4 3조 #16, 4조 | 이동 | 즉시 |
| 3 | `SPEC_20260312_크롭앱_기술명세_v1.md` | `reports/2026-03/` | `tech/specs/crop-app/` | ch4 3조 #3, 4조 | 이동 | 즉시 |
| 4 | `DESIGN_20260425_철창이_포털v5_타일그리드_전면개편_제안서.md` | `proposals/` | `tech/designs/2026-04/` | ch4 3조 #5, 4조 | 이동 | 다음 정비 |
| 5 | `SPEC_20260318_크롭앱개발기_기술블로그용.md` | `contents/blog/` | `tech/specs/` 또는 콘텐츠 소스 | ch4 3조 #3, 4조 | 판단 후 이동 (1-D 참조) | 다음 정비 |

---

### 1-C: 파일명 패턴 위반 — 14건 발견

**세션 로그 (7건)**:

| # | 파일명 | 위치 | 위반 내용 | 조치 | 우선순위 |
|---|--------|------|----------|------|---------|
| 1 | `2026-03-08_iMac_막내33.md` | sessions/2026-03/ | 에이전트명 오타 (막내33 → 막내3) | 리네임 | 다음 정비 |
| 2 | `2026-03-23_M1_막내.md` | sessions/2026-03/ | 에이전트 번호 누락 | 내용 확인 후 리네임 | 다음 정비 |
| 3 | `20260331_M1_쌍아_오전.md` | sessions/2026-03/ | 날짜 YYYYMMDD (정규: YYYY-MM-DD) | 리네임 → `2026-03-31_M1_쌍아_오전.md` | 다음 정비 |
| 4 | `20260402_M1_쌍아_새벽.md` | sessions/2026-04/ | 날짜 YYYYMMDD (정규: YYYY-MM-DD) | 리네임 → `2026-04-02_M1_쌍아_새벽.md` | 다음 정비 |
| 5 | `2026-05-11_4060_ssanga.md` | sessions/2026-05/ | 에이전트명 영문 (ssanga → 쌍아) | 리네임 | 다음 정비 |
| 6 | `2026-05-12_4060_ssanga.md` | sessions/2026-05/ | 에이전트명 영문 (ssanga → 쌍아) | 리네임 | 다음 정비 |
| 7 | `2026-05-30_4060_막내.md` | sessions/2026-05/ | 에이전트 번호 누락 | 내용 확인 후 리네임 | 다음 정비 |

**보고서 (4건)**:

| # | 파일명 | 위치 | 위반 내용 | 조치 | 우선순위 |
|---|--------|------|----------|------|---------|
| 8 | `MONKOS_Cr_Motion_System_Directive.md` | reports/2026-02/ | 접두사 없음, 패턴 미매칭 | REPORT_로 리네임 | 다음 정비 |
| 9 | `MONKOS_경쟁분석보고서_20260227.md` | reports/2026-02/ | 접두사 없음, 날짜 위치 비표준 | REPORT_로 리네임 | 다음 정비 |
| 10 | `iMac_막내6_검수_보고파일화.md` | reports/2026-02/ | 접두사 없음 | REVIEW_로 리네임 | 다음 정비 |
| 11 | `IMPACT_20260312_막내2_법률6장_브랜치통일.md` | reports/2026-03/ | IMPACT 미등록 유형 | REPORT_로 리네임 | 다음 정비 |
| 12 | `IMPACT_20260312_막내3_법률6장_브랜치통일.md` | reports/2026-03/ | IMPACT 미등록 유형 | REPORT_로 리네임 | 다음 정비 |

**제안서 (2건)**:

| # | 파일명 | 위치 | 위반 내용 | 조치 | 우선순위 |
|---|--------|------|----------|------|---------|
| 13 | `BRIEFING_20260425_민아→철창이_포털메인_카드그리드_JSX의뢰.md` | proposals/ | BRIEFING 미등록 유형 | ORDER_로 리네임 또는 유형 등록 | 다음 정비 |
| 14 | `REALIGN_20260419_v3_구도재정합_설계서.md` | proposals/ | REALIGN 미등록 유형 | DESIGN_으로 리네임 또는 유형 등록 | 다음 정비 |

---

### 1-D: 정본 이중화 — 2건 발견

| # | 파일명 | 위치 A | 위치 B | 동일 확인 | 조치 | 우선순위 |
|---|--------|-------|-------|----------|------|---------|
| 1 | `SPEC_20260318_크롭앱개발기_기술블로그용.md` | `contents/blog/` | `contents/blog_sources/` | **MD5 일치** | blog/ 삭제, blog_sources/ 정본 유지 | 즉시 |
| 2 | `PROPOSAL_20260319_SPREAD_v2_종합전략.md` | `works/ops/` | `ops/proposals/` | **내용 일치** | ops/proposals/ = 정본. works/ops/ = 외부 원본 (ch4 4조 works 참조 원칙상 원본 유지). 이중화이나 works subtree 특수성으로 판단 필요 | 다음 정비 |

---

### 1-E: 루트 및 비정규 위치 — 위반 없음

| 검사 영역 | 결과 |
|----------|------|
| 프로젝트 루트 임시 .md | **정상** — 없음 |
| docs/monkos/ 6월 이후 신규 | **정상** — 없음 |
| 번호 폴더(01~06) 6월 이후 신규 | **정상** — 없음 |

---

## Task 2: PR #52 산출물 배치 검증

PR #52 브랜치: `origin/claude/sleepy-wright-s5p27m`

### 정상 배치 (11건)

| 파일 | 위치 | 패턴 | 월별 폴더 | 판정 |
|------|------|------|----------|------|
| `.github/scripts/publish_blog_drafts.py` | .github/ | N/A (코드) | N/A | ✅ |
| `.github/workflows/blog-draft-publish.yml` | .github/ | N/A (코드) | N/A | ✅ |
| `contents/blog/blog_20260611_*.md` (2건) | contents/blog/ | blog_ 패턴 | N/A | ✅ |
| `ops/devices/web/DEVICE_PROFILE.md` | ops/devices/web/ | DEVICE_ | N/A | ✅ |
| `ops/portfolios/PF_OPUS/README.md` | 정본 디렉토리 | PF 패턴 | N/A | ✅ |
| `ops/portfolios/PF_SPREAD/README.md` | 정본 디렉토리 | PF 패턴 | N/A | ✅ |
| `ops/proposals/PROPOSAL_20260611_*.md` (2건) | proposals/ | ch4 3조 #16 | N/A | ✅ |
| `ops/reports/2026-06/REPORT_20260611_웹민아_*.md` | reports/2026-06/ | ch4 3조 #2 | ✅ | ✅ |
| `ops/sessions/2026-06/2026-06-11_웹_민아.md` | sessions/2026-06/ | ch4 3조 #7 | ✅ | ✅ |
| `ops/templates/ROUTINE_웹민아_데일리E2E.md` | templates/ | ROUTINE_ | N/A | ✅ |

### 주의 사항 (3건)

| # | 파일 | 이슈 | 심각도 | 조치 방안 |
|---|------|------|--------|----------|
| 1 | `contents/CONTENT_STRATEGY.md` | YAML type: `strategy` — ch4 7조 미등록 유형. ch4 3조 16종 패턴 미매칭. 부서 루트 전략 문서. | 낮음 | ch4 6조 5항으로 `strategy` 유형 등록 검토. 또는 부서 README 부속 문서로 허용 판단. |
| 2 | `contents/DISTRIBUTION_SCHEMA.md` | YAML type: `schema` — ch4 7조 미등록 유형. 동일 이슈. | 낮음 | 동일 |
| 3 | `ops/sessions/2026-06-11_iMac_막내1.md` (수정) | sessions/ 루트에 직접 배치된 기존 파일을 그대로 수정. **월별 폴더 미준수 상태 계속.** | 높음 | Task 1-A #11과 동일건. PR 머지 전 또는 직후 이동 필요. |

---

## 요약 통계

| 구분 | 즉시 조치 | 다음 정비 시 | 합계 |
|------|----------|------------|------|
| 1-A 월별 폴더 미준수 | **11건** | 0건 | **11건** |
| 1-B 정본 위치 이탈 | **3건** | 2건 | **5건** |
| 1-C 파일명 패턴 위반 | 0건 | **14건** | **14건** |
| 1-D 정본 이중화 | **1건** | 1건 | **2건** |
| 1-E 루트/비정규 위치 | 0건 | 0건 | **0건** |
| **합계** | **15건** | **17건** | **32건** |

PR #52: 정상 11건, 주의 3건 (이 중 1건은 기존 main 문제의 연장)

---

## 즉시 조치 권장 사항 (15건)

1. **sessions/ 루트 11건** → `2026-05/` 또는 `2026-06/`로 `git mv`
2. **RESEARCH 파일 1건** → sessions/ → `ops/agenda/`로 이동
3. **PROPOSAL 1건** → reports/ → `ops/proposals/`로 이동
4. **SPEC 1건** → reports/ → `tech/specs/`로 이동
5. **SPEC 이중화 1건** → `contents/blog/` 사본 삭제

---

## 참고: 레거시 잔여

2025-02/ 세션 폴더에 레거시 파일 2건 잔류 (정비 시 리네임 또는 아카이브 이관 검토):
- `marketing_pipeline_cooperation_v2.md` — 패턴 미매칭
- `session_log_20250225_marketing_strategy.md` — 레거시 패턴
