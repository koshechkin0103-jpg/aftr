/* AFTR — blocks 01 + 02 scroll engine.
   One rAF loop reads scroll progress and writes CSS custom properties
   (plus video time). Every animation is a pure function of scroll, so
   scrolling back replays everything in reverse.

   Scroll map (p = 0…1 over the runway):
     0.00 → 0.14  logo + tagline exit (exit-3d: grow, sink, blur)
     0.00 → 0.06  bottom labels fade
     0.00 → 0.55  video scrubs frame-locked to scroll
     0.30 → 0.55  video folds into the window of block 02, shade fades
     0.50 → 0.60  heading rises in
     0.55 → 0.70  margin notes rise in (staggered)
     0.60 → 0.84  statement types in word by word
     0.55 → 1.00  video holds its last frame inside the window
*/
(function(){
'use strict';

var TITLE_OUT = [0.00, 0.14];
var LABEL_OUT = [0.00, 0.06];
var SCRUB_END = 0.55;
var FOLD      = [0.30, 0.55];
var SHOW_M    = 0.46;            // manifesto layer composites from here
var HEAD_IN   = [0.50, 0.60];
var DROP_IN   = [0.53, 0.63];
var NOTES_IN  = [0.55, 0.65];
var NOTE_STEP = 0.05;
var WORDS     = [0.60, 0.84];
var WORD_DUR  = 0.07;

var LERP_TAU = 8, SNAP = 0.002, LRU_MAX = 24, LEAD = 24, WATCHDOG = 60000;

var root     = document.documentElement;
var runway   = document.getElementById('runway');
var stage    = document.getElementById('stage');
var V        = document.getElementById('v');
var C        = document.getElementById('c');
var title    = document.getElementById('heroTitle');
var labels   = [document.getElementById('heroDrop'), document.getElementById('heroScroll')];
var man      = document.getElementById('manifesto');
var slot     = document.getElementById('slot');
var head     = document.getElementById('mHead');
var drop     = document.getElementById('mDrop');
var notes    = [].slice.call(document.querySelectorAll('[data-note]'));
var stmt     = document.getElementById('mStatement');
var reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
function seg(p, r){ return clamp01((p - r[0]) / (r[1] - r[0])); }
function expoOut(t){ return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function inOut(t){ return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function r3(x){ return Math.round(x * 1000) / 1000; }

/* ── live local clock ─────────────────────────────────────────── */
(function(){
  var el = document.getElementById('clock');
  var fmt = new Intl.DateTimeFormat('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
  function paint(){ el.textContent = '[ ' + fmt.format(new Date()) + ' ]'; el.setAttribute('datetime', new Date().toISOString()); }
  paint();
  setTimeout(function(){ paint(); setInterval(paint, 60000); }, 60000 - Date.now() % 60000);
})();

/* ── video source by viewport (smaller file on phones) ────────── */
V.src = innerWidth < 768 ? V.dataset.srcMobile : V.dataset.srcDesktop;
V.pause();

/* ── entrance ─────────────────────────────────────────────────── */
var shown = false;
function showPage(){
  if (shown) return; shown = true;
  requestAnimationFrame(function(){
    root.classList.add('is-ready');
    setTimeout(function(){ root.classList.add('is-settled'); }, 1800);
  });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(showPage);
setTimeout(showPage, 2500);

/* ── statement: split into words, keep the hand-set <br>s ─────── */
var words = [];
(function split(el){
  var nodes = [].slice.call(el.childNodes);
  el.textContent = '';
  nodes.forEach(function(n){
    if (n.nodeType === 3){
      n.textContent.split(/(\s+)/).forEach(function(part){
        if (!part) return;
        if (/^\s+$/.test(part)){ el.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span'); s.className = 'word'; s.textContent = part;
        el.appendChild(s); words.push(s);
      });
    } else {
      el.appendChild(n);
      if (n.nodeType === 1 && n.childNodes.length) split(n);   // e.g. the script line
    }
  });
})(stmt);

/* ── clip: scrubbed <video> + WebCodecs frame bank ────────────────
   The bank is progressive enhancement: decode the whole clip once into
   WebP stills, then draw them to a canvas on scroll. Any failure leaves
   the <video> scrub running as if the bank never existed. */
var clip = { dur:0, current:0, target:0, bank:[], lru:new Map(), drawnIndex:-1,
             ready:false, reverted:false, painted:false, building:false };
var ctx = C.getContext('2d', { alpha:false });

function prime(){ clip.dur = V.duration || 0; try { V.currentTime = 0.001; } catch(e){} }
if (V.readyState >= 1) prime();
V.addEventListener('loadedmetadata', prime);

function nearestIndex(t){
  var b = clip.bank, us = t * 1e6, lo = 0, hi = b.length - 1;
  while (lo < hi){ var m = (lo + hi) >> 1; if (b[m].ts < us) lo = m + 1; else hi = m; }
  return lo;
}
function warm(i){
  var b = clip.bank, lru = clip.lru;
  for (var k = -1; k <= 2; k++){
    var j = i + k;
    if (j < 0 || j >= b.length || lru.has(j)) continue;
    lru.set(j, null);
    (function(idx){
      createImageBitmap(b[idx].blob).then(function(bm){
        lru.set(idx, bm);
        if (lru.size > LRU_MAX){
          var it = lru.keys();
          for (var n = 0; n < lru.size - LRU_MAX; n++){
            var key = it.next().value, old = lru.get(key);
            if (old && old.close) old.close();
            lru.delete(key);
          }
        }
      }).catch(function(){ lru.delete(idx); });
    })(j);
  }
}
function drawFromBank(t){
  var i = nearestIndex(t), bm = clip.lru.get(i);
  if (bm && i !== clip.drawnIndex){
    if (C.width !== bm.width){ C.width = bm.width; C.height = bm.height; }
    ctx.drawImage(bm, 0, 0, C.width, C.height);
    clip.drawnIndex = i;
    if (!clip.painted && !clip.reverted){ clip.painted = true; C.classList.add('is-live'); }
  }
  warm(i);
}
function render(t){
  if (clip.ready){ drawFromBank(t); return; }
  if (!V.seeking && V.readyState >= 1 && Math.abs(V.currentTime - t) > 0.01){
    try { V.currentTime = t; } catch(e){}
  }
}
function revert(){ clip.reverted = true; clip.ready = false; C.classList.remove('is-live'); }

function build(soft){
  return new Promise(function(done){
    if (clip.building || reduced) return done();
    if (typeof VideoDecoder === 'undefined' || typeof MP4Box === 'undefined' || typeof DataStream === 'undefined') return done();
    clip.building = true;
    var settled = false;
    var watchdog = setTimeout(function(){ revert(); finish(); }, WATCHDOG);
    function finish(){ if (settled) return; settled = true; clearTimeout(watchdog); done(); }
    function fail(){ if (settled) return; revert(); finish(); }
    function failDecode(){
      if (settled) return;
      if (!soft){
        settled = true; clearTimeout(watchdog);
        try { decoder.close(); } catch(e){}
        clip.building = false; clip.bank.length = 0; clip.lru.clear(); clip.drawnIndex = -1;
        build(true).then(done);
        return;
      }
      fail();
    }
    var off = document.createElement('canvas'), octx = null;
    var chain = Promise.resolve(), samples = [], decoder, file;
    var cnt = 0, waiters = [];
    function tickDone(){
      cnt++;
      for (var i = waiters.length - 1; i >= 0; i--) if (cnt >= waiters[i].n){ waiters[i].res(); waiters.splice(i, 1); }
    }
    function until(n){ return cnt >= n ? Promise.resolve() : new Promise(function(res){ waiters.push({ n:n, res:res }); }); }

    try { file = MP4Box.createFile(); } catch(e){ return fail(); }
    decoder = new VideoDecoder({
      output: function(vf){
        var ts = vf.timestamp;
        chain = chain.then(function(){
          if (clip.reverted){ vf.close(); tickDone(); return; }
          if (!octx){ off.width = vf.displayWidth || 1280; off.height = vf.displayHeight || 720; octx = off.getContext('2d', { alpha:false }); }
          octx.drawImage(vf, 0, 0, off.width, off.height);
          vf.close();
          return new Promise(function(res){
            off.toBlob(function(blob){ if (blob) clip.bank.push({ ts:ts, blob:blob }); tickDone(); res(); }, 'image/webp', 0.85);
          });
        });
      },
      error: failDecode
    });
    function description(track){
      var entries = file.getTrackById(track.id).mdia.minf.stbl.stsd.entries;
      for (var i = 0; i < entries.length; i++){
        var box = entries[i].avcC || entries[i].hvcC || entries[i].vpcC || entries[i].av1C;
        if (box){ var s = new DataStream(undefined, 0, DataStream.BIG_ENDIAN); box.write(s); return new Uint8Array(s.buffer, 8); }
      }
      return null;
    }
    file.onError = fail;
    file.onReady = function(info){
      var track = info.videoTracks && info.videoTracks[0];
      if (!track) return fail();
      var cfg = { codec:track.codec, codedWidth:track.video.width, codedHeight:track.video.height };
      var desc = description(track); if (desc) cfg.description = desc;
      if (soft) cfg.hardwareAcceleration = 'prefer-software';
      try { decoder.configure(cfg); } catch(e){ return failDecode(); }
      file.setExtractionOptions(track.id, null, { nbSamples:Infinity });
      file.start();
    };
    file.onSamples = function(id, user, list){ for (var i = 0; i < list.length; i++) samples.push(list[i]); };
    function pump(){
      var i = 0;
      function step(){
        if (clip.reverted) return Promise.resolve();
        while (i < samples.length){
          var s = samples[i];
          try {
            decoder.decode(new EncodedVideoChunk({ type: s.is_sync ? 'key' : 'delta',
              timestamp: s.cts * 1e6 / s.timescale, duration: s.duration * 1e6 / s.timescale, data: s.data }));
          } catch(e){ failDecode(); return Promise.resolve(); }
          i++;
          if (i - cnt > LEAD) return until(i - LEAD).then(step);
        }
        return Promise.resolve();
      }
      return step();
    }
    fetch(V.currentSrc || V.src)
      .then(function(r){ if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); })
      .catch(fail)
      .then(function(buf){
        if (!buf || clip.reverted) return;
        try { buf.fileStart = 0; file.appendBuffer(buf); file.flush(); } catch(e){ return fail(); }
        if (!samples.length) return fail();
        pump()
          .then(function(){ return clip.reverted ? null : decoder.flush(); })
          .then(function(){ return chain; })
          .then(function(){
            if (clip.reverted || !clip.bank.length) return finish();
            clip.bank.sort(function(a, b){ return a.ts - b.ts; });
            var i0 = nearestIndex(clip.current);
            return createImageBitmap(clip.bank[i0].blob).then(function(bm){
              if (clip.reverted) return;
              clip.lru.set(i0, bm); clip.ready = true; drawFromBank(clip.current);
            }).then(finish);
          })
          .catch(failDecode);
      });
  });
}
if (document.readyState === 'complete') build(); else addEventListener('load', function(){ build(); });

/* ── geometry ─────────────────────────────────────────────────── */
var span = 0, fold = null, slotR = 28;
function measure(){
  span = runway.offsetHeight - innerHeight;
  var r = slot.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
  var k = Math.max(r.width / vw, r.height / vh);
  var ix = (vw - r.width / k) / 2, iy = (vh - r.height / k) / 2;
  /* The visible region of the stage once folded is (vw-2ix)×(vh-2iy). On a
     portrait phone the cover-cropped video would show only a sliver of the
     frame there, so the media zooms out (vz < 1) just enough to still cover
     that region. On desktop vz ≈ 1. */
  var a = (V.videoWidth && V.videoHeight) ? V.videoWidth / V.videoHeight : 16 / 9;
  var coverW = Math.max(vw, vh * a), coverH = coverW / a;
  var vz = Math.min(1, Math.max((vw - 2 * ix) / coverW, (vh - 2 * iy) / coverH));
  fold = { k:k, ix:ix, iy:iy, vz:vz,
           dx:(r.left + r.width / 2) - vw / 2, dy:(r.top + r.height / 2) - vh / 2 };
  slotR = parseFloat(getComputedStyle(root).getPropertyValue('--slot-r')) || 28;
  last.fold = -1;
}
function progress(){ return span > 0 ? clamp01(scrollY / span) : 0; }

/* ── writers (each skips when its value hasn't changed) ───────── */
var last = { exit:-1, out:-1, fold:-1, head:-1, drop:-1, notes:[], words:[], man:null };
var exiting = false, gone = false;

function setRise(el, v, cacheArr, i){
  var prev = cacheArr ? cacheArr[i] : last[el.id];
  if (v === prev) return;
  if (cacheArr) cacheArr[i] = v; else last[el.id] = v;
  el.style.setProperty('--in', v);
  el.classList.toggle('is-anim', v > 0 && v < 1);
}

function updateHero(p){
  var e = r3(seg(p, TITLE_OUT));   // linear on purpose: the 3D projection supplies the curve
  if (e !== last.exit){
    last.exit = e;
    title.style.setProperty('--exit', e);
    var isEx = e > 0, isGone = e >= 1;
    if (isEx !== exiting){ exiting = isEx; title.classList.toggle('is-exiting', isEx); }
    if (isGone !== gone){ gone = isGone; title.classList.toggle('is-gone', isGone); }
  }
  var o = r3(seg(p, LABEL_OUT));
  if (o !== last.out){ last.out = o; labels.forEach(function(l){ l.style.setProperty('--out', o); }); }
}

function updateFold(p){
  var t = r3(inOut(seg(p, FOLD)));
  if (t === last.fold || !fold) return;
  last.fold = t;
  var kt = 1 + (fold.k - 1) * t;
  var s = stage.style;
  s.setProperty('--k', kt.toFixed(4));
  s.setProperty('--dx', (fold.dx * t).toFixed(2) + 'px');
  s.setProperty('--dy', (fold.dy * t).toFixed(2) + 'px');
  s.setProperty('--ix', (fold.ix * t).toFixed(2) + 'px');
  s.setProperty('--iy', (fold.iy * t).toFixed(2) + 'px');
  s.setProperty('--r',  (slotR * t / kt).toFixed(2) + 'px');
  s.setProperty('--vz', (1 + (fold.vz - 1) * t).toFixed(4));
  root.style.setProperty('--fold', t);
}

function updateManifesto(p){
  var on = p >= SHOW_M;
  if (on !== last.man){ last.man = on; man.classList.toggle('is-on', on); }
  if (!on) return;
  setRise(head, r3(expoOut(seg(p, HEAD_IN))));
  setRise(drop, r3(expoOut(seg(p, DROP_IN))));
  notes.forEach(function(n, i){
    var a = NOTES_IN[0] + i * NOTE_STEP;
    setRise(n, r3(expoOut(seg(p, [a, a + (NOTES_IN[1] - NOTES_IN[0])]))), last.notes, i);
  });
  var stepW = words.length > 1 ? (WORDS[1] - WORDS[0] - WORD_DUR) / (words.length - 1) : 0;
  words.forEach(function(w, i){
    var a = WORDS[0] + i * stepW;
    setRise(w, r3(expoOut(seg(p, [a, a + WORD_DUR]))), last.words, i);
  });
}

/* ── video: scrub until the fold lands, then hold the last frame ── */
function updateVideo(p, dt){
  if (!clip.dur) return;
  clip.target = clamp01(p / SCRUB_END) * Math.max(0, clip.dur - 0.04);
  if (reduced) clip.current = 0;
  else {
    clip.current += (clip.target - clip.current) * (1 - Math.exp(-dt * LERP_TAU));
    if (Math.abs(clip.target - clip.current) < SNAP) clip.current = clip.target;
  }
  render(clip.current);
}

/* ── loop ─────────────────────────────────────────────────────── */
var lastT = performance.now(), lastVW = innerWidth, lastVH = innerHeight;
measure();
function tick(now){
  var dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (innerWidth !== lastVW || innerHeight !== lastVH){ lastVW = innerWidth; lastVH = innerHeight; measure(); }
  var p = progress();
  updateHero(p);
  updateFold(p);
  updateManifesto(p);
  updateVideo(p, dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
addEventListener('load', measure);
V.addEventListener('loadedmetadata', measure);
addEventListener('resize', function(){ clearTimeout(measure.t); measure.t = setTimeout(measure, 120); });

/* read-only diagnostics + a way to sample states without scrolling */
window.__aftr = {
  get clip(){ return { ready:clip.ready, frames:clip.bank.length, reverted:clip.reverted, dur:clip.dur, t:clip.current }; },
  get fold(){ return fold; },
  drive: function(p){ updateHero(p); updateFold(p); updateManifesto(p); return p; }
};
})();
