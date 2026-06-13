---
type: report
date: 2026-06-12
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: "monk-ai-images 3권심사 입법 — 공개/비공개 기준 + 교정 워크플로우 설계"
portfolio: PF_SECURITY
---

# monk-ai-images 3권심사: 입법 (설계·기준)

> **[2026-06-12 13:06 KST]** iMac/막내1 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내1_SECURITY_GCS삼권심사_입법.md`
> 선행 참조: 본인 코드 참조 전수조사 + 막내2 버킷 전수 + GCS_BUCKET_STRUCTURE.md
> 독립 판단 기준. 막내2·3과 교차 대조 대기.

---

## 전제 사실 — ACL 모드 실측

| 버킷 | UBLA (Uniform) | ACL 모드 | 의미 |
|------|---------------|---------|------|
| **monk-ai-images** | **False** | **Fine-Grained** | ✅ 파일 레벨 ACL 사용 가능 |
| **monk-factory-storage** | **True** (Locked 2026-03-30) | Uniform | IAM만으로 제어. 파일 ACL 불가 |

이 실측이 전체 설계의 핵심 전제. monk-ai-images는 Fine-Grained이므로 "버킷 레벨 allUsers 제거 + 필요 파일만 개별 공개" 전략이 **기술적으로 유효**.

---

## Task 1 — 경로별 공개/비공개 기준 설계

### 판정 기준 정의

| 판정 | 정의 | 기술적 수단 | 적용 조건 |
|------|------|-----------|----------|
| **PUBLIC** | 인증 없이 URL 직접 접근 필요 | 파일 레벨 ACL `allUsers:READER` | 클라이언트 브라우저에서 직접 fetch하는 경로 |
| **PRIVATE** | 인증된 요청만 허용 | Signed URL 또는 SA 직접 접근 | 서버 사이드에서만 접근하거나, 유저별 인증 후 Signed URL 발급하는 경로 |
| **DELETE** | 더 이상 불필요 | 백업 후 삭제 | 코드 참조 0건 + 라이브 사용 증거 없음 |
| **MIGRATE** | 다른 위치로 이관 | GDrive 또는 별도 버킷 | 보존 가치 있으나 현 버킷에 있을 이유 없음 |

### 경로별 판정

```
gs://monk-ai-images/
│
├── ads/                        → PUBLIC ✅
│   ├── {timestamp}_{name}.ext     PUBLIC — ads_upload.sh가 이미 파일별 allUsers:READER 설정
│   └── manifest.json              PUBLIC — ads_upload.sh가 이미 파일별 allUsers:READER 설정
│   근거: 클라이언트 result.js ×3 파일이 public URL 직접 fetch
│   allUsers 제거 영향: ❌ 없음 (파일 레벨 ACL 이미 존재)
│
├── assets/                     → PUBLIC ✅
│   근거: 포털 슬라이드 자산 (58KB, 10건). 클라이언트 직접 접근 추정
│   allUsers 제거 영향: ⚠️ 확인 필요 (파일 레벨 ACL 존재 여부 미확인)
│   조치: 파일별 ACL 보정 필요할 수 있음
│
├── blog/                       → PUBLIC ✅
│   ├── {ts}_{filename}            PUBLIC — portal upload.js는 파일 레벨 공개 미설정이나 버킷 레벨 의존
│   ├── ai/{style}_{ts}.jpg       PUBLIC — portal ai.js가 `public: true`로 저장
│   └── og_{ts}_{slug}.jpg        PUBLIC — portal blog.js가 `public: true`로 저장
│   근거: 블로그 이미지 CDN — 외부 노출 필수
│   allUsers 제거 영향: ⚠️ upload.js 경유 파일만 영향 (ai.js/blog.js는 파일 레벨 public 설정 중)
│   조치: upload.js에 `public: true` 추가 또는 기존 파일 일괄 ACL 보정
│
├── profiles/                   → PUBLIC ✅
│   ├── fashion/*.jpg              
│   ├── hair/*.jpg                 
│   ├── makeup/*.jpg               
│   └── background/*.jpg           
│   근거: studio templates.js가 public URL 직접 참조
│   allUsers 제거 영향: ⚠️ 파일 레벨 ACL 없으면 장애 발생
│   조치: 파일별 ACL 일괄 보정 필요 (10건 — 거의 빈 폴더 실측)
│
├── generated/                  → PRIVATE 🔒 (+ 검토 후 DELETE 가능)
│   근거: apps/monk_imagen4 프로토타입 잔존물 (187MB, 164건)
│   현재 라이브 코드 참조: 0건 (비활성 추정)
│   allUsers 제거 영향: ❌ 없음 (공개 URL 참조하는 라이브 코드 없음)
│   후속: monk_imagen4 서비스 라이브 여부 확인 후 DELETE 가능
│
├── raw_data/                   → MIGRATE 📦
│   ├── kbeauty_sources/           MIGRATE — 크롤링 이미지 2.93GB. GCS 비공개 유지 가능하나 버킷 분리가 더 깔끔
│   ├── bwya_academy/              MIGRATE — 아카데미 자료 227MB. GDrive 이관 권고
│   └── kbeauty_sources_metadata/  MIGRATE — 메타데이터 5MB
│   근거: 라이브 읽기 코드 0건. gcs_migrate.sh(1회성)·sync_to_gcs.sh(레거시) 외 참조 없음
│   allUsers 제거 영향: ❌ 없음
│   후속: GDrive로 이관하거나 monk-project 버킷으로 이동 (비공개)
│
└── service/                    → PRIVATE 🔒
    └── idphoto/
        ├── kr/{userId}/{ts}_*     PRIVATE — gcs-save.js가 Signed URL로만 접근
        └── jp/{userId}/{ts}_*     PRIVATE — server.js가 Signed URL로만 접근
    근거: 🔴 고객 촬영물 + AI 생성물 (770MB, 990건). 코드에서 이미 Signed URL 사용
    allUsers 제거 영향: ❌ 없음 (Signed URL은 버킷 ACL 무관)
    보안 검증: idphoto-jp server.js에 userId 경로 검증 존재 ✅
```

### 판정 요약

| 판정 | 경로 | 크기 | 파일 수 | 비고 |
|------|------|------|--------|------|
| **PUBLIC** | ads/, blog/, profiles/, assets/ | ~69 MB | ~792 | CDN 필수 |
| **PRIVATE** | service/idphoto/, generated/ | ~957 MB | ~1,154 | Signed URL 이미 사용 중 |
| **MIGRATE** | raw_data/ | ~3.17 GB | ~15,904 | GDrive 또는 별도 버킷 |

---

## Task 2 — allUsers 제거 영향 맵

### 현재 상태

버킷 레벨: `allUsers → roles/storage.objectViewer` (전 오브젝트 공개)
ACL 모드: Fine-Grained (파일 레벨 ACL 병행 가능)

### 서비스별 영향 분석

| 서비스 | 참조 경로 | 현재 접근 방식 | 파일 ACL 현재 | allUsers 제거 후 | 코드 변경 |
|--------|----------|--------------|-------------|----------------|----------|
| **idphoto-kr** result.js | `ads/manifest.json` | public URL fetch | ✅ 있음 (ads_upload.sh) | ✅ 정상 | 불필요 |
| **idphoto-jp** result.js | `ads/manifest.json` | public URL fetch | ✅ 있음 | ✅ 정상 | 불필요 |
| **MONK_kr** photolab result.js | `ads/manifest.json` | public URL fetch | ✅ 있음 | ✅ 정상 | 불필요 |
| **studio** templates.js | `profiles/{cat}/{id}.jpg` | public URL 직접 | ❓ 미확인 | 🚨 **장애 가능** | ACL 보정 필요 |
| **portal** cms/ai.js | `blog/ai/*` | public URL (public:true 저장) | ✅ 있음 | ✅ 정상 | 불필요 |
| **portal** cms/blog.js | `blog/og_*` | public URL (public:true 저장) | ✅ 있음 | ✅ 정상 | 불필요 |
| **portal** cms/upload.js | `blog/{ts}_*` | public URL (**public 미설정**) | ❌ 없음 | 🚨 **기존 이미지 비공개 전환** | `public:true` 추가 필요 |
| **idphoto-kr** gcs-save.js | `service/idphoto/kr/*` | Signed URL | N/A | ✅ 정상 | 불필요 |
| **idphoto-jp** gcs-save.js | `service/idphoto/jp/*` | Signed URL | N/A | ✅ 정상 | 불필요 |
| **studio** gcs-save.js | `service/idphoto/kr/*` | Signed URL | N/A | ✅ 정상 | 불필요 |
| **assets/** (브라우저) | `assets/*` | public URL 추정 | ❓ 미확인 | 🟡 **장애 가능** | ACL 보정 필요할 수 있음 |

### 장애 발생 지점 (allUsers 제거 시)

| # | 지점 | 영향 | 해결 | 난이도 |
|---|------|------|------|--------|
| **G1** | `profiles/*` 파일 접근 불가 | studio 프리셋 썸네일 안 보임 | 기존 파일 ACL 일괄 보정 (`gsutil acl ch -u allUsers:R gs://monk-ai-images/profiles/**`) | 낮음 (10건) |
| **G2** | `blog/{ts}_*` (upload.js 경유) 접근 불가 | 기존 블로그 이미지 깨짐 | 기존 파일 ACL 일괄 보정 + upload.js에 `public: true` 추가 | 중간 (~750건) |
| **G3** | `assets/*` 파일 접근 불가 | 포털 슬라이드 안 보임 | 기존 파일 ACL 일괄 보정 | 낮음 (10건) |

### 영향 없는 지점 (확인 완료)

- ads/* — 이미 파일 레벨 ACL 존재
- blog/ai/*, blog/og_* — 이미 `public: true`로 저장
- service/idphoto/* — Signed URL 사용
- raw_data/* — 라이브 접근 없음
- generated/* — 라이브 접근 없음

---

## Task 3 — 교정 워크플로우 설계

### 전체 흐름

```
Phase 0 (사전)       : monk-factory-storage allUsers 즉시 제거 (별도 버킷, 영향 0)
Phase 1 (사전 보정)   : G1·G2·G3 해소 — 파일 레벨 ACL 보정 + 코드 수정
Phase 2 (allUsers 제거): 버킷 레벨 allUsers 제거
Phase 3 (검증)       : 전 서비스 정상 확인
Phase 4 (후속 이관)   : raw_data/ 이관 + generated/ 정리
```

### Step 0 — monk-factory-storage P0 즉시 조치

```bash
# 실행 (작가님 승인 필요)
gsutil iam ch -d allUsers:objectViewer gs://monk-factory-storage
```
- **검증**: `curl -s -o /dev/null -w "%{http_code}" https://storage.googleapis.com/monk-factory-storage/monk_models/monk_muse.html` → 403 확인
- **롤백**: `gsutil iam ch -u allUsers:objectViewer gs://monk-factory-storage`
- **영향**: 코드 참조 0건, Cloud Run 참조 0건 → **무영향**
- **비고**: UBLA=True(Locked)이므로 IAM 제거만으로 완전 비공개 전환

### Step 1 — 기존 파일 ACL 일괄 보정 (G1·G3)

```bash
# profiles/ — 기존 파일 공개 설정 (10건)
gsutil -m acl ch -r -u allUsers:R gs://monk-ai-images/profiles/

# assets/ — 기존 파일 공개 설정 (10건)
gsutil -m acl ch -r -u allUsers:R gs://monk-ai-images/assets/
```
- **검증**: `curl -s -o /dev/null -w "%{http_code}" https://storage.googleapis.com/monk-ai-images/profiles/fashion/suit-navy-m.jpg` → 200 확인
- **롤백**: `gsutil -m acl ch -r -d allUsers gs://monk-ai-images/profiles/` (ACL 제거)
- **주의**: Fine-Grained ACL 모드에서만 작동 (실측 확인 완료)

### Step 2 — blog/ 기존 이미지 ACL 보정 + 코드 수정 (G2)

```bash
# blog/ 전체 — 기존 파일 공개 설정 (~759건)
gsutil -m acl ch -r -u allUsers:R gs://monk-ai-images/blog/
```

**코드 수정** (portal cms/upload.js):
```javascript
// 현재: public 미설정
await file.save(imageData, { metadata: { contentType: 'image/jpeg' } });

// 수정: public: true 추가
await file.save(imageData, { metadata: { contentType: 'image/jpeg' }, public: true });
```
- **검증**: CMS에서 이미지 업로드 → public URL 직접 접근 확인
- **롤백**: 코드 git revert + `gsutil -m acl ch -r -d allUsers gs://monk-ai-images/blog/`

### Step 3 — allUsers 버킷 레벨 제거

```bash
# 실행 (작가님 승인 필요)
gsutil iam ch -d allUsers:objectViewer gs://monk-ai-images
```
- **사전 조건**: Step 1·2 완료 + 검증 통과
- **검증 매트릭스**:

| 테스트 | URL | 기대 | 확인 방법 |
|--------|-----|------|----------|
| ads manifest | `https://storage.googleapis.com/monk-ai-images/ads/manifest.json` | 200 | curl |
| blog AI 이미지 | 최근 ai/blog 파일 URL | 200 | curl |
| blog upload 이미지 | 최근 upload 파일 URL | 200 | curl |
| profiles 썸네일 | `profiles/fashion/suit-navy-m.jpg` | 200 | curl |
| assets 슬라이드 | assets 내 파일 URL | 200 | curl |
| service 고객 데이터 | `service/idphoto/kr/` 내 파일 URL | **403** | curl (비공개 확인) |
| raw_data 원본 | `raw_data/kbeauty_sources/` 내 파일 URL | **403** | curl (비공개 확인) |
| generated 프로토타입 | `generated/` 내 파일 URL | **403** | curl (비공개 확인) |

- **서비스 E2E 검증**:
  - monkos.ai 포털 → 블로그 페이지 이미지 표시 확인
  - idphoto-kr.monkos.ai → 생성 대기 화면 광고 로테이션 확인
  - idphoto-jp.monkos.ai → 동일 확인
  - monkos-studio → 프리셋 썸네일 표시 확인

- **롤백**: `gsutil iam ch -u allUsers:objectViewer gs://monk-ai-images`
  - 즉시 원복 가능 (1 명령)

### Step 4 — 후속 이관 (Phase 4, 별도 일정)

1. `raw_data/bwya_academy/` → GDrive 이관 (227MB)
2. `raw_data/kbeauty_sources/` → monk-project 버킷 또는 GDrive (2.93GB)
3. `generated/` → monk_imagen4 라이브 확인 후 DELETE 또는 MIGRATE
4. 이관 완료 후 해당 경로 삭제

---

## 부록 — monk-factory-storage vs monk-ai-images 교정 차이

| 항목 | monk-factory-storage | monk-ai-images |
|------|---------------------|---------------|
| UBLA | True (Locked) | False |
| ACL 모드 | Uniform (IAM only) | Fine-Grained |
| 공개 바인딩 | `allUsers:composer.envAndStorageObjViewer` | `allUsers:objectViewer` |
| 코드 참조 | 0건 | 20건 |
| 라이브 서비스 | 없음 | 5개 서비스 |
| 교정 복잡도 | **극히 낮음** (IAM 1줄 제거) | **중간** (ACL 보정 + 코드 1건 수정 + 검증) |
| 교정 리스크 | 0 | 낮음 (롤백 1명령) |

---

## 독립 의견 — 막내2 "버킷 분리" 권고에 대한 입법 관점

막내2는 "2-버킷 분리 (public + private)" 를 권고했다. 입법 관점에서 양자를 비교:

| 기준 | 옵션 A: 버킷 분리 | 옵션 B: allUsers 제거 + 파일 ACL |
|------|-----------------|-------------------------------|
| 보안 효과 | 동일 (비공개 데이터 격리) | 동일 |
| 코드 변경량 | 높음 (deploy.sh 4개 + gcs-save.js 3개 + config.js + 환경변수 분기) | **낮음** (upload.js 1줄 수정) |
| 운영 복잡도 | 높음 (버킷 2개 관리, 이관 작업) | **낮음** (현 구조 유지) |
| 롤백 용이성 | 낮음 (데이터 이관 역이관 필요) | **높음** (IAM 1명령) |
| 실행 시간 | 수 시간 (데이터 4GB 이관) | **수 분** |
| 장기 구조 | 깔끔 (관심사 분리) | 혼재 유지 (raw_data는 별도 이관 필요) |

**입법 판정**: **옵션 B를 Phase 1 즉시 조치로 채택하고, 옵션 A를 Phase 2 장기 과제로 유지**하는 것을 권고한다.

이유: 고객 데이터(service/idphoto/) 770MB가 현재 allUsers로 공개 노출되고 있다. 버킷 분리를 기다리는 동안 하루라도 더 노출되는 것보다, 수 분 내 allUsers 제거로 즉시 비공개 전환하는 것이 **리스크 대비 효과가 압도적**. raw_data/ 이관은 별도 일정으로 분리 가능.

---

**감사 완료**
**[2026-06-12 13:06 KST] iMac/막내1**
