# 지시서: DEBUG 로그 제거 + main 머지

```
[2026-02-18 08:36 KST] iMac/쌍아 → 막내(any)
```

## 역할 선언

> **너는 "막내 N호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

---

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | DEBUG 로그 제거 + main 머지 |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` |
| **수정 파일** | `app.js`, `monk.js` (2개) |
| **브랜치** | `develop` → 완료 후 `main` 머지 |
| **배포** | main push 시 CF Pages 자동 배포 |

## ★ 0원칙 확인 (필독)

> **monkos_AI/ 수정 금지. MONK_kr/ai_lab/photolab/ 에서만 작업.**
> **monk.js는 DEBUG 로그 제거만. 로직 수정 금지.**
> **app.js는 DEBUG 로그 제거 + 버그수정 코드는 유지.**

---

## 작업 1: app.js — DEBUG 로그 제거 (5개)

`develop` 브랜치 checkout 후 아래 `console.log` 라인을 **삭제**:

```
1) camera.enter() 안:
   console.log('[DEBUG] camera.enter() called', new Error().stack);

2) confirmAndGenerate() — precheck 결과:
   console.log('[DEBUG] precheck 결과:', JSON.stringify(preCheck));

3) confirmAndGenerate() — precheck 에러:
   console.log('[DEBUG] precheck 에러:', JSON.stringify(err, null, 2));

4) confirmAndGenerate() — generate 요청 (블록 전체):
   console.log('[DEBUG] generate 요청:', {
     imageLength: base64.length,
     imagePrefix: base64.substring(0, 30),
     style: store.style,
     gender: store.gender,
     age: store.age,
     userId: store.user.id,
   });

5) confirmAndGenerate() — generate 에러:
   console.log('[DEBUG] generate 에러:', JSON.stringify(err, null, 2));
```

### 유지할 코드 (삭제 금지)

`showGenerateError()` 함수의 버그수정은 **그대로 유지**:
```js
store.resultSubtitle = error;
store.showStep3Actions = false;  // 다운로드 버튼 숨김
store.showStep2Actions = true;   // 재촬영/재시도 버튼 표시
store.step = 2;                  // step 2로 복귀
```

### 캐시 버스팅 유지

`?v=20260218` 는 **그대로 유지** (배포 후 캐시 갱신 필요):
```js
import Monk from './monk.js?v=20260218';
import { ... } from './config.js?v=20260218';
```

---

## 작업 2: monk.js — DEBUG 로그 제거 (4개)

아래 `console.log` 라인을 **삭제**:

```
1) pipe run() 안 — fetch URL 로그:
   console.log('[DEBUG-PIPE] fetch URL:', url, '| baseUrl:', baseUrl, '| path:', def.path);

2) connect() 안 — WS connect 로그:
   console.log('[DEBUG] WS connect called:', name, new Error().stack);

3) ws.onclose 안 — onclose 상태 로그 (블록 전체):
   console.log('[DEBUG] WS onclose:', {
     name,
     intentionalClose: ws._intentionalClose,
     reconnectConfig: !!def.reconnect,
     reconnectCount: ws._reconnectCount || 0,
   });

4) reconnect 분기 안 — reconnect 트리거 로그:
   console.log('[DEBUG] WS reconnect triggered:', { name, count: ws._reconnectCount, max });
```

### 유지할 코드 (삭제 금지)

`_intentionalClose` 플래그 로직은 **버그수정이므로 유지**:
```js
if (def.reconnect && !ws._intentionalClose) {
```

---

## 작업 3: main 머지

```bash
git checkout develop
git pull origin develop

# 작업 1, 2 수정 후
git add MONK_kr/ai_lab/photolab/app.js MONK_kr/ai_lab/photolab/monk.js
git commit -m "[clean] DEBUG 로그 제거 — 프로덕션 머지 준비"
git push origin develop

# main 머지
git checkout main
git pull origin main
git merge develop
git push origin main
```

---

## 완료 기준

- [ ] `app.js` — `console.log('[DEBUG]')` 0개
- [ ] `monk.js` — `console.log('[DEBUG]')` 0개
- [ ] 버그수정 코드 (showGenerateError, _intentionalClose) 유지 확인
- [ ] `?v=20260218` 캐시 버스팅 유지 확인
- [ ] develop push 성공
- [ ] main 머지 + push 성공
- [ ] `grep -r "console.log.*DEBUG" MONK_kr/ai_lab/photolab/` → 결과 0건

## 완료 보고

2규칙 형식. 변경 파일 + 커밋 해시 필수.

---

*[2026-02-18 08:36 KST] iMac/쌍아 → 막내(any)*
