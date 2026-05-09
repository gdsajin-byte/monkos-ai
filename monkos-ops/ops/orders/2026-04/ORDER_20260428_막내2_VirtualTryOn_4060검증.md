---
type: ORDER
date: 2026-04-28
from: iMac/쌍아
to: iMac/막내2
status: 대기
pf: PF_STUDIO, PF_PROFILES
---

# Virtual Try-On 모델 4060 실검증

## 배경

- 프로필스 서비스에서 "아바타 고정 + 의상만 교체"를 경량으로 처리하기 위해 Virtual Try-On 모델 도입 검토
- 헤어·메이크업은 나노바나나 2가 잘 처리 → 의상 교체만 분리
- 오픈소스 모델을 4060 서버(RTX 4060, VRAM 8GB)에서 로컬 구동 가능한지 실검증

## 목표

4060에서 Virtual Try-On 오픈소스 모델을 실제로 돌려보고, 품질·속도·VRAM 사용량을 측정한다.

## 검증 대상 모델 (우선순위)

### 1순위: IDM-VTON
- GitHub: yisol/IDM-VTON
- 논문: Improving Diffusion Models for Authentic Virtual Try-on
- VRAM: 공식 12GB 권장 → 8GB에서 half-precision으로 시도

### 2순위: CatVTON  
- GitHub: Zheng-Chong/CatVTON
- 경량 모델, 8GB에서 구동 가능성 높음

### 3순위: OOTDiffusion
- GitHub: levihsu/OOTDiffusion
- Half-body / Full-body 모드 지원

## 검증 항목

각 모델에 대해:

| 항목 | 측정 |
|------|------|
| 설치 성공 여부 | 의존성, CUDA 호환 |
| VRAM 사용량 | nvidia-smi 피크 기록 |
| 추론 시간 | 1장 생성 소요 시간 (초) |
| 품질 | 테스트 이미지 3장 생성 → /tmp/vton_test/ 저장 |
| 정체성 보존 | 얼굴이 유지되는가 |
| 해상도 | 출력 해상도 |
| half-precision (fp16) | 8GB에서 돌아가는지 |

## 테스트 입력

- 인물 사진: `/tmp/profiles_ref/pose/front-center.jpg` (또는 Pexels에서 정면 상반신 1장)
- 의상 이미지: `/tmp/profiles_ref/outfit/suit-navy-w.jpg`, `casual-knit-m.jpg`, `creative-turtle-m.jpg`
- 3벌 × 1인 = 3장 생성

## 4060 접속

- SSH: 사무실 로컬 네트워크 (iMac → 4060)
- CUDA 버전 확인 후 진행
- conda/venv 환경 분리

## 산출물

`monkos-ops/ops/reports/REPORT_20260428_막내2_VirtualTryOn_4060검증.md`

- 모델별 검증 결과 테이블
- 생성 이미지 3장 이상 → `/tmp/vton_test/`
- 추천 모델 + 근거
- 8GB에서 불가 시: 최소 VRAM 요구사항 + 대안 (Replicate API 비용 비교)

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키 하드코딩 금지
- 4조 2항: rm -rf 등 파괴적 명령 금지
- 4060에 기존 환경이 있으면 건드리지 말고 별도 venv 생성

## 완료 조건

- [ ] 최소 1개 모델 4060에서 추론 성공
- [ ] 검증 결과 테이블 작성
- [ ] 생성 이미지 저장
- [ ] 완료 보고
