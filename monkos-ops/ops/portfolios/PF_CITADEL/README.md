---
type: portfolio
id: PF_CITADEL
name: CITADEL
subject: SEO/GEO/AEO 통합 포트폴리오 — 검색 엔진 + AI 엔진 노출 확보
domain: SEO
created: 2026-03-26
owner: 작가님
leads: 쌍아(설계), 민아(분석·콘텐츠), 코웍이(전략)
status: active
---

# PF_CITADEL — SEO/GEO/AEO 통합 포트폴리오

> 검색 엔진(SEO)과 AI 엔진(GEO/AEO)에서 MONKOS의 노출을 확보하는 포트폴리오.
> 코드네임 CITADEL은 코웍이 3/17 기획서에서 유래.

> 완료 Phase/전략 상세: [ARCHIVE_PHASES.md](ARCHIVE_PHASES.md)

---

## 1. Phase 현황 요약

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 — 기본기 | hreflang·sitemap·llms.txt·robots.txt | ✅ 완료 (3/25) |
| 1 — 프로그래매틱 SEO/GEO | specs 허브·JSON-LD·내부링크 | ✅ 완료·배포 (3/26→4/07) |
| 1.5 — 기술 SEO 보정 | JA canonical·hreflang·Blog JSON-LD | ✅ 완료 (4/07) |
| 1.7 — CDP 이슈 + 오가닉 장애 | HEAD 404·NOINDEX 모순·hreflang | ✅ 완료 (4/10) |
| 2.3 — Cold-start + Slug 통일 | min-instances 1·slug 스키마 | ✅ 완료 (4/27) |
| 2.4 — GEO 구조화 + 사이트맵 정본화 | IndexNow·구조화데이터·슬러그 위생 | ✅ 완료·배포 (6/14~15) |
| 2 미착수 | 엔티티 SEO·클러스터·CWV·AI 모니터링 | ⏳ 아래 참조 |
| 3 — 사업화 | SEO/GEO 전문 서비스·B2B API | — 미래 |

### Phase 2 미착수 → 재분류 (4/27 감사 기준)

| 항목 | 상태 | 비고 |
|------|------|------|
| 프로그래매틱 SEO 규격 확장 (20개국+) | ✅ **완료 재분류** | sitemap specs 81 URL(27개국×3언어) 이미 구현 |
| 엔티티 SEO (Organization/Person 스키마 강화) | ❌ 미착수 | **Phase 2.2 우선순위 1위** |
| 토픽 클러스터 심화 (블로그 ↔ specs 양방향) | ❌ | 블로그 타이틀 최적화와 묶음 |
| AI 검색 인용 모니터링 체계 | ❌ | 도메인 권위 선행 필요 |
| CWV (Core Web Vitals) 최적화 | ❌ | 트래픽 확보 후 |

---

## 2. 히스토리

> append only. 신규 항목은 하단에 추가.


> 전체 히스토리: [ARCHIVE_HISTORY.md](ARCHIVE_HISTORY.md)

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 06/15 | 막내1 | **GEO P1 — BreadcrumbList + inLanguage + llms.txt** — 블로그+specs 전면 BreadcrumbList, 블로그 inLanguage 추가, llms.txt specs 카탈로그 반영. prod 배포 rev 00292 | render-blog.js, render-specs.js, render-llms.js | ✅ |
| 06/15 | 웹/민아 | **슬러그 위생 + 레거시 410** — seo-exclude.js 사이트맵 필터 + slug.js isWeakSlug + server.js 410 + redirects.js DRY. 막내3 검수→regex 버그 발견→민아 회귀 수정(PR #74). prod 배포 | 10파일 | ✅ |
| 06/15 | 작가님 | **GSC sitemap 3건 개별 제출** — static(20)+blog(217)+specs(1,335) 명시 등록. 오류 2건 삭제 | GSC | ✅ |
| 06/15 | 쌍아 | **IndexNow specs 1,335건 전수 배치 통지** — 빙·네이버·얀덱스·Seznam·Yep 동시. 3배치 200 OK | curl | ✅ |
| 06/15 | 웹/민아 | **6/14~15 색인작업 종합 검수** — 9개 워크스트림 라이브 실측 교차. 취지 반영도 높음 확인. 잔여: 정크 리슬러그·측정 루프 | [REPORT+PR#75](../reports/2026-06/REPORT_20260615_웹민아_색인작업_종합검수.md) | ✅ |
| 06/15 | 웹/민아 | **PF_CITADEL 완성도 평가** — 65~70%. 인프라 90%·지표 55%·전환 30%·운영정합 40%. "성채는 쌓았으나 세금 못 걷는다" | 평가 보고 | ✅ |
| 06/15 | 웹/민아 | **Phase 현황 현행화 + 라이브 재검증** — Phase 1 "배포중"→완료 보정, 6/14~15을 Phase 2.4로 편입, §4 측정공백 명시. 재배포 실측: 정크 14-vs·5-10·47-20x **0**(O-1 해소)·IndexNow specs 배치(O-4 해소)·GSC 재제출(측정 재개). 운영정합 40%→상향 | 본 README | ✅ |
| 06/17 | iMac/막내3 | **GEO P2 — 사이트맵 hreflang 교차링크** — sitemap-specs.xml 전 URL에 ko/en/ja/x-default 4개 alternate(5,340개 태그), sitemap-blog.xml 번역 존재 글만 동적 hreflang(588개 태그). guide/ai-photo ja/en 라우트 미존재 확인→현행 정상. prod 배포 rev 00297-9gn | render-sitemap.js | ✅ |
| 06/17 | iMac/민아 | **오가닉 상승 실측 검증 (GA4 교차검증)** — 직전 28일比 오가닉검색 세션 108→228(**+111%**)·활성 87→198(+128%)·신규 82→194(+137%). 주별 W19~24 우상향(25→32→30→37→46→82, W25는 미완주간). 유료 축소(Display 937→321·Paid Search 819→670)에도 오가닉 자생 2배 → "광고=오가닉부스터" 작동 실증. 06/15 평가의 "성채는 쌓았으나 세금 못 걷는다"에 대한 **세금 유입 시작 신호** | GA4 prop 521406894 / [세션로그](../../sessions/2026-06/2026-06-17_iMac_민아.md) | ✅ |
| 06/17 | iMac/막내3 | **GEO P2 — 사이트맵 hreflang 교차링크 구현**. sitemap-specs.xml 5,340태그 + sitemap-blog.xml 588태그(번역존재분 동적). prod 배포·실측 | COMPLETION_20260617, `94fd5b1f` | ✅ |
| 06/18 | iMac/막내1 | **헤드텀 자기잠식 해소** — idphoto-kr/jp canonical+hreflang `/app`→`/` 통일(6줄), 포털 CTA/프롬프트 9파일 루트 변경, 블로그 vol38/ai-kr title/H1에서 "AI증명사진" 헤드텀 제거+CTA 삽입. 3서비스 prod 배포(kr 00198/jp 00123/portal 00299) | [COMPLETION](../reports/2026-06/COMPLETION_20260618_iMac막내1_CITADEL_헤드텀자기잠식해소.md) | ✅ |
| 06/17 | 웹/민아 | **"AI 증명사진" 헤드텀 정밀 경쟁분석** — 색인 1,580 급증(specs 다국어 침투) 해석 + 자기잠식 적발(우리 5페이지 분산: app 62·blog 146·guide 11·루트 96) + 증명한컷(idcut.kr) **빈집 실측**(playwright SERP — 토종 정조준 유일, 나머지 글로벌 번역체) + 광고중단 가설 반증(GSC상 광고무관 요동) + 헤드텀 거버넌스 처방 | [경쟁분석](../../reports/2026-06/REPORT_20260617_웹민아_AI증명사진_헤드텀_경쟁분석.md) | ✅ |
| 06/18 | iMac/쌍아 | **헤드텀 거버넌스 + 블로그 축 전환 제안서** — 웹/민아 "5페이지 잠식" 과잉진단 보정(서브도메인=별도전선, 진짜 잠식은 포털 내 3페이지) + idphoto-kr canonical 모순 적발(app/루트 삼중충돌) + monkos.ai 블로그 축 AI/바이브코딩으로 전환 + 헤드텀 레지스트리 신설 제안. 민아 교차검증 완료 → 지시서 발행 → 배포 완료. 증명한컷 벤치마크 보고서 추가 | [제안서](../../proposals/PROPOSAL_20260618_iMac쌍아_헤드텀거버넌스_블로그축전환.md) [벤치마크](../../reports/2026-06/REPORT_20260618_iMac쌍아_증명한컷_경쟁사벤치마크.md) | ✅ |
| 06/18 | 웹/민아 | **제안서 교차검증 + 전수조사** — "왜 /app이 떴나" 라이브 HTML로 규명(canonical+hreflang이 /app 가리켜 루트 신호 강제송금, robots 무죄) → **대표=루트 확정 권고**. 보완 2건 적발: 제안서 hreflang 누락(KR/JP index.html 6줄) + guide@11 보호(헤드텀 제거 대상서 제외). 전수조사 A~E(KR/JP index.html·포털 CTA/RAG 내부링크·Ads·GSC) | [교차검증](../../reports/2026-06/REPORT_20260618_웹민아_헤드텀제안_교차검증.md) | ✅ 쌍아 토스 |
| 06/18 | 쌍아→막내 | **헤드텀 루트 통일 실행+배포** — KR/JP canonical+hreflang /app→/ (3줄씩) + 포털/functions CTA·RAG 내부링크 9개소 /app→/ + 블로그 title 헤드텀 제거(render-blog SEO_TITLE_OVERRIDES, guide 미접촉) + CTA블록. 4건 배포(idphoto-kr·jp·portal·CF Pages) | 막내 배포 | ✅ |
| 06/18 | 웹/민아 | **배포 후 라이브 검증 7/7 통과** — ①②KR /·/app canonical+hreflang 루트 ③JP 루트+KO↔JP 상호참조 정합 ④guide/ai-photo title 무변동(11위 보호) ⑤vol38·⑥ai-kr 헤드텀 제거 확인 ⑦포털 /app→idphoto루트 302 정상(오라우팅 無). og:url·x-default·robots 무변동. **§3.C 자기교정**: 내 인벤토리가 functions/ RAG·JP짝 누락 → 쌍아 9개소 상위집합이 더 완전 | 라이브 curl 실측 | ✅ |
| 06/18 | 웹/민아 | **글로벌(EN/JA) 도달+측정 진단** — 측정 인프라 완비(GSC country/page+GA4 geo, 단 웹 ADC 한계로 iMac 경유). 도달 정석(hreflang): /en//ja/ 200 라이브, en/ja specs 각 445+en blog 70페이지, US/UK/JP 핵심페이지 실재. 새 en 서브도메인 불필요(글로벌=jp 단일종착·번역기반, 레몬 통화¥ 미스매치없음). 404 오판 2건 자기교정(슬러그 구조) | [글로벌도달·측정](../../reports/2026-06/REPORT_20260618_웹민아_글로벌도달_측정진단.md) | ✅ |
| 06/19 | iMac/쌍아 | **헤드텀 레지스트리 초안 작성 (Phase 2.5)** — KR/JP/EN 3시장 노드 맵. 발행 게이트 5단계, 채널 역할표(9채널), 충돌 판정 기준, 데이터 Tier 위계. EN 본격 확장: AI headshot 헤드텀 8건 + B2B 5건 + ASO 6건 + pSEO 복제 패턴(HeadshotPro). 금지 조합 KR 4건 + EN 4건. 6/18 전략 대전환(B2B+영어권앱) 반영 | [HEADTERM_REGISTRY](../../marketing/seo/HEADTERM_REGISTRY.md) | ✅ |
| 06/20 | iMac/쌍아 | **네이버 검색광고 API 연동 — 절대 검색량 인프라 구축**. 네이버 데이터랩(상대트렌드) + 검색광고 키워드도구(절대량) 2종 확보. GCP Secret Manager 3종 등록(NAVER_SEARCHAD_*). 축 C(전문직 B2C) 실측: "공인중개사" 월 26,460 / "세무사" 37,740 / "증명사진" 53,210. 축 C 전략 확정 — 전문직 대분류 키워드 여정 콘텐츠 내 프로필 사진 CTA 삽입 | SECRET_INVENTORY 갱신 | ✅ |
| 06/23 | iMac/민아 | **URL·슬러그 변경 SEO 안전 프로토콜 정본화** — 6/19 specs 슬러그 회귀 사고(120 URL 색인자산 손실) 재발방지. ① 자동변환 중복검사 ② 슬러그 삭제 완료조건(301+sitemap+GSC) ③ 중복 상시감지 ④ 배포 후 실측. PF_SPECS 작업 시 필수 준수 | [PROTOCOL](PROTOCOL_url_slug_safety.md) · [REPORT](../../reports/2026-06/REPORT_20260623_민아_SPECS_슬러그회귀_색인자산손실.md) | ✅ |
| 06/24 | iMac/막내3 | **SEO 내부 경합 종합 감사 + 시타델 작동 검증** — GSC/GA4 실측. "ai 증명사진" 3-way 경합(app/guide/blog) 확인, 포털 메인 / 노출 0회. 6/18 canonical 통일 후 신호 이전 미발생(서브도메인 구조상 불가). 시타델 판정: 부분 작동(외곽·성벽 OK, 킵 헤드텀 장악 미작동). P0: 블로그 전체 CTA 자동삽입 확대 + 남자증명사진 CTR 개선. P1: 대표URL 단일화(/guide 권고) | [REPORT](../../reports/2026-06/REPORT_20260624_iMac막내3_SEO내부경합종합감사.md) | ✅ |
| 06/24 | iMac/막내 | **SEO 내부 경합 종합감사 막내3 보강** — 웹사이트 구조 실측. 메인/idphoto H1 공백 누락 2건 추가 발견. /specs/*/korea → /kr 301 + canonical ISO 정상 복구 확인. /guide/ai-photo hreflang ko/x-default만 존재 재확인. 시타델 판정: 부분작동 유지. P0: H1 공백 수정 + 블로그 CTA 확대. | [REPORT](../../reports/2026-06/REPORT_20260624_iMac막내_SEO내부경합종합감사.md) | ✅ |
| 06/24 | iMac/민아 | **포털 라우팅 헬스 전수 + 전환동선 링크시스템 설계** — 라이브 54 URL 헬스(전 라우트 정상, /pricing·/guide 404 이슈 해소 확인) + GA4/GSC 실측 + 인기/유입 13페이지 병렬 감사(ultracode 워크플로우). funnelVerdict **broken 5/partial 8/good 0**. broken 공통원인 2개: ① 블로그 CTA 화이트리스트 게이트(막내 소유) ② specs CTA bare 홈 하드코딩(render-specs.js L1516). P0~P2 액션 + 역할분담(render-blog.js=막내, 타 렌더러=쌍아→막내) | [REPORT](../../reports/2026-06/REPORT_20260624_iMac민아_포털전환동선링크시스템설계.md) | ✅ |
| 06/25 | iMac/민아 | **P0-2 실행 완료 — specs 상세 CTA 홈→촬영실 직진** (민아 단독 풀사이클: 기획→실행→preview검증→prod승격→실도메인검증). render-specs.js i객체 언어별 ctaHref(ko·en→idphoto-kr, ja→idphoto-jp)+L2321 교체. 모든 구버전 specs 상세 일괄. rev 00377-feh 트래픽100%. ⚠️deploy.sh 동일소스 트래픽미승격 이슈 발견·update-traffic 해소 | [세션로그](../../sessions/2026-06/2026-06-25_iMac_민아.md) | ✅ prod |
| 06/25 | iMac/민아 | **specs 전환 후속 — STATUS 체계 + 가이드 설계 + 레몬 승인** — ① STATUS_pricing 신설(가격 현재상태 잔액문서: 세션로그=원본/as-of 캐시, 레몬승인 반영 첫 갱신) ② specs 가이드 이미지 설계(인종사진⊥측정선 분리, crop.js+specs-data.json 정본, 한국여권 prof.jpg 파일럿) ③ Lemon Squeezy 승인→코드·시크릿 완비 확인, 외부 결제 블로커0 | [STATUS](../../status/STATUS_pricing.md) · [DESIGN](../../tech/designs/2026-06/DESIGN_20260625_specs_가이드이미지체계.md) | ✅ 설계·진단 |
| 07/05 | iMac/막내 | **specs 복합 type 301 루프 수정** (PROTOCOL_url_slug_safety §2 준수) — parseSlug가 `in-visa-evisa`·`in-visa-bls`를 country=`in-visa`로 오분해 → canonical `/specs/visa-evisa/in`·`/specs/visa-bls/in`(×3언어) 자기참조 301 루프. TYPE_SLUG_PATTERNS에 복합 type 2건 등재 + fallback 301을 REDIRECT_MAP 정본 기준·자기참조 가드로 전환. 전 슬러그 1,394 URL 대사: 루프 8→0, 404 2→0. 구 canonical(`/specs/evisa/in-visa` 등, GSC 노출 22·클릭 3 실재) 전부 신정본 301 승계, sitemap 신정본만 방출 확인. 미배포 — prod 반영은 배포 대기 | [COMPLETION](../../reports/2026-07/COMPLETION_20260705_iMac막내_CITADEL_specs리다이렉트루프수정.md) | ✅ dev 검증 |
| 07/05 | iMac/민아 | **GSC 404 색인 126건 실체 규명 + 해소** — GSC 콘솔 실사: idphoto-jp는 2건 잡음, 본체는 포털. ① 풋터 `${prefix}/terms.html` 유령링크 교정+정책 3종 /(en\|ja) 301 신설 ② BLOG_REDIRECTS 전수 대사(죽은 타깃 22건 교체·GSC 실측 슬러그 7건 흡수·58 타깃 재프로브 404 잔존 0) ③ robots.txt(kr/jp) Disallow 슬래시 패턴 결함 교정+`/auth/` 차단. monk.kr 403 2건은 CF 봇차단 오탐 확정(스캐너 분류 신설, 5월부터 이월 종결). dev rev 00039 검증 | [COMPLETION](../../reports/2026-07/COMPLETION_20260705_iMac민아_77마감스프린트.md) | ⏳ prod 배포 대기 |
| 07/14 | M1/쌍아 | **SEO 인프라 전수 실측 + 막내3 보고 교정** — 작가님 지적("네이버 검색광고 API 이미 연결해놓았다")으로 현행 인프라 전수 점검. **이미 작동 7건**: GSC·GA4 daily수집, Google Indexing API, IndexNow(5엔진), 네이버 검색API 프록시, 네이버 검색광고 SM등록 3종, Telegram 알림. **키만 있고 코드 없는 것 1건**: 네이버 검색광고 API(키 등록 6/20, 호출 코드 0건). **진짜 공백 4건**: Bing WMT 수집, PageSpeed API, GA4 Realtime, 네이버 DataLab. 커버리지 실측 ~50%(막내3의 25-30%는 과소) | — | ✅ |
| 07/14 | M1/민아 | **vol36 타이틀 정리 + 썸네일 템플릿 "피치 2.0" 승격 (작가님 B안 승인)** — title 접두사([한연구원 매거진 vol.36]) 제거·랭킹 문구 보존(키워드 전진 배치), 썸네일 3안 제작(HTML→헤드리스 렌더 1280×670)→아티팩트 갤러리 제시→B안 채택. GCS 업로드(1784005472874_banner_KR_vol36_v2.jpg, 73KB)·CMS thumbnail+본문 리드 이미지 교체·og:image 라이브 검증. **공용 템플릿 정본화**: contents/blog/templates/thumbnail_template_피치2.0.html (치환 4필드+렌더 절차 주석) — 이후 vol 시리즈 리뉴얼 표준 | [템플릿](../../../contents/blog/templates/thumbnail_template_피치2.0.html) | ✅ |
| 07/14 | M1/민아 | **vol36(안경 취업사진, GSC pos 1.2 클릭엔진) 전면 개보수 — 경로③ 작가님 직접 지시** — 서식 정상화(h6핵·`<br>`HTML블록 흡수로 인한 `######` 리터럴 리크 3곳 해소), 본문 2,473→4,699자(h2 8·h3 6·표 3·FAQ 5·체크리스트), title/h1/slug/tags 랭킹 자산 불변, summary 신설, 이미지 9종 재배치+의미 alt, **specs 백링크 축 5링크**(passport/license/resume kr)+블로그 상호링크, 신분증vs취업사진 규정 차이 섹션(관련검색어 "민증사진 안경" 흡수), SERP 실측(구글 1위 확인·관련검색어 수확). CMS(blog_posts/vol36-kr) 반영·라이브 검증 완료. 원본: contents/blog/blog_20260714_vol36-glasses-jobphoto-rich_KR.md + 롤백 백업. en/ja 자매 문서는 구버전 잔존(후속) | [원본 md](../../../contents/blog/blog_20260714_vol36-glasses-jobphoto-rich_KR.md) | ✅ (쌍아 추인 대기) |
| 07/14 | M1/민아 | **쌍아 통합 대시보드 초본(dashboard_schema_v01) 검수 — 조건부 승인** (작가님 지시) — 실측 대조 8포인트 중 7 정합(어드민 API 5종 실존·BQ tracking·SM 44·audit_secrets·5채널 코드 27참조·MCP 6서버·미구현 정직 표기). 🔴 정정 1: GA4 KPI "세션(7d) 41" 라벨-값 불일치(7d 실측 285, 41은 일 단위). 🟡 2: Purchase "계측 복구"→"복구(실발화 검증 대기)" 정확화 · GSC 85클릭은 7/10 스냅샷(데이터 기준일 캡션 권장). 제안: v0.2 = 정적 목업을 기가동 어드민 API 5종+GSC/GA4에 바인딩(미구현 "BQ→시각화"와 직결, 프론트 바인딩만 잔여) | 세션로그 7/14 18:5x | ✅ (쌍아 정정 3건) |
| 07/14 | M1/막내3 | **SEO/GEO 정보수집 전략 수립 + Ubersuggest MCP 판정** — Ubersuggest MCP 37개 도구 전수 분석→SKIP 권고(기존 스택 중복, 비용 대비 가치 부족). 채널 14개 전수 조사, P0 3건(GSC 확장/Bing WMT/네이버 검색광고) + P1 4건(GA4 확장/DataLab/PageSpeed/서치어드바이저) 식별. ⚠️ 막내3 "네이버 0%" 판정은 오판 — 네이버 검색광고 API 키 3종 기등록(6/20)+IndexNow 네이버 통지 작동 중+검색 API 프록시 가동 중. 정확한 공백은 "검색광고 API 자동수집 파이프라인 미구축" 1건 | [Ubersuggest](../../reports/2026-07/REPORT_20260714_M1막내_Ubersuggest_MCP_전수분석.md), [채널전략](../../reports/2026-07/REPORT_20260714_M1막내_SEO_GEO_정보수집전략.md) | ✅ (쌍아 보정) |
| 07/14 | M1/막내3 | **SPECS 헤드텀·구조화데이터 전수 검수** — seoTitle 1,284건 스캔: 패턴 이탈 13건(Photo Photo 7건, 국가명 오류 2건, 언어 오염 3건), en 제목 98% 60자 초과(구조적), 카니발리제이션 HIGH 2건(us-passport↔us-visa, uk-passport↔eu-passport). JSON-LD 전수 PASS(Article/FAQ/Breadcrumb/hreflang). prod 12URL 라이브 전항 통과. SEO/GEO/AEO 3축 실효성 검증 방안 제안(URL Inspection배치, GA4 AI채널, Featured Snippet 추적) | [REPORT](../../reports/2026-07/REPORT_20260714_M1막내3_SPECS_헤드텀구조화데이터_전수검수.md) | ✅ |
| 07/15 | iMac/막내1 | **CITADEL 대시보드 어드민 이식 + prod 배포** — 쌍아 초본 v0.1 HTML을 `admin/citadel.html`로 이식, `/api/admin/dashboard/citadel` 엔드포인트 신설(GA4 7d 세션 + BQ 퍼널/이벤트 종합, 1h 캐시). 민아 정정 3건 반영(세션 합계+일평균, Purchase 실데이터/"계측 중", 기준일 캡션). dashboard.html에 CITADEL 링크 추가. dev rev 00126 → prod rev 00477 배포 완료 | [COMPLETION](../../reports/2026-07/COMPLETION_20260715_iMac막내1_CITADEL_대시보드_어드민이식.md) | ✅ |
| 07/15 | iMac/쌍아 | **CITADEL 대시보드 어드민 이식 + 유저 프로필 통합 설계 + 4건 prod 배포 + 계측 한계 실측** — ① CITADEL 초본 HTML → admin/citadel.html 이식(prod 00477) ② generations 인덱스 신설+329건 백필(prod 00479) ③ 어드민 유저 상세 페이지(4소스 조인: Firestore users/tx/generations + BQ 동선, prod 00480) ④ 외부 유입 역추적+정적 필터+전체 유입 채널 집계 카드(prod 00481). 통합 설계서 작성(buildUserProfile 단일 조립, 어드민=전필드/마이페이지=필터링). BQ 실측: 46%봇, 인앱 브라우저 referrer 누락 → UTM 방향 확정 | [설계서](../../tech/designs/2026-07/DESIGN_20260715_유저프로필_통합데이터모델_대시보드재설계.md) | ✅ prod 4건 |
| 07/16 | 브라우저/철창이 | **Technical SEO/GEO Audit** — Googlebot UA raw HTML 감사. SSR·hreflang·PropertyValue 10·FAQPage 8·robots.txt 전항 합격. 결함 3건(출처 중복Low·마크업Low·Offer스키마Opp). 사이트맵 분할 권고 | [REPORT](../../reports/2026-07/REPORT_20260716_철창이_SEO_GEO_Audit_Citadel.md) | ✅ |
| 07/17 | iMac/막내1 | **어드민 ID Photo Review 실시간 전환** — 데이터소스 GCS listing → Firestore `generations` 컬렉션 전환. KR/JP/Headshot/전체 4탭 + cursor 페이지네이션("더 보기") 구현. 버킷 `CUSTOMER_GCS_BUCKET` 경유 Signed URL. dev 실측: all 탭 정상, kr/jp/headshot은 복합 인덱스(service+createdAt DESC) 생성 후 동작. 테스트 103/103 통과 | [COMPLETION](../../reports/2026-07/COMPLETION_20260717_iMac막내1_ADMIN_리뷰페이지_실시간전환.md) | ✅ (인덱스 생성 대기) |
| 07/17 | iMac/쌍아 | **사이트맵·URL·콘텐츠 전수 조사 + 수정** — 428slug×4lang 전수 스캔: thin 1건(kr-halfcard), URL충돌 0. 사이트맵 결함 4건 수정: ①lastmod 52일 스테일 갱신 ②ES 정적 4항목 추가 ③언어별 4분할(sitemap-specs-{ko,en,ja,es}.xml) ④템플릿 sourceHtml 중복 제거. GSC 개별 제출 대기 | [REPORT](../../reports/2026-07/REPORT_20260717_iMac쌍아_SPECS_사이트맵_URL전수조사.md) | ✅ 배포 대기 |
| 07/19 | iMac/쌍아 | **Ads 전환 추적 2단 + GA4 내부 필터 완성** — 전환 액션(purchase+free_generation_complete) GA4 연동 등록, GA4 내부 트래픽 필터 활성(사무실+집 IP). 막내1 코드 배포(rev 00516). ads.sh CID 분기 수리(막내1). 롱테일 키워드 6개 언어 3소스 교차 테이블(민아). 동남아 수요 실증(인니 foto visa korea 720/월, foto paspor 9,900/월) | ads.sh · 전환 설정 · GA4 필터 · [REPORT 롱테일](../reports/2026-07/REPORT_20260719_iMac민아_롱테일키워드_네이버구글_다국어테이블.md) | ✅ 재점화 준비 완료 |
| 07/19 | iMac/쌍아 | **Google Ads API 인프라 구축 완료** — Basic Access 승인 확인 → OAuth 클라이언트(웹) 생성 → 시크릿 5종 SM 등록(DEV_TOKEN·CLIENT_ID·CLIENT_SECRET·REFRESH_TOKEN·CUSTOMER_ID) → ads.sh 래퍼 작성(test·keywords·campaigns·search-terms) → 키워드 플래너 실동작 검증("증명사진" 18,100/월, CPC 345~1,096원). 민아 활용전략 제안서 발행 | [ads.sh](../../../../scripts/ads.sh) · [PROPOSAL](../proposals/PROPOSAL_20260719_민아_구글애즈API_데이터활용전략.md) | ✅ 읽기 API 가동 |
| 3개국어 블로그 매일 발행 | ✅ | 기존 | — |
| 7/19 | iMac/민아 | **구글 애즈 API 데이터 활용 전략 제안서 발행** — Basic Access 승인(7/17 SM 선등록 토큰) 계기. 광고=오가닉 부스터 정본 프레임: 신규 데이터 6종(검색어·키워드플래너·전환추적 등) × 3축(마케팅 전환루프/CITADEL 자산화 파이프라인·429슬러그 수요지도/꾸 콘텐츠 주제·카피 피드백) + 수집 인프라(ads.sh·주간 3원 교차)·거버넌스(읽기 우선·쓰기 승인 게이트)·P0~P2 로드맵. KPI=자산화 키워드 0→N. V2 퍼널 실작동 첫날=전환 루프 닫기 적기 | [PROPOSAL](../proposals/PROPOSAL_20260719_민아_구글애즈API_데이터활용전략.md) | ⏳ 작가님 결정 3건 |
| 7/19 | iMac/민아 | **롱테일 키워드 다국어 테이블 발행** — 3소스 교차(GSC 실측+네이버·구글 자동완성 6개 언어+키워드 플래너 첫 실전). 핵심: 여권 사진 18,100/월 LOW·CPC 246원(KR 광고 최저가 크랭크), 인니 "foto visa korea"·베트남 "ảnh visa hàn" 자동완성 1위(동남아 국내시장 수요 실증), 통념형 클러스터 전 언어 동형 반복(귀·안경·앞머리·ピアス — vol36 CTR 42% 공식 확장 근거), 유아 여권 니치 3개 언어 독립 출현, ZH 무료 생성기 의도 최강. 5클러스터+액션 5건 | [REPORT 롱테일](../reports/2026-07/REPORT_20260719_iMac민아_롱테일키워드_네이버구글_다국어테이블.md) | ✅ |

---

## 3. 성과 (최신 실측)

> ⚠️ **측정 공백(G-2)**: 마지막 종합 실측은 **5/11**. 이후 Phase 2.4 인프라 대폭 강화 + 6/17 오가닉 +111% 교차검증 완료. 다음 종합 실측에서 Phase 2.4 효과 베이스라인 확보 필요.
> 과거 실측 (3/25 기준점, 4/27): [ARCHIVE_PHASES.md](ARCHIVE_PHASES.md)

### 5/11 실측 (민아 GA4+GSC API 종합, 28일: 4/13~5/10)

| 항목 | 수치 | 변화 (vs 4/27) |
|------|------|---------------|
| GSC 28일 총 노출 | **2,189** | **+153%** (866→2,189) |
| GSC 28일 총 클릭 | **49** | **+206%** (16→49) |
| 일 노출 평균 | **~85** | **+174%** (~31→~85) |
| 일 노출 피크 | **171** (5/6) | 3.4배 |
| 국가: KOR | **1,046노출 / 39클릭 / CTR 3.7%** | 노출 +329% |
| 국가: JPN | **189노출 / 7클릭 / CTR 3.7%** | 노출 +226% |
| 국가: USA | **433노출 / 0클릭** | 신규 측정 (specs 글로벌) |
| GSC "여권사진" 계열 | **23건 노출** (0→첫 등장) | **돌파** — "한국 여권 사진 규격 2026" 순위 8위 |
| GSC "증명사진" 계열 | **~48건 노출** (20+파생 키워드 합산) | 증가 |
| specs CTR | **1.5~2.0%** | **병목** — 노출 대비 클릭 전환 저조 |
| "ai 증명사진" | 3노출/2클릭, CTR **67%**, 순위 127위 | 순위만 올리면 대박 |
| GA Organic Search | **70명** (2.8%) | +37% (51→70) |
| ChatGPT/OpenAI 합산 | **19세션** | **+125%** (8→18+α) |

> **핵심 판정**: 기술 SEO 투자가 복리로 작동 중. 다음 병목은 "노출→클릭 전환"(specs CTR) + "도메인 권위"(외부 백링크 0).

---

## 4. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 도메인 나이로 상위 진입 지연 | 높음 | 외부 백링크 + 콘텐츠 깊이로 보완, 장기전 |
| 정부 사이트 도메인 권위에 밀림 | 높음 | 정부가 안 하는 것(AI 서비스, FAQ Schema, 반려 사례)에서 차별화 |
| Thin Content 패널티 | 낮음 | 가드레일: 페이지당 800자+, 고유 60%+ |
| AI 엔진 인용 지연 | 중간 | llms.txt + JSON-LD + 구조화 콘텐츠 |
| monkos.ai `/ja/`, `/en/` root 프록시 rewrite | 높음 | 인프라 계층(도메인→Cloud Run 매핑) 확인 필요 |

---

## 5. 관련 문서 인덱스

### 기안서 (PROPOSAL)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| [SPREAD_v2_종합전략](../proposals/PROPOSAL_20260319_SPREAD_v2_종합전략.md) | 쌍아 | 21채널 통합 전략 (SEO/GEO 포함) | 마스터 기안서 |
| [GEO_GitHub공개레포_전략](../proposals/PROPOSAL_20260316_GEO_GitHub공개레포_전략.md) | 쌍아 | GitHub 기반 GEO 전략 | SPREAD v2에 흡수 |
| [CITADEL_Phase2_색인누수차단+일본타깃정밀화](../proposals/PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화.md) | 민아 | Phase 2 전환 제안 (색인 누수 + 일본 L1) | ✅ 지시서 환급 완료 |
| [**CITADEL_Phase22_전환율최적화+키워드확장**](../proposals/PROPOSAL_20260511_민아_CITADEL_Phase22_전환율최적화+키워드확장.md) | 민아 | Phase 2.2 — CTR 최적화 + AI증명사진 랜딩 + 엔티티 SEO | ⏳ 작가님 리뷰 |

### 보고서 (REPORT)

| 파일 | 주체 | 내용 |
|------|------|------|
| [민아_SEO_GEO_브리핑_전략검토](../reports/2026-03/REPORT_20260325_민아_SEO_GEO_브리핑_전략검토.md) | 민아 | 재브리핑 + 색인수/블로그vs포털 질의 |
| [iMac민아_종합분석_자금조달+SEO진단](../reports/2026-03/REPORT_20260325_iMac민아_종합분석_자금조달+SEO진단.md) | 민아 | GA/서치콘솔 실측 + hreflang 발견 |
| [iMac민아_SEO_GEO_전체현황_종합보고](../reports/2026-03/REPORT_20260325_iMac민아_SEO_GEO_전체현황_종합보고.md) | 민아 | **핵심 진단** — 기획↔실행 갭 |
| [민아_GoogleAds_KR분리+SEO진단](../reports/2026-03/REPORT_20260326_민아_GoogleAds_KR분리+SEO진단.md) | 민아 | Ads 분리 + 여권사진 노출 0 대응 |
| [민아_Phase1_프로그래매틱GEO_실행제안서](../reports/2026-03/REPORT_20260326_민아_Phase1_프로그래매틱GEO_실행제안서.md) | 민아 | Phase 1 실행 제안서 |

### 지시서 (ORDER)

| 파일 | 수신 | 내용 | 상태 |
|------|------|------|------|
| [막내1_Phase1_즉시최적화+llms보강](../orders/2026-03/ORDER_20260326_M1쌍아_막내1_Phase1_즉시최적화+llms보강.md) | 막내1 | Crop/Guide 메타 + llms-full.txt | ⏳ 작업중 |
| [막내2_Phase1_규격허브+내부링크+배포](../orders/2026-03/ORDER_20260326_M1쌍아_막내2_Phase1_규격허브+내부링크+배포.md) | 막내2 | specs 허브 + 내부 링크 + llms 갱신 | ⏳ 작업중 |

### 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| `6fee987` | 3/25 | Phase 0: hreflang+sitemap+noindex (17파일, +630행) |
| `f354e11` | 3/25 | Phase 0: llms.txt+robots.txt (4파일, +450행) |
| `db785c5e` | 7/20 | EN 타이틀 429건 60자 재생성 "Photo Size" 포맷 + H1 연호 동기화 (prod 00522) |
