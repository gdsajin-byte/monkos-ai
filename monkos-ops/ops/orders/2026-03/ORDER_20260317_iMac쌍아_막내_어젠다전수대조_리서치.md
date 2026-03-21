---
type: ORDER
from: iMac/쌍아
to: iMac/막내2
date: 2026-03-17
priority: P1
scope: 리서치 (코드 변경 없음)
---

# 지시서: 미결 어젠다 전수 대조 리서치

## 목적

미결 어젠다 목록(8건) + 코웍이 지시서(7건)에 대해, **실제 코드 반영 여부·세션 로그 기록·배포 상태**를 전수 대조하여 "기처리인데 확인 안 된 항목"을 식별한다.

## 대조 대상

### A. 미결 어젠다 (`memory/project_pending_agenda.md`)

| # | 항목 | 대조 포인트 |
|---|------|------------|
| 1 | FAQ EN/JA Firestore 시딩 | `monkos_AI/portal/` 내 시딩 스크립트 실행 흔적, Firestore 관련 커밋, 세션 로그에서 시딩 완료 보고 여부 |
| 2 | GitHub Issue 자동 게시 (파이프라인 Phase 1) | `translate.js` 내 GitHub API 연동 코드 존재 여부, PAT 설정 흔적 |
| 3 | 콘텐츠 자동 배포 파이프라인 | 기안서 상태 확인 (`monkos-ops/ops/proposals/PROPOSAL_20260316_콘텐츠자동배포파이프라인.md`), 실행 착수 여부 |
| 4 | 블록 에디터 통합 | 기안서 상태 (`PROPOSAL_20260316_블록에디터통합_기안서.md`), Phase A HTML 블록 관련 코드 반영 여부 |
| 5 | GEO GitHub 공개 레포 전략 | monkos-ai 레포 Public 상태 확인, 이슈 7건 게시 여부, `llms.txt`·`robots.txt` 등 GEO Phase 1 배포 확인 |
| 6 | 팀웍 레포 분리 + 데몬 세팅 | 장기 — 착수 여부만 확인 |
| 7 | 포털 홈 블록 분리 리팩토링 | `portal/public/index.html` 구조 변경 여부, render.js fragment 분리 상태 |
| 8 | 어드민 블록 에디터 UI | 착수 여부만 확인 |

### B. 코웍이 미처리 지시서 (3/15 수신 4건)

| 파일 | 대조 포인트 |
|------|------------|
| `ORDER_20260315_코웍이→쌍아_magcard_썸네일렌더링_수정.md` | magcard 관련 코드 변경 여부 |
| `ORDER_20260315_코웍이→쌍아_블로그페이지_디자인교체+카드버그수정.md` | 블로그 페이지 디자인 변경 커밋 확인 (에디터 1~4차와 겹치는지) |
| `ORDER_20260315_코웍이→쌍아_증명앱SEO_hreflang수정+JSONLD추가.md` | hreflang·JSON-LD 코드 반영 여부 (`ORDER_20260315_M1쌍아_막내_증명앱SEO_hreflang+JSONLD.md` 실행 여부와 대조) |
| `ORDER_20260315_코웍이→쌍아_콘텐츠이관_크롤링파이프라인.md` | 크롤링 스크립트 존재 여부, 실행 기록 |

### C. 코웍이 신규 지시서 (3/17 수신 3건)

| 파일 | 대조 포인트 |
|------|------------|
| `ORDER_20260317_코웍이→쌍아_GEO_AEO_종합프로젝트_기획서.md` | GEO Phase 1 실행 완료 여부와 겹침 확인, Phase 2 이후 미착수 확인 |
| `ORDER_20260317_코웍이→쌍아_MINA_PROJECT_종합기획서.md` | 신규 — 착수 여부 확인 |
| `ORDER_20260317_코웍이→쌍아_메인페이지_썸네일_통합수정.md` | 포털 홈 썸네일 관련 커밋 확인 (`ORDER_20260317_M1쌍아_막내_포탈홈썸네일+구글어드민_2건수정.md`와 대조) |

## 조사 방법

1. **세션 로그 전수 확인** — 아래 파일들을 모두 읽고 관련 작업 완료 보고를 추출
   - `monkos-ops/ops/sessions/2026-03-15_iMac_막내1.md`
   - `monkos-ops/ops/sessions/2026-03-15_iMac_막내2.md`
   - `monkos-ops/ops/sessions/2026-03-15_iMac_막내3.md`
   - `monkos-ops/ops/sessions/2026-03-16_M1_쌍아.md`
   - `monkos-ops/ops/sessions/2026-03-16_iMac_쌍아.md`
   - `monkos-ops/ops/sessions/2026-03-17_M1_막내1.md`
   - `monkos-ops/ops/sessions/2026-03-17_M1_막내2.md`
   - `monkos-ops/ops/sessions/2026-03-17_M1_쌍아.md`
   - `monkos-ops/ops/sessions/2026-03-17_M1_쌍아_2.md`
   - `monkos-ops/ops/sessions/2026-03-17_M1_쌍아_3.md`
   - `monkos-ops/works/ops/sessions/` 하위 전체

2. **git log 대조** — `git log --oneline --since="2026-03-15"` 커밋 메시지에서 각 항목 관련 키워드 검색

3. **실코드 확인** — 각 대조 포인트별로 실제 파일을 Read하여 반영 여부 확인
   - `monkos_AI/portal/public/index.html` (홈 구조, llms.txt, 썸네일)
   - `monkos_AI/portal/public/robots.txt` (GEO)
   - `monkos_AI/portal/public/llms.txt` (GEO)
   - `monkos_AI/portal/lib/cms/` (블로그 에디터 관련)
   - `monkos_AI/idphoto-kr/public/index.html` (hreflang, JSON-LD)
   - `monkos_AI/idphoto-jp/public/index.html` (hreflang, JSON-LD)
   - FAQ 시딩 스크립트 검색: `grep -r "seed" monkos_AI/portal/`

4. **코웍이 지시서 본문 확인** — 각 지시서를 Read하여 요구사항 대비 실코드 반영 범위 대조

## 산출물

보고서 파일: `monkos-ops/ops/reports/REPORT_20260317_어젠다전수대조_결과.md`

아래 형식으로 정리:

```markdown
## 대조 결과

### 기처리 확인 (어젠다에서 제거 가능)
| # | 항목 | 근거 (커밋/세션/코드) |

### 부분 처리 (잔여 작업 있음)
| # | 항목 | 완료 부분 | 잔여 부분 |

### 미착수
| # | 항목 | 비고 |

### 코웍이 지시서 대조
| 날짜 | 지시서 | 상태 | 근거 |
```

## ⚠️ 준수 조항

- 헌법 제1조 1항: 타임스탬프 `date` 명령 사용
- 헌법 제1조 2항: 완료 보고 형식 준수
- **코드 변경 금지** — 리서치 only. 파일 수정/생성은 보고서 1건만 허용
