---
type: TASK
date: 2026-02-24
author: iMac/쌍아
target: 막내1
status: 대기
---

# 지시서: iMac MEMORY.md 압축 — OS 원칙 적용

> [2026-02-24 11:10 KST] iMac/쌍아 → 막내1

---

## 역할 선언
> **너는 "막내1"이다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내1 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내1 → iMac/쌍아` 형식

---

## 배경

M1 디바이스에서 2026-02-24 새벽 CONTEXT_ARCHITECTURE.md가 확립되었다. 핵심 원칙:

**"세션 시작 시, 파일을 열기 전에, 에이전트가 알아야 하는 OS만 남긴다."**

M1의 MEMORY.md는 이미 233줄 → 69줄로 압축 완료되었으나 (MEMORY_CHANGELOG_M1.md 참조), **이 iMac의 MEMORY.md는 아직 미압축 상태 (201줄)** — 도메인 지식이 과다하게 잔존해 있다.

---

## 필수 참조 문서 (실행 전 반드시 읽을 것)

1. `docs/infrastructure/CONTEXT_ARCHITECTURE.md` — §4 유입 규칙이 핵심
2. `monkos-ops/ops/MEMORY_CHANGELOG_M1.md` — M1 압축 선례 (삭제/유지 판단 근거)
3. 현재 iMac MEMORY.md — `~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/MEMORY.md`

---

## 임무

### 1. 현황 분석

현재 iMac MEMORY.md (201줄)를 읽고, 각 섹션을 아래 기준으로 분류하라:

| 유형 | MEMORY에 | 이유 |
|------|---------|------|
| 행동 규칙 (OS) | **유지** | 파일 열기 전에 알아야 함 |
| 도메인 지식 | **삭제** | 코드/docs에 있음. 필요 시 Read |
| 세션 결정사항 | **삭제** | 세션 로그에 기록됨 |
| 헌법 중복 | **삭제** | CLAUDE.md에 이미 있음 |
| 인프라 레퍼런스 | **삭제** | 필요 시 외장 파일 Read |

### 2. M1 선례 대조

MEMORY_CHANGELOG_M1.md의 삭제/유지 판단을 참고하되, iMac 특성을 반영하라:

- **iMac = 사무실 메인 워크스테이션** (M1과 다른 디바이스 정체성)
- 디바이스 식별: "이 디바이스는 iMac (사무실)" 명시 필요
- 역할: 쌍아 전략실 + 막내 코딩 병행 환경

### 3. 압축 실행

MEMORY.md를 편집하여 OS만 남긴다. 목표 **70줄 이하**.

**유지 대상 (OS급):**
- 디바이스 식별 ("이 디바이스는 iMac 사무실")
- 팀 인적 인프라 (조직 구조 — 누가 누구인가)
- 팀 우체통 시스템 (커뮤니케이션 경로)
- 운영 철학/원칙 (행동 강령)
- 지시서 운용 원칙 (쌍아↔막내 프로토콜)
- 디버깅 교훈 (반복 실수 방지)
- 프로젝트 폴더 위상 (기본 경로)

**삭제 대상 (도메인):**
- Gemini Live API 상세 (코드에 있음)
- Imagen I2I 상세 (코드에 있음)
- monkos_AI 서비스 체계 상세 (코드/docs에 있음)
- LINE Official Account 상세 (코드에 있음)
- 캡처 파이프라인 상세 (코드에 있음)
- CF Function 지역차단 상세 (docs에 있음)
- 빅테크 정책 우회 전략 (세션 로그에 있음)
- 로컬 LLM R&D (세션 로그에 있음)
- 인앱 브라우저 이슈 (세션 로그에 있음)
- 앱 구조 상세 (코드에 있음)
- 포털 챗봇 아키텍처 상세 (코드에 있음)
- CF Pages Functions 배포 상세 (docs에 있음)
- 광고 시스템/Image Pro/CF 캐시 상세 (코드에 있음)

### 4. 변경 로그 작성

`monkos-ops/ops/MEMORY_CHANGELOG_iMac.md` 신설. M1 로그와 동일 형식:

- 삭제 항목: 섹션명, 줄 수, 삭제 사유, 원본 소재지
- 유지 항목: 섹션명, 줄 수, 유지 사유
- 압축 전후 줄 수 명시

---

## 주의사항

1. **MEMORY.md는 로컬 파일** — Git 추적 안 됨. 편집은 직접 Write/Edit으로.
2. **MEMORY_CHANGELOG는 Git 추적** — 커밋 대상.
3. **CLAUDE.md와의 중복 제거 우선** — CLAUDE.md에 이미 있는 내용은 무조건 삭제.
4. **외장 메모리 참조** — 삭제한 도메인 지식 중 자주 필요한 것은 "별도 파일 참조" 한 줄 포인터만 남겨도 됨.
5. **상세 기술명세 섹션의 포인터 링크** — 유효한 것만 유지. 깨진 링크 제거.

---

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` (CHANGELOG만 — MEMORY는 Git 밖) |
| 산출물 1 | iMac MEMORY.md 압축 완료 (70줄 이하) |
| 산출물 2 | `monkos-ops/ops/MEMORY_CHANGELOG_iMac.md` |
| 보고서 | 불필요 (CHANGELOG가 보고서 역할) |

---

## 준수 조항

- **CONTEXT_ARCHITECTURE.md §4**: OS만 남긴다
- **헌법 제6조**: .env 등 민감 파일 무단 수정 금지 (MEMORY.md는 해당 없으나 주의)
- **헌법 제8조**: 파괴적 명령 금지 — MEMORY.md 전체 삭제 후 재작성이 아닌, 섹션별 판단 후 편집

---

> 본 지시서는 쌍아가 작성하고 작가님 승인을 거쳐 하달됩니다.
