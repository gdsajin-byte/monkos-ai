# 인프라 상수 정본 참조

> **사본 금지**: 이 문서는 상수의 정본이거나, 정본으로 가는 포인터이다. 값을 복사하여 다른 문서에 박지 않는다.
> 각 항목의 정본 위치를 명기한다. 값이 바뀌면 정본을 고치고, 이 문서의 포인터만 확인한다.

## 서비스 도메인

| 서비스 | 도메인 | 인프라 | 정본 |
|--------|--------|--------|------|
| 포털 | monkos.ai | Cloud Run | deploy.sh |
| 증명사진 KR | idphoto-kr.monkos.ai | Cloud Run | idphoto-kr/deploy.sh |
| 증명사진 JP | idphoto-jp.monkos.ai | Cloud Run | idphoto-jp/deploy.sh |
| 크롭 엔진 | (내부) | Cloud Run | crop-engine/deploy.sh |
| 매팅 엔진 | matte.monkos.ai | 4060 GPU + CF Tunnel | monkos_AI/matte-server/deploy.sh |
| monk.kr | monk.kr | CF Pages | MONK_kr/ |
| pt.monkos.ai | pt.monkos.ai | Cloud Run | [2조 한시적 예외] |

## 배포

- 정본: `deploy.sh` (각 서비스 디렉토리). `gcloud run deploy` 직접 실행 금지 (ch5).
- 프로젝트: `monkos` (정본: deploy.sh:51)
- 리전: `us-central1` (정본: deploy.sh:52). 하드코딩 금지.
- prod rev 실측: `gcloud run services describe monkos-portal --region us-central1 --format='value(status.latestReadyRevisionName)'`

## 가격

- 정본: `lib/shared/config.js` PRODUCTS + LEMON_VARIANT_MAP
- 10c = $1 = ₩1,500 = ¥150 (2026-07-06 작가님 확정, config.js:142)
- 표시 문자열은 정본에서 파생. i18n 사전에 금액 하드코딩 금지 (ch2 7조).

## Specs URL 정본 패턴

- 정본: `lib/cms/render-specs.js` ROUTE_MAP(138행) + REDIRECT_MAP(139행)
- ko: `/specs/{type}/{country}` (프리픽스 없음)
- en/ja/es: `/{lang}/specs/{type}/{country}`
- 데이터 키: `{country}-{type}` (specs-data.json)
- 구 슬러그(kr-passport, korea-passport) → 301 리다이렉트 → 정본
- URL 직접 조립 금지. 빌더 함수 경유 필수 (ch2 7조, 구현 예정: specs-url.js).

## 시크릿

- 정본: GCP Secret Manager
- 인벤토리(메타만): `monkos-ops/ops/SECRET_INVENTORY.md`
- 에이전트 접촉 금지. `secret` 커맨드 경유. 상세: ch4 10조 + data-access.md

## 도구 맵

> 도구 신설 시 **3요건** 동시 충족 필수 (미충족 = 미완료):
> 1. **인지** — 이 표에 등재 + 해당 rules/skills/PF에 포인터
> 2. **스모크** — 작동 실증 기록 (완료 보고 ≠ 실작동)
> 3. **실패 가시화** — 고장 시 무음 강등 금지, 명시 에러/경고 필수

| 분류 | 성격 | 위치 | 실행 주체 |
|------|------|------|----------|
| **MCP 도구** | 에이전트가 대화 중 호출하는 외부 기능 | MCP 서버 (scripts/retrieval 등) | 에이전트 자동 |
| **인프라 도구** | 서비스 무관, 에이전트 공용 기반 | `scripts/tools/` | 막내 또는 사람 |
| **CLI 스크립트** | 터미널에서 실행하는 범용 도구 | `scripts/` | 막내 또는 사람 |
| **빌드/생성 도구** | 에셋을 배치 생성하는 코드 | `{서비스}/tools/` | 막내 실행 |
| **SSR 컴포넌트** | 런타임 서빙 렌더 코드 | `{서비스}/lib/cms/components/` | 서버 자동 |

### 도구 소재 정본

| 도구 | 분류 | 위치 | 인지 경로 |
|------|------|------|----------|
| monk_search | MCP | `scripts/retrieval/` | `rules/mcp-tools.md` |
| monk_relations | MCP | `scripts/retrieval/` | `rules/mcp-tools.md` |
| monk_stats | MCP | `scripts/retrieval/` | `rules/mcp-tools.md` |
| cdp.sh + cdp_utils.py | 인프라 | `scripts/tools/` | `skills/cdp-browser.md` |
| secret | 인프라 | `scripts/secret.sh` (07-24 위치 오기 교정) | `rules/data-access.md` |
| credits.sh | CLI | `scripts/` | `rules/data-access.md` |
| mk-push.sh | CLI | `scripts/` | — |
| ads.sh | CLI | `scripts/` | — |
| deploy.sh | CLI | 각 서비스 디렉토리 | `rules/deployment.md` |
| gen_brand_diagrams_v5.mjs | 빌드/생성 | `portal/tools/specs-diagrams/` | PF_SPECS |
| gen_reference_diagrams.mjs | 빌드/생성 | `portal/tools/specs-diagrams/` | PF_SPECS |
| generate_samples.mjs | 빌드/생성 | `portal/tools/attire-assets/` | PF_SPECS |
| spec-diagram.js | SSR 컴포넌트 | `portal/lib/cms/components/` | — |
| mailer.js | 서비스 모듈 | `monkos_AI/portal/lib/` | PF_INFRA (⚠️ 실발송 스모크 미완 — Resend 도메인 인증 대기) |
| collectors/ (4종) | CLI | `scripts/collectors/` | PF_MARKET_EYE |
| seo_collect.sh | 인프라 | `scripts/tools/` | `commands/market-eye.md` |
| gsc_submit.sh | 인프라 | `scripts/tools/` | `rules/mcp-tools.md` |
| sa_audit.sh | 인프라 | `scripts/tools/` | SECRET_INVENTORY.md 권한 매트릭스 |
| secret_patrol.sh | 인프라 | `scripts/tools/` + launchd `ai.monkos.secret-patrol`(일 09:30) | PATROL_LOG.md |
| secret_meta_backfill.py | 인프라(1회성) | `scripts/tools/` | PROPOSAL_20260724 시크릿인지코드화 |
| seo_collectors.py | 인프라 | `scripts/tools/` | `commands/market-eye.md` |
| /market-eye | 스킬 | `.claude/commands/` | PF_MARKET_EYE |
| /4060 | 스킬 | `.claude/commands/` | PF_INFRA + PF_FACTORY |
| gitleaks-precommit.sh | 인프라 | `scripts/tools/` + `.git/hooks/pre-commit` | PF_SECURITY |
| matte_loadtest.py | 인프라 | `scripts/tools/` (4060에 실행 사본) | PF_INFRA + INCIDENT_20260725 |
| matte-probe (chain/leg/queue) | 빌드/생성 | `monkos_AI/portal/tools/matte-probe/` | PF_INFRA + INCIDENT_20260725 |
| matte-server deploy.sh | CLI | `monkos_AI/matte-server/` | `monkos_AI/matte-server/README.md` |
| fetch/verify_solar_terms.mjs | 빌드/생성 | `monkos_AI/portal/tools/solar-terms/` | 동 폴더 README + PF_FACEREAD |
| verify_saju.mjs | 빌드/생성 | `monkos_AI/portal/tools/saju/` | 동 폴더 README + PF_FACEREAD |

## 모델 배치

- 정본: 작가님 지시 (유동적)
- 현행 실측: `claude --version` + settings.json 확인
- 메모리 `project_model_placement.md`는 스냅샷 — 실측이 우선
