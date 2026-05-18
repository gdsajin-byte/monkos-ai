/**
 * 촬영 코퍼스 시드 — Firestore cs_knowledge 컬렉션에 추가
 * 실행: node seed_cs_prep.js
 * 환경: GOOGLE_APPLICATION_CREDENTIALS 또는 ADC 인증 필요
 */

import { Firestore } from '@google-cloud/firestore';
const firestore = new Firestore({ projectId: 'monkos' });
const collection = firestore.collection('cs_knowledge');

const prepDocs = [
  {
    id: 'prep_passport',
    title: '여권/パスポート 촬영 준비 가이드',
    category: 'prep_guide',
    keywords: ['여권', '패스포트', 'passport', 'パスポート', '비자', 'visa'],
    content: `[여권 증명사진 규격]
한국: 35×45mm, 흰색 배경, 6개월 이내 촬영
일본: 35×45mm, 흰색 또는 밝은 단색 배경
공통: 정면, 무표정, 눈 뜬 상태, 안경 가급적 제거
의상: 흰색 의상 피할 것 (배경과 구분 불가), 어두운 단색 상의 권장
헤어: 이마/귀 가리지 않도록, 앞머리 정리
[촬영 팁] 자연광 또는 밝은 조명, 그림자 없이, 카메라 정면 응시`,
  },
  {
    id: 'prep_resume',
    title: '이력서/履歴書 촬영 준비 가이드',
    category: 'prep_guide',
    keywords: ['이력서', '취업', 'resume', '履歴書', '就活', '입사', '면접'],
    content: `[이력서 증명사진]
한국: 30×40mm, 3개월 이내 촬영, 정장 필수 (남: 넥타이 권장, 여: 블라우스+재킷)
일본: 30×40mm, 3개월 이내
의상: 네이비/차콜 정장 + 흰색 셔츠가 가장 무난
표정: 자연스러운 미소 (이 보이지 않을 정도)
헤어: 깔끔하게 정돈, 이마 보이도록
[촬영 팁] 상체만 촬영, 어깨 정면, 살짝 턱 당기기`,
  },
  {
    id: 'prep_student',
    title: '학생증/学生証 촬영 준비 가이드',
    category: 'prep_guide',
    keywords: ['학생증', '학생', 'student', '学生証', '학교', '입학'],
    content: `[학생증 증명사진]
일반적으로 25×30mm 또는 30×40mm
교복 착용이 일반적 (학교 규정 확인)
사복 시: 깔끔한 셔츠/블라우스
배경: 흰색 또는 밝은 단색
표정: 자연스러운 표정 (미소 가능)
[연령별 포인트]
- 초등: 밝은 색 폴로셔츠, 자연스러운 표정
- 중고등: 교복 또는 단정한 셔츠
- 대학: 정장 또는 깔끔한 사복`,
  },
  {
    id: 'prep_baby',
    title: '영유아/赤ちゃん 촬영 가이드',
    category: 'prep_guide',
    keywords: ['아기', '유아', '영아', 'baby', '赤ちゃん', '幼児', '신생아'],
    content: `[영유아 증명사진 (여권/비자)]
한국: 6개월 미만은 눈 감은 사진도 허용
일본: 동일 기준
공통: 정면, 입 다물기, 배경 흰색
보호자 손 보이지 않도록 주의
[촬영 팁]
- 밝은 방에서 촬영
- 흰색 이불/시트 위에 눕히거나 안고 촬영
- 후면 카메라 사용 권장 (화질)
- 여러 장 연속 촬영 → 가장 좋은 컷 선택`,
  },
  {
    id: 'prep_color_guide',
    title: '의상 컬러 가이드',
    category: 'prep_guide',
    keywords: ['색상', '컬러', '의상', 'color', '色', '服装', '옷'],
    content: `[증명사진 의상 컬러 가이드]
✅ 추천: 네이비, 차콜, 다크그레이, 검정 (정장)
✅ 셔츠: 흰색이 가장 무난
⚠️ 주의: 흰색 상의 (배경과 구분 불가), 빨강/노랑 원색 (시선 분산)
❌ 피하기: 줄무늬, 체크 등 복잡한 패턴 (AI 생성 시 왜곡 가능)
[피부톤별 추천]
- 따뜻한 피부톤: 네이비, 따뜻한 그레이
- 차가운 피부톤: 차콜, 블랙
- 범용: 네이비 정장 + 흰색 셔츠 (누구에게나 어울림)`,
  },
];

async function seed() {
  for (const doc of prepDocs) {
    const { id, ...data } = doc;
    data.updatedAt = new Date().toISOString();
    await collection.doc(id).set(data);
    console.log(`✅ Seeded: ${id}`);
  }
  console.log(`\n총 ${prepDocs.length}건 시드 완료`);
}

seed().catch(console.error);
