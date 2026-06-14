---
type: completion
date: 2026-06-14
device: 4060
agent: 쌍아
order: ORDER_20260614_iMac쌍아_4060쌍아_CROP_BiRefNet_PoC
portfolio: PF_CROP
status: 완료
---

# BiRefNet 배경 제거 PoC — 완료 보고

> **[2026-06-14 16:47 KST]** 4060/쌍아 → 작가님

---

## ✅ 완료 항목

- BiRefNet 모델 다운로드 + 환경 세팅 (rmbg-env 재활용, einops 추가 설치)
- Flask 추론 서버 작성 (`birefnet_server.py`, port 5001)
- 테스트 페이지 작성 (`birefnet-test.html`, 벤치마크 테이블 포함)
- 이미지 5종 품질·속도 벤치마크 완료

## 💡 발견 사항

### 라이선스 정정
- 지시서: Apache 2.0으로 기재
- 실제: **MIT** (HuggingFace model_info 확인) — 더 관대한 조건. 상업 사용 무제한.

### 벤치마크 결과

| # | 이미지 | 입력 크기 | 추론 시간 | VRAM Peak |
|---|--------|----------|----------|-----------|
| 1 | ID_Photosample.jpg (증명사진, 단색 배경) | 989×1320 | 0.851s | 3,197MB |
| 2 | be_f_1.jpg (인물 전신, 배경 있음) | 1024×1024 | 0.818s | 3,197MB |
| 3 | bg_f_1.jpg (복잡한 배경) | 1024×1024 | 0.835s | 3,197MB |
| 4 | bg_cr_f_1.jpg (크롭된 배경) | 413×531 | 0.754s | 3,197MB |
| 5 | PASSPORTUSA.jpg (여권 사진) | 1280×1280 | 0.885s | 3,197MB |
| **평균** | | | **0.829s** | **3,197MB** |

### 모델 리소스
- 모델 로드 시 VRAM: 852MB (FP32)
- 추론 시 VRAM peak: 3,197MB (8GB 중 39%)
- RTX 4060 8GB에서 여유있게 동작

### 품질 평가
- **경계 깔끔함**: 증명사진에서 매우 우수. 어깨·목 경계 정밀.
- **머리카락 보존**: 양호~우수. 세밀한 모발까지 잘 분리.
- **복잡한 배경**: 양호. 인물과 배경 경계가 명확하게 분리됨.
- **여권 사진**: 여권 페이지 전체 이미지에서 인물 분리 시도 — 여권 프레임 경계에서 부분적 성공 (용도상 한계).

### RMBG-2.0 대비 비교 (참고)
| 항목 | BiRefNet | RMBG-2.0 |
|------|----------|----------|
| 라이선스 | MIT (상업 무제한) | CC BY-NC (상업 불가) |
| 추론 시간 | ~0.83s | ~0.5s (추정) |
| VRAM | 3,197MB peak | ~2,000MB peak (추정) |
| 품질 | 우수 (머리카락 디테일 강점) | 우수 |
| HF 다운로드 | 53만+ | 100만+ |

## 📁 산출물

- `apps/crop-app/benchmark/birefnet_server.py` — Flask 추론 서버
- `apps/crop-app/benchmark/birefnet-test.html` — 브라우저 테스트 페이지
- `apps/crop-app/benchmark/run_benchmark.py` — 자동 벤치마크 스크립트
- `apps/crop-app/benchmark/birefnet_outputs/` — 결과 이미지 5종 + benchmark_results.json

## 🔀 다음 단계 제안

1. **RMBG-2.0과 동일 이미지 A/B 비교**: 경계 품질 차이 정밀 비교
2. **FP16 추론 테스트**: VRAM 절약 + 속도 향상 가능성 확인 (현재 FP32)
3. **specs 서비스 편입 판단**: MIT 라이선스로 상업적 제약 없음, 품질 충분

---

*지시서: ORDER_20260614_iMac쌍아_4060쌍아_CROP_BiRefNet_PoC*
