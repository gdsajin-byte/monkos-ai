---
type: order
date: 2026-04-24
from: iMac/쌍아
to: iMac/막내1
status: 대기
priority: 1
---

[2026-04-24 18:21 KST] iMac/쌍아 → iMac/막내1

# ORDER: AEO 제안서 트랙 1·2 정합성 검토 (진단만, 수정 없음)

## 배경

민아가 AEO(Answer Engine Optimization) 전략 제안서를 발행.
제안서: `monkos-ops/ops/proposals/PROPOSAL_20260424_민아_AEO_ChatGPT추천유입_최적화_전략.md`
작가님 지시: 막내에게 정합성 검토 시키고 제대로 기획해.

## 임무 — 진단·검토만. 코드 수정 절대 금지.

### 트랙 1 검토: AEO 구조화 데이터 강화

1. **현재 상태 실측** (반드시 실제 서비스 접속하여 확인)
   - `curl -s https://monkos.ai/specs/japan-resume` → 현재 JSON-LD 스키마가 뭐가 들어있는지
   - `curl -s https://monkos.ai/app` → Service 스키마 유무
   - `curl -s https://monkos.ai/crop` → 동일
   - `/specs/` 하위 전체 페이지 목록 확인 (몇 개 있는지, 어떤 국가/규격인지)
   - 각 페이지의 기존 JSON-LD, og:description 현재 내용

2. **제안서 대비 갭 분석**
   - 제안서가 말하는 "FAQPage + HowTo 스키마" 추가가 기존 구조와 충돌 없는지
   - 이미 들어있는 스키마가 있다면 중복/충돌 여부

3. **실현 가능성 판단**
   - specs 페이지가 정적 HTML인지 서버 렌더링인지
   - JSON-LD 추가가 각 페이지 개별 작업인지, 템플릿 1곳 수정으로 전체 반영 가능한지

### 트랙 2 검토: ChatGPT 경쟁 실측 벤치마킹

1. **제안서 20개 쿼리 중 5개를 실제로 실측**
   - ChatGPT에 직접 물어보기 (CDP 또는 WebSearch 활용)
   - "AI 여권사진 서비스 추천", "Best AI passport photo service 2026", "일본 이력서 사진 AI", "ICAO 규격 온라인 증명사진", "Photoroom vs monkos" 
   - monkos.ai가 답변에 등장하는지, 경쟁사 대비 위치, 어떤 맥락으로 추천되는지

2. **Perplexity에서 동일 5개 쿼리 실측**
   - PerplexityBot이 이미 크롤하고 있으니 결과에 나올 가능성

3. **결과 정리**: 쿼리별 등장 여부 + 맥락 + 경쟁사 목록

## ⚠️ 준수

- **코드 수정 절대 금지** — 진단·실측만
- **추측 금지** — 실제 curl, 실제 서비스 접속으로 확인한 것만 보고
- **"~일 것으로 추정" 표현 사용 시 반드시 미확인 명시**

## 산출물

- `COMPLETION_20260424_막내1_AEO_트랙12_정합성검토.md`
