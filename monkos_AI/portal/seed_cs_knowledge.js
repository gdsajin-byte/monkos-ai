/**
 * cs_knowledge Firestore 초기 데이터 시드
 * 실행: node seed_cs_knowledge.js
 * 환경: GOOGLE_APPLICATION_CREDENTIALS 또는 ADC 인증 필요
 */

import { Firestore } from '@google-cloud/firestore';
const firestore = new Firestore({ projectId: 'monkos' });
const collection = firestore.collection('cs_knowledge');

const documents = [
  {
    id: 'credit_system',
    title: '크레딧 시스템 안내',
    content: `MONKOS는 크레딧 기반으로 운영됩니다.
- AI 증명사진 리터칭: 10크레딧 소모
- 고화질 다운로드: 70크레딧 소모
- 1장 완성에 총 80크레딧 필요 (리터칭 10c + 다운로드 70c)
- 신규 가입 보너스: 10크레딧 즉시 지급 (카카오/LINE/Google 전 프로바이더 동일, 1회)
크레딧은 구매 후 환불 조건을 충족하면 환불 가능합니다.`,
    keywords: ['크레딧', 'credit', 'クレジット', '포인트', 'point', '생성', '다운로드', '공유', '보너스', '무료', '이벤트', '가입', '동의'],
    category: 'billing',
  },
  {
    id: 'credit_purchase',
    title: '크레딧 구매 방법',
    content: `크레딧 구매 옵션:

[한국 사용자 — 토스페이먼츠]
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

결제 후 즉시 크레딧이 반영됩니다. 반영이 안 될 경우 몇 분 대기 후 새로고침 해주세요.
신규 가입 시 10크레딧 보너스가 지급됩니다.`,
    keywords: ['구매', 'purchase', '購入', '결제', 'payment', '支払い', '가격', 'price', '料金', 'toss', 'lemon', '패키지'],
    category: 'billing',
  },
  {
    id: 'refund_policy',
    title: '환불 정책',
    content: `환불 조건 (엄격 적용):
- 구매 후 7일 이내 + 크레딧 완전 미사용 → 전액 환불
- 1회라도 사용한 경우 → 환불 불가 (디지털 콘텐츠 특성)
- 시스템 장애로 크레딧이 소모된 경우 → 환불이 아닌 크레딧 자동 복구
환불 신청: info@monkos.ai 으로 이메일 (구매 이메일, 구매일, 사유 기재)
처리 기간: 신청 후 5영업일 이내 심사, 환불 결정일로부터 3영업일 이내 처리`,
    keywords: ['환불', 'refund', '返金', '취소', 'cancel', 'キャンセル', '돈', 'money', '반환'],
    category: 'billing',
  },
  {
    id: 'photo_quality',
    title: '사진 품질 개선 가이드',
    content: `AI 증명사진 품질을 높이려면:
1. 정면을 바라보고 촬영 (좌우 대칭)
2. 밝은 조명 (자연광 또는 실내 조명 정면)
3. 단색 배경 권장 (흰 벽 등)
4. 어깨가 보이도록 상반신 촬영
5. 표정: 자연스러운 미소 또는 무표정
6. AI 코칭 기능의 안내에 따라주세요
촬영 팁을 따르면 1회 생성으로도 좋은 결과를 얻을 수 있습니다.`,
    keywords: ['품질', 'quality', '品質', '사진', 'photo', '写真', '촬영', '흐릿', 'blur', '밝기', '조명', 'lighting'],
    category: 'service',
  },
  {
    id: 'login_issue',
    title: '로그인 문제 해결',
    content: `MONKOS는 카카오(한국), LINE(일본), Google(글로벌) 계정으로 로그인할 수 있습니다.
로그인이 안 될 경우:
1. 브라우저 캐시/쿠키 삭제 후 재시도
2. 시크릿/프라이빗 모드에서 시도
3. 다른 브라우저(Chrome 권장)에서 시도
4. 팝업 차단이 해제되어 있는지 확인
5. 위 방법으로 해결 안 될 경우 info@monkos.ai 으로 문의`,
    keywords: ['로그인', 'login', 'ログイン', '접속', '계정', 'account', 'アカウント', 'google', '구글', '카카오', 'kakao', 'line', 'ライン'],
    category: 'technical',
  },
  {
    id: 'service_urls',
    title: '서비스 URL 안내',
    content: `MONKOS AI 서비스 링크:
- 포털 (메인): https://monkos.ai
- AI 증명사진 (일본어): https://idphoto-jp.monkos.ai/app
- AI 증명사진 (한국어): https://idphoto-kr.monkos.ai/app
- 고객지원 이메일: info@monkos.ai
- 텔레그램 CS: @monkos_support_bot`,
    keywords: ['url', 'link', 'リンク', '링크', '주소', 'address', 'サイト', '사이트', 'website'],
    category: 'general',
  },
  {
    id: 'account_deletion',
    title: '계정 삭제 요청',
    content: `계정 삭제를 원하시면:
- info@monkos.ai 으로 이메일 요청
- 제목: "계정 삭제 요청"
- 내용: 가입 시 사용한 계정정보 (카카오/LINE/Google) 기재
- 처리 기간: 영업일 기준 5~7일
- 삭제 시 모든 데이터(크레딧, 생성 이력)가 영구 삭제됩니다.
- 미사용 크레딧이 남아 있다면 환불 조건 확인 후 환불 신청을 먼저 해주세요.`,
    keywords: ['삭제', 'delete', '削除', '탈퇴', 'withdrawal', '退会', '계정', 'account'],
    category: 'account',
  },
  {
    id: 'supported_photo_types',
    title: '지원하는 증명사진 종류',
    content: `MONKOS AI 증명사진에서 생성 가능한 유형:
- 여권/비자용 증명사진
- 이력서/취업용 증명사진
- 학생증/사원증용 증명사진
- 비즈니스 프로필 사진
- 마이나넘버카드(JP)
- 주민등록증(KR)
성별(남성/여성)과 연령대를 선택하면 적합한 복장이 자동 적용됩니다.
배경은 순백(#FFFFFF)으로 고정, 비율 3:4 표준 규격입니다.`,
    keywords: ['증명사진', 'id photo', '証明写真', '여권', 'passport', 'パスポート', '이력서', 'resume', '履歴書', '종류', 'type'],
    category: 'service',
  },
  {
    id: 'payment_methods',
    title: '결제수단 안내',
    content: `MONKOS 결제수단 현황:

[한국]
- 토스페이먼츠: 카드결제, 간편결제(토스페이, 카카오페이 등)

[글로벌 (일본 포함)]
- Lemon Squeezy: 카드결제 (Visa, Mastercard, AMEX 등), PayPal, Apple Pay, Google Pay
- ⚠️ 일본 편의점 결제(コンビニ決済)는 현재 미지원입니다
- 일본 사용자는 카드결제 또는 PayPal을 이용해주세요`,
    keywords: ['결제', 'payment', '支払い', '決済', '카드', 'card', 'カード', '편의점', 'コンビニ', 'convenience', 'toss', 'lemon', 'paypal'],
    category: 'billing',
  },
  {
    id: 'service_flow',
    title: '서비스 이용 흐름',
    content: `MONKOS AI 증명사진 이용 흐름 (v5):

1️⃣ 촬영 준비: 용도 선택 (여권/이력서 등) → 의상/헤어 가이드 확인
2️⃣ 실시간 코칭: AI 코치가 자세·표정·조명을 실시간 안내
3️⃣ AI 생성: 촬영 완료 후 AI가 증명사진 자동 생성 (10크레딧)
4️⃣ 결과 확인: 생성된 사진 미리보기 + 품질 검증(QC)
5️⃣ 다운로드: 마음에 드는 사진 고화질 다운로드 (70크레딧)

총 80크레딧으로 프로 품질의 증명사진 1장을 완성할 수 있습니다.`,
    keywords: ['사용법', 'how to', '使い方', '흐름', 'flow', 'フロー', '순서', 'step', 'ステップ', '이용', 'usage'],
    category: 'service',
  },
];

async function seed() {
  console.log('cs_knowledge 시드 시작...');
  for (const doc of documents) {
    const { id, ...data } = doc;
    data.createdAt = new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    await collection.doc(id).set(data);
    console.log(`  ✓ ${id}: ${data.title}`);
  }
  console.log(`완료: ${documents.length}건 시드됨`);
}

seed().catch(console.error);
