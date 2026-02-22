# 지시서: CF Pages Functions 배포 수정 + 코칭 API 정상화

```
[2026-02-21 05:32 KST] M1/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | CF Pages Functions 배포 수정 — 전 API 복구 |
| **작업 경로** | 프로젝트 루트 (`/Users/developer/monk_project/`) |
| **브랜치** | `develop` |
| **긴급도** | **최상** — 모든 API 엔드포인트가 작동하지 않는 상태 |

## 0원칙

> **monkos_AI/ 수정 금지.** (프로덕션 동결)
> **monk.js 수정 금지.**
> API 키 하드코딩 금지.

---

## 배경 — 핵심 진단

### 증상
촬영실 코칭 무반응. 사전분석/생성/크레딧 API 전부 작동 안 함.

### 근본 원인
**CF Pages Functions가 프로덕션에 배포되지 않았다.**

테스트 결과:
```
curl -X POST monk.kr/api/idphoto-coaching → 405 (Functions 미작동)
curl -X POST monk.kr/api/precheck        → 405 (Functions 미작동)
curl monk.kr/api/visitor                  → 200 (index.html 반환 = static fallback)
```

`/api/*` 경로로 요청하면 Functions가 아니라 static 파일 서버가 응답한다. 이는 **Functions가 배포에 포함되지 않았음**을 의미.

### 구조
```
monk_project/
├── wrangler.toml          ← pages_build_output_dir = "MONK_kr"
├── functions/api/         ← CF Pages Functions (여기 있음!)
│   ├── idphoto-coaching.js
│   ├── precheck.js
│   ├── idgen.js
│   └── ... (20개 파일)
└── MONK_kr/               ← 배포되는 static 디렉토리
    └── (functions/ 없음)
```

기존 배포 명령: `wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main`
→ static 디렉토리만 배포, `functions/` 미포함 가능성.

---

## Task 1: Functions 배포 확인 + 수정 배포

### 1-1. wrangler.toml 기반 배포 시도

wrangler.toml에 `pages_build_output_dir = "MONK_kr"`이 이미 설정되어 있으므로:

```bash
# 프로젝트 루트에서 실행
npx wrangler pages deploy --project-name=monk-kr --branch=main
```

`--project-name`과 `--branch`를 명시하되, **디렉토리는 지정하지 않는다** (wrangler.toml에서 읽도록).

### 1-2. 배포 후 Functions 동작 확인

```bash
# OPTIONS (CORS preflight)
curl -s -w "\nHTTP %{http_code}" -X OPTIONS "https://monk.kr/api/idphoto-coaching"
# 기대: HTTP 200 + CORS 헤더

# POST (실제 코칭 요청 — 이미지 없어도 400이면 Functions 작동 확인)
curl -s -w "\nHTTP %{http_code}" -X POST "https://monk.kr/api/idphoto-coaching" \
  -H "Content-Type: application/json" \
  -d '{"style":"id_photo"}'
# 기대: HTTP 400 (image 필수 에러) = Functions 작동!
# 만약 405 = 여전히 미배포

# precheck도 동일 확인
curl -s -w "\nHTTP %{http_code}" -X POST "https://monk.kr/api/precheck" \
  -H "Content-Type: application/json" \
  -d '{}'
# 기대: HTTP 400 또는 500 (API 키 에러) = Functions 작동
```

### 1-3. 만약 여전히 405라면 — 대안

`functions/` 디렉토리를 `MONK_kr/` 안에 복사 후 재배포:

```bash
# functions/ 심볼릭 링크 생성
ln -s ../functions MONK_kr/functions

# 또는 물리 복사
cp -r functions/ MONK_kr/functions/

# 재배포
npx wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main
```

**주의**: 심볼릭 링크가 wrangler에서 인식되는지 먼저 테스트. 안 되면 물리 복사 사용.

---

## Task 2: idphoto-coaching.js camelCase 통일

Functions가 배포되더라도, JSON 필드명 불일치 수정이 필요.

**파일**: `functions/api/idphoto-coaching.js`

### 2-1. inlineData/mimeType (라인 109~110)
```js
// 현재 (snake_case)
{ inline_data: { mime_type: 'image/jpeg', data: image } },

// 변경 (camelCase — precheck.js와 동일)
{ inlineData: { mimeType: 'image/jpeg', data: image } },
```

### 2-2. systemInstruction (라인 104~106)
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

### 2-3. 참조 — precheck.js (정상 작동 패턴)
```js
// precheck.js가 사용하는 포맷 (이것이 정답):
{ inlineData: { data: base64Data, mimeType: 'image/png' } },
```

---

## Task 3: camera.js 빈 응답 처리 개선

**파일**: `MONK_kr/ai_lab/photolab/camera.js`

### 3-1. 빈 텍스트 무시 → 에러 로그 출력

```js
// 현재 (라인 126~129)
const data = await res.json();
if (data.text && store.step === 1) {
  showCoaching(data.text, data.ready);
}

// 변경
const data = await res.json();
if (store.step === 1) {
  if (data.text) {
    showCoaching(data.text, data.ready);
  } else if (data.error) {
    Monk.log(`코칭 API 에러: ${data.error}`);
  }
}
```

### 3-2. fetch 에러 시 상태코드 로깅 강화

```js
// 현재 (라인 122~125)
if (!res.ok) {
  Monk.log(`코칭 응답 에러: ${res.status}`);
  return;
}

// 변경 — 응답 본문도 로깅
if (!res.ok) {
  const errBody = await res.text().catch(() => '');
  Monk.log(`코칭 응답 에러: ${res.status} ${errBody.slice(0, 100)}`);
  return;
}
```

---

## Task 4: idphoto-coaching.js 에러 가시성

**파일**: `functions/api/idphoto-coaching.js`

```js
// 현재 (라인 121~126)
if (!geminiRes.ok) {
  const errText = await geminiRes.text();
  console.error('Gemini API 에러:', geminiRes.status, errText);
  return jsonResponse({ text: '', ready: false });
}

// 변경 — 에러 코드를 클라이언트에도 전달
if (!geminiRes.ok) {
  const errText = await geminiRes.text();
  console.error('Gemini API 에러:', geminiRes.status, errText);
  return jsonResponse({ text: '', ready: false, error: `Gemini ${geminiRes.status}` });
}
```

---

## Task 5: 배포 + 검증

### 5-1. 커밋
```bash
git add functions/api/idphoto-coaching.js MONK_kr/ai_lab/photolab/camera.js
git commit -m "[fix] CF Functions 배포 + 코칭 API camelCase 통일 + 에러 가시성"
git push origin develop
```

### 5-2. 프로덕션 배포
```bash
# wrangler.toml 기반 (Task 1 결과에 따라 명령어 선택)
npx wrangler pages deploy --project-name=monk-kr --branch=main
```

### 5-3. 배포 후 검증 (필수!)
```bash
# 1. Functions 라우팅 확인
curl -s -X POST "https://monk.kr/api/idphoto-coaching" \
  -H "Content-Type: application/json" \
  -d '{"style":"id_photo"}' | head -c 200
# 기대: JSON 응답 ({"error":"image 필수"} 등)

# 2. CORS 확인
curl -s -D- -X OPTIONS "https://monk.kr/api/idphoto-coaching" 2>&1 | head -10
# 기대: Access-Control-Allow-Origin: *

# 3. precheck도 확인
curl -s -X POST "https://monk.kr/api/precheck" \
  -H "Content-Type: application/json" \
  -d '{"image":"dGVzdA=="}' | head -c 200
# 기대: JSON 응답 (에러든 결과든)
```

---

## 수정 가능 파일

| 파일 | 수정 허용 |
|------|----------|
| `functions/api/idphoto-coaching.js` | camelCase 통일 + 에러 가시성 |
| `MONK_kr/ai_lab/photolab/camera.js` | 빈 응답 처리 + 에러 로깅 |
| `MONK_kr/functions/` | 심볼릭 링크 또는 복사 (Task 1-3 대안 시) |

**수정 금지**: `monk.js`, `config.js`, `shared.js`, `app.css`, `monkos_AI/`, `wrangler.toml`

---

## 완료 조건

### Level 1 (필수)
- [ ] `curl -X POST monk.kr/api/idphoto-coaching` → 405가 아닌 JSON 응답
- [ ] `curl -X POST monk.kr/api/precheck` → 405가 아닌 JSON 응답
- [ ] `curl -X OPTIONS monk.kr/api/idphoto-coaching` → CORS 헤더 포함
- [ ] idphoto-coaching.js camelCase 통일 완료
- [ ] 프로덕션 배포 완료 + curl 검증 통과

### Level 2 (권장)
- [ ] camera.js 에러 로깅 개선
- [ ] 코칭 API에 실제 이미지 전송 시 텍스트 응답 확인

---

## 참조

- **wrangler.toml**: 프로젝트 루트 (`pages_build_output_dir = "MONK_kr"`)
- **정상 작동 참조**: `functions/api/precheck.js` (camelCase 패턴)
- **CF Pages Functions 문서**: Functions는 `functions/` 디렉토리에서 자동 감지
- **이전 지시서** `TASK_20260221_coaching_fix.md` → 본 지시서로 대체 (모델명이 아닌 배포 문제)

---

## 폐기 안내
`TASK_20260221_coaching_fix.md`는 잘못된 진단(모델명 문제)에 기반. 본 지시서가 대체함.
