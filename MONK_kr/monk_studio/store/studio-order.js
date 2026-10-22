// 몽크사진관 온라인 인화 주문 — 접수(사진 메일) + 토스 결제 (print.html · photo.html 공용)
// 흐름: [주문하기] → /api/studio-order (사진 → 꾸 메일, 서버 저장 0) → 토스 결제창 → 복귀 → /api/studio-pay → [결제완료] 메일
// 페이지는 window.StudioOrderPage = { kind, collect(), sent() } 를 먼저 정의한다.
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var page = window.StudioOrderPage;
  if (!page) return;
  var KEY = 'studio_order_' + page.kind;
  var TALK = 'https://talk.naver.com/W5UJ45', TEL = '031-791-5030';
  var btn = $('orderBtn'), err = $('orderError'), card = $('orderCard'), box = $('studioPay');
  if (!btn || !box) return;
  var widgets = null, busy = false;

  function won(n){ return Number(n).toLocaleString('ko-KR') + '원'; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function showErr(msg){ if (!err) { alert(msg); return; } err.textContent = msg; err.hidden = !msg; if (msg) err.scrollIntoView({ behavior:'smooth', block:'center' }); }
  function setBusy(on, label){ busy = on; btn.disabled = on; btn.textContent = on ? (label || '보내는 중…') : '주문하기'; }
  function save(o){ try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }
  function load(){ try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch(e){ return null; } }
  function clear(){ try { sessionStorage.removeItem(KEY); } catch(e){} }
  function val(id){ var el = $(id); return el ? (el.value || '').trim() : ''; }
  function returnUrl(tag){ return location.origin + location.pathname + '?toss=' + tag; }
  function helpHtml(){
    return '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">'
      + '<a href="' + TALK + '" target="_blank" rel="noopener" class="px-4 h-11 bg-[#03C75A] text-white font-bold rounded-xl inline-flex items-center justify-center text-sm">네이버 톡톡으로 문의</a>'
      + '<a href="tel:' + TEL + '" class="px-4 h-11 bg-black text-white font-bold rounded-xl inline-flex items-center justify-center text-sm">' + TEL + '</a></div>';
  }

  // ── 1. 접수 ───────────────────────────────────────────────────────
  btn.addEventListener('click', function(){
    if (busy) return;
    showErr('');
    var d = page.collect();
    var name = val('name'), phone = val('phone');
    var digits = phone.replace(/\D/g, '');
    var miss = [];
    if (!name) miss.push('이름');
    if (digits.length < 9 || digits.length > 11) miss.push('연락처');
    if (miss.length) return showErr(miss.join(', ') + '을(를) 확인해 주세요.');
    if (!d.photos || !d.photos.length) return showErr('인화할 사진을 올려 주세요.');
    for (var i = 0; i < d.items.length; i++) {
      var it = d.items[i];
      if (page.kind === 'id' && !(it.purpose || '').trim()) return showErr((i + 1) + '번째 항목에 어디에 쓰실 사진인지 적어 주세요.');
      if (!it.file) return showErr((i + 1) + '번째 항목의 사진을 골라 주세요.');
    }
    if (d.delivery === 'mail' && !val('addr1')) return showErr('받는 주소를 적어 주세요.');
    var agree = $('agree');
    if (agree && !agree.checked) return showErr('사진 이용 동의에 체크해 주세요.');

    var fd = new FormData();
    fd.append('order', JSON.stringify({ kind: page.kind, name: name, phone: phone, delivery: d.delivery, addr1: val('addr1'), addr2: val('addr2'), items: d.items }));
    fd.append('website', val('website'));
    d.photos.forEach(function(f){ fd.append('photos', f, f.name); });

    setBusy(true, '사진 보내는 중…');
    fetch('/api/studio-order', { method: 'POST', body: fd })
      .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }).catch(function(){ return { ok: false, j: {} }; }); })
      .then(function(res){
        var j = res.j || {};
        if (!res.ok || !j.ok) { setBusy(false); return showErr(j.error || '주문이 접수되지 않았습니다. 다시 눌러 주시거나 톡톡·전화로 주문해 주세요.'); }
        if (j.silent) { setBusy(false); return done({ orderId: j.orderId, amount: 0, silent: true }); }
        var o = { orderId: j.orderId, orderName: j.orderName, amount: j.amount, token: j.token, clientKey: j.clientKey, name: name, digits: digits, at: Date.now() };
        save(o);
        if (page.sent) page.sent();
        setBusy(false);
        btn.hidden = true;
        openPay(o, '사진이 사진관에 전달됐습니다. 이어서 결제해 주세요.');
      })
      .catch(function(){ setBusy(false); showErr('연결이 끊겼습니다. 다시 눌러 주시거나 톡톡·전화로 주문해 주세요.'); });
  });

  // ── 2. 결제창 ─────────────────────────────────────────────────────
  function openPay(o, note){
    box.hidden = false;
    box.innerHTML = '<div class="bg-white rounded-3xl border border-gray-200 p-8 mt-6">'
      + '<p class="text-sm font-bold mb-1">주문번호 <span class="font-mono">' + esc(o.orderId) + '</span></p>'
      + (note ? '<p class="text-sm text-gray-600 mb-5">' + esc(note) + '</p>' : '')
      + '<div id="sp-pm"></div><div id="sp-agree"></div>'
      + '<p id="sp-err" class="text-sm text-red-600 mt-3" hidden></p>'
      + '<button id="sp-pay" type="button" class="w-full mt-5 px-6 h-14 bg-black text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 text-lg">' + won(o.amount) + ' 결제하기</button>'
      + '<p class="text-xs text-gray-400 mt-3 leading-relaxed">결제가 끝나면 사진관에 결제 완료 알림이 가고, 확인 후 인화합니다. 화질이 인화에 부족하면 미리 연락드리고 원하시면 결제를 취소해 드립니다.</p>'
      + '</div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var spErr = $('sp-err'), pay = $('sp-pay');
    function perr(m){ spErr.textContent = m; spErr.hidden = !m; }
    if (!window.TossPayments) { pay.disabled = true; return perr('결제 모듈을 불러오지 못했습니다. 새로고침하거나 톡톡·전화로 문의해 주세요.'); }
    pay.disabled = true;
    try {
      widgets = window.TossPayments(o.clientKey).widgets({ customerKey: window.TossPayments.ANONYMOUS });
    } catch (e) { return perr('결제 모듈 초기화 실패: ' + (e && e.message || '')); }
    var timer = setTimeout(function(){ perr('결제창이 늦게 뜨고 있습니다. 잠시 기다리시거나 새로고침해 주세요.'); }, 12000);
    widgets.setAmount({ currency: 'KRW', value: o.amount })
      .then(function(){ return widgets.renderPaymentMethods({ selector: '#sp-pm' }); })
      .then(function(){ return widgets.renderAgreement({ selector: '#sp-agree' }); })
      .then(function(){ clearTimeout(timer); perr(''); pay.disabled = false; })
      .catch(function(e){ clearTimeout(timer); perr('결제창을 열지 못했습니다: ' + (e && e.message || '')); });
    pay.onclick = function(){
      perr('');
      var req = { orderId: o.orderId, orderName: o.orderName, successUrl: returnUrl('success'), failUrl: returnUrl('fail'), customerName: o.name };
      if (o.digits && o.digits.length >= 8) req.customerMobilePhone = o.digits;
      // requestPayment 앞에 await·비동기를 두면 팝업이 차단된다 (charge.html 주석)
      widgets.requestPayment(req).catch(function(e){
        perr(e && e.code === 'USER_CANCEL' ? '결제를 취소하셨습니다. 다시 결제하려면 결제하기를 눌러 주세요.' : ((e && e.message) || '결제 요청에 실패했습니다.'));
      });
    };
  }

  // ── 3. 복귀 ───────────────────────────────────────────────────────
  var q = new URLSearchParams(location.search);
  var mode = q.get('toss');
  if (mode) {
    history.replaceState(null, '', location.pathname);
    var saved = load();
    if (mode === 'success') {
      var pk = q.get('paymentKey'), oid = q.get('orderId'), amt = Number(q.get('amount'));
      if (card) card.hidden = true;
      box.hidden = false;
      box.innerHTML = '<div class="bg-white rounded-3xl border border-gray-200 p-8 text-center"><p class="font-bold">결제 확인 중…</p></div>';
      fetch('/api/studio-pay', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey: pk, orderId: oid, amount: amt, token: saved && saved.orderId === oid ? saved.token : '' }) })
        .then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }).catch(function(){ return { ok: false, j: {} }; }); })
        .then(function(res){
          var j = res.j || {};
          if (res.ok && j.ok) { clear(); return done({ orderId: oid, amount: j.amount || amt, method: j.method, receiptUrl: j.receiptUrl, notified: j.notified !== false }); }
          fail(j.error || '결제 확인에 실패했습니다.', saved, oid);
        })
        .catch(function(){ fail('결제 확인 중 연결이 끊겼습니다. 결제 내역이 있다면 사진관으로 연락해 주세요.', saved, oid); });
    } else if (mode === 'fail') {
      var code = q.get('code') || '', msg = q.get('message') || '';
      fail(code === 'PAY_PROCESS_CANCELED' ? '결제를 취소하셨습니다.' : ('결제가 완료되지 않았습니다. ' + msg), saved, q.get('orderId'));
    }
  }

  function fail(msg, saved, oid){
    var canRetry = saved && saved.orderId && (!oid || saved.orderId === oid) && (Date.now() - (saved.at || 0) < 2 * 3600 * 1000);
    if (card && canRetry) card.hidden = true;
    box.hidden = false;
    box.innerHTML = '<div class="bg-white rounded-3xl border border-red-200 p-8">'
      + '<p class="font-bold text-red-600 mb-2">' + esc(msg) + '</p>'
      + (canRetry
          ? '<p class="text-sm text-gray-600 mb-4">주문번호 <span class="font-mono">' + esc(saved.orderId) + '</span>의 사진은 이미 사진관에 전달됐습니다. 결제만 다시 하시면 됩니다.</p>'
            + '<button id="sp-retry" type="button" class="w-full px-6 h-14 bg-black text-white font-bold rounded-xl text-lg">다시 결제하기</button>'
          : '<p class="text-sm text-gray-600">주문 정보가 남아 있지 않습니다. 처음부터 다시 주문해 주시거나 아래로 문의해 주세요.</p>')
      + helpHtml() + '</div>';
    if (canRetry) $('sp-retry').onclick = function(){ openPay(saved, ''); };
  }

  function done(r){
    if (card) card.hidden = true;
    btn.hidden = true;
    box.hidden = false;
    var lines = [];
    if (r.silent) lines.push('주문이 접수됐습니다.');
    else {
      lines.push('<b>' + won(r.amount) + '</b> 결제가 완료됐습니다.');
      lines.push('사진관에서 사진을 확인한 뒤 인화합니다. 매장 수령은 업무시간에 바로 찾아가실 수 있고, 우편은 발송 후 3일 내외 걸립니다.');
      if (r.notified === false) lines.push('<span class="text-red-600">접수 알림 전달에 문제가 있어 사진관에서 결제 내역을 확인해 연락드립니다. 급하시면 아래로 문의해 주세요.</span>');
    }
    box.innerHTML = '<div class="bg-white rounded-3xl border border-gray-200 p-8 text-center">'
      + '<p class="text-xl font-semibold mb-2">주문 완료</p>'
      + '<p class="text-sm text-gray-500 mb-4">주문번호 <span class="font-mono text-gray-900">' + esc(r.orderId) + '</span></p>'
      + '<p class="text-sm text-gray-700 leading-relaxed">' + lines.join('<br>') + '</p>'
      + (r.receiptUrl ? '<a href="' + esc(r.receiptUrl) + '" target="_blank" rel="noopener" class="inline-block mt-4 text-sm underline text-gray-600">영수증 보기</a>' : '')
      + helpHtml() + '</div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
})();
