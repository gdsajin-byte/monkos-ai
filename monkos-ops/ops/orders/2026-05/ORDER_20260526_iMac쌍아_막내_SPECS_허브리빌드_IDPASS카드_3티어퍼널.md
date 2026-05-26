---
type: order
date: 2026-05-26
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_SPECS
supersedes: ORDER_20260522_iMac쌍아_막내_SPECS허브_리디자인_대륙카드.md
---

# SPECS 허브 리빌드 — IDPASS 카드 UX + 3티어 전환 퍼널

## 배경

스펙스 페이지는 허브(탐색) + 개별 상세(SEO 진입 + 전환)의 2층 구조.
- **허브**: IDPASS 앱과 동일한 카드 UI로 리빌드 (용도→대륙→국가 퍼널)
- **상세**: 규격 정보 + 3단 티어 CTA 퍼널 (무료/AI프리미어/스튜디오)
- **URL**: `/specs/:type/:country` 구조 (5/25 설계서 확정)

기존 5/22 허브 리디자인 지시서(대륙카드+4탭)를 대체한다.

## 참조

- **IDPASS 앱 코드**: `apps/MonkosCrop/MonkosCrop/ContentView.swift` (LandingView + Step1)
- **PF_SPECS**: `monkos-ops/ops/portfolios/PF_SPECS/README.md`
- **현행 렌더러**: `monkos_AI/portal/lib/cms/render-specs.js` (858줄)
- **현행 데이터**: `monkos_AI/portal/lib/cms/specs-data.json` (440건)
- **iOS 정본**: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` (202국)
- **5/25 설계서**: `ORDER_20260525_iMac쌍아_막내1_스펙스페이지_리빌드설계.md` (있으면 참조)
- **대륙 이미지**: `apps/MonkosCrop/MonkosCrop/Resources/cont_*.jpg` (6장)
- **대륙 색상**: SpecData.swift continentMeta

## 작업

### Phase A — 허브 리빌드 (`/specs`)

#### A-1. 용도 카드 (1차 진입)

IDPASS 앱 LandingView serviceCards와 동일 구조. 2×2 그리드.

```
┌─────────────┐ ┌─────────────┐
│   📘 여권    │ │   📋 비자    │
│  PASSPORT   │ │    VISA     │
└─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│  🪪 신분증   │ │   📸 기타    │
│     ID      │ │   CUSTOM    │
└─────────────┘ └─────────────┘
```

- 각 카드: 배경 이미지 + LinearGradient 오버레이 (앱과 동일)
- 클릭 시 → 같은 페이지 내 대륙 카드 표시 (JS 토글, 페이지 이동 아님)
- 카드 이미지: `card_passport.jpg` 등 앱 에셋 웹용 변환 (WebP 600px)

#### A-2. 대륙 카드 (2차)

용도 선택 후 표시. IDPASS 앱 Step1 대륙 그리드와 동일.

```
┌─────────────┐ ┌─────────────┐
│             │ │             │
│   ASIA      │ │   EUROPE    │
│   아시아     │ │   유럽       │
│   32개국     │ │   41개국     │
└─────────────┘ └─────────────┘
  ... (6대륙 2×3 그리드)
```

- 각 카드: 정사각형, `cont_*.jpg` 배경 + 그라데이션 오버레이
- 대륙 그라데이션 색상: IDPASS SpecData.swift continentMeta 참조
- 클릭 시 → 국가 카드 리스트 표시

#### A-3. 국가 카드 (3차)

대륙 선택 후 표시. IDPASS 앱 countryCard와 동일.

```
┌──────────────────┐ ┌──────────────────┐
│ 🇰🇷 한국           │ │ 🇯🇵 일본           │
│ 여권 · 35×45mm    │ │ 여권 · 35×45mm    │
└──────────────────┘ └──────────────────┘
```

- 2열 그리드, 국기 이모지 + 국가명 + 용도·사이즈
- 클릭 시 → **상세 페이지로 이동** (`/specs/passport/korea`)
- 상단에 ← 뒤로 버튼 (대륙 목록으로 복귀)
- 검색바: 국가명 필터 (앱과 동일 UX)

#### A-4. 히어로 섹션

용도 카드 상단. 앱 LandingView 참조.

```
🌐 GLOBAL PHOTO SPEC GUIDE
H1: "증명사진 규격 가이드"
부제: "전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보"
수치: 200+ 국가 | 500+ 규격 | 35+ 공식 검증
```

#### A-5. 디자인 토큰

**다크 테마** (IDPASS 앱과 통일):

| 토큰 | 값 | 용도 |
|------|---|------|
| bg | `#05080E` | 페이지 배경 |
| card | `#0D1117` | 카드 배경 |
| border | `rgba(255,255,255,0.06)` | 카드 테두리 |
| text | `#F0F0F0` | 주 텍스트 |
| muted | `#888` | 부 텍스트 |
| accent | `#00D4AA` | 강조 (IDPASS 브랜드) |
| font | -apple-system, system-ui | 본문 |
| mono | monospace | 수치·배지 |
| radius | 12px | 카드 코너 |

#### A-6. 반응형

- 768px 이상: 2열 그리드
- 768px 이하: 1열 (모바일)
- 카드 터치 영역 최소 48px 높이

---

### Phase B — 상세 페이지 리빌드 (`/specs/:type/:country`)

#### B-1. URL 전환

- 새 URL: `/specs/passport/korea`, `/specs/visa/vietnam` 등
- 기존 URL `/specs/korea-passport` → 301 리다이렉트
- 라우팅: `render-specs.js`에서 `:type/:country` 파싱

#### B-2. 상세 페이지 구조

```
[규격 정보 히어로]
  🇰🇷 한국 여권 사진 규격
  35 × 45 mm · 413 × 531 px · 300 DPI
  배경: 균일 흰색 | 기준: ICAO 9303

[가이드 이미지]
  guides/ 폴더의 WebP 이미지 (기존 로직 유지)

[규격 테이블]
  사이즈, 픽셀, DPI, 머리 높이, 배경색, 기준 등

[FAQ 아코디언] (기존 유지)

[반려 사유] (기존 유지)

[공식 출처] (있는 경우)

─────────────────────────────
[3단 티어 CTA 섹션 — 신규]

┌─ 무료 ────────────────────┐
│ 📸 무료 크롭               │
│ 브라우저에서 바로 처리       │
│ 배경 제거 + 규격 크롭       │
│ [무료로 시작 →]            │
└───────────────────────────┘

┌─ AI 프리미어 ──────────────┐  ★ 추천
│ 🤖 AI 프리미어              │
│ GPU 배경 제거 + AI 규격 검수  │
│ 컬러 배경 선택              │
│ [크레딧으로 이용 →]         │
└───────────────────────────┘

┌─ 스튜디오 ─────────────────┐
│ 👤 스튜디오 검수             │
│ 전문가 정밀 보정             │
│ 발급 보장                   │
│ [스튜디오 의뢰 →]           │
└───────────────────────────┘
```

#### B-3. CTA 링크 연결

- **무료**: IDPASS 웹앱 딥링크 (규격 파라미터 포함) 또는 앱스토어
- **AI 프리미어**: 추후 연결 (현재는 `#` + "준비 중" 배지)
- **스튜디오**: 추후 연결 (현재는 `#` + "준비 중" 배지)

무료 CTA만 활성, 나머지는 UI만 구성하되 비활성 상태.

#### B-4. JSON-LD (기존 유지 + 보강)

- Article + FAQPage + HowTo 트리플 스택 유지
- URL 변경 반영 (`/specs/:type/:country`)
- hreflang: 기존 3언어 유지 (15언어 확장은 별도 Phase)

#### B-5. 다크 테마 통일

상세 페이지도 Phase A와 동일 다크 테마 적용.

---

### Phase C — 데이터 연결

#### C-1. 라우팅 매핑

specs-data.json의 slug를 type + country로 분리 매핑.

```
korea-passport → type: passport, country: korea
vietnam-visa   → type: visa, country: vietnam
```

기존 slug 필드 유지 + `type`, `countrySlug` 필드 파생.

#### C-2. 대륙·국가 카운트

specs-data.json에서 continent 필드 기반 집계. 허브 히어로 수치 자동 산출.

---

## 이미지 에셋 준비

막내가 직접 실행:

```bash
# 대륙 이미지 WebP 변환
mkdir -p monkos_AI/portal/public/images/continents
for f in cont_asia cont_europe cont_americas cont_africa cont_oceania cont_middleeast; do
  sips -Z 600 "apps/MonkosCrop/MonkosCrop/Resources/${f}.jpg" --out "/tmp/${f}.png"
  # WebP 변환 (cwebp 있으면)
  if command -v cwebp &>/dev/null; then
    cwebp -q 80 "/tmp/${f}.png" -o "monkos_AI/portal/public/images/continents/${f}.webp"
  else
    cp "/tmp/${f}.png" "monkos_AI/portal/public/images/continents/${f}.jpg"
  fi
done

# 용도 카드 이미지 (앱에 있으면 동일 처리, 없으면 생략 — CSS 그라데이션으로 대체)
```

## 배포

- `monkos_AI/portal/deploy.sh prod`

## 완료 기준

1. `/specs` 허브에서 용도→대륙→국가 카드 퍼널 동작
2. 국가 카드 클릭 시 `/specs/:type/:country` 상세 페이지 이동
3. 상세 페이지에 3단 티어 CTA 섹션 표시 (무료만 활성)
4. 기존 `/specs/:slug` URL → 301 리다이렉트
5. 다크 테마 전체 적용
6. 모바일 반응형 정상
7. JSON-LD · hreflang · sitemap 정상

## ⚠️ 준수 조항

- 배포는 반드시 deploy.sh 경유 (법률 ch5 2조)
- 기존 26건의 SEO 콘텐츠 (FAQ, 반려사유, details) 손실 금지
- 기존 색인된 URL 301 리다이렉트 필수 (SEO 자산 보호)
- specs-data.json 기존 데이터 수정·삭제 금지 (추가·확장만 허용)
- 완료 시 COMPLETION 보고서 + PF_SPECS 히스토리 1행 어펜드
