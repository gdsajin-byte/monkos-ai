---
type: design
date: 2026-09-30
device: iMac
agent: 민아
status: 승인 → 1단계 구현 완료 (작가님 15:30 "제안대로 실행해")
portfolio: PF_MONK_OS
subject: "PF 수기 노트 → 원장(ledger) 체계 — 마크다운 정본 유지 + 쓰기 자동화·파생 뷰·교차 링크 검사·구조화 질의 4단"
related:
  - monkos-ops/tech/designs/2026-09/DESIGN_20260930_집행코드화_hooks_deny.md (E11 Stop 훅)
  - monkos-ops/tech/designs/2026-09/DESIGN_20260930_기능부편성_4MUSE하네스.md (부서장 보고 데이터원)
  - governance/laws/ch4_docs_structure.md 9조 (PF 운용)
---

# PF 원장화 설계서 — 수기 노트 위에 기계 층을 얹는다

**[2026-09-30 15:30 KST]** iMac/민아 → 작가님 · 쌍아

> 작가님(09-30 15:27): "PF는 대체하기 어렵지. 다만 더 세련되고 완성도 높은 체계로 진화하고픈 거지. 좋은 체계이긴 한데 아직은 수기 노트."
> → 15:30 "제안대로 실행해."

---

## 0. 결론 (1줄)

마크다운 README는 **정본으로 유지**(git diff·에이전트 가독·검색 인덱스 호환)하고, 그 위에 **쓰기 명령 → 파생 뷰 → 교차 링크 검사 → 구조화 질의** 4단을 얹는다. 1단계(쓰기 명령 + 자동 링크 + 검사)는 본 세션에서 구현·스모크 완료.

## 1. 수기 노트의 증상 (09-30 실측)

| 증상 | 실례 |
|------|------|
| 쓰기가 손 | 오늘 PF_MONK_OS 히스토리 4행을 전부 파이썬으로 마지막 행을 찾아 끼움. 열 정합은 눈으로 |
| 형식 표류 | 날짜 셀 `MM/DD`(39 PF) vs `YYYY-MM-DD`(PF_MONK_OS). 히스토리 헤딩 7종 변형 |
| 상태 부패 | PF_MONK_OS Phase 1 "작가님 검토 대기" 4/23부터 ⏳. PF_OPUS 37행 표 구조 어긋남(웹민아 09-30) |
| 갱신 누락 | portfolio: 필드 문서 46건(9월) 중 PF 히스토리 연결은 사람이 기억해야 함. 헌법 3조 2항 "PF 갱신 의무"가 산문 |
| 읽기가 통독 | "막힌 PF가 뭐냐"에 답하려면 서브에이전트가 35 PF를 읽음(오늘 아침 투두 추출 8만 토큰) |
| 정체 불가시 | 활성 PF 20건이 30일 이상 무갱신(`pf.sh query --stale 30`) — 오늘 도구로 처음 한 줄에 보임 |

## 2. 원칙

1. **정본 = 마크다운.** DB·SaaS로 옮기지 않는다. 기계 층은 정본을 읽고 쓰는 도구·훅·CI이지 새 저장소가 아니다.
2. **히스토리 = append-only 원장, 나머지 = 파생 뷰.** Phase 현황·인덱스 README·대시보드는 원장에서 계산한다(2단계).
3. **의무는 훅이 집행.** 헌법 3조 2항 PF 갱신 의무 → 문서 생성 시 자동 링크 + Stop 경고 + CI 검사.
4. **표준 라이브러리만.** 4060 WSL·웹 컨테이너에서 같은 명령.

## 3. 4단 로드맵

| 단 | 내용 | 산출 | 상태 |
|----|------|------|------|
| **1. 쓰기 명령 + 자동 링크 + 검사** | `pf.sh append/query/check/show` · PostToolUse(Write) 훅이 portfolio: 문서를 PF에 자동 어펜드 · Stop 훅 PF 미갱신 경고 · CI C15 | `scripts/pf.py` `scripts/pf.sh` `hooks/pf_autolink.py` `hooks/stop_check.py` `governance-check.yml C15` `rules/pf-ops.md` | ✅ 09-30 (스모크 17/17, 실레포 check 5/5) |
| **2. 파생 뷰** | 원장 → `portfolios/STATUS.md`(활성·정체·블로커 대시보드) + README 인덱스 상태열 자동 갱신. weekly-dashboard.yml에 편입. Phase 현황은 히스토리 태그(`[phase:2 done]`)에서 계산 | `pf.py status --write` · CI | 부서제 시범 Week 1 |
| **3. 교차 링크 강제** | C15 경고 → 차단(strict) 전환. ORDER↔COMPLETION↔PF 3자 대조. `[예외]`↔COMPLETION(C12)을 PF까지 확장 | C15 strict · C12 확장 | 시범 Week 2 실측 후 |
| **4. 구조화 질의** | 원장 → `portfolios/ledger.jsonl` 파생(행 단위: pf·date·agent·type·artifact·status). `monk_stats`·record-explorer가 통독 대신 질의. 부서장 보고서 데이터원 | `pf.py export` · retrieval 연동 | 부서제 시범 Week 2 |

## 4. 1단계 사양 (구현본 기준)

- **append**: PF 식별(PF_X 또는 X) → 히스토리 표(`| 날짜 | 주체 | 내용 | 산출물 | 상태 |`) 블록 끝에 행 삽입. 날짜 형식은 그 PF의 마지막 행에 맞춤. 산출물 경로는 PF 기준 상대 링크로 변환. 내용의 `|`는 `｜`로. 같은 산출물 파일명 중복 시 rc 2(`--force`). 500줄 초과 경고.
- **자동 링크 훅**: `reports/orders/incidents/proposals/designs/specs` 아래 Write → frontmatter `portfolio: PF_X` 있으면 `**{TYPE}** {subject}` 행을 `{device}/{agent}` 주체로 어펜드, 상태는 type별(completion ✅·incident 🔴·order/design/proposal ⏳·report/spec 📁). 이미 링크돼 있으면 무동작. 에이전트에게 `additionalContext`로 통지 → 수동 중복 방지.
- **Stop 훅**: 오늘 mtime의 portfolio: 문서 중 PF 미링크 목록 + 세션 로그 신선도(2h) 경고. 비차단·무상태.
- **check**: 최근 N일 문서 전수 대조. `--strict`면 rc 1. CI C15는 경고 전용으로 시작(3단계에서 차단).
- **query/show**: 활성·정체(`--stale N`)·특정 PF 요약 표. `--json`으로 4단계 선행.

## 5. 법률 영향
- ch4 9조 PF 운용: "히스토리 1행 어펜드"의 수단을 `pf.sh` 경유로 명시 + 자동 링크 문서는 수동 어펜드 불요 조항. `rules/pf-ops.md` 선반영(09-30), 법률 본문은 쌍아 추인 시 동기.
- 헌법 3조 2항: 조문 변경 없음. 집행 방식만 코드로.

## 6. 리스크
| 리스크 | 완화 |
|------|------|
| 자동 링크 행과 에이전트 수동 행 중복 | pf.py가 같은 파일명 중복 거부 + 훅이 통지. 규칙에 "수동 불요" 명시 |
| 히스토리 헤딩·표 변형 PF에서 append 실패 | 표 헤더로 앵커(40/40 PF 동일). 실패 시 rc 2 명시 — 무음 없음 |
| 500줄 초과 PF 계속 비대 | 경고 출력. 아카이브 자동화는 2단계 |
| mtime 기반 검사가 체크아웃 직후 전 파일을 '최근'으로 봄 | CI는 `--days 3` 경고 전용. 3단계에서 git diff 기반으로 교체 |

## 7. 다음 행동
1. 쌍아 추인 REVIEW(집행 코드화와 일괄).
2. 2단계 `pf.py status --write` + weekly-dashboard 편입 — 부서제 시범 Week 1 지시서.
3. 활성 PF 20건 30일+ 정체 목록 → 작가님 정리 결정(paused/completed 전환).
