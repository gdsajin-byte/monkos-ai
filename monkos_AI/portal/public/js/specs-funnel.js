/* specs-funnel.js — render-specs.js pageScript에서 분리 (2026-07-12 퍼널 분리 수술)
   설정 주입: SSR이 인라인 <script>로 window.__SPECS_CFG__를 선행 정의 (원본 상수 specsDetailV2Fragment pageScript) */
(function(){
  var CFG = window.__SPECS_CFG__;
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
  var pay = { orderId: null, token: null, remaining: null, consumed: false };
  // 피사체 + 의상 선택 상태
  var subjectSelection = { age: 'adult', gender: null };
  var attireSelection = { type: 'asis', suitColor: 'navy', shirtColor: 'white', tieColor: 'notie', tiePattern: 'solid', casualColor: 'beige', blouseColor: 'white' };
  function getAttireDesc(){
    var t = attireSelection.type;
    if(t === 'asis') return 'Keep current clothing as-is. Only ensure it looks neat and tidy.';
    if(t === 'suit'){
      var sc = attireSelection.suitColor === 'lightgray' ? 'light gray' : attireSelection.suitColor;
      var shc = attireSelection.shirtColor.replace('light','light ');
      var desc = 'Dress this person in a ' + sc + ' formal business suit with a ' + shc + ' collared dress shirt';
      if(attireSelection.tieColor === 'notie') desc += ', no tie.';
      else desc += ' and a ' + (attireSelection.tiePattern === 'stripe' ? 'striped ' : '') + attireSelection.tieColor + ' tie.';
      return desc;
    }
    if(t === 'blouse'){
      var bc = attireSelection.blouseColor === 'lightblue' ? 'light blue' : attireSelection.blouseColor;
      return 'Dress this person in a neat ' + bc + ' collared blouse, professional and clean.';
    }
    if(t === 'casual'){
      var cc = attireSelection.casualColor;
      return 'Dress this person in a clean, neat ' + cc + ' knit sweater with a round neckline, professional casual look.';
    }
    return null;
  }
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
  var gaFired = {};
  var GA_PAY = CFG.market === 'kr'
    ? { payment_provider: 'toss', currency: 'KRW', value: 2000 }
    : { payment_provider: 'lemon', currency: 'USD', value: 1.99 };
  function gaTrack(name, params, repeat){
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
  }
  function setGenMessage(text, sub){
    if(genTextEl) genTextEl.textContent = text;
    if(genSubEl) genSubEl.textContent = sub || '';
  }
  function showError(msg){ errorMsg.textContent = msg; errorMsg.classList.add('show'); }
  function hideError(){ errorMsg.classList.remove('show'); }
  function returnBase(){ return location.origin + location.pathname; }
  function hasUsableToken(){ return !!(pay.token && !pay.consumed && (pay.remaining === null || pay.remaining > 0)); }

  /* ─── 리다이렉트 생존 저장소 (sessionStorage) ─── */
  function persistOrder(){
    try{ sessionStorage.setItem(ORDER_KEY, JSON.stringify({ orderId: pay.orderId, token: pay.token, remaining: pay.remaining, slug: CFG.slug, ts: Date.now(), attire: attireSelection, subject: subjectSelection })); }catch(e){}
  }
  function loadOrder(){
    try{
      var d = JSON.parse(sessionStorage.getItem(ORDER_KEY) || 'null');
      return (d && d.slug === CFG.slug) ? d : null;
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
      try{ sessionStorage.setItem(IMG_KEY, small || uploadedBase64); }catch(e){
        // 저장 실패(HEIC 디코드 불가 + 쿼터 초과 등) — 결제는 진행하고 복귀 시 재업로드 안내(imgLost)
        try{ sessionStorage.removeItem(IMG_KEY); }catch(e2){}
      }
      cb();
    });
  }
  function loadImage(){ try{ return sessionStorage.getItem(IMG_KEY); }catch(e){ return null; } }

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

  function handleFile(file){
    hideError();
    fitResult = null; precheckData = null;
    if(!file.type.match(/image\/(jpeg|png|heic|heif|webp)/i)) return showError(T.errFileType);
    if(file.size > 10*1024*1024) return showError(T.errFileSize);
    var reader = new FileReader();
    reader.onload = function(ev){
      uploadedBase64 = ev.target.result;
      document.getElementById('v2-check-img').src = uploadedBase64;
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
        body: JSON.stringify({ image: uploadedBase64 })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        checkLoading.style.display = 'none';
        if(data && (typeof data.measurable !== 'undefined' || data.checks)){
          precheckData = data;
          // 규정 8항목은 결과 화면에서 사후 표시 (ORDER_20260707 Task 1: 사전=측정성만)
          if(data.measurable === false){
            var reasons = {
              no_face: '얼굴을 찾지 못했어요. 정면 얼굴이 나온 사진을 올려주세요.',
              multiple_faces: '사진에 여러 명이 있어요. 1인 사진을 올려주세요.',
              face_too_small: '얼굴이 너무 작아요. 가슴 위까지 나오게 찍어주세요.',
              face_too_close: '너무 가까워요. 조금 멀리서 찍어주세요.',
              head_cropped: '머리 위가 잘렸어요. 머리 전체가 나오게 찍어주세요.',
              crown_cropped: '정수리가 잘렸어요. 머리 전체가 나오게 찍어주세요.',
              chin_cropped: '턱 아래가 잘렸어요. 어깨가 보이게 찍어주세요.',
              off_center: '얼굴이 한쪽으로 치우쳐 있어요. 중앙에서 찍어주세요.',
              too_dark: '사진이 너무 어두워요. 밝은 곳에서 찍어주세요.',
              too_bright: '사진이 너무 밝아요. 직사광선을 피해주세요.',
              head_tilted: '고개가 기울어져 있어요. 고개를 바로 세우고 찍어주세요.',
              not_frontal: '옆모습이에요. 정면을 바라보고 찍어주세요.',
              chin_too_low: '턱을 너무 숙이고 있어요. 정면을 바라보고 찍어주세요.',
              chin_too_high: '턱을 너무 들고 있어요. 정면을 바라보고 찍어주세요.',
              uneven_lighting: '얼굴에 그림자가 져 있어요. 균일한 조명에서 찍어주세요.',
              occluded: '얼굴이 가려져 있어요. 가림 없는 사진을 올려주세요.'
            };
            summary.className = 'v2-checklist-summary v2-summary-fail';
            summary.textContent = reasons[data.rejectionReason] || '이 사진으로는 정밀 측정이 어려워요. 다른 사진을 올려주세요.';
            document.getElementById('v2-btn-proceed').style.display = 'none';
            checkActions.style.display = 'flex';
          } else {
            if(CFG.pilot) prepareFreeReady(); else runFit();
          }
          // 이미지 저장을 검수 시점에 선행 — 결제 클릭 체인에서 캔버스 압축을 제거해
          // 토스 결제창의 user activation 만료(팝업 차단)를 방지 (2026-07-05 E2E 실패 수정)
          persistImage(function(){});
        } else {
          showError(data.code === 'RATE_LIMITED' ? T.rateLimited : (data.error || T.errCheck));
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

  function proceedToPay(){
    document.getElementById('v2-preview-img').src = uploadedBase64;
    if(hasUsableToken()) return doGenerate();
    // T1 의상 인라인 표시/숨김
    var attireInline = document.getElementById('v2-attire-inline');
    if(attireInline) attireInline.style.display = CFG.t1 ? '' : 'none';
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
      fs2.textContent = '오늘 무료 횟수를 모두 사용했어요 — 내일 3회가 다시 채워져요.';
      mkBtn.textContent = '₩2,000으로 계속 만들기';
    } else {
      pilotFreeExhausted = false;
      fs2.className = 'ip-summary-ok';
      fs2.textContent = '사진 확인 완료';
      mkBtn.textContent = '무료로 만들기';
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
    if(d.judge && d.judge.blocked) return '이 사진으로는 규격을 맞추기 어려워요. 다른 사진을 올려주세요.';
    if(pc.eyeOpen && !pc.eyeOpen.ok) return '눈이 감겨 있어요. 카메라를 보고 다시 찍은 사진을 올려주세요.';
    if(pc.roll && !pc.roll.ok) return '고개가 기울어져 있어요. 수평을 맞춘 사진을 올려주세요.';
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
    st.textContent = '규격 안착 완료 — 배경을 지우는 중이에요';
    fs.className = 'ip-summary-ok';
    fs.textContent = '배경을 지우고 있어요...';
    (pilotGenPromise || freeGenerateRequest(d)).then(function(res){
      freeBusy = false;
      if(!res.ok){
        var code = res.d && res.d.code;
        if(code === 'FREE_LIMIT'){
          updateFreeRemainingUI(0); gaTrack('free_limit_hit', {}, true);
          pilotFreeExhausted = true;
          showError('오늘 무료 횟수를 모두 사용했어요 — 아래 결제로 바로 계속 만들 수 있어요.');
          proceedToPay(); // 무료 막혀도 유료 길은 연다
          return;
        }
        showError((res.d && res.d.error) || '무료 생성에 실패했어요. 잠시 후 다시 시도해주세요.');
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
      showPhase(phaseFree);
      try{ window.scrollTo({ top: document.getElementById('v2-steps').offsetTop - 12, behavior: 'smooth' }); }catch(e){}
    }).catch(function(){
      freeBusy = false;
      showError(T.errNet);
      st.textContent = '';
      fa.style.display = 'flex';
    });
  }
  function freeGenerateRequest(d){
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
    if(hasUsableToken()) return doGenerate(); // 미사용 결제 토큰 보유 시 유료 경로 우선 (방어적 — 토큰 방치 방지)
    if(!fitResult || !fitResult.frame){ proceedToPay(); return; }
    freeBusy = true;
    hideError();
    setGenMessage('무료로 만드는 중이에요', '배경 제거 + 여권 규격 크롭 — 잠시만 기다려주세요');
    showPhase(phaseGen);
    freeGenerateRequest(fitResult)
    .then(function(res){
      freeBusy = false;
      setGenMessage(GEN_TEXT_DEFAULT, GEN_SUB_DEFAULT);
      if(!res.ok){
        var code = res.d && res.d.code;
        if(code === 'FREE_LIMIT'){
          updateFreeRemainingUI(0);
          gaTrack('free_limit_hit', {}, true);
          pilotFreeExhausted = true;
          showError('오늘 무료 횟수를 모두 사용했어요 — 아래 결제로 바로 계속 만들 수 있어요.');
          proceedToPay();
          return;
        }
        showError((res.d && res.d.error) || '무료 생성에 실패했어요. 잠시 후 다시 시도해주세요.');
        restoreFitActions();
        return;
      }
      freeResultB64 = res.d.image;
      var img = document.getElementById('ip-free-img');
      if(img) img.src = 'data:image/png;base64,' + freeResultB64;
      updateFreeRemainingUI(res.d.remainingFree);
      gaTrack('free_generate_done', { gen_track: res.d.track || '' }, true);
      showPhase(phaseFree);
      try{ window.scrollTo({ top: document.getElementById('v2-steps').offsetTop - 12, behavior: 'smooth' }); }catch(e){}
    })
    .catch(function(){
      freeBusy = false;
      setGenMessage(GEN_TEXT_DEFAULT, GEN_SUB_DEFAULT);
      showError(T.errNet);
      restoreFitActions();
    });
  }
  if(CFG.pilot && phaseFree){
    document.getElementById('ip-free-download').addEventListener('click', function(){
      if(!freeResultB64) return;
      var a = document.createElement('a');
      a.href = 'data:image/png;base64,' + freeResultB64;
      a.download = CFG.downloadName.replace(/\.jpg$/, '_free.png');
      document.body.appendChild(a); a.click(); a.remove();
      gaTrack('free_download', {}, true);
    });
    document.getElementById('ip-free-retry').addEventListener('click', function(){
      uploadedBase64 = null; fitResult = null; precheckData = null; freeResultB64 = null;
      showPhase(phaseUpload);
    });
    document.getElementById('ip-t1-buy').addEventListener('click', function(){
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
      fs.textContent = '사진을 규격에 맞추는 중이에요...';
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
      var texts = ['얼굴 위치 분석 중', '랜드마크 정밀 측정 중', '규격 계산 중', '전문가 검수 중'];
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
          showError('이 사진은 정밀 측정이 어려워요. 정면 얼굴이 크게 나온 사진으로 다시 시도해주세요.');
          showPhase(phaseUpload);
          return;
        }
        if(fitMode === 'pilot'){ fitMode = 'default'; freeBusy = false; showError('지금 무료 만들기가 어려워요. 잠시 후 다시 시도해주세요.'); prepareFreeReady(); return; }
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
      ['v2-fit-line-eye',   d.lines.eyeY,     '눈높이 확인'],
      ['v2-fit-line-chin',  d.lines.chinY,    '턱 라인 확인'],
      ['v2-fit-line-crown', d.lines.crownY,   '정수리 산정 — 1:1 해부학 앵커'],
      ['v2-fit-line-hair',  d.lines.hairTopY, '헤어 여백 검토'],
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
    setStatus('얼굴 위치 분석 중');

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
    fitAfter(t, function(){ setStatus('규격 프레임 정렬'); fEl.style.opacity = '1'; });
    t += 700;

    // 3) 전문가(비전) 보정 — 프레임"만" 이동 (사진 불변)
    var moved = d.frameInitial && (Math.abs(d.frame.y - d.frameInitial.y) > 1 || Math.abs(d.frame.h - d.frameInitial.h) > 1);
    if(moved){
      fitAfter(t, function(){
        setStatus(d.vision && d.vision.executed ? '전문가 보정 실행 — 헤어 여백 확보' : '전문가 보정 — 여백 균형');
        fEl.style.top = d.frame.y + 'px';
        fEl.style.left = d.frame.x + 'px';
        fEl.style.width = d.frame.w + 'px';
        fEl.style.height = d.frame.h + 'px';
      });
      t += 1050;
    }

    // 4) 카메라가 프레임으로 자연스럽게 다가감 (균일 줌 — 왜곡 불가)
    fitAfter(t, function(){
      setStatus('규격에 맞춰 안착 중');
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
    if(!CFG.pilot){
      if(m.faceMm != null) badge('얼굴', m.faceMm + 'mm', j.face);
      if(m.eyeRatio != null) badge('눈', (m.eyeRatio * 100).toFixed(0) + '%', j.eye);
      if(m.topMm != null) badge('상단', m.topMm + 'mm', j.top);
      if(m.bottomMm != null) badge('하단', m.bottomMm + 'mm', j.bottom);
    }
    if(d.poseCheck){
      var sfx = CFG.pilot; // 안내 접미문은 파일럿 한정 — 비파일럿(ja/en 포함)은 기존 짧은 라벨 유지
      if(d.poseCheck.roll && !d.poseCheck.roll.ok) badge('기울기', Math.abs(d.poseCheck.roll.value).toFixed(0) + (sfx ? '° — 수평을 맞춰주세요' : '°'), 'fail');
      else if(d.poseCheck.roll && !CFG.pilot) badge('기울기', Math.abs(d.poseCheck.roll.value).toFixed(0) + '°', 'pass');
      if(d.poseCheck.eyeOpen && !d.poseCheck.eyeOpen.ok) badge('눈', sfx ? '감김 — 다른 사진을 올려주세요' : '감김', 'fail');
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
      fs.textContent = CFG.pilot ? '이 사진으로는 어려워요. 다른 사진을 올려주세요.' : '규격 허용 범위를 벗어났습니다. 다른 사진을 권장해요.';
      mk.disabled = true; mk.style.opacity = '.4';
    } else {
      fs.className = 'v2-checklist-summary v2-summary-pass';
      fs.textContent = CFG.pilot ? '규격에 맞아요. 이대로 만들 수 있어요.' : '규격에 안착했습니다. 이대로 만들 수 있어요.';
      mk.disabled = false; mk.style.opacity = '';
    }
    document.getElementById('v2-fit-actions').style.display = 'flex';
    if(CFG.pilot){
      var cap = document.getElementById('ip-fit-caption');
      var t2l = document.getElementById('ip-fit-t2-link');
      if(cap) cap.style.display = j.blocked ? 'none' : 'block';
      if(t2l) t2l.style.display = 'block';
      updateFreeRemainingUI(null);
    }
  }

  document.getElementById('v2-fit-change').addEventListener('click', function(){
    uploadedBase64 = null; fitResult = null; precheckData = null;
    showPhase(phaseUpload);
  });
  document.getElementById('v2-fit-make').addEventListener('click', function(){
    if(CFG.pilot){
      if(freeBusy) return;
      if(hasUsableToken()) return doGenerate();
      if(pilotFreeExhausted) return proceedToPay(); // 무료 소진 → 유료 길 직행
      if(fitResult && fitResult.frame) return doFreeGenerate(); // 재시도 경로 (fit 이미 확보)
      freeBusy = true; hideError();
      fitMode = 'pilot';
      runFit(); // 시어터 + fit — 응답 시 pilotOnFit이 매팅 병행 시작
      return;
    }
    proceedToPay();
  });

  document.getElementById('v2-btn-proceed').addEventListener('click', function(){ runFit(); });

  /* ─── 피사체 + 의상 인라인 (pay phase 내부) ─── */
  var ATTIRE_COLORS = {
    suit: { navy:'#1b2a4a', charcoal:'#36454f', black:'#1a1a1a', lightgray:'#c0c0c0' },
    shirt: { white:'#f0f0f0', lightblue:'#ADD8E6', lightpink:'#FFB6C1', lightbeige:'#F5DEB3' },
    tie: { notie:null, navy:'#1b2a4a', wine:'#722f37', black:'#1a1a1a' },
    blouse: { white:'#f0f0f0', cream:'#FFFDD0', lightblue:'#ADD8E6' },
    casual: { beige:'#D4B896', navy:'#1b2a4a', charcoal:'#36454f', cream:'#FFFDD0' }
  };
  var ATTIRE_LABELS = {
    suit: { navy:'네이비', charcoal:'차콜', black:'블랙', lightgray:'라이트그레이' },
    shirt: { white:'화이트', lightblue:'연블루', lightpink:'연핑크', lightbeige:'연베이지' },
    tie: { notie:'노타이', navy:'네이비', wine:'와인', black:'블랙' },
    tiePattern: { solid:'민무늬', stripe:'스트라이프' },
    blouse: { white:'화이트', cream:'크림', lightblue:'연블루' },
    casual: { beige:'베이지', navy:'네이비', charcoal:'차콜', cream:'크림' }
  };
  var attireCardsEl = document.getElementById('v2-attire-cards');
  var attireSubEl = document.getElementById('v2-attire-sub-options');
  var attireSummaryEl = document.getElementById('v2-attire-summary');
  var attireInlineEl = document.getElementById('v2-attire-inline');

  function renderAttireSubOptions(){
    if(!attireSubEl) return;
    var html = '';
    var t = attireSelection.type;
    if(t === 'suit'){
      html += '<div class="v2-attire-sub-section"><div class="v2-attire-sub-label">수트 컬러</div><div class="v2-attire-chips" data-field="suitColor">';
      Object.keys(ATTIRE_COLORS.suit).forEach(function(k){ html += '<div class="v2-attire-chip'+(attireSelection.suitColor===k?' selected':'')+'" data-val="'+k+'"><span class="v2-attire-swatch" style="background:'+ATTIRE_COLORS.suit[k]+'"></span>'+ATTIRE_LABELS.suit[k]+'</div>'; });
      html += '</div></div>';
      html += '<div class="v2-attire-sub-section"><div class="v2-attire-sub-label">셔츠 컬러</div><div class="v2-attire-chips" data-field="shirtColor">';
      Object.keys(ATTIRE_COLORS.shirt).forEach(function(k){ html += '<div class="v2-attire-chip'+(attireSelection.shirtColor===k?' selected':'')+'" data-val="'+k+'"><span class="v2-attire-swatch" style="background:'+ATTIRE_COLORS.shirt[k]+'"></span>'+ATTIRE_LABELS.shirt[k]+'</div>'; });
      html += '</div></div>';
      html += '<div class="v2-attire-sub-section"><div class="v2-attire-sub-label">넥타이</div><div class="v2-attire-chips" data-field="tieColor">';
      Object.keys(ATTIRE_COLORS.tie).forEach(function(k){ html += '<div class="v2-attire-chip'+(attireSelection.tieColor===k?' selected':'')+'" data-val="'+k+'">'+(ATTIRE_COLORS.tie[k]?'<span class="v2-attire-swatch" style="background:'+ATTIRE_COLORS.tie[k]+'"></span>':'')+''+ATTIRE_LABELS.tie[k]+'</div>'; });
      html += '</div></div>';
      if(attireSelection.tieColor && attireSelection.tieColor !== 'notie'){
        html += '<div class="v2-attire-sub-section"><div class="v2-attire-sub-label">넥타이 무늬</div><div class="v2-attire-chips" data-field="tiePattern">';
        Object.keys(ATTIRE_LABELS.tiePattern).forEach(function(k){ html += '<div class="v2-attire-chip'+(attireSelection.tiePattern===k?' selected':'')+'" data-val="'+k+'">'+ATTIRE_LABELS.tiePattern[k]+'</div>'; });
        html += '</div></div>';
      }
    } else if(t === 'blouse'){
      html += '<div class="v2-attire-sub-section"><div class="v2-attire-sub-label">블라우스 컬러</div><div class="v2-attire-chips" data-field="blouseColor">';
      Object.keys(ATTIRE_COLORS.blouse).forEach(function(k){ html += '<div class="v2-attire-chip'+(attireSelection.blouseColor===k?' selected':'')+'" data-val="'+k+'"><span class="v2-attire-swatch" style="background:'+ATTIRE_COLORS.blouse[k]+'"></span>'+ATTIRE_LABELS.blouse[k]+'</div>'; });
      html += '</div></div>';
    } else if(t === 'casual'){
      html += '<div class="v2-attire-sub-section"><div class="v2-attire-sub-label">니트 컬러</div><div class="v2-attire-chips" data-field="casualColor">';
      Object.keys(ATTIRE_COLORS.casual).forEach(function(k){ html += '<div class="v2-attire-chip'+(attireSelection.casualColor===k?' selected':'')+'" data-val="'+k+'"><span class="v2-attire-swatch" style="background:'+ATTIRE_COLORS.casual[k]+'"></span>'+ATTIRE_LABELS.casual[k]+'</div>'; });
      html += '</div></div>';
    }
    attireSubEl.innerHTML = html;
    if(attireSummaryEl){
      var s = '';
      if(t === 'asis') s = '현재 의상 유지, 보정만 적용';
      else if(t === 'suit'){
        s = (ATTIRE_LABELS.suit[attireSelection.suitColor]||'') + ' 정장';
        s += ' · ' + (ATTIRE_LABELS.shirt[attireSelection.shirtColor]||'') + ' 셔츠';
        s += ' · ' + (ATTIRE_LABELS.tie[attireSelection.tieColor]||'');
        if(attireSelection.tieColor !== 'notie') s += ' ' + (ATTIRE_LABELS.tiePattern[attireSelection.tiePattern]||'');
      } else if(t === 'blouse') s = (ATTIRE_LABELS.blouse[attireSelection.blouseColor]||'') + ' 블라우스';
      else if(t === 'casual') s = (ATTIRE_LABELS.casual[attireSelection.casualColor]||'') + ' 니트';
      attireSummaryEl.textContent = s;
    }
    // 영유아 시 의상 선택 비활성
    if(attireInlineEl) attireInlineEl.style.display = (CFG.t1 && subjectSelection.age !== 'baby') ? '' : 'none';
  }

  if(attireCardsEl) attireCardsEl.addEventListener('click', function(e){
    var card = e.target.closest('[data-attire]');
    if(!card) return;
    attireSelection.type = card.dataset.attire;
    attireCardsEl.querySelectorAll('.v2-attire-card').forEach(function(c){ c.classList.toggle('selected', c === card); });
    renderAttireSubOptions();
  });
  if(attireSubEl) attireSubEl.addEventListener('click', function(e){
    var chip = e.target.closest('.v2-attire-chip');
    if(!chip) return;
    var field = chip.parentElement.dataset.field;
    var val = chip.dataset.val;
    attireSelection[field] = val;
    renderAttireSubOptions();
  });

  // 피사체 칩 이벤트 (fit + pay 양쪽 공유)
  document.querySelectorAll('.v2-subject-section').forEach(function(sec){
    sec.addEventListener('click', function(e){
      var chip = e.target.closest('.v2-attire-chip');
      if(!chip) return;
      var field = chip.parentElement.dataset.field;
      var val = chip.dataset.val;
      if(field === 'age') subjectSelection.age = val;
      else if(field === 'gender') subjectSelection.gender = val;
      syncSubjectChips();
      renderAttireSubOptions();
    });
  });

  renderAttireSubOptions();

  /* ─── Pay phase ─── */
  document.getElementById('v2-change-photo').addEventListener('click', function(){
    uploadedBase64 = null;
    showPhase(phaseUpload);
  });

  document.getElementById('v2-pay-instant').addEventListener('click', function(){
    if(!uploadedBase64 || payBusy) return;
    // 결제 완료 토큰 보유 시 이중 결제 방지 — 바로 생성
    if(hasUsableToken()) return doGenerate();
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
        if(res.status === 503) showError(T.payUnavailable);
        else if(res.status === 429) showError(T.rateLimited);
        else showError((res.d && res.d.error) || T.payInitFail);
        return;
      }
      var d = res.d;
      pay.orderId = d.orderId; pay.token = null; pay.remaining = null; pay.consumed = false;
      // orderId 확보 후 주문 단위 1회 발화 — 에러 후 재클릭 중복 방지 + purchase와 쌍 정합
      gaTrackOrder('begin_checkout', d.orderId, { payment_provider: GA_PAY.payment_provider, currency: GA_PAY.currency, value: GA_PAY.value });
      persistOrder();
      // 이미지 저장은 검수 통과 시점에 선행 완료 — 여기서 캔버스 압축을 돌리면
      // user activation이 만료돼 토스 결제창이 팝업 차단됨 (2026-07-05 E2E 실패 원인)
      if(d.provider === 'toss') startToss(d, lemonWin);
      else startLemon(d, lemonWin);
    })
    .catch(function(){
      payBusy = false;
      if(lemonWin){ try{ lemonWin.close(); }catch(e){} }
      showError(T.errNet);
    });
  });

  // 토스 결제위젯 방식 (2026-07-05 전환) — 상점 라이브 계약이 위젯 연동(live_gck)에만 있음.
  // 구 결제창(payment/live_ck) 방식은 API 개별연동 MID 계약 미완료로 라이브 결제 불가 (2026-03 위젯 전환 이력).
  var tossWidgets = null, tossWidgetRendered = false;
  function startToss(d, extraWin){
    if(extraWin){ try{ extraWin.close(); }catch(e){} }
    if(!window.TossPayments){ payBusy = false; showError(T.payInitFail); return; }
    var wrap = document.getElementById('v2-toss-widget');
    var btn = document.getElementById('v2-pay-confirm');
    try{
      if(!tossWidgets){
        tossWidgets = window.TossPayments(d.clientKey).widgets({ customerKey: window.TossPayments.ANONYMOUS });
      }
      btn.textContent = '₩' + String(d.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' 결제하기';
      wrap.style.display = 'block';
      tossWidgets.setAmount({ currency: d.currency || 'KRW', value: d.amount })
        .then(function(){
          if(tossWidgetRendered) return;
          return tossWidgets.renderPaymentMethods({ selector: '#v2-pm' })
            .then(function(){ return tossWidgets.renderAgreement({ selector: '#v2-agree' }); })
            .then(function(){ tossWidgetRendered = true; });
        })
        .then(function(){
          payBusy = false;
          wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        })
        .catch(function(e){
          payBusy = false; wrap.style.display = 'none';
          showError((e && e.message) || T.payInitFail);
        });
      btn.onclick = function(){
        var base = returnBase();
        tossWidgets.requestPayment({
          orderId: d.orderId,
          orderName: d.orderName,
          successUrl: base + '?toss=direct',
          failUrl: base + '?toss=fail'
        }).catch(function(err){
          showError(err && err.code === 'USER_CANCEL' ? T.payCancelled : ((err && err.message) || T.payInitFail));
        });
      };
    }catch(e){ payBusy = false; showError(T.payInitFail); }
  }

  function startLemon(d, lemonWin){
    showPhase(phaseGen);
    setGenMessage(T.payWaiting, T.payWaitingHint);
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
        showError(T.payTimeout);
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
        return;
      }
      fetch('/api/payments/direct/status?orderId=' + encodeURIComponent(orderId))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d.status === 'paid' && d.paymentToken){
          stopPolling(); payBusy = false;
          pay.orderId = orderId; pay.token = d.paymentToken; pay.remaining = null; pay.consumed = false;
          persistOrder();
          gaTrackPurchase(orderId);
          if(uploadedBase64) doGenerate(); else needReupload();
        } else if(d.status === 'failed' || d.status === 'amount_mismatch' || d.status === 'refunded'){
          stopPolling(); payBusy = false;
          showError(T.payFailed);
          showPhase(uploadedBase64 ? phasePay : phaseUpload);
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
        add('머리 높이 ' + m.faceMM + 'mm (허용 ' + sp.headHeightMin + '~' + sp.headHeightMax + 'mm)', okF ? 'pass' : 'fail', okF ? null : '허용 범위를 벗어났습니다. 다른 사진을 권장해요.');
      } else add('머리 높이 ' + m.faceMM + 'mm', 'pass');
      if(m.eyePositionPercent){ var e = parseFloat(m.eyePositionPercent); add('눈 위치 ' + m.eyePositionPercent + '%', (e >= 33 && e <= 58) ? 'pass' : 'warn'); }
      if(m.crownMarginMM){ var c = parseFloat(m.crownMarginMM); add('정수리 여백 ' + m.crownMarginMM + 'mm', c >= 0.5 ? 'pass' : 'fail', c >= 0.5 ? null : '정수리가 프레임 상단에 닿습니다.'); }
    }
    add('배경', data.track === 'birefnet' ? 'pass' : 'warn', data.track === 'birefnet' ? null : 'AI 재구성 배경으로 생성되었습니다.');
    add('해상도 · 300DPI', 'pass');
    if(precheckData && precheckData.checks){
      precheckData.checks.forEach(function(c){ add(c.label, c.pass ? 'pass' : c.warn ? 'warn' : 'fail', c.warnMsg || null); });
    }
    var dl = document.getElementById('v2-download');
    if(hardFail){ dl.disabled = true; dl.style.opacity = '0.4'; dl.title = '검수 미통과 항목이 있습니다'; }
    else { dl.disabled = false; dl.style.opacity = ''; dl.title = ''; }
  }

  /* ─── 생성 (결제 토큰 경유) ─── */
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
    if(window.__genStageTimer) clearInterval(window.__genStageTimer);
    (function(){
      var stages = fitResult ? ['확정 프레임으로 원본 재단 중', '배경 분리 중 — 원본 픽셀 보존', '정밀 검수 중'] : [GEN_TEXT_DEFAULT];
      var i = 0;
      window.__genStageTimer = setInterval(function(){
        i = (i + 1) % stages.length;
        setGenMessage(stages[i], GEN_SUB_DEFAULT);
      }, 3500);
    })();
    var body = { image: uploadedBase64, format: CFG.format, gender: subjectSelection.gender || 'm', age: subjectSelection.age || 'adult', slug: CFG.slug };
    if(fitResult && fitResult.frame){ body.fitFrame = fitResult.frame; body.fitMeta = fitResult.meta; body.fitMetrics = fitResult.metrics; }
    if(pay.token) body.paymentToken = pay.token;
    if(CFG.t1){ var ad = getAttireDesc(); if(ad) body.attireDesc = ad; }
    fetch('/api/idphoto/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    })
    .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); })
    .then(function(res){
      genBusy = false;
      var data = res.d;
      if(window.__genStageTimer) clearInterval(window.__genStageTimer);
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
          : (data.error || T.errGen);
        if(code === 'TOKEN_EXPIRED' || code === 'TOKEN_USED' || code === 'INVALID_TOKEN'){
          pay.token = null; pay.remaining = null; clearStored();
        } else if(code === 'GENERATE_LIMIT'){
          pay.remaining = 0; persistOrder();
        }
        showError(msg);
        showPhase(uploadedBase64 ? phasePay : phaseUpload);
      }
    })
    .catch(function(){ if(window.__genStageTimer) clearInterval(window.__genStageTimer); genBusy = false; showError(T.errNet); showPhase(uploadedBase64 ? phasePay : phaseUpload); });
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
    function trigger(){
      var a = document.createElement('a');
      a.href = img.src; a.download = CFG.downloadName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
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
      document.getElementById('v2-check-img').src = savedImg;
      document.getElementById('v2-preview-img').src = savedImg;
    }
    var saved = loadOrder();
    if(saved){
      pay.orderId = saved.orderId;
      pay.token = saved.token || null;
      pay.remaining = (typeof saved.remaining === 'number') ? saved.remaining : null;
      if(saved.attire) Object.assign(attireSelection, saved.attire);
      if(saved.subject) Object.assign(subjectSelection, saved.subject);
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
          persistOrder();
          gaTrackPurchase(oid);
          if(uploadedBase64) doGenerate(); else needReupload();
        } else {
          showError((res.d && res.d.error) || T.payConfirmFail);
          showPhase(uploadedBase64 ? phasePay : phaseUpload);
        }
      })
      .catch(function(){ showError(T.payConfirmFail); showPhase(uploadedBase64 ? phasePay : phaseUpload); });
    } else if(mode === 'fail'){
      showError(failMsg || T.payCancelled);
      showPhase(uploadedBase64 ? phasePay : phaseUpload);
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
})();
