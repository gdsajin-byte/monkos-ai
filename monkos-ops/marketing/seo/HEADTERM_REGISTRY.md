---
type: registry
id: HEADTERM_REGISTRY
portfolio: PF_CITADEL
created: 2026-06-19
owner: 쌍아
status: draft
---

# 헤드텀 레지스트리 — CITADEL Phase 2

> 모든 콘텐츠·페이지가 어떤 키워드를 물고 어떤 방향으로 가는지를 추적하는 정본.
> 발행 전 충돌 점검, 발행 후 순위 추적, 자기잠식 재발방지의 단일 참조점.

---

## 1. 운용 규칙

### 발행 게이트 (콘텐츠 1건 신규 발행 시)

1. **타격 키워드 선정** — 이 글/페이지가 노릴 키워드 확정
2. **레지스트리 충돌 점검** — 동일 키워드에 이미 대표 노드가 있는가?
   - 있으면 → 해당 노드와 역할 분리 가능한지 확인 (같은 채널이면 원칙적 금지)
   - 없으면 → 이 노드가 대표로 등록
3. **채널·층위 배정** — specs / blog / idphoto / monk.kr 중 어디에 배치할지 확정
4. **등록** — 레지스트리에 1행 추가 후 발행
5. **추적** — 발행 2주 후 GSC 순위 기입, 이후 월 1회 갱신

### 채널 역할 (6/18 확정)

| 채널 | 도메인 | 키워드 축 | 시장 | 동시노출 |
|------|--------|----------|------|---------|
| **idphoto-kr** | idphoto-kr.monkos.ai | 서비스 헤드텀 ("AI 증명사진") | KR | 포털과 동시 OK (별도 도메인 = 별도 전선) |
| **idphoto-jp** | idphoto-jp.monkos.ai | 일본 서비스 ("証明写真 AI", "就活写真") | JP | 포털과 동시 OK |
| **specs** | monkos.ai/specs/ | 규격 롱테일 (국가별 여권/비자/ID) | KR·JP·**EN** | 단독 |
| **blog** | monkos.ai/blog/ | AI 개발·바이브코딩 교육 (축 전환 후) | KR·EN | 단독 |
| **guide** | monkos.ai/guide/ | 가이드 롱테일 ("증명사진 배경색") | KR·JP | specs 보조 가능 |
| **profiles** *(예정)* | profiles.monkos.ai | AI 헤드샷·프로필 서비스 (B2C+B2B) | **EN**·KR·JP | IDPASS 앱 보조 (웹 SEO) |
| **IDPASS 앱** | App Store / Play | 규격 크롭 + AI 헤드샷 (ASO) | **EN**·KR·JP | 웹과 별도 전선 (ASO ≠ SEO) |
| **monk.kr** | monk.kr | 사진관 브랜드·예약 | KR | 포털과 동시 OK (별도 도메인) |
| **꾸 블로그** | blog.naver.com | 네이버 오가닉 + 외부 백링크 | KR | 포털 보조 |

### 충돌 판정 기준

- **같은 도메인(monkos.ai) 내 같은 키워드** = 자기잠식. 원칙적 금지
- **다른 도메인(idphoto-kr ↔ monkos.ai)** = 독립 전선. 동시 노출 허용 (면적 확장)
- **외부 채널(네이버 블로그 등)** = 백링크 역할. 포털 보조로 허용

### 데이터 소스 위계

| Tier | 소스 | 성격 | 용도 |
|------|------|------|------|
| T1 | 정부 통계·업계 보고서 | 시장 규모 | 전략 판단 |
| T2 | 네이버 데이터랩·검색광고 | 절대 검색량 | 시장 수요 판별 (6/18 교훈: GSC만으로는 눈가리고아웅) |
| T3 | GSC (서치콘솔) | 우리 노출·순위 | 레지스트리 순위 추적 |
| T4 | GA4 | 우리 유입·전환 | 전환 효과 측정 |

> ⚠️ T3(GSC)의 순위 1위도 노출 17이면 무의미. 반드시 T2(절대 검색량)와 교차 확인

---

## 2. 노드 맵 — 한국 (KR)

### 2.1 서비스 헤드텀

| 키워드 | 대표 노드 | 채널 | GSC 순위 | GSC 노출 | CTR | 동시노출 | 비고 |
|--------|----------|------|----------|---------|-----|---------|------|
| AI 증명사진 | idphoto-kr `/` | idphoto-kr | 62→? (6/18 canonical 통일 후 관측 대기) | 14/41일 | 67% | specs OK, **blog 금지** | 6/18 자기잠식 해소 완료. 대표 확정 |
| 증명사진 앱 | idphoto-kr `/` | idphoto-kr | 미측정 | — | — | — | IDPASS 앱 출시 시 재측정 |
| 무료 증명사진 | idphoto-kr `/` | idphoto-kr | 미측정 | — | — | — | 증명한컷 "무료" 타이틀 사용 중 |

### 2.2 규격 롱테일 (specs 전담)

| 키워드 | 대표 노드 | 채널 | GSC 순위 | 비고 |
|--------|----------|------|----------|------|
| 여권사진 규정 2026 | /specs/korea-passport | specs | 8.1 | ✅ 1페이지 |
| 운전면허 사진 규정 | /specs/korea-drivers-license | specs | 7.4 | ✅ 1페이지 |
| 주민등록증 사진 규정 | /specs/korea-id-card | specs | 5.0 | ✅ 1페이지 |
| 반명함 사진 사이즈 | /specs/korea-halfcard | specs | 미측정 | 6/18 resume→halfcard 통합 |

### 2.3 안경·가이드 클러스터 (blog/guide)

| 키워드 | 대표 노드 | 채널 | GSC 순위 | 비고 |
|--------|----------|------|----------|------|
| 취업사진 안경 | /blog/vol36 | blog | **1.6** | ✅ 최상위. 건드리지 말 것 |
| 남자 취업사진 안경 | /blog/vol36 | blog | 4.4 | 동일 노드 |
| 이력서 사진 안경 | /blog/vol36 | blog | 6.5 | 동일 노드 |
| 증명사진 배경색 추천 | /guide/ai-photo 또는 blog | guide | 6.6 | |
| 증명사진 표정 | blog | blog | 8.2 | |
| 남자 증명사진 | blog | blog | 9.2 | 노출 60 |

### 2.4 블로그 축 전환 후 신규 (계획)

| 키워드 | 대표 노드 | 채널 | 상태 |
|--------|----------|------|------|
| 바이브코딩 | (신규) | blog | 미발행. 축 전환 후 첫 타격 |
| AI 개발 일지 | (신규) | blog | 미발행 |
| 1인 AI 회사 | (신규) | blog | 미발행 |

### 2.5 브랜드

| 키워드 | 대표 노드 | 채널 | GSC 순위 | 비고 |
|--------|----------|------|----------|------|
| monkos | monkos.ai `/` | portal | 4.1 | 브랜드 검색 |
| monko ai | monkos.ai `/` | portal | 2.8 | 오타 변형 |

---

## 3. 노드 맵 — 일본 (JP)

| 키워드 | 대표 노드 | 채널 | GSC 순위 | 비고 |
|--------|----------|------|----------|------|
| 就活写真 | /guide/shukatsu | idphoto-jp | 미측정 | L1 랜딩 4/21 신설. 色인 확인 |
| 証明写真 アプリ | /guide/app-comparison | idphoto-jp | 미측정 | |
| 証明写真 AI | /guide/ai | idphoto-jp | 미측정 | |
| パスポート写真 | /specs/passport | idphoto-jp | 미측정 | |
| 運転免許 写真 | /specs/drivers-license | idphoto-jp | 미측정 | |
| 일본 취업 증명사진 | monkos.ai specs/blog | portal | 4.2 | 한국어 검색자 |
| パスポート サイズ 日本 | monkos.ai specs | portal | 6.8 | |

---

## 4. 노드 맵 — 글로벌 (EN)

> **전략 근거**: 6/18 작가님 확정 — "영어권 먼저(결제력·시장)". 앱(IDPASS) = ASO 동등출발이라 웹 SEO 포화 무관. 북미 앱매출 42%, ARPU $140.
> **우리 자산**: IDPASS 애플앱(영어, 이미 보유) + specs 글로벌 1,335페이지 + 크레딧 선불제(경쟁사 1/4 가격)
> **무기**: 정체성보존 90% + 아시아얼굴(12사 전부 서구 베이스, 무주공산) + 원가 ₩100~300/건 + 나노바나나(Remini 검증 엔진)

### 4.1 채널 구조 — EN

| 채널 | 역할 | 검색 유형 | 동시노출 |
|------|------|----------|---------|
| **IDPASS 앱** (App Store/Play) | 서비스 본진. B2C 개인 진입점 | ASO (앱스토어 검색) | 웹과 별도 전선 |
| **profiles.monkos.ai** (예정) | 헤드샷/프로필 전용 웹 랜딩 | 웹 SEO | IDPASS 보조 |
| **specs EN** | 규격 롱테일 (passport/visa/ID photo) | 웹 SEO (현재 진입 중) | 단독 |
| **monkos.ai/blog EN** | AI 개발 콘텐츠 (축 전환 후) | 웹 SEO | 단독 |

### 4.2 서비스 헤드텀 — AI Headshot (시장 본진)

> 시장 규모: 글로벌 AI헤드샷 2026 $410~480M. 경쟁사 12개 전수분석 완료(6/18).

| 키워드 | 월 검색량 | 대표 노드 | 채널 | 경쟁 강도 | 침투 전략 |
|--------|----------|----------|------|----------|----------|
| **professional headshot** | ~49,500 | profiles 랜딩 | profiles | 🔴 극심 (HeadshotPro pSEO 200+) | 웹 SEO 정면 경합 비효율 → **앱 ASO + B2B 우회** |
| **AI headshots** | ~9,900 (성장 300%+) | IDPASS 앱 스토어 | ASO | 🟠 중 (12사 경합) | **$9.9 침투가 + 아시아얼굴 niche + 결제 전 미리보기** |
| **AI headshot generator** | ~5,400 | profiles 랜딩 | profiles | 🟠 중 | pSEO 직군별 랜딩 (HeadshotPro 패턴 복제) |
| **linkedin headshot** | ~3,600 | profiles 랜딩 | profiles | 🟡 중하 | 스타일팩 "LinkedIn" 랜딩 |
| **corporate headshot** | ~2,400 | profiles B2B 랜딩 | profiles | 🟡 중하 | **B2B 사원증 라인 전용 랜딩** |
| **team headshots** | ~1,600 | profiles B2B 랜딩 | profiles | 🟢 낮음 | HeadshotPro만 깊게 파놓음. 틈 |
| **AI headshot free** | ~8,100 | IDPASS 앱 | ASO | 🟠 중 | 무료 체험 1장(10c 증정) → 전환 |
| **best AI headshot** | ~4,400 | profiles 비교 페이지 | profiles | 🟠 중 | 비교 콘텐츠 SEO (BetterPic 패턴) |

### 4.3 규격 롱테일 — Passport/ID Photo (현재 자산)

| 키워드 | 월 검색량 | 대표 노드 | 채널 | GSC 상태 | 비고 |
|--------|----------|----------|------|----------|------|
| **passport photo size** | 200K+ (합산) | /specs/{country} | specs | 433노출/0클릭 (USA 28일) | 1,335 페이지 이미 색인 중 |
| US passport photo | ~40,500 | /specs/us-passport | specs | 미측정 | |
| UK passport photo size | ~14,800 | /specs/uk-passport | specs | 미측정 | |
| Canadian passport photo | ~9,900 | /specs/canada-passport | specs | 미측정 | |
| visa photo size | ~6,600 | /specs/{country}-visa | specs | 미측정 | |
| **ID photo maker** | ~2,900 | IDPASS 앱 | ASO | 미착수 | 앱 진입 키워드 |
| **passport photo app** | ~6,600 | IDPASS 앱 | ASO | 미착수 | |

### 4.4 B2B 헤드텀 (신규 진입 — 해자 구축 대상)

> 6/18 핵심 발견: B2B가 수익 본진(기업 세그먼트 매출 39%). HeadshotPro만 깊게 파놓음 = 선결과제.

| 키워드 | 월 검색량 | 대표 노드 | 채널 | 침투 전략 |
|--------|----------|----------|------|----------|
| **corporate headshots for teams** | ~880 | profiles B2B 랜딩 | profiles | 시트 $3-5 가격 파괴. 경쟁사 $15-31 대비 |
| **employee headshots** | ~720 | profiles B2B 랜딩 | profiles | HR 워크플로 통합(SSO·API·대시보드) |
| **company headshot service** | ~480 | profiles B2B 랜딩 | profiles | 사원증 특화 — 통일 1장이 본질, 물량 군비경쟁 거부 |
| **AI headshots for business** | ~390 | profiles B2B 랜딩 | profiles | 신규입사자 반복크레딧 → 연간 ARR |
| **headshot photography pricing** | ~1,300 | profiles 가격 비교 페이지 | profiles | 원가 비대칭 노출 ($9.9 vs $29-79) |

### 4.5 ASO 키워드 — IDPASS 앱 (App Store / Google Play)

> 앱 = 웹 SEO와 **별도 전선**. ASO 동등출발이라 후발 불이익 없음.

| ASO 키워드 | 경쟁 | 전략 |
|-----------|------|------|
| **passport photo** | 🔴 (AiD, Passport Photo Booth 등) | 무료 크롭 + AI 보정 차별화 |
| **ID photo** | 🟠 | 나라별 규격 자동 감지 |
| **AI headshot** | 🟠 (12사 대부분 웹, 앱 약함) | **틈**: 앱 전용 경쟁사 적음 |
| **resume photo** | 🟡 | 아시아 취업 niche |
| **professional photo AI** | 🟡 | |
| **corporate ID photo** | 🟢 (거의 비어있음) | B2B 앱 진입점 |

### 4.6 경쟁사 pSEO 패턴 — 복제 대상

> HeadshotPro가 검증한 프로그래매틱 SEO 패턴. profiles 출시 시 한/일/영 3개 언어로 복제.

| 패턴 | HeadshotPro 예시 | 우리 복제안 |
|------|-----------------|-----------|
| 직군별 랜딩 | /ai-headshots-for-lawyers, /ai-headshots-for-realtors | profiles/{직군} — 변호사/부동산/의료/금융 |
| 도시별 랜딩 | /headshots-{city} | profiles/{도시} — NYC/LA/London/Tokyo/Seoul |
| 비교 랜딩 | /vs-aragon, /vs-secta | profiles/compare/{경쟁사} |
| 무료 도구 깔때기 | LinkedIn headline generator | LinkedIn 프로필 검사기 / 이력서 사진 체커 |

---

## 5. 금지 조합 (자기잠식 방지)

### KR/JP 금지

| 금지 | 이유 |
|------|------|
| monkos.ai/blog에서 "AI 증명사진" 타이틀/H1 사용 | idphoto-kr 루트가 대표. 6/18 해소 완료. 재발 금지 |
| monkos.ai/blog에서 증명사진 규격 신규 발행 | specs 채널 전담. 블로그 축 = AI 개발/바이브코딩 |
| 같은 specs 키워드로 guide 페이지 추가 신설 | specs가 대표. guide는 보조(기존 것만) |
| idphoto-kr 내 /app 경로로 신규 SEO 신호 발송 | /가 대표. canonical 통일 완료 |

### EN 금지

| 금지 | 이유 |
|------|------|
| specs EN에서 "AI headshot" 헤드텀 사용 | specs = 규격(passport/visa). 헤드샷은 profiles 채널 전담 |
| profiles에서 "passport photo size" 규격 콘텐츠 발행 | specs 전담. profiles = 서비스(헤드샷/프로필) |
| monkos.ai/blog EN에서 "AI headshot" 서비스 마케팅 | blog = AI 개발 교육 축. 서비스 마케팅은 profiles |
| IDPASS 앱과 profiles 웹에서 동일 키워드 정면 경합 | 앱(ASO)과 웹(SEO)은 별도 전선이지만, 같은 랜딩으로 수렴시킬 것 |

---

## 6. 갱신 로그

| 날짜 | 변경 | 주체 |
|------|------|------|
| 2026-06-19 | 초안 작성. 6/17 경쟁분석 + 6/18 거버넌스 토론 + PF_CITADEL 히스토리 기반 | iMac/쌍아 |
| 2026-06-19 | EN 노드 맵 본격 확장 — 경쟁사 12개 분석·침투가격안·IDPASS 전략 반영. 채널표에 profiles/IDPASS 추가. EN 금지 조합 추가 | iMac/쌍아 |

---

## 7. TODO

### 즉시 (이번 주)
- [ ] PF_CITADEL Phase 현황에 헤드텀 레지스트리를 Phase 2.5로 편입
- [ ] PF_OPUS 콘텐츠 루틴에 발행 게이트 연동 (웹/민아 자동 생산 시 충돌 점검)

### 단기 (2주 내)
- [ ] GSC 최신 순위 일괄 갱신 (6/18 canonical 통일 효과 관측 = ~7/2)
- [ ] T2(네이버 절대검색량) 칼럼 추가 — 데이터랩 연동 시
- [ ] 일본 GSC 정밀 조회 → JP 노드 순위 기입
- [ ] EN specs 검색량 실측 (Ahrefs/Semrush 또는 Google Keyword Planner)

### profiles 출시 시
- [ ] §4.2~4.4 노드에 실제 URL 매핑 (profiles 도메인 확정 후)
- [ ] pSEO 직군별·도시별 랜딩 초기 세트 결정 (§4.6 패턴 기반)
- [ ] B2B 랜딩 키워드 확정 + 가격 비교 페이지 설계

### IDPASS 앱 출시 시
- [ ] §4.5 ASO 키워드 App Store 실측 반영
- [ ] 앱 스토어 설명문에 레지스트리 타격 키워드 반영
- [ ] 웹(profiles) ↔ 앱(IDPASS) 상호 링크 구조 확정
