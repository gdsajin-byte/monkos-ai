#!/usr/bin/env node
/**
 * HTML inline JS 난독화 — Docker 빌드 전용
 * public/*.html 내 <script> 블록을 javascript-obfuscator로 처리
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const PUBLIC_DIR = './public';
const files = readdirSync(PUBLIC_DIR)
  .filter(f => f.endsWith('.html'))
  .map(f => join(PUBLIC_DIR, f));

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

for (const file of files) {
  let html = readFileSync(file, 'utf8');
  let count = 0;

  // src 속성이 없는 inline <script> 블록만 처리 (gtag/analytics 제외)
  html = html.replace(/<script(?![^>]*\bsrc\b)([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, js) => {
    if (!js.trim() || js.trim().length < 100) return match;
    if (js.includes('gtag(') || js.includes('dataLayer')) return match;
    try {
      const result = JavaScriptObfuscator.obfuscate(js, options);
      count++;
      return `<script${attrs}>${result.getObfuscatedCode()}</script>`;
    } catch (e) {
      console.warn(`[obfuscate] WARN ${file}: ${e.message}`);
      return match;
    }
  });

  writeFileSync(file, html);
  console.log(`[obfuscate] ${file}: ${count} block(s) done`);
}
