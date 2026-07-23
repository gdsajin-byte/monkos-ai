---
type: order
date: 2026-07-23
device: iMac
agent: 쌍아
target: 막내2
status: 대기
portfolio: PF_SPECS
---

# Phase 4a 보정 — 홈 네비 동기화

**[2026-07-23 16:26 KST]** iMac/쌍아 → 막내2

> 원인: 홈은 render-shell.js의 layoutNav를 쓰지 않고 자체 navHtml()(home.js:244)을 사용. 이전 Phase 4a에서 render-shell만 수정하여 홈 네비가 구 세트(Blog·FAQ·Gallery·Board·Guide·Pricing) 그대로 잔류.
> 발견: 민아 라이브 재확인 (prod 00532)

---

## 작업

**home.js:252~258** 의 mk-nav-links를 render-shell.js layoutNav(137~141)와 동일 세트로 교체.

**현재** (home.js:252~258):
```html
<a href="${prefix}/blog">Blog</a>
<a href="${prefix}/faq">FAQ</a>
<a href="${prefix}/gallery">Gallery</a>
<a href="${prefix}/board">Board</a>
<a href="${prefix}/guide">Guide</a>
<a href="${prefix}/pricing">Pricing</a>
```

**변경**:
```html
<a href="${prefix}/specs">ID Photo</a>
<a href="${prefix}/headshot">Headshot</a>
<a href="${prefix}/pricing">Pricing</a>
<a href="${prefix}/blog">Blog</a>
<a href="${prefix}/guide">Guide</a>
```

## 수정 대상

| 파일 | 위치 |
|------|------|
| `monkos_AI/portal/lib/cms/home.js` | :252~258 mk-nav-links |

## 검증

1. dev 배포 후 홈 네비가 ID Photo·Headshot·Pricing·Blog·Guide 순서로 표시
2. ko/en/ja 3언어 확인
3. 부속 페이지 네비(render-shell)와 동일 세트 확인
4. jest 통과

## 완료 보고

- COMPLETION 파일 + PF_SPECS 히스토리 + 커밋 → 푸시
- prod 배포 포함 (민아 합격 완료 건의 1-hunk 보정이므로)
