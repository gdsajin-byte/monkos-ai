/**
 * faq_items Firestore 초기 데이터 시드 — FAQ 확정본 (KO/EN/JA 각 13건, 총 39건)
 * 실행: node seed_faq.js
 * 환경: GOOGLE_APPLICATION_CREDENTIALS 또는 ADC 인증 필요
 *
 * ⚠️ 헌법 5조 1항 — FAQ 원본 문구 그대로 시딩. 임의 수정 금지
 * ⚠️ 헌법 4조 1항 — 기존 데이터 백업 확인 후 진행
 */

import { Firestore } from '@google-cloud/firestore';
const firestore = new Firestore({ projectId: 'monkos' });
const collection = firestore.collection('faq_items');

const faqItemsKo = [
  {
    id: 'faq_ko_01',
    question: 'MONKOS AI는 어떤 서비스인가요?',
    answer: `MONKOS AI는 AI 기반 Photo, Beauty, LookBook, Models 등 이미지 관련 솔루션을 제공하는 플랫폼입니다. 생성형 AI와 LLM 모델을 정교한 파이프라인으로 설계·구축하여 실사 수준의 이미지 서비스 제공을 목표로 하고 있습니다.

현재 증명사진 서비스가 우선적으로 오픈되었습니다. 사진작가 경력 20년·스튜디오 운영 12년차의 베테랑 작가와 뷰티 실무 7년 이상의 연구원(관련학 박사과정)이 함께 연구·개발하고 있습니다. 실제 스튜디오를 운영하고 있는 현장 전문가들이며, 조명·배경·피부톤·포즈·의상·헤어 등 모든 요소에서 완벽을 기하기 위해 노력하고 있습니다.`,
    category: '서비스 소개',
    order: 1,
  },
  {
    id: 'faq_ko_02',
    question: '증명사진은 어떤 규격을 지원하나요?',
    answer: `현재 ICAO 기준 여권사진 규격(3.5cm × 4.5cm)과 일반적으로 많이 사용되는 반명함 증명사진(학생증, 이력서사진 등 대응)을 제공하고 있습니다.`,
    category: '서비스 소개',
    order: 2,
  },
  {
    id: 'faq_ko_03',
    question: '앞으로 어떤 서비스를 준비하고 있나요?',
    answer: `MONKOS AI는 이미지 관련 토털 AI 서비스를 지향하고 있습니다. 사진 전문가, 뷰티 전문가, 디자인 전문가가 함께 일하고 있으며, 매우 빠른 개발과 서비스 대응을 완성해 나가고 있습니다.

앞으로 이미지 관련 다양한 서비스 확장을 통해 소통형 AI 서비스 업체로서 성장해 나갈 것입니다.`,
    category: '서비스 소개',
    order: 3,
  },
  {
    id: 'faq_ko_04',
    question: '셀카 한 장으로 정말 증명사진이 되나요?',
    answer: `최초 시도 시에는 여러 각도의 사진을 입력해야만 만족스러운 결과가 나왔습니다. 최근 생성형 AI 모델들의 성능이 폭발적으로 향상되어 셀카 한 장으로도 정체성 일치율 90% 이상을 달성하는 수준에 이르고 있습니다.

그동안 쌓아온 사진 실무 노하우와 수많은 테스트를 거쳐 선별한 AI 모델을 결합하여, 저희 스튜디오 증명사진 상품에 크게 뒤쳐지지 않는 수준에 이르고 있습니다. 촬영 환경도 예전처럼 밝고 깨끗한 배경이 아니더라도, 어느 정도 범위 안에서만 촬영된다면 충분히 좋은 퀄리티의 실사 증명사진을 받아보실 수 있습니다.`,
    category: '품질과 기술',
    order: 4,
  },
  {
    id: 'faq_ko_05',
    question: 'AI가 만든 사진인데, 실제 나와 다르게 나오지는 않나요?',
    answer: `AI 생성 사진의 정체성 유지율은 업계 최고의 화두이자 벤치마크 소재입니다. 수많은 AI 모델들이 있지만 예쁜 인형이나 만화 같다거나 AI 티가 많이 나는 모델들이 대부분인 것도 사실입니다. 여권사진에도 통과할 정도로 실사 수준의 퀄리티를 제공할 수 있는 AI 모델은 현재로서 극소수입니다.

MONKOS AI가 채택한 모델은 20년 경력의 사진작가 기준으로 보아도 정체성 표현 최소 85% 이상을 달성하고 있습니다. 다만 직접 촬영하고 얼굴을 보면서 판단하는 영역이 아니기에 AI가 100% 완벽하다고 말씀드릴 수는 없습니다.

금액을 지불하고 증명사진을 받으셨는데 전혀 다른 사람이라거나 엉뚱한 사진이 출력된다면, 프리뷰 단계에서 멈추시고 재촬영(무료)·재생성(10c)하시길 권장드립니다. 최초 로그인 시 10c를 즉시 제공해 드리기에 **프리뷰까지는 완전 무료**입니다.`,
    category: '품질과 기술',
    order: 5,
  },
  {
    id: 'faq_ko_06',
    question: '스마트폰으로만 사용 가능한가요? PC에서는 안 되나요?',
    answer: `다른 서비스들에 비해 MONKOS AI는 증명사진, 특히 여권·운전면허증 등 신분 관련 사진에 관하여 매우 엄격한 기준을 가지고 있습니다. 바로 **딥페이크(Deepfake)에 대한 원천 차단**에 대한 고민입니다.

오직 비즈니스로만 본다면 전체 오픈하는 것이 모든 면에서 편리하나, 이 경우 타인의 사진을 도용할 위험이 분명히 존재합니다. 더구나 MONKOS AI의 출력 사진은 실사에 거의 흡사하기에 더욱 강한 책임감을 가지고 있습니다.

그런 이유로 다른 서비스와는 다르게 **로그인으로 인증된 계정의 모바일 실시간 셀프 촬영본만을 입력**받고 있습니다. 조금은 불편하시겠지만 이해해 주셨으면 합니다. 향후 다른 서비스에서는 PC 입력도 지원할 수 있도록 검토하고 있습니다.`,
    category: '품질과 기술',
    order: 6,
  },
  {
    id: 'faq_ko_07',
    question: '가격은 얼마인가요? 크레딧 시스템이 어떻게 되나요?',
    answer: `MONKOS AI는 크레딧 가격 정책을 운영하고 있으며, **10c = $1** 기준입니다.

**증명사진 가격 구성:**
- 자동 촬영: 무료
- 리터칭 생성: 10c (프리뷰 제공)
- 고화질 원본 다운로드: 70c
- **총 80c**

크레딧은 앱 내에서 구매 가능하시며, 환불 및 크레딧 운영 정책 등은 자세한 문서가 준비되어 있습니다.`,
    category: '가격과 결제',
    order: 7,
  },
  {
    id: 'faq_ko_08',
    question: '해외에서도 사용할 수 있나요?',
    answer: `네, MONKOS AI는 글로벌 서비스를 지향하고 있습니다. 현재는 한국·일본·영어권을 중심으로 언어 세팅이 되어 있으며, 한국은 토스페이먼츠, 일본 및 글로벌 서비스에는 Lemon Squeezy를 통해서 결제가 가능합니다.`,
    category: '가격과 결제',
    order: 8,
  },
  {
    id: 'faq_ko_09',
    question: '사진이 마음에 안 들면 어떻게 하나요?',
    answer: `네, 얼마든지 **무료 재촬영이 가능**합니다. 과금되는 단계는 리터칭 생성(10c)과 완성본 다운로드(70c) 과정입니다.

촬영 준비를 깔끔하게 하시고 사진 종류·성별·연령대·의상·헤어 등을 잘 선택하신 후에 촬영해 주세요. AI가 몇 가지를 체크한 후 자동으로 촬영해 드립니다.

**촬영 팁:**
- 정면을 잘 보시고 가이드 원 안에 얼굴 정면을 잘 고정해 주세요
- 그림자가 너무 세거나 어두운 곳을 피해 주세요
- 방해가 많은 곳, 조명에 색이 섞인 곳을 피해 주세요
- 이 정도만 지켜주시면 AI가 대부분 잘 처리해 드립니다

촬영본은 바로 보실 수 있으니 마음에 안 드시면 얼마든지 재촬영하셔도 좋습니다.`,
    category: '촬영과 사용법',
    order: 9,
  },
  {
    id: 'faq_ko_10',
    question: '무료 크롭앱은 뭔가요?',
    answer: `증명사진 서비스는 촬영·리터칭 생성·완료본(크롭되지 않은 원본)을 받으시는 서비스입니다.

**MONKOS CROP**은 자체 개발하여 무료 배포하고 있는 별도 서비스입니다. 여권 규격을 정밀 계산하여 규정에 완벽히 부합하는 파일로 크롭하는 앱입니다. 이 서비스는 촬영·생성이 아닌 사진 트리밍에만 관여하며, 정수리 위치와 눈 위치, 사진 화각 등을 세팅하는 서비스로서 **매우 정교한 크롭·트리밍**을 제공합니다.

차후 각국의 비자나 별도 용도로서의 크롭 서비스로 발전시켜 나가겠습니다.

→ [crop.monkos.ai](https://crop.monkos.ai)`,
    category: '촬영과 사용법',
    order: 10,
  },
  {
    id: 'faq_ko_11',
    question: 'MONKOS AI 증명사진은 여권사진으로 사용할 수 있나요?',
    answer: `MONKOS AI는 ICAO 국제 규격에 부합하는 증명사진을 생성합니다. 크기·비율·배경색·해상도 등 공식 규격을 정밀하게 적용하며, 무료 크롭앱(MONKOS CROP)을 통해 규정에 맞는 최종 파일을 만드실 수 있습니다.`,
    category: '규격과 안전',
    order: 11,
  },
  {
    id: 'faq_ko_12',
    question: '개인정보는 안전한가요? 제 셀카가 어딘가에 저장되나요?',
    answer: `네, 고객님의 개인정보는 안전합니다. 촬영된 사진을 AI가 처리하기 위해서는 서버를 거칠 수밖에 없으나, MONKOS AI는 Google Cloud 인프라 기반으로 운영되며 생성 즉시 암호화되어 정해진 기간 저장 후 자동 삭제됩니다. 동의 절차 없이 마케팅 등에 무단 사용하거나 AI 학습에 활용하지 않습니다.

**데이터 보관 정책:**
- **기본 30일 보관**: 서비스 제공 후 30일간 재다운로드·AS·환불 검증을 위해 보관되며, 이후 자동 삭제됩니다. 자세한 법적 근거는 [개인정보처리방침](https://monkos.ai/privacy)을 참고해 주세요.
- **탈퇴 시까지 보관 (선택)**: 마이페이지에서 보관 연장에 동의하시면 계정 탈퇴 시까지 보관되며, 언제든 재다운로드하실 수 있습니다. 탈퇴 시 즉시 삭제됩니다.

모든 서비스는 각 국가별 개인정보법, 초상권에 관한 법률 등을 준수하고 있습니다.`,
    category: '규격과 안전',
    order: 12,
  },
  {
    id: 'faq_ko_13',
    question: '고객지원은 어떻게 받을 수 있나요?',
    answer: `- **게시판**: [monkos.ai](https://monkos.ai) 공식 포털 페이지의 게시판에 글을 남겨 주세요
- **AI 챗봇**: 서비스를 잘 이해하고 있는 챗봇에게 문의해 보세요
- **이메일**: 더욱 중요한 사항은 공식 이메일 **info@monkos.ai**로 문의해 주시면 성심껏 대응하겠습니다`,
    category: '고객지원',
    order: 13,
  },
];

const faqItemsEn = [
  {
    id: 'faq_en_01',
    question: 'What is MONKOS AI?',
    answer: `MONKOS AI is a platform that provides AI-powered image solutions, including Photo, Beauty, LookBook, and Models. We combine generative AI and LLM models through a precision-engineered pipeline to deliver photo-realistic image services.

Our ID photo service is currently live. The team includes a veteran photographer with 20 years of experience and 12 years of studio management, alongside a beauty researcher (doctoral candidate) with over 7 years of hands-on practice. As working studio professionals, we strive for perfection in every detail — lighting, backgrounds, skin tones, poses, attire, and hair.`,
    category: 'About the Service',
    order: 1,
  },
  {
    id: 'faq_en_02',
    question: 'What ID photo formats do you support?',
    answer: `We currently offer ICAO-standard passport photos (3.5cm × 4.5cm) and standard ID photos (3cm × 4cm) commonly used for student IDs, resumes, and similar purposes.`,
    category: 'About the Service',
    order: 2,
  },
  {
    id: 'faq_en_03',
    question: 'What services are you working on next?',
    answer: `MONKOS AI aims to become a comprehensive AI image service. Our team of photography, beauty, and design professionals is rapidly building and expanding our capabilities.

We are committed to growing as a communication-oriented AI service provider through a wide range of image-related offerings.`,
    category: 'About the Service',
    order: 3,
  },
  {
    id: 'faq_en_04',
    question: 'Can a single selfie really produce an ID photo?',
    answer: `In the early stages, multiple photos from different angles were needed to achieve satisfactory results. With the explosive improvement in recent generative AI models, we can now achieve over 90% identity consistency from just one selfie.

By combining our decades of studio expertise with carefully selected AI models tested through extensive trials, we have reached a quality level that closely approaches our studio-grade ID photos. You no longer need a bright, clean background — as long as shooting conditions fall within a reasonable range, you can expect high-quality, realistic ID photos.`,
    category: 'Quality & Technology',
    order: 4,
  },
  {
    id: 'faq_en_05',
    question: "It's AI-generated — will it actually look like me?",
    answer: `Maintaining identity fidelity in AI-generated photos is the industry's top priority and benchmark. While many AI models exist, most produce results that look like dolls, cartoons, or have an obvious AI appearance. Very few models can deliver the photo-realism required even for passport submissions.

The model adopted by MONKOS AI achieves at least 85% identity accuracy as evaluated by our photographer with 20 years of experience. However, since AI cannot see your face in person the way a photographer would, we cannot claim 100% perfection.

If you receive a result that looks nothing like you, we recommend stopping at the preview stage and retaking (free) or regenerating (10c). Since we provide 10c immediately upon your first login, **previews are completely free**.`,
    category: 'Quality & Technology',
    order: 5,
  },
  {
    id: 'faq_en_06',
    question: 'Is it mobile-only? Can I use it on a PC?',
    answer: `Compared to other services, MONKOS AI maintains very strict standards for ID photos — especially for identity documents like passports and driver's licenses. This stems from our commitment to **preventing deepfake misuse**.

From a pure business standpoint, opening the service to all platforms would be more convenient. However, this creates a clear risk of someone using another person's photo. Given that MONKOS AI produces near-photorealistic output, we take this responsibility seriously.

For this reason, unlike other services, **we only accept real-time mobile selfies taken through an authenticated account**. We appreciate your understanding. We are exploring PC input support for other services in the future.`,
    category: 'Quality & Technology',
    order: 6,
  },
  {
    id: 'faq_en_07',
    question: 'How much does it cost? How does the credit system work?',
    answer: `MONKOS AI operates on a credit-based pricing system, where **10c = $1**.

**ID photo pricing breakdown:**
- Auto-capture: Free
- Retouching & generation: 10c (preview included)
- High-resolution download: 70c
- **Total: 80c**

Credits can be purchased within the app. Detailed documentation on refund and credit policies is available on our website.`,
    category: 'Pricing & Payment',
    order: 7,
  },
  {
    id: 'faq_en_08',
    question: 'Can I use it from outside Korea?',
    answer: `Yes, MONKOS AI is designed as a global service. We currently support Korean, Japanese, and English. Payments in Korea are processed through Toss Payments, while international and Japanese payments are handled through Lemon Squeezy.`,
    category: 'Pricing & Payment',
    order: 8,
  },
  {
    id: 'faq_en_09',
    question: "What if I'm not happy with my photo?",
    answer: `You can **retake photos as many times as you like — for free**. Charges only apply at the retouching stage (10c) and the final download stage (70c).

Please prepare yourself neatly and select the appropriate photo type, gender, age range, attire, and hairstyle before shooting. The AI will run a few checks and then capture your photo automatically.

**Shooting tips:**
- Look straight ahead and keep your face centered within the guide circle
- Avoid areas with harsh shadows or poor lighting
- Avoid busy environments or locations with colored lighting
- Follow these simple steps and the AI will handle the rest

You can view your capture immediately — feel free to retake as many times as you'd like.`,
    category: 'Capturing & Usage',
    order: 9,
  },
  {
    id: 'faq_en_10',
    question: 'What is the free crop app?',
    answer: `The ID photo service provides capture, AI retouching, and the finished photo (uncropped original).

**MONKOS CROP** is a separate, free app we developed in-house. It precisely calculates passport specifications and crops your photo to fully comply with official requirements. This tool focuses solely on photo trimming — adjusting the crown position, eye position, and photo framing to deliver **highly precise cropping and trimming**.

We plan to expand this into a cropping service for various visa types and other document requirements across different countries.

→ [crop.monkos.ai](https://crop.monkos.ai)`,
    category: 'Capturing & Usage',
    order: 10,
  },
  {
    id: 'faq_en_11',
    question: 'Can MONKOS AI photos be used for passports?',
    answer: `MONKOS AI generates ID photos that comply with ICAO international standards. We precisely apply official specifications for size, ratio, background color, and resolution. You can use our free crop app (MONKOS CROP) to produce a final file that meets all regulatory requirements.`,
    category: 'Standards & Safety',
    order: 11,
  },
  {
    id: 'faq_en_12',
    question: 'Is my personal data safe? Are my selfies stored somewhere?',
    answer: `Yes, your personal data is safe. While photos must pass through our servers for AI processing, MONKOS AI operates on Google Cloud infrastructure. All data is encrypted immediately upon generation and automatically deleted after a defined retention period. We never use your data for marketing or AI training without your consent.

**Data retention policy:**
- **30-day default retention**: After service delivery, your data is retained for 30 days to support re-downloads, customer service, and refund verification, then automatically deleted. For the full legal basis, please refer to our [Privacy Policy](https://monkos.ai/privacy).
- **Retention until account deletion (optional)**: If you opt in to extended retention on your profile page, your data will be kept until you delete your account, and you can re-download at any time. Data is deleted immediately upon account deletion.

All services comply with applicable privacy and portrait rights laws in each country of operation.`,
    category: 'Standards & Safety',
    order: 12,
  },
  {
    id: 'faq_en_13',
    question: 'How can I reach customer support?',
    answer: `- **Board**: Leave a message on our official portal at [monkos.ai](https://monkos.ai)
- **AI Chatbot**: Ask our chatbot — it's well-versed in our services
- **Email**: For important matters, please contact us at **info@monkos.ai** and we'll respond promptly`,
    category: 'Customer Support',
    order: 13,
  },
];

const faqItemsJa = [
  {
    id: 'faq_ja_01',
    question: 'MONKOS AIはどのようなサービスですか？',
    answer: `MONKOS AIは、AI技術を活用したPhoto、Beauty、LookBook、Modelsなど、画像関連ソリューションを提供するプラットフォームです。生成AIとLLMモデルを精密なパイプラインで設計・構築し、実写レベルの画像サービスの提供を目指しています。

現在、証明写真サービスが先行オープンしています。写真歴20年・スタジオ運営12年のベテランフォトグラファーと、ビューティー実務7年以上の研究員（関連学博士課程）が共同で研究・開発を行っています。実際にスタジオを運営している現場のプロフェッショナルであり、ライティング・背景・肌色・ポーズ・衣装・ヘアなど、すべての要素において完璧を期しています。`,
    category: 'サービス紹介',
    order: 1,
  },
  {
    id: 'faq_ja_02',
    question: '証明写真はどのような規格に対応していますか？',
    answer: `現在、ICAO基準のパスポート写真規格（3.5cm × 4.5cm）と、一般的に多く使用される証明写真（3cm × 4cm）（学生証・履歴書用写真などに対応）をご提供しています。`,
    category: 'サービス紹介',
    order: 2,
  },
  {
    id: 'faq_ja_03',
    question: '今後、どのようなサービスを準備していますか？',
    answer: `MONKOS AIは、画像関連のトータルAIサービスを目指しています。写真の専門家、ビューティーの専門家、デザインの専門家がチームとして活動しており、非常にスピーディーな開発とサービス対応を実現しています。

今後、画像関連のさまざまなサービスを展開し、コミュニケーション型AIサービス企業として成長してまいります。`,
    category: 'サービス紹介',
    order: 3,
  },
  {
    id: 'faq_ja_04',
    question: 'セルフィー1枚で本当に証明写真になりますか？',
    answer: `初期段階では、複数のアングルからの写真を入力しなければ満足のいく結果が得られませんでした。最近の生成AIモデルの性能が飛躍的に向上し、セルフィー1枚でも本人一致率90%以上を達成できるレベルに到達しています。

これまで培ってきた写真実務のノウハウと、数多くのテストを経て厳選したAIモデルを組み合わせることで、私たちのスタジオ証明写真に大きく劣らないクオリティを実現しています。撮影環境も以前のように明るくきれいな背景でなくても、ある程度の範囲内であれば十分に高品質な実写証明写真をお受け取りいただけます。`,
    category: '品質と技術',
    order: 4,
  },
  {
    id: 'faq_ja_05',
    question: 'AIが作った写真なのに、実際の自分と違って見えませんか？',
    answer: `AI生成写真の本人一致率は、業界最大の課題でありベンチマーク指標です。多くのAIモデルが存在しますが、きれいな人形やイラストのようになったり、AI感が強く出るモデルがほとんどであるのも事実です。パスポート写真としても通用するほどの実写レベルを提供できるAIモデルは、現時点では極めて限られています。

MONKOS AIが採用しているモデルは、20年の経歴を持つフォトグラファーの基準で見ても、本人一致率85%以上を達成しています。ただし、直接撮影してお顔を見ながら判断する領域ではないため、AIが100%完璧であるとは申し上げられません。

料金をお支払いいただいて証明写真をお受け取りになったのに、まったく別人であったり不適切な写真が出力された場合は、プレビュー段階で止めていただき、再撮影（無料）・再生成（10c）をおすすめします。初回ログイン時に10cを即時付与しておりますので、**プレビューまでは完全無料**です。`,
    category: '品質と技術',
    order: 5,
  },
  {
    id: 'faq_ja_06',
    question: 'スマートフォンでしか使えないのですか？PCでは利用できませんか？',
    answer: `他のサービスと比較して、MONKOS AIは証明写真、特にパスポートや運転免許証などの身分関連写真について非常に厳格な基準を設けています。それは、**ディープフェイク（Deepfake）の根本的な防止**に対する取り組みです。

ビジネスの観点だけで見れば、すべてのプラットフォームに開放する方がはるかに便利です。しかしその場合、他人の写真を不正使用されるリスクが明らかに存在します。MONKOS AIの出力写真は実写にほぼ近いため、より強い責任感を持って対応しています。

このような理由から、他のサービスとは異なり、**ログインで認証されたアカウントのモバイルリアルタイムセルフィーのみを入力として受け付けて**います。少しご不便をおかけしますが、ご理解いただけますと幸いです。今後、他のサービスにおいてはPC入力のサポートも検討しています。`,
    category: '品質と技術',
    order: 6,
  },
  {
    id: 'faq_ja_07',
    question: '料金はいくらですか？クレジットシステムはどうなっていますか？',
    answer: `MONKOS AIはクレジット制の料金体系を採用しており、**10c = $1**が基準です。

**証明写真の料金構成：**
- 自動撮影：無料
- リタッチ生成：10c（プレビュー付き）
- 高画質オリジナルダウンロード：70c
- **合計 80c**

クレジットはアプリ内でご購入いただけます。返金およびクレジット運用ポリシーの詳細は、ウェブサイトに掲載しております。`,
    category: '料金とお支払い',
    order: 7,
  },
  {
    id: 'faq_ja_08',
    question: '海外からも利用できますか？',
    answer: `はい、MONKOS AIはグローバルサービスを目指しています。現在、韓国語・日本語・英語に対応しており、韓国ではToss Payments、日本およびグローバルサービスではLemon Squeezyを通じてお支払いが可能です。`,
    category: '料金とお支払い',
    order: 8,
  },
  {
    id: 'faq_ja_09',
    question: '写真が気に入らない場合はどうすればいいですか？',
    answer: `はい、**何度でも無料で再撮影が可能**です。課金が発生するのは、リタッチ生成（10c）と完成写真のダウンロード（70c）の段階のみです。

身だしなみを整えた上で、写真の種類・性別・年齢層・衣装・ヘアスタイルなどを適切に選択してから撮影してください。AIがいくつかの項目をチェックした後、自動的に撮影いたします。

**撮影のコツ：**
- 正面をしっかり見て、ガイド円の中に顔をきちんと合わせてください
- 影が強すぎる場所や暗い場所は避けてください
- 周囲が騒がしい場所や、色のついた照明がある場所は避けてください
- これだけ守っていただければ、AIがほとんどの処理をうまく行います

撮影した写真はすぐにご確認いただけますので、気に入らなければ何度でも再撮影してください。`,
    category: '撮影と使い方',
    order: 9,
  },
  {
    id: 'faq_ja_10',
    question: '無料クロップアプリとは何ですか？',
    answer: `証明写真サービスは、撮影・AIリタッチ生成・完成写真（クロップされていないオリジナル）をお渡しするサービスです。

**MONKOS CROP**は、当社が独自に開発し無料で配布している別サービスです。パスポート規格を精密に計算し、規定に完全に適合するファイルにクロップするアプリです。撮影や生成ではなく、写真のトリミングのみに特化しており、頭頂部の位置と目の位置、写真の画角などを設定する**非常に精密なクロップ・トリミング**を提供します。

今後、各国のビザやその他の用途に対応するクロップサービスへと発展させてまいります。

→ [crop.monkos.ai](https://crop.monkos.ai)`,
    category: '撮影と使い方',
    order: 10,
  },
  {
    id: 'faq_ja_11',
    question: 'MONKOS AIの証明写真はパスポート写真として使用できますか？',
    answer: `MONKOS AIは、ICAO国際規格に適合した証明写真を生成します。サイズ・比率・背景色・解像度などの公式規格を精密に適用しており、無料クロップアプリ（MONKOS CROP）を通じて規定に準拠した最終ファイルを作成いただけます。`,
    category: '規格と安全性',
    order: 11,
  },
  {
    id: 'faq_ja_12',
    question: '個人情報は安全ですか？私のセルフィーはどこかに保存されますか？',
    answer: `はい、お客様の個人情報は安全です。撮影された写真をAIが処理するためにはサーバーを経由する必要がありますが、MONKOS AIはGoogle Cloudインフラ上で運営されており、生成即時に暗号化され、定められた期間保管後に自動削除されます。お客様の同意なくマーケティング等に無断使用したり、AI学習に活用することはありません。

**データ保管ポリシー：**
- **基本30日保管**：サービス提供後30日間、再ダウンロード・アフターサービス・返金検証のために保管され、その後自動的に削除されます。詳しい法的根拠は[プライバシーポリシー](https://monkos.ai/privacy)をご参照ください。
- **退会時まで保管（任意選択）**：マイページで保管延長に同意いただくと、アカウント退会時まで保管され、いつでも再ダウンロードが可能です。退会時に即時削除されます。

すべてのサービスは、各国の個人情報保護法（日本では個人情報保護法/APPI）および肖像権に関する法律を遵守しています。`,
    category: '規格と安全性',
    order: 12,
  },
  {
    id: 'faq_ja_13',
    question: 'カスタマーサポートへの問い合わせ方法は？',
    answer: `- **掲示板**：[monkos.ai](https://monkos.ai) 公式ポータルページの掲示板にメッセージをお寄せください
- **AIチャットボット**：サービスに精通したチャットボットにお気軽にお尋ねください
- **メール**：重要なお問い合わせは、公式メール **info@monkos.ai** までご連絡ください。誠心誠意対応いたします`,
    category: 'カスタマーサポート',
    order: 13,
  },
];

const allFaqItems = [
  ...faqItemsKo.map(item => ({ ...item, lang: 'ko' })),
  ...faqItemsEn.map(item => ({ ...item, lang: 'en' })),
  ...faqItemsJa.map(item => ({ ...item, lang: 'ja' })),
];

async function seed() {
  // 1. 기존 데이터 확인 및 백업 (헌법 4조 1항)
  console.log('=== faq_items 기존 데이터 확인 ===');
  const existing = await collection.get();
  if (existing.size > 0) {
    console.log(`기존 ${existing.size}건 발견 — 백업 출력 후 삭제`);
    for (const doc of existing.docs) {
      console.log(`  [백업] ${doc.id}: ${doc.data().question || '(no question)'}`);
    }
    // 기존 데이터 삭제
    const batch = firestore.batch();
    for (const doc of existing.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    console.log(`기존 ${existing.size}건 삭제 완료`);
  } else {
    console.log('기존 데이터 없음 — 클린 시딩 진행');
  }

  // 2. FAQ 시딩 (KO/EN/JA 총 39건)
  console.log('\n=== FAQ 시딩 시작 (KO/EN/JA 각 13건, 총 39건) ===');
  const now = new Date().toISOString();
  for (const item of allFaqItems) {
    const { id, lang, ...data } = item;
    data.lang = lang;
    data.published = true;
    data.createdAt = now;
    data.updatedAt = now;
    await collection.doc(id).set(data);
    console.log(`  ✓ ${id} [${lang}]: ${data.question}`);
  }
  console.log(`\n완료: ${allFaqItems.length}건 시딩됨`);
}

seed().catch(console.error);
