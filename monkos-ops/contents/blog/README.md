---
type: guide
date: 2026-06-11
portfolio: PF_OPUS
subject: "블로그 콘텐츠 생산 파이프라인 — repo 초안 → CMS 드래프트 → 사람 게이트 → 발행"
---

# contents/blog/ — 블로그 초안 스테이징 (PF_OPUS 생산 라인)

> 이 폴더에 커밋된 마크다운 초안은 main 병합 시 자동으로 포털 CMS **드래프트**가 된다.
> **공개 발행은 어떤 자동화도 하지 않는다** — 최종 게이트는 작가님(에디터).

## 파이프라인 (하네스 §9 적용 — 2026-06-11 가동)

```
🤖 생성 (웹/민아 데일리 루틴 6번 또는 수동 세션)
    │  소재: 일일 브리핑 · 세션 작업내용 · PF 히스토리 · 철학적 대화
    │  → blog_{YYYYMMDD}_{주제}_KR.md 커밋 (PR 경유)
    ▼
🔧 자판기 (.github/workflows/blog-draft-publish.yml)
    │  main 병합 감지 → frontmatter 파싱 → POST /api/admin/blog
    │  published:false 고정 · slug 중복 시 건너뜀(멱등, 에디터 수정본 보존)
    ▼
👤 게이트 (작가님 — 에디터에서 검수·발행)
    │  발행 시 기존 시스템이 자동 체이닝:
    ▼
   OG 이미지 → 자동 번역(JA/EN) → 사이트맵 핑 → 색인 요청 → llms.txt
```

- 생성(클라우드 LLM) = 웹/민아 — 4060 로컬 생성 불가 판정(PF_FACTORY)의 대체.
- 자판기(배선) = GitHub Actions — 4060 Python 오케스트레이터 계획의 대체.
- 정본 구조: [PF_MONK_OS 하네스 §9](../../ops/portfolios/PF_MONK_OS/architecture/HARNESS_ARCHITECTURE.md), 적용 현황: [PF_OPUS](../../ops/portfolios/PF_OPUS/README.md)

## 초안 frontmatter 규격

```yaml
---
type: blog
date: YYYY-MM-DD
slug: english-slug-here      # 필수. 영문 소문자-하이픈
lang: KR | JA | EN           # 필수 (ko/ja/en도 허용)
title: "..."                 # 생략 시 본문 첫 H1 사용
author: 신작가 | MONKOS
status: draft
tags: [태그1, 태그2]
summary: "160자 이내 요약"
cms: skip                    # 이 파일을 CMS 업로드에서 제외할 때만
---
```

## 규칙

- **전략 정본**: [`../CONTENT_STRATEGY.md`](../CONTENT_STRATEGY.md) — 필러 4축(P1 서비스 SEO / P2 빌더 서사 / P3 기술 실측 / P4 로컬) × 톤 4종(T1 가이드 / T2 후기 / T3 신작가 에세이 / T4 기술 실측) × 주간 믹스 P1 4:P2 2:P3 1. **작성 전 필독**
- **문체 정본**: 톤별 선례 파일은 CONTENT_STRATEGY.md §2 표 참조
- **기밀 게이트** (헌법 4조 3항): 내부 호칭·기술 엔진명·계정명·키·미해결 보안 사항 금지. 외부 표기 MONKOS 통일
- **published:true 커밋 금지** — frontmatter에 published가 있어도 자판기는 무시하고 드래프트로만 올린다
- 소재 중복 금지 — 작성 전 이 폴더의 기존 파일 대조

## 가동 조건 (1회 설정)

| 항목 | 내용 | 상태 |
|------|------|------|
| GitHub Secret `PORTAL_AGENT_KEY` | 포털 Cloud Run 환경변수 `AGENT_API_KEYS` 값 중 1개 (AGENT_…) 등록. 콘솔 작업 = 작가님 | ⏳ |

키 미등록 상태에서는 자판기가 경고만 남기고 통과한다 (CI 적색 아님). 등록 후 `workflow_dispatch` 수동 실행으로 기존 초안 일괄 업로드 가능.
