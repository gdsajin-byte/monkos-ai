---
type: completion
date: 2026-11-04
device: iMac
agent: 쌍아-막내6
status: 마감
portfolio: PF_INFRA
order: monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내6_INFRA_RunPod429백오프.md
---

# COMPLETION — 매팅 체인 RunPod 429 백오프

**[2026-11-04 19:16 KST]** iMac/쌍아-막내6 → iMac/쌍아

**결론**: `portal/lib/matte.js`가 이제 429를 일시 포화로 분류해 처리합니다. 체인 마지막 엔드포인트에서는 백오프하며 다시 시도하고, 대기 총량은 기존 큐 예산을 넘지 않습니다. 예산을 넘게 되면 기다리지 않고 명시적으로 실패합니다. 단위 테스트 11건을 추가했고 포털 전체 266/266이 통과했습니다. dev rev에 배포한 뒤 실호출 1회가 정상이었고, 원장 146은 resolve했습니다. **prod 배포는 작가님의 '배포 승인'을 기다리고 있습니다.**

출처: 지시서 상단(작가님 19:07 "둘다 처리해" 범위 승인, 쌍아 세션 사람 턴). RunPod 키와 시크릿은 건드리지 않았습니다. 테스트는 fetch 목으로만 했고, 실제 429는 일으키지 않았습니다.

## 1. 변경 (`monkos_AI/portal/lib/matte.js`)

| 항목 | 내용 |
|---|---|
| Retry-After 파서 | 초(정수)와 HTTP-date를 모두 받습니다. HTTP-date가 과거면 0입니다. 숫자열이 HTTP-date로 오인되지 않게 막았습니다(V8 `Date.parse('-1')`이 연도로 해석되는 함정). `parseRetryAfterMs` export |
| 무헤더 백오프 | `rateLimitDelayMs`: 지수 백오프에 equal jitter를 붙였습니다. 시작 2s(`MATTE_QUEUE_KNOCK_MS`), 상한은 큐 예산의 절반(기본 10s)입니다 |
| 예산 | 429 대기는 **체인 전체 누적 대기**(503 노크 포함)에 합산하며 `MATTE_QUEUE_WAIT_MS`(기본 20s)를 넘지 않습니다. 다음 대기가 예산을 넘을 차례면 자지 않고 바로 실패합니다 |
| 명시 실패 | WARNING `[Matte] {slug}: {url} 429 예산 소진 — 429 N회, 누적 대기 …ms + 다음 …ms > 20000ms (HTTP 429) → 명시 실패`. 이어 기존 ERROR `matte 전 엔드포인트 실패 (429 예산 소진 …)`와 팀 경보에도 원인이 실립니다. 호출부 실패 동선(null 반환)은 그대로라 강등 출고가 생기지 않습니다 |
| 체인 중간 429 | **대기 없이 즉시 다음 엔드포인트로 넘깁니다.** 근거: 503 대기는 "곧 빈다, 그리고 대안(RunPod 콜드)이 더 비싸다"는 전제에 기대지만, 429는 호출자 한도라 서버가 비어도 풀리지 않고 다음 엔드포인트는 그 한도와 무관합니다 |
| 비JSON 본문 | 이전에는 `res.json()`이 비JSON 본문에서 예외를 던져 상태 코드를 잃었습니다. 지금은 text를 먼저 읽고 JSON 파싱을 시도해 status·Retry-After를 보존합니다. RunPod의 non-ok 응답 메시지는 `HTTP {status}`로 표기합니다 |

503 경로의 동작(엔드포인트별 노크 상한)은 바꾸지 않았습니다. 바뀐 것은 503 대기 시간이 429 예산 쪽 누적에 합산된다는 점 하나입니다.

## 2. 검증

- 단위 테스트 `__tests__/matte-ratelimit.test.js` 11건(예산 3000ms 환경): Retry-After 초 / HTTP-date / 헤더 없음(백오프 2회 후 성공) / 예산 소진(대기 없이 null, WARNING과 ERROR 원인 표기) / 체인 중간 429(즉시 RunPod) / 회귀(503 노크와 429가 합산돼 예산 소진) + 파서·지연 함수 단위 테스트
- 포털 전체 `npm test`: **21 suites, 266/266 통과**
- dev 배포: `./deploy.sh dev` → **`monkos-portal-dev-00237-wjg`**(100% 트래픽)
- 실호출 1회(19:15): dev `/api/idphoto/precheck`, kr-passport, 저장소 샘플 `public/assets/idphoto-before.jpg`. 결과는 `crownCheck.status=measured`, `matteRows=288`, 매팅 1156ms, `engineReady=true`입니다. 리비전 로그에 BACKUP·실패 줄이 0건이므로 1순위 자체 서버 경유 정상으로 봤습니다. 429 로그 형식은 실제로 발생시키지 않았기 때문에 단위 테스트의 로그 단언으로만 확인했습니다.

## 3. 원장·푸시

- `brief_ledger resolve 146` 19:16(근거에 SHA 2242ae7c·dev rev·prod 대기를 적었습니다)
- 브랜치 `worktree-makne6-runpod429` 푸시는 SSH로 정상이었습니다. origin SHA `2242ae7c1570eda356ab1fba023f970198edc9ef`가 로컬 HEAD와 같습니다(코드 커밋 기준). 보고·로그 커밋 SHA는 세션 로그에 적습니다.

## 4. prod 배포 대상

- **서비스 `monkos-portal`**(monkos.ai 오리진), `monkos_AI/portal/deploy.sh prod`. 작가님 '배포 승인'이 필요합니다
- 엣지 재배포는 필요 없습니다(specs·렌더러 변경 없음)
- 선행 조건: 쌍아의 브랜치 검토와 main 병합

## 5. 판단을 넘기는 것

- 체인 중간 429를 즉시 넘기는 정책(위 근거 1줄). 현 구성에서 429는 사실상 마지막인 RunPod에서만 나오므로 실효 차이는 작습니다.
- 백오프 상한(예산의 절반)은 지시서의 "기존 큐 예산 안에서" 범위에서 제가 고른 값입니다.
