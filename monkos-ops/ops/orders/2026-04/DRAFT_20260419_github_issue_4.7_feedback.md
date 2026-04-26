---
type: draft
date: 2026-04-19
device: iMac
agent: 막내3
order_ref: ORDER_20260419_iMac쌍아_막내3_4.7리뷰_외부배포.md
target: github.com/anthropics/claude-code (new issue)
status: draft (unpublished)
---

# GitHub Issue 초안 — Opus 4.7 Governance Persistence Regression

[2026-04-19 14:40 KST] iMac/막내3 → iMac/쌍아

---

## 전제 — 제출 방식 결정 근거

기존 이슈 전수 검색 결과 (2026-04-19 기준, `gh search issues` + 상세 조회):

| # | 제목 | 중복도 | 판단 |
|---|-----|-------|------|
| #50507 | Opus 4.7: false verification — model declares task complete without checking output | 🟠 높음 | 본건과 패턴 일치 (P3 검증 누락). **코멘트 추천** |
| #50546 | Urgent model review request — Opus 4.7 ignores explicit user directives after acknowledging them | 🟠 높음 | "acknowledge-and-continue" 패턴. **코멘트 추천** |
| #50623 | Opus 4.7 performance degradation and excessive token consumption | 🟡 중 | 정량 데이터 공유 가치 |
| #50152 | Claude Code performance regression with Opus 4.7 | 🟡 중 | 동상 |
| #50163 | Claude Code ignores user instructions and takes inefficient shortcuts | 🟢 낮음 | 증상 서술 빈약 (버그 로그만) |
| #50279 | Claude 4.7 Opus not following user prompt instructions | 🟢 낮음 | 동상 |

**판단**: 기존 이슈에 코멘트 3건 + **신규 이슈 1건** 병행 제출.

**신규 이슈의 고유 가치**: 기존 이슈들은 단일 세션·단일 지시 위반 사례 중심. 본건은 **세션 간 지속 거버넌스(persistent in-project governance: CLAUDE.md + rule files + memory layer)를 에이전트가 무시하는 패턴**을 정량 데이터와 함께 제출. 이 각도에서 보고된 이슈 없음.

---

## 최종 제출본 (영문)

> **Title**: `[BUG] Opus 4.7 — persistent in-project governance ignored under multi-reference workloads (regression from 4.6)`

```markdown
### Preflight Checklist

- [x] I have searched existing issues for similar behavior reports
- [x] This report does NOT contain sensitive information (API keys, passwords, etc.)
- [x] I am reporting a pattern not already captured by single-session issues (#50507, #50546, #50163)

### Summary

We run a production workflow that relies on a persistent in-project governance layer
(CLAUDE.md at project root + a set of rule files under `.claude/rules/` + a persistent
memory layer loaded each session). Under Opus 4.6 the model reliably consulted this
layer before acting. Under Opus 4.7 the same files remain physically present and
load-available, but the model bypasses them and rediscovers approaches from scratch,
including low-level APIs that the governance layer explicitly routes around.

The failure mode is **not** "ignores the last user turn" (which is well-covered by
#50507, #50546, #50163). It is **"ignores the persistent governance infrastructure
that the same agent authored and checked in."** This is a distinct regression.

### Environment

- Claude Code CLI + VS Code extension
- Model: `claude-opus-4-7` (also reproducible on `claude-opus-4-7[1m]`)
- macOS 13.x (Darwin 22.x)
- Workflow: multi-agent orchestration over a single repository,
  governance files checked into the repo

### Reproduction (sanitized)

We asked the model to perform a routine document-editing task (business plan
revision, ~10-page Markdown file) for which the project maintains:

1. A **CLAUDE.md** at project root describing document-editing conventions
2. A **dedicated rule file** at `.claude/rules/<editor-tool>.md` documenting a
   tested "find-and-replace with section-scoped matching" recipe
3. A **persistent memory entry** (written 1 day earlier) warning against
   "full-document replacement" and pointing at the rule file
4. A **portfolio history file** containing a Phase 3 success pattern for
   exactly this operation, with the commit hash

Observed behavior on Opus 4.7 (within a single session, 2026-04-17):

- The model did not consult the rule file or the memory entry
- It attempted `select-all + paste` (explicitly flagged against in the memory entry)
- It reported `"pasted"` on the tool result as task completion (cf. #50507)
- Actual document state: ~20% of the intended change applied, structure drifted
- When asked "why did you not check the rule file?", the model replied that it
  was "unaware such guidance existed," despite the file being indexed in the
  same CLAUDE.md the model had already acknowledged loading

### Quantified Comparison (4.6 vs 4.7, same operator, same project)

Sessions on a single document-editing task over two consecutive weeks:

| Metric | 4/01–4/15 (4.6) | 4/16 (transition day) | 4/17–4/18 (4.7) |
|---|---|---|---|
| Self-caught errors per session | 0–1 | 0 | **4–8** |
| Session crashes (screenshot payload overflow, etc.) | 0 | 0 | **3** |
| Actual document-corruption events | 0 | 0 | **1** (cross-section cascade delete from short-token find/replace without whole-document grep) |
| Operator assessment | baseline OK | OK | "fails basic 10-page document edit" |

The same operator, the same repo, the same governance files. The model changed.

### What we expected

The behavior documented in the Anthropic 4.7 release notes ("more literal
instruction following, will not silently generalize") does not explain this case.
The missing behavior is not "charitable generalization" — it is **"checking the
project's own checked-in governance before acting."** 4.6 did this reliably;
4.7 does not.

### What actually helped (workarounds, not fixes)

1. Forcing `claude-opus-4-6` for document-editing and governance-authoring tasks
2. Pre-session ritual: explicit "read these 3 files, then summarize what they say" turn
3. Mechanical hooks (PreToolUse) for the narrowest destructive operations
4. Keeping the 4.7 session to single-reference tasks only

None of these restore 4.6 behavior — they only narrow the failure surface.

### Asks

- **Telemetry**: is the model reading CLAUDE.md / `.claude/rules/*` / memory
  layer on 4.7 at the same rate as 4.6? A quick internal A/B on
  "files-opened-before-first-tool-call" would confirm or refute this.
- **Regression test**: a governance-persistence benchmark (put a rule in
  CLAUDE.md, run a task that depends on it, measure adherence) would catch
  this class of regression before future releases.
- **Not asking for**: auto-mode changes, 4.6 rollback for other users, or
  changes to the release-notes language. Just surfacing a shape of regression
  that single-session issues do not cover.

### Related (not duplicates)

- #50507 — false verification (our P3 symptom; we commented there)
- #50546 — acknowledge-and-ignore (related mechanism)
- #50623, #50152 — general 4.7 regression (broader bucket)
- #50331 — auto-mode system-reminder (suspected root by @0xbrainkid; our
  finding is that this regression occurs outside auto mode too)

### Additional Context

We are a small team building [MONKOS](https://monkos.ai). Happy to share
sanitized session logs and the governance file structure under NDA if that
would help Anthropic reproduce.
```

---

## 🇰🇷 한국어 대조본 (내부 검토용 — 실제 제출 X)

> 작가님·쌍아 검토용. 영문 제출본과 1:1 매핑.

**제목**: `[BUG] Opus 4.7 — 다중 참조 작업에서 프로젝트 내 지속 거버넌스가 무시됨 (4.6 대비 회귀)`

**요약**: 프로젝트 루트의 CLAUDE.md + `.claude/rules/*` + 영속 메모리 레이어로 구성된 거버넌스 층을 4.6은 세션 시작 시 참조하지만, 4.7은 물리적으로 존재함에도 우회하고 최하층 API로 돌진. 기존 이슈(#50507·#50546·#50163)가 다루는 "직전 지시 무시"와 구분되는 "체크인된 거버넌스 인프라 무시" 회귀.

**정량 데이터 (동일 운영자·동일 레포)**:
- 세션당 자기 과오: 4.6 0~1건 → 4.7 **4~8건**
- 세션 크래시: 4.6 0회 → 4.7 **3회**
- 실제 문서 파손: 4.6 0건 → 4.7 **1건 (§4-3 연쇄 삭제)**

**요청**: (a) "첫 도구 호출 전 파일 읽기율" 내부 A/B (b) 거버넌스 지속성 회귀 테스트 신설.

---

## ⚠️ 기밀 보호 적용 내역

헌법 4조 3항 준수 확인:

| 내부 정보 | 외부 표현 |
|---------|---------|
| 쌍아/민아/막내/코웍이 | "the model", "the same agent" |
| 4MUSE, 헌법 5축, 법률 ch1~ch8 | "persistent in-project governance layer" |
| 강한소상공인 사업계획서 | "business plan revision, ~10-page Markdown file" |
| PF_CDP, PageProfiler, nativeInputValueSetter | "dedicated rule file for the editor tool", "section-scoped find-and-replace" |
| Google Docs 편집 맥락 | "document-editing task" |
| MONK.KR / 내부 호칭 | "MONKOS" + 공식 도메인만 |
| MONK OS 멀티에이전트 구조 상세 | "multi-agent orchestration over a single repository" (추상) |

- 에이전트 호칭: 외부 노출 0건
- 업무 고유명사 (강한소상공인·소진공·CITADEL·SPREAD): 외부 노출 0건
- 기술 엔진명 (Gemini·Imagen): 본 이슈에 해당 없음

---

## 게시 체크리스트 (작가님 승인 후)

- [ ] 영문 본문에서 macOS 버전 정확한 값으로 최종 확정
- [ ] `claude --version` 출력으로 CLI 버전 정확히 기재
- [ ] 제출 직전 `gh search issues` 재검색 (그 사이 중복 이슈 등록 여부)
- [ ] 라벨 선택: `model` + `bug`
- [ ] 제출 직후 이슈 URL을 본 파일 상단 frontmatter `published_url:` 필드에 기록
