---
type: completion
date: 2026-11-04
device: iMac
agent: 쌍아-막내8
status: 마감
portfolio: PF_IDPHOTO
order: monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내8_IDPHOTO_유료크롭_눈45정합.md
---

# COMPLETION — 유료 크롭 눈 45% 정합 (A′)

**[2026-11-04 21:56 KST]** iMac/쌍아-막내8 → iMac/쌍아

**결론**: 유료 출고 크롭의 세로 위치가 무료와 맞았다. 출고본 200건 시뮬에서 유료 틀과 무료 틀의 세로 차(절댓값 중앙값)가 **0.82mm에서 0.07mm**로 줄었다. 목표는 0.3mm 이하였다. eyeAnchor를 주지 않으면 구 엔진과 결과가 같다. 200건 틀이 모두 같았고, 35×45 비대상 규격은 렌더 바이트까지 같았다. 크기 차(약 3%, 두상 정의 차이)는 이번 범위 밖이라 그대로 남는다. **dev는 생략했다.** crop-engine에 dev 서비스가 없어서, 쌍아 21:50 결정 ②에 따라 로컬 루프백 종단 검증으로 대신했다. prod 배포 대상은 **crop-engine → portal** 순서다.

출처: 지시서 상단(작가님 21:44·21:45 "민아와 권고안 확정해서 진행해"). 범위 승인은 §2(구현·검증·dev)까지다. dev 생략(②)은 쌍아의 범위 축소 판단이다(세션 메시지 21:50). 고객 데이터의 이름·사진 설명은 어디에도 쓰지 않았다. 레코드는 가명 id와 수치만 담았다.

## 1. 구현 (커밋 a3c7f241)

| 위치 | 내용 |
|---|---|
| portal `lib/spec-crop.js` | `cropSpecRequest(spec, slug)`를 신설했다. kr·jp 여권만 `{ ...spec, eyeAnchor }`를 합성하고, 값은 `HEAD_PLACEMENT_EYE_ANCHOR`를 import해서 쓴다(숫자 사본 없음). 그 밖의 규격은 **같은 객체를 그대로** 넘긴다. `cropToSpec`은 이 합성 결과를 crop-spec 요청 body로 보낸다. `getSpecCropParams`의 반환값은 바꾸지 않았다. `[SpecCrop]` 로그에 `앵커=0.45(spec)`를 붙였다. |
| crop-engine `lib/crop.js` | `resolveEyeAnchor(spec)`를 신설했다. `spec.eyeAnchor`가 숫자이고 0.38~0.50(경계 포함)이면 그 값을 쓰고, 출처를 `spec`으로 기록한다. 없거나, 범위 밖이거나, 문자열·null·NaN이면 기존 규칙(60mm 이상 0.42, 미만 0.43)을 쓰고 출처를 `default`로 기록한다. meta에 `eyeAnchorTarget`·`eyeAnchorSource`를 넣었다. `resolvePlacement`를 export했다(시뮬 하네스용, 동작 불변). |
| crop-engine `server.js` | crop-spec 주석에 `eyeAnchor?` 필드를 적었다. 동작은 바뀌지 않는다. |

**의도된 동승 (민아 보완 ②):** `cropToSpec`을 부르는 곳은 세 군데다. kr·jp 여권이면 세 곳 모두 45%로 재단한다.

| 호출처 | 경로 | 효과 |
|---|---|---|
| `server.js:1034` | 유료 T1(나노2 생성 → 재단) | 이번 정합의 대상 |
| `server.js:1098` | Gemini 생성 경로 | 동승 |
| `lib/matte.js:484` | `matteSpecPipeline` 무료 폴백 — fit 프레임이 없거나 `blocked`일 때 | 동승. 무료·유료 정합 취지라 되돌리지 않았다 |

- fit-spec(무료 가이드의 원 프레임)은 `getSpecCropParams`를 그대로 쓴다. 그래서 eyeAnchor가 없고 0.43 그대로다. 무료 최종 틀은 이미 포털 `resolveHeadPlacement`가 45%로 다시 정한다.
- 출고 게이트 `cropMetaWithinSpec`(눈 40~48%)은 경고만 하고 항상 true를 반환한다. 따라서 눈 48% 초과가 재생성·실패로 이어지지 않는다.

## 2. 테스트

- portal: 전체 **276/276** 통과(신규 3).
  - kr·jp 요청 spec에 `eyeAnchor`=정본 0.45가 실리고, 나머지 필드는 `getSpecCropParams`와 같다. 반환값은 바뀌지 않는다.
  - 35×45 비대상 규격 전수에서 요청 spec이 같은 객체다.
  - us-passport 요청에는 필드가 없다.
- crop-engine: `node --test lib/crop.eye-anchor.test.js lib/crop.fov.test.js` **9/9** 통과.
  - 주입 0.45 → 출처 spec. 생략 → 0.43(45mm)·0.42(60mm). 범위 밖·비숫자 8종 → default. 경계값 0.38·0.50 → spec.
  - 배율은 그대로이고 틀만 0.9mm 위로 간다. fit-spec meta에 출처가 남는다.

## 3. 35×45 다른 규격 불변 증명

- **요청 단계:** 프레임 높이 45mm인 비대상 slug **300건** 전수에서, `cropSpecRequest`가 넘기는 spec이 `getSpecCropParams`와 같은 객체였다(jest). 민아가 말한 289건과 건수가 다른 것은 셈 기준 차이로 본다. 여기서는 `getSpecCropParams(s).frameHmm === 45`로 셌다.
- **렌더 단계:** 300건의 고유 spec 12종을 구 엔진(origin/main `crop.js`)과 신 엔진 `cropToSpecV2`로 같은 입력·같은 랜드마크에서 렌더했다. **PNG sha256이 12/12 같았다.**
  - 대상 kr-passport는 눈이 42.9%에서 45.0%로 바뀌었고, 바이트가 달랐다(정상).
- **기하 단계:** 200건 시뮬에서 eyeAnchor 생략 시 구 엔진 `fitSpecGeometry` 틀과 **200/200 일치**했다(x·y·w·h 완전 일치).

## 4. 출고본 200건 유료 경로 시뮬 (막내7·8과 같은 표본·시드 1104)

- 입력은 `fov_compare_v1.jsonl`의 수치 기하(geom)다. 픽셀을 다시 읽지 않았다.
- 하네스는 `AI_Factory/photo_judge/paid_crop_sim.mjs`(신설)다. crop-engine `resolvePlacement`를 직접 호출한다.
- hairTop은 매팅의 덩어리 머리끝으로 넣었다. 순백 생성물에서 `subjectTopRow`가 잡을 값의 근사다.
- 무료 틀은 포털 정본으로 다시 계산했고, 레코드와 불일치 0건이다.

**유료 − 무료 (무료 통과 198건, p10 / p50 / p90)**

| 지표 | 전 (유료 0.43) | 후 (유료 0.45) |
|---|---|---|
| 틀 중심 세로 차 mm (+ = 유료 틀이 아래) | 0.68 / 0.81 / 0.95 | **−0.16 / −0.06 / 0.04** |
| 세로 차 절댓값 중앙값 mm | 0.82 | **0.07** |
| 눈 %p | −2.08 / −2.00 / −1.91 | −0.08 / −0.01 / 0.07 |
| 머리 위 여백 mm | −2.03 / −1.31 / −0.47 | −1.21 / −0.46 / 0.31 |
| 턱 아래 mm | −0.24 / 0.44 / 1.12 | −1.16 / −0.46 / 0.20 |
| 실측 두상 mm (크기, 범위 밖) | −0.39 / 0.96 / 2.53 | 동일 |

**유료 크롭 자체 — 전후 대조 (민아 보완 ③, n=200)**

| 지표 | 전 0.43 | 후 0.45 | 출고본 |
|---|---|---|---|
| 눈 % p10 / p50 / p90 | 42.92 / 43.01 / 43.09 | 44.92 / 44.99 / 45.07 | 43.67 / 45.66 / 47.92 |
| 머리 위 여백 mm | 0.70 / 1.97 / 3.21 | 1.42 / 2.78 / 4.14 | 2.28 / 3.19 / 3.93 |
| 턱 아래 mm | 9.11 / 9.15 / 9.19 | 8.22 / 8.25 / 8.28 | 7.05 / 7.92 / 9.01 |
| 눈 > 48% | 9 | **7** | 17 |
| 헤어 가드 발동(② 머리 잘림 → 틀을 올림) | 13 | **7** | — |
| 하단 축소 루프(③④) | 0 | 0 | — |
| 머리 위 여백 < 0 (잘림 남음) | 3 | 3 | 0 |
| 원본 위 경계 클램프 | 0 | 0 | — |
| hairTop 새니티 무시(`HAIR_VOLUME_MAX`) | 3 | 3 | — |

- 유료 − 출고 눈 %p: 전 −4.53 / −2.52 / −0.02 → 후 −2.75 / −0.58 / 1.58.

**헤어 가드와의 상호작용 (지시서 §1-4)** — 고치지 않고 보고만 한다.
- 앵커를 45로 올리면 머리 위 여백이 늘어 헤어 가드 발동이 13건에서 7건으로 줄었다. 눈 48% 초과도 9건에서 7건으로 줄었다. 이 7건은 헤어 가드가 틀을 올린 경우다.
- crop-engine에는 눈 48% 상한이 없다. 헤어 가드는 눈 위치와 상관없이 틀을 올린다. 그래서 7건은 경고만 남고 그대로 출고된다(`cropMetaWithinSpec` 경고).
  - 무료 경로(포털)는 같은 경우를 no_room으로 막는다. 두 경로의 판정 차이가 남는다.
- **머리 잘림이 남는 3건은 모두 `HAIR_VOLUME_MAX` 새니티가 hairTop을 무시한 경우다.**
  - 민아가 범위 밖으로 남긴 메모(B)와 같은 결함이다. 거울상 정수리 위 약 15%(약 5mm)를 넘는 머리를 오검출로 버리면 헤어 가드가 동작하지 않고, 머리가 틀 위로 잘린다.
  - 앵커 변경과는 무관하게 전후 3건 그대로다.
- **한계:** 실제 유료 경로는 원본이 아니라 생성물(나노2)을 재단한다. 생성물의 머리·얼굴 비율이 원본과 다르면 수치도 달라진다. 이번 시뮬은 위치 산식(앵커) 차이를 분리해서 본 것이다. 라이브 판정은 prod 반영 뒤 `[SpecCrop] … eye=… 앵커=0.45(spec)` 로그를 전후로 비교해야 한다.

## 5. dev 대체 — 로컬 루프백 종단 (쌍아 21:50 결정 ②)

**구성**
- 로컬 crop-engine(새 코드) :8093. PID는 bash 래퍼 16652 → node 16654 → SCRFD 16664 순이다.
- vision-matte 측정 사본 :8097 PID 16666.
- 포털 새 코드의 `cropToSpec`을 node로 직접 import했다. `CROP_ENGINE_URL`은 로컬로 지정했다.
- 포털 `shared/config.js`는 시크릿 필수라서, 로더(`module.register`)로 **로그 스텁만** 바꿔 끼웠다. jest `unstable_mockModule`과 같은 방식이다. 시크릿 값이나 placeholder는 만들지 않았다.

**입력**
- 공개 사진 jemison 원본을 긴 변 2048로 줄이고, 로컬 매팅으로 **순백 합성**했다. 유료 생성물이 순백 배경이라는 전제를 재현한 것이다.

**과금 경로를 거치지 않는 방법**
- 생성 API를 부르지 않는다. `cropToSpec` → `/api/crop-spec`만 호출한다.

**결과**

| 호출 | 앵커 목표 | 출처 | 실측 앵커 | 눈 % | 얼굴 mm | 머리 여백 mm | 턱 아래 mm |
|---|---|---|---|---|---|---|---|
| 포털 cropToSpec · kr-passport | **0.45** | **spec** | 0.45 | **45.0** | 33.0 | 3.7 | 8.3 |
| 대조군: 같은 입력, eyeAnchor 없는 spec · kr | 0.43 | default | 0.429 | 42.9 | 33.0 | 2.8 | 9.2 |
| 포털 cropToSpec · jp-passport | 0.45 | spec | 0.45 | 45.0 | 33.0 | 3.7 | 8.3 |
| 대조군 · jp | 0.43 | default | 0.429 | 42.9 | 33.0 | 2.8 | 9.2 |
| 포털 cropToSpec · us-passport (비대상) | 0.43 | default | — | 43.0 | 31.0 | — | — |

- 포털 로그: `[SpecCrop] kr-passport: 안착 face=33.0mm crown=3.7mm eye=45.0% 앵커=0.45(spec)`.
- 하네스는 레포 밖(잡 tmp)에 두었다. 같은 방식은 위 구성대로 재현할 수 있다.

## 6. 배포 대상 판정표 (실행 안 함 — 작가님 '배포 승인' 사안)

| 순서 | 대상 | 필요 | 근거·주의 |
|---|---|---|---|
| 1 | `monkos-crop-engine` (asia-northeast3) | **필요** | `lib/crop.js` 수정. 하위호환이라 먼저 올려도 구 포털은 영향이 없다(필드가 없으면 기본값). ⚠️ **`deploy.sh`는 맨 위 좀비 가드 때문에 `--force-zombie` 없이는 exit 1이다.** 이 가드는 08-13 "미생성" 오판의 잔재다. references.md는 09-04에 "asia-northeast3 실존·200"으로 교정됐다. 지시대로 deploy.sh는 고치지 않았다. dev 분기가 없고 서비스명은 `monkos-crop-engine` 고정이다. 배포 후 `/health` 확인과 crop-spec meta의 `eyeAnchorSource` 필드 존재 확인이 필요하다. |
| 2 | `monkos-portal` | **필요** | `lib/spec-crop.js`. crop-engine보다 먼저 올라가도 구 엔진이 필드를 무시하므로 무해하다. 다만 정합 효과는 엔진이 올라간 뒤에 난다. |
| — | 엣지 `monkos-portal-edge` | 불필요 | 문구·specs-data·렌더러 변경이 없다(`render-specs.js:678`은 frameRatio만 쓴다 — 민아 확인). |

- **dev 부재(실측 21:50):**
  - gcloud run 서비스 중 crop 계열은 `monkos-crop-engine` 하나다.
  - portal-dev의 `CROP_ENGINE_URL`도 prod crop-engine을 가리킨다.
  - 그래서 portal dev를 올려도 prod 엔진이 필드를 무시한다. 검증 가치가 없어 ③안도 하지 않았다.
- **prod 반영 확인안:**
  - 엔진: crop-spec을 직접 호출해 meta의 `eyeAnchorTarget`·`eyeAnchorSource`를 본다. 공개 사진을 쓰고, 과금 경로는 거치지 않는다.
  - 포털: 유료 실주문의 `[SpecCrop] … 앵커=0.45(spec)` 로그를 본다.

## 7. 운영 보호·데이터

- 측정 사본은 기록한 PID로만 종료했다: `kill 16666 16664 16654 16652`. `pkill`·`killall`은 0회다.
  - 종료 뒤 :8093·:5093·:8097 LISTEN 0개를 확인했다.
  - prod :8000은 PID 3766으로 살아 있다. `matte-imac.monkos.ai/health` 2회 히트 결과 200/200이다.
- 고객 픽셀 반출 0. 200건 시뮬은 수치 기하만 썼다. 종단 검증에는 공개 사진만 썼다.
- 설치 0. 비교용 구 엔진 사본(`_crop_old_cmp.tmp.js`)과 워크트리 심볼릭 링크는 삭제했다. 커밋에서도 빠졌다.

## 완료 보고

- ✅ 포털 eyeAnchor 합성(`getSpecCropParams` 불변)과 crop-engine 선택 파라미터(기본값 하위호환)를 구현했다(a3c7f241). 테스트: portal 276/276, crop-engine 9/9.
- ✅ 35×45 비대상 300 slug 불변: 요청 spec 같은 객체, 렌더 sha256 12/12, 기하 200/200.
- ✅ 200건 유료 시뮬: 세로 차 절댓값 중앙값 0.82 → 0.07mm. 눈 % 중앙값 43.01 → 44.99. 헤어 가드 13 → 7. 48% 초과 9 → 7.
- ✅ dev 대체 로컬 종단: 포털 → 엔진 경로에서 앵커 0.45·출처 spec·눈 45.0%. 대조군은 0.43·default·42.9%.
- ❌ crop-engine·portal dev rev 없음. dev 서비스 부재 때문이고, 쌍아 결정 ②다.
- 💡 범위 밖 결함 2건(보고만):
  - ① `HAIR_VOLUME_MAX` 새니티 탓에 머리가 잘린 채 출고되는 3/200건(민아 메모 B와 같다).
  - ② crop-engine에는 눈 48% 상한이 없어, 헤어 가드가 개입한 7건이 경고만 남기고 출고된다. 무료 no_room과 판정이 다르다.
- ⏳ prod 배포(crop-engine `--force-zombie` 필요 → portal 순, 작가님 '배포 승인'). 크기 차 약 3%(B안 — 유료도 fit 틀로 재단)는 미결이다.
- 📁 `monkos_AI/crop-engine/lib/crop.js`·`crop.eye-anchor.test.js`·`server.js` / `monkos_AI/portal/lib/spec-crop.js`·`__tests__/spec-crop-eye-anchor.test.js` / `AI_Factory/photo_judge/paid_crop_sim.mjs` / 이 보고서·세션 로그·PF 1행
- 🔀 브랜치 `worktree-makne8-paid-crop-eye45` → 원격 푸시. 병합은 쌍아가 한다.
