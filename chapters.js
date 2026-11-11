/* AFTR — 05 COLLECTIONS "Three Chapters"
   Scroll map over the pinned stretch (p = 0…1):
     0.00 → 0.12  closed block holds
     0.12 → 0.34  dates, "Three" and the lead fade        (--fade)
     0.14 → 0.55  halves slide apart                      (--split)
     0.18 → 0.58  red room comes up behind, wash clears   (--glow)
     0.22 → 0.58  CHAPTERS ghosts to half-transparent red (--ghost)
     0.36 → 0.86  three cards rise, staggered             (--in per card)
     0.86 → 1.00  hold
   Every value is a pure function of scroll, so scrolling back reverses it. */
(function(){
'use strict';
var sec = document.getElementById('collections');
if (!sec) return;
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* clone the closed block into the right half (it is clipped to its half) */
var closed = sec.querySelector('[data-ch-closed]');
/* split CHAPTERS into letters first, so both halves carry them */
var word = closed.querySelector('[data-ch-letters]');
word.innerHTML = word.textContent.split('').map(function(c, i){ return '<span class="ch__l" style="--i:' + i + '">' + c + '</span>'; }).join('');
var copy = closed.cloneNode(true);
copy.removeAttribute('data-ch-closed');
[].forEach.call(copy.querySelectorAll('[id]'), function(el){ el.removeAttribute('id'); });
sec.querySelector('.ch__panel--r').appendChild(copy);

var cards = [].slice.call(sec.querySelectorAll('[data-ch-card]'));

/* entrance: letters + script once, when the section is well in view */
if ('IntersectionObserver' in window && !reduced){
  var io = new IntersectionObserver(function(es){
    if (es.some(function(e){ return e.isIntersecting; })){ sec.classList.add('is-in'); io.disconnect(); }
  }, { threshold:0, rootMargin:'0px 0px -35% 0px' });
  io.observe(sec);
} else sec.classList.add('is-in');

function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
function seg(p, a, b){ return clamp01((p - a) / (b - a)); }
function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function expoOut(t){ return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function r3(x){ return Math.round(x * 1000) / 1000; }

var last = {}, queued = false;
function set(el, name, v, key){
  if (last[key] === v) return;
  last[key] = v;
  el.style.setProperty(name, v);
}
function update(){
  queued = false;
  var r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
  var p = span > 0 ? clamp01(-r.top / span) : 0;
  if (reduced) p = p > 0.3 ? 1 : 0;
  set(sec, '--fade',  r3(ease(seg(p, .12, .34))), 'f');
  set(sec, '--split', r3(ease(seg(p, .14, .55))), 's');
  set(sec, '--glow',  r3(ease(seg(p, .18, .58))), 'g');
  set(sec, '--ghost', r3(ease(seg(p, .22, .58))), 'h');
  var mob = innerWidth < 768;
  cards.forEach(function(c, i){
    var a = .36 + i * (mob ? .15 : .09), t = r3(expoOut(seg(p, a, a + (mob ? .22 : .32))));
    set(c, '--in', t, 'c' + i);
    set(c, '--vis', t > 0 ? 1 : 0, 'v' + i);
    var anim = t > 0 && t < 1;
    if (last['a' + i] !== anim){ last['a' + i] = anim; c.classList.toggle('is-anim', anim); }
  });
}
function schedule(){ if (!queued){ queued = true; requestAnimationFrame(update); } }
addEventListener('scroll', schedule, { passive:true });
addEventListener('resize', schedule);
update();

/* expose a sampler for checks: __aftrChapters(p) */
window.__aftrChapters = function(p){
  var span = sec.offsetHeight - innerHeight;
  scrollTo(0, sec.offsetTop + p * span);
};
})();
