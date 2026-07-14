---
type: report
date: 2026-07-14
device: M1
agent: 막내3
portfolio: PF_CITADEL, PF_SPECS
status: 완료
---

# SPECS 헤드텀·구조화 데이터 전수 검수 + SEO/GEO/AEO 검증 방안

**[2026-07-14 17:45 KST]** M1/막내3 → 작가님

---

## 검수 총평

| 영역 | 결과 | 요약 |
|------|------|------|
| seoTitle 패턴 | ⚠️ 13건 이탈 | "Photo Photo" 이중 표기 7건, 국가명 오류 2건, 언어 오염 3건, 국가명 불일치 1건 |
| seoTitle 길이 | 🔴 en 98% 초과 | en 템플릿 구조적으로 60자 한도 초과. ko/ja는 3건만 초과 |
| seoDescription | ⚠️ 11건 결함 | "photo photo"/"배경 배경" 이중 표기 + 언어 오염 (cn-resume) |
| 카니발리제이션 | 🔴 HIGH 2건 | us-passport↔us-visa, uk-passport↔eu-passport |
| JSON-LD (Article) | ✅ PASS | publisher=MONKOS, dateModified=동적, PropertyValue 정상 |
| JSON-LD (FAQ) | ✅ PASS | 428슬러그 전량 FAQ 보유, 빈 배열 시 정상 필터 |
| BreadcrumbList | ✅ PASS | position 1,2,3 정렬, 언어별 로컬라이즈 |
| hreflang | ✅ PASS | ko/en/ja/x-default 4건 전수 정상, canonical 정합 |
| prod 라이브 12건 | ✅ PASS | 전 URL 200, JSON-LD·hreflang·메타 전항 통과 |

---

## Phase 1: 헤드텀(seoTitle·Description) 검수

### 1-1. 패턴 이탈 건 (13건)

#### 🔴 P0 — 국가명 오류 (데이터 버그, 카니발리제이션 유발)

| # | slug | lang | seoTitle | 이슈 |
|---|------|------|---------|------|
| 1 | `uk-passport` | en | "**Europe** Passport Photo Size..." | 🔴 slug=uk인데 "Europe" 표기. eu-passport와 카니발리제이션 확정 |
| 2 | `de-resume` | en | "**Europe** Application Photo Photo Size..." | 🔴 slug=de인데 "Europe" 표기. ko는 "독일"로 정확. eu-resume과 경쟁 |

#### 🟡 P1 — "Photo Photo" / "写真写真" 이중 표기 (7건)

`resume`, `headshot`, `halfcard` 등 문서 타입명에 이미 "Photo"가 포함된 슬러그에서 발생.

| # | slug | lang | 이슈 |
|---|------|------|------|
| 3 | `usa-headshot` | en | "Profile **Photo Photo** Size" |
| 4 | `eu-resume` | en | "CV **Photo Photo** Size" |
| 5 | `jp-resume` | en | "Resume **Photo Photo** Size" |
| 6 | `kr-halfcard` | en | "Half-size **Photo Photo** Size" |
| 7 | `jp-halfcard` | en | "Half-size **Photo Photo** Size" |
| 8 | `cn-resume` | en | "Resume **Photo Photo** Size" + 한국어 '복수 규격' 오염 |
| 9 | `de-resume` | ja | "応募**写真写真**のサイズ" |
| 10 | `cn-resume` | ja | "履歴書**写真写真**のサイズ" + 한국어 '복수 규격' 오염 |

**원인**: seoTitle 생성 시 `{typeEn} Photo Photo Size` 형태로 Type에 "Photo"가 이미 붙어있는 경우 중복 발생.

#### 🟡 P2 — 언어 오염 (3건)

| # | slug | lang | 이슈 |
|---|------|------|------|
| 11 | `cn-resume` | ko | 중국어 "简历照片", "寸" 혼입 |
| 12 | `cn-resume` | en | 한국어 "복수 규격", 중국어 "寸" 혼입 |
| 13 | `kr-halfcard` | en | "Korea" 단독 사용 (다른 kr-* 슬러그는 "South Korea") |

#### ℹ️ 참고 — 의도적 외국어 사용 (1건)

| slug | lang | 내용 |
|------|------|------|
| `usa-headshot` | ko | "Headshot · LinkedIn" — 검색 타겟팅 의도로 판단, 수정 불요 |

### 1-2. seoTitle 길이 초과 (60자 기준)

| 언어 | 총 건수 | 60자 초과 | 초과율 | 최장 |
|------|--------|----------|--------|------|
| **en** | 428 | **420** | **98.1%** | 95자 (vc-passport) |
| **ko** | 428 | 1 | 0.2% | 64자 (usa-headshot) |
| **ja** | 428 | 3 | 0.7% | 64자 (vc-passport) |

**🔴 구조적 문제**: en 템플릿 `{Country} {DocType} Photo Size & Requirements 2026 — {dims} | MONKOS`이 구조적으로 너무 긺.

**축소 방안 (제안)**:
1. `| MONKOS` 접미사 제거 → -9자 (publisher는 JSON-LD로 충분)
2. `Requirements` → `Rules` → -8자
3. `2026 —` 제거 (dateModified JSON-LD로 대체) → -7자
4. 치수를 Description으로 이동 → 추가 -15~20자

### 1-3. Description 결함 (11건)

| 슬러그 | 유형 | 상세 |
|--------|------|------|
| `cn-resume` (3언어) | 언어 오염 + 치수 누락 | ko/en/ja 모두 중국어 "寸" + 한국어 "복수 규격" 혼입 |
| `de-resume` (3언어) | 이중 표기 | "배경 배경" / "background background" / "背景は明るい背景" |
| `usa-headshot` (en) | "photo photo" | "profile photo photo requirements" |
| `eu-resume` (en) | "photo photo" | "cv photo photo requirements" |
| `jp-resume` (en) | "photo photo" | "resume photo photo requirements" |
| `kr-halfcard` (en) | "photo photo" | "half-size photo photo requirements" |
| `jp-halfcard` (en) | "photo photo" | "half-size photo photo requirements" |

Description 길이는 전 1,284건 160자 이하 — **초과 건 없음**.

### 1-4. 카니발리제이션 위험

| 위험도 | 키워드 | 경쟁 슬러그 | 원인 | 권고 |
|--------|--------|-----------|------|------|
| 🔴 HIGH | "Europe passport photo" | `uk-passport` vs `eu-passport` | uk-passport en이 "Europe" 오표기 | uk-passport en → "UK Passport" 수정 |
| 🔴 HIGH | "US passport/visa photo" | `us-passport` vs `us-visa` | us-passport에 "Passport / Visa" 양키워드 | us-passport에서 "/ Visa" 제거 |
| 🟡 MED | "India visa photo" | `in-visa-bls` vs `in-visa-evisa` | 동일 치수, 한정자만 차이 | 수용 가능 (BLS vs e-Visa 구분 명확) |
| 🟡 MED | "Europe photo" | `eu-resume` vs `de-resume` | de-resume en이 "Europe" 오표기 | de-resume en → "Germany" 수정 |

---

## Phase 2: 구조화 데이터(JSON-LD) 검수

### 2-1. Article JSON-LD — ✅ PASS

| 필드 | 기대값 | 결과 |
|------|--------|------|
| `@type` | Article | ✅ V1(18슬러그) + V2(410슬러그) 전량 |
| `publisher.name` | "MONKOS" | ✅ ch8 브랜딩 준수 |
| `publisher.legalName` | "몽크 스튜디오 (Monk Studio)" | ✅ |
| `dateModified` | specs-data.json mtime 동적 | ✅ `statSync().mtime` 사용, 하드코딩 아님 |
| `inLanguage` | ko/en/ja | ✅ 언어별 정확 |
| `about` (PropertyValue) | size/background/headHeight | ✅ `locField()` 폴백 정상 |

### 2-2. PropertyValue — ⚠️ 경미 4건

4개 슬러그(`usa-headshot`, `eu-resume`, `de-resume`, `cn-resume`)에서 headHeight 값이 `"-"` (대시)로 설정되어 PropertyValue가 빈 의미로 방출됨.

**원인**: `.filter(p => p.value && String(p.value).trim())` 필터가 `"-"`를 유효값으로 통과시킴.
**수정 제안**: `&& p.value !== '-'` 조건 추가 또는 specs-data.json에서 대시를 빈 문자열로 정규화.
**심각도**: Low — 검색 엔진이 무시하는 수준.

### 2-3. FAQPage JSON-LD — ✅ PASS

- 428슬러그 전량 `faqs` 객체 보유 (ko/en/ja 키)
- FAQPage JSON-LD는 `faqs` 배열 길이 > 0일 때만 생성
- `kr-halfcard`: en/ja FAQ 빈 배열 → FAQPage 미생성 (정상 동작, 한국어 오염 없음)

### 2-4. BreadcrumbList — ✅ PASS

- position 1(MONKOS) → 2(규격/Specs/規格) → 3(국가+문서명) 정상
- 이름 로컬라이즈 정상 (ko "규격", en "Specs", ja "規格")

### 2-5. hreflang — ✅ PASS

- 4건 (ko, en, ja, x-default) 전수 정상
- canonical URL = hreflang 자기참조 일치
- URL 패턴: ko=/specs/path, en=/en/specs/path, ja=/ja/specs/path, x-default=ko

### 2-6. V1 vs V2 차이 (참고)

- V1(18슬러그): HowTo JSON-LD 포함 (4단계 가이드) — V2에는 없음
- V2(410슬러그): restrictions 기반 PropertyValue 추가 — V1에는 없음
- 핵심 구조(Article/BreadcrumbList/FAQPage)는 V1/V2 동일

### 2-7. prod 라이브 검증 (12 URL 샘플)

| URL | HTTP | Article | FAQ | Breadcrumb | hreflang | 비고 |
|-----|------|---------|-----|------------|---------|------|
| /specs/kr-passport (ko) | 200 | ✅ | ✅ | ✅ | 4 | 직접 서빙 |
| /specs/us-passport (ko) | 200 | ✅ | ✅ | ✅ | 4 | 301→/specs/passport/us |
| /specs/jp-passport (ko) | 200 | ✅ | ✅ | ✅ | 4 | 301→/specs/passport/jp |
| /specs/cn-passport (ko) | 200 | ✅ | ✅ | ✅ | 4 | 301→/specs/passport/cn |
| /en/specs/kr-passport | 200 | ✅ | ✅ | ✅ | 4 | 직접 서빙 |
| /en/specs/us-passport | 200 | ✅ | ✅ | ✅ | 4 | 301 리다이렉트 |
| /en/specs/jp-passport | 200 | ✅ | ✅ | ✅ | 4 | 301 리다이렉트 |
| /en/specs/us-visa | 200 | ✅ | ✅ | ✅ | 4 | 301 리다이렉트 |
| /ja/specs/kr-passport | 200 | ✅ | ✅ | ✅ | 4 | 직접 서빙 |
| /ja/specs/jp-passport | 200 | ✅ | ✅ | ✅ | 4 | 301 리다이렉트 |
| /ja/specs/us-passport | 200 | ✅ | ✅ | ✅ | 4 | 301 리다이렉트 |
| /ja/specs/cn-passport | 200 | ✅ | ✅ | ✅ | 4 | 301 리다이렉트 |

**12/12 전항 통과.** publisher.name=MONKOS 전수 확인. meta description = seoDescription 일치.

---

## Phase 3: SEO/GEO/AEO 실효성 검증 방안

### 3-1. SEO — 리치 결과 측정

**🔴 중요 변경**: Google FAQ 리치 결과 2026-05 폐기(deprecated). FAQPage 마크업은 유효하나 SERP 리치 결과 표시 중단. GSC FAQ searchAppearance 지원 2026-08 종료.

| 방법 | 도구 | 비용 | 실행성 |
|------|------|------|--------|
| URL Inspection API 배치 | GSC API | 무료 (2,000/일) | ✅ 1,284건 1일 완료 가능 |
| searchAppearance 차원 추적 | GSC Search Analytics API | 무료 | ✅ weekly-dashboard에 편입 |
| 스키마 유효성 크롤 | Screaming Frog | £199/년 | 분기 1회 실행 |

**핵심 지표**:
- Rich Result Eligibility Rate = (URL Inspection PASS) / (전체 URL) × 100
- Search Appearance Impressions = searchAppearance 차원 weekly pull

**⚠️ 제약**: Article(비AMP), BreadcrumbList, Organization은 GSC searchAppearance 필터 없음 — URL Inspection의 binary 판정만 가능.

### 3-2. GEO — AI 검색 인용

| 방법 | 비용 | 정밀도 | 실행성 |
|------|------|--------|--------|
| GA4 커스텀 AI 채널 그룹 | 무료 | 중 (30-65% 포착) | ✅ 즉시 구현 |
| 수동 프롬프트 테스팅 (20쿼리×4플랫폼) | 무료 (주 30분) | 높음 | ✅ 주간 |
| Otterly.ai 자동 모니터링 | $29+/월 | 높음 | 검토 |
| GSC Gen AI 성과 리포트 | 무료 (2026-06 출시) | 높음 | ⏳ API 미출시 |

**GA4 AI 채널 설정 (즉시 실행 가능)**:
- Admin > Data display > Channel groups > "AI Search" 커스텀
- Source regex: `chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|deepseek\.com|meta\.ai`
- AI 리퍼럴 전환율은 오가닉 대비 **4.4배** (업계 데이터)

**llms.txt**: 실측 데이터상 채택률 극히 낮음 (38,000 도메인 중 97%가 요청 0건). 유지하되 측정 대상에서 제외.

**PropertyValue → AI 인용**: 직접 연구 부재. 간접 근거로 구조화 데이터 보유 페이지가 AI Overview 인용 2.3배 높음 (Semrush 2024). 유지 권장, 단독 효과 측정은 불가.

### 3-3. AEO — 음성 검색 / Featured Snippet

| 방법 | 비용 | 실행성 |
|------|------|--------|
| GSC position < 1.0 필터 | 무료 | ✅ weekly-dashboard에 편입 |
| SERP API 검증 (DataForSEO/SerpAPI) | $50+/월 | 검토 |
| 수동 SERP 확인 | 무료 | 주간 spot check |

**speakable 스키마**: US/영어 전용 BETA — monkos.ai (ko/ja 주력)에 **비적용** 권고.

**Featured Snippet 최적화**: FAQ 리치 결과 폐기와 무관하게, Q&A 형식 콘텐츠는 Featured Snippet 트리거에 여전히 유효. H2 질문 + 1-2문장 직답 + 상세 형식 유지 권장.

### 3-4. 측정 파이프라인 설계 초안

```
┌─ 주간 월요일 KST 06:00 ─────────────────────────┐
│ ① GSC searchAppearance 차원 pull (weekly)        │
│ ② GSC position < 1.0 쿼리 추출 (snippet 후보)    │
│ ③ GA4 AI Search 커스텀 채널 세션/전환 pull        │
│ ④ 파생 지표 계산 + 시계열 저장                     │
└──────────────────────────────────────────────────┘

┌─ 월 1회 ────────────────────────────────────────┐
│ ⑤ URL Inspection API 1,284건 배치 (2.5시간)     │
│ ⑥ 수동 프롬프트 테스팅 20쿼리×4플랫폼             │
│ ⑦ Rich Result Eligibility Rate 갱신              │
└──────────────────────────────────────────────────┘

┌─ 분기 1회 ──────────────────────────────────────┐
│ ⑧ Screaming Frog 전체 크롤 (스키마 검증)         │
└──────────────────────────────────────────────────┘
```

**CITADEL 대시보드 추가 지표**:

| 축 | 지표 | 소스 | 주기 |
|-----|------|------|------|
| SEO | Rich Result Eligibility Rate | URL Inspection API | 월 |
| SEO | searchAppearance 노출 추이 | GSC API | 주 |
| GEO | AI 리퍼럴 세션 수 | GA4 커스텀 채널 | 주 |
| GEO | AI 리퍼럴 전환율 | GA4 | 주 |
| GEO | AI 인용 점수 (수동) | 프롬프트 테스팅 | 월 |
| AEO | Featured Snippet 후보 쿼리 수 | GSC position<1.0 | 주 |
| AEO | Featured Snippet 비율 | GSC | 주 |

**결과 가시화 타임라인**:
- 1-2주: 측정 인프라 배포 (GA4 채널, GSC API 스크립트)
- 2-4주: 첫 searchAppearance 데이터 도착. 구조화 데이터 Google 인식 1-3주
- 4-8주: 리치 결과 SERP 노출 시작. 초기 AI 인용 확인 가능
- 2-3개월: 신뢰할 수 있는 추세 분석 가능
- 6개월+: 장기 추세 분석, 전후 비교 신뢰성 확보

---

## 수정 권고 요약 (우선순위)

| # | 심각도 | 대상 | 수정 내용 |
|---|--------|------|----------|
| 1 | 🔴 P0 | `uk-passport` en seoTitle | "Europe" → "United Kingdom" |
| 2 | 🔴 P0 | `de-resume` en seoTitle | "Europe" → "Germany" |
| 3 | 🔴 P0 | `us-passport` seoTitle | "Passport / Visa" → "Passport" (카니발리제이션 해소) |
| 4 | 🟡 P1 | en seoTitle 템플릿 구조 | 60자 이내로 축소 (`\| MONKOS` 제거 등) |
| 5 | 🟡 P1 | 7개 슬러그 en/ja | "Photo Photo"/"写真写真" 이중 표기 제거 |
| 6 | 🟡 P1 | `cn-resume` 3언어 | 언어 오염 수정 (중국어/한국어 혼입 해소) |
| 7 | 🟢 P2 | `de-resume`/`cn-resume` desc | "배경 배경"/"background background" 이중 표기 |
| 8 | 🟢 P2 | 4슬러그 PropertyValue | headHeight="-" → 빈 문자열로 정규화 |
| 9 | 🟢 P3 | `kr-halfcard` en | "Korea" → "South Korea" 통일 |
