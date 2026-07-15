import { escapeHtml } from '../render-shell.js';

export function specFunnelMarkup(ctx) {
  const { slug, lang, specData, v2, isPilot, typeName, fullName, market,
          t1RetouchOn, fmtV2, locField, escapeHtml: _eh } = ctx;
  const eh = escapeHtml;
  return `
    <!-- 3. 사진 만들기 (T1 셀프서브 즉시결제) -->
    <div class="v2-steps-section" id="v2-steps">
      <div class="v2-steps-title">${eh(fmtV2(v2.makeTitle, { name: fullName }))}</div>
      <div class="v2-steps-sub">${eh(fmtV2(v2.makeSub, { size: locField(specData, 'size', lang) }))}</div>

      <!-- Phase 1: 업로드 -->
      <div class="v2-make-layout" id="v2-phase-upload">
        <div class="v2-upload-with-guides">
          <div class="v2-upload-zone" id="v2-dropzone">
            <div class="v2-upload-icon">&#8615;</div>
            <div class="v2-upload-main-text">${eh(v2.dropText)}</div>
            <button type="button" class="v2-upload-btn">${eh(v2.selectBtn)}</button>
            <input type="file" id="v2-file-input" accept="image/*" style="display:none">
            <div class="v2-upload-hint">JPG, PNG, HEIC / max 10MB</div>
            <div class="v2-upload-guide">
              <div class="v2-guide-items">
                ${v2.guideChips.map(c => `<span>${eh(c)}</span>`).join('\n                ')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 에러 안내 — 페이즈 밖 공통 위치 (숨겨진 페이즈 내부에 있으면 무음, 2026-07-10 리뷰 확정) -->
      <div class="v2-error-msg" id="v2-error"></div>

      <!-- Phase 2: AI 검수 결과 -->
      <div class="v2-make-layout" id="v2-phase-check" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-check-img" src="" alt="${eh(v2.altCheck)}">
          </div>
          <div class="v2-checklist-side">
            <div class="v2-checklist-title">${isPilot ? '사진 확인 중' : eh(v2.checkTitle)}</div>
            <div class="v2-checklist-loading" id="v2-loading">
              <div class="v2-spinner"></div>
              <span>${isPilot ? '고객님의 사진을 확인하고 있습니다...' : eh(v2.checking)}</span>
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

      <!-- Phase 2.5: 규격 안착 시어터 (2026-07-07 작가님 연출 비전 — 전문가 대행을 보여준다) -->
      <div class="v2-make-layout" id="v2-phase-fit" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <div id="v2-fit-stage" style="position:relative;overflow:hidden;width:240px;height:320px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 10px 30px rgba(15,15,40,.28);">
              <div id="v2-fit-world" style="position:absolute;left:0;top:0;transform-origin:0 0;">
                <img id="v2-fit-img" src="" alt="규격 안착" style="display:block;max-width:none;max-height:none;">
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
            ${isPilot ? '' : '<div class="v2-checklist-title">규격 안착</div>'}
            <div id="v2-fit-badges" style="display:none;gap:8px;flex-wrap:wrap;margin:8px 0;"></div>
            <div id="v2-fit-note" style="display:none;font-size:12.5px;color:#555;background:#f6f6fb;border-radius:8px;padding:8px 10px;margin:6px 0;"></div>
            <div class="v2-checklist-summary" id="v2-fit-summary"></div>
            <div class="v2-action-buttons" id="v2-fit-actions" style="display:none;">
              <button class="v2-action-btn v2-btn-retry" id="v2-fit-change">다른 사진으로</button>
              <button class="v2-action-btn v2-btn-retouch" id="v2-fit-make">${isPilot ? '무료로 만들기' : '이대로 만들기'}</button>
            </div>
            ${isPilot ? `<div class="ip-fit-caption" id="ip-fit-caption" style="display:none;">배경 제거 + ${eh(typeName)} 규격 크롭 · 오늘 <span id="ip-fit-remaining">3</span>회 무료 · 로그인 불필요</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Phase 2: 결제 선택 (피사체 칩 + 의상 인라인 + 결제 카드) -->
      <div class="v2-make-layout" id="v2-phase-pay" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <img id="v2-preview-img" src="" alt="${eh(v2.altPreview)}">
            <button class="v2-change-photo" id="v2-change-photo">${eh(v2.btnOtherPhoto)}</button>
          </div>
          <div class="v2-pay-options">
            <!-- 피사체 선택 -->
            <div class="v2-subject-section" id="v2-subject-section">
              <div class="v2-attire-sub-label">찍힌 분</div>
              <div class="v2-attire-chips" id="v2-age-chips" data-field="age">
                <div class="v2-attire-chip selected" data-val="adult">성인</div>
                <div class="v2-attire-chip" data-val="teen">청소년</div>
                <div class="v2-attire-chip" data-val="baby">영유아</div>
              </div>
              <div class="v2-attire-chips" id="v2-gender-chips" data-field="gender">
                <div class="v2-attire-chip" data-val="m">남성</div>
                <div class="v2-attire-chip" data-val="f">여성</div>
              </div>
            </div>
            <!-- 의상 선택 (T1만) -->
            <div class="v2-attire-inline" id="v2-attire-inline" style="display:none;">
              <div class="v2-attire-sub-label">의상 선택</div>
              <div class="v2-attire-cards" id="v2-attire-cards">
                <div class="v2-attire-card selected" data-attire="asis">
                  <div class="v2-attire-card-icon">👔</div>
                  <div class="v2-attire-card-label">그대로</div>
                </div>
                <div class="v2-attire-card" data-attire="suit">
                  <div class="v2-attire-card-icon">🤵</div>
                  <div class="v2-attire-card-label">정장</div>
                </div>
                <div class="v2-attire-card" data-attire="blouse">
                  <div class="v2-attire-card-icon">👚</div>
                  <div class="v2-attire-card-label">블라우스</div>
                </div>
                <div class="v2-attire-card" data-attire="casual">
                  <div class="v2-attire-card-icon">🧥</div>
                  <div class="v2-attire-card-label">캐주얼</div>
                </div>
              </div>
              <div id="v2-attire-sub-options"></div>
              <div class="v2-attire-summary" id="v2-attire-summary">현재 의상 유지, 보정만 적용</div>
            </div>
            <!-- 결제 카드 -->
            <button class="v2-pay-btn v2-pay-instant" id="v2-pay-instant">
              <div class="v2-pay-title">${eh(fmtV2(v2.payTitle, { type: typeName }))}</div>
              <div class="v2-pay-price">${v2.payPrice}</div>
              <div class="v2-pay-desc">${eh(v2.payDesc)}</div>
            </button>
            ${lang === 'ko' ? `<div class="v2-pay-divider"><span>${eh(v2.orDivider)}</span></div>
            <button class="v2-pay-btn v2-pay-credit" id="v2-pay-credit">
              <div class="v2-pay-title">${eh(v2.creditTitle)}</div>
              <div class="v2-pay-price">10c <span style="font-size:13px;color:#888;font-weight:400;">(₩1,500)</span></div>
              <div class="v2-pay-desc">${eh(v2.creditDesc)}</div>
              <div class="v2-pay-desc" style="font-size:12px;margin-top:4px;">${v2.creditTopup}</div>
            </button>` : ''}
            <div class="v2-toss-widget" id="v2-toss-widget" style="display:none;">
              <div id="v2-pm"></div>
              <div id="v2-agree"></div>
              <button class="v2-action-btn v2-btn-retouch" id="v2-pay-confirm" style="width:100%;margin-top:12px;"></button>
            </div>
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

      ${isPilot ? `<!-- S3 땡큐 — 동일 프레임(2컬럼) 유지: 사진 자리 고정, 패널만 진화 (2026-07-10 작가님 연속성 지시) -->
      <div class="v2-make-layout" id="v2-phase-free" style="display:none;">
        <div class="v2-pay-grid">
          <div class="v2-pay-preview">
            <div class="ip-free-photo"><img id="ip-free-img" src="" alt="완성된 ${eh(typeName)} 규격 사진"></div>
            <div class="ip-free-spec">${eh(locField(specData, 'size', lang))}${specData.dpi ? ` · ${eh(String(specData.dpi))}dpi` : ''}${locField(specData, 'background', lang) ? ` · ${eh(locField(specData, 'background', lang))}` : ''}</div>
          </div>
          <div class="ip-free-side">
            <span class="ip-free-kicker">DONE · ${eh(slug.toUpperCase())}</span>
            <h3 class="ip-free-h">완성! ${eh(typeName)} 규격에 맞춰 만들었어요</h3>
            <div class="ip-free-btnrow">
              <button class="ip-btn ip-btn-primary" id="ip-free-download">다운로드</button>
              <button class="ip-btn ip-btn-ghost" id="ip-free-retry">다른 사진</button>
            </div>
            <div class="ip-free-cap">오늘 무료 <span id="ip-free-remaining">-</span>회 남음</div>
            ${t1RetouchOn ? `<div class="ip-card ip-card-t1">
              <div class="ip-card-head"><b>AI 보정</b><span class="ip-price">₩2,000</span></div>
              <ul class="ip-card-list">
                <li>AI 리터칭 — 내 얼굴 그대로, 더 단정하게</li>
                <li>AI 규격 검수</li>
                <li>${eh(typeName)} 규격 보정 파일</li>
              </ul>
              <button class="ip-btn ip-btn-mid" id="ip-t1-buy">AI 보정으로 업그레이드</button>
            </div>` : `<div class="ip-card ip-card-t1 ip-card-soon">
              <div class="ip-card-head"><b>AI 보정</b><span class="ip-price">₩2,000</span></div>
              <ul class="ip-card-list">
                <li>AI 리터칭 — 내 얼굴 그대로, 더 단정하게</li>
                <li>AI 규격 검수</li>
              </ul>
              <button class="ip-btn ip-btn-mid" id="ip-t1-buy" disabled>곧 열려요 — 준비 중</button>
            </div>`}
            <a class="ip-slot" id="ip-slot-credit" href="/credits.html">
              <span class="ip-slot-ic">🎁</span>
              <span class="ip-slot-txt"><b>간편로그인하면 10c 크레딧</b><span>AI 보정 1회가 ₩1,500이 돼요</span></span>
              <span class="ip-slot-tag">EVENT</span>
            </a>
          </div>
        </div>
      </div>` : ''}

    </div>`;
}
