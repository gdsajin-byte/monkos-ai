---
type: REPORT
id: REPORT_20260316_블로그에디터4차_WebP+UX
date: 2026-03-16
from: iMac/막내
to: 작가님
ref: ORDER_20260316_iMac쌍아_막내_블로그에디터4차_WebP+UX5건
---

# 블로그 에디터 4차 — WebP 변환 + UX 5건 완료 보고

## Task 별 상태

| Task | 내용 | 상태 |
|------|------|------|
| 1 | 업로드 시 WebP 자동 변환 (sharp) | ✅ |
| 2 | 에디터 본문 이미지 클릭 삭제 | ✅ |
| 3 | 이미지 저장소 접기/펼치기 + 60vh 제한 | ✅ |
| 4 | 썸네일 자동 생성 + 미리보기 카드 | ✅ |
| 5 | 반응형 개선 (메인 최소폭 minmax) | ✅ |
| 6 | 커밋 + 프로덕션 배포 | ✅ |

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/lib/cms/upload.js` | sharp import + WebP 변환 로직 |
| `monkos_AI/portal/public/admin/blog-edit.html` | Task 2~5 전부 |
| `monkos_AI/portal/package.json` | sharp ^0.34.5 추가 |

## Task 1: WebP 자동 변환

- `sharp` 패키지 설치 (`^0.34.5`)
- 업로드 시 JPEG/PNG → WebP 변환 (quality: 85)
- GIF 제외 (애니메이션 손실 방지)
- 파일명 확장자도 `.webp`로 자동 교체
- 로그에 변환 전후 크기 표시
- Dockerfile: `node:20-slim` (Debian) — sharp 네이티브 빌드 호환 확인 완료

## Task 2: 에디터 본문 이미지 삭제

- `editor.on('change')` 콜백에서 WYSIWYG 컨테이너 내 이미지에 클릭 이벤트 바인딩
- `img.dataset.deleteReady` 플래그로 중복 바인딩 방지
- 클릭 시 `confirm()` 확인 후 DOM에서 제거

## Task 3: 이미지 저장소 접기/펼치기

- max-height `calc(100vh - 200px)` → `60vh`로 변경
- 접기/펼치기 토글 버튼 추가 (`toggleImageLibrary()`)
- CSS transition으로 부드러운 열림/닫힘

## Task 4: 썸네일 자동 생성 + 미리보기

### 4-1. 자동 추출
- `save()` 함수에서 썸네일 비어 있으면 본문 첫 이미지 URL 자동 추출
- 추출 후 input 필드에 반영 + 미리보기 갱신

### 4-2. 미리보기 카드
- 좌측 사이드바 태그 섹션 아래에 카드 배치
- 16:9 썸네일 + 제목 + 요약 2줄 미리보기
- 실시간 갱신: title/summary/thumbnail input + editor change 이벤트

## Task 5: 반응형 개선

- grid-template-columns: `220px minmax(480px, 820px) 300px`
- 1200px 이하: `200px minmax(400px, 820px)` — 우측 패널 숨김
- 700px 이하: 1컬럼 (기존 900px → 700px, 메인 최소폭 확보)

## 배포

- **커밋**: `92840e9` — `[blog] 에디터 4차 — WebP 변환 + 이미지 삭제 + 저장소 접기 + 썸네일 미리보기 + 반응형 개선`
- **리비전**: `monkos-portal-00157-nnz` — 트래픽 100%
- **빌드**: 55초, SUCCESS (sharp 포함 199 packages)
- **헬스 체크**: `healthy` 확인

## 특이사항

- addImageBlobHook 미수정 — WebP 변환은 서버 측에서 처리
- GIF 원본 유지 (애니메이션 손실 방지)
- `--to-latest` 미사용
