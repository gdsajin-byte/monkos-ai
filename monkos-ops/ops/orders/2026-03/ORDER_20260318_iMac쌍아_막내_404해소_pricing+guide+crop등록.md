---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 대기
---

# [지시서] 404 해소 — /pricing·/guide 페이지 생성 + /crop SEO 등록

> **[2026-03-18 12:04 KST] iMac/쌍아 → iMac/막내**
> Search Console 404 색인 문제 해소. 3건 일괄 처리.

---

## 1. `/pricing` — 크레딧 가격표 정적 페이지 생성

### 작업
- `monkos_AI/portal/public/pricing.html` 생성
- 기존 `credits.html`의 디자인 톤 참조하되, **크레딧 가격표** 중심의 단독 페이지
- 포함 내용: 크레딧 팩 구성 (가격/수량), 주요 서비스별 크레딧 소모량, CTA 버튼 (크레딧 구매 → `openCreditShop()`)
- 디자인: SSR 페이지들의 라이트 테마 톤 통일 (render.js layoutShell 패턴 참고)
- **nav의 `/pricing` 링크는 유지** — 정적 파일이 생기면 서버가 자동 서빙

### 참조
- `credits.html` — 기존 크레딧 관련 페이지
- `main.js` 64-71줄 — `/pricing` 클릭 가로채기 (페이지 생성 후에도 모달 트리거 유지할지 판단 필요 → 페이지가 있으니 가로채기 제거 권장)
- 가격 데이터: `credits.js` 또는 `credits.html`에서 확인

### 주의
- ⚠️ 실제 가격/크레딧 수치는 기존 코드(credits.html, credits.js)에 있는 값만 사용. 추측 금지 (헌법 제4조)

---

## 2. `/guide` — 사용법 가이드 SSR 페이지 생성

### 작업
- `render.js`에 `renderGuide()` + `guideFragment()` 함수 추가
- 기존 SSR 패턴 준수: Fragment → layoutShell

### 콘텐츠 구조 (초기 버전)
- **증명사진 촬영 가이드**: 조명, 포즈, 배경 등 기본 안내
- **앱 사용법**: 업로드 → AI 보정 → 다운로드 흐름
- **크롭앱 사용법**: `/crop` 서비스 안내
- 향후 블록 에디터 시스템으로 콘텐츠 동적 관리 예정 → 지금은 **정적 HTML로 껍데기+기본 콘텐츠** 구성

### 라우팅
- `server.js`에 추가:
  ```javascript
  if (urlPath === '/guide' && req.method === 'GET') return renderGuide(req, res);
  ```
- 기존 SSR 라우트 블록(227줄 근처)에 삽입
- `render.js` import에 `renderGuide` 추가

### SEO
- `<title>`: "사용 가이드 | MONKOS"
- `<meta description>`: 증명사진 촬영·앱 사용법 안내

### 참조
- `renderFaq()` 구현 패턴을 가장 가깝게 따를 것 (정보 제공형 페이지)
- index.html 211줄 `<a href="/guide">` — 기존 링크 그대로 유지 (페이지가 생기니 정상 동작)

---

## 3. `/crop` SEO 등록

### sitemap 추가
- `render.js` 990-1003줄 `staticUrls` 배열에 추가:
  ```javascript
  { loc: 'https://monkos.ai/crop', changefreq: 'weekly', priority: '0.7' },
  ```

### robots.txt 추가
- `public/robots.txt`에 추가:
  ```
  Allow: /crop
  ```

### 정적 sitemap.xml 동기화
- `public/sitemap.xml`에도 `/crop` 추가 (SSR이 우선하지만 정합성 유지)

---

## 4. 일괄 처리 사항

### sitemap에 신규 페이지 등록
- staticUrls에 `/pricing`, `/guide`도 추가:
  ```javascript
  { loc: 'https://monkos.ai/pricing', changefreq: 'monthly', priority: '0.6' },
  { loc: 'https://monkos.ai/guide', changefreq: 'weekly', priority: '0.7' },
  ```

### robots.txt에 신규 페이지 등록
  ```
  Allow: /guide
  Allow: /crop
  ```
  (`/pricing`은 정적 파일이므로 기본 Allow 적용, 명시 불필요)

### layoutNav 검토
- render.js `layoutNav` (100-112줄)에 Guide 링크 추가 여부 — 기존 nav에 Blog/FAQ/Gallery/Board가 있음. Guide 추가 권장

---

## 5. 완료 후 검증

- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/pricing` → 200
- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/guide` → 200
- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/crop` → 200
- [ ] `curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/sitemap.xml` → `/pricing`, `/guide`, `/crop` 포함 확인
- [ ] Dead Link 0건 확인

---

## ⚠️ 준수 조항

- 헌법 제4조: API 키·비밀정보 추측/하드코딩 금지
- 헌법 제5조 2항: 기존 디자인 정체성 보존 (SSR 테마 톤 통일)
- 법률 ch2: 코딩 규칙 준수
- **커밋 후 배포까지 진행** (법률 ch5 배포 규칙 준수)

---

## 6. 완료 보고

형식: `✅❌💡⏳📁🔀`
커밋 해시 + 배포 URL 포함
