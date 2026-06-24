---
type: report
date: 2026-06-24
device: iMac
agent: 막내
portfolio: PF_CITADEL
status: 마감
---

# SEO 내부 경합 종합 감사 + 시타델 작동 검증 — 막내 보강 보고서

> **[2026-06-24 13:10 KST]** iMac/막내 → 작가님  
> 지시서: [`ORDER_20260624_iMac쌍아_막내3_SEO내부경합종합감사.md`](../../orders/2026-06/ORDER_20260624_iMac쌍아_막내3_SEO내부경합종합감사.md)  
> 참조: [`REPORT_20260624_iMac막내3_SEO내부경합종합감사.md`](./REPORT_20260624_iMac막내3_SEO내부경합종합감사.md)  
> 본 보고서는 막내3의 GSC/GA4 실측 보고서를 바탕으로, 막내가 웹사이트 구조를 추가 실측·검증하여 보강한 문서입니다.

---

## 1. 요약

| 항목 | 막내3 실측 결과 | 막내 추가 검증 | 종합 판정 |
|------|-----------------|----------------|-----------|
| GSC 키워드×페이지 | "ai 증명사진" 3-way 경합, / 메인 노출 0 | — | 🟡 경합 지속 |
| GA4 랜딩/전환 | 블로그/specs 오가닉 유입, / 메인 전환 1건 | — | 🟡 퍼널 분산 |
| Canonical/301 | /app → / 통일 확인 | /specs/*/korea → /kr 301 + canonical ISO 정상 | 🟢 기술적 안정 |
| Hreflang | — | /guide/ai-photo는 ko/x-default만 (en/ja 라우트 부재) | 🟡 부분 누락 |
| On-page 품질 | — | 메인·idphoto H1 공백 누락 발견 | 🔴 즉시 수정 권고 |
| 시타델 작동 | 부분작동 | 외곽→킵 링크 확인, 성벽→킵 CTA 불균일 재확인 | 🟡 부분작동 |

---

## 2. 막내3 보고서 핵심 결론

> 인용: `REPORT_20260624_iMac막내3_SEO내부경합종합감사.md`

### 2-a. "ai 증명사진" 경합 현황 (7일: 06-17~06-24)

| URL | 클릭 | 노출 | CTR | 평균순위 |
|-----|------|------|-----|---------|
| idphoto-kr.monkos.ai/app | 4 | 11 | 36% | 42.9 |
| monkos.ai/guide/ai-photo | 2 | 21 | 9.5% | 17.2 |
| monkos.ai/blog/selfie-to-id-photo-ai-guide | 2 | 21 | 9.5% | 16.8 |
| **monkos.ai/ (포털 메인)** | **0** | **0** | **—** | **권외** |

**판정**: 헤드텀에 3개 URL이 경합 중. 포털 메인은 아예 노출되지 않음.

### 2-b. 포털 메인 부진 원인

- SEO on-page 요소(title/H1/meta/canonical/JSON-LD)는 정상.
- GSC index inspect에서 **자체 블로그/가이드/specs로부터의 referring URLs = 0건**.
- **내부 링크 권위(link equity)가 / 에 집중되지 않음**이 근본 원인.
- idphoto `/app` → `/` 신호 이전은 서브도메인 canonical 구조상 원래 불가능.

### 2-c. 시타델 판정

| 구성 요소 | 판정 |
|----------|------|
| 외곽(Specs) → 킵 링크 | ✅ 작동 |
| 성벽(Blog) 검색 유입 | ✅ 작동 (vol36 1위 등) |
| 성벽 → 킵 링크 (내부 CTA) | ⚠️ 부분 (50+편 중 CTA 자동 삽입 2편) |
| 킵(/) 헤드텀 장악 | ❌ 미작동 |
| /app → / 신호 이전 | ❌ 미작동 (서브도메인 한계) |

**종합: 부분작동**

---

## 3. 막내 추가 실측 (웹사이트 구조)

측정 시각: 2026-06-24 12:55~13:00 KST  
도구: `curl` + Python HTML 파서 (Googlebot UA)  
대상: 지시서 명시 페이지 + specs 상위 5건

### 3-a. 키 페이지 메타/구조 테이블

| URL | Title | H1 | Canonical | JSON-LD | Hreflang |
|-----|-------|----|-----------|---------|----------|
| `monkos.ai/` | MONKOS AI \| AI 증명사진 · 여권사진 · 이력서사진 | 전문 스튜디오가 개발한AI 증명사진 서비스 *(공백 누락)* | `https://monkos.ai/` | FAQPage | ko/en/ja/x-default |
| `idphoto-kr.monkos.ai/` | MONKOS AI 증명사진 \| AI 코칭으로 완벽한 증명사진 | 셀카 한 장으로증명사진 완성 *(공백 누락)* | `https://idphoto-kr.monkos.ai/` | Service, FAQPage | ko/ja/x-default→monkos.ai |
| `idphoto-kr.monkos.ai/app` | (루트와 동일) | (루트와 동일) | `https://idphoto-kr.monkos.ai/` *(루트 통일)* | Service, FAQPage | ko/ja/x-default→monkos.ai |
| `monkos.ai/guide/ai-photo` | AI 증명사진 만들기 — 물료 사이트 비교·가격·사용법 총정리 2026 \| MONKOS | AI 증명사진 만들기 — 2026 완벽 가이드 | `https://monkos.ai/guide/ai-photo` | HowTo, FAQPage | **ko/x-default만** |
| `monkos.ai/blog/selfie-to-id-photo-ai-guide` | 셀카 한 장으로 증명사진 만들기 — AI 증명사진 완전 가이드 \| MONKOS AI | (동일) | (자기 URL) | Article, BreadcrumbList | ko/ja/en/x-default |
| `monkos.ai/blog/ai` | 사진관에서 만든 AI 증명사진 플랫폼? \| MONKOS AI | (동일) | (자기 URL) | Article, BreadcrumbList | ko/ja/en/x-default |
| `monkos.ai/blog/men-s-id-photo-know-this-and-you-wont-fail` | 남성 증명사진, 이것만 알면 실패 없어요 📸 \| MONKOS AI | (동일) | (자기 URL) | Article, BreadcrumbList | ko/ja/en/x-default |

### 3-b. Specs 상위 5건 (sitemap 순)

| URL | Title | H1 | Canonical | JSON-LD | 301 상태 |
|-----|-------|----|-----------|---------|----------|
| `/specs/passport/us` | 미국 Passport / Visa 사진 규격 2 × 2 inch... | 미국 여권·비자 규정안내 | (자기 URL) | BreadcrumbList, Article, FAQPage, HowTo | 200 |
| `/specs/headshot/usa` | 미국 Headshot · LinkedIn 사진 규격... | 미국 Headshot · LinkedIn 규정안내 | (자기 URL) | 동일 | 200 |
| `/specs/id/korea` | 대한민국 주민등록증 사진 규격... | 대한민국 주민등록증 규정안내 | `https://monkos.ai/specs/id/kr` | 동일 | `/korea` → `/kr` 301 ✅ |
| `/specs/passport/korea` | 대한민국 여권 사진 규격... | 한국 여권사진 규정 | `https://monkos.ai/specs/passport/kr` | 동일 | `/korea` → `/kr` 301 ✅ |
| `/specs/visa/korea` | 대한민국 비자 사진 규격... | 대한민국 비자 규정안내 | `https://monkos.ai/specs/visa/kr` | 동일 | `/korea` → `/kr` 301 ✅ |

### 3-c. 추가 발견 사항

1. **H1 공백 누락 (P0)**
   - `monkos.ai/`: "전문 스튜디오가 개발한AI 증명사진 서비스" — "한"과 "AI" 사이 공백 없음
   - `idphoto-kr.monkos.ai/`: "셀카 한 장으로증명사진 완성" — "로"와 "증" 사이 공백 없음
   - 원인: SSR 시 문자열 연결에서 공백 HTML entity(`&nbsp;` 또는 공백)이 누락되었거나, CSS/JS로 렌더링되는 영역이 크롤러에 공백 없이 노출됨.
   - 영향: 시각적/크롤링 품질 저하. SERP snippet 생성 시 부정적 영향 가능.

2. **`/guide/ai-photo` hreflang 부재 (P1)**
   - ko/x-default만 존재. `/en/guide/ai-photo`, `/ja/guide/ai-photo` 라우트 부재.
   - 6/17 막내3 보고서에서도 동일 확인. 다국어 색인 신호가 약화될 수 있음.

3. **`/specs/*/korea` canonical/301 정상 (P1 확인)**
   - 6/23 슬러그 회귀 사고(120건 404) 후 복구 상태를 실측으로 확인.
   - `/specs/id/korea`, `/specs/passport/korea`, `/specs/visa/korea` 모두 `/kr`로 301 리다이렉트, canonical도 `/kr`로 통일.

4. **Specs → 킵/서비스 링크 (P2)**
   - specs 상위 5건 모두 `/` 링크(킵) 존재.
   - 그러나 **idphoto-kr.monkos.ai/ 또는 `/prep` 등 서비스 랜딩으로의 직접 CTA는 HTML 소스상 확인되지 않음** (JS 렌더링 가능성은 별도 검증 필요).

---

## 4. 종합 분석

### 4-a. 경합 재확인

막내3의 GSC 실측과 막내의 웹 구조 실측을 종합하면:

- **진짜 경합은 포털 내 3페이지**: `/guide/ai-photo`, `/blog/selfie-to-id-photo-ai-guide`, `/blog/ai`가 "AI 증명사진" 헤드텀에서 메인을 밀어내고 있음.
- **서브도메인(idphoto-kr)은 별도 전선**이나, 동일 SERP에서 메인/가이드/블로그와 함께 노출될 수 있음.
- **메인은 on-page 요소는 정상이나 내부 링크 권위가 부족**하여 "ai 증명사진"에 노출되지 않음.

### 4-b. 시타델 작동 판정

| 영역 | 판정 | 설명 |
|------|------|------|
| 메인(킵) | 🟡 | 존재하나 동일 헤드텀에서 가이드/블로그에게 밀림. H1 공백/JSON-LD 빈약 보강 필요 |
| 성벽(블로그/가이드) | 🟢 | 검색 유입 발생. 다만 메인으로의 CTA가 불균일 |
| 외곽(specs) | 🟢 | 1,335 URL + hreflang + 301 복구 완료. 킵으로의 링크는 존재하나 서비스 CTA는 단순 |
| 연결고리(내부링크) | 🟡 | 블로그→idphoto-kr 직접 CTA 불균일, specs→idphoto-kr CTA 미확인 |
| 거버넌스 | 🟡 | 헤드텀 레지스트리는 있으나, 발행 게이트에서 H1 공백/충돌 자동 감지는 미확인 |

**종합 판정: 부분작동.** 인프라는 안정되었으나 콘텐츠 신호 분산과 메인 권위 약화가 지속 중.

---

## 5. 개선 제안 (막내3 제안 + 보강)

### P0 — 즉시 조치

1. **H1 공백 수정**
   - `monkos.ai/`: "전문 스튜디오가 개발한 AI 증명사진 서비스"
   - `idphoto-kr.monkos.ai/`: "셀카 한 장으로 증명사진 완성"
   - 관련 파일: `monkos_AI/portal/home.js`, `monkos_AI/idphoto-kr/index.html` 또는 SSR renderer

2. **블로그 전체 메인 CTA 자동 삽입 확대** (막내3 제안과 동일)
   - 현재 `SEO_TITLE_OVERRIDES`에 2개 slug만 등록. 모든 KO 블로그에 기본 CTA 삽입 권고.

### P1 — 구조적 개선

3. **`/guide/ai-photo` hreflang en/ja 추가 또는 x-default 정리**
   - `/en/guide/ai-photo`, `/ja/guide/ai-photo` 라우트 미존재 문제 해결.

4. **"AI 증명사진" 대표 URL 단일화** (막내3 제안과 동일)
   - **A안 권고**: `/guide/ai-photo`를 대표로, 블로그에서 `/guide/ai-photo`로 canonical 또는 강력한 내부링크 추가.

5. **"남자 증명사진" CTR 개선** (막내3 제안과 동일)
   - `seoTitle`을 "남자 증명사진 완벽 가이드 — 머리·표정·복장 핵심 정리 (2026)" 등으로 최적화.

### P2 — 측정/운영

6. **GSC/GA4 7일 측정 루프 재개**
   - 특히 6/23 specs 슬러그 복구 후 색인 회복 추이, "ai 증명사진" SERP에서 메인/가이드/블로그 실제 노출 URL 추적.

7. **배포 안전망 3종(ch5 조항화)** 민아 제안 후속
   - 스모크 검증 의무, git 자산 추적 의무, preview 선검증.

---

## 6. 결론

- 막내3의 GSC/GA4 실측은 **"ai 증명사진" 헤드텀이 포털 메인을 밀어내고 3-way 경합** 중임을 명확히 보여줌.
- 막내의 웹 구조 실측은 그 원인 중 하나로 **메인/서비스 H1 공백 누락**, **/guide/ai-photo hreflang 부재**, **블로그→메인/서비스 CTA 불균일** 등을 추가로 확인함.
- specs 외곽은 6/23 슬러그 회귀 사고 후 301/canonical 정상 복구됨.
- **다음 행동**: P0 H1 공백 수정 + 블로그 CTA 확대 + GSC/GA4 7일 측정 루프.

---

## 부록: 한계

- 본 보고서의 GSC/GA4 데이터는 막내3 보고서를 인용.
- 막내(Kimi CLI)는 `.mcp.json`의 GSC/GA4 MCP를 직접 호출할 수 없어 독립 실측은 불가.
- 향후 MCP 가동 가능한 환경에서 7일/28일 데이터를 재측정하면 본 보고서 §3 이후를 보강할 수 있음.
