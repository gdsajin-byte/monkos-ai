/**
 * cs_knowledge 브랜드 스토리라인 시드
 * MONK 핵심 카피 + 안전성 + 브랜드 정체성
 * 실행: node seed_cs_brand_story.js
 * 환경: GOOGLE_APPLICATION_CREDENTIALS 또는 ADC 인증 필요
 */

import { Firestore } from '@google-cloud/firestore';
const firestore = new Firestore({ projectId: 'monkos' });
const collection = firestore.collection('cs_knowledge');

const documents = [
  {
    id: 'brand_identity',
    title: 'MONK 브랜드 소개',
    content: `MONK는 20년 경력의 사진작가가 직접 개발한 AI 사진관입니다.
10년 넘게 사진관을 운영한 실전 경험과 20년 사진작가 경력이 녹아있습니다.
태그라인: "사진가의 눈을 가진 AI"
자체 브랜딩한 MONKOS AI가 촬영·보정을 스튜디오 출력 수준으로 제공합니다.
전문 개발자는 아니지만 사진은 압니다. 조명, 배경, 각 국가의 여권·비자 규격까지 완벽히 이해하고 인물사진에 대한 전문성으로 최고 품질의 인물사진 서비스를 제공합니다.
한국, 일본, 글로벌 — 모든 규격을 아는 사진관입니다.`,
    keywords: ['몽크', 'monk', 'モンク', '소개', 'about', '紹介', '뭐하는', '어떤', 'who', 'what', '브랜드', 'brand'],
    category: 'brand',
  },
  {
    id: 'brand_pricing',
    title: '가격 철학 — 합리적 크레딧 시스템',
    content: `AI 증명사진 생성 1회에 10크레딧, 고화질 다운로드 70크레딧입니다.
신규 가입 시 80크레딧을 드리므로, 가입 즉시 무료로 생성까지 체험하실 수 있습니다.
한국 사용자는 토스페이먼츠로 ₩1,450부터 결제 가능하며, 대량 구매 시 최대 30% 할인됩니다.
기업이 아닌 개인이 운영하다 보니 마케팅비를 얹을 여유가 없습니다. 합리적인 가격에 품질로 보답합니다.
20년 사진작가가 직접 만든 AI 엔진, 스튜디오 출력 수준의 품질, 나라별 규격 완벽 대응.
설문 참여 시 12크레딧 추가 지급 이벤트도 진행 중입니다! (매일 선착순 30명, 정오 리셋)`,
    keywords: ['가격', 'price', '価格', '비싸', '싸', 'expensive', 'cheap', '1달러', '원가', 'cost', '왜', 'why', 'なぜ', '비용', 'fee', '料金'],
    category: 'brand',
  },
  {
    id: 'brand_safety_deepfake',
    title: '안전성 — 딥페이크 방지 설계',
    content: `MONK는 사진 편집 앱이 아닙니다. 못해서가 아닙니다. 안 하는 겁니다.
AI 증명사진 시장의 가장 큰 리스크는 "딥페이크" 가능성입니다. 갤러리에서 아무 사진이나 올릴 수 있다면, 내 얼굴로 남이 증명사진을 만들 수 있습니다.
그래서 MONK는:
- 로그인 본인인증 필수 (카카오/LINE/구글)
- 실시간 카메라 촬영만 허용 (갤러리 업로드 차단)
- 정체성 일치율 90% 이상 보장
조금 불편합니다. 하지만 그 불편함이 당신의 얼굴을 지킵니다.`,
    keywords: ['안전', 'safe', '安全', '딥페이크', 'deepfake', 'ディープフェイク', '위험', 'danger', '갤러리', 'gallery', '업로드', 'upload', '왜 직접', '불편'],
    category: 'brand',
  },
  {
    id: 'brand_identity_preservation',
    title: '정체성 보존 90:10 원칙',
    content: `MONK의 AI 보정은 정체성 일치율 90% 이상을 보장합니다.
90% — 정체성 보존: 얼굴 윤곽, 눈·코·입 비율, 골격 구조를 변형하지 않습니다. "나는 나"입니다.
10% — 자연스러운 보정: 피부톤 균일화, 잡티 정리, 조명 보정. 스튜디오에서 찍은 것 같은 마무리입니다.
윤곽 변형, 눈 확대, V라인, 턱 축소 같은 성형 수준의 보정은 하지 않습니다.
아동 여권사진의 경우 얼굴 보정을 일체 적용하지 않습니다 (외무성 규정 준수).
비록 AI 증명사진이지만, "본인 사진"이어야 합니다.`,
    keywords: ['보정', 'retouch', '레터치', '리터치', 'レタッチ', '90', '정체성', 'identity', '자연스러운', 'natural', 'ナチュラル', '변형', '성형', '눈 크기', 'V라인'],
    category: 'brand',
  },
  {
    id: 'brand_data_privacy',
    title: '데이터 보호 정책',
    content: `MONK는 고객의 개인정보와 사진 데이터를 철저히 보호합니다.
- 고객이 동의 없이 제공하는 사진은 서버에 저장하지 않습니다.
- AI 학습에 고객 사진을 사용하지 않습니다.
- 모든 이미지 처리는 AI 엔진 서버에서 처리 후 즉시 삭제됩니다.
- MONK 서버에 남는 것은 로그인 정보와 크레딧 잔액뿐입니다.
"내 얼굴은 내 것입니다."`,
    keywords: ['데이터', 'data', 'データ', '개인정보', 'privacy', 'プライバシー', '저장', 'store', '保存', '학습', 'training', '삭제', 'delete', '사진 보관', '서버'],
    category: 'brand',
  },
  // brand_quality_guarantee: 발급 보장은 미출시 추가 서비스 — 국가별 별도 마케팅으로 분리 예정
  {
    id: 'brand_feedback',
    title: '고객 소통 정책',
    content: `MONK는 고객님의 의견을 적극적으로 듣고 개선합니다.
AS·CS 채널을 운영하고 있으며, 부족한 점에 대한 피드백을 항상 환영합니다.
채널에 남겨주신 한 마디가 다음 업데이트가 됩니다.
텔레그램 채널에서 언제든 의견을 남겨주세요.
고객지원 이메일: info@monkos.ai
텔레그램 CS봇: @monkos_support_bot`,
    keywords: ['피드백', 'feedback', 'フィードバック', '의견', 'opinion', '意見', '불만', 'complaint', '개선', 'improve', '改善', 'cs', '고객', 'customer', 'as', '소통'],
    category: 'brand',
  },
  {
    id: 'brand_why_realtime',
    title: '왜 실시간 촬영만 가능한가',
    content: `MONK에서는 갤러리에서 기존 사진을 올리는 것이 아니라, 실시간 카메라로 직접 촬영합니다.
이유: AI 증명사진 시장의 가장 큰 위험은 딥페이크입니다. 갤러리 업로드를 허용하면 남의 사진으로 증명사진을 만들 수 있습니다.
MONK의 프로세스: 로그인 본인인증 → 실시간 카메라 촬영 → AI 보정(정체성 90%+ 유지) → 결과물 수신.
편한 서비스를 만들 수 있습니다. 하지만 안 합니다. 그 불편함이 당신의 얼굴을 지킵니다.
또한 AI 코칭 기능이 촬영 중 자세, 표정, 조명을 실시간으로 안내해드립니다.`,
    keywords: ['실시간', 'realtime', 'リアルタイム', '카메라', 'camera', 'カメラ', '직접', 'directly', '촬영', 'capture', '撮影', '왜', 'why', '갤러리 안 되', '올리기'],
    category: 'brand',
  },
];

async function seed() {
  console.log('cs_knowledge 브랜드 스토리라인 시드 시작...');
  for (const doc of documents) {
    const { id, ...data } = doc;
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    await collection.doc(id).set(data, { merge: true }); // merge로 기존 데이터 보존
    console.log(`  ✓ ${id}: ${data.title}`);
  }
  console.log(`완료: ${documents.length}건 시드됨 (merge 모드)`);
}

seed().catch(console.error);
