import { escapeHtml } from '../render-shell.js';

export function specCard(ctx) {
  const { tabSpecLabel, v2, detailHtml, rejectHtml, restrictionsHtml, sourceHtml, specRows } = ctx;
  return `      <div class="v2-half-card v2-card-specs">
        <div class="v2-tabs" role="tablist">
          <button type="button" class="v2-tab on" data-pane="spec" onclick="v2SpecTab(this)">${escapeHtml(tabSpecLabel)}</button>
          ${detailHtml || restrictionsHtml ? `<button type="button" class="v2-tab" data-pane="detail" onclick="v2SpecTab(this)">${escapeHtml(v2.detailsTitle)}</button>` : ''}
          ${rejectHtml ? `<button type="button" class="v2-tab" data-pane="reject" onclick="v2SpecTab(this)">${escapeHtml(v2.rejectionTitle)}</button>` : ''}
        </div>
        <div class="v2-tabpane" data-pane="spec">
          <table class="v2-spec-table">
            ${specRows}
          </table>
          ${sourceHtml}
        </div>
        ${detailHtml || restrictionsHtml ? `<div class="v2-tabpane" data-pane="detail" hidden>
          ${detailHtml ? `<ul class="v2-detail-list">${detailHtml}</ul>` : ''}
          ${restrictionsHtml}
          ${sourceHtml}
        </div>` : ''}
        ${rejectHtml ? `<div class="v2-tabpane" data-pane="reject" hidden>
          <ol class="v2-reject-list">${rejectHtml}</ol>
        </div>` : ''}
      </div>`;
}
