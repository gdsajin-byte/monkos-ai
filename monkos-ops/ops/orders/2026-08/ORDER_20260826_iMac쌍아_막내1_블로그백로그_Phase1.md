---
type: order
date: 2026-08-26
device: iMac
agent: 쌍아
receiver: 막내1
subject: "블로그 백로그 Phase 0-1 — 발행 계약 정규화 + 에세이 25건 발행"
portfolio: PF_OPUS
status: 발행
---

# 지시서 — 블로그 백로그 Phase 0·1

**[2026-08-26 13:00 KST]** iMac/쌍아 → 막내1

## 0. 착수 전 필독

- 설계 정본: `monkos-ops/tech/designs/2026-08/DESIGN_20260826_블로그백로그_트리아지.md` — **먼저 Read**
- 근거 제안서: `monkos-ops/ops/proposals/PROPOSAL_20260825_민아_블로그_선언형_발행_파이프라인.md`
- 도구: `monkos_AI/portal/tools/blog-publish/publish.mjs` (dry-run 기본, `--publish` 명시 시에만 쓰기)

## 1. 배경

`contents/blog` 원본 94건 중 **78건이 미발행**이다. 그중 에세이 25건(C군)은 specs와 의도 충돌이 없어 재작성 없이 발행 가능한 유일한 군이다. 다만 **원본 60건 이상이 `lang: KR` 표기**라 `publish.mjs`의 `ko|en|ja` 검증에 걸린다. 계약 정규화가 선행한다.

## 2. 작업 범위

### Task 1 — `publish.mjs` lang 별칭 정규화

`monkos_AI/portal/tools/blog-publish/publish.mjs`의 frontmatter 파싱 직후, `fm.lang`을 정규화한다.

- `KR`/`kr`/`ko` → `ko` · `JP`/`jp`/`ja` → `ja` · `EN`/`en` → `en`
- 그 외 값은 **종전대로 에러**로 튕긴다 (무음 폴백 금지 — 알 수 없는 언어를 ko로 흡수하지 말 것)
- `lang` 필드 자체가 없으면 에러 (추정 금지)

> 파일명 접미사(`_KR`/`_JP`/`_EN`)는 판정 근거로 쓰지 말 것. frontmatter가 정본이다.

### Task 2 — C군 25건 dry-run

아래 25건을 `contents/blog`에서 찾아 dry-run한다. 전건 통과가 목표다.

```
ai-agent-least-privilege-11665-to-1   ai-morning-patrol-one-person-company
when-my-own-pages-compete             when-the-model-changed-overnight
when-the-health-check-lied            visitors-at-the-door
measure-before-you-fix                the-todo-that-was-already-done
judgment-vs-creation-determinism      when-you-cant-measure-dont-guess
automation-dilutes-not-replaces-review rules-belong-in-code-not-documents
when-preservation-erases-improvement  honesty-as-search-strategy
systems-that-fail-loudly              billing-unit-vs-work-unit
content-self-cannibalization-lesson   the-metric-that-lied-upward
arrivals-analytics-cannot-see         delegate-the-check-not-the-decision
dns-check-rate-limit-false-negative   reporting-format-versus-execution
the-layer-i-did-not-look-at           two-equal-numbers
three-of-four-languages
```

- 실패 건은 **고치지 말고 사유와 함께 목록으로 보고**한다. 본문 수정은 이 지시서 범위 밖이다.
- 단, `category` 공란은 실패 사유가 아니다(선택 필드).

### Task 3 — 발행 + 라이브 검증

dry-run 전건(또는 통과분) `--publish` 실행 → 도구가 자동 수행하는 라이브 200 검증 결과를 그대로 보고한다.

- 200 아닌 건이 하나라도 있으면 **성공으로 보고하지 말 것**. 도구가 이미 `실패 무음 금지`로 설계돼 있다.
- 발행 후 `sitemap-blog.xml`에 ko URL이 증가했는지 실측한다 (발행 전 79 → 기대 79+발행건수).

### Task 4 — 세션 로그 + 완료 보고

## 3. 범위 밖 (착수 금지)

- **A군(해외 국가 규격 17건)·B군(국내 실용 34건) 발행 금지.** specs와 헤드텀 충돌 판정이 끝나지 않았다. 발행하면 자사 specs 순위를 깎는다.
- 원본 md 본문·제목 수정 금지 (에세이는 원문 그대로 발행한다).
- 전역 CTA 토글 조작 금지 — 작가님 결정 대기 항목이다. **끈 상태로 발행해도 무방**하며, 나중에 켜면 서버 렌더라 소급 반영된다.
- `--update` 플래그 사용 금지 (신규 발행만. 기존 문서 덮어쓰기 상황이 나오면 보고 후 대기).

## 4. ⚠️ 준수 조항

- **헌법 3조 1항** — 매 턴 `date`로 KST 취득. 추정 금지.
- **헌법 4조 2항** — 파괴적 명령 금지. 원본 md 삭제 금지 (A군 폐기 건은 Phase 3 소관).
- **ch5 2조** — 이 작업에 배포는 없다. `publish.mjs`는 Firestore 쓰기 도구지 배포 도구가 아니다. 포털 재배포 불요.
- **ch4 10조** — `blog_posts`는 고객 데이터 아님(도구 헤더에 근거 명시). 단 `credits.sh` 우회 목적의 Firestore 접근은 여전히 금지.
- **ch6** — 커밋은 롤백 단위로 분리한다. Task 1(도구 수정)과 Task 3(발행 결과 기록)은 별도 커밋.
- **ch7** — COMPLETION 보고서 파일 필수: `monkos-ops/ops/reports/2026-08/COMPLETION_20260826_iMac막내1_블로그백로그_Phase1.md`
- 에러 3회 반복 시 `/에스컬레이션`.

## 5. 완료 기준

- [ ] `publish.mjs` lang 정규화 반영 + 미지원 언어는 여전히 에러로 튕김을 실증
- [ ] C군 25건 dry-run 결과 보고 (통과/실패 내역)
- [ ] 통과분 발행 + 라이브 200 검증 전건 통과
- [ ] `sitemap-blog.xml` ko URL 증가 실측
- [ ] PF_OPUS 히스토리 1행 어펜드
- [ ] 세션 로그 + COMPLETION 파일 + 커밋·푸시
