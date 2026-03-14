#!/usr/bin/env node
/**
 * 콘텐츠 이관 CLI
 *
 * Usage:
 *   node lib/cms/importer/index.js --source=note
 *   node lib/cms/importer/index.js --source=naver
 *   node lib/cms/importer/index.js --source=all
 */
import { importFromNote } from './note.js';
import { importFromNaver } from './naver.js';
import { log } from '../../shared/config.js';

const args = process.argv.slice(2);
const sourceArg = args.find(a => a.startsWith('--source='));
const source = sourceArg ? sourceArg.split('=')[1] : 'all';

if (!['note', 'naver', 'all'].includes(source)) {
  console.error('Usage: node lib/cms/importer/index.js --source=note|naver|all');
  process.exit(1);
}

async function main() {
  log(`[Importer] 시작 — source: ${source}`);
  const results = {};

  if (source === 'note' || source === 'all') {
    log('[Importer] note.com 이관 시작...');
    results.note = await importFromNote();
    log(`[Importer] note.com — ${results.note.imported}건 이관 / ${results.note.skipped}건 skip / ${results.note.errors}건 오류`);
  }

  if (source === 'naver' || source === 'all') {
    log('[Importer] 네이버 이관 시작...');
    results.naver = await importFromNaver();
    log(`[Importer] 네이버 — ${results.naver.imported}건 이관 / ${results.naver.skipped}건 skip / ${results.naver.errors}건 오류`);
  }

  // 최종 보고
  console.log('\n=== 이관 완료 보고 ===');
  for (const [src, stats] of Object.entries(results)) {
    console.log(`- ${src}: ${stats.imported}건 이관 / ${stats.skipped}건 skip / ${stats.errors}건 오류`);
    if (stats.errorList?.length) {
      console.log('  오류 목록:');
      stats.errorList.forEach(e => console.log(`    - ${e}`));
    }
  }
}

main().catch(err => {
  console.error('[Importer] 치명적 오류:', err);
  process.exit(1);
});
