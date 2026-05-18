---
type: ORDER
date: 2026-03-12
from: iMac/쌍아
to: 막내
subject: 크롭앱 vanilla JS 전환 구현 — 단일 페이지 앱 (브라우저 테스트용)
priority: high
category: 구현
---

# 지시서: 크롭앱 vanilla JS 전환 구현

> **[2026-03-12 11:47 KST] iMac/쌍아 → 막내**

---

## 배경

철창이 React 프로토 v4 (467줄)가 완성되었고, 작가님이 직접 테스트하여 UI/UX를 확인했다. 이를 프로젝트 기술 스택(vanilla HTML + JS)으로 전환하여 **단일 페이지 앱**으로 브라우저에서 독립 테스트 가능하게 구현한다.

향후 증명앱(idphoto-kr)과 연동할 예정이나, 현 단계는 **독립 실행 + 브라우저 테스트**가 목표다.

## 참조 파일 (반드시 Read)

### 프로토 원본
- **`~/Desktop/쌍아/MONKOS_크롭앱_v4.jsx`** — 철창이 React 프로토 v4 (467줄)

### 분석 보고서
- `monkos-ops/ops/reports/2026-03/REPORT_20260312_막내3_크롭앱_프로토분석.md` — vanilla 전환 방안 상세
- `monkos-ops/ops/reports/2026-03/REPORT_20260312_막내1_크롭앱_정밀분석.md` — crop-engine 코드 분석

### 설계 결정
- `monkos-ops/ops/sessions/2026-03-12_M1_쌍아.md` — 크롭앱 설계 확정 세션

### 관련 코드
- `monkos_AI/crop-engine/` — server.js, lib/crop.js, lib/face-detect.js, specs/formats.js

---

## 산출물

### 파일 구조
```
monkos_AI/idphoto-kr/public/
├── crop.html        # 크롭 페이지 HTML + SVG 구조
├── crop.js          # 메인 로직 (상태관리, 드래그, 수치계산)
└── crop.css         # 스타일 (다크 테마)
```

기존 idphoto-kr 패턴(camera.html+js, prep.html+js, result.html+js)과 **동일 레벨** 배치.

---

## 구현 범위

### 1. 프로토 v4 기능 전환 (vanilla JS)

프로토의 24개 기능을 vanilla HTML + JS + CSS로 전환한다.

**React → vanilla 전환 원칙:**
- `useState` → 변수 + `render()` 함수로 DOM 갱신
- `useRef` → `document.getElementById()`
- `useCallback/useEffect` → `addEventListener` + 초기화 함수
- JSX → HTML 정적 구조 + JS 동적 갱신
- JSX 조건부 렌더 → `classList.toggle` 또는 `style.display`
- SVG 오버레이 → HTML에 정적 SVG 선언, JS에서 `setAttribute`로 좌표 갱신

### 2. 임시 업로드 기능 (개발/테스트용)

- 사진 업로드 탭을 **임시로** 열어둔다 (file input)
- 브라우저에서 단독 실행하여 테스트 가능하도록
- 향후 증명앱 연동 시 → 업로드 제거, 앱 내부 파일 전달로 전환 예정
- 샘플 이미지도 유지 (프로토 패턴 그대로)

### 3. 수치 피드백 — 3단계 색상 체계 ⭐ 변경사항

프로토의 2단계(초록/빨강)를 **3단계**로 변경한다.

#### 얼굴 크기 (정수리~턱)

| 구간 | 색상 | 의미 |
|------|------|------|
| 33~35mm | 녹색 | 최적 |
| 32~33mm, 35~36mm | 노랑 | 허용 (경계) |
| 32mm 미만, 36mm 초과 | 오렌지/레드 | 범위 이탈 |

#### 눈 위치

| 구간 | 색상 | 의미 |
|------|------|------|
| 43~45% | 녹색 | 최적 |
| 40~43%, 45~48% | 노랑 | 허용 |
| 40% 미만, 48% 초과 | 오렌지/레드 | 범위 이탈 |

### 4. 다운로드 차단 로직 ⭐ 변경사항

- **오렌지/레드 구간이 하나라도 있으면**: 다운로드 버튼 비활성화 + 미달 내용 텍스트 제시
- **노랑 이상**: 다운로드 허용 (경고 표시는 유지)
- 미달 내용 예시: "얼굴 크기 31.2mm — 허용범위(32~36mm) 미달. 사진을 확대하세요."

### 5. 정수리 디폴트값

- **눈~턱 1:1 반전** 방식으로 초기 정수리 위치 자동 배치
- 사용자가 정수리 핀을 드래그하여 최종 확정
- 턱끝 핀은 고정 (조정 불가)

### 6. 타원 가이드 연동

- 정수리 핀 이동 시 **가이드 타원도 함께 변형** (crown 좌표 = 타원 상단점)
- 8점 스플라인 타원 로직은 프로토 그대로 이식 (cp=0.55 cubic bezier)

### 7. 스케일 핸들

- 사각 모서리 확장/축소 버튼 (프로토 구현 유지)
- 드래그 시 사진 + 오버레이 연동 스케일

### 8. 기존 프로토 기능 유지

- 규격 탭 전환 (여권/반명함)
- 상하 마스크 (반투명)
- 정수리/턱끝/눈 가이드선
- 우측 치수선
- 동공 포인트 마커
- 실시간 mm 수치 패널 (4칸: 상단/얼굴/하단/눈위치)
- faceMm 배지, 규격 범위 배지, 스케일 표시
- ICAO 범위 바 (게이지)
- 범례 패널
- 규격 정보 테이블
- 다운로드 모달 (바텀시트) + 동의 체크박스

### 9. FaceMesh 브라우저 실행 — 미포함

- 현 단계에서 FaceMesh 브라우저 연동은 **범위 밖**
- SAMPLE_POINTS (하드코딩 좌표)로 동작
- FaceMesh 연동은 후속 지시서에서 별도 처리

### 10. crop-engine API 연동 — 미포함

- 다운로드 실행부는 **alert 스텁 유지** 또는 **클라이언트 사이드 Canvas 크롭**으로 임시 구현
- crop-engine API 연동은 배포 완료 후 별도 처리

---

## 기술 주의사항

- **빌드 도구 없음**: 순수 HTML + JS + CSS, 번들링/트랜스파일 없음
- **모바일 대응**: `touch-action: none` (프레임 영역), 터치 영역 44px 이상 (WCAG)
- **Pointer Events API 사용**: 마우스 + 터치 통합 처리
- **CSS 변수**: 색상 팔레트는 CSS custom properties로 관리
- **SPECS 데이터**: 프로토의 SPECS 객체를 JS 상수로 유지 (향후 `/api/specs`에서 fetch로 전환 예정)

---

## ⚠️ 준수 조항

- 헌법 제1조: 타임스탬프 `date` 명령으로 취득
- 헌법 제2조: 완료 보고 형식 준수
- 법률 6장 1조: 기본 브랜치 `main`
- **코드 변경은 crop.html, crop.js, crop.css 신규 생성만** — 기존 파일 수정 없음

---

**— iMac/쌍아 지시 완료 —**
