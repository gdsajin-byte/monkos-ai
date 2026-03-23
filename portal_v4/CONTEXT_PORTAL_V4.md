# 포털 v4 — 종합 컨텍스트

> 최종 갱신: 2026-03-14 M1/쌍아
> 이 문서는 포털 v4 작업에 참여하는 모든 에이전트(코웍이/철창이/쌍아/막내)의 공유 맥락이다.

---

## 1. 현재 상태

| 항목 | 상태 |
|------|------|
| 실서비스 | **v3** (rev 00133-9f6, 100% 트래픽) |
| v4 preview | rev 00141-gik, 0% 트래픽, `v4-preview` 태그 |
| Preview URL | `https://v4-preview---monkos-portal-4jeplpqpua-uc.a.run.app` |
| v4 코드 | main 브랜치 커밋 `2cf33fd` |
| 롤백 사유 | 2026-03-13 23:19 작가님 확인 "컨텐츠 카드 얼어있음" → 즉시 롤백 |

---

## 2. v4 작업 타임라인

### 2026-03-13 (v4 구현+배포+롤백)

| 시각 | 작업 | 커밋 |
|------|------|------|
| 오후 | 리서치 4건 병렬 (프레임워크/충돌/Auth결제/배포전략) | — |
| 21:22 | Wave 0: render.js fragment 분리 | `8f9ea8f` |
| 21:22 | Wave 0: deploy.sh 블루/그린 준비 | `d0f4a00` |
| 22:44 | Wave 1: index.html v4 전면 교체 (3컬럼 라이트 테마 + CSS/JS 7파일 분리) | `2cf33fd` |
| 23:18 | v4 실서비스 전환 (100% 트래픽) | — |
| 23:19 | **작가님 확인: 컨텐츠 카드 인터랙션 미동작** → 롤백 | — |
| 23:22 | v3 복귀 완료 (v4는 preview 태그로 유지) | — |

### 2026-03-13 (iMac 세션 — CMS+SEO 인프라)

| 작업 | 커밋 |
|------|------|
| CMS 플랫폼 구축 — 블로그/FAQ/갤러리/게시판 + 자동번역 + SEO | `742490d` |
| 다국어 URL 리팩토링 (/ja/blog/slug) + 포털 네비게이션 | `bf387ed` |
| Admin 페이지 라이트 테마 전환 6파일 | `421a4c4` |

### 2026-03-14 (SEO + gtag)

| 작업 | 커밋 |
|------|------|
| Google Ads 전환 태그 삽입 (31파일) | `def0074` |
| portal obfuscator에서 gtag 제외 | `e6c66e3` |
| 포털 한국어 기본 전환 + 3서비스 hreflang 양방향 | `a4f6fa8` |
| 완료보고 + 3서비스 배포 성공 | `0dfdff1` |

### 2026-03-14 (오전 M1 — 기술명세+코웍이 협업)

| 작업 | 산출물 |
|------|--------|
| v4 종합 기술명세 작성 (시계열+리서치+코드+이슈+배포) | `PORTAL_V4_TECHNICAL_SPEC.md` |
| 코웍이 v4 Preview UI 전수 점검 | 이슈 6건 신규 발견 |
| 콘텐츠 통합 에디터 설계 논의 (ProseMirror vs Editor.js) | 작가님 결정 대기 |

---

## 3. 차단 이슈 + 미해결 이슈

### CRITICAL — v4 전환 차단

- **컨텐츠 카드 인터랙션 미동작**: v4 전환 후 카드 클릭 불가 확인. 원인 미특정.

### SEO/라우트 (코웍이 점검 기준)

1. `/pricing` 404 — nav에서 `openCreditShop()` JS 인터셉트인데 JS 로드 전/직접 접근 시 404
2. `/guide` 404 — 라우트 자체 미존재
3. `/blog` 데이터 끊김 — 홈에 정적 목업 4건, /blog는 Firestore에서 읽는데 데이터 없음
4. 포털 파비콘 — Google 검색 결과에서 미노출

### UX/콘텐츠

5. 히어로 CTA 부재 — 촬영실 앱에는 있고 포털에는 없음
6. Before/After 갤러리 플레이스홀더 — 실 사진 미적용
7. 블로그 카드 썸네일 크기 부족 — note.com 대비 시각적 임팩트 약함

### 인증/도메인

8. v4 Preview OAuth 에러 — `.monkos.ai` ↔ `.a.run.app` 도메인 불일치 (Google/Kakao/LINE 콜백 미등록)
9. 다크↔라이트 테마 단절 — 서브페이지(blog/faq/gallery/board)

---

## 4. 서비스 도메인 맵

| 서비스 | 도메인 | 인프라 | hreflang |
|--------|--------|--------|----------|
| 포털 | monkos.ai | Cloud Run (Express) | ko, x-default |
| 증명사진 KR | idphoto-kr.monkos.ai | Cloud Run | ko |
| 증명사진 JP | idphoto-jp.monkos.ai | Cloud Run | ja |
| monk.kr | monk.kr | CF Pages (정적) | — |

---

## 5. v4 파일 구조

```
monkos_AI/portal/
├── public/
│   ├── index.html              ← v4 진입점 (265줄, lang="ko")
│   ├── css/portal.css          ← v4 스타일 (625줄, 라이트 테마, :root 변수 체계)
│   ├── js/
│   │   ├── i18n.js             ← 다국어 + 리전 감지 (294줄)
│   │   ├── auth.js             ← Google GIS OAuth (235줄)
│   │   ├── credits.js          ← 크레딧/결제 (107줄)
│   │   ├── chat.js             ← 챗봇 (105줄)
│   │   └── main.js             ← 초기화 + 이벤트 (139줄)
│   ├── admin/                  ← CMS 관리 패널 (blog, board, faq, gallery)
│   ├── tg/                     ← 텔레그램 미니앱
│   └── backup/v3/index.html    ← v3 원본 백업 (2,510줄)
├── lib/
│   ├── cms/render.js           ← SSR 렌더러 (fragment 분리 완료)
│   ├── cms/{blog,board,faq,gallery,translate,upload,admin-auth}.js
│   ├── auth.js, credits.js, payments.js
│   ├── chat-engine.js, rag.js, prompts.js
│   ├── {kakao,line}-chatbot.js, telegram.js
│   └── shared/config.js
├── server.js                   ← Express 서버
└── deploy.sh                   ← 블루/그린 배포 스크립트
```

---

## 6. 콘텐츠 통합 에디터 구상

- 작가님 비전: Apple Pages + Canva 수준의 통합 에디터
- 독립 도메인: `editor.monkos.ai`
- 엔진 후보: ProseMirror(코웍이 권장) vs Editor.js(쌍아 권장) → **작가님 결정 대기**
- Phase: 블로그 에디터 코어 → IMAGE PRO 연동 → 스튜디오 탭 → 연결

---

## 7. 관련 문서 인덱스

### 기술명세

| 문서 | 경로 |
|------|------|
| v4 종합 기술명세 | `monkos-ops/tech/architecture/PORTAL_V4_TECHNICAL_SPEC.md` |

### 코웍이 산출물

| 문서 | 경로 |
|------|------|
| v4 Preview UI 점검 | `monkos-ops/ops/cowork/2026-03/REPORT_20260314_코웍이_v4preview_비로그인영역_UI점검.md` |
| 콘텐츠 통합 에디터 설계 배경 | `monkos-ops/ops/cowork/2026-03/REPORT_20260314_코웍이_콘텐츠통합에디터_설계배경_맥락전달서.md` |
| 블로그 에디터 UI 목업 | `monkos-ops/ops/cowork/2026-03/DESIGN_blog_mockup.html` |

### 지시서 (3/13~14)

| 문서 | 경로 |
|------|------|
| 프레임워크 설계분석 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내1_포털v4_프레임워크설계분석.md` |
| 충돌지점 전수조사 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내2_포털v4_충돌지점전수조사.md` |
| Auth/결제 안정성 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내3_포털v4_서브도메인데이터+Auth결제안정성.md` |
| 배포라인+롤백전략 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내4_포털v4_배포라인설계+롤백전략.md` |
| Wave 0: render.js | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내1_Wave0_renderjs_fragment분리.md` |
| Wave 0: deploy.sh | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내2_Wave0_deploysh_블루그린준비.md` |
| Wave 1: v4 교체 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내1_Wave1_indexhtml_v4전면교체.md` |
| Wave 1: preview 배포 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내2_Wave1_preview배포+검증.md` |
| CMS 인프라+블로그 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_iMac쌍아_막내_CMS인프라+블로그시스템.md` |
| FAQ/갤러리/게시판+SEO | `monkos-ops/ops/orders/2026-03/ORDER_20260313_iMac쌍아_막내_FAQ갤러리게시판+SEO.md` |
| 다국어URL+네비게이션 | `monkos-ops/ops/orders/2026-03/ORDER_20260313_iMac쌍아_막내_다국어URL리팩토링+네비게이션.md` |
| hreflang+한국어기본 | `monkos-ops/ops/orders/2026-03/ORDER_20260314_iMac쌍아_막내_포털SEO_hreflang_한국어기본.md` |

### 보고서 (3/13~14)

| 문서 | 경로 |
|------|------|
| 프레임워크 설계분석 | `monkos-ops/ops/reports/2026-03/REPORT_20260313_M1막내1_포털v4_프레임워크설계분석.md` |
| 충돌지점 전수조사 | `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내2_포털v4_충돌지점전수조사.md` |
| Auth/결제 안정성 | `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내3_포털v4_서브도메인데이터_Auth결제안정성.md` |
| 배포라인+롤백전략 | `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내4_포털v4_배포라인설계+롤백전략.md` |
| hreflang 완료보고 | `monkos-ops/ops/reports/COMPLETION_20260314_막내_194400.md` |

### 세션 로그

| 문서 | 경로 |
|------|------|
| 3/13 M1/쌍아 (v4 설계+Wave+롤백) | `monkos-ops/ops/sessions/2026-03/2026-03-13_M1_쌍아.md` |
| 3/13 M1/막내1 (Wave 실행) | `monkos-ops/ops/sessions/2026-03/2026-03-13_M1_막내1.md` |
| 3/13 M1/막내2 (충돌분석+배포) | `monkos-ops/ops/sessions/2026-03/2026-03-13_M1_막내2.md` |
| 3/14 M1/쌍아 (기술명세+코웍이) | `monkos-ops/ops/sessions/2026-03/2026-03-14_M1_쌍아.md` |
| 3/14 iMac/쌍아 (헌법+docs+SEO) | `monkos-ops/ops/sessions/2026-03/2026-03-14_iMac_쌍아.md` |
