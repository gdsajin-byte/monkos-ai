---
type: task
from: M1/쌍아
to: 막내(any)
date: 2026-02-17 13:16 KST
status: pending
tags: [sharp, image-pipeline, kr, code-mod]
---

# 막내 지시서: sharp/compressImage 삭제 (KR)

## 배경

2/17 새벽 세션(04:49~04:53)에서 확정된 이미지 파이프라인 결정:

- **근본 문제**: iPhone Pro Max 대용량 이미지 → 서버에서 sharp로 다운사이즈하는 우회책이었음
- **근본 해결**: 클라이언트가 처음부터 출력 제한 (getUserMedia max constraint)
- **결정**: 서버 sharp 삭제, 클라이언트에서 1024px + JPEG 85%로 캡처

### 확정 스펙

```
클라이언트:
  getUserMedia: ideal 1024, max 1280 (Safari 강제)
  최종 캡처: 1024px, JPEG 85%

서버:
  sharp: 삭제 (package.json에서도 제거)
  입력 사이즈 검증만 (2MB 상한)
  compressImage 함수: 삭제
```

## 작업 범위

```
monkos_AI/idphoto-kr/
├── server.js          ← sharp 사용부 삭제, compressImage 삭제
├── package.json       ← sharp 의존성 제거
└── public/index.html  ← getUserMedia constraints 확인 (변경 필요 시)
```

**JP는 건드리지 마** — JP에는 이미 sharp가 없음 (원래 없었음)

## 작업 순서

### STEP 1: 현황 파악 (수정 전)

server.js에서 아래 항목의 **정확한 위치와 의존 관계** 파악:

1. `require('sharp')` 또는 `import sharp` — 위치
2. `compressImage` 함수 — 정의 위치, 호출 위치 전수
3. sharp를 사용하는 모든 코드 — resize, compress, format 변환 등
4. 이미지 업로드/처리 라우트에서 sharp 의존 흐름

### STEP 2: sharp 관련 코드 삭제

1. `compressImage` 함수 **정의** 삭제
2. `compressImage` 함수 **호출부** 삭제 (직접 데이터 패스스루로 변경)
3. `require('sharp')` 삭제
4. sharp 사용하는 기타 코드 삭제

### STEP 3: 입력 검증 추가 (sharp 대체)

sharp 삭제 후 서버에 최소 검증만 남김:

```javascript
// 이미지 사이즈 검증 (2MB 상한)
if (imageBuffer.length > 2 * 1024 * 1024) {
  return res.status(400).json({ error: '이미지 크기가 2MB를 초과합니다' });
}
```

### STEP 4: package.json에서 sharp 제거

```bash
cd monkos_AI/idphoto-kr && npm uninstall sharp
```

또는 package.json에서 수동 삭제 후 `npm install`.

### STEP 5: 클라이언트 constraints 확인

`public/index.html`에서 getUserMedia constraints 확인:

```javascript
// 목표값 (이미 설정되어 있을 수 있음):
video: {
  width: { ideal: 1024, max: 1280 },
  height: { ideal: 1024, max: 1280 },
  facingMode: 'user'
}
```

- 이미 설정되어 있으면 → 변경 없음
- 설정이 다르면 → 위 값으로 수정
- 캡처 시 JPEG 85% 확인

### STEP 6: 동작 확인

- server.js에서 `sharp` 문자열이 완전히 제거되었는지 grep
- `compressImage` 문자열이 완전히 제거되었는지 grep
- package.json에서 sharp 의존성이 제거되었는지 확인
- node_modules/sharp/ 디렉토리 삭제 확인

## 주의사항

- **JP 코드 절대 수정 금지** — KR만 작업
- sharp 삭제 시 이미지 처리 흐름이 끊기지 않도록 주의
  - sharp가 처리하던 데이터를 그대로 다음 단계로 패스스루
  - `compressImage(buffer)` → `buffer` (직접 전달)
- 배포하지 마 — 코드 수정 + 커밋만
- 커밋 메시지: `[idphoto-kr] sharp/compressImage 삭제 — 클라이언트 사이드 이미지 처리로 전환`

## 완료 보고

```
✅ 삭제: sharp require, compressImage 함수(정의/호출), package.json 의존성
✅ 추가: 이미지 사이즈 검증 (2MB 상한)
✅ 확인: 클라이언트 constraints (1024/1280/JPEG85)
📁 변경 파일: server.js, package.json, (index.html 필요 시)
🔀 커밋: [해시]
```
