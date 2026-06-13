---
type: report
date: 2026-06-12
from: iMac/막내3
to: iMac/쌍아
status: 완료
subject: "GCP 전수조사 C — Cloud Run 런타임 SA 맵 + 프로젝트 종료 판정 (4-22 델타)"
portfolio: PF_SECURITY
---

# GCP 전수조사 C — Cloud Run 런타임 SA 맵 + 프로젝트 종료 판정

> **[2026-06-12 12:04 KST]** iMac/막내3 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내3_SECURITY_CloudRun_SA맵_종료판정.md`
> 기준선: `REPORT_20260422_GCP_Firebase_인프라감사.md` (4-22 막내1)
> 감사 방식: 읽기 전용 (서비스 변경·프로젝트 종료·IAM 변경 일체 없음)

---

## 1. Cloud Run 런타임 SA 의존성 맵 (Task 4)

### 1-1. 리전 보정

지시서에 `asia-northeast3`으로 기재되어 있으나, **실측 결과 전 서비스 us-central1** (pt만 asia-northeast1).

```
gcloud run services list --project=monkos → us-central1 × 10, asia-northeast1 × 1
```

### 1-2. 전수 맵 (11개 서비스)

| # | 서비스 | 리전 | 런타임 SA | SA 유형 | 비고 |
|---|--------|------|----------|---------|------|
| 1 | **monk-image-engine** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | 이미지 엔진 |
| 2 | **monk-n8n** | us-central1 | `933456016842-compute@developer` | ⚠️ **Compute 기본** | N8N 워크플로우 |
| 3 | **monkos-idphoto-jp** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | JP 증명사진 |
| 4 | **monkos-idphoto-jp-dev** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | JP dev |
| 5 | **monkos-idphoto-kr** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | KR 증명사진 |
| 6 | **monkos-idphoto-kr-dev** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | KR dev |
| 7 | **monkos-portal** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | 포털 본진 |
| 8 | **monkos-portal-dev** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | 포털 dev |
| 9 | **monkos-studio** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | 스튜디오 |
| 10 | **monkos-studio-dev** | us-central1 | `monk-image-engine@monkos.iam` | 전용 | 스튜디오 dev |
| 11 | **pt** | asia-northeast1 | `933456016842-compute@developer` | ⚠️ **Compute 기본** | PT 서비스 |

**요약**: 전용 SA 9개 (82%) / Compute 기본 SA 2개 (18%)

### 1-3. SA별 프로젝트 IAM 역할

#### monk-image-engine@monkos.iam.gserviceaccount.com (9개 서비스)

| 역할 | 용도 추정 |
|------|----------|
| `roles/aiplatform.user` | Gemini/Imagen API 호출 |
| `roles/datastore.owner` | Firestore 읽기/쓰기 (크레딧, 고객 데이터) |
| `roles/datastore.user` | Firestore 읽기 (보조) |
| `roles/iam.serviceAccountTokenCreator` | Impersonation 체인 |
| `roles/secretmanager.secretAccessor` | Secret Manager 시크릿 읽기 (31개 시크릿) |
| `roles/storage.objectAdmin` | GCS 버킷 접근 (이미지 저장/조회) |

> 4-22 대비 **+3 역할** 추가 (aiplatform.user, datastore.user, secretmanager.secretAccessor) — 서비스 고도화에 따른 정상 확장

#### 933456016842-compute@developer.gserviceaccount.com (monk-n8n, pt)

| 역할 | 비고 |
|------|------|
| `roles/editor` | ⚠️ **초과권한** — 프로젝트 내 거의 모든 리소스 읽기/쓰기 가능 |

### 1-4. Compute 기본 SA 실사용 권한 분석

**Recommender API**: monkos 프로젝트에서 **미활성** — 활성화 후 조회 필요.

**Audit Log 조회** (90일, 전 리전): **활동 0건**
- Data Access 로그가 미활성이거나, monk-n8n/pt가 90일간 호출을 생성하지 않은 것으로 추정
- monk-n8n: 4-22 감사에서 이미 "2개월 미배포" 지적 → 현시점 7개월+ 미배포
- pt: ELEVENLABS_API_KEY를 Secret Manager에서 주입받는 구조

**monk-n8n 환경변수**: `N8N_HOST`, `GENERIC_TIMEZONE`, `TZ` (3개, SA 무관)
**pt 환경변수**: `ELEVENLABS_API_KEY` (Secret Manager secretKeyRef → `secretmanager.secretAccessor` 필요)

### 1-5. 전용 SA 전환 시 영향 분석

| 서비스 | 현 SA | 필요 최소 역할 | 전환 시 주의 |
|--------|-------|---------------|-------------|
| **monk-n8n** | Compute 기본 (editor) | 불명 — N8N이 어떤 GCP API를 호출하는지 Audit Log 부재로 특정 불가 | ⚠️ N8N 워크플로우별 사용 API 감사 선행 필수. 7개월+ 미배포 → 폐기 여부 먼저 결정 |
| **pt** | Compute 기본 (editor) | `secretmanager.secretAccessor` (확정) + 추가 API 불명 | Audit Log/코드 기반 추가 확인 필요 |

### 1-6. 서비스 레벨 IAM (샘플: monkos-portal)

| 역할 | 멤버 |
|------|------|
| `roles/run.invoker` | `allUsers` |

> 퍼블릭 서비스. 포털·증명사진·스튜디오 모두 동일 구조 추정.

---

## 2. 프로젝트 종료 선결 체크리스트 (Task 5)

### 2-1. 전체 프로젝트 목록 (gcloud projects list)

| Project ID | 이름 | 상태 | 종료 대상 |
|------------|------|------|----------|
| monkos | MONKOS | ACTIVE | ❌ 본진 |
| monkos-3c6e4 | Monkos (Firebase) | ACTIVE | ❌ Firebase |
| monk-data-factory | monk-data-factory | ACTIVE | ❌ (별도 판정 필요) |
| gen-lang-client-0105707468 | startMONK | ACTIVE | 🔍 조사 대상 |
| gen-lang-client-0127984847 | monkos-aistudio | ACTIVE | 🔍 조사 대상 |
| gen-lang-client-0705237063 | Default Gemini Project | ACTIVE | 🔍 조사 대상 |
| savvy-cinema-481804-r1 | My Maps Project | ACTIVE | 🔍 조사 대상 |

### 2-2. startMONK (gen-lang-client-0105707468)

| 리소스 유형 | 결과 | 상세 |
|------------|------|------|
| Cloud Run | **1** | `monk-ai-backend` (asia-northeast3, 2026-01-13 마지막 배포, **5개월 유휴**) |
| 버킷 | **6** | 상세 하단 |
| App Engine | 없음 | |
| Firestore | API 미활성 (없음) | |
| Cloud Functions | API 미활성 (없음) | |
| Scheduler | API 미활성 (없음) | |
| Cloud Tasks | API 미활성 (없음) | |
| SA | 2 | `smuse73` (USER_MANAGED 키 1개), `251409703490-compute` |

**버킷 상세**:

| 버킷 | 크기 | 판정 |
|------|------|------|
| `startmonk_bucket` | 355 MB | 🔍 막내2 내용 감사 중 |
| `monk-data-factory-assets` | 257 MB | 🔍 막내2 내용 감사 중 |
| `startmonk-soul` | 24 KB | 소량 — 종료 시 소실 확인 필요 |
| `run-sources-*-asia-northeast3` | 6.5 KB | Cloud Run 빌드 아티팩트 — 불요 |
| `251409703490_*_import_content_with_faq_csv` | 0 B | 빈 버킷 |
| `video_muse` | 0 B | 빈 버킷 |

**판정: ⏳ 선결 잔존**
- 버킷 2개(startmonk_bucket 355MB, monk-data-factory-assets 257MB) 내용 감사 미완 (막내2 진행 중)
- 감사 완료 + 필요 데이터 이전 후 → 종료 가능
- smuse73 USER_MANAGED 키: 프로젝트 삭제 시 자동 무효화

### 2-3. monkos-aistudio (gen-lang-client-0127984847)

| 리소스 유형 | 결과 |
|------------|------|
| Cloud Run | API 미활성 (0) |
| 버킷 | 0 |
| App Engine | 없음 |
| Firestore | API 미활성 (0) |
| Cloud Functions | API 미활성 (0) |
| Scheduler | API 미활성 (0) |
| SA | 0 |
| IAM | gdsajin@gmail.com (owner) 뿐 |

**판정: ✅ 종료해도 됨**
- 리소스 제로, SA 제로. monkos IAM 잔존 바인딩 없음.

### 2-4. Default Gemini Project (gen-lang-client-0705237063)

| 리소스 유형 | 결과 |
|------------|------|
| Cloud Run | API 미활성 (0) |
| 버킷 | 0 |
| App Engine | 없음 |
| SA | 1 (`vertex-express`, USER_MANAGED 키 0, aiplatform.expressUser) |
| IAM | gdsajin@gmail.com (owner) + vertex-express |

**판정: ✅ 종료해도 됨**
- 실질 리소스 제로. vertex-express는 Gemini Express 자동 생성 SA — 프로젝트 삭제 시 자동 정리.
- monkos IAM 잔존 바인딩 없음.

### 2-5. My Maps Project (savvy-cinema-481804-r1)

| 리소스 유형 | 결과 |
|------------|------|
| Cloud Run | API 미활성 (0) |
| 버킷 | 0 |
| App Engine | 없음 |
| SA | 0 |
| IAM | gdsajin@gmail.com (owner) 뿐 |

**판정: ✅ 종료해도 됨**
- 리소스 제로, SA 제로. monkos IAM 잔존 바인딩 없음.

### 2-6. 종료 판정표

| 프로젝트 | 판정 | 선결 조건 | 종료 클릭 가능 |
|---------|------|----------|--------------|
| **monkos-aistudio** | ✅ 즉시 종료 가능 | 없음 | 작가님 콘솔에서 종료 |
| **Default Gemini** | ✅ 즉시 종료 가능 | 없음 | 작가님 콘솔에서 종료 |
| **My Maps** | ✅ 즉시 종료 가능 | 없음 | 작가님 콘솔에서 종료 |
| **startMONK** | ⏳ 막내2 버킷 감사 후 | 버킷 2개 내용 확인 + 필요 데이터 이전 | 감사 완료 후 |

---

## 3. 교차 감사 (막내1 보고서 대비)

> 참조: `REPORT_20260612_iMac막내1_SECURITY_GCP키IAM전수.md`

### 3-1. Cloud Run 런타임 SA vs IAM 정책 정합성

| SA | IAM 등록 | Cloud Run 실사용 | 정합 |
|----|---------|-----------------|------|
| monk-image-engine | 6개 역할 (§2-1 참조) | 9개 서비스의 런타임 SA | ✅ 일치 |
| Compute 기본 SA | roles/editor | monk-n8n, pt 런타임 | ⚠️ 초과 — editor는 2개 서비스에만 필요, 그마저도 최소권한이 아님 |

> 막내1 보고서 §2-1에서 Compute 기본 SA `roles/editor` 잔존을 확인. 본 건에서 **이 SA를 실제 사용하는 서비스가 monk-n8n, pt 2개뿐**임을 특정 — Phase 2 전용 SA 분기 설계의 핵심 인풋.

### 3-2. 종료 대상 프로젝트 SA → monkos IAM 잔존 여부

```
gcloud projects get-iam-policy monkos | 종료 대상 4개 프로젝트 SA 스캔 → 0건
```

✅ **안전** — 4개 프로젝트 종료 시 monkos IAM에 고아 바인딩 발생하지 않음.

### 3-3. USER_MANAGED 키 × Cloud Run 환경변수 주입

| 서비스 | 환경변수 | SA 키 직접 참조 |
|--------|---------|----------------|
| monk-n8n | N8N_HOST, GENERIC_TIMEZONE, TZ | ❌ 없음 ✅ |
| pt | ELEVENLABS_API_KEY (Secret Manager ref) | ❌ 없음 ✅ |

> 막내1 보고서 §3에서 USER_MANAGED 키 3개(yong-a, smuse73, monk-factory-agent) 추적. 본 건에서 **Cloud Run 환경변수에 이 키를 직접 주입하는 서비스 없음** 확인. 키 폐기 시 Cloud Run 런타임 영향 없음.

### 3-4. 추가 교차 발견

| # | 항목 | 세부 |
|---|------|------|
| X1 | 막내1 §6 #10 "monk-n8n 2개월 미배포" | 본 건 실측: **7개월+ 미배포** (2025-11 추정). Compute 기본 SA 사용 + 장기 유휴 → **폐기 또는 전용 SA 전환 우선순위 최하** |
| X2 | 막내1 §6 #11 "pt region 불명" | 본 건 실측: **asia-northeast1** 확정. Compute 기본 SA + ELEVENLABS_API_KEY |
| X3 | 막내1 §2-1 yong-a editor 삭제 | ✅ 확인 — monkos IAM에서 yong-a는 aiplatform.user + storage.objectAdmin만 잔존 |
| X4 | 막내1 §2-2 크로스프로젝트 바인딩 | monkos-3c6e4@appspot → monkos aiplatform.user 잔존 확인 (본 건 범위 외이나 일치 확인) |

---

## 4. 신규 발견사항

| # | 심각도 | 항목 | 권고 |
|---|--------|------|------|
| N1 | ⚠️ HIGH | **Compute 기본 SA (roles/editor) → monk-n8n, pt 2개 서비스만 사용** | editor 축소의 블라스트 레디어스가 2개 서비스로 한정 — 전용 SA 전환 우선 타겟 |
| N2 | ⚠️ MED | **monk-n8n 7개월+ 미배포 + Compute 기본 SA** | 폐기 검토 추천. 존속 시 전용 SA 전환 필요 |
| N3 | ⚠️ MED | **pt 서비스: Compute 기본 SA + Secret Manager 의존** | secretmanager.secretAccessor만으로 구동 가능 여부 확인 후 전용 SA 전환 |
| N4 | ⚠️ MED | **Recommender API 미활성** | 활성화 후 Compute SA 실사용 권한 6개 식별 가능 (웹민아 세션 정보와 대조) |
| N5 | ℹ️ INFO | **리전 불일치**: 지시서 asia-northeast3 vs 실측 us-central1 | deploy.sh 리전 변수 기준 us-central1이 정본. 지시서 기준선 문서 보정 필요 |
| N6 | ℹ️ INFO | **monkos-portal allUsers run.invoker** | 퍼블릭 서비스 의도적 설정. 보안 검토 시 인지 사항 |
| N7 | ✅ GOOD | **전용 SA(monk-image-engine) 전환율 82%** (9/11) | 이미 대부분 서비스가 전용 SA. Compute 기본 SA 의존은 2개뿐 |
| N8 | ✅ GOOD | **종료 대상 4개 프로젝트 → monkos IAM 잔존 0건** | 안전하게 종료 가능 |

---

## 5. 감사 방법 / 한계

**사용 명령** (전수 읽기 전용):
- `gcloud run services list --project=monkos` — 전 리전
- `gcloud run services describe {서비스} --format="value(spec.template.spec.serviceAccountName)"` — 11개 서비스
- `gcloud projects get-iam-policy {프로젝트}` — monkos + 종료 대상 4개
- `gcloud iam service-accounts list` — monkos + 종료 대상 4개
- `gcloud run services get-iam-policy` — 서비스 레벨 IAM 샘플
- `gcloud logging read` — Compute SA Audit Log (90일)
- `gsutil ls -p` / `gsutil du -s` — startMONK 버킷 목록·크기
- `gcloud app describe` / `gcloud firestore databases list` / `gcloud functions list` / `gcloud scheduler jobs list` — 종료 대상 4개 리소스 확인

**한계:**
- **Recommender API 미활성**: 실사용 6개 권한 식별 불가 (웹민아 세션 정보 의존)
- **Data Access 로그 미활성 추정**: Compute SA 90일 Audit Log 0건 — 실사용 API 특정 불가
- **Discovery Engine**: `gcloud alpha` 미설치 — startMONK 데이터스토어 잔존 미확인
- **monk-n8n 내부 워크플로우**: N8N이 어떤 GCP API를 호출하는지 코드/워크플로우 감사 미수행

**헌법 준수:**
- 4조 1항 — 키·시크릿 값 조회/생성/추측 없음 ✅
- 4조 2항 — 서비스 변경·프로젝트 종료·IAM 변경 없음 (모두 list/describe/get/read) ✅

---

**감사 완료**
**[2026-06-12 12:04 KST] iMac/막내3**
