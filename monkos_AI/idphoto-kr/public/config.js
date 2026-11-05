/**
 * config.js — 환경 설정 + 상수
 * 00079 라인 1033~1091에서 추출
 */

// Google OAuth (헌법 6조: config.js 집중 관리)
export const GOOGLE_CLIENT_ID = '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';

// API 설정 — hostname 기반 환경 자동 분기
const IS_DEV = typeof location !== 'undefined' && location.hostname.includes('-dev-');
export const API = {
  PORTAL_URL: IS_DEV ? 'https://monkos-portal-dev-4jeplpqpua-uc.a.run.app' : 'https://monkos.ai',
  // Cloud Run 자체 서빙 (상대경로)
  PRECHECK: '/api/precheck',
  GENERATE: '/api/idgen',
  CREDIT_USE: '/api/credit/use',       // Cloud Run 직접 (CF 프록시 제거)
  CREDIT_REFUND: '/api/credit/refund', // 다운로드 실패 환불
  COACHING: '/api/coaching',            // 같은 서버 (절대URL → 상대경로)
};

// 크레딧 비용
export const CREDIT_COST = {
  generate: 10,
  download: 70,
  extraCrop: 10,
};

// 토스페이먼츠 (KR 전용)
export const TOSS_CLIENT_KEY = '__TOSS_CLIENT_KEY__'; // 위젯 키 — server.js 서빙 시 환경변수로 치환

// 카카오 채널 (헌법 6조: config.js 집중 관리 — 값 미설정 시 SDK 호출 스킵)
export const KAKAO_JS_KEY = '35d410a1a29907a670eb3b18ef3a2a03';
export const KAKAO_CHANNEL_ID = '_hxjKqX';

// 캡처 설정
export const MAX_CAPTURE_SIZE = 512;
export const CAPTURE_QUALITY = 0.6; // 촬영·업로드 공용 JPEG 품질(11-05 업로드 열기 — camera.js 사본 숫자 정본화)
export const COACHING_DISPLAY_MS = 10000;
export const FRAME_INTERVAL_MS = 500;
export const CAPTURE_SIZE = 512;

// DPI 및 변환 함수
export const DPI = 300;
export const mmToPx = (mm) => Math.round(mm / 25.4 * DPI);

// 텍스트 상수 (한국어 고정)
export const TX = {
  stepReady: '촬영 준비',
  waiting: '대기 중',
  connecting: '연결 중',
  connected: 'AI 연결됨',
  disconnected: '연결 끊김',
  faceGuide: '여기에 얼굴을 맞춰주세요',
  coachingReady: '촬영 OK!',
  coachingInit: '자세와 조명을 체크하고 있습니다...',
  coachingCheck: '자세를 체크하고 있습니다...',
  btnStarting: '카메라 시작 중...',
  step1: 'Step 1: AI 코칭',
  step2: 'Step 2: 촬영 확인',
  step3: 'Step 3: AI 리터칭',
  step4: 'Step 4: 클로즈업',
  resultConfirm: '촬영 확인',
  resultConfirmSub: '촬영한 사진을 확인해 주세요',
  resultAIOK: 'AI가 촬영 OK 판정한 사진입니다',
  generating: '증명사진 리터칭 중...',
  generatingSub: 'MONKOS가 처리 중입니다',
  genLoading: '리터칭 중...',
  resultDone: '완료!',
  resultDoneSub: '증명사진이 준비되었습니다',
  genFail: '리터칭 실패',
  specDone: '클로즈업 완료',
  cameraError: '카메라를 시작할 수 없습니다.\n카메라 접근을 허용해 주세요.',
};

// 텍스트 헬퍼
export const t = (key) => TX[key] || key;

// 규격 테이블 (mm 기준, 300dpi 출력)
export const PHOTO_SPECS = {
  passport: {
    name: '여권사진 (35x45mm)',
    widthMM: 35,
    heightMM: 45,
    faceTopMM: 7,
    faceLenMM: 27,
  },
  id: {
    name: '증명사진 (30x40mm)',
    widthMM: 30,
    heightMM: 40,
    faceTopMM: 6,
    faceLenMM: 24,
  },
};

// ─── v5 옵션 상수 ───

export const V5_OPTIONS = {
  format: ['passport', 'id'],
  gender: ['f', 'm'],
  age: ['baby', 'child', 'teen', 'adult'],
  clothing: ['default', 'change', 'casual', 'suit'],
  clothingColor: {
    child: ['skyblue', 'pink', 'lemon', 'green'],     // 영유아/어린이
    adult: ['beige', 'blue', 'wine', 'green'],         // 캐주얼 (중고생/성인)
  },
  suitColor: ['navy', 'brown', 'gray', 'black'],
  shirtColor: ['white', 'lightblue', 'lightpink', 'lightbeige'],
  tieColor: ['notie', 'navy', 'wine', 'black'],
  tiePattern: ['solid', 'stripe'],
  hair: ['default', 'tidy', 'updo'],
  bgColor: ['white', 'gray', 'blue', 'beige'],
};

// 연령별 clothing 허용값
export const CLOTHING_BY_AGE = {
  baby: ['default', 'change'],
  child: ['default', 'change'],
  teen: ['default', 'casual', 'suit'],
  adult: ['default', 'casual', 'suit'],
};

// 연령별 hair 표시 여부
export const HAIR_VISIBLE_AGES = ['teen', 'adult'];

// format="passport" → bgColor 강제
export const PASSPORT_FORCED_BG = 'white';

// ─── 충전 상품 (프론트엔드 정본 — 백엔드 PRODUCTS와 가격 동기화 필수) ───
export const CHARGE_OPTIONS = [
  { key: 'single_70', label: '70 크레딧', price: 9900, credits: 70, bonus: 10 },
  { key: 'package_100', label: '100 크레딧', price: 12900, credits: 100, bonus: 30 },
  { key: 'package_300', label: '300 크레딧', price: 34900, credits: 300, bonus: 120 },
  { key: 'package_500', label: '500 크레딧', price: 49900, credits: 500, bonus: 250, best: true },
];

export const KRW_PER_CREDIT = 150; // 10c = ₩1,500 = $1 (2026-07-06 확정)

// 스키마 버전
export const SCHEMA_VERSION = 'v5';
