---
type: report
date: 2026-06-12
from: iMac/막내2
to: iMac/쌍아
status: 완료
subject: "monk-ai-images 3권심사 행정 — 정밀 맵트리 + ACL 실측 + 활성·유휴 판별"
portfolio: PF_SECURITY
---

# monk-ai-images 3권심사 — 행정 (실측·현황)

> **[2026-06-12 13:15 KST]** iMac/막내2 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내2_SECURITY_GCS삼권심사_행정.md`
> 감사 방식: 읽기 전용 (ACL 변경·파일 삭제 금지. 고객 촬영물 내용 열람 없음.)

---

## 1. 정밀 맵 트리 (Task 1)

### 1-0. 버킷 기본 정보

| 항목 | 값 |
|------|-----|
| 버킷명 | `gs://monk-ai-images` |
| 프로젝트 | monkos (933456016842) |
| 총 용량 | **4.20 GB** |
| 총 파일 수 | **17,850** |
| 버킷 IAM 공개 | allUsers → `roles/storage.objectViewer` |
| Uniform bucket-level access | **Enabled: False** (Fine-Grained ACL 모드) |
| SA owner | monk-image-engine@monkos.iam (`storage.objectAdmin` at project level) |

### 1-1. 디렉토리 트리

```
gs://monk-ai-images/                               4.20 GB   17,850건
│
├── ads/                                            14 MB        13건   [최신: 2026-03-06]  [ACL: allUsers READER ✅]
│   ├── 20260220_*.jpg (히어로 이미지 ×3)
│   ├── 20260302_*.png/jpg (스크린샷 ×2)
│   └── manifest.json
│
├── assets/                                         58 KB        10건   [최신: 2026-03-15]  [ACL: allUsers 없음 ❌]
│   └── portal/
│       └── slide/                                  58 KB        10건
│           └── 0311_001~010.webp (포털 슬라이드)
│
├── blog/                                           55 MB       759건   [최신: 2026-06-11]
│   ├── (flat files)                                51 MB       634건   [ACL: allUsers 없음 ❌]
│   │   ├── 1773*.jpg/webp (CMS 업로드, timestamp prefix)
│   │   └── og_*.jpg (OG 이미지)
│   └── (slug subdirs ×14)                          1.3 MB      125건   [ACL: allUsers READER ✅]
│       ├── 20년-사진작가가-ai로-만든-증명사진-서비스-monkosai/   25 KB    6건
│       ├── ai에-대한-서론/                                      7 KB    3건
│       ├── untitled-mmqwqq8i/                                 133 KB    8건
│       ├── 내-손안에-사진관-monkosai-사용법을-소개합니다/         43 KB   21건
│       ├── 사진관-12년-ai-증명사진-앱개발/                      38 KB    4건
│       ├── 사진관-가기-전에-꼭-읽어야-할-취준생-…/              33 KB    8건
│       ├── 증명사진-메이크업-취업-여권-…/                       27 KB    4건
│       ├── 증명사진-면접-헤어에-…/                             111 KB    6건
│       ├── 증명사진-잘-나오는-표정-…/                          166 KB   13건
│       ├── 증명사진-헤어스타일-…/                              157 KB   13건
│       ├── 취업-증명사진-의상-컬러-선택법-…/                   169 KB   13건
│       ├── 한-연구원-매거진-…/                                 53 KB    4건
│       ├── 한번쯤-고민하게-되는-아기-여권사진-…/               112 KB   10건
│       └── 한연구원-칼럼-…/                                   211 KB   12건
│
├── generated/                                     187 MB       164건   [최신: 2026-02-28]  [ACL: allUsers 없음 ❌]
│   ├── .keep
│   ├── 17696*.png (초기 생성물, 2026-01-29)
│   ├── 17715*.png/jpg (생성물, 2026-01-29~02-21)
│   └── 17723*.jpg (최신 생성물, 2026-02-28)
│
├── profiles/                                       10 B        10건   [최신: 2026-04-29]  [ACL: 미확인]
│   ├── background/.keep
│   ├── fashion/.keep
│   ├── hair/.keep
│   ├── makeup/.keep
│   └── master/
│       ├── artist/.keep
│       ├── beauty/.keep
│       ├── executive/.keep
│       ├── fitting/.keep
│       ├── linkedin/.keep
│       └── professional/.keep
│
├── raw_data/                                     3.17 GB    15,904건   [최신: 2026-02-06]  [ACL: allUsers 없음 ❌]
│   ├── bwya_academy/                              227 MB       51건
│   │   └── 강의실(B.W.Y.A)/
│   │       ├── 제2학문 패션학/   (.docx 파일들)
│   │       └── 제5학문 AI 디렉팅학/
│   ├── kbeauty_sources/                          2.93 GB        —
│   │   ├── bg_cafe/
│   │   ├── bg_interior/
│   │   ├── bg_street/
│   │   ├── bg_studio/
│   │   ├── manual/              (10건, 5.7MB)
│   │   ├── naver_background/
│   │   ├── naver_bg_cafe/
│   │   ├── naver_bg_interior/
│   │   ├── naver_bg_nature/
│   │   ├── naver_bg_street/
│   │   ├── naver_bg_studio/
│   │   ├── naver_fashion/
│   │   ├── naver_hair/
│   │   ├── naver_lingerie/
│   │   ├── naver_makeup/
│   │   └── naver_model/         (579건, 244MB)
│   └── kbeauty_sources_metadata/                    5 MB    7,955건
│       ├── naver_bg_interior/
│       ├── naver_bg_nature/
│       ├── naver_bg_street/
│       ├── naver_bg_studio/
│       ├── naver_fashion/
│       ├── naver_hair/
│       ├── naver_lingerie/
│       ├── naver_makeup/
│       └── naver_model/
│
└── service/                                       770 MB       990건   [최신: 2026-06-10]  [ACL: allUsers 없음 ❌]
    └── idphoto/
        ├── jp/                                     34 MB       118건   [최신: 2026-06-09]
        │   └── line_U*/    (LINE 유저 ID별 폴더)
        │   └── 1158*/      (Google ID별 폴더)
        └── kr/                                    736 MB       872건   [최신: 2026-06-10]
            ├── 1034*/~1178*/   (Google ID별 폴더 ×16)
            ├── kakao_47*/~49*/  (카카오 ID별 폴더)
            ├── studio-internal/ (내부 테스트)
            └── studio-profiles/ (프로필 촬영)

```

---

## 2. 활성/유휴 판별 (Task 2)

| 경로 | 최신 쓰기 | 판별 | 비고 |
|------|----------|------|------|
| `ads/` | 2026-03-06 | 🟡 **저활성** (3개월+) | 광고 이미지 업로드 후 변동 없음 |
| `assets/portal/slide/` | 2026-03-15 | 🟡 **저활성** (3개월) | 포털 슬라이드 1회 업로드 후 정적 |
| `blog/` (flat) | **2026-06-11** | 🟢 **활성** (1일 전) | CMS에서 블로그 이미지 지속 업로드 중 |
| `blog/` (slug subdirs) | — | 🔴 **유휴** | Naver 마이그레이션 일괄 이관본. 추가 쓰기 없음 |
| `generated/` | 2026-02-28 | 🔴 **유휴** (3.5개월+) | studio v1 시절 생성물. 현재는 service/ 경로 사용 |
| `profiles/` | 2026-04-29 | 🟡 **저활성** (1.5개월) | 프로필 카테고리 .keep 파일만 (실데이터 없음) |
| `raw_data/` | 2026-02-06 | 🔴 **유휴** (4개월+) | 초기 트레이닝 데이터 일괄 업로드 후 변동 없음 |
| `service/idphoto/kr/` | **2026-06-10** | 🟢 **활성** (2일 전) | 고객 증명사진 지속 생성 중 |
| `service/idphoto/jp/` | **2026-06-09** | 🟢 **활성** (3일 전) | JP 고객 증명사진 지속 생성 중 |

### 활성도 요약

| 활성도 | 경로 | 크기 | 파일 수 |
|--------|------|------|--------|
| 🟢 **활성** (30일 이내) | blog/ flat, service/idphoto/ | **821 MB** | 1,624 |
| 🟡 **저활성** (30일~6개월) | ads/, assets/, profiles/ | **14 MB** | 33 |
| 🔴 **유휴** (6개월+) | generated/, raw_data/, blog/ slug subdirs | **3.36 GB** | 16,193 |

→ **유휴 데이터가 80%** (3.36GB / 4.20GB). 활성 데이터는 주로 service/idphoto/(고객 증명사진)와 blog/(CMS 업로드).

---

## 3. 파일 레벨 ACL 현황 (Task 3)

### 3-1. 버킷 ACL 구조 (Fine-Grained)

이 버킷은 **Uniform bucket-level access: Disabled** (Fine-Grained ACL 모드). 두 레이어가 동시에 적용:
- **레이어 1 (Bucket IAM)**: `allUsers → roles/storage.objectViewer` → 전 오브젝트 읽기 허용
- **레이어 2 (File ACL)**: 파일별 개별 ACL → 일부 파일에만 `allUsers: READER` 설정됨

### 3-2. 경로별 파일 레벨 ACL 실측

| 경로 | 샘플 파일 | 파일 레벨 allUsers | 업로드 주체 | 버킷 IAM 제거 시 |
|------|----------|-------------------|------------|-----------------|
| `ads/manifest.json` | manifest.json | ✅ **READER** | gdsajin@gmail.com | 🟢 **공개 유지** |
| `ads/20260220_*.jpg` | 20260220_191208.jpg | ✅ **READER** | gdsajin@gmail.com | 🟢 **공개 유지** |
| `assets/portal/slide/` | 0311_001.webp | ❌ 없음 | gdsajin@gmail.com | 🔴 **비공개 전환** |
| `blog/` (flat) | 1781162145588.jpg | ❌ 없음 | (403 getIamPolicy) | 🔴 **비공개 전환** |
| `blog/` (slug subdir) | IMG_3790.jpg | ✅ **READER** | (file-level) | 🟢 **공개 유지** |
| `generated/` | 1769655806394_0.png | ❌ 없음 | monk-image-engine SA | 🔴 **비공개 전환** |
| `raw_data/` | naver_2bc5188422a4.jpg | ❌ 없음 | gdsajin@gmail.com | 🔴 **비공개 전환** |
| `service/idphoto/` | 2026-03-18T08_generated.png | ❌ 없음 | monk-image-engine SA | 🔴 **비공개 전환** |
| `profiles/` | (미확인, .keep only) | (추정 없음) | — | 🔴 **비공개 전환** |

### 3-3. 핵심 발견 — 버킷 IAM allUsers 제거 시 영향 시뮬레이션

**Fine-Grained 모드이므로, bucket-level IAM의 allUsers를 제거하면 file-level ACL에 allUsers가 있는 파일만 공개 유지.**

| 결과 | 경로 | 파일 수 | 크기 | 영향 |
|------|------|--------|------|------|
| 🟢 **계속 공개** | ads/ 전체 | 13 | 14 MB | 파일 레벨 allUsers 있음 |
| 🟢 **계속 공개** | blog/ slug subdirs | 125 | 1.3 MB | 파일 레벨 allUsers 있음 |
| 🔴 **비공개 전환** | blog/ flat files | 634 | 51 MB | ⚠️ **CMS 블로그 이미지 깨짐** |
| 🔴 **비공개 전환** | assets/portal/slide/ | 10 | 58 KB | ⚠️ **포털 슬라이드 깨짐** |
| 🔴 **비공개 전환** | generated/ | 164 | 187 MB | ✅ 의도대로 (유휴, 비공개 전환 정당) |
| 🔴 **비공개 전환** | raw_data/ | 15,904 | 3.17 GB | ✅ 의도대로 |
| 🔴 **비공개 전환** | service/idphoto/ | 990 | 770 MB | ✅ 의도대로 (고객 데이터 비공개 필수) |
| 🔴 **비공개 전환** | profiles/ | 10 | 10 B | ✅ 의도대로 |

### 3-4. 비공개 전환 시 부수 피해 정리

버킷 IAM allUsers를 단순 제거할 경우 **의도치 않은 서비스 중단 2건**:

| 피해 경로 | 중단 내용 | 파일 수 | 해법 |
|-----------|----------|--------|------|
| `blog/` flat files (634건) | 블로그 본문 인라인 이미지·OG 이미지 깨짐 | 634 | 파일 레벨 allUsers READER 추가 필요 |
| `assets/portal/slide/` (10건) | 포털 슬라이드 10장 깨짐 | 10 | 파일 레벨 allUsers READER 추가 필요 |

→ **총 644건**에 파일 레벨 allUsers 추가 후 bucket IAM 제거하면 안전.

### 3-5. 업로드 주체별 패턴

| 업로드 주체 | 경로 | file-level allUsers | 설명 |
|------------|------|---------------------|------|
| **gdsajin@gmail.com** (작가님 수동) | ads/, raw_data/, assets/ | ads/만 ✅ | gsutil cp + ACL 명시 설정 시 |
| **monk-image-engine SA** (서비스 자동) | generated/, service/ | 전부 ❌ | gcs-save.js가 ACL 미설정 업로드 |
| **CMS/Portal** (서비스 자동) | blog/ flat | ❌ | upload.js가 ACL 미설정 업로드 |
| **마이그레이션 스크립트** | blog/ slug subdirs | ✅ | migrate_naver_full_content.js가 allUsers 설정 |

→ 코드에서 allUsers를 명시 설정하는 것은 **마이그레이션 스크립트뿐**. 일상 업로드는 allUsers 미설정.

---

## 4. 행정 판단 요약 (입법·사법 참조용)

### 4-1. 즉시 실행 가능 여부

**버킷 IAM allUsers 단순 제거 = ❌ 불가** — blog flat 634건 + assets 10건 서비스 중단 발생.

**안전 시퀀스 (선조치 → 제거)**:
1. blog/ flat 634건 + assets/ 10건 → 파일 레벨 `allUsers: READER` 추가 (스크립트 자동화 가능)
2. 추가 완료 확인 (curl 검증)
3. 버킷 IAM allUsers 제거
4. 사후 검증: 전 경로 curl 테스트

**예상 소요**: 스크립트 실행 ~5분 + 검증 ~5분 = ~10분

### 4-2. 대안 — Uniform bucket-level access 전환

Fine-Grained → Uniform 전환 시:
- 모든 파일 레벨 ACL **무효화** (90일 유예 후 복구 불가)
- bucket IAM만으로 제어
- ⚠️ **ads/ 파일 레벨 allUsers도 소실** — 역으로, allUsers IAM 제거 한 번으로 전 경로 비공개화 가능
- 이 경우 CDN 경로만 별도 설계 필요 (Signed URL or 별도 public 버킷)

### 4-3. 데이터 분류 매트릭스 (입법 기초자료)

| 분류 | 경로 | 크기 | 파일 수 | 성격 | 권고 |
|------|------|------|--------|------|------|
| **L1 공개 CDN** | ads/ | 14 MB | 13 | 광고 이미지 | 공개 유지 |
| **L1 공개 CDN** | assets/ | 58 KB | 10 | 포털 슬라이드 | 공개 유지 |
| **L1 공개 CDN** | blog/ | 55 MB | 759 | 블로그 이미지 | 공개 유지 |
| **L3 고객 데이터** | service/idphoto/ | 770 MB | 990 | 고객 증명사진 원본+생성 | 비공개 필수 |
| **L3 트레이닝 데이터** | raw_data/ | 3.17 GB | 15,904 | 수집 원본 + 메타데이터 | 비공개 필수 |
| **L3 생성물** | generated/ | 187 MB | 164 | AI 생성 이미지 (유휴) | 비공개 전환 |
| **L4 미사용** | profiles/ | 10 B | 10 | 빈 .keep 파일만 | 비공개 (무관) |

---

## 5. 감사 방법

**사용 명령** (전수 읽기 전용):
- `gsutil uniformbucketlevelaccess get` — Fine-Grained/Uniform 확인
- `gsutil ls [-r] [-l]` — 디렉토리 트리, 파일 날짜, 파일 수
- `gsutil du -s` — 경로별 크기
- `gsutil acl get` — 파일 레벨 ACL 샘플 (7개 경로 ×1~2건)
- `curl -s -o /dev/null -w "HTTP %{http_code}"` — 익명 접근 검증 (7개 경로)

**헌법 준수:**
- 4조 2항 — ACL 변경·파일 삭제 없음 (전수 읽기 전용) ✅
- 고객 촬영물 내용 열람 없음 — 파일명·메타데이터·ACL까지만 ✅

---

**감사 완료**
**[2026-06-12 13:15 KST] iMac/막내2**
