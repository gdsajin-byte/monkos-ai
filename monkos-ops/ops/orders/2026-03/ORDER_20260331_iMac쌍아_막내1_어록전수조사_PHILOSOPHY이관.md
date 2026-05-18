---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-31
priority: 🟡 P2
subject: PHILOSOPHY.md 기존 어록 → APH 개별 파일 이관 + 구조 분석
related: PROPOSAL_20260331_Aphorisms_어록체계_기안서.md
---

# 지시서: PHILOSOPHY.md 어록 → APH 파일 이관

**[2026-03-31 12:31 KST] iMac/쌍아 → 막내1**

---

## 배경

`governance/philosophy/PHILOSOPHY.md`에 977줄, 3개 시대(레거시/위드쌍아/위드용아)로 어록이 이미 수집되어 있다. 이를 민아 기안 APH 체계(`governance/philosophy/aphorisms/`)로 이관한다.

---

## 작업 1: PHILOSOPHY.md 전수 분석

### 1-1. 전체 어록 카운트 및 목록 작성

PHILOSOPHY.md를 읽어 모든 어록을 목록화:

| # | 날짜 | 원문 (첫 30자) | speaker | 태그 | 시대 구분 |
|---|------|--------------|---------|------|---------|

### 1-2. 시대별 건수 집계

- I. 레거시 시대 (~2025.12): N건
- II. 위드 쌍아 시대 (2026.01~): N건
- III. 위드 용아 시대: N건

---

## 작업 2: APH 파일 이관

### 파일 생성 규칙

- 위치: `governance/philosophy/aphorisms/`
- 네이밍: `APH_YYYYMMDD_키워드.md`
- 날짜가 `~2025-12` 등 불확실한 경우: `APH_20251200_키워드.md` (일자 00으로)

### 파일 내부 구조

```yaml
---
type: APH
date: YYYY-MM-DD
speaker: 작가님 | 에이전트명 | 공동
session: 출처 세션/문서
tags: [태그1, 태그2]
migrated_from: PHILOSOPHY.md
---

> "어록 원문"

## 맥락

(PHILOSOPHY.md의 '맥락' 항목 그대로 이관)

## 해석

(PHILOSOPHY.md의 '해석' 항목 그대로 이관)

## 활용 가능성

- (해당 시 기재, 없으면 생략)
```

### 이관 원칙

- **원문 가감 절대 금지** — PHILOSOPHY.md 텍스트를 그대로 옮길 것
- **맥락/해석도 원본 유지** — 재해석하거나 윤색하지 말 것
- 태그는 PHILOSOPHY.md의 기존 태그 그대로 유지
- 키워드는 어록의 핵심 테마를 간결하게 (한영 혼용 가능)
- 같은 날짜에 여러 어록이면 키워드로 구분

---

## 작업 3: indexes/ 현행화

`governance/philosophy/indexes/` 디렉토리에 기존 인덱스 파일이 있다:
- `by_constitution.md` — 헌법 조항별 인덱스
- `by_tag.md` — 태그별 인덱스

이관 완료 후 이 인덱스들이 새 APH 파일 경로를 가리키도록 갱신.

---

## 작업 4: PHILOSOPHY.md 처리

이관 완료 후 PHILOSOPHY.md 상단에 리다이렉트 노트 추가:

```markdown
> ⚠️ 본 문서의 어록은 `governance/philosophy/aphorisms/` APH 개별 파일로 이관 완료.
> 본 문서는 읽기전용 아카이브. 신규 어록은 APH 파일로 직접 기재.
> 이관일: 2026-03-31
```

**PHILOSOPHY.md 원본 삭제 금지** — 아카이브로 유지 (정본 단일 원칙: APH 파일이 정본, PHILOSOPHY.md는 참조본)

---

## ⚠️ 준수 조항

- 헌법 제3조 4항: 정본 단일 원칙 — APH 파일이 정본
- 헌법 제4조 2항: PHILOSOPHY.md 삭제 금지
- 원문 가감 금지 (작가님 발화 원본 보존)

## 완료 기준

- [ ] PHILOSOPHY.md 전수 분석 — 어록 총 건수 보고
- [ ] APH 파일 전건 생성
- [ ] indexes/ 갱신
- [ ] PHILOSOPHY.md 리다이렉트 노트
- [ ] 완료 보고 (`✅❌💡⏳📁🔀`)
