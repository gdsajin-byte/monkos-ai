/**
 * MONKOS Portal v4 — main.js
 * 초기화 + 이벤트 바인딩
 */

// === 세션 복원 (즉시) ===
restoreSession();
window.addEventListener('load', initGoogleAuth);

// === CTA 토큰 전달 (다중 트리거) ===
async function handleCtaClick(e) {
  if (!currentUser || !currentUser.id) return;
  e.preventDefault();
  var targetUrl = getCtaUrl();
  try {
    var res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    var data = await res.json();
    if (data.token) {
      var url = new URL(targetUrl);
      url.searchParams.set('uid', currentUser.id);
      url.searchParams.set('token', data.token);
      window.location.href = url.toString();
    } else {
      window.location.href = targetUrl;
    }
  } catch (err) {
    window.location.href = targetUrl;
  }
}

// CTA 바인딩: .btn-shoot, .svc.live, .svc.live .svc-link
document.addEventListener('DOMContentLoaded', function() {
  // CTA 버튼들
  var btnShoot = document.querySelector('.btn-shoot');
  if (btnShoot) {
    btnShoot.addEventListener('click', function(e) {
      if (currentUser && currentUser.id) {
        handleCtaClick(e);
      } else {
        window.location.href = getCtaUrl();
      }
    });
  }

  var svcLive = document.querySelector('.svc.live');
  if (svcLive) {
    svcLive.addEventListener('click', function(e) {
      if (e.target.closest('.svc-link') || e.target.closest('.svc')) {
        if (currentUser && currentUser.id) {
          handleCtaClick(e);
        } else {
          window.location.href = getCtaUrl();
        }
      }
    });
  }

  // 크롭앱 카드
  var svcFree = document.querySelector('.svc.free');
  if (svcFree) {
    svcFree.addEventListener('click', function() {
      window.open('https://crop.monkos.ai', '_blank');
    });
  }

  // /pricing → openCreditShop
  var pricingLink = document.querySelector('a[href="/pricing"]');
  if (pricingLink) {
    pricingLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.openCreditShop();
    });
  }
});

// === 챗봇 이벤트 ===
document.addEventListener('DOMContentLoaded', function() {
  var cbSend = document.getElementById('cbSend');
  var cbInput = document.getElementById('cbInput');
  var chatCloseBtn = document.getElementById('chatClose');

  if (cbSend) cbSend.addEventListener('click', sendMessage);
  if (cbInput) {
    cbInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.isComposing) sendMessage();
    });
    // 입력창 클릭 시 포커스 유지 (모달 안 열림)
  }
  if (chatCloseBtn) chatCloseBtn.addEventListener('click', closeChat);

  // 챗봇 모달 백드롭 클릭 닫기
  var chatModal = document.getElementById('chatModal');
  if (chatModal) {
    chatModal.addEventListener('click', function(e) {
      if (e.target === chatModal) closeChat();
    });
  }
});

// === 갤러리 자동 스크롤 ===
document.addEventListener('DOMContentLoaded', function() {
  var gt = document.getElementById('gt');
  if (gt) {
    var sp = 0;
    setInterval(function() {
      sp += 0.8;
      if (sp >= gt.scrollWidth - gt.clientWidth) sp = 0;
      gt.scrollLeft = sp;
    }, 30);
  }
});

// === 팝오버/모달 외부 클릭 닫기 ===
document.addEventListener('click', function(e) {
  // 로그아웃 팝오버
  var badge = document.getElementById('providerBadge');
  var pop = document.getElementById('logoutPopover');
  if (badge && pop && !badge.contains(e.target)) {
    pop.classList.remove('open');
  }
});

// 모달 외부 클릭 닫기
document.addEventListener('DOMContentLoaded', function() {
  ['loginModal', 'creditShopModal', 'privacyModal', 'portraitModal'].forEach(function(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });
});
