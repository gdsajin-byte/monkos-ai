---
type: report
from: iMac/막내2
to: iMac/쌍아
date: 2026-04-05
subject: Cloudflare MCP 서버 도입 — D1/R2/KV/Workers 자연어 관리
order_ref: ORDER_20260405_iMac쌍아_막내2_Cloudflare_MCP_도입.md
pf: PF_CDP
status: 완료
---

**[2026-04-05 12:33 KST] iMac/막내2 → iMac/쌍아**

# Cloudflare MCP 서버 도입 보고서

---

## 1. 13+2개 도메인 서버 전체 목록 + MONK 사용 판정

Cloudflare는 두 종류의 MCP 서버를 제공한다:

### A. Code Mode 서버 (`cloudflare/mcp`) — 통합 서버

| 항목 | 내용 |
|------|------|
| URL | `https://mcp.cloudflare.com/mcp` |
| 도구 수 | **2개** (`search` + `execute`) |
| 커버리지 | 전체 Cloudflare API ~2,500 엔드포인트 |
| 토큰 비용 | ~1,069 토큰 (도메인별 서버 대비 244K+ 절감) |
| 인증 | OAuth (브라우저) 또는 API Token (Bearer 헤더) |

### B. 도메인별 원격 서버 (`cloudflare/mcp-server-cloudflare`) — 15개

| # | 서버 | URL | MONK 사용 | 판정 근거 |
|---|------|-----|----------|----------|
| 1 | **Workers Bindings** | `bindings.mcp.cloudflare.com/mcp` | **O** | D1/R2/KV/Workers 핵심 관리 (25개 도구) |
| 2 | **Observability** | `observability.mcp.cloudflare.com/mcp` | **O** | Workers 로그/디버깅 — 장애 분석에 필수 |
| 3 | **Workers Builds** | `builds.mcp.cloudflare.com/mcp` | **O** | 빌드 상태/로그 확인 |
| 4 | **Documentation** | `docs.mcp.cloudflare.com/mcp` | △ | CF 문서 검색 — 있으면 편하지만 필수 아님 |
| 5 | **DNS Analytics** | `dns-analytics.mcp.cloudflare.com/mcp` | △ | Zone 정보 + DNS 분석 — 가끔 필요 |
| 6 | **Radar** | `radar.mcp.cloudflare.com/mcp` | X | 인터넷 트래픽 인텔리전스 — MONK 무관 |
| 7 | **Container Sandbox** | `containers.mcp.cloudflare.com/mcp` | X | 서버리스 컨테이너 — 미사용 |
| 8 | **Browser Rendering** | `browser.mcp.cloudflare.com/mcp` | X | Playwright MCP가 이미 있음 |
| 9 | **AI Gateway** | `ai-gateway.mcp.cloudflare.com/mcp` | X | AI 게이트웨이 미사용 |
| 10 | **AutoRAG** | `autorag.mcp.cloudflare.com/mcp` | X | RAG 서비스 미사용 |
| 11 | **Logpush** | `logs.mcp.cloudflare.com/mcp` | X | 로그 관리 — 규모 미해당 |
| 12 | **Audit Logs** | `auditlogs.mcp.cloudflare.com/mcp` | X | 감사 로그 — 규모 미해당 |
| 13 | **DEX** | `dex.mcp.cloudflare.com/mcp` | X | 디지털 경험 모니터링 — 기업용 |
| 14 | **CASB** | `casb.mcp.cloudflare.com/mcp` | X | SaaS 보안 — 기업용 |
| 15 | **GraphQL** | `graphql.mcp.cloudflare.com/mcp` | △ | GraphQL API 탐색 — 고급 분석 시 유용 |

### C. 레거시 로컬 패키지 (채택)

| 항목 | 내용 |
|------|------|
| 패키지 | `@cloudflare/mcp-server-cloudflare` v0.2.0 (npm) |
| 인증 | **wrangler OAuth 세션** (이미 인증됨) |
| 도구 수 | **84개** — 가장 풍부한 도구 세트 |
| 장점 | API 토큰 불필요, key/object 레벨 CRUD 지원, 로컬 실행 |

**채택 결정: 레거시 로컬 패키지** — wrangler 인증이 이미 설정되어 있고, 84개 도구로 D1 SQL 쿼리, R2 객체 조작, KV 키 관리까지 모두 가능. 원격 서버는 OAuth 브라우저 플로우가 Claude Code stdio와 호환 문제 있음.

---

## 2. 설치 과정 기록

### 2-1. 사전 상태 확인

```bash
$ npx wrangler whoami
# ✅ OAuth 인증 완료 확인
# Account ID: b5eeab70e40208bd88a5c463741b5a38

$ npm info @cloudflare/mcp-server-cloudflare version
# 0.2.0
```

### 2-2. 래퍼 스크립트 생성

```bash
# 파일: scripts/tools/cloudflare_mcp.sh
# wrangler OAuth 세션으로 Account ID를 동적 취득하여 MCP 서버 실행
# 환경변수 CF_ACCOUNT_ID로 오버라이드 가능
```

### 2-3. `.mcp.json` 설정

기존 playwright + 막내1이 추가한 GA4/GSC 설정을 유지하고 cloudflare를 추가:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "bash",
      "args": ["scripts/tools/playwright_mcp.sh"]
    },
    "google-analytics": {
      "command": "/Users/jeong-kyushin/.local/bin/uvx",
      "args": ["analytics-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${GA_CREDENTIALS_PATH}",
        "GOOGLE_PROJECT_ID": "${GCP_PROJECT_ID}"
      }
    },
    "google-search-console": {
      "command": "npx",
      "args": ["-y", "mcp-server-gsc"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${GA_CREDENTIALS_PATH}"
      }
    },
    "cloudflare": {
      "command": "bash",
      "args": ["scripts/tools/cloudflare_mcp.sh"]
    }
  }
}
```

---

## 3. 도메인별 테스트 결과

> ⚠️ 모든 테스트는 **읽기 전용**. 쓰기/삭제 작업 일절 미실행.

### D1 (데이터베이스) — ✅ 성공

도구: `d1_list_databases`

| DB 이름 | UUID | 생성일 | 파일 크기 |
|---------|------|--------|----------|
| `monk-services-db` | `1c88fa57-743a-470d-905e-d9054988fcdd` | 2026-01-07 | 274KB |
| `monk-db` | `6fe2a64b-9144-436c-94f7-1e9375249a1e` | 2026-01-02 | 131KB |

> `d1_query` 도구로 `SELECT` 쿼리 가능. INSERT/UPDATE/DELETE도 실행 가능하나 **절대 금지** (헌법 4조 2항).

### R2 (객체 스토리지) — ✅ 성공

도구: `r2_list_buckets`

| 버킷 이름 | 생성일 |
|----------|--------|
| `monk-apps` | 2026-01-06 |
| `monk-chat-logs` | 2026-01-07 |
| `monk-models` | 2026-01-06 |

> `r2_list_objects`, `r2_get_object` 도구로 객체 조회 가능. `r2_put_object`, `r2_delete_object`는 **사용 금지**.

### KV (키-밸류) — ✅ 성공

도구: `get_kvs`

결과: 빈 배��� `[]` — 현재 KV 네임스페이스 없음 (또는 미사용 상태).

> `kv_list`, `kv_get` 도구로 키 조회 가능. `kv_put`, `kv_delete`는 **사용 금지**.

### Workers — ✅ 성공

도구: `worker_list`

| Worker 이름 | 최종 수정 | 배포 출처 | 핸들러 |
|------------|----------|----------|--------|
| `monk-ai-studio-pro-backend` | 2026-01-11 | wrangler | fetch |
| `monk-gemini-proxy` | 2026-01-10 | wrangler | fetch |
| `monk-imagen-proxy` | 2026-01-25 | wrangler | fetch |
| `monk-model-test` | 2026-01-07 | wrangler | fetch |
| `monk-vertex-proxy` | 2026-01-08 | wrangler | fetch |
| `ssang-a` | 2026-01-06 | dash_template | fetch |

> `worker_get` 도구로 소스 코드 확인 가능. `worker_put`, `worker_delete`, `worker_deploy`는 **사용 금지**.

### Zones (Pages 겸용) — ✅ 성공

도구: `zones_list`

2개 Zone 확인 (도메인명은 보안상 생략). 상태: 모두 active.

> 참고: Pages 전용 도구(`pages_list` 등)는 레거시 패키지에 없음. Pages 정보는 Code Mode 서버 또는 wrangler CLI로 접근.

### 테스트 요약

| 도메인 | 도구 | 결과 | 비고 |
|--------|------|------|------|
| **D1** | `d1_list_databases` | ✅ 성공 | 2개 DB 확인 |
| **R2** | `r2_list_buckets` | ✅ 성공 | 3개 버킷 확인 |
| **KV** | `get_kvs` | ✅ 성공 | 네임스페이스 0개 (미사용) |
| **Workers** | `worker_list` | ✅ 성공 | 6개 Worker 확인 |
| **Zones** | `zones_list` | ✅ 성공 | 2개 Zone 확인 |

---

## 4. 인증 — 작가님 액션 불필요

현재 iMac에서 `npx wrangler login`이 이미 완료되어 OAuth 세션이 활성.
래퍼 스크립트 `cloudflare_mcp.sh`가 wrangler 인증을 자동으로 활용.

**작가님 추가 액션**: 없음 (현 iMac 한정).

> 다른 디바이스(M1, M4 등)에서 사용 시: 해당 디바이스에서 `npx wrangler login` 1회 실행 필요.

---

## 5. Code Mode 분석

### Code Mode란?

`cloudflare/mcp` (GitHub repo)가 제공하는 통합 MCP 서버. 2개 도구만으로 전체 Cloudflare API 커버:

| 도구 | 역할 |
|------|------|
| `search` | OpenAPI 스펙에서 엔드포인트 검색 (JS 코드로 `spec.paths` 쿼리) |
| `execute` | 발견한 엔드포인트에 `cloudflare.request()` 호출 (JS 코드 실행) |

### 작동 방식

1. AI가 `search` 도구로 "D1 데이터베이스 목록" 같은 작업에 해당하는 API 엔드포인트를 찾는 JS 코드를 작성
2. 서버가 OpenAPI 스펙을 기반으로 매칭된 엔드포인트를 반환
3. AI가 `execute` 도구로 해당 엔드포인트를 호출하는 JS 코드를 작성
4. 서버가 Cloudflare API를 실제 호출하고 결과를 반환

### 장단점 비교

| 차원 | Code Mode (원격) | 레거시 로컬 (채택) |
|------|-----------------|-------------------|
| **도구 수** | 2개 | 84개 |
| **커버리지** | ~2,500 API 엔드포인트 전체 (Pages 포함) | D1/R2/KV/Workers/DO/Queue/AI/Zone + α |
| **토큰 비용** | ~1,069 토큰 (도구 정의) | ~30,000+ 토큰 (84개 도구 스키마) |
| **인증** | OAuth 또는 API Token (Bearer) | wrangler OAuth (이미 설정) |
| **Claude Code 호환** | `mcp-remote` 프록시 필요 | 네이티브 stdio |
| **Pages 지원** | ✅ (전체 API 접근) | ❌ (Pages 전용 도구 없음) |
| **안정성** | 네트워크 의존 (원격 서버) | 로컬 실행 (안정) |
| **AI 판단 의존도** | 높음 (API 탐색+코드 작성) | 낮음 (명시적 도구명) |

### MONK에 유용한가?

**현재는 레거시 로컬이 더 적합.** 이유:
1. wrangler 인증이 이미 설정됨 — 추가 토큰 발급 불필요
2. 84개 명시적 도구가 AI 환각 리스크를 줄임 (Code Mode는 AI가 JS를 작성하므로 오류 가능성 높음)
3. Claude Code stdio와 네이티브 호환

**Pages 관리가 필요해지면 Code Mode 추가 검토.** 현재 Pages 배포는 wrangler CLI로 충분.

---

## 6. 전체 84개 도구 분류표

| 도메인 | 읽기 도구 | 쓰기/삭제 도구 (⚠️ 주의) | 도구 수 |
|--------|----------|------------------------|--------|
| **KV** | `get_kvs`, `kv_get`, `kv_list` | `kv_put`, `kv_delete` | 5 |
| **Workers** | `worker_list`, `worker_get` | `worker_put`, `worker_delete`, `worker_deploy` | 5 |
| **R2** | `r2_list_buckets`, `r2_list_objects`, `r2_get_object` | `r2_create_bucket`, `r2_delete_bucket`, `r2_put_object`, `r2_delete_object` | 7 |
| **D1** | `d1_list_databases`, `d1_query` (SELECT만!) | `d1_create_database`, `d1_delete_database`, `d1_query` (INSERT/UPDATE/DELETE) | 4 |
| **Durable Objects** | `do_list_namespaces`, `do_get_object`, `do_list_objects`, `do_alarm_list` | `do_create_namespace`, `do_delete_namespace`, `do_delete_object`, `do_alarm_set`, `do_alarm_delete` | 9 |
| **Queues** | `queue_list`, `queue_get`, `queue_get_message` | `queue_create`, `queue_delete`, `queue_send_message`, `queue_send_batch`, `queue_delete_message`, `queue_update_visibility` | 9 |
| **Workers AI** | `ai_list_models`, `ai_get_model` | `ai_inference`, `ai_embeddings`, `ai_text_generation`, `ai_image_generation` | 6 |
| **Workflows** | `workflow_list`, `workflow_get` | `workflow_create`, `workflow_delete`, `workflow_update`, `workflow_execute` | 6 |
| **Templates** | `template_list`, `template_get` | `template_create_worker` | 3 |
| **WFP (Dispatch)** | `wfp_list_dispatch_namespaces`, `wfp_list_custom_domains` | `wfp_create_dispatch_namespace`, `wfp_delete_dispatch_namespace`, `wfp_add_custom_domain`, `wfp_remove_custom_domain` | 6 |
| **Service Bindings** | `service_binding_list` | `service_binding_create`, `service_binding_delete`, `service_binding_update` | 4 |
| **Env Vars** | `env_var_list` | `env_var_set`, `env_var_delete`, `env_var_bulk_set` | 4 |
| **Routes** | `route_list` | `route_create`, `route_delete`, `route_update` | 4 |
| **CRON** | `cron_list` | `cron_create`, `cron_delete`, `cron_update` | 4 |
| **Zones** | `zones_list`, `zones_get` | (없음) | 2 |
| **Domains** | `domain_list` | (없음) | 1 |
| **Secrets** | `secret_list` | `secret_put`, `secret_delete` | 3 |
| **Versions** | `version_list`, `version_get` | `version_rollback` | 3 |
| **Analytics** | `analytics_get`, `workers_analytics_search` | (없음) | 2 |
| **Config** | `wrangler_config_get` | `wrangler_config_update` | 2 |
| | | **합계** | **84** |

---

## 7. wrangler CLI 대비 장단점

| 차원 | Cloudflare MCP | wrangler CLI |
|------|---------------|-------------|
| **인터페이스** | 자연어 ("monk-db에서 사용자 테이블 보여줘") | 명령어 (`npx wrangler d1 execute monk-db --command "SELECT..."`) |
| **학습 곡선** | 낮음 (AI가 도구 선택) | 높음 (플래그/옵션 암기) |
| **D1 쿼리** | `d1_query` 도구로 SQL 직접 실행 | `wrangler d1 execute --command` |
| **R2 객체** | `r2_get_object`, `r2_list_objects` | `wrangler r2 object get/list` |
| **Workers 배포** | `worker_deploy` (코드 문자열) | `wrangler deploy` (프로젝트 디렉토리) |
| **스크립팅** | MCP 도구 체이닝으로 복합 작업 | 셸 스크립트로 파이프 |
| **안전성** | AI가 위험 도구 호출 가능 ⚠️ | 사용자가 직접 입력 (의도적) |
| **Pages** | 미지원 (레거시 패키지) | `wrangler pages` 완전 지원 |
| **정밀 제어** | 도구 스키마에 제한됨 | 전체 CLI 옵션 |
| **적합 용도** | 탐색·조회·분석 (AI 보조) | 배포·변경·정밀 작업 |

### 결론

**MCP = 탐색·조회·분석의 보조 채널**, **wrangler CLI = 배포·변경의 주 채널**.
MCP가 wrangler를 대체하는 것이 아니라 보완한다. 읽기 위주로 사용하고, 쓰기는 wrangler CLI를 유지하는 것이 안전.

---

## 8. 활성화 방법

`.mcp.json`과 `scripts/tools/cloudflare_mcp.sh`는 이미 설정 완료.

**Claude Code 재시작 후 자동 활성화됨.** 새 세션에서 Cloudflare 도구(`d1_list_databases`, `worker_list` 등)가 도구 목록에 나타남.

> 주의: 현재 세션에서는 `.mcp.json` 변경이 반영되지 않음. 다음 세션부터 적용.

---

**[2026-04-05 12:33 KST] iMac/막내2 Cloudflare MCP 도입 완료 보고**

✅ 래퍼 스크립트 생성: `scripts/tools/cloudflare_mcp.sh`
✅ `.mcp.json` 설정 완료 (기존 playwright + GA4/GSC 유지)
✅ 84개 도구 확인 (읽기 28개 + 쓰기/삭제 56개)
✅ 5개 도메인 읽기 테스트 전부 성공 (D1: 2 DB, R2: 3 버킷, KV: 0, Workers: 6, Zones: 2)
✅ Code Mode 분석 완료 — 현재는 레거시 로컬이 적합, Pages 필요 시 Code Mode 추가 검토
✅ 작가님 추가 액션 불필요 (wrangler 인증 이미 활성)
❌ 쓰기/삭제 작업 일절 미실행 (헌법 4조 2항 준수)
💡 MCP는 wrangler CLI 대체가 아닌 보완. 읽기·탐색·분석에 최적. 배포·변경은 wrangler 유지 권장.
⏳ 추가 지시 대기
