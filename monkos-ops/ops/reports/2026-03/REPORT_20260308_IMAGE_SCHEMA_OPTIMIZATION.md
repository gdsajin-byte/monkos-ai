---
type: report
date: 2026-03-08
from: 막내2
to: 쌍아
status: completed
---

# 이미지 에셋 스키마 설계 + 최적화 보고서

**[2026-03-08] iMac/막내2 → iMac/쌍아**

---

## Phase A: 현재 이미지 에셋 전수 파악

### A-1. 전체 통계

| 구분 | 파일 수 | 용량 | 비고 |
|------|---------|------|------|
| **MONK_kr/** (로컬) | 56 | 117.83 MB | 본진 데스크톱 |
| **monkos_AI/** (로컬) | 14 | 1.30 MB | 모바일 AI |
| **기타** (apps/docs/ops) | 15 | 50.48 MB | 프로토/R&D/운영 |
| **로컬 합계** | **85** | **169.61 MB** | |
| **GCS** (monk-ai-images/ads/) | ~6 (FIFO) | 가변 | 광고 로테이션 |
| **외부 참조** (Unsplash 등) | 20 URL | N/A | 프로토타입 이미지 |

### A-2. 포맷별 분포

| 포맷 | 파일 수 | 비율 | 주 용도 |
|------|---------|------|---------|
| JPG/JPEG | 68 | 80% | 포트폴리오, 갤러리, 히어로, 스캔 |
| PNG | 15 | 18% | 파비콘, OG 이미지, 앱 아이콘, 스크린샷 |
| SVG | 5 | — | 로고 (monkos-icon.svg 5곳 중복) |
| WebP | 1 | 1% | idphoto-kr 히어로 (유일) |
| ICO | 1 | 1% | 레거시 파비콘 (MonkosChat) |

### A-3. 로컬 이미지 상세 — MONK_kr/

#### 루트 브랜딩
| 파일 | 포맷 | 크기 | 용도 |
|------|------|------|------|
| apple-touch-icon.png | PNG | 10.5 KB | Apple 터치 아이콘 |
| favicon-32.png | PNG | 1.4 KB | 파비콘 32x32 |
| monkos-icon.svg | SVG | 2.1 KB | 로고 (벡터) |

#### 메인 (MONK_kr/images/)
| 파일 | 크기 | 용도 |
|------|------|------|
| main.jpg | 974 KB | 메인 히어로 |
| g1.jpg ~ g4.jpg | 129~556 KB | 갤러리 (4장) |

#### 서비스 상세 (monk_studio/)
| 하위 경로 | 파일 수 | 용량 범위 | 특이사항 |
|-----------|---------|----------|----------|
| monk_studio/images/ | 7 | 294 KB~10 MB | service_family.jpg **10 MB** (과대) |
| monk_studio/profile/images/ | 9 | 197 KB~986 KB | 정상 범위 |
| monk_studio/family/images/ | 11 | 1.8~16.6 MB | **port4.jpg 16.6 MB** (최대 파일) |
| monk_studio/id_photo/images/ | 10 | 327 KB~3.4 MB | 스크린샷 3개 혼재 |
| id_photo/standard/images/ | 5 | 507 KB~1.5 MB | 정상 |
| id_photo/premium/images/ | 5 | 371 KB~847 KB | 정상 |
| id_photo/deluxe/images/ | 5 | 374 KB~947 KB | 정상 |

> **경고**: family/ 폴더가 전체 로컬 용량의 ~50%를 차지 (약 58 MB). port4.jpg 단일 파일 16.6 MB.

#### 한글 파일명 (정비 대상)
- `MONK_kr/monk_studio/family/images/블루녀-(3 of 9).jpg` — 공백+괄호 포함

### A-4. 로컬 이미지 상세 — monkos_AI/

| 파일 경로 | 포맷 | 크기 | 용도 |
|----------|------|------|------|
| Icon/monkos-icon.png | PNG | 19.6 KB | 앱 아이콘 |
| assets/line_richmenu.png | PNG | 417.6 KB | LINE 리치 메뉴 |
| idphoto-jp/public/monkos-icon.svg | SVG | 2.1 KB | 로고 |
| idphoto-jp/public/og-image.png | PNG | 79.8 KB | OG 이미지 |
| idphoto-jp/qr_idphoto-jp.png | PNG | 0.4 KB | QR 코드 |
| idphoto-jp/qr_idphoto.png | PNG | 0.7 KB | QR 코드 |
| idphoto-kr/public/apple-touch-icon.png | PNG | 10.5 KB | Apple 터치 아이콘 |
| idphoto-kr/public/favicon-32.png | PNG | 1.4 KB | 파비콘 |
| **idphoto-kr/public/images/hero.webp** | **WebP** | **708.5 KB** | **히어로 (유일 WebP)** |
| idphoto-kr/public/monkos-icon.svg | SVG | 2.1 KB | 로고 |
| idphoto-kr/public/og-image.png | PNG | 65.7 KB | OG 이미지 |
| portal/public/apple-touch-icon.png | PNG | 10.5 KB | Apple 터치 아이콘 |
| portal/public/favicon-32.png | PNG | 1.4 KB | 파비콘 |
| portal/public/monkos-icon.svg | SVG | 2.1 KB | 로고 |

### A-5. 기타 위치

| 위치 | 파일 수 | 용도 | 비고 |
|------|---------|------|------|
| apps/MonkosChat/public/ | 1 | favicon.ico | 레거시 |
| apps/monk-cam/demo/ | 2 | PWA 아이콘 | 프로토타입 |
| monkos-ops/ops/assets/logo/ | 1 | monkos-icon.svg (정본) | 운영 |
| docs/rnd_2026/동의서/ | 8 | R&D 동의서 스캔 | 총 35.7 MB |

### A-6. 외부 이미지 참조

#### Unsplash (20개 URL)

| 참조 파일 | URL 수 | 로딩 방식 | lazy | 용도 |
|-----------|--------|----------|------|------|
| MONK_kr/index.html | 4 | `<img src>` | ❌ | 네비게이션 카드 |
| monk_studio/monk_studio.html | 8 | `onerror` 폴백 | ❌ | 로컬 실패 시 대체 |
| ai_lab/ai_lab.html | 3 | `<img src>` | ❌ | 서비스 카드 |
| id_photo/id_photo.html | 4 | `onerror` 폴백 | ❌ | 포트폴리오 폴백 |
| portal/public/index.html | 3 | `<img src>` | ✅ | 포털 카드 |

> Unsplash URL에 `?w=800&q=80` 같은 크기/품질 파라미터 미사용 — 원본 해상도 전송 중.

#### GCS (monk-ai-images/ads/) — 41개 참조

| 타입 | 참조 수 | 용도 |
|------|---------|------|
| 갤러리 이미지 (하드코딩 URL) | ~10 | 샘플 결과 쇼케이스 |
| manifest.json (동적 fetch) | 3 | 광고 로테이션 메타데이터 |
| MediaPipe 모델 (mediapipe-models) | ~20 | 얼굴 인식 ML (이미지 아님) |
| Upload API (서버→GCS) | 3 | 사용자 이미지 업로드 |

#### monkos.ai 도메인 (130개 참조)

| 리소스 | 참조 수 | 용도 |
|--------|---------|------|
| og-image.png | ~40 | SNS 공유 이미지 |
| favicon-32.png | ~40 | 파비콘 |
| apple-touch-icon.png | ~25 | Apple 아이콘 |
| monkos-icon.svg | ~25 | 로고 |

### A-7. 최적화 적용 현황

| 기법 | 적용 수 | 적용률 | 적용 위치 |
|------|---------|--------|----------|
| `loading="lazy"` | 13 | 7% | GCS 갤러리 + portal 카드 |
| `decoding="async"` | 11 | 6% | GCS 갤러리만 |
| `srcset` / `sizes` | 0 | 0% | 미사용 |
| `<picture>` + `<source>` | 0 | 0% | 미사용 |
| `<link rel="preload">` | 0 | 0% | 미사용 |
| `onerror` 폴백 | 36 | — | 로컬→Unsplash 폴백 전략 |

### A-8. GCS 광고 시스템 현황

#### Manifest v1 스키마
```json
{
  "images": ["https://storage.googleapis.com/monk-ai-images/ads/{filename}"],
  "rotate": 6000,
  "transition": 800,
  "updated": "2026-03-07T12:30:45Z",
  "count": 2
}
```

#### 업로드 파이프라인
| 도구 | 경로 | 기능 |
|------|------|------|
| ads_upload.sh | monkos-ops/scripts/ | launchd 감시, 타임스탬프 정규화, FIFO 6장 |
| ads_sync.py | monkos-ops/scripts/ | Python 데몬(--watch), .uploaded 마커 |

#### 프론트엔드 로테이션
- `result.js` (photolab + idphoto-kr) → manifest fetch → 6초 간격 로테이션 → 800ms 페이드
- Cache-Control: `public, max-age=60`
- 에러 시: 빈 배열 폴백 (광고 영역 숨김)

---

## Phase B: 카테고리 스키마 설계

### B-1. 카테고리 정의 (확정)

| 카테고리 | 코드 | 설명 | 변경 빈도 | 저장소 |
|----------|------|------|----------|--------|
| **brand** | `brand/` | 파비콘, 아이콘, OG 이미지, 로고 | 매우 낮음 | Git |
| **gallery** | `gallery/` | 페이지별 쇼케이스, 포트폴리오, 카드 | 중간 | Git |
| **ad** | `ad/` | 시머링 로테이션 광고, 배너 | 높음 | GCS |
| **model** | `model/` | AI 모델 포트폴리오, 룩북 | 낮음 | Git/GCS |
| **background** | `bg/` | 촬영/합성용 배경 | 낮음 | GCS |
| **user** | — | 사용자 생성 이미지 (증명사진 결과) | N/A | 미저장 |

### B-2. 디렉토리 구조 설계

#### MONK_kr/ (monk.kr 본진)
```
MONK_kr/
├── images/
│   ├── brand/                    ← 브랜딩 에셋
│   │   ├── monkos-icon.svg
│   │   ├── favicon-32.png
│   │   ├── apple-touch-icon.png
│   │   └── og-image.png          ← (신규 생성 권장)
│   ├── gallery/                  ← 페이지 쇼케이스
│   │   ├── main-hero.jpg         ← 현 images/main.jpg
│   │   ├── card-01.jpg           ← 현 g1.jpg
│   │   ├── card-02.jpg
│   │   ├── card-03.jpg
│   │   └── card-04.jpg
│   └── README.md
├── monk_studio/
│   ├── images/                   ← 서비스 프로모
│   │   ├── gallery/
│   │   │   ├── port-01.jpg
│   │   │   ├── port-02.jpg
│   │   │   └── port-03.jpg
│   │   └── promo/
│   │       ├── service-family.jpg
│   │       ├── service-id.jpg
│   │       └── service-profile.jpg
│   ├── profile/images/gallery/   ← 프로필 포트폴리오
│   ├── family/images/gallery/    ← 패밀리 포트폴리오
│   ├── id_photo/images/gallery/
│   │   ├── standard/
│   │   ├── premium/
│   │   └── deluxe/
│   └── ...
```

#### monkos_AI/ (monkos.ai 모바일)
```
monkos_AI/
├── idphoto-kr/public/
│   ├── images/
│   │   ├── brand/               ← 파비콘, 아이콘, OG
│   │   │   ├── monkos-icon.svg
│   │   │   ├── favicon-32.png
│   │   │   ├── apple-touch-icon.png
│   │   │   └── og-image.png
│   │   └── gallery/
│   │       └── hero.webp
│   └── ...
├── idphoto-jp/public/images/
│   ├── brand/
│   └── gallery/
├── portal/public/images/
│   ├── brand/
│   └── gallery/
└── ...
```

#### GCS (monk-ai-images)
```
gs://monk-ai-images/
├── ads/                          ← 광고 (현행 유지)
│   ├── manifest.json
│   └── {timestamp}_{name}.{ext}
├── model/                        ← (향후) 모델 포트폴리오
├── bg/                           ← (향후) 합성 배경
└── manifest.json                 ← (향후) 루트 인덱스
```

### B-3. 파일 네이밍 규칙

#### 로컬 이미지 (Git 관리)

| 카테고리 | 패턴 | 예시 |
|----------|------|------|
| brand | `{asset-name}.{ext}` | `monkos-icon.svg`, `favicon-32.png` |
| gallery | `{role}-{nn}.{ext}` | `hero-01.webp`, `card-01.jpg`, `port-01.jpg` |
| promo | `service-{name}.{ext}` | `service-family.jpg` |

**표기 규칙**:
- 소문자 + 하이픈 구분 (kebab-case)
- 순번: 2자리 zero-padded (`01`, `02`, ...)
- 한글 파일명 금지 (URL 인코딩 이슈). 기존 한글 파일은 정비 시 영문 전환
- 공백, 괄호 금지

#### GCS 이미지

| 카테고리 | 패턴 | 예시 |
|----------|------|------|
| ad | `{YYYYMMDD}_{HHMMSS}_{name}.{ext}` | `20260308_152330_spring.jpg` |
| model | `{model-id}_{nn}.{ext}` | `mina-lookbook_01.webp` |
| bg | `{scene}_{variant}.{ext}` | `studio-white_01.webp` |

### B-4. Manifest v2 스키마 설계

현행 v1은 ads/ 전용의 평탄 구조. v2는 카테고리 메타데이터를 포함한 확장 스키마.

```json
{
  "version": 2,
  "updated": "2026-03-08T12:00:00Z",
  "categories": {
    "ad": {
      "bucket": "gs://monk-ai-images/ads/",
      "baseUrl": "https://storage.googleapis.com/monk-ai-images/ads/",
      "policy": { "fifo": 6, "maxSizeKB": 500 },
      "display": { "rotate": 6000, "transition": 800 },
      "images": [
        {
          "url": "https://storage.googleapis.com/monk-ai-images/ads/20260308_152330_spring.jpg",
          "filename": "20260308_152330_spring.jpg",
          "format": "jpg",
          "sizeKB": 245,
          "alt": "봄 프로모션 배너",
          "uploaded": "2026-03-08T15:23:30Z"
        }
      ]
    },
    "model": {
      "bucket": "gs://monk-ai-images/model/",
      "baseUrl": "https://storage.googleapis.com/monk-ai-images/model/",
      "policy": { "fifo": null, "maxSizeKB": 800 },
      "images": []
    },
    "bg": {
      "bucket": "gs://monk-ai-images/bg/",
      "baseUrl": "https://storage.googleapis.com/monk-ai-images/bg/",
      "policy": { "fifo": null, "maxSizeKB": 500 },
      "images": []
    }
  }
}
```

**v1 → v2 하위 호환**:
- v2 전환 시 기존 `manifest.json`(`ads/`)은 그대로 유지
- 루트 `manifest.json`을 신규 생성하여 v2 스키마 적용
- 프론트엔드는 `ads/manifest.json` 직접 fetch 유지 (변경 불필요)
- v2 루트 manifest는 관리/감사 용도 (프론트엔드 필수 아님)

### B-5. 현재 이미지 → 카테고리 매핑

| 현재 파일 | 카테고리 | 비고 |
|-----------|----------|------|
| monkos-icon.svg (5곳) | brand | 정본: monkos-ops/ops/assets/logo/ |
| favicon-32.png (3곳) | brand | 서비스별 독립 |
| apple-touch-icon.png (3곳) | brand | 서비스별 독립 |
| og-image.png (2곳) | brand | 서비스별 독립 |
| main.jpg, hero.jpg, hero.webp | gallery | 히어로 이미지 |
| g1~g4.jpg | gallery | 메인 갤러리 카드 |
| port1~port4.jpg (각 페이지) | gallery | 포트폴리오 |
| card1~card3.jpg | gallery | 서비스 카드 |
| service_*.jpg | gallery (promo) | 서비스 프로모션 |
| GCS ads/*.jpg | ad | 광고 로테이션 |
| Unsplash URL | gallery (임시) | 자체 이미지로 교체 권장 |
| 스크린샷 *.png | — | 정리 대상 (id_photo/images/에 혼재) |
| docs/ 동의서 IMG_*.JPG | — | R&D 문서 (스키마 관할 밖) |

---

## Phase C: 포맷 + 최적화 방안

### C-1. 포맷 전략

| 포맷 | 압축률 | 브라우저 지원 | 권장 용도 | MONK 적용 |
|------|--------|-------------|----------|-----------|
| **WebP** | JPG 대비 25~34% 절감 | 98%+ (IE 제외) | 히어로, 갤러리, 포트폴리오 전체 | **주력 포맷 전환 권장** |
| **JPEG** | 기준 | 100% | WebP 폴백, 레거시 호환 | 폴백용 유지 |
| **AVIF** | WebP 대비 20% 추가 절감 | 93% (Safari 16+) | 대용량 히어로 (선택적) | 중기 도입 검토 |
| **SVG** | 벡터 (초경량) | 100% | 로고, 아이콘 | 현행 유지 (적정) |
| **PNG** | 무손실 | 100% | 투명 배경, 파비콘, OG | 현행 유지 (적정) |

#### 예상 용량 절감 (WebP 전환 시)

| 대상 | 현재 용량 | WebP 예상 | 절감 |
|------|----------|----------|------|
| MONK_kr/monk_studio/family/ | 58 MB | ~38 MB | ~20 MB (34%) |
| MONK_kr 전체 JPG (68파일) | ~113 MB | ~75 MB | ~38 MB (34%) |
| 프로젝트 전체 | 169.6 MB | ~115 MB | ~54 MB (32%) |

### C-2. 최적화 기법 평가

#### 1. `<picture>` + `<source>` (WebP 우선, JPG 폴백)

```html
<picture>
  <source srcset="hero.webp" type="image/webp">
  <source srcset="hero.jpg" type="image/jpeg">
  <img src="hero.jpg" alt="..." loading="lazy" decoding="async">
</picture>
```

| 항목 | 평가 |
|------|------|
| 적용 대상 | 갤러리, 히어로, 포트폴리오 전체 |
| 기대 효과 | 25~34% 용량 절감 + 100% 브라우저 호환 |
| 구현 복잡도 | **중** — HTML 수정 필요, 이미지 2벌 관리 |
| 우선순위 | **P1 — 핵심 권장** |

#### 2. `srcset` + `sizes` (반응형 이미지)

```html
<img srcset="hero-480.webp 480w,
             hero-800.webp 800w,
             hero-1600.webp 1600w"
     sizes="(max-width: 768px) 100vw, 800px"
     src="hero-800.webp" alt="...">
```

| 항목 | 평가 |
|------|------|
| 적용 대상 | 히어로, 갤러리 카드 |
| 기대 효과 | 모바일에서 50~70% 추가 절감 |
| 구현 복잡도 | **높음** — 리사이즈 3벌 생성 + HTML 수정 |
| 우선순위 | **P2 — 트래픽 증가 후 도입** |

#### 리사이징 기준

| 타겟 | 너비 | 대상 | 비고 |
|------|------|------|------|
| 모바일 1x | 480px | 카드, 갤러리 | 스마트폰 |
| 데스크톱 1x | 800px | 일반 표시 | 기본값 |
| 레티나 2x | 1600px | 히어로, 풀스크린 | HiDPI |

#### 3. `loading="lazy"` + `decoding="async"`

| 항목 | 평가 |
|------|------|
| 적용 대상 | ATF(Above-The-Fold) **제외** 전 이미지 |
| 기대 효과 | 초기 로딩 시간 30~50% 개선 |
| 구현 복잡도 | **낮음** — 속성 추가만 |
| 우선순위 | **P0 — 즉시 적용** |

**현재 미적용 목록** (즉시 조치 대상):

| 파일 | 미적용 이미지 수 |
|------|-----------------|
| MONK_kr/index.html | 4 (Unsplash 카드) |
| monk_studio/monk_studio.html | 8 (폴백 포함) |
| ai_lab/ai_lab.html | 3 (서비스 카드) |
| id_photo/id_photo.html | 4 (포트폴리오) |

#### 4. `<link rel="preload">` (히어로/ATF 이미지)

```html
<link rel="preload" as="image" href="images/gallery/hero-01.webp" type="image/webp">
```

| 항목 | 평가 |
|------|------|
| 적용 대상 | 각 페이지의 히어로 이미지 (1장씩) |
| 기대 효과 | LCP(Largest Contentful Paint) 200~500ms 개선 |
| 구현 복잡도 | **낮음** — `<head>`에 1줄 추가 |
| 우선순위 | **P1 — WebP 전환과 동시 적용** |

대상 히어로 목록:
- MONK_kr: `images/main.jpg` (974 KB)
- monk_studio/profile: `hero.jpg` (986 KB)
- monk_studio/family: `hero.jpg` (1.85 MB)
- idphoto-kr: `hero.webp` (709 KB)

#### 5. Cache-Control 전략

| 에셋 타입 | 권장 헤더 | 근거 |
|-----------|----------|------|
| brand (로고/파비콘) | `public, max-age=31536000, immutable` | 변경 시 URL 버전닝 |
| gallery (포트폴리오) | `public, max-age=86400` | 1일 캐시 |
| ad (광고) | `public, max-age=60` | 현행 유지 (빠른 갱신) |
| OG 이미지 | `public, max-age=604800` | 1주 캐시 |

**CF Pages**: `_headers` 파일로 경로별 설정 가능
**Cloud Run**: 응답 헤더에서 설정

### C-3. 변환 자동화 방안

#### 빌드타임 WebP 변환

```bash
# cwebp (Google 공식 도구)
cwebp -q 80 input.jpg -o output.webp

# 일괄 변환 스크립트 (예시 구조)
for img in MONK_kr/**/images/**/*.jpg; do
  cwebp -q 80 "$img" -o "${img%.jpg}.webp"
done
```

| 도구 | 설치 | 품질 | 속도 | 권장 |
|------|------|------|------|------|
| **cwebp** | `brew install webp` | 우수 | 빠름 | **권장 (Google 공식)** |
| squoosh-cli | npm | 우수 | 보통 | 대안 |
| sharp (Node.js) | npm | 우수 | 빠름 | 서버 사이드 |

#### ads_upload.sh WebP 통합

현재 `ads_upload.sh`는 jpg/png/webp를 그대로 업로드.
WebP 자동 변환 통합 가능:

```
변환 전: ~/MONKOS_ADS/spring.jpg → GCS에 spring.jpg 업로드
변환 후: ~/MONKOS_ADS/spring.jpg → cwebp 변환 → GCS에 spring.webp 업로드
```

**구현**: ads_upload.sh 내 `gcloud storage cp` 전에 `cwebp` 호출 1줄 추가
**영향**: manifest.json의 URL 확장자 변경 → 프론트엔드 호환 (img 태그는 WebP 지원)

### C-4. 긴급 최적화 대상 (family/ 폴더)

family/ 폴더는 총 58 MB로 프로젝트 이미지 용량의 34%를 차지.

| 파일 | 현재 크기 | 권장 조치 |
|------|----------|----------|
| port4.jpg | 16.6 MB | 리사이즈 (1600px) + WebP → ~1.5 MB 예상 |
| card3.jpg | 10.4 MB | 리사이즈 + WebP → ~1 MB 예상 |
| service_family.jpg | 10 MB | 리사이즈 + WebP → ~1 MB 예상 |
| port2.jpg | 9.1 MB | 리사이즈 + WebP → ~0.9 MB 예상 |
| card1.jpg | 6.9 MB | 리사이즈 + WebP → ~0.7 MB 예상 |

> 5개 파일만 최적화해도 **약 50 MB 절감** 가능 (53 MB → ~5 MB).

---

## 종합 권고

### 실행 로드맵

| 단계 | 작업 | 우선순위 | 복잡도 | 효과 |
|------|------|----------|--------|------|
| **1** | lazy/async 전체 적용 (19개 누락 img 태그) | P0 | 낮음 | 초기 로딩 30~50% 개선 |
| **2** | family/ 대용량 5개 파일 리사이즈+WebP | P0 | 낮음 | 50 MB 절감 |
| **3** | 전체 JPG → WebP 변환 + `<picture>` 폴백 | P1 | 중간 | 38 MB 추가 절감 |
| **4** | 히어로 이미지 preload 적용 | P1 | 낮음 | LCP 200~500ms 개선 |
| **5** | 디렉토리 구조 재편 (B-2 스키마 적용) | P2 | 중간 | 관리 효율 |
| **6** | srcset 반응형 이미지 도입 | P2 | 높음 | 모바일 50~70% 절감 |
| **7** | ads_upload.sh WebP 자동 변환 통합 | P2 | 낮음 | 광고 용량 절감 |
| **8** | Cache-Control 헤더 최적화 | P2 | 낮음 | 반복 방문 속도 |
| **9** | Unsplash → 자체 이미지 교체 | P3 | 중간 | 외부 의존성 제거 |
| **10** | AVIF 차세대 포맷 도입 | P3 | 중간 | 추가 20% 절감 |
| **11** | Manifest v2 루트 인덱스 도입 | P3 | 중간 | 멀티 카테고리 관리 |

### 주요 발견 요약

1. **WebP 사용률 1%** — 전체 85개 중 1개만 WebP. 전환 시 ~54 MB 절감 가능
2. **family/ 폴더 과대** — 5개 파일이 53 MB (전체 31%). 리사이즈 필수
3. **lazy loading 7%** — 19개 img 태그에 즉시 적용 가능
4. **srcset/picture 0%** — 반응형 이미지 메커니즘 부재
5. **monkos-icon.svg 5중 복사** — 정본(monkos-ops/) 외 4곳은 배포 복사본으로 관리
6. **스크린샷 혼재** — id_photo/images/에 스크린샷 3개 (분리 정리 필요)
7. **Unsplash 외부 의존** — 20개 URL이 외부 CDN에 의존 (자체 대체 권장)

---

*본 보고서는 코드 수정 없이 조사 및 설계만 수행한 것입니다. 실행은 작가님 검토 후 별도 지시서로 진행됩니다.*
