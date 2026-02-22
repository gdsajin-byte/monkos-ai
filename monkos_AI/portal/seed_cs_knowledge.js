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
- AI 증명사진 생성: 10크레딧 소모
- 고화질 다운로드: 70크레딧 소모
- 신규 가입 보너스: 80크레딧 즉시 지급
- SNS 공유 보너스: SNS 공유 또는 Google 리뷰 작성 시 100크레딧 지급 (1회 한정)
- 텔레그램 보너스: @monkos_support_bot 친구 추가 시 30크레딧 지급 (계정당 1회)
크레딧은 구매 후 환불 조건을 충족하면 환불 가능합니다.`,
    keywords: ['크레딧', 'credit', 'クレジット', '포인트', 'point', '생성', '다운로드', '공유', '보너스', '무료', '텔레그램', 'telegram'],
    category: 'billing',
  },
  {
    id: 'credit_purchase',
    title: '크레딧 구매 방법',
    content: `크레딧 구매 옵션:

[한국 사용자 — 토스페이먼츠]
- 10크레딧: ₩1,450 (기본)
- 100크레딧: ₩13,050 (10% 할인)
- 300크레딧: ₩34,800 (20% 할인, 추천)
- 500크레딧: ₩50,750 (30% 할인)

[글로벌 — Lemon Squeezy]
- 10크레딧: $10
- 30크레딧: $25
- 50크레딧: $40

결제 후 즉시 크레딧이 반영됩니다. 반영이 안 될 경우 몇 분 대기 후 새로고침 해주세요.
신규 가입 시 80크레딧이 자동 지급되므로, 바로 체험하실 수 있습니다!`,
    keywords: ['구매', 'purchase', '購入', '결제', 'payment', '支払い', '가격', 'price', '料金', 'toss', 'lemon'],
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
- 내용: 가입 시 사용한 Google 이메일 주소 기재
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
성별(남성/여성)과 연령대를 선택하면 적합한 복장이 자동 적용됩니다.
배경은 순백(#FFFFFF)으로 고정, 비율 3:4 표준 규격입니다.`,
    keywords: ['증명사진', 'id photo', '証明写真', '여권', 'passport', 'パスポート', '이력서', 'resume', '履歴書', '종류', 'type'],
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
