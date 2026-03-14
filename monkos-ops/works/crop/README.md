# works/crop — 크롭앱

> 증명사진 규격 크롭 서비스. 사용자가 정수리 핀으로 좌표를 정의하고, 서버에서 정밀 크롭.

## 개요

- **서비스**: 증명사진 규격 크롭 (여권 KR/JP, 주민등록증 등)
- **핵심 원리**: FaceMesh 478 랜드마크 → 사용자 정수리 핀 조정 → 서버 크롭
- **언어**: KR + JP (idphoto-kr, idphoto-jp)

## 아키텍처

```
사용자 (모바일/웹)
    │
    ▼
crop.html + crop.js (Vanilla JS)
    │  FaceMesh (CDN @mediapipe/face_mesh)
    │  Canvas 2D — 프레임 오버레이, 드래그 인터랙션
    │
    ▼  POST /api/crop (Base64)
crop-engine (Cloud Run, Node.js 20)
    ├── face-detect.js — @tensorflow-models/face-landmarks-detection
    ├── crop.js — sharp 정밀 크롭 (300dpi 보존)
    └── specs/formats.js — 규격 정의 (passport_kr/jp, id_kr)
    │
    ▼
크롭 사진 (JPEG) + 가이드 캡처
```

## 코드 경로

| 구분 | 경로 |
|------|------|
| KR 프론트 | `monkos_AI/idphoto-kr/public/crop.{html,js,css}` |
| JP 프론트 | `monkos_AI/idphoto-jp/public/crop.{html,js,css}` |
| 백엔드 | `monkos_AI/crop-engine/` |
| 배포 | 각 폴더 `deploy.sh` → Cloud Run |

## 기술 스택

| 레이어 | 스택 |
|--------|------|
| 프론트 | Vanilla HTML+JS, @mediapipe/face_mesh (CDN), Canvas 2D |
| 백엔드 | Node.js 20, TensorFlow.js, sharp v0.33 |
| 배포 | Cloud Run (Dockerfile), asia-northeast3 |

## 핵심 기술 결정

| 항목 | 결정 | 근거 |
|------|------|------|
| 프론트 스택 | Vanilla JS | idphoto-kr/jp 통일, 빌드 불필요 |
| 좌표 결정 | 클라이언트 (사용자 핀) | 사용자 정의 = 책임 소재 명확 |
| 이미지 처리 | sharp (서버) | 정확한 픽셀 추출, 300dpi 메타 보존 |
| 얼굴 감지 | MediaPipe FaceMesh | WebGL/WASM 자동, 브라우저 네이티브 |

## 미해결

- [ ] crop-engine Cloud Run 배포
- [ ] AI 검수 — Gemini Flash 비전 (눈썹/귀/이빨/어깨선/정수리)
- [ ] 데이터 수집 — 동의 시 좌표 데이터 GCS 저장
- [ ] idphoto-kr/jp result 페이지 → crop 진입점 연동

## 출납 로그

| 일시 | 문서 | 비고 |
|------|------|------|
| 2026-03-12 | (세션 로그) 크롭앱 설계 확정 | M1/쌍아 — vanilla JS, FaceMesh, 정수리 핀 |
| 2026-03-14 | README 초안 작성 | 기술명세 초기 적립 |

---

> 최종 갱신: 2026-03-14 iMac/쌍아
