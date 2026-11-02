/* 토스 결제위젯 결제 버튼 가드 — specs 퍼널·헤드샷 공용 (2026-11-03, ORDER 카드사선택_사전안내)
   카드사를 안 고르고 누르면 토스가 NEED_CARD_PAYMENT_DETAIL로 거절해 실패 알림만 쌓인다.
   → 카드사·약관 미충족이면 버튼을 실제로 비활성하고 무엇을 해야 하는지 문구로 알린다.

   조회 실패·시간 초과는 "알 수 없음" = 막지 않는다. 판정 도구 고장으로 정상 고객의 결제를 막지 않기 위함
   (이때는 전과 같이 토스가 최종 검증한다). */
(function(global){
  var QUERY_TIMEOUT_MS = 3000;

  // 간편결제·앱카드도 method=CARD로 온다 — 토스 SDK v2 런타임 확인(2026-11-03)
  function isMethodReady(selected){
    if(!selected || selected.method !== 'CARD') return true;
    var card = selected.card || {};
    return !!(card.cardCompany || card.easyPay || card.appCard);
  }

  function withTimeout(call){
    return new Promise(function(resolve, reject){
      var timer = setTimeout(function(){ reject(new Error('timeout')); }, QUERY_TIMEOUT_MS);
      Promise.resolve().then(call).then(
        function(v){ clearTimeout(timer); resolve(v); },
        function(e){ clearTimeout(timer); reject(e); }
      );
    });
  }

  /* opts: { btn, needCardLabel, needAgreeLabel } */
  function create(opts){
    var btn = opts.btn;
    var priceLabel = '';
    var attached = false, settled = false;
    var methodReady = true, agreed = true;
    // 조회 응답이 그 사이 도착한 이벤트(더 최신)를 덮어쓰지 않게 하는 세대 번호
    var methodSeq = 0, agreeSeq = 0, attachSeq = 0;
    var pmWidget = null, agreementWidget = null;

    function canPay(){
      return attached && settled && methodReady && agreed;
    }
    function render(){
      btn.disabled = !canPay();
      if(attached && settled && !methodReady) btn.textContent = opts.needCardLabel;
      else if(attached && settled && !agreed) btn.textContent = opts.needAgreeLabel;
      else btn.textContent = priceLabel;
    }
    function refresh(){
      if(!attached) return Promise.resolve();
      var mine = ++attachSeq, mSeq = ++methodSeq, aSeq = ++agreeSeq;
      var pm = pmWidget, ag = agreementWidget;
      return Promise.all([
        withTimeout(function(){ return pm.getSelectedPaymentMethod(); }).then(
          function(sel){ if(mSeq === methodSeq) methodReady = isMethodReady(sel); },
          function(){ if(mSeq === methodSeq) methodReady = true; }
        ),
        withTimeout(function(){ return ag.getAgreementStatus(); }).then(
          function(st){ if(aSeq === agreeSeq) agreed = !st || st.agreedRequiredTerms !== false; },
          function(){ if(aSeq === agreeSeq) agreed = true; }
        )
      ]).then(function(){
        if(mine !== attachSeq) return;
        settled = true;
        render();
      });
    }
    /* 렌더 직후 1회. renderPaymentMethods·renderAgreement 반환 인스턴스를 받아 보관·구독한다. */
    function attach(pm, ag){
      pmWidget = pm; agreementWidget = ag;
      attached = true; settled = false;
      render();
      pm.on('paymentMethodSelect', function(sel){
        methodSeq++;
        methodReady = isMethodReady(sel);
        render();
      });
      ag.on('agreementStatusChange', function(st){
        agreeSeq++;
        agreed = !st || st.agreedRequiredTerms !== false;
        render();
      });
      return refresh();
    }
    function setPriceLabel(label){
      priceLabel = label;
      render();
    }
    return { attach: attach, refresh: refresh, canPay: canPay, setPriceLabel: setPriceLabel };
  }

  global.TossPayGuard = { create: create, isMethodReady: isMethodReady };
})(window);
