---
type: report
date: 2026-09-21
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
subject: "specs 상세페이지화 조사 2 — 검색 썸네일 조건·구조화 데이터 현황·모바일 설계 규칙·성능·법무"
note: "리서치 서브에이전트 산출 원문 보존 (민아 미검증). 네이버 항목은 조사자가 공식 문서 원문 열람 실패로 [미검증] 표기."
---

**[2026-09-21 11:33 KST]** iMac/리서치 서브에이전트 → 호출 에이전트(작가님 중계용)

# specs 상세페이지화 — 이미지·구조화데이터·UX·성능·법무 리서치 보고

> 읽기 전용 웹 리서치로 작성했고, 파일은 수정하지 않았습니다.
> **접근 제약**: `searchadvisor.naver.com`과 `web.archive.org`는 WebFetch와 브라우저 양쪽에서 차단되어 네이버 공식 문서 원문을 열람하지 못했습니다. 네이버 항목은 2차 출처와 제 기존 지식으로 작성했고, 해당 부분에는 **[미검증]** 표시를 붙였습니다. 템플릿에 반영하기 전에 서치어드바이저 가이드 원문을 사람이 1회 확인해야 합니다.
> 표기 규칙: **[문서]** = 1차 문서로 확인한 사실, **[2차]** = 업계 연구·기사, **[추론]** = 제 판단.

---

## Q1. 구글 텍스트 결과 썸네일 / 이미지 팩

### 문서화된 사실
- **[문서]** 텍스트 결과 이미지(썸네일)는 Google이 "해당 쿼리에 대해 그 페이지에서 가장 관련성 높은 이미지"로 정의합니다. 최적화 방법은 Image SEO 가이드를 따르라는 한 줄만 있습니다. https://developers.google.com/search/docs/appearance/visual-elements-gallery
- **[문서]** 이미지 선택은 "completely automated"이며 여러 소스를 고려합니다. 2026-03-02 문서 업데이트로 "Google은 schema.org 마크업과 og:image 메타 태그를 모두 썸네일 결정의 소스로 사용한다"는 문장이 명시됐습니다. 선호 이미지를 지정하는 수단은 `og:image`, `primaryImageOfPage`, 그리고 `mainEntity`/`mainEntityOfPage`에 붙인 `image` 세 가지입니다. https://developers.google.com/search/docs/appearance/google-images , https://developers.google.com/search/updates
- **[문서]** 선호 이미지 권고는 다음과 같습니다. 페이지를 대표하는 관련 이미지를 쓸 것, 로고 같은 generic 이미지를 피할 것, **텍스트가 들어간 이미지를 피할 것**, 극단적 종횡비를 피할 것, 고해상도를 쓸 것. (같은 문서)
- **[문서]** 본문 이미지 발견 방식: Google은 `<img src>`에서 이미지를 찾습니다(`<picture>`의 자식이어도 됩니다). "**Google doesn't index CSS images**"라고 명시돼 있습니다. (같은 문서)
- **[문서]** 지원 포맷은 BMP, GIF, JPEG, PNG, WebP, **SVG**, AVIF입니다. SVG는 문서상 색인 대상이고 인라인 SVG에는 `<title>` 사용을 권장합니다. (같은 문서)
- **[문서]** 반응형 이미지에서는 `srcset`/`<picture>`를 쓸 때 **fallback `src`가 필수**입니다. 이미지는 관련 텍스트 근처에 배치하고, 파일명은 서술적으로 짓고, alt는 키워드 나열 없이 맥락을 서술합니다. (같은 문서)
- **[문서]** 크기·비율 수치는 Article 구조화데이터와 Discover 문서에만 있습니다. 일반 텍스트 결과 썸네일에 대한 공식 최소 크기는 **없습니다**.
  - Article `image`: 가로×세로 **5만 픽셀 이상**, 비율은 16x9·4x3·1x1, 크롤·색인 가능해야 하고 콘텐츠를 대표해야 합니다. https://developers.google.com/search/docs/appearance/structured-data/article
  - Discover: **폭 1200px 이상**, 30만 픽셀 초과, 16x9, `max-image-preview:large`, 로고·텍스트 과다 이미지 회피. https://developers.google.com/search/docs/appearance/google-discover
- **[문서]** `max-image-preview`: `none`은 미표시, `standard`는 기본 크기, `large`는 뷰포트 폭까지입니다. 지정하지 않으면 기본 크기로 표시됩니다. 웹검색·이미지·Discover·Assistant 전반에 적용됩니다. https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- **[문서]** 지연 로딩: 브라우저 내장 `loading="lazy"`와 IntersectionObserver는 안전합니다. 스크롤·클릭 등 **사용자 행동에 의존하는 로딩은 Google이 보지 못합니다**. URL 검사의 렌더 HTML에서 `src`가 실제로 채워졌는지 확인하라고 돼 있습니다. https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading
- **[문서]** 차단 수단은 robots.txt의 `Googlebot-Image` Disallow, 페이지 단위 `noimageindex`, 이미지 응답의 `X-Robots-Tag: noindex`입니다. 이 중 하나라도 걸리면 이미지가 결과에서 빠집니다. https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page
- **[문서]** 이미지 사이트맵은 **여전히 지원**됩니다(문서 최종 갱신 2025-12-10). 유효 태그는 `image:image`와 `image:loc` 둘뿐이고, caption·title·geo_location·license는 폐지됐습니다. URL당 최대 1,000개입니다. 다른 도메인(CDN)의 이미지 URL도 허용되며, "JS로 도달하는 이미지처럼 달리 찾기 어려운 이미지" 발견에 도움이 된다고 설명합니다. https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
- **[문서]** 반영 시간에 대한 공식 수치는 재크롤 문서의 "a few days to a few weeks"와 "보장 없음"뿐입니다. https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- **[문서]** 이미지 결과(팩)는 "image-seeking 쿼리에서 더 자주 나타난다"고만 돼 있고, 별도 자격 요건은 없습니다(같은 Image SEO 가이드). (visual-elements-gallery)
- **[2차]** 웹검색 내 이미지 팩에 우리 이미지가 뜨면 **GSC 웹 검색 실적에 노출과 팩의 순위가 기록**됩니다. 그러나 클릭은 Google Images 뷰어로 먼저 이동하므로 사이트 클릭은 거의 생기지 않습니다. 그 결과 "높은 순위, 큰 노출, CTR≈0"이라는 착시가 생깁니다. https://www.gsqi.com/marketing-blog/image-pack-rankings-in-google-web-search/ (2020)
- **[2차]** 학술 분석(arXiv 2306.01785)에서는 이미지 팩이 있는 SERP에서 팩에 **포함되지 않은** 결과의 CTR은 팩과 음의 상관, 포함된 결과는 양의 상관을 보였습니다. https://arxiv.org/html/2306.01785v1

### 우리 템플릿 실무 규칙
1. **[추론·확도 높음] 본문 첫 화면 근처에 실제 `<img>`를 1장 이상 둡니다.** 현재는 og:image와 JSON-LD에만 이미지가 있습니다. 문서상 이 둘도 썸네일 소스이긴 하지만, 썸네일 정의가 "페이지에서 가장 관련성 높은 이미지"이고 이미지 색인 경로가 `<img src>`입니다. 그래서 본문 `<img>`, og:image, JSON-LD `image`가 **같은 URL**을 가리키도록 맞추는 것이 가장 확실합니다.
2. 대표 이미지는 **텍스트 없는 규격 도해**로 만듭니다(예: 얼굴 실루엣과 치수선. 숫자 라벨은 최소화). 비율은 1:1 또는 4:3, **1200px 이상 버전**으로 준비합니다(Discover·large preview 겸용). 현행 600×600은 Article 기준(5만 픽셀 이상)은 충족하지만 Discover의 1200px 기준에는 못 미칩니다.
3. 도해가 SVG 원본이어도 **`<img src="…svg">` 또는 래스터(WebP/PNG) 병행**을 씁니다. og:image는 SNS 호환성 때문에 래스터를 유지합니다. (SVG의 색인 가능성은 [문서], og:image에 SVG가 부적합하다는 것은 [추론]입니다.)
4. `<meta name="robots" content="max-image-preview:large">`가 전 페이지에 들어 있는지 확인합니다.
5. 의미 있는 이미지에는 CSS `background-image`를 쓰지 않습니다. 첫 이미지는 eager로, 나머지는 네이티브 `loading="lazy"`로 둡니다. JS 스크롤 트리거 방식은 쓰지 않습니다.
6. CF 엣지 설정을 점검합니다. Bot Fight Mode, 핫링크 보호, WAF가 `Googlebot-Image`와 `Yeti`의 이미지 요청을 403으로 막고 있지 않은지 **실측**합니다. 이미지 경로에 `X-Robots-Tag`가 붙지 않았는지도 확인합니다.
7. 이미지 사이트맵은 2,570페이지에 `image:loc`만 추가합니다. 비용이 낮고 공식 지원되지만 효과 크기는 문서에 없으므로 P1로 둡니다.
8. **측정 주의**: 이미지를 추가한 뒤 '3.5 4.5 사진' 같은 image-seeking 쿼리에서 이미지 팩 노출이 잡히면 GSC의 CTR과 평균 순위가 **구조적으로 왜곡**됩니다. 도입 전에 GSC 기준선을 Web과 Image 검색 유형으로 분리해 저장합니다. 현재의 "클릭 0 이상치"도 SERP에 이미지 팩이나 직답 블록이 있는지 육안으로 확인해야 합니다. [추론] 이미지 팩 자체는 클릭 기여가 작습니다. 실익은 텍스트 결과 썸네일에 의한 CTR 개선 쪽에 있으며, 그 효과 크기는 Google 문서에 없습니다.

---

## Q2. 2026년 기준 구조화 데이터

### 문서화된 사실
- **[문서]** 현행 Search Gallery 목록에 Article, Breadcrumb, Image metadata, Product, Software app, Speakable 등이 있습니다. **HowTo와 FAQ는 목록에 없습니다.** https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- **HowTo**: **[2차]** 2023-08에 모바일에서 제거됐고 2023-09-13에 데스크톱에서도 제거되어 완전히 폐지됐습니다. https://www.searchenginejournal.com/google-completely-removes-how-to-rich-results/496479/ (원 공지: https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- **FAQPage**: 2023-08부터 정부·보건 권위 사이트로 제한돼 있었습니다. **[문서+2차]** **2026-05-07부로 Google 검색에서 FAQ 리치 결과 노출이 종료**됐습니다. 6월에 문서, 리포트, Rich Results Test 지원이 제거됐고 8월에 GSC API 지원도 제거됐습니다. 마크업은 남겨둬도 무해하며 schema.org 타입으로서는 유효합니다. https://developers.google.com/search/updates , https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/
  - 조회 도구의 요약에서 문서 삭제 일자가 "2025-06-15"와 "2026-06"으로 엇갈렸습니다. 2차 출처 다수가 2026-05-07 종료와 2026-06 문서 제거로 일치하므로 그쪽을 채택했습니다. 정확한 일자는 updates 페이지에서 재확인을 권합니다.
- **[문서]** 2025-09-09에 Course info, Estimated salary, Learning video, Special announcement, Vehicle listing이 폐지됐고, 2026-01-06에 Practice problems가 폐지됐습니다. (updates)
- **Article/WebPage + image**: **[문서]** 필수 속성은 없습니다. 제목·이미지·날짜 표시를 개선하는 데 도움이 됩니다. (article 문서)
- **BreadcrumbList**: **[문서]** 현행 지원입니다. 2025-01에 모바일 SERP URL 줄에서 breadcrumb 표시가 간소화됐고 데스크톱에서는 유지됩니다. https://developers.google.com/search/blog/2025/01/simplifying-breadcrumbs
- **ImageObject(license/creator)**: **[문서]** `contentUrl`에 더해 `creator`, `creditText`, `copyrightNotice`, `license` 중 하나 이상이 필요합니다. 효과는 **Google Images의 Licensable 배지와 크레딧 표시**입니다. IPTC `Digital Source Type`(`trainedAlgorithmicMedia` 등)으로 AI 생성 여부를 표기할 수 있습니다. https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- **Product/Offer**: **[문서]** 문서 전체가 실물 상품(배송·재고) 전제로 쓰여 있고, 서비스·디지털 서비스에 적용된다는 언급은 **없습니다**. https://developers.google.com/search/docs/appearance/structured-data/product
- **SoftwareApplication(WebApplication 포함)**: **[문서]** 리치 결과 필수 속성은 `name`, `offers.price`(무료는 0), 그리고 **`aggregateRating` 또는 `review`**입니다. https://developers.google.com/search/docs/appearance/structured-data/software-app
- **Speakable**: **[문서]** 베타 상태이고 **미국·영어·Google Home·뉴스 발행자 한정**입니다. https://developers.google.com/search/docs/appearance/structured-data/speakable
- **[문서]** AI 기능(AIO/AI Mode)에 필요한 특수 스키마는 **없습니다**. "구조화 데이터가 보이는 텍스트와 일치할 것"만 요구합니다. https://developers.google.com/search/docs/appearance/ai-features

### 실무 규칙
| 타입 | 판정 | 비고 |
|---|---|---|
| Article(또는 WebPage) + `image` + `primaryImageOfPage` | **추가/유지 (P0)** | 썸네일 소스로 문서화됨. 이미지는 본문 `<img>`와 같은 URL |
| BreadcrumbList | **유지 (P0)** | 현행 지원 |
| ImageObject license/creator/creditText | 추가 (P1) | 효과는 Google Images 한정. AI 예시 이미지에는 IPTC digital source type을 함께 기재 |
| FAQPage | **Google 리치결과 없음.** 기존 마크업은 방치해도 되고 신규 투자는 하지 않음 | 네이버·기타 엔진용으로 남겨둘지는 네이버 원문을 확인한 뒤 결정 |
| HowTo | **폐지.** 투자하지 않음 | |
| Speakable | 해당 없음(비영어·비뉴스) | |
| SoftwareApplication/WebApplication | 조건부 | 실제 사용자 리뷰·평점 데이터가 페이지에 보일 때만 사용. **평점을 지어내면 안 됨** |
| Product/Offer (유료 디지털 서비스) | **비권장 [추론]** | 문서가 실물을 전제로 함. 2,570페이지에 일괄 적용하면 "페이지와 불일치하는 마크업"으로 수동조치를 받을 위험이 있고, 보상(가격 스니펫)은 불확실함. 가격 정보는 HTML 텍스트로 제공하면 충분 |

---

## Q3. 네이버

### 확인된 것 (대부분 2차 출처·미검증)
- **[미검증/기억]** 서치어드바이저 웹마스터 가이드에는 og 태그(og:title, og:description, og:image, og:url) 권장, 이미지 alt 제공, "중요한 정보는 이미지가 아닌 텍스트로" 취지의 콘텐츠 마크업 가이드, JSON-LD·마이크로데이터 기반 구조화 데이터 지원(사이트 이동경로 BreadcrumbList, 캐러셀 ItemList 등)이 있는 것으로 기억합니다. **원문 열람에 실패해 타입 목록과 문구의 정확성은 보증하지 못합니다.** 원문: https://searchadvisor.naver.com/guide
- **[2차]** 서치어드바이저 사이트 진단은 title 누락, meta description 누락, heading 구조, **이미지 alt 누락**을 검사합니다. URL 검사는 OG 태그를 메타데이터 항목으로 점검합니다(2022-10 업데이트). https://www.interad.com/insights/naver-search-advisor-update
- **[2차·에이전시 주장]** 네이버 이미지 캐러셀·썸네일 노출 조건으로 서치어드바이저 등록, og 태그, JSON-LD(ItemList 등), **og:image 1200×630·300KB 이하·텍스트 없는 고화질**이 거론됩니다. 반영 기간은 출처에 따라 1~2주에서 40일 이상까지 갈립니다. 네이버 공식 수치가 아닙니다. https://www.designkits.co.kr/blog/know-how/carousel-contents , https://weekerp.com/ko/blog/naver-search-image-carousel-json-ld
- **[2차]** "네이버는 스키마를 어떻게 활용하는지 공개하지 않는다. 네이버 측 효과는 그럴듯하지만 입증되지 않았다"는 평가가 있습니다. Yeti는 클릭·스크롤 후에 로딩되는 콘텐츠를 잘 수집하지 못한다는 실무 보고도 있습니다. https://www.arfadia.com/blog/naver-technical-seo-search-advisor/
- **AI 브리핑**:
  - **[2차]** 네이버가 2026-05 미디어 라운드테이블에서 AI 브리핑 사용 콘텐츠 중 **네이버 UGC 비중이 70%**라고 밝혔습니다.
  - **[2차]** 독립 분석(2026-06~07)에서는 네이버 내부 출처가 82%, 외부 웹이 18%였습니다.
  - **[2차]** 외부 사이트 운영자가 인용을 측정할 공식 도구는 없습니다.
  - **[2차]** 네이버가 공개한 원칙은 경험, 일관 주제, 진정성, **읽기 쉬운 구조**, 최신성 다섯 가지입니다. https://blog.lead-gen.team/naver-ai-briefing-vs-google-guide
  - **[2차]** 인용 272건 중 49.3%가 상위 10위 밖이었다는 분석이 있습니다. https://seonews.co.kr/naver-ai-briefing-geo-202605/
  - 이미지 유무가 AI 브리핑 인용에 미치는 효과에 대한 **문서화된 근거는 찾지 못했습니다**.

### 실무 규칙
1. **og:image는 1200×630 비율 버전을 별도로 만드는 것을 검토합니다.** 현행 600×600 1:1은 네이버·카카오 미리보기에서 잘릴 가능성이 있습니다. [추론] 단 구글용 1:1·4:3 본문 이미지와의 일관성을 위해, og:image는 1200×630으로 두고 Article `image`에는 복수 비율 배열(1x1, 4x3, 16x9)을 넣는 방식이 양쪽 요구를 만족시킵니다.
2. 모든 `<img>`에 alt를 넣습니다(네이버 진단 항목이자 KWCAG 요건). 정보는 HTML 텍스트로 제공합니다.
3. 이미지는 정적 HTML에 `src`로 직접 넣습니다(Yeti의 JS·인터랙션 수집 한계 보고에 대한 대응).
4. robots.txt와 CF WAF에서 `Yeti`의 이미지 경로 접근이 허용되는지 실측합니다.
5. **사람이 확인할 것**: 서치어드바이저 가이드의 구조화 데이터 섹션에서 지원 타입 현행 목록(특히 FAQ 유지 여부)과 이미지 검색 수집 요건.

---

## Q4. AI 답변 엔진 (짧게)

- **[문서]** Google은 AIO/AI Mode에 "추가 요건·특수 최적화·특수 스키마가 없다"고 하며, 색인되고 스니펫 자격이 있으면 된다고 합니다. 권고 항목 중에 "텍스트를 **고품질 이미지·영상으로 보강**하라"가 있습니다. `nosnippet`이나 `max-snippet`을 쓰면 AI 입력에서도 제외됩니다. https://developers.google.com/search/docs/appearance/ai-features
- **[문서]** ChatGPT search에 나타나려면 `OAI-SearchBot`을 차단하지 않아야 합니다(robots 변경은 약 24시간 후 반영). https://developers.openai.com/api/docs/bots , https://help.openai.com/en/articles/12627856-publishers-and-developers-faq . Perplexity는 `PerplexityBot`과 `Perplexity-User`를 씁니다. https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- **[2차·통제 연구]** Ahrefs(2026-05-11)가 스키마를 추가한 1,885페이지를 대조군 4,000페이지와 비교했습니다. AI Overviews는 −4.6%, AI Mode는 +2.4%(≈0), ChatGPT는 +2.2%(≈0)였고, 결론은 **"스키마 추가로 인용이 의미 있게 늘지 않는다"**입니다. https://ahrefs.com/blog/schema-ai-citations/
- **[2차·학술]** GEO 논문(Princeton 등)은 통계·인용문·출처 추가가 생성엔진 가시성을 높인다고 보고했습니다. https://arxiv.org/abs/2311.09735 . 이 연구는 텍스트 개입에 관한 것이며 이미지 효과가 아닙니다.
- **[2차·약함]** "표가 있으면 인용 +47%", "멀티포맷 1.4배/+156%", "스키마 3.2배" 같은 수치가 돌아다니지만, 방법론이 공개되지 않은 에이전시·벤더 자료입니다. 통제 연구(Ahrefs)와 상충하는 부분도 있습니다. "인용 구절의 55%가 페이지 상위 30%에서 나온다"는 CXL 100페이지 연구는 원문이 403으로 막혀 열람하지 못했습니다. https://cxl.com/blog/google-ai-overview-citation-sources/
- **규칙 [추론]**:
  - "한눈에 보기" 박스와 규격 표는 **HTML 텍스트로, 페이지 상단에** 둡니다(크기·배경·최근 촬영 기준 등 핵심 수치를 문장과 표로). 이미지의 AI 인용 효과는 입증되지 않았으므로 이미지의 역할은 사람 설득과 썸네일용으로 한정합니다.
  - 이미지에는 캡션(HTML)을 붙여 이미지가 담은 사실이 텍스트로도 남게 합니다.
  - CF에서 OAI-SearchBot과 PerplexityBot이 차단돼 있지 않은지 실측합니다.

---

## Q5. 긴 도구 중심 상세페이지의 모바일 전환 패턴

### 근거
- **NN/g 스크롤·주의 (2018)**: 시청 시간의 **57%가 첫 화면, 74%가 상위 2화면**에 집중됩니다. 최상단에는 핵심 사용자·비즈니스 목표를 두고, 페이지가 끝난 것처럼 보이는 "가짜 바닥"을 피하라고 권합니다. https://www.nngroup.com/articles/scrolling-and-attention/
- **Baymard 이미지**:
  - 상품 페이지에 도착한 사용자의 56%가 **첫 행동으로 이미지를 탐색**합니다.
  - 42%가 이미지로 크기를 가늠하려 하며 "In Scale" 이미지가 필요합니다. https://baymard.com/blog/in-scale-product-images
  - **설명 텍스트·그래픽이 든 이미지**(Feature Callout)는 사용자의 주의를 붙잡고 대체로 긍정적으로 받아들여지는데, 52%의 사이트가 제공하지 않습니다. https://baymard.com/blog/product-images-descriptive-text
  - 설명을 "하이라이트(이미지·아이콘 + 짧은 문단)" 구조로 짜면 관여도가 올라가는데, 78%의 사이트가 이렇게 하지 않습니다. https://baymard.com/blog/structure-descriptions-by-highlights
- **Baymard 레이아웃**: 수평 탭에서는 사용자가 핵심 콘텐츠를 자주 놓칩니다. 권장 레이아웃은 데스크톱에서 "펼친 섹션 + (선택) 스티키 목차", **모바일에서 "접힌 섹션"**입니다. https://baymard.com/blog/avoid-horizontal-tabs
- **NN/g 모바일 아코디언 (2015)**: 아코디언은 미니 목차 역할을 하는 장점이 있습니다. 첫 항목을 자동으로 펼치지 말 것, 긴 내용에는 스티키 헤더나 닫기 버튼을 둘 것, Back 버튼 동작을 고려할 것을 권합니다. https://www.nngroup.com/articles/mobile-accordions/
- **NN/g 인페이지 링크·목차 (2023)**: 참가자 11명 중 10명이 인페이지 링크를 인지했습니다. 긴 페이지에서 건너뛰기와 개요 파악에 유효합니다. "목차" 또는 "이 페이지에서"라는 라벨을 명시하라고 합니다. 요약에 따르면 인페이지 링크는 데스크톱에, 아코디언은 모바일에 더 적합합니다. https://www.nngroup.com/articles/in-page-links-content-navigation/
- **NN/g 모바일 표 (2017)**:
  - 복잡한 데이터는 화면당 2열 정도로 제한합니다.
  - 헤더 행과 첫 열을 고정합니다.
  - 가로 스크롤이 있으면 **잘린 요소나 화살표로 암시**합니다(점 인디케이터는 사용자가 자주 놓칩니다).
  - 기기 회전을 강요하지 않습니다. https://www.nngroup.com/articles/mobile-tables/
- **NN/g 스티키 요소**: 최소 높이로 만들고, 불투명 배경을 쓰고, 애니메이션은 300~400ms로 하고, 터치 타깃은 1cm 이상으로 하고, 꼭 필요한지 비용과 편익을 따지라고 합니다. https://www.nngroup.com/articles/sticky-headers/
- **스티키 CTA A/B (GrowthRock, 1개 사이트)**: 모바일에서 주문 +5.2%(신뢰도 98%)가 나왔지만, **슬라이드업 드로어형에서만** 유의했습니다. 단순히 섹션으로 스크롤시키는 방식은 무효였습니다. 데스크톱은 +7.9%였습니다. https://growthrock.co/sticky-add-to-cart-button-example/
  - "Baymard가 스티키 ATC로 5~12% 상승을 보고했다"는 인용이 떠돌지만 Baymard 1차 출처를 찾지 못했습니다(아래 '근거 없는 통념' 참조).
- **SEO·접힌 콘텐츠**: Google의 Gary Illyes(2016)와 John Mueller(2020)는 모바일 우선 색인에서 UX 목적으로 접은 콘텐츠도 **HTML에 있으면 온전히 반영**된다고 밝혔습니다. https://www.searchenginejournal.com/googles-mueller-on-myth-of-hidden-tab-content/358724/ , https://www.seroundtable.com/google-content-hidden-mobile-24111.html . 다만 이는 공식 문서가 아니라 발언입니다.
- **신뢰**: NN/g가 꼽는 신뢰성 4요소는 디자인 품질, 사전 공개(가격·조건), 포괄적이고 최신인 콘텐츠, 외부와의 연결(출처 링크)입니다. https://www.nngroup.com/articles/trustworthy-design/ (본 세션에서 본문을 재열람하지는 않았습니다.)

### Do / Don't
**Do**
1. 첫 화면에는 H1, 규격 핵심 3~4개 수치("한눈에 보기" 카드, HTML 텍스트), 업로드 CTA, 대표 도해 1장을 둡니다. 도구는 상위 2화면 안에 배치합니다.
2. 모바일 스티키 CTA는 얇은 하단 바로 만듭니다. 탭하면 **도구를 바로 여는(드로어·모달형)** 동작이 단순 앵커 점프보다 근거가 강합니다. 불투명 배경을 쓰고, 첫 화면의 CTA가 화면에서 벗어난 뒤에만 나타나게 합니다.
3. 긴 본문에는 "이 페이지에서" 목차(앵커)를 둡니다. 모바일에서 보조 섹션(국가별 예외, 제출처 안내 등)은 접힌 섹션으로 만들되 **HTML에 전량 포함**하고(`<details>` 등) JS 지연 주입은 쓰지 않습니다. 핵심 규격·반려 사유는 접지 않습니다.
4. 합격/불합격 예시 그리드는 이미지마다 **HTML 캡션으로 "왜 불합격인지"를 한 문장씩** 적습니다(Baymard의 feature-callout·highlights 원리). ✓/✗는 색과 아이콘과 텍스트를 함께 써서 색각 이상 사용자에게도 전달되게 합니다.
5. 규격 표는 2열(항목|값)을 기본으로 합니다. 다국가 비교 표는 첫 열을 고정하고 가로 스크롤 시 오른쪽이 잘려 보이게 합니다.
6. 신뢰 신호로 공식 출처 링크와 확인일, 가격·환불 조건의 사전 공개, 최근 갱신일을 넣습니다.

**Don't**
- 수평 탭으로 핵심 콘텐츠를 나누지 않습니다.
- 아코디언 첫 항목을 자동으로 펼쳐 구조를 가리지 않습니다.
- 섹션 사이에 큰 여백이나 풀블리드 배너로 "가짜 바닥"을 만들지 않습니다.
- 반투명·대형 스티키 요소로 콘텐츠를 가리지 않습니다.
- 페이지 길이 자체를 목표로 삼지 않습니다. 길이의 적정선은 테스트로 정하라는 것이 NN/g의 권고입니다.

---

## Q6. 한국형 상세페이지 관례와 하이브리드

### 근거
- **[2차]** 스마트스토어 상세설명 권장 폭은 **860px**이고(네이버 고객센터 안내를 인용한 2차 출처), SmartEditor ONE으로 글과 사진을 블록 단위로 작성합니다. https://1minutesangse.com/guides/smartstore-detail-page , https://gruuz.com/ko-kr/smart-store-product-detail-page/ . **[2차]** 업계 조언은 상세페이지를 "블로그처럼 글과 사진을 섞어" 구성하라는 것입니다. https://inside.ampm.co.kr/bbs/board.php?bo_table=insight&wr_id=4373 . "통이미지는 검색에 반영되지 않는다"는 네이버 공식 공지는 **찾지 못했습니다**.
- **[문서]** KWCAG 2.2(KS X OT0003): 텍스트 아닌 콘텐츠에는 의미와 용도를 알 수 있는 **대체 텍스트**가 필수입니다(인식의 용이성). 구성은 4원칙·14지침·33검사항목입니다. https://a11ykr.github.io/kwcag22/ . WCAG 2.x SC 1.4.5(텍스트 이미지, AA)는 텍스트 이미지를 **순수 장식이거나 특정 표현이 필수적인 경우(로고타입)에만** 쓰도록 합니다. https://a11ykr.github.io/docs/wcag2/ , https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html
- **[문서]** W3C WAI 복잡 이미지(도해·인포그래픽) 지침: **짧은 alt + 긴 설명**의 2단 구조를 씁니다. `<figure>`/`<figcaption>`로 묶거나, 인접 텍스트·링크, `aria-describedby`를 씁니다. 긴 설명을 모든 사용자에게 보이게 하는 것이 최선이라고 합니다. https://www.w3.org/WAI/tutorials/images/complex/
- **[문서]** Google은 선호 이미지에 텍스트 든 이미지를 피하라고 하고, CSS 이미지는 색인하지 않습니다. (Q1 출처)
- **[추론] 통이미지가 설득에 유효한 이유**: 세로 흐름의 서사(문제→근거→증거→CTA), 타이포와 이미지의 강한 시각 위계, 그리고 "이미지부터 본다"는 사용자 행동(Baymard 56%)이 맞물립니다. **깨지는 지점**:
  - 검색엔진과 AI가 본문을 읽지 못합니다.
  - 6개 언어 번역 비용이 N배로 늘어납니다.
  - 확대·리플로우·스크린리더를 지원하지 못합니다.
  - 수 MB 이미지 때문에 LCP와 데이터 비용이 나빠집니다.
  - 규격 수치가 바뀌면 이미지를 전부 다시 만들어야 합니다.

### 실무 규칙 (하이브리드)
1. 상세페이지의 **리듬(큰 비주얼 → 짧은 헤드라인 → 2~3줄 본문 → 다음 비주얼)**만 가져오고, 글자는 전부 HTML과 CSS 타이포로 구현합니다.
2. 이미지 안의 글자는 **치수 라벨 수준으로 최소화**합니다. 라벨이 담은 값은 반드시 인접한 HTML(표·캡션)에 중복해 적습니다. 이렇게 하면 6개 언어 대응이 "이미지는 공용, 텍스트만 번역"으로 단순해집니다. 가능하면 도해를 언어 중립(숫자·단위만)으로 만듭니다.
3. 모든 콘텐츠 이미지를 `<figure><img alt="…"><figcaption>…</figcaption></figure>`로 감쌉니다. alt는 "무엇을 보여주는가"를, figcaption은 "그래서 무엇을 지켜야 하는가"를 적습니다. 장식 이미지는 `alt=""`로 둡니다.
4. 합격/불합격 그리드는 각 셀에 이미지와 HTML 라벨(✓/✗ + 사유)을 함께 둡니다. 이미지에 ✓/✗를 구워 넣지 않습니다.

---

## Q7. 이미지 6~12장 추가 시 성능 예산

### 근거
- **[문서]** LCP 이미지는 **절대 lazy-load하지 않습니다.** HTML 소스에서 발견 가능해야 합니다. LCP 후보에는 `fetchpriority="high"`를 붙입니다. CSS·JS로만 참조되는 이미지라면 preload합니다. LCP 시간 배분의 이상치는 TTFB 약 40%, 로드 지연 10% 미만, 로드 시간 약 40%, 렌더 지연 10% 미만입니다. https://web.dev/articles/optimize-lcp
- **[문서]** 첫 뷰포트 이미지는 eager 로딩합니다. Chrome의 lazy 임계값은 4G에서 1250px, 3G 이하에서 2500px입니다. `loading=lazy`와 `fetchpriority=high`를 함께 쓰면 의미가 없습니다. 모든 `<img>`에 `width`/`height`를 넣습니다. https://web.dev/articles/browser-level-image-lazy-loading
- **[문서]** CLS의 최대 원인은 치수 없는 이미지입니다. `width`/`height` 속성과 CSS `height:auto`를 같이 씁니다. srcset의 후보들은 **동일 종횡비**여야 합니다. 아트 디렉션을 할 때는 `<source>`에도 치수를 넣습니다. 목표는 75퍼센타일 CLS 0.1 이하입니다. https://web.dev/articles/optimize-cls
- **[문서]** `<picture>`로 AVIF → WebP → JPEG/PNG 순의 폴백을 둡니다. AVIF는 JPEG 대비 50% 이상 절감됩니다. 선·문자·날카로운 경계가 있는 이미지에는 무손실이나 SVG가 맞습니다. `decoding="async"`를 씁니다. 변형 수를 너무 늘리면 HTML이 커지고 캐시가 분산됩니다. https://web.dev/learn/performance/image-performance
- **[문서]** Google도 srcset을 쓸 때 fallback `src`를 요구합니다. (Q1 출처)

### 실무 규칙
1. **히어로가 이미지가 되면 LCP 요소가 텍스트(H1)에서 이미지로 바뀝니다.** 선택지는 둘입니다.
   - (a) 히어로 도해를 작게 만들어(모바일에서 뷰포트 폭의 40~50%) H1·요약 텍스트 블록이 LCP로 남게 합니다.
   - (b) 이미지가 LCP가 되는 것을 받아들이고 `fetchpriority="high"`와 eager 로딩을 붙입니다. 크기는 50KB 이하를 목표로 하고 preload는 필요 없습니다(HTML에 직접 있으므로).
   
   [추론] 정적 엣지 HTML이라 TTFB가 작으므로 (b)도 충분히 통과할 수 있습니다. 다만 2,570페이지가 같은 템플릿이므로 도입 전후에 CrUX나 Lighthouse 모바일로 실측해 비교해야 합니다.
2. 포맷: 도해·선화는 **SVG**(gzip/brotli 압축 시 수 KB이고 해상도에 독립적)로 하고 og:image와 JSON-LD용으로 래스터를 병행합니다. 인물 예시 사진은 **AVIF + WebP + JPEG 폴백**으로 합니다. 예시 사진의 표시 폭은 모바일 기준 160~360px이면 충분하므로 `srcset`은 320w, 640w, 960w 세 단계로 하고 `sizes`를 실제 레이아웃에 맞춥니다(예: `(max-width:600px) 45vw, 300px`).
3. 첫 이미지를 뺀 **나머지 전부에 `loading="lazy" decoding="async"`**를 붙입니다. 모든 이미지에 `width`/`height`를 넣습니다. 그리드 셀에는 `aspect-ratio`를 지정합니다.
4. 예산 제안 [추론]: 이미지 총 전송량을 모바일 최초 뷰 100KB 이하, 페이지 전체 600KB 이하로 잡습니다. 예시 사진 1장은 AVIF 기준 15~40KB가 목표입니다.
5. 캐시: 이미지에는 **해시 파일명**과 `Cache-Control: public, max-age=31536000, immutable`을 적용합니다(https://web.dev/articles/http-cache). 예시·도해 이미지는 **국가×언어 페이지에서 공용 URL로 재사용**합니다. 2,570페이지가 수십 개 자산을 공유하면 CDN과 브라우저 캐시 효율이 커집니다. HTML은 기존 SWR을 유지합니다.
6. 접힌 섹션(`<details>`) 안의 lazy 이미지는 펼칠 때 로드됩니다. 이것은 정상 동작이고 색인에도 문제가 없습니다(네이티브 lazy이므로).

---

## Q8. 법·윤리 (예시 사진)

### 근거
- **[2차·로펌 해설] 한국 AI 기본법**: 2026-01-22 시행입니다. 제31조의 내용은 세 항입니다. 1항은 생성형·고영향 AI 서비스임을 **사전 고지**하는 의무, 2항은 생성형 AI 결과물에 **표시**하는 의무(사람 또는 기계가 판독할 수 있는 형식), 3항은 실제와 구분하기 어려운 결과물(딥페이크)을 **명확히 인식할 수 있게** 고지·표시하는 의무입니다(예술 창작물은 예외). 의무 주체는 **인공지능사업자**(개발사업자와 이용사업자)입니다. **AI 생성물을 자기 콘텐츠에 단순 활용하는 이용자는 제외됩니다.** 서비스 내에서 제공할 때는 UI 문구로 표시하고, 다운로드 등으로 외부에 반출될 때는 결과물 자체에 워터마크나 메타데이터를 넣습니다. https://www.shinkim.com/kor/media/newsletter/3142 , 법령: https://www.law.go.kr/lsInfoP.do?lsiSeq=268543
- **[2차]** 최소 1년 이상의 계도기간이 있어 과태료는 빨라도 2027년 이후에 부과됩니다. 금액은 1회 500만, 2회 1,000만, 3회 이상 1,500만 원(출처 보도 기준)입니다. https://datalaw.kr/posts/ai-basic-law-business-duties/ . 확정 수치는 시행령 원문으로 확인해야 합니다.
- **[문서] EU AI Act 제50조**: 2026-08-02부터 적용됩니다. 50(2)는 **제공자**에게 생성물을 기계 판독 가능하게 마킹할 의무를 부과합니다(기존 출시 시스템은 2026-12-02까지 유예). 딥페이크는 기존 대상과의 유사성, 진짜처럼 보임, 기만 가능성의 3요소를 모두 갖춘 것으로 정의되며, 배포자에게 공개 의무가 있습니다. Code of Practice가 있습니다. https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act , https://artificialintelligenceact.eu/transparency-rules-article-50/
- **[문서]** Google 이미지 메타데이터는 IPTC `Digital Source Type`의 `trainedAlgorithmicMedia`를 지원합니다. (Q2 출처)
- **[문서] 정부상징 무단 사용**: 정부상징을 상업적으로 쓰면 부정경쟁방지법상 국기·국장 등 사용금지, 영업주체 혼동, **품질 오인**(정부가 보증한 것처럼 보이게 함)에 해당할 수 있고 형사처벌 대상입니다(특허청·행안부). https://www.korea.kr/briefing/pressReleaseView.do?newsId=156355640 . 부처 MI는 공공누리 4유형(출처표시·상업이용금지·변경금지)인 경우가 있습니다. https://www.mcst.go.kr/site/s_about/intro/symbol.jsp , https://www.kogl.or.kr/info/freeUse.do

### 실무 규칙 [추론 포함 — 법률 자문 아님]
1. **본 서비스(AI 증명사진 생성)는 인공지능이용사업자에 해당할 가능성이 높습니다.** 서비스에 대한 사전 고지와 결과물 표시는 예시 이미지와 별개로 챙겨야 할 의무입니다. 증명사진 결과물에 가시적 워터마크를 넣을 수 없으므로 기계판독 메타데이터 방식이 현실적입니다. 다만 제출처 규정과 충돌하는지는 별도로 검토해야 합니다.
2. 페이지의 **AI 생성 예시 얼굴**은 법상 의무 대상인지 불명확합니다(단순 활용에 가깝습니다). 그래도 그리드 하단 캡션에 "예시 인물은 AI로 생성한 가상 인물입니다"를 적고, IPTC `trainedAlgorithmicMedia`와 ImageObject `creditText`를 넣으면 비용이 거의 들지 않고 EU와 한국 양쪽 방향에 부합합니다. 6개 언어로 번역합니다.
3. 실존 인물과 닮은 얼굴은 피합니다(생성 후 역이미지 검색으로 표본 확인). 연예인풍 프롬프트는 쓰지 않습니다. 실제 고객 사진은 사용하지 않습니다. 인종·성별 다양성은 국가 페이지 맥락에 맞게 조정하되 고정관념을 강화하지 않도록 합니다.
4. 정부 로고, 여권 표지 엠블럼, 부처 MI는 **쓰지 않습니다.** 공식 규정은 **텍스트 인용, 출처 링크, 확인일**로 표기합니다. "공식", "정부 인증", "합격 보장"으로 오인될 표현과 배지도 쓰지 않습니다. "~ 규정에 근거해 제작"이라는 서술 수준으로 표현합니다.
5. 불합격 예시는 "일반적 반려 사유 예시"로 표기합니다. 특정 기관이 해당 사진을 반려했다는 인상을 주지 않습니다.

---

## 우선순위 구현 체크리스트

### P0 — 싸고 확실한 것
- [ ] 본문 상단에 대표 도해를 `<img>`로 넣습니다(텍스트 최소, 1:1 또는 4:3, 1200px 이상 원본). 본문 `<img>`, og:image 계열, JSON-LD `image`/`primaryImageOfPage`의 URL을 일치시킵니다.
- [ ] 전 페이지에 `max-image-preview:large`가 있는지 확인합니다.
- [ ] 모든 `<img>`에 `width`/`height`, 서술적 alt, 서술적 파일명을 넣습니다. 첫 이미지는 eager(히어로이면 `fetchpriority=high`), 나머지는 `loading=lazy decoding=async`입니다. 의미 있는 이미지에 CSS 배경은 쓰지 않습니다.
- [ ] 이미지를 `<figure>`/`<figcaption>`으로 감쌉니다. 이미지가 담은 정보는 전부 HTML 텍스트로 중복합니다(6개 언어 번역은 텍스트만).
- [ ] "한눈에 보기" 카드(HTML)와 CTA를 첫 화면에 두고, 도구는 상위 2화면 안에 둡니다.
- [ ] CF 엣지, robots.txt, WAF에서 `Googlebot-Image`, `Yeti`, `OAI-SearchBot`, `PerplexityBot`의 이미지·페이지 접근이 200인지 실측합니다. 이미지 응답에 `X-Robots-Tag`가 없는지 확인합니다.
- [ ] 이미지에 해시 파일명과 immutable 장기 캐시를 적용하고, 자산은 페이지 간 공용 URL로 재사용합니다.
- [ ] GSC 기준선을 Web과 Image 검색 유형으로 분리해 저장합니다. 도입 후 이미지 팩으로 CTR·순위가 왜곡될 것에 대비합니다.
- [ ] 정부 로고·엠블럼을 쓰지 않고, AI 예시 인물 고지 캡션을 넣습니다.
- [ ] HowTo·FAQ·Speakable·Product에는 신규 투자를 하지 않습니다.

### P1
- [ ] 합격/불합격 예시 그리드(HTML 사유 캡션, 색·아이콘·텍스트 3중 표기, AVIF/WebP/JPEG `<picture>`, srcset 3단계)
- [ ] 모바일 스티키 CTA(도구를 바로 여는 방식, 불투명·얇게), "이 페이지에서" 목차, 보조 섹션 `<details>` 접기(HTML 전량 포함)
- [ ] 규격 표 모바일 최적화(2열 기본, 비교표 첫 열 고정, 잘림 암시)
- [ ] 이미지 사이트맵(`image:loc`만)
- [ ] og:image 1200×630 버전과 Article `image` 다중 비율 배열(1x1·4x3·16x9)
- [ ] ImageObject `creator`/`creditText`/`license`와 IPTC digital source type
- [ ] 도입 전후 LCP/CLS 실측(CrUX·Lighthouse 모바일, 템플릿 단위). 효과 판정은 2~4주 뒤에 합니다(재크롤에 수일에서 수주 걸립니다).
- [ ] **서치어드바이저 가이드 원문을 사람이 확인**합니다(구조화 데이터 지원 타입, 이미지 수집 요건). 본 보고의 네이버 항목이 미검증이기 때문입니다.

### P2
- [ ] SoftwareApplication/WebApplication 마크업(실제 리뷰·평점이 페이지에 노출된 이후에만)
- [ ] 스티키 CTA 변형 A/B(드로어형 대 앵커형), 페이지 길이와 섹션 순서 테스트
- [ ] 네이버 캐러셀용 ItemList(허브·목록 페이지 한정, 효과 미입증)
- [ ] AI 기본법 서비스 결과물 표시 방식의 법률 검토(메타데이터 방식과 제출처 규정의 정합성)

---

## 흔히 믿지만 현행 문서로 뒷받침되지 않는 것

1. **"FAQ 스키마를 넣으면 구글 SERP에 FAQ가 펼쳐진다."** 2023년에 제한됐고 **2026-05-07에 완전히 종료**됐습니다.
2. **"HowTo 스키마로 단계별 리치 결과가 나온다."** 2023-09에 폐지됐습니다.
3. **"스키마를 넣으면 AI 인용이 늘어난다(3.2배 등)."** Google은 특수 스키마가 필요 없다고 명시합니다. 통제 연구(Ahrefs 2026)에서도 유의한 상승이 없었습니다.
4. **"표·이미지·멀티포맷이면 AI 인용 +47%/+156%."** 방법론이 공개되지 않은 벤더 수치입니다. Google 문서에는 "이미지·영상으로 보강하라"는 일반 권고만 있습니다.
5. **"og:image만 있으면 구글 썸네일이 뜬다" 또는 "og:image는 구글과 무관하다."** 둘 다 부정확합니다. og:image와 스키마는 **소스 중 하나**로 문서화돼 있지만, 선택은 자동이며 "페이지에서 가장 관련성 높은 이미지"가 기준입니다. 노출 보장은 없습니다.
6. **"구글 텍스트 결과 썸네일에 공식 최소 크기(예: 1200px)가 있다."** 1200px는 **Discover** 기준이고 5만 픽셀은 **Article 마크업** 기준입니다. 일반 썸네일에 대한 공식 수치는 없습니다.
7. **"SVG는 구글 이미지에 색인되지 않는다."** 문서상 지원 포맷입니다.
8. **"이미지 사이트맵은 폐지됐다."** 폐지된 것은 caption·title·geo·license **태그**뿐이고, `image:image`와 `image:loc`는 현행입니다.
9. **"`?v=` 같은 쿼리나 `loading=lazy`가 색인을 막는다."** 네이티브 lazy는 공식 권장 방식입니다. 문제가 되는 것은 **사용자 행동 의존 로딩**입니다.
10. **"아코디언·탭에 넣은 텍스트는 구글이 감점한다."** 모바일 우선 색인 이후 Google 담당자들이 full weight라고 발언했습니다. 다만 공식 문서가 아니라 발언 수준이며, UX상 놓칠 위험(Baymard)은 SEO와 별개의 문제입니다.
11. **"Baymard가 스티키 CTA로 전환 5~12% 상승을 입증했다."** 1차 출처를 찾지 못했습니다. 확인된 근거는 개별 A/B(GrowthRock, 1개 사이트, 드로어형만 유의)입니다.
12. **"이미지 팩에 뜨면 클릭이 는다."** 팩 클릭은 Google Images로 먼저 이동합니다. GSC에는 노출과 순위만 쌓이고 CTR이 희석됩니다. 실익은 텍스트 결과 썸네일 쪽에 있고, 그 효과 크기도 공식 수치가 없습니다.
13. **"Product 스키마를 서비스 페이지에 붙이면 가격 스니펫을 얻는다."** 문서는 실물 상품을 전제로 하고 서비스 적용 근거는 없습니다. 대량 적용은 위험합니다.
14. **"네이버는 og:image 1200×630·300KB를 공식 요구한다", "JSON-LD를 넣으면 네이버 캐러셀이 뜬다."** 에이전시의 권고일 뿐이고 공식 수치와 보장을 확인하지 못했습니다(네이버 원문 미열람).
15. **"AI 생성 이미지를 쓰는 모든 웹페이지는 AI 기본법상 표시 의무가 있다."** 의무 주체는 인공지능사업자이고, 단순 활용 이용자는 제외된다는 것이 로펌의 해설입니다. 다만 우리 **서비스 본체**는 대상일 가능성이 높습니다.

---
✅ 8개 문항을 조사했습니다(Google·web.dev·W3C·EU는 1차 문서로 확인했습니다).
❌ 네이버 서치어드바이저 원문은 열람하지 못했습니다(도메인 차단). 네이버 항목은 2차 출처와 미검증 지식으로 작성했습니다.
💡 가장 큰 발견은 세 가지입니다. ① FAQ 리치결과가 2026-05-07에 완전히 종료됐습니다. ② 2026-03-02 문서 업데이트로 og:image와 schema가 썸네일 소스로 명문화됐습니다. ③ 이미지를 도입하면 GSC의 CTR·순위 지표가 이미지 팩 때문에 왜곡될 수 있으므로 기준선을 미리 분리해 저장해야 합니다.
⏳ 사람이 확인할 것: 서치어드바이저 구조화 데이터·이미지 가이드 원문, AI 기본법 시행령의 과태료·표시 방식 원문, FAQ 문서 삭제의 정확한 일자.
📁 생성·수정한 파일은 없습니다(읽기 전용).
🔀 해당 없음.
