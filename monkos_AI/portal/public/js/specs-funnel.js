/* SpecsFunnel — 증명사진 처리 위젯 (업로드→fit→무료 생성→결제→T1 업셀)
   mount(el, opts): SSR 마크업 위에 이벤트를 바인딩하는 진입점.
   SSR이 window.__SPECS_CFG__를 인라인 주입 → 자동 마운트. */
var SpecsFunnel = (function(){
  function mount(el, CFG) {
  var T = CFG.t;
  // 의자잡기는 업로드 시점(서버 precheck가 워밍 발화) — 진입 워밍은 구경 트래픽에 ₩12/건 낭비라 제거
  // (2026-07-07 작가님: 사전분석+티어 선택 시간이 부팅 30s를 자연 은폐 — 체감 불가)
  var dropzone = document.getElementById('v2-dropzone');
  var fileInput = document.getElementById('v2-file-input');
  var errorMsg = document.getElementById('v2-error');
  var phaseUpload = document.getElementById('v2-phase-upload');
  var phaseCheck = document.getElementById('v2-phase-check');
  var phaseFit = document.getElementById('v2-phase-fit');
  var phasePay = document.getElementById('v2-phase-pay');
  var phaseGen = document.getElementById('v2-phase-generating');
  var phaseResult = document.getElementById('v2-phase-result');
  var phaseFree = document.getElementById('v2-phase-free'); // IDPASS 파일럿 전용 (비파일럿 null)
  var genTextEl = document.getElementById('v2-gen-text');
  var genSubEl = document.getElementById('v2-gen-sub');
  var uploadedBase64 = null;
  var payBusy = false;
  var pollTimer = null;
  // 결제 상태: token = generate용 paymentToken, remaining = 남은 재생성(null=미확정), consumed = 다운로드로 최종 소모됨
  var pay = { orderId: null, token: null, remaining: null, consumed: false, expiresAt: null };
  // 피사체 + 의상 선택 상태
  var subjectSelection = { age: 'adult', gender: null };
  // attireSelection은 sessionStorage 복원 호환용으로 존치 (persistOrder/restoreOrder)
  var attireSelection = { type: 'asis' };
  function syncSubjectChips(target){
    var sections = document.querySelectorAll('.v2-subject-section');
    sections.forEach(function(sec){
      sec.querySelectorAll('[data-field="age"] .v2-attire-chip').forEach(function(c){ c.classList.toggle('selected', c.dataset.val === subjectSelection.age); });
      sec.querySelectorAll('[data-field="gender"] .v2-attire-chip').forEach(function(c){ c.classList.toggle('selected', c.dataset.val === subjectSelection.gender); });
      var genderRow = sec.querySelector('[data-field="gender"]');
      if(genderRow) genderRow.style.display = subjectSelection.age === 'baby' ? 'none' : '';
    });
  }

  if(!dropzone) return;

  /* ─── GA4 퍼널 계측 (v1 idphoto-kr 파라미터 구조 준용) ───
     - typeof gtag 가드 + 페이지 로드당 1회 발화 가드(generate_click은 재생성 포함 매회)
     - paymentToken 등 인증 토큰·시크릿은 이벤트 파라미터에 절대 미포함 (transaction_id = orderId) */
  // 불편 신고 맥락 — 고객이 적지 않아도 기기·단계·마지막 에러가 신고 글에 따라붙는다 (2026-09-19)
  var rpt = { lastError: '', lastErrorStage: '', widgetOpened: false, confirmClicked: false };
  var gaFired = {};
  var GA_PAY = CFG.market === 'kr'
    ? { payment_provider: 'toss', currency: 'KRW', value: 2000 }
    : { payment_provider: 'lemon', currency: 'USD', value: 1.99 };
  function gaTrack(name, params, repeat){
    if(name === 'pay_widget_open') rpt.widgetOpened = true;
    else if(name === 'pay_confirm_click') rpt.confirmClicked = true;
    if(typeof gtag !== 'function') return;
    if(!repeat && gaFired[name]) return;
    gaFired[name] = true;
    var p = { spec_type: CFG.slug, auth_method: '', lang: document.documentElement.lang || 'ko', service: 'specs-v2', market: CFG.market };
    if(params){ for(var k in params){ if(Object.prototype.hasOwnProperty.call(params, k)) p[k] = params[k]; } }
    gtag('event', name, p);
  }
  // 결제 이벤트는 페이지 로드가 아닌 주문(orderId) 단위 1회 가드 — 같은 페이지에서
  // 2번째 실결제(다운로드 소모 후 다시 만들기 / GENERATE_LIMIT 후 재결제, 레몬 팝업 경로)가
  // 리로드 없이 발생하므로 이벤트명 가드만으로는 실매출 purchase가 소실된다.
  var gaOrderFired = {};
  function gaTrackOrder(name, orderId, params){
    var key = name + ':' + orderId;
    if(gaOrderFired[key]) return;
    gaOrderFired[key] = true;
    gaTrack(name, params, true);
  }
  function gaTrackPurchase(orderId){
    gaTrackOrder('purchase', orderId, { transaction_id: orderId, payment_provider: GA_PAY.payment_provider, currency: GA_PAY.currency, value: GA_PAY.value });
    adsConversion(CFG.adsConv && CFG.adsConv.labelPurchase, GA_PAY.value, GA_PAY.currency);
  }
  /* ─── 결제 실패 계측 (2026-09-19 신설) ───
     init 3명·7회 대비 승인 호출 0건 / purchase 0건인데도 실패가 어디에도 남지 않았다.
     GA는 유실 가능 → 사유의 정본은 서버 로그(directOrders.lastFail).
     ⚠️ 토스 키·토큰·개인정보는 파라미터에 절대 넣지 않는다 (헌법 4조 1항). */
  function reportPayFail(stage, code, message){
    var safeCode = String(code || 'UNKNOWN').slice(0, 60);
    gaTrack('pay_fail', {
      payment_provider: GA_PAY.payment_provider,
      fail_stage: stage,
      fail_code: safeCode,
      in_app: isInApp()
    }, true); // 한 고객이 여러 번 실패하므로 1회 가드 해제
    if(!pay.orderId) return;
    try{
      fetch('/api/payments/direct/fail', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({
          orderId: pay.orderId, stage: stage, code: safeCode,
          message: String(message || '').slice(0, 200),
          vw: window.innerWidth, vh: window.innerHeight, inApp: isInApp()
        })
      }).catch(function(){});
    }catch(e){}
  }
  function adsConversion(label, value, currency){
    if(typeof gtag !== 'function' || !CFG.adsConv || !label) return;
    var p = { send_to: 'AW-' + CFG.adsConv.id + '/' + label };
    if(value != null){ p.value = value; p.currency = currency || 'KRW'; }
    gtag('event', 'conversion', p);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ gaTrack('spec_select'); });
  } else {
    gaTrack('spec_select');
  }

  var GEN_TEXT_DEFAULT = genTextEl ? genTextEl.textContent : '';
  var GEN_SUB_DEFAULT = genSubEl ? genSubEl.textContent : '';
  var ORDER_KEY = 'monkos_specs_order';
  var IMG_KEY = 'monkos_specs_img';

  function showPhase(phase){
    [phaseUpload, phaseCheck, phaseFit, phasePay, phaseGen, phaseResult, phaseFree].forEach(function(p){ if(p) p.style.display='none'; });
    if(phase) phase.style.display='';
    scheduleDock(); // 결제 단계를 벗어나면 하단 고정 버튼을 즉시 해제
  }
  function setGenMessage(text, sub){
    if(genTextEl) genTextEl.textContent = text;
    if(genSubEl) genSubEl.textContent = sub || '';
  }
  /* 백업 처리 안내 (2026-10-27 DESIGN 매팅워밍조건부 §2-2·2-3) — precheck engineReady===false일 때만.
     정상(engineReady true·미수신)이면 현행 문구 그대로. 문구 키가 없는 언어는 안내를 생략한다. */
  function engineBackup(){ return !!(precheckData && precheckData.engineReady === false); }
  function showEngineNotice(on){
    var el = document.getElementById('v2-engine-notice');
    if(!on || !T.engineBackupNotice){ if(el) el.style.display = 'none'; return; }
    if(!el){
      var anchor = document.getElementById('v2-fit-actions');
      if(!anchor || !anchor.parentNode) return;
      el = document.createElement('p');
      el.id = 'v2-engine-notice';
      el.setAttribute('role', 'status');
      el.style.cssText = 'margin:10px 0 0;font-size:13px;line-height:1.5;color:#3b6ea8;text-align:center;';
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    el.textContent = T.engineBackupNotice;
    el.style.display = '';
  }
  /* 화각 부족 경고 (2026-11-02) — precheck fov.verdict==='warn'일 때만. 진행은 막지 않는다. 문구 키가 없는 언어는 생략 */
  /* 화각 부족 = 사용 불가 (2026-11-02 작가님 직접) — 무료 만들기를 닫고 AI 경로 + 다른 사진만 연다. 사진은 그대로 결제로 넘어간다 */
  var fovAiOnly = false;
  function applyFovAiOnly(fov){
    fovAiOnly = true;
    var box = document.getElementById('v2-fit-summary');
    box.className = '';
    box.textContent = '';
    box.style.cssText = 'margin:0 0 12px;padding:14px 16px;border:2px solid #dc2626;border-radius:12px;background:#fef2f2;text-align:left;';
    var h = document.createElement('div');
    h.id = 'v2-fov-title';
    h.setAttribute('role', 'alert');
    h.style.cssText = 'font-size:20px;line-height:1.35;font-weight:800;color:#b91c1c;';
    h.textContent = fovText('fov_unusable_title', fov);
    var p = document.createElement('div');
    p.style.cssText = 'margin-top:8px;font-size:15px;line-height:1.5;color:#111827;';
    p.textContent = fovText(fov.cause === 'off_center' ? 'fov_unusable_body_off' : 'fov_unusable_body', fov);
    box.appendChild(h); box.appendChild(p);
    var mk = document.getElementById('v2-fit-make');
    mk.textContent = T.fov_ai_btn.replace('{price}', CFG.price || '');
    if(T.fov_ai_hint && !document.getElementById('v2-fov-hint')){
      var hint = document.createElement('p');
      hint.id = 'v2-fov-hint';
      hint.style.cssText = 'width:100%;margin:0;font-size:12px;line-height:1.45;color:#6b7280;text-align:center;';
      hint.textContent = T.fov_ai_hint;
      mk.parentNode.insertBefore(hint, mk); // 버튼 영역은 역순 배치 — DOM 앞이 화면 아래
    }
    var ch = document.getElementById('v2-fit-change');
    if(ch){ if(!ch.dataset.label) ch.dataset.label = ch.textContent; ch.textContent = T.fov_other_btn; }
    ['ip-fit-caption', 'ip-fit-t2-link'].forEach(function(id){ var e = document.getElementById(id); if(e) e.style.display = 'none'; });
  }
  function resetFovAiOnly(){
    fovAiOnly = false;
    var box = document.getElementById('v2-fit-summary');
    if(box) box.style.cssText = '';
    var hint = document.getElementById('v2-fov-hint');
    if(hint && hint.parentNode) hint.parentNode.removeChild(hint);
    var ch = document.getElementById('v2-fit-change');
    if(ch && ch.dataset.label) ch.textContent = ch.dataset.label;
  }
  function showFovNotice(msg){
    var el = document.getElementById('v2-fov-notice');
    if(!msg){ if(el) el.style.display = 'none'; return; }
    if(!el){
      var anchor = document.getElementById('v2-fit-actions');
      if(!anchor || !anchor.parentNode) return;
      el = document.createElement('p');
      el.id = 'v2-fov-notice';
      el.setAttribute('role', 'status');
      el.style.cssText = 'margin:10px 0 0;font-size:13px;line-height:1.5;color:#a8693b;text-align:center;';
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    el.textContent = msg;
    el.style.display = '';
  }
  /* 판정 문구 — {spec}·{side} 치환. fov_wide에는 원본 사진 안내를 덧붙인다 */
  function fovText(key, fov){
    var txt = T[key];
    if(!txt) return null;
    var o = (fov && fov.outside) || {};
    txt = txt.replace('{spec}', CFG.specLabel || '').replace('{side}', (o.left > o.right) ? (T.fov_side_left || '') : (T.fov_side_right || ''));
    if(key.indexOf('_fov_wide') >= 0 && T.fov_wide_note) txt += ' ' + T.fov_wide_note;
    return txt;
  }
  /* 내 사진 위 규격 틀 (DESIGN 추천화각 §5-3) — 좌표는 판정 응답의 프레임(원본 좌표).
     틀 밖으로 잘려 나가는 부분은 어둡게, 틀이 사진을 넘친 부분은 빨강, 부족한 쪽 테두리는 주황. */
  function clearFovOverlay(){
    var old = document.getElementById('v2-fov-overlay');
    if(old && old.parentNode) old.parentNode.removeChild(old);
    var ci = document.getElementById('v2-check-img');
    if(ci) ci.style.visibility = '';
  }
  function fovOverlaySvg(fov, topShort){
    var NS = 'http://www.w3.org/2000/svg';
    var f = fov.frame, W = fov.imageSize.width, H = fov.imageSize.height, o = fov.outside;
    function el(name, attrs){
      var n = document.createElementNS(NS, name);
      for(var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }
    var ux = Math.min(0, f.x), uy = Math.min(0, f.y);
    var uw = Math.max(W, f.x + f.w) - ux, uh = Math.max(H, f.y + f.h) - uy;
    var svg = el('svg', { id: 'v2-fov-overlay', viewBox: ux + ' ' + uy + ' ' + uw + ' ' + uh, preserveAspectRatio: 'xMidYMid meet', role: 'img' });
    svg.appendChild(el('image', { href: uploadedBase64, x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'none' }));
    // 틀 밖으로 잘려 나가는 부분
    svg.appendChild(el('path', { d: 'M' + ux + ' ' + uy + 'h' + uw + 'v' + uh + 'h' + (-uw) + 'z M' + f.x + ' ' + f.y + 'h' + f.w + 'v' + f.h + 'h' + (-f.w) + 'z', fill: 'rgba(15,15,40,.45)', 'fill-rule': 'evenodd' }));
    // 틀이 사진을 넘친 부분 = 사진 사각형 바깥 + 틀 안
    var red = 'rgba(220,38,38,.45)';
    if(f.x < 0) svg.appendChild(el('rect', { x: f.x, y: f.y, width: -f.x, height: f.h, fill: red }));
    if(f.x + f.w > W) svg.appendChild(el('rect', { x: W, y: f.y, width: f.x + f.w - W, height: f.h, fill: red }));
    var ix = Math.max(0, f.x), iw = Math.min(W, f.x + f.w) - ix;
    if(f.y < 0) svg.appendChild(el('rect', { x: ix, y: f.y, width: iw, height: -f.y, fill: red }));
    if(f.y + f.h > H) svg.appendChild(el('rect', { x: ix, y: H, width: iw, height: f.y + f.h - H, fill: red }));
    // 틀
    var sw = Math.max(uw, uh) * 0.008;
    svg.appendChild(el('rect', { x: f.x, y: f.y, width: f.w, height: f.h, fill: 'none', stroke: '#ffffff', 'stroke-width': sw }));
    // 부족한 쪽 테두리
    var orange = '#f97316', osw = sw * 1.8, EPS = 0.005;
    function side(x1, y1, x2, y2){ svg.appendChild(el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: orange, 'stroke-width': osw })); }
    if(o.left > EPS) side(f.x, f.y, f.x, f.y + f.h);
    if(o.right > EPS) side(f.x + f.w, f.y, f.x + f.w, f.y + f.h);
    if(o.bottom > EPS) side(f.x, f.y + f.h, f.x + f.w, f.y + f.h);
    if(o.top > EPS || topShort) side(f.x, f.y, f.x + f.w, f.y);
    return svg;
  }
  /* 반려 화면: 확인 이미지 자리 / 통과 화면: fit 스테이지 위 */
  function showFovOverlay(data){
    clearFovOverlay();
    var fov = data && data.fov;
    if(!fov || !fov.frame || !fov.imageSize || !fov.outside) return;
    var topShort = !!(data.crownCheck && data.crownCheck.touched);
    var svg = fovOverlaySvg(fov, topShort);
    if(data.measurable === false){
      var ci = document.getElementById('v2-check-img');
      if(!ci || !ci.parentNode) return;
      ci.style.visibility = 'hidden';
      svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:#fff;';
      if(getComputedStyle(ci.parentNode).position === 'static') ci.parentNode.style.position = 'relative';
      ci.parentNode.appendChild(svg);
    } else {
      var stage = document.getElementById('v2-fit-stage');
      if(!stage) return;
      svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;background:#fff;z-index:2;';
      stage.appendChild(svg);
    }
  }
  function showError(msg){ errorMsg.textContent = msg; errorMsg.classList.add('show'); noteError(msg, errorMsg); }
  function hideError(){ errorMsg.classList.remove('show'); hidePayError(); hideReportLink(); }
  /* 결제 영역 에러 (2026-09-19 결함 A) — 전역 #v2-error 는 결제 단계 *위*의 정적 요소라
     모바일 1열에서 결제 버튼 약 1,100px 위에 뜬다. 거절·취소 문구가 시야 밖에 있으면
     고객에겐 "눌러도 반응 없는 버튼"이 된다. 결제 단계 에러는 버튼 바로 위 슬롯에 띄운다. */
  var payErrorEl = document.getElementById('v2-pay-error');
  var payErrorTopEl = document.getElementById('v2-pay-error-top');
  function hidePayError(){
    [payErrorEl, payErrorTopEl].forEach(function(el){ if(el){ el.classList.remove('show'); el.textContent = ''; } });
  }
  function isWidgetOpen(){
    var wrap = document.getElementById('v2-toss-widget');
    return !!(wrap && wrap.style.display !== 'none');
  }
  var payErrSeq = 0;
  function showPayError(msg){
    payErrSeq++;
    var el = (isWidgetOpen() && payErrorEl) ? payErrorEl : payErrorTopEl;
    if(!el) return showError(msg);
    hidePayError();
    el.textContent = msg;
    el.classList.add('show');
    noteError(msg, el);
    try{ el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(e){}
    scheduleDock();
  }
  // 인앱 브라우저(WKWebView 계열) 판정 — 다운로드 폴백과 결제 실패 계측이 공유
  function isInApp(){
    return /(GSA\/|FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER\(|DaumApps|; wv\))/i.test(navigator.userAgent || '');
  }

  /* ─── 불편 신고 → 게시판 연동 (2026-09-19 작가님 지시) ───
     입구 3곳: 에러 문구 바로 아래 / 결제 위젯 하단 / 퍼널 하단 상시. 페이지 이탈 없는 인라인 시트.
     서버 POST /api/board/report — 비공개 글로 접수되고 기기·단계·마지막 에러가 자동 첨부된다. */
  var RPT_DEFAULT = {
    ko: { link: '안 되나요? 바로 알려주세요', footer: '의견·불편 신고', title: '무엇이 안 되었나요?', sub: '한 줄이면 충분합니다. 사용 중인 기기와 화면 정보는 자동으로 함께 전달됩니다.', ph: '예) 결제하기를 눌러도 넘어가지 않아요', email: '답변 받을 이메일 (선택)', submit: '보내기', cancel: '닫기', sending: '보내는 중…', done: '접수했습니다. 확인 후 답글로 안내드리겠습니다.', view: '접수 내용·답글 보기', empty: '내용을 입력해 주세요.', fail: '전송하지 못했습니다. 잠시 후 다시 시도해 주세요.', wait: '방금 접수되었습니다. 1분 뒤 다시 보내실 수 있습니다.' },
    ja: { link: 'うまくいきませんか？すぐお知らせください', footer: 'ご意見・不具合の報告', title: '何がうまくいきませんでしたか？', sub: '一行で十分です。ご利用中の端末と画面の情報は自動で一緒に送信されます。', ph: '例）決済ボタンを押しても進みません', email: '返信用メールアドレス（任意）', submit: '送信', cancel: '閉じる', sending: '送信中…', done: '受け付けました。確認のうえ返信でご案内いたします。', view: '受付内容・返信を見る', empty: '内容を入力してください。', fail: '送信できませんでした。しばらくしてからもう一度お試しください。', wait: '先ほど受け付けました。1分後に再度送信できます。' },
    en: { link: 'Not working? Tell us right away', footer: 'Feedback & problem report', title: 'What went wrong?', sub: 'One line is enough. Your device and screen details are sent along automatically.', ph: 'e.g. Nothing happens when I press Pay', email: 'Email for a reply (optional)', submit: 'Send', cancel: 'Close', sending: 'Sending…', done: 'Received. We will look into it and reply.', view: 'View your report and replies', empty: 'Please enter a message.', fail: 'Could not send. Please try again in a moment.', wait: 'We just received your report. You can send another in a minute.' },
    es: { link: '¿No funciona? Avísenos ahora', footer: 'Opiniones y aviso de problemas', title: '¿Qué ha fallado?', sub: 'Con una línea basta. Los datos de su dispositivo y pantalla se envían automáticamente.', ph: 'p. ej. No pasa nada al pulsar Pagar', email: 'Correo para la respuesta (opcional)', submit: 'Enviar', cancel: 'Cerrar', sending: 'Enviando…', done: 'Recibido. Lo revisaremos y le responderemos.', view: 'Ver su aviso y las respuestas', empty: 'Escriba un mensaje.', fail: 'No se pudo enviar. Inténtelo de nuevo en un momento.', wait: 'Acabamos de recibir su aviso. Podrá enviar otro en un minuto.' }
  };
  var RL = (function(){
    var lang = (document.documentElement.lang || 'ko').slice(0, 2).toLowerCase();
    var base = RPT_DEFAULT[lang] || RPT_DEFAULT.en, o = {};
    for(var k in base){ if(Object.prototype.hasOwnProperty.call(base, k)) o[k] = (T && T['report_' + k]) || base[k]; }
    return o;
  })();
  function currentPhaseName(){
    var map = [[phaseUpload,'upload'],[phaseCheck,'check'],[phaseFit,'fit'],[phasePay,'pay'],[phaseGen,'generating'],[phaseResult,'result'],[phaseFree,'free']];
    for(var i = 0; i < map.length; i++){ if(map[i][0] && map[i][0].style.display !== 'none') return map[i][1]; }
    return '';
  }
  var reportLinkEl = null;
  function noteError(msg, anchorEl){
    rpt.lastError = String(msg || '').slice(0, 200);
    rpt.lastErrorStage = currentPhaseName();
    try{
      if(!reportLinkEl){
        reportLinkEl = document.createElement('button');
        reportLinkEl.type = 'button';
        reportLinkEl.className = 'v2-report-link v2-report-link-err';
        reportLinkEl.textContent = RL.link;
        reportLinkEl.addEventListener('click', function(){ openReportSheet('error'); });
      }
      if(anchorEl && anchorEl.parentNode){ anchorEl.parentNode.insertBefore(reportLinkEl, anchorEl.nextSibling); }
      reportLinkEl.style.display = '';
      // 위젯 안에서 에러 링크가 뜨면 같은 문구의 상시 링크는 접는다 (한 화면 중복 방지)
      var payLink = document.querySelector('.v2-report-link-pay');
      if(payLink) payLink.style.display = (anchorEl && anchorEl.id === 'v2-pay-error') ? 'none' : '';
    }catch(e){}
  }
  function hideReportLink(){
    if(reportLinkEl) reportLinkEl.style.display = 'none';
    var payLink = document.querySelector('.v2-report-link-pay'); if(payLink) payLink.style.display = '';
  }
  function reportContext(){
    var ref = '';
    try{ ref = document.referrer ? new URL(document.referrer).hostname : ''; }catch(e){}
    return {
      slug: CFG.slug || '', lang: (document.documentElement.lang || 'ko'), market: CFG.market || '',
      phase: currentPhaseName(), lastError: rpt.lastError, lastErrorStage: rpt.lastErrorStage,
      orderId: pay.orderId || '', payProvider: GA_PAY.payment_provider,
      widgetOpened: rpt.widgetOpened, confirmClicked: rpt.confirmClicked,
      vw: window.innerWidth || 0, vh: window.innerHeight || 0, dpr: window.devicePixelRatio || 1,
      inApp: isInApp(), referrerHost: ref
    };
  }
  var reportSheet = null, reportBusy = false;
  function openReportSheet(entry){
    gaTrack('report_open', { report_entry: entry || '', report_phase: currentPhaseName() }, true);
    if(!reportSheet){
      reportSheet = document.createElement('div');
      reportSheet.className = 'v2-report-overlay';
      reportSheet.innerHTML =
        '<div class="v2-report-sheet" role="dialog" aria-modal="true">' +
          '<div class="v2-report-title"></div><div class="v2-report-sub"></div>' +
          '<textarea class="v2-report-text" maxlength="2000" rows="4"></textarea>' +
          '<input class="v2-report-email" type="email" inputmode="email" autocomplete="email" maxlength="254">' +
          '<div class="v2-report-msg"></div>' +
          '<div class="v2-report-actions"><button type="button" class="v2-report-cancel"></button><button type="button" class="v2-report-submit"></button></div>' +
        '</div>';
      document.body.appendChild(reportSheet);
      reportSheet.querySelector('.v2-report-title').textContent = RL.title;
      reportSheet.querySelector('.v2-report-sub').textContent = RL.sub;
      reportSheet.querySelector('.v2-report-text').placeholder = RL.ph;
      reportSheet.querySelector('.v2-report-email').placeholder = RL.email;
      reportSheet.querySelector('.v2-report-cancel').textContent = RL.cancel;
      reportSheet.querySelector('.v2-report-submit').textContent = RL.submit;
      reportSheet.addEventListener('click', function(e){ if(e.target === reportSheet) closeReportSheet(); });
      reportSheet.querySelector('.v2-report-cancel').addEventListener('click', closeReportSheet);
      reportSheet.querySelector('.v2-report-submit').addEventListener('click', submitReport);
    }
    var msgEl = reportSheet.querySelector('.v2-report-msg');
    msgEl.textContent = ''; msgEl.className = 'v2-report-msg';
    reportSheet.querySelector('.v2-report-submit').style.display = ''; // 직전 접수 완료로 숨겨진 버튼 복원
    reportSheet.classList.add('open');
    undockConfirm(); // 하단 고정된 결제하기 버튼이 시트를 가리지 않게
    try{ reportSheet.querySelector('.v2-report-text').focus(); }catch(e){}
  }
  function closeReportSheet(){
    if(reportSheet) reportSheet.classList.remove('open');
    scheduleDock();
  }
  function submitReport(){
    if(reportBusy || !reportSheet) return;
    var txt = reportSheet.querySelector('.v2-report-text');
    var em = reportSheet.querySelector('.v2-report-email');
    var msgEl = reportSheet.querySelector('.v2-report-msg');
    var btn = reportSheet.querySelector('.v2-report-submit');
    var content = (txt.value || '').trim();
    if(!content){ msgEl.textContent = RL.empty; msgEl.className = 'v2-report-msg err'; return; }
    reportBusy = true; btn.disabled = true; btn.textContent = RL.sending;
    fetch('/api/board/report', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content, email: (em.value || '').trim(), context: reportContext() })
    })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }); })
    .then(function(res){
      reportBusy = false; btn.disabled = false; btn.textContent = RL.submit;
      if(res.ok && res.d && res.d.viewUrl){
        gaTrack('report_submit', { report_phase: currentPhaseName() }, true);
        txt.value = '';
        msgEl.className = 'v2-report-msg ok';
        msgEl.textContent = RL.done + ' ';
        var a = document.createElement('a');
        a.href = res.d.viewUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = RL.view;
        msgEl.appendChild(a);
        btn.style.display = 'none';
      } else {
        msgEl.className = 'v2-report-msg err';
        msgEl.textContent = res.status === 429 ? RL.wait : RL.fail;
      }
    })
    .catch(function(){
      reportBusy = false; btn.disabled = false; btn.textContent = RL.submit;
      msgEl.className = 'v2-report-msg err'; msgEl.textContent = RL.fail;
    });
  }
  // 상시 입구 2곳 — 결제 위젯 하단 · 퍼널 하단
  (function mountReportEntries(){
    try{
      var mk = function(cls, label, entry){
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'v2-report-link ' + cls; b.textContent = label;
        b.addEventListener('click', function(){ openReportSheet(entry); });
        return b;
      };
      var wrap = document.getElementById('v2-toss-widget');
      if(wrap) wrap.appendChild(mk('v2-report-link-pay', RL.link, 'pay'));
      if(el) el.appendChild(mk('v2-report-link-footer', RL.footer, 'footer'));
    }catch(e){}
  })();

  /* ─── 결제하기 버튼 하단 고정 (2026-09-19 결함 E) ───
     토스 위젯 영역 실측 629px(375폭) — 가용 높이가 그보다 짧은 폰은 결제하기 버튼이 화면 아래에 남는다.
     렌더 직후 scrollIntoView 1회로는 약관 펼침·결제수단 전환 때마다 다시 밀린다. */
  var dockRaf = null;
  function undockConfirm(){
    var btn = document.getElementById('v2-pay-confirm');
    var spacer = document.getElementById('v2-pay-confirm-spacer');
    if(btn) btn.classList.remove('is-docked');
    if(spacer) spacer.style.height = '0px';
  }
  function updateDock(){
    var wrap = document.getElementById('v2-toss-widget');
    var btn = document.getElementById('v2-pay-confirm');
    var spacer = document.getElementById('v2-pay-confirm-spacer');
    if(!wrap || !btn || !spacer) return;
    if(!isWidgetOpen() || !phasePay || phasePay.style.display === 'none') return undockConfirm();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var wr = wrap.getBoundingClientRect();
    var inView = wr.bottom > 0 && wr.top < vh - 40;
    // 고정 중에는 버튼이 흐름 밖이라 스페이서가 '원래 자리'의 정본
    var naturalBottom = btn.classList.contains('is-docked')
      ? spacer.getBoundingClientRect().bottom
      : btn.getBoundingClientRect().bottom;
    if(inView && naturalBottom > vh - 8){
      if(!btn.classList.contains('is-docked')){
        btn.classList.add('is-docked');
        spacer.style.height = (btn.offsetHeight + 12) + 'px';
      }
    } else undockConfirm();
  }
  function scheduleDock(){
    if(dockRaf) return;
    dockRaf = requestAnimationFrame(function(){ dockRaf = null; updateDock(); });
  }
  window.addEventListener('scroll', scheduleDock, { passive: true });
  window.addEventListener('resize', scheduleDock);
  if(window.ResizeObserver){
    var dockRo = new ResizeObserver(scheduleDock);
    ['v2-pm','v2-agree','v2-toss-widget'].forEach(function(id){
      var e = document.getElementById(id); if(e) dockRo.observe(e);
    });
  }
  function focusTossWidget(){
    var wrap = document.getElementById('v2-toss-widget');
    if(!wrap) return;
    try{ wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }); }catch(e){}
    scheduleDock();
  }
  function setWidgetOpenUI(open){
    var opts = document.querySelector('#v2-phase-pay .v2-pay-options');
    if(opts) opts.classList.toggle('v2-widget-open', !!open);
    if(!open) undockConfirm();
  }
  /* 이미지 기기 저장 — data URL 앵커는 인앱 브라우저(구글앱·카카오 등 WKWebView)에서 무반응 (2026-07-18 작가님 실사고).
     blob 앵커 우선, 인앱·iOS에서 공유시트(파일) 폴백, 최후엔 길게 눌러 저장 안내. */
  function saveImageToDevice(dataUrl, fileName){
    try {
      var b64 = dataUrl.split(',')[1];
      var bin = atob(b64), arr = new Uint8Array(bin.length);
      for(var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      var blob = new Blob([arr], { type: 'image/png' });
      var inApp = isInApp();
      if(inApp && navigator.canShare && window.File){
        try {
          var f = new File([blob], fileName.replace(/\.jpg$/, '.png'), { type: 'image/png' });
          if(navigator.canShare({ files: [f] })){
            navigator.share({ files: [f] }).catch(function(){ blobAnchor(); });
            return;
          }
        } catch(e){ /* 폴스루 */ }
      }
      blobAnchor();
      function blobAnchor(){
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
        // 인앱은 blob 앵커도 무반응일 수 있음 — 길게 눌러 저장 안내 (iOS 사파리 정상 경로엔 미표시)
        if(inApp) showError(T.longPressSave || '저장이 안 되면 결과 사진을 길게 눌러 이미지 저장을 선택해 주세요.');
      }
    } catch(e){
      var a2 = document.createElement('a');
      a2.href = dataUrl; a2.download = fileName;
      document.body.appendChild(a2); a2.click(); a2.remove();
    }
  }
  function returnBase(){ return location.origin + location.pathname; }
  function hasUsableToken(){
    if(!pay.token || pay.consumed) return false;
    if(pay.expiresAt && Date.now() > pay.expiresAt){
      pay.token = null; pay.remaining = null; pay.expiresAt = null;
      return false;
    }
    return pay.remaining === null || pay.remaining > 0;
  }

  /* ─── 리다이렉트 생존 저장소 (sessionStorage) ─── */
  // 실패 복귀(?toss=fail) 시 주문을 새로 만들지 않고 위젯을 재오픈하기 위한 init 응답 보존 (결함 F).
  // clientKey 는 위젯 연동용 공개 키(페이지에 이미 노출되는 값) — 시크릿 아님.
  var lastTossInit = null;
  function persistOrder(){
    try{ sessionStorage.setItem(ORDER_KEY, JSON.stringify({ orderId: pay.orderId, token: pay.token, remaining: pay.remaining, expiresAt: pay.expiresAt, slug: CFG.slug, ts: Date.now(), attire: attireSelection, subject: subjectSelection, toss: lastTossInit })); }catch(e){}
  }
  function loadOrder(){
    try{
      var d = JSON.parse(sessionStorage.getItem(ORDER_KEY) || 'null');
      if(!d || d.slug !== CFG.slug) return null;
      if(d.expiresAt && Date.now() > d.expiresAt){
        sessionStorage.removeItem(ORDER_KEY);
        return null;
      }
      return d;
    }catch(e){ return null; }
  }
  function clearStored(){
    try{ sessionStorage.removeItem(ORDER_KEY); sessionStorage.removeItem(IMG_KEY); }catch(e){}
  }
  // 10MB 원본 base64는 sessionStorage 쿼터(~5MB) 초과 — 저장 전 리사이즈·JPEG 재압축 필수
  function compressImage(dataUrl, cb){
    try{
      var img = new Image();
      img.onload = function(){
        try{
          var max = 1536;
          var w = img.naturalWidth, h = img.naturalHeight;
          var scale = Math.min(1, max / Math.max(w, h));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          cb(canvas.toDataURL('image/jpeg', 0.85));
        }catch(e){ cb(null); }
      };
      img.onerror = function(){ cb(null); };
      img.src = dataUrl;
    }catch(e){ cb(null); }
  }
  function persistImage(cb){
    if(!uploadedBase64) return cb();
    compressImage(uploadedBase64, function(small){
      try{ sessionStorage.setItem(IMG_KEY, JSON.stringify({ slug: CFG.slug, data: small || uploadedBase64 })); }catch(e){
        try{ sessionStorage.removeItem(IMG_KEY); }catch(e2){}
      }
      cb();
    });
  }
  function loadImage(){
    try{
      var raw = sessionStorage.getItem(IMG_KEY);
      if(!raw) return null;
      try{
        var obj = JSON.parse(raw);
        if(typeof obj === 'object' && obj !== null && obj.slug === CFG.slug) return obj.data;
        if(typeof obj === 'string') return obj;
        return null;
      }catch(e){ return raw; }
    }catch(e){ return null; }
  }

  /* ─── Upload handlers ─── */
  dropzone.querySelector('.v2-upload-btn').addEventListener('click', function(e){ e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', function(){ fileInput.click(); });
  dropzone.addEventListener('dragover', function(e){ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', function(){ dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop', function(e){
    e.preventDefault(); dropzone.classList.remove('dragover');
    if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function(){ if(fileInput.files.length) handleFile(fileInput.files[0]); });

  /* 확장자 폴백 — file.type은 파일 내용이 아니라 브라우저가 확장자로 붙인 라벨이다.
     Chromium 내장 MIME 표에도 OS 레지스트리에도 없는 확장자는 빈 문자열이 되어, 정상 사진도
     MIME만으로는 거부될 수 있다. 그래서 MIME 미매칭 시 파일명 확장자로 한 번 더 판정한다.

     허용 목록은 "서버가 실제로 디코드할 수 있는 포맷"이다 (2026-07-25 §11).
     - bmp·tiff·gif: sharp 미지원
     - heic·heif: prebuilt sharp 0.34.5에 HEVC 디코더가 없다(특허). format.heif.input.fileSuffix=['.avif'].
       클라이언트에서 열어봐야 서버가 픽셀을 못 여니 게이트에서 막고 문구로 안내한다.
       ⚠️ 확장자 목록에서만 빼면 macOS(file.type=image/heic)가 그대로 통과한다 → 아래 MIME 정규식에서도 제외. */
  // jfif = Windows·Edge가 JPEG 저장 시 붙이는 확장자. 내용은 JPEG와 동일해 서버 sharp가 그대로 읽는다.
  var ALLOWED_EXT = ['jpg','jpeg','jfif','png','webp'];
  function fileExt(name){
    if(!name || typeof name !== 'string') return '';
    var i = name.lastIndexOf('.');
    if(i < 0 || i === name.length - 1) return '';
    return name.slice(i + 1).toLowerCase();
  }
  // 거부는 photo_upload 발화 이전에 일어나 계측에 흔적이 없다 → 거부 시점을 별도 계측한다.
  // 파일명 전체는 개인정보이므로 절대 전송하지 않고 확장자만 보낸다.
  function trackReject(reason, mime, ext){
    gaTrack('upload_rejected', {
      reject_reason: reason,
      file_mime: mime || '(empty)',
      file_ext: ext || '(none)'
    }, true); // 한 유저가 여러 번 시도하므로 1회 가드 해제
  }

  function handleFile(file){
    hideError();
    fitResult = null; precheckData = null;
    showEngineNotice(false);
    showFovNotice(false);
    clearFovOverlay();
    resetFovAiOnly();
    var mime = (file && file.type) || '';
    var ext = fileExt(file && file.name);
    if(!mime.match(/image\/(jpeg|png|webp)/i) && ALLOWED_EXT.indexOf(ext) < 0){
      trackReject('type', mime, ext);
      return showError(T.errFileType);
    }
    if(file.size > 10*1024*1024){
      trackReject('size', mime, ext);
      return showError(T.errFileSize);
    }
    var reader = new FileReader();
    reader.onload = function(ev){
      uploadedBase64 = ev.target.result;
      // 게이트를 통과한 포맷은 브라우저가 전부 렌더할 수 있다 → 현행대로 즉시 표시.
      // (HEIC 변환 썸네일 대기 배선은 §11-1로 철거 — 서버가 디코드하지 못해 성립하지 않았다)
      var checkImg = document.getElementById('v2-check-img');
      if(checkImg){ checkImg.src = uploadedBase64; checkImg.style.display = ''; }
      showPhase(phaseCheck);
      gaTrack('photo_upload');

      var checklistItems = document.getElementById('v2-checklist-items');
      var checkLoading = document.getElementById('v2-loading');
      var summary = document.getElementById('v2-summary');
      var checkActions = document.getElementById('v2-check-actions');
      checklistItems.innerHTML = '';
      summary.innerHTML = '';
      summary.className = 'v2-checklist-summary';
      checkActions.style.display = 'none';
      checkLoading.style.display = 'flex';

      fetch('/api/idphoto/precheck', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ image: uploadedBase64, slug: CFG.slug })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        checkLoading.style.display = 'none';
        if(data && (typeof data.measurable !== 'undefined' || data.checks)){
          precheckData = data;
          // 규정 8항목은 결과 화면에서 사후 표시 (ORDER_20260707 Task 1: 사전=측정성만)
          if(data.measurable === false){
            summary.className = 'v2-checklist-summary v2-summary-fail';
            summary.textContent = (data.rejectionReason && fovText('rej_' + data.rejectionReason, data.fov)) || T.rejDefault;
            showFovOverlay(data);
            document.getElementById('v2-btn-proceed').style.display = 'none';
            checkActions.style.display = 'flex';
          } else {
            prepareFreeReady();
            showEngineNotice(engineBackup());
            // AI 경로가 켜진 규격(CFG.t1)만 사용 불가 안내 — 꺼진 규격은 없는 기능을 약속하지 않고 경고로 둔다
            if(data.fov && data.fov.aiOnly && CFG.t1 && T.fov_unusable_title && T.fov_ai_btn){
              applyFovAiOnly(data.fov);
            } else {
              showFovNotice(data.fov && data.fov.verdict === 'warn'
                ? fovText(data.fov.cause === 'off_center' ? 'warn_fov_off_center' : data.fov.cause === 'wide' ? 'warn_fov_wide' : 'warn_fov_tight_side', data.fov)
                : null);
            }
            showFovOverlay(data);
          }
          // 이미지 저장을 검수 시점에 선행 — 결제 클릭 체인에서 캔버스 압축을 제거해
          // 토스 결제창의 user activation 만료(팝업 차단)를 방지 (2026-07-05 E2E 실패 수정)
          persistImage(function(){});
        } else {
          // 서버 에러 문자열은 ko 고정 — code 기반 로컬라이즈 우선 (2026-07-16 작가님 es 실측)
          showError(data.code === 'RATE_LIMITED' ? T.rateLimited
                  : data.code === 'DECODE_FAILED' ? T.errDecode
                  : (data.error || T.errCheck));
          showPhase(phaseUpload);
        }
      })
      .catch(function(e){ console.error('[precheck-catch]', e); showError(T.errCheckNet + (e ? ' (' + (e.message||e) + ')' : '')); showPhase(phaseUpload); });
    };
    reader.readAsDataURL(file);
  }

  /* ─── Check phase actions ─── */
  document.getElementById('v2-btn-change').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });
  var fitResult = null, precheckData = null;

  var attirePicker = null;
  var attirePickerCtx = null; // 마운트 시점의 gender|age — 칩 변경 시 재마운트 (2026-07-17 잠긴 진열대 실사고)
  function mountAttirePicker(){
    var attireMount = document.getElementById('v2-attire-mount');
    if(!attireMount || !CFG.t1 || typeof AttirePicker === 'undefined') return;
    attireMount.style.display = '';
    // 성별 미선택 = 'all' — 피커 내부 성별 전환 개방 (구현부 genderLocked 조건 준용)
    var g = subjectSelection.gender || 'all';
    var a = subjectSelection.age || 'adult';
    var key = g + '|' + a;
    if(attirePicker && attirePickerCtx !== key){
      try{ attireMount.innerHTML = ''; }catch(e){}
      attirePicker = null;
    }
    if(!attirePicker){
      attirePicker = AttirePicker.mount(attireMount, {
        service: 'idpass', gender: g, age: a,
        lang: document.documentElement.lang || 'ko',
        upload: false, warnLightTop: true
      });
      attirePickerCtx = key;
    }
  }
  function proceedToPay(){
    document.getElementById('v2-preview-img').src = uploadedBase64;
    if(hasUsableToken()) return doGenerate();
    mountAttirePicker();
    syncSubjectChips('pay');
    showPhase(phasePay);
  }

  /* ─── T0 무료 생성 (IDPASS 파일럿 — 무료 선진행 → 땡큐 업셀) ───
     서버 /api/idphoto/generate freeTier 분기: fit 확정 프레임 → 매팅+기하 재단, Gemini 미경유.
     쿼터는 서명 쿠키 monkos_free(서버 정본) — 클라는 표시용으로만 읽는다. */
  var freeBusy = false;
  var freeResultB64 = null;
  /* 파일럿 재구성 (2026-07-10 작가님): 클릭 전 = 음성 게이트만(precheck), 클릭 후 = 시어터 연출을
     매팅 대기 시간과 겹쳐 재생. '규격에 맞아요' 사전 판정 제거 — 문제만 말한다. */
  var fitMode = 'default';
  var pilotGenPromise = null;
  var pilotFreeExhausted = false;
  function prepareFreeReady(){
    fitResult = null; pilotGenPromise = null; freeBusy = false;
    fitClearTimers();
    if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
    var stage = document.getElementById('v2-fit-stage');
    var stW0 = Math.min(240, (stage.parentElement.clientWidth || 280) - 20);
    var stH0 = Math.round(stW0 * (CFG.frameRatio || 4 / 3));
    stage.style.width = stW0 + 'px'; stage.style.height = stH0 + 'px';
    ['hair','crown','eye','chin'].forEach(function(k){ document.getElementById('v2-fit-line-' + k).style.opacity = '0'; });
    var fEl = document.getElementById('v2-fit-frame'); fEl.style.display = 'none';
    document.getElementById('v2-fit-dim-top').style.height = '0';
    document.getElementById('v2-fit-dim-bot').style.height = '0';
    var sc = document.getElementById('v2-fit-scan'); if(sc) sc.style.display = 'none';
    var b = document.getElementById('v2-fit-badges'); b.style.display = 'none'; b.innerHTML = '';
    var fs = document.getElementById('v2-fit-summary'); fs.textContent = ''; fs.className = 'v2-checklist-summary';
    document.getElementById('v2-fit-status').textContent = '';
    // 사진 표시 (전체 contain) — 시어터 없이 정지 상태
    var world = document.getElementById('v2-fit-world');
    var img = document.getElementById('v2-fit-img');
    world.style.transition = 'none';
    img.onload = function(){
      var W0 = img.naturalWidth, H0 = img.naturalHeight;
      if(!W0 || !H0) return;
      var stW = parseInt(stage.style.width) || 240, stH = parseInt(stage.style.height) || 320;
      world.style.width = W0 + 'px'; world.style.height = H0 + 'px';
      img.style.width = W0 + 'px'; img.style.height = 'auto';
      var scv = Math.min(stW / W0, stH / H0);
      world.style.transform = 'translate(' + ((stW - W0 * scv) / 2) + 'px,' + ((stH - H0 * scv) / 2) + 'px) scale(' + scv + ')';
    };
    var fs2 = document.getElementById('v2-fit-summary');
    var mkBtn = document.getElementById('v2-fit-make');
    if(freeRemainingFromCookie() <= 0){
      // 무료 소진 모드 — 연출·연산 없이 유료 길 즉시 개방 (2026-07-10 작가님)
      pilotFreeExhausted = true;
      fs2.className = 'v2-checklist-summary v2-summary-fail';
      fs2.textContent = T.quotaExhaustedMsg;
      var _qp = CFG.price || (CFG.market === 'kr' ? '₩2,000' : '$1.99');
      mkBtn.textContent = T.quotaExhaustedBtn.replace('{price}', _qp);
    } else {
      pilotFreeExhausted = false;
      fs2.className = 'ip-summary-ok';
      fs2.textContent = T.checkDone;
      mkBtn.textContent = T.freeCreateBtn;
    }
    document.getElementById('v2-fit-actions').style.display = 'flex';
    var cap = document.getElementById('ip-fit-caption'); if(cap) cap.style.display = 'block';
    var t2l = document.getElementById('ip-fit-t2-link'); if(t2l) t2l.style.display = 'block';
    updateFreeRemainingUI(null);
    // 디코드 완료 후 페이즈 전환 — 업로드→레디 리플로우 털컥 은닉
    var swapped = false;
    function swap(){ if(swapped) return; swapped = true; showPhase(phaseFit); }
    img.onload = (function(orig){ return function(){ orig(); swap(); }; })(img.onload);
    img.src = uploadedBase64;
    if(img.complete){ img.onload(); }
    setTimeout(swap, 600); // 디코드 지연 안전망
  }
  function pilotGatesFail(d){
    var pc = d.poseCheck || {};
    if(d.judge && d.judge.blocked) return T.gateBlocked;
    if(pc.eyeOpen && !pc.eyeOpen.ok) return T.gateEyeClosed;
    if(pc.roll && !pc.roll.ok) return T.gateTilted;
    return null;
  }
  function pilotOnFit(d){
    // fit 응답 즉시: 게이트 통과면 매팅을 시어터와 병행 시작 (대기 시간 겹치기)
    pilotGenPromise = pilotGatesFail(d) ? null : freeGenerateRequest(d);
  }
  function pilotVerdict(d){
    fitMode = 'default';
    var fs = document.getElementById('v2-fit-summary');
    var fa = document.getElementById('v2-fit-actions');
    var st = document.getElementById('v2-fit-status');
    var fail = pilotGatesFail(d);
    if(fail){
      fs.className = 'v2-checklist-summary v2-summary-fail';
      fs.textContent = fail;
      fa.style.display = 'flex';
      freeBusy = false; fitResult = null; pilotGenPromise = null;
      return;
    }
    st.textContent = T.statusFitDone;
    fs.className = 'ip-summary-ok';
    fs.textContent = T.statusRemoving;
    var pilotReq = pilotGenPromise || freeGenerateRequest(d);
    // 10초는 시어터 종료가 아니라 생성 요청 시작 기준 (요청은 pilotOnFit에서 시어터와 병행 출발)
    var pilotBackupTimer = (engineBackup() && T.genBackupWorking)
      ? setTimeout(function(){ fs.textContent = T.genBackupWorking; }, Math.max(0, 10000 - (Date.now() - freeGenStartedAt))) : null;
    pilotReq.then(function(res){
      clearTimeout(pilotBackupTimer);
      freeBusy = false;
      if(!res.ok){
        var code = res.d && res.d.code;
        if(code === 'FREE_LIMIT'){
          updateFreeRemainingUI(0); gaTrack('free_limit_hit', {}, true);
          pilotFreeExhausted = true;
          showError('' + T.freeLimitHit + '');
          proceedToPay(); // 무료 막혀도 유료 길은 연다
          return;
        }
        // 서버 에러 문자열은 ko 고정 — code 기반 로컬라이즈 우선 (2026-07-16 작가님 es 실측)
        showError(code === 'FREE_UNAVAILABLE' ? T.freeBusyMsg : code === 'GENERATE_FAILED' ? T.freeGenFail : code === 'FACE_NOT_DETECTED' ? (res.d.error || T.freeGenFail) : ((res.d && res.d.error) || '' + T.freeGenFail + ''));
        st.textContent = '';
        fs.textContent = '';
        fa.style.display = 'flex';
        return;
      }
      if(res.d && res.d.code === 'FACE_NOT_DETECTED'){
        freeBusy = false;
        showError(res.d.error || T.freeGenFail);
        st.textContent = '';
        fs.textContent = '';
        fa.style.display = 'flex';
        return;
      }
      freeResultB64 = res.d.image;
      var img = document.getElementById('ip-free-img');
      if(img) img.src = 'data:image/png;base64,' + freeResultB64;
      updateFreeRemainingUI(res.d.remainingFree);
      gaTrack('free_generate_done', { gen_track: res.d.track || '' }, true);
      adsConversion(CFG.adsConv && CFG.adsConv.labelFree);
      showPhase(phaseFree);
      try{ window.scrollTo({ top: document.getElementById('v2-steps').offsetTop - 12, behavior: 'smooth' }); }catch(e){}
    }).catch(function(){
      clearTimeout(pilotBackupTimer);
      freeBusy = false;
      showError(T.errNet);
      st.textContent = '';
      fa.style.display = 'flex';
    });
  }
  var freeGenStartedAt = 0;
  function freeGenerateRequest(d){
    freeGenStartedAt = Date.now();
    gaTrack('free_generate_click', {}, true);
    return fetch('/api/idphoto/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        image: uploadedBase64, slug: CFG.slug, freeTier: true,
        fitFrame: d.frame, fitMeta: d.meta || null, fitMetrics: d.metrics || null
      })
    }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, status: r.status, d: j }; }); });
  }
  function freeRemainingFromCookie(){
    try{
      var m = document.cookie.match(/(?:^|;\s*)monkos_free=([^;]+)/);
      if(!m) return CFG.freeCap;
      var parts = decodeURIComponent(m[1]).split('.');
      var today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      if(parts[0] !== today) return CFG.freeCap;
      var n = parseInt(parts[1], 10);
      return isNaN(n) ? CFG.freeCap : Math.max(0, CFG.freeCap - n);
    }catch(e){ return CFG.freeCap; }
  }
  function updateFreeRemainingUI(val){
    var v = (val != null) ? val : freeRemainingFromCookie();
    var a = document.getElementById('ip-fit-remaining');
    var b = document.getElementById('ip-free-remaining');
    if(a) a.textContent = v;
    if(b) b.textContent = v;
  }
  function restoreFitActions(){
    showPhase(phaseFit);
    var fa = document.getElementById('v2-fit-actions');
    if(fa) fa.style.display = 'flex';
  }
  function doFreeGenerate(){
    if(!uploadedBase64 || freeBusy) return;
    if(hasUsableToken()) return doGenerate();
    if(!fitResult || !fitResult.frame){ proceedToPay(); return; }
    freeBusy = true;
    hideError();
    setGenMessage(T.freeGenTitle, T.freeGenSub.replace('{type}', CFG.format || ''));
    showPhase(phaseGen);
    var freeBk = engineBackup() && !!T.genBackupWorking;
    var freeWait1 = setTimeout(function(){ setGenMessage(T.freeGenTitle, (freeBk ? T.genBackupWorking : T.genStillWorking1) || ''); }, freeBk ? 10000 : 15000);
    var freeWait2 = setTimeout(function(){ setGenMessage(T.freeGenTitle, T.genStillWorking2 || ''); }, freeBk ? 25000 : 35000);
    function clearFreeWait(){ clearTimeout(freeWait1); clearTimeout(freeWait2); }
    freeGenerateRequest(fitResult)
    .then(function(res){
      freeBusy = false;
      clearFreeWait();
      setGenMessage(GEN_TEXT_DEFAULT, GEN_SUB_DEFAULT);
      if(!res.ok){
        var code = res.d && res.d.code;
        if(code === 'FREE_LIMIT'){
          updateFreeRemainingUI(0);
          gaTrack('free_limit_hit', {}, true);
          pilotFreeExhausted = true;
          showError('' + T.freeLimitHit + '');
          proceedToPay();
          return;
        }
        showError(code === 'FREE_UNAVAILABLE' ? T.freeBusyMsg : code === 'GENERATE_FAILED' ? T.freeGenFail : ((res.d && res.d.error) || '' + T.freeGenFail + ''));
        restoreFitActions();
        return;
      }
      freeResultB64 = res.d.image;
      var img = document.getElementById('ip-free-img');
      if(img) img.src = 'data:image/png;base64,' + freeResultB64;
      updateFreeRemainingUI(res.d.remainingFree);
      gaTrack('free_generate_done', { gen_track: res.d.track || '' }, true);
      adsConversion(CFG.adsConv && CFG.adsConv.labelFree);
      showPhase(phaseFree);
      try{ window.scrollTo({ top: document.getElementById('v2-steps').offsetTop - 12, behavior: 'smooth' }); }catch(e){}
    })
    .catch(function(){
      freeBusy = false;
      clearFreeWait();
      setGenMessage(GEN_TEXT_DEFAULT, GEN_SUB_DEFAULT);
      showError(T.errNet);
      restoreFitActions();
    });
  }
  if(phaseFree){
    document.getElementById('ip-free-download').addEventListener('click', function(){
      if(!freeResultB64) return;
      saveImageToDevice('data:image/png;base64,' + freeResultB64, CFG.downloadName.replace(/\.jpg$/, '_free.png'));
      gaTrack('free_download', {}, true);
    });
    document.getElementById('ip-free-retry').addEventListener('click', function(){
      uploadedBase64 = null; fitResult = null; precheckData = null; freeResultB64 = null;
      showPhase(phaseUpload);
    });
    var t1Btn = document.getElementById('ip-t1-buy');
    if(t1Btn) t1Btn.addEventListener('click', function(){
      gaTrack('t1_upsell_click', {}, true);
      proceedToPay();
    });
    var t2go = document.getElementById('ip-t2-go');
    if(t2go) t2go.addEventListener('click', function(){ gaTrack('t2_upsell_click', {}, true); });
    var slotCredit = document.getElementById('ip-slot-credit');
    if(slotCredit){
      slotCredit.href = '/credits.html?from=' + encodeURIComponent(location.pathname + '?credits=return');
      slotCredit.addEventListener('click', function(){ gaTrack('credit_slot_click', {}, true); });
    }
  }

  /* ─── 규격 안착 시어터 (2026-07-07 작가님 연출 비전) ───
     줌인 → 가이드 라인 순차 진입 → 전문가(비전) 미세 보정 트윈 → 정본 신호등 판정 */
  var SIGCOL = { pass:'#00B894', warn:'#FDCB6E', fail:'#E17055' };
  var fitTimers = [];
  function fitClearTimers(){ fitTimers.forEach(clearTimeout); fitTimers = []; }
  function fitAfter(ms, fn){ fitTimers.push(setTimeout(fn, ms)); }

  function runFit(){
    clearFovOverlay();
    showPhase(phaseFit);
    fitClearTimers();
    var stage = document.getElementById('v2-fit-stage');
    // 스테이지 크기 = 진입 시점(빈 박스) 1회 고정 — 규격비 반영, 폭 240 유지.
    // 연출 중 크기 변경 금지 (2026-07-09 작가님: 비율 전환은 이해 가능, 박스가 툭 커지는 것은 불필요)
    var stW0 = Math.min(240, (stage.parentElement.clientWidth || 280) - 20);
    var stH0 = Math.round(stW0 * (CFG.frameRatio || 4 / 3));
    stage.style.width = stW0 + 'px'; stage.style.height = stH0 + 'px';
    var img = document.getElementById('v2-fit-img');
    var badges = document.getElementById('v2-fit-badges');
    var noteEl = document.getElementById('v2-fit-note');
    var fs = document.getElementById('v2-fit-summary');
    var fa = document.getElementById('v2-fit-actions');
    badges.style.display = 'none'; badges.innerHTML = '';
    noteEl.style.display = 'none';
    fs.textContent = ''; fs.className = 'v2-checklist-summary';
    if(fitMode === 'pilot'){
      fs.className = 'ip-summary-ok';
      fs.textContent = T.statusFitting;
    }
    fa.style.display = 'none';
    var capEl = document.getElementById('ip-fit-caption'); if(capEl) capEl.style.display = 'none';
    var t2lEl = document.getElementById('ip-fit-t2-link'); if(t2lEl) t2lEl.style.display = 'none';
    ['hair','crown','eye','chin'].forEach(function(k){
      document.getElementById('v2-fit-line-' + k).style.opacity = '0';
    });
    var fEl0 = document.getElementById('v2-fit-frame');
    fEl0.style.display = 'none'; fEl0.style.opacity = '0';
    document.getElementById('v2-fit-dim-top').style.height = '0';
    document.getElementById('v2-fit-dim-bot').style.height = '0';
    // 분석 대기 연출 — 정지 화면 금지 (2026-07-07 작가님: 수 초 정지 = 뻗은 것처럼 보임)
    if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
    (function(){
      var texts = T.fitTexts;
      var dots = 0, ti = 0;
      window.__fitWaitTimer = setInterval(function(){
        dots = (dots + 1) % 4;
        if(dots === 0) ti = (ti + 1) % texts.length;
        var el = document.getElementById('v2-fit-status');
        if(el) el.textContent = texts[ti] + '.'.repeat(dots + 1);
        var sc = document.getElementById('v2-fit-scan');
        if(sc){ var t = (Date.now() / 12) % ((parseInt(stage.style.height) || 320) + 40) - 20; sc.style.top = t + 'px'; }
      }, 420);
    })();
    var scan = document.getElementById('v2-fit-scan');
    if(!scan){
      scan = document.createElement('div');
      scan.id = 'v2-fit-scan';
      scan.style.cssText = 'position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,transparent,#00B894 40%,#00B894 60%,transparent);box-shadow:0 0 12px #00B894;opacity:.85;pointer-events:none;';
      stage.appendChild(scan);
    }
    scan.style.display = 'block';
    var world0 = document.getElementById('v2-fit-world');
    world0.style.transition = 'none';
    world0.style.transform = 'scale(1)';
    img.onload = function(){
      // fetch 응답 전에도 전체 사진(contain)부터 — 빈 구석에서 시작하지 않는다 (2026-07-07 작가님 교정)
      var W0 = img.naturalWidth, H0 = img.naturalHeight;
      if(!W0 || !H0) return;
      var stW = parseInt(stage.style.width) || 240, stH = parseInt(stage.style.height) || 320;
      world0.style.width = W0 + 'px'; world0.style.height = H0 + 'px';
      img.style.width = W0 + 'px'; img.style.height = 'auto';
      var sc = Math.min(stW / W0, stH / H0);
      world0.style.transform = 'translate(' + ((stW - W0 * sc) / 2) + 'px,' + ((stH - H0 * sc) / 2) + 'px) scale(' + sc + ')';
    };
    img.src = uploadedBase64;
    if(img.complete) img.onload();

    fetch('/api/idphoto/fit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ image: uploadedBase64, slug: CFG.slug, faceBox: precheckData && precheckData.faceBox })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data || !data.success){
        if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
        fitResult = null;
        if(data && data.code === 'FIT_SANITY'){
          showError('' + T.fitSanity + '');
          showPhase(phaseUpload);
          return;
        }
        if(fitMode === 'pilot'){ fitMode = 'default'; freeBusy = false; showError('' + T.freeRetry + ''); prepareFreeReady(); return; }
        proceedToPay(); return; // 카나리 밖(NOT_AVAILABLE) → 기존 경로
      }
      fitResult = data;
      if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer);
      var sc = document.getElementById('v2-fit-scan'); if(sc) sc.style.display = 'none';
      if(fitMode === 'pilot') pilotOnFit(data);
      playFitTheater(data);
    })
    .catch(function(){ if(window.__fitWaitTimer) clearInterval(window.__fitWaitTimer); fitResult = null; proceedToPay(); });
  }

  function playFitTheater(d){
    // IDPASS 원칙 (2026-07-07 작가님 교정): 사진이 우선 — 원본 비율·포인트는 절대 불변.
    // 사진+라인+프레임을 월드(강체)로 묶고, 카메라(균일 scale transform)만 프레임으로 다가간다.
    var stage = document.getElementById('v2-fit-stage');
    var world = document.getElementById('v2-fit-world');
    var img = document.getElementById('v2-fit-img');
    var statusEl = document.getElementById('v2-fit-status');
    // 크기 재설정 금지 — runFit 진입 시점에 고정된 값을 읽는다 (연출 중 박스 스냅 = 컨테이너 흔들림의 원인이었음).
    // CFG.frameRatio 부재 등으로 비율이 어긋난 경우에만 높이 보정 (폭은 불변).
    var stageW = parseInt(stage.style.width) || 240;
    var stageH = parseInt(stage.style.height) || 320;
    var specH = Math.round(stageW * d.spec.frameH / d.spec.frameW);
    if (Math.abs(specH - stageH) > 2) { stageH = specH; stage.style.height = stageH + 'px'; }
    var W = d.imageSize.width, H = d.imageSize.height;

    // 월드 = 사진 원본 좌표계 그대로 (px 단위 1:1)
    world.style.width = W + 'px'; world.style.height = H + 'px';
    img.style.width = W + 'px'; img.style.height = 'auto';

    function camera(f){ // 프레임 f가 스테이지를 가득 채우도록 월드를 균일 스케일 이동
      var sc = stageW / f.w;
      return 'translate(' + (-f.x * sc) + 'px,' + (-f.y * sc) + 'px) scale(' + sc + ')';
    }
    function containCam(){ // 사진 전체가 보이는 카메라
      var sc = Math.min(stageW / W, stageH / H);
      var tx = (stageW - W * sc) / 2, ty = (stageH - H * sc) / 2;
      return 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ')';
    }
    function setStatus(t){ statusEl.textContent = t; }

    // 라인·프레임을 사진 좌표에 고정 배치 (이후 절대 안 움직임 — 월드만 움직인다)
    var lineDefs = [
      ['v2-fit-line-eye',   d.lines.eyeY,     T.fitLineEye],
      ['v2-fit-line-chin',  d.lines.chinY,    T.fitLineChin],
      ['v2-fit-line-crown', d.lines.crownY,   T.fitLineCrown],
      ['v2-fit-line-hair',  d.lines.hairTopY, T.fitLineHair],
    ];
    lineDefs.forEach(function(item){
      var el = document.getElementById(item[0]);
      el.style.cssText += ';position:absolute;left:0;width:' + W + 'px;top:' + item[1] + 'px;opacity:0;transition:opacity .5s;pointer-events:none;';
    });
    var frame0 = d.frameInitial || d.frame;
    var fEl = document.getElementById('v2-fit-frame');
    fEl.style.display = 'block'; fEl.style.opacity = '0';
    fEl.style.left = frame0.x + 'px'; fEl.style.top = frame0.y + 'px';
    fEl.style.width = frame0.w + 'px'; fEl.style.height = frame0.h + 'px';

    // 0) 전체 사진에서 시작 — 원본 그대로 보여준다
    world.style.transition = 'none';
    world.style.transform = containCam();
    void world.offsetWidth;
    world.style.transition = 'transform 1.3s cubic-bezier(.22,.9,.24,1)';
    setStatus(T.fitStatusAnalyze);

    // 1) 가이드 라인이 사진 위에 순차 진입 (사진은 그대로)
    var t = 500;
    lineDefs.forEach(function(item, i){
      fitAfter(t + i * 480, function(){
        setStatus(item[2]);
        document.getElementById(item[0]).style.opacity = '1';
      });
    });
    t += lineDefs.length * 480 + 300;

    // 2) 규격 프레임이 사진 위로 나타남
    fitAfter(t, function(){ setStatus(T.fitStatusAlign); fEl.style.opacity = '1'; });
    t += 700;

    // 3) 전문가(비전) 보정 — 프레임"만" 이동 (사진 불변)
    var moved = d.frameInitial && (Math.abs(d.frame.y - d.frameInitial.y) > 1 || Math.abs(d.frame.h - d.frameInitial.h) > 1);
    if(moved){
      fitAfter(t, function(){
        setStatus(d.vision && d.vision.executed ? T.fitStatusExpert : T.fitStatusExpertFallback);
        fEl.style.top = d.frame.y + 'px';
        fEl.style.left = d.frame.x + 'px';
        fEl.style.width = d.frame.w + 'px';
        fEl.style.height = d.frame.h + 'px';
      });
      t += 1050;
    }

    // 4) 카메라가 프레임으로 자연스럽게 다가감 (균일 줌 — 왜곡 불가)
    fitAfter(t, function(){
      setStatus(T.fitStatusSettle);
      world.style.transform = camera(d.frame);
    });
    t += 1400;

    // 5) 딤 + 신호등 판정
    fitAfter(t, function(){
      var scF = stageW / d.frame.w;
      var crownTop = (d.lines.crownY - d.frame.y) * scF;
      var chinTop = (d.lines.chinY - d.frame.y) * scF;
      document.getElementById('v2-fit-dim-top').style.height = Math.max(0, crownTop) + 'px';
      document.getElementById('v2-fit-dim-bot').style.height = Math.max(0, stageH - chinTop) + 'px';
      setStatus('');
      renderFitVerdict(d);
    });
  }

  function renderFitVerdict(d){
    if(fitMode === 'pilot') return pilotVerdict(d);
    var b = document.getElementById('v2-fit-badges');
    b.innerHTML = ''; b.style.display = 'flex';
    function badge(label, val, sig){
      var el = document.createElement('div');
      var c = SIGCOL[sig] || '#888';
      el.style.cssText = 'padding:5px 10px;border-radius:8px;font-size:12.5px;font-weight:600;background:' + c + '22;color:' + c + ';';
      el.textContent = label + ' ' + val;
      b.appendChild(el);
    }
    var m = d.metrics || {}, j = d.judge || {};
    // 파일럿: 수치 뱃지 제거 (통과 사용자에게 숫자 나열은 인지 비용 — §7-1) — 문제 칩만 유지
    if(d.poseCheck){
      if(d.poseCheck.roll && !d.poseCheck.roll.ok) badge(T.badgeTilt, Math.abs(d.poseCheck.roll.value).toFixed(0) + T.badgeTiltSuffix, 'fail');
      if(d.poseCheck.eyeOpen && !d.poseCheck.eyeOpen.ok) badge(T.badgeEyeClosed, T.badgeEyeClosedDesc, 'fail');
      // 입벌림 칩 미표기 (2026-07-10 작가님): 입술 간격 비율로는 '치아 노출'(규정 핵심)을 판별 못함 —
      // 1차 검수는 신뢰 가능한 항목만 표기. 검출값은 서버 로그로 축적, 규정 안내는 업로드 가이드 칩 담당.
    }
    var expertMsg = (d.vision && d.vision.executed) || (d.vision && d.vision.note);
    if(expertMsg){
      var n = document.getElementById('v2-fit-note');
      n.style.display = 'block';
      n.textContent = expertMsg;
    }
    var fs = document.getElementById('v2-fit-summary');
    var mk = document.getElementById('v2-fit-make');
    if(j.blocked){
      fs.className = 'v2-checklist-summary v2-summary-fail';
      fs.textContent = T.fitFail;
      mk.disabled = true; mk.style.opacity = '.4';
    } else {
      fs.className = 'v2-checklist-summary v2-summary-pass';
      fs.textContent = T.fitPass;
      mk.disabled = false; mk.style.opacity = '';
    }
    document.getElementById('v2-fit-actions').style.display = 'flex';
    var cap = document.getElementById('ip-fit-caption');
    var t2l = document.getElementById('ip-fit-t2-link');
    if(cap) cap.style.display = j.blocked ? 'none' : 'block';
    if(t2l) t2l.style.display = 'block';
    updateFreeRemainingUI(null);
  }

  document.getElementById('v2-fit-change').addEventListener('click', function(){
    uploadedBase64 = null; fitResult = null; precheckData = null;
    showPhase(phaseUpload);
  });
  document.getElementById('v2-fit-make').addEventListener('click', function(){
      if(freeBusy) return;
      if(hasUsableToken()) return doGenerate();
      if(fovAiOnly) return proceedToPay();
      if(pilotFreeExhausted) return proceedToPay();
      if(fitResult && fitResult.frame) return doFreeGenerate();
      freeBusy = true; hideError();
      fitMode = 'pilot';
      runFit();
  });

  document.getElementById('v2-btn-proceed').addEventListener('click', function(){ runFit(); });

  // 피사체 칩 이벤트
  document.querySelectorAll('.v2-subject-section').forEach(function(sec){
    sec.addEventListener('click', function(e){
      var chip = e.target.closest('.v2-attire-chip');
      if(!chip) return;
      var field = chip.parentElement.dataset.field;
      var val = chip.dataset.val;
      if(field === 'age') subjectSelection.age = val;
      else if(field === 'gender') subjectSelection.gender = val;
      syncSubjectChips();
      // 결제 화면에서 성별·연령 변경 시 의상 카탈로그 즉시 갱신 (재마운트)
      if(attirePicker) mountAttirePicker();
    });
  });

  /* ─── Pay phase ─── */
  document.getElementById('v2-change-photo').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });

  document.getElementById('v2-pay-instant').addEventListener('click', function(){
    if(!uploadedBase64 || payBusy) return;
    // 결제 완료 토큰 보유 시 이중 결제 방지 — 바로 생성
    if(hasUsableToken()) return doGenerate();
    // 위젯이 이미 열려 있으면 init 을 다시 부르지 않는다 (2026-09-19 결함 C).
    // 재클릭마다 서버 주문이 새로 생기는데 화면은 그대로여서 "반응 없는 버튼"으로 보였다.
    if(tossWidgetRendered && pay.orderId && isWidgetOpen()){
      hideError();
      focusTossWidget();
      return;
    }
    // 위젯 렌더가 아직 진행 중이면 다시 시작하지 않는다 (2026-09-20 dev 실측).
    // 렌더 타임아웃이 잠금을 푼 뒤 재클릭하면 같은 자리에 위젯이 이중 렌더되어 결제가 INVALID_METHOD_TRANSACTION으로 깨졌다.
    if(tossRenderInFlight){ focusTossWidget(); return; }
    hideError();
    payBusy = true;
    var initBody = { slug: CFG.slug, market: CFG.market };
    if(CFG.market !== 'kr') initBody.redirectUrl = returnBase() + '?lemon=return';
    // 팝업 차단 회피: 클릭 제스처 안에서 창을 먼저 열고 init 후 주소 지정 (레몬 경로)
    var lemonWin = null;
    if(CFG.market !== 'kr'){
      try{ lemonWin = window.open('', '_blank'); }catch(e){}
    }
    fetch('/api/payments/direct/init', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(initBody)
    })
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }); })
    .then(function(res){
      if(!res.ok){
        payBusy = false;
        if(lemonWin){ try{ lemonWin.close(); }catch(e){} }
        if(res.status === 503) showPayError(T.payUnavailable);
        else if(res.status === 429) showPayError(T.rateLimited);
        else showPayError((res.d && res.d.error) || T.payInitFail);
        return;
      }
      var d = res.d;
      pay.orderId = d.orderId; pay.token = null; pay.remaining = null; pay.consumed = false; pay.expiresAt = null;
      // orderId 확보 후 주문 단위 1회 발화 — 에러 후 재클릭 중복 방지 + purchase와 쌍 정합
      gaTrackOrder('begin_checkout', d.orderId, { payment_provider: GA_PAY.payment_provider, currency: GA_PAY.currency, value: GA_PAY.value, transport_type: 'beacon' });
      persistOrder();
      // 이미지 저장은 검수 통과 시점에 선행 완료 — 여기서 캔버스 압축을 돌리면
      // user activation이 만료돼 토스 결제창이 팝업 차단됨 (2026-07-05 E2E 실패 원인)
      if(d.provider === 'toss') startToss(d, lemonWin);
      else startLemon(d, lemonWin);
    })
    .catch(function(){
      payBusy = false;
      if(lemonWin){ try{ lemonWin.close(); }catch(e){} }
      showPayError(T.errNet);
    });
  });

  // 토스 결제위젯 방식 (2026-07-05 전환) — 상점 라이브 계약이 위젯 연동(live_gck)에만 있음.
  // 구 결제창(payment/live_ck) 방식은 API 개별연동 MID 계약 미완료로 라이브 결제 불가 (2026-03 위젯 전환 이력).
  var tossWidgets = null, tossWidgetRendered = false, tossRenderInFlight = false;
  // 카드사·약관 미충족 시 결제 버튼 비활성 (toss-pay-guard.js). 스크립트가 없는 구본 HTML이면 null — 기존 동작 유지
  var payGuard = null;
  // 위젯 로딩 표시 — 렌더가 4~18초 걸리는 동안 화면이 비어 있으면 고객은 고장으로 읽고 떠난다 (09-20 네이버 인앱 init 후 무기록 이탈)
  var PAY_LOADING = { ko: '결제창을 불러오는 중입니다…', ja: '決済画面を読み込んでいます…', en: 'Loading the payment form…', es: 'Cargando el formulario de pago…' };
  function setWidgetLoading(on){
    var wrap = document.getElementById('v2-toss-widget');
    if(!wrap) return;
    var el = document.getElementById('v2-pay-loading');
    if(on){
      if(!el){
        el = document.createElement('div');
        el.id = 'v2-pay-loading'; el.className = 'v2-pay-loading';
        var lang = (document.documentElement.lang || 'ko').slice(0, 2).toLowerCase();
        el.textContent = (T && T.payWidgetLoading) || PAY_LOADING[lang] || PAY_LOADING.en;
        wrap.insertBefore(el, wrap.firstChild);
      }
      el.style.display = '';
    } else if(el){ el.style.display = 'none'; }
  }
  function startToss(d, extraWin){
    if(extraWin){ try{ extraWin.close(); }catch(e){} }
    // 위젯 단계 실패도 기록한다 — 09-20 네이버 인앱 고객이 init 직후 무기록으로 사라진 사각지대 (SDK 부재·렌더 거절·렌더 멈춤)
    if(!window.TossPayments){ payBusy = false; showPayError(T.payInitFail); reportPayFail('widget', 'SDK_MISSING', 'TossPayments global undefined'); return; }
    var wrap = document.getElementById('v2-toss-widget');
    var btn = document.getElementById('v2-pay-confirm');
    try{
      if(!tossWidgets){
        tossWidgets = window.TossPayments(d.clientKey).widgets({ customerKey: window.TossPayments.ANONYMOUS });
      }
      // 실패 복귀 시 주문 재사용을 위한 보존 (결함 F) — 금액·라벨은 서버 init 응답이 정본 (ch2 7조)
      lastTossInit = { provider: 'toss', orderId: d.orderId, orderName: d.orderName, amount: d.amount, currency: d.currency, clientKey: d.clientKey };
      persistOrder(); // 호출부의 persistOrder 는 lastTossInit 설정 전에 끝난다 — 여기서 다시 저장해야 복귀 재오픈이 성립
      var _cur = (d.currency === 'USD' || CFG.market !== 'kr') ? '$' : '₩';
      var _amt = _cur === '$' ? String(d.amount) : String(d.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      var _priceLabel = T.payBtnLabel.replace('{price}', _cur + _amt);
      if(!payGuard && window.TossPayGuard){
        payGuard = window.TossPayGuard.create({ btn: btn, needCardLabel: T.payNeedCard, needAgreeLabel: T.payNeedAgree });
      }
      if(payGuard) payGuard.setPriceLabel(_priceLabel); else btn.textContent = _priceLabel;
      wrap.style.display = 'block';
      setWidgetOpenUI(true);
      // 렌더 멈춤 감시 — 프라미스가 끝나지 않으면 payBusy가 고착돼 첫 버튼이 영구 무반응이 된다.
      // 12초 뒤 잠금을 풀고 사유를 보여준다. 위젯 영역은 닫지 않는다(늦게라도 뜨면 그대로 결제 가능).
      var renderT0 = Date.now(), renderSettled = false, renderTimedOut = false, timeoutErrSeq = -1;
      tossRenderInFlight = !tossWidgetRendered;
      if(tossRenderInFlight) setWidgetLoading(true);
      var renderTimer = setTimeout(function(){
        if(renderSettled) return;
        renderTimedOut = true;
        payBusy = false;
        showPayError(T.payInitFail);
        timeoutErrSeq = payErrSeq;
        reportPayFail('widget', 'RENDER_TIMEOUT', 'widget render not settled in 12s');
      }, 12000);
      tossWidgets.setAmount({ currency: d.currency || 'KRW', value: d.amount })
        .then(function(){
          // 재오픈은 렌더를 건너뛴다 — 보관한 인스턴스로 선택·약관 상태만 다시 잰다
          if(tossWidgetRendered){ if(payGuard) payGuard.refresh(); return; }
          var pmWidget;
          return tossWidgets.renderPaymentMethods({ selector: '#v2-pm' })
            .then(function(w){ pmWidget = w; return tossWidgets.renderAgreement({ selector: '#v2-agree' }); })
            .then(function(agreementWidget){
              tossWidgetRendered = true;
              if(payGuard) payGuard.attach(pmWidget, agreementWidget);
            });
        })
        .then(function(){
          renderSettled = true; clearTimeout(renderTimer);
          tossRenderInFlight = false; setWidgetLoading(false);
          payBusy = false;
          // 늦게 떴다 — 타임아웃 문구만 거둔다 (그 사이 뜬 다른 에러는 건드리지 않는다)
          if(renderTimedOut && payErrSeq === timeoutErrSeq) hidePayError();
          gaTrack('pay_widget_open', { payment_provider: GA_PAY.payment_provider, render_ms: Date.now() - renderT0, late: renderTimedOut }, true);
          // 'nearest' 1회로는 위젯 하단(결제하기)이 화면 밖에 남는다 → 위젯 상단 정렬 + 하단 고정 배선.
          // 단 실패 사유가 이미 떠 있으면(복귀 재오픈) 그 문구를 가리지 않는다.
          var shownErr = payErrorEl && payErrorEl.classList.contains('show') ? payErrorEl : null;
          try{ (shownErr || wrap).scrollIntoView({ behavior: 'smooth', block: shownErr ? 'center' : 'start' }); }catch(e){}
          scheduleDock();
        })
        .catch(function(e){
          renderSettled = true; clearTimeout(renderTimer);
          tossRenderInFlight = false; setWidgetLoading(false);
          payBusy = false; wrap.style.display = 'none'; setWidgetOpenUI(false);
          showPayError((e && e.message) || T.payInitFail);
          reportPayFail('widget', (e && e.code) || 'RENDER_FAILED', (e && e.message) || '');
        });
      btn.onclick = function(){
        if(payGuard && !payGuard.canPay()) return;
        gaTrack('pay_confirm_click', { payment_provider: GA_PAY.payment_provider }, true);
        hidePayError();
        var base = returnBase();
        tossWidgets.requestPayment({
          orderId: d.orderId,
          orderName: d.orderName,
          successUrl: base + '?toss=direct',
          failUrl: base + '?toss=fail'
        }).catch(function(err){
          var cancelled = err && err.code === 'USER_CANCEL';
          reportPayFail('request', (err && err.code) || (cancelled ? 'USER_CANCEL' : 'REQUEST_FAILED'), (err && err.message) || '');
          showPayError(cancelled ? T.payCancelled : ((err && err.message) || T.payInitFail));
        });
      };
    }catch(e){
      try{ clearTimeout(renderTimer); }catch(_){}
      tossRenderInFlight = false; setWidgetLoading(false);
      payBusy = false; showPayError(T.payInitFail);
      reportPayFail('widget', 'INIT_EXCEPTION', (e && e.message) || '');
    }
  }

  function startLemon(d, lemonWin){
    showPhase(phaseGen);
    setGenMessage(T.payWaiting, T.payWaitingHint);
    // 레몬은 체크아웃 표면이 외부 페이지 — 그 표면이 열린 시점을 위젯 오픈과 동일 계측으로 잡는다
    gaTrack('pay_widget_open', { payment_provider: GA_PAY.payment_provider }, true);
    if(lemonWin && !lemonWin.closed){
      try{ lemonWin.location = d.checkoutUrl; }catch(e){ lemonWin = null; }
    } else { lemonWin = null; }
    if(!lemonWin){
      // 팝업 불가 — 같은 탭 리다이렉트 (상태는 sessionStorage에 보존, redirectUrl로 복귀)
      location.href = d.checkoutUrl;
      return;
    }
    startPolling(d.orderId);
  }

  function stopPolling(){ if(pollTimer){ clearInterval(pollTimer); pollTimer = null; } }

  function startPolling(orderId){
    stopPolling();
    var tries = 0;
    pollTimer = setInterval(function(){
      tries++;
      if(tries > 240){ // 2.5초 × 240 = 10분
        stopPolling(); payBusy = false;
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
        reportPayFail('poll', 'POLL_TIMEOUT', 'status polling timed out');
        showPayError(T.payTimeout);
        return;
      }
      fetch('/api/payments/direct/status?orderId=' + encodeURIComponent(orderId))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d.status === 'paid' && d.paymentToken){
          stopPolling(); payBusy = false;
          pay.orderId = orderId; pay.token = d.paymentToken; pay.remaining = null; pay.consumed = false;
          pay.expiresAt = d.tokenExpiresAt || (Date.now() + 86400000);
          persistOrder();
          gaTrackPurchase(orderId);
          if(uploadedBase64) doGenerate(); else needReupload();
        } else if(d.status === 'failed' || d.status === 'amount_mismatch' || d.status === 'refunded'){
          stopPolling(); payBusy = false;
          showPhase(uploadedBase64 ? phasePay : phaseUpload);
          reportPayFail('poll', String(d.status).toUpperCase(), 'order status ' + d.status);
          showPayError(T.payFailed);
        }
      })
      .catch(function(){});
    }, 2500);
  }

  // 결제는 확인됐지만 이미지가 유실된 경우(리다이렉트 생존 실패) — 재업로드 후 무결제 생성
  function needReupload(){
    showPhase(phaseUpload);
    showError(T.imgLost);
  }

  /* ─── 사후 검수 체크리스트 (ORDER_20260707 Task 4 — 규정 8항목 사후 이동 + 수치 검수) ─── */
  function renderResultChecklist(data){
    var ul = document.getElementById('v2-result-checklist');
    if(!ul) return;
    ul.innerHTML = '';
    var hardFail = false;
    function add(label, state, msg){
      var li = document.createElement('li');
      var icon = document.createElement('span');
      icon.className = 'v2-check-icon ' + (state === 'pass' ? 'v2-check-pass' : state === 'warn' ? 'v2-check-warn' : 'v2-check-fail');
      icon.textContent = state === 'pass' ? '\u2713' : state === 'warn' ? '!' : '\u2717';
      li.appendChild(icon);
      li.appendChild(document.createTextNode(label));
      if(msg){ var wm = document.createElement('div'); wm.className = 'v2-check-warn-msg'; wm.textContent = msg; li.appendChild(wm); }
      ul.appendChild(li);
      if(state === 'fail') hardFail = true;
    }
    var m = data.meta || {};
    var sp = fitResult && fitResult.spec;
    if(m.faceMM){
      var face = parseFloat(m.faceMM);
      if(sp && sp.headHeightMin && sp.headHeightMax){
        var okF = face >= sp.headHeightMin && face <= sp.headHeightMax;
        add(T.resultHeadHeight.replace('{v}', m.faceMM).replace('{min}', sp.headHeightMin).replace('{max}', sp.headHeightMax), okF ? 'pass' : 'fail', okF ? null : T.resultHeadHeightFail);
      } else add(T.resultHeadHeightSimple.replace('{v}', m.faceMM), 'pass');
      if(m.eyePositionPercent){ var e = parseFloat(m.eyePositionPercent); add(T.resultEyePos.replace('{v}', m.eyePositionPercent), (e >= 33 && e <= 58) ? 'pass' : 'warn'); }
      if(m.crownMarginMM){ var c = parseFloat(m.crownMarginMM); add(T.resultCrownMargin.replace('{v}', m.crownMarginMM), c >= 0.5 ? 'pass' : 'fail', c >= 0.5 ? null : T.resultCrownFail); }
    }
    add(T.resultBg, data.track === 'birefnet' ? 'pass' : 'warn', data.track === 'birefnet' ? null : T.resultBgWarn);
    add(T.resultDpi, 'pass');
    if(precheckData && precheckData.checks){
      precheckData.checks.forEach(function(c){ add(c.label, c.pass ? 'pass' : c.warn ? 'warn' : 'fail', c.warnMsg || null); });
    }
    var dl = document.getElementById('v2-download');
    if(hardFail){ dl.disabled = true; dl.style.opacity = '0.4'; dl.title = T.resultCheckFail; }
    else { dl.disabled = false; dl.style.opacity = ''; dl.title = ''; }
  }

  /* ─── 생성 (결제 토큰 경유) ─── */
  function clearGenTimers(){
    if(window.__genStageTimer) clearInterval(window.__genStageTimer);
    ['__genLongWaitTimer', '__genBackupTimer', '__genRefundTimer'].forEach(function(k){ if(window[k]) clearTimeout(window[k]); window[k] = null; });
  }
  var genBusy = false; // 중복 제출 잠금 — 더블클릭 이중 차감 실사고 (2026-07-07 13:48, 200ms 간격 2건)
  function doGenerate(){
    if(genBusy) return;
    genBusy = true;
    hideError();
    payBusy = false;
    gaTrack('generate_click', null, true); // 재생성 포함 매회 발화
    showPhase(phaseGen);
    setGenMessage(GEN_TEXT_DEFAULT, GEN_SUB_DEFAULT);
    // 연출: 실제 파이프라인 단계를 순환 표기 (재단→매팅→검수) — 대기가 신뢰가 되게
    clearGenTimers();
    var genSub = GEN_SUB_DEFAULT;
    var genBk = engineBackup() && !!T.genBackupWorking;
    (function(){
      var stages = fitResult ? [T.genStage1, T.genStage2, T.genStage3] : [GEN_TEXT_DEFAULT];
      var i = 0;
      window.__genStageTimer = setInterval(function(){
        i = (i + 1) % stages.length;
        setGenMessage(stages[i], genSub);
      }, 3500);
    })();
    if(genBk){
      window.__genBackupTimer = setTimeout(function(){
        if(window.__genStageTimer) clearInterval(window.__genStageTimer);
        setGenMessage(T.genBackupWorking, genSub);
      }, 10000);
    }
    // 유료 경로 실패 = 서버 refundGate가 생성권(토큰 쿼터·크레딧)을 되돌린다 — 실측 확인된 경로만 (ch8 5조 — 되는 것만)
    window.__genRefundTimer = setTimeout(function(){
      if(T.genRefundAssure) genSub = T.genRefundAssure;
      if(genBk){ setGenMessage(T.genStillWorking2 || GEN_TEXT_DEFAULT, genSub); }
      else if(genSubEl){ genSubEl.textContent = genSub; }
    }, 25000);
    window.__genLongWaitTimer = setTimeout(function(){
      if(window.__genStageTimer) clearInterval(window.__genStageTimer);
      setGenMessage(T.genStillWorking2 || GEN_TEXT_DEFAULT, genSub);
    }, 35000);
    // 성별 미선택 시 빈 값 전송 — 서버 프롬프트가 "원본 보존" 선언으로 처리 (2026-07-17 성전환 실사고 P0)
    var body = { image: uploadedBase64, format: CFG.format, gender: subjectSelection.gender || '', age: subjectSelection.age || 'adult', slug: CFG.slug, lang: document.documentElement.lang || 'ko' };
    if(fitResult && fitResult.frame){ body.fitFrame = fitResult.frame; body.fitMeta = fitResult.meta; body.fitMetrics = fitResult.metrics; }
    if(pay.token) body.paymentToken = pay.token;
    if(CFG.t1 && attirePicker){ var asel = attirePicker.getSelection(); if(asel.attire_desc) body.attireDesc = asel.attire_desc; if(asel.attireTie) body.attireTie = asel.attireTie; }
    fetch('/api/idphoto/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
    .then(function(res){
      genBusy = false;
      var data = res.d;
      clearGenTimers();
      if(data.image){
        if(typeof data.remainingGenerates === 'number'){ pay.remaining = data.remainingGenerates; persistOrder(); }
        document.getElementById('v2-result-before-img').src = uploadedBase64;
        var afterImg = document.getElementById('v2-result-after-img');
        afterImg.src = 'data:image/png;base64,' + data.image;
        // 누끼 체험: 배경이 위→아래로 벗겨지듯 결과가 드러남 (birefnet 트랙 = 원본 픽셀 보존)
        if(data.track === 'birefnet'){
          afterImg.style.transition = 'none';
          afterImg.style.clipPath = 'inset(0 0 100% 0)';
          requestAnimationFrame(function(){ requestAnimationFrame(function(){
            afterImg.style.transition = 'clip-path 1.3s cubic-bezier(.22,.9,.24,1)';
            afterImg.style.clipPath = 'inset(0 0 0 0)';
          }); });
        } else { afterImg.style.clipPath = ''; afterImg.style.transition = ''; }
        renderResultChecklist(data);
        showPhase(phaseResult);
        gaTrack('preview_view');
      } else {
        var code = data.code || '';
        var msg = code === 'TOKEN_EXPIRED' ? T.tokenExpired
          : code === 'TOKEN_USED' ? T.tokenUsed
          : code === 'INVALID_TOKEN' ? T.tokenInvalid
          : code === 'GENERATE_LIMIT' ? T.genLimit
          : code === 'RATE_LIMITED' ? T.rateLimited
          : code === 'T1_GENERATE_FAILED' ? (data.error || T.errGen)
          : code === 'FACE_NOT_DETECTED' ? (data.error || T.errGen)
          : code === 'GENERATE_FAILED' ? T.errGen
          : (data.error || T.errGen);
        if(code === 'TOKEN_EXPIRED' || code === 'TOKEN_USED' || code === 'INVALID_TOKEN'){
          pay.token = null; pay.remaining = null; pay.expiresAt = null;
          sessionStorage.removeItem(ORDER_KEY);
        } else if(code === 'GENERATE_LIMIT'){
          pay.remaining = 0; persistOrder();
        }
        // 결제 단계로 되돌아가는 에러는 결제 영역 슬롯에 — 전역 슬롯은 모바일에서 시야 밖 (결함 A)
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
        if(uploadedBase64) showPayError(msg); else showError(msg);
      }
    })
    .catch(function(){ clearGenTimers(); genBusy = false; showPhase(uploadedBase64 ? phasePay : phaseUpload); if(uploadedBase64) showPayError(T.errNet); else showError(T.errNet); });
  }

  var payCreditBtn = document.getElementById('v2-pay-credit');
  if(payCreditBtn){
    payCreditBtn.addEventListener('click', function(){
      // 크레딧 경로 (6/24 임시 /headshot 리다이렉트 교체, 2026-07-05 작가님):
      // 로그인+잔액 10c↑ → 이 페이지에서 바로 생성(서버 세션 크레딧 차감).
      // 비로그인/부족 → 이미지 보존 후 충전 페이지(로그인·신규 10c·충전 → returnUrl 복귀).
      if(!uploadedBase64 || payBusy) return;
      hideError();
      var toCharge = function(){
        persistImage(function(){
          window.location.href = '/credits.html?from=' + encodeURIComponent(location.pathname + '?credits=return');
        });
      };
      fetch('/api/credits', { credentials: 'same-origin' })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          if(d && typeof d.credits === 'number' && d.credits >= 10) doGenerate();
          else toCharge();
        })
        .catch(toCharge);
    });
  }

  /* ─── Result phase ─── */
  document.getElementById('v2-download').addEventListener('click', function(){
    var img = document.getElementById('v2-result-after-img');
    if(!img.src) return;
    function trigger(){ saveImageToDevice(img.src, CFG.downloadName); }
    // 결제 토큰 경로: 다운로드 직전 1회성 최종 소모 API 호출 성공 후 실제 다운로드 (서버 계약 5번)
    if(!pay.token || pay.consumed) return trigger();
    fetch('/api/download/direct?token=' + encodeURIComponent(pay.token))
    .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, status: r.status, d: d }; }).catch(function(){ return { ok: r.ok, status: r.status, d: {} }; }); })
    .then(function(res){
      if(res.ok && res.d && res.d.success){
        pay.consumed = true; clearStored(); trigger();
      } else if(res.status === 409){
        // 이미 소모된 토큰 — 화면에 있는 이미지는 그대로 제공
        pay.consumed = true; trigger();
      } else {
        showError(T.downloadFail);
      }
    })
    .catch(function(){ showError(T.downloadFail); });
  });

  document.getElementById('v2-btn-retry2').addEventListener('click', function(){
    // 토큰(재생성 잔여)은 유지 — 진행하기에서 재결제 없이 생성
    uploadedBase64 = null;
    hideError();
    showPhase(phaseUpload);
  });

  /* ─── 결제 복귀 처리 (토스 리다이렉트 / 레몬 리턴) ─── */
  (function resume(){
    var qs;
    try{ qs = new URLSearchParams(location.search); }catch(e){ return; }
    var mode = qs.get('toss') || (qs.get('lemon') ? 'lemon' : (qs.get('credits') ? 'credits' : null));
    if(!mode) return;
    var pk = qs.get('paymentKey');
    var oid = qs.get('orderId');
    var failMsg = qs.get('message');
    try{ history.replaceState(null, '', location.pathname); }catch(e){}

    var savedImg = loadImage();
    if(savedImg){
      uploadedBase64 = savedImg;
      // 복원본이 브라우저가 못 읽는 포맷이면 깨진 아이콘 대신 자리를 비운다 (HEIC 방어)
      ['v2-check-img','v2-preview-img'].forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        el.onerror = function(){ el.style.display = 'none'; };
        el.src = savedImg;
      });
    }
    var saved = loadOrder();
    if(saved){
      pay.orderId = saved.orderId;
      pay.token = saved.token || null;
      pay.remaining = (typeof saved.remaining === 'number') ? saved.remaining : null;
      pay.expiresAt = saved.expiresAt || null;
      if(saved.attire) Object.assign(attireSelection, saved.attire);
      if(saved.subject) Object.assign(subjectSelection, saved.subject);
      if(saved.toss) lastTossInit = saved.toss;
    }

    if(mode === 'direct' && pk && oid){
      showPhase(phaseGen);
      setGenMessage(T.payConfirming, '');
      fetch('/api/payments/toss/direct', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ paymentKey: pk, orderId: oid })
      })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })
      .then(function(res){
        if(res.ok && res.d && res.d.paymentToken){
          pay.orderId = oid; pay.token = res.d.paymentToken; pay.consumed = false;
          pay.expiresAt = res.d.tokenExpiresAt || (Date.now() + 86400000);
          persistOrder();
          gaTrackPurchase(oid);
          if(uploadedBase64) doGenerate(); else needReupload();
        } else {
          showPhase(uploadedBase64 ? phasePay : phaseUpload);
          reportPayFail('confirm', (res.d && res.d.code) || 'CONFIRM_FAILED', (res.d && res.d.error) || '');
          showPayError((res.d && res.d.error) || T.payConfirmFail);
        }
      })
      .catch(function(){
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
        reportPayFail('confirm', 'CONFIRM_NETWORK', 'confirm request failed');
        showPayError(T.payConfirmFail);
      });
    } else if(mode === 'fail'){
      /* 실패 복귀 (2026-09-19 결함 F) — 기존에는 리로드로 위젯이 사라져 첫 버튼부터 재시작 =
         새 주문이 계속 쌓였다. 저장된 주문이 유효하면 위젯을 자동 재오픈하고 사유를 버튼 위에 띄운다. */
      if(oid) pay.orderId = oid;
      var fmsg = failMsg || T.payCancelled;
      reportPayFail('return', qs.get('code') || 'RETURN_FAIL', fmsg);
      showPhase(uploadedBase64 ? phasePay : phaseUpload);
      if(uploadedBase64 && !pay.token && lastTossInit && lastTossInit.provider === 'toss' && lastTossInit.clientKey){
        if(oid){ lastTossInit.orderId = oid; persistOrder(); }
        mountAttirePicker();
        syncSubjectChips('pay');
        startToss(lastTossInit);
      }
      showPayError(fmsg + ' ' + T.payRetryHint);
    } else if(mode === 'lemon'){
      if(pay.token){
        if(uploadedBase64) doGenerate(); else needReupload();
      } else if(saved && saved.orderId){
        showPhase(phaseGen);
        setGenMessage(T.payWaiting, T.payWaitingHint);
        startPolling(saved.orderId);
      }
    } else if(mode === 'credits'){
      // 충전 페이지 복귀 — 잔액 재확인 후 크레딧 생성, 미달이면 결제 선택 화면 유지
      if(!uploadedBase64){ needReupload(); return; }
      fetch('/api/credits', { credentials: 'same-origin' })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          if(d && typeof d.credits === 'number' && d.credits >= 10) doGenerate();
          else showPhase(phasePay);
        })
        .catch(function(){ showPhase(phasePay); });
    }
  })();
  }
  return { mount: mount };
})();
if (window.__SPECS_CFG__) {
  var _el = document.getElementById('v2-steps');
  if (_el) SpecsFunnel.mount(_el, window.__SPECS_CFG__);
}
