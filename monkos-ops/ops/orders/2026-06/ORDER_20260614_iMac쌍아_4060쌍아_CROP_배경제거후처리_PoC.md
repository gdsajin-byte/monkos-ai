---
type: order
id: ORDER_20260614_iMac쌍아_4060쌍아_CROP_배경제거후처리_PoC
date: 2026-06-14 17:39 KST
from: iMac/쌍아
to: 4060/쌍아
portfolio: PF_CROP
priority: P1
status: pending
---

# BiRefNet 배경 제거 후처리 파이프라인 PoC

> **[2026-06-14 17:39 KST] iMac/쌍아 → 4060/쌍아**
> 귀속: PF_CROP
> 배경: BiRefNet 마스크 품질은 양호하나 헤어 끝단·어깨선 경계가 거침. 후처리로 보강 가능한 영역을 실측.

---

## 목표

BiRefNet 마스크 출력에 후처리 파이프라인을 적용하여 경계 품질을 실측 개선한다.

---

## 파이프라인 설계

```
[원본 이미지] → [BiRefNet 마스크] → [후처리 3단] → [최종 출력]
                                      ↓
                              1. 알파 매팅 (경계 반투명화)
                              2. 에지 페더링 (경계 블렌딩)
                              3. 컬러 디컨태미네이션 (배경색 잔여 제거)
```

---

## 작업 항목

### 1. 알파 매팅 (Alpha Matting)

- BiRefNet의 이진 마스크 → trimap 생성 (확실한 전경 / 확실한 배경 / 미확정 경계)
- PyMatting 또는 GuidedFilter로 미확정 영역의 알파값 정밀 계산
- 머리카락 한 올 단위의 반투명 경계 생성

### 2. 에지 페더링 (Edge Feathering)

- 마스크 경계 1~3px 가우시안 블러
- 어깨·목 경계의 "오려붙인 느낌" 제거

### 3. 컬러 디컨태미네이션 (Color Decontamination)

- 전경 픽셀 중 원래 배경색이 번진 부분 보정
- 머리카락 사이의 베이지/파랑 배경 잔여 제거

### 4. 서버 통합

- `birefnet_server.py`에 후처리 옵션 추가: `POST /remove-bg?refine=true`
- refine=false (기존) vs refine=true (후처리 적용) A/B 비교 가능

### 5. 벤치마크

테스트 이미지 3종 (단색 배경 / 복잡 배경 / 셀카):
- 후처리 전/후 품질 비교 (경계 깔끔함, 헤어 보존)
- 후처리 추가 소요 시간 측정
- 총 추론 시간 (BiRefNet + 후처리)

---

## ⚠️ 준수 조항

- BiRefNet 모델 자체 수정 금지 — 후처리만
- 기존 birefnet_server.py 기능 유지 (refine 파라미터로 분기)
- 복잡 배경 셀카에서 마스크 자체가 틀린 경우는 후처리 한계로 기록 (억지로 고치려 하지 말 것)

---

## 산출물

- 후처리 모듈 (`refine.py` 또는 birefnet_server.py 내 통합)
- 벤치마크 결과 (전/후 비교 이미지 + 시간 측정)
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
