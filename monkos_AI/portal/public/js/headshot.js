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
  // 결제 에러 슬롯 2곳 (2026-09-20, specs 결함 A 이식) — 기존엔 결제하기 버튼 *아래* 1곳뿐이고 스크롤도 없어
  // 거절·취소 문구가 시야 밖에 떴다 = 고객에겐 "눌러도 반응 없는 버튼".
  // #hsPayError = 첫 결제 버튼(#hsPayGo) 바로 위(위젯 닫힘) / #hsPayErrorConfirm = 결제하기(#hsPayConfirm) 바로 위(위젯 열림).
  // 기존 id(hsPayError)를 상단 슬롯에 남긴 이유: 캐시된 구 JS가 떠도 에러가 항상 보이는 자리에 뜨게 하기 위함.
  var payErrorEl = document.getElementById('hsPayError');
  var payErrorConfirmEl = document.getElementById('hsPayErrorConfirm');
  var tossWidgetWrap = document.getElementById('hsTossWidget');
  var payConfirmBtn = document.getElementById('hsPayConfirm');
  var payConfirmSpacer = document.getElementById('hsPayConfirmSpacer');
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
  function isWidgetOpen() {
    return !!(tossWidgetWrap && tossWidgetWrap.style.display !== 'none');
  }
  // payErrSeq — 렌더 타임아웃 문구만 골라 거두기 위한 에러 일련번호 (startToss 참조)
  var payErrSeq = 0;
  function showPayError(msg) {
    payErrSeq++;
    var el = (isWidgetOpen() && payErrorConfirmEl) ? payErrorConfirmEl : (payErrorEl || payErrorConfirmEl);
    if (!el) return;
    hidePayError();
    el.textContent = msg;
    el.style.display = 'block';
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
    scheduleDock();
  }
  function hidePayError() {
    [payErrorEl, payErrorConfirmEl].forEach(function(el) {
      if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
  }

  /* ─── 결제하기 버튼 하단 고정 (2026-09-20, specs 결함 E 이식) ───
     토스 위젯 영역은 375폭에서 600px대 — 가용 높이가 짧은 폰은 결제하기 버튼이 화면 아래에 남는다.
     렌더 직후 스크롤 1회로는 약관 펼침·결제수단 전환 때마다 다시 밀리므로 스크롤·리사이즈마다 재판정한다. */
  var dockRaf = null;
  function undockConfirm() {
    if (payConfirmBtn) payConfirmBtn.classList.remove('is-docked');
    if (payConfirmSpacer) payConfirmSpacer.style.height = '0px';
  }
  function updateDock() {
    if (!tossWidgetWrap || !payConfirmBtn || !payConfirmSpacer) return;
    // 위젯 닫힘 · 결제 화면 숨김 · 버튼 미노출(렌더 대기) → 고정 해제
    if (!isWidgetOpen() || !paySection || paySection.style.display === 'none' || payConfirmBtn.style.display === 'none') return undockConfirm();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var wr = tossWidgetWrap.getBoundingClientRect();
    var inView = wr.bottom > 0 && wr.top < vh - 40;
    // 고정 중에는 버튼이 흐름 밖이라 스페이서가 '원래 자리'의 정본
    var naturalBottom = payConfirmBtn.classList.contains('is-docked')
      ? payConfirmSpacer.getBoundingClientRect().bottom
      : payConfirmBtn.getBoundingClientRect().bottom;
    if (inView && naturalBottom > vh - 8) {
      if (!payConfirmBtn.classList.contains('is-docked')) {
        // 높이는 고정 전에 잰다 (고정 후엔 폭이 달라져 줄바꿈이 바뀔 수 있음)
        payConfirmSpacer.style.height = (payConfirmBtn.offsetHeight + 12) + 'px';
        payConfirmBtn.classList.add('is-docked');
      }
    } else undockConfirm();
  }
  function scheduleDock() {
    if (dockRaf) return;
    if (typeof requestAnimationFrame !== 'function') { updateDock(); return; }
    dockRaf = requestAnimationFrame(function() { dockRaf = null; updateDock(); });
  }
  window.addEventListener('scroll', scheduleDock, { passive: true });
  window.addEventListener('resize', scheduleDock);
  if (window.ResizeObserver) {
    var dockRo = new ResizeObserver(scheduleDock);
    ['hs-pm', 'hs-agree', 'hsTossWidget'].forEach(function(id) {
      var e = document.getElementById(id); if (e) dockRo.observe(e);
    });
  }
  function focusTossWidget() {
    if (!tossWidgetWrap) return;
    try { tossWidgetWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
    scheduleDock();
  }

  function showPaySection(msg) {
    if (!paySection) return;
    // 위저드 전환 (2026-07-06 작가님): 업로드·스타일·CTA 화면을 접고 결제 화면만 표시.
    // 선택 스타일 썸네일+이름 칩으로 맥락 유지, 뒤로가기는 hsPayBack.
    document.getElementById('hsUploadSection').style.display = 'none';
    document.getElementById('hsStyleSection').style.display = 'none';
    document.getElementById('hsGenerateSection').style.display = 'none';
    var selImg = document.getElementById('hsPaySelImg');
    var selName = document.getElementById('hsPaySelName');
    if (selImg && selectedStyle) selImg.src = '/images/headshot/style-' + selectedStyle + '.webp';
    if (selName && selectedStyle) {
      var card = document.querySelector('.hs-style-btn[data-style="' + selectedStyle + '"] .hs-style-label');
      selName.textContent = card ? card.textContent : '';
    }
    paySection.style.display = 'block';
    // 에러가 있으면 에러 슬롯으로 스크롤(showPayError 내부) — 섹션 상단 스크롤이 덮어쓰면 문구가 다시 시야 밖 (2026-09-20)
    if (msg) showPayError(msg);
    else {
      hidePayError();
      paySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    scheduleDock();
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
  // 반복 발화 허용 이벤트용 (pay_fail · pay_widget_open · pay_confirm_click) — 한 고객이 여러 번 실패·재시도하므로 1회 가드 없음.
  // 매출 파라미터(value·currency)는 purchase/begin_checkout 전용이라 여기엔 싣지 않는다.
  function gaPayTrack(name, extra) {
    if (typeof gtag !== 'function') return;
    var p = {
      service: 'headshot',
      market: PAY ? PAY.market : '',
      lang: document.documentElement.lang || 'ko',
      payment_provider: GA_PAY.payment_provider,
    };
    if (extra) { for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k]; } }
    gtag('event', name, p);
  }
  // 인앱 브라우저(WKWebView 계열) 판정 — specs-funnel.js isInApp과 동일 패턴
  function isInApp() {
    return /(GSA\/|FBAN|FBAV|Instagram|KAKAOTALK|Line\/|NAVER\(|DaumApps|; wv\))/i.test(navigator.userAgent || '');
  }
  /* ─── 결제 실패 계측 (2026-09-20, specs 09-19 신설분 이식) ───
     헤드샷 유료 퍼널은 실패가 어디에도 남지 않았다 (init만 찍히고 이후 무기록).
     GA는 유실 가능 → 사유의 정본은 서버 로그(directOrders.lastFail, POST /api/payments/direct/fail).
     ⚠️ 토스 키·결제 토큰·개인정보는 파라미터에 절대 넣지 않는다 (헌법 4조 1항). */
  function reportPayFail(stage, code, message) {
    var safeCode = String(code || 'UNKNOWN').slice(0, 60);
    gaPayTrack('pay_fail', { fail_stage: stage, fail_code: safeCode, in_app: isInApp() });
    if (!pay.orderId) return;
    try {
      fetch('/api/payments/direct/fail', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({
          orderId: pay.orderId, stage: stage, code: safeCode,
          message: String(message || '').slice(0, 200),
          vw: window.innerWidth, vh: window.innerHeight, inApp: isInApp(),
        }),
      }).catch(function() {});
    } catch (e) {}
  }

  /* ─── 리다이렉트 생존 저장소 (sessionStorage) ─── */
  // 실패 복귀(?toss=fail) 시 주문을 새로 만들지 않고 위젯을 재오픈하기 위한 init 응답 보존 (2026-09-20, specs 결함 F 이식).
  // clientKey 는 위젯 연동용 공개 키(init 응답으로 브라우저에 이미 내려오는 값) — 시크릿 아님.
  var lastTossInit = null;
  function persistOrder() {
    try { sessionStorage.setItem(ORDER_KEY, JSON.stringify({ orderId: pay.orderId, token: pay.token, remaining: pay.remaining, slug: 'headshot', ts: Date.now(), toss: lastTossInit })); } catch (e) {}
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
    var ready = !!(uploadedImage && selectedStyle);
    generateBtn.disabled = !ready;
    // CTA 상태 라벨: 무엇이 부족한지 버튼이 직접 말함 (스타일 미선택 / 사진 미업로드 / 준비 완료)
    var lbl = ready ? generateBtn.getAttribute('data-label-make')
      : (selectedStyle && !uploadedImage) ? generateBtn.getAttribute('data-label-photo')
      : generateBtn.getAttribute('data-label-select');
    if (lbl) generateBtn.textContent = lbl;
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
    // 저장 초안도 함께 제거 — 안 지우면 restoreDraft가 새로고침마다 사진을 되살림
    try { sessionStorage.removeItem(IMG_KEY); } catch (err) {}
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
    undockConfirm(); // 결제 화면을 벗어나면 하단 고정 버튼 즉시 해제 (2026-09-20)
  }

  function showMainSections() {
    loadingEl.style.display = 'none';
    if (paySection) paySection.style.display = 'none';
    undockConfirm(); // 결제 화면을 벗어나면 하단 고정 버튼 즉시 해제 (2026-09-20)
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
        // 크레딧 부족 402 — 화면 잔액이 스테일한 경우(결제 취소 회수 등): 오류 팝업 대신 결제 위저드로 안내
        if (!useToken && res.status === 402) {
          if (typeof currentUser !== 'undefined' && currentUser && typeof data.credits === 'number') {
            currentUser.credits = data.credits;
            if (typeof updateBalance === 'function') updateBalance();
          }
          showMainSections();
          persistPayState();
          setPayMode('direct');
          showPaySection();
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

  // 생성 게이트 (만들기 CTA · 다시 생성 공용): 크레딧 → 기결제 토큰 → 결제 위저드
  function startGenerateFlow() {
    if (!uploadedImage || !selectedStyle) return;

    var loggedIn = (typeof currentUser !== 'undefined' && !!currentUser);
    var credits = loggedIn ? (currentUser.credits || 0) : 0;

    // 크레딧 충분한 로그인 사용자 — 선택 화면 없이 즉시 크레딧 생성
    if (loggedIn && credits >= 10) return runGenerate(false);
    // 기결제 토큰 보유 — 재결제 없이 생성
    if (hasUsableToken()) return runGenerate(true);

    // 결제 화면 전환 (2카드 선택식 — 클로드 디자인 시안, 2026-07-06)
    if (PAY && PAY.market && paySection) {
      persistPayState(); // 결제 전 선행 저장 (리다이렉트 생존) — 결제 클릭 체인 밖
      setPayMode('direct');
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
  }

  generateBtn.addEventListener('click', function() {
    if (!uploadedImage || !selectedStyle) return;
    if (typeof monkTrack === 'function') {
      monkTrack('click_cta', { button_id: 'generate', style: selectedStyle });
    }
    startGenerateFlow();
  });

  /* ─── T1 직접결제 플로우 (specs v2 패턴 이식) ─── */
  // 위저드 뒤로가기 — 결제 화면 → 스타일 선택 복귀
  var payBackBtn = document.getElementById('hsPayBack');
  if (payBackBtn) payBackBtn.addEventListener('click', function() {
    showMainSections();
    document.getElementById('hsStyleSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ─── 결제 방식 2카드 선택 + 상태 CTA (클로드 디자인 시안) ───
  var payMode = 'direct';
  var payGoBtn = document.getElementById('hsPayGo');
  var payGoSub = document.getElementById('hsPayGoSub');
  var payCardD = document.getElementById('hsPayCardDirect');
  var payCardC = document.getElementById('hsPayCardCredit');

  function setPayMode(m) {
    payMode = m;
    if (payCardD) payCardD.classList.toggle('selected', m === 'direct');
    if (payCardC) payCardC.classList.toggle('selected', m === 'credit');
    updatePayGo();
  }
  function updatePayGo() {
    if (!payGoBtn) return;
    var loggedIn = (typeof currentUser !== 'undefined' && !!currentUser);
    if (payMode === 'direct') {
      payGoBtn.textContent = payGoBtn.getAttribute('data-label-direct') || payGoBtn.textContent;
      if (payGoSub) payGoSub.textContent = payGoBtn.getAttribute('data-sub-direct') || '';
    } else {
      payGoBtn.textContent = payGoBtn.getAttribute(loggedIn ? 'data-label-credit-charge' : 'data-label-credit-login') || payGoBtn.textContent;
      if (payGoSub) payGoSub.textContent = payGoBtn.getAttribute('data-sub-credit') || '';
    }
    var bal = document.getElementById('hsPayCredBal');
    if (bal) bal.textContent = (loggedIn ? (currentUser.credits || 0) : 0) + 'c';
  }
  if (payCardD) payCardD.addEventListener('click', function() { setPayMode('direct'); });
  if (payCardC) payCardC.addEventListener('click', function() { setPayMode('credit'); });

  if (payGoBtn) payGoBtn.addEventListener('click', function() {
    if (payMode === 'direct') return startDirectPay();
    // 크레딧 경로 — 비로그인: 간편로그인(신규 10c) / 로그인: 충전 샵 (모달 미가용 시 충전 페이지 폴백)
    var loggedIn = (typeof currentUser !== 'undefined' && !!currentUser);
    if (!loggedIn) {
      if (typeof headerLogin === 'function') headerLogin();
      return;
    }
    if (typeof monkTrack === 'function') {
      monkTrack('open_credit_shop', { current_credits: (currentUser.credits || 0), page: 'headshot' });
    }
    persistPayState(); // 모달·페이지 어느 경로든 왕복 복원 대비 선행 저장
    if (typeof openCreditShop === 'function' && document.getElementById('creditShopModal')) {
      openCreditShop();
    } else {
      window.location.href = '/credits.html?from=' + encodeURIComponent(location.pathname + '?credits=return');
    }
  });

  function startDirectPay() {
    if (!uploadedImage || !selectedStyle || payBusy) return;
    // 결제 완료 토큰 보유 시 이중 결제 방지 — 바로 생성
    if (hasUsableToken()) return runGenerate(true);
    // 위젯이 이미 열려 있으면 init 을 다시 부르지 않는다 (2026-09-20, specs 결함 C 이식).
    // 재클릭마다 서버 주문이 새로 생기는데 화면은 그대로여서 "반응 없는 버튼"으로 보인다.
    // 조건: 렌더 완료 + 미결제 주문 + 열린 위젯이 바로 그 주문의 것 (결제 끝난 주문에 위젯이 묶이는 일 방지)
    if (tossWidgetRendered && pay.orderId && !pay.token && lastTossInit && lastTossInit.orderId === pay.orderId && isWidgetOpen()) {
      hidePayError();
      focusTossWidget();
      return;
    }
    // 위젯 렌더가 아직 진행 중이면 다시 시작하지 않는다 — 렌더 타임아웃이 잠금을 푼 뒤 재클릭하면
    // 같은 자리에 위젯이 이중 렌더되어 결제가 깨진다 (specs 09-20 dev 실측: INVALID_METHOD_TRANSACTION)
    if (tossRenderInFlight) { focusTossWidget(); return; }
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
      lastTossInit = null; // 새 주문 — 이전 주문의 위젯 재오픈 정보 폐기 (startToss가 새로 채운다)
      // orderId 확보 후 주문 단위 1회 발화 (재클릭 중복 방지, purchase와 쌍 정합)
      gaPayEvent('begin_checkout', d.orderId, { transport_type: 'beacon' });
      persistOrder();
      if (d.provider === 'toss') startToss(d, lemonWin);
      else startLemon(d, lemonWin);
    })
    .catch(function() {
      payBusy = false;
      if (lemonWin) { try { lemonWin.close(); } catch (e) {} }
      showPayError(PT.errNet);
    });
  }

  // 토스 결제위젯 방식 필수 — 상점 라이브 계약이 위젯(live_gck)에만 있음. 구 결제창(payment()) 금지.
  var tossWidgets = null, tossWidgetRendered = false, tossRenderInFlight = false;
  // 카드사·약관 미충족 시 결제 버튼 비활성 (toss-pay-guard.js). 스크립트가 없는 구본 HTML이면 null — 기존 동작 유지
  var payGuard = null;
  // 위젯 로딩 표시 (2026-09-20, specs 이식) — 렌더가 수 초~십수 초 걸리는 동안 화면이 비어 있으면 고객은 고장으로 읽고 떠난다
  var PAY_LOADING = { ko: '결제창을 불러오는 중입니다…', ja: '決済画面を読み込んでいます…', en: 'Loading the payment form…', es: 'Cargando el formulario de pago…' };
  function setWidgetLoading(on) {
    if (!tossWidgetWrap) return;
    var el = document.getElementById('hsPayLoading');
    if (on) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'hsPayLoading'; el.className = 'hs-pay-loading';
        var lang = (document.documentElement.lang || 'ko').slice(0, 2).toLowerCase();
        el.textContent = PT.widgetLoading || PAY_LOADING[lang] || PAY_LOADING.en;
        tossWidgetWrap.insertBefore(el, tossWidgetWrap.firstChild);
      }
      el.style.display = '';
    } else if (el) { el.style.display = 'none'; }
  }
  // 사진·스타일 재저장 (2026-09-20 결함 수정) — restoreDraft 가 복귀 로드에서 저장분을 1회성 소비(삭제)하므로,
  // 실패 복귀 뒤 재시도한 결제가 성공해 돌아오면 사진이 없어 재업로드를 요구했다.
  // 리다이렉트가 일어날 수 있는 결제 시도 직전에 다시 저장한다. 캔버스 압축 없음(문자열 setItem뿐) — 결제 클릭 체인 밖.
  function repersistForRedirect() {
    if (uploadedImage && selectedStyle) persistPayState();
  }
  function startToss(d, extraWin) {
    if (extraWin) { try { extraWin.close(); } catch (e) {} }
    // 위젯 단계 실패도 기록한다 — init 직후 무기록 이탈 사각지대 (SDK 부재·렌더 거절·렌더 멈춤)
    if (!window.TossPayments) { payBusy = false; showPayError(PT.initFail); reportPayFail('widget', 'SDK_MISSING', 'TossPayments global undefined'); return; }
    var renderTimer = null;
    try {
      if (!tossWidgets) {
        tossWidgets = window.TossPayments(d.clientKey).widgets({ customerKey: window.TossPayments.ANONYMOUS });
      }
      // 실패 복귀 시 주문 재사용을 위한 보존 — 금액·주문명은 서버 init 응답이 정본 (ch2 7조)
      lastTossInit = { provider: 'toss', orderId: d.orderId, orderName: d.orderName, amount: d.amount, currency: d.currency, clientKey: d.clientKey };
      persistOrder(); // 호출부의 persistOrder 는 lastTossInit 설정 전에 끝난다 — 여기서 다시 저장해야 복귀 재오픈이 성립
      repersistForRedirect();
      var priceLabel = '₩' + String(d.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ' + (PT.confirmSuffix || '결제하기');
      if (!payGuard && window.TossPayGuard) {
        payGuard = window.TossPayGuard.create({ btn: payConfirmBtn, needCardLabel: PT.needCard, needAgreeLabel: PT.needAgree });
      }
      if (payGuard) payGuard.setPriceLabel(priceLabel); else payConfirmBtn.textContent = priceLabel;
      tossWidgetWrap.style.display = 'block';
      // 렌더 멈춤 감시 — 프라미스가 끝나지 않으면 payBusy가 고착돼 첫 버튼이 영구 무반응이 된다.
      // 12초 뒤 잠금을 풀고 사유를 보여준다. 위젯 영역은 닫지 않는다(늦게라도 뜨면 그대로 결제 가능).
      var renderT0 = Date.now(), renderSettled = false, renderTimedOut = false, timeoutErrSeq = -1;
      tossRenderInFlight = !tossWidgetRendered;
      if (tossRenderInFlight) {
        setWidgetLoading(true);
        // 결제수단·약관이 뜨기 전에는 결제하기 버튼을 내놓지 않는다 (빈 위젯 위 버튼 = 눌러도 실패)
        payConfirmBtn.style.display = 'none';
        undockConfirm();
      }
      renderTimer = setTimeout(function() {
        if (renderSettled) return;
        renderTimedOut = true;
        payBusy = false;
        showPayError(PT.initFail);
        timeoutErrSeq = payErrSeq;
        reportPayFail('widget', 'RENDER_TIMEOUT', 'widget render not settled in 12s');
      }, 12000);
      tossWidgets.setAmount({ currency: d.currency || 'KRW', value: d.amount })
        .then(function() {
          // 재오픈은 렌더를 건너뛴다 — 보관한 인스턴스로 선택·약관 상태만 다시 잰다
          if (tossWidgetRendered) { if (payGuard) payGuard.refresh(); return; }
          var pmWidget;
          return tossWidgets.renderPaymentMethods({ selector: '#hs-pm' })
            .then(function(w) { pmWidget = w; return tossWidgets.renderAgreement({ selector: '#hs-agree' }); })
            .then(function(agreementWidget) {
              tossWidgetRendered = true;
              if (payGuard) payGuard.attach(pmWidget, agreementWidget);
            });
        })
        .then(function() {
          renderSettled = true; clearTimeout(renderTimer);
          tossRenderInFlight = false; setWidgetLoading(false);
          payBusy = false;
          payConfirmBtn.style.display = '';
          // 늦게 떴다 — 타임아웃 문구만 거둔다 (그 사이 뜬 다른 에러는 건드리지 않는다)
          if (renderTimedOut && payErrSeq === timeoutErrSeq) hidePayError();
          gaPayTrack('pay_widget_open', { render_ms: Date.now() - renderT0, late: renderTimedOut });
          // 'nearest' 1회로는 위젯 하단(결제하기)이 화면 밖에 남는다 → 위젯 상단 정렬 + 하단 고정 배선.
          // 단 실패 사유가 이미 떠 있으면(복귀 재오픈) 그 문구를 가리지 않는다.
          var shownErr = (payErrorConfirmEl && payErrorConfirmEl.style.display !== 'none') ? payErrorConfirmEl : null;
          try { (shownErr || tossWidgetWrap).scrollIntoView({ behavior: 'smooth', block: shownErr ? 'center' : 'start' }); } catch (e) {}
          scheduleDock();
        })
        .catch(function(e) {
          renderSettled = true; clearTimeout(renderTimer);
          tossRenderInFlight = false; setWidgetLoading(false);
          payBusy = false; tossWidgetWrap.style.display = 'none'; undockConfirm();
          showPayError((e && e.message) || PT.initFail);
          reportPayFail('widget', (e && e.code) || 'RENDER_FAILED', (e && e.message) || '');
        });
      // requestPayment는 반드시 버튼 클릭 제스처에서 직접 호출 (팝업 차단 방지)
      payConfirmBtn.onclick = function() {
        if (payGuard && !payGuard.canPay()) return;
        gaPayTrack('pay_confirm_click');
        hidePayError();
        var base = returnBase();
        tossWidgets.requestPayment({
          orderId: d.orderId,
          orderName: d.orderName,
          successUrl: base + '?toss=direct',
          failUrl: base + '?toss=fail',
        }).catch(function(err) {
          var cancelled = err && err.code === 'USER_CANCEL';
          reportPayFail('request', (err && err.code) || 'REQUEST_FAILED', (err && err.message) || '');
          showPayError(cancelled ? PT.cancelled : ((err && err.message) || PT.initFail));
        });
      };
    } catch (e) {
      if (renderTimer) clearTimeout(renderTimer);
      tossRenderInFlight = false; setWidgetLoading(false);
      // 한 번도 렌더되지 않은 위젯 영역은 닫는다 — 빈 상자만 남기지 않고 에러를 첫 버튼 위 슬롯에 띄운다
      if (!tossWidgetRendered) { tossWidgetWrap.style.display = 'none'; undockConfirm(); }
      payBusy = false; showPayError(PT.initFail);
      reportPayFail('widget', 'INIT_EXCEPTION', (e && e.message) || '');
    }
  }

  function startLemon(d, lemonWin) {
    hideAllForLoading();
    setLoadingText(PT.waiting || '', PT.waitingHint || '');
    // 레몬은 체크아웃 표면이 외부 페이지 — 그 표면이 열린 시점을 위젯 오픈과 동일 계측으로 잡는다 (2026-09-20, specs 동일)
    gaPayTrack('pay_widget_open');
    repersistForRedirect(); // 같은 탭 리다이렉트 재시도 대비 (위 repersistForRedirect 주석 참조)
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
        reportPayFail('poll', 'POLL_TIMEOUT', 'status polling timed out');
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
          reportPayFail('poll', String(d.status).toUpperCase(), 'order status ' + d.status);
          showPaySection(PT.failed);
        }
      })
      .catch(function() {});
    }, 2500);
  }

  /* ─── 결제 복귀 처리 (토스 리다이렉트 / 레몬 리턴) ─── */
  // 작업 상태 복원 — 쿼리 없는 일반 복귀 포함 (크레딧 충전 왕복 후 초기화 사고, 2026-07-06 작가님).
  // 직접결제 복귀는 아래 resumePay가 처리하지만, 충전 모달/충전 페이지 왕복은 쿼리가 없어 여기서 복원.
  // 1회성 소비: 복원 즉시 저장분 제거 — 왕복 복귀 첫 로드만 복원하고, 이후 일반 새로고침은 백지
  // (무조건 복원 유지 시 새로고침마다 사진 부활, 2026-07-06 작가님 지적).
  (function restoreDraft() {
    if (uploadedImage) return;
    var img = null, style = null;
    try {
      img = sessionStorage.getItem(IMG_KEY);
      style = sessionStorage.getItem(STYLE_KEY);
      sessionStorage.removeItem(IMG_KEY);
      sessionStorage.removeItem(STYLE_KEY);
    } catch (e) {}
    if (img) {
      uploadedImage = img;
      previewImg.src = img;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'block';
    }
    if (style) {
      selectedStyle = style;
      document.querySelectorAll('.hs-style-btn').forEach(function(b) {
        b.classList.toggle('selected', b.dataset.style === style);
      });
    }
    if (img || style) { updateStepIndicators(); updateGenerateBtn(); }
  })();

  (function resumePay() {
    if (!PAY || !paySection) return;
    var qs;
    try { qs = new URLSearchParams(location.search); } catch (e) { return; }
    var mode = qs.get('toss') || (qs.get('lemon') ? 'lemon' : (qs.get('credits') ? 'credits' : null));
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
      if (saved.toss) lastTossInit = saved.toss;
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
          reportPayFail('confirm', (res.d && res.d.code) || 'CONFIRM_FAILED', (res.d && res.d.error) || '');
          showPaySection((res.d && res.d.error) || PT.failed);
        }
      })
      .catch(function() {
        showMainSections();
        reportPayFail('confirm', 'CONFIRM_NETWORK', 'confirm request failed');
        showPaySection(PT.errNet);
      });
    } else if (mode === 'fail') {
      /* 실패 복귀 (2026-09-20, specs 결함 F 이식) — 기존에는 리로드로 위젯이 사라져 첫 버튼부터 재시작 =
         새 주문이 계속 쌓였다. 저장된 주문이 유효하면 위젯을 자동 재오픈하고 사유를 결제하기 버튼 위에 띄운다. */
      if (oid) pay.orderId = oid;
      var fmsg = failMsg || PT.cancelled;
      reportPayFail('return', qs.get('code') || 'RETURN_FAIL', fmsg);
      showMainSections();
      showPaySection();
      var canReopen = !!(uploadedImage && selectedStyle && !pay.token
        && lastTossInit && lastTossInit.provider === 'toss' && lastTossInit.clientKey && lastTossInit.orderId
        && (!oid || oid === lastTossInit.orderId));
      if (canReopen) {
        pay.orderId = lastTossInit.orderId;
        startToss(lastTossInit); // init 재호출 없음 — 저장된 주문 그대로 (사진·스타일도 startToss 안에서 재저장)
      }
      // 위젯이 열렸으면 결제하기 위 슬롯, 아니면 첫 결제 버튼 위 슬롯 (showPayError 가 고른다)
      showPayError(canReopen && PT.retryHint ? (fmsg + ' ' + PT.retryHint) : fmsg);
    } else if (mode === 'lemon') {
      if (pay.token) {
        proceed();
      } else if (saved && saved.orderId) {
        hideAllForLoading();
        setLoadingText(PT.waiting || '', PT.waitingHint || '');
        startPolling(saved.orderId);
      }
    } else if (mode === 'credits') {
      // 충전 페이지 복귀 — 이미지·스타일 복원됨. 잔액 재확인 후 크레딧 생성 or 선택 화면 재노출
      if (!uploadedImage || !selectedStyle) return;
      fetch('/api/credits', { credentials: 'same-origin' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(d) {
          if (d && typeof d.credits === 'number' && d.credits >= 10) runGenerate(false);
          else showPaySection();
        })
        .catch(function() { showPaySection(); });
    }
  })();

  // 다시 생성: 선택 스타일·사진 그대로 재생성 (크레딧/토큰 없으면 결제 위저드)
  retryBtn.addEventListener('click', function() {
    if (!uploadedImage || !selectedStyle) return;
    if (typeof monkTrack === 'function') {
      monkTrack('click_cta', { button_id: 'regenerate', style: selectedStyle });
    }
    resultEl.style.display = 'none';
    startGenerateFlow();
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
