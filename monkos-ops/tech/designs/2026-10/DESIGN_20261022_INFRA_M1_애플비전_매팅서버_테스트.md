---
type: design
date: 2026-10-22
device: iMac
agent: 쌍아
status: 초안 — 작가님 확인 대기(M1 가동 전제)
portfolio: PF_INFRA
subject: "애플 비전 PersonSegmentation 매팅을 M1에서 matte-server 계약 그대로 서빙 — 품질·속도·E2E·폴백 4판정 후 호스트 결정"
related:
  - apps/crop-app/benchmark/poc-20260707/apple-vision-poc.swift (07-07 민아 PoC)
  - apps/MonkosCrop/MonkosCrop/CropEngine.swift (IDPASS 엔진)
  - monkos_AI/matte-server/server.py (4060 계약 정본)
  - monkos_AI/portal/lib/matte.js (포털 체인)
---

# M1 애플 비전 매팅 서버 테스트 설계서

**[2026-10-22 19:16 KST]** iMac/쌍아 → 작가님 · 민아

> 출처: 작가님 19:10 (iMac-민아-1022-1703 사람 턴) 발의 "내 아이폰에 깔린 IDPASS가 배경 따고 규격 잡는게 지금 스펙스보다도 빠르고 우수한데 내 폰이 서빙하면 어떨까?" → 민아 19:11 판단(폰 서빙 닫음 / 애플 실리콘 맥 서버 / 손님 폰 온디바이스=IDPASS) → 작가님 19:13 "m1으로 테스트해보고 결정하는게". 민아 전달 19:14(민아 로그 :80).

## 1. 무엇을 바꾸지 않는가

- **계약 불변**: 4060 `matte-server`와 같은 API — `POST /api/matte` `{image: base64, bgColor: "#RRGGBB"}` → `{success, image: base64 JPEG(q95), meta.elapsedSec}`, `GET /health`, 헤더 `X-Matte-Secret`, 포화 시 즉시 503(`Retry-After: 1`). 이러면 **포털 코드 변경 0** — `MATTE_API_URLS` 체인에 URL 하나 끼우는 것으로 끝난다.
- 규격 로직(`countries.jsonl`·크롭)은 건드리지 않는다. 매팅만.
- RunPod 폴백은 그대로 체인 뒤에 남는다.

## 2. 구성

```
[M1 집] vision-matte (Swift 단일 바이너리, HTTP :8000)
          VNGeneratePersonSegmentationRequest(.accurate) + CIBlendWithMask → bgColor 합성 → JPEG
          + cloudflared 터널 (matte-m1.monkos.ai — dev 전용, 시험 기간 한정)
[포털 dev] MATTE_API_URLS = "https://matte-m1…,<RunPod>"  ← dev만, prod 불변
```

- 구현: PoC 스위프트를 HTTP 서버로 감싼다(Swift 표준 + `Network` 프레임워크 또는 경량 서버 라이브러리 1개 — 패키지 설치는 승인 사안이므로 표준 우선). 동시성 상한 `MAX_CONCURRENT` 환경변수(기본 2), 초과 시 503.
- Python 래퍼(FastAPI + pyobjc)도 대안이지만 의존성이 늘어난다 — 표준 Swift 우선, 막히면 보고.

## 3. 판정 (민아 제안 4항 + 통과 기준)

| # | 항목 | 방법 | 통과 기준 |
|---|------|------|----------|
| Q | 품질 | 같은 원본 5장(잔머리·밝은 배경·어두운 옷·안경·아이) — M1 결과 vs RunPod BiRefNet 결과 나란히 | 작가님 육안 판정 "BiRefNet 이상" 4/5 이상(게이트). 수치 보조: **경계 띠(trimap ±8px) 안 알파 SAD/MAE** — IoU는 잔머리를 못 가른다(민아 19:19). BiRefNet은 "정답"이 아니라 "현행" 기준 |
| S | 속도 | 1장 처리(12MP·3MP 각각) p50/p90, 동시 3건 | 3MP p90 ≤ 3s, 동시 3건 무오류(초과분 503) |
| E | E2E | 포털 **dev** `MATTE_API_URLS`만 교체 → 생성 1회 완주 | 결과물 정상·포털 로그에 M1 경로 기록 |
| F | 폴백 | M1 서버 정지 상태에서 dev 생성 1회 | 2.5s 헬스 프리플라이트로 손절 → RunPod로 완주 |

- **0단계(지금 가능)**: Q는 모델이 같으므로 **iMac(Intel)에서 PoC 바이너리로 먼저** 5장 품질 비교를 낼 수 있다. 속도(S)만 M1 몫. M1 가동 전에 품질에서 탈락하면 M1 작업 자체가 불필요.

## 4. 전제·결정 사항 (작가님)

1. **M1 가동**: 10-22 19:15 `ssh m1` 접속 시간 초과(꺼짐·잠자기·네트워크 추정). 테스트 기간 M1을 켜 두고 잠자기 해제 필요.
2. **터널 호스트명**: `matte-m1.monkos.ai` 신설 = DNS·CF 터널 설정(전역 인프라 변경) → 승인 사안.
3. **prod 반영은 이 설계 범위 밖**: 4판정 통과 후 호스트(M1 상주 vs 맥 미니 등) 결정과 함께 별도 설계.

## 5. 단계

| 단계 | 내용 | 주체 |
|------|------|------|
| 0 | iMac에서 PoC로 품질 5장 비교 시트(RunPod BiRefNet과 나란히) | 막내 |
| 1 | vision-matte Swift 서버(계약 준수) + 로컬 계약 테스트(4060 server.py와 같은 요청으로 응답 형식 일치) | 막내 |
| 2 | M1 배치 + 터널(승인 후) + S·E·F 판정 | 막내 + 작가님(M1 가동·터널 승인) |
| 3 | 결과 보고 → 호스트 결정 | 작가님 |
