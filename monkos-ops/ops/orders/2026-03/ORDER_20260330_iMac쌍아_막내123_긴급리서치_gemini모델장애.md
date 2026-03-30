---
type: order
from: iMac/쌍아
to: 막내1, 막내2, 막내3
date: 2026-03-30
priority: 🔴 긴급 리서치
subject: gemini-3-pro-image-preview 403 에러 커뮤니티 반응 + 대안 모델 실태 조사
---

# 🔴 긴급 리서치: Gemini 이미지 모델 403 장애 정보 수집

**[2026-03-30 20:25 KST] iMac/쌍아 → 막내1, 막내2, 막내3**

---

## 배경

프로덕션(idphoto-kr)에서 `gemini-3-pro-image-preview` 모델 403 에러 발생.
우리는 **Google AI Studio API Key** 방식(`generativelanguage.googleapis.com`)으로 호출 중.
대체 모델 교체 전에 정확한 상황 파악이 필요.

---

## 막내1 — 커뮤니티 반응 수집

웹 검색으로 아래 채널에서 최근 1주일 내 `gemini-3-pro-image-preview` 403/503 에러 관련 글을 수집:

1. **Google AI 공식 포럼** (discuss.ai.google.dev) — 403, 503, deprecated 관련 스레드
2. **GitHub Issues** — google-gemini, generative-ai 관련 레포
3. **Reddit** (r/GoogleGeminiAI, r/MachineLearning) — 장애 보고
4. **Stack Overflow** — gemini-3-pro-image-preview 에러 관련
5. **X(Twitter)** — 개발자 반응

각 글의 **날짜, 증상, Google 공식 답변 유무, 해결 방법**을 정리.
특히 **Google AI Studio API Key 방식에서의 403**인지, Vertex AI에서의 403인지 구분할 것.

---

## 막내2 — 대체 모델 실전 호환성 조사

`gemini-3.1-flash-image-preview`로 교체할 경우의 실전 이슈 조사:

1. Google AI Studio에서 `gemini-3.1-flash-image-preview` **API Key 방식으로 호출 가능한지** (generativelanguage.googleapis.com 경로)
2. `responseModalities: ["TEXT", "IMAGE"]` 필수 여부 + 빠뜨렸을 때 증상
3. I2I(Image-to-Image) 호출 시 기존 `inlineData` + text prompt 패턴이 동일하게 동작하는지
4. 커뮤니티에서 3.1-flash-image로 마이그레이션한 사례가 있는지
5. 가격 차이 (기존 Nano Banana Pro vs 3.1 Flash Image)
6. `gemini-2.5-flash-image` (GA 모델)도 동일하게 조사 — 안정성 비교

---

## 막내3 — Google 공식 발표 + Changelog 전수 확인

1. **Google AI 공식 블로그** (developers.googleblog.com) — Gemini 이미지 모델 관련 최근 1개월 발표
2. **Gemini API Changelog** (ai.google.dev/gemini-api/docs/changelog) — 3월 변경사항 전수 확인
3. **Gemini API Deprecations** (ai.google.dev/gemini-api/docs/deprecations) — `gemini-3-pro-image-preview` 폐기 일정이 실제로 있는지 정확히 확인
4. **Vertex AI Release Notes** — 이미지 모델 관련 변경
5. Nano Banana Pro / Nano Banana 2 / Nano Banana 1 각각의 현재 **공식 상태**(Active/Preview/Deprecated)

---

## 완료 기준

- [ ] 막내1: 커뮤니티 반응 최소 5건 수집 + 정리
- [ ] 막내2: 3.1-flash-image AI Studio 호환성 확인 + 마이그레이션 주의사항
- [ ] 막내3: 공식 발표 기반 모델별 정확한 상태 테이블

## ⚠️ 준수 조항

- 코드 수정 하지 말 것 — 리서치만 수행
- 보고서 형식: 완료 보고 `✅❌💡⏳📁🔀`
