---
type: RESEARCH
track: C
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내3
sources_cutoff: 2026-04-23 11:54 KST
---

# RESEARCH C — Kimi K2.6 총체 보고서

> **[2026-04-23 11:54 KST] iMac/막내3 → iMac/쌍아**
> 상위 PF: [PF_MONK_OS](../README.md) / 지시서: [ORDER_…_C_kimi_k26.md](../../../orders/ORDER_20260423_PF_MONK_OS_C_kimi_k26.md)
> 주의: 지시서 산출물 구조 `author: iMac/막내4`는 오타. PF README line 60·102 기준 Track C = 막내3 확정, 본 보고서 author는 막내3.

---

## 요약 (500자 내)

Moonshot AI가 2026-04-20에 공개한 Kimi K2.6은 1T 총/32B 활성 MoE(384 전문가·MLA 어텐션)에 256K 컨텍스트·네이티브 비전을 탑재한 Modified MIT 오픈가중치 모델이다. Claude Opus 4.7 출시 4일 후 나와 SWE-Bench Pro(58.6)·HLE-Full w/tools(54.0)·DeepSearchQA(92.5%)에서 프런티어 프로프라이어터리를 제치고, SWE-Bench Verified(80.2 vs Opus 4.7의 87.6)에선 뒤처진다. 공식 API $0.60/$2.50(입/출력 1M 토큰, Opus 4.7 대비 약 1/10), OpenAI·Anthropic 호환, MCP는 Kimi Code CLI 레벨 공식 지원. 로컬 실행은 Q4에도 500GB+ VRAM 필요해 4060(8GB) 완전 불가. 중국어·코딩 최상위지만 한국어 품질 공식 검증 없음, CCP 민감 이슈 정치 편향 기보고. MONK OS 관점: **Claude 종속 회피용 보조 런타임으로 가치 충분**, OpenAI/Anthropic 호환 + MCP 덕에 법률·Skills 이식 최소 번역으로 가능, 한국어·안전성은 Phase 1에서 실측 필요.

---

## 1. 공식 릴리즈 정보

| 항목 | 값 | 출처 |
|------|-----|------|
| 릴리즈 일자 | **2026-04-20** | [MarkTechPost](https://www.marktechpost.com/2026/04/20/moonshot-ai-releases-kimi-k2-6-with-long-horizon-coding-agent-swarm-scaling-to-300-sub-agents-and-4000-coordinated-steps/), [SiliconANGLE](https://siliconangle.com/2026/04/20/moonshot-ai-releases-kimi-k2-6-model-1t-parameters-attention-optimizations/), [Cloudflare Workers AI 체인지로그 2026-04-20](https://developers.cloudflare.com/changelog/post/2026-04-20-kimi-k2-6-workers-ai/) |
| 버전 표기 | Kimi K2.6 (공식 단일). Code preview 단계가 K2.6 Code Preview로 별도 공개된 전사 있음 | [kimi-k2.org Code Preview 블로그](https://kimi-k2.org/blog/23-kimi-k2-6-code-preview) |
| 공식 모델 카드 | `moonshotai/Kimi-K2.6` on Hugging Face | [HF 모델카드](https://huggingface.co/moonshotai/Kimi-K2.6) |
| 공식 기술 블로그 | https://www.kimi.com/blog/kimi-k2-6 | [kimi.com 블로그](https://www.kimi.com/blog/kimi-k2-6) |
| 공식 포럼 안내 | forum.moonshot.ai "Meet Kimi K2.6" | [Moonshot Forum](https://forum.moonshot.ai/t/meet-kimi-k2-6-advancing-open-source-coding/369) |
| 이전 버전 차이 | K2.5(100 sub-agents / 1,500 steps) → K2.6(300 / 4,000). GDPval Elo 1309 → 1520 | [kimi.com 블로그](https://www.kimi.com/blog/kimi-k2-6), [llm-stats](https://llm-stats.com/models/kimi-k2.6) |
| 컨텍스트 | Claude Opus 4.7 출시 4일 뒤. 가격 약 1/10 | [Remio 분석](https://www.remio.ai/post/kimi-k2-6-landed-four-days-after-claude-opus-4-7-the-pricing-is-10-lower-and-it-s-open-weight) |

---

## 2. 모델 스펙

| 항목 | 값 | 비고 |
|------|-----|------|
| 총 파라미터 | **1T** | MoE |
| 활성 파라미터 | **32B** | 토큰당 |
| 레이어 | 61 (dense 1 포함) | — |
| 전문가 수 | **384** | — |
| 토큰당 선택 전문가 | 8 (routed) + 1 shared | — |
| 어텐션 hidden dim | 7168 | — |
| MoE hidden dim (per expert) | 2048 | — |
| 어텐션 헤드 | 64 | — |
| 어텐션 메커니즘 | **MLA** (Multi-head Latent Attention, DeepSeek 계열) | — |
| 활성화 함수 | SwiGLU | — |
| 컨텍스트 윈도우 | **256K** (HF 카드) / 262,144 토큰 (블로그 측정 조건) | 동일 수치 |
| 토크나이저 vocab | 160K | — |
| 네이티브 멀티모달 | **비전 O** (공식 API는 비디오 입력 실험적 제공), 오디오 미기재 | — |
| 인퍼런스 비용 (공식 Moonshot API) | **$0.60 / $2.50 per 1M (in/out)** | [OpenRouter](https://openrouter.ai/moonshotai/kimi-k2.6), [kimik2ai.com](https://kimik2ai.com/pricing/) |
| 대체 제공자 | Parasail $0.60/$2.80, Fireworks $0.95/$4.00, OpenRouter $0.80/$3.50 | 동일 출처 |
| 네이티브 INT4 quantization | 공식 제공 (K2.5와 동일 방식) | HF 카드 |

출처: [HF 모델카드](https://huggingface.co/moonshotai/Kimi-K2.6), [kimi.com 블로그](https://www.kimi.com/blog/kimi-k2-6), [llm-stats 스펙](https://llm-stats.com/models/kimi-k2.6)

---

## 3. 벤치마크

모든 수치는 공식 블로그·HF 카드·Artificial Analysis 리포트 기준 (2026-04-23 접근). 비교 모드: K2.6 thinking, Opus 4.6 max effort, GPT-5.4 xhigh, Gemini 3.1 Pro thinking high.

### 3-1. 에이전트 (MONK OS 관점 최우선)

| 벤치 | K2.6 | GPT-5.4 | Opus 4.6 | Gemini 3.1 Pro | K2.5 | 1위 |
|------|------|---------|----------|---------------|------|-----|
| **HLE-Full w/ tools** | **54.0** | 52.1 | 53.0 | 51.4 | — | ✅ K2.6 |
| BrowseComp | 83.2 | — | — | — | — | — |
| BrowseComp (agent swarm) | **86.3** | — | — | — | — | ✅ K2.6 |
| **DeepSearchQA f1** | **92.5** | — | — | — | — | ✅ K2.6 |
| DeepSearchQA acc | 83.0 | — | — | — | — | — |
| WideSearch (item-f1) | 80.8 | — | — | — | — | — |
| Toolathlon | 50.0 | — | — | — | — | — |
| **MCPMark** | **55.9** | — | — | — | — | (MCP 전용 평가) |
| Claw Eval (pass^3) | 62.3 | — | — | — | — | — |
| APEX-Agents | 27.9 | — | — | — | — | — |
| OSWorld-Verified | 73.1 | — | — | — | — | — |
| GDPval-AA Elo | **1520** | — | — | — | 1309 | ✅ K2.6 |

### 3-2. 코딩

| 벤치 | K2.6 | GPT-5.4 | Opus 4.6 | Opus 4.7 | Gemini 3.1 Pro | K2.5 |
|------|------|---------|----------|----------|---------------|------|
| Terminal-Bench 2.0 (Terminus-2) | 66.7 | 65.4 | 65.4 | — | **68.5** ✅ | — |
| **SWE-Bench Pro** | **58.6** ✅ | 57.7 | 53.4 | — | 54.2 | 50.7 |
| SWE-Bench Multilingual | 76.7 | — | — | — | — | — |
| **SWE-Bench Verified** | 80.2 | — | — | **87.6** ✅ | — | — |
| SciCode | 52.2 | — | — | — | — | — |
| OJBench (python) | 60.6 | — | — | — | — | — |
| LiveCodeBench (v6) | 89.6 | — | — | — | — | — |

출처: [the-decoder](https://the-decoder.com/open-weight-kimi-k2-6-takes-on-gpt-5-4-and-claude-opus-4-6-with-agent-swarms/), [blockchain.news](https://blockchain.news/ainews/kimi-k2-6-breakthrough-open-source-model-tops-gpt-5-4-claude-opus-4-6-gemini-3-1-pro-on-elite-benchmarks-2026-analysis), [buildfastwithai](https://www.buildfastwithai.com/blogs/kimi-k2-6-vs-gpt-claude-benchmarks), [kimi.com 블로그](https://www.kimi.com/blog/kimi-k2-6)

### 3-3. 추론·지식

| 벤치 | K2.6 |
|------|------|
| HLE-Full (no tools) | 34.7 |
| AIME 2026 | 96.4 |
| HMMT 2026 (Feb) | 92.7 |
| IMO-AnswerBench | 86.0 |
| GPQA-Diamond | 90.5 |

### 3-4. 비전

| 벤치 | K2.6 | K2.6 w/ python |
|------|------|----------------|
| MMMU-Pro | 79.4 | 80.1 |
| CharXiv (RQ) | 80.4 | 86.7 |
| MathVision | 87.4 | 93.2 |
| BabyVision | 39.8 | 68.5 |
| V* w/ python | — | 96.9 |

### 3-5. 롱컨텍스트
⚠️ **확인 필요** — 공식 블로그·HF 카드에 NIAH/RULER 측정치 미공개. 262K 실측 리포트는 Phase 1에서 별도 검증 권고.

---

## 4. 오픈소스 전략

| 항목 | 내용 |
|------|------|
| 라이선스 | **Modified MIT License** (코드·가중치 공통) |
| HF 저장소 | `moonshotai/Kimi-K2.6` — last month 54,456 다운로드 (2026-04-23 기준) |
| 상업 이용 | Modified MIT 범위 내 허용. 수정 조항 세부는 [HF LICENSE 원문](https://huggingface.co/moonshotai/Kimi-K2.6/blob/main/LICENSE) 확인 필요 |
| 공식 GitHub | `moonshotai/kimi-cli` (Kimi Code CLI) + 모델 deployment 가이드 HF에 동봉 |
| 파생 모델 (HF) | `ubergarm/Kimi-K2.6-GGUF`, `unsloth/Kimi-K2.6` (동적 2bit·Q4·Q8 전부), `inferencerlabs/Kimi-K2.6-MLX-3.6bit`, `mlx-community/Kimi-K2.6-MoE-Smart-Quant` — 총 15종 양자화 |
| 추론 스택 공식 권장 | **vLLM / SGLang / KTransformers** (transformers ≥4.57.1,<5.0.0) |
| 서드파티 클라이언트 | llama.cpp / LM Studio / Jan / Ollama 모두 GGUF 가동 확인 |

출처: [HF 모델카드](https://huggingface.co/moonshotai/Kimi-K2.6), [Unsloth 문서](https://unsloth.ai/docs/models/kimi-k2.6)

---

## 5. 에이전트·도구사용 역량 (MONK OS 관점 핵심)

### 5-1. 도구/함수 호출 포맷
- **OpenAI/Anthropic 호환 API** 공식 제공 (Moonshot 공식 plaform).
- Chat Completion 예제에 `messages[].role ∈ {system,user,assistant}` + `response.choices[0].message.reasoning` (Thinking 모드 output 분리) 구조 — 기존 OpenAI SDK 코드에서 `base_url`만 바꾸면 거의 그대로 작동.
- 공식 Tool: `search`, `code-interpreter`, `web-browsing`, `video input`(실험).

### 5-2. Thinking / Instant 모드
| 모드 | 파라미터 |
|------|---------|
| Thinking (기본) | `temperature=1.0, top_p=1.0` |
| Instant | `extra_body={"thinking": {"type": "disabled"}}` |
| **preserve_thinking 모드** | 멀티턴에서 reasoning 컨텐츠 전부 유지 (에이전트 코딩 시나리오 강화) |
| 툴 호출 제약 | `thinking.type=enabled`일 때 `tool_choice` = `auto` or `none`만 허용 |

### 5-3. MCP 지원
- **공식 지원: Kimi Code CLI 레벨** — `moonshotai.github.io/kimi-cli/en/customization/mcp.html`에 MCP 서버 연결 가이드 공개.
- 자체 벤치 **MCPMark 55.9점**으로 MCP 워크플로를 첫 번째 공식 평가 축으로 포함 — Anthropic 외 주요 모델 중 MCP를 벤치에 정식 반영한 최초 사례로 해석 가능.
- 모델 카드 본문에는 MCP 명시 없음. 즉 **프로토콜은 CLI/런타임 층에서 처리**, 모델 자체는 일반 function calling tool 스키마를 받음.

### 5-4. 멀티스텝 에이전트 아키텍처
- 단일 세션에서 **최대 300 서브에이전트 × 4,000 coordinated steps** (K2.5는 100/1,500).
- Moonshot 측 사례: 5일 자율 인프라 에이전트 구동, 커널 리라이트, Zig 추론 엔진(LM Studio 대비 +20% TPS) 완성 등 커뮤니티 보고.

### 5-5. Skills / Rules / Memory 유사 개념
- 모델 자체에는 없음 (Claude 4.7 표준 레이어 미도입).
- **Kimi Code CLI가 customization 섹션에 MCP·툴·시스템 프롬프트 주입을 제공** — `.claude/skills` 구조를 CLI 설정으로 매핑 가능.
- ⚠️ 확인 필요: `Routines`(cron) 대응은 CLI에 없음 (CronCreate 류). 외부 스케줄러 필요.

출처: [Kimi API 문서](https://platform.kimi.ai/docs/guide/kimi-k2-6-quickstart), [Kimi CLI MCP 문서](https://moonshotai.github.io/kimi-cli/en/customization/mcp.html), [HF 모델카드](https://huggingface.co/moonshotai/Kimi-K2.6)

---

## 6. 중국 모델 지형 내 위상

### 6-1. 순위 (2026-04 BenchLM / Artificial Analysis 기준)
| 모델 | 점수 | 비고 |
|------|------|------|
| GLM-5 (Reasoning) | 85 | BenchLM 중국 리더보드 1위 (프로프라이어터리) |
| GLM-5.1 (Reasoning) | 84 | 2위. long-horizon 최대 8시간 자율 작업 보고 |
| Qwen3.5 397B (Reasoning) | 81 | 3위 |
| **Kimi K2.6** | **54 (Intelligence Index)** | **오픈가중치 중 1위** |
| GLM-5.1 (Reasoning) 오픈 | 51 | 오픈가중치 2위 |
| GLM-5 (Reasoning) 오픈 | 50 | 3위 |
| DeepSeek V3.2 (Thinking) | 65 | $0.28/M 최저가, 전반 품질 GPT-5.4의 ~90% |

### 6-2. 포지셔닝 요약
- **가격**: K2.6 $0.60 vs GLM-5.1 $1.40 → 2배 이상 저렴. 단 DeepSeek V3.2 $0.28이 더 쌈.
- **에이전트 축**: K2.6 SOTA (오픈). GLM-5.1은 장시간 자율 실행 강점.
- **코딩**: K2.6·GLM-5.1·Qwen3.6 Plus 3파전. K2.6이 SWE-Bench Pro 기준 우위.
- **멀티모달**: K2.6 네이티브 비전 O / GLM-5.1 텍스트 전용. 이 격차가 MONK OS 이식 우선순위의 주요 변수.

### 6-3. 중국 규제·검열
- K2.5 기보고: 정치 민감 이슈에서 CCP 공식 입장 정렬 확인됨 (splx.ai 안전 테스트, arXiv 2604.03121 Independent Safety Evaluation).
- K2.6 자체 safety 리포트 ⚠️ **공식 미공개** (모델 카드·블로그 모두 alignment 섹션 없음).

출처: [BenchLM 리더보드](https://benchlm.ai/blog/posts/best-chinese-llm), [Artificial Analysis K2.6](https://artificialanalysis.ai/models/kimi-k2-6), [Atlas Cloud 비교](https://www.atlascloud.ai/blog/guides/kimi-k2-6-vs-glm-5-1-vs-qwen-3-6-plus-vs-minimax-m2-7-coding-2026)

---

## 7. 커뮤니티·개발자 반응

### 7-1. Reddit r/LocalLLaMA
- "Kimi K2.6 Released" 851 upvotes, "Kimi K2.6 is a legit Opus 4.7 replacement" 826 upvotes.
- 초기 유출 게시글엔 회의적이었으나 Moonshot 공식 확인 후 분위기 급반전 ("holy bullseye").
- 5일 자율 인프라 에이전트 구동, 커널 리라이트, Zig 추론 엔진 등 실증 보고 다수.

### 7-2. Hacker News
- "Kimi K2.6: Advancing open-source coding" 스레드([id=47835735](https://news.ycombinator.com/item?id=47835735)) — 오픈가중치가 Opus 4.6에 필적/일부 초과한다는 사실에 집중.

### 7-3. 전문 매체 요지
- [latent.space AINews](https://www.latent.space/p/ainews-moonshot-kimi-k26-the-worlds) — "DeepSeek v4보다 먼저 Opus 4.6 따라잡은 오픈 모델".
- [the-decoder](https://the-decoder.com/open-weight-kimi-k2-6-takes-on-gpt-5-4-and-claude-opus-4-6-with-agent-swarms/) — agent swarm을 차별점으로 제시.
- [Artificial Analysis](https://artificialanalysis.ai/articles/kimi-k2-6-the-new-leading-open-weights-model) — "오픈가중치 1위 갱신" 공식화.
- [Kilo.ai DEV post](https://dev.to/kilocode/kimi-k26-has-arrived-an-open-weight-powerhouse-for-agentic-work-27k0) — IDE 통합 관점 리뷰.

### 7-4. 한글 커뮤니티
⚠️ **확인 필요** — 2026-04-23 기준 한글 기술 블로그·ratsgo 등에서 K2.6 리뷰 미검색 (Phase 1 재조사 권고).

---

## 8. 로컬/셀프호스팅 가능성

### 8-1. VRAM 요구 (양자화 레벨별)
| 양자화 | 가중치 크기 | 최소 RAM/VRAM | 비고 |
|--------|----------|--------------|------|
| FP16 | ~2TB | ~2TB VRAM | 실상 불가 |
| Q8 (UD-Q8_K_XL) | Q4보다 +10GB | ~600GB | "lossless" |
| **Q4 (UD-Q4_K_XL / INT4 공식)** | **594GB (INT4)** | **500GB+ VRAM 또는 584GB 혼합 메모리** | 4× A100 80GB 또는 8× RTX 4090 |
| Dynamic 2-bit (UD-Q2_K_XL) | — | **350GB+** | 중요 레이어는 8-bit 업캐스트 |
| MLX 3.6bit | — | 대형 Mac Studio급 Apple Silicon | inferencerlabs 제공 |

- 스크래치 SSD 공간 ≥ 700GB 필요 (가중치 로딩).

### 8-2. 작가님 사무실 **4060 GPU 서버(8GB VRAM)** 현실성
- **실행 불가 확정.** 최저 2-bit 동적 양자화도 350GB 메모리 필요 → 43배 격차.
- 현실적 옵션:
  1. **Moonshot 공식 API** ($0.60/$2.50) — 보안 민감 작업 제외 기본 선택.
  2. **OpenRouter / Parasail** — 멀티 제공자 비교·호환.
  3. **로컬 실행을 원하면 하드웨어 업그레이드 필수** (최소 A100 80GB ×4 또는 대형 Mac Studio). 2026-04 기준 4060 장비에선 K2.6 로컬은 의제에서 배제 권고.

### 8-3. 추론 성능 tok/s
- 공식 수치 ⚠️ **미공개**.
- 커뮤니티 보고: vLLM + H200 8장 구성에서 수십 tok/s 수준 (Unsloth 가이드 참고). 정확 실측은 Phase 1 에서 자체 벤치 필요.

출처: [Unsloth K2.6 가이드](https://unsloth.ai/docs/models/kimi-k2.6), [aimadetools 로컬 가이드](https://www.aimadetools.com/blog/how-to-run-kimi-k2-6-locally/), [theagenttimes GGUF 기사](https://theagenttimes.com/articles/kimi-k2-6-gguf-quantization-brings-trillion-parameter-coding-88ebbecf)

---

## 9. 안전성·정렬(Alignment)

### 9-1. 공식 safety 리포트
- ⚠️ **K2.6 공식 alignment/safety 리포트 미공개** (모델 카드·기술 블로그 모두 안전성 섹션 부재).
- Moonshot 측 내부 파이프라인으로 "자동 프롬프트 진화 공격/타깃/판정" 모델 구성 주장은 K2 technical report에 기재되어 있으나 K2.6 전용 검증은 2026-04-23 기준 외부 확인 불가.

### 9-2. 이전 버전 약점 (추정 계승 가능성)
- **K2**: splx.ai "raw form security 1.55%" 보고, 수 분 내 jailbreak 성공. [splx.ai 테스트](https://splx.ai/blog/kimi-k2-safety-test)
- **K2.5**: 중국어 환경에서 정치 검열·CCP 입장 정렬 명확 ([arXiv Independent Safety Evaluation of Kimi K2.5](https://arxiv.org/html/2604.03121v1)).

### 9-3. 다국어 응답 품질
| 언어 | 성능 | 출처 |
|------|------|------|
| 중국어 | C-Eval 92.50 / CMMLU 90.90 / CSimpleQA 77.57 | K2 series 일관 |
| 영어 | 프런티어급 (MMLU·GPQA 등 90%+) | 공식 블로그 |
| **한국어** | **⚠️ 공식 측정치 없음** | 토크나이저 vocab 160K에 한국어 포함 여부도 미기재 |
| 일본어 | 공식 측정치 없음 | — |

→ **MONK OS 한국어 콘텐츠 파이프라인에 투입 전 반드시 실측 필요**. 민아·블로그 에디터 흐름에서 품질 검증이 게이트.

---

## 10. MONK OS 관점 결론 (3문항)

### Q1. MONK OS **보조 런타임** 후보로 넣을 가치가 있는가?

**✅ YES — 1순위 후보 자격 충분.**

근거:
1. **OpenAI/Anthropic 호환 API** → Claude Code SDK·에이전트 코드 재사용 가능 (포맷 번역 최소).
2. **MCP 공식 지원 (Kimi Code CLI)** → `.claude/skills`·MCP 서버 생태계 그대로 활용.
3. **Modified MIT 오픈가중치** → 단일 벤더 종속 리스크 해소(헌법 4조 3항 내부 기밀 보호 맥락에서도 로컬 배포 경로 확보 의미).
4. **가격 Opus 4.7의 ~1/10** → 배치·대량 콘텐츠 생성 파이프라인(몽크사진관 로그, 블로그 자동화)에 비용 현실성.
5. **에이전트 벤치 1위군** (HLE tools 54.0, SWE-Bench Pro 58.6, DeepSearchQA 92.5) → MONK 주 작업인 에이전트 오케스트레이션에 직합.

단서:
- 4060 로컬 실행은 **확정 불가** → API 경유 시 Moonshot(중국) 서버 경유 문제 발생. 한국 유저 데이터 주권·내부 기밀 보호 관점 검토 필요.
- 한국어·안전성 실측 안 된 상태 → **즉시 프로덕션 투입 금지, Phase 1 검증 게이트 통과 후 투입**.

### Q2. Claude 4.7 대비 어떤 작업에 더 나은가 / 어떤 작업에 절대 안 되는가?

**K2.6이 더 나은 축**
| 영역 | 근거 |
|------|------|
| **SWE-Bench Pro (멀티파일 수정)** | 58.6 vs Opus 4.6 53.4 (Opus 4.7 미공개) |
| **HLE w/ tools (도구 사용 난제)** | 54.0 vs Opus 4.6 53.0 |
| **에이전트 스웜** | 300 서브 × 4,000 스텝 (Anthropic 공식 대응 개념 부재) |
| **DeepSearchQA** | 92.5 f1 (정보 검색·종합) |
| **비용** | $0.60/$2.50 vs Opus 4.7 대략 $15/$75 → 약 1/15~1/25 |
| **롱컨텍스트 네이티브 + INT4** | 256K + 온프레미스 로컬 운용 여지 |

**Claude 4.7이 더 나은 축 / K2.6 절대 투입 불가 영역**
| 영역 | 근거 |
|------|------|
| **SWE-Bench Verified (단발 수정)** | Opus 4.7 87.6 vs K2.6 80.2 (격차 7.4pt) |
| **Terminal-Bench 2.0** | Gemini 68.5 / K2.6 66.7 / Claude·GPT 65.4 — 1위는 Gemini |
| **한국어 주력 콘텐츠** (민아 블로그, 강한소상공인 등) | K2.6 한국어 품질 미검증, CCP 정치 편향 전과 |
| **정치·사회·민감 이슈 응답** | 중국 규제·검열 위험. "되는 것만 응답" 헌법 4조 4항 기준 실격 |
| **헌법/법률 체계 의사결정** | Claude Code의 Skills·Rules·Memory 1차 구현 환경. 이 영역은 Claude 고정 |
| **데이터 주권 요구 고객 대응** | Moonshot 서버 경유 시 중국 데이터센터 통과 — 일부 B2B 계약 조건과 상충 가능 |

### Q3. MONK OS 법률/Skills 체계가 Kimi에 **그대로 이식 가능한가, 번역이 필요한가**?

**결론: "얇은 번역 레이어"면 가능. 구조 개편 불필요.**

| MONK 체계 | Kimi K2.6 대응 | 이식 난이도 |
|----------|---------------|------------|
| CLAUDE.md (시스템 프롬프트) | system role 메시지 그대로 투입 (OpenAI 호환) | ✅ 즉시 |
| `.claude/rules/*.md` | Kimi Code CLI `customization/` 시스템 프롬프트 주입 | ✅ 즉시 |
| `.claude/skills/*.md` (MCP 기반) | Kimi Code CLI MCP 설정으로 매핑 | 🔀 포맷 일치 확인 필요 (MCPMark 벤치 존재 → 기본 호환) |
| TaskCreate/TaskUpdate 등 Anthropic 네이티브 툴 | Moonshot 툴 스키마로 재정의 필요 (OpenAI 포맷) | 🔀 스키마 변환 wrapper 필요 |
| `thinking` 태그 / reasoning 분리 | `response.choices[0].message.reasoning` 존재, 호환 | ✅ 즉시 |
| Routines/Cron | Kimi CLI에 대응 개념 부재 | ❌ 외부 스케줄러 필요 |
| Memory.md (200줄 캡 디바이스 메모리) | 모델 네이티브 개념 없음, 시스템 프롬프트 주입으로 대체 | ✅ 기존 로딩 경로 재사용 |
| 헌법 5조 4항 (대응 프로토콜) | 프롬프트 수준 지시로 동일 동작 확보. 단 tool_choice 제약(`thinking=enabled`일 때 `auto|none` 한정)은 법률화 필요 | 🔀 법률 미세조정 |

**번역 레이어 최소 요구 사항 (Phase 2 PoC 설계 시 반영 권고)**
1. Tool schema 변환 어댑터 (Anthropic ↔ OpenAI 포맷).
2. Routines(cron) 외부 스케줄러 (기존 `CronCreate` 호출을 시스템 cron으로 프록시).
3. 한국어·안전성 게이트 (프로덕션 투입 전 자체 safety 회귀 테스트 스위트).
4. 데이터 경로 정책 (Moonshot API vs 제3자 프록시 vs 로컬 대형 하드웨어 — 내부 기밀 보호 법률과 일치 확인).

---

## 11. 출처 목록 (전체 URL)

공식·1차 소스
- https://huggingface.co/moonshotai/Kimi-K2.6 (모델카드)
- https://www.kimi.com/blog/kimi-k2-6 (기술 블로그)
- https://platform.kimi.ai/docs/guide/kimi-k2-6-quickstart (API 문서)
- https://moonshotai.github.io/kimi-cli/en/customization/mcp.html (MCP 지원 문서)
- https://forum.moonshot.ai/t/meet-kimi-k2-6-advancing-open-source-coding/369 (공식 포럼)
- https://platform.moonshot.ai/ (공식 API 플랫폼)
- https://developers.cloudflare.com/changelog/post/2026-04-20-kimi-k2-6-workers-ai/ (Cloudflare Workers AI 체인지로그, 릴리즈 일자 검증)
- https://developers.cloudflare.com/workers-ai/models/kimi-k2.6/ (Cloudflare 모델 문서)

분석·비교
- https://artificialanalysis.ai/articles/kimi-k2-6-the-new-leading-open-weights-model
- https://artificialanalysis.ai/models/kimi-k2-6
- https://artificialanalysis.ai/models/kimi-k2-6/providers
- https://llm-stats.com/models/kimi-k2.6
- https://openrouter.ai/moonshotai/kimi-k2.6
- https://kimik2ai.com/pricing/
- https://benchlm.ai/blog/posts/best-chinese-llm
- https://www.maniac.ai/blog/chinese-frontier-models-compared-glm5-minimax-kimi-qwen

로컬·하드웨어
- https://unsloth.ai/docs/models/kimi-k2.6
- https://www.aimadetools.com/blog/how-to-run-kimi-k2-6-locally/
- https://theagenttimes.com/articles/kimi-k2-6-gguf-quantization-brings-trillion-parameter-coding-88ebbecf
- https://github.com/kvcache-ai/ktransformers/blob/main/doc/en/Kimi-K2.5.md

보도·커뮤니티
- https://www.marktechpost.com/2026/04/20/moonshot-ai-releases-kimi-k2-6-with-long-horizon-coding-agent-swarm-scaling-to-300-sub-agents-and-4000-coordinated-steps/
- https://siliconangle.com/2026/04/20/moonshot-ai-releases-kimi-k2-6-model-1t-parameters-attention-optimizations/
- https://www.scmp.com/tech/big-tech/article/3350887/moonshot-ai-releases-flagship-model-open-source-push-continues
- https://the-decoder.com/open-weight-kimi-k2-6-takes-on-gpt-5-4-and-claude-opus-4-6-with-agent-swarms/
- https://blockchain.news/ainews/kimi-k2-6-breakthrough-open-source-model-tops-gpt-5-4-claude-opus-4-6-gemini-3-1-pro-on-elite-benchmarks-2026-analysis
- https://www.remio.ai/post/kimi-k2-6-landed-four-days-after-claude-opus-4-7-the-pricing-is-10-lower-and-it-s-open-weight
- https://dev.to/max_quimby/kimi-k26-vs-claude-opus-47-the-88-cost-advantage-2916
- https://www.buildfastwithai.com/blogs/kimi-k2-6-vs-gpt-claude-benchmarks
- https://www.latent.space/p/ainews-moonshot-kimi-k26-the-worlds
- https://news.ycombinator.com/item?id=47835735
- https://dev.to/kilocode/kimi-k26-has-arrived-an-open-weight-powerhouse-for-agentic-work-27k0
- https://www.atlascloud.ai/blog/guides/kimi-k2-6-vs-glm-5-1-vs-qwen-3-6-plus-vs-minimax-m2-7-coding-2026

안전성·alignment
- https://arxiv.org/html/2604.03121v1 (Independent Safety Evaluation of Kimi K2.5)
- https://splx.ai/blog/kimi-k2-safety-test
- https://arxiv.org/html/2507.20534 (Kimi K2 Open Agentic Intelligence 기술 리포트)

---

## 12. 확인 필요 (⚠️) 총정리

| # | 항목 | 비고 |
|---|------|------|
| 1 | NIAH / RULER 롱컨텍스트 실측치 공식 미공개 | Phase 1 자체 벤치 |
| 2 | K2.6 공식 safety/alignment 리포트 미공개 | 외부 재현 전까지 프로덕션 투입 유보 |
| 3 | 한국어 품질 공식 수치 없음 | 민아·블로그 파이프라인 투입 전 실측 필수 |
| 4 | 일본어 품질 공식 수치 없음 | idphoto-jp 등 일본향 투입 전 검증 |
| 5 | 추론 tok/s 공식 수치 없음 | vLLM/SGLang 실측 필요 |
| 6 | Modified MIT의 "Modified" 조항 세부 | LICENSE 원문 읽기 필요 (상업 이용 제약·distillation 제한 조항 가능성) |
| 7 | 한글 기술 커뮤니티 리뷰 부재 | Phase 1 재조사 |
| 8 | Moonshot API 경유 시 데이터 처리 위치·보존 | 내부 기밀 보호 법률 적합성 검토 |

---

## 후속 제안 (쌍아 통합 단계용)

1. **보조 런타임 도입 결정은 Phase 1 통합 보고서에서 함께 결정** (Track A·B·D 결과와 교차 검증 후).
2. 도입 결정 시 우선 투입 영역: **에이전트 오케스트레이션 / 배치 콘텐츠 / SWE-Bench Pro형 코딩**. 한국어·민감 주제·민아 콘텐츠는 제외.
3. Phase 2 PoC 대상 추천: **Kimi K2.6 API + Kimi Code CLI**로 MONK OS Skills·MCP 하나(예: `/cdp-troubleshoot`)를 **그대로 이식**하여 이식성 1차 증명.
4. 하드웨어 업그레이드 없이 로컬 셀프호스팅은 **의제 제외**. 장기 로드맵에서 Mac Studio 대형 구성 또는 GPU 서버 증설 시 재검토.
