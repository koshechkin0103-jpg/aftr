/* AFTR — 05 COLLECTIONS, desktop 3D scene ("the red tunnel").
   Our own take, not a copy: a wet night platform under a run of thin red
   tunnel arches (the last-train motif), dust in the light, red pools under
   the cards. The three chapter cards stand inside the tunnel at different
   depths (real DOM via CSS3DRenderer, so text stays crisp and clickable),
   and the camera flies card to card on scroll:

     split opens → down the tunnel → Blue Hour (right, near)
                 → Static (left, middle) → Soft Riot (far) → back out → closes

   Desktop only (≥768px), with WebGL and without reduced motion. Phones and
   fallbacks keep the flat version (glow + rising cards). */

const sec = document.getElementById('collections');
const pin = sec && sec.querySelector('.ch__pin');
const desktop = matchMedia('(min-width: 768px)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK(){
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch(e){ return false; }
}

if (sec && pin && !reduced && webglOK()){
  let started = false;
  const go = () => { if (started || !desktop.matches) return; started = true; boot().catch(e => console.info('[chapters 3d] staying flat:', e && e.message)); };
  new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) go(); }, { rootMargin:'150% 0px' }).observe(sec);
  desktop.addEventListener('change', go);
}

/* camera path — p is the scroll progress over the pinned stretch.
   Pairs of equal keys are holds (the camera rests on a card). */
const CARDS = [
  { pos:[ 1.75, 1.25,  -1.5], rotY:-0.20 },   // Blue Hour  — right, near
  { pos:[-1.95, 1.30,  -8.5], rotY: 0.22 },   // Static     — left, middle
  { pos:[ 0.30, 1.30, -16.0], rotY:-0.06 }    // Soft Riot  — far
];
const VIEW_DIST = 5.8;     // card ≈ 60% of the screen height at a stop
function atCard(i){
  const c = CARDS[i].pos, r = CARDS[i].rotY;
  return { pos:[c[0] + Math.sin(-r) * VIEW_DIST * 0.35, c[1] + 0.05, c[2] + VIEW_DIST], look:c };
}
const HOME = { pos:[0, 1.35, 7.5], look:[0, 1.2, -12] };
const KEYS = [
  { p:0.00, ...HOME },
  { p:0.24, pos:[0, 1.3, 6.2], look:[0, 1.22, -12] },
  { p:0.33, ...atCard(0) }, { p:0.42, ...atCard(0) },
  { p:0.51, ...atCard(1) }, { p:0.60, ...atCard(1) },
  { p:0.69, ...atCard(2) }, { p:0.78, ...atCard(2) },
  { p:0.88, ...HOME },
  { p:1.00, ...HOME }
];
const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
function path(p){
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = smooth(seg(p, a.p, b.p));
  const mix = (u, v) => u.map((x, k) => x + (v[k] - x) * t);
  return { pos:mix(a.pos, b.pos), look:mix(a.look, b.look) };
}

async function boot(){
  const THREE = await import('three');
  const [{ CSS3DRenderer, CSS3DObject }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
    import('three/addons/renderers/CSS3DRenderer.js'),
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js')
  ]);

  const RED = new THREE.Color('#E33737');
  const DEEP = new THREE.Color('#8c0a08');
  const BG = 0x0b0b0b;

  /* WebGL layer (tunnel). Rendered above screen resolution (supersampling)
     so the thin neon arcs stay smooth instead of stair-stepping. */
  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
  const DPR = Math.min(2, Math.max(1.5, devicePixelRatio));
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(BG, 1);
  const canvas = renderer.domElement;
  canvas.className = 'ch__scene';
  canvas.setAttribute('aria-hidden', 'true');
  pin.insertBefore(canvas, pin.firstChild);

  /* CSS3D layer (cards) — above the split halves */
  const css = new CSS3DRenderer();
  css.domElement.className = 'ch__css3d';
  pin.appendChild(css.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);   // colour-managed (the clear colour is not, through the composer)
  scene.fog = new THREE.FogExp2(BG, 0.05);
  const cssScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 90);

  /* ── wet platform ── */
  const floorMat = new THREE.ShaderMaterial({
    uniforms:{
      // shader maths is done in display (sRGB) space, so pass sRGB triplets
      uTime:{ value:0 }, uRed:{ value:RED.clone().convertLinearToSRGB() }, uDeep:{ value:DEEP.clone().convertLinearToSRGB() }, uLift:{ value:0 },
      uC0:{ value:new THREE.Vector2(CARDS[0].pos[0], CARDS[0].pos[2]) },
      uC1:{ value:new THREE.Vector2(CARDS[1].pos[0], CARDS[1].pos[2]) },
      uC2:{ value:new THREE.Vector2(CARDS[2].pos[0], CARDS[2].pos[2]) }
    },
    vertexShader:`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader:`
      uniform float uTime, uLift; uniform vec3 uRed, uDeep; uniform vec2 uC0, uC1, uC2;
      varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float pool(vec2 p, vec2 c){ vec2 d = (p - c - vec2(0.0, 0.4)) * vec2(0.85, 1.6); return exp(-dot(d,d) * 1.3); }
      void main(){
        vec2 p = vW.xz;
        // soft, slow ripples (two octaves, low contrast — no blocky cells)
        float r = n(p * vec2(0.9, 0.3) + vec2(0.0, uTime * 0.12)) * 0.6 + n(p * vec2(2.2, 0.8) - uTime * 0.08) * 0.4;
        // reflections: a broad centre lane + wide, soft glows under the arch feet
        float lane = exp(-pow(p.x / 2.2, 2.0)) * 0.32;
        float feet = exp(-pow((abs(p.x) - 4.6) / 1.1, 2.0)) * 0.42;
        float streak = (lane + feet) * (0.6 + 0.4 * r);
        float pools = (pool(p, uC0) + pool(p, uC1) + pool(p, uC2)) * uLift;
        vec3 col = vec3(0.018) + uRed * streak * 0.5 + uDeep * pools * 1.2;
        float fog = smoothstep(3.0, 40.0, distance(vW, cameraPosition));
        col = mix(col, vec3(0.043), fog);
        // ±1/255 dither (in display space): removes 8-bit banding in the dark reds
        col += (h(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
        // the composer works in linear light and OutputPass encodes to sRGB:
        // hand it linear values so the floor stays as dark as designed
        col = max(col, 0.0);
        gl_FragColor = vec4(mix(col / 12.92, pow((col + 0.055) / 1.055, vec3(2.4)), step(0.04045, col)), 1.0);   // exact sRGB → linear
      }`
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 100, 1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -35;
  scene.add(floor);

  /* ── tunnel arches (fixed: the camera does the travelling) ── */
  const ARCH_N = 18, GAP = 3.2, RADIUS = 4.6;
  // one smooth neon tube per arch (many segments); the glow comes from the
  // bloom pass, not from a second hard-edged "halo" tube
  const lineGeo = new THREE.TorusGeometry(RADIUS, 0.03, 16, 320, Math.PI);
  const lineMat = new THREE.MeshBasicMaterial({ color:new THREE.Color('#ff4a3d'), fog:true });
  for (let i = 0; i < ARCH_N; i++){
    const m = new THREE.Mesh(lineGeo, lineMat);
    m.position.z = 5 - i * GAP;
    scene.add(m);
  }

  /* ── dust ── */
  const DUST = 900;
  const pos = new Float32Array(DUST * 3), spd = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++){
    pos[i*3] = (Math.random() - 0.5) * 9;
    pos[i*3+1] = Math.random() * 5;
    pos[i*3+2] = 8 - Math.random() * 52;
    spd[i] = 0.06 + Math.random() * 0.2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color:new THREE.Color('#ff7a6a'), size:0.03, transparent:true, opacity:0.55,
    blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true, fog:true
  })));

  /* ── cards: the existing DOM cards, placed in 3D ── */
  const list = sec.querySelector('.ch__cards');
  const cardEls = [].slice.call(sec.querySelectorAll('[data-ch-card]'));
  const CARD_PX = 360, SCALE = 1.5 / CARD_PX;     // a card is 1.5 units wide
  const objs = cardEls.map((el, i) => {
    const o = new CSS3DObject(el);
    o.position.set(...CARDS[i].pos);
    o.rotation.y = CARDS[i].rotY;
    o.scale.setScalar(SCALE);
    o.userData.base = CARDS[i].pos.slice();
    return o;
  });
  function attach(on){
    sec.classList.toggle('has-3d', on);
    if (on){ objs.forEach(o => cssScene.add(o)); }
    else {
      objs.forEach(o => { cssScene.remove(o); const el = o.element; el.style.transform = ''; el.style.position = ''; el.style.pointerEvents = ''; el.style.filter = ''; list.appendChild(el); });
    }
  }
  attach(desktop.matches);

  /* ── post: multisampled HDR render → soft neon bloom → output ── */
  const rt = new THREE.WebGLRenderTarget(1, 1, { type:THREE.HalfFloatType, samples:4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(DPR);
  composer.addPass(new RenderPass(scene, camera));
  // only the neon (bright) glows; the dark floor and fog stay black
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.45, 0.42);   // strength, radius, threshold
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ── sizing, visibility, input ── */
  function resize(){
    const w = pin.clientWidth, h = pin.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    css.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
  }, { passive:true });

  let visible = false, raf = 0, last = performance.now(), t = 0, sp = 0;
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) loop(); }).observe(sec);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
  desktop.addEventListener('change', () => { attach(desktop.matches); if (desktop.matches){ resize(); loop(); } });

  const look = new THREE.Vector3();
  let dpr = DPR; const perf = { n:0, sum:0 };
  function frame(now){
    raf = 0;
    if (!visible || document.hidden || !desktop.matches) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const target = sec.__p || 0;                    // written by chapters.js
    sp += (target - sp) * (1 - Math.exp(-dt * 7));  // soften scroll steps
    if (Math.abs(target - sp) < 0.0004) sp = target;
    const p = sp;

    // camera along the path + a little mouse parallax
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    const k = path(p);
    camera.position.set(k.pos[0] + cx * 0.35, k.pos[1] - cy * 0.18, k.pos[2]);
    look.set(k.look[0] + cx * 0.15, k.look[1], k.look[2]);
    camera.lookAt(look);

    // cards already stand in place when the split opens (fade in with it),
    // and fade out before it closes
    const rise = smooth(seg(p, 0.08, 0.22));
    const out = smooth(seg(p, 0.80, 0.86));
    css.domElement.style.opacity = (rise * (1 - out)).toFixed(3);
    css.domElement.style.visibility = out >= 1 || rise <= 0 ? 'hidden' : '';
    objs.forEach((o, i) => {
      const b = o.userData.base;
      o.position.set(b[0], b[1] + Math.sin(t * 0.8 + i * 2) * 0.03, b[2]);
      // depth of field: soft while far, sharp (0 blur) once the camera arrives;
      // far cards also sink into the dark like the fog does
      const d = camera.position.distanceTo(o.position);
      const blur = Math.min(7, Math.max(0, (d - (VIEW_DIST + 0.6)) * 0.9));
      const dim = Math.min(0.75, Math.max(0, (d - 6) / 18));
      const f = (blur > 0.05 ? 'blur(' + blur.toFixed(1) + 'px) ' : '') + 'brightness(' + (1 - dim).toFixed(2) + ')';
      if (o.element.style.filter !== f) o.element.style.filter = f;
    });

    const a = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST; i++){ a[i*3+1] += spd[i] * dt; if (a[i*3+1] > 5) a[i*3+1] = 0; }
    dustGeo.attributes.position.needsUpdate = true;

    floorMat.uniforms.uTime.value = t;
    floorMat.uniforms.uLift.value = rise * (1 - out);
    composer.render();
    css.render(cssScene, camera);

    // adaptive quality: if a weaker GPU can't hold ~45fps, drop the supersampling a notch
    perf.n++; perf.sum += dt;
    if (perf.n === 90){
      const avg = perf.sum / perf.n;
      if (avg > 0.022 && dpr > 1){ dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr); resize(); }
      perf.n = 0; perf.sum = 0;
    }
    raf = requestAnimationFrame(frame);
  }
  function loop(){ if (!raf && visible){ last = performance.now(); raf = requestAnimationFrame(frame); } }
  loop();
}
