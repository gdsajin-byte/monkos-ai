# PF_CITADEL 히스토리 아카이브

> 원본: PF_CITADEL/README.md에서 분리 (2026-07-20)
> append-only. 편집·삭제 금지.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 3/14 | 코웍이 | 콘텐츠 통합 에디터 설계 | 설계 문서 | ✅ 문서화 |
| 3/15 | 코웍이 | SEO 템플릿 + B2B 전략, hreflang 수정 지시서 | 기안서 | ⚠️ 부분 실행 |
| 3/16 | 쌍아 | GEO GitHub 공개 레포 전략 기안 | [PROPOSAL_20260316_GEO_GitHub공개레포_전략](../proposals/PROPOSAL_20260316_GEO_GitHub공개레포_전략.md) | ✅ SPREAD v2에 흡수 |
| 3/17 | 코웍이 | **GEO/AEO 종합 기획서 (Project CITADEL 명명)** | 기획서 (7개 이슈) | ❌ Phase 1 미실행 → 3/25 해소 |
| 3/19 | 쌍아 | SPREAD v2 종합전략 (21채널, SEO/GEO 포함) | [PROPOSAL_20260319_SPREAD_v2_종합전략](../proposals/PROPOSAL_20260319_SPREAD_v2_종합전략.md) | ✅ 마스터 기안서 |
| 3/19 | 철창이 | 채널 현황 SNS·SEO 점검 리포트 | 리포트 | ✅ 문서화 |
| 3/24 | 코웍이 | SEO 긴급 시정 3건 (FAQ mainEntity, 미색인, sitemap) | 지시서 | ✅ 쌍아 검증 → 3/25 실행 |
| 3/24 | 쌍아 | SEO/GEO 최전선 로드맵 (Phase 0~3 + 사업화) | 로드맵 초안 | ✅ 전략 확정 |
| 3/25 | 민아 | SEO/GEO 최전선 전략 재브리핑 + 작가님 질의 검토 | [REPORT_20260325_민아_SEO_GEO_브리핑_전략검토](../reports/2026-03/REPORT_20260325_민아_SEO_GEO_브리핑_전략검토.md) | ✅ |
| 3/25 | 민아 | GA/서치콘솔 실측 → **hreflang 일방통행 발견** (72개 비색인 핵심 원인) | 진단 | ✅ → 즉시 수정 |
| 3/25 | 민아 | 자금조달 분석 + SEO/GA 종합 진단 | [REPORT_20260325_iMac민아_종합분석_자금조달+SEO진단](../reports/2026-03/REPORT_20260325_iMac민아_종합분석_자금조달+SEO진단.md) | ✅ |
| 3/25 | 민아 | **SEO/GEO 전체 현황 종합 보고** (기획↔실행 갭 진단) | [REPORT_20260325_iMac민아_SEO_GEO_전체현황_종합보고](../reports/2026-03/REPORT_20260325_iMac민아_SEO_GEO_전체현황_종합보고.md) | ✅ 핵심 진단 문서 |
| 3/25 | 쌍아→막내1,2,3 | **Phase 0 긴급 수정 5건** (hreflang양방향+canonical, FAQ JSON-LD, sitemap dedupe, noindex, llms.txt+robots.txt) | 커밋 `6fee987`, `f354e11` | ✅ prod 배포 완료 |
| 3/25 | 작가님 | CF 대시보드 AI Bot 차단 해제 | 수동 조치 | ✅ |
| 3/26 | 민아 | Google Ads KR/JP 캠페인 분리 + "여권사진" 노출 0 대응 분석 | [REPORT_20260326_민아_GoogleAds_KR분리+SEO진단](../reports/2026-03/REPORT_20260326_민아_GoogleAds_KR분리+SEO진단.md) | ✅ |
| 3/26 | 민아 | **Phase 1 프로그래매틱 GEO/SEO 실행 제안서** | [REPORT_20260326_민아_Phase1_프로그래매틱GEO_실행제안서](../reports/2026-03/REPORT_20260326_민아_Phase1_프로그래매틱GEO_실행제안서.md) | ✅ 쌍아 리뷰 완료 |
| 3/26 | 쌍아→막내1,2 | **Phase 1 실행** (Step 1 즉시최적화 + Step 2 specs허브 + Step 3 내부링크) | [ORDER 막내1](../orders/2026-03/ORDER_20260326_M1쌍아_막내1_Phase1_즉시최적화+llms보강.md), [ORDER 막내2](../orders/2026-03/ORDER_20260326_M1쌍아_막내2_Phase1_규격허브+내부링크+배포.md) | ✅ 완료 |
| 3/26 | 막내1 | **Step 1 완료** — Crop 메타(title/OG/canonical/JSON-LD) + Guide 메타(HowTo JSON-LD/hreflang) + llms-full.txt 규격 테이블 확장 | crop/index.html, render.js, llms-full.txt | ✅ 1m40s |
| 3/26 | 막내2 | **Step 2+3 완료** — specs 허브 7규격×3언어 + JSON-LD 트리플 스택 + sitemap 24 URL + 내부 링크 5건 + llms.txt 갱신 | specs-data.json, render.js, server.js, home.js, index.html, crop/index.html, llms.txt | ✅ 14m31s |
| 3/26 | 쌍아 | **Phase 1 코드 완료 보고** + render.js 2079줄 문제 발견 → 어젠다 #31 등록 | [COMPLETION_20260326_쌍아_032500](../reports/2026-03/COMPLETION_20260326_쌍아_032500.md) | ✅ |
| 3/26 | 막내2 | 코드 리뷰 9/9 합격. 경미 잔여: Guide 다국어 라우트 미구현 | — | ✅ |
| 3/26 | 작가님 | 배포 지시 (portal + monk.kr) | — | ⏳ 배포중 |
| 3/29 | 민아 | SEO 검색노출 수정 제안서 (P0/P1/P2 이슈) | PROPOSAL_20260329_민아_SEO검색노출_수정제안서 | ✅ |
| 4/05 | 민아 | SEO 기술 보정 4건 진단 (JA/EN 메타, Crop, Blog JSON-LD, alt) | ORDER_20260405_CITADEL_SEO보정_4건 | ✅ 진단 |
| 4/05 | 쌍아 | 코드 검증 → 3건 확정 (건4 alt 이미 해결 확인, 제외) | ORDER_20260405_CITADEL_SEO보정_3건 | ✅ |
| 4/05 | 막내2 | SEO 3건 코딩 완료 (home.js metaMap, crop H1+hreflang, blog JSON-LD) | — | ✅ 커밋 대기 |
| 4/07 | 막내2 | SEO 3건 prod 배포 완료 — JA/EN 메타 현지화 + Crop hreflang/H1 + Blog JSON-LD. monkos-portal rev 00015-tkk 재배포 | — | ✅ |
| 4/07 | 막내1 | SEO 3건 재배포 확인 (rev 00016-swt). Cloud Run 직접URL 4건 정상. **monkos.ai `/ja/`, `/en/` root경로만 KO로 fallback** — 인프라 프록시 계층 rewrite 이슈 발견. `/ja/blog` 등 하위경로는 정상 | — | ⚠️ 인프라 이슈 |
| 4/07 | 민아 | **GSC 실측 검증** — URL 검사 정상, FAQ 구조화 데이터 중복 오류 발견 (FAQPage 4건). 원인: index.html 정적 + home.js 동적 이중 삽입. 쌍아 전달 | GSC 캡처, 세션 로그 | ⚠️ 보정 대기 |
| 4/07 | 민아 | **GA/GSC 3개월 진단** — 오가닉 클릭 27회(하루 0.3), 검색어 6개, Paid 92%. claudemax 후기 노출 9,600%=허수(클릭0) | 세션 로그 내 분석 | ✅ 진단 완료 |
| 4/08 | 민아 | **sitemap 198개 재제출** + GA4·GSC 리서치 | `233c13f` | ✅ |
| 4/08 | 민아 | Google Ads 사이트링크 6개 등록 (심사 대기) + SEO DA 진단 — 코드 정상, DA(도메인 권위) 문제 판별 | 세션 로그 | ✅ |
| 4/08 | 민아 | Specs 26종 데이터 업데이트 배포 확인 | — | ✅ |
| 4/09 | 쌍아 | CDP 시연 지시서 3건 발행 (막내1 SEO진단 9222, 막내2 블로그발행 9223, 막내3 다국어검증 9224) | ORDER×3 | ✅ |
| 4/09 | 막내1 | **CDP SEO 라이브 진단 7페이지** — 이슈 3건 발견 (crop hreflang 불완전, idphoto canonical 경로 불일치, en specs 마이너) | REPORT_20260409_막내1, `5f5912a` | ✅ 진단완료 |
| 4/09 | 막내3 | **CDP 다국어 15페이지 검증** — lang 불일치 2건(/ja/ /en/ root=ko), 깨진img 3건, /en/about 404 | REPORT_20260409_막내3, `add12da` | ✅ 진단완료 |
| 4/10 | 쌍아 | Phase 1.7 보정 지시서 발행 (4건: crop hreflang, canonical, 깨진img, specs 혼입) | ORDER_20260410 | ✅ |
| 4/10 | 민아 | **HEAD 404 + 구슬러그 301 + NOINDEX 사이트맵** 지시서 2건 발행 — 오가닉 3대 장애 근본 원인 특정 | ORDER_20260410×2 | ✅ |
| 4/10 | 막내1+2 | **3서비스 prod 배포** (portal+idphoto-kr+idphoto-jp) + CDP 재검증 전 건 통과 | 배포 완료, `a247c3c` | ✅ |
| 4/10 | 민아 | **GSC 색인 재요청 19건** (포탈 9건 + 다국어 6건 + specs 4건) 전수 제출 | GSC 우선순위 크롤링 대기열 추가 확인 | ✅ |
| 4/19 | 민아 | **강한소상공인 v3 사업계획서 §4 실측 수치 확보** — GA/GSC/Ads CDP 직접 캡처. 일본 사용자 +33.7%(28일), GSC 노출 실측. §4-2 v1(기술 과적재) 확인 → v2(타임라인+실측지표) 드래프트(`/tmp/idea42v2.html`). PF_CITADEL·PF_PORTAL·PF_SPREAD 전수 파악 완료 | 세션 로그 `2026-04-19_iMac_민아.md` | ⏳ §4-2 v2 삽입 미완 |
| 4/21 | 민아 | **Phase 2 전환 제안서 발행** — 4/21 CDP 실측 기반. 일본 28일 노출 49/클릭 8 정체, 404 33개 잔존, idphoto-jp/kr sitemap URL 1개씩 치명 발견. 3단 로드맵(즉시/이번달/다음분기) + 논의 포인트 6건. 작가님 지시: "쌍아가 나와 논의하고 지시서로 환급" | [PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화](../proposals/PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화.md) | ✅ 지시서 환급 |
| 4/21 | 쌍아→막내1(막내3 재활용) | **Phase 2.0 지시서 발행**: idphoto-jp/kr sitemap 누수 차단 + 404 원인 분류 + 재색인 요청 | [ORDER_20260421_iMac쌍아_막내1_CITADEL_Phase20_색인누수차단](../orders/2026-04/ORDER_20260421_iMac쌍아_막내1_CITADEL_Phase20_색인누수차단.md) | ✅ |
| 4/21 | 막내3 | **Phase 2.0 실행**: idphoto-jp/kr sitemap 1→5 URL 확장(`/`, `/app`, `/camera`, `/prep`, `/policy/data`). prod 배포 jp rev **00107-5kx** + kr rev **00181-2v6**. 10/10 URL HTTP 200 실측. 404 33건 전수 수집·카테고리 분류(B1 vol 슬러그 10건·B2 언어 교차오염 4건·B3 번역 유령 17건·B4 레거시 2건 — **전부 portal 블로그 기원, idphoto 직접 관련 없음**). GSC sitemap 재제출 시도(UI 반영 비동기), URL 색인 요청 자동화 실패(deep link 404) | server.js 양 서비스 | ⚠️ 부분 완료 — 10+ 미달(SPA L1 5개 물리적 한계, 2.1 L1 랜딩 신설 필요), GSC 재크롤 대기(24-72h), portal hreflang 로직 수정 별건 권고 |
| 4/21 | 민아 | **Phase 2.1 제안 §4** — 일본 코어 키워드 5개(就活写真·証明写真 アプリ·パスポート写真 アプリ·証明写真 AI·運転免許 写真) 매칭 L1 랜딩 신설 지시 | [PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화](../proposals/PROPOSAL_20260421_민아_CITADEL_Phase2_색인누수차단+일본타깃정밀화.md) §4 | ✅ 지시서 환급 |
| 4/21 | 쌍아→막내1 | **Phase 2.1 지시서 발행** — 일본 코어 키워드 5개 L1 랜딩 신설 (조정안 A/B/C/D 작가님 전건 승인) | [ORDER_20260421_iMac쌍아_막내1_CITADEL_Phase21_일본랜딩신설](../orders/2026-04/ORDER_20260421_iMac쌍아_막내1_CITADEL_Phase21_일본랜딩신설.md) | ✅ |
| 4/21 | 막내1 | **Phase 2.1 실행** — idphoto-jp L1 랜딩 5개 신설·배포: `/guide/shukatsu`·`/guide/app-comparison`·`/guide/ai`·`/specs/passport`·`/specs/drivers-license`. 각 페이지에 title·meta description·H1·hreflang·JSON-LD(FAQ/HowTo)·CTA(/prep) 구현. server.js 라우트 5건 + sitemap urls 배열 5→10 URL 확장. prod 배포 jp rev **00108-ngl** 100% 트래픽. **5/5 URL HTTP 200 실측** + sitemap.xml 10 URL 반영 확인. 정합성 검토 3건(라우팅 MPA·sitemap 하드코딩 배열·PHOTO_SPECS config.js 2종) 선행 수행 후 실행. 운전면허 규격 24×30mm 확인 출처는 외무성·경찰청 가이드 기준. | public/guide/*.html 3건·public/specs/*.html 2건·server.js 라우트+sitemap 수정 | ✅ 배포·200 검증 완료 · GSC 재제출 후속 |
| 4/27 | 막내1 | **Phase 2.3 cold-start 해소** — deploy.sh 3건 min-instances 0→1. portal rev **00236-ck4** + idphoto-kr **00185-7n2** + idphoto-jp **00112-8p4**. 전 URL 200 OK, 최대 TTFB 0.92초, 503 **0건**. GSC 20건 검사: 17건 색인, 3건 미인식 | deploy.sh ×3 | ✅ |
| 4/27 | 막내2 | **슬러그 잔재 전수 조사** — 한글 slug 60건 분류 (교차오염 JA 11+EN 14, KO 잔재 18, A+B 17). 근본 원인: translate.js Gemini slug 실패 시 한글 원본 사용. 교정 옵션 3안 비교 → **옵션 B(Firestore 갱신+301) 추천** | [REPORT_20260427_막내2_슬러그잔재_조사결과](../reports/REPORT_20260427_막내2_슬러그잔재_조사결과.md) | ✅ |
| 4/27 | 막내2 | **슬러그 스키마 통일 코드 (작업 A)** — blog.js 영문 베이스 slug 강제 + `-kr` 접미사. translate.js 베이스 재사용(Gemini 독립 생성 폐지). render-blog/sitemap/github-issues/blog-editor 6파일 일괄 수정. 레거시 호환 폴백 구현. portal rev **00237-6p9** 배포 완료 | blog.js, translate.js 외 4파일 | ✅ |
| 4/27 | 막내3 | **전 Phase 정밀 감사** — 49항목 중 42건 완료(86%). 미실행 7건 특정. Phase 1.7 잔존 2건(깨진이미지+lang=ko) 해소 확인. specs 20개국+ 이미 81 URL 완료. 일본 L1 5개 중 4/5 색인(6일 만에 3개 SERP 노출) | [REPORT_20260427_막내3_CITADEL_Phase감사+미실행보고](../reports/REPORT_20260427_막내3_CITADEL_Phase감사+미실행보고.md) | ✅ |
| 4/27 | 민아 | **GSC 28일 분석** — Quick Wins 3건, claudemax /en/ 노출 49% 점유 CTR 0.23%(자산화 실패), "여권사이즈" specs 매칭 오류(KR에 SG/TH 노출), 面接お団子 카니발리제이션 | [REPORT_20260427_iMac민아_GSC_28일_검색노출분석](../reports/REPORT_20260427_iMac민아_GSC_28일_검색노출분석.md) | ✅ |
| 4/27 | 민아 | **GSC×GA4 교차 + 이미지 검색** — 이미지 노출 4/16 변곡점(일평균 14→61, 4.2배). chatgpt.com referral 8세션(AEO 시작). 트래픽 79% 광고, Organic 1.9%. 4/22~23 급락=광고 정지 패턴 | [REPORT_20260427_iMac민아_GSC_GA4_교차분석_이미지검색](../reports/REPORT_20260427_iMac민아_GSC_GA4_교차분석_이미지검색.md) | ✅ |
| 4/27 | 쌍아 | **교차오염 25건 Firestore 삭제** — migrate_korean_slugs.js `--execute` 실행. 3/14~3/21 초기 문서 전부 delete (unpublish 아닌 완전 삭제, 작가님 승인) | — | ✅ |
| 4/27 | 쌍아 | **KO 잔재 35건 마이그레이션** — `--phase2 --execute` 실행. 한글 slug → 영문 `-kr` doc 전환. 기존 번역본 `originalSlug` 연쇄 갱신. server.js 301 매핑 35건 추가. portal rev **00238-987** 배포 완료 | server.js, migrate_korean_slugs.js | ✅ |
| 4/27 | 쌍아 | **vol36 번역 실패 발견** — 한송이 신규 발행(13:51 KST). Gemini JSON 파싱 오류(`Bad escaped character`). JA/EN 미생성. translate.js JSON 방어 + vol36 재번역 + 35건 일괄 재번역 지시서 발행 | ORDER_20260427 | ⏳ 막내 투입 대기 |
| 4/27 | 쌍아 | **블로그 본문 잘림 발견** — 기존 데이터 문제. EN 28건/JA 24건/KO 15건 content < 500자. CMS 저장 시 원본 유실(기존). 마이그레이션은 잘린 데이터를 그대로 복사한 결과. **쌍아 과오: Firestore 전수 검증 없이 마이그레이션 실행** | — | 🔴 |
| 4/27 | 쌍아 | **render-blog.js 목록 12건만 표시 버그** — 중복 제거 key가 언어 무관 base slug → 전 언어 257건에서 12건만 생존. `effectiveLang` 강제 + base key 개선 → 즉시 수정+배포 rev 00239-sxg | render-blog.js | ✅ |
| 4/27 | 쌍아 | **CMS 파이프라인 전수 진단 지시서 발행** — PF_PORTAL 소관. 작성→번역→sitemap→색인 전 구간 오류 패턴 분석. 추가 마이그레이션/번역 트리거 전면 동결 | ORDER_20260427 | ⏳ 막내 투입 |
| 4/27 | 민아 | **GSC 색인 경보 원인 규명** — idphoto-jp/kr `Disallow: /app` prefix 매칭이 `/guide/app-comparison` 차단 + sitemap에 차단 URL 포함 = robots.txt × sitemap 직접 충돌 | REPORT_20260427 | ✅ |
| 4/27 | 쌍아 | **robots.txt × sitemap 충돌 해소** — robots.txt `/app` → `/app/` (prefix 매칭 사고 방지) + sitemap에서 /app /camera /prep 제거. idphoto-jp+kr 배포 완료 | robots.txt ×2, server.js ×2 | ✅ |
| 5/01 | 민아 | **CITADEL 28일 성과 + Google Ads 효율 분석** — GSC 노출 W1 31/일 → W4 91/일 우상향 확정 (4/27 cold-start+slug 효과). Phase 2.1 일본 L1 「일본 취업 증명사진」 CTR 16.7%. 일본 노출 점유율 6.7%→17% 2.5배. Google Ads 의존도 87%, 전환 측정 0(GA4 conversion 미설정), 일본 4 키워드 CPS $2.4~$4.07로 한국 대비 5~10배. 자산화 키워드 0개·정착 진입 2개 진단 *(7/19 좌초 브랜치 회수 — 원기록 5/1)* | 세션 로그 [2026-05-01_iMac_민아](../../sessions/2026-05/2026-05-01_iMac_민아.md) | ✅ |
| 5/10 | 민아 | **30일 성과 종합 분석** — GA4+GSC 병렬 수집. 활성유저 2,625(+142%), SEO 노출 4/26~ 3배 점프(일 100~170), 회원가입 15건(전환율 0.57%), AI유입 4건 첫 감지. 퍼널 병목: 홈→prep 4.8% | 세션 로그 `2026-05-10_iMac_민아.md` | ✅ |
| 5/10 | 쌍아 | **광고 채널 정밀 분석** — 스마트 캠페인 이탈 82.4% 판명, 일본 검색이 최양질(이탈 60.5%/체류 64초). 멀티채널 숏폼 전략 확정 | [RESEARCH_20260510](../../sessions/2026-05/RESEARCH_20260510_쌍아_광고채널_데이터분석.md) | ✅ |
| 5/11 | 민아 | **GA4+GSC 종합 분석 (4/13~5/10)** — 노출 866→2,189(+153%), 클릭 16→49(+206%). "여권사진" 첫 등장(23건). AEO 19세션(+125%). specs CTR 1.5~2% 병목 특정. **Phase 2.2 업그레이드 제안서 발행** | [PROPOSAL_20260511_민아_CITADEL_Phase22_업그레이드](../proposals/PROPOSAL_20260511_민아_CITADEL_Phase22_전환율최적화+키워드확장.md) | ✅ 작가님 리뷰 |
| 5/11 | iMac/막내1 | **Phase 2.2 Tier 1 실행** — A: specs 상위3건 seoTitle/seoDescription B: /guide/ai-photo 랜딩+JSON-LD C: korea-passport FAQ 확장 D: claudemax EN noindex(승인 완료) | 코드 7파일 | ✅ |
| 5/14 | iMac/민아 | **Phase 2.2 후속 제안서 발행** — 5/11 Tier 1 미배포(일주일 잠금) 진단 + 6 Unit 환급 단위 분해(배포→색인요청→7일측정→Tier2 E/F/G→Tier1 보강) + 7일 측정 사이클 정착안 | [PROPOSAL_20260514_민아_CITADEL_Phase22_배포재시작+측정사이클](../proposals/PROPOSAL_20260514_민아_CITADEL_Phase22_배포재시작+측정사이클.md) | ⏳ 쌍아 ORDER 환급 대기 |
| 5/14 | iMac/막내2 | **Phase 2.2 Unit-1 포탈 배포** — monkos-portal rev 00245-w8z prod 100%. seoTitle 3건+guide/ai-photo JSON-LD 정상. claudemax EN noindex 미적용 발견(slug 불일치) | [COMPLETION_20260514_막내2_CITADEL_포탈배포](../reports/2026-05/COMPLETION_20260514_막내2_CITADEL_포탈배포.md) | ✅ |
| 5/14 | iMac/민아 | **monk.kr 본진 SEO/GEO/AEO 검수** — sitemap 3주 묵음·debate 미등록·test_monkos.html 색인위험·_headers 빈파일·FAQ/Person/Breadcrumb JSON-LD 부재·llms-full 7주 묵음·외부 CDN 4건 의존 식별. 등급: SEO B+/GEO A-/AEO C+ | 세션 로그 + 12:14 KST 발신 보고 | ✅ |
| 5/14 | iMac/민아 | **종합 제안서 발행 — monk.kr + 네이버 3축 확장** — 본진 6단위(U-M1~6) + 네이버 6단위(U-N1~6, Search Advisor·플레이스·블로그·ogtag·이미지alt·카톡채널) 통합 패키지. CITADEL "구글+AI" 2축 → "구글+AI+네이버" 3축 확장. Phase 2.2 Unit-4와 통합 묶음 권고 | [PROPOSAL_20260514_민아_monk.kr_종합SEO검수+네이버확장](../proposals/PROPOSAL_20260514_민아_monk.kr_종합SEO검수+네이버확장.md) | ✅ 민아 직접 ORDER 환급 |
| 5/14 | iMac/막내2 | **monk.kr AEO 강화 패키지** — sitemap 17URL lastmod 갱신+debate 추가, test_monkos noindex, naver:ogtag+모바일메타 4건, FAQPage 6건+BreadcrumbList JSON-LD. CF Pages 배포 완료. curl 5건 전건 통과 | [COMPLETION_20260514_막내2_monk.kr_AEO강화패키지](../reports/2026-05/COMPLETION_20260514_막내2_monk.kr_AEO강화패키지.md) | ✅ |
| 5/14 | iMac/민아→막내2 | **민아 직접 ORDER 환급** — monk.kr 본진 AEO 강화 패키지 통합 (U-M1 sitemap+noindex / U-N3 naver:ogtag+모바일메타 / U-M3 FAQPage+BreadcrumbList JSON-LD, Person 보류). 작가님 직접 지시로 헌법 1조 2항 ③항(민아 흐름) 적용 | [ORDER_20260514_iMac민아_막내2_monk.kr_AEO강화패키지](../orders/2026-05/ORDER_20260514_iMac민아_막내2_monk.kr_AEO강화패키지.md) | ⏳ 막내2 실행 대기 |
| 5/14 | iMac/막내3 | **Phase 2.2 Unit-2 EN noindex 수정 + GSC 색인 요청** — render-blog.js EN slug 추가, portal rev **00246-gkk** 재배포. GSC 4건 색인 요청(guide/ai-photo 신규+specs 3건 재크롤) + sitemap.xml 재제출. 전건 성공 | [COMPLETION_20260514_막내3_CITADEL_ENnoindex+GSC색인](../reports/2026-05/COMPLETION_20260514_막내3_CITADEL_ENnoindex+GSC색인.md) | ✅ |
| 5/14 | iMac/막내3 | **monk.kr Person 스키마 + llms 필명 정정** — Person JSON-LD(Shin-jakka 단독) 추가, llms.txt/llms-full.txt 본명 제거(Representative 유지). CF Pages wrangler 수동 배포. curl 4건 전건 통과 | [COMPLETION_20260514_막내3_monk.kr_Person+llms필명정정](../reports/2026-05/COMPLETION_20260514_막내3_monk.kr_Person+llms필명정정.md) | ✅ |
| 5/14 | 작가님 | **필명·본명 정체성 분리 원칙 확정** — 법적 사업자 본명(신정규/footer) vs 브랜드·검색·AI 필명 "Shin-jakka" 분리. 동반 표기 금지. 영문 표기 통일. 메모리 적립 `project_persona_separation.md` | 메모리 + MEMORY.md ⭐ | ✅ 적립 |
| 5/14 | iMac/민아→막내2 | **민아 직접 후속 ORDER 환급** — monk.kr Person 스키마 추가(Shin-jakka 단일, 본명 미포함) + llms.txt·llms-full.txt 필명 정정(Representative 필드는 본명 유지) + Last updated 5/14 갱신. CF Pages 배포 | [ORDER_20260514_iMac민아_막내2_monk.kr_Person스키마+llms필명정정](../orders/2026-05/ORDER_20260514_iMac민아_막내2_monk.kr_Person스키마+llms필명정정.md) | ⏳ 막내2 실행 대기 |
| 5/20 | iMac/막내1 | **D1 IDPASS 스키마 생성 + 데이터 마이그레이션** — 5테이블(countries/documents/seo_content/common_requirements/slug_aliases) + 8인덱스 DDL. 3소스 통합 마이그레이션: countries 202, documents 112(jsonl 101+v2 10+seo 1), seo_content 24, slug_aliases 26, ICAO 요구사항 10. 기존 테이블 무영향 확인 | `scripts/d1-migration/migrate-specs.js`, `seed.sql`, D1 monk-db 적재 완료 | ✅ |
| 5/20 | iMac/막내2 | **CF Workers SSR monk.kr/specs/ 구축** — _lib 모듈 4개(queries/seo/i18n/template) + 라우트 핸들러 9개 + robots.txt. JSON-LD 4종(Article+FAQ+HowTo+Breadcrumb), hreflang 4개, 3언어 라우팅. 로컬 테스트 8항목 전건 통과 | `functions/specs/` 11파일 | ✅ |
| 5/20 | iMac/막내1 | **SEO "사진" 키워드 보정 + Canvas 가이드** — H1/title에 type별 "사진" 삽입(passport→여권사진), Canvas 인라인 JS 가이드 오버레이 | template.js, seo.js | ✅ |
| 5/20 | iMac/쌍아 | **가이드 이미지 생성 4회 시도 — 전부 품질 미달** — ①Node Canvas 추정 ②좌표보정 ③CropEngine export ④글씨반전+줌아웃. PF_CROP 미참조가 근본 원인. CropView 스냅샷 방식 지시서 발행(미실행) | — | 🔴 |
| 5/20 | iMac/막내1 | **CropEngine Vision export 23장** — 글씨반전 수정 + 줌아웃 보정 완료했으나 IDPASS 앱 수준 미달. CropView 스냅샷으로 재접근 필요 | MONK_kr/images/specs/guides/ | ⚠️ 재작업 필요 |
| 5/20 | iMac/막내1 | **IDPASS 가이드 Canvas + SEO 키워드 보정** — Hero SVG→Canvas 인터랙티브 가이드(코너 브래킷+가이드라인 4개+치수 라벨+스펙 배지). O/X 비교 SVG→Canvas(PASS/FAIL). H1/title에 "사진" 키워드 추가(passport/visa/id/license). queries.js ICAO 글로벌 요구사항 포함 수정. 단위 테스트 12/12 통과 | `template.js`, `seo.js`, `queries.js` | ✅ |
| 5/20 | iMac/막내1 | **규격별 가이드 이미지 112개 일괄 생성** — ref.jpg 얼굴좌표 측정 + Node Canvas/Sharp로 규격별 크롭·오버레이(코너 브래킷+가이드라인 4개+치수 라벨+스펙 배지). WebP 85% 출력, 총 4.0MB. Canvas 인라인 JS→`<img>` 정적 이미지로 전환 (이미지 SEO alt 포함). 단위 테스트 10/10 통과 | `generate-guide-images.js`, `MONK_kr/images/specs/guides/*.webp` 112건, `template.js` 수정 | ✅ → 아래 교체 |
| 5/20 | iMac/막내1 | **CropEngine Vision 기반 23개 사이즈별 가이드 이미지** — Node Canvas 추정 방식 폐기 → CropEngine.swift Vision 얼굴 감지 + crop() 실제 크롭 결과 기반. `--export-guides` CLI 모드 추가. 23 고유사이즈 × PNG export → cwebp WebP 변환 760KB(총). 112개 개별파일 → 23개 사이즈별로 통합. template.js size-WxH.webp 매핑 | `MonkosCropApp.swift` export 기능, `MONK_kr/images/specs/guides/size-*.webp` 23건, `template.js` 수정 | ✅ |
| 5/20 | iMac/막내1 | **CropEngine.crop() 규격별 비율 보정 + 초록 오버레이** — 하드코딩 FACE_TARGET=33/45 폐기 → spec.faceTarget/heightMM 동적 계산. 51×51: 73%→65%, 50×70: 73%→50% 얼굴 비율 분화. EYE_POSITION도 높이≥60mm면 0.42. 오버레이 색상 #6c4fff→#00D4AA(IDPASS 액센트). 23장 재생성 | `CropEngine.swift` 상수→동적, `MonkosCropApp.swift` 색상, `size-*.webp` 23건 | ✅ |
| 06/07 | 쌍아 | **Google Indexing API 블로그 자동 연동** — 블로그 발행 시 `requestIndexing()` 즉시 색인 요청. sitemap ping 대기(24-72h) → 즉시 반영. blog.js CREATE/UPDATE 양쪽 적용 | blog.js | ✅ |
| 06/07 | 쌍아 | **llms.txt 블로그 자동 갱신** — 발행 시 `appendToLlmsTxt()` 호출, AI 엔진 인용 소스에 신규 글 자동 추가. GEO/AEO 자산 자동 확장 | blog.js | ✅ |
| 06/07 | 쌍아 | **채널별 자동 배포 최적 방안 조사** — 7채널 전수 조사. API 직통 5채널(Reddit/X/Facebook/Instagram/네이버) + CDP 전용 2채널(note.com/Medium). 3층 구조 확정 | 세션 내 보고 | ✅ |
| 06/10 | 막내1 | **보안 취약점 전수 조사** — Fable 5(PR#45) 보고 9건 교차 검증 전건 확인(오탐 0). 신규 9건 발견(Critical 1+High 2+Medium 6). 합계 18건. 공격 체인(N-1→C-4→C-2) 특정. 수정 코드 미포함(진단 전용) | [REPORT_20260610_iMac막내1_보안전수조사](../reports/2026-06/REPORT_20260610_iMac막내1_보안전수조사.md) | ✅ |
| 06/10 | 막내4 | **보안 페일클로즈 응급 패치 (Phase 9 T0)** — 공격 체인(N-1→C-4→C-2→H-1) 4건 차단. N-1: handleAuthToken 세션 검증, C-4: ADMIN_UIDS 페일클로즈 4개소, C-2: 크레딧 API 인증(portal 3핸들러+idphoto-kr/jp), C-3: AUTH_SECRET 폴백 제거 | auth.js, credits.js, config.js, admin-auth.js, idphoto-kr/jp | ✅ |
| 06/10 | 쌍아 | **portal prod 배포** rev 00278-h8k — 보안 페일클로즈 4건 라이브 적용. idphoto-kr/jp는 AUTH_SECRET 환경변수 미설정 → 작가님 GCP 콘솔에서 추가 후 순차 배포 필요 | `deploy.sh prod` | ✅ portal / ⏳ kr·jp |
| 06/10 | 막내1 | **SA 권한 전수 조사** — SA 2개 운용 확인(yong-a-orchestrator=CI + monk-image-engine=런타임). yong-a-orchestrator: roles/editor 과잉 → GA4/GSC 읽기만 사용, 프로젝트 IAM 제거 가능(속성 권한만 유지). monk-image-engine: 6개 역할 최소 매핑 완료. 시나리오 A(각각 축소) 권고 | [REPORT_20260610_iMac막내1_SA권한전수조사](../reports/2026-06/REPORT_20260610_iMac막내1_SA권한전수조사.md) | ✅ |
| 06/14 | 막내1 | **사이트맵 재정리 Phase 1** — sitemap index 분할(static/specs/blog), lastmod today 박제 해소, specs 정본 monkos.ai 통일 | COMPLETION | ✅ |
| 06/14 | 막내2 | **specs 구조화 데이터 P0 수정** — HowTo locField 전환 + Article inLanguage 추가 + JA countryJa 분기. 1,335 URL 전수 반영. prod 배포 rev 00288 | render-specs.js | ✅ |
| 06/15 | 막내2 | **GEO P0 — IndexNow + robots.txt** — seo.js IndexNow 구현(발행→5엔진 동시 통지), robots.txt 검색봇 5종 + 훈련봇 3종, sitemap today 박제 해소. prod 배포 | seo.js, blog.js, robots.txt | ✅ |
| 06/15 | 막내3 | **specs 1,335 URL 전수 품질 감사** — 색인 장애 근본원인 4건: FAQ 98% 부재·seoTitle 99% 동일·JA 한국어 잔류 21건·데이터 두 세대 | [REPORT](../reports/2026-06/REPORT_20260615_iMac막내3_SPECS_1335페이지_전수품질감사.md) | ✅ |
| 06/15 | 막내1 | **specs 공통FAQ 445건 + seoTitle 445건 + countryJa 445건** — 색인 장애 R1·R2·R3 해소. prod 배포 | specs-data.json | ✅ |
