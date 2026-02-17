---
type: spec
from: 쌍아
date: 2026-02-17 15:38 KST
status: approved
tags: [idphoto-kr, refactoring, plan-b, architecture]
---

# Plan B 기술명세: idphoto-kr 컴포넌트 분해 리팩토링

## 1. 경위

### 문제
00079 리비전(2/16 09:35) 이후 **8회 연속 배포 실패**. 모든 새 빌드에서 카메라 오류 발생.

### 시도한 것
| # | 시도 | 결과 |
|---|------|------|
| 1 | 난독화 CFG OFF | ❌ |
| 2 | 난독화 완전 제거 | ❌ |
| 3 | getUserMedia 해상도 원복 | ❌ |
| 4 | package-lock.json 추적 + npm ci | ❌ |
| 5 | 00079 코드 재빌드 | ❌ (의존성 플로팅 → 서버 크래시) |
| 6 | 00079 의존성 역추출 + 버전 핀 고정 | ❌ |

### 결론
- 의존성 문제는 **핀 고정으로 해결** (서버는 healthy)
- 난독화 문제는 **제거로 해결**
- **카메라 오류는 코드 변경에 기인** — 00079→현재 사이의 index.html 250줄 변경분에 원인 존재
- 단일 파일(index.html) 2,437줄 모놀리스 → 변경 시 사이드 이펙트 추적 불가
- **매달리지 말고 구조를 바꾼다**

## 2. 현재 구조 (모놀리스)

```
monkos_AI/idphoto-kr/
├── server.js          (764줄) — HTTP + WebSocket + Gemini Live + Imagen + QC
├── public/
│   └── index.html     (2,437줄) — HTML + CSS + JS 올인원
├── package.json
├── package-lock.json
└── Dockerfile
```

### index.html 내부 구조 (추정 섹션)
```
[1-100]     meta, OG, structured data
[100-600]   CSS 전체 (~500줄)
[600-1100]  HTML 구조 (prep, camera, result, thankyou)
[1100-2437] JavaScript 전체 (~1,337줄)
  ├── 전역 변수, 상수
  ├── 인증/로그인 (Google, 카카오)
  ├── WebSocket / Gemini Live 연결
  ├── 카메라 (getUserMedia, 캡처, 가이드라인)
  ├── 준비화면 (성별/연령/용도 선택)
  ├── 생성 요청 (REST API → Imagen)
  ├── QC 결과 표시
  ├── 다운로드/저장 (autoSave, showComplete)
  ├── Thank you 화면
  ├── 크레딧 관리
  └── 공유/이벤트
```

## 3. 목표 구조 (컴포넌트 분해)

```
monkos_AI/idphoto-kr/
├── server.js              (유지, 최소 변경)
├── public/
│   ├── index.html         (HTML 골격 + CSS만, <script src> 로딩)
│   ├── css/
│   │   └── app.css        (전체 스타일)
│   ├── js/
│   │   ├── app.js         (진입점 — 초기화, 라우팅)
│   │   ├── auth.js        (Google/카카오 인증, 세션)
│   │   ├── camera.js      (getUserMedia, 스트림, 캡처, 가이드라인)
│   │   ├── ws.js          (WebSocket 연결, Gemini Live 메시지 처리)
│   │   ├── generate.js    (Imagen REST 요청, QC 표시)
│   │   ├── download.js    (저장, autoSave, showComplete, confetti)
│   │   ├── credits.js     (크레딧 표시, 차감, 공유보너스)
│   │   ├── ui.js          (화면 전환, 준비화면, DOM 유틸)
│   │   └── config.js      (상수, API 엔드포인트, 스타일 맵)
│   └── images/
├── package.json
├── package-lock.json
└── Dockerfile
```

### 분해 원칙

1. **00079 기준 코드로 시작** — 현재 코드(X), 00079 작동 코드(O)를 베이스로 분해
2. **기능 변경 제로** — 분해만, 새 기능 추가 없음
3. **1파일 1책임** — 각 JS 파일은 하나의 도메인만 담당
4. **전역 최소화** — `window.monkos = {}` 네임스페이스로 공유 상태 관리
5. **의존 방향 단방향** — config ← auth ← camera ← ws ← generate ← download

## 4. 파일별 상세 명세

### 4-1. config.js
```
역할: 상수, 설정값, API 경로
exports: STYLES, API_URLS, SPEC_MAP, PREP_OPTIONS
의존: 없음
```

### 4-2. auth.js
```
역할: Google/카카오 OAuth, 세션 관리, userId/userCredits 상태
exports: initAuth(), loginGoogle(), loginKakao(), logout(), getUserId(), getUserCredits()
의존: config.js
DOM: loginSection, headerCredits
```

### 4-3. camera.js
```
역할: getUserMedia, 비디오 스트림, 캡처, 가이드라인 오버레이
exports: initCamera(), startCamera(), stopCamera(), capturePhoto(), toggleCamera()
의존: config.js
DOM: video, canvas, cameraScreen, guideOverlay
핵심 주의: 이 파일이 카메라 오류의 핵심 — 00079 코드 그대로 추출
```

### 4-4. ws.js
```
역할: WebSocket 연결 (Gemini Live), 코칭 메시지 수신/표시
exports: connectWS(), disconnectWS(), sendFrame(), onCoachingMessage()
의존: config.js, camera.js (프레임 전송)
DOM: coachingBubble, voiceButton
```

### 4-5. generate.js
```
역할: Imagen REST API 호출, QC 결과 수신/표시
exports: requestGenerate(), displayQCResult()
의존: config.js, auth.js (크레딧), camera.js (캡처 이미지)
DOM: resultScreen, qcBadge, qcChat, specResult
```

### 4-6. download.js
```
역할: 이미지 저장, 다운로드 UX
exports: downloadResult(), autoSave(), showComplete(), showSaveGuide()
의존: config.js, auth.js (크레딧 차감)
DOM: thankyouScreen, tyPreview, confettiContainer
```

### 4-7. credits.js
```
역할: 크레딧 표시, 업데이트, 공유보너스
exports: updateCreditBadge(), checkShareBonus()
의존: auth.js
DOM: headerCredits, postCreditMsg
```

### 4-8. ui.js
```
역할: 화면 전환, 준비화면 로직, DOM 유틸
exports: showScreen(), initPrep(), selectGender(), selectAge(), selectStyle()
의존: config.js
DOM: prepScreen, cameraScreen, resultScreen, thankyouScreen
```

### 4-9. app.js (진입점)
```
역할: 모듈 초기화, 이벤트 바인딩, 전역 에러 핸들링
imports: 위 모든 모듈
실행순서: config → auth → ui → camera → ws → (사용자 상호작용)
```

### 4-10. index.html
```
역할: HTML 구조 + CSS 링크 + JS 모듈 로딩만
<link rel="stylesheet" href="/css/app.css">
<script type="module" src="/js/app.js"></script>
줄 수 목표: ~300줄 (HTML 골격만)
```

## 5. 마이그레이션 전략

### Phase 1: 00079 코드 추출 (베이스라인)
```bash
# 00079 시점 파일을 별도 디렉토리에 추출
git show 93581f3:monkos_AI/idphoto-kr/public/index.html > /tmp/index_00079.html
git show 93581f3:monkos_AI/idphoto-kr/server.js > /tmp/server_00079.js
```
- 이 파일들이 리팩토링의 **유일한 소스**
- 현재 코드의 UX 개선(confetti, QC챗 등)은 Phase 3에서 재적용

### Phase 2: 분해 (기능 변경 없음)
1. index.html에서 CSS 추출 → `css/app.css`
2. index.html에서 JS 추출 → 도메인별 js/ 파일
3. index.html은 HTML 골격만 남김
4. **매 파일 분해 후 즉시 배포 테스트** (카메라 작동 확인)
5. 전체 분해 완료 시 전 기능 회귀 테스트

### Phase 3: UX 개선 재적용
- confetti 애니메이션 → download.js
- QC 컨시어지 챗 → generate.js
- 헤더 간소화 → ui.js + index.html
- autoSave/showComplete → download.js
- **각 기능을 개별 커밋으로, 매 커밋 후 배포 테스트**

### Phase 4: 신규 기능
- Thank you 로직 강화
- 챗 활성화
- JP 동기화

## 6. 서버 변경 사항

### server.js 정적 파일 서빙 확장
현재 `public/` 전체를 서빙하므로 `js/`, `css/` 서브디렉토리도 자동 서빙됨.
**server.js 변경 불필요** — 기존 정적 파일 서빙 로직이 재귀적으로 작동.

### sharp 복원 여부
- Phase 2에서는 **00079 코드 기준**이므로 sharp 포함
- 추후 판단: 유지 or extractBase64 전환

## 7. 위험 관리

| 위험 | 대응 |
|------|------|
| 분해 시 전역 변수 참조 깨짐 | `window.monkos` 네임스페이스, 명시적 import/export |
| ES Module CORS | server.js가 로컬 서빙하므로 무관 |
| 캐시 문제 | 파일명에 해시 없으므로 Cache-Control 헤더 추가 검토 |
| iOS Safari 호환성 | `type="module"`은 iOS 11+ 지원, 문제없음 |
| 00079 서버 코드에 sharp 필요 | package.json에 sharp 재추가, Dockerfile 그대로 |

## 8. 성공 기준

- [ ] 분해 후 00079과 동일한 사용자 경험 (카메라, 코칭, 생성, 다운로드)
- [ ] 포털 → idphoto-kr 정상 플로우 작동
- [ ] 각 JS 파일 200줄 이내
- [ ] index.html 300줄 이내
- [ ] 전 브라우저 테스트 (Chrome, Safari, Samsung Internet)

## 9. 현재 인프라 상태 (리팩토링 시작 시점)

- **프로덕션**: 00079-tpk (100% 트래픽) — 절대 건드리지 않음
- **브랜치**: main (핀 고정 완료 상태)
- **의존성**: @google/genai 1.41.0, ws 8.19.0, firestore 7.11.6 (핀 고정)
- **난독화**: 비활성화 (Dockerfile에서 주석 처리)
- **deploy.sh**: prod/dev 분리 완료

## 10. 작업 지시 (새 세션용)

```
이 명세서(docs/monkos/SPEC_PLANB_idphoto_refactoring.md)를 읽고
Phase 1부터 순서대로 실행하라.

규칙:
1. 00079 코드(93581f3)를 베이스로 분해. 현재 코드 사용 금지.
2. 매 파일 분해 후 로컬 검증 (node server.js → 브라우저 테스트)
3. Phase 2 완료 전까지 UX 개선 코드 적용 금지
4. 커밋 단위: 파일 1개 분리 = 커밋 1개
5. 배포는 Phase 2 전체 완료 후 작가님 승인 시에만
```
