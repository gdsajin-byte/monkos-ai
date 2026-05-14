---
type: order
date: 2026-05-14
from: iMac/민아
to: iMac/막내2
portfolio: PF_CITADEL
proposal_ref: PROPOSAL_20260514_민아_monk.kr_종합SEO검수+네이버확장.md
units: U-M1 + U-N3 + U-M3(Person 보류)
priority: 🟠 우선
expected_duration: 40분
status: 발행
---

# ORDER — monk.kr 본진 AEO 강화 패키지 (U-M1 + U-N3 + U-M3 Person 보류)

**[2026-05-14 14:18 KST] iMac/민아 → iMac/막내2**

---

## 0. 배경

오늘 오후 시타델 라인 진척:
- 12:12 KST: 막내2가 Phase 2.2 Unit-1 (monkos-portal Tier 1 prod 배포) 완료
- 12:31 KST: 막내3가 Unit-2 (EN noindex + GSC 색인 요청) 완료

이어서 monk.kr **본진** SEO/GEO/AEO 검수 → 결함 발견 → 12:17 종합 제안서 발행 (12개 단위 분해). 본 ORDER는 그중 가장 우선도 높고 monk.kr 단일 레포에서 한 번에 처리 가능한 **3개 단위 통합 패키지**.

본 작업은 monkos.ai(portal) 라인이 아닌 **monk.kr CF Pages 본진** 작업. `monkos_AI/portal/`이 아닌 **`MONK_kr/`** 디렉터리에서 진행.

---

## 1. 작업 범위 (3건 통합)

### U-M1. sitemap.xml 갱신 + 누락 페이지 등록 + 테스트 페이지 차단 🔴 (5분)

#### 1-1. `MONK_kr/sitemap.xml` 수정

현재 16 URL 중 `<lastmod>2026-04-24</lastmod>` 일괄 → **`2026-05-14`로 일괄 갱신**.

신규 URL 1건 추가:
```xml
<url>
  <loc>https://monk.kr/debate/</loc>
  <lastmod>2026-05-14</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
```

위치: 기존 16번째 `<url>` 블록(`/b2b/`) 다음. urlset 종료 태그(`</urlset>`) 직전.

#### 1-2. `MONK_kr/test_monkos.html` noindex 처리

대상 파일: `MONK_kr/test_monkos.html` (Feb 15 작성된 테스트 페이지, 루트 노출 + robots.txt 광범위 Allow → 색인 시도 가능)

처리 방식: 파일 `<head>` 영역에 다음 메타 1줄 삽입 (이미 있으면 스킵, 다른 robots 메타 있으면 교체):

```html
<meta name="robots" content="noindex, nofollow">
```

> ⚠️ `test_monkos.html` 자체 파일 내용은 건드리지 말 것. `<head>` 영역에 메타 1줄 삽입만.

---

### U-N3. `naver:ogtag` + 모바일 최적화 메타 추가 🟠 (10분)

대상 파일: `MONK_kr/index.html`

**삽입 위치**: 기존 Twitter Card 메타(line 28~31) 다음, Naver 사이트 인증 메타(line 33~34) 직전.

**삽입 내용**:

```html
<!-- Naver OG Tag (네이버 카페·블로그 공유 미리보기) -->
<meta property="naver:ogtag" content="MONK | 몽크사진관 · AI 크리에이티브 플랫폼">

<!-- 모바일 최적화 -->
<meta name="format-detection" content="telephone=yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#05070A">
```

---

### U-M3. AEO 강화 JSON-LD 추가 — FAQPage + BreadcrumbList (Person 보류) 🟠 (25분)

대상 파일: `MONK_kr/index.html`

**삽입 위치**: 기존 Organization JSON-LD (line 47~73) **직후**. tailwind.config script (line 74) **직전**.

**삽입 내용 1 — FAQPage** (llms.txt FAQ 6건 한국어 번역 마크업):

```html
<!-- FAQPage JSON-LD (AEO — AI 엔진 답변 인용 신호) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "MONKOS는 무엇입니까?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AI 기반 증명사진 플랫폼입니다. 셀카 한 장으로 여권사진, 이력서, 비자 사진을 만들 수 있으며 배경·조명·피부·의상 자동 보정을 제공합니다. ICAO 9303 국제 표준을 준수합니다."
      }
    },
    {
      "@type": "Question",
      "name": "다른 AI 증명사진 서비스와 무엇이 다른가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "20년간 실제 스튜디오 사진 데이터를 기반으로 만들어졌습니다. 알고리즘 추정이 아닌 전문 사진사 미학을 반영하며 90% 이상 정체성 보존을 달성합니다."
      }
    },
    {
      "@type": "Question",
      "name": "ICAO 규격을 준수하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "예. 생성되는 모든 사진은 여권·비자용 ICAO 9303 국제 표준을 충족합니다."
      }
    },
    {
      "@type": "Question",
      "name": "개인정보는 어떻게 처리되나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "이미지는 처리 후 서버에 장기 저장되지 않습니다. 마케팅이나 AI 학습에 사용자 사진을 사용하지 않습니다."
      }
    },
    {
      "@type": "Question",
      "name": "어떤 사진 규격을 지원하나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "여권 사진(35x45mm, ICAO 표준)과 표준 증명사진(30x40mm)을 지원합니다."
      }
    },
    {
      "@type": "Question",
      "name": "무료 옵션이 있나요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MONKOS CROP (crop.monkos.ai)은 무료 브라우저 기반 사진 크롭 도구입니다. AI 생성은 크레딧을 사용합니다."
      }
    }
  ]
}
</script>
```

**삽입 내용 2 — BreadcrumbList** (사이트 구조 명시):

```html
<!-- BreadcrumbList JSON-LD (사이트 구조 신호) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "MONK",
      "item": "https://monk.kr"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "몽크사진관",
      "item": "https://monk.kr/monk_studio/monk_studio.html"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "AI LAB",
      "item": "https://monk.kr/ai_lab/ai_lab.html"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "B2B",
      "item": "https://monk.kr/b2b/"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "Academy",
      "item": "https://monk.kr/Academy/academy.html"
    }
  ]
}
</script>
```

> ⚠️ **Person 스키마(작가님 실명)는 본 ORDER에서 제외**. 작가님 결정 사항으로 보류 중. 추후 별도 ORDER로 추가 예정.

---

## 2. 배포

### CF Pages 자동 배포

monk.kr은 **Cloudflare Pages**로 운영. `MONK_kr/` 디렉터리가 main 브랜치에 push되면 자동 배포.

**절차**:
1. 위 3건 수정 완료
2. `git add MONK_kr/sitemap.xml MONK_kr/test_monkos.html MONK_kr/index.html`
3. `git commit -m "[feat] monk.kr AEO 강화 — sitemap 갱신 + naver:ogtag + FAQ/Breadcrumb JSON-LD"`
4. `git push origin main`
5. CF Pages 빌드 자동 트리거 — 빌드 완료까지 1~2분 대기

> ⚠️ **헌법 5장 2조는 Cloud Run(deploy.sh)에 적용**. monk.kr CF Pages는 git push 방식이라 deploy.sh 미존재. 그대로 진행 가능.

---

## 3. 검증

배포 완료 후 (CF Pages 빌드 1~2분 대기) curl 5건 실측:

```bash
# 1. sitemap 갱신 확인
curl -s https://monk.kr/sitemap.xml | grep -E "lastmod|debate" | head -10
# 기대: 모든 lastmod가 2026-05-14, /debate/ 1건 포함

# 2. debate 페이지 응답
curl -sI https://monk.kr/debate/ | head -3
# 기대: HTTP/2 200

# 3. test_monkos noindex
curl -s https://monk.kr/test_monkos.html | grep -i "robots" | head -3
# 기대: <meta name="robots" content="noindex, nofollow">

# 4. naver:ogtag
curl -s https://monk.kr/ | grep -E "naver:ogtag|theme-color" | head -3
# 기대: 두 메타 모두 응답

# 5. JSON-LD FAQPage + Breadcrumb
curl -s https://monk.kr/ | grep -c '"@type": "FAQPage"'
curl -s https://monk.kr/ | grep -c '"@type": "BreadcrumbList"'
# 기대: 각 1 이상
```

추가 검증 (선택):
- Google Rich Results Test (`https://search.google.com/test/rich-results`)에 https://monk.kr/ 입력 → FAQPage + BreadcrumbList + Organization 3건 감지 확인 가능 (CDP로 가능)

---

## 4. ⚠️ 준수 조항

- **헌법 4조 1항** — API 키·토큰·비밀번호 생성/추측 금지, placeholder도 금지
- **헌법 4조 2항** — `rm -rf` · `git push --force` · `git reset --hard` · `git clean -f` 절대 금지
- **헌법 4조 3항** — 내부 호칭(쌍아·민아·막내 등) 또는 PF 코드네임을 본 ORDER 작업 산출물(코드·메타·JSON-LD)에 노출 금지
- **헌법 5장 2조** — Cloud Run(deploy.sh)에만 적용. CF Pages는 git push 자동 배포 — 본 ORDER 해당 없음
- **헌법 1조 3항 (정체성 보존)** — FAQ JSON-LD 텍스트는 위 명세 그대로 사용. 임의 재해석·추가 금지
- 커밋 메시지는 카테고리 `[feat]` 사용 (헌법 ch6)

---

## 5. 산출물 요구

### 코드
- `MONK_kr/sitemap.xml` — lastmod 일괄 갱신 + `/debate/` 1건 추가
- `MONK_kr/test_monkos.html` — `<head>`에 noindex 메타 1줄 삽입
- `MONK_kr/index.html` — naver:ogtag·모바일 메타 4건 + FAQPage·BreadcrumbList JSON-LD 2블록 삽입

### 커밋
- 단일 커밋 (`[feat] monk.kr AEO 강화 — sitemap 갱신 + naver:ogtag + FAQ/Breadcrumb JSON-LD`)
- 푸시까지 완료

### 보고
- **COMPLETION 파일**: `monkos-ops/ops/reports/2026-05/COMPLETION_20260514_막내2_monk.kr_AEO강화패키지.md`
- frontmatter 필수 (type/date/device/agent/portfolio/order/status)
- curl 5건 검증 결과 표 포함
- CF Pages 빌드 ID 또는 배포 시각 명시
- 발견된 이슈·예외사항 명시

### 보고 형식
- 마지막 출력은 `✅❌💡⏳📁🔀` 형식. 보고 후 잡담 금지 (헌법 3조 2항)
- 수발신 헤더 필수: `**[YYYY-MM-DD HH:MM KST]** iMac/막내2 → iMac/민아, 작가님`

---

## 6. 예상 소요 시간

| 작업 | 소요 |
|------|------|
| U-M1 sitemap+noindex | 5분 |
| U-N3 naver:ogtag·모바일 메타 | 10분 |
| U-M3 FAQ+Breadcrumb JSON-LD | 25분 |
| 커밋+푸시 | 2분 |
| CF Pages 빌드 대기 | 1~2분 |
| 검증 curl 5건 | 3분 |
| 보고 작성 | 5분 |
| **합계** | **~50분** |

---

## 7. 후속 단위 (본 ORDER 완료 후 별도 환급 예정)

- **U-M3 확장 — Person 스키마** (작가님 실명 노출 결정 후)
- **U-M2** `_headers` 보안 헤더 (CSP/X-Frame/Referrer/Permissions-Policy)
- **U-M4** `llms.txt`·`llms-full.txt` 갱신 (민아 직접 작업)
- **U-N1** 네이버 Search Advisor sitemap 제출 (작가님 또는 민아 위임)
- **U-N2** 네이버 플레이스 등록 (작가님 직접)
- **U-M5** monk.kr 하위 페이지 검수 (별건 RESEARCH)

---

*[2026-05-14 14:18 KST] iMac/민아 발행. 막내2 수신 대기.*
