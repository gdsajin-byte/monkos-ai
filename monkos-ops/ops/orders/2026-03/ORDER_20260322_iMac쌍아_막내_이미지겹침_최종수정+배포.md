---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 겹침 최종 수정 + prod 배포

> **[2026-03-22 12:28 KST] iMac/쌍아 → 막내1**

## 배경

- 이미지 겹침의 CSS 수정(eafde7c)과 Cache-Control 헤더 추가는 코드에 반영 완료
- 그러나 **prod 미배포** 상태 — GFE 캐시 문제로 이전 배포도 반영 안 됐음
- 잔존 코드 문제 1건 수정 후 배포

## STEP 1: 코드 수정 (1건)

### `blog-image.js:118` — toggleImageLibrary() display 값 수정

**현재:**
```javascript
lib.style.display = 'grid';
```

**변경:**
```javascript
lib.style.display = '';
```

**이유:** `#imageLibrary`는 더 이상 grid 컨테이너가 아님. 내부 `.img-lib-grid`가 각 날짜 그룹별 grid. `display=''`로 인라인 스타일을 제거하면 CSS 기본값(block)이 적용됨.

## STEP 2: ESM 모듈 캐시 버스팅 추가

`blog-edit.html:168-172`의 ESM import에 캐시 버스팅 추가:

```javascript
import { initEditor, setupEditorBindings, loadPost, switchTab } from './js/blog-editor.js?v=20260322e';
import { setupImageHandlers } from './js/blog-image.js?v=20260322e';
import { loadSeedCatalog } from './js/blog-seed.js?v=20260322e';
import { initResearch } from './js/blog-research.js?v=20260322e';
import './js/blog-share.js?v=20260322e';
```

`admin-common.css`에도 캐시 버스팅 추가 (blog-edit.html:10):
```html
<link rel="stylesheet" href="css/admin-common.css?v=20260322e">
```

`blog-editor.css` 버전도 갱신 (blog-edit.html:11):
```html
<link rel="stylesheet" href="css/blog-editor.css?v=20260322e">
```

## STEP 3: 커밋

```bash
git add monkos_AI/portal/public/admin/js/blog-image.js monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] 이미지 뱅크 — toggleImageLibrary display 수정 + 캐시 버스팅"
```

## STEP 4: prod 배포

```bash
cd monkos_AI/portal
./deploy.sh prod
```

## STEP 5: 배포 검증

배포 완료 후 아래 명령 실행하여 결과 보고:

```bash
# 1. Cache-Control 헤더 확인
curl -I https://monkos.ai/admin/css/blog-editor.css 2>/dev/null | grep -i cache

# 2. CSS 내용 확인 (overflow-y: hidden이 있어야 정상)
curl -s https://monkos.ai/admin/css/blog-editor.css | grep "overflow-y"

# 3. JS 내용 확인 (display = '' 이어야 정상)
curl -s https://monkos.ai/admin/js/blog-image.js | grep "display"
```

## ⚠️ 준수 조항
- 헌법 제4조 2항: deploy.sh 실행 시 prod 확인 프롬프트 반드시 확인
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님에게 확인 요청 필수
