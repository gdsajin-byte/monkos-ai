---
type: ORDER
date: 2026-03-04
from: M1/쌍아
to: M1/막내3
priority: HIGH
scope: GCP 프로젝트 + GCS 버킷 + Cloud Run 서비스 전수조사
---

# 지시서: GCP 인프라 전수조사

> **[2026-03-04 04:31 KST] M1/쌍아 → M1/막내3**

---

## 배경

Gemini 2.0 중단 통지(6/1)를 계기로, 현재 GCP 인프라 전체의 가동/비가동 상태, GCS 버킷 에셋 현황, 서비스 간 연결 관계를 정밀 파악해야 한다. 레거시 잔재와 활성 자원의 구분이 불명확한 상태.

---

## 조사 범위

### A. GCP 프로젝트 현황

**대상 프로젝트**:
- `monkos` (주 프로젝트)
- `gen-lang-client-0105707468` (레거시/용아 연결)

**조사 항목**:
1. 각 프로젝트에서 활성화된 API 목록 (`gcloud services list --enabled`)
2. 서비스 계정 목록 + 각 계정의 역할/권한
3. 결제 상태 + 최근 30일 비용 개요
4. IAM 바인딩 현황

### B. Cloud Run 서비스 전수조사

**현재 파악된 서비스**:

| # | 서비스명 | 용도 | 리전 |
|---|---------|------|------|
| 1 | `monkos-idphoto-kr` | 증명사진 한국 (prod) | us-central1 |
| 2 | `monkos-idphoto-kr-dev` | 증명사진 한국 (dev) | us-central1 |
| 3 | `monkos-idphoto-jp` | 증명사진 일본 (prod) | us-central1 |
| 4 | `monkos-idphoto-jp-dev` | 증명사진 일본 (dev) | us-central1 |
| 5 | `monkos-portal` | 포털 (prod) | us-central1 |
| 6 | `monkos-portal-dev` | 포털 (dev) | us-central1 |
| 7 | `monk-image-engine` | Image Pro 백엔드 | us-central1 |

**조사 항목 (서비스별)**:
1. 실제 가동 상태 확인 (`gcloud run services list`)
2. 최신 리비전 + 배포 시각
3. 트래픽 할당 (100% 라우팅 여부)
4. 환경변수 목록 (`gcloud run services describe --format`)
5. 도메인 매핑 상태
6. 최근 30일 요청 수 / 인스턴스 수 (가동 판별)
7. **위 목록에 없는 서비스**가 있는지 확인 — 레거시 잔재 파악

### C. GCS 버킷 전수조사

**현재 파악된 버킷**:

| # | 버킷 | 리전 | 용도 | 상태 |
|---|------|------|------|------|
| 1 | `gs://monk-project/` | asia-northeast3 | 주 버킷 | 활성 추정 |
| 2 | `gs://monk-ai-images/` | ? | AI 생성 이미지 + 광고 에셋 | 활성 (코드 참조) |
| 3 | `gs://monk-project-soul/` | ? | 세션 로그 (레거시) | 비가동 추정 |
| 4 | `gs://monk_session_data/` | ? | Gemini 대화 저장 (레거시) | 비가동 추정 |

**조사 항목 (버킷별)**:
1. 실존 확인 (`gsutil ls`)
2. 리전 + 스토리지 클래스
3. 전체 용량 + 객체 수 (`gsutil du -s`)
4. 디렉토리 구조 1~2단계 (`gsutil ls gs://버킷명/`)
5. 공개 접근 설정 (allUsers, allAuthenticatedUsers)
6. CORS 설정
7. 수명 주기 정책 (lifecycle rules)
8. 최근 30일 접근 로그 (Access Logs 활성 여부)
9. **코드에서 참조하는 경로와 실제 버킷 구조의 일치 여부**
10. **위 목록에 없는 버킷**이 있는지 확인

### D. GCS 활용 맥락 분석

코드에서 GCS를 참조하는 모든 경로와 용도를 정리:

| # | 코드 위치 | 버킷/경로 | 용도 | 방식 |
|---|----------|----------|------|------|
| 1 | `monk_imagen4/backend/server.js` | monk-ai-images/ | AI 생성 이미지 저장 | @google-cloud/storage |
| 2 | `idphoto-kr/public/index.html` | monk-ai-images/ads/ | 광고 배너 이미지 | 직접 URL |
| 3 | `idphoto-kr/result.js` | monk-ai-images/ads/manifest.json | 광고 매니페스트 | fetch |
| 4 | `MONK_kr/photolab/result.js` | monk-ai-images/ads/manifest.json | 광고 매니페스트 (레거시) | fetch |

**추가 조사**:
1. 위 목록의 정확성 검증 + 누락 보완 (grep 전수)
2. signed URL 사용처 파악
3. 공개 URL로 직접 접근하는 에셋 목록
4. 업로드/다운로드 흐름 추적 (어디서 쓰고 어디서 읽는가)

### E. 연결점 맵 (서비스 ↔ 버킷 ↔ 외부)

서비스 간, 서비스 ↔ 버킷 간, 외부 서비스(Cloudflare, Firebase/Firestore) 간 의존 관계를 시각화:

```
[요구하는 형태]
Cloud Run 서비스 ─── 어떤 버킷을 참조하는가
              ├─── 어떤 Firestore 컬렉션을 사용하는가
              ├─── 어떤 외부 API를 호출하는가 (Vertex AI, Gemini 등)
              └─── 어떤 도메인에 매핑되는가

Cloudflare Pages/Workers ─── 어떤 API를 호출하는가
                        └─── 어떤 D1/R2를 사용하는가
```

### F. 레거시 잔재 식별

1. Cloud Run에 존재하지만 트래픽 0인 서비스
2. GCS에 존재하지만 코드에서 참조하지 않는 버킷/경로
3. Container Registry(`gcr.io/monkos/`)에 남아있는 이미지 목록
4. `gen-lang-client-*` 프로젝트의 활성 자원 여부
5. Firebase 프로젝트 (MonkosChat 등) 활성 상태

---

## 산출물

보고서 1건: `REPORT_20260304_막내3_GCP인프라_전수조사.md`

### 보고서 구성

```
## A. GCP 프로젝트 현황
| 프로젝트 | 활성 API | 서비스계정 | 결제상태 |

## B. Cloud Run 서비스 전수
| # | 서비스 | 상태 | 최신리비전 | 도메인 | 30일트래픽 | 가동판정 |

## C. GCS 버킷 전수
| # | 버킷 | 리전 | 용량 | 객체수 | 공개설정 | 가동판정 |

## D. 버킷 디렉토리 구조 (버킷별)

## E. GCS 활용 맥락 (코드 ↔ 버킷 매핑)
| # | 코드위치 | 버킷/경로 | 용도 | 방식 |

## F. 서비스 연결점 맵 (텍스트 다이어그램)

## G. 레거시 잔재 목록
| # | 자원유형 | 이름 | 마지막사용 | 권장조치 |

## H. 종합 소견 + 정리 권장사항
```

---

## 실행 방법

- `gcloud` CLI 사용 (ADC 인증 활용)
- `gsutil` 으로 버킷 조사
- 코드 grep으로 참조 관계 교차 검증
- **읽기 전용 조사** — 수정/삭제 일체 금지

---

## 완료 조건

- [ ] A: 2개 프로젝트 API/IAM 현황 확인
- [ ] B: Cloud Run 전서비스 가동상태 + 미파악 서비스 발굴
- [ ] C: 전 버킷 실존/용량/접근설정 확인 + 미파악 버킷 발굴
- [ ] D: 코드 ↔ 버킷 참조 관계 전수 매핑
- [ ] E: 서비스 연결점 맵 작성
- [ ] F: 레거시 잔재 목록 + 정리 권장
- [ ] 보고서 커밋 (ops/reports/)

## 보고

- 형식: `[시각] M1/막내3 → M1/쌍아`
