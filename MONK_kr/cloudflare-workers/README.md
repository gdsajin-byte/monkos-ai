# MONK AI Assistant - Cloudflare Workers AI (Gemma 7B)

Workers AI 내장 Gemma 7B를 사용하는 경량 안내봇입니다. 빠르고 예쁜 말투로 MONK 서비스를 안내합니다.

## 🚀 배포 방법

### 1. Workers AI 활성화 (자동)

Workers AI는 Cloudflare Paid Plan에 포함되어 있습니다. 별도 설정 불필요!

---

### 2. Cloudflare Workers 배포

```bash
# 1. cloudflare-workers 폴더로 이동
cd /Users/jeong-kyushin/developer/monk_project/MONK_kr/cloudflare-workers

# 2. wrangler 로그인 (이미 로그인되어 있으면 생략)
npx wrangler login

# 3. 배포
npx wrangler deploy

# 4. 배포된 URL 확인 (예: https://monk-gemini-proxy.your-subdomain.workers.dev)
```

---

### 3. MONK AI LAB 연결

배포된 Workers URL을 `ai_lab.html`에 설정:

```javascript
// 예: https://monk-gemini-proxy.your-subdomain.workers.dev
const GEMINI_API_URL = 'https://monk-gemini-proxy.your-subdomain.workers.dev';
```

---

## 🧪 테스트

```bash
# cURL로 테스트
curl -X POST https://monk-gemini-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"prompt":"안녕하세요, MONK에 대해 알려주세요"}'

# 응답 예시:
# {"response":"안녕하세요! 😊 MONK.KR은 증명사진부터 AI 이미지 생성까지...","model":"Gemma 7B (Workers AI)","timestamp":"2026-01-07T..."}
```

---

## 📊 사용 모델

- **Gemma 7B Instruct** (`@cf/google/gemma-7b-it`)
  - Google의 경량 오픈소스 모델
  - 예쁜 말투와 친절한 응답
  - 초저지연 (50-100ms)
  - 안내봇/FAQ용으로 최적화

---

## 💰 비용

- **Cloudflare Workers**: $5/월 (Paid Plan에 포함)
- **Workers AI**: 무료 (Paid Plan에 포함, 별도 과금 없음)
- **절감액**: Vertex AI 대비 ~90% 절감

---

## 🔧 트러블슈팅

### "AI에서 응답을 생성하지 못했습니다" 오류
→ Workers AI 바인딩 확인: `wrangler.toml`에 `[ai] binding = "AI"` 추가

### CORS 오류
→ Workers 코드에 이미 CORS 헤더 포함됨 (문제 없어야 함)

### 느린 응답 속도
→ Workers AI는 엣지에서 실행되므로 50-100ms 이내 응답 (Gemini 대비 10배 빠름)

---

## 📝 로그 확인

```bash
# 실시간 로그 보기
npx wrangler tail
```
