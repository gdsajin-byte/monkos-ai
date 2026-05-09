---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/막내2
status: 대기
pf: PF_MONK_OS
track: B
parallel_with: ["A → 막내1", "C → 막내3", "D → 막내4"]
---

# [지시서] 업계 에이전트 OS 방향성 리서치 (PF_MONK_OS / Track B)

> **[2026-04-23 11:57 KST] iMac/쌍아 → iMac/막내2**
> 상위 PF: [PF_MONK_OS](../portfolios/PF_MONK_OS/README.md)
> 목적: Anthropic 외 **Google·OpenAI·오픈소스·커뮤니티**의 에이전트 OS/프레임워크 동향을 교차 파악하여 MONK OS "범용 이식성"의 기준선(baseline)을 확보
> **병렬 맥락**: 4기 동시 가동. A(Anthropic)는 내부 체계 전담 — 본 트랙은 *타사·생태계·표준*에 집중. Anthropic 문서는 비교 목적 외 깊이 파지 말 것. Kimi는 C 트랙이 전담하므로 간단 언급만.

---

## 배경

- 작가님 원문: "최근 구글도 이쪽으로 방향성을 잡는 분위기 같긴한데 여러 커뮤니티 앤스의 블로그 깃, 허깅등 총체적인 검토"
- MONK OS를 **어떤 런타임에도 이식 가능한 OS 레이어**로 만들기 위해, 타 생태계가 수렴하는 표준(MCP, A2A 등)과 다이버전스(독자 Agent SDK 각축)를 명확히 분별해야 함
- 본 트랙 핵심 질문: **"어떤 공개 표준에 우리가 얹혀야 최대 이식성을 얻는가?"**

---

## 조사 범위 (12개 축)

### 1. Google — Agent Development Kit (ADK) & Vertex AI Agent Builder
- ADK 공식 docs, 최신 버전, 지원 언어(Python/Java/TS)
- 에이전트 정의 스키마 (ADK의 "Agent" 개념)
- Gemini 2.5와의 바인딩 정도
- Vertex AI Agent Builder·Agentspace와의 관계
- 4.6~4.7 분기에 Google이 낸 공식 블로그·키노트 요지

### 2. Google — A2A (Agent-to-Agent) 프로토콜
- 공식 스펙 현황 (spec repo, 커밋 빈도, contributing 주체)
- MCP와의 관계 (보완? 경쟁?)
- 실제 A2A 구현 사례

### 3. OpenAI — AgentKit / Responses API / Swarm 후속
- AgentKit 공식 발표·docs
- Responses API 스키마 변동
- Swarm (실험적)의 최근 상태
- 메모리·스레드·툴 사용 구조

### 4. Model Context Protocol (MCP)
- 공식 스펙 버전·거버넌스 (Anthropic 단독? 멀티스테이크홀더로 이동?)
- 공식 서버 리스트 (Anthropic 호스팅 + 커뮤니티)
- 클라이언트 지원 현황 (Claude Code, Cursor, Cline, OpenAI, Google)
- 최근 변경점 (resource vs tool vs prompt 분리, elicitation 등)

### 5. 에이전트형 코드 도구
- **Cursor** — Rules 시스템(.cursor/rules), Memory 기능
- **Cline** — MCP 통합, 시스템 프롬프트 패턴
- **Aider** — Convention files, 영속 메모리
- **Continue** — config 스키마, 커스텀 컨텍스트 프로바이더
- **Windsurf / Cascade** — Agent 모드, Rules
- 각각의 "Rules/Memory/Skills" 대응물 표로 정리

### 6. 메이저 에이전트 프레임워크
- LangChain / LangGraph — v0.3+ 최근 변화, 에이전트 패턴
- LlamaIndex — Agent 모듈 최근 상태
- CrewAI — 멀티에이전트 오케스트레이션 동향
- Microsoft AutoGen v0.4 — actor 모델, 클라우드 제품화
- Pydantic AI — 최신 진입자, 구조적 특징

### 7. Hugging Face
- `smolagents` — 공식 위상, 최신 릴리즈
- HF agents course 커리큘럼 반영
- HF Hub 에이전트 관련 트렌딩 (지난 30일)
- Transformers Agents (legacy) 상태

### 8. 커뮤니티 시그널
- r/LocalLLaMA — 에이전트·OSS 모델 핫 스레드 (최근 30일)
- r/ClaudeAI — Skills/Rules/Memory 관련 주요 스레드
- HN — 에이전트 관련 300+ point 포스트 (최근 60일)
- 개발자 블로그: simonwillison.net, thesephist.com, swyx.io 등 최근 에이전트 글

### 9. GitHub 트렌딩 — 에이전트 리포
- 지난 30일 트렌딩 중 "agent/agentic/multi-agent" 키워드 상위
- 스타 10k+ 신규 프로젝트
- 라이선스·언어·핵심 아이디어 1줄 요약

### 10. 표준 수렴 지도
- 어떤 레이어가 표준화되고 있나 (프로토콜/스키마/메모리/툴)
- 어떤 레이어가 파편화되고 있나 (프롬프트/정책/워크플로우)
- MONK OS가 "표준 레이어 위 + 파편 레이어는 독자 설계" 전략을 취할 지점 판단

### 11. Kimi·중국 모델 간단 언급
- Kimi K2.6 이름 등장만 확인 (상세는 C 트랙). 업계 동향 관점에서 "중국 오픈소스 강세"라는 컨텍스트만 2~3문장
- DeepSeek V3.2, Qwen3, GLM-4.6 간단 위상

### 12. MONK OS 관점 결론 (막내2 판단)
> 조사 결과로 아래 3문항 답:
1. MONK OS가 채택해야 할 **핵심 표준 프로토콜**은? (MCP·A2A·OpenAI·기타)
2. 타사 도구(Cursor/Cline 등)의 Rules/Memory 구현 중 **차용할 만한 패턴** 3건
3. MONK OS가 경쟁적 차별화로 **유지해야 할 독자 영역** 3건

---

## 조사 방법

1. 공식 docs·GitHub 레포·릴리즈 노트 1차 소스 우선
2. 각 프레임워크는 최신 6개월 이내 변경 집중 (그 이전은 요약만)
3. 커뮤니티 스레드는 URL + 게시일 + 핵심 주장 3줄로 요약
4. 트렌드·수치(스타 수 등)는 조회 일자 명시
5. 중복 내용은 "(A 트랙 참조)" 또는 "(C 트랙 참조)"로 생략

---

## 산출물

**메인**: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_B_industry.md`

구조:
```
---
type: RESEARCH
track: B
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내2
---
# RESEARCH B — 업계 에이전트 OS 방향성
## 요약 (500자 내, 최상단)
## 1. Google ADK / Vertex
## 2. Google A2A
## 3. OpenAI AgentKit
## 4. MCP 현황
## 5. 에이전트 코드 도구 비교표
## 6. 프레임워크 6종
## 7. Hugging Face
## 8. 커뮤니티 시그널
## 9. GitHub 트렌딩
## 10. 표준 수렴 지도 (1장 요약)
## 11. 중국 간단 언급
## 12. MONK OS 관점 3문항 답
## 13. 출처 URL 전체
```

---

## 준수 조항

⚠️ 타임스탬프: 매 턴 `date` KST
⚠️ 추정 금지 — `⚠️ 공식 문서 미확인` 명시
⚠️ 모든 수치·인용 URL 필수
⚠️ 완료 시 PF README 히스토리 append
⚠️ 세션 로그: `monkos-ops/ops/sessions/2026-04-23_iMac_막내2.md`
⚠️ A/C/D 트랙 침범 금지 — 겹침 판단 애매하면 "(X 트랙 소관)" 표기 후 본 트랙 핵심으로 복귀
⚠️ 설치·배포 작업 없음

---

## 완료 보고 형식

```
✅ Track B 완료 — RESEARCH_B_industry.md
📁 [링크](monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_B_industry.md)
💡 핵심 발견 3줄 (특히 "표준 수렴 지도"의 결론)
⚠️ 공식 문서 미확인 항목 N건
⏳ 후속 제안 (있다면)
```
