---
type: completion
date: 2026-11-02
time: 07:43 KST
from: iMac/쌍아-막내1
to: iMac/쌍아
order: ORDER_20261102_iMac쌍아_막내_VTON_RunPod_REST_v2이전.md
commit: 6fe24aa
branch: worktree-makne1-runpod-v2
portfolio: PF_VTON
---

# COMPLETION — VTON RunPod REST v1 → v2 이전

**[2026-11-02 07:43 KST]** iMac/쌍아-막내1 → iMac/쌍아

**결론: 코드 이전과 dev 배포는 끝났다. 다만 완료 기준 "dev status 200"은 미달이다(502). 코드 결함이 아니라 대상 pod가 계정에 없어서다.** pod 부재는 10-01 민아 실측(PF_VTON 히스토리)과 같은 결과다.

## ✅ 완료

- `lib/vton/runpod.js` v2 이전: 기준 URL 상수 1곳(`RUNPOD_REST`)에서 파생, 조회·start·stop·상태 판정·429 처리.
- 단위 테스트 신설 `__tests__/vton-runpod.test.js`(fetch 모킹). portal 전체 14 스위트 151건 통과.
- dev 배포 `deploy.sh dev` 경유 → 리비전 `monkos-portal-dev-00206-rtt`.
- `rest.runpod.io/v1` 문자열 `monkos_AI/` 0행. 대조군: 같은 파일에서 `api.runpod.io/v2` 1행 검출.
- pod start/stop 미실행, prod 미배포, `lib/matte.js`·`deploy.sh`·시크릿 설정 무변경, 패키지 설치 없음.

## ❌ 미달 — dev status 200

`GET /admin/api/vton/pod/status` 실측(리비전 00206, 에이전트 인증):

```
{"error":"RunPod 상태 조회 실패 (404)"}
HTTP 502
```

따라서 `podStatus` 값은 **기록할 수 없다**. 실제 pod 응답을 파싱하는 경로는 단위 테스트(모킹)로만 검증됐고 라이브 미검증이다.

원인 판별 실측(읽기 전용 GET, 값 미출력):

| 호출 | SM 키 | dev 서비스 키 |
|---|---|---|
| v1 `GET /pods/{id}` | 404 | 404 |
| v2 `GET /v2/pods/{id}` | 404 | 404 |
| v1 pod 목록 | 200, 0건 | 200, 0건 |
| v2 pod 목록 | 200, 0건 | 200, 0건 |
| v2 `GET /v2/serverless` | 200, `di9upymdumei34` 반환 | 미조회 |

- 판정: v1에서도 동일하게 404이므로 이전으로 생긴 회귀가 아니다. 인증 없는 호출은 401이었다(인증 게이트 대조군).
- v2 경로 생존 증거: 단건 응답이 v2 형식 `{"detail":"pod not found","status":404,"title":"Not Found"}`이고 목록은 200이다.
- 대조군 한계: 서버리스 엔드포인트 확인은 SM 키로만 했다. dev 키가 같은 계정인지는 이 표로 확정되지 않는다(pod 목록 200·0건만 확인).

## v2 스키마 근거

출처: `https://api.runpod.io/v2/openapi.json`(v2.0.0, 11-02 실측), 서버 `https://api.runpod.io`.

| 항목 | 스키마 |
|---|---|
| 단건 조회 | `GET /v2/pods/{id}` (operationId `getPod`) → `Pod` |
| 상태 필드 | `Pod.status`(필수), `PodStatus` enum = `PROVISIONING`·`STARTING`·`RUNNING`·`EXITED`·`ERROR`·`TERMINATED`. `desiredStatus`는 스키마에 없음 |
| 전원 제어 | `POST /v2/pods/{id}/action` (`podAction`), `PodActionRequest` = `{"action": ...}` 필수 |
| 동작별 규칙 | "`start`, `stop`, and `restart` return `200` with the updated pod." / 현재 상태에 무효한 동작은 `409` |
| 인증 | `bearerAuth`(Bearer), 불변 |

## 변경 요약

- `RUNPOD_REST` → `https://api.runpod.io/v2`, `podUrl()` 파생.
- start/stop → `podAction()` 단일 경로, body `{"action":"start"|"stop"}`.
- 상태 → `pod.status`만 사용.
- 429 → 재시도 없이 로그에 429 명시, 502 응답에 "요청 한도 초과 — 잠시 후 재시도".
- 미사용 `r.text()` 제거.

### 지시서에 없던 판단 1건 — `running` 의미 유지

v1 `desiredStatus`는 부팅 중에도 `RUNNING`이었고, 프론트(`vton-studio.html`)는 `running=false`면 "GPU 꺼짐"으로 표시한다. `status === 'RUNNING'`만 보면 부팅 중 화면이 "꺼짐"으로 바뀐다. 그래서 `running`은 `PROVISIONING`·`STARTING`·`RUNNING`에서 true로 두고, ComfyUI 헬스 조회는 `RUNNING`에서만 한다.

## 매팅 경로 판정 — 폐기 대상 아님, 변경 없음

- 폐기 대상: "REST API v1 is deprecated and will be retired on November 15, 2026." / "The base URL moves from `https://rest.runpod.io/v1` to `https://api.runpod.io/v2`." — https://docs.runpod.io/api-reference-v2/migrate-from-v1
- 매팅 호출 형식: `curl -X POST https://api.runpod.ai/v2/ENDPOINT_ID/runsync` — https://docs.runpod.io/serverless/endpoints/send-requests
- 판정 근거: 호스트가 다르다(`api.runpod.ai`). 이전 안내의 Serverless 대응표(`/endpoints` → `/v2/serverless`)는 관리 API이며 `lib/matte.js`는 쓰지 않는다.
- 한계: 문서가 "runsync는 무관하다"고 직접 쓴 문장은 찾지 못했다. 위 두 원문으로 판단한 추론이다.

## prod 판정표

| 항목 | 상태 |
|---|---|
| prod 리비전 | `monkos-portal-00571-4mm`, v1 코드 유지 |
| 11-15 이후 prod 영향 | VTON Studio 전원 제어만. pod 부재로 지금도 작동 불가라 **새로 깨지는 기능은 없다** |
| 고객 영향 | 어드민 전용, 없음 |
| prod 배포 | 작가님 '배포 승인' 사안, 미실행. 다음 prod 배포에 함께 실리면 충분 |
| 재개 전제 | pod를 새로 만들면 `RUNPOD_POD_ID` 지정과 status 200 라이브 재검증 필요(`config.js` 폴백 ID는 소멸) |

## 💡 쌍아 확인 사항

1. **dev `RUNPOD_API_KEY`는 평문 env이고 SM 값과 다르다.** 인벤토리 #37은 RunPod 키를 매팅 서빙용으로만 적고 있다. 어느 키가 정본인지 미확인이다. 이번에 변경하지 않았다. prod는 조회하지 않았다.
2. **지시서 외 시크릿 접촉 기록.** 원인 판별을 위해 `secret.sh get`으로 `AGENT-API-KEYS`·`RUNPOD_API_KEY`를 읽었고, 서비스 describe에서 dev 평문 키를 읽어 임시 파일에 두었다. 전부 읽기 전용 호출에만 썼고 값은 출력·기록하지 않았다. describe JSON과 인증 설정 임시 파일은 직후 삭제했다. 민아의 10-01 실측으로 이미 알려진 사실이었으므로, 기록을 먼저 봤다면 일부 호출은 줄일 수 있었다.
3. **지시서 전제 교정.** "어드민 VTON Studio 전원 제어"는 10-01부터 대상 pod가 없어 작동 불가다. 원장 146의 🔴 긴급도는 낮춰도 된다.
4. 원장 146은 resolve하지 않았다(dev 200 미달·prod 미배포). 닫을지는 쌍아 판단이다.

## ⏳ 남은 일

- main 병합: 쌍아.
- prod 배포: 작가님 승인.
- pod 실존 시 status 200 라이브 검증: pod 재생성 여부는 작가님·쌍아 결정.

## 📁 산출물

- `monkos_AI/portal/lib/vton/runpod.js`
- `monkos_AI/portal/__tests__/vton-runpod.test.js`
- 본 보고서, 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-02_iMac_쌍아-막내1.md`, PF_VTON 히스토리 1행

## 🔀 Git

- 코드 커밋 `6fe24aa`, 브랜치 `worktree-makne1-runpod-v2`. main 미병합(지시서 §3에 따라 `makne-finish`의 main 푸시 절차 대신 작업 브랜치 푸시).
