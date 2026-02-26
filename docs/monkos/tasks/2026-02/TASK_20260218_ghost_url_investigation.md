---
type: task
from: 쌍아
to: 막내(any)
date: 2026-02-18 04:13 KST
status: open
priority: critical
tags: [photolab, deploy, cache, ghost-url, cf-pages]
depends: TASK_20260218_generate_debug (완료됨)
---

# 지시서: 유령 URL 전수조사 — monkos.ai/api 호출 원인 추적

## 상황

monk.kr/ai_lab/photolab/ 에서 생성 API 호출 시 **배포된 코드와 다른 URL로 요청이 나감.**

### 배포된 코드 (curl로 확인 완료 — 전부 최신)

| 파일 | 핵심 값 | 확인 |
|------|---------|------|
| config.js | `PRECHECK: '/api/idphoto-precheck'` | ✅ 최신 |
| config.js | `GENERATE: '/api/idphoto-generate'` | ✅ 최신 |
| app.js | `baseUrl: ''` | ✅ 최신 |
| monk.js | `url = baseUrl + def.path` → `'' + '/api/idphoto-precheck'` | ✅ 최신 |
| index.html | `<script type="module" src="app.js">` (다른 스크립트 없음) | ✅ 최신 |

### 실제 브라우저 동작 (iPhone Safari 웹 인스펙터)

```
Origin https://monk.kr is not allowed by Access-Control-Allow-Origin. Status code: 204
Fetch API cannot load https://monkos.ai/api/pre-check due to access control checks.
Fetch API cannot load https://monkos.ai/api/generate due to access control checks.
```

### 미스터리

| 항목 | 코드상 예상 | 실제 동작 |
|------|------------|-----------|
| precheck URL | `/api/idphoto-precheck` (상대경로) | `https://monkos.ai/api/pre-check` |
| generate URL | `/api/idphoto-generate` (상대경로) | `https://monkos.ai/api/generate` |
| 도메인 | monk.kr (같은 도메인) | monkos.ai (외부 도메인) |
| 경로명 | `idphoto-precheck` | `pre-check` (다른 이름!) |

**curl로 받은 파일은 최신인데, 브라우저에서 실행되는 코드는 구버전.**
**iPhone 캐시 삭제 후에도 동일 증상.**
**iPhone에서 config.js 직접 열면 최신 내용이 보임.**

## 조사 지시

### STEP 1: CF Pages 배포 상태 확인

**1-1. 현재 프로덕션 배포 확인**
```bash
# CF Pages 배포 목록 (최신 5건)
npx wrangler pages deployment list --project-name=monk-kr | head -20
```
- 프로덕션 배포가 **git 트리거**인지 **wrangler 직접 배포**인지 확인
- wrangler 직접 배포가 git 배포를 덮어씌운 가능성 조사
- 배포 시각과 커밋 해시 대조

**1-2. 최신 배포의 실제 파일 확인**
```bash
# 배포된 정적 파일이 실제로 최신인지 확인
curl -sI 'https://monk.kr/ai_lab/photolab/config.js' | grep -i 'etag\|last-modified\|cf-cache\|age\|cache-control'
curl -sI 'https://monk.kr/ai_lab/photolab/app.js' | grep -i 'etag\|last-modified\|cf-cache\|age\|cache-control'
```
- CF CDN 캐시 상태 확인 (HIT/MISS/EXPIRED)
- `age` 헤더로 캐시 경과 시간 확인

**1-3. wrangler 재배포로 캐시 강제 퍼지**
```bash
cd /Users/developer/monk_project\ /
npx wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main
```
- 재배포 후 iPhone에서 다시 테스트

### STEP 2: ES Module 캐시 조사

Safari는 ES Module(`type="module"`)을 일반 캐시와 별도로 캐시함.
`import ... from './config.js'`의 모듈 캐시가 남아있을 수 있음.

**2-1. 모듈 캐시 무력화 테스트**

index.html의 스크립트 태그에 버전 쿼리 추가:
```html
<!-- 현재 -->
<script type="module" src="app.js"></script>

<!-- 변경 -->
<script type="module" src="app.js?v=20260218"></script>
```

그리고 app.js의 import문도:
```javascript
// 현재
import { API, ... } from './config.js';

// 변경
import { API, ... } from './config.js?v=20260218';
```

**2-2. 커밋 + 배포 후 iPhone 테스트**

### STEP 3: 유령 URL 출처 역추적

`monkos.ai/api/pre-check`라는 URL은 현재 코드 어디에도 없음. 구버전 코드에서 나온 것.

**3-1. Git 히스토리에서 유령 URL 검색**
```bash
git log --all --oneline -20 -- MONK_kr/ai_lab/photolab/config.js
git log --all --oneline -20 -- MONK_kr/ai_lab/photolab/app.js

# 어떤 커밋에서 monkos.ai/api 를 사용했는지 확인
git log --all -p -- MONK_kr/ai_lab/photolab/config.js | grep -B5 'monkos.ai/api'
git log --all -p -- MONK_kr/ai_lab/photolab/app.js | grep -B5 'monkos.ai.*pre-check\|monkos.ai.*generate'
```

**3-2. 다른 경로에 동일 앱 잔재 확인**
```bash
# MONK_kr 전체에서 monkos.ai/api 검색
grep -rn 'monkos.ai/api' MONK_kr/ --include="*.js" --include="*.html"

# 동일 이름 파일이 다른 위치에 있는지
find MONK_kr/ -name "app.js" -o -name "config.js" | grep -v node_modules
```

**3-3. _redirects, _headers 파일 확인**
```bash
ls -la MONK_kr/_redirects MONK_kr/_headers MONK_kr/_routes.json 2>/dev/null
cat MONK_kr/_routes.json 2>/dev/null
```

### STEP 4: Cloudflare Challenge 스크립트 조사

index.html 맨 아래에 CF challenge-platform 스크립트가 주입됨:
```
/cdn-cgi/challenge-platform/scripts/jsd/main.js
```
- 이 스크립트가 요청을 가로채는지 확인
- Network 탭에서 실제 fetch 요청의 initiator 확인 필요

**4-1. CF 보안 규칙 확인**
```bash
# monk.kr 사이트의 WAF/Firewall 규칙이 요청을 redirect하는지
# Cloudflare Dashboard → monk.kr → Security → WAF → Custom Rules
# 또는 Page Rules 확인
```

### STEP 5: 실제 fetch 요청 검증 (결정적 테스트)

app.js에 fetch 직전 URL 로그 추가:

```javascript
// monk.js의 pipe.run 함수 내 (약 line 184)
// 기존:
const url = baseUrl + def.path;
const res = await fetch(url, {

// 변경:
const url = baseUrl + def.path;
console.log('[DEBUG-PIPE] fetch URL:', url, '| baseUrl:', baseUrl, '| path:', def.path);
const res = await fetch(url, {
```

이 로그가 찍히면:
- `[DEBUG-PIPE] fetch URL: /api/idphoto-precheck | baseUrl: | path: /api/idphoto-precheck` → 코드 정상, CF/브라우저가 리다이렉트
- `[DEBUG-PIPE] fetch URL: https://monkos.ai/api/pre-check | ...` → 어딘가에서 값이 바뀜
- **이 로그가 안 찍히면** → 배포된 monk.js가 실제로는 구버전

### STEP 6: 가장 확실한 해결책 (STEP 2-5 병렬로 불가 시)

위 조사로 원인 못 찾을 경우, 강제 캐시 버스팅으로 해결:

**index.html, app.js, config.js 전부 버전 쿼리 추가:**
```html
<script type="module" src="app.js?v=20260218-2"></script>
```
```javascript
import { API, ... } from './config.js?v=20260218-2';
```

+ wrangler 재배포

---

## 우선순위 추천

1. **STEP 5 먼저** (monk.js에 URL 로그 1줄 추가) → 원인 특정 가능
2. **STEP 2** (버전 쿼리 추가) → 모듈 캐시 무력화
3. **STEP 1** (배포 상태 확인) → 배경 원인 파악
4. STEP 3-4는 위에서 해결 안 될 때

## 규칙

- **브랜치: develop**에서 작업. main 푸시 금지.
- **커밋**: `[fix] 한국어 요약` 형식
- **금지**: main 푸시, prod 배포, .env 수정, 서버코드(monkos_AI/) 무단 수정
- **에스컬레이션**: Cloudflare Dashboard 설정 변경 필요 시 `⏳ 대기` 보고
- **완료 보고**: 2규칙 형식 (✅❌💡⏳📁🔀)
- **MEMORY.md 확인 의무**: 작업 전 반드시 읽기

## 완료 기준

**레벨: 실행+보고**

- [ ] 유령 URL(`monkos.ai/api/pre-check`)의 출처 특정
- [ ] STEP 5 로그 결과 보고 (fetch URL이 뭘로 찍히는지)
- [ ] 가능하면 수정까지 (STEP 2 버전 쿼리 등)
- [ ] 수정한 경우 develop 커밋+푸시, **main 머지는 쌍아가 판단**
- [ ] 프리뷰 URL(develop.monk-kr.pages.dev)에서 검증 시도

## 대상 파일

```
MONK_kr/ai_lab/photolab/monk.js    ← STEP 5 디버그 로그
MONK_kr/ai_lab/photolab/index.html ← STEP 2 버전 쿼리
MONK_kr/ai_lab/photolab/app.js     ← STEP 2 import 버전 쿼리
MONK_kr/ai_lab/photolab/config.js  ← 확인용 (수정 불필요)
```

## 참조

- 이전 지시서: `docs/monkos/TASK_20260218_cf_function_debug.md` (CF Function 해결)
- 이전 지시서: `docs/monkos/TASK_20260218_generate_debug.md` (생성 실패 진단)
- 웹 인스펙터 콘솔 스크린샷: 작가님이 확인함 (CORS 에러 → monkos.ai로 요청)
