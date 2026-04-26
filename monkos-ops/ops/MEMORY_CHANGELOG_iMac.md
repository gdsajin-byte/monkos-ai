# MEMORY.md 출납 로그 — iMac

> 성격: iMac MEMORY.md의 변경 이력. 무엇을 넣고, 무엇을 뺐는지 추적.
> 원칙: 남은 것은 유추 가능하나, 덜어낸 것은 기록 없으면 소멸한다.
> 정본: `monkos-ops/ops/MEMORY_CHANGELOG_iMac.md` (Git 추적)
> MEMORY.md 위치: `~/.claude/projects/{project}/memory/` (로컬, Git 밖)

---

## 2026-04-23 14:45 KST — "역할 자동 인식" 섹션 강화 (Anthropic 제품 2개 구조 반영)

### 배경
- 작가님 2026-04-23 14:40 KST 구조 고지
- Anthropic 제품 계보: **Claude**(일반) ≠ **Claude Code**(개발자) 2개 별개 제품
- 같은 Opus 뇌, 다른 제품·세팅. 구글 Code Assist / ChatGPT Code 대응 격
- 민아·쌍아·막내는 전부 Claude Code 제품 — 활성 위치(Surface)에 따라 페르소나 분기
- 철창이(Chat 모드) / 코웍이(Cowork 모드)는 Claude 제품이며 Claude Code 아님

### 추가 (MEMORY.md "역할 자동 인식" 섹션)
- "Anthropic 제품 2개" 서브섹션 신설
- "MONK 에이전트 자동 판별" 서브섹션에 각 에이전트의 Claude Code 활성 위치 명시
- "Claude 제품(Claude Code 아님) 페르소나" 서브섹션에 철창이·코웍이 정의
- "Surface 혼동 주의" 서브섹션 — "Claude Code" 용어 이중 의미 경고

### 갱신 전/후 줄 수
- 변경 전: 166줄
- 변경 후: 183줄 (200줄 캡 내 안전)

### 근거 문서
- `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_SURFACE_claudeai_UI.md` §12 (2026-04-23 민아 실측 + 쌍아 정정 append)
- `monkos-ops/ops/portfolios/PF_MONK_OS/roadmap/ROADMAP_portable_agent_os.md` §2.5 (Cross-Surface 아키텍처 재설계)

---

## 2026-04-19 19:29 KST — 메모리 2건 신설 (4.7 산업 분석 + 철학)

- **추가** `memory/project_claude47_industry_analysis.md` — 4.7 산업 분석: IPO·거버넌스충돌·인프라확장 배경 변수. "수치가 아닌 철학의 문제" 프레임. 블로그 핵심 근거
- **추가** `memory/user_philosophy_tech_humanities.md` — 인문·기술 비구분 철학: "자연어가 코드인 시대", 에이전트 본질 = 문화 체득, 미필적 고의 프레임. 블로그/성명 토대
- **갱신** MEMORY.md 외장 메모리 인덱스 2건 추가

## 2026-04-11 19:30 KST — 메모리 2건 신설 (PHOTOPRO 진단 세션 결과)

### 추가
1. **`feedback_no_range_auto_mapping.md`** (피드백) — 범위 자동 매핑 금지
   - 근거: 2026-04-11 쌍아 자기 과오 4건 공통 패턴 (PF 자동 매핑 / 막내 보고서 범위 이탈 통과 / 프레이밍 불일치 / 봉인 누락)
   - 매 세션 첫 30초 의식 정의: "어제 봉인 완결 체크" + "범위 매핑 검토"
   - 헌법 5조 4항 "기능 적합성 검토" 절차화
   - MEMORY.md 인덱스: 피드백 메모리 영역에 추가

2. **`project_advertising_organic_booster.md`** ⭐ (프로젝트) — 광고 = 오가닉 부스터 전략 프레임
   - 근거: 2026-04-11 17:15 KST 작가님 직접 명시
   - "광고는 오가닉을 키우기 위한 보조수단이지. 그런데 그렇게 광고를 함에도 오가닉의 맨 끝 23페이지에도 안 뜨는 것은 심각한 거야"
   - PHOTOPRO 진단 + B안 프레이밍 + SEO 우선순위 결정의 1차 원리
   - "광고 → 오가닉 자산" 전환 파이프 검토가 매 광고/SEO 결정의 첫 단계
   - MEMORY.md 인덱스: 외장 메모리 영역에 추가

### 변경 없음
- 200줄 캡 미접촉 (현재 153줄)
- 다른 섹션 무변경

### 후속 적립 후보 (다음 세션 또는 별도 시간)
- `feedback_military_discipline.md` — 작가님 군기 비유 (작은 룰 누락이 멀쩡한 것 무너뜨림)
- `project_cashflow_first_cause.md` — 캐시플로우 1차 인과 (피로 프레임 금지, 휴식 제안 금지)

---

## 2026-02-24 11:16 KST — 대규모 압축 (201줄 → 74줄)

### 근거
- CONTEXT_ARCHITECTURE.md §4 확립: "세션 시작 시, 파일을 열기 전에, 에이전트가 알아야 하는 OS만 남긴다"
- M1 선례: MEMORY_CHANGELOG_M1.md (233→47줄 압축 완료)
- 지시서: TASK_20260224_막내1_iMac_MEMORY_압축.md (쌍아 → 막내1)

### 삭제 항목 (도메인 지식 — 코드/docs에 존재)

| 섹션 | 줄 수 | 삭제 사유 | 원본 소재지 |
|------|-------|----------|-----------|
| 상세 기술명세 포인터 (amendment.md) | 1 | 깨진 링크 (governance/ 이행으로 경로 변경) | `governance/constitution/amendment.md` |
| Gemini Live API 핵심 | 12 | 인프라 도메인. 코드/docs에 있음 | `monkos_AI/idphoto-kr/` 서버 코드 |
| Imagen I2I 생성 (증명사진) | 9 | 인프라 도메인. 코드에 있음 | `monkos_AI/idphoto-kr/` 서버 코드, `functions/api/photo.js` |
| monkos_AI 서비스 체계 | 16 | 인프라 도메인. 코드/배포 설정에 있음 | `monkos_AI/` 각 서비스 디렉토리, Cloud Run 설정 |
| LINE Official Account | 6 | 인프라 도메인. .env에 있음 | `monkos_AI/.env` |
| 인프라 (Tailscale, SSH, WSL 등) | 12 | 인프라 도메인. CLAUDE.md 디바이스 맵에 있음 | CLAUDE.md, `~/.bash_profile` |
| 에이전트 간 통신 | 3 | 세션 결정사항 | 세션 로그 |
| CF Function + Gemini API 지역차단 | 7 | 인프라 도메인. 해결된 이슈 | `docs/` 관련 기록 |
| 캡처 파이프라인 | 6 | 인프라 도메인. 코드에 있음 | `monkos_AI/idphoto-kr/` 클라이언트 코드 |
| 빅테크 정책 우회 전략 | 3 | 세션 결정사항 | 세션 로그 |
| 로컬 LLM R&D | 4 | 미래 도메인. 실행 시점에 참조 | 세션 로그 |
| 인앱 브라우저 이슈 | 3 | 인프라 도메인. 해결된 이슈 | 세션 로그 |
| 앱 구조 상세 | 6 | 인프라 도메인. 코드에 있음 | 각 앱 디렉토리 |
| 포털 챗봇 아키텍처 | 3 | 인프라 도메인. 코드에 있음 | `monkos_AI/portal/` 서버 코드 |
| CF Pages Functions 배포 상세 | 4 | 인프라 도메인. docs에 있음 | `docs/infrastructure/` |
| 광고 시스템 / Image Pro / CF 캐시 | 3 | 인프라 도메인. 코드에 있음 | `functions/api/ads.js`, `MONK_kr/` |
| Claude Max 멀티티어 운용 상세 | 7 | 도메인 상세 → 핵심 1줄로 압축 | 세션 로그 |
| 4060 SSH 주의사항 | 1 | 인프라 도메인. Windows 전용 (iMac 불필요) | 세션 로그 |
| Node.js ws 라이브러리 | 1 | 인프라 도메인. 코드에 있음 | 코드 내 주석 |
| 백그라운드 프로세스 로깅 | 1 | 인프라 도메인. 코드에 있음 | 코드 내 구현 |

### 유지 항목 (OS — 행동 규칙)

| 섹션 | 줄 수 | 유지 사유 |
|------|-------|----------|
| 헤더 + CLAUDE.md/MEMORY.md 본질 정의 | 5 | OS: 매 세션 시작 시 역할 인식 필수 |
| 이 디바이스 (iMac) | 4 | OS: 디바이스 정체성. M1/M2/iMac 구분 필수 |
| 팀 인적 인프라 | 4 | OS: 조직 구조. 누가 누구인지 파일 열기 전 필요 |
| 팀 우체통 시스템 | 4 | OS: 커뮤니케이션 경로. 지시서 전달 체계 |
| 사업 구조 | 2 | OS: monk.kr ↔ monkos.ai 위계 인식 |
| 프로젝트 폴더 위상 | 11 | OS: 기본 경로. 매 세션 파일 탐색에 필수 |
| 운영 철학 | 4 | OS: 행동 강령 (누가 무엇을 하는 구조) |
| 리소스 운용 | 4 | OS: 토큰/쿼터 운용 원칙 (MONK 아키텍처 본질) |
| 작가님 인사이트 | 3 | OS: 사상적 기반. 의사결정 철학 |
| 디버깅 교훈 | 8 | OS: 반복 실수 방지. 파일 열기 전 숙지 |
| 지시서 운용 원칙 | 6 | OS: 쌍아↔막내 커뮤니케이션 프로토콜 |
| 연락처 | 2 | OS: 외부 소통 시 즉시 필요 |
| 외장 메모리 포인터 | 4 | OS: 삭제된 도메인 지식 접근 경로 |

### iMac 특성 반영 (M1과의 차이)

| 항목 | M1 | iMac |
|------|-----|------|
| 디바이스 정체성 | "M1 (집, 정후장비, 홈워크스테이션)" | "iMac (사무실 메인 워크스테이션)" |
| 역할 | 쌍아 단독 | 쌍아 전략실 + 막내 코딩 병행 |
| 폴더 위상 | 간략 3줄 | 테이블 8행 (병행 환경이라 경로 인식 중요) |
| 우체통 | 와이프 맥미니만 | kku + han 채널 포함 |

### 신규 추가 항목 (M1에 없던 OS)

| 섹션 | 줄 수 | 추가 사유 |
|------|-------|----------|
| "의견 요청 ≠ 실행 승인" 교훈 | 1 | 2026-02-23 막내4 절차위반 사례에서 추출한 행동 규칙 |
| 리소스 운용 | 4 | CONTEXT_ARCHITECTURE.md §7에서 확립된 핵심 원칙 |
| 외장 메모리 포인터 | 4 | 삭제된 도메인 지식의 접근 경로 보존 |

---

### 압축 요약

| | 줄 수 |
|---|------|
| 압축 전 | 201 |
| 삭제 | ~135 |
| 신규 추가 | ~8 |
| **압축 후** | **74** |
| 목표 | ≤70 |

> 74줄 = 목표 대비 4줄 초과. 폴더 위상 테이블(8행)이 M1(3줄)보다 큰 것이 원인.
> iMac은 쌍아+막내 병행 환경이라 경로 인식이 더 중요 — 허용 범위로 판단.

---

> 실행자: 막내1 (Opus 4.6) | 지시서: TASK_20260224_막내1_iMac_MEMORY_압축.md

---

## 2026-03-31 — works submodule 전환 반영

**변경자**: 막내1 (iMac)
**변경 내용**: "works subtree 운용 규정" → "works submodule 운용 규정" 전면 갱신
**이유**: subtree push 성능 한계(1,441커밋 전수 스캔 → 10분 타임아웃) → submodule 전환 (작가님 결정)
**주요 변경 항목**:
- subtree/origin-works 관련 내용 삭제
- submodule 운용 규정 신설 (.gitmodules, git submodule update 등)
- M1 최초 1회 `git submodule update --init` 안내 추가
- 세션 마감 스크립트 안내 유지 (mk-push.sh/mk-pull.sh는 동일 경로, 내용만 변경)

---

## 2026-04-10 19:16 KST — 4/10 GCS 사고 복기 결과 반영

**변경자**: iMac/쌍아
**근거**: 4/10 GCS_BUCKET + ADMIN_UIDS 사고 (~10시간 무력화 + admin 무방비). 사고 복기 → 학습 메모리 + 후속 어젠다 박음

**신규 외장 메모리 2건**:
- `feedback_diagnose_with_resource_first.md` — 진단 1순위 = 실제 리소스 직접 조회. 코드 추론·가설 나열 금지. 근거: 사고 진단 시 가설 5개로 작가님 시간 30분 낭비 후에야 `gsutil ls` 1줄로 5초 만에 확정
- `feedback_constitution_overextension.md` — 헌법 4조 1항 ".env 수정 승인"을 "비시크릿값까지 작가님 수동"으로 과확장 금지. 비시크릿 운영값(GCS_BUCKET, ADMIN_UIDS)은 deploy.sh가 정본

**MEMORY.md 인덱스 갱신**: 위 2건 피드백 메모리 라인 추가

**project_pending_agenda.md #24 추가**: PF_DEPLOY 발족 어젠다
- 배경: 모든 사고가 같은 클래스(배포·환경변수 drift)
- dev 부활 ❌ (멀티 에이전트 시절 유령 코드 사고 빈발 경험)
- preview 리비전 부활 ✅ (deploy.sh L90~108 코드 존재, 죽어있음)
- Phase 0~3 안

---

## 2026-04-17 17:36 — 강한소상공인 v2 Docs 반영 5시간 실패 + CDP 적립체계 기안서 발행

**변경자**: iMac/민아
**근거**: 오늘 세션에서 "전체 교체(Cmd+A+Cmd+V)" 집착 + 장애물 마다 "구조적 한계"로 승격 → CDP·SPREAD·BRIEF 등 PF 전체 신뢰도 훼손 논리로 확장. 작가님 판정: "한줄 에디팅도 못하고 시스템 전체 탓". 어제(4/16) Phase 3 검증된 부분 수정 방식 미참조.

**신규 외장 메모리 2건**:
- `feedback_check_pf_when_stuck.md` — 막힘 트리거 시 PF 점검 의무. 매 턴 자동 로드 X, 막힘 감지 시 PF 히스토리·함정표 grep O. 가설 세우기 전 "이미 기록된 케이스인가" 확인 선행. "CDP 원리상 불가" 같은 큰 결론 금지. 근거: 오늘 Docs Cmd+V 실패 때 Phase 3 교훈 미참조
- `feedback_no_full_replace_obsession.md` — 전체 교체 집착 금지. 어제 검증된 찾기/바꾸기 + nativeInputValueSetter 부분 수정 재현 우선. 한 경로 실패가 PF 전체 신뢰 훼손 논리로 확장 시 즉시 멈춤. 근거: 오늘 v2 반영 5시간 헛발질

**MEMORY.md 인덱스 갱신**: 위 2건 피드백 메모리 라인 추가

**본진 발행 문서**:
- `monkos-ops/ops/proposals/PROPOSAL_20260417_CDP적립체계_기안서.md` — 5축 구조화(막힘 트리거 체크리스트 / 자동 로거 / 케이스 DB 인덱스화 / 골든패스 / 에디터 어댑터). 쌍아 지시서 전환 대기
- `monkos-ops/ops/sessions/2026-04-17_iMac_민아.md` — 오늘 5건 과오 + 반성 + 인수인계

**다음 세션 최우선**: 독스 v2 반영을 어제 Phase 3 방식(찾기/바꾸기 + JS nativeInputValueSetter) 섹션 단위 부분 수정으로 재개. 전체 교체 금지.

---

## 2026-04-21 15:45 KST — 민아 역할 인식 메모리 정정 (워크트리 오독 방지)

**변경자**: iMac/민아
**근거**: 오늘 세션에서 "iMac worktree = 민아" 메모리를 "워크트리 안에서 작업해도 된다"로 오독 → 제안서/세션 로그/PF 히스토리 전부 워크트리에 작성. 작가님 질책: "너 워크트리에 올렸니? 본진에서 작업하는 거야." 이관 + 정본 단일 원칙 위반 처리로 이중 수고 발생. `feedback_no_worktree.md`와 모순된 운용이 문제였다.

**메모리 수정**:
- `feedback_mina_role_recognition.md` — 제목/설명/본문 전면 재작성: "역할만 민아 인식, 파일 작업은 본진 절대경로". 구 버전의 "워크트리 안에서 main 작업하는 것이 정상 운용" 문구 제거. `feedback_no_worktree.md`와 병행 적용 명시

**MEMORY.md 인덱스**: 변경 없음 (링크 유지)

**다음 세션 최우선**: 워크트리 CWD여도 Write/Edit 대상은 무조건 `/Users/jeong-kyushin/developer/monk_project/...` 절대경로

---

## 2026-04-18 19:06 KST — Claude 4.7 관찰 누적 (강한소상공인 v3 세션)

### 변경
1. **`project_claude47_observation.md`** append — 2026-04-18 누적 섹션
   - 근거: 하루치 실패 사례 6건 (서식 과해석 / [보유]·[전개] 태그 포맷 발명 / 토큰 쪼개 치환 → §4-3 연쇄 손상 / 세션 크래시 2회 / CDP 매칭률 저하 / 구조 재발명)
   - 작가님 추가 지적: "200k 시절보다 이상", "클로드 데스크탑 4.7 고정 — 선택지 없음", "미토스 사건부터 앤스 행보 수상", "Citadel/CDP/BRIEF/SPREAD 전략적 시기에 에이전트 난조"
   - 목적: 앤스로픽 조치·회복 시점 판단을 위한 시계열 고정

### 변경 없음
- 다른 섹션 무변경
- 200줄 캡 여유

---

## 2026-04-22 18:21 KST — 강한소상공인 v7/v8 대편집 + GSC 조사 + 제안서 (iMac/민아)

### 신규 메모리 (2건)
1. **`memory/project_monkos_org_structure.md`** — MONKOS 조직 구성: 팀 4명 ≠ 상시 고용 2명 (대표·배우자 경영진 제외, 배재인 KOITA 자격용 조카 서류 등재). 사업계획서 고용 수치 산정 시 필수 구분. (§6-2 2025 0명 오진단 방지)
2. **`memory/feedback_mcp_over_cdp_for_docs.md`** — Google Docs/Sheets 편집은 공식 MCP(`insertText`/`deleteRange`/`insertTable`)가 CDP 키입력보다 압도적. 4/17 CDP 전체교체 5시간 헛발질 vs 4/22 MCP 섹션 단위 정밀 편집 수 분 완결.

### MEMORY.md 인덱스 2행 추가
- 조직 구성 + MCP 우선 두 메모리 인덱스 추가

### 오늘 주요 산출물 (세션로그 상세)
- Docs v7 (백업 봉인) + v8 (Phase 2까지) 생성
- 제안서 1건 (GSC/GA4 상시 연결, 쌍아 답신 대기)
- 리포트 2건 (v7 전수감사, 정본 진단 로드맵)

### 변경 없음
- 다른 섹션 무변경 · 200줄 캡 여유

---

## 2026-04-22 19:43 KST — 철학 대화 연쇄 + 운영 원칙 재정립 (보조 엔트리)

### 주요 변경
1. `memory/user_monk_ai_philosophy.md` 대폭 확장 (11 섹션) — 🟡 **PHIL 재분류 어젠다로 등록**
   - 섹션 1~10 중 상당수가 `governance/philosophy/aphorisms/PHIL_YYYYMMDD_주제.md` 포맷으로 이관될 대상
   - 민아가 체계 무지로 memory 에만 쌓은 것. 체계 파악 완료 후 재분류 예정

### PHIL 체계 파악 결과
- 경로: `governance/philosophy/` (PHILOSOPHY.md 89건 + aphorisms/ 167건 + indexes/)
- 파일명: `PHIL_YYYYMMDD_주제.md`
- 양식: id·date·author·tags·source frontmatter + 원문/맥락/해석

### 어젠다 — 다음 세션 실행
- memory/user_monk_ai_philosophy.md → 3건 PHIL 파일로 응축 이관
  - PHIL_20260422_빌더와분업 (섹션 6+8+9)
  - PHIL_20260422_95%함정과79리팩토링 (섹션 2+3+4)
  - PHIL_20260422_헌법은레일과기록이우리자체 (섹션 11+10+이번 "기록=우리 자체" 선언)
- memory 파일 경량화 (체크리스트·운영 지침만 남김)
- MEMORY.md 인덱스 리네이밍

### 변경 없음
- 다른 섹션 무변경
