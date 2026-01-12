# 🎯 용아테스트(Vertex AI) 전환 가이드

**작성일**: 2026-01-08 18:30  
**목표**: 라마(Workers) → 용아테스트(Vertex AI) 교체

---

## 📊 현재 상황

### 라마 (Llama 3.2 3B - Workers)
- ✅ 빠른 응답 (10ms)
- ✅ 비용 효율 (거의 무료)
- ⚠️ 키워드 매칭 정확도 낮음
- ⚠️ 컨텍스트 이해 부족

### 용아테스트 (Vertex AI - Gemini)
- ✅ 전략적 응대
- ✅ 컨텍스트 이해 우수
- ✅ 15MB 학습 데이터
- ⚠️ 응답 시간 느림 (~2초)
- ✅ 바우처 (260만원, 3000년 사용 가능)

---

## 🚀 용아테스트 연결 방법

### Step 1: Vertex AI Console 접속
```
https://console.cloud.google.com/gen-app-builder/engines
→ young_a_test 앱 선택
→ API 탭
```

### Step 2: API 엔드포인트 확인
```
엔드포인트:
https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/apps/{APP_ID}:predict

또는 Agent Builder UI에서 "Integrate" → "API" 확인
```

### Step 3: index.html 수정
```javascript
// 현재 (Worker - 라마)
const API_URL = 'https://monk-gemini-proxy.gdsajin.workers.dev';

// 변경 (Vertex AI - 용아테스트)
const VERTEX_API_URL = 'https://[VERTEX_AI_ENDPOINT]';
const API_KEY = 'YOUR_API_KEY'; // Secret Manager 권장

// 테스트용 옵션: 버튼으로 전환 가능하게
function selectAI(type) {
  if (type === 'yonga') {
    currentAPI = VERTEX_API_URL;
  } else {
    currentAPI = API_URL; // 라마
  }
}
```

### Step 4: 재배포
```bash
cd /Users/jeong-kyushin/developer/monk_project\ /MONK_kr
npx wrangler pages deploy . --project-name=monk-kr
```

---

## 🧪 A/B 테스트 방법 (추천!)

### 옵션 1: URL 파라미터로 전환
```javascript
// index.html
const urlParams = new URLSearchParams(window.location.search);
const useYonga = urlParams.get('ai') === 'yonga';

const API_URL = useYonga 
  ? 'https://[VERTEX_AI_ENDPOINT]'  // 용아테스트
  : 'https://monk-gemini-proxy.gdsajin.workers.dev'; // 라마
```

**사용법:**
- 라마 테스트: https://monk.kr
- 용아 테스트: https://monk.kr?ai=yonga

### 옵션 2: 하위 도메인 분리
```
monk.kr → 라마 (기본)
yonga.monk.kr → 용아테스트
```

### 옵션 3: 챗봇 내 버튼
```html
<button onclick="switchAI('yonga')">용아 모드</button>
<button onclick="switchAI('llama')">라마 모드</button>
```

---

## 📊 비교 테스트 시나리오

### 시나리오 1: 기본 질문
```
질문: "증명사진 얼마예요?"

라마 기대 결과:
  - CS Q&A 직접 반환
  - 응답 시간: ~10ms
  - 정확도: ✅

용아 기대 결과:
  - 컨텍스트 기반 답변
  - 응답 시간: ~2초
  - 정확도: ✅✅
  - 추가 정보: "Standard/Deluxe 차이도 궁금하세요?"
```

### 시나리오 2: 복잡한 질문
```
질문: "증명사진 찍으려는데 예약도 해야하고 가격도 궁금하고..."

라마 기대 결과:
  - 키워드 매칭 실패 가능
  - 하나의 답변만

용아 기대 결과:
  - 의도 파악 (예약 + 가격)
  - 종합 답변
  - "예약은 안 해도 되고, 가격은 3만원입니다..."
```

### 시나리오 3: 모호한 질문
```
질문: "여기 어떻게 가나요?"

라마 기대 결과:
  - CS Q&A 매칭 실패
  - 일반 AI 답변 (부정확 가능)

용아 기대 결과:
  - "몽크사진관 하남 미사 위치를 말씀하시는 건가요?"
  - 맥락 기반 추론
```

---

## 💰 비용 비교

| 항목 | 라마 (Workers) | 용아 (Vertex AI) |
|------|----------------|------------------|
| 월 요청 10만건 | ~$0 | ~$3 (바우처) |
| 응답 속도 | 10ms | 2000ms |
| 정확도 | 70% | 95% |
| 컨텍스트 | 없음 | 15MB |
| 확장성 | 제한적 | 무제한 |

---

## 🎯 추천 전략

### Phase 1: A/B 테스트 (이번 주)
```
메인 monk.kr → 라마 (기본)
테스트 URL (?ai=yonga) → 용아테스트

→ 대표님이 직접 비교
```

### Phase 2: 점진적 전환 (다음 주)
```
일부 페이지만 용아로 전환
- index.html → 용아 (전략적)
- monk_studio.html → 라마 (실무 CS)
```

### Phase 3: 완전 전환 또는 2중 배치 (2주 후)
```
옵션 1: 용아 완전 전환
옵션 2: 2중 배치 유지 (메인 용아, 하위 라마)
```

---

## ⚠️ 주의사항

1. **API 키 보안**
   - 절대 코드에 하드코딩하지 말 것
   - Cloudflare Workers Secrets 사용
   - 또는 백엔드 프록시 경유

2. **응답 시간**
   - 용아는 2초 걸림 (로딩 표시 필수)
   - 라마는 10ms (즉시 응답)

3. **비용 모니터링**
   - Vertex AI Console → Billing
   - 바우처 잔액 확인

---

## 🛠️ 구현 예시 (A/B 테스트)

```javascript
// index.html 추가 코드
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const aiMode = urlParams.get('ai') || 'llama';
  
  const API_ENDPOINTS = {
    llama: 'https://monk-gemini-proxy.gdsajin.workers.dev',
    yonga: 'https://[VERTEX_AI_ENDPOINT]'
  };
  
  window.MONK_AI = {
    endpoint: API_ENDPOINTS[aiMode],
    mode: aiMode,
    label: aiMode === 'yonga' ? '용아 (Vertex AI)' : '라마 (Workers)'
  };
  
  console.log(`🤖 AI 모드: ${window.MONK_AI.label}`);
})();
```

---

**Version**: 1.0  
**Status**: 준비 완료  
**Next**: A/B 테스트 구현 또는 직접 전환

---

**대표님, A/B 테스트부터 해보시겠습니까? 아니면 바로 전환하시겠습니까?** 🤔
