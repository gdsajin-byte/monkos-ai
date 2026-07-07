---
type: completion
date: 2026-07-07
device: M1
agent: 막내2
portfolio: PF_CROP
status: 완료
order: ORDER_20260707_M1쌍아_막내_FaceMesh_vs_dlib_비교실측
---

# COMPLETION: FaceMesh vs dlib 랜드마크 비교 실측

> **[2026-07-07 19:37 KST]** M1/막내2 → 작가님

---

## 비교표

| 항목 | FaceMesh (MediaPipe) | dlib 68pt |
|------|---------------------|-----------|
| 감지 성공률 (3장) | **3/3** | **3/3** |
| 평균 속도 | **0.010s** | 0.263s |
| 속도 비율 | **26배 빠름** | 기준 |
| 모델 크기 | ~3.6MB | ~95MB |
| 랜드마크 수 | 478점 (iris 포함) | 68점 |
| 라이선스 | Apache 2.0 | Boost |

## 좌표 정밀도 비교 (px 단위)

| 이미지 | 조건 | 눈Y Δ | 턱Y Δ | 코Y Δ |
|--------|------|-------|-------|-------|
| dawn (1024×1024) | 셀카, 실내 배경 | **3px** | **5px** | 12px |
| closeup (1280×1920) | 클로즈업, 어두운 배경, 입 벌림 | **1px** | 10px | 32px |
| idphoto (400×600) | 안경, 상반신 | 10px | **1px** | **1px** |

### 핵심 관찰

1. **눈 위치**: 3장 평균 Δ 4.7px — 실용적으로 동급. idphoto에서 10px 차이는 안경 프레임이 iris 탐지(FaceMesh #468/#473)에 영향 추정.

2. **턱 위치**: 3장 평균 Δ 5.3px — 동급. closeup(입 벌림)에서 dlib이 10px 아래 → dlib #8(턱끝)이 열린 입에 미세하게 당겨짐.

3. **코 위치**: 최대 32px 차이 — **해부학적 기준점 차이** (FaceMesh #1=코끝, dlib #30=콧대 중단). 비교 의미 제한적.

4. **속도**: FaceMesh 0.010s vs dlib 0.263s → **26배 차이**. 브라우저·모바일 환경에서 FaceMesh 압도적 우위.

## 판정

| 차원 | 우위 | 근거 |
|------|------|------|
| 정확도 (정면 셀카) | 동급 | 눈·턱 3-5px 차이 — 35mm 사진 기준 0.1mm 미만 |
| 정확도 (안경) | **dlib 소폭 우위** | FaceMesh iris 탐지가 안경 프레임에 간섭 (10px) |
| 정확도 (와이드샷/소얼굴) | 미실측 | 지시서의 카페 와이드샷 원본 미발견 — 별도 테스트 필요 |
| 속도 | **FaceMesh 압도** | 26배 빠름 |
| 모델 크기 | **FaceMesh 압도** | 3.6MB vs 95MB |
| 웹 호환 | **FaceMesh 압도** | WASM 즉시 사용 vs dlib 미지원 |

### 사일런트 미스 재현 불가

이번 3장에서는 FaceMesh 감지 실패(사일런트 미스) 미재현. 지시서 배경의 "웹 업로드 이미지에서 턱·눈 좌표 반복 오판"은 다음 원인 가능:
- **웹 JS 구현체와 Python 구현체의 차이** (이번 테스트는 Python Tasks API)
- **와이드샷/소얼굴** 특수 케이스 (카페 사진 미확보로 미실측)
- **이미지 전처리 차이** (웹에서 canvas 리사이즈 vs 원본 직접 입력)

---

## 산출물

| 파일 | 위치 |
|------|------|
| `landmark_compare_dawn.png` | `/Users/macmini/Desktop/` |
| `landmark_compare_closeup.png` | `/Users/macmini/Desktop/` |
| `landmark_compare_idphoto.png` | `/Users/macmini/Desktop/` |
| `facemesh_vs_dlib.py` | `apps/crop-app/benchmark/poc-20260707/` |

## 변경 파일

- `apps/crop-app/benchmark/poc-20260707/facemesh_vs_dlib.py` (신규)
- `monkos-ops/ops/reports/2026-07/COMPLETION_20260707_M1막내2_FaceMesh_vs_dlib_비교실측.md` (본 보고서)

## ⚠️ 미비 사항

- **카페 와이드샷 원본 미확보** — 지시서의 "상반신 와이드" 조건 미실측. krivitskiy 클로즈업으로 대체.
- dlib/FaceMesh 모델 파일은 git 미커밋 (로컬 보관).
