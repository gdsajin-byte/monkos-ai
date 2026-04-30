#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const SRC = './public/crop.js';
const BACKUP = './public/crop.src.js';

const options = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.4,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayThreshold: 0.5,
  stringArrayEncoding: ['base64'],
  renameGlobals: false,
  selfDefending: false,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

const js = readFileSync(SRC, 'utf8');
copyFileSync(SRC, BACKUP);

const result = JavaScriptObfuscator.obfuscate(js, options);
writeFileSync(SRC, result.getObfuscatedCode());
console.log(`[obfuscate] crop.js done (backup: crop.src.js)`);
