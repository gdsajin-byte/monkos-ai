---
type: ORDER
date: 2026-03-06
from: M1/쌍아
to: 막내2
scope: OAuth 3종 리다이렉트 설정 전수조사 + LINE 포털 리다이렉트 버그 분석
prerequisite: 없음 (현행 main HEAD 기준)
ref: 2026-03-06 09:36 KST 작가님 — LINE 로그인 시 포털로 리다이렉트되는 이슈 발견
---

# 지시서: OAuth 리다이렉트 전수조사

> **[2026-03-06 09:38 KST] M1/쌍아 → 막내2**

---

## 배경

idphoto-kr 랜딩에서 LINE 로그인 → 포털(`monkos.ai`)로 리다이렉트되는 현상 발견. 증명사진 앱(idphoto-kr)에서 로그인했으면 증명사진 앱으로 복귀해야 정상.

OAuth 3종(Google, Kakao, LINE) 전체의 리다이렉트 설정을 전수 점검.

---

## Phase A: 현황 전수조사

### A-1. 각 OAuth 프로바이더별 리다이렉트 흐름 추적

**파일 대상:**
- `portal/lib/auth.js` — handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleAuth
- `portal/lib/shared/config.js` — KAKAO_REDIRECT_URI, LINE_REDIRECT_URI, ALLOWED_POPUP_ORIGINS
- `idphoto-kr/public/modules/gate.js` — 팝업 로그인 로직
- `idphoto-kr/public/shared.js` — 토큰 검증, 세션 초기화
- `.env` — 환경변수 리다이렉트 URI

### A-2. 각 프로바이더별 확인 사항

| 항목 | Google | Kakao | LINE |
|------|--------|-------|------|
| 로그인 진입 (gate.js) | ? | ? | ? |
| OAuth redirect_uri | ? | ? | ? |
| 콜백 처리 (auth.js) | ? | ? | ? |
| popup=1 전달 여부 | ? | ? | ? |
| postMessage targetOrigin | ? | ? | ? |
| non-popup 폴백 동작 | ? | ? | ? |
| 최종 복귀 URL | ? | ? | ? |

### A-3. 외부 콘솔 설정 확인 (코드 기준)

각 프로바이더의 redirect_uri가 코드에 설정된 값과 일치하는지:
- **Kakao Developers Console**: redirect_uri = ?
- **LINE Developers Console**: redirect_uri = ?
- **Google Cloud Console**: authorized redirect URIs = ?

> 콘솔 직접 접근은 불가. 코드에 설정된 redirect_uri 값을 정확히 기록하고, 콘솔 확인이 필요한 항목은 별도 표기.

---

## Phase B: LINE 포털 리다이렉트 버그 분석

### B-1. 재현 시나리오

1. `idphoto-kr.monkos.ai` (또는 `monkos.ai/idphoto-kr`) 랜딩 접속
2. 헤더 우측 로그인 버튼 탭
3. LINE 로그인 선택
4. LINE 인증 완료
5. **기대:** idphoto-kr 랜딩으로 복귀
6. **실제:** 포털(`monkos.ai`) 메인으로 리다이렉트

### B-2. 의심 지점

1. **gate.js → `/auth/line?popup=1&redirect_app=idphoto-kr`**
   - `popup=1` 파라미터가 정상 전달되는가?
   - `redirect_app=idphoto-kr`이 state에 인코딩되는가?

2. **auth.js handleLineAuth()**
   - state 파라미터에 `popup`, `redirectApp` 인코딩 확인
   - `effectiveRedirect`가 올바른 콜백 URL인가?

3. **auth.js handleLineCallback()**
   - state 디코딩 후 popup 플래그 확인
   - popup=true일 때 postMessage HTML 반환하는가?
   - popup=false(또는 누락) 시 `location.href = '/'`로 포털 루트 이동하는가? ← **가장 유력한 원인**
   - non-popup 폴백에서 `redirect_app`을 참조해 원래 앱으로 복귀하는가?

4. **팝업 차단 시나리오**
   - iOS Safari에서 팝업이 차단되면 non-popup 폴백으로 빠지는가?
   - non-popup 폴백이 포털 루트로 보내는가?

### B-3. Google, Kakao도 동일 이슈 가능성

LINE에서 발견된 패턴이 Google, Kakao에서도 동일하게 발생할 수 있는지 점검.

---

## Phase C: 수정 제안

조사 결과를 바탕으로 **수정 방향 제안** (코드 수정은 하지 않음):

1. 각 프로바이더별 리다이렉트 문제점 목록
2. non-popup 폴백 시 원래 앱으로 복귀하는 방법 제안
3. JP 클론 시 추가로 필요한 리다이렉트 설정 목록
4. 외부 콘솔(Kakao/LINE/Google)에서 확인·변경해야 할 항목

---

## 검증 (완료 조건)

| # | 항목 |
|---|------|
| 1 | OAuth 3종 리다이렉트 흐름 전체 매핑 (gate.js → auth.js → callback → 복귀) |
| 2 | LINE 포털 리다이렉트 원인 특정 (코드 라인 지목) |
| 3 | Google, Kakao 동일 이슈 여부 확인 |
| 4 | non-popup 폴백 동작 3종 정리 |
| 5 | JP 클론 시 필요한 redirect_uri 추가 목록 |
| 6 | 수정 방향 제안 (코드 수정 없음) |

---

## 보고 형식

```
REPORT_20260306_막내2_OAuth리다이렉트전수조사.md
```

---

## 수정 파일 목록

**이 지시서에서 코드 수정 없음.** 보고서만 제출.
수정 실행은 보고서 기반으로 작가님+쌍아 합의 후 별도 지시.
