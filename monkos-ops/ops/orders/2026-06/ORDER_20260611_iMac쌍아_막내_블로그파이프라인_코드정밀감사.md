---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내
portfolio: PF_OPUS
status: 대기
---

# 지시서 — 블로그 파이프라인 코드 정밀 감사

**[2026-06-11 11:27 KST] iMac/쌍아 → iMac/막내**

---

## 배경

블로그 컨텐츠 루프 전수조사(REPORT_20260611)에서 "설계 완비, 실행 초기, 자동화 0%"로 판정. 그러나 코드 레벨의 실제 작동 여부가 미검증 상태다. 특히 "자동화 구현 완료"라 보고된 기능들이 실제로 작동하는지, 만들어놓고 사용하지 않는 코드는 없는지, 파이프라인에서 끊기는 구간이 어디인지 정밀 감사한다.

---

## ⚠️ 준수 조항

- 헌법 4조 1항: 비밀정보 보호 (API 키, 토큰 등 코드에 노출 시 값 자체를 보고서에 기재하지 말 것)
- 헌법 4조 2항: 파괴적 명령 금지 (읽기 전용 분석. 코드 수정 없음)
- ch7 3조: 지시서 범위 밖 작업 금지

---

## 임무

### Task 1: 발행 후 자동화 체인 실제 작동 검증

blog.js에서 발행(published=true) 시 트리거되는 자동화 체인을 코드 레벨로 추적하여, 각 단계가 실제로 호출되는지 검증한다.

| # | 자동화 단계 | 검증 파일 | 검증 항목 |
|---|-----------|----------|----------|
| A-1 | 자동번역 (translateAndSaveBlogPost) | `monkos_AI/portal/lib/cms/translate.js` | 호출 조건, maxOutputTokens 값, 에러 핸들링, 실패 시 로깅 여부 |
| A-2 | GitHub Issues 자동 생성 (publishBlogToGitHub) | `monkos_AI/portal/lib/cms/github-issues.js` | 호출 조건(카테고리 필터), 토큰 유무, 실제 리포 타겟, 최근 생성된 Issue 확인 |
| A-3 | Google Indexing API (requestIndexing) | `monkos_AI/portal/lib/cms/seo.js` | SA 키 경로, 스코프 설정, 에러 핸들링, 실제 호출 로그 유무 |
| A-4 | llms.txt 갱신 (appendToLlmsTxt) | `monkos_AI/portal/lib/cms/seo.js` | 파일 경로, 갱신 로직, 실제 llms.txt 파일 내용 확인 |
| A-5 | Sitemap ping (pingSitemap) | `monkos_AI/portal/lib/cms/seo.js` | ping URL, 실제 호출 여부 |

각 단계에 대해: **코드 경로 추적** → **실제 호출 조건** → **실패 시 동작** → **최근 실행 증거** 순으로 보고.

### Task 2: 데드 코드 / 미사용 코드 탐색

만들어놓고 사용하지 않는 코드를 찾는다.

| # | 탐색 대상 | 검증 방법 |
|---|----------|----------|
| B-1 | 네이버 크롤러 (`lib/cms/importer/naver.js`) | server.js에 라우트 존재 여부, 실행 스크립트/스케줄 존재 여부 |
| B-2 | note.com 크롤러 (`lib/cms/importer/note.js`) | 위와 동일 |
| B-3 | blog-audit.js (`scripts/blog-audit.js`) | 자동 실행 스케줄 존재 여부, 최근 실행 이력 |
| B-4 | blog-seed.js (에디터 시드 카탈로그) | `episode_catalog.json` 존재 여부, 실제 사용 여부 |
| B-5 | blog-research.js (에디터 리서치 탭) | 네이버 API 키 설정 여부, 실제 작동 여부 |
| B-6 | migrate_blog_thumbnail.js / migrate_blog_category.js | 일회성인지 상시인지, 현재 필요 여부 |
| B-7 | 에디터 JS 모듈 중 import되지 않는 모듈 | blog-edit.html에서 실제 로드하는 JS vs 존재하는 JS 비교 |

### Task 3: 파이프라인 병목 구간 정밀 분석

실행은 되지만 제대로 안 되거나 빠지는 구간을 찾는다.

| # | 병목 후보 | 검증 항목 |
|---|----------|----------|
| C-1 | 번역 잘림 | translate.js의 maxOutputTokens 실제 값, 긴 글 대응 로직 유무 |
| C-2 | 시드 스크립트 번역 미연결 | seed_blog_20260424.js가 번역 체인을 트리거하지 않는 것이 의도적인지 |
| C-3 | OG desc 영문 고정 | render-blog.js에서 OG meta 태그 생성 로직, 언어별 분기 여부 |
| C-4 | H1 영문 고정 | render-blog.js에서 title 렌더링 로직, 번역본 title 사용 여부 |
| C-5 | 블로그 리다이렉트 하드코딩 | server.js 내 한글 URL 리다이렉트 맵, 새 글 추가 시 수동 관리 필요 여부 |
| C-6 | RSS/Atom 피드 | 외부 채널 자동 연동을 위한 피드 존재 여부 |
| C-7 | 카테고리/태그 시스템 | 에디터에서 설정한 카테고리가 프론트에서 필터링/탐색에 사용되는지 |
| C-8 | 검색 기능 | 블로그 내 검색 존재 여부, 구현 상태 |

### Task 4: 외부 연동 상태 점검

| # | 연동 | 검증 항목 |
|---|------|----------|
| D-1 | Google Indexing API | SA 키 등록 여부 (Secret Manager에서 확인 — 값 노출 금지), 스코프 권한 |
| D-2 | GitHub Issues | 리포 설정, 토큰 설정, 최근 자동 생성 Issue 존재 여부 (`gh issue list` 확인) |
| D-3 | 네이버 검색 API (에디터 리서치) | API 키 설정 여부, 동작 여부 |
| D-4 | llms.txt | 현재 파일 내용, 최근 갱신 시점, 블로그 URL 포함 여부 |

---

## 산출물

1. **보고서**: `monkos-ops/ops/reports/2026-06/REPORT_20260611_iMac막내_블로그파이프라인_코드정밀감사.md`
   - Task별 검증 결과 테이블
   - 발견 사항을 Critical / High / Medium / Info로 분류
   - 각 발견에 파일명:행번호 명시
2. **세션 로그 어펜드**: 본인 세션 로그
3. **완료 보고**: ✅❌💡⏳📁🔀 형식

---

## 참조 문서

- `monkos-ops/ops/reports/2026-06/REPORT_20260611_iMac쌍아_블로그컨텐츠루프_전수조사.md` (본 지시서의 기원)
- `monkos-ops/ops/reports/2026-04/REPORT_20260427_막내3_블로그CMS파이프라인_전수진단.md` (4/27 선행 진단)
- `monkos-ops/ops/portfolios/PF_OPUS/README.md`
- `monkos-ops/ops/portfolios/PF_SPREAD/README.md`
- `monkos-ops/ops/portfolios/PF_CITADEL/README.md`
