/**
 * CMS SSR — 증명사진 규격 허브 + 상세
 * IDPASS 카드 UI + 다크 테마 + 3티어 전환 퍼널
 */
import { createRequire } from 'module';
import { readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { escapeHtml, layoutShell } from './render-shell.js';
import { getSpecCropParams } from '../spec-crop.js';
import { log, LEMONSQUEEZY_VARIANT_SPECS_SINGLE, LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP } from '../shared/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDE_IMAGES = new Set(
  readdirSync(join(__dirname, '../../public/images/guides')).filter(f => f.endsWith('.webp')).map(f => f.replace('.webp', ''))
);

const _require = createRequire(import.meta.url);
export const SPECS_DATA = _require('./specs-data.json');
// 규격 데이터 최종 갱신일 — Article dateModified 정본 (하드코딩 금지, 데이터 파일 mtime 기준)
const SPECS_DATA_MODIFIED = (() => {
  try { return statSync(join(__dirname, 'specs-data.json')).mtime.toISOString().slice(0, 10); }
  catch { return '2026-07-13'; }
})();

// 퍼널 분리 정적 자산 버전 — Cloud Run 리비전 단위 캐시 버스트 (로컬은 dev)
const ASSET_VER = process.env.K_REVISION || 'dev';
const specsCssLink = (name) => `\n<link rel="stylesheet" href="/css/${name}.css?v=${ASSET_VER}">`;
const specsJsTag = (name) => `\n<script src="/js/${name}.js?v=${ASSET_VER}" defer></script>`;

// ─── I18N ───────────────────────────────────────────────────────

const COMMON_RULES = {
  ko: [
    '촬영한지 6개월 이내의 사진이어야 합니다.',
    '이마, 눈썹, 귀까지 얼굴전체가 나와야 합니다.',
    '어깨선이 나올수 있도록 머리는 뒤로 넘기는게 좋습니다.',
    '컬러렌즈, 반짝임이 심한 악세사리는 피하는게 좋습니다.',
    '시선은 정면을 응시해야 합니다.',
    '치아가 보이면 안됩니다.',
    '흰색 또는 밝은색 상의는 배경과 구분이 어려울 수 있으므로 피하는 것이 좋습니다.',
  ],
  ja: [
    '撮影から6ヶ月以内の写真でなければなりません。',
    '額、眉、耳まで顔全体が写っている必要があります。',
    '肩のラインが見えるよう、髪は後ろに流すのが望ましいです。',
    'カラーコンタクト、光沢の強いアクセサリーは避けてください。',
    '視線は正面を向いてください。',
    '歯が見えてはいけません。',
    '白色や明るい色の上着は背景と区別がつきにくいため、避けることをお勧めします。',
  ],
  en: [
    'The photo must be taken within the last 6 months.',
    'Your full face including forehead, eyebrows, and ears must be visible.',
    'Hair should be swept back so that the shoulder line is visible.',
    'Avoid colored contact lenses and reflective accessories.',
    'Eyes must be looking directly at the camera.',
    'Teeth must not be visible.',
    'White or light-colored tops may blend with the background and should be avoided.',
  ],
};

const SPECS_I18N = {
  ko: {
    hubTitle: '증명사진 규격 가이드 — 국가별·용도별 사이즈 총정리 | MONKOS',
    hubDesc: '한국 여권·반명함, 일본 패스포트·이력서, 미국 비자 등 증명사진 규격을 한눈에. 사이즈·배경·복장 기준과 반려 사유까지.',
    hubH1: '증명사진 규격 가이드',
    hubSub: '전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보',
    detailSuffix: '규격 — 사이즈·배경·복장 완벽 가이드 | MONKOS',
    tableHeaders: { size: '사이즈', pixels: '해상도', dpi: 'DPI', background: '배경', headHeight: '머리 높이', validity: '유효기간', fileSpec: '파일 규격' },
    commonRulesTitle: '공통 규정',
    detailsTitle: '세부 규정',
    rejectionTitle: '반려 사유 TOP 5',
    faqTitle: '자주 묻는 질문',
    ctaAI: 'AI로 촬영하기 →',
    ctaCrop: '무료 크롭앱 →',
    officialSourceTitle: '공식 발급 안내',
    relatedTitle: '관련 콘텐츠',
    relatedLinks: [
      { label: '사용 가이드', href: '/guide' },
      { label: '무료 크롭앱', href: '/crop' },
      { label: 'FAQ', href: '/faq' },
    ],
    sameCountryLabel: '다른 사이즈 증명사진',
    specLabel: '규격 보기',
    heroGlobal: 'GLOBAL PHOTO SPEC GUIDE',
    heroTitle: '증명사진 규격 가이드',
    heroSub: '전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보 제공 및 규격 맞춤 서비스.',
    statCountries: '국가', statSpecs: '규격', statVerified: '공식 검증',
    hubFooter: '© 2026 MONKOS · 규격 정보는 공식 출처 기반 검증. 최종 규정은 발급 기관 확인.',
    freeCropCta: '무료 AI 크롭 →',
    searchPlaceholder: '국가명 검색...',
    selectPurpose: '용도를 선택하세요',
    backToContinent: '← 대륙 선택으로',
    backToPurpose: '← 용도 선택으로',
    countriesCount: '개국',
    ctaBadge: '20년 경력 사진작가의 AI · 3분이면 완성',
    ctaHeadline1: '셀카 한 장으로',
    ctaHeadline2: '증명사진 완성',
    ctaSub: '사진관 안 가도 됩니다. 여권·이력서·비자 규격 자동 대응.\nAI가 배경·조명·피부를 사진관 수준으로 보정합니다.',
    ctaBtn: '무료로 체험하기 →',
    ctaHref: 'https://idphoto-kr.monkos.ai/',
    ctaPrice: '첫 로그인 시 무료 체험 · 이후 1장 ₩9,900',
    heroLabel: 'PHOTO SPEC GUIDE',
    heroCta: '무료 규격 맞춤 →',
    // v2 플로우 문구 (2026-07-04 결제연동트랙 — 업로드/검수/결제/생성/결과)
    v2: {
      breadcrumbGuide: '규격 가이드',
      makeTitle: '{name} 사진 만들기',
      makeSub: '셀카 한 장이면 {size} 규격 증명사진이 완성됩니다.',
      altSelfie: '셀카 예시', labelSelfie: '✓ 셀카',
      altProfile: '프로필 예시', labelProfile: '✓ 프로필',
      dropText: '사진을 끌어다 놓거나', selectBtn: '사진 선택',
      guideChips: ['정면 얼굴', '가슴 위 구도', '1인', '선명한 화질', '입 다물기 (치아 노출 금지)'],
      altCheck: '검수 사진', checkTitle: '규정 체크', checking: 'AI 검수 중...',
      btnOtherPhoto: '다른 사진', btnProceed: '진행하기',
      altPreview: '미리보기',
      payTitle: '{type} 사진 만들기',
      payPrice: '₩2,000',
      payDesc: '카드/토스 즉시결제 · 로그인 불필요',
      orDivider: '또는',
      creditTitle: '크레딧으로 만들기',
      creditDesc: '간편로그인 시 10c 무료 지급',
      creditTopup: '추가 충전: 40c <span style="text-decoration:line-through;color:#bbb;">₩6,000</span> ₩4,900',
      genText: 'AI가 {type} 사진을 만들고 있습니다...',
      genSub: '약 30초 소요',
      labelBefore: '원본', labelAfter: '완성',
      btnDownload: '다운로드', btnRetry: '다른 사진으로 만들기',
      detailsTitle: '상세 규정', rejectionTitle: '반려사유 TOP 5', faqTitle: '자주 묻는 질문',
      sameTitle: '같은 사진으로 제출 가능한 서류',
      sameSub: '아래 서류는 {name}과(와) 동일 규격({size})입니다.',
      noGlasses: '무안경 권장',
      crossTitle: '다른 MONKOS 서비스',
      crossSub: '증명사진 외에도 다양한 AI 사진 서비스를 이용해보세요.',
      crossHeadshot: '취업·이력서 사진', crossHeadshotSub: 'AI 헤드샷으로 완성',
      crossProfile: '프로필 사진', crossProfileSub: 'SNS·링크드인용',
      crossSpecs: '증명사진 전체 규격', crossSpecsSub: '국가별·용도별 규격 가이드',
      js: {
        errFileType: 'JPG, PNG, HEIC 파일만 업로드 가능합니다.',
        errFileSize: '10MB 이하 파일만 업로드 가능합니다.',
        checkPass: '규격 적합! 진행하기를 눌러주세요.',
        checkFail: '일부 항목이 부적합합니다. 다른 사진을 권장합니다.',
        errCheck: '검수 실패',
        errCheckNet: '검수 오류',
        errGen: '생성 실패',
        errNet: '오류가 발생했습니다. 다시 시도해주세요.',
        rateLimited: '요청이 많습니다. 잠시 후 다시 시도해주세요.',
        payInitFail: '결제 시작에 실패했습니다. 잠시 후 다시 시도해주세요.',
        payUnavailable: '이 지역의 결제는 준비 중입니다. 잠시 후 다시 확인해주세요.',
        payCancelled: '결제가 취소되었습니다.',
        payConfirming: '결제 확인 중...',
        payConfirmFail: '결제 확인에 실패했습니다. 문제가 지속되면 info@monkos.ai로 문의해주세요.',
        payWaiting: '결제 완료를 기다리는 중입니다...',
        payWaitingHint: '결제창에서 결제를 마치면 자동으로 진행됩니다.',
        payTimeout: '결제 확인이 지연되고 있습니다. 결제를 완료하셨다면 잠시 후 이 페이지를 새로고침해주세요.',
        payFailed: '결제가 완료되지 않았습니다. 다시 시도해주세요.',
        imgLost: '결제가 확인되었습니다. 사용하신 사진을 다시 업로드하면 바로 생성됩니다.',
        tokenInvalid: '결제 정보가 유효하지 않습니다. info@monkos.ai로 문의해주세요.',
        tokenUsed: '이미 사용 완료된 결제입니다. info@monkos.ai로 문의해주세요.',
        tokenExpired: '결제 유효기간(24시간)이 지났습니다. info@monkos.ai로 문의해주세요.',
        genLimit: '재생성 한도(3회)를 모두 사용했습니다. info@monkos.ai로 문의해주세요.',
        downloadFail: '다운로드 처리에 실패했습니다. info@monkos.ai로 문의해주세요.',
      },
    },
  },
  ja: {
    hubTitle: '証明写真 規格ガイド — 国別・用途別サイズ総まとめ | MONKOS',
    hubDesc: '韓国パスポート・半名刺、日本パスポート・履歴書、米国ビザなど証明写真規格を一覧で。サイズ・背景・服装基準と却下理由まで。',
    hubH1: '証明写真 規格ガイド',
    hubSub: '世界200カ国以上のパスポート・ビザなど証明写真規格情報',
    detailSuffix: '規格 — サイズ・背景・服装 完全ガイド | MONKOS',
    tableHeaders: { size: 'サイズ', pixels: '解像度', dpi: 'DPI', background: '背景', headHeight: '頭の高さ', validity: '有効期限', fileSpec: 'ファイル規格' },
    commonRulesTitle: '共通規定',
    detailsTitle: '詳細規定',
    rejectionTitle: '却下理由 TOP 5',
    faqTitle: 'よくある質問',
    ctaAI: 'AIで撮影する →',
    ctaCrop: '無料クロップアプリ →',
    officialSourceTitle: '公式申請案内',
    relatedTitle: '関連コンテンツ',
    relatedLinks: [
      { label: 'ご利用ガイド', href: '/guide' },
      { label: '無料クロップアプリ', href: '/crop' },
      { label: 'FAQ', href: '/ja/faq' },
    ],
    sameCountryLabel: '他サイズの証明写真',
    specLabel: '規格を見る',
    heroGlobal: 'GLOBAL PHOTO SPEC GUIDE',
    heroTitle: '証明写真 規格ガイド',
    heroSub: '世界200カ国以上のパスポート・ビザなど証明写真規格情報と規格合わせサービス。',
    statCountries: 'カ国', statSpecs: '規格', statVerified: '公式検証',
    hubFooter: '© 2026 MONKOS · 規格情報は公式ソースに基づく検証済み。最終規定は発行機関にご確認ください。',
    freeCropCta: '無料AIクロップ →',
    searchPlaceholder: '国名で検索...',
    selectPurpose: '用途を選択してください',
    backToContinent: '← 大陸選択へ',
    backToPurpose: '← 用途選択へ',
    countriesCount: 'カ国',
    ctaBadge: 'プロカメラマン20年のAI · 3分で完成',
    ctaHeadline1: 'セルフィー1枚で',
    ctaHeadline2: '証明写真完成',
    ctaSub: '写真館に行かなくても大丈夫。パスポート・履歴書・ビザ規格に自動対応。\nAIが背景・照明・肌を写真館レベルに補正します。',
    ctaBtn: '無料で体験する →',
    ctaHref: 'https://idphoto-jp.monkos.ai/',
    ctaPrice: '初回ログイン時 無料体験 · 以降1枚 ¥990',
    heroLabel: 'PHOTO SPEC GUIDE',
    heroCta: '無料で規格に合わせる →',
    v2: {
      breadcrumbGuide: '規格ガイド',
      makeTitle: '{name}写真を作る',
      makeSub: 'セルフィー1枚で{size}規格の証明写真が完成します。',
      altSelfie: 'セルフィー例', labelSelfie: '✓ セルフィー',
      altProfile: 'プロフィール例', labelProfile: '✓ プロフィール',
      dropText: '写真をドラッグ＆ドロップ、または', selectBtn: '写真を選択',
      guideChips: ['正面の顔', '胸から上の構図', '1人', '鮮明な画質', '口を閉じる（歯を見せない）'],
      altCheck: '検査写真', checkTitle: '規定チェック', checking: 'AI検査中...',
      btnOtherPhoto: '別の写真', btnProceed: '進める',
      altPreview: 'プレビュー',
      payTitle: '{type}写真を作成',
      payPrice: '$1.99 <span style="font-size:14px;color:#888;font-weight:600;">(USD)</span>',
      payDesc: 'カード即時決済 · ログイン不要',
      orDivider: 'または',
      genText: 'AIが{type}写真を作成しています...',
      genSub: '約30秒かかります',
      labelBefore: '元の写真', labelAfter: '完成',
      btnDownload: 'ダウンロード', btnRetry: '別の写真で作る',
      detailsTitle: '詳細規定', rejectionTitle: '却下理由 TOP 5', faqTitle: 'よくある質問',
      sameTitle: '同じ写真で提出できる書類',
      sameSub: '以下の書類は{name}と同一規格（{size}）です。',
      noGlasses: '眼鏡なし推奨',
      crossTitle: 'その他のMONKOSサービス',
      crossSub: '証明写真のほかにも、さまざまなAI写真サービスをご利用いただけます。',
      crossHeadshot: '就活・履歴書写真', crossHeadshotSub: 'AIヘッドショットで完成',
      crossProfile: 'プロフィール写真', crossProfileSub: 'SNS・LinkedIn用',
      crossSpecs: '証明写真の全規格', crossSpecsSub: '国別・用途別規格ガイド',
      js: {
        errFileType: 'JPG、PNG、HEICファイルのみアップロードできます。',
        errFileSize: '10MB以下のファイルのみアップロードできます。',
        checkPass: '規格適合！「進める」を押してください。',
        checkFail: '一部の項目が不適合です。別の写真をお勧めします。',
        errCheck: '検査に失敗しました',
        errCheckNet: '検査エラー',
        errGen: '生成に失敗しました',
        errNet: 'エラーが発生しました。もう一度お試しください。',
        rateLimited: 'リクエストが集中しています。しばらくしてからお試しください。',
        payInitFail: '決済を開始できませんでした。しばらくしてからお試しください。',
        payUnavailable: 'この地域の決済は準備中です。しばらくお待ちください。',
        payCancelled: '決済がキャンセルされました。',
        payConfirming: '決済を確認しています...',
        payConfirmFail: '決済の確認に失敗しました。解決しない場合は info@monkos.ai までご連絡ください。',
        payWaiting: '決済の完了を待っています...',
        payWaitingHint: '決済が完了すると自動的に進みます。',
        payTimeout: '決済確認に時間がかかっています。決済を完了された場合は、しばらくしてからこのページを再読み込みしてください。',
        payFailed: '決済が完了しませんでした。もう一度お試しください。',
        imgLost: '決済を確認しました。同じ写真を再アップロードするとすぐに生成されます。',
        tokenInvalid: '決済情報が無効です。info@monkos.ai までご連絡ください。',
        tokenUsed: 'この決済はすでに使用済みです。info@monkos.ai までご連絡ください。',
        tokenExpired: '決済の有効期限（24時間）が切れました。info@monkos.ai までご連絡ください。',
        genLimit: '再生成の上限（3回）に達しました。info@monkos.ai までご連絡ください。',
        downloadFail: 'ダウンロード処理に失敗しました。info@monkos.ai までご連絡ください。',
      },
    },
  },
  en: {
    hubTitle: 'ID Photo Specifications Guide — Size & Requirements by Country | MONKOS',
    hubDesc: 'Korea passport & resume, Japan passport & resume, US visa photo specs at a glance. Size, background, dress code and rejection reasons.',
    hubH1: 'ID Photo Specifications Guide',
    hubSub: 'ID photo specifications for 200+ countries — passport, visa, and more.',
    detailSuffix: 'Specs — Size, Background & Dress Code Complete Guide | MONKOS',
    tableHeaders: { size: 'Size', pixels: 'Resolution', dpi: 'DPI', background: 'Background', headHeight: 'Head Height', validity: 'Validity', fileSpec: 'File Spec' },
    commonRulesTitle: 'Common Requirements',
    detailsTitle: 'Detailed Requirements',
    rejectionTitle: 'Top 5 Rejection Reasons',
    faqTitle: 'Frequently Asked Questions',
    ctaAI: 'Take with AI →',
    ctaCrop: 'Free Crop App →',
    officialSourceTitle: 'Official Application',
    relatedTitle: 'Related Content',
    relatedLinks: [
      { label: 'User Guide', href: '/guide' },
      { label: 'Free Crop App', href: '/crop' },
      { label: 'FAQ', href: '/en/faq' },
    ],
    sameCountryLabel: 'Other Size ID Photos',
    specLabel: 'View specs',
    heroGlobal: 'GLOBAL PHOTO SPEC GUIDE',
    heroTitle: 'Photo Spec Guide',
    heroSub: 'ID photo specifications for 200+ countries — passport, visa, and more. Free crop service included.',
    statCountries: 'Countries', statSpecs: 'Specs', statVerified: 'Verified',
    hubFooter: '© 2026 MONKOS · Specifications verified from official sources. Confirm final requirements with the issuing authority.',
    freeCropCta: 'Free AI Crop →',
    searchPlaceholder: 'Search country...',
    selectPurpose: 'Select a purpose',
    backToContinent: '← Back to continents',
    backToPurpose: '← Back to purposes',
    countriesCount: 'countries',
    ctaBadge: '20 Years of Photography Expertise in AI · Done in 3 min',
    ctaHeadline1: 'One Selfie,',
    ctaHeadline2: 'Perfect ID Photo',
    ctaSub: 'No photo studio needed. Auto-fit for passport, resume & visa specs.\nAI retouches background, lighting & skin to studio quality.',
    ctaBtn: 'Try Free →',
    ctaHref: 'https://idphoto-kr.monkos.ai/',
    ctaPrice: 'Free on first login · $7.99 per photo after',
    heroLabel: 'PHOTO SPEC GUIDE',
    heroCta: 'Crop to this spec for free →',
    v2: {
      breadcrumbGuide: 'Specs Guide',
      makeTitle: 'Create Your {name} Photo',
      makeSub: 'One selfie is all it takes — a {size} compliant ID photo in minutes.',
      altSelfie: 'Selfie example', labelSelfie: '✓ Selfie',
      altProfile: 'Profile example', labelProfile: '✓ Profile',
      dropText: 'Drag & drop a photo, or', selectBtn: 'Choose Photo',
      guideChips: ['Front-facing', 'Chest-up framing', 'One person', 'Sharp focus', 'Mouth closed (no teeth)'],
      altCheck: 'Photo under review', checkTitle: 'Compliance Check', checking: 'AI is checking...',
      btnOtherPhoto: 'Another Photo', btnProceed: 'Continue',
      altPreview: 'Preview',
      payTitle: 'Create {type} Photo',
      payPrice: '$1.99',
      payDesc: 'Instant card checkout · No login required',
      orDivider: 'or',
      genText: 'AI is creating your {type} photo...',
      genSub: 'Takes about 30 seconds',
      labelBefore: 'Original', labelAfter: 'Result',
      btnDownload: 'Download', btnRetry: 'Try Another Photo',
      detailsTitle: 'Detailed Requirements', rejectionTitle: 'Top 5 Rejection Reasons', faqTitle: 'Frequently Asked Questions',
      sameTitle: 'Documents Accepting the Same Photo',
      sameSub: 'The documents below use the same spec ({size}) as {name}.',
      noGlasses: 'No glasses recommended',
      crossTitle: 'More MONKOS Services',
      crossSub: 'Explore more AI photo services beyond ID photos.',
      crossHeadshot: 'Job & Resume Photos', crossHeadshotSub: 'Polished AI headshots',
      crossProfile: 'Profile Photos', crossProfileSub: 'For SNS & LinkedIn',
      crossSpecs: 'All ID Photo Specs', crossSpecsSub: 'Specs by country & purpose',
      js: {
        errFileType: 'Only JPG, PNG, and HEIC files are supported.',
        errFileSize: 'Please upload a file under 10MB.',
        checkPass: 'Spec compliant! Press Continue.',
        checkFail: 'Some checks did not pass. We recommend another photo.',
        errCheck: 'Check failed',
        errCheckNet: 'Check error',
        errGen: 'Generation failed',
        errNet: 'Something went wrong. Please try again.',
        rateLimited: 'Too many requests. Please try again shortly.',
        payInitFail: 'Could not start the payment. Please try again shortly.',
        payUnavailable: 'Payment is not yet available for this region. Please check back soon.',
        payCancelled: 'Payment was cancelled.',
        payConfirming: 'Confirming your payment...',
        payConfirmFail: 'Payment confirmation failed. If this persists, contact info@monkos.ai.',
        payWaiting: 'Waiting for your payment...',
        payWaitingHint: 'This page will continue automatically once checkout is complete.',
        payTimeout: 'Payment confirmation is taking longer than expected. If you completed checkout, refresh this page shortly.',
        payFailed: 'The payment was not completed. Please try again.',
        imgLost: 'Payment confirmed. Re-upload the same photo to generate right away.',
        tokenInvalid: 'Payment info is invalid. Contact info@monkos.ai.',
        tokenUsed: 'This payment has already been used. Contact info@monkos.ai.',
        tokenExpired: 'This payment expired (24h). Contact info@monkos.ai.',
        genLimit: 'All 3 retries have been used. Contact info@monkos.ai.',
        downloadFail: 'Download failed. Contact info@monkos.ai.',
      },
    },
  },
};

// ─── CONTINENT META ─────────────────────────────────────────────

const CONTINENT_META = [
  { id: 'asia', ko: '아시아', ja: 'アジア', en: 'Asia', gradient: ['#1A3A2A', '#2D5A3A'], dot: '#6c4fff', image: 'cont_asia' },
  { id: 'europe', ko: '유럽', ja: 'ヨーロッパ', en: 'Europe', gradient: ['#1A1A3A', '#3A2A5A'], dot: '#A78BFA', image: 'cont_europe' },
  { id: 'americas', ko: '아메리카', ja: 'アメリカ大陸', en: 'Americas', gradient: ['#1A2A3A', '#2A3A5A'], dot: '#3B82F6', image: 'cont_americas' },
  { id: 'africa', ko: '아프리카', ja: 'アフリカ', en: 'Africa', gradient: ['#3A2A1A', '#5A3A1A'], dot: '#FFB020', image: 'cont_africa' },
  { id: 'oceania', ko: '오세아니아', ja: 'オセアニア', en: 'Oceania', gradient: ['#1A2A2A', '#1A3A4A'], dot: '#FF6B9D', image: 'cont_oceania' },
  { id: 'middleeast', ko: '중동', ja: '中東', en: 'Middle East', gradient: ['#2A2A1A', '#4A3A1A'], dot: '#F59E0B', image: 'cont_middleeast' },
];

// ─── TYPE CATEGORIES (4 purposes) ───────────────────────────────

const TYPE_CATEGORIES = [
  { id: 'passport', ko: '여권', ja: 'パスポート', en: 'Passport', sub: 'PASSPORT', icon: '', image: 'card_passport', slugs: ['passport'] },
  { id: 'visa', ko: '비자', ja: 'ビザ', en: 'Visa', sub: 'VISA', icon: '', image: 'card_visa', slugs: ['visa', 'schengen-visa', 'e-visa'] },
  { id: 'id', ko: '신분증', ja: '身分証', en: 'ID Card', sub: 'ID', icon: '', image: 'card_license', slugs: ['id', 'drivers-license', 'license', 'intl-license', 'mynumber', 'halfcard', 'resident', 'zairyu', 'exam', 'youth-id', 'taxi', 'marine'] },
  { id: 'custom', ko: '기타', ja: 'その他', en: 'Custom', sub: 'CUSTOM', icon: '', image: 'card_custom', slugs: ['resume', 'headshot'] },
];

// ─── SLUG PARSING ───────────────────────────────────────────────

const TYPE_SLUG_PATTERNS = [
  'schengen-visa', 'intl-license', 'drivers-license', 'youth-id',
  'visa-evisa', 'visa-bls', // 복합 type — 미등재 시 parseSlug가 country를 'in-visa'로 오분해 → canonical 301 루프
  'passport', 'visa', 'e-visa', 'resume', 'halfcard', 'headshot',
  'mynumber', 'resident', 'zairyu', 'license', 'taxi', 'marine', 'exam', 'id',
];

function parseSlug(slug) {
  for (const pattern of TYPE_SLUG_PATTERNS) {
    if (slug.endsWith('-' + pattern)) {
      return { typeSlug: pattern, countrySlug: slug.slice(0, -(pattern.length + 1)) };
    }
  }
  const idx = slug.lastIndexOf('-');
  return idx > 0
    ? { typeSlug: slug.slice(idx + 1), countrySlug: slug.slice(0, idx) }
    : { typeSlug: slug, countrySlug: '' };
}

function getTypeCategory(typeSlug) {
  for (const cat of TYPE_CATEGORIES) {
    if (cat.slugs.includes(typeSlug)) return cat.id;
  }
  return 'custom';
}

const COUNTRY_SLUG_TO_ISO = {
  korea: 'kr', japan: 'jp', usa: 'us', canada: 'ca',
  uk: 'gb', germany: 'de', spain: 'es', australia: 'au',
  singapore: 'sg', thailand: 'th', india: 'in', china: 'cn',
  vietnam: 'vn', indonesia: 'id', eu: 'eu',
};

function canonicalCountry(countrySlug) {
  return COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug;
}

// 6/19 슬러그 체계 변경(fe0a38f3)으로 통폐합된 옛 type → 새 type.
// 색인된 옛 URL(/specs/korea-drivers-license 등) 301 복구용. 검증되는 대로 확장.
const TYPE_ALIASES = {
  'drivers-license': 'license',   // 운전면허
  'resident': 'id',               // 주민등록증 → 신분증
  'mynumber': 'id',               // 마이넘버카드 → 신분증
  'zairyu': 'residence',          // 재류카드 → 거주
  // 'halfcard'(반명함)는 신규 데이터에 정본 없음 → 404(noindex) 유지
};

// 404 시 text/plain 대신 HTML 반환 — 모바일 Safari의 .txt 다운로드 오인 방지 + UX
function specs404Html(prefix, lang) {
  const msg = lang === 'ja' ? 'お探しの規格ページが見つかりません。'
    : lang === 'en' ? 'The requested spec page was not found.'
    : '요청하신 규격 페이지를 찾을 수 없습니다.';
  const cta = lang === 'ja' ? '証明写真の規格一覧へ' : lang === 'en' ? 'Browse all photo specs' : '증명사진 규격 전체 보기';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 · MONKOS</title></head><body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:64px 20px;color:#222"><h1 style="font-size:48px;margin:0">404</h1><p style="color:#666">${msg}</p><p><a href="${prefix}/specs" style="color:#6b4eff;text-decoration:none">${cta} →</a></p></body></html>`;
}

function countryFlag(countrySlug, size = 32) {
  const code = (COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug).toLowerCase();
  if (code.length !== 2) return '';
  const w = size;
  const h = Math.round(size * 0.75);
  // flagcdn.com 지원 너비: 20, 40, 80, 160, 320, 640 (2025년 이후 64 등 비표준 404)
  const VALID_WIDTHS = [20, 40, 80, 160, 320, 640];
  const target = w * 2;
  const cdnW = VALID_WIDTHS.find(s => s >= target) || 640;
  return `<img src="https://flagcdn.com/w${cdnW}/${code}.webp" alt="${code}" width="${w}" height="${h}" class="flag-icon" loading="lazy" onerror="this.style.display='none'">`;
}

// ─── BUILD ROUTE MAPS (at module load) ──────────────────────────

const ROUTE_MAP = {};
export const REDIRECT_MAP = {};
const COUNTRY_BEST = {};

for (const [slug, spec] of Object.entries(SPECS_DATA)) {
  const { typeSlug, countrySlug } = parseSlug(slug);
  const routeKey = `${typeSlug}/${countrySlug}`;
  ROUTE_MAP[routeKey] = slug;
  REDIRECT_MAP[slug] = routeKey;

  const category = getTypeCategory(typeSlug);
  const continent = spec.continent || 'other';
  const dedupKey = `${category}:${continent}:${countrySlug}`;
  if (!COUNTRY_BEST[dedupKey] || spec.priority < COUNTRY_BEST[dedupKey].priority) {
    COUNTRY_BEST[dedupKey] = { slug, typeSlug, countrySlug, priority: spec.priority };
  }
}

function locField(spec, field, lang) {
  if (lang === 'en' && spec[field + 'En']) return spec[field + 'En'];
  if (lang === 'ja' && spec[field + 'Ja']) return spec[field + 'Ja'];
  return spec[field];
}

function parseSizeMm(sizeStr) {
  if (!sizeStr) return null;
  const mmMatch = sizeStr.match(/(\d+)\s*[×x]\s*(\d+)\s*mm/i);
  if (mmMatch) return `${mmMatch[1]}x${mmMatch[2]}`;
  const cmMatch = sizeStr.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*cm/i);
  if (cmMatch) return `${Math.round(parseFloat(cmMatch[1]) * 10)}x${Math.round(parseFloat(cmMatch[2]) * 10)}`;
  const inchMm = sizeStr.match(/inch[^(]*\((\d+)\s*[×x]\s*(\d+)\s*mm\)/i);
  if (inchMm) return `${inchMm[1]}x${inchMm[2]}`;
  return null;
}

// ─── DARK THEME CSS ─────────────────────────────────────────────

// 리스트·v1 상세 공용 CSS → public/css/specs-base.css (2026-07-12 퍼널 분리)

// ─── HUB PAGE (/specs) ─────────────────────────────────────────

function buildHubData(lang) {
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const result = {};

  for (const cat of TYPE_CATEGORIES) {
    result[cat.id] = {};
    for (const cm of CONTINENT_META) {
      result[cat.id][cm.id] = [];
    }
  }

  const seen = {};
  const sorted = Object.entries(SPECS_DATA).sort((a, b) => a[1].priority - b[1].priority);

  for (const [slug, spec] of sorted) {
    const { typeSlug, countrySlug } = parseSlug(slug);
    const category = getTypeCategory(typeSlug);
    const continent = spec.continent || 'other';
    if (!result[category] || !result[category][continent]) continue;

    const dedupKey = `${category}:${continent}:${canonicalCountry(countrySlug)}`;
    if (seen[dedupKey]) continue;
    seen[dedupKey] = true;

    const countryName = lang === 'en' ? (spec.countryEn || spec.country) : (lang === 'ja' ? (spec.countryJa || spec.country) : spec.country);
    const typeName = lang === 'ja' ? (spec.typeJa || spec.type) : (lang === 'en' ? (spec.typeEn || spec.type) : spec.type);

    result[category][continent].push({
      flag: countryFlag(countrySlug),
      name: countryName,
      type: typeName,
      size: locField(spec, 'size', lang),
      url: `${prefix}/specs/${typeSlug}/${countrySlug}`,
    });
  }

  return result;
}

export function specsListFragment(forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;

  const hubData = buildHubData(lang);
  const totalCountries = new Set(Object.values(SPECS_DATA).map(s => s.countryEn || s.country)).size;
  const totalSpecs = Object.keys(SPECS_DATA).length;

  const canonicalUrl = lang === 'ko' ? 'https://monkos.ai/specs' : `https://monkos.ai/${lang}/specs`;
  const hreflangTags = [
    '<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs">',
    '<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs">',
    '<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs">',
    '<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs">',
  ].join('\n');

  const itemListJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": i.hubH1,
    "description": i.hubDesc,
    "url": canonicalUrl,
  });

  const seoMeta = `<meta property="og:title" content="${escapeHtml(i.hubH1)} | MONKOS AI">
<meta property="og:description" content="${escapeHtml(i.hubDesc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="https://monkos.ai/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHtml(i.hubH1)} | MONKOS AI">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://monkos.ai/og-image.png">
<meta name="theme-color" content="#05080E">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${itemListJsonLd}</script>`;

  const purposeCardsHtml = TYPE_CATEGORIES.map(cat => {
    const name = cat[lang] || cat.en;
    return `<div class="purpose-card" data-cat="${cat.id}">
      <img src="/images/cards/${cat.image}.webp" alt="${escapeHtml(name)}" width="300" height="100" loading="lazy"
           onerror="this.style.display='none'">
      <div class="overlay">
        <span class="p-name">${escapeHtml(name)}</span>
        <span class="p-sub">${cat.sub}</span>
      </div>
    </div>`;
  }).join('\n    ');

  const continentCardsHtml = CONTINENT_META.map(cm => {
    const name = cm[lang] || cm.en;
    return `<div class="continent-card" data-cont="${cm.id}" style="display:none">
      <img src="/images/continents/${cm.image}.webp" alt="${escapeHtml(name)}" width="300" height="120" loading="lazy"
           onerror="this.style.display='none'">
      <div class="overlay" style="background:linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)">
        <span class="c-name">${escapeHtml(name)}</span>
        <span class="c-name-en">${cm.en.toUpperCase()}</span>
        <span class="c-count" data-cont-count="${cm.id}"></span>
      </div>
    </div>`;
  }).join('\n    ');

  const hubDataJson = JSON.stringify(hubData);

  const bodyContent = `
  <div class="specs-hub-hero">
    <div class="hero-global">${i.heroGlobal}</div>
    <h1>${escapeHtml(i.heroTitle)}</h1>
    <p class="hero-sub">${escapeHtml(i.heroSub)}</p>
    <div class="specs-hub-stats">
      <div class="specs-hub-stat"><div class="stat-num">${totalCountries}+</div><div class="stat-label">${escapeHtml(i.statCountries)}</div></div>
      <div class="specs-hub-stat"><div class="stat-num">${totalSpecs}+</div><div class="stat-label">${escapeHtml(i.statSpecs)}</div></div>
      <div class="specs-hub-stat"><div class="stat-num">35+</div><div class="stat-label">${escapeHtml(i.statVerified)}</div></div>
    </div>
  </div>

  <div class="specs-search-wrap">
    <input type="search" id="country-search" placeholder="${escapeHtml(i.searchPlaceholder)}" autocomplete="off">
    <div class="specs-search-results" id="search-results"></div>
  </div>

  <div id="purpose-section">
    <div class="section-title">${escapeHtml(i.selectPurpose)}</div>
    <div class="purpose-grid">
      ${purposeCardsHtml}
    </div>
  </div>

  <div id="continent-section" style="display:none">
    <div class="section-title">
      <button class="back-btn" id="back-to-purpose">${escapeHtml(i.backToPurpose)}</button>
    </div>
    <div class="continent-grid">
      ${continentCardsHtml}
    </div>
  </div>

  <div id="country-section" style="display:none">
    <div class="section-title">
      <button class="back-btn" id="back-to-continent">${escapeHtml(i.backToContinent)}</button>
    </div>
    <div class="country-grid" id="country-grid"></div>
  </div>

  <div class="specs-hub-footer">${i.hubFooter}</div>`;

  // 리스트 클라 JS → public/js/specs-list.js (2026-07-12 퍼널 분리 — 설정만 인라인 주입)
  const pageScript = `window.__SPECS_LIST_CFG__ = { hubData: ${hubDataJson}, countriesLabel: '${escapeHtml(i.countriesCount)}' };`;

  return {
    title: i.hubTitle,
    description: i.hubDesc,
    seoMeta: seoMeta + specsCssLink('specs-base'),
    htmlLang: lang,
    pageStyle: '',
    bodyContent: bodyContent + specsJsTag('specs-list'),
    pageScript,
  };
}

// ─── DETAIL PAGE (/specs/:type/:country) ────────────────────────

// ─── SPECS V2 — kr-passport 카드형 리디자인 ────────────────────

// V2 롤아웃 게이트 (2026-07-04 DESIGN_specs_2tier)
// - V2_DIRECT_SLUGS: 옛 1-segment URL(/specs/kr-passport)을 301 없이 200으로 직접 서빙하는 파일럿 슬러그.
//   확장 게이트를 여기에 그대로 쓰면 1-segment 428건의 301이 전부 해제되어 canonical(2-segment)과
//   중복 서빙되므로 렌더 게이트와 분리 유지. 나머지 슬러그는 계속 2-segment 정본으로 301.
const V2_DIRECT_SLUGS = new Set(['kr-passport']);

// 생성 엔진 호환성 게이트 (2026-07-04 감사 P0 대응)
// 생성 엔진(idphoto-generate.js)은 3:4 비율·흰색 배경으로 고정 출력한다.
// v2 페이지는 '셀카 한 장이면 {해당 규격} 규격 증명사진이 완성됩니다'를 약속하므로,
// 엔진이 충족할 수 없는 규격(정방형 등 비율 불일치, 비백색 배경)은 v2에서 제외하고
// v1(생성 CTA 없음)을 유지한다 — 규격 위반 결과물을 규격 적합으로 안내하는 사고 차단.
// - 비율: size의 세로/가로 ≥ 1.15 (3:4=1.333 근사 허용). 파싱 불가(cn-resume 등)는 제외.
// - 배경: '흰'/'White'로 시작하는 값만 허용 (흰/회색·흰색·파란 배경 등 흰색 허용 규격 포함).
function isEngineCompatibleSpec(specData) {
  if (!specData) return false;
  const m = String(specData.size || '').match(/([0-9.]+)\s*[×x]\s*([0-9.]+)/);
  if (!m) return false;
  const w = parseFloat(m[1]);
  const h = parseFloat(m[2]);
  // 정사각(1:1)까지 허용 — 규격 안착 크롭 파이프라인(crop-engine v2)이 비율을 보장 (2026-07-06 게이트 완화).
  // 종전 h/w ≥ 1.15는 크롭 부재 시절의 보수 게이트 (07-04 감사 P0). 가로형(h<w)만 계속 제외.
  if (!w || !h || h / w < 1.0) return false;
  // 유색 배경은 잔존 제외 — 생성 엔진이 순백 고정 (배경 재채색 미구현)
  const bg = String(specData.background || '').trim();
  return bg.startsWith('흰') || /^white/i.test(bg);
}

// 렌더 분기: 파일럿(kr-passport)은 en/ja 포함 기존 동작 보존, 그 외는 ko 언어 한정 +
// 생성 엔진 호환 규격에만 v2.
// en/ja는 레몬 단건 variant env가 설정된 경우에만 v2 확장 (DESIGN_20260704_결제연동트랙 §2-D).
// env 미설정(기본 '') → v1 유지 = 코드 배포만으로는 en/ja 표면 변화 없음 (반쪽 롤아웃 방지).
function isV2Spec(slug, lang) {
  if (V2_DIRECT_SLUGS.has(slug)) return true;
  if (!isEngineCompatibleSpec(SPECS_DATA[slug])) return false;
  if (lang === 'ko') return true;
  // en/ja 공통: 글로벌 USD 단일 variant 기준 (2026-07-05 USD 통일 — JP 별도 variant 폐지)
  if (lang === 'en' || lang === 'ja') return Boolean(LEMONSQUEEZY_VARIANT_SPECS_SINGLE);
  return false;
}

// v2 상세 CSS → public/css/specs-funnel.css (2026-07-12 퍼널 분리)

// kr-passport 파일럿 전용 폴백 상수 — en/ja 페이지에서도 한국어가 노출되지 않도록 3언어화
const V2_REJECTIONS = {
  ko: [
    { title: '배경 그림자 / 음영', desc: '얼굴 앞·뒤로 그림자가 생긴 경우' },
    { title: '머리 높이 규격 초과', desc: '정수리~턱이 32-36mm 범위를 벗어남' },
    { title: '표정 · 미소', desc: '입을 벌리거나 치아가 보이는 사진' },
    { title: '안경 반사 / 컬러렌즈', desc: '렌즈에 빛 반사 또는 색조 렌즈 착용' },
    { title: '앞머리·장신구로 얼굴 가림', desc: '이마·눈썹·귀 윤곽이 가려진 경우' },
  ],
  ja: [
    { title: '背景の影', desc: '顔の前後に影がある場合' },
    { title: '頭の高さが規格外', desc: '頭頂〜顎が32-36mmの範囲外' },
    { title: '表情・笑顔', desc: '口が開いている、歯が見える写真' },
    { title: '眼鏡の反射・カラーコンタクト', desc: 'レンズの光反射やカラーコンタクトの着用' },
    { title: '前髪・アクセサリーで顔が隠れる', desc: '額・眉・耳の輪郭が隠れている場合' },
  ],
  en: [
    { title: 'Background shadows', desc: 'Shadows in front of or behind the face' },
    { title: 'Head height out of range', desc: 'Crown-to-chin outside the 32-36mm range' },
    { title: 'Expression / smile', desc: 'Open mouth or visible teeth' },
    { title: 'Glasses glare / colored lenses', desc: 'Light reflecting on lenses or tinted contacts' },
    { title: 'Face covered by hair or accessories', desc: 'Forehead, eyebrows, or ears obscured' },
  ],
};

const V2_DETAILS = {
  ko: [
    '촬영 6개월 이내, 정면을 응시한 상반신 사진',
    '균일한 흰색 배경, 그림자·무늬·테두리 없음',
    '입은 다물고 무표정 — 치아가 보이면 반려',
    '안경 착용 시 빛 반사·뿔테로 눈 가림 금지 (운전면허는 무안경 권장)',
    '머리카락·장신구로 얼굴 윤곽을 가리지 않을 것',
    '컬러 사진, 자연스러운 피부 톤 · 과도한 보정 금지',
  ],
  ja: [
    '撮影から6ヶ月以内、正面を向いた上半身の写真',
    '均一な白背景、影・模様・縁取りなし',
    '口を閉じて無表情 — 歯が見えると却下',
    '眼鏡着用時は光の反射・太いフレームで目を隠さないこと（運転免許は眼鏡なし推奨）',
    '髪やアクセサリーで顔の輪郭を隠さないこと',
    'カラー写真、自然な肌トーン · 過度な補正禁止',
  ],
  en: [
    'Taken within the last 6 months, upper body facing the camera',
    'Uniform white background with no shadows, patterns, or borders',
    'Mouth closed, neutral expression — visible teeth cause rejection',
    'If wearing glasses, no glare or thick frames covering the eyes (no glasses recommended for driver licenses)',
    'Hair and accessories must not cover the outline of the face',
    'Color photo with natural skin tone · no excessive retouching',
  ],
};

const V2_FAQ_FALLBACK = {
  ko: [
    { q: '여권사진과 운전면허증 사진이 같나요?', a: '네, 대한민국 여권과 운전면허증은 모두 35×45mm 규격으로 동일합니다. 다만 운전면허증은 안경 미착용을 권장합니다.' },
    { q: 'AI로 만든 얼굴 사진을 제출해도 되나요?', a: '아니요. AI 생성 이미지(딥페이크 등)는 제출 불가합니다. MONKOS AI는 실제 사진의 배경·크기·밝기를 규격에 맞게 보정하는 것이지, 얼굴을 생성하지 않습니다.' },
    { q: '온라인 신청용 파일 규격은 어떻게 되나요?', a: '가로 413 × 세로 531 픽셀, JPEG 형식, 500KB 이하, 300DPI 이상을 권장합니다.' },
  ],
  ja: [
    { q: 'パスポート写真と運転免許証の写真は同じですか？', a: 'はい、韓国のパスポートと運転免許証はどちらも35×45mmの同一規格です。ただし、運転免許証は眼鏡なしを推奨します。' },
    { q: 'AIで作った顔写真を提出してもいいですか？', a: 'いいえ。AI生成画像（ディープフェイクなど）は提出できません。MONKOS AIは実際の写真の背景・サイズ・明るさを規格に合わせて補正するもので、顔を生成するものではありません。' },
    { q: 'オンライン申請用のファイル規格は？', a: '幅413 × 高さ531ピクセル、JPEG形式、500KB以下、300DPI以上を推奨します。' },
  ],
  en: [
    { q: 'Are passport and driver license photos the same?', a: 'Yes, Korean passports and driver licenses both use the same 35×45mm spec. However, no glasses are recommended for driver license photos.' },
    { q: 'Can I submit an AI-generated face photo?', a: 'No. AI-generated images (deepfakes, etc.) cannot be submitted. MONKOS AI adjusts the background, size, and brightness of your real photo to meet the spec — it does not generate faces.' },
    { q: 'What is the file spec for online applications?', a: '413 × 531 pixels, JPEG format, under 500KB, and 300DPI or higher are recommended.' },
  ],
};

// 파일럿 CSS → public/css/specs-pilot.css (2026-07-12 퍼널 분리)

function specsDetailV2Fragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const v2 = i.v2 || SPECS_I18N.ko.v2;
  // 시장 판별: 결제 PG 분기 정본 (kr=토스, jp=레몬 JP 스토어, global=레몬 글로벌)
  const market = lang === 'ja' ? 'jp' : lang === 'en' ? 'global' : 'kr';
  // T0 무료 퍼널 (2026-07-10 파일럿 → 2026-07-11 작가님 전면 개방 지시): v2 ko 전 슬러그 승격.
  // en/ja는 퍼널 문구 3언어화 후 개방 예정. T1 리터칭은 서버 FREE_PILOT_SLUGS(kr-passport) 파일럿 유지.
  const isPilot = lang === 'ko';
  // T1 리터칭 실동작 여부 — 카드 문구·CTA를 서버 플래그와 결합 (off인데 '리터칭' 판매 금지, 2026-07-10 리뷰 확정)
  // 서버 리터칭 게이트(server.js isT1Path)와 정합 — 리터칭이 실행되지 않는 슬러그에 활성 카드 노출 금지
  // (2026-07-11 T0 전면 개방 때 env-only 분기가 전 페이지로 새던 것을 작가님 실캡처로 적발)
  // 2026-07-13 작가님 승인: T1 전 슬러그 개방 (kr-passport 파일럿 졸업) — 서버 게이트와 동시 개방
  const t1RetouchOn = process.env.PILOT_T1_RETOUCH === '1';
  const fmtV2 = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;

  const { typeSlug, countrySlug } = parseSlug(slug);
  const newPath = `${typeSlug}/${countrySlug}`;
  const countryName = lang === 'en' ? (specData.countryEn || specData.country) : lang === 'ja' ? (specData.countryJa || specData.country) : specData.country;
  const typeName = lang === 'ja' ? (specData.typeJa || specData.type) : (lang === 'en' ? specData.typeEn : specData.type);
  const title = (specData.seoTitle && specData.seoTitle[lang]) || `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = (specData.seoDescription && specData.seoDescription[lang]) || '';

  const canonicalUrl = lang === 'ko' ? `https://monkos.ai/specs/${newPath}` : `https://monkos.ai/${lang}/specs/${newPath}`;
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/${newPath}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/${newPath}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/${newPath}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/${newPath}">`,
  ].join('\n');

  const faqs = (specData.faqs && (specData.faqs[lang] || specData.faqs.ko)) || (V2_FAQ_FALLBACK[lang] || V2_FAQ_FALLBACK.ko);
  const ogGuideKey = GUIDE_IMAGES.has(`${slug}_${lang}`) ? `${slug}_${lang}`
    : GUIDE_IMAGES.has(slug) ? slug : (parseSizeMm(specData.size) || 'kr-passport');
  const ogImageAbsolute = `https://monkos.ai/images/guides/${ogGuideKey}.webp`;
  const specsLabel = { ko: '규격', en: 'Specs', ja: '規格' }[lang] || 'Specs';

  const specsJsonLdArr = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "MONKOS", "item": "https://monkos.ai" },
        { "@type": "ListItem", "position": 2, "name": specsLabel, "item": `https://monkos.ai${lang === 'ko' ? '' : '/' + lang}/specs` },
        { "@type": "ListItem", "position": 3, "name": `${countryName} ${typeName}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": ogImageAbsolute,
      "inLanguage": lang,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      // 브랜드 엔티티=MONKOS(전 표면 통일, ch8) + 법적 실체=몽크 스튜디오(legalName 보존) — 2026-07-13 작가님 확정
      "publisher": { "@type": "Organization", "name": "MONKOS", "legalName": "몽크 스튜디오 (Monk Studio)", "url": "https://monkos.ai" },
      "datePublished": "2026-03-26",
      "dateModified": SPECS_DATA_MODIFIED,
      // 규격 수치 기계가독화 — 생성형 엔진(GEO) 인용 표면 (표 HTML만으로는 미노출)
      "about": {
        "@type": "Thing",
        "name": `${countryName} ${typeName}`,
        "additionalProperty": [
          { "@type": "PropertyValue", "name": "photo size", "value": locField(specData, 'size', lang) },
          { "@type": "PropertyValue", "name": "background", "value": locField(specData, 'background', lang) },
          { "@type": "PropertyValue", "name": "head height", "value": locField(specData, 'headHeight', lang) },
        ].filter(p => p.value && String(p.value).trim()),
      },
    },
    ...(faqs.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    }] : []),
  ];

  const seoMeta = `<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${ogImageAbsolute}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${JSON.stringify(specsJsonLdArr)}</script>`;

  const h = i.tableHeaders;
  // 파일 규격은 정본 데이터(fileSpec) 사용 — 한국 여권 온라인 신청 규격(500KB/JPEG) 하드코딩 금지
  const dpiSuffix = lang === 'ja' ? '以上' : lang === 'en' ? 'or higher' : '이상';
  const reqBadgeLabel = lang === 'ja' ? '必須' : lang === 'en' ? 'Required' : '필수';
  const specRows = [
    [h.size, locField(specData, 'size', lang), ''],
    [h.pixels, locField(specData, 'pixels', lang), ''],
    [h.dpi, specData.dpi ? `${specData.dpi} ${dpiSuffix}` : '', ''],
    [h.background, locField(specData, 'background', lang), ''],
    [h.headHeight, locField(specData, 'headHeight', lang), `<span class="v2-badge v2-badge-req">${reqBadgeLabel}</span>`],
    [h.validity, locField(specData, 'validity', lang), ''],
    [h.fileSpec, locField(specData, 'fileSpec', lang), ''],
  ].filter(([, val]) => val && String(val).trim())
   .map(([label, val, badge]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}${badge}</td></tr>`
  ).join('');

  // GEO 요약문 — 규격 수치를 자연문 1문장으로 (JSON-LD about과 동일 정본 필드, 표기만 언어별)
  const geoSummary = (() => {
    const size = locField(specData, 'size', lang);
    const bg = locField(specData, 'background', lang);
    const hh = locField(specData, 'headHeight', lang);
    if (lang === 'en') return `${countryName} ${typeName} photo requirements: ${size}${bg ? `, ${String(bg).toLowerCase()} background` : ''}${hh ? `, head height ${hh}` : ''}.`;
    if (lang === 'ja') return `${countryName}${typeName}写真の規格は${size}${bg ? `、背景は${bg}` : ''}${hh ? `、頭部の高さは${hh}` : ''}です。`;
    return `${countryName} ${typeName} 사진 규격은 ${size}${bg ? `, ${bg} 배경` : ''}${hh ? `, 머리 높이 ${hh}` : ''}입니다.`;
  })();

  const sizeMm = parseSizeMm(specData.size);
  // 브랜드 도해 우선: {slug}_{lang}(국기+타이틀+MONKOS.AI 내장, 2026-07-11) → 구 슬러그 → 사이즈 패턴 폴백
  const guideKey = GUIDE_IMAGES.has(`${slug}_${lang}`) ? `${slug}_${lang}`
    : GUIDE_IMAGES.has(slug) ? slug : sizeMm;
  const imgSrc = `/images/guides/${guideKey}.webp`;
  const fallbackSrc = sizeMm ? `/images/guides/${sizeMm}.webp` : '';

  // 치수·머리높이 시각화는 1:1 도해 이미지에 내장 (2026-07-11 작가님 확정 — 생성기: 세션 스크립트 gen_reference_diagrams)

  // 상세 규정 — 정본 데이터 우선: detailSections > (kr-passport 파일럿 문구) > details 문장 분해 > 공통 규정.
  // V2_DETAILS는 한국 일반 규정이므로 kr-passport 외 슬러그에 폴백 금지 (타국 오정보 방지)
  const detailText = (specData.details && (specData.details[lang] || specData.details.ko)) || '';
  const detailLines = detailText.split(/[.。]\s*/).map(d => d.trim()).filter(Boolean);
  const detailItems = (specData.detailSections && specData.detailSections[lang])
    ? specData.detailSections[lang].flatMap(s => s.items)
    : slug === 'kr-passport' ? (V2_DETAILS[lang] || V2_DETAILS.ko)
    : detailLines.length ? detailLines
    : (COMMON_RULES[lang] || COMMON_RULES.ko);
  const detailHtml = detailItems.map(d => `<li>${escapeHtml(d)}</li>`).join('');

  // 반려사유 — kr-passport는 파일럿 상세본(desc 포함) 유지, 그 외는 정본 데이터(rejectionReasons: 문자열 배열)
  const dataRejections = (specData.rejectionReasons && (specData.rejectionReasons[lang] || specData.rejectionReasons.ko)) || [];
  const rejections = slug === 'kr-passport'
    ? (V2_REJECTIONS[lang] || V2_REJECTIONS.ko)
    : dataRejections.slice(0, 5).map(r => ({ title: r, desc: '' }));
  const rejectHtml = rejections.map(r =>
    `<li><div class="v2-rj-title">${escapeHtml(r.title)}</div>${r.desc ? `<div class="v2-rj-desc">${escapeHtml(r.desc)}</div>` : ''}</li>`
  ).join('');

  // 수치 박스 탭 라벨 + 공식 출처 링크 (2026-07-11 작가님: DB 보유 출처를 규정 박스에 노출, 없으면 미표기)
  const tabSpecLabel = { ko: '규격', en: 'Specs', ja: '規格' }[lang] || '규격';
  const sourceLabel = { ko: '출처', en: 'Source', ja: '出典' }[lang] || '출처';
  const sourceHtml = (() => {
    const os = specData.officialSource;
    const url = (os && os.url) || (typeof specData.source === 'string' && /^https?:/i.test(specData.source) ? specData.source : null);
    if (!url) return '';
    let label = os && os.label && (os.label[lang] || os.label.ko);
    if (!label) { try { label = new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
    return `<div class="v2-source">${escapeHtml(sourceLabel)}: <a href="${escapeHtml(url)}" target="_blank" rel="noopener nofollow">${escapeHtml(label)} &#8599;</a></div>`;
  })();

  const sameSize = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.size === specData.size && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameHtml = sameSize.map(s => {
    const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
    const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
    // 언어 무관 slug 기준 판정 (구: 한국어 typeName 문자열 비교 — en/ja에서 항상 false였음)
    const note = (ts === 'license' || ts === 'drivers-license') ? `<div class="v2-same-note">${escapeHtml(v2.noGlasses)}</div>` : '';
    return `<a href="${prefix}/specs/${ts}/${cs}" class="v2-same-card">
      <span class="v2-same-icon">📄</span>
      <div><div class="v2-same-name">${escapeHtml(name)}</div><div class="v2-same-size">${escapeHtml(locField(s, 'size', lang))}</div>${note}</div>
    </a>`;
  }).join('');

  const faqHtml = faqs.map((f, idx) =>
    `<div class="v2-faq-item${idx === 0 ? ' open' : ''}">
      <div class="v2-faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.q)}</div>
      <div class="v2-faq-a">${escapeHtml(f.a)}</div>
    </div>`
  ).join('');

  // 2-티어 CTA (DESIGN_20260704_specs_2tier): T1 = ₩2,000 즉시결제(주 CTA), T2 = 발급보장 업셀 링크.
  // 보장 상세 약속 문구 금지 — 규정 미승인 상태(작가님 승인 대기), 한 줄 절제 표기만.
  // ⚠️ 2026-07-13 작가님: T2 노출 전면 잠정 중지 (운영체계 확정 전 판매 금지) — fit 링크·결과 카드·en/ja 업셀 3지점 제거.
  //    아래 upsell* 정의는 복원 대비 존치(현재 미사용). 복원 시 git f3dce941 직전 상태 참조.
  const upsellHref = lang === 'ja' ? 'https://idphoto-jp.monkos.ai/' : 'https://idphoto-kr.monkos.ai/';
  const upsellLabel = lang === 'ja' ? '却下の心配なく — 発行保証 ¥990 →'
    : lang === 'en' ? 'No rejection worries — guaranteed issue ₩9,900 →'
    : '반려 걱정 없이 — 발급보장 ₩9,900 →';
  const upsellHtml = `<div class="v2-upsell"><a href="${upsellHref}" data-cta="specs-upsell" rel="noopener">${escapeHtml(upsellLabel)}</a></div>`;

  const fullName = `${countryName} ${typeName}`;
  const bodyContent = `
  ${market === 'kr' ? '<script src="https://js.tosspayments.com/v2/standard"></script>' : ''}
  <div class="v2-wrap${isPilot ? ' idpass-pilot' : ''}" data-slug="${slug}">
    <!-- 1. 헤더 -->
    <nav class="v2-breadcrumb">
      <a href="${prefix}/specs">${escapeHtml(v2.breadcrumbGuide)}</a> &gt; ${escapeHtml(countryName)} &gt; ${escapeHtml(typeName)}
    </nav>
    <div class="v2-header">
      <h1>${escapeHtml(countryName)} ${escapeHtml(typeName)}</h1>
      <div class="v2-sub">${escapeHtml(specData.countryEn || countryName)} ${escapeHtml(specData.typeEn || typeName)} Photo Specification</div>
    </div>
    <!-- 상단 sameSize 태그 전역 제거 (2026-07-11 작가님 — 어제 파일럿 한정 제거를 전 페이지 확장.
         동일규격 내부링크 정본 = 하단 롤다운 카드) -->
    <div class="v2-tags">
      <span class="v2-tag">${escapeHtml(countryName)}</span>
      <span class="v2-tag">${escapeHtml(typeName)}</span>
    </div>

    <!-- GEO 요약문 — 수치 명시 1문단. AI 오버뷰·생성형 엔진의 인용 표적 (2026-07-13 헤드텀 설계 §4-4) -->
    <p class="v2-geo-summary">${escapeHtml(geoSummary)}</p>

    <!-- 2. 핵심 규격 듀오 — 이미지 박스 + 수치 박스(탭) 분리. DOM 순서=모바일 순서(이미지 먼저) -->
    <div class="v2-spec-duo">
      <div class="v2-half-card v2-card-diagram">
        <img class="v2-diagram-img" src="${imgSrc}" alt="${escapeHtml(countryName)} ${escapeHtml(typeName)} ${escapeHtml(locField(specData, 'size', lang))}"
             onerror="this.src='${fallbackSrc}';this.onerror=function(){this.style.display='none'}">
      </div>
      <div class="v2-half-card v2-card-specs">
        <div class="v2-tabs" role="tablist">
          <button type="button" class="v2-tab on" data-pane="spec" onclick="v2SpecTab(this)">${escapeHtml(tabSpecLabel)}</button>
          ${detailHtml ? `<button type="button" class="v2-tab" data-pane="detail" onclick="v2SpecTab(this)">${escapeHtml(v2.detailsTitle)}</button>` : ''}
          ${rejectHtml ? `<button type="button" class="v2-tab" data-pane="reject" onclick="v2SpecTab(this)">${escapeHtml(v2.rejectionTitle)}</button>` : ''}
        </div>
        <div class="v2-tabpane" data-pane="spec">
          <table class="v2-spec-table">
            ${specRows}
          </table>
          ${sourceHtml}
        </div>
        ${detailHtml ? `<div class="v2-tabpane" data-pane="detail" hidden>
          <ul class="v2-detail-list">${detailHtml}</ul>
          ${sourceHtml}
        </div>` : ''}
        ${rejectHtml ? `<div class="v2-tabpane" data-pane="reject" hidden>
          <ol class="v2-reject-list">${rejectHtml}</ol>
        </div>` : ''}
      </div>
    </div>
    <script>function v2SpecTab(btn){var card=btn.closest('.v2-card-specs');card.querySelectorAll('.v2-tab').forEach(function(b){b.classList.toggle('on',b===btn)});card.querySelectorAll('.v2-tabpane').forEach(function(p){p.hidden=p.getAttribute('data-pane')!==btn.getAttribute('data-pane')});}</script>

    <!-- 3. 사진 만들기 (T1 셀프서브 즉시결제) -->
    <div class="v2-steps-section" id="v2-steps">
      <div class="v2-steps-title">${escapeHtml(fmtV2(v2.makeTitle, { name: fullName }))}</div>
      <div class="v2-steps-sub">${escapeHtml(fmtV2(v2.makeSub, { size: locField(specData, 'size', lang) }))}</div>

      <!-- Phase 1: 업로드 -->
      <div class="v2-make-layout" id="v2-phase-upload">
        <div class="v2-upload-with-guides">
          <div class="v2-upload-zone" id="v2-dropzone">
            <div class="v2-upload-icon">&#8615;</div>
            <div class="v2-upload-main-text">${escapeHtml(v2.dropText)}</div>
            <button type="button" class="v2-upload-btn">${escapeHtml(v2.selectBtn)}</button>
            <input type="file" id="v2-file-input" accept="image/*" style="display:none">
            <div class="v2-upload-hint">JPG, PNG, HEIC / max 10MB</div>
            <div class="v2-upload-guide">
              <div class="v2-guide-items">
                ${v2.guideChips.map(c => `<span>${escapeHtml(c)}</span>`).join('\n                ')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 에러 안내 — 페이즈 밖 공통 위치 (숨겨진 페이즈 내부에 있으면 무음, 2026-07-10 리뷰 확정) -->
      <div class="v2-error-msg" id="v2-error"></div>

      <!-- Phase 2: AI 검수 결과 -->
      <div class="v2-make-layout" id="v2-phase-check" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-check-img" src="" alt="${escapeHtml(v2.altCheck)}">
          </div>
          <div class="v2-checklist-side">
            <div class="v2-checklist-title">${isPilot ? '사진 확인 중' : escapeHtml(v2.checkTitle)}</div>
            <div class="v2-checklist-loading" id="v2-loading">
              <div class="v2-spinner"></div>
              <span>${isPilot ? '고객님의 사진을 확인하고 있습니다...' : escapeHtml(v2.checking)}</span>
            </div>
            <ul class="v2-checklist-items" id="v2-checklist-items"></ul>
            <div class="v2-checklist-summary" id="v2-summary"></div>
            <div class="v2-action-buttons" id="v2-check-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-btn-change">${escapeHtml(v2.btnOtherPhoto)}</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-btn-proceed">${escapeHtml(v2.btnProceed)}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2.5: 규격 안착 시어터 (2026-07-07 작가님 연출 비전 — 전문가 대행을 보여준다) -->
      <div class="v2-make-layout" id="v2-phase-fit" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <div id="v2-fit-stage" style="position:relative;overflow:hidden;width:240px;height:320px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(15,15,40,.28);">
              <div id="v2-fit-world" style="position:absolute;left:0;top:0;transform-origin:0 0;">
                <img id="v2-fit-img" src="" alt="규격 안착" style="display:block;max-width:none;max-height:none;">
                <div id="v2-fit-frame" style="display:none;position:absolute;border:3px solid #00B894;border-radius:2px;box-sizing:border-box;pointer-events:none;transition:opacity .5s, top .9s cubic-bezier(.22,.9,.24,1), left .9s cubic-bezier(.22,.9,.24,1), width .9s cubic-bezier(.22,.9,.24,1), height .9s cubic-bezier(.22,.9,.24,1);"></div>
                <div id="v2-fit-line-hair" style="border-top:2px dashed rgba(255,255,255,.6);"></div>
                <div id="v2-fit-line-crown" style="border-top:3px solid #FDCB6E;"></div>
                <div id="v2-fit-line-eye" style="border-top:3px solid #74b9ff;"></div>
                <div id="v2-fit-line-chin" style="border-top:3px solid rgba(255,255,255,.9);"></div>
              </div>
              <div id="v2-fit-dim-top" style="position:absolute;left:0;right:0;top:0;background:rgba(8,10,16,.36);height:0;transition:height .5s;pointer-events:none;"></div>
              <div id="v2-fit-dim-bot" style="position:absolute;left:0;right:0;bottom:0;background:rgba(8,10,16,.36);height:0;transition:height .5s;pointer-events:none;"></div>
            </div>
            <div id="v2-fit-status" style="text-align:center;margin-top:10px;font-size:13px;color:#777;min-height:18px;"></div>
          </div>
          <div class="v2-checklist-side">
            ${isPilot ? '' : '<div class="v2-checklist-title">규격 안착</div>'}
            <div id="v2-fit-badges" style="display:none;gap:8px;flex-wrap:wrap;margin:8px 0;"></div>
            <div id="v2-fit-note" style="display:none;font-size:12.5px;color:#555;background:#f6f6fb;border-radius:8px;padding:8px 10px;margin:6px 0;"></div>
            <div class="v2-checklist-summary" id="v2-fit-summary"></div>
            <div class="v2-action-buttons" id="v2-fit-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-fit-change">다른 사진으로</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-fit-make">${isPilot ? '무료로 만들기' : '이대로 만들기'}</button>
            </div>
            ${isPilot ? `<div class="ip-fit-caption" id="ip-fit-caption" style="display:none;">배경 제거 + ${escapeHtml(typeName)} 규격 크롭 · 오늘 <span id="ip-fit-remaining">3</span>회 무료 · 로그인 불필요</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Phase 2: 결제 선택 (피사체 칩 + 의상 인라인 + 결제 카드) -->
      <div class="v2-make-layout" id="v2-phase-pay" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-preview-img" src="" alt="${escapeHtml(v2.altPreview)}">
            <button class="v2-change-photo" id="v2-change-photo">${escapeHtml(v2.btnOtherPhoto)}</button>
          </div>
          <div class="v2-pay-options">
            <!-- 피사체 선택 -->
            <div class="v2-subject-section" id="v2-subject-section">
              <div class="v2-attire-sub-label">찍힌 분</div>
              <div class="v2-attire-chips" id="v2-age-chips" data-field="age">
                <div class="v2-attire-chip selected" data-val="adult">성인</div>
                <div class="v2-attire-chip" data-val="teen">청소년</div>
                <div class="v2-attire-chip" data-val="baby">영유아</div>
              </div>
              <div class="v2-attire-chips" id="v2-gender-chips" data-field="gender">
                <div class="v2-attire-chip" data-val="m">남성</div>
                <div class="v2-attire-chip" data-val="f">여성</div>
              </div>
            </div>
            <!-- 의상 선택 (T1만) -->
            <div class="v2-attire-inline" id="v2-attire-inline" style="display:none;">
              <div class="v2-attire-sub-label">의상 선택</div>
              <div class="v2-attire-cards" id="v2-attire-cards">
                <div class="v2-attire-card selected" data-attire="asis">
                  <div class="v2-attire-card-icon">👔</div>
                  <div class="v2-attire-card-label">그대로</div>
                </div>
                <div class="v2-attire-card" data-attire="suit">
                  <div class="v2-attire-card-icon">🤵</div>
                  <div class="v2-attire-card-label">정장</div>
                </div>
                <div class="v2-attire-card" data-attire="blouse">
                  <div class="v2-attire-card-icon">👚</div>
                  <div class="v2-attire-card-label">블라우스</div>
                </div>
                <div class="v2-attire-card" data-attire="casual">
                  <div class="v2-attire-card-icon">🧥</div>
                  <div class="v2-attire-card-label">캐주얼</div>
                </div>
              </div>
              <div id="v2-attire-sub-options"></div>
              <div class="v2-attire-summary" id="v2-attire-summary">현재 의상 유지, 보정만 적용</div>
            </div>
            <!-- 결제 카드 -->
            <button class="v2-pay-btn v2-pay-instant" id="v2-pay-instant">
              <div class="v2-pay-title">${escapeHtml(fmtV2(v2.payTitle, { type: typeName }))}</div>
              <div class="v2-pay-price">${v2.payPrice}</div>
              <div class="v2-pay-desc">${escapeHtml(v2.payDesc)}</div>
            </button>
            ${lang === 'ko' ? `<div class="v2-pay-divider"><span>${escapeHtml(v2.orDivider)}</span></div>
            <button class="v2-pay-btn v2-pay-credit" id="v2-pay-credit">
              <div class="v2-pay-title">${escapeHtml(v2.creditTitle)}</div>
              <div class="v2-pay-price">10c <span style="font-size:13px;color:#888;font-weight:400;">(₩1,500)</span></div>
              <div class="v2-pay-desc">${escapeHtml(v2.creditDesc)}</div>
              <div class="v2-pay-desc" style="font-size:12px;margin-top:4px;">${v2.creditTopup}</div>
            </button>` : ''}
            <div class="v2-toss-widget" id="v2-toss-widget" style="display:none;">
              <div id="v2-pm"></div>
              <div id="v2-agree"></div>
              <button class="v2-action-btn v2-btn-retouch" id="v2-pay-confirm" style="width:100%;margin-top:12px;"></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 3: 생성 중 -->
      <div class="v2-make-layout" id="v2-phase-generating" style="display:none;">
        <div class="v2-generating">
          <div class="v2-spinner"></div>
          <div class="v2-gen-text" id="v2-gen-text">${escapeHtml(fmtV2(v2.genText, { type: typeName }))}</div>
          <div class="v2-gen-sub" id="v2-gen-sub">${escapeHtml(v2.genSub)}</div>
        </div>
      </div>

      <!-- Phase 4: 결과 + 다운로드 -->
      <div class="v2-make-layout" id="v2-phase-result" style="display:none;">
        <div class="v2-result-grid">
          <div class="v2-result-before">
            <div class="v2-result-label">${escapeHtml(v2.labelBefore)}</div>
            <img id="v2-result-before-img" src="" alt="${escapeHtml(v2.labelBefore)}">
          </div>
          <div class="v2-result-arrow">→</div>
          <div class="v2-result-after">
            <div class="v2-result-label">${escapeHtml(v2.labelAfter)}</div>
            <img id="v2-result-after-img" src="" alt="${escapeHtml(v2.labelAfter)}">
          </div>
        </div>
        <ul class="v2-checklist-items" id="v2-result-checklist" style="margin:16px auto 0;max-width:440px;text-align:left;"></ul>
        <div class="v2-result-actions">
          <button class="v2-download-btn" id="v2-download">${escapeHtml(v2.btnDownload)}</button>
          <button class="v2-action-btn v2-btn-retry" id="v2-btn-retry2">${escapeHtml(v2.btnRetry)}</button>
        </div>
      </div>

      ${isPilot ? `<!-- S3 땡큐 — 동일 프레임(2컬럼) 유지: 사진 자리 고정, 패널만 진화 (2026-07-10 작가님 연속성 지시) -->
      <div class="v2-make-layout" id="v2-phase-free" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <div class="ip-free-photo"><img id="ip-free-img" src="" alt="완성된 ${escapeHtml(typeName)} 규격 사진"></div>
            <div class="ip-free-spec">${escapeHtml(locField(specData, 'size', lang))}${specData.dpi ? ` · ${escapeHtml(String(specData.dpi))}dpi` : ''}${locField(specData, 'background', lang) ? ` · ${escapeHtml(locField(specData, 'background', lang))}` : ''}</div>
          </div>
          <div class="ip-free-side">
            <span class="ip-free-kicker">DONE · ${escapeHtml(slug.toUpperCase())}</span>
            <h3 class="ip-free-h">완성! ${escapeHtml(typeName)} 규격에 맞춰 만들었어요</h3>
            <div class="ip-free-btnrow">
              <button class="ip-btn ip-btn-primary" id="ip-free-download">다운로드</button>
              <button class="ip-btn ip-btn-ghost" id="ip-free-retry">다른 사진</button>
            </div>
            <div class="ip-free-cap">오늘 무료 <span id="ip-free-remaining">-</span>회 남음</div>
            ${t1RetouchOn ? `<div class="ip-card ip-card-t1">
              <div class="ip-card-head"><b>AI 보정</b><span class="ip-price">₩2,000</span></div>
              <ul class="ip-card-list">
                <li>AI 리터칭 — 내 얼굴 그대로, 더 단정하게</li>
                <li>AI 규격 검수</li>
                <li>${escapeHtml(typeName)} 규격 보정 파일</li>
              </ul>
              <button class="ip-btn ip-btn-mid" id="ip-t1-buy">AI 보정으로 업그레이드</button>
            </div>` : `<div class="ip-card ip-card-t1 ip-card-soon">
              <div class="ip-card-head"><b>AI 보정</b><span class="ip-price">₩2,000</span></div>
              <ul class="ip-card-list">
                <li>AI 리터칭 — 내 얼굴 그대로, 더 단정하게</li>
                <li>AI 규격 검수</li>
              </ul>
              <button class="ip-btn ip-btn-mid" id="ip-t1-buy" disabled>곧 열려요 — 준비 중</button>
            </div>`}
            <a class="ip-slot" id="ip-slot-credit" href="/credits.html">
              <span class="ip-slot-ic">🎁</span>
              <span class="ip-slot-txt"><b>간편로그인하면 10c 크레딧</b><span>AI 보정 1회가 ₩1,500이 돼요</span></span>
              <span class="ip-slot-tag">EVENT</span>
            </a>
          </div>
        </div>
      </div>` : ''}

    </div>

    ${sameSize.length > 0 ? `<!-- 4. 같은 사진으로 제출 가능한 서류 — 롤다운 (상세규정·반려사유는 수치 박스 탭으로 이동) -->
    <div class="v2-same-section">
      <details class="v2-same-acc">
        <summary><h2>${escapeHtml(v2.sameTitle)}</h2><span class="v2-same-count">${sameSize.length}</span></summary>
        <div class="v2-same-body">
          <div class="v2-same-sub">${escapeHtml(fmtV2(v2.sameSub, { name: fullName, size: locField(specData, 'size', lang) }))}</div>
          <div class="v2-same-grid">${sameHtml}</div>
        </div>
      </details>
    </div>` : ''}

    <!-- 6. FAQ -->
    <div class="v2-faq-section">
      <h2>${escapeHtml(v2.faqTitle)}</h2>
      ${faqHtml}
    </div>

    <!-- 7. 크로스셀 카드 -->
    <div class="v2-same-section">
      <h2>${escapeHtml(v2.crossTitle)}</h2>
      <div class="v2-same-sub">${escapeHtml(v2.crossSub)}</div>
      <div class="v2-same-grid">
        <a href="/headshot" class="v2-same-card">
          <span class="v2-same-icon">💼</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossHeadshot)}</div><div class="v2-same-size">${escapeHtml(v2.crossHeadshotSub)}</div></div>
        </a>
        ${isPilot ? '' : `<a href="/" class="v2-same-card">
          <span class="v2-same-icon">📷</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossProfile)}</div><div class="v2-same-size">${escapeHtml(v2.crossProfileSub)}</div></div>
        </a>`}
        <a href="${prefix}/specs" class="v2-same-card">
          <span class="v2-same-icon">📐</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossSpecs)}</div><div class="v2-same-size">${escapeHtml(v2.crossSpecsSub)}</div></div>
        </a>
      </div>
    </div>

  </div>
`;

  // 클라이언트 설정 주입 — JSON.stringify 경유(이스케이프 사고 방지). 시크릿 값 없음(문구·slug·시장뿐).
  // frameRatio: 규격 세로/가로 비 — fit 스테이지를 진입 시점에 규격비로 1회 고정 (연출 중 크기 변경 금지, 2026-07-09 작가님)
  const fitCropParams = getSpecCropParams(slug);
  const v2ClientCfg = {
    slug,
    format: typeSlug,
    market,
    frameRatio: fitCropParams ? +(fitCropParams.frameH / fitCropParams.frameW).toFixed(4) : null,
    downloadName: `${countryName}_${typeName}_${locField(specData, 'size', lang).replace(/\s/g, '')}_MONKOS.jpg`,
    t: v2.js,
    pilot: isPilot,
    t1: t1RetouchOn,
    freeCap: process.env.FREE_QUOTA_BYPASS === '1' ? 999999 : 3,
  };

  // 위저드 클라 JS → public/js/specs-funnel.js (2026-07-12 퍼널 분리 — CFG만 인라인 주입)
  const pageScript = `window.__SPECS_CFG__ = ${JSON.stringify(v2ClientCfg)};`;

  return {
    title,
    description,
    seoMeta: seoMeta + specsCssLink('specs-funnel') + (isPilot ? specsCssLink('specs-pilot') : ''),
    htmlLang: lang,
    pageStyle: '',
    bodyContent: bodyContent + specsJsTag('specs-funnel'),
    pageScript,
  };
}

// ─── SPECS DETAIL (v1 — 기존 전체 사용) ─────────────────────

export function specsDetailFragment(slug, forceLang = null) {
  if (isV2Spec(slug, forceLang || 'ko')) return specsDetailV2Fragment(slug, forceLang);

  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  const specData = SPECS_DATA[slug];
  if (!specData) return null;

  const { typeSlug, countrySlug } = parseSlug(slug);
  const newPath = `${typeSlug}/${countrySlug}`;

  const typeName = lang === 'ja' ? (specData.typeJa || specData.type) : (lang === 'en' ? specData.typeEn : specData.type);
  const countryName = lang === 'en'
    ? (specData.countryEn || specData.country)
    : lang === 'ja'
      ? (specData.countryJa || specData.country)
      : specData.country;
  const title = (specData.seoTitle && specData.seoTitle[lang]) || `2026 ${countryName} ${typeName} ${i.detailSuffix}`;
  const description = (specData.seoDescription && specData.seoDescription[lang]) || (specData.details && (specData.details[lang] || specData.details.ko || specData.details.en)) || '';
  const heroDescription = (specData.heroDesc && specData.heroDesc[lang]) || description;

  const canonicalUrl = lang === 'ko' ? `https://monkos.ai/specs/${newPath}` : `https://monkos.ai/${lang}/specs/${newPath}`;
  const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/${newPath}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/${newPath}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/${newPath}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/specs/${newPath}">`,
  ].join('\n');

  const faqs = (specData.faqs && (specData.faqs[lang] || specData.faqs.ko)) || [];
  const v1OgGuideKey = GUIDE_IMAGES.has(`${slug}_${lang}`) ? `${slug}_${lang}`
    : GUIDE_IMAGES.has(slug) ? slug : (parseSizeMm(specData.size) || 'kr-passport');
  const v1OgImage = `https://monkos.ai/images/guides/${v1OgGuideKey}.webp`;

  const specsLabel = { ko: '규격', en: 'Specs', ja: '規格' }[lang] || 'Specs';
  const specsJsonLdArr = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "MONKOS", "item": "https://monkos.ai" },
        { "@type": "ListItem", "position": 2, "name": specsLabel, "item": `https://monkos.ai${lang === 'ko' ? '' : '/' + lang}/specs` },
        { "@type": "ListItem", "position": 3, "name": `${countryName} ${typeName}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "image": v1OgImage,
      "inLanguage": lang,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      // 브랜드 엔티티=MONKOS + 법적 실체=legalName — V2 경로(§Article)와 동일 정본 (2026-07-13)
      "publisher": { "@type": "Organization", "name": "MONKOS", "legalName": "몽크 스튜디오 (Monk Studio)", "url": "https://monkos.ai" },
      "datePublished": "2026-03-26",
      "dateModified": SPECS_DATA_MODIFIED,
      "about": {
        "@type": "Thing",
        "name": `${countryName} ${typeName}`,
        "additionalProperty": [
          { "@type": "PropertyValue", "name": "photo size", "value": locField(specData, 'size', lang) },
          { "@type": "PropertyValue", "name": "background", "value": locField(specData, 'background', lang) },
          { "@type": "PropertyValue", "name": "head height", "value": locField(specData, 'headHeight', lang) },
        ].filter(p => p.value && String(p.value).trim()),
      },
    },
    ...(faqs.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    }] : []),
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": lang === 'ja' ? `${typeName}の規格に合わせて写真を準備する方法`
             : lang === 'en' ? `How to prepare a ${typeName} photo`
             : `${typeName} 규격에 맞게 사진 준비하는 법`,
      "step": [
        { "@type": "HowToStep", "position": 1, "name": lang === 'ja' ? '規格確認' : lang === 'en' ? 'Check specs' : '규격 확인', "text": `${locField(specData, 'size', lang)} / ${locField(specData, 'background', lang)}` },
        { "@type": "HowToStep", "position": 2, "name": lang === 'ja' ? 'セルフィー撮影' : lang === 'en' ? 'Take a selfie' : '셀카 촬영', "text": lang === 'ja' ? '明るい場所で白い背景の前で撮影' : lang === 'en' ? 'Take a photo in a bright area with a white background' : '밝은 곳에서 흰 배경 앞에 촬영' },
        { "@type": "HowToStep", "position": 3, "name": lang === 'ja' ? 'AI補正またはクロップ' : lang === 'en' ? 'AI retouch or crop' : 'AI 보정 또는 크롭', "text": lang === 'ja' ? 'MONKOS AIまたは無料クロップアプリで規格に合わせる' : lang === 'en' ? 'Use MONKOS AI or the free crop app to fit the specs' : 'MONKOS AI 또는 무료 크롭앱으로 규격 맞춤' },
        { "@type": "HowToStep", "position": 4, "name": lang === 'ja' ? 'ダウンロード' : lang === 'en' ? 'Download' : '다운로드', "text": lang === 'ja' ? '完成写真をダウンロード' : lang === 'en' ? 'Download the finished photo' : '완성 사진 다운로드' },
      ],
    },
  ];
  const specsJsonLd = JSON.stringify(specsJsonLdArr);

  const seoMeta = `<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${v1OgImage}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${v1OgImage}">
<meta name="theme-color" content="#05080E">
<link rel="canonical" href="${canonicalUrl}">
${hreflangTags}
<script type="application/ld+json">${specsJsonLd}</script>`;

  const h = i.tableHeaders;
  const tableRows = [
    ['size', h.size, locField(specData, 'size', lang)],
    ['pixels', h.pixels, locField(specData, 'pixels', lang)],
    ['dpi', h.dpi, String(specData.dpi)],
    ['background', h.background, locField(specData, 'background', lang)],
    ['headHeight', h.headHeight, locField(specData, 'headHeight', lang)],
    ['validity', h.validity, locField(specData, 'validity', lang)],
    ['fileSpec', h.fileSpec, locField(specData, 'fileSpec', lang)],
  ].map(([key, label, val]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}</td></tr>`).join('\n      ');

  const detailText = (specData.details && (specData.details[lang] || specData.details.ko)) || '';
  const detailLines = detailText.split(/[.。]\s*/).filter(d => d.trim().length > 0);
  const detailGridHtml = detailLines.map((line) =>
    `<div class="specs-detail-item"><span>${escapeHtml(line.trim())}</span></div>`
  ).join('\n        ');

  const commonRules = COMMON_RULES[lang] || COMMON_RULES.ko;
  const commonRulesHtml = commonRules.map((rule, idx) =>
    `<li class="specs-common-rule">${idx + 1}. ${escapeHtml(rule)}</li>`
  ).join('\n        ');

  const rejections = (specData.rejectionReasons && (specData.rejectionReasons[lang] || specData.rejectionReasons.ko)) || [];
  const rejectionHtml = rejections.map((r) =>
    `<li class="specs-rejection-item">
          <span class="specs-rj-x">&times;</span>
          <span>${escapeHtml(r)}</span>
        </li>`
  ).join('\n        ');

  const faqHtml = faqs.map((f, idx) =>
    `<div class="specs-faq-item${idx === 0 ? ' open' : ''}">
          <div class="specs-faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.q)}</div>
          <div class="specs-faq-a">${escapeHtml(f.a)}</div>
        </div>`
  ).join('\n        ');

  const sameCountry = Object.values(SPECS_DATA)
    .filter(s => s.country === specData.country && s.slug !== slug)
    .sort((a, b) => a.priority - b.priority);
  const sameCountryLinks = sameCountry.map(s => {
    const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
    const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
    return `<a href="${prefix}/specs/${ts}/${cs}">${escapeHtml(name)}</a>`;
  }).join('\n        ');

  const relatedLinksHtml = i.relatedLinks.map(l =>
    `<a href="${l.href}">${escapeHtml(l.label)}</a>`
  ).join('\n        ');

  const backLabel = lang === 'ja' ? '← 全規格一覧' : lang === 'en' ? '← All Specifications' : '← 전체 규격 목록';

  const oxGoodLabel = lang === 'ja' ? '適合写真' : lang === 'en' ? 'Acceptable Photo' : '적합한 사진';
  const oxBadLabel = lang === 'ja' ? '却下される写真' : lang === 'en' ? 'Rejected Photo' : '반려되는 사진';
  const oxGoodCaption = lang === 'ja' ? '正面・無表情・白背景' : lang === 'en' ? 'Front-facing · Neutral · White BG' : '정면 · 무표정 · 흰배경';
  const oxBadCaption = lang === 'ja' ? '傾き・影・髪' : lang === 'en' ? 'Tilted · Shadow · Hair' : '기울어짐 · 그림자 · 머리카락';

  const aiSummary = (specData.aiSummary && specData.aiSummary[lang])
    ? escapeHtml(specData.aiSummary[lang])
    : lang === 'ja'
    ? `${escapeHtml(countryName)}の${escapeHtml(typeName)}は${escapeHtml(locField(specData, 'size', lang))}、${escapeHtml(locField(specData, 'background', lang))}背景、${escapeHtml(locField(specData, 'validity', lang))}以内の撮影が必要です。`
    : lang === 'en'
    ? `${escapeHtml(countryName)} ${escapeHtml(typeName)} requires ${escapeHtml(locField(specData, 'size', lang))}, ${escapeHtml(locField(specData, 'background', lang)).toLowerCase()} background, taken within ${escapeHtml(locField(specData, 'validity', lang)).toLowerCase()}.`
    : `${escapeHtml(countryName)} ${escapeHtml(typeName)}은 ${escapeHtml(locField(specData, 'size', lang))}, ${escapeHtml(locField(specData, 'background', lang))} 배경이며 ${escapeHtml(locField(specData, 'validity', lang))} 촬영이 필요합니다.`;

  const detailSections = (specData.detailSections && specData.detailSections[lang]) || [];
  const detailSectionsHtml = detailSections.length ? `
        <div class="specs-detail-sections">
          ${detailSections.map(sec => `<div class="specs-detail-cat">
            <h3>${escapeHtml(sec.title)}</h3>
            <ul>${sec.items.map(item => `
              <li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>`).join('\n          ')}
        </div>` : '';

  const onlineGuide = (specData.onlineGuide && specData.onlineGuide[lang]) || null;
  const onlineGuideHtml = onlineGuide ? `
        <div class="specs-online-guide">
          ${onlineGuide.sections.map(sec => `<div class="specs-online-section">
            <h3>${escapeHtml(sec.subtitle)}</h3>
            <ul>${sec.items.map(item => `
              <li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>`).join('\n          ')}
          ${onlineGuide.source ? `<a href="${escapeHtml(onlineGuide.source.url)}" target="_blank" rel="noopener noreferrer" class="specs-online-source">
            <span>${escapeHtml(onlineGuide.source.label)}</span>
            <span class="specs-external-icon">↗</span>
          </a>` : ''}
        </div>` : '';

  const bodyContent = `
  <div class="specs-hero-wrap">
  <div class="band-inner">
  <a href="${prefix}/specs" class="specs-back">${escapeHtml(backLabel)}</a>

  <!-- Hero 풀와이드 -->
  <section class="specs-hero">
    <div class="specs-hero-text">
      <h1>${countryFlag(countrySlug, 40)} ${(specData.heroTitle && specData.heroTitle[lang]) ? escapeHtml(specData.heroTitle[lang]) : `${escapeHtml(countryName)} ${escapeHtml(typeName)} ${lang === 'ja' ? '規定案内' : lang === 'en' ? 'Requirements Guide' : '규정안내'}`}</h1>
      <p class="specs-hero-desc">${escapeHtml(heroDescription)}</p>
    </div>
    <div class="specs-diagram">
      <div class="specs-photo-frame">
        ${(() => {
          // 브랜드 도해 {slug}_{lang} 우선 (2026-07-11) — v2 히어로와 동일 우선순위
          const v1Key = GUIDE_IMAGES.has(`${slug}_${lang}`) ? `${slug}_${lang}` : slug;
          const countryImg = `/images/guides/${v1Key}.webp`;
          const sizeMm = parseSizeMm(specData.size);
          const fallbackImg = sizeMm ? `/images/guides/${sizeMm}.webp` : '';
          const altText = `${countryName} ${typeName}`;
          return `<img src="${countryImg}"
             alt="${escapeHtml(altText)}"
             width="200" loading="lazy"
             onerror="this.src='${fallbackImg}';this.onerror=function(){this.style.display='none';this.nextElementSibling.style.display='block'}">
        <svg viewBox="0 0 120 160" width="100" height="133" fill="currentColor" style="display:none">
          <ellipse cx="60" cy="45" rx="30" ry="38"/>
          <ellipse cx="60" cy="140" rx="50" ry="45"/>
        </svg>`;
        })()}
        <div class="specs-head-guide">${escapeHtml(locField(specData, 'headHeight', lang))}</div>
        <div class="specs-guide-w">${escapeHtml(locField(specData, 'size', lang).split('×')[0].trim())}</div>
      </div>
      <div class="specs-guide-h">${escapeHtml((locField(specData, 'size', lang).split('×')[1] || '4.5cm').trim())}</div>
    </div>
  </section>
  </div>
  </div>

  ${sameCountry.length > 0 ? `<!-- BAND: 다른 용도 규격 -->
  <div class="specs-band specs-band-dark" style="padding:32px 20px;">
    <div class="band-inner">
      <div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:12px;">${escapeHtml(i.sameCountryLabel)}</div>
      <div class="specs-hero-tags">${sameCountry.map(s => {
        const name = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
        const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
        return '<a href="' + prefix + '/specs/' + ts + '/' + cs + '" style="text-decoration:none;"><span>' + escapeHtml(name) + '</span></a>';
      }).join('')}</div>
    </div>
  </div>` : ''}

  <!-- BAND: 규격 맞춤 도구 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${lang === 'ja' ? `${escapeHtml(typeName)} 規定写真を作る` : lang === 'en' ? `Make ${escapeHtml(typeName)} Photo` : `${escapeHtml(typeName)} 규정 사진 만들기`}</h2>
        <div class="specs-crop-tool" id="specs-crop-embed">
          <div class="specs-crop-panel specs-crop-upload">
            <div style="font-size:32px;color:#aaa;margin-bottom:12px;">&#8615;</div>
            <div style="font-size:15px;color:#555;font-weight:600;margin-bottom:8px;">${lang === 'ja' ? '写真をドラッグ＆ドロップ' : lang === 'en' ? 'Drag and drop photo' : '사진을 끌어다 놓으세요'}</div>
            <div style="margin:12px 0;padding:10px 24px;border:1.5px solid #6c4fff;border-radius:8px;color:#6c4fff;font-size:14px;font-weight:600;">${lang === 'ja' ? '写真を選択' : lang === 'en' ? 'Choose photo' : '사진 선택'}</div>
            <div style="font-size:12px;color:#aaa;margin-top:8px;">JPG, PNG, HEIC / max 10MB</div>
          </div>
          <div class="specs-crop-panel specs-crop-preview">
            <img src="/images/guides/sample-before-kr.png" alt="Before">
            <div class="specs-crop-label">BEFORE</div>
          </div>
          <div class="specs-crop-panel specs-crop-preview">
            <img src="/images/guides/sample-after-kr.webp" alt="After">
            <div class="specs-crop-label specs-crop-label-after">AFTER</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- BAND: 규격 정보 -->
  <div class="specs-band specs-band-white">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${lang === 'ja' ? '規格情報' : lang === 'en' ? 'Specifications' : '규격 정보'}</h2>
        <div class="specs-ai-summary">${aiSummary}</div>
        <table class="specs-table">
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        ${detailSectionsHtml}
      </div>
    </div>
  </div>

  ${detailLines.length ? `<!-- BAND: 촬영 주의사항 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${lang === 'ja' ? '撮影時の注意事項' : lang === 'en' ? 'Photo Requirements' : '촬영 주의사항'}</h2>
        <div class="specs-details-grid">
          ${detailGridHtml}
        </div>
      </div>
    </div>
  </div>` : ''}

  ${specData.officialSource ? `<!-- BAND: 공식 안내 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <a href="${escapeHtml(specData.officialSource.url)}" target="_blank" rel="noopener noreferrer" class="specs-official-link">
        <span>${escapeHtml((specData.officialSource.label && (specData.officialSource.label[lang] || specData.officialSource.label.ko)) || specData.officialSource.url)}</span>
        <span class="specs-external-icon">↗</span>
      </a>
    </div>
  </div>` : ''}

  ${rejections.length ? `<!-- BAND: 반려 사유 -->
  <div class="specs-band specs-band-white">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${escapeHtml(i.rejectionTitle)}</h2>
        <ul class="specs-rejection-list">
          ${rejectionHtml}
        </ul>
      </div>
    </div>
  </div>` : ''}

  ${onlineGuideHtml ? `<!-- BAND: 온라인 신청 안내 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${escapeHtml(onlineGuide.title)}</h2>
        ${onlineGuideHtml}
      </div>
    </div>
  </div>` : ''}

  ${faqs.length ? `<!-- BAND: 자주 묻는 질문 -->
  <div class="specs-band specs-band-gray">
    <div class="band-inner">
      <div class="specs-section">
        <h2>${escapeHtml(i.faqTitle)}</h2>
        <div class="specs-faq">
          ${faqHtml}
        </div>
      </div>
    </div>
  </div>` : ''}

  <!-- BAND: CTA 배너 (다크 배경, 맨 하단) -->
  <div class="specs-band specs-band-dark">
    <div class="band-inner">
      <div class="specs-cta-banner">
        <div class="specs-cta-badge">${escapeHtml(i.ctaBadge)}</div>
        <h2>${escapeHtml(i.ctaHeadline1)}<br><span>${escapeHtml(i.ctaHeadline2)}</span></h2>
        <p class="specs-cta-sub">${escapeHtml(i.ctaSub).replace(/\n/g, '<br>')}</p>
        <a href="${i.ctaHref}" class="specs-cta-btn" data-cta="specs-detail" rel="noopener">${escapeHtml(i.ctaBtn)}</a>
        <p class="specs-cta-price">${i.ctaPrice.replace(/(무료 체험|無料体験|Free)/g, '<strong>$1</strong>')}</p>
      </div>
    </div>
  </div>

`;

  return {
    title,
    description,
    seoMeta: seoMeta + specsCssLink('specs-base'),
    htmlLang: lang,
    pageStyle: '',
    bodyContent,
    pageScript: null,
  };
}

// ─── ROUTE HANDLERS ─────────────────────────────────────────────

export function renderSpecsList(req, res, forceLang = null) {
  try {
    const parts = specsListFragment(forceLang);
    parts.paymentRegion = req.paymentRegion;
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 허브 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

export function renderSpecsDetail(req, res, forceLang = null) {
  try {
    const lang = forceLang || 'ko';
    const prefix = lang === 'ko' ? '' : `/${lang}`;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.replace(/^\/(?:ja|en)\//, '/').split('/').filter(Boolean);

    const specsIdx = pathParts.indexOf('specs');
    const remaining = pathParts.slice(specsIdx + 1);

    let slug = null;

    if (remaining.length >= 2) {
      const routeKey = `${remaining[0]}/${remaining[1]}`;
      slug = ROUTE_MAP[routeKey];
      if (!slug) {
        const reversed = `${remaining[1]}/${remaining[0]}`;
        slug = ROUTE_MAP[reversed];
        if (slug) {
          const canonical = REDIRECT_MAP[slug];
          if (canonical) {
            res.writeHead(301, { Location: `${prefix}/specs/${canonical}` });
            return res.end();
          }
        }
      }
    }

    if (!slug && remaining.length === 1) {
      const oldSlug = remaining[0];
      if (SPECS_DATA[oldSlug]) {
        if (!V2_DIRECT_SLUGS.has(oldSlug)) {
          const redirect = REDIRECT_MAP[oldSlug];
          if (redirect) {
            const newUrl = `${prefix}/specs/${redirect}`;
            res.writeHead(301, { Location: newUrl });
            return res.end();
          }
        }
      }
      slug = oldSlug;
    }

    if (!slug || !SPECS_DATA[slug]) {
      // 6/19 슬러그 체계 변경(fe0a38f3) 복구: 옛 URL(국가명/구type) → 새 정본 301
      let oldType = null, oldCountry = null;
      if (remaining.length === 1) {
        ({ typeSlug: oldType, countrySlug: oldCountry } = parseSlug(remaining[0]));
      } else if (remaining.length >= 2) {
        oldType = remaining[0];
        oldCountry = remaining[1];
      }
      if (oldType && oldCountry) {
        const iso = canonicalCountry(oldCountry);
        const newType = TYPE_ALIASES[oldType] || oldType;
        // Location은 REDIRECT_MAP 정본 라우트 기준 — `${newType}/${iso}` 재조립은 복합 type에서 자기 자신을 가리켜 301 루프
        const canonical = REDIRECT_MAP[`${iso}-${newType}`];
        const target = canonical ? `${prefix}/specs/${canonical}` : null;
        if (target && target !== url.pathname) {
          res.writeHead(301, { Location: target });
          return res.end();
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(specs404Html(prefix, lang));
    }

    const parts = specsDetailFragment(slug, forceLang);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(specs404Html(prefix, lang));
    }
    parts.paymentRegion = req.paymentRegion;
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] Specs 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
