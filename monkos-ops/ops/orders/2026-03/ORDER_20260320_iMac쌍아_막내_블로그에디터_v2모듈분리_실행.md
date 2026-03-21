---
type: ORDER
id: ORDER_20260320_iMac쌍아_막내_블로그에디터_v2모듈분리_실행
date: 2026-03-20
from: iMac/쌍아
to: 막내
priority: P1
status: 대기
ref:
  - REPORT_20260320_막내3_포털모듈분리_설계안
  - SPEC_20260320_블로그에디터_기술명세서
---

# 블로그 에디터 v2.0 — ESM 모듈 분리 실행

**[2026-03-20 12:42 KST] iMac/쌍아 → 막내**

## 배경

막내3 설계안 작가님 승인 완료. 설계안 그대로 실행.

## 참조 문서

- 설계안: `monkos-ops/ops/reports/REPORT_20260320_막내3_포털모듈분리_설계안.md`
- 기술명세서: `monkos-ops/tech/specs/SPEC_20260320_블로그에디터_기술명세서.md`

## 실행 순서

설계안 섹션 4의 Phase 1 → Phase 2 순서 그대로 실행.

### Phase 1: 공통 CSS/JS 추출

```
Step 1-1: public/admin/css/admin-common.css 생성
  → :root 변수 12개, body reset, .nav, .btn 시리즈, .toast, .sidebar-section
  → Pretendard + Noto Sans JP 폰트 통일

Step 1-2: public/admin/js/admin-common.js 생성
  → showToast(), esc(), authFetch() export (ESM)

Step 1-3: public/admin/css/blog-editor.css 생성
  → blog-edit.html 인라인 CSS 중 에디터 전용 부분 전체 추출
```

### Phase 2: blog-edit.html JS 분리 (5단계)

```
Step 2-1: blog-share.js (의존성 최소, 가장 안전)
Step 2-2: blog-seed.js (독립적)
Step 2-3: blog-research.js (switchTab 의존 → 파라미터 주입)
Step 2-4: blog-image.js (editor 인스턴스 import)
Step 2-5: blog-editor.js (메인 모듈, editor export)
```

### 최종: blog-edit.html 정리

- 인라인 `<style>` 전체 제거 → `<link>` 2개로 교체
- 인라인 `<script>` 전체 제거 → `<script type="module">` 1개로 교체
- HTML 마크업 153줄 + ESM import 초기화 ~22줄 = **~175줄**
- HTML onclick 속성 유지 → JS에서 `window.함수명 = 함수` 등록

## 핵심 주의사항

### 1. Toast UI Editor 초기화 타이밍

```html
<!-- 반드시 이 순서 -->
<script src="https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js"></script>
<script type="module">
  // toastui가 전역에 존재하는 상태에서 initEditor() 호출
</script>
```

### 2. 이벤트 중복 방지 패턴 유지 필수

- `_isInsertingImage` 플래그 (blog-image.js)
- `img.dataset.toolbarReady` 체크 (blog-image.js)
- drop 핸들러 capture phase + stopImmediatePropagation (blog-image.js)

### 3. editor 인스턴스 공유

```javascript
// blog-editor.js
export let editor;
export function initEditor() {
  editor = new toastui.Editor({ ... });
  return editor;
}

// blog-image.js
import { editor } from './blog-editor.js';
```

단방향 의존만. 순환 참조 절대 금지.

### 4. onclick → window 전역 등록

```javascript
// blog-editor.js 하단
window.save = save;
window.preview = preview;
window.switchTab = switchTab;
// ... HTML onclick에서 호출하는 모든 함수
```

## 검증 체크리스트

분리 완료 후 반드시 전수 확인:

```
□ 새 글 작성 → 제목 입력 → slug 자동생성
□ 카테고리/언어/태그/요약 입력
□ Toast UI 에디터 WYSIWYG 타이핑
□ WYSIWYG ↔ Markdown 모드 전환
□ 이미지 뱅크 로딩 (우측 이미지 탭)
□ 이미지 뱅크 → 본문 삽입 (1장만 삽입되는지)
□ 이미지 뱅크 → 썸네일 지정
□ 이미지 드래그&드롭 삽입
□ 본문 이미지 클릭 → 플로팅 툴바 → 삭제 (깨지지 않는지)
□ 이미지 직접 업로드 (드래그 or + 업로드 버튼)
□ 썸네일 직접 업로드
□ 시드 탭 전환 → 카탈로그 로딩 → 검색 → 상세 → 글감 사용
□ 리서치 탭 전환 → 검색 → 소스 전환 (뉴스/블로그/이미지)
□ 리서치 이미지 팝업
□ 임시저장 → 재진입 → 데이터 보존
□ 발행 → 공유 버튼 활성화 → X/LINE/KakaoStory 링크
□ 기존 글 편집 (?slug= 파라미터) → 데이터 로딩
□ 내 글 목록 드롭다운
□ 미리보기 카드 실시간 갱신
□ 반응형: 1200px 이하 (우측 숨김), 700px 이하 (1컬럼)
```

## 출력

### 보고서

```
파일: monkos-ops/ops/reports/REPORT_20260320_막내_블로그에디터v2_모듈분리.md
```

보고서 구성:
1. Phase별 완료 상태
2. 생성된 파일 목록 + 각 파일 줄 수
3. 검증 체크리스트 전수 결과
4. 분리 전/후 blog-edit.html 줄 수 비교
5. 특이사항/리스크 발현 여부

### 기술명세서 갱신

분리 완료 후 기술명세서(SPEC) 섹션 6 "모듈 아키텍처"의 v2.0 부분을 실제 줄 수로 갱신.

```
파일: monkos-ops/tech/specs/SPEC_20260320_블로그에디터_기술명세서.md
```

## ⚠️ 준수 조항

- 헌법 5조 1항 — 기존 동작하는 모든 기능 보존 (체크리스트 전수 통과 필수)
- Toast UI Editor 버전 변경 금지
- HTML 마크업 구조(3컬럼) 변경 금지
- crop/, tg/ 절대 건드리지 않음
- server.js 정적 파일 서빙에서 .js MIME 타입 확인 (application/javascript)
