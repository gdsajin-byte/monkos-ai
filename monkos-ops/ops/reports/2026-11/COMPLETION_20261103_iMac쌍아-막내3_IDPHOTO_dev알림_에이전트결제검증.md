---
type: completion
date: 2026-11-03
device: iMac
agent: 쌍아-막내3
status: 마감
portfolio: PF_IDPHOTO
order: ORDER_20261103_iMac쌍아_막내3_IDPHOTO_dev알림태그_에이전트결제검증.md
---

# COMPLETION — dev 알림 태그 + 에이전트 결제 검증(dev-grant)

**[2026-11-03 04:33 KST]** iMac/쌍아-막내3 → iMac/쌍아

결론: ①·④ 모두 구현해 dev(`monkos-portal-dev-00227-sxg`)에서 API·브라우저 E2E와 음성 대조군을 통과했다. prod·엣지 미배포, 결제 제출 없음.

## 1. 쌍아 확인 항목

1. **토스 경로에는 폴링이 없다.** `startPolling` 호출부는 레몬 결제와 `?lemon=` 복귀뿐이다. 토스 인증창을 닫은 화면은 폴링을 돌리지 않으므로, 브라우저 검증은 같은 탭에서 `?lemon=1`로 복귀시켜 폴링을 태웠다. 지시서의 "폴링이 받아 생성 화면 진입"은 이 방식으로 확인한 것이고, 토스 승인 복귀 동선(`?toss=direct`)은 여전히 사람 확인 대상이다.
2. **prod 고객 주문 위험.** Firestore가 dev·prod 단일이라, dev-grant에 prod 고객의 pending 주문 ID를 넣으면 그 주문이 paid·devGrant로 바뀐다. 고객의 prod 폴링은 `failed`가 된다. 관리자 인증이 필요하고 주문 ID를 알아야 해서 실수 가능성은 낮지만 막지는 않았다. 닫힌 대안: ① 현행 유지 ② `init` 시 주문에 발급 서비스를 기록해 dev 발급 주문만 허용(init 수정 필요, 지시 범위 밖).
3. **dev 태그 실발송 미확인.** 태그 함수 단위 테스트뿐이고, 실제 텔레그램 수신은 볼 수 없었다. 팀방에서 다음 dev 알림으로 확인해 달라.

## 2. diff 요약

| 커밋 | 내용 |
|---|---|
| 18d2bf08 ① | `lib/shared/env-tag.js` 신설(`isDevService`·`withEnvTag`), `sendTelegramMessage` 1점 적용, `matte.js` `ENV_TAG` 제거, 테스트 |
| 06e6df47 ④ | `payments.js` `tokenEnvOk`·`handleDirectDevGrant`, 가드 3곳, `server.js` dev 전용 경로 + `requireAdmin`, 테스트 |

- 우회 발송 경로: `lib`·`server.js`·`public/js`에서 텔레그램 직접 호출 0건(grep `telegram.org`, `/sendMessage|sendPhoto|sendDocument`, `config.js` 제외). 호출부는 지시서의 14곳이 아니라 **44줄**이나 1점 적용이라 수정 불필요.
- 폴링 종료값: **`failed`**. `specs-funnel.js`·`headshot.js` 모두 `failed|amount_mismatch|refunded`가 폴링 종료 + 실패 안내 분기다. 주문을 실제로 바꾼 것처럼 보이는 `refunded`·`amount_mismatch`보다 의미가 가깝다. 프론트가 `reportPayFail('poll','FAILED')`를 보내므로 prod에서 이 경우 실패 기록 1건이 남는다.
- 가드 조건: `provider==='dev-grant' || devGrant`, 그리고 K_SERVICE가 `-dev`로 끝나지 않을 때 거부. 미설정도 거부.
- 다운로드 거부는 404 + `code: INVALID_TOKEN`. 환급·revoke는 손대지 않음.
- 매출 원장 `payments` 미기록(단위 테스트로 확인).

## 3. 검증

### API E2E (dev 00227-sxg, 공개 사진 c14, 주문 SPECS-kr-mvznp08w-52cec288)

| 단계 | 결과 |
|---|---|
| init → grant 전 폴링 | 200, pending, 토큰 없음 |
| 인증 없는 dev-grant | **401** |
| 잘못된 키 | **401** |
| 없는 주문 | 404 ORDER_NOT_FOUND |
| dev-grant | 200, 토큰 형식 일치(값 미출력) |
| 같은 주문 재요청(pending 아님) | **409 ORDER_NOT_PENDING** |
| grant 후 폴링 | paid, 토큰 일치 |
| 실패 경로: 디코드 불가 이미지 | 400 DECODE_FAILED, 생성권 반환 |
| T1 생성 | 200, `t1-attire`, 약 15초. 앞의 실패 뒤 1결제 1생성 토큰으로 성공 = **환급 실증** |
| 재생성 | 402 GENERATE_LIMIT |
| 다운로드 / 재다운로드 | 200 / 409 |

### 브라우저 (us-visa, close_c11)

| 단계 | 결과 |
|---|---|
| 위젯 표시 → 카드사 선택(국민) → 인증창 진입 → 닫기 | 주문 SPECS-kr-mvznfmlv-423d03dd. KB 창 진입 후 닫음. **카드 입력·승인 없음** (dev 00226 시점) |
| 위젯 표시 + dev-grant | 주문 SPECS-kr-mvznjsms-673a9094 (dev 00227) |
| `?lemon=1` 복귀 → 폴링 | `paid+token` 수신 |
| 생성 | 200, `t1-attire`, 결과 화면, 다운로드 버튼 활성 |

인증창 진입 주문과 dev-grant 주문이 다르다. 첫 주문 뒤 다른 세션 배포로 dev-grant 경로가 내려가 그 탭을 이어가지 못했고, 두 번째는 인증창을 다시 열지 않았다(실패 알림 추가 방지).
캡처: `/tmp/monk-fov/grant_widget.png`, `grant_gen.png`, `grant_result.png`, `devgrant_t1.png` (iMac, 커밋 안 함).

### 단위 테스트

포털 19 스위트 219건 통과(main 4a3bde23 위). 추가분: K_SERVICE dev·prod·미설정 태그, dev-grant 발급·거부, 비-dev(prod·미설정) 3곳 거부(생성 INVALID_TOKEN·쿼터 불변, 다운로드 INVALID_TOKEN·소모 없음, 폴링 토큰 미반환 + `failed`), 일반 토큰 영향 없음.

### 실행 이력·비용

- Vertex T1 생성 3회(API 2, 브라우저 1).
- 공유 Firestore에 테스트 주문·토큰이 남음(주문 5건 내외: mvzndxy5, mvznp08w, mvznjsms는 dev-grant, mvznfmlv와 중단된 첫 브라우저 시도 1건은 pending). 삭제하지 않았다.
- 인증창 닫기로 실패 기록·dev 알림이 발생했을 수 있다.
- `AGENT-API-KEYS`는 `secret.sh get` 파이프로 메모리에서만 사용, 값·토큰 미출력.

## 4. dev 상태

00223 → 00224(본 브랜치) → 00225·00226(타 세션, dev-grant 사라짐) → **00227-sxg = main 4a3bde23 + 본 브랜치 06e6df47**. 막내5 코드는 00227에 없다(막내5 동의, 완료 알림 후 막내5가 재배포 예정). 막내5 배포 후엔 dev-grant가 합쳐져 있지 않으면 또 사라진다.

## 5. prod 판정표

| 대상 | 필요 | 사유 |
|---|---|---|
| 포털 prod | **필요** (작가님 '배포 승인') | 태그는 prod 동작 변화 없음, 가드 3곳 활성 |
| 엣지 | 불필요 | 렌더러·i18n·specs-data 변경 없음 |
| crop-engine | 불필요 | |

## 5-1. 보완 — dev 생성 주문만 허용 (§1-2 해소)

출처: iMac/쌍아 04:34 세션 메시지(같은 지시서 범위). `init`이 주문에 `originService: K_SERVICE`를 기록하고, dev-grant는 이 값이 `-dev`로 끝나는 주문만 허용한다(그 외 403 `ORDER_NOT_DEV_ORIGIN`, 주문 불변). prod 고객 주문과 표식 없는 구 주문은 거부된다.

검증: 단위 테스트 2건 추가(prod 생성 주문·표식 없는 주문), 포털 221건 통과. dev `00229-tzk`에서 init → grant 200, 표식 없는 구 주문 SPECS-kr-mvznfmlv-423d03dd → 403. 전체 E2E는 재실행하지 않았다(§3은 00227 기준).

현재 dev = 00229-tzk(main 4a3bde23 + 61c222ca). 직전 확인은 00227이었고 그사이 00228이 올라갔는데, 제 배포가 덮었다. 막내5 배포로 추정되어 통지했다.

## 6. prod 음성 대조군 (prod 배포 후 쌍아 1회)

dev에서 init → dev-grant로 새 토큰을 얻어 환경변수 `T`와 `O`(주문 ID)에 넣은 뒤. 토큰은 출력하지 않는다.

```bash
# 경로 부재: 404 기대
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://monkos.ai/api/payments/direct/dev-grant
# 폴링: {"orderId":...,"status":"failed"} 기대, 토큰 없음
curl -s "https://monkos.ai/api/payments/direct/status?orderId=$O"
# 생성: 402 INVALID_TOKEN 기대 (이미지 검사 전 게이트에서 거부되는지 함께 확인)
curl -s -X POST https://monkos.ai/api/idphoto/generate -H 'Content-Type: application/json' \
  -d "{\"image\":\"x\",\"slug\":\"us-visa\",\"paymentToken\":\"$T\"}" | jq '{error,code}'
# 다운로드: 404 INVALID_TOKEN 기대
curl -s "https://monkos.ai/api/download/direct?token=$T" | jq '{success,code}'
```

위 호출은 prod에 거부 기록을 남긴다. monkos.ai는 엣지 경유이므로 API 경로가 오리진까지 가는지 응답으로 확인할 것.
