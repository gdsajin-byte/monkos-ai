---
type: report
date: 2026-03-08
from: iMac/막내33
to: iMac/쌍아
order: ORDER_20260308_iMac쌍아_막내3_프로젝트분기_이미지관리방안
category: architecture
---

# 보고서: 프로젝트 분기 시 이미지 에셋 관리 방안

**[2026-03-08 11:52 KST] iMac/막내33 → iMac/쌍아**

---

## Phase A: 현재 공유 구조 파악

### A-1. 이미지 에셋 교차 참조 맵

#### MONK_kr → monkos_AI 참조

| 참조원 | 참조 대상 | 유형 | 영향도 |
|--------|----------|------|--------|
| `photolab/*.html` (5파일) | `https://monkos.ai/og-image.png` | OG 메타태그 | MEDIUM |
| `photolab/*.html` (5파일) | `https://monkos.ai/monkos-icon.svg` | 로고 아이콘 | MEDIUM |
| `photolab/shared.js` | `idphoto-kr.monkos.ai` | 카카오 공유 URL | LOW |

> **MONK_kr이 monkos_AI의 로컬 이미지 파일을 직접 참조하는 경우: 없음**
> 참조는 전부 **HTTP 공개 URL** 경유 — 레포 분리 후에도 도메인이 살아있으면 정상 작동.

#### monkos_AI → MONK_kr 참조

| 참조원 | 참조 대상 | 유형 | 영향도 |
|--------|----------|------|--------|
| — | — | — | — |

> **monkos_AI가 MONK_kr의 이미지를 참조하는 경우: 없음**

#### GCS 공유 영역 (monk-ai-images/ads/)

| 참조원 | GCS 경로 | 용도 | 접근 모드 |
|--------|---------|------|----------|
| MONK_kr (`photolab/index.html`) | `monk-ai-images/ads/*.jpg` | 히어로/쇼케이스 이미지 | **Read** |
| MONK_kr (`photolab/result.js`) | `monk-ai-images/ads/manifest.json` | 광고 로테이션 | **Read** |
| monkos_AI (`idphoto-kr/public/index.html`) | `monk-ai-images/ads/*.jpg` | 쇼케이스 이미지 | **Read** |
| monkos_AI (`idphoto-kr/public/result.js`) | `monk-ai-images/ads/manifest.json` | 광고 로테이션 | **Read** |
| monkos_AI (서버 사이드) | `monk-ai-images/` | AI 생성 이미지 저장 | **Write** |

> **핵심**: 양쪽 모두 `monk-ai-images/ads/`를 HTTP 공개 URL로 **읽기 전용** 접근.
> 쓰기는 monkos_AI 서버 사이드만 수행. 코드 레벨 의존성 아닌 **런타임 HTTP 호출**.

#### 공통 브랜딩 에셋 중복 현황

| 에셋 | MONK_kr | monkos_AI (idphoto-kr) | monkos_AI (portal) | 동일 파일? |
|------|---------|----------------------|-------------------|-----------|
| favicon-32.png | `MONK_kr/favicon-32.png` | `idphoto-kr/public/favicon-32.png` | `portal/public/favicon-32.png` | 색상 변형 (금색 vs 원본) |
| apple-touch-icon.png | `MONK_kr/apple-touch-icon.png` | `idphoto-kr/public/apple-touch-icon.png` | `portal/public/apple-touch-icon.png` | 확인 필요 |
| monkos-icon.svg | `MONK_kr/monkos-icon.svg` | `idphoto-kr/public/monkos-icon.svg` | `portal/public/monkos-icon.svg` | 동일 추정 |
| og-image.png | 없음 (monkos.ai URL 참조) | `idphoto-kr/public/og-image.png` | 없음 | N/A |

> 브랜딩 에셋은 **이미 각 프로젝트가 자체 보유**. 분리 시 추가 작업 불필요.

---

### A-2. 배포라인별 이미지 서빙 경로

#### MONK_kr (CF Pages)

```
빌드 시 포함되는 이미지:
├── favicon-32.png, apple-touch-icon.png, monkos-icon.svg  (브랜딩)
├── images/g1-g4.jpg, main.jpg                              (루트 갤러리)
├── monk_studio/**/images/*.jpg                              (서비스 포트폴리오)
└── (.gitignore 예외로 git에 포함된 파일만)

런타임 외부 참조:
├── GCS monk-ai-images/ads/                                  (광고/쇼케이스)
├── Unsplash CDN                                             (폴백 이미지)
├── Placehold.co                                             (플레이스홀더)
└── monkos.ai/og-image.png, monkos-icon.svg                  (OG/로고)
```

**이미지 로드 전략**: 로컬 우선 → GCS 보조 → Unsplash/Placehold 폴백
**onerror 패턴**: `this.onerror=null; this.src='fallback_url'` (무한루프 방지)

#### monkos_AI (Cloud Run)

```
Docker 빌드 시 포함 (COPY public/ ./public/):
├── favicon-32.png, apple-touch-icon.png, monkos-icon.svg  (브랜딩)
├── og-image.png                                             (OG 이미지)
└── images/hero.webp                                         (idphoto-kr만)

런타임 외부 참조:
├── GCS monk-ai-images/ads/                                  (광고/쇼케이스)
├── GCS mediapipe-models/                                    (얼굴 감지 AI 모델)
└── GCS monk-ai-images/ (서버 사이드)                         (AI 생성 이미지)
```

**Docker 이미지 내 이미지 에셋**: 최소한 (favicon + og-image + hero.webp ≈ 수백KB)
**동적 콘텐츠**: 전부 GCS에서 런타임 로드

#### 공용 GCS 버킷 맵

| 버킷/경로 | MONK_kr | monkos_AI | 용도 |
|-----------|:-------:|:---------:|------|
| `monk-ai-images/ads/` | Read | Read+Write | 광고/쇼케이스 |
| `monk-ai-images/ads/manifest.json` | Read | Read | 광고 로테이션 매니페스트 |
| `mediapipe-models/` | Read | Read | 얼굴 감지 모델 (Google 공개) |
| `monk-project/assets/` | — | Read | AI 모델/소스 에셋 |
| `monk-project/corpus/` | — | Read | RAG 학습 데이터 |

---

### A-3. Git 추적 현황

#### .gitignore 이미지 규칙

```gitignore
# 크롤링 이미지 (용량 큼)
*.jpg
*.jpeg
*.png

# 예외 (git 추적)
!MONK_kr/images/*.jpg          # 루트 갤러리 5장
!**/favicon-32.png             # 파비콘
!**/apple-touch-icon.png       # 앱 아이콘
!apps/**/original_*.jpg        # 앱 비교용
!apps/**/vertex_*.png          # 앱 비교용
```

> **기본 정책**: 이미지 전부 무시, 최소한만 예외 허용. 건강한 구조.

#### Git 히스토리 이미지 현황

| 항목 | 수치 |
|------|------|
| Git 오브젝트 내 이미지 파일 | 34개 |
| .git/ 전체 크기 | 214MB |
| MONK_kr/ 폴더 크기 | 122MB (images/ 대부분 .gitignore) |
| monkos_AI/ 폴더 크기 | 180MB (대부분 node_modules) |

#### Git에 추적되는 이미지 파일

| 프로젝트 | 파일 | 수량 |
|----------|------|------|
| MONK_kr | favicon-32.png, apple-touch-icon.png, monkos-icon.svg | 3 |
| MONK_kr | images/g1-g4.jpg, main.jpg | 5 |
| MONK_kr | monk_studio/**/images/*.jpg | ~25 |
| MONK_kr | 스크린샷 *.png (3장) | 3 |
| monkos_AI | favicon-32.png, apple-touch-icon.png, monkos-icon.svg, og-image.png | 각 서비스별 |
| monkos_AI | images/hero.webp | 1 |
| apps | favicon.ico, 아이콘 PNG들 | ~7 |

> **비대화 위험**: 낮음. .gitignore가 대용량 이미지를 잘 차단하고 있음.
> 단, `monk_studio/**/images/*.jpg` 약 25개 파일(포트폴리오)이 git에 포함 — 이는 .gitignore 적용 전에 커밋된 것으로 추정. 레포 분리 시 히스토리 정리 기회.

---

## Phase B: 분리 시나리오 분석

### 기존 분석 참조

> `REPORT_20260304_막내4_레포분리_배포라인분석.md` 결론:
> "이미지 에셋은 런타임 HTTP 호출이므로 코드 레벨 의존성 없음. 레포 분리 후 정상 동작 예상."

이를 바탕으로 4개 시나리오를 심층 분석한다.

### 시나리오 1: 완전 독립

| 항목 | 평가 |
|------|------|
| **구조** | 각 레포가 자체 images/ + 자체 GCS 버킷 |
| **장점** | 의존성 제로, 배포라인 완전 격리 |
| **단점** | 브랜딩 에셋(favicon, icon) 변경 시 양쪽 수동 업데이트 |
| **GCS 분리** | `monk-ai-images` → `monk-kr-images` + `monkos-ai-images` 분리 필요 |
| **작업량** | 높음 — GCS 버킷 분리 + manifest 이중화 + IAM 재설정 |
| **헌법 10조** | 적합 — 프록시 없음 |
| **추천도** | ★★☆☆☆ — 과도한 분리. 현재 GCS 공유는 프록시가 아님 |

### 시나리오 2: GCS 공용 버킷

| 항목 | 평가 |
|------|------|
| **구조** | 공통 에셋을 `monk-project/assets/shared/`에 배치, 양쪽 URL 참조 |
| **장점** | 단일 소스, 변경 시 양쪽 자동 반영 |
| **단점** | GCS 장애 시 양쪽 동시 영향 |
| **헌법 10조 검토** | **적합** — GCS는 독립적 정적 스토리지이지 배포라인을 프록시로 엮는 것이 아님. 양쪽이 각각 독립적으로 HTTP GET하는 구조. CF Pages와 Cloud Run의 배포라인은 전혀 연결되지 않음 |
| **작업량** | 낮음 — 현행 구조와 거의 동일 |
| **추천도** | ★★★★☆ — 현행 유지에 가까움 |

### 시나리오 3: npm/git 공유 패키지

| 항목 | 평가 |
|------|------|
| **구조** | `monkos-assets` npm 패키지로 공통 에셋 분리 |
| **장점** | 버전 관리, 변경 이력 추적 |
| **단점** | 이미지를 npm으로 관리하는 것이 부적절. 빌드 복잡도 증가 |
| **헌법 10조** | 적합 — 빌드 타임 의존성이지 런타임 프록시 아님 |
| **작업량** | 중간 — 패키지 생성 + CI/CD 연동 |
| **추천도** | ★☆☆☆☆ — 과도한 엔지니어링. 이미지 6개를 위해 npm 패키지는 불합리 |

### 시나리오 4: 혼합 (현행 패턴 진화) — **추천**

| 항목 | 평가 |
|------|------|
| **구조** | 브랜딩 → 각 레포 자체 보유 / 광고·갤러리 → GCS manifest / 모델·배경 → GCS assets |
| **장점** | 현행 최소 변경, 이미 검증된 패턴, 배포라인 독립성 유지 |
| **단점** | 규칙 명문화 필요 (본 보고서가 그 역할) |
| **헌법 10조** | **완전 적합** — 각 프로젝트가 자체 브랜딩을 보유하고, GCS는 공용 CDN 역할. 배포라인 간 프록시 없음 |
| **법률 5장** | **적합** — CF Pages는 로컬 images/ + GCS Read, Cloud Run은 public/ + GCS Read/Write. 배포 독립 |
| **작업량** | 최소 — 규칙 명문화 + 분리 시 photolab OG 이미지 경로 5건 수정 |
| **추천도** | ★★★★★ |

### 시나리오 비교 매트릭스

| 기준 | S1 완전독립 | S2 GCS공용 | S3 npm패키지 | **S4 혼합** |
|------|:----------:|:---------:|:-----------:|:----------:|
| 작업량 | 높음 | 낮음 | 중간 | **최소** |
| 배포라인 독립 | 완전 | 독립 | 독립 | **독립** |
| 브랜드 일관성 | 수동 | 자동 | 버전관리 | **규칙기반** |
| 헌법 10조 | 적합 | 적합 | 적합 | **적합** |
| 현행 변경폭 | 대규모 | 소규모 | 중규모 | **최소** |
| 유지보수 | 중복관리 | GCS의존 | npm복잡 | **명확규칙** |

---

## Phase C: 각 프로젝트 images/ 폴더 역할 범위

### 에셋 배치 기준표

| 에셋 유형 | 로컬 images/ | GCS | 근거 |
|-----------|:-----------:|:---:|------|
| **파비콘/아이콘** | ✓ | ✗ | 빌드 타임 필수. 각 서비스 독립 보유. CF Pages/Docker에 포함되어야 함. GCS 의존 시 첫 로드 지연 |
| **히어로 이미지** | ✓ | ✗ | LCP(Largest Contentful Paint) 직결. 로컬 서빙이 성능 최적. MONK_kr은 main.jpg, monkos_AI는 hero.webp 각각 보유 |
| **갤러리/쇼케이스** | ✗ | ✓ | 동적 콘텐츠. GCS manifest.json 기반 로테이션. 양쪽 공유 필요 (monk-ai-images/ads/) |
| **광고 로테이션** | ✗ | ✓ | manifest.json으로 중앙 관리. 에셋 추가/삭제가 잦음. GCS가 적합 |
| **모델 포트폴리오** | ✗ | ✓ | 대용량. GCS `assets/mina/models/`에서 서빙. git 추적 부적절 |
| **배경 이미지** | ✗ | ✓ | 대용량. GCS `assets/soso/sources/backgrounds/`. AI 엔진 서버에서 접근 |
| **OG 이미지** | ✓ | ✗ | 크롤러 접근 보장 필수. 로컬 public/에 배치. 외부 URL 의존 시 크롤링 실패 위험 |

### 프로젝트별 로컬 images/ 보유 범위

#### MONK_kr (CF Pages)

```
MONK_kr/
├── favicon-32.png              ← 브랜딩 (필수)
├── apple-touch-icon.png        ← 브랜딩 (필수)
├── monkos-icon.svg             ← 로고 (필수)
├── images/
│   ├── main.jpg                ← 히어로 (필수)
│   └── g1-g4.jpg               ← 루트 갤러리 (필수, LCP)
└── monk_studio/**/images/
    ├── main.jpg                ← 서비스 히어로 (필수)
    ├── port1-4.jpg             ← 포트폴리오 (필수, 서비스 신뢰도)
    ├── hero.jpg, desc.jpg      ← 서비스 설명 (필수)
    └── card1-3.jpg             ← 카드 이미지 (필수)
```

> MONK_kr은 **오프라인 스튜디오 포트폴리오**가 핵심 콘텐츠이므로 로컬 보유 비중이 높다.
> GCS 의존: 광고/쇼케이스(photolab)만.

#### monkos_AI (Cloud Run)

```
idphoto-kr/public/
├── favicon-32.png              ← 브랜딩 (필수)
├── apple-touch-icon.png        ← 브랜딩 (필수)
├── monkos-icon.svg             ← 로고 (필수)
├── og-image.png                ← OG 이미지 (필수)
└── images/
    └── hero.webp               ← 히어로 (필수)

portal/public/
├── favicon-32.png              ← 브랜딩 (필수)
├── apple-touch-icon.png        ← 브랜딩 (필수)
└── monkos-icon.svg             ← 로고 (필수)
```

> monkos_AI는 **AI 서비스**이므로 동적 콘텐츠가 주력. 로컬 이미지는 최소한.
> 갤러리/광고/모델/배경 = 전부 GCS에서 런타임 로드.

### 분리 시 조치 사항

| 조치 | 대상 | 설명 |
|------|------|------|
| **OG 이미지 자체화** | MONK_kr photolab (5파일) | `monkos.ai/og-image.png` → 자체 `og-image.png` 배치. 크롤러 안정성 확보 |
| **로고 자체화** | MONK_kr photolab (5파일) | `monkos.ai/monkos-icon.svg` → 로컬 경로로 변경 (이미 `MONK_kr/monkos-icon.svg` 존재) |
| **GCS URL 유지** | 양쪽 모두 | `monk-ai-images/ads/` 참조는 HTTP 공개 URL이므로 변경 불필요 |
| **manifest.json 유지** | 양쪽 모두 | 광고 매니페스트는 GCS 중앙 관리 유지 |
| **Git 히스토리 정리** | MONK_kr | monk_studio 포트폴리오 이미지 25장이 git 히스토리에 존재. 분리 시 `git filter-branch` 또는 `BFG` 로 정리 기회 |

---

## 결론 및 추천

### 추천 시나리오: **4번 혼합 (현행 패턴 진화)**

**근거:**

1. **현행 구조가 이미 건강함** — 양쪽 프로젝트 간 로컬 이미지 교차 참조 **0건**. 각각 자체 포함(self-contained) 구조.

2. **GCS 공유는 프록시가 아님** — 헌법 10조 관점에서, GCS `monk-ai-images/ads/`는 양쪽이 독립적으로 HTTP GET하는 공용 CDN이지, 배포라인을 엮는 프록시가 아니다. CF Pages 배포와 Cloud Run 배포는 완전히 분리.

3. **분리 시 작업량 최소** — OG 이미지/로고 경로 수정 10건 + 규칙 명문화가 전부.

4. **기존 보고서 결론과 일치** — `REPORT_20260304_막내4`: "이미지 에셋은 런타임 HTTP 호출이므로 코드 레벨 의존성 없음."

### 요약 규칙 (명문화 제안)

```
[이미지 에셋 배치 원칙]

1. 브랜딩 (favicon, icon, logo, OG image)
   → 각 프로젝트 자체 보유. GCS 참조 금지.

2. 히어로/서비스 포트폴리오 (main.jpg, port*.jpg, hero.webp)
   → 각 프로젝트 로컬 images/. LCP 최적화.

3. 광고/쇼케이스 (동적 로테이션)
   → GCS monk-ai-images/ads/ + manifest.json. 중앙 관리.

4. AI 모델/배경/소스 (대용량)
   → GCS monk-project/assets/. git 추적 금지.

5. 외부 참조 금지
   → 프로젝트 A가 프로젝트 B의 로컬 에셋을 직접 참조하지 않는다.
   → GCS 공개 URL 참조는 허용 (런타임 HTTP, 배포라인 독립).
```

---

*작성: 2026-03-08 iMac/막내33*
*참조: ORDER_20260308_iMac쌍아_막내3, GCS_BUCKET_STRUCTURE.md, REPORT_20260304_막내4*
