import { escapeHtml } from '../render-shell.js';

export function docsAccepting(ctx) {
  const { sameSize, sameHtml, v2, fullName, specData, lang, fmtV2, locField } = ctx;
  return `<!-- 4. 같은 사진으로 제출 가능한 서류 — 롤다운 (상세규정·반려사유는 수치 박스 탭으로 이동) -->
    <div class="v2-same-section">
      <details class="v2-same-acc">
        <summary><h2>${escapeHtml(v2.sameTitle)}</h2><span class="v2-same-count">${sameSize.length}</span></summary>
        <div class="v2-same-body">
          <div class="v2-same-sub">${escapeHtml(fmtV2(v2.sameSub, { name: fullName, size: locField(specData, 'size', lang) }))}</div>
          <div class="v2-same-grid">${sameHtml}</div>
        </div>
      </details>
    </div>`;
}
