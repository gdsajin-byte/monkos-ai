---
type: report
task_id: TASK_20260222_막내4_README생성규칙설계
from: 막내4
to: 작가님
date: 2026-02-22 09:51 KST
result: success
---

# README 생성 규칙 설계 보고서

> **작성**: 막내4 | **일시**: 2026-02-22 09:51 KST
> **지시서**: TASK_20260222_막내4_README생성규칙설계
> **분류**: 설계 보고서 (코드/README 수정 없음)

---

## 1. README 필요 디렉토리 전수 목록

### 1.1 전수 조사 결과 요약

| 구분 | 수 |
|------|-----|
| 전체 디렉토리 (시스템 제외) | 155 |
| README 존재 | 19 |
| README 필요 (신규) | 42 |
| README 불필요 (에셋/빌드/백업/node_modules 등) | 94 |

### 1.2 기존 README 보유 디렉토리 (19개)

| # | 경로 | 줄 수 | 카테고리 | 품질 |
|---|------|------|---------|------|
| 1 | `/` (프로젝트 루트) | 165 | 루트 | ★★★ 상세 |
| 2 | `monkos_AI/` | 83 | 서비스 그룹 | ★★★ 상세 |
| 3 | `monkos_AI/portal/` | 99 | 서비스 루트 | ★★★ 상세 |
| 4 | `monkos_AI/idphoto-kr/` | 72 | 서비스 루트 | ★★★ 상세 |
| 5 | `monkos_AI/idphoto-jp/` | 77 | 서비스 루트 | ★★★ 상세 |
| 6 | `MONK_kr/` | 69 | 서비스 그룹 | ★★☆ 양호 |
| 7 | `MONK_kr/.context/` | 24 | 인프라 | ★☆☆ 최소 |
| 8 | `MONK_kr/cloudflare-workers/` | 91 | 서비스 루트 | ★★★ 상세 |
| 9 | `MONK_kr/cloudflare-workers-imagen/` | 45 | 서비스 루트 | ★★☆ 양호 |
| 10 | `backend/` | 95 | 서비스 루트 | ★★★ 상세 |
| 11 | `functions/` | 75 | 기능 폴더 | ★★☆ 양호 |
| 12 | `commands/` | 43 | 기능 폴더 | ★★☆ 양호 |
| 13 | `marketing/` | 86 | 기능 폴더 | ★★★ 상세 |
| 14 | `teams/` | 41 | 기능 폴더 | ★★☆ 양호 |
| 15 | `docs/corpus/` | 125 | 문서 폴더 | ★★★ 상세 |
| 16 | `docs/corpus/factory/` | 245 | 문서 폴더 | ★★★ 최상 |
| 17 | `apps/monk_imagen4/` | 85 | 레거시 서비스 | ★★☆ 양호 |
| 18 | `apps/monk_imagen4/backend/` | 308 | 레거시 서비스 | ★★★ 최상 |
| 19 | `apps/monk-cam/` | 87 | 레거시 서비스 | ★★☆ 양호 |

**품질 기준:**
- ★★★ (상세): 구조+배포+환경변수+엔드포인트+주의사항 포함
- ★★☆ (양호): 개요+구조+기본 사용법 포함
- ★☆☆ (최소): 한줄 설명 또는 목록만 존재

### 1.3 README 신규 필요 디렉토리 (42개, 우선순위별)

#### P0: 서비스 루트 — 즉시 필요 (1개)

| # | 경로 | 카테고리 | 레벨 | 사유 |
|---|------|---------|------|------|
| 1 | `MONK_kr/ai_lab/photolab/` | 서비스 루트 | L1 | 현재 리팩토링 작업장. README 없으면 새 에이전트 진입 불가 |

#### P1: 주요 기능/인프라 폴더 — Phase 2 (16개)

| # | 경로 | 카테고리 | 레벨 |
|---|------|---------|------|
| 1 | `docs/` | 문서 허브 루트 | L3 |
| 2 | `docs/infrastructure/` | 인프라 규격 | L3 |
| 3 | `docs/infrastructure/laws/` | 헌법/법률 | L3 |
| 4 | `docs/monkos/` | 서비스 문서 | L3 |
| 5 | `docs/rnd_2026/` | R&D 문서 | L3 |
| 6 | `monkos_AI/infrastructure/` | 배포 설정 | L2 |
| 7 | `MONK_kr/ai_lab/` | 기능 랩 | L2 |
| 8 | `MONK_kr/ai_lab/photolab/engine/` | 포토랩 백엔드 | L2 |
| 9 | `MONK_kr/monk_studio/` | 스튜디오 UI | L2 |
| 10 | `MONK_kr/Academy/` | 교육 콘텐츠 | L2 |
| 11 | `MONK_kr/b2b/` | B2B 모듈 | L2 |
| 12 | `monkos-ops/` | 전략 운영 허브 | L2 |
| 13 | `scripts/` | 자동화 스크립트 | L2 |
| 14 | `apps/` | 레거시 앱 모음 | L2 |
| 15 | `_saga/` | 지식 자산 | L2 |
| 16 | `backend/src/` | 소스코드 루트 | L2 |

#### P2: 보조 폴더 — Phase 3 (25개)

| # | 경로 | 카테고리 | 레벨 |
|---|------|---------|------|
| 1 | `docs/corpus/sessions/` | 세션 로그 | L3 |
| 2 | `docs/corpus/bwya/` | BWYA 자료 | L3 |
| 3 | `docs/corpus/claude_sessions/` | AI 세션 | L3 |
| 4 | `docs/corpus/gemini/` | Gemini 분석 | L3 |
| 5 | `docs/corpus/legacy/` | 아카이브 | L3 |
| 6 | `docs/corpus/notebookLM/` | AI 노트북 | L3 |
| 7 | `monkos-ops/01_전략/` | 전략 | L3 |
| 8 | `monkos-ops/02_리서치/` | 리서치 | L3 |
| 9 | `monkos-ops/03_개발/` | 개발 | L3 |
| 10 | `monkos-ops/04_문서/` | 문서 | L3 |
| 11 | `monkos-ops/05_공유/` | 공유 | L3 |
| 12 | `monkos-ops/06_로그/` | 로그 | L3 |
| 13 | `scripts/factory/` | 팩토리 | L2 |
| 14 | `scripts/monkos/` | 서비스 스크립트 | L2 |
| 15 | `scripts/tools/` | 유틸리티 | L2 |
| 16 | `marketing/content/` | 콘텐츠 | L3 |
| 17 | `marketing/n8n/` | 워크플로우 | L3 |
| 18 | `marketing/scripts/` | 마케팅 자동화 | L3 |
| 19 | `MONK_kr/ai_lab/image_pro/` | 이미지 프로 | L2 |
| 20 | `MONK_kr/ai_lab/lookbook/` | 룩북 | L2 |
| 21 | `MONK_kr/ai_lab/model_agency/` | 모델 에이전시 | L2 |
| 22 | `apps/MonkosChat/` | 챗 서비스 | L2 |
| 23 | `apps/photo-coach/` | 코칭 모듈 | L2 |
| 24 | `_saga/BWYA_Academy/` | BWYA 아카데미 | L3 |
| 25 | `_saga/kbeauty_sources/` | K-Beauty 소스 | L3 |

### 1.4 README 불필요 디렉토리 (제외 기준)

| 제외 유형 | 예시 | 수 |
|----------|------|-----|
| node_modules | `*/node_modules/` | ~10 |
| .git/.vscode/.claude | 시스템 | 3 |
| .wrangler | 빌드 캐시 | 3 |
| dist | 빌드 산출물 | 1 |
| images/assets/public | 에셋 전용 | ~35 |
| _backup/_legacy | 백업/레거시 스냅샷 | 5 |
| 4단계+ 깊이 폴더 | monkos-ops 하위, kbeauty_sources 개별 | ~37 |

---

## 2. 레벨별 표준 템플릿 (3종)

### 2.1 Level 1: 서비스 루트 README

**적용 대상**: 독립 배포 단위 (portal, idphoto-kr, idphoto-jp, photolab, cloudflare-workers 등)

```markdown
# {서비스명}

> {한줄 설명} | 배포: {플랫폼} | 도메인: **{도메인}**

## 개요

- **역할**: {서비스가 하는 일 1~2문장}
- **기술 스택**: {주요 프레임워크/런타임}
- **인증**: {인증 방식}

## 디렉토리 구조

```
{서비스명}/
├── {핵심 파일}    ← {역할}
├── {핵심 파일}    ← {역할}
└── {폴더}/        ← {역할}
```

## 주요 기능

| 기능 | 설명 | API/파일 |
|------|------|---------|
| {기능명} | {설명} | `{경로}` |

## 환경변수

| 변수 | 용도 |
|------|------|
| `{VAR}` | {설명} |

## 배포

```bash
# dev
{배포 명령어}

# prod (작가님/쌍아 승인 필요)
{배포 명령어}
```

| 항목 | prod | dev |
|------|------|-----|
| 서비스명 | `{prod}` | `{dev}` |
| 리전 | {리전} | {리전} |

## 관련 문서

- [{문서명}]({상대경로})

## 주의사항

- {헌법/법률 인용이 필요한 제약사항}
```

**필수 섹션**: 개요, 디렉토리 구조, 주요 기능, 배포, 주의사항
**선택 섹션**: 환경변수 (`.env` 있는 경우만), 관련 문서
**목표 줄 수**: 60~120줄

### 2.2 Level 2: 기능 폴더 README

**적용 대상**: 서비스 내 기능 모듈, 스크립트 폴더, 인프라 폴더

```markdown
# {폴더명}

> {한줄 설명}

## 파일 목록

| 파일 | 역할 | 비고 |
|------|------|------|
| `{파일명}` | {역할} | {활성/레거시/대기} |

## 의존 관계

- **상위**: {호출하는 서비스/모듈}
- **하위**: {이 폴더가 호출하는 것}
- **외부**: {API/DB 등 외부 의존}

## 사용법

```bash
{실행 명령어 또는 import 예시}
```

## 관련 명세

- [{SPEC 또는 관련 문서}]({경로})
```

**필수 섹션**: 파일 목록
**선택 섹션**: 의존 관계, 사용법, 관련 명세
**목표 줄 수**: 20~60줄

### 2.3 Level 3: 문서 폴더 README

**적용 대상**: docs/ 하위, monkos-ops/ 하위, corpus/ 하위 등

```markdown
# {폴더명}

> {이 폴더에 들어가는 문서 유형}

## 파일명 규칙

| 패턴 | 예시 | 설명 |
|------|------|------|
| `{패턴}` | `{예시}` | {설명} |

## 문서 목록

| 파일 | 날짜 | 요약 |
|------|------|------|
| `{파일명}` | {날짜} | {1줄 요약} |

## 관련 폴더

- [{폴더명}]({경로}) — {관계 설명}
```

**필수 섹션**: 문서 목록 (또는 "문서 유형" 설명으로 대체)
**선택 섹션**: 파일명 규칙, 관련 폴더
**목표 줄 수**: 15~40줄

### 2.4 템플릿 적용 기준

| 판단 조건 | → 레벨 |
|----------|--------|
| `deploy.sh` 또는 `Dockerfile` 존재 | L1 (서비스 루트) |
| `server.js` 또는 `package.json` 존재 (배포 단위 아닌 모듈) | L2 (기능 폴더) |
| `.md` 파일이 3개 이상 (문서 폴더) | L3 (문서 폴더) |
| 위 어디에도 해당 안 됨 | L2 (기능 폴더) 기본값 |

---

## 3. 자동 생성/갱신 규칙

### 3.1 자동 생성 트리거 (3건)

#### 규칙 1: 새 폴더 생성 시 README 스켈레톤

```
트리거: PostToolUse (Write/Bash) 훅 — 새 디렉토리 감지
조건:
  - 제외 패턴 미해당 (node_modules, .git, images, assets, public, _backup, _legacy, dist)
  - 부모 디렉토리가 이미 README 보유
동작:
  1. 레벨 판정 (§2.4 기준)
  2. 해당 레벨 스켈레톤 생성 (섹션 헤더만, 내용은 TODO)
  3. 생성 보고: "[daemon] README 스켈레톤: {경로}"
예외: 에이전트가 명시적으로 "README 불필요" 표시한 폴더
```

**스켈레톤 예시 (L2):**
```markdown
# {폴더명}

> TODO: 한줄 설명

## 파일 목록

| 파일 | 역할 |
|------|------|
| — | — |
```

#### 규칙 2: 배포 성공 시 서비스 README 버전 갱신

```
트리거: PostToolUse (Bash) 훅 — `gcloud run deploy` 또는 `wrangler deploy` 성공 감지
조건: 해당 서비스 디렉토리에 README.md 존재
동작:
  1. README 내 "## 배포" 섹션의 "최종 배포" 행 갱신
  2. 형식: `최종 배포: {YYYY-MM-DD HH:MM KST} by {에이전트}`
  3. 커밋 태그: [readme] 자동
예외: dev 배포는 갱신 안 함 (prod만)
```

#### 규칙 3: SPEC 파일 생성 시 관련 README에 링크 추가

```
트리거: PostToolUse (Write) 훅 — docs/specs/ 또는 docs/monkos/SPEC_*.md 감지
조건: SPEC의 service 필드에 해당하는 서비스 README 존재
동작:
  1. 서비스 README 내 "## 관련 문서" 섹션에 링크 행 추가
  2. 중복 체크 (이미 있으면 스킵)
```

### 3.2 자동 갱신 트리거 (2건)

#### 규칙 4: 문서 폴더 README 최신 목록 갱신

```
트리거: PostToolUse (Write) 훅 — docs/ 하위에 .md 파일 생성/삭제 감지
조건: 해당 폴더에 L3 README 존재
동작:
  1. "## 문서 목록" 테이블 재생성 (파일명, 수정일, YAML title 또는 1행)
  2. 최신순 정렬
  3. 최대 20건 표시 (초과 시 "외 N건" 표기)
```

#### 규칙 5: 파일 목록 드리프트 경고

```
트리거: 데몬 주기 실행 (매 세션 시작 시)
조건: L2 README 보유 폴더
동작:
  1. README "## 파일 목록" 테이블 vs 실제 파일 비교
  2. 불일치 발견 시: README 상단에 WARNING 주석 추가
     `<!-- WARNING: 파일 목록 드리프트 감지 ({날짜}). {추가된 파일 N개}, {삭제된 파일 M개} -->`
  3. 세션로그에 경고 기록
주의: 자동 수정하지 않음 (경고만). 에이전트가 수동 갱신
```

### 3.3 자동화 제외 목록

| 경로 패턴 | 사유 |
|----------|------|
| `*/node_modules/*` | 패키지 관리자 영역 |
| `*/.git/*` | Git 내부 |
| `*/images/*`, `*/assets/*`, `*/public/*` | 에셋 전용 (코드 없음) |
| `*/_backup*`, `*/_legacy*` | 스냅샷 (변경 불가) |
| `*/dist/*`, `*/.wrangler/*` | 빌드 산출물 |
| `_saga/kbeauty_sources/*` (개별 하위) | 이미지 소스 폴더 (상위 README로 충분) |

### 3.4 실행 주체

| 규칙 | 실행 주체 | 타이밍 |
|------|----------|--------|
| 규칙 1 (스켈레톤) | 데몬 (소넷이/철창이) | PostToolUse 훅 |
| 규칙 2 (배포 갱신) | 데몬 | PostToolUse 훅 |
| 규칙 3 (SPEC 링크) | 데몬 | PostToolUse 훅 |
| 규칙 4 (문서 목록) | 데몬 | PostToolUse 훅 |
| 규칙 5 (드리프트 경고) | 데몬 | 세션 시작 시 |

---

## 4. 현재 README 현황 vs 필요 목록 (갭 분석)

### 4.1 갭 분석 테이블

| 경로 | 현황 | 필요 레벨 | 우선순위 | 갭 |
|------|------|----------|---------|-----|
| `/` (루트) | ★★★ 165줄 | L1 | — | ✅ 충족 |
| `monkos_AI/` | ★★★ 83줄 | L2 | — | ✅ 충족 |
| `monkos_AI/portal/` | ★★★ 99줄 | L1 | — | ✅ 충족 |
| `monkos_AI/idphoto-kr/` | ★★★ 72줄 | L1 | — | ✅ 충족 |
| `monkos_AI/idphoto-jp/` | ★★★ 77줄 | L1 | — | ✅ 충족 |
| `monkos_AI/infrastructure/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `MONK_kr/` | ★★☆ 69줄 | L2 | — | ✅ 충족 |
| `MONK_kr/ai_lab/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| **`MONK_kr/ai_lab/photolab/`** | **❌ 없음** | **L1** | **P0** | **🔴 긴급** |
| `MONK_kr/ai_lab/photolab/engine/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `MONK_kr/cloudflare-workers/` | ★★★ 91줄 | L1 | — | ✅ 충족 |
| `MONK_kr/cloudflare-workers-imagen/` | ★★☆ 45줄 | L1 | — | ⚠️ 보강 권장 |
| `MONK_kr/monk_studio/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `MONK_kr/Academy/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `MONK_kr/b2b/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `backend/` | ★★★ 95줄 | L1 | — | ✅ 충족 |
| `backend/src/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `functions/` | ★★☆ 75줄 | L2 | — | ✅ 충족 |
| `commands/` | ★★☆ 43줄 | L2 | — | ✅ 충족 |
| `marketing/` | ★★★ 86줄 | L2 | — | ✅ 충족 |
| `teams/` | ★★☆ 41줄 | L2 | — | ✅ 충족 |
| `scripts/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `monkos-ops/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `apps/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `_saga/` | ❌ 없음 | L2 | P1 | 🔴 신규 필요 |
| `docs/` | ❌ 없음 | L3 | P1 | 🔴 신규 필요 |
| `docs/infrastructure/` | ❌ 없음 | L3 | P1 | 🔴 신규 필요 |
| `docs/infrastructure/laws/` | ❌ 없음 | L3 | P1 | 🔴 신규 필요 |
| `docs/monkos/` | ❌ 없음 | L3 | P1 | 🔴 신규 필요 |
| `docs/rnd_2026/` | ❌ 없음 | L3 | P1 | 🔴 신규 필요 |
| `docs/corpus/` | ★★★ 125줄 | L3 | — | ✅ 충족 |
| `docs/corpus/factory/` | ★★★ 245줄 | L3 | — | ✅ 충족 |
| `docs/corpus/sessions/` | ❌ 없음 | L3 | P2 | 🔴 신규 필요 |
| `docs/corpus/bwya/` | ❌ 없음 | L3 | P2 | 🔴 신규 필요 |
| `docs/corpus/claude_sessions/` | ❌ 없음 | L3 | P2 | 🔴 신규 필요 |
| `docs/corpus/gemini/` | ❌ 없음 | L3 | P2 | 🔴 신규 필요 |
| `docs/corpus/legacy/` | ❌ 없음 | L3 | P2 | 🔴 신규 필요 |
| `docs/corpus/notebookLM/` | ❌ 없음 | L3 | P2 | 🔴 신규 필요 |

### 4.2 갭 요약

| 구분 | 수 | 비율 |
|------|-----|------|
| ✅ 충족 (README 존재 + 품질 양호) | 18 | 30% |
| ⚠️ 보강 권장 (존재하나 내용 부족) | 1 | 2% |
| 🔴 P0 신규 필요 | 1 | 2% |
| 🔴 P1 신규 필요 | 16 | 26% |
| 🔴 P2 신규 필요 | 25 | 41% |

---

## 5. 우선순위별 생성 로드맵

### Phase 0: 긴급 (P0) — 즉시

| 순번 | 대상 | 레벨 | 담당 | 예상 줄 수 |
|------|------|------|------|-----------|
| 1 | `MONK_kr/ai_lab/photolab/` | L1 | 막내 | ~80줄 |

**사유**: 현재 리팩토링 작업장. 모든 막내가 진입하는 곳인데 README 없음. 에이전트 온보딩 병목.

### Phase 1: 핵심 인프라/기능 (P1) — 1주 내

**1차 (서비스/기능 폴더 — L1/L2):**

| 순번 | 대상 | 레벨 | 예상 줄 수 |
|------|------|------|-----------|
| 1 | `docs/` | L3 | ~30줄 |
| 2 | `docs/infrastructure/` | L3 | ~25줄 |
| 3 | `docs/infrastructure/laws/` | L3 | ~30줄 |
| 4 | `docs/monkos/` | L3 | ~30줄 |
| 5 | `docs/rnd_2026/` | L3 | ~20줄 |
| 6 | `MONK_kr/ai_lab/` | L2 | ~40줄 |
| 7 | `MONK_kr/ai_lab/photolab/engine/` | L2 | ~35줄 |
| 8 | `monkos_AI/infrastructure/` | L2 | ~30줄 |
| 9 | `scripts/` | L2 | ~30줄 |
| 10 | `monkos-ops/` | L2 | ~40줄 |
| 11 | `apps/` | L2 | ~35줄 |
| 12 | `_saga/` | L2 | ~25줄 |
| 13 | `MONK_kr/monk_studio/` | L2 | ~30줄 |
| 14 | `MONK_kr/Academy/` | L2 | ~25줄 |
| 15 | `MONK_kr/b2b/` | L2 | ~25줄 |
| 16 | `backend/src/` | L2 | ~30줄 |

**소계**: 16개 README, ~500줄

### Phase 2: 보조 폴더 (P2) — 2주 내

| 순번 | 대상 | 레벨 | 예상 줄 수 |
|------|------|------|-----------|
| 1~6 | `docs/corpus/` 하위 6개 | L3 | ~120줄 (합계) |
| 7~12 | `monkos-ops/01~06_*/` 6개 | L3 | ~120줄 |
| 13~15 | `scripts/factory/`, `scripts/monkos/`, `scripts/tools/` | L2 | ~75줄 |
| 16~18 | `marketing/content/`, `marketing/n8n/`, `marketing/scripts/` | L3 | ~60줄 |
| 19~21 | `MONK_kr/ai_lab/` 하위 3개 (image_pro, lookbook, model_agency) | L2 | ~75줄 |
| 22~24 | `apps/` 하위 3개 (MonkosChat, photo-coach, etc.) | L2 | ~75줄 |
| 25 | `_saga/BWYA_Academy/`, `_saga/kbeauty_sources/` | L3 | ~40줄 |

**소계**: 25개 README, ~565줄

### 전체 로드맵 요약

| Phase | README 수 | 예상 총 줄 수 | 에이전트 투입 |
|-------|----------|--------------|-------------|
| Phase 0 (즉시) | 1 | ~80줄 | 막내 1명 |
| Phase 1 (1주) | 16 | ~500줄 | 막내 2~3명 병렬 |
| Phase 2 (2주) | 25 | ~565줄 | 막내 2명 병렬 |
| **합계** | **42** | **~1,145줄** | — |

### 병렬 작업 분배 제안

README 생성은 파일 충돌 위험이 극히 낮음 → 막내 병렬 투입 적합.

| 막내 | 담당 영역 | README 수 |
|------|----------|----------|
| 막내 A | `docs/` 계열 (L3 위주) | ~15개 |
| 막내 B | `MONK_kr/` + `_saga/` 계열 | ~12개 |
| 막내 C | `monkos-ops/` + `scripts/` + `apps/` 계열 | ~15개 |

---

## 6. 법률 반영 제안

### 6.1 법률 제4장 (문서/폴더 구조) — 신규 3조

> **제3조: README 표준**
>
> 1. 모든 서비스 루트, 기능 폴더, 문서 폴더에 README.md를 배치한다.
> 2. README는 3단계 레벨(서비스/기능/문서)로 구분하며, 각 레벨 표준 템플릿을 따른다.
> 3. 레벨 판정 기준:
>    - L1: `deploy.sh` 또는 `Dockerfile` 존재 → 서비스 루트
>    - L2: `package.json` 존재 또는 기능 모듈 → 기능 폴더
>    - L3: `.md` 파일 3개 이상 → 문서 폴더
> 4. 제외 대상: node_modules, .git, images, assets, public, dist, _backup, _legacy
> 5. 근거: 에이전트 온보딩 시 "이 폴더는 무엇인가"의 즉답 필요
> 6. 위반 시: 새 에이전트/팀원이 폴더 용도 파악 불가 → 오작업 위험

### 6.2 법률 제4장 — 신규 4조

> **제4조: README 자동 관리**
>
> 1. 새 폴더 생성 시 데몬이 README 스켈레톤을 자동 생성한다 (제외 패턴 제외).
> 2. prod 배포 성공 시 서비스 README의 "최종 배포" 정보를 자동 갱신한다.
> 3. 문서 폴더 README의 "문서 목록" 섹션은 파일 변경 시 자동 갱신한다.
> 4. 파일 목록 드리프트 감지 시 WARNING 주석을 삽입하고 세션로그에 경고한다.
> 5. 자동 생성/갱신 규칙의 실행 주체: 데몬 (소넷이/철창이)

### 6.3 법률 제7장 (막내 행동 강령) 보완 제안

> **기존 조항 보완**: 새 폴더 생성 시 README 스켈레톤 포함 여부를 보고에 명시할 것

### 6.4 헌법 영향 확인

본 설계는 헌법과 충돌하지 않음.
- 제2조 (완료 보고) — README 자동 갱신은 보고 형식에 영향 없음
- 제5조 (역할 체계) — 데몬 역할 확장이나 쌍아→막내 흐름 변경 없음
- 제8조 (파괴적 명령) — README 생성은 비파괴적 (기존 파일 수정 없음)

---

## 7. 발견 사항

### 7.1 기존 README 품질 편차

- **최상** (308줄, apps/monk_imagen4/backend): 레거시인데 가장 상세 → 역설적으로 활성 서비스보다 문서화 잘 됨
- **상세** (99줄, portal): 배포+구조+환경변수+엔드포인트 완비 → 좋은 템플릿 모델
- **최소** (24줄, MONK_kr/.context): 목록만 나열 → L2 기준 미달

### 7.2 `MONK_kr/cloudflare-workers-imagen/` 보강 필요

45줄로 양호 수준이나, 같은 CF Workers인 `cloudflare-workers/` (91줄)에 비해 배포/환경변수 정보 부족.

### 7.3 monkos-ops/ 하위 구조가 매우 깊음

`monkos-ops/01_전략/decisions/`, `monkos-ops/05_공유/hansong/inbox/` 등 4~5단계 깊이. 상위 README가 하위 구조를 설명하면 개별 README 생략 가능 → Phase 2에서 상위 6개만 생성 권장.

### 7.4 _saga/ 는 지식 자산 특수 영역

코드가 아닌 학술/이미지 소스 모음. README 형태도 "파일 목록" 보다는 "컬렉션 설명"이 적합. L3 변형 템플릿 검토 필요.

---

## 완료 조건 체크

- [x] README 필요 디렉토리 전수 목록 (§1, 42개 신규 필요)
- [x] 레벨별 표준 템플릿 3종 — L1 서비스/L2 기능/L3 문서 (§2)
- [x] 자동 생성/갱신 규칙 5건 (§3)
- [x] 현재 vs 필요 갭 분석 테이블 (§4)
- [x] 우선순위별 생성 로드맵 — Phase 0/1/2 (§5)
- [x] 법률 반영 제안 — ch4 3~4조 신설 (§6)

---

## 핵심요약

> README 보유 **19개** / 신규 필요 **42개** (P0: 1개, P1: 16개, P2: 25개). 표준 템플릿 **3종** (L1 서비스 60~120줄 / L2 기능 20~60줄 / L3 문서 15~40줄). 자동 생성/갱신 규칙 **5건** (스켈레톤 자동생성, 배포 갱신, SPEC 링크, 문서목록 갱신, 드리프트 경고). 법률 제4장에 3~4조 신설 제안. 헌법 충돌 없음.
