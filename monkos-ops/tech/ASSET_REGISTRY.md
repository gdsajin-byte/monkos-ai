# 에셋 레지스트리 — MONK.KR 자산 통합 인덱스

> **소관**: docs/infrastructure (인프라 참고문헌)
> **성격**: 전 저장소 통합 인덱스 — "어디에 뭐가 있는가"를 이 문서 하나로 해결
> **법적 근거**: ch4 4조 (정본 위치 규칙), ch4 6조 6항 (에셋 편입 절차)
> **관련 문서**: [GCS_BUCKET_STRUCTURE.md](GCS_BUCKET_STRUCTURE.md) · [credentials_inventory](../../monkos-ops/ops/credentials_inventory.md)
> **최종 갱신**: 2026-02-23

---

## 에셋 분류 체계

**에셋(Asset)은 콘텐츠의 상위 개념이다.** 코드, 이미지, 데이터, 시크릿, 문서 — 프로젝트가 소유한 모든 것이 에셋이다.

Git에는 경로만 남기고, 바이너리 에셋은 외부 저장소에 보관한다.

| 코드 | 카테고리 | 포함 내용 | Git 추적 |
|------|---------|----------|----------|
| CODE | 코드 | 소스코드, 설정, 스크립트, 인프라 문서 | O |
| BIN | 바이너리 | 이미지, PDF, 미디어, 폰트 | X (경로만) |
| DATA | 데이터 | DB 레코드, 분석 집계, 로그 | X (스키마만) |
| SEC | 시크릿 | API 키, 토큰, OAuth 시크릿, SA 키 | X (절대 금지) |
| GOV | 거버넌스 | 법률, 헌법, 철학, 청구서, 어젠다 | O |
| OPS | 운영 | 세션로그, 지시서, 보고서, 크레덴셜 인벤토리 | O |
| LEGACY | 레거시 | 비활성 앱, 아카이브, 이관 대기 에셋 | 일부 |

---

## 저장소 인벤토리

프로젝트가 사용하는 전체 저장소 목록.

| # | 저장소 | 유형 | 위치 | 주 용도 | 상태 |
|---|--------|------|------|---------|------|
| 1 | **Git** (GitHub) | VCS | `github.com/.../monk_project` | 코드 + 문서 정본 | **활성** (85.4MB, 969파일) |
| 2 | **GCS** monk-project | Object | `gs://monk-project/` (asia-northeast3) | 바이너리 에셋 + 코퍼스 + RAG | **활성** (~5GB) |
| 3 | **GCS** monk-ai-images | Object | `gs://monk-ai-images/` | K-beauty 이미지 원본 | **레거시** (→ monk-project 이관 대기) |
| 4 | **GCS** monk-project-soul | Object | `gs://monk-project-soul/saga/` | 세션 로그 원본 | **레거시** (→ monk-project 이관 대기) |
| 5 | **GCS** monk_session_data | Object | `gs://monk_session_data/` | Gemini 대화 원본 | **레거시** (→ monk-project 이관 대기) |
| 6 | **CF D1** monk-db | SQL | Cloudflare (ID: `6fe2a64b...`) | monk.kr 포털 메타데이터 | **활성** (<10MB) |
| 7 | **CF D1** monk-services-db | SQL | Cloudflare (ID: `1c88fa57...`) | Gemini 프록시 서비스맵 | **활성** |
| 8 | **CF R2** monk-chat-logs | Object | Cloudflare R2 | 챗 세션 퍼시스턴스 | **활성** |
| 9 | **CF R2** monk-apps | Object | Cloudflare R2 | 생성 이미지 저장 (T2I) | **활성** |
| 10 | **Firestore** monkos | NoSQL | GCP Firestore (project: `monkos`) | 유저/크레딧/RAG 코퍼스 | **활성** |
| 11 | **로컬** _saga/ | Disk | 각 디바이스 로컬 | 원본 에셋 (Git 미추적) | **이관 대기** (3GB) |

---

## 에셋 레지스트리

### CODE — 코드 에셋

| 에셋명 | 저장소 | 경로 | 설명 | 상태 |
|--------|--------|------|------|------|
| monk.kr 포털 | Git | `MONK_kr/` | Cloudflare Pages 소스 (88MB) | 활성 |
| photolab MPA | Git | `MONK_kr/ai_lab/photolab/` | 페이지 분리 리팩토링 작업장 | 개발중 |
| CF Workers | Git | `MONK_kr/cloudflare-workers/` | Gemini 프록시, RAG 엔진 | 활성 |
| CF Pages Functions | Git | `functions/api/` | 서버리스 API (precheck/idgen/qc 등) | 활성 |
| idphoto-kr 서버 | Git | `monkos_AI/idphoto-kr/` | Cloud Run 소스 (v00079 동결) | 동결 |
| idphoto-jp 서버 | Git | `monkos_AI/idphoto-jp/` | Cloud Run 소스 | 활성 |
| portal 서버 | Git | `monkos_AI/portal/` | Cloud Run 소스 (monkos.ai) | 활성 |
| ops 스크립트 | Git | `monkos-ops/scripts/` | 운영 자동화 (ads_sync, queue_sync 등) | 활성 |
| 커맨드 브릿지 | Git | `commands/` | CLI 유틸리티 | 활성 |

### BIN — 바이너리 에셋

| 에셋명 | 저장소 | 경로 | 규모 | 상태 | 상세문서 |
|--------|--------|------|------|------|----------|
| K-beauty 이미지 | GCS | `gs://monk-project/assets/soso/sources/kbeauty/` | ~2.8GB | 활성 | [GCS_BUCKET_STRUCTURE.md](GCS_BUCKET_STRUCTURE.md) |
| 배경 이미지 | GCS | `gs://monk-project/assets/soso/sources/backgrounds/` | ~500MB | 활성 | 〃 |
| AI 모델 포트폴리오 | GCS | `gs://monk-project/assets/mina/models/` | 가변 | 활성 | 〃 |
| BWYA 강의 자료 | GCS | `gs://monk-project/assets/yonga/bwya/` | ~217MB | 활성 | 〃 |
| 생성 이미지 (T2I) | R2 | `monk-apps` 버킷 | 가변 | 활성 | — |
| 챗 로그 바이너리 | R2 | `monk-chat-logs` 버킷 | 가변 | 활성 | — |
| 자격증 PDF | Git | `docs/corpus/claude_sessions/certifications/` | 58MB | **이관 후보** | — |
| 스튜디오 샘플 이미지 | Git | `MONK_kr/monk_studio/*/images/` | ~3MB | 활성 (웹 에셋) | — |
| K-beauty 로컬 원본 | 로컬 | `_saga/kbeauty_sources/` | 2.8GB | 이관 대기 | — |
| BWYA 로컬 원본 | 로컬 | `_saga/BWYA_Academy/` | 217MB | 이관 대기 | — |

### DATA — 데이터 에셋

| 에셋명 | 저장소 | 경로/컬렉션 | 용도 | 상태 |
|--------|--------|------------|------|------|
| 방문자 정보 | D1 | `shared_visitors` | 성별, 연령, 직업, 목적 | 활성 |
| 결제 내역 | D1 | `transactions` | 토스 결제 레코드 | 활성 |
| 크레딧 사용 | D1 | `credit_usage` | 서비스별 크레딧 소비 | 활성 |
| 서비스 카탈로그 | D1 | `service_categories` + `services` | 서비스 메타데이터 | 활성 |
| FAQ | D1 | `faqs` | 카테고리별 FAQ | 활성 |
| 사업자 정보 | D1 | `business_info` | 영업시간, 연락처 | 활성 |
| 유저/크레딧 | Firestore | `users` 컬렉션 | id, email, credits, tier | 활성 |
| CS 지식 RAG | Firestore | `cs_knowledge` | CS 챗봇 코퍼스 | 활성 |
| 브랜드 스토리 RAG | Firestore | `cs_brand_story` | 브랜드 내러티브 | 활성 |
| 법률 RAG | Firestore | `cs_legal` | 법적 안내 | 활성 |
| 코칭 코퍼스 RAG | Firestore | `cs_prep` | 촬영 코칭 | 활성 |
| 방문자 분석 | GCS | `gs://monk-project/visitor_data/` | 일별/월별 집계 | 활성 |
| 세션 코퍼스 | GCS | `gs://monk-project/corpus/` | Vertex AI RAG 소스 | 활성 |
| Gemini 대화 | GCS | `gs://monk-project/corpus/gemini/` | 용아 전략 대화 (15M+) | 활성 |

### SEC — 시크릿 에셋

> 상세는 [credentials_inventory.md](../../monkos-ops/ops/credentials_inventory.md) 참조. 값은 절대 기록하지 않는다.

| 에셋명 | 저장소 | 위치 | 용도 |
|--------|--------|------|------|
| monkos_AI/.env | 환경변수 | Cloud Run 서비스별 | Gemini, OAuth, 결제, 텔레그램 (17변수) |
| CF Pages Secrets | 환경변수 | Cloudflare Dashboard | Gemini API, OAuth, GCP SA (11변수) |
| OAuth 클라이언트 | GCP Console | Google Cloud Console | Google/Kakao/LINE 로그인 |
| SA 키 | GCP Console | monk-image-engine SA | Imagen API 접근 |
| credentials.json | 로컬 | `apps/monk-ai-studio-pro/` (.gitignore 보호) | GCP OAuth (레거시) |

### GOV — 거버넌스 에셋

| 에셋명 | 저장소 | 경로 | 규모 | 상태 |
|--------|--------|------|------|------|
| 헌법 | Git | `CLAUDE.md` (11조) | 8KB | 활성 |
| 법률 | Git | `governance/laws/` (8장 36조) | 45KB | 활성 |
| 개정 절차 | Git | `governance/constitution/` | 12KB | 활성 |
| 청구서 | Git | `governance/constitution/petitions/` | 20KB | 활성 (2건 보관) |
| 철학 레지스트리 | Git | `governance/philosophy/PHILOSOPHY.md` | 40KB | 활성 (89건) |
| 의사결정 기록 | Git | `governance/history/` | 8KB | 활성 |
| 이관 로그 | Git | `governance/MIGRATION_LOG.md` | 4KB | 활성 |

### OPS — 운영 에셋

| 에셋명 | 저장소 | 경로 | 용도 | 상태 |
|--------|--------|------|------|------|
| 세션 로그 (정본) | Git | `monkos-ops/ops/sessions/` | 시계열 운영 기록 | 활성 |
| 세션 로그 (아카이브) | Git | `docs/corpus/sessions/` | 읽기전용 아카이브 | 활성 |
| 전략 어젠다 | Git | `monkos-ops/ops/agenda/` | 입법 전 공론장 (3건) | 활성 |
| 크레덴셜 인벤토리 | Git | `monkos-ops/ops/credentials_inventory.md` | 시크릿 경로 매핑 | 활성 |
| 지시서 | Git | `docs/monkos/tasks/YYYY-MM/` | 막내 작업 지시 | 활성 |
| 보고서 | Git | `docs/monkos/reports/YYYY-MM/` | 작업 결과 보고 | 활성 |
| 기술 스펙 | Git | `monkos-ops/tech/specs/` | 서비스별 명세 | 활성 |

### LEGACY — 레거시 에셋

| 에셋명 | 저장소 | 경로 | 규모 | 상태 | 처분 방향 |
|--------|--------|------|------|------|----------|
| monk-ai-studio-pro | 로컬 | `apps/monk-ai-studio-pro/` | 308MB | Git 미추적 | 아카이브 유지 |
| imagen3 | 로컬 | `apps/imagen3/` | 152MB | Git 미추적 | 아카이브 유지 |
| MonkosChat | Git | `apps/MonkosChat/` | 1.6MB | 14파일 추적 | 정리 후보 |
| monk_imagen4 | Git | `apps/monk_imagen4/` | 396KB | 49파일 추적 | 정리 후보 |
| photolab-monkkr-mpa-0219 | Git | `apps/photolab-monkkr-mpa-0219/` | 724KB | 35파일 추적 | MPA 베이스라인 |
| monk-cam | Git | `apps/monk-cam/` | 220KB | 25파일 추적 | 정리 후보 |
| GCS monk-ai-images | GCS | `gs://monk-ai-images/` | 미상 | 이관 대기 | → monk-project/assets/soso/ |
| GCS monk-project-soul | GCS | `gs://monk-project-soul/saga/` | 미상 | 이관 대기 | → monk-project/corpus/sessions/ |
| GCS monk_session_data | GCS | `gs://monk_session_data/` | 미상 | 이관 대기 | → monk-project/corpus/gemini/ |
| _saga 로컬 원본 | 로컬 | `_saga/` | 3GB | Git 미추적 | → GCS 이관 후 로컬 삭제 |

---

## 저장소 간 데이터 흐름

```
[Git] ←코드 배포→ [CF Pages] ←API→ [CF Functions]
                                        ↓
                              [GCS corpus/] → [Vertex AI RAG]
                                        ↓
[Git] ←코드 배포→ [Cloud Run] ←크레딧→ [Firestore]
                       ↓
                  [GCS assets/] ←이미지→ [R2 monk-apps]
                       ↓
                  [D1 monk-db] ←백업→ [GCS shared/]
```

| 흐름 | 소스 → 대상 | 트리거 |
|------|------------|--------|
| 코드 배포 (CF) | Git → Cloudflare Pages | git push (자동) |
| 코드 배포 (CR) | Git → Cloud Run | gcloud builds submit (수동) |
| 코퍼스 학습 | GCS corpus/ → Vertex AI | 매일 02:00 KST (자동) |
| D1 백업 | D1 monk-db → GCS shared/ | 일별 (자동) |
| 이미지 생성 | Cloud Run → R2 monk-apps | 사용자 요청 시 |
| 크레딧 차감 | idphoto-kr/jp → Firestore users | 생성/다운로드 시 |
| 결제 기록 | 토스/Lemon → D1 transactions | 결제 완료 시 |
| R2↔GCS 싱크 | GCS mina/runway → R2 monk-kr | 온디맨드 |

---

## 경량화 원칙

### Git에 남는 것 (CODE + GOV + OPS)
- 소스코드, 설정 파일, 인프라 문서
- 법률, 헌법, 철학, 거버넌스 문서
- 세션 로그, 지시서, 보고서
- **기준**: 텍스트이고, 버전 관리가 필요하고, diff가 의미 있는 것

### 외부로 가는 것 (BIN + DATA + SEC)
- 이미지, PDF, 미디어 → **GCS** 또는 **R2**
- DB 레코드, 분석 데이터 → **D1** 또는 **Firestore**
- API 키, 토큰 → **환경변수** (절대 Git 금지)
- **기준**: 바이너리이거나, 용량이 크거나, 보안 민감한 것

### 즉시 이관 후보

| 대상 | 현 위치 | 이관 대상 | 절감량 |
|------|---------|----------|--------|
| 자격증 PDF (11개, 중복 2건 포함) | Git `docs/corpus/claude_sessions/certifications/` | GCS `corpus/claude_sessions/certifications/` | -58MB |
| _saga/ 전체 | 로컬 디스크 | GCS (각 하위 폴더별) | 로컬 -3GB |
| 레거시 GCS 버킷 3개 | 개별 버킷 | GCS monk-project/ 통합 | 버킷 수 -3 |

---

## 에셋 편입 절차

> ch4 6조 6항 참조

신규 에셋 편입 시:

1. **카테고리 판정** — CODE / BIN / DATA / SEC / GOV / OPS / LEGACY
2. **저장소 배정**:
   - 코드/문서 → Git
   - 바이너리/미디어 → GCS 또는 R2
   - DB 레코드 → D1 또는 Firestore
   - 시크릿 → 환경변수 (절대 Git 금지)
3. **본 레지스트리 해당 카테고리에 행 추가**
4. **상세 문서 해당 시** 참조 링크 기재 (GCS_BUCKET_STRUCTURE 등)

---

## 문서 자산 카테고리 인덱스

> 2026-02-27 문서자산통합 Phase 2에서 추가. docs/infrastructure/ 하위 분류 현황.

| 카테고리 | 경로 | 파일 수 | README |
|---------|------|---------|--------|
| architecture | docs/infrastructure/architecture/ | 10 | ✅ |
| deployment | docs/infrastructure/deployment/ | 11 | ✅ |
| ai-models | docs/infrastructure/ai-models/ | 13 | ✅ |
| strategy | docs/infrastructure/strategy/ | 13 | ✅ |
| guides | docs/infrastructure/guides/ | 13 | ✅ |
| audit | docs/infrastructure/audit/ | 7 | ✅ |
| history | docs/infrastructure/history/ | 4 | ✅ |

**전체 문서 지도**: [docs/DOCUMENT_ATLAS.md](../DOCUMENT_ATLAS.md)

---

> 신설: 2026-02-23 작가님+쌍아 합의
> 근거: Git 85.4MB 중 PDF 58MB(68%) 비효율 발견 + 전 저장소 통합 인덱스 부재
> 원칙: "에셋은 컨텐츠 상위 개념. 깃에는 경로만 남기고 에셋은 GCS에 보관한다"
