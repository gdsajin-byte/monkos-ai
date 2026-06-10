---
type: report
date: 2026-06-10
device: iMac
agent: 막내2
portfolio: PF_MONK_OS
status: 완료
---

# 문서 위계 재설계 삼권 분석 — 행정

**[2026-06-10 15:51 KST] iMac/막내2 → 작가님**

> "실제로 어떻게 작동하는가" — rules 9개·skills 14개 전수 점검, 이관 판정, 자동 로딩 예산 산출.

---

## 1. rules → skills 이관 판정

### 판정 기준

| 기준 | 판정 |
|------|------|
| 어떤 작업이든 위반하면 사고(보안·파괴·기밀) | **rules 유지** |
| 특정 행위(배포·PF·세션·CDP 등) 시에만 필요 | **skills 이관** |
| 헌법/다른 rules와 중복 | **삭제** |

### 전수 판정표

| # | 파일 | 줄 | 트리거 | 판정 | 사유 | 이관 시 skills 파일명 |
|---|------|------|--------|------|------|---------------------|
| 1 | `git-safety.md` | 23 | `globs: **` (전역) | **rules 유지** | 파괴적 명령·시크릿 보호 — 모든 작업에서 위반 시 사고. 전역 글롭 유지 적격 | — |
| 2 | `deployment.md` | 44 | `globs: **/deploy.sh, **/Dockerfile` | **rules 유지** | deploy.sh 경유 강제는 위반 시 유령 서비스 발생(보안·비용). 배포 파일 접근 시 자동 로딩 적절 | — |
| 3 | `data-access.md` | 41 | `paths` (credits.sh 등) | **rules 유지** | Firestore 직접 접근 금지, 감사 로그 강제 — 위반 시 고객 데이터 사고 | — |
| 4 | `makne-guard.md` | 31 | `paths` (orders, completions) | **rules 유지** | 막내 행동 강령 핵심 — PF 읽기 의무·에스컬레이션·금지 사항. 지시서 접근 시 자동 로딩 적절 | — |
| 5 | `session-log.md` | 38 | `globs: sessions/**, reports/**, orders/**` | ⚠️ **이관 검토** | 타임스탬프·파일명 패턴은 세션 로그 작업 시에만 필요. 보안/파괴 리스크 없음. **단, 위반 시 기록 정합성 붕괴 → rules 유지가 안전** | — |
| 6 | `pf-ops.md` | 39 | `globs: portfolios/**` | ⚠️ **이관 검토** | PF append-only·YAML 규칙은 PF 접근 시에만 필요. **단, 위반 시 PF 히스토리 파괴 → rules 유지가 안전** | — |
| 7 | `references.md` | 21 | `globs: governance/**, monkos-ops/**` | **삭제 가능** | 6개 참조 파일 위치 안내만 수행. 보안·파괴 리스크 제로. CLAUDE.md 법률 인덱스에 이미 유사 정보 존재. 글롭 범위가 넓어 불필요 로딩 유발 | — |
| 8 | `cdp-browser.md` | 125 | `paths` (cdp 관련) | **skills 이관** | CDP 브라우저 제어 상세 — 특정 행위(브라우저 자동화) 시에만 필요. 125줄은 rules 최대 → 자동 로딩 비용 큼. 보안·파괴 리스크 없음 | `cdp-browser.md` (기존 `cdp-troubleshoot.md`와 통합 가능) |
| 9 | `portal_seo.md` | 72 | `paths` (portal, idphoto) | **skills 이관** | 포털 v3/v4 현황·SEO 상태 — 순수 작업 컨텍스트. rules에 있을 이유 없음. 72줄 절감 | `portal-context.md` |

### 판정 요약

| 판정 | 건수 | 줄 합계 | 파일 |
|------|------|---------|------|
| rules 유지 | 4건 | 139줄 | git-safety, deployment, data-access, makne-guard |
| rules 유지 (안전 우선) | 2건 | 77줄 | session-log, pf-ops |
| skills 이관 | 2건 | 197줄 | cdp-browser, portal_seo |
| 삭제 가능 | 1건 | 21줄 | references |

---

## 2. skills 현행 점검

### 2-1. 조항번호 참조 정합성

| # | 파일 | 문제 참조 | 올바른 참조 | 심각도 |
|---|------|----------|------------|--------|
| 1 | `makne-finish.md` (27행) | `헌법 제1조 2항` (보고 형식) | **헌법 제3조 2항** (적립 — 분산 기록·완료 보고 의무) | **중간** — 구 7조 체계 잔재 |
| 2 | `makne-finish.md` (71행) | `헌법 제1조 2항` (터미널 보고) | **헌법 제3조 2항** | 상동 |
| 3 | `session-end.md` (24행) | `헌법 1조 1항` (타임스탬프) | **헌법 제3조 1항** (적립 — 타임스탬프 절대 준수) | **중간** — 구 7조 체계 잔재 |

> 참고: CLAUDE.md 개정 이력에 "2026-03-25 이전 문서의 '헌법 N조' 참조는 구(舊) 7조 체계 기준이다" 명기. makne-finish.md 최종 수정일 05-09, session-end.md 최종 수정일 05-09 — 3/25 이후에 작성되었으므로 단순 미갱신.

### 2-2. rules 승격 후보

| 파일 | 승격 사유 | 판정 |
|------|----------|------|
| `escalation.md` | 에러 반복·헌법 충돌 시 안전장치. 모든 에이전트에 적용 | ⚠️ 승격 검토 — 다만 현재 트리거(`/에스컬레이션`)가 수동 호출이므로 rules의 자동 로딩과 성격이 다름. **현행 유지** |
| 나머지 13개 | 특정 행위 시에만 필요 | 현행 유지 |

### 2-3. 사문화 점검

| 파일 | 판정 | 근거 |
|------|------|------|
| 14개 전체 | **전부 활성** | 세션 라이프사이클(3개), 작업 실행(3개), PF 관리(2개), 배포(2개), 모니터링(2개), CDP(1개), 인프라(1개) — 빈틈 없이 운용 중 |

---

## 3. 자동 로딩 예산 산출

### 현행 (매 세션 자동 로딩)

| 구분 | 로딩 조건 | 줄 | 비고 |
|------|----------|------|------|
| CLAUDE.md | 항상 | 199 | 헌법 5축 + 법률 인덱스 |
| rules (전역) | 항상 | 23 | git-safety (`globs: **`) |
| rules (조건부) | 파일 접근 시 | 411 | 나머지 8개 |
| MEMORY.md | 항상 | 146 | 디바이스 행동강령 |
| skills | `/명령어` 호출 시 | 649 | 14개 (수동 호출) |
| **항상 로딩 합계** | | **368** | CLAUDE.md + git-safety + MEMORY |
| **최대 로딩** | | **1,428** | 전부 로딩 시 |

### 재설계 후 시뮬레이션

**시나리오 A: 최소 이관 (cdp-browser + portal_seo → skills, references 삭제)**

| 구분 | 현행 줄 | 재설계 후 줄 | 절감 |
|------|---------|------------|------|
| CLAUDE.md | 199 | 199 | 0 |
| rules | 434 | 216 | **-218** |
| MEMORY.md | 146 | 146 | 0 |
| skills | 649 | 846 | +197 (이관분) |
| **합계 (항상 로딩)** | **368** | **368** | **0** |
| **합계 (조건부 포함)** | **1,428** | **1,407** | **-21** |

- 항상 로딩은 변화 없음 (git-safety는 전역 유지)
- 조건부 로딩에서 21줄 절감 (references 삭제분)
- 핵심 효과: cdp-browser 125줄이 CDP 관련 파일 접근 시에만 → skills 호출 시에만으로 전환. portal_seo 72줄도 동일

**시나리오 B: 적극 이관 (session-log + pf-ops도 이관)**

| 구분 | 현행 줄 | 재설계 후 줄 | 절감 |
|------|---------|------------|------|
| CLAUDE.md | 199 | 199 | 0 |
| rules | 434 | 139 | **-295** |
| MEMORY.md | 146 | 146 | 0 |
| skills | 649 | 923 | +274 (이관분+삭제분 제외) |
| **합계 (항상 로딩)** | **368** | **368** | **0** |
| **합계 (조건부 포함)** | **1,428** | **1,407** | **-21** |

- 총 줄 수 절감은 동일 (삭제 = references 21줄만)
- **하지만**: session-log와 pf-ops를 skills로 이관하면, 세션 로그 파일을 만질 때 자동으로 규칙을 상기시키는 안전장치가 사라짐. 수동 호출 의존이 됨.
- **권고: 시나리오 A 채택**. B는 리스크 대비 절감 이점 없음.

---

## 4. 이관 실행 계획

### 4-1. 이관 대상 3건

| # | 현행 | 조치 | 대상 | 의존성 |
|---|------|------|------|--------|
| 1 | `rules/cdp-browser.md` (125줄) | skills 이관 | `skills/cdp-browser.md` 신설 (기존 `cdp-troubleshoot.md`와 통합 검토) | cdp-troubleshoot.md가 cdp-browser.md를 참조 → 통합이 자연스러움 |
| 2 | `rules/portal_seo.md` (72줄) | skills 이관 | `skills/portal-context.md` 신설 | 없음 (독립) |
| 3 | `rules/references.md` (21줄) | 삭제 | — | CLAUDE.md 법률 인덱스에 이미 참조 테이블 존재. 잔여 정보(코딩 표준 등 경로)는 필요 시 skills 또는 법률에서 참조 |

### 4-2. 글롭 vs paths 문제

현행 rules 중 4개가 `paths`를 사용하고 있음 (cdp-browser, data-access, makne-guard, portal_seo). Claude Code 공식 frontmatter 키는 `globs`이다.

| 파일 | 현행 키 | 문제 여부 |
|------|---------|----------|
| cdp-browser.md | `paths` | skills 이관으로 해소 |
| data-access.md | `paths` | `globs`로 변환 필요 |
| makne-guard.md | `paths` | `globs`로 변환 필요 |
| portal_seo.md | `paths` | skills 이관으로 해소 |

> `paths`가 실제로 Claude Code에서 동작하는지 검증 필요. 동작하지 않으면 이 4개 rules는 **사실상 수동 로딩 상태**일 가능성 있음 (= 자동 트리거되지 않음).

### 4-3. skills 이관 시 동일 효과 확보

rules의 `globs`는 해당 파일 접근 시 자동 로딩. skills는 `/명령어` 수동 호출.

**차이**: rules → 무조건 로딩 (방어적). skills → 호출해야 로딩 (능동적).

이관 대상(cdp-browser, portal_seo)은 "위반 시 사고"가 아닌 "작업 컨텍스트" 성격이므로, 수동 호출로 전환해도 리스크 없음.

### 4-4. 이관 순서

1. **references.md 삭제** — 의존 없음, 즉시 가능
2. **portal_seo.md → skills/portal-context.md** — 독립, 즉시 가능
3. **cdp-browser.md → skills/cdp-browser.md** — cdp-troubleshoot.md 통합 여부 결정 후
4. **조항번호 수정 3건** — makne-finish.md 2건 + session-end.md 1건
5. **paths → globs 변환** — data-access.md, makne-guard.md (동작 검증 선행)

### 4-5. 이관 후 검증 방법

| 검증 항목 | 방법 |
|-----------|------|
| rules 삭제 후 자동 로딩 감소 확인 | 세션 시작 시 rules 로딩 목록 확인 |
| skills 호출 정상 동작 | `/CDP장애진단`, `/포털컨텍스트` 등 호출 테스트 |
| 조항번호 정합 | 수정된 3건에서 참조하는 헌법 조항이 현행 5축과 일치하는지 대조 |
| paths → globs 동작 | data-access.md 글롭 변환 후 credits.sh 접근 시 자동 로딩 확인 |

---

## 5. 부록: 현행 구조 한눈에 보기

### 문서 위계 4계층 × 물리 위치

```
[항상 로딩 — 368줄]
├── CLAUDE.md (199줄) ← 헌법 (커널)
├── rules/git-safety.md (23줄) ← globs: ** (전역 안전장치)
└── MEMORY.md (146줄) ← 디바이스 행동강령

[조건부 로딩 — rules 411줄]
├── deployment.md (44줄) ← deploy.sh, Dockerfile 접근 시
├── data-access.md (41줄) ← credits.sh 등 접근 시
├── session-log.md (38줄) ← sessions/reports/orders 접근 시
├── pf-ops.md (39줄) ← portfolios 접근 시
├── makne-guard.md (31줄) ← orders/completions 접근 시
├── cdp-browser.md (125줄) ← ⚠️ skills 이관 권고
├── portal_seo.md (72줄) ← ⚠️ skills 이관 권고
└── references.md (21줄) ← ⚠️ 삭제 권고

[수동 호출 — skills 649줄]
└── 14개 skills (세션·PF·배포·모니터링·CDP·인프라)
```

---

*파일 수정 없음. 분석·보고 전용.*
