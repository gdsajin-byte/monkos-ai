#!/usr/bin/env node
// specs seoTitle·seoDescription 3언어 재생성 배치
// 근거: REPORT_20260713_iMac민아_SPECS_SEO헤드텀_다국어진단설계.md §4-2
// 원칙: 번역이 아니라 시장별 검색어 재작성 — ko "규격·규정+연도" / en "Size & Requirements"+로컬단위 / ja "サイズ" 선두
// 연도는 데이터에 포함하고 연 1회 본 스크립트 재실행으로 갱신한다 (YEAR 상수).
// 사용: node tools/seo-headterm-regen.mjs [--dry] [--sample]
//   --dry    파일 미기록, 통계만
//   --sample 대국10·중경쟁10·소국10 diff를 stdout 출력

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '../lib/cms/specs-data.json');
const YEAR = 2026;

const DRY = process.argv.includes('--dry');
const SAMPLE = process.argv.includes('--sample');

// en title 축약 맵 — 검색어 정합 (description은 풀네임 유지)
const EN_SHORT = { 'United States': 'US', 'United Kingdom': 'UK', 'United Arab Emirates': 'UAE' };

// size 문자열에서 mm 수치 추출 → ko/ja용 cm 표기 생성. inch형이 아니면 원문 유지.
function localMetricSize(size) {
  if (!size || !/inch/i.test(size)) return size;
  const m = size.match(/\(([\d.]+)\s*[×x]\s*([\d.]+)\s*mm\)/i);
  if (!m) return size;
  const toCm = v => {
    const cm = parseFloat(v) / 10;
    return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
  };
  return `${toCm(m[1])} × ${toCm(m[2])}cm`;
}

// en size → 1단위: inch 포함 시 inch만, 그 외 metric만. 괄호 병기 제거
function enSizeCompact(size) {
  if (!size) return '';
  if (/inch/i.test(size)) {
    const m = size.match(/([\d.]+\s*[×x]\s*[\d.]+)\s*inch/i);
    return m ? `${m[1].replace(/\s/g, '')} inch` : size;
  }
  const m2 = size.match(/\(([\d.]+\s*[×x]\s*[\d.]+)\s*mm\)/i);
  if (m2) return `${m2[1].replace(/\s/g, '')}mm`;
  return size;
}

function build(slug, d) {
  const sizeEn = d.size || '';
  const sizeEnCompact = enSizeCompact(sizeEn);
  const sizeMetric = localMetricSize(d.size || '');
  const sizeMetricCompact = sizeMetric.replace(/\s*×\s*/g, '×');
  const cEn = EN_SHORT[d.countryEn] || d.countryEn || d.country;
  const bgKo = d.background || '';
  const bgEn = d.backgroundEn || '';
  const bgJa = d.backgroundJa || '';

  // (b) Photo / 写真 이중 표기 방지
  const typeEnPhoto = /photo$/i.test(d.typeEn) ? d.typeEn : `${d.typeEn} Photo`;
  const typeJaPhoto = /写真$/.test(d.typeJa) ? d.typeJa : `${d.typeJa}写真`;

  // (a) en title: | MONKOS 제거 + 1단위 사이즈
  let enTitle = `${cEn} ${typeEnPhoto} Size & Requirements ${YEAR} — ${sizeEnCompact}`;
  if (enTitle.length > 60) {
    enTitle = `${cEn} ${typeEnPhoto} Size & Requirements ${YEAR}`;
  }

  let koTitle = `${d.country} ${d.type} 사진 규격·규정 ${YEAR} — ${sizeMetricCompact}·배경·복장 | MONKOS`;
  let jaTitle = `${d.countryJa}${typeJaPhoto}のサイズ・規格 ${YEAR} — ${sizeMetricCompact}・背景・服装 | MONKOS`;

  // (c) desc: background 중복 방지 + en desc에서 United States → US
  const bgKoSuffix = bgKo && !/배경$/.test(bgKo) ? `${bgKo} 배경` : bgKo;
  const bgEnSuffix = bgEn && !/background$/i.test(bgEn) ? `${bgEn.toLowerCase()} background` : bgEn.toLowerCase();
  const bgJaSuffix = bgJa && !/背景$/.test(bgJa) ? bgJa : bgJa;
  const descCountryEn = EN_SHORT[d.countryEn] || d.countryEn;
  const typeEnLower = String(d.typeEn || '').toLowerCase();
  const typeEnPhotoLower = /photo$/i.test(typeEnLower) ? typeEnLower : `${typeEnLower} photo`;

  // (d) ko·ja 60자 초과 개별 축소 — 치수 세그먼트 축약, ·배경·복장 생략
  if (koTitle.length > 60) {
    koTitle = `${d.country} ${d.type} 사진 규격·규정 ${YEAR} — ${sizeMetricCompact} | MONKOS`;
  }
  if (jaTitle.length > 60) {
    jaTitle = `${d.countryJa}${typeJaPhoto}のサイズ・規格 ${YEAR} — ${sizeMetricCompact} | MONKOS`;
  }

  const seoTitle = { ko: koTitle, en: enTitle, ja: jaTitle };
  const seoDescription = {
    ko: `${d.country} ${d.type} 사진 공식 규격·${YEAR}년 규정 — ${sizeMetric}${bgKoSuffix ? `, ${bgKoSuffix}` : ''}. 규격 검증된 사진 파일을 즉시 다운로드하세요.`,
    en: `Official ${descCountryEn} ${typeEnPhotoLower} requirements ${YEAR} — ${sizeEn}${bgEnSuffix ? `, ${bgEnSuffix}` : ''}. Get a compliant photo online in seconds.`,
    ja: `${d.countryJa}${typeJaPhoto}の公式サイズ・${YEAR}年規定 — ${sizeMetric}${bgJaSuffix ? `、背景は${bgJaSuffix}` : ''}。規格対応の写真をオンラインで即ダウンロード。`,
  };
  return { seoTitle, seoDescription };
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const slugs = Object.keys(data);
let changed = 0;
const issues = [];
const diffs = [];

for (const slug of slugs) {
  const d = data[slug];
  if (!d.country || !d.countryEn || !d.countryJa || !d.type || !d.typeEn || !d.typeJa || !d.size) {
    issues.push(`${slug}: 필수 필드 누락 (country/type/size 계열) — 건너뜀`);
    continue;
  }
  const next = build(slug, d);
  const before = JSON.stringify({ t: d.seoTitle, s: d.seoDescription });
  const after = JSON.stringify({ t: next.seoTitle, s: next.seoDescription });
  if (before !== after) {
    diffs.push({ slug, before: d.seoTitle, after: next.seoTitle });
    if (!DRY) { d.seoTitle = next.seoTitle; d.seoDescription = next.seoDescription; }
    changed++;
  }
}

console.log(`총 ${slugs.length} 슬러그 / 변경 ${changed} / 이슈 ${issues.length}${DRY ? ' [dry-run]' : ''}`);
issues.forEach(i => console.log('⚠️ ', i));

if (SAMPLE) {
  const majors = ['us-visa', 'us-passport', 'kr-passport', 'jp-passport', 'cn-visa', 'gb-passport', 'de-passport', 'fr-visa', 'ca-visa', 'au-visa'];
  const mids = ['in-visa', 'vn-visa', 'th-visa', 'ph-passport', 'sg-visa', 'my-visa', 'id-passport', 'br-passport', 'mx-visa', 'tr-visa'];
  const longtails = ['lc-passport', 'vc-passport', 'bn-passport', 'cu-passport', 'az-visa', 'by-passport', 'er-passport', 'gt-passport', 'sb-visa', 'tl-visa'];
  for (const group of [['대국', majors], ['중경쟁', mids], ['소국 롱테일', longtails]]) {
    console.log(`\n===== ${group[0]} =====`);
    for (const s of group[1]) {
      const hit = diffs.find(x => x.slug === s);
      if (!hit) { console.log(`\n[${s}] (변경 없음 또는 미존재)`); continue; }
      console.log(`\n[${s}]`);
      for (const l of ['ko', 'en', 'ja']) {
        console.log(`  ${l} 전: ${hit.before?.[l] || '(없음)'}`);
        console.log(`  ${l} 후: ${hit.after[l]}`);
      }
    }
  }
}

if (!DRY) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n기록 완료: ${DATA_PATH}`);
}
