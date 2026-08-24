/**
 * specs SSG 빌드 — CF 엣지 정적화 (2026-08-24)
 *
 * 기존 render-specs.js 렌더러를 빌드 타임에 그대로 호출하여 정적 HTML을 생성한다.
 * 렌더 로직 포크 금지 (정본 단일 원칙, 헌법 3조 4항) — 본 스크립트는 캡처만 한다.
 *
 * 산출물 (dist/):
 *   - specs 상세: {lang프리픽스}/specs/{type}/{country}.html (429 × 6언어)
 *   - specs 리스트: specs.html + {lang}/specs.html (6)
 *   - 사이트맵: sitemap-specs.xml + sitemap-specs-{lang}.xml (7)
 *   - 정적 자산: public/{css,js,images,assets} + favicon·og·robots (복사)
 *   - build-manifest.json
 *
 * 실행: ./build.sh (env 주입 래퍼) — node 직접 실행 시 PROJECT_ID·GCS_BUCKET 필요
 */
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORTAL = join(__dirname, '../..');
const DIST = join(__dirname, 'dist');

// ── 렌더러 로드 (env는 build.sh가 주입) ──
const { renderSpecsList, renderSpecsDetail, SPECS_DATA, REDIRECT_MAP } = await import(join(PORTAL, 'lib/cms/render-specs.js'));
const { renderSitemapSpecs, renderSitemapSpecsLang } = await import(join(PORTAL, 'lib/cms/render-sitemap.js'));
const { specsPath, SPECS_LANGS } = await import(join(PORTAL, 'lib/cms/specs-url.js'));

// ── res 목킹: writeHead/end 캡처 ──
function capture(renderFn, urlPath, ...args) {
  let status = 0, headers = {}, body = null;
  const req = { url: urlPath, headers: { host: 'monkos.ai' }, method: 'GET' };
  const res = {
    writeHead(s, h) { status = s; headers = h || {}; },
    setHeader(k, v) { headers[k] = v; },
    end(b) { body = b; },
  };
  renderFn(req, res, ...args);
  return { status, headers, body };
}

// ── 빌드 시작 ──
const t0 = Date.now();
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const stats = { pages: 0, lists: 0, sitemaps: 0, redirectSkip: 0, errors: [] };

// 1) 상세 페이지: 전 slug × 전 언어
for (const slug of Object.keys(SPECS_DATA)) {
  const routeKey = REDIRECT_MAP[slug];
  if (!routeKey) { stats.errors.push(`no-route: ${slug}`); continue; }
  for (const lang of SPECS_LANGS) {
    const urlPath = specsPath(routeKey, lang);
    const forceLang = lang === 'ko' ? null : lang;
    const { status, body } = capture(renderSpecsDetail, urlPath, forceLang);
    if (status === 301) { stats.redirectSkip++; continue; }
    if (status !== 200 || !body) { stats.errors.push(`${status}: ${urlPath}`); continue; }
    const outFile = join(DIST, `${urlPath.replace(/^\//, '')}.html`);
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, body);
    stats.pages++;
  }
}

// 2) 리스트 페이지 (언어별 6)
for (const lang of SPECS_LANGS) {
  const urlPath = lang === 'ko' ? '/specs' : `/${lang}/specs`;
  const forceLang = lang === 'ko' ? null : lang;
  const { status, body } = capture(renderSpecsList, urlPath, forceLang);
  if (status !== 200 || !body) { stats.errors.push(`list ${status}: ${urlPath}`); continue; }
  const outFile = join(DIST, `${urlPath.replace(/^\//, '')}.html`);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, body);
  stats.lists++;
}

// 3) 사이트맵 (specs 전용 — blog·static 사이트맵은 오리진 SSR 유지)
{
  const { status, body } = capture(renderSitemapSpecs, '/sitemap-specs.xml');
  if (status === 200 && body) { writeFileSync(join(DIST, 'sitemap-specs.xml'), body); stats.sitemaps++; }
  else stats.errors.push(`sitemap-specs ${status}`);
  for (const lang of SPECS_LANGS) {
    const r = capture((req, res) => renderSitemapSpecsLang(req, res, lang), `/sitemap-specs-${lang}.xml`);
    if (r.status === 200 && r.body) { writeFileSync(join(DIST, `sitemap-specs-${lang}.xml`), r.body); stats.sitemaps++; }
    else stats.errors.push(`sitemap-specs-${lang} ${r.status}`);
  }
}

// 4) 정적 자산 복사 — 화이트리스트만 (admin·backup·proto·루트 html·llms.txt 제외:
//    admin=인증 가드, 루트 html=SSR 섀도잉 방지, llms.txt=SSR 정본)
const ASSET_DIRS = ['css', 'js', 'images', 'assets'];
const ASSET_FILES = ['robots.txt', 'og-image.png', 'favicon-32.png', 'favicon-192.png', 'favicon-512.png', 'apple-touch-icon.png', 'monkos-icon.svg'];
for (const d of ASSET_DIRS) {
  const src = join(PORTAL, 'public', d);
  if (existsSync(src)) cpSync(src, join(DIST, d), { recursive: true });
}
for (const f of ASSET_FILES) {
  const src = join(PORTAL, 'public', f);
  if (existsSync(src)) cpSync(src, join(DIST, f));
}

// 5) 매니페스트
let gitRev = 'unknown';
try { gitRev = execSync('git rev-parse --short HEAD', { cwd: PORTAL }).toString().trim(); } catch {}
const manifest = {
  builtAt: new Date().toISOString(),
  assetVer: process.env.K_REVISION || 'dev',
  gitRev,
  langs: SPECS_LANGS,
  slugs: Object.keys(SPECS_DATA).length,
  ...stats,
};
writeFileSync(join(DIST, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

// ── 결과 (실패 무음 금지: 에러 전량 출력, 1건이라도 있으면 exit 1) ──
console.log(`[specs-ssg] pages=${stats.pages} lists=${stats.lists} sitemaps=${stats.sitemaps} redirectSkip=${stats.redirectSkip} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (stats.errors.length) {
  console.error(`[specs-ssg] ❌ 에러 ${stats.errors.length}건:`);
  for (const e of stats.errors) console.error('  - ' + e);
  process.exit(1);
}
const expected = Object.keys(SPECS_DATA).length * SPECS_LANGS.length;
if (stats.pages + stats.redirectSkip !== expected) {
  console.error(`[specs-ssg] ❌ 페이지 수 불일치: ${stats.pages}+${stats.redirectSkip} ≠ ${expected}`);
  process.exit(1);
}
console.log('[specs-ssg] ✅ 빌드 완료');
