(function() {
  var i18n = window.__HS_I18N__ || {};
  // T1 직접결제 설정 (specs v2 패턴 이식, 2026-07-05) — 서버 주입: market/slug/i18n
  var PAY = window.__HS_PAY__ || null;
  var PT = (PAY && PAY.i18n) || {};
  var uploadedImage = null;
  var selectedStyle = null;
  var history = [];

  var uploadZone = document.getElementById('hsUploadZone');
  var uploadPlaceholder = document.getElementById('hsUploadPlaceholder');
  var uploadPreview = document.getElementById('hsUploadPreview');
  var previewImg = document.getElementById('hsPreviewImg');
  var fileInput = document.getElementById('hsFileInput');
  var cameraInput = document.getElementById('hsCameraInput');
  var cameraBtn = document.getElementById('hsCameraBtn');
  var changeBtn = document.getElementById('hsChangeBtn');
  var generateBtn = document.getElementById('hsGenerateBtn');
  var balanceEl = document.getElementById('hsBalance');
  var loadingEl = document.getElementById('hsLoading');
  var resultEl = document.getElementById('hsResult');
  var originalImg = document.getElementById('hsOriginalImg');
  var resultImg = document.getElementById('hsResultImg');
  var retryBtn = document.getElementById('hsRetryBtn');
  var downloadBtn = document.getElementById('hsDownloadBtn');
  var otherStyleBtn = document.getElementById('hsOtherStyleBtn');
  var historySection = document.getElementById('hsHistory');
  var historyGrid = document.getElementById('hsHistoryGrid');

  /* ─── T1 직접결제 상태 ─── */
  var paySection = document.getElementById('hsPaySection');
  var payInstantBtn = document.getElementById('hsPayInstant');
  var payErrorEl = document.getElementById('hsPayError');
  var tossWidgetWrap = document.getElementById('hsTossWidget');
  var payConfirmBtn = document.getElementById('hsPayConfirm');
  var loadingTitleEl = loadingEl ? loadingEl.querySelector('.hs-loading-title') : null;
  var loadingDescEl = loadingEl ? loadingEl.querySelector('.hs-loading-desc') : null;
  var LOADING_TITLE_DEFAULT = loadingTitleEl ? loadingTitleEl.textContent : '';
  var LOADING_DESC_DEFAULT = loadingDescEl ? loadingDescEl.textContent : '';
  var ORDER_KEY = 'monkos_hs_order';
  var IMG_KEY = 'monkos_hs_img';
  var STYLE_KEY = 'monkos_hs_style';
  var payBusy = false;
  var pollTimer = null;
  // token = generate용 paymentToken, remaining = 남은 재생성(null=미확정)
  var pay = { orderId: null, token: null, remaining: null };

  function hasUsableToken() { return !!(pay.token && (pay.remaining === null || pay.remaining > 0)); }
  function returnBase() { return location.origin + location.pathname; }
  function setLoadingText(title, desc) {
    if (loadingTitleEl) loadingTitleEl.textContent = title;
    if (loadingDescEl) loadingDescEl.textContent = desc || '';
  }
  function showPayError(msg) {
    if (!payErrorEl) return;
    payErrorEl.textContent = msg;
    payErrorEl.style.display = 'block';
  }
  function hidePayError() {
    if (payErrorEl) payErrorEl.style.display = 'none';
  }
  function showPaySection(msg) {
    if (!paySection) return;
    paySection.style.display = 'block';
    if (msg) showPayError(msg); else hidePayError();
    paySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ─── GA4 퍼널 (주문 단위 1회 가드 — paymentToken 절대 미포함, transaction_id=orderId) ─── */
  var GA_PAY = (PAY && PAY.market === 'kr')
    ? { payment_provider: 'toss', currency: 'KRW', value: 2000 }
    : { payment_provider: 'lemon', currency: 'USD', value: 1.99 };
  var gaOrderFired = {};
  function gaPayEvent(name, orderId, extra) {
    if (typeof gtag !== 'function') return;
    var key = name + ':' + orderId;
    if (gaOrderFired[key]) return;
    gaOrderFired[key] = true;
    var p = {
      service: 'headshot',
      market: PAY ? PAY.market : '',
      payment_provider: GA_PAY.payment_provider,
      currency: GA_PAY.currency,
      value: GA_PAY.value,
    };
    if (extra) { for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k]; } }
    gtag('event', name, p);
  }

  /* ─── 리다이렉트 생존 저장소 (sessionStorage) ─── */
  function persistOrder() {
    try { sessionStorage.setItem(ORDER_KEY, JSON.stringify({ orderId: pay.orderId, token: pay.token, remaining: pay.remaining, slug: 'headshot', ts: Date.now() })); } catch (e) {}
  }
  function loadOrderStored() {
    try {
      var d = JSON.parse(sessionStorage.getItem(ORDER_KEY) || 'null');
      return (d && d.slug === 'headshot') ? d : null;
    } catch (e) { return null; }
  }
  function clearPayStored() {
    try { sessionStorage.removeItem(ORDER_KEY); sessionStorage.removeItem(IMG_KEY); sessionStorage.removeItem(STYLE_KEY); } catch (e) {}
  }
  // 결제 전 단계에서 선행 저장 — 결제 클릭 체인에 캔버스 압축 금지 (user activation 만료 → 토스 위젯 실패, 2026-07-05 specs 실사고).
  // uploadedImage는 업로드 시 이미 1536px/JPEG 0.85로 압축돼 있어 추가 압축 불필요.
  function persistPayState() {
    try { sessionStorage.setItem(IMG_KEY, uploadedImage); } catch (e) { try { sessionStorage.removeItem(IMG_KEY); } catch (e2) {} }
    try { sessionStorage.setItem(STYLE_KEY, selectedStyle || ''); } catch (e) {}
  }

  function updateStepIndicators() {
    var steps = document.querySelectorAll('.hs-step-indicator');
    steps.forEach(function(el) {
      var s = parseInt(el.dataset.step);
      el.classList.remove('active', 'done');
      if (s === 1 && uploadedImage) el.classList.add('done');
      else if (s === 1) el.classList.add('active');
      if (s === 2 && selectedStyle) el.classList.add('done');
      else if (s === 2 && uploadedImage) el.classList.add('active');
      if (s === 3 && uploadedImage && selectedStyle) el.classList.add('active');
    });
  }

  function updateGenerateBtn() {
    generateBtn.disabled = !(uploadedImage && selectedStyle);
  }

  function updateBalance() {
    if (typeof currentUser !== 'undefined' && currentUser) {
      var credits = currentUser.credits || 0;
      balanceEl.textContent = (i18n.balanceLabel || 'Balance') + ': ' + credits + 'c';
    } else {
      balanceEl.textContent = '';
    }
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var MAX_SIDE = 1536;
        var w = img.width, h = img.height;
        if (w > MAX_SIDE || h > MAX_SIDE) {
          var ratio = Math.min(MAX_SIDE / w, MAX_SIDE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        uploadedImage = canvas.toDataURL('image/jpeg', 0.85);
        previewImg.src = uploadedImage;
        uploadPlaceholder.style.display = 'none';
        uploadPreview.style.display = 'block';
        if (typeof monkTrack === 'function') {
          monkTrack('upload_image', {
            file_size: file.size,
            resized_size: uploadedImage.length,
            source: file.name ? 'gallery' : 'camera',
          });
        }
        updateStepIndicators();
        updateGenerateBtn();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener('change', function() {
    if (this.files[0]) handleFile(this.files[0]);
  });

  cameraInput.addEventListener('change', function() {
    if (this.files[0]) handleFile(this.files[0]);
  });

  cameraBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    cameraInput.click();
  });

  uploadZone.addEventListener('click', function(e) {
    if (e.target.closest('#hsCameraBtn') || e.target.closest('.hs-change-btn') || e.target.closest('label')) return;
    if (!uploadedImage) fileInput.click();
  });

  uploadZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', function() {
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  changeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    uploadedImage = null;
    previewImg.src = '';
    uploadPlaceholder.style.display = 'flex';
    uploadPreview.style.display = 'none';
    fileInput.value = '';
    cameraInput.value = '';
    updateStepIndicators();
    updateGenerateBtn();
  });

  document.querySelectorAll('.hs-style-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.hs-style-btn').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedStyle = btn.dataset.style;
      if (typeof monkTrack === 'function') {
        monkTrack('select_style', { style: selectedStyle });
      }
      updateStepIndicators();
      updateGenerateBtn();
    });
  });

  function hideAllForLoading() {
    generateBtn.disabled = true;
    loadingEl.style.display = 'block';
    resultEl.style.display = 'none';
    document.getElementById('hsUploadSection').style.display = 'none';
    document.getElementById('hsStyleSection').style.display = 'none';
    document.getElementById('hsGenerateSection').style.display = 'none';
    if (paySection) paySection.style.display = 'none';
  }

  function showMainSections() {
    loadingEl.style.display = 'none';
    document.getElementById('hsUploadSection').style.display = 'block';
    document.getElementById('hsStyleSection').style.display = 'block';
    document.getElementById('hsGenerateSection').style.display = 'block';
  }

  /* ─── 생성 (크레딧 경로 + 결제 토큰 경로 공용) ─── */
  async function runGenerate(useToken) {
    hideAllForLoading();
    setLoadingText(LOADING_TITLE_DEFAULT, LOADING_DESC_DEFAULT);
    hidePayError();

    try {
      var body = {
        image: uploadedImage,
        purpose: selectedStyle,
        model: 'nano-banana-pro',
      };
      if (useToken && pay.token) body.paymentToken = pay.token;

      var res = await fetch('/api/headshot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      var data = await res.json();

      if (!res.ok) {
        var code = data.code || '';
        if (useToken && (code === 'TOKEN_EXPIRED' || code === 'TOKEN_USED' || code === 'INVALID_TOKEN' || code === 'GENERATE_LIMIT' || code === 'PAYMENT_REQUIRED')) {
          if (code === 'GENERATE_LIMIT') { pay.remaining = 0; persistOrder(); }
          else { pay.token = null; pay.remaining = null; clearPayStored(); }
          var msg = code === 'TOKEN_EXPIRED' ? PT.tokenExpired
            : code === 'TOKEN_USED' ? PT.tokenUsed
            : code === 'GENERATE_LIMIT' ? PT.genLimit
            : (data.error || PT.failed);
          showMainSections();
          showPaySection(msg);
          generateBtn.disabled = false;
          updateGenerateBtn();
          return;
        }
        throw new Error(data.error || 'Generation failed');
      }

      if (data.image) {
        var resultSrc = data.image.startsWith('data:') ? data.image : ('data:image/png;base64,' + data.image);
        originalImg.src = uploadedImage;
        resultImg.src = resultSrc;
        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';

        if (typeof monkTrack === 'function') {
          monkTrack('generate_complete', { style: selectedStyle });
        }
        history.unshift({ original: uploadedImage, result: resultSrc, style: selectedStyle, time: Date.now() });
        renderHistory();

        if (useToken) {
          if (typeof data.remainingGenerates === 'number') { pay.remaining = data.remainingGenerates; persistOrder(); }
        } else if (typeof currentUser !== 'undefined' && currentUser) {
          currentUser.credits = (typeof data.credits === 'number') ? data.credits : (currentUser.credits || 0) - 10;
          updateBalance();
        }
      } else {
        throw new Error(data.error || 'No image returned');
      }
    } catch (err) {
      showMainSections();
      alert(i18n.errorRetry || err.message);
    }

    generateBtn.disabled = false;
    updateGenerateBtn();
  }

  generateBtn.addEventListener('click', function() {
    if (!uploadedImage || !selectedStyle) return;
    if (typeof monkTrack === 'function') {
      monkTrack('click_cta', { button_id: 'generate', style: selectedStyle });
    }

    var loggedIn = (typeof currentUser !== 'undefined' && !!currentUser);
    var credits = loggedIn ? (currentUser.credits || 0) : 0;

    // 크레딧 충분한 로그인 사용자 — 선택 화면 없이 즉시 크레딧 생성
    if (loggedIn && credits >= 10) return runGenerate(false);
    // 기결제 토큰 보유 — 재결제 없이 생성
    if (hasUsableToken()) return runGenerate(true);

    // 결제 선택 화면: ① 첫 로그인 무료 체험(로그인 시 충전 라벨) ② 바로 결제 (2026-07-05 작가님)
    if (PAY && PAY.market && paySection) {
      persistPayState(); // 결제 전 선행 저장 (리다이렉트 생존) — 결제 클릭 체인 밖
      var optBtn = document.getElementById('hsOptFree');
      var optTitle = document.getElementById('hsOptFreeTitle');
      if (optBtn && optTitle) {
        var t = loggedIn ? optBtn.getAttribute('data-title-charge') : optBtn.getAttribute('data-title-free');
        if (t) optTitle.textContent = t;
      }
      showPaySection();
      return;
    }

    // 폴백: 결제 설정 미주입
    if (!loggedIn) {
      if (typeof headerLogin === 'function') headerLogin();
      else alert(i18n.loginRequired || 'Login required');
      return;
    }
    if (typeof openCreditShop === 'function') openCreditShop();
    else alert(i18n.insufficientCredits || 'Insufficient credits');
  });

  /* ─── T1 직접결제 플로우 (specs v2 패턴 이식) ─── */
  // 선택지 ① — 비로그인: 로그인(신규 10c) / 로그인(크레딧 부족): 충전 샵
  var optFreeBtn = document.getElementById('hsOptFree');
  if (optFreeBtn) optFreeBtn.addEventListener('click', function() {
    var loggedIn = (typeof currentUser !== 'undefined' && !!currentUser);
    if (!loggedIn) {
      if (typeof headerLogin === 'function') headerLogin();
      return;
    }
    if (typeof monkTrack === 'function') {
      monkTrack('open_credit_shop', { current_credits: (currentUser.credits || 0), page: 'headshot' });
    }
    if (typeof openCreditShop === 'function') openCreditShop();
  });

  if (payInstantBtn) payInstantBtn.addEventListener('click', function() {
    if (!uploadedImage || !selectedStyle || payBusy) return;
    // 결제 완료 토큰 보유 시 이중 결제 방지 — 바로 생성
    if (hasUsableToken()) return runGenerate(true);
    hidePayError();
    payBusy = true;
    var initBody = { slug: PAY.slug, market: PAY.market };
    // 팝업 차단 회피: 클릭 제스처 안에서 창을 먼저 열고 init 후 주소 지정 (레몬 경로)
    var lemonWin = null;
    if (PAY.market !== 'kr') {
      initBody.redirectUrl = returnBase() + '?lemon=return';
      try { lemonWin = window.open('', '_blank'); } catch (e) {}
    }
    fetch('/api/payments/direct/init', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initBody),
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, status: r.status, d: d }; }); })
    .then(function(res) {
      if (!res.ok) {
        payBusy = false;
        if (lemonWin) { try { lemonWin.close(); } catch (e) {} }
        showPayError((res.d && res.d.error) || PT.initFail);
        return;
      }
      var d = res.d;
      pay.orderId = d.orderId; pay.token = null; pay.remaining = null;
      // orderId 확보 후 주문 단위 1회 발화 (재클릭 중복 방지, purchase와 쌍 정합)
      gaPayEvent('begin_checkout', d.orderId);
      persistOrder();
      if (d.provider === 'toss') startToss(d, lemonWin);
      else startLemon(d, lemonWin);
    })
    .catch(function() {
      payBusy = false;
      if (lemonWin) { try { lemonWin.close(); } catch (e) {} }
      showPayError(PT.errNet);
    });
  });

  // 토스 결제위젯 방식 필수 — 상점 라이브 계약이 위젯(live_gck)에만 있음. 구 결제창(payment()) 금지.
  var tossWidgets = null, tossWidgetRendered = false;
  function startToss(d, extraWin) {
    if (extraWin) { try { extraWin.close(); } catch (e) {} }
    if (!window.TossPayments) { payBusy = false; showPayError(PT.initFail); return; }
    try {
      if (!tossWidgets) {
        tossWidgets = window.TossPayments(d.clientKey).widgets({ customerKey: window.TossPayments.ANONYMOUS });
      }
      payConfirmBtn.textContent = '₩' + String(d.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + (PT.confirmSuffix || '결제하기');
      tossWidgetWrap.style.display = 'block';
      tossWidgets.setAmount({ currency: d.currency || 'KRW', value: d.amount })
        .then(function() {
          if (tossWidgetRendered) return;
          return tossWidgets.renderPaymentMethods({ selector: '#hs-pm' })
            .then(function() { return tossWidgets.renderAgreement({ selector: '#hs-agree' }); })
            .then(function() { tossWidgetRendered = true; });
        })
        .then(function() {
          payBusy = false;
          tossWidgetWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        })
        .catch(function(e) {
          payBusy = false; tossWidgetWrap.style.display = 'none';
          showPayError((e && e.message) || PT.initFail);
        });
      // requestPayment는 반드시 버튼 클릭 제스처에서 직접 호출 (팝업 차단 방지)
      payConfirmBtn.onclick = function() {
        var base = returnBase();
        tossWidgets.requestPayment({
          orderId: d.orderId,
          orderName: d.orderName,
          successUrl: base + '?toss=direct',
          failUrl: base + '?toss=fail',
        }).catch(function(err) {
          showPayError(err && err.code === 'USER_CANCEL' ? PT.cancelled : ((err && err.message) || PT.initFail));
        });
      };
    } catch (e) { payBusy = false; showPayError(PT.initFail); }
  }

  function startLemon(d, lemonWin) {
    hideAllForLoading();
    setLoadingText(PT.waiting || '', PT.waitingHint || '');
    if (lemonWin && !lemonWin.closed) {
      try { lemonWin.location = d.checkoutUrl; } catch (e) { lemonWin = null; }
    } else { lemonWin = null; }
    if (!lemonWin) {
      // 팝업 불가 — 같은 탭 리다이렉트 (상태는 sessionStorage 보존, redirectUrl로 복귀)
      location.href = d.checkoutUrl;
      return;
    }
    startPolling(d.orderId);
  }

  function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

  function startPolling(orderId) {
    stopPolling();
    var tries = 0;
    pollTimer = setInterval(function() {
      tries++;
      if (tries > 240) { // 2.5초 × 240 = 10분
        stopPolling(); payBusy = false;
        showMainSections();
        showPaySection(PT.timeout);
        return;
      }
      fetch('/api/payments/direct/status?orderId=' + encodeURIComponent(orderId))
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.status === 'paid' && d.paymentToken) {
          stopPolling(); payBusy = false;
          pay.orderId = orderId; pay.token = d.paymentToken; pay.remaining = null;
          persistOrder();
          gaPayEvent('purchase', orderId, { transaction_id: orderId });
          if (uploadedImage && selectedStyle) runGenerate(true);
          else { showMainSections(); showPaySection(PT.imgLost); }
        } else if (d.status === 'failed' || d.status === 'amount_mismatch' || d.status === 'refunded') {
          stopPolling(); payBusy = false;
          showMainSections();
          showPaySection(PT.failed);
        }
      })
      .catch(function() {});
    }, 2500);
  }

  /* ─── 결제 복귀 처리 (토스 리다이렉트 / 레몬 리턴) ─── */
  (function resumePay() {
    if (!PAY || !paySection) return;
    var qs;
    try { qs = new URLSearchParams(location.search); } catch (e) { return; }
    var mode = qs.get('toss') || (qs.get('lemon') ? 'lemon' : null);
    if (!mode) return;
    var pk = qs.get('paymentKey');
    var oid = qs.get('orderId');
    var failMsg = qs.get('message');
    try { window.history.replaceState(null, '', location.pathname); } catch (e) {}

    // 업로드 이미지·스타일·주문 복원 (결제 전 선행 저장분)
    var savedImg = null, savedStyle = null;
    try { savedImg = sessionStorage.getItem(IMG_KEY); savedStyle = sessionStorage.getItem(STYLE_KEY); } catch (e) {}
    if (savedImg) {
      uploadedImage = savedImg;
      previewImg.src = savedImg;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'block';
    }
    if (savedStyle) {
      selectedStyle = savedStyle;
      document.querySelectorAll('.hs-style-btn').forEach(function(b) {
        b.classList.toggle('selected', b.dataset.style === savedStyle);
      });
    }
    updateStepIndicators();
    updateGenerateBtn();
    var saved = loadOrderStored();
    if (saved) {
      pay.orderId = saved.orderId;
      pay.token = saved.token || null;
      pay.remaining = (typeof saved.remaining === 'number') ? saved.remaining : null;
    }

    function proceed() {
      if (uploadedImage && selectedStyle) runGenerate(true);
      else { showMainSections(); showPaySection(PT.imgLost); }
    }

    if (mode === 'direct' && pk && oid) {
      hideAllForLoading();
      setLoadingText(PT.confirming || '', '');
      fetch('/api/payments/toss/direct', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey: pk, orderId: oid }),
      })
      .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, d: d }; }); })
      .then(function(res) {
        if (res.ok && res.d && res.d.paymentToken) {
          pay.orderId = oid; pay.token = res.d.paymentToken; pay.remaining = null;
          persistOrder();
          gaPayEvent('purchase', oid, { transaction_id: oid });
          proceed();
        } else {
          showMainSections();
          showPaySection((res.d && res.d.error) || PT.failed);
        }
      })
      .catch(function() { showMainSections(); showPaySection(PT.errNet); });
    } else if (mode === 'fail') {
      showMainSections();
      showPaySection(failMsg || PT.cancelled);
    } else if (mode === 'lemon') {
      if (pay.token) {
        proceed();
      } else if (saved && saved.orderId) {
        hideAllForLoading();
        setLoadingText(PT.waiting || '', PT.waitingHint || '');
        startPolling(saved.orderId);
      }
    }
  })();

  retryBtn.addEventListener('click', function() {
    resultEl.style.display = 'none';
    document.getElementById('hsUploadSection').style.display = 'block';
    document.getElementById('hsStyleSection').style.display = 'block';
    document.getElementById('hsGenerateSection').style.display = 'block';
    updateGenerateBtn();
  });

  downloadBtn.addEventListener('click', function() {
    if (typeof monkTrack === 'function') {
      monkTrack('click_cta', { button_id: 'download', page: 'headshot' });
    }
    var src = resultImg.src;
    if (!src) return;
    var a = document.createElement('a');
    a.href = src;
    a.download = 'monkos-headshot-' + Date.now() + '.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  otherStyleBtn.addEventListener('click', function() {
    resultEl.style.display = 'none';
    document.getElementById('hsUploadSection').style.display = 'block';
    document.getElementById('hsStyleSection').style.display = 'block';
    document.getElementById('hsGenerateSection').style.display = 'block';
    document.querySelectorAll('.hs-style-btn').forEach(function(b) { b.classList.remove('selected'); });
    selectedStyle = null;
    updateStepIndicators();
    updateGenerateBtn();
  });

  function renderHistory() {
    if (history.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    historySection.style.display = 'block';
    historyGrid.innerHTML = history.map(function(h, idx) {
      return '<img src="' + h.result + '" alt="headshot" data-idx="' + idx + '">';
    }).join('');

    historyGrid.querySelectorAll('img').forEach(function(img) {
      img.addEventListener('click', function() {
        openLightbox(this.src);
      });
    });
  }

  var lightbox = document.getElementById('hsLightbox');
  var lightboxImg = document.getElementById('hsLightboxImg');
  var lightboxDownload = document.getElementById('hsLightboxDownload');
  var lightboxClose = document.getElementById('hsLightboxClose');
  var downloadAllBtn = document.getElementById('hsDownloadAll');

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('active');
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightboxImg.src = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });

  if (lightboxDownload) lightboxDownload.addEventListener('click', function() {
    var a = document.createElement('a');
    a.href = lightboxImg.src;
    a.download = 'monkos-headshot-' + Date.now() + '.png';
    a.click();
  });

  if (downloadAllBtn) downloadAllBtn.addEventListener('click', function() {
    history.forEach(function(h, idx) {
      setTimeout(function() {
        var a = document.createElement('a');
        a.href = h.result;
        a.download = 'monkos-headshot-' + (idx + 1) + '.png';
        a.click();
      }, idx * 300);
    });
  });

  var checkSessionInterval = setInterval(function() {
    if (typeof currentUser !== 'undefined') {
      updateBalance();
      clearInterval(checkSessionInterval);
    }
  }, 500);

  setTimeout(function() { clearInterval(checkSessionInterval); }, 10000);
})();
