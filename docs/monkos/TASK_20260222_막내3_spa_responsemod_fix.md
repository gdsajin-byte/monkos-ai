# 지시서: SPA /api/generate responseModalities 제거

> [2026-02-22 17:20 KST] iMac/쌍아 → 막내3

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 헌법 제6조 (인프라 보호): API 키/인증 변경 없음
- 법률 제2장 (코딩 규칙): 위험요소 제거

## 배경
server.js의 SPA 호환 `generatePhoto()` 함수 (L420~)에서 `responseModalities: ['TEXT', 'IMAGE']`를 사용 중. MPA `/api/idgen`의 raw fetch에서는 이미 제거했으나 SDK 호출에 남아있음.

MEMORY.md 교훈: "gemini-3-pro-image-preview I2I에서 `responseModalities: ['TEXT', 'IMAGE']` 넣으면 에러 발생할 수 있음. photo.js(동작)에는 없음. 사용 금지"

현재 SDK 호출에서는 동작하고 있으나, raw fetch 패턴과 통일하고 위험요소를 제거한다.

## 작업

### 1. server.js generatePhoto() — responseModalities 행 제거

**파일**: `monkos_AI/idphoto-kr/server.js` (L435)

**현행:**
```javascript
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '3:4' },
```

**변경:**
```javascript
    config: {
      imageConfig: { aspectRatio: '3:4' },
```

### 2. 검증
- server.js에서 `responseModalities` grep → Live 코칭의 `['TEXT']`만 잔존 (정상)
- SPA `/api/generate` 엔드포인트에서 제거 확인

### 3. 커밋+push
```bash
git add monkos_AI/idphoto-kr/server.js
git commit -m "[fix] SPA generatePhoto responseModalities 제거 — raw fetch 패턴 통일"
git push origin develop
```

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | `monkos_AI/idphoto-kr/server.js` |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
