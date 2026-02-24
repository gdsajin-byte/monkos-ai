# 지시서: MEMORY.md 인덱싱 구조 개편

> [2026-02-22 19:46 KST] iMac/쌍아 → 막내 (iMac 또는 집)

## 역할 선언
> **너는 "막내"다.**
> - 완료 보고: `{디바이스}/막내 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 헌법 제8조 (파괴적 명령 금지): 기존 MEMORY.md 원본 삭제 금지. 내용 이전 후 축소
- 법률 제4장 (문서/폴더 구조): 토픽 파일은 기존 memory/ 디렉토리 내 배치

## 배경
MEMORY.md가 200줄 한도(자동 로딩 제한)에 도달. 현재 199줄.
매 세션마다 전량 로딩되어 컨텍스트 낭비. 인덱스+토픽 파일 구조로 분리하여:
- MEMORY.md = ~80줄 인덱스 (핵심 요약 + 토픽 파일 링크)
- 토픽 파일 = 상세 내용 (필요 시에만 Read)

## 작업

### 1. 현황 파악

```bash
cd ~/developer/monk_project
wc -l ~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/MEMORY.md
ls ~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/
```

MEMORY.md를 읽고 섹션별 줄 수를 파악한다.

### 2. 토픽 파일 분리

아래 구조로 토픽 파일을 생성한다. 경로: `~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/`

| 토픽 파일 | 원본 섹션 | 설명 |
|-----------|----------|------|
| `gemini_api.md` | Gemini Live API + Imagen I2I + CF+Gemini 지역차단 | API 모델/인증/비용/주의사항 |
| `services.md` | monkos_AI 서비스 체계 + LINE + 포털 챗봇 + 앱 구조 + 연락처 | 서비스 배포/URL/인증/rev |
| `infrastructure.md` | 인프라 + 에이전트 통신 + Claude Max + CF Pages + 광고 + Image Pro + CF 캐시 | 디바이스/SSH/WSL/배포 |
| `capture_pipeline.md` | 캡처 파이프라인 | 카메라/해상도/fps/TTS |
| `debugging.md` | 디버깅 교훈 | 실전 교훈 모음 |
| `strategy.md` | 빅테크 정책 + 로컬 LLM R&D + 인앱 브라우저 | 전략적 기술 판단 |

**기존 파일 유지**: `tts_voice_architecture.md`, `sonnet/` — 그대로 둔다.

### 3. MEMORY.md 인덱스화

MEMORY.md를 ~80줄 이내로 재구성한다. 구조:

```markdown
# MONKOS 프로젝트 메모리

## 토픽 파일 인덱스
| 파일 | 내용 | 최종 갱신 |
|------|------|----------|
| [gemini_api.md](gemini_api.md) | Gemini Live/Imagen/지역차단 | 2026-02-21 |
| [services.md](services.md) | monkos_AI 서비스/LINE/챗봇/앱 구조 | 2026-02-22 |
| [infrastructure.md](infrastructure.md) | 인프라/SSH/WSL/배포/광고 | 2026-02-22 |
| [capture_pipeline.md](capture_pipeline.md) | 캡처 파이프라인 | 2026-02-21 |
| [debugging.md](debugging.md) | 디버깅 교훈 모음 | 2026-02-22 |
| [strategy.md](strategy.md) | 빅테크 정책/로컬 LLM R&D | 2026-02-20 |
| [tts_voice_architecture.md](tts_voice_architecture.md) | TTS/Voice 아키텍처 | 2026-02-14 |
| [sonnet/README.md](sonnet/README.md) | 소넷이 아카이브 | 2026-02-15 |

## 핵심 요약 (~60줄)
(각 토픽에서 1~3줄씩만 추출한 초압축 요약)
```

### 4. 인덱스에 남길 항목 (삭제 금지)

아래 항목은 매 세션 즉시 참조 필요 — MEMORY.md 인덱스에 요약 유지:
- **팀 인적 인프라** (한송이, 꾸) — 2줄
- **팀 우체통 시스템** — 2줄 (경로+alias만)
- **사업 구조** — 1줄
- **프로젝트 폴더 위상** — 테이블 유지 (간결화)
- **운영 철학** — 2줄
- **monkos-ops 운영 원칙** — 1줄
- **작가님 인사이트 (금언)** — 2줄
- **지시서 운용 원칙** — 4줄
- **상세 기술명세 링크** (헌법, TTS, 소넷이) — 기존 유지

### 5. 검증

```bash
wc -l ~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/MEMORY.md
# 80줄 이내여야 함
ls -la ~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/
# 토픽 파일 6개 + 기존 파일 존재 확인
```

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `MEMORY.md 인덱스화 + 토픽 파일 6개 생성` |
| 산출물 | MEMORY.md(~80줄), 토픽 파일 6개 |
| 문서 유형 | 해당 없음 (Git 비추적 영역) |
| 세션 로그 | 본 세션 로그에 완료 기록 |
