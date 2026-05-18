---
type: report
date: 2026-05-01
from: iMac/막내1
subject: 배경 제거 엔진 벤치마크 — 크롭앱 통합용
---

# 배경 제거 엔진 벤치마크 보고서

**[2026-05-01 16:05 KST] iMac/막내1**

## 1. 테스트 환경

- **디바이스**: iMac (사무실)
- **브라우저**: Chrome (CDP 9222, 로컬 HTTP 서버)
- **테스트 이미지**: 증명사진 스타일 600×800px 3장 (단색 배경, 정면 인물 시뮬레이션)
- **측정 방식**: Cold Start (첫 추론, 모델 다운로드 포함) / Warm (캐시 후 추론)

## 2. 엔진별 실측 결과

### 비교표

| 엔진 | 모델 크기 | JS 번들 | Cold Start | Warm 추론 | 엣지 품질 | CDN-only |
|------|----------|---------|------------|----------|----------|---------|
| **@imgly/background-removal v1.5.5** | ~40 MB | 167 KB | **13.4s** | **12.4s** | ★★★★ 양호 | ✅ |
| **Transformers.js + RMBG-1.4 (q8)** | ~44.4 MB | 867 KB | **8.9s** | **8.4s** | ★★★★★ 최상 (노이즈 주의) | ✅ |
| **rembg-web + u2netp** | ~4.7 MB | 146 KB | 미측정 | 미측정 | 미측정 | ❌ |
| **MediaPipe Selfie Segmenter** | ~0.45 MB | 137 KB | **0.8s** | **0.2s** | ★★ 거침 | ✅ |

### 엔진별 상세

#### @imgly/background-removal v1.5.5 (기준선)
- 4/30 PoC에서 검증 완료. 가장 간단한 API (`removeBackground(file)` 단일 함수)
- 모델 첫 다운로드 ~40MB 후 IndexedDB 자동 캐시
- Cold/Warm 차이 거의 없음 (추론 자체가 ~12s) — 모델 캐시가 주효
- 엣지 품질: 머리카락 경계 깨끗, 어깨선 정확
- v1.7.0은 WebGPU 지원 추가됐으나 ESM bare specifier 문제로 CDN-only 환경 불가. npm 빌드 시 v1.7.0 권장

#### Transformers.js v3 + RMBG-1.4 (quantized)
- HuggingFace `pipeline('image-segmentation')` 패턴
- quantized 모델 44.4MB — imgly와 유사한 다운로드 부담
- **추론 속도 우위**: Warm 8.4s (imgly 12.4s 대비 32% 빠름)
- 엣지 품질 최상이나 **일부 이미지에서 마스크 노이즈 발생** (배경색과 피부톤 유사 시)
- RMBG-2.0 ONNX 존재하나 onnxruntime-web 버그로 **브라우저 미지원**

#### rembg-web v1.0.2 + u2netp
- u2netp 모델 4.7MB — 최소 번들 후보
- **CDN-only 환경 호환 불가**: 모델 파일을 자체 호스팅해야 함 (기본 baseUrl `/models`)
- npm 빌드 + 정적 에셋 호스팅 필수
- 추론 품질: u2netp는 320×320 해상도 마스크 → 업스케일 시 엣지 계단현상 예상
- npm 빌드 환경에서 재측정 필요

#### MediaPipe Selfie Segmenter v0.10.14
- **압도적 속도**: Cold 0.8s, Warm 0.2s — 다른 엔진 대비 40~60배 빠름
- **압도적 경량**: 모델 0.45MB
- **치명적 약점**: 증명사진 품질 미달
  - 256×256 해상도 마스크 → 거친 엣지
  - 머리카락 디테일 손실
  - 비디오 콜 최적화 모델 — 정밀 인물 분리 용도 아님
- 프리뷰/미리보기 용도로는 가치 있음

## 3. 품질 비교 (시각적 판정)

| 항목 | imgly | RMBG-1.4 | MediaPipe |
|------|-------|----------|-----------|
| 머리카락 엣지 | 깨끗 | 가장 정밀 | 거침/뭉침 |
| 어깨/옷 경계 | 정확 | 정확 | 대략적 |
| 배경-피부 유사 시 | 안정 | 노이즈 가능 | 뭉침 |
| 전체 마스크 해상도 | 원본 유지 | 원본 유지 | 256px 고정 |

## 4. 최적화 전략 (T3)

### 4-1. Lazy Loading (모델 분리 로딩)
```
사용자 진입 → UI 즉시 표시
       ↓ (배경에서)
       모델 프리페치 시작
       ↓
사용자 사진 업로드 → 모델 준비 완료 시 즉시 추론
```
- 페이지 로드와 모델 다운로드를 분리
- `import()` 동적 임포트로 엔진 코드 자체도 지연 로딩

### 4-2. WebWorker 분리
```js
// main thread
const worker = new Worker('bg-remove-worker.js', { type: 'module' });
worker.postMessage({ image: fileBlob });
worker.onmessage = (e) => { /* 결과 수신 */ };
```
- 추론 ~8-13s 동안 메인 스레드 블로킹 방지
- UI 응답성 유지 (프로그레스 바, 취소 버튼 활성)
- @imgly, Transformers.js 모두 Worker 호환

### 4-3. IndexedDB 캐싱
- @imgly: 자체 IndexedDB 캐싱 내장 (추가 작업 불필요)
- Transformers.js: 자체 캐싱 내장 (HuggingFace Hub 캐시)
- 재방문 시 모델 재다운로드 없이 즉시 사용

### 4-4. WASM SIMD
- @imgly / Transformers.js: onnxruntime-web이 WASM SIMD 자동 감지·활용
- Chrome 91+, Safari 16.4+에서 SIMD 기본 활성
- 별도 설정 불필요 (런타임이 자동 선택)

### 4-5. 하이브리드 전략 (권장)
```
[Phase 1: 즉시 프리뷰]
  MediaPipe (0.2s) → 저해상도 프리뷰 마스크 즉시 표시

[Phase 2: 고품질 교체]
  @imgly 또는 RMBG-1.4 (Worker) → 고해상도 최종 마스크
  → 프리뷰를 고품질로 자연스럽게 교체
```
- 사용자 체감 즉시 반응 + 최종 품질 보장
- 구현 복잡도 증가 (추가 개발 ~2시간)

## 5. 추천

### 1순위: @imgly/background-removal v1.5.5 (→ npm 빌드 시 v1.7.0)

**근거:**
1. **API 단순성**: `removeBackground(file)` 한 줄. 전처리/후처리 코드 불필요
2. **안정성**: 4/30 PoC에서 이미 검증 완료. 노이즈 없는 안정적 마스크
3. **캐싱 내장**: IndexedDB 자동 캐시 → 재방문 시 즉시 추론
4. **CDN 호환**: 빌드 없이 즉시 사용 가능 (v1.5.5)
5. **품질-속도 균형**: 13s 추론은 일회성 증명사진 용도에 허용 범위

**차순위 고려:**
- RMBG-1.4: 품질 최상 + 속도 우위(8.4s)이지만 일부 이미지에서 노이즈 발생. 전처리/후처리 코드 직접 작성 필요
- 하이브리드 (MediaPipe 프리뷰 + imgly 최종): UX 최적이나 구현 복잡도 증가

**비추천:**
- rembg-web: CDN-only 미지원, 모델 호스팅 인프라 필요
- MediaPipe 단독: 증명사진 품질 미달

### 최적화 적용 우선순위
1. WebWorker 분리 (메인 스레드 블로킹 해소) — **필수**
2. Lazy Loading (페이지 초기 로드 속도 확보) — **필수**
3. 하이브리드 프리뷰 (MediaPipe + imgly) — **선택** (UX 개선)

## 6. 산출물

- `apps/crop-app/benchmark/index.html` — 4개 엔진 비교 벤치마크 페이지
- `apps/crop-app/benchmark/REPORT_배경제거_벤치마크.md` — 본 보고서
- 테스트 이미지: `/tmp/test_portrait_{1,2,3}.png`
