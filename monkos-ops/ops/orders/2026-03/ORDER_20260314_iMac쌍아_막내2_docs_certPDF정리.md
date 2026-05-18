---
type: ORDER
date: 2026-03-14
time: "17:08 KST"
from: iMac/쌍아
to: 막내2
subject: docs/corpus/certifications/ PDF 정리 — 중복 삭제 + md 추출 + 로컬 이관
priority: 일반
endline: 보고 후 대기
---

# 지시: certifications/ PDF 정리

## 배경

너의 리서치 보고에서 certifications/ PDF가 58MB (레포의 85%)를 차지하고, 중복 8건(19.5MB)이 확인되었다. Git에서 바이너리 부담을 줄인다.

## 작업

### 1. 중복 PDF 삭제

`(1)`, `(2)`, `(3)` 접미어 파일을 삭제. 원본만 보존:

- `C-SECWAI-B-m3-l2-ko-file-11.ko (1).pdf` — 삭제 ((2), (3)도)
- `how-ai-can-reverse-defenders-dilemma (1).pdf` — 삭제
- `google_secure_ai_framework_approach (1).pdf` — 삭제
- `T-RESPAIFB-I-4-l2-ko-file-18.ko (1).pdf` — 삭제
- `T-RESPAIFB-I-4-l3-ko-file-19.ko (1).pdf` — 삭제
- `T-RESPAIPS-I-m4-l4-ko-file-23.ko (1).pdf` — 삭제

삭제 전 원본과 바이트 크기가 동일한지 확인할 것.

### 2. PDF → md 텍스트 추출

고유 PDF (~17건)에서 텍스트를 추출하여 md 파일로 변환:
- 저장 경로: `docs/corpus/claude_sessions/certifications/` (같은 폴더)
- 파일명: 원본 PDF명에서 `.pdf` → `.md`로 변환
- 내용: PDF 텍스트 추출 (Read 도구로 PDF 읽기 가능). frontmatter 추가:

```yaml
---
type: extracted
source: {원본 PDF 파일명}
date: 2026-03-14
---
```

### 3. PDF 원본 로컬 이관

- md 추출 완료 후, PDF 원본을 `~/Desktop/철창이/docs/certifications/`로 복사
- 복사 확인 후 Git에서 PDF 삭제 (`git rm`)

### 4. 커밋

단일 커밋:
```
[docs] certifications PDF 정리 — 중복 삭제 + md 추출 + 로컬 이관
```

커밋 후 push 진행.

## 산출물

완료 보고: `monkos-ops/ops/reports/COMPLETION_20260314_막내2_{HHMMSS}.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 헌법 제4조: PDF 삭제 전 반드시 로컬 복사 확인
- 복사 실패 시 삭제 중단 → 보고
