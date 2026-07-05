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
export function layoutHead(title, description, extra = '', htmlLang = 'ko') {
  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-JPZWSJ3323');
  gtag('config', 'G-FKG0CPTC14');
  (function(){var d=['chatgpt.com','perplexity','claude.ai','gemini.google','copilot'];var r=document.referrer||'';if(d.some(function(s){return r.includes(s)})){var e=r.includes('chatgpt')?'chatgpt':r.includes('perplexity')?'perplexity':r.includes('claude.ai')?'claude':r.includes('gemini.google')?'gemini':r.includes('copilot')?'copilot':'other_ai';gtag('event','ai_referral_landing',{'ai_engine':e,'landing_page':location.pathname})}})();
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="theme-color" content="#f6f7fb">
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
html, body { overflow-x: hidden; }
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
}
.header-nav a:hover { background: rgba(255,255,255,0.07); color: #f0f2ff; }
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
      <a href="${prefix}/blog">Blog</a>
      <a href="${prefix}/faq">FAQ</a>
      <a href="${prefix}/gallery">Gallery</a>
      <a href="${prefix}/board">Board</a>
      <a href="${prefix}/guide">Guide</a>
      <a href="${prefix}/pricing">Pricing</a>
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
export function layoutShell({ title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript, paymentRegion }) {
  const lang = htmlLang || 'ko';
  const region = paymentRegion || (lang === 'ko' ? 'kr' : 'global');
  return `${layoutHead(title, description, seoMeta || '', lang)}
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
