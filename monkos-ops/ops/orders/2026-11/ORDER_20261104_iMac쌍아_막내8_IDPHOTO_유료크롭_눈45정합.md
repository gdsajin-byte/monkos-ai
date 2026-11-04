---
type: order
date: 2026-11-04
from: iMac/쌍아
to: iMac/쌍아-막내8
subject: 유료 T1 출고 크롭 눈 위치를 무료(45%)와 정합 — 포털이 crop-spec 요청 spec에 eyeAnchor를 싣고, crop-engine은 선택 파라미터로 수용(기본 0.43/0.42 불변). kr·jp 여권만. dev까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — 유료 크롭 눈 45% 정합 (A′)

**[2026-11-04 21:46 KST]** iMac/쌍아 → iMac/쌍아-막내8

출처: 작가님 2026-11-04 iMac 쌍아 세션 사람 턴.
- 21:44 "유료는 나노바나나 프롬프트 수정인가, 출고 크롭 설정인가" → 쌍아 답: 크롭 설정이며 A를 추천.
- 21:45 "민아와 권고안 확정해서 진행해".

민아 의견은 §5에 쌍아가 적어 넣는다. 범위 승인은 §2(구현·검증·dev)까지다.

## 0. 먼저 읽기
- 본인 COMPLETION_20261104 막내8 여권화각_실무정합 §4: 유료 경로 차이(위치 0.9mm, 크기 3%).
- 포털 `lib/spec-crop.js`:
  - `cropToSpec` 119행 — 요청 body가 `{image, spec}`이다.
  - `getSpecCropParams`.
- crop-engine:
  - `lib/crop.js:67` `eyePositionRatio = frameHmm >= 60 ? 0.42 : 0.43`
  - 같은 파일의 헤어 가드(②)
  - `/api/crop-spec` 핸들러
- 정본 상수: 포털 `lib/hair-measure.js`의 `HEAD_PLACEMENT_EYE_ANCHOR`(kr·jp 여권 0.45).

## 1. 바꿀 것
1. **포털**: `cropToSpec` 안에서 요청 body를 `{ image, spec: { ...spec, eyeAnchor } }`로 합성한다. kr·jp 여권만 대상이다(민아 보완 ①).
   - `getSpecCropParams` 반환값은 **바꾸지 않는다.** 같은 spec을 `server.js:83` computeFitGeometry가 쓰므로, 반환값을 바꾸면 무료 가이드의 원 프레임 지표가 같이 움직인다.
   - 값은 `HEAD_PLACEMENT_EYE_ANCHOR`를 import해서 쓴다. 숫자를 사본으로 박지 않는다.
   - 다른 규격은 이 필드를 넣지 않는다.
   - **의도된 동승**(민아 보완 ②): `matte.js:484` matteSpecPipeline 무료 폴백도 cropToSpec을 타므로 45%가 함께 적용된다. 무료·유료 정합 취지이니 되돌리지 않는다. COMPLETION에 명기한다.
2. **crop-engine**: `spec.eyeAnchor`를 선택 파라미터로 받는다.
   - 유효한 숫자(0.38~0.50)면 그 값을 쓴다.
   - 없거나 범위 밖이면 기존 0.43/0.42를 쓴다(하위호환).
   - 응답 `meta`에 적용한 앵커와 출처(`spec`/`default`)를 남긴다.
3. **35×45 다른 규격 불변 확인**: 프레임 높이 45mm인 다른 slug의 crop 결과가 바이트 동일한지 시험한다. 바이트 비교가 어렵다면 최소한 눈 %가 그대로인지 확인한다.
4. **눈 상한 48%·헤어 가드와의 상호작용**: 앵커를 45로 올렸을 때 헤어 가드가 개입하는 비율을 표로 낸다. 결함이 보이면 보고만 하고 고치지 않는다.

## 2. 검증
- **단위 테스트**: crop-engine(앵커 주입·생략·범위 밖), 포털(spec 필드), 포털 전체 테스트.
- **출고본 200건 유료 경로 시뮬**: 로컬에서, 막내7·8과 같은 표본·시드로 한다.
  - 비교 대상: 무료 fit 틀 대비 유료 크롭의 세로 위치 차와 눈 % 차, 전/후.
  - 목표: 위치 차 0.9mm에서 0.3mm 이하로.
  - 전후 대조 지표 추가(민아 보완 ③): 눈 % 분포(중앙값·p10·p90), 48% 초과 건수, 헤어 가드 발동 건수.
  - crop-engine에는 test 스크립트가 없다. `resolvePlacement` 직접 호출 하네스로 시험한다.
  - 라이브 판정: 포털 `[SpecCrop]` 로그의 eye% 전후 대조를 함께 쓴다.
  - 크기 차 3%는 이번 범위 밖이라 남는 것이 정상이다.
- **dev 배포**: crop-engine dev → 포털 dev 순서로 한다.
  - crop-engine에 dev 서비스가 없으면 멈추고 보고한다. prod crop-engine을 dev 용도로 쓰지 않는다.
  - 공개 사진 jemison으로 유료 크롭 경로를 실호출해 meta 앵커 0.45와 눈 %를 확인한다.
  - 과금 경로를 거치지 않고 crop-spec만 직접 호출할 수 있으면 그 방법을 쓰고, 방법을 COMPLETION에 남긴다.

## 3. ⚠️ 준수 조항
- **고객 데이터**: 막내7·8과 같다.
  - 픽셀 외부 반출 0.
  - 이름·사진 설명 금지.
  - 시놀로지는 읽기 전용.
  - 임시 파일은 끝나면 삭제.
- **운영 프로세스 보호**:
  - 측정용 사본은 기동 시 PID를 기록하고 그 PID로만 종료한다.
  - `pkill -f`·`killall` 금지.
  - prod matte-imac(:8000)는 건드리지 않는다.
- **ch5**: 이번 범위는 dev까지다.
  - prod(crop-engine·포털)는 작가님 '배포 승인' 사안이다.
  - COMPLETION에 배포 대상 판정표와 순서(crop-engine → 포털)를 쓴다.
- **헌법·법률**:
  - 헌법 4조 1·2항: 시크릿 생성·추측 금지, 파괴적 명령 금지.
  - 헌법 3조 1·2항: 시각은 `date` 실측, 세션 로그·완료 보고·PF_IDPHOTO 1행.
  - ch1 7조: 설치 금지.
- **푸시**: SSH 장애가 계속되면 HTTPS 1회성 푸시를 쓴다. 명령은 직전 지시서와 같다.

## 4. 완료 기준
- [ ] 포털·crop-engine 구현 + 테스트
- [ ] 35×45 다른 규격 불변 증명
- [ ] 200건 유료 시뮬 전/후 표 + 헤어 가드 개입 표
- [ ] crop-engine dev·포털 dev rev + 실호출 1회
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내8_IDPHOTO_유료크롭_눈45정합.md`, 브랜치 푸시·origin SHA 대조

## 5. 민아 의견 (쌍아 기입)
- 2026-11-04 21:48 iMac/민아 회신: **A′ 동의.** 보완 ①②③을 조건으로 확정했고, 위 §1·§2에 반영했다.
- 35×45 규격은 specs-data 289/429건이다. 그래서 키는 frameHmm이 아니라 슬러그여야 한다.
- crop-engine `resolvePlacement`는 crop-spec·fit-spec·cropToFrame이 함께 쓴다. eyeAnchor가 없으면 0.43/0.42를 그대로 쓰므로 하위호환이 유지된다.
- 엣지 재배포는 필요 없다(`render-specs.js:678`은 frameRatio만 쓴다).
- 범위 밖(B 메모): `HAIR_VOLUME_MAX` 0.15 때문에 거울상 정수리 위 약 5mm를 넘는 머리가 오검출로 버려질 수 있다. 정수리 실측을 crop-engine에 넣을 때 함께 다룬다.

## 6. 커밋 메시지
- `[fix] 유료 크롭 눈 앵커 spec 주입 — kr·jp 여권 45% 정합 (PF_IDPHOTO)`
