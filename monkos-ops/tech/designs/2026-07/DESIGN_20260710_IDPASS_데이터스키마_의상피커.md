---
type: design
date: 2026-07-10
device: iMac
agent: 쌍아
portfolio: PF_SPECS
status: 초안
---

# IDPASS 데이터 스키마 + 의상 피커 + 보관 정책 설계

**[2026-07-10 18:11 KST]** iMac/쌍아 → 작가님

> 입력물: PROPOSAL_20260710_민아_IDPASS통합설계 + PROPOSAL_20260710_민아_T1의상피커_확정스펙
> 기존 코드: idphoto-kr/gcs-save.js, portal/lib/cms/idphoto-review.js

---

## 0. 상위 원칙 — 개인 데이터는 휘발, 스타일 메타는 자산

> "서버는 다녀오되, 누구도 저장하지 않는다." — 7/10 민아·작가님 세션에서 3회 등장한 아키텍처 원칙.

본 설계의 모든 경로·스키마·보관 정책은 아래 분리를 전제한다:

| 구분 | 성격 | 보관 | 예시 |
|------|------|------|------|
| **개인 데이터** | 얼굴 원본, 생성 결과물, 업로드 의상 | **휘발** (비가입 24h, 가입 기간제, T2만 장기) | GCS `service/idpass/{userId}/` |
| **스타일 메타** | 의상 태그, 선택 이력, 카테고리 인덱스 | **자산** (영구 축적, 추천·커머스 원료) | Firestore `attire_presets/`, 선택 로그 |

- 무보존 파이프라인: 비가입 T0는 전송→합성→반환→TTL 삭제. 코드로 증명 가능해야 "저장하지 않습니다"를 전면 카피로 걸 수 있다.
- 앱 확장 시(360° 피팅실, 스타일 추천): 개인 사진은 기기에만, 플랫폼에는 스타일 메타+썸네일+링크만 남는 구조. 이 분리가 지금 설계부터 반영되면 앱 단계 재설계 없음.

---

## 1. GCS 경로 설계

### 1-1. 현행

```
버킷: monk-customer-photos (CUSTOMER_GCS_BUCKET)
경로: service/idphoto/{kr|jp}/{userId}/{timestamp}_{original|generated}.{ext}
```

- 서비스 구분: `kr` / `jp`
- 사용자 구분: Firebase Auth `userId`
- 파일 종류: `original`(촬영 원본) / `generated`(AI 생성 결과)

### 1-2. 신규 설계

```
service/
├── idpass/                          ← specs 웹 전환 (IDPASS 브랜드)
│   ├── {userId}/{ts}_original.jpg        ← 가입자 — 원본
│   ├── {userId}/{ts}_t0.png              ← T0 매팅+크롭 결과
│   ├── {userId}/{ts}_t1.png              ← T1 보정 결과
│   ├── {userId}/{ts}_t1_master.png       ← T2 고화질 원본 (크롭 전)
│   ├── {userId}/{ts}_attire.png          ← 업로드 의상 (T1 의상 피커)
│   └── anon/{sessionId}/{ts}_*.{ext}     ← 비가입자
│
├── idphoto/                         ← 기존 앱 (유지)
│   ├── kr/{userId}/{ts}_*.{ext}
│   └── jp/{userId}/{ts}_*.{ext}
│
├── headshot/                        ← 헤드샷 (미래)
│   ├── {userId}/{ts}_*.{ext}
│   └── anon/{sessionId}/{ts}_*.{ext}
│
└── assets/                          ← 공용 자산 (고객 데이터 아님)
    └── attire-presets/              ← 의상 프리셋 상품컷
        ├── m_suit_gray-light.png
        ├── m_suit_gray-charcoal.png
        ├── m_shirt_navy.png
        ├── f_blouse_beige-light.png
        └── ...
```

**설계 원칙:**
- `idpass` = specs 웹 전환 경로. `idphoto` = 기존 앱. 병존 후 이관 시 `idphoto` 동결.
- `anon/` 하위 = 비가입자. `sessionId`는 서버 발급 UUID (쿠키 아님, 세션 내 일회성).
- `assets/attire-presets/` = 고객 데이터가 아닌 서비스 자산. 별도 접근 정책.
- `_attire.png` = 고객 업로드 의상. 보관 정책은 §3에서 규정.

### 1-3. 파일 종류 코드

| 접미사 | 의미 | 생성 시점 |
|--------|------|----------|
| `_original` | 촬영/업로드 원본 | 업로드 시 |
| `_t0` | T0 결과 (매팅+크롭) | 무료 처리 완료 |
| `_t1` | T1 결과 (보정+의상) | T1 결제+생성 완료 |
| `_t1_master` | T2 납품용 고화질 원본 (크롭 전 리터칭본) | T1과 동시 생성, T2 결제 시 납품 |
| `_attire` | 고객 업로드 의상 이미지 | T1 피커에서 업로드 시 |
| `_generated` | 레거시 (기존 kr/jp) | 기존 호환 |

---

## 2. Firestore 스키마

### 2-1. 유저 문서 (기존 확장)

```
컬렉션: users/{userId}
```

```json
{
  "provider": "kakao|google|line",
  "email": "...",
  "name": "...",
  "credits": 10,
  "createdAt": "2026-07-10T...",
  "lastLogin": "2026-07-10T...",

  "acquisition": {
    "referrer": "https://google.com/",
    "landing_url": "https://idphoto-kr.monkos.ai/?utm_source=...",
    "first_visit": "2026-07-10T..."
  },

  "plan": "free"
}
```

- `acquisition`: 7/10 지시서로 탑재 완료 (막내2 추인 합격). 신규가입 시에만 기록.

### 2-2. 생성 이력 문서 (신규)

```
컬렉션: users/{userId}/generations/{generationId}
```

```json
{
  "id": "gen_20260710_183000_abc",
  "service": "idpass|idphoto-kr|idphoto-jp|headshot",
  "tier": "t0|t1|t2",
  "spec": {
    "country": "kr",
    "type": "passport",
    "width_mm": 35,
    "height_mm": 45
  },
  "attire": {
    "source": "preset|upload|original",
    "presetId": "m_suit_gray-charcoal",
    "uploadPath": null
  },
  "gcs": {
    "original": "service/idpass/{userId}/{ts}_original.jpg",
    "t0": "service/idpass/{userId}/{ts}_t0.png",
    "t1": "service/idpass/{userId}/{ts}_t1.png",
    "master": "service/idpass/{userId}/{ts}_t1_master.png",
    "attire": null
  },
  "identity": {
    "score": 0.87,
    "passed": true,
    "threshold": 0.75
  },
  "payment": {
    "amount": 2000,
    "method": "card|credit",
    "paidAt": "2026-07-10T..."
  },
  "createdAt": "2026-07-10T...",
  "expiresAt": null
}
```

### 2-3. 비가입자 생성 이력 (신규)

```
컬렉션: anonymous_generations/{sessionId}_{timestamp}
```

```json
{
  "sessionId": "sess_abc123",
  "service": "idpass",
  "tier": "t0",
  "spec": { ... },
  "gcs": {
    "original": "service/idpass/anon/{sessionId}/{ts}_original.jpg",
    "t0": "service/idpass/anon/{sessionId}/{ts}_t0.png"
  },
  "createdAt": "2026-07-10T...",
  "expiresAt": "2026-07-11T..."
}
```

- 비가입자는 T0만 가능 (T1/T2는 결제 필요 = 로그인 필요).
- `expiresAt` = 24시간 후. TTL 삭제 트리거.

---

## 3. 보관 정책

| 대상 | 조건 | 보관 기간 | 삭제 메커니즘 |
|------|------|----------|-------------|
| 비가입자 원본+결과 | T0 무료 | **24시간** | GCS Object Lifecycle (`expiresAt` 메타 기반) 또는 Cloud Scheduler + Function |
| 비가입자 Firestore | 위와 동일 | **24시간** | Firestore TTL policy (`expiresAt` 필드) |
| 가입자 T0 | 무료 생성 | **90일** | 마이페이지 보관함에서 열람 가능. 90일 후 자동 삭제 |
| 가입자 T1 | ₩2,000 결제 | **1년** | 결제 건은 장기 보관. 1년 후 안내 메일 → 30일 유예 → 삭제 |
| 가입자 T2 | ₩9,900 결제 | **영구** (계정 유지 시) | 발급보장 상품 = 재다운로드 보장. 계정 삭제 시 함께 삭제 |
| T2 마스터 파일 | ₩9,900 결제 | **1년** | 고용량이므로 기간 제한. 다운로드 독촉 후 삭제 |
| 업로드 의상 | T1 피커 | **생성 완료 후 24시간** | 일회성 사용. 재사용 시 재업로드 |
| 의상 프리셋 | 서비스 자산 | **영구** | 운영 판단으로만 삭제/교체 |

**구현:**
- GCS: Object Lifecycle Rule로 `custom-time` 메타데이터 기반 자동 삭제
- Firestore: TTL policy로 `expiresAt` 필드 기반 자동 삭제
- 가입자 보관함: `expiresAt`을 Firestore 문서에 설정. 마이페이지에서 남은 기간 표시.

**확정 (7/10 작가님):**
- 가입자 T0: 90일
- T2 마스터: 1년
- 계정 삭제: 30일 유예

**⚠️ privacy.html 연동 (민아 7/10 지적):**
- 본 보관 정책 시행 = privacy.html "즉시 삭제" 문구 개정과 **동시 배포** 필수.
- 현행 방침 "저장하지 않음" 문구와 실제 보관(90일~영구)의 모순을 이 시점에 해소.
- 비가입 24h 삭제는 방침과 정합. 가입자 보관 기간은 방침에 명시 추가.

---

## 4. 의상 피커 스키마

### 4-1. 프리셋 아이템 스키마 — 커머셜 DB 대응 설계

> 원칙: 패션 커머스의 표준 분류 체계(카테고리·소재·핏·시즌·타깃)를 선탑재하여,
> 벤더 입점 시 외부 DB 매핑 없이 직접 대응. 초기는 자체 생성 이미지로 채우고,
> 차후 핀터레스트/커머셜 참고로 추가·교체. 법적 클린 = 스타일 참고, 이미지 자체 생성.

```yaml
attire_item:
  # === 식별 ===
  id: string                          # m_suit_charcoal_classic_01
  active: bool
  sort_order: int
  created_at: datetime
  updated_at: datetime

  # === 스타일 태그 (커머셜 DB 대응 핵심) ===
  tags:
    gender: m | f | unisex
    category: suit | blazer | shirt | blouse | knit | tank | cardigan
    subcategory: single-breasted | double-breasted      # 재단 구조만 (칼라는 neckline으로)
    accessory: { tie: null | navy | charcoal | wine | black }  # 타이 등 부속 (shirt+tie 대응)
    fit: slim | regular | oversized
    material: wool | cotton | linen | polyester | blend   # 합성 시 질감 반영용
    color:
      primary: charcoal | navy | beige | white | black | gray-light | cream
      secondary: null | white | light-blue         # 이너 또는 투톤
      tone: warm | cool | neutral
    pattern: solid | pinstripe | herringbone | check | subtle-texture
    neckline: peaked-lapel | notch-lapel | shawl | round | v-neck | crew | mandarin | stand-collar  # 칼라·넥 전부 이 축으로 (subcategory와 혼용 금지)
    season: all | ss | fw                          # 시즌 트렌드 태깅
    formality: formal | semi-formal | business-casual | casual
    age_range: teen | 20s | 30s-40s | 50s+         # 추천 연령대, ⚠️ UI 비노출 — 내부 인덱스/추천용만
    trend_tags: [string]                           # 자유 태그 — "2026fw", "미니멀", "취활필수" 등
    use_case: [string]                             # "passport", "resume", "headshot", "profile"

  # === 이미지 ===
  image_gcs: gs://.../assets/attire-presets/{id}.png    # 고스트 마네킹 상품컷 (합성 입력)
  thumbnail: /images/attire/{id}_thumb.webp              # UI 표시용 (같은 도메인 서빙)
  source: ai-generated | photographed | stock            # 이미지 출처 (법적 추적)
  source_ref: null | "스타일참고: pinterest.com/..."      # 참고 원본 (내부 메모, 비공개)

  # === 다국어 ===
  label:
    ko: "차콜 클래식 정장"
    ja: "チャコール クラシックスーツ"
    en: "Charcoal Classic Suit"

  # === 벤더/커머스 슬롯 ===
  vendor: null | vendor_ref
```

### 4-2. 벤더 스키마

```yaml
vendor:
  id: vendor_uniqlo_001
  name: "UNIQLO"
  brand_tier: fast-fashion | premium | luxury | indie
  product_url: "https://www.uniqlo.com/kr/..."
  product_sku: null                  # 벤더 측 SKU 매핑
  price: { amount: 59900, currency: KRW }
  commission:
    type: affiliate | direct | subscription
    rate: 0.03
    platform: coupang-partners | null
  contract:
    start: null
    end: null
    status: prospect | active | expired
```

- 초기: 전 프리셋 `vendor: null`. 어필리에이트 링크(쿠팡 파트너스류)부터 시험.
- 피커 UI에서 vendor가 있는 아이템은 "이 정장 보러가기 →" 소프트 링크 노출.
- 커머스 클릭은 GA4 추적. 고객 사진 데이터와 분리 저장 (개인정보 결합 방지).
- 입점 단계: affiliate → direct(슬롯 납품) → vendor 크레딧 구독.
- **⚠️ "연출 이미지" 고지 필수**: 벤더 링크가 붙는 합성 결과 화면에 "AI 합성 연출 이미지입니다. 실제 제품과 차이가 있을 수 있습니다" 1행 고지. 벤더 분쟁 방어선.

### 4-3. 초기 프리셋 매트릭스

> **런칭 세트 = 12종(남6·여6)** — 스키마 그릇은 32종 유지하되 초기 데이터는 12종.
> 병목은 생성(12초)이 아니라 프리셋별 품질 검수(작가님 눈) + i2i 합성 상성 테스트.
> use_case=passport/resume 중심 12종으로 열고, 나머지 20종은 라이브 후 trend_tags 배치로 증설.

**★ 런칭 12종 (밑줄)**

**남성 (6종 런칭 / 16종 그릇)**

| # | category | subcategory | color | formality | age_range | use_case |
|---|----------|-------------|-------|-----------|-----------|----------|
| 1 | suit | single-breasted | charcoal | formal | 20s~40s | resume, passport |
| 2 | suit | single-breasted | navy | formal | 20s~40s | resume, passport |
| 3 | suit | single-breasted | black | formal | 30s+ | passport, visa |
| 4 | suit | single-breasted | gray-light | semi-formal | 20s~30s | resume, headshot |
| 5 | blazer | notch-lapel | navy | business-casual | 20s~30s | headshot, profile |
| 6 | blazer | notch-lapel | beige | business-casual | 20s~30s | headshot |
| 7 | shirt | mandarin-collar | white | semi-formal | 20s | resume (취활) |
| 8 | shirt | regular | white | formal | all | passport, resume |
| 9 | shirt | regular | light-blue | semi-formal | 20s~40s | resume |
| 10 | shirt | regular | cream | business-casual | 30s+ | headshot |
| 11 | knit | v-neck | charcoal | business-casual | 30s+ | headshot, profile |
| 12 | knit | crew-neck | navy | casual | 20s | headshot |
| 13 | knit | round-neck | beige | casual | teen~20s | 학생증 |
| 14 | knit | round-neck | gray-light | casual | teen | 반명함, 학생증 |
| 15 | shirt | regular+accessory:{tie:navy} | white | formal | 20s~40s | resume (정장셋) |
| 16 | shirt | regular+accessory:{tie:charcoal} | white | formal | 30s+ | visa, passport |

**여성 (16종)**

| # | category | subcategory | color | formality | age_range | use_case |
|---|----------|-------------|-------|-----------|-----------|----------|
| 1 | suit | single-breasted | charcoal | formal | 20s~40s | resume, passport |
| 2 | suit | single-breasted | navy | formal | 20s~40s | resume |
| 3 | suit | single-breasted | black | formal | 30s+ | passport, visa |
| 4 | blazer | notch-lapel | beige | semi-formal | 20s~30s | resume, headshot |
| 5 | blazer | notch-lapel | cream | business-casual | 20s~30s | headshot, profile |
| 6 | blouse | round-neck | white | semi-formal | 20s~40s | resume, passport |
| 7 | blouse | v-neck | cream | semi-formal | 20s~30s | resume |
| 8 | blouse | single-breasted | light-blue | semi-formal | 30s+ | passport |  <!-- neckline: stand-collar -->
| 9 | blouse | round-neck | beige | business-casual | 30s+ | headshot |
| 10 | knit | round-neck | charcoal | business-casual | 30s+ | headshot, profile |
| 11 | knit | v-neck | navy | business-casual | 20s~30s | headshot |
| 12 | knit | crew-neck | cream | casual | 20s | headshot, profile |
| 13 | knit | round-neck | gray-light | casual | teen~20s | 학생증 |
| 14 | tank | round-neck | white | casual | 20s | headshot |
| 15 | tank | round-neck | black | casual | 20s~30s | headshot, profile |
| 16 | cardigan | round-neck | beige | casual | teen | 반명함, 학생증 |

**합계: 32종** — 추후 크롤 참고로 시즌별 추가/교체. trend_tags로 트렌드 반영.

### 4-4. 업로드 의상 처리

| 단계 | 처리 |
|------|------|
| 업로드 | 클라이언트에서 리사이즈(최대 1024px) → 서버 수신 → GCS `_attire.png` 저장 |
| 검증 | 이미지 크기 ≥ 256px, 비율 세로형, 파일 크기 ≤ 5MB |
| 합성 | 나노2 i2i에 [인물 + 업로드 의상] 2이미지 입력 |
| 실패 시 | "이 이미지로는 합성이 어렵습니다" + 프리셋 추천 폴백 |
| 보관 | 생성 완료 후 24시간 삭제. 단, **같은 세션 내 재사용 허용** (색 변경 재생성 등 — 24h 내 동일 sessionId면 재업로드 불필요) |

---

## 5. 정체성 게이트 스펙

| 항목 | 값 |
|------|---|
| 모델 | ArcFace w600k_r50 ONNX |
| 편입 방식 | crop-engine 사이드카 `/api/embed` (6DRepNet 패턴 준용) |
| 입력 | 보정 전 매팅본(T0) vs 보정 후(T1) |
| 판정 | 코사인 유사도 ≥ 임계 |
| 캘리브레이션 | 공식 B/A 페어(be_f_1 ↔ ref.jpg) — 작가님이 합격시킨 보정 강도가 라벨 |
| 실패 처리 | 재생성 1회 → 재실패 시 보정 강도 낮춘 폴백(피부·조명만) |
| 적용 범위 | T1 전 건 필수. 의상 변경 시에도 원본 대비 동일 강도 |

---

## 6. 공용 컴포넌트 설계 (의상 피커)

### IDPASS + 헤드샷 공용

```
components/
  attire-picker/
    attire-picker.js       ← 피커 로직 (프리셋 로드, 업로드, 선택 상태)
    attire-picker.css      ← 모바일/웹 분기 스타일
    attire-presets.json     ← 프리셋 데이터 (빌드 시 주입 또는 API)
```

- **모바일**: 가로 스크롤 칩 행. 종류(셔츠/정장/블라우스) 탭 → 컬러 칩 → 선택 시 미리보기.
- **웹**: 그리드 레이아웃. 종류 필터 사이드바 + 컬러 칩 그리드.
- **기본 선택값**: "지금 옷 그대로" — 의상 관심 없는 다수는 0단 통과.
- **업로드 버튼**: 하단 "내 옷 사진 올리기" — 카메라 롤 또는 파일 선택.
- **specs 전속 구현 금지**: 이 컴포넌트는 독립 모듈. 헤드샷이 import하여 동일 사용.

---

## 7. 어드민 리뷰 확장

현행 `idphoto-review.js`의 `SERVICE_PREFIX`에 추가:

```js
const SERVICE_PREFIX = {
  kr: 'service/idphoto/kr/',
  jp: 'service/idphoto/jp/',
  idpass: 'service/idpass/',        // 신규
  headshot: 'service/headshot/',    // 미래
};
```

- 어드민 UI에서 `?service=idpass` 파라미터로 분기.
- `NAME_RE` 정규식 확장: `_t0`, `_t1`, `_t1_master`, `_attire` 접미사 추가.

---

## 8. 미결 사항 (작가님 결정)

| # | 항목 | 선택지 | 쌍아 의견 |
|---|------|-------|----------|
| 1 | 가입자 T0 보관 기간 | 30일 / 90일 / 180일 | 90일 — 재방문 유인과 비용의 균형 |
| 2 | T2 마스터 파일 보관 | 6개월 / 1년 / 영구 | 1년 — 고용량, 다운로드 독촉 |
| 3 | 계정 삭제 시 | 즉시 삭제 / 30일 유예 | 30일 유예 — 오삭제 방지 |
| 4 | 프리셋 상품컷 제작 | AI 생성 / 실촬영 / 스톡 구매 | **확정: AI 생성** (민아 실증 방식). 런칭 12종, 검수 후 증설 |
| 5 | T1 활성화 시점 | kr-passport 파일럿 선행 / specs 전체 배포 시 함께 | **확정: kr-passport 파일럿 선행** (작가님 7/10 — 파일럿 완성 시 동시 활성화. 소량 실결제·게이트 검증 후 전 specs 확산) |
