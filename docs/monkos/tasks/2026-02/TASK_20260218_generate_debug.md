---
type: task
from: 쌍아
to: 막내
date: 2026-02-18 03:30 KST
status: open
priority: high
tags: [photolab, generate, debug, ui-bug]
depends: TASK_20260218_cf_function_debug (완료됨)
---

# 지시서: photolab 생성 실패 + UI 버그 3건 수정

## 상황

monk.kr/ai_lab/photolab 모바일 E2E 테스트 중.
CF Pages Function 프록시는 정상(이전 지시서로 해결 완료).
**생성 버튼 누르면 "생성 중입니다" 후 바로 "생성 실패" + 다운로드 버튼 + 라이브 코칭 재시작.**

### 작가님 원문
> "생성버튼-- 생성중입니다 멘트 후 바로 생성실패 뜨는데 다운로드 버튼 생기고 라이브가 인사함"

### 증거: 프록시 정상 확인 (이전 지시서 결과)
```bash
# 프록시는 서버까지 도달함 (405가 아닌 실제 서버 에러 반환)
curl -s -X POST https://monk.kr/api/idphoto-generate \
  -H "Content-Type: application/json" -d '{"image":"test"}'
# → {"error":"Input buffer contains unsupported image format"}  ← 서버 도달 OK
```

## 증상 3건

| # | 증상 | 원인 추정 | 심각도 |
|---|------|-----------|--------|
| 1 | 생성 즉시 실패 | **진단 필요** (에러 로그 확인) | 🔴 |
| 2 | 생성 실패인데 다운로드 버튼 표시 | `showGenerateError`의 `showStep3Actions = true` 버그 | 🟡 확정 |
| 3 | 생성 실패 후 라이브 코칭 재시작 + 인사 | WS reconnect 또는 다른 트리거 | 🟠 |

---

## 작업 지시

### STEP 1: 에러 진단 (생성 실패 원인 특정)

**1-1. 브라우저 콘솔 로그 확인용 디버그 추가**

`MONK_kr/ai_lab/photolab/app.js`의 `confirmAndGenerate` 함수에 진단 로그 추가:

```javascript
// confirmAndGenerate 함수 내, 생성 호출 직전 (약 line 431)
console.log('[DEBUG] generate 요청:', {
  imageLength: base64.length,
  imagePrefix: base64.substring(0, 30),
  style: store.style,
  gender: store.gender,
  age: store.age,
  userId: store.user.id,
});

// generate catch 블록 내 (약 line 462)
console.log('[DEBUG] generate 에러:', JSON.stringify(err, null, 2));
```

또한 precheck 호출부에도:
```javascript
// precheck 성공 시 (약 line 407)
console.log('[DEBUG] precheck 결과:', JSON.stringify(preCheck));

// precheck catch 블록 (약 line 420)
console.log('[DEBUG] precheck 에러:', JSON.stringify(err, null, 2));
```

**1-2. 모바일 원격 디버깅으로 콘솔 확인**

- Safari: Settings → Safari → Advanced → Web Inspector ON
  - Mac Safari → Develop → (iPhone 이름) → monk.kr
- Chrome: `chrome://inspect` → Remote Devices

**1-3. 확인할 포인트**

| 체크 | 예상 | 의미 |
|------|------|------|
| `imageLength` | 50000~500000 | 정상 범위 (720px JPEG base64) |
| `imagePrefix` | `/9j/4AAQ...` | JPEG 매직넘버 (정상) |
| generate 에러 status | 500? 502? | 서버 에러 vs 프록시 에러 |
| generate 에러 message | ? | **이것이 핵심** |
| precheck 결과 | 에러 or 성공 | precheck 정상 여부 |

---

### STEP 2: 버그 #2 수정 — 생성 실패 시 다운로드 버튼 숨김

`MONK_kr/ai_lab/photolab/app.js` 약 line 501:

**현재 (버그):**
```javascript
function showGenerateError(error) {
  store.qcBadgeText = TX.genFail + ': ' + error;
  store.qcPassed = false;
  store.resultTitle = TX.genFail;
  store.showStep3Actions = true;   // ← 버그: 다운로드 버튼 표시됨
  Monk.log('생성 에러: ' + error);
}
```

**수정:**
```javascript
function showGenerateError(error) {
  store.qcBadgeText = TX.genFail + ': ' + error;
  store.qcPassed = false;
  store.resultTitle = TX.genFail;
  store.resultSubtitle = error;
  store.showStep3Actions = false;  // ← 다운로드 버튼 숨김
  store.showStep2Actions = true;   // ← 재촬영/재시도 버튼 표시
  store.step = 2;                  // ← step 2로 복귀 (촬영 확인)
  Monk.log('생성 에러: ' + error);
}
```

**핵심:** 생성 실패 시 step3(다운로드)이 아닌 step2(재촬영/재시도)로 복귀.

---

### STEP 3: 버그 #3 조사 — 라이브 코칭 재시작

**3-1. WS 재연결 확인**

`monk.js`의 WS onclose 핸들러(약 line 243)에 디버그 로그 추가:

```javascript
// onclose 핸들러 내
console.log('[DEBUG] WS onclose:', {
  name,
  intentionalClose: ws._intentionalClose,
  reconnectConfig: !!def.reconnect,
  reconnectCount: ws._reconnectCount || 0,
});
```

**3-2. "인사"의 정체 확인**

- 코칭 인사 메시지: `TX.coachingInit` = "안녕하세요! 몽코스 AI 코치입니다..."
- 이 메시지는 `onOpen` 콜백의 `showCoaching(TX.coachingInit)`에서 발생 (app.js line 87)
- onOpen이 호출 = WS가 새로 연결된 것 → **reconnect가 발생했다는 증거**

**3-3. 가능한 원인**

| 후보 | 설명 | 확인 방법 |
|------|------|-----------|
| A | `_intentionalClose` 플래그가 onclose 이벤트 전에 GC됨 | 디버그 로그로 확인 |
| B | disconnect 후 다른 곳에서 `connect('coaching')` 재호출 | `connect` 함수에 `console.log('[DEBUG] WS connect called:', name, new Error().stack)` 추가 |
| C | 이전 WS 연결의 지연된 onclose가 disconnect 후에 발생 | 타이밍 로그 확인 |

**3-4. 가장 의심되는 경로**

`camera.enter()`(line 135)에서 `pipe.connect('coaching')` 호출.
화면 전환이 예기치 않게 camera로 돌아가는지 확인:

```javascript
// screens 정의에서 camera.enter()에 디버그 추가
async enter() {
  console.log('[DEBUG] camera.enter() called', new Error().stack);
  // ... 기존 코드
}
```

---

### STEP 4: 생성 에러 원인별 수정

STEP 1 진단 결과에 따라 분기:

**경우 A: 서버 500 에러 (Imagen API 에러)**
- 서버 로그 확인: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=monkos-idphoto-kr" --limit=20`
- Imagen API 에러라면 프롬프트나 이미지 포맷 문제 가능
- 서버 코드 수정 필요 시 `⏳ 대기` 보고

**경우 B: 프록시 502 에러 (CF→Cloud Run 연결 실패)**
- CF Pages Function에서 Cloud Run으로의 fetch가 타임아웃
- Cloud Run 서비스 상태 확인: `gcloud run services describe monkos-idphoto-kr --region us-central1`

**경우 C: 클라이언트측 에러 (JSON 파싱 실패 등)**
- pipe.run의 `res.json()` 실패 → 응답이 JSON이 아닌 경우
- CF Pages Function이 HTML 에러 페이지 반환 가능성

**경우 D: 이미지 데이터 문제**
- `imageLength`가 0이거나 매우 작으면 캡처 실패
- `imagePrefix`가 JPEG 매직넘버(`/9j/`)가 아니면 포맷 문제

---

### STEP 5: 검증

디버그 로그 추가 후:
1. `git add` → `git commit` → `git push origin develop`
2. CF Pages preview URL에서 모바일 테스트
3. 브라우저 콘솔 로그 수집
4. 완료 보고에 콘솔 로그 내용 포함

**성공 기준:**
- [ ] 생성 에러의 정확한 원인 특정
- [ ] 생성 실패 시 다운로드 버튼 미표시 (step2 버튼만 표시)
- [ ] 라이브 코칭 재시작 원인 특정

**최종 목표 (가능 시):**
- [ ] 생성 성공 → QC → 다운로드 전체 플로우 정상 동작

---

## 규칙

1. **develop 브랜치에서 작업**
2. 기존 함수 삭제 금지
3. 디버그 로그는 `[DEBUG]` 접두사 (나중에 일괄 제거 가능)
4. `monk.js` 수정 시 기존 로직 변경 최소화 (로그만 추가)
5. 서버 코드(monkos_AI/) 수정 필요 시 `⏳ 대기` 보고

## 대상 파일

```
MONK_kr/ai_lab/photolab/app.js     ← 진단 로그 + 버그 #2 수정
MONK_kr/ai_lab/photolab/monk.js    ← 진단 로그 (WS 디버그)
```

## 참조

- 프록시 함수: `MONK_kr/functions/api/idphoto-generate.js`
- 서버 generate: `monkos_AI/idphoto-kr/server.js` line 544-587
- 00079 원본 generate 호출: `monkos_AI/idphoto-kr/public/index.html` line 1935
- 이전 지시서: `docs/monkos/TASK_20260218_cf_function_debug.md` (CF Function 해결됨)
