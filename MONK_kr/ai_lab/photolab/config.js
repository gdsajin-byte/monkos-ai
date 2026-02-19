/**
 * config.js — 환경 설정 + 상수
 * 00079 라인 1033~1091에서 추출
 */

// API 설정
export const API = {
  PORTAL_URL: 'https://monkos.ai',
  // photolab API: CF Workers 자체 엔진 (Gemini API 직접 호출)
  PRECHECK: '/api/precheck',
  GENERATE: '/api/idgen',
  QC: '/api/qc',
  CREDIT_USE: '/api/idphoto-credit-use',
  // 코칭: CF Function → Gemini REST 직접 (서버 경유 안 함)
  COACHING: '/api/idphoto-coaching',
};

// 크레딧 비용
export const CREDIT_COST = {
  generate: 1,
  download: 10,
};

// 토스페이먼츠 (KR 전용)
export const TOSS_CLIENT_KEY = 'test_ck_6bJXmgo28eBJk12vvDAW3LAnGKWx';

// 캡처 설정
export const MAX_CAPTURE_SIZE = 720;
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
  coachingInit: '안녕하세요! 몽코스 AI 코치입니다. 정면을 바라봐 주시면 자세와 조명을 체크해 드릴게요!',
  coachingCheck: '자세를 체크하고 있습니다...',
  btnStarting: '카메라 시작 중...',
  step1: 'Step 1: AI 코칭',
  step2: 'Step 2: 촬영 확인',
  step3: 'Step 3: AI 생성 + QC',
  step4: 'Step 4: 클로즈업',
  resultConfirm: '촬영 확인',
  resultConfirmSub: '촬영한 사진을 확인해 주세요',
  resultAIOK: 'AI가 촬영 OK 판정한 사진입니다',
  generating: '증명사진 생성 중...',
  generatingSub: 'MONKOS가 처리 중입니다',
  genLoading: '생성 중...',
  qcChecking: 'QC 검증 중...',
  qcVerifying: '품질 검증 중...',
  qcVerifyingSub: '품질을 검증하고 있습니다',
  resultDone: '완료!',
  resultDoneSub: '증명사진이 준비되었습니다',
  resultFail: 'QC 불합격',
  resultFailSub: '다시 시도해 주세요',
  retakeRecommend: '재촬영 권장',
  genFail: '생성 실패',
  specDone: '클로즈업 완료',
  cameraError: '카메라를 시작할 수 없습니다.\n카메라 접근을 허용해 주세요.',
};

// 텍스트 헬퍼
export const t = (key) => TX[key] || key;

// 규격 테이블 (mm 기준, 300dpi 출력)
export const PHOTO_SPECS = {
  id_photo: {
    name: '여권/증명사진 (35x45mm)',
    widthMM: 35,
    heightMM: 45,
    faceTopMM: 7,
    faceLenMM: 27,
  },
  resume: {
    name: '이력서 (30x40mm)',
    widthMM: 30,
    heightMM: 40,
    faceTopMM: 6,
    faceLenMM: 24,
  },
};
