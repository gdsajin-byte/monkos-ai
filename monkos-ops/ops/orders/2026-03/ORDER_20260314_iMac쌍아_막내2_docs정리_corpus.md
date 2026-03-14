---
type: ORDER
date: 2026-03-14
time: "17:00 KST"
from: iMac/쌍아
to: 막내2
subject: docs/ 정리 리서치 — corpus 영역 (세션아카이브·학습데이터)
priority: 일반
endline: 보고 후 대기
---

# 지시: docs/ 정리 리서치 — corpus

## 배경

docs/ 폴더에 555건의 파일이 혼재. corpus/는 세션 아카이브, 학습 데이터, 레거시 백업 등이 섞여 있다.

## 담당 영역

- `docs/corpus/` (bwya, claude_sessions, factory, gemini, legacy, notebookLM, sessions)

## 작업

1. 각 폴더·파일의 내용을 확인하고 아래 기준으로 분류:

| 분류 | 기준 | 이관처 |
|------|------|--------|
| **활성** | 현재 참조 중이거나 학습 데이터로 사용 중 | 현행 체계로 이관 (구체 경로 제안) |
| **세션 정본** | 세션 로그 원본 | `ops/sessions/`로 이관 여부 검토 (이미 정본 있으면 중복) |
| **학습 데이터** | NotebookLM 등 외부 도구용 | 현위치 유지 or 별도 경로 제안 |
| **레거시** | 과거 백업, json 덤프 등 | `docs/archives/`로 이관 |
| **사문화** | 참조도 없고 가치도 낮음 | 삭제 제안 |

2. 특히 확인할 것:
   - `docs/corpus/sessions/` vs `ops/sessions/` — 중복 여부, 어느 쪽이 정본인지
   - `docs/corpus/claude_sessions/` — 철창이 세션 등 웹 UI 산출물이 있는지
   - `docs/corpus/legacy/backup_json/`, `backup_markdown/` — 보존 가치 판단
   - `docs/corpus/notebookLM/` — 현재 사용 중인지

## 산출물

보고서: `monkos-ops/ops/reports/REPORT_20260314_막내2_docs정리_corpus.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 법률 ch7 3조: 리서치만 수행, 실제 이동/삭제 금지
