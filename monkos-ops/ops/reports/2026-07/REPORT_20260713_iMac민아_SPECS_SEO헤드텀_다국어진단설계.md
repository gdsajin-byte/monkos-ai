---
type: report
date: 2026-07-13
device: iMac
agent: 민아
portfolio: PF_SPECS, PF_CITADEL
subject: specs 다국어 SEO/GEO 진단 + 언어별 헤드텀 체계 설계 (쌍아 지시서 전환용)
status: 완료
---

# specs 다국어 SEO/GEO 진단 + 헤드텀 체계 설계

**[2026-07-13 12:41 KST]** iMac/민아 → 작가님 (dev 작업 중인 쌍아 지시서 전환용)

> 지시: 각 페이지 구조화 데이터 + SEO/GEO 최적 헤드텀을 언어별 상호 침해 없이 — 미국인 "visa photo" 검색 상단, 일본인 "パスポート写真/ビザ写真" 검색 각각 최적화.
> 방법: 코드 실측(render-specs.js·specs-data.json) + 라이브 curl + **GSC 28일 실측**(sc-domain:monkos.ai, 6/13~7/10). 추정 아닌 실측 기반.

---

## 1. 자산 실태 — 이미 견고한 것 (건드리지 말 것)

| 자산 | 상태 |
|------|------|
| 구조화 데이터 | BreadcrumbList + Article + **FAQPage** 3종 전 슬러그 (render-specs.js:811-841) — FAQPage는 GEO(AI 인용) 최강 포맷, 이미 보유 ✓ |
| hreflang | ko/ja/en + x-default 4태그 전 페이지 ✓ |
| canonical | 2-segment(`/specs/{type}/{country}`) 단일 정본, 1-segment 301 처리 완료 (curl 실측 확인) ✓ |
| seoTitle/Description/faqs | **428슬러그 전수 보유** (3언어) ✓ |
| meta description | 라이브 실존 확인 ✓ |

## 2. GSC 실측 — 시장별 현주소 (28일)

- **한국**: 본진 가동 중. "남자 증명사진" 노출 280(pos 8.3, CTR 1.1%), "여권사진 규정 2026" 노출 118(pos 8.8), "운전면허 사진 규정 2026" **클릭 9** — "규정+연도" 계열이 실클릭 생산 중.
- **일본**: "韓国ビザ 写真**サイズ**" 클릭 2(pos 8.1) — 일본인은 "規格"이 아니라 **"サイズ"로 검색**한다는 직접 실증.
- **영어권**: 노출이 전부 소국 롱테일 — 세인트루시아 여권(94 imp, pos 8.1, 클릭 5), 세인트빈센트(47), 이집트·과테말라·브루나이. **428 그물이 경쟁 약한 곳부터 걸리기 시작** = 전략 작동의 초기 신호.
- **미국 메인 쿼리**: "us passport photo" 계열 노출 사실상 0. "american passport size" pos **94**, "dimensions of us passport" pos 78.5.

## 3. 발견 갭 5건

### G1 🔴 언어 간 침해 실증 — en이 약해서 ko가 대신 노출
- GSC: `american passport size` → **`/specs/passport/us` (ko 페이지)** pos 94. `europe passport photo size` → `/specs/passport/eu` (ko) pos 87. `europass cv photo size`는 en(48)과 ko(78) **동시 노출 분산**.
- hreflang이 있어도 en 페이지의 자체 시그널(헤드텀·콘텐츠 지역성)이 약하면 Google이 ko를 대표 선출한다. **"서로 침해 없이"의 실체 = en/ja 페이지의 언어별 고유 신호를 세워 각자 시장의 대표가 되게 하는 것.**

### G2 🔴 헤드텀-검색문화 미스매치 (언어별 동일 템플릿 번역의 한계)
| 언어 | 현행 | 시장 실검색 (GSC/실측 근거) |
|------|------|------------------------------|
| ja | "日本 パスポート写真**規格**" | **サイズ** ("韓国ビザ 写真サイズ" 실클릭). 規格은 기술어, サイズ가 생활어 |
| en (미국 문서) | us-visa: "Photo Size **5.1 × 5.1cm**" | 미국인의 언어는 **2×2 inch**. us-passport는 inch 병기인데 us-visa는 cm만 — 동일 문서군 내 비일관 |
| en (전반) | "Photo Size — Background & Dress Code" | size와 **requirements** 두 계열 실검색 ("belarus passport photo requirements", "denmark visa photo requirements") — requirements 미포함 |
| ko | "규격 — 배경·복장" | **"규정 2026"** 계열이 실클릭 생산 중인데 title에 규정·연도 부재 |

### G3 🟡 미국 메인 쿼리 전략 부재
- "us passport photo"는 정부(travel.state.gov)+Walgreens/CVS+전문앱의 초경쟁 쿼리 — 정면 승부 비현실.
- 실전략 = **서브 헤드텀 침투**: "DS-160 photo requirements", "2x2 passport photo online", "green card photo size", "us visa photo for {국적}" — 경쟁 낮고 구매의도 높음. 소국 롱테일→중경쟁 서브텀→메인텀의 3단 사다리.

### G4 🟡 구조화 데이터 보강 여지 (GEO 축)
- 규격 수치(35×45mm·배경·얼굴 비중)가 **기계가독 구조화로 안 나감** — Article은 있으나 수치는 HTML 표 안에만. AI 오버뷰/Perplexity는 명시 수치 문단·표를 인용.
- `publisher: "Monk Studio"` → 외부 브랜드 **MONKOS 통일 위반** (ch8) — 정정 필요.
- `dateModified: "2026-06-24"` 하드코딩 — 신선도 시그널 정적. "2026" 연도 헤드텀 전략과 모순되지 않게 동적화 필요.

### G5 🟢 URL 이중 색인 — 조치 완료, 관찰만
- GSC에 1-segment(`lc-passport`)·2-segment(`passport/lc`) 동시 노출 중이나 실측 결과 1-segment는 **301 정상**, canonical 단일. Google 재크롤 대기 관성 — 추가 조치 불요, 4주 후 재확인만.

## 4. 설계 — 언어별 헤드텀 공식 (전 428슬러그 일괄 재생성용)

> 원칙: **같은 페이지의 3언어는 번역이 아니라 각 시장의 검색어로 재작성.** 오디언스 정의가 먼저다.

### 4-1. 오디언스 매트릭스 (침해 방지의 본질)

| 조합 | 타겟 | 헤드텀 언어 |
|------|------|------------|
| {국가}-{문서} × ko | 그 서류가 필요한 **한국인** (미국비자 신청 한국인 등) | 규격·규정·연도 |
| × en | 그 서류가 필요한 **전세계 영어 사용자** (미국인 포함: 자국 여권 갱신 + 타국 비자) | size·requirements·로컬 단위 |
| × ja | 그 서류가 필요한 **일본인** | サイズ・年 |

### 4-2. title 공식

```
ko: {국가} {문서} 사진 규격·규정 2026 — {치수}·배경·복장 | MONKOS
    예) 미국 비자 사진 규격·규정 2026 — 5.1×5.1cm·배경·복장 | MONKOS

en: {Country} {Doc} Photo Size & Requirements 2026 — {로컬단위 우선} | MONKOS
    예) US Visa Photo Size & Requirements 2026 — 2×2 inch (51×51 mm) | MONKOS
    규칙: 미국·라이베리아·미얀마 문서 = inch 우선, 그 외 mm/cm 우선. "United States"→"US" (검색어 정합)

ja: {国名}{文書}写真のサイズ・規格 2026 — {치수}・背景・服装 | MONKOS
    예) アメリカビザ写真のサイズ・規格 2026 — 5.1×5.1cm・背景・服装 | MONKOS
    규칙: サイズ 선두, 規格 후치 (실검색 반영). 국명은 통용 카타카나 (アメリカ/韓国/中国)
```

- 연도는 **하드코딩 금지** — 렌더 시 동적 삽입 (또는 seoTitle 재생성 배치의 연 1회 갱신 규칙 명문화). H1은 현행 유지(규격 중심), title만 검색어 확장.
- meta description 공식도 동일 원칙: ko "2026년 최신 규정 반영", en "Official {year} requirements", ja "最新規定対応" + 치수·배경·마감 CTA.

### 4-3. 구조화 데이터 v2 (렌더러 1곳 수정 → 428 전파)

1. Article에 **`about` + PropertyValue로 규격 수치 명시** (GEO 핵심):
```json
"about": { "@type": "Thing", "name": "US Visa Photo Specification",
  "additionalProperty": [
    {"@type":"PropertyValue","name":"size","value":"51×51 mm (2×2 inch)"},
    {"@type":"PropertyValue","name":"background","value":"white"},
    {"@type":"PropertyValue","name":"headHeight","value":"25–35 mm"} ] }
```
2. `publisher` → `"MONKOS"` (+ `url: monkos.ai`) — 브랜드 통일 정정.
3. `dateModified` → 데이터 갱신 시점 동적 (specs-data에 lastVerified 필드 신설, 최소한 배포일).
4. FAQPage 유지 (강점). HowTo(제출 절차)는 P3 후순위 — FAQ와 중복 리스크, 효과 검증 후.
5. (선택) `inLanguage` 정합 확인 — 현행 OK.

### 4-4. GEO(생성형 엔진) 전용 보강 — 본문 1문단
- 표 상단에 **한 문장 수치 요약문** 삽입: "미국 비자 사진 규격은 2×2인치(51×51mm), 흰 배경, 머리 높이 25~35mm입니다." — AI 오버뷰·Perplexity가 인용하는 전형 포맷. 3언어 각자 작성 (specs-data 필드 1개 추가, 렌더러 삽입).

### 4-5. 미국 침투 시퀀스 (G3 처방, P3)
- us-visa·us-passport에 서브 헤드텀 흡수: FAQ에 "DS-160 photo", "green card photo", "2x2 photo online" 질문 추가 (FAQPage 구조화에 자동 편입) → 서브 쿼리 노출 → 메인 쿼리 사다리.

## 5. 실행 우선순위 (쌍아 지시서 전환안)

| P | 작업 | 파일 | 규모 |
|---|------|------|------|
| **P1** | seoTitle·seoDescription 3언어 공식 재생성 (428슬러그 배치 스크립트 + 검수 샘플 30) | specs-data.json (+생성 스크립트) | 막내 1일 |
| **P2** | 구조화 데이터 v2 — PropertyValue·publisher 정정·dateModified 동적·GEO 요약문 필드 | render-specs.js + specs-data | 막내 0.5일 |
| **P3** | 미국 서브 헤드텀 FAQ 증보 (us-visa/us-passport/green card 계열 10슬러그) | specs-data faqs | 막내 0.5일 |
| 관찰 | G5 이중 색인 해소 추이 + P1 후 4주 GSC 언어별 대표 페이지 교정 확인 (en 쿼리→en 페이지) | GSC | 민아 정기 |

**검증 게이트 (P1 후 4주, 민아)**: ① `american passport size` 류 en 쿼리의 노출 페이지가 ko→en으로 교체됐는가 ② ja "サイズ" 쿼리 노출 증가 ③ ko "규정 2026" 계열 specs 유입 발생 ④ 소국 롱테일 pos 상승 유지.

---

*근거 데이터: GSC sc-domain:monkos.ai 2026-06-13~07-10 실측 / render-specs.js:540-855 / specs-data.json 428슬러그 전수 / 라이브 curl (en/visa/us·ja/passport/jp·1-segment 301).*
