/* AFTR — 04 HER THINGS
   Photo drift: each [data-drift] frame gets --drift 0→1 while it crosses
   the viewport (0 = frame top at the bottom edge, 1 = frame bottom at the
   top edge). The photo inside is 120% wide, so it slides right→left by
   the 20% surplus. One rAF per scroll frame; only visible frames write. */
(function(){
'use strict';
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
var frames = [].slice.call(document.querySelectorAll('[data-drift]'));
var rises  = [].slice.call(document.querySelectorAll('.ht-rise'));

/* reveal: rise in once when 15% visible, staggered per row */
if ('IntersectionObserver' in window && !reduced){
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      var el = e.target, i = rises.indexOf(el);
      el.style.transitionDelay = ((i % 3) * 90) + 'ms';
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { threshold:0.15 });
  rises.forEach(function(el){ io.observe(el); });
} else rises.forEach(function(el){ el.classList.add('is-in'); });

if (reduced || !frames.length) return;

var visible = new Set(), queued = false, last = new Map();
var vio = new IntersectionObserver(function(es){
  es.forEach(function(e){ if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
  schedule();
}, { rootMargin:'10% 0px 10% 0px' });
frames.forEach(function(f){ vio.observe(f); });

function update(){
  queued = false;
  var vh = innerHeight;
  visible.forEach(function(f){
    var r = f.getBoundingClientRect();
    var t = (vh - r.top) / (vh + r.height);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    t = Math.round(t * 1000) / 1000;
    if (last.get(f) === t) return;
    last.set(f, t);
    f.style.setProperty('--drift', t);
  });
}
function schedule(){ if (!queued){ queued = true; requestAnimationFrame(update); } }
addEventListener('scroll', schedule, { passive:true });
addEventListener('resize', schedule);
schedule();
})();
