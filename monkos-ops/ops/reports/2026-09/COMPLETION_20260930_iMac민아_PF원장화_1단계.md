---
type: completion
date: 2026-09-30
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "PF 원장화 1단계 — pf.sh CLI + 자동 링크 훅 + Stop 경고 + CI C15"
order: "작가님 직접 지시 (경로③, 09-30 15:30 '제안대로 실행해') — ch1 2조 5항 범위 초과 [예외] (도구·훅·CI 신설, 규정 계층 변경). 쌍아 사후 추인 대상"
design: monkos-ops/tech/designs/2026-09/DESIGN_20260930_PF원장화_pf_ledger.md
---

# COMPLETION — PF 원장화 1단계

**[2026-09-30 15:30 KST]** iMac/민아 → 작가님 · 쌍아

## ✅ 완료
- **`scripts/pf.py` + `pf.sh`**: `append`(히스토리 표 앵커·날짜 형식 자동 일치·산출물 상대 링크·`|` 이스케이프·중복 거부·500줄 경고) / `query`(status·stale·since 필터, `--json`) / `check`(portfolio: 문서 ↔ PF 링크 대조, `--strict`) / `show`. 표준 라이브러리만.
- **`hooks/pf_autolink.py`** (PostToolUse Write): reports·orders·incidents·proposals·designs·specs 신규 문서의 `portfolio:` → PF 히스토리 자동 어펜드(주체=frontmatter device/agent, 상태=type별). 이미 링크면 무동작, 에이전트에 통지.
- **`hooks/stop_check.py`** (Stop): 오늘 portfolio: 문서 PF 미링크 목록 + 세션 로그 2h 신선도 경고. 집행 코드화 E11 겸.
- **CI C15** governance-check.yml: `pf.py check --days 3` 경고 전용.
- **규칙**: `rules/pf-ops.md` 원장 도구 절(수동 행 삽입 금지·자동 링크 문서 수동 불요) · `references.md` 도구 맵 등재.
- **스모크** `scripts/hooks/smoke_pf.py` **17/17** (append 형식·위치·링크·중복·부재 / query·show / autolink 추가·중복·비대상 / check 정상·누락 strict / stop 경고·재진입).
- **실레포**: `check --days 3` → 5/5 링크. `query --status active --stale 30` → **활성 PF 20건 30일+ 무갱신** 첫 가시화(PF_RND 159일, PF_PRESENTATION 136일 …).
- **dogfood**: 설계서 Write 직후 자동 링크 훅이 라이브 발화 → 이어진 수동 `pf.sh append`를 pf.py가 중복으로 거부(rc 2). 본 COMPLETION도 훅이 자동 링크(수동 어펜드 없음).

## ❌ 미완·범위 밖
- 2단계 파생 뷰(STATUS.md·인덱스 자동 갱신·Phase 계산), 3단계 C15 strict·3자 대조, 4단계 ledger.jsonl·retrieval 연동 — 부서제 시범 Week 1·2.
- CI C15는 mtime 기준이라 체크아웃 직후 전 파일이 '최근'으로 잡힘 → 경고 전용 유지, 3단계에서 git diff 기준으로 교체.
- 4060·웹 컨테이너 실행 미실측(표준 라이브러리만이라 python3 존재면 동작).

## 💡 발견
- 히스토리 표 헤더는 40 PF 전부 동일해 앵커로 충분했으나 **날짜 형식이 2종**(MM/DD 39 · YYYY-MM-DD 1)이라 도구가 PF별로 맞춘다. 2단계 파생 뷰 전에 형식 통일(ISO) 결정 필요.
- 30일+ 정체 20건은 "PF 남발 경계"(06-18 작가님)의 실측 근거 — paused/completed 전환 결정 항목.

## ⏳ 후속
1. 쌍아 추인 REVIEW (집행 코드화 COMPLETION과 일괄).
2. ch4 9조 본문에 `pf.sh` 경유·자동 링크 조항 동기(쌍아).
3. 정체 PF 20건 처분 결정(작가님) → `pf.py query --stale 30 --json` 목록 첨부 가능.
4. 2단계 지시서(쌍아): `pf.py status --write` + weekly-dashboard 편입 + 날짜 형식 ISO 통일.

## 📁 변경 파일
- 신규: `scripts/pf.py` `scripts/pf.sh` `scripts/hooks/pf_autolink.py` `scripts/hooks/stop_check.py` `scripts/hooks/smoke_pf.py` `monkos-ops/tech/designs/2026-09/DESIGN_20260930_PF원장화_pf_ledger.md`
- 수정: `.claude/settings.json`(PostToolUse·Stop) `.claude/rules/pf-ops.md` `.claude/rules/references.md` `.github/workflows/governance-check.yml`(C15) `PF_MONK_OS/README.md`(자동 링크 2 + 수동 1)

## 🔀 커밋
- `[ops] PF 원장화 1단계` 1건 (도구·훅·CI·규칙·설계·COMPLETION·세션로그). 푸시는 마감 게이트.
