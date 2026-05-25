-- ============================================================
-- MONK Chatbot RAG Knowledge Seed
-- Target: monk-db.rag_knowledge
-- Date: 2026-05-25
-- Corrections applied from REPORT_20260525 (12 discrepancies)
-- ============================================================

-- ============================
-- BILLING (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('credit_system', 'billing', 'ko', '크레딧 시스템 안내',
'크레딧,credit,クレジット,포인트,point,생성,다운로드,공유,보너스,무료,이벤트,가입,동의',
'MONKOS는 크레딧 기반으로 운영됩니다.
- AI 증명사진 생성: 10크레딧
- 고화질 다운로드: 70크레딧
- 추가 규격 크롭: 10크레딧
- 원본 전체 다운로드: 10크레딧
- 1장 완성에 총 80크레딧 (생성 10c + 다운로드 70c)
- 신규 가입 보너스: 10크레딧 즉시 지급 (카카오/LINE/Google, 1회)
크레딧은 구매 후 환불 조건을 충족하면 환불 가능합니다.', 10);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('credit_purchase', 'billing', 'ko', '크레딧 구매 방법',
'구매,purchase,購入,결제,payment,支払い,가격,price,料金,toss,lemon,패키지',
'크레딧 구매 옵션:

[한국 — 토스페이먼츠]
- 📸 1장 구매 (추천): ₩9,900 (70크레딧 + 보너스 10 = 총 80크레딧)
- 10크레딧: ₩1,450
- 130크레딧 패키지: ₩12,900 (100크레딧 + 보너스 30)
- 420크레딧 패키지: ₩34,900 (300크레딧 + 보너스 120) — 추천
- 750크레딧 패키지: ₩49,900 (500크레딧 + 보너스 250)

[글로벌/일본 — Lemon Squeezy]
- 📸 1장분: ¥990 (70c + 보너스 10c = 80c)
- 10c 충전: ¥150
- 130c 패키지: ¥1,490 (100c + 보너스 30c)
- 420c 패키지: ¥3,990 (300c + 보너스 120c) — 추천
- 750c 패키지: ¥5,990 (500c + 보너스 250c)

패키지 구매 시 보너스 크레딧 포함 최대 50% 이상 할인됩니다.
결제 후 즉시 크레딧이 반영됩니다.', 10);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('refund_policy', 'billing', 'ko', '환불 정책',
'환불,refund,返金,취소,cancel,キャンセル,돈,money,반환',
'환불 조건 (엄격 적용):
- 구매 후 7일 이내 + 크레딧 완전 미사용 → 전액 환불
- 1회라도 사용한 경우 → 환불 불가 (디지털 콘텐츠 특성)
- 시스템 장애로 크레딧이 소모된 경우 → 환불이 아닌 크레딧 자동 복구
환불 신청: info@monkos.ai 으로 이메일 (구매 이메일, 구매일, 사유 기재)
처리 기간: 신청 후 5영업일 이내 심사, 환불 결정일로부터 3영업일 이내 처리', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('payment_methods', 'billing', 'ko', '결제수단 안내',
'결제,payment,支払い,決済,카드,card,カード,편의점,コンビニ,convenience,toss,lemon,paypal',
'MONKOS 결제수단 현황:

[한국]
- 토스페이먼츠: 카드결제, 간편결제(토스페이, 카카오페이 등)

[글로벌 (일본 포함)]
- Lemon Squeezy: 카드결제 (Visa, Mastercard, AMEX 등), PayPal, Apple Pay, Google Pay
- ⚠️ 일본 편의점 결제(コンビニ決済)는 현재 미지원
- 일본 사용자는 카드결제 또는 PayPal을 이용해주세요', 5);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('event_bonuses', 'billing', 'ko', '이벤트 보너스 크레딧',
'이벤트,event,보너스,bonus,무료,free,텔레그램,카카오,미션,공유',
'크레딧 보너스 이벤트:
- 신규 가입: 10크레딧 즉시 지급
- 텔레그램 채널 참여: 40크레딧
- 카카오 채널 추가: 40크레딧
- SNS 미션 완료: 100크레딧
- SNS 공유 이벤트: 100크레딧
텔레그램 CS봇(@monkos_support_bot)에서 참여 가능합니다.', 8);

-- ============================
-- SERVICE (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('photo_quality', 'service', 'ko', '사진 품질 개선 가이드',
'품질,quality,品質,사진,photo,写真,촬영,흐릿,blur,밝기,조명,lighting',
'AI 증명사진 품질을 높이려면:
1. 정면을 바라보고 촬영 (좌우 대칭)
2. 밝은 조명 (자연광 또는 실내 조명 정면)
3. 단색 배경 권장 (흰 벽 등)
4. 어깨가 보이도록 상반신 촬영
5. 표정: 자연스러운 미소 또는 무표정
6. AI 코칭 기능의 안내에 따라주세요
촬영 팁을 따르면 1회 생성으로도 좋은 결과를 얻을 수 있습니다.', 5);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('supported_photo_types', 'service', 'ko', '지원하는 증명사진 종류',
'증명사진,id photo,証明写真,여권,passport,パスポート,이력서,resume,履歴書,종류,type',
'MONKOS AI 증명사진에서 생성 가능한 유형:
- 여권/비자용 증명사진
- 이력서/취업용 증명사진
- 학생증/사원증용 증명사진
- 비즈니스 프로필 사진
- 마이나넘버카드(JP)
- 주민등록증(KR)
성별(남성/여성)과 연령대를 선택하면 적합한 복장이 자동 적용됩니다.
배경은 순백(#FFFFFF)으로 고정, 비율 3:4 표준 규격입니다.', 5);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('service_flow', 'service', 'ko', '서비스 이용 흐름',
'사용법,how to,使い方,흐름,flow,フロー,순서,step,ステップ,이용,usage',
'MONKOS AI 증명사진 이용 흐름:

1️⃣ 촬영 준비: 용도 선택 (여권/이력서 등) → 의상/헤어 가이드 확인
2️⃣ 실시간 코칭: AI 코치가 자세·표정·조명을 실시간 안내
3️⃣ AI 생성: 촬영 완료 후 AI가 증명사진 자동 생성 (10크레딧)
4️⃣ 결과 확인: 생성된 사진 미리보기 + 품질 검증(QC)
5️⃣ 다운로드: 마음에 드는 사진 고화질 다운로드 (70크레딧)

총 80크레딧으로 프로 품질의 증명사진 1장을 완성할 수 있습니다.
추가 규격 크롭(10c)이나 원본 다운로드(10c)도 가능합니다.', 7);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('service_urls', 'service', 'ko', '서비스 URL 안내',
'url,link,リンク,링크,주소,address,サイト,사이트,website',
'MONKOS 서비스 링크:
- 포털 (메인): https://monkos.ai
- AI 증명사진 (한국어): https://idphoto-kr.monkos.ai/app
- AI 증명사진 (일본어): https://idphoto-jp.monkos.ai/app
- 무료 크롭앱: https://monkos.ai/crop
- 증명사진 규격 DB (202개국): https://monkos.ai/specs
- 블로그: https://monkos.ai/blog
- 가격 안내: https://monkos.ai/pricing
- 가이드: https://monkos.ai/guide
- 몽크사진관 (오프라인): https://monk.kr
- 고객지원 이메일: info@monkos.ai
- 텔레그램 CS: @monkos_support_bot', 8);

-- ============================
-- TECHNICAL (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('login_issue', 'technical', 'ko', '로그인 문제 해결',
'로그인,login,ログイン,접속,계정,account,アカウント,google,구글,카카오,kakao,line,ライン',
'MONKOS는 카카오(한국), LINE(일본), Google(글로벌) 계정으로 로그인할 수 있습니다.
로그인이 안 될 경우:
1. 브라우저 캐시/쿠키 삭제 후 재시도
2. 시크릿/프라이빗 모드에서 시도
3. 다른 브라우저(Chrome 권장)에서 시도
4. 팝업 차단이 해제되어 있는지 확인
5. 위 방법으로 해결 안 될 경우 info@monkos.ai 으로 문의', 5);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('account_deletion', 'technical', 'ko', '계정 삭제 요청',
'삭제,delete,削除,탈퇴,withdrawal,退会,계정,account',
'계정 삭제를 원하시면:
- info@monkos.ai 으로 이메일 요청
- 제목: "계정 삭제 요청"
- 내용: 가입 시 사용한 계정정보 (카카오/LINE/Google) 기재
- 처리 기간: 영업일 기준 5~7일
- 삭제 시 모든 데이터(크레딧, 생성 이력)가 영구 삭제됩니다.
- 미사용 크레딧이 남아 있다면 환불 조건 확인 후 환불 신청을 먼저 해주세요.', 5);

-- ============================
-- BRAND (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_identity', 'brand', 'ko', 'MONK 브랜드 소개',
'몽크,monk,モンク,소개,about,紹介,뭐하는,어떤,who,what,브랜드,brand',
'MONK는 20년 경력의 사진작가가 직접 개발한 AI 사진관입니다.
12년 넘게 사진관을 운영한 실전 경험과 20년 사진작가 경력이 녹아있습니다.
태그라인: "사진가의 눈을 가진 AI"
독자 AI 엔진이 촬영·보정을 스튜디오 출력 수준으로 제공합니다.
전문 개발자는 아니지만 사진은 압니다. 조명, 배경, 각 국가의 여권·비자 규격까지 완벽히 이해하고 인물사진에 대한 전문성으로 최고 품질의 인물사진 서비스를 제공합니다.
한국, 일본, 글로벌 — 모든 규격을 아는 사진관입니다.', 7);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_pricing', 'brand', 'ko', '가격 철학 — 합리적 크레딧 시스템',
'가격,price,価格,비싸,싸,expensive,cheap,원가,cost,왜,why,なぜ,비용,fee,料金',
'AI 증명사진 생성 1회에 10크레딧, 고화질 다운로드 70크레딧입니다.
신규 가입 시 10크레딧을 드립니다.
한국 사용자는 토스페이먼츠로 ₩1,450부터 결제 가능하며, 패키지 구매 시 보너스 크레딧 포함 최대 50% 이상 할인됩니다.
개인이 운영하다 보니 마케팅비를 얹을 여유가 없습니다. 합리적인 가격에 품질로 보답합니다.
20년 사진작가가 직접 만든 독자 AI 엔진, 스튜디오 출력 수준의 품질, 나라별 규격 완벽 대응.', 6);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_safety_deepfake', 'brand', 'ko', '안전성 — 딥페이크 방지 설계',
'안전,safe,安全,딥페이크,deepfake,ディープフェイク,위험,danger,갤러리,gallery,업로드,upload,왜 직접,불편',
'MONK는 사진 편집 앱이 아닙니다. 못해서가 아닙니다. 안 하는 겁니다.
AI 증명사진 시장의 가장 큰 리스크는 "딥페이크" 가능성입니다. 갤러리에서 아무 사진이나 올릴 수 있다면, 내 얼굴로 남이 증명사진을 만들 수 있습니다.
그래서 MONK는:
- 로그인 본인인증 필수 (카카오/LINE/구글)
- 실시간 카메라 촬영만 허용 (갤러리 업로드 차단)
- 정체성 일치율 90% 이상 보장
조금 불편합니다. 하지만 그 불편함이 당신의 얼굴을 지킵니다.', 6);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_identity_preservation', 'brand', 'ko', '정체성 보존 90:10 원칙',
'보정,retouch,레터치,리터치,レタッチ,90,정체성,identity,자연스러운,natural,ナチュラル,변형,성형,눈 크기,V라인',
'MONK의 AI 보정은 정체성 일치율 90% 이상을 보장합니다.
90% — 정체성 보존: 얼굴 윤곽, 눈·코·입 비율, 골격 구조를 변형하지 않습니다. "나는 나"입니다.
10% — 자연스러운 보정: 피부톤 균일화, 잡티 정리, 조명 보정. 스튜디오에서 찍은 것 같은 마무리입니다.
윤곽 변형, 눈 확대, V라인, 턱 축소 같은 성형 수준의 보정은 하지 않습니다.
아동 여권사진의 경우 얼굴 보정을 일체 적용하지 않습니다 (외무성 규정 준수).
비록 AI 증명사진이지만, "본인 사진"이어야 합니다.', 6);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_data_privacy', 'brand', 'ko', '데이터 보호 정책',
'데이터,data,データ,개인정보,privacy,プライバシー,저장,store,保存,학습,training,삭제,delete,사진 보관,서버',
'MONK는 고객의 개인정보와 사진 데이터를 철저히 보호합니다.
- 고객이 동의 없이 제공하는 사진은 서버에 저장하지 않습니다.
- AI 학습에 고객 사진을 사용하지 않습니다.
- 모든 이미지 처리는 AI 엔진 서버에서 처리 후 즉시 삭제됩니다.
- 서버에 남는 것은 로그인 정보와 크레딧 잔액뿐입니다.
"내 얼굴은 내 것입니다."
데이터 저장 정책:
- 한국어: https://idphoto-kr.monkos.ai/policy-data.html
- 日本語: https://idphoto-jp.monkos.ai/policy-data.html', 6);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_feedback', 'brand', 'ko', '고객 소통 정책',
'피드백,feedback,フィードバック,의견,opinion,意見,불만,complaint,개선,improve,改善,cs,고객,customer,as,소통',
'MONK는 고객님의 의견을 적극적으로 듣고 개선합니다.
AS·CS 채널을 운영하고 있으며, 부족한 점에 대한 피드백을 항상 환영합니다.
채널에 남겨주신 한 마디가 다음 업데이트가 됩니다.
텔레그램 채널에서 언제든 의견을 남겨주세요.
고객지원 이메일: info@monkos.ai
텔레그램 CS봇: @monkos_support_bot', 4);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_why_realtime', 'brand', 'ko', '왜 실시간 촬영만 가능한가',
'실시간,realtime,リアルタイム,카메라,camera,カメラ,직접,directly,촬영,capture,撮影,왜,why,갤러리 안 되,올리기',
'MONK에서는 갤러리에서 기존 사진을 올리는 것이 아니라, 실시간 카메라로 직접 촬영합니다.
이유: AI 증명사진 시장의 가장 큰 위험은 딥페이크입니다. 갤러리 업로드를 허용하면 남의 사진으로 증명사진을 만들 수 있습니다.
프로세스: 로그인 본인인증 → 실시간 카메라 촬영 → AI 보정(정체성 90%+ 유지) → 결과물 수신.
편한 서비스를 만들 수 있습니다. 하지만 안 합니다. 그 불편함이 당신의 얼굴을 지킵니다.
AI 코칭 기능이 촬영 중 자세, 표정, 조명을 실시간으로 안내해드립니다.', 5);

-- ============================
-- BRAND CONCEPT — 몽크사진관 vs MONKOS AI (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_monk', 'brand', 'ko', '몽크사진관 (MONK STUDIO) 소개',
'몽크사진관,사진관,studio,스튜디오,방문,오프라인,하남,미사,monk.kr,예약',
'몽크사진관은 경기도 하남시 미사 그랑파사쥬 B1029호에 위치한 오프라인 사진관입니다.
20년 경력 사진작가가 직접 운영하며 증명사진, 프로필, 가족사진 등을 촬영합니다.
영업시간: 월·수~토 11:00~19:30 / 일 11:00~19:00 / 화요일 정기휴무
예약: 네이버 간편예약, 전화(031-791-5030), 당일 방문 가능
교통: 5호선 미사역 연결 (그랑파사쥬 B동)
사이트: monk.kr', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_monkos', 'brand', 'ko', 'MONKOS AI 소개',
'몽코스,monkos,AI,온라인,앱,증명사진,idphoto,플랫폼',
'MONKOS AI는 몽크사진관(MONK STUDIO)이 개발한 온라인 AI 증명사진 플랫폼입니다.
사진관 20년 노하우를 AI에 녹여 실시간 촬영 코칭, AI 사진 생성, 품질 검수를 제공합니다.
한국어: idphoto-kr.monkos.ai/app / 일본어: idphoto-jp.monkos.ai/app
무료 크롭앱: monkos.ai/crop / 증명사진 규격 DB: monkos.ai/specs (202개국)
사이트: monkos.ai', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_relation', 'brand', 'ko', '몽크사진관과 MONKOS AI의 관계',
'관계,차이,같은,다른,오프라인,온라인,둘,비교',
'몽크사진관(오프라인)과 MONKOS AI(온라인)는 같은 대표가 운영합니다.
몽크사진관의 촬영 품질 기준이 MONKOS AI의 AI 보정 기준이 됩니다.
오프라인 노하우를 AI로 서비스화한 것이 MONKOS AI입니다.
방문 촬영을 원하면 → monk.kr (몽크사진관)
온라인 AI 증명사진을 원하면 → monkos.ai (MONKOS AI)
몽크사진관 ≠ AI 서비스. MONKOS AI ≠ 사진관. 혼동 금지.', 9);

-- ============================
-- BRAND CONCEPT (ja)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_monk_ja', 'brand', 'ja', 'モンク写真館（MONK STUDIO）のご紹介',
'モンク写真館,写真館,studio,スタジオ,来店,オフライン,ハナム,ミサ,monk.kr,予約',
'モンク写真館は韓国・京畿道河南市ミサ グランパサージュB1029号に位置するオフライン写真館です。
20年のキャリアを持つフォトグラファーが直接運営し、証明写真、プロフィール、家族写真などを撮影します。
営業時間：月・水〜土 11:00〜19:30 / 日 11:00〜19:00 / 火曜定休
アクセス：5号線ミサ駅連絡（グランパサージュB棟）
サイト：monk.kr', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_monkos_ja', 'brand', 'ja', 'MONKOS AIのご紹介',
'モンコス,monkos,AI,オンライン,アプリ,証明写真,idphoto,プラットフォーム',
'MONKOS AIはモンク写真館（MONK STUDIO）が開発したオンラインAI証明写真プラットフォームです。
写真館20年のノウハウをAIに注ぎ、リアルタイム撮影コーチング、AI写真生成、品質検査を提供します。
日本語：idphoto-jp.monkos.ai/app / 韓国語：idphoto-kr.monkos.ai/app
無料クロップアプリ：monkos.ai/crop / 証明写真規格DB：monkos.ai/specs（202カ国）
サイト：monkos.ai', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_relation_ja', 'brand', 'ja', 'モンク写真館とMONKOS AIの関係',
'関係,違い,同じ,異なる,オフライン,オンライン,両方,比較',
'モンク写真館（オフライン）とMONKOS AI（オンライン）は同じ代表が運営しています。
モンク写真館の撮影品質基準がMONKOS AIのAI補正基準になります。
オフラインのノウハウをAIでサービス化したのがMONKOS AIです。
来店撮影をご希望 → monk.kr（モンク写真館）
オンラインAI証明写真をご希望 → monkos.ai（MONKOS AI）
モンク写真館 ≠ AIサービス。MONKOS AI ≠ 写真館。混同にご注意ください。', 9);

-- ============================
-- BRAND CONCEPT (en)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_monk_en', 'brand', 'en', 'MONK STUDIO Introduction',
'monk studio,photo studio,visit,offline,hanam,misa,monk.kr,reservation',
'MONK STUDIO is an offline photo studio located at Grand Passage B1029, Misa, Hanam City, Gyeonggi-do, South Korea.
Operated by a photographer with 20 years of experience, offering ID photos, profile shots, and family portraits.
Hours: Mon/Wed-Sat 11:00-19:30 / Sun 11:00-19:00 / Closed Tuesdays
Access: Connected to Misa Station (Line 5), Grand Passage Building B
Website: monk.kr', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_monkos_en', 'brand', 'en', 'MONKOS AI Introduction',
'monkos,AI,online,app,id photo,idphoto,platform',
'MONKOS AI is an online AI ID photo platform developed by MONK STUDIO.
Built on 20 years of photography expertise, it offers real-time shooting coaching, AI photo generation, and quality inspection.
Korean: idphoto-kr.monkos.ai/app / Japanese: idphoto-jp.monkos.ai/app
Free crop tool: monkos.ai/crop / ID photo specs DB: monkos.ai/specs (202 countries)
Website: monkos.ai', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('brand_concept_relation_en', 'brand', 'en', 'Relationship between MONK STUDIO and MONKOS AI',
'relationship,difference,same,different,offline,online,both,compare',
'MONK STUDIO (offline) and MONKOS AI (online) are operated by the same founder.
MONK STUDIO''s photography quality standards serve as MONKOS AI''s AI correction standards.
MONKOS AI is the digital transformation of offline photography expertise.
For in-person photography → monk.kr (MONK STUDIO)
For online AI ID photos → monkos.ai (MONKOS AI)
MONK STUDIO ≠ AI service. MONKOS AI ≠ photo studio. Do not confuse the two.', 9);

-- ============================
-- LEGAL — Japan (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_japan_refund', 'legal', 'ko', '일본 환불/해약 법률 (特定商取引法・消費者契約法)',
'환불,refund,返金,해약,취소,cancel,キャンセル,쿨링오프,クーリングオフ,일본,japan,日本,법률,law,法律',
'[일본 디지털 콘텐츠 환불 규정]

■ 特定商取引法 (특정상거래법)
- 통신판매(온라인 구매)에는 쿨링오프 제도가 적용되지 않음
- 사업자가 "환불 불가" 정책을 명확히 표시한 경우 법적으로 유효
- 환불 정책 미표시 시: 소비자가 수령 후 8일 이내 해약 가능

■ 消費者契約法 (소비자계약법)
- "어떤 경우에도 절대 환불 불가"라는 조항은 무효 가능성
- 디지털 상품이 설명대로 제공되고 정상 작동하면 환불 거부 가능

■ MONKOS 적용
- AI 사진 생성 완료 후 환불 거부 가능 (디지털 콘텐츠 제공 완료)
- 구매 전 환불 불가 사실을 명확히 표시 필수
- 시스템 장애로 크레딧 소모 시 크레딧 복구로 대응', 4);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_japan_privacy', 'legal', 'ko', '일본 개인정보보호법 (APPI)',
'개인정보,privacy,個人情報,APPI,삭제,delete,削除,데이터,data,유출,breach,일본,japan,日本',
'[일본 APPI - 개인정보보호법]

■ 얼굴 사진 데이터 취급
- 수집 시 이용 목적을 즉시 통지 의무
- 요배려개인정보(민감정보)에 해당할 경우 사전 동의 필수

■ 보유/삭제 의무
- 이용 목적 달성 후 지체 없이 삭제 노력 의무
- 정보주체의 삭제 요청: 위법 수집, 목적 외 이용, 데이터 유출 시 삭제 의무

■ 데이터 유출 시
- 1,000명 이상 영향 또는 민감정보 관련: 보고 의무
- 예비보고: 3~5영업일 이내 / 최종보고: 30일 이내', 3);

-- ============================
-- LEGAL — Korea (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_korea_refund', 'legal', 'ko', '한국 전자상거래법 환불/청약철회 규정',
'환불,refund,청약철회,취소,cancel,전자상거래,한국,korea,소비자,consumer,7일,다크패턴',
'[한국 전자상거래법 - 청약철회]

■ 일반 원칙 (제17조)
- 계약 체결일 또는 상품 수령일로부터 7일 이내 청약철회 가능
- 계약 내용과 다른 경우: 안 날로부터 30일 이내

■ 디지털 콘텐츠 환불 거부 가능 사유 (제17조 제2항)
- 디지털콘텐츠의 제공이 개시된 경우 (생성 시작 = 제공 개시)
- 복제 가능 상품의 포장 훼손

■ MONKOS 적용
- AI 사진 생성 후: 환불 거부 가능 (제공 개시)
- 미사용 크레딧: 구매 후 7일 이내 전액 환불
- 환불 처리: 신청 후 5영업일 이내 심사, 환불 결정일로부터 3영업일 이내 처리', 4);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_korea_privacy', 'legal', 'ko', '한국 개인정보보호법 (PIPA) 및 초상권',
'개인정보,privacy,초상권,portrait,삭제,delete,동의,consent,한국,korea,생체,biometric,AI기본법',
'[한국 개인정보보호법 + 초상권]

■ 얼굴 사진 = 개인정보 + 민감정보(생체)
- 특정인 식별 가능한 얼굴 사진은 개인정보
- 안면인식용 얼굴 데이터는 생체정보(민감정보)로 분류
- 민감정보 처리 시 별도 동의 필수

■ 개인정보 삭제 요청 (제36조)
- 정보주체 요청 시 10일 이내 조치 및 결과 통지
- 복원 불가능한 방법으로 영구 삭제

■ 2026년 인공지능기본법 (2026.1.22 시행)
- AI 생성물에 "AI 생성" 표시 의무
- 위반 시 최대 3,000만원 과태료

■ MONKOS 적용
- 수집 시: 개인정보 동의 + 민감정보(생체) 별도 동의
- 생성 후 원본 사진 파기 의무
- 삭제 요청 시 10일 이내 처리', 3);

-- ============================
-- LEGAL — Global (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_gdpr', 'legal', 'ko', 'GDPR 데이터 주체 권리 (EU)',
'GDPR,EU,유럽,europe,삭제,erasure,delete,접근,access,이동,portability,동의,consent,환불,refund,14일',
'[GDPR - EU 데이터 보호 규정]

■ 삭제권 (Article 17)
- 요청 접수 후 1개월 이내 응답 필수
- 원본 사진 + 생성 사진 + 메타데이터 전부 삭제

■ 접근권 (Article 15)
- 1개월 이내 응답, 보유 데이터 목록 제공

■ EU 소비자 권리 지침 - 디지털 콘텐츠 환불
- 14일 철회권이 원칙
- 환불 거부 조건: 디지털 콘텐츠 이행 시작 + 소비자 사전 동의 + 철회권 상실 인지 확인', 3);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_eu_ai_act', 'legal', 'ko', 'EU AI Act (AI 생성물 표시 의무)',
'AI Act,EU,유럽,AI법,표시,label,watermark,워터마크,생체,biometric,AI생성',
'[EU AI Act - AI 규정]

■ AI 생성물 표시 의무 (2026년 8월 2일 시행)
- AI로 생성/조작된 콘텐츠: 기계 판독 가능 형식으로 표시 필수
- 위반 시: 최대 1,500만 유로 또는 전 세계 연간 매출 3%

■ 생체 인식 관련
- 인터넷/CCTV에서 무차별 얼굴 이미지 수집 → DB 구축 절대 금지

■ MONKOS 적용
- AI 생성 증명사진에 메타데이터로 "AI 생성" 표시
- 사용자 얼굴 데이터: 서비스 목적으로만 사용, 학습용 수집 금지', 3);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('law_us_ftc', 'legal', 'ko', '미국 FTC 소비자보호 규정',
'미국,US,USA,FTC,구독,subscription,취소,cancel,소비자,consumer,america',
'[미국 FTC 규정 - 디지털 콘텐츠/구독]

■ ROSCA (온라인 소비자 신뢰 회복법)
- 구독/결제 전: 비용, 청구 빈도, 취소 방법 명확히 공개
- 취소: 가입과 동일한 수준으로 간편해야 함

■ MONKOS 적용
- 크레딧 구매 시 가격, 환불 정책 명확히 표시
- 이메일로 환불 신청 가능하도록 안내', 2);

-- ============================
-- OPERATIONS (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('complaint_handling', 'operations', 'ko', '컴플레인 대응 가이드',
'컴플레인,complaint,クレーム,불만,항의,에스컬레이션,escalation,법적,legal,소비자원,환불,refund,분쟁,dispute',
'[CS 컴플레인 대응 원칙]

■ 1단계: 즉시 대응 (봇이 처리)
- 공감 표현 → 문제 파악 → 정책 기반 답변

■ 2단계: 이메일 에스컬레이션
다음 경우 반드시 info@monkos.ai 안내:
- 환불 신청, 계정 삭제, 결제 분쟁, 개인정보 삭제 요청, 법적 조치 언급

■ 3단계: 법적 대응 필요 시
- 소비자원(한국 1372), 国民生活センター(일본 188), FTC(미국): 각국 분쟁기관 안내

■ 국가별 응대 톤
- 일본: 극도로 정중 (丁寧語), 직접적 거절 피하고 우회 표현
- 한국: 정중하되 명확, 법적 근거 제시
- 영어권: 프로페셔널, 간결

■ 절대 금지: 법적 조언/판단, 개인 감정 대응, 확인 안 된 보상 약속', 5);

-- ============================
-- PREP GUIDE (ko)
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('prep_passport', 'guide', 'ko', '여권/パスポート 촬영 준비 가이드',
'여권,패스포트,passport,パスポート,비자,visa',
'[여권 증명사진 규격]
한국: 35×45mm, 흰색 배경, 6개월 이내 촬영
일본: 35×45mm, 흰색 또는 밝은 단색 배경
공통: 정면, 무표정, 눈 뜬 상태, 안경 가급적 제거
의상: 흰색 의상 피할 것 (배경과 구분 불가), 어두운 단색 상의 권장
헤어: 이마/귀 가리지 않도록, 앞머리 정리
[촬영 팁] 자연광 또는 밝은 조명, 그림자 없이, 카메라 정면 응시', 5);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('prep_resume', 'guide', 'ko', '이력서/履歴書 촬영 준비 가이드',
'이력서,취업,resume,履歴書,就活,입사,면접',
'[이력서 증명사진]
한국: 30×40mm, 3개월 이내 촬영, 정장 필수 (남: 넥타이 권장, 여: 블라우스+재킷)
일본: 30×40mm, 3개월 이내
의상: 네이비/차콜 정장 + 흰색 셔츠가 가장 무난
표정: 자연스러운 미소 (이 보이지 않을 정도)
헤어: 깔끔하게 정돈, 이마 보이도록
[촬영 팁] 상체만 촬영, 어깨 정면, 살짝 턱 당기기', 5);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('prep_student', 'guide', 'ko', '학생증/学生証 촬영 준비 가이드',
'학생증,학생,student,学生証,학교,입학',
'[학생증 증명사진]
일반적으로 25×30mm 또는 30×40mm
교복 착용이 일반적 (학교 규정 확인)
사복 시: 깔끔한 셔츠/블라우스
배경: 흰색 또는 밝은 단색
표정: 자연스러운 표정 (미소 가능)
[연령별 포인트]
- 초등: 밝은 색 폴로셔츠, 자연스러운 표정
- 중고등: 교복 또는 단정한 셔츠
- 대학: 정장 또는 깔끔한 사복', 4);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('prep_baby', 'guide', 'ko', '영유아/赤ちゃん 촬영 가이드',
'아기,유아,영아,baby,赤ちゃん,幼児,신생아',
'[영유아 증명사진 (여권/비자)]
한국: 6개월 미만은 눈 감은 사진도 허용
일본: 동일 기준
공통: 정면, 입 다물기, 배경 흰색
보호자 손 보이지 않도록 주의
[촬영 팁]
- 밝은 방에서 촬영
- 흰색 이불/시트 위에 눕히거나 안고 촬영
- 후면 카메라 사용 권장 (화질)
- 여러 장 연속 촬영 → 가장 좋은 컷 선택', 4);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('prep_color_guide', 'guide', 'ko', '의상 컬러 가이드',
'색상,컬러,의상,color,色,服装,옷',
'[증명사진 의상 컬러 가이드]
✅ 추천: 네이비, 차콜, 다크그레이, 검정 (정장)
✅ 셔츠: 흰색이 가장 무난
⚠️ 주의: 흰색 상의 (배경과 구분 불가), 빨강/노랑 원색 (시선 분산)
❌ 피하기: 줄무늬, 체크 등 복잡한 패턴 (AI 생성 시 왜곡 가능)
[피부톤별 추천]
- 따뜻한 피부톤: 네이비, 따뜻한 그레이
- 차가운 피부톤: 차콜, 블랙
- 범용: 네이비 정장 + 흰색 셔츠 (누구에게나 어울림)', 4);

-- ============================
-- KEY ITEMS — Japanese versions
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('credit_system_ja', 'billing', 'ja', 'クレジットシステムのご案内',
'クレジット,credit,ポイント,point,生成,ダウンロード,ボーナス,無料,イベント,登録',
'MONKOSはクレジット制で運営されています。
- AI証明写真生成：10クレジット
- 高画質ダウンロード：70クレジット
- 追加規格クロップ：10クレジット
- オリジナル全体ダウンロード：10クレジット
- 1枚完成に合計80クレジット（生成10c + ダウンロード70c）
- 新規登録ボーナス：10クレジット即時付与（カカオ/LINE/Google、1回）
クレジットは購入後、返金条件を満たせば返金可能です。', 10);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('credit_purchase_ja', 'billing', 'ja', 'クレジット購入方法',
'購入,purchase,決済,payment,支払い,価格,price,料金,パッケージ',
'クレジット購入オプション：

[日本・グローバル — Lemon Squeezy]
- 📸 1枚分：¥990（70c + ボーナス10c = 80c）
- 10c チャージ：¥150
- 130c パッケージ：¥1,490（100c + ボーナス30c）
- 420c パッケージ：¥3,990（300c + ボーナス120c）— おすすめ
- 750c パッケージ：¥5,990（500c + ボーナス250c）

パッケージ購入でボーナスクレジット含め最大50%以上割引。
決済後すぐにクレジットが反映されます。', 10);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('refund_policy_ja', 'billing', 'ja', '返金ポリシー',
'返金,refund,キャンセル,cancel,お金,money,払い戻し',
'返金条件（厳格適用）：
- 購入後7日以内 + クレジット完全未使用 → 全額返金
- 1回でも使用した場合 → 返金不可（デジタルコンテンツの特性）
- システム障害でクレジットが消費された場合 → 返金ではなくクレジット自動復旧
返金申請：info@monkos.ai にメール（購入メール、購入日、理由を記載）
処理期間：申請後5営業日以内に審査、返金決定日から3営業日以内に処理', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('service_urls_ja', 'service', 'ja', 'サービスURL案内',
'url,link,リンク,アドレス,サイト,website',
'MONKOSサービスリンク：
- ポータル（メイン）：https://monkos.ai
- AI証明写真（日本語）：https://idphoto-jp.monkos.ai/app
- AI証明写真（韓国語）：https://idphoto-kr.monkos.ai/app
- 無料クロップアプリ：https://monkos.ai/crop
- 証明写真規格DB（202カ国）：https://monkos.ai/specs
- ブログ：https://monkos.ai/blog
- 料金案内：https://monkos.ai/pricing
- モンク写真館（オフライン）：https://monk.kr
- カスタマーサポート：info@monkos.ai
- Telegram CS：@monkos_support_bot', 8);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('service_flow_ja', 'service', 'ja', 'サービスご利用の流れ',
'使い方,how to,フロー,flow,ステップ,step,順序,利用,usage',
'MONKOS AI証明写真のご利用フロー：

1️⃣ 撮影準備：用途選択（パスポート/履歴書等）→ 服装・ヘアガイド確認
2️⃣ リアルタイムコーチング：AIコーチが姿勢・表情・照明をリアルタイムにご案内
3️⃣ AI生成：撮影完了後AIが証明写真を自動生成（10クレジット）
4️⃣ 結果確認：生成写真プレビュー + 品質検証（QC）
5️⃣ ダウンロード：気に入った写真を高画質ダウンロード（70クレジット）

合計80クレジットでプロ品質の証明写真1枚を完成できます。
追加規格クロップ（10c）やオリジナルダウンロード（10c）も可能です。', 7);

-- ============================
-- KEY ITEMS — English versions
-- ============================

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('credit_system_en', 'billing', 'en', 'Credit System Guide',
'credit,point,generate,download,bonus,free,event,signup',
'MONKOS operates on a credit-based system.
- AI ID photo generation: 10 credits
- High-quality download: 70 credits
- Additional spec crop: 10 credits
- Full original download: 10 credits
- 1 complete photo requires 80 credits (generate 10c + download 70c)
- Signup bonus: 10 credits instantly (Kakao/LINE/Google, one-time)
Credits are refundable if refund conditions are met.', 10);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('refund_policy_en', 'billing', 'en', 'Refund Policy',
'refund,cancel,money,return',
'Refund conditions (strictly applied):
- Within 7 days of purchase + credits completely unused → full refund
- If used even once → no refund (digital content)
- If credits consumed due to system error → automatic credit restoration (not refund)
Refund request: email info@monkos.ai (include purchase email, date, reason)
Processing: review within 5 business days, refund within 3 business days of approval', 9);

INSERT OR REPLACE INTO rag_knowledge (id, category, locale, title, keywords, content, priority) VALUES
('service_urls_en', 'service', 'en', 'Service URLs',
'url,link,address,site,website',
'MONKOS Service Links:
- Portal (main): https://monkos.ai
- AI ID Photo (Korean): https://idphoto-kr.monkos.ai/app
- AI ID Photo (Japanese): https://idphoto-jp.monkos.ai/app
- Free Crop Tool: https://monkos.ai/crop
- ID Photo Specs DB (202 countries): https://monkos.ai/specs
- Blog: https://monkos.ai/blog
- Pricing: https://monkos.ai/pricing
- MONK STUDIO (offline): https://monk.kr
- Support: info@monkos.ai
- Telegram CS: @monkos_support_bot', 8);
