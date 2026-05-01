---
type: report
date: 2026-05-01
from: iMac/막내2
subject: HUD 다크 크롭앱 프로토타입 — 설계 판단 보고서
order: ORDER_20260501_막내2_HUD크롭앱_프로토타입.md
status: 완료
---

# [2026-05-01 16:00 KST] iMac/막내2 → 작가님

## 1. 프레임워크 선정 근거

### 선택: Vanilla HTML/CSS/JS

| 기준 | Vanilla | Svelte | Preact |
|------|---------|--------|--------|
| 번들 사이즈 | 0KB (순수 코드만) | ~5KB (컴파일 런타임) | ~3KB |
| 빌드 필요 | ❌ 없음 | ✅ 필요 | ✅ 필요 |
| 모바일 성능 | 최적 (오버헤드 0) | 우수 | 우수 |
| 개발 생산성 | 중 | 상 | 상 |
| 즉시 실행 | ✅ index.html 열기만 | ❌ | ❌ |

**결정 이유:**
1. **프로토타입 목적** — 빌드 파이프라인 없이 index.html 열기만으로 즉시 시연 가능
2. **프로덕션 크롭앱과 일관성** — `monkos_AI/crop-app/public/crop.js`가 vanilla JS
3. **5스텝 상태 관리** — 단일 state 객체 + show/hide로 충분, 프레임워크 불필요
4. **CSS 애니메이션 + Web Audio API** — 모두 네이티브 API, 프레임워크 의존성 없음
5. **앱스토어 최종 빌드 시 프레임워크 재선정 가능** — 프로토 단계에서 잠금 불필요

---

## 2. 디자인 토큰 정의

### 색상 (철창이 컨셉 기반)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--bg` | #05080E | 최심층 배경 |
| `--panel` | #0A0F18 | 앱 배경 |
| `--card` | #0D1320 | 카드/입력 배경 |
| `--border` | #162035 | 기본 보더 |
| `--border-hi` | #1E3060 | 강조 보더 |
| `--accent` | #00D4AA | 스캐너 시안/그린 (핵심 액센트) |
| `--warn` | #FFB020 | 경고/비적합 |
| `--fail` | #FF4060 | 실패 |
| `--blue` | #3B82F6 | 보조 (가이드라인) |
| `--purple` | #6C5CE7 | CTA (MONKOS AI 유도) |
| `--text` | #E8EDF5 | 본문 텍스트 |
| `--sub` | #6B7D9A | 보조 텍스트 |
| `--muted` | #3A4B65 | 비활성 텍스트 |

### 타이포그래피

| 역할 | 폰트 | 용도 |
|------|------|------|
| Display | Outfit | 제목, 버튼 라벨 |
| Data/Mono | IBM Plex Mono | 수치, 상태, 배지 |
| Body | Noto Sans KR | 본문, 설명 |

### 간격

| 토큰 | 값 | 용도 |
|------|---|------|
| `--radius-sm` | 6px | 배지, 소형 버튼 |
| `--radius-md` | 12px | 카드, 입력 |
| `--radius-lg` | 16px | 프리뷰, 대형 카드 |
| `--radius-xl` | 24px | 앱 외곽 (데스크톱) |

---

## 3. 스텝별 와이어프레임 설명

### Step 1 — 국가 + 문서 선택
- 검색 바(국가 필터링) + 국기 카드 리스트
- 각 카드: 국기 + 국가명(현지어+영어) + 사이즈 패턴 배지(35×45, 51×51, 50×70)
- 국가 선택 시 문서 유형 서브패널(여권/비자/증명사진) 슬라이드
- 문서 카드: 아이콘 + 명칭 + 표준 + 사이즈/px 표시
- 14개국 데이터 내장 (PF_CROP 4패턴 대표국)

### Step 2 — 사진 업로드
- 3:4 업로드 영역에 가이드 실루엣(얼굴 타원 + 눈 위치 + 중심선)
- 카메라 아이콘 + "Tap to select photo" CTA
- 드래그&드롭 지원
- 하단 촬영 팁 카드(정면, 조명, 표정, 배경)
- 선택 규격 정보 바(국기 + 규격명 + px)

### Step 3 — 배경 제거
- 3:4 프리뷰에 업로드 이미지 표시
- 프로세싱 오버레이(스피너 + 프로그레스 바) — 모의 진행률
- 배경색 선택 버튼(흰/회/블루/빨강/파랑)
- "Continue to Crop" 진행 버튼

### Step 4 — 크롭 조정 + MONKOS 검수
- 크롭 뷰포트: 이미지 위에 시안 프레임(규격 비율 반영) + 모서리 마커
- 터치 드래그로 위치 보정 가능
- **"MONKOS Inspection" 버튼** → 검수 연출 시퀀스 트리거
- 검수 시퀀스 (총 ~7초):
  1. 스캔 라인 (위→아래, 1.5초)
  2. 눈 점 + 대시라인 → "Tilt 0.3° — OK ✓" 플로팅 텍스트
  3. 중심선 + 얼굴 타원 → "Frontal Check ✓"
  4. 밝기 스캔 (좌→우) → "Brightness Uniform ✓"
  5. 크라운/턱 라인 → "34.0mm — ICAO Range ✓"
  6. 메트릭 행 순차 등장 (7항목 × 200ms)
  7. 최종 판정: PASS → VERIFIED 스탬프 / WARN → 보정 유도
- 메트릭 패널: 상태 아이콘 + 라벨(한/영) + 진행 바 + 수치
- 판정 요약 카드 (적합/부적합)
- Web Audio API 사인파 효과음 (scan, tick, pass, warn)

### Step 5 — 완료 + 퍼널
- 체크 애니메이션 + "Crop Complete" 타이틀
- 결과 프리뷰(시안 보더 + 글로우)
- PASS/STANDARD 배지
- Download (Free) 버튼
- "Crop Another Spec" 버튼
- 퍼널 카드 2장:
  - ① 편의점 인화 (텔레그램 공유, Web Share API)
  - ② AI Professional Photo (MONKOS AI 유도, 보라색 CTA)

---

## 4. 기술 구현 상세

### 파일 구조

```
apps/crop-app/
├── index.html    (HTML 구조, 5스텝 섹션)
├── style.css     (디자인 토큰 + 레이아웃 + 애니메이션)
├── app.js        (상태 관리 + 이벤트 + 검수 시퀀스 + 오디오)
└── REPORT_HUD프로토_설계판단.md  (본 문서)
```

### 주요 기술 선택

| 항목 | 구현 |
|------|------|
| 상태 관리 | 단일 `state` 객체 + `goToStep()` 함수 |
| 스텝 전환 | CSS class toggle (`active`) + `@keyframes stepIn` |
| 검수 애니메이션 | CSS animations + JS `setTimeout` 시퀀스 체이닝 |
| 효과음 | Web Audio API `OscillatorNode` (사인파/삼각파) |
| 터치 드래그 | `touchstart/move/end` 이벤트 |
| 스와이프 내비 | 수평 80px 이상 드래그 감지 |
| 반응형 | 모바일 퍼스트 (375px~), 데스크톱 768px+ |
| 검색 | `input` 이벤트 → 국가 리스트 실시간 필터링 |

### 검수 메트릭 (더미 데이터)

| 항목 | 키 | 적합 기준 |
|------|---|----------|
| 눈 수평 | `eye_angle` | < 2.0° |
| 눈 높이 | `eye_height` | 50–70% |
| 얼굴 비율 | `face_ratio` | 60–80% |
| 좌우 대칭 | `symmetry` | ≥ 88% |
| 얼굴 중심 | `center` | < 3.0px |
| 고개 기울기 | `head_tilt` | < 2.0° |
| 밝기 균일 | `brightness` | ≥ 80% |

---

## 5. 제안사항

### 즉시 적용 가능
1. **i18n**: 현재 영어 기본 — `navigator.language` 기반 한/일/영 분기 추가 (기존 `monkos_AI/crop-app` 패턴 준용)
2. **specs-data.json 연동**: 더미 데이터 → Phase 1.5의 specs-data-v2.json import로 전환
3. **검수 연출 타이밍 조정**: 현재 ~7초 — 사용자 테스트 후 속도감 튜닝

### 프로덕션 전환 시
4. **FaceMesh 실연동**: 더미 메트릭 → MediaPipe FaceMesh 실측값 교체
5. **@imgly 배경 제거**: 모의 프로그레스 → ISNet ONNX 실제 처리
6. **Canvas 크롭 엔진**: 현재 CSS 프레임 표시만 → Canvas drawImage 실제 크롭 + 다운로드
7. **PWA 전환**: manifest.json + Service Worker 추가 (기존 `monkos_AI/crop-app` 패턴)
8. **앱스토어 패키징**: TWA(Android) / Capacitor(iOS)

### 디자인 개선
9. **스텝 간 전환**: 현재 좌→우 슬라이드만 — 뒤로 갈 때 우→좌 역방향 추가
10. **검수 연출 강화**: 눈 점 위치를 실제 얼굴 좌표 기반으로 (FaceMesh 연동 후)
11. **햅틱 피드백**: `navigator.vibrate()` — 검수 통과/실패 시 진동

---

## 6. 시각 검증 결과

| 스텝 | 항목 | 상태 |
|------|------|------|
| Step 1 | 국가 리스트 + 검색 + 패턴 배지 | ✅ |
| Step 1 | 문서 유형 서브패널 전환 | ✅ |
| Step 2 | 가이드 실루엣 + 업로드 CTA + 팁 | ✅ |
| Step 2 | 규격 정보 바 | ✅ |
| Step 3 | 이미지 프리뷰 + 배경색 선택 | ✅ |
| Step 3 | 프로세싱 오버레이 애니메이션 | ✅ |
| Step 4 | 크롭 프레임 (비율 반영) + 모서리 마커 | ✅ |
| Step 4 | MONKOS Inspection 버튼 | ✅ |
| Step 4 | 검수 연출 — 스캔 라인 | ✅ |
| Step 4 | 검수 연출 — 눈 점/라인/플로팅 텍스트 | ✅ |
| Step 4 | 검수 연출 — 메트릭 순차 등장 | ✅ |
| Step 4 | VERIFIED 스탬프 | ✅ |
| Step 4 | ANALYSIS COMPLETE + PASS 배지 | ✅ |
| Step 5 | 완료 체크 + 결과 프리뷰 | ✅ |
| Step 5 | Download + Another Spec 버튼 | ✅ |
| Step 5 | 퍼널 카드 (텔레그램 + MONKOS AI) | ✅ |
| 공통 | 프로그레스 바 스텝 추적 | ✅ |
| 공통 | HUD 다크 디자인 톤 | ✅ |
| 공통 | Web Audio 효과음 | ✅ |
| 공통 | 모바일 반응형 (375px~) | ✅ |

---

## ⚠️ 준수 조항 확인

- [x] 헌법 4조 2항: 파괴적 명령 미사용
- [x] `monkos_AI/crop-app/` 수정 없음 (보존)
- [x] 헌법 4조 3항: 외부 노출 문서에 내부 호칭 없음 (MONKOS 통일)
- [x] `apps/crop-app/benchmark/` 미접촉 (막내1 작업 영역 보존)
