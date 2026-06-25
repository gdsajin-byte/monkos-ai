---
type: design
date: 2026-06-25
author: iMac/쌍아
portfolio: PF_PORTAL
status: 초안
---

# 설계서: Specs v2 — 크롭앱 기반 동선 재설계

**[2026-06-25 15:32 KST]** iMac/쌍아 → 작가님

## 1. 현행 vs 제안

### 현행 (V2 rev 00366)
```
업로드 → Gemini 규정검수(precheck) → 결제(₩2,000/10c) → Gemini I2I 생성 → 결과 다운로드
```
- 크롭앱 로직 미사용. 업로드 원본을 바로 Gemini에 전달.
- 규격 맞춤(크롭)이 없음 — AI 생성에 전적 의존.

### 제안 (작가님 구상)
```
[규격 선택 완료 상태로 진입]
    ↓
Phase 1: 업로드 → 크롭앱 자동 (FaceMesh 얼굴감지 + 규격맞춤)
    ↓
Phase 2: 정수리 수동 미세조정 (반자동)
    ↓
Phase 3: 무료 분기
    ├─ 크롭 다운로드 (무료) ← 여기서 이탈해도 OK (재방문·구전)
    └─ AI 규정검수 (무료) → 검수 결과 확인
         ↓
Phase 4: AI 리터칭 (₩2,000 or 10c)
    → 배경보정 + 조명 + 피부 + 규격 정밀 맞춤
    → 다운로드 + 완성
         ↓
Phase 5: 프리미어 업셀 (₩9,900)
    → "스튜디오 검수 + 발급보장"
    → 전문가 최종 확인 + 반려 시 재촬영 무료
```

## 2. 기술 설계

### 2-1. 크롭앱 통합 방식

**현재 자산:**
- `/crop` = 독립 페이지 (`public/crop/index.html` + `crop.js` + `crop.css`)
- `crop.js` (1,158줄) — MediaPipe FaceMesh 기반, 순수 JS
- 규격 데이터: `SPECS` 객체 (passport: 35×45mm, id: 30×40mm 2종만 하드코딩)

**통합 전략: 크롭 로직을 모듈로 추출 → V2 인라인 호출**

```
crop.js의 핵심 함수들:
├─ FaceMesh 초기화 + 얼굴 감지 (onFaceMeshResults)
├─ 크롭 프레임 계산 (recalc → crown/chin/eye 좌표 → mm 환산)
├─ 정수리 드래그 (crownPin 이벤트)
├─ 스케일 조정 (scaleHandle 이벤트)
├─ 캔버스 크롭 출력 (generateCroppedCanvas)
└─ ICAO 유효성 판정 (isBlocked, getFaceColor)
```

**방안 A (권장): crop.js를 V2에 직접 임베드**
- V2 Phase 1~2에 크롭 UI(프레임 + 오버레이 + 핀) 삽입
- `SPECS` 객체를 specs-data.json에서 동적 주입 (현재 2종 → 전 스펙 확장 가능)
- crop.css를 V2 스타일 변수(`--accent`, `--bg` 등)에 맞춤

**방안 B: iframe 임베드**
- `/crop?spec=kr-passport&embed=1` 파라미터로 독립 페이지 호출
- postMessage로 크롭 결과(base64) 수신
- 단점: 스타일 통일 어려움, 모바일 스크롤 이슈

### 2-2. 규격 동적 주입

현재 `crop.js`의 `SPECS`:
```js
const SPECS = {
  passport: { wMm: 35, hMm: 45, faceMin: 32, faceMax: 36, ... },
  id:       { wMm: 30, hMm: 40, faceMin: 24, faceMax: 32, ... },
};
```

V2에서는 `specs-data.json`의 해당 스펙 데이터를 서버에서 주입:
```js
const V2_CROP_SPEC = {
  wMm: parseFloat(specData.size.split('×')[0]),  // 3.5 → 35
  hMm: parseFloat(specData.size.split('×')[1]),  // 4.5 → 45
  faceMin: specData.faceMin || 32,  // ICAO 기본값
  faceMax: specData.faceMax || 36,
  pxW: parseInt(specData.pixels.split('×')[0]),
  pxH: parseInt(specData.pixels.split('×')[1]),
  dpi: specData.dpi,
};
```

→ specs-data.json에 `faceMin`/`faceMax` 필드 추가 필요 (ICAO 기준 대부분 동일하지만 일부 국가 예외 있음)

### 2-3. 가격 체계

| 단계 | 가격 | 무엇을 받나 |
|------|------|------------|
| 크롭 다운로드 | 무료 | 규격 맞춤 크롭 원본 (보정 없음) |
| AI 규정검수 | 무료 | PASS/FAIL 판정 + 항목별 결과 |
| AI 리터칭 | ₩2,000 / 10c | 배경·조명·피부 보정 완성본 |
| 프리미어 | ₩9,900 | 스튜디오 검수 + 발급보장 |

**가격 사다리 정합 확인:**
- 단건 리터칭 ₩2,000 > 크레딧 단가 ₩1,225 (10c/40c팩) → 크레딧 업셀 유인 유지
- 프리미어 ₩9,900 = 현재 idphoto-kr 정가와 동일 → 기존 서비스 카니발라이즈 없음

### 2-4. AI 규정검수 — Gemini 동적 프롬프트

```
검수 대상: {countryName} {typeName} ({size})
크롭 완료 이미지를 기준으로 아래 항목을 PASS/FAIL 판정:

[정성 판단 — Gemini]
1. 배경: {background} 균일 여부
2. 표정: 무표정·입다물기 여부
3. 안경: 반사·색 렌즈 여부
4. 복장: 모자·스카프·군복 여부
5. 조명: 그림자·역광 여부
6. 선명도: 흐림·노이즈 여부

[정량 판단 — 코드 (크롭앱 계측값 활용)]
7. 얼굴 비율: {faceMin}~{faceMax}mm 이내
8. 눈 위치: 40~48% 이내
9. 좌우 중심: ±2mm 이내
```

→ 정성(1~6)은 Gemini, 정량(7~9)은 크롭앱이 이미 계산한 값 재활용. Gemini에 이중 부담 안 줌.

### 2-5. 프리미어 (₩9,900) — 운영 설계

- 최초 버전: AI 리터칭 결과 + "발급보장" 라벨 + 환불 정책 명시
- 향후: 작가님 수동 검수 큐 (어드민 대시보드에서 승인/반려)
- 발급보장 = "이 결과로 반려되면 1회 무료 재촬영" → CS 정책으로 구현 (코드 아닌 운영)

## 3. 구현 단계

| Phase | 내용 | 난이도 | 선행 |
|-------|------|--------|------|
| **P1** | crop.js 핵심 로직을 V2에 인라인 삽입 (업로드→크롭→정수리조정→크롭다운로드) | 중 | 없음 |
| **P2** | AI 규정검수 — 기존 precheck를 크롭 결과 이미지 기반으로 전환 + 동적 프롬프트 | 중 | P1 |
| **P3** | AI 리터칭 결제 연동 (₩2,000 토스 / 10c 크레딧) | 중 | P2 |
| **P4** | 프리미어 업셀 UI + 결제 (₩9,900) | 하 | P3 |
| **P5** | specs-data.json faceMin/faceMax 필드 전 스펙 확장 | 하 | P1 |

**P1만 완성되면 "무료 크롭" 가치 제공 시작** — 나머지는 순차 적층.

## 4. 리스크

1. **crop.js FaceMesh CDN 의존** — MediaPipe CDN 장애 시 얼굴 감지 불가. 자체 호스팅 검토 필요.
2. **모바일 정수리 드래그 UX** — 현재 crop.js에 터치 이벤트 구현되어 있으나 V2 레이아웃 안에서 충돌 가능성.
3. **전 스펙 ICAO 값 부재** — faceMin/faceMax가 specs-data.json에 없음. 대부분 ICAO 표준(32~36mm)이지만 미국(25~35mm), 중국(28~33mm) 등 예외 있어 데이터 보강 필요.
