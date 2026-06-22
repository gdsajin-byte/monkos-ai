(function() {
  window.monkTrack = function(eventName, params) {
    var payload = JSON.stringify({
      events: [{
        event_name: eventName,
        user_id: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null,
        page_path: location.pathname,
        lang: window.__LANG__ || 'ko',
        region: window.__REGION__ || 'kr',
        service: 'portal',
        params: params || {},
      }]
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  };
})();
