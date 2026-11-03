# 인프라 상수 정본 참조

> **사본 금지**: 이 문서는 상수의 정본이거나, 정본으로 가는 포인터이다. 값을 복사하여 다른 문서에 박지 않는다.
> 각 항목의 정본 위치를 명기한다. 값이 바뀌면 정본을 고치고, 이 문서의 포인터만 확인한다.

## 폴더 위상 — 레포 최상위 구조

> 위성·신규 환경의 구조 인지용 (PETITION_20260806 #9, 실측 2026-08-13). 상세 정본: 법률 ch4 1조.
> **🗺️ 서비스 지도 정본: `monkos-ops/tech/SERVICE_MAP.md`** — 특정 앱·서비스가 화제에 오르면 **코드 탐색 전에 이 지도 1개를 먼저 Read** (시각 트리 + 명칭 인덱스 + 존재 이유 + 상태 + 어드민 메뉴 전수. 매 턴 자동 로딩 아님 — 주제 진입 시 선택 로딩).

| 폴더 | 위상 |
|------|------|
| `MONK_kr/` | 본진 데스크톱 (CF Pages) |
| `monkos_AI/` | 모바일 AI 서비스군 (Cloud Run — 하위는 아래 §서비스 매핑) |
| `monkos-ops/` | 운영 체계 정본 (ops/tech/contents/marketing) |
| `governance/` | 법률+역사+철학 (정본) |
| `docs/` | 참고문헌+아카이브 (동결 — 과거 버전, 현행 설계 기준 금지) |
| `apps/` | 프로토타입/PoC. 구 프로덕션 이중 소스 2건은 10-01 `apps/_legacy/`로 이동(§서비스 매핑) |
| `functions/` | CF Workers |
| `scripts/` | 범용 유틸 (막내 소관) |
| ~~`monkos-ops/works/`~~ | **채널 폐지 (2026-08-13)** — 이력은 원격 `monkos-works` 레포 (ch4 4조) |

## 디바이스 맵 — 약칭 ↔ 노드·IP·ssh

- 정본: `monkos-ops/ops/devices/README.md` 디바이스 일람표 (+ `devices/{imac,m1,m2,w4060}/DEVICE_PROFILE.md`). Tailscale 호스트명 표: `monkos-ops/ops/SECRET_INVENTORY.md` §Tailscale 디바이스. 약칭 정의는 법률 ch1 4조.
- 실측 명령: `/Applications/Tailscale.app/Contents/MacOS/Tailscale status`. **노드 이름으로 디바이스를 추정하지 않는다** — 표의 IP로 대조 (10-23 `macmini-macmini`=집 M1, `kku-macmini-m2-macmini`=M2 오판 교정). 기록된 호스트명은 드리프트 가능 → 표 갱신 시 실측일 명기.

## 서비스 매핑 — 디렉터리 ↔ 서비스명 ↔ 도메인

> **⚠️ 디렉터리명 ≠ 서비스명.** 이름이 다른 건이 있어 "Cloud Run 목록에 없으니 미배포"라고 단정하면 틀린다(2026-08-13 실사고: `image-pro` → `monk-image-engine` 오판).
> **판정 순서: `deploy.sh`의 `SERVICE_NAME`을 먼저 읽는다.** 그것이 정본이다. 서비스 목록·도메인은 대조용.
> 실측 갱신: 2026-08-13. 대조 명령은 아래 §배포 참조.

| 소스 디렉터리 | Cloud Run 서비스 | 도메인 | 비고 |
|---|---|---|---|
| `monkos_AI/portal/` | `monkos-portal` (+`-dev`) | monkos.ai, preview.monkos.ai | ⚠️ 08-24부터 monkos.ai DNS는 CF 프록시 — 전 트래픽이 CF Worker `monkos-portal-edge` 경유 후 run.app 폴백. 웜 0 |
| `monkos_AI/portal/edge/` | (CF Worker) `monkos-portal-edge` | monkos.ai 존 라우트 `monkos.ai/*` | specs 정적 2,574p + CMS 캐시(10분 SWR). 배포 `edge/deploy.sh`. specs 변경 시 재배포 필수 (누락=무음 구본) |
| `monkos_AI/idphoto-kr/` | `monkos-idphoto-kr` (+`-dev`) | idphoto-kr.monkos.ai | |
| `monkos_AI/idphoto-jp/` | `monkos-idphoto-jp` (+`-dev`) | idphoto-jp.monkos.ai | 단일 정본 (10-01 T1 — 구 `apps/idphoto-jp-v079/`는 `apps/_legacy/`) |
| `monkos_AI/studio/` | `monkos-studio` (+`-dev`) | studio.monkos.ai | |
| **`monkos_AI/image-pro/backend/`** | **`monk-image-engine`** | **image.monkos.ai** | **IMAGE PRO. 꾸 상시 사용.** T2I=Vertex Imagen 4, I2I=Gemini 3 Pro Image. 포털 어드민 → IMAGE PRO(External) 경유. 단일 정본 (10-01 T1 — 구 `apps/monk_imagen4/backend/`는 `apps/_legacy/monk_imagen4-backend/`) |
| `apps/jangsam/` | `jangsam-dev` | — | prod 서비스 미생성 |
| `monkos_AI/matte-server/` | `birefnet-matte` (Cloud Run 아님) | matte.monkos.ai | 4060 GPU + CF Tunnel |
| `MONK_kr/` | — | monk.kr | CF Pages |
| — | (미확인) | pt.monkos.ai | 200 응답하나 us-central1 도메인 매핑·서비스 부재. 인프라 미상 — 확인 필요 [2조 한시적 예외] |

**이중 소스 — 2026-10-01 전수조사 T1로 해소** (비정본은 `apps/_legacy/`, 사유는 그 README)
- ~~`monk-image-engine`~~ 해소(10-01): `apps/monk_imagen4/backend/` → `apps/_legacy/monk_imagen4-backend/`
- ~~`monkos-idphoto-jp`~~ 해소(10-01): `apps/idphoto-jp-v079/` → `apps/_legacy/`
> 정본 일원화 완료(10-01). 두 deploy.sh의 게이트 5(이중 소스 경고)는 해제.

**deploy.sh는 있으나 서비스 부재**
- `monkos_AI/crop-engine/` → `monkos-crop-engine` — **asia-northeast3에 실존·200**(2026-09-04 실측, portal `CROP_ENGINE_URL` 주입 중). 08-13 "미생성"은 us-central1 조회 한정 오판 — 리전 상이
- `apps/monkos-matte/` → `monkos-matte`/`monkos-matte-gpu` 미생성

## 서비스 호출 관계 — 의존 엣지 + 크레딧 공유

> 실측 스냅샷: 2026-08-13 (PETITION_20260806 #11). **정본은 코드다** — 갱신 시 §배포의 재실측 3콜 + 각 서비스 API 호출부를 재확인하고 실측일을 갱신한다. 미생성 서비스는 위 "서비스 부재" 블록이 정본.

- **엣지 진입문 (08-24 컷오버)**: monkos.ai 전 요청 → CF Worker `monkos-portal-edge` → specs 정적/CMS 캐시는 엣지 종결, 그 외 run.app 오리진. 신뢰 헤더 X-Monkos-*(EDGE_TRUST_KEY AND CF대역 — `lib/shared/edge-trust.js`). 오리진의 페이지 열람 트래픽은 소멸이 정상이며 장애 아님.
- **크레딧·인증 허브 = 포털(monkos.ai)**: idphoto-kr/jp가 `PORTAL_API_URL` 경유로 `/api/credits/use·refund`(크레딧 차감·환급)와 OAuth 세션을 소비. 크레딧 잔액은 **전 서비스 공유 단일 원장**(Firestore `users`, 웰컴 +10c는 포털 auth 소관).
- **매팅 체인**: 포털 generate → `matte.monkos.ai`(4060 GPU, CF Tunnel) → 불통·포화 시 RunPod 폴백 (`portal/lib/matte.js` — 25s 타임아웃·줄서기).
- **생성 엔진**: idphoto-kr idgen → Vertex `gemini-3-pro-image` / 포털 specs 무료 트랙 → BiRefNet 매팅 / IMAGE PRO(`monk-image-engine`) → Imagen 4(T2I)·Gemini 3 Pro Image(I2I).
- **결제**: KR = 토스 (포털 API + idphoto-kr charge.html v2 위젯) / 글로벌·JP = Lemon Squeezy (포털 `/api/checkout` — **variant 소속 스토어 매칭 필수**, `config.js LEMON_JP_VARIANTS`). 웹훅 2본(JP·글로벌) → 포털 수신.
- **정적 본진**: monk.kr(CF Pages)은 위 체인과 독립 — 링크 유입만.

## 배포

- 정본: `deploy.sh` (각 서비스 디렉토리). `gcloud run deploy` 직접 실행 금지 (ch5).
- **CF 엣지 배포 정본: `monkos_AI/portal/edge/deploy.sh`** (SSG 빌드 선행 강제). 워커 로직 단독 변경 시에만 `wrangler deploy` 허용 (자산 불변 — 롤백 단위 분리, 08-24 쌍아 절차 기록). specs-data·렌더러·i18n·components 변경 → 엣지 재배포 의무.
- **monk.kr 배포 정본 (ch5 1조, 09-26 개정)**: ① [기본] 버튼 `.github/workflows/deploy-monk-kr.yml`(workflow_dispatch, 작가님 승인) ② [예비] `wrangler pages deploy` 표준 명령(`/deploy-cf`). wrangler 버전 정본 = 루트 `package.json`.
- 프로젝트: `monkos` (정본: deploy.sh:51)
- 리전: `us-central1` (정본: deploy.sh:52). 하드코딩 금지.
- prod rev 실측: `gcloud run services describe monkos-portal --region us-central1 --format='value(status.latestReadyRevisionName)'`
- **서비스 매핑 재실측 3콜** (위 표 갱신 시):
  ```bash
  gcloud run services list --region us-central1 --format='value(metadata.name)'
  gcloud beta run domain-mappings list --region us-central1 --format='value(metadata.name,spec.routeName)'
  for f in $(find . -name deploy.sh -not -path "*/node_modules/*"); do echo "$f → $(grep -oE 'SERVICE(_NAME)?="[^"]+"' $f | tr '\n' ' ')"; done
  ```

## Google Ads API 버전

- 정본: `scripts/ads_api_version` (1행, 현재 v24 — 10-29 v22 폐기로 교체). `scripts/ads.sh`·`scripts/collectors/collect_keywords.js`가 읽는다. 환경변수 `ADS_API_VERSION`으로 임시 재정의 가능.
- 구버전은 404로 실패한다. 수집기는 Google Planner 0행이면 🔴 알림 + exit 1 (2026-09-15 신설 — 09-01 월배치 무음 실패 재발 방지). `--dry-run`으로 적재 없이 스모크.

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

## GA4 측정 ID 정본 (2026-09-03 작가님 관리 UI 실측 + Admin API)

- 속성: `521406894`(monkos-3c6e4, 계정 Default Account for Firebase 381723534) **단일**. 스트림 2: MONKOS AI `13382285742`(monkos.ai·idphoto-kr/jp·studio) / monk_studio `14850498513`(monk.kr)
- 유효 태그 3: **G-JPZWSJ3323**(monkos.ai 계열 전 표면 — 정본) · **G-C2H9ZM85F7**(monk.kr) · **AW-17916950287**(Google Ads 전환, render-shell `GOOGLE_ADS_CONVERSION_ID` 경유)
- ⚠️ **G-FKG0CPTC14 = 별도 계정의 속성** — Ads 온보딩 자동 생성 계정 `382573166`(Google Ads Account, monkosailab@)의 속성 monkos.ai `527549580`(스트림 13870684316). 03-14 외부 분석 추정으로 삽입 → 06-14 KR 단독화 → 81일 idphoto-kr 이벤트가 이 속성으로 감(INCIDENT_20260903, 소실 아님 — yong-a 뷰어로 읽기 가능). 09-03 전 소스에서 제거·JPZ 단일. 동 계정 monk.kr `522290592`는 빈 속성
- 규칙: 측정 ID·속성 ID를 코드에 넣거나 바꾸기 전 **관리 UI 또는 Admin API 실측** 필수. 검증은 collect 204가 아니라 **수신 속성 실데이터**(run_report hostName·eventName). 커스텀 측정기준 `service`·`market`·`spec_type` 09-03 등록(소급 없음)
- 메모리: `project_ga4_measurement_id_canon.md`

## 시크릿

- 정본: GCP Secret Manager
- 인벤토리(메타만): `monkos-ops/ops/SECRET_INVENTORY.md`
- 에이전트 접촉 금지. `secret` 커맨드 경유. 상세: ch4 10조 + data-access.md

## 도구 맵

> **범위(2026-10-01 T3)**: 도구 맵 = 실행 파일·서버·CI·launchd·빌드 도구. 스킬(`.claude/commands/`·`.claude/skills/`)은 비대상 — 디렉터리 자체가 인덱스다. 레거시는 각 `_legacy/README.md`가 정본.
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
| **MCP 서버 6 + 래퍼** (monk-retrieval=`scripts/retrieval/mcp_server.js`·build_index.js / playwright·ga4·gsc·cloudflare·gdocs=`scripts/tools/*_mcp.sh`) | MCP | `.mcp.json` 정본 | `rules/mcp-tools.md`. 10-01 전수조사 등재 — 래퍼는 시크릿을 SM에서 주입(값 미노출). 헬스: `monk_stats` health 필드 / 타 서버는 세션 연결 여부 |
| monk_search | MCP | `scripts/retrieval/` | `rules/mcp-tools.md` — 헬스: 빈/부재 인덱스는 `❌ retrieval 인덱스 비정상`+재빌드 명령 반환(raw SQLite 에러 금지). 스모크 `node scripts/retrieval/search.js --smoke`(mk-push.sh 빌드 직후 자동, PASS/FAIL). 다어절 0건→OR 폴백, 헤더에 `[모드]` 표기 (09-27) |
| record-explorer | 서브에이전트 | `.claude/agents/record-explorer.md` | `rules/mcp-tools.md` §과거 기록 — 기록 탐색 위임, 결론 20줄·근거 경로:행·인덱스 비정상 시 🔴 명시 (09-27 신설) |
| monk_relations | MCP | `scripts/retrieval/` | `rules/mcp-tools.md` |
| monk_stats | MCP | `scripts/retrieval/` | `rules/mcp-tools.md` |
| cdp.sh + cdp_utils.py (+cdp_setup.sh) | 인프라 | `scripts/tools/` | `commands/cdp-browser.md` (10-01 경로 교정 — 06-11 skills→commands 이동 미반영) |
| secret | 인프라 | `scripts/secret.sh` (07-24 위치 오기 교정) | `rules/data-access.md`. **10-22 `pages-sync` 신설**(SM→CF Pages 파이프+인벤토리 §E 자동 기록) — 스모크: 멱등 재동기화 1·dry-run 1·음성 3(없는 SM·없는 프로젝트·무인자, exit≠0). 실패 가시화 `❌ pages-sync:`. 기기 로그인 전제는 SECRET_INVENTORY §H-2 |
| credits.sh | CLI | `scripts/` | `rules/data-access.md` |
| mk-push.sh | CLI | `scripts/` | — |
| ads.sh | CLI | `scripts/` | — |
| deploy.sh | CLI | 각 서비스 디렉토리 | `rules/deployment.md` |
| gen_brand_diagrams_v5.mjs | 빌드/생성 | `portal/tools/specs-diagrams/` | PF_SPECS |
| gen_reference_diagrams.mjs | 빌드/생성 | `portal/tools/specs-diagrams/` | PF_SPECS |
| generate_samples.mjs | 빌드/생성 | `portal/tools/attire-assets/` | PF_SPECS |
| spec-diagram.js | SSR 컴포넌트 | `portal/lib/cms/components/` | — |
| mailer.js | 서비스 모듈 | `monkos_AI/portal/lib/` | PF_INFRA (08-13 도메인 인증·실발송 스모크 합격, 고객 대면 실발송 1건 실적) |
| collectors/ (4종) | CLI | `scripts/collectors/` | PF_MARKET_EYE |
| seo_collect.sh | 인프라 | `scripts/tools/` | `commands/market-eye.md` |
| gsc_submit.sh | 인프라 | `scripts/tools/` | `rules/mcp-tools.md` |
| tg_notify.sh (팀봇 텔레그램 1줄+URL 버튼) | 인프라 | `scripts/tools/` | `commands/deploy-cf.md` −1단계 3항 + PF_KKU. **10-22 신설**(ORDER_20261022 텔레그램발송도구). 토큰=SM `TELEGRAM_TEAM_BOT_TOKEN`(secret.sh 경유, curl `-K -` stdin — 인자·출력 미노출), chat_id=portal `deploy.sh` `TEAM_CHAT_ID` 정본 읽기(사본 없음), url 버튼만(callback 금지). 스모크: `--dry-run` 토큰 문자열 0건 · 실발송 message_id=451 · 음성 대조군(`TG_CHAT_ID_OVERRIDE`) HTTP 400 exit 1. 실패 가시화: `❌ tg_notify:` + exit 1 |
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
| specs_drift.sh (G1) | 인프라 | `scripts/tools/` + `.git/hooks/pre-push`(경고 전용) | PF_INFRA + 본 문서 §배포 (09-01 스모크 5/5) |
| 콘텐츠 어서션 스모크 (G2) | 빌드/생성 | `edge/deploy.sh` 내장 (`edge/smoke_assert.txt` 존재 시) | live-verify.md 2회 히트 규칙의 코드화 |
| specs-ssg (build.mjs/sh) | 빌드/생성 | `monkos_AI/portal/tools/specs-ssg/` | PF_SPECS + COMPLETION_20260824 CF엣지정적화 (렌더러 정본 캡처 — 포크 금지) |
| edge/deploy.sh + worker.mjs | CLI | `monkos_AI/portal/edge/` | PF_PORTAL + 본 문서 §배포 (08-24 스모크: 컷오버 검증 10항목) |
| deploy-monk-kr.yml (monk.kr 버튼 배포) | CLI/CI | `.github/workflows/` | `rules/deployment.md` + `/deploy-cf` + PF_KKU. **v2.1 구현 완료(09-26)** — 사유 서식 검증(배포 전 차단)·`sha` 입력+fetch-depth 0 롤백·콘텐츠 어서션 `MONK_kr/smoke_assert.txt`·STEP_SUMMARY 배포 반영 표기. 스모크: 어서션 7/7 + 음성 대조군 4종 차단 + 사유 서식 양성3/음성7 (로컬), 라이브 run 35954533890(v2.0). 실패 가시화: 서식 불일치·어서션 미통과·유효 0건·도달 불가 전부 exit≠0, 어서션 파일 부재는 스킵 명시 출력 |
| notify-monk-kr-pending.yml (배포 대기 알림) | CLI/CI | `.github/workflows/` | `rules/deployment.md` + PF_KKU. ch5 1조 10항 — `MONK_kr/**`·`functions/**` main 푸시 시 텔레그램. **배포 스텝 없음**(1조 1항, governance-check C13이 내용 기준 감시). 스모크: 양성(1건 집계·메시지 생성)/음성(무변경 → 잡 스킵) |
| edge-trust.js | 서비스 모듈 | `monkos_AI/portal/lib/shared/` | SECRET_INVENTORY #44 + REVIEW_20260824 P2-2 |
| fetch/verify_solar_terms.mjs | 빌드/생성 | `monkos_AI/portal/tools/solar-terms/` | 동 폴더 README + PF_FACEREAD |
| verify_saju.mjs | 빌드/생성 | `monkos_AI/portal/tools/saju/` | 동 폴더 README + PF_FACEREAD |
| **집행 훅 9종** (guard_bash·guard_write·guard_message·time_header·prompt_submit·session_start·notify_blocked·_common·smoke) | 인프라 | `scripts/hooks/` + `.claude/settings.json` hooks 블록 | DESIGN_20260930_집행코드화_hooks_deny.md. **09-30 구현(민아, 작가님 직접 지시·쌍아 추인 대기)**: PreToolUse Bash=헌법 4조 파괴·ch5 2조 배포·ch4 10조 Firestore·시크릿 직접·ch6 커밋 형식·E10 승인 게이트 / Edit·Write=세션로그 append-only·.env/secrets/deploy.sh ask / UserPromptSubmit=KST 시각 주입+채팅 '배포 승인'→세션 토큰 / SessionStart=디바이스·git·세션로그 실측. 스모크 `python3 scripts/hooks/smoke.py` 59/59 + 실세션(bypass, haiku) 차단 1·통과 1 실측. **10-02 SessionStart 세션 이름 자동 지정**(쌍아 직접 실행, ORDER_20261002 세션이름자동화): JSON 출력 `sessionTitle`=`{디바이스}-{역할}-{MMDD}-{HHMM}`, 역할=`CLAUDE_CODE_ENTRYPOINT`, 기존 이름 유지·compact/SDK 미지정, JSON 실패 시 평문+`[HOOK-ERR]` 강등 — 스모크 69/69(resume=기록 첫 timestamp로 시작 시각 명명). 실패 가시화 `[HOOK-ERR]`. 킬스위치 `MONK_HOOKS_OFF=1`(작가님 셸만) **10-02 P1 결함 수정**(쌍아-막내4, PETITION_20261002 §6 P1): E10 발급을 사람 턴·단독 승인 문구로 한정(세션 간 메시지·작업 통지 미발급, 붙여넣기 제외, 부정·질문어·24자 초과 미발급 + 미발급 사유 고지) · DEPLOY_GATE 우회 차단(`-R` 선행·표시 이름·워크플로 ID·`gh api …/dispatches`) · 따옴표 인지 세그먼트(따옴표 안 연산자=데이터, 실행 래퍼 ssh·find -exec 등은 재귀) — 스모크 69→106/106, 구 훅 대조 26 FAIL. **10-22 Notification `notify_blocked.py` 신설**(쌍아-막내5, ORDER_20261022 백그라운드승인대기_텔레그램알림): bg 세션 `notification_type=="permission_prompt"`만 → `tg_notify.sh` 1줄(`⏸ {세션명} 승인 대기 — {도구명[ 경로]}` + `claude attach {id}`). bg 판별=`claude agents --json` kind, 판별 실패·미등록=무발송+`[HOOK-ERR]`, 10분 중복 억제(`~/.claude/monk_notify_blocked/`), 알림만(승인 경로 불변). 스모크 110→118/118 + 실발송 message_id=455·456. **10-24 E11 시각 헤더 쓰기 직전 대조 신설**(쌍아-막내16, ORDER_20261024 시각헤더_쓰기직전대조훅): `time_header.py` 공용 판정 — 새로 들어가는 `**[YYYY-MM-DD HH:MM KST]**`(+줄 머리 무굵게)를 실측 KST(UTC+9 고정)와 대조, +2분 초과 미래·10분 초과 과거 deny + 사유에 실측값. 대상 = Write·Edit·MultiEdit(`guard_write`) / Bash `>>`·`>`·`tee`(`$L` 대입 해석, `$(date)` 치환 통과 — `guard_bash`) / SendMessage(`guard_message.py`, settings matcher 신설) × `monkos-ops/ops/{sessions,orders,reports,proposals,incidents,briefings}/*.md`. 제외: 코드 블록·인라인 코드·`출처:`/`근거:` 줄·어제 이전 날짜·기존 줄. 스모크 123→146/146 + 실세션 Write·Bash 차단 실측. 훅 오류는 비차단 `[HOOK-ERR] 시각 대조 실패`. **11-03 SessionStart 기기 판별 정본화**(쌍아-막내8, ORDER_20261103): `MONK_DEVICE` > `~/.claude/monk-device` > hostname(M1 `Macminiui-Macmini`·4060 `MONK-4060`·MINGW 추가) > `CLAUDE_CODE_REMOTE=true`(웹) > `미확인`+`[HOOK-ERR]`(역할 유지 — 구 폴백 "웹(원격)→민아" 폐지), Windows 한글 JSON 실패 교정(`PYTHONIOENCODING=utf-8`) — 스모크 158→175/175 + 4060 Git Bash 실행 JSON 실측. |
| approve.sh (E10 예비 경로) | 인프라 | `scripts/approve.sh` | 작가님 전용 — 원격·무인에서 의도적으로 열 때. 에이전트 실행은 deny+훅 이중 차단 |
| **mk-soso.sh** (소소 = 디자인 TF 리드 CLI 세션 기동) + 정의 4장(`soso`·`dsn-scout`·`dsn-maker`·`dsn-critic`) | CLI | `scripts/mk-soso.sh` + `.claude/agents/` | PROPOSAL_20261002 디자인TF_소소세션_시범편성(헌장) + `commands/session-start.md`. **10-02 시범 구성(민아, 작가님 직접 지시·쌍아 추인 대기)**: 주 세션 정의 `--agent soso` + 세션 이름 `{디바이스}-소소-MMDD-HHMM` + 에이전트 팀 플래그를 이 프로세스에만(전역 설정 불변) + `MONK_ROLE=소소`(훅 역할 표시, CLI 표면·허용값 한정). 스모크: 훅 73/73(양성 1·음성 3 추가), `--dry-run`, 헤드리스 정의 로딩(이름 소소·팀원 유형 3 인식). **미실증: 대화형 팀 생성·팀원의 훅/승인 토큰 인식·비용.** 실패 가시화: 전제 미충족 `❌ mk-soso:` + exit 1 |
| ~~mailbox_watcher.sh (꾸 우체통)~~ | **폐기 (2026-10-02)** | `monkos-ops/scripts/_legacy/` (launchd `com.monk.mailbox-watcher` 해제) | 10-01 "가동 실측 PID 1437"은 프로세스 생존만 본 오등재 — 대상 호스트(구 주소) tailnet 소멸·수신 폴더 부재로 07-13 이후 전달 0. 대체: `ssh m2`(키 인증) + 세션 메시지. 작가님 10-02 폐기 지시 |
| ~~ads_upload.sh (광고 슬롯 드롭 업로더)~~ | **폐기 (2026-10-02)** | `monkos-ops/scripts/_legacy/` (launchd `com.monkos.ads-sync` 해제, `~/MONKOS_ADS/` 제거) | 작가님 10-02 지시 — 아이디어는 존치·구성은 폐기. 실업로드 7건·마지막 03-02. **GCS `monk-ai-images/ads/` 이미지·`manifest.json`은 라이브 소비 중이라 존치(삭제 금지)**. 재설계: `ops/proposals/PROPOSAL_20261002_iMac민아_광고슬롯_재설계.md` |
| runpod_balance_check.sh + com.monkos.runpod-balance.plist | 인프라 | `monkos-ops/scripts/` | PF_INFRA. 10-01 등재 — 09-30 수동 실행 $23.46 실측. plist 경로 오기 교정(10-01). **iMac 설치 10-22 21:31**(작가님 승인, `launchctl bootstrap` + kickstart 1회 exit 0·잔액 $17.10) · **주기 월·목 09:00(주 2회, 10-22 작가님 조정)** — 소진 ~$0.29/일 기준 임계 $2.0은 약 7일분, 점검 간격 최대 4일. 사용량 원장 `ops/audit/RUNPOD_USAGE.jsonl` |
| daily-briefing.yml · e2e-briefing-notify.yml · notify.yml | CI | `.github/workflows/` | PF_AUTOPILOT. 10-01 등재 — 09-30 success 실측 / notify.yml은 workflow_call 피호출(notify-monk-kr-pending) |
| mk-pull.sh · sync-dev-test.sh · kimi.sh · tools/blog-publish/ · soul_sync.sh(미추적) | CLI/빌드 | `scripts/`·`scripts/tools/`·`portal/tools/` | **등재(스모크 미실증)** — 10-01 전수조사 T4. 막내 1회 실행 후 실증 표기로 전환 |
| **pages-dev/dev.sh** (monk.kr Pages Functions 로컬 서버) | 인프라 | `scripts/tools/pages-dev/` (+ `wrangler.toml` AI 제외 사본, `.dev.vars` gitignore) + `.claude/launch.json` "monk-kr (studio dev, AI 제외)" | 10-22 신설(민아). 루트 `wrangler pages dev`는 [ai] 바인딩이 원격 프리뷰 세션을 요구해 기동 실패(실측), Pages는 `--config` 미지원 → 레포 밖 임시 폴더 복사 기동. 스모크: 주문·결제 함수 음성 11·양성 2·429 1 (10-22). 실패 가시화: `.dev.vars` 부재 경고 + 함수 500 |
| **vision-matte** (애플 비전 매팅 서버 — matte-server 계약 동일) + run_local.sh·tunnel.sh·qa_compare.py | 서비스/인프라 | `monkos_AI/vision-matte/` + CF 터널 `matte-imac`(CNAME matte-imac.monkos.ai) + launchd 2잡 `ai.monkos.vision-matte`·`ai.monkos.matte-imac-tunnel`(사본 `monkos-ops/scripts/`, 설치 `run_local.sh install`, 실행 사본 `~/.monkos/vision-matte/`) | DESIGN_20261022_INFRA_M1_애플비전_매팅서버_테스트 + PF_INFRA. **10-22 신설**(쌍아-막내8·10). **운영 1순위(10-22 22:42 작가님 결정 — 옛 4060 자리, 체인 matte-imac → RunPod, 무료·유료 공통)** · launchd 상주(로그인 기동·KeepAlive, kill -9 후 ~30s 자동 복귀 실증). 흰 테두리 보정 기본값 알파 수축 2px + 전경 오염 제거 4px(`MATTE_EDGE_ERODE_PX`·`MATTE_DECONTAM_PX`). 계약 8/8(로컬)·터널 경유 7/8(동시성 503 검사는 업로드 지연으로 미겹침), dev E(via matte-imac)·F(정지→RunPod 폴백) 통과. iMac18,3·macOS 13 Intel. Vision 마스크 2016×1512 고정. 실패 가시화: 포화 503·시크릿 불일치 403·헬스 실패 시 포털 프리플라이트가 RunPod로 손절 + 터널 잡 워처(외부 /health 60s 2회 히트, 연속 2회 실패·복구 전이 때 tg_notify, 최소 10분 간격 — 10-22 23:08 실발송 실증) |
| **pf.sh / pf.py** (PF 원장 CLI) | CLI | `scripts/` | `rules/pf-ops.md` + DESIGN_20260930_PF원장화. append(열·날짜형식·링크·중복 자동)/query/check/show. 훅 연동: `hooks/pf_autolink.py`(PostToolUse Write — portfolio: 문서 자동 링크), `hooks/stop_check.py`(Stop — PF 미갱신·세션로그 신선도 경고), CI C15. 스모크 `python3 scripts/hooks/smoke_pf.py` 17/17. 실패 가시화: rc 2 + `❌ pf:` / 훅 `[HOOK-ERR]` |
| **brief_ledger.sh / .py** (브리핑 해소 원장 CLI) | CLI | `scripts/` + 원장 `monkos-ops/ops/briefings/LEDGER.jsonl`(append-only JSONL) | DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장 §3 + `commands/makne-finish.md`·`session-end.md`(resolve 1행) + `ops/templates/ROUTINE_웹민아_데일리E2E.md` 0단계 + PF_AUTOPILOT. **10-22 신설**(쌍아-막내6, ORDER_20261022 해소원장 1단계). open/resolve/reopen/note/list/show — axis·severity enum·due·by `{디바이스}/{에이전트}`·evidence(SHA 7자+/2회 히트/대조군/HH:MM)·중복 open·열린 id만 resolve 검사. 스모크(임시 원장 `--ledger`/`BRIEF_LEDGER`): 양성 1·음성 10 거부(rc 2)·근거 3종 양성·끝 줄바꿈 보정. 실원장 시범 (160) open→resolve 2행. 실패 가시화 `❌ brief_ledger:` + rc 2 |
| **mk-mina-brief.sh** (iMac 민아 헤드리스 데일리 브리핑 — 로컬·인프라·세션 축) | CLI | `scripts/mk-mina-brief.sh` + 지시문 `monkos-ops/ops/templates/ROUTINE_iMac민아_로컬축.md` + 전용 worktree `.claude/worktrees/mina-brief`(origin/main 분리 HEAD) + launchd 사본 `monkos-ops/scripts/ai.monkos.mina-brief.plist`(06:30) | DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장 §4 + PF_AUTOPILOT + iMac DEVICE_PROFILE. **10-22 신설**(쌍아-막내7, ORDER_20261022 iMac민아_헤드리스브리핑_2단계). 0번 축(wrangler·gh·gcloud) 사전 점검 실패 시 헤드리스 미기동 · `MONK_ROLE=민아 claude -p` 턴 상한 80·시간 상한 900s · 브리핑 커밋 확인 · 시크릿 값 형태 가드 · push(rebase 1회 재시도)+원격 대조. 무인 규칙: 쓰기=브리핑·원장·세션 로그(`…_iMac_민아-헤드리스.md`)만. 스모크: `--dry-run` 정상 · 음성(`MINA_BRIEF_GCLOUD_CONFIG` 무효 구성) → 0번 축 실패·텔레그램 message_id=457·rc 1 · 수동 1회 `BRIEFING_LOCAL_20261022.md` 커밋 4b57bc76 origin/main 포함(40턴·375s·$2.06). **launchd 설치 10-22 21:31**(작가님 승인, 첫 실기동 10-23 06:30 — 결과 미실측). 실패 가시화: `❌ mk-mina-brief:` + tg_notify ❌ + `~/.monkos/mina-brief/last_fail.txt`(경보 자체 실패 대비) |

## 모델 배치

- 정본: 작가님 지시 (유동적)
- 현행 실측: `claude --version` + settings.json 확인
- 메모리 `project_model_placement.md`는 스냅샷 — 실측이 우선
