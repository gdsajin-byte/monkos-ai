---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내8
status: 마감
portfolio: PF_IDPHOTO
---

# COMPLETION — idphoto-kr 사진 올리기 열기 (kr 재정비 1/4)

**[2026-11-05 15:54 KST]** iMac/쌍아-막내8 → iMac/쌍아(세션2)

- 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내_IDPHOTO_kr업로드열기.md`
- 출처: 작가님 15:16·15:32·15:33·15:41 + 15:44 "진행"(막내8 배정)
- 브랜치: `worktree-makne8-kr-upload`
- dev rev: **`monkos-idphoto-kr-dev-00007-lgd`**. prod 미배포(지시서 범위 — 2번과 묶어 작가님 '배포 승인')

## 1. 결론

- prep 확인 페이지의 "촬영 시작하기" 아래에 **"갤러리에서 사진 올리기"** 를 같은 폭으로 추가했다.
  - 고른 사진은 촬영과 같은 규격으로 맞춰 분석실(result.html)로 보낸다. EXIF 회전은 반영하고 거울상은 만들지 않으며, 투명 PNG는 흰 바탕으로 채운다.
  - HEIC 등 열 수 없는 형식은 "이 형식은 열 수 없습니다 — JPG/PNG로 올려 주세요"를 띄운다.
- 촬영실에서 카메라를 켜지 못하면(권한 거부·장치 없음) 기존 alert 대신 **"갤러리에 있는 사진으로도 진행할 수 있습니다" + 사진 올리기 버튼** 상자를 띄운다(지시서 §2-4).
- 분석실 이후(결제·크레딧·`/api/idgen`·`/api/download`)는 손대지 않았다. 실시간 촬영 경로도 그대로다.

## 2. 지시서와 다른 점 (실측 근거)

1. **규격 수치**: 지시서는 720·0.8(`monk.js` 기본값)이라고 했다. 실제 촬영은 camera.js가 `maxSize: MAX_CAPTURE_SIZE`(config.js **512**), `captureQuality: 0.6`(숫자 하드코딩)으로 덮어쓴다. "촬영과 같은 규격"이라는 취지를 따라 **512·0.6**을 썼다. 0.6은 `config.js CAPTURE_QUALITY`로 정본화해 촬영·업로드가 함께 참조한다(ch2 7조, camera.js의 사본 숫자 제거).
2. **로그인 관문**: 현행 촬영실은 진입 때 로그인을 요구한다("촬영을 시작하려면 로그인이 필요합니다"). 업로드는 촬영실을 거치지 않아 **로그인 없이 분석실까지 간다**. 작가님 15:16 "로그인 없이도 가능하고 업로드도 가능"과 맞는다. "이 사진으로 리터칭"을 누르면 기존 로그인 확인이 그대로 동작한다(result.js 불변).
3. **이전 결과 제거**: 촬영실은 init에서 `monkos_generated`·`monkos_image`를 지운다. 업로드는 촬영실을 거치지 않아 같은 처리를 업로드 경로에 넣었다. 넣지 않으면 옛 결과가 새 사진에 붙는다.

## 3. 변경

| 파일 | 내용 |
|---|---|
| `public/modules/upload.js` (신규) | `normalizeUpload`(createImageBitmap `imageOrientation:'from-image'` → `<img>` 폴백, 긴 변 MAX_CAPTURE_SIZE, JPEG CAPTURE_QUALITY, 흰 바탕) · `pickImage` · `UploadError`/`UPLOAD_MESSAGES` |
| `public/prep.js` | `startUpload()`: saveSelections 먼저 → 고르기 → 정규화 → 이전 결과 제거 → `captured` 저장 → GA4 `photo_upload` `capture_mode:'upload'` → result.html. 버튼·안내 칸 |
| `public/camera.js` | 카메라 시작 실패 시 `showUploadFallback()`(alert 대체). GA4 `capture_mode:'upload', gate_reason:'camera_fail'`. `captureQuality: CAPTURE_QUALITY` |
| `public/config.js` · `shared.js` | `CAPTURE_QUALITY = 0.6` 신설·재수출 |
| `public/app.css` | `.prep-upload`(외곽선형, 촬영 시작과 같은 폭) · `.prep-upload-msg` |
| `public/camera.html` | `.upload-fallback` 스타일(camera.html의 "app.css 수정 금지" 지역 규칙 준수) |

## 4. 판정 (dev 00007-lgd · 별도 헤드리스 크롬 PID 43704, 아이폰 UA·390px · PID로 종료)

- 시험 사진: NASA 공개 사진(jemison, 1280×1600)으로 만든 4종. 고객 데이터는 쓰지 않았다.
- dev에서 사전 판정까지 돌릴 때만 **이 브라우저 안에서** 포털 verify-cookie 응답을 가짜 테스트 사용자(잔고 0c)로 바꿨다. 서버·실계정은 건드리지 않았다. 잔고가 0이라 생성 전에 멈추고, `/api/idgen`·`/api/download` 요청은 브라우저에서 차단 장치를 걸었다(호출 0건).

| 사진 | 분석실 | 정규화 | 원본 대비 픽셀 차이(거울상 / 180°) | 사전 판정(dev precheck) | idgen |
|---|---|---|---|---|---|
| 세로 JPG | ✅ | 410×512 | **3.8** (51.8 / 65.5) | ✅ 95점 OK | 0 |
| 가로 JPG + EXIF 6 | ✅ | 410×512 (세로로 바로 섬) | **3.8** (51.8 / 65.5) | ✅ 95점 OK | 0 |
| PNG(위 80줄 투명) | ✅ | 410×512 | 13.2 (투명→흰 바탕 몫) | ✅ 95점 OK | 0 |
| HEIC | prep에 머묾 | — | — | 안내 "이 형식은 열 수 없습니다 — JPG/PNG로 올려 주세요" | 0 |

- 거울상·회전 판정: 결과 이미지를 원본, 좌우 반전본, 180° 회전본과 평균 픽셀 차이로 비교했다. 원본과만 가깝다(PIL).
- 이전 결과 잔류: `monkos_generated`·`monkos_image`를 미리 심어 둔 뒤 업로드하면 둘 다 null이 된다(로컬).
- 카메라 실패 우회(로컬 정적 서버, 같은 가짜 로그인): 우회 상자가 표시되고 alert는 0건이다. 사진을 고르면 result.html로 가고 captured에 jpeg가 저장된다.
- 촬영 경로 회귀: 촬영 함수(`capturePhoto`)와 촬영실 흐름은 바꾸지 않았다. 품질 값은 같은 0.6을 상수로 참조할 뿐이다. 실기기 촬영 1회는 ⏳ 미실측이다(헤드리스에 카메라가 없음).
- 단위 테스트: `node --test monkos_AI/idphoto-kr/test/capture-gate.test.mjs` 10/10
- 캡처: job tmp `kr_upload/dev_*_1result.png`·`dev_*_2precheck.png`·`shot_camfail.png`

## 5. GA4 — ⏳ 미판정 (지시서 기준: 실데이터)

- 헤드리스 세션의 맞춤 이벤트는 GA에 잡히지 않았다. 대조군으로, 페이지 이동이 없는 `generate_click`도 실시간 보고서에서 0건이었다. 수집 자체는 살아 있다(같은 시간대 page_view·spec_select 등 수신).
- 같은 방식(보낸 직후 페이지 이동)인 운영 촬영 경로 `photo_upload`는 지난 14일간 idphoto-kr.monkos.ai에서 4건 들어왔다(run_report). 실제 기기에서는 이 방식이 수신된다는 근거다.
- **필요한 후속 2건**
  1. 실제 기기에서 dev 업로드 1회 → 다음 날 run_report로 `photo_upload` 확인
  2. `capture_mode`가 GA 커스텀 측정기준으로 등록돼 있는지 확인. 09-03 등록분은 service·market·spec_type 3개뿐이다. 미등록이면 upload와 camera를 구분해 볼 수 없다. 민아 GA4 계측 지시서 소관이다.

## 6. 남은 일

- ⏳ prod는 2번 지시서(결제 후 생성)와 묶어 작가님 '배포 승인'을 받은 뒤 배포한다.
- ⏳ 실제 기기 확인: 업로드 1회(GA 수신 포함)와 촬영 1회(회귀).
- 💡 업로드 경로는 로그인 없이 분석실까지 열린다. "이 사진으로 리터칭"부터는 기존 로그인·잔고 확인이 그대로 막는다. 2번 지시서에서 결제 흐름을 붙일 때 이 지점이 진입점이 된다.
