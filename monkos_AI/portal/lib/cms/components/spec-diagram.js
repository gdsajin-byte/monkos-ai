import { escapeHtml } from '../render-shell.js';

export function specDiagram(ctx) {
  const { imgSrc, fallbackSrc, countryName, typeName, specData, lang, locField } = ctx;
  return `      <div class="v2-half-card v2-card-diagram">
        <img class="v2-diagram-img" src="${imgSrc}" alt="${escapeHtml(countryName)} ${escapeHtml(typeName)} ${escapeHtml(locField(specData, 'size', lang))}"
             onerror="this.src='${fallbackSrc}';this.onerror=function(){this.style.display='none'}">
      </div>`;
}
