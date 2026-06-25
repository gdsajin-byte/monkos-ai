---
type: order
date: 2026-06-25
from: iMac/쌍아
to: iMac/막내
portfolio: PF_PORTAL
status: 완료
---

# 지시서: Specs v2 P1 — 크롭앱 인라인 임베드

**[2026-06-25 15:54 KST]** iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → 작가님` 형식

## 설계서
- 정본: `monkos-ops/tech/designs/2026-06/DESIGN_20260625_SPECSv2_크롭기반동선.md`
- 이 지시서는 설계서의 **P1(크롭앱 인라인 임베드)** 을 실행한다.

## 목표
Specs v2 kr-passport 페이지(`/specs/kr-passport`)의 현행 Phase 1(단순 업로드)을 **크롭앱 기반 동선**으로 교체한다. 사용자가 사진을 업로드하면 FaceMesh로 얼굴을 감지하고, 선택된 규격에 맞춰 자동 크롭하며, 정수리 위치를 수동 미세조정할 수 있게 한다. 크롭 결과를 무료 다운로드할 수 있다.

## 대상 파일
- `monkos_AI/portal/lib/cms/render-specs.js` — `specsDetailV2Fragment` 함수 (L1187~)
- `monkos_AI/portal/public/crop/crop.js` — 참조용 (로직 추출 대상). **이 파일 자체는 수정하지 않는다** (기존 `/crop` 페이지 보존).

## 작업 내용

### 1. crop.js 핵심 로직을 V2에 인라인 삽입

`crop.js`에서 아래 핵심 기능을 추출하여 V2의 `pageScript` 섹션에 인라인으로 삽입한다:

**추출 대상:**
- `SPECS` 객체 → **V2에서는 서버가 주입한 스펙 데이터로 대체** (아래 §2 참조)
- FaceMesh 초기화 (`initFaceMesh`, L645~) + 얼굴 감지 콜백 (`onFaceMeshResults`)
- 크롭 프레임 계산 (`initOverlay`, `render`, `recalc` — 핵심 좌표 연산)
- 정수리 드래그 (crownPin 이벤트) + 스케일 조정 (scaleHandle)
- 캔버스 크롭 출력 (L845~892, `canvas.toBlob`)
- ICAO 유효성 판정 (`isBlocked`, `getFaceColor`, `getEyeColor`)
- i18n: 현재 V2가 ko 전용이므로 한국어만. 추후 확장 시 i18n 사전 통합.

**추출하지 않는 것:**
- 규격 탭 전환 UI (V2는 스펙 페이지 진입 시 규격 이미 확정)
- 다운로드 동의 모달 (V2에서는 간소화 — 직접 다운로드)
- 샘플 이미지 로직 (V2는 샘플 없음, 업로드 필수)

### 2. 서버에서 규격 데이터 주입

`specsDetailV2Fragment` 함수에서 `pageScript`에 아래 변수를 삽입:

```js
var V2_SPEC = {
  wMm: ${parseSizeMm의 width},
  hMm: ${parseSizeMm의 height},
  faceMin: ${specData.faceMin || 32},
  faceMax: ${specData.faceMax || 36},
  faceTarget: ${specData.faceTarget || 34},
  pxW: ${pixels width},
  pxH: ${pixels height},
  dpi: ${specData.dpi}
};
```

- `crop.js`의 하드코딩된 `SPECS.passport`를 이 `V2_SPEC`으로 대체.
- **specs-data.json에 faceMin/faceMax 필드가 없으면** ICAO 기본값(32/36)을 사용.

### 3. V2 Phase 교체

현재 V2 Phase 구조를 아래로 교체:

```
Phase 1: 업로드 (현행 v2-phase-upload 유지, 드롭존 그대로)
    ↓ 업로드 시
Phase 2: 크롭 조정 (NEW)
    - 크롭 프레임 + SVG 오버레이 + 정수리 핀 + 스케일 핸들
    - ICAO 범위 바 + 수치 4칸 (상단/얼굴/하단/눈위치)
    - 경고 표시 (범위 이탈 시)
    - 버튼: [다른 사진] [크롭 다운로드(무료)] [AI 검수(무료) →]
    ↓
Phase 3: AI 검수 결과 (기존 v2-phase-check 활용, 크롭된 이미지 기반)
    ↓
Phase 4: 결제 (기존 v2-phase-pay 유지)
    ↓
Phase 5: 생성 + 결과 (기존 v2-phase-generating, v2-phase-result 유지)
```

**Phase 2 HTML 구조** — `crop.js`의 프레임 구조(`index.html` L82~148)를 기반으로:

```html
<div class="v2-make-layout" id="v2-phase-crop" style="display:none;">
  <div class="v2-crop-container">
    <!-- 크롭 프레임 (crop.js의 frame-container 구조 이식) -->
    <div class="v2-crop-frame" id="v2-crop-frame">
      <img class="v2-crop-photo" id="v2-crop-photo" src="" alt="" draggable="false">
      <svg class="v2-crop-overlay" id="v2-crop-svg">
        <!-- 마스크, 가이드선, 라벨 — crop.js 패턴 그대로 -->
      </svg>
      <div class="v2-crop-pin" id="v2-crown-pin">↕</div>
      <div class="v2-crop-scale" id="v2-scale-handle">⤢</div>
      <div class="v2-crop-badge" id="v2-badge-face"></div>
      <div class="v2-crop-status" id="v2-badge-status"></div>
      <!-- FaceMesh 로딩 -->
      <div class="v2-crop-loading hidden" id="v2-facemesh-loading">
        <div class="v2-spinner"></div>
        <span>얼굴 분석 중...</span>
      </div>
    </div>

    <!-- 수치 4칸 -->
    <div class="v2-crop-metrics">
      <div class="v2-crop-metric"><span>상단</span><span id="v2-m-top">—</span></div>
      <div class="v2-crop-metric"><span>얼굴</span><span id="v2-m-face">—</span></div>
      <div class="v2-crop-metric"><span>하단</span><span id="v2-m-bottom">—</span></div>
      <div class="v2-crop-metric"><span>눈위치</span><span id="v2-m-eye">—</span></div>
    </div>

    <!-- ICAO 범위 바 -->
    <div class="v2-crop-range">
      <div class="v2-range-header">
        <span>ICAO 허용범위</span>
        <span id="v2-range-value"></span>
      </div>
      <div class="v2-range-track">
        <div class="v2-range-fill" id="v2-range-fill"></div>
        <div class="v2-range-dot" id="v2-range-dot"></div>
      </div>
    </div>

    <!-- 경고 -->
    <div class="v2-crop-warn hidden" id="v2-crop-warn"></div>

    <!-- 버튼 -->
    <div class="v2-crop-actions">
      <button class="v2-action-btn v2-btn-retry" id="v2-crop-change">다른 사진</button>
      <button class="v2-action-btn v2-btn-download" id="v2-crop-download">크롭 다운로드 (무료)</button>
      <button class="v2-action-btn v2-btn-retouch" id="v2-crop-check">AI 규정검수 (무료) →</button>
    </div>
  </div>
</div>
```

### 4. 동선 연결

- **업로드 완료** → Phase 1 숨기고 Phase 2(크롭) 표시. FaceMesh 초기화 → 얼굴 감지 → 자동 크롭 배치.
- **"크롭 다운로드"** → 캔버스 크롭 → JPEG blob 다운로드 (무료, 로그인 불필요)
- **"AI 규정검수"** → 크롭된 이미지를 base64로 캡처 → 기존 `/api/idphoto/precheck` 호출 → Phase 3(검수 결과) 표시
- **"다른 사진"** → Phase 1(업로드)로 복귀
- Phase 3 이후 흐름은 기존 V2 결제→생성→결과 그대로 유지 (크롭된 이미지가 원본 대신 전달되도록만 교체)

### 5. CSS

- crop.css의 스타일을 V2 디자인 변수(`--accent: #6c4fff`, `--bg: #f6f7fb` 등)에 맞춰 변환.
- `v2-crop-` 접두어로 네이밍 (기존 crop 클래스와 충돌 방지).
- 크롭 프레임 높이: `400px` (crop.js의 `FH = 400` 유지).
- 모바일 반응형: 프레임 width 100%, 최대 400px.

### 6. MediaPipe FaceMesh CDN

V2 페이지에 아래 스크립트 태그 추가 (크롭 Phase 진입 시 lazy load도 가능하나, 우선 페이지 로드 시 포함):

```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" crossorigin="anonymous"></script>
```

## ⚠️ 준수 조항
- 헌법 4조 3항: 외부 표기는 "MONKOS" 통일.
- ch2: HTML `kebab-case`, JS `camelCase`, 파일 `snake_case`
- **기존 `/crop` 페이지 보존**: `public/crop/` 파일을 수정하지 않는다. V2에 로직을 복제/적응한다.
- 배포 시 `deploy.sh prod` 경유 필수 (ch5 2조).
- V2 URL: `https://monkos.ai/specs/kr-passport` (1-segment, `/kr/` 접두어 없음).
- **⚠️ COMPLETION 보고서 필수 (ch7 1조)**: 완료 시 `monkos-ops/ops/reports/2026-06/COMPLETION_20260625_iMac막내N_SPECSv2_P1_크롭임베드.md` 생성. 터미널 출력만으로 보고 완료 간주 불가.

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | `PF_PORTAL` |
| 마무리 | `배포` |
| 산출물 | render-specs.js 수정 + **COMPLETION 보고서** |
| 문서 유형 | `COMPLETION` |
| 세션 로그 | `[log] 태그 커밋` |
