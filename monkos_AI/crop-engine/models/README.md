# SCRFD / InsightFace 모델 (2026-07-08 도입 1단)

- `*.onnx`는 저장소 전역 gitignore — **정본은 GCS**: `gs://monkos-models/insightface/`
- `deploy.sh`가 미존재 시 자동 인출한다. 수동 인출:
  ```bash
  gsutil cp gs://monkos-models/insightface/det_10g.onnx models/
  gsutil cp gs://monkos-models/insightface/2d106det.onnx models/
  ```

| 파일 | 크기 | 용도 | 상태 |
|------|------|------|------|
| det_10g.onnx | 16.9MB | SCRFD-10GF 얼굴 검출 (bbox+5점 kps) | **활성** — face_detect_scrfd.py |
| 2d106det.onnx | 5.0MB | 106점 랜드마크 (측정 대체 2단용) | 대기 (베이크만) |

- 출처: insightface buffalo_l 번들 (2026-07-08 iMac 비교실측 검증본 — REPORT_20260708_iMac민아_InsightFace비교실측.md)
- 수제 디코드(face_detect_scrfd.py)는 공식 insightface 구현과 3장 교차검증 델타 0.0px (XVAL PASS)
