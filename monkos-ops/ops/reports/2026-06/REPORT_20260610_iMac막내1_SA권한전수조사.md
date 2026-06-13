---
type: report
date: 2026-06-10
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# yong-a-orchestrator SA 키 소비처 전수 조사 + 권한 최소화 분석

**[2026-06-10 17:19 KST] iMac/막내1 → 작가님**

---

## 0. 핵심 발견

**SA가 1개가 아니라 2개 운용 중:**

| SA | 역할 | 소비처 | 현재 권한 |
|----|------|--------|----------|
| `yong-a-orchestrator` | CI/CD (GH Actions) | daily-briefing.py | **roles/editor** (과잉) |
| `monk-image-engine` | Cloud Run 런타임 | 5개 서비스 전체 | **확인 필요** (GCP 콘솔) |

deploy.sh는 SA 키를 사용하지 않음 — 실행자의 로컬 gcloud auth 사용 후, `monk-image-engine`을 런타임 SA로 지정.

---

## 1. Task 1: 소비처 전수 추적

### 1-1. `yong-a-orchestrator` (GH Secrets `GCP_SA_KEY`)

| 소비처 | 파일:행 | 사용 GCP API | 접근 유형 | 필요 권한 (최소) |
|--------|---------|------------|----------|----------------|
| 데일리 브리핑 GA4 | `.github/scripts/daily_briefing.py:76` | Analytics Data API v1beta | **읽기 전용** | `analytics.readonly` 스코프 |
| 데일리 브리핑 GSC | `.github/scripts/daily_briefing.py:106` | Search Console API | **읽기 전용** | `webmasters.readonly` 스코프 |

**GCP_SA_KEY를 참조하는 워크플로우**: `daily-briefing.yml:27` (1건만)

다른 워크플로우 5개는 GCP SA를 **사용하지 않음**:
- `weekly-dashboard.yml` — PF 줄 수 체크만 (로컬 파일)
- `governance-check.yml` — grep 기반 (로컬 파일)
- `secret-scan.yml` — regex 기반 (로컬 파일)
- `sync-works.yml` — git 동기화만
- `notify.yml` — Telegram only

### 1-2. `monk-image-engine` (Cloud Run 런타임 SA)

| 소비처 | 파일 | 사용 GCP API | 접근 유형 | 필요 권한 (최소) |
|--------|------|------------|----------|----------------|
| **portal** Firestore | `portal/lib/shared/config.js:87` | Firestore (Native) | CRUD | `roles/datastore.user` |
| **portal** Vertex AI | `portal/lib/shared/config.js:91` | Vertex AI Gemini | 생성 | `roles/aiplatform.user` |
| **portal** GA4 대시보드 | `portal/lib/cms/dashboard.js:3,26` | Analytics Data API | 읽기 | `roles/analyticsdata.viewer` |
| **portal** Indexing API | `portal/lib/cms/seo.js:14` | Google Indexing API | 쓰기 | `roles/indexing.publisher` |
| **idphoto-kr** Firestore | server.js (credits 함수) | Firestore | CRUD | `roles/datastore.user` |
| **idphoto-kr** Vertex AI | server.js (Gemini+Imagen) | Vertex AI | 생성 | `roles/aiplatform.user` |
| **idphoto-kr** GCS | `gcs-save.js:7` | Cloud Storage | 읽기+쓰기+서명 | `roles/storage.objectAdmin` |
| **idphoto-jp** Firestore | server.js | Firestore | CRUD | `roles/datastore.user` |
| **idphoto-jp** Vertex AI | server.js | Vertex AI | 생성 | `roles/aiplatform.user` |
| **idphoto-jp** GCS | `gcs-save.js:7` | Cloud Storage | 읽기+쓰기+서명 | `roles/storage.objectAdmin` |
| **studio** Vertex AI | `server.js:44,50` | Vertex AI (Gemini+Imagen) | 생성 | `roles/aiplatform.user` |
| **studio** GCS | `gcs-save.js:7` | Cloud Storage | 읽기+쓰기 | `roles/storage.objectAdmin` |
| **monk-imagen4** Vertex AI | backend | Vertex AI | 생성 | `roles/aiplatform.user` |

### 1-3. deploy.sh 인증 구조

| deploy.sh | 실행 시 인증 | 런타임 SA 지정 | 필요 gcloud 권한 |
|-----------|------------|--------------|----------------|
| portal | 실행자 로컬 auth | `monk-image-engine@***.iam` | `roles/run.admin` + `roles/cloudbuild.builds.editor` |
| idphoto-kr | 〃 | `monk-image-engine@***.iam` | 〃 |
| idphoto-jp | 〃 | `monk-image-engine@***.iam` | 〃 |
| studio | 〃 | `monk-image-engine@***.iam` | 〃 |
| monk-imagen4 | 〃 | `monk-image-engine@***.iam` | 〃 |

deploy.sh는 `GCP_SA_KEY`를 사용하지 않음. `gcloud auth`가 선행 필요.

---

## 2. Task 2: GCP API별 필요 권한 매핑

### `yong-a-orchestrator` (CI — 읽기 전용)

| GCP API | 소비처 | 현재 (editor) | 최소 필요 역할 |
|---------|--------|-------------|--------------|
| Analytics Data API v1beta | daily_briefing.py | ✅ 포함 | **GA4 property에 Viewer 추가** (IAM이 아닌 GA4 속성 권한) |
| Search Console API | daily_briefing.py | ✅ 포함 | **GSC 속성에 Restricted User 추가** (IAM이 아닌 GSC 속성 권한) |

**핵심**: GA4와 GSC는 프로젝트 IAM이 아니라 **속성별 사용자 권한**으로 제어됨. SA 이메일을 GA4 속성/GSC 속성에 뷰어로 추가하면, 프로젝트 IAM에서는 **어떤 역할도 불필요**.

→ `yong-a-orchestrator`의 프로젝트 IAM을 **roles/editor → 역할 없음(제거)**으로 낮출 수 있음. GA4/GSC 속성 권한만 유지.

### `monk-image-engine` (런타임 — 읽기+쓰기)

| GCP API | 소비처 | 최소 필요 역할 |
|---------|--------|--------------|
| Firestore Native | portal, idphoto-kr/jp | `roles/datastore.user` |
| Cloud Storage | idphoto-kr/jp, studio | `roles/storage.objectAdmin` (서명 URL 필요) |
| Vertex AI (Gemini/Imagen) | 전 서비스 | `roles/aiplatform.user` |
| Analytics Data API | portal dashboard | GA4 속성 Viewer (IAM 불필요) |
| Google Indexing API | portal seo.js | `roles/indexing.publisher` (custom) |

**합산 최소 역할:**
```
roles/datastore.user                      — Firestore CRUD (portal)
roles/storage.objectAdmin                 — GCS 업로드/다운로드/삭제 (전 서비스)
roles/aiplatform.user                     — Vertex AI Gemini/Imagen (전 서비스)
roles/indexing.publisher                  — Google Indexing API (portal seo.js)
roles/iam.serviceAccountTokenCreator      — GCS signed URL 생성 (idphoto-kr/jp)
roles/secretmanager.secretAccessor        — GEMINI_API_KEY 런타임 마운트 (monk-imagen4)
```

**보충**: idphoto-kr/jp는 `getSignedUrl()`을 호출하므로 SA가 자기 자신의 토큰을 서명할 수 있어야 함 → `serviceAccountTokenCreator` 필요. monk-imagen4는 deploy.sh에서 `--update-secrets` 플래그로 Secret Manager 시크릿을 마운트 → `secretAccessor` 필요.

---

## 3. Task 3: 권한 축소 시나리오 분석

### 시나리오 A — SA 2개 유지, 각각 권한 축소

| 항목 | yong-a-orchestrator | monk-image-engine |
|------|-------------------|------------------|
| 용도 | CI (GH Actions) | 런타임 (Cloud Run) |
| IAM 역할 | **제거** (프로젝트 IAM 불필요) | `datastore.user` + `storage.objectAdmin` + `aiplatform.user` + `indexing.publisher` |
| 속성 권한 | GA4 Viewer + GSC Restricted User | GA4 Viewer (대시보드용) |
| 기존 서비스 영향 | ❌ 없음 (읽기 전용 API만 사용) | ⚠️ 테스트 필요 (현재 역할 미확인) |

**장점**: SA 증식 없음, 최소 변경
**단점**: monk-image-engine의 현재 역할을 GCP 콘솔에서 확인해야 함
**영향**: daily-briefing.py는 GA4/GSC 속성 권한만으로 동작. 런타임은 4개 역할로 커버.

### 시나리오 B — SA 2개 유지 (현행), editor → custom role

| 항목 | 변경 내용 |
|------|----------|
| yong-a-orchestrator | roles/editor → **custom role** (analytics.data.get + webmasters.readonly) |
| monk-image-engine | 변경 없음 (GCP 콘솔 확인 후 판단) |

**장점**: 프로젝트 IAM 제거가 부담스러우면 custom role이 안전
**단점**: custom role 유지보수

### 시나리오 C — SA 1개로 통합 (비권고)

yong-a-orchestrator를 제거하고 monk-image-engine의 키를 GH Secrets에 넣는 방안.

**비권고 사유**:
- monk-image-engine은 런타임 SA → 키를 외부(GitHub)에 두면 공격 표면 확대
- 읽기 전용(CI) + 쓰기(런타임)의 분리가 보안의 기본 원칙

### 시나리오 D — 시나리오 A + 루틴 대응 (권고)

웹/민아가 설계 중인 **루틴(Routines)** 환경도 GA4/GSC 읽기가 필요:

| 환경 | 인증 방식 | SA |
|------|----------|-----|
| GH Actions | `GCP_SA_KEY` (yong-a-orchestrator) | yong-a-orchestrator |
| Routines (Claude Code 원격) | `GCP_SA_KEY` 또는 ADC | yong-a-orchestrator (읽기 전용이므로 공유 가능) |
| Cloud Run 런타임 | ADC | monk-image-engine |
| deploy.sh (로컬) | gcloud auth (사용자) | — |

**장점**: 루틴까지 커버하면서 SA 2개 유지
**단점**: 없음 (루틴도 읽기 전용이라 동일 SA 공유 안전)

---

## 4. 종합 권고

### 즉시 실행 (시나리오 A 기반)

1. **`yong-a-orchestrator` IAM**: `roles/editor` → **제거** (프로젝트 IAM에서 삭제)
2. **GA4 속성**: `yong-a-orchestrator@***.iam.gserviceaccount.com`을 GA4 속성에 **뷰어**로 추가
3. **GSC 속성**: 동 SA를 GSC 속성에 **Restricted User**로 추가
4. **테스트**: `daily-briefing.yml` workflow_dispatch 실행 → GA4/GSC 데이터 정상 수집 확인

### 확인 필요 (GCP 콘솔)

5. `monk-image-engine`의 현재 IAM 역할 확인 (`gcloud projects get-iam-policy`)
6. 필요 시 `roles/datastore.user` + `roles/storage.objectAdmin` + `roles/aiplatform.user` + `roles/indexing.publisher`로 교체
7. 교체 후 전 서비스 health check

### 향후

8. 루틴 환경에서 `yong-a-orchestrator` 키 공유 검증

---

## 5. 부록: 미사용 SA 후보

리포 내 코드에서 `yong-a-orchestrator`를 직접 참조하는 곳은 **0건** (GH Secrets에만 존재). `monk-image-engine`도 deploy.sh의 변수로만 참조. 둘 다 코드에 SA 이름이 하드코딩되어 있지 않아 교체가 용이함.

---

*끝.*
