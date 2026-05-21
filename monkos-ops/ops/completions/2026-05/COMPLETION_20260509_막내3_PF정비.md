---
type: completion
date: 2026-05-09
author: iMac/막내3
order: ORDER_20260509_막내3_PF_인덱스YAML정비.md
pf: PF_MONK_OS
---

# COMPLETION — PF 인덱스 + YAML + 히스토리 열 정비

> **[2026-05-09 12:46 KST] iMac/막내3**

## 수정 내역

### 1. PF 인덱스 현행화 (portfolios/README.md)

| 항목 | Before | After |
|------|--------|-------|
| 등록 수 | 7/16 | **16/16** |
| 열 수 | 5열 (PF, 코드네임, 주제, 상태, 생성일) | **6열** (도메인 열 추가) |
| 도메인 분류 | 없음 | 서비스(4) · 인프라(2) · 전략(4) · 운영(3) · 콘텐츠(3) |
| 네이밍 안내 | 파일형만 | 파일형 + 폴더형 병기 |

신규 등록 9건: PF_BRIEF, PF_DOCS, PF_EVENT, PF_MONK_OS, PF_PRESENTATION, PF_PROFILES, PF_RND, PF_SECURITY, PF_VIDEO

### 2. YAML 규격 수정 (4건)

| PF | 수정 내용 |
|----|----------|
| PF_EVENT | `id: PF_EVENT`, `name: EVENT`, `subject` 추가. `status` → `active`. `owner: 작가님`, `leads` 정규화 |
| PF_STUDIO | `status: active` → `status: paused` (인덱스 기준 통일) |
| PF_DOCS | `type: portfolio`, `id: PF_DOCS`, `name: DOCS`, `subject`, `owner`, `leads` 추가. `status` → `active`. 비표준 `description` 필드 → `subject`로 교체 |
| PF_SECURITY | `status: "대기"` → `status: blocked`. 비표준 필드(`trigger`, `domain`, `related_pf`) 삭제 (본문 §2·§7에 이미 반영) |

### 3. 히스토리 열 보정 (2건)

| PF | Before | After |
|----|--------|-------|
| PF_DOCS/README.md | 2열 (날짜, 내용) | **5열** (날짜, 주체, 내용, 산출물, 상태) + append-only 안내 추가 |
| PF_EVENT | 4열 (날짜, 주체, 내용, 근거) | **5열** (근거→산출물, 상태 열 추가). 기존 5행 전수 보정 |

PF_CDP/README.md는 지시서 지시대로 미수정 (정본은 PF_CDP.md).

## 수정 파일 목록

| 파일 | 임무 |
|------|------|
| `monkos-ops/ops/portfolios/README.md` | 인덱스 현행화 |
| `monkos-ops/ops/portfolios/PF_EVENT.md` | YAML + 히스토리 열 |
| `monkos-ops/ops/portfolios/PF_STUDIO.md` | YAML (status) |
| `monkos-ops/ops/portfolios/PF_DOCS/README.md` | YAML + 히스토리 열 |
| `monkos-ops/ops/portfolios/PF_SECURITY/README.md` | YAML (status, 비표준 필드) |

## 준수 확인

- ✅ 헌법 제3조 1항: 타임스탬프 `date` 실측 사용
- ✅ 히스토리 기존 행 내용 미수정 (열 구조 보정만 수행)
- ✅ PF_CDP/README.md 미수정
- ✅ 수정 전 Read로 현행 확인 완료
