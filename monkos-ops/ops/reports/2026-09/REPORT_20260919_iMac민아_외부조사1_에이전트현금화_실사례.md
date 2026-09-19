---
type: report
date: 2026-09-19
device: iMac
agent: 민아
status: 마감
subject: "REPORT_20260919_iMac민아_외부조사1_에이전트현금화_실사례"
note: "리서치 서브에이전트 산출 원문 보존 (민아 미검증 — 수치는 본문 등급·출처 표기 참조)"
---

# 2025–2026년, 1–3인 운영자가 AI·자동화로 반복 현금을 만든 실증 사례 조사

**[2026-09-19 12:25 KST]** iMac/리서치 서브에이전트 → 호출 에이전트 (작가님 전달용)

**결론 세 줄**
- 세 필터(기존 수요, 자동 결제·납품 레일, 출처 있는 매출)를 모두 통과하면서 사람 노동이 0에 가까운 월 $3,000 이상 사례는, 실제로는 2–6년 숙성된 제품이거나 포트폴리오에서 살아남은 1–2개입니다.
- AI 에이전트가 줄인 것은 제작비입니다. 유통비는 줄지 않았습니다.
- 통과 사례는 모두 구매 의도가 이미 있는 검색면(앱스토어 검색, 마켓플레이스 검색, 구글 구매형 키워드, 토스 트래픽)에 올라탄 경우였습니다.

**수치 신뢰도 등급**
- **A**: 결제사 연동 검증(TrustMRR/RevenueCat 연동) 또는 플랫폼 공식 집계
- **B**: 창업자가 수년간 일관되게 공개한 수치. 하락분도 공개한 경우 포함
- **C**: 단발 인터뷰의 자기 신고, 2차 매체 요약
- **D**: 검증 불가 바이럴

**조사 한계**
- 대부분 검색 요약과 기사 페이지를 읽은 것이고, X 원문이나 대시보드는 직접 열람하지 못했습니다.
- Medium의 "8 Solo Founders" 글은 403으로 읽지 못해 제외했습니다.

---

## 1. 앱스토어 유틸리티 앱 (공급 채널: 스토어 검색/ASO, 결제: 애플·구글 IAP)

### 사례 1. HabitKit — Sebastian Röhl (독일, 1인)
- **무엇을 누구에게**: 습관 트래커 앱을 일반 소비자에게 판매합니다. iOS 월 $2, Android 월 $1, 평생 $32입니다.
- **채널**: 거의 전부 ASO입니다. 2025년 중반 미국 App Store "habit tracker" 키워드 상위 5위에 진입했고, 1월 신년결심 시즌 효과가 큽니다.
- **매출** (등급 B+):
  - 2025년 연 매출 $602K, 2025-12 기준 MRR $28K, 유료 구독자 25,100명, 2025년 1월 한 달 매출 $112K입니다.
  - 출처는 본인 Substack 연간 결산과 RevenueCat 공식 팟캐스트 출연입니다.
  - 그는 수년간 주간 로그로 수치를 공개해 왔습니다. 2024-06 주간 로그에는 월 매출 $13,605, MRR $6,981이 기록돼 있어 시계열이 일관됩니다.
- **자동화**: 백엔드와 DB가 없고 로컬 저장만 씁니다. 결제는 RevenueCat, 코딩 보조는 Cursor입니다. 운영비가 사실상 0입니다.
- **남은 인간 노동**: 풀타임 개발과 리뷰 대응입니다. 노동 0이 아닙니다.
- **첫 매출까지**: 2022-11 출시 당일 $150이었고, $10K MRR까지 약 2.5년이 걸렸습니다.
- **구조적 우위**: 기존에 지불되던 카테고리, 서버 비용 0, 검색 순위 선점입니다. 다만 후속작 FocusKit은 출시 후 누적 $874에 그쳤습니다. 같은 사람이 같은 방식으로 만들어도 재현되지 않습니다.
- URL: https://sebastianroehl.substack.com/p/2025-the-year-that-changed-everything / https://www.revenuecat.com/blog/growth/sebastian-rohl-habitkit-launched-podcast-2026 / https://www.buildmvpfast.com/blog/602k-revenue-solo-indie-hacker-app-portfolio-breakdown-2026

### 사례 2. Adam Lyttle — iOS 소형 앱 포트폴리오 50개 이상 (호주, 1인)
- **무엇**: 단기능 유틸 앱들입니다. 주간 구독 $4.99–7.99, 연 $29.99 수준입니다.
- **채널**: ASO 중심이고 유료 광고 언급은 없습니다.
- **매출** (등급 B-):
  - 월 약 $50K, App Store 누적 매출은 2025-06 $800K, 2025-08 $1M에 도달했습니다.
  - 페이월 교체만으로 월 $10K에서 $50K로 올랐다고 밝혔습니다.
  - 출처는 본인 X 게시물과 Starter Story입니다.
  - 그는 앱 개발 유튜버이기도 해서 수치를 부풀릴 유인이 있습니다.
- **자동화**: ChatGPT로 한 달에 앱 9개를 제작했습니다.
- **남은 노동**: 신작 출시, ASO, 페이월 실험입니다.
- **우위**: 대량 출시 후 선별하는 방식입니다. 본인 표현으로 "대부분의 앱은 아무 데도 가지 못했다"고 합니다.
- URL: https://x.com/adamlyttleapps/status/1929733455728034074 / https://www.starterstory.com/adam-lyttle-apps-breakdown / https://www.onemilliongoal.com/p/adam-lyttle-the-man-who-builds-silly

### 사례 3. 김윤후 — 간단(간헐적 단식)·오늘의 운동·테이크 (한국, 직장 병행 1인)
- **무엇**: 글로벌 누적 약 200만 다운로드 앱입니다. 구독료는 월 ₩2,500, 연 ₩7,500이고 광고와 제휴 수익이 더해집니다.
- **채널**: ASO와 사용자 공유를 통한 바이럴입니다.
- **매출** (등급 C): 일 20–40만원, 월 환산 600–1,200만원입니다. 2025-06 뉴스레터 인터뷰의 자기 신고이며, 패스트캠퍼스 강의 판매자이기도 해서 이해관계를 감안해야 합니다.
- **자동화**: 카카오 채널 FAQ 챗봇으로 CS 문의가 하루 1–2건입니다.
- **남은 노동**: 퇴근 후 취침 전까지 개발합니다. 노동 0이 아닙니다.
- **첫 매출**: 첫 앱의 AdMob 수익 $1.04에서 시작해 현재 수준까지 약 6년이 걸렸습니다.
- URL: https://maily.so/josh/posts/1gz2v974r3q / https://fastcampus.co.kr/story_article_indiehacker

### 참고(기간 외): 케빈
- 앱 3,000개를 만들어 AdMob으로 연 100억원(2020년 정점)을 벌었다는 인터뷰입니다.
- 쉘 스크립트와 Fastlane으로 하루 5개를 찍어냈다고 합니다.
- 등급 C이고, AI 이전 시대이며 프리랜서를 고용했습니다.
- "대량 자동 출고" 구조의 원형이라는 의미만 있습니다.
- URL: https://maily.so/josh/posts/xyowmnv8z28

---

## 2. 플랫폼 미니앱 — 앱인토스 (공급 채널: 토스 3,000만 유저, 결제: 토스 인앱결제·인앱광고)

**플랫폼 집계** (토스 공식 발표, 2026-08-14, 등급 A-. 단 PR 자료입니다)
- 미니앱 수는 2025-07 출시, 2026-02 1,000개, 2026-06 5,000개, 2026-08 1만 개입니다.
- 월 이용자는 약 400만 명입니다.
- 파트너의 67%가 1인 메이커입니다.
- 계정 기준 63%에서 "매출 발생"이 있었습니다. 첫 매출 ₩700짜리도 포함되는 기준이므로 이 수치에 의미를 두기 어렵습니다.
- 복수 카테고리에서 미니앱 10여 개를 운영하며 월 10억원에 가까운 매출을 내는 1인 메이커가 있다고 하나, 익명이라 검증할 수 없습니다.
- URL: https://www.insight.co.kr/news/568211 / https://www.hankyung.com/article/2026081425011

### 사례 4. 박효준 — '인스타 언팔한 사람 찾기'
- **매출** (등급 B-): 하루 최대 150만원입니다. 토스 공식 웨비나 공지와 한국경제 보도에 나옵니다.
- **수익화**: 결제 전환, 구독, 재방문 리마인더, 자동 문의 처리입니다.
- **제작**: AI와의 대화만으로 코드를 작성했습니다.
- **주의**: 제작자가 토스 iOS 개발자, 즉 내부자입니다. 150만원은 "최대" 일매출이지 평균이 아닙니다.
- URL: https://techchat-apps-in-toss.toss.im/t/150-8-20-8/4508

### 사례 5. 익명 1인 개발자 — 한 달에 미니앱 5개, 월 매출 2,500만원
- 토스피드 2026-02 공식 글이 출처입니다. 등급 B-이며 익명이고 플랫폼 홍보 목적의 글입니다.
- 같은 글에 나오는 마나바바 '돌돌디' 월 2.1억원은 1인이 아니라 법인입니다.
- URL: https://toss.im/tossfeed/article/45493

### 사례 6. 기열(groundcode.io) — 10년차 프론트엔드 개발자, 창업 3개월차
- **매출** (등급 B-): 앱 4개가 실패한 뒤 5번째 앱에서 일 ₩5천이 일 ₩10만(월 약 300만원)으로 올랐습니다. 앱인토스 공식 파트너 스토리(2026-05)가 출처입니다.
- 목표선인 월 ₩400만에는 아직 못 미칩니다.
- URL: https://techchat-apps-in-toss.toss.im/t/topic/3794

### 필터 3 미달 참고: 로빈
- 비개발자이고 7주 만에 미니앱 21개를 출시했습니다.
- 도구는 Lovable, Claude Code, Supabase MCP입니다.
- 첫 매출은 ₩700이고 월 매출은 공개하지 않았습니다.
- 본인 진술로 "아이디어 10개 중 생존 1개"입니다.
- 매출 사례가 아니라 적중률 증거로만 의미가 있습니다.
- URL: https://toss.im/apps-in-toss/blog/robin-26-3-13

### 필터 1에 대한 주의
- 앱인토스 수익의 상당 부분은 광고와 포인트 프로모션입니다. "구매자가 이미 돈을 내던 시장"이라기보다 토스가 트래픽과 광고주를 빌려주는 구조입니다.
- 심사 기준이 2026년에 강화됐고, 3월과 7월에 미니앱이 중단된 사례가 있습니다.
- URL: https://www.e-science.co.kr/news/articleView.html?idxno=135499

---

## 3. 마켓플레이스 데이터·앱 상품 (Apify / Shopify / Chrome 웹스토어)

### 사례 7. Apify Store — 스크레이퍼("Actor") 실행당 과금
- **무엇을 누구에게**: 특정 사이트 데이터 추출기를 개발자, 그로스팀, AI 에이전트 사용자에게 팝니다. 구매자는 이미 스크레이핑 SaaS에 돈을 쓰던 층입니다.
- **레일**: Apify가 결제·과금·호스팅·정산을 모두 맡습니다. 개발자 몫은 80%이고 매월 자동 정산됩니다.
- **매출** (플랫폼 공식, 등급 A-. 개별 개발자 명단은 비공개):
  - 개발자 지급 총액은 2025-09 월 $563K에서 2026-08 월 $1.5M으로 늘었습니다.
  - Apify는 상위 개인이 월 $10K 이상을 번다고 밝혔습니다.
- **제3자 실측** (dev.to, 상위 900개 Actor 분석, 등급 B):
  - 월 $1,000을 넘는 Actor는 35개, $500을 넘는 것은 62개, 중앙값은 월 $14입니다.
  - Apify 계열 5개 계정이 매출의 44%를 차지합니다.
  - 1,000건당 $15를 넘는 고가 Actor의 중앙값은 $111, $1 미만 저가는 $5입니다.
  - 트래픽이 1/7이어도 고가 티어 합계가 최저가 티어의 약 7배입니다.
- **남은 노동** (Olivier Reynaud, Actor 98개 운영자, Apify 공식 블로그):
  - 주 15–20시간입니다. 유지보수 5–7시간, 지원 3–4시간, 모니터링 2–3시간 등입니다.
  - 매출은 본인이 비공개로 했습니다.
- **첫 매출까지**: 1–2주, 의미 있는 금액은 3–4개월차입니다.
- **우위**: 기존 SaaS(월 $50–500)를 대체하는 고가 포지셔닝이 통합니다. 저가로 물량을 노리면 실패합니다.
- **플랫폼 리스크**: 렌털 과금 모델을 2026-10-01에 폐지합니다.
- URL: https://apify.com/partners/actor-developers / https://dev.to/nikita_iakovlev_415524c19/i-measured-900-apify-actors-and-got-the-price-wrong-by-100x-heres-the-corrected-data-3418 / https://blog.apify.com/building-98-actors-on-apify-store/ / https://agentbyline.com/articles/apify-actor-passive-income-what-really-earns-in-2026-67lcfr

### 사례 8. RotateProduct — Lorik Morina (1인, Shopify 앱)
- **무엇**: 상품 사진을 회전 3D 영상으로 바꿔주는 앱을 Shopify 상점주에게 팝니다. Shopify 앱은 영상 건당 과금이고 웹은 구독입니다.
- **채널**: Shopify App Store 검색이 주력이고 Meta 광고(일 $20), 추천 프로그램, 롱테일 SEO를 더했습니다.
- **매출** (등급 B-): 2026-05 기준 MRR $6.5K입니다. 주간 공개 리포트에서 21주차 $6,772 중 앱이 $6,512였습니다.
- **첫 매출**: 14일 만에 $100 MRR입니다.
- **남은 노동**: 광고 관리, CS, 개발입니다.
- **구조**: Shopify는 평생 매출 $1M까지 수수료 0%입니다. 다만 약 18,000개 앱의 다수가 월 $1K 미만이고 대부분 12개월 내 방치됩니다.
- URL: https://startupfounderstories.com/stories/lorik-morina-rotateproduct-6k-mrr-shopify-ai-videos / https://weekonelabs.com/blog/shopify-app-revenue-benchmarks-2026/

### 사례 9. Easy Folders — Edmund Yong (1인, Chrome 확장)
- ChatGPT와 Claude 대화를 폴더로 정리해주는 확장입니다.
- 출시 6개월 만에 MRR $3.7K, 누적 $42K를 기록했습니다(2024-08).
- Indie Hackers 자기 신고이고 Stripe 검증 배지가 없어 등급 C+입니다.
- 유지 노동은 최소이고 주 비용은 메일 발송비입니다.
- 조사 기간보다 약간 앞선 사례이고 현재 수치는 확인하지 못했습니다.
- URL: https://www.indiehackers.com/product/easy-folders/6-months-post-launch-my-chrome-extension-has-hit-3-700-in-mrr-and-42-000-in-total-revenue--O3qs28VAnAkcJw0j--M

### 템플릿·전자책 마켓 (Framer / 크몽 / 스마트스토어): 통과 사례 없음
- **Framer**: 상위 크리에이터가 월 $10K 이상을 번다는 주장은 Framer 홍보 페이지와 가이드 글이 출처입니다.
- **크몽**: 검색 결과의 대다수가 "AI 자동수익 전자책을 파는 법을 파는" 메타 판매라 제외 기준에 해당합니다.
- **스마트스토어**: 2026-06부터 판매 실적에 따른 상품 등록 한도가 생겼고, 2026-07-10부터 AI 생성물 표시 정책이 강화돼 대량 등록형 자동화에는 역풍입니다.
- URL: https://www.framer.com/creators / https://sehacompany.onch3.co.kr/bbs_view.php?num=13&vnum=16026

---

## 4. API·개발자 도구 (결제: Stripe 사용량 과금, 납품: API 자체)

### 사례 10. ScreenshotOne — Dmytro Krasun (1인, 직원 0)
- **무엇**: URL을 넣으면 스크린샷 이미지를 돌려주는 API를 개발자와 SaaS에 팝니다. 기존 유료 경쟁자가 많은, 수요가 이미 있는 시장입니다.
- **매출** (등급 B+):
  - 2026-07 기준 MRR $32K, 유료 고객 1,000명 이상, 누적 1억 건 이상의 요청을 처리했습니다.
  - 출처는 Indie Hackers 공개 매출 페이지와 WP Engine 창업자 Jason Cohen의 공개 라이브 분석입니다.
- **시간**:
  - 2022-05 출시.
  - 2022-07 첫 달 매출 $7.
  - 2025년 중반 $20K.
  - 2026년 $32K.
  - $10K MRR 도달까지 약 4년(Startup Founder Stories 제목 기준)이 걸렸습니다.
- **정체 원인** (가장 중요한 교훈):
  - 월 매출 이탈률이 9%이고 신규 MRR이 약 $3K입니다.
  - 그래서 상한이 $33K로 수학적으로 고정됩니다(Max MRR = 신규 MRR ÷ 이탈률).
  - 고객 다수가 일시적 프로젝트용으로 써서 고잔존 세그먼트가 없습니다.
- **남은 노동**: 지원과 SDK·CLI·MCP 서버 개발입니다.
- URL: https://superframeworks.com/case-study/screenshotone / https://www.indiehackers.com/product/screenshotone-the-best-screenshot-api/revenue

### 사례 11. DevUtils — Tony Dinh (1인 시절 제품, macOS 개발자 툴박스, 1회 결제)
- 2025년 기준 월 약 $8K를 "오토파일럿"으로 벌고 있습니다.
- 등급은 C+이고, 본인 뉴스레터를 2차 매체가 요약한 수치입니다.
- 이번 조사에서 "진짜 저노동"에 가장 가까운 사례이지만, 숙성 기간이 수년입니다.
- 같은 창업자의 TypingMind는 월 $130–160K이지만 2025-04에 팀원 2명을 영입했고 B2B 팀 플랜이 매출의 절반을 넘어 조건에서 벗어납니다.
- URL: https://www.onemilliongoal.com/p/tony-dinh-the-vietnamese-developer / https://x.com/tdinh_me/status/1908345028327727335

### 니어미스: Capgo
- Capacitor 앱 라이브 업데이트 서비스이고 MS CodePush 종료로 생긴 수요를 흡수했습니다.
- MRR $30.4K, 구독 1,093건이 TrustMRR로 결제 검증돼 등급 A입니다.
- 다만 팀이 2–5명이라 "1인·저노동" 조건에는 맞지 않습니다.
- "기존 제품의 종료나 가격 인상이 만든 빈자리"라는 구조의 증거로는 가장 강합니다.
- URL: https://trustmrr.com/startup/capgo

---

## 5. 검색 의도형 웹 도구 + 페이월/1회 결제 (프로그래매틱 SEO)

### 사례 12. HeadshotPro — Danny Postma (1인, 발리)
- **무엇**: 셀카를 기업용 프로필 사진으로 바꿔줍니다. 1회 결제 팩 $29, $39, $59이며 구독은 의도적으로 배제했습니다.
- **채널**: "professional headshots" 키워드와 도시별 템플릿 페이지(프로그래매틱 SEO), 그리고 제휴입니다. 제휴만으로 월 $50K 이상이고 매출의 15% 이상을 차지합니다(Rewardful 사례 연구).
- **매출** (등급 C+): 월 약 $300K 추정입니다. 본인이 차트를 공개했지만 감사받은 수치가 아닙니다. 제휴 지급액을 역산하면 $330K 이상으로 정합하긴 합니다.
- **첫 매출**: 출시 2주 만에 $100K입니다. X 팔로워 9.5만 명이 초기 백링크를 줬기 때문에 필터 1의 "청중 불필요" 조건을 엄밀히는 위반합니다.
- **우위**: 본인 표현대로 "약속을 지루해질 때까지 좁혔다"는 점입니다. 아바타 놀이에서 업무용 증명사진이라는 기존 지출 항목으로 옮겼습니다.
- URL: https://aituts.com/case-study/headshotpro-danny-postma/ / https://www.rewardful.com/case-studies/headshotpro

### 사례 13. PhotoAI — Pieter Levels (1인)
- **매출 추이** (등급 B, X 프로필에 상시 공개하며 하락분도 그대로 공개):
  - 2025-09 최고치 월 $150K
  - 2025-11 $132–138K
  - 2026년 중반 $100–105K
  - 2026-08 $89K
- 이익률은 76–87%이고 활성 구독자는 약 2,573명입니다.
- **자동화**: PHP 단일 파일 40,870줄, 서버 1대입니다. Claude Code가 프로덕션에 직접 배포하고, 구문 오류가 그대로 배포된 사고도 공개했습니다.
- **주의**: 구매자 공급의 근원이 본인의 70만 명대 팔로워라 필터 1을 통과하지 못합니다. "1인 + 에이전트 코딩으로 월 $100K 운영이 가능하다"는 증거로만 의미가 있습니다. 또한 11개월간 약 40% 하락 중입니다.
- **실패 짝**: 같은 사람의 fly.pieter.com은 17일 만에 MRR $87K를 찍었지만 2026년 중반 $0이 됐습니다. 수익이 광고 슬롯과 스폰서였기 때문입니다. 반복 매출 기준으로는 실패입니다.
- URL: https://inspectural.com/blog/levelsio-photoai-single-file-php/ / https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l

### 사례 14. ResumeMaker.online — Fernando Pessagno (1인, 2018년부터)
- 이력서 빌더입니다. 2024-01 구독 전환 후 MRR 약 $3.5K, 마진 95% 이상입니다.
- 채널은 SEO이고 "resumemaker" 키워드 1위입니다.
- 자매 제품 aiCarousels는 10일 만에 제작했고 8개월 만에 MRR 약 $5K입니다.
- 두 제품을 포함한 합산이 월 약 $15K로 보도됐습니다.
- 등급 C+입니다(BoringCashCow, Outseta 인터뷰).
- 저노동·소액·장기 숙성의 전형입니다.
- URL: https://boringcashcow.com/view/solo-resume-builder-business-generates-3500-in-monthly-revenue / https://www.outseta.com/posts/10-days-to-5k-with-ai

### 사례 15. Samuel Rondot — StoryShort.ai·UseArtemis (전직 검안사, 1인)
- StoryShort(AI 숏폼 자동 생성)가 월 $20K, UseArtemis(링크드인 스크레이핑)가 월 $15K입니다.
- 운영비는 각각 월 $4–5K입니다.
- 등급 C+입니다(Starter Story 계열 인터뷰, 2025-08).
- 채널은 페이스북 광고, 제휴, SEO입니다.
- 남은 노동은 광고와 그로스입니다.
- "성공한 앱을 복제한다"는 전략이라, 수요는 이미 검증됐지만 광고비로 유통을 사는 구조입니다.
- URL: https://maily.so/josh/posts/5xrx6lnqr2v

---

## 6. 결제 검증은 됐지만 팀 규모를 알 수 없는 참고 사례 (TrustMRR, 등급 A)

- **Project A (AI 점술·운세 앱)**:
  - 최근 30일 $82.8K, MRR $61.6K입니다(RevenueCat 연동 검증).
  - 마진 51%, 누적 5,000만 다운로드, $5M에 매각 매물로 나와 있습니다.
  - 팀 규모를 확인하지 못해 본 목록에서는 제외했습니다.
  - 관상·운세 카테고리의 글로벌 지불 의사를 보여주는 증거로는 가치가 있습니다.
  - URL: https://trustmrr.com/startup/project-a
- **Khosmos** (프랑스 건설 기능공용 인보이스 앱): MRR $23K입니다. 언어·규제에 묶인 로컬 B2B 니치의 증거입니다. https://trustmrr.com/category/mobile-apps
- **한국 AI 운세 '사주핑'**: 3개월 누적 매출 1,000만원(보도자료)입니다. 법인이고 소액이라 제외했습니다. https://www.aitimes.com/news/articleView.html?idxno=207092

### 의도적으로 제외한 것 (신뢰하면 안 되는 유형의 예)
- "30세 개발자, 마이크로 SaaS 35개로 월 $77K"는 출처가 @ridark_eth의 트윗 하나뿐입니다. 제품명·대시보드·검증이 전혀 없어 등급 D입니다.
- 이것을 재가공한 블로그가 여러 개 유통되고 있습니다.
- URL: https://www.buildmvpfast.com/blog/solo-developer-35-micro-saas-apps-77k-month-portfolio-2026

---

## 7. 월 $3,000 / ₩400만 이상 도달 사례의 공통 구조

1. **수요를 빌려왔습니다.**
   - 구매 의도가 실린 검색면에 올라탔습니다. 스토어 키워드, 마켓플레이스 검색, 구글 "professional headshots", 토스 트래픽 등입니다.
   - 청중부터 쌓은 사례는 Levels와 Postma뿐이고 둘은 기존 팔로워가 있었습니다.
   - 청중 없이 도달한 사례(HabitKit, ScreenshotOne, Lyttle, Apify 상위, RotateProduct)는 전부 검색형입니다.
2. **이미 예산이 있는 지루한 과업을 골랐습니다.**
   - 습관 기록, 스크린샷, 이력서, 업무용 프로필 사진, 특정 사이트 스크레이핑 같은 것입니다.
   - 새 카테고리를 교육해서 연 사례는 없습니다.
3. **포트폴리오를 만들고 도태시켰습니다.**
   - Lyttle은 50개 이상을 냈고 "대부분 무소득"이었습니다.
   - 기열은 5번째 앱에서, 로빈은 10개 중 1개가 살아남았습니다.
   - 토스의 월 2,500만원은 앱 5개, 월 10억원은 10여 개에서 나왔습니다.
   - 적중률은 대략 10% 안팎입니다.
   - AI가 바꾼 것은 시도 1회의 비용입니다. 2–4주에서 1–3일로 줄었습니다.
4. **한계비용이 0에 가깝습니다.**
   - 백엔드 없는 구조(HabitKit), 서버 1대(PhotoAI)가 예입니다.
   - TrustMRR의 솔로 표본에서 마진 중앙값이 81%입니다.
   - 생성형 API 원가가 큰 제품(StoryShort)은 마진이 눈에 띄게 낮습니다.
5. **가격은 구매 행동에 맞췄습니다.**
   - 일회성 필요에는 1회 결제 팩(HeadshotPro), 반복 사용에는 초저가 구독($1–2, HabitKit), 단기 유틸에는 하드 페이월 주간 구독(Lyttle)을 썼습니다.
   - RevenueCat 2026 집계에서 35일차 전환율 중앙값은 하드 페이월 10.7%, 프리미엄 2.1%입니다.
   - Lyttle은 페이월 교체만으로 $10K에서 $50K가 됐습니다.
6. **첫 매출은 빠르지만 $3K는 느립니다.**
   - 마켓플레이스형은 첫 매출이 3일–2주 안에 나옵니다.
   - $3K 이상은 6–30개월이 걸립니다(HabitKit 2.5년, ScreenshotOne 4년).
   - TrustMRR 평균으로 "첫 $1"까지 5개월입니다.
7. **"설정 후 인간 노동 거의 0"은 대체로 성립하지 않습니다.**
   - 검증된 노동량은 Apify 98개 운영자가 주 15–20시간, Röhl과 김윤후는 사실상 풀타임입니다.
   - 노동이 실제로 낮은 사례(DevUtils 약 $8K, ResumeMaker 약 $3.5K)는 소액이고 수년간 숙성됐습니다.
   - 방치하면 PhotoAI처럼 연 40%씩 줄어듭니다.
   - 에이전트가 맡는 것은 제작, 배포, CS 1차 응대, 콘텐츠 생성까지입니다. 순위 방어, 가격 실험, 플랫폼 정책 대응은 사람에게 남습니다.

---

## 8. 공통 실패 패턴

- **기저율이 나쁩니다.**
  - TrustMRR 솔로 표본 986개의 핵심군 MRR 중앙값은 $445이고 51%가 $500 미만, $5K 이상은 13%입니다. https://www.onemilliongoal.com/p/what-986-solo-startups-actually-look
  - Indie Hackers의 Stripe 검증 제품은 54%가 매출 정확히 $0이고, 이 비율이 3년째 변하지 않았습니다. https://scrapingfish.com/blog/indie-hackers-revenue
  - 이 두 표본조차 자발적으로 공개한 사람들의 집합이라, 실제 분포는 더 나쁩니다.
- **공급 과잉입니다.**
  - App Store 신규 앱이 2026년 상반기에만 약 56만 개로 2025년 전체(약 60만 개)에 육박합니다. 같은 기간 다운로드는 +2%입니다. https://9to5mac.com/2026/07/20/report-app-store-added-nearly-as-many-new-apps-in-h1-2026-as-in-all-of-2025/
  - RevenueCat 집계에서 상위 10% 앱은 +306% 성장했고 중앙값은 +5.3%입니다. https://www.revenuecat.com/state-of-subscription-apps
  - 제작비가 0으로 가면서 경쟁이 전부 유통 쪽으로 옮겨갔습니다.
- **AI 래퍼는 이탈이 빠릅니다.** 1년차 LTV는 +41%지만 이탈이 30% 빠르고 12개월 잔존은 36% 나쁩니다(RevenueCat 2026). 팔리기는 하는데 남지 않습니다.
- **비반복 스파이크에 속기 쉽습니다.** fly.pieter.com은 $87K에서 $0이 됐습니다. 광고·스폰서·바이럴 수익을 MRR로 표기한 경우입니다.
- **이탈이 상한을 고정합니다.** ScreenshotOne의 Max MRR = 신규 MRR ÷ 이탈률 공식이 그 예입니다. 일회성 용도 고객이 많은 유틸은 광고 없이는 천장이 정해져 있습니다.
- **마켓플레이스 집중과 플랫폼 정책 위험이 있습니다.**
  - Apify는 자사 계열 계정 5개가 매출 44%를 가져가고, 2026-10에 렌털 모델을 폐지합니다.
  - 토스는 심사를 강화하고 앱을 중단시킨 사례가 있습니다.
  - 스마트스토어는 등록 한도와 AI 표시 정책을 도입했습니다.
- **한국어 B2C 단독에는 천장이 있습니다.**
  - 한국 유저만으로 $3K MRR을 유지하려면 유료 구독자 약 300명이 필요합니다. 도달 사례는 영어판을 병행하거나 B2B로 전환한 경우였다는 관찰입니다.
  - 익명 인터뷰 기반의 단일 블로그라 등급 C-입니다.
  - 제시된 예: 운동 기록 앱이 영어판 추가 후 $380에서 $820으로, 시간 추적 앱이 B2B 전환 후 $800에서 $4,200으로 올랐습니다.
  - URL: https://productengineer.info/camp/ko/shippen/story/kr-indie-hacker-mrr-reality-2026
- **정보 생태계가 오염돼 있습니다.** 수치의 상당수는 강의·뉴스레터·부트캠프 판매자가 유통합니다. 김윤후와 패스트캠퍼스, Lyttle과 유튜브가 그 예입니다. 검증 없는 트윗이 2차 블로그에서 "케이스 스터디"로 승격됩니다.

### 2026-09 기준 포화 판정

**포화 (신규 진입 비추천)**
- AI 헤드샷·아바타
- 범용 ChatGPT 래퍼와 PDF 채팅
- 얼굴 없는 숏폼 생성기
- 습관·투두·타이머 앱 (상위 순위가 고착됐습니다)
- Apify 범용 스크레이퍼 (구글맵, 인스타 등은 Apify 계열 계정이 장악)
- Framer·Notion 템플릿
- 크몽 "AI 부업" 전자책
- 앱인토스의 단순 게임·운세·리워드형 (두 달 만에 5천 개에서 1만 개로 늘었습니다)

**상대적으로 여지가 있는 곳**
- 언어·규제에 묶인 로컬 버티컬 (Khosmos, 국가별 규격류)
- 고가 포지션의 니치 데이터 상품 ($15/1,000건 이상 티어)
- 기존 제품의 종료나 가격 인상으로 생긴 빈자리 (Capgo와 CodePush)
- 1회 결제형이면서 공식 요건을 충족해야 하는 사진·서류류 (HeadshotPro 구조)

---

## 9. 본진에 대한 시사점

- 조사 범위에서 증명사진·specs와 구조가 가장 가까운 것은 HeadshotPro입니다.
  - 공통점은 1회 결제, 검색 의도가 명확한 키워드, 프로그래매틱 페이지, 제휴로 유통을 외주화한다는 점입니다.
  - specs 2,574페이지와 크레딧 1회 결제는 이미 같은 골격입니다.
  - 아직 없는 것은 제휴 채널입니다. HeadshotPro는 매출의 15% 이상이 여기서 나옵니다.
- Project A(운세 앱, 결제 검증 월 $82K)는 관상 고리의 글로벌 지불 의사가 실재한다는 1차 증거입니다.
- 앱인토스는 첫 매출까지 가장 빠른 국내 레일입니다. 다만 월 ₩400만 이상은 앱 5–10개를 내야 확률이 나오고, 광고 수익 비중이 크며 심사 리스크가 있습니다.

**핵심 출처**: TrustMRR(https://trustmrr.com/), RevenueCat SOSA 2026(https://www.revenuecat.com/state-of-subscription-apps), 토스 공식(https://toss.im/tossfeed/article/45493), 9to5Mac(https://9to5mac.com/2026/04/06/app-store-sees-84-surge-in-new-apps-as-ai-coding-tools-take-off/), TechCrunch(https://techcrunch.com/2026/04/18/the-app-store-is-booming-again-and-ai-may-be-why/)
