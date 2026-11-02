import { escapeHtml } from '../render-shell.js';
import { getSpecCropParams } from '../../spec-crop.js';
import { recommendedRect, specCropRect, REF_CANVAS, REF_ASSET_PATH } from '../../framing-overlay.js';

// 추천 화각 안내 — 흰 배경 위에서도 보이도록 완성 범위 밖을 살짝 어둡게 하고 실선 밑에 어두운 선을 깐다
function framingGuideMarkup(slug, v2) {
  const eh = escapeHtml;
  const shoot = recommendedRect();
  const crop = specCropRect(getSpecCropParams(slug));
  const rectAttr = (r) => `x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"`;
  const { width, height } = REF_CANVAS;
  const cropLayer = crop ? `
              <path class="v2-framing-dim" fill-rule="evenodd" d="M0 0H${width}V${height}H0Z M${crop.x} ${crop.y}h${crop.w}v${crop.h}h${-crop.w}Z"/>
              <rect class="v2-framing-crop-casing" ${rectAttr(crop)}/>
              <rect class="v2-framing-crop" ${rectAttr(crop)}/>` : '';
  return `<figure class="v2-framing-guide">
            <div class="v2-framing-stage">
              <img src="${REF_ASSET_PATH}" width="${width}" height="${height}" alt="${eh(v2.framingAlt)}" loading="lazy" decoding="async">
              <svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">${cropLayer}
                <rect class="v2-framing-shoot" ${rectAttr(shoot)}/>
              </svg>
            </div>
            <figcaption>
              <p class="v2-framing-note">${eh(v2.framingNote)}</p>
              <ul class="v2-framing-legend">
                <li><i class="v2-framing-key-shoot"></i>${eh(v2.framingLegendShoot)}</li>
                ${crop ? `<li><i class="v2-framing-key-crop"></i>${eh(v2.framingLegendCrop)}</li>` : ''}
              </ul>
            </figcaption>
          </figure>`;
}

export function specFunnelMarkup(ctx) {
  const { slug, lang, specData, v2, typeName, fullName, market,
          t1RetouchOn, fmtV2, locField } = ctx;
  const bg = String(specData.background || '').trim();
  const isColoredBg = /파란|빨간|blue|red/i.test(bg);
  const showT1 = t1RetouchOn && !isColoredBg;
  const eh = escapeHtml;
  return `
    <!-- 3. 사진 만들기 (T0 무료 전언어 통일) -->
    <div class="v2-steps-section" id="v2-steps">
      <div class="v2-steps-title">${eh(fmtV2(v2.makeTitle, { name: fullName }))}</div>
      <div class="v2-steps-sub">${eh(fmtV2(v2.makeSub, { size: locField(specData, 'size', lang) }))}</div>

      <!-- Phase 1: 업로드 -->
      <div class="v2-make-layout" id="v2-phase-upload">
        <div class="v2-upload-with-guides">
          ${framingGuideMarkup(slug, v2)}
          <div class="v2-upload-zone" id="v2-dropzone">
            <div class="v2-upload-icon">&#8615;</div>
            <div class="v2-upload-main-text">${eh(v2.dropText)}</div>
            <button type="button" class="v2-upload-btn">${eh(v2.selectBtn)}</button>
            <input type="file" id="v2-file-input" accept="image/*" style="display:none">
            <div class="v2-upload-hint">${eh(v2.uploadHint || 'JPG · PNG · WEBP · HEIC / max 10MB')}</div>
            <div class="v2-upload-guide">
              <div class="v2-guide-items">
                ${v2.guideChips.map(c => `<span>${eh(c)}</span>`).join('\n                ')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="v2-error-msg" id="v2-error"></div>

      <!-- Phase 2: AI 검수 결과 -->
      <div class="v2-make-layout" id="v2-phase-check" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-check-img" src="" alt="${eh(v2.altCheck)}">
          </div>
          <div class="v2-checklist-side">
            <div class="v2-checklist-title">${eh(v2.checkTitle)}</div>
            <div class="v2-checklist-loading" id="v2-loading">
              <div class="v2-spinner"></div>
              <span>${eh(v2.checking)}</span>
            </div>
            <ul class="v2-checklist-items" id="v2-checklist-items"></ul>
            <div class="v2-checklist-summary" id="v2-summary"></div>
            <div class="v2-action-buttons" id="v2-check-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-btn-change">${eh(v2.btnOtherPhoto)}</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-btn-proceed">${eh(v2.btnProceed)}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2.5: 규격 안착 시어터 -->
      <div class="v2-make-layout" id="v2-phase-fit" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <div id="v2-fit-stage" style="position:relative;overflow:hidden;width:240px;height:320px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(15,15,40,.28);">
              <div id="v2-fit-world" style="position:absolute;left:0;top:0;transform-origin:0 0;">
                <img id="v2-fit-img" src="" alt="${eh(v2.fitAlt)}" style="display:block;max-width:none;max-height:none;">
                <div id="v2-fit-frame" style="display:none;position:absolute;border:3px solid #00B894;border-radius:2px;box-sizing:border-box;pointer-events:none;transition:opacity .5s, top .9s cubic-bezier(.22,.9,.24,1), left .9s cubic-bezier(.22,.9,.24,1), width .9s cubic-bezier(.22,.9,.24,1), height .9s cubic-bezier(.22,.9,.24,1);"></div>
                <div id="v2-fit-line-hair" style="border-top:2px dashed rgba(255,255,255,.6);"></div>
                <div id="v2-fit-line-crown" style="border-top:3px solid #FDCB6E;"></div>
                <div id="v2-fit-line-eye" style="border-top:3px solid #74b9ff;"></div>
                <div id="v2-fit-line-chin" style="border-top:3px solid rgba(255,255,255,.9);"></div>
              </div>
              <div id="v2-fit-dim-top" style="position:absolute;left:0;right:0;top:0;background:rgba(8,10,16,.36);height:0;transition:height .5s;pointer-events:none;"></div>
              <div id="v2-fit-dim-bot" style="position:absolute;left:0;right:0;bottom:0;background:rgba(8,10,16,.36);height:0;transition:height .5s;pointer-events:none;"></div>
            </div>
            <div id="v2-fit-status" style="text-align:center;margin-top:10px;font-size:13px;color:#777;min-height:18px;"></div>
          </div>
          <div class="v2-checklist-side">
            <div id="v2-fit-badges" style="display:none;gap:8px;flex-wrap:wrap;margin:8px 0;"></div>
            <div id="v2-fit-note" style="display:none;font-size:12.5px;color:#555;background:#f6f6fb;border-radius:8px;padding:8px 10px;margin:6px 0;"></div>
            <div class="v2-checklist-summary" id="v2-fit-summary"></div>
            <div class="v2-action-buttons" id="v2-fit-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-fit-change">${eh(v2.btnOtherPhoto)}</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-fit-make">${eh(v2.fitMakeBtn)}</button>
            </div>
            <div class="ip-fit-caption" id="ip-fit-caption" style="display:none;">${eh(fmtV2(v2.fitCaption, { type: typeName, n: '3' }))}</div>
          </div>
        </div>
      </div>

      <!-- Phase 결제 선택 -->
      <div class="v2-make-layout" id="v2-phase-pay" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-preview-img" src="" alt="${eh(v2.altPreview)}">
            <button class="v2-change-photo" id="v2-change-photo">${eh(v2.btnOtherPhoto)}</button>
          </div>
          <div class="v2-pay-options">
            <div class="v2-subject-section" id="v2-subject-section">
              <div class="v2-attire-sub-label">${eh(v2.subjectLabel)}</div>
              <div class="v2-attire-chips" id="v2-age-chips" data-field="age">
                <div class="v2-attire-chip selected" data-val="adult">${eh(v2.ageAdult)}</div>
                <div class="v2-attire-chip" data-val="teen">${eh(v2.ageTeen)}</div>
                <div class="v2-attire-chip" data-val="baby">${eh(v2.ageBaby)}</div>
              </div>
              <div class="v2-attire-chips" id="v2-gender-chips" data-field="gender">
                <div class="v2-attire-chip" data-val="m">${eh(v2.genderM)}</div>
                <div class="v2-attire-chip" data-val="f">${eh(v2.genderF)}</div>
              </div>
            </div>
            <!-- attire-picker mount (구형 인라인 의상 UI 제거 → 공유 컴포넌트 D5) -->
            <div id="v2-attire-mount" style="display:none;"></div>
            <!-- 결제 영역 에러 슬롯 (위젯 열기 전) — 전역 #v2-error 는 모바일 1열에서 약 1,100px 위라
                 결제 단계 에러가 시야 밖에 떴다 (2026-09-19 결함 A) -->
            <div class="v2-error-msg v2-pay-error" id="v2-pay-error-top"></div>
            <button class="v2-pay-btn v2-pay-instant" id="v2-pay-instant">
              <div class="v2-pay-title">${eh(fmtV2(v2.payTitle, { type: typeName }))}</div>
              <div class="v2-pay-price">${v2.payPrice}</div>
              <div class="v2-pay-desc">${eh(v2.payDesc)}</div>
            </button>
            <!-- 위젯은 누른 버튼 바로 아래에 열린다 — 구분선·크레딧 버튼 아래에 열려
                 "눌러도 반응 없다"로 보이던 동선 (2026-09-19 결함 D) -->
            <div class="v2-toss-widget" id="v2-toss-widget" style="display:none;">
              <div id="v2-pm"></div>
              <div id="v2-agree"></div>
              <div class="v2-error-msg v2-pay-error" id="v2-pay-error"></div>
              <button class="v2-action-btn v2-btn-retouch" id="v2-pay-confirm" style="width:100%;margin-top:12px;"></button>
              <!-- 결제하기 하단 고정(is-docked) 시 흐름 공백 유지용 (2026-09-19 결함 E) -->
              <div id="v2-pay-confirm-spacer" aria-hidden="true" style="height:0;"></div>
            </div>
            <div class="v2-pay-divider" id="v2-pay-divider"><span>${eh(v2.orDivider)}</span></div>
            <button class="v2-pay-btn v2-pay-credit" id="v2-pay-credit">
              <div class="v2-pay-title">${eh(v2.creditTitle)}</div>
              <div class="v2-pay-price">10c <span style="font-size:13px;color:#888;font-weight:400;">${market === 'kr' ? '(₩1,500)' : '($1)'}</span></div>
              <div class="v2-pay-desc">${eh(v2.creditDesc)}</div>
              ${market === 'kr' ? `<div class="v2-pay-desc" style="font-size:12px;margin-top:4px;">${v2.creditTopup}</div>` : `<div class="v2-pay-desc" style="font-size:12px;margin-top:4px;">${eh(v2.creditTopupGlobal)}</div>`}
            </button>
          </div>
        </div>
      </div>

      <!-- Phase 3: 생성 중 -->
      <div class="v2-make-layout" id="v2-phase-generating" style="display:none;">
        <div class="v2-generating">
          <div class="v2-spinner"></div>
          <div class="v2-gen-text" id="v2-gen-text">${eh(fmtV2(v2.genText, { type: typeName }))}</div>
          <div class="v2-gen-sub" id="v2-gen-sub">${eh(v2.genSub)}</div>
        </div>
      </div>

      <!-- Phase 4: 결과 + 다운로드 -->
      <div class="v2-make-layout" id="v2-phase-result" style="display:none;">
        <div class="v2-result-grid">
          <div class="v2-result-before">
            <div class="v2-result-label">${eh(v2.labelBefore)}</div>
            <img id="v2-result-before-img" src="" alt="${eh(v2.labelBefore)}">
          </div>
          <div class="v2-result-arrow">→</div>
          <div class="v2-result-after">
            <div class="v2-result-label">${eh(v2.labelAfter)}</div>
            <img id="v2-result-after-img" src="" alt="${eh(v2.labelAfter)}">
          </div>
        </div>
        <ul class="v2-checklist-items" id="v2-result-checklist" style="margin:16px auto 0;max-width:440px;text-align:left;"></ul>
        <div class="v2-result-actions">
          <button class="v2-download-btn" id="v2-download">${eh(v2.btnDownload)}</button>
          <button class="v2-action-btn v2-btn-retry" id="v2-btn-retry2">${eh(v2.btnRetry)}</button>
        </div>
      </div>

      <!-- S3 땡큐 — T0 무료 생성 결과 -->
      <div class="v2-make-layout" id="v2-phase-free" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <div class="ip-free-photo"><img id="ip-free-img" src="" alt="${eh(fmtV2(v2.freeAltDone, { type: typeName }))}"></div>
            <div class="ip-free-spec">${eh(locField(specData, 'size', lang))}${specData.dpi ? ` · ${eh(String(specData.dpi))}dpi` : ''}${locField(specData, 'background', lang) ? ` · ${eh(locField(specData, 'background', lang))}` : ''}</div>
          </div>
          <div class="ip-free-side">
            <span class="ip-free-kicker">DONE · ${eh(slug.toUpperCase())}</span>
            <h3 class="ip-free-h">${eh(fmtV2(v2.freeDoneH, { type: typeName }))}</h3>
            <div class="ip-free-btnrow">
              <button class="ip-btn ip-btn-primary" id="ip-free-download">${eh(v2.btnDownload)}</button>
              <button class="ip-btn ip-btn-ghost" id="ip-free-retry">${eh(v2.btnOtherPhoto)}</button>
            </div>
            ${/* n 슬롯에 JS(updateFreeRemainingUI) 갱신용 id 주입 — eh 이스케이프 우회 위해 토큰 치환 */''}
            <div class="ip-free-cap">${eh(fmtV2(v2.freeRemainCap, { n: '@N@' })).replace('@N@', '<span id="ip-free-remaining">-</span>')}</div>
            ${isColoredBg ? '' : showT1 ? `<div class="ip-card ip-card-t1">
              <div class="ip-card-head"><b>${eh(v2.t1Title)}</b><span class="ip-price">${eh(v2.t1Price)}</span></div>
              <ul class="ip-card-list">
                <li>${eh(v2.t1Desc1)}</li>
                <li>${eh(v2.t1Desc2)}</li>
                <li>${eh(fmtV2(v2.t1Desc3, { type: typeName }))}</li>
              </ul>
              <button class="ip-btn ip-btn-mid" id="ip-t1-buy">${eh(v2.t1BuyBtn)}</button>
            </div>` : `<div class="ip-card ip-card-t1 ip-card-soon">
              <div class="ip-card-head"><b>${eh(v2.t1Title)}</b><span class="ip-price">${eh(v2.t1Price)}</span></div>
              <ul class="ip-card-list">
                <li>${eh(v2.t1Desc1)}</li>
                <li>${eh(v2.t1Desc2)}</li>
              </ul>
              <button class="ip-btn ip-btn-mid" id="ip-t1-buy" disabled>${eh(v2.t1SoonBtn)}</button>
            </div>`}
            <a class="ip-slot" id="ip-slot-credit" href="/credits.html">
              <span class="ip-slot-ic">🎁</span>
              <span class="ip-slot-txt"><b>${eh(v2.creditSlotTitle)}</b><span>${eh(v2.creditSlotSub)}</span></span>
              <span class="ip-slot-tag">EVENT</span>
            </a>
          </div>
        </div>
      </div>

    </div>`;
}
