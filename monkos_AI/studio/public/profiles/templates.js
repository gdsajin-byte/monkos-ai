/**
 * profiles/templates.js — 용도별 프리셋 + 카테고리 메타 + 샘플 데이터
 * GCS 에셋 기반 (에셋 준비 전까지 직접 업로드로 대체)
 */

const GCS_BASE = 'https://storage.googleapis.com/monk-ai-images/profiles';

export const PURPOSE_PRESETS = {
  linkedin:     { label: '링크드인',     desc: '바스트샷, 신뢰+친근 비즈니스' },
  professional: { label: '전문직종',     desc: '상반신 팔짱, 의사·변호사·강사' },
  executive:    { label: '기업인',       desc: '상반신~바스트, 대표·임원' },
  artist:       { label: '아티스트',     desc: '자유 프레이밍, 감성·무드' },
  beauty:       { label: '뷰티 클로즈업', desc: '얼굴 80%, 메이크업·스킨' },
  fitting:      { label: '피팅모델',     desc: '전신~상반신, 의상 중심' },
};

export const PURPOSE_PROMPT_MAP = {
  linkedin:     'Professional LinkedIn headshot. Bust shot, soft studio lighting, clean neutral background. Confident, approachable expression. Business casual or formal attire.',
  professional: 'Professional portrait for expert/specialist. Upper body, arms crossed or confident pose. Clean studio background. Doctor, lawyer, or instructor feel.',
  executive:    'Executive portrait. Bust to upper body, authoritative but approachable. Premium studio lighting, subtle gradient background. CEO/director feel.',
  artist:       'Creative artist portrait. Free framing, emotional mood lighting. Dramatic or editorial feel. Unique personality expression.',
  beauty:       'Beauty close-up portrait. Face fills 80% of frame. Flawless skin, professional makeup. Soft diffused lighting, minimal background.',
  fitting:      'Model fitting portrait. Full body to upper body, clothing-focused. Clean studio background, even lighting. Fashion catalog style.',
};

export const CATEGORY_META = {
  master:     { icon: '🎯', label: '마스터', desc: '전체 무드 · 포즈 · 프레이밍을 결정하는 기준 이미지' },
  fashion:    { icon: '👔', label: '패션',   desc: '마스터의 의상만 교체' },
  hair:       { icon: '💇', label: '헤어',   desc: '마스터의 헤어스타일만 교체' },
  makeup:     { icon: '💄', label: '메이크업', desc: '마스터의 메이크업만 교체' },
  background: { icon: '🏞️', label: '배경',   desc: '마스터의 배경만 교체' },
};

export { GCS_BASE };

export const SAMPLES = {

  master: [],

  fashion: [
    { id: 'suit-navy-m',       label: '네이비 정장',    gender: 'm',   thumb: `${GCS_BASE}/fashion/suit-navy-m.jpg` },
    { id: 'suit-navy-w',       label: '네이비 정장',    gender: 'f',   thumb: `${GCS_BASE}/fashion/suit-navy-w.jpg` },
    { id: 'suit-charcoal-m',   label: '차콜 정장',      gender: 'm',   thumb: `${GCS_BASE}/fashion/suit-charcoal-m.jpg` },
    { id: 'suit-charcoal-w',   label: '차콜 정장',      gender: 'f',   thumb: `${GCS_BASE}/fashion/suit-charcoal-w.jpg` },
    { id: 'suit-black-m',      label: '블랙 정장',      gender: 'm',   thumb: `${GCS_BASE}/fashion/suit-black-m.jpg` },
    { id: 'suit-black-w',      label: '블랙 정장',      gender: 'f',   thumb: `${GCS_BASE}/fashion/suit-black-w.jpg` },
    { id: 'casual-knit-m',     label: '크루넥 니트',    gender: 'm',   thumb: `${GCS_BASE}/fashion/casual-knit-m.jpg` },
    { id: 'casual-vneck-w',    label: '브이넥 니트',    gender: 'f',   thumb: `${GCS_BASE}/fashion/casual-vneck-w.jpg` },
    { id: 'casual-oxford-m',   label: '옥스포드 셔츠',  gender: 'm',   thumb: `${GCS_BASE}/fashion/casual-oxford-m.jpg` },
    { id: 'casual-blouse-w',   label: '실크 블라우스',  gender: 'f',   thumb: `${GCS_BASE}/fashion/casual-blouse-w.jpg` },
    { id: 'casual-polo-m',     label: '폴로셔츠',      gender: 'm',   thumb: `${GCS_BASE}/fashion/casual-polo-m.jpg` },
    { id: 'creative-turtle-m', label: '터틀넥',        gender: 'm',   thumb: `${GCS_BASE}/fashion/creative-turtle-m.jpg` },
    { id: 'creative-turtle-w', label: '터틀넥',        gender: 'f',   thumb: `${GCS_BASE}/fashion/creative-turtle-w.jpg` },
    { id: 'creative-leather-m',label: '가죽자켓',      gender: 'm',   thumb: `${GCS_BASE}/fashion/creative-leather-m.jpg` },
    { id: 'creative-denim-w',  label: '데님자켓',      gender: 'f',   thumb: `${GCS_BASE}/fashion/creative-denim-w.jpg` },
  ],

  hair: [
    { id: 'default-m',        label: '그대로',        gender: 'm',   thumb: `${GCS_BASE}/hair/default-m.jpg` },
    { id: 'tidy-short-m',     label: '깔끔 숏컷',     gender: 'm',   thumb: `${GCS_BASE}/hair/tidy-short-m.jpg` },
    { id: 'two-block-m',      label: '투블럭',        gender: 'm',   thumb: `${GCS_BASE}/hair/two-block-m.jpg` },
    { id: 'dandy-cut-m',      label: '댄디컷',        gender: 'm',   thumb: `${GCS_BASE}/hair/dandy-cut-m.jpg` },
    { id: 'side-part-m',      label: '가르마',        gender: 'm',   thumb: `${GCS_BASE}/hair/side-part-m.jpg` },
    { id: 'comma-hair-m',     label: '쉼표머리',      gender: 'm',   thumb: `${GCS_BASE}/hair/comma-hair-m.jpg` },
    { id: 'default-f',        label: '그대로',        gender: 'f',   thumb: `${GCS_BASE}/hair/default-f.jpg` },
    { id: 'tidy-bob-f',       label: '깔끔 단발',     gender: 'f',   thumb: `${GCS_BASE}/hair/tidy-bob-f.jpg` },
    { id: 'long-straight-f',  label: '롱 스트레이트',  gender: 'f',   thumb: `${GCS_BASE}/hair/long-straight-f.jpg` },
    { id: 'c-curl-bob-f',     label: 'C컬 단발',      gender: 'f',   thumb: `${GCS_BASE}/hair/c-curl-bob-f.jpg` },
    { id: 'wave-long-f',      label: '웨이브 롱',     gender: 'f',   thumb: `${GCS_BASE}/hair/wave-long-f.jpg` },
    { id: 'half-updo-f',      label: '반묶음',        gender: 'f',   thumb: `${GCS_BASE}/hair/half-updo-f.jpg` },
    { id: 'updo-f',           label: '올림머리',      gender: 'f',   thumb: `${GCS_BASE}/hair/updo-f.jpg` },
    { id: 'low-ponytail-f',   label: '로우 포니테일',  gender: 'f',   thumb: `${GCS_BASE}/hair/low-ponytail-f.jpg` },
  ],

  makeup: [
    { id: 'natural-minimal', label: '내추럴',   gender: 'all', thumb: `${GCS_BASE}/makeup/natural-minimal.jpg` },
    { id: 'office-daily',    label: '오피스',   gender: 'f',   thumb: `${GCS_BASE}/makeup/office-daily.jpg` },
    { id: 'glow',            label: '글로우',   gender: 'f',   thumb: `${GCS_BASE}/makeup/glow.jpg` },
    { id: 'grooming-m',      label: '그루밍',   gender: 'm',   thumb: `${GCS_BASE}/makeup/grooming-m.jpg` },
    { id: 'toneup',          label: '톤업',     gender: 'all', thumb: `${GCS_BASE}/makeup/toneup.jpg` },
  ],

  background: [
    { id: 'bg-studio-white',   label: '스튜디오 (화이트)',  gender: 'all', thumb: `${GCS_BASE}/background/studio-white.jpg` },
    { id: 'bg-studio-gray',    label: '스튜디오 (그레이)',  gender: 'all', thumb: `${GCS_BASE}/background/studio-gray.jpg` },
    { id: 'bg-office',         label: '오피스',            gender: 'all', thumb: `${GCS_BASE}/background/office.jpg` },
    { id: 'bg-cafe',           label: '카페',              gender: 'all', thumb: `${GCS_BASE}/background/cafe.jpg` },
    { id: 'bg-outdoor-urban',  label: '야외 (도심)',        gender: 'all', thumb: `${GCS_BASE}/background/outdoor-urban.jpg` },
    { id: 'bg-outdoor-nature', label: '야외 (자연)',        gender: 'all', thumb: `${GCS_BASE}/background/outdoor-nature.jpg` },
  ],
};
