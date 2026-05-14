---
type: order
date: 2026-05-14
from: iMac/쌍아
to: iMac/막내1
subject: VSCode 셋업 실행 — 스니펫 6종 + 구버전 확장 정리
status: 대기
portfolio: PF_MONK_OS
prior: REPORT_20260514_막내_VSCode전수조사.md
---

# 지시서: VSCode 셋업 실행 (보고서 액션 #3·#6)

## 목적

VSCode 전수조사 보고서(본인 작성)의 즉시 적용 액션 중 작가님 승인 2건을 실행한다.
> #4(터미널 리스크 평가)·#5(출력 압축)은 제외 — 막내는 iTerm CLI 환경이므로 VSCode 터미널 설정 무의미.

## 작업 내용

### 1. 스니펫 6종 구축 (#3)

`.vscode/monk.code-snippets` 파일 생성. 아래 6종:

| 접두어 | 내용 | 스코프 |
|--------|------|--------|
| `yaml-session` | 세션 로그 YAML frontmatter (type, date, device, agent, status) | markdown |
| `yaml-order` | 지시서 YAML frontmatter (type, date, from, to, subject, status, portfolio) | markdown |
| `yaml-completion` | 완료 보고서 YAML frontmatter | markdown |
| `yaml-pf` | 포트폴리오 YAML frontmatter (ch4 9조 필수 필드) | markdown |
| `ts-kst` | `**[YYYY-MM-DD HH:MM KST]**` 타임스탬프 블록 | markdown |
| `header-comm` | `[YYYY-MM-DD HH:MM KST] {디바이스}/{에이전트} → {수신자}` 수발신 헤더 | markdown |

- `$1`, `$2` 등 탭스톱으로 가변 필드 지정
- date 필드는 `$CURRENT_YEAR-$CURRENT_MONTH-$CURRENT_DATE` 자동 삽입
- 기존 `.vscode/settings.json`은 수정하지 않는다

### 2. 구버전 확장 정리 (#6)

아래 구버전 확장 디렉토리 삭제:
- `~/.vscode/extensions/anthropic.claude-code-2.1.140/` (현행 2.1.141)
- `~/.vscode/extensions/google.geminicodeassist-2.81.0/` (현행 2.82.0)

삭제 전 `ls`로 존재 확인. 현행 버전 디렉토리는 절대 삭제하지 않는다.

## 산출물

- `.vscode/monk.code-snippets` (신규)
- 구버전 확장 삭제 확인 로그

## ⚠️ 준수 조항

- 헌법 4조 1항: `.env`, `secrets/` 내용 노출 금지
- `.vscode/settings.json` 수정 시 기존 설정 보존. 추가만 허용
- 확장 삭제는 구버전만. 현행 버전 삭제 절대 금지
- 보고서에서 #2(시크릿 보호 확장)은 보류 — 실행하지 않는다

---

> 발행: **[2026-05-14 12:06 KST]** iMac/쌍아 → iMac/막내1 투입 대기
