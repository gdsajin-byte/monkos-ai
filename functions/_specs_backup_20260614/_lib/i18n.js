export const CONTINENTS = {
  asia:       { ko: '아시아',     en: 'Asia',        ja: 'アジア' },
  europe:     { ko: '유럽',       en: 'Europe',      ja: 'ヨーロッパ' },
  americas:   { ko: '아메리카',   en: 'Americas',    ja: 'アメリカ' },
  africa:     { ko: '아프리카',   en: 'Africa',      ja: 'アフリカ' },
  oceania:    { ko: '오세아니아', en: 'Oceania',     ja: 'オセアニア' },
  middleeast: { ko: '중동',       en: 'Middle East', ja: '中東' },
};

export const SPECS_I18N = {
  ko: {
    hubTitle: '증명사진 규격 가이드 — 국가별·용도별 사이즈 총정리 | IDPASS',
    hubDesc: '한국 여권·반명함, 일본 패스포트·이력서, 미국 비자 등 증명사진 규격을 한눈에. 사이즈·배경·복장 기준과 반려 사유까지.',
    hubH1: '증명사진 규격 가이드',
    hubSub: '국가별·용도별 사이즈, 배경, 복장 기준과 반려 사유까지 한눈에 확인하세요.',
    detailSuffix: '규격 — 사이즈·배경·복장 완벽 가이드 | IDPASS',
    tableHeaders: { size: '사이즈', pixels: '해상도', dpi: 'DPI', background: '배경', headHeight: '머리 높이', validity: '유효기간', fileSpec: '파일 규격' },
    detailsTitle: '상세 규정',
    rejectionTitle: '반려 사유 TOP 5',
    faqTitle: '자주 묻는 질문',
    ctaHeadline: '규격에 맞는 사진, AI가 자동으로',
    ctaSub: '배경 제거 · 규격 크롭 · 보정까지 한 번에',
    ctaAI: 'AI로 촬영하기 →',
    ctaCrop: '무료 크롭앱 →',
    relatedTitle: '관련 콘텐츠',
    sameCountryLabel: '같은 국가 다른 규격',
    specLabel: '규격 보기',
    backToHub: '← 전체 규격 목록',
    backToCountry: '← 국가 규격 목록',
    docCount: '종 규격',
    tabAll: '전체',
    oxGood: '✅ 적합한 사진',
    oxBad: '❌ 반려되는 사진',
    oxGoodCaption: '정면 · 무표정 · 흰배경',
    oxBadCaption: '기울어짐 · 그림자 · 머리카락',
  },
  ja: {
    hubTitle: '証明写真 規格ガイド — 国別・用途別サイズ総まとめ | IDPASS',
    hubDesc: '韓国パスポート・半名刺、日本パスポート・履歴書、米国ビザなど証明写真規格を一覧で。サイズ・背景・服装基準と却下理由まで。',
    hubH1: '証明写真 規格ガイド',
    hubSub: '国別・用途別のサイズ、背景、服装基準と却下理由をまとめて確認できます。',
    detailSuffix: '規格 — サイズ・背景・服装 完全ガイド | IDPASS',
    tableHeaders: { size: 'サイズ', pixels: '解像度', dpi: 'DPI', background: '背景', headHeight: '頭の高さ', validity: '有効期限', fileSpec: 'ファイル規格' },
    detailsTitle: '詳細規定',
    rejectionTitle: '却下理由 TOP 5',
    faqTitle: 'よくある質問',
    ctaHeadline: '規格に合う写真、AIが自動で',
    ctaSub: '背景除去・規格クロップ・補正まで一度に',
    ctaAI: 'AIで撮影する →',
    ctaCrop: '無料クロップアプリ →',
    relatedTitle: '関連コンテンツ',
    sameCountryLabel: '同じ国の別の規格',
    specLabel: '規格を見る',
    backToHub: '← 全規格一覧',
    backToCountry: '← 国別規格一覧',
    docCount: '種の規格',
    tabAll: 'すべて',
    oxGood: '✅ 適合写真',
    oxBad: '❌ 却下される写真',
    oxGoodCaption: '正面・無表情・白背景',
    oxBadCaption: '傾き・影・髪',
  },
  en: {
    hubTitle: 'ID Photo Specifications Guide — Size & Requirements by Country | IDPASS',
    hubDesc: 'Korea passport & resume, Japan passport & resume, US visa photo specs at a glance. Size, background, dress code and rejection reasons.',
    hubH1: 'ID Photo Specifications Guide',
    hubSub: 'Size, background, dress code standards and rejection reasons by country and purpose.',
    detailSuffix: 'Specs — Size, Background & Dress Code Complete Guide | IDPASS',
    tableHeaders: { size: 'Size', pixels: 'Resolution', dpi: 'DPI', background: 'Background', headHeight: 'Head Height', validity: 'Validity', fileSpec: 'File Spec' },
    detailsTitle: 'Detailed Requirements',
    rejectionTitle: 'Top 5 Rejection Reasons',
    faqTitle: 'Frequently Asked Questions',
    ctaHeadline: 'AI makes your photo spec-ready',
    ctaSub: 'Background removal, crop & retouch in one step',
    ctaAI: 'Take with AI →',
    ctaCrop: 'Free Crop App →',
    relatedTitle: 'Related Content',
    sameCountryLabel: 'Other specs for the same country',
    specLabel: 'View specs',
    backToHub: '← All Specifications',
    backToCountry: '← Country Specifications',
    docCount: ' specs',
    tabAll: 'All',
    oxGood: '✅ Acceptable Photo',
    oxBad: '❌ Rejected Photo',
    oxGoodCaption: 'Front-facing · Neutral · White BG',
    oxBadCaption: 'Tilted · Shadow · Hair',
  },
};

export function t(lang) {
  return SPECS_I18N[lang] || SPECS_I18N.ko;
}

export function continentName(code, lang) {
  const c = CONTINENTS[code];
  return c ? (c[lang] || c.ko) : code;
}

export function locField(obj, field, lang) {
  const suffix = lang === 'en' ? '_en' : lang === 'ja' ? '_ja' : '_ko';
  return obj[field + suffix] || obj[field + '_ko'] || obj[field] || '';
}
