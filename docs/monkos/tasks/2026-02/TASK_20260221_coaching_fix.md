# 지시서: 촬영실 코칭 무반응 긴급 수정

```
[2026-02-21 05:26 KST] M1/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 촬영실 코칭 무반응 긴급 수정 |
| **작업 경로** | `functions/api/idphoto-coaching.js` + `MONK_kr/ai_lab/photolab/camera.js` |
| **브랜치** | `develop` |
| **배포** | 완료 후 `wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main` (프로덕션) |
| **긴급도** | 높음 — 촬영실 코칭이 완전히 무반응 상태 |

## 0원칙

> **monkos_AI/ 수정 금지.** (프로덕션 동결)
> **monk.js 수정 금지.**
> **config.js 수정 금지.**
> API 키 하드코딩 금지.

---

## 배경

촬영실(camera.html) 진입 후 AI 코칭이 전혀 반응하지 않는 상태.
"자세를 체크하고 있습니다..."만 표시되고 실제 코칭 텍스트가 오지 않음.

**원인 진단 (쌍아 분석):**
1. CF Function의 Gemini 모델명이 유효하지 않을 가능성 높음
2. 에러 시 `{ text: '', ready: false }` 반환 → camera.js에서 빈 문자열을 무시
3. JSON 필드명이 precheck(정상 작동)과 다름

---

## Task 1: 모델명 수정 — `gemini-2.0-flash` 통일

**파일**: `functions/api/idphoto-coaching.js`

**현재** (라인 5):
```js
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
```

**변경**:
```js
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
```

**이유**: `precheck.js`가 `gemini-2.0-flash`로 정상 작동 중. 동일 모델로 통일하여 확실히 동작하는 상태 확보.

---

## Task 2: JSON 필드명 camelCase 통일

**파일**: `functions/api/idphoto-coaching.js`

**현재** (라인 109~110):
```js
{ inline_data: { mime_type: 'image/jpeg', data: image } },
```

**변경**:
```js
{ inlineData: { mimeType: 'image/jpeg', data: image } },
```

**이유**: `precheck.js`(정상 작동)는 `inlineData`/`mimeType` (camelCase) 사용. Gemini REST API의 공식 JSON 포맷은 camelCase.

**추가 확인**: 같은 파일 내 `system_instruction`도 `systemInstruction`으로 변경.

```js
// 현재
system_instruction: {
  parts: [{ text: instruction }],
},

// 변경
systemInstruction: {
  parts: [{ text: instruction }],
},
```

---

## Task 3: camera.js 빈 응답 처리 개선

**파일**: `MONK_kr/ai_lab/photolab/camera.js`

**현재** (라인 126~129):
```js
const data = await res.json();
if (data.text && store.step === 1) {
  showCoaching(data.text, data.ready);
}
```

**문제**: `data.text`가 빈 문자열이면 falsy → showCoaching 절대 실행 안 됨.
코칭 API가 에러로 빈 응답 반환 시, 사용자에게 아무 피드백 없음.

**변경**:
```js
const data = await res.json();
if (store.step === 1) {
  if (data.text) {
    showCoaching(data.text, data.ready);
  } else if (data.error) {
    Monk.log(`코칭 API 에러: ${data.error}`);
  }
}
```

---

## Task 4: 에러 가시성 개선 (idphoto-coaching.js)

**파일**: `functions/api/idphoto-coaching.js`

**현재** (라인 121~126):
```js
if (!geminiRes.ok) {
  const errText = await geminiRes.text();
  console.error('Gemini API 에러:', geminiRes.status, errText);
  return jsonResponse({ text: '', ready: false });
}
```

**변경**: 에러 정보를 응답에 포함 (디버그용):
```js
if (!geminiRes.ok) {
  const errText = await geminiRes.text();
  console.error('Gemini API 에러:', geminiRes.status, errText);
  return jsonResponse({ text: '', ready: false, error: `Gemini ${geminiRes.status}` });
}
```

---

## Task 5: 프로덕션 배포 + 동작 확인

수정 완료 후:
1. `git add functions/api/idphoto-coaching.js MONK_kr/ai_lab/photolab/camera.js`
2. `git commit`
3. `git push origin develop`
4. `npx wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main`
5. 배포 URL 보고

---

## 수정 가능 파일

| 파일 | 수정 허용 |
|------|----------|
| `functions/api/idphoto-coaching.js` | 모델명, 필드명, 에러 응답 수정 |
| `MONK_kr/ai_lab/photolab/camera.js` | 빈 응답 처리 개선 |

**수정 금지**: `monk.js`, `config.js`, `shared.js`, `app.css`, `monkos_AI/`

---

## 완료 조건

### Level 1 (필수)
- [ ] 모델명 `gemini-2.0-flash`로 통일 (precheck과 동일)
- [ ] JSON 필드명 camelCase 통일 (`inlineData`, `mimeType`, `systemInstruction`)
- [ ] camera.js 빈 응답 시 로그 출력
- [ ] 프로덕션 배포 완료

### Level 2 (권장)
- [ ] 촬영실에서 코칭 텍스트가 실제로 표시되는지 로그 확인
- [ ] 에러 발생 시 `Monk.log`에 에러 코드 출력 확인

---

## 참조

- **정상 작동 참조**: `functions/api/precheck.js` — `gemini-2.0-flash` + camelCase 필드
- **코칭 API 경로**: `/api/idphoto-coaching` (config.js)
- **코칭 루프**: camera.js `startCoachingLoop()` → 500ms 간격 REST
