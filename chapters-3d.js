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
  const { CSS3DRenderer, CSS3DObject } = await import('three/addons/renderers/CSS3DRenderer.js');

  const RED = new THREE.Color('#E33737');
  const DEEP = new THREE.Color('#8c0a08');
  const BG = 0x0b0b0b;

  /* WebGL layer (tunnel) */
  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
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
  scene.fog = new THREE.FogExp2(BG, 0.05);
  const cssScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 90);

  /* ── wet platform ── */
  const floorMat = new THREE.ShaderMaterial({
    uniforms:{
      uTime:{ value:0 }, uRed:{ value:RED }, uDeep:{ value:DEEP }, uLift:{ value:0 },
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
        float r = n(p * vec2(1.4, 0.45) + vec2(0.0, uTime * 0.18)) * 0.6 + n(p * 3.1 - uTime * 0.12) * 0.4;
        float lane = exp(-pow(p.x / 1.9, 2.0)) * 0.4;
        float feet = exp(-pow((abs(p.x) - 4.6) / 0.32, 2.0)) * 0.9;
        float streak = (lane + feet) * (0.45 + 0.55 * r);
        float pools = (pool(p, uC0) + pool(p, uC1) + pool(p, uC2)) * uLift;
        vec3 col = vec3(0.02) + uRed * streak * 0.55 + uDeep * pools * 1.3;
        float fog = smoothstep(3.0, 40.0, distance(vW, cameraPosition));
        gl_FragColor = vec4(mix(col, vec3(0.043), fog), 1.0);
      }`
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 100, 1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -35;
  scene.add(floor);

  /* ── tunnel arches (fixed: the camera does the travelling) ── */
  const ARCH_N = 18, GAP = 3.2, RADIUS = 4.6;
  const lineGeo = new THREE.TorusGeometry(RADIUS, 0.018, 6, 120, Math.PI);
  const haloGeo = new THREE.TorusGeometry(RADIUS, 0.11, 8, 120, Math.PI);
  const lineMat = new THREE.MeshBasicMaterial({ color:RED, fog:true });
  const haloMat = new THREE.MeshBasicMaterial({ color:RED, transparent:true, opacity:0.12, blending:THREE.AdditiveBlending, depthWrite:false, fog:true });
  for (let i = 0; i < ARCH_N; i++){
    const g = new THREE.Group();
    g.add(new THREE.Mesh(lineGeo, lineMat), new THREE.Mesh(haloGeo, haloMat));
    g.position.z = 5 - i * GAP;
    scene.add(g);
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

  /* ── sizing, visibility, input ── */
  function resize(){
    const w = pin.clientWidth, h = pin.clientHeight;
    renderer.setSize(w, h, false);
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

    // cards rise out of the floor as the split opens; fade before it closes
    const rise = smooth(seg(p, 0.16, 0.30));
    const out = smooth(seg(p, 0.80, 0.86));
    css.domElement.style.opacity = (1 - out).toFixed(3);
    css.domElement.style.visibility = out >= 1 || rise <= 0 ? 'hidden' : '';
    objs.forEach((o, i) => {
      const b = o.userData.base, r = smooth(seg(p, 0.16 + i * 0.03, 0.30 + i * 0.03));
      o.position.set(b[0], b[1] - (1 - r) * 3.2 + Math.sin(t * 0.8 + i * 2) * 0.03, b[2]);
      // cards further from the camera sink into the dark like the fog does
      const d = camera.position.distanceTo(o.position);
      const dim = Math.min(0.75, Math.max(0, (d - 5) / 18));
      const f = 'brightness(' + (1 - dim).toFixed(3) + ')';
      if (o.element.style.filter !== f) o.element.style.filter = f;
    });

    const a = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST; i++){ a[i*3+1] += spd[i] * dt; if (a[i*3+1] > 5) a[i*3+1] = 0; }
    dustGeo.attributes.position.needsUpdate = true;

    floorMat.uniforms.uTime.value = t;
    floorMat.uniforms.uLift.value = rise * (1 - out);
    renderer.render(scene, camera);
    css.render(cssScene, camera);
    raf = requestAnimationFrame(frame);
  }
  function loop(){ if (!raf && visible){ last = performance.now(); raf = requestAnimationFrame(frame); } }
  loop();
}
