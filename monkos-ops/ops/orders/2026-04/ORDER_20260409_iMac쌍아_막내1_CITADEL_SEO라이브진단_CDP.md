---
type: order
date: 2026-04-09
from: iMac/쌍아
to: iMac/막내1
status: 대기
priority: P1
portfolio: PF_CITADEL
pf: PF_CITADEL
---

# 지시서 — monkos.ai SEO 라이브 진단 (CDP)

> **[2026-04-09 11:51 KST]** iMac/쌍아 → iMac/막내1

## 역할 선언
> **너는 "막내1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내1 → 작가님` 형식

---

## 미션

CDP(포트 9222)로 monkos.ai 주요 페이지를 순회하면서 SEO 상태를 라이브 진단한다.
**브라우저가 화면에서 움직이는 모습이 녹화 중이므로, 페이지 이동을 시각적으로 수행할 것.**

## CDP 포트

**9222** (고정). 아래 도구를 사용:

```bash
scripts/tools/cdp.sh navigate "URL" 0      # 페이지 이동
scripts/tools/cdp.sh eval "JS코드" 0        # JS 실행
scripts/tools/cdp.sh screenshot /tmp/X.png 0 # 스크린샷
scripts/tools/cdp.sh content 0              # 텍스트 추출
```

## 진단 대상 (순서대로 순회)

1. `https://monkos.ai` — 메인
2. `https://monkos.ai/ja/` — 일본어
3. `https://monkos.ai/en/` — 영어
4. `https://monkos.ai/specs` — 규격 26종
5. `https://monkos.ai/crop` — 크롭앱
6. `https://idphoto-kr.monkos.ai/app` — 한국 서비스
7. `https://idphoto-jp.monkos.ai/app` — 일본 서비스

## 각 페이지 진단 항목

페이지별로 CDP JS eval로 추출:

```javascript
// 메타 태그 추출
JSON.stringify({
  title: document.title,
  desc: document.querySelector('meta[name="description"]')?.content || 'MISSING',
  ogTitle: document.querySelector('meta[property="og:title"]')?.content || 'MISSING',
  ogDesc: document.querySelector('meta[property="og:description"]')?.content || 'MISSING',
  canonical: document.querySelector('link[rel="canonical"]')?.href || 'MISSING',
  hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => l.hreflang + ':' + l.href),
  h1: document.querySelector('h1')?.textContent || 'MISSING',
  schema: [...document.querySelectorAll('script[type="application/ld+json"]')].length + '개',
})
```

각 페이지: navigate → 3초 대기 → JS 추출 → 스크린샷 → 다음 페이지

## 산출물

```
monkos-ops/ops/reports/2026-04/REPORT_20260409_막내1_SEO라이브진단.md
```

진단 결과를 테이블로 정리:

| 페이지 | title | description | og:title | canonical | hreflang | h1 | schema | 판정 |
|--------|-------|-------------|----------|-----------|----------|-----|--------|------|

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | PF_CITADEL |
| 마무리 | 커밋+push |
| 산출물 | monkos-ops/ops/reports/2026-04/REPORT_20260409_막내1_SEO라이브진단.md |
| 문서 유형 | REPORT |
| 세션 로그 | 해당 없음 |

## ⚠️ 준수 조항
- CDP 브라우저 제어 규칙 (`.claude/rules/cdp-browser.md`) 준수
- 포트 9222 고정. 타 포트 접근 금지 (막내2=9223, 막내3=9224 사용 중)
- 헌법 4조 1항: 민감정보 생성 금지
