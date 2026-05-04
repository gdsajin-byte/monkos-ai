---
name: PF_DOCS
description: 문서 편집 체계 — 포맷별 에디터 세팅 + 파이프라인 + 도구 추적
created: 2026-05-04
status: Phase 1 (개설)
---

# PF_DOCS — 문서 편집 체계

> 문서를 만들고, 읽고, 수정하는 전 과정의 도구·파이프라인·교훈을 관리한다.

## 대상 포맷

| 포맷 | 에디터/도구 | 현재 상태 |
|------|-----------|----------|
| **Google Docs** | Google Docs MCP + python-docx 생성 | 읽기 O, 직접 수정 X (금지), 로컬 생성→업로드 |
| **DOCX** | python-docx (v1.2.0) | 생성·편집 자유 |
| **PDF** | 미정 | 조사 필요 |
| **HWP** | 미정 | 조사 필요 (정부 서식 제출용) |
| **Markdown** | 직접 편집 | 완전 지원 |

## 핵심 파이프라인 (2026-05-04 확립)

```
[생성] python-docx 로컬 작성
  → [업로드] Google Drive에 새 문서로 업로드
  → [확인] 작가님 브라우저에서 시각 확인
  → [반영] 복사-붙여넣기로 기존 문서에 적용
```

### 금지 사항
- Google Docs MCP의 deleteRange + insertText/insertTable로 기존 문서 직접 수정 금지
- 인덱스 기반 셀 편집 금지 (원본 손상 위험 — 2026-05-04 v8 §4-2 사고)

### 허용 사항
- Google Docs MCP readGoogleDoc: 읽기 전용 — 내용 확인·인덱스 파악용
- python-docx: 로컬 문서 생성·편집 — 표·서식·병합 자유
- Google Drive MCP: 업로드·검색

## 포맷 간 관계

```
DOCX ←→ Google Docs : 업로드 시 자동 변환, 복사-붙여넣기로 이동
DOCX ←→ PDF        : python-docx → PDF 변환 (libreoffice 등)
HWP  ←→ DOCX       : 조사 필요 (한컴 CLI 변환 도구)
MD   ←→ DOCX       : pandoc 변환 가능
```

## 블로그 에디터와의 접점
- MONK_kr 블로그 에디터 (블록 에디터 기안서: `monkos-ops/ops/proposals/PROPOSAL_20260316_블록에디터통합_기안서.md`)
- 마크다운 → HTML 변환 파이프라인과 공유 가능
- 표 생성 로직 재사용 가능

## 도구 추적

### 현재 사용 중
- `python-docx` v1.2.0 — DOCX 생성/편집
- `mcp__google-docs__*` — Google Docs 읽기 + Sheets
- `mcp__claude_ai_Google_Drive__*` — Drive 파일 관리

### 추적 대상 (향후 도입 검토)
- Claude Code 플러그인 마켓플레이스 — 문서 편집 플러그인 등장 여부
- Google Docs MCP 업데이트 — 셀 병합, 행 삭제 등 기능 추가 여부
- `python-pptx` — 프레젠테이션 (PT용)
- `pyhwp` / `hwp5` — HWP 읽기/쓰기
- `reportlab` / `fpdf2` — PDF 생성
- `pandoc` — 포맷 간 변환 허브

## 히스토리

| 날짜 | 내용 |
|------|------|
| 2026-05-04 | PF 개설. Google Docs 직접 수정 금지 원칙 확립 (v8 §4-2 원본 손상 사고) |
