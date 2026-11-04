---
type: order
date: 2026-11-04
from: iMac/쌍아
to: iMac/쌍아-막내8
subject: 여권 화각 실무 정합 — 눈 앵커 43→45%, 규정 두상 32~36을 실측 두상(덩어리 머리끝)에 적용, 거울상 얼굴 하한은 별도 상수 30mm로 분리 — 출고본 200건 재대조·dev까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — 여권 화각 실무 정합 (눈 45% · 두상 정의 분리)

**[2026-11-04 19:35 KST]** iMac/쌍아 → iMac/쌍아-막내8

출처: 작가님 2026-11-04 iMac 쌍아 세션 사람 턴 — 19:35 "A승인 그런데 32~36인데 30? 그건 정수리 정의에서의 견해네". 결정 ① 눈 위치 45%(A) ② 얼굴 하한 30mm(A) — 단 **규정 32~36은 실측 두상(머리 덩어리 끝~턱)에 적용하고, 30은 거울상(머리카락 뺀 추정 정수리) 기준의 별개 하한**이라는 정의 구분(작가님 지적). 범위 승인 = §2(구현·재대조·dev).

## 0. 먼저 읽기
- 대조 결과: `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내7_IDPHOTO_여권화각_출고본대조.md`(§3 표·§4 오판 후보) — 출고본 눈 45.7%(p10 43.7·p90 47.9), 거울상 <32mm 52/200, 가드 발동 94/200, no_room 5.
- 현행 코드: `monkos_AI/portal/lib/hair-measure.js` 125~200행(`HAIR_MARGIN_MIN_MM`·`EYE_RATIO_MAX`·`eyeAnchorFor`·`resolveHeadPlacement`), `server.js:137`(`headMinMm: spec.headHeightMinMm ?? spec.faceMinMm` — **규정 두상 하한을 거울상에 적용하는 지점 = 이번 교정 대상**).
- 측정 도구: 막내7 `AI_Factory/photo_judge/` 대조 스크립트(로컬 구성·시드 1104 표본).

## 1. 바꿀 것
1. **눈 앵커**: 여권(kr·jp, 프레임 45mm) precheck 재배율의 앵커 43% → **45%**. `eyeAnchorFor`를 규격별 값으로 바꾸거나 여권 전용 상수 — 다른 규격(60mm 이상 42% 등) 동작 불변. 상한 48%(11-03 작가님 "너무 내려가도 보기 싫다")·머리 위 여백 0.5mm+2행 그대로.
2. **두상 정의 분리**:
   - **규정 두상**(실측: 턱~덩어리 머리끝) = 목표 33mm, 허용 32~36mm(`spec.headHeightMinMm/MaxMm`). 재배율 결과 실측 두상이 이 범위를 벗어나면 그 경계로 배율을 맞춘다.
   - **거울상 얼굴 하한** = 별도 상수 `MIRROR_FACE_MIN_MM = 30`(머리 볼륨이 커도 얼굴이 이보다 작아지지 않게 — 작가님 19:35). 거울상 상한 가드는 규정 상한과 섞지 말고 필요 여부를 표로 판단해 보고(현행 face_max는 대머리 경우 — 실측 두상 기준으로 대체되는지).
   - 두 조건이 충돌하면(예: 실측 32 맞추려면 거울상 <30) 우선순위와 결과 판정(no_room 등)을 명시하고 COMPLETION에 사례 수.
3. **로그·응답 필드**: 두 두상(실측·거울상)과 어느 가드가 걸렸는지(`head_reg_min/max`·`face_min_30`) 구분해 기록.
4. **유료 경로 차이 보고**: 유료 T1은 생성 후 crop-engine `cropToSpec`(눈 43% 고정)으로 재단 — 이번 변경으로 무료(45%)와 유료(43%) 세로 위치가 갈린다. crop-engine은 바꾸지 말고, 차이 크기(mm)와 맞추는 안(crop-engine 상수 변경 = 별도 배포)을 COMPLETION에 제안만.

## 2. 검증
- 단위 테스트(앵커·두 하한·충돌 사례) + 포털 전체 테스트 통과.
- **출고본 200건 재대조**(막내7과 같은 표본·시드·로컬 구성): 전/후 표 — 눈 %·위 여백·턱 아래·두상 차이 분포, no_room 건수, 가드 발동 종류별 건수. 목표: 세로 위치 차 중앙값이 0에 가깝게, no_room 감소.
- 막내1 재현 표본(공개 사진 jemison 등) 판정 변화 표.
- dev 배포(`deploy.sh dev`) 후 공개 사진 precheck 실호출 1회.

## 3. ⚠️ 준수 조항
- 고객 데이터: 막내7과 동일 — 픽셀 외부 반출 0, 이름·사진 설명 금지, 시놀로지 읽기 전용, 임시 파일 삭제.
- **운영 프로세스 보호(INCIDENT_20261104_matte-imac 재발 방지)**: 측정용 vision-matte·crop-engine 사본은 기동 시 PID를 기록하고 **그 PID만 종료**. 운영 바이너리 경로로 `pkill -f`·`killall` 금지. prod matte-imac(:8000)·터널 잡은 건드리지 않는다.
- ch5: dev까지. prod·엣지는 작가님 '배포 승인'. 문구 변경 없으면 엣지 불요 — 판정표에 명기.
- 헌법 4조 1·2항, 3조 1·2항, ch1 7조(설치 금지).
- GitHub SSH 간헐 장애 중 — 푸시 실패 시 `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push https://github.com/gdsajin-byte/monk_project.git <브랜치>` 1회성(설정 변경 금지).

## 4. 완료 기준
- [ ] 앵커 45%·두상 정의 분리·거울상 하한 30 구현 + 테스트
- [ ] 200건 전/후 대조 표 + jemison 등 공개 표본 표
- [ ] 유료 경로(43%) 차이·맞춤안
- [ ] dev rev + 실호출 1회
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내8_IDPHOTO_여권화각_실무정합.md`(prod 배포 대상 판정표), 브랜치 푸시·origin SHA 대조

## 5. 커밋 메시지
- `[fix] 여권 화각 실무 정합 — 눈 45%·규정 두상(실측)·거울상 하한 30 분리 (PF_IDPHOTO)`
