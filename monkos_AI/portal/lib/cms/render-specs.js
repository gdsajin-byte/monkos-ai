/**
 * CMS SSR — 증명사진 규격 허브 + 상세
 * IDPASS 카드 UI + 다크 테마 + 3티어 전환 퍼널
 */
import { createRequire } from 'module';
import { readdirSync } from 'fs';
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
      guideChips: ['정면 얼굴', '가슴 위 구도', '1인', '선명한 화질'],
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
      guideChips: ['正面の顔', '胸から上の構図', '1人', '鮮明な画質'],
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
      guideChips: ['Front-facing', 'Chest-up framing', 'One person', 'Sharp focus'],
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

const SPECS_PAGE_STYLE = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
body { background: #ffffff !important; color: #1a1a1a !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important; }
.container { max-width: 1000px; }
a { color: #6c4fff; }
a:hover { color: #5a3de6; }

/* === Hub Hero === */
.specs-hub-hero { text-align: center; padding: 48px 20px 32px; }
.specs-hub-hero .hero-global {
  font-size: 12px; letter-spacing: 3px; color: #6c4fff; font-weight: 600;
  font-family: monospace; margin-bottom: 14px;
}
.specs-hub-hero h1 { font-size: 32px; font-weight: 800; color: #1a1a1a; margin-bottom: 12px; }
.specs-hub-hero .hero-sub { font-size: 15px; color: #888; line-height: 1.7; max-width: 520px; margin: 0 auto 28px; }
.specs-hub-stats { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
.specs-hub-stat { text-align: center; }
.specs-hub-stat .stat-num { font-size: 32px; font-weight: 800; color: #6c4fff; font-family: monospace; }
.specs-hub-stat .stat-label { font-size: 12px; color: #888; margin-top: 2px; }

/* === Purpose Cards (2×2) === */
.purpose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.purpose-card {
  position: relative; height: 100px; border-radius: 12px; overflow: hidden;
  cursor: pointer; border: 1px solid rgba(0,0,0,0.08);
  transition: border-color 0.2s, transform 0.15s;
}
.purpose-card:hover { border-color: rgba(108,79,255,0.3); transform: translateY(-2px); }
.purpose-card.active { border-color: #6c4fff; box-shadow: 0 0 20px rgba(108,79,255,0.15); }
.purpose-card img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.purpose-card .overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.15), rgba(0,0,0,0.05));
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.purpose-card .p-name { font-size: 18px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 6px rgba(0,0,0,0.7); }
.purpose-card .p-sub { font-size: 10px; font-weight: 700; color: #ffffff; letter-spacing: 2px; font-family: monospace; text-shadow: 0 1px 4px rgba(0,0,0,0.8); opacity: 0.85; }

/* === Continent Cards (2×3) === */
.section-title { font-size: 13px; color: #888; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
.section-title .back-btn {
  color: #6c4fff; cursor: pointer; font-size: 13px; border: none; background: none;
  font-family: inherit; padding: 0;
}
.section-title .back-btn:hover { text-decoration: underline; }
.continent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.continent-card {
  position: relative; height: 120px; border-radius: 12px; overflow: hidden;
  cursor: pointer; border: 1px solid rgba(0,0,0,0.08);
  transition: border-color 0.2s, transform 0.15s;
}
.continent-card:hover { border-color: rgba(0,0,0,0.15); transform: translateY(-2px); }
.continent-card img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.continent-card .overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: flex-start; justify-content: flex-end; padding: 12px 14px; gap: 2px;
}
.continent-card .c-name { font-size: 20px; font-weight: 800; color: #ffffff; text-shadow: 0 1px 6px rgba(0,0,0,0.7); line-height: 1.1; }
.continent-card .c-name-en { display: none; }
.continent-card .c-count { font-size: 11px; color: rgba(255,255,255,0.75); text-shadow: 0 1px 4px rgba(0,0,0,0.7); }

/* === Country Cards === */
.country-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
.country-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 16px; cursor: pointer; text-decoration: none; display: block; color: inherit;
  transition: border-color 0.2s, transform 0.15s;
}
.country-card:hover { border-color: rgba(108,79,255,0.3); transform: translateY(-1px); color: inherit; }
.country-card .cc-flag { font-size: 24px; margin-bottom: 6px; }
.country-card .cc-name { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
.country-card .cc-meta { font-size: 12px; color: #888; }

/* === Search === */
.specs-search-wrap { position: relative; margin-bottom: 20px; }
.specs-search-wrap input {
  width: 100%; padding: 14px 20px 14px 44px; font-size: 15px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
  background: #ffffff; color: #1a1a1a; outline: none; box-sizing: border-box;
  transition: border-color 0.2s;
}
.specs-search-wrap input:focus { border-color: #6c4fff; }
.specs-search-wrap::before {
  content: '\\1F50D'; position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  font-size: 16px; pointer-events: none;
}
.specs-search-results {
  position: absolute; top: 100%; left: 0; right: 0; background: #ffffff;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; margin-top: 4px;
  max-height: 280px; overflow-y: auto; z-index: 10; display: none;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.specs-search-results.show { display: block; }
.specs-search-item {
  padding: 12px 16px; cursor: pointer; font-size: 14px; color: #1a1a1a;
  border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; gap: 10px;
}
.specs-search-item:hover { background: rgba(108,79,255,0.08); }
.specs-search-item:last-child { border-bottom: none; }
.flag-icon { border-radius: 4px; vertical-align: middle; display: inline-block; object-fit: cover; }
.specs-search-item .si-flag { font-size: 18px; line-height: 0; }
.specs-search-item .flag-icon { width: 24px; height: 18px; border-radius: 3px; }
.cc-flag .flag-icon { width: 32px; height: 24px; border-radius: 4px; }
.specs-hero-text h1 .flag-icon { height: 40px; width: auto; border-radius: 5px; margin-right: 8px; vertical-align: middle; position: relative; top: -0.1em; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
.specs-search-item .si-meta { font-size: 12px; color: #888; margin-left: auto; }

/* === Hub Footer === */
.specs-hub-footer { text-align: center; padding: 24px 0; margin-top: 32px; font-size: 12px; color: #888; border-top: 1px solid rgba(0,0,0,0.08); }

/* ================================================================
   DETAIL PAGE — Clean White Design, Full-width Section Bands
   Accent: #6c4fff | Sections divided by alternating bg color
   ================================================================ */

/* === Section bands — full-width alternating === */
.specs-band {
  margin: 0; padding: 60px 32px; background: #ffffff;
  border-radius: 0;
}
.specs-band .band-inner { max-width: 1000px; margin: 0 auto; }
.specs-band-white { background: #ffffff; }
.specs-band-gray { background: #f5f5f5; }
.specs-band-dark { background: linear-gradient(135deg, #0b1120 0%, #162032 50%, #0f2a3d 100%); }

/* === Detail — Back link === */
.specs-back {
  display: inline-flex; align-items: center; gap: 6px;
  margin-bottom: 16px; font-size: 13px; font-weight: 500;
  color: #6c4fff; text-decoration: none; letter-spacing: 0.2px;
}
.specs-back:hover { text-decoration: underline; }

/* === Detail — Hero (white, clean) === */
.specs-hero-wrap {
  background: #ffffff; padding: 40px 48px 32px;
  min-height: 682px; max-width: 1200px; margin: 0 auto;
  display: flex; flex-direction: column; justify-content: center;
  box-sizing: border-box;
}
.specs-hero {
  display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px;
  align-items: center; max-width: 1000px; margin: 0 auto;
}
.specs-hero-text h1 {
  font-size: 42px; font-weight: 700; color: #1a1a1a;
  line-height: 1.35; margin-bottom: 16px;
}
.specs-hero-text .specs-hero-desc {
  color: #666; font-size: 17px; line-height: 1.7; margin-bottom: 24px;
}
.specs-hero-tags { display: flex; gap: 10px; flex-wrap: wrap; row-gap: 20px; }
.specs-hero-tags span, .specs-hero-tags a span {
  background: rgba(108,79,255,0.1); color: #6c4fff;
  padding: 6px 12px; border-radius: 20px; font-size: 13px;
  font-weight: 600; border: 1px solid rgba(108,79,255,0.2);
  white-space: nowrap;
}
.specs-band-dark .specs-hero-tags span,
.specs-band-dark .specs-hero-tags a span {
  background: rgba(255,255,255,0.08); color: #ffffff;
  border: 1px solid rgba(255,255,255,0.2);
}
.specs-hero-label {
  font-size: 12px; letter-spacing: 2.5px; color: #6c4fff; font-weight: 600;
  font-family: monospace; margin-bottom: 12px; text-transform: uppercase;
}
.specs-hero-cta {
  display: inline-block; margin-top: 24px; padding: 14px 32px;
  background: #6c4fff; color: #fff; font-size: 15px; font-weight: 600;
  border-radius: 10px; text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}
.specs-hero-cta:hover { background: #5a3de6; transform: translateY(-1px); }

/* === PASSED stamp overlay === */
.specs-stamp {
  position: absolute; bottom: 10px; right: -20px;
  width: 216px; height: 216px;
  transform: rotate(-18deg);
  pointer-events: none; z-index: 20;
  opacity: 0.7;
}
.specs-stamp svg { width: 100%; height: 100%; }

/* === Before/After === */
.specs-ba-item { text-align: center; }
.specs-ba-img {
  width: 100%; height: 240px; object-fit: cover; object-position: center top;
  border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); display: block;
}
.specs-ba-label {
  margin-top: 8px; font-size: 11px; font-weight: 700; color: #888;
  letter-spacing: 2px;
}
.specs-ba-label-after { color: #6c4fff; }

/* === Crop tool — 3-panel === */
.specs-crop-tool { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.specs-crop-panel {
  height: 300px; border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative; box-sizing: border-box;
}
.specs-crop-upload {
  background: #ffffff; border: 2px dashed rgba(0,0,0,0.12);
  cursor: pointer;
}
.specs-crop-preview {
  background: #f0f1f5; border: 1px solid rgba(0,0,0,0.06);
}
.specs-crop-preview img {
  width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block;
}
.specs-crop-preview .crop-placeholder {
  color: #bbb; font-size: 14px; text-align: center;
}
.specs-crop-preview .crop-placeholder-icon {
  font-size: 40px; margin-bottom: 8px; opacity: 0.3;
}
.specs-crop-label {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 0;
  text-align: center; background: rgba(0,0,0,0.5); color: #fff;
  font-size: 11px; font-weight: 700; letter-spacing: 2px;
}
.specs-crop-label-after { background: rgba(108,79,255,0.7); }

@media (max-width: 768px) {
  .specs-crop-tool { grid-template-columns: 1fr 1fr; gap: 10px; }
  .specs-crop-upload { grid-column: 1 / -1; height: auto; min-height: 160px; padding: 24px 20px; }
  .specs-crop-panel { height: 200px; }
}

/* === Detail — Photo Diagram === */
.specs-diagram {
  background: transparent; border-radius: 0; padding: 20px 60px 40px 50px;
  display: flex; justify-content: center; align-items: center;
  position: relative;
}
.specs-photo-frame {
  width: 175px; height: 225px; background: #e0e2e6;
  border: 1px solid rgba(0,0,0,0.08); border-radius: 4px;
  position: relative; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  overflow: visible;
}
.specs-photo-frame img { border-radius: 4px; position: relative; z-index: 1; }
.specs-stamp { z-index: 20 !important; }
.specs-photo-frame img {
  object-fit: cover; width: 100%; height: 100%; display: block;
}
.specs-photo-frame svg { opacity: 0.12; }

/* Guide lines */
.specs-guide-w {
  position: absolute; bottom: -28px; left: 0; right: 0;
  text-align: center; font-size: 12px; color: #6c4fff; font-weight: 600;
}
.specs-guide-h {
  position: absolute; top: 0; bottom: 0; right: -50px;
  display: flex; align-items: center; font-size: 12px;
  color: #6c4fff; font-weight: 600; writing-mode: vertical-rl;
}
.specs-guide-h::before {
  content: ''; position: absolute; top: 0; bottom: 0; left: -8px;
  width: 1px; background: rgba(108,79,255,0.4);
}
.specs-head-guide {
  position: absolute; top: 18px; left: -45px; height: 144px;
  display: flex; align-items: center; font-size: 11px;
  color: #ef4444; font-weight: 500; writing-mode: vertical-rl;
}
.specs-head-guide::before {
  content: ''; position: absolute; top: 0; bottom: 0; right: -8px;
  width: 1px; background: rgba(239,68,68,0.3);
}

/* === Detail — Common Rules (inside gray card, no extra box) === */
.specs-common-rules {
  list-style: none; padding: 0; margin: 0 0 32px;
}
.specs-common-rule {
  padding: 14px 0; font-size: 16px; color: #333;
  line-height: 1.7; border-bottom: 1px solid rgba(0,0,0,0.06);
}
.specs-common-rule:last-child { border-bottom: none; }

/* === Detail — Section wrapper === */
.specs-section { margin-bottom: 48px; }
.specs-section h2 {
  font-size: 32px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 32px; letter-spacing: -0.3px;
}
.specs-section p { font-size: 14px; color: #666; line-height: 1.8; }

/* Detail sections (categorized) */
.specs-detail-sections { margin-top: 40px; }
.specs-detail-cat { margin-bottom: 32px; }
.specs-detail-cat:last-child { margin-bottom: 0; }
.specs-detail-cat h3 {
  font-size: 18px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 2px solid #6c4fff;
  display: inline-block;
}
.specs-detail-cat ul {
  list-style: none; padding: 0; margin: 0;
}
.specs-detail-cat li {
  padding: 12px 0; font-size: 16px; color: #555;
  line-height: 1.7; border-bottom: 1px solid rgba(0,0,0,0.04);
  padding-left: 18px; position: relative;
}
.specs-detail-cat li:last-child { border-bottom: none; }
.specs-detail-cat li::before {
  content: ''; position: absolute; left: 0; top: 18px;
  width: 6px; height: 6px; border-radius: 50%;
  background: #6c4fff;
}

/* AI summary box */
.specs-ai-summary {
  background: linear-gradient(135deg, rgba(108,79,255,0.05) 0%, rgba(108,79,255,0.015) 100%);
  border-left: 3px solid #6c4fff; padding: 18px 22px;
  border-radius: 0 14px 14px 0; margin-bottom: 24px;
  font-size: 16px; color: #333; line-height: 1.7;
}

/* Specs table */
.specs-table {
  width: 100%; border-collapse: collapse; border-spacing: 0;
  margin-bottom: 24px; background: transparent;
}
.specs-table th, .specs-table td {
  padding: 14px 20px; text-align: left; font-size: 17px;
}
.specs-table th {
  background: transparent; font-weight: 700; color: #1a1a1a;
  width: 130px; font-size: 15px;
}
.specs-table td { color: #555; font-weight: 500; }
.specs-table tr:not(:last-child) th,
.specs-table tr:not(:last-child) td {
  border-bottom: 1px solid rgba(0,0,0,0.04);
}

/* Detail items grid */
.specs-details-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.specs-detail-item {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px; background: #ffffff; border-radius: 10px;
  font-size: 16px; color: #555; line-height: 1.5;
  border: 1px solid rgba(0,0,0,0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.specs-detail-item:hover {
  border-color: rgba(108,79,255,0.25);
  box-shadow: 0 2px 8px rgba(108,79,255,0.06);
}

/* === Detail — O/X Compare === */
.specs-ox-compare {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin-bottom: 36px;
}
.specs-ox-card {
  background: #ffffff; border-radius: 14px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02);
  transition: box-shadow 0.2s;
}
.specs-ox-card:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.specs-ox-card.ox-good { border-color: rgba(34,197,94,0.3); }
.specs-ox-card.ox-bad { border-color: rgba(239,68,68,0.3); }
.specs-ox-header {
  padding: 12px 18px; font-weight: 700; font-size: 14px;
  display: flex; align-items: center; gap: 8px;
}
.specs-ox-card.ox-good .specs-ox-header {
  background: rgba(34,197,94,0.06); color: #16a34a;
}
.specs-ox-card.ox-bad .specs-ox-header {
  background: rgba(239,68,68,0.06); color: #dc2626;
}
.specs-ox-body {
  padding: 24px; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: #f8f9fb; min-height: 180px;
}
.specs-ox-photo {
  width: 120px; height: 154px; background: #e0e2e6;
  border: 1px solid rgba(0,0,0,0.08); border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.specs-ox-card.ox-good .specs-ox-photo { border-color: rgba(34,197,94,0.4); }
.specs-ox-card.ox-bad .specs-ox-photo { border-color: rgba(239,68,68,0.4); }
.specs-ox-photo svg { opacity: 0.2; }
.specs-ox-caption {
  margin-top: 10px; font-size: 12px; color: #888; text-align: center;
}
.specs-ox-points {
  padding: 14px 18px; border-top: 1px solid rgba(0,0,0,0.05);
  list-style: none; margin: 0;
}
.specs-ox-points li {
  font-size: 13px; color: #666; padding: 4px 0;
  display: flex; align-items: center; gap: 6px;
}

/* === Detail — Rejection Checklist === */
.specs-rejection-list {
  list-style: none; padding: 0; margin: 0;
}
.specs-rejection-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  font-size: 17px; color: #333; line-height: 1.5;
}
.specs-rejection-item:last-child { border-bottom: none; }
.specs-rj-x {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(239,68,68,0.08);
  color: #dc2626; font-weight: 700; font-size: 16px;
}

/* === Detail — FAQ Accordion === */
.specs-faq { list-style: none; padding: 0; }
.specs-faq-item {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px; margin-bottom: 10px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s;
}
.specs-faq-item:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.specs-faq-q {
  padding: 18px 22px; font-weight: 600; font-size: 17px; color: #1a1a1a;
  cursor: pointer; display: flex; align-items: center; gap: 12px;
  user-select: none; transition: background 0.15s;
}
.specs-faq-q:hover { background: rgba(0,0,0,0.015); }
.specs-faq-q::before {
  content: "Q"; color: #6c4fff; font-weight: 800; font-size: 14px;
  flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%;
  background: rgba(108,79,255,0.08); display: flex;
  align-items: center; justify-content: center;
}
.specs-faq-q::after {
  content: "\\25BE"; margin-left: auto; color: #aaa; font-size: 14px;
  transition: transform 0.25s ease;
}
.specs-faq-item.open .specs-faq-q::after { transform: rotate(180deg); }
.specs-faq-a {
  padding: 0 22px 20px 60px; font-size: 16px; color: #666;
  line-height: 1.8; display: none;
}
.specs-faq-item.open .specs-faq-a { display: block; }

/* === Official Source Link === */
.specs-official-link {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 22px; background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
  color: #1a1a1a; text-decoration: none; font-size: 14px; font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.specs-official-link:hover {
  border-color: rgba(108,79,255,0.3);
  box-shadow: 0 2px 12px rgba(108,79,255,0.08);
}
.specs-external-icon {
  margin-left: auto; color: #6c4fff; font-size: 18px;
  transition: transform 0.2s;
}
.specs-official-link:hover .specs-external-icon {
  transform: translate(2px, -2px);
}

/* === Detail — Online Guide === */
.specs-online-guide { margin-top: 8px; }
.specs-online-section { margin-bottom: 28px; }
.specs-online-section:last-child { margin-bottom: 0; }
.specs-online-section h3 {
  font-size: 18px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 14px; padding-bottom: 8px;
  border-bottom: 2px solid #6c4fff; display: inline-block;
}
.specs-online-section ul { list-style: none; padding: 0; margin: 0; }
.specs-online-section li {
  padding: 10px 0; font-size: 16px; color: #555;
  line-height: 1.7; border-bottom: 1px solid rgba(0,0,0,0.04);
  padding-left: 18px; position: relative;
}
.specs-online-section li:last-child { border-bottom: none; }
.specs-online-section li::before {
  content: ''; position: absolute; left: 0; top: 18px;
  width: 6px; height: 6px; border-radius: 50%; background: #6c4fff;
}
.specs-online-source {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06); border-radius: 12px;
  color: #1a1a1a; text-decoration: none; font-size: 14px; font-weight: 500;
  margin-top: 20px; transition: border-color 0.2s;
}
.specs-online-source:hover { border-color: rgba(108,79,255,0.3); }
.specs-online-source .specs-external-icon { margin-left: auto; color: #6c4fff; }

/* === Detail — CTA Banner === */
.specs-cta-banner {
  text-align: center; padding: 20px 0;
}
.specs-cta-badge {
  display: inline-block; font-size: 13px; color: #b4a0ff;
  margin-bottom: 20px; font-weight: 500;
}
.specs-cta-banner h2 {
  font-size: 28px; font-weight: 800; color: #ffffff;
  line-height: 1.4; margin-bottom: 8px;
}
.specs-cta-banner h2 span {
  color: #b4a0ff;
}
.specs-cta-sub {
  font-size: 14px; color: rgba(255,255,255,0.6);
  line-height: 1.7; margin-bottom: 28px;
}
.specs-cta-btn {
  display: inline-block; padding: 16px 40px;
  background: #6c4fff; color: #fff; font-size: 16px; font-weight: 700;
  border-radius: 12px; text-decoration: none;
  transition: background 0.2s, transform 0.15s;
  box-shadow: 0 4px 16px rgba(124,58,237,0.3);
}
.specs-cta-btn:hover { background: #5a3de6; transform: translateY(-2px); }
.specs-cta-price {
  margin-top: 14px; font-size: 13px; color: rgba(255,255,255,0.5);
}
.specs-cta-price strong { color: rgba(255,255,255,0.8); }

/* === Detail — Related Content === */
.specs-related {
  margin-top: 40px; padding: 0;
  background: transparent; border: none; border-radius: 0;
  box-shadow: none;
}
.specs-related h3 {
  font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.8);
  margin-bottom: 14px;
}
.specs-related-links { display: flex; flex-wrap: wrap; gap: 10px; }
.specs-related-links a {
  font-size: 13px; color: #6c4fff; text-decoration: none;
  padding: 7px 16px; background: rgba(108,79,255,0.1);
  border-radius: 10px; transition: all 0.2s;
  border: 1px solid rgba(108,79,255,0.15); font-weight: 500;
}
.specs-related-links a:hover {
  background: rgba(108,79,255,0.2); border-color: rgba(108,79,255,0.3);
}

/* === Responsive — Detail page === */
@media (max-width: 768px) {
  .specs-hero-wrap { margin: 0; padding: 24px 20px 32px; }
  .specs-hero { grid-template-columns: 1fr; gap: 24px; }
  .specs-hero-text { text-align: left; }
  .specs-hero-text h1 { font-size: 28px; }
  .specs-hero-text .specs-hero-desc { text-align: left; }
  .specs-hero-tags { justify-content: flex-start; gap: 8px; row-gap: 18px; }
  .specs-hero-tags span, .specs-hero-tags a span { font-size: 12px; padding: 5px 10px; }
  .specs-back { display: block; text-align: left; margin-bottom: 12px; }
  .specs-diagram { margin-bottom: 8px; padding: 20px 36px; }
  .specs-details-grid { grid-template-columns: 1fr; }
  .specs-ox-compare { grid-template-columns: 1fr; }
  .specs-rejection-item { padding: 14px 0; font-size: 14px; }
  .specs-cta-banner h2 { font-size: 22px; }
  .specs-cta-btn { padding: 14px 32px; font-size: 15px; }
  .specs-related { padding: 20px 22px; }
  .specs-common-rule { padding: 16px 20px; }
  .specs-faq-q { padding: 16px 18px; }
  .specs-faq-a { padding: 0 18px 18px 52px; }
}
/* === Responsive — Hub page === */
@media (max-width: 768px) {
  .purpose-grid { grid-template-columns: 1fr 1fr; }
  .continent-grid { grid-template-columns: 1fr; }
  .country-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .purpose-grid { grid-template-columns: 1fr; }
  .specs-hero-text h1 { font-size: 22px; }
  .specs-diagram { padding: 28px 24px; }
  .specs-photo-frame { width: 140px; height: 180px; }
  .specs-guide-h { right: -44px; }
  .specs-head-guide { left: -38px; }
}
`;

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

  const pageScript = `
(function(){
  var hubData = ${hubDataJson};
  var countriesLabel = '${escapeHtml(i.countriesCount)}';
  var currentCat = null;
  var currentCont = null;

  var purposeSection = document.getElementById('purpose-section');
  var continentSection = document.getElementById('continent-section');
  var countrySection = document.getElementById('country-section');
  var countryGrid = document.getElementById('country-grid');
  var searchInput = document.getElementById('country-search');
  var searchResults = document.getElementById('search-results');

  // Build flat search index
  var searchIndex = [];
  Object.keys(hubData).forEach(function(cat) {
    Object.keys(hubData[cat]).forEach(function(cont) {
      hubData[cat][cont].forEach(function(c) {
        searchIndex.push({ flag: c.flag, name: c.name, type: c.type, size: c.size, url: c.url, cat: cat, cont: cont });
      });
    });
  });

  // Search
  searchInput.addEventListener('input', function() {
    var q = this.value.trim().toLowerCase();
    if (!q) { searchResults.classList.remove('show'); return; }
    var seen = {};
    var matches = searchIndex.filter(function(c) {
      if (seen[c.url]) return false;
      var match = c.name.toLowerCase().indexOf(q) !== -1;
      if (match) seen[c.url] = true;
      return match;
    }).slice(0, 12);
    if (!matches.length) { searchResults.classList.remove('show'); return; }
    searchResults.innerHTML = matches.map(function(c) {
      return '<div class="specs-search-item" data-url="' + c.url + '">'
        + '<span class="si-flag">' + c.flag + '</span>'
        + '<span>' + c.name + '</span>'
        + '<span class="si-meta">' + c.type + ' · ' + c.size + '</span>'
        + '</div>';
    }).join('');
    searchResults.classList.add('show');
  });

  searchResults.addEventListener('click', function(e) {
    var item = e.target.closest('.specs-search-item');
    if (item && item.dataset.url) location.href = item.dataset.url;
  });

  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target))
      searchResults.classList.remove('show');
  });

  // Purpose cards click
  document.querySelectorAll('.purpose-card').forEach(function(card) {
    card.addEventListener('click', function() {
      currentCat = this.dataset.cat;
      document.querySelectorAll('.purpose-card').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');

      // Update continent counts for this category
      document.querySelectorAll('.continent-card').forEach(function(cc) {
        var contId = cc.dataset.cont;
        var countries = hubData[currentCat] && hubData[currentCat][contId] ? hubData[currentCat][contId] : [];
        var countEl = cc.querySelector('[data-cont-count]');
        if (countEl) countEl.textContent = countries.length + ' ' + countriesLabel;
        cc.style.display = countries.length > 0 ? '' : 'none';
      });

      purposeSection.style.display = 'none';
      continentSection.style.display = '';
      countrySection.style.display = 'none';
    });
  });

  // Continent cards click
  document.querySelectorAll('.continent-card').forEach(function(card) {
    card.addEventListener('click', function() {
      currentCont = this.dataset.cont;
      var countries = hubData[currentCat] && hubData[currentCat][currentCont] ? hubData[currentCat][currentCont] : [];

      countryGrid.innerHTML = countries.map(function(c) {
        return '<a href="' + c.url + '" class="country-card">'
          + '<div class="cc-flag">' + c.flag + '</div>'
          + '<div class="cc-name">' + c.name + '</div>'
          + '<div class="cc-meta">' + c.type + ' · ' + c.size + '</div>'
          + '</a>';
      }).join('');

      continentSection.style.display = 'none';
      countrySection.style.display = '';
    });
  });

  // Back buttons
  document.getElementById('back-to-purpose').addEventListener('click', function() {
    continentSection.style.display = 'none';
    countrySection.style.display = 'none';
    purposeSection.style.display = '';
    currentCat = null;
    document.querySelectorAll('.purpose-card').forEach(function(c) { c.classList.remove('active'); });
  });

  document.getElementById('back-to-continent').addEventListener('click', function() {
    countrySection.style.display = 'none';
    continentSection.style.display = '';
  });
})();`;

  return {
    title: i.hubTitle,
    description: i.hubDesc,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_PAGE_STYLE,
    bodyContent,
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

const SPECS_V2_STYLE = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
body { background: #ffffff !important; color: #1a1a1a !important; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important; }
.container { max-width: 1000px; }
a { color: #6c4fff; }
a:hover { color: #5a3de6; }

.v2-wrap { max-width: 960px; margin: 0 auto; padding: 40px 24px 0; }
.v2-breadcrumb { font-size: 13px; color: #888; margin-bottom: 16px; }
.v2-breadcrumb a { color: #6c4fff; text-decoration: none; }
.v2-breadcrumb a:hover { text-decoration: underline; }
.v2-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.v2-tag {
  background: rgba(108,79,255,0.08); color: #6c4fff; padding: 5px 14px;
  border-radius: 20px; font-size: 13px; font-weight: 600; text-decoration: none;
  border: 1px solid rgba(108,79,255,0.15);
}
.v2-tag:hover { background: rgba(108,79,255,0.15); }
.v2-header h1 { font-size: 36px; font-weight: 800; color: #1a1a1a; margin-bottom: 8px; line-height: 1.3; }
.v2-header .v2-sub { font-size: 15px; color: #888; margin-bottom: 40px; }

/* 핵심 규격 카드 — 2컬럼 */
.v2-spec-card {
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px;
  padding: 32px; margin-bottom: 48px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.v2-spec-table { width: 100%; border-collapse: collapse; }
.v2-spec-table tr { border-bottom: 1px solid rgba(0,0,0,0.05); }
.v2-spec-table tr:last-child { border-bottom: none; }
.v2-spec-table th {
  text-align: left; padding: 12px 0; font-size: 14px; color: #888;
  font-weight: 500; width: 110px; vertical-align: top;
}
.v2-spec-table td { padding: 12px 0; font-size: 15px; color: #1a1a1a; font-weight: 600; }
.v2-badge {
  display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px;
  font-weight: 600; margin-left: 8px; vertical-align: middle;
}
.v2-badge-a { background: rgba(108,79,255,0.1); color: #6c4fff; }
.v2-badge-req { background: rgba(239,68,68,0.1); color: #dc2626; }

/* 규격 다이어그램 */
.v2-diagram-wrap {
  display: flex; align-items: center; justify-content: center;
  position: relative; min-height: 280px;
}
.v2-photo-frame {
  /* 프레임 비율 = 규격 비율 (인라인 --spec-ar로 페이지별 주입, 2026-07-06 정합 — 종전 160×206 고정이 정사각 규격을 세로로 왜곡) */
  width: 160px; aspect-ratio: var(--spec-ar, 35/45); background: #e8e9ed; border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.08); position: relative;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.v2-photo-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.v2-dim-w {
  position: absolute; bottom: -24px; left: 0; right: 0; text-align: center;
  font-size: 12px; color: #6c4fff; font-weight: 700;
}
.v2-dim-w::before {
  content: ''; position: absolute; bottom: 8px; left: 10%; right: 10%;
  height: 1px; background: rgba(108,79,255,0.3);
}
.v2-dim-h {
  position: absolute; top: 0; bottom: 0; right: -40px;
  display: flex; align-items: center; font-size: 12px;
  color: #6c4fff; font-weight: 700; writing-mode: vertical-rl;
}
.v2-dim-h::before {
  content: ''; position: absolute; top: 5%; bottom: 5%; left: -8px;
  width: 1px; background: rgba(108,79,255,0.3);
}
.v2-dim-head {
  position: absolute; top: 10px; left: -36px; height: 130px;
  display: flex; align-items: center; font-size: 11px;
  color: #ef4444; font-weight: 600; writing-mode: vertical-rl;
}
.v2-dim-head::before {
  content: ''; position: absolute; top: 0; bottom: 0; right: -6px;
  width: 1px; background: rgba(239,68,68,0.3);
}

/* 3스텝 플로우 */
.v2-steps-section {
  background: #f7f7fb; border-radius: 20px; padding: 40px 32px;
  margin-bottom: 48px;
}
.v2-steps-title { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
.v2-steps-sub { font-size: 14px; color: #888; margin-bottom: 8px; }
.v2-steps-badge {
  display: inline-block; background: rgba(108,79,255,0.1); color: #6c4fff;
  font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 12px;
  margin-bottom: 28px;
}
.v2-check-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.v2-photo-side { display: flex; flex-direction: column; align-items: center; }
.v2-checklist-side {
  background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
  padding: 24px; min-height: 280px;
}
.v2-checklist-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; letter-spacing: 0.5px; }
.v2-checklist-loading { display: flex; align-items: center; gap: 10px; padding: 16px 0; }
.v2-checklist-items { list-style: none; padding: 0; margin: 0; }
.v2-checklist-items li {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 14px; color: #333;
}
.v2-checklist-items li:last-child { border-bottom: none; }
.v2-check-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.v2-check-pass { background: rgba(34,197,94,0.12); color: #16a34a; }
.v2-check-fail { background: rgba(239,68,68,0.12); color: #dc2626; }
.v2-check-warn { background: rgba(245,158,11,0.12); color: #d97706; }
.v2-checklist-summary { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; }
.v2-summary-pass { background: rgba(34,197,94,0.08); color: #16a34a; }
.v2-summary-fail { background: rgba(239,68,68,0.08); color: #dc2626; }
.v2-action-buttons { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.v2-action-btn {
  flex: 1; min-width: 100px; padding: 12px 8px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; border: 1px solid rgba(0,0,0,0.1);
  background: #fff; color: #333; transition: all 0.2s; text-align: center;
}
.v2-action-btn:hover { border-color: #6c4fff; color: #6c4fff; }
.v2-btn-retouch { background: #6c4fff; color: #fff !important; border-color: #6c4fff; }
.v2-btn-retouch:hover { background: #5a3de6; }
.v2-btn-premier { background: #1a1a1a; color: #fff !important; border-color: #1a1a1a; }
.v2-btn-premier:hover { background: #333; }
.v2-credit { font-size: 11px; opacity: 0.8; margin-left: 4px; }

/* Phase 2: 결제 */
.v2-pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
.v2-pay-preview { text-align: center; }
.v2-pay-preview img { max-width: 200px; max-height: 260px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); }
.v2-change-photo { margin-top: 12px; background: none; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 6px 16px; font-size: 12px; color: #666; cursor: pointer; }
.v2-change-photo:hover { border-color: #6c4fff; color: #6c4fff; }
.v2-pay-options { display: flex; flex-direction: column; gap: 12px; }
.v2-pay-btn {
  width: 100%; padding: 20px 24px; border-radius: 14px; cursor: pointer;
  text-align: left; border: 2px solid rgba(0,0,0,0.08); background: #fff; transition: all 0.2s;
}
.v2-pay-btn:hover { border-color: #6c4fff; box-shadow: 0 4px 16px rgba(108,79,255,0.1); }
.v2-pay-instant { border-color: #6c4fff; }
.v2-toss-widget { margin-top: 16px; background: #fff; border-radius: 12px; padding: 4px 0; }
.v2-pay-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.v2-pay-price { font-size: 24px; font-weight: 800; color: #6c4fff; margin-bottom: 6px; }
.v2-pay-desc { font-size: 12px; color: #888; }
.v2-pay-divider { text-align: center; color: #ccc; font-size: 12px; position: relative; }
.v2-pay-divider span { background: #f5f5f7; padding: 0 12px; position: relative; z-index: 1; }
.v2-pay-divider::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px solid #e5e5e5; }

/* Phase 3: 생성 중 */
.v2-generating { text-align: center; padding: 60px 0; }
.v2-gen-text { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 16px; }
.v2-gen-sub { font-size: 13px; color: #888; margin-top: 6px; }

/* Phase 4: 결과 */
.v2-result-grid { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 24px; }
.v2-result-before, .v2-result-after { text-align: center; }
.v2-result-label { font-size: 12px; font-weight: 600; color: #888; margin-bottom: 8px; }
.v2-result-before img, .v2-result-after img { max-width: 180px; max-height: 240px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.08); }
.v2-result-arrow { font-size: 28px; color: #ccc; font-weight: 300; }
.v2-result-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.v2-download-btn {
  background: #6c4fff; color: #fff; border: none; padding: 14px 40px;
  border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer;
}
.v2-download-btn:hover { background: #5a3de6; }

/* 스텝1 — 업로드 */
.v2-upload-zone {
  width: 100%; border: 2px dashed rgba(108,79,255,0.25); border-radius: 12px;
  padding: 32px 16px; cursor: pointer; transition: border-color 0.2s, background 0.2s;
  display: flex; flex-direction: column; align-items: center;
}
.v2-upload-zone:hover, .v2-upload-zone.dragover { border-color: #6c4fff; background: rgba(108,79,255,0.03); }
.v2-upload-zone .v2-upload-icon { font-size: 32px; color: #bbb; margin-bottom: 8px; }
.v2-upload-zone .v2-upload-btn {
  padding: 8px 20px; border: 1.5px solid #6c4fff; border-radius: 8px;
  color: #6c4fff; font-size: 13px; font-weight: 600; background: none; cursor: pointer;
  margin-top: 8px;
}
.v2-upload-zone .v2-upload-hint { font-size: 11px; color: #bbb; margin-top: 6px; }
.v2-upload-with-guides { display: flex; align-items: center; gap: 24px; justify-content: center; }
.v2-guide-img-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
.v2-guide-img { width: 100px; height: 100px; border-radius: 12px; object-fit: cover; opacity: 0.7; border: 2px dashed rgba(108,79,255,0.25); }
.v2-guide-label { font-size: 11px; color: #888; font-weight: 500; }
.v2-upload-guide { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.06); }
.v2-guide-items { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
.v2-guide-items span { font-size: 11px; color: #888; background: rgba(108,79,255,0.06); padding: 3px 8px; border-radius: 10px; }
@media (max-width: 700px) {
  .v2-upload-with-guides { flex-direction: column; gap: 16px; }
  .v2-guide-img-wrap { flex-direction: row; gap: 12px; }
  .v2-guide-img { width: 60px; height: 60px; }
}

/* 스텝2 — 프리뷰 */
.v2-preview-box {
  width: 140px; height: 180px; background: #f0f1f5; border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.06); position: relative;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.v2-preview-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
.v2-preview-overlay {
  position: absolute; top: 8px; right: 8px; background: rgba(108,79,255,0.85);
  color: #fff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 4px;
}
.v2-preview-check {
  position: absolute; bottom: 8px; right: 8px; width: 24px; height: 24px;
  background: #22c55e; border-radius: 50%; color: #fff; font-size: 14px;
  display: none; align-items: center; justify-content: center;
}
.v2-preview-check.show { display: flex; }

/* 스텝3 — 다운로드 (결과 Phase에서 항상 표시) */

/* 스텝 로딩 */
.v2-step-loading {
  display: none; flex-direction: column; align-items: center; gap: 10px;
}
.v2-step-loading.show { display: flex; }
.v2-spinner {
  width: 32px; height: 32px; border: 3px solid rgba(108,79,255,0.2);
  border-top-color: #6c4fff; border-radius: 50%; animation: v2spin 0.8s linear infinite;
}
@keyframes v2spin { to { transform: rotate(360deg); } }

/* 상세규정 + 반려사유 2컬럼 */
.v2-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 48px; }
.v2-detail-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px;
  padding: 28px; box-shadow: 0 1px 6px rgba(0,0,0,0.03);
}
.v2-detail-card h3 {
  font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 0;
  cursor: pointer; display: flex; align-items: center; user-select: none;
}
.v2-detail-card h3::after {
  content: '\\25BE'; margin-left: auto; color: #aaa; font-size: 13px;
  transition: transform 0.25s;
}
.v2-detail-card.open h3::after { transform: rotate(180deg); }
.v2-detail-card .v2-detail-body { display: none; margin-top: 20px; }
.v2-detail-card.open .v2-detail-body { display: block; }
.v2-detail-list { list-style: none; padding: 0; margin: 0; }
.v2-detail-list li {
  padding: 10px 0; font-size: 14px; color: #555; line-height: 1.7;
  border-bottom: 1px solid rgba(0,0,0,0.04); padding-left: 16px; position: relative;
}
.v2-detail-list li:last-child { border-bottom: none; }
.v2-detail-list li::before {
  content: ''; position: absolute; left: 0; top: 16px;
  width: 5px; height: 5px; border-radius: 50%; background: #6c4fff;
}
.v2-reject-list { list-style: none; padding: 0; margin: 0; counter-reset: rj; }
.v2-reject-list li {
  padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.04);
  counter-increment: rj;
}
.v2-reject-list li:last-child { border-bottom: none; }
.v2-rj-title {
  font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px;
  display: flex; align-items: center; gap: 8px;
}
.v2-rj-title::before {
  content: counter(rj); flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
  background: rgba(239,68,68,0.08); color: #dc2626; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.v2-rj-desc { font-size: 13px; color: #888; padding-left: 30px; }

/* 같은 규격 서류 */
.v2-same-section { margin-bottom: 48px; }
.v2-same-section h2 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 6px; }
.v2-same-sub { font-size: 14px; color: #888; margin-bottom: 20px; }
.v2-same-grid { display: flex; gap: 12px; flex-wrap: wrap; }
.v2-same-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  padding: 16px 20px; text-decoration: none; color: #1a1a1a;
  display: flex; align-items: center; gap: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.v2-same-card:hover { border-color: rgba(108,79,255,0.3); box-shadow: 0 2px 10px rgba(108,79,255,0.08); }
.v2-same-icon { font-size: 20px; }
.v2-same-name { font-size: 14px; font-weight: 600; }
.v2-same-size { font-size: 12px; color: #888; }
.v2-same-note { font-size: 11px; color: #ef4444; }

/* FAQ */
.v2-faq-section { margin-bottom: 48px; }
.v2-faq-section h2 { font-size: 24px; font-weight: 800; color: #1a1a1a; margin-bottom: 20px; }
.v2-faq-item {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 12px;
  margin-bottom: 8px; overflow: hidden;
}
.v2-faq-q {
  padding: 16px 20px; font-weight: 600; font-size: 15px; color: #1a1a1a;
  cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none;
}
.v2-faq-q:hover { background: rgba(0,0,0,0.015); }
.v2-faq-q::before {
  content: 'Q'; color: #6c4fff; font-weight: 800; font-size: 12px;
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
  background: rgba(108,79,255,0.08); display: flex;
  align-items: center; justify-content: center;
}
.v2-faq-q::after {
  content: '\\25BE'; margin-left: auto; color: #aaa; font-size: 13px;
  transition: transform 0.25s;
}
.v2-faq-item.open .v2-faq-q::after { transform: rotate(180deg); }
.v2-faq-a {
  padding: 0 20px 16px 54px; font-size: 14px; color: #666;
  line-height: 1.8; display: none;
}
.v2-faq-item.open .v2-faq-a { display: block; }

/* CTA 배너 */
.v2-cta-banner {
  background: linear-gradient(135deg, #6c4fff 0%, #9f7afe 100%);
  border-radius: 20px; padding: 48px 32px; text-align: center; margin-bottom: 48px;
}
.v2-cta-banner h2 { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px; }
.v2-cta-banner .v2-cta-sub { font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 24px; }
.v2-cta-btn-main {
  display: inline-block; padding: 14px 36px; background: #fff; color: #6c4fff;
  font-size: 15px; font-weight: 700; border-radius: 10px; text-decoration: none;
  transition: transform 0.15s; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.v2-cta-btn-main:hover { transform: translateY(-2px); }

/* 에러 메시지 */
.v2-error-msg { display: none; color: #dc2626; font-size: 13px; margin-top: 8px; text-align: center; }
.v2-error-msg.show { display: block; }

/* T2 업셀 — 발급보장 (2티어 CTA) */
.v2-upsell { text-align: center; margin-top: 20px; }
.v2-upsell a {
  font-size: 13px; color: #888; text-decoration: none;
  border-bottom: 1px dashed rgba(0,0,0,0.2); padding-bottom: 2px;
}
.v2-upsell a:hover { color: #6c4fff; border-bottom-color: #6c4fff; }

/* 반응형 */
@media (max-width: 768px) {
  .v2-wrap { padding: 24px 16px 0; }
  .v2-header h1 { font-size: 26px; }
  .v2-spec-card { grid-template-columns: 1fr; gap: 24px; }
  .v2-check-layout { grid-template-columns: 1fr; }
  .v2-action-buttons { flex-direction: column; }
  .v2-pay-grid { grid-template-columns: 1fr; }
  .v2-result-grid { flex-direction: column; }
  .v2-result-arrow { transform: rotate(90deg); }
  .v2-steps-section { padding: 28px 20px; }
  .v2-detail-grid { grid-template-columns: 1fr; }
  .v2-same-grid { flex-direction: column; }

  /* ── 모바일 가독성 1차 패스 (2026-07-07 작가님: 소형 활자·저대비로 판독 불가) ──
     11~13px 계열을 14px+ 로, #888 계열 회색을 진하게. 총체 재설계 전 응급 상향. */
  .v2-header .v2-sub { font-size: 16px; color: #555; }
  .v2-breadcrumb { font-size: 14px; color: #666; }
  .v2-tag { font-size: 14px; }
  .v2-spec-table td { font-size: 16px; }
  .v2-spec-table td:first-child { color: #555; }
  .v2-badge { font-size: 13px; }
  .v2-dim-w, .v2-dim-h { font-size: 14px; }
  .v2-dim-head { font-size: 13px; }
  .v2-steps-badge { font-size: 14px; }
  .v2-check-warn-msg { font-size: 14px; }
  .v2-checklist-summary { font-size: 15px; }
  .v2-action-btn { font-size: 15px; padding: 14px 10px; }
  .v2-change-photo { font-size: 14px; color: #555; padding: 8px 18px; }
  .v2-pay-title { font-size: 17px; }
  .v2-pay-desc { font-size: 14px; color: #666; }
  .v2-pay-divider { font-size: 14px; color: #999; }
  .v2-gen-sub { font-size: 15px; color: #666; }
  .v2-result-label { font-size: 14px; color: #666; }
  .v2-detail-card li, .v2-detail-card p { font-size: 15px; color: #444; }
  .v2-upload-zone .v2-upload-btn { font-size: 15px; }
  .v2-guide-label { font-size: 14px; color: #555; }
  .v2-credit { font-size: 13px; }
}

/* 검수 경고 메시지 */
.v2-check-warn-msg { font-size: 12px; color: #d97706; padding: 6px 0 0 32px; line-height: 1.5; }
`;

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

function specsDetailV2Fragment(slug, forceLang = null) {
  const lang = forceLang || 'ko';
  const i = SPECS_I18N[lang] || SPECS_I18N.ko;
  const v2 = i.v2 || SPECS_I18N.ko.v2;
  // 시장 판별: 결제 PG 분기 정본 (kr=토스, jp=레몬 JP 스토어, global=레몬 글로벌)
  const market = lang === 'ja' ? 'jp' : lang === 'en' ? 'global' : 'kr';
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
  const ogGuideKey = GUIDE_IMAGES.has(slug) ? slug : (parseSizeMm(specData.size) || 'kr-passport');
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
      "image": ogImageAbsolute,
      "inLanguage": lang,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      "publisher": { "@type": "Organization", "name": "Monk Studio" },
      "datePublished": "2026-03-26",
      "dateModified": "2026-06-24",
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

  const sizeMm = parseSizeMm(specData.size);
  // 치수 라벨은 mm 정본에서 생성 — 원문 split은 "2 × 2 inch (51 × 51mm)"처럼 ×가 2개면 잘림 (2026-07-07 실사고)
  const mmParts = (sizeMm || '').split('x');
  const sizeW = mmParts[0] ? `${mmParts[0]}mm` : locField(specData, 'size', lang).split('×')[0].trim();
  const sizeH = mmParts[1] ? `${mmParts[1]}mm` : (locField(specData, 'size', lang).split('×')[1] || '').trim();
  const imgSrc = `/images/guides/${slug}.webp`;
  const fallbackSrc = sizeMm ? `/images/guides/${sizeMm}.webp` : '';

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
  const upsellHref = lang === 'ja' ? 'https://idphoto-jp.monkos.ai/' : 'https://idphoto-kr.monkos.ai/';
  const upsellLabel = lang === 'ja' ? '却下の心配なく — 発行保証 ¥990 →'
    : lang === 'en' ? 'No rejection worries — guaranteed issue ₩9,900 →'
    : '반려 걱정 없이 — 발급보장 ₩9,900 →';
  const upsellHtml = `<div class="v2-upsell"><a href="${upsellHref}" data-cta="specs-upsell" rel="noopener">${escapeHtml(upsellLabel)}</a></div>`;

  const fullName = `${countryName} ${typeName}`;
  const bodyContent = `
  ${market === 'kr' ? '<script src="https://js.tosspayments.com/v2/standard"></script>' : ''}
  <div class="v2-wrap">
    <!-- 1. 헤더 -->
    <nav class="v2-breadcrumb">
      <a href="${prefix}/specs">${escapeHtml(v2.breadcrumbGuide)}</a> &gt; ${escapeHtml(countryName)} &gt; ${escapeHtml(typeName)}
    </nav>
    <div class="v2-header">
      <h1>${escapeHtml(countryName)} ${escapeHtml(typeName)}</h1>
      <div class="v2-sub">${escapeHtml(specData.countryEn || countryName)} ${escapeHtml(specData.typeEn || typeName)} Photo Specification</div>
    </div>
    <div class="v2-tags">
      <span class="v2-tag">${escapeHtml(countryName)}</span>
      <span class="v2-tag">${escapeHtml(typeName)}</span>
      ${sameSize.map(s => {
        const n = lang === 'ja' ? (s.typeJa || s.type) : (lang === 'en' ? s.typeEn : s.type);
        const { typeSlug: ts, countrySlug: cs } = parseSlug(s.slug);
        return `<a href="${prefix}/specs/${ts}/${cs}" class="v2-tag">${escapeHtml(n)}</a>`;
      }).join('')}
    </div>

    <!-- 2. 핵심 규격 카드 -->
    <div class="v2-spec-card">
      <div>
        <table class="v2-spec-table">
          ${specRows}
        </table>
      </div>
      <div class="v2-diagram-wrap">
        <div class="v2-photo-frame"${(() => {
          // 규격 비율을 프레임에 주입 — 정사각(51x51)이 세로 틀로 왜곡되던 정합 사고 (2026-07-06)
          const mm = (sizeMm || '').split('x').map(Number);
          return (mm.length === 2 && mm[0] > 0 && mm[1] > 0) ? ` style="--spec-ar:${mm[0]}/${mm[1]}"` : '';
        })()}>
          <img src="${imgSrc}" alt="${escapeHtml(countryName)} ${escapeHtml(typeName)}"
               onerror="this.src='${fallbackSrc}';this.onerror=function(){this.style.display='none'}">
          <div class="v2-dim-head">${escapeHtml(locField(specData, 'headHeight', lang))}</div>
          <div class="v2-dim-w">${escapeHtml(sizeW)}</div>
        </div>
        <div class="v2-dim-h">${escapeHtml(sizeH)}</div>
      </div>
    </div>

    <!-- 3. 사진 만들기 (T1 셀프서브 즉시결제) -->
    <div class="v2-steps-section" id="v2-steps">
      <div class="v2-steps-title">${escapeHtml(fmtV2(v2.makeTitle, { name: fullName }))}</div>
      <div class="v2-steps-sub">${escapeHtml(fmtV2(v2.makeSub, { size: locField(specData, 'size', lang) }))}</div>

      <!-- Phase 1: 업로드 -->
      <div class="v2-make-layout" id="v2-phase-upload">
        <div class="v2-upload-with-guides">
          <div class="v2-guide-img-wrap">
            <img src="/images/guides/guide-selfie.jpg" alt="${escapeHtml(v2.altSelfie)}" class="v2-guide-img">
            <span class="v2-guide-label">${escapeHtml(v2.labelSelfie)}</span>
          </div>
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
          <div class="v2-guide-img-wrap">
            <img src="/images/guides/guide-profile.jpg" alt="${escapeHtml(v2.altProfile)}" class="v2-guide-img">
            <span class="v2-guide-label">${escapeHtml(v2.labelProfile)}</span>
          </div>
        </div>
        <div class="v2-error-msg" id="v2-error"></div>
      </div>

      <!-- Phase 2: AI 검수 결과 -->
      <div class="v2-make-layout" id="v2-phase-check" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-check-img" src="" alt="${escapeHtml(v2.altCheck)}">
          </div>
          <div class="v2-checklist-side">
            <div class="v2-checklist-title">${escapeHtml(v2.checkTitle)}</div>
            <div class="v2-checklist-loading" id="v2-loading">
              <div class="v2-spinner"></div>
              <span>${escapeHtml(v2.checking)}</span>
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
            <div class="v2-checklist-title">규격 안착</div>
            <div id="v2-fit-badges" style="display:none;gap:8px;flex-wrap:wrap;margin:8px 0;"></div>
            <div id="v2-fit-note" style="display:none;font-size:12.5px;color:#555;background:#f6f6fb;border-radius:8px;padding:8px 10px;margin:6px 0;"></div>
            <div class="v2-checklist-summary" id="v2-fit-summary"></div>
            <div class="v2-action-buttons" id="v2-fit-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-fit-change">다른 사진으로</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-fit-make">이대로 만들기</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2: 결제 선택 -->
      <div class="v2-make-layout" id="v2-phase-pay" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-preview-img" src="" alt="${escapeHtml(v2.altPreview)}">
            <button class="v2-change-photo" id="v2-change-photo">${escapeHtml(v2.btnOtherPhoto)}</button>
          </div>
          <div class="v2-pay-options">
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
            ${upsellHtml}
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

      <!-- T2 업셀 — 발급보장 (상시 노출) -->
      ${upsellHtml}
    </div>

    <!-- 4. 상세규정 + 반려사유 (아코디언) -->
    <div class="v2-detail-grid">
      <div class="v2-detail-card" onclick="this.classList.toggle('open')">
        <h3>${escapeHtml(v2.detailsTitle)}</h3>
        <div class="v2-detail-body"><ul class="v2-detail-list">${detailHtml}</ul></div>
      </div>
      ${rejectHtml ? `<div class="v2-detail-card" onclick="this.classList.toggle('open')">
        <h3>${escapeHtml(v2.rejectionTitle)}</h3>
        <div class="v2-detail-body"><ol class="v2-reject-list">${rejectHtml}</ol></div>
      </div>` : ''}
    </div>

    ${sameSize.length > 0 ? `<!-- 5. 같은 사진으로 제출 가능한 서류 -->
    <div class="v2-same-section">
      <h2>${escapeHtml(v2.sameTitle)}</h2>
      <div class="v2-same-sub">${escapeHtml(fmtV2(v2.sameSub, { name: fullName, size: locField(specData, 'size', lang) }))}</div>
      <div class="v2-same-grid">${sameHtml}</div>
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
        <a href="/" class="v2-same-card">
          <span class="v2-same-icon">📷</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossProfile)}</div><div class="v2-same-size">${escapeHtml(v2.crossProfileSub)}</div></div>
        </a>
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
  };

  const pageScript = `
(function(){
  var CFG = ${JSON.stringify(v2ClientCfg)};
  var T = CFG.t;
  // 의자잡기는 업로드 시점(서버 precheck가 워밍 발화) — 진입 워밍은 구경 트래픽에 ₩12/건 낭비라 제거
  // (2026-07-07 작가님: 사전분석+티어 선택 시간이 부팅 30s를 자연 은폐 — 체감 불가)
  var dropzone = document.getElementById('v2-dropzone');
  var fileInput = document.getElementById('v2-file-input');
  var errorMsg = document.getElementById('v2-error');
  var phaseUpload = document.getElementById('v2-phase-upload');
  var phaseCheck = document.getElementById('v2-phase-check');
  var phaseFit = document.getElementById('v2-phase-fit');
  var phasePay = document.getElementById('v2-phase-pay');
  var phaseGen = document.getElementById('v2-phase-generating');
  var phaseResult = document.getElementById('v2-phase-result');
  var genTextEl = document.getElementById('v2-gen-text');
  var genSubEl = document.getElementById('v2-gen-sub');
  var uploadedBase64 = null;
  var payBusy = false;
  var pollTimer = null;
  // 결제 상태: token = generate용 paymentToken, remaining = 남은 재생성(null=미확정), consumed = 다운로드로 최종 소모됨
  var pay = { orderId: null, token: null, remaining: null, consumed: false };

  if(!dropzone) return;

  /* ─── GA4 퍼널 계측 (v1 idphoto-kr 파라미터 구조 준용) ───
     - typeof gtag 가드 + 페이지 로드당 1회 발화 가드(generate_click은 재생성 포함 매회)
     - paymentToken 등 인증 토큰·시크릿은 이벤트 파라미터에 절대 미포함 (transaction_id = orderId) */
  var gaFired = {};
  var GA_PAY = CFG.market === 'kr'
    ? { payment_provider: 'toss', currency: 'KRW', value: 2000 }
    : { payment_provider: 'lemon', currency: 'USD', value: 1.99 };
  function gaTrack(name, params, repeat){
    if(typeof gtag !== 'function') return;
    if(!repeat && gaFired[name]) return;
    gaFired[name] = true;
    var p = { spec_type: CFG.slug, auth_method: '', lang: document.documentElement.lang || 'ko', service: 'specs-v2', market: CFG.market };
    if(params){ for(var k in params){ if(Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k]; } }
    gtag('event', name, p);
  }
  // 결제 이벤트는 페이지 로드가 아닌 주문(orderId) 단위 1회 가드 — 같은 페이지에서
  // 2번째 실결제(다운로드 소모 후 다시 만들기 / GENERATE_LIMIT 후 재결제, 레몬 팝업 경로)가
  // 리로드 없이 발생하므로 이벤트명 가드만으로는 실매출 purchase가 소실된다.
  var gaOrderFired = {};
  function gaTrackOrder(name, orderId, params){
    var key = name + ':' + orderId;
    if(gaOrderFired[key]) return;
    gaOrderFired[key] = true;
    gaTrack(name, params, true);
  }
  function gaTrackPurchase(orderId){
    gaTrackOrder('purchase', orderId, { transaction_id: orderId, payment_provider: GA_PAY.payment_provider, currency: GA_PAY.currency, value: GA_PAY.value });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ gaTrack('spec_select'); });
  } else {
    gaTrack('spec_select');
  }

  var GEN_TEXT_DEFAULT = genTextEl ? genTextEl.textContent : '';
  var GEN_SUB_DEFAULT = genSubEl ? genSubEl.textContent : '';
  var ORDER_KEY = 'monkos_specs_order';
  var IMG_KEY = 'monkos_specs_img';

  function showPhase(phase){
    [phaseUpload, phaseCheck, phaseFit, phasePay, phaseGen, phaseResult].forEach(function(p){ if(p) p.style.display='none'; });
    if(phase) phase.style.display='';
  }
  function setGenMessage(text, sub){
    if(genTextEl) genTextEl.textContent = text;
    if(genSubEl) genSubEl.textContent = sub || '';
  }
  function showError(msg){ errorMsg.textContent = msg; errorMsg.classList.add('show'); }
  function hideError(){ errorMsg.classList.remove('show'); }
  function returnBase(){ return location.origin + location.pathname; }
  function hasUsableToken(){ return !!(pay.token && !pay.consumed && (pay.remaining === null || pay.remaining > 0)); }

  /* ─── 리다이렉트 생존 저장소 (sessionStorage) ─── */
  function persistOrder(){
    try{ sessionStorage.setItem(ORDER_KEY, JSON.stringify({ orderId: pay.orderId, token: pay.token, remaining: pay.remaining, slug: CFG.slug, ts: Date.now() })); }catch(e){}
  }
  function loadOrder(){
    try{
      var d = JSON.parse(sessionStorage.getItem(ORDER_KEY) || 'null');
      return (d && d.slug === CFG.slug) ? d : null;
    }catch(e){ return null; }
  }
  function clearStored(){
    try{ sessionStorage.removeItem(ORDER_KEY); sessionStorage.removeItem(IMG_KEY); }catch(e){}
  }
  // 10MB 원본 base64는 sessionStorage 쿼터(~5MB) 초과 — 저장 전 리사이즈·JPEG 재압축 필수
  function compressImage(dataUrl, cb){
    try{
      var img = new Image();
      img.onload = function(){
        try{
          var max = 1536;
          var w = img.naturalWidth, h = img.naturalHeight;
          var scale = Math.min(1, max / Math.max(w, h));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          cb(canvas.toDataURL('image/jpeg', 0.85));
        }catch(e){ cb(null); }
      };
      img.onerror = function(){ cb(null); };
      img.src = dataUrl;
    }catch(e){ cb(null); }
  }
  function persistImage(cb){
    if(!uploadedBase64) return cb();
    compressImage(uploadedBase64, function(small){
      try{ sessionStorage.setItem(IMG_KEY, small || uploadedBase64); }catch(e){
        // 저장 실패(HEIC 디코드 불가 + 쿼터 초과 등) — 결제는 진행하고 복귀 시 재업로드 안내(imgLost)
        try{ sessionStorage.removeItem(IMG_KEY); }catch(e2){}
      }
      cb();
    });
  }
  function loadImage(){ try{ return sessionStorage.getItem(IMG_KEY); }catch(e){ return null; } }

  /* ─── Upload handlers ─── */
  dropzone.querySelector('.v2-upload-btn').addEventListener('click', function(e){ e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', function(){ fileInput.click(); });
  dropzone.addEventListener('dragover', function(e){ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', function(){ dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop', function(e){
    e.preventDefault(); dropzone.classList.remove('dragover');
    if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function(){ if(fileInput.files.length) handleFile(fileInput.files[0]); });

  function handleFile(file){
    hideError();
    fitResult = null; precheckData = null;
    if(!file.type.match(/image\\/(jpeg|png|heic|heif|webp)/i)) return showError(T.errFileType);
    if(file.size > 10*1024*1024) return showError(T.errFileSize);
    var reader = new FileReader();
    reader.onload = function(ev){
      uploadedBase64 = ev.target.result;
      document.getElementById('v2-check-img').src = uploadedBase64;
      showPhase(phaseCheck);
      gaTrack('photo_upload');

      var checklistItems = document.getElementById('v2-checklist-items');
      var checkLoading = document.getElementById('v2-loading');
      var summary = document.getElementById('v2-summary');
      var checkActions = document.getElementById('v2-check-actions');
      checklistItems.innerHTML = '';
      summary.innerHTML = '';
      summary.className = 'v2-checklist-summary';
      checkActions.style.display = 'none';
      checkLoading.style.display = 'flex';

      fetch('/api/idphoto/precheck', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ image: uploadedBase64 })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        checkLoading.style.display = 'none';
        if(data && (typeof data.measurable !== 'undefined' || data.checks)){
          precheckData = data;
          // 규정 8항목은 결과 화면에서 사후 표시 (ORDER_20260707 Task 1: 사전=측정성만)
          if(data.measurable === false){
            var reasons = {
              no_face: '얼굴을 찾지 못했어요. 정면 얼굴이 나온 사진을 올려주세요.',
              multiple_faces: '사진에 여러 명이 있어요. 1인 사진을 올려주세요.',
              face_too_small: '얼굴이 너무 작아요. 가슴 위까지 나오게 찍어주세요.',
              face_too_close: '너무 가까워요. 조금 멀리서 찍어주세요.',
              head_cropped: '머리 위가 잘렸어요. 머리 전체가 나오게 찍어주세요.',
              crown_cropped: '정수리가 잘렸어요. 머리 전체가 나오게 찍어주세요.',
              chin_cropped: '턱 아래가 잘렸어요. 어깨가 보이게 찍어주세요.',
              off_center: '얼굴이 한쪽으로 치우쳐 있어요. 중앙에서 찍어주세요.',
              too_dark: '사진이 너무 어두워요. 밝은 곳에서 찍어주세요.',
              too_bright: '사진이 너무 밝아요. 직사광선을 피해주세요.',
              head_tilted: '고개가 기울어져 있어요. 고개를 바로 세우고 찍어주세요.',
              not_frontal: '옆모습이에요. 정면을 바라보고 찍어주세요.',
              uneven_lighting: '얼굴에 그림자가 져 있어요. 균일한 조명에서 찍어주세요.',
              occluded: '얼굴이 가려져 있어요. 가림 없는 사진을 올려주세요.'
            };
            summary.className = 'v2-checklist-summary v2-summary-fail';
            summary.textContent = reasons[data.rejectionReason] || '이 사진으로는 정밀 측정이 어려워요. 다른 사진을 올려주세요.';
            document.getElementById('v2-btn-proceed').style.display = 'none';
            checkActions.style.display = 'flex';
          } else {
            runFit();
          }
          // 이미지 저장을 검수 시점에 선행 — 결제 클릭 체인에서 캔버스 압축을 제거해
          // 토스 결제창의 user activation 만료(팝업 차단)를 방지 (2026-07-05 E2E 실패 수정)
          persistImage(function(){});
        } else {
          showError(data.code === 'RATE_LIMITED' ? T.rateLimited : (data.error || T.errCheck));
          showPhase(phaseUpload);
        }
      })
      .catch(function(e){ console.error('[precheck-catch]', e); showError(T.errCheckNet + (e ? ' (' + (e.message||e) + ')' : '')); showPhase(phaseUpload); });
    };
    reader.readAsDataURL(file);
  }

  /* ─── Check phase actions ─── */
  document.getElementById('v2-btn-change').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });
  var fitResult = null, precheckData = null;

  function proceedToPay(){
    document.getElementById('v2-preview-img').src = uploadedBase64;
    // 이미 결제된 토큰(재생성 잔여)이 있으면 재결제 없이 바로 생성
    if(hasUsableToken()) return doGenerate();
    showPhase(phasePay);
  }

  /* ─── 규격 안착 시어터 (2026-07-07 작가님 연출 비전) ───
     줌인 → 가이드 라인 순차 진입 → 전문가(비전) 미세 보정 트윈 → 정본 신호등 판정 */
  var SIGCOL = { pass:'#00B894', warn:'#FDCB6E', fail:'#E17055' };
  var fitTimers = [];
  function fitClearTimers(){ fitTimers.forEach(clearTimeout); fitTimers = []; }
  function fitAfter(ms, fn){ fitTimers.push(setTimeout(fn, ms)); }

  function runFit(){
    showPhase(phaseFit);
    fitClearTimers();
    var stage = document.getElementById('v2-fit-stage');
    // 스테이지 크기 = 진입 시점(빈 박스) 1회 고정 — 규격비 반영, 폭 240 유지.
    // 연출 중 크기 변경 금지 (2026-07-09 작가님: 비율 전환은 이해 가능, 박스가 툭 커지는 것은 불필요)
    var stW0 = Math.min(240, (stage.parentElement.clientWidth || 280) - 20);
    var stH0 = Math.round(stW0 * (CFG.frameRatio || 4 / 3));
    stage.style.width = stW0 + 'px'; stage.style.height = stH0 + 'px';
    var img = document.getElementById('v2-fit-img');
    var badges = document.getElementById('v2-fit-badges');
    var noteEl = document.getElementById('v2-fit-note');
    var fs = document.getElementById('v2-fit-summary');
    var fa = document.getElementById('v2-fit-actions');
    badges.style.display = 'none'; badges.innerHTML = '';
    noteEl.style.display = 'none';
    fs.textContent = ''; fs.className = 'v2-checklist-summary';
    fa.style.display = 'none';
    ['hair','crown','eye','chin'].forEach(function(k){
      document.getElementById('v2-fit-line-' + k).style.opacity = '0';
    });
    var fEl0 = document.getElementById('v2-fit-frame');
    fEl0.style.display = 'none'; fEl0.style.opacity = '0';
    document.getElementById('v2-fit-dim-top').style.height = '0';
    document.getElementById('v2-fit-dim-bot').style.height = '0';
    // 분석 대기 연출 — 정지 화면 금지 (2026-07-07 작가님: 수 초 정지 = 뻗은 것처럼 보임)
    if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
    (function(){
      var texts = ['얼굴 위치 분석 중', '랜드마크 정밀 측정 중', '규격 계산 중', '전문가 검수 중'];
      var dots = 0, ti = 0;
      window.__fitWaitTimer = setInterval(function(){
        dots = (dots + 1) % 4;
        if(dots === 0) ti = (ti + 1) % texts.length;
        var el = document.getElementById('v2-fit-status');
        if(el) el.textContent = texts[ti] + '.'.repeat(dots + 1);
        var sc = document.getElementById('v2-fit-scan');
        if(sc){ var t = (Date.now() / 12) % ((parseInt(stage.style.height) || 320) + 40) - 20; sc.style.top = t + 'px'; }
      }, 420);
    })();
    var scan = document.getElementById('v2-fit-scan');
    if(!scan){
      scan = document.createElement('div');
      scan.id = 'v2-fit-scan';
      scan.style.cssText = 'position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#00B894 40%,#00B894 60%,transparent);box-shadow:0 0 12px #00B894;opacity:.85;pointer-events:none;';
      stage.appendChild(scan);
    }
    scan.style.display = 'block';
    var world0 = document.getElementById('v2-fit-world');
    world0.style.transition = 'none';
    world0.style.transform = 'scale(1)';
    img.onload = function(){
      // fetch 응답 전에도 전체 사진(contain)부터 — 빈 구석에서 시작하지 않는다 (2026-07-07 작가님 교정)
      var W0 = img.naturalWidth, H0 = img.naturalHeight;
      if(!W0 || !H0) return;
      var stW = parseInt(stage.style.width) || 240, stH = parseInt(stage.style.height) || 320;
      world0.style.width = W0 + 'px'; world0.style.height = H0 + 'px';
      img.style.width = W0 + 'px'; img.style.height = 'auto';
      var sc = Math.min(stW / W0, stH / H0);
      world0.style.transform = 'translate(' + ((stW - W0 * sc) / 2) + 'px,' + ((stH - H0 * sc) / 2) + 'px) scale(' + sc + ')';
    };
    img.src = uploadedBase64;
    if(img.complete) img.onload();

    fetch('/api/idphoto/fit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ image: uploadedBase64, slug: CFG.slug, faceBox: precheckData && precheckData.faceBox })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data || !data.success){
        if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
        fitResult = null;
        if(data && data.code === 'FIT_SANITY'){
          showError('이 사진은 정밀 측정이 어려워요. 정면 얼굴이 크게 나온 사진으로 다시 시도해주세요.');
          showPhase(phaseUpload);
          return;
        }
        proceedToPay(); return; // 카나리 밖(NOT_AVAILABLE) → 기존 경로
      }
      fitResult = data;
      if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
      var sc = document.getElementById('v2-fit-scan'); if(sc) sc.style.display = 'none';
      playFitTheater(data);
    })
    .catch(function(){ if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer); fitResult = null; proceedToPay(); });
  }

  function playFitTheater(d){
    // IDPASS 원칙 (2026-07-07 작가님 교정): 사진이 우선 — 원본 비율·포인트는 절대 불변.
    // 사진+라인+프레임을 월드(강체)로 묶고, 카메라(균일 scale transform)만 프레임으로 다가간다.
    var stage = document.getElementById('v2-fit-stage');
    var world = document.getElementById('v2-fit-world');
    var img = document.getElementById('v2-fit-img');
    var statusEl = document.getElementById('v2-fit-status');
    // 크기 재설정 금지 — runFit 진입 시점에 고정된 값을 읽는다 (연출 중 박스 스냅 = 컨테이너 흔들림의 원인이었음).
    // CFG.frameRatio 부재 등으로 비율이 어긋난 경우에만 높이 보정 (폭은 불변).
    var stageW = parseInt(stage.style.width) || 240;
    var stageH = parseInt(stage.style.height) || 320;
    var specH = Math.round(stageW * d.spec.frameH / d.spec.frameW);
    if (Math.abs(specH - stageH) > 2) { stageH = specH; stage.style.height = stageH + 'px'; }
    var W = d.imageSize.width, H = d.imageSize.height;

    // 월드 = 사진 원본 좌표계 그대로 (px 단위 1:1)
    world.style.width = W + 'px'; world.style.height = H + 'px';
    img.style.width = W + 'px'; img.style.height = 'auto';

    function camera(f){ // 프레임 f가 스테이지를 가득 채우도록 월드를 균일 스케일 이동
      var sc = stageW / f.w;
      return 'translate(' + (-f.x * sc) + 'px,' + (-f.y * sc) + 'px) scale(' + sc + ')';
    }
    function containCam(){ // 사진 전체가 보이는 카메라
      var sc = Math.min(stageW / W, stageH / H);
      var tx = (stageW - W * sc) / 2, ty = (stageH - H * sc) / 2;
      return 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')';
    }
    function setStatus(t){ statusEl.textContent = t; }

    // 라인·프레임을 사진 좌표에 고정 배치 (이후 절대 안 움직임 — 월드만 움직인다)
    var lineDefs = [
      ['v2-fit-line-eye',   d.lines.eyeY,     '눈높이 확인'],
      ['v2-fit-line-chin',  d.lines.chinY,    '턱 라인 확인'],
      ['v2-fit-line-crown', d.lines.crownY,   '정수리 산정 — 1:1 해부학 앵커'],
      ['v2-fit-line-hair',  d.lines.hairTopY, '헤어 여백 검토'],
    ];
    lineDefs.forEach(function(item){
      var el = document.getElementById(item[0]);
      el.style.cssText += ';position:absolute;left:0;width:' + W + 'px;top:' + item[1] + 'px;opacity:0;transition:opacity .5s;pointer-events:none;';
    });
    var frame0 = d.frameInitial || d.frame;
    var fEl = document.getElementById('v2-fit-frame');
    fEl.style.display = 'block'; fEl.style.opacity = '0';
    fEl.style.left = frame0.x + 'px'; fEl.style.top = frame0.y + 'px';
    fEl.style.width = frame0.w + 'px'; fEl.style.height = frame0.h + 'px';

    // 0) 전체 사진에서 시작 — 원본 그대로 보여준다
    world.style.transition = 'none';
    world.style.transform = containCam();
    void world.offsetWidth;
    world.style.transition = 'transform 1.3s cubic-bezier(.22,.9,.24,1)';
    setStatus('얼굴 위치 분석 중');

    // 1) 가이드 라인이 사진 위에 순차 진입 (사진은 그대로)
    var t = 500;
    lineDefs.forEach(function(item, i){
      fitAfter(t + i * 480, function(){
        setStatus(item[2]);
        document.getElementById(item[0]).style.opacity = '1';
      });
    });
    t += lineDefs.length * 480 + 300;

    // 2) 규격 프레임이 사진 위로 나타남
    fitAfter(t, function(){ setStatus('규격 프레임 정렬'); fEl.style.opacity = '1'; });
    t += 700;

    // 3) 전문가(비전) 보정 — 프레임"만" 이동 (사진 불변)
    var moved = d.frameInitial && (Math.abs(d.frame.y - d.frameInitial.y) > 1 || Math.abs(d.frame.h - d.frameInitial.h) > 1);
    if(moved){
      fitAfter(t, function(){
        setStatus(d.vision && d.vision.executed ? '전문가 보정 실행 — 헤어 여백 확보' : '전문가 보정 — 여백 균형');
        fEl.style.top = d.frame.y + 'px';
        fEl.style.left = d.frame.x + 'px';
        fEl.style.width = d.frame.w + 'px';
        fEl.style.height = d.frame.h + 'px';
      });
      t += 1050;
    }

    // 4) 카메라가 프레임으로 자연스럽게 다가감 (균일 줌 — 왜곡 불가)
    fitAfter(t, function(){
      setStatus('규격에 맞춰 안착 중');
      world.style.transform = camera(d.frame);
    });
    t += 1400;

    // 5) 딤 + 신호등 판정
    fitAfter(t, function(){
      var scF = stageW / d.frame.w;
      var crownTop = (d.lines.crownY - d.frame.y) * scF;
      var chinTop = (d.lines.chinY - d.frame.y) * scF;
      document.getElementById('v2-fit-dim-top').style.height = Math.max(0, crownTop) + 'px';
      document.getElementById('v2-fit-dim-bot').style.height = Math.max(0, stageH - chinTop) + 'px';
      setStatus('');
      renderFitVerdict(d);
    });
  }

  function renderFitVerdict(d){
    var b = document.getElementById('v2-fit-badges');
    b.innerHTML = ''; b.style.display = 'flex';
    function badge(label, val, sig){
      var el = document.createElement('div');
      var c = SIGCOL[sig] || '#888';
      el.style.cssText = 'padding:5px 10px;border-radius:8px;font-size:12.5px;font-weight:600;background:' + c + '22;color:' + c + ';';
      el.textContent = label + ' ' + val;
      b.appendChild(el);
    }
    var m = d.metrics || {}, j = d.judge || {};
    if(m.faceMm != null) badge('얼굴', m.faceMm + 'mm', j.face);
    if(m.eyeRatio != null) badge('눈', (m.eyeRatio * 100).toFixed(0) + '%', j.eye);
    if(m.topMm != null) badge('상단', m.topMm + 'mm', j.top);
    if(m.bottomMm != null) badge('하단', m.bottomMm + 'mm', j.bottom);
    if(d.poseCheck){
      if(d.poseCheck.roll) badge('기울기', Math.abs(d.poseCheck.roll.value).toFixed(0) + '°', d.poseCheck.roll.ok ? 'pass' : 'fail');
      if(d.poseCheck.eyeOpen && !d.poseCheck.eyeOpen.ok) badge('눈', '감김', 'fail');
      if(d.poseCheck.mouthOpen && !d.poseCheck.mouthOpen.ok) badge('입', '벌림', 'warn');
    }
    var expertMsg = (d.vision && d.vision.executed) || (d.vision && d.vision.note);
    if(expertMsg){
      var n = document.getElementById('v2-fit-note');
      n.style.display = 'block';
      n.textContent = expertMsg;
    }
    var fs = document.getElementById('v2-fit-summary');
    var mk = document.getElementById('v2-fit-make');
    if(j.blocked){
      fs.className = 'v2-checklist-summary v2-summary-fail';
      fs.textContent = '규격 허용 범위를 벗어났습니다. 다른 사진을 권장해요.';
      mk.disabled = true; mk.style.opacity = '.4';
    } else {
      fs.className = 'v2-checklist-summary v2-summary-pass';
      fs.textContent = '규격에 안착했습니다. 이대로 만들 수 있어요.';
      mk.disabled = false; mk.style.opacity = '';
    }
    document.getElementById('v2-fit-actions').style.display = 'flex';
  }

  document.getElementById('v2-fit-change').addEventListener('click', function(){
    uploadedBase64 = null; fitResult = null; precheckData = null;
    showPhase(phaseUpload);
  });
  document.getElementById('v2-fit-make').addEventListener('click', function(){ proceedToPay(); });

  document.getElementById('v2-btn-proceed').addEventListener('click', function(){ runFit(); });

  /* ─── Pay phase ─── */
  document.getElementById('v2-change-photo').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });

  document.getElementById('v2-pay-instant').addEventListener('click', function(){
    if(!uploadedBase64 || payBusy) return;
    // 결제 완료 토큰 보유 시 이중 결제 방지 — 바로 생성
    if(hasUsableToken()) return doGenerate();
    hideError();
    payBusy = true;
    var initBody = { slug: CFG.slug, market: CFG.market };
    if(CFG.market !== 'kr') initBody.redirectUrl = returnBase() + '?lemon=return';
    // 팝업 차단 회피: 클릭 제스처 안에서 창을 먼저 열고 init 후 주소 지정 (레몬 경로)
    var lemonWin = null;
    if(CFG.market !== 'kr'){
      try{ lemonWin = window.open('', '_blank'); }catch(e){}
    }
    fetch('/api/payments/direct/init', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(initBody)
    })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }); })
    .then(function(res){
      if(!res.ok){
        payBusy = false;
        if(lemonWin){ try{ lemonWin.close(); }catch(e){} }
        if(res.status === 503) showError(T.payUnavailable);
        else if(res.status === 429) showError(T.rateLimited);
        else showError((res.d && res.d.error) || T.payInitFail);
        return;
      }
      var d = res.d;
      pay.orderId = d.orderId; pay.token = null; pay.remaining = null; pay.consumed = false;
      // orderId 확보 후 주문 단위 1회 발화 — 에러 후 재클릭 중복 방지 + purchase와 쌍 정합
      gaTrackOrder('begin_checkout', d.orderId, { payment_provider: GA_PAY.payment_provider, currency: GA_PAY.currency, value: GA_PAY.value });
      persistOrder();
      // 이미지 저장은 검수 통과 시점에 선행 완료 — 여기서 캔버스 압축을 돌리면
      // user activation이 만료돼 토스 결제창이 팝업 차단됨 (2026-07-05 E2E 실패 원인)
      if(d.provider === 'toss') startToss(d, lemonWin);
      else startLemon(d, lemonWin);
    })
    .catch(function(){
      payBusy = false;
      if(lemonWin){ try{ lemonWin.close(); }catch(e){} }
      showError(T.errNet);
    });
  });

  // 토스 결제위젯 방식 (2026-07-05 전환) — 상점 라이브 계약이 위젯 연동(live_gck)에만 있음.
  // 구 결제창(payment/live_ck) 방식은 API 개별연동 MID 계약 미완료로 라이브 결제 불가 (2026-03 위젯 전환 이력).
  var tossWidgets = null, tossWidgetRendered = false;
  function startToss(d, extraWin){
    if(extraWin){ try{ extraWin.close(); }catch(e){} }
    if(!window.TossPayments){ payBusy = false; showError(T.payInitFail); return; }
    var wrap = document.getElementById('v2-toss-widget');
    var btn = document.getElementById('v2-pay-confirm');
    try{
      if(!tossWidgets){
        tossWidgets = window.TossPayments(d.clientKey).widgets({ customerKey: window.TossPayments.ANONYMOUS });
      }
      btn.textContent = '₩' + String(d.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' 결제하기';
      wrap.style.display = 'block';
      tossWidgets.setAmount({ currency: d.currency || 'KRW', value: d.amount })
        .then(function(){
          if(tossWidgetRendered) return;
          return tossWidgets.renderPaymentMethods({ selector: '#v2-pm' })
            .then(function(){ return tossWidgets.renderAgreement({ selector: '#v2-agree' }); })
            .then(function(){ tossWidgetRendered = true; });
        })
        .then(function(){
          payBusy = false;
          wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        })
        .catch(function(e){
          payBusy = false; wrap.style.display = 'none';
          showError((e && e.message) || T.payInitFail);
        });
      btn.onclick = function(){
        var base = returnBase();
        tossWidgets.requestPayment({
          orderId: d.orderId,
          orderName: d.orderName,
          successUrl: base + '?toss=direct',
          failUrl: base + '?toss=fail'
        }).catch(function(err){
          showError(err && err.code === 'USER_CANCEL' ? T.payCancelled : ((err && err.message) || T.payInitFail));
        });
      };
    }catch(e){ payBusy = false; showError(T.payInitFail); }
  }

  function startLemon(d, lemonWin){
    showPhase(phaseGen);
    setGenMessage(T.payWaiting, T.payWaitingHint);
    if(lemonWin && !lemonWin.closed){
      try{ lemonWin.location = d.checkoutUrl; }catch(e){ lemonWin = null; }
    } else { lemonWin = null; }
    if(!lemonWin){
      // 팝업 불가 — 같은 탭 리다이렉트 (상태는 sessionStorage에 보존, redirectUrl로 복귀)
      location.href = d.checkoutUrl;
      return;
    }
    startPolling(d.orderId);
  }

  function stopPolling(){ if(pollTimer){ clearInterval(pollTimer); pollTimer = null; } }

  function startPolling(orderId){
    stopPolling();
    var tries = 0;
    pollTimer = setInterval(function(){
      tries++;
      if(tries > 240){ // 2.5초 × 240 = 10분
        stopPolling(); payBusy = false;
        showError(T.payTimeout);
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
        return;
      }
      fetch('/api/payments/direct/status?orderId=' + encodeURIComponent(orderId))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d.status === 'paid' && d.paymentToken){
          stopPolling(); payBusy = false;
          pay.orderId = orderId; pay.token = d.paymentToken; pay.remaining = null; pay.consumed = false;
          persistOrder();
          gaTrackPurchase(orderId);
          if(uploadedBase64) doGenerate(); else needReupload();
        } else if(d.status === 'failed' || d.status === 'amount_mismatch' || d.status === 'refunded'){
          stopPolling(); payBusy = false;
          showError(T.payFailed);
          showPhase(uploadedBase64 ? phasePay : phaseUpload);
        }
      })
      .catch(function(){});
    }, 2500);
  }

  // 결제는 확인됐지만 이미지가 유실된 경우(리다이렉트 생존 실패) — 재업로드 후 무결제 생성
  function needReupload(){
    showPhase(phaseUpload);
    showError(T.imgLost);
  }

  /* ─── 사후 검수 체크리스트 (ORDER_20260707 Task 4 — 규정 8항목 사후 이동 + 수치 검수) ─── */
  function renderResultChecklist(data){
    var ul = document.getElementById('v2-result-checklist');
    if(!ul) return;
    ul.innerHTML = '';
    var hardFail = false;
    function add(label, state, msg){
      var li = document.createElement('li');
      var icon = document.createElement('span');
      icon.className = 'v2-check-icon ' + (state === 'pass' ? 'v2-check-pass' : state === 'warn' ? 'v2-check-warn' : 'v2-check-fail');
      icon.textContent = state === 'pass' ? '\u2713' : state === 'warn' ? '!' : '\u2717';
      li.appendChild(icon);
      li.appendChild(document.createTextNode(label));
      if(msg){ var wm = document.createElement('div'); wm.className = 'v2-check-warn-msg'; wm.textContent = msg; li.appendChild(wm); }
      ul.appendChild(li);
      if(state === 'fail') hardFail = true;
    }
    var m = data.meta || {};
    var sp = fitResult && fitResult.spec;
    if(m.faceMM){
      var face = parseFloat(m.faceMM);
      if(sp && sp.headHeightMin && sp.headHeightMax){
        var okF = face >= sp.headHeightMin && face <= sp.headHeightMax;
        add('머리 높이 ' + m.faceMM + 'mm (허용 ' + sp.headHeightMin + '~' + sp.headHeightMax + 'mm)', okF ? 'pass' : 'fail', okF ? null : '허용 범위를 벗어났습니다. 다른 사진을 권장해요.');
      } else add('머리 높이 ' + m.faceMM + 'mm', 'pass');
      if(m.eyePositionPercent){ var e = parseFloat(m.eyePositionPercent); add('눈 위치 ' + m.eyePositionPercent + '%', (e >= 33 && e <= 58) ? 'pass' : 'warn'); }
      if(m.crownMarginMM){ var c = parseFloat(m.crownMarginMM); add('정수리 여백 ' + m.crownMarginMM + 'mm', c >= 0.5 ? 'pass' : 'fail', c >= 0.5 ? null : '정수리가 프레임 상단에 닿습니다.'); }
    }
    add('배경', data.track === 'birefnet' ? 'pass' : 'warn', data.track === 'birefnet' ? null : 'AI 재구성 배경으로 생성되었습니다.');
    add('해상도 · 300DPI', 'pass');
    if(precheckData && precheckData.checks){
      precheckData.checks.forEach(function(c){ add(c.label, c.pass ? 'pass' : c.warn ? 'warn' : 'fail', c.warnMsg || null); });
    }
    var dl = document.getElementById('v2-download');
    if(hardFail){ dl.disabled = true; dl.style.opacity = '0.4'; dl.title = '검수 미통과 항목이 있습니다'; }
    else { dl.disabled = false; dl.style.opacity = ''; dl.title = ''; }
  }

  /* ─── 생성 (결제 토큰 경유) ─── */
  var genBusy = false; // 중복 제출 잠금 — 더블클릭 이중 차감 실사고 (2026-07-07 13:48, 200ms 간격 2건)
  function doGenerate(){
    if(genBusy) return;
    genBusy = true;
    hideError();
    payBusy = false;
    gaTrack('generate_click', null, true); // 재생성 포함 매회 발화
    showPhase(phaseGen);
    setGenMessage(GEN_TEXT_DEFAULT, GEN_SUB_DEFAULT);
    // 연출: 실제 파이프라인 단계를 순환 표기 (재단→매팅→검수) — 대기가 신뢰가 되게
    if(window.__genStageTimer) clearInterval(window.__genStageTimer);
    (function(){
      var stages = fitResult ? ['확정 프레임으로 원본 재단 중', '배경 분리 중 — 원본 픽셀 보존', '정밀 검수 중'] : [GEN_TEXT_DEFAULT];
      var i = 0;
      window.__genStageTimer = setInterval(function(){
        i = (i + 1) % stages.length;
        setGenMessage(stages[i], GEN_SUB_DEFAULT);
      }, 3500);
    })();
    var body = { image: uploadedBase64, format: CFG.format, gender: 'm', age: 'adult', slug: CFG.slug };
    if(fitResult && fitResult.frame){ body.fitFrame = fitResult.frame; body.fitMeta = fitResult.meta; body.fitMetrics = fitResult.metrics; }
    if(pay.token) body.paymentToken = pay.token;
    fetch('/api/idphoto/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
    .then(function(res){
      genBusy = false;
      var data = res.d;
      if(window.__genStageTimer) clearInterval(window.__genStageTimer);
      if(data.image){
        if(typeof data.remainingGenerates === 'number'){ pay.remaining = data.remainingGenerates; persistOrder(); }
        document.getElementById('v2-result-before-img').src = uploadedBase64;
        var afterImg = document.getElementById('v2-result-after-img');
        afterImg.src = 'data:image/png;base64,' + data.image;
        // 누끼 체험: 배경이 위→아래로 벗겨지듯 결과가 드러남 (birefnet 트랙 = 원본 픽셀 보존)
        if(data.track === 'birefnet'){
          afterImg.style.transition = 'none';
          afterImg.style.clipPath = 'inset(0 0 100% 0)';
          requestAnimationFrame(function(){ requestAnimationFrame(function(){
            afterImg.style.transition = 'clip-path 1.3s cubic-bezier(.22,.9,.24,1)';
            afterImg.style.clipPath = 'inset(0 0 0 0)';
          }); });
        } else { afterImg.style.clipPath = ''; afterImg.style.transition = ''; }
        renderResultChecklist(data);
        showPhase(phaseResult);
        gaTrack('preview_view');
      } else {
        var code = data.code || '';
        var msg = code === 'TOKEN_EXPIRED' ? T.tokenExpired
          : code === 'TOKEN_USED' ? T.tokenUsed
          : code === 'INVALID_TOKEN' ? T.tokenInvalid
          : code === 'GENERATE_LIMIT' ? T.genLimit
          : code === 'RATE_LIMITED' ? T.rateLimited
          : (data.error || T.errGen);
        if(code === 'TOKEN_EXPIRED' || code === 'TOKEN_USED' || code === 'INVALID_TOKEN'){
          pay.token = null; pay.remaining = null; clearStored();
        } else if(code === 'GENERATE_LIMIT'){
          pay.remaining = 0; persistOrder();
        }
        showError(msg);
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
      }
    })
    .catch(function(){ if(window.__genStageTimer) clearInterval(window.__genStageTimer); genBusy = false; showError(T.errNet); showPhase(uploadedBase64 ? phasePay : phaseUpload); });
  }

  var payCreditBtn = document.getElementById('v2-pay-credit');
  if(payCreditBtn){
    payCreditBtn.addEventListener('click', function(){
      // 크레딧 경로 (6/24 임시 /headshot 리다이렉트 교체, 2026-07-05 작가님):
      // 로그인+잔액 10c↑ → 이 페이지에서 바로 생성(서버 세션 크레딧 차감).
      // 비로그인/부족 → 이미지 보존 후 충전 페이지(로그인·신규 10c·충전 → returnUrl 복귀).
      if(!uploadedBase64 || payBusy) return;
      hideError();
      var toCharge = function(){
        persistImage(function(){
          window.location.href = '/credits.html?from=' + encodeURIComponent(location.pathname + '?credits=return');
        });
      };
      fetch('/api/credits', { credentials: 'same-origin' })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          if(d && typeof d.credits === 'number' && d.credits >= 10) doGenerate();
          else toCharge();
        })
        .catch(toCharge);
    });
  }

  /* ─── Result phase ─── */
  document.getElementById('v2-download').addEventListener('click', function(){
    var img = document.getElementById('v2-result-after-img');
    if(!img.src) return;
    function trigger(){
      var a = document.createElement('a');
      a.href = img.src; a.download = CFG.downloadName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    // 결제 토큰 경로: 다운로드 직전 1회성 최종 소모 API 호출 성공 후 실제 다운로드 (서버 계약 5번)
    if(!pay.token || pay.consumed) return trigger();
    fetch('/api/download/direct?token=' + encodeURIComponent(pay.token))
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }).catch(function(){ return { ok: r.ok, status: r.status, d: {} }; }); })
    .then(function(res){
      if(res.ok && res.d && res.d.success){
        pay.consumed = true; clearStored(); trigger();
      } else if(res.status === 409){
        // 이미 소모된 토큰 — 화면에 있는 이미지는 그대로 제공
        pay.consumed = true; trigger();
      } else {
        showError(T.downloadFail);
      }
    })
    .catch(function(){ showError(T.downloadFail); });
  });

  document.getElementById('v2-btn-retry2').addEventListener('click', function(){
    // 토큰(재생성 잔여)은 유지 — 진행하기에서 재결제 없이 생성
    uploadedBase64 = null;
    hideError();
    showPhase(phaseUpload);
  });

  /* ─── 결제 복귀 처리 (토스 리다이렉트 / 레몬 리턴) ─── */
  (function resume(){
    var qs;
    try{ qs = new URLSearchParams(location.search); }catch(e){ return; }
    var mode = qs.get('toss') || (qs.get('lemon') ? 'lemon' : (qs.get('credits') ? 'credits' : null));
    if(!mode) return;
    var pk = qs.get('paymentKey');
    var oid = qs.get('orderId');
    var failMsg = qs.get('message');
    try{ history.replaceState(null, '', location.pathname); }catch(e){}

    var savedImg = loadImage();
    if(savedImg){
      uploadedBase64 = savedImg;
      document.getElementById('v2-check-img').src = savedImg;
      document.getElementById('v2-preview-img').src = savedImg;
    }
    var saved = loadOrder();
    if(saved){
      pay.orderId = saved.orderId;
      pay.token = saved.token || null;
      pay.remaining = (typeof saved.remaining === 'number') ? saved.remaining : null;
    }

    if(mode === 'direct' && pk && oid){
      showPhase(phaseGen);
      setGenMessage(T.payConfirming, '');
      fetch('/api/payments/toss/direct', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ paymentKey: pk, orderId: oid })
      })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })
      .then(function(res){
        if(res.ok && res.d && res.d.paymentToken){
          pay.orderId = oid; pay.token = res.d.paymentToken; pay.consumed = false;
          persistOrder();
          gaTrackPurchase(oid);
          if(uploadedBase64) doGenerate(); else needReupload();
        } else {
          showError((res.d && res.d.error) || T.payConfirmFail);
          showPhase(uploadedBase64 ? phasePay : phaseUpload);
        }
      })
      .catch(function(){ showError(T.payConfirmFail); showPhase(uploadedBase64 ? phasePay : phaseUpload); });
    } else if(mode === 'fail'){
      showError(failMsg || T.payCancelled);
      showPhase(uploadedBase64 ? phasePay : phaseUpload);
    } else if(mode === 'lemon'){
      if(pay.token){
        if(uploadedBase64) doGenerate(); else needReupload();
      } else if(saved && saved.orderId){
        showPhase(phaseGen);
        setGenMessage(T.payWaiting, T.payWaitingHint);
        startPolling(saved.orderId);
      }
    } else if(mode === 'credits'){
      // 충전 페이지 복귀 — 잔액 재확인 후 크레딧 생성, 미달이면 결제 선택 화면 유지
      if(!uploadedBase64){ needReupload(); return; }
      fetch('/api/credits', { credentials: 'same-origin' })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          if(d && typeof d.credits === 'number' && d.credits >= 10) doGenerate();
          else showPhase(phasePay);
        })
        .catch(function(){ showPhase(phasePay); });
    }
  })();
})();
`;

  return {
    title,
    description,
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_V2_STYLE,
    bodyContent,
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
  const v1OgGuideKey = GUIDE_IMAGES.has(slug) ? slug : (parseSizeMm(specData.size) || 'kr-passport');
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
      "image": v1OgImage,
      "inLanguage": lang,
      "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
      "publisher": { "@type": "Organization", "name": "Monk Studio" },
      "datePublished": "2026-03-26",
      "dateModified": "2026-05-26",
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
          const countryImg = `/images/guides/${slug}.webp`;
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
    seoMeta,
    htmlLang: lang,
    pageStyle: SPECS_PAGE_STYLE,
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
