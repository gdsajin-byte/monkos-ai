---
type: order
date: 2026-05-15
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: ~
---

# 지시서: PF(포트폴리오) 폴더 구조 정리 + 현행화

## 목적

`monkos-ops/ops/portfolios/` 내 PF 문서들이 폴더/루트에 혼재되어 있다. ch4 9조(PF 운용 규칙)에 따라 일관된 구조로 정리하고, 비대화·방치된 PF를 현행화한다.

## 현황 분석

### 1단계: 전수 조사

아래 항목을 분석하여 보고:

| PF | 물리 형태 | status | 마지막 갱신 | 히스토리 행 수 | 500줄 초과? | 비고 |
|----|----------|--------|-----------|-------------|-----------|------|

전체 PF 목록 (현재 21개):

**폴더 있음 (10):** PF_AUTOPILOT, PF_CDP, PF_CHATBOT, PF_DOCS, PF_FACTORY, PF_MONK_OS, PF_MUSE, PF_RND, PF_SECURITY, PF_SPREAD

**루트 md만 (11):** PF_BRIEF, PF_CITADEL, PF_CROP, PF_EVENT, PF_PHOTOPRO, PF_PORTAL, PF_PRESENTATION, PF_PROFILES, PF_STUDIO, PF_TEMPLATE, PF_VIDEO

**양쪽 중복 (3):** PF_CDP (폴더 + PF_CDP.md), PF_FACTORY (폴더 + PF_FACTORY.md), PF_MUSE (폴더 + PF_MUSE.md)

### 2단계: 구조 통일

**통일 규칙:**
- 모든 PF는 `PF_{코드네임}/` 폴더 구조로 통일
- 메인 문서는 `PF_{코드네임}/README.md` (폴더 내)
- 루트에 뒹구는 `.md`는 해당 폴더로 이동 후 `README.md`로 rename
- 부속 문서(research/, proposals/ 등)는 폴더 내 하위 디렉토리

**작업:**

1. **루트 md만 있는 11개:** 폴더 생성 → md를 `README.md`로 이동
   ```
   PF_BRIEF.md → PF_BRIEF/README.md
   PF_CITADEL.md → PF_CITADEL/README.md
   PF_CROP.md → PF_CROP/README.md
   ... (11개 전부)
   ```

2. **양쪽 중복 3개:** 루트 md를 폴더 내 `README.md`로 이동 (기존 폴더 내 파일 유지)
   ```
   PF_CDP.md → PF_CDP/README.md (기존 PF_CDP/ 폴더 내 파일 보존)
   PF_FACTORY.md → PF_FACTORY/README.md
   PF_MUSE.md → PF_MUSE/README.md
   ```
   ※ 폴더 내에 이미 README.md가 있으면 내용 비교 후 병합 또는 루트 md가 정본이면 덮어쓰기

3. **이미 폴더 구조인 10개:** README.md 존재 여부 확인. 없으면 생성 필요 여부 판단

### 3단계: 현행화 점검

각 PF에 대해:

1. **YAML frontmatter 필수 필드** 확인 (ch4 9조):
   ```yaml
   type: portfolio
   id: PF_{코드네임}
   name: "{코드네임}"
   subject: "{한 줄 요약}"
   owner: 작가님
   leads: "{에이전트}({역할})"
   status: draft | active | blocked | paused | completed
   ```

2. **status 현행화**: 마지막 갱신 1개월+ 방치 → `paused` 검토 대상으로 보고
3. **히스토리 500줄 초과**: 아카이브 트리거 대상 보고 (ch4 9조)
4. **README.md 인덱스** (`portfolios/README.md`) 갱신: 전체 PF 1행 요약 테이블 갱신

### 4단계: PF_TEMPLATE 활용

`PF_TEMPLATE.md`가 존재하는데, 이것이 신규 PF 생성 시 템플릿으로 쓰이는지 확인. 맞다면 폴더 구조에 맞게 `PF_TEMPLATE/README.md`로 이동하되, 내용은 템플릿 역할 유지.

## 산출물

1. 정리된 폴더 구조 (git mv 사용)
2. `monkos-ops/ops/reports/2026-05/COMPLETION_20260515_막내1_PF폴더구조정리.md`

### 보고서 형식

```markdown
## 분석 결과
| PF | 이전 위치 | 이후 위치 | status | 마지막 갱신 | 비고 |
|----|----------|----------|--------|-----------|------|

## 현행화 대상
| PF | 이슈 | 조치 |
|----|------|------|

## 500줄 초과 (아카이브 검토)
| PF | 행 수 |
|----|-------|

## README.md 인덱스 갱신 내역
```

## ⚠️ 준수 조항

- **파일 이동은 `git mv` 사용** (히스토리 보존)
- PF 내용 수정은 YAML frontmatter + status만. 히스토리/본문은 건드리지 않음
- 삭제 금지 — 이동만
- 완료 후 COMPLETION 보고
