---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내2
subject: "GCP 전수조사 B — 버킷 정밀 전수 + 공개 차단 검증"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — GCP 전수조사 B: 버킷 정밀 전수 + 공개 차단 검증

> **[2026-06-12 11:55 KST]** iMac/쌍아 → iMac/막내2
> 원본: `ORDER_20260612_웹민아_막내들_SECURITY_GCP전수정밀조사.md` (웹민아 기안, 쌍아 보정·분할)
> 작가님 직접 지시(②경로). 3건 분할의 B건.

---

## 배경

2026-06-12 오전 합동 점검에서 재발견된 사안:
- 🚨 **P0**: `gs://monk-factory-storage` allUsers 공개 (실명 고객 촬영물 618MB) — 4-22 감사 권고 7주 미집행. 작가님 콘솔에서 allUsers 제거 진행 중
- `gs://monk-ai-images` 고객 데이터 혼재 (P2, 버킷 분리 설계 과제)
- startMONK 종료 선결: 버킷 2개 내용 확인 필요

세션 로그 참조: `monkos-ops/ops/sessions/2026-06/2026-06-12_웹_민아_수동.md`

## 담당 Task

### Task 2 — 버킷 정밀 전수

**2-A. 전 프로젝트 버킷 현황**

전 프로젝트 `gsutil ls` + `gsutil du -s`:
- 버킷별 크기·오브젝트 수 현행화
- 공개 여부 (`gsutil iam get gs://bucket | grep allUsers`)

**2-B. startMONK 종료 선결 — 버킷 2개 내용 감사**

| 버킷 | 크기 | 목적 |
|------|------|------|
| `gs://startmonk_bucket` | 355MB | startMONK 프로젝트 자산 |
| `gs://monk-data-factory-assets` | 257MB | monk-data-factory 파이프라인 자산? |

각 버킷:
1. 최상위 폴더 구조 리스트 (`gsutil ls gs://bucket/`)
2. 대표 파일명 확인 (내용 열람 금지 — 파일명 리스트까지만)
3. 폐기/이관 판정 근거 제시
4. monk-data-factory 파이프라인이 `monk-data-factory-assets`를 참조하는지 교차 확인

**2-C. monk-ai-images 고객 데이터 혼재 실측**

`gs://monk-ai-images` (공개 CDN, 3.55GB):
- `generated/` 경로 규모·파일 수 실측
- `raw_data/` 경로 규모·파일 수 실측
- 고객 데이터 혼재 규모 산출 (버킷 분리 설계 기초자료)

**2-D. monk-factory-storage 공개 차단 검증**

작가님이 allUsers 제거 후:
1. 익명 curl 재현으로 차단 검증 (4-22 보고서 §2-1 방법 준용)
2. 내용물 보관/GDrive 이관/삭제 선택지 보고

## 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내2_SECURITY_GCP버킷전수.md` | Task 2 보고서 |
| 2 | `monkos-ops/tech/architecture/GCS_BUCKET_STRUCTURE.md` 갱신안 | 버킷 전수 + 크기 + 공개여부 + 거취 판정 |

## ⚠️ 준수 조항

- **헌법 4조 1항**: 키·시크릿 값 금지. 버킷 내용물 감사 시 **파일명 리스트까지만** (4-22 선례 준용). **고객 촬영물 열람 절대 금지.**
- **헌법 4조 2항**: **읽기 전용**. 버킷 삭제·오브젝트 이동·ACL 변경 일체 금지. 변경 필요 시 권고로만 보고.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀` + 수발신 헤더. 세션 로그 어펜드.

## 교차 감사

본 건 완료 후, **막내3 보고서**(Cloud Run SA 맵)를 Read하여 다음을 교차 검증:
- Cloud Run 서비스가 사용하는 SA가 버킷 ACL에 등록된 SA와 일치하는지
- 종료 판정 대상 프로젝트(startMONK·monkos-aistudio)의 버킷이 다른 프로젝트에서 참조되지 않는지

교차 검증 결과를 보고서 말미 `## 교차 감사` 섹션에 추가.

## 커밋 메시지

```
[research] GCP 전수조사 B — 버킷 정밀 전수 + 공개 차단 검증 (4-22 델타)
```
