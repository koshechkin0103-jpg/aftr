/* AFTR — 03 SHOP THE LOOK, "the reel".
   Six looks are frames on a strip of film. Drag the strip, scroll it
   sideways, use the arrow keys, click a frame or a ruler tick to pull a
   frame into the gate. The frame in the gate is in colour, with crop
   marks and crosshairs on each piece; the credits list the pieces, with
   size pickers and "add the whole scene". Autoplay runs the reel at 5 s
   per scene, with a running timecode.

   Models and product data are placeholders: edit LOOKS / PRODUCTS. */
(function(){
'use strict';
var sec = document.querySelector('[data-reel]');
if (!sec) return;
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── data ─────────────────────────────────────────────────────── */
var IMG  = 'https://reel-ref-try-the-look.vercel.app/assets/';
var APP  = ['XS','S','M','L','XL'];
var WAIST= ['W28','W30','W32','W34','W36'];
var SHOE = ['US 7','US 8','US 9','US 10','US 11','US 12'];
var PRODUCTS = {
  crew:    { name:'Heavy Knit Crew',   price:180, img:'source-sweatshirt.webp',               sizes:APP },
  tee:     { name:'Reign Tee',         price:90,  img:'source-tshirt.webp',                   sizes:APP },
  varsity: { name:'Varsity Hoodie',    price:210, img:'source-sweatshirt-plus.webp',          sizes:APP },
  star:    { name:'Night Star Hoodie', price:210, img:'source-hoodie-black.webp',             sizes:APP },
  loop:    { name:'Grey Loop Hoodie',  price:190, img:'source-hoodie.webp',                   sizes:APP },
  r01:     { name:'Runner 01',         price:240, img:'source-tatum-5-orbit-copy.webp',       sizes:SHOE },
  c02:     { name:'Court 02',          price:240, img:'source-tatum-5-orbit.webp',            sizes:SHOE },
  c03:     { name:'Court 03',          price:220, img:'source-air-jordan-12-retro-copy.webp', sizes:SHOE }
};
var LOOKS = [
  { name:'Last Train',     model:1, pieces:['crew',    { key:'denim-1',   name:'Wide Leg Denim',    price:210 }, 'r01'] },
  { name:'Neon Laundry',   model:5, pieces:['tee',     { key:'denim-2',   name:'Washed Wide Denim', price:210 }, 'c02'] },
  { name:'Rooftop',        model:4, pieces:['varsity', { key:'trouser-3', name:'Wide Leg Trouser',  price:190 }, 'r01'] },
  { name:'Afterparty',     model:6, pieces:['star',    { key:'denim-4',   name:'Pale Wide Jeans',   price:210 }, 'c03'] },
  { name:'Blue Hour',      model:3, pieces:['crew',    { key:'denim-5',   name:'Grey Wide Jeans',   price:210 }, 'c02'] },
  { name:'Sunday Morning', model:2, pieces:['loop',    { key:'denim-6',   name:'Light Wash Denim',  price:210 }, 'c03'] }
];
var ROLES = ['Top', 'Bottoms', 'Shoes'];
var MARKS = [[47,28],[48,62],[46,93]];    // crosshairs: % of the figure box
var SCENE_S = 5;                         // seconds per scene (timecode + autoplay)
var N = LOOKS.length;

function m640(n){ return IMG + 'model-' + n + '-640.webp'; }
function m1080(n){ return IMG + 'original-look-' + n + '.webp'; }
function pad2(n){ return (n < 10 ? '0' : '') + n; }
function money(n){ return '$' + (Math.round(n * 100) % 100 ? n.toFixed(2) : String(Math.round(n))); }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
function piece(look, j){
  var p = look.pieces[j];
  if (typeof p === 'string'){ var d = PRODUCTS[p]; return { key:p, name:d.name, price:d.price, img:IMG + d.img, sizes:d.sizes }; }
  return { key:p.key, name:p.name, price:p.price, crop:m640(look.model), sizes:WAIST };
}
function totals(look){
  var f = 0; for (var j = 0; j < look.pieces.length; j++) f += piece(look, j).price;
  return { full:f, deal:Math.round(f * 0.9 * 100) / 100 };
}
function tc(sec){                      // seconds → HH:MM:SS:FF (24 fps)
  var fr = Math.floor(sec * 24), f = fr % 24, s = Math.floor(fr / 24);
  return '00:' + pad2(Math.floor(s / 60) % 60) + ':' + pad2(s % 60) + ':' + pad2(f);
}

/* ── markup ───────────────────────────────────────────────────── */
var I = {
  play:'<svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  pause:'<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"/></svg>'
};
var h = '';
h += '<div class="reel__left">';
h += '<div class="reel__head reel-in"><div>' +
       '<p class="label reel__eyebrow">[ Reel 01 — six looks ]</p>' +
       '<h2 class="h2 reel__title">Shop the look</h2>' +
       '<p class="reel__sub">Six looks, styled head to toe by our designers. Pull a frame into the gate — the credits list every piece.</p>' +
     '</div><div class="reel__tc"><span class="label reel__rec">Timecode</span><span class="reel__tc-val" data-tc>00:00:00:00</span></div></div>';
h += '<div class="reel__strip reel-in" data-strip tabindex="0" role="region" aria-roledescription="carousel" aria-label="Shop the look — drag the film or use the arrow keys">';
h += '<div class="reel__track" data-track>';
h += '<div class="reel__frame reel__frame--leader" aria-hidden="true"><div class="reel__shot"><span class="reel__count"><span class="reel__sweep" data-sweep></span><span style="position:relative">3</span></span><span class="label reel__leader-l">AFTR — Reel 01</span></div>' +
     '<span class="reel__edge">AFTR 5219 ▸ Leader</span></div>';
LOOKS.forEach(function(look, i){
  var marks = '';
  look.pieces.forEach(function(_, j){
    var p = piece(look, j), xy = MARKS[j];
    marks += '<button class="reel__x" type="button" data-x="' + (j + 1) + '" style="left:' + xy[0] + '%;top:' + xy[1] + '%;--i:' + j + '" aria-label="' + pad2(j + 1) + ': ' + esc(p.name) + '" tabindex="-1">' +
             '<span class="reel__x-ring"></span><span class="reel__x-tip">' + pad2(j + 1) + ' — ' + esc(p.name) + '</span></button>';
  });
  h += '<figure class="reel__frame" data-frame="' + i + '">' +
         '<div class="reel__shot"><span class="reel__shadow"></span>' +
           '<div class="reel__fig"><img src="' + m640(look.model) + '" srcset="' + m640(look.model) + ' 640w, ' + m1080(look.model) + ' 1080w" sizes="(min-width: 768px) 280px, 64vw" alt="Look ' + (i + 1) + ': ' + esc(look.name) + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '" decoding="async" draggable="false">' + marks + '</div>' +
           '<span class="reel__marks"></span><span class="label reel__now">● ' + pad2(i + 1) + ' / Now showing</span>' +
         '</div>' +
         '<span class="reel__edge">AFTR 5219 ▸ ' + pad2(i + 1) + 'A</span>' +
         '<figcaption class="reel__cap"><span>' + pad2(i + 1) + 'A ▸ ' + esc(look.name) + '</span><span>' + tc(i * SCENE_S) + '</span></figcaption>' +
       '</figure>';
});
h += '<div class="reel__frame reel__frame--end" aria-hidden="true"><div class="reel__shot"><span class="reel__end">The end</span></div><span class="reel__edge">AFTR 5219 ▸ Tail</span></div>';
h += '</div></div>';
h += '<div class="reel__ruler reel-in"><button class="reel__play label" type="button" data-play aria-pressed="false">' + I.play + I.pause + '<span class="reel__play-l" data-play-l>Play reel</span></button><div class="reel__line" data-line>';
LOOKS.forEach(function(look, i){
  h += '<button class="reel__tick label" type="button" data-tick="' + i + '" style="left:' + ((i + .5) / N * 100) + '%" aria-current="' + (i === 0) + '" aria-label="Scene ' + (i + 1) + ': ' + esc(look.name) + '"><span>' + pad2(i + 1) + '<span class="reel__tick-name">&nbsp;&nbsp;' + esc(look.name) + '</span></span></button>';
});
h += '<span class="reel__head-pos" data-playhead></span></div><span class="label reel__count-l" data-count>01 / ' + pad2(N) + '</span></div>';
h += '</div>';

h += '<aside class="reel__credits reel-in" aria-label="Credits — pieces in this look">';
LOOKS.forEach(function(look, i){
  var t = totals(look);
  h += '<div class="reel__cr' + (i === 0 ? ' is-in' : '') + '" data-cr="' + i + '"' + (i ? ' hidden' : '') + '>' +
       '<p class="label reel__cr-k">Credits — Scene ' + pad2(i + 1) + '</p>' +
       '<h3 class="reel__cr-t">' + esc(look.name) + '</h3><ol class="reel__rows">';
  look.pieces.forEach(function(_, j){
    var p = piece(look, j), n = j + 1, pid = 'pick-' + i + '-' + n, mid = Math.floor(p.sizes.length / 2);
    h += '<li class="reel__row" data-row="' + n + '" style="--i:' + n + '">' +
           '<button class="reel__row-btn" type="button" data-rowbtn aria-expanded="false" aria-controls="' + pid + '">' +
             '<span class="label reel__role">' + ROLES[j] + ' — ' + pad2(n) + '</span>' +
             '<span class="reel__name">' + esc(p.name) + '</span><span class="reel__dots" aria-hidden="true"></span><span class="reel__price">' + money(p.price) + '</span>' +
           '</button>' +
           '<div class="reel__pick" id="' + pid + '" hidden><div class="reel__sizes" role="radiogroup" aria-label="Size">';
    p.sizes.forEach(function(s, k){
      h += '<label class="reel__pill"><input type="radio" name="' + pid + '" value="' + s + '"' + (k === mid ? ' checked' : '') + '><span>' + s + '</span></label>';
    });
    h += '</div><button class="reel__add" type="button" data-add>Add to bag</button></div></li>';
  });
  h += '</ol><div class="reel__total"><span class="label">Full scene · save 10%</span><span><s>' + money(t.full) + '</s><strong>' + money(t.deal) + '</strong></span></div>' +
       '<button class="reel__all" type="button" data-all><span data-all-l>Add the whole scene to bag</span><span aria-hidden="true">&rarr;</span></button>' +
       '<p class="label reel__msg" role="status" aria-live="polite" data-msg></p></div>';
});
h += '</aside>';
sec.innerHTML = h;

/* ── styling bag (local shortlist, shared with the nav "Bag (0)") ── */
var Bag = (function(){
  var KEY = 'aftr-styling-bag-v1', items = [], dialog, toastEl, toastT;
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(raw)) items = raw.filter(function(e){ return e && typeof e.key === 'string' && typeof e.name === 'string' && isFinite(e.price) && e.qty >= 1 && e.qty <= 20; }).slice(0, 50);
  } catch(e){}
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(items)); } catch(e){} }
  function count(){ var n = items.reduce(function(s, e){ return s + e.qty; }, 0); [].forEach.call(document.querySelectorAll('[data-cart-count]'), function(el){ el.textContent = n; }); }
  function toast(msg){
    if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 'bag-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('is-on'); }, 2500);
  }
  function add(list){
    list.forEach(function(it){
      var hit = items.find(function(e){ return e.key === it.key && e.size === it.size; });
      if (hit) hit.qty = Math.min(20, hit.qty + 1);
      else items.push({ key:it.key, name:it.name, size:it.size, price:it.price, img:it.img || '', crop:it.crop || '', qty:1 });
    });
    save(); count(); render();
    toast(list.length > 1 ? 'Scene saved to your bag' : 'Piece saved to your bag');
  }
  function ensure(){
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.className = 'bag';
    dialog.innerHTML = '<div class="bag__head"><h2 class="bag__title">Your bag</h2><button class="bag__close" type="button" aria-label="Close bag">&times;</button></div>' +
      '<p class="bag__note">A styling shortlist. No payment or order is collected here.</p><div class="bag__items"></div><p class="bag__total"></p>';
    document.body.appendChild(dialog);
    dialog.querySelector('.bag__close').addEventListener('click', function(){ dialog.close(); });
    dialog.addEventListener('click', function(e){
      if (e.target === dialog) dialog.close();
      var rm = e.target.closest('[data-remove]'); if (rm){ items.splice(+rm.dataset.remove, 1); save(); count(); render(); }
    });
  }
  function render(){
    if (!dialog) return;
    var box = dialog.querySelector('.bag__items');
    box.innerHTML = items.length ? items.map(function(e, i){
      var th = e.crop ? '<span class="bag__thumb" style="background:url(' + e.crop + ') 50% 80%/250% auto no-repeat"></span>' : '<img class="bag__thumb" src="' + e.img + '" alt="">';
      return '<div class="bag__row">' + th + '<div><h3>' + esc(e.name) + '</h3><p class="label" style="color:#8A8A8A">' + esc(e.size) + ' · Qty ' + e.qty + ' · ' + money(e.price * e.qty) + '</p></div>' +
             '<button class="bag__remove" type="button" data-remove="' + i + '" aria-label="Remove ' + esc(e.name) + '">&times;</button></div>';
    }).join('') : '<p class="bag__note">Your bag is empty. Pick a size in the credits to save a piece.</p>';
    var total = items.reduce(function(s, e){ return s + e.price * e.qty; }, 0);
    dialog.querySelector('.bag__total').textContent = items.length ? 'Subtotal ' + money(total) : '';
  }
  document.addEventListener('click', function(e){ if (e.target.closest('[data-open-bag]')){ e.preventDefault(); ensure(); render(); dialog.showModal ? dialog.showModal() : dialog.setAttribute('open', ''); } });
  count();
  return { add:add };
})();

/* ── refs + state ─────────────────────────────────────────────── */
var strip = sec.querySelector('[data-strip]'), track = sec.querySelector('[data-track]');
var frames = [].slice.call(sec.querySelectorAll('[data-frame]'));
var ticks = [].slice.call(sec.querySelectorAll('[data-tick]'));
var crs = [].slice.call(sec.querySelectorAll('[data-cr]'));
var tcEl = sec.querySelector('[data-tc]'), countEl = sec.querySelector('[data-count]');
var playhead = sec.querySelector('[data-playhead]'), sweep = sec.querySelector('[data-sweep]');
var playBtn = sec.querySelector('[data-play]'), playL = sec.querySelector('[data-play-l]');

var index = 0, target = 0, cur = -0.6, vel = 0;        // cur starts a touch early: the reel threads in
var step = 1, base = 0, stripW = 0;
var playing = false, engaged = false, prog = 0, visible = false, dragging = false;
var raf = 0, lastT = 0, clock = 0;

function measure(){
  var f = frames[0], cs = getComputedStyle(track);
  var gap = parseFloat(cs.columnGap) || 18;
  step = f.offsetWidth + gap;
  base = parseFloat(cs.paddingLeft) + step + f.offsetWidth / 2;   // leader comes first
  stripW = strip.clientWidth;
  render();
}
function render(){
  track.style.setProperty('--x', (stripW / 2 - (base + cur * step)).toFixed(2) + 'px');
  playhead.style.setProperty('--ph', ((clampF(cur, 0, N - 1) + .5 + (playing ? prog : 0) * .999) / N * 100).toFixed(3) + '%');
}
function clampF(x, a, b){ return x < a ? a : x > b ? b : x; }

function setIndex(i, silent){
  i = clampF(Math.round(i), 0, N - 1);
  target = i;
  if (i === index && !silent){ kick(); return; }
  index = i;
  frames.forEach(function(f, j){ f.classList.toggle('is-on', j === i); f.querySelectorAll('[data-x]').forEach(function(x){ x.tabIndex = j === i ? 0 : -1; }); });
  ticks.forEach(function(t, j){ t.setAttribute('aria-current', String(j === i)); });
  crs.forEach(function(c, j){ c.hidden = j !== i; c.classList.remove('is-in'); });
  void sec.offsetWidth;
  crs[i].classList.add('is-in');
  countEl.textContent = pad2(i + 1) + ' / ' + pad2(N);
  clock = i * SCENE_S;
  prog = 0;
  hot(0);
  kick();
}

/* ── loop: spring the strip, run the timecode and autoplay ────── */
function kick(){ if (!raf && visible){ lastT = 0; raf = requestAnimationFrame(frame); } }
function frame(t){
  raf = 0;
  var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60; lastT = t;
  var moving = false;
  if (!dragging){
    if (reduced){ cur = target; vel = 0; }
    else {
      var K = 120, C = 2 * Math.sqrt(K), hh = dt / 3;
      for (var k = 0; k < 3; k++){ var a = -K * (cur - target) - C * vel; vel += a * hh; cur += vel * hh; }
      if (Math.abs(cur - target) < 0.0005 && Math.abs(vel) < 0.0005){ cur = target; vel = 0; }
      else moving = true;
    }
  } else moving = true;

  if (playing && !document.hidden){
    clock += dt; prog += dt / SCENE_S;
    if (prog >= 1){ prog = 0; setIndex(index + 1 >= N ? 0 : index + 1); }
    moving = true;
  }
  tcEl.textContent = tc(clock);
  sweep.style.setProperty('--sweep', ((clock % 1) * 360).toFixed(0) + 'deg');
  render();
  if (moving && visible) raf = requestAnimationFrame(frame);
}

function play(on){
  playing = on;
  sec.classList.toggle('is-playing', on);
  playBtn.setAttribute('aria-pressed', String(on));
  playL.textContent = on ? 'Pause reel' : 'Play reel';
  kick();
}
function engage(){ engaged = true; if (playing) play(false); }

/* ── input: drag, wheel, keys, clicks ─────────────────────────── */
var d = null, wheelAcc = 0, wheelLock = 0, suppress = 0;
strip.addEventListener('pointerdown', function(e){
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  d = { x:e.clientX, y:e.clientY, c:cur, id:e.pointerId, s:[{ x:e.clientX, t:performance.now() }], drag:false };
});
strip.addEventListener('pointermove', function(e){
  if (!d || e.pointerId !== d.id) return;
  var dx = e.clientX - d.x, dy = e.clientY - d.y;
  if (!d.drag){
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)){ d = null; return; }
    if (Math.abs(dx) > 8){ d.drag = true; dragging = true; sec.classList.add('is-dragging'); if (playing) play(false); try { strip.setPointerCapture(e.pointerId); } catch(x){} }
    else return;
  }
  d.s.push({ x:e.clientX, t:performance.now() }); if (d.s.length > 6) d.s.shift();
  cur = clampF(d.c - dx / step, -0.45, N - 0.55);
  kick();
});
function endDrag(e){
  if (!d) return;
  var was = d; d = null;
  if (!was.drag) return;
  dragging = false; sec.classList.remove('is-dragging'); suppress = performance.now();
  var f = was.s[0], l = was.s[was.s.length - 1], vx = l.t > f.t ? (l.x - f.x) / (l.t - f.t) : 0;
  setIndex(Math.round(cur - vx * 140 / step));
}
strip.addEventListener('pointerup', endDrag);
strip.addEventListener('pointercancel', endDrag);
strip.addEventListener('wheel', function(e){
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (performance.now() < wheelLock) return;
  wheelAcc += e.deltaX;
  if (Math.abs(wheelAcc) > 40){ setIndex(index + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; wheelLock = performance.now() + 420; }
}, { passive:false });
strip.addEventListener('keydown', function(e){
  if (e.key === 'ArrowRight'){ e.preventDefault(); setIndex(index + 1); }
  else if (e.key === 'ArrowLeft'){ e.preventDefault(); setIndex(index - 1); }
});

sec.addEventListener('click', function(e){
  if (suppress && performance.now() - suppress < 80) return;
  var t = e.target, el;
  if ((el = t.closest('[data-x]'))){ engage(); setRow(+el.dataset.x, true); return; }
  if ((el = t.closest('[data-frame]'))){ setIndex(+el.dataset.frame); return; }
  if ((el = t.closest('[data-tick]'))){ setIndex(+el.dataset.tick); return; }
  if (t.closest('[data-play]')){ if (!playing) engaged = false; play(!playing); return; }
  if ((el = t.closest('[data-rowbtn]'))){ engage(); toggleRow(el.closest('[data-row]')); return; }
  if ((el = t.closest('[data-add]'))){ engage(); addRows([el.closest('[data-row]')]); return; }
  if ((el = t.closest('[data-all]'))){ engage(); addAll(el.closest('[data-cr]')); return; }
});
sec.addEventListener('change', function(e){ var r = e.target.closest('[data-row]'); if (r){ r.dataset.touched = '1'; engage(); } });

/* rows ↔ crosshairs */
function hot(n){
  sec.querySelectorAll('.is-hot').forEach(function(x){ x.classList.remove('is-hot'); });
  if (!n) return;
  var x = frames[index].querySelector('[data-x="' + n + '"]'); if (x) x.classList.add('is-hot');
  var r = crs[index].querySelector('[data-row="' + n + '"]'); if (r) r.classList.add('is-hot');
}
function setRow(n, open){
  hot(n);
  var r = crs[index].querySelector('[data-row="' + n + '"]');
  if (open && r && r.querySelector('.reel__pick').hidden) toggleRow(r);
  if (r) r.scrollIntoView({ block:'nearest', behavior:reduced ? 'auto' : 'smooth' });
}
sec.addEventListener('pointerover', function(e){
  if (e.pointerType !== 'mouse') return;
  var r = e.target.closest('[data-row]'), x = e.target.closest('[data-x]');
  if (r) hot(+r.dataset.row); else if (x) hot(+x.dataset.x);
});
sec.addEventListener('pointerout', function(e){
  var el = e.target.closest('[data-row], [data-x]');
  if (el && !el.contains(e.relatedTarget)) hot(0);
});

/* ── credits: pick a size, add a piece, add the scene ─────────── */
function toggleRow(row){
  if (row.classList.contains('is-added')) return;
  var pick = row.querySelector('.reel__pick'), btn = row.querySelector('[data-rowbtn]');
  pick.hidden = !pick.hidden;
  btn.setAttribute('aria-expanded', String(!pick.hidden));
  if (!pick.hidden){ var c = pick.querySelector('input:checked'); if (c) c.focus({ preventScroll:true }); }
}
function itemOf(row){
  var i = +row.closest('[data-cr]').dataset.cr, p = piece(LOOKS[i], +row.dataset.row - 1), c = row.querySelector('input:checked');
  return { key:p.key, name:p.name, price:p.price, img:p.img, crop:p.crop, size:c ? c.value : '' };
}
function addRows(rows){
  rows = rows.filter(function(r){ return !r.classList.contains('is-added'); });
  if (!rows.length) return;
  rows.forEach(function(r){ r.dataset.touched = '1'; });
  Bag.add(rows.map(itemOf));
  rows.forEach(function(r){
    r.classList.add('is-added');
    r.querySelector('.reel__pick').hidden = true;
    r.querySelector('[data-rowbtn]').setAttribute('aria-expanded', 'false');
  });
  checkComplete(rows[0].closest('[data-cr]'));
}
function addAll(cr){
  if (cr.classList.contains('is-complete')) return;
  var msg = cr.querySelector('[data-msg]'); msg.textContent = '';
  var rows = [].slice.call(cr.querySelectorAll('[data-row]')).filter(function(r){ return !r.classList.contains('is-added'); });
  var ready = rows.filter(function(r){ return r.dataset.touched === '1'; });
  var pending = rows.filter(function(r){ return r.dataset.touched !== '1'; });
  if (ready.length) addRows(ready);
  if (pending.length){
    msg.textContent = 'Pick a size for: ' + pending.map(function(r){ return r.querySelector('.reel__name').textContent; }).join(', ');
    pending.forEach(function(r){ if (r.querySelector('.reel__pick').hidden) toggleRow(r); });
  }
}
function checkComplete(cr){
  var all = cr.querySelectorAll('[data-row]'), added = cr.querySelectorAll('[data-row].is-added');
  if (added.length === all.length){
    cr.classList.add('is-complete');
    cr.querySelector('[data-all-l]').textContent = 'The whole scene is in your bag';
    cr.querySelector('[data-msg]').textContent = '';
  }
}

/* ── visibility, reveal, resize ───────────────────────────────── */
new IntersectionObserver(function(es){
  visible = es.some(function(e){ return e.isIntersecting; });
  if (visible) kick();
}, { threshold:0 }).observe(sec);
if (reduced) sec.classList.add('is-revealed');
else {
  var rio = new IntersectionObserver(function(es){
    if (es.some(function(e){ return e.isIntersecting; })){
      rio.disconnect();
      sec.classList.add('is-revealed');
      if (!engaged) setTimeout(function(){ if (!engaged && !playing) play(true); }, 900);
    }
  }, { rootMargin:'0px 0px -25% 0px' });
  rio.observe(sec);
}
document.addEventListener('visibilitychange', function(){ if (!document.hidden) kick(); });
var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(measure, 100); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

measure();
setIndex(0, true);
})();
