# 🧠 용아(Yong-a) 테스트 연결 가이드
## index.html에 Vertex AI 연결하기

---

## 📋 개요

**목표**: MONK.KR 메인 데스크(index.html) 챗봇을 Vertex AI yong_a_test로 연결  
**현재**: Cloudflare Workers (Llama 3.2 3B)  
**변경**: Vertex AI (yong_a_test - Gemini 2.0)

---

## 🎯 준비 사항

### ✅ 완료된 것
- [x] yong_a_test 앱 생성
- [x] data_pipe 데이터 스토어 연결
- [x] monk_session_data 버킷 데이터 동기화 (15.16MB)
- [x] CS Q&A 83개 업로드
- [x] 자동 인덱싱 활성화 (1일 1회)

### 🔧 필요한 것
- [ ] Vertex AI API 엔드포인트
- [ ] Google Cloud 인증 설정
- [ ] index.html 챗봇 코드 수정

---

## 📝 연결 절차

### 1단계: Vertex AI API 정보 확인

#### A. Console 접속
```
https://console.cloud.google.com/gen-app-builder/engines
```

#### B. yong_a_test 선택
- 왼쪽 메뉴: **AI Applications** → **앱**
- 목록에서 **yong_a_test** 클릭

#### C. API 정보 복사
1. 우측 상단 **"통합"** 또는 **"Integrate"** 버튼 클릭
2. **API** 탭 선택
3. 다음 정보 복사:
   ```
   - Project ID: gen-lang-client-0105707468
   - Location: global (또는 표시된 리전)
   - Engine ID: yong_a_test
   - Data Store ID: data-pipe_1767814881120
   ```

#### D. 샘플 코드 확인
- "REST" 또는 "Python" 탭에서 샘플 코드 확인
- API 엔드포인트 URL 복사

**예상 형태:**
```
https://discoveryengine.googleapis.com/v1alpha/projects/gen-lang-client-0105707468/locations/global/collections/default_collection/engines/yong_a_test/servingConfigs/default_search:search
```

---

### 2단계: Google Cloud 인증 설정

#### 옵션 A: API 키 사용 (간단, 프론트엔드용)

```bash
# API 키 생성
gcloud auth application-default print-access-token

# 또는 Console에서
# IAM 및 관리 → API 및 서비스 → 사용자 인증 정보
# → + 사용자 인증 정보 만들기 → API 키
```

**주의**: API 키는 공개 노출 위험이 있으므로 제한 설정 필요!

#### 옵션 B: 서비스 계정 (권장, 안전)

```bash
# 서비스 계정 생성
gcloud iam service-accounts create monk-chatbot \
  --display-name="MONK Chatbot Service Account" \
  --project=gen-lang-client-0105707468

# 권한 부여
gcloud projects add-iam-policy-binding gen-lang-client-0105707468 \
  --member="serviceAccount:monk-chatbot@gen-lang-client-0105707468.iam.gserviceaccount.com" \
  --role="roles/discoveryengine.viewer"

# 키 생성
gcloud iam service-accounts keys create ~/monk_vertex_key.json \
  --iam-account=monk-chatbot@gen-lang-client-0105707468.iam.gserviceaccount.com
```

#### 옵션 C: Cloudflare Workers 프록시 (최고 보안)

**장점:**
- API 키 노출 없음
- 속도 제어 가능
- 로깅 가능
- 기존 인프라 활용

```javascript
// Cloudflare Worker: vertex-ai-proxy
export default {
  async fetch(request, env) {
    const { query } = await request.json();
    
    // Vertex AI 호출
    const response = await fetch(VERTEX_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GOOGLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        // ... Vertex AI 파라미터
      })
    });
    
    return response;
  }
}
```

---

### 3단계: index.html 챗봇 코드 수정

#### 현재 코드 구조 확인

```bash
# index.html의 챗봇 코드 위치 확인
grep -n "monkos.ai" ~/developer/monk_project\ /MONK_kr/index.html
```

#### 수정할 부분

**기존 (Cloudflare Workers):**
```javascript
const API_URL = 'https://monk-chat-router.gdsajin.workers.dev';

async function sendMessage(userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userMessage,
      category: 'general'
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

**변경 (Vertex AI):**
```javascript
// 옵션 A: 직접 호출 (API 키 필요)
const VERTEX_API_URL = 'https://discoveryengine.googleapis.com/v1alpha/projects/gen-lang-client-0105707468/locations/global/collections/default_collection/engines/yong_a_test/servingConfigs/default_search:search';
const GOOGLE_API_KEY = 'YOUR_API_KEY'; // 보안 주의!

async function sendMessage(userMessage) {
  const response = await fetch(VERTEX_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GOOGLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: userMessage,
      pageSize: 5,
      queryExpansionSpec: { condition: 'AUTO' },
      spellCorrectionSpec: { mode: 'AUTO' }
    })
  });
  
  const data = await response.json();
  
  // 응답 파싱
  if (data.results && data.results.length > 0) {
    // 가장 관련성 높은 결과 추출
    const topResult = data.results[0];
    return topResult.document?.derivedStructData?.snippet || 
           topResult.document?.derivedStructData?.extractive_answers?.[0]?.content ||
           '죄송합니다. 답변을 찾지 못했습니다.';
  }
  
  return '죄송합니다. 답변을 찾지 못했습니다.';
}
```

**옵션 B: Cloudflare Workers 프록시 사용 (권장)**
```javascript
const API_URL = 'https://monk-vertex-proxy.gdsajin.workers.dev';

async function sendMessage(userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: userMessage
    })
  });
  
  const data = await response.json();
  return data.answer || '죄송합니다. 답변을 찾지 못했습니다.';
}
```

---

### 4단계: Cloudflare Workers 프록시 생성 (권장 방법)

#### A. 프록시 Worker 생성

```bash
cd ~/developer/monk_project\ /MONK_kr/cloudflare-workers
mkdir vertex-ai-proxy
cd vertex-ai-proxy
npx wrangler init vertex-ai-proxy --yes
```

#### B. 프록시 코드 작성

**파일**: `src/index.js`

```javascript
/**
 * Vertex AI 프록시 Worker
 * MONK.KR → Vertex AI yong_a_test 연결
 */

export default {
  async fetch(request, env) {
    // CORS 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const { query } = await request.json();
      
      if (!query) {
        return Response.json(
          { error: 'Query is required' }, 
          { status: 400, headers: corsHeaders }
        );
      }

      // Vertex AI API 호출
      const vertexUrl = `https://discoveryengine.googleapis.com/v1alpha/projects/${env.PROJECT_ID}/locations/${env.LOCATION}/collections/default_collection/engines/${env.ENGINE_ID}/servingConfigs/default_search:search`;

      const vertexResponse = await fetch(vertexUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GOOGLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          pageSize: 5,
          queryExpansionSpec: { condition: 'AUTO' },
          spellCorrectionSpec: { mode: 'AUTO' },
          contentSearchSpec: {
            snippetSpec: { 
              maxSnippetCount: 3,
              returnSnippet: true 
            },
            extractiveContentSpec: {
              maxExtractiveAnswerCount: 3,
              maxExtractiveSegmentCount: 1
            }
          }
        })
      });

      const vertexData = await vertexResponse.json();

      // 응답 파싱 및 포맷팅
      let answer = '';
      
      if (vertexData.results && vertexData.results.length > 0) {
        const topResult = vertexData.results[0];
        const doc = topResult.document;
        
        // Extractive Answer 우선
        if (doc?.derivedStructData?.extractive_answers?.length > 0) {
          answer = doc.derivedStructData.extractive_answers[0].content;
        }
        // Snippet 대체
        else if (doc?.derivedStructData?.snippet) {
          answer = doc.derivedStructData.snippet;
        }
        // Link 텍스트 대체
        else if (doc?.derivedStructData?.link) {
          answer = doc.derivedStructData.link;
        }
      }

      // 답변이 없으면 기본 메시지
      if (!answer) {
        answer = '죄송합니다. 관련 정보를 찾지 못했습니다. 다른 질문을 해주시거나, 카카오톡 채널로 문의해주세요.';
      }

      return Response.json(
        {
          answer: answer,
          source: 'vertex_ai',
          model: 'yong_a_test',
          timestamp: new Date().toISOString()
        },
        { headers: corsHeaders }
      );

    } catch (error) {
      console.error('Vertex AI Error:', error);
      
      return Response.json(
        { 
          error: 'Internal server error',
          message: error.message 
        },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
```

#### C. wrangler.toml 설정

```toml
name = "monk-vertex-proxy"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 환경 변수 (Cloudflare Dashboard에서 설정)
[vars]
PROJECT_ID = "gen-lang-client-0105707468"
LOCATION = "global"
ENGINE_ID = "yong_a_test"

# 시크릿 (민감 정보)
# wrangler secret put GOOGLE_API_KEY
# → API 키 입력
```

#### D. 배포

```bash
# API 키 등록
npx wrangler secret put GOOGLE_API_KEY
# → Google Cloud에서 생성한 API 키 입력

# 배포
npx wrangler deploy

# 배포 URL 확인
# https://monk-vertex-proxy.gdsajin.workers.dev
```

---

### 5단계: index.html 최종 수정

**파일**: `MONK_kr/index.html`

```javascript
// 챗봇 API URL (Vertex AI 프록시)
const CHATBOT_API = 'https://monk-vertex-proxy.gdsajin.workers.dev';

// 메시지 전송 함수
async function sendChatMessage(userMessage) {
  try {
    // 로딩 표시
    showTypingIndicator();

    const response = await fetch(CHATBOT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userMessage })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // 로딩 제거
    hideTypingIndicator();

    // AI 응답 표시
    displayBotMessage(data.answer);

    // 로깅 (선택사항)
    console.log('[Yong-a]', {
      query: userMessage,
      answer: data.answer,
      source: data.source,
      model: data.model
    });

  } catch (error) {
    console.error('Chat Error:', error);
    hideTypingIndicator();
    displayBotMessage(
      '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    );
  }
}
```

---

### 6단계: 테스트

#### A. 로컬 테스트
```bash
# Cloudflare Workers 로컬 실행
cd ~/developer/monk_project\ /MONK_kr/cloudflare-workers/vertex-ai-proxy
npx wrangler dev

# 새 터미널에서 테스트
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"query":"몽크사진관 영업시간은?"}'
```

#### B. 배포 후 테스트
```bash
# 프록시 테스트
curl -X POST https://monk-vertex-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"query":"증명사진 가격은 얼마인가요?"}'

# 예상 응답:
# {
#   "answer": "증명사진은 Standard 3만원, Premium 5만원, Deluxe 8만원입니다.",
#   "source": "vertex_ai",
#   "model": "yong_a_test",
#   "timestamp": "2026-01-08T10:00:00.000Z"
# }
```

#### C. 브라우저 테스트
1. `monk.kr` 접속
2. F12 개발자 도구 열기
3. 챗봇에 질문 입력:
   - "몽크사진관 위치는?"
   - "증명사진 가격은?"
   - "예약 방법은?"
4. Console에서 로그 확인
5. 응답 속도 및 정확도 확인

---

## 🔍 트러블슈팅

### 문제 1: 401 Unauthorized
```
원인: API 키가 잘못되었거나 만료됨
해결: wrangler secret put GOOGLE_API_KEY 재실행
```

### 문제 2: 403 Forbidden
```
원인: API 권한 부족
해결: 
  gcloud projects add-iam-policy-binding gen-lang-client-0105707468 \
    --member="user:your-email@gmail.com" \
    --role="roles/discoveryengine.viewer"
```

### 문제 3: 응답이 "답변을 찾지 못했습니다"
```
원인: 
  1. 데이터 인덱싱 미완료 (첫 동기화 후 5-10분 소요)
  2. 질문과 데이터 매칭 실패

해결:
  1. Vertex AI Console에서 인덱싱 상태 확인
  2. 질문을 더 명확하게 수정
  3. CS Q&A 데이터 보강
```

### 문제 4: CORS 에러
```
원인: Cloudflare Workers에서 CORS 헤더 누락
해결: corsHeaders에 'Access-Control-Allow-Origin': '*' 확인
```

---

## 📊 비교: Llama vs Yong-a

| 항목 | Llama (현재) | Yong-a (변경) |
|------|-------------|--------------|
| **모델** | Llama 3.2 3B | Gemini 2.0 |
| **위치** | Cloudflare Workers | Vertex AI |
| **속도** | 매우 빠름 (100ms) | 빠름 (300-500ms) |
| **정확도** | 보통 (CS DB 기반) | 높음 (15MB 컨텍스트) |
| **비용** | Workers 요금 | Vertex AI 쿼리 요금 |
| **할루시네이션** | 적음 (DB 우선) | 매우 적음 (학습 데이터) |
| **확장성** | 제한적 | 높음 |
| **학습 능력** | 없음 | 자동 개선 |

---

## 🎯 권장 배포 전략

### 단계적 롤아웃

```
Phase 1: 테스트 (1-2일)
  → localhost + 개발자 계정으로 테스트
  → 주요 질문 30개 검증

Phase 2: Soft Launch (3-5일)
  → monk.kr 메인 페이지만 Yong-a 적용
  → 몽크사진관 서브페이지는 Llama 유지
  → 실사용자 피드백 수집

Phase 3: Full Launch (1주 후)
  → 모든 페이지 Yong-a 전환
  → 또는 2중 AI 전략 유지:
    - 메인: Yong-a (전략적 응답)
    - 서브: Llama (빠른 CS 응답)
```

---

## 📝 체크리스트

### 배포 전 확인사항

- [ ] Vertex AI Console에서 yong_a_test 정상 작동 확인
- [ ] monk_session_data 버킷 데이터 최신 상태 (15.16MB)
- [ ] data_pipe 인덱싱 완료 (커넥터 상태: 활성)
- [ ] Google Cloud API 키 발급 및 권한 설정
- [ ] Cloudflare Workers 프록시 생성 및 배포
- [ ] API 키 시크릿 등록 (wrangler secret)
- [ ] index.html 챗봇 코드 수정
- [ ] 로컬 테스트 완료 (curl)
- [ ] 브라우저 테스트 완료 (F12 Console)
- [ ] 주요 질문 30개 검증
- [ ] 응답 속도 측정 (목표: 500ms 이내)
- [ ] 할루시네이션 체크
- [ ] 백업 및 롤백 계획 수립

---

## 🚀 다음 단계

1. **이 가이드 저장**
   ```bash
   ~/sync_to_yonga.sh
   ```

2. **Google Cloud Console 접속**
   - API 정보 확인
   - API 키 발급

3. **Cloudflare Workers 프록시 생성**
   - vertex-ai-proxy 폴더 생성
   - 코드 작성 및 배포

4. **index.html 수정**
   - API URL 변경
   - 테스트

5. **검증 및 배포**
   - 테스트 → Soft Launch → Full Launch

---

## 💡 추가 최적화 아이디어

### A. 하이브리드 전략
```javascript
// 질문 유형에 따라 AI 선택
async function routeToAI(userMessage) {
  // 간단한 CS 질문 → Llama (빠름)
  if (isSimpleCSQuestion(userMessage)) {
    return await callLlama(userMessage);
  }
  
  // 복잡한 전략 질문 → Yong-a (정확)
  return await callYonga(userMessage);
}
```

### B. 캐싱 전략
```javascript
// 자주 묻는 질문은 캐싱
const cache = new Map();

async function getCachedAnswer(query) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const answer = await callYonga(query);
  cache.set(query, answer);
  return answer;
}
```

### C. 폴백 체인
```javascript
// Yong-a → Llama → 기본 메시지
async function getAnswerWithFallback(query) {
  try {
    return await callYonga(query);
  } catch {
    try {
      return await callLlama(query);
    } catch {
      return DEFAULT_MESSAGE;
    }
  }
}
```

---

**작성**: 쌍아(雙牙) - Claude Sonnet  
**날짜**: 2026-01-08  
**프로젝트**: MONK.KR - 2중 AI 배치 전략
