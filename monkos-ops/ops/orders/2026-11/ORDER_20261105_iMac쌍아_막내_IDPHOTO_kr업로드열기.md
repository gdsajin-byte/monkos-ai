---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/쌍아-막내(배정 시 번호 기입)
subject: idphoto-kr 사진 올리기 열기 — 촬영 강제 해제(갤러리 업로드 → 기존 분석실 흐름 합류). 결제·생성 과금 불변. dev 배포까지, prod는 2번 지시서(결제 후 생성)와 함께
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — idphoto-kr 사진 올리기 열기 (kr 재정비 1/4)

**[2026-11-05 15:41 KST]** iMac/쌍아 → iMac/쌍아-막내

출처: 작가님 2026-11-05 iMac/쌍아 세션 사람 턴 — 15:16 "로그인 없이도 가능하고 업로드도 가능하지 실시간 촬영 강제는 발급보장 서비스등이고", 15:32 무료 생성 폐지, 15:33 "1컷 결제시 다른 컷으로 활용가능한 크래딧 제공", 15:41 "a"(결제 1건 = 결과 3개 중 선택). 방향 정본: 메모리 `project_idphoto_kr_direct_pay_pivot`.

## 0. 전체 그림 (이 지시서는 1번만)

1. **업로드 열기 ← 이 지시서**
2. 무료 생성 차단 + 결제 후 생성(결과 3개 중 선택) + 장당 직접 결제 + 다른 컷 크레딧 지급 — 한 배포 단위
3. crop 자동 설정(포털 `/api/idphoto/fit`) + 수동 핀, 결제 앞 확인
4. 첫 화면 정리(Cr·"첫 로그인" 문구 제거) + 갤러리 모션그래픽

> ⚠️ 현재 생성은 비로그인 무료·상한 없음(`server.js:485` `[FREE-GEN]`). 업로드를 prod에 먼저 열면 무료 생성 노출이 커진다. **그래서 이 지시서는 dev 배포까지만.** prod는 2번과 묶어 작가님 '배포 승인'으로.

## 1. 현행 (쌍아 실측 15:41)

- 동선: `options.js` → `prep.html`(설정, `prep.js:556 navigateTo('camera.html')`) → `camera.html`(촬영) → `result.html`(분석·생성).
- 촬영 결과 전달: `camera.js:218 saveSessionData('captured', dataURL)` → `result.js:122 loadSessionData('captured')`. 키 = sessionStorage `monkos_captured`.
- 촬영 이미지 규격: `monk.js:344` 긴 변 `maxSize = 720`, `monk.js:345` JPEG `captureQuality = 0.8`, 거울상 처리 있음(`monk.js:432`).
- 서버 입력 상한: `server.js` `/api/idgen` 2MB.
- 파일 업로드 입력: `crop.html`에만 있음. 주 동선에는 없음.

## 2. 할 일

1. **prep 화면에 "사진 올리기" 버튼 추가** — 기존 "촬영 시작"(`.prep-start`) 옆 또는 아래, 같은 위계. 문구 예: "갤러리에서 사진 올리기". 설정 저장(`saveSelections()`)은 촬영과 동일하게 먼저 수행.
2. **업로드 처리(클라이언트)** — `<input type="file" accept="image/*">`(카메라 강제 `capture` 속성 넣지 않음) →
   - EXIF 회전 반영(`createImageBitmap(file, {imageOrientation:'from-image'})` 우선, 미지원 시 폴백) →
   - 촬영과 **같은 규격**으로 정규화: 긴 변 720, JPEG 0.8. 거울상은 하지 않는다(업로드는 원본 방향이 정답).
   - HEIC 등 디코딩 실패 → 명시 안내("이 형식은 열 수 없습니다 — JPG/PNG로 올려 주세요") + 재선택. 무음 실패 금지.
   - `saveSessionData('captured', dataURL)` → `navigateTo('result.html')`. 분석실 이후는 **손대지 않는다**.
3. **GA4**: 기존 `photo_upload` 이벤트를 업로드에서도 발화, `capture_mode: 'upload'`로 구분(촬영은 기존 값 유지). 측정 ID 변경 금지. 이벤트 설계 주관은 민아(ORDER_20261105_iMac쌍아_민아_IDPHOTO_GA4계측강화_idphotokr.md) — 이 1항목만 넣고 나머지는 민아 몫.
4. **카메라 화면에서도 진입 가능하게**(선택) — 카메라 권한 거부·실패 시 "사진 올리기"로 우회 버튼. 권한 거부가 막다른 길이 되지 않게.

## 3. 하지 않는 것

- 결제·크레딧·`/api/idgen`·`/api/download` 로직 변경 금지(2번 지시서 소관).
- 실시간 촬영 경로 제거 금지 — 그대로 둔다(발급보장 티어 재배치는 이후).
- prod 배포 금지.

## 4. 판정 기준

- dev(`./deploy.sh dev`)에서 모바일 실기기 또는 CDP 아이폰 에뮬레이션으로: 업로드 → 분석실 진입 → 사전 판정 결과 표시까지 3장(세로 JPG · 가로 JPG(EXIF 회전) · PNG) 통과, HEIC 1장은 명시 안내 표시.
- 업로드 이미지가 분석실에서 돌아가거나 거울상이 아님(캡처 대조).
- 촬영 경로 회귀 없음(1회 촬영 → 분석실).
- GA4 `photo_upload` `capture_mode=upload` 수신 — 실데이터(run_report 또는 DebugView)로 확인. collect 204만으로 판정 금지.
- 라이브 판정 방법(2회 히트·대조군) 기재 — `.claude/rules/live-verify.md`.

## 5. 준수

- 헌법 2조 3항: 계획 제시 → (이 지시서가 승인 범위) → 실행.
- 헌법 4조 2항: 파괴적 명령 금지. `deploy.sh` 경유(ch5), dev만.
- ch2 7조: 상수 분산 금지 — 720·0.8은 `monk.js` 값을 참조(사본 숫자 금지).
- 헌법 3조: 세션 로그 · COMPLETION · PF_IDPHOTO 1행.

## 6. 반환

COMPLETION(변경 파일·dev rev·판정 표·캡처 경로) + 작업 브랜치 원격 SHA. 병합은 쌍아.
