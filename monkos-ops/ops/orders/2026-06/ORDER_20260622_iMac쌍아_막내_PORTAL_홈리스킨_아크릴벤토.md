---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_PORTAL
---

# 지시서: 포털 홈 전면 리스킨 — 아크릴 벤토 디자인 + 구조 정리

## 배경
- 현재 home.js(510행)가 한국어 HTML 기본 템플릿 + replace 체인으로 i18n 치환 → 순서 충돌 버그 발생 (FAQ·블로그 한글 잔존)
- 클로드 디자인 핸드오프 패키지 수신: `monkos-ops/tech/designs/2026-06/portal_design_handoff/`
- **목표**: replace 체인 제거 + 핸드오프 디자인 적용을 한 번에 처리
- **성격**: 리스킨(프레젠테이션 레이어 교체). 백엔드·인증·크레딧·Firestore 연동은 변경 없음

## 핵심 원칙

1. **replace 체인 금지** — HTML을 한국어로 먼저 만들고 교체하는 방식 폐기. 처음부터 `lang` 변수로 텍스트팩 선택 → 직접 삽입
2. **시안은 비주얼 참조** — `reference/MONKOS Portal Light.dc.html`을 브라우저로 열어 정답 비주얼 확인. 마크업·CSS는 직접 작성 (dc.html 코드 복붙 금지)
3. **Firestore 연동 유지** — FAQ, 블로그, 게시판은 기존 Firestore 쿼리 그대로. 데이터 형태는 `content.sample.json` 참고
4. **내부 페이지 영향 없음** — 홈 전용 CSS만 변경. portal.css, headshot.css 등 건드리지 않음

## 디자인 참조

**반드시 먼저 읽을 것**: `monkos-ops/tech/designs/2026-06/portal_design_handoff/design_handoff_monkos_portal/README.md`
- 디자인 토큰 (색·타이포·간격·그림자) 전체 명세
- 6개 섹션별 컴포넌트 스펙
- 반응형 규칙 (auto-fit + minmax + clamp, 미디어쿼리 없음)
- Known inconsistencies (토큰표 값 우선)

**시안 미리보기**: `reference/MONKOS Portal Light.dc.html`을 브라우저로 열기

## 작업 항목

### 1. home.js 구조 전면 재작성

**파일**: `monkos_AI/portal/lib/cms/home.js`

기존 방식 (폐기):
```javascript
// ❌ 한국어 HTML 기본 → replace로 치환
let html = `<h1>전문 스튜디오가 개발한 AI 증명사진 서비스</h1>`;
html = html.replace(/전문 스튜디오가 개발한/, esc(d.h1));
```

새 방식:
```javascript
// ✅ 텍스트팩에서 직접 삽입
const d = HOME_I18N[lang] || HOME_I18N.ko;
const html = `<h1>${esc(d.h1)} <span class="accent">${esc(d.h1Accent)}</span> ${esc(d.h1Suffix)}</h1>`;
```

**HOME_I18N 텍스트팩**: 기존 막내1이 작성한 I18N 객체 활용 + 누락 키 보충. FAQ·블로그·게시판 텍스트는 Firestore에서 읽으므로 텍스트팩에 안 넣음.

**Firestore 데이터 삽입**: replace가 아닌 HTML 조립 시점에 직접 삽입:
```javascript
// FAQ
const faqHtml = faqItems.map(f => `
  <a href="${faqPrefix}#faq-${esc(f.id)}" class="faq-item">
    <h4>${esc(f.question)}</h4>
    <p>${esc(f.answer?.substring(0, 80))}…</p>
  </a>
`).join('');

// 전체 HTML 조립
const html = `
  ${navHtml}
  ${heroSection}
  ${headshotSection}
  ${idpassSection}
  ${faqSection(faqHtml)}
  ${boardSection(boardHtml)}
  ${blogSection(blogHtml)}
  ${footerHtml}
`;
```

### 2. 홈 전용 CSS 작성

**파일**: `monkos_AI/portal/public/css/home.css` (신규 또는 기존 확장)

핸드오프 README의 디자인 토큰을 CSS 변수로:
```css
:root {
  --board-grad: linear-gradient(180deg,#E4E5E8,#D7D8DC);
  --acrylic-bg: rgba(255,255,255,.46);
  --acrylic-blur: blur(20px);
  --acrylic-shadow: 0 26px 62px rgba(45,49,57,.15);
  --graphite-card: linear-gradient(180deg,#26282d,#1b1d21);
  --teal: #00D4AA;
  /* ... README 토큰 전체 */
}
```

아크릴판 셸, 그래파이트 카드, 반응형 그리드 등 README 스펙대로 구현.

### 3. 에셋 배치

핸드오프 `reference/assets/` 내 이미지를 포털 public 경로로 복사:
```
monkos_AI/portal/public/assets/
  headshot-linkedin.jpg
  headshot-corporate.jpg
  headshot-creative.png
  headshot-professional.jpg
  headshot-dating.jpg
  idphoto-before.jpg
  idphoto-after.jpg
  idpass-icon.png
  monkos-icon.svg
  store_01.jpg, store_03.jpg, store_05.jpg
```

### 4. layoutHead에 home.css 로드

홈 렌더 시에만 home.css 로드. 다른 페이지에 영향 없도록:
```javascript
const homeStyle = '<link rel="stylesheet" href="/css/home.css">';
```

### 5. __LANG__ / __REGION__ 유지

기존 P1-a에서 추가한 `window.__LANG__`/`__REGION__` 주입 유지. 홈에서도 서버단 언어 감지 결과가 클라이언트에 전달되어야 함.

## 섹션 순서 (시안 기준)

1. **NAV** — 로고 + 메뉴 + 언어(KO·EN·JA) + 크레딧 + 로그인
2. **HERO** — 증명사진 소개 (아크릴판 + 그래파이트 카드)
3. **HEADSHOT** — 헤드샷 5스타일 갤러리 (아크릴판 + 그래파이트)
4. **IDPASS** — 앱 다운로드 빌보드 (아크릴판 + 그래파이트)
5. **RESOURCES** — FAQ + 게시판 + 블로그 (아크릴판)
6. **FOOTER** — 사업자 정보 (다크 밴드)

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)
- dc.html 코드 복붙 금지 — 비주얼 참조만
- portal.css 수정 금지 — 홈 전용 CSS만 (내부 페이지 영향 차단)
- Firestore 쿼리·인증·크레딧 로직 변경 금지 (리스킨만)
- **반응형**: 미디어쿼리 없이 auto-fit + minmax + clamp (핸드오프 규칙)

## 검증
- [ ] `monkos.ai/` — 아크릴 벤토 디자인 적용 확인
- [ ] 데스크톱 1280px + 모바일 390px 반응형 확인
- [ ] `/ja/` — 일본어 텍스트 표시 (replace 충돌 없음)
- [ ] `/en/` — 영어 텍스트 표시 (FAQ·블로그 정상)
- [ ] FAQ — Firestore에서 해당 언어 데이터 정상 표시
- [ ] 블로그 — 해당 언어 글 필터링 정상
- [ ] 기존 내부 페이지(headshot, pricing 등) regression 없음

## 대상 파일
1. `monkos_AI/portal/lib/cms/home.js` — 전면 재작성
2. `monkos_AI/portal/public/css/home.css` — 신규 (디자인 토큰 + 아크릴 벤토)
3. `monkos_AI/portal/public/assets/` — 에셋 배치
