---
type: completion
date: 2026-09-27
device: iMac
agent: 막내
status: 완료
subject: "retrieval 인덱스 경화 — 빌드 타임아웃·원자적 교체·헬스체크·OR 폴백 (09-26 9시간 무음 공백 재발 방지)"
from: iMac/막내
to: 작가님
related: monkos-ops/ops/sessions/2026-09/2026-09-26_iMac_쌍아.md (15:05 도구 결함 장부), PROPOSAL_20260927_민아_메모리비만_레거시정리.md
---

**[2026-09-27 03:06 KST]** iMac/막내 → 작가님

# COMPLETION — retrieval 인덱스 경화

> 승인: 작가님 2026-09-27 02:50 KST (iMac/민아 경유). 지시 범위: `scripts/retrieval/`, `scripts/mk-push.sh`, `.claude/rules/references.md` 1행, 본 보고서.

## 사고 요약 (실측 기반)

- 2026-09-26 17:42 ~ 09-27 02:47 KST (약 9시간) `scripts/retrieval/monk_index.db`가 **4KB 빈 SQLite(테이블 0)** 상태.
- 원인: `mk-push.sh [1/2]`의 `node build_index.js --embed`가 네트워크 대기로 ~30분 정지 → 수동 종료. 구 build_index는 **시작 시 정본 DB를 unlink하고 같은 경로에 새로 쓰는 구조**여서 중단 = 빈 DB.
- 증상: monk_search/monk_stats가 raw `no such table: documents`를 반환 → 에이전트들이 grep으로 무음 폴백. 도구 3요건 #3(실패 가시화) 위반.

## 결과

✅ **mk-push.sh 타임아웃** — `timeout` → `gtimeout` → **perl alarm 폴백**(iMac은 둘 다 부재, 실측). exit 124 = 타임아웃. 실패·타임아웃 시 🔴 한 줄 출력 후 **push는 계속**(차단 없음, 무음 건너뜀 없음)
✅ **원자적 교체 2중** — build_index.js는 항상 `<out>.building.tmp` 스테이징에 쓰고 성공 시에만 rename; mk-push는 다시 `monk_index.db.<pid>.tmp`로 빌드 → 스모크 PASS → `mv -f`. 중단된 빌드가 정본을 빈 파일로 바꾸는 경로 소멸
✅ **2단계 빌드** — [A] BM25 전용(네트워크 불요, ~13s, 타임아웃 120s) 먼저 교체 → [B] `--embed`(타임아웃 300s) 별도. B가 죽어도 A의 **신선한 BM25 인덱스는 남는다** (09-26 사고에서는 임베딩 정지가 BM25까지 잃게 했음)
✅ **build_index.js** — `--out <path>` / `MONK_INDEX_OUT` 출력 재정의. `--embed` 실패는 try/catch로 격리(BM25 테이블 유지, exit 2로 구분). 항상 `📊 인덱스 요약: 문서·청크·임베딩·모드·DB` 1행 출력. 스테이징은 `journal_mode=MEMORY`라 kill 시 -wal/-shm 잔재 0
✅ **헬스체크(lib.js `openHealthyDB`)** — documents/chunks/chunks_fts 부재 또는 0행 → `❌ retrieval 인덱스 비정상: {사유}. 재빌드: 레포 루트에서 \`node scripts/retrieval/build_index.js\`…` 한국어 에러. mcp_server의 monk_search·monk_stats·monk_relations 전부 적용, `isError: true` 동반. raw SQLite 에러 노출 경로 제거
✅ **OR 폴백(lib.js `searchBM25WithFallback`)** — 원인: FTS5 기본 `unicode61` 토크나이저 + 암묵 AND. 한국어 조사("배포는")가 분리되지 않아 어절 하나만 빠져도 0건. 폴백 순서 strict(원문) → 접두 AND(`"어절"*`) → **접두 OR**. 모드는 헤더 `[모드: OR 폴백]`로 표기(무음 강등 금지). 구문오류(따옴표 불균형 등)도 throw 대신 폴백
✅ **스모크 `node scripts/retrieval/search.js --smoke [--db PATH]`** — 헬스(문서>0·청크>0) + 기준 쿼리 "required reviewer" strict 히트 + 다어절 한국어 쿼리 폴백 히트. 🟢 PASS / 🔴 FAIL, exit 0/1. mk-push가 임시 DB에 대해 자동 호출, FAIL 시 정본 미교체
✅ **references.md 도구 맵 monk_search 행 1행 보강** (헬스·스모크·OR 폴백 요지)
✅ **검증 완료** — 아래 §증거. `--embed`는 지시대로 **미실행**(현 DB: BM25 전용, 임베딩 0 유지)

💡 **부수 교정(범위 내 라인)** — ① mcp_server vector 모드가 `searchVector(db, query, effectiveLimit)`로 limit을 args 자리에 넘기던 잠재 버그 → `(db, query, args, effectiveLimit)` 교정 ② 결과 path의 앵커 이중 `##` (anchor에 이미 `#` 포함) → 단일 `#` ③ `--embed` 없이도 정본 DB의 해시 일치 임베딩을 **로컬 이월**(네트워크 불요) — 현재 임베딩 0이라 무동작이지만, 향후 B단계 실패 시 A단계가 벡터를 보존
💡 **설계 판단 1건 — SIGTERM 핸들러 미채택**: 스테이징 정리를 위해 `process.on('SIGTERM')`을 달아 봤으나, 동기 빌드 구간(~14s)에서 Node가 시그널을 이벤트루프까지 **지연**시켜 kill이 무효화됨(0.5s kill → 14s 완주, 실측). 기본 처분 유지, 잔재는 다음 빌드 시작·mk-push가 제거
💡 **mk-push 검증 진입점** — `--index-only`(push 생략), `MK_INDEX_TIMEOUT`, `MK_INDEX_EMBED=0|1`, `MK_INDEX_EMBED_TIMEOUT`

⏳ **동기 대상(쌍아 소관)** — `.claude/rules/references.md` 도구 맵 1행 수정은 규정 계층. 작가님 승인 하 막내 실행 — 쌍아 사후 추인 요청. `rules/mcp-tools.md`에도 "0건·에러 시 grep 폴백 전에 `--smoke`" 1행 포인터 추가 여부는 쌍아 판단으로 넘김(본 건 미수정)
⏳ **임베딩 B단계 실전 스모크 미실시** — `--embed` 금지 지시. 다음 mk-push 실행 시 [B·임베딩] 라인(✅/🟡/🔴) 출력을 확인하면 실증 완료. 네트워크 정지 재발 시 300s 후 🔴 + BM25 유지가 기대 동작
❌ 없음

📁 **변경 파일**
- `scripts/mk-push.sh` — 타임아웃 래퍼·2단계 빌드·임시 DB→스모크→mv·🔴 가시화·`--index-only`
- `scripts/retrieval/build_index.js` — 스테이징+rename·`--out`·임베딩 실패 격리·요약 1행·캐시 이월
- `scripts/retrieval/lib.js` — `MONK_INDEX_DB`·`checkIndexHealth`/`openHealthyDB`/`indexErrorMessage`·`searchBM25WithFallback`/`ftsTerms`
- `scripts/retrieval/mcp_server.js` — 3도구 헬스 게이트·폴백 모드 헤더·vector limit 버그
- `scripts/retrieval/search.js` — `--smoke`·`--db`·폴백 헤더·에러 메시지 통일·앵커 표기
- `.claude/rules/references.md` — 도구 맵 monk_search 행 1행 (동기 대상)
- 본 보고서
- 기존 테스트: `scripts/retrieval`에 테스트 파일 없음(find 실측) → 스모크가 최초 자동 검증

## 검증 증거 (실측 출력 발췌, 2026-09-27 03:00~03:04 KST)

**A. mk-push A단계 (임시 빌드 → 스모크 → 원자적 mv), `--embed` 미실행**
```
sha before: a0a90b63182424f5
=== [1/2] retrieval 인덱스 리빌드 ===
ℹ️ timeout/gtimeout 부재 — perl alarm 폴백 사용
--- [A·BM25] 빌드 (타임아웃 120s) → scripts/retrieval/monk_index.db.59403.tmp
📊 인덱스 요약: 문서 4166 · 청크 24420 · 임베딩 0 · BM25 전용 · DB .../monk_index.db.59403.tmp
🩺 retrieval 스모크 — DB .../monk_index.db.59403.tmp
  ✅ 헬스: 문서 4166건 · 청크 24420건
  ✅ 기준 쿼리 "required reviewer" strict 4건
  ✅ 다어절 한국어 쿼리 37건 (mode=OR 폴백)
🟢 retrieval 스모크 PASS
✅ [A·BM25] 인덱스 교체 완료 (원자적 mv)
⏭️ [B·임베딩] 건너뜀 (MK_INDEX_EMBED=0) — 벡터 검색 갱신 없음
real 0m13.623s / sha after: a4a55d76a3b5ad4d (changed: yes) / 잔재 -wal·-shm 없음 / journal_mode: delete
```

**B. 다어절 한국어 쿼리 — 지시서 재현 쿼리**
```
$ node scripts/retrieval/search.js --query "버튼 배포 승인 신원 분리 required reviewer 불수용"
🔍 BM25 검색: "버튼 배포 승인 신원 분리 required reviewer 불수용" [모드: OR 폴백]
  2026-09-26  order        monkos-ops/ops/orders/2026-09/ORDER_20260926_iMac쌍아_막내3_PETITION20260924_사법심사.md#특별-심사-지점-반드시-다룰-것
  2026-09-26  session_log  monkos-ops/ops/sessions/2026-09/2026-09-26_iMac_민아.md#chunk-5
  2026-09-26  review       .../REVIEW_20260926_iMac쌍아_심사종합_PETITION20260924.md#chunk-2
  ... 총 11건 (문서당 2청크 제한)
$ node scripts/retrieval/search.js --query "required reviewer"     → strict 4건 (헤더에 모드 표기 없음 = strict)
FTS 직접 대조: strict 0건 / "버튼* 배포*" 449건 / OR 7,786청크 — 원인은 암묵 AND+조사 미분리
```

**C. 타임아웃 1s — 정본 DB 불변**
```
$ MK_INDEX_TIMEOUT=1 MK_INDEX_EMBED=0 bash scripts/mk-push.sh --index-only
🔴 [A·BM25] 인덱스 빌드 타임아웃(1s) — 정본 DB 미변경. push는 계속
exit=0 (push 경로 진행) / sha before == after: a4a55d76a3b5ad4d (identical: yes) / leftovers: (none)
직접 실행 kill -TERM @0.5s: exit=143 elapsed=0s / sha same: yes / 잔재: monk_index.db.building.tmp만 (gitignore *.tmp, 다음 빌드 시 제거)
```

**D. 빈 DB 에러 경로 (09-26 상태 재현: 0바이트 SQLite)**
```
$ node scripts/retrieval/search.js --smoke --db /…/empty.db
  ❌ 헬스: 테이블 부재(documents, chunks, chunks_fts) — 빌드가 중단되어 빈 DB만 남은 상태
🔴 retrieval 스모크 FAIL — 인덱스 비정상. node scripts/retrieval/build_index.js 로 재빌드   (exit=1)
MCP stdio(monk_stats·monk_search, MONK_INDEX_DB=empty.db):
"text":"❌ retrieval 인덱스 비정상: 테이블 부재(documents, chunks, chunks_fts) — … 재빌드: 레포 루트에서 `node scripts/retrieval/build_index.js` (약 15초, 네트워크 불요). 복구 전까지 grep 폴백 사용 사실을 보고에 명시할 것."  "isError":true
```

**E. MCP 정상 경로 (stdio JSON-RPC 실호출)**
```
monk_stats → {"health":"ok","documents":4166,"chunks":24420,"pf_links":1035,"unique_pfs":45,"axis_mappings":32,"embeddings":0,"search_mode":"bm25 전용",…}
monk_search(다어절) → 🔍 bm25 [BM25 모드: OR 폴백] 검색: "버튼 배포 승인 신원 분리 required reviewer 불수용" — 3건
```

**F. 최종 상태** — `node scripts/retrieval/search.js --smoke` → 🟢 PASS (문서 4166 · 청크 24420 · 임베딩 없음(BM25 전용)). 정본 DB `journal_mode=delete`, -wal/-shm 없음.

## 판정 방법 병기 (live-verify)
로컬 파일·프로세스 대상이라 2회 히트 규칙 비적용. 대조군: 빈 DB(음성)·정상 DB(양성) 양쪽 실호출, sha256 전후 비교, MCP는 stdio JSON-RPC 실호출로 판정.
