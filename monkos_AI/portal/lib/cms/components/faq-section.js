import { escapeHtml } from '../render-shell.js';

export function faqSection(ctx) {
  const { faqHtml, v2 } = ctx;
  return `    <!-- 6. FAQ -->
    <div class="v2-faq-section">
      <h2>${escapeHtml(v2.faqTitle)}</h2>
      ${faqHtml}
    </div>`;
}
