---
description: 코딩 규칙 (ch2 발췌)
paths:
  - "**/*.js"
  - "**/*.html"
  - "**/*.css"
  - "**/*.ts"
  - "**/*.jsx"
  - "**/*.tsx"
---

> source: governance/laws/ch2_coding.md@2026-10-28

# 코딩 규칙 (ch2 발췌)

- **기술 스택**: 순수 JS (async/await), HTML, CSS, Tailwind. 새 프레임워크 도입 시 설계 선행 필수.
- **네이밍**: HTML/CSS `kebab-case`, JS `camelCase`, 파일 `snake_case`
- **언어**: 한국어 우선 (UI·주석·에러·커밋). 일본 서비스는 일본어 UI.
- **CSS**: Tailwind 클래스 우선
- **인프라 상수 정본 집중** (ch2 7조): URL·도메인·리전·배포타겟·금액 표기를 코드에 분산 정의 금지. 단일 정본 모듈 경유. 가격 하드코딩 금지. 상수 참조: `.claude/rules/references.md`

> 상세: governance/laws/ch2_coding.md
