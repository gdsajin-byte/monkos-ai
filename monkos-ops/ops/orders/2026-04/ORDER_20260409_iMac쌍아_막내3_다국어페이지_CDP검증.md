---
type: order
date: 2026-04-09
from: iMac/쌍아
to: iMac/막내3
status: 대기
priority: P1
pf: PF_CITADEL
---

# 지시서 — monkos.ai 다국어 페이지 CDP 검증

> **[2026-04-09 11:51 KST]** iMac/쌍아 → iMac/막내3

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내3 → 작가님` 형식

---

## 미션

CDP(포트 9224)로 monkos.ai의 한국어/일본어/영어 페이지를 순회하면서 다국어 UI 일관성과 가격 정합성을 검증한다.
**브라우저가 화면에서 움직이는 모습이 녹화 중이므로, 페이지 이동을 시각적으로 수행할 것.**

## CDP 포트

**9224** (고정).

```bash
scripts/tools/cdp.sh navigate "URL" 0
scripts/tools/cdp.sh eval "JS코드" 0
scripts/tools/cdp.sh screenshot /tmp/X.png 0
scripts/tools/cdp.sh content 0
```

## 검증 루트 (3개 언어 × 5개 페이지 = 15건)

### 한국어 (KR)
1. `https://monkos.ai` — 메인
2. `https://monkos.ai/specs` — 규격
3. `https://monkos.ai/crop` — 크롭앱
4. `https://idphoto-kr.monkos.ai/app` — 증명사진 서비스
5. `https://idphoto-kr.monkos.ai/charge` — 가격/충전

### 일본어 (JP)
6. `https://monkos.ai/ja/` — 메인
7. `https://monkos.ai/ja/specs` — 규격
8. `https://monkos.ai/crop` — 크롭 (공용)
9. `https://idphoto-jp.monkos.ai/app` — 증명사진 서비스
10. `https://idphoto-jp.monkos.ai/charge` — 가격/충전

### 영어 (EN)
11. `https://monkos.ai/en/` — 메인
12. `https://monkos.ai/en/specs` — 규격
13. `https://monkos.ai/crop` — 크롭 (공용)
14. `https://monkos.ai/en/pricing` — 가격 (있으면)
15. `https://monkos.ai/en/about` — 소개 (있으면)

없는 페이지는 404 여부 기록하고 다음으로.

## 각 페이지 검증 항목

```javascript
// CDP eval로 추출
JSON.stringify({
  url: location.href,
  lang: document.documentElement.lang || 'MISSING',
  title: document.title,
  h1: document.querySelector('h1')?.textContent?.trim() || 'MISSING',
  navLinks: [...document.querySelectorAll('nav a, header a')].length,
  pricing: document.body.innerText.match(/[₩¥$]\s?[\d,]+/g) || [],
  images: document.querySelectorAll('img').length,
  brokenImages: [...document.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth === 0).length,
  status: 'OK'
})
```

각 페이지: navigate → 3초 대기 → JS 추출 → 스크린샷 → 다음

## 검증 기준

- **언어 일관성**: KR 페이지에 일본어 혼입 없는지, JP에 한국어 혼입 없는지
- **가격 정합성**: KR=₩ 표기, JP=¥ 표기, 금액이 prompts.js PRICING 상수와 일치하는지
- **깨진 이미지**: brokenImages 0이어야 정상
- **네비게이션**: 주요 링크가 존재하는지

## 산출물

```
monkos-ops/ops/reports/2026-04/REPORT_20260409_막내3_다국어검증.md
```

15건 결과 테이블:

| # | URL | lang | title | h1 | 가격표기 | 깨진이미지 | 판정 |
|---|-----|------|-------|-----|---------|-----------|------|

+ 주요 발견 사항 요약

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | PF_CITADEL |
| 마무리 | 커밋+push |
| 산출물 | monkos-ops/ops/reports/2026-04/REPORT_20260409_막내3_다국어검증.md |
| 문서 유형 | REPORT |
| 세션 로그 | 해당 없음 |

## ⚠️ 준수 조항
- CDP 브라우저 제어 규칙 준수. 포트 **9224** 고정
- 헌법 4조 1항: 민감정보 생성 금지
- 헌법 4조 3항: 내부 기밀 노출 금지
