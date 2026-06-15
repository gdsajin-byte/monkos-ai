#!/usr/bin/env node
/**
 * specs-data.json 공통 FAQ · seoTitle · countryJa 일괄 보강
 * ORDER_20260615 — 색인 장애 해소 P0
 */

const fs = require('fs');
const path = require('path');

const SPECS_PATH = path.join(__dirname, '../monkos_AI/portal/lib/cms/specs-data.json');
const data = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf-8'));
const keys = Object.keys(data);

const stats = { countryJa: 0, backgroundEn: 0, faq: 0, seoTitle: 0, jaFix: 0 };

// ─── 1. countryJa 26건 보강 (slug 기반 매핑) ───

const slugCountryJa = {
  'korea-passport': '韓国', 'korea-resume': '韓国', 'korea-drivers-license': '韓国',
  'korea-halfcard': '韓国', 'korea-resident': '韓国',
  'japan-passport': '日本', 'japan-resume': '日本', 'japan-mynumber': '日本',
  'japan-halfcard': '日本', 'japan-zairyu': '日本',
  'us-passport': 'アメリカ', 'usa-headshot': 'アメリカ',
  'eu-passport': 'EU', 'eu-resume': 'EU',
  'spain-passport': 'スペイン', 'germany-resume': 'ドイツ', 'uk-passport': 'イギリス',
  'australia-passport': 'オーストラリア', 'canada-passport': 'カナダ',
  'singapore-passport': 'シンガポール', 'thailand-passport': 'タイ',
  'india-passport': 'インド', 'china-passport': '中国', 'china-resume': '中国',
  'vietnam-passport': 'ベトナム', 'indonesia-passport': 'インドネシア',
};

// countryEn/Ko가 'Europe'/'Others'/'기타 Others' 같은 그룹명일 때 구체적 국가명
const slugCountryEnResolved = {
  'spain-passport': 'Spain', 'germany-resume': 'Germany', 'uk-passport': 'UK',
  'australia-passport': 'Australia', 'canada-passport': 'Canada',
  'singapore-passport': 'Singapore', 'thailand-passport': 'Thailand',
  'india-passport': 'India', 'china-passport': 'China', 'china-resume': 'China',
  'vietnam-passport': 'Vietnam', 'indonesia-passport': 'Indonesia',
  'eu-passport': 'EU', 'eu-resume': 'EU', 'usa-headshot': 'USA',
};

const slugCountryKoResolved = {
  'spain-passport': '스페인', 'germany-resume': '독일', 'uk-passport': '영국',
  'australia-passport': '호주', 'canada-passport': '캐나다',
  'singapore-passport': '싱가포르', 'thailand-passport': '태국',
  'india-passport': '인도', 'china-passport': '중국', 'china-resume': '중국',
  'vietnam-passport': '베트남', 'indonesia-passport': '인도네시아',
  'eu-passport': 'EU', 'eu-resume': 'EU', 'usa-headshot': '미국',
  'korea-passport': '한국', 'korea-resume': '한국', 'korea-drivers-license': '한국',
  'korea-halfcard': '한국', 'korea-resident': '한국',
  'japan-passport': '일본', 'japan-resume': '일본', 'japan-mynumber': '일본',
  'japan-halfcard': '일본', 'japan-zairyu': '일본',
  'us-passport': '미국',
};

for (const [slug, ja] of Object.entries(slugCountryJa)) {
  if (data[slug] && !data[slug].countryJa) {
    data[slug].countryJa = ja;
    stats.countryJa++;
  }
}

// ─── 1b. backgroundEn/Ja 5건 보강 ───

const bgFixes = {
  'japan-passport':  { en: 'No background (white recommended)', ja: '無背景（白推奨）' },
  'japan-resume':    { en: 'Uniform white',                     ja: '均一な白' },
  'us-passport':     { en: 'White or off-white',                ja: '白またはオフホワイト' },
  'japan-mynumber':  { en: 'No background, solid color',        ja: '無背景・単色' },
  'japan-halfcard':  { en: 'White or solid color',              ja: '白/単色' },
};

for (const [slug, bg] of Object.entries(bgFixes)) {
  const d = data[slug];
  if (d && !d.backgroundEn) { d.backgroundEn = bg.en; stats.backgroundEn++; }
  if (d && !d.backgroundJa) { d.backgroundJa = bg.ja; }
}

// ─── 2. 공통 FAQ 일괄 삽입 (436건) ───

function resolveCountry(slug, d, lang) {
  if (lang === 'ja') return d.countryJa || slugCountryJa[slug] || d.country;
  if (lang === 'en') return slugCountryEnResolved[slug] || d.countryEn || d.country;
  return slugCountryKoResolved[slug] || d.country;
}

function resolveType(d, lang) {
  if (lang === 'ja') return d.typeJa || d.type;
  if (lang === 'en') return d.typeEn || d.type;
  return d.type;
}

function resolveSize(d, lang) {
  if (lang === 'ja') return d.sizeJa || d.size;
  if (lang === 'en') return d.sizeEn || d.size;
  return d.size;
}

function resolveBg(d, lang) {
  if (lang === 'ja') return d.backgroundJa || d.background;
  if (lang === 'en') return d.backgroundEn || d.background;
  return d.background;
}

// "写真" 중복 방지: typeJa가 이미 "写真"으로 끝나면 "写真" 접미 생략
function jaPhotoSuffix(typeJa) {
  return typeJa.endsWith('写真') ? '' : '写真';
}

for (const k of keys) {
  const d = data[k];
  if (d.faqs && d.faqs.ko && d.faqs.ko.length > 0) continue;

  const koSize = d.size;
  if (!koSize) continue;
  const enSize = resolveSize(d, 'en');
  const jaSize = resolveSize(d, 'ja');

  const koCountry = resolveCountry(k, d, 'ko');
  const enCountry = resolveCountry(k, d, 'en');
  const jaCountry = resolveCountry(k, d, 'ja');
  const koType = resolveType(d, 'ko');
  const enType = resolveType(d, 'en');
  const jaType = resolveType(d, 'ja');
  const jaSuffix = jaPhotoSuffix(jaType);
  const koBg = d.background;
  const enBg = resolveBg(d, 'en');
  const jaBg = resolveBg(d, 'ja');

  const faqKo = [];
  const faqEn = [];
  const faqJa = [];

  // Q1: 사진 크기
  faqKo.push({
    q: `${koCountry} ${koType} 사진 크기는?`,
    a: `${koCountry} ${koType} 사진 규격은 ${koSize}입니다.${koBg ? ` 배경은 ${koBg}이어야 합니다.` : ''}`
  });
  faqEn.push({
    q: `What size is a ${enCountry} ${enType} photo?`,
    a: `The ${enCountry} ${enType} photo size is ${enSize}.${enBg ? ` The background must be ${enBg}.` : ''}`
  });
  faqJa.push({
    q: `${jaCountry}の${jaType}${jaSuffix}のサイズは？`,
    a: `${jaCountry}の${jaType}${jaSuffix}の規格は${jaSize}です。${jaBg ? `背景は${jaBg}が必要です。` : ''}`
  });

  // Q2: 셀프 촬영
  faqKo.push({
    q: `${koCountry} ${koType} 사진을 집에서 찍을 수 있나요?`,
    a: `네, 규격(${koSize})${koBg ? `과 배경(${koBg})` : ''} 조건만 맞으면 셀프 촬영이 가능합니다. MONKOS AI를 사용하면 배경 제거와 규격 크롭을 자동으로 처리합니다.`
  });
  faqEn.push({
    q: `Can I take a ${enCountry} ${enType} photo at home?`,
    a: `Yes, as long as you meet the size (${enSize})${enBg ? ` and background (${enBg})` : ''} requirements. MONKOS AI automatically removes the background and crops to the correct specs.`
  });
  faqJa.push({
    q: `${jaCountry}の${jaType}${jaSuffix}を自宅で撮れますか？`,
    a: `はい、サイズ（${jaSize}）${jaBg ? `と背景（${jaBg}）` : ''}の条件を満たせば自宅撮影も可能です。MONKOS AIを使えば背景除去と規格クロップが自動で処理されます。`
  });

  // Q3: 배경색 (배경 데이터 있을 때만)
  if (koBg) {
    faqKo.push({
      q: `${koCountry} ${koType} 사진 배경색 규정은?`,
      a: `${koCountry} ${koType} 사진은 ${koBg} 배경이 필요합니다. 그림자나 무늬가 있으면 반려될 수 있습니다.`
    });
  }
  if (enBg) {
    faqEn.push({
      q: `What is the background color for a ${enCountry} ${enType} photo?`,
      a: `A ${enCountry} ${enType} photo requires a ${enBg} background. Shadows or patterns may cause rejection.`
    });
  }
  if (jaBg) {
    faqJa.push({
      q: `${jaCountry}の${jaType}${jaSuffix}の背景色の規定は？`,
      a: `${jaCountry}の${jaType}${jaSuffix}は${jaBg}の背景が必要です。影や模様があると不合格になる場合があります。`
    });
  }

  d.faqs = { ko: faqKo, en: faqEn, ja: faqJa };
  stats.faq++;
}

// ─── 3. seoTitle · seoDescription 자동생성 (442건) ───

for (const k of keys) {
  const d = data[k];
  if (d.seoTitle) continue;

  const koSize = d.size || '';
  const enSize = resolveSize(d, 'en') || koSize;
  const jaSize = resolveSize(d, 'ja') || koSize;
  const koCountry = resolveCountry(k, d, 'ko');
  const enCountry = resolveCountry(k, d, 'en');
  const jaCountry = resolveCountry(k, d, 'ja');
  const koType = resolveType(d, 'ko');
  const enType = resolveType(d, 'en');
  const jaType = resolveType(d, 'ja');
  const jaSuffix = jaPhotoSuffix(jaType);
  const koBg = d.background || '';
  const enBg = resolveBg(d, 'en') || '';
  const jaBg = resolveBg(d, 'ja') || '';

  d.seoTitle = {
    ko: `${koCountry} ${koType} 사진 규격 ${koSize} — 배경·복장 가이드 | MONKOS`,
    en: `${enCountry} ${enType} Photo Size ${enSize} — Background & Dress Code | MONKOS`,
    ja: `${jaCountry} ${jaType}${jaSuffix}規格 ${jaSize} — 背景・服装ガイド | MONKOS`
  };

  const koDesc = koBg
    ? `${koCountry} ${koType} 사진 규격(${koSize}, ${koBg}). 규정·촬영 팁·AI 자동 크롭까지.`
    : `${koCountry} ${koType} 사진 규격(${koSize}). 규정·촬영 팁·AI 자동 크롭까지.`;
  const enDesc = enBg
    ? `${enCountry} ${enType} photo specs (${enSize}, ${enBg}). Requirements, tips & AI auto crop.`
    : `${enCountry} ${enType} photo specs (${enSize}). Requirements, tips & AI auto crop.`;
  const jaDesc = jaBg
    ? `${jaCountry} ${jaType}${jaSuffix}規格（${jaSize}、${jaBg}）。規定・撮影のコツ・AI自動クロップ。`
    : `${jaCountry} ${jaType}${jaSuffix}規格（${jaSize}）。規定・撮影のコツ・AI自動クロップ。`;

  d.seoDescription = { ko: koDesc, en: enDesc, ja: jaDesc };
  stats.seoTitle++;
}

// ─── 4. JA 한국어 잔류 해소 (R3·R4) ───

// kr-visa details
if (data['kr-visa'] && data['kr-visa'].details) {
  const det = data['kr-visa'].details;
  if (det.en && det.en.includes('출입국관리법')) {
    det.en = det.en.replace('출입국관리법', 'Immigration Control Act');
    stats.jaFix++;
  }
  if (det.ja && det.ja.includes('출입국관리법')) {
    det.ja = det.ja.replace('출입국관리법', '出入国管理法');
    stats.jaFix++;
  }
}

// kr-license details
if (data['kr-license'] && data['kr-license'].details) {
  const det = data['kr-license'].details;
  if (det.en && det.en.includes('도로교통법')) {
    det.en = det.en.replace('도로교통법', 'Road Traffic Act');
    stats.jaFix++;
  }
  if (det.ja && det.ja.includes('도로교통법')) {
    det.ja = det.ja.replace('도로교통법', '道路交通法');
    stats.jaFix++;
  }
}

// ─── 저장 ───

fs.writeFileSync(SPECS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

// ─── 사후 검증 ───

const verify = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf-8'));
const vkeys = Object.keys(verify);

let faqCount = 0, noFaq = 0, noJa = 0, noSeo = 0;
let seoTitles = new Set();
let dupSeo = 0;

for (const k of vkeys) {
  const d = verify[k];
  if (d.faqs && d.faqs.ko && d.faqs.ko.length > 0) faqCount++;
  else noFaq++;
  if (!d.countryJa) noJa++;
  if (d.seoTitle) {
    if (seoTitles.has(d.seoTitle.ko)) dupSeo++;
    seoTitles.add(d.seoTitle.ko);
  } else {
    noSeo++;
  }
}

// JA 한국어 잔류 검사
let jaKorean = 0;
const koreanRe = /[가-힣]/;
for (const k of vkeys) {
  const d = verify[k];
  if (d.countryJa && koreanRe.test(d.countryJa)) jaKorean++;
  if (d.details && d.details.ja && koreanRe.test(d.details.ja)) jaKorean++;
  if (d.details && d.details.en && koreanRe.test(d.details.en)) jaKorean++;
}

console.log('=== 실행 결과 ===');
console.log('countryJa 추가:', stats.countryJa, '건');
console.log('backgroundEn 추가:', stats.backgroundEn, '건');
console.log('FAQ 생성:', stats.faq, '건');
console.log('seoTitle 생성:', stats.seoTitle, '건');
console.log('JA 한국어 수정:', stats.jaFix, '건');

console.log('\n=== 사후 검증 ===');
console.log('FAQ 커버리지:', faqCount + '/' + vkeys.length, '(' + Math.round(faqCount/vkeys.length*100) + '%)');
console.log('FAQ 미보유:', noFaq);
console.log('countryJa 미보유:', noJa);
console.log('seoTitle 미보유:', noSeo);
console.log('seoTitle 중복:', dupSeo);
console.log('JA/EN 한국어 잔류:', jaKorean);
