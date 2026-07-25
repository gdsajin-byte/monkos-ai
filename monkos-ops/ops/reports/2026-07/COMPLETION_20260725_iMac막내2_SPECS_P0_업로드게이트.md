---
type: completion
date: 2026-07-25
time: 16:02 KST
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260725_iMac쌍아_막내_SPECS_P0_업로드게이트_오탐구제.md
portfolio: PF_SPECS
commit: 4f4b1f8e
branch: main
status: dev 검증 완료 / prod 미배포
---

# COMPLETION — P0 업로드 게이트 오탐 구제 + 거부 계측 신설

**[2026-07-25 16:02 KST]** iMac/막내2 → 작가님·iMac/쌍아

---

## 요약

✅ 확장자 폴백 · `upload_rejected` 계측 · 6언어 문구 3건 전량 구현, dev 배포·검증 완료
✅ 회귀 사고 2건(07-13 정규식 이스케이프 · 07-19 null 바인딩) 유형 재현 없음 — **콘솔 문제 0건**
💡 **오탐의 진범은 JPG·WEBP가 아니라 HEIC/HEIF** — 민아 REVIEW 실측 반영해 코드 주석의 근거를 정정
⚠️ 검증 7항 중 **1항(GA4 실시간 수신) 미검증** — CDP 브라우저 환경 요인, prod에서도 동일 증상 확인
⏳ 판단 요청 3건 (jfif · HEIC 미리보기 · 업로드 힌트 문구)
🔀 prod 미배포 — 별도 승인 대기

---

## 1. 변경 내역

| 파일 | 변경 | 내용 |
|------|------|------|
| `monkos_AI/portal/public/js/specs-funnel.js` | +33행 | `ALLOWED_EXT`·`fileExt()`·`trackReject()` 신설, `handleFile()` 게이트 재구성 |
| `monkos_AI/portal/lib/cms/specs-i18n.js` | 6행 교체 | `errFileType` ko·ja·en·es·id·vi |

### 1-1. 확장자 폴백 (작업 1)

```js
var mime = (file && file.type) || '';
var ext = fileExt(file && file.name);
if(!mime.match(/image\/(jpeg|png|heic|heif|webp)/i) && ALLOWED_EXT.indexOf(ext) < 0){ ... }
```

- **정규식 리터럴 무수정** — 기존 `/image\/(jpeg|png|heic|heif|webp)/i` 를 그대로 두고 폴백 분기만 `&&`로 추가. 07-13 이중 이스케이프 사고 표면 미접촉.
- `file.type` → `mime` 지역변수로 받아 **null 가드**. `file`이 `null`이어도 예외 없이 거부 경로.
- 허용 확장자 6종: `jpg` `jpeg` `png` `webp` `heic` `heif` (지시서 명시 목록 그대로. bmp·tiff·gif 미추가)
- 로컬 단위 시험 14케이스 전량 의도대로 동작(빈 파일명 · 확장자 없음 · 마침표로 끝나는 이름 · `null` 포함, 예외 0).

### 1-2. 에러 문구 (작업 2)

6개 언어 모두 **실제 허용 목록(JPG·PNG·WEBP·HEIC)** + **BMP 재저장 안내 1문장**. 각 언어의 기존 경어·문체 유지.

| 언어 | 문구 |
|------|------|
| ko | JPG, PNG, WEBP, HEIC 파일만 업로드 가능합니다. BMP 파일은 지원하지 않으니 PNG나 JPG로 저장한 뒤 다시 시도해 주세요. |
| ja | JPG、PNG、WEBP、HEICファイルのみアップロードできます。BMPファイルには対応していないため、PNGまたはJPGで保存し直してからお試しください。 |
| en | Only JPG, PNG, WEBP, and HEIC files are supported. BMP files are not supported — please save the photo as PNG or JPG and try again. |
| es | Solo se admiten archivos JPG, PNG, WEBP y HEIC. Los archivos BMP no son compatibles; guarde la foto como PNG o JPG e inténtelo de nuevo. |
| id | Hanya file JPG, PNG, WEBP, dan HEIC yang didukung. File BMP tidak didukung, silakan simpan foto sebagai PNG atau JPG lalu coba lagi. |
| vi | Chỉ hỗ trợ file JPG, PNG, WEBP và HEIC. File BMP không được hỗ trợ, vui lòng lưu ảnh dưới dạng PNG hoặc JPG rồi thử lại. |

에러 영역(`.v2-error-msg`) 1~2줄 내 수용 확인 — 레이아웃 붕괴 없음.

### 1-3. `upload_rejected` 계측 (작업 3)

- `gaTrack('upload_rejected', {...}, true)` — **repeat=true**로 1회 가드(`gaFired`) 해제. 한 유저의 반복 시도가 전부 계수된다.
- 파라미터 3종: `reject_reason`(`type`|`size`) · `file_mime`(빈 값 → `(empty)`) · `file_ext`(없음 → `(none)`)
- **형식 거부·용량 초과 양쪽에 발화**.
- **개인정보 미포함** — 파일명 전체 미전송, 확장자만 추출.

---

## 2. 검증 결과 (dev `monkos-portal-dev-00165-cp9`)

| # | 항목 | 결과 | 실측 |
|---|------|------|------|
| 1 | 회귀 — 콘솔 에러 | ✅ | 로드·업로드·거부·완주 전 구간 **console error/warning·미처리 예외·network error 0건** |
| 2 | 정상 경로 완주 | ✅ | 업로드→precheck(`measurable:true`)→fit(200)→무료 생성(200, 101.8s)→결과 이미지 451,522자 표시 |
| 3 | 오탐 구제 실증 | ✅ | `file.type=''` + `.heic` / `.jpg` **양쪽 게이트 통과** → precheck 정상 진입 |
| 4 | 거부 정상 동작 | ✅ | `.bmp` 거부 + 새 문구 노출 + `upload_rejected{type, image/bmp, bmp}` 발화 |
| 5 | 계측 도달 | ⚠️ **미검증** | 페이로드는 실측 확인, GA4 실시간 수신은 환경 요인으로 확인 불가 (§3) |
| 6 | 6언어 문구 | ✅ | ko·ja·en·es·id·vi 6/6 브라우저 실노출 |
| 7 | prod 무영향 | ✅ | prod rev `00537-q69` 무변동, prod HTML은 구 문구 유지 |

### 추가 실측 (지시서 항목 외)

| 케이스 | 기대 | 결과 |
|--------|------|------|
| 빈 MIME + 확장자 없음 | 거부 + `(empty)`/`(none)` | ✅ `file_mime:"(empty)", file_ext:"(none)"` |
| 11MB `image/jpeg` | 용량 거부 | ✅ `reject_reason:"size"` |
| `image/bmp` + `.bmp` | 거부 | ✅ (서버 sharp 미지원 포맷 차단 유지) |

### 검증 계측기 자체 결함 — 1회 자기교정

첫 측정에서 `Page.addScriptToEvaluateOnNewDocument`로 콘솔 수집기를 주입했으나 **`Page.enable` 없이는 주입되지 않는다**. 수집기가 없는 상태에서 `window.__errs || []`를 읽으면 **항상 빈 배열** → "콘솔 에러 0건"이 **거짓 합격**으로 나온다. 페이지에서 `typeof window.__errs === 'undefined'`를 확인해 적발하고, 이벤트/응답을 분리하는 클라이언트로 교체해 전량 재측정했다. 위 표의 1번은 재측정값이다.
→ PF_CDP **CASE-014** 등록 + 도구 사본 `PF_CDP/tools/monkcdp.py` 배치.

---

## 3. ⚠️ 검증 5항 미검증 — GA4 실시간 수신

**확인된 것**: `Network.requestWillBeSent`의 POST 바디 실측 — 측정 ID 2종(G-JPZ…, G-FKG…) 모두에 아래가 정확히 실려 나간다.

```
en = upload_rejected
ep.reject_reason = type     ep.file_mime = (empty)     ep.file_ext = bmp
ep.spec_type = kr-passport  ep.lang = ko               ep.service = specs-v2  ep.market = kr
```

**확인 못 한 것**: `analytics.google.com/g/collect` 요청이 **전부 `net::ERR_ABORTED`** 로 중단되어 GA4 실시간 리포트에 도달하지 않는다.

**환경 요인으로 확정한 근거**
- `curl`로 같은 엔드포인트 POST → **204 정상** (머신 네트워크 문제 아님)
- 프로필 2개(9224·9225 신규 생성) 모두 동일
- **prod monkos.ai(무변경 코드)에서도 동일 증상** — 이번 변경과 무관
- GA4 실시간 카운트가 반복 로드에도 고정 → 이 브라우저의 히트는 애초에 GA에 도달하지 않는다

→ PF_CDP **CASE-015** 등록.
→ **요청**: 작가님 실브라우저로 dev specs 페이지에서 `.bmp` 1건 드롭 → GA4 실시간에 `upload_rejected` 확인 1회. 이것으로 5항이 닫힌다.

---

## 4. 💡 민아 REVIEW 반영 — 근거 정정

[REVIEW_20260725_iMac민아_SPECS_P0_MIME전제검증](REVIEW_20260725_iMac민아_SPECS_P0_MIME전제검증.md) 실측이 지시서 배경(및 제가 코드에 단 주석)의 전제를 반증했다.

| 항목 | 지시서·초안 주석 | 민아 Windows 실기 실측 |
|------|-----------------|----------------------|
| 빈 MIME 발생 포맷 | `.webp` (레지스트리 미등재) | **반증** — Chromium 내장 MIME 표가 보전 |
| 구해내는 대상 | "정상 JPG" | **반증** — 재현 불가 |
| 진범 | — | 🔴 **HEIC/HEIF** — 레지스트리·내장표 **양쪽 미보유** → 진짜 빈 문자열 |

현 prod는 **HEIC를 거부하면서 "HEIC만 가능"이라 안내하는 자기모순** 상태였고, 아이폰 기본 촬영 포맷이라 `.bmp`보다 실트래픽 설명력이 높다. 서버측은 sharp libheif가 Apple HEVC HEIC 디코드 성공이 실증되어 "클라이언트만 열고 서버에서 실패"에 해당하지 않는다.

→ **조치**: `specs-funnel.js` 주석의 근거를 실측 사실(HEIC/HEIF · 반증된 가설 명기)로 교체하고 재배포(`00164-xvf` → **`00165-cp9`**). 코드 동작은 동일하며 재배포 후 게이트 4케이스·콘솔 0건을 재측정했다.
→ **검증 3항에 HEIC 실케이스 추가**(민아 제안 4번) — 빈 MIME `.heic` 게이트 통과 실측 완료.

### 절차 관련 사실 확인

민아 REVIEW가 "출처불명 수정본"으로 지목한 **15:24:55(funnel) · 15:25:10(i18n)** 수정은 **iMac/막내2(본인)의 작업**이며 본 지시서 이행분이다. 당시 세션 로그·COMPLETION이 없던 것은 검증 완료 후 일괄 기록하는 순서였기 때문으로, 본 보고서와 세션 로그로 기록 공백을 해소한다. 막내1 등 타 에이전트의 개입은 없다.

---

## 5. ⏳ 범위 밖 — 판단 요청 3건

미실행. 지시서 범위(진입 게이트 + 계측) 밖이라 보고만 한다.

1. **`.jfif` 폴백 목록 누락** (민아 지적) — Windows 고유 JPEG 확장자인데 `ALLOWED_EXT`에 없다. 지시서가 허용 6종을 명시했기에 임의 추가하지 않았다. 서버 sharp는 JPEG로 처리하므로 추가 시 위험은 없다. → 추가 여부 판단 요청.
2. **HEIC 미리보기 RENDER FAIL** (민아 실측) — 게이트를 통과해도 `v2-check-img`의 `data:application/octet-stream;base64,…` 를 Chromium이 렌더하지 못한다. 흐름은 진행되나 유저는 깨진 썸네일을 보며 진행한다. 진범이 HEIC로 확정된 이상 실사용 노출 확률이 높다. → P0 확대 vs 별건 판단 요청.
3. **업로드 힌트 문구 불일치** — `spec-funnel-markup.js:25`의 하드코딩 `JPG, PNG, HEIC / max 10MB`가 i18n 미경유라 여전히 WEBP를 누락한다. 에러 문구만 정직해지고 안내 문구는 그대로다. → 문구 교체 + i18n 편입 여부 판단 요청.

---

## 6. 🔴 INCIDENT 연계 — dev 검증이 공유 GPU에 부하

[INCIDENT_20260725_monkos-portal_무료매팅_504](../../incidents/2026-07/INCIDENT_20260725_monkos-portal_무료매팅_504.md)가 지목한 **"portal-dev의 kr-passport 동일 사진 반복 주행 + 동시 2건"** 부하는 **본 검증(검증 2항 완주 시도)의 것**이다. portal-dev가 prod와 동일한 `MATTE_API_URLS`를 쓰는 격리 0 구조라, dev 검증이 prod GPU를 잠식했다.

- 실측: `/api/idphoto/generate` 504 2건(각 **120.000s** = Cloud Run 타임아웃), 이후 재시도에서 101.8s로 1회 완주
- `matte.monkos.ai` 직접 확인 시 무응답(8s·15s 타임아웃) — INCIDENT의 "포화≠다운" 판정과 정합
- **조치**: 완주 실증 1건 확보 직후 생성 계열 테스트 **전면 중단**. 이후 검증(주석 교정 후 재검증 포함)은 게이트·계측·문구만 측정하여 GPU 무접촉으로 수행.
- INCIDENT의 dev 분리 권고에 실사용 근거를 1건 보탠다.

---

## 7. 산출물

📁 변경 파일
- `monkos_AI/portal/public/js/specs-funnel.js`
- `monkos_AI/portal/lib/cms/specs-i18n.js`
- `monkos-ops/ops/portfolios/PF_CDP/case_studies.md` (CASE-014·015 신규)
- `monkos-ops/ops/portfolios/PF_CDP/tools/monkcdp.py` (신규)

🚀 배포
- dev `monkos-portal-dev-00164-xvf` → **`monkos-portal-dev-00165-cp9`** (최종)
- prod **미배포** — `monkos-portal-00537-q69` 무변동

---

## 8. 잔여 / 다음

⏳ 검증 5항(GA4 실시간 수신) — 작가님 실브라우저 1회 확인 필요
⏳ 판단 요청 3건 (§5)
🔀 prod 배포 — 별도 승인 대기
