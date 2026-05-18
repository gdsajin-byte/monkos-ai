---
type: order
from: iMac/쌍아
to: iMac/막내3
date: 2026-05-09
project: 문서체계총정리
priority: 높음
portfolio: PF_MONK_OS
deadline: 금일 내
---

# 지시서: PF 인덱스 + YAML + 히스토리 열 정비

## 배경

- PF 인덱스(portfolios/README.md): 7/16 등록 → 9개 누락
- YAML 규격 위반: 4건 (PF_EVENT, PF_STUDIO, PF_DOCS, PF_SECURITY)
- 히스토리 열 불일치: 3건 (PF_DOCS 2열, PF_EVENT 4열, PF_CDP/README 서술형)
- 오늘 쌍아+작가님 세션에서 진단 완료, 실행 승인

## 임무

### 1. PF 인덱스 현행화 (portfolios/README.md)

현행 7개 + 미등록 9개 = 16개 전수 등록.

인덱스 테이블 구조 (도메인 열 추가):

```markdown
| PF | 코드네임 | 도메인 | 주제 | 상태 | 생성일 |
```

도메인 분류:
- **서비스**: PHOTOPRO, PORTAL, CROP, STUDIO
- **인프라**: CDP, SECURITY
- **전략**: CITADEL, SPREAD, EVENT, PROFILES
- **운영**: MONK_OS, DOCS, RND
- **콘텐츠**: BRIEF, PRESENTATION, VIDEO

기존 7개의 정보도 도메인 열 추가하여 재작성.
파일형 PF는 `[PF_XXX](PF_XXX.md)`, 폴더형은 `[PF_XXX](PF_XXX/README.md)` 링크.

### 2. YAML 규격 위반 수정 (4건)

| PF | 현행 문제 | 수정 내용 |
|----|----------|----------|
| PF_EVENT | `id` 누락, `status` 비정규값("Phase 0 — 기획·인프라 점검") | `id: PF_EVENT` 추가, `status: active` 변경 |
| PF_STUDIO | `status` 불일치 (본문 active ↔ 인덱스 paused) | 본문을 인덱스 기준(`paused`)으로 통일 |
| PF_DOCS | `type: portfolio` 아님, `id/subject/owner/leads` 누락 | 전 필수 필드 추가 |
| PF_SECURITY | `status` 비정규값("대기"), 비표준 필드 | `status: blocked` 변경, 비표준 필드는 본문으로 이동 |

ch4 7조 필수 필드: `type: portfolio`, `id`, `name`, `subject`, `owner`, `leads`, `status`
status 허용값: `draft`, `active`, `blocked`, `paused`, `completed`

### 3. 히스토리 열 보정 (3건)

현행 표준: `| 날짜 | 주체 | 내용 | 산출물 | 상태 |` (5열)

| PF | 현행 | 조치 |
|----|------|------|
| PF_DOCS/README.md | 2열 (날짜, 내용) | 5열로 확장. 기존 행 보정 (소량) |
| PF_EVENT | 4열 (날짜, 주체, 내용, 근거) | 5열로 확장 (근거→산출물 매핑, 상태 추가) |
| PF_CDP/README.md | 서술형 | 건드리지 않음 (정본은 PF_CDP.md이므로) |

### 4. 산출물

- 수정된 파일들 (위치별)
- `monkos-ops/ops/reports/COMPLETION_20260509_막내3_PF정비.md` — 수정 내역 테이블

## 준수 조항

- ⚠️ 헌법 제3조 1항: 타임스탬프 절대 준수
- ⚠️ 수정 전 반드시 Read로 현행 확인
- ⚠️ 히스토리 행은 append-only — 기존 행의 내용 수정 금지. 열 구조 보정만 허용
- PF_CDP/README.md는 건드리지 않는다 (이중 정본 해소는 별도 작업)
