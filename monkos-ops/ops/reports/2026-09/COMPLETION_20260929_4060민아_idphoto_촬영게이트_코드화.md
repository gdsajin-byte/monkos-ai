---
type: completion
date: 2026-09-29
device: 4060
agent: 민아
status: 진행
subject: idphoto-kr/jp 촬영 준비 판정 코드화 (Gemini Live 코칭 제거) + 환불 처리 + 처리 로드맵
related:
  - INCIDENT_20260929_monkos-idphoto-kr_촬영불가_Live모델
  - DESIGN_20260929_idphoto_촬영게이트_코드화
path: 작가님 직접 지시 → 민아 실행 (ch1 2조 ③, 프로덕션 표면 도달 = [예외], 쌍아 사후 추인 대상)
---

# COMPLETION — 촬영 준비 판정 코드화

**[2026-09-29 20:27 KST]** 4060/민아 → 작가님

## 1. 고객 건 처리 (완료)

| 단계 | 시각 (KST) | 결과 |
|---|---|---|
| 환불 요청 메일 수신 | 09-28 18:57 | info@monkos.ai, ₩9,900 결제 후 촬영 불가 |
| 원인 진단 | 09-29 19:46 | Live 코칭 모델 퇴역 → 촬영 전면 불능 (INCIDENT 발행) |
| 토스 전액 취소 | 19:49 | 작가님 대시보드 실행 → 웹훅 수신 → 크레딧 −80c 자동 회수 확인 |
| 고객 회신 | 19:53 | Resend, From `MONKOS <info@monkos.ai>`, HTTP 200, id `01a0eccc-…` |
| 복구 후 안내 | ⏳ | prod 반영 확인 후 발송 (회신에서 약속) |

## 2. 서비스 복구 (구현 완료 · 배포 진행)

**원인 확정**: Vertex AI us-central1에서 `gemini-2.0-flash-live-preview-04-09` **404(퇴역)** 실측(20:04). 촬영은 이 모델의 "준비 완료" 응답에만 의존, 수동 셔터 없음.

**변경 (커밋 `788c993e`)** — KR·JP 동일

| 파일 | 내용 |
|---|---|
| `public/modules/capture-gate.js` | 신설. 순수 판정 함수: 얼굴 없음/복수/크기/위치/roll 8°/yaw 0.15 → reason + 문구. 연속 4프레임 안정 카운터 |
| `public/monk.js` | `detectFace()` 추가(MediaPipe 박스+키포인트), CDN `@latest` → **1.0.1 고정** |
| `public/camera.js` | WebSocket 코칭 제거 → 500ms 게이트 루프. MediaPipe 미적재 시 수동 모드. gtag `capture_mode`·`gate_reason` |
| `public/camera.html` / `app.css` | 수동 셔터 `#btn-manual-shot` 상시 노출, 라벨 "자동 안내". `camera.js?v=gate01` |
| `public/shared.js` | WS 설정 제거 |
| `server.js` | Live 코칭·`COACHING_INSTRUCTIONS`·WebSocket 서버·`ws` import 제거 (KR 922→694행, JP 942→713행) |
| `test/capture-gate.test.mjs` | 신설. 규칙 9종 × 경계값 — **10/10 통과 (KR·JP)** |

**검증 현황**
- ✅ 단위 테스트 10/10 × 2, `node --check` 전 파일
- ✅ MediaPipe 1.0.1 `FaceDetector` 브라우저 실측(createFromOptions·detect 정상)
- ⏳ dev 배포 → 작가님 실기기 검증 (자동 5회·수동 1회·예외 3종)
- ⏳ prod 배포 (별도 승인) → 라이브 검증 → JP
- ❌ 결제 페이지 점검 안내: 별도 배포가 필요해 미적용 — 핫픽스가 먼저 닿는 경로 선택

## 3. 처리 로드맵 — "매번 이런 식"을 끝내기 위한 코드화

> 작가님(19:55): "왜 멀쩡히 잘되던 것들도 조용히 망가지고 아무도 캐치·보고하지 않는가" / (20:00) "매번 이런 식이어야 하나. 로드맵 제시"

오늘 사고의 손작업 7단계: 메일 발견 → 로그 추적 → 원인 진단 → 토스 취소(작가님) → 크레딧 회수 확인 → 회신(Resend 수동 호출) → 복구. 이 중 **5단계는 규칙이 뻔하다.** 아래 순서로 코드화한다.

| # | 항목 | 지금 | 목표 | 주체·경로 | 우선 |
|---|---|---|---|---|---|
| 1 | **기능 합성 점검** | 첫 화면 200만 확인 | 매일 촬영 페이지 로드 + `capture-gate.js` 200 + 매팅 1×1 잡 + 생성 경로 1회. 실패 시 텔레그램 | 쌍아 지시서 → 막내 (health-check 확장) | P0 |
| 2 | **모델 정본 집중 + 점검** | 서비스별 하드코딩 (idphoto-kr/jp 각 3종, studio·portal) | `lib/shared/config.js` MODELS 단일 정본, `/model-check`가 전 서비스 스캔 + Vertex 404 시 🔴 | 쌍아 (ch2 7조 집행) | P0 |
| 3 | **오류 반복 경보** | Live 1008 485회를 INFO로 기록 | 같은 WARNING/ERROR 메시지 N회/10분 → 텔레그램 (Cloud Logging 알림 정책) | 막내 (gcloud alerting) | P1 |
| 4 | **환불 원커맨드** | 토스 대시보드 수동 취소 → 웹훅 → 수동 메일 | `scripts/refund.sh <orderId> "<사유>"`: 토스 취소 API → 웹훅 회수 확인 → 고객 회신 템플릿 발송 → CREDIT_AUDIT_LOG 기록. 실행은 작가님 승인 게이트 유지 | 쌍아 설계 → 막내 | P1 |
| 5 | **고객 메일 P0 즉시 알림** | 브리핑 파일 안에서만 보고 | info@ 수신 중 결제·환불·장애 키워드 → 텔레그램 즉시 | 웹 민아 루틴 수정 | P1 |
| 6 | **점검 도구 생존 확인** | RUNPOD_USAGE.jsonl 8/1 이후 정지, 두 달 미발견 | 원장 파일 N일 미갱신 → 경보 (secret_patrol 패턴 재사용) | 막내 | P2 |
| 7 | **"알려진 문제" 재심 규칙** | matte 530 = "의도적 비가동, 장애 아님" 반복 | 무시 항목에 만료일 부여, 만료 시 재판정 강제 | 웹 민아 브리핑 규율 | P2 |

- 1·2가 오늘 유형(모델 퇴역·기능 무음 파손)을 **직접** 막는다. 4·5는 처리 시간을 시간 단위 → 분 단위로 줄인다.
- 전부 `.claude/`·점검 체계 변경을 포함하므로 **쌍아 소관** — 본 보고서를 청구 근거로 `PETITION` 또는 `ORDER` 발행을 요청한다.

## 4. 이 PC(4060) 환경 변경 (사용자 범위, 아이 계정 무영향)
- `%LOCALAPPDATA%\google-cloud-sdk` (586.0.0) + Norton SSL 검사 우회용 CA 번들 `gcloud-ca\bundle.pem` + `bin\gcloud` 셸 심
- `%LOCALAPPDATA%\node24` (24.21.0 포터블)
- RunPod 엔드포인트 설정 변경(작가님 콘솔): US-NE-1 제외, 24GB 등급 해제 — 별건, 세션 로그 참조

## 5. 후속·의무
- [ ] prod 반영 후 고객 복구 안내 메일 (ljyonny@gmail.com)
- [ ] 쌍아 사후 추인 REVIEW (민아 경로 [예외])
- [ ] `ws` 패키지 의존성 제거 (package.json·lock 동시 — 별도 커밋)
- [ ] 촬영 후 사전분석 `gemini-2.5-flash(-lite)` 모델 정본화 (§3-2에 포함)
