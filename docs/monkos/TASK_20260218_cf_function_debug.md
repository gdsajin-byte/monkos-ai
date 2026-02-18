---
type: task
from: 쌍아
to: 막내
date: 2026-02-18 03:13 KST
status: open
priority: high
tags: [cf-pages, functions, proxy, debug]
---

# 지시서: CF Pages Function 신규 파일 미인식 원인 조사 + 해결

## 상황

monk.kr (Cloudflare Pages) 프록시 함수 3개가 배포 후에도 405를 반환한다.
정적 파일은 최신 배포 완료, 기존 함수(photo.js 등)는 정상 작동.
**새로 추가한 함수 3개만 인식 안 됨.**

### 증거

```
# 기존 함수 — 정상
curl -X POST https://monk.kr/api/photo → 400 (실행됨)
curl -X POST https://monk.kr/api/analyze → 400 (실행됨)
curl -X POST https://monk.kr/api/tx → 401 (실행됨)

# 신규 함수 — 미인식
curl -X POST https://monk.kr/api/idphoto-generate → 405 (실행 안 됨)
curl -X POST https://monk.kr/api/idphoto-precheck → 405 (실행 안 됨)
curl -X POST https://monk.kr/api/idphoto-qc → 405 (실행 안 됨)
curl -X OPTIONS https://monk.kr/api/idphoto-generate → 405 (실행 안 됨)
```

- CF Pages 배포 완료 확인 (커밋 1ad851e, Production)
- 정적 파일(config.js) 최신 서빙 확인
- 직접 배포 URL(47ae07c5.monk-kr.pages.dev)에서도 동일 405

### 대상 파일

```
MONK_kr/functions/api/
├── idphoto-precheck.js  ← 신규 (405)
├── idphoto-generate.js  ← 신규 (405)
├── idphoto-qc.js        ← 신규 (405)
├── photo.js             ← 기존 (정상)
├── analyze.js           ← 기존 (정상)
└── ... (기존 전부 정상)
```

## 작업 지시

### STEP 1: 빌드 로그 확인

Cloudflare Dashboard에서 Functions 빌드 로그 확인:
```
Dashboard → Pages → monk-kr → Deployments → 최신(1ad851e) 클릭 → Functions 탭
```
- Functions 컴파일 에러가 있는지 확인
- 빌드에 포함된 Functions 목록에 idphoto-*.js가 있는지 확인
- 스크린샷 또는 로그 텍스트를 보고에 포함

### STEP 2: 원인 후보 조사

아래 후보를 순서대로 확인:

**후보 A: 파일명 하이픈(-) 호환성**
- 기존 함수: `photo.js`, `analyze.js` (하이픈 없음)
- 신규 함수: `idphoto-generate.js` (하이픈 있음)
- CF Pages Functions가 하이픈 파일명을 지원하는지 확인
- 테스트: `idphoto-generate.js` → `idphotogenerate.js`로 리네이밍 후 테스트

**후보 B: Functions 빌드 캐시**
- CF Pages가 Functions 번들을 캐시하고 있어서 새 파일 미포함
- 해결 시도: 기존 정상 함수(photo.js)에 주석 1줄 추가 → 재배포 → Functions 재빌드 트리거

**후보 C: _routes.json 명시적 등록**
- `MONK_kr/_routes.json` 생성:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```
- 이게 있으면 CF Pages가 /api/* 요청을 명시적으로 Functions로 라우팅

**후보 D: wrangler 직접 배포**
```bash
npx wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main
```
- Git 연동 대신 직접 배포하면 Functions가 포함되는지 확인

### STEP 3: 해결 후 검증

```bash
# 프록시 동작 확인
curl -s -o /dev/null -w "%{http_code}" -X POST https://monk.kr/api/idphoto-generate \
  -H "Content-Type: application/json" -d '{"test":true}'
# 200 또는 400/500 = 함수 실행됨 (성공)
# 405 = 함수 미인식 (실패)

# OPTIONS 확인 (CORS preflight)
curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://monk.kr/api/idphoto-generate
# 200 = 성공
```

## 규칙

1. **develop 브랜치에서 작업** → main 머지는 쌍아/작가님이 실행
2. 기존 작동 중인 함수(photo.js 등) 절대 삭제 금지
3. 커밋 + 푸시 = CF Pages 자동 배포 (develop = 프리뷰, main = 프로덕션)
4. 프리뷰 URL에서 먼저 검증 후 main 머지 요청
5. 매 시도 후 curl 결과를 기록

## 완료 기준

- [ ] idphoto-generate, idphoto-precheck, idphoto-qc 3개 함수가 405가 아닌 응답 반환
- [ ] 프리뷰 URL에서 검증 완료
- [ ] 원인과 해결 방법을 완료 보고에 명시

## 참조

- 기존 작동 함수 예시: `MONK_kr/functions/api/photo.js`
- 프록시 함수 코드: `MONK_kr/functions/api/idphoto-generate.js`
- CF Pages Functions 문서: https://developers.cloudflare.com/pages/functions/
