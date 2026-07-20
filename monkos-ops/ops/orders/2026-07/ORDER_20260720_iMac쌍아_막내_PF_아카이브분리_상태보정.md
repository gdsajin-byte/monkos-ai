---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
---

# 지시서: PF 아카이브 분리 5건 + 상태 보정 3건

> **[2026-07-20 15:51 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 15:50 KST
> 전수 조사: REPORT_20260720_막내_PF_전수조사_정리방안.md
> 민아 검증: 산정 오류 보정 2건 + 분리 방식 보강 반영

## A. 아카이브 분리 5건

### 공통 원칙

- README = **현재 스냅샷** (Phase 현황 + 최근 30행 히스토리 + 아카이브 포인터)
- 아카이브 = **시간 이력 전량 보존** (삭제 아님, 이동. append-only 준수)
- 아카이브 파일: `PF_{코드네임}/ARCHIVE_HISTORY.md`
- README 히스토리 섹션 말미에 포인터: `> 전체 히스토리: [ARCHIVE_HISTORY.md](ARCHIVE_HISTORY.md)`

### A1. PF_CROP (704줄/68KB → ~120줄/~12KB)

**방식: 히스토리 이동**
- 히스토리 테이블에서 최근 30행만 README에 잔류
- 나머지 전량 → ARCHIVE_HISTORY.md

### A2. PF_SPREAD (522줄/32KB → ~100줄/~10KB)

**방식: 히스토리 이동**
- 동일 (최근 30행 잔류)

### A3. PF_CITADEL (487줄/71KB → ~100줄/~10KB)

**방식: 히스토리 이동**
- 동일 (최근 30행 잔류)

### A4. PF_SPECS (471줄/89KB → ~100줄/~10KB)

**방식: 히스토리 이동 + 완료 Phase 본문 이동**
- 히스토리: 최근 30행 잔류, 나머지 → ARCHIVE_HISTORY.md
- **추가**: 완료된 Phase 설계·기획 본문 섹션도 → `ARCHIVE_PHASES.md`로 분리 (히스토리 53행뿐이라 본문이 중량 원인)
- README에는 현행 Phase 현황 + 활성 이슈만 잔류

### A5. PF_OPUS (300줄/56KB → ~80줄/~8KB)

**방식: 히스토리 이동 + 구버전 설계 이동**
- 히스토리: 최근 30행 잔류
- **추가**: 구버전 콘텐츠 전략·설계 섹션 → `ARCHIVE_PHASES.md`로 분리 (히스토리 63행이라 본문이 중량 원인)

## B. 상태 보정 3건

### B1. PF_SECURITY

- README.md YAML `status: active` → `status: completed`
- 인덱스(portfolios/README.md)와 정합

### B2. PF_PROFILES

- portfolios/README.md 인덱스에서 `draft` → `active`
- README.md YAML(active)과 정합

### B3. PF_OPUS

- README.md YAML `status: "active"` → `status: active` (따옴표 제거)

## ⚠️ 준수 조항

- 히스토리는 **삭제 금지** — 아카이브 파일로 전량 이동 (헌법 3조 2항 append-only)
- 아카이브 파일에 원문 그대로 보존 (편집·요약 금지)
- 축 귀속(인덱스 컬럼 추가)은 이번 스코프 밖 — 별건
- Phase 현황 섹션은 README에 유지 (상태 반영 갱신 허용)

## 완료 기준

- [ ] 5건 아카이브 파일 생성 (ARCHIVE_HISTORY.md, SPECS·OPUS는 추가로 ARCHIVE_PHASES.md)
- [ ] 5건 README 압축 (각각 120줄/12KB 이하 목표)
- [ ] 3건 상태 보정
- [ ] 분리 전후 줄수/KB 비교표 COMPLETION에 포함
- [ ] COMPLETION 보고서 + 세션 로그 + 커밋 + 푸시
