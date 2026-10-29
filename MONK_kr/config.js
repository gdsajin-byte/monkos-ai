/**
 * MONK.KR 프론트엔드 설정
 *
 * 환경변수 중앙 관리
 * 수정 시 모든 페이지에 자동 반영
 */
window.MONK_CONFIG = {
    // API 엔드포인트
    API: {
        GEMINI_PROXY: 'https://monk-gemini-proxy.gdsajin.workers.dev',
        IMAGEN_PROXY: 'https://monk-imagen-proxy.gdsajin.workers.dev',
        CHATBOT: 'https://monk-chatbot.gdsajin.workers.dev',
        PORTAL: '',      // 분리 원칙: monkos.ai 교차 호출 금지
        IDPHOTO_KR: '',  // 분리 원칙: monkos.ai 교차 호출 금지
        IDPHOTO_JP: ''   // 분리 원칙: monkos.ai 교차 호출 금지
    },

    // 결제 (토스페이먼츠)
    PAYMENT: {
        TOSS_CLIENT_KEY: '', // TODO: monkos 정식 연동 후 설정
        TOSS_SDK_URL: 'https://js.tosspayments.com/v1/payment'
    },

    // 외부 서비스
    EXTERNAL: {
        NAVER_TALK: 'https://talk.naver.com/W5UJ45',
        KAKAO_CHANNEL: 'https://pf.kakao.com/_xnxnxn'
    },

    // 환경 구분
    ENV: 'production'
};

// 개발 환경 감지 (localhost)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.MONK_CONFIG.ENV = 'development';
    console.log('[MONK_CONFIG] Development mode');
}
