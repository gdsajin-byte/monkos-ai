# MEMORY.md 출납 로그 — iMac

> 성격: iMac MEMORY.md의 변경 이력. 무엇을 넣고, 무엇을 뺐는지 추적.
> 원칙: 남은 것은 유추 가능하나, 덜어낸 것은 기록 없으면 소멸한다.
> 정본: `monkos-ops/ops/MEMORY_CHANGELOG_iMac.md` (Git 추적)
> MEMORY.md 위치: `~/.claude/projects/{project}/memory/` (로컬, Git 밖)

---

## 2026-07-12 (쌍아 세션)
- **신규**: `project_startup_window_strategy.md` — 스타트업 윈도우 전략(빈틈선점→IP/DAU→exit. 사전트래킹=레이더)
- **신규**: `project_print_service_integration.md` — 인화 서비스 통합(사진관 기반, 스마트스토어 인화→자체 플로우)
- **신규**: `project_idpass_router_architecture.md` — portal server.js 분리 + /idpass 허브 라우터 어젠다
- MEMORY.md 인덱스 3행 추가

## 2026-07-08 19:35 KST — Fable 5 구독 7/12 연장 반영 — project_model_placement.md 갱신
- 7/7 이탈 → 7/12 연장 확인. 필터링 강화·토큰 압박 추세 기록.

## 2026-07-06 19:51 KST — Fable 5 실측 평가 + 현행 체제 확정 — project_model_placement.md 갱신

### 배경
- 승계 세션(iMac/쌍아 7/6 17:19~19:51): 작가님 Fable 5 실측 평가 공유
- Opus 4.8 대비 자기 마감 능력, 코드 분석, 프로젝트 이해도, 하네스 수용도 모두 격차
- 7/7 이후 종량제 전환으로 상시 운용 비현실적 → 현행 2중 트랙 체제 확정

### 변경
1. **`project_model_placement.md` 갱신** — Fable 5 실측 평가 항목 추가, 현행 최적 체제 명기 (쌍아/막내=4.6, Fable=2중트랙, 민아=4.8 검수)

---

## 2026-05-14 11:41 KST — 정예요원 원칙 + 필명·본명 분리 — 신규 feedback 1 + project 1, 인덱스 2행 ⭐

### 배경
- 본 세션(iMac/민아 5/14): 작가님 직접 선언 2건이 헌법 가치 차원 결단에 해당하여 메모리 적립
- 11:41 KST: "수발신과 타임스탬프는 우리의 가장 큰 자산이고 우리 에이전트들이 가장 정예요원인 이유야"
- 14:34 KST: "신작가로만 미는게 나을듯 영문만, 사업자 푸터에 나오는것과 필명은 다르게 생각해야함"

### 변경
1. **`feedback_header_timestamp_discipline.md` 신규** (2026-05-14 11:41 KST)
   - 모든 턴 첫 줄 `[YYYY-MM-DD HH:MM KST] {디바이스}/{에이전트} → {수신자}` 절대 준수
   - 매 턴 첫 도구 호출 = `date` 절대 준수
   - 위반 사례·정정 절차 명시
2. **`project_persona_separation.md` 신규** (2026-05-14 15:58 KST)
   - 법적 사업자 본명(신정규/footer/등록정보) vs 브랜드·검색·AI 필명 "Shin-jakka" 분리
   - 본명·필명 동반 표기 금지 (예: "신정규(Shin-jakka)" ❌)
   - 영문 표기 통일 "Shin-jakka" (하이픈 포함)
   - 적용 영역 매트릭스 + 정정 진행 자산 명시
3. **MEMORY.md 인덱스 2행 ⭐ 어펜드** — 두 신규 메모리 외장 메모리 목록에 등록

### 최종 상태
- MEMORY.md: 144줄 → 146줄 (2행 추가)
- feedback_*.md: 1개 (header_timestamp_discipline)
- project_*.md: 4개 (model_deployment / monkos_sovereignty / origin_narrative / **persona_separation 신규**)

### 적용 결과 (라이브 반영)
- monk.kr `index.html` Person JSON-LD: `"name": "Shin-jakka"` (본명 미포함)
- monk.kr `llms.txt`: 본명 0건 / Last updated 2026-05-14
- monk.kr `llms-full.txt`: Representative 필드만 본명 유지(사업자 등록 영역) / 나머지 Shin-jakka

---

## 2026-05-04 13:21 KST — 체계 정비: feedback 20개 삭제 + MEMORY 다이어트 (194줄→144줄)

### 배경
- 지시서: `ORDER_20260504_iMac쌍아_막내_체계정비.md`
- feedback 메모리 파일 20개가 실제 행동에 영향 미미. MEMORY.md 200줄 캡 직전.

### 변경
1. **feedback 파일 전수 삭제** (20개): feedback_cdp_autotranslate_artifact ~ feedback_worktree_path
2. **MEMORY.md 피드백 섹션 전체 삭제** (인덱스 제거)
3. **외장 메모리 인덱스 축소**: 18개 항목 제거, 9개 유지 (4MUSE/미결어젠다/CDP×2/자비스/엔드게임/광고전략/AI철학/품질경고)
4. **works 운용 규정 압축**: 20줄→5줄
5. **global settings.json allow 정리**: 107→30개 항목

### 최종 상태
- MEMORY.md: 144줄
- feedback_*.md: 0개
- settings.json allow: 30개

---

## 2026-05-02 19:18 KST — `feedback_japan_is_first_market_only.md` 신규 (일본 첫 타겟 vs 유일 목적 다회 지적)

### 배경
- 강한소상공인 v8 리뷰 중 작가님 직언:
  > "자꾸 일본 일본하는 것도 좀 이상해. 계속 에이전트들이 일본일본만 하고 있어. 여러번 말해도 일본은 첫타겟진입이지 일본이 유일 목적이 아닌데 아무리 말해도 제자리네"
- 다회 지적에도 에이전트들이 패턴 못 고침 → 메모리화 필요

### 변경
1. **신규 메모리 파일**: `feedback_japan_is_first_market_only.md` (type: feedback)
   - 규칙: 일본 단독 강조 금지. "1차 진입(일본) → 2차 확장(동남아·영어권·EU)" 단계 묶기
   - 적용 5조항: ① 일본 항목 2개 연속 시 균형 점검 ② 단계 구조로 묶기 ③ 표 절반 이상이면 1개 치환 ④ 표제 단독 사용 금지 ⑤ 톤은 K-뷰티 글로벌 SaaS, 일본은 첫 발판
2. **MEMORY.md 인덱스 1행 추가** (피드백 메모리 섹션 말미)

### 변경 없음
- 다른 섹션 무변경

---

## 2026-04-28 16:00 KST — `project_payment_gateway_constraints.md` 갱신 (LS×Stripe 인수 + Stripe Connect 의미 + PayPay 옵션)

### 배경
- 작가님 2026-04-28 LS 어드민 본체 복구 + W-8BEN 제출 + Stripe Connect 활성화 통보 받음
- LS support 회신에 "Stripe Connect account has been enabled" 표현 → 작가님 의문: "이제 스트라이프를 정식으로 쓰는 형태가 된건가"
- WebSearch에서 핵심 신규 사실 발견: **Stripe가 2024년 LS 인수**, LS는 "Managed Payments" 라인으로 Stripe 본진과 통합 중 (35+개국)
- Stripe Japan이 PayPay 통합 발표(2025) → LS에도 도입 가능성 (단 공식 docs 미명시)

### 추가 (project_payment_gateway_constraints.md 어펜드)
- **2026-04-28 갱신** 섹션 신설
- Stripe-LS 인수 사실 + LS = MoR 구조 명확화 (Stripe 직접 사용자 아님)
- Stripe Connect Enabled의 정확한 의미 (작가님 입장 변동 없음)
- PayPay 옵션 가능성 + LS 문의 메일 draft 작성 사실
- 일본 PayPay 68M+ 사용자 / idphoto-jp 매출 회복 단계에서 즉시 효과 큰 옵션

### 근거 문서
- `monkos-ops/ops/sessions/2026-04-28_iMac_민아.md` (LS 트랙 전체)
- `monkos-ops/ops/reports/REPORT_20260428_iMac민아_나노바나나2_코드아키텍처_사용툴_분석.md` (별건)
- WebSearch sources: blog.lemonsqueezy.com/2026-update, stripe.com/newsroom/news/japan-payments-moment-2025
- LS support 메일 thread: 19daf21e8ce73285 (Deerga + Gadha)

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

---

## 2026-04-26 13:18 KST — Universal Clipboard 무한 잔존 메모리 등재

### 주요 변경
1. **신규 메모리 1건**: `memory/project_universal_clipboard_handoff.md` (project 타입)
   - Apple Handoff/Universal Clipboard는 fetch된 내용을 무한 잔존 + BTLE 불가 시 APNs로 거리 무관 우회
   - 4/26 새벽 폰에 11시간 묵은 iMac 쌍아 보고서 출현 사고 메커니즘 정리
   - 1차 대응: 작가님 Handoff 차단 (직접 처리)
   - 검증: 향후 동일 현상 미재발 시 가설 확정
2. **MEMORY.md 인덱스 1행 추가** (피드백 메모리 섹션 말미)

### 사고 배경
- 4/25 Kimi 캐스팅 테스트 §6 "미해결 의문: 클립보드 이상 현상" 분석에서 발견
- WebSearch 결과 [MacPass#651](https://github.com/MacPass/MacPass/issues/651) + Apple Handoff Security Guide로 메커니즘 확정
- 통설("1~2분 timeout") 부정확 — fetch된 내용은 무기한 잔존

### 변경 없음
- 다른 섹션 무변경 · 200줄 캡 여유 (MEMORY.md 현재 라인 수 점검 권고)

## 2026-05-31
- 신규: memory/project_4060_main_agent.md — 4060 메인 작업자=쌍아(막내 아님), 지시서 수신자 기본값. ComfyUI/VTON 거점
- MEMORY.md 역할인식 섹션에 4060 메인=쌍아 1행 추가

## 2026-06-01
- 신규: memory/feedback_secret_key_ops.md — 헌법 4조 운영해석. 기존 키를 GCP/secret/git에 등록=일임 업무, 금지는 챗 노출·임의 생성·placeholder뿐 (작가님 정정)
- MEMORY.md 외장메모리 섹션에 비밀키 운영 해석 1행 추가

## 2026-06-03
- 신규: memory/feedback_maintenance_session_drain.md — 유지보수·보안 과잉이 작가님 Opus 세션 소진. 사각 연쇄 발굴 금지, 루틴/막내로 내릴 것. 시작 전 과잉방어 금지(레일이지 벽 아님). 작가님 3회 반복 신호
- MEMORY.md 외장메모리 섹션에 "유지보수=세션 소진 경계" 1행 추가

## 2026-06-13
- 모델 배치 섹션: 🚫 Fable 5/Mythos 5 외국인 접근 전면 차단(2026-06-12~, 미 정부 수출통제) 1행 추가. 에러 "may not have access"=쿼터 아닌 접근권 박탈, Opus 4.x가 유일 경로, 타 제품 영향 없음. 출처: Anthropic 공식 성명 6/12
- 신규: memory/feedback_audit_is_mina_role.md — 감사·독립검증은 민아 본령(코더는 자기 가정에 시야 갇힘). 코드 작성자에게 자기 감사 금지, read-only+보고서→쌍아 재검토→막내. 작가님 06-14 GA4 측정ID오염 적발 계기
- MEMORY.md 외장메모리 섹션에 "감사=민아 본령" 1행 추가
- 신규: memory/feedback_docs_data_engineering.md — 기록문서는 청소·압축 아닌 데이터공학 영역(작가님 06-14 정책 선언). 죽은 문서도 옵션가치(맥락충돌 시 단서), 삭제 금지, 보존 불변·retrieval 공학으로. 민아 1차 "회수율 감사→폐기" 제안 철회
- MEMORY.md 외장메모리 섹션에 "문서=데이터공학" 1행 추가

## 2026-06-18 18:28 KST — 시장분석=틈 찾기 — 신규 feedback 1, 인덱스 1행 ⭐

### 배경
- iMac/민아 6/18 세션: 프로필스→IRGEN→시장/경쟁분석 흐름에서 작가님이 분석 관점을 3회 교정
- 핵심: 리스크 나열로 "우리 시장 아님" 차단=직무유기 / 내부데이터(GSC)≠시장(네이버 T4) / "없다" 전 자산 인벤토리

### 변경
- 신규: `memory/feedback-market-analysis-find-the-gap.md`
- MEMORY.md 외장메모리 섹션에 "시장분석=틈찾기 ⭐" 1행 추가

## 2026-06-22 19:09 KST — iMac/민아
- iMac/민아 6/22 세션: 결제블로커 진단 중 쌍아가 병렬로 같은 건 처리(d3e7df30) → 1시간 진단 중복 발생
- 핵심: 착수 전 git log로 타 에이전트 병렬작업 확인. 중복 발견 시 진단→검수로 전환

### 변경
- 신규: `memory/feedback_parallel_agent_overlap.md`
- MEMORY.md 외장메모리 섹션에 "병렬 에이전트 작업 중복 주의 ⭐" 1행 추가

## [2026-06-24 19:25 KST] iMac/민아
- ADD: feedback_session_log_concurrent_overwrite — 세션로그 직하생성 금지(동시세션 add-A 덮어쓰기 사고 재발방지). MEMORY.md 외장메모리 인덱스 1행 추가.

## [2026-06-25 19:18 KST] iMac/쌍아
- ADD: feedback_no_remote_clone — 원격 디바이스 Tailscale SSH 접속 시 새 clone 생성 금지. M1 듀얼레포 사고(06-23) 교훈.
- ADD: project_specs_v2_url_structure — V2 URL=/specs/kr-passport (1-segment), /kr/specs/ 404. V2_SLUGS 등록 슬러그만 301 건너뜀.
- UPDATE: MEMORY.md — 위 2건 인덱스 추가.

## [2026-06-25 19:18 KST] iMac/민아
- ADD 5건: project_builder_role_model_leverage(빌더=모델능력최대화·3원칙) · project_progressive_delegation_pipeline(위계점진위임·임원부서장에이전트) · project_photo_instant_interaction_architecture(사진 단일인터랙션·specs경량분산) · feedback_grasp_inflight_work_before_acting(미완성 진행작업 방향부터 파악) · feedback_deploy_infra_outside_mina_scope(트래픽 --to-latest·deploy인프라 민아스코프밖)
- MEMORY.md 외장메모리 인덱스 5행 추가. ⚠️ 200줄 캡 근접 — 다음 세션 consolidate 필요

## [2026-07-04 16:38 KST] iMac/쌍아
- ADD: feedback_min_instances_conversion_guard — 프로덕션 min-instances=1은 콜드스타트 이탈 방지 전환 장치(작가님 실측 고지). min=0 제안 금지.
- CONSOLIDATE: MEMORY.md 161줄 → 95줄. 내용 삭제 없이 상세를 토픽 파일 4건으로 이관: project_role_recognition(역할 자동 인식) · feedback_ssanga_duties_order_ops(쌍아 본분+지시서 운용) · project_session_ops_procedures(세션로그·시작마감·works) · project_model_placement(모델 배치+리소스 운용). 인덱스는 1행 요약+링크로 축약.
- REMOVE (같은 세션): feedback_min_instances_conversion_guard — 작가님 "영구 기억할 정도는 아님" 격하 지시로 삭제. 맥락(콜드스타트 이탈→min=1 전환, 3~4월)은 세션 로그에만 남김.
- UPDATE: project_model_placement — Fable 5 차단 해제 실측(07-04) 반영, 구 차단 기록 폐기. 7/7 구독 이탈($10/$50 종량, 일시 조치·복귀 예정) + 이후 운용 방침(Opus 4.8 오케스트레이터+단계별 모델 배분) 기록. MEMORY.md 인덱스 동기화.

## [2026-07-04 20:21 KST] iMac/민아 (세션 마감 확정)
- 금일 변경 요약: MEMORY.md 161→95줄 압축(토픽 4건 이관: role_recognition·ssanga_duties_order_ops·session_ops_procedures·model_placement) + model_placement 갱신(Fable 차단 해제 실측, 7/7 구독 이탈·운용 방침) + min_instances 메모리 생성 후 작가님 격하 지시로 삭제. 상세는 본 로그 상단 금일 항목 참조.

## 2026-07-05 (민아)
- 추가: project_orchestrator_agent_intent.md — 작가님 "전체 운영 에이전트" 구현 의향 + Fable급 하네스 세팅 중시 (07-05 마감 대화). MEMORY.md 인사이트 섹션 1행 추가.

**[2026-07-06 22:31 KST]** iMac/민아
- 추가: 작가님 인사이트 "그럴듯한 것과 딱 떨어지는 것엔 극한의 갭" → feedback_plausible_vs_exact_gap.md (07-06 크롭 v2→v3 실사고 교훈 — 도메인 정의 재해석 금지·수치 통과≠실물 합격)

**[2026-07-08 13:03 KST]** iMac/민아
- 추가: project_ga4_test_traffic_contamination.md — GA4 수치=작가님 자가 테스트 오염, 실 유입 0 간주 (07-08 직접 교정. specs 50:50 근거 데스크톱 권고 철회 계기). MEMORY.md "데이터 주의" 섹션 신설 1행 추가.

## [2026-07-09 15:55 KST] iMac/민아 — 세션 마감분
- 신규: `feedback_fable_owner_level_output.md` — 과잉 유보 금지, 판단 먼저. "새 모델 제한" 법률 맥락은 소형 모델 대상 (작가님 직접 교정)
- 갱신: `project_role_recognition.md` — 잔존 세션 로그의 에이전트명으로 역할 추정 금지 (7/9 막내1 오인 실사고)
- MEMORY.md 인덱스에 Fable 출력 기대치 1행 추가

## 2026-07-09 (민아 세션2 마감)
- MEMORY.md 변경 없음. 크롭 최적화 트랙: 정수리밴드 산식 완결 + 프리뷰 45% 결정 + 규격별 최적수치 산출 (도메인 지식은 PF_SPECS·REVIEW 문서가 정본)

## 2026-07-09 (쌍아 세션 마감)
- 갱신: `project_model_placement.md` — 현행 체제: 민아=Fable 5 (07-09 작가님 확인)

## 2026-07-10 (민아 세션)
- **신규**: `project_retouch_default_by_culture.md` — 보정 기본값=문화 파라미터(한국=보정 디폴트/글로벌=자연) + 제작 독트린(인페인트 지양·전체 재생성, 나노2=유료 하한, 프롬프트 3실패 지도)
- **신규**: `project_attire_commerce_vision.md` — 의상·헤어 피커 커머스 중개 비전(T1 피커=시험 모델, 벤더 필드 선탑재) + STYLER 앱 종착 비전(무보존 피팅실·카테고리 인덱스 추천)
- MEMORY.md 인덱스 2행 추가

## 2026-07-15~16 (민아 세션)
- 신규: project_t0_free_global_open.md — T0 무료 전언어 개방 결정(트래픽·DA>실결제, 전역캡 300/일 원가방어) + MEMORY.md 인덱스 1행
- 개정: project_idpass_router_architecture.md — IDPASS 3층 구조 확정(07-12 "specs=백과 전용"을 07-15 "말단 자체 완결"이 대체), 2차 확정(마케팅 분화·랜딩 헤더 승격·백링크 집중·도메인 분리 로드맵) 반영

## 2026-07-16 (민아 2차)
- `project_model_placement.md`: 채용 기준 정본 추가 — "준수율 우선, 성능 차순위" (4.7 퇴출·4.8 미달·Fable 안착 근거, 작가님 발언) + 쌍아 현행화(종량 크레딧·체제)
- `feedback_secret_key_ops.md`: ch4 11조 편입 반영 + GCP_SA_KEY=plain JSON 실측 (쌍아 대행, 민아 사후 추인)

## 2026-07-17~18 (민아)
- 신설: `feedback_specs_content_quality_bar.md` — specs 콘텐츠 품질 기준(규격 나열=저품질·공식 정독·실반려 중심) + 실무 캘리브레이션(규정층/실무층 분리, 07-17 2차 추가)
- 신설: `feedback_paid_failure_no_degraded_delivery.md` — 유료 실패 시 강등 무음 출고 금지, 폴백·과금급 정책은 작가님 명시 승인 필수 (T1 P0 인시던트 발)
- 신설: `project_records_as_system_correction.md` — 기록=시스템 자기교정 장치, Fable도 한계 인정 위에 게이트 정밀화 (작가님 마감 소회)
- MEMORY.md 인덱스 3행 추가

## 2026-07-16 (쌍아)
- 신설: `feedback_no_session_close_suggestion.md` — 에이전트가 세션 마감·정산 먼저 제안 금지 (작가님 여러 차례 주의)
- 갱신: `project_specs_v2_url_structure.md` — 구식 "V2=1-segment" → 현행 "전 슬러그 2-segment `/specs/passport/kr` 통일" 교정. GSC 36.2% 구 형식 잔존 현황 추가

## 2026-07-18 (민아)
- 신규: `project_idphoto_delivery_philosophy.md` — 작가님 증명사진 납품 철학(규정 제1원칙·안전마진·하한 편향·명시 앵커±1·인간 게이트의 코드 대체). MEMORY.md 인덱스 1행 추가.

## 2026-07-19 (민아)
- `project_ga4_test_traffic_contamination.md` 갱신 — "내부 필터 미설정" → 콘솔 실측으로 교정: 사무실 규칙(61.77.93.170/32)+Internal Traffic 필터 활성 완비, 잔여 갭=집 IP(당일 쌍아 트랙에서 해소 보고)·monk.kr 스트림·patrol UTM. MEMORY.md 인덱스 변경 없음.

## 2026-07-19 (iMac/쌍아)
- `project_model_placement.md` 갱신: Fable 7/20 정식 복귀(Max 쿼터), 민아=설계·검증 집중 체제 유지
- `SECRET_INVENTORY.md` 갱신: Ads 시크릿 6종 추가 (DEV_TOKEN 승인 반영 + CLIENT_ID/SECRET/REFRESH_TOKEN/CUSTOMER_ID/CLIENT_CID)

## 2026-07-20 (iMac/민아)
- MEMORY.md 변경 없음. 세션 산출물은 전부 ops 문서로 적립 (제안서 1·보고서 3·감사 1·세션로그 26턴).
- (21:25 추가) `project_b2b_positioning_anti_dependence.md` 신설 — 작가님 확정: 시장의 눈 1차=자사 마케팅 비용 압축, B2B 공백=반감/의존 이분법의 제3항(자립). MEMORY.md 인덱스 1행 추가.

## 2026-07-21 (iMac/민아)
- `project_chulchang_isolation_by_design.md` 신설 — 작가님 확정: 철창이 레포 미편입=의도된 격리(발산 공간 보존, 편입 제안 반려 근거). MEMORY.md 인덱스 1행 추가.

## 2026-07-23 (iMac/민아)
- MEMORY.md 인덱스 변경 없음.
- `project_ga4_test_traffic_contamination.md` How-to-apply 확장 — "GA4 한정 아님: 서버 로그·크레딧·GCS 전 지표 동일. 실수요 판정 전 UID→credits.sh user 대조 필수" (금일 재방문 실유저 오판 재발 반영).

## 2026-07-23 (iMac/쌍아 오후)
- `feedback_opus46_translation_role.md` 신설 — 쌍아(Opus 4.6)가 민아(Fable 5)의 고밀도 분석을 작가님에게 번역·요약하는 역할. 작가님 직접 언급. MEMORY.md 인덱스 1행 추가.

## [2026-07-24 05:44 KST] iMac/민아
- 신설: `feedback_verify_consumer_check.md` — 검증 게이트 "공용 정본 수정 시 대상 표면의 실소비 확인" (7/24 홈 navHtml 이원화 자기정정에서 도출). MEMORY.md 운영 교훈 섹션 1행 추가.

## [2026-07-25 19:30 KST] iMac/쌍아
- **신설**: `feedback_shared_resource_dev_gate_fallacy.md` — 공유 자원(Firestore·GPU·워킹트리)은 dev 게이트로 격리되지 않는다. 07-25 하루 3회 실증(prod 504 / prod 404 35분 / 커밋 귀속 혼입)
- **MEMORY.md**: 「운영 교훈」에 위 1행 추가
- **갱신**: `project_ssanga_context_budget.md` — 1M 해결 확정(2.1.220) + "모델 ID `[1m]` 접미사는 무효 지표, 분모만이 근거"

## [2026-07-25 19:28 KST] iMac/민아
- 신설: `feedback_capability_must_be_exercised.md` — **"디코드는 디코드로, 렌더는 렌더로 확인한다. 헤더·메타·설정값은 능력의 증거가 아니다."** 07-25 하루에 동형 오류 3회(레지스트리→file.type / `metadata()`→디코드능력 / 4060 1대→"Edge 특이성") 반복에서 도출. 특히 `metadata()` 오독은 "서버가 HEIC를 처리한다"는 거짓 전제가 되어 쌍아 처방을 뒤집을 뻔했다(검수자 미검증 단정의 하위 증폭). 같은 함정이 코드에도 있었음 — `normalizeImage`의 DECODE_FAILED 가드가 `metadata()` 기반이라 무력화. MEMORY.md 외장 메모리 섹션 1행 추가.

## [2026-07-25 21:21 KST] iMac/민아
- 신설: `project_gpu_resource_allocation_vision.md` — 작가님 전략 관점. **"GPU 리소스는 현대에 가장 큰 자원, 국가 데이터센터로 확장하면 배당 메커니즘이 된다"**. 매팅 라우팅(4060↔RunPod)을 비용 절감 잡일이 아니라 **자원 배분 정책 실험대**로 규정 → 우선순위 근거가 절감액이 아니라 학습 가치. RunPod 서버리스='의자 뺏기'(작가님 표현), `idleTimeout`은 기술 파라미터가 아니라 가격 정책. 실질 병목은 알고리즘이 아니라 **측정 자동화**(현재 전 수치가 수동 채집). MEMORY.md 작가님 인사이트 섹션 1행 추가.

## [2026-07-26 11:50 KST] iMac/민아
- 07-25 연장 세션(→07-26 06:05) 산물. 신설 2건:
  - `project_gpu_resource_allocation_vision.md` — 작가님 전략 관점(GPU 자원배분 메커니즘). **07-26 보정 반영**: 규모 확장은 문제를 바꾸지 않고 층을 얹는다, 코드의 몫은 규모 무관하게 「싸고·빠르고·정교한 수집」.
  - `feedback_capability_must_be_exercised.md` — **"디코드는 디코드로, 렌더는 렌더로."** 헤더·메타·설정값을 능력의 증거로 삼지 말 것. 하루 3회 동형 오류(레지스트리→file.type / metadata()→디코드 / 4060 1대→Edge 특이성)에서 도출.
- MEMORY.md 인덱스 2행 추가(작가님 인사이트 섹션·외장 메모리 섹션).

## [2026-08-06 04:46 KST] 민아
- 신규: project_aeo_offline_conversion_signal.md — AEO 첫 오프라인 전환 실증(ChatGPT 추천→실물 고객) + 엔진 비대칭 구조. MEMORY.md 인사이트 섹션 1행 추가

## [2026-08-13 19:33 KST] works submodule 폐지 반영 (iMac/막내1)
- 삭제: "rsync --delete 금지 — works/ 동기화" 1행 (works 소멸로 무효)
- 변경: 섹션 제목 "세션 로그·시작/마감·works/" → "세션 로그·시작/마감"
- 변경: 세션 시작 절차에서 "works 확인" 제거
- 대체: "works/ = submodule. 삭제 절대 금지" → "works submodule 폐지(08-13). 원격 아카이브 존치, 팀원 납품은 monkos-ops/ops/*/YYYY-MM/ 직접 배치"
- 근거: ORDER_20260813_iMac쌍아_막내1_WORKS_서브모듈폐지 §4-2 (작가님 Phase D 승인)

## [2026-08-13 19:38 KST] iMac/쌍아 — 실측 원칙 메모리 3건 등재

- 추가: "4060 비가동≠장애" → `project_4060_intentional_downtime.md` (가정 사정 의도적 오프. matte 530 시 RunPod 폴백 영향 0 확인 후 조치 말 것)
- 추가: "브리핑 주장=1차 실측 필수" → `feedback_briefing_claims_need_primary_verification.md` (승계 재서술이 "의혹"을 "확정 🔴"으로 변질. Lemon 키 18일 오경보 실증)
- 추가: "0건·404≠부재" → `feedback_empty_output_is_not_absence.md` (대조군 1회로 조회 유효성부터 배제. 하루 3회 발생, 1건은 틀린 영향평가가 심사부로 유통)
- 근거: 2026-08-13 세션 오류 4건 정정 — 메타(날짜·스탬프·빈 출력)를 내용의 증거로 사용한 공통 뿌리

## [2026-08-26 12:28 KST] iMac/민아 — 롤백 단위 교훈 1건 등재

- 추가: "롤백단위=커밋단위" → `feedback_rollback_unit_commit_separation.md` (배포 분리 지시는 커밋 분리 포함. 분리 목적은 순서가 아닌 롤백 — revert 대상이 커밋이므로 배포만 나누면 반쪽)
- 근거: 2026-08-24 CF 엣지 이관 쌍아 사후심사 절차 기록 (재작업+P2-2를 배포 3회로 나눴으나 커밋 1개로 묶음)

## [2026-09-02 10:41 KST] iMac/쌍아 — 쿼터 설계 교훈 1건 등재

- 추가: "배치→N콜 분해=쿼터 N배" → `feedback_batch_param_to_n_calls_quota.md`
  (`sampleCount` 같은 1콜N산출 파라미터를 N콜 병렬로 대체하면 쿼터 소비가 N배. 설계 전 쿼터 실측 필수 —
   `consumerQuotaMetrics`의 `limit.unit`이 정본이고 displayName에는 창(분/시)이 없다.
   검증 체크리스트에 n=max 케이스 포함. 429는 `"check your quota"`(우리 프로젝트 RPM)와
   `"try again later"`(모델측 용량 경합)로 종류가 갈리며 조치가 다르다)
- 근거: 2026-08-27 IMAGE PRO Imagen4 폐지 대응. 쌍아가 지시서에 "N장 병렬 호출"로 설계했고
  Vertex 이미지 생성 쿼터가 분당 2건이라 4장 요청이 확정 429. 복구 검수는 단발 호출만 봐서 회귀를 놓쳤다.
  실증: fast n=1 → 200 / fast n=4 → 429 즉시
- 2026-09-02 iMac/민아 — `project_studio_endgame_202705.md` 요약본 축소(정본 PF_ANCHOR 이관) / 신설 `feedback_mina_core_member_not_evaluator.md` / MEMORY.md 인덱스 2행 갱신(사진관 엔드게임 hook·민아=핵심 멤버)

## 2026-09-02 20:44 KST — iMac/민아
- `project_4060_intentional_downtime.md` 전면 갱신: 의도적 비가동 → **라인업 배제(자녀 포맷)**. 매팅 RunPod 전량·대체 GPU 방향·로컬 LLM 판정 기록
- MEMORY.md 인덱스 1행 교체(4060 비가동≠장애 → 4060 라인업 배제)

## 2026-09-03 11:45 KST — iMac/쌍아
- **신설** `feedback_series_window_start_point.md` — 계열 판정에서 점 개수보다 창의 시작점이 결론을 만든다. 정점에서 시작하면 정상 복귀가 하락으로 보임. GSC 노출 -51% 오보 실증(09-02). 적용법 3단(앞뒤 한 점 더·기저 대조·불변량 확인)
- **보강** `feedback_subagent_legitimate_use.md` — "대행 금지" 절 추가. 실물 막내 대기 중 서브에이전트 막내역 대행 = 지휘체계 우회 위법(09-02 실사고, 심사 전부 무효화). 판별 기준 "절차가 지정한 수행 주체가 있는가". 대행은 품질도 열위였음(엄격모드 2/12→9/12 오적용, 인용 오기 2건)
- MEMORY.md 인덱스 1행 추가 (계열 창의 시작점)

## 2026-09-03 12:16 KST — iMac/민아
- 신설 `project_ga4_measurement_id_canon.md`: GA4 속성·스트림·태그 정본 + G-FKG0CPTC14 고아 ID 판정(INCIDENT_20260903) + 식별자 실측 원칙. MEMORY.md 데이터 주의 섹션에 1행

## 2026-09-03 12:51 KST — iMac/민아
- `project_ga4_measurement_id_canon.md` 갱신: FKG "고아" → Ads 자동 생성 계정 382573166 속성 527549580 확정(표 형식으로 계정·속성·스트림·ID·위상 정리), 회수 실측 수치, 병합 불가·병행 조회 원칙. MEMORY.md 인덱스 1행 교체

## 2026-09-15 12:45 KST iMac/민아
- 신설: feedback_open_to_feasible_limit.md (무조건 닫지 마라 — 층 나누기, 닫힌 선=명시적 법 위반·타인 직접 피해만). MEMORY.md 인덱스 1행 추가.

## 2026-09-17 11:22 KST iMac/민아
- 신설: project_isolated_experiment_env_intent.md (별도 실험 환경·Astra 편입 조건 3·세션 기록=능력). MEMORY.md 인덱스 1행 추가.

## 2026-09-21 11:58 KST iMac/민아
- 신설: feedback_tool_limit_not_judgment.md (도구 제약을 판단처럼 포장 금지 — 첫 줄에 도구 한계 명시, 마지막 고리가 작가님 손이면 제안이 아니라 일감. 09-19 질책).
- 신설: project_payment_surface_state_202609.md (결제 표면 6곳 전수 수정 후 상태 — 계측 위치·미검증 구간·숨김 브라우저 인공물·미결 결정 3건).
- MEMORY.md 인덱스 2행 추가(138→141행).

## 2026-09-21 14:48 KST iMac/민아
- 신설: reference_astra_codex_launch_aliases.md (Astra=Codex CLI 기동 3종 mk-g/mk-gw/mk-gm, 샌드박스 실측 방어 범위, `codex sandbox` 단독 실패 주의).
- MEMORY.md 인덱스 1행 추가(141→142행).

## 2026-09-21 14:52 KST iMac/민아
- 갱신: reference_astra_codex_launch_aliases.md — mk-g 1종 통합(무승인·무샌드박스, 작가님 지시), 샌드박스 유지안 기각 경위·권한 단계 재제안 금지. MEMORY.md 인덱스 1행 교체(행수 불변 142).

## 2026-09-21 16:37 KST iMac/민아
- 갱신: project_payment_surface_state_202609.md — 토스 영수증 인증 절차 추가(09-30 적용) 영향 판정 1단락 어펜드. 인덱스 불변.

## 2026-09-22 15:00 KST iMac/민아
- 신설: project_multimodal_team_gpt_gemini.md (GPT·Gemini 멀티모달 축 분담, 채널 구분, GPT 목업=시안·민아 검수). MEMORY.md 인덱스 1행 추가(142→143행).

## 2026-09-22 18:57 KST iMac/민아
- 갱신: project_session_ops_procedures.md — 타임스탬프 위반 패턴 2종·교정안 1단락 어펜드. 인덱스 불변.

## 2026-09-24 11:51 KST iMac/민아
- 갱신: project_aeo_offline_conversion_signal.md — 네이버 AI 브리핑 1순위 인용·og:image 썸네일 실증 1단락 어펜드. 인덱스 불변.

## 2026-09-24 12:01 KST iMac/민아
- 갱신: project_payment_surface_state_202609.md — 실고객 첫 즉시결제 완주(09-23) 로그 실측 1단락 어펜드. 인덱스 불변.

## 2026-09-24 12:28 KST iMac/쌍아
- 갱신: project_model_placement.md — iMac 기본 모델 Opus 5.5 전환·CLI 네이티브 전환·타 디바이스 미점검 1항목 선두 삽입. MEMORY.md 모델 배치 행 현행화(구 기록 병기).

## 2026-09-26 12:01 KST iMac/민아
- 세션 마감(09-24~26). MEMORY.md 변경 없음(09-24 아침 작가님 기재 "iMac 기본=Opus 5.5" 행은 작가님 직접 갱신분).

## 2026-09-26 17:38 KST iMac/쌍아
- 신설: reference_cross_session_message_to_makne.md — 쌍아→막내 SendMessage 3/3 승인 보류 만료 실측, 막내 전달은 붙여넣기 문구가 실경로. MEMORY.md 운영 교훈 1행 추가.

## 2026-09-27 12:14 KST iMac/민아
- 신설: feedback_report_brevity_decision_first.md (보고=결론1줄+결정≤3+닫힌 대안 / 인지 한계 재진단 / 결정 요청 3원칙—축 분리·결과로 질문·닫히는 것 되읽기)
- 신설: project_approval_bottleneck_scope_gate.md (행위 승인→범위 승인, 하네스 자기 잉태 진단, 폰 채널 요인)
- 신설: project_process_as_curriculum_continuity.md (과정=교육, 연속성 커널, 커리큘럼=GitHub·CF·GCP 신원/권한/비밀, 사람 소유 고리)
- 갱신: project_model_placement.md (Opus 5.5 체감·판정 지표=작가님 정정 횟수·잠정 배분)
- MEMORY.md 인덱스 +3행

## [2026-09-28 14:19 KST] iMac/민아
- 신설: project_platform_vs_single_identity.md (포털 비전 vs 단일 정체성 — 작가님 09-28 자기진단, 입구/뒷단 분리 해법 미결)
- MEMORY.md 인덱스 +1행
- [2026-09-28 19:14 KST] 신설: project_tier_parallel_visibility.md (티어 동시 제시 원칙, GA4 30일 퍼널 근거) · MEMORY.md +1행

## [2026-10-01 18:55 KST] iMac/쌍아
- 신설: feedback_korean_only_replies.md (작가님 대면 출력 한국어 전용 — 10-01 영어 응답 지적) · MEMORY.md +1행
- 갱신: reference_cross_session_message_to_makne.md (세션 간 메시지 = 권한 모드 일치 시 무보류 양방향, 불일치 시 무음 5분 만료, 이름 새로고침마다 변경) · MEMORY.md 포인터 교체

## [2026-10-01 18:55 KST] iMac/민아 (2차 세션 마감)
- 신설 6: project_frontier_first_security_behind(권한 개방 기조·차단 3선·에이전트 별도 계좌 계획) · project_kku_role_position(꾸 = 현장 책임자, 10-01 정식화) · project_subagent_three_tier_design(리드·라이트·판단, 얇은 일꾼) · project_agent_identity_by_interface(구분은 접점·관점, 쌍아·민아 통합 안 함) · project_remote_org_amendment_monitoring(PETITION_20261001 승인·민아 모니터 7항목) · reference_cross_machine_session_messaging(iMac↔M2 세션 메시지 개통)
- 갱신 1: project_model_placement(쌍아 Opus 5.5·민아 Fable 차등은 작가님 의도, 모델 비종속)
- MEMORY.md 인덱스 +6행 (149 → 155줄, 캡 200 이내)
- 같은 날 쌍아 변경분(feedback_korean_only_replies 신설, reference_cross_session_message_to_makne 갱신)은 쌍아 기록 소관
- [2026-10-01 19:20 KST] iMac/민아 (마감 후 추가): reference_cross_machine_session_messaging 갱신 — isolatePeerMachines 제거(8cdd26d2)·기기 간 왕복 실측·웹에서 허용 버튼 불가

## 2026-10-02 iMac/민아
- [2026-10-02 12:34 KST] 세션 간 통신 정비 관련 메모리 갱신 8건:
  - reference_cross_machine_session_messaging: 10-02 핑 재실증 / 세팅은 대화 단위·새 대화 미승계 / `remoteControlAtStartup`은 사용자 설정에서만 유효(원인 확정) / 자동 연결·훅 이름 적용 실증과 같은 기기 주소 미반영 한계
  - reference_cross_session_message_to_makne: VSCode 확장 `initialPermissionMode`(새 대화 기본 모드로 보류되는 원인) / 같은 기기 이름 출처 = `~/.claude/sessions/{pid}.json`, 훅 제목은 cached만
  - MEMORY.md 색인 2행 교정: §팀 인적 인프라(우체통 워처 10-02 폐기, 통로 = ssh m2 + 세션 메시지) / 기기 간 세션 메시지 줄(자동화·한계 반영)
- 신규 메모리 파일 0. MEMORY.md 줄 수 변동 없음(행 교체만).

**[2026-10-03 11:52 KST]** iMac/쌍아 — 신규 `feedback_shared_worktree_autostash_conflict.md`(공유 체크아웃 PF 원장 미커밋 누적 → pull autostash 충돌 2회, 대응 절차) + MEMORY.md 운영 교훈 1행.

## 2026-10-03 11:52 — iMac/민아 세션 2 마감 (10-02 12:55 시작)
- MEMORY.md·메모리 파일 변경 0. 기록은 세션 로그·PF·제안서·COMPLETION에 남김(소소 세션·디자인 TF·E10 결함).

## 2026-10-05 11:47 — iMac/쌍아 세션 마감 (10-03 11:58 시작)
- 신규: `user_ens_means_anthropic.md` — 작가님 "엔스"=앤트로픽 호칭. MEMORY.md 외장 메모리 섹션에 1행 추가.

## 2026-10-05 11:49 — iMac/민아 세션 마감 (10-03 11:58 시작)
- MEMORY.md·메모리 파일 변경 0. 기록은 세션 로그(2026-10-03_iMac_민아.md)·PF_MONK_OS·session-start.md 개정에 남김(옛 세션 비활성화 절차, 꾸 배포 여부 실측).
| 2026-10-06 17:18 KST | iMac/쌍아 | 추가 | project_smallbiz_wants_agency_not_data — 작가님 10-06 17:17 판정: 자영업자는 데이터가 아니라 대행을 원함 |

## 2026-10-07 14:06 — iMac/민아 세션 마감 (10-05 11:54 시작)
- MEMORY.md·메모리 파일 변경 0. 기록은 세션 로그(2026-10-05_iMac_민아.md)·PF_MONK_OS(MCP 명시 승인)·PF_RND(콜스코프 보류)에 남김.

## 2026-10-22 16:23 — iMac/민아 세션 마감 (10-15 19:39 시작, 10-21 재개)
- MEMORY.md·메모리 파일 변경 0. 기록은 세션 로그(2026-10-15·2026-10-21_iMac_민아.md)·PF_KKU(배포 2회·앱 알림 설계 0단계)·PF_SECURITY(INCIDENT env 평문 토큰)·PROPOSAL_20261021_iMac민아_KKU_배포요청_앱알림_승인버튼에 남김.

- **[2026-10-22 23:32 KST]** iMac/쌍아 — project_monkos_sovereignty.md 갱신: '실행 권한도 자체 도구로'(작가님 10-22 Duet 대비 발언) 단락 추가.

- **[2026-10-23 05:15 KST]** iMac/쌍아 — 신규 메모리 project_own_ledger_over_channel_logs.md + MEMORY.md 인덱스 1행(작가님 10-23 자체 장부 원칙).

- **[2026-10-23 05:23 KST]** iMac/쌍아 — feedback_constitution_art4_intent.md 갱신: 4조 2항도 취지 해석(합의·기록·백업 시 이력 재작성 가능, 작가님 10-23).

- **[2026-10-23 05:33 KST]** iMac/쌍아 — project_monkos_sovereignty.md에 '로컬=소유' 단락 추가(작가님 10-23).

- **[2026-10-23 13:48 KST]** iMac/쌍아 — 신규 메모리 feedback_license_warnings_at_launch + 인덱스 1행(작가님 10-23).

## 2026-10-23 15:17 KST — iMac/민아
- 신설 `reference_tailnet_node_map.md`: 테일넷 노드 ↔ 디바이스 대응. `macmini-macmini`=집 M1(민아가 M2 재등록으로 오판 → 작가님 교정), M2=`kku-macmini-m2-macmini` 100.81.38.20만, 4060=`monk-4060`. MEMORY.md 팀 인적 인프라 절에 포인터 1줄 추가.
- **[2026-10-23 15:19 KST]** iMac/민아 — `reference_tailnet_node_map.md`를 표 사본에서 **정본 포인터**로 교체(레포 중복 금지). 요지: 디바이스 표 정본은 `devices/README.md`·SECRET_INVENTORY §Tailscale, ch1 4조는 약칭만. 인덱스 1행 갱신.
| 2026-10-23 16:45 | 추가 | project_go_commentary_llm_vision.md — 바둑 해설 LLM 자산화 구상·인간적 AI 지향 | iMac/쌍아 |
| 2026-10-23 22:51 | 추가 | project_legal_monitoring_practice.md — 법규 선제 수집·RAG화·개정 감시 절차 | iMac/쌍아 |
| 2026-10-23 22:53 | 갱신 | feedback_license_warnings_at_launch.md — 기획 단계 규제 경보 선행 금지로 일반화(당일 2차 교정) | iMac/쌍아 |
| 2026-10-24 21:25 | 추가 | feedback_small_orders_basics_first.md — 지시서 작은 단위·기본기능 먼저 | iMac/쌍아 |
| 2026-10-24 22:30 | 추가 | project_cdp_site_card_direction.md — UI 레퍼런스 직접 체험·CDP 사이트 카드(PF_CDP/sites) | iMac/쌍아 |
| 2026-10-25 00:23 | 추가 | project_ai_human_interaction_principle_pending.md — AI 사람 대면 원칙 정리 예정(작가님 축: 범죄·시장 질서·사회 혼란·과도 손실) | iMac/쌍아 |
| 2026-10-25 00:27 | 추가 | feedback_decline_via_constitution_not_lecture.md — 거절은 조항 인용·대안·청구, 훈계 금지(+00:36 근거 정밀 제언) | iMac/쌍아 |
| 2026-10-25 13:34 | 갱신 | project_go_commentary_llm_vision.md — PF_GO 정본 포인터 | iMac/쌍아 |
| 2026-10-25 13:46 | 추가 | feedback_pf_status_leave_active.md — PF status 정리 제안 금지 | iMac/쌍아 |
| 2026-10-25 16:09 | 추가 | project_humanities_sensibility_layer.md — 범생이 LLM에 서사 감성·캐릭터 이해·인문학 감성 씌우기가 핵심(바둑 해설·무협 서사 게임 공통) | iMac/쌍아 |
| 2026-10-25 16:09 | 정리 | MEMORY.md 169→139줄 압축(훅 경고) — 폴더 위상 표를 references.md 포인터 1줄로, 운영 철학·연락처 섹션 병합, 빈 줄 제거. 링크 전수 보존 대조 | iMac/쌍아 |
| 2026-10-25 16:27 | 갱신 | feedback_pf_status_leave_active.md — 근거 보강: PF=초기 세계관 하나의 가지(모델스 이미지→영상, 2D→3D), 새 구상은 기존 PF 다음 단계로 읽기 | iMac/쌍아 |
| 2026-10-25 16:29 | 추가 | project_monk_models_character_assets.md — 모델스=세계관 초기 이미지판, 이너웨어=최난도 돌파 전략, 다인·유니 자산 위치 | iMac/쌍아 |
| 2026-10-25 18:57 | 갱신 | project_monk_models_character_assets.md — 폴더=한 캐릭터(작가님 분류), 스타일링 차이를 다른 인물로 판정 금지 | iMac/쌍아 |
| 2026-10-25 19:02 | 갱신 | project_monk_models_character_assets.md — 작가님 컨셉: 품위 있는 섹시함, 이너 베이스 위 레이어드 패션 모델 목표 | iMac/쌍아 |
| 2026-10-25 19:04 | 갱신 | project_monk_models_character_assets.md — Imagen 4 초기 제작·재생성 불가 자산, Kling 이너 광고 생성 가능 실측 | iMac/쌍아 |
| 2026-10-25 21:15 | 갱신 | project_platform_vs_single_identity.md — 여러 개 동시=숙제 증가, 하나라도 시장에(specs) 원칙 | iMac/쌍아 |
| 2026-10-25 21:19 | 갱신 | feedback_pf_status_leave_active.md — PF 철학: 살아 있는 프로젝트·미완의 자산 | iMac/쌍아 |
| 2026-10-25 21:25 | 갱신 | feedback_pf_status_leave_active.md — 쉬는 PF=도구 성숙 대기(VTON·SPREAD·VIDEO·PRESENTATION) | iMac/쌍아 |
| 2026-10-25 21:28 | 갱신 | feedback_pf_status_leave_active.md — 시차 우위: PF=아직 없는 것까지 품은 비전이자 현재 | iMac/쌍아 |
| 2026-10-25 21:30 | 추가 | project_soso_design_lead.md — 소소 디자인 TF 리드 기록 위치·빈칸 실측 | iMac/쌍아 |
| 2026-10-25 21:35 | 갱신 | project_soso_design_lead.md — 프론트·디자인=노동집약·시장 접점 진단 | iMac/쌍아 |
| 2026-10-25 21:38 | 갱신 | project_soso_design_lead.md — 라이브 UI 체험·비교 단계=디자인 영역 해법 | iMac/쌍아 |
| 2026-10-25 21:50 | 갱신 | project_process_as_curriculum_continuity.md — 수동 경험=장애 대응력(에이전트 경로 공식화 맥락) | iMac/쌍아 |
| 2026-10-25 21:59 | 갱신 | project_monkos_sovereignty.md — 손오공·근두운 선언 | iMac/쌍아 |
| 2026-10-25 22:52 | 갱신 | feedback_license_warnings_at_launch.md — 트렌드 대화에 우려 꼬리표 재발 교정 | iMac/쌍아 |
| 2026-10-25 22:55 | 갱신 | project_humanities_sensibility_layer.md — 장삼이사·살아 있는 NPC 게임 축 연결 | iMac/쌍아 |

| 2026-10-29 14:03 | 갱신 | project_soso_design_lead.md — 10-28 첫 실가동 사실(시안 A·B·결정 대기·팀 미노출→서브에이전트 553k) + MEMORY.md 1행 | iMac/민아 |
| 2026-10-29 14:41 | 신규 | feedback_design_tokens_reference_not_constraint.md — 토큰=기준점·틀 아님(작가님 14:41) + MEMORY.md 1행 | iMac/쌍아 |
| 2026-10-29 14:43 | 갱신 | project_4060_intentional_downtime.md — 재구축 완료(작가님 10-29)·테일넷 last seen ≈09-30·현재 꺼짐 + MEMORY.md 1행 | iMac/민아 |
| 2026-10-29 15:01 | 추가 | reference_claude_design_docs.md — Claude Design 공식 문서·의도·Claude Code 연동 요약 + MEMORY.md 1행 | iMac/민아 |
- 2026-11-02 21:38 KST MEMORY 추가: feedback_header_time_last_measured (헤더 시각=마지막 실측 복사, 작가님 21:37)
- **[2026-11-05 14:50 KST]** iMac/쌍아 — 추가: project_idphoto_kr_trunk_lineage (증명사진 축 계보, 작가님 14:50)
- **[2026-11-05 14:55 KST]** iMac/쌍아 — 갱신: feedback_audit_is_mina_role (마케팅·보안·검수=민아 메인, 작가님 14:54)
- **[2026-11-05 15:16 KST]** iMac/쌍아 — 추가: project_idphoto_kr_direct_pay_pivot (kr 직접 결제 전환 4항, 작가님 15:16)
- **[2026-11-05 15:32 KST]** iMac/쌍아 — 갱신: project_idphoto_kr_direct_pay_pivot (무료 생성 폐지·첫 가입 첫 결제 보너스, 작가님 15:32)
- **[2026-11-05 15:33 KST]** iMac/쌍아 — 갱신: project_idphoto_kr_direct_pay_pivot (1컷 결제→다른 컷 크레딧 마케팅, 작가님 15:33)
- **[2026-11-05 18:05 KST]** iMac/쌍아 — 추가: project_idphoto_price_ladder_20261105 (가격 사다리 개편, 작가님 18:05)
- **[2026-11-05 20:15 KST]** iMac/쌍아 — 갱신: project_go_commentary_llm_vision (형세판단봇 방향, 작가님 20:15)
- **[2026-11-05 20:25 KST]** iMac/쌍아 — 갱신: project_go_commentary_llm_vision (복기 해설집 방향 4항, 작가님 20:25)
- **[2026-11-05 20:32 KST]** iMac/쌍아 — 갱신: project_small_ai_plus_code_doctrine (데이터링→코드화 일반화, 작가님 20:32)
- **[2026-11-05 20:47 KST]** iMac/쌍아 — 갱신: project_small_ai_plus_code_doctrine (4단 정식화, 작가님 20:47)
