---
type: completion
date: 2026-07-18
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: 크롭 엔진 배치 복원 + 폴백 사다리 정책 정렬 + 데이터 병합

**[2026-07-18 14:17 KST]** iMac/막내2 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260718_iMac쌍아_막내2_크롭엔진_배치복원_통합수선.md`

## 작업 결과

### ✅ Block A: T1 강등 폴백 삭제 (portal/server.js)
- T1 2회 재크롭 실패 시 `T1_GENERATE_FAILED` 명시 에러 + 4개 언어 메시지 반환
- 크레딧 미소모 (fireRefundGate)
- catch 블록도 동일 명시 에러
- `genTrack = 't1-framing-fallback'` 라벨 삭제
- isT1Path에서 `return`으로 레거시 Gemini 재생성 블록 진입 원천 차단

### ✅ Block B: 배치 엔진 복원 (crop-engine/lib/crop.js)
- `EYE_ANCHOR_FALLBACK = 0.45` → 삭제, `eyePositionRatio = frameHmm >= 60 ? 0.42 : 0.43` 인라인
- `HAIR_MARGIN_MM = 2` → `HAIR_MARGIN_RATIO = 0.044`
- `BOTTOM_MIN_RATIO = 0.12` 신설 (턱 마진 가드)
- resolvePlacement(): 눈 앵커 1차 → hairTop 가드(잘릴 때만) → 턱 마진 가드 → 머리 잘림 축소

### ✅ Block C: 게이트 정비 (matte.js + spec-judge.js)
- `cropMetaWithinSpec()`: crown > 10, eye ∉ [40,48] → warn-only (항상 true 반환)
- `judgeMetrics()`: eyeRatio blocked 판정 제거 (face 범위만 blocked)

### ✅ Block D1: FaceMesh 완전 제거
- `lib/face-detect.js` 삭제
- `server.js` import, `initFaceDetector()`, detectBest FaceMesh 폴백 분기 삭제
- 테스트 4파일 삭제 (test-crop, test-cropapp-ui, test-crown-compare, test-landmarks-visual)
- TF/FaceMesh npm 패키지 9개 제거

### ✅ Block D2: 사이드카 안전화
- 무한 재시작 (백오프 상한 30초, `RESTART_MAX_DELAY = 30000`)
- `scrfdRestarts > 3` 시 텔레그램 경보
- ready 시 `scrfdRestarts = 0` 초기화
- `/api/crop-spec` 부트 게이트: `!scrfdReady` → 503 `DETECTOR_NOT_READY`

### ✅ Block D3: 레거시 /api/crop 처분
- `handleCrop()` 삭제
- `/api/crop` 라우트 삭제

### ✅ Block D4: 커버 크롭 제거 (spec-crop.js)
- `fallbackCoverCrop()` 삭제
- 감지 실패 = `{ image: null, cropped: false, engine: 'none', error: 'FACE_NOT_DETECTED' }`
- 텔레그램 경보 유지

### ✅ Block D5: 엔진 토큰 관통
- spec-crop.js: `engine: 'facemesh'` → `'insight'`
- matte.js: `cropEngine: 'facemesh'` → `'insight'`, `engine !== 'facemesh'` → `!== 'insight'`
- server.js: `engine === 'facemesh'` → `=== 'insight'`

### ✅ Block E1: specs-data.json 데이터 병합
- vn-passport, vn-visa: `faceTargetExplicitMm: 42` 복원
- 배경색 14슬러그 수정 (kz/ch/at/dk/gr 여권비자 → 회색, de-passport → 독일규정회색, nz 여권비자 → 회색, jm → 다양)
- onsite 4국 추가 (ph/mx/br/pe-passport)
- warning 12건 이식 (ca/sg/id/ph/ru/fr/de/mx/br/pe/ng)
- digitalOnly 2건 (de/fi-passport)
- bgNote 4건 (fr/gr-passport, gr-visa, jm-passport)

### ✅ Block E2: matte.js BG_COLOR_MAP 변경
- 회색 `#D5D5D5`, 독일규정회색 `#CCCCCC`, 다양 `#FFFFFF` 추가
- DE 매칭이 일반 gray보다 먼저 (정규식 순서 보장)

## 배포

| 서비스 | 리비전 | 상태 |
|--------|--------|------|
| crop-engine | monkos-crop-engine-00023-wt6 | ✅ 100% 트래픽, SCRFD ready |
| portal | monkos-portal-00503-jg6 | ✅ 100% 트래픽 |

## 변경 파일

| 파일 | 변경 |
|------|------|
| crop-engine/lib/crop.js | 배치 로직 눈 앵커 복원 |
| crop-engine/server.js | FaceMesh 제거, 사이드카 안전화, 부트 게이트, /api/crop 삭제 |
| crop-engine/lib/face-detect.js | 삭제 |
| crop-engine/test-*.js (4건) | 삭제 |
| crop-engine/package.json | TF/FaceMesh 의존성 제거 |
| portal/server.js | T1 명시 실패 + 엔진 토큰 |
| portal/lib/matte.js | 게이트 warn-only + BG_COLOR_MAP + 엔진 토큰 |
| portal/lib/spec-judge.js | eye blocked 판정 완화 |
| portal/lib/spec-crop.js | 커버 크롭 삭제 + 엔진 토큰 |
| portal/lib/cms/specs-data.json | 34+ ops 데이터 병합 |

## 비고

- `scripts/tools/kimi.sh`: 기존 uncommitted 변경. 지시서 범위 밖이므로 미포함.
- 민아 검증 시나리오 13종 대기 중.
