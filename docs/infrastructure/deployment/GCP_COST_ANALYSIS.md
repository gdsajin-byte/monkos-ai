# GCP 비용 분석 리포트

**분석일**: 2026-02-16
**분석 범위**: 2025-12 ~ 2026-02-16
**분석자**: 쌍아 (Claude Code Opus)

---

## 1. 월별 API 호출 현황

### AI API 호출 수

| 월 | Imagen (AI Studio) | Vertex AI (QC+코칭) | 비고 |
|----|-------------------|---------------------|------|
| 2025-12 | 0 | 0 | 개발 전 |
| 2026-01 | 401 | 615 | 개발 시작 |
| 2026-02 (16일) | 379 | 938 | QC 강화 |
| **총계** | **780** | **1,553** | |

### Vertex AI 메서드별 분해 (2월)

| 메서드 | 호출 수 | 용도 |
|--------|---------|------|
| `BidiGenerateContent` | 249 | Gemini Live 실시간 코칭 |
| `GenerateContent` | 302 | Gemini Flash QC 판정 |
| `Predict` | 130 | 예측 API |
| `CountTokens` | 64 | 토큰 카운트 |
| UI 관련 | ~193 | 콘솔 접속 (무료) |

---

## 2. 비용 분석

### 2월 청구 내역

| API | 청구액 | 호출 수 | 건당 단가 |
|-----|--------|---------|-----------|
| Generative Language (Imagen) | ₩53,524 | 376건 | **₩142/건** (~$0.098) |
| Vertex AI (QC+코칭) | ₩4,484 | 938건 | ₩4.8/건 |
| **합계** | **₩58,008** | | |

### 비용 비중

- **Imagen: 92%** (₩53,524 / ₩58,008)
- Vertex AI: 8%

---

## 3. 플랫폼별 가격 비교

### Imagen 3

| 해상도 | Google AI Studio | Vertex AI | 차이 |
|--------|------------------|-----------|------|
| 1K/2K | **무료** (1,500장/일) | $0.134/장 | AI Studio 압도적 유리 |
| 4K | **무료** (1,500장/일) | $0.24/장 | |

### Imagen 4

| 품질 | Google AI Studio | Vertex AI | 차이 |
|------|------------------|-----------|------|
| Fast | $0.02/장 | $0.02/장 | 동일 |
| Standard | $0.04/장 | $0.04/장 | 동일 |
| Ultra | $0.06/장 | $0.06/장 | 동일 |

### 결론

- **Imagen 3**: AI Studio 무료 vs Vertex AI 유료 → AI Studio 선택 정답
- **Imagen 4**: 동일 가격
- 현재 AI Studio API Key 사용 중 (기술 + 비용 양쪽 이점)

---

## 4. Cloud Run 서비스 현황

| 서비스 | 요청 수 (12월~2월) |
|--------|-------------------|
| monk-image-engine | 2,956 |
| monkos-portal | 2,092 |
| monkos-idphoto-kr | 847 |
| monkos-idphoto-jp | 472 |

---

## 5. 크레딧 이코노미

### 가격 구조

| 액션 | 크레딧 | 가격 | 원가 | 마진 |
|------|--------|------|------|------|
| 생성 | -1c | $1 | $0.10 | 90% |
| 다운로드 | -10c | $10 | $0 | 100% |
| **세트** | -11c | **$11** | $0.10 | **99%** |

### 크레딧 시스템 역할

1. **과금**: 남용 방지 + 수익
2. **이벤트**: 신규 가입 쿠폰, 프로모션
3. **CS 보상**: 환불 대신 크레딧 → 현금 유출 차단 + 재방문 유도

### 설계 의도

- $1 생성비: 무한 루핑 방지 (무료 시 재생성 남용 리스크)
- $10 다운로드: 진짜 수익원
- 크레딧 잔고 = 락인 효과

---

## 6. 3월 목표 시뮬레이션

### 1만명 목표 시

| 전환율 | 생성 | 다운로드 | 매출 | 원가 | 순이익 |
|--------|------|----------|------|------|--------|
| 100% | 10,000 | 10,000 | $110,000 | $1,000 | $109,000 |
| 50% | 10,000 | 5,000 | $60,000 | $1,000 | $59,000 |
| 30% | 10,000 | 3,000 | $40,000 | $1,000 | $39,000 |
| 10% | 10,000 | 1,000 | $20,000 | $1,000 | $19,000 |

### 손익분기

- 테스트 비용 ₩58,008 회수: 유료 다운로드 6건 ($66)
- 일평균 필요 유저: 333명 (30일 기준)

---

## 7. AI 모델 스택 정리

### 현재 구성

| 용도 | 플랫폼 | 모델 | 청구 항목 |
|------|--------|------|-----------|
| 이미지 생성 | AI Studio API Key | `gemini-3-pro-image-preview` | Gemini API |
| 실시간 코칭 | Vertex AI ADC | `gemini-2.0-flash-live-preview` | Vertex AI |
| QC 판정 | Vertex AI ADC | `gemini-3-flash-preview` | Vertex AI |

### API 인스턴스

```javascript
// Vertex AI (ADC 인증)
const ai = new GoogleGenAI({ vertexai: true });

// AI Studio (API Key 인증)
const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
```

---

## 8. 참고 자료

- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Imagen 3.0 CloudPrice](https://cloudprice.net/models/vertex_ai/imagen-3.0-generate-002)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-02-16 | 최초 작성 (2025-12 ~ 2026-02 분석) |
