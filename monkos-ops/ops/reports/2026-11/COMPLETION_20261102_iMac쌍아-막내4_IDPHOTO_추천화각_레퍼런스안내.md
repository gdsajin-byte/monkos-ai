---
type: completion
date: 2026-11-02
device: iMac
agent: 쌍아-막내4
status: 마감
portfolio: PF_IDPHOTO
---

# COMPLETION — 업로드 화면 추천 화각 레퍼런스 안내

**[2026-11-02 20:02 KST]** iMac/쌍아-막내4 → iMac/쌍아

지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261102_iMac쌍아_막내4_IDPHOTO_추천화각_레퍼런스안내.md`
출처: 지시서 머리의 작가님 2026-11-02 19:50 쌍아 세션 사람 턴 "실행해 집에서 보겠다".

## 확인용

- dev rev: `monkos-portal-dev-00217-bwt`
- 미국 비자: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/visa/us
- 한국 여권: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/passport/kr
- 캐나다 여권: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/passport/ca
- 일본 여권: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/passport/jp

## 어느 커밋 위에 배포했나

- 배포 직전 dev 최신 = `00216-fgm`(19:51 KST). 막내3 미병합 브랜치 `worktree-makne3-crown-gate`(`c15aef7e`, 정수리 실측·미국 비자 31mm)가 올라간 것으로 판단했다. rev에 커밋 라벨이 없어 시각과 브랜치 내용으로 추정한 값이다. 00217에서 us-visa 흰 실선이 31mm 크기로 나와 막내3 코드가 함께 올라간 것은 확인했다.
- 그대로 배포하면 막내3 작업이 dev에서 사라지므로, 로컬 임시 브랜치 `makne4-dev-on-makne3`(`3267b0b0` = `10b284e5` + `c15aef7e`, 파일 겹침 없음)에서 배포했다.
- **납품 브랜치 `worktree-makne4-ref-fov`에는 막내3 코드가 없다.** 임시 브랜치는 로컬 전용이다.
- 막내3가 이후 자기 브랜치만으로 dev에 배포하면 이 안내가 dev에서 사라진다. 막내3 쪽도 합쳐서 배포해야 한다.

## 변경

| 파일 | 내용 |
|---|---|
| `portal/lib/framing-overlay.js` (신설) | 마스터 좌표·캔버스 확장·추천 범위 상수(1곳)·규격 잘림 범위 계산 |
| `portal/tools/specs-diagrams/gen_framing_reference.mjs` (신설) | 자산 재현 스크립트, 마스터 크기 불일치 시 exit 1 |
| `portal/public/images/guides/framing_reference_master.webp` (신설) | 640×886, 29KB |
| `portal/lib/cms/components/spec-funnel-markup.js` | 업로드 영역에 안내 삽입 |
| `portal/lib/cms/specs-i18n.js` | 6언어 문구·범례·대체 텍스트, "가슴 위 구도" 칩 제거 |
| `portal/public/css/specs-funnel.css` | 데스크톱 옆, 700px 이하 위 |
| `portal/__tests__/framing-overlay.test.js` (신설) | 엔진 실측 대조, 전 규격 포함 검사 |

## 좌표·계산 근거

- **눈 좌표**: FACE에 없어 유도했다. 원본 마스터를 prod crop-engine `/api/fit-spec`(읽기 전용 기하 계산)에 넣어 crown 98.24 · eye 279.64 · chin 461.04를 얻었다. 눈 = (턱+hairTopY)/2로 FACE와 정합한다.
- **캔버스 확장 40px**: 추천 범위 머리 위 0.37 × 두상 362.8 = 134.2px, 원본 여백 98.2px → 36px 부족, 4px 더해 40px. 모든 y에 +40 보정. 인물 픽셀은 불변이고 위쪽 흰 캔버스만 늘렸다.
- **추천 범위(초록)**: 머리 위 0.37 · 턱 아래 0.69 · 좌우 반폭 1.01 = 설계 최대치 + 여유 0.03.
- **규격 범위(흰)**: `getSpecCropParams` 그대로 + crop-engine `resolvePlacement` 식 이식. crop-engine은 독립 빌드 서비스라 import할 수 없어 함수 공용화가 불가하다(모듈 주석에 근거 기재). 이식분과 엔진의 어긋남은 아래 대조로 검증했다.

| 확장 캔버스 대조 (y 클램프 없음) | 엔진 x·y·w·h | 오버레이 x·y·w·h |
|---|---|---|
| us-visa 26mm | 94.8 · 14.2 · 711.3 · 711.3 | 93.7 · 13 · 711.6 · 711.6 |
| kr-passport | 257.9 · 107.1 · 384.6 · 494.5 | 257.1 · 107.1 · 384.8 · 494.7 |
| ca-passport | 191.4 · 14.9 · 518.0 · 725.2 | 190.6 · 14.9 · 518.3 · 725.6 |
| jp-passport | 257.9 · 107.1 · 384.6 · 494.5 | 257.1 · 107.1 · 384.8 · 494.7 |

오차는 최대 약 1px(캔버스 896px 기준)로 표시 용도에 영향 없다. 원인은 확인하지 않았다.

## 검증

- **dev 4페이지 × 390·1440 (rev 00217, 뷰포트 캡처)**: 8건 모두 가로 넘침 0, 4xx 0, 이미지 디코드 640px. 캡처: `monkos-ops/ops/reports/2026-11/captures_20261102_추천화각/`
- **규격별 흰 실선(1440폭 표시 px)**: us-visa 172×172 · kr 111×142 · ca 149×209 · jp 111×142. 초록은 전부 211×215로 고정. kr·jp는 규격이 같아 같은 크기다.
- **6언어**: ko·en·ja·es·id·vi 문구 마크업 확인(us-visa, curl). 번역 품질은 작가님·민아 감수 전이다. 캡처는 ko만 찍었다.
- **자산**: 200, 없는 파일 대조군 404. content-type이 `application/octet-stream`인데 기존 도해 `35x45.webp`도 같아 이번 변경과 무관하며, 브라우저 표시는 정상이다.
- **SSG**: 로컬 `build.mjs` 2,574p, 오류 0. `dist/specs/visa/us.html`·`passport/kr.html`에 같은 오버레이 마크업(규격별 좌표 상이) 확인. 막내3 미포함 상태로 빌드해 us-visa는 26mm 좌표다.
- **전 규격**: 잘림 범위 산출 428/429, 전부 초록 안. 나머지 1건은 `getSpecCropParams` null이라 초록만 그린다.
- **테스트**: 포털 전체 16 스위트 170건 통과(`10b284e5` 기준). 임시 병합 브랜치에서는 전체 테스트를 다시 돌리지 않았다.

## 지시서에 없던 판단

- **흰 실선 가시성**: 마스터 배경이 흰색이라 흰 실선만으로는 안 보인다. 완성 범위 밖을 살짝 어둡게(16%) 하고 실선 밑에 어두운 선을 깔았다. 범례는 흰 선에 어두운 테두리로 표기.
- **대체 텍스트 키 `framingAlt` 추가**: "촬영 구도 안내 예시 이미지"(6언어). 고객 사진처럼 보이지 않게 하는 ch8 5조 대응이다.
- **테스트 입력 고정**: 막내3의 31mm 병합 후에도 깨지지 않도록 엔진 대조 테스트는 측정 당시 spec을 고정값으로 쓴다.

## prod 판정표

| 표면 | 현 상태 | 반영 조건 |
|---|---|---|
| monkos.ai specs (엣지 정적본) | 미반영 | **`edge/deploy.sh` 재배포 필수** — specs 마크업·i18n 변경이라 누락 시 무음 구본 |
| monkos-portal prod | 미반영 | `deploy.sh prod` (작가님 승인) |
| dev | 반영 (00217-bwt) | — |

## 남은 것

- 설계 §7의 영문 `uploadHint` 폴백 HEIC 문구는 지시 범위 밖이라 손대지 않았다.
- `deploy.sh dev`의 엣지 드리프트 경고는 예정된 것이다(엣지 배포 금지 범위).
