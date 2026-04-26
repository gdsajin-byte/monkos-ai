---
type: REPORT
date: 2026-04-22
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: PUBLIC 버킷 2건 맥락 확인
---

# PUBLIC 버킷 맥락 확인 보고서

> **[2026-04-22 12:17 KST] iMac/막내1 → iMac/쌍아**
> 근거 지시서: `ORDER_20260422_PUBLIC버킷_맥락확인.md`
> 작가님 추정: "CF Images 폐지 + 블로그 에디터 이미지 로딩 때문에 퍼블릭으로 돌렸을 것"

---

## 결론 요약

| 버킷 | 퍼블릭 사유 | 의도 판정 | 조치 권고 |
|---|---|---|---|
| `gs://monk-ai-images` | 서비스 이미지 CDN (CF Images 대체) | **✅ 의도적** | 유지 (정기 감사 대상으로 관리) |
| `gs://monk-factory-storage` | 과거 몽크사진관/모델 촬영 작업물 저장소 | **🚨 우발적/방치** | **즉시 퍼블릭 제거** (CRITICAL — 실명 고객 촬영물 618MiB 노출) |

작가님 추정은 **`monk-ai-images`에 대해서는 정확**. `monk-factory-storage`는 **전혀 다른 맥락**(과거 몽크사진관 작업물) — 별개 이슈로 즉시 처리 필요.

---

## 1. `gs://monk-ai-images` (monkos 프로젝트)

### 1-1. 퍼블릭 권한
- `roles/storage.objectViewer` allUsers 부여 (bucket IAM)
- 익명 curl로 HTTP/2 200 확인 ✅

### 1-2. 코드베이스 참조 (전수 조사)
직접 퍼블릭 URL(`https://storage.googleapis.com/monk-ai-images/...`) 임베드 확인:

**프론트엔드 (하드코딩)**
- `MONK_kr/ai_lab/photolab/index.html:390,407,411,415,419` — 히어로 이미지 + 용도별 예시
- `MONK_kr/ai_lab/photolab/result.js:20` — `AD_MANIFEST_URL = '.../ads/manifest.json'`
- `monkos_AI/studio/public/index.html:672,675,678,682,685,688` — 증명사진 예시
- `monkos_AI/idphoto-jp/public/index.html:669,672,675,679,682,685` — 일본어 버전
- `monkos_AI/idphoto-kr/public/index.html:672,675,678,682,685,688` — 한국어 버전
- `monkos_AI/portal/public/index.html:135-144` — 포털 슬라이드 10장 (`/assets/portal/slide/`)
- `monkos_AI/portal/public/admin/gallery.html:131` — 갤러리 관리자 placeholder

**백엔드 (업로드/URL 생성)**
- `monkos_AI/studio/gcs-save.js:10`, `idphoto-jp/gcs-save.js:10`, `idphoto-kr/gcs-save.js:10` — `GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images'`
- `monkos_AI/portal/lib/shared/config.js:66` — 동일 폴백
- `monkos_AI/portal/lib/cms/upload.js:112,188` — CMS 업로드 후 퍼블릭 URL 반환
- `monkos_AI/portal/scripts/migrate_naver_full_content.js:177` — 네이버 마이그레이션 URL 변환

**deploy.sh (환경변수 주입)**
- `monkos_AI/studio/deploy.sh:35`, `idphoto-jp/deploy.sh:44`, `idphoto-kr/deploy.sh:44`, `portal/deploy.sh:60` — 모두 `GCS_BUCKET="monk-ai-images"`

**문서**
- `monkos_AI/infrastructure/DEPLOY_GUIDE.md`, `SERVICE_MAP.md` — 정본 버킷 명시
- `monkos-ops/works/images/README.md` — "고객 증명사진 원본+생성본, 블로그 이미지, 광고 | 3.3GB"
- `monkos-ops/scripts/ads_sync.py`, `ads_upload.sh` — 광고 매니페스트 업로드 스크립트

### 1-3. 버킷 내용물
```
gs://monk-ai-images/
├── ads/            # 광고 매니페스트 + 이미지 (photolab 히어로)
├── assets/portal/  # 포털 슬라이드 (0311_001.webp ~ 010.webp)
├── blog/           # 블로그 이미지 (작가님 추정 "블로그 에디터 이미지 로딩" 일치)
├── generated/      # AI 생성 결과물
├── raw_data/       # 원본 데이터
└── service/idphoto/ # 서비스별 자산
총 17,388개 오브젝트, 3.55 GiB
```

### 1-4. 히스토리 증거 (세션 로그)
- **2026-02-20**: "GCS `gs://monk-ai-images/ads/` 6장 업로드 **+ public ACL** + manifest.json" — 초기 업로드 시점에 이미 public 설정
- **2026-02-28**: "GCS `monk-ai-images/ads/manifest.json` 프록시"
- **2026-03-08**: "⏳ GCS monk-ai-images 보안 이슈 (allUsers 공개)" — **이미 어젠다에 등록됨**
- **2026-03-15**: "현황 조사: GCS 2버킷(monk-ai-images 3.3GB + monk-project 3.4GB), R2 monk-apps(소량), **CF Images 탈퇴**"
- **2026-03-15**: "GCS_BUCKET_STRUCTURE.md 업데이트 — monk-ai-images 에셋 경로 + 4계층 + CF 로드맵"

### 1-5. CF Images 흔적
- 유일한 잔존: `MONK_kr/ai_lab/model_agency/index.html:265-285` (21개 URL, `imagedelivery.net/sWFJWbnONRpMSja8jmz-XA/...`)
- 모델 에이전시 페이지만 아직 CF Images 사용 중. 나머지 전부 GCS로 이관 완료.

### 1-6. 판정
**✅ 의도적 퍼블릭** — 작가님 추정 정확히 부합.
- CF Images 탈퇴 후 GCS를 CDN으로 사용 중
- 광고/블로그/갤러리/포털 슬라이드 모두 HTML에 직접 URL 임베드
- 퍼블릭이 아니면 Signed URL 발급 로직 필요 — 현재 아키텍처와 불일치

### 1-7. 리스크 / 개선안
- **잔존 리스크**:
  - `/generated/`, `/raw_data/` 경로에 **고객 증명사진 생성본/원본**이 같은 버킷에 있으면 공개되어 버린다. 경로 분리 필요.
  - `works/images/README.md`에 "고객 증명사진 원본+생성본, 블로그 이미지, 광고" 모두 한 버킷으로 명시 → L1 고객 데이터와 L4 공개 자산 혼재
- **개선 옵션**:
  1. **버킷 분리**: `monk-ai-images-public`(광고/블로그/assets) + `monk-ai-customer-data`(원본/생성본). 후자는 private + Signed URL.
  2. **경로별 IAM**: 현재 bucket-level public은 유지하되, `/generated/`, `/raw_data/` 는 object-level private (복잡)
  3. **현상 유지**: 증명사진이 실명 없는 익명 해시 파일명이면 공개되어도 개인식별 어려움. 경로명만 공개 — 그러나 직접 링크 공유 시 접근 가능.
- **권고**: 옵션 1(버킷 분리) 로드맵 검토. 단기는 현상 유지, 서비스 안정화 후 재설계.

---

## 2. `gs://monk-factory-storage` (monk-data-factory 프로젝트)

### 2-1. 퍼블릭 권한
- `roles/composer.environmentAndStorageObjectViewer` **allUsers** 부여
- 이 role에는 `storage.objects.get`/`list` 권한이 포함됨
- **익명 curl로 실제 object 접근 가능 확인**:
  - HEAD: `HTTP/2 200`
  - 리스트: `storage.googleapis.com/storage/v1/b/monk-factory-storage/o?maxResults=3` → object 메타데이터 + mediaLink 그대로 반환

### 2-2. 코드베이스 참조
- **없음**. 리포 전체 grep 결과 레퍼런스 0건 (감사 보고서/지시서 자기 참조 제외).
- `GCS_BUCKET_STRUCTURE.md`, `SERVICE_MAP.md` 어디에도 언급 없음.
- 현재 운영 코드와 **단절된 버킷**.

### 2-3. Cloud Composer 환경
- `composer.googleapis.com` API **미활성**
- Cloud Composer 환경 0개
- 즉, `composer.environmentAndStorageObjectViewer` role 부여의 원래 의도(Composer 환경 공유)가 **현재 존재하지 않음**
- 과거 Composer를 썼다가 환경을 삭제했거나, Composer를 쓰려다 중단한 흔적

### 2-4. 버킷 내용물
```
gs://monk-factory-storage/
├── 6.3/                   # 27.09 KiB — 테스트 데이터 (chips/raw/M20251230_*.json)
│   └── test_model.json
│   └── chips/raw/M20251230_*.json
└── monk_models/           # 618.37 MiB — 실제 규모
    ├── monk_muse.html
    ├── random_crop.html
    ├── 20240928_005_이종윤님(프로필)_/  ← 🚨 실명 고객 촬영물
    ├── dain/
    ├── uni/
    ├── 모델/
    ├── 민아/                              ← 내부 팀원명
    ├── 소소/                              ← 내부 팀원명
    ├── 여성속옷모델/                       ← 🚨 민감한 촬영물
    └── 윤교야스냅/                         ← 🚨 개인 스냅
총 357 라인 (폴더 포함)
```

### 2-5. 판정
**🚨 CRITICAL — 우발적/방치된 공개 상태**
- **용도**: 과거 몽크사진관 또는 모델 스튜디오의 원본 촬영 작업물 저장소
- **공개 사유 추정**: Cloud Composer 환경 생성 시 자동 부여되었거나, 초기 셋업 시 수동 부여 후 Composer 제거하면서 IAM은 남아있음
- **위험**:
  1. **초상권/프라이버시**: `20240928_005_이종윤님(프로필)_/` — **본명 포함 폴더명**. 구글 인덱싱 가능 범위 내 공개.
  2. **민감 콘텐츠**: `여성속옷모델/`, `윤교야스냅/` — 촬영 컨텐츠의 외부 유출 리스크
  3. **내부 식별자**: `민아/`, `소소/` — 내부 팀 호칭 노출 (헌법 4조 3항 위반 소지)
- **악용 경로**: 버킷명이 알려지면 `storage.googleapis.com/storage/v1/b/monk-factory-storage/o` 로 전체 object 리스트 획득 가능 → mediaLink로 직접 다운로드

### 2-6. 조치 권고 (즉시)
1. **1순위**: allUsers IAM 제거
   ```bash
   # 작가님 승인 후 실행 (이 보고서는 읽기 전용이므로 실행 안 함)
   gsutil iam ch -d allUsers:composer.environmentAndStorageObjectViewer gs://monk-factory-storage
   ```
2. **2순위**: 내용물 감사 — 계속 보관할 것인지, 별도 개인 GDrive로 이관할 것인지 결정
3. **3순위**: 필요한 콘텐츠만 남기고 나머지 영구 삭제 또는 아카이브 (cold storage)

---

## 3. 추가 발견사항

### 3-1. IAM 변경 히스토리 (Cloud Logging 조회)
`gcloud logging read` 결과 (freshness=1y):

**`monk-ai-images`**:
- `2026-01-29T03:05:56Z` — gdsajin@gmail.com / setIamPermissions
- `2026-03-06T06:06:36Z` — gdsajin@gmail.com / setIamPermissions

**`monk-factory-storage`**:
- `2025-12-30T13:57:42Z` — gdsajin@gmail.com / setIamPermissions (1건만 남아있음)

**해석**:
- 두 버킷 모두 **작가님이 직접 IAM 수정**한 로그가 남아있음
- `monk-factory-storage`의 2025-12-30 시점 수정이 **현재 allUsers 권한 부여 시점일 가능성**이 높음. 그 이전 설정은 로그 보관 주기(1년) 초과로 조회 불가
- `monk-ai-images`는 2026-01-29(초기), 2026-03-06(조정) 두 차례 수정 — 2/20 이전에 이미 퍼블릭 ACL이 부여된 것과 일치
- 2024-09-28 촬영물이 `monk-factory-storage`에 있으므로 버킷 자체는 1년 이상 된 버킷. 초기 IAM 설정은 로그에서 추적 불가

### 3-2. monk-factory-storage IAM 이례성
`roles/composer.environmentAndStorageObjectViewer`는 **매우 특수한 role**이다:
- 일반적으로 IAM 화면에서 선택되는 기본 role이 아님 (검색해서 찾아야 나옴)
- **Cloud Composer 환경 생성 시 자동 부여되는 role**일 가능성이 높음
- 즉, 과거 시점에 monk-data-factory 프로젝트에서 Composer 환경을 셋업 시도 → 환경 삭제 → 이 IAM만 남음 → 방치

### 3-3. rules/deployment.md 정본 확인 (부가 검증)
- `monkos_AI/*/deploy.sh` 전부에 `GCS_BUCKET="monk-ai-images"` 하드코딩 확인 ✅
- 법률 ch5 2조 준수 상태 정상

---

## 4. 권고 액션 아이템 (쌍아 → 작가님 승인 요청용)

| 우선순위 | 액션 | 대상 | 예상 영향 |
|---|---|---|---|
| 🚨 P0 | `gs://monk-factory-storage`에서 allUsers IAM 제거 | monk-data-factory | **서비스 영향 없음** (코드 참조 0건) |
| ⚠️ P1 | `monk-factory-storage` 내용물 감사 + 보관 정책 결정 | 작가님 수동 | 과거 촬영물 정리 |
| ℹ️ P2 | `monk-ai-images` 내 `/generated/`, `/raw_data/` 고객 데이터 경로 분리 로드맵 | 중장기 | 아키텍처 리팩토링 |
| ℹ️ P3 | `gs://monk-ai-images` allUsers IAM은 **유지** (CDN 용도) | — | 변경 없음 |
| ℹ️ P4 | `MONK_kr/ai_lab/model_agency/index.html` CF Images 마이그레이션 | 잔존 21개 URL | 선택 사항 |

---

## 5. 준수 조항 확인

- ⚠️ **헌법 4조 1항**: 버킷 내 파일 **내용 조회 안 함** (파일명 리스트 + HEAD 응답 코드만 확인) ✅
- ⚠️ **헌법 4조 2항**: IAM 수정 명령 **실행 안 함** (읽기 전용) ✅
- ⚠️ **피드백: 진단 1순위 = 실제 리소스 직접 조회**: `gcloud`/`gsutil`/`curl` 순차 사용 — 가설 없이 실체 확인 ✅

---

**보고 완료**
**[2026-04-22 12:17 KST] iMac/막내1**
