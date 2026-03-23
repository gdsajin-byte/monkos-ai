# works/images — 서비스 에셋 이미지 작업대

> 로컬 작업 폴더. 원본 배치 → 리사이즈 → 업로드 → 서빙.
> Git 추적 ❌ (.gitignore 등록). 원본은 GCS/R2에 보존.

---

## 폴더 구조

```
works/images/
├── portal_slide/     ← 포털 갤러리 스트립 Before/After
├── ads/              ← 광고 소재 (SNS, Google Ads 배너)
├── shimmering/       ← 쉬머링 효과 에셋
├── og/               ← og:image 원본 (1200x630)
├── templates/        ← 서비스 UI 템플릿 이미지
└── README.md
```

---

## 에셋 관리 맵 (현시점 2026-03-15)

### 저장소 현황

| 저장소 | 용도 | 용량 | 월 비용 |
|--------|------|------|---------|
| **GCS `monk-ai-images`** | 고객 증명사진 원본+생성본, 블로그 이미지, 광고 | 3.3GB | $0.12 |
| **GCS `monk-project`** | K뷰티 소스(소소), 학습 코퍼스, MUSE 에셋 | 3.4GB | $0.07 |
| **CF R2 `monk-apps`** | Image Gen 프로토타입 (T2I) | 소량 | 무료 |
| **CF Images** | 탈퇴 상태 | — | — |

### 데이터 분류 4계층

| 계층 | 성격 | 저장소 | 예시 |
|------|------|--------|------|
| **L1: 고객 데이터** | 개인정보, 보존정책 필수 | GCS `monk-ai-images` | 증명사진 원본/생성본 |
| **L2: 서비스 에셋** | 공개, CDN 필수 | GCS → R2 전환 예정 | 갤러리 슬라이드, og:image, 쉬머링 |
| **L3: 마케팅/광고** | 로테이션, 빈번 교체 | GCS ads/ → R2 전환 예정 | SNS 광고, Google Ads 배너 |
| **L4: 원본 아카이브** | 콜드, 장기 보존 | GCS Archive/Nearline | K뷰티 소스, 모델 에셋, 학습 코퍼스 |

### 서비스 에셋 경로 (GCS 현행)

```
gs://monk-ai-images/
├── service/idphoto/{kr|jp}/{userId}/    ← L1: 고객 증명사진 (가동 중)
├── blog/{timestamp}_{name}              ← L2: CMS 블로그 이미지 (가동 중)
├── ads/                                 ← L3: 광고 로테이션 6장 (가동 중)
├── assets/portal/slide/                 ← L2: 갤러리 스트립 (신규 예정)
├── assets/portal/og/                    ← L2: og:image (신규 예정)
├── assets/portal/shimmering/            ← L2: 쉬머링 효과 (신규 예정)
└── generated/                           ← AI 생성 이미지
```

### CF 미디어 서비스 요금 비교 (향후 확장 시)

| 서비스 | $5/월 기준 | 무료 티어 | 용도 |
|--------|----------|----------|------|
| **R2** | — | 10GB 저장 + egress 무료 | 이미지/파일 CDN 서빙 |
| **Images** | 10만 장 저장 | 변환 5,000회만 | 자동 리사이즈, variants |
| **Stream** | 1,000분 영상 저장 | Pro 시 100분 | 영상 스트리밍 |

### 이관 로드맵

```
Phase 0 (현재): GCS 경로 분리로 즉시 운용
Phase 1 (볼륨 증가 시): R2 monkos-assets 버킷 + assets.monkos.ai 커스텀 도메인
Phase 2 (영상 서비스 시): CF Stream 추가 ($5/월)
Phase 3 (이미지 만 장+): CF Images 추가 ($5/월) — 자동 리사이즈 활용
```

---

## 작업 흐름

```
1. 원본 배치
   작가님이 works/images/{폴더}/ 에 원본 파일 배치

2. 리사이즈 + 변환
   sips -z {h} {w} input.png --out output.png   (macOS)
   또는 sharp (Node.js 서버사이드)
   WebP 변환: cwebp -q 80 input.png -o output.webp

3. GCS 업로드
   gsutil cp output.webp gs://monk-ai-images/assets/portal/slide/

4. HTML에서 참조
   <img src="https://storage.googleapis.com/monk-ai-images/assets/portal/slide/..." loading="lazy">
```

---

## 이미지 규격

| 용도 | 사이즈 | 포맷 | 비고 |
|------|--------|------|------|
| 갤러리 스트립 | 240x320 (2x) / 120x160 (1x) | WebP | Before/After 쌍 |
| og:image | 1200x630 | PNG/JPG | SNS 미리보기 |
| 광고 배너 | 1080x1080 (인스타) / 1200x628 (FB) | JPG | 플랫폼별 |
| 쉬머링 | 서비스별 상이 | WebP/GIF | 효과 에셋 |

---

> 최종 갱신: 2026-03-15 iMac/쌍아
> 어젠다: #24 에셋 관리 체계
