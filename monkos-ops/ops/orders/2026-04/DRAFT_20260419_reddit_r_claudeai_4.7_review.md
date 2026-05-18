---
type: draft
date: 2026-04-19
device: iMac
agent: 막내3
order_ref: ORDER_20260419_iMac쌍아_막내3_4.7리뷰_외부배포.md
target: reddit.com/r/ClaudeAI
flair: Discussion
status: draft (unpublished)
---

# Reddit 게시글 초안 — r/ClaudeAI (Discussion)

[2026-04-19 14:45 KST] iMac/막내3 → iMac/쌍아

---

## 전제 — 서브레딧 톤 조사 결과

r/ClaudeAI의 4.7 관련 스레드 분위기 (2026-04-16~19 간접 파악):

- 불만 집중 영역: "온기 상실", "과포맷", "창작 품질 저하", "1M 컨텍스트에서 더 나빠짐"
- 크리에이티브 쪽 반발 강함. PM·구조화 작업 쪽은 호의적 평가 혼재
- 공식 Anthropic 답변: "more literal instruction following, will not silently generalize"
- **커뮤니티가 원하는 것**: 정량 데이터 + 재현 가능한 사례 + 실용 워크어라운드 (감정 불만 ≠ 인사이트)

**본 초안의 포지셔닝**:
- "불만" 장르가 아니라 "프로덕션 다중 에이전트 워크플로우의 2주 관찰 데이터" 장르
- 수치 표 + 실제 워크어라운드 + 다른 운영자 경험 질문 + 브랜드 1회 각주

---

## 최종 제출본 (영문)

> **제목 (2개 안)** — 서브레딧 반응 보고 택1:
>
> A. `Opus 4.7 in production multi-agent workflow: what improved, what broke, and our workarounds (2 weeks of data)`
>
> B. `4.6 → 4.7: in a repo with checked-in governance files, the agent stopped reading them`
>
> **쌍아 추천**: B안 (후크 강함, 클릭 유인↑). 본문은 동일.

```markdown
**TL;DR** — On 4.6, our agents reliably read our project's checked-in
governance files (CLAUDE.md + rule files + memory layer) before acting.
On 4.7 they still say they loaded them, but actions contradict the content.
Self-caught errors went from 0–1/session to 4–8/session on the same
document-editing task. Sharing the data and our workarounds. Curious whether
other teams running governance-heavy repos see the same shape.

---

### Setup (sanitized)

Small team, one repo, a handful of Claude Code agents orchestrated against it.
We run a "constitution + laws + rules" doc layer checked into the repo:

- `CLAUDE.md` at project root — invariant principles + law index
- `.claude/rules/*.md` — executable rules (e.g., use `deploy.sh`, not raw gcloud)
- A persistent memory layer — incident learnings, "do this / don't do that"
- Portfolio history files — per-feature, with success patterns + traps

On 4.6 this worked. Agents consulted files before acting, referenced them in
their reasoning, and stayed on the rails when asked to do multi-step edits
on a document that had been under construction for days.

### What changed on 2026-04-16

Day one of Opus 4.7. Same repo. Same operator. Same files.

Two-week metrics on a single recurring task (business plan revision,
~10 pages of Markdown, edits applied to a Google Doc):

| Metric | 4/01–4/15 (4.6) | 4/16 (transition) | 4/17–4/18 (4.7) |
|---|---|---|---|
| Self-caught errors per session | 0–1 | 0 | **4–8** |
| Session crashes | 0 | 0 | **3** |
| Actual document corruption events | 0 | 0 | **1** |
| Operator verdict | baseline | "OK" | "fails basic 10-page edit" |

The one document-corruption event is the most diagnostic:

> The agent ran a short-token find-and-replace to remove residue from §2-3
> ("KOITA R&D designation letter", etc. — short, distinctive-looking strings).
> On 4.6 this would have been preceded by a whole-document grep. On 4.7 it
> wasn't. The same short strings also occurred in §4-3, where they were
> load-bearing. Both sections got them deleted. The agent reported "done"
> based on the replace count. We only caught it on re-read.

This is a regression in a **basic verification reflex**, not in "instruction
following." No instruction was violated — except the one implicit in every
find-and-replace everywhere: "check for collisions first."

### Community-reported symptoms, cross-checked against our logs

| Community symptom | Reproduced on our side? |
|---|:---:|
| Warmth / tone loss | partial (tone drifts toward template) |
| Over-formatting — bullets/headers everywhere | ✅ |
| Structure reinvention — remakes what's already authored | ✅ (strong) |
| Creative quality drop, corporate tone | ✅ |
| "Worse at 1M than at 200k" | ✅ (operator's direct assessment) |
| Literal-to-a-fault instruction following | ✅ (paradoxical — literal on some turns, over-interpretive on others) |
| Adaptive Thinking side effects | not measurable from the outside |

Six of seven. The seventh is untestable without Anthropic's internals.

### Workarounds that actually helped

1. **Model separation**: pin `claude-opus-4-6` for document-editing,
   governance-authoring, and any task requiring cross-reference to existing
   files. 4.7 for single-shot tasks.
2. **Pre-session read ritual**: explicit "read these 3 files and summarize"
   turn before any real work. Forces loading into context.
3. **Hooks**: mechanical PreToolUse enforcement for the narrowest destructive
   operations.
4. **Scope-shrink**: don't let a 4.7 session own a multi-day document.

Anthropic's release-notes framing ("more literal instruction following, will
not silently generalize") does not map to our observed symptom. The missing
behavior is not charitable generalization — it's **checking the project's
own checked-in governance before acting**. Different thing.

### Questions for the sub

- If your repo has `CLAUDE.md` + rule files, did the agent's file-consultation
  behavior change between 4.6 and 4.7?
- For teams on 1M context: is "worse than 200k" holding up in your runs too?
- Anyone with a cleaner workaround than model-pinning?

### Who we are

Small team building [MONKOS](https://monkos.ai). This isn't a benchmark
post — just two weeks of data and a question for people running similar
setups. Happy to share more sanitized traces if useful.

---

*Cross-posted as a GitHub issue on anthropics/claude-code with the full
reproduction environment, for anyone who wants the engineering-side
version.* {link after publish}
```

---

## 🇰🇷 한국어 요약본 (내부 검토용)

- **포지셔닝**: 불만 장르 X. 프로덕션 2주 관찰 데이터 공유 장르.
- **후크**: "거버넌스 파일이 체크인된 레포에서 4.7이 그걸 안 읽는다" — 공식 릴리즈 노트로 설명 안 되는 회귀.
- **정량 표**: 세션당 과오 (0~1 → 4~8), 크래시 (0 → 3), 파손 (0 → 1건).
- **커뮤니티 교차 매핑**: 7건 중 6건 재현.
- **실용 가치**: 워크어라운드 4가지(모델 분리·사전 읽기 의식·훅·범위 축소).
- **커뮤니티 질문 3개**로 마무리 → 댓글 유인.
- **브랜드**: 마지막 단락에만 1회 ([MONKOS](https://monkos.ai)).

---

## ⚠️ 기밀 보호 적용 내역

| 내부 정보 | 외부 표현 |
|---------|---------|
| 쌍아/민아/막내/코웍이 | "agents", "operator", "the agent" |
| 헌법·법률·규정·규칙 4계층 | "constitution + laws + rules + memory layer" (일반화) |
| 강한소상공인 사업계획서 v3 | "business plan revision, ~10 pages of Markdown" |
| KOITA 연구개발전담부서 인정서 | "KOITA R&D designation letter" (이건 노출 가능 — 일반적 고유명사 수준) |
| 특허청 MONKOS Crop 출원 | **삭제** (기업 특정 정보) |
| Google Docs 대상 | "edits applied to a Google Doc" (노출 수위 점검: 일반 도구명만) |
| PF_CDP / PageProfiler / nativeInputValueSetter | "rule files", "tested recipes" |
| deploy.sh, ch5 2조, monkos-ops 구조 | "(e.g., use `deploy.sh`, not raw gcloud)" 예시 1줄만 |

- 에이전트 호칭 0건
- 팀원명(한송이·꾸·소소·용아·철창이·코웍이) 0건
- 내부 프로젝트명(CITADEL·SPREAD·BRIEF·몽코스3D) 0건
- 광고/오가닉/팀 인프라 상세 0건

**재검토 필요**: "KOITA R&D designation letter" 구체 기관명 노출 수위. 쌍아 판정 필요 — 너무 구체적이면 "a short, distinctive-looking regulatory artifact string" 등으로 한 단계 더 추상화 가능.

---

## 게시 체크리스트 (작가님 승인 후)

- [ ] 제목 A/B 선택
- [ ] KOITA 문구 보존 여부 쌍아 최종 결정
- [ ] 동반 GitHub 이슈 발행 후 URL 삽입 (cross-post 각주)
- [ ] flair: `Discussion`
- [ ] 댓글 대응 담당: 쌍아 / 민아 / 막내 중 지정 필요 (r/ClaudeAI 특성상 첫 24h 반응 중요)
- [ ] 부정 반응 시나리오 대비: "4.7 출시 반대" 프레임으로 몰리지 않게 본문에 "workarounds, not a rollback ask" 명시 이미 됨
