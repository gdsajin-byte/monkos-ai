---
type: design
date: 2026-09-29
device: 4060
agent: 민아
status: 승인 대기
feature: idphoto-kr/jp 촬영 준비 판정 코드화 (Gemini Live 코칭 제거)
related: INCIDENT_20260929_monkos-idphoto-kr_촬영불가_Live모델
---

# DESIGN — 촬영 준비 판정 코드화 (Gemini Live 코칭 제거)

**[2026-09-29 20:15 KST]** 4060/민아 → 작가님

## 0. 한 줄 요약

촬영 화면의 "준비 완료" 판정을 **외부 모델(Gemini Live)에서 클라이언트 코드(MediaPipe 얼굴 검출 + 숫자 비교)로 옮긴다.** 외부 호출 0, 수동 셔터 상시 노출. KR·JP 동일 적용.

> 작가님 결정(2026-09-29 20:07): "뻔한 행동 패턴을 모델에 위탁한 것이 원인. 코드화해서 원천 차단." / 20:08 "바로 코드로 간다. 직접 설계하고 보고해."

## 1. 왜 코드화가 맞는가 (근거)

| 항목 | 현행 (Gemini Live) | 코드화 |
|---|---|---|
| 판정 내용 | 모델이 프레임을 보고 한국어 문장 생성 → 정규식으로 "좋아요/완벽" 검출 | 얼굴 박스·키포인트 숫자 비교 |
| 외부 의존 | 프리뷰 모델 (09월 퇴역 → 촬영 전면 불능) | 없음 (MediaPipe는 이미 클라이언트에 적재) |
| 비용 | 프레임 0.5초마다 Live 세션 과금 | 0 |
| 재현성 | 같은 자세에 다른 판정 | 결정적 |
| 실패 시 | 촬영 자체 불가 (수동 셔터 없음) | 수동 셔터로 항상 촬영 가능 |

**이미 있는 부품**
- `public/monk.js:359~381` — MediaPipe BlazeFace(short-range) 로더. 현재는 촬영 **후** 규격 크롭(`crop()`)에만 사용.
- `portal/server.js:580~626` — 결제 전 precheck 코드 게이트. 얼굴 비율 0.20~0.80, 중심 이탈 15%, roll 8°, yaw 0.15 등 **검증된 임계값**. 클라이언트 게이트는 이 값을 그대로 쓴다.

## 2. 범위

**포함**
- 클라이언트 촬영 준비 게이트 신설 (`public/modules/capture-gate.js`, 순수 함수)
- `camera.js` 코칭 WS·프레임 전송 제거 → 게이트 루프로 교체
- 수동 셔터 버튼 상시 노출 (`camera.html` + `app.css`)
- 서버 Gemini Live 코칭·WebSocket 전부 제거 (`server.js`, `ws` 의존성)
- KR·JP 동일 (문구만 언어별)

**제외 (별건)**
- 촬영 후 사전분석(`/api/idphoto/precheck`, `gemini-2.5-flash`) — 실패 시 catch로 건너뛰는 구조라 이번 사고 유형 아님. 단 모델 의존은 동일 → §8 후속.
- 결제·크레딧·생성 경로 변경 없음.

## 3. 판정 규칙 (capture-gate.js)

입력: 얼굴 검출 결과(박스 + 키포인트 6점: 좌안·우안·코·입·좌귀·우귀), 비디오 원본 크기, 화면 영역 크기, 가이드 사각형.
출력: `{ ready: boolean, reason: string, metrics: {...} }`

가이드 사각형(현행 CSS `#face-guide::before`): 중심 X = 영역 폭/2, 상단 = 영역 높이×0.18, 폭 190px, 높이 250px. `object-fit: cover` 보정: `scale = max(areaW/videoW, areaH/videoH)`, 오프셋 = (영역 − 비디오×scale)/2. 검출 좌표를 이 식으로 화면 px로 변환한 뒤 비교한다.

| 순서 | 조건 | 임계값 | reason | 안내 문구 (KR) |
|---|---|---|---|---|
| 1 | 얼굴 0개 | — | `no_face` | 얼굴이 보이지 않아요 |
| 2 | 두 번째 얼굴 면적 ≥ 첫 얼굴 30% | portal 동일 | `multiple_faces` | 한 분만 화면에 있어야 해요 |
| 3 | 얼굴 높이 / 가이드 높이 < 0.55 | 초기값 | `too_small` | 조금 더 가까이 와주세요 |
| 4 | 얼굴 높이 / 가이드 높이 > 0.95 | 초기값 | `too_close` | 조금 더 멀리 가주세요 |
| 5 | 얼굴 중심 − 가이드 중심 가로 > 가이드 폭×0.20 | 초기값 | `off_center_x` | 얼굴을 가운데로 |
| 6 | 세로 편차 > 가이드 높이×0.20 | 초기값 | `off_center_y` | 얼굴을 타원 안에 맞춰주세요 |
| 7 | roll = atan2(우안−좌안) > 8° | portal 동일 | `head_tilted` | 고개를 똑바로 해주세요 |
| 8 | yaw = (코X − 눈중심X)/눈간격 > 0.15 | portal 동일 | `not_frontal` | 정면을 봐주세요 |
| 9 | 위 전부 통과 | — | `ok` | 좋아요, 그대로 계세요 |

- **안정 조건**: `ok`가 **연속 4프레임**(500ms 간격 = 2초) → 3초 카운트다운 → 촬영. 카운트다운 중 판정은 멈춘다(현행 유지).
- 3·4·5·6 임계값은 "초기값"이다. dev에서 실기기로 5회 이상 촬영해 조정한다 (§7).
- 화면이 좌우 반전(`scaleX(-1)`)이므로 좌/우 문구는 쓰지 않는다 ("가운데로"만).
- 판정 함수는 DOM 없이 순수 계산 → node 단위 테스트 가능.

## 4. 클라이언트 흐름 (camera.js)

```
촬영 시작 버튼
 → media.start() (카메라 + MediaPipe 사전 로드, 현행)
 → 게이트 루프: FRAME_INTERVAL_MS(500ms)마다
      media.detectFace(videoEl) → gate.evaluate(...) → showCoaching(문구, ready)
      ok 연속 4회 → startCountdown() (현행 함수 재사용)
 → 수동 셔터 버튼 [직접 촬영] 상시 표시 → 클릭 시 startCountdown()
 → capturePhoto() → result.html (현행)
```

- `media.detectFace(videoEl)` 신설: monk.js 내부 `mediapipeDetector.detect(videoEl)` 호출(IMAGE 모드는 video 요소를 직접 받는다). 키포인트 포함 반환.
- **MediaPipe 로드 실패**(CDN 차단 등) 시: 게이트 비활성, 문구 "자동 안내를 사용할 수 없어요. 얼굴을 타원에 맞추고 직접 촬영해 주세요", 수동 셔터만 동작. 촬영은 항상 가능.
- 계측: 촬영 시 `gtag('photo_upload', { capture_mode: 'auto'|'manual', gate_reason })` — 수동 비율이 높으면 임계값 재조정 신호.
- `COACHING_DISPLAY_MS`·WS 관련 코드·`shared.js` `coaching: {type:'ws'}` 설정 제거.

## 5. 서버 (server.js)

- 제거: `import { WebSocketServer } from 'ws'`, `COACHING_INSTRUCTIONS`, `connectGeminiLive`, `sessions`, `wss` 블록 전체(KR `:835~` / JP 동일 위치), `package.json`의 `ws`.
- 유지: `ai`(Vertex) 클라이언트 — precheck·생성이 사용.
- 오늘 20:05에 편집한 "모델 교체·재연결 차단" 코드는 **Live 제거로 무의미 → 커밋하지 않고 폐기**. (현재 작업 트리에 미커밋 상태로 남아 있음.)

## 6. 파일 목록

| 파일 | 변경 |
|---|---|
| `monkos_AI/idphoto-kr/public/modules/capture-gate.js` | 신설 (순수 판정) |
| `monkos_AI/idphoto-kr/public/monk.js` | `detectFace()` 추가, MediaPipe CDN **버전 고정**(`@latest` → 명시 버전: 무음 파손 벡터 제거) |
| `monkos_AI/idphoto-kr/public/camera.js` | WS 제거, 게이트 루프, 수동 셔터 |
| `monkos_AI/idphoto-kr/public/camera.html` | `#btn-manual-shot` 추가, 코칭 라벨 "AI 코칭 중" → "자동 안내" |
| `monkos_AI/idphoto-kr/public/app.css` | 수동 셔터 스타일 (`.btn-autoshot-start` 변형) |
| `monkos_AI/idphoto-kr/public/shared.js` · `config.js` | WS 설정·`COACHING_DISPLAY_MS` 정리 |
| `monkos_AI/idphoto-kr/server.js` · `package.json` | Live·WS 제거 |
| `monkos_AI/idphoto-jp/…` 동일 7개 | 일본어 문구 |
| `monkos_AI/idphoto-kr/test/capture-gate.test.mjs` | 신설 — 규칙 9종 × 경계값 |

## 7. 검증

1. **단위**: `node --test` 로 `capture-gate` 규칙별 양성·음성 (DOM 불필요).
2. **dev 배포** (`./deploy.sh dev`, KR 먼저): 작가님 휴대폰 실기기 —
   - 자동 촬영 5회: 가이드에 맞추면 2초 내 카운트다운 시작 / 벗어나면 문구가 바뀌는지
   - 수동 셔터 1회
   - 얼굴 없음·두 명·기울임 각 1회 → 문구 확인
   - 임계값 조정 후 재배포 (예상 1~2회)
3. **prod 배포** (`./deploy.sh prod`, 별도 승인·새 턴): 라이브 검증은 `live-verify.md` — 정적 자산 2회 히트로 `capture-gate.js` 존재·버전 문자열 확인 + Cloud Logging에 `[Gemini Live]` 로그 **0건**(대조군: 배포 전 로그 존재) + 작가님 기기 실촬영 1회.
4. JP: KR prod 확인 후 같은 절차.
5. **고객 후속 메일**: prod 확인 후 ljyonny@gmail.com에 복구 안내 (19:53 회신에서 약속).

## 8. 후속 (별건, 청구 대상)

- 촬영 후 사전분석 `gemini-2.5-flash(-lite)`·생성 `gemini-3-pro-image` — 서비스 코드 하드코딩. ch2 7조(정본 집중)대로 한 곳으로 모으고 `/model-check` 점검 범위에 포함.
- 합성 점검: 매일 촬영 페이지 실제 로드 + `capture-gate.js` 200 + 키 함수 존재 확인 (첫 화면 200만 보는 현행 라이브 점검 보강).
- 결제 페이지 점검 안내: prod 반영 전까지 걸지 여부 — 작가님 결정 (본 세션 20:08 질의, 미결).

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 임계값이 실기기와 안 맞아 자동 촬영이 안 됨 | 수동 셔터가 항상 있어 촬영은 됨. dev에서 조정 |
| 저사양 기기에서 MediaPipe 검출 지연 | 500ms 간격이라 부하 낮음. 실패 시 수동 모드 |
| CDN 차단 환경 | 수동 모드 폴백. 장기적으로 wasm·모델 자체 호스팅 검토 |
| 실행 주체 | 작가님 직접 지시 경로(ch1 2조 ③). 범위: 프로덕션 표면 도달 → `[예외]` 세션로그 + COMPLETION 필수, 쌍아 사후 추인 |
