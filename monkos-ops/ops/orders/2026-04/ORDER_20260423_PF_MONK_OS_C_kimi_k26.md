---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/막내3
status: 대기
pf: PF_MONK_OS
track: C
parallel_with: ["A → 막내1", "B → 막내2", "D → 막내4"]
---

# [지시서] Kimi K2.6 총체 리서치 (PF_MONK_OS / Track C)

> **[2026-04-23 11:45 KST] iMac/쌍아 → iMac/막내3**
> 상위 PF: [PF_MONK_OS](../portfolios/PF_MONK_OS/README.md)
> 목적: 엊그제 릴리즈된 **Kimi K2.6**의 기술 사양·위상·전략적 의미를 파악하여 MONK OS 범용 에이전트 OS 로드맵(Phase 1) 의사결정 재료로 공급
> **병렬 맥락**: 4기 동시 가동. A/B/D 트랙은 독립 — 타 트랙 결과 대기 금지, 본 지시서 범위만 집중.

---

## 배경

- 작가님 원문(2026-04-23): "최근 이슈일 KIMI 2.6 관련 보고서까지 제대로 파악시켜"
- Kimi K2.5가 이미 큰 화제였고 **K2.6이 엊그제(약 4/21~4/22경) 신규 릴리즈**된 것으로 확인됨 → 공식 발표·벤치·커뮤니티 반응 전수 조사 필요
- 본 리서치는 MONK OS를 Claude 런타임 외(Kimi 포함)에도 이식 가능한 구조로 만들기 위한 기초자료

---

## 조사 범위 (10개 축)

### 1. 공식 릴리즈 정보
- Moonshot AI 공식 블로그/보도자료/X(트위터) 계정
- 릴리즈 일자, 버전 번호 정확 확인 (2.6 vs K2.6 vs K2.6-Thinking 등 변종 포함)
- 공식 모델 카드 / 기술 리포트 URL
- 이전 버전(K2, K2.5)과의 차이점 공식 서술

### 2. 모델 스펙
- 파라미터 수 (총/활성, MoE 여부)
- 컨텍스트 윈도우 길이
- 토크나이저·언어 지원
- 멀티모달 지원 여부 (비전/오디오/코드)
- 인퍼런스 비용 (공식 API 가격 및 토큰 단가)

### 3. 벤치마크
- 공식 벤치 (MMLU, HumanEval, SWE-bench, GPQA, AIME, LiveCodeBench 등)
- **에이전트 벤치** (Terminal-Bench, τ-bench, AgentBench 등 — MONK OS 입장에서 가장 중요)
- Long-context 성능 (NIAH, RULER)
- Claude 4.7 / Gemini 2.5 / GPT-5 / DeepSeek V3.2 등과 비교 표

### 4. 오픈소스 전략
- 가중치 공개 여부 / 라이선스 (MIT·Apache·커스텀)
- Hugging Face 저장소 (주소 + 다운로드 수)
- 상업 이용 가능성, 제약 조건
- 공식 GitHub 저장소 (inference 코드·파인튜닝 레시피)

### 5. 에이전트·도구사용 역량 (MONK OS 관점 핵심)
- Tool use / function calling 포맷 (OpenAI 호환? 자체 포맷?)
- MCP 지원 여부
- 멀티스텝 에이전트 성능 (공식 데모·서드파티 리뷰)
- 코드 실행 / 브라우저 / 파일 시스템 등 내장 도구
- Skills·Rules·Memory 유사 개념 존재 여부

### 6. 중국 모델 지형 내 위상
- DeepSeek V3.2 / Qwen3 / GLM-4.6 / Yi 와의 비교
- 중국 내 평가 (知乎·微博·36kr 등 키 매체 요지)
- 중국 정부·AI 규제 관점 (검열·안전 정책)

### 7. 커뮤니티·개발자 반응
- Hugging Face 허브 트렌딩 순위
- r/LocalLLaMA, r/singularity, HN 주요 스레드 요약
- Twitter/X 주요 AI 연구자 반응 (@teortaxesTex, @Dorialexander, @_xjdr, @simonw 등)
- 한글 커뮤니티 (ratsgo.github.io, 개발자 블로그)

### 8. 로컬/셀프호스팅 가능성
- 모델 크기 기준 필요 VRAM (FP16/FP8/Q4 기준)
- 4060 GPU 서버(작가님 사무실)에서의 현실적 운용 가능성
- vLLM / SGLang / llama.cpp 지원 상태
- 추론 속도 (tok/s) 실측 리포트

### 9. 안전성·정렬(Alignment)
- 공식 safety 리포트
- Jailbreak 저항성 공개 테스트 결과
- 중국어/영어 외 언어(한국어·일본어)에서의 응답 품질

### 10. MONK OS 관점 평가
> 막내4의 자체 판단으로 아래 3문항에 결론 제시:
1. Kimi K2.6을 MONK OS의 **보조 런타임** 후보로 넣을 가치가 있는가?
2. Claude 4.7 대비 **어떤 작업에 더 나은가 / 어떤 작업에 절대 안 되는가**?
3. MONK OS 법률/Skills 체계가 Kimi에 **그대로 이식 가능한가, 번역이 필요한가**?

---

## 조사 방법

1. WebSearch + WebFetch 공격적으로 병행 (공식 소스 우선 → 커뮤니티)
2. 중문 소스는 원문 인용 + 한글 요약 병기
3. 벤치마크 수치는 **반드시 측정 일자·출처 URL**과 함께 기재 (추정·전달 금지)
4. Hugging Face·GitHub는 실제 페이지 접속해 다운로드 수·스타·라이선스 확인
5. 불확실한 정보는 `⚠️ 확인 필요` 표시 — 추측으로 채우지 말 것

---

## 산출물

**메인 보고서**: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_C_kimi_k26.md`

구조:
```
---
type: RESEARCH
track: C
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내4
---
# RESEARCH C — Kimi K2.6 총체 보고서
## 요약 (500자 내)
## 1. 공식 릴리즈 정보
## 2. 모델 스펙
... (10개 축 모두)
## 11. 출처 목록 (전체 URL)
## 12. MONK OS 관점 결론 3문항 답변
```

**요약 500자**는 반드시 보고서 최상단에 배치 — 쌍아가 통합본 작성 시 이 요약만 인용.

---

## 준수 조항

⚠️ 타임스탬프: 매 턴 `date` 시스템 명령으로 KST 취득 (헌법 3조 1항)
⚠️ 추정 금지: 모르는 값은 `⚠️ 확인 필요`로 명시 (헌법 2조 3항 에러 묵과 금지)
⚠️ 소스 URL 필수: 모든 수치·인용에 출처 링크
⚠️ 보고서 완료 시 PF_MONK_OS README의 히스토리 테이블에 append (헌법 3조 2항 PF 갱신 의무)
⚠️ 세션 로그 동시 기록: `monkos-ops/ops/sessions/2026-04-23_iMac_막내3.md`
⚠️ 배포·설치 작업 없음 — 순수 조사만. `pip install` 등도 금지 (필요하면 쌍아에게 보고)

---

## 완료 보고 형식

```
✅ Track C 완료 — RESEARCH_C_kimi_k26.md
📁 [링크](monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_C_kimi_k26.md)
💡 핵심 발견 3줄
⚠️ 확인 필요 항목 N건
⏳ 후속 제안 (있다면)
```
