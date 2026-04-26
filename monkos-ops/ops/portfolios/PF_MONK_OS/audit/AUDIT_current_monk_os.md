---
type: AUDIT
track: D
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내4
scope: 로컬 파일 전수 감사 (읽기 전용). 외부 표준 대조 금지.
sources: CLAUDE.md / governance/ / .claude/ / ~/.claude/projects/…/memory/ / monkos-ops/ops/
---

# AUDIT — 현 MONK OS 체제 전수 감사

## 요약 (500자 내)

MONK OS는 **헌법 5축(222줄) + 법률 8장(ch1~ch8, 총 6+6+5+9+5+4+6+3=44조) + Skills 9건 + Rules 3건 + MEMORY 166줄 + 외장 memory/ 32건 + PF 13건**이라는 6계층 골격을 실제로 가동 중이다. Append-only 원칙이 세션 로그·PF 히스토리·MEMORY_CHANGELOG 3곳에서 물리적으로 강제되며, 모든 법률 조항이 헌법 조항의 위임임을 명시하는 통치 구조는 강점이다. 한편 ① **CLAUDE.md 인덱스 L196 ch7 "5조" 표기** vs 실제 6조 존재(2026-04-17 신설) ② `PF_CDP.md`+`PF_CDP/`, `PF_SPREAD.md`+`PF_SPREAD/`, `session-logs/`(구)+`sessions/`(신) 병존 등 **정본 단일 원칙(3조 4항) 침식** ③ **Skills frontmatter가 `name`+`description` 2필드 최소주의** — 세 가지가 구조적 약점. 개헌 후보 3건 도출(ch7 조 수 정정·정본 강제 장치·런타임 축 추가).

---

## 1. 헌법 해부 (CLAUDE.md)

### 1-1. 구조 실측
| 항목 | 값 | 근거 |
|------|----|------|
| 총 줄 수 | 222 | `wc -l CLAUDE.md` |
| 5축 조 수 | 1조(3항) · 2조(3항) · 3조(4항) · 4조(5항) · 5조(4항) | 본문 헤딩 |
| 법률 인덱스 | 8장 | CLAUDE.md L189-198 |
| 상시 로딩 규정 참조 | MEMORY.md 외 5건 (수동 읽기) | CLAUDE.md L203-210 |

### 1-2. 최근 개정 이력 (git log, 최근 30일)
| 커밋 | 내용 |
|------|------|
| 7e9927f | 2026-03-25 헌법 5축 재편 발효 (7조→5조 위상 정렬, 4계층 문서 위계, Skills 8건, 위성 환경) |
| 07e7890 / 382cb0c | 2026-03-26 AMENDMENT_20260326 PF 체계 시행 |
| — | 2026-04 이후 **본문 헌법 직접 개정 없음** (하위 법률만 개정: ch1 5조 실측, ch7 6조 신설) |

### 1-3. 본문-실제 운용 정합성
- **1조 2항(역할 체계)**: 쌍아·민아·막내·용아·소넷이·철창이·코웍이 7인 — `ch1_agent_system.md:1조` 테이블과 동일 ✅
- **3조 1항(타임스탬프)**: 본 세션에서도 매 턴 준수 중. 위반 없음 ✅
- **3조 4항(정본 단일 원칙)**: **위반 후보 다수 존재** — §8 참조 ⚠️
- **5조 4항(대응 프로토콜)**: 본 감사 지시서 수령 시 헌법·법률·기능 적합성 검토 1사이클 수행 ✅

### 1-4. 결함 플래그
- **L196 `제7장 … 5조`** — 실제 `ch7_makne_code.md` 조 수는 **6조** (`grep -c "^### " ch7_makne_code.md` = 6). 2026-04-17 ch7 6조(활성 PF 참조 의무) 신설 커밋(3d7cf20) 때 CLAUDE.md 인덱스 미갱신. ⚠️ **헌법 정본 결함**

---

## 2. 법률 8장 (`governance/laws/`)

### 2-1. 조 수·줄 수·최근 개정
| 장 | 파일 | 줄 수 | 조 수 | 최근 개정 근거 |
|----|------|-------|-------|----------------|
| ch1 | `ch1_agent_system.md` | 303 | 6조 | 03-29 민아 권한 명확화 + 코웍이 권한표 |
| ch2 | `ch2_coding.md` | 84 | 6조 | 03-14 현행화 (기술 스택) |
| ch3 | `ch3_session_log.md` | 155 | 5조 | 03-26 PF 체계 반영 + 04-03 오피스 모드 (242b11f) |
| ch4 | `ch4_docs_structure.md` | 508 | 9조 | 03-08 docs/monkos/ 동결 + TASK→ORDER 통합 |
| ch5 | `ch5_deployment.md` | 77 | 5조 | 04-08 asia-northeast1 유령 서비스 재발 대응 |
| ch6 | `ch6_git.md` | 50 | 4조 | 03-12 develop→main 단일화 (PETITION_20260312) |
| ch7 | `ch7_makne_code.md` | 195 | **6조** | 04-17 6조(활성 PF 참조 의무) 신설 (3d7cf20) |
| ch8 | `ch8_branding.md` | 46 | 3조 | 02-14 브랜드 안전 5대 원칙 |
| **합계** | 8장 | **1,418** | **44조** | — |

### 2-2. 헌법 위임 관계 확인
- 모든 법률 파일에 `> 상위 헌법: 제N조(…)` 또는 `> 근거:` 라인 존재 → 위임 명시 ✅
- 개정 근거도 파일 하단에 `근거:`/`개정:` append로 관리 ✅

### 2-3. 중복·공백·모순 후보
- **ch1 5조 (세션 자동 인식)** ↔ MEMORY.md "역할 자동 인식" 섹션 일부 중복 (단, 상보적 — 법률은 근거, MEMORY는 단말 행동강령)
- ch1 1조 테이블에서 민아 환경 = "Desktop App (웹+CLI)" vs MEMORY.md = "git worktree → 민아". 개정 커밋 011adf2에서 **판별 키워드만** 수정, 테이블 환경 설명 미갱신 → 두 규정 동시 참조 시 혼선 가능 ⚠️

---

## 3. `.claude/rules/`

### 3-1. 전수
| 파일 | 크기 | 용도 | 최근 수정 |
|------|------|------|----------|
| `cdp-browser.md` | 3.6KB | CDP 브라우저 제어 규칙(Claude in Chrome 금지, 포트 배당) | 2026-04-17 |
| `deployment.md` | 1.3KB | Cloud Run 배포 규칙(deploy.sh 경유, 브랜치 main) | 2026-04-10 |
| `portal_seo.md` | 2.9KB | 포털+SEO 집중 작업 컨텍스트 (`paths:` 필드 자동 로딩) | 2026-03-15 |

### 3-2. 역할 경계
- `portal_seo.md`는 **`paths:` frontmatter**로 경로 기반 자동 로딩 (Claude Code 공식 rules 포맷). 본 세션의 system-reminder에 `.claude/rules/cdp-browser.md` + `.claude/rules/deployment.md`가 로딩된 것 확인 — 경로 매칭 작동 중.
- CLAUDE.md는 **프로젝트 전역 상시 로딩**, rules는 **문맥 조건부 로딩** → 경계 명확 ✅
- 본 세션 로딩 rules: `cdp-browser.md` + `deployment.md` (portal_seo.md는 파일 경로 미매칭으로 미로딩 — 정상 동작)

---

## 4. `.claude/skills/`

### 4-1. 전수 (9건)
| 파일 | name | 원천 조항 |
|------|------|----------|
| `session-start.md` | 세션시작 | ch1 5조 + ch3 5조 + ch7 5조 |
| `session-end.md` | 세션마감 | ch3 3조 + ch3 1조 |
| `order-write.md` | 지시서발행 | ch1 3조 |
| `makne-finish.md` | 막내마무리 | ch7 1조 |
| `deploy-cf.md` | CF배포 | ch5 1조 |
| `deploy-cr.md` | CR배포 | ch5 2조 + ch5 3조 |
| `registry-add.md` | 레지스트리편입 | ch4 6조 |
| `escalation.md` | 에스컬레이션 | ch7 4조 |
| `cdp-troubleshoot.md` | CDP장애진단 | ch7 6조 + PF_CDP |

### 4-2. frontmatter 규격
- 전 9건 모두 `name` + `description` 2필드만. `tools`, `version`, `permissions`, `trigger` 등 확장 필드 부재.
- 각 파일 본문에 `> 원천: …` 라인으로 법률·PF 위임을 명시 (프로젝트 자체 규약).
- ⚠️ Anthropic 공식 Skill 스키마 대조는 본 트랙 범위 외 (Track A 몫) — 현 최소주의 구조만 기록.

### 4-3. 헌법 4계층 위계 대응 ✅
- 헌법 5조 1항 위계 테이블의 "명령(Skills)" 계층으로 정합 — `.claude/skills/`에 물리 배치.

---

## 5. MEMORY.md (iMac)

| 항목 | 값 | 위치 |
|------|----|------|
| 총 줄 수 | 166 | `wc -l` |
| 200줄 캡 준수 | ✅ | MEMORY.md L2 |
| 섹션 수 | 약 20개 | 본문 헤딩 |
| 피드백 메모리 포인터 | 17건 | "## 피드백 메모리" 섹션 |
| 외장 메모리 포인터 | 23건 | "## 외장 메모리" 섹션 |

### 5-1. 참조 링크 유효성
- 표본 점검: `memory/sonnet/README.md` ✅ (`sonnet/` 디렉토리 확인) / `monkos-ops/tech/guides/CONTEXT_ARCHITECTURE.md` ✅ / `memory/project_monkos_endgame.md` ✅
- **Orphan(외장에는 있으나 MEMORY.md 미참조) 발견**: `memory/feedback_worktree_path.md` (1024B, 2026-04-05 작성) — "워크트리 경로 오인 방지" 피드백. ⚠️ **MEMORY.md 섹션에 포인터 추가 후보**

### 5-2. 구성 현황
- 이 디바이스 / 역할 자동 인식 / 팀 인적 인프라 / 팀 우체통 / 사업 구조 / 프로젝트 폴더 위상 / 운영 철학 / 리소스 운용 / 작가님 인사이트 / 디버깅 교훈 / 쌍아 본분 / 지시서 운용 / 연락처 / 세션 로그 타임스탬프 / 파일명 패턴 / MEMORY 출납 / 세션 프로세스 / works 체계 / 피드백 메모리 / 외장 메모리
- 도메인 지식(코드·docs 파생 가능) 미포함 정책 준수 ✅

---

## 6. 외장 `memory/` (사용자 홈)

경로: `/Users/jeong-kyushin/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/`

### 6-1. 타입 분포
| 타입 | 개수 | 비고 |
|------|------|------|
| `feedback_*.md` | 14 | 피드백 메모리 (교정·확인) |
| `project_*.md` | 13 | 프로젝트 맥락 |
| `user_*.md` | 3 | 작가님 역할·철학 |
| 기타 | 3 (`MEMORY.md`, `tts_voice_architecture.md`, `sonnet/`) | 디바이스 규정·아키 |
| **합계** | **33 항목** | — |

### 6-2. 신선도
- **최근 30일(2026-03-25~04-23) 추가·수정 항목**: 약 25건 (ls -la 기준) — 높은 회전율
- **90일+ 오래된 항목**: `tts_voice_architecture.md` (2026-02-14 수정, 약 69일) — 90일 미달 ✅
- **2026-04 신규**: `feedback_cdp_autotranslate_artifact.md`(04-21), `feedback_mcp_over_cdp_for_docs.md`(04-22), `project_monkos_org_structure.md`(04-22), `user_monk_ai_philosophy.md`(04-22) — 최근 세션에서 밀도 있게 적층 중

### 6-3. git 추적
- `~/.claude/projects/…/memory/`는 본진 리포 외부. `monkos-ops/ops/MEMORY_CHANGELOG_iMac.md`(15KB)가 변경 감지용 대리 기록 ✅ (MEMORY.md "MEMORY 출납 로그" 섹션 규정)

---

## 7. `monkos-ops/ops/` 구조

### 7-1. 폴더별 활동도
| 폴더 | 총 파일 | 최근 7일 | 판정 |
|------|--------|----------|------|
| `sessions/` | 일별+월별 아카이브 | 9 (오늘만 5건) | **매우 활성** |
| `reports/` | 383 | 20 | **활성 (막내 보고 정본)** |
| `orders/` | 월별 분할 + 최상단 | 11 (최근 4일) | **활성** |
| `portfolios/` | 15 (파일 13 + 폴더 2) | 2026-04-23 갱신 | **활성** |
| `drafts/` | 5 | 1 | 간헐 |
| `agenda/` | 11 | 0 | 정체 (최신 04-11) |
| `decisions/` | 6 | 0 | 정체 |
| `roadmaps/` | 1 | 0 | 거의 빈 (⚠️ 로드맵 체계 저활용) |
| `session-logs/` (구) | 9 (2026-04/ 하위) | 0 | **사문화 중** — §8 참조 |
| `templates/` | 4 | 0 | 템플릿은 정적이라 정상 |
| `config/` | 4 | 0 | 정적 |

### 7-2. 데드·이상 후보
- `session-logs/2026-04/` — 2026-04-05~04-13 간 9건 보관. 파일명 `SESSION_YYYYMMDD_*` (언더스코어+SESSION_ prefix). 현행 `sessions/YYYY-MM-DD_*`와 네이밍 체계 불일치. **구체계 잔재**로 판단, 그러나 2026-04 기간에도 일부 작성된 정황 존재 → 전환기 기록물. ⚠️ 쌍아 확인 요청
- `roadmaps/` 1건만 존재 — PF 체계(포트폴리오)가 도입되면서 로드맵 기능이 PF 내부 `roadmap/` 서브폴더로 흡수된 것으로 추정. ⚠️ 쌍아 확인 요청

---

## 8. 정본 단일 원칙 (헌법 3조 4항) 준수

### 8-1. 위반/침식 후보
| # | 항목 | 상태 | 심각도 |
|---|------|------|-------|
| 1 | `CLAUDE.md:196` `ch7 … 5조` ↔ 실제 6조 | **헌법 인덱스 불일치** | **高** |
| 2 | `portfolios/PF_CDP.md` + `portfolios/PF_CDP/` 공존 | 파일=상위README 역할, 폴더=세부 자료(case_studies/golden_paths/editor_adapters). **역할 분화**로 설명 가능하나 정본 판정 미명시 | 中 |
| 3 | `portfolios/PF_SPREAD.md` + `portfolios/PF_SPREAD/` 공존 | 폴더엔 `SPREAD_DEPLOY_MANUAL.md` 1건만. 역할 분화 약함 | 中 |
| 4 | `session-logs/` (구) vs `sessions/` (신) | 9건이 2026-04/ 하위에 잔존. 2026-04-13 작성분까지 포착 | 中 |
| 5 | `portfolios/PF_MONK_OS` (폴더만, PF_MONK_OS.md 없음) | **정상 패턴** — 신규 PF는 폴더+README 방식 | — |

### 8-2. docs/ ↔ monkos-ops/ 중복
- `docs/` 최상위: `DOCUMENT_ATLAS.md`, `README.md`, `archives/`, `corpus/`, `monkos/`
- `docs/monkos/`는 **2026-03-08 작가님 승인으로 아카이브 동결** (ch4 4조 근거) → 정본은 `monkos-ops/` ✅
- `docs/corpus/legacy/CLAUDE_md_v1_20260220.md` — 레거시 스냅샷 보존 목적, 혼선 없음 ✅

---

## 9. 에이전트 명명 vs Anthropic 공식 용어 (초안)

> 외부 표준 대조 금지 원칙하에 **현 MONK 측 열만** 충실히 채운 초안.

| MONK 내부 | 역할 | 운용자·모델·환경 | 대응 공식 개념(가정) |
|----------|------|-----------------|---------------------|
| 쌍아 | 수행+설계·지시서 | 작가님·Opus·VSCode extension | Primary agent / Session |
| 민아 | 통합 검증·브랜딩 | 작가님·Opus·Desktop App(웹+CLI) | Agent in worktree |
| 막내N | 자율 코딩·병렬 실행 | 작가님·Opus·iTerm(mk-c) | Subagent / Parallel session |
| 용아 | 아키 자문(읽기전용) | 작가님·Gemini 3·VSCode 사이드바 | External reviewer |
| 소넷이 | 모니터링·경량 자동화 | 작가님·Sonnet·tmux 데몬 | Daemon agent |
| 철창이 | 전략 브레인스토밍 | 작가님·Claude 웹 | External chat agent |
| 코웍이 | SPREAD 배포·전략 보고 | 작가님·Opus·Desktop App | Execution agent |
| `.claude/rules/` | 경로 기반 자동 로딩 컨텍스트 | — | Project rules |
| `.claude/skills/` | 절차 명령서 (9건) | — | Skills |
| MEMORY.md (디바이스) | 단말 행동강령·상시 로딩 | — | Memory(상시) |
| `memory/` (외장) | feedback/project/user 타입 누적 | — | Memory(장기) |
| ORDER (지시서) | 쌍아→막내 작업 발행 | — | Prompt / Task spec |
| PF (포트폴리오) | 프로젝트 생애주기 단일 추적 문서 | — | 공식 대응 불명 (MONK 고유) |
| MONK 헌법·법률 | 통치 문서 | — | 공식 대응 불명 (MONK 고유) |

> 공식 열 확정 = Phase 1에서 Track A 합류 후 쌍아 통합 몫.

---

## 10. Claude 4.7 이후 MONK OS 변경 필요 후보 (플래그만)

> 막내4 자기 판단. 해결책 제시 금지.

1. **헌법 2조 1항 디바이스 맵**에 서비스 런타임(Cloud Run / CF Workers / CF Pages) 축 미포함. 에이전트 작업이 "어느 런타임 위에서 벌어지는지" 추적할 공간이 없음.
2. **법률 ch3(세션 로그) 시작 절차**가 Skills/Routines 시대에서 상당수 자동화 가능 — 현재도 `session-start.md` Skill이 수동 참조. 자동 트리거(hook) 편입 여지.
3. **헌법 인덱스 ch7 조 수 불일치**(5→6) — §1-4 플래그.
4. **Skills frontmatter 최소주의** — Anthropic 공식 Skill에 `trigger`·`allowed-tools`·`version` 등 확장 필드 있을 가능성. 대조 후 보강 필요.
5. **Rules `paths:` 자동 로딩** — Claude 4.7 Project Rules 공식 포맷과 완전 정합 여부 점검 필요.
6. **MEMORY 200줄 캡** — Claude 4.7 Memory tool 용량/성능 특성 대비 적정선 재검토.
7. **에이전트 환경 규정 이원화** (§2-3) — ch1 1조 테이블 vs MEMORY.md 판별 키워드 통합.

---

## 11. 위성 환경 헌법 에센스

### 11-1. 에센스 정본
- 경로: `monkos-ops/ops/templates/CONSTITUTION_ESSENCE.md`
- 크기: 49줄, 2.4KB
- 최종 갱신: 2026-03-26 (L5 명시, AMENDMENT_20260326 PF 체계 반영)
- 구성: 10개 항 (타임스탬프 / 수발신 헤더 / 완료 보고+PF / 파괴적 명령 / 비밀정보 / 내부 기밀 / 피드백 / 정체성 / 세션 시작 / 개정 청구권)

### 11-2. 본진 헌법 동기화
- 본진 CLAUDE.md 최종 개정: 2026-03-26 (PF 체계) → 에센스와 시점 일치 ✅
- 본진 헌법 인덱스 ch7 "5조" 오기는 에센스 미영향(에센스는 법률 인덱스 미포함)
- 에센스 9항 "세션 시작 절차"의 "오피스 모드" 표현이 2026-04-03 ch3 5조 개정(242b11f, "논PF 대기→오피스 모드")과 동기화됨 → 법률 변경도 추적 ✅

### 11-3. 배포 상태
- ⚠️ 본 감사는 iMac 본진 대상이므로 **M1/M4/M2 위성의 실제 에센스 배포 상태는 확인 불가**.
- MEMORY_CHANGELOG는 iMac·M1 2건(`MEMORY_CHANGELOG_iMac.md` 15KB, `MEMORY_CHANGELOG_M1.md` 5.8KB) — M4·M2 체인지로그 부재. ⚠️ 쌍아 확인 요청

---

## 12. 결론

### 강점 3
1. **헌법 5축 + 법률 8장 + Skills + MEMORY의 4계층 위계가 실제 가동 중** — 모든 법률 파일이 헌법 조항 위임을 명시, 모든 Skill이 `> 원천: 법률 N조` 라인으로 상위 법률을 참조. 통치 구조가 문서 레벨에서 물리적으로 구현됨.
2. **append-only 3중 강제** — `sessions/` 원본 수정 금지(ch3 1조) + PF 히스토리 append only(ch3 2항) + MEMORY_CHANGELOG 변경 추적(`MEMORY_CHANGELOG_{디바이스}.md`). 시계열 복원·감사 가능성 확보.
3. **PF(포트폴리오) 단일 생애주기 문서** — 비전·히스토리·Phase·성과·복기·문서 인덱스·리스크가 한 README에 모이며 append 원칙으로 여러 에이전트 동시 기여에도 정본이 깨지지 않는 구조. PF_MONK_OS 자체가 생산적 증거(오늘 4트랙 병렬 가동 상태).

### 약점 3
1. **정본 단일 원칙 침식** — CLAUDE.md L196 ch7 조 수 오기(**高**) + PF 파일/폴더 이중화 2건(中) + session-logs↔sessions 전환 잔재 9건(中). 법 본문과 인덱스가 어긋나면 헌법 3조 4항 자체가 무력화.
2. **Skills frontmatter 최소주의** — 9건 모두 `name`+`description`만. 트리거 조건·권한·버전 부재. Track A의 Anthropic 공식 Skill 스키마 조사 결과와 갭 검증 필요.
3. **역할-환경 규정 이원화** — ch1 1조 테이블(민아 = Desktop App) vs MEMORY.md(worktree → 민아). 2026-04-03 실측 수정 커밋(011adf2)에서 판별 키워드만 고쳤고 테이블 설명은 미동기. 세션 자동 인식이 두 규정을 동시 참조하면 혼선 가능.

### 개헌 청구 후보 3
1. **(CLAUDE.md:196 정정) ch7 "5조" → "6조"** — 2026-04-17 ch7 6조 신설 후 인덱스 미갱신. 법 본문과 인덱스 불일치. 개헌이 아닌 **단순 오탈자 수정/긴급 개정**으로 처리 가능 여부 쌍아 판단 요청. **심각도: 高**.
2. **(ch4 4조 확장) 정본 단일 원칙 시행 강제 장치** — PF 파일-폴더 이중화·session-logs 잔재 같은 구조적 위반을 사전·사후 검출하는 검사 절차(세션 시작/마감 Skill에 차터 점검 단계 추가) 신설. **심각도: 中**.
3. **(헌법 2조 1항 확장) 디바이스 맵 → "디바이스 × 런타임" 2차원** — 물리 디바이스 외 서비스 런타임(Cloud Run / CF Workers / Pages) 축 추가. Claude 4.7 Skills·Routines 시대에 에이전트 작업 좌표계가 "어느 런타임"도 필수. **심각도: 中**.

---

## ⚠️ 쌍아 확인 요청 목록

1. **CLAUDE.md L196 `ch7 … 5조`**: 현행화 놓친 단순 미스인지, 의도적 현 상태인지 — 정정 주체 결정 필요.
2. **`ops/session-logs/2026-04/` 9건 잔존 처리**: 구체계 잔재면 `sessions/2026-04/`로 통합 이관 여부.
3. **`PF_CDP.md` + `PF_CDP/` 정본 판정**: 현재 상위README vs 세부자료 분화 상태를 정식 패턴으로 승격할지, 일원화할지.
4. **`PF_SPREAD/` 폴더에 파일 1건만**: PF_SPREAD.md와 통합 여부.
5. **`ops/roadmaps/` 1건만**: PF 체계 도입으로 기능 흡수된 것인지 명시적 사문화 필요.
6. **MEMORY.md orphan `feedback_worktree_path.md`**: 포인터 추가 여부.
7. **ch1 1조 테이블 민아 환경 설명 vs MEMORY 판별 키워드**: 동기화 시점·방법.
8. **M4·M2 MEMORY_CHANGELOG 부재**: 위성 에센스 배포 상태 포함해 확인.

---

## Phase 1 통합 시 Track A와의 병합 권고 지점

- §4(Skills) · §10(4.7 갭 후보) → Track A의 Anthropic 공식 Skill 스키마와 **직접 매칭 1:1** 후 차이값 추출.
- §9(명명 매핑표) → Track A 결과의 공식 용어 열을 채워 GAP_MATRIX.md 최종판 완성.
- §11(위성 에센스) → Track B(업계 방향성)가 파악한 멀티 런타임 사례와 교차하여 런타임 축 설계에 반영.

---

> 본 감사는 2026-04-23 11:44~KST 기준 스냅샷. 이후 본진 변경 시 해당 섹션 재측정 필요.
