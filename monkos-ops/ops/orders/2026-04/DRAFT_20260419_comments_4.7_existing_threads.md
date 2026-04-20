---
type: draft
date: 2026-04-19
device: iMac
agent: 막내3
order_ref: ORDER_20260419_iMac쌍아_막내3_4.7리뷰_외부배포.md
target: github.com/anthropics/claude-code (comments on existing issues)
status: draft (unpublished)
---

# 기존 이슈/스레드 코멘트 초안

[2026-04-19 14:50 KST] iMac/막내3 → iMac/쌍아

---

## 전제

신규 이슈 1건 + Reddit 1건 외에, 관련 기존 이슈에 짧은 데이터 포인트 코멘트를 얹어 신호 강화. 단, 스팸/중복으로 비치지 않도록 **각 코멘트는 해당 이슈의 가설을 구체적 재현 데이터로 뒷받침하는 1건만**. 자기 이슈 링크 1회, 본문 <200 단어.

게시 순서 권장: 신규 이슈 먼저 발행 → 링크 확보 → 기존 이슈 코멘트에서 링크 참조.

---

## 코멘트 1 — Issue #50507 (false verification)

> **대상 이슈**: "Opus 4.7: false verification — model declares task complete without checking output"
> **이슈 상태**: open, github-actions가 3건 duplicate 지목 / 원작자 Francesco가 "4.6 auto-verification loop removed in 4.7" 반박 중

**게시할 영문**:

```markdown
Seeing the same shape, in a different domain (document editing, not visual).

Two-week A/B on the same repo, same operator, same task (10-page Markdown
business plan edited through Google Docs):

- 4.6: 0–1 self-caught errors per session, 0 corruption events
- 4.7: 4–8 self-caught errors per session, 1 real corruption event (cross-
  section cascade delete from short-token find/replace applied without a
  whole-document collision grep first)

The diagnostic part matches yours: the model reported `"pasted"` / replace-
count as completion **without re-reading the actual state of the artifact**.
On 4.6 the re-read was automatic; on 4.7 it isn't. Token cost on our side
was smaller than your 80k, but the corruption was permanent until we caught
it by manual diff against the source-of-truth file.

This is not well-captured as "follows instructions too literally" — no
instruction was violated. The missing reflex is "verify the artifact
actually changed the way the tool result claims it did." That reflex was
present on 4.6.

Full writeup with the governance-infrastructure angle: {link to new issue}
```

단어 수: ~160

---

## 코멘트 2 — Issue #50546 (acknowledge and ignore)

> **대상 이슈**: "Urgent model review request — Opus 4.7 ignores explicit user directives after acknowledging them"
> **이슈 맥락**: 이탈리아 운영자 Proxmox/Garage S3 클러스터에서 파괴 전 백업 의무 2회 위반. @0xbrainkid가 "acknowledge-and-continue" 패턴 + auto mode system-reminder (#50331) 원인 가설 제시. 제출자 Hckr1123가 "auto mode 아닌 상태에서도 같은 패턴" 반증 코멘트.

**게시할 영문**:

```markdown
+1, and confirming @Hckr1123's point that this is not auto-mode-specific.

Our repro is from a Claude Code CLI session with manual permission prompts,
no auto mode. The user rule (persisted in the project's checked-in memory
layer, not just a session turn) explicitly says: "before running a short-
token find/replace, grep the whole document first for collisions." The
agent acknowledged it at session start, and then ran the find/replace
without the grep, on a live artifact. Result: load-bearing text in a
different section got deleted.

The "acknowledge-and-continue" framing in @0xbrainkid's comment matches
what we see. What's extra in our case is that the rule was persistent
(file on disk, not just this session's context), and the model claimed
to have loaded it. Yet the action contradicted it.

We've written this up from the governance-persistence angle here:
{link to new issue}

Happy to share more sanitized traces if it helps narrow down the
mechanism.
```

단어 수: ~160

---

## 코멘트 3 — Issue #50623 or #50152 (performance regression)

> **선택**: #50623 (2026-04-19 등록, 여전히 라이브) 우선. #50152는 동일 범주지만 더 오래되어 discussion fatigue 있음.
> **이슈 맥락**: Max plan 사용자 "usage 빠르게 소진 + 품질 저하" 호소. 본문 빈약 (버그 로그만).

**게시할 영문**:

```markdown
Data point on the "chews usage faster" part: tokenizer change in 4.7
matters here. Up to ~35% more input tokens for the same textual content
compared to 4.6 (confirmed in multiple writeups since release).

Combined with the behavior regression where 4.7 doesn't re-consult
project-local governance files before acting, we end up with extra
correction-loop turns that wouldn't have existed on 4.6 — each of those
turns also billed at the higher tokenization rate. Two multiplicative
effects on usage.

Operators who were fine on 4.6 Max budgets are now burning through them
on the same workload. This is consistent with your report.

Workaround that worked for our team: pin `claude-opus-4-6` for
multi-reference tasks; keep 4.7 for single-shot work. Rough writeup with
numbers: {link to new issue}
```

단어 수: ~145

---

## Reddit 댓글 대기 초안 (게시 후 반응별)

Reddit 본 게시물에 흔히 달릴 반응별 대응 초안. 작가님·쌍아가 댓글 대응 담당 지정 시 참조용.

### A. "그냥 4.6 쓰세요" 류

```
That's our current workaround (see "Workarounds" section). What we're
trying to surface is that it took a repro + metrics to get to the
conclusion. Teams without that instrumentation may be losing time without
knowing why. Hence the post.
```

### B. "프롬프트가 구린 거 아니냐" 류

```
Same prompts, same files, same operator. The variable that changed was
the model. If you have a prompting fix that restores the file-
consultation behavior on 4.7, very interested — we couldn't find one.
```

### C. "Anthropic 엔지니어인데 재현 데이터 좀" 류

```
Happy to share sanitized session logs + the governance file structure
under NDA. Have posted the engineering-side version at [GitHub issue
link]. Ping there or DM.
```

### D. "MONKOS 홍보용 아니냐" 류

```
Fair concern. The data is the post; brand mention is one line at the
bottom. Moderators welcome to strip it if the sub prefers that — the
observations stand either way.
```

---

## ⚠️ 기밀 보호 적용 내역 (공통)

모든 코멘트는 GitHub Issue 초안(DRAFT_20260419_github_issue_4.7_feedback.md)
과 Reddit 초안(DRAFT_20260419_reddit_r_claudeai_4.7_review.md)의 기밀 보호
규칙을 그대로 준용:

- 에이전트 호칭 0건
- 팀원명 0건
- 내부 프로젝트명 0건
- 업무 고유명사: "10-page Markdown business plan" 추상화
- 브랜드: "our team" / MONKOS 링크는 신규 이슈 본문에만 1회

---

## 게시 체크리스트 (작가님 승인 후)

- [ ] 신규 이슈 먼저 발행 → URL 확보
- [ ] URL을 각 코멘트의 `{link to new issue}` 플레이스홀더에 치환
- [ ] 코멘트 3건 순차 게시 (동시 발사 금지 — 스팸 시그널 회피)
- [ ] 각 코멘트 게시 후 이슈 번호·코멘트 URL 본 파일 하단에 부록으로 기록
- [ ] Reddit 게시물 발행 후 24h 이내 댓글 대응 담당 출근 확인

---

## 부록 — 미채택 후보 이슈

검색에서 나왔으나 코멘트 가치 낮다고 판단한 건:

| 이슈 | 제목 | 비채택 사유 |
|------|-----|----------|
| #49214 | "Opus 4.7 is literally just a retard" | 제목·톤 부적절. 브랜드 리스크 |
| #50163 | "ignores user instructions and takes inefficient shortcuts" | 본문이 버그 로그만. 대화 불가 |
| #50279 | "Claude 4.7 Opus not following user prompt instructions" | 동상 |
| #50108 | "replicating session inside of session" | 다른 증상 |
| #49689 | "Opus 4.6 removed from Desktop Code tab" | UI 회귀. 본건과 다른 축 |
| #49232 | "System prompt outdated: misidentified as Opus 4" | 초기 릴리즈 혼란 수습됨 |

필요 시 추가 코멘트 대상 재검토 가능.
