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
⏳ 판단 요청 3건 (§5) → **작가님 전량 승인, §10에서 처리**
🔀 prod 배포 — 별도 승인 대기

---
---

# §10. 승인 반영 3건 + 재검증 — **prod 배포 중단**

**[2026-07-25 16:45 KST]** iMac/막내2 → 작가님·iMac/쌍아

> 지시서 §10(16:27 KST) 이행분. dev `monkos-portal-dev-00166-sp7`.

## 10-A. 요약

✅ 10-1 `.jfif` 폴백 추가 — 게이트 통과 실측
✅ 10-3 업로드 힌트 i18n 이관 + 6언어 문구 일치 — 두 표면 동일 목록
⚠️ 10-2 HEIC 미리보기 — **구현했으나 검증 실패**. 서버가 HEIC를 **디코드하지 못한다**
🔴 **§10-2의 전제 "`normalizeImage()`가 이미 변환 중"이 배포 환경에서 성립하지 않음** — 지시서 근거 반증
🛑 **10-5 prod 배포 중단** — 10-4 #3 불합격. "1~6항 전량 합격 시" 조건 미충족

## 10-B. 구현

| # | 파일 | 내용 |
|---|------|------|
| 10-1 | `specs-funnel.js` | `ALLOWED_EXT`에 `'jfif'` 1항목 추가. 로직 변경 없음 |
| 10-2 | `server.js` precheck | `body.wantPreview`일 때만 `norm.buf` → 512px·q80 JPEG 썸네일 1장 생성 → `out.preview` (data URL). **다른 포맷의 응답 크기·지연 무변경** |
| 10-2 | `spec-funnel-markup.js` | 미리보기 자리에 스피너 `#v2-preview-loading` 신설 (기존 `.v2-checklist-loading`·`.v2-spinner` 재사용, 신규 CSS 0) |
| 10-2 | `specs-funnel.js` | `isUnrenderable()` 판정 → HEIC/HEIF만 원본 미표시·스피너 표시·`wantPreview:true` 전송 → 응답 썸네일로 교체. **썸네일 부재 시 명시 실패 후 업로드 복귀**(무음 진행 금지). 성공·else·catch 3경로 전부 스피너 해제 |
| 10-2 | `specs-funnel.js` | 결제 복귀 복원 경로 `onerror` 가드 — 복원본이 렌더 불가여도 깨진 아이콘 대신 자리를 비운다 |
| 10-3 | `specs-i18n.js` | `uploadHint` 6언어 신설(하드코딩 영문 고정 → 사전 이관). 값은 `errFileType`과 동일 목록 |
| 10-3 | `spec-funnel-markup.js` | `JPG, PNG, HEIC / max 10MB` → `${eh(v2.uploadHint || …)}` (키 누락 대비 폴백) |

## 10-C. 재검증 결과

| # | 항목 | 결과 | 실측 |
|---|------|------|------|
| 1 | 회귀 — 콘솔 에러 | ✅ | 교체본 계측기로 전 케이스 **0건** |
| 2 | `.jfif` 통과 | ✅ | 빈 MIME + `.jfif` → 게이트 통과, 에러 없음 (생성 미수행) |
| 3 | **HEIC 미리보기** | ❌ **불합격** | 스피너까지는 정상, **precheck가 썸네일을 못 만들어** 명시 실패로 종료 |
| 4 | 기존 포맷 무영향 | ✅ | JPG 드롭 0.4초 시점에 이미 렌더(`naturalWidth=989`), 스피너 미노출 = 서버 왕복 없음 |
| 5 | 힌트·에러 문구 일치 | ✅ | 6언어 두 표면 모두 `JPG · PNG · WEBP · HEIC` |
| 6 | `upload_rejected` 발화 | ✅ | **16:39:10~16:39:21 KST** `.bmp` 1건 (`spec_type:kr-passport, lang:ko, reject_reason:type, file_mime:(empty), file_ext:bmp`) — GA4 대조는 쌍아. 지시대로 CDP 네트워크 스크랩 미시도 |
| 7 | 생성 완주 | ⏭️ **미수행** | #3 불합격으로 prod 배포가 막혀 실익이 없고, INCIDENT 부하 회피가 우선이라 생략 |

## 10-D. 🔴 §10-2 전제 반증 — 서버는 HEIC를 디코드하지 못한다

지시서 §10-2는 `normalizeImage()`가 HEIC를 libheif로 JPEG 변환 중이므로 **"서버 변환 로직 신설 금지, 기존 산출물 노출로 처리"**라 지시했다. 배포 환경 실측 결과 **그 변환은 일어나지 않는다.**

**dev 서버 로그 (rev 00166-sp7, 실 Apple HEIC `ftypheic`/HEVC 업로드)**
```
WARNING [normalizeImage] sharp 실패 (… heif: Error while loading plugin:
        Support for this compression format has not been built in …)
INFO    [IDPhoto][precheck] 미리보기 썸네일 생성 실패 (동일 원인)
INFO    [IDPhoto][precheck] 코드게이트 측정성=true faces=null …
```

**라이브러리 실측** — 로컬·컨테이너 동일 sharp 0.34.5 / libvips 8.17.3 / libheif 1.20.2

```
sharp.format.heif.input.fileSuffix = [".avif"]     ← .heic 없음
```

prebuilt sharp는 **HEVC 특허 문제로 HEVC 코딩 HEIC 디코드를 포함하지 않는다.** libheif 버전 문자열(1.20.2)은 존재하지만 HEVC 디코더 플러그인이 빌드되어 있지 않다. 로컬 Mac에서 같은 파일을 sharp로 디코드해도 **동일하게 실패**한다(`bad seek`). 즉 "libheif 1.20.2 → Apple HEVC HEIC 디코드 성공"이라는 REVIEW 근거는 **본 코드베이스의 sharp에는 해당하지 않는다.**

### 파생 — 미리보기보다 큰 문제

`normalizeImage()`는 실패 시 **원본 HEIC 버퍼로 조용히 폴백**한다. 그 결과 현행 prod에서 HEIC 업로드는:

1. 게이트 통과(`image/heic` MIME을 주는 Safari·macOS 경로는 **개편 전에도 통과**)
2. `normalizeImage` 실패 → 원본 HEIC 그대로
3. crop-engine 얼굴 검출도 HEIC를 못 읽음 → **`측정성=true faces=null`로 fail-open**
4. 유저는 깨진 썸네일을 보며 "규격 적합" 취급으로 **유료 생성까지 진행**

→ **"유료 실패 = 강등 무음 출고 금지"에 정면으로 걸리는 경로**이며, 이번 게이트 개편(빈 MIME 통과)은 Windows·HEIC 유입까지 이 경로에 얹는다.

현재 dev(00166-sp7)는 썸네일 부재를 명시 실패로 처리하므로 **무음 진행은 막혀 있다**(문구는 `검수 실패`로 다소 모호). prod보다 안전한 상태다.

## 10-E. ⏳ 판단 요청 — HEIC 처리 방침 (택1)

미실행. 어느 쪽도 지시서 §10 범위를 넘어 임의 결정하지 않는다.

| 안 | 내용 | 공수 | 리스크 |
|----|------|------|--------|
| **A. 잠정 제외 (권고)** | `ALLOWED_EXT`·MIME 정규식·문구에서 HEIC/HEIF 제거 + "아이폰은 설정 > 카메라 > 포맷 > **호환성 우선**" 안내 | 소 | 아이폰 원본 업로드 차단. 단 **지금도 사실상 처리 불가**라 손실은 명목상 |
| **B. 서버 디코더 도입** | 컨테이너에 HEVC 디코더 확보(libde265 포함 libvips 재빌드 또는 `heic-convert` 등 별도 디코더) | 중~대 | 이미지 빌드·라이선스 검토 필요. 성공 시 §10-2가 의도대로 완결 |
| **C. 클라이언트 변환** | WASM 디코더로 브라우저에서 JPEG 변환 후 전송 | 중 | 신규 의존성·번들 증가. 저사양 단말 부담 |

**권고: A로 즉시 정직화 → B를 별건 착수.** 근거는 ① 문구가 "HEIC 가능"이라 광고하는데 서버가 못 읽는 현 상태가 가장 나쁜 조합이고 ② A는 배열·문구 수정만이라 오늘 안에 안전하게 닫히며 ③ B는 이미지 빌드 변경이라 검증 사이클이 별도로 필요하기 때문이다.

## 10-F. 배포 상태

- dev **`monkos-portal-dev-00166-sp7`** (§10 구현 반영)
- prod **미배포** — `monkos-portal-00537-q69` 무변동. 10-5 조건(1~6항 전량 합격) 미충족으로 **중단**
- 롤백 불요 — prod 무접촉

## 10-G. 잔여

⏳ HEIC 처리 방침 결정 (10-E) → 결정 후 재검증·prod 배포
⏳ 검증 5·6항 GA4 대조 (쌍아, 발화 16:39:10~21 KST)
⏭️ 생성 완주 1회 — prod 배포 직전으로 이연

---
---

# §11. HEIC 잠정 제외(A안) + 디코드 실패 fail-open 차단

**[2026-07-25 18:52 KST]** iMac/막내2 → 작가님·iMac/쌍아

> 지시서 §11(18:30 KST) 이행분. dev **`monkos-portal-dev-00169-qf4`**. 검증 7항 **전량 합격**.

## 11-A. 요약

✅ **HEIC 두 경로 모두 차단** — 확장자 목록 + **MIME 정규식** 양쪽에서 제외. macOS(`image/heic`)·Windows(빈 MIME) 실측 거부
✅ **디코드 실패 무음 폴백 차단** — `normalizeImage()`가 `degraded`를 실어 보내고, precheck·fit·**generate** 세 곳에서 명시 반려
✅ 문구 6언어 정합 + 아이폰 안내 + `errDecode` 신설(서버 ko 고정 문자열의 다국어 노출 차단)
✅ 생성 완주 1회 — 무회귀 확인(200, 8~11초, `생성 완료`)
🔀 **prod 미배포** — §11 마감 조항대로 별도 승인 대기

## 11-B. 구현

### 11-1. HEIC 제외 (A안)

| # | 위치 | 조치 |
|---|------|------|
| 1 | `specs-funnel.js` `ALLOWED_EXT` | `heic`·`heif` 제거 → `['jpg','jpeg','jfif','png','webp']` |
| 2 | `specs-funnel.js` MIME 정규식 | `/image\/(jpeg\|png\|webp)/i` — **`heic\|heif` 제거** (이게 빠지면 macOS가 그대로 열린다) |
| 3 | `specs-i18n.js` `errFileType` 6언어 | 허용 목록 JPG·PNG·WEBP + **아이폰 안내** + BMP 안내 |
| 4 | `specs-i18n.js` `uploadHint` 6언어 | 동일 목록으로 정합 |
| 5 | `specs-funnel.js`·`server.js`·`spec-funnel-markup.js` | §10-2 HEIC 미리보기 배선(스피너·`wantPreview`·썸네일 생성) **철거**. 서버 디코더 도입 시 복구 지점을 주석으로 남김 |

**아이폰 안내 문구** — 지시대로 **데스크톱 유저**(아이폰 사진을 PC로 옮겨 올리는 경로)를 대상으로 썼다.
ko: `아이폰 사진(HEIC)·BMP는 JPG로 저장한 뒤 올려주세요. 아이폰은 설정 > 카메라 > 포맷 > "높은 호환성"으로 바꾸면 JPG로 촬영됩니다.`
ja `「互換性優先」` · en `"Most Compatible"` · es `"Más compatible"` · id `"Paling Kompatibel"` · vi `"Tương thích nhất"` — 각 언어 iOS 실제 표기를 따랐다.

### 11-2. 디코드 실패 무음 폴백 차단 (P1, 포맷 무관 구조 결함)

| # | 위치 | 조치 |
|---|------|------|
| 1 | `server.js` `normalizeImage()` | 폴백 시 **`degraded: true` + `decodeError`** 반환. 로그도 "원본 폴백" → "디코드 실패 → degraded 반환" |
| 2 | 동상 | **크기 판정 제거** — `catch` 안의 `sharp(raw).metadata()`(헤더만 읽어 HEIC에서도 600x800을 돌려주던 함수)를 걷어내고 `width/height: 0` 고정. 판정 기준이 헤더가 아니라 **디코드 성공 여부**가 됐다 |
| 3 | `server.js` precheck | `norm.degraded` → **400 `DECODE_FAILED`**. fail-open 경로 소멸 |
| 4 | `server.js` fit | 동일 가드 — 디코드 실패 이미지로 프레임 계산 금지 |
| 5 | `server.js` generate | 동일 가드 + **`fireRefundGate()` 선발화** — 선차감된 무료 쿼터·크레딧을 환급한 뒤 반려한다. 과금만 되고 산출물이 없는 경로를 남기지 않는다 ([[feedback_paid_failure_no_degraded_delivery]]) |
| 6 | `specs-funnel.js` | `DECODE_FAILED` → `T.errDecode` 현지화 분기. 서버의 ko 고정 문자열이 6언어 유저에게 그대로 노출되던 문제 차단 |

> ⚠️ **범위 보정 자인**: 4·5(fit·generate 가드)는 §11-2가 명시한 precheck 밖이다. 「디코드 실패 선행 시 fail-open 금지」를 precheck에만 적용하면 유저가 직접 fit/generate로 진입하는 경로가 남고, 특히 generate는 유료 경로라 방치할 수 없다고 판단해 포함했다. 두 곳 모두 **가드 추가일 뿐 기존 생성 로직은 무접촉**이며, 생성 완주 1회로 무회귀를 실측했다.

## 11-C. 검증 결과 (dev `00169-qf4`)

| # | 항목 | 결과 | 실측 |
|---|------|------|------|
| 1 | **macOS `.heic`** | ✅ | `file.type=image/heic` → 거부 + 새 문구 + `upload_rejected{image/heic, heic}` |
| 2 | **Windows `.heic`** | ✅ | 빈 MIME → 거부 + `upload_rejected{(empty), heic}` |
| 3 | 정상 포맷 무영향 | ✅ | jpg·**jfif**·png·webp **4종 전부 통과**, 미리보기 즉시 렌더(`naturalWidth=989`), 스피너 미노출 |
| 4 | **디코드 실패 명시화** | ✅ | 손상 JPEG(게이트 통과·픽셀 불가) → precheck **400 `DECODE_FAILED`** → `이미지를 읽을 수 없습니다…` 노출 후 업로드 복귀. **fail-open 0** |
| 5 | 문구 6언어 | ✅ | 6/6 힌트·에러 동일 목록(`JPG · PNG · WEBP`) + 아이폰 안내 + `errDecode` |
| 6 | `upload_rejected` | ✅ | **18:44~18:46 KST 2건** (#1 `image/heic` / #2 `(empty)`) — GA4 대조는 쌍아 |
| 7 | 회귀 — 콘솔 | ✅ | 전 케이스 **JS 에러·예외 0건** |
| + | 생성 완주 1회 | ✅ | `/api/idphoto/generate` 200 (8.1s·11.3s), `[IDPhoto] 생성 완료 트랙=birefnet` |

**서버 로그 실증 (#4)**
```
WARNING [normalizeImage] sharp 디코드 실패 (Input buffer has corrupt header …) → degraded 반환
INFO    [IDPhoto][precheck] 디코드 실패로 명시 반려 (…)
HTTP    400 /api/idphoto/precheck
```

### 측정 관련 자기 보정 2건

1. **#3 첫 판정식이 과엄격했다** — `phase == ['v2-phase-check']`만 합격으로 봤는데, precheck 통과가 빠른 케이스(jfif·webp)는 스냅샷 시점에 이미 `v2-phase-fit`로 진행해 있었다. 진행이 더 된 것을 실패로 읽은 것이라 판정식을 `check 또는 fit + naturalWidth>0`으로 고쳐 재판정했다. **4종 전부 통과가 실측 사실**이다.
2. **#7의 유일한 콘솔 항목은 #4의 의도된 400 network 로그 1건** — JS 예외·`console.error`가 아니라 브라우저가 4xx 응답에 남기는 기록이며, 명시 실패를 HTTP 상태로 표현하는 한 불가피하다(400 반환은 개편 전부터의 규약). "신규 JS 에러 0"과 구분해 기재한다.

### 부하 관련 자인

생성 완주 테스트는 **1회 실행**했으나, 퍼널이 `generate`를 **2번 호출**했다. 원인은 제 검증 스크립트가 fit 응답 확정 전에 버튼을 클릭한 것으로, §10에서 이미 식별한 하네스 아티팩트다(제품 결함 아님 — 단일 클릭 추적 시 요청 1회 확인 완료). 쌍아의 매팅 줄 세우기(`3aae130f`) 덕에 두 건 모두 `포화(503) → 노크 1회 → 줄서기 성공`으로 흡수돼 504 없이 완주했다.

## 11-D. 배포 상태

- dev **`monkos-portal-dev-00169-qf4`**
- prod **미배포** — `monkos-portal-00537-q69` 무변동. §11 마감 조항 "prod 배포는 검증 후 별도 승인"
- ⚠️ **prod는 지금 macOS HEIC 경로가 열려 있다** — 검증 전량 합격이므로 승인만 주시면 즉시 배포 가능

## 11-E. 잔여

⏳ **prod 배포 승인** (우선순위 높음 — 현행 prod에 fail-open 경로 존재)
⏳ 검증 #6 GA4 대조 (쌍아, 발화 18:44~18:46 KST)
⏭️ B(서버 디코더)·C(클라 WASM) — 지시대로 미착수. HEIC 유입 규모는 `upload_rejected`의 `file_ext=heic` 계측으로 관측 후 재판단
⚠️ **미검증 유지**: 유료 경로에서 깨진 이미지가 크레딧을 소모하는지는 여전히 미확인. 다만 §11-2로 **디코드 실패 시 환급 게이트를 선발화**시켰으므로 이 경로의 과금-무산출 조합은 구조적으로 닫혔다

---

## 11-F. prod 배포 완료 — 사후 검증 (2026-07-25 19:20 KST)

**배포 경위**: 승인 직후 워킹트리에서 **18:55에 생긴 미커밋 변경 2건**(막내3, `server.js` 전달 판정·환급 + `deploy.sh` 환경변수)을 발견해 **선탑승 방지를 위해 배포를 중단하고 보고**했다. `deploy.sh`에는 미커밋 경고 게이트가 없어(07-16 검토 요청 후 미구현) 그대로 실릴 상황이었다. 작가님 지시로 **막내3이 두 커밋을 함께 배포**(`3cc9b5f7` §11 + `10a4e140` INCIDENT P1·P2) → **`monkos-portal-00539-bmt`**, 트래픽 100%.

| # | 항목 | 결과 | 실측 |
|---|------|------|------|
| 1 | §11 코드 라이브 | ✅ | `ALLOWED_EXT=['jpg','jpeg','jfif','png','webp']` · `/image\/(jpeg\|png\|webp)/i` · `errDecode` 분기 · `wantPreview` 소멸 |
| 2 | macOS `.heic` | ✅ | `file.type=image/heic` → 거부 + 새 문구 + `upload_rejected{image/heic, heic}` |
| 3 | Windows `.heic` | ✅ | 빈 MIME → 거부 + `upload_rejected{(empty), heic}` |
| 4 | 정상 포맷 무영향 | ✅ | jpg·jfif 통과, 미리보기 즉시 렌더(`naturalWidth=989`) |
| 5 | 문구 6언어 | ✅ | 힌트·에러 두 표면 동일 목록 + 아이폰 안내 |
| 6 | 콘솔 회귀 | ✅ | 전 케이스 JS 에러 0건 |
| 7 | 트래픽 | ✅ | `00539-bmt` 100% (`00377-feh`는 `v4-preview` 태그, 트래픽 0) |

- prod 사후 검증은 **게이트·문구만** 측정했다. 생성 완주·손상파일(서버 호출) 테스트는 dev에서 이미 합격했고 prod GPU·쿼터를 건드리지 않기 위해 생략.
- 롤백 불요.

### 앞선 보고 정정

§10-D·§11-D에서 "prod가 HEIC에 열려 있다"고 기재했으나, 그 근거는 prod=`00537-q69`였다. 실측 결과 **18:08에 `00538-lc5`로 §10 코드가 이미 배포**되어 있었고, 그 상태에서는 HEIC가 게이트를 통과해도 **썸네일 부재로 명시 실패 처리**되어 진행이 막혀 있었다(문구만 모호). 즉 배포 시점의 prod는 **fail-open이 아니었다.** §11의 필요성(정직한 문구·구조적 fail-open 봉합·환급 게이트)은 그대로이나 **긴급도는 보고보다 낮았다.**

## 11-G. 최종 상태

- prod **`monkos-portal-00539-bmt`** — §11 라이브, 검증 7/7
- dev `monkos-portal-dev-00169-qf4`
- ⏳ 잔여: GA4 대조(쌍아, `upload_rejected` 발화 18:44~18:46 · 19:19 KST) / B·C안(서버 디코더·클라 WASM)은 `file_ext=heic` 계측 관측 후 재판단
