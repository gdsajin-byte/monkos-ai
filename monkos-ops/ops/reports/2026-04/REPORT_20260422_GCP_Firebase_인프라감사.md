---
type: REPORT
date: 2026-04-22
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: GCP + Firebase 인프라 총체 감사
---

# GCP + Firebase 인프라 감사 보고서

> **[2026-04-22 11:27 KST] iMac/막내1 → iMac/쌍아**
> 근거 지시서: `ORDER_20260422_인프라감사_GCP_Firebase.md`
> 감사 방식: 읽기 전용 (값 조회 금지, 메타데이터만)
> 감사자 계정: gdsajin@gmail.com (owner)

---

## 1. 프로젝트 관계도

| Project ID | Name | 프로젝트 번호 | 용도 추정 | 활성도 | 비고 |
|---|---|---|---|---|---|
| `monkos` | MONKOS | 933456016842 | **메인 프로덕션** — monkos.ai Cloud Run 11서비스 + Firestore(20컬렉션) + Secret Manager | 🟢 ACTIVE | 본진 |
| `monkos-3c6e4` | Monkos | 676916736379 | **Firebase 프로젝트** — Auth + Hosting(monkos-3c6e4.web.app) + Firestore(4컬렉션) | 🟢 ACTIVE | Firebase auto-create 명명 |
| `monk-data-factory` | monk-data-factory | 246218027500 | 데이터 수집/인덱싱 (BigQuery + Vertex AI + Discovery Engine) | 🟡 SEMI | Cloud Run 0개, 버킷 1개 |
| `gen-lang-client-0105707468` | startMONK | 251409703490 | 챗봇 백엔드 — `monk-ai-backend` (asia-northeast3) | 🟡 SEMI | Cloud Run 1개 |
| `gen-lang-client-0127984847` | monkos-aistudio | 1005980567198 | (용도 불명 — API 2개만 활성) | 🔴 IDLE | 리소스 없음 |
| `gen-lang-client-0705237063` | Default Gemini Project | 792768222442 | Gemini API 키 보관용 (AI Studio 생성) | 🔴 IDLE | API 키 3개, 리소스 없음 |
| `savvy-cinema-481804-r1` | My Maps Project | 172847690242 | Google Maps API 테스트/레거시 | 🔴 IDLE | 모든 리소스 없음 |

> ⚠️ **작명 개연성 문제**: 동의 화면에 "MONKOS IMAGE pro" 이름이 Docs에 뜨는 혼선 (2026-04-19 MCP_GDOCS 설정 시 발견). 프로젝트명 vs 동의화면 표시명 불일치 추정. 콘솔 수동 확인 권장.

---

## 2. 서비스 계정 현황

### 2-1. 사용자 관리 SA (프로젝트별)

| SA | Project | 역할 | USER_MANAGED 키 | 비고 |
|---|---|---|---|---|
| `smuse73` | gen-lang-client-0105707468 | `roles/owner`, `roles/aiplatform.user` | **1개** | ⚠️ Owner 권한 + 키 파일 존재 |
| `vertex-express` | gen-lang-client-0705237063 | (바인딩 없음) | 0 | 유휴 |
| `monk-factory-agent` | monk-data-factory | `roles/aiplatform.user`, `roles/storage.objectAdmin` | **1개** | |
| `yong-a-orchestrator` | monkos | `roles/editor`, `roles/aiplatform.user`, `roles/storage.objectAdmin` | **1개** | ⚠️ editor(거의 owner급) |
| `monk-image-engine` | monkos | `roles/datastore.owner`, `roles/storage.objectAdmin`, `roles/iam.serviceAccountTokenCreator` | 0 (SYSTEM_MANAGED 2개) | Cloud Run `monk-image-engine` 구동 SA |
| `firebase-adminsdk-fbsvc` | monkos-3c6e4 | `roles/firebase.sdkAdminServiceAgent`, `roles/firebaseauth.admin` | 0 | Firebase 기본 SA |

### 2-2. 기본 SA (App Engine / Compute)
- `monk-data-factory@appspot.gserviceaccount.com` (roles/editor)
- `monkos-3c6e4@appspot.gserviceaccount.com` (roles/editor, roles/aiplatform.user 크로스프로젝트)
- `*-compute@developer.gserviceaccount.com` (roles/editor, 전 프로젝트)

> ⚠️ **크로스 프로젝트 바인딩**: `monkos-3c6e4@appspot.gserviceaccount.com`이 `monkos` 프로젝트에 `roles/aiplatform.user` 보유. 의도된 것인지 확인 필요.

---

## 3. OAuth / API 키 현황

### 3-1. API 키 목록 (값은 조회하지 않음)

| Project | Display Name | Created |
|---|---|---|
| gen-lang-client-0105707468 | monk_chatbot_cloudflare | 2026-01-04 |
| gen-lang-client-0705237063 | Generative Language API Key | 2026-01-05 |
| gen-lang-client-0705237063 | API 키 1개 | 2025-12-22 |
| gen-lang-client-0705237063 | Default Gemini API Key | 2025-12-21 |
| monk-data-factory | 검색기능key | 2025-12-29 |
| monk-data-factory | data_factory_APIkey | 2025-12-29 |
| **monkos** | MONKOS NEW API Key | 2026-03-30 |
| monkos | monkos_key | 2026-01-11 |
| monkos | monkosimagepro | 2026-01-11 |
| monkos | monk-aistudio-consol | 2026-01-05 |
| monkos-3c6e4 | Browser key (auto created by Firebase) | 2026-01-25 |

> ⚠️ **monkos 프로젝트 API 키 4개** — 용도 중복 가능성. 특히 `monkos_key`, `monkosimagepro`, `monk-aistudio-consol`의 차이 불명. "MONKOS NEW API Key"가 신규 정본이면 구 3개 정리 후보.
> ⚠️ **gen-lang-client-0705237063 API 키 3개**: 프로젝트 자체가 IDLE로 판단되는데 키 3개 유지. 현재 활용처 확인 후 정리 후보.

### 3-2. OAuth 2.0 클라이언트 & 동의 화면
- ⚠️ **CLI 조회 불가** — IAP OAuth Admin API는 2026-01-19부터 폐기 예정(2026-03-19 완전 종료). `gcloud alpha iap oauth-brands`는 alpha 컴포넌트 미설치.
- **콘솔 수동 확인 필요**: https://console.cloud.google.com/apis/credentials
- 프로젝트당 동의 화면 1개씩 존재 추정 (각 API 키가 속한 프로젝트에 한해).

---

## 4. 버킷 현황

| Bucket | Project | Location | Size | Public | 용도 추정 |
|---|---|---|---|---|---|
| `gs://monk-ai-images` | monkos | us-central1 | **3.55 GiB** | 🚨 **PUBLIC** (allUsers:objectViewer) | AI 이미지 CDN (monk-image-engine 연동) |
| `gs://monk-project` | monkos | asia-northeast3 | 3.13 GiB | private | 일반 프로젝트 자산 |
| `gs://monkos_cloudbuild` | monkos | US | — | private | Cloud Build 임시 |
| `gs://run-sources-monkos-*` (3개) | monkos | us-central1/asia-northeast1/3 | — | private | Cloud Run 소스 번들 |
| `gs://933456016842_810216434_*` (2개) | monkos | asia-northeast3/us | — | private | Discovery Engine 인덱싱 자동 생성 |
| `gs://monk-factory-storage` | monk-data-factory | asia-northeast3 | 618.4 MiB | 🚨 **PUBLIC** (allUsers:composer.environmentAndStorageObjectViewer) | 데이터 수집 저장소 |
| `gs://monk-data-factory-assets` | gen-lang-client-0105707468 | asia-northeast3 | 257.3 MiB | private | 자산 (교차 프로젝트 소유) |
| `gs://startmonk_bucket` | gen-lang-client-0105707468 | us-central1 | 354.9 MiB | private | startMONK 초기 자산 |
| `gs://startmonk-soul` | gen-lang-client-0105707468 | us-central1 | 23.65 KiB | private | 거의 빈 상태 |
| `gs://video_muse` | gen-lang-client-0105707468 | US | **0 B** | private | 완전 유휴 |
| `gs://251409703490_214897757_us_import_content_with_faq_csv` | gen-lang-client-0105707468 | US | — | private | Discovery Engine 인덱싱 자동 생성 |
| `gs://gcf-sources-676916736379-us-central1` | monkos-3c6e4 | us-central1 | — | private | Cloud Functions 소스 |
| `gs://run-sources-gen-lang-client-0105707468-asia-northeast3` | gen-lang-client-0105707468 | asia-northeast3 | — | private | Cloud Run 소스 번들 |

> 🚨 **헌법 4조 1항 관련 — PUBLIC 버킷 2개**:
> - `gs://monk-ai-images`: `roles/storage.objectViewer` allUsers — **읽기 공개**. AI 이미지 CDN이면 의도적이지만 정기 감사 대상.
> - `gs://monk-factory-storage`: `roles/composer.environmentAndStorageObjectViewer` allUsers — **Cloud Composer 환경 리소스 뷰어**. 데이터 수집 버킷에 공개 권한은 이례적. 확인 권장.
>
> ℹ️ CORS 설정은 전 버킷 0개 규칙. uniform_bucket_level_access 필드는 describe 응답에서 확인 실패 (gcloud 550.0.0 포맷 이슈) → 별도 조사 필요 시 REST API 직접 호출.

---

## 5. Cloud Run 현황

### 5-1. monkos 프로젝트 (11개 서비스)

| Service | Region | Last Deployed | deploy.sh (법률 ch5 2조) |
|---|---|---|---|
| `monkos-portal` | us-central1 | 2026-04-14 | ✅ `monkos_AI/portal/deploy.sh` |
| `monkos-portal-dev` | us-central1 | 2026-04-08 | ⚠️ dev 전용 deploy.sh 미확인 |
| `monkos-idphoto-kr` | us-central1 | 2026-04-21 | ✅ `monkos_AI/idphoto-kr/deploy.sh` |
| `monkos-idphoto-kr-dev` | us-central1 | 2026-03-25 | ⚠️ dev 전용 deploy.sh 미확인 |
| `monkos-idphoto-jp` | us-central1 | 2026-04-21 | ✅ `monkos_AI/idphoto-jp/deploy.sh` |
| `monkos-idphoto-jp-dev` | us-central1 | 2026-03-25 | ⚠️ dev 전용 deploy.sh 미확인 |
| `monkos-studio` | us-central1 | 2026-04-01 | ✅ `monkos_AI/studio/deploy.sh` |
| `monkos-studio-dev` | us-central1 | 2026-04-01 | ⚠️ dev 전용 deploy.sh 미확인 |
| `monk-image-engine` | us-central1 | 2026-03-30 | ✅ `apps/monk_imagen4/backend/deploy.sh` |
| `monk-n8n` | us-central1 | 2026-02-18 | ℹ️ 법률 ch5 2조 적용 제외 (n8n 특수) |
| `pt` | **asia-northeast1** | 2026-04-03 (생성) | ℹ️ 2조 한시적 예외 (pt.monkos.ai) |

> ⚠️ **rules/deployment.md 오기 의심**: `pt`는 실제 `asia-northeast1`에 배포되어 있는데 rules의 맥락에선 region 명시 없음. URL 접미사 `-an` = asia-northeast1 (northeast3은 `-du`). 참고용 기록.
> ⚠️ **-dev 서비스 배포 경로 불명**: `*-dev` 4개 서비스는 `monkos_AI/*/deploy.sh` 내부에서 env 분기 처리 추정. deploy.sh 내용 확인 필요.

### 5-2. gen-lang-client-0105707468 (startMONK)
| Service | Region | Last Deployed | deploy.sh |
|---|---|---|---|
| `monk-ai-backend` | asia-northeast3 | 2026-01-13 (lastTransition) | ❓ 리포에서 미확인 — 챗봇 백엔드 정본 경로 확인 필요 |

### 5-3. 그 외
- `monk-data-factory`: Cloud Run 0개
- 그 외 4개 프로젝트: Run API 미활성

---

## 6. Secret Manager 현황

| Project | Secret | Created |
|---|---|---|
| **monkos** | `GEMINI_API_KEY` | 2026-02-28 |
| monkos | `ELEVENLABS_API_KEY` | 2026-04-03 |
| monkos | `MCP_GDOCS_CLIENT_ID` | 2026-04-19 |
| monkos | `MCP_GDOCS_CLIENT_SECRET` | 2026-04-19 |

> ℹ️ Secret Manager API 활성 프로젝트는 **monkos 단일**. 다른 프로젝트는 API 미활성 (Secret 없음 추정).
> 값은 조회하지 않았다. 메타데이터만.

---

## 7. Firebase 현황

### 7-1. Firestore 데이터베이스

| Project | DB Name | Location | Type | Created |
|---|---|---|---|---|
| **monkos** | `(default)` | us-central1 | FIRESTORE_NATIVE | 2026-02-10 |
| monkos-3c6e4 | `(default)` | **nam5** (multi-region) | FIRESTORE_NATIVE | 2026-01-29 |
| monkos-3c6e4 | `default` | us-central1 | FIRESTORE_NATIVE | 2026-01-29 |

> ⚠️ **monkos-3c6e4에 DB 2개 존재** (`(default)` vs `default` — 괄호 유무). 2분 간격으로 생성됨 (10:11 → 10:14). 하나는 잘못 만들어졌을 가능성. 콘솔에서 용도 확인 + 유휴 DB 정리 검토.

### 7-2. Firestore 최상위 컬렉션

**monkos / (default)** (20개):
- `blog_posts`, `board_posts`, `chat_conversations`, `cs_conversations`, `cs_knowledge`
- `daily_survey`, `faq_items`, `gallery_items`
- `idphoto_jp_conversations`, `idphoto_kr_conversations`, `kakao_conversations`, `line_conversations`
- `payments`, `site_config`, `survey_responses`
- `telegramGateCodes`, `telegram_bonus_codes`, `telegram_links`
- `transactions`, `users`

**monkos-3c6e4 / (default)** (4개): `aiStatus`, `commands`, `notifications`, `users`

> ℹ️ 컬렉션 네이밍 **inconsistency**: `telegramGateCodes`(camelCase) vs `telegram_bonus_codes`/`telegram_links`(snake_case) 혼재.

### 7-3. Firebase Hosting
| Project | Site | URL | Type |
|---|---|---|---|
| monkos-3c6e4 | `monkos-3c6e4` | https://monkos-3c6e4.web.app | DEFAULT_SITE |

> ℹ️ monkos 프로젝트엔 firebasehosting API 미활성 → 호스팅 없음.

### 7-4. Firebase Auth (monkos-3c6e4)
- **활성 프로바이더**:
  - `email` — enabled, passwordRequired=true
  - `anonymous` — **enabled** ⚠️
- **권한 도메인**: `localhost`, `monkos-3c6e4.firebaseapp.com`, `monkos-3c6e4.web.app`, `monkos.ai`
- **MFA**: 비활성 (state 미설정)
- **hashConfig**: SCRYPT, rounds=8, memoryCost=14 (Firebase 표준)

> ⚠️ **익명(anonymous) 로그인 활성** — 의도적이면 문제없음. 실서비스 유입 경로에 익명 세션이 필요 없다면 비활성 권장.
> ⚠️ **MFA 비활성** — 실사용자가 늘어나면 관리자 계정 MFA 강제 검토 필요.

### 7-5. 보안 규칙
- Firestore rules: 이번 감사 범위에서 규칙 본문은 조회하지 않음 (gcloud firebase CLI 미설치). 콘솔 또는 `firebase-tools` 별도 설치 후 점검 권장.

---

## 8. 위험 / 개선 발견사항

| # | 심각도 | 항목 | 위치 | 조치 권장 |
|---|---|---|---|---|
| 1 | 🚨 HIGH | **PUBLIC 버킷**: `gs://monk-factory-storage` allUsers 읽기 권한 | monk-data-factory | 의도 확인 → 필요 없으면 즉시 제거 |
| 2 | ⚠️ MED | PUBLIC 버킷: `gs://monk-ai-images` allUsers:objectViewer | monkos | CDN 용도라면 유지. 정기 감사 대상으로 기록 |
| 3 | ⚠️ MED | Firestore DB 중복: monkos-3c6e4 `default` + `(default)` | monkos-3c6e4 | 각 DB 사용처 확인 → 유휴 DB 정리 |
| 4 | ⚠️ MED | Firebase Auth `anonymous` 로그인 활성 | monkos-3c6e4 | 실서비스 유입경로 점검 → 불필요시 비활성 |
| 5 | ⚠️ MED | `yong-a-orchestrator` SA에 `roles/editor` 부여 | monkos | 실제 필요 권한으로 축소 (storage.objectAdmin + aiplatform.user로 충분할 가능성) |
| 6 | ⚠️ MED | USER_MANAGED SA 키 3개 (`smuse73`, `monk-factory-agent`, `yong-a-orchestrator`) | 3개 프로젝트 | 키 파일 로컬/리포 존재 여부 점검 → Workload Identity 또는 impersonation 전환 검토 (memory: `project_security_consolidation.md`) |
| 7 | ⚠️ MED | `monkos` API 키 4개, 용도 불명 구 키 3개 | monkos | "MONKOS NEW API Key"가 정본이면 구 3개 제한/삭제 검토 |
| 8 | ⚠️ LOW | 크로스 프로젝트 바인딩: `monkos-3c6e4@appspot` → `monkos` `aiplatform.user` | monkos | 의도 확인 |
| 9 | ⚠️ LOW | Firebase MFA 미설정 | monkos-3c6e4 | 실유저 증가 시 관리자 MFA 도입 |
| 10 | ⚠️ LOW | `monk-n8n` 2개월 이상 미배포 (2/18) | monkos | 사용 중인지 확인. 유휴면 정지 |
| 11 | ℹ️ INFO | `pt` 서비스 region 불명 — 실제 `asia-northeast1` | monkos | `.claude/rules/deployment.md`에 region 정보 추가 검토 |
| 12 | ℹ️ INFO | Firestore 컬렉션 네이밍 혼재 (camelCase + snake_case) | monkos | 신규 컬렉션은 snake_case 통일 권장 |

---

## 9. 유휴 리소스 목록

### 9-1. 유휴 프로젝트 (정리 후보)
| Project | 판단 근거 |
|---|---|
| `gen-lang-client-0127984847` (monkos-aistudio) | SA 없음, 버킷 없음, Cloud Run 없음, API 2개만 활성 (generativelanguage + telemetry). AI Studio 생성 흔적만 |
| `savvy-cinema-481804-r1` (My Maps Project) | SA 없음, 버킷 없음, Cloud Run API 미활성. BigQuery/Maps 관련 API만. 레거시 Google Maps 테스트로 추정 |
| `gen-lang-client-0705237063` (Default Gemini Project) | 버킷/Cloud Run 없음, API 키 3개만 있음. 실사용처 확인 후 API 키 마이그레이션 + 프로젝트 폐기 후보 |

### 9-2. 유휴 버킷
| Bucket | Size | 비고 |
|---|---|---|
| `gs://video_muse` | **0 B** | 완전 비어있음 — 삭제 후보 |
| `gs://startmonk-soul` | 23.65 KiB | 거의 빈 상태 — 내용 확인 후 아카이브 여부 판단 |

### 9-3. 유휴/장기 미배포 Cloud Run
- `monk-n8n` (2026-02-18 마지막 배포) — 2개월+ 미배포. n8n 워크플로우 실사용 여부 확인 필요.
- `monkos-*-dev` 4개 — 최근 배포가 3/25~4/8. prod/dev 패리티 맞추는 정기 배포 정책 검토.

### 9-4. 유휴 API 키
- `gen-lang-client-0705237063` 프로젝트 API 키 3개 — 프로젝트 자체가 IDLE.
- `monkos`의 구 API 키 3개 — "MONKOS NEW API Key" 외.

---

## 10. 감사 방법 / 한계

- **사용 명령**: `gcloud projects list`, `gcloud iam service-accounts list`, `gcloud services list`, `gcloud services api-keys list`, `gsutil ls`, `gsutil du`, `gsutil iam get`, `gcloud run services list/describe`, `gcloud secrets list`, `gcloud firestore databases list`, `gcloud projects get-iam-policy`
- **REST API 직접 호출** (gcloud 미지원 영역):
  - `firebasehosting.googleapis.com/v1beta1/projects/{p}/sites`
  - `identitytoolkit.googleapis.com/admin/v2/projects/{p}/config`
  - `firestore.googleapis.com/v1/projects/{p}/databases/{db}/documents:listCollectionIds`
- **조사 못 한 영역**:
  - OAuth 2.0 클라이언트 상세 (IAP OAuth Admin API 2026-03-19 폐기, alpha 컴포넌트 미설치)
  - Firestore 보안 규칙 본문 (firebase-tools 미설치)
  - Firebase Hosting 릴리스 히스토리/채널
  - Cloud Run 서비스별 트래픽(QPS) 현황
- **헌법 준수 사항**:
  - 4조 1항 — 비밀정보 값 조회/생성/추측 없음 ✅
  - 4조 2항 — 삭제·수정 명령 없음 (모두 list/describe/get 읽기만) ✅

---

**감사 완료**
**[2026-04-22 11:27 KST] iMac/막내1**
