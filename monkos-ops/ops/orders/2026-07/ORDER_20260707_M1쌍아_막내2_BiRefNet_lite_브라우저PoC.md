---
type: order
id: ORDER_20260707_M1쌍아_막내2_BiRefNet_lite_브라우저PoC
date: 2026-07-07 15:13 KST
from: M1/쌍아
to: M1/막내2
portfolio: PF_CROP
priority: P1
status: 대기
---

# 지시서: BiRefNet-lite 브라우저 PoC — onnxruntime-web 실측

> **[2026-07-07 15:13 KST] M1/쌍아 → M1/막내2**
> 귀속: PF_CROP
> 선행: BiRefNet-lite PoC 완료 (품질 portrait 동급 확인, 214MB)

---

## 목표

BiRefNet-lite ONNX(214MB)를 **브라우저에서 직접 추론**. 서버 비용 ₩0의 무료 티어 실현 가능성 실측.

---

## 작업

### 1. 테스트 페이지 제작

`apps/crop-app/benchmark/birefnet-lite-browser.html` — 단일 HTML.

- onnxruntime-web CDN 로드 (WASM + WebGPU 양쪽 시도)
- BiRefNet-lite ONNX 로드 (로컬 HTTP 서버에서 서빙)
- 이미지 업로드 → 전처리(1024² 리사이즈, ImageNet 정규화) → 추론 → sigmoid → 흰배경 합성 → 결과 표시
- 기존 `birefnet-poc.py`의 전처리 로직을 JS로 이식

### 2. 측정 항목

| 항목 | 측정 |
|------|------|
| 모델 다운로드 | 첫 로드 시간 (초) |
| 모델 캐시 후 로드 | IndexedDB 재로드 시간 |
| WASM 추론 | 초 |
| WebGPU 추론 (지원 시) | 초 |
| 메모리 사용 | Chrome DevTools |
| 결과 품질 | 서버 결과물과 동일한지 |

### 3. 테스트 환경

- M1 Chrome (WebGPU 지원)
- 로컬 HTTP 서버: `python3 -m http.server 8080`
- ONNX 모델은 앞서 다운받은 lite 모델 사용

### 4. 결과물

- `birefnet-lite-browser.html` 커밋
- 실측 수치 보고 (WASM vs WebGPU)
- 스크린샷 (결과물 품질)

---

## ⚠️ 준수 조항

- ONNX 모델 파일은 git 커밋 금지 (로컬 서빙만)
- 완료 보고: 수발신 헤더 필수, `✅❌💡⏳📁🔀` 형식
- PF_CROP 히스토리 1행 어펜드, 세션 로그 어펜드, 커밋 → 푸시
