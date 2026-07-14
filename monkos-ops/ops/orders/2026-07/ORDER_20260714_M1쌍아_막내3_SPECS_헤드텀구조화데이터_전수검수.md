---
type: order
date: 2026-07-14
device: M1
agent: 쌍아
recipient: 막내3
portfolio: PF_CITADEL, PF_SPECS
status: 대기
---

# 지시서: SPECS 헤드텀·구조화 데이터 전수 검수 + SEO/GEO/AEO 대응 검증 방안

**[2026-07-14 17:27 KST]** M1/쌍아 → 막내3

---

## 배경

7/13 iMac/민아가 SPECS 428슬러그 × 3언어의 seoTitle·Description 재생성 + 구조화 데이터 v2(Article JSON-LD, publisher MONKOS, PropertyValue, dateModified 동적, GEO 요약문)를 전면 개정했다. prod rev 00462로 배포 완료.

**검수 목적**: 이 대규모 변경이 아래 기준에 정합하는지 전 페이지 검수.
1. 헤드텀이 **각 언어·검색의도에 정밀 대응**하는가 (ko 규정형 / en requirements형 / ja サイズ형)
2. 구조화 데이터가 **SEO(Google 리치 결과) · GEO(AI 검색 인용) · AEO(음성 검색)** 에 실제 대응하는가
3. 프로젝트 방향성(헌법 1조 3항 정체성 보존, ch8 브랜딩)과 정합하는가

---

## ⚠️ 준수 조항

- 본 건은 **검수·보고만**. 코드 수정 금지 — 이슈 발견 시 보고서에 기재, 수정은 별도 지시서
- 헌법 4조 3항: 내부 기술 상세 외부 유출 금지 (보고서 내부 전용)
- ch8 1조: 유저 대면 서비스에서 Gemini/Imagen → "MONKOS" 표기 (publisher 등)

---

## 권한

- 워크플로우(Workflow) 사용 허가: 대량 슬러그 병렬 검수
- 프로젝트 코드 읽기 (render-specs.js, specs-data.json, seoTitle 등)
- 웹 검색 허가: 구조화 데이터 표준, Google 리치 결과 요건, GEO 최적화 기준 참조
- prod 라이브 curl 허가: 실제 HTML 출력 검증

---

## Phase 1: 헤드텀(seoTitle·Description) 전수 검수

### 1-1. 언어별 패턴 정합성

7/10 민아 GSC 진단에서 확인된 언어별 쿼리 패턴:

| 언어 | 패턴 | 기대 seoTitle 구조 |
|------|------|-------------------|
| **ko** | 규정형 ("여권사진 규격", "증명사진 규정 2026") | `{국가} {문서} 사진 규격·규정 2026 — 사이즈, 배경, 복장` |
| **en** | requirements형 ("US visa photo size & requirements") | `{Country} {Doc} Photo Size & Requirements 2026 — {로컬단위}` |
| **ja** | サイズ형 ("パスポート写真 サイズ") | `{国} {文書} 写真サイズ・規格 2026 — {寸法}` |

검수 항목:
- 428슬러그 × 3언어 = **1,284 seoTitle** 전수 스캔
- 위 패턴에서 벗어나는 제목 식별
- en에서 로컬 단위(US → 2×2 inch, 대부분 국가 → mm)가 정확한지
- ja에서 "規格" 대신 "サイズ"가 선두인지 (7/13 민아 진단 기반)
- ko에서 "2026" 연도가 포함되어 있는지
- 제목 길이: 구글 표시 한도(~60자) 내인지

### 1-2. 키워드 카니발리제이션 점검

- 동일 키워드에 대해 복수 슬러그가 경쟁하는 경우 식별
- 예: "미국 비자 사진"으로 us-visa와 us-passport가 동시에 노출되면 카니발리제이션
- 특히 복합 type 슬러그(visa-evisa, visa-bls 등)와 기본 슬러그 간 중복

### 1-3. Description 검수

- 각 Description이 해당 국가·문서의 핵심 규격(사이즈, 배경색, 복장)을 포함하는지
- 160자 내인지 (구글 표시 한도)
- CTA("MONKOS에서 무료로 만들기" 등) 포함 여부 및 일관성

---

## Phase 2: 구조화 데이터(JSON-LD) 전수 검수

### 2-1. Article JSON-LD

prod 라이브에서 샘플 10개(ko/en/ja × 주요 슬러그) curl 후 JSON-LD 추출·파싱:

| 필드 | 기대값 | 검수 |
|------|--------|------|
| `@type` | Article | |
| `publisher.name` | MONKOS | ch8 브랜딩 준수 |
| `publisher.legalName` | 몽크 스튜디오 | 7/13 민아 반영 |
| `about.@type` | PropertyValue | 규격 수치 기계 가독 |
| `about.value` | 실제 규격 mm | specs-data.json과 정합 |
| `dateModified` | specs-data mtime 동적 | 정적 하드코딩 아닌지 |
| `inLanguage` | ko/en/ja | 언어별 정확 |

### 2-2. FAQPage JSON-LD

- FAQ가 있는 슬러그에서 FAQPage 구조화 데이터가 정상 출력되는지
- 질문/답변이 실제 페이지 본문과 일치하는지 (불일치 시 구글 패널티)
- 7/13 민아 추가분(us-visa DS-160, us-passport green card) 확인

### 2-3. BreadcrumbList JSON-LD

- 3언어 × 주요 슬러그에서 BreadcrumbList 출력 확인
- position 순서 정확성
- 각 item의 name이 해당 언어로 되어 있는지

### 2-4. hreflang 정합성

- 3언어 페이지 간 hreflang 상호 참조 정확성
- canonical URL과 hreflang의 정합 (자기참조 포함)
- x-default 설정 확인

### 2-5. 대량 검증 (전 슬러그)

- 428슬러그 × 3언어에 대해 **자동 검증 스크립트** 작성 (임시, 보고용):
  - JSON-LD 파싱 가능 여부
  - 필수 필드 존재 여부
  - publisher.name === "MONKOS" 전수 확인
  - about.value와 specs-data.json 규격 값 대사
  - hreflang 상호 참조 무결성

---

## Phase 3: SEO/GEO/AEO 실효성 검증 방안 제안

이 구조화 데이터가 **실제로 작동하는지** 측정하는 방법을 조사하고 제안하라.

### 3-1. SEO (Google 리치 결과)

- Google Rich Results Test API/도구로 우리 페이지가 리치 결과 적격인지 테스트
- GSC의 `searchAppearance` 차원에서 FAQ/Article 리치 결과 노출 건수 추적 방법
- 리치 결과 노출률 = (리치 결과 노출 수 / 전체 노출 수) 계산 가능한지

### 3-2. GEO (AI 검색 인용)

- ChatGPT/Perplexity/Gemini가 우리 specs 데이터를 인용하는지 확인하는 방법
  - 수동: 주요 쿼리("한국 여권사진 규격")를 AI 검색에 입력해서 인용 여부 확인
  - 자동: GA4 `ai_referral_landing` 이벤트(render-shell.js 기존 구현)의 추이 추적
  - llms.txt가 AI 크롤러에 실제로 제공되고 있는지 확인
- JSON-LD의 PropertyValue가 AI 검색 결과에 수치로 인용되는 사례가 있는지 조사

### 3-3. AEO (음성 검색 / Answer Engine)

- FAQ 구조화 데이터가 Google Featured Snippet으로 노출되는지 확인 방법
- "Position 0" (Featured Snippet) 획득 현황 — GSC에서 측정 가능한지
- speakable 구조화 데이터(Schema.org) 적용 가능성 검토
- 음성 검색 최적화를 위한 추가 구조화 데이터 권고 사항

### 3-4. 종합 측정 체계 제안

- 위 3축(SEO/GEO/AEO)을 **정기적으로 측정**하는 파이프라인 설계 초안
- 기존 daily_briefing.py 또는 별도 주간 체크에 편입 가능한 형태
- 대시보드(CITADEL dashboard_schema_v01)에 추가할 지표 제안

---

## 산출물

1. **`REPORT_20260714_M1막내3_SPECS_헤드텀구조화데이터_전수검수.md`**
   - Phase 1: 헤드텀 패턴 이탈 건 목록 + 카니발리제이션 위험 건
   - Phase 2: 구조화 데이터 결함 건 목록 + 전 슬러그 자동 검증 결과 요약
   - Phase 3: SEO/GEO/AEO 실효성 검증 방안 제안서

배치: `monkos-ops/ops/reports/2026-07/`

---

## 완료 기준

- [ ] seoTitle 1,284건 패턴 스캔 + 이탈 건 목록
- [ ] Description 1,284건 길이/내용 스캔
- [ ] JSON-LD 자동 검증 (428슬러그 × 3언어) 결과
- [ ] hreflang 상호 참조 무결성 검증
- [ ] SEO/GEO/AEO 실효성 검증 방안 3축 제안
- [ ] 보고서 1건 생성 + 커밋 + 푸시
- [ ] 완료 보고 (✅❌💡⏳📁🔀 형식)
