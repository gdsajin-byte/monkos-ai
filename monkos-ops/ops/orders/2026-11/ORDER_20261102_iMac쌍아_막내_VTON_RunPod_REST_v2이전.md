---
type: order
date: 2026-11-02
from: iMac/쌍아
to: iMac/막내
subject: VTON pod 제어(lib/vton/runpod.js) RunPod REST v1 → v2 이전 — 11-15 v1 폐기 대응, dev 검증까지 (원장 146)
status: 대기
portfolio: PF_VTON
---

# ORDER — VTON RunPod REST v1 → v2 이전

**[2026-11-02 07:35 KST]** iMac/쌍아 → iMac/막내

출처: 작가님 2026-11-02 07:33 iMac 쌍아 세션 사람 턴 "가능한것부터 모두 진행해" (아침 보고 🔴 2번 (146) 지시서 발행). 범위 승인 = 본 문서 §2~§4(구현·dev 검증·보고까지). **prod 배포는 범위 밖** — 작가님 '배포 승인' 별도.

## 1. 배경

- RunPod REST API v1(`https://rest.runpod.io/v1`)은 **2026-11-15 폐기**. 출처: [Migrate from v1](https://docs.runpod.io/api-reference-v2/migrate-from-v1)(11-02 07:3x 쌍아 열람 — "will be retired on November 15, 2026"). 같은 문서의 다른 판본에 12-01 표기가 보인다는 검색 결과가 있으나, 이른 날짜(11-15)를 기준으로 한다.
- v1 사용처는 `monkos_AI/portal/lib/vton/runpod.js` 3곳뿐이다(민아 헤드리스 11-02 06:32 grep — 48행 pod 조회, 68행 start, 107행 stop). 어드민 VTON Studio 전원 제어.
- 매팅 폴백(`lib/matte.js`)은 서버리스 실행 엔드포인트 `api.runpod.ai/v2/{endpoint}`이며 `rest.runpod.io/v1`이 아니다. 이번 폐기와 무관한지 **공식 문서로 확인만** 한다(변경 금지).

## 2. 할 일

1. **v2 스키마 실측**: `https://api.runpod.io/v2/openapi.json`을 읽어 다음을 확정한다. 기억·추정 금지.
   - 단건 조회 경로(`GET /v2/pods/{id}` 여부)와 응답의 상태 필드 이름(v1의 `desiredStatus`/`status` 대응).
   - 전원 제어: 문서상 `POST /v2/pods/{id}/action` body `{"action":"start"}` / `{"action":"stop"}` — 스키마로 재확인.
2. **구현** (`lib/vton/runpod.js`만):
   - `RUNPOD_REST` → v2 기준 URL. 상수 1곳에서 파생.
   - `getPod`·`handlePodStart`·`handlePodStop`을 v2 경로·body로. `handlePodStatus`의 상태 판정(`RUNNING`)을 v2 필드에 맞춘다.
   - 인증 헤더는 그대로(Bearer, 문서상 불변). 키는 기존 `RUNPOD_API_KEY` 환경변수만 — 새 키 생성·추측 금지.
   - 오류 시 기존처럼 명시 502 + 로그(무음 강등 금지).
3. **(같은 PR 범위 내 선택) 429 처리**: v2 호출이 429면 로그에 `429`를 명시하고 502 응답 메시지에 "요청 한도 초과 — 잠시 후 재시도"를 넣는다. 재시도 루프는 넣지 않는다.
4. **dev 검증**:
   - portal 단위 테스트 전체 통과.
   - portal-dev 배포(`deploy.sh` 경유, dev만) 후 어드민 `/admin/api/vton/pod/status` 1회 200 + `podStatus` 값 기록.
   - **start/stop은 과금 발생** — 실행하지 않는다. 대신 v2 action 경로에 대한 요청 형식은 스키마 대조 + 단위 테스트(fetch 모킹)로 판정한다.
5. **매팅 무관 확인**: 서버리스 `api.runpod.ai/v2` 실행 경로가 이번 폐기 대상인지 공식 문서 원문 1줄 인용과 URL을 보고서에 적는다. 대상이면 변경하지 말고 🔴로 보고만.

## 3. 산출물·쓰기 범위

- 코드: `monkos_AI/portal/lib/vton/runpod.js` (+ 해당 단위 테스트 파일 신설 가능, `monkos_AI/portal/` 테스트 폴더 관례 따름)
- COMPLETION: `monkos-ops/ops/reports/2026-11/COMPLETION_20261102_iMac쌍아-막내N_VTON_RunPod_REST_v2이전.md` — v2 스키마 근거(경로·필드), 변경 diff 요약, dev 리비전, status 실측값, 매팅 무관 판정 인용, prod 판정표
- 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-02_iMac_쌍아-막내N.md`, PF_VTON 히스토리 1행(`scripts/pf.sh append`)
- **작업 브랜치**에서 커밋·푸시. main 병합은 쌍아.

## 4. ⚠️ 준수 조항

- 헌법 4조 1항 — API 키·토큰 생성·추측·출력 금지. `RUNPOD_API_KEY` 값을 로그·보고에 쓰지 않는다. dev 검증에 키가 필요하면 기존 서비스 환경을 그대로 쓴다.
- ch5 — `gcloud run deploy` 직접 실행 금지, `deploy.sh` 경유. **prod 배포 금지**(작가님 승인 사안).
- ch1 7조 승인 게이트 — pod start/stop(과금) 실행 금지. 패키지 설치 금지.
- `lib/matte.js`·`deploy.sh`·시크릿 설정 변경 금지.
- 헌법 3조 1·2항 — `date` 실측 헤더, 세션 로그 append-only, 완료 보고 `✅❌💡⏳📁🔀` + 원격 SHA 대조.

## 5. 완료 기준

- [ ] v2 스키마 근거(경로·상태 필드) 인용
- [ ] `rest.runpod.io/v1` 문자열 `monkos_AI/` 코드 0행
- [ ] portal 테스트 전체 통과 + dev status 200 실측
- [ ] 매팅 경로 무관 판정(원문 인용)
- [ ] 작업 브랜치 푸시 + 원격 SHA 대조 + COMPLETION

## 6. 커밋 메시지

```
[fix] VTON pod 제어 RunPod REST v1 → v2 이전 (원장 146, 11-15 폐기 대응)
```
