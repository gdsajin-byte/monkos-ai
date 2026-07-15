import { escapeHtml } from '../render-shell.js';

export function relatedServices(ctx) {
  const { v2, prefix } = ctx;
  return `    <!-- 7. 크로스셀 카드 -->
    <div class="v2-same-section">
      <h2>${escapeHtml(v2.crossTitle)}</h2>
      <div class="v2-same-sub">${escapeHtml(v2.crossSub)}</div>
      <div class="v2-same-grid">
        <a href="/headshot" class="v2-same-card">
          <span class="v2-same-icon">💼</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossHeadshot)}</div><div class="v2-same-size">${escapeHtml(v2.crossHeadshotSub)}</div></div>
        </a>
        <a href="/" class="v2-same-card">
          <span class="v2-same-icon">📷</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossProfile)}</div><div class="v2-same-size">${escapeHtml(v2.crossProfileSub)}</div></div>
        </a>
        <a href="${prefix}/specs" class="v2-same-card">
          <span class="v2-same-icon">📐</span>
          <div><div class="v2-same-name">${escapeHtml(v2.crossSpecs)}</div><div class="v2-same-size">${escapeHtml(v2.crossSpecsSub)}</div></div>
        </a>
      </div>
    </div>`;
}
