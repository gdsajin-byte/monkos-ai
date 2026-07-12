/**
 * AttirePicker — 공유 의상 피커 (idpass · headshot · styler 공용)
 *
 * 정본 설계: monkos-ops/tech/designs/2026-07/DESIGN_20260712_공유의상피커_종합설계.md
 * 데이터 정본: ./attire-presets.json (schema_version 2)
 *
 * 의존성 0. 서비스는 use_case 프로파일로 아이템을 조회할 뿐 카테고리를 소유하지 않는다.
 * v1 = 텍스트형: 선택 → attire_desc(영문 [OUTFIT] 프롬프트) 반환. thumbnail 채워지면 이미지 칩 자동 전환(v1.5).
 *
 * 사용:
 *   var picker = AttirePicker.mount(el, { service:'idpass', gender:'m', lang:'ko',
 *     onChange:function(sel){} });
 *   picker.getAttireDesc();   // string | null(기본값=지금 옷 그대로)
 *   picker.getSelection();    // { id, attire_desc, labels, tags } | 기본 옵션
 */
(function () {
  'use strict';

  var UI_TEXT = {
    ko: { title: '의상 선택', gm: '남성', gf: '여성', all: '전체', upload: '내 옷 사진 올리기', soon: '곧 열려요', notice: 'AI 합성 연출 이미지로 완성돼요' },
    ja: { title: '衣装を選ぶ', gm: '男性', gf: '女性', all: 'すべて', upload: '自分の服をアップ', soon: '近日公開', notice: 'AI合成による演出イメージです' },
    en: { title: 'Outfit', gm: 'Men', gf: 'Women', all: 'All', upload: 'Upload my outfit', soon: 'Coming soon', notice: 'Rendered with AI outfit synthesis' }
  };

  var presetsCache = {}; // presetsUrl → Promise<data>

  function loadPresets(url) {
    if (!presetsCache[url]) {
      presetsCache[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error('attire presets HTTP ' + r.status);
        return r.json();
      });
    }
    return presetsCache[url];
  }

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function Picker(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.lang = this.opts.lang || 'ko';
    this.gender = this.opts.gender && this.opts.gender !== 'all' ? this.opts.gender : 'm';
    this.genderLocked = !!(this.opts.gender && this.opts.gender !== 'all');
    this.category = 'all';
    this.data = null;
    this.selection = null; // null = default_option
    this.t = UI_TEXT[this.lang] || UI_TEXT.ko;

    container.classList.add('atp');
    container.setAttribute('data-atp-lang', this.lang);

    var self = this;
    var url = this.opts.presetsUrl || '/components/attire-picker/attire-presets.json';
    loadPresets(url).then(function (data) {
      self.data = data;
      self.render();
      if (typeof self.opts.onReady === 'function') self.opts.onReady(self);
    }).catch(function (e) {
      // 프리셋 로드 실패 = 피커 비표시 — 기본값(지금 옷 그대로) 경로가 항상 살아있어 퍼널 무손상
      container.classList.add('atp-hidden');
      if (window.console) console.warn('[AttirePicker]', e.message);
    });
  }

  Picker.prototype.useCases = function () {
    if (Array.isArray(this.opts.useCase) && this.opts.useCase.length) return this.opts.useCase;
    var prof = this.data && this.data.service_profiles && this.data.service_profiles[this.opts.service];
    return (prof && prof.use_case) || [];
  };

  Picker.prototype.visibleItems = function () {
    var uc = this.useCases();
    var g = this.gender;
    return (this.data.items || []).filter(function (it) {
      if (!it.active) return false;
      if (it.tags.gender !== 'unisex' && it.tags.gender !== g) return false;
      if (uc.length && !(it.tags.use_case || []).some(function (u) { return uc.indexOf(u) !== -1; })) return false;
      return true;
    }).sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
  };

  Picker.prototype.select = function (item) {
    this.selection = item; // null = 기본
    var boxes = this.container.querySelectorAll('.atp-item');
    var selId = item ? item.id : 'original';
    boxes.forEach(function (b) {
      var on = b.getAttribute('data-id') === selId;
      b.classList.toggle('atp-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    var sel = this.getSelection();
    if (typeof this.opts.onChange === 'function') this.opts.onChange(sel);
    this.container.dispatchEvent(new CustomEvent('attire:change', { detail: sel, bubbles: true }));
  };

  Picker.prototype.getSelection = function () {
    if (this.selection) {
      return { id: this.selection.id, attire_desc: this.selection.attire_desc, labels: this.selection.labels, tags: this.selection.tags };
    }
    var d = (this.data && this.data.default_option) || { id: 'original', labels: {}, attire_desc: null };
    return { id: d.id, attire_desc: d.attire_desc, labels: d.labels, tags: null };
  };

  Picker.prototype.getAttireDesc = function () {
    return this.getSelection().attire_desc || null;
  };

  Picker.prototype.render = function () {
    var self = this, t = this.t, lang = this.lang;
    var c = this.container;
    c.innerHTML = '';

    // 헤더 행: 타이틀 + 성별 세그먼트
    var head = el('div', 'atp-head');
    var title = el('span', 'atp-title');
    title.textContent = t.title;
    head.appendChild(title);
    if (!this.genderLocked) {
      var seg = el('div', 'atp-seg', { role: 'tablist', 'aria-label': t.title });
      [['m', t.gm], ['f', t.gf]].forEach(function (pair) {
        var b = el('button', 'atp-seg-btn' + (self.gender === pair[0] ? ' atp-on' : ''), { type: 'button', role: 'tab', 'aria-selected': self.gender === pair[0] ? 'true' : 'false', 'data-g': pair[0] });
        b.textContent = pair[1];
        b.addEventListener('click', function () {
          if (self.gender === pair[0]) return;
          self.gender = pair[0];
          self.category = 'all';
          self.selection = null; // 성별 전환 시 기본값 복귀 (교차 오선택 방지)
          self.render();
          self.select(null);
        });
        seg.appendChild(b);
      });
      head.appendChild(seg);
    }
    c.appendChild(head);

    var items = this.visibleItems();

    // 카테고리 칩 (현재 성별·유스케이스에 존재하는 것만, 2개 이상일 때만 노출)
    var cats = (this.data.categories || []).filter(function (cat) {
      return items.some(function (it) { return it.tags.category === cat.id; });
    }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    if (cats.length > 1) {
      var catRow = el('div', 'atp-cats', { role: 'tablist' });
      var allChip = el('button', 'atp-cat' + (this.category === 'all' ? ' atp-on' : ''), { type: 'button', 'data-cat': 'all' });
      allChip.textContent = t.all;
      catRow.appendChild(allChip);
      cats.forEach(function (cat) {
        var chip = el('button', 'atp-cat' + (self.category === cat.id ? ' atp-on' : ''), { type: 'button', 'data-cat': cat.id });
        chip.textContent = (cat.labels && cat.labels[lang]) || cat.id;
        catRow.appendChild(chip);
      });
      catRow.addEventListener('click', function (e) {
        var btn = e.target.closest('.atp-cat');
        if (!btn) return;
        self.category = btn.getAttribute('data-cat');
        catRow.querySelectorAll('.atp-cat').forEach(function (x) { x.classList.toggle('atp-on', x === btn); });
        self.renderItems();
      });
      c.appendChild(catRow);
    }

    // 아이템 행
    this.itemsRow = el('div', 'atp-items', { role: 'radiogroup', 'aria-label': t.title });
    c.appendChild(this.itemsRow);
    this.renderItems();

    // 하단: 업로드 슬롯(v3 자리) + 연출 고지
    var foot = el('div', 'atp-foot');
    var up = el('button', 'atp-upload', { type: 'button', disabled: 'disabled' });
    up.textContent = t.upload + ' · ' + t.soon;
    foot.appendChild(up);
    var notice = el('span', 'atp-notice');
    notice.textContent = t.notice;
    foot.appendChild(notice);
    c.appendChild(foot);
  };

  Picker.prototype.renderItems = function () {
    var self = this, lang = this.lang;
    var row = this.itemsRow;
    row.innerHTML = '';
    var items = this.visibleItems().filter(function (it) {
      return self.category === 'all' || it.tags.category === self.category;
    });

    // 0번 고정: 지금 옷 그대로
    var d = this.data.default_option;
    row.appendChild(this.itemChip({
      id: d.id, labels: d.labels, swatch: null, thumbnail: null, isDefault: true
    }, !this.selection));

    items.forEach(function (it) {
      row.appendChild(self.itemChip(it, self.selection && self.selection.id === it.id));
    });

    // 키보드 좌우 이동 (radiogroup)
    row.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var chips = Array.prototype.slice.call(row.querySelectorAll('.atp-item'));
      var idx = chips.indexOf(document.activeElement);
      if (idx === -1) return;
      e.preventDefault();
      var next = chips[(idx + (e.key === 'ArrowRight' ? 1 : chips.length - 1)) % chips.length];
      next.focus(); next.click();
    });
  };

  Picker.prototype.itemChip = function (it, selected) {
    var self = this, lang = this.lang;
    var chip = el('button', 'atp-item' + (selected ? ' atp-on' : ''), {
      type: 'button', role: 'radio', 'data-id': it.id,
      'aria-checked': selected ? 'true' : 'false'
    });
    chip.tabIndex = selected ? 0 : -1;

    var visual = el('span', 'atp-visual');
    if (it.thumbnail) {
      var img = el('img', 'atp-thumb', { src: it.thumbnail, alt: '', loading: 'lazy' });
      visual.appendChild(img);
    } else if (it.isDefault) {
      visual.classList.add('atp-visual-original');
      visual.textContent = '✓';
    } else if (it.swatch) {
      visual.classList.add('atp-visual-swatch');
      visual.style.background = it.swatch.secondary
        ? 'linear-gradient(135deg, ' + it.swatch.primary + ' 58%, ' + it.swatch.secondary + ' 58%)'
        : it.swatch.primary;
    }
    chip.appendChild(visual);

    var lab = el('span', 'atp-label');
    lab.textContent = (it.labels && it.labels[lang]) || it.id;
    chip.appendChild(lab);

    chip.addEventListener('click', function () {
      self.select(it.isDefault ? null : self.data.items.find(function (x) { return x.id === it.id; }));
    });
    return chip;
  };

  window.AttirePicker = {
    mount: function (container, opts) { return new Picker(container, opts); },
    _loadPresets: loadPresets
  };
})();
