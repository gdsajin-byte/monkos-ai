---
type: report
date: 2026-06-24
device: iMac
agent: 막내3
portfolio: PF_CITADEL
status: 완료
---

# SEO 내부 경합 종합 감사 + 시타델 작동 검증

> **[2026-06-24 13:00 KST]** iMac/막내3 → 작가님
> 기준: GSC/GA4 실측 (2026-06-17~06-24 7일 + 05-27~06-24 28일)

---

## 1. 경합 현황 (키워드 × 페이지 매트릭스)

### 1-a. 핵심 키워드별 경합 페이지 맵 (7일)

#### "ai 증명사진" — ⚠️ 3-way 경합

| URL | 클릭 | 노출 | CTR | 평균순위 |
|-----|------|------|-----|---------|
| idphoto-kr.monkos.ai/app | 4 | 5 | 80% | 59.6 |
| monkos.ai/guide/ai-photo | 2 | 4 | 50% | 25.5 |
| monkos.ai/blog/selfie-to-id-photo-ai-guide | 1 | 3 | 33% | 38.7 |
| **monkos.ai/ (포털 메인)** | **0** | **0** | **—** | **권외** |

**판정**: 헤드텀에 3개 URL이 경합 중. **포털 메인은 아예 노출되지 않음.**

#### "ai증명사진" (붙여쓰기) — 2-way 경합

| URL | 클릭 | 노출 | CTR | 평균순위 |
|-----|------|------|-----|---------|
| idphoto-kr.monkos.ai/app | 0 | 1 | 0% | 45 |
| monkos.ai/blog/selfie-to-id-photo-ai-guide | 0 | 1 | 0% | 27 |

#### "남자 증명사진" — 경합 없음 (단일 페이지)

| URL | 클릭 | 노출 | CTR | 평균순위 |
|-----|------|------|-----|---------|
| monkos.ai/blog/men-s-id-photo-know-this-and-you-wont-fail | 0 | 47 | **0%** | 8.6 |

**판정**: 경합은 없으나 **47회 노출에 클릭 0**. 순위 8-9에서 CTR 0% = title/snippet 개선 필요.

#### "ai 취업사진" — 포털 메인 단독 (희소)

| URL | 클릭 | 노출 | CTR | 평균순위 |
|-----|------|------|-----|---------|
| monkos.ai/ | 0 | 3 | 0% | 10 |

**판정**: 포털 메인이 유일하게 노출되는 키워드. 하지만 클릭 0.

#### "증명사진 만들기 ai" — ⚠️ 3-way 경합 (전원 권외)

| URL | 클릭 | 노출 | CTR | 평균순위 |
|-----|------|------|-----|---------|
| idphoto-kr.monkos.ai/app | 0 | 1 | 0% | 99 |
| monkos.ai/blog/selfie-to-id-photo-ai-guide | 0 | 1 | 0% | 88 |
| monkos.ai/guide/ai-photo | 0 | 1 | 0% | 81 |

**판정**: 3개 URL이 모두 10페이지 밖. 신호 분산이 극심.

#### "증명사진 보정" — ❌ 데이터 없음

7일간 노출/클릭 0. 이 키워드에서 아직 경쟁에 진입하지 못함.

#### "증명사진 앱" — ❌ 데이터 없음

7일간 노출/클릭 0. 이 키워드에서도 미진입.

---

### 1-b. 주요 페이지별 핵심 키워드 맵 (7일)

| 페이지 | 의도된 역할 | 실제 유입 키워드 Top 5 | 클릭 | 노출 |
|--------|-----------|----------------------|------|------|
| **monkos.ai/** | 킵(메인 허브) | monkos(1), ai 취업사진(0), 이력서 사진 ai(0), ai 이력서 사진(0) | 1 | 26 |
| **idphoto-kr.monkos.ai/** | 서비스 루트 | — (canonical → /app으로 통합, 미색인) | 0 | 0 |
| **idphoto-kr.monkos.ai/app** | AI 증명사진 앱 | ai 증명사진(4), ai증명사진(0), monkos(0), 증명사진 만들기 ai(0) | 4 | 11 |
| **monkos.ai/guide/ai-photo** | 가이드(성벽) | ai 증명사진(2), 증명사진 만들기 사이트(0), 증명사진 만들기 무료 사이트(0) | 2 | 21 |
| **monkos.ai/blog/selfie-to-id-photo-ai-guide** (vol38) | 블로그(성벽) | ai 증명사진(1), 증명사진 만들기(0), ai증명사진(0) | 2 | 21 |
| **monkos.ai/blog/ai** | 블로그(성벽) | 증명사진 프롬(0), ai 증명사진 더쿠(0) | 0 | 18 |
| **monkos.ai/blog/men-s-id-photo...** | 블로그(성벽) | 남자 증명사진(0), 증명사진 남자(0), 남자증명사진(0), 남자 증명사진 머리(0), 남자 증사(0) | 0 | 75 |
| **monkos.ai/specs/* (합산)** | 외곽(규격DB) | 운전면허 사진 규정 2026(1), 주민등록증 사진 규정 2026(1), 민증 사진 규정 2026(1), 2026 여권사진 규정(0)... | 3 | 93+ |

---

### 1-c. 포털 메인(`/`) 노출 부진 원인 분석

#### 실측 현황
- 7일간 총 **26회 노출, 1 클릭** (CTR 3.8%, 평균 순위 6.1)
- 노출 키워드: "monkos"(브랜드), "ai 취업사진", "이력서 사진 ai", "ai 이력서 사진"
- **"ai 증명사진" 키워드에 대한 / 노출 = 0회**

#### 원인 진단

**1) 6/18 canonical 통일 후 신호 이전 미발생**
- "ai 증명사진" 일별 추이 (6/10~6/24):
  - /app: 계속 노출 (pos 8→50→84→52→61, 극심한 변동)
  - /guide: 간헐적 노출 (pos 19~30)
  - /blog: 간헐적 노출 (pos 31~45)
  - **/ (메인): 한 번도 노출된 적 없음**
- idphoto-kr.monkos.ai/ → /app canonical은 정상 작동 (GSC NEUTRAL)
- 하지만 /app의 신호가 monkos.ai/로 이전되지 않음 — 서브도메인 간 canonical은 신호 이전 대상이 아님

**2) 내부 링크 신호 부재**
- GSC index inspect에서 monkos.ai/의 referring URLs:
  - idphoto-jp.monkos.ai/ (외부 서브도메인)
  - x.com/MONKOS_AI (외부)
  - **자체 블로그/가이드/specs로부터의 참조 URL = 0건**
- guide/ai-photo의 referring URLs: sitemap.xml만

**3) SEO 요소 점검 (소스 코드 확인)**
- title: "MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진" ✅ 키워드 포함
- H1: "전문 스튜디오가 개발한 AI 증명사진 서비스" ✅ 키워드 포함
- meta description: "AI 실시간 코칭으로 완벽한 증명사진을 촬영하세요" ✅
- canonical: https://monkos.ai/ ✅
- JSON-LD: FAQPage ✅

**결론**: SEO on-page 요소는 정상. 문제는 **내부 링크 권위(link equity)가 / 에 집중되지 않음** + **서브도메인(/app) 신호 이전 불가**.

---

## 2. 시타델 전략 작동 판정

### 2-a. 내부 링크 연결 검증

| 경로 | 상태 | 상세 |
|------|------|------|
| 블로그 → 메인/idphoto-kr CTA | ⚠️ 부분 | `SEO_TITLE_OVERRIDES`에 등록된 2개 글(vol38-ai-kr, ai-kr)만 자동 CTA 삽입. 최근 5개 블로그(6/20~24) 중 수동 CTA가 있는 건 2개(명함사진, 링크드인 가이드) |
| Specs → 메인 CTA | ✅ 정상 | 모든 specs 페이지에 "무료로 체험하기 →" → monkos.ai CTA 존재 |
| Guide → 메인 CTA | ✅ 정상 | idphoto-kr.monkos.ai/ + /crop + /specs 링크 존재 |
| 블로그 ↔ 블로그 상호링크 | ✅ 양호 | 최근 글에서 관련 블로그 간 내부링크 활발 |
| 메인 → 블로그/specs | ✅ 정상 | 네비게이션 + Resources 섹션에서 /blog, /specs, /guide 링크 |

**핵심 문제**: 블로그 50+편 중 메인/서비스로의 CTA가 자동 삽입되는 건 2편뿐. 나머지는 마크다운 내 수동 삽입에 의존하며, 에디토리얼/사론 성격 글은 CTA 없음. Google이 인식하는 내부 링크 신호가 / 로 집중되지 않는 근본 원인.

### 2-b. 최근 블로그 5편 SEO 구조 점검

| 블로그 (날짜) | canonical | title/H1 중복 | 헤드텀 충돌 | JSON-LD | CTA to 메인 |
|--------------|-----------|--------------|-----------|---------|------------|
| id-photo-natural-retouching-guide (6/24) | ✅ /blog/{slug} | ❌ 없음 | "증명사진 보정" — 메인과 미충돌 | ✅ BlogPosting | ❌ 없음 |
| job-application-photo-complete-guide (6/23) | ✅ /blog/{slug} | ❌ 없음 | "취업사진" — 메인과 미충돌 | ✅ BlogPosting | ⚠️ 마크다운 내 수동 |
| professional-business-card-photo-guide (6/22) | ✅ /blog/{slug} | ❌ 없음 | "명함 사진" — 미충돌 | ✅ BlogPosting | ✅ idphoto-kr 링크 |
| linkedin-professional-headshot-guide (6/21) | ✅ /blog/{slug} | ❌ 없음 | "링크드인 프로필 사진" — 미충돌 | ✅ BlogPosting+FAQ | ✅ 헤드샷 링크 |
| when-the-model-changed-overnight (6/20) | ✅ /blog/{slug} | ❌ 없음 | — (에디토리얼) | ✅ BlogPosting | ❌ 없음 |

**판정**: canonical/JSON-LD 구조는 전 건 정상. 헤드텀 충돌 없음 (각 블로그가 고유 키워드 타겟). 그러나 5편 중 2편만 메인 서비스로의 CTA 포함.

### 2-c. 헤드텀 거버넌스 작동 판정

#### 6/18 canonical 통일 이후 "ai 증명사진" 일별 추이

| 날짜 | /app | /guide | /blog/selfie | / (메인) |
|------|------|--------|-------------|---------|
| 6/16 | pos 8 (0c/1i) | — | — | — |
| 6/17 | **pos 50.5 (2c/2i)** | pos 19 (0c/1i) | pos 40 (0c/1i) | — |
| 6/18 | pos 84 (1c/1i) | — | — | — |
| 6/19 | pos 52 (0c/1i) | **pos 26.5 (1c/2i)** | pos 45 (0c/1i) | — |
| 6/20 | pos 61 (1c/1i) | pos 30 (1c/1i) | pos 31 (1c/1i) | — |

**판정: 미작동**

근거:
1. /app → / 신호 이전 **미발생**. 6/18 이후 6일간 / 는 "ai 증명사진"에 **단 한 번도 노출되지 않음**
2. /app은 canonical이 자기 자신(idphoto-kr.monkos.ai/app)을 가리키므로 monkos.ai/로의 신호 이전은 원래 불가능한 구조 (서브도메인 ≠ 같은 origin)
3. /app의 순위가 극심하게 변동 (8→50→84→52→61) — canonical 변경으로 인한 불안정
4. /guide가 "ai 증명사진"에서 가장 안정적 (pos 19~30)이나, /app과 경합 지속
5. /blog/selfie도 간헐적 노출 — 3-way 분산 구조 미해소

---

## 3. GA4 실측 — 유입·전환 경로

### 3-a. 랜딩 페이지별 세션 (7일)

| 랜딩 페이지 | 전체 세션 | Organic 세션 | 신규 사용자 | 전환 |
|-----------|----------|------------|-----------|------|
| / (포털 메인) | 104 | 13 (12.5%) | 66 | 1 |
| /blog/vol36 (안경·증명사진) | 9 | 9 (100%) | 7 | 0 |
| /blog/vol29 (일본 취업사진) | 7 | 7 (100%) | 7 | 0 |
| /blog/vol17-vs | 7 | 5 (71%) | 4 | 0 |
| /blog/claude-max-20x-2-month-review | 5 | 5 (100%) | 5 | 0 |
| /specs (허브) | 5 | 3 (60%) | 3 | 0 |
| /specs/resident/korea | 5 | 5 (100%) | 3 | 0 |
| /blog/selfie-to-id-photo-ai-guide | 3 | 3 (100%) | 1 | 0 |
| /guide/ai-photo | 3 | 3 (100%) | 1 | 0 |
| /headshot | 4 | 0 (0%) | 0 | 0 |

### 3-b. Organic Search 채널 핵심 발견

- **블로그/specs는 거의 100% 오가닉** — 시타델 성벽/외곽이 검색 유입을 담당
- **포털 메인은 87.5% 비오가닉** (Paid/Direct) — 오가닉 13세션으로 자력 유입 미약
- **전환(purchase)**: 전체 7일간 **1건** (포털 메인에서 발생)
- 블로그 → 메인 → 전환 경로는 데이터 상 확인 불가 (내부 이동 추적 한계)

### 3-c. 주목할 오가닉 성과

| 콘텐츠 | Organic 세션 | 특징 |
|--------|------------|------|
| vol36 (안경 증명사진) | 9 | GSC "취업사진 안경" pos 1, "남자 취업사진 안경" pos 2 — **1위 키워드 보유** |
| vol29 (일본 취업사진) | 7 | 일본 관련 키워드 클러스터 |
| specs/resident/korea | 5 | "주민등록증 사진 규정 2026" pos 4.4 — **실용 규격 검색 포착** |
| selfie-to-id-photo-ai-guide | 3 | "ai 증명사진" 경합 참여 |
| guide/ai-photo | 3 | "ai 증명사진" 경합 참여 |

---

## 4. 종합 판정 + 개선 제안

### 시타델 작동 판정: **부분 작동**

| 구성 요소 | 판정 | 근거 |
|----------|------|------|
| 외곽(Specs) → 킵 링크 | ✅ 작동 | CTA 전 건 존재, specs 오가닉 유입 발생 |
| 성벽(Blog) 검색 유입 | ✅ 작동 | vol36 1위, 다수 블로그 오가닉 유입 |
| 성벽 → 킵 링크 (내부 CTA) | ⚠️ 부분 | 50+편 중 CTA 자동 삽입 2편. 수동 삽입 불균일 |
| 킵(/) 헤드텀 장악 | ❌ 미작동 | "ai 증명사진"에 / 노출 0회. 내부 링크 권위 집중 실패 |
| /app → / 신호 이전 | ❌ 미작동 | 서브도메인 canonical 구조상 불가능 |

### 개선 제안 (우선순위)

#### P0 — 즉시 조치

**1. 블로그 전체에 메인 CTA 자동 삽입 확대**
- 현재: `SEO_TITLE_OVERRIDES`에 2개 slug만 등록 → CTA 삽입
- 제안: **모든 한국어 블로그에 기본 CTA 삽입** (render-blog.js에서 조건 제거 또는 반전)
- 파일: `monkos_AI/portal/lib/cms/render-blog.js` (Line 465)
- 기대 효과: 50+편의 블로그에서 idphoto-kr.monkos.ai/로의 내부 링크 생성 → Google이 / 관련 페이지로 인식

**2. "남자 증명사진" CTR 개선**
- 현황: 47 노출, 0 클릭, 평균순위 8.6
- 원인 추정: title이 영어 slug 기반(`men-s-id-photo-know-this-and-you-wont-fail`)으로 SERP snippet에서 매력도 부족
- 제안: 해당 블로그의 `seoTitle`을 "남자 증명사진 완벽 가이드 — 머리·표정·복장 핵심 정리 (2026)" 등으로 최적화

#### P1 — 구조적 개선

**3. "ai 증명사진" 대표 URL 단일화**
- 현재 3-way 경합: /app, /guide/ai-photo, /blog/selfie
- 선택지:
  - **A안**: /guide/ai-photo를 대표로 지정 (현재 가장 안정적 순위 19~30) → /blog에서 /guide로 canonical 또는 내부 링크 강화
  - **B안**: monkos.ai/ 자체를 "ai 증명사진" 대표로 밀기 → 블로그/가이드에서 / 로의 링크 집중 + /app의 canonical을 monkos.ai/로 변경 검토 (서비스 구조 변경 수반)
- 권고: **A안** (현실적). /guide/ai-photo가 "증명사진 만들기 사이트"(pos 9.5) 등 롱테일에서도 가장 잘 잡히고 있음

**4. Specs → 관련 블로그 역링크 추가**
- 현재: specs → monkos.ai CTA만 존재
- 제안: specs 상세 페이지 하단에 "관련 가이드" 블록 추가 (예: korea-passport specs → "여권사진 규격 2026" 관련 블로그)
- 기대 효과: 토피컬 클러스터 강화

**5. "증명사진 보정" / "증명사진 앱" 키워드 진입**
- 현재: 두 키워드 모두 0 데이터 (미진입)
- 6/24 발행된 `id-photo-natural-retouching-guide`가 "증명사진 보정" 타겟 → 색인 후 효과 관찰 필요
- "증명사진 앱" 키워드용 콘텐츠는 현재 부재 → 전용 가이드 또는 블로그 기획 검토

#### P2 — 중장기

**6. 포털 메인 오가닉 비율 개선**
- 현재: 104세션 중 오가닉 13 (12.5%) — 대부분 Paid/Direct
- DA(도메인 권위) 축적과 내부 링크 강화로 점진 개선 필요
- 메인 페이지가 오가닉으로 자립하려면 내부 링크 + 백링크 양쪽 필요

**7. vol36/vol36-kr 경합 정리**
- "증명사진 안경": vol36 (19 노출, pos 3.3) vs vol36-kr (6 노출, pos 1.5) — 같은 콘텐츠의 원본/번역본 경합
- hreflang 정상 여부 확인 필요

---

## 부록: 전체 페이지 GSC 클릭 순위 (7일, 상위 15)

| 순위 | URL | 클릭 | 노출 | 평균순위 |
|------|-----|------|------|---------|
| 1 | /blog/vol36 | 7 | 30 | 5.4 |
| 2 | /blog/vol17-vs | 5 | 25 | 5.0 |
| 3 | /specs/resident/korea | 5 | 93 | 8.5 |
| 4 | idphoto-kr.monkos.ai/app | 4 | 11 | 42.9 |
| 5 | /blog/claude-max-20x-2-month-review | 2 | 32 | 7.3 |
| 6 | /blog/korea-vs-japan-job-photo-hairstyle-difference-kr | 2 | 20 | 8.1 |
| 7 | /blog/selfie-to-id-photo-ai-guide | 2 | 21 | 16.8 |
| 8 | /blog/vol29 | 2 | 29 | 5.1 |
| 9 | /en/specs/passport/lc | 2 | 9 | 7.4 |
| 10 | /guide/ai-photo | 2 | 21 | 17.2 |
| 11 | /specs/jp-license | 2 | 9 | 6.4 |
| 12 | /specs/visa/cn | 2 | 7 | 5.0 |
| 13 | /specs/vn-passport | 2 | 8 | 4.1 |
| 14 | **monkos.ai/** | **1** | **26** | **6.1** |
| 15 | /blog/fable-5-mythos-5 | 1 | 76 | 9.3 |
