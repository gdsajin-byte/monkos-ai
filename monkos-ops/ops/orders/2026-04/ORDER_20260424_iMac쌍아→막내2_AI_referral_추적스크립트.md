---
type: order
date: 2026-04-24
from: iMac/쌍아
to: iMac/막내2
status: 대기
priority: 1
---

[2026-04-24 18:49 KST] iMac/쌍아 → iMac/막내2

# ORDER: AI referral 추적 스크립트 배포

## 배경

현재 AI 엔진(ChatGPT, Perplexity 등)에서의 유입을 GA4에서 식별할 수 없음.
정합성 검토에서 기술적 가능성 확인 완료 — document.referrer origin 레벨로 엔진 구분 가능.

## 임무

### 1. 추적 스크립트 작성

기존 gtag 구조에 추가. 3개 서비스 공통 적용.

```javascript
function extractEngine(ref) {
  if (ref.includes('chatgpt.com')) return 'chatgpt';
  if (ref.includes('perplexity')) return 'perplexity';
  if (ref.includes('claude.ai')) return 'claude';
  if (ref.includes('gemini.google')) return 'gemini';
  if (ref.includes('copilot')) return 'copilot';
  return 'other_ai';
}

(function() {
  var defined = ['chatgpt.com','perplexity','claude.ai','gemini.google','copilot'];
  var ref = document.referrer || '';
  if (defined.some(function(d) { return ref.includes(d); })) {
    gtag('event', 'ai_referral_landing', {
      'ai_engine': extractEngine(ref),
      'landing_page': window.location.pathname
    });
  }
})();
```

### 2. 적용 대상

| 서비스 | 파일 | gtag 위치 |
|--------|------|-----------|
| portal | `monkos_AI/portal/public/index.html` | `<head>` 내 gtag 블록 직후 |
| idphoto-kr | `monkos_AI/idphoto-kr/public/index.html` | 동일 |
| idphoto-jp | `monkos_AI/idphoto-jp/public/index.html` | 동일 |

### 3. 확인

- 배포 후 Chrome DevTools에서 `document.referrer` 시뮬레이션하여 gtag event 발화 확인
- GA4 DebugView에서 `ai_referral_landing` 이벤트 노출 확인 (가능한 범위)

### 4. GA4 맞춤 측정기준 안내

GA4 관리자 UI에서 수동 설정 필요 (MCP로 생성 불가):
- 경로: GA4 → 관리 → 데이터 표시 → 맞춤 정의 → 맞춤 측정기준 만들기
- 이름: `ai_engine`, 범위: 이벤트, 이벤트 매개변수: `ai_engine`
- 이 설정은 작가님에게 별도 안내

## ⚠️ 준수
- 기존 gtag 코드 훼손 금지 — 추가만
- 배포는 deploy.sh 경유

## 산출물
- `COMPLETION_20260424_막내2_AI_referral_추적.md`
