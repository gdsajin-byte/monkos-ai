---
type: proposal
id: PROPOSAL_20261102_iMac민아_IDPHOTO_미국비자_입력포맷_판정메시지
date: 2026-11-02 16:40 KST
status: in_progress
from: 민아
to: 쌍아
subject: "미국 비자 규격 — 입력 사진의 포맷(해상도·파일형식·용량)이 부족할 때 판정하고 메시지로 알려주는 체계"
priority: P2
pf_ref: PF_IDPHOTO
portfolio: PF_IDPHOTO
tags: [specs, us-visa, 입력검증, i18n, 무료트랙]
---

# PROPOSAL — 미국 비자 입력 사진 포맷 부족 판정·메시지 체계

**[2026-11-02 16:40 KST]** iMac/민아 → iMac/쌍아 (작가님 참조)

> **출처**: 작가님 사람 입력 턴 2026-11-02 16:36 (iMac-민아-1102-1252) "미국비자사진 규격이 사진의 포멧이 부족했을때 메시지를 표시하는 시스템을 제안해". 본 문서는 제안이며 실행·배포를 포함하지 않는다. 설계·지시서는 쌍아 소관(ch1 2조 ③).

## 0. 결론 1줄

규격 숫자를 데이터에 박고(600~1200px·JPEG·240KB), 업로드 직후와 얼굴 판정 직후 **두 번** 포맷을 재서, 부족하면 "무엇이 얼마나 부족한지 + 무엇을 올리면 되는지"를 기존 `rej_*` 메시지 체계와 같은 자리에 띄운다. 산출물도 제출용 JPEG로 맞춘다.

## 1. 현황 (실측 2026-11-02, 경로:행)

| 항목 | 현재 | 근거 |
|---|---|---|
| 업로드 형식·용량 | JPG/PNG/WEBP, 10MB 상한만 검사. HEIC 거부 | `portal/public/js/specs-funnel.js:496,519-526` |
| 해상도(px)·비율 검사 | **없음** (클라이언트·서버 모두) | `specs-funnel.js:440`(저장용 축소만) · `portal/server.js:73-92` normalizeImage(`withoutEnlargement`) |
| 얼굴 기준 품질 판정 | 있음 — `no_face`·`face_too_small`(faceRatio<0.20) 등 16종, HTTP 200 `{measurable, rejectionReason}` | `server.js:608-682` · 문구 `lib/cms/specs-i18n.js:226-241`(ko) · 표시 `specs-funnel.js:559` |
| 미국 비자 규격 데이터 | **문자열만**: `pixels:"600 × 600px"`, `fileSpec:"JPEG format, max 240KB, 600x600px min to 1200x1200px max, 24-bit color, sRGB"`, `headHeightMin/Max: 25/35` | `lib/cms/specs-data.json:3796` us-visa |
| 출력 | 프레임 px는 `pixels` 파싱으로 600×600 적용. **포맷은 PNG, 용량 제한 미적용** | `lib/spec-crop.js:20-23` · `lib/matte.js:382-404` · `crop-engine/lib/crop.js:155-159` · 다운로드 `specs-funnel.js:846` `_free.png` |
| 입력이 작을 때 | 경고·거부 없이 **그대로 확대**(matte.js `sx=frameW/fw` 상한 없음, crop.js는 패딩) | `lib/matte.js:377-383` · `crop-engine/lib/crop.js:149-151` |

요약: 지금은 "작은 사진"이 들어와도 아무 말 없이 600px로 늘려서 내보내고, 내보낸 파일은 PNG라 CEAC(DS-160 사진 업로드)의 JPEG 요건에 맞지 않는다. 메시지 체계(`rej_*`)는 이미 있으므로 **포맷 축을 그 체계에 한 줄기 더 붙이는 일**이다.

## 2. 제안 체계 (3층)

### 2-1. 규격 숫자화 — 데이터 층
`specs-data.json` 각 규격에 숫자 키 `fileRules`를 추가한다. 문자열 `fileSpec`은 표시용으로 유지.
```json
"fileRules": { "minPx": 600, "maxPx": 1200, "aspect": "1:1", "format": "jpeg", "maxKB": 240, "color": "sRGB24" }
```
- 1차는 us-visa 1건만 채운다. 키가 없는 규격은 게이트가 **통과(무판정)** — 기존 동작 불변.
- 판정·출력 코드는 이 키만 읽는다. `fileSpec` 문자열 파싱 금지(현 `parsePixels`처럼 정규식 의존을 늘리지 않는다).

### 2-2. 2단 판정 — 엔진 층
| 단계 | 시점 | 재는 것 | 비용 |
|---|---|---|---|
| **1단 즉시** (클라이언트) | 파일 선택 직후, 서버 전송 전 | `naturalWidth/Height`. 짧은 변 < `minPx`면 그 자리에서 차단. HEIC·용량은 기존 검사 유지 | 0 (이미 Image 디코드함) |
| **2단 정밀** (서버 precheck 확장) | 얼굴 검출 직후 | 얼굴 박스로 **규격 크롭 영역을 원본 px로 추정** → `upscale = minPx / cropSide_src`. 1.0 이하 통과 / 구간별 경고·차단(§4 결정 1) | precheck 응답에 필드 추가뿐 |

- 2단이 필요한 이유: 4,000px 사진이라도 얼굴이 작으면 잘라낸 결과는 600px 미만이다. 포맷 부족은 **원본이 아니라 크롭 결과** 기준으로 재야 맞다.
- precheck 응답 확장: `format: { inputPx:[w,h], cropPxEst, upscale, verdict:'ok'|'warn'|'block', reason }`. HTTP 200·`measurable` 체계 그대로, `rejectionReason`에 새 코드 `low_res`를 추가하고 `verdict:'warn'`은 `measurable:true`로 둔다(진행 가능).
- 크롭 영역 추정 상수는 `spec-crop.js`/crop-engine의 실제 크롭 계산을 재사용하고, 추정 오차는 실사진 20장으로 보정한다(막내 실증 항목).

### 2-3. 메시지·출력 — 표면 층
- 메시지는 기존 `T['rej_'+reason] || T.rejDefault`(`specs-funnel.js:559`) 경로에 그대로 태운다. 새 키 `rej_low_res`(차단)·`warn_low_res`(경고)·`note_output_jpeg`(결과 화면 안내). 4언어(ko/ja/en/es) 동시 등재.
- 숫자 치환 지원(`{px}`,`{min}`): 사용자에게 "얼마나" 부족한지를 보여야 재촬영 판단이 선다.
- 경고 단계는 **[그대로 진행] / [다른 사진 올리기]** 두 버튼. 차단 단계는 [다른 사진 올리기]만.
- 결과 화면: us-visa는 **제출용 JPEG(600×600, ≤240KB, sRGB) 다운로드**를 기본으로, PNG는 "인화용"으로 병기. 240KB는 품질 90→70 단계 압축으로 맞춘다(600px면 항상 가능).
- 계측: 기존 `trackReject(reason)`(`specs-funnel.js:505`)에 `low_res_block`·`low_res_warn` + 파라미터 `px`를 추가. 2주 뒤 적중률로 임계 재조정(§4 결정 1의 근거 데이터).

## 3. 메시지 문안 초안 (ko — ja/en/es는 지시서 단계에서 번역)

| 키 | 문안 |
|---|---|
| `rej_low_res` | 사진 해상도가 부족해요. 미국 비자는 얼굴 부분만 잘라도 600×600px 이상이어야 하는데, 이 사진은 약 {px}px밖에 안 돼요. 카톡·문자로 받은 사진이나 스크린샷은 압축되어 있어요. 휴대폰 갤러리의 **원본 사진**을 올려주세요. |
| `warn_low_res` | 해상도가 넉넉하지 않아요(약 {px}px → 600px로 확대). 제출은 가능하지만 선명도가 떨어질 수 있어요. 더 선명하게 하려면 원본 사진을 올려주세요. |
| `errFileType` 보강 | 아이폰 사진(HEIC)은 아직 받을 수 없어요. 설정 › 카메라 › 포맷 › '높은 호환성'으로 바꾸고 다시 찍거나, 사진을 JPG로 저장해 올려주세요. |
| `note_output_jpeg` | 디지털 제출용 JPEG(600×600px, 240KB 이하)로 저장했어요. DS-160 사진 업로드에 그대로 쓰시면 돼요. 인화용은 PNG를 받으세요. |

어조는 기존 `rej_*`("~해요. ~해주세요")에 맞춘다. 고객 호칭은 쓰지 않는다(고객 대면 표현은 ch8 5조).

## 4. 결정 항목 (닫힌 대안)

1. **업스케일 임계** — A) 1.0 초과 즉시 차단(규격 엄격) / **B) 1.0~1.5 경고 후 선택 진행, 1.5 초과 차단 (추천)** / C) 경고만, 차단 없음
   - B 추천 이유: CEAC는 픽셀 수만 보므로 소폭 확대는 제출이 되고, 메신저 압축본이 많은 KR 사용자를 전부 막으면 무료 트랙 이탈이 커진다. 1.5배 초과는 눈에 띄게 뭉개져 "보장"에 못 미친다.
2. **1차 적용 범위** — **A) us-visa 1건 (추천, 1건 반영→실사용 확인→확장)** / B) 숫자 규격 있는 전 규격(us-passport·ca 등) 동시
3. **제출용 JPEG** — **A) 결과 화면에 JPEG 다운로드를 기본으로 추가 (추천)** / B) PNG 유지, 안내 문구만
4. **노출 위치** — **A) 업로드 직후(클라이언트) + 얼굴 판정 직후(서버) 2단 (추천)** / B) 서버 1단만

## 5. 적용 순서 (작은 단위)

1. `fileRules` 키 us-visa 1건 + 2단 정밀 판정 + `rej_low_res` 4언어 → dev 실측(실사진: 원본·카톡 전송본·스크린샷 각 5장)
2. 1단 즉시 판정 + `warn_low_res` 버튼 2개 + 계측
3. 제출용 JPEG 출력 + `note_output_jpeg`
4. 2주 계측 후 임계 확정 → 다음 규격으로 확장

각 단계가 독립 커밋·독립 배포(롤백 단위=커밋 단위).

## 6. 대비 칸

- 메신저 압축본 비율이 예상보다 높으면 차단이 이탈로 직결된다 → B안 + 계측으로 2주 뒤 임계를 다시 잰다. 처음부터 엄격(A)으로 가지 않는다.
- 공식 규격 페이지(travel.state.gov digital-image-requirements)는 이번 턴 봇 차단(Cloudflare 확인 화면)으로 미열람. 위 숫자는 `specs-data.json` us-visa(`officialSource`=travel.state.gov) 기준이며, 지시서 발행 전 쌍아 또는 막내가 **브라우저로 1회 실열람**해 600~1200px·240KB·JPEG·sRGB 4항을 대조한다.

## 7. 범위·권한

- 본 건은 제안서이며 코드 변경 없음. 실행은 쌍아 지시서 → 막내(경로 ①/③).
- 프로덕션 표면 도달·i18n 4언어 일괄 변경이므로 ch1 2조 5항 기준 **민아 직접 실행 범위 초과** — 쌍아 설계 경유가 맞다.

## 8. 결정 기록

**[2026-11-02 16:42 KST]** 작가님 사람 입력 턴(iMac-민아-1102-1252) 원문: "추천안으로 전달". → §4 결정 4건 모두 추천안 채택: ① 1.0~1.5배 경고 후 선택 진행·초과 차단 ② us-visa 1건 먼저 ③ 제출용 JPEG 결과 화면 기본 추가 ④ 클라이언트+서버 2단. 같은 시각 iMac/민아가 iMac/쌍아 세션(monk-project-d8)에 세션 간 메시지로 설계 요청 전달. 배포 승인은 포함하지 않는다.
