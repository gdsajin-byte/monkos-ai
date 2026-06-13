---
type: report
date: 2026-06-12
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: "GCP 전수조사 A — 프로젝트·IAM·키 현행화 + SA 수동 키 추적 (4-22 델타)"
portfolio: PF_SECURITY
---

# GCP 전수조사 A — 프로젝트·IAM·키 현행화 + SA 수동 키 추적

> **[2026-06-12 12:01 KST]** iMac/막내1 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내1_SECURITY_GCP키IAM_SA키추적.md`
> 기준선: `REPORT_20260422_GCP_Firebase_인프라감사.md` (4-22 막내1)
> 감사 방식: 읽기 전용 (값 조회 금지, 메타데이터만)

---

## 1. API 키 현황 + 4-22 델타

### 1-1. 전수 결과

| Project | 4-22 키 수 | 06-12 키 수 | 증감 | 잔존 키 |
|---------|-----------|------------|------|---------|
| **monkos** | 4 | **1** | **-3** | MONKOS NEW API Key (5f43e91f, 2026-03-30) |
| **monkos-3c6e4** | 1 | 1 | 0 | Browser key (Firebase auto, db523703, 2026-01-25) |
| **monk-data-factory** | 2 | **0** | **-2** | — |
| **startMONK** | 1 | **0** | **-1** | — |
| **monkos-aistudio** | 0 | 0 | 0 | — |
| **Default Gemini** | 3 | **0** | **-3** | — |
| **savvy-cinema** | 0 | 0 | 0 | — |
| **합계** | **11** | **2** | **-9** | |

### 1-2. 삭제된 키 (9건)

| Project | 삭제 키 | 삭제 추정 시기 |
|---------|---------|---------------|
| monkos | monkos_key | 06-02~06-05 (유출키 정리) |
| monkos | monkosimagepro | 06-02~06-05 (유출키 정리) |
| monkos | monk-aistudio-consol | 06-02~06-05 |
| monk-data-factory | 검색기능key | 06-05 이후 (작가님 일괄 정리) |
| monk-data-factory | data_factory_APIkey | 06-05 이후 |
| startMONK | monk_chatbot_cloudflare | 06-05 이후 |
| Default Gemini | Generative Language API Key | 06-05 이후 |
| Default Gemini | API 키 1개 | 06-05 이후 |
| Default Gemini | Default Gemini API Key | 06-05 이후 |

> 웹민아 06-12 세션 확인: 작가님이 06-05 이후 콘솔에서 일괄 정리. **Gemini 06-19 마감 요건 충족.**

### 1-3. MONKOS NEW API Key 상세

- **UID**: `5f43e91f-5683-4685-9578-da69fcbbc2be`
- **생성일**: 2026-03-30
- **API 제한**: `generativelanguage.googleapis.com` 전용 ✅
- **앱 제한**: 없음 (Cloud Run·CF Workers 발신 IP 비고정으로 제한 불가 — 웹민아 판정 동의)
- **annotations**: `generative-language: enabled`

---

## 2. IAM 현황 + 4-22 델타

### 2-1. monkos (본진)

**사용자 관리 SA IAM 변경:**

| SA | 4-22 역할 | 06-12 역할 | 델타 |
|----|----------|-----------|------|
| **yong-a-orchestrator** | `editor` + `aiplatform.user` + `storage.objectAdmin` | `aiplatform.user` + `storage.objectAdmin` | ✅ **editor 삭제** (06-10 Recommender) |
| **monk-image-engine** | `datastore.owner` + `storage.objectAdmin` + `iam.serviceAccountTokenCreator` | `aiplatform.user` + `datastore.owner` + `datastore.user` + `iam.serviceAccountTokenCreator` + `secretmanager.secretAccessor` + `storage.objectAdmin` | +3역할 (aiplatform.user, datastore.user, secretmanager.secretAccessor) |

**기본 SA (변경 없음):**
- `933456016842-compute@developer` — `roles/editor` 잔존
- `933456016842@cloudservices` — `roles/editor` 잔존

**기타 변경:**
- `gdsajin@gmail.com` — `roles/owner` + `roles/cloudbuild.builds.editor` (변경 없음)

### 2-2. monkos-3c6e4 (Firebase)

| SA | 4-22 역할 | 06-12 역할 | 델타 |
|----|----------|-----------|------|
| **firebase-adminsdk-fbsvc** | `firebase.sdkAdminServiceAgent` + `firebaseauth.admin` | +`iam.serviceAccountTokenCreator` | **+1역할** |
| **monkos-3c6e4@appspot** | `editor` + `aiplatform.user` (크로스→monkos) | `editor` + `aiplatform.user` (크로스→monkos) | 변경 없음 |

> ⚠️ **크로스 프로젝트 바인딩 잔존**: `monkos-3c6e4@appspot` → monkos `aiplatform.user`. 4-22 지적 사항이나 미처리.

### 2-3. monk-data-factory

| SA | 4-22 역할 | 06-12 역할 | 델타 |
|----|----------|-----------|------|
| **monk-factory-agent** | `aiplatform.user` + `storage.objectAdmin` | `aiplatform.user` + `storage.objectAdmin` | 변경 없음 |
| **monk-data-factory@appspot** | `roles/editor` | **(제거됨)** | ✅ **editor 삭제** (06-12 오전 Recommender) |
| **246218027500-compute** | `roles/editor` | **(제거됨)** | ✅ **editor 삭제** |

> `246218027500@cloudservices` — `roles/editor` 잔존 (GCP 관리형, 제거 불가).

### 2-4. startMONK (gen-lang-client-0105707468)

| SA | 4-22 역할 | 06-12 역할 | 델타 |
|----|----------|-----------|------|
| **smuse73** | `roles/owner` + `aiplatform.user` | `aiplatform.user` + `serviceusage.serviceUsageConsumer` | ✅ **owner 삭제** (06-12 오전) |
| **251409703490-compute** | `roles/editor` | `roles/telemetry.writer` | ✅ **editor→telemetry.writer 축소** |

### 2-5. monkos-aistudio (gen-lang-client-0127984847)

- `gdsajin@gmail.com`: `roles/owner` (유일, 변경 없음)
- SA 0개, 리소스 0개 — **유휴 프로젝트** (4-22 판정 유지)

### 2-6. Default Gemini (gen-lang-client-0705237063)

| SA | 4-22 역할 | 06-12 역할 | 델타 |
|----|----------|-----------|------|
| **vertex-express** | (바인딩 없음) | `aiplatform.expressUser` | +1역할 (Gemini API Express 기능) |

- 그 외 `gdsajin@gmail.com`: `roles/owner` (유일)

### 2-7. savvy-cinema (savvy-cinema-481804-r1)

- `gdsajin@gmail.com`: `roles/owner` (유일, 변경 없음)
- SA 0개, 리소스 0개 — **유휴 프로젝트** (4-22 판정 유지)

---

## 3. 서비스 계정 + USER_MANAGED 키 현황

### 3-1. SA 전수 (7개 프로젝트)

| SA | Project | Disabled | USER_MANAGED 키 | 4-22 대비 |
|----|---------|----------|-----------------|----------|
| yong-a-orchestrator | monkos | False | **1** (c1b7e5a7, 06-10 발급) | 키 교체 (구키 삭제 확인) |
| monk-image-engine | monkos | False | 0 | 변경 없음 |
| 933456016842-compute | monkos | False | 0 | 변경 없음 |
| monkos-3c6e4@appspot | monkos-3c6e4 | False | 0 | 변경 없음 |
| 676916736379-compute | monkos-3c6e4 | False | 0 | 변경 없음 |
| firebase-adminsdk-fbsvc | monkos-3c6e4 | False | 0 | 변경 없음 |
| monk-data-factory@appspot | monk-data-factory | False | 0 | 변경 없음 |
| 246218027500-compute | monk-data-factory | False | 0 | 변경 없음 |
| monk-factory-agent | monk-data-factory | False | **1** (863e0af1, 2025-12-29) | 변경 없음 |
| smuse73 | startMONK | False | **1** (67d2ab92, 2025-12-22) | 변경 없음 |
| 251409703490-compute | startMONK | False | 0 | 변경 없음 |
| vertex-express | Default Gemini | False | 0 | 변경 없음 |

> monkos-aistudio: SA 0개, savvy-cinema: SA 0개 (4-22 동일)

### 3-2. USER_MANAGED 키 요약 (4-22 → 06-12)

| SA | 4-22 키 수 | 06-12 키 수 | 키 ID | 발급일 | 상태 |
|----|-----------|------------|-------|--------|------|
| yong-a-orchestrator | 1 | 1 | c1b7e5a702b8 | **2026-06-10** | ✅ 교체 완료 (구키 전부 삭제) |
| smuse73 | 1 | 1 | 67d2ab92d100 | 2025-12-22 | ⚠️ 6개월+ 미교체 |
| monk-factory-agent | 1 | 1 | 863e0af1d2d8 | 2025-12-29 | ⚠️ 6개월+ 미교체 |
| **합계** | 3 | 3 | | | |

---

## 4. SA 수동 키 추적 (Task 3)

### 4-1. yong-a-orchestrator — c1b7e5a702b82a33b7570f7f438844e577172533

- **발급일**: 2026-06-10T08:43:27Z
- **현행 저장소**: GCP Secret Manager `GCP_SA_KEY` + GitHub Secrets `GCP_SA_KEY` (SECRET_INVENTORY §J 기재)
- **로컬 미보관** 확인 (SM=정본, 로컬 삭제 정책)
- **구키 삭제 완결**: 1月분·5月분 키 — USER_MANAGED 조회 결과 현 키(c1b7e5a7) 단 1건만 존재. **삭제 완료 확정.** ✅

### 4-2. smuse73 — 67d2ab92d1004e746643343f3e226225cfc8db86

- **발급일**: 2025-12-22T14:44:21Z (6개월+ 경과)
- **소재 파악**:
  - 리포 내 (`monk_project/`): grep 미검출 ✅
  - 홈 디렉토리 (`~/`, 4depth): grep 미검출 ✅
  - CF Dashboard `GCP_SERVICE_ACCOUNT_KEY` 항목: 수동 확인 필요 (CLI 접근 불가)
  - 4060 GPU 서버: 원격 확인 필요 (iMac에서 접근 범위 밖)
- **IAM 현황**: `aiplatform.user` + `serviceusage.serviceUsageConsumer` (owner 삭제됨)
- **사용처 추정**: startMONK 프로젝트 `monk-ai-backend` Cloud Run (2026-01-13 마지막 배포, 7주간 유휴). 웹민아 세션에서 startMONK 라이브 참조 **0건** 확인 — 프로젝트 종료 선결 시 키 자동 소멸
- **판정**: 🟡 **폐기 가능 후보** — startMONK 종료 판정(막내3 담당) 결과에 따라 일괄 처리 권고

### 4-3. monk-factory-agent — 863e0af1d2d8acf8c9e19c55f2f6ab2ec1224fc7

- **발급일**: 2025-12-29T02:17:15Z (6개월+ 경과)
- **소재 파악**:
  - 리포 내 (`monk_project/`): grep 미검출 ✅
  - 홈 디렉토리 (`~/`, 4depth): grep 미검출 ✅
  - CF Dashboard: 수동 확인 필요
  - 4060 GPU 서버: 원격 확인 필요
- **IAM 현황**: `aiplatform.user` + `storage.objectAdmin` (변경 없음)
- **사용처 추정**: monk-data-factory 프로젝트. Cloud Run 0개, API 키 0개 — 프로젝트 자체 활동 저조
- **판정**: 🟡 **폐기 가능 후보** — monk-data-factory 프로젝트 용도 재확인 후 결정 권고

---

## 5. Secret Manager 현황 (4-22 → 06-12)

| 항목 | 4-22 | 06-12 |
|------|------|-------|
| 시크릿 수 | 4 | **31** |
| API 활성 프로젝트 | monkos 단일 | monkos 단일 (변경 없음) |

**4-22 시점 (4건):** GEMINI_API_KEY, ELEVENLABS_API_KEY, MCP_GDOCS_CLIENT_ID, MCP_GDOCS_CLIENT_SECRET

**06-12 추가분 (27건):**
- 06-02: MCP_GDOCS_TOKEN (광역오더 #7)
- 06-03: .env 시크릿 24종 일괄 등록 (광역오더 #8)
- 06-10: GCP_SA_KEY (yong-a 키 교체)
- 06-11: AGENT-API-KEYS (블로그 CMS)
- 05-03: KIMI_API_KEY

---

## 6. 4-22 위험 항목 추적표

| # | 4-22 판정 | 06-12 현행 | 처리 상태 |
|---|----------|-----------|----------|
| 1 | 🚨 monk-factory-storage PUBLIC | **미확인** (막내2 버킷 조사 대상) | ⏳ 막내2 보고 대기 |
| 2 | ⚠️ monk-ai-images PUBLIC | 유지 중 (CDN 용도) | ℹ️ 정기 감사 대상 |
| 3 | ⚠️ Firestore DB 중복 | **미확인** (본 건 범위 외) | ⏳ |
| 4 | ⚠️ Firebase Auth anonymous | **미확인** (본 건 범위 외) | ⏳ |
| 5 | ⚠️ yong-a editor | ✅ **해소** — editor 삭제 (06-10) | ✅ |
| 6 | ⚠️ USER_MANAGED 키 3개 | yong-a 교체 완료. smuse73·factory 미교체 | 🟡 2/3 미처리 |
| 7 | ⚠️ monkos API 키 4개 | ✅ **해소** — 1개로 축소 + 제한 적용 | ✅ |
| 8 | ⚠️ 크로스 프로젝트 바인딩 | **잔존** (monkos-3c6e4@appspot→monkos aiplatform.user) | 🟡 미처리 |
| 9 | ⚠️ Firebase MFA 미설정 | **미확인** (본 건 범위 외) | ⏳ |
| 10 | ⚠️ monk-n8n 2개월 미배포 | **미확인** (막내3 Cloud Run 조사 대상) | ⏳ 막내3 보고 대기 |
| 11 | ℹ️ pt region 불명 | **미확인** | ⏳ |
| 12 | ℹ️ Firestore 네이밍 혼재 | 변경 없음 | ℹ️ |

---

## 7. 신규 발견사항

| # | 심각도 | 항목 | 권고 |
|---|--------|------|------|
| N1 | ⚠️ MED | smuse73 키 6개월+ 미교체 (2025-12-22 발급) | startMONK 종료 판정 시 일괄 폐기. 존속 시 교체 |
| N2 | ⚠️ MED | monk-factory-agent 키 6개월+ 미교체 (2025-12-29 발급) | 프로젝트 용도 재확인 후 결정 |
| N3 | ⚠️ LOW | firebase-adminsdk에 `iam.serviceAccountTokenCreator` 추가됨 (4-22 이후) | Firebase Functions에서 커스텀 토큰 발급용 추정. 의도 확인 |
| N4 | ℹ️ INFO | monkos-3c6e4@appspot → monkos `aiplatform.user` 크로스 바인딩 7주째 미처리 | Phase 2 SA 재설계 시 처리 |
| N5 | ℹ️ INFO | SECRET_INVENTORY §G `roles/indexing.publisher`가 프로젝트 레벨 IAM에 미표시 | GSC 소유자 등록은 GCP IAM과 별도 스코프. 정상 |
| N6 | ✅ GOOD | editor 권한 대량 축소 (yong-a, monk-data-factory×2, startMONK×2) | 06-10~12 Recommender 일괄 적용 성과 |
| N7 | ✅ GOOD | API 키 11→2 대폭 축소 + 잔존 키 API 제한 적용 | 06-19 Gemini 마감 충족 |
| N8 | ✅ GOOD | Secret Manager 4→31 중앙화 (광역오더 #8) | 디바이스간 시크릿 복원 체계 확립 |

---

## 8. 교차 감사

> 막내2 보고서 (버킷 전수) 미생성 상태 — 생성 후 아래 항목 보완 필요.

### 대기 검증 항목

1. **프로젝트 목록 일치 여부**: 막내2 버킷 소유 프로젝트 목록 vs 본 건 Task 1 프로젝트 7건 대조
2. **SA 수동 키 × 버킷 ACL**: smuse73·monk-factory-agent 키가 버킷 ACL에 직접 등록되어 있지 않은지 확인

> 막내2 보고서 생성 시 본 섹션 갱신 예정.

---

## 9. 감사 방법 / 한계

**사용 명령** (전수 읽기 전용):
- `gcloud services api-keys list` — 7개 프로젝트
- `gcloud services api-keys describe` — monkos MONKOS NEW 키 상세
- `gcloud projects get-iam-policy` — 7개 프로젝트
- `gcloud iam service-accounts list` — 7개 프로젝트
- `gcloud iam service-accounts keys list --managed-by=user` — 사용자 관리 SA 6건
- `gcloud secrets list` — monkos
- `find` + `grep` — 로컬 키 파일 소재 추적

**한계:**
- CF Dashboard 환경변수 (CLI 접근 불가) — `GCP_SERVICE_ACCOUNT_KEY` 항목의 SA 식별 미완
- 4060 GPU 서버 원격 파일 시스템 — iMac 세션에서 직접 접근 범위 밖
- M1·M2 로컬 .env / 키 파일 — 원격 미접속

**헌법 준수:**
- 4조 1항 — 키 값 조회/생성/추측 없음 ✅
- 4조 2항 — 상태 변경 명령 없음 (모두 list/describe/get) ✅

---

**감사 완료**
**[2026-06-12 12:01 KST] iMac/막내1**
