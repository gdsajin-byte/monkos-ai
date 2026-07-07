---
type: order
id: ORDER_20260707_M1쌍아_막내_FaceMesh_vs_dlib_비교실측
date: 2026-07-07 19:28 KST
from: M1/쌍아
to: M1/막내
portfolio: PF_CROP
priority: P1
status: 대기
---

# 지시서: 얼굴 랜드마크 모델 비교 실측 — FaceMesh vs dlib vs 최신 모델

> **[2026-07-07 19:28 KST] M1/쌍아 → M1/막내**
> 귀속: PF_CROP

---

## 배경

FaceMesh(MediaPipe)가 웹 업로드 이미지에서 턱·눈 좌표를 반복 오판(사일런트 미스). 셀카 전용 설계의 한계. 얼굴 인증·본인확인 등에서 발전한 최신 모델 포함 비교.

**비교 후보** (상업 자유 라이선스만):
- FaceMesh (MediaPipe) — 현행, 468점, 셀카 특화
- dlib — 68점, 20년 검증, Boost
- InsightFace/RetinaFace — 106점, 인증 시스템 표준급, MIT
- face-alignment (Adrian Bulat) — 68점, 2D/3D, BSD
- 기타 2026년 기준 유력 후보가 있으면 추가 조사

---

## 작업

### 1. dlib 환경 세팅 (M1 로컬)

```bash
pip install dlib opencv-python
# 68점 랜드마크 모델 다운로드
# shape_predictor_68_face_landmarks.dat (~100MB)
```

### 2. 비교 스크립트 작성

같은 이미지에 대해 FaceMesh와 dlib를 각각 실행, 결과를 나란히 출력.

**테스트 이미지 3장**:
- `/Users/macmini/Desktop/dawn-original.jpg` (셀카급)
- 상반신 와이드 (카페 사진 — 민아가 쓴 테스트 이미지, 경로 확인 필요)
- `/Users/macmini/Downloads/my_id_photo.jpg` (안경)

**측정 항목** (각 모델별):
- 감지 성공/실패
- 턱 좌표 (px)
- 눈 좌표 — FaceMesh #159/#386, dlib #36~41/#42~47 중심
- 감지 시간 (초)
- 결과물: 원본 이미지 위에 턱·눈 포인트를 **빨강(FaceMesh) / 파랑(dlib)** 으로 동시 표시 → 데스크탑 출력

### 3. 결과물 데스크탑 출력

- `/Users/macmini/Desktop/landmark_compare_dawn.png`
- `/Users/macmini/Desktop/landmark_compare_cafe.png`
- `/Users/macmini/Desktop/landmark_compare_idphoto.png`

### 4. 비교표

```markdown
| 항목 | FaceMesh | dlib |
|------|----------|------|
| 감지 성공률 (3장) | ?/3 | ?/3 |
| 셀카 턱 정확도 | ? | ? |
| 와이드샷 턱 정확도 | ? | ? |
| 눈 위치 정확도 | ? | ? |
| 속도 | ? | ? |
| 모델 크기 | ~3MB | ~100MB |
| 라이선스 | Apache 2.0 | Boost |
```

---

## ⚠️ 준수 조항

- dlib 모델 파일은 git 커밋 금지 (로컬 보관)
- 완료 보고: 수발신 헤더 필수, `✅❌💡⏳📁🔀` 형식
- PF_CROP 히스토리 1행 어펜드, 세션 로그 어펜드, 커밋 → 푸시
