---
type: ORDER
id: ORDER_20260320_M1쌍아_막내2_블로그Firestore클린업
date: 2026-03-20
from: M1/쌍아
to: 막내2
priority: P1-높음
status: 대기
origin: ORDER_20260320_M1코웍이_막내_블로그클린업_번역이미지수정 (작가님 특별지시 → 쌍아 사후추인)
---

# 블로그 Firestore 클린업 — 유령 글 삭제 + 중복 정리

**[2026-03-20 22:17 KST] M1/쌍아 → 막내2**

## 배경

코웍이 MCP 크롬 크롤링 분석 (monkos.ai/blog 37건):
- 이미지 없는 글: 16건 (43%)
- title 없는 유령 글: 10건
- 동일 언어 내 중복: 4쌍 이상

## 작업 A: 유령 글 삭제

### 스크립트 작성
- 경로: `monkos_AI/portal/scripts/cleanup_ghost_posts.js`
- 기존 스크립트 참조: `scripts/migrate_blog_thumbnail.js` (Firestore 접근 패턴)

### 삭제 조건
- `title` 필드가 비어있거나 없는 문서
- `content` 필드가 비어있거나 없는 문서
- 위 조건 중 하나라도 해당하면 대상

### 실행 흐름
1. `blog_posts` 전체 조회
2. **dry-run (기본)**: 대상 문서 목록 출력 (slug, lang, createdAt)
3. **보고서 작성** → 작가님 확인 대기
4. `--execute` 플래그 시에만 실제 삭제

## 작업 B: 중복 글 정리

### 판별 기준
- 같은 `lang` + 같은 `originalSlug`를 가진 문서가 2건 이상
- 최신 `updatedAt` 문서만 보존, 나머지 삭제

### 의심 중복 목록 (코웍이 크롤링)
| 언어 | 키워드 | 비고 |
|------|--------|------|
| JA | 証明写真のヘアスタイル | 3/19 + 3/17 두 건 |
| EN | ID Photo Makeup | 3/19 두 건 (제목 상이) |
| EN | Baby Passport Photo | 3/19 두 건 (제목 상이) |
| JA | 就活写真 服装 | 3/19 + 3/14 유사 |

### 실행 흐름
1. `originalSlug` + `lang` 기준 그룹핑
2. 2건 이상인 그룹 식별
3. **dry-run**: 중복 그룹별 보존/삭제 대상 출력
4. 보고서 작성 → 작가님 확인 대기
5. `--execute` 시 삭제

## 완료 조건

- [ ] cleanup_ghost_posts.js 작성
- [ ] dry-run 실행 → 유령 글 목록 보고 (slug, lang, createdAt 포함)
- [ ] 중복 글 그룹핑 → 중복 목록 보고 (보존 vs 삭제 명시)
- [ ] **dry-run 보고서 작성 후 실행 대기** (독단 삭제 절대 금지)
- [ ] 커밋 태그: `[fix] 블로그 클린업 스크립트`

## 주의사항

- **dry-run 결과를 반드시 보고 후 실행. 독단 삭제 금지**
- 스크립트는 `scripts/` 폴더에 작성 (일회성이어도 기록)
- Firestore 접근은 기존 `lib/shared/config.js` 임포트 활용
