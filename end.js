/* AFTR — 06 NEXT DROP + 07 FOOTER
   - newsletter form: validates the email and shows the joined state.
     Nothing is sent anywhere yet (no mailing service connected).
   - reveal on enter for the newsletter (reuses .ht-rise from her-things.js)
   - footer: live local clock, back to top, wordmark rises as it arrives */
(function(){
'use strict';
var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* reveal (her-things.js only observes elements present at its run; re-observe here) */
var rises = [].slice.call(document.querySelectorAll('.drop .ht-rise'));
if ('IntersectionObserver' in window && !reduced){
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = (rises.indexOf(e.target) * 80) + 'ms';
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold:0.2 });
  rises.forEach(function(el){ io.observe(el); });
} else rises.forEach(function(el){ el.classList.add('is-in'); });

/* newsletter */
var drop = document.getElementById('next-drop');
var form = document.getElementById('dropForm');
if (form){
  var input = form.querySelector('input'), label = form.querySelector('[data-drop-label]'), note = document.getElementById('dropNote');
  var NOTE = note.textContent;
  var ok = function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
  input.addEventListener('input', function(){ if (drop.classList.contains('is-error')){ drop.classList.remove('is-error'); note.textContent = NOTE; } });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (drop.classList.contains('is-done')) return;
    if (!ok(input.value.trim())){
      drop.classList.add('is-error');
      note.textContent = 'Please enter a valid email.';
      if (!reduced){ drop.classList.remove('is-shake'); void drop.offsetWidth; drop.classList.add('is-shake'); }
      input.focus();
      return;
    }
    drop.classList.remove('is-error');
    drop.classList.add('is-done');
    label.textContent = 'You’re on the list';
    input.disabled = true;
    note.textContent = 'See you on 12.12 — the code lands the night before.';
  });
}

/* footer clock (same format as the nav) */
var clocks = [].slice.call(document.querySelectorAll('[data-clock]'));
var fmt = new Intl.DateTimeFormat('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
function paint(){ var s = '[ ' + fmt.format(new Date()) + ' ]'; clocks.forEach(function(c){ c.textContent = s; }); }
paint();
setTimeout(function(){ paint(); setInterval(paint, 60000); }, 60000 - Date.now() % 60000);

/* back to top */
document.addEventListener('click', function(e){
  var a = e.target.closest('[data-to-top]');
  if (!a) return;
  e.preventDefault();
  scrollTo({ top:0, behavior:reduced ? 'auto' : 'smooth' });
});

/* wordmark rises: --lift 1 (low) → 0 (in place) as the footer comes into view */
var foot = document.getElementById('footer');
if (foot && !reduced){
  var logo = foot.querySelector('.foot__logo'), queued = false, last = -1;
  var nav = document.querySelector('.nav'), navOff = null;
  var update = function(){
    queued = false;
    var r = foot.getBoundingClientRect(), vh = innerHeight;
    // the footer has its own links: the fixed nav steps aside once it reaches them
    var off = r.top < 140;
    if (nav && off !== navOff){ navOff = off; nav.classList.toggle('is-away', off); }
    var t = (vh - r.top) / Math.min(r.height, vh);            // 0 entering → 1 fully in
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var lift = Math.round((1 - (1 - Math.pow(1 - t, 3))) * 1000) / 1000;   // ease-out
    if (lift !== last){ last = lift; logo.style.setProperty('--lift', lift); }
  };
  var schedule = function(){ if (!queued){ queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', schedule);
  update();
}
})();
