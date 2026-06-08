---
type: order
date: 2026-06-08
from: iMac/쌍아
to: 4060/쌍아
portfolio: PF_OPUS, PF_PORTAL
status: 대기
---

# 지시서 — ollama 기반 모델 비교 테스트 (Gemma 4 12B + Qwen 3.5 no_think + Qwen 3.6)

**[2026-06-08 19:12 KST] iMac/쌍아 → 4060/쌍아**

---

## 배경

- ollama 0.30.6이 smuse73 계정에 설치 완료 (`C:\Users\smuse73\AppData\Local\Programs\Ollama\ollama.exe`)
- **Gemma 4 12B** 이미 다운 완료 (7.6GB, Q4)
- Qwen 3.5 4B 테스트에서 thinking 병목으로 전환 불가 판정됐으나, no_think 미검증
- Qwen 3.6-35B-A3B를 IQ2M(2-bit)으로 돌렸으나 양자화 손실이 큼

**ollama를 통일 런타임으로** 사용하여 동일 조건 비교 테스트를 수행한다.

---

## 임무

### Task 1: ollama 서버 기동

```bash
"C:\Users\smuse73\AppData\Local\Programs\Ollama\ollama.exe" serve
```

기존 llama-server 프로세스가 있으면 종료 후 ollama serve 실행.

### Task 2: 모델 3종 준비

```bash
ollama list                    # gemma4:12b 확인
ollama pull qwen3.5:4b         # Qwen 3.5 4B (ollama 공식 Q4)
```

Qwen 3.6은 이미 GGUF로 보유 중이면 ollama에 등록하거나, ollama 공식 모델이 있으면 pull.

### Task 3: 블로그 에디터 시나리오 4종 비교 테스트

**각 모델별 동일 프롬프트로 테스트.** ollama의 `--format json` 또는 시스템 프롬프트로 JSON 출력 강제.

#### 시나리오 1: SEO 제안 (JSON 출력)

```
시스템: You are an SEO expert. Respond in JSON only: {"summary":"...","tags":"...","ogTitle":"..."}
유저: 블로그 제목 "증명사진 배경색 완벽 가이드 — 흰색, 파란색, 회색 언제 쓸까"에 대한 SEO 메타를 생성해줘. summary는 한국어 160자 이내, tags는 한국어 5개, ogTitle은 한국어 60자 이내.
```

#### 시나리오 2: 이미지 프롬프트 생성

```
유저: "증명사진 배경색 완벽 가이드"라는 블로그 글에 넣을 삽화를 Imagen 4로 생성하려고 합니다. 배경색 비교(흰색/파란색/회색)를 시각적으로 보여주는 영문 이미지 프롬프트를 200단어 이내로 만들어줘. 사람 얼굴은 넣지 마.
```

#### 시나리오 3: 글감 정리

```
유저: 에피소드 정보를 기반으로 블로그 개요를 만들어줘.
제목: "AI가 바꾸는 증명사진의 미래"
요약: "전통 사진관에서 AI 기반 서비스로 전환되는 증명사진 시장의 변화"
핵심 인사이트: "온디바이스 AI가 프라이버시와 비용 두 마리 토끼를 잡는다"
구조: 제목 + 서론 + 본문 3섹션 + 결론. 한국어로.
```

#### 시나리오 4: slug 생성

```
유저: "증명사진 배경색 완벽 가이드"를 영문 URL slug로 변환해줘. 소문자, 하이픈만, 60자 이내, ASCII only. slug만 출력.
```

**Qwen 3.5 추가 테스트: no_think 모드**

시스템 프롬프트에 추가:
```
/no_think
```
또는
```
You must respond directly without any thinking or reasoning process. No <think> tags.
```

이 설정으로 thinking 비활성화 후 동일 4시나리오 재테스트.

### Task 4: 결과 정리

| 시나리오 | Gemma 4 12B 품질 | 12B 속도 | Qwen 3.5 (no_think) 품질 | 3.5 속도 | Qwen 3.6 품질 | 3.6 속도 |
|----------|-----------|----------|-----------|----------|-----------|----------|
| SEO 제안 | | | | | | |
| 이미지 프롬프트 | | | | | | |
| 글감 정리 | | | | | | |
| slug 생성 | | | | | | |

각 셀에: 품질(1-5), 총 시간(초), tok/s 기재.

### Task 5: 종합 판정

판정 기준:
- 품질 4 이상 + 속도 5초 이내 → **온디바이스/로컬 전환 가능**
- 품질 3 이하 또는 속도 15초 초과 → **서버(Gemini 2.5 Flash) 유지**

iPhone 참고 데이터: Gemma 4 E4B — 작가님 iPhone에서 빠른 응답 + 한국어 매끄러움 확인 (비정량).

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키 생성/추측 금지.
- ollama 공식 모델만 사용. 외부 불명 GGUF 금지.
- 테스트 결과를 COMPLETION 보고서로 납품.

---

## 납품

- `monkos-ops/ops/completions/2026-06/COMPLETION_20260608_4060쌍아_ollama_모델비교테스트.md`
- 완료 후 `✅❌💡⏳📁🔀` 형식 보고.
