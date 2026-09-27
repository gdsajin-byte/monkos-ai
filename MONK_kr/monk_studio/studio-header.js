// 몽크사진관 공통 메뉴 — 전 페이지 상단 고정
// 메뉴 수정은 이 파일 한 곳에서만 한다. 각 페이지는 <header id="header"></header> 바로 뒤에서 이 스크립트를 동기 로드한다.
(function () {
  var BASE = '/monk_studio/';
  var BOOKING_URL = 'https://booking.naver.com/booking/13/bizes/1177662';

  var MENU = [
    { label: '촬영 상품', href: BASE + 'monk_studio.html#service', match: ['id_photo/', 'profile/', 'family/', 'group/'] },
    { label: '온라인 스토어', href: BASE + 'store/store.html', match: ['store/'] },
    { label: '출장촬영', href: BASE + 'biztrip/biztrip.html', match: ['biztrip/'] },
    { label: '후기', href: 'https://m.place.naver.com/place/1454242520/review/visitor', external: true },
    { label: '블로그', href: 'https://m.blog.naver.com/studio_monk', external: true },
    { label: '오시는 길', href: BASE + 'monk_studio.html#contact' }
  ];

  var path = location.pathname;
  function isActive(item) {
    return (item.match || []).some(function (m) { return path.indexOf(BASE + m) !== -1; });
  }
  function linkAttrs(item) {
    return 'href="' + item.href + '"' + (item.external ? ' target="_blank" rel="noopener"' : '');
  }

  var desktop = MENU.map(function (item) {
    var cls = isActive(item) ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900 font-medium';
    return '<a ' + linkAttrs(item) + ' class="' + cls + ' transition-colors">' + item.label + '</a>';
  }).join('');

  var mobile = MENU.map(function (item) {
    var cls = isActive(item) ? 'text-gray-900 font-semibold bg-gray-50' : 'text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50';
    return '<a ' + linkAttrs(item) + ' class="block w-full px-3 py-3 text-base rounded-md ' + cls + '">' + item.label + '</a>';
  }).join('');

  var header = document.getElementById('header');
  header.className = 'sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-shadow duration-300';
  header.innerHTML =
    '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
      '<div class="flex justify-between items-center h-20">' +
        '<a href="' + BASE + 'monk_studio.html" class="flex-shrink-0 flex items-center group">' +
          '<img src="/images/monk-logo.png" alt="몽크사진관" class="h-9 w-auto translate-y-[7px] group-hover:opacity-80 transition-opacity duration-300">' +
        '</a>' +
        '<nav class="hidden md:flex space-x-6 items-center">' + desktop +
          '<a href="' + BOOKING_URL + '" target="_blank" rel="noopener" class="px-6 h-11 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors duration-300 inline-flex items-center justify-center leading-none">간편예약</a>' +
        '</nav>' +
        '<button id="studio-menu-btn" type="button" aria-label="메뉴 열기" aria-expanded="false" class="md:hidden p-2 text-gray-600 hover:text-gray-900">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div id="studio-menu" class="hidden md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">' +
      '<div class="px-4 pt-2 pb-6 space-y-1">' + mobile +
        '<a href="' + BOOKING_URL + '" target="_blank" rel="noopener" class="w-full h-[52px] px-3 mt-4 text-base font-bold text-white bg-black hover:bg-gray-800 rounded-xl leading-none inline-flex items-center justify-center">간편예약</a>' +
      '</div>' +
    '</div>';

  // 고정 메뉴에 앵커 목적지가 가려지지 않도록
  document.documentElement.style.scrollPaddingTop = '5rem';

  var btn = document.getElementById('studio-menu-btn');
  var menu = document.getElementById('studio-menu');
  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); });
  });

  window.addEventListener('scroll', function () {
    header.classList.toggle('shadow-sm', window.scrollY > 10);
  }, { passive: true });
})();
