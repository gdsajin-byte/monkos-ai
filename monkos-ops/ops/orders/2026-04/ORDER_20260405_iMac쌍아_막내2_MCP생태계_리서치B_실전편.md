---
type: order
from: iMac/쌍아
to: iMac/막내2
date: 2026-04-05
subject: MCP 생태계 종합 리서치 B — 실전 적용·실험·경쟁편
status: 대기
priority: high
---

[2026-04-05 11:27 KST] iMac/쌍아 → iMac/막내2

# MCP 생태계 종합 리서치 B — 실전 적용·실험·경쟁편

## 1. 배경

막내1이 MCP 서버·프로토콜 전수 조사를 병렬로 진행 중이다.
너는 **실전 적용 시나리오 + 실험적 기술 + 경쟁 분석**에 집중하라.

## 2. 리서치 범위

### A. MONK OS 실전 적용 시나리오

현재 우리 업무 흐름에 MCP가 어떻게 붙을 수 있는지 구체적으로 설계 수준 조사:

| 업무 | 현재 방식 | MCP 적용 시 |
|------|----------|------------|
| 콘텐츠 배포 (SPREAD) | 수동 / CDP 스크립트 | Playwright MCP + 스케줄 자동화 |
| GA4/GSC 분석 | CDP 직접 조작 (불안정) | Playwright MCP 접근성 트리 |
| 이미지 생성 | Imagen API 직접 호출 | 이미지 MCP 서버 경유? |
| DB 조회 (D1) | wrangler CLI | D1/Cloudflare MCP |
| GCS 파일 관리 | gcloud CLI | GCP MCP |
| 팀 커뮤니케이션 | 텔레그램 수동 | Telegram MCP |
| SEO 모니터링 | 수동 체크 | 검색 MCP + 스케줄 |
| 블로그 작성 | CDP + 어드민 에디터 | Playwright MCP 고도화 |

### B. 실험적·최신 MCP 기술

- **MCP Composability** — MCP 서버가 다른 MCP 서버를 호출하는 체이닝
- **MCP Gateway / Proxy** — 여러 MCP 서버를 하나로 묶는 게이트웨이 패턴
- **MCP over SSH / 원격** — 4060 GPU 서버에서 MCP 서버 돌리고 iMac에서 연결
- **MCP + 멀티에이전트** — 여러 에이전트가 동일 MCP 서버 공유 시 세션 격리
- **MCP 캐싱 레이어** — 반복 호출 결과 캐싱 (Stagehand v3의 셀렉터 캐싱 아이디어)
- **MCP Marketplace / Registry** — 커뮤니티 서버 검색·설치 자동화
- **Anthropic Agent SDK + MCP** — 에이전트가 MCP 도구를 동적으로 발견·등록하는 패턴
- **MCP Sampling** — 서버가 LLM에게 역으로 질의하는 패턴 (양방향 소통)

### C. 경쟁·대안 분석

MCP 외에 에이전트 도구 확장 경쟁 프로토콜/프레임워크:

- **OpenAI Function Calling + Plugins** — MCP와의 차이, 장단점
- **LangChain Tools** — MCP 대비 위치
- **Vercel AI SDK Tool System** — 프론트엔드 에이전트 도구
- **Google A2A (Agent-to-Agent)** — MCP와 보완 관계?
- **기타 에이전트 프레임워크의 도구 체계** (CrewAI, AutoGen 등)
- 결론: MCP에 올인하는 게 맞는지, 헤지가 필요한지

### D. Playwright MCP 심층 분석

우리가 Phase 2에서 쓰고 있으니 특히 깊이 파기:

- 전체 도구 목록 21개의 상세 기능·제약
- `--cdp-endpoint` 모드 vs 자체 브라우저 런치 모드 차이
- 접근성 트리 기반 요소 선택의 한계·엣지케이스
- 비전 모드 (스크린샷 기반) 있는지
- 멀티탭/멀티윈도우 지원 수준
- 파일 다운로드/업로드 지원
- iframe 내부 조작 가능 여부
- SPA (React/Vue) 네비게이션 후 DOM 갱신 대기 패턴

### E. Stagehand v3 + Browser Use 최신 동향

Phase 2.5~3.5 대비:

- Stagehand v3 최신 릴리즈·변경점
- 비용 구조 (act() 1회당 토큰/비용 실측 사례)
- 캐싱 메커니즘 상세
- Browser Use 최신 버전 + MCP 서버 모드 지원 여부
- 두 도구 간 비교 매트릭스

## 3. 산출물

```
monkos-ops/ops/reports/REPORT_20260405_iMac막내2_MCP생태계_실전편.md
```

- 업무별 MCP 적용 시나리오 표 (현재 vs 적용 후 비교)
- 실험적 기술 각각: 개념 / 성숙도 / MONK OS 적용 가능성 / 리스크
- 경쟁 분석 비교표 + MCP 올인 여부 판단 근거
- Playwright MCP 21개 도구 상세표
- Stagehand vs Browser Use 비교 매트릭스
- **쌍아에게 건의할 우선순위 TOP 5** (바로 실행 가능한 것부터)

## 4. ⚠️ 준수 조항

- 헌법 3조 1항: 타임스탬프 절대 준수 (`date` 매 턴)
- 헌법 4조 1항: API 키/비밀정보 생성·추측 금지
- 법률 ch7: 리서치 전용 — 코드 수정/배포 하지 말 것. 보고서만 납품
- 웹 검색 적극 활용. 공식 문서 + GitHub + 실사용 사례 블로그/포럼까지 포함
