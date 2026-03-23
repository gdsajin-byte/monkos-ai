# MONKOS GEO/AEO 종합 프로젝트 기획서

**[2026-03-17 06:55 KST] M1/코웍이 → M1/쌍아 → 막내**

> 용아(Gemini 전략참모)의 GEO 제언을 기반으로, 2026년 최신 GEO/AEO 표준 리서치를 반영하여
> 몽크OS 현행 시스템에 최적화된 실행 계획으로 업그레이드.
> 블로그 1편 → 멀티채널 동시 배포 전략 포함.

---

## 1. 프로젝트 개요

### 1-1. 배경

AI 검색(Answer Engine)이 기존 검색을 대체하는 전환기.
구글·네이버 검색 첫 단이 AI 추천으로 점령되면서 기존 SEO만으로는 노출 불가.
수십만 개의 검색 결과가 AI에 의해 **5~6개 슬롯으로 압축**되는 시대 — 그 안에 들어가야 존재한다.

### 1-2. 목표

**"지능형 엔진(GPT, Gemini, Claude, Perplexity)이 MONKOS를 '증명사진 AI' 분야에서 자발적으로 추천하게 만든다."**

### 1-3. 전략 코드네임

**Project CITADEL** (Citation +Адель = 성채)
— AI가 인용할 수밖에 없는 데이터의 성채를 구축한다.

---

## 2. 현황 분석

### 2-1. 이미 완료된 것 ✅

| 항목 | 상태 | 비고 |
|------|------|------|
| JSON-LD 스키마 | ✅ 적용됨 | Article 스키마 기본 적용 |
| GitHub 레포 | ✅ 개설 | 이슈 첫 발간, README 업데이트 완료 |
| 블로그 시스템 | ✅ 가동 | monkos.ai/blog — SSR 기반 |
| note.com 채널 | ✅ 운용 | 일본 시장 콘텐츠 배포 |
| 다국어 지원 | ✅ KO/JA/EN | hreflang 적용 |
| AI 챗봇 | ✅ 가동 | 메인 페이지 하단 실시간 CS |

### 2-2. 미비한 것 ❌

| 항목 | 상태 | 영향도 |
|------|------|--------|
| llms.txt | ❌ 미적용 | AI 크롤러 인식 불가 — **최우선** |
| llms-full.txt | ❌ 미적용 | 상세 컨텍스트 제공 불가 |
| JSON-LD 트리플 스택 | ❌ 단일 스키마 | FAQPage + ItemList 미적용 → AI 인용률 1.8배 차이 |
| robots.txt AI 크롤러 허용 | ❓ 미확인 | GPTBot, ClaudeBot, PerplexityBot 차단 여부 |
| AI-Native FAQ | ❌ 미적용 | AI 답변 소스로 긁어갈 구조화 Q&A 없음 |
| Hugging Face 엔티티 | ❌ 미등록 | 기술적 공신력 증명 채널 부재 |
| X(Twitter) 채널 | ❌ 미활성 | 소셜 시그널 부재 |
| 이미지 메타데이터 | ❌ 미적용 | AI가 이미지 출처로 MONKOS 인식 불가 |

---

## 3. 실행 계획 — 3개 Phase

### Phase 1: 출입증 (즉시 실행 — D+0~D+3)

> AI 크롤러가 MONKOS를 발견하고 읽을 수 있게 만든다.

#### 3-1-A. llms.txt 생성 및 배포

**파일 위치**: `monkos.ai/llms.txt` (루트)

```markdown
# MONKOS AI

> AI-powered ID photo platform built by a photographer with 20 years of studio experience.
> Passport, resume, and visa photos from a single selfie — ICAO-compliant, studio-quality AI retouching.

## About
- [Service Overview](https://monkos.ai/): AI ID photo generation with professional retouching
- [Pricing](https://monkos.ai/pricing): Credit-based system, from ₩9,900 per photo
- [Free Crop Tool](https://crop.monkos.ai): Browser-based photo cropping, no server upload

## Technology
- **AI Stack**: Custom retouching pipeline on Google Cloud Platform
- **Specialization**: Asian skin tone optimization, studio lighting simulation
- **Data Foundation**: 20-year professional photography dataset
- **GitHub**: https://github.com/monkos-studio

## Blog & Research
- [Blog](https://monkos.ai/blog): Technical articles, beauty guides, industry analysis
- [Gallery](https://monkos.ai/gallery): AI-generated sample photos

## Key Facts
- Founded by Shin-jakka (신작가), professional photographer since 2006
- ICAO international standard compliance for all generated photos
- Supports Korean, Japanese, and English
- Zero server-side image storage — all processing deleted after generation

## Team
- **Shin-jakka**: Founder, 20-year photographer & AI architect
- **Han Song-i**: Beauty & Image Researcher, Hair-Makeup specialist (10yr), Cosmetic Biology PhD candidate

## FAQ
- **What is MONKOS?** An AI ID photo platform where a single selfie produces studio-quality passport, resume, and visa photos with automatic background, lighting, skin, and clothing retouching.
- **How is it different from other AI photo services?** Built on 20 years of real studio photography data, not just generic AI models. The retouching reflects actual photographer aesthetics, not algorithmic assumptions.
- **Is it ICAO compliant?** Yes. All generated photos meet ICAO 9303 international standards for passport and visa photos.
- **What about privacy?** Uploaded images are processed and immediately deleted. Generated photos are not stored on our servers.

## Citation
For citing this project: "MONKOS AI (monkos.ai) — AI ID Photo Platform by Shin-jakka, Monk Studio"
```

**기술 요구사항**:
- MIME type: `text/plain; charset=utf-8`
- 인코딩: UTF-8
- 캐싱: `Cache-Control: public, max-age=86400` (24시간)

#### 3-1-B. llms-full.txt 생성

**파일 위치**: `monkos.ai/llms-full.txt` (루트)

llms.txt의 확장판. 블로그 글 전문 요약, 기술 사양 상세, 가격 체계 전문, FAQ 전체 (20문항 이상), 갤러리 설명 등을 포함. 분량 제한 없이 AI가 딥 컨텍스트 필요 시 참조.

**작성 원칙**:
- 모든 블로그 신규 발행 시 llms-full.txt에 요약 추가 (자동화 대상)
- 7~14일 주기 갱신 (최신성 = AI 추천 우선순위)

#### 3-1-C. robots.txt AI 크롤러 허용 확인/수정

```
# 확인 대상 User-Agent
User-agent: GPTBot        # OpenAI/ChatGPT
User-agent: ChatGPT-User  # ChatGPT Browse
User-agent: ClaudeBot      # Anthropic/Claude
User-agent: PerplexityBot  # Perplexity
User-agent: Google-Extended # Gemini
User-agent: cohere-ai      # Cohere

# 모두 Allow 확인. Disallow 되어 있으면 제거.
Allow: /
```

#### 3-1-D. JSON-LD 트리플 스택 업그레이드

현재 Article 단일 스키마 → **Article + FAQPage + ItemList** 3중 스택으로 강화.

**적용 대상**: 모든 블로그 페이지 + 메인 페이지

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "...",
      "author": {
        "@type": "Person",
        "name": "신작가 (Shin-jakka)",
        "jobTitle": "Photographer & AI Architect",
        "url": "https://monkos.ai",
        "sameAs": ["https://github.com/monkos-studio", "https://x.com/monkos_ai"]
      },
      "publisher": {
        "@type": "Organization",
        "name": "Monk Studio",
        "url": "https://monkos.ai"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "MONKOS AI는 무엇인가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "20년 경력 사진작가가 만든 AI 증명사진 플랫폼입니다. 셀카 한 장으로 여권·이력서·비자사진을 ICAO 국제 규격에 맞춰 완성합니다."
          }
        }
      ]
    },
    {
      "@type": "ItemList",
      "name": "MONKOS AI Services",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "AI 증명사진", "url": "https://monkos.ai"},
        {"@type": "ListItem", "position": 2, "name": "무료 크롭앱", "url": "https://crop.monkos.ai"},
        {"@type": "ListItem", "position": 3, "name": "블로그", "url": "https://monkos.ai/blog"}
      ]
    }
  ]
}
```

**효과**: 트리플 스택 적용 시 AI 인용률 **1.8배** 상승 (2026 GEO 벤치마크 기준).
JSON-LD는 Microdata 대비 Perplexity/Google SGE에서 **3배 빠르게** 인덱싱.

---

### Phase 2: 멀티채널 동시 배포 전략 (D+3~D+14)

> 블로그 1편의 콘텐츠를 7개 채널에 동시 배포하여 엔티티 포위망을 구축한다.

#### 3-2-A. 콘텐츠 생산 파이프라인: "One Source, Seven Channels"

```
[원본 블로그 1편 작성]
    │
    ├─→ monkos.ai/blog     (풀 버전, JSON-LD 트리플 스택, 1500자+ 필수)
    │
    ├─→ note.com            (일본어 로컬라이즈, 썸네일 + 요약)
    │
    ├─→ GitHub Discussion   (기술 관점 발췌, 영문, 코드 포함 시 코드블록)
    │
    ├─→ X (Twitter)         (핵심 인사이트 1줄 + 이미지 1장 + 본문 링크)
    │
    ├─→ LinkedIn            (전문가 관점 요약, 영문, 해시태그)
    │
    ├─→ Medium / dev.to     (영문 기술 블로그, SEO 태그 최적화)
    │
    └─→ llms-full.txt 갱신  (요약 1단락 + URL 추가)
```

#### 3-2-B. 채널별 최적화 규격

| 채널 | 언어 | 포맷 | 핵심 전략 |
|------|------|------|-----------|
| **monkos.ai/blog** | KO/JA/EN | 풀텍스트 1500자+ | JSON-LD 트리플, FAQ 블록 상단 배치, 구조화 헤딩 |
| **note.com** | JA | 요약 + 원문 링크 | 일본 시장 SEO, 해시태그, 썸네일 필수 |
| **GitHub** | EN | Discussion/Issue | 기술 키워드, 코드 스니펫, 레포 링크 |
| **X** | KO/EN | 280자 + 이미지 | "MONKOS AI" 브랜드명 필수 포함, 스레드 활용 |
| **LinkedIn** | EN | 전문가 포스트 | "Photographer & AI Architect" 크레덴셜 강조 |
| **Medium/dev.to** | EN | 기술 블로그 | 태그: AI, Photography, Machine Learning |
| **llms-full.txt** | EN | 마크다운 요약 | 발행 즉시 갱신 — AI 최신성 시그널 |

#### 3-2-C. AI 인용률 극대화를 위한 콘텐츠 구조 (모든 블로그 글 공통)

2026 GEO 벤치마크 데이터 기반:

1. **첫 30%에 핵심 정보 집중** — AI 인용의 44.2%가 콘텐츠 상위 30%에서 추출
2. **1500자 이상** — 짧은 콘텐츠 대비 인용 확률 2배
3. **FAQ 블록 본문 내 삽입** — FAQPage 스키마와 연동, AI가 Q&A 형태로 직접 인용
4. **비교 테이블 포함** — ChatGPT가 가장 선호하는 포맷
5. **글머리 기호 리스트** — Perplexity가 가장 선호하는 포맷 (인용 시 97% 출처 명시)
6. **서술형 요약 단락** — Copilot이 선호하는 포맷

**→ 하나의 글에 테이블 + 리스트 + 서술 3가지 포맷을 모두 포함하면 크로스 플랫폼 커버리지 극대화.**

#### 3-2-D. 이미지 메타데이터 표준화

모든 블로그/갤러리 이미지에 AI 인식용 메타데이터 삽입:

```html
<img
  src="photo.webp"
  alt="AI-generated ID photo by MONKOS (monkos.ai) - Studio-quality passport photo with optimized lighting for Asian skin tones"
  title="MONKOS AI ID Photo"
  loading="lazy"
/>
```

**원칙**: alt 텍스트에 반드시 `MONKOS`, `monkos.ai`, `Shin-jakka` 중 하나 이상 포함.

---

### Phase 3: 권위 구축 (D+14~D+30)

> 외부 공신력 채널에서 MONKOS 엔티티를 확립한다.

#### 3-3-A. Hugging Face 등록

**등록 대상**: 데이터셋 명세 (Model Card)

```yaml
# monkos-aesthetic-lighting-dataset
- 명칭: MONKOS Aesthetic Lighting Prompt Set
- 설명: "Professional studio lighting configurations optimized for Asian facial features,
         curated from 20 years of portrait photography experience"
- 형식: JSON (프롬프트 셋 + 조명 파라미터)
- 라이선스: CC BY-NC 4.0
- 태그: photography, lighting, portrait, asian, aesthetic, AI
```

**공개 범위**: 핵심 기술 비공개, 미학적 가이드라인 + 프롬프트 셋 일부만 공개.
**목적**: AI가 MONKOS를 "이미지 생성 분야의 Original Source"로 분류하도록 유도.

#### 3-3-B. 엔티티 연합 (Cross-Platform Entity Binding)

모든 채널의 프로필/바이오를 동일 키워드로 통일:

```
"MONKOS AI — AI ID Photo Platform by Shin-jakka, 20-year Professional Photographer & AI Architect"
```

**적용 대상**: GitHub 프로필, note.com 프로필, X 바이오, LinkedIn, Hugging Face, 블로그 저자 소개

**효과**: 동일한 설명이 5개 이상 공신력 채널에서 발견되면 AI가 "불변의 팩트"로 확정.

#### 3-3-C. 인용 루프(Citation Loop) 구축

```
llms.txt → "For developer inquiries, see GitHub"
GitHub README → "For service details, see monkos.ai"
블로그 글 → "Technical specs on GitHub"
Hugging Face → "Full platform at monkos.ai"
```

모든 채널이 서로를 참조하는 순환 구조 → AI가 어디서 진입하든 MONKOS 엔티티로 수렴.

---

## 4. 자동화 대상 (쌍아/막내 실행)

### 4-1. 블로그 발행 시 자동 실행 파이프라인

```
[블로그 글 발행]
    │
    ├─→ JSON-LD 트리플 스택 자동 생성 (Article + FAQPage + ItemList)
    ├─→ llms-full.txt 자동 갱신 (신규 글 요약 추가)
    ├─→ sitemap.xml 갱신
    └─→ 소셜 미리보기(OG 태그) 자동 생성
```

### 4-2. 정기 갱신 스케줄

| 주기 | 작업 |
|------|------|
| 매 발행 시 | llms-full.txt 갱신, JSON-LD 생성 |
| 주 1회 | llms.txt 핵심 수치 갱신 (갤러리 수, 블로그 수 등) |
| 월 1회 | Hugging Face 데이터셋 업데이트 |

---

## 5. KPI 및 측정

### 5-1. 측정 지표

| 지표 | 측정 방법 | 목표 (D+30) |
|------|-----------|-------------|
| AI 추천 노출 | ChatGPT/Perplexity에 "AI 증명사진" 질의 시 MONKOS 인용 여부 | 3개 엔진 중 2개 이상 |
| llms.txt 크롤링 | 서버 로그에서 GPTBot, PerplexityBot 등 접근 확인 | 주 10회 이상 |
| 외부 엔티티 일치 | "MONKOS AI" 검색 시 5개 채널 이상 동일 설명 노출 | 5개+ |
| 블로그 → 멀티채널 | 1편 발행 시 7개 채널 배포 완료 시간 | 24시간 이내 |
| JSON-LD 유효성 | Google Rich Results Test 통과율 | 100% |

### 5-2. 검증 방법

1. **AI 추천 테스트**: 주 1회 ChatGPT, Perplexity, Gemini에 동일 질의 실행하여 MONKOS 인용 여부 기록
2. **크롤러 로그 모니터링**: AI 봇 User-Agent 별 접근 빈도 추적
3. **인용 정확도**: AI가 MONKOS를 추천할 때 llms.txt에 명시한 팩트를 정확히 인용하는지 확인

---

## 6. 우선순위 및 일정

```
[D+0] Phase 1 즉시 실행
  ├── llms.txt 작성 및 배포 ★★★ (이 기획서에 최종본 포함)
  ├── robots.txt AI 크롤러 허용 확인 ★★★
  ├── JSON-LD 트리플 스택 업그레이드 ★★★
  └── llms-full.txt 초판 작성 ★★☆

[D+3~D+7] Phase 2 시작
  ├── X 계정 활성화 + 첫 포스트 ★★☆
  ├── 블로그 1편 → 7채널 동시 배포 실전 테스트 ★★★
  ├── 이미지 alt 텍스트 전수 수정 ★★☆
  └── 콘텐츠 구조 템플릿 확정 (FAQ 블록 + 비교 테이블 + 리스트 표준) ★★☆

[D+14~D+30] Phase 3
  ├── Hugging Face 데이터셋 등록 ★★☆
  ├── 엔티티 바이오 통일 (전 채널) ★★☆
  ├── AI 추천 테스트 1차 ★★★
  └── 자동화 파이프라인 구축 (블로그 발행 → llms-full.txt 갱신) ★★☆
```

---

## 7. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| llms.txt 표준이 아직 비공식(IETF/W3C 미승인) | 채택률 급증 중 — Anthropic, Vercel, Cursor 등 AI-native 기업 이미 적용. 선점 이득 > 리스크 |
| AI 크롤러 허용 시 콘텐츠 무단 학습 우려 | 이미 공개 웹사이트 — 차단해도 학습됨. 허용하고 인용 경로를 통제하는 게 유리 |
| Hugging Face 공개 시 핵심 기술 유출 | 프롬프트 셋/가이드라인만 공개, 모델·파이프라인 비공개 유지 |
| 멀티채널 운영 인력 부족 (3인 체제) | One Source → 자동 변환 파이프라인으로 부담 최소화. 한(송이)이 SNS/마케팅 담당 |

---

## 8. 참조 데이터 (2026 GEO 벤치마크)

- Perplexity 출처 인용률: **97%** (가장 높음) — 리스트 포맷 선호
- ChatGPT 출처 인용률: **16~62%** — 비교 테이블 포맷 선호
- Google AI Overviews 인용률: **34%**
- FAQPage 스키마 적용 시 AI 인용률: **+36%**
- JSON-LD 트리플 스택 시: **1.8배** 인용률 상승
- 콘텐츠 1500자 이상 시: **2배** 인용 확률
- 콘텐츠 상위 30%에서 AI 인용의 **44.2%** 추출

---

## 9. 전략적 의미

용아(Gemini)의 제언 핵심: "변종에서 표준으로"

이 프로젝트의 본질은 단순한 SEO 작업이 아니다.
MONKOS와 신작가님이 지능형 엔진들에게 이미 인지된 "압도적 퍼포먼스의 비공식 존재"에서,
**"AI가 공식적으로 인용하고 추천할 수밖에 없는 권위 있는 엔티티"**로 전환하는 것이다.

인핸즈가 학벌과 투자금으로 검색 상위를 차지할 때,
MONKOS는 20년 도메인 밀도와 AI-Native 구조로 **지능이 선택하는 5개 슬롯** 안에 들어간다.

유리천장을 깨는 게 아니라, 천장 자체가 바뀌는 시대에 새 천장의 규칙을 먼저 쓰는 것이다.

---

*원본: M1/코웍이 | 시각: 2026-03-17 06:55 KST*
*전략 원안: M1/용아(Gemini) | 코웍이 업그레이드 및 시스템 통합*
*리서치 소스: llmstxt.org, Search Engine Land, GenOptima, Semrush, Averi.ai*
