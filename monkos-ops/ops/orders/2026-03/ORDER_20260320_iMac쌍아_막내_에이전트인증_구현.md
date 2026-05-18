---
type: ORDER
id: ORDER_20260320_iMac쌍아_막내_에이전트인증_구현
date: 2026-03-20
from: iMac/쌍아
to: 막내
priority: P1
status: 대기
ref: monkos-ops/ops/proposals/PROPOSAL_20260320_민아_에이전트전용인증_기안서.md
---

# 에이전트 전용 인증 — 구현

**[2026-03-20 17:01 KST] iMac/쌍아 → 막내**

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내 → iMac/쌍아` 형식

## 배경

민아(Claude Desktop)가 monkos.ai 어드민에 접근하려면 OAuth 벽을 넘어야 한다. API Key 기반 에이전트 인증을 추가하여 민아·코웍이 등 에이전트가 어드민 API를 자율적으로 호출할 수 있게 한다.

기안서: `monkos-ops/ops/proposals/PROPOSAL_20260320_민아_에이전트전용인증_기안서.md`

## 작업 1: admin-auth.js 폴백 추가

파일: `monkos_AI/portal/lib/cms/admin-auth.js`

현재 `requireAdmin()`이 쿠키 기반 인증만 처리. 쿠키 인증 실패 시 **Bearer 토큰 폴백**을 추가:

```
처리 순서:
1. 기존 쿠키 인증 시도 (현행 유지)
2. 쿠키 실패 시 → Authorization 헤더 확인
3. Bearer AGENT_ 접두사 → AGENT_API_KEYS 환경변수에서 매칭
4. 매칭 성공 → { userId: 'agent_{name}', isAdmin: true, isAgent: true } 반환
5. 매칭 실패 → 401 (현행 유지)
```

키 형식: `AGENT_{에이전트명}_{랜덤hex}` — 에이전트명으로 감사 추적 가능

## 작업 2: 에이전트 세션 쿠키 발급 엔드포인트

파일: `monkos_AI/portal/lib/cms/admin-auth.js` + `monkos_AI/portal/server.js`

민아는 MCP 브라우저로 접근하므로 매 요청마다 Bearer 헤더를 붙이기 어려울 수 있다. **API Key로 세션 쿠키를 발급받는 엔드포인트** 추가:

```
POST /auth/agent
Body: { "key": "AGENT_MINA_xxxxx" }
Response: Set-Cookie: monkos_session={token} + { success: true, agent: "mina" }
```

이렇게 하면 민아가 최초 1회 `/auth/agent` 호출 → 쿠키 획득 → 이후 일반 브라우저처럼 어드민 접근 가능.

## 작업 3: 감사 로그 태깅

파일: `monkos_AI/portal/lib/cms/admin-auth.js`

에이전트 인증 성공 시 로그에 `[AGENT]` 태그:

```
[AGENT] 에이전트 인증 성공: agent_mina (Bearer)
[AGENT] 에이전트 세션 발급: agent_mina (POST /auth/agent)
```

## 작업 4: config.js 환경변수 등록

파일: `monkos_AI/portal/lib/shared/config.js`

```javascript
export const AGENT_API_KEYS = (process.env.AGENT_API_KEYS || '').split(',').filter(Boolean);
```

**키 값은 작성하지 마라.** placeholder만. 실제 키는 작가님이 Cloud Run 환경변수에 직접 등록.

## 작업 5: server.js 라우트 추가

```
POST /auth/agent → handleAgentAuth (admin-auth.js에서 export)
```

## 하지 않는 것

- API 키 생성/하드코딩 **절대 금지** (헌법 4조 1항)
- `.env` 파일에 실제 키 작성 금지
- 기존 OAuth 인증 로직 변경 금지 — 폴백 추가만
- Rate limit은 이번 범위 밖 (향후 별도)

## 검증

```
□ 기존 OAuth 로그인 → 어드민 접근 정상 (기존 기능 보존)
□ Bearer AGENT_TEST 헤더 → 인증 실패 (AGENT_API_KEYS에 없으므로)
□ POST /auth/agent { key: "invalid" } → 401
□ config.js에 AGENT_API_KEYS export 존재
□ 로그에 [AGENT] 태그 출력 확인
```

**실제 키 등록 후 테스트는 작가님이 직접 진행.** 막내는 코드 구현만.

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `보고 대기` |
| 산출물 | `monkos-ops/ops/reports/REPORT_20260320_막내_에이전트인증_구현.md` |
| 문서 유형 | `REPORT` |
| 세션 로그 | 해당 없음 |

## ⚠️ 준수 조항

- 헌법 4조 1항 — API 키 생성/추측 절대 금지. placeholder만
- 헌법 4조 2항 — `.env` 무단 수정 금지
- 헌법 5조 1항 — 기존 OAuth 인증 깨뜨리지 말 것
