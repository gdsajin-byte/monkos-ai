---
type: REPORT
id: REPORT_20260316_블로그에디터WYSIWYG리뉴얼
date: 2026-03-16
from: iMac/막내
to: 작가님
ref: ORDER_20260316_iMac쌍아_막내_블로그에디터WYSIWYG리뉴얼+카테고리교체+배포
---

# 블로그 에디터 WYSIWYG 리뉴얼 + 카테고리 교체 — 완료 보고

## Task 별 상태

| Task | 내용 | 상태 |
|------|------|------|
| 1 | 에디터 WYSIWYG + 2컬럼 사이드바 레이아웃 | ✅ |
| 2 | 카테고리 7개 교체 (에디터/home.js/naver.js) | ✅ |
| 3 | Firestore 마이그레이션 (37건 중 14건 변환) | ✅ |
| 4 | 커밋 + 프로덕션 배포 + 검증 | ✅ |

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/public/admin/blog-edit.html` | 전면 리뉴얼 — WYSIWYG + 2컬럼 사이드바 |
| `monkos_AI/portal/lib/cms/home.js` | EMOJI 매핑 7개 교체 |
| `monkos_AI/portal/lib/cms/importer/naver.js` | CATEGORY_MAP 4개 교체 |
| `monkos_AI/portal/scripts/migrate_blog_category.js` | 신규 — 1회성 마이그레이션 스크립트 |

## Task 1 상세: 에디터 리뉴얼

- **레이아웃**: 단일 컬럼 → `grid: 1fr 340px` 2컬럼
- **메인 영역**: Title input + WYSIWYG 에디터 (70vh) + 버튼 그룹
- **사이드바**: sticky, 카테고리/태그/언어/썸네일/slug/summary/pinned 7개 섹션
- **Toast UI**: `initialEditType: 'wysiwyg'`, `previewStyle: 'tab'`
- **반응형**: 900px 이하에서 1컬럼 fallback
- **보존 기능**: nav, 내 글 목록 드롭다운, slug 세니타이징, 썸네일 업로드, addImageBlobHook, toast, save/publish/preview 전체 유지
- **제거**: `.container`, `.form-grid`, `.meta-toggle`, `.meta-panel` (사이드바로 대체)

## Task 2 상세: 카테고리 교체

| 구분 | 이전 | 이후 |
|------|------|------|
| 에디터 드롭다운 | 5개 (증명사진/여권·비자/취업·이력서/헤어·메이크업/뉴스) | 7개 (사진/패션/헤어/메이크업/AI/News/기타) |
| home.js EMOJI | 6개 매핑 | 8개 매핑 (👗패션, 💇헤어, 💄메이크업, 🤖AI 추가) |
| naver.js MAP | 4개 (증명사진/헤어·메이크업 중심) | 4개 (AI/사진/메이크업 중심) |

- home.js `category === 'news'` 필터: `news` 값 동일 → 변경 불필요 확인

## Task 3 상세: Firestore 마이그레이션

- 스크립트: `monkos_AI/portal/scripts/migrate_blog_category.js`
- 결과: **37건** 중 **14건 변경**, 23건 유지
  - 증명사진(6건) → 사진
  - 헤어·메이크업(8건) → 메이크업
- dry-run 검증 후 실행

## Task 4 상세: 배포

- **커밋**: `689f0a2` — `[blog] 에디터 WYSIWYG 리뉴얼 + 카테고리 7개 교체`
- **리비전**: `monkos-portal-00154-9q8` — 트래픽 100%
- **빌드**: 51초, SUCCESS
- **헬스 체크**: `healthy` 확인

## 특이사항

- 헌법 5조 1항 준수: 기존 저장/발행/이미지업로드 플로우 완전 보존
- 헌법 3조 2항 준수: 어드민 페이지에 내부 호칭 없음
- `editor.getMarkdown()` 유지 — WYSIWYG 모드에서도 Toast UI는 내부적으로 MD 변환하여 저장하므로 백엔드 호환 100%
