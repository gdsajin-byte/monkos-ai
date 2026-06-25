---
type: portfolio
id: PF_PORTAL
name: PORTAL
subject: monkos.ai 포털 메인 레이아웃 + CMS + 블록에디터 + 다국어
created: 2026-01-16
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
---

# PF_PORTAL — 포털 v4 + CMS + 블록에디터

> monkos.ai의 관문. 방문→전환 퍼널의 시작점이자, 블로그·FAQ·갤러리 등 콘텐츠 플랫폼.
> 포털 2트랙 → v4 3컬럼 전면교체 → 블로그에디터 v2 → 블록에디터 Phase 0.

---

## 1. 비전

**"monkos.ai에 방문한 사용자가 30초 안에 서비스를 이해하고 전환하는 관문"**

### 왜 이것을 하는가

- GA 메인페이지 이탈률 92% (3/25 민아 실측) — 방문자가 서비스를 이해하지 못하고 이탈
- 블로그·FAQ가 SEO 유입의 핵심 채널이나, 에디터 UX가 콘텐츠 생산 병목
- 다국어(KR/JP/EN) 대응이 수동 — i18n 체계 필요

### 성공 지표

| 지표 | 시작점 | 4주 목표 | 12주 목표 |
|------|--------|---------|----------|
| 메인 이탈률 | 92% (3/25) | 80% | 60% |
| camera 전환율 | 8% (151→12) | 15% | 25% |
| 블로그 포스트 발행 주기 | 비정기 | 주 3회 | 일 1회 |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.** 신규 항목은 하단에 추가.
> ⚠️ 소급 불적용(ch4 9조 5항): 아래는 PF 생성 시점(03-26)의 주요 마일스톤 요약.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 01/16 | 막내 | 포털 2트랙 시스템 시작 | `515712f` | ✅ |
| 01/18 | 막내 | AI LAB 대규모 개편 + MONKOS 브랜드 통일 | `37f5edf` | ✅ |
| 02/28 | 막내 | monk.kr 정적화 + monkos.ai 전환 | `6dcde0c` | ✅ |
| 03/13 | 막내 | 포털 v4 전면교체 (3컬럼, render.js fragment) | `2cf33fd` | ✅ |
| 03/13 | 막내 | CMS 플랫폼 구축 (블로그/FAQ/갤러리/게시판) | `742490d` | ✅ |
| 03/16 | 막내 | 블로그 에디터 WYSIWYG 리뉴얼 → 4차 | `689f0a2`~`92840e9` | ✅ |
| 03/20 | 막내 | 블로그 에디터 v2.0 ESM 모듈 분리 | `63b8f94` | ✅ |
| 03/22 | 막내 | 메인페이지 리디자인 (서비스카드 강화) | `82d1a99` | ✅ |
| 03/23 | 막내 | 블록 에디터 Phase 0 완공 (15블록) | `a6f63d5` | ✅ |
| 03/26 | 쌍아 | PF_PORTAL 스냅샷 생성 (소급 불적용) | 본 문서 | ✅ |
| 04/07 | 막내 | **토스 결제 NOT_FOUND_PAYMENT 장애 수정** + 재발 방지 3계층 방어 | `33eeb81` | ✅ |
| 04/08 | 쌍아→막내 | **챗봇 전면 감사** (4기 동시 투입) — 8항목 통과, 개선 10건 도출 | ORDER×4, REPORT | ✅ |
| 04/08 | 막내 | **챗봇 전면 개선 prod 배포** rev 00221 (prompts.js/rag.js/specs-data.json 대량 업데이트) | `4f71cbc` | ✅ |
| 04/08 | 민아 | Specs 26종 데이터 업데이트 배포 확인 | — | ✅ |
| 04/08 | 막내 | **deploy.sh 시크릿 근본 수정** (4개 서비스: portal/idphoto-kr/idphoto-jp/studio) + 팀봇 토스키 dev 오탐 방지 | `2453d3f` | ✅ |
| 04/08 | 쌍아 | **법률 ch5 배포 규칙 개정** + `.claude/rules/deployment.md` 신설 | `4f71cbc` | ✅ |
| 04/10 | 민아·쌍아 | 🚨 **INCIDENT**: 4f71cbc 잠복 폭탄 발현 — GCS_BUCKET 오기(`monkos-shared`)로 이미지 뱅크 ~10시간 무력화 + ADMIN_UIDS 빈값으로 admin 권한 무방비 노출 | rev 00223-llj(GCS), 00224-5m5(ADMIN), [INCIDENT REPORT](../reports/2026-04/REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md) | ✅ 1차 봉인 |
| 04/10 | 쌍아→막내1 | 통합 지시서: deploy.sh 4파일 잠복 폭탄 제거 + admin/js 401 위장 머지 (Layer 2) | [ORDER](../orders/2026-04/ORDER_20260410_iMac쌍아_막내_4f71cbc잠복폭탄제거+admin401위장머지.md) | ✅ |
| 04/11 | 막내1 | **INCIDENT Layer 2 봉인** — 4f71cbc 잠복 폭탄 제거 + admin/js 401 위장 패턴 통합 수정 | `500c2e1` | ✅ |
| 04/11 | 막내1 | portal/deploy.sh `.env` 의존 제거 — 비시크릿값 직접 하드코딩 (재발 방지) | `d86217a` | ✅ |
| 04/13 | 막내 | hreflang 조건부 생성 — 유령 URL 근절 + blogRedirects 3건 추가 | `d6d9fed` | ✅ |
| 04/21 | 쌍아 | **매출 0 전수분석** (내부 전환 + 외부 돌파구 + 결제퍼널 정합성 실측) | [REPORT 3건](../reports/) | ✅ |
| 04/21 | 막내1 | **CITADEL Phase 2.0/2.1** — 일본 L1 랜딩 5개 신설(`/guide/shukatsu`, `app-comparison`, `ai`, `/specs/passport`, `drivers-license`) + sitemap 1→10 확장 | rev 00108-ngl | ✅ |
| 04/22 | 막내1 | **GCP 인프라 감사** + PUBLIC 버킷 맥락 확인 + 포털 FAQ 구조화 데이터 수정 | `97b7f8c`, `28a665a` | ✅ |
| 04/23 | 민아 | **GA4·GSC MCP 정비완결** + Ads 병목 진단 | [REPORT](../reports/REPORT_20260423_민아_GA4_GSC_MCP_정비완결+Ads_병목진단.md) | ✅ |
| 04/24 | 쌍아 | **총체 진단** — GA 30일 실측 (portal 255 / idphoto-kr 1,587 / idphoto-jp 265 / **결제 0건**) + 5대 병목 도출 + 막내 4기 일괄 지시서 | `98f9ba2` | ✅ |
| 04/24 | 막내1 | **idphoto 퍼널 UX 진단 + 히어로 개편** (KR/JP 동시) — 결과물 3장 + 신뢰지표 + 3단계 + "왜 MONKOS인가" 신설 | [COMPLETION](../completions/COMPLETION_20260424_막내1_퍼널UX진단.md) | ✅ |
| 04/24 | 막내2 | **결제 플로우 기술 점검** + AI referral 추적 스크립트 4서비스 + AEO 트랙 3·4·5 정합성 검토 | [COMPLETION 3건](../completions/) | ✅ |
| 04/24 | 막내3 | **SEO 기술 인프라** 즉시 수정 (idphoto sitemap dead file 식별, server.js 동적 생성 정본 확인) | — | ✅ |
| 04/24 | 막내4 | **콘텐츠 파이프라인** 오가닉 기반 — 블로그 4편 추가 | — | ✅ |
| 04/24 | 막내1 | **AEO 1단계** — `/app` 404→리다이렉트 + `/crop` FAQ 스키마 + AI referral 추적 4서비스 + /specs 26국 Article+FAQPage+HowTo 스키마 완비 | `4da28dc`, [COMPLETION](../completions/COMPLETION_20260424_막내1_app404_crop_FAQ.md) | ✅ |
| 04/24 | 작가님 승인 | **prod 배포** — idphoto-kr/jp + portal + studio (`deploy.sh prod`) | `cedadb3`, `0559d8f` | ✅ |
| 04/25 | 민아 | **포털 4트랙 개편 기안서 발행** — 헤더(브랜드 보존+듀얼CTA) + nav 슬림화(specs 신설) + 본문 specs 5권역 카드 + 우측 사이드바 한송이 쇼츠 썸네일화 | [PROPOSAL](../proposals/PROPOSAL_20260425_민아_포털전체개편_기안서.md) | ⏳ 검토중 |
| 04/25 | 작가님 디렉션 | **방향 전환 — iCloud.com 스타일 메인 전면 카드 그리드** (12장 내외 타일). 트랙 1·3 통합 흡수. 철창이 JSX 시안 발주. | [BRIEFING](../proposals/BRIEFING_20260425_민아→철창이_포털메인_카드그리드_JSX의뢰.md) | ⏳ 시안 대기 |
| 06/06 | 막내1 | **어드민 대시보드 신설** — GA4 트래픽 + 가입자 + 크레딧 현황 실시간 확인. 백엔드 4 API + Chart.js 프론트 | `e8e1127a`, rev 00263 | ✅ |
| 06/06 | 쌍아 | 대시보드 핫픽스 — Firestore Timestamp 호환 + GA4 SA 권한 가이드 | rev 00264 | ✅ |
| 06/07 | 쌍아 | **blog.js tags 방어 코드** — 문자열 tags를 배열로 자동 변환 (CREATE/UPDATE). 에디터 loadPost 크래시 근본 수정 | blog.js | ✅ |
| 06/07 | 쌍아 | **Google Indexing API 연동** — 블로그 발행 시 즉시 색인 요청 (`requestIndexing()`). sitemap ping과 병행 | blog.js | ✅ |
| 06/07 | 쌍아 | **llms.txt 자동 갱신** — 블로그 발행 시 llms.txt에 신규 글 자동 어펜드 (`appendToLlmsTxt()`). AI 엔진 인용 소스 자동 확장 | blog.js | ✅ |
| 06/07 | 쌍아 | **IDPASS 소개 글 API 생성** — `POST /api/admin/blog` → slug `idpass-kr` 발행. 3개국어 자동 번역 트리거 | Firestore blog_posts | ✅ |
| 06/08 | 민아 | **블로그 이미지 파이프라인 전수조사 + 썸네일 노드 실증** — 에디터 이미지 파이프라인 Explore 조사: AI 생성 호출만 부재, Gemini클라(config.js:89)/GCS저장(upload.js:126)/에디터삽입(blog-image.js) 완비. 썸네일 자동생성 노드 설계(Nano Banana, `image-generate.js` 신설안). 레딧 에세이 draft 등록(`dead-folders-to-living-system-kr`) + Canva 썸네일 GCS 적용(thumbnail PUT, draft 유지) | [세션로그](../../sessions/2026-06-08_iMac_민아.md) | ✅ |
| 06/08 | 민아·쌍아 | **에디터 내장 에이전트 설계 합산** — 골조: ORSA(Observe-Reason-Suggest-Apply) 루프 + 서버 에이전트/thin client/비차단(민아). 인프라 보완(쌍아): **SSE(서버→클라)+POST(클라→서버)** = Cloud Run 정합(WebSocket 타임아웃 회피) / **증분 diff 관찰** + 서버 세션 문서상태(토큰 비용) / **Phase 1 우선**. 실행순서: Phase 1 버튼호출(PF_PORTAL 확장, 자동화율 0→30%, OPUS 플라이휠 첫 바퀴) → 실전 검증 → Phase 2~3 ORSA 상주는 독립 PF급 → PROPOSAL 기안. 썸네일은 sharp 자동 + Canva 프리미엄(민아 경유) 2트랙 | [세션로그](../../sessions/2026-06-08_iMac_민아.md) | ✅ |
| 06/10 | 쌍아 | **Phase 9 기획 — 마이페이지 + 인증 체계 정비**. Fable 5 보안 전수조사 → 막내1 교차 검증(18건)에서 도출: 크레딧 판매 중인데 마이페이지 부재, C-2(크레딧 무인증)·N-1(토큰 무인증 발급)·C-4(ADMIN 페일오픈)·H-5(GCS TTL 미구현+FAQ 허위 안내)가 모두 마이페이지·인증 체계 부재에서 기인. 보안 응급 패치(페일클로즈) 선행 → 마이페이지 구축 순서로 기획 | 본 PF 히스토리 | ⏳ 기획 |
| 06/10 | 막내4 | **Phase 9 T0 — 보안 페일클로즈 응급 패치 4건**. N-1(handleAuthToken 세션 쿠키 검증 추가), C-4(ADMIN_UIDS 페일오픈→페일클로즈 4개소), C-2(크레딧 API 3핸들러+idphoto-kr/jp 인증 미들웨어+쿠키 포워딩), C-3(AUTH_SECRET 하드코딩 폴백 제거→process.exit) | auth.js, credits.js, config.js, admin-auth.js, idphoto-kr/jp server.js | ✅ |
| 06/10 | 쌍아 | **portal prod 배포** rev 00278-h8k — 보안 페일클로즈 4건 적용. idphoto-kr/jp는 AUTH_SECRET 환경변수 추가 후 순차 배포 예정 | `deploy.sh prod` | ✅ |
| 06/11 | 막내1 | **CMS 정밀감사 + 즉시수정 6건 + 보안·색인 3건** — 감사 Critical 1/High 2/Medium 4 식별 → maxOutputTokens 복원·llms.txt 동적화·Naver API 주입·deploy.sh --set-secrets 전환·/admin HTML 인증 가드·pingSitemap 폐기·Indexing 관측성 강화. rev 00279→00281→00284 | REPORT+COMPLETION 4건 | ✅ |
| 06/12 | 민아 | **디자인 프레임워크+워크플로우 설계서 발행** (Phase 7 재개 기반) — v5 6주 정체 원인(일회성 시안→수동컨버트→종료) 진단 → 프레임워크 3층(토큰 정비/컴포넌트·타일/서비스 레지스트리) + 6단계 파이프라인(시안→검토→컨버트→preview→검증→전환, 게이트·담당 고정) 설계. 작가님 결정: **포털 파일럿→점진확장 / 코드우선(CSS토큰+순수JS)**. v5 결정 5건 답안 선반영(render확장·아이콘축소·히어로토글·예비숨김·Wave분리) | [DESIGN](monkos-ops/tech/designs/2026-06/DESIGN_20260612_디자인프레임워크_워크플로우.md) | ⏳ 작가님 확인 |
| 06/22 | iMac/쌍아+막내2 | **layoutNav·Footer 언어 인자화 P0** — 내부 페이지 네비 한국어 튕김 해소. 포털 00318 배포 | render-shell.js 외 5파일 | ✅ |
| 06/22 | iMac/쌍아+막내1 | **서버단 언어 감지 + 쿠키 통합 P1-a** — Accept-Language SSR 통합, 3개 메커니즘→1개 수렴(detectLang+monkos_lang쿠키), i18n.js 자체감지 제거. 포털 00322 배포 | server.js, i18n.js, render-shell.js, render-headshot.js | ✅ |
| 06/22 | iMac/쌍아+막내1 | **홈 텍스트팩 분리 P1-b** — ko/en/ja 50+키 I18N, relTime 다국어화. 포털 00323 배포. ⚠️ replace 방식 한계로 FAQ·블로그 한글 잔존 — home.js 렌더 구조 정리 필요 | home.js | ⏳ 잔존 보정 |
| 06/22 | iMac/쌍아+막내2 | **geoip-lite 결제 국가 판별 P1-c** — IP 기반 detectPaymentRegion, __REGION__ 전환. 2축 분리(언어=Accept-Language/결제=IP) 완성. 포털 00324 배포 | server.js 외 10파일 | ✅ |
| 06/22 | iMac/쌍아 | **언어·결제·GCS 통합 설계서** + **유저트래킹 제안서** → 민아 설계 위임 | 설계서+제안서 | ✅ |
| 06/22 | iMac/민아 | **유저트래킹 BQ 설계서** — BQ 단일 스트림, D1~D7 구현 단계, 쌍아 검수 통과, BQ=monkos 확정 | 설계서 | ✅ |
| 06/22 | iMac/막내1 | **BQ D1+D2** — 데이터셋·테이블·SA 권한 + /api/track + monkos_sid 세션쿠키 + track.js 비콘 헬퍼. 배포 진행 중 | tracking.js(신규), track.js(신규), server.js | ⏳ |
| 06/22 | iMac/막내2+3 | **BQ D3+D4** — 서버이벤트6종 적재 + 헤드샷 퍼널 클라 계측 + rate-limit 가드. 포털 00326~00328 배포 | server.js, payments.js, credits.js, headshot.js, auth.js | ✅ |
| 06/22 | iMac/막내1+쌍아 | **포털 홈 리스킨** — 아크릴 벤토 디자인 전면 적용. home.js 전면 재작성(replace 체인 제거), home.css 신설, 에셋 12개. 후속 핫픽스 7건(푸터 사업자정보·버튼색·로그인UI·네비·앱스토어링크·프로필사진). 포털 00329~00336 배포 | home.js, home.css, auth.js, assets/ | ✅ |
| 06/22 | iMac/민아 | **D1~D4 구현 검증** — 보안핵심3개(클라-BQ격리·PII미적재·시크릿무하드코딩) 합격, identity_map D7→D3 선구현. 🔴`/api/track` rate-limit+페이로드캡 부재(헌법4조4항) 적발 → D7 앞당김 권고 | 검증보고 | ⚠️ |
| 06/24 | iMac/쌍아 | **블로그 테이블 렌더링 수정 + S4 보안 잔존 수정** — ① 발행 후 표 깨짐 근인: `.post-content table`에 `display:block`+셀스타일 전무 → `border-collapse`+`th/td` 패딩·보더·헤더배경 추가, `table-wrap` 래퍼(모바일 스크롤). 에디터↔발행 렌더링 간극 해소. 기존 글 전체 일괄 적용(SSR 실시간 렌더링 구조). ② S4 V2 portal 에러 제네릭화 9개소 + V3 env 필수화 + V4 `/api/stats` admin 인증 게이트 | render-blog.js, render-shell.js, payments.js, credits.js, tg-cs.js, config.js, server.js | ✅ rev00345 |
| 06/24 | iMac/쌍아+막내2+3 | **블로그 CMS 집중 개선 9건** — ③ 비발행 미리보기(`?preview=true`+admin인증) ④ 구조화데이터(Article→BlogPosting, FAQ자동감지, wordCount) ⑤ 푸터 영어통일+footerLegal삭제 ⑥ 홈 블로그카드 autoTranslated필터제거+OG비율정규화 ⑦ gallery/board/guide 다국어라우트 8경로추가 ⑧ CTA카드시스템(에디터연동+전역기본값+SSR렌더링) ⑨ 홈 블로그카드 slug 이중접미사수정 ⑩ SEO내부경합종합감사 보고서 | portal 전역 | ✅ rev00346→00353 |
| 06/25 | iMac/막내1 | **Specs v2 kr-passport UI 정비 5건** — ① 태그 H1 아래 이동 ② 그룹A 배지 삭제 ③ 상세규정/반려사유 아코디언 전환 ④ 같은사진 사이즈 필터 추가 ⑤ 하단CTA→크로스셀카드 교체 | render-specs.js | ✅ rev00377 |
| 06/25 | iMac/막내1 | **Specs v2 P1 — 크롭앱 인라인 임베드** — FaceMesh 기반 얼굴감지+규격맞춤 크롭을 V2에 직접 임베드. 업로드→크롭조정→AI검수→결제 동선 전환. 크롭 다운로드 무료 | render-specs.js (+658줄) | ✅ rev00366 |
| 06/25 | iMac/막내1 | **Specs v2 P1.5 — Gemini 좌표 보정** — FaceMesh 감지 후 ICAO 범위 밖이면 Gemini Flash로 정수리·턱·눈 좌표 보정. `/api/idphoto/align` 신설. confidence<0.5 무시 | server.js + render-specs.js | ✅ rev00368 |
| 06/25 | iMac/막내1 | **Specs v2 P2 — 크롭 제거 + 검수 강화** — P1/P1.5 크롭 전량 제거(-762줄). 동선 단순화(업로드→AI검수→결제). precheck ITEM 8 사진적합성 추가 + warnMsg UI. align API 삭제 | server.js + render-specs.js | ✅ rev00370 |

---

## 3. Phase 현황

> Phase별 상태를 갱신한다. 에이전트 투입 시 이 섹션이 "지금 뭘 해야 하는지"의 정본.

### Phase 0~2 — MVP → v4 → CMS ✅ 완료

포털 2트랙(01/16) → 브랜드 통일(01/18) → monk.kr 정적화(02/28) → v4 전면교체(03/13) → CMS 구축(03/13).

### Phase 3 — 블로그 에디터 v2 ✅ 완료 (03-20)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| WYSIWYG 리뉴얼 (1~4차) | ✅ | 막내 | `689f0a2`~`92840e9` |
| WebP 변환 + 이미지 뱅크 | ✅ | 막내 | 에디터 4차 |
| ESM 모듈 분리 (1,495줄→9파일) | ✅ | 막내 | `63b8f94` |
| 이미지 삽입 버그 해소 | ✅ | 막내 | getter 전환 `2d16540` |

### Phase 4 — 블록 에디터 ✅ Phase 0 완공 (03-23)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 15블록 데이터 레이어 + 시딩 | ✅ | 막내 | `a6f63d5` |
| SSR 렌더링 | ✅ | 막내 | Phase 0 포함 |
| 어드민 편집 UI | ✅ | 막내 | Phase 0 포함 |
| i18n 정리 + 통합검증 | ✅ | 막내 | Phase 0 포함 |
| Phase 1 — 콘텐츠 CMS 고도화 | ⏳ | 미정 | 미착수 |

### Phase 4.5 — 챗봇 전면 개선 + 운영 안정화 ✅ 완료 (04/08)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 챗봇 전면 감사 (4기 동시) | ✅ | 막내 4기 | 8항목 통과, 개선 10건 도출 |
| 챗봇 전면 개선 + prod 배포 rev 00221 | ✅ | 막내 | prompts.js/rag.js/specs-data.json |
| Specs 26종 데이터 업데이트 | ✅ | 막내+민아 확인 | specs-data.json |
| 토스 결제 NOT_FOUND_PAYMENT 수정 + 3계층 방어 | ✅ | 막내 | `33eeb81` |
| deploy.sh 시크릿 근본 수정 (4서비스) | ✅ | 막내 | `2453d3f` |
| 팀봇 dev 오탐 방지 | ✅ | 막내 | `2453d3f` |

### Phase 5 — i18n 전면 보강 ⏳ 진행 중

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 홈 SSR 언어 분기 | ✅ | 막내 | `0e25b78` |
| FAQ KR/EN/JA 시딩 | ✅ | 막내 | `713c415` |
| pricing SSR 다국어 | ✅ | 막내 | `07500af` |
| 포털 홈 i18n 전면 보강 | ✅ | 막내 | `0e67f4d` |
| 잔여 미번역 영역 보정 | ⏳ | 막내 | 지속 |

### Phase 6 — SEO/AEO 인프라 완비 ✅ 완료 (04/24)

> 매출 0건 전수분석(4/21)을 기점으로 SEO 사각지대 일제 보강. 검색 의도 강한 콘텐츠를 사이트맵·스키마·다국어 라우팅에 모두 등재.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| hreflang 조건부 생성 + 유령 URL 근절 | ✅ | 막내 | `d6d9fed` (4/13) |
| 매출 0 전수분석 (내부 전환 + 외부 돌파구 + 결제퍼널) | ✅ | 쌍아 | REPORT 3건 (4/21) |
| CITADEL Phase 2.0/2.1 — 일본 L1 랜딩 5개 + sitemap 1→10 | ✅ | 막내1 | rev 00108-ngl (4/21) |
| 포털 FAQ 구조화 데이터 수정 + GCP 인프라 감사 | ✅ | 막내1 | `97b7f8c`, `28a665a` (4/22) |
| GA4/GSC MCP 정비완결 + Ads 병목 진단 | ✅ | 민아 | REPORT (4/23) |
| GA 30일 실측 + 5대 병목 도출 | ✅ | 쌍아 | `98f9ba2` (4/24) |
| AEO 1단계 — /specs 26국 Article+FAQPage+HowTo 스키마 + /crop FAQ + /app 404→리다이렉트 + AI referral 추적 4서비스 | ✅ | 막내1 | `4da28dc` (4/24) |
| 결제 플로우 기술 점검 + 정상 작동 확인 (Firestore 38건 실측) | ✅ | 막내2 | COMPLETION (4/24) |

### Phase 7 — 포털 IA 전체 개편 ⏳ 검토중 (04/25 시작)

> Phase 6에서 **자산은 완비됐으나 노출 부재**가 핵심 문제로 식별 (작가님 4/25 직접 지적: specs 26국이 nav 진입로 0). 포털 IA(헤더·nav·본문·우측 사이드바) 4축 동시 개편으로 자산 가시화 + 전환 강화.

> **4/25 15:53 작가님 디렉션 — 방향 전환**: 트랙 1·3을 분리하지 않고 **iCloud.com 스타일 메인 전면 카드 그리드**로 통합. 12장 내외 카드(서비스 2 + 규격 5 + 가격·FAQ + 블로그 + 쇼츠 2)로 메인 재구성. 철창이 JSX 시안 발주.

| 트랙 | 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|------|
| **T1+T3 통합** | **iCloud 스타일 메인 카드 그리드** (12장 / 4×3) — 헤더 슬림화 + 메인 전면 카드화 (서비스·규격·콘텐츠·가이드 진입로 통합) | ⏳ JSX 시안 대기 | 철창이 1차 → 민아·작가님 검토 → 막내 컨버트 | [BRIEFING](../proposals/BRIEFING_20260425_민아→철창이_포털메인_카드그리드_JSX의뢰.md) |
| T2 | 네비게이션 슬림화 — 6개 → 5개 + **/specs 신설** (갤러리·게시판 푸터 강등) | ⏳ 검토중 | 막내 실행 | B안 |
| T4 | 우측 사이드바 — 한송이 쇼츠 썸네일 카드 (카드 그리드에 카드 #11·#12로 통합) | ⏳ 영상 URL 대기 | 작가님 영상 URL 수령 후 | 카드 #11 증명사진 사용법 / #12 크롭앱 사용법 |
| — | 철창이 JSX 1차 시안 수령 | ⏳ 대기 | 철창이 | 작가님이 채팅 toss |
| — | 작가님 + 민아 시안 검토 (필요시 2~3회 반복) | ⏳ 대기 | 작가님·민아 | — |
| — | 쌍아 영향평가 + 헌법·법률 충돌 점검 | ⏳ 대기 | 쌍아 | 통상 검토 |
| — | 막내 컨버트 — JSX 시안 → `index.html` + `portal.css` | ⏳ 대기 | 쌍아→막내 | `monkos_AI/portal/deploy.sh prod` |
| — | 라이브 검증 + GA 이벤트 추적 (카드별 클릭) | ⏳ 대기 | 민아 | 배포 후 |

### Phase 9 — 마이페이지 + 인증 체계 정비 ⏳ 기획 (06/10 기획)

> **근본 문제**: 크레딧을 판매하는데 마이페이지가 없다. 사용자가 잔액·이력·사진을 관리할 수 없고, 인증 체계 미완성이 보안 취약점(C-2/N-1/C-4)의 근본 원인.

**왜 이것을 하는가**
- 보안: C-2(크레딧 무인증), N-1(토큰 무인증 발급), C-4(ADMIN 페일오픈) — 마이페이지 인증 세션이 있으면 구조적으로 해소
- 법적: H-5 GCS 사진 "30일 삭제" FAQ 안내 vs 실제 영구 보관 불일치 — 사용자 사진 관리 UI 필요
- 전환: 결제 사용자가 자기 크레딧·사진을 볼 수 없으면 재구매 동기 없음

**스코프**

| 트랙 | 항목 | 선행 조건 |
|------|------|----------|
| **T0 (응급)** | 보안 페일클로즈 — C-2/N-1/C-4 인증 미들웨어 추가, C-3 폴백 제거 | 없음 (즉시) |
| **T1** | 마이페이지 UI — 프로필·크레딧 잔액·사용 이력 조회 | T0 완료 |
| **T2** | 사진 관리 — 생성 사진 목록·다운로드·삭제 요청 | T1 + GCS 라이프사이클 |
| **T3** | GCS TTL — 30일 라이프사이클 규칙 설정, FAQ 안내와 일치 | GCP 콘솔 (작가님) |

**기술 판단**: 현행 스택(순수 JS + Node.js + Firestore + OAuth)으로 구현 가능. 새 프레임워크 불요.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Phase 9 기획 확정 | ⏳ | 쌍아 | 본 기획안 |
| T0 보안 페일클로즈 지시서 | ⏳ | 쌍아→막내 | 보안 전수조사 기반 |
| T1 마이페이지 설계서 | ⏳ | 쌍아 | T0 완료 후 |
| T2 사진 관리 설계서 | ⏳ | 쌍아 | T1 완료 후 |
| T3 GCS 라이프사이클 | ⏳ | 작가님 | GCP 콘솔 |

### Phase 8 — 어드민 대시보드 ✅ 완료 (06/06)

> 운영 현황(트래픽·가입자·크레딧)을 어드민에서 실시간 확인할 수 있는 대시보드 신설.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 백엔드 4 API (summary/users/credits/traffic) | ✅ | 막내1 | `dashboard.js` 226줄 |
| GA4 Data API 연동 (`@google-analytics/data`) | ✅ | 막내1 | ADC 인증, property 521406894 |
| 프론트엔드 대시보드 (Chart.js CDN) | ✅ | 막내1 | `dashboard.html` 252줄 |
| server.js 라우트 4건 + index.html Dashboard 카드 | ✅ | 막내1 | rev 00263 |
| Firestore Timestamp 호환 핫픽스 | ✅ | 쌍아 | rev 00264 (createdAt Timestamp/string 양립) |
| GA4 서비스 계정 권한 추가 | ✅ | 작가님 | monk-image-engine SA → GA4 뷰어 |
| prod 배포 + 라이브 확인 | ✅ | 쌍아 | `monkos.ai/admin/dashboard.html` |

---

## 4. 성과

> 실측 데이터. 측정일 명시. 추정 금지.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| 메인 이탈률 | 92% | 03-25 | GA (민아 실측) |
| 방문→camera 전환 | 151명 → 12명 (8%) | 03-25 | GA |
| 블로그 에디터 모듈 수 | 9파일 (ESM) | 03-20 | v2.0 |
| 블록 에디터 블록 수 | 15종 | 03-23 | Phase 0 |
| 다국어 지원 | KR/JP/EN | 03-23 | i18n SSR |
| **GA 30일 실측** — 총 유저 | 2,107명 | 04-24 | 3/24~4/24 (idphoto-kr 1,587 / idphoto-jp 265 / **portal 255**) |
| 유입 비중 | Paid 81% / Organic 2% (41명) | 04-24 | 오가닉 채널 부재 — Phase 6 동기 |
| idphoto-kr 퍼널 | 랜딩 1,997 → prep 130(6.5%) → camera 69 → result 37 → charge 18 → thankyou 5 → **결제 0** | 04-24 | 5대 병목 도출 |
| Firestore 결제 실데이터 | 38건 (작가님 테스트 29 + 외부 9) | 04-24 | 시스템 정상 / 외부 결제 사실상 0 |
| sitemap URL | 1 → **10** | 04-21 | CITADEL Phase 2.0/2.1 |
| /specs 스키마 | **26국 Article+FAQPage+HowTo 완비** | 04-24 | AEO 1단계 |
| 블로그 발행수 | 208건 (KR/JP/EN 3언어) | 04-24 | Firestore 실측 |
| **Firestore 인증 가입자** | **135명** (카카오/구글/라인) | 06-06 | 월별: 2월 19 / 3월 16 / 4월 44 / 5월 47 / 6월 9 |
| GA4 신규 유저 (5월) | 1,932명 | 06-06 | 실 인증 전환율 ~2.4% (47/1,932) |
| GA4 신규 유저 (6월 1~5일) | 223명 (일평균 45) | 06-06 | 5월 하순 수준 유지 |
| **어드민 대시보드** | `/admin/dashboard.html` 라이브 | 06-06 | GA4+가입자+크레딧 실시간 |

---

## 5. 복기

> 교훈·실패·성공 패턴. 미래 에이전트가 같은 실수를 반복하지 않도록.

### 교훈 1: 이미지 삽입 렉 + ESM 바인딩

**현상**: 에디터에서 이미지 삽입 시 극심한 렉 + 삽입 불가
**원인**: change 이벤트 콜백 안에서 DOM 수정 → 무한 루프. ESM `export let` → 모듈 간 참조 이중화
**대응**: change 콜백 DOM 수정 제거 + CSS cursor로 대체. `export let` → `getEditor()` getter 전환

### 교훈 2: 이미지 뱅크 겹침

**현상**: 이미지 뱅크 UI가 에디터 본문과 겹침
**원인**: 이중 스크롤 컨테이너 (뱅크 + 전체 페이지)
**대응**: 스크롤 컨테이너 단일화 + z-index 정리

### 교훈 3: deploy.sh `.env` 의존 잠복 폭탄 (4/10 INCIDENT)

**현상**: 4f71cbc(4/8) 시점 deploy.sh 시크릿 근본 수정 이후 **GCS_BUCKET 오기 + ADMIN_UIDS 빈값**으로 이미지 뱅크 ~10시간 무력화 + admin 권한 무방비 노출
**원인**: deploy.sh가 `.env`에 의존하는데 비시크릿 운영값(GCS_BUCKET, ADMIN_UIDS)도 `.env` 경유 → `.env` 누락/오타 시 빈값 주입. 시크릿과 비시크릿이 같은 채널에 섞여 있는 구조 자체의 결함
**1차 봉인 (4/10)**: rev 00223-llj(GCS) + rev 00224-5m5(ADMIN)
**Layer 2 (4/11)**: `500c2e1` 잠복 폭탄 통합 제거 + `d86217a` portal/deploy.sh `.env` 의존 제거 — 비시크릿값 직접 하드코딩으로 전환
**교훈**: 비시크릿 운영값(버킷명, 관리자 UID 등)은 deploy.sh 내 직접 하드코딩이 정본. `.env`는 시크릿(API 키 등)에만 사용. 헌법 4조 1항을 비시크릿값까지 과확장하지 말 것 (`memory/feedback_constitution_overextension.md`)

### 교훈 4: 자산은 있으나 노출 부재 (4/25 작가님 지적)

**현상**: /specs 26국 데이터 + Article+FAQPage+HowTo 스키마 완비, 라이브 200 OK이나 포털 nav·본문 어디에도 진입 동선 없음. 검색 유입자도 다른 페이지로 못 옴
**원인**: SEO 자산 구축(Phase 6)과 사이트 IA(Phase 0~3)가 시간차로 진행되며 통합 미흡. 자산 완성 시점에 노출 동선을 동시 갱신하지 않음
**대응**: Phase 7(4/25~) — 헤더·nav·본문·우측 사이드바 4축 동시 개편으로 자산 가시화
**교훈**: SEO/AEO 자산 완성과 사이트 IA 갱신은 같은 사이클에 묶어야 함. 자산 완성 보고 시 "노출 동선 검증"을 자동 체크리스트로 포함

---

## 6. 관련 문서 인덱스

> 이 PF에 귀속된 산출물 링크.

### 기안서 (PROPOSAL)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| `PROPOSAL_20260316_블록에디터통합_기안서.md` | 쌍아 | 블로그→블록 에디터 통합 | 승인 |
| `PROPOSAL_20260322_민아_monkosAI_메인페이지_리디자인.md` | 민아 | 메인페이지 리디자인 v2 | 승인 |
| `PROPOSAL_20260323_홈블록에디터_Phase0_기안서.md` | 쌍아 | 블록 에디터 Phase 0 | 승인 |
| `PROPOSAL_20260425_민아_포털전체개편_기안서.md` | 민아 | 포털 IA 4트랙 개편 (Phase 7) | ⏳ 검토중 |

### 기술명세 (SPEC)

| 파일 | 주체 | 내용 |
|------|------|------|
| `monkos-ops/tech/guides/PORTAL_V4_EVOLUTION_SPEC.md` | 쌍아 | Portal v4 Phase 0~7 기술명세 |
| `monkos-ops/tech/specs/SPEC_20260320_블로그에디터_기술명세서.md` | 쌍아 | 블로그 에디터 v2 기술명세 |

### 보고서 (REPORT)

| 파일 | 주체 | 내용 |
|------|------|------|
| 막내1 분기분석 PU-1,PU-2 | 막내1 | 포털+에디터 3/15~26 분석 |
| 막내2 분기분석 P8,P9 | 막내2 | 포털v4+CMS 3/1~14 분석 |
| `REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md` | 쌍아 | 4/10 INCIDENT 1차 봉인 보고 |
| `REPORT_20260421_매출0_내부전환분석.md` | 쌍아 | 매출 0 내부 전환 전수분석 (4/21) |
| `REPORT_20260421_매출0_외부돌파구분석.md` | 쌍아 | 외부 돌파구 분석 (4/21) |
| `REPORT_20260421_결제퍼널_정합성실측.md` | 쌍아 | 결제 퍼널 정합성 실측 (4/21) |
| `REPORT_20260422_PUBLIC버킷_맥락확인.md` | 막내1 | PUBLIC 버킷 맥락 확인 (4/22) |
| `REPORT_20260422_GCP_Firebase_인프라감사.md` | 막내1 | GCP·Firebase 인프라 감사 (4/22) |
| `REPORT_20260423_민아_GA4_GSC_MCP_정비완결+Ads_병목진단.md` | 민아 | GA4·GSC MCP 정비완결 + Ads 병목 (4/23) |

### 완료보고 (COMPLETION)

| 파일 | 주체 | 내용 |
|------|------|------|
| `COMPLETION_20260424_막내1_퍼널UX진단.md` | 막내1 | idphoto 히어로 개편 (KR/JP 동시) |
| `COMPLETION_20260424_막내1_app404_crop_FAQ.md` | 막내1 | AEO 1단계 — /app·/crop 보강 |
| `COMPLETION_20260424_막내1_AEO_트랙12_정합성검토.md` | 막내1 | AEO 제안서 트랙 1·2 정합성 검토 |
| `COMPLETION_20260424_막내2_결제플로우점검.md` | 막내2 | 결제 정상 작동 확인 |
| `COMPLETION_20260424_막내2_AI_referral_추적.md` | 막내2 | AI referral 추적 4서비스 |
| `COMPLETION_20260424_막내2_AEO_트랙345_정합성검토.md` | 막내2 | AEO 제안서 트랙 3·4·5 정합성 검토 |
| `COMPLETION_20260424_막내4_콘텐츠파이프라인.md` | 막내4 | 콘텐츠 파이프라인 오가닉 기반 |

### 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| `2cf33fd` | 03-13 | index.html v4 전면 교체 |
| `742490d` | 03-13 | CMS 플랫폼 구축 |
| `63b8f94` | 03-20 | 블로그 에디터 v2.0 ESM 분리 |
| `82d1a99` | 03-22 | 메인페이지 리디자인 |
| `a6f63d5` | 03-23 | 블록 에디터 Phase 0 |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 이탈률 미개선 (92% 고착) | 중 | A/B 테스트 + 서비스카드 CTA 강화 |
| 에디터 기술부채 (렉 재발) | 중 | ESM 모듈 분리 완료 — 모듈별 디버깅 가능 |
| 블록 에디터 Phase 1 지연 | 중 | Phase 0 안정 확인 후 진행 |
| 다국어 번역 품질 | 저 | 자동번역 후 수동 검수 파이프라인 |
| **외부 결제 0건 (4/24 GA 30일 실측)** | 고 | Phase 7 IA 개편으로 specs 노출 + 헤더 듀얼 CTA 강화. 트랙별 GA 이벤트 추적으로 효과 검증 |
| **deploy.sh 시크릿/비시크릿 혼용 재발** | 중 | portal/deploy.sh는 4/11 분리 완료. idphoto-kr/jp/studio 동일 패턴 점검 필요 (ch5 운영 점검) |
| **Phase 7 트랙 4 (쇼츠) 영상 URL 미수령** | 저 | 트랙 1~3은 작가님 결정 즉시 진행 가능. 트랙 4는 영상 URL 수령 후 후속 분리 배포 가능 |
| **자산-노출 시간차 재발** | 중 | 교훈 4 — SEO/AEO 자산 완성 보고에 "노출 동선 검증" 자동 체크리스트 도입 |
| **어드민 에이전트 CDP 접근** | 중 | 6/11 /admin/*.html 인증 가드 도입 후, 에이전트가 CDP로 어드민 UI 검증 시 사전에 작가님 수동 OAuth 로그인 필요. 현재는 작가님 1회 로그인→쿠키 유지로 해소. 향후 에이전트 자율 접근이 필요해지면 AGENT_API_KEYS→세션 쿠키 교환 API 신설 검토 |
