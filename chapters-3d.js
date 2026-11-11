/* AFTR — 05 COLLECTIONS, desktop 3D scene ("the red tunnel").
   Our own take, not a copy: instead of a shattered floor, a wet night
   platform under a run of thin red tunnel arches (the last-train motif),
   with drifting dust in the light and pools of red under the three cards.
   The camera glides down the tunnel as the block splits open.

   Loaded only on desktop (≥768px), with WebGL and without reduced motion.
   Otherwise the flat red glow stays (phones keep it by design).
   Renders only while the section is on screen. */

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
  const go = () => { if (started || !desktop.matches) return; started = true; boot().catch(() => {}); };
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) go(); }, { rootMargin:'100% 0px' });
  io.observe(sec);
  desktop.addEventListener('change', go);
}

async function boot(){
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');

  const RED = new THREE.Color('#E33737');
  const DEEP = new THREE.Color('#8c0a08');
  const BG = 0x0b0b0b;

  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(BG, 1);
  const canvas = renderer.domElement;
  canvas.className = 'ch__scene';
  canvas.setAttribute('aria-hidden', 'true');
  pin.insertBefore(canvas, pin.firstChild);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.055);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);

  /* ── wet platform: dark, rippled, catching the red light ── */
  const floorMat = new THREE.ShaderMaterial({
    uniforms:{ uTime:{ value:0 }, uRed:{ value:RED }, uDeep:{ value:DEEP }, uLift:{ value:0 } },
    vertexShader:`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader:`
      uniform float uTime, uLift; uniform vec3 uRed, uDeep;
      varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float pool(vec2 p, vec2 c){ vec2 d = (p - c) * vec2(0.9, 1.8); return exp(-dot(d,d) * 1.2); }
      void main(){
        vec2 p = vW.xz;
        // slow ripples on wet concrete
        float r = n(p * vec2(1.4, 0.45) + vec2(0.0, uTime * 0.18)) * 0.6 + n(p * 3.1 - uTime * 0.12) * 0.4;
        // long reflections of the arches: a soft centre lane + the two arch feet
        float lane = exp(-pow(p.x / 1.9, 2.0)) * 0.45;
        float feet = exp(-pow((abs(p.x) - 4.6) / 0.32, 2.0)) * 0.9;
        float streak = (lane + feet) * (0.45 + 0.55 * r);
        // red light pooling under the three cards
        float pools = pool(p, vec2(-2.75, -1.0)) + pool(p, vec2(0.0, -1.8)) * 1.15 + pool(p, vec2(2.75, -1.0));
        vec3 col = vec3(0.02) + uRed * streak * 0.55 + uDeep * pools * (0.5 + 0.9 * uLift);
        float fog = smoothstep(3.0, 38.0, distance(vW, cameraPosition));
        col = mix(col, vec3(0.043), fog);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 90, 1, 1), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -30;
  scene.add(floor);

  /* ── tunnel arches: hairline red neon + a soft halo copy ── */
  const ARCH_N = 14, GAP = 3.4, RADIUS = 4.6;
  const lineGeo = new THREE.TorusGeometry(RADIUS, 0.018, 6, 120, Math.PI);
  const haloGeo = new THREE.TorusGeometry(RADIUS, 0.11, 8, 120, Math.PI);
  const lineMat = new THREE.MeshBasicMaterial({ color:RED, fog:true });
  const haloMat = new THREE.MeshBasicMaterial({ color:RED, transparent:true, opacity:0.12, blending:THREE.AdditiveBlending, depthWrite:false, fog:true });
  const arches = [];
  for (let i = 0; i < ARCH_N; i++){
    const g = new THREE.Group();
    g.add(new THREE.Mesh(lineGeo, lineMat));
    g.add(new THREE.Mesh(haloGeo, haloMat));
    scene.add(g);
    arches.push(g);
  }

  /* ── dust in the light ── */
  const DUST = 700;
  const pos = new Float32Array(DUST * 3), spd = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++){
    pos[i*3] = (Math.random() - 0.5) * 14;
    pos[i*3+1] = Math.random() * 5.5;
    pos[i*3+2] = 4 - Math.random() * 42;
    spd[i] = 0.08 + Math.random() * 0.22;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color:new THREE.Color('#ff7a6a'), size:0.03, transparent:true, opacity:0.55,
    blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true, fog:true
  }));
  scene.add(dust);

  /* ── sizing, visibility, input ── */
  function resize(){
    const w = pin.clientWidth, h = pin.clientHeight;
    renderer.setSize(w, h, false);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
  }, { passive:true });

  let visible = false, raf = 0, last = performance.now(), t = 0, travel = 0;
  const vio = new IntersectionObserver(es => {
    visible = es.some(e => e.isIntersecting);
    if (visible) loop();
  });
  vio.observe(sec);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  function apply3d(on){ sec.classList.toggle('has-3d', on); }
  apply3d(desktop.matches);
  desktop.addEventListener('change', () => { apply3d(desktop.matches); if (desktop.matches){ resize(); loop(); } });

  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

  function frame(now){
    raf = 0;
    if (!visible || document.hidden || !desktop.matches) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const p = sec.__p || 0;                         // written by chapters.js
    const open = smooth((p - 0.14) / 0.56);        // 0 closed → 1 open
    const lift = smooth((p - 0.36) / 0.45);         // cards rising

    // camera glides down the tunnel as it opens; a little parallax from the mouse
    cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
    camera.position.set(cx * 0.6, 1.25 - cy * 0.25 + (1 - open) * 0.35, 7.5 - open * 3.2);
    camera.lookAt(cx * 0.2, 1.15 + open * 0.15, -12);

    // arches drift toward the camera (slowly at rest, faster while scrolling open)
    travel += dt * 0.35;
    const offset = travel + p * 10;
    const T = ARCH_N * GAP;
    for (let i = 0; i < ARCH_N; i++){
      const k = (((i * GAP - offset) % T) + T) % T;   // 0 = nearest, wraps to the back
      arches[i].position.set(0, 0, 4 - k);
    }

    // dust rises and wraps
    const a = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST; i++){
      a[i*3+1] += spd[i] * dt;
      if (a[i*3+1] > 5.5) a[i*3+1] = 0;
    }
    dustGeo.attributes.position.needsUpdate = true;

    floorMat.uniforms.uTime.value = t;
    floorMat.uniforms.uLift.value = lift;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function loop(){ if (!raf && visible){ last = performance.now(); raf = requestAnimationFrame(frame); } }
  loop();
}
