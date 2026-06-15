---
type: completion
date: 2026-06-14
device: 4060
agent: 쌍아
order: ORDER_20260614_iMac쌍아_4060쌍아_CROP_배경제거후처리_PoC
portfolio: PF_CROP
status: 완료
---

# BiRefNet 배경 제거 후처리 파이프라인 PoC — 완료 보고

> **[2026-06-15 10:49 KST]** 4060/쌍아 → 작가님

---

## ✅ 완료 항목

- 후처리 모듈 작성 (`refine.py` — 3단 파이프라인)
- `birefnet_server.py`에 `?refine=true` 파라미터 통합
- 이미지 3종 raw vs refined 벤치마크 완료
- RMBG-2.0 A/B 비교 벤치마크 (추가 실시)

## ✅ RMBG-2.0 A/B 비교 (추가 수행)

작가님 지시로 RMBG-2.0 gated repo 접근 확인 후 동일 이미지 5종 벤치마크 실시.

| 항목 | BiRefNet | RMBG-2.0 |
|------|----------|----------|
| 라이선스 | **MIT (상업 무제한)** | CC BY-NC (상업 불가) |
| 평균 추론 | 0.829s | **0.771s** (7% 빠름) |
| VRAM peak | 3,197MB | 3,209MB |
| 모델 로드 | 852MB | 852MB |
| 품질 | 동급 | 동급 |

**결론**: 품질·속도 거의 동급. 라이선스가 결정적 차이 — BiRefNet(MIT)만 상업 편입 가능.

## 💡 후처리 파이프라인 결과

### 3단 파이프라인
1. **알파 매팅** (GuidedFilter) — 마스크 경계를 이진→연속 알파로 정밀화
2. **에지 페더링** (가우시안 블러) — 경계 영역만 선택적 블러
3. **컬러 디컨태미네이션** — 반투명 영역의 배경색 번짐 보정

### 속도 실측

| 이미지 | raw 총 | refined 총 | 후처리 오버헤드 |
|--------|--------|-----------|-------------|
| 증명사진 (단색 배경) | 0.833s | 0.866s | +0.033s |
| 인물 전신 (배경 있음) | 0.846s | 0.844s | -0.002s |
| 크롭된 배경 | 0.774s | 0.770s | -0.004s |
| **평균** | **0.818s** | **0.827s** | **+0.009s** |

후처리 오버헤드 평균 **+9ms** — 무시 가능.

### 품질 판정
- 증명사진: 어깨 경계 약간 부드러워짐. 머리카락 차이 미미.
- 인물 전신: 머리카락 바깥 반투명 영역 생겨 자연스러움 약간 개선.
- 전체: BiRefNet 마스크 자체 품질이 양호해서 **후처리 효과 제한적**.
- 지시서 준수: "마스크 자체가 틀린 경우는 후처리 한계로 기록" — 여권 사진은 한계 확인, 억지로 고치지 않음.

## 📁 산출물

- `apps/crop-app/benchmark/refine.py` — 후처리 3단 파이프라인 모듈
- `apps/crop-app/benchmark/birefnet_server.py` — refine 파라미터 통합
- `apps/crop-app/benchmark/rmbg2_server.py` — 벤치마크 엔드포인트 추가
- `apps/crop-app/benchmark/run_benchmark_rmbg2.py` — RMBG-2.0 벤치마크 스크립트
- `apps/crop-app/benchmark/run_benchmark_refine.py` — raw vs refined 벤치마크 스크립트
- `apps/crop-app/benchmark/compare-test.html` — BiRefNet vs RMBG-2.0 동시 비교 UI
- `apps/crop-app/benchmark/refine_outputs/` — 전/후 비교 이미지 6장 + JSON
- `apps/crop-app/benchmark/rmbg2_outputs/` — RMBG-2.0 결과 5장 + JSON

## 🔀 다음 단계 제안

1. **ViTMatte 2단계 매팅** — 막내 리서치(REPORT_20260614)에서 권고한 BiRefNet→ViTMatte 파이프라인 PoC
2. **프로덕션 API 설계** — BiRefNet + 후처리를 Cloud Run 또는 4060 상시 서비스로 편입
3. **refine=true 기본 활성화** — 오버헤드 9ms로 무시 가능, 품질 약간 개선

---

*지시서: ORDER_20260614_iMac쌍아_4060쌍아_CROP_배경제거후처리_PoC*
