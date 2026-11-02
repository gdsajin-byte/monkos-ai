---
type: order
date: 2026-11-02
from: iMac/쌍아
to: iMac/막내
subject: 미국 비자(us-visa) 입력 해상도 판정 1단계 — fileRules 숫자화 + 서버 precheck 크롭 해상도 추정 + low_res 메시지 4언어, dev 검증까지
status: 폐기(대체 — ORDER_20261102_iMac쌍아_막내_IDPHOTO_미국비자_화각부족판정.md, 작가님 16:59 화각 재정의·미투입)
portfolio: PF_IDPHOTO
---

# ORDER — 미국 비자 입력 해상도 판정 1단계

**[2026-11-02 16:44 KST]** iMac/쌍아 → iMac/막내

출처: 작가님 2026-11-02 16:36 iMac 민아 세션 사람 턴 "미국비자사진 규격이 사진의 포멧이 부족했을때 메시지를 표시하는 시스템을 제안해" → 민아 제안서 → 작가님 16:42 "추천안으로 전달"(결정 4건 추천안 채택). 민아 16:42 세션 간 메시지로 쌍아에 설계 요청 전달(전달이며 승인 아님). **본 지시서의 막내 투입은 작가님 승인 후.**
설계 근거: [PROPOSAL_20261102_iMac민아_IDPHOTO_미국비자_입력포맷_판정메시지.md](../../proposals/PROPOSAL_20261102_iMac민아_IDPHOTO_미국비자_입력포맷_판정메시지.md) — §1 현황(경로:행), §2 3층 설계, §3 문안, §8 결정 기록. **먼저 전문을 읽는다.**

## 1. 배경

- 지금은 작은 사진이 들어와도 경고 없이 600px로 확대해 내보낸다(`lib/matte.js:377-383`, `crop-engine/lib/crop.js:149-151`). 해상도 검사는 클라이언트·서버 어디에도 없다.
- 공식 규격 실열람 대조 완료 — travel.state.gov [Digital Image Requirements](https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos/digital-image-requirements.html) (2026-11-02 16:43 쌍아 CDP 9222 열람, 원문):
  - "Minimum acceptable dimensions are 600 x 600 pixels. Maximum acceptable dimensions are 1200 x 1200 pixels." (정사각)
  - "The image must be in color (24 bits per pixel) in sRGB color space"
  - "The image must be in JPEG file format"
  - "The image must be less than or equal to 240 kB (kilobytes)."
  → 제안서 수치 4항 일치.
- 채택 결정(§8): ① 업스케일 1.0~1.5배 경고 후 선택 진행, 1.5 초과 차단 ② us-visa 1건 먼저 ③ 제출용 JPEG 기본 추가 ④ 클라이언트+서버 2단.

## 2. 이번 범위 = 제안서 §5의 1단계만

작은 단위로 간다. 2단계(클라이언트 즉시 판정·경고 버튼 2개·계측)와 3단계(제출용 JPEG 출력)는 이 건 실사용 확인 후 별도 지시서.

1. **데이터**: `lib/cms/specs-data.json` us-visa에 `fileRules` 추가 — `{"minPx":600,"maxPx":1200,"aspect":"1:1","format":"jpeg","maxKB":240,"color":"sRGB24"}`. 다른 규격은 건드리지 않는다. 키가 없는 규격은 판정 없이 통과(기존 동작 불변).
2. **서버 precheck 확장** (`server.js:608-682` 일대):
   - 얼굴 검출 직후, 규격 크롭 영역의 **원본 px 한 변**을 추정한다. 추정은 실제 크롭 계산(`lib/spec-crop.js` / `lib/matte.js`의 fit 경로)과 **같은 식을 공유**한다 — 복붙 상수 금지, 공용 함수로 뽑거나 기존 함수를 호출.
   - `upscale = minPx / cropSidePx`. `≤1.0` ok / `1.0~1.5` warn / `>1.5` block.
   - 응답에 `format: { inputPx:[w,h], cropPxEst, upscale, verdict, reason }` 추가. block이면 `measurable:false, rejectionReason:'low_res'`. warn은 `measurable:true` 유지 + `format.verdict:'warn'`(이번 단계는 표시만, 버튼은 2단계).
   - `fileRules`는 숫자 키만 읽는다. `fileSpec` 문자열 파싱 금지.
3. **메시지**: `lib/cms/specs-i18n.js`에 `rej_low_res`·`warn_low_res` 4언어(ko/ja/en/es). ko 문안은 제안서 §3 그대로, `{px}` 치환. 치환은 `specs-funnel.js:559` 표시부에서 `data.format.cropPxEst`로. warn은 기존 체크리스트 요약 자리에 경고색 1줄(진행 버튼 유지).
4. **테스트**: 단위 테스트(upscale 경계 0.99/1.0/1.5/1.51, fileRules 없는 규격 무판정) + 포털 전체 테스트 통과.
5. **dev 실측**: portal-dev에 `deploy.sh dev`로 배포. 실사진 3종 × 각 3장 이상 — 원본 / 메신저 전송본 / 스크린샷. 고객 사진 금지(본인·팀 사진 또는 공개 테스트 사진). 각 장의 `inputPx·cropPxEst·upscale·verdict`와 화면 캡처를 COMPLETION에 표로. **추정 오차**: 같은 사진의 실제 크롭 px(매팅 로그 또는 산출물)와 `cropPxEst` 차이를 함께 기록.

## 3. 산출물·쓰기 범위

- 코드: `monkos_AI/portal/` 안 — `server.js`, `lib/cms/specs-data.json`(us-visa 1건), `lib/cms/specs-i18n.js`, `public/js/specs-funnel.js`, 크롭 계산 공용화가 필요하면 `lib/spec-crop.js`. 테스트 파일 신설 가능.
- COMPLETION: `monkos-ops/ops/reports/2026-11/COMPLETION_20261102_iMac쌍아-막내N_IDPHOTO_미국비자_입력해상도판정_1단계.md` — diff 요약, dev 리비전, 실측 표, 추정 오차, prod 판정표(엣지 재배포 필요 여부 포함).
- 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-02_iMac_쌍아-막내N.md`, PF_IDPHOTO 히스토리 1행(`scripts/pf.sh append`).
- **작업 브랜치**에서 커밋·푸시. main 병합은 쌍아.

## 4. ⚠️ 준수 조항

- **prod 배포·엣지 배포 금지.** specs-data·i18n 변경은 엣지 재배포 대상이다(references §배포). prod와 엣지는 작가님 '배포 승인' 후 쌍아가 함께 집행한다 — COMPLETION에 필요한 배포 목록만 적는다.
- `lib/matte.js`의 매팅 체인·`crop-engine/` 동작 변경 금지(크롭 식을 읽어 공유하는 것만 허용). 출력 포맷(PNG→JPEG)은 3단계 — 이번에 손대지 않는다.
- 헌법 1조 3항 — 판정은 해상도만. 얼굴 보정·재생성 경로 추가 금지.
- 법률 ch8 5조 — 문안에 없는 기능·근거 없는 수치 금지. 고객 대면 문안에 내부 호칭·엔진명 금지.
- 헌법 4조 1항 — 키·토큰 생성·추측·출력 금지. 패키지 설치 금지.
- 헌법 3조 1·2항 — `date` 실측 헤더, 세션 로그 append-only, 완료 보고 `✅❌💡⏳📁🔀` + 원격 SHA 대조.

## 5. 완료 기준

- [ ] us-visa `fileRules` 1건, 타 규격 무변경(diff로 확인)
- [ ] precheck `format` 필드 + `low_res` block/warn, 크롭 식 공유(상수 복제 0)
- [ ] 4언어 문안 + `{px}` 치환 표시
- [ ] 단위 테스트 경계 4건 + 포털 전체 통과
- [ ] dev 실측 표(3종×3장↑) + 추정 오차
- [ ] 작업 브랜치 푸시 + 원격 SHA 대조 + COMPLETION

## 6. 커밋 메시지

```
[feat] 미국 비자 입력 해상도 판정 1단계 — fileRules·precheck 크롭 해상도·low_res 4언어 (PF_IDPHOTO)
```
