---
type: order
date: 2026-06-08
from: iMac/쌍아
to: iMac/막내2
portfolio: PF_SPREAD, PF_CDP, PF_OPUS, PF_PORTAL
status: 대기
---

# 지시서 — SPREAD 채널별 에디터 구조 분석 + CDP/MCP/Skills 적용방안 종합 정리

**[2026-06-08 13:02 KST] iMac/쌍아 → iMac/막내2**

---

## 배경

6/7 세션에서 **IDPASS 4채널 수동 배포 실전**(네이버·note·Reddit·Medium)을 완료하고, **채널별 API vs CDP 최적 방안 전수 조사** 결과 3층 구조가 확정되었다:

- **Layer 1** — API 직통 (Reddit/X/Facebook/Instagram/네이버)
- **Layer 2** — API + 보완 (네이버 리치서식)
- **Layer 3** — CDP 전용 (note.com/Medium)

또한 PF_CDP Phase 2.5에서 **Skills 패키징** 방향이 어젠다에 올라와 있고(`/blog-write`, `/deploy-status` 등), PF_OPUS가 요구하는 **생산 자동화율 60% 목표**와도 직결된다.

현재 민아+작가님이 블로그 에디터 고도화(이미지 생성/저장/썸네일)를 설계 중이며, 막내1이 에디터 현황 분석을 병행한다. **이 지시서는 SPREAD 관점에서 "배포 채널 쪽 에디터들"을 전수 분석하는 것**이다.

---

## 임무

### Phase 1: 배포 채널별 에디터 구조 분석

각 채널의 에디터(글 작성 화면)가 어떤 기술 구조인지 분석하라. **Playwright MCP로 실제 접속하여 접근성 트리를 확인**하는 것을 권장하되, 로그인 세션이 없는 채널은 공개 정보 + PF_SPREAD §7 + PF_CDP 히스토리 기반으로 정리.

**분석 대상 11채널:**

| # | 채널 | URL 패턴 | 에디터 유형 |
|---|------|----------|-------------|
| 1 | **MONKOS Admin** | monkos.ai/admin/blog-edit.html | Toast UI (WYSIWYG, ProseMirror) |
| 2 | **네이버 블로그** | blog.naver.com | SmartEditor ONE (iframe+contentEditable) |
| 3 | **티스토리** | tistory.com | iframe 에디터 (innerHTML 주입) |
| 4 | **note.com** | note.com/notes/new | SPA (ClipboardEvent paste) |
| 5 | **Medium** | medium.com/new-story | contentEditable (backendNodeId 파일업) |
| 6 | **Reddit** | reddit.com/submit | Fancy Editor / Markdown 전환 |
| 7 | **X (Twitter)** | x.com/compose | data-testid 기반 SPA |
| 8 | **GitHub Issues** | github.com/issues/new | textarea (마크다운) |
| 9 | **LinkedIn** | linkedin.com/feed | SPA 동적 로딩 |
| 10 | **YouTube Studio** | studio.youtube.com | 영상 업로드 + 메타데이터 폼 |
| 11 | **카카오 비즈** | center-pf.kakao.com | 메시지 작성 폼 |

**각 채널별 정리 항목:**

```
채널명:
├── 에디터 기술 스택 (프레임워크, contentEditable 방식, iframe 여부)
├── 텍스트 입력 방법 (직접 타이핑 / insertText / paste / innerHTML / API)
├── 서식 적용 (볼드/H2/링크 — 가능 여부 + 방법)
├── 이미지 삽입 (드래그앤드롭 / 파일업로드 / URL / API)
├── 발행 트리거 (버튼 클릭 / API 호출 / 폼 서밋)
├── CDP 검증 상태 (✅ / 🟡 / ❌ + 근거)
├── 난제 사항 (저장 후 소실, 봇 탐지, 서식 누락 등)
└── 최적 자동화 도구 (CDP / Playwright MCP / API / Stagehand / 수동)
```

### Phase 2: 현행 MCP 도구 + Skills 인벤토리

현재 프로젝트에 등록된 MCP 서버와 Skills를 전수 파악하고, SPREAD 배포에 활용 가능한 것을 매핑하라.

**2-1. MCP 서버 현황** (`.mcp.json` + `.claude/settings.local.json` 확인)

| 서버 | 도구 수 | SPREAD 활용 가능 기능 |
|------|---------|---------------------|
| Playwright | 38개 | 채널 에디터 제어, 스크린샷 검증 |
| Cloudflare | 84개 | D1 콘텐츠 DB, R2 이미지, Workers 배포 |
| GA4 MCP | ? | 배포 후 성과 측정 |
| GSC MCP | ? | 색인 상태 확인 |

**2-2. Skills 현황** (`.claude/skills/` 디렉토리)

- 현행 스킬 목록과 각 스킬의 기능 1줄 요약
- SPREAD 배포 워크플로우에서 활용 가능한 스킬 식별

**2-3. cdp_utils.py 현황** (`scripts/tools/cdp_utils.py`)

- 현재 줄 수, 주요 클래스/함수 목록
- SPREAD 채널별로 어떤 함수가 대응하는지 매핑

### Phase 3: 3층 전략 + Skills 패키징 방안 제안

Phase 1-2 분석을 종합하여 아래를 제안하라.

**3-1. 채널별 최적 자동화 전략 (3층 구조 정교화)**

6/7에 확정된 3층(API/API+보완/CDP) 구조를 각 채널 에디터 분석 결과와 대조하여 정교화.

```
Layer 1 (API 직통):    어떤 채널이 여기? 어떤 API?
Layer 2 (API + CDP 보완): 어떤 채널? API로 뭘, CDP로 뭘?
Layer 3 (CDP/Playwright 전용): 어떤 채널? 어떤 도구?
Layer 4 (Stagehand/수동):    난제 채널. 비용 예측?
```

**3-2. Skills 신규 제안**

PF_CDP Phase 2.5 어젠다(#22)에 있는 Skills 패키징 방향을 구체화:

| Skill 후보 | 트리거 | 동작 | 연관 PF |
|-----------|--------|------|---------|
| `/blog-publish` | 블로그 발행 시 | 원본 작성 → 다국어 번역 → 채널별 가공 | PORTAL+SPREAD |
| `/spread-deploy` | 배포 지시 시 | N채널 동시 배포 오케스트레이션 | SPREAD+CDP |
| `/channel-check` | 배포 후 | 각 채널 발행 상태 + 스크린샷 검증 | SPREAD+CDP |
| (추가 제안) | | | |

**3-3. PF 정합성 + 간극 분석**

- PF_OPUS 플라이휠 ②배포 축에서 SPREAD가 커버하지 못하는 간극
- PF_CDP Phase 4(스케줄 자동 배포)와 현재 도구 성숙도의 갭
- PF_PORTAL 블로그 에디터(막내1 분석)와 SPREAD 원본 허브의 연결점

---

## ⚠️ 준수 조항

- **코드 수정 없음** — 분석·제안만. 구현은 후속 지시서에서 별도 발행.
- Playwright MCP로 외부 사이트 접속 시 **로그인 필요한 채널은 접근성 트리만 확인하거나 기존 검증 기록 인용**. 자격 증명 생성/추측 절대 금지 (헌법 4조 1항).
- 매 턴 `date`로 KST 취득 (헌법 3조 1항).
- ch7 1조: 지시 범위 외 파일 수정 금지.

---

## 납품

- `monkos-ops/ops/completions/2026-06/COMPLETION_20260608_막내2_SPREAD_채널별에디터+CDP_MCP_Skills_분석.md`
- 완료 후 `✅❌💡⏳📁🔀` 형식 보고.
