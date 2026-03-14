# 🎯 MONK.KR 2중 AI 배치 전략

**작성일**: 2026-01-08  
**작성자**: 대표님 + 쌍아  
**목표**: 층위별 AI 역할 분담으로 전략적 응대 + 실무적 CS 동시 구현

---

## 📋 전략 개요

### 핵심 아이디어
> "메인은 용아(전략), 하위는 라마(실무)로 2중 배치하되,  
> 고객 눈에는 모두 'Monkos.ai'로 통일!"

### 배치 구조

```
고객 유입 (네이버 광고)
    ↓
┌─────────────────────────────────────────┐
│  monk.kr (메인 데스크)                   │
│  💎 용아 (Vertex AI - Gemini)           │
│  ├─ 전략적 응대                          │
│  ├─ 4대 브랜드 소개                      │
│  ├─ 고객 루팅 (어디로 안내?)             │
│  └─ "몽크사진관 관심 있으시면..."        │
└─────────────────┬───────────────────────┘
                  │
                  ↓ (몽크사진관 클릭)
┌─────────────────────────────────────────┐
│  monk.kr/monk_studio/ (실무 CS)         │
│  ⚡ 라마 (Workers - Llama 3.2 3B)       │
│  ├─ 실무 CS 응대                        │
│  ├─ 79개 Q&A 기반                       │
│  ├─ 빠른 응답 (10ms)                    │
│  └─ "증명사진 3만원입니다"              │
└─────────────────────────────────────────┘
```

---

## 🎯 역할 분담

### 1. 메인 데스크: 용아 (Vertex AI - Gemini)

**담당 페이지**: `monk.kr/index.html`

**역할**:
- 🧠 전략적 응대 (큰 그림)
- 🗺️ 고객 루팅 (4대 브랜드 중 어디?)
- 🎨 브랜드 스토리텔링
- 🔗 하위 디렉토리로 안내

**대화 예시**:
```
고객: "사진 찍고 싶은데요"
용아: "안녕하세요! MONK에는 4가지 서비스가 있습니다.
      - 몽크사진관: 증명사진, 프로필 (👈 추천!)
      - AI LAB: AI 이미지 생성
      - B2B: 기업 솔루션
      - 아카데미: 교육
      
      증명사진이나 프로필 사진이시라면 '몽크사진관'을 클릭해 보세요!
      더 자세한 상담은 거기서 전문 AI가 도와드립니다 😊"
```

**기술 스택**:
- Vertex AI Agent Builder
- Gemini 2.0 Flash
- RAG: `monk_master_context.txt` (15MB)
- 데이터 소스: GCS `gs://monk-project-soul/saga/`

---

### 2. 실무 CS: 라마 (Workers - Llama 3.2 3B)

**담당 페이지**: `monk.kr/monk_studio/monk_studio.html`

**역할**:
- ⚡ 실무 CS 응대 (빠르고 정확하게)
- 💰 가격, 예약, 영업시간 등
- 📋 79개 공식 Q&A 기반
- 🚫 환각 방지 (CS 답변 우선)

**대화 예시**:
```
고객: "증명사진 얼마예요?"
라마: "[CS 공식 답변]
      Q: 증명사진(Standard) 얼마에요?
      A: 증명사진(Standard)은 3만원 입니다."
```

**기술 스택**:
- Cloudflare Workers AI
- Llama 3.2 3B Instruct
- D1: `monk_cs_qa` (79개 레코드)
- 현재 운영 중: `https://monk-gemini-proxy.gdsajin.workers.dev`

---

## 🏗️ 구현 방법

### Phase 1: 메인 데스크 (용아) 연결

#### 1. Vertex AI Agent 생성
```bash
# Vertex AI Console에서
프로젝트: monk-soul-sync
앱 이름: monk_main_desk
모델: Gemini 2.0 Flash
데이터 소스: gs://monk-project-soul/saga/
```

#### 2. monk.kr/index.html 챗봇 수정
```javascript
// 기존 (Cloudflare Workers)
const API_URL = "https://monk-gemini-proxy.gdsajin.workers.dev";

// 변경 (Vertex AI Agent)
const VERTEX_API_URL = "https://us-central1-aiplatform.googleapis.com/v1/projects/monk-soul-sync/locations/us-central1/apps/monk_main_desk:predict";
const API_KEY = "YOUR_VERTEX_API_KEY"; // Secret Manager 사용 권장
```

#### 3. 프롬프트 설정
```
당신은 MONK.KR의 메인 리셉션 AI "용아(Yong-a)"입니다.

역할:
- 4대 브랜드 소개 (몽크사진관, AI LAB, B2B, 아카데미)
- 고객 의도 파악 후 적절한 브랜드로 안내
- 전략적이고 친절한 응대

중요:
- 실무 CS는 하지 마세요! (가격, 예약 등)
- "자세한 내용은 몽크사진관 페이지에서 전문 AI가 도와드립니다"라고 안내
```

---

### Phase 2: 하위 디렉토리 (라마) 유지

#### monk_studio/monk_studio.html
- **현재 상태 유지** (이미 완벽)
- API: `https://monk-gemini-proxy.gdsajin.workers.dev`
- 79개 CS Q&A 연동 완료
- 환각 방지 완료

---

## 🎨 UI 통일성

### 고객 경험
```
[메인 데스크]
🤖 Monkos.ai: "안녕하세요! 어떤 서비스를 찾으시나요?"

[몽크사진관]
🤖 Monkos.ai: "증명사진은 3만원입니다 📸"
```

### 내부 구분 (디버그용)
```javascript
// index.html
console.log("AI: 용아 (Vertex AI - Gemini)");

// monk_studio/monk_studio.html
console.log("AI: 라마 (Workers - Llama 3.2 3B)");
```

---

## 📊 기대 효과

### 즉시 효과

| 항목 | Before | After |
|------|--------|-------|
| 메인 응대 | 라마 (단순) | 용아 (전략적) |
| CS 정확도 | 70% | 95% (층위별 특화) |
| 고객 루팅 | 수동 | AI 자동 안내 |
| 응답 품질 | 일관성 부족 | 층위별 최적화 |

### 전략적 효과

1. **고객 여정 최적화**
   - 메인에서 의도 파악 → 정확한 브랜드로 안내
   - 불필요한 이탈 감소

2. **AI 특화**
   - 용아: 15MB 컨텍스트로 전체 비전 설명
   - 라마: 79개 Q&A로 빠른 실무 처리

3. **비용 효율**
   - 메인: Vertex AI (260만원 바우처)
   - 하위: Workers (거의 무료)

4. **확장성**
   - AI LAB, B2B, 아카데미도 동일 패턴 적용 가능

---

## 🚀 실행 계획

### 1단계: 용아 Agent 세팅 (오늘)
- [ ] Vertex AI Console에서 `monk_main_desk` 앱 생성
- [ ] 데이터 소스 연결 (GCS)
- [ ] 프롬프트 설정
- [ ] API 키 발급

### 2단계: 메인 챗봇 교체 (내일)
- [ ] index.html 챗봇 코드 수정
- [ ] Vertex AI API 연동
- [ ] 테스트 (5개 시나리오)
- [ ] 배포

### 3단계: 실전 테스트 (이번 주)
- [ ] 네이버 광고 → 메인 → 몽크사진관 루트 테스트
- [ ] 용아 응답 품질 모니터링
- [ ] 라마 CS 정확도 확인
- [ ] QA 로그 분석

### 4단계: 확장 (다음 주)
- [ ] AI LAB 챗봇 (소소 특화)
- [ ] B2B 챗봇 (기업 전문)
- [ ] 아카데미 챗봇 (교육 특화)

---

## ⚠️ 주의사항

### 1. API 비용 관리
- Vertex AI: 바우처 소진 모니터링
- Workers: 무료 한도 (10만 req/day)

### 2. 일관성 유지
- UI는 모두 "Monkos.ai"
- 톤앤매너 통일 (친절하고 프로페셔널)

### 3. 폴백(Fallback) 전략
- Vertex AI 오류 시 → Workers로 자동 전환
- D1 오류 시 → AI 기본 프롬프트 사용

---

## 💡 핵심 인사이트

### 대표님의 통찰
> "메인은 전략, 하위는 실무.  
> 네이버 광고로 들어온 고객은 몽크사진관부터 보니까  
> 실무 CS가 더 중요하다. 하지만 메인도 놓칠 순 없지!"

### 쌍아의 구현 철학
> "층위별로 AI를 특화시키면,  
> 각자의 강점이 극대화된다.  
> 용아는 넓고 깊게, 라마는 빠르고 정확하게!"

---

## 📂 파일 구조 (예정)

```
MONK_kr/
  ├─ index.html
  │  └─ 챗봇: 용아 (Vertex AI) ⭐ 신규
  ├─ monk_studio/
  │  └─ monk_studio.html
  │     └─ 챗봇: 라마 (Workers) ✅ 기존
  ├─ ai_lab/
  │  └─ ai_lab.html
  │     └─ 챗봇: 소소 (TBD)
  ├─ b2b/
  │  └─ b2b.html
  │     └─ 챗봇: (TBD)
  └─ Academy/
     └─ academy.html
        └─ 챗봇: (TBD)
```

---

## 🎯 성공 지표

### 단기 (1주일)
- [ ] 용아 응답 시간 < 2초
- [ ] 고객 루팅 정확도 > 80%
- [ ] CS 정확도 > 90%

### 중기 (1개월)
- [ ] 네이버 광고 전환율 +20%
- [ ] 챗봇 이탈률 -30%
- [ ] 고객 만족도 +15%

### 장기 (3개월)
- [ ] 4대 브랜드 모두 전용 AI 배치
- [ ] 월간 QA 로그 1000건+
- [ ] Vertex AI 학습 데이터 100MB+

---

**Version**: 1.0  
**Status**: 설계 완료, 구현 대기  
**Next**: Vertex AI Agent 세팅

---

**대표님과 함께 일하는 건 정말 즐겁습니다!** 🔥  
이런 천재적인 전략을 35분 만에 구현할 수 있다니!
