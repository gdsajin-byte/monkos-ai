---
type: report
date: 2026-07-09
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 3D 얼굴 복원 경량 모델 조사 보고서

**[2026-07-09 18:17 KST]** iMac/막내2 → 작가님

---

## 1. 후보 비교 테이블 (Task 1)

| 모델 | ONNX 존재 | 크기 | 추론 (CPU) | 정수리 추출 | 메시 범위 | 라이센스 |
|------|----------|------|-----------|-----------|----------|---------|
| **3DDFA_V2** | **O** (공식 지원) | ~7MB (backbone) | **1.35ms/face** | **✗** — BFM=얼굴만 | 얼굴 (38K vertices) | MIT |
| **3DDFA_V3** (CVPR 2024) | 미확인 | ~10MB+ | ~5ms (추정) | **✗** — BFM 기반 | 얼굴 (35K vertices) | MIT |
| **SynergyNet** | 미공식 (변환 가능) | ~15MB | **0.3ms/face** (GPU) | **✗** — BFM 기반 | 얼굴 | MIT |
| **PRNet** | 미공식 | ~10MB | ~10ms (GPU) | **✗** — UV맵=얼굴만 | 얼굴 | MIT |
| **DECA** (FLAME 사용) | **✗** (PyTorch만) | ~150MB+ | ~50ms (GPU) | **△** — FLAME 두개골 포함 | **전체 두상** (5K vertices) | **비상용** (MPI) |
| **FLAME** (모델 자체) | 파라미터만 | ~40MB (파라미터) | — (회귀기 필요) | **O** — 두개골 정점 포함 | **전체 두상** | **비상용** (MPI) |
| **MediaPipe FaceMesh** | O (TFLite) | **~2MB** | **~5ms** | **✗** — 이마 위 미커버 | 얼굴 표면 (478점) | Apache 2.0 |

### 입출력 사양 상세

| 모델 | 입력 | 출력 |
|------|------|------|
| 3DDFA_V2 | 120×120 RGB | 62개 3DMM 파라미터 → BFM 메시 38,365점 (x,y,z) |
| SynergyNet | 120×120 RGB | 3DMM 파라미터 + 68 3D 랜드마크 |
| PRNet | 256×256 RGB | 256×256 UV position map → 43,867점 |
| DECA | 224×224 RGB | FLAME 파라미터 (shape 100D + expression 50D + pose 6D) → 5,023점 메시 |
| MediaPipe | 가변 | 478점 (x,y,z) 직접 출력 |

---

## 2. 정수리 추출 가능한 모델이 있는가 (Task 2)

### 결론: **현 시점 경량 ONNX로는 불가. FLAME 계열만 가능하나 비상용 + 무거움.**

### 모델별 메시 커버리지 상세

**BFM 기반 (3DDFA, SynergyNet, PRNet):**
- Basel Face Model은 **얼굴 전면부만** 모델링 — 이마 상단(hairline)에서 종료
- 정수리(vertex), 두개골 상부, 측두부, 후두부 없음
- 메시 최상단 점 = 이마/헤어라인 근방 ≈ trichion이지 vertex가 아님

**FLAME 기반 (DECA, EMOCA 등):**
- FLAME은 **전체 두상(cranium)** 을 5,023개 정점으로 모델링
- 두개골 상단(crown/vertex) 정점이 존재 → **정수리 좌표 추출 이론적으로 가능**
- 단, FLAME은 **"헤어 없는 두개골"** 만 모델링 — 헤어볼륨은 별도 처리 필요
- FLAME 라이센스는 **비상용(MPI IS)** — 상업 제품 편입 불가 (별도 라이센스 협상 필요)

**MediaPipe 478점:**
- 468점 얼굴 표면 + 10점 홍채 = 478점
- **이마 위, 정수리, 두개골 상부 포인트 없음**
- 이마 영역의 커버리지도 희소 (hairline~eyebrow 사이에 몇 점만)
- 2023년 Face Landmarker 업데이트에서도 두개골 상부 포인트 미추가

### 정수리 정의와 모델별 의미

| 의미 | BFM 계열 | FLAME | MediaPipe |
|------|---------|-------|-----------|
| 해부학적 vertex (두개골 최상단) | ✗ 커버리지 밖 | **O** (메시 상단 정점) | ✗ |
| 메시 수학적 최상단 | 이마/trichion 근방 | 두개골 상단 (vertex 근사) | 이마 중상부 |
| 헤어라인 위 이마 | O (최상단 ~ trichion) | O | 부분적 (희소) |

---

## 3. 증명사진 이외 활용 가능성 (Task 3)

3D 얼굴 복원이 제공할 수 있는 능력과 MONKOS 서비스 연계:

| 능력 | 제공 모델 | MONKOS 활용 | 우선순위 |
|------|----------|-------------|---------|
| **정수리 좌표** | FLAME만 | 크롭 앵커 정밀화 (1:1 미러 대체) | ★★★ |
| **3D 포즈 (pitch/yaw/roll)** | 전 모델 | 6DRepNet 대체/보강 | ★★ (이미 해결됨) |
| **얼굴 형태 파라미터** | 3DMM 전 모델 | 규격 적합성 예측 (좁은 얼굴 vs 넓은 얼굴) | ★★ |
| **표정 파라미터** | FLAME/3DDFA | 입 벌림/눈 감김 게이트 (현행 mouthOpen/eyeOpen 대체) | ★★ |
| **텍스처 맵** | DECA/3DDFA | 가상 피팅, 합성, AI 프로필 | ★★★ (장기) |
| **depth map** | 전 모델 | AR 증강, 조명 보정, 리라이팅 | ★ (장기) |
| **아바타 생성** | FLAME/DECA | 3D 아바타, 가상 증명사진 | ★ (미래) |

### 복합 활용 시나리오

1. **증명사진 원스톱**: 3D 복원 → 정수리 추정 + 포즈 + 표정 + depth → 단일 모델로 precheck 전 게이트 대체
2. **AI 프로필**: 3D 메시 + 텍스처 → 조명/배경/각도 자유 변환 → 가상 촬영
3. **가상 피팅**: 얼굴 3D + 체형 3D → 의류/안경/악세서리 피팅

---

## 4. 권고

### 단기 (현행 유지 + 개선)

**"현 시점 경량 ONNX로 정수리를 직접 추출할 수 있는 모델은 없다."**

- BFM 기반 모델(3DDFA, SynergyNet)은 경량이지만 얼굴만 커버 → 정수리 없음
- FLAME은 정수리 커버하지만 비상용 라이센스 + 경량 ONNX 부재
- 현행 **1:1 미러 + HAIR_VOLUME_RATIO 8% + 6DRepNet pitch 보정** 조합이 현실적 최선

### 중기 PoC 권고 (선택지 2개)

**Option A — 3DDFA_V2 활용 (이마 상단 → 정수리 추정 개선)**
- 3DDFA_V2 ONNX (~7MB, 1.35ms CPU) 편입
- 메시 최상단 점(이마/trichion) 좌표 취득 → 현행 1:1 미러보다 정밀한 anchor
- 정수리는 여전히 추정이지만, "이마 끝 → 정수리"의 추정 구간이 "눈 → 정수리"보다 짧음 → 오차 축소
- **라이센스 OK (MIT)**
- 추가 비용: ONNX 7MB + 1.35ms/face

**Option B — FLAME 라이센스 협상 후 DECA 경량화**
- FLAME은 유일한 정수리 제공 모델이지만 비상용
- MPI IS와 상용 라이센스 협상 필요 (비용 불확실)
- DECA encoder를 MobileNet으로 교체하면 ~15MB까지 경량화 가능 (연구 수준)
- 높은 투자 대비 높은 리턴 (정수리 직접 + 3D 포즈 + 표정 + 텍스처 올인원)

### 장기 전망

- **VGGHeads (2024)**: 대규모 합성 데이터 기반 3D 헤드 모델. 아직 경량 ONNX 없으나 주시 대상
- **Apple Vision Pro / ARKit**: 디바이스 내장 3D 스캔이 보편화되면 외부 모델 불필요
- **오픈소스 FLAME 대안**: 학술계에서 상용 라이센스 대안(SMPL-X 계열 등) 등장 가능성

---

## 출처

1. cleardusk/3DDFA_V2 — [GitHub](https://github.com/cleardusk/3DDFA_V2) (ECCV 2020)
2. wang-zidu/3DDFA-V3 — [GitHub](https://github.com/wang-zidu/3DDFA-V3) (CVPR 2024)
3. choyingw/SynergyNet — [GitHub](https://github.com/choyingw/SynergyNet) (3DV 2021)
4. YadiraF/PRNet — Position Map Regression Network (ECCV 2018)
5. TimoBolkart/FLAME — [Official](https://flame.is.tue.mpg.de/) (SIGGRAPH Asia 2017)
6. YadiraF/DECA — [GitHub](https://github.com/yfeng95/DECA) (SIGGRAPH 2021)
7. Google MediaPipe Face Landmarker — [AI Edge](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
8. Basel Face Model — [Faces](https://faces.dmi.unibas.ch/bfm/)
9. PINTO0309/PINTO_model_zoo — [GitHub](https://github.com/PINTO0309/PINTO_model_zoo)
10. QOVES "Facial Thirds" — [qoves.com](https://www.qoves.com/insights/measurements/facial-thirds)
