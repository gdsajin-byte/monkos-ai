/* specs-list.js — render-specs.js pageScript에서 분리 (2026-07-12 퍼널 분리 수술)
   설정 주입: SSR이 인라인 <script>로 window.__SPECS_LIST_CFG__를 선행 정의 (원본 상수 specsListFragment pageScript) */
(function(){
  var hubData = window.__SPECS_LIST_CFG__.hubData;
  var countriesLabel = window.__SPECS_LIST_CFG__.countriesLabel;
  var currentCat = null;
  var currentCont = null;

  var purposeSection = document.getElementById('purpose-section');
  var continentSection = document.getElementById('continent-section');
  var countrySection = document.getElementById('country-section');
  var countryGrid = document.getElementById('country-grid');
  var searchInput = document.getElementById('country-search');
  var searchResults = document.getElementById('search-results');

  // Build flat search index
  var searchIndex = [];
  Object.keys(hubData).forEach(function(cat) {
    Object.keys(hubData[cat]).forEach(function(cont) {
      hubData[cat][cont].forEach(function(c) {
        searchIndex.push({ flag: c.flag, name: c.name, type: c.type, size: c.size, url: c.url, cat: cat, cont: cont });
      });
    });
  });

  // Search
  searchInput.addEventListener('input', function() {
    var q = this.value.trim().toLowerCase();
    if (!q) { searchResults.classList.remove('show'); return; }
    var seen = {};
    var matches = searchIndex.filter(function(c) {
      if (seen[c.url]) return false;
      var match = c.name.toLowerCase().indexOf(q) !== -1;
      if (match) seen[c.url] = true;
      return match;
    }).slice(0, 12);
    if (!matches.length) { searchResults.classList.remove('show'); return; }
    searchResults.innerHTML = matches.map(function(c) {
      return '<div class="specs-search-item" data-url="' + c.url + '">'
        + '<span class="si-flag">' + c.flag + '</span>'
        + '<span>' + c.name + '</span>'
        + '<span class="si-meta">' + c.type + ' · ' + c.size + '</span>'
        + '</div>';
    }).join('');
    searchResults.classList.add('show');
  });

  searchResults.addEventListener('click', function(e) {
    var item = e.target.closest('.specs-search-item');
    if (item && item.dataset.url) location.href = item.dataset.url;
  });

  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target))
      searchResults.classList.remove('show');
  });

  // Purpose cards click
  document.querySelectorAll('.purpose-card').forEach(function(card) {
    card.addEventListener('click', function() {
      currentCat = this.dataset.cat;
      document.querySelectorAll('.purpose-card').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');

      // Update continent counts for this category
      document.querySelectorAll('.continent-card').forEach(function(cc) {
        var contId = cc.dataset.cont;
        var countries = hubData[currentCat] && hubData[currentCat][contId] ? hubData[currentCat][contId] : [];
        var countEl = cc.querySelector('[data-cont-count]');
        if (countEl) countEl.textContent = countries.length + ' ' + countriesLabel;
        cc.style.display = countries.length > 0 ? '' : 'none';
      });

      purposeSection.style.display = 'none';
      continentSection.style.display = '';
      countrySection.style.display = 'none';
    });
  });

  // Continent cards click
  document.querySelectorAll('.continent-card').forEach(function(card) {
    card.addEventListener('click', function() {
      currentCont = this.dataset.cont;
      var countries = hubData[currentCat] && hubData[currentCat][currentCont] ? hubData[currentCat][currentCont] : [];

      countryGrid.innerHTML = countries.map(function(c) {
        return '<a href="' + c.url + '" class="country-card">'
          + '<div class="cc-flag">' + c.flag + '</div>'
          + '<div class="cc-name">' + c.name + '</div>'
          + '<div class="cc-meta">' + c.type + ' · ' + c.size + '</div>'
          + '</a>';
      }).join('');

      continentSection.style.display = 'none';
      countrySection.style.display = '';
    });
  });

  // Back buttons
  document.getElementById('back-to-purpose').addEventListener('click', function() {
    continentSection.style.display = 'none';
    countrySection.style.display = 'none';
    purposeSection.style.display = '';
    currentCat = null;
    document.querySelectorAll('.purpose-card').forEach(function(c) { c.classList.remove('active'); });
  });

  document.getElementById('back-to-continent').addEventListener('click', function() {
    countrySection.style.display = 'none';
    continentSection.style.display = '';
  });
})();
