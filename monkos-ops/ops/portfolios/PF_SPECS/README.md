---
type: portfolio
id: PF_SPECS
name: SPECS
subject: 글로벌 증명사진 규격 허브 — 9개 언어 × 320문서 = 3,500+ 페이지 SEO/GEO 자산
created: 2026-05-22
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
---

# PF_SPECS — 글로벌 증명사진 규격 허브

> 각 국가·문서별 규격 페이지 자체가 콘텐츠가 되고, SEO/GEO 최적화로 구글 검색 백링크로 작동하며, IDPASS 앱과 상호 연동하는 채널.
> 9개 언어 × 320문서 = ~3,500 페이지 색인 목표.

---

## 1. 비전

**"202개국 증명사진 규격의 글로벌 정본 — 검색하면 MONKOS가 나온다"**

### 왜 이것을 하는가

- 증명사진 규격 검색 수요는 전 세계적으로 상시 존재 (여권 갱신, 비자 신청, 취업)
- 경쟁사(visafoto, passport-photo.online)는 200국+ 페이지로 SEO 트래픽 확보 후 유료 전환
- MONKOS는 규격 데이터 320문서(202국)를 이미 보유하나, 웹 스펙스 페이지는 26건에 불과
- 템플릿 자동 생성으로 3,500+ 페이지 색인 → 오가닉 트래픽의 구조적 기반
- specs 페이지 → IDPASS 앱 / AI 증명사진 앱으로의 전환 퍼널

### 핵심 전략

1. **컨텐츠 = 규격 페이지 자체** — 각 페이지가 독립적 검색 진입점
2. **SEO/GEO 최적화** — 9개 언어 × 구조화 데이터(JSON-LD) × hreflang
3. **백링크 자산** — 공식 출처 인용 + 정확한 데이터 = 자연 백링크 유도
4. **앱 연동 채널** — specs 페이지 → "이 규격으로 크롭" → IDPASS 앱 딥링크

### 성공 지표

| 지표 | 현재 | 4주 목표 | 12주 목표 |
|------|------|---------|----------|
| specs 페이지 수 | 81 URL (26건×3언어) | 1,000+ | 3,500+ |
| GSC 색인 수 | 측정 필요 | 500+ | 2,000+ |
| specs 오가닉 클릭/주 | ~8 | 50+ | 200+ |
| specs → IDPASS 앱 전환 | 0 | 측정 시작 | 1%+ CTR |

---

## 2. 현황 진단

### 2-A. 데이터 소스 현황 (3소스 분리 — 정본 단일 원칙 위반)

| 소스 | 위치 | 국가 | 문서 | 언어 | ID 체계 | 강점 | 약점 |
|------|------|------|------|------|---------|------|------|
| specs-data.json (웹) | `portal/lib/cms/` | 13국 | 26건 | ko/ja/en | slug (`korea-passport`) | SEO 콘텐츠 (FAQ/반려/상세) | 크롭 파라미터 없음, 26건뿐 |
| specs-data-v2.json (크롭앱) | `crop-app/data/` | 15국 | 28건 | ko/ja/en | slug | 공식 출처 URL, aiRestriction | SEO 콘텐츠 없음 |
| countries.jsonl (iOS 정본) | `MonkosCrop/Resources/` | 202국 | 320건 | ko/ja/en | ISO (`kr-passport`) | 202국 커버리지, 대륙 분류, 등급(A/B) | SEO 콘텐츠 없음, 공식 URL 없음 |

**교차 불일치 사례**: 인도 여권 — 웹 35×45mm vs 크롭앱 51×51mm

### 2-B. 웹 스펙스 페이지 현황 (monkos.ai/specs)

| 항목 | 현황 |
|------|------|
| 렌더러 | `render-specs.js` (666줄, SSR) |
| 페이지 수 | 26건 × 3언어 = 81 URL |
| JSON-LD | Article + FAQPage + HowTo 트리플 스택 ✅ |
| hreflang | ko/ja/en/x-default 4개 ✅ |
| 이미지 | SVG 실루엣 플레이스홀더 ❌ (실사 전무) |
| 콘텐츠 충실도 | 한국 여권만 풀, 나머지 스켈레톤 |

### 2-C. 경쟁사 벤치마크

| 항목 | visafoto.com | passport-photo.online | MONKOS (현재) |
|------|-------------|----------------------|---------------|
| 페이지 수 | 200국+ | 200국+ | **26건** |
| 이미지 | Before/After 실사 | 규격 다이어그램+프로세스 | SVG 플레이스홀더 ❌ |
| 언어 | 20개+ | 영어 중심 | 3개 (ko/ja/en) |
| 가격 | 유료 ($2~$11) | 유료 | **완전 무료** ★ |
| 앱 연동 | ❌ | iOS/Android | **IDPASS** (구축 중) |

### 2-D. IDPASS 앱 데이터와의 관계

- IDPASS(PF_CROP)의 `countries.jsonl`이 320문서 202국의 **가장 완전한 데이터**
- 이 데이터를 specs 페이지의 정본으로 활용
- 앱에서 보여주는 규격 정보와 웹 specs 페이지의 정보가 **동일 정본에서 파생** → 정합성 보장

---

## 3. 언어 전략 (9개 언어)

| # | 언어 | 코드 | 근거 | 인터넷 사용 비중 |
|---|------|------|------|----------------|
| 1 | 한국어 | ko | 본진, SEO 메인 | 1.0% |
| 2 | 영어 | en | 글로벌 기본 | 25.9% |
| 3 | 일본어 | ja | idphoto-jp 연동 | 2.6% |
| 4 | 중국어 (간체) | zh | 인구 1위, 비자 수요 | 19.4% |
| 5 | 스페인어 | es | 20개국 사용 | 7.9% |
| 6 | 프랑스어 | fr | 아프리카 30개국+ | 3.3% |
| 7 | 독일어 | de | EU 경제 1위 | 2.0% |
| 8 | 포르투갈어 | pt | 브라질+포르투갈 | 3.7% |
| 9 | 아랍어 | ar | 중동 14국 | 5.2% |

**합계: ~71% 인터넷 사용자 커버**

### 볼륨 산출

| 페이지 유형 | 건수 | ×9언어 | 소계 |
|------------|------|--------|------|
| 문서별 상세 | 320 | ×9 | 2,880 |
| 국가 허브 | 202 | ×9 | 1,818 |
| 대륙 허브 | 6 | ×9 | 54 |
| 메인 허브 | 1 | ×9 | 9 |
| **합계** | | | **4,761** |

### 번역 범위

| 콘텐츠 유형 | 번역 필요 | 비고 |
|------------|----------|------|
| 규격 수치 (사이즈/DPI/px) | ❌ 숫자 | 전 언어 동일 |
| 국가명·문서명 | ✅ 단어 | i18n 사전 (1회 구축) |
| FAQ | ✅ 문장 | Tier 1 수동, Tier 2~3 AI 번역+검수 |
| 반려 사유 | ✅ 문장 | 동일 |
| 촬영 가이드 | ✅ 문장 | 공통 템플릿 (국가 특이사항만 분기) |
| seoTitle/Description | ✅ 문장 | 검색량 기반 키워드 최적화 |
| UI 라벨 (허브/필터) | ✅ 단어 | 30개 내외 |

---

## 4. 아키텍처 설계

### 4-A. 단일 정본 구조

```
[정본: countries.jsonl (iOS/앱 데이터)]
  │
  ├─ 규격 수치 (size/px/dpi/head/background)
  ├─ 대륙 분류 (continent)
  ├─ 등급 (A/B/C/X)
  ├─ ISO alpha-2 ID
  │
  + [SEO 확장: specs-seo.json (웹 전용)]
  │   ├─ seoTitle / seoDescription (9언어)
  │   ├─ FAQ (9언어)
  │   ├─ rejectionReasons (9언어)
  │   ├─ details (9언어)
  │   ├─ officialSource URL
  │   ├─ aiRestriction
  │   └─ ogImage
  │
  = [렌더 시점 병합]
      ├─→ render-specs.js (SSR, monkos.ai/specs)
      ├─→ IDPASS 앱 (countries.jsonl 직접 사용)
      └─→ 크롭앱 웹 (import하여 프리셋)
```

**핵심 원칙:**
- `countries.jsonl`이 규격 수치의 **유일한 정본** (PF_CROP에서 관리)
- `specs-seo.json`은 SEO 콘텐츠 확장 레이어 (PF_SPECS에서 관리)
- 렌더 시점에 두 파일을 병합하여 페이지 생성
- 기존 specs-data.json, specs-data-v2.json은 **폐기** (정본 이관 후)

### 4-B. URL 구조

```
monkos.ai/specs                          → 메인 허브 (9언어)
monkos.ai/specs/asia                     → 대륙 허브
monkos.ai/specs/korea-passport           → 문서 상세 (ko, 기본)
monkos.ai/en/specs/korea-passport        → 문서 상세 (en)
monkos.ai/ja/specs/korea-passport        → 문서 상세 (ja)
monkos.ai/zh/specs/korea-passport        → 문서 상세 (zh)
monkos.ai/es/specs/korea-passport        → 문서 상세 (es)
...
```

기존 slug 호환: `korea-passport` → `kr-passport` alias (301 리다이렉트)

### 4-C. 템플릿 자동 생성

```
[countries.jsonl 320문서]
  × [specs-seo.json SEO 콘텐츠]
  × [9언어 i18n]
  × [페이지 템플릿]
  ─────────────────
  = 4,761 페이지 자동 렌더링

SEO 콘텐츠가 없는 문서 → 규격 테이블 + 자동 생성 설명으로 최소 페이지 생성
SEO 콘텐츠가 있는 문서 → 풀 페이지 (FAQ + 반려사유 + 촬영가이드 + 실사)
```

### 4-D. 앱 연동

| 연동 | 방향 | 구현 |
|------|------|------|
| specs → IDPASS | 웹 → 앱 | "이 규격으로 크롭" CTA → 앱 딥링크 / 앱스토어 링크 |
| IDPASS → specs | 앱 → 웹 | 규격 선택 시 "공식 규정 보기" → specs 페이지 링크 |
| specs → AI 증명사진 | 웹 → 웹 | "AI로 촬영하기" CTA → idphoto-kr/jp |
| specs → 블로그 | 웹 ↔ 웹 | 상호 내부 링크 (CITADEL 콘텐츠 네트워크) |

---

## 5. Phase 로드맵

### Phase 1 — 데이터 통합 + 템플릿 기반 (1주)

> 3소스 → 단일 정본 구조 전환. 320문서 렌더링 가능 상태 달성.

| # | 작업 | 담당 |
|---|------|------|
| 1-A | specs-seo.json 스키마 확정 (기존 26건 SEO 콘텐츠 이관) | 쌍아 |
| 1-B | 기존 specs-data.json + v2 → specs-seo.json 병합 스크립트 | 막내 |
| 1-C | render-specs.js를 jsonl + specs-seo.json 이중 소스로 전환 | 막내 |
| 1-D | 320문서 전체 최소 페이지 자동 생성 확인 | 막내 |
| 1-E | URL slug 매핑 (기존 26건 → ISO alpha-2 alias) | 막내 |
| 1-F | 기존 specs-data.json, v2 파일 폐기 선언 | 쌍아 |

**산출물**: 320문서 × 3언어 = 960 URL 렌더링 가능

### Phase 2 — 9개 언어 확장 + 허브 리디자인 (1~2주)

> 3언어 → 9언어 확장. 허브 페이지 대륙별 분류. sitemap 대량 생성.

| # | 작업 | 담당 |
|---|------|------|
| 2-A | i18n 인프라 9개 언어 확장 (render-specs.js + UI 라벨) | 막내 |
| 2-B | 국가명·문서명 9개 언어 사전 구축 | 막내 (AI 번역 + 검수) |
| 2-C | 허브 페이지 리디자인 (대륙별 탭 + 검색 + 인기 규격) | 막내 |
| 2-D | 국가 허브 페이지 (202국 각각) | 막내 |
| 2-E | hreflang 9개 언어 + x-default 설정 | 막내 |
| 2-F | sitemap 4,761 URL 자동 생성 + GSC 제출 | 막내 |

**산출물**: ~4,761 URL + GSC 색인 요청

### Phase 3 — 콘텐츠 강화 + 비주얼 (2~3주)

> Tier 1~2 국가 풀 콘텐츠. 실사 이미지. 앱 연동 CTA.

| # | 작업 | 담당 |
|---|------|------|
| 3-A | Tier 1 (5국: KR/US/JP/CA/UK) 풀 콘텐츠 9언어 | 막내 + 철창이(검증) |
| 3-B | Tier 2 (5국: CN/IN/DE/AU/SG) 콘텐츠 확장 | 막내 |
| 3-C | 규격 다이어그램 이미지 자동 생성 (사이즈 패턴별) | 막내 |
| 3-D | Before/After 실사 이미지 (IDPASS 앱 캡처 활용) | 작가님 |
| 3-E | "이 규격으로 크롭" CTA → IDPASS 앱 딥링크 | 막내 |
| 3-F | accent 컬러 #00D4AA 통일 (IDPASS 브랜드) | 막내 |
| 3-G | 공식 출처 URL 섹션 (A등급 국가) | 막내 |

**산출물**: Tier 1~2 10국 풀 콘텐츠 + 비주얼 + 앱 연동

### Phase 4 — SEO 고도화 + 성과 측정 (지속)

| # | 작업 | 담당 |
|---|------|------|
| 4-A | 국가별 seoTitle/Description 검색량 기반 최적화 | 막내 + 민아 |
| 4-B | 블로그 ↔ specs 상호 링크 (콘텐츠 네트워크) | 막내 |
| 4-C | GSC 성과 추적 (색인률, 노출, 클릭, CTR) | 소넷이/민아 |
| 4-D | GEO 최적화 (AI 엔진 인용 확보) | 민아 |
| 4-E | 잔여 Tier 3 (180국+) 콘텐츠 점진 보강 | 막내 |

---

## 6. 관련 PF 연동

| PF | 관계 | 연동 사항 |
|----|------|----------|
| **PF_CROP** | 데이터 정본 제공 | countries.jsonl = 규격 수치 정본. PF_SPECS는 SEO 레이어 담당 |
| **PF_CITADEL** | SEO 전략 공유 | specs 페이지 색인/노출 성과는 CITADEL KPI에 기여. JSON-LD/hreflang 기반 공유 |
| **PF_IDPHOTO** | 전환 퍼널 | specs → "AI로 촬영하기" CTA → idphoto-kr/jp |
| **PF_SPREAD** | 콘텐츠 배포 | specs 페이지 기반 SNS 콘텐츠 (국가별 규격 카드 이미지) |

### PF_CITADEL에서 발췌하는 기능

- specs 허브 메타 최적화 (Phase 1, 03/26 완료) → PF_SPECS Phase 1에서 계승
- specs CTR 개선 (Phase 2.2, 05/14 완료) → PF_SPECS Phase 4에서 계승
- JSON-LD 트리플 스택 (Article+FAQPage+HowTo) → PF_SPECS 기본 탑재
- GSC 색인 요청 프로세스 → PF_SPECS Phase 2에서 계승

### PF_CROP에서 발췌하는 기능

- Phase 1.5 (specs ↔ 크롭앱 연동) → PF_SPECS Phase 3-E에서 구현
- 데이터 정본 관리 (countries.jsonl) → PF_CROP이 계속 관리, PF_SPECS는 소비자
- 05/19 막내2 SPECS 리디자인 로드맵 → PF_SPECS Phase 1~4에 흡수

---

## 7. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/26 | 민아+막내2 | specs 허브 7규격×3언어 + JSON-LD + sitemap 24 URL (CITADEL Phase 1) | render-specs.js, specs-data.json | ✅ (CITADEL 계승) |
| 04/25 | 쌍아 | specs ↔ 크롭앱 연동 설계 (PF_CROP Phase 1.5) | PF_CROP README | ⏳ (PF_SPECS로 이관) |
| 05/11 | 막내1 | specs 상위 3건 seoTitle/Description 개선 (CITADEL Phase 2.2) | render-specs.js | ✅ (CITADEL 계승) |
| 05/19 | 막내2 | SPECS 페이지 현황 파악 + 리디자인 로드맵 (666줄 전수 분석, 3소스 갭, 경쟁사 벤치마크, 4Phase) | [REPORT](../../reports/2026-05/REPORT_20260519_막내2_SPECS페이지_현황파악_리디자인로드맵.md) | ✅ (PF_SPECS 기반) |
| 05/20 | 막내1 | D1 IDPASS 스키마 + 데이터 마이그레이션 (202국, 112문서, 5테이블) | seed.sql, migrate-specs.js | ✅ |
| 05/22 | 쌍아 | **PF_SPECS 신설** — 9개 언어 × 320문서 = 4,761 페이지 목표. 단일 정본 구조 + 4Phase 로드맵 | 본 문서 | ✅ |
| 05/22 | 막내3 | **규격 다이어그램 SVG→실 가이드 이미지 교체** — 25장 WebP(600px, 16~21KB) + parseSizeMm 3패턴. 24/26건 매핑, 2건 SVG 폴백. Hero+O/X 영역 적용. 배포 완료 | render-specs.js + images/guides/ 25장 | ✅ |
| 05/25 | 막내1 | **specs-data.json 445건 확장** — 기존 26건 보존 + 419건 추가 (countries.jsonl 기반). 변환 스크립트 작성 | scripts/convert-specs-data.js, specs-data.json (445건) | ✅ |
| 05/25 | 쌍아 | **URL 스키마 확정: 용도→국가** — `/specs/:type/:country` 구조. IDPASS 앱과 동조 (용도 먼저). 기존 slug → 301 리다이렉트 | 설계서: ORDER_20260525_스펙스페이지_리빌드설계.md | ✅ |
| 05/25 | 쌍아 | **15개 언어 확장 확정** — IDPASS 15개 언어와 동조 (기존 9개 → 15개). 445건 × 15언어 = 6,675 URL 목표 | 설계서 반영 | ✅ |
| 05/25 | 쌍아 | **JSON-LD 3종 설계** — L1(CollectionPage) + L2(ItemList) + L3(Article+FAQPage+HowTo). 15개 언어 hreflang | 설계서 반영 | ✅ |
| 05/26 | 막내1 | **허브 리빌드 + 3티어 CTA** — IDPASS 카드 UI(용도→대륙→국가 퍼널), 다크 테마(#05080E), `/specs/:type/:country` URL 전환, 기존 slug 301 리다이렉트, 3단 티어 CTA(무료 활성), 대륙·카드 이미지 10장 WebP. render-specs.js 전면 리빌드 | render-specs.js + images/continents/ 6장 + images/cards/ 4장 | ✅ |
| 06/12 | 웹/민아 | **GEO 보강 표준 확정** (작가님 전략 대화) — 인용 단문 원칙·Product/Offer 스키마 추가·다국어 단계화(KO/EN/JA/ZH 선행, scaled abuse 가드)·인덱싱률 KPI 등재. 05-25 설계의 보강 델타. 꾸 미국비자 정본 템플릿(경로④)부터 적용 | SPEC_20260612_specs_GEO보강표준.md | ✅ |
| 06/14 | 웹/민아 | **사이트맵 재정리 제안** (작가님·쌍아 공동 분석) — 실측: monkos.ai 단일 평면 1,584 URL 중 색인 302(19%)·전 URL lastmod=today·monk.kr specs 크로스도메인 중복(self-canonical). 작가님 결정: **specs 정본=monkos.ai, monk.kr/specs=301**. 단계0 매핑감사→301·canonical→사이트맵 분할→실 lastmod. GA4 측정ID 분리와 묶어 차주 P0 권고 | [PROPOSAL](../../proposals/PROPOSAL_20260614_웹민아_사이트맵재정리_색인복구.md) | ⏳ 쌍아 설계 대기 |
| 06/14 | iMac/막내1 | **사이트맵 재정리 Phase 1 실행** — 매핑 감사(327건 monk.kr↔monkos.ai 대조) + monk.kr 301 역방향 라우팅 보강 + robots.txt specs sitemap 제거 + 사이트맵 인덱스 3분할(static/specs/blog) + lastmod today 박제 해소 | SPECS_URL_MAPPING.md, render-sitemap.js 리팩터, render-specs.js 보강 | ⏳ 배포 대기 |
| 06/20 | iMac/민아 | **specs 상세 "Atlas" 리디자인 시안** (작가님 디자인 파일럿) — 내부코드(render-specs.js 1,590줄)+외부디자인 병렬 파악 → 공식명세서+청사진 컨셉(잉크 히어로↔페이퍼 본문, 시그널 그린 단일 액센트, 보라톤 탈피). HTML 프로토 작성+Chrome 렌더 제시. 부수: Claude Design 6/17 업데이트 전수 검토 + Figma 폐기·디자인 노동 이관 방향 확정 | [프로토](../../../../monkos_AI/portal/_proto/specs-detail-redesign-v2.html) | ⏳ 작가님 방향 판정 대기 |
| 06/14 | monkos-ai/막내 | SPECS 구조화데이터 언어분기 감사 지시서 확인 — 기존 막내2 보고서 확인 완료, 중복 감사 회피 | COMPLETION_20260614_monkos-ai막내_SPECS_구조화데이터_언어분기감사_확인.md | ✅ |
| 06/14 | 막내2 | **구조화 데이터+UI 언어 미분기 전수 감사** — 코드+prod 양축 실측. 🔴P0 3건: ① HowTo JSON-LD step[0] `specData.background` 한국어 하드코딩(EN/JA 890p), ② JA countryName 한국어(438p), ③ Article inLanguage 누락(1,335p). 🟡P1: validity/fileSpec/headHeight EN/JA 번역 커버리지 4~59%. 사이트맵 hreflang 미포함 | [REPORT](../../reports/2026-06/REPORT_20260614_iMac막내2_SPECS_구조화데이터_언어분기감사.md) | ✅ |
| 06/14 | 막내2 | **구조화 데이터 P0 3건 수정** — ① HowTo step[0] `locField()` 경유 전환, ② JA countryName `countryJa` 분기 추가(상세+허브), ③ Article `inLanguage` 추가. portal prod 배포(rev 00288-4kw). curl 3건 실측: EN/JA HowTo 영·일문 전환 확인, inLanguage 정상 | [COMPLETION](../../reports/2026-06/COMPLETION_20260614_iMac막내2_SPECS_구조화데이터_언어분기수정.md) | ✅ |
| 06/15 | 막내1 | **다국어 번역 데이터 P1 보강** — validity(9건)/fileSpec(22건)/headHeight(18건) EN/JA 소급 번역. 커버리지 100% 달성. 패턴 기반 일괄 변환 스크립트 작성 | specs-data.json, scripts/translate_specs_fields.js | ✅ |
| 06/15 | 막내3 | **1,335페이지 전수 품질 감사** — 3언어×445건 라이브 curl 실측. 🔴 FAQPage 436건 누락, seoTitle 442건 공란, JA 한국어 잔류 21p/74건. 🟡 JA thin content 219건(49%), EN 한국어 3건. 기술 인프라(canonical·hreflang·HTTP) 전수 정상. 색인 장애 근본원인: 콘텐츠 차별화 부족+FAQ 부재+JA 언어혼재 | [REPORT](../../reports/2026-06/REPORT_20260615_iMac막내3_SPECS_1335페이지_전수품질감사.md) | ✅ |
| 06/15 | 막내1 | **공통FAQ·seoTitle·countryJa 일괄 보강** — FAQ 436건 3언어 생성(100%), seoTitle/Desc 442건 3언어, countryJa 26건, JA 한국어 잔류 0건. 색인 장애 R1·R2·R3 해소. rev 00290-65g 배포 | specs-data.json, scripts/enrich_specs_faq_seo.js | ✅ |
| 06/15 | 막내2 | **portal 배포 + 정크 슬러그 3건 리슬러그** — 47-20x/14-vs/5-10 → SEO 친화 영문 슬러그 + 301 리다이렉트. Firestore 변경 + redirects.js. 배포 2회(rev 00293, 00294) | redirects.js, reslug_blog.js | ✅ |
| 06/17 | M2/쌍아 | **specs 상세 디자인 개편 WIP 1차** — 흰색 배경 3분할 구조, CTA 다크 그라데이션, 공통규정 7개, 이모지 제거, 한국인 모델 이미지, 나라별 이미지 대응 | render-specs.js, korea-passport.webp | ⏳ |
| 06/18 | M2/쌍아+꾸 | **specs 상세 디자인 개편 2~4차** — flagcdn 국기, Pretendard, 히어로 개편(ICAO 설명문+커스텀 제목), 크롭도구 플레이스홀더+전후비교, 공통규정 제거(세부통합), 섹션 풀와이드 밴드 분리(idcut.kr 참고), 모바일 반응형, korea-resume 중복삭제, 외교부 기준 콘텐츠 보강(FAQ 8개+상세규정+AIO). 병목: 이미지↔코드 갭, 미리보기 사이클 느림 → specs-preview.sh 생성 | render-specs.js, specs-data.json, 이미지 4장, specs-preview.sh | ⏳ 배포 대기 |
| 06/19 | M2/쌍아+꾸 | **specs 디자인 5차 + 데이터 대규모 정리** — 반려사유 체크포인트, CTA 단일 배너(monkos.ai), 외교부 상세규정 추가, 폰트 업, 포인트색 보라 통일, 크롭 3파트. specs-data 정리: 중복 삭제(444→425건), 단위 통일(mm→cm/inch), headHeight 전수 채움, 나라이름 통일. TSV 1,010행(202국×5종) 생성. 머리사이즈 25건 조사 지시서 발행 | render-specs.js, specs-data.json, 지시서, TSV | ⏳ 지시서 토스 대기 |
| 06/23 | iMac/민아 | **🔴 슬러그 회귀 색인자산 사고 발견·복구** — 6/19 슬러그 통합(국가명→ISO) 시 301 누락으로 색인 URL **120개 404**(운전면허 418노출·여권 448노출 등 레거시 최고권위). render-specs.js 정규화 fallback(canonicalCountry+TYPE_ALIASES) → **102/120 즉시 301 복구**(halfcard·china-resume 18건 정본부재로 404 유지). 404→HTML(noindex). prod 배포·검증 완료. 재발방지 PROTOCOL 정본화 | [REPORT](../../reports/2026-06/REPORT_20260623_민아_SPECS_슬러그회귀_색인자산손실.md) · [PROTOCOL](../PF_CITADEL/PROTOCOL_url_slug_safety.md) | ✅ |

---

## 8. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 자동 생성 페이지 품질 부족 → 구글 thin content 판정 | 중 | Tier 1~2 풀 콘텐츠 우선, Tier 3은 규격 테이블+자동 설명으로 최소 품질 확보 |
| 9개 언어 번역 품질 | 중 | Tier 1은 수동 검수, Tier 2~3은 AI 번역 + 네이티브 스팟 체크 |
| 4,761 URL sitemap 처리 부담 | 낮 | sitemap index 분할 (언어별 sitemap) |
| 기존 26건 URL slug 변경 시 SEO 손실 | 중 | 301 리다이렉트 + slug alias 유지 |
| countries.jsonl 변경 시 specs 페이지 정합성 깨짐 | 중 | 빌드 시점 검증 스크립트 (필수 필드 체크) |
