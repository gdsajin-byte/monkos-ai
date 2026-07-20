---
type: completion
date: 2026-07-20
device: iMac
agent: 막내1
status: 완료
---

# COMPLETION — PF 아카이브 분리 5건 + 상태 보정 3건

> **[2026-07-20 16:07 KST]** iMac/막내1 → 작가님
> 지시서: `ORDER_20260720_iMac쌍아_막내_PF_아카이브분리_상태보정.md`

## A. 아카이브 분리 — 전후 비교표

| PF | 분리 전 줄/KB | 분리 후 줄/KB | ARCHIVE_HISTORY | ARCHIVE_PHASES | 비고 |
|---|---|---|---|---|---|
| PF_CROP | 704 / 68KB | 594 / 41KB | 119줄 (112행) | — | 본문 비중 큼, 히스토리만 분리 |
| PF_SPREAD | 522 / 32KB | 510 / 30KB | 21줄 (14행) | — | 히스토리 28행뿐, 본문이 중량 원인 |
| PF_CITADEL | 487 / 71KB | 393 / 44KB | 104줄 (97행) | — | 본문 비중 큼, 히스토리만 분리 |
| PF_SPECS | 471 / 89KB | 74 / 18KB | 129줄 (121행) | 288줄 | ✅ 목표 달성. Phase 본문도 분리 |
| PF_OPUS | 300 / 56KB | 165 / 34KB | 40줄 (33행) | 112줄 | 구버전 전략 섹션 분리 |

**SPECS가 가장 효과적** — Phase 본문 + 히스토리 양방향 분리로 89KB→18KB (80% 감소).

**CROP·SPREAD·CITADEL은 히스토리만 분리** (지시서 범위) — 본문 섹션이 중량 원인이므로 추가 ARCHIVE_PHASES 분리 시 목표 달성 가능. 별건 판단 필요.

## B. 상태 보정

| PF | 보정 내용 | 확인 |
|---|---|---|
| PF_SECURITY | YAML `active` → `completed` | ✅ 인덱스와 정합 |
| PF_PROFILES | 인덱스 `draft` → `active` | ✅ YAML과 정합 |
| PF_OPUS | YAML `"active"` → `active` | ✅ 따옴표 제거 |

## 준수 조항 확인

- ✅ 히스토리 삭제 없음 — 전량 아카이브 파일로 이동 (append-only 준수)
- ✅ 아카이브 파일에 원문 그대로 보존
- ✅ Phase 현황 섹션은 README에 유지
- ✅ 축 귀속(인덱스 컬럼) 미접촉

## 변경 파일

| 파일 | 변경 |
|------|------|
| `PF_CROP/README.md` | 히스토리 112행 제거 + 포인터 |
| `PF_CROP/ARCHIVE_HISTORY.md` | 신규 |
| `PF_SPREAD/README.md` | 히스토리 14행 제거 + 포인터 |
| `PF_SPREAD/ARCHIVE_HISTORY.md` | 신규 |
| `PF_CITADEL/README.md` | 히스토리 97행 제거 + 포인터 |
| `PF_CITADEL/ARCHIVE_HISTORY.md` | 신규 |
| `PF_SPECS/README.md` | Phase 본문 + 히스토리 분리 + 포인터 |
| `PF_SPECS/ARCHIVE_HISTORY.md` | 신규 |
| `PF_SPECS/ARCHIVE_PHASES.md` | 신규 |
| `PF_OPUS/README.md` | 전략 섹션 + 히스토리 분리 + 포인터 + status 보정 |
| `PF_OPUS/ARCHIVE_HISTORY.md` | 신규 |
| `PF_OPUS/ARCHIVE_PHASES.md` | 신규 |
| `PF_SECURITY/README.md` | status: completed |
| `portfolios/README.md` | PF_PROFILES: active |
