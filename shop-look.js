/* AFTR — 03 SHOP THE LOOK
   Runway carousel after the "Try the Look. — Runway" reference:
   12 bodies on a turning 3D ring (desktop) or a walking diagonal line
   (phones), a hero that takes the front place at rest, autoplay with a
   01–06 progress bar, drag / wheel / keys, a Drag/View cursor, a View-look
   popup with numbered pins, an "In this look" panel with size pickers
   (bottom sheet on phones) and a local styling bag.

   Models and product photos are the reference's placeholders; names,
   prices and copy are AFTR's (Figma). Swap LOOKS / PRODUCTS later. */
(function(){
'use strict';

/* ── data ─────────────────────────────────────────────────────── */
var IMG  = 'https://reel-ref-try-the-look.vercel.app/assets/';
var APP  = ['XS','S','M','L','XL'];
var WAIST= ['W28','W30','W32','W34','W36'];
var SHOE = ['US 7','US 8','US 9','US 10','US 11','US 12'];

var PRODUCTS = {
  crew:    { name:'Heavy Knit Crew',   price:180, img:'source-sweatshirt.webp',          h:581, opt:'Size',      sizes:APP },
  tee:     { name:'Reign Tee',         price:90,  img:'source-tshirt.webp',              h:563, opt:'Size',      sizes:APP },
  varsity: { name:'Varsity Hoodie',    price:210, img:'source-sweatshirt-plus.webp',     h:610, opt:'Size',      sizes:APP, tag:'New' },
  star:    { name:'Night Star Hoodie', price:210, img:'source-hoodie-black.webp',        h:536, opt:'Size',      sizes:APP, tag:'New' },
  loop:    { name:'Grey Loop Hoodie',  price:190, img:'source-hoodie.webp',              h:555, opt:'Size',      sizes:APP },
  r01:     { name:'Runner 01',         price:240, img:'source-tatum-5-orbit-copy.webp',  h:400, opt:'Shoe size', sizes:SHOE },
  c02:     { name:'Court 02',          price:240, img:'source-tatum-5-orbit.webp',       h:400, opt:'Shoe size', sizes:SHOE },
  c03:     { name:'Court 03',          price:220, img:'source-air-jordan-12-retro-copy.webp', h:400, opt:'Shoe size', sizes:SHOE }
};
/* bottoms have no product photo yet: the thumbnail is a crop of the model's legs */
var LOOKS = [
  { name:'Last Train',     model:1, pieces:['crew',    { key:'denim-1',   name:'Wide Leg Denim',    price:210 }, 'r01'] },
  { name:'Neon Laundry',   model:5, pieces:['tee',     { key:'denim-2',   name:'Washed Wide Denim', price:210 }, 'c02'] },
  { name:'Rooftop',        model:4, pieces:['varsity', { key:'trouser-3', name:'Wide Leg Trouser',  price:190 }, 'r01'] },
  { name:'Afterparty',     model:6, pieces:['star',    { key:'denim-4',   name:'Pale Wide Jeans',   price:210 }, 'c03'] },
  { name:'Blue Hour',      model:3, pieces:['crew',    { key:'denim-5',   name:'Grey Wide Jeans',   price:210 }, 'c02'] },
  { name:'Sunday Morning', model:2, pieces:['loop',    { key:'denim-6',   name:'Light Wash Denim',  price:210 }, 'c03'] }
];
var PINS = [[47,28],[48,62],[46,93]];          // top · bottoms · shoes, % of the figure box
var CROP = { size:'250% auto', pos:'50% 80%' }; // legs crop for bottoms thumbnails
var SAVE = 0.10;

function m640(n){ return IMG + 'model-' + n + '-640.webp'; }
function m1080(n){ return IMG + 'original-look-' + n + '.webp'; }
function money(n){ return '$' + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n))); }
function pad2(n){ return (n < 10 ? '0' : '') + n; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }

function piece(look, j){
  var p = look.pieces[j];
  if (typeof p === 'string'){
    var d = PRODUCTS[p];
    return { key:p, name:d.name, price:d.price, img:IMG + d.img, h:d.h, opt:d.opt, sizes:d.sizes, tag:d.tag || '' };
  }
  return { key:p.key, name:p.name, price:p.price, crop:m640(look.model), opt:'Waist', sizes:WAIST, tag:'' };
}
function bundle(look){
  var full = 0; for (var j = 0; j < look.pieces.length; j++) full += piece(look, j).price;
  return { full:full, deal:Math.round(full * (1 - SAVE) * 100) / 100 };
}
function thumbHTML(p, cls){
  if (p.crop) return '<span class="rw__crop ' + (cls || '') + '" style="background-image:url(' + p.crop + ');background-size:' + CROP.size + ';background-position:' + CROP.pos + '"></span>';
  return '<img class="' + (cls || '') + '" src="' + p.img + '" width="400" height="' + p.h + '" alt="" loading="lazy" decoding="async">';
}

/* ── icons ────────────────────────────────────────────────────── */
var SVG = {
  prev:  '<svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M25 7H1M7 1L1 7l6 6"/></svg>',
  next:  '<svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h24M19 1l6 6-6 6"/></svg>',
  play:  '<svg class="rw__i-play" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  pause: '<svg class="rw__i-pause" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"/></svg>',
  plus:  '<svg class="rw__i-plus" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>',
  check: '<svg class="rw__i-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5l5 5L19.5 7"/></svg>',
  spin:  '<svg class="rw__i-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 1-9 9"/></svg>',
  arrow: '<svg class="rw__i-arrow" width="22" height="12" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h24M19 1l6 6-6 6"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>'
};

/* ── markup ───────────────────────────────────────────────────── */
function figureHTML(look, extra, eager){
  var n = look.model;
  return '<span class="rw__shadow"></span>' +
    '<div class="rw__figure" style="--rw-ar:.5625"><div class="rw__art">' +
      '<img src="' + m640(n) + '" srcset="' + m640(n) + ' 640w, ' + m1080(n) + ' 1080w" sizes="(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px"' +
      ' width="1100" height="1956" alt="' + esc(look.name) + '" loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async" draggable="false" data-model-image>' +
      extra +
    '</div></div>';
}
function build(){
  var h = '';
  h += '<div class="rw__sticky"><div class="rw__grid">';

  /* left column */
  h += '<div class="rw__left">';
  h += '<div class="rw__head"><div class="rw__intro">' +
         '<h2 class="rw__title">Shop the look</h2>' +
         '<p class="rw__sub">Six looks, styled head to toe by our designers. Tap a pin to see every piece.</p>' +
       '</div><span class="rw__sr" aria-live="polite" aria-atomic="true" data-rw-live></span></div>';

  h += '<div class="rw__stage" data-rw-stage tabindex="0" role="region" aria-roledescription="carousel" aria-label="Shop the look — use arrow keys or swipe to change look">';
  h += '<div class="rw__actors" data-rw-actors>';
  LOOKS.forEach(function(look, i){
    h += '<div class="rw__model" data-rw-model data-index="' + i + '" aria-hidden="true">' +
         figureHTML(look, '<button class="rw__hit" type="button" data-rw-go="' + i + '" aria-label="Look ' + (i + 1) + ': ' + esc(look.name) + '" tabindex="-1"></button>', true) +
         '</div>';
  });
  h += '</div><div class="rw__heroes" data-rw-heroes>';
  LOOKS.forEach(function(look, i){
    var pins = '<div class="rw__pins">';
    for (var j = 0; j < look.pieces.length; j++){
      var p = piece(look, j), xy = PINS[j] || [50, 50];
      pins += '<button class="rw__pin" type="button" data-rw-pin="' + (j + 1) + '" data-tip="' + esc(p.name) + '" style="left:' + xy[0] + '%;top:' + xy[1] + '%;--pi:' + (j + 1) + '" aria-label="' + (j + 1) + ': ' + esc(p.name) + '" tabindex="-1"><span class="rw__pin-dot">' + (j + 1) + '</span></button>';
    }
    pins += '</div>';
    h += '<div class="rw__hero' + (i === 0 ? ' is-on' : '') + '" data-rw-hero data-index="' + i + '" data-name="' + esc(look.name) + '" data-probe="' + m640(look.model) + '" aria-hidden="' + (i === 0 ? 'false' : 'true') + '">' +
         '<div class="rw__morph">' +
         figureHTML(look, '<button class="rw__zoom" type="button" data-rw-zoom aria-label="View look: ' + esc(look.name) + '" tabindex="' + (i === 0 ? 0 : -1) + '"></button>' + pins, true) +
         '</div></div>';
  });
  h += '</div>';
  h += '<span class="rw__sweep" aria-hidden="true"></span>';
  h += '<span class="rw__cursor" data-rw-cursor aria-hidden="true"><span class="rw__cursor-in"><span class="rw__cursor-label rw__cursor-drag">Drag</span><span class="rw__cursor-label rw__cursor-view">View</span></span></span>';
  h += '<span class="rw__walk" aria-hidden="true"><span class="rw__walk-line"></span></span>';
  h += '</div>';

  h += '<div class="rw__controls">';
  h += '<button class="rw__icon" type="button" data-rw-prev aria-label="Previous look">' + SVG.prev + '</button>';
  h += '<div class="rw__ticks">';
  LOOKS.forEach(function(look, i){
    h += '<button class="rw__tick" type="button" data-rw-tick="' + i + '" aria-current="' + (i === 0) + '" aria-label="Look ' + (i + 1) + ': ' + esc(look.name) + '">' +
         '<span class="rw__tick-bar"></span><span class="rw__tick-label">' + pad2(i + 1) + '<span class="rw__tick-name">&nbsp;&nbsp;' + esc(look.name) + '</span></span></button>';
  });
  h += '</div>';
  h += '<button class="rw__icon rw__auto" type="button" data-rw-auto aria-pressed="false" aria-label="Autoplay">' + SVG.play + SVG.pause + '</button>';
  h += '<button class="rw__icon" type="button" data-rw-next aria-label="Next look">' + SVG.next + '</button>';
  h += '</div>';

  h += '<div class="rw__lb" data-rw-lb role="region" aria-label="View look" aria-hidden="true">' +
         '<div class="rw__lb-stage" data-rw-lb-stage></div>' +
         '<div class="rw__lb-top"><p class="rw__lb-cap"><span class="rw__lb-kicker rw__mono" data-rw-lb-kicker></span><span class="rw__lb-name" data-rw-lb-name></span></p>' +
         '<button class="rw__lb-close" type="button" data-rw-zoom-close aria-label="Close">' + SVG.close + '</button></div>' +
         '<p class="rw__lb-hint rw__mono">Tap a dot to shop the piece</p>' +
       '</div>';
  h += '</div>';

  /* panel */
  h += '<div class="rw__panel"><div class="rw__panel-inner">';
  h += '<div class="rw__panel-head"><p class="rw__panel-title rw__mono" data-rw-ptitle>In this look&nbsp;&nbsp;—&nbsp;&nbsp;01 ' + esc(LOOKS[0].name) + '</p><span class="rw__label rw__mono" data-rw-pieces>' + LOOKS[0].pieces.length + ' pieces</span>' +
       '<button class="rw__panel-close" type="button" data-rw-panel-close aria-label="Close look details">' + SVG.close + '</button></div>';
  LOOKS.forEach(function(look, i){
    var b = bundle(look);
    h += '<div class="rw__look-panel' + (i === 0 ? ' is-in' : '') + '" data-rw-panel="' + i + '"' + (i ? ' hidden' : '') + '>';
    h += '<div class="rw__mhead"><span class="rw__mhead-title">' + pad2(i + 1) + '&nbsp;&nbsp;' + esc(look.name) + '</span><span class="rw__label rw__mono">' + look.pieces.length + ' pieces</span></div>';
    h += '<ul class="rw__items" role="list">';
    for (var j = 0; j < look.pieces.length; j++){
      var p = piece(look, j), n = j + 1, pid = 'Picker-look' + i + '-' + n, mid = Math.floor(p.sizes.length / 2);
      h += '<li class="rw__item" data-rw-card="' + n + '" style="--i:' + n + '" data-title="' + esc(p.name) + '" data-key="' + p.key + '" data-price="' + p.price + '">';
      if (p.tag) h += '<span class="rw__tag"><span class="rw__tag-text">' + p.tag + '</span></span>';
      h += '<span class="rw__media" aria-hidden="true">' + thumbHTML(p) + '<span class="rw__num">' + n + '</span></span>';
      h += '<div class="rw__info"><span class="rw__type rw__mono">AFTR&nbsp;&nbsp;·&nbsp;&nbsp;' + pad2(n) + '</span><span class="rw__name">' + esc(p.name) + '</span><span class="rw__price">' + money(p.price) + '</span></div>';
      h += '<button class="rw__add" type="button" data-rw-add aria-expanded="false" aria-controls="' + pid + '" aria-label="Add to bag: ' + esc(p.name) + '">' + SVG.plus + SVG.check + SVG.spin + '</button>';
      h += '<div class="rw__picker" id="' + pid + '" data-rw-picker hidden>' +
             '<div class="rw__picker-head">' + thumbHTML(p, 'rw__picker-thumb') + '<div><div class="rw__picker-title">' + esc(p.name) + '</div><div class="rw__picker-price">' + money(p.price) + '</div></div>' +
             '<button class="rw__pick-close" type="button" data-rw-pick-close aria-label="Close">' + SVG.close + '</button></div>' +
             '<fieldset class="rw__opt"><legend class="rw__opt-name rw__mono">' + p.opt + '</legend><div class="rw__values">';
      p.sizes.forEach(function(s, k){
        h += '<label class="rw__pill"><input type="radio" name="' + pid + '-o" value="' + s + '"' + (k === mid ? ' checked' : '') + '><span class="rw__pill-label">' + s + '</span></label>';
      });
      h += '</div></fieldset><button class="rw__confirm" type="button" data-rw-confirm>Add to bag<span class="rw__sr"> — ' + esc(p.name) + '</span></button></div>';
      h += '</li>';
    }
    h += '</ul>';
    h += '<div class="rw__bundle"><p class="rw__msg" data-rw-msg role="status" aria-live="polite"></p>' +
         '<div class="rw__bundle-row"><div class="rw__bundle-copy"><span class="rw__bundle-title">Complete the look</span><span class="rw__label rw__mono">Bundle all ' + look.pieces.length + ' and save 10%</span></div>' +
         '<div class="rw__bundle-price"><s>' + money(b.full) + '</s><strong>' + money(b.deal) + '</strong></div></div>' +
         '<button class="rw__cta" type="button" data-rw-all><span class="rw__cta-add">Add full look to bag</span><span class="rw__cta-m">Add full look — ' + money(b.deal) + '</span><span class="rw__cta-done">Full look in your bag</span>' + SVG.arrow + SVG.spin + '</button>' +
         '</div>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '</div></div>';
  return h;
}

/* ── styling bag (local shortlist) ────────────────────────────── */
var Bag = (function(){
  var KEY = 'aftr-styling-bag-v1', items = [], dialog, toastEl, toastT;
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(raw)) items = raw.filter(function(e){
      return e && typeof e.key === 'string' && typeof e.name === 'string' && isFinite(e.price) && e.qty >= 1 && e.qty <= 20;
    }).slice(0, 50);
  } catch(e){}
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(items)); } catch(e){} }
  function count(){
    var n = items.reduce(function(s, e){ return s + e.qty; }, 0);
    [].forEach.call(document.querySelectorAll('[data-cart-count]'), function(el){ el.textContent = n; });
  }
  function toast(msg){
    if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 'bag-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('is-on'); }, 2500);
  }
  function add(list){
    list.forEach(function(it){
      var hit = items.find(function(e){ return e.key === it.key && e.size === it.size; });
      if (hit) hit.qty = Math.min(20, hit.qty + 1);
      else items.push({ key:it.key, name:it.name, size:it.size, price:it.price, img:it.img || '', crop:it.crop || '', qty:1 });
    });
    if (items.length > 50) items.length = 50;
    save(); count(); render();
    toast(list.length > 1 ? 'Look saved to your bag' : 'Piece saved to your bag');
  }
  function ensure(){
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'bag'; dialog.id = 'bag-dialog';
    dialog.innerHTML =
      '<div class="bag__head"><h2 class="bag__title">Your bag</h2><button class="bag__close" type="button" aria-label="Close bag">&times;</button></div>' +
      '<p class="bag__note">A styling shortlist. No payment or order is collected here.</p>' +
      '<div class="bag__items"></div><p class="bag__total"></p>' +
      '<button class="bag__export" type="button">Download shortlist</button>';
    document.body.appendChild(dialog);
    dialog.querySelector('.bag__close').addEventListener('click', function(){ dialog.close(); });
    dialog.addEventListener('click', function(e){
      var r = dialog.getBoundingClientRect();
      if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
      var rm = e.target.closest('[data-remove]');
      if (rm){ items.splice(+rm.dataset.remove, 1); save(); count(); render(); }
    });
    dialog.querySelector('.bag__export').addEventListener('click', function(){
      var lines = ['AFTR — STYLING SHORTLIST', 'Reference prices; no order or payment has been placed.', ''];
      items.forEach(function(e){ lines.push(e.name + ' · ' + e.size + ' · Quantity ' + e.qty + ' · ' + money(e.price * e.qty)); });
      var url = URL.createObjectURL(new Blob([lines.join('\n\n')], { type:'text/plain;charset=utf-8' }));
      var a = document.createElement('a'); a.href = url; a.download = 'aftr-shortlist.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    });
  }
  function render(){
    if (!dialog) return;
    var box = dialog.querySelector('.bag__items');
    if (!items.length){
      box.innerHTML = '<p class="bag__note">Your bag is empty. Choose a size beside a piece to save it.</p>';
    } else {
      box.innerHTML = items.map(function(e, i){
        var th = e.crop
          ? '<span class="bag__thumb rw__crop" style="background-image:url(' + e.crop + ');background-size:' + CROP.size + ';background-position:' + CROP.pos + '"></span>'
          : '<img class="bag__thumb" src="' + e.img + '" alt="' + esc(e.name) + '">';
        return '<div class="bag__row">' + th + '<div><h3>' + esc(e.name) + '</h3><p class="rw__mono" style="color:#8A8A8A">' + esc(e.size) + ' · Qty ' + e.qty + ' · ' + money(e.price * e.qty) + '</p></div>' +
               '<button class="bag__remove" type="button" data-remove="' + i + '" aria-label="Remove ' + esc(e.name) + '">&times;</button></div>';
      }).join('');
    }
    var total = items.reduce(function(s, e){ return s + e.price * e.qty; }, 0);
    dialog.querySelector('.bag__total').textContent = items.length ? 'Subtotal ' + money(total) : '';
    dialog.querySelector('.bag__export').disabled = !items.length;
  }
  function open(){ ensure(); render(); if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', ''); }
  document.addEventListener('click', function(e){ if (e.target.closest('[data-open-bag]')){ e.preventDefault(); open(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', count); else count();
  return { add:add, open:open };
})();

/* ── the element ──────────────────────────────────────────────── */
var N_LOOKS = LOOKS.length;
var K = 95, C = 2 * Math.sqrt(K), START = 1.15, TAU = Math.PI * 2;
function clamp(x, a, b){ return x < a ? a : x > b ? b : x; }

class LookRunway extends HTMLElement {
  connectedCallback(){
    if (this._ready) return;
    this._ready = true;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.innerHTML = build();
    this.classList.add('rw', 'rw--popup', 'rw--js');
    this.setup();
  }
  disconnectedCallback(){
    cancelAnimationFrame(this.raf); cancelAnimationFrame(this.craf);
    clearTimeout(this.timer);
    if (this.io) this.io.disconnect();
    if (this.ro) this.ro.disconnect();
    removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVis);
    if (this.host){ this.dockAll(); this.host.remove(); }
  }

  setup(){
    var self = this, q = function(s){ return self.querySelector(s); }, qa = function(s){ return [].slice.call(self.querySelectorAll(s)); };
    this.stage   = q('[data-rw-stage]');
    this.actors  = q('[data-rw-actors]');
    this.heroes  = qa('[data-rw-hero]');
    this.ticks   = qa('[data-rw-tick]');
    this.panels  = qa('[data-rw-panel]');
    this.live    = q('[data-rw-live]');
    this.piecesL = q('[data-rw-pieces]');
    this.ptitle  = q('[data-rw-ptitle]');
    this.lb      = q('[data-rw-lb]');
    this.lbStage = q('[data-rw-lb-stage]');
    this.cursor  = q('[data-rw-cursor]');
    this.controls= q('.rw__controls');
    this.panelEl = q('.rw__panel');
    this.open = 0; this.openT = 0; this.openV = 0;
    if (innerWidth >= 750) this.panelEl.setAttribute('aria-hidden', 'true');

    /* 12 bodies: clone the six so the ring is always full */
    var originals = qa('[data-rw-model]');
    this.N = N_LOOKS * Math.ceil(8 / N_LOOKS);
    for (var a = N_LOOKS; a < this.N; a++){
      var c = originals[a % N_LOOKS].cloneNode(true);
      c.setAttribute('data-rw-clone', '');
      c.querySelector('img').setAttribute('loading', 'lazy');
      this.actors.appendChild(c);
    }
    this.bodies = qa('[data-rw-model]').map(function(el, a){
      return { el:el, a:a, look:a % N_LOOKS, hit:el.querySelector('.rw__hit'), blur:-1, x:0, g:0, v:0, goal:0, trip:false, from:0 };
    });

    qa('[data-model-image]').forEach(decodeImg);
    this.detectFeet();

    this.index = -1; this.target = 0; this.vel = 0;
    this.start = this.reduced ? 0 : START;
    this.cur = -this.start;
    this.still = false; this.dragging = false; this.visible = false;
    this.playing = false; this.engaged = false; this.panelHover = false; this.zoomed = false;
    this.speed = +this.getAttribute('data-speed') || 5000;

    this.frame = this.frame.bind(this);
    this.measure(true);
    this.bodies.forEach(function(b){ b.x = b.g = self.wrapN(b.a - self.target) + self.start; b.goal = self.wrapN(b.a); });
    this.setIndex(0, true);

    this.onResize = function(){ clearTimeout(self.rt); self.rt = setTimeout(function(){ self.measure(); }, 120); };
    addEventListener('resize', this.onResize);
    if ('ResizeObserver' in window){
      this.ro = new ResizeObserver(function(){ if (!self.roQueued){ self.roQueued = true; requestAnimationFrame(function(){ self.roQueued = false; self.measure(); }); } });
      this.ro.observe(this.stage);
    }
    this.onVis = function(){ if (!document.hidden) self.kick(); self.restartBar(); };
    document.addEventListener('visibilitychange', this.onVis);

    this.io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (e.target === self){ self.visible = e.isIntersecting; if (self.visible) self.kick(); }
      });
    }, { threshold:0 });
    this.io.observe(this);
    if (this.reduced) this.classList.add('is-revealed');
    else {
      var rio = new IntersectionObserver(function(es){
        if (es.some(function(e){ return e.isIntersecting; })){
          rio.disconnect();
          requestAnimationFrame(function(){ requestAnimationFrame(function(){ self.classList.add('is-revealed'); self.kick(); }); });
        }
      }, { threshold:0, rootMargin:'0px 0px -22% 0px' });
      rio.observe(this);
    }

    this.bindPointer();
    this.bindCursor();
    this.bindPanel();
    this.addEventListener('click', this.onClick.bind(this), false);
    this.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){
        if (self.openSheet){ var btn = self.openSheet.closest('.rw__item') ; self.closeSheet(); if (btn) btn.querySelector('[data-rw-add]').focus(); }
        else if (self.zoomed) self.closeZoom();
        else if (self.openT) self.closePanel();
      }
    });
    this.stage.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); self.next(); }
      else if (e.key === 'ArrowLeft'){ e.preventDefault(); self.prev(); }
    });

    if (this.getAttribute('data-autoplay') === 'true' && !this.reduced) this.play(true);
    this.kick();
  }

  wrapN(k){ var N = this.N; return ((k % N) + N) % N; }

  /* ── measure ── */
  measure(first){
    var mob = innerWidth < 750, prevMode = this.mode;
    this.mob = mob;
    this.mode = mob ? 'classic' : 'ring';
    var frameH;
    if (!mob) frameH = Math.max(380, innerHeight);
    else {
      if (!this.vhL || innerWidth !== this.wL || Math.abs(innerHeight - this.vhL) >= 160){ this.vhL = innerHeight; this.wL = innerWidth; }
      frameH = this.vhL * 1.09;
    }
    this.style.setProperty('--rw-frame-h', Math.round(frameH) + 'px');
    var r = this.stage.getBoundingClientRect();
    this.Wfull = r.width; this.H = r.height;
    this.W = mob ? this.Wfull : this.Wfull - (this.open || 0) * (this.panelW || 0);
    this.panelW = mob ? 0 : (parseFloat(getComputedStyle(this).getPropertyValue('--rw-panel-w')) || 400);
    this.ctrlPad = this.ctrlPad || parseFloat(getComputedStyle(this.controls).paddingRight) || 40;
    if (mob && this.openT){ this.openT = 0; this.open = 0; this.classList.remove('rw--panel'); }
    var ring = this.mode === 'ring';
    this.fs = ring ? 1.08 : 1;
    this.style.setProperty('--rw-fs', this.fs);
    var modelH = ring ? Math.max(200, Math.round((this.H - 34 - 18) / 1.08)) : Math.max(200, Math.round(this.H - 22 - 18));
    this.modelH = modelH;
    this.stage.style.setProperty('--rw-model-h', modelH + 'px');
    this.hx = ring ? 0.5 * this.W : 0.3 * this.W;
    this.hy = ring ? 34 : 22;
    this.stage.style.setProperty('--rw-hx', this.hx + 'px');
    this.stage.style.setProperty('--rw-hy', this.hy + 'px');
    this.style.setProperty('--rw-ax', (this.W ? this.hx / this.W * 100 : 40).toFixed(2) + '%');
    this.bw = modelH * 0.5625;
    this.unit = ring ? Math.max(120, 0.3 * this.W) : Math.max(90, this.W * 0.32 * 1.6);
    if (!first && prevMode !== this.mode){
      var self = this;
      this.bodies.forEach(function(b){ b.x = b.g = b.goal = self.wrapN(b.a - self.target); b.v = 0; b.trip = false; });
      if (!mob) this.dockAll();
    }
    this.applyOpen();
    if (!first) this.renderAll();
    this.kick();
  }

  /* ── look panel: hidden until a model is clicked (desktop) ──
     The models use the full width; opening the panel slides it in from the
     right while the runway re-centres in the space that is left. */
  openPanel(){
    if (this.mob) return;
    this.openT = 1;
    this.classList.add('rw--panel');
    this.panelEl.setAttribute('aria-hidden', 'false');
    this.restartBar();
    this.kick();
  }
  closePanel(){
    if (!this.openT) return;
    this.openT = 0;
    this.classList.remove('rw--panel');
    this.panelEl.setAttribute('aria-hidden', 'true');
    if (this.panelEl.contains(document.activeElement)) this.stage.focus({ preventScroll:true });
    this.hot(0);
    this.restartBar();
    this.kick();
  }
  stepOpen(dt){
    var tgt = this.openT || 0;
    if (this.reduced || this.mob){ this.open = tgt; this.openV = 0; return false; }
    if (Math.abs((this.open || 0) - tgt) < 0.001 && Math.abs(this.openV || 0) < 0.001){ this.open = tgt; this.openV = 0; return false; }
    var k = 70, c = 2 * Math.sqrt(k), h = dt / 3;
    for (var i = 0; i < 3; i++){ var a = -k * (this.open - tgt) - c * this.openV; this.openV += a * h; this.open += this.openV * h; }
    return true;
  }
  applyOpen(){
    var o = this.mob ? 0 : (this.open || 0);
    this.W = this.Wfull - o * this.panelW;
    var ring = this.mode === 'ring';
    this.hx = ring ? 0.5 * this.W : 0.3 * this.W;
    this.stage.style.setProperty('--rw-hx', this.hx.toFixed(1) + 'px');
    this.unit = ring ? Math.max(120, 0.3 * this.W) : Math.max(90, this.W * 0.32 * 1.6);
    this.style.setProperty('--rw-open', o.toFixed(4));
    this.panelEl.style.visibility = this.mob || o > 0.002 ? '' : 'hidden';
    this.controls.style.paddingRight = this.mob ? '' : (this.ctrlPad + o * this.panelW).toFixed(1) + 'px';
  }

  /* ── loop ── */
  kick(){
    if (this.raf || !this.visible || document.hidden) return;
    this.lt = 0;
    this.raf = requestAnimationFrame(this.frame);
  }
  frame(t){
    this.raf = 0;
    var dt = this.lt ? Math.min(0.034, (t - this.lt) / 1000) : 1 / 60;
    this.lt = t;
    var opening = this.stepOpen(dt);
    if (opening || this._lastOpen !== this.open){ this._lastOpen = this.open; this.applyOpen(); }
    var moving = this.mode === 'ring' ? this.stepRing(dt) : this.stepClassic(dt);
    moving = moving || this.dragging || opening;
    this.setStill(!moving);
    this.renderAll();
    if (moving && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.frame);
  }
  stepRing(dt){
    if (this.reduced){ this.cur = this.target; this.vel = 0; return false; }
    if (Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005 && !this.dragging){ this.cur = this.target; this.vel = 0; return false; }
    var h = dt / 3;
    for (var i = 0; i < 3; i++){
      var acc = -K * (this.cur - this.target) - C * this.vel;
      this.vel += acc * h; this.cur += this.vel * h;
    }
    if (Math.abs(this.cur - this.target) <= 0.0005 && Math.abs(this.vel) <= 0.0005){ this.cur = this.target; this.vel = 0; return false; }
    return true;
  }
  stepClassic(dt){
    var moving = false, self = this, N = this.N;
    this.bodies.forEach(function(b){
      var goal = self.wrapN(b.a - self.target);
      if (Math.abs(goal - b.goal) > N / 2){ b.trip = true; b.from = b.x; b.g = goal; }
      b.goal = goal;
      if (self.reduced){ b.x = b.g = goal; b.v = 0; b.trip = false; return; }
      var tau = self.dragging ? 0.016 : b.trip ? 0.1 : 0.03 + 0.04 * Math.min(goal, 4);
      if (!b.trip) b.g += (goal - b.g) * (1 - Math.exp(-dt / tau));
      var h = dt / 3, tgt = b.trip ? goal : b.g;
      for (var i = 0; i < 3; i++){
        var acc = -K * (b.x - tgt) - C * b.v;
        b.v += acc * h; b.x += b.v * h;
      }
      if (b.trip && Math.abs(b.x - goal) < 0.02) b.trip = false;
      if (!b.trip && Math.abs(b.x - goal) < 0.0006 && Math.abs(b.v) < 0.0006 && Math.abs(b.g - goal) < 0.0006){ b.x = b.g = goal; b.v = 0; }
      else moving = true;
    });
    return moving;
  }

  setStill(v){
    if (v === this.still) return;
    this.still = v;
    this.classList.toggle('rw--still', v);
  }

  put(b, x, bottom, scale, op, blur, z){
    var w = this.bw;
    if (x + w * scale / 2 < -4 || x - w * scale / 2 > this.W + 4) op = 0;
    var s = b.el.style;
    s.transform = 'translate3d(' + x.toFixed(2) + 'px,' + (-bottom).toFixed(2) + 'px,0) translateX(-50%) scale(' + scale.toFixed(4) + ')';
    s.opacity = op.toFixed(3);
    s.zIndex = z;
    s.visibility = op < 0.01 ? 'hidden' : '';
    s.pointerEvents = op < 0.5 ? 'none' : '';
    var bl = Math.round(blur * 10) / 10;
    if (bl !== b.blur){ b.blur = bl; s.filter = bl > 0.05 ? 'blur(' + bl + 'px)' : ''; }
  }
  renderAll(){ if (this.mode === 'ring') this.renderRing(); else this.renderClassic(); }
  renderRing(){
    var W = this.W, H = this.H, cx = 0.5 * W, R = 0.62 * W, P = 1.65 * W, floor = H - 34, hor = 0.36 * H, step = TAU / this.N, fs = this.fs, self = this;
    this.bodies.forEach(function(b){
      var phi = ((b.a - self.cur) * step) % TAU;
      if (phi > Math.PI) phi -= TAU; else if (phi <= -Math.PI) phi += TAU;
      var z = R * (1 - Math.cos(phi)), persp = P / (P + z), sl = Math.abs(phi) / step;
      var scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
      var x = cx + R * Math.sin(phi) * persp;
      var feet = hor + (floor - hor) * persp;
      var blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      var op = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
      if (self.still && sl < 0.02) op = 0;
      self.put(b, x, H - feet, scale, op, blur, Math.round(scale * 1000));
    });
  }
  renderClassic(){
    var W = this.W, ax = 0.3, ay = 22, sx = 0.32, sy = 22, sr = 0.76, ex = 0.55, d = 4, self = this;
    this.bodies.forEach(function(b){
      var k = b.x, e = -1;
      if (b.trip){
        var span = Math.abs(b.goal - b.from) || 1, u = clamp(Math.abs(b.x - b.from) / span, 0, 1);
        if (b.goal > b.from){ if (u < 0.5) e = 2 * u * 1.4; else k = b.goal + 2 * (1 - u); }
        else { if (u < 0.5) k = b.from + 2 * u; else e = 2 * (1 - u) * 1.4; }
      } else if (k < 0) e = Math.min(-k, 1.4);
      if (e >= 0){
        self.put(b, W * (ax - ex * e), ay - 22 * e, 1 + 0.14 * e, Math.max(0, 1 - 1.05 * e), 4 * Math.min(e, 1), 1100);
      } else {
        var op = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
        if (self.still && Math.abs(k) < 0.02) op = 0;
        self.put(b, W * (ax + sx * k), ay + sy * k, Math.pow(sr, k), op, Math.min(0.9 * k, 3.2), 1000 - Math.round(10 * k));
      }
    });
  }

  /* ── navigation ── */
  next(){ this.moveTo(Math.round(this.target) + 1); }
  prev(){ this.moveTo(Math.round(this.target) - 1); }
  go(i){
    var d = ((i - this.index) % N_LOOKS + N_LOOKS) % N_LOOKS;
    if (d > N_LOOKS / 2) d -= N_LOOKS;
    this.moveTo(Math.round(this.target) + d);
  }
  moveTo(T){
    this.target = T;
    this.setStill(false);
    this.setIndex(((T % N_LOOKS) + N_LOOKS) % N_LOOKS);
    this.kick();
  }
  rank(b){
    if (this.mode === 'ring'){ var k = this.wrapN(b.a - Math.round(this.target)); return k > this.N / 2 ? k - this.N : k; }
    return this.wrapN(b.a - Math.round(this.target));
  }
  setIndex(i, silent){
    var self = this, lim = this.mode === 'ring' ? 2 : 3;
    this.bodies.forEach(function(b){
      var k = self.rank(b), on = k !== 0 && Math.abs(k) <= lim;
      b.hit.tabIndex = on ? 0 : -1;
      if (on) b.el.removeAttribute('aria-hidden'); else b.el.setAttribute('aria-hidden', 'true');
    });
    if (i === this.index) return;
    var old = this.index;
    this.index = i;
    if (this.zoomed) this.closeZoom(true);
    if (this.mob) this.closeSheet();
    this.style.setProperty('--rw-progress', ((i + 1) / N_LOOKS).toFixed(3));
    this.heroes.forEach(function(h, j){
      h.classList.toggle('is-on', j === i);
      h.classList.toggle('was', j === old);
      h.setAttribute('aria-hidden', j === i ? 'false' : 'true');
      h.querySelector('[data-rw-zoom]').tabIndex = j === i ? 0 : -1;
    });
    this.ticks.forEach(function(t, j){
      t.setAttribute('aria-current', String(j === i));
      t.classList.toggle('is-past', j < i);
    });
    this.panels.forEach(function(p, j){ p.hidden = j !== i; p.classList.remove('is-in'); });
    var look = LOOKS[i];
    this.piecesL.textContent = look.pieces.length + ' pieces';
    this.ptitle.innerHTML = 'In this look&nbsp;&nbsp;—&nbsp;&nbsp;' + pad2(i + 1) + ' ' + esc(look.name);
    if (!silent){
      void this.offsetWidth;
      this.panels[i].classList.add('is-in');
      [this.piecesL, this.ptitle].forEach(function(el){ el.classList.remove('is-swap'); void el.offsetWidth; el.classList.add('is-swap'); });
      if (!this.reduced){ this.stage.classList.remove('is-sweep'); void this.stage.offsetWidth; this.stage.classList.add('is-sweep'); }
      this.live.textContent = 'Look ' + (i + 1) + ': ' + look.name;
    } else this.panels[i].classList.add('is-in');
    this.hot(0);
    this.restartBar();
  }

  /* ── autoplay ── */
  play(on){
    this.playing = on;
    this.classList.toggle('is-playing', on);
    var b = this.querySelector('[data-rw-auto]');
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Pause autoplay' : 'Autoplay');
    this.restartBar();
  }
  restartBar(){
    clearTimeout(this.timer);
    var self = this;
    this.ticks.forEach(function(t){ t.classList.remove('is-run'); });
    if (!this.playing) return;
    void this.offsetWidth;
    if (this.ticks[this.index]) this.ticks[this.index].classList.add('is-run');
    this.timer = setTimeout(function(){
      if (self.playing && self.visible && !self.dragging && !document.hidden && !self.panelHover && !self.zoomed && !self.openT && !self.engaged) self.next();
      else self.restartBar();
    }, this.speed);
  }
  engage(){ this.engaged = true; if (this.playing) this.play(false); }

  /* ── pointer: drag / swipe / wheel ── */
  bindPointer(){
    var self = this, st = this.stage, d = null, acc = 0, lock = 0;
    st.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (self.zoomed) return;
      d = { x:e.clientX, y:e.clientY, t:self.target, id:e.pointerId, s:[{ x:e.clientX, t:performance.now() }], drag:false };
    });
    st.addEventListener('pointermove', function(e){
      if (!d || e.pointerId !== d.id) return;
      if (e.pointerType === 'mouse' && !(e.buttons & 1)){ end(e); return; }
      var dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.drag){
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)){ d = null; return; }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)){
          d.drag = true; self.dragging = true; self.classList.add('is-dragging');
          try { st.setPointerCapture(e.pointerId); } catch(x){}
        } else return;
      }
      d.s.push({ x:e.clientX, t:performance.now() }); if (d.s.length > 6) d.s.shift();
      self.target = d.t - dx / self.unit;
      self.setStill(false);
      self.kick();
    });
    function end(e){
      if (!d) return;
      var was = d; d = null;
      if (!was.drag) return;
      self.dragging = false; self.classList.remove('is-dragging');
      self.suppress = performance.now();
      var dx = e.clientX - was.x, f = was.s[0], l = was.s[was.s.length - 1];
      var vx = l.t > f.t ? (l.x - f.x) / (l.t - f.t) : 0, sign = -1, from = Math.round(was.t), i;
      if (self.mob){
        i = (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) ? from + sign * (dx > 0 ? 1 : -1) : from;
      } else {
        i = Math.round(self.target + sign * vx * 160 / self.unit);
        if (i === from && Math.abs(vx) > 0.3) i = from + sign * (vx > 0 ? 1 : -1);
        i = clamp(i, from - 2, from + 2);
      }
      self.moveTo(i);
    }
    st.addEventListener('pointerup', end);
    st.addEventListener('pointercancel', end);
    this.addEventListener('click', function(e){
      if (self.suppress && performance.now() - self.suppress < 60){ e.stopPropagation(); e.preventDefault(); }
    }, true);
    st.addEventListener('wheel', function(e){
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (performance.now() < lock) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 45){ if (acc > 0) self.next(); else self.prev(); acc = 0; lock = performance.now() + 520; }
    }, { passive:false });
  }

  /* ── custom cursor (fine pointers only) ── */
  bindCursor(){
    var self = this, cur = this.cursor;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches){ cur.remove(); this.cursor = null; return; }
    this.classList.add('rw--cursor');
    var x = 0, y = 0, tx = 0, ty = 0, on = false, k = this.reduced ? 1 : 0.18;
    function loop(){
      x += (tx - x) * k; y += (ty - y) * k;
      cur.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) self.craf = requestAnimationFrame(loop); else self.craf = 0;
    }
    this.stage.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = self.stage.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on){ on = true; x = tx; y = ty; cur.classList.add('is-on'); }
      var t = e.target;
      cur.classList.toggle('is-view', !self.dragging && !!t.closest('[data-rw-zoom]'));
      cur.classList.toggle('is-link', !self.dragging && !!t.closest('.rw__pin, .rw__hit'));
      if (!self.craf) self.craf = requestAnimationFrame(loop);
    });
    this.stage.addEventListener('pointerleave', function(){ on = false; cur.classList.remove('is-on', 'is-link', 'is-view'); });
  }

  /* ── panel: hover-link rows ↔ pins, hold autoplay ── */
  bindPanel(){
    var self = this, panel = this.querySelector('.rw__panel');
    panel.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse'){ self.panelHover = true; } });
    panel.addEventListener('pointerleave', function(e){ if (e.pointerType === 'mouse'){ self.panelHover = false; self.restartBar(); } });
    panel.addEventListener('pointerover', function(e){
      if (e.pointerType !== 'mouse') return;
      var card = e.target.closest('[data-rw-card]'); if (card) self.hot(+card.dataset.rwCard);
    });
    panel.addEventListener('pointerout', function(e){
      var card = e.target.closest('[data-rw-card]');
      if (card && !card.contains(e.relatedTarget)) self.hot(0);
    });
    panel.addEventListener('click', function(e){ if (e.target.closest('button, a, input, select, label')) self.engage(); });
    this.addEventListener('change', function(e){ if (e.target.matches('input[type=radio]')) self.optionChange(e.target); });
  }
  hot(n, reveal){
    [].forEach.call(this.querySelectorAll('.is-hot'), function(el){ el.classList.remove('is-hot'); });
    if (this.host) [].forEach.call(this.host.querySelectorAll('.is-hot'), function(el){ el.classList.remove('is-hot'); });
    if (!n) return;
    var scope = this.zoomed ? this.lbStage : this.heroes[this.index];
    var pin = scope && scope.querySelector('[data-rw-pin="' + n + '"]');
    if (pin) pin.classList.add('is-hot');
    var card = this.panels[this.index].querySelector('[data-rw-card="' + n + '"]');
    if (card){ card.classList.add('is-hot'); if (reveal) this.reveal(card); }
  }
  reveal(card){
    var list = card.closest('.rw__items'), beh = this.reduced ? 'auto' : 'smooth';
    if (list.scrollWidth > list.clientWidth + 2){
      list.scrollTo({ left:card.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft - 20, behavior:beh });
    } else if (list.scrollHeight > list.clientHeight + 2){
      list.scrollTo({ top:card.offsetTop - list.offsetTop - 12, behavior:beh });
    } else {
      var r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight - 140) scrollBy({ top:r.top - 0.3 * innerHeight, behavior:beh });
    }
  }

  /* ── click router ── */
  onClick(e){
    var t = e.target, el;
    if ((el = t.closest('[data-rw-pick-close]'))){ this.closePicker(el.closest('[data-rw-picker]')); return; }
    if (t.closest('[data-rw-zoom-close]')){ this.closeZoom(); return; }
    if (this.zoomed && (t === this.lbStage || t === this.lb || t.closest('.rw__lb') && !t.closest('.rw__lb-model, .rw__lb-top'))){ this.closeZoom(); return; }
    if (t.closest('[data-rw-panel-close]')){ this.closePanel(); return; }
    if (t.closest('[data-rw-zoom]')){ if (this.mob) this.openZoom(); else this.openPanel(); return; }
    if (t.closest('[data-rw-next]')){ this.next(); return; }
    if (t.closest('[data-rw-prev]')){ this.prev(); return; }
    if ((el = t.closest('[data-rw-tick]'))){ this.go(+el.dataset.rwTick); return; }
    if (t.closest('[data-rw-auto]')){ if (!this.playing) this.engaged = false; this.play(!this.playing); return; }
    if ((el = t.closest('[data-rw-pin]'))){ this.engage(); this.hot(+el.dataset.rwPin, true); return; }
    if ((el = t.closest('[data-rw-go]'))){
      var b = this.bodies.find(function(x){ return x.hit === el; }), k = this.rank(b);
      if (k !== 0 && Math.abs(k) < this.N / 2) this.moveTo(Math.round(this.target) + k);
      if (this.mob){ if (k === 0) this.openZoom(); }
      else this.openPanel();          // desktop: bring that look to the front and open its panel
      return;
    }
    if ((el = t.closest('[data-rw-confirm]'))){ this.confirm(el.closest('[data-rw-picker]')); return; }
    if ((el = t.closest('[data-rw-add]'))){ this.togglePicker(el.closest('.rw__item')); return; }
    if ((el = t.closest('[data-rw-all]'))){ this.addAll(el.closest('[data-rw-panel]')); return; }
  }

  /* ── pickers ── */
  pickerOf(card){ return card._picker || (card._picker = card.querySelector('[data-rw-picker]')); }
  togglePicker(card){
    if (card.classList.contains('is-added')) return;
    var pk = this.pickerOf(card);
    if (card.classList.contains('is-picking')){ this.closePicker(pk); return; }
    if (this.mob){ this.closeSheet(); this.openAsSheet(card, pk); }
    else { pk.hidden = false; this.reveal(card); }
    card.classList.add('is-picking');
    card.querySelector('[data-rw-add]').setAttribute('aria-expanded', 'true');
    var c = pk.querySelector('input:checked'); if (c) c.focus({ preventScroll:true });
  }
  closePicker(pk){
    if (!pk) return;
    var card = pk._card || pk.closest('.rw__item');
    if (pk === this.openSheet) this.closeSheet();
    pk.hidden = true;
    if (card){ card.classList.remove('is-picking'); var a = card.querySelector('[data-rw-add]'); if (a && !card.classList.contains('is-added')) a.setAttribute('aria-expanded', 'false'); }
  }
  ensureHost(){
    if (this.host) return this.host;
    var host = document.createElement('div'), self = this;
    host.className = 'rw-sheet-host';
    host.innerHTML = '<button class="rw__pick-scrim" type="button" data-rw-pick-close tabindex="-1" aria-hidden="true"></button>';
    host.addEventListener('click', function(e){
      var t = e.target;
      if (t.closest('[data-rw-pick-close]')){ self.closeSheet(); return; }
      var c = t.closest('[data-rw-confirm]'); if (c) self.confirm(c.closest('[data-rw-picker]'));
    });
    host.addEventListener('change', function(e){ self.engage(); if (e.target.matches('input[type=radio]')) self.optionChange(e.target); });
    host.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ var card = self.openSheet && self.openSheet._card; self.closeSheet(); if (card) card.querySelector('[data-rw-add]').focus(); } });
    document.body.appendChild(host);
    return (this.host = host);
  }
  openAsSheet(card, pk){
    var host = this.ensureHost();
    pk._card = card;
    host.appendChild(pk);
    pk.hidden = false;
    host.classList.add('is-open');
    this.classList.add('rw--picking');
    this.openSheet = pk;
  }
  closeSheet(){
    var pk = this.openSheet; if (!pk) return;
    this.openSheet = null;
    var card = pk._card;
    pk.hidden = true;
    if (card){ card.appendChild(pk); card.classList.remove('is-picking'); var a = card.querySelector('[data-rw-add]'); if (!card.classList.contains('is-added')) a.setAttribute('aria-expanded', 'false'); }
    if (this.host) this.host.classList.remove('is-open');
    this.classList.remove('rw--picking');
  }
  dockAll(){ this.closeSheet(); }
  optionChange(input){
    var pk = input.closest('[data-rw-picker]'), card = pk._card || pk.closest('.rw__item');
    if (card) card.dataset.touched = '1';
  }
  sizeOf(card){ var pk = this.pickerOf(card), c = pk.querySelector('input:checked'); return c ? c.value : ''; }
  itemOf(card){
    var look = LOOKS[+card.closest('[data-rw-panel]').dataset.rwPanel], p = piece(look, +card.dataset.rwCard - 1);
    return { key:p.key, name:p.name, price:p.price, img:p.img, crop:p.crop, size:this.sizeOf(card) };
  }
  confirm(pk){
    var card = pk._card || pk.closest('.rw__item'), self = this;
    if (!card || card.classList.contains('is-added') || card.classList.contains('is-loading')) return;
    card.dataset.touched = '1';
    this.engage();
    card.classList.add('is-loading');
    this.addCards([card], function(){ self.closePicker(pk); });
  }
  addCards(cards, done){
    var self = this, items = cards.map(function(c){ return self.itemOf(c); });
    setTimeout(function(){             // local bag: a short beat so the spinner reads
      try {
        Bag.add(items);
        cards.forEach(function(c){
          c.classList.remove('is-loading');
          c.classList.add('is-added');
          var a = c.querySelector('[data-rw-add]');
          a.setAttribute('aria-label', 'Added to bag: ' + c.dataset.title);
          a.removeAttribute('aria-expanded');
        });
        if (!self.reduced && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try { navigator.vibrate(12); } catch(e){}
        self.checkComplete(cards[0].closest('[data-rw-panel]'));
      } catch(err){
        cards.forEach(function(c){ c.classList.remove('is-loading'); });
        var m = cards[0].closest('[data-rw-panel]').querySelector('[data-rw-msg]'); if (m) m.textContent = 'Couldn’t add to bag. Please try again.';
      }
      if (done) done();
    }, this.reduced ? 0 : 450);
  }
  addAll(panel){
    if (panel.classList.contains('is-complete')) return;
    var cta = panel.querySelector('[data-rw-all]'), msg = panel.querySelector('[data-rw-msg]'), self = this;
    if (cta.classList.contains('is-loading')) return;
    msg.textContent = '';
    var cards = [].slice.call(panel.querySelectorAll('[data-rw-card]')).filter(function(c){ return !c.classList.contains('is-added'); });
    var ready = cards.filter(function(c){ return c.dataset.touched === '1' && self.sizeOf(c); });
    var pending = cards.filter(function(c){ return ready.indexOf(c) < 0; });
    if (ready.length){
      cta.classList.add('is-loading');
      ready.forEach(function(c){ c.classList.add('is-loading'); });
      this.addCards(ready, function(){
        cta.classList.remove('is-loading');
        ready.forEach(function(c){ var pk = self.pickerOf(c); if (!pk.hidden) self.closePicker(pk); });
      });
    }
    if (pending.length){
      msg.textContent = 'Pick a size for: ' + pending.map(function(c){ return c.dataset.title; }).join(', ');
      if (this.mob) this.togglePicker(pending[0]);
      else pending.forEach(function(c){ if (!c.classList.contains('is-picking')) self.togglePicker(c); });
      this.reveal(pending[0]);
    }
  }
  checkComplete(panel){
    var cards = panel.querySelectorAll('[data-rw-card]'), added = panel.querySelectorAll('[data-rw-card].is-added');
    if (cards.length >= 2 && added.length === cards.length){
      panel.classList.add('is-complete');
      panel.querySelector('[data-rw-msg]').textContent = '';
    }
  }

  /* ── View look popup (FLIP from the runway spot) ── */
  openZoom(){
    if (this.zoomed) return;
    var hero = this.heroes[this.index]; if (!hero) return;
    this.engage();
    this.hot(0);
    var src = hero.querySelector('.rw__figure');
    var wrap = document.createElement('div');
    wrap.className = 'rw__lb-model';
    var clone = hero.cloneNode(true);
    clone.classList.add('is-on'); clone.removeAttribute('data-rw-hero'); clone.setAttribute('aria-hidden', 'false');
    var z = clone.querySelector('[data-rw-zoom]'); if (z) z.remove();
    [].forEach.call(clone.querySelectorAll('[data-rw-pin]'), function(p){ p.tabIndex = 0; });
    [].forEach.call(clone.querySelectorAll('img'), function(im){ im.loading = 'eager'; im.classList.add('is-decoded'); });
    wrap.appendChild(clone);
    this.lbStage.innerHTML = '';
    this.lbStage.appendChild(wrap);
    var sr = this.lbStage.getBoundingClientRect();
    var h = Math.max(160, Math.min(sr.height, sr.width / 0.5625));
    wrap.style.setProperty('--rw-model-h', h + 'px');
    [].forEach.call(clone.querySelectorAll('img'), function(im){ im.sizes = Math.round(h * 0.5625) + 'px'; });
    this.querySelector('[data-rw-lb-kicker]').textContent = 'Look ' + pad2(this.index + 1);
    this.querySelector('[data-rw-lb-name]').textContent = LOOKS[this.index].name;
    this.zoomed = true;
    this.classList.add('rw--zoom');
    this.lb.setAttribute('aria-hidden', 'false');
    if (!this.reduced){
      var a = src.getBoundingClientRect(), b = clone.querySelector('.rw__figure').getBoundingClientRect();
      wrap.style.transformOrigin = '0 100%';
      wrap.style.transition = 'none';
      wrap.style.transform = 'translate3d(' + (a.left - b.left) + 'px,' + (a.bottom - b.bottom) + 'px,0) scale(' + (a.height / b.height) + ')';
      this._at = wrap.style.transform;
      void wrap.offsetWidth;
      wrap.style.transition = '';
      wrap.style.transform = '';
    }
    this.querySelector('[data-rw-zoom-close]').focus({ preventScroll:true });
  }
  closeZoom(quick){
    if (!this.zoomed) return;
    var wrap = this.lbStage.querySelector('.rw__lb-model'), self = this, inside = this.lb.contains(document.activeElement);
    if (wrap && this._at && !this.reduced && !quick) wrap.style.transform = this._at;
    this.zoomed = false;
    this.classList.remove('rw--zoom');
    this.lb.setAttribute('aria-hidden', 'true');
    clearTimeout(this.lbT);
    this.lbT = setTimeout(function(){ if (!self.zoomed) self.lbStage.innerHTML = ''; }, quick ? 0 : 950);
    if (inside) this.stage.focus({ preventScroll:true });
    this.restartBar();
  }

  /* ── feet detection: drop each figure so the soles meet the floor ── */
  detectFeet(){
    var self = this;
    LOOKS.forEach(function(look, i){
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function(){
        try {
          var w = 48, h = Math.max(1, Math.round(48 * img.naturalHeight / img.naturalWidth));
          var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          var cx = cv.getContext('2d', { willReadFrequently:true }); cx.drawImage(img, 0, 0, w, h);
          var data = cx.getImageData(0, 0, w, h).data, last = -1;
          for (var y = h - 1; y >= 0 && last < 0; y--) for (var x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 40){ last = y; break; }
          if (last < 0) return;
          var foot = clamp((h - 1 - last) / h, 0, 0.4).toFixed(4);
          self.heroes[i].style.setProperty('--rw-foot', foot);
          self.bodies.forEach(function(b){ if (b.look === i) b.el.style.setProperty('--rw-foot', foot); });
        } catch(e){}
      };
      img.src = m640(look.model);
    });
  }
}

function decodeImg(img){
  function ok(){ img.classList.add('is-decoded'); }
  if (img.decode) img.decode().then(ok, function(){ if (img.naturalWidth) ok(); else img.addEventListener('load', ok, { once:true }); });
  else if (img.complete) ok(); else img.addEventListener('load', ok, { once:true });
}

customElements.define('look-runway', LookRunway);
})();
