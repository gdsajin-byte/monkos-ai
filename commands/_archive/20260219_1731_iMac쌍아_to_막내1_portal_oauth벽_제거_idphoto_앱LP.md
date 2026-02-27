# 지시서: monkos.ai OAuth 벽 제거 + idphoto-kr 앱 LP 추가

[2026-02-19 17:31 KST] iMac/쌍아 → 막내1

## 역할 선언
> **너는 "막내1"이다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식

---

## 배경

토스페이먼츠 계약심사에서 홈페이지 요구사항:
- 상품 목록 + 가격이 보이는 페이지
- 사업자 정보 footer
- 결제 모듈이 붙어있는 상태

현재 monkos.ai는 OAuth 로그인 벽이 첫 화면 → 심사팀이 접속해도 서비스가 안 보임.
idphoto-kr.monkos.ai는 `/` → `/app` 302 리다이렉트 → LP 없이 바로 촬영 준비실.

## 작업 2건

---

### 작업 1: monkos.ai portal — OAuth 벽 제거

**목표:** 비로그인 상태에서도 대시보드(서비스 카드 + 이벤트 + 사업자 footer)가 바로 보이도록.

**파일:** `monkos_AI/portal/public/index.html`

**현재 구조:**
```
L1112: <section class="gate-screen" id="gateScreen">  ← 로그인 전 화면 (기본 표시)
L1162: <div id="mainContent" style="display: none;">   ← 로그인 후 화면 (기본 숨김)
```

**JS 분기 (L1566~1596):**
```js
if (currentUser) {
  gateScreen.style.display = 'none';
  mainContent.style.display = 'block';
} else {
  gateScreen.style.display = 'flex';
  mainContent.style.display = 'none';
}
```

**변경 방향:**
1. `mainContent`를 기본 표시 (`style="display: none;"` 제거 또는 `block`으로)
2. `gateScreen`을 기본 숨김 (CSS에서 `display: none`)
3. JS 분기 수정: 비로그인이어도 mainContent 표시 유지
4. 비로그인 상태일 때 **헤더 우측**에 로그인 버튼 표시 (기존 크레딧 뱃지 자리에 "로그인" 버튼)
5. 로그인 후에는 기존처럼 크레딧 뱃지 + 프로필 아이콘 표시

**로그인 요구 시점 (기존 유지):**
- 크레딧 구매 시
- 사진 다운로드 시
- 이미 `currentUser` 체크하는 곳들은 그대로 유지

**동의 체크박스 (L1120~1136):**
- gateScreen과 함께 숨겨짐
- 로그인 버튼 클릭 시 모달로 동의 받는 방식으로 전환하거나, 일단 제거
- 판단: **일단 제거** (추후 결제 시점에 동의 모달 별도 구현 예정)

**주의:**
- 헤더 영역(`.top-bar`, L1094 부근)의 로그인/비로그인 분기만 수정
- 서비스 카드, 이벤트 배너, footer 등 기존 콘텐츠는 건드리지 않음
- 챗봇 기능은 비로그인에서도 동작하면 좋지만, 안 되면 "로그인 후 이용 가능" 메시지 OK

---

### 작업 2: idphoto-kr — 앱 LP 추가

**목표:** `/` 접속 시 앱 랜딩페이지 표시. 서비스 소개 → CTA → `/app`(촬영 준비실).

#### 2-1. server.js 라우트 변경

**파일:** `monkos_AI/idphoto-kr/server.js` L633~636

**현재:**
```js
if (urlPath === '/') {
  res.writeHead(302, { 'Location': '/app' });
  res.end();
  return;
}
```

**변경:**
```js
if (urlPath === '/') {
  const content = readFileSync(join(__dirname, 'public', 'landing.html'));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
  return;
}
```

#### 2-2. landing.html 신규 생성

**파일:** `monkos_AI/idphoto-kr/public/landing.html`

**디자인 기조:** 기존 idphoto-kr UI 스타일 (다크 테마, `--bg: #0f0f23`, `--accent: #a78bfa`)

**섹션 구성:**

```
1. 히어로
   - "AI가 만드는 완벽한 증명사진"
   - "스마트폰 하나로 전문 증명사진을 즉시 완성"
   - CTA 버튼: "지금 촬영하기 →" → /app 링크

2. 특징 3개 (아이콘 + 텍스트)
   - AI 실시간 코칭: 자세·표정·조명을 실시간 분석
   - 프로 품질 변환: AI가 배경·의상·조명을 전문가 수준으로 보정
   - 즉시 다운로드: 생성 후 바로 다운로드, 인쇄 가능 300DPI

3. 사용법 3단계
   - Step 1: 촬영 — AI 코치가 실시간 가이드
   - Step 2: AI 생성 — 증명사진 자동 변환 + 품질 검증
   - Step 3: 다운로드 — 여권/이력서 규격 즉시 완성

4. 가격표 (크레딧 패키지)
   - 1 크레딧 — ₩1,500
   - 10 크레딧 — ₩12,900 (10% 할인)
   - 30 크레딧 — ₩29,900 (17% 할인) ← "인기" 뱃지
   - 50 크레딧 — ₩45,900 (20% 할인)
   - 하단 안내: "생성 1회 = 1c, 다운로드 1회 = 8c"

5. 이벤트 배너
   - "매일 선착순 30명! 10크레딧 무료"
   - "지금 시작하면 무료로 증명사진을 받을 수 있습니다"
   - CTA: "무료로 시작하기 →" → /app

6. Footer
   - 사업자 정보:
     상호: 몽크사진관 | 대표: 신정규
     사업자등록번호: 636-15-00574
     소재지: 경기도 하남시 미사강변동로 95, B1029
     이메일: info@monkos.ai
   - 법적 링크: 개인정보처리방침(/privacy.html) | 이용약관(/terms.html) | 환불정책(/refund.html)
   - © 2026 MONKOS AI 증명사진
```

**HTML/CSS 요구사항:**
- 모바일 퍼스트 (max-width: 480px 기준, 데스크톱 대응 불필요)
- 순수 HTML + CSS (JS 최소화, CTA 링크만)
- 다크 테마 (기존 법적 페이지 스타일 참고: refund.html, terms.html)
- 한국어 고정

---

## 배포

```bash
# 작업 완료 후
git add monkos_AI/portal/public/index.html \
        monkos_AI/idphoto-kr/server.js \
        monkos_AI/idphoto-kr/public/landing.html
git commit -m "[feature] portal OAuth 벽 제거 + idphoto-kr 앱 LP 추가"
git push origin develop
```

**dev 배포 (2건):**
```bash
./deploy.sh dev portal
./deploy.sh dev idphoto-kr
```

- dev 배포 후 동작 확인:
  - `https://monkos.ai` → 비로그인으로 대시보드 보이는지
  - `https://idphoto-kr.monkos.ai` → LP 보이는지
  - `https://idphoto-kr.monkos.ai/app` → 기존 촬영 준비실 동작하는지

---

## 검증 체크리스트

- [ ] monkos.ai 비로그인 접속 → 서비스 카드 + 이벤트 + footer 보임
- [ ] monkos.ai 로그인 버튼 → 헤더에 표시
- [ ] monkos.ai 로그인 후 → 기존과 동일 (크레딧 뱃지, 프로필)
- [ ] idphoto-kr.monkos.ai → LP 표시 (히어로 + 가격 + footer)
- [ ] idphoto-kr.monkos.ai "지금 촬영하기" 클릭 → /app 이동
- [ ] idphoto-kr.monkos.ai/app → 기존 촬영 준비실 정상 동작
- [ ] idphoto-kr.monkos.ai/refund.html 등 법적 페이지 정상

## 주의사항

- server.js 비즈니스 로직 (API 엔드포인트, WebSocket 코칭 등) 수정 금지
- 기존 OAuth 콜백 라우트 (`/auth/kakao`, `/auth/line`, `/api/auth/google`) 유지
- landing.html은 정적 페이지 — JS 로직 최소화 (CTA 링크만)
- Before/After 갤러리 이미지는 현재 에셋 없음 → 텍스트/아이콘으로 대체, 이미지는 추후 추가
