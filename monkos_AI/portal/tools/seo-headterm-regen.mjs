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

function build(slug, d) {
  const sizeEn = d.size || '';
  const sizeMetric = localMetricSize(d.size || '');
  const cEn = EN_SHORT[d.countryEn] || d.countryEn || d.country;
  const bgKo = d.background || '';
  const bgEn = d.backgroundEn || '';
  const bgJa = d.backgroundJa || '';

  const seoTitle = {
    ko: `${d.country} ${d.type} 사진 규격·규정 ${YEAR} — ${sizeMetric}·배경·복장 | MONKOS`,
    en: `${cEn} ${d.typeEn} Photo Size & Requirements ${YEAR} — ${sizeEn} | MONKOS`,
    ja: `${d.countryJa}${d.typeJa}写真のサイズ・規格 ${YEAR} — ${sizeMetric}・背景・服装 | MONKOS`,
  };
  const seoDescription = {
    ko: `${d.country} ${d.type} 사진 공식 규격·${YEAR}년 규정 — ${sizeMetric}${bgKo ? `, ${bgKo} 배경` : ''}. 규격 검증된 사진 파일을 즉시 다운로드하세요.`,
    en: `Official ${d.countryEn} ${String(d.typeEn || '').toLowerCase()} photo requirements ${YEAR} — ${sizeEn}${bgEn ? `, ${bgEn.toLowerCase()} background` : ''}. Get a compliant photo online in seconds.`,
    ja: `${d.countryJa}${d.typeJa}写真の公式サイズ・${YEAR}年規定 — ${sizeMetric}${bgJa ? `、背景は${bgJa}` : ''}。規格対応の写真をオンラインで即ダウンロード。`,
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
