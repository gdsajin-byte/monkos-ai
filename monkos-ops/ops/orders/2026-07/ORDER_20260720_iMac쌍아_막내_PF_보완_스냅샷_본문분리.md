---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
---

# 지시서: PF 아카이브 보완 — SPECS 스냅샷 + 본문 분리 3건

> **[2026-07-20 16:12 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 16:11 KST
> 선행: 7bb5d53b (아카이브 분리 1차)
> 민아 검증: 조건부 승인 — 보완 2건

## Task 1 — SPECS README 현재 스냅샷 블록 추가

**파일**: `monkos-ops/ops/portfolios/PF_SPECS/README.md`

히스토리 섹션 앞에 `## 현재 상태` 블록 추가:

```markdown
## 현재 상태 (2026-07-20)

- **V2 완결**: 429슬러그 전량 V2 직결 (7/19 V1 소각 완료, prod 00519)
- **유니크 콘텐츠**: 파일럿 4국 탑재 라이브, 확산 배치 대기
- **동남아 1단계**: id/vn어 라이브 + GSC 사이트맵 등록 완료
- **도해 시스템화**: v5 레포 편입 완료, 인물 팩 파이프라인 설계 대기
- **33 플로어 제거**: prod 00520 라이브 (fMin+1 하한 복원)
```

## Task 2 — CROP 본문 분리 (594줄/41KB → ~120줄/~12KB)

**파일**: `monkos-ops/ops/portfolios/PF_CROP/README.md`

완료된 Phase 설계·기획 본문(배치 복원 설계, FaceMesh 제거 계획, 인시던트 상세 등)을 `PF_CROP/ARCHIVE_PHASES.md`로 이동.

README에는 Phase 현황 표 + 활성 이슈 + 히스토리 최근 30행 + 아카이브 포인터만 잔류.

## Task 3 — CITADEL 본문 분리 (393줄/44KB → ~100줄/~10KB)

**파일**: `monkos-ops/ops/portfolios/PF_CITADEL/README.md`

완료된 Phase 설계·전략 본문을 `PF_CITADEL/ARCHIVE_PHASES.md`로 이동.

README에는 Phase 현황 + KPI + 활성 트랙 + 히스토리 최근 30행 + 아카이브 포인터만 잔류.

## Task 4 — SPREAD 본문 분리 (510줄/30KB → ~100줄/~10KB)

**파일**: `monkos-ops/ops/portfolios/PF_SPREAD/README.md`

완료된 Phase 설계·채널 전략 본문을 `PF_SPREAD/ARCHIVE_PHASES.md`로 이동.

README에는 Phase 현황 + 활성 채널 + 히스토리 최근 30행 + 아카이브 포인터만 잔류.

## ⚠️ 준수 조항

- 원문 그대로 이동, 편집·요약 금지 (append-only)
- Phase 현황 섹션은 README에 유지
- 아카이브 파일에 역링크 포함: `> 현재 상태: [README.md](README.md)`

## 완료 기준

- [ ] SPECS 현재 스냅샷 블록 추가
- [ ] CROP·CITADEL·SPREAD 각각 ARCHIVE_PHASES.md 생성
- [ ] 3건 README ~100줄/~10KB 이하
- [ ] 분리 전후 줄수/KB 비교표
- [ ] COMPLETION 보고서 + 세션 로그 + 커밋 + 푸시
