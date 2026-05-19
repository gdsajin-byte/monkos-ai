---
type: report
date: 2026-05-19
device: iMac
agent: 막내2
status: 완료
portfolio: PF_CROP
order: ORDER_20260519_iMac쌍아_막내2_SPECS페이지_현황파악_리디자인로드맵
---

# SPECS 페이지 현황 파악 + 리디자인 로드맵

> **[2026-05-19 14:49 KST] iMac/막내2 → 작가님**

---

## 1. 현황 파악

### 1-A. 렌더링 엔진 분석 (`render-specs.js`, 666줄)

#### 허브 페이지 (`/specs`)

| 항목 | 현황 |
|------|------|
| 구조 | 국가별 그룹핑 → 카드 그리드 (`auto-fill, minmax(280px, 1fr)`) |
| 국가 수 | 26개 항목, 5개 국가 그룹 (한국/日本/USA/유럽/기타 Others) |
| 카드 내용 | type명 + 사이즈·해상도 + details 60자 요약 |
| 링크 구조 | `/{lang}/specs/{slug}` (ko는 prefix 없음) |
| JSON-LD | `ItemList` (position + url + name) |
| hreflang | ko/ja/en/x-default 4개 완비 |
| OG 태그 | og:title, og:description, og:type, og:url 완비 |

#### 상세 페이지 (`/specs/{slug}`)

| 섹션 | 내용 | 평가 |
|------|------|------|
| Hero 2열 | 좌: 타이틀+설명+태그 / 우: SVG 실루엣 다이어그램 | ⚠️ SVG 플레이스홀더, 실사 이미지 없음 |
| 규격 테이블 | 7행 (사이즈/해상도/DPI/배경/머리높이/유효기간/파일규격) | ✅ 아이콘 포함 |
| 상세 규정 그리드 | details 텍스트를 `.` 기준 분할 → 아이콘 카드 | ✅ |
| O/X 비교 | 적합/반려 2열 카드 — SVG 실루엣 | ⚠️ 플레이스홀더, 실사 Before/After 없음 |
| 반려 사유 TOP 5 | 2열 카드 + 번호 배지 | ✅ |
| FAQ 아코디언 | 첫 항목 열림, 나머지 접힘 | ✅ |
| CTA 배너 | "AI로 촬영하기" + "무료 크롭앱" 2버튼 | ✅ |
| 관련 콘텐츠 | 가이드/크롭/FAQ 링크 + 같은 국가 다른 규격 | ✅ |

#### JSON-LD 트리플 스택

| 스키마 | 현황 |
|--------|------|
| Article | headline, author(Shin JeongKyu), publisher(Monk Studio), datePublished/Modified |
| FAQPage | faqs 존재 시만 삽입 (빈 faqs 방어) |
| HowTo | 4단계 (규격확인→셀카촬영→AI보정→다운로드) |

#### i18n 처리

- `SPECS_I18N` 객체로 ko/ja/en 3개 언어 지원
- `locField()` 함수로 필드 suffix 기반 분기 (`backgroundEn`, `headHeightJa` 등)
- seoTitle/seoDescription도 언어별 커스텀 가능 (없으면 자동 생성)

#### CSS 스타일링

- **인라인 CSS** (`SPECS_PAGE_STYLE` 상수, 288줄)
- 라이트 테마 기반 (`var(--text-bright)`, `var(--accent)` 등)
- 반응형: 768px/600px 2단 브레이크포인트
- 디자인 수준: 깔끔한 카드 UI, 보라 계열 accent (#6c4fff) — **IDPASS 앱(#05080E/#00D4AA 다크 HUD)과 톤 불일치**

---

### 1-B. 데이터 분석 (`specs-data.json`, 1,362줄)

#### 등록 현황

| 항목 | 수치 |
|------|------|
| 총 항목 | 26건 |
| 국가 분포 | 한국 5, 일본 4, 미국 2, 유럽 5, 기타 8 |
| 국가 그룹 | 한국 / 日本 / USA / 유럽 / 기타 Others |

#### 필드 구조

```
slug, country, countryEn, type, typeEn, typeJa,
size, pixels, dpi, background, headHeight, validity, fileSpec,
details{ko,ja,en}, rejectionReasons{ko,ja,en}, faqs{ko,ja,en},
ctaService, priority,
[선택] seoTitle{ko,ja,en}, seoDescription{ko,ja,en},
[선택] {field}En, {field}Ja (suffix 기반 다국어)
```

#### 콘텐츠 충실도 편차

| 국가 | 항목 수 | seoTitle | seoDescription | FAQ(ko) | 반려사유(ko) | 평가 |
|------|---------|----------|----------------|---------|-------------|------|
| 한국 여권 | 1 | ✅ | ✅ | 6건 | 5건 | ★★★ |
| 한국 운전면허 | 1 | ✅ | ✅ | 2건 | 5건 | ★★★ |
| 한국 주민등록 | 1 | ✅ | ✅ | 1건 | 4건 | ★★☆ |
| 일본 여권 | 1 | ❌ | ❌ | 2건 | 5건 | ★★☆ |
| 미국 여권 | 1 | ❌ | ❌ | 1건 | 5건 | ★★☆ |
| EU 공통 | 1 | ❌ | ❌ | 0건 | 2건 | ★☆☆ |
| 호주/캐나다/싱가포르/태국 | 각 1건 | ❌ | ❌ | 0건 | 0~1건 | ★☆☆ |
| 인도/중국/베트남/인도네시아 | 각 1건 | ❌ | ❌ | 0건 | 0~1건 | ★☆☆ |

**핵심 문제**: 한국 여권만 풀 콘텐츠, 나머지 대부분 최소 데이터(스켈레톤). FAQ·반려사유 비어있는 항목이 절반 이상.

#### 이미지/실사 필드

- **실사 이미지 필드 자체가 존재하지 않음**. 모든 규격 다이어그램·O/X 비교가 SVG 실루엣 플레이스홀더.
- ogImage 필드 없음 — SNS 공유 시 이미지 미노출.

---

### 1-C. 3개 데이터 소스 갭 분석

#### 데이터 소스 비교

| 속성 | specs-data.json (웹) | specs-data-v2.json (크롭앱) | countries.jsonl (iOS) |
|------|---------------------|---------------------------|---------------------|
| 파일 위치 | `monkos_AI/portal/lib/cms/` | `apps/crop-app/data/` | `apps/MonkosCrop/.../Resources/` |
| 포맷 | 단일 JSON 객체 (slug→데이터) | JSON {countries: [{documents}]} | JSONL (1행=1국가) |
| 국가 수 | 13국 (그룹 포함) | 15국 | 202국 |
| 문서 수 | 26건 | 28건 | 101건 (72국에 분포) |
| 국가 ID 체계 | slug 기반 (`korea-passport`) | full name (`korea`) | ISO alpha-2 (`kr`) |
| 문서 ID 체계 | slug (`korea-passport`) | slug (`korea-passport`) | ISO+type (`kr-passport`) |
| 크롭 파라미터 | ❌ 없음 | ❌ 없음 (headHeight만) | `head` (min-max mm) |
| 공식 출처 URL | ❌ 없음 | ✅ officialSource 필드 | ❌ 없음 |
| AI 제한 표시 | ❌ 없음 | ✅ aiRestriction | ❌ 없음 |
| 눈 위치 규정 | ❌ 없음 | ✅ eyePosition (일부) | ❌ 없음 |
| SEO 콘텐츠 | ✅ (FAQ/반려/상세) | ❌ 없음 | ❌ 없음 |
| i18n | ko/ja/en 3개 | ko/ja/en 3개 | ko/ja/en 3개 |

#### 교차 갭

| 분류 | 항목 |
|------|------|
| 웹에만 있음 (v2에 없음) | `germany-resume`, `japan-halfcard`, `korea-halfcard` |
| v2에만 있음 (웹에 없음) | `china-visa`, `germany-passport`, `india-visa`, `spain-dni`, `us-visa` |
| iOS에만 있음 | 72국 101건 중 대다수 (ISO alpha-2 ID 체계 별도) |

#### 2차 검수 리포트(A+B 114건)와의 갭

- 2차 검수(5/15): 200국 전수조사 → A+B 등급 114건 반영 대상
- JSONL(5/15): 72국에 비표준 63국 docs 반영 완료 (막내1 COMPLETION 확인)
- **specs-data.json(웹): 26건 고정 — 2차 검수 114건 중 88건이 웹 미반영**
- specs-data-v2.json(크롭앱): 28건 고정 — 동일 문제

#### 단일 정본 위반 현황

**3개 소스가 독립 진화 중**. 동일 규격의 수치가 소스마다 다른 사례:

| 규격 | 웹 specs-data | v2 크롭앱 | iOS JSONL |
|------|--------------|----------|-----------|
| 인도 여권 사이즈 | 35×45mm | 51×51mm | — |
| 인도 여권 px | 413×531 | 630×810 | — |
| 싱가포르 px | 413×531 | 400×514 | — |

→ **헌법 3조 4항(정본 단일 원칙) 위반 상태**

---

### 1-D. 프로토타입 확인 (`specs-passport-proto.html`, 705줄)

#### 구조

- 라이트 테마 (#f6f7fb 배경, 보라 accent)
- Pretendard 폰트
- 섹션: Header → Hero(2열 다이어그램) → 규격 테이블 → 상세 규정 → O/X 비교 → 반려 사유 → FAQ → CTA → 관련 콘텐츠

#### 디자인 수준 평가

- 현재 프로덕션(`render-specs.js`)과 거의 동일한 구조/스타일
- SVG 실루엣 플레이스홀더 — 실사 이미지 전무
- **IDPASS 앱 디자인 톤(다크 HUD, #05080E 배경, #00D4AA 액센트)과 완전 괴리**
  - 웹 specs: 라이트 테마 + 보라(#6c4fff)
  - IDPASS 앱: 다크 테마 + 시안/초록(#00D4AA)
- Before/After 실사, 탈락 예시 이미지 없음 → 경쟁사 대비 시각적 설득력 부족

---

### 1-E. 경쟁사 벤치마크

#### 비교표

| 항목 | visafoto.com | passport-photo.online | MONKOS (현재) |
|------|-------------|----------------------|---------------|
| **페이지 수** | 200국+ (국가별 여권/비자 분리) | 200국+ (국가별 개별 페이지) | 26건 |
| **콘텐츠 분량** | 간결 (3섹션, 규격표+Before/After+CTA) | 풍부 (9개 H2, 25+ H3, ~3,500단어) | 중간 (7섹션, 26개 항목) |
| **H1 전략** | "Get photo for {국가} passport {사이즈} in 2 seconds" | "{국가} Passport Photo Online" | "2026 {국가} {type}" |
| **이미지** | Before/After 실사 (source→result) | 규격 다이어그램 + 3단계 Process 플로우 + 촬영 가이드 | SVG 실루엣 플레이스홀더 ❌ |
| **FAQ** | ❌ 없음 | ✅ 6건+ (FAQ 섹션) | ✅ 국가별 상이 (0~6건) |
| **JSON-LD** | 미확인 | 미확인 | ✅ Article+FAQPage+HowTo 트리플 |
| **hreflang** | 다국어 (20개+) | 미확인 | ✅ ko/ja/en 3개 |
| **CTA** | "Upload photo" 1버튼 | "Upload photo" / "Take photo" + 앱 다운로드 | "AI로 촬영하기" + "무료 크롭앱" 2버튼 |
| **가격** | 별도 페이지 (업로드 후 노출) | 비공시 (무료 시도 후 유료 전환) | **완전 무료** (차별점 ★) |
| **앱 유도** | ❌ | ✅ iOS/Android 반복 배치 | ❌ (IDPASS 앱 링크 없음) |
| **신뢰 요소** | "보장" 문구 | Bloomberg/NYT/Forbes 로고, 작성자 프로필 | ❌ 없음 |
| **내부 링크** | 푸터 50+개 국가 링크 | 50+개 관련 서비스 링크 | 같은 국가 규격 + 가이드/크롭/FAQ |
| **촬영 가이드** | ❌ | ✅ 상세 (거리/포즈/조명) | ❌ |
| **공식 출처 링크** | ❌ | ❌ | ❌ |

#### 우리의 차별점 (잠재)

1. **완전 무료** — 경쟁사는 전부 유료($1.5~$11). 가격 제거가 최대 USP
2. **JSON-LD 트리플 스택** — Article+FAQPage+HowTo 이미 구현. 경쟁사보다 구조화 데이터 우위
3. **3개 언어 동시 지원** — 경쟁사는 영어 중심, 한/일 localization 약함
4. **IDPASS 앱 연동** — specs 페이지→앱 다이렉트 딥링크 가능 (경쟁사에 없는 동선)
5. **202국 데이터 보유** — JSONL에 이미 72국 실데이터. 확장 즉시 가능

#### 우리의 열위

1. **이미지 전무** — 실사 Before/After, 규격 다이어그램 사진, 탈락 예시 모두 없음
2. **콘텐츠 빈약** — 26건 중 한국 여권만 풀 콘텐츠. 나머지 스켈레톤
3. **국가 커버리지** — 경쟁사 200국+ vs 우리 26건
4. **촬영 가이드 없음** — passport-photo.online의 "How to take photo at home" 미비
5. **신뢰 요소 없음** — 미디어 로고, 사용자 수, 보장 문구 없음

---

## 2. 리디자인 로드맵 기획

### 2-A. 페이지 구조 제안

#### 허브 페이지 (`/specs`)

**현재 문제**: 국가 5그룹 플랫 리스팅, 26건뿐, 검색/필터 없음

**제안**:

```
[Header: MONKOS]
[Hero]
  H1: "200개국 증명사진 규격 가이드"
  부제: "국가별·용도별 사이즈, 배경, 복장 기준과 탈락 사유까지"
  검색 바: 국가명/slug 실시간 검색

[대륙별 아코디언 또는 탭]
  아시아·오세아니아 (48국)
  유럽 (51국)
  아메리카 (25국)
  중동·아프리카 (78국)

[국가 카드 그리드]
  국기 이모지 + 국가명 + 문서 수 + 대표 사이즈
  → 클릭 시 국가별 문서 리스트 확장 또는 /specs/{country} 이동

[인기 규격 TOP 10 배너]
  한국 여권 / 미국 비자 / 일본 여권 등 직접 링크

[CTA: IDPASS 앱 다운로드 배너]
```

#### 상세 페이지 (`/specs/{slug}`)

**제안 섹션 구조**:

```
① [Breadcrumb] 홈 > 규격 가이드 > 한국 > 여권
② [Hero 2열]
   좌: H1 + 핵심 태그(사이즈/배경/유효기간) + "이 규격으로 크롭" CTA
   우: 규격 다이어그램 (실사 이미지 + 사이즈 오버레이)
③ [규격 테이블] 현행 유지 (7행)
④ [공식 출처] 해당 국가 정부 사이트 링크 + "마지막 확인: YYYY-MM-DD"
⑤ [촬영 가이드] 3단계 카드 (거리/조명/포즈) — 국가별 특수사항 포함
⑥ [O/X 비교] 실사 Before/After (규격 통과 vs 탈락 예시)
⑦ [탈락 사유 TOP 5] 현행 유지
⑧ [FAQ 아코디언] 현행 유지 + 확장
⑨ [같은 국가 다른 규격] 카드 링크
⑩ [CTA 배너] IDPASS 앱 다운로드 + AI 증명사진
⑪ [관련 콘텐츠] 인접 국가 규격 + 블로그 글 링크
```

#### IDPASS 앱과의 디자인 톤 통일 방안

| 현재 (웹 specs) | IDPASS 앱 | 제안 |
|----------------|-----------|------|
| 라이트 테마 (#f6f7fb) | 다크 HUD (#05080E) | **라이트 유지** — 웹 SEO 페이지는 가독성 우선 |
| 보라 accent (#6c4fff) | 시안 accent (#00D4AA) | **시안(#00D4AA)으로 통일** — IDPASS 브랜드 |
| Pretendard 폰트 | 시스템 폰트 | Pretendard 유지 (웹 전용) |
| 라운드 카드 | 다크 카드 | IDPASS 카드 스타일 참조하되 라이트 톤 |

→ 라이트 테마를 유지하되, accent 컬러를 IDPASS 시안(#00D4AA)으로 전환하고, CTA 버튼/배지 디자인을 앱과 통일하는 방향이 적합.

---

### 2-B. 데이터 통합 전략

#### 현황 진단

```
[3개 소스 독립 진화 — 정본 부재]

specs-data.json (웹, 26건)
  ├─ SEO 콘텐츠 풍부 (FAQ, 반려, 상세)
  ├─ 크롭 파라미터 없음
  └─ 공식 출처 URL 없음

specs-data-v2.json (크롭앱, 28건)
  ├─ 공식 출처 URL ✅
  ├─ aiRestriction, eyePosition ✅
  └─ SEO 콘텐츠 없음

countries.jsonl (iOS, 202국 101건)
  ├─ 202국 커버리지 ✅
  ├─ 대륙 분류 ✅
  └─ ISO alpha-2 ID 체계 (별도)
```

#### 통합 방안: 단일 정본 + 뷰 레이어

```
[정본: specs-unified.json]  ← 단일 파일, 모든 규격 데이터
  │
  ├─ 국가 ID: ISO alpha-2 (JSONL 체계 채택)
  ├─ 문서 ID: {iso}-{type} (kr-passport, us-visa ...)
  ├─ 크롭 필드: size, px, head, eyePosition, faceTarget
  ├─ SEO 필드: seoTitle, seoDescription, details, faqs, rejectionReasons
  ├─ 메타 필드: officialSource, aiRestriction, continent, flag
  ├─ i18n: ko/ja/en 3개 언어
  └─ 신뢰등급: A/B/C/X (2차 검수 결과)
  │
  ├─→ [웹] render-specs.js가 import하여 SSR
  ├─→ [크롭앱 웹] crop.js가 import하여 프리셋 로딩
  └─→ [iOS] 빌드 시 JSONL로 변환 (경량화 스크립트)
```

#### 2차 검수 리포트 반영 방안

- A+B 등급 114건: 정본에 병합 (공식 URL + 특이사항 + 신뢰등급)
- C/X 등급 33건: 별도 `unverified` 플래그로 관리, 페이지 미노출
- JSONL 72국 비표준 docs: 정본으로 승격 (이미 막내1이 5/15 반영 완료)

#### ID 체계 통일

| 현재 | 통합 후 |
|------|---------|
| `korea-passport` (웹/v2) | `kr-passport` |
| `us-passport` (웹/v2) | `us-passport` (동일) |
| `japan-passport` (웹/v2) | `jp-passport` |

→ ISO alpha-2 기반으로 통일. 웹 URL은 SEO 보존을 위해 301 리다이렉트 또는 slug alias 유지.

---

### 2-C. 콘텐츠 확보 계획

#### 실사 이미지 필요 목록

| 유형 | 용도 | 수량 | 제작 방식 |
|------|------|------|----------|
| 규격 다이어그램 | Hero 영역 | 사이즈 패턴 4종 (35×45, 51×51, 50×70, 33×48) | IDPASS 앱 내 크롭 결과 캡처 + 사이즈 오버레이 |
| Before/After | O/X 비교 | 최소 3쌍 (한국/미국/일본) | IDPASS 앱 크롭 과정 스크린샷 |
| 탈락 예시 | 반려 사유 시각화 | 5종 (그림자/기울기/머리카락/안경반사/사이즈) | 의도적 불량 사진 제작 |
| 촬영 가이드 | 셀프촬영 가이드 | 3종 (거리/조명/포즈) | 일러스트 또는 실사 |
| 앱 스크린샷 | CTA 영역 | 2종 (iPhone 프레임) | IDPASS 앱 스크린샷 |

#### i18n 우선순위

1. **ko** — 한국 시장 기반 + SEO 메인 타겟
2. **en** — 글로벌 트래픽 + 경쟁사 주력 언어
3. **ja** — 일본 시장 (idphoto-jp 연동)

#### 국가 우선순위 (SEO/트래픽 기반)

**Tier 1 — 즉시 풀 콘텐츠** (검색량 높음, 우리 서비스 직결):
1. 한국 여권 (현행 유지, 보강)
2. 미국 여권/비자 (경쟁 치열, 검색량 최대)
3. 일본 여권 (idphoto-jp 연동)
4. 캐나다 여권 (50×70 특수 규격, 검색 차별화)
5. 영국 여권 (29-34mm 특수 headHeight)

**Tier 2 — 기본 콘텐츠 확장** (비표준 규격 보유 국가):
6. 중국 여권/비자 (33×48 특수)
7. 인도 여권/비자 (51×51 → 35×45 과도기)
8. 독일 여권 (EU 개별 — 2025 biometric 신규정)
9. 호주 여권
10. 싱가포르 여권

**Tier 3 — 스켈레톤 확장** (JSONL 72국 데이터 기반):
- 나머지 62국은 규격 테이블 + 기본 설명 자동 생성

---

### 2-D. Phase 제안

#### Phase A — 데이터 통합 + 기반 정비 (1주)

| # | 작업 | 소요 | 담당 |
|---|------|------|------|
| A-1 | specs-unified.json 정본 설계 (스키마 확정) | 0.5일 | 쌍아(설계) |
| A-2 | 3소스 병합 스크립트 (v2 + JSONL + 웹 → unified) | 1일 | 막내 |
| A-3 | 2차 검수 A+B 114건 공식 URL/특이사항 병합 | 0.5일 | 막내 |
| A-4 | render-specs.js unified import 전환 | 0.5일 | 막내 |
| A-5 | URL slug 매핑 (korea-passport → kr-passport alias) | 0.5일 | 막내 |

**산출물**: 단일 정본 파일 + 웹 렌더러 전환 완료

#### Phase B — 허브 리디자인 + 국가 확장 (1주)

| # | 작업 | 소요 | 담당 |
|---|------|------|------|
| B-1 | 허브 페이지 리디자인 (대륙별 분류 + 검색 + 인기 규격) | 1일 | 막내 |
| B-2 | 72국 → 허브 카드 자동 생성 | 0.5일 | 막내 |
| B-3 | 상세 페이지 Tier 2~3 자동 생성 (규격 테이블 + 기본 설명) | 1일 | 막내 |
| B-4 | specs → IDPASS 앱 CTA ("이 규격으로 크롭") 연동 | 0.5일 | 막내 |
| B-5 | 공식 출처 링크 섹션 추가 | 0.5일 | 막내 |

**산출물**: 72국+ 커버리지 허브 + IDPASS 앱 연동

#### Phase C — 콘텐츠 강화 + 비주얼 (1~2주)

| # | 작업 | 소요 | 담당 |
|---|------|------|------|
| C-1 | Tier 1 (5국) 풀 콘텐츠 보강 (FAQ 5건+, 반려 5건+, 촬영 가이드) | 2일 | 막내 (리서치) |
| C-2 | 실사 이미지 제작 (Before/After, 규격 다이어그램, 탈락 예시) | 2일 | 작가님+디자인 |
| C-3 | accent 컬러 시안(#00D4AA) 전환 + IDPASS 톤 통일 | 0.5일 | 막내 |
| C-4 | 촬영 가이드 섹션 신설 (거리/조명/포즈) | 1일 | 막내 |
| C-5 | Tier 2 (5국) 콘텐츠 확장 | 1일 | 막내 |

**산출물**: 시각적 경쟁력 + Tier 1-2 10국 풀 콘텐츠

#### Phase D — SEO 고도화 + CITADEL 연계 (지속)

| # | 작업 | 소요 | 담당 |
|---|------|------|------|
| D-1 | 국가별 seoTitle/seoDescription 최적화 (검색량 기반) | 1일 | 막내 |
| D-2 | 블로그 ↔ specs 상호 링크 (CITADEL 콘텐츠 네트워크) | 0.5일 | 막내 |
| D-3 | GSC 색인 제출 + sitemap 갱신 (72국 신규 URL) | 0.5일 | 막내 |
| D-4 | specs → 크롭앱 웹 연동 (`/crop?spec=kr-passport`) | 0.5일 | 막내 |
| D-5 | 성과 측정 (GSC 노출/클릭 추적) | 지속 | 소넷이 |

**산출물**: SEO 완전체 + CITADEL Phase 연계

#### CITADEL SEO 연계점

- CITADEL Phase 1에서 크롭 규격 허브 메타 최적화 완료 (3/26 민아)
- Phase B의 72국 확장이 CITADEL의 "콘텐츠 네트워크 확장" 전략과 직결
- specs 페이지가 블로그·FAQ와 상호 링크되면 사이트 전체 토피컬 권위 상승
- `/specs/{slug}` → `/crop?spec={slug}` → IDPASS 앱 — 풀퍼널 SEO 동선

---

## 완료 체크리스트

- [x] 1-A. 렌더링 엔진 분석 (render-specs.js 666줄 전수)
- [x] 1-B. 데이터 분석 (specs-data.json 26건 전수)
- [x] 1-C. 3소스 갭 분석 (웹/크롭앱/iOS + 2차 검수 114건)
- [x] 1-D. 프로토타입 확인 (디자인 수준 + IDPASS 괴리도)
- [x] 1-E. 경쟁사 벤치마크 (visafoto + passport-photo.online + iVisa)
- [x] 2-A. 페이지 구조 제안 (허브+상세+톤 통일)
- [x] 2-B. 데이터 통합 전략 (단일 정본 + 뷰 레이어)
- [x] 2-C. 콘텐츠 확보 계획 (이미지 5종 + i18n 우선순위 + 국가 Tier)
- [x] 2-D. Phase A~D 로드맵 (4~5주, CITADEL 연계)

---

*이 보고서는 조사+기획 결과입니다. 코딩은 후속 지시서에서 진행합니다.*
