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

### 4-E. 페이지앱 모델 (2026-06-23 작가님 디렉션) ⭐

**핵심 전환**: 앱의 "깊은 퍼널"을 페이지의 "얕은 완결"로 뒤집는다 (PhotoAID 모델).
- 각 `/specs/{type}/{country}` 페이지가 **그 자리에서 완결되는 미니 앱** — 규격 검색 유입자가 **업로드 → 규격 자동 크롭(428건 데이터=크롭 파라미터) → 생성 → 결제**를 페이지 내에서 처리.
- 백엔드는 **Studio 하나**(헤드샷이 이미 포털 직접생성으로 전환한 패턴 재사용). 페이지마다 규격 변수만 다르게 주입.
- **서브디렉토리**(`monkos.ai/specs`)라 monkos.ai 본체 권위에 복리로 누적. 서브도메인 앱(`idphoto-kr/jp`)은 구글이 별개 사이트로 취급 → 자기잠식 약함, 급한 정리 대상 아님(장기 흡수).

**구축 로드맵 (4단계)**:
1. **데이터 기반 중요국 선정** — 감 아닌 네이버 절대검색량 + GSC 노출 순위(예: 한국 운전면허 418·여권 448).
2. **완성형 파일럿** — 중요국 1개에 SEO+GEO+매력 UI+생성위젯 전부 담은 청사진. *파일럿 품질 = 1,500개 복제 품질의 천장.*
3. **패턴화 후 일괄 복제** — 데이터·변수만 다른 복제형 작업. ⚠️ **오늘(6/19 사고) 자동화 영역** → [PROTOCOL_url_slug_safety](../PF_CITADEL/PROTOCOL_url_slug_safety.md)(중복검사·비표준 누락검사·301)를 복제 워크플로우에 필수 적용.
4. **국가 확장** — 1,500 정리 후 확장. **BQ 트래킹**(페이지별 업로드율→생성율→결제율)으로 전환 측정 → 확장 우선순위 결정.

**GEO 우위**: 규격 = "사실 데이터"라 AI 검색(ChatGPT·Perplexity) 인용 최적. llms.txt+구조화데이터로 AI 답변 소스 독점 가능.

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
| 06/26 | iMac/쌍아 | **og:image SEO 개선 + 다운로드 파일명** — 범용 로고→페이지별 규격 이미지(슬러그 우선→사이즈 폴백), JSON-LD Article `image` 필드 추가, 다운로드 파일명 규격별 자동 생성(다국어 분기). xPassportPhoto 경쟁사 벤치마크 + GCP 비용 SKU 분석(나노바나나 ₩169/장 확정) | render-specs.js | ✅ |
| 06/14 | 막내2 | **구조화 데이터 P0 3건 수정** — ① HowTo step[0] `locField()` 경유 전환, ② JA countryName `countryJa` 분기 추가(상세+허브), ③ Article `inLanguage` 추가. portal prod 배포(rev 00288-4kw). curl 3건 실측: EN/JA HowTo 영·일문 전환 확인, inLanguage 정상 | [COMPLETION](../../reports/2026-06/COMPLETION_20260614_iMac막내2_SPECS_구조화데이터_언어분기수정.md) | ✅ |
| 06/15 | 막내1 | **다국어 번역 데이터 P1 보강** — validity(9건)/fileSpec(22건)/headHeight(18건) EN/JA 소급 번역. 커버리지 100% 달성. 패턴 기반 일괄 변환 스크립트 작성 | specs-data.json, scripts/translate_specs_fields.js | ✅ |
| 06/15 | 막내3 | **1,335페이지 전수 품질 감사** — 3언어×445건 라이브 curl 실측. 🔴 FAQPage 436건 누락, seoTitle 442건 공란, JA 한국어 잔류 21p/74건. 🟡 JA thin content 219건(49%), EN 한국어 3건. 기술 인프라(canonical·hreflang·HTTP) 전수 정상. 색인 장애 근본원인: 콘텐츠 차별화 부족+FAQ 부재+JA 언어혼재 | [REPORT](../../reports/2026-06/REPORT_20260615_iMac막내3_SPECS_1335페이지_전수품질감사.md) | ✅ |
| 06/15 | 막내1 | **공통FAQ·seoTitle·countryJa 일괄 보강** — FAQ 436건 3언어 생성(100%), seoTitle/Desc 442건 3언어, countryJa 26건, JA 한국어 잔류 0건. 색인 장애 R1·R2·R3 해소. rev 00290-65g 배포 | specs-data.json, scripts/enrich_specs_faq_seo.js | ✅ |
| 06/15 | 막내2 | **portal 배포 + 정크 슬러그 3건 리슬러그** — 47-20x/14-vs/5-10 → SEO 친화 영문 슬러그 + 301 리다이렉트. Firestore 변경 + redirects.js. 배포 2회(rev 00293, 00294) | redirects.js, reslug_blog.js | ✅ |
| 06/17 | M2/쌍아 | **specs 상세 디자인 개편 WIP 1차** — 흰색 배경 3분할 구조, CTA 다크 그라데이션, 공통규정 7개, 이모지 제거, 한국인 모델 이미지, 나라별 이미지 대응 | render-specs.js, korea-passport.webp | ⏳ |
| 06/18 | M2/쌍아+꾸 | **specs 상세 디자인 개편 2~4차** — flagcdn 국기, Pretendard, 히어로 개편(ICAO 설명문+커스텀 제목), 크롭도구 플레이스홀더+전후비교, 공통규정 제거(세부통합), 섹션 풀와이드 밴드 분리(idcut.kr 참고), 모바일 반응형, korea-resume 중복삭제, 외교부 기준 콘텐츠 보강(FAQ 8개+상세규정+AIO). 병목: 이미지↔코드 갭, 미리보기 사이클 느림 → specs-preview.sh 생성 | render-specs.js, specs-data.json, 이미지 4장, specs-preview.sh | ⏳ 배포 대기 |
| 06/19 | M2/쌍아+꾸 | **specs 디자인 5차 + 데이터 대규모 정리** — 반려사유 체크포인트, CTA 단일 배너(monkos.ai), 외교부 상세규정 추가, 폰트 업, 포인트색 보라 통일, 크롭 3파트. specs-data 정리: 중복 삭제(444→425건), 단위 통일(mm→cm/inch), headHeight 전수 채움, 나라이름 통일. TSV 1,010행(202국×5종) 생성. 머리사이즈 25건 조사 지시서 발행 | render-specs.js, specs-data.json, 지시서, TSV | ⏳ 지시서 토스 대기 |
| 06/23 | iMac/민아 | **🔴 슬러그 회귀 색인자산 사고 발견·복구** — 6/19 슬러그 통합(국가명→ISO) 시 301 누락으로 색인 URL **120개 404**(운전면허 418노출·여권 448노출 등 레거시 최고권위). render-specs.js 정규화 fallback(canonicalCountry+TYPE_ALIASES) → 102/120 즉시 301 복구. 나머지 18건(halfcard·china-resume)은 convert TYPE_MAP 누락으로 정본 부재였음 규명 → git에서 ISO 복원(kr-halfcard·jp-halfcard·cn-resume, 425→428건) → **120/120 전체 복구**. 404→HTML(noindex). prod 배포·검증 완료. 재발방지 PROTOCOL 정본화(비표준type 누락검사 포함) | [REPORT](../../reports/2026-06/REPORT_20260623_민아_SPECS_슬러그회귀_색인자산손실.md) · [PROTOCOL](../PF_CITADEL/PROTOCOL_url_slug_safety.md) | ✅ |
| 07/04 | iMac/민아+Workflow | **2-티어 가격 확정(작가님) + v2 ko 전면 롤아웃** — T1 ₩2,000 즉시/T2 발급보장 ₩9,900 재포지셔닝. V2 게이트 분리(렌더 isV2Spec/1-seg 직접서빙), 엔진 호환 360건 v2·68건 게이트 제외(감사 P0 보수), 오정보 하드코딩 제거, dev 배포·검증. 결제 미연동 실측(₩2,000 버튼=PG 미호출) → prod 게이트 확정. Workflow 막내 대체 1호(wf_90dbfdb8) | [COMPLETION](../../reports/2026-07/COMPLETION_20260704_iMac민아_SPECS_2tier_v2롤아웃.md) · [DESIGN](../../../tech/designs/2026-07/DESIGN_20260704_specs_2tier_가격체계.md) | ⏳ prod 게이트 대기 |
| 07/04 | iMac/민아+Workflow | **T1 결제 연동 트랙 (막내 대체 2호)** — 토스 direct 실결제(금액 서버 고정·멱등·토큰 Firestore), 생성 API 402 게이트(무료 노출 해소), 레몬 $2 단건 분기+웹훅 fail-closed(P0 보수), v2 3언어화+en/ja 조건부 게이트. jest 43/43, dev rev 00038-7jp. prod 게이트=시크릿 3종+실결제 E2E | [COMPLETION](../../reports/2026-07/COMPLETION_20260704_iMac민아_결제연동트랙.md) · [DESIGN](../../../tech/designs/2026-07/DESIGN_20260704_결제연동트랙.md) | ⏳ 작가님 액션 대기 |
| 07/05 | iMac/민아+Workflow | **v2 GA4 퍼널 계측 이식 (막내 대체 3호, P0)** — 퍼널 6종(spec_select→purchase) v2 인라인 JS 삽입, orderId 단위 purchase 가드(레몬 팝업 2차 결제 언더카운트 리뷰 검출→수정), transaction_id=orderId(토큰 미노출 테스트 강제), 기존 GA4 ID 재사용. jest 51/51(신규 8), dev rev 00039-7jk 검증. 퍼널 0 관찰 국면 종결 코드 준비 — prod 반영은 결제 열차 동승 | [COMPLETION](../../reports/2026-07/COMPLETION_20260705_iMac민아_77마감스프린트.md) | ⏳ prod 게이트 대기 |
| 07/05 | iMac/민아 | **prod 배포 rev 00376-2n7** — 시크릿 2건(LEMONSQUEEZY_VARIANT_SPECS_SINGLE, TOSS_CLIENT_KEY) 주입, 레몬 웹훅 등록, 스모크 전 항목 통과 | — | ✅ |
| 07/05 | iMac/쌍아 | **시크릿 등록 + 결제 E2E 실패 진단** — 작가님 secret.sh로 시크릿 2건 GCP SM 등록. prod E2E 테스트: v2 phase 전환 깨짐(전 phase display:none)으로 ₩2,000 결제 미작동. 민아 진단 협조문 발행 | [ORDER](../../orders/2026-07/ORDER_20260705_iMac쌍아_민아_결제게이트_E2E실패진단.md) | ⏳ 민아 진단 대기 |
| 07/05 | iMac/민아 | **E2E 실패 진단·수정 마감 (쌍아 오더)** — ① "무결제 생성"=402 게이트 이전 구 리비전(00375)에서의 14:17~18 생성 2건으로 판명, 현행 게이트 402 차단 실측(우회 아님) ② "₩2,000 무반응"=compressImage 비동기 체인 user activation 만료→토스 팝업 무음 차단(init 10연발 로그 정합) → persistImage 검수 시점 선행·클릭→startToss 직결 수정 ③ phase none 콘솔값=타 탭 콘솔 추정(신선 로드 정상 실측). jest 51/51, dev 00042 → **prod 00377-tfk** | [COMPLETION](../../reports/2026-07/COMPLETION_20260705_iMac민아_결제게이트E2E실패진단.md) | ⏳ 작가님 재테스트 |
| 07/05 | iMac/민아 | **🎉 T1 결제 라이브 확정 + 2세대 라인 확장 (세션 마감분)** — ① 토스 위젯 전환 후 실결제 E2E 양 게이트 통과(토스 ₩2,000 다운로드까지·레몬 $1.99 생성까지) ② **1결제 1생성 확정**(재생성 3회 폐지 — 룰렛·사다리 역전 차단, 작가님) ③ 헤드샷 T1 직접결제 이식(Workflow 4호)+언어분기 ko 교정+스타일 라벨 용도 중심+중립 CTA 2선택지 동선 ④ specs 크레딧 버튼 6/24 임시 리다이렉트 → 실 크레딧 흐름(즉시생성/충전 복귀) ⑤ JP 크레딧 지급 단선(6/23~) 응급 복원+[글로벌USD통합 기안](../../proposals/PROPOSAL_20260705_민아_레몬크레딧_글로벌USD통합.md). prod 00376→00385 (10배포). UX 추가 연구·발급보장 링크 처분·헤드샷 실결제 E2E 이월 | [세션로그](../../sessions/2026-07/2026-07-05_iMac_민아.md) | ✅ 라이브 |
| 07/07 | iMac/민아 | **크롭 v3 교정 + 신뢰성 2겹 + 가이드 정합 + 재설계 기안** — ① 붕 뜬 배치의 본질 교정(작가님): 헤어끝→**정수리 앵커**(크롭앱 정본 수학), wide 프레이밍 생성(어깨선 동근원 해소), 동일 원본 전후 실증 ② 새벽 실사고(비결정 감지 미스→커버 폴백 출고) → 멀티스케일 재시도+무음 폴백 금지(경보) ③ 가이드 25종 실측 재생성(CROWN=정수리)+프레임 규격 비율 주입+치수 라벨 파싱 수정+모바일 활자 1차 ④ **배경제거 온디바이스 재설계 기안**(IDPASS 순서 이식, Gemini 강등). prod 00403~00408, crop-engine 00002~00004 | [DESIGN](../../../tech/designs/2026-07/DESIGN_20260707_배경제거_온디바이스_재설계.md) · [세션로그](../../sessions/2026-07/2026-07-07_iMac_민아.md) | ⏳ 기안 검토 |
| 07/06 | iMac/민아 | **정사각 게이트 개방 → 410국 체제** (작가님 승인: 크롭 백엔드 자동화로 게이트 근거 소멸) — isEngineCompatibleSpec h/w ≥1.15→≥1.0, +49국(미국 여권·비자 포함) V2+결제 전환. 잔존 제외: 유색배경 16국·비정형 2국. dev 검증(개방·잔존·회귀) → prod 00405 | [세션로그](../../sessions/2026-07/2026-07-06_iMac_민아.md) | ✅ 라이브 |
| 07/06 | iMac/민아 | **규격 크롭 안착 파이프라인 가동** (DESIGN_20260705 실행, 작가님 직접 지시) — Phase 0 실측: 옵션 A(프롬프트 규격 지시) 탈락(얼굴 48~50%, 무반응) → 옵션 B 개량 확정. 순백 배경 전제 **머리끝 픽셀 실측 앵커** v2(해부학 추정의 상단 여백 0mm 밀착 해소), crop-engine `/api/crop-spec` 신설 + Cloud Run 배포(rev 00002, Node22 — navigator 크래시 해소), portal `spec-crop.js` 파서 **428국 중 426국 산출**, specs 생성 = 무보정 2.5-flash + 생성 후 안착(장애 시 커버 폴백, 병렬 예열). 정사각 패딩 중앙정렬 버그 수정. jest 85/85. portal prod 00403 | [세션로그](../../sessions/2026-07/2026-07-06_iMac_민아.md) · [SPEC](../../../tech/specs/crop-engine/README.md) · 커밋 2d886941 | ✅ 라이브 |
| 07/06 | iMac/민아 | **헤드샷 UX 2건 (승계 세션)** — ① "다시 생성"이 재생성 없이 선택 화면만 재노출되던 버그 → 생성 게이트 `startGenerateFlow()` 공용화로 선택 스타일 그대로 즉시 재생성 ② 크레딧 402(취소 회수 후 스테일 잔액) 시 오류 팝업 대신 잔액 갱신+결제 위저드 안내. prod 00396·00399 | [세션로그](../../sessions/2026-07/2026-07-06_iMac_민아.md) | ✅ 라이브 |
| 07/06 | iMac/민아 | **크레딧 단가 정본 + 헤드샷 디자인 정본 이식 (세션 마감분)** — ① **10c = $1 = ₩1,500 확정**(작가님): 1c=₩145 혼재 11파일 일괄 정리(맞춤충전 서버검증 150배수·챗봇 프롬프트·idphoto-kr 상수), 구 "다운로드 70c" 잔재 제거 ② 클로드 디자인 정본(.dc.html) 이식: 실사 카드 4:5·본문 880px·결제 2카드 선택식(₩2,000 vs ₩1,240/컷부터·한 컷 10c 명시)·상태 CTA·3언어. 세로 스트립(img height 속성 vs aspect-ratio)·충전 왕복 초기화(restoreDraft) 등 실사고 4건 해소 ③ **크레딧 충전 실결제 실증**(70c팩→잔액 80c) — KR 3결제경로 전부 실전 가동. portal prod 00387~00393 + idphoto-kr 00200 | [세션로그](../../sessions/2026-07/2026-07-06_iMac_민아.md) | ✅ 라이브 |
| 07/11 | iMac/민아 | **specs 다이어그램 도면형 재구성 + 완성본 매팅 이음매 제거** (경로③ 작가님 캡처 지시) — ① 치수 라벨 428p 전역 결함 해소(45mm 오앵커·35mm/머리높이 클리핑), 사진 230px 확대, 머리높이 밴드 점선+브래킷(규격 수치 산출, US inch 괄호 파싱) ② matteFitPipeline 재배열(영역 매팅→배경 합성)로 패딩 경계 세로줄 구조적 소멸, x/y 독립 스케일 정착. jest 101·dev E2E(RunPod 관통, 경계초과 강제 케이스 세로줄 0)·프로드 스모크 | [COMPLETION](../../reports/2026-07/COMPLETION_20260711_iMac민아_SPECS_다이어그램_매팅이음매.md) · 8ea16343+b5765be0 | ✅ 라이브 (prod 00448) |
| 07/11 | iMac/민아 | **S3 완성 사진 컨테이너 폭 불일치 수정 (3차 보고 진범)** — 구 결제화면 `.v2-pay-preview img max-width:200px`가 완성 사진만 압축, 컨테이너 280px와 어긋나 우측 공백("1:1 프레임" 체감). max-width 명시 초기화. 프로드 합성 실측 280=278+보더. 부수: 무료 쿼터 Firestore 정본 확정·dev 검증 IP 쿼터 공유 문제 → FREE_QUOTA_BYPASS 기안 대상 | COMPLETION 부록 | ✅ 라이브 (prod 00449) |
| 07/11 | iMac/민아 | **대표이미지 26종 전면 재제작 — prof 마스터 1:1 정방 도해** (작가님 지시: 구글 썸네일 포석·세련 팔레트·정수리/턱 실좌표·kr 32mm 여유) — BiRefNet 매팅 1회+crop-engine 106점 좌표+로컬 크롭 27파일, 히어로 도해 내장 모드 전환(CSS 치수 세대 대체), og 자동 승계 | [COMPLETION](../../reports/2026-07/COMPLETION_20260711_iMac민아_SPECS_대표이미지_정방도해26종.md) | ✅ 라이브 (prod 00450) |
| 07/11 | iMac/민아 | **브랜드 도해 1,278장 — 국기+언어별 타이틀+MONKOS.AI 내장** (작가님: 이미지 검색 브랜드 노출) — 슬러그×3언어 전환, flagcdn 202국, 렌더러 {slug}_{lang} 우선(히어로 v1/v2·og·JSON-LD), 크롭 캐시 150s 생성 | COMPLETION 부록 | ✅ 라이브 (prod 00451) |
| 07/11 | iMac/민아 | **히어로 듀오 UX 개편** (작가님 피드백 6건) — 이미지·수치 박스 분리(웹 좌수치/우이미지·모바일 이미지 우선), 수치 박스 탭(규격/상세규정/반려사유, 하단 섹션 폐지), 공식 출처 링크 노출(60건), 모바일 압축, 업로드 예시 삭제, 동일규격 롤다운 | [COMPLETION](../../reports/2026-07/COMPLETION_20260711_iMac민아_SPECS_히어로듀오_UX개편.md) | ✅ 라이브 (prod 00452) |
| 07/11 | iMac/민아 | **브랜드 도해 v4 — 썸네일 가독 개편** (작가님 "프레임 속 프레임·수치 작음"+쌍아 분석) — 카드 제거·사진 81% 풀사이즈·수치 58~64px 볼드 인셋 오버레이·점선 4px. 1,278장 무코드 교체, GCS·GDrive 동기 | COMPLETION 부록2 | ✅ 라이브 (prod 00453) |
| 07/11 | iMac/민아 | **도해 v5 최종 + 히어로 풀블리드** (작가님: 3단 박스감·신체 위 수치 제거·배색 가득) — 수치 사진 밖 46px 통일, 2단 결, 카드 패딩 0. 1,278장 교체 | COMPLETION 부록3 | ✅ 라이브 (prod 00454) |
| 07/11 | iMac/민아 | **T0 무료 만들기 전면 개방** (작가님: 뿌리고 T1은 파일럿) — 서버 게이트·MATTE_SLUGS 카나리 졸업·isPilot ko 전 슬러그, 하드코딩 5곳 변수화. dev E2E 3유형(표준·정사각·**파랑 배경 첫 실증**) birefnet 관통. T1 리터칭은 파일럿 유지 | [COMPLETION](../../reports/2026-07/COMPLETION_20260711_iMac민아_SPECS_T0전면개방.md) | ✅ 라이브 (prod 00457) |
| 07/11 | iMac/민아 | **T1 파일럿 검증·보완** (쌍아 병렬 활성화와 협조) — 🔴비파일럿 유료카드 오노출 긴급 차단, 프레이밍 게이트 서버 탑재(재생성 1회+폴백 계측), 쌍아 로컬 크롭엔진 env 갭 규명(프롬프트 무죄). 하네스 실증 1차 안착 33.0mm/45.0% | [COMPLETION](../../reports/2026-07/COMPLETION_20260711_iMac민아_T1파일럿_게이트검증.md) | ✅ (prod 00460) — 잔여: 실결제 E2E·ArcFace·피커 UI |
| 07/05 | iMac/막내2 | **V2 전면 배포 전 페이지 렌더 검증** — dev 서버 기동, 주요국 10개+다국어 9건+sitemap 1,284건 전수 curl. V2 phase UI·V1 폴백·OG메타·hreflang 전 항목 PASS. 깨지는 페이지 0건 | [REPORT](../../reports/2026-07/REPORT_20260705_막내2_SPECS_렌더검증.md) | ✅ |

---

## 8. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 자동 생성 페이지 품질 부족 → 구글 thin content 판정 | 중 | Tier 1~2 풀 콘텐츠 우선, Tier 3은 규격 테이블+자동 설명으로 최소 품질 확보 |
| 9개 언어 번역 품질 | 중 | Tier 1은 수동 검수, Tier 2~3은 AI 번역 + 네이티브 스팟 체크 |
| 4,761 URL sitemap 처리 부담 | 낮 | sitemap index 분할 (언어별 sitemap) |
| 기존 26건 URL slug 변경 시 SEO 손실 | 중 | 301 리다이렉트 + slug alias 유지 |
| countries.jsonl 변경 시 specs 페이지 정합성 깨짐 | 중 | 빌드 시점 검증 스크립트 (필수 필드 체크) |
| 07/05 | iMac/막내1 | **V2 전면배포 전 데이터 검증 (1/2)** — 428건 전수: 필수필드 0누락, V2 호환 361건(jp-halfcard bg 표기 보정 +1), 비율부적합 50건·배경부적합 16건·파싱불가 1건 데이터 정상, 슬러그 유효성 전수통과. 깨짐 리스크 없음 확인 | [REPORT](../../reports/2026-07/REPORT_20260705_막내1_SPECS_데이터검증.md) | ✅ |
| 07/05 | iMac/막내2 | **V2 전면배포 전 렌더 검증 (2/2)** — 주요국 10개+다국어 9건 200 정상, V1 폴백 5건 정상, sitemap 1,284건 404 0, OG/메타/hreflang 전수 정상. 깨지는 페이지 없음 | [REPORT](../../reports/2026-07/REPORT_20260705_막내2_SPECS_렌더검증.md) | ✅ |
| 07/05 | iMac/쌍아 | **전체 서비스 트랙 진단 + 규격 크롭 파이프라인 설계** — 5트랙 코드 vs PF 대조 감사, 아키텍처 맵 Canva 생성, V2 규격 크롭 설계서 기안 (AI 배경제거→FaceMesh→DB 크롭, 옵션 A/B/C 실측 선행) | [DESIGN](../../tech/designs/2026-07/DESIGN_20260705_SPECS_V2_규격크롭파이프라인.md) | ⏳ |
| 07/07 | M1/민아 | **배경제거 엔진 교체 트랙 A 코드 완성 (ORDER_20260707)** — IDPASS 순서 이식: 원본 감지·크롭→BiRefNet 매팅→배경색 합성(`lib/matte.js`), Gemini L3 폴백 강등, `MATTE_API_URL` 안전 스위치(미설정 시 현행 유지), 유색 배경 매핑(연회색 9·파랑 4·빨강 1 슬러그). jest 95/95(신규 7). A-3 실측·배포는 4060 기동 대기 | lib/matte.js, server.js, apps/monkos-matte/ | ⏳ |
| 07/07 | M1/민아 | **배경제거 신경로 prod 카나리 투입 (kr-passport)** — RunPod 16GB 엔드포인트(재활성 2~3s·웜 0.7s·₩1-2/건) 생성·실측, matte 체인(4060 예정→RunPod→Gemini L3)+MATTE_SLUGS 카나리 게이트, deploy.sh 정본화(.env 미비 디바이스 빈값 덮임 방지 2종 포함). prod 00409-65j, 실사진 E2E 5규격 통과. jest 97/97 | portal deploy.sh, lib/matte.js, apps/monkos-matte/ | ✅ 카나리 |
| 07/07 | M1/민아 | **birefnet 트랙 첫 실출고 (카나리 5호)** — kr-passport prod에서 IDPASS 순서 전체 작동(원본 감지→크롭 수학 33mm→BiRefNet 매팅 0.7s→합성), 원본 픽셀 보존 실현. 5회 카나리 반복으로 데이터URI 버그·크롭 산식 과대·안착 가드·이중 차감·서빙 체인(RunPod→L4→Gemini) 정비, prod 00409~00414 | 커밋 9f58ab2b~8fb25741 | ✅ |
| 07/07 | M1/막내1 | **Vertex AI Prediction 바우처 검증** — GenAI 크레딧(₩147만) SKU 실측: Gemini API 전용, Custom Container/GPU 미적용 확정. Vertex AI scale-to-zero 조사: 콜드스타트 60~120초+429 에러, 월 ₩18K~72K(RunPod 대비 15~60배). Cloud Run GPU L4 도쿄/서울 미가용. 결론: RunPod Serverless(₩1~2/건) 유지 최적 | [REPORT](../../reports/2026-07/REPORT_20260707_막내1_VertexAI_매팅서빙_바우처검증.md) | ✅ |
| 07/07 | M1/민아 | **크롭정밀도 지시서 완료 — IDPASS 완전 이식 + 규격 안착 시어터** — 측정성 프리체크·DB 수치 428건·fit 가이드(월드 강체 연출)·정본 판정표·실행형 전문가 보정·사후 체크리스트. 카나리 8~11호 반복 교정으로 셀카·와이드·상반신 전 유형 통과 (birefnet+fit 재단 WYSIWYG) | [COMPLETION](../../reports/2026-07/COMPLETION_20260707_M1민아_크롭정밀도_IDPASS이식_비전검수.md) | ✅ |
| 07/08 | iMac/민아 | **OOM→EXIF→오배치 3연쇄 진단 + InsightFace 도입 1단 + 검수 코드화 (a)(b)** — 실측 진단(EXIF 회전 A/B로 FaceMesh 미검출 진범 확정, 크레딧 미환불 2건 발견), SCRFD 사이드카(공식 대비 델타 0.0px)로 검출 교체(Gemini 박스 퇴출), precheck 코드 게이트 전환(하드컷 5종, 7~20s→0.7~3s, 사후 나열 폐지), fit gate 수치 계측(mouthOpen 등). E2E 8/8. 전략 기준서 확정 (무료/2,000/9,900/인화 + idPASS 브랜딩 + 원페이지 분기 + 검수 전면 코드화) | [COMPLETION 1단](../../reports/2026-07/COMPLETION_20260708_iMac민아_InsightFace1단_SCRFD검출.md), [COMPLETION ab](../../reports/2026-07/COMPLETION_20260708_iMac민아_검수코드화_ab.md), [기준서](../../../marketing/strategy/STRATEGY_통과보증AI증명_퍼널재설계.md) | ✅ (쌍아 검토 대기) |
| 07/09 | M1/막내1 | **InsightFace 2단 — 106점 랜드마크로 FaceMesh 교체** — 2d106det 수제 디코드 교차검증 delta 0.0px(3장), 106점 인덱스 오버레이 실측 확정(지시서 추정↔실제 차이 보정), fit-spec 5회 진폭 0px(결정론 확보), portal Gemini 비전 ③ 퇴출. 검출+측량 모두 InsightFace 일원화 | [COMPLETION](../../reports/2026-07/COMPLETION_20260709_M1막내1_InsightFace2단_106랜드마크교체.md) | ✅ 라이브 (crop-engine 00010 + portal 00434) |
| 07/09 | M1/민아 | **fit 좌표 불안정 실측 진단 + 2단 독립 재검증** — 사고 사진 3회 재현(프레임 진폭 7.7%), 근원 분리: SCRFD 결정론 ✅ / FaceMesh 동일 바이트 chinY 26.6px 요동 ❌, Task5 정합 게이트 항등식(≡0.5) 규명 → 2단 지시서 근거 제공. 막내1 완료분 독립 재검증(진폭 0.00px·106점 인덱스 육안 확정·폴백 보존) 배포 승인 권고, 배포 후 프로덕션 5회 재실측 진폭 0.00px 확정. 정정: 턱 바이어스는 과대평가, 진짜 결함 = 비결정 요동 | [REPORT](../../reports/2026-07/REPORT_20260709_M1민아_fit좌표불안정_실측진단.md) · [REVIEW](../../reports/2026-07/REVIEW_20260709_M1민아_InsightFace2단_재검증.md) | ✅ |
| 07/09 | M1/쌍아 | **InsightFace 2단 지시서 + precheck 게이트 강화 지시서 + 무료티어 설계서** — 2단 지시서(6 Task: 106점 교체+Gemini 비전 퇴출) 작성→막내 실행→민아 검증→배포 완료. precheck 게이트 강화(face_ratio 20~50%·위치·과노출·각도→postcheck 이관)+소견 코드화+UX 무언 처리 지시서→막내 실행→배포. T0(무료)/T1(₩2,000)/T2(₩9,900) 3-티어 퍼널 재설계 초안 | [ORDER 2단](../../orders/2026-07/ORDER_20260709_M1쌍아_막내_InsightFace2단_106랜드마크교체.md) · [ORDER precheck](../../orders/2026-07/ORDER_20260709_M1쌍아_막내_precheck게이트강화_소견코드화.md) · [DESIGN 무료티어](../../../tech/designs/2026-07/DESIGN_20260709_무료티어_퍼널재설계.md) | ✅ |
| 07/09 | M1/민아 | **fit 연출 안정화 (작가님 직접 지시, 경로 ③)** — 영상 프레임 실측(43.2s 스파이크 특정): ① 연출 중 스테이지 240→260 무전환 스냅 제거 — 진입 시점에 규격비(CFG.frameRatio, 정본 파서 재사용) 1회 고정 ② 스테이지 배경 #0e1016→#fff — 서버 흰 패딩과 WYSIWYG 정합(줌 경계 순간 노출·패딩 슬리버 흡수). 라이브 마커 4종 검증, fit API 회귀 없음. 작가님 확인: "툭튀는 현상 제거" | 커밋 3cb34d81, portal prod 00435-brv | ✅ 라이브 (작가님 확인) |
| 07/09 | iMac/민아 | **precheck 크기 캡 완화 + 정수리 여백 게이트 (작가님 승인, 경로 ③)** — "너무 가까워요" 과차단 실측(11:41 연속 3건, roll·yaw·조명 정상). 근원: SCRFD bbox=턱~이마라 통상 셀카·규격 크롭 여권사진(bbox 0.53~0.68)이 0.50 캡에 깔림. 수정: 캡 0.50→0.80(위생캡) + 정수리 여백 게이트 신설(5점 kps 눈 미러 crown 추정 −8% 헤어볼륨, crop.js 정본 계수, 추가 API 콜 없음) + crown_cropped 클라 문구. 프로덕션 5케이스 실측: 통상셀카 PASS·규격사진 PASS·타이트 0.637 PASS(구게이트 반려분)·상단절단 REJECT·**머리카락만 잘림 0.487 REJECT(구게이트는 통과시키던 결함)** | server.js + render-specs.js, portal prod 00438-njj | ✅ 라이브 (쌍아 사후 보정 대기) |
| 07/09 | iMac/막내2 | **Head Pose 경량 모델 vs 간접 추정 비교 실측 (R&D)** — 6DRepNet-MobileNetV3s(5.8MB) vs 106점 간접 추정 비교. 간접 추정 pitch MAD 14.48°(불합격), yaw 부호 반전+MAD 13.31°(불합격), roll MAD 0.96°(합격). 모델 간 합의 pitch MAD 2.35°. 채택 권고: 6DRepNet-MobileNetV3s (5.8MB, 4.3ms, pitch/yaw 정밀) | [REPORT](../../reports/2026-07/REPORT_20260709_iMac막내2_HeadPose경량모델_비교실측.md), benchmark.py, ONNX 2종 | ✅ |
| 07/09 | iMac/막내2 | **6DRepNet 사이드카 편입** — crop-engine `/headpose` 엔드포인트 신설, fit-spec 응답에 pose 필드 추가. 배포 완료 (00011→00012) | face_detect_scrfd.py, crop-engine/server.js | ✅ 라이브 |
| 07/09 | iMac/민아 | **6DRepNet pitch 부호/오프셋 검증** — 정면 오프셋 -4.8°±1.0 확인. Phase 2(pitch 미러 보정) 프로드 편향 발견(상단 4.6mm/눈 48%). 중립화 + 원복 권고 | [REVIEW](../../reports/2026-07/REPORT_20260709_iMac민아_6DRepNet_pitch부호오프셋_검증.md) | ✅ |
| 07/09 | iMac/쌍아 | **크롭 앵커 원복 + precheck headpose 제거** — mirrorRatio=1.0, eyeAnchor=0.43 원복. precheck에서 headpose 호출 제거(콜드스타트 15초→~3초). fitSpecGeometry 중복 경로 수정. crop-engine 00016, portal 재배포 | crop.js, portal/server.js | ✅ 라이브 |
| 07/09 | iMac/막내1 | **정수리 추정 선행기술 조사 (특허 근거)** — 핵심 차별점: "촬영 각도 2D 투영 왜곡 실시간 보정 정수리 추산" 선행기술 없음. 특허 청구항 후보 확정 | [REPORT](../../reports/2026-07/REPORT_20260709_iMac막내1_정수리추정_선행기술조사.md) | ✅ |
| 07/09 | iMac/막내2 | **해부학 비율 딥리서치** — 두상 2등분(눈=50%) 해부학 검증 + 인종별 안면 비율 실측(한국인 0.76:1:0.89) + NEUTRAL 값 0.82±0.05 + pitch 역산 수학 검증. Farkas 포함 논문 12건 | [REPORT](../../reports/2026-07/REPORT_20260709_iMac막내2_해부학비율_딥리서치.md) | ✅ |
| 07/09 | iMac/민아 | **pitch 부호/오프셋 검증 완결 + 크롭 변수 2원화 확정** — 수식 무결·부호 확정(양수=턱들기, 통제 3장)·오프셋 비상수(데드존 ±10° 권고)·통과 인구 ±9° 실측. 헤어탑 픽셀 실측으로 필요 미러 계수 포즈별 단조 확정(0.867/0.953/1.026, 작가님 기하 반론 입증). [정정 2건] 배포 공식 방향은 정당(설계 서술이 반대)·헤어탑≠규정 정수리. 최종 구조: 규정 정수리(스케일)=해부학 추정+비율 역산 / 헤어탑(여백)=매팅 알파 직독 / 검증=짧은머리 골든셋. 정밀화 트랙 동결 권고(재개 트리거: 실유입 \|pitch\|>10° 5%↑ 또는 상단여백 실반려) | [REPORT](../../reports/2026-07/REPORT_20260709_iMac민아_6DRepNet_pitch부호오프셋_검증.md) · [REVIEW](../../reports/2026-07/REVIEW_20260709_iMac민아_크롭앵커설계_검토.md) | ✅ (동결 권고) |
| 07/09 | iMac/민아 | **크롭 제약 최적화 설계서 검증 (조건부 통과)** — hard 제약 유도식 검산 일치, 33mm 고정 하 해 항상 존재(축소 루프 불필요), 대머리 폴백 눈 43.3%(현행 동일). F1 로직 오류(볼륨 헤어>7mm에서 폴백 역방향→clamp 한 줄 수정안), F2 cropToSpecV2 범위 누락, F3 헤어 vs 눈 48% 우선순위 작가님 결정 대기, F4 경미 5건 | [REVIEW](../../reports/2026-07/REVIEW_20260709_iMac민아_크롭제약최적화설계검증.md) | ⏳ (F3 결정 대기) |
| 07/09 | iMac/민아 | **무료티어 통합설계 지시서 수행 (Task 1~4)** — 크롭 확정 구조 검증에서 하향 경계 부재 발견(헤어 잘림 발동 불능·볼륨 5mm↑ 어깨 소실), 보완안 = 어깨선 실측 hard(매팅 알파, 작가님 확인 대기). F2 폐기→resolvePlacement 단일화, US 제외 확인, 32~33 조정 조건 미정의. 퍼널 설계서 개정: 총3회/월10회·인화 사다리·문제점만 UI·막내용 기술범위 12건 | [REVIEW](../../reports/2026-07/REVIEW_20260709_iMac민아_크롭최적화_확정구조검증.md) · [DESIGN](../../../tech/designs/2026-07/DESIGN_20260709_무료티어_퍼널재설계.md) | ⏳ (어깨 hard 확인 대기) |
| 07/09 | iMac/막내2 | **3D 얼굴 복원 경량 모델 조사 (R&D)** — 6모델 비교(3DDFA/SynergyNet/PRNet/DECA·FLAME/MediaPipe). 핵심: 경량 ONNX로 정수리 직접 추출 가능 모델 없음. BFM=얼굴만, FLAME=두개골 포함이나 비상용+무거움. PoC 권고: 3DDFA_V2(MIT,7MB,1.35ms) 이마 상단 활용 | [REPORT](../../reports/2026-07/REPORT_20260709_iMac막내2_3D얼굴복원_경량모델조사.md) | ✅ |
| 07/09 | iMac/민아 | **눈 41% 고정·헤어 잘림 전수 진단** — 캐시·배포 아닌 수학적 필연(폴백 상수의 스케일 불변) 규명. 근본 원인 = hairTop 실측 입력 리포 전체 부재(밴드 확장 미구현). 잠복 버그 4건(어깨 천장 부재·헤어 포기 crown0·float 비교·로직 중복). 수정 = 최종 산식 resolvePlacement 구현, fit 프리뷰 입력만 작가님 결정 대기 | [REVIEW](../../reports/2026-07/REVIEW_20260709_iMac민아_눈41고정_전수진단.md) | ⏳ (프리뷰 입력 결정 대기) |
| 07/09 | iMac/민아 | **규격별 프리뷰 최적수치 사전 산출** — 방법론 3단계(환산계수·밴드 균형·어깨/명문 검증) 정립. 반명함 밴드 4.0/눈 42.5%, 미국 여권 32mm/눈 38.2%(하단 31.5mm 명문 중앙), 일본 34mm 검토 항목화. previewBandMm 필드 저장 권장 | [REPORT](../../reports/2026-07/REPORT_20260709_iMac민아_규격별_프리뷰최적수치.md) | ✅ |
| 07/09 | iMac/쌍아 | **크롭 제약 최적화 구현 + 프리뷰 45% 앵커 라이브** — HAIR_VOLUME_RATIO 8% 제거, clamp 배치 도입(topMax=정수리 잘림 금지), cropToSpecV2 폐기→cropToFrame 통합, formats.js mm 필드 추가, topMin 제거(41% 고정 해소), 프리뷰 눈 45%(상단 3.75mm/하단 8.25mm) 작가님 실사 검증 통과. crop-engine rev 00020 | crop.js, formats.js | ✅ 라이브 |
| 07/10 | iMac/민아 | **IDPASS 통합 설계 제안 제출** — 퍼널 개정(무료 선진행→땡큐 업셀, §2-1 분기 이동), 화면 위계(수치 뱃지 제거·판정 1줄·T1/T2 카드·크레딧 강등), T1 상품 정의(AI 리터칭 임베딩 게이트·AI 규격 검수 표기·익명 존 24h 삭제), 회원 존(T2=마이페이지)·로그인 혜택 스택, 비교 프리뷰 3중 구조(₩50 클릭 게이트), 앱 이관 퍼널 폐지(앱=리텐션 카드), IDPASS 브랜딩 2층 구조(ch8 접점), 배너 시스템·디자인 산출물 분장. 부수: 45~48% 가변 비권장 소견, spec-judge 밴드 경계 노랑, 발급보장 각주 중복 렌더 버그 | [PROPOSAL](../../proposals/PROPOSAL_20260710_민아_IDPASS통합설계.md) | ⏳ (작가님 승인 대기) |
| 07/10 | iMac/민아 | **kr-passport 파일럿 E2E 실행 (경로③ 작가님 직접 지시)** — T0 무료 퍼널 라이브(dev rev 00083): 게이트 3분기+Firestore 원자 쿼터(개인3·전역300/일)+매팅 전용(Gemini 차단), S1 판정1줄+무료CTA, S3 땡큐 위계(T1/T2 카드·10c 슬롯), 가독성 토큰. 버그: K1 각주중복·K2 밴드경계(실증)·쿼터우회 HIGH·에러무음·10c복귀404 등 8+3건 수정. 워크플로우 33 에이전트 정찰+적대리뷰. T0 실주행 2회 성공(웜 6.2s). prod 미승격 — 작가님 게이트 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260710_iMac민아_IDPASS_krpassport_파일럿E2E.md) · b697aaff+2713485e | ⏳ (실기기 체감→prod) |
| 07/10 | iMac/막내1 | **crop.js 적대검증 확정 2건 수정 (B5·R1)** — resolvePlacement 단일화(배치 수학 정본 1곳·45% 앵커 상수 1곳), cropToSpecV2 주입 스펙 존중(427 슬러그 오규격 해소), cropToFrame 모듈상수 33/45→스펙 필드(id_kr 26/40 정합). 회귀 하네스 16/16(kr-passport 전 경로 출력 비트 동일)+jest 8/8. 배포 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260710_iMac막내1_SPECS_크롭엔진B5R1수정.md) | ✅ (배포 대기) |
| 07/10 | iMac/막내2 | **portal 정찰 적대검증 확정 3건 수정** — ① POST 핸들러 세션 식별 복원(쿠키 파싱 메서드 무관화 — 서버측 trackEvent sessionId/ipCountry 공백 봉합), ② /api/idphoto/generate 환불 게이트 전구간 확장(refundGate 예약 — normalizeImage·cropToSpec 등 비보호 throw 시 과금+무산출 봉합, 무료/토큰/크레딧 3게이트 일원화), ③ matte 안착 가드 눈창 33~58→40~48 정본 정렬(비-fit 경로 blocked 출고 차단, spec-judge 정본 수치). jest 10스위트/101 전체 통과(사전 실패 render-specs-v2-ga mock 보정 동승). 배포 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260710_iMac막내2_SPECS_정찰3건수정_144934.md) | ✅ (배포 대기) |
| 07/10 | iMac/민아 | **T1 상품·의상 피커 확정 스펙 제출** — 사다리 확정(T1 ₩2,000: 조명·자세·피부·헤어(드라이 정돈) 기본+의상 선택 / T2: 발급보장+고화질 원본), 나노2 고정(i2i 의상합성 우위), 의상 피커 스키마(투톤 팔레트·남녀·종류·업로드, 벤더형 필드=커머스 시험 모델), 정체성 게이트(ArcFace 탑재=활성화 선행, 공식 B/A 페어 임계 캘리브레이션), 헤드샷 공용 컴포넌트, 모바일/웹 분기. 기술 실증: 통합보정 v1·의상 i2i 합성·재크롭 무결(하네스 3회) | [PROPOSAL](../../proposals/PROPOSAL_20260710_민아_T1의상피커_확정스펙.md) | ✅ 쌍아 설계 완료 |
| 07/10 | iMac/쌍아 | **IDPASS 데이터 스키마+의상 피커 설계서 완료** — §0 상위 원칙(개인 휘발/스타일 자산), GCS 4트리(idpass/idphoto/headshot/assets), Firestore generations 스키마, 보관 정책 확정(비가입24h/T0 90일/T1 1년/T2 영구), 의상 피커 커머셜DB 대응 태그(gender/category/neckline/fit/material/color/season/formality/age_range/trend_tags), 프리셋 32종 그릇·12종 런칭, accessory 필드 분리(tie), 벤더 슬롯 선탑재. 민아 교차검증 8건 전량 반영 → 쌍아·민아 합의 완료 | [DESIGN](../../tech/designs/2026-07/DESIGN_20260710_IDPASS_데이터스키마_의상피커.md) | ✅ 합의 — T1 프롬프트 확정 후 지시서 |
| 07/12 | iMac/민아 | **공유 의상 피커 종합 설계+v1 구현+시현 (경로③ 작가님 직접 지시)** — 설계서(카테고리=공유 단위·use_case 조회, 버킷 정합 실사: 자산=monk-ai-images/assets/attire 정정 제안, JSON→Firestore 성장, 벤더 공개/비공개 분리, CITADEL 4노출면) + attire-presets.json 정본(32종 그릇·런칭 12종·아이템별 attire_desc=데이터·3언어) + AttirePicker 컴포넌트(의존성0, 스와치→썸네일 자동 전환, 기본값 0단 통과, 로드 실패 자체 은닉) + demo.html 실주행 시현(데스크톱/모바일·ja·빈세트 강등·콘솔 에러 0). 🔀 병렬 발견: 쌍아 조합형(render-specs +204줄 미커밋) — 무접촉 회피, 수렴 A안 제안(v1 조합형 유지→v1.5 상품컷 시점 편입) | [COMPLETION](../../reports/2026-07/COMPLETION_20260712_iMac민아_공유의상피커_설계구현.md) · [PROPOSAL](../../proposals/PROPOSAL_20260712_민아_의상피커_수렴경로.md) | ⏳ (수렴 A안 작가님 판단) |
| 07/12 | iMac/민아 | **v1.5 샘플링 — 상품컷 4종 생성·에셋 적재·카드형 시현 (작가님 지시)** — 나노2 고스트 마네킹 4컷(남 차콜정장/셔츠+네이비타이·여 차콜정장/화이트블라우스, 각 ~11s) → gs://monk-ai-images/assets/attire/ 적재 + cwebp 썸네일(2~6KB) + 스키마 배선 + 카드형 칩 자동 전환(atp-has-thumb) 데모 시현. 검수 1건: 블라우스 티셔츠 오생성 → attire_desc 정본 보강("woven, NOT a t-shirt") 후 합격 — T1 실합성 동일 오해 예방. 생성기 도구 승격(tools/attire-assets). 잔여 8종+작가님 최종 검수 = v1.5 전환 조건 | [COMPLETION 부록](../../reports/2026-07/COMPLETION_20260712_iMac민아_공유의상피커_설계구현.md) | ✅ (작가님 검수 대기) |
| 07/12 | iMac/민아 | **render-specs 퍼널 분리 수술 (경로③ 작가님 직접 지시·쌍아 사후 추인 대기)** — 4,163줄→1,749줄(-58%), 인라인 CSS 3블록+클라 JS 2블록을 정적 5파일로 기계 추출(비트 보존·보간 3라인만 전역화), kr-passport HTML 127→36KB(gzip 34→10.3), specs-* 정적 immutable 캐시+K_REVISION 버스트. 검증 5축: HTML diff 4줄 정합·jest 103/103·실주행(그리드 32장·콘솔 0)·캐시 헤더·병렬 트랙 무결. 15언어 크롤 218→66MB/회전 — **en·ja 개방 선행 조건 충족**. 막내1 금일 작업 전량 보존 | [COMPLETION](../../reports/2026-07/COMPLETION_20260712_iMac민아_렌더퍼널분리.md) | ⏳ (쌍아 추인·dev 배포 동승) |
| 07/14 | M1/민아 | **헤드텀 v2(prod 00462) 라이브 정합 검증 — 11항 전항 통과 ✅** — 3언어 title 공식·publisher MONKOS·dateModified 동적·PropertyValue 3종·GEO 요약문·DS-160 서브텀·hreflang/canonical·1-seg 301·CSS 이스케이프 0 실측. 미세 잔여 2건(en desc "United States"·ko 단위 목소리) P3. **4주 게이트 베이스라인 적립**(en 침해 잔존 1건·1/2-seg 분산·소국 롱테일 pos, 판정 ~8/10). 🔴 병행 발견: T1 결제 관통 GA4 계측 갭(작가님 7/13 실결제 무흔적·purchase 전기간 0) — 쌍아 지시서 제안 | [REPORT](../../reports/2026-07/REPORT_20260714_M1민아_GSC_GA4동향_헤드텀v2정합.md) | ✅ |
| 07/14 | M1/막내2 | **T1 결제 계측 복구 — H1 확정(toss-success gtag 부재) + H2 beacon 보강** — `/toss-success` HTML에 gtag+purchase 이벤트 배선, begin_checkout에 transport_type:beacon 추가. prod rev 00465 배포. jest 10/10, 3언어 회귀 무결 | [COMPLETION](../../reports/2026-07/COMPLETION_20260714_M1막내2_T1결제계측_원인추적_배선복구.md) | ⏳ 작가님 실결제 재검증 |
| 07/14 | M1/막내1 | **headshot.js begin_checkout beacon 보강** — 막내2 지시서 수행 보충, headshot.js에도 동일 beacon 처방 적용. prod rev 00466 재배포. jest 103/103 전 통과 | 동일 COMPLETION 보강 | ✅ |
