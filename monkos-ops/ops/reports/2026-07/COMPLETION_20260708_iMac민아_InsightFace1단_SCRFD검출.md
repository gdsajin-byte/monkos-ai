---
type: completion
date: 2026-07-08
device: iMac
agent: 민아
status: 마감
---

# COMPLETION: InsightFace 도입 1단 — SCRFD 검출 교체 (풀 구현)

**[2026-07-08 18:47 KST]** iMac/민아 → 작가님, M1/쌍아(검토)

> 근거: 작가님 직접 지시 "자 풀로 작업해봐" (18:24, 경로③) + 쌍아 위임 (18:23)
> 설계 기반: REPORT_20260708_iMac민아_InsightFace비교실측.md + DESIGN_20260708_엔진완결_좌표계일원화.md
> ⚠️ 준수: ch5 (deploy.sh 경유) · 헌법 1조 3항 (측정 정확성 = 정체성 보존 기반) · 최소 엔진 원칙 (18:22 작가님)

## 변경 내역

| 파일 | 변경 | 요지 |
|------|------|------|
| `crop-engine/face_detect_scrfd.py` | 신규 | SCRFD(det_10g) 수제 디코드 사이드카 — stdlib HTTP, onnxruntime CPU. **공식 insightface와 3장 교차검증 델타 0.0px (XVAL PASS)** |
| `crop-engine/models/` | 신규 | det_10g.onnx(16.9MB 활성)+2d106det.onnx(5MB 2단 대비). `*.onnx` gitignore 정책 → **정본 GCS `gs://monkos-models/insightface/`**, README로 문서화 |
| `crop-engine/server.js` | 수정 | 사이드카 스폰(FaceMesh와 병렬 기동, 3회 재시도, 실패 시 기존 경로 무영향) + `POST /api/detect` + health에 scrfd 상태 |
| `crop-engine/Dockerfile` | 수정 | python3-venv + 프리빌트 휠 3종 (컴파일 없음) + 모델 베이크 |
| `crop-engine/deploy.sh` | 수정 | 모델 미존재 시 GCS 자동 인출 가드 (새 클론 재현성) |
| `portal/server.js` fit | 수정 | 검출 1순위 = crop-engine SCRFD (정규화 프레임 절대픽셀) → **Gemini faceBox는 폴백으로 강등**. `FACE_DETECT_ENGINE=legacy` 원복 플래그. `detect=` 로그 계측. 다인 검출 로그 |

## 배포

- crop-engine **00008** (18:38, deploy.sh) — health `scrfd:ready`, 라이브 detect 좌표 = 로컬 실측과 동일 (카우치 [636,404,944,835] 0.878)
- portal **00432** (18:42, deploy.sh prod) — 트래픽 100%. 막내1 normalize(00431분) + 쌍아 핫패치(1Gi·동시성20·FIT_SANITY 클라) 동반 탑재

## E2E 검증 (프로덕션, faceBox 미전달 = 순수 SCRFD 경로)

| 사진 | eyeY 델타 (vs InsightFace 기준) | chinY 델타 | 판정 | detect |
|------|------|------|------|--------|
| **카우치 (금일 3연쇄 사고 원본)** | -3.7px (-1.4%) | -4.7px (-1.8%) | **PASS** — face 33mm·eye 43.0% | scrfd |
| 밤 전신 (EXIF=6·얼굴 17%) | -4.8px (-2.4%) | -7.1px (-3.6%) | PASS — 42.6% | scrfd |
| 정장 남성 (회귀 기준) | -1.3px (-0.7%) | -6.3px (-3.3%) | PASS — 43.1% | scrfd |

→ **금일 오배치 계열(Gemini 박스 → 엉뚱한 창 → 랜드마크 표류)이 프로덕션에서 소멸.** 이제 창 산정이 검출기 실측 기반.

## 안전장치

- 사이드카 죽어도 crop-engine 본체·FaceMesh 경로 무영향 (`/api/detect`만 503) → portal이 legacy 폴백 + WARNING 로그
- 원복: portal env `FACE_DETECT_ENGINE=legacy` 한 줄
- 관측: `[Fit] … detect=scrfd|legacy|none` 로그로 경로 분포 추적 가능

## 잔여 (다음 단계 — 쌍아 설계 v2 소관)

1. **2단**: 표본 확대 비교(GCS 아카이브) → 턱 보정 상수 → 측정도 InsightFace 수렴, FaceMesh 서버 은퇴
2. **게이트 전진 배치**: SCRFD 수치(비중·각도·다인) 기반 사전 게이트 + 코치 문구 (17:31 제안)
3. **3단**: `/verify` 동일인 게이트 (ArcFace)
4. 설계 검토 잔여: HEIC 명시 처리, 출고 게이트, 재처리 트랙별 정의
5. 관측 항목: crop-engine 1Gi에서 tfjs+onnx 동거 메모리 (금일 3건 정상, 부하 시 확인)

## 크레딧·비용

- 본 작업 크레딧 소모 0 (fit까지만 검증, generate 미실행). 기존 환불 감사 대상 20c 별건 유지.
- 신규 비용: 없음 (CPU 사이드카, RunPod·Gemini 무관). detect 건당 ~0.1s CPU.
