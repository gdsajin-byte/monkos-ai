#!/usr/bin/env node
/**
 * apply-verification.js
 * Reads countries.jsonl, applies ~82 verification changes, writes back.
 * CommonJS. No external dependencies.
 *
 * Usage: node scripts/d1-migration/apply-verification.js
 */

const fs = require('fs');
const path = require('path');

const JSONL_PATH = path.resolve(
  __dirname,
  '../../apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl'
);

// ── helpers ────────────────────────────────────────────────────────────────

/** Build a default passport doc object */
function makePassport(countryId, overrides = {}) {
  const doc = {
    id: `${countryId}-passport`,
    type: 'passport',
    ko: '여권',
    en: 'Passport',
    ja: 'パスポート',
    size: overrides.size || '35x45',
    px: overrides.px || '413x531',
    head: overrides.head || '',
    std: overrides.std || '',
  };
  if (overrides.warning) doc.warning = overrides.warning;
  return doc;
}

function makeDoc(countryId, type, overrides = {}) {
  const labelMap = {
    passport: { ko: '여권', en: 'Passport', ja: 'パスポート' },
    visa: { ko: '비자', en: 'Visa', ja: 'ビザ' },
    id: { ko: '신분증', en: 'National ID', ja: '身分証' },
  };
  const labels = labelMap[type] || labelMap.passport;
  const doc = {
    id: `${countryId}-${type}`,
    type,
    ko: labels.ko,
    en: labels.en,
    ja: labels.ja,
    size: overrides.size || '35x45',
    px: overrides.px || '413x531',
    head: overrides.head || '',
    std: overrides.std || '',
  };
  if (overrides.warning) doc.warning = overrides.warning;
  return doc;
}

/** Find a doc by type inside a country entry */
function findDoc(country, type) {
  return country.docs.find((d) => d.type === type);
}

/** Add or update a doc. Returns description of what changed. */
function upsertDoc(country, doc) {
  const existing = country.docs.find((d) => d.id === doc.id || d.type === doc.type);
  if (existing) {
    // merge fields
    const changes = [];
    for (const key of Object.keys(doc)) {
      if (key === 'id' || key === 'type' || key === 'ko' || key === 'en' || key === 'ja') continue;
      if (JSON.stringify(existing[key]) !== JSON.stringify(doc[key])) {
        changes.push(`${key}: ${JSON.stringify(existing[key])} -> ${JSON.stringify(doc[key])}`);
        existing[key] = doc[key];
      }
    }
    // add warning if it doesn't exist yet
    if (doc.warning && !existing.warning) {
      existing.warning = doc.warning;
      changes.push(`warning: added`);
    } else if (doc.warning && JSON.stringify(existing.warning) !== JSON.stringify(doc.warning)) {
      existing.warning = doc.warning;
      changes.push(`warning: updated`);
    }
    return changes.length > 0
      ? `  MOD ${country.id}/${doc.type}: ${changes.join(', ')}`
      : null;
  } else {
    country.docs.push(doc);
    return `  ADD ${country.id}/${doc.type}: ${doc.size} ${doc.px}`;
  }
}

// ── main ───────────────────────────────────────────────────────────────────

function main() {
  // Read
  const raw = fs.readFileSync(JSONL_PATH, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const countries = lines.map((l) => JSON.parse(l));
  const byId = {};
  countries.forEach((c) => { byId[c.id] = c; });

  const log = [];

  function apply(countryId, doc) {
    const c = byId[countryId];
    if (!c) {
      log.push(`  SKIP ${countryId}: country not found`);
      return;
    }
    const msg = upsertDoc(c, doc);
    if (msg) log.push(msg);
  }

  // ────────────────────────────────────────────────────────────────────────
  // 1. MODIFICATIONS to existing entries
  // ────────────────────────────────────────────────────────────────────────

  // 1a. id-passport: size 51x51 -> 40x60, add warning
  apply('id', makePassport('id', {
    size: '40x60',
    px: '472x709',
    head: '25-31', // keep existing head
    warning: {
      ko: '⚠️ 여권 배경색 빨간색. 비자는 흰색 35x45.',
      en: '⚠️ Passport background is RED. Visa uses white 35x45.',
      ja: '⚠️ パスポートの背景は赤色。ビザは白35x45。',
    },
  }));

  // 1b. id-visa: size -> 35x45, px 413x531, add warning
  apply('id', makeDoc('id', 'visa', {
    size: '35x45',
    px: '413x531',
    warning: {
      ko: '⚠️ 비자 사양은 여권과 다릅니다 (흰색 배경 35x45).',
      en: '⚠️ Visa spec differs from passport (white background 35x45).',
      ja: '⚠️ ビザの仕様はパスポートと異なります（白背景35x45）。',
    },
  }));

  // 1c. sg-passport: std -> ICA (already ICA), add warning
  apply('sg', {
    id: 'sg-passport',
    type: 'passport',
    ko: '여권',
    en: 'Passport',
    ja: 'パスポート',
    size: '35x45',
    px: '400x514',
    head: '25-35',
    std: 'ICA',
    warning: {
      ko: '⚠️ 유효기간 3개월',
      en: '⚠️ Valid 3 months',
      ja: '⚠️ 有効期限3ヶ月',
    },
  });

  // 1d. ca-passport: std -> PPTC-203 (already set, no-op)
  // Already has PPTC-203, nothing to change

  // ────────────────────────────────────────────────────────────────────────
  // 2. NEW passport docs for countries with empty docs[]
  // ────────────────────────────────────────────────────────────────────────

  // Asia - standard 35x45 passports
  apply('tw', makePassport('tw', { head: '32-36', std: 'BOCA' }));
  apply('th', makePassport('th'));
  apply('ph', makePassport('ph', {
    head: '32-36',
    warning: {
      ko: '⚠️ DFA 국내 현장촬영',
      en: '⚠️ On-site photo at DFA offices',
      ja: '⚠️ DFA国内現場撮影',
    },
  }));
  apply('ru', makePassport('ru', {
    head: '32-36',
    warning: {
      ko: '⚠️ 광택종이 필수',
      en: '⚠️ Glossy paper required',
      ja: '⚠️ 光沢紙必須',
    },
  }));
  apply('ua', makePassport('ua'));
  apply('fr', makePassport('fr', {
    head: '32-36',
    warning: {
      ko: '⚠️ 흰색 배경 금지! 밝은 회색/파란 필수',
      en: '⚠️ White background prohibited! Light grey/blue required',
      ja: '⚠️ 白背景禁止！明るいグレー/青必須',
    },
  }));
  apply('de', makePassport('de', {
    head: '32-36',
    warning: {
      ko: '⚠️ 2025.05~ 종이사진 금지, 디지털 전용',
      en: '⚠️ From 2025.05 paper photos prohibited, digital only',
      ja: '⚠️ 2025.05〜紙写真禁止、デジタル専用',
    },
  }));
  apply('it', makePassport('it'));
  apply('es', makePassport('es'));
  apply('pt', makePassport('pt'));
  apply('nl', makePassport('nl'));
  apply('be', makePassport('be'));
  apply('ch', makePassport('ch'));
  apply('at', makePassport('at'));
  apply('se', makePassport('se'));
  apply('no', makePassport('no'));
  apply('dk', makePassport('dk'));
  apply('ie', makePassport('ie'));
  apply('pl', makePassport('pl'));
  apply('cz', makePassport('cz'));
  apply('sk', makePassport('sk'));
  apply('hu', makePassport('hu'));
  apply('ro', makePassport('ro'));
  apply('bg', makePassport('bg'));
  apply('hr', makePassport('hr'));
  apply('si', makePassport('si'));
  apply('lv', makePassport('lv'));
  apply('lu', makePassport('lu'));
  apply('mt', makePassport('mt'));
  apply('li', makePassport('li'));
  apply('is', makePassport('is'));
  apply('np', makePassport('np'));
  apply('pk', makePassport('pk', { head: '32-36' }));
  apply('lk', makePassport('lk', { head: '32-36' }));
  apply('mn', makePassport('mn'));
  apply('uz', makePassport('uz'));
  apply('mm', makePassport('mm'));

  // UAE: 3 docs
  apply('ae', makeDoc('ae', 'passport', { size: '40x60', px: '472x709' }));
  apply('ae', makeDoc('ae', 'visa', { size: '43x55', px: '507x650' }));
  apply('ae', makeDoc('ae', 'id', { size: '35x45', px: '413x531' }));

  // Mexico
  apply('mx', makePassport('mx', {
    head: '32-39',
    warning: {
      ko: '⚠️ 국내+영사관 현장촬영 병행',
      en: '⚠️ In-person photography at offices/consulates',
      ja: '⚠️ 国内・領事館で現場撮影',
    },
  }));

  // Argentina: already has passport with head "28", update std
  apply('ar', {
    id: 'ar-passport',
    type: 'passport',
    ko: '여권',
    en: 'Passport',
    ja: 'パスポート',
    size: '40x40',
    px: '472x472',
    head: '',
    std: 'Decreto 261/2011',
  });

  // Peru
  apply('pe', makePassport('pe', {
    warning: {
      ko: '⚠️ Migraciones 현장촬영 (사진 불필요)',
      en: '⚠️ On-site biometric photo at Migraciones',
      ja: '⚠️ Migraciones現場撮影（写真不要）',
    },
  }));

  // Finland: already has fi-passport with px "425x555". Update px to "424x555"
  apply('fi', {
    id: 'fi-passport',
    type: 'passport',
    ko: '여권',
    en: 'Passport',
    ja: 'パスポート',
    size: '36x47',
    px: '424x555',
    head: '',
    std: '',
  });

  // Afghanistan
  apply('af', makePassport('af', { size: '40x45', px: '472x531' }));

  // Grenada (currently empty docs)
  apply('gd', makePassport('gd', { size: '38x51', px: '449x602' }));

  // Burundi (currently empty docs)
  apply('bi', makePassport('bi', { size: '45x45', px: '531x531' }));

  // Myanmar visa (add to mm which we just gave a passport)
  apply('mm', makeDoc('mm', 'visa', { size: '38x48', px: '449x567' }));

  // ────────────────────────────────────────────────────────────────────────
  // 3. African countries — add passport to those with empty docs[]
  // ────────────────────────────────────────────────────────────────────────

  const africanStandard = [
    'gh', 'ci', 'sn', 'cd', 'cg', 'zw', 'mz', 'ao',
    'ml', 'ne', 'bf', 'mw', 'dz', 'tn', 'so', 'ss',
    'er', 'bj', 'cv', 'st', 'sz', 'ls', 'cf', 'gm',
  ];
  for (const cid of africanStandard) {
    apply(cid, makePassport(cid));
  }

  // Nigeria: special warning
  apply('ng', makePassport('ng', {
    warning: {
      ko: '⚠️ 600DPI, 사진 유효기간 2주',
      en: '⚠️ 600DPI required, photo valid 2 weeks',
      ja: '⚠️ 600DPI必要、写真有効期限2週間',
    },
  }));

  // ────────────────────────────────────────────────────────────────────────
  // 4. Oceania — add passport to fj, ws, to, vu, sb if empty
  // ────────────────────────────────────────────────────────────────────────

  const oceaniaStandard = ['fj', 'ws', 'to', 'vu', 'sb'];
  for (const cid of oceaniaStandard) {
    apply(cid, makePassport(cid));
  }

  // ────────────────────────────────────────────────────────────────────────
  // Write back
  // ────────────────────────────────────────────────────────────────────────

  const output = countries.map((c) => JSON.stringify(c)).join('\n') + '\n';
  fs.writeFileSync(JSONL_PATH, output, 'utf-8');

  // ────────────────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────────────────

  const adds = log.filter((l) => l.includes('ADD')).length;
  const mods = log.filter((l) => l.includes('MOD')).length;
  const skips = log.filter((l) => l.includes('SKIP')).length;

  console.log('=== apply-verification.js ===');
  console.log(`Source: ${JSONL_PATH}`);
  console.log(`Lines: ${countries.length}`);
  console.log(`Changes: ${adds} added, ${mods} modified, ${skips} skipped`);
  console.log('');
  log.forEach((l) => console.log(l));
  console.log('');
  console.log('Done. File written.');
}

main();
