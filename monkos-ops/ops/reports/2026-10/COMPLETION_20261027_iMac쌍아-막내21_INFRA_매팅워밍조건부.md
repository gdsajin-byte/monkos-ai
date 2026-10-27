---
type: completion
date: 2026-10-27
device: iMac
agent: 쌍아-막내21
status: 마감
portfolio: PF_INFRA
order: ORDER_20261027_iMac쌍아_막내21_INFRA_매팅워밍조건부_백업지연안내
---

# COMPLETION — 매팅 워밍 조건부화 + 백업 지연 안내

**[2026-10-27 17:14 KST]** iMac/쌍아-막내21 → iMac/쌍아

## 결론

설계서 §2를 구현해 dev에서 수용 기준 1~4를 전부 통과했습니다. 1순위 서버가 살아 있으면 RunPod 호출 0건, 불통이면 워밍 1회와 백업 처리 1회, 그리고 안내 문구와 텔레그램 알림이 나갑니다. **prod 배포와 엣지 재배포는 하지 않았습니다**(작가님 "배포 승인" 대상).

## 변경 파일 · 커밋

| 커밋 | 롤백 단위 | 파일 |
|---|---|---|
| `1c99305a` [fix] 매팅 RunPod 워밍 조건부화 | 서버 | `monkos_AI/portal/lib/matte.js`, `monkos_AI/portal/server.js` |
| `f38073d2` [feat] 매팅 백업 전환 시 고객 안내 | 프론트·i18n | `monkos_AI/portal/public/js/specs-funnel.js`, `monkos_AI/portal/lib/cms/specs-i18n.js` |
| (기록) | — | `monkos-ops/ops/audit/RUNPOD_USAGE.jsonl` 4행 추가 (`runpod_balance_check.sh --check-only` 계측 부산물) |

- `matte.js`
  - `getMatteEngineState()`를 새로 만들었습니다. 1순위 자체 서버 `/health`(2.5s)로 생사를 보고 60초 캐시합니다(`'primary'|'backup'`). 동시 조회는 1회로 합칩니다.
  - `warmupMatteEngine()`은 primary면 RunPod 워밍을 생략하고, backup일 때만 `/run` 워밍을 보냅니다(60s 쿨다운은 유지).
  - `runMatteChain`은 체인 순서·타임아웃·재시도를 바꾸지 않았습니다. 자체 서버를 건너뛰고 RunPod이 성공하면 `[Matte] BACKUP via=runpod reason=… cold=…s slug=…` 로그와 텔레그램을 남깁니다. 쿨다운 키 `lastBackupAlertAt`는 기존 `lastAlertAt`와 분리했습니다. dev에서는 메시지 앞에 `[dev] `가 붙습니다(`K_SERVICE`가 `-dev`로 끝날 때).
- `server.js`: precheck에서 엔진 상태를 검수와 병렬로 조회하고 응답에 `engineReady`를 추가했습니다(엔진명은 넣지 않았습니다). precheck 로그에도 `engineReady=`를 남깁니다.
- `specs-funnel.js`
  - 검수 카드 하단에 안내 1줄을 정보색(`#3b6ea8`)으로 띄웁니다.
  - 백업일 때 진행 문구를 10초·25초로 앞당겼습니다. 대상은 무료·파일럿·유료 세 경로입니다.
  - 유료 경로는 25초부터 환급 안심 문구를 함께 보여줍니다.
- `specs-i18n.js`: ko·ja·en·es에 키 3개를 추가했습니다(`engineBackupNotice`·`genBackupWorking`·`genRefundAssure`).

## dev 리비전

| rev | 내용 |
|---|---|
| `monkos-portal-dev-00200-6nn` | 커밋 1·2(초판) 배포, 기준 1 |
| `monkos-portal-dev-00201-gr8` | 1순위 URL을 `https://matte-unreachable.invalid`로 임시 변경, 기준 2 |
| `monkos-portal-dev-00202-tzq` | **원복**(`https://matte-imac.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34`) |
| `monkos-portal-dev-00203-7xg` | 파일럿 타이머 보정(아래 §발견) 재배포, 기준 3. **현재 서빙 중이며 MATTE_API_URLS는 원본 값입니다(17:14 실측)** |

iMac 매팅 서버와 터널은 건드리지 않았습니다. 불통 재현은 dev env만 바꿨습니다.

## 수용 기준 판정

| # | 판정 | 방법 · 실측값 |
|---|---|---|
| 1 iMac 정상 | ✅ | precheck→fit→무료 generate 1회 (dev, 16:57). precheck `engineReady:true`, 매팅 `via=https://matte-imac.monkos.ai`. **RunPod `jobs.completed` 2599 → 2599 (+0)**, 전후 대조 `runpod_balance_check.sh --check-only`(16:57:31 / 16:57:54). dev 로그에 `백업 워밍 발사`·`BACKUP` 0건 |
| 2 iMac 차단 | ✅ | dev 1순위 URL을 불통 주소로 바꾼 뒤 같은 동선 1회 (16:58). precheck `engineReady:false` → 로그 `백업 워밍 발사`(07:58:34Z) → `프리플라이트 불통` → **`BACKUP via=runpod reason=프리플라이트 불통 cold=14.8s`** → `via=runpod` 매팅 성공 (generate 18.3s). **양성 대조군: RunPod 2599 → 2601 (+2 = 워밍 1 + runsync 1)**. 이 결과로 카운터가 실제 호출을 잡는다는 것이 확인되어 기준 1의 +0이 유효합니다. 텔레그램 1건: `[Telegram] 메시지 전송 실패` 로그가 0건입니다(실패 시 WARNING을 남기는 구조라 API는 성공한 것으로 판정). **수신 화면은 막내가 볼 수 없어 팀방에서 `[dev] ⚠️ 매팅 백업 전환…` 1건을 육안으로 확인해 주셔야 합니다.** 10초 문구는 기준 3의 UI 실측으로 판정했습니다 |
| 3 4언어 렌더 | ✅ | ① SSR: dev `/specs/passport/kr`·`/ja/…`·`/en/…`·`/es/…` 각 2회 히트, 키 3개 인라인 확인, 페이지 HTML의 `imac|runpod` 0건. ② 헤드리스 크롬(별도 포트 9333·임시 프로필, 공유 디버깅 크롬 미사용): 실제 업로드 후 precheck 응답만 페이지 내 래퍼로 `engineReady:false`로 바꿔 4언어 안내 1줄 렌더를 확인했습니다. 화면 텍스트에서 `iMac/RunPod/runpod/matte-imac/Gemini` 0건. 진행 문구(ko, generate는 래퍼가 보류해 서버에 발송하지 않음): 파일럿 16s `보조 서버에서 처리 중이에요…` / 유료(크레딧 응답 모의) 5s 기본 → 11s 백업 문구 → 26s `genStillWorking2` + 환급 문구. **음성 대조군**(engineReady 미변조): 안내 미표시, 백업 문구 미표시, 26s 환급 문구만 표시 |
| 4 회귀 | ✅ | `npm test` 13 suites / 136 tests 전부 통과. dev 무료 generate 2회 정상 출고(`track=birefnet`, `cropEngine=fit`). 결제·환급 코드는 바꾸지 않았습니다(server.js 변경은 precheck 응답·로그뿐) |

## 환급 안심 문구 적용 범위 (지시서 5항 실측)

| 경로 | 게이트 | 실패 시 `refundGate` 발화 | 환급 실체 | 문구 노출 |
|---|---|---|---|---|
| 유료 · 결제 토큰 (`doGenerate`, `paymentToken`) | `consumeGenerateQuota` | ✅ Gemini 생성 예외 · T1 실패 · FACE_NOT_DETECTED · 디코드 실패 · 바깥 catch · 전달 불확실(115s) 전부 `fireRefundGate()` | `refundGenerateQuota` → `generateCount −1` (트랜잭션, best-effort) | ✅ 25s~ |
| 유료 · 로그인 크레딧 (`doGenerate`, 세션) | `/api/credits/use` | ✅ 위와 같은 분기 | `/api/credits/refund` → `refundEligibility`(같은 type·미환불·**10분 창**). 요청 예산 120s < 10분이라 창 안에서 처리됨 | ✅ 25s~ |
| 유료 · T1 의상+보정 | 위 둘 중 하나 | ✅ `T1_GENERATE_FAILED` 분기 | 같음 | ✅ (doGenerate 공용) |
| 무료 T0 (`doFreeGenerate`·파일럿) | 서버 쿼터 선차감 | ✅ `refundFreeQuota` | 무료 횟수 반환 | ❌ 설계상 유료 한정이라 노출하지 않음 |

참고 사항:
- 유료 경로에서 매팅이 실패하면 Gemini L3가 결과를 냅니다. 이때는 '실패'가 아니므로 환급 대상이 아니고, 문구("처리에 실패하면")와도 모순되지 않습니다.
- 크레딧 고객에게 "생성권"은 실제로 크레딧 10c를 돌려드리는 것입니다. 표현은 설계 원문 그대로 두었습니다.
- 클라이언트 네트워크가 끊겨도 서버 처리가 끝까지 실패하면 환급이 발화합니다. 서버는 성공했는데 응답만 유실된 경우는 115s 전달 불확실 분기가 흡수합니다(07-25 장치). 그 밖에 짧은 시간 안에 응답이 유실되는 경우는 기존 사각 그대로이며, 이번 변경 범위가 아닙니다.

## 발견 · 설계 대비 보충 (쌍아 확인 요청)

1. **파일럿 경로의 10초 기준점**: 처음 구현은 시어터 연출이 끝나는 시점부터 셌습니다. 그런데 생성 요청은 fit 응답 직후 시어터와 동시에 출발합니다. 그래서 문구가 요청 시작 후 13초 이상 지나서야 떴습니다(dev UI 실측). **요청 시작 시각 기준으로 보정**했습니다(`freeGenStartedAt`). 설계 의도("생성에 들어간 뒤 10초")와 같은 의미입니다.
2. **백업 사유 3번째 값 `포화 초과`**: 설계서 사유는 2종(`프리플라이트 불통|호출 실패`)입니다. 실제로는 자체 서버 503 포화 대기 상한을 넘겨 RunPod으로 가는 경로가 하나 더 있습니다. 이 경우를 `호출 실패`로 적으면 집계가 왜곡되므로 `포화 초과`로 구분했습니다. 텔레그램 문구는 설계 원문(`iMac 불통`)을 유지했으며, 포화 초과일 때는 문구가 엄밀하지 않습니다. 설계 문구를 사유별로 나눌지는 쌍아가 판단해 주세요.
3. **로그 접미 `slug=`**: 설계 형식 뒤에 `slug=`를 붙였습니다(집계용). 앞부분 형식은 그대로입니다.
4. **id·vi 언어**: specs-i18n에는 id·vi 블록도 있지만 지시 범위(4언어)에 따라 키를 넣지 않았습니다. 프론트는 키가 없으면 **안내를 생략**합니다(한국어를 노출하지 않음). 이 두 언어는 백업 시에도 현행 문구가 나갑니다.
5. RunPod 카운터는 16:57~17:14 동안 기준 2의 +2 말고는 변하지 않았습니다. prod는 아직 구버전이라 precheck마다 RunPod 워밍을 보내는데, 이 창에서는 prod의 측정성 통과 precheck가 없었던 것으로 보입니다.

## prod 반영 절차 (작가님 "배포 승인" 후)

1. **포털**: `monkos_AI/portal/deploy.sh prod`
2. **엣지 재배포 필수**: `monkos_AI/portal/edge/deploy.sh`. 근거는 두 가지입니다.
   - `specs-i18n.js`는 `render-specs.js`가 `CFG.t = v2.js`로 **specs HTML에 인라인**합니다. SSG(`tools/specs-ssg/build.mjs`)가 이 렌더러를 캡처하므로 정적본 2,574p에 들어갑니다.
   - `public/js/specs-funnel.js`는 엣지 `ASSETS`가 서빙합니다(`edge/worker.mjs` 2단계 정적 자산).
   - 엣지를 빼면 서버만 `engineReady`를 내보내고 화면은 구본 그대로 남습니다(무음 구본).
3. 라이브 검증(live-verify 2회 히트): specs 4언어 URL에서 `engineBackupNotice` 인라인을 확인하고, `specs-funnel.js?v=` 리비전이 바뀌었는지 확인합니다. 이후 1~2일간 `RUNPOD_USAGE.jsonl`의 delta가 0 근처인지(워밍 소멸) 대조합니다.

## 후속 (18:50 ORDER)

**[2026-10-27 18:55 KST]** iMac/쌍아-막내21 → iMac/쌍아

> 지시서: `ORDER_20261027_iMac쌍아_막내21_INFRA_백업알림사유분리_id_vi.md` (출처: 작가님 18:49 "A 배포 승인", 쌍아 전달). origin/main `2a1af7bc`을 fast-forward로 머지한 뒤 착수했습니다.

| 커밋 | 내용 |
|---|---|
| `10f818b1` [fix] | `matte.js`: `backupAlertText(slug, sec, reason)`을 새로 만들고(export, 테스트용 순수 함수) `alertMatteBackup`에 reason을 넘깁니다. 라벨은 프리플라이트 불통→iMac 불통 / 포화 초과→iMac 포화 / 호출 실패→iMac 호출 실패 / 그 외·null→iMac 불통입니다. 쿨다운 키·체인 동작·`[Matte] BACKUP` 로그 형식은 바꾸지 않았습니다. `__tests__/matte.test.js`에 테스트 2건 추가 |
| `3704c757` [feat] | `specs-i18n.js`: id·vi 블록에 3키를 지시서 문구 그대로 넣었습니다. 위치는 ko~es와 같은 `v2.js`이고, 블록 구조가 같으며 폴백이 없는 것을 확인했습니다 |

dev rev는 **`monkos-portal-dev-00204-qwr`**(deploy.sh dev)입니다. dev env는 바꾸지 않았고(MATTE_API_URLS 원본 값, 18:55 실측), iMac 서버·터널은 건드리지 않았습니다.

| 검증 | 판정 | 방법 |
|---|---|---|
| jest 전량 + 사유 라벨 매핑 | ✅ | `npm test` 13 suites / **138 tests** 전부 통과. 사유 3종은 정확한 문자열로, null·미지값은 iMac 불통으로 확인했습니다. 텔레그램 실발송은 하지 않았습니다 |
| id·vi 3키 렌더 | ✅ | ① 헤드리스 크롬(별도 포트 9333)으로 실제 업로드하고 precheck 응답만 페이지 내 래퍼로 `engineReady:false`로 바꿨습니다. `#v2-engine-notice`에 실제 렌더된 텍스트가 id·vi 지시서 문구와 일치합니다. ② `genBackupWorking`·`genRefundAssure`는 서빙 마크업 인라인(`CFG.t`)에 들어간 것을 URL당 2회 히트로 확인했습니다 |
| 내부 명칭 노출 0 | ✅ | id·vi 화면 텍스트에서 `iMac/RunPod/runpod/matte-imac/Gemini` 0건, 페이지 HTML에서 `imac|runpod` 0건 |

`genRefundAssure` 노출 조건은 기존과 같습니다(유료 `doGenerate` 25s~ 한정, 프론트 코드 무변경).

prod 반영 절차도 앞 절과 같습니다. 포털 `deploy.sh prod`에 더해 **엣지 `edge/deploy.sh` 재배포가 필수**입니다(i18n이 SSG 정적본에 인라인되기 때문). 집행은 쌍아가 작가님 승인 토큰으로 합니다.
