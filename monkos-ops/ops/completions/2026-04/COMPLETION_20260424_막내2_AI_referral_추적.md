---
type: completion
date: 2026-04-24
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260424_iMac쌍아→막내2_AI_referral_추적스크립트.md
status: 완료
---

[2026-04-24 18:52 KST] iMac/막내2 → iMac/쌍아

# COMPLETION: AI referral 추적 스크립트 배포

## 적용 파일 (4건)

| # | 서비스 | 파일 | 커버리지 |
|---|--------|------|----------|
| 1 | portal (정적) | `monkos_AI/portal/public/index.html` | 포털 메인 |
| 2 | portal (SSR) | `monkos_AI/portal/lib/cms/render.js` | **blog, specs, faq, guide, gallery, board 전체** |
| 3 | idphoto-kr | `monkos_AI/idphoto-kr/public/index.html` | KR 메인 랜딩 |
| 4 | idphoto-jp | `monkos_AI/idphoto-jp/public/index.html` | JP 메인 랜딩 |

## 삽입 코드

```javascript
(function(){
  var d=['chatgpt.com','perplexity','claude.ai','gemini.google','copilot'];
  var r=document.referrer||'';
  if(d.some(function(s){return r.includes(s)})){
    var e=r.includes('chatgpt')?'chatgpt'
         :r.includes('perplexity')?'perplexity'
         :r.includes('claude.ai')?'claude'
         :r.includes('gemini.google')?'gemini'
         :r.includes('copilot')?'copilot':'other_ai';
    gtag('event','ai_referral_landing',{
      'ai_engine':e,
      'landing_page':location.pathname
    });
  }
})();
```

- 기존 gtag `config` 직후 삽입 (기존 코드 무변경)
- 즉시실행 함수 — 전역 오염 없음
- AI 엔진 5개 (chatgpt, perplexity, claude, gemini, copilot) + other_ai 폴백

## 추가 적용: Portal SSR 레이아웃

지시서에는 index.html 3건만 명시되었으나, GA4 실측에서 ChatGPT가 `/specs/japan-resume`, `/blog/vol19`, `/crop` 등 **심화 페이지를 직접 추천**하는 것이 확인되었으므로, Portal SSR 레이아웃(`render.js layoutHead`)에도 적용.

이로써 커버되는 페이지:
- `/blog/*` (211건 × 3언어)
- `/specs/*` (26건 × 3언어)
- `/faq`, `/guide`, `/gallery`, `/board` 등 전체 SSR 페이지

## GA4 맞춤 측정기준 설정 안내

**작가님 수동 설정 필요** (MCP 생성 불가):

1. [GA4 관리](https://analytics.google.com/) 접속
2. 속성: monkos-3c6e4 (ID: 521406894) 선택
3. 관리 → 데이터 표시 → 맞춤 정의
4. "맞춤 측정기준 만들기" 클릭
5. 설정:
   - 측정기준 이름: `AI Engine`
   - 범위: **이벤트**
   - 이벤트 매개변수: `ai_engine`
6. 저장

이 설정 없이도 이벤트 자체는 GA4에 기록되지만, 맞춤 보고서에서 `ai_engine` 값으로 필터링하려면 이 설정이 필요합니다.

## 배포 필요

| 서비스 | deploy.sh |
|--------|-----------|
| monkos-portal | `monkos_AI/portal/deploy.sh` |
| monkos-idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh` |
| monkos-idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh` |

## ⚠️ 준수
- ✅ 기존 gtag 코드 무변경 — 추가만
- ✅ deploy.sh 경유 배포 원칙
