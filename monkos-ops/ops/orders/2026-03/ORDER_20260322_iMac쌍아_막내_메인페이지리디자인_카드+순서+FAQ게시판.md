---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 높음
ref: PROPOSAL_20260322_민아_monkosAI_메인페이지_리디자인
---

# 지시서: 메인페이지 리디자인 — 서비스 카드 + 순서 변경 + FAQ/게시판 추가

> **[2026-03-22 18:41 KST] iMac/쌍아 → 막내1**

## 배경

민아 기안서 `PROPOSAL_20260322_민아_monkosAI_메인페이지_리디자인.md` 기반. 작가님 승인 완료.

- 서비스 소개 문구: ✅ 이미 반영됨
- 앱 활용법 개편: 보류 (이미지 에셋 준비 후)

## 대상 파일

- `monkos_AI/portal/public/css/portal.css` — 서비스 카드 CSS
- `monkos_AI/portal/public/index.html` — 메인 영역 순서 변경 + FAQ/게시판 섹션 추가
- `monkos_AI/portal/lib/cms/home.js` — FAQ/게시판 동적 데이터 SSR 주입

## 수정 1: 서비스 카드 CSS 강화 (portal.css)

현재 `.svc` 카드가 화이트 배경 위 화이트 카드라서 묻힘.

### AI 증명사진 카드 (`.svc.live`)

```css
.svc.live {
  background: linear-gradient(135deg, rgba(108, 79, 255, 0.04), rgba(108, 79, 255, 0.08));
  border: 1.5px solid rgba(108, 79, 255, 0.2);
}
.svc.live:hover {
  border-color: rgba(108, 79, 255, 0.4);
  box-shadow: 0 8px 24px rgba(108, 79, 255, 0.12);
  transform: translateY(-2px);
}
```

### 무료 크롭앱 카드 (`.svc.free`)

```css
.svc.free {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(16, 185, 129, 0.08));
  border: 1.5px solid rgba(16, 185, 129, 0.2);
}
.svc.free:hover {
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
  transform: translateY(-2px);
}
```

### LIVE/FREE 뱃지 키우기

```css
.svc-bdg {
  font-size: 11px;
  padding: 3px 10px;
  font-weight: 700;
  border-radius: 6px;
}
```

### CTA 링크 → 소형 버튼화

```css
.svc-link {
  display: inline-block;
  margin-top: 8px;
  padding: 6px 14px;
  background: var(--accent);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
.svc.free .svc-link {
  background: #10B981;
}
```

기존 `.svc` 공통 스타일에 `transition: all 0.2s;` 추가.

## 수정 2: 메인 영역 콘텐츠 순서 변경 (index.html)

### 현재 순서 (204~231행)

```
서비스 소개 → 서비스 카드 → 앱 활용법 → 최근 블로그 → 업계 소식
```

### 변경 순서

```
서비스 소개 → 서비스 카드 → 앱 활용법 → FAQ → 게시판 → 최근 블로그
```

**업계 소식 섹션(227~231행) 삭제.** (뉴스는 블로그에 통합)

### FAQ 섹션 추가 (앱 활용법 다음에 삽입)

```html
<div class="sec-h"><h2>자주 묻는 질문</h2><a href="/faq">전체보기 →</a></div>
<div class="faq-list" id="faqPreview">
  <div class="faq-item"><h4>증명사진 규격은 어떻게 되나요?</h4><p>한국 여권사진 3.5×4.5cm, 반명함 3×4cm을 지원합니다. 촬영 시 규격을 선택하면 AI가 자동 크롭합니다.</p></div>
  <div class="faq-item"><h4>AI가 만든 사진을 공식 서류에 쓸 수 있나요?</h4><p>네, ICAO 국제 규격에 부합하도록 제작됩니다. 단, 최종 판단은 발급 기관에 있습니다.</p></div>
  <div class="faq-item"><h4>환불은 어떻게 하나요?</h4><p>크레딧 결제 후 미사용분은 전액 환불됩니다. 고객센터로 문의해주세요.</p></div>
</div>
```

### 게시판 미리보기 섹션 추가 (FAQ 다음에 삽입)

```html
<div class="sec-h"><h2>고객 게시판</h2><a href="/board">전체보기 →</a></div>
<div class="board-preview" id="boardPreview">
  <p style="color:var(--ink-m);padding:12px 0;font-size:13px">게시글을 불러오는 중...</p>
</div>
```

### FAQ/게시판 CSS 추가 (portal.css)

```css
/* FAQ preview */
.faq-list { display: flex; flex-direction: column; gap: 8px; }
.faq-item {
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.faq-item:hover { border-color: var(--accent); }
.faq-item h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-bright);
  margin-bottom: 6px;
}
.faq-item p {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Board preview */
.board-preview { display: flex; flex-direction: column; gap: 6px; }
.board-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s;
}
.board-item:hover { border-color: var(--accent); }
.board-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.board-item-meta {
  font-size: 11px;
  color: var(--text-dim);
  white-space: nowrap;
  margin-left: 12px;
}
.board-item-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 8px;
  white-space: nowrap;
}
.board-item-badge.answered {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
```

## 수정 3: home.js — FAQ/게시판 동적 데이터 SSR 주입

### FAQ 동적화 (Firestore faq 컬렉션 상위 3건)

기존 FAQ 페이지(`/faq`)에서 사용하는 데이터 소스를 활용. `renderHome()`에서:

```javascript
// 6. FAQ preview (상위 3건)
const faqSnap = await firestore.collection('faq').orderBy('order', 'asc').limit(3).get().catch(() => ({ docs: [] }));
if (faqSnap.docs.length > 0) {
  const faqHtml = faqSnap.docs.map(d => {
    const f = d.data();
    return `  <div class="faq-item"><h4>${esc(f.question)}</h4><p>${esc(f.answer)}</p></div>`;
  }).join('\n');
  html = html.replace(
    /(<div class="faq-list" id="faqPreview">)\n[\s\S]*?(<\/div>\n\n\s*<div class="sec-h"><h2>고객 게시판)/,
    `$1\n${faqHtml}\n$2`
  );
}
```

**FAQ 컬렉션이 없으면**: index.html의 정적 FAQ 3건이 그대로 표시 (fallback).

### 게시판 동적화 (Firestore board 컬렉션 최근 5건, 답변 완료만)

```javascript
// 7. Board preview (답변 완료 최근 5건)
const boardSnap = await firestore.collection('board')
  .where('answered', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(5)
  .get()
  .catch(() => ({ docs: [] }));

if (boardSnap.docs.length > 0) {
  const boardHtml = boardSnap.docs.map(d => {
    const b = d.data();
    return `  <a href="/board#${d.id}" class="board-item"><span class="board-item-title">${esc(b.title)}</span><span class="board-item-badge answered">답변완료</span><span class="board-item-meta">${fmtDate(b.createdAt)}</span></a>`;
  }).join('\n');
  html = html.replace(
    /(<div class="board-preview" id="boardPreview">)\n[\s\S]*?(<\/div>\n\n\s*<div class="sec-h"><h2>최근 블로그)/,
    `$1\n${boardHtml}\n$2`
  );
} else {
  // 게시글 없으면 섹션 자체 숨김
  html = html.replace(
    /\s*<div class="sec-h"><h2>고객 게시판<\/h2>[\s\S]*?<\/div>\n\n(\s*<div class="sec-h"><h2>최근 블로그)/,
    '\n$1'
  );
}
```

### home.js — 업계 소식 SSR 로직 제거

기존 뉴스 카드 렌더링 로직(143~157행)과 `newsCard()` 함수 제거. index.html에서 업계 소식 섹션을 삭제하므로 매칭 실패 방지.

## 수정 4: home.js — regex 매칭 패턴 수정

index.html 구조가 변경되므로, 기존 SSR regex(블로그 카드 교체 등)의 매칭 패턴이 달라짐. **반드시 수정 후 전체 regex를 재검증할 것.**

특히:
- 블로그 카드 교체 regex (138~141행): `업계 소식` → `최근 블로그` 뒤에 오는 것이 아니라 `</main>` 앞이 됨
- 뉴스 카드 교체 regex (147~157행): 삭제

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/css/portal.css monkos_AI/portal/public/index.html monkos_AI/portal/lib/cms/home.js
git commit -m "[feat] 메인페이지 리디자인 — 서비스카드 강화 + FAQ/게시판 추가 + 업계소식 삭제"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

1. monkos.ai 하드 리프레시 → 서비스 카드 보라/그린 그라데이션 확인
2. 콘텐츠 순서: 서비스 소개 → 카드 → 활용법 → FAQ → (게시판) → 블로그
3. FAQ 3건 표시 확인
4. 게시판: 답변 완료 글이 있으면 표시, 없으면 섹션 숨김
5. **모바일 뷰** (375px) 확인 — 카드/FAQ/게시판 깨지지 않는지
6. 업계 소식 섹션 사라졌는지

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 헌법 제5조 1항: 되는 것만 응답 — FAQ 답변 내용은 현재 서비스 기준
- home.js의 SSR regex 수정 시 기존 매거진/태그/블로그 교체 로직이 깨지지 않도록 주의
- 배포 후 작가님 확인 요청 필수
