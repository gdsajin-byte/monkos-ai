(function() {
  var i18n = window.__HS_I18N__ || {};
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
      updateStepIndicators();
      updateGenerateBtn();
    });
  });

  generateBtn.addEventListener('click', async function() {
    if (!uploadedImage || !selectedStyle) return;

    if (typeof currentUser === 'undefined' || !currentUser) {
      if (typeof headerLogin === 'function') {
        headerLogin();
      } else {
        alert(i18n.loginRequired || 'Login required');
      }
      return;
    }

    var credits = currentUser.credits || 0;
    if (credits < 10) {
      if (typeof openCreditShop === 'function') {
        openCreditShop();
      } else {
        alert(i18n.insufficientCredits || 'Insufficient credits');
      }
      return;
    }

    generateBtn.disabled = true;
    loadingEl.style.display = 'block';
    resultEl.style.display = 'none';
    document.getElementById('hsUploadSection').style.display = 'none';
    document.getElementById('hsStyleSection').style.display = 'none';
    document.getElementById('hsGenerateSection').style.display = 'none';

    try {
      var res = await fetch('/api/headshot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image: uploadedImage,
          purpose: selectedStyle,
          model: 'nano-banana-pro',
        }),
      });

      var data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.image) {
        var resultSrc = data.image.startsWith('data:') ? data.image : ('data:image/png;base64,' + data.image);
        originalImg.src = uploadedImage;
        resultImg.src = resultSrc;
        loadingEl.style.display = 'none';
        resultEl.style.display = 'block';

        history.unshift({ original: uploadedImage, result: resultSrc, style: selectedStyle, time: Date.now() });
        renderHistory();

        if (currentUser) {
          currentUser.credits = (currentUser.credits || 0) - 10;
          updateBalance();
        }
      } else {
        throw new Error(data.error || 'No image returned');
      }
    } catch (err) {
      loadingEl.style.display = 'none';
      document.getElementById('hsUploadSection').style.display = 'block';
      document.getElementById('hsStyleSection').style.display = 'block';
      document.getElementById('hsGenerateSection').style.display = 'block';
      alert(i18n.errorRetry || err.message);
    }

    generateBtn.disabled = false;
    updateGenerateBtn();
  });

  retryBtn.addEventListener('click', function() {
    resultEl.style.display = 'none';
    document.getElementById('hsUploadSection').style.display = 'block';
    document.getElementById('hsStyleSection').style.display = 'block';
    document.getElementById('hsGenerateSection').style.display = 'block';
    updateGenerateBtn();
  });

  downloadBtn.addEventListener('click', function() {
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
