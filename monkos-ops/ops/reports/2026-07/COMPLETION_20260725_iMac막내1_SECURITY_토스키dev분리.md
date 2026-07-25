---
type: completion
date: 2026-07-25
device: iMac
agent: 막내1
status: 마감
portfolio: PF_SECURITY
---

# COMPLETION — 토스 클라이언트 키 dev/prod 분리 (서빙 시 주입)

**[2026-07-25 14:25 KST]** iMac/막내1 → 작가님

> 지시서: [ORDER_20260725_iMac쌍아_막내_SECURITY_토스클라이언트키_dev분리.md](../../orders/2026-07/ORDER_20260725_iMac쌍아_막내_SECURITY_토스클라이언트키_dev분리.md)
> 범위: dev 배포·검증까지. **prod 미배포 유지.**

---

## 1. 요약

정적 파일 3곳에 하드코딩되어 있던 토스 **라이브** 클라이언트 키를 제거하고, 서버가 서빙 시점에 환경별 키를 주입하도록 전환했다. dev 3서비스 전부에서 **테스트 키로 위젯이 실제 렌더**되는 것을 확인했다("테스트 환경이에요. 실제로 결제되지 않아요" 배너 캡처). prod는 배포하지 않았고 라이브 키 유지 상태다.

**지시서 §2 방식은 그대로 쓸 수 없었다.** portal의 inline JS는 Docker 빌드 1단계에서 난독화(`obfuscate.mjs`, stringArray+base64)되어 `__TOSS_CLIENT_KEY__` 토큰이 문자열 배열로 인코딩된 채 사라진다 → 런타임 문자열 치환 불가. `<head>` 전역 변수 주입 방식으로 변경했다(§4 참조).

## 2. 완료 조건 대조

| 완료 조건 | 결과 |
|---|---|
| 정적 파일 3곳 `live_gck_` 완전 제거 (grep 0건) | ✅ 0건 (레거시 `_legacy_spa`는 원래 빈 문자열) |
| dev 3서비스 소스에서 `test_gck_` 확인 | ✅ 3/3 |
| dev 3서비스 결제 위젯 정상 렌더 (스크린샷) | ✅ 3/3 — [shots_20260725_toss_dev/](shots_20260725_toss_dev/) |
| deploy.sh 3종 SM 참조 전환 (평문 하드코딩 0건) | ✅ 3/3 |
| 실패 가시화 구현 + 오탐 없음 | ✅ 구현·실작동 실증(§5) |
| prod 미배포 상태 유지 | ✅ prod 3서비스 `live_gck_` 유지 |

## 3. 변경 파일

| 파일 | 변경 |
|---|---|
| `monkos_AI/portal/public/credits.html` | 227행 라이브키 → `window.__MONKOS_TOSS_CK__ \|\| ''` |
| `monkos_AI/portal/server.js` | 정적 서빙부: `/credits(.html)` 한정 `<head>` 키 주입 + `no-cache` / 기동 로그 실패 가시화 |
| `monkos_AI/portal/deploy.sh` | 91행 평문 test키 삭제 → `TOSS_CLIENT_KEY_NAME` SM 참조 분기, 과거 평문 env 선제 제거 가드 |
| `monkos_AI/studio/public/config.js` | 29행 라이브키 → `__TOSS_CLIENT_KEY__` |
| `monkos_AI/studio/server.js` | `/config.js` 전용 라우트(static보다 위) + 기동 로그 실패 가시화 |
| `monkos_AI/studio/deploy.sh` | `--set-secrets` 신설 (`TOSS_CLIENT_KEY`) |
| `monkos_AI/idphoto-kr/public/config.js` | 29행 라이브키 → `__TOSS_CLIENT_KEY__` |
| `monkos_AI/idphoto-kr/server.js` | `/config.js` 전용 라우트(static보다 위) + 기동 로그 실패 가시화 |
| `monkos_AI/idphoto-kr/deploy.sh` | `--set-secrets`에 `TOSS_CLIENT_KEY` 추가 |

**결제 위젯 초기화 로직은 미접촉** (준수 조항 준수). 변경은 값 전달 경로 한정.

## 4. 지시서와 달라진 점 (2건)

### 4-1. portal 치환 방식 변경 — 난독화 충돌

- **지시서 §2**: `__TOSS_CLIENT_KEY__` 문자열을 서빙 시 치환.
- **실측**: `portal/Dockerfile` Stage 1이 `public/*.html`의 inline `<script>`를 난독화한다(`stringArray: true`, `stringArrayEncoding: ['base64']`). 토큰 문자열은 base64 문자열 배열로 흡수되어 **런타임에 문자열로 존재하지 않는다.**
- **1차 배포에서 실제로 발생**: rev 00161에서 `🚨 credits.html에 TOSS 키 플레이스홀더가 없습니다` ERROR가 찍혔다. 즉 **§5 실패 가시화가 자기 배선의 고장을 먼저 잡았다** — 무음 강등 없이 즉시 드러남.
- **조치**: `<head>` 직후에 `<script>window.__MONKOS_TOSS_CK__="…"</script>`를 주입하고, `credits.html`은 이 전역을 읽는다. 난독화는 프로퍼티 접근의 의미를 보존하므로 정상 동작한다(rev 00163 실증).
- studio·idphoto-kr은 난독화 미적용(idphoto Dockerfile의 난독화 라인은 주석 처리 상태) → 지시서대로 토큰 치환 유지.

### 4-2. portal-dev 평문 env 선제 제거 가드 추가

- **실측**: `monkos-portal-dev`에 `TOSS_CLIENT_KEY`가 **평문 env**로 존재(과거 `TOSS_CLIENT_KEY_OVERRIDE` 주입의 잔재).
- 같은 키가 평문 env와 시크릿 참조로 공존하면 Cloud Run이 배포를 거부한다 → `deploy.sh` 안에 조건부 제거 가드를 넣었다(ch5 준수: deploy.sh 경유, 직접 gcloud 배포 아님). 조건 미충족 시 아무 것도 하지 않는 멱등 가드.

## 5. 검증 실측

**리비전**: portal `monkos-portal-dev-00163-s64` / studio `monkos-studio-dev-00011-4qv` / idphoto-kr `monkos-idphoto-kr-dev-00019-qsc`

| # | 확인 | 결과 |
|---|---|---|
| 1 | dev 키 접두사 | ✅ 3/3 `test_gck_` |
| 2 | 위젯 실렌더 | ✅ 3/3 `renderPaymentMethods()` 성공 + **"테스트 환경이에요. 실제로 결제되지 않아요."** 배너 캡처 |
| 3 | 플레이스홀더 잔존 | ✅ 3/3 `__TOSS_CLIENT_KEY__` 0건, `live_gck_` 0건 |
| 4 | prod 무영향 | ✅ monkos.ai/credits · idphoto-kr.monkos.ai/config.js · monkos-studio/config.js 전부 `live_gck_` 유지 |
| 5 | 기동 로그 오탐 | ✅ 신 리비전 3종 모두 `Toss Client Key: 설정됨 (TEST)` — 신설 ERROR 미발생 |

**응답 헤더**: portal `/credits` `cache-control: no-cache` / studio·idphoto `/config.js` `application/javascript; charset=utf-8` + `no-cache, no-store, must-revalidate` ✅

**검증 방법**: CDP(포트 9223)로 dev 결제 페이지 로드 → 서빙된 키로 위젯을 실제 렌더. 로그인 게이트로 결제 뷰가 가려져 있어 **표시 속성만** 강제하고 캡처했다(코드 변경 아님). **결제 버튼은 누르지 않았다** — 지시서 경고 준수.

## 6. 지시서 밖 발견 (조치 안 함 · 판단 요청)

**dev Cloud Run 서비스에 시크릿이 평문 env로 다수 존재.** 검증 중 `describe`에서 확인됐다 (값 미기재):

- `monkos-portal-dev`: 전체 env 45개 중 시크릿 참조는 17개. 나머지에 카카오 클라이언트 시크릿, 텔레그램 봇 토큰 3종, LINE 채널 시크릿·액세스 토큰, TX API 키, RunPod API 키 등이 **평문 값**으로 박혀 있음
- `monkos-studio-dev`·`monkos-idphoto-kr-dev`: `GEMINI_API_KEY` 평문 env

PF_SECURITY 소관이나 본 지시서 범위 밖이라 손대지 않았다. SM 참조 전환 여부는 쌍아·작가님 판단 요청. (prod 서비스는 미조사)

## 7. 남은 것

- ~~prod 승격~~ → **2026-07-25 15:20 KST 작가님 승인, §9에서 완료.**
- A안(`/api/config` 서버 주입 전환)은 중기 과제로 별건 유지.

---

# §9. prod 승격 결과 (지시서 §9 — 2026-07-25 15:20 KST 작가님 승인)

**[2026-07-25 15:28 KST]** iMac/막내1 → 작가님

## 9.1 배포

`./deploy.sh prod --yes` 3서비스 (비TTY 환경이라 deploy.sh가 요구하는 `--yes` 경유. ch5 준수)

| 서비스 | 승격 전 rev | **승격 후 rev** |
|---|---|---|
| monkos-portal | 00536-czl | **00537-q69** |
| monkos-studio | 00022-wkl | **00023-6tf** |
| monkos-idphoto-kr | 00202-szs | **00203-jwn** |

- `deploy.sh:109~111` prod 비-live 키 차단 가드: **발동 0** (정상 통과)
- 평문 env 선제 제거 가드: **발동 0** (prod 3서비스에 평문 `TOSS_CLIENT_KEY` 부재 — dev 전용 잔재였음)

## 9.2 승격 직후 확인 — 5/5 통과

| # | 확인 | 결과 |
|---|---|---|
| 1 | prod 3서비스 키 접두사 | ✅ 3/3 `live_gck_` |
| 2 | 위젯 실렌더 | ✅ 3/3 `rendered` · **테스트 배너 없음**(`false` 3/3) — [prod_*_widget.png](shots_20260725_toss_dev/) |
| 3 | 플레이스홀더·전역변수 원문 잔존 | ✅ 3/3 `__TOSS_CLIENT_KEY__` 0건 |
| 4 | 기동 로그 §5 ERROR | ✅ 3/3 `Toss Client Key: 설정됨 (LIVE)` — 신설 ERROR 0건 |
| 5 | dev 무영향 | ✅ dev 3서비스 여전히 `test_gck_` |

**핵심 — 난독화 재설계분의 prod 실동작 확정**: portal prod `/credits` 응답에서 `window.__MONKOS_TOSS_CK__="live_gck_…"` 주입 확인, `cache-control: no-cache` 유지. **§4-1에서 dev용으로 재설계한 방식이 prod 난독화 빌드에서도 그대로 동작한다** — 이번 승격의 유일한 미검증 지점이 실측으로 해소됐다. (portal Dockerfile에 dev/prod 분기가 없어 예상은 됐으나, 난독화기가 실행마다 심볼을 새로 뽑으므로 실측 전까지 단정하지 않았다.)

prod 위젯에는 카카오페이·네이버페이·토스페이·PAYCO가 노출된다(dev 테스트 키는 토스페이·PAYCO만) — 라이브 키가 실제로 먹은 방증.

- 롤백 미발생. **결제 버튼 미클릭** — 렌더 확인까지만.

## 9.3 최종 상태

전 환경 토스 클라이언트 키 경로가 SM 정본 참조로 일원화됐다. 정적 파일에 남은 결제 키 하드코딩 0건, dev는 테스트 키·prod는 라이브 키로 자동 분기.
