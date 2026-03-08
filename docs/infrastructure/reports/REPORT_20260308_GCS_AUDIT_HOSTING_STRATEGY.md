---
type: REPORT
date: 2026-03-08
from: iMac/막내1
to: iMac/쌍아
subject: GCS 현황 감사 + 이미지 호스팅 전략 방안
---

# GCS 현황 감사 + 이미지 호스팅 전략 방안

> **[2026-03-08 12:00 KST] iMac/막내1 → iMac/쌍아**

---

## Phase A: GCS 버킷 전수 감사

### 전체 버킷 목록 (monkos 프로젝트)

| # | 버킷 | 리전 | 용량 | 상태 |
|---|-------|------|------|------|
| 1 | `gs://monk-project/` | asia-northeast3 (서울) | 3.36 GB | **활성** |
| 2 | `gs://monk-ai-images/` | us-central1 (미국) | 3.38 GB | **활성** |
| 3 | `gs://monk-project-soul/` | - | - | **404 (삭제됨)** |
| 4 | `gs://monk_session_data/` | - | - | **404 (삭제됨)** |
| 5 | `gs://monkos_cloudbuild/` | - | 34 MB | 시스템 자동 |
| 6 | `gs://run-sources-monkos-*` (3개) | 각 리전 | 105 MB 합계 | 시스템 자동 |
| 7 | `gs://933456016842_*_import_content` (2개) | - | 0 B | 시스템 자동 (비어있음) |

---

### 1. `gs://monk-project/` — 주 버킷

| 항목 | 값 |
|------|-----|
| 리전 | asia-northeast3 (서울) |
| 스토리지 클래스 | Standard |
| 총 용량 | 3.36 GB |
| 공개 접근 | ❌ (projectOwner/projectEditor만) |

#### 경로별 상세

| 경로 | 용량 | 최종 쓰기 | 실사용 | 비고 |
|------|------|----------|--------|------|
| `assets/soso/sources/` | 2.93 GB | 미확인 (Jan 이전) | △ | K-beauty 크롤링 데이터. **monk-ai-images/raw_data/kbeauty_sources와 중복** |
| `live/live/` | 409 MB | 2026-01-17 | ✗ | monk_imagen4 node_modules 스냅샷. **완전 사장** |
| `corpus/sessions/` | 21 MB | 2026-01-18 | △ | 세션 로그 50개. Vertex AI RAG 소스 (doc에 명시되나 최근 갱신 없음) |

#### 코드 참조 현황

- **프로덕션 코드 참조: 0건** — `storage.googleapis.com/monk-project/` 패턴 없음
- 문서 참조만 존재 (GCS_BUCKET_STRUCTURE.md, VERTEX_AI_CONNECTION_GUIDE.md 등)

#### 분류

| 경로 | 분류 | 근거 |
|------|------|------|
| `assets/soso/sources/` | **통합 대상** | monk-ai-images/raw_data/와 중복. 한쪽 정리 필요 |
| `live/live/` | **폐지 대상** | node_modules 스냅샷. 2개월 방치. 사용처 없음 |
| `corpus/sessions/` | **미결정** | Vertex AI RAG 소스로 설계되었으나 최근 갱신 없음. RAG 활용 계획에 따라 결정 |

---

### 2. `gs://monk-ai-images/` — AI 이미지 버킷

| 항목 | 값 |
|------|-----|
| 리전 | **us-central1 (미국)** ⚠️ |
| 스토리지 클래스 | Standard |
| 총 용량 | 3.38 GB |
| 공개 접근 | **⚠️ allUsers:objectViewer (버킷 전체 공개)** |

#### 경로별 상세

| 경로 | 용량 | 최종 쓰기 | 실사용 | 비고 |
|------|------|----------|--------|------|
| `raw_data/kbeauty_sources/` | 2.93 GB | 2026-01 추정 | △ | 4개 하위 폴더 (hair/lingerie/makeup/model). monk-project/assets/soso/와 중복 |
| `raw_data/bwya_academy/` | 227 MB | 미확인 | △ | BWYA 아카데미 원본. 코드 참조 없음 |
| `raw_data/kbeauty_sources_metadata/` | 5 MB | 미확인 | △ | 메타데이터. 코드 참조 없음 |
| `generated/` | 187 MB | **2026-02-28** | ○ | AI 생성 이미지 164장. monk-image-engine이 쓰기 |
| `ads/` | 14 MB | **2026-03-06** | **◎** | 광고 이미지 6종 + manifest.json. **프로덕션 직접 참조** |

#### 코드 참조 현황 — **프로덕션 활성**

| 참조 파일 | 참조 경로 | 용도 |
|-----------|----------|------|
| `monkos_AI/idphoto-kr/public/index.html` | `storage.googleapis.com/monk-ai-images/ads/*.jpg` | 갤러리 이미지 (6건) |
| `monkos_AI/idphoto-kr/public/result.js` | `storage.googleapis.com/monk-ai-images/ads/manifest.json` | 광고 매니페스트 로딩 |
| `MONK_kr/ai_lab/photolab/index.html` | `storage.googleapis.com/monk-ai-images/ads/*.jpg` | 갤러리 이미지 (5건) |
| `MONK_kr/ai_lab/photolab/result.js` | `storage.googleapis.com/monk-ai-images/ads/manifest.json` | 광고 매니페스트 로딩 |
| `monkos-ops/tech/archive/functions_cf/api/ads.js` | `storage.googleapis.com/monk-ai-images/ads/manifest.json` | CF Worker API |

#### ⚠️ 보안 이슈

**버킷 전체가 `allUsers:objectViewer` (공개)로 설정되어 있다.**
- 의도: `ads/` 폴더만 공개 필요
- 실제: `raw_data/`, `generated/` 포함 **3.38 GB 전체**가 공개 상태
- **raw_data/kbeauty_sources/** (크롤링 원본 2.93 GB)와 **generated/** (AI 생성물 187 MB)가 누구나 열람 가능

#### ⚠️ 리전 이슈

- 버킷: us-central1 (미국 아이오와)
- 타겟 사용자: 한국
- **TTFB 페널티**: 약 150-200ms 추가 지연 (서울 ↔ 아이오와 왕복)

#### 분류

| 경로 | 분류 | 근거 |
|------|------|------|
| `ads/` | **필수 유지** | 프로덕션 4개 파일에서 직접 참조. manifest 기반 동적 로테이션 |
| `generated/` | **필수 유지** | monk-image-engine이 AI 생성물 저장. 최근 활성 (2/28) |
| `raw_data/kbeauty_sources/` | **통합 대상** | monk-project/assets/soso/와 중복. 한쪽으로 통합 필요 |
| `raw_data/bwya_academy/` | **미결정** | 코드 참조 없음. 향후 Academy 계획에 따라 결정 |
| `raw_data/kbeauty_sources_metadata/` | **통합 대상** | kbeauty_sources 이관 시 함께 이동 |

---

### 3. `gs://monk-project-soul/` — **삭제 확인됨 (404)**

- `gcloud storage du` 시 **404 Not Found**
- 2026-01-17 세션에서 "922MB 해제" 기록 → 이미 삭제 완료
- 문서 잔여 참조: DUAL_AI_DEPLOYMENT_STRATEGY.md, VERTEX_VM_SETUP_GUIDE.md, legacy docs 등
- **조치**: 문서 내 참조를 monk-project/corpus/sessions/로 갱신 필요 (단, corpus에 이관된 데이터도 21MB에 불과하여 전량 이관되었는지 확인 필요)

---

### 4. `gs://monk_session_data/` — **삭제 확인됨 (404)**

- `gcloud storage du` 시 **404 Not Found**
- 2026-01-17 세션에서 "15MB 해제" 기록 → 이미 삭제 완료
- **조치**: 문서 참조 갱신 (monk-project/corpus/gemini/로)

---

### 5. 시스템 관리 버킷 (참고)

| 버킷 | 용량 | 용도 | 조치 |
|------|------|------|------|
| `monkos_cloudbuild/` | 34 MB | Cloud Build 아티팩트 | 유지 (자동 관리) |
| `run-sources-monkos-us-central1/` | 102 MB | Cloud Run 소스 번들 | 유지 (자동 관리) |
| `run-sources-monkos-asia-northeast3/` | 1.5 MB | Cloud Run 소스 번들 | 유지 (자동 관리) |
| `run-sources-monkos-asia-northeast1/` | 0.9 MB | Cloud Run 소스 번들 | 유지 (자동 관리) |
| `933456016842_*_import_content` (2개) | 0 B | Vertex AI import (빈 버킷) | 폐지 후보 |

---

### 현행 이미지 에셋 소스 맵 (요약)

현재 **3가지 소스**가 혼재:

| 소스 | 사용처 | 에셋 수 | 특성 |
|------|--------|---------|------|
| **GCS** (`monk-ai-images/ads/`) | idphoto-kr, MONK_kr photolab, CF Worker | 6 이미지 + manifest | 동적 로테이션, 공개 URL |
| **로컬** (`images/` 폴더) | MONK_kr 전 페이지, idphoto-kr hero | ~60파일 | Git 추적, CF Pages CDN 자동 |
| **Unsplash** (외부 CDN) | MONK_kr index/ai_lab/monk_studio, portal | ~20건 | 일부는 onerror 폴백, 일부는 주 소스 |

---

### 비용 현황 추정 (월간)

| 항목 | 용량 | 스토리지 비용 | egress 추정 | 합계 |
|------|------|-------------|-------------|------|
| monk-project (3.36 GB) | $0.08 | ~$0 (코드 참조 없음) | **$0.08** |
| monk-ai-images (3.38 GB) | $0.08 | ~$0.05 (ads 이미지 서빙) | **$0.13** |
| 시스템 버킷 (139 MB) | $0.003 | $0 | **$0.003** |
| **합계** | | | | **~$0.21/월** |

> GCS 스토리지 비용 자체는 미미. 주요 관심사는 **구조 정리, 보안, 성능**.

---

## Phase B: 호스팅 전략 방안 비교

### 방안 1: GCS 유지 + Cloud CDN 적용

- 현행 GCS 직접 서빙에 Cloud CDN 레이어 추가
- 필요 구성: 외부 HTTP(S) Load Balancer + SSL 인증서 + Cloud CDN 캐시
- Cloud CDN Asia egress: $0.09/GB (첫 10TB)

**장점**: 기존 URL 체계 유지 가능, 캐시로 TTFB 개선
**단점**: Load Balancer 고정비 ~$18/월, 설정 복잡도 높음, 현 트래픽 규모 대비 과잉 투자

### 방안 2: 로컬 images/ 폴더 (각 프로젝트 자체 관리)

- MONK_kr → CF Pages CDN 자동 적용 (이미 일부 사용 중)
- monkos_AI → Cloud Run 컨테이너 내 정적 서빙 (hero.webp 패턴)
- Git 추적, 배포 시 자동 포함

**장점**: 무료 CDN (CF Pages), 배포 원자성, Git 이력 추적
**단점**: Git 리포 비대화 (현재 이미지 ~60개는 OK, 대량 갤러리는 부적합), 동적 로테이션 불가

### 방안 3: Cloudflare R2

- GCS_BUCKET_STRUCTURE.md에 이미 R2 동기화 언급 (`assets/mina/runway/` → `r2://monk-kr/mina/`)
- S3 호환 API, egress 무료, Workers 연동 용이

**장점**: egress 무료 (GCS 대비 이점), CF 글로벌 엣지, MONK_kr CF Pages와 동일 생태계
**단점**: 새로운 스토리지 시스템 도입 = 관리 포인트 증가, GCS 의존 서비스 (Vertex AI, monk-image-engine)와 이원화

### 방안 4: 혼합 (정적=로컬, 동적=GCS)

- 변경 빈도 낮은 에셋 (갤러리/아이콘/히어로) → 로컬 images/ (CF Pages CDN / Cloud Run 번들)
- 변경 빈도 높은 에셋 (광고 로테이션, AI 생성물) → GCS (manifest 기반 동적 서빙)
- 각 배포라인이 자기 에셋을 자체 관리

**장점**: 배포라인별 독립 (헌법 10조 적합), 비용 최적, 현행 구조에서 최소 변경
**단점**: 두 가지 패턴 병행 관리, 새 에셋 추가 시 어디에 둘지 판단 필요

---

### 비교 프레임워크

| 기준 | 방안1 (GCS+CDN) | 방안2 (로컬) | 방안3 (R2) | 방안4 (혼합) |
|------|:---:|:---:|:---:|:---:|
| **비용** | ✗ ($18+/월 LB 고정비) | ◎ (무료) | ○ ($0.015/GB, egress 무료) | ◎ (정적 무료 + GCS 최소) |
| **복잡도** | ✗ (LB+SSL+CDN 설정) | ◎ (git push만) | △ (새 시스템 도입) | ○ (현행+α) |
| **성능 (TTFB)** | ○ (CDN 캐시 후 양호) | ◎ (CF 엣지 즉시) | ◎ (CF 엣지 즉시) | ◎/○ (정적=CF, 동적=GCS) |
| **관리 편의성** | △ (인프라 관리 부담) | ◎ (Git 원스톱) | △ (이원화 관리) | ○ (명확한 역할 분리) |
| **헌법 10조 적합** | ○ (단일 파이프라인) | ◎ (자체 완결) | △ (R2⇄GCS 프록시 위험) | ◎ (배포라인별 독립) |
| **분기 대응 용이** | △ (CDN 캐시 퍼지 필요) | ◎ (브랜치별 독립) | ○ (Workers 연동) | ○ (정적은 즉시, 동적은 manifest) |

---

### 추천안: **방안 4 (혼합)** ◎

#### 근거

1. **헌법 제10조 최적 적합**: "배포라인이 다른 시스템을 프록시로 엮지 않는다"
   - MONK_kr (CF Pages) → 자체 images/ (CF CDN 자동)
   - monkos_AI (Cloud Run) → 자체 images/ 또는 public/ (컨테이너 번들)
   - 광고/AI생성물 → GCS (monk-image-engine 파이프라인 유지)

2. **비용 최적**: 정적 에셋은 CF Pages CDN 무료, GCS는 동적 서빙 최소 유지

3. **최소 변경 원칙**: 현행 구조에서 이미 로컬 images/와 GCS ads/가 공존 중. 이를 공식화하는 것

4. **방안 1 배제 이유**: 월 $18+ Load Balancer 비용이 현 트래픽 규모에 과잉
5. **방안 2 배제 이유**: 광고 로테이션(manifest.json)은 로컬로 불가능
6. **방안 3 배제 이유**: R2 도입 시 GCS↔R2 이원화 = 헌법 10조 프록시 금지 위험

#### 방안 4 적용 시 구체 조치

| 단계 | 조치 | 영향 |
|------|------|------|
| **즉시** | Unsplash 이미지 → 로컬 images/로 교체 (외부 의존 제거) | MONK_kr, portal |
| **즉시** | monk-ai-images IAM 정비: `allUsers` 제거 → `ads/` 객체별 ACL만 공개 | 보안 개선 |
| **단기** | monk-project/live/ 삭제 (409 MB 사장 데이터) | 비용 절감 |
| **단기** | kbeauty_sources 중복 정리 (한쪽만 유지) | 2.93 GB 절감 |
| **중기** | monk-ai-images 리전 이전 검토 (us-central1 → asia-northeast3) | TTFB 개선 |
| **중기** | 삭제된 버킷(soul/session_data) 문서 참조 정리 | 문서 정합성 |

---

## 발견 사항 요약

### 🔴 긴급 (보안)

1. **monk-ai-images 버킷 전체 공개**: `allUsers:objectViewer`로 raw_data(크롤링 원본 2.93GB) + generated(AI 생성물 187MB)가 공개 노출 상태. 의도는 ads/ 폴더만 공개.

### 🟡 주의

2. **데이터 중복 (5.86 GB)**: kbeauty_sources가 monk-ai-images와 monk-project 양쪽에 ~2.93 GB씩 존재
3. **사장 데이터 (409 MB)**: monk-project/live/ — 2개월 방치된 node_modules 스냅샷
4. **리전 불일치**: monk-ai-images가 us-central1 (한국 사용자 대상인데 미국 리전)
5. **문서 불일치**: monk-project-soul, monk_session_data 삭제되었으나 10+ 문서에서 여전히 참조

### 🟢 양호

6. 전체 GCS 비용은 ~$0.21/월로 미미
7. 프로덕션 핵심 경로(ads/ + manifest.json)는 정상 작동 중
8. 로컬 images/ 패턴이 MONK_kr에서 이미 잘 작동 중

---

*보고서 작성: 2026-03-08 12:00 KST*
*작성자: iMac/막내1*
