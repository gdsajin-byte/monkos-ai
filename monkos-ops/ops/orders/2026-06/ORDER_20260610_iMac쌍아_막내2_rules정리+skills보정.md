---
type: order
date: 2026-06-10
from: iMac/쌍아
to: iMac/막내2
portfolio: PF_MONK_OS
status: 대기
---

# 지시서 — rules 정리 + skills 보정

**[2026-06-10 16:17 KST] iMac/쌍아 → iMac/막내2**

> 작가님 승인 완료 (2026-06-10 16:17 KST). 삼권분석(입법·행정·사법) 결과에 기반한 실행.

---

## Task 1: rules 삭제 (1건)

`.claude/rules/references.md` 삭제.
- 사유: CLAUDE.md 하단 규정 참조 테이블과 100% 중복 (입법 보고서 §1-1)

## Task 2: rules → skills 이관 (2건)

**2-1. cdp-browser.md (125줄)**
- `.claude/rules/cdp-browser.md` 삭제
- `.claude/skills/cdp-browser.md`에 기존 `cdp-troubleshoot.md`와 통합하여 신설
- 스킬명: CDP 브라우저 제어 + 장애 진단 통합

**2-2. portal_seo.md (72줄)**
- `.claude/rules/portal_seo.md` 삭제
- `.claude/skills/portal-context.md` 신설 (내용 이관)

## Task 3: rules 중복 제거 (헌법 복붙 삭제)

각 파일을 Read → 헌법(CLAUDE.md)과 중복되는 부분 삭제 → 법률(ch5·ch6) 고유 내용만 잔존.

**3-1. git-safety.md (23줄)**
- 헌법 4조 1항(비밀정보) 복붙 삭제
- 헌법 4조 2항(파괴적 명령) 복붙 삭제
- 잔존: ch6 커밋 규칙(브랜치 전략, 커밋 메시지 형식, 카테고리) + ch5 deploy.sh 경유 1줄

**3-2. session-log.md (38줄)**
- 헌법 3조 1항(타임스탬프 형식) 복붙 삭제
- 헌법 3조 2항(완료 보고 형식) 복붙 삭제
- 잔존: 파일명 패턴, 월별 폴더 규칙, YAML frontmatter

**3-3. deployment.md (44줄)**
- CLAUDE.md에 동일 테이블이 이미 존재하는 deploy.sh 경로 테이블 삭제
- 잔존: 막내 방어 의무, 예외 목록 (pt.monkos.ai, monk-n8n)

**3-4. pf-ops.md (39줄)**
- 헌법 3조 2항(append-only) 원칙 복붙 삭제
- 잔존: 히스토리 테이블 열, YAML 필수 필드, 인덱스 등록, 비대화 관리, 메타 PF

## Task 4: rules 신설 (3건)

삼권분석 입법 보고서 §3-2 권고안에 따라 법률 발췌 신설. **핵심만 축약, 풀텍스트 금지.**

**4-1. `.claude/rules/agent-system.md` (~30줄)**

```yaml
---
description: 에이전트 역할·흐름·디바이스 맵 (ch1 발췌)
globs:
  - "**"
---
```

발췌 내용:
- 에이전트 정의: 역할 1줄 요약 테이블 (쌍아·민아·웹민아·막내·소넷이·철창이·코웍이)
- 핵심 흐름 3줄: ①원칙(쌍아→막내) ②보충(작가님→막내) ③민아(진단→제안→실행→검증)
- 디바이스 약칭 1줄
- 쌍아 직접 코딩 금지 1줄
- 상세는 `governance/laws/ch1_agent_system.md` 참조 안내

**주의**: Task 1(ch1 개정)이 먼저 완료되어야 웹 민아가 포함됨. 막내1 커밋을 pull한 후 작성할 것.

**4-2. `.claude/rules/coding.md` (~20줄)**

```yaml
---
description: 코딩 규칙 (ch2 발췌)
globs:
  - "*.js"
  - "*.html"
  - "*.css"
  - "*.ts"
  - "*.jsx"
  - "*.tsx"
---
```

발췌 내용:
- 기술 스택: 순수 JS, 새 프레임워크 도입 시 설계 선행
- 네이밍: HTML/CSS kebab-case, JS camelCase, 파일 snake_case
- 언어: 한국어 우선 (일본 서비스는 일본어)
- CSS: Tailwind 우선
- 상세는 `governance/laws/ch2_coding.md` 참조 안내

**4-3. `.claude/rules/branding.md` (~15줄)**

```yaml
---
description: 브랜딩 규칙 (ch8 발췌)
globs:
  - "*.html"
  - "*.js"
  - "*.json"
---
```

발췌 내용:
- 유저 대면 서비스에서 Gemini/Imagen → "MONKOS" 또는 "MONKOS AI"
- 내부 호칭(쌍아/막내/소소/용아/민아) 외부 사용 금지
- 챗봇 RAG: 되는 것만 응답, 미출시 표현 금지
- 상세는 `governance/laws/ch8_branding.md` 참조 안내

## Task 5: skills 조항번호 보정 (3건)

| 파일 | 행 | 현재 | 수정 |
|------|-----|------|------|
| `.claude/skills/makne-finish.md` | 27행 | 헌법 제1조 2항 | **헌법 제3조 2항** |
| `.claude/skills/makne-finish.md` | 71행 | 헌법 제1조 2항 | **헌법 제3조 2항** |
| `.claude/skills/session-end.md` | 24행 | 헌법 1조 1항 | **헌법 제3조 1항** |

## Task 6: paths → globs 변환 (2건)

| 파일 | 현행 키 | 변환 |
|------|---------|------|
| `data-access.md` | `paths` | `globs`로 변환 (동일 경로 패턴) |
| `makne-guard.md` | `paths` | `globs`로 변환 (동일 경로 패턴) |

---

## 엔드라인

| 항목 | 내용 |
|------|------|
| 포트폴리오 | PF_MONK_OS |
| 마무리 | 커밋+push |
| 산출물 | rules 6건 변경, skills 4건 변경 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | [log] 태그 커밋 |

## ⚠️ 준수 조항

- **CLAUDE.md 수정 금지** (막내1 담당)
- **governance/laws/ 수정 금지** (막내1 담당)
- rules 신설 시 풀텍스트 금지 — 핵심 발췌만, 상세는 laws 참조 안내
- Task 4(rules 신설)는 막내1의 ch1 개정 커밋을 pull한 후 진행
