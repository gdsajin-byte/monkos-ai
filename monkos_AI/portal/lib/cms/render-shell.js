/**
 * CMS SSR — 공유 셸 + 유틸리티
 * escapeHtml, stripHtml, getSeoDescription, blogRenderer, layoutHead/Nav/Footer/Shell
 */
import { marked } from 'marked';

// SEO: 블로그 콘텐츠 내 heading 다운그레이드 (페이지 H1과 중복 방지)
const blogRenderer = new marked.Renderer();
blogRenderer.heading = function({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const level = Math.min(depth + 1, 6);
  return `<h${level}>${text}</h${level}>`;
};
blogRenderer.table = function(token) {
  return `<div class="table-wrap">${marked.Renderer.prototype.table.call(this, token)}</div>`;
};

export { blogRenderer, marked };

export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^>+\s?/gm, '')
    .replace(/[#*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSeoDescription(post) {
  const raw = post.summary || post.content || '';
  const cleaned = stripHtml(raw);
  return cleaned.length > 160 ? cleaned.substring(0, 157) + '...' : cleaned;
}
/**
 * GA4/Ads 계측 스니펫 — **전 SSR 표면 단일 정본** (2026-08-02 신설).
 *
 * 종전에는 layoutHead와 home.js가 각자 gtag 블록을 갖고 있어(이원화),
 * 홈에는 AI referral 추적이 누락돼 있었고 자동화 표식도 홈만 빠질 뻔했다.
 * gtag 블록을 새로 심는 SSR 표면은 반드시 이 함수를 쓴다 — 직접 작성 금지.
 *
 * 자동화 판정 3층 (2026-08-02 실측 기준):
 *   ① navigator.webdriver — Playwright·Puppeteer·Selenium이 세운다. 웹민아 E2E가 여기 해당.
 *   ② UA 패턴 — HeadlessChrome 등 자기 신고형.
 *   ③ localStorage `mk_internal='1'` — **cdp.sh 경로 전용**. cdp.sh는 이미 떠 있는 크롬의
 *      9222 포트에 붙는 방식이라 `--enable-automation`이 없고 webdriver가 false다(①로 안 잡힘).
 *      디버그 크롬 프로필에서 1회 세팅하면 영구 유효:
 *        scripts/tools/cdp.sh eval "localStorage.setItem('mk_internal','1')"
 *
 * ⚠️ 한계: 외부 스크래퍼가 UA·webdriver를 위장하면 잡히지 않는다. 2026-07-30 오염원
 * (158.69/45.88/173.244 데이터센터 IP, 1분당 130+ 고유 URL)이 그 유형이며, 이들의
 * 계량은 BQ `market_eye.run_googleapis_com_requests_*`(IP·UA 보유)로 한다.
 *
 * traffic_type='internal'은 GA4 공식 내부 트래픽 파라미터로, 콘솔의 데이터 필터를
 * '사용 중'으로 켜면 리포트에서 제외된다. 필터가 꺼져 있어도 태그는 남으므로
 * automation_hit 이벤트로 언노운 규모를 사후 계량할 수 있다.
 */
export function gtagSnippet() {
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  var _mkAuto = false;
  try {
    _mkAuto = navigator.webdriver === true ||
      /HeadlessChrome|PhantomJS|Playwright|puppeteer|Selenium|electron/i.test(navigator.userAgent) ||
      !!window._phantom || !!window.__nightmare || !!window.callPhantom ||
      localStorage.getItem('mk_internal') === '1';
  } catch (e) {}
  var _mkCfg = _mkAuto ? { traffic_type: 'internal' } : {};
  gtag('config', 'G-JPZWSJ3323', _mkCfg);${process.env.GOOGLE_ADS_CONVERSION_ID ? `
  gtag('config', 'AW-${process.env.GOOGLE_ADS_CONVERSION_ID}', _mkCfg);` : ''}
  if (_mkAuto) { gtag('event', 'automation_hit', { 'landing_page': location.pathname }); }
  (function(){var d=['chatgpt.com','perplexity','claude.ai','gemini.google','copilot'];var r=document.referrer||'';if(d.some(function(s){return r.includes(s)})){var e=r.includes('chatgpt')?'chatgpt':r.includes('perplexity')?'perplexity':r.includes('claude.ai')?'claude':r.includes('gemini.google')?'gemini':r.includes('copilot')?'copilot':'other_ai';gtag('event','ai_referral_landing',{'ai_engine':e,'landing_page':location.pathname})}})();
</script>`;
}

// themeColorMeta: 지정한 표면만 theme-color를 교체(예: specs 라이트·다크 2줄, ORDER_20261105 다크테마). 미지정 = 기존 1줄 그대로
export function layoutHead(title, description, extra = '', htmlLang = 'ko', themeColorMeta = null) {
  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
${gtagSnippet()}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${themeColorMeta || '<meta name="theme-color" content="#f6f7fb">'}
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css">
${extra}
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #f6f7fb;
  --surface: #ffffff;
  --surface2: #f0f1f5;
  --accent: #6c4fff;
  --accent2: #5a3de6;
  --text: #13152a;
  --text-dim: #4a4f6e;
  --text-bright: #13152a;
  --border: #e4e6f0;
  --border-hover: rgba(108, 79, 255, 0.3);
  --card-bg: #ffffff;
  --success: #34d399;
}
/* iOS Safari는 body의 overflow-x:hidden을 무시하고 캔버스를 확장한다(가로 팬 유발) — clip은 스크롤 컨테이너를 만들지 않고 차단 */
html, body { overflow-x: hidden; overflow-x: clip; }
body {
  font-family: 'Pretendard', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.7;
}
a { color: var(--accent); text-decoration: none; }
a:hover { color: var(--accent2); }

/* Header (dark branded — mockup 준용) */
.site-header { background: #090b1a; border-bottom: 1px solid rgba(255,255,255,0.06); }
.header-top {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  height: 58px; display: flex; align-items: center; justify-content: space-between;
}
.logo {
  font-size: 15px; font-weight: 800; letter-spacing: 0.14em;
  color: #f0f2ff; text-transform: uppercase;
  display: flex; align-items: center; gap: 8px; text-decoration: none;
}
.logo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.header-nav { display: flex; gap: 2px; }
.header-nav a {
  padding: 6px 14px; border-radius: 7px; font-size: 13px;
  color: #8892b4; text-decoration: none; transition: all 0.15s;
  white-space: nowrap;
}
.header-nav a:hover { background: rgba(255,255,255,0.07); color: #f0f2ff; }
/* 모바일: 네비 랩 허용 — 항목 잘림·캔버스 확장 없이 전 항목 노출 (2026-07-24 모바일 잘림 수선) */
@media (max-width: 640px) {
  .header-top { flex-wrap: wrap; height: auto; min-height: 50px; padding: 8px 12px; row-gap: 2px; }
  .header-nav { flex-wrap: wrap; }
  .header-nav a { padding: 5px 9px; font-size: 12.5px; }
  .logo { font-size: 13px; }
}
.header-cta {
  padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
  background: var(--accent); color: #fff; text-decoration: none; transition: opacity 0.15s;
}
.header-cta:hover { opacity: 0.9; }

/* Footer */
.footer {
  text-align: center; padding: 32px 24px; margin-top: 60px;
  border-top: 1px solid var(--border); color: var(--text-dim); font-size: 13px;
}

/* Container */
.container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
</style>`;
}

export function layoutNav(lang = 'ko') {
  const prefix = (lang === 'ko') ? '' : `/${lang}`;
  return `<header class="site-header">
  <div class="header-top">
    <a href="${prefix}/" class="logo"><span class="logo-dot"></span>MONKOS</a>
    <nav class="header-nav">
      <a href="${prefix}/specs">ID Photo</a>
      <a href="${prefix}/headshot">Headshot</a>
      <a href="${prefix}/pricing">Pricing</a>
      <a href="${prefix}/blog">Blog</a>
      <a href="${prefix}/guide">Guide</a>
    </nav>
  </div>
</header>`;
}

export function layoutFooter(lang = 'ko') {
  return `<footer class="footer">
  &copy; ${new Date().getFullYear()} MONKOS. All rights reserved.
  <br><a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a> &middot; <a href="/refund.html">Refund</a>
</footer>`;
}

/**
 * 전체 HTML 페이지를 래핑하는 셸 함수
 * v4에서 3컬럼 레이아웃으로 교체될 진입점
 */
export function layoutShell({ title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript, paymentRegion, themeColorMeta }) {
  const lang = htmlLang || 'ko';
  const region = paymentRegion || (lang === 'ko' ? 'kr' : 'global');
  return `${layoutHead(title, description, seoMeta || '', lang, themeColorMeta)}
${pageStyle ? `<style>${pageStyle}</style>` : ''}
</head>
<body>
${layoutNav(lang)}
<div class="container">
  ${bodyContent}
</div>
${layoutFooter(lang)}
<script>window.__LANG__='${lang}';window.__REGION__='${region}';</script>
<script src="/js/track.js"></script>
${pageScript ? `<script>${pageScript}</script>` : ''}
</body>
</html>`;
}
