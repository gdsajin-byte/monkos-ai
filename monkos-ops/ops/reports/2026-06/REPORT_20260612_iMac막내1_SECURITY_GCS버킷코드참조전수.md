---
type: report
date: 2026-06-12
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: "monk-ai-images 버킷 코드 참조 전수조사 — 쓰기 경로·스키마·맥락 분석"
portfolio: PF_SECURITY
---

# monk-ai-images 버킷 코드 참조 전수조사

> **[2026-06-12 12:36 KST]** iMac/막내1 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내1_SECURITY_GCS버킷코드참조전수조사.md`
> 감사 방식: 읽기 전용 (코드 수정·버킷 변경 금지)

---

## 1. 참조 코드 전수 식별

### grep 결과: 20개 파일 (쌍아 선행 목록 15 + 추가 발견 5)

| # | 파일 | 분류 | 상태 |
|---|------|------|------|
| 1 | `monkos_AI/idphoto-kr/gcs-save.js` | 라이브 | ✅ |
| 2 | `monkos_AI/idphoto-kr/deploy.sh` | 라이브 (배포) | ✅ |
| 3 | `monkos_AI/idphoto-kr/public/result.js` | 라이브 (프론트) | ✅ **추가 발견** |
| 4 | `monkos_AI/idphoto-jp/gcs-save.js` | 라이브 | ✅ |
| 5 | `monkos_AI/idphoto-jp/server.js` | 라이브 | ✅ |
| 6 | `monkos_AI/idphoto-jp/deploy.sh` | 라이브 (배포) | ✅ |
| 7 | `monkos_AI/idphoto-jp/public/result.js` | 라이브 (프론트) | ✅ **추가 발견** |
| 8 | `monkos_AI/studio/gcs-save.js` | 라이브 | ✅ |
| 9 | `monkos_AI/studio/deploy.sh` | 라이브 (배포) | ✅ |
| 10 | `monkos_AI/studio/public/profiles/templates.js` | 라이브 (프론트) | ✅ **추가 발견** |
| 11 | `monkos_AI/portal/lib/shared/config.js` | 라이브 | ✅ |
| 12 | `monkos_AI/portal/lib/cms/upload.js` | 라이브 | ✅ **추가 발견** |
| 13 | `monkos_AI/portal/lib/cms/ai.js` | 라이브 | ✅ **추가 발견** |
| 14 | `monkos_AI/portal/lib/cms/blog.js` | 라이브 | ✅ |
| 15 | `monkos_AI/portal/deploy.sh` | 라이브 (배포) | ✅ |
| 16 | `MONK_kr/ai_lab/photolab/result.js` | CF Pages 프론트 | ✅ |
| 17 | `monkos-ops/scripts/ads_upload.sh` | 운영 스크립트 | ✅ |
| 18 | `scripts/gcs_migrate.sh` | 마이그레이션 (1회성) | 🔴 레거시 |
| 19 | `docs/archives/scripts-legacy/sync_to_gcs.sh` | 아카이브 | 🔴 레거시 |
| 20 | `monkos-ops/tech/archive/functions_cf/api/ads.js` | 아카이브 | 🔴 레거시 |
| 21 | `apps/monk_imagen4/backend/server.js` | 프로토타입 | 🟡 확인 필요 |
| 22 | `apps/monk_imagen4/backend/deploy.sh` | 프로토타입 (배포) | 🟡 확인 필요 |
| 23 | `apps/idphoto-jp-v079/deploy.sh` | 레거시 버전 | 🔴 레거시 |

---

## 2. 라이브 서비스 코드 분석

### 2-1. idphoto-kr — `gcs-save.js` + `server.js`(미참조)

| 항목 | 내용 |
|------|------|
| **읽기/쓰기** | **쓰기** (saveImages) + **읽기** (downloadFromGCS) |
| **쓰기 경로** | `service/idphoto/kr/{userId}/{timestamp}_original.jpg` + `service/idphoto/kr/{userId}/{timestamp}_generated.png` |
| **트리거** | 유저 AI 증명사진 생성 요청 (로그인 유저만) |
| **데이터 성격** | 🔴 **고객 촬영 원본** + AI 생성 결과물 |
| **SA/인증** | Cloud Run 기본 SA (ADC) → `monk-image-engine` SA (deploy.sh --service-account 미지정이면 Compute default) |
| **공개/비공개** | **Signed URL** (24시간 만료) — 개별 파일 공개 아님 |
| **메타데이터** | `userId`, `source: 'idphoto-kr'`, `createdAt` 태깅 |

### 2-2. idphoto-jp — `gcs-save.js` + `server.js`

| 항목 | 내용 |
|------|------|
| **읽기/쓰기** | **쓰기** (saveImages) + **읽기** (downloadFromGCS) |
| **쓰기 경로** | `service/idphoto/jp/{userId}/{timestamp}_original.jpg` + `service/idphoto/jp/{userId}/{timestamp}_generated.png` |
| **트리거** | 유저 AI 증명사진 생성 요청 (`/api/idgen`, 로그인 유저만) |
| **데이터 성격** | 🔴 **고객 촬영 원본** + AI 생성 결과물 |
| **SA/인증** | Cloud Run ADC |
| **공개/비공개** | **Signed URL** (24시간 만료) — server.js `/api/download` 에서 발급 |
| **메타데이터** | `userId`, `source: 'idphoto-jp'`, `createdAt` 태깅 |
| **보안 검증** | ✅ `gcsPath.startsWith('service/idphoto/jp/${userId}/')` — 타인 파일 접근 차단 |

### 2-3. studio — `gcs-save.js`

| 항목 | 내용 |
|------|------|
| **읽기/쓰기** | **쓰기** (saveImages) + **읽기** (downloadFromGCS) |
| **쓰기 경로** | ⚠️ `service/idphoto/kr/{userId}/{timestamp}_*` — **idphoto-kr과 동일 경로** (복사 오류 추정) |
| **트리거** | studio/server.js에서 import (line 17) |
| **데이터 성격** | AI 생성 프로필 이미지 |
| **SA/인증** | Cloud Run ADC |
| **공개/비공개** | Signed URL (24시간) |
| **비고** | ⚠️ 주석에 "경로: service/idphoto/kr/" 기재 — studio 전용 경로가 아닌 kr 경로로 쓰는 중. 의도 확인 필요 |

### 2-4. portal — CMS 블로그 이미지 (`cms/upload.js`, `cms/ai.js`, `cms/blog.js`)

| 항목 | 내용 |
|------|------|
| **읽기/쓰기** | **쓰기** (upload, ai생성, OG이미지) + **읽기** (목록, 삭제) |
| **쓰기 경로** | `blog/{timestamp}_{filename}` (upload.js), `blog/ai/{style}_{timestamp}.jpg` (ai.js), `blog/og_{timestamp}_{slug}.jpg` (blog.js) |
| **트리거** | 관리자 CMS 블로그 글 작성·편집 (admin 인증 필수) |
| **데이터 성격** | 블로그 이미지 자산 (공개 콘텐츠) |
| **SA/인증** | Cloud Run ADC |
| **공개/비공개** | ✅ **public: true** (ai.js uploadToGcs), public URL 직접 반환 (`https://storage.googleapis.com/monk-ai-images/blog/...`) |
| **비고** | 블로그 이미지는 CDN으로 공개 노출 필요 — 버킷 레벨 allUsers와 별도로 파일 레벨 public 설정 |

### 2-5. portal — `config.js`

| 항목 | 내용 |
|------|------|
| **읽기/쓰기** | 설정값 export만 (`GCS_BUCKET = 'monk-ai-images'`) |
| **비고** | 다른 모듈(cms/*)이 이 값을 import하여 사용 |

---

## 3. 프론트엔드 참조 분석

### 3-1. idphoto-kr/jp `public/result.js`

| 항목 | 내용 |
|------|------|
| **참조 방식** | `https://storage.googleapis.com/monk-ai-images/ads/manifest.json` (public URL 직접) |
| **읽기/쓰기** | **읽기만** (fetch로 manifest 로드) |
| **트리거** | 생성 대기 화면에서 광고 이미지 로테이션 표시 |
| **데이터 성격** | 광고 이미지 manifest (JSON) |
| **공개 필요** | ✅ — 클라이언트 브라우저에서 직접 접근 |

### 3-2. MONK_kr `ai_lab/photolab/result.js`

| 항목 | 내용 |
|------|------|
| **참조 방식** | `https://storage.googleapis.com/monk-ai-images/ads/manifest.json` (public URL 직접) |
| **읽기/쓰기** | **읽기만** |
| **트리거** | CF Pages photolab 생성 대기 화면 |
| **데이터 성격** | 광고 이미지 manifest |
| **서빙 상태** | monk.kr CF Pages에서 라이브 서빙 중 |

### 3-3. studio `public/profiles/templates.js`

| 항목 | 내용 |
|------|------|
| **참조 방식** | `https://storage.googleapis.com/monk-ai-images/profiles/{category}/{id}.jpg` (public URL 직접) |
| **읽기/쓰기** | **읽기만** (썸네일 이미지 URL 구성) |
| **트리거** | studio UI에서 프리셋 선택 시 썸네일 표시 |
| **데이터 성격** | 정적 자산 (프리셋 썸네일 — fashion/hair/makeup/background) |
| **공개 필요** | ✅ — 클라이언트 브라우저에서 직접 접근 |

---

## 4. 운영 스크립트 분석

### 4-1. `monkos-ops/scripts/ads_upload.sh`

| 항목 | 내용 |
|------|------|
| **읽기/쓰기** | **쓰기** (gcloud storage cp) + **삭제** (FIFO 최대 6장) |
| **쓰기 경로** | `ads/{timestamp}_{name}.{ext}` + `ads/manifest.json` |
| **트리거** | launchd WatchPaths — `~/MONKOS_ADS/` 폴더에 이미지 드롭 시 자동 |
| **데이터 성격** | 광고 이미지 (CDN 공개) |
| **SA/인증** | gcloud CLI (gdsajin@gmail.com ADC) |
| **공개/비공개** | ✅ **`--add-acl-grant=entity=allUsers,role=READER`** 개별 파일 공개 설정 |
| **비고** | manifest.json에 `Cache-Control: public, max-age=60` 설정 |

---

## 5. 레거시/데드 코드 판별

| # | 파일 | 판정 | 근거 |
|---|------|------|------|
| 18 | `scripts/gcs_migrate.sh` | 🔴 **데드** | 1회성 마이그레이션 스크립트 (2026-01-15). monk-ai-images→monk-project 이관용. 완료 후 재실행 불필요 |
| 19 | `docs/archives/scripts-legacy/sync_to_gcs.sh` | 🔴 **데드** | archives 폴더. 구 프로젝트 ID(`gen-lang-client-0105707468`) 하드코딩. 로컬 경로(`_saga/`) 현재 미존재 |
| 20 | `monkos-ops/tech/archive/functions_cf/api/ads.js` | 🔴 **데드** | archive 폴더. CF Pages Functions에서 GCS manifest 프록시. **현재 클라이언트가 GCS 직접 접근으로 대체됨** (result.js의 fetch 직접) |
| 21 | `apps/monk_imagen4/backend/server.js` | 🟡 **프로토타입 잔존** | monk-image-engine Cloud Run 서비스의 전신. `generated/{timestamp}_{i}.jpg` 경로로 public URL 직접 반환. **현 monk-image-engine은 이 코드가 아닌 별도 코드로 구동 중 추정** — 확인 필요 |
| 22 | `apps/monk_imagen4/backend/deploy.sh` | 🟡 **프로토타입 잔존** | 21번과 동일 |
| 23 | `apps/idphoto-jp-v079/deploy.sh` | 🔴 **데드** | idphoto-jp v0.79 레거시 버전. 현행은 `monkos_AI/idphoto-jp/` |

---

## 6. 경로 스키마 맵

```
gs://monk-ai-images/                        [3.55 GiB, allUsers:objectViewer]
│
├── ads/                                    ← 쓰기: ads_upload.sh (launchd 자동)
│   ├── {timestamp}_{name}.{ext}            ← 광고 이미지 (FIFO 최대 6장)
│   └── manifest.json                       ← 광고 로테이션 설정 (auto-generated)
│   └── 읽기: result.js (kr/jp/photolab) — public URL 직접 fetch
│   🟢 PUBLIC 필요 (클라이언트 브라우저 직접 접근)
│
├── blog/                                   ← 쓰기: portal cms/upload.js, cms/ai.js, cms/blog.js
│   ├── {timestamp}_{filename}              ← CMS 업로드 이미지 (관리자만)
│   ├── ai/{style}_{timestamp}.jpg          ← AI 생성 블로그 이미지
│   └── og_{timestamp}_{slug}.jpg           ← OG 이미지 자동 생성
│   └── 읽기: 블로그 페이지에서 public URL
│   🟢 PUBLIC 필요 (블로그 이미지 CDN)
│
├── profiles/                               ← 쓰기: 수동 업로드 (에셋 준비)
│   ├── fashion/{id}.jpg                    ← 의상 프리셋 썸네일
│   ├── hair/{id}.jpg                       ← 헤어 프리셋 썸네일
│   ├── makeup/{id}.jpg                     ← 메이크업 프리셋 썸네일
│   └── background/{id}.jpg                 ← 배경 프리셋 썸네일
│   └── 읽기: studio templates.js — public URL 직접
│   🟢 PUBLIC 필요 (클라이언트 브라우저 직접 접근)
│
├── assets/                                 ← 쓰기: 수동 업로드 추정
│   └── (정적 에셋)
│   🟡 확인 필요 (코드 참조 없음 — 수동 관리?)
│
├── generated/                              ← 쓰기: apps/monk_imagen4 (프로토타입)
│   └── {timestamp}_{i}.jpg                 ← AI 생성 이미지 (public URL 직접 반환)
│   🟡 프로토타입 잔존물. 현재 라이브에서 쓰는 코드 없음 추정
│
├── raw_data/                               ← 쓰기: gcs_migrate.sh (1회성 마이그레이션)
│   └── kbeauty_sources/                    ← 크롤링 데이터 (네이버 이미지)
│   🔴 PRIVATE 전환 가능 — 라이브 읽기 경로 없음
│
├── service/                                ← 쓰기: idphoto-kr/jp + studio gcs-save.js
│   └── idphoto/
│       ├── kr/{userId}/{timestamp}_*.{ext} ← 고객 촬영원본+AI생성 (kr + studio 공용)
│       └── jp/{userId}/{timestamp}_*.{ext} ← 고객 촬영원본+AI생성 (jp)
│   🔴 PRIVATE 전환 가능 — Signed URL로만 접근
│
└── (기타 루트 파일)
    🟡 확인 필요
```

---

## 7. 쓰기 경로 전수 요약

| 서비스 | 쓰기 경로 패턴 | 트리거 | 데이터 성격 | 공개 필요 |
|--------|--------------|--------|------------|----------|
| idphoto-kr | `service/idphoto/kr/{userId}/{ts}_original.jpg` + `_generated.png` | 유저 생성 요청 | 🔴 고객 촬영물 | ❌ (Signed URL) |
| idphoto-jp | `service/idphoto/jp/{userId}/{ts}_original.jpg` + `_generated.png` | 유저 생성 요청 | 🔴 고객 촬영물 | ❌ (Signed URL) |
| studio | `service/idphoto/kr/{userId}/{ts}_*` ⚠️ | 유저 생성 요청 | AI 생성물 | ❌ (Signed URL) |
| portal CMS | `blog/{ts}_{filename}` | 관리자 업로드 | 블로그 이미지 | ✅ (public URL) |
| portal CMS AI | `blog/ai/{style}_{ts}.jpg` | 관리자 AI 생성 | 블로그 이미지 | ✅ (public: true) |
| portal CMS OG | `blog/og_{ts}_{slug}.jpg` | 자동 (글 발행 시) | OG 이미지 | ✅ (public: true) |
| ads_upload.sh | `ads/{ts}_{name}.{ext}` + `manifest.json` | launchd 자동 | 광고 이미지 | ✅ (ACL allUsers) |
| monk_imagen4 | `generated/{ts}_{i}.jpg` | 프로토타입 | AI 생성물 | ✅ (public URL) 🟡 비활성 추정 |

---

## 8. 버킷 분리 설계 기초자료

### 8-1. Public 유지 필요 경로 (CDN 외부 노출)

| 경로 | 이유 | 참조 코드 수 |
|------|------|-------------|
| `ads/*` | 클라이언트 브라우저 직접 fetch (result.js ×3 파일) | 4 (upload.sh + result.js ×3) |
| `blog/*` | 블로그 페이지 이미지 (public URL 직접) | 3 (upload.js, ai.js, blog.js) |
| `profiles/*` | studio 프리셋 썸네일 (클라이언트 직접) | 1 (templates.js) |

### 8-2. Private 전환 가능 경로 (서명 URL로 충분)

| 경로 | 이유 | 영향 서비스 |
|------|------|-----------|
| `service/idphoto/kr/*` | 고객 촬영물 — 이미 Signed URL 사용 중 | idphoto-kr, studio |
| `service/idphoto/jp/*` | 고객 촬영물 — 이미 Signed URL 사용 중 | idphoto-jp |
| `raw_data/*` | 크롤링 데이터 — 라이브 읽기 없음 | 없음 |
| `generated/*` | 프로토타입 잔존물 | monk_imagen4 (비활성 추정) |

### 8-3. 분리 시 영향도 판정

**옵션 A: 버킷 분리 (public + private)**
- `monk-ai-images-public`: ads/ + blog/ + profiles/ + assets/
- `monk-ai-images-private`: service/ + raw_data/ + generated/
- **영향**: deploy.sh 4개 + gcs-save.js 3개 + config.js 1개의 `GCS_BUCKET` 환경변수 분기 필요
- **복잡도**: 높음 — 서비스별 버킷 환경변수 분기 + Signed URL 로직 유지

**옵션 B: 현 버킷 유지 + allUsers 제거 + 파일 레벨 ACL**
- allUsers:objectViewer 제거 (버킷 레벨 공개 해제)
- ads_upload.sh는 이미 파일별 ACL 설정 중 (`--add-acl-grant=entity=allUsers,role=READER`)
- portal CMS는 이미 `public: true` 파일 레벨 설정 중
- **영향**: 최소 — `profiles/*` 에셋만 파일 레벨 공개 추가 설정 필요
- **복잡도**: 낮음 — 코드 변경 최소

**권고: 옵션 B 우선** — service/raw_data의 비공개 전환이 즉시 가능하며 코드 변경이 거의 없음

### 8-4. 잔여 리스크

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| studio gcs-save.js가 idphoto-kr 경로에 쓰는 중 | ⚠️ MED | 별도 경로(`service/studio/`) 분리 검토 |
| `generated/*`에 프로토타입 데이터 잔존 (public URL) | ⚠️ LOW | monk_imagen4 라이브 여부 확인 후 정리 |
| `assets/*` 코드 참조 없음 — 수동 관리 상태 | ℹ️ INFO | 내용 확인 후 분류 |

---

## 9. 감사 방법 / 한계

**사용 도구**: `grep -r`, `find`, `Read` (코드 정독)
**범위**: monk_project 리포 전체 + 홈 디렉토리 4depth
**한계**:
- Cloud Run 실행 환경의 실제 SA 바인딩은 `gcloud run services describe`로 확인 필요 (막내3 담당)
- `assets/*` 폴더 실제 내용물은 `gsutil ls` 필요 (막내2 보고서 참조)
- studio/server.js의 gcs-save.js import 확인했으나 전체 흐름(어떤 API에서 saveImages 호출)은 server.js 전문 미정독

**헌법 준수:**
- 4조 1항 — 키·시크릿 값 조회/생성/추측 없음 ✅
- 4조 2항 — 코드 수정·버킷 변경 없음 (모두 읽기만) ✅

---

**감사 완료**
**[2026-06-12 12:36 KST] iMac/막내1**
