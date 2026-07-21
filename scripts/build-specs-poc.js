/**
 * SSG PoC — kr-passport 정적 HTML 빌드
 * render-specs.js 무변경. import → fragment → layoutShell → 파일 저장.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// config.js 필수 환경변수 — 렌더링 전용, 서비스 미접속
process.env.PROJECT_ID = process.env.PROJECT_ID || 'monk-project';
process.env.GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'ssg-build-dummy';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTAL = resolve(__dirname, '../monkos_AI/portal');
const OUT_DIR = resolve(__dirname, '../MONK_kr/specs-test/kr-passport');

const { specsDetailFragment } = await import(`${PORTAL}/lib/cms/render-specs.js`);
const { layoutShell } = await import(`${PORTAL}/lib/cms/render-shell.js`);

const parts = specsDetailFragment('kr-passport', 'ko');
if (!parts) {
  console.error('kr-passport fragment 생성 실패');
  process.exit(1);
}

parts.paymentRegion = 'kr';
const html = layoutShell(parts);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, 'index.html'), html, 'utf-8');
console.log(`✅ ${OUT_DIR}/index.html (${(html.length / 1024).toFixed(1)} KB)`);
