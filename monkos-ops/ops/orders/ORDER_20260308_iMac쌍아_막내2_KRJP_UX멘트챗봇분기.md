---
type: order
date: 2026-03-08
from: iMac/쌍아
to: 막내2
priority: P1
category: frontend / UX / chatbot
---

# 지시서: KR/JP UX 멘트 + CS 챗봇 분기 전략

**[2026-03-08 18:32 KST] iMac/쌍아 → 막내2**

## 배경

- JP는 현행 v0.79를 아카이브하고, **KR 코드를 클론하여 현지화**할 예정
- KR은 향후 직접결제 전환, JP는 크레딧 시스템 유지
- KR 코드를 JP에 내릴 때 UX 멘트, CS 챗봇에서 분기가 필요한 포인트를 전수 파악

## 조사 범위

### 1. KR 앱 내 멘트 → JP 현지화 시 분기 목록

**KR 코드의 사용자 대면 텍스트를 전부 추출**하여, JP 클론 시 변경이 필요한 항목 분류:

**KR 소스 (전부 읽기):**
```
monkos_AI/idphoto-kr/public/config.js (TX 객체 — 24+ 키)
monkos_AI/idphoto-kr/public/index.html
monkos_AI/idphoto-kr/public/charge.html
monkos_AI/idphoto-kr/public/thankyou.html
monkos_AI/idphoto-kr/public/modules/*.js
```

분류 기준:
| 카테고리 | 설명 | 예시 |
|----------|------|------|
| **단순 번역** | 한→일 번역만 하면 됨 | "촬영 준비" → "撮影準備" |
| **결제 분기** | 토스→Lemon Squeezy로 인한 흐름 차이 | 충전 UI, 결제 확인 멘트 |
| **크레딧 분기** | KR 직접결제 vs JP 크레딧 유지 | 잔액 표시, 차감 안내, 충전 유도 |
| **법적 분기** | 법률 근거 차이로 인한 문구 변경 | 환불 안내, 약관 동의 |
| **기능 분기** | KR에만 있는 기능 / JP에만 필요한 기능 | 카카오 로그인(KR만), QC(JP에 있음) |

### 2. CS 챗봇 분기 전략

현행 챗봇 구조 파악:
```
monkos_AI/portal/lib/chat-engine.js
monkos_AI/portal/lib/prompts.js
monkos_AI/portal/lib/rag.js
monkos_AI/portal/data/ (knowledge files)
```

**핵심 질문: KR 코드가 JP로 내려갈 때 챗봇은 어떻게 분기하나?**

조사 포인트:
- 현재 `idphoto-kr` 채널 매핑은 있으나 `idphoto-jp`는 **미매핑** — 현황 확인
- JP 사용자가 챗봇에 접근하면 어디로 라우팅되는지
- KR 클론 코드에서 챗봇 채널을 `idphoto-jp`로 바꾸면 되는 구조인지

**방안 비교 (작가님 관심사항):**

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 채널 분기 (서브도메인 기반) | idphoto-kr → KR 프롬프트, idphoto-jp → JP 프롬프트. 같은 봇 엔진 | 단일 관리, 구현 간단 | 프롬프트만 달라도 되는지 검증 필요 |
| B. IP 기반 분기 | 진입 IP로 KR/JP 판별 → 다른 프롬프트 | 포털 단일 진입점 대응 | IP 정확도, VPN, 해외 교포 |
| C. 별도 봇 | KR 봇 / JP 봇 완전 분리 | 완전 독립, 혼선 없음 | CS 이원화, 관리 부담, RAG 이중 유지 |

- 각 방안의 기술적 구현 난이도 평가
- **추천안** 제시 (근거 포함)
- 작가님 코멘트: "cs 상 좋은것은 아닐듯" → 별도 봇 분리의 CS 품질 우려 반영

### 3. RAG 지식 분기

KR 코드를 JP로 클론할 때 RAG 지식 베이스에서:
- KR/JP 공통으로 쓸 수 있는 지식 (서비스 설명, 기능 안내)
- JP로 분기해야 하는 지식 (가격, 환불, 법적 안내, 결제 방식)
- 분기 방식: 파일 분리 vs 프롬프트 내 조건 분기

### 4. 포털 진입 분기

현행 포털 (`portal/public/index.html`):
- 사용자가 KR/JP 서비스를 어떻게 선택하는지 현황 파악
- KR 클론 후 JP 사용자의 진입 동선 설계

## ⚠️ 준수 조항

- **헌법 제4조**: 내부 기술 스택 노출 금지 (보고서는 내부 문서이므로 구체 기술명 사용 가능)
- **헌법 제11조**: 챗봇 관련 — "되는 것만 응답" 원칙 JP에도 동일 적용

## 산출물

`docs/infrastructure/reports/REPORT_20260308_KRJP_UX_CHATBOT_DIVERGENCE.md`

## 보고 형식

```
✅ [막내2] KR/JP UX 멘트 + 챗봇 분기 보고서 완료
📁 파일 목록
💡 추천 방안 요약 (챗봇 분기)
```
