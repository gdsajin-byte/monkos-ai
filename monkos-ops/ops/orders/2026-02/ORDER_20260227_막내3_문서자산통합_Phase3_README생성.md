---
type: ORDER
date: 2026-02-27
time: "17:07 KST"
from: iMac/쌍아
to: 막내3
task_id: DOC_CONSOLIDATION_P3
priority: P0
depends_on: DOC_CONSOLIDATION_P1
ref:
  - governance/laws/ch4_docs_structure.md
---

# 문서 자산 통합 Phase 3 — README 78건 생성

> **[2026-02-27 17:07 KST] iMac/쌍아 → 막내3**
> Phase 1(infrastructure/ 분류) 완료 후 착수. Phase 2와 병렬 가능.
> ch4 2조 7항 위반(README 미보유 폴더) 전면 해소.

---

## 선행 조건

- **Phase 1 완료 확인** 후 착수 (막내1이 "Phase 1 완료" 선언)
- 착수 전 `git pull` 필수

---

## 작업 내용

### 전수 탐색

프로젝트 전체에서 README.md가 없는 폴더를 탐색:

```bash
find docs/ monkos-ops/ governance/ monkos_AI/ MONK_kr/ apps/ functions/ scripts/ -type d | while read dir; do
  [ ! -f "$dir/README.md" ] && echo "$dir"
done
```

### 우선순위별 생성

**P0 — 핵심 루트 (3건)**
- `docs/infrastructure/README.md` → Phase 1에서 생성됨, 확인만
- `docs/monkos/README.md`
- `docs/rnd_2026/README.md`

**P1 — Phase 1 하위 + monkos/ 하위 (최대 13건)**
- `docs/infrastructure/{architecture,deployment,ai-models,strategy,guides,audit,history}/README.md` → Phase 1에서 생성됨, 확인만
- `docs/monkos/` 하위 폴더들 (photo-studio, chat, coaching 등)

**P2 — monkos-ops/ 하위 (최대 40건)**
- `monkos-ops/ops/`, `monkos-ops/tech/`, `monkos-ops/contents/`, `monkos-ops/marketing/` 및 그 하위

**P3 — 나머지 (최대 22건)**
- `docs/corpus/` 하위
- `governance/` 하위 (constitution, laws, philosophy 등)
- `apps/`, `functions/`, `scripts/` 하위

### README 표준 구조

모든 README.md는 아래 형식을 따른다:

```markdown
---
type: README
date: 2026-02-27
from: 막내3
---

# {폴더명}

> **소관**: {담당 에이전트/팀원}
> **성격**: {정본/운영/아카이브/프로토타입}
> **법적 근거**: {ch4 N조}

## 개요

{이 폴더의 역할 1~2문장}

## 파일 목록

| 파일명 | 설명 | 최종 수정 |
|--------|------|----------|
| file1.md | 설명 | YYYY-MM-DD |
| file2.md | 설명 | YYYY-MM-DD |

## 관련 문서

- [상위 폴더](../README.md)
- [관련 참조](경로)
```

### 작성 원칙

1. **파일 내용을 반드시 읽고** 설명 작성 (파일명만 보고 추측 금지)
2. 빈 폴더(파일 0건)는 README에 "현재 비어있음. 용도: ..." 기재
3. 하위 폴더가 있으면 하위 폴더 테이블도 추가
4. Phase 1에서 이미 생성된 README는 **덮어쓰지 않음** — 확인만 하고 SKIP 보고

---

## ⚠️ 준수 조항

- **ch4 2조 7항**: "README.md 미보유 폴더 금지" — 본 작업의 법적 근거
- **ch4 3조**: 파일 네이밍 규칙 (README.md는 예외, 대문자 허용)
- **헌법 13조**: YAML frontmatter 필수 (type, date 최소)
- Phase 1 산출물 **절대 덮어쓰지 않음**

---

## 완료 조건

| # | 조건 | 검증 |
|---|------|------|
| 1 | README 미보유 폴더 0건 | find 스크립트 확인 |
| 2 | 모든 README에 YAML frontmatter 존재 | grep 확인 |
| 3 | 모든 README에 파일 목록 테이블 존재 | grep 확인 |
| 4 | Phase 1 README 7건 무변경 | git diff 확인 |

---

## 산출물 보고 형식

```
## README 생성 보고

| # | 경로 | 파일 수 | 비고 |
|---|------|---------|------|
| 1 | docs/monkos/README.md | 12 | 신규 |
| 2 | docs/monkos/photo-studio/README.md | 5 | 신규 |
| ... |
| N | docs/infrastructure/architecture/README.md | 8 | Phase 1 확인 (SKIP) |

**총 생성**: N건 / **SKIP**: M건 / **미보유 잔존**: 0건
```

---

## 커밋 규칙

- 커밋 메시지: `[docs] 문서자산통합 Phase 3 — README {N}건 생성 (ch4 2조 7항 정비)`
- 커밋 후 push 승인 요청
