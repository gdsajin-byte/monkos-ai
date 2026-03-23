# 지시서 — mag-card 썸네일 렌더링 수정

**[2026-03-15 07:20 KST] M1/코웍이 → M1/쌍아 → 막내**

---

## 원인 확정

### 브라우저 직접 점검 결과

- **Firestore 데이터**: `thumbnail` 필드 존재 확인. 크롤링 시 note.com 이미지 URL 정상 저장됨
  예: `https://assets.st-note.com/img/1772954981-kcRMX8eY9qtZmzl5BIAwsx3u.jpg?width=1200`
- **블로그 상세 페이지**: 해당 이미지 정상 표시 ✅
- **홈 mag-card**: `thumbnail` 필드 완전 무시, 항상 gradient + 💡 emoji fallback만 렌더링 ❌

### 현재 mag-card 렌더 HTML (실제 확인)

```html
<div class="mag-img" style="background:linear-gradient(135deg,#f0eee8,#e8e5de)">
  <span class="icon">💡</span>
</div>
```

`thumbnail` URL이 Firestore에 있음에도 렌더러가 체크하지 않고 있음.

---

## 수정 대상

mag-card를 렌더링하는 SSR 코드. 위치 후보:
- `lib/cms/render.js` — mag-card 렌더 함수
- `index.html` SSR 인라인 블록 (하드코딩 카드를 SSR로 전환 중인 경우 여기)

---

## 수정 내용

### mag-card `.mag-img` 렌더링 로직

```js
// 현재 (thumbnail 무시)
`<div class="mag-img" style="background:linear-gradient(135deg,#f0eee8,#e8e5de)">
  <span class="icon">💡</span>
</div>`

// 수정 (thumbnail 있으면 이미지, 없으면 gradient fallback)
post.thumbnail
  ? `<div class="mag-img" style="background:url('${post.thumbnail}') center/cover no-repeat; background-color:#f0eee8;">
      <!-- 이미지 있을 때 icon 숨김 -->
    </div>`
  : `<div class="mag-img" style="background:linear-gradient(135deg,#f0eee8,#e8e5de)">
      <span class="icon">💡</span>
    </div>`
```

### 간단 버전 (한 줄 조건)

```js
const thumbStyle = post.thumbnail
  ? `background:url('${post.thumbnail}') center/cover no-repeat; background-color:#f0eee8`
  : `background:linear-gradient(135deg,#f0eee8,#e8e5de)`;

const thumbContent = post.thumbnail ? '' : '<span class="icon">💡</span>';

// 렌더
`<div class="mag-img" style="${thumbStyle}">${thumbContent}</div>`
```

---

## 추가 고려사항

### note.com CDN 크로스오리진 이슈 주의

`assets.st-note.com` 이미지는 외부 CDN이므로 CSS `background-image`로는 정상 로드되나,
향후 자체 CDN(Firebase Storage 등)으로 미러링하는 것이 안정적. **지금은 외부 URL 직접 사용 OK.**

### 그라디언트 색상 통일

포스트별로 다른 gradient 색상을 쓰는 로직이 있다면 (카테고리별 색상 분기 등) 유지.
thumbnail이 있으면 그 위에 덮어쓰는 방식으로 처리.

---

## 검증

- [ ] 홈 mag-card에 note.com 썸네일 이미지 표시
- [ ] thumbnail이 null인 포스트는 gradient + 이모지 fallback 정상 표시
- [ ] 이미지 로드 실패 시 gradient로 graceful fallback (CSS `background-color` 보조)

---

## 배포 순서

하드코딩 카드 SSR 전환 작업과 동시에 처리 가능.
현재 SSR 전환 중이라면 전환 코드에 이 로직 함께 반영 요청.

---

*원본: M1/코웍이 | 2026-03-15 07:20 KST*
