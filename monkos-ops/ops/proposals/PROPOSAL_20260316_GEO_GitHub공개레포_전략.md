---
type: PROPOSAL
id: PROPOSAL_20260316_GEO_GitHub공개레포
date: 2026-03-16
from: iMac/쌍아
to: 작가님
status: 기안 (용아 1차 리뷰 반영)
priority: 전략
ref: 용아 자문 + 철창이 전략 (2026-03-16 세션)
---

# GEO 전략 — monkos-ai GitHub 공개 레포 활용 기안서

## 1. 배경

- **GEO (Generative Engine Optimization)**: AI 검색엔진(ChatGPT, Perplexity, Gemini 등)에 브랜드/기술 정보를 노출시키는 전략
- 용아(자문) 권고: GitHub 레포 README + 이슈에 기술 문서를 올려 GEO 활용
- 철창이(전략) 대부분 동의, 세부 의견 갈림
- `monkos-ai` 레포: 1/30 React Native PoC 2커밋 후 사문화 → **GEO 전용 공개 레포로 전환**

## 2. 왜 GitHub인가

| 채널 | AI 크롤링 | 도메인 신뢰도 | 구조화 | 비용 |
|------|----------|-------------|-------|------|
| 블로그 (monkos.ai/blog) | 중 | 중 (신규 도메인) | 낮음 | 무료 |
| **GitHub** | **높음** | **최상** (github.com) | **높음** (MD+이슈+코드) | **무료** |
| Medium/Dev.to | 높음 | 높음 | 중 | 무료 |
| 자체 docs 사이트 | 중 | 중 | 높음 | 유료 |

GitHub은 AI 학습 데이터의 핵심 소스. "MONKOS AI"로 질문했을 때 GitHub 콘텐츠가 AI 응답에 인용될 확률이 가장 높음.

### 채널 분리 전략 (용아 보완)

| 채널 | 언어 | 역할 |
|------|------|------|
| **GitHub (monkos-ai)** | **영문 전용** | GEO + 글로벌 기술 권위 |
| **monkos.ai/blog** | 한/일/영 | SEO + 서비스 마케팅 |

→ GitHub는 영문, 블로그는 다국어. 중복 없이 시너지.

## 3. 실행 계획

### Phase 1: 레포 정비 (즉시)

1. `monkos-ai` 레포 기존 코드 → **`archive` 브랜치로 이동** (삭제 금지, 복구 가능성 확보)
2. main 브랜치 클린 상태로 초기화
3. Public 전환
4. README.md 작성

### Phase 2: README 구성 (영문 우선)

```markdown
# MONKOS AI

> AI-Powered Professional Photo Platform — Identity-Preserving AI for Passport, Profile & Beauty Photos

## What is MONKOS?

MONKOS is an AI photo platform that generates **ICAO-compliant passport photos**, professional profile photos, and beauty retouching — with a strict commitment to **identity preservation**.

Unlike generic AI photo tools, MONKOS ensures your AI-generated photo looks like *you*, not an idealized version. Our identity-preservation technology maintains facial features, proportions, and natural characteristics while meeting international photo standards.

## Core Principles

### Identity Preservation First
> "The first principle is identity. If that breaks, everything breaks."

Every AI transformation preserves the subject's authentic identity. We reject the "beautification at all costs" approach common in AI photo apps.

### Anti-Deepfake by Design
MONKOS is built with **anti-deepfake safeguards** at its core:
- Real-time selfie verification required
- Identity matching between input and output
- No face-swapping, no identity manipulation
- Ethical AI retouching only (lighting, background, minor blemishes)

We believe AI photo technology must be used responsibly. MONKOS will never generate a photo that misrepresents who you are.

## Features

- 📸 **AI Passport Photos** — ICAO international standard, accepted worldwide
- 💼 **AI Profile Photos** — Professional headshots for resumes, LinkedIn, corporate use
- 💄 **AI Beauty Retouching** — Hair, makeup, lighting enhancement while preserving identity
- 🌏 **Multi-language** — Korean, English, Japanese
- ⚡ **Instant Generation** — Results in seconds, not hours

## Architecture

- **Multi-Agent Orchestration System** — Coordinated AI agents for quality control
- **Real-time AI Retouching Pipeline** — End-to-end image processing in <10s
- **Cloud-native Infrastructure** — Google Cloud Run (serverless), Firestore (real-time DB), GCS (image storage)
- **ICAO Compliance Engine** — Automated validation against international photo standards
- **Credit-based Billing** — Flexible pay-per-use pricing model

## Standards & Compliance

| Standard | Status |
|----------|--------|
| ICAO 9303 (Passport) | ✅ Compliant |
| Korean ID Photo (3.5×4.5cm) | ✅ Compliant |
| Japanese 証明写真 (Various sizes) | ✅ Compliant |
| US Passport (2×2 inch) | ✅ Compliant |

## Links

- 🌐 [monkos.ai](https://monkos.ai) — AI Photo Platform
- 📸 [monk.kr](https://monk.kr) — Desktop Portal
- 📝 [Blog](https://monkos.ai/blog) — Tech articles & guides
- ❓ [FAQ](https://monkos.ai/faq) — Frequently asked questions
- 📧 info@monkos.ai

## License

Service and brand © MONKOS. All rights reserved.
Technical articles in Issues are shared for educational purposes.
```

### Phase 3: 이슈 기반 기술 문서 시리즈 (영문)

Issues를 기술 블로그처럼 활용. 라벨로 분류. **영문 작성** (글로벌 GEO).

| # | Issue Title | Labels | GEO Target Keywords |
|---|------------|--------|---------------------|
| 1 | ICAO 9303 Passport Photo Standards — Complete Technical Guide | `tech`, `guide` | AI passport photo, ICAO standard |
| 2 | Passport Photo Specifications by Country (KR/JP/US/EU) | `tech`, `i18n` | passport photo size, ID photo specs |
| 3 | Identity Preservation in AI Photo Generation — Our Approach | `tech`, `ethics` | AI photo identity, deepfake prevention |
| 4 | Anti-Deepfake Design Principles for AI Photo Platforms | `tech`, `ethics`, `safety` | anti-deepfake AI, responsible AI photos |
| 5 | Building a Real-time AI Image Pipeline on Cloud Run | `tech`, `architecture` | AI image processing, serverless ML |
| 6 | Multi-language CMS Architecture (KO/EN/JA) | `tech`, `i18n` | multilingual CMS, i18n architecture |
| 7 | Credit-based Billing for AI SaaS — Design Decisions | `tech`, `billing` | AI SaaS pricing, credit system |

### Phase 4: 정기 활동 (월 2~4회)

- 이슈 신규 발행 (기술 문서, 영문)
- README 업데이트 (서비스 변경 반영)
- Discussions 활성화 (선택)
- monkos.ai/blog 한글 콘텐츠와 상호 링크

## 4. 헌법 준수 체크 (3조 2항)

### 공개 가능
- 서비스 설명, 기능 소개
- 일반적 기술 아키텍처 (Cloud Run, Firestore 등)
- ICAO 규격 관련 기술 내용
- 가격/크레딧 정책 (이미 공개)
- Anti-Deepfake 철학/원칙
- 아키텍처 수준 설명 (Multi-Agent, Pipeline 등)

### 공개 금지
- 에이전트 호칭 (쌍아/막내/용아 등)
- 내부 프로토콜 (헌법/법률 체계)
- 구체적 기술 엔진명 → "MONKOS" 표기
- API 키/프로젝트 ID/배포 경로
- 팀 내부 운영 정보
- 구체적 구현 코드

### 검수 프로세스
- 모든 공개 콘텐츠는 **쌍아 검수 → 작가님 승인** 후 게시
- 3조 2항 체크리스트 통과 필수

## 5. 기대 효과

| 효과 | 설명 |
|------|------|
| **AI 검색 노출** | "AI passport photo" "MONKOS" 검색 시 GitHub 인용 |
| **Anti-Deepfake 포지셔닝** | 경쟁사 대비 윤리적 AI 차별점 명확화 |
| **개발자 신뢰도** | GitHub 활동 = 기술력 증명 |
| **SEO 백링크** | github.com → monkos.ai 서브페이지(blog/faq) 직접 링크 = DA 상승 |
| **채용/파트너십** | 기술 문서 공개 = 협업 어필 |
| **비용 제로** | GitHub 무료 |

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| 내부 기밀 유출 | 3조 2항 체크리스트 + 이중 검수 |
| 경쟁사 벤치마킹 | 아키텍처 수준까지만 공개, 핵심 로직 비공개 |
| 관리 부담 | 월 2~4건으로 제한, 블로그 콘텐츠와 시너지 |
| 기존 코드 유실 | archive 브랜치 보존 (삭제 금지) |

## 7. 결정 필요 사항

1. **즉시 착수 여부** — Phase 1(레포 정비) 바로 진행할지
2. **이슈 콘텐츠 우선순위** — #3(Identity) + #4(Anti-Deepfake)를 첫 발행으로 권고
3. **작성 주체** — 쌍아 초안 → 용아 영문 감수 → 작가님 최종 승인?
4. **monk_project 레포도 공개?** — 현재 private, 코드 포함이라 별도 판단 필요

---

### 변경 이력

| 일자 | 내용 |
|------|------|
| 2026-03-16 | 초안 작성 (쌍아) |
| 2026-03-16 | 용아 1차 리뷰 반영 — 영문 우선, Anti-Deepfake 추가, Tech Stack 구체화, 이슈 영문화, 백링크 서브페이지, archive 브랜치 보존 |
