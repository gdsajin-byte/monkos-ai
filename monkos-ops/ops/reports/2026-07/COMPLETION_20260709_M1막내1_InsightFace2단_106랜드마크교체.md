---
type: completion
date: 2026-07-09
device: M1
agent: 막내1
status: 완료
portfolio: PF_SPECS
---

# COMPLETION: InsightFace 2단 — 106점 랜드마크로 FaceMesh 교체

**[2026-07-09 03:28 KST]** M1/막내1 → 작가님

## 요약

crop-engine의 측량(landmarks) 엔진을 FaceMesh(478점, 비결정론) → InsightFace 2d106det(106점, 결정론)으로 교체. portal fit에서 Gemini 비전 ③블록 퇴출.

## 실측 결과

### 교차검증 (Task 5-1/5-2)
- 수제 디코드 vs 공식 insightface: **delta 0.00px** (3장 전부)
- 지시서 코드와 공식의 정렬 방식 차이 발견 → 교차검증으로 보정 적용
  - 정렬: bbox 중심 기반 스케일 (5점 kps ARCFACE_DST 아님)
  - 전처리: mean=0.0, std=1.0 (모델 내부 자체 정규화)
- 106점 인덱스 실측 확정 (지시서 추정과 실제 차이):
  - 좌안: 33-42 (지시서 52-57), 우안: 87-96 (지시서 58-63)
  - 코끝: 86 (지시서 49), 입: 52-71, 코: 72-86

### fit 안정성 (Task 5-3)
- 동일 이미지 5회 호출 → **frame/lines/gate 완전 동일 (진폭 0px)**
- 3장 각 3회 추가 검증 → 전부 동일
- InsightFace 경로 5회 모두 사용 확인 (FaceMesh 폴백 없음)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/crop-engine/face_detect_scrfd.py` | 2d106det 모델 로딩 + `predict_landmarks()` + `POST /landmarks` 엔드포인트 + health에 lmk 상태 |
| `monkos_AI/crop-engine/lib/face-detect-insight.js` | **신규** — 106점→anatomy 변환기 (실측 확정 인덱스, gate 수치 포함) |
| `monkos_AI/crop-engine/server.js` | handleFitSpec: InsightFace 우선 + FaceMesh 폴백. insightToAnatomy import |
| `monkos_AI/portal/server.js` | ③ Gemini 비전 블록 제거 (~60행 → `let vision = null;`) |

## 미변경 (지시서 준수)

- `face-detect.js`, `initFaceDetector()` 유지 (FaceMesh 폴백)
- 클라이언트 측 FaceMesh 무변경
- `Dockerfile` 무변경 (models/ 폴더 COPY 이미 존재)
- `deploy.sh` 무변경 (2d106det.onnx 인출 이미 존재)

## 배포

- crop-engine: `./deploy.sh production` 대기 (작가님 승인 후)
- portal: Gemini 비전 퇴출 포함, 별도 배포 필요
