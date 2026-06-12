---
type: report
date: 2026-06-12
from: iMac/막내2
to: iMac/쌍아
status: 완료
subject: "GCP 전수조사 B — 버킷 정밀 전수 + 공개 차단 검증 (4-22 델타)"
portfolio: PF_SECURITY
---

# GCP 전수조사 B — 버킷 정밀 전수 + 공개 차단 검증

> **[2026-06-12 12:08 KST]** iMac/막내2 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내2_SECURITY_GCP버킷정밀전수.md`
> 기준선: `REPORT_20260422_PUBLIC버킷_맥락확인.md` (4-22 막내1)
> 감사 방식: 읽기 전용 (버킷 삭제·오브젝트 이동·ACL 변경 일체 없음)

---

## 1. 전 프로젝트 버킷 현황 (Task 2-A)

### 1-1. 프로젝트별 버킷 전수

7개 프로젝트 / 17개 버킷 실측:

| # | 프로젝트 | 버킷 | 크기 | 오브젝트 수 | 공개 | 용도 |
|---|---------|------|------|------------|------|------|
| 1 | **monkos** | `monk-ai-images` | **4.20 GB** | 17,850 | 🚨 allUsers `objectViewer` | CDN + 고객 데이터 혼재 |
| 2 | monkos | `monk-project` | 3.36 GB | — | ❌ | 프로젝트 자산 |
| 3 | monkos | `monkos-works-assets` | 606 MB | — | ❌ | works 자산 |
| 4 | monkos | `monkos_cloudbuild` | 252 MB | — | ❌ | Cloud Build 아티팩트 |
| 5 | monkos | `run-sources-*-us-central1` | 108 MB | — | ❌ | Cloud Run 소스 |
| 6 | monkos | `run-sources-*-asia-northeast1` | 67 MB | — | ❌ | Cloud Run 소스 |
| 7 | monkos | `run-sources-*-asia-northeast3` | 1.6 MB | — | ❌ | Cloud Run 소스 |
| 8 | monkos | `933456016842_*_asia_northeast3_import_content` | 0 | — | ❌ | 빈 버킷 (Discovery Engine) |
| 9 | monkos | `933456016842_*_us_import_content` | 0 | — | ❌ | 빈 버킷 (Discovery Engine) |
| 10 | **monk-data-factory** | `monk-factory-storage` | **648 MB** | 314 | 🚨 allUsers `composer.envAndStorageObjViewer` | **P0 — 실명 고객 촬영물 공개** |
| 11 | **startMONK** | `startmonk_bucket` | **372 MB** | 918 | ❌ | startMONK 자산 (종료 선결) |
| 12 | startMONK | `monk-data-factory-assets` | **270 MB** | 242 | ❌ | 모델 촬영 자산 (비공개) |
| 13 | startMONK | `startmonk-soul` | 24 KB | — | ❌ | 소량 아카이브 |
| 14 | startMONK | `run-sources-*-asia-northeast3` | 6.5 KB | — | ❌ | Cloud Run 빌드 아티팩트 |
| 15 | startMONK | `251409703490_*_import_content_with_faq_csv` | 0 | — | ❌ | 빈 버킷 |
| 16 | startMONK | `video_muse` | 0 | — | ❌ | 빈 버킷 |
| 17 | **monkos-3c6e4** | `gcf-sources-676916736379-us-central1` | 1.0 MB | — | ❌ | Cloud Functions 소스 |

**합계**: 총 용량 ~9.9 GB / 공개 버킷 2개

### 1-2. 4-22 대비 델타

| 항목 | 4-22 | 현재 | 변동 |
|------|------|------|------|
| monk-ai-images 크기 | 3.55 GB | **4.20 GB** | +650 MB (서비스 성장) |
| monk-ai-images 오브젝트 | 17,388 | **17,850** | +462 |
| monk-factory-storage allUsers | 있음 | **있음** | ❌ 7주 미집행 |
| monk-ai-images allUsers | 있음 | 있음 | — (의도적 CDN) |
| 그 외 공개 버킷 | 0 | 0 | ✅ |

---

## 2. startMONK 종료 선결 — 버킷 2개 내용 감사 (Task 2-B)

### 2-1. `gs://startmonk_bucket` (355 MB, 918 오브젝트)

```
startmonk_bucket/
├── 20251224/          21 MB   이미지 27장 (image_1~27.jpg) — 테스트 촬영
├── backups/           36 KB   monk_assets_tags.json — 태그 백업
├── mission_100/       25 MB   페르소나 PoC 이미지 (persona_01, persona_01_v2, the_one)
├── monk_assets/      247 MB   4MUSE 모델 자산 ← 주력 데이터
│   ├── MUSE_A/        MUSE_A_001~010.jpg
│   ├── MUSE_B/        MUSE_B_001~010.jpg
│   ├── MUSE_C/        MUSE_C_001~006.jpg + faces/
│   ├── MUSE_D/        MUSE_D_001~006.jpg + faces/
│   └── SUB/           SUB_001~010.jpg
├── naming_faces/      79 MB   얼굴 인식 실험 데이터 (face_image_*.jpg, Gemini 생성 포함)
└── session_DATA/       0      빈 폴더
```

**판정**:
- **monk_assets/** (247MB): startMONK 시절 4MUSE 페르소나 원본 이미지. **현 MONK.KR 서비스와 단절** (코드 참조 0건). GDrive 아카이브 후 삭제 권고.
- **naming_faces/** (79MB): 얼굴 인식 R&D 실험 데이터. **보존 가치 낮음** — 삭제 가능.
- **mission_100/** (25MB), **20251224/** (21MB): PoC/테스트 데이터. 삭제 가능.
- **backups/** (36KB): tags 백업. GDrive 이관 후 삭제 가능.
- **전체**: 프로젝트 종료에 **장애물 없음**. 필요 자산(monk_assets)만 GDrive 이관 후 프로젝트 종료 가능.

### 2-2. `gs://monk-data-factory-assets` (257 MB, 242 오브젝트)

```
monk-data-factory-assets/
└── monk_muse_models/
    └── 모델/                       269 MB
        ├── Monk_models.html        갤러리 HTML
        ├── monk_muse.html          갤러리 HTML
        ├── dain/                    11 MB   모델 촬영 (11~51.jpg)
        ├── uni/                     12 MB   모델 촬영 (11~42.jpg)
        ├── 소소/                     6 MB   ← 내부 팀원명
        ├── 민아/                     2 MB   ← 내부 팀원명
        ├── 모델/                    42 MB   하위 세분류
        │   ├── sena/                       모델 촬영
        │   ├── 매트새틴/                    모델 촬영
        │   ├── 민트라인/                    모델 촬영
        │   ├── 코럴라인/                    모델 촬영
        │   ├── 이하늬라인/                  모델 촬영
        │   ├── 송혜교라인/                  모델 촬영
        │   └── 연구자료라인/                 연구 자료
        ├── 여성속옷모델/            102 MB   ← 🚨 민감 촬영물
        │   └── 12-27 아침/                 monk_gene_master_log 포함
        └── 윤교야스냅/              95 MB   ← 개인 스냅 촬영
```

**판정**:
- **monk-factory-storage와 내용 중복**: dain/, uni/, 소소/, 민아/, 윤교야스냅/, 여성속옷모델/ 등 **동일 폴더명 다수**. 두 버킷 모두 동일 원본의 복사본 또는 서브셋.
- 코드 참조 **0건** — 현 서비스와 완전 단절.
- **비공개** (allUsers 없음) — 보안 리스크는 없으나 정리 대상.
- GDrive 아카이브 후 프로젝트 종료 시 자동 삭제 가능.

### 2-3. monk-data-factory 파이프라인 교차 확인

- 코드베이스에서 `monk-data-factory-assets` 참조: **0건**
- `startmonk_bucket` 참조: **0건**
- `startmonk-soul` 참조: **0건**
- `video_muse` 참조: **0건**

→ startMONK 프로젝트(gen-lang-client-0105707468)의 전 버킷이 현 서비스와 **완전 단절**. 종료 시 서비스 영향 없음.

### 2-4. 기타 startMONK 버킷

| 버킷 | 크기 | 비고 |
|------|------|------|
| `startmonk-soul` | 24 KB | archive/_archive/ (빈 중첩). 삭제 가능. |
| `video_muse` | 0 | 빈 버킷. 삭제 가능. |
| `251409703490_*_import_content_with_faq_csv` | 0 | 빈 버킷. Discovery Engine 잔재. 삭제 가능. |
| `run-sources-*-asia-northeast3` | 6.5 KB | Cloud Run 빌드 아티팩트. 프로젝트 삭제 시 자동 정리. |

---

## 3. monk-ai-images 고객 데이터 혼재 실측 (Task 2-C)

### 3-1. 경로별 분류

| 경로 | 크기 | 파일 수 | 분류 | 공개 허용 여부 |
|------|------|--------|------|--------------|
| `raw_data/` | **3.17 GB** | 15,904 | 🔴 원본 데이터 | ❌ 비공개 전환 필요 |
| `service/idphoto/` | **770 MB** | 990 | 🔴 고객 증명사진 | ❌ 비공개 전환 필요 |
| `generated/` | **187 MB** | 164 | 🟡 AI 생성물 | ❌ 비공개 전환 권고 |
| `blog/` | 55 MB | 759 | 🟢 CDN 콘텐츠 | ✅ 공개 유지 |
| `ads/` | 14 MB | 13 | 🟢 CDN 콘텐츠 | ✅ 공개 유지 |
| `assets/` | 58 KB | 10 | 🟢 CDN 콘텐츠 | ✅ 공개 유지 |
| `profiles/` | 10 B | 10 | ⚪ 거의 빈 폴더 | — |

### 3-2. raw_data/ 세부

| 하위 경로 | 크기 | 파일 수 | 내용 |
|----------|------|--------|------|
| `kbeauty_sources/` | 2.93 GB | — | K-뷰티 소스 이미지 |
| `bwya_academy/` | 227 MB | — | bwya 아카데미 자료 |
| `kbeauty_sources_metadata/` | 5 MB | — | 메타데이터 JSON |

### 3-3. 혼재 규모 요약

| 구분 | 크기 | 비율 | 파일 수 |
|------|------|------|--------|
| 🔴 비공개 전환 필요 (고객·원본) | **4.13 GB** | **98.3%** | 17,058 |
| 🟢 공개 유지 (CDN 콘텐츠) | **69 MB** | **1.7%** | 782 |

**핵심**: 버킷의 98.3%가 비공개여야 할 데이터. CDN 용도 자산은 1.7%에 불과.

### 3-4. 4-22 대비 변동

- 4-22 보고서에서 이미 "옵션 1(버킷 분리)" 권고 — **7주간 미이행**.
- `service/idphoto/` 경로가 **신규 확인** (4-22 보고서에는 미언급). kr/jp 구분 하위 경로 포함.
- raw_data/ 크기: 3.17GB (4-22에서는 전체 3.55GB였으므로 raw_data 단독 측정은 이번이 최초).

### 3-5. 버킷 분리 설계 기초자료

**권고 — 2-버킷 분리**:
- `monk-ai-images` (public): ads/, assets/, blog/ 유지 (69MB) — CDN 용도
- `monk-ai-customer-data` (private): raw_data/, service/, generated/ 이관 (4.13GB) — Signed URL 발급 로직 적용

**코드 변경 영향**: deploy.sh 4개 + gcs-save.js 3개 + portal config/upload 2개 + HTML 하드코딩 다수 (4-22 보고서 §1-2 참조)

---

## 4. monk-factory-storage 공개 차단 검증 (Task 2-D)

### 4-1. 현재 상태: 🚨 아직 공개

```
IAM: allUsers → roles/composer.environmentAndStorageObjectViewer (잔존)
```

**익명 curl 검증** (4-22 보고서 §2-1 방법 준용):

| 테스트 | URL | 결과 |
|--------|-----|------|
| 오브젝트 직접 접근 | `https://storage.googleapis.com/monk-factory-storage/monk_models/monk_muse.html` | **HTTP 200** 🚨 |
| 오브젝트 리스트 API | `https://storage.googleapis.com/storage/v1/b/monk-factory-storage/o?maxResults=1` | **HTTP 200** 🚨 |

→ **allUsers 제거 미완료**. 4-22 권고 이후 **7주 + 1일** 경과, 실명 고객 촬영물(618MB) 여전히 공개.

### 4-2. 내용물 현황 (4-22 대비 변동 없음)

```
monk-factory-storage/ (648 MB, 314 오브젝트)
├── 6.3/               28 KB   테스트 데이터 (chips/raw, test_model.json)
└── monk_models/      648 MB   본체
    ├── monk_muse.html          갤러리 HTML
    ├── random_crop.html        크롭 HTML
    ├── 20240928_005_이종윤님(프로필)_/  🚨 실명 고객 촬영물
    ├── dain/                   모델 촬영
    ├── uni/                    모델 촬영
    ├── 모델/                   모델 촬영
    ├── 민아/                   ← 내부 팀원명
    ├── 소소/                   ← 내부 팀원명
    ├── 여성속옷모델/            🚨 민감 촬영물
    └── 윤교야스냅/              개인 스냅
```

### 4-3. monk-data-factory-assets와의 중복

| 폴더 | monk-factory-storage | monk-data-factory-assets | 비고 |
|------|---------------------|------------------------|------|
| dain/ | ✅ | ✅ | 중복 |
| uni/ | ✅ | ✅ | 중복 |
| 소소/ | ✅ | ✅ | 중복 |
| 민아/ | ✅ | ✅ | 중복 |
| 윤교야스냅/ | ✅ | ✅ | 중복 |
| 여성속옷모델/ | ✅ | ✅ | 중복 |
| 20240928_005_이종윤님(프로필)_/ | ✅ | ❌ | factory-storage만 |
| random_crop.html | ✅ | ❌ | factory-storage만 |

**해석**: monk-data-factory-assets는 monk-factory-storage의 서브셋(269MB / 648MB). 두 버킷 모두 동일 모델 촬영 원본을 별개 프로젝트에 복사한 것. 추가로 monk-factory-storage에만 실명 고객 촬영물이 존재.

### 4-4. 조치 권고

| 우선순위 | 조치 | 비고 |
|---------|------|------|
| 🚨 **P0 즉시** | `monk-factory-storage` allUsers IAM 제거 | `gsutil iam ch -d allUsers:composer.environmentAndStorageObjectViewer gs://monk-factory-storage` |
| P1 | 내용물 GDrive 이관 여부 결정 | 작가님 수동 — 모델 촬영 원본 보존 필요 시 |
| P2 | monk-data-factory 프로젝트 종료 | allUsers 제거 + GDrive 이관 완료 후 |

---

## 5. 교차 감사 (막내3 보고서 대비)

> 참조: `REPORT_20260612_iMac막내3_SECURITY_CloudRun_SA맵_종료판정.md`

### 5-1. Cloud Run SA → 버킷 ACL 정합성

| SA | 버킷 IAM 등록 | Cloud Run 사용 | 버킷 접근 필요 | 정합 |
|----|-------------|---------------|--------------|------|
| `monk-image-engine@monkos.iam` | `roles/storage.objectAdmin` (프로젝트 레벨) | 9개 서비스 | `monk-ai-images` (gcs-save.js 업로드) | ✅ 일치 |
| `933456016842-compute@developer` | `roles/editor` (프로젝트 레벨) | monk-n8n, pt | 불명 (7개월 미배포) | ⚠️ 과다 — 버킷 접근 필요 여부 불분명 |

→ monk-image-engine SA가 프로젝트 레벨 `storage.objectAdmin`을 보유하므로, **monkos 프로젝트 내 전 버킷에 접근 가능**. 버킷 분리 시에도 SA 권한 변경 불필요.

### 5-2. 종료 대상 프로젝트 버킷 → 타 프로젝트 참조

| 버킷 | 프로젝트 | 코드 참조 | Cloud Run 참조 | 교차 참조 |
|------|---------|----------|---------------|----------|
| startmonk_bucket | startMONK | 0건 | 0건 | ❌ 안전 |
| monk-data-factory-assets | startMONK | 0건 | 0건 | ❌ 안전 |
| startmonk-soul | startMONK | 0건 | 0건 | ❌ 안전 |
| monk-factory-storage | monk-data-factory | 0건 | 0건 | ❌ 안전 |

→ **4개 버킷 모두 타 프로젝트에서 참조 없음**. 종료 시 서비스 영향 없음.

### 5-3. 막내3 N5 대응 (리전 보정)

막내3이 보고한 Cloud Run 리전 `us-central1`과, 본 건 `run-sources-monkos-us-central1` 버킷(108MB)이 정합. `run-sources-monkos-asia-northeast3` (1.6MB)은 레거시 빌드 잔재로 추정.

---

## 6. 신규 발견사항

| # | 심각도 | 항목 | 권고 |
|---|--------|------|------|
| N1 | 🚨 **CRITICAL** | **monk-factory-storage 공개 7주 미집행** | 즉시 allUsers IAM 제거 |
| N2 | ⚠️ HIGH | **monk-ai-images 98.3%가 비공개 데이터** | 버킷 분리 설계 착수 (PF_SECURITY Phase 2 편입) |
| N3 | ⚠️ MED | **monk-factory-storage ↔ monk-data-factory-assets 중복** (269MB) | 정리 시 한쪽만 GDrive 이관하면 됨 |
| N4 | ⚠️ MED | **service/idphoto/ 경로 770MB** (4-22 미탐지) | 고객 증명사진 990건 공개 CDN 노출 중 |
| N5 | ℹ️ INFO | **startMONK 전 버킷 코드 참조 0건** | 프로젝트 종료 장애물 없음 |
| N6 | ℹ️ INFO | **monkos 프로젝트 빈 버킷 2개** (Discovery Engine import) | 불요 — 정리 가능 |
| N7 | ✅ GOOD | **공개 버킷 수 변동 없음** (2개 유지, 신규 공개 0건) | 통제 상태 |

---

## 7. 감사 방법 / 한계

**사용 명령** (전수 읽기 전용):
- `gcloud projects list` — 전 프로젝트 열거
- `gsutil ls -p {project}` — 프로젝트별 버킷 열거 (7개 프로젝트)
- `gsutil du -s gs://{bucket}` — 버킷별 크기 (17개 버킷)
- `gsutil iam get gs://{bucket}` — 공개 여부 (17개 버킷)
- `gsutil ls [-r] gs://{bucket}/` — 내용 구조 (파일명 리스트까지만)
- `curl -s -o /dev/null -w "HTTP_CODE: %{http_code}"` — 익명 접근 검증
- `grep -r` — 코드베이스 버킷명 참조 전수 검색

**한계:**
- 오브젝트 수: 주요 버킷만 실측 (monk-project, monkos-works-assets 등은 미실측)
- service/idphoto/ 하위 kr/jp 구분 크기: 미세분 (전체 990건 770MB만 확인)
- monk-factory-storage 개별 폴더 크기: 4-22 보고서 기준 인용 (총량만 재실측)

**헌법 준수:**
- 4조 1항 — 키·시크릿 값 조회/생성/추측 없음 ✅
- 4조 2항 — 버킷 삭제·오브젝트 이동·ACL 변경 없음 (전수 읽기 전용) ✅
- **고객 촬영물 내용 열람 없음** — 파일명 리스트까지만 확인 ✅

---

**감사 완료**
**[2026-06-12 12:08 KST] iMac/막내2**
