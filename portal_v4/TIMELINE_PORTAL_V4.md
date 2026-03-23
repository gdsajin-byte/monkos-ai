# 포털 v4 — 시계열 종합 (2026-03-13 ~ 03-15)

> 최종 갱신: 2026-03-15 iMac/쌍아
> 출처: 세션 로그 5건 + CONTEXT_PORTAL_V4.md + 지시서/보고서

---

## 2026-03-13 (M1) — v4 구현 + 배포 + 롤백

### 오후 — 리서치 4건 병렬

| 막내 | 과제 | 산출물 |
|------|------|--------|
| 막내1 | 프레임워크 설계분석 | REPORT_포털v4_프레임워크설계분석 |
| 막내2 | 충돌지점 전수조사 | REPORT_포털v4_충돌지점전수조사 |
| 막내3 | Auth/결제 안정성 | REPORT_서브도메인데이터_Auth결제안정성 |
| 막내4 | 배포라인+롤백전략 | REPORT_배포라인설계+롤백전략 |

### 21:22 — Wave 0: 기반 작업

| 작업 | 커밋 | 내용 |
|------|------|------|
| render.js fragment 분리 | `8f9ea8f` | SSR 렌더러를 fragment 단위로 분리 |
| deploy.sh 블루/그린 준비 | `d0f4a00` | 블루/그린 배포 스크립트 구축 |

### 22:44 — Wave 1: v4 전면 교체

| 작업 | 커밋 | 내용 |
|------|------|------|
| index.html v4 전면 교체 | `2cf33fd` | 3컬럼 라이트 테마 + CSS/JS 7파일 분리 (265줄) |

### 23:18 — 실서비스 전환 → 롤백

- **23:18** v4 100% 트래픽 전환
- **23:19** 작가님 확인: **"컨텐츠 카드 얼어있음"** — 클릭 불가
- **23:22** v3 복귀 완료. v4는 `v4-preview` 태그로 유지 (0% 트래픽)

---

## 2026-03-13 (iMac) — CMS + SEO 인프라

| 작업 | 커밋 | 내용 |
|------|------|------|
| CMS 플랫폼 구축 | `742490d` | 블로그/FAQ/갤러리/게시판 + 자동번역 + SEO |
| 다국어 URL 리팩토링 | `bf387ed` | /ja/blog/slug 패턴 + 포털 네비게이션 |
| Admin 라이트 테마 | `421a4c4` | 관리 패널 6파일 라이트 전환 |

---

## 2026-03-14 (M1) — 기술명세 + 코웍이 협업

### 06:58~09:23 — v4 종합 기술명세 작성

- 3/13 전 작업을 단일 문서로 통합 (시계열+리서치+코드+이슈+배포)
- 📁 `PORTAL_V4_TECHNICAL_SPEC.md`

### v4 Preview 도메인 인증 문제 분석

- preview URL(`v4-preview---...a.run.app`)에서 OAuth 에러 발견
- 원인: `.monkos.ai` ↔ `.a.run.app` 도메인 불일치 (쿠키/콜백 3곳 미등록)
- 임시 해결: 브라우저 콘솔 `currentUser` 주입
- 장기 대안: `preview.monkos.ai` 커스텀 도메인 매핑

### 코웍이 v4 Preview UI 점검 — 이슈 6건 신규 발견

| # | 이슈 | 심각도 |
|---|------|--------|
| 1 | `/pricing` 404 — JS 로드 전/직접 접근 시 서버 라우트 없음 | HIGH |
| 2 | `/guide` 404 — 라우트 자체 미존재 | HIGH |
| 3 | `/blog` 데이터 끊김 — Firestore에 데이터 없음 | HIGH |
| 4 | 히어로 CTA 부재 — 촬영실 앱에는 있고 포털에는 없음 | MED |
| 5 | Before/After 갤러리 플레이스홀더 — 실 사진 미적용 | MED |
| 6 | 블로그 카드 썸네일 크기 부족 | LOW |

### 콘텐츠 통합 에디터 설계 논의

- 작가님 비전: Apple Pages + Canva 수준
- 엔진: ProseMirror(코웍이) vs Editor.js(쌍아) → **작가님 결정 대기**
- 독립 도메인: `editor.monkos.ai`
- Phase: 블로그 에디터 코어 → IMAGE PRO 연동 → 스튜디오 탭 → 연결

---

## 2026-03-14 (iMac) — SEO + gtag + 헌법 개편

### 17:05 — 긴급: Google Ads 전환 태그

- 철창이 분석: G-FKG0CPTC14 미설치 → 스마트 비딩 학습 중단
- `def0074`: 31파일에 gtag 삽입 (idphoto-jp 13 + idphoto-kr 12 + portal 6)
- `e6c66e3`: portal obfuscator에 gtag/dataLayer 스킵 조건 추가
- 3서비스 배포 완료 (portal + idphoto-kr + idphoto-jp)

### 19:13 — 포털 일본어 문제 발견

- monkos.ai가 `lang="ja"`, title/OG 전부 일본어
- hreflang 양방향 + 포털 한국어 기본 전환 지시서 발행

### 19:25 — hreflang + 한국어 기본 전환

- `a4f6fa8`: 포털 한국어 기본 전환 + 3서비스 hreflang 양방향
- `0dfdff1`: 3서비스 배포 성공 보고

---

## 2026-03-15 (M1) — 홈 SSR + 콘텐츠 이관 + 증명앱 SEO

### 05:30 — 일본어 잔재 수정 + 배포

- index.html 챗봇 placeholder/hint 일본어→한국어
- 포털 프로덕션 배포 완료
- ⚠️ deploy.sh `--to-latest` 플래그 gcloud 550.0.0 호환 문제 발견

### 05:45 — 코웍이 오더 수신 (2건)

1. 블로그 디자인 교체 + 카드 버그 수정
2. 콘텐츠 이관 크롤링 파이프라인

### 05:55 — 작가님 지시: 홈 SSR 전환

- 하드코딩 콘텐츠 → 어드민 편집 가능 구조
- 카드 클릭 버그 + CMS 동적화 일석이조 설계

### 06:01 — 지시서 2건 작성

| 지시서 | 대상 | 내용 |
|--------|------|------|
| ORDER_홈SSR전환+블로그테마 | 막내1 | home.js 신규, SSR 라우트, site_config, 라이트테마 |
| ORDER_콘텐츠이관_크롤링 | 막내2 | note.com + 네이버 크롤러 (선행: 막내1 Step 1) |

### 06:14~06:26 — 막내1 완료: 홈 SSR + 블로그 라이트

- home.js 신규 (홈 SSR 엔진 + Settings API)
- render.js 라이트 CSS 변수 교체
- blog.js pinned/category 필드 추가
- admin/settings.html 신규
- 배포 검증 정상

### 06:28~06:35 — 증명앱 SEO 조사 + 지시서

- hreflang 버그 발견: JP에서 `hreflang="ko"` → monkos.ai (오류)
- 코웍이 SEO 오더 보정: 가격(Offer) 제거, Service+FAQPage+LocalBusiness+Twitter Card
- 막내3에 지시서 하달

### 06:38~06:47 — 막내2: note.com 크롤러 구현 + 이관

- 3파일 생성: importer/index.js, note.js, naver.js
- note.com 이관 실행: **9건 성공** / 0건 에러 / 전량 JA 감지

### 06:48 — 쌍아 직접: 어드민 진입 UI

- lib/auth.js: ADMIN_UIDS + isAdmin 필드 추가
- index.html: 팝오버에 Admin 링크
- public/js/auth.js: isAdmin 시 링크 표시

### 07:23 — 코웍이 추가 진단

- mag-card thumbnail 무시 문제 정확 진단
- 홈 SSR에 lang 필터 없음 → JA 크롤링 데이터가 KO 홈에 노출
- translate.js: JA→KO/EN 미지원 확인
- 통합 지시서 작성 → 막내1 하달

### 07:34 — 막내1 통합 배포 완료

- `06b674a`: 홈SSR + 블로그라이트테마 + 크롤러번역 + 어드민링크
- ⚠️ 사고: deploy.sh .env 경로 오류 → 환경변수 빈 값 → 2분 다운타임 → 즉시 복구
- 검증: mag-card 썸네일, 블로그 4개 SSR, KO 필터, adminLink, /blog 라이트 — 전 항목 정상

### 07:34 — 막내3 증명앱 SEO 완료

- `253c322`: hreflang 수정 + JSON-LD + Twitter Card
- KR·JP 배포 대기

### 07:38~07:44 — 막내2: 네이버 이관

- RSS 수신 50건 → 카테고리 필터 → **13건 이관 성공** / 37건 skip
- ⚠️ JA 번역 실패 (translate.js title undefined) — EN 번역 정상

### 07:48 — 증명앱 KR·JP 배포

- idphoto-kr 배포 (00175-cth)
- idphoto-jp 배포 (00101-7kh)
- hreflang 양방향 + JSON-LD + Twitter Card 검증 완료

### 07:50 — 3서비스 최종 배포 상태

| 서비스 | 리비전 | 상태 |
|--------|--------|------|
| monkos-portal | 00142 | ✅ 배포 완료 |
| monkos-idphoto-kr | 00175-cth | ✅ 배포 완료 |
| monkos-idphoto-jp | 00101-7kh | ✅ 배포 완료 |

---

## 최종 상태 (2026-03-15 기준)

### 실서비스 현황

| 항목 | 상태 |
|------|------|
| 포털 실서비스 | **v3 베이스 + SSR 홈 + CMS** (rev 00142) |
| v4 preview | 유지 (0% 트래픽, `v4-preview` 태그) |
| v4 전환 차단 | 컨텐츠 카드 인터랙션 미동작 (원인 미특정) |

### 완료된 작업

- [x] v4 구현 + 배포 + 롤백 + v3 복귀
- [x] CMS 플랫폼 (블로그/FAQ/갤러리/게시판 + 자동번역)
- [x] 다국어 URL 리팩토링 (/ja/blog/slug)
- [x] Admin 라이트 테마 전환
- [x] v4 종합 기술명세 작성
- [x] Google Ads gtag 삽입 (31파일) + obfuscator 수정
- [x] 포털 한국어 기본 전환 + 3서비스 hreflang 양방향
- [x] 홈 SSR 전환 (Firestore → 매거진/블로그/뉴스/태그/인트로)
- [x] 블로그 다크→라이트 테마 전환
- [x] 어드민 Settings 페이지 + blog-edit pinned/category
- [x] 어드민 진입 링크 (로그인 사용자용)
- [x] 콘텐츠 이관 크롤러 (note.com 9건 + 네이버 13건 = 22건)
- [x] 증명앱 SEO (hreflang + JSON-LD + Twitter Card) KR·JP 배포
- [x] mag-card 썸네일 렌더링 수정
- [x] 홈 SSR KO 언어 필터 추가
- [x] 크롤링 자동번역 연동 (JA→KO/EN)

### 미해결 이슈

| # | 이슈 | 우선순위 |
|---|------|----------|
| 1 | **v4 컨텐츠 카드 인터랙션 미동작** — 전환 차단 | CRITICAL |
| 2 | `/pricing` 404 — 서버 라우트 필요 | HIGH |
| 3 | `/guide` 404 — 라우트 미존재 | HIGH |
| 4 | 히어로 CTA 부재 | MED |
| 5 | Before/After 갤러리 플레이스홀더 | MED |
| 6 | 블로그 카드 썸네일 크기 부족 | LOW |
| 7 | v4 Preview OAuth 에러 (도메인 불일치) | LOW (preview 한정) |
| 8 | 서브페이지 다크↔라이트 테마 단절 | LOW |
| 9 | translate.js JA 번역 title undefined | MED |
| 10 | deploy.sh `--to-latest` gcloud 호환 + `.env` 경로 | MED |
| 11 | 포털 파비콘 Google 검색 결과 미노출 | LOW |

### 작가님 결정 대기

| 항목 | 내용 |
|------|------|
| 콘텐츠 통합 에디터 엔진 | ProseMirror(코웍이) vs Editor.js(쌍아) |
| v4 전환 vs 에디터 우선순위 | A. v4 수정→재전환 / B. 에디터 설계 선행 / 병렬 가능 |

---

## 관련 문서 인덱스

| 구분 | 파일 |
|------|------|
| 기술명세 | `ref/PORTAL_V4_TECHNICAL_SPEC.md` |
| 코웍이 UI점검 | `ref/REPORT_20260314_코웍이_v4preview_비로그인영역_UI점검.md` |
| 코웍이 에디터 설계 | `ref/REPORT_20260314_코웍이_콘텐츠통합에디터_설계배경_맥락전달서.md` |
| 블로그 에디터 목업 | `ref/DESIGN_blog_mockup.html` |
| SEO 규칙 | `ref/portal_seo.md` |
| 세션 로그 (5건) | `ref/sessions/` |
