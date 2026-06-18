/**
 * 1회성 시딩: site_config/layout 문서에 14개 블록 데이터 세팅
 *
 * 데이터 정본:
 *   - public/index.html (KO 기본 텍스트 + HTML 구조)
 *   - public/js/i18n.js (JA/EN 번역 텍스트)
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/seed-layout.js
 *
 * ⚠️ 프로덕션 Firestore에 직접 접근합니다.
 *   GCP 인증 필요: gcloud auth application-default login
 * ⚠️ 멱등성: 재실행 시 전체 덮어쓰기 (set, merge 아님)
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({ projectId: 'monkos' });
const layoutRef = firestore.collection('site_config').doc('layout');

const sections = [
  // ──────────── 1. 헤더 영역 ────────────
  {
    id: 'hero',
    type: 'hero',
    visible: true,
    order: 1,
    data: {
      label: 'AI Creative Platform',
      title: 'MONKOS <em>AI</em>',
      tagline: '<strong>Photography</strong> × <strong>AI</strong> × <strong>K-Beauty</strong>',
      style: {},
    },
  },
  {
    id: 'user-bar',
    type: 'user-bar',
    visible: true,
    order: 2,
    data: {
      cta: { ko: '촬영 시작하기', ja: '証明写真を撮る', en: 'Take ID Photo' },
      ctaUrl: {
        kr: 'https://idphoto-kr.monkos.ai/',
        global: 'https://idphoto-jp.monkos.ai/',
      },
      showLangSwitch: true,
      showLogin: true,
      showCredit: true,
    },
  },
  {
    id: 'gallery-strip',
    type: 'gallery-strip',
    visible: true,
    order: 3,
    data: {
      maxItems: 10,
      autoScroll: true,
      speed: 30,
    },
  },
  {
    id: 'nav',
    type: 'nav',
    visible: true,
    order: 4,
    items: [
      {
        label: { ko: '홈', ja: 'ホーム', en: 'Home' },
        href: { ko: '/', ja: '/?lang=ja', en: '/?lang=en' },
        active: true,
      },
      {
        label: { ko: '블로그', ja: 'ブログ', en: 'Blog' },
        href: { ko: '/blog', ja: '/ja/blog', en: '/en/blog' },
      },
      {
        label: { ko: 'FAQ', ja: 'FAQ', en: 'FAQ' },
        href: { ko: '/faq', ja: '/ja/faq', en: '/en/faq' },
      },
      {
        label: { ko: '갤러리', ja: 'ギャラリー', en: 'Gallery' },
        href: { ko: '/gallery', ja: '/gallery', en: '/gallery' },
      },
      {
        label: { ko: '게시판', ja: '掲示板', en: 'Board' },
        href: { ko: '/board', ja: '/board', en: '/board' },
      },
      {
        label: { ko: '가격', ja: '料金', en: 'Pricing' },
        href: { ko: '/pricing', ja: '/ja/pricing', en: '/en/pricing' },
      },
    ],
  },

  // ──────────── 2. 메인 영역 ────────────
  {
    id: 'intro-text',
    type: 'intro-text',
    visible: true,
    order: 5,
    data: {
      text: {
        ko: '<strong>MONKOS</strong>는 20년 경력 사진작가가 만든 <strong>AI 증명사진</strong> 플랫폼입니다. 여권사진, 이력서사진, 비자사진을 셀카 한 장으로 완성합니다. 사진관 촬영 노하우를 학습한 AI가 배경 정리, 조명 보정, 피부 보정, 의상 정돈까지 처리하며 <strong>ICAO 국제 규격</strong>에 부합하는 증명사진을 제공합니다.',
        ja: '<strong>MONKOS</strong>は20年のキャリアを持つ写真家が作った<strong>AI証明写真</strong>プラットフォームです。パスポート写真、履歴書写真、ビザ写真をセルフィー1枚で完成します。スタジオ撮影ノウハウを学習したAIが背景整理、照明補正、肌補正、服装整頓まで処理し、<strong>ICAO国際規格</strong>に適合する証明写真を提供します。',
        en: '<strong>MONKOS</strong> is an <strong>AI ID photo</strong> platform created by a photographer with 20 years of experience. Complete passport, resume, and visa photos with just one selfie. AI trained on studio techniques handles background, lighting, skin, and clothing — <strong>ICAO standard</strong> ID photos.',
      },
    },
  },
  {
    id: 'service-cards',
    type: 'service-grid',
    visible: true,
    order: 5,
    items: [
      {
        title: { ko: 'AI 증명사진', ja: 'AI証明写真', en: 'AI ID Photo' },
        desc: {
          ko: '여권·이력서 — 사진관 품질 AI 리터칭. ICAO 국제 규격.',
          ja: 'パスポート・履歴書 — スタジオ品質AIリタッチ。ICAO国際規格。',
          en: 'Passport, resume, visa — studio-quality AI retouching. ICAO standard.',
        },
        link: { ko: '촬영 시작 →', ja: '撮影開始 →', en: 'Start shooting →' },
        url: '/app',
        icon: '📷',
        badge: { text: 'LIVE', class: 'lb' },
        cardClass: 'live',
        style: {},
      },
      {
        title: { ko: '무료 크롭앱', ja: '無料クロップアプリ', en: 'Free Crop App' },
        desc: {
          ko: '규격 크롭·배경 제거·배경 교체. 서버 전송 없음.',
          ja: '規格クロップ・背景除去・背景交換。サーバー送信なし。',
          en: 'Spec crop, background removal & replacement. No server upload.',
        },
        link: { ko: '/crop →', ja: '/crop →', en: '/crop →' },
        url: '/crop',
        icon: '✂️',
        badge: { text: 'FREE', class: 'fb' },
        cardClass: 'free',
        style: {},
      },
    ],
  },
  {
    id: 'howto',
    type: 'howto-grid',
    visible: true,
    order: 6,
    header: {
      title: { ko: '증명사진 앱 활용법', ja: '証明写真アプリの使い方', en: 'How to Use' },
      link: { ko: '전체보기 →', ja: '全て見る →', en: 'View all →' },
      href: '/guide',
    },
    items: [
      {
        num: '01',
        title: { ko: '규격 선택', ja: '規格選択', en: 'Select Spec' },
        desc: { ko: '여권/신분증 또는 반명함 선택', ja: 'パスポート/身分証または半名刺選択', en: 'Choose passport/ID or business card' },
      },
      {
        num: '02',
        title: { ko: '셀카 촬영', ja: 'セルフィー撮影', en: 'Take Selfie' },
        desc: { ko: 'AI 코칭 가이드로 완벽 촬영', ja: 'AIコーチングガイドで完璧撮影', en: 'AI coaching guide for perfect shots' },
      },
      {
        num: '03',
        title: { ko: 'AI 리터칭', ja: 'AIリタッチ', en: 'AI Retouch' },
        desc: { ko: '배경·조명·피부·의상 자동 보정', ja: '背景・照明・肌・服装自動補正', en: 'Auto background, lighting, skin & clothing' },
      },
    ],
  },

  // ──────────── 3. Firestore 동적 블록 (설정만) ────────────
  {
    id: 'faq-preview',
    type: 'faq-preview',
    visible: true,
    order: 7,
    data: {
      maxItems: 3,
      linkToFull: true,
      header: {
        title: { ko: '자주 묻는 질문', ja: 'よくある質問', en: 'FAQ' },
        link: { ko: '전체보기 →', ja: '全て見る →', en: 'View all →' },
        href: '/faq',
      },
    },
  },
  {
    id: 'board-preview',
    type: 'board-preview',
    visible: true,
    order: 8,
    data: {
      maxItems: 5,
      header: {
        title: { ko: '고객 게시판', ja: 'お客様掲示板', en: 'Customer Board' },
        link: { ko: '전체보기 →', ja: '全て見る →', en: 'View all →' },
        href: '/board',
      },
    },
  },
  {
    id: 'blog-cards',
    type: 'blog-cards',
    visible: true,
    order: 9,
    data: {
      maxItems: 4,
      header: {
        title: { ko: '최근 블로그', ja: '最新ブログ', en: 'Latest Blog' },
        link: { ko: '전체보기 →', ja: '全て見る →', en: 'View all →' },
        href: '/blog',
      },
    },
  },

  // ──────────── 4. 사이드바 (좌측) ────────────
  {
    id: 'magazine',
    type: 'magazine',
    visible: true,
    order: 10,
    data: { maxItems: 4 },
  },
  {
    id: 'tags',
    type: 'tags',
    visible: true,
    order: 11,
    data: { maxTags: 16, expandable: true },
  },

  // ──────────── 5. 사이드바 (우측) ────────────
  {
    id: 'guide',
    type: 'guide-cards',
    visible: true,
    order: 12,
    items: [
      {
        title: { ko: '증명사진 촬영법', ja: '証明写真の撮り方', en: 'How to Take ID Photo' },
        desc: { ko: '규격 선택 → 셀카 → AI 리터칭 → 다운로드', ja: '規格選択 → セルフィー → AIリタッチ → ダウンロード', en: 'Select spec → Selfie → AI retouch → Download' },
        status: { ko: '▶ 자동 재생 중', ja: '▶ 自動再生中', en: '▶ Auto-playing' },
        style: { background: '#0a0a14', accentColor: '#6366f1' },
      },
      {
        title: { ko: '크롭앱 사용법', ja: 'クロップアプリの使い方', en: 'How to Use Crop App' },
        desc: { ko: '사진 선택 → 규격 크롭 → 누끼 → 다운로드', ja: '写真選択 → 規格クロップ → 背景除去 → ダウンロード', en: 'Select photo → Spec crop → Remove BG → Download' },
        status: { ko: '▶ 자동 재생 중', ja: '▶ 自動再生中', en: '▶ Auto-playing' },
        style: { background: '#0a1a10', accentColor: '#10B981' },
      },
    ],
  },
  {
    id: 'credit-info',
    type: 'credit-box',
    visible: true,
    order: 13,
    data: {
      exchange: { ko: '💡 10c = $1 ≈ ₩1,450', ja: '💡 10c = ¥150', en: '💡 10c = $1' },
      rows: [
        { label: { ko: 'AI 생성', ja: 'AIリタッチ', en: 'AI Retouch' }, value: '10c' },
        { label: { ko: '다운로드', ja: 'ダウンロード', en: 'Download' }, value: '70c' },
        { label: { ko: '1장 완성', ja: '1枚完成', en: '1 Photo' }, value: '80c', accent: true },
      ],
      promo: {
        oldPrice: { ko: '₩10,150', ja: '¥1,200', en: '$8.00' },
        newPrice: { ko: '₩9,900', ja: '¥990', en: '$6.90' },
        bonus: { ko: '🎁 회원가입 시 +10c 보너스', ja: '🎁 初回ログイン +10cボーナス', en: '🎁 +10c bonus on sign-up' },
      },
    },
  },

  // ──────────── 6. 푸터 ────────────
  {
    id: 'footer',
    type: 'footer',
    visible: true,
    order: 14,
    data: {
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Refund Policy', href: '/refund' },
        { label: 'Support', href: 'https://t.me/monkos_bot' },
      ],
      copyright: '© 2026 MONKOS.AI — Evolution of Creative Intelligence',
    },
  },
];

async function seed() {
  console.log('🌱 시딩 시작: site_config/layout');
  console.log(`   블록 수: ${sections.length}`);

  const data = {
    sections,
    updatedAt: new Date().toISOString(),
  };

  await layoutRef.set(data);

  console.log('✅ 시딩 완료. 블록 ID 목록:');
  for (const s of sections) {
    console.log(`   [${s.order}] ${s.id} (${s.type})`);
  }
}

seed().catch(err => {
  console.error('❌ 시딩 실패:', err.message);
  process.exit(1);
});
