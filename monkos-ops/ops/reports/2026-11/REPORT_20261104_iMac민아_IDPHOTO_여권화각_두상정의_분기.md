---
type: report
date: 2026-11-04
device: iMac
agent: 민아
status: 마감
portfolio: PF_IDPHOTO
subject: 여권 화각 "머리 여백 부족" 오판 — 레퍼런스 산식과 제품 산식의 두상 정의 분기 추적
method: dev 00234 precheck 재현(공개 사진) + git -S 커밋 추적 + crop-engine·portal 코드 대조. 코드 수정 0
---

# REPORT — 여권 화각: 두상 정의가 레퍼런스와 제품에서 갈린 지점

**[2026-11-04 13:32 KST]** iMac/민아 → iMac/쌍아 (작가님 13:32 "쌍아에게 넘겨")

출처: 작가님 11-04 13:07 "헤드룸이 있는데 없다고 한거야" / 13:20 "왜 레퍼런스 틀 정도의 비율을 못 만들고 있지? 어디서 꼬인 거야. 초기에 만든 로직으로 레퍼런스도 다 만들었던 건데" / 13:32 "쌍아에게 넘겨".

## 0. 결론 1줄

제품은 **머리카락을 뺀 거울상 정수리**로 두상을 재고, 레퍼런스 도안은 **매팅 실측 머리끝까지 포함한 두상**으로 잰다. 갈린 지점은 07-07 3493b5d4(WYSIWYG 가이드, 원본 단계 틀 산출)이고, 11-03부터 precheck가 머리끝을 실측하므로 레퍼런스 산식으로 되돌릴 재료는 이미 있다(매팅 추가 0).

## 1. 재현 (dev 00234 = prod 00577 동일 코드 ae8eaa42)

작가님 13:07 스크린샷과 같은 공개 사진(NASA 초상, Wikimedia `Mae_Carol_Jemison.jpg` 1280px)을 `/api/idphoto/precheck` kr-passport로 호출. 산출 `scratchpad/jemison/precheck.json`.

| 항목 | 값 |
|---|---|
| 판정 | `hairPlacement.no_room` → `fov.cause=head_margin`, aiOnly |
| 사진 자체 머리 위 여백 | 사진 높이의 8.2% (131px/1600) — 충분 |
| 틀 기준 머리 여백 | −1.89mm (실측 머리끝이 틀 위로) |
| 눈 위치 | 43.03% → 0.5mm 여백 확보 시 48.34% (상한 48, 초과 0.34%p = 0.15mm) |
| 엔진 추정 정수리 vs 실측 머리끝 | 실측이 4.7mm 위 |
| 틀 기준 실제 두상(턱~실측 머리끝) | **37.7mm** (규정 32~36) |
| 실측 머리끝으로 두상 33mm 재배율 시 | 눈 42.4~48.0% · 위 여백 0.5~3mm · 턱 아래 9~11.5mm — 규정 배치 성립 |

prod·dev 로그: 11-03 00:00Z 이후 `no_room` 0건(prod `moved` 1건 11-03 22:08 KST). 스크린샷은 막내7 dev 검증 화면 계열.

## 2. 분기 추적 (커밋 기준)

| 시점 | 커밋 | 무엇이 바뀌었나 | 두상 정의 |
|---|---|---|---|
| 07-07 13:33 | eb6e7990 | 무료 트랙 = 매팅(순백) 후 crop-engine `/api/crop-spec` — 순백 전제라 `subjectTopRow` 머리끝 상시 스캔 | 머리카락 포함(가드+축소 루프) |
| **07-07 17:00** | **3493b5d4** | 크롭정밀도 Task1~4: 업로드 직후 가이드 틀(WYSIWYG)을 위해 **매팅 전 원본**에서 `fit-spec` `hairScan:false` 호출. 사유: 순백 전제 스캔이 어두운 배경에서 hairTop=0 오판(같은 날 카나리 crown 22.2mm/눈 84.7%). 최종 무료 재단 `matteFitPipeline`은 이 틀을 그대로 씀 | **머리카락 제외** — 정수리 = 눈~턱 거울상(`crop-engine/lib/crop.js:46`) |
| 07-11 | — | 레퍼런스 도안 `portal/tools/specs-diagrams/gen_reference_diagrams.mjs`: 순백 마스터 fit-spec **매팅 헤어탑 실측값 고정**(FACE.hairTopY 98.2) → `headPx = chinY − hairTopY` → 범위 ≤4mm면 하한(kr·jp 32mm)에 배율 → 정수리 여백 2~8mm | 머리카락 포함 = 배율 기준 |
| 07-18 | 25d8748f | IDPASS 정합(5차 가드 순서): crop-engine 배율 기준 = 거울상 얼굴 `faceTargetMm`(33), hairTop은 잘릴 때만 4.4% 여백 가드 + 하단 12% 여백 축소 루프(`crop.js:62-100`), `HAIR_VOLUME_MAX` 0.15 새니티 | 머리카락 = 가드(배율 기준 아님) |
| 11-02~03 | 막내2 브랜치(미병합) → 막내7 6617e19e·ae8eaa42 | precheck 초록 매팅으로 머리끝 실측(`hair-measure.js`). 막내7: **평행 이동만**(ORDER §1 "두상 33mm 불변"), 눈 48% 초과 시 `no_room` → "화각 부족" AI 유도 | 실측값은 있으나 배율에 미반영 |

- 막내7 COMPLETION "kr 32장 중 no_room 5장 전부 실제 잘림(육안)"은 틀이 거울상 기준으로 작게 잡혀 잘린 결과라 동어반복 가능성 — 같은 5장을 실측 머리끝 재배율로 다시 재면 판정이 바뀔 수 있다(미실측).
- 문구 `fov_unusable_body_head` "머리 윗부분 여백이 부족해"는 사진 여백으로 읽혀 이 사례에선 사실과 다르다.

## 3. 되돌리는 방향 (설계는 쌍아)

- **A(권고) 레퍼런스 산식 복원 at precheck**: `crownCheck.hairTopRatio`(이미 실측) → 두상 = `lines.chinY − hairTopY` → kr·jp 하한+1(33mm, `spec-crop.js` faceTargetMm 그대로)에 배율 → 눈 42~48% 범위 검사 → 벗어나면 그때 `head_margin`. fit 프레임=최종이라 WYSIWYG 유지, 매팅 추가 0. crop-engine 변경 없이 포털 산술로 가능(`resolveHairPlacement` 확장). 막내2 `refit-spec`은 생성 단계라 미리보기와 어긋나므로 precheck 쪽이 맞다.
- B 문구만 교정("규격 배치 안에 머리가 안 들어와요") — 구조는 그대로.
- 검증 표본: 막내7 표의 no_room 5장 + 우주인 사진 + 정상 5장 전후 표(두상 mm·눈 %·여백·턱 아래). `HAIR_VOLUME_MAX` 0.15는 crop-engine 쪽 상수라 포털 산술엔 미적용 — 극단 볼륨 상한은 설계에서 정할 것.
- 두상 하한: 레퍼런스는 32, 제품은 33(SpecData 하한+1, 작가님 실무). 하나로 맞출 것.

## 4. 근거 경로

`portal/server.js:83-135`(computeFitGeometry, hairScan:false) · `:746-775`(precheck 머리끝 판정) · `portal/lib/hair-measure.js:103-125` · `portal/lib/matte.js:345-395`(WYSIWYG 재단) · `crop-engine/lib/crop.js:20-23,46,62-100` · `crop-engine/server.js:208-212`(crop-spec 상시 스캔) · `crop-engine/lib/crop.js:248-252`(hairScan 끄는 사유) · `portal/tools/specs-diagrams/gen_reference_diagrams.mjs:13-15,88-99` · ORDER_20261103 막내7 §1 · COMPLETION 막내7 §4·§5.
