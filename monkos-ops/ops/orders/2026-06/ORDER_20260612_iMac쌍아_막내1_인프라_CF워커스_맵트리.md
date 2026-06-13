---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "Cloudflare 인프라 전수 맵트리 — Pages Functions + Workers + 환경변수"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — Cloudflare 인프라 전수 맵트리

> **[2026-06-12 14:52 KST]** iMac/쌍아 → iMac/막내1
> 작가님 직접 지시(②경로). CF 인프라 정리를 위한 현황 파악.

---

## 배경

monk.kr(CF Pages)의 서비스 맵을 그려야 한다.

**작가님 판단 (06-12)**: monkos(Cloud Run)는 Secret Manager 경유로 Gemini를 직접 호출하며 CF를 경유하지 않는다. CF와 Cloud Run은 **완전 격리** 상태. CF Pages Functions의 Gemini 호출 함수들은 통합 이전 레거시로 판단된다. 프론트에서 실제 호출 여부를 확인하여 정리 대상 확정 필요.

쌍아 선행 조사 결과:

**CF Pages Functions (`functions/api/`)** — GEMINI_API_KEY를 직접 사용하는 엔드포인트 발견:

| 함수 | 모델 | 인증 |
|------|------|------|
| `generate.js` | gemini-3-pro-image-preview | `env.GEMINI_API_KEY` (API 키) |
| `refine.js` | gemini-3-pro-image-preview | `env.GEMINI_API_KEY` (API 키) |
| `translate.js` | gemini-2.5-flash | `env.GEMINI_API_KEY` (헤더) |
| `analyze.js` | gemini-2.5-flash | `env.GEMINI_API_KEY` (헤더) |
| `chat.js` | @cf/google/gemma-4-26b-a4b-it | Workers AI (키 불필요) |
| `debate.js` | @cf/google/gemma-3-12b-it + @cf/qwen/qwen2.5-coder-32b-instruct | Workers AI |

**외부 Workers** (별도 배포):
- `monk-chatbot.gdsajin.workers.dev` — 챗봇 (Workers AI 추정)
- `monk-gemini-proxy.gdsajin.workers.dev` — Gemini 프록시 (고정답변 상태, 레거시 의심)

## 조사 범위

### Task 1 — CF Pages Functions 전수

`functions/` 디렉토리 전체를 분석:

각 함수별:
1. **경로** (URL 매핑): 예) `functions/api/chat.js` → `monk.kr/api/chat`
2. **엔진**: Gemini API / Workers AI / 정적 로직
3. **인증**: `env.GEMINI_API_KEY` / Workers AI 바인딩 / 없음
4. **호출원**: monk.kr 어디에서 이 API를 호출하는지 (프론트 코드 grep)
5. **활성 여부**: 실제 사용 중인지, 레거시인지

`functions/specs/` 디렉토리도 포함 (specs 301 리다이렉트 등).

### Task 2 — 외부 Workers 파악

Cloudflare Workers 대시보드 접근이 안 되므로, 레포 내 코드 기반으로:

1. `monk-chatbot.gdsajin.workers.dev`
   - 소스 위치 grep (레포 내에 소스가 있는지)
   - 호출원 확인 (config.js CHATBOT 경로)
   - 엔진 추정

2. `monk-gemini-proxy.gdsajin.workers.dev`
   - 소스 위치 grep
   - 호출원 확인 (config.js GEMINI_PROXY, ai_lab.html)
   - 작가님 증언: "고정답변만 줌" → 죽어있을 가능성

3. 기타 Workers 참조 여부 (`*.workers.dev` 패턴 전수 grep)

### Task 3 — 환경변수 맵

CF Pages 대시보드 환경변수 목록 (SECRET_INVENTORY §E 기준) + 코드에서 `env.` 참조하는 변수 교차:

| 환경변수 | SECRET_INVENTORY 등록 | 코드 참조 | 실제 필요 |
|----------|---------------------|----------|----------|

### Task 4 — 맵 트리 작성

최종 산출물:

```
monk.kr (CF Pages)
├── 정적 페이지
│   ├── / (index.html)
│   ├── /ai_lab/ ...
│   └── /ai_lab/image_pro/ → API: image.monkos.ai (Cloud Run)
│
├── CF Pages Functions (functions/)
│   ├── /api/chat      → Workers AI (gemma-4) [활성/레거시?]
│   ├── /api/generate   → Gemini API (GEMINI_API_KEY) [활성/레거시?]
│   ├── /api/refine     → Gemini API [활성/레거시?]
│   ├── /api/translate  → Gemini API [활성/레거시?]
│   ├── /api/analyze    → Gemini API [활성/레거시?]
│   ├── /api/debate     → Workers AI (gemma-3 + qwen) [활성/레거시?]
│   └── /specs/*        → 301 리다이렉트 → monkos.ai/specs
│
├── 외부 라우팅
│   ├── 증명사진 → idphoto-kr.monkos.ai (Cloud Run)
│   ├── image_pro API → image.monkos.ai (Cloud Run)
│   └── 로그인 → monkos.ai/portal (Cloud Run)
│
└── 외부 Workers
    ├── monk-chatbot.workers.dev [활성/레거시?]
    └── monk-gemini-proxy.workers.dev [고정답변=레거시?]
```

각 노드에 활성/레거시/정리대상 판정.

## 산출물

| # | 파일 |
|---|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내1_인프라_CF맵트리.md` |

## ⚠️ 준수 조항

- **헌법 4조 1항**: 키 값 금지. 환경변수 이름·용도만.
- **헌법 4조 2항**: 읽기 전용. 코드·환경변수 변경 금지.
- **헌법 3조 1항**: 매 턴 `date` KST.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.

## 커밋 메시지

```
[research] Cloudflare 인프라 전수 맵트리 — Pages Functions + Workers + 환경변수
```
