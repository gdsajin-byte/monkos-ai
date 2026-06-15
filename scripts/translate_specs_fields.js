#!/usr/bin/env node
/**
 * specs-data.json 다국어 번역 보강 스크립트
 * validity / fileSpec / headHeight 필드의 EN/JA 소급 번역
 */

const fs = require('fs');
const path = require('path');

const SPECS_PATH = path.join(__dirname, '../monkos_AI/portal/lib/cms/specs-data.json');
const data = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf-8'));

const keys = Object.keys(data);
let changed = { validity: 0, fileSpec: 0, headHeight: 0 };

// --- 명시적 번역 매핑 (고빈도 패턴 + 예외) ---

const validityMap = {
  '6개월 이내':       { en: 'Within 6 months',                ja: '6ヶ月以内' },
  '3개월 이내':       { en: 'Within 3 months',                ja: '3ヶ月以内' },
  '제출처에 따라 상이': { en: 'Varies by institution',          ja: '提出先により異なる' },
  '6ヶ月以内':       { en: 'Within 6 months',                ja: '6ヶ月以内' },
  '3ヶ月以内推奨':    { en: 'Within 3 months recommended',    ja: '3ヶ月以内推奨' },
  'Within 6 months': { en: 'Within 6 months',                ja: '6ヶ月以内' },
  '提出先による':     { en: 'Depends on submission destination', ja: '提出先による' },
  '-':               { en: '-',                               ja: '-' },
};

const fileSpecMap = {
  'JPEG, 500KB 이하':  { en: 'JPEG, max 500KB',   ja: 'JPEG、500KB以下' },
  'JPEG, 250KB 이하':  { en: 'JPEG, max 250KB',   ja: 'JPEG、250KB以下' },
  '제출처에 따라 상이': { en: 'Varies by institution', ja: '提出先により異なる' },
  'JPEG (비자: 240KB 이하 / 여권 갱신: 54KB~10MB)': { en: 'JPEG (Visa: max 240KB / Passport renewal: 54KB-10MB)', ja: 'JPEG（ビザ: 240KB以下 / パスポート更新: 54KB〜10MB）' },
  'JPEG, 600KB以下':   { en: 'JPEG, max 600KB',   ja: 'JPEG、600KB以下' },
  'JPEG, 20KB~7MB':    { en: 'JPEG, 20KB-7MB',    ja: 'JPEG、20KB〜7MB' },
  'JPEG':              { en: 'JPEG',               ja: 'JPEG' },
  'JPEG/PNG':          { en: 'JPEG/PNG',           ja: 'JPEG/PNG' },
};

const headHeightMap = {
  '3.2~3.6cm (정수리~턱)': { en: '3.2-3.6cm (crown to chin)',          ja: '3.2〜3.6cm（頭頂〜あご）' },
  '제출처에 따라 상이':     { en: 'Varies by institution',              ja: '提出先により異なる' },
  '제출처 기준':            { en: 'Per institution requirements',       ja: '提出先基準' },
  '별도 규정':              { en: 'Separate regulation',                ja: '別途規定' },
  '머리 70~80%':           { en: 'Head 70-80%',                        ja: '頭部 70-80%' },
  '34±2mm (顔の70~80%)':   { en: '34±2mm (70-80% of face)',            ja: '34±2mm（顔の70〜80%）' },
  '2.8~3.2cm':             { en: '2.8-3.2cm',                          ja: '2.8~3.2cm' },
  '1~1⅜ inches (25~35mm)': { en: '1-1⅜ inches (25-35mm)',             ja: '1〜1⅜インチ（25〜35mm）' },
  '3.2~3.6cm':             { en: '3.2-3.6cm',                          ja: '3.2~3.6cm' },
  '34±2mm':                { en: '34±2mm',                              ja: '34±2mm' },
  '提出先による':           { en: 'Depends on submission destination',   ja: '提出先による' },
  '-':                     { en: '-',                                    ja: '-' },
  '32~36mm':               { en: '32-36mm',                             ja: '32~36mm' },
  '31~36mm':               { en: '31-36mm',                             ja: '31~36mm' },
  '28~33mm':               { en: '28-33mm',                             ja: '28~33mm' },
};

// --- 패턴 기반 폴백 ---
function fallbackTranslate(val) {
  if (!val || val === '-') return { en: '-', ja: '-' };
  // 순수 숫자+단위 (mm/cm) → 언어 중립, EN은 ~ → -
  if (/^[\d.~±×x\s\-\/()cmmminchesinpx,KB]+$/i.test(val)) {
    return { en: val.replace(/~/g, '-'), ja: val };
  }
  return null; // 매핑 필요
}

let unmapped = [];

for (const k of keys) {
  const d = data[k];

  // validity
  if (d.validity && !d.validityEn) {
    const mapped = validityMap[d.validity] || fallbackTranslate(d.validity);
    if (mapped) {
      d.validityEn = mapped.en;
      d.validityJa = mapped.ja;
      changed.validity++;
    } else {
      unmapped.push({ key: k, field: 'validity', value: d.validity });
    }
  }

  // fileSpec
  if (d.fileSpec && !d.fileSpecEn) {
    const mapped = fileSpecMap[d.fileSpec] || fallbackTranslate(d.fileSpec);
    if (mapped) {
      d.fileSpecEn = mapped.en;
      d.fileSpecJa = mapped.ja;
      changed.fileSpec++;
    } else {
      unmapped.push({ key: k, field: 'fileSpec', value: d.fileSpec });
    }
  }

  // headHeight
  if (d.headHeight && !d.headHeightEn) {
    const mapped = headHeightMap[d.headHeight] || fallbackTranslate(d.headHeight);
    if (mapped) {
      d.headHeightEn = mapped.en;
      d.headHeightJa = mapped.ja;
      changed.headHeight++;
    } else {
      unmapped.push({ key: k, field: 'headHeight', value: d.headHeight });
    }
  }
}

// --- 결과 출력 ---
console.log('=== 번역 완료 ===');
console.log('validity:', changed.validity, '건');
console.log('fileSpec:', changed.fileSpec, '건');
console.log('headHeight:', changed.headHeight, '건');
console.log('합계:', changed.validity + changed.fileSpec + changed.headHeight, '건');

if (unmapped.length > 0) {
  console.log('\n⚠️ 매핑 실패 (수동 확인 필요):');
  for (const u of unmapped) {
    console.log(' ', u.key, '-', u.field, ':', JSON.stringify(u.value));
  }
} else {
  console.log('\n✅ 매핑 실패 0건');
}

// --- 저장 ---
fs.writeFileSync(SPECS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('\n파일 저장 완료:', SPECS_PATH);

// --- 사후 검증 ---
const verify = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf-8'));
const vkeys = Object.keys(verify);
let postStats = { validity: {total:0, en:0, ja:0}, fileSpec: {total:0, en:0, ja:0}, headHeight: {total:0, en:0, ja:0} };
for (const k of vkeys) {
  const d = verify[k];
  if (d.validity) { postStats.validity.total++; if (d.validityEn) postStats.validity.en++; if (d.validityJa) postStats.validity.ja++; }
  if (d.fileSpec) { postStats.fileSpec.total++; if (d.fileSpecEn) postStats.fileSpec.en++; if (d.fileSpecJa) postStats.fileSpec.ja++; }
  if (d.headHeight) { postStats.headHeight.total++; if (d.headHeightEn) postStats.headHeight.en++; if (d.headHeightJa) postStats.headHeight.ja++; }
}
console.log('\n=== 사후 검증 ===');
for (const [field, s] of Object.entries(postStats)) {
  const covEn = s.total ? Math.round(s.en / s.total * 100) : 0;
  const covJa = s.total ? Math.round(s.ja / s.total * 100) : 0;
  console.log(field + ':', 'total=' + s.total, 'EN=' + s.en + '(' + covEn + '%)', 'JA=' + s.ja + '(' + covJa + '%)');
}
