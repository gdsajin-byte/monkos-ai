---
type: portfolio
id: PF_SPECS
name: SPECS
subject: 글로벌 증명사진 규격 허브 — 9개 언어 × 320문서 = 3,500+ 페이지 SEO/GEO 자산
created: 2026-05-22
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
---

# PF_SPECS — 글로벌 증명사진 규격 허브

> 각 국가·문서별 규격 페이지 자체가 콘텐츠가 되고, SEO/GEO 최적화로 구글 검색 백링크로 작동하며, IDPASS 앱과 상호 연동하는 채널.
> 9개 언어 × 320문서 = ~3,500 페이지 색인 목표.

---

## 완료 Phase 아카이브

> 비전·현황 진단·언어 전략·아키텍처 설계·Phase 로드맵·관련 PF 연동 등 초기 설계 본문은 아카이브로 분리.
> **[ARCHIVE_PHASES.md](ARCHIVE_PHASES.md)** 참조 (281행, 2026-07-20 분리)

---

## 현재 상태 (2026-07-20)

- **V2 완결**: 429슬러그 전량 V2 직결 (7/19 V1 소각 완료, prod 00519)
- **유니크 콘텐츠**: 파일럿 4국 탑재 라이브, 확산 배치 대기
- **동남아 1단계**: id/vn어 라이브 + GSC 사이트맵 등록 완료
- **도해 시스템화**: v5 레포 편입 완료, 인물 팩 파이프라인 설계 대기
- **33 플로어 제거**: prod 00520 라이브 (fMin+1 하한 복원)

---

## 히스토리

> **append only. 수정·삭제 금지.**
> 2026-07-16 이전 히스토리(122행)는 아카이브로 분리: **[ARCHIVE_HISTORY.md](ARCHIVE_HISTORY.md)** 참조

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 07/16 | iMac/막내2 | **크레딧 동선 완결 + 글로벌(en·레몬)** — 상시 복귀 링크(returnBar)+10c CTA(returnCta)+글로벌 모드(lang판별·en사전·레몬5종 서버 fetch)+적립 폴링(5초·180초 타임아웃). config.js GLOBAL_TOPUP+서버 엔드포인트. ko 토스 회귀 0. dev 00140-jv6 | [COMPLETION](../../reports/2026-07/COMPLETION_20260716_iMac막내2_SPECS_크레딧동선완결_글로벌.md) | ✅ dev |
| 07/16 | iMac/민아 | **크레딧 동선 완결 검증 + prod 00492** — 막내2(상시 복귀 링크·10c CTA·글로벌 en+레몬 상점 5종 서버정본 API·적립 폴링) 검증 합격: en 전면 전환·ko 회귀 0·GLOBAL_TOPUP↔VARIANT_CREDITS 5/5 정합·resume 무수정 준수. 민아 보완 1줄(상대경로 복귀 허용 — dev 화이트리스트 이슈). prod 실측: 복귀 링크 가시 + 클릭→specs 도착→보존 사진 복원→pay 화면 (E2E 사슬 실증). 잔여: 로그인 10c 자동생성 구간 작가님 1회 완주 | prod 00492-7hw | ✅ |
| 07/16 | iMac/민아 | **/crop 은퇴 + prod 00493** (작가님 지시: 특허 준비 산식 자산 보호) — 코드 apps/crop-app 보관·웹 제거·/specs 301(IDPASS 허브 신설 시 타깃 변경 주석)·sitemap 제거·내부 링크 소거(specs 4언어·pricing·챗봇). 실측: 301 정상·sitemap 0건·specs/pricing 회귀 0. 배포 중 신형 --yes 게이트(막내 금일 구현) 첫 실작동 확인 | prod 00493-qpw | ✅ |
| 07/16 | iMac/민아 | **specs-url 빌더 검수·prod 00496** (쌍아 설계·막내1 실행분) — 빌더 5함수·직접 조립 잔존 0·ISO 자동 확장(countryEn 정합 후속 수확)·dev 전체국명 301 6/6·사이트맵 1,712·hreflang 5종 → prod 스팟 301·200·1,712 확인. ch2 7조 첫 코드 집행 완결 | prod 00496-7pl | ✅ |
| 07/16 | iMac/민아 | **대시보드 전채널 P1 검증 완결 + prod 00497·00498** — 신규 4 API(gsc·naver·bing·performance) 게이트 4/4·시크릿 비접촉 확인. 검증 중 결함 4건 수정: 빈결과·부분실패 캐시 고착 가드 2건, searchAd 400 진범=공백 키워드(로컬 A/B 확정), GSC KPI '연결 대기' 정적 표기→totals 배선. deploy.sh SM 시크릿 6종 주입. 최종: searchAd 5키워드 실데이터(여권사진 월 85,400 등)·GSC 28d 총계(클릭 366·평균 11.1위) 라이브 | prod 00498 | ✅ |
| 07/16 | iMac/민아 | **matte 재시도+대기연출 검증 합격** (막내3 실행분) — 재시도 1회+로그·15/35초 멘트(무료+유료)·4언어 8키·타이머 클리어 리뷰 통과, prod SSR 주입 실측. 프로세스 노트: 미커밋 선탑승(00497 동승) 발견 → deploy.sh 미커밋 경고 게이트 쌍아 검토 요청 | 커밋 완료 | ✅ |
| 07/17 | iMac/민아 | **유니크 콘텐츠 레이어 기획 확정 + 파일럿 3국 가동** (작가님 직접 지시 "옷 입히기") — 실측: uniqueContent 0건·반려사유 고유 8세트/428(전면 템플릿)·es 결함(영문 누출·주석 혼입·번역 파손). 철창이 DB 소재 확정(Drive `철창이 조사/` — 문서유형별규격 v3 23국 132행+eVisa 디지털). uniqueContent 스키마·카탈로그 6종·언어 관점 차별화·적대검증 파이프라인 설계. Workflow 파일럿 us-visa·vn-visa·ca-passport (ko+en, wf_43671794) | [DESIGN](../../../tech/designs/2026-07/DESIGN_20260717_specs_유니크콘텐츠레이어.md) | ⏳ 파일럿 검증 중 |
| 07/17 | iMac/민아+Workflow | **파일럿 4국 완료 (kr·us·vn·ca, ko+en)** — 품질기준 v2(작가님: 규격 나열 금지·공식 정독·실반려 중심) 반영. 적대검증 80주장: confirmed 70·wrong 3·unverified 8·plausible 3 → 검증자 fix 37건 전량 편집 반영(v1.1). us 22/22 전원 confirmed. 부산물: **정본 결함 6건 적발** — kr `restrictions.ears`(2018 폐지 규정 4언어 서빙)·onlineGuide 구식·officialSource 루트 / ca `standard=PPTC-203` 오지정(분실신고 양식)·fileSpec 불일치(공식 1800×1200~4500×3000, 200KB~5MB)·**faqs "셀프촬영+AI배경제거" 캐나다 공식(사진관 대면 의무·편집 금지)과 정면 충돌(서비스 리스크)**. vn 35×45 공관설: 공식 미확인→완화 표현, 대신 주미 베트남대사관 2×2인치 공식 확인 | drafts/UNIQUE_20260717_{kr-passport·us-visa·vn-visa·ca-passport}.json | ⏳ 작가님 검수·핫픽스 승인 대기 |
| 07/17 | iMac/민아 | **정본 핫픽스 6건 + Phase 0-A es 클린업** (작가님 승인) — kr ears 폐지규정 교정·소요기간·officialSource / ca PPTC-203→IRCC·details·fileSpec·faq 캘리브레이션(§3-5 실무 캘리브레이션 독트린 첫 적용). Phase 0 스캔: es 결함 1,453건 실측 → 기계 치환 가능분 1,274건(faq 배경색 영어값, 425슬러그)+주석 2건 즉시 소거, 잔존 100건(restrictions 87 재번역=Tranche B). jest 103/103(스테일 1건 현행화). **배포 보류**: 쌍아 미커밋 4파일 선탑승 방지 — 쌍아 랜딩 후 동승 | f3175d0d·8e405496 | ✅ 라이브 (prod 00499) |
| 07/17 | iMac/민아+Workflow | **Tranche B es 재번역 696항목 + 5커밋 일괄 prod 배포** (작가님 일괄 승인) — 결함 155슬러그 restrictions 전 키(678)+fileSpec/validity(18), 16배치 번역→검수(32에이전트, 검수 수정 2건). 재스캔 잔존 0(그레나다 축어 인용 오탐 1 유지 — 공관 간 유효기간 상충 발견, 유니크 콘텐츠 소재). jest 103/103. 배포: dev 00148 스모크 7/7 → **prod 00499-ptg** 스모크 7/7 (쌍아 사이트맵 4분할·막내1 어드민 리뷰 동승, es sitemap 428 URL 확인). 선탑승 2회 차단(쌍아 4파일→커밋 대기, 막내1 2파일→쌍아 대리 커밋 후 배포) | 8e47e7de·[세션로그](../../sessions/2026-07/2026-07-17_iMac_민아.md) | ✅ 라이브 |
| 07/17-18 | iMac/민아 | **세션 마감분 — 실사고 3건 수정·P0 인시던트·회귀 부검 완결** ① CSS 비율 하드코딩(prod 00500)·Wave1 퍼널 4건 재검증(prod 00501)·fit 자기모순 3슬러그+가드테스트·T1 성전환 긴급 A+B+유니크 콘텐츠 파일럿 탑재(prod 00502) ② T1 P0 인시던트(INCIDENT_20260717_specs-t1-identity — 무승인 폴백 시인·유료 실패 정책 교정·판정 상수 지도 §5) ③ 회귀 부검 10종 종합(REPORT_20260717_회귀부검 — 5패턴·처방 6조) ④ 심야: matte 경보 과잉 진단·블로그 -kr 이중 URL 원인 확정. 인계: §3-3/3-4 실행·블로그 정비 5건·확산 배치 | [세션로그](../../sessions/2026-07/2026-07-17_iMac_민아.md)·[INCIDENT](../../incidents/2026-07/INCIDENT_20260717_specs-t1-identity.md)·[부검](../../reports/2026-07/REPORT_20260717_iMac민아_SPECS_회귀부검_종합.md) | 🔀 새 세션 인계 |
| 07/18 | iMac/막내1 | **규격 공식 원문 전수 검증** — 결함 후보 9계열 + Tier1(16국) + Tier2(15국) 공식 정부 사이트 검증. 🔴확정 결함 4건(id-passport head -13mm, in-passport ICAO 전환 미반영, cn-resume 구조적, br-passport head +11mm) + 🟠부분 결함 7건(lt kr상수, co/cl 합성, cu 사이즈 분쟁, ye head, nz/de 배경). UK형 crown 정의(UK·CA 머리카락 불포함 vs US·AU 포함) 식별. 코드 수정 없음(리서치 전용) | [REPORT](../../reports/2026-07/REPORT_20260718_막내_SPECS_규격공식원문_전수검증.md)·[JSON](drafts/official_source_audit_20260718.json) | ✅ |
| 07/18 | iMac/막내2 | **크롭 엔진 배치 복원 + 폴백 정책 정렬 + 데이터 병합** — Block A~E 전량 실행. 배치: 눈앵커 42/43% 복원(IDPASS 정본), hairTop 가드·턱 마진 가드 추가. 폴백: FaceMesh 완전 제거(9패키지), T1 강등 출고→명시 에러+미소모, 커버 크롭→FACE_NOT_DETECTED, 사이드카 무한 재시작+경보+부트 게이트. 게이트: crown/eye warn-only 캘리브레이션 대기. 데이터: vn 42복원, bg 14슬러그, warning 12건, onsite 4국, digitalOnly 2건, bgNote 4건, BG_COLOR_MAP 확장 | crop-engine rev 00023-wt6 · portal rev 00503-jg6 · [COMPLETION](../../reports/2026-07/COMPLETION_20260718_iMac막내2_크롭엔진_배치복원_통합수선.md) | ✅ 민아 검증 대기 |
| 07/18 | iMac/막내2 | **보완 패치 5건** — vn headHeight 자기모순 해소(P0), T1 code 필드+크레딧 미소모 안내 4언어, bg 3언어 통일+de BG_OVERRIDE, 경고 배너 렌더링(onsite/warning/digitalOnly), jest 11/11 전량 녹색 후 배포 | portal rev 00504-pt9 · [COMPLETION](../../reports/2026-07/COMPLETION_20260718_iMac막내2_크롭엔진_보완패치.md) | ✅ 민아 재검증 대기 |
| 07/18 | iMac/막내2 | **3차 소패치 — 민아 검증 미해소+신규 3건 수정** — ① 경고 배너 V2 프래그먼트 이동(V1 죽은코드 제거) ② F7 FACE_NOT_DETECTED 코드 전층 관통(matte→server→funnel, 4언어 "얼굴을 찾을 수 없습니다") ③ F8 de-visa bg 회색 + warning es 12건 추가. jest 105/105 | portal rev 00505-xk5 | ✅ 민아 라이브 재확인 대기 |
| 07/18 | iMac/막내2 | **4차 V2 게이트 개방** — isEngineCompatibleSpec 파랑·빨강만 제외(회색 16+연회색 17슬러그 V2 개방), gray 국가 T1 비노출, SEO "흰색 배경"→"회색 배경" 48건 교정. 라이브 4건 합격 | portal rev 00506-6nc · [COMPLETION](../../reports/2026-07/COMPLETION_20260718_iMac막내2_V2게이트개방.md) | ✅ |
| 07/18 | iMac/막내2 | **5차 가드 순서 IDPASS 정합** — hairTop 새니티 캡(HAIR_VOLUME_MAX 0.15, 나노 아티팩트 방어) + 가드 순서 정합(눈→헤어→하단+축소, 헤어 재확인 삭제=하단 무효화 해소) + grayBg 판정 축소(^회색$, UK·FR T1 복구) | crop-engine rev 00025-4bw · portal rev 00507-pmq · [COMPLETION](../../reports/2026-07/COMPLETION_20260718_iMac막내2_5차_가드순서복원.md) | ✅ |
| 07/18 | iMac/쌍아 | **크롭 엔진 통합 설계 + 5차 지시서 발급 + IDPASS 삼자대조 + 납품 철학 정본화** — IDPASS CropEngine.swift vs 웹 crop.js vs crop-app 전수 분석, 배치 앵커 역전 규명, 작가님 철학 L0~L3 조문화, 25개 프레임 사이즈×faceTarget 산식 전수 추출, UK 공식 규정 실측(crown=skull), 설계서 371행, 지시서 5건(통합+보완+3차+4차+5차) | [DESIGN](../../tech/designs/2026-07/DESIGN_20260718_크롭엔진_배치복원_통합설계.md) | ✅ |
| 07/18 | iMac/쌍아 | **crop-engine min-instances=1 적용** — 콜드스타트 시 FaceMesh가 T0 전체를 감당하고 있었음 발견. InsightFace가 진짜 프로덕션 엔진이 된 첫 날. 월 ₩10,000 | crop-engine rev 00024-smw | ✅ |
| 07/18 | iMac/쌍아 | **작가님 실측 합격** — VN T1: Head 42.0mm·Eye 42.0%·Crown 4.2mm, DE T0: Head 33.0mm·Eye 43.0%, KZ T0: Eye 43.0%+배경 #D5D5D5 | prod 실측 | ✅ |
| 07/18 | iMac/막내2 | **6차 T1 재채색 + 블로그 URL 정본화** — T1 비백색국 runMatteChain 재채색(gray T1 전면 개방), 블로그 변형 슬러그(-kr/-en/-ja) 301 리다이렉트 + SEO 키 정정 | portal rev 00508-cv6 · [COMPLETION](../../reports/2026-07/COMPLETION_20260718_iMac막내2_6차_T1재채색_블로그URL.md) | ✅ |
| 07/18 | iMac/쌍아 | **세션 마감** — 오늘 총 prod 배포 8회(crop-engine 00023→00025, portal 00503→00508), 지시서 7건, 코드 파일 16개 수정. 배치 복원·폴백 삭제·FaceMesh 제거·데이터 병합·V2 게이트 개방·T1 재채색·블로그 URL 전부 완료. 후속: V1 삭제·창 캘리브레이션·33플로어 조율·블로그 잔여 | — | ✅ |
| 07/18 | iMac/민아 | **통합 검증 트랙 마감** — 앵커 역전 진범 특정·철학 §6~6-3 법제화·94슬러그/수치감사/매니페스트 3종 스캔·막내2 1~7차 재검증(F1~F8+P1 적발)·prod 실주행 4건(kz#D5D5D5·id·kw·vn T1 진단)·FaceMesh 정량 82.7/17.3·콜드부트 발견·블로그 URL 19건 301 완결(7차 직접 실행)·키미 K3 평가 | [세션로그](../../sessions/2026-07/2026-07-18_iMac_민아.md) · INCIDENT §6~6-3 · [PROPOSAL](../../proposals/PROPOSAL_20260718_민아_블로그URL정본화.md) · [COMPLETION 7차](../../reports/2026-07/COMPLETION_20260718_iMac민아_7차_블로그en변형_재채색주석.md) | ✅ prod 00509 |
| 07/19 | iMac/민아 | **스포크 ① 검증 게이트 — 반려(P0)** — 라이브 실주행으로 개방 6페이지 전원 퍼널 사망 실증: specs-funnel.js:520 `ip-t1-buy` 무조건 바인딩이 유색(T1 카드 제거) 페이지에서 초기 평가 크래시 → 업로드 무반응(V1 데드 UI 증상 재현). kr 대조군 정상으로 유색 한정 회귀 증명. +P1 2건(isV2Spec 사문화→cn-resume 무규격 출고 경로, om 교정 미배포) +P2 2건. jest 105 재확인·A1/A5/서빙은 합격 | [REPORT 반려](../../reports/2026-07/REPORT_20260719_iMac민아_V1소각_검증게이트_반려.md) | ❌ 재수정 대기 |
| 07/19 | iMac/민아 | **스포크 ① 재검증 — 통과, 스포크 종결** — prod 00512 실주행: kw-visa 업로드→T0 생성 완주, 결과 472×591(4×5cm@300dpi 정확)+4모서리 #438edb(규정 파랑 일치), 무료쿼터 차감 정상. id 진행성·om 흰색 교정 반영+T1 노출 전환·cn-resume 404(sitemap 무충돌)·isV2Spec 재배선·jest 105 전 항목 녹색. 잔여: ④ A2 우선순위 상향 권고, P2 주석 2건 | [REPORT 통과](../../reports/2026-07/REPORT_20260719_iMac민아_V1소각_재검증_통과.md) | ✅ V1 시대 종료 |
| 07/19 | iMac/민아 | **스포크 ③④ 검증 — 통과, 오늘 스포크 전량 종결** — ④ rev 00513 실측: usa-headshot CTA 전환·cn 1寸/2寸 분리(grade B 유지·총영사관 근거·canonical 위임·sitemap 1716=429×4 정합)·2cun 퍼널 실주행 OK. ③ 대조: C1 정합(독립 재스캔 429 탈락 0), C2 재해석(도해 층위 흰배경 잔존→⑤ B2 이관), **C4 om-passport 4건 누락 보정(16→20건)**. jest 105. 방법론 정정 1건(sitemap 하위 파일 기준) 기록 | [REPORT ③④](../../reports/2026-07/REPORT_20260719_iMac민아_스포크34_검증게이트_통과.md) | ✅ 429 전량 V2 |
| 07/19 | iMac/쌍아 | **V1 소각 스포크 ①~④ 전량 종결 + GSC 색인 정비** — 지시서 7건 발행(V1 소각·kw/om 검증·P0 핫픽스·전수조사·usa-headshot/cn-resume·CDP 재시도·블로그404 분류). sitemap 총합본 제거 직접수정. GSC 404 127건 분류(블로그 잔해=404 유지 정답, 소스링크 3건 교정·배포). C4 재색인 20건(id-passport 요청). kw-visa 흰색 확정·om 흰색 확정(visa만 미확정). guide/ai-photo 9위 현황 파악 | 지시서 7건 + 직접수정 1건 | ✅ 429 V2 완성 |
| 07/19 | iMac/민아 | **guide 보강+동남아 1단계 검증 — 통과(P1 보완 1)** — id/vi 4 URL 현지어 타이틀=실측 롱테일 정조준·인니어 퍼널 실주행 fit 도달(UI 전면 현지어)·hreflang 6언어·EN kr-visa 메타 quick win 번들·프로그램matic 전 슬러그 확장·guide 3언어 429 반영·jest 105. **P1: id/vi 사이트맵 공백**(총합본에만 실렸는데 총합본은 금일 해제 — 언어별 2종 신설+GSC 등록 필요, 다음 배포 전 필수) + P2 typeName 영문 혼입 | [REPORT 검증](../../reports/2026-07/REPORT_20260719_iMac민아_guide보강_동남아1단계_검증.md) | ✅ P1 대기 |
| 07/20 | iMac/쌍아 | **도해 생성기 v5 실물 검증** — GCS tools/gen_brand_diagrams_v5.mjs(7/11 민아, 레포 밖 보관) 실행 확인: kr-passport_ko.webp 라이브 동일(55,128 vs 55,098 bytes, 시각적 일치). 베이스 확정. 5/20 generate-guide-images.js는 구버전 폐기 대상. 남은 갭: ① 인물 팩 교체 파이프라인(crop-engine 랜드마크 → 좌표 자동 산출) ② 레포 편입+경로 파라미터화. 지시서 1건감 | v5 테스트 결과 | ⏳ 지시서 대기 |
| 07/20 | iMac/막내3 | **도해 생성기 v5 레포 편입 완료** — GCS 2종(v5+ref) → `portal/tools/specs-diagrams/` 편입, 절대경로 4곳 파라미터화(sharp 상대경로·SP/MASTER 환경변수·PORTAL import.meta.dirname), README 작성, 스모크 kr-passport 3장 바이트 동일 확인, references.md 도구 맵 갱신(v5 확정+ref 등재). 도구 3요건(인지·스모크·실패가시화) 1호 | [COMPLETION](../../reports/2026-07/COMPLETION_20260720_iMac막내3_도해v5_레포편입.md) | ✅ |
| 07/21 | M1/민아 | **7/15 M1 잔재 정리 — 아카이브 누락 1행 복원 + EUEU 잔존 확인** — README 미커밋 +51행 전수 대조: 50행 ARCHIVE_HISTORY 기보존, 유일 미보존 1행(7/15 민아 게이트 판정)을 아카이브 시열 위치에 복원. 부수 실측: eu-passport·eu-resume typeJa 국명 내재 미수정(ja "EUEU" 중복 라이브 잔존) — 마이크로 수정 대상 유지. 7/15 세션로그 2건 지연 커밋 동승 | ARCHIVE_HISTORY.md 보정 | ✅ |
| 07/21 | M1/민아 | **EUEU 국명 중복 수정 완결 (경로③ 작가님 지시)** — 진단 3층: FAQ 저장 문자열(ko "EU EU"+구버전 영문타입 잔존·ja "EUのEU", 20지점) + 렌더 조합 중복(JSON-LD name·H1·브레드크럼 = countryJa+typeJa) → 근본 = typeJa 국명 내재(428슬러그 중 eu 2건만, 컨벤션 위반 전수 스캔 확정). 데이터 2단 정정(FAQ 20지점 + typeJa 2건), 전후 렌더 diff 부수 변경 0(변경 지점 = 예상 4곳/페이지), seoTitle·정정 FAQ 보존 확인. dev 00157 게이트 → prod 00524 배포, 4URL 실측 중복 0·H1 정상 | 2bd6ed5b·f08daa7f, prod 00524-dnq | ✅ 라이브 |
| 07/22 | iMac/쌍아 | **SSR 홈 OfferCatalog 429개 + @graph 구조화 데이터 통합** — 구 index.html 사문화 판정(민아)으로 홈 OfferCatalog 부재 발견. home.js에 SPECS_DATA 전량 429개를 locField 정본 경유 동적 생성. Organization·ProfessionalService 이관, @id 상호참조 배선, EU ko type/seoTitle/seoDescription "유럽연합 EU" 중복 6건 해소. portal 00530-crz | 23e1cd3d, prod 00530-crz | ✅ 라이브 |
| 07/23 | iMac/쌍아 | **SSG 전환 + IDPASS 쉘 + 점진 이관 설계** — 작가님 결정: 전량 일괄 전환 아닌 필름 완성분부터 점진 이관(등사기·필름 비유). 4060 인쇄기 세팅 + CF Pages IDPASS 호스팅 + SSR 공존 구간. 민아 시타델 분석(인텐트 분할·/specs허브 301·네비 개편) 통합. 결제·인증 모듈 결합도 실측(*.monkos.ai 내 무변경 동작 확인). Phase 0~7 로드맵 | [DESIGN](../../tech/designs/2026-07/DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md) | ⏳ 작가님 검수 |
| 07/23 | iMac/민아 | **SSG 설계 검수 — 조건부 승인** — 승계 정합 ✓(크리티컬 2·게이트·429×6 실측 일치), 교정 필수 2(🔴 R1 dist 레이아웃=URL 정본 위반+트레일링 슬래시 308 → flat .html+specsUrl() 도출 / 🟠 R2 B안 실체=apex orange 전 트래픽 경유 → 웹훅 WAF 예외+run.app 오리진), ✅ R3 NS 기이관 실측(edna/bob.ns.cloudflare.com — 게이트3 축소), 승계 누락 3 복원(billing 기준선·/result 보존·핫픽스 부분 재빌드), 보강 5(쉘 SSR 선적용·Phase4 분할·토큰 스코프·301 쌍방·LCP<2.5s 게이트) | [REVIEW](../../reports/2026-07/REVIEW_20260723_iMac민아_SPECS_SSG설계_검수.md) | ✅ 반영 대기 |
| 07/23 | iMac/민아 | **SSG 설계 v2 재검증 — 검수 11건 전항 반영 확인, 확정 승인** — R1(flat .html·specsUrl 도출·자산 포함 §5-2), R2(게이트4 재작성: apex orange 함의 3건·run.app 오리진·전환 시점 Phase 3 직전), R3(게이트3 NS 기이관 현행화+웹훅 URL 소재 확인 추가), 승계 3건(billing Phase 0·/result 보존 §4-3·--slug 부분 재빌드 §5-3), R4~R8(쉘 CR 선배포 필수 §4-2·Phase 4a/4b 분할·토큰 최소 스코프·게이트5 신설·LCP<2.5s+폰트 self-host). --slug 인자=데이터 키(kr-passport) 용법 정합 확인. 지시서 발행 단계 진입 | v2 전문 diff 실측 | ✅ 설계 확정 |
| 07/23 | iMac/막내2 | **Phase 4a — 네비 제품 승격 + 히어로 CTA → /specs** — 히어로 CTA kr/jp 외부도메인 분기 제거→`${prefix}/specs` 단일, 도메인 라벨(`idphoto.monkos.ai`) 삭제, 네비 제품 승격(ID Photo·Headshot 앞으로, FAQ·Gallery·Board 제거), 푸터 정합 확인 | [COMPLETION](../../reports/2026-07/COMPLETION_20260723_iMac막내2_SPECS_Phase4a_네비CTA개편.md) | ✅ |
| 07/23 | iMac/막내3 | **Phase 0 — CF Pages 세팅 + Workers 프록시 PoC + DNS 인벤토리** — monkos-ai Pages 프로젝트 기존재 확인, Direct Upload 테스트 배포 성공(.pages.dev 서빙 확인). Workers 프록시 작성(functions/cf-proxy/worker.js) — 정적 경로→Pages, 나머지→CR origin 프록시+IP 포워딩(X-Real-IP). E2E: specs 정적 200 OK + API 프록시 401 정확 CR 응답. DNS 인벤토리 8레코드+CR 11서비스+웹훅 라우트 11건. SPA 폴백 이슈 발견→경로 화이트리스트 해결. R1 308 리다이렉트 실증 | [COMPLETION](../../reports/2026-07/COMPLETION_20260723_iMac막내3_SPECS_Phase0_CF세팅_Workers.md) | ✅ |

---

## 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 자동 생성 페이지 품질 부족 → 구글 thin content 판정 | 중 | Tier 1~2 풀 콘텐츠 우선, Tier 3은 규격 테이블+자동 설명으로 최소 품질 확보 |
| 9개 언어 번역 품질 | 중 | Tier 1은 수동 검수, Tier 2~3은 AI 번역 + 네이티브 스팟 체크 |
| 4,761 URL sitemap 처리 부담 | 낮 | sitemap index 분할 (언어별 sitemap) |
| 기존 26건 URL slug 변경 시 SEO 손실 | 중 | 301 리다이렉트 + slug alias 유지 |
| countries.jsonl 변경 시 specs 페이지 정합성 깨짐 | 중 | 빌드 시점 검증 스크립트 (필수 필드 체크) |
