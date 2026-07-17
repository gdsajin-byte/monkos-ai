---
type: report
date: 2026-07-16
device: 브라우저
agent: 철창이
status: 완료
subject: Technical SEO / GEO Audit — Citadel (specs pages)
---

**[2026-07-16 KST]** 브라우저/철창이 → 작가님

# Technical SEO / GEO Audit — Citadel (specs pages)

- **일자**: 2026-07-16
- **대상**: `https://monkos.ai/specs/passport/kr` (대표 샘플), sitemap 전체
- **방법**: Googlebot UA로 원문 HTML 직접 수신 후 파싱. 렌더링 엔진 없이 raw HTML만 검사 (= 크롤러가 최초로 보는 것과 동일 조건)
- **한계**: 실제 크롤 예산·렌더링 큐·색인 판정은 재현 불가. 본 감사는 **크롤러 입력 조건**에 한정됨

---

## 1. 요약

기술 SEO 기반은 **감점 요인 없음**. 워드프레스 + Yoast/Rank Math 조합이 제공하는 항목을 자체 구현으로 전부 충족하며, 일부 항목(PropertyValue 구조화, hreflang 상호참조)은 그 이상.

남은 과제는 뼈대가 아니라 **화물(콘텐츠 고유성)과 유통(계측 해상도)**.

---

## 2. 검증 결과

### 2.1 응답 / 렌더링

| 항목 | 결과 |
|---|---|
| HTTP | 200 |
| 응답 크기 | 42,496 bytes |
| 응답 시간 | 0.771s |
| SSR | ✅ JS 없이 본문·규격표·FAQ·내부링크 전부 HTML에 존재 |

`/specs/passport/korea` → `/specs/passport/kr` 301 정규화 후 canonical 일치. alias 처리 정상.

### 2.2 hreflang

```
<link rel="alternate" hreflang="ko"        href="https://monkos.ai/specs/passport/kr">
<link rel="alternate" hreflang="en"        href="https://monkos.ai/en/specs/passport/kr">
<link rel="alternate" hreflang="ja"        href="https://monkos.ai/ja/specs/passport/kr">
<link rel="alternate" hreflang="es"        href="https://monkos.ai/es/specs/passport/kr">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/en/specs/passport/kr">
```

- ✅ x-default 지정됨
- ✅ **상호참조 정상** — `/ja/` 페이지가 동일 세트를 반환하며 ko를 되가리킴
- ✅ 언어별 self-canonical (`/ja/...` → canonical `/ja/...`)

> 다국어 사이트에서 가장 흔한 실패 지점(상호참조 누락, 교차 canonical 오설정)이 없음.

### 2.3 구조화 데이터 (JSON-LD 1블록)

| @type | 개수 |
|---|---|
| PropertyValue | 10 |
| Question | 8 |
| Answer | 8 |
| ListItem | 3 |
| FAQPage | 1 |
| Article | 1 |
| BreadcrumbList | 1 |
| Organization | 1 |
| Person | 1 |
| Thing | 1 |

**PropertyValue 10개** = 규격표(사이즈/해상도/DPI/배경/머리높이/유효기간/파일규격)를 구조화 데이터로 노출. 규정 페이지 유형에서 가장 강한 자산.

### 2.4 robots.txt

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

User-agent: Googlebot   → Allow: /
User-agent: Yeti        → Allow: /   # 네이버
User-agent: Naverbot    → Allow: /
```

- ✅ 네이버 크롤러 명시 (국내 유입 경로 대응)
- ✅ 관리/API 경로 차단
- meta robots 태그 없음 → 기본 `index, follow` 적용. 의도된 상태로 판단

### 2.5 사이트맵

| 파일 | URL 수 |
|---|---|
| `sitemap-specs.xml` | **1,712** |
| `sitemap-blog.xml` | 223 |
| `sitemap-static.xml` | 19 |
| **합계** | **1,954** |

### 2.6 현지화 품질

| 언어 | title |
|---|---|
| ko | 대한민국 여권 사진 규격·규정 2026 — 3.5×4.5cm·배경·복장 \| MONKOS |
| ja | 韓国パスポート写真サイズ・規格 2026 — 3.5×4.5cm |

ja title이 직역이 아니라 **일본어 검색 어순**(「サイズ・規格」)을 따름. 기계번역 리스크 해당 없음.

### 2.7 GEO

- ✅ `llms.txt` → 200
- ✅ FAQPage 8문항이 질문-답변 쌍으로 구조화 → 생성형 엔진 인용에 유리한 형태
- ✅ 1차 출처 아웃바운드 (외교부 `passport.go.kr`)

---

## 3. 발견된 결함

| # | 심각도 | 내용 | 위치 |
|---|---|---|---|
| 1 | Low | `출처: 대한민국 여권 안내 (외교부)` 링크가 **2회 중복 렌더** | 규격표 하단 |
| 2 | Low | 반려사유 TOP 5 중 첫 항목(`얼굴 앞·뒤로 그림자`)만 `<ul>` 밖에 위치 — 마크업 불일치 | 반려사유 섹션 |
| 3 | Opportunity | 페이지에 `₩2,000` 가격이 노출되나 `Offer` / `Product` 스키마 없음 | 결제 CTA |

---

## 4. 권고

### 4.1 사이트맵 분할 (우선순위: 높음 / 비용: 낮음)

**현재**: `sitemap-specs.xml` 단일 파일에 1,712 URL
**문제**: Search Console 사이트맵 리포트가 1,712개 **합산 수치 하나**만 반환 → 언어별·문서종류별 색인률 분리 불가

**제안**:
```
sitemap-specs-ko.xml
sitemap-specs-en.xml
sitemap-specs-ja.xml
sitemap-specs-es.xml
```
또는 문서 종류 축(`passport / visa / license / id ...`)으로 분할.

**효과**: GSC가 세그먼트별 **제출 대비 색인 수**를 개별 리포트로 제공.
"어느 언어가 색인이 안 붙는가", "어느 문서 종류가 노출을 먹는가"의 해상도가 **대시보드 코드 변경 없이** 상승. 생성 로직에서 출력 파일만 분기하면 됨.

### 4.2 결함 1·2 수정 (우선순위: 낮음)

템플릿 레벨 수정이므로 1,712페이지 전체에 동일 영향. 중복 출처 렌더는 신뢰도 신호 낭비.

### 4.3 Offer 스키마 검토 (우선순위: 낮음)

가격 노출 시 SERP 리치 결과 가능성. 단, 서비스 페이지 유형에서 Google 적용 여부는 변동적이므로 A 그룹 소수 페이지에 선적용 후 판단 권장.

---

## 5. 결론

- 워드프레스 전환 검토 **불필요**. 플러그인이 제공하는 항목을 이미 전부 충족하며, 동적 페이지 + 크롭 위젯 + 결제 통합 구조는 워드프레스에서 오히려 구현 비용 증가
- 기술 SEO는 **채점 종료**. 개선 여지는 콘텐츠 고유성(국가별 화물 두께)과 계측 해상도에 존재
- 다음 액션은 §4.1 사이트맵 분할 → GSC 세그먼트 데이터 수집 → 상위 노출 국가 식별 → 해당 국가 우선 심화

---

*Audit method: raw HTML fetch via Googlebot UA, no JS rendering. Reproducible with the commands in Appendix.*

## Appendix — 재현 명령

```bash
# 원문 수신
curl -sL -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "https://monkos.ai/specs/passport/kr" -o kr.html \
  -w "HTTP %{http_code} | size %{size_download} | time %{time_total}s\n"

# hreflang
grep -o '<link[^>]*hreflang[^>]*>' kr.html

# canonical / robots meta
grep -oE '<link[^>]*rel="canonical"[^>]*>|<meta[^>]*name="robots"[^>]*>' kr.html

# 구조화 데이터 타입 집계
grep -o '"@type"[[:space:]]*:[[:space:]]*"[^"]*"' kr.html | sort | uniq -c | sort -rn

# 사이트맵 URL 총계
for sm in $(curl -sL https://monkos.ai/sitemap.xml | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g'); do
  echo "$sm : $(curl -sL "$sm" | grep -c '<loc>')"
done
```

---

> 전수 조사 보충 데이터는 별도 보고서 참조: `REPORT_20260717_iMac쌍아_SPECS_사이트맵_URL전수조사.md`
