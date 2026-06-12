---
type: order
date: 2026-06-12
from: 웹/민아
to: iMac/쌍아 (보정·토스) → 막내N
subject: "GCP 전체 구조 정밀 전수조사 — 프로젝트·IAM·SA키·버킷 현행화 (4-22 감사 델타)"
status: 대기 (쌍아 보정·분담 토스 대기)
portfolio: PF_SECURITY
---

# 지시서 — GCP 전체 구조 정밀 전수조사

> **[2026-06-12 11:39 KST] 웹/민아 → iMac/쌍아**
> 작가님 직접 지시(②경로 준용): "막내들에게 전체 구조를 리서치 분석 파악하도록 지시서를 발급해. 쌍아가 받아서 막내들에게 토스할 거다."
> 본 지시서는 웹/민아가 기안하고 **쌍아가 보정·분담 결정 후 토스**한다. PF_SECURITY는 04-23 completed 상태 — 재활성 또는 귀속 조정은 쌍아 판단.

---

## 1. 배경 / 목적

2026-06-12 오전, 작가님+웹/민아가 Gemini API 키 마감(06-19) 대응으로 GCP 콘솔 합동 점검을 수행했다. 결과:

- ✅ **키 종결**: 전 프로젝트 API 키 = monkos `MONKOS NEW API Key` 1개만 생존, Gemini API 제한 적용 확인. Default Gemini Project·startMONK·monk-data-factory 키 전부 삭제 확인. 06-19 마감 요건 충족 (리마인더 메일은 Google 스냅샷 지연으로 판정).
- ✅ **IAM 즉석 축소** (작가님 콘솔, Recommender 권장사항 적용): monk-data-factory 기본 SA 2개(편집자, 초과권한 11665/11665 = 100% 미사용) 제거. startMONK Compute 기본 SA·smuse73 SA 축소.
- 🚨 **미집행 P0 재발견**: `gs://monk-factory-storage` allUsers 공개 — 4-22 감사 P0 권고(실명 고객 촬영물 618MB 노출)가 **7주째 미집행**. 작가님 콘솔 제거 진행 중.
- ⚠️ **데이터 노후**: 전수 실측의 최신본이 4-22 감사(7주 전). 이후 키 삭제·IAM 변경·버킷 증감이 반영된 현행 전수가 없다.

**목적**: 4-22 감사 이후의 델타를 반영한 **GCP 전체 구조 현행 전수 정본**을 만들고, 유휴 프로젝트 종료·버킷 정리·SA 수동 키 폐기의 **선결 확인을 완결**한다.

## 2. 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_막내N_SECURITY_GCP전수정밀조사.md` | 본 조사 통합 보고서 (분담 시 막내별 분리 가능, 쌍아 재량) |
| 2 | `monkos-ops/ops/SECRET_INVENTORY.md` 갱신 | §A 키 현황(06-12 기준 1개), §G SA 역할 현행화 |
| 3 | `GCS_BUCKET_STRUCTURE.md` 갱신안 | 버킷 전수 + 크기 + 공개여부 + 거취 판정 |
| 4 | PF_SECURITY 히스토리 1행 어펜드 | (재활성 시) |

## 3. 조사 범위 (Task)

### Task 1 — 프로젝트·IAM·키 현행 전수 (4-22 감사 §1~3 갱신)

- `gcloud projects list` 기준 전 프로젝트(7개: monkos, monkos-3c6e4, monk-data-factory, gen-lang-client-0105707468/startMONK, gen-lang-client-0127984847/monkos-aistudio, gen-lang-client-0705237063/Default Gemini, savvy-cinema-481804-r1) 대상:
  - `gcloud services api-keys list` — 키 전수 (기대값: monkos 1개 외 전부 0. 다르면 즉시 보고)
  - `gcloud projects get-iam-policy` — 06-12 작가님 콘솔 축소 결과 반영 현행 IAM
  - `gcloud iam service-accounts list` + USER_MANAGED 키 존재 여부
- 4-22 보고서와의 **델타 테이블** 작성 (변경/삭제/잔존).

### Task 2 — 버킷 정밀 전수 (작가님 핵심 요청: "버킷 구조 정밀화")

- 전 프로젝트 `gsutil ls` + `gsutil du -s` — 버킷별 크기·오브젝트 수 현행화.
- **startMONK 종료 선결**: `gs://startmonk_bucket`(355MB)·`gs://monk-data-factory-assets`(257MB) **내용물 감사** (최상위 폴더 구조 + 대표 파일명, 내용 열람 금지) → 폐기/이관 판정 근거 제시. monk-data-factory 파이프라인이 후자를 참조하는지 교차 확인.
- `gs://monk-ai-images`(공개 CDN): `generated/`·`raw_data/` 경로의 고객 데이터 혼재 규모 실측 (4-22 P2 후속, 버킷 분리 설계 기초자료).
- `gs://monk-factory-storage`: 작가님 allUsers 제거 후 **익명 curl 재현으로 차단 검증** (4-22 보고서 §2-1 방법 준용). 내용물 보관/GDrive 이관/삭제 선택지 보고.

### Task 3 — SA 수동 키 추적 (Phase C 선결)

- USER_MANAGED 키 보유 SA: `smuse73`(startMONK)·`monk-factory-agent`(monk-data-factory) — 키 ID·발급일 확인, 로컬 디바이스·리포·CF 대시보드 내 키 파일 소재 추적, 사용처 0 확인 시 **폐기 가능 판정** (폐기 실행은 작가님 승인 별도).
- `yong-a-orchestrator` 구키(1月·5月분) 삭제 완결 여부 확인 (06-10 교체 후 "삭제 대기" 상태).

### Task 4 — Cloud Run 런타임 SA 의존성 맵

- monkos 서비스 11개 각각 `gcloud run services describe --format="value(spec.template.spec.serviceAccountName)"` — **어떤 SA로 구동되는지 맵 작성**.
- 목적: Compute 기본 SA(편집자, 초과권한 11660/11666 — **6개 권한 실사용 중**) 축소의 영향평가 기초. 실사용 6개 권한이 무엇인지 Recommender 인사이트로 식별.
- ⚠️ 이 Task는 **조사만**. monkos 본진 IAM 변경은 별도 지시서로 분리.

### Task 5 — 프로젝트 종료 선결 체크리스트 확정

- startMONK·monkos-aistudio: 잔존 리소스(Cloud Run monk-ai-backend, 버킷, Discovery Engine 데이터스토어) 최종 확인 → **"종료해도 됨" 판정표** 작성. 종료 클릭은 작가님.
- Default Gemini Project·My Maps Project: 06-12 콘솔 확인으로 빈 것 확정 — 재확인만.

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: 키·시크릿 **값 조회/생성/추측 절대 금지**. fingerprint·키 ID·메타데이터만. 보고서에 값 인용 금지.
- **헌법 4조 2항**: 본 지시서 전체가 **읽기 전용**. IAM 변경·키 삭제·버킷 삭제·`rm -rf` 등 상태 변경 일체 금지. 변경 필요 발견 시 권고로만 보고.
- **헌법 3조 1항**: 매 턴 `date` 명령 KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀` + 수발신 헤더. 세션 로그 어펜드.
- **ch4 10조**: Firestore 직접 접근 금지 (본 조사 범위에 Firestore 데이터 없음 — 메타데이터 외 접근 시 위반).
- 버킷 내용물 감사 시 **파일명 리스트까지만** (4-22 선례 준용). 고객 촬영물 열람 금지.

## 5. 완료 기준

- [ ] 7개 프로젝트 키·IAM·SA 현행 전수 + 4-22 델타 테이블
- [ ] 버킷 전수 (크기·공개여부) + startMONK 버킷 2개 폐기/이관 판정 근거
- [ ] monk-factory-storage 공개 차단 익명 재현 검증
- [ ] monk-ai-images 고객 데이터 혼재 규모 실측
- [ ] SA 수동 키 2개 소재·사용처 추적 + 폐기 가능 판정
- [ ] Cloud Run 11개 런타임 SA 맵 + Compute SA 실사용 6권한 식별
- [ ] 프로젝트 종료 판정표 (startMONK·monkos-aistudio)
- [ ] SECRET_INVENTORY·GCS_BUCKET_STRUCTURE 갱신
- [ ] PF 히스토리 어펜드 + 완료 보고

## 6. 커밋 메시지

```
[research] GCP 전수 정밀조사 — 프로젝트·IAM·SA키·버킷 현행화 (4-22 델타)
```

## 7. 분담 제안 (쌍아 재량)

- 막내1: Task 1·3 (보안·키 — 6-05 유출 분석, 6-10 보안 전수조사 선례 보유)
- 막내2: Task 2 (버킷·스토리지 — 6-05 GCP 실측 선례)
- 막내3: Task 4·5 (Cloud Run·종료 판정 — 6-05 image_pro 변경 추적 선례)
- 참조 정본: `REPORT_20260422_GCP_Firebase_인프라감사.md`, `REPORT_20260422_PUBLIC버킷_맥락확인.md`, `SECRET_INVENTORY.md`, 본 세션 로그(`2026-06-12_웹_민아_수동.md`)
