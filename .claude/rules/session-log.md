---
description: 세션로그·보고서·지시서 파일 생성/수정 시 적용
globs:
  - "monkos-ops/ops/sessions/**"
  - "monkos-ops/ops/reports/**"
  - "monkos-ops/ops/orders/**"
---

# 세션로그·보고서·지시서 규칙 (ch3·ch4 발췌)

## 타임스탬프 (헌법 3조 1항)
- 매 턴 `date`로 KST 취득. 추정/기억 금지.
- 형식: `**[YYYY-MM-DD HH:MM KST]**`

## 파일명 패턴
- 세션로그: `2026-MM-DD_{디바이스}_{에이전트}.md`
- 보고서: `{COMPLETION|REPORT}_YYYYMMDD_{주체}_{내용}.md`
- 지시서: `ORDER_YYYYMMDD_{발신}_{수신}_{내용}.md`

## 월별 폴더 필수
- 파일 생성 시 해당 월 폴더(`2026-MM/`)에 배치. 루트 생성 금지.
- 폴더 없으면 `mkdir -p`로 생성 후 배치.

## YAML frontmatter 필수
```yaml
---
type: session_log | completion | report | order
date: YYYY-MM-DD
device: {디바이스}
agent: {에이전트}
status: 진행 | 마감
---
```

## 완료 보고 형식
- `✅❌💡⏳📁🔀` 형식. 보고가 세션 마지막 출력.

> 상세: governance/laws/ch3_session_log.md, ch4_docs_structure.md
