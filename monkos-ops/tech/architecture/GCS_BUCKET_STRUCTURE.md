---
type: spec
date: 2026-06-12
subject: "GCS 버킷 전수 구조 — 7개 프로젝트 17개 버킷"
status: 현행
---

# GCS 버킷 구조 (2026-06-12 실측)

> 마지막 갱신: 2026-06-12 (REPORT_20260612_iMac막내2_SECURITY_GCP버킷전수.md 기반)

---

## 전체 현황

| 프로젝트 | 버킷 수 | 합계 용량 | 공개 버킷 |
|---------|--------|----------|----------|
| monkos | 9 | ~8.6 GB | 1 (monk-ai-images) |
| monk-data-factory | 1 | 648 MB | 1 🚨 (monk-factory-storage) |
| startMONK (gen-lang-client-0105707468) | 6 | 627 MB | 0 |
| monkos-3c6e4 (Firebase) | 1 | 1.0 MB | 0 |
| monkos-aistudio (gen-lang-client-0127984847) | 0 | — | — |
| Default Gemini (gen-lang-client-0705237063) | 0 | — | — |
| My Maps (savvy-cinema-481804-r1) | 0 | — | — |

---

## monkos 프로젝트

### monk-ai-images (4.20 GB, 17,850 오브젝트)

**공개**: allUsers `roles/storage.objectViewer` (의도적 CDN)

```
monk-ai-images/
├── ads/               14 MB     13건   광고 매니페스트 + 이미지 (photolab 히어로)
├── assets/            58 KB     10건   포털 슬라이드
├── blog/              55 MB    759건   블로그 이미지
├── generated/        187 MB    164건   AI 생성 결과물 ← 🔴 비공개 전환 권고
├── profiles/          10 B     10건   프로필 카테고리 (거의 빈 폴더)
├── raw_data/        3.17 GB  15,904건  원본 데이터 ← 🔴 비공개 전환 필요
│   ├── bwya_academy/        227 MB
│   ├── kbeauty_sources/    2.93 GB
│   └── kbeauty_sources_metadata/  5 MB
└── service/          770 MB    990건   서비스 데이터 ← 🔴 비공개 전환 필요
    └── idphoto/
        ├── jp/
        └── kr/
```

**참조 코드**: MONK_kr/ai_lab, monkos_AI/studio, idphoto-jp, idphoto-kr, portal — deploy.sh 4개, gcs-save.js 3개, HTML 다수
**SA**: monk-image-engine@monkos.iam (`storage.objectAdmin`)
**리스크**: 98.3%가 비공개 데이터 (4.13GB). CDN 콘텐츠는 1.7% (69MB).
**권고**: 버킷 분리 — public(ads/assets/blog) + private(raw_data/service/generated)

### monk-project (3.36 GB)

**비공개**. 프로젝트 범용 자산 저장소.

### monkos-works-assets (606 MB)

**비공개**. works 관련 자산.

### monkos_cloudbuild (252 MB)

**비공개**. Cloud Build 아티팩트.

### run-sources-monkos-* (3개)

| 리전 | 크기 |
|------|------|
| us-central1 | 108 MB |
| asia-northeast1 | 67 MB |
| asia-northeast3 | 1.6 MB |

**비공개**. Cloud Run 소스 아카이브.

### Discovery Engine import 버킷 (2개, 빈 버킷)

- `933456016842_810216434_asia_northeast3_import_content` — 0
- `933456016842_810216434_us_import_content` — 0

정리 가능.

---

## monk-data-factory 프로젝트

### monk-factory-storage (648 MB, 314 오브젝트) 🚨

**공개**: allUsers `roles/composer.environmentAndStorageObjectViewer` — **P0 미집행 (4-22 권고 후 7주+)**

```
monk-factory-storage/
├── 6.3/               28 KB   테스트 데이터
└── monk_models/      648 MB   과거 몽크사진관 촬영물
    ├── 20240928_005_이종윤님(프로필)_/  🚨 실명 고객
    ├── dain/                          모델 촬영
    ├── uni/                           모델 촬영
    ├── 모델/                          모델 촬영
    ├── 민아/                          ← 내부 팀원명
    ├── 소소/                          ← 내부 팀원명
    ├── 여성속옷모델/                   🚨 민감 촬영물
    └── 윤교야스냅/                     개인 스냅
```

**코드 참조**: 0건 (서비스 단절)
**거취**: allUsers 즉시 제거 → GDrive 이관 후 프로젝트 종료

---

## startMONK 프로젝트 (gen-lang-client-0105707468)

### startmonk_bucket (355 MB, 918 오브젝트)

**비공개**

```
startmonk_bucket/
├── 20251224/          21 MB   테스트 촬영 (image_1~27.jpg)
├── backups/           36 KB   monk_assets_tags.json
├── mission_100/       25 MB   페르소나 PoC (persona_01, the_one)
├── monk_assets/      247 MB   4MUSE 모델 자산 (MUSE_A~D, SUB)
├── naming_faces/      79 MB   얼굴 인식 실험 데이터
└── session_DATA/       0      빈 폴더
```

**코드 참조**: 0건
**거취**: 필요 자산(monk_assets) GDrive 이관 후 프로젝트 종료

### monk-data-factory-assets (257 MB, 242 오브젝트)

**비공개**

```
monk-data-factory-assets/
└── monk_muse_models/모델/     269 MB
    ├── dain/, uni/            모델 촬영
    ├── 소소/, 민아/            ← 내부 팀원명
    ├── 여성속옷모델/           🚨 민감 촬영물
    ├── 윤교야스냅/             개인 스냅
    └── 모델/                  하위 세분류 (sena, 매트새틴, 민트라인, 코럴라인 등)
```

**monk-factory-storage의 서브셋** (269MB / 648MB). 코드 참조 0건.

### 기타

| 버킷 | 크기 | 비고 |
|------|------|------|
| startmonk-soul | 24 KB | archive/_archive/ (빈 중첩) |
| video_muse | 0 | 빈 버킷 |
| 251409703490_*_import_content_with_faq_csv | 0 | 빈 버킷 (Discovery Engine) |
| run-sources-*-asia-northeast3 | 6.5 KB | Cloud Run 빌드 잔재 |

---

## monkos-3c6e4 프로젝트 (Firebase)

### gcf-sources-676916736379-us-central1 (1.0 MB)

**비공개**. Cloud Functions 소스 아카이브.

---

## 거취 판정 요약

| 판정 | 버킷 | 조치 |
|------|------|------|
| **즉시 조치** | monk-factory-storage | allUsers 제거 (P0) |
| **설계 필요** | monk-ai-images | 버킷 분리 (public/private) |
| **GDrive 이관 → 삭제** | startmonk_bucket, monk-data-factory-assets, startmonk-soul | 프로젝트 종료 선결 |
| **빈 버킷 삭제** | video_muse, 251409703490_*, Discovery Engine import ×2 | 정리 |
| **유지** | monk-project, monkos-works-assets, monkos_cloudbuild, run-sources-*, gcf-sources-* | 현행 유지 |
