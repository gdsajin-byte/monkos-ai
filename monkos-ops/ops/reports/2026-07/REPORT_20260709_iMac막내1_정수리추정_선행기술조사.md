---
type: report
date: 2026-07-09
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 마감
---

# 정수리 추정·크롭 보정 선행기술 조사 보고서

**[2026-07-09 14:02 KST]** iMac/막내1 → 작가님

---

## Task 1 — 해부학적 안면 비율 문헌 조사

### 핵심 논문

| # | 저자 | 제목 | 연도 | 핵심 수치 |
|---|------|------|------|----------|
| 1 | Farkas LG | *Anthropometry of the Head and Face* (2nd ed.) | 1994 | 2564명 실측, 166개 비율 지표. 안면 수직 3등분(trichion–glabella–subnasale–menton) 정규 데이터. "현대 안면 인체측정학의 아버지" |
| 2 | Farkas LG et al. | *International anthropometric study of facial morphology in various ethnic groups/races* | 2005 | 25개 인종, 수직 비율의 유의미한 인종·성별 차이 확인. 하안면/전체 비율은 성적 이형(남성 > 여성) |
| 3 | Farkas LG, Munro IR | *The proportion of the face in younger adults using the thumb rule of Leonardo da Vinci* | 1987 | 400명(22-25세). 얼굴 높이 ≈ 엄지 길이 × 3. Leonardo 비율의 통계적 유의 상관 확인 |
| 4 | Anic-Milosevic S et al. | *The validity of three neo-classical facial canons in young adults originating from the Arabian Peninsula* | 2015 | Neoclassical 3등분 규칙 검증 — 아랍 인구에서 하안면이 중안면보다 유의미하게 큼 |
| 5 | Zhuang Z et al. (NIOSH) | *Facial Anthropometric Differences among Gender, Ethnicity, and Age Groups* | 2010 | 3997명 미국 민간인. 18개 안면 치수의 인종·성별·연령 편차 정량화 |

### "눈~턱 = 눈~정수리" 1:1 규칙의 실측 정확도

- Leonardo/Vitruvius 규칙: 눈 = 두상 수직 중점 (vertex–menton의 1/2)
- Farkas 실측: **대체로 성립하나 인종·성별에 따라 ±5~10% 편차** 존재
  - 유럽계: 비교적 1:1에 근접
  - 아프리카계: 하안면이 상대적으로 긴 경향
  - 아시아계: 상안면(두개관)이 상대적으로 긴 경향
- 결론: 1:1 미러는 **합리적 초기값(reasonable prior)**이지만, 인종·개인차 보정 없이 정확한 추정은 불가

---

## Task 2 — Head Pose와 2D 투영 왜곡 문헌 조사

### 핵심 논문

| # | 저자 | 제목 | 연도 | 핵심 내용 |
|---|------|------|------|----------|
| 1 | Hempel T (6DRepNet) | *6D Rotation Representation for Unconstrained Head Pose Estimation* | 2022 (ICIP) | 6D 회전 행렬로 Euler 각 추정. pitch/yaw/roll 추정. 경량 RepVGG 백본 |
| 2 | Hempel T (6DRepNet v2) | *Toward Robust and Unconstrained Full Range of Rotation Head Pose Estimation* | 2024 (IEEE TIP) | 풀 레인지 커버. geodesic distance loss |
| 3 | Zhou Y, Gregson J (WHENet) | *WHENet: Real-time Fine-Grained Estimation for Wide Range Head Pose* | 2020 | ±180° yaw 지원. wrapped loss. EfficientNet 백본. 경량 |
| 4 | Yang TY et al. (FSA-Net) | *FSA-Net: Learning Fine-Grained Structure Aggregation for Head Pose Estimation from a Single Image* | 2019 (CVPR) | 5MB 모델. soft stagewise regression. BIWI·AFLW2000 벤치마크 SOTA |
| 5 | Gu J et al. | *Head Pose Estimation through Keypoints Matching between Reconstructed 3D Face Model and 2D Image* | 2021 (Sensors) | Weak perspective projection으로 3D→2D 매칭. pitch 추정 정밀도 분석 |

### pitch → 미러 계수 관계의 기존 공식

- **직접적인 "pitch → 정수리 미러 계수" 공식은 발견되지 않음**
- 관련 수학적 근거:
  - Weak perspective: 2D 투영 시 수직 거리는 `cos(pitch)`에 비례하여 수축 → 눈~턱 관측거리 = 실제 × cos(pitch)
  - 정수리 방향은 반대로 수축 → pitch > 0(숙임)이면 정수리 쪽 과소추정, pitch < 0(치듬)이면 과대추정
  - 보정 공식 유도: `mirror_coeff = 1 / cos(pitch)` 또는 `1 + tan(pitch) × offset` 형태
- **MONKOS의 `tan(pitch * 0.5) → 0.90~1.10 클램프` 방식은 문헌에서 직접 대응하는 선행 공식이 없음** — 실측 기반 경험적 보정

---

## Task 3 — 증명사진 자동 크롭 관련 특허·논문 조사

### 기존 특허

| # | 특허번호 | 제목 | 출원인 | 핵심 내용 |
|---|---------|------|--------|----------|
| 1 | US 10,587,795 | System for producing compliant facial images for selected identification documents | (미상) | 얼굴 특징점 자동 감지, auto-zoom/crop/rotation, head pose·eye·mouth 분석, 국가별 규격 DB 내장. minor head roll 자동 보정 |
| 2 | US 9,369,625 | System for producing compliant facial images for selected identification documents | (US10587795 계열) | 유사 시스템. bio-metrics 기반 auto-crop + 규격 준수 검증 |
| 3 | US 10,129,460 | System for producing compliant facial images for selected identification documents | (US10587795 계열) | 동 계열 continuation |
| 4 | US 7,460,705 | Head-top detecting method, head-top detecting system and a head-top detecting program for a human face | (일본 출원) | **정수리(head-top) 검출 전용 특허**. 얼굴 영역에서 두상 상단 검출 |
| 5 | US 10,318,794 / 10,713,469 | Intelligent auto cropping of digital images | (미상) | 감정 감지, 얼굴 인식, 랜드마크 매칭 기반 스마트 크롭 |
| 6 | US 12,439,146 | Automated portrait, photo pose, and soft biometrics capture system | (미상) | 자동 포트레이트 포즈 + 바이오메트릭 캡처 |

### 상용 서비스 기술 접근법

| 서비스 | 정수리 추정 방식 | 특징 |
|--------|----------------|------|
| **Evoto** | 얼굴 감지 → 머리 크기 비율(head size %) + 상단 여백(top margin %) 조절. 수평 중앙 맞춤(horizontal face position = 50) | 파라미터 조정 가능하나 각도 보정 언급 없음 |
| **PhotoGov** | AI 랜드마크 68점 → 머리 기울기·회전·위치 → 규격 자동 맞춤 | ICAO 준수 검증 포함 |
| **Passport Photo Online** | 68+ 랜드마크 → 눈 높이·턱 공간·정수리 clearance 측정 → 규격 비율 검증 | head size를 chin~crown 거리로 측정 |
| **Pict AI** | 얼굴 감지 + 랜드마크 → 눈·턱·정수리 위치 → 프레임 배치 | segmentation 기반 배경 제거 |
| **FaceCropJet** | 배치 얼굴 감지 → 자동 크롭 | 대량 처리 특화 |

### 규격 표준

- **ICAO 9303 / ISO/IEC 19794-5**: 얼굴 크기 = 총 이미지 높이의 50~69% (턱~정수리). 눈간 거리 ≥ 90px (권장 120px). 정면 포즈 필수.
- 정수리(crown) 정의: 물리적 두개골 상단 (헤어라인 아님)

---

## Task 4 — MONKOS 방식의 신규성 정리

| 구성 요소 | MONKOS 방식 | 선행기술 유무 | 신규성 판단 |
|-----------|------------|-------------|------------|
| **해부학 1:1 미러** | 106점 랜드마크(InsightFace) 턱·눈 실측 → 눈~턱 거리를 위로 미러하여 정수리 추산 | **부분 존재**. Leonardo 1:1 규칙은 해부학 상식. 그러나 106점 랜드마크 기반 실측 적용은 특허에서 미확인 | 단독으로는 약함. 아래 요소와 결합 시 강함 |
| **pitch 미러 보정** | 6DRepNet pitch → `tan(pitch×0.5)` 기반 가중치 0.90~1.10 → 미러 계수 동적 보정 | **발견 안 됨**. head pose → 크롭 배치 보정의 직접적 선행 공식·특허 없음. 기존 서비스는 포즈 "검증"만 하고 "보정"은 하지 않음 | **★ 핵심 신규성** |
| **규격 기반 눈위치 연산** | spec.topMargin/bottomMargin → 제약 최적화로 눈 위치 동적 산출 | **부분 존재**. Evoto가 top margin/head size 파라미터 보유. 그러나 규격 제약에서 역산하는 방식은 미확인 | 구현 방식에 신규성 |
| **헤어라인 감지** | 이마 상하반 밝기 통계 → 볼륨 동적 결정 (예정) | **부분 존재**. segmentation 기반 접근은 흔함. 그러나 "이마 영역 상하반 픽셀 통계만으로" 판정하는 경량 접근은 미확인 | 경량 방식에 신규성 |
| **3단 체인 통합** | 랜드마크(해부학 미러) + 포즈 모델(pitch 보정) + 픽셀 통계(헤어라인) → 순차 정제 | **발견 안 됨**. 기존 서비스는 랜드마크→크롭 1단, 또는 segmentation→크롭 1단. 3단 순차 정제 체인은 미확인 | **★ 핵심 신규성** |

### 차별화 요약

**기존 기술의 한계:**
1. 대부분의 서비스/특허는 포즈를 "검증"(차단)하지 "보정"(적응)하지 않음
2. 정수리 추정은 segmentation(무거움) 또는 고정 비율(부정확)에 의존
3. 촬영 각도에 의한 2D 투영 왜곡을 정수리 추정에 반영하는 시스템 없음

**MONKOS의 핵심 차별점:**
1. **각도 적응형 정수리 추정**: pitch에 의한 foreshortening을 실시간 보정하여 정수리를 추산 — "검증이 아닌 보정"
2. **경량 3단 체인**: SCRFD 5점 → InsightFace 106점 → 6DRepNet pitch → 픽셀 통계, 각 단계가 이전 단계를 정제
3. **규격 역산**: 규격 제약에서 눈 위치를 역산하는 방식 — 기존은 순방향(얼굴 찾고 → 규격 맞는지 검증)

### 특허 출원 시 권장 청구항 방향

1. **독립항**: "촬영 각도 적응형 자동 정수리 추정 및 증명사진 크롭 배치 방법" — 해부학 미러 + 포즈 보정 + 규격 역산의 결합
2. **종속항 1**: pitch 각도에 의한 미러 계수 동적 보정 (tan 기반 가중치)
3. **종속항 2**: 이마 영역 픽셀 통계 기반 경량 헤어라인 감지
4. **종속항 3**: 규격 제약 기반 눈위치 동적 연산 (역산 방식)
