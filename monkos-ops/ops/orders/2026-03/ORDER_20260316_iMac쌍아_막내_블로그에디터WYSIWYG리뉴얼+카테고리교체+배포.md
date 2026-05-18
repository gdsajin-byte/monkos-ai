---
type: ORDER
id: ORDER_20260316_iMac쌍아_막내_블로그에디터WYSIWYG리뉴얼+카테고리교체+배포
date: 2026-03-16
from: iMac/쌍아
to: 막내
priority: P0
status: 대기
---

# 블로그 에디터 WYSIWYG 리뉴얼 + 카테고리 교체 + 프로덕션 배포

## 배경

블로그 에디터의 핵심 전환: MD 편집 → WYSIWYG. 사진 중심 콘텐츠(사진/패션/헤어/메이크업)에 맞게 네이버 블로그처럼 이미지 삽입 즉시 반영되는 에디터로 전환. 동시에 카테고리 체계를 7개로 교체.

---

## Task 1: 에디터 레이아웃 리뉴얼 — WYSIWYG + 사이드바

대상: `monkos_AI/portal/public/admin/blog-edit.html`

### 현재
- `max-width: 1200px` 단일 컬럼
- Toast UI `initialEditType: 'markdown'`, `previewStyle: 'vertical'` (좌우 50:50)
- 메타 설정은 에디터 위 접힘 패널

### 변경

**전체 레이아웃을 2컬럼으로 전환:**

```
┌──────────────────────────────┬──────────────────┐
│  nav (전체폭)                                    │
├──────────────────────────────┬──────────────────┤
│  메인 영역 (~840px)           │  사이드바 (~340px) │
│                              │                  │
│  [Title input]               │  카테고리          │
│                              │  태그             │
│  [WYSIWYG 에디터]             │  언어             │
│  이미지 드래그→즉시 보임       │  썸네일 (+업로드)  │
│  서식 즉시 반영               │  slug + 안내문    │
│  min-height: 70vh            │  summary         │
│                              │  pinned 체크박스   │
│  [Save Draft] [Publish]      │                  │
└──────────────────────────────┴──────────────────┘
```

**CSS 변경:**
```css
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.editor-main {
  min-width: 0;  /* grid overflow 방지 */
}

.editor-sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.sidebar-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.sidebar-section label {
  display: block;
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 6px;
  font-weight: 500;
}
```

**Toast UI 설정 변경:**
```javascript
const editor = new toastui.Editor({
  el: document.getElementById('editor'),
  height: '70vh',
  initialEditType: 'wysiwyg',   // ← markdown → wysiwyg
  previewStyle: 'tab',           // ← vertical → tab (내장 미리보기 비활성화)
  // hooks: addImageBlobHook 기존 유지 (이미지 업로드 동작)
});
```

**기존 `.container`, `.form-grid`, `.meta-toggle`, `.meta-panel` 제거** — 사이드바 구조로 대체.

**nav, toast, 버튼 그룹 스타일은 유지.**

**반응형 (모바일 fallback):**
```css
@media (max-width: 900px) {
  .editor-layout { grid-template-columns: 1fr; }
  .editor-sidebar { position: static; max-height: none; }
}
```

---

## Task 2: 카테고리 7개 교체

### 2-1. 에디터 드롭다운 (blog-edit.html 사이드바)

**현재 (5개):**
```html
<option value="증명사진">증명사진</option>
<option value="여권·비자">여권·비자</option>
<option value="취업·이력서">취업·이력서</option>
<option value="헤어·메이크업">헤어·메이크업</option>
<option value="news">뉴스 (News)</option>
```

**변경 (7개):**
```html
<option value="">-- 선택 --</option>
<option value="사진">사진</option>
<option value="패션">패션</option>
<option value="헤어">헤어</option>
<option value="메이크업">메이크업</option>
<option value="AI">AI</option>
<option value="news">News</option>
<option value="기타">기타</option>
```

### 2-2. 홈 EMOJI 매핑 (home.js 19행)

**현재:**
```javascript
const EMOJI = { '증명사진': '📸', '여권·비자': '🛂', '취업·이력서': '💼', '헤어·메이크업': '💆', 'news': '📰', 'default': '💡' };
```

**변경:**
```javascript
const EMOJI = { '사진': '📸', '패션': '👗', '헤어': '💇', '메이크업': '💄', 'AI': '🤖', 'news': '📰', '기타': '💡', 'default': '💡' };
```

### 2-3. 네이버 임포터 매핑 (naver.js 14~20행)

**현재:**
```javascript
const CATEGORY_MAP = {
  'MONKOS AI': { category: '증명사진', author: 'MONKOS' },
  "SHIN's AI story": { category: '증명사진', author: '신작가' },
  "HAN's BEAUTY": { category: '헤어·메이크업', author: '한송이' },
  "KKU's DESIGN": { category: '증명사진', author: '꾸' },
};
```

**변경:**
```javascript
const CATEGORY_MAP = {
  'MONKOS AI': { category: 'AI', author: 'MONKOS' },
  "SHIN's AI story": { category: 'AI', author: '신작가' },
  "HAN's BEAUTY": { category: '메이크업', author: '한송이' },
  "KKU's DESIGN": { category: '사진', author: '꾸' },
};
```

### 2-4. 홈 뉴스 필터 확인 (home.js 140행)

`category === 'news'` 필터는 value가 `news`로 동일하므로 **변경 불필요**. 확인만 할 것.

---

## Task 3: 기존 Firestore 데이터 마이그레이션

기존 `blog_posts` 컬렉션의 카테고리 값을 새 체계로 매핑:

| 기존 | 신규 |
|------|------|
| 증명사진 | 사진 |
| 여권·비자 | 사진 |
| 취업·이력서 | 사진 |
| 헤어·메이크업 | 메이크업 |
| news | news (유지) |
| (빈값) | (빈값 유지) |

- 일회성 마이그레이션 스크립트 작성 (`scripts/migrate_blog_category.js`)
- 실행 후 변경 건수 콘솔 출력
- 기존 seed 파일 패턴 (`monkos_AI/portal/scripts/seed_*.js`) 준용

---

## Task 4: 커밋 + 프로덕션 배포

1. 변경 파일 전체 커밋
   - 메시지: `[blog] 에디터 WYSIWYG 리뉴얼 + 카테고리 7개 교체`
2. `deploy.sh prod` 실행 → Cloud Run 프로덕션 배포
3. 배포 후 검증:
   - `/admin/blog-edit.html` 접속 → WYSIWYG 에디터 + 사이드바 레이아웃 확인
   - 카테고리 드롭다운 7개 확인
   - 이미지 드래그 앤 드롭 → 즉시 렌더링 확인
   - 기존 글 편집 → 카테고리 정상 로드 확인
   - `/` 홈 → EMOJI 매핑 정상 확인

---

## 출력

완료 보고서:
```
파일: monkos-ops/ops/reports/2026-03/REPORT_20260316_블로그에디터WYSIWYG리뉴얼.md
```

```yaml
---
type: REPORT
id: REPORT_20260316_블로그에디터WYSIWYG리뉴얼
date: 2026-03-16
from: iMac/막내
to: 작가님
ref: ORDER_20260316_iMac쌍아_막내_블로그에디터WYSIWYG리뉴얼+카테고리교체+배포
---
```

## ⚠️ 준수 조항

- 헌법 5조 1항 — 기존 저장/발행/이미지업로드 플로우 절대 깨뜨리지 말 것
- 헌법 3조 2항 — 어드민 페이지에 내부 호칭 노출 금지
- 기존 blog-edit.html의 nav, toast, 내 글 목록 드롭다운, slug 세니타이징, 썸네일 업로드 기능 모두 보존
- Toast UI addImageBlobHook (이미지 업로드 → GCS) 기존 로직 그대로 유지
- deploy.sh prod 배포 시 `--to-latest` 사용 금지 (이전 제거 완료 확인)
