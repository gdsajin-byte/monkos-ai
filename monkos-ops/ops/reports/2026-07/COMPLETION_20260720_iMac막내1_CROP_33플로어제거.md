---
type: completion
date: 2026-07-20
device: iMac
agent: 막내1
portfolio: PF_IDPHOTO
status: 완료
---

# COMPLETION — 크롭 33 플로어 제거

> **[2026-07-20 13:10 KST]** iMac/막내1 → 작가님
> 지시서: `ORDER_20260720_iMac쌍아_막내_CROP_33플로어제거.md`

## 결과

✅ **Task 1** — `spec-crop.js:84` `Math.max(33, fMin + 1)` → `fMin + 1` 변경 완료. 71행 주석 동기화.
✅ **Task 2** — jest 전량 녹색 (11 suites, 105 tests, 0 fail). `spec-crop-consistency` 428 전 슬러그 통과.
✅ **Task 3** — 5슬러그 전후 비교표 (아래)
✅ **Task 4** — 배포 완료. rev `monkos-portal-00520-mr2`, 100% 트래픽.

## 5슬러그 전후 비교표

| 슬러그 | 프레임(mm) | 변경 전 faceTargetMm | 변경 후 faceTargetMm | headHeight 범위 | 비고 |
|--------|-----------|---------------------|---------------------|----------------|------|
| uk-passport | 35×45 | 31 | 31 | 29~34 | 명시값(faceTargetExplicitMm) — 무변동 |
| sg-passport | 35×45 | 33 | 26 | 25~35 | fMin+1 복원 ✓ |
| us-passport | 51×51 | 33 | 26 | 25~35 | fMin+1 복원 ✓ |
| jm-passport | 35×45 | 33 | 26 | 25~35 | fMin+1 복원 ✓ |
| mx-passport | 35×45 | 33 | 33 | 32~39 | fMin+1=33 ≥ 구 플로어 — 무변동 |

전 슬러그 headHeight 범위 내 확인.

## 준수 조항 확인

- ✅ `frameHmm >= 60` 분기 무접촉
- ✅ `faceTargetExplicitMm`(75행) 무접촉
- ✅ `FACE_MIN_RATIO`, `hairMarginMm` 무접촉

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/spec-crop.js` | 71행 주석 + 84행 33 플로어 제거 |

## 배포

- rev: `monkos-portal-00520-mr2`
- 100% 트래픽
- 서비스: monkos-portal (us-central1)

## 비고

- PF_IDPHOTO: iMac에 portfolios 미체크아웃 — 히스토리 어펜드 보류 (쌍아 사후 보정 필요)
