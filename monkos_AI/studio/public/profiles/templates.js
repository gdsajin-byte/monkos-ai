/**
 * profiles/templates.js — 스타일 샘플 데이터 + 용도별 프리셋
 * 막내 스키마 20종 기반, 레퍼런스 이미지 경로 포함
 */

// 용도 → 엔진 자동 매핑 (조명 + 무드)
export const PURPOSE_PRESETS = {
  linkedin:  { lighting: 'soft-studio', mood: 'clean',  defaultFraming: 'bust',    defaultBg: 'studio-gray' },
  sns:       { lighting: 'natural',     mood: 'warm',   defaultFraming: 'headshot', defaultBg: 'outdoor-nature' },
  corporate: { lighting: 'soft-studio', mood: 'clean',  defaultFraming: 'bust',    defaultBg: 'studio-color' },
  dating:    { lighting: 'natural',     mood: 'warm',   defaultFraming: 'bust',    defaultBg: 'outdoor-nature' },
  artist:    { lighting: 'rim',         mood: 'moody',  defaultFraming: 'beauty-closeup', defaultBg: 'studio-gray' },
  speaker:   { lighting: 'soft-studio', mood: 'clean',  defaultFraming: 'bust',    defaultBg: 'studio-color' },
};

// 샘플 데이터 — thumb 경로는 프로덕션 시 GCS/R2로 교체
// 현재는 /tmp/ 레퍼런스 (개발용)
export const SAMPLES = {

  outfit: [
    { id: 'suit-navy-m',       label: '네이비 정장',    gender: 'm',   thumb: '/samples/outfit/suit-navy-m.jpg' },
    { id: 'suit-navy-w',       label: '네이비 정장',    gender: 'f',   thumb: '/samples/outfit/suit-navy-w.jpg' },
    { id: 'suit-charcoal-m',   label: '차콜 정장',      gender: 'm',   thumb: '/samples/outfit/suit-charcoal-m.jpg' },
    { id: 'suit-charcoal-w',   label: '차콜 정장',      gender: 'f',   thumb: '/samples/outfit/suit-charcoal-w.jpg' },
    { id: 'suit-black-m',      label: '블랙 정장',      gender: 'm',   thumb: '/samples/outfit/suit-black-m.jpg' },
    { id: 'suit-black-w',      label: '블랙 정장',      gender: 'f',   thumb: '/samples/outfit/suit-black-w.jpg' },
    { id: 'casual-knit-m',     label: '크루넥 니트',    gender: 'm',   thumb: '/samples/outfit/casual-knit-m.jpg' },
    { id: 'casual-vneck-w',    label: '브이넥 니트',    gender: 'f',   thumb: '/samples/outfit/casual-vneck-w.jpg' },
    { id: 'casual-oxford-m',   label: '옥스포드 셔츠',  gender: 'm',   thumb: '/samples/outfit/casual-oxford-m.jpg' },
    { id: 'casual-blouse-w',   label: '실크 블라우스',  gender: 'f',   thumb: '/samples/outfit/casual-blouse-w.jpg' },
    { id: 'casual-polo-m',     label: '폴로셔츠',      gender: 'm',   thumb: '/samples/outfit/casual-polo-m.jpg' },
    { id: 'creative-turtle-m', label: '터틀넥',        gender: 'm',   thumb: '/samples/outfit/creative-turtle-m.jpg' },
    { id: 'creative-turtle-w', label: '터틀넥',        gender: 'f',   thumb: '/samples/outfit/creative-turtle-w.jpg' },
    { id: 'creative-leather-m',label: '가죽자켓',      gender: 'm',   thumb: '/samples/outfit/creative-leather-m.jpg' },
    { id: 'creative-denim-w',  label: '데님자켓',      gender: 'f',   thumb: '/samples/outfit/creative-denim-w.jpg' },
  ],

  hair: [
    { id: 'default-m',        label: '그대로',        gender: 'm',   thumb: '/samples/hair/default-m.jpg' },
    { id: 'tidy-short-m',     label: '깔끔 숏컷',     gender: 'm',   thumb: '/samples/hair/tidy-short-m.jpg' },
    { id: 'two-block-m',      label: '투블럭',        gender: 'm',   thumb: '/samples/hair/two-block-m.jpg' },
    { id: 'dandy-cut-m',      label: '댄디컷',        gender: 'm',   thumb: '/samples/hair/dandy-cut-m.jpg' },
    { id: 'side-part-m',      label: '가르마',        gender: 'm',   thumb: '/samples/hair/side-part-m.jpg' },
    { id: 'comma-hair-m',     label: '쉼표머리',      gender: 'm',   thumb: '/samples/hair/comma-hair-m.jpg' },
    { id: 'default-f',        label: '그대로',        gender: 'f',   thumb: '/samples/hair/default-f.jpg' },
    { id: 'tidy-bob-f',       label: '깔끔 단발',     gender: 'f',   thumb: '/samples/hair/tidy-bob-f.jpg' },
    { id: 'long-straight-f',  label: '롱 스트레이트',  gender: 'f',   thumb: '/samples/hair/long-straight-f.jpg' },
    { id: 'c-curl-bob-f',     label: 'C컬 단발',      gender: 'f',   thumb: '/samples/hair/c-curl-bob-f.jpg' },
    { id: 'wave-long-f',      label: '웨이브 롱',     gender: 'f',   thumb: '/samples/hair/wave-long-f.jpg' },
    { id: 'half-updo-f',      label: '반묶음',        gender: 'f',   thumb: '/samples/hair/half-updo-f.jpg' },
    { id: 'updo-f',           label: '올림머리',      gender: 'f',   thumb: '/samples/hair/updo-f.jpg' },
    { id: 'low-ponytail-f',   label: '로우 포니테일',  gender: 'f',   thumb: '/samples/hair/low-ponytail-f.jpg' },
  ],

  pose: [
    { id: 'front-center',       label: '정면',          gender: 'all', thumb: '/samples/pose/front-center.jpg' },
    { id: 'front-smile',        label: '정면 미소',      gender: 'all', thumb: '/samples/pose/front-smile.jpg' },
    { id: 'three-quarter-left', label: '3/4턴 좌',      gender: 'all', thumb: '/samples/pose/three-quarter-left.jpg' },
    { id: 'three-quarter-right',label: '3/4턴 우',      gender: 'all', thumb: '/samples/pose/three-quarter-right.jpg' },
    { id: 'shoulder-angle',     label: '숄더 앵글',      gender: 'all', thumb: '/samples/pose/shoulder-angle.jpg' },
    { id: 'chin-rest',          label: '턱 괴기',       gender: 'all', thumb: '/samples/pose/chin-rest.jpg' },
    { id: 'arms-crossed',       label: '팔짱',          gender: 'all', thumb: '/samples/pose/arms-crossed.jpg' },
    { id: 'head-tilt',          label: '고개 갸우뚱',    gender: 'all', thumb: '/samples/pose/head-tilt.jpg' },
    { id: 'look-away',          label: '시선 회피',      gender: 'all', thumb: '/samples/pose/look-away.jpg' },
  ],

  makeup: [
    // 막내4 보고 대기 — 임시 placeholder
    { id: 'natural-minimal', label: '내추럴',   gender: 'all', thumb: '/samples/makeup/natural-minimal.jpg' },
    { id: 'office-daily',    label: '오피스',   gender: 'f',   thumb: '/samples/makeup/office-daily.jpg' },
    { id: 'glow',            label: '글로우',   gender: 'f',   thumb: '/samples/makeup/glow.jpg' },
    { id: 'grooming-m',      label: '그루밍',   gender: 'm',   thumb: '/samples/makeup/grooming-m.jpg' },
    { id: 'toneup',          label: '톤업',     gender: 'all', thumb: '/samples/makeup/toneup.jpg' },
  ],
};
