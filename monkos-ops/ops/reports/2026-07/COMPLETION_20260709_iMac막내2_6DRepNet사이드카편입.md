---
type: completion
date: 2026-07-09
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: 6DRepNet 사이드카 편입 + precheck pitch·yaw 정밀화

**[2026-07-09 13:26 KST]** iMac/막내2 → 작가님

## 지시서

`ORDER_20260709_iMac쌍아_막내_6DRepNet사이드카편입.md`

## 결과 요약

✅ Task 1 — ONNX 모델 배치: `crop-engine/models/6drepnet_mobilenetv3s.onnx` (5.8MB)
✅ Task 2 — 사이드카 `/headpose` 엔드포인트: predict_headpose() + 라우팅 + health 갱신
✅ Task 3 — portal precheck 6DRepNet 호출: pitch 게이트(±20°) 신설, yaw 게이트 ratio→도(°) 전환(15°), 5점 kps 폴백
✅ Task 4 — 클라이언트 거부 문구: `chin_too_low`, `chin_too_high` 추가
✅ Task 5 — fit-spec 응답에 pose 필드 추가 (landmarks + headpose 병렬 호출)

## 검증

| 항목 | 결과 |
|------|------|
| Python 모듈 로딩 (3모델 동시) | ✅ SCRFD + LMK + Pose 정상 |
| 정면 사진 headpose 추론 | ✅ pitch=-6.5° yaw=1.7° roll=1.4° |
| Node.js 구문 검증 (3파일) | ✅ crop-engine/server.js, portal/server.js, render-specs.js |

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/crop-engine/models/6drepnet_mobilenetv3s.onnx` | 신규 (5.8MB) |
| `monkos_AI/crop-engine/face_detect_scrfd.py` | predict_headpose() + `/headpose` 엔드포인트 + health 갱신 |
| `monkos_AI/crop-engine/server.js` | handleHeadpose() 프록시 + `/api/headpose` 라우트 + fit-spec pose 필드 |
| `monkos_AI/portal/server.js` | precheck 6DRepNet 호출 + pitch 게이트 + 로그 갱신 |
| `monkos_AI/portal/lib/cms/render-specs.js` | chin_too_low / chin_too_high 거부 문구 |

## 배포

⏳ **미실행** — 작가님 승인 후 배포 예정
- 순서: crop-engine 먼저 → portal (폴백 있으므로 역전 시에도 장애 없음)
