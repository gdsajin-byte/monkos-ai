---
type: report
date: 2026-06-11
device: iMac
agent: 막내1
portfolio: PF_OPUS
status: 완료
---

# 블로그 파이프라인 코드 정밀 감사

**[2026-06-11 11:44 KST] iMac/막내1 → 작가님**

> 근거 지시서: `ORDER_20260611_iMac쌍아_막내_블로그파이프라인_코드정밀감사.md`

---

## 발견 사항 요약 (심각도 순)

| # | 심각도 | 항목 | 위치 | 요약 |
|---|--------|------|------|------|
| 1 | **Critical** | llms.txt 영속성 불가 | `seo.js:27-46` | Cloud Run 임시 파일시스템에 write — 배포/스케일다운 시 소멸 |
| 2 | **High** | maxOutputTokens 회귀 | `translate.js:116` | 32768→8192 역행 (2026-05-18 모델 마이그 시). EN 장문 번역 실패 |
| 3 | **High** | Naver Search API 프로덕션 미주입 | `deploy.sh` | 키 존재(GCP SM)하나 Cloud Run env에 미전달. 503 반환 |
| 4 | **Medium** | GitHub Issues 체인 단절 | `blog.js:219-224` | `.then()` 체인이라 번역 실패 시 GitHub도 스킵 |
| 5 | **Medium** | OG description 영문 고정 (목록 페이지) | `render-blog.js:51` | KO/JA 목록도 영문 OG desc 노출 |
| 6 | **Medium** | RSS/Atom 피드 부재 | — | 외부 구독·신디케이션 불가 |
| 7 | **Medium** | 블로그 내부 검색 부재 | — | 공개 페이지에 검색 기능 없음 |
| 8 | **Low** | Google Indexing API 제한 | `seo.js:12-25` | JobPosting/BroadcastEvent만 공식 지원. 블로그 무시될 가능성 |
| 9 | **Low** | Sitemap ping deprecated | `seo.js:48-50` | Google이 해당 엔드포인트 폐기 |
| 10 | **Low** | H1 "Blog" 다국어 미분기 | `render-blog.js:165` | 범용 표현이라 실해 낮음 |
| 11 | **Low** | 리다이렉트 맵 하드코딩 | `server.js:246-304` | 역사적 마이그용. 신규 슬러그는 영문 자동생성되어 추가 불필요 |
| 12 | **Info** | google-auth-library 간접 의존 | `package.json` | 직접 dep 아닌 transitive dep. 업데이트 시 깨질 수 있음 |
| 13 | **Info** | GitHub Issues 4월 이후 0건 | — | 카테고리 필터(AI만) + EN 번역 실패 복합 원인 |

---

## Task 1: 발행 후 자동화 체인 검증

### 트리거 메커니즘

| 엔트리 | 파일:라인 | 조건 |
|--------|----------|------|
| POST `/api/admin/blog` | `server.js:181` → `blog.js:209-224` | `published === true` |
| PUT `/api/admin/blog/:slug` | `server.js:183` → `blog.js:292-308` | `published === true` |

체인 실행 순서 (published=true 시):
```
pingSitemap() + requestIndexing(url) + appendToLlmsTxt(slug, title)
→ if lang==='ko': translateAndSaveBlogPost(slug).then(() => publishBlogToGitHub(slug))
```

---

### A-1: 자동번역 (`translateAndSaveBlogPost`)

| 항목 | 결과 |
|------|------|
| 호출 위치 | `blog.js:219` (create), `blog.js:303` (update), 수동: `POST /api/admin/blog/:slug/translate` |
| 호출 조건 | `published === true && lang === 'ko'` |
| maxOutputTokens | **8192** ← 회귀 (원래 32768, commit `79be913a` 2026-05-18에서 역행) |
| 에러 핸들링 | 3단계 JSON 복구 (직접 파싱→새니타이즈→정규식). 잘림엔 무력 |
| 실패 시 | 언어별 try/catch+continue, 상위 fire-and-forget(.catch 로깅) |
| 최근 실행 | 2026-06-08: JA 성공, EN 실패 (8192 잘림 확인) |

**판정**: 🔴 HIGH — 장문 EN 번역 구조적 실패. 32768 복원 또는 청킹 필요.

---

### A-2: GitHub Issues (`publishBlogToGitHub`)

| 항목 | 결과 |
|------|------|
| 호출 위치 | `blog.js:220,304` (번역 `.then()` 체인) |
| 호출 조건 | ① GITHUB_TOKEN 존재 ② category === 'ai' ③ EN 번역본 존재 |
| 토큰 | `GITHUB_TOKEN` env (Cloud Run에 설정됨 확인) |
| 타겟 리포 | `gdsajin-byte/monkos-ai` (`config.js:69`) |
| 최근 Issue | 마지막 #14 (2026-04-24). 이후 0건 |

**판정**: 🟡 MEDIUM — 기능 자체는 정상이나, 번역 실패 시 `.then()` 체인 연쇄 스킵. 카테고리 'ai' 제한도 작동 중.

---

### A-3: Google Indexing API (`requestIndexing`)

| 항목 | 결과 |
|------|------|
| 호출 위치 | `blog.js:213,297`, `translate.js:219` |
| 인증 | ADC (Cloud Run SA: `monk-image-engine@monkos.iam.gserviceaccount.com`) |
| 스코프 | `https://www.googleapis.com/auth/indexing` |
| 에러 핸들링 | try/catch + WARN 로그. 발행 차단 안함 |
| 문제점 | ① 공식 지원 스키마(JobPosting/BroadcastEvent)만 효과. ② SA의 GSC 소유자 등록 증빙 불확실 |

**판정**: 🟡 LOW — 호출은 되지만 Google이 무시할 가능성. 2026-06-07에 API enable + SA 등록 실행 이력 있음.

---

### A-4: llms.txt 갱신 (`appendToLlmsTxt`)

| 항목 | 결과 |
|------|------|
| 호출 위치 | `blog.js:214,298`, `translate.js:220` |
| 파일 경로 | `resolve(__dirname, '../../public/llms.txt')` |
| 갱신 로직 | `## Citation` 섹션 앞에 삽입, 중복 검사 |
| 현재 상태 | 블로그 개별 URL **0건** 포함. 최종 커밋 2026-03-26 |

**판정**: 🔴 CRITICAL — Cloud Run 임시 파일시스템에 `writeFileSync`하므로 배포·스케일다운 시 즉시 소멸. 구조적 설계 결함. GCS 또는 동적 생성으로 전환 필요.

---

### A-5: Sitemap ping (`pingSitemap`)

| 항목 | 결과 |
|------|------|
| 호출 위치 | `blog.js:212,296`, `translate.js:221` |
| URL | `https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml` |
| 방식 | fire-and-forget (`fetch().catch(() => {})`) |

**판정**: 🟡 LOW — Google이 해당 엔드포인트 폐기. 200 반환하나 효과 없음. Sitemap 자체는 동적 생성되어 정상 작동.

---

## Task 2: 데드 코드 / 미사용 코드

| # | 대상 | 상태 | 근거 | 비고 |
|---|------|------|------|------|
| B-1 | `lib/cms/importer/naver.js` | **DEAD** | server.js에 라우트 0건. CLI 전용(`index.js`). 외부 참조 0 | 삭제 안전 |
| B-2 | `lib/cms/importer/note.js` | **DEAD** | 위와 동일 | 삭제 안전 |
| B-3 | `scripts/blog-audit.js` | **DORMANT** | 자동 실행 스케줄 없음. 수동 진단 유틸 | 보존 (유용) |
| B-4 | `blog-seed.js` | **ACTIVE** | `blog-edit.html:219`에서 import. `episode_catalog.json` 존재 (32에피소드) | — |
| B-5 | `blog-research.js` | **ACTIVE** | `blog-edit.html:220`에서 import. Naver API 연동 (단, 프로덕션 키 미주입) | D-3 참조 |
| B-6 | `migrate_blog_thumbnail.js` / `migrate_blog_category.js` | **ONE-TIME 완료** | 헤더에 "1회성" 명시. 2026-03 실행 완료. 외부 참조 0 | 삭제 안전 |
| B-7 | 에디터 JS 모듈 | **전수 ACTIVE** | 7개 모듈 전부 `blog-edit.html`에서 import 확인 | 미사용 없음 |

**추가 발견**: `scripts/` 내 1회성 마이그레이션 7건 추가 존재 (retranslate_*, migrate_korean_slugs, cleanup_ghost_posts 등). 동일 패턴.

---

## Task 3: 파이프라인 병목 구간

| # | 항목 | 심각도 | 판정 | 상세 |
|---|------|--------|------|------|
| C-1 | 번역 잘림 | Medium | **Gap** | maxOutputTokens=8192, 청킹 없음. 장문 EN 실패 |
| C-2 | 시드 스크립트 번역 미연결 | Info | **비이슈** | 시드=레이아웃 설정용. 블로그 시드 스크립트 미존재. CMS 정규 흐름에서 번역 정상 연결 |
| C-3 | OG desc 영문 고정 | Medium | **Gap** | `render-blog.js:51` 목록 페이지 OG desc 하드코딩. listMeta에 번역값 있으나 미사용 |
| C-4 | H1 영문 고정 | Low | **사소** | `render-blog.js:165` "Blog" 범용. 필터 라벨 "언어"가 더 문제 (JA에서 한국어 노출) |
| C-5 | 리다이렉트 하드코딩 | Low | **의도적** | `server.js:246-304` ~45건. 한→영 슬러그 마이그용. 신규 글은 영문 자동 생성 |
| C-6 | RSS/Atom 피드 | Medium | **Gap** | 엔드포인트·생성 코드 전무. 외부 신디케이션 불가 |
| C-7 | 카테고리/태그 | Info | **정상** | 에디터 설정→Firestore 저장→목록 필터 탭 노출. 동작 확인 |
| C-8 | 블로그 검색 | Medium | **Gap** | 공개 페이지 검색 없음. admin만 네이버 외부 검색(리서치 탭) |

---

## Task 4: 외부 연동 상태

### D-1: Google Indexing API

| 항목 | 상태 |
|------|------|
| SA 키 | ADC 사용 (Cloud Run SA). Secret Manager에 별도 등록 없음 |
| API enable | ✅ (2026-06-07 활성화 이력) |
| 인증 라이브러리 | `google-auth-library` — transitive dep만 (직접 dep 아님) |
| GSC 소유자 등록 | 2026-06-07 세션에서 작가님 수동 등록 실행 |
| 판정 | **Partially Working** — 호출은 되나 블로그 URL 효과 불확실 |

### D-2: GitHub Issues

| 항목 | 상태 |
|------|------|
| 리포 | `gdsajin-byte/monkos-ai` (config.js:69) |
| 토큰 | `GITHUB_TOKEN` — Cloud Run env 설정 확인 |
| 최근 Issue | #14 (2026-04-24) 이후 0건 |
| 판정 | **Working** — 설정 정상, 4월 이후 미생성은 카테고리 필터+번역 실패 복합 |

### D-3: Naver Search API

| 항목 | 상태 |
|------|------|
| 키 존재 | `.env` + GCP Secret Manager 등록 확인 |
| Cloud Run 주입 | ❌ `deploy.sh`가 NAVER_CLIENT_ID/SECRET 미전달 |
| 프로덕션 동작 | **503** ("Naver API 키가 설정되지 않았습니다") |
| 판정 | **Broken** — 키 있으나 런타임 미도달. deploy.sh 수정 필요 |

### D-4: llms.txt

| 항목 | 상태 |
|------|------|
| 파일 존재 | ✅ 58행, 구조 양호 |
| 블로그 URL | ❌ 개별 포스트 0건 (서비스 소개만) |
| 최종 수정 | 2026-03-26 (커밋 `8361d66`) |
| 영속성 | ❌ Cloud Run 임시 FS에 write → 배포 시 소멸 |
| 판정 | **Broken** — 함수는 호출되지만 결과가 영속되지 않음 |

---

## 종합 권고

### 즉시 조치 (Critical/High)

1. **translate.js:116** — `maxOutputTokens: 8192` → `32768` 복원
2. **seo.js appendToLlmsTxt** — GCS 기반 또는 Firestore→동적 생성으로 재설계
3. **deploy.sh** — `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` env 주입 추가

### 개선 권고 (Medium)

4. `blog.js:219-224` — GitHub Issues 호출을 번역과 **독립 실행** (`.then()` 분리 → 별도 Promise)
5. `render-blog.js:51` — listMeta의 다국어 desc를 OG meta에 반영
6. RSS/Atom 피드 엔드포인트 신설
7. 공개 블로그 검색 기능 구현

### 정리 권고 (Low/Info)

8. `lib/cms/importer/` 디렉토리 삭제 (naver.js, note.js, index.js)
9. 완료된 1회성 마이그레이션 스크립트 9건 삭제
10. `google-auth-library`를 `package.json` 직접 의존에 추가
11. `pingSitemap` 제거 또는 Google Indexing API로 통합

---

## 참조

- `monkos_AI/portal/lib/cms/blog.js` — 발행 로직 본체
- `monkos_AI/portal/lib/cms/translate.js` — 번역 체인
- `monkos_AI/portal/lib/cms/seo.js` — SEO 자동화 3종
- `monkos_AI/portal/lib/cms/github-issues.js` — GitHub 연동
- `monkos_AI/portal/lib/cms/render-blog.js` — 프론트 렌더링
- `monkos_AI/portal/server.js` — 라우팅·리다이렉트
- `REPORT_20260608_민아_블로그EN번역누락_근본원인.md` — maxOutputTokens 회귀 선행 진단
