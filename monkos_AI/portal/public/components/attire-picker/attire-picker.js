/**
 * AttirePicker — 공유 의상 피커 (idpass · headshot · styler 공용)
 *
 * 정본 설계: monkos-ops/tech/designs/2026-07/DESIGN_20260712_공유의상피커_종합설계.md
 * 데이터 정본: ./attire-presets.json (schema_version 2)
 *
 * 의존성 0. 서비스는 use_case 프로파일로 아이템을 조회할 뿐 카테고리를 소유하지 않는다.
 * v1 = 텍스트형: 선택 → attire_desc(영문 [OUTFIT] 프롬프트) 반환. thumbnail 채워지면 카드형 자동 전환(v1.5).
 * 업로드: 이미지를 컴포넌트가 리사이즈·보관(getAttireImage) — 서버 2이미지 i2i 배선은 소비자 몫.
 *
 * 사용:
 *   var picker = AttirePicker.mount(el, { service:'idpass', gender:'m', age:'adult', lang:'ko',
 *     upload:true, warnLightTop:true, onChange:function(sel){} });
 *   picker.getAttireDesc();    // string | null(기본값 — 서버가 성인=정장·아기=지금 옷 유지 / 업로드)
 *   picker.getAttireImage();   // base64(jpeg, ≤1024px) | null — 업로드 선택 시
 *   picker.getSelection();     // { id, attire_desc, attire_image, labels, tags }
 */
(function () {
  'use strict';

  var UI_TEXT = {
    ko: {
      // gm/gf = 의상 카탈로그 필터 라벨 — 피사체 성별 선언이 아니다 (2026-07-12 작가님: 메인 프롬프트[SUBJECT]와 피커[OUTFIT] 채널 분리)
      title: '의상 선택', gm: '남성복', gf: '여성복', all: '전체',
      upload: '내 옷 사진 올리기', uploadOn: '내 옷', soon: '곧 열려요',
      notice: 'AI 합성 연출 이미지로 완성돼요',
      warnLight: '⚠️ 흰색·밝은 상의는 발급 거부 사유가 될 수 있어요',
      uploadBad: '이 사진은 쓰기 어려워요 — 256px 이상, 5MB 이하 이미지로 다시 올려주세요',
      tieLabel: '넥타이',
      babyGuide: '아기 사진은 옷 모양은 그대로 두고 색만 바꿔드려요'
    },
    ja: {
      title: '衣装を選ぶ', gm: 'メンズ', gf: 'レディース', all: 'すべて',
      upload: '自分の服をアップ', uploadOn: 'マイ服', soon: '近日公開',
      notice: 'AI合成による演出イメージです',
      warnLight: '⚠️ 白や明るい色のトップスは受理拒否の原因になる場合があります',
      uploadBad: 'この画像は使用できません — 256px以上・5MB以下の画像を選んでください',
      tieLabel: 'ネクタイ',
      babyGuide: '赤ちゃんの写真は服の形はそのまま、色だけ変えます'
    },
    en: {
      title: 'Outfit', gm: "Menswear", gf: "Womenswear", all: 'All',
      upload: 'Upload my outfit', uploadOn: 'My outfit', soon: 'Coming soon',
      notice: 'Rendered with AI outfit synthesis',
      warnLight: '⚠️ White or light-colored tops may cause your application to be rejected',
      uploadBad: 'This image cannot be used — please pick one at least 256px and under 5MB',
      tieLabel: 'Necktie',
      babyGuide: 'For baby photos, we only change the color — the outfit shape stays the same'
    },
    es: {
      title: 'Elegir atuendo', gm: 'Caballero', gf: 'Dama', all: 'Todo',
      upload: 'Subir mi ropa', uploadOn: 'Mi ropa', soon: 'Próximamente',
      notice: 'Imagen renderizada con síntesis de atuendo AI',
      warnLight: '⚠️ Las prendas blancas o de colores claros pueden ser motivo de rechazo',
      uploadBad: 'Esta imagen no se puede usar — seleccione una de al menos 256px y menos de 5MB',
      tieLabel: 'Corbata',
      babyGuide: 'Para fotos de bebé, solo cambiamos el color — la forma de la ropa se mantiene igual'
    }
  };

  var LIGHT_COLORS = ['white', 'cream']; // 흰 배경 반려 주의 대상 (color.primary)

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

  // 업로드 이미지 클라 리사이즈 — 최대 변 1024px, jpeg. 콜백(dataURL) / 실패 시 null
  function resizeImage(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      if (img.width < 256 || img.height < 256) return cb(null); // 저해상 반려 (쌍아 §4-4)
      var scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  function Picker(container, opts) {
    this.container = container;
    this.opts = opts || {};
    this.lang = this.opts.lang || 'ko';
    this.age = this.opts.age || 'adult';          // adult | teen | baby — 연령은 세그먼트가 아닌 컨텍스트 주입
    this.gender = this.opts.gender && this.opts.gender !== 'all' ? this.opts.gender : 'm';
    this.genderLocked = !!(this.opts.gender && this.opts.gender !== 'all') || this.age === 'baby'; // 영유아 = 성별 축 무의미
    this.category = 'all';
    this.uploadEnabled = this.opts.upload !== false;          // 기본 활성 (작가님 2026-07-12: 나노2에 이미지만 보내면 되는 구조)
    this.warnLightTop = this.opts.warnLightTop !== false;     // 밝은 상의 반려 주의 (흰 배경 규격 소비자는 켠 채 유지)
    this.includeInactive = !!this.opts.includeInactive;       // 데모·검수용 — 실서비스 기본 false
    this.data = null;
    this.selection = null;   // null = default_option
    this.uploadItem = null;  // {id:'upload', attire_image, thumbnail(dataURL), isUpload:true}
    this.tieOn = false;
    this.tieColor = null;
    this.t = UI_TEXT[this.lang] || UI_TEXT.en || UI_TEXT.ko;

    container.classList.add('atp');
    container.setAttribute('data-atp-lang', this.lang);

    if (!document.querySelector('link[href*="attire-picker.css"]')) {
      var cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = '/components/attire-picker/attire-picker.css';
      document.head.appendChild(cssLink);
    }

    var self = this;
    var url = this.opts.presetsUrl || '/components/attire-picker/attire-presets.json';
    loadPresets(url).then(function (data) {
      self.data = data;
      self.render();
      if (typeof self.opts.onReady === 'function') self.opts.onReady(self);
    }).catch(function (e) {
      // 프리셋 로드 실패 = 피커 비표시 — 기본값(attire_desc 없음) 경로가 항상 살아있어 퍼널 무손상
      container.classList.add('atp-hidden');
      if (window.console) console.warn('[AttirePicker]', e.message);
    });
  }

  Picker.prototype.useCases = function () {
    if (Array.isArray(this.opts.useCase) && this.opts.useCase.length) return this.opts.useCase;
    var prof = this.data && this.data.service_profiles && this.data.service_profiles[this.opts.service];
    return (prof && prof.use_case) || [];
  };

  Picker.prototype.ageMatch = function (it) {
    var ages = it.tags.age || ['adult'];
    return ages.indexOf(this.age) !== -1;
  };

  Picker.prototype.visibleItems = function () {
    var self = this;
    var uc = this.useCases();
    var g = this.gender;
    return (this.data.items || []).filter(function (it) {
      if (!it.active && !self.includeInactive) return false;
      if (!it.thumbnail && it.mode !== 'recolor' && !self.includeInactive) return false;
      if (!self.ageMatch(it)) return false;
      if (self.age !== 'baby' && it.tags.gender !== 'unisex' && it.tags.gender !== g) return false;
      if (uc.length && !(it.tags.use_case || []).some(function (u) { return uc.indexOf(u) !== -1; })) return false;
      return true;
    }).sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
  };

  Picker.prototype.isLightTop = function (item) {
    return !!(item && item.tags && LIGHT_COLORS.indexOf(item.tags.color.primary) !== -1);
  };

  Picker.prototype.select = function (item) {
    this.selection = item; // null = 기본 / uploadItem 가능
    var boxes = this.container.querySelectorAll('.atp-item');
    var selId = item ? item.id : 'original';
    boxes.forEach(function (b) {
      var on = b.getAttribute('data-id') === selId;
      b.classList.toggle('atp-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (!this.tieSupported(this.selection)) {
      this.tieOn = false;
      this.tieColor = null;
    }
    this.renderTieRow();
    this.updateTieBadge();
    this.updateWarn();
    var sel = this.getSelection();
    if (typeof this.opts.onChange === 'function') this.opts.onChange(sel);
    this.container.dispatchEvent(new CustomEvent('attire:change', { detail: sel, bubbles: true }));
  };

  // 반려 주의 문구 — 밝은 프리셋 선택 또는 업로드 선택 시 노출
  Picker.prototype.updateWarn = function () {
    if (!this.warnEl) return;
    var show = this.warnLightTop;
    this.warnEl.textContent = show ? this.t.warnLight : '';
    this.warnEl.style.display = show ? '' : 'none';
  };

  // 기본칩 라벨 — 서버 프롬프트와 일치: 아기=지금 옷 유지, 그 외=정장 (buildT1Prompt)
  Picker.prototype.defaultLabels = function (d) {
    return (this.age === 'baby' && d.labels_baby) || d.labels;
  };

  Picker.prototype.getSelection = function () {
    if (this.selection) {
      var desc = this.selection.attire_desc || null;
      var tieId = null;
      if (desc && this.tieOn && this.tieColor) {
        desc = desc.replace('no tie', this.tieColor.descFragment);
        tieId = this.tieColor.id;
      }
      return {
        id: this.selection.id,
        attire_desc: desc,
        attire_image: this.selection.isUpload ? this.selection.attire_image : null,
        attireTie: tieId,
        labels: this.selection.labels, tags: this.selection.tags || null
      };
    }
    var d = (this.data && this.data.default_option) || { id: 'original', labels: {}, attire_desc: null };
    return { id: d.id, attire_desc: d.attire_desc, attire_image: null, attireTie: null, labels: this.defaultLabels(d), tags: null };
  };

  Picker.prototype.getAttireDesc = function () { return this.getSelection().attire_desc || null; };
  Picker.prototype.getAttireImage = function () { return this.getSelection().attire_image || null; };

  Picker.prototype.render = function () {
    var self = this, t = this.t, lang = this.lang;
    var c = this.container;
    c.innerHTML = '';

    // 헤더 행: 타이틀 + 성별 세그먼트 (영유아 모드는 성별 축 숨김)
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

    // 카테고리 칩 (현재 필터에 존재하는 것만, 2개 이상일 때만 노출)
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
        chip.textContent = (cat.labels && (cat.labels[lang] || cat.labels.en)) || cat.id;
        catRow.appendChild(chip);
      });
      catRow.addEventListener('click', function (e) {
        var btn = e.target.closest('.atp-cat');
        if (!btn) return;
        self.category = btn.getAttribute('data-cat');
        catRow.querySelectorAll('.atp-cat').forEach(function (x) { x.classList.toggle('atp-on', x === btn); });
        self.renderItems();
        self.updateTieBadge();
      });
      c.appendChild(catRow);
    }

    // 아이템 행
    this.itemsRow = el('div', 'atp-items', { role: 'radiogroup', 'aria-label': t.title });
    c.appendChild(this.itemsRow);
    this.renderItems();

    if (this.age === 'baby' && t.babyGuide) {
      var guide = el('div', 'atp-baby-guide');
      guide.textContent = t.babyGuide;
      c.appendChild(guide);
    }

    this.tieRowEl = el('div', 'atp-tie-row');
    this.tieRowEl.style.display = 'none';
    c.appendChild(this.tieRowEl);

    // 반려 주의 문구 영역
    this.warnEl = el('div', 'atp-warn');
    this.warnEl.style.display = 'none';
    c.appendChild(this.warnEl);

    // 하단: 업로드 + 연출 고지
    var foot = el('div', 'atp-foot');
    if (this.uploadEnabled) {
      var fileInput = el('input', 'atp-file', { type: 'file', accept: 'image/*' });
      fileInput.style.display = 'none';
      var up = el('button', 'atp-upload atp-upload-on', { type: 'button' });
      up.textContent = t.upload;
      up.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) return self.uploadFail();
        resizeImage(f, function (dataUrl) {
          if (!dataUrl) return self.uploadFail();
          self.uploadItem = {
            id: 'upload', isUpload: true,
            attire_image: dataUrl.split(',')[1],  // base64 본문 — 서버 2이미지 i2i 입력
            thumbnail: dataUrl,                    // 칩 미리보기
            attire_desc: null,
            labels: { ko: UI_TEXT.ko.uploadOn, ja: UI_TEXT.ja.uploadOn, en: UI_TEXT.en.uploadOn }
          };
          self.renderItems();
          self.select(self.uploadItem);
        });
      });
      foot.appendChild(up);
      foot.appendChild(fileInput);
    } else {
      var upOff = el('button', 'atp-upload', { type: 'button', disabled: 'disabled' });
      upOff.textContent = t.upload + ' · ' + t.soon;
      foot.appendChild(upOff);
    }
    var notice = el('span', 'atp-notice');
    notice.textContent = t.notice;
    foot.appendChild(notice);
    c.appendChild(foot);
    this.updateWarn();
    this.renderTieRow();
  };

  Picker.prototype.uploadFail = function () {
    if (!this.warnEl) return;
    this.warnEl.textContent = this.t.uploadBad;
    this.warnEl.style.display = '';
  };

  Picker.prototype.tieSupported = function (item) {
    if (!item || !item.tags || !item.attire_desc) return false;
    var cat = item.tags.category;
    return (cat === 'suit' || cat === 'shirt') && item.attire_desc.indexOf('no tie') !== -1;
  };

  Picker.prototype.renderTieRow = function () {
    if (!this.tieRowEl || !this.data || !this.data.tieOptions) return;
    var self = this, lang = this.lang;
    var supported = this.tieSupported(this.selection);
    this.tieRowEl.style.display = supported ? '' : 'none';
    if (!supported) return;

    this.tieRowEl.innerHTML = '';
    var label = el('span', 'atp-tie-label');
    label.textContent = this.t.tieLabel;
    this.tieRowEl.appendChild(label);

    var toggle = el('button', 'atp-tie-toggle', { type: 'button', 'data-on': this.tieOn ? 'true' : 'false', 'aria-label': this.t.tieLabel });
    var knob = el('span', 'atp-tie-knob');
    toggle.appendChild(knob);
    toggle.addEventListener('click', function () {
      self.tieOn = !self.tieOn;
      if (self.tieOn && !self.tieColor && self.data.tieOptions.length) {
        self.tieColor = self.data.tieOptions[0];
      }
      self.renderTieRow();
      self.updateTieBadge();
      var sel = self.getSelection();
      if (typeof self.opts.onChange === 'function') self.opts.onChange(sel);
      self.container.dispatchEvent(new CustomEvent('attire:change', { detail: sel, bubbles: true }));
    });
    this.tieRowEl.appendChild(toggle);

    if (this.tieOn) {
      var colors = el('div', 'atp-tie-colors');
      this.data.tieOptions.forEach(function (opt) {
        var btn = el('button', 'atp-tie-swatch' + (self.tieColor && self.tieColor.id === opt.id ? ' atp-on' : ''), { type: 'button' });
        var dot = el('span', 'atp-tie-dot');
        dot.style.background = opt.hex;
        btn.appendChild(dot);
        btn.appendChild(document.createTextNode(opt.labels[lang] || opt.labels.en || opt.id));
        btn.addEventListener('click', function () {
          self.tieColor = opt;
          self.renderTieRow();
          self.updateTieBadge();
          var sel = self.getSelection();
          if (typeof self.opts.onChange === 'function') self.opts.onChange(sel);
          self.container.dispatchEvent(new CustomEvent('attire:change', { detail: sel, bubbles: true }));
        });
        colors.appendChild(btn);
      });
      this.tieRowEl.appendChild(colors);
    }
  };

  Picker.prototype.updateTieBadge = function () {
    var old = this.container.querySelectorAll('.atp-badge-tie');
    old.forEach(function (b) { b.remove(); });
    if (!this.tieOn || !this.tieColor || !this.selection) return;
    var chip = this.container.querySelector('.atp-item[data-id="' + this.selection.id + '"]');
    if (!chip) return;
    var badge = el('span', 'atp-badge-tie');
    badge.style.background = this.tieColor.hex;
    chip.appendChild(badge);
  };

  Picker.prototype.renderItems = function () {
    var self = this;
    var row = this.itemsRow;
    row.innerHTML = '';
    var items = this.visibleItems().filter(function (it) {
      return self.category === 'all' || it.tags.category === self.category;
    });

    // 0번 고정: 기본값 (성인=단정한 정장 / 아기=지금 옷 그대로)
    var d = this.data.default_option;
    row.appendChild(this.itemChip({
      id: d.id, labels: this.defaultLabels(d), swatch: null, thumbnail: null, isDefault: true
    }, !this.selection));

    items.forEach(function (it) {
      row.appendChild(self.itemChip(it, self.selection && self.selection.id === it.id));
    });

    // 업로드된 내 옷 칩 — 항상 마지막
    if (this.uploadItem) {
      row.appendChild(this.itemChip(this.uploadItem, this.selection && this.selection.id === 'upload'));
    }

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
      chip.classList.add('atp-has-thumb'); // 상품컷/업로드 → 카드형 칩 (v1.5)
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

    // 밝은 상의 반려 주의 미니 배지
    if (this.warnLightTop && !it.isDefault && !it.isUpload && this.isLightTop(it)) {
      var badge = el('span', 'atp-badge-warn', { title: this.t.warnLight });
      badge.textContent = '⚠';
      chip.appendChild(badge);
    }

    var lab = el('span', 'atp-label');
    lab.textContent = (it.labels && (it.labels[lang] || it.labels.en)) || it.id;
    chip.appendChild(lab);

    chip.addEventListener('click', function () {
      if (it.isUpload) return self.select(self.uploadItem);
      self.select(it.isDefault ? null : self.data.items.find(function (x) { return x.id === it.id; }));
    });
    return chip;
  };

  window.AttirePicker = {
    mount: function (container, opts) { return new Picker(container, opts); },
    _loadPresets: loadPresets
  };
})();
