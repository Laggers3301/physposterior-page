// PhysPosterior physics playground. Embeddable ES module.
//   <link rel="stylesheet" href="static/playground/playground.css">
//   <div id="pp-playground"></div>
//   <script type="module" src="static/playground/playground.js"></script>
// The block initialises itself when it comes near the viewport (no click). Or call mountPlayground(el).
// MuJoCo (official @mujoco/mujoco 3.9.0 WebAssembly) runs in a module worker (pp_worker.js);
// Three.js renders the recorded rollouts; charts are plain SVG.
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import {
  bounceHeight, inclineDist, slidePositions, BALL_R, BOX_SLIDE, BOX_COM, PUSH_T0, PUSH_T1,
  APPLE_R, TABLE_HALF, TABLE_EDGE, APPLE_X0, FLOOR_Z, BOARD_HALF, PAD_HALF, GRASP,
} from './pp_physics.js';

const BASE = new URL('./', import.meta.url);
const COL = { post: '#2a78d6', prior: '#eb6834', truth: '#1f2328', obs: '#1f2328' };
const SENTENCE = 'All these worlds explain the observed clip; under the new action they disagree, and the posterior concentrates where the true outcome falls.';
const NPOST = 16, TRUE_IDX = 32, SLOW_MS = 20000;

// ------------------------------------------------------------------ scenes
const SCENES = {
  grasp: {
    tab: 'Grasp slip', kind: () => 'grasp', weighted: true,
    intro: 'A two-finger gripper holds a thin board (like a circuit board) by its top edge, lifts it and carries it sideways. Unknown: finger–board friction and the board mass. Your action: grip force and how hard the arm accelerates.',
    success: { label: 'Board stays in the grip (slip under 6 mm)', ok: 'held', bad: 'slips', test: o => o.success },
  },
  apple: {
    tab: 'Apple drop', kind: () => 'apple', weighted: true,
    intro: 'Two kinds of apple look the same: a real one (heavy, barely bounces) and a foam prop (light, bouncy). The clip shows one drop from 5 cm. Your action: drop height and how fast you toss it toward the table edge.',
    success: { label: 'Apple stays on the table', ok: 'stays', bad: 'falls off', test: o => o.success },
  },
  bounce: {
    tab: 'Bounce', kind: () => 'bounce',
    intro: 'A ball is dropped onto a plate. Unknown: the effective restitution e of the contact and the exact release height in the clip. Your action: release the ball higher or lower than in the clip.',
    success: { label: 'Rebound apex lands in the 15–25 cm band', ok: 'in band', bad: 'misses', test: o => o.apex >= 0.15 && o.apex <= 0.25, zone: { key: 'apex', lo: 0.15, hi: 0.25 } },
  },
  slide: {
    tab: 'Friction slide', kind: s => s.slideMode,
    intro: s => s.slideMode === 'incline'
      ? 'A wooden block is released on a ramp. Unknown: the friction coefficient μ. Your action: the ramp angle.'
      : 'A block moving at 0.4 m/s is pushed for 50 ms and then slides to rest. Unknown: mass and friction μ. Your action: the push force.',
    success: s => s.slideMode === 'incline'
      ? { label: 'Block is in the 40–60 cm zone after 1 s', ok: 'in zone', bad: 'misses', test: o => o.dist >= 0.4 && o.dist <= 0.6, zone: { key: 'dist', lo: 0.4, hi: 0.6 } }
      : { label: 'Block stops in the 6–10 cm zone', ok: 'in zone', bad: 'misses', test: o => o.dist >= 0.06 && o.dist <= 0.10, zone: { key: 'dist', lo: 0.06, hi: 0.10 } },
  },
  com: {
    tab: 'Hidden weight box', kind: () => 'com', weighted: true,
    intro: 'These parcels look the same, but the weight inside sits at different places. The clip is a push through the middle of the back face. Your action: which face you push and where.',
    success: { label: 'Parcel goes straight (turns less than 15°)', ok: 'straight', bad: 'turns', test: o => Math.abs(o.yaw) < 15, zone: { key: 'yaw', lo: -15, hi: 15 } },
  },
};
const successOf = (state) => { const s = SCENES[state.scene].success; return typeof s === 'function' ? s(state) : s; };

const METRICS = {
  grasp: [{ key: 'slip', label: 'Board slip in the fingers', unit: 'mm', scale: 1000, cap: 30, capLabel: '≥30', get: o => o.slip, line: GRASP.slipOk }],
  apple: [
    { key: 'x', label: 'Where the apple ends up (table edge at 50 cm)', unit: 'cm', scale: 100, cap: 110, capLabel: 'far', get: o => o.x, line: TABLE_EDGE },
    { key: 'apex', label: 'First rebound height', unit: 'cm', scale: 100, get: o => o.apex },
  ],
  bounce: [
    { key: 'apex', label: 'Rebound apex height', unit: 'cm', scale: 100, get: o => o.apex },
    { key: 'x2', label: 'Second landing point', unit: 'cm', scale: 100, get: o => o.x2 },
  ],
  incline: [{ key: 'dist', label: 'Distance slid in 1 s', unit: 'cm', scale: 100, get: o => o.dist }],
  push: [{ key: 'dist', label: 'Stop position', unit: 'cm', scale: 100, get: o => o.dist }],
  com: [
    { key: 'yaw', label: 'Final rotation', unit: '°', scale: 1, get: o => o.yaw },
    { key: 'disp', label: 'Distance traveled', unit: 'cm', scale: 100, get: o => Math.hypot(o.x, o.y) },
  ],
};

// ------------------------------------------------------------------ small helpers
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v);
  }
  for (const c of kids) if (c != null) el.append(c);
  return el;
};
const SVGNS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => { const el = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
const fmt = (v, d = 1) => (v == null || !isFinite(v)) ? '–' : (Math.abs(v) < 1e-9 ? '0' : v.toFixed(d));
const quantile = (a, q) => { const b = a.filter(Number.isFinite).sort((x, y) => x - y); if (!b.length) return NaN; const p = (b.length - 1) * q, i = Math.floor(p); return b[i] + (b[Math.min(i + 1, b.length - 1)] - b[i]) * (p - i); };
function niceTicks(lo, hi, n = 5) {
  const span = hi - lo || 1, step0 = span / n, mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= step0);
  const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  out.dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)) + (String(step / mag).includes('.') ? 1 : 0);
  return out;
}
const MB = b => (b / 1048576).toFixed(1);

// ------------------------------------------------------------------ world lists
function worldSet(state, data) {
  const kind = SCENES[state.scene].kind(state);
  const wi = state.world;
  const meta = [];
  const add = (group, i, p) => meta.push({ group, i, p });
  if (kind === 'com') {
    const W = data.com.worlds[wi];
    W.posterior.forEach((p, i) => add('post', i, { cx: p[0], cy: p[1] }));
    data.com.prior.forEach((p, i) => add('prior', i, { cx: p[0], cy: p[1] }));
    add('truth', 0, { cx: W.truth[0], cy: W.truth[1] });
    return { kind, meta, W };
  }
  if (kind === 'apple' || kind === 'grasp') {
    const D = data[kind], W = D.worlds[wi];
    W.posterior.forEach((p, i) => add('post', i, p));
    D.prior_samples.forEach((p, i) => add('prior', i, p));
    add('truth', 0, W.truth);
    return { kind, meta, W, D };
  }
  const base = kind === 'bounce' ? 'bounce' : kind === 'incline' ? 'incline' : 'force_slide';
  const T = data.samples.tasks[`${base}_${state.exc}`];
  const W = T.worlds[wi];
  const ix = n => T.param_names.indexOf(n);
  const conv = p => {
    if (kind === 'bounce') return { e: p[ix('e_eff')], height: p[ix('height')], bias: p[ix('bias')], tau: p[ix('tau')] };
    if (kind === 'incline') return { mu: p[ix('mu')], bias: p[ix('bias')], tau: p[ix('tau')] };
    return { mass: p[ix('mass')], mu: p[ix('mu')], bias: p[ix('bias')], tau: p[ix('tau_1')] };
  };
  W.posterior.forEach((p, i) => add('post', i, conv(p)));
  T.prior.forEach((p, i) => add('prior', i, conv(p)));
  add('truth', 0, conv(W.truth));
  return { kind, meta, T, W };
}

function simWorlds(kind, meta, state) {
  if (kind === 'bounce') return meta.map(m => ({ e: m.p.e, drop: Math.max(0.05, m.p.height + state.dh) }));
  if (kind === 'incline') return meta.map(m => ({ mu: m.p.mu }));
  if (kind === 'push') return meta.map(m => ({ mass: m.p.mass, mu: m.p.mu }));
  if (kind === 'apple') return meta.map(m => ({ e: m.p.e, mass: m.p.mass }));
  if (kind === 'grasp') return meta.map(m => ({ mu: m.p.mu, mass: m.p.mass }));
  return meta.map(m => ({ cx: m.p.cx, cy: m.p.cy }));
}
function simAction(kind, state) {
  if (kind === 'bounce') return { vx: 0.3, duration: 2.6 };
  if (kind === 'incline') return { angle: state.angle, duration: 1.0 };
  if (kind === 'push') return { force: state.force, duration: 3.0 };
  if (kind === 'apple') return { h: state.appleH, vx: state.appleV, x0: APPLE_X0, duration: 3.0 };
  if (kind === 'grasp') return { grip: state.grip, accel: state.accel };
  return { face: state.face, s: state.s };
}
function paramText(kind, p) {
  if (kind === 'bounce') return `e = ${fmt(p.e, 3)}, release height in clip = ${fmt(p.height, 3)} m`;
  if (kind === 'incline') return `μ = ${fmt(p.mu, 3)}`;
  if (kind === 'push') return `mass = ${fmt(p.mass, 3)} kg, μ = ${fmt(p.mu, 3)}`;
  if (kind === 'apple') return `${p.type === 'foam' ? 'foam prop' : 'real apple'}, e = ${fmt(p.e, 2)}, mass = ${fmt(p.mass * 1000, 0)} g`;
  if (kind === 'grasp') return `finger friction μ = ${fmt(p.mu, 2)}, board mass = ${fmt(p.mass * 1000, 0)} g`;
  return `weight offset = (${fmt(p.cx * 100, 1)}, ${fmt(p.cy * 100, 1)}) cm`;
}

// ------------------------------------------------------------------ worker runner (latest request wins)
class Runner {
  constructor(handlers) {
    this.busy = false; this.pending = null; this.id = 0; this.cb = new Map();
    this.worker = new Worker(new URL('./pp_worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev) => {
      const m = ev.data;
      if (m.type === 'progress') return handlers.progress(m);
      if (m.type === 'ready') return handlers.ready(m);
      if (m.type === 'error' && m.id == null) return handlers.error(m.message);
      const fn = this.cb.get(m.id); this.cb.delete(m.id);
      this.busy = false;
      if (fn) fn(m);
      this.flush();
    };
    this.worker.onerror = (e) => handlers.error(e.message || 'worker failed to start');
  }
  request(msg, fn) { this.pending = { msg, fn }; this.flush(); }
  flush() {
    if (this.busy || !this.pending) return;
    const { msg, fn } = this.pending; this.pending = null; this.busy = true;
    const id = ++this.id; this.cb.set(id, fn);
    this.worker.postMessage({ type: 'run', id, ...msg });
  }
}

// ------------------------------------------------------------------ procedural textures
function canvasTex(w, hh, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = hh;
  draw(c.getContext('2d'), w, hh);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
let TEX = null;
function textures() {
  if (TEX) return TEX;
  const rnd = (() => { let x = 7; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
  const wood = (base, dark) => canvasTex(512, 128, (g, w, hh) => {
    g.fillStyle = base; g.fillRect(0, 0, w, hh);
    for (let i = 0; i < 70; i++) {
      const y = rnd() * hh, a = 0.04 + rnd() * 0.08;
      g.strokeStyle = `rgba(${dark},${a})`; g.lineWidth = 0.6 + rnd() * 2.2; g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 70 + i) * 2.5 + (rnd() - 0.5) * 1.5);
      g.stroke();
    }
  }, [1, 1]);
  TEX = {
    oak: wood('#d9b98f', '110,70,30'),
    walnut: wood('#8a5a3b', '40,20,5'),
    pcb: canvasTex(256, 192, (g, w, hh) => {
      g.fillStyle = '#1f6f43'; g.fillRect(0, 0, w, hh);
      g.strokeStyle = 'rgba(190,220,170,0.35)'; g.lineWidth = 2;
      for (let i = 0; i < 18; i++) { g.beginPath(); const y = 20 + rnd() * (hh - 40), x = rnd() * w * 0.4; g.moveTo(x, y); g.lineTo(x + 40 + rnd() * 80, y); g.lineTo(x + 60 + rnd() * 90, y + (rnd() - 0.5) * 50); g.stroke(); }
      g.fillStyle = '#d4a93c'; for (let i = 0; i < 12; i++) g.fillRect(14 + i * 19, hh - 16, 11, 14);
      g.fillStyle = '#e8e8e8'; g.font = '14px sans-serif'; g.fillText('PP-01', 16, 22);
    }),
    cardboard: canvasTex(256, 256, (g, w, hh) => {
      g.fillStyle = '#c49a6c'; g.fillRect(0, 0, w, hh);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,60,30,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * w, rnd() * hh, 1 + rnd() * 3, 1); }
      g.fillStyle = 'rgba(235,222,190,0.95)'; g.fillRect(0, hh * 0.44, w, hh * 0.12);
    }),
  };
  return TEX;
}

// ------------------------------------------------------------------ 3D view
const LOOK = {
  bounce: { color: '#cfdc3a', rough: 0.85 },
  incline: { color: '#ffffff', map: 'walnut', rough: 0.7 },
  push: { color: '#ffffff', map: 'walnut', rough: 0.7 },
  com: { color: '#ffffff', map: 'cardboard', rough: 0.9 },
  apple: { color: '#b8322a', rough: 0.45 },
};

class View3D {
  constructor(host) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor('#f3f4f6');
    host.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#f3f4f6', 6, 16);
    this.camera = new THREE.PerspectiveCamera(38, 1.5, 0.01, 40);
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.12;
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#cfc8bd', 1.5));
    const sun = new THREE.DirectionalLight('#fff6e8', 2.3);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01; sun.shadow.radius = 4;
    this.sun = sun; this.scene.add(sun); this.scene.add(sun.target);
    const fill = new THREE.DirectionalLight('#e8f0ff', 0.6); fill.position.set(3, 2, 2); this.scene.add(fill);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.rigs = []; this.res = null; this.t = 0; this.speed = 1; this.playing = true; this.follow = false;
    this.fpsCount = 0; this.fpsT = performance.now(); this.fps = 0;
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    const loop = () => { this.raf = requestAnimationFrame(loop); this.tick(); };
    this.last = performance.now(); loop();
  }
  resize() {
    const w = this.host.clientWidth || 600, hh = this.host.clientHeight || 400;
    this.renderer.setSize(w, hh, false);
    this.camera.aspect = w / hh; this.camera.updateProjectionMatrix();
  }
  clear() {
    for (const o of [...this.root.children]) { this.root.remove(o); o.traverse(c => { c.geometry?.dispose(); if (c.material && !c.material.userData.shared) c.material.dispose?.(); }); }
    this.rigs = [];
  }
  shadowBox(cx, cy, r) {
    const sc = this.sun.shadow.camera;
    Object.assign(sc, { left: -r, right: r, top: r, bottom: -r, near: 0.1, far: 30 }); sc.updateProjectionMatrix();
    this.sun.position.set(cx - 2.2, cy - 3.0, 5.5); this.sun.target.position.set(cx, cy, 0);
  }
  env(kind, state) {
    const T = textures();
    const add = (geo, mat, pos, opt = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.receiveShadow = opt.recv !== false; m.castShadow = !!opt.cast; if (opt.rot) m.rotation.set(...opt.rot); this.root.add(m); return m; };
    const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, o));
    const floorMat = mat({ color: '#e4e6e9', roughness: 1 });
    const zoneMat = new THREE.MeshBasicMaterial({ color: '#2a78d6', transparent: true, opacity: 0.14, depthWrite: false });
    const lineMat = new THREE.LineBasicMaterial({ color: '#9aa3ad', transparent: true, opacity: 0.6 });
    if (kind === 'bounce') {
      add(new THREE.PlaneGeometry(8, 8), floorMat, [0, 0, -0.03]);
      const oak = T.oak.clone(); oak.needsUpdate = true; oak.repeat.set(1.2, 0.5);
      add(new THREE.BoxGeometry(0.9, 0.4, 0.03), mat({ map: oak, roughness: 0.6 }), [0.15, 0, -0.015], { cast: true });
      const band = add(new THREE.PlaneGeometry(0.7, 0.10), zoneMat, [0.15, 0.06, 0.20 + BALL_R], { recv: false, rot: [Math.PI / 2, 0, 0] });
      band.renderOrder = 0;
      const pts = [];
      for (let z = 0; z <= 1.75001; z += 0.25) pts.push(new THREE.Vector3(-0.32, 0.2, z), new THREE.Vector3(-0.27, 0.2, z));
      pts.push(new THREE.Vector3(-0.32, 0.2, 0), new THREE.Vector3(-0.32, 0.2, 1.75));
      this.root.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
      this.shadowBox(0.15, 0, 1.2);
    } else if (kind === 'incline' || kind === 'push') {
      const len = kind === 'incline' ? 4.2 : 3.0;
      const oak = T.oak.clone(); oak.needsUpdate = true; oak.repeat.set(len / 0.9, 1);
      add(new THREE.BoxGeometry(len, 0.42, 0.04), mat({ map: oak, roughness: 0.55 }), [len / 2 - 0.3, 0, -0.02], { cast: false });
      const z = kind === 'incline' ? [0.4, 0.6] : [0.06, 0.10];
      add(new THREE.PlaneGeometry(z[1] - z[0], 0.42), zoneMat, [(z[0] + z[1]) / 2, 0, 0.0008], { recv: false });
      if (kind === 'push') add(new THREE.PlaneGeometry(10, 10), floorMat, [0, 0, -0.75]);
      this.shadowBox(kind === 'incline' ? 1.6 : 0.5, 0, kind === 'incline' ? 2.4 : 1.2);
    } else if (kind === 'com') {
      const oak = T.oak.clone(); oak.needsUpdate = true; oak.repeat.set(2, 1.4);
      add(new THREE.BoxGeometry(1.6, 1.2, 0.04), mat({ map: oak, roughness: 0.6 }), [0.15, 0, -0.02]);
      this.shadowBox(0.15, 0, 0.8);
    } else if (kind === 'apple') {
      const [hx, hy, hz] = TABLE_HALF;
      const oak = T.oak.clone(); oak.needsUpdate = true; oak.repeat.set(1.3, 1);
      add(new THREE.BoxGeometry(2 * hx, 2 * hy, 2 * hz), mat({ map: oak, roughness: 0.55 }), [0, 0, -hz], { cast: true });
      const legM = mat({ color: '#8b6a48', roughness: 0.7 });
      for (const [x, y] of [[-hx + 0.04, -hy + 0.04], [hx - 0.04, -hy + 0.04], [-hx + 0.04, hy - 0.04], [hx - 0.04, hy - 0.04]])
        add(new THREE.BoxGeometry(0.04, 0.04, -FLOOR_Z - 2 * hz), legM, [x, y, (FLOOR_Z - 2 * hz) / 2], { cast: true });
      add(new THREE.PlaneGeometry(10, 10), floorMat, [0, 0, FLOOR_Z]);
      add(new THREE.PlaneGeometry(0.02, 2 * hy), new THREE.MeshBasicMaterial({ color: '#eb6834', transparent: true, opacity: 0.5 }), [TABLE_EDGE - 0.01, 0, 0.0008], { recv: false });
      this.shadowBox(0.3, 0, 1.4);
    } else if (kind === 'grasp') {
      const oak = T.oak.clone(); oak.needsUpdate = true; oak.repeat.set(1.4, 0.9);
      add(new THREE.BoxGeometry(1.4, 0.9, 0.03), mat({ map: oak, roughness: 0.6 }), [0.18, 0.1, -0.015]);
      add(new THREE.PlaneGeometry(12, 12), floorMat, [0, 0, -0.75]);
      // start and goal marks for the carry
      add(new THREE.PlaneGeometry(0.11, 0.05), zoneMat, [GRASP.move, 0, 0.0008], { recv: false });
      this.shadowBox(0.18, 0, 0.5);
    }
  }
  // one rig per world: list of parts, one per tracked body
  makeRig(kind, m, i, state) {
    const T = textures();
    const parts = [];
    const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6, metalness: 0, transparent: true }, o));
    const part = (objs, opt = {}) => { const g = new THREE.Group(); objs.forEach(o => g.add(o)); g.userData = { ghostable: opt.ghostable !== false }; this.root.add(g); parts.push(g); return g; };
    const mesh = (geo, mat, pos, opt = {}) => { const me = new THREE.Mesh(geo, mat); if (pos) me.position.set(...pos); if (opt.scale) me.scale.set(...opt.scale); me.castShadow = true; me.receiveShadow = true; me.userData.base = mat.color.clone(); return me; };
    if (kind === 'grasp') {
      const [px, py, pz] = PAD_HALF, [bx, by, bz] = BOARD_HALF;
      const metal = std({ color: '#8d949c', roughness: 0.35, metalness: 0.55 }), alu = std({ color: '#c4cad1', roughness: 0.3, metalness: 0.6 }), rub = std({ color: '#2b2d31', roughness: 0.9 }), arm = std({ color: '#e9ecef', roughness: 0.5 });
      part([mesh(new THREE.BoxGeometry(0.04, 0.05, 0.016), metal, [0, 0, pz + 0.022]), mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.14, 24), arm, [0, 0, pz + 0.1])], { ghostable: false });
      parts[0].children[1].rotation.x = Math.PI / 2;
      for (const sgn of [1, -1]) part([mesh(new THREE.BoxGeometry(2 * px, 2 * py, 2 * pz), rub, [0, 0, 0]), mesh(new THREE.BoxGeometry(2 * px + 0.004, 0.005, 0.034), alu, [0, sgn * (py + 0.0025), pz * 0.2 + 0.006])], { ghostable: false });
      const pcb = std({ color: '#ffffff', map: T.pcb, roughness: 0.5 });
      const board = mesh(new THREE.BoxGeometry(2 * bx, 2 * by, 2 * bz), pcb);
      const chip = std({ color: '#1b1d20', roughness: 0.4 });
      const c1 = mesh(new THREE.BoxGeometry(0.018, 0.003, 0.014), chip, [-0.015, -(by + 0.0012), -0.008]);
      const c2 = mesh(new THREE.BoxGeometry(0.01, 0.003, 0.01), chip, [0.02, -(by + 0.0012), -0.012]);
      part([board, c1, c2]);
    } else if (kind === 'apple') {
      const L = LOOK.apple;
      const skin = std({ color: L.color, roughness: L.rough }), stem = std({ color: '#5b3a1e', roughness: 0.8 }), leaf = std({ color: '#3f8a2f', roughness: 0.6 });
      const body = mesh(new THREE.SphereGeometry(APPLE_R, 32, 20), skin, null, { scale: [1, 1, 0.92] });
      const st = mesh(new THREE.CylinderGeometry(0.0022, 0.0028, 0.018, 8), stem, [0, 0, APPLE_R * 0.92 + 0.006]); st.rotation.x = Math.PI / 2;
      const lf = mesh(new THREE.SphereGeometry(0.009, 12, 8), leaf, [0.008, 0, APPLE_R * 0.92 + 0.008], { scale: [1.4, 0.6, 0.18] }); lf.rotation.y = -0.6;
      part([body, st, lf]);
    } else {
      const L = LOOK[kind];
      let geo;
      if (kind === 'bounce') geo = new THREE.SphereGeometry(BALL_R, 32, 20);
      else { const hs = kind === 'com' ? BOX_COM : BOX_SLIDE; geo = new THREE.BoxGeometry(2 * hs[0], 2 * hs[1], 2 * hs[2]); }
      const mat = std({ color: L.color, roughness: L.rough, map: L.map ? T[L.map] : null });
      const objs = [mesh(geo, mat)];
      if (kind === 'com') {
        const lab = mesh(new THREE.PlaneGeometry(0.06, 0.04), std({ color: '#f5f3ee', roughness: 0.9 }), [0.03, -0.01, BOX_COM[2] + 0.0006]);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.009, 14, 10), new THREE.MeshBasicMaterial({ color: '#111111', depthTest: false }));
        dot.position.set(m.p.cx, m.p.cy, 0); dot.renderOrder = 10; dot.userData.com = true;
        objs.push(lab, dot);
      }
      part(objs);
    }
    return { parts, group: m.group, i };
  }
  build(kind, meta, state) {
    this.clear(); this.kind = kind;
    this.env(kind, state);
    meta.forEach((m, i) => this.rigs.push(this.makeRig(kind, m, i, state)));
    if (kind === 'com') {
      const arrow = new THREE.Group();
      const am = new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.4 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.08, 12), am);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.028, 16), am);
      shaft.position.y = -0.054; head.position.y = -0.014; arrow.add(shaft, head);
      this.arrow = arrow; this.root.add(arrow);
    } else this.arrow = null;
    this.frameCamera(kind, state, true);
    this.applyStyle(state);
  }
  frameCamera(kind, state, reset) {
    const c = this.camera, t = this.controls.target;
    const far = Math.max(1, 1.25 / Math.max(0.4, this.camera.aspect));
    let off;
    if (kind === 'bounce') { t.set(0.12, 0, 0.42); off = [0.4, -1.35, 0.12]; }
    else if (kind === 'incline') { const a = (state.angle || 30) * Math.PI / 180; t.set(0.6 * Math.cos(a), 0, -0.6 * Math.sin(a)); off = [0.2, -1.7, 0.6]; }
    else if (kind === 'push') { t.set(0.2, 0, 0); off = [-0.15, -0.9, 0.48]; }
    else if (kind === 'apple') { t.set(0.32, 0, -0.1); off = [0.25, -1.75, 0.75]; }
    else if (kind === 'grasp') { t.set(0.17, 0, 0.07); off = [0.12, -0.62, 0.26]; }
    else { t.set(0.12, 0, 0); off = [-0.32, -0.7, 0.55]; }
    c.position.set(t.x + off[0] * far, t.y + off[1] * far, t.z + off[2] * far);
    if (reset) this.controls.update();
  }
  setIncline(angleDeg) {
    const a = this.kind === 'incline' ? angleDeg * Math.PI / 180 : 0;
    if (this.kind === 'incline' && this.root.rotation.y !== a && !this.follow) {
      const mid = new THREE.Vector3(0.6 * Math.cos(a), 0, -0.6 * Math.sin(a)), d = mid.clone().sub(this.controls.target);
      this.controls.target.add(d); this.camera.position.add(d);
    }
    this.root.rotation.set(0, a, 0);
  }
  applyStyle(state) {
    this.state = state;
    const tint = { post: new THREE.Color(COL.post), prior: new THREE.Color(COL.prior) };
    for (const rig of this.rigs) {
      const { group, i } = rig, sel = i === state.selected, isT = group === 'truth';
      let vis = isT ? state.showTruth : (state.show === 'both' || state.show === group);
      if (sel) vis = true;
      for (const p of rig.parts) {
        p.visible = vis && (sel || isT || p.userData.ghostable);
        p.traverse(o => {
          if (o.userData.com) { o.visible = state.revealCom && (sel || isT); return; }
          if (!o.isMesh) return;
          const mat = o.material, base = o.userData.base;
          const solid = sel || isT;
          mat.opacity = solid ? 1 : 0.32;
          mat.depthWrite = solid;
          mat.color.copy(base);
          if (!solid) mat.color.lerp(tint[group], 0.35);
          if (isT && !sel) mat.color.multiplyScalar(0.78);
          mat.emissive?.set(sel ? '#202020' : '#000000');
          o.castShadow = solid;
          o.renderOrder = solid ? 2 : 1;
        });
      }
    }
  }
  setResult(res, keepTime) { this.res = res; if (!keepTime) this.t = 0; this.drawFrame(); }
  tick() {
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    this.fpsCount++;
    if (now - this.fpsT > 1000) { this.fps = this.fpsCount * 1000 / (now - this.fpsT); this.fpsCount = 0; this.fpsT = now; this.onFps?.(this.fps); }
    if (this.res && this.playing) {
      const T = (this.res.nFrames - 1) / this.res.fps;
      this.t += dt * this.speed;
      if (this.t > T + 0.9) this.t = 0;
      this.drawFrame();
    }
    if (this.follow && this.res && this.state) {
      const p0 = this.rigs[this.state.selected]?.parts.at(-1);
      if (p0) {
        const p = p0.getWorldPosition(new THREE.Vector3());
        const tgt = this.controls.target, off = this.camera.position.clone().sub(tgt);
        tgt.lerp(p, 0.08); this.camera.position.copy(tgt).add(off);
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  drawFrame() {
    const r = this.res; if (!r) return;
    const f = Math.min(r.nFrames - 1, Math.floor(this.t * r.fps)), T = r.tracks || 1, fr = r.frames;
    for (let i = 0; i < this.rigs.length; i++) {
      const parts = this.rigs[i].parts;
      for (let k = 0; k < parts.length && k < T; k++) {
        const o = ((f * r.n + i) * T + k) * 7;
        parts[k].position.set(fr[o], fr[o + 1], fr[o + 2]);
        parts[k].quaternion.set(fr[o + 4], fr[o + 5], fr[o + 6], fr[o + 3]);
      }
    }
    if (this.arrow && this.state) {
      const tt = f / r.fps, sel = this.rigs[this.state.selected].parts[0];
      this.arrow.visible = tt <= PUSH_T1 + 0.02;
      const st = this.state, [hx, hy] = BOX_COM;
      const local = st.face === 'side' ? new THREE.Vector3(st.s * hx, -hy, 0) : new THREE.Vector3(-hx, st.s * hy, 0);
      const dir = st.face === 'side' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      this.arrow.position.copy(local.clone().applyQuaternion(sel.quaternion).add(sel.position));
      this.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.applyQuaternion(sel.quaternion));
      this.arrow.scale.setScalar(tt >= PUSH_T0 ? 1 : 0.6);
    }
    this.onTime?.(f / r.fps);
  }
}

// ------------------------------------------------------------------ charts
function legendRow() {
  return h('div', { class: 'ppg-legend' },
    h('span', {}, h('i', { class: 'ppg-dot', style: `background:${COL.post}` }), 'Posterior (16 worlds)'),
    h('span', {}, h('i', { class: 'ppg-dot', style: `background:${COL.prior}` }), 'Prior (16 worlds)'),
    h('span', {}, h('i', { class: 'ppg-tline' }), 'True world'));
}

function tooltip(root) {
  const tip = h('div', { class: 'ppg-tip' }); root.append(tip);
  return {
    show(evt, html) {
      tip.innerHTML = html; tip.style.display = 'block';
      const r = root.getBoundingClientRect();
      let x = evt.clientX - r.left + 12, y = evt.clientY - r.top + 12;
      if (x + 240 > r.width) x = evt.clientX - r.left - 240;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    },
    hide() { tip.style.display = 'none'; },
  };
}

// strip chart: posterior row, prior row; optional true-world line, observed cross, success zone, threshold line
function stripChart(host, metric, rows, ui, opt = {}) {
  host.innerHTML = '';
  const W = Math.max(280, host.clientWidth || 420), H = 118, L = 74, R = 14, T = 10, B = 30;
  const cap = metric.cap, clampV = v => (cap != null && v * metric.scale > cap) ? cap / metric.scale : v;
  const vals = [...rows.post.map(r => clampV(r.v)), ...rows.prior.map(r => clampV(r.v)), opt.truth != null ? clampV(opt.truth) : NaN, opt.obs ?? NaN,
    ...(opt.zone ? [opt.zone.lo, opt.zone.hi] : []), metric.line ?? NaN].filter(Number.isFinite).map(v => v * metric.scale);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (!isFinite(lo)) { lo = 0; hi = 1; }
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
  const X = v => L + (clampV(v) * metric.scale - lo) / (hi - lo) * (W - L - R);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': metric.label });
  if (opt.zone) svg.append(s('rect', { x: X(opt.zone.lo), y: T - 2, width: Math.max(2, X(opt.zone.hi) - X(opt.zone.lo)), height: H - B - T + 4, class: 'ppg-zone', rx: 4 }));
  const ticks = niceTicks(lo, hi, W < 360 ? 4 : 6);
  for (const tk of ticks) {
    const x = L + (tk - lo) / (hi - lo) * (W - L - R);
    svg.append(s('line', { x1: x, x2: x, y1: T, y2: H - B, class: 'ppg-grid' }));
    const tx = s('text', { x, y: H - B + 16, class: 'ppg-tick', 'text-anchor': 'middle' });
    tx.textContent = (cap != null && Math.abs(tk - cap) < 1e-9) ? metric.capLabel : fmt(tk, ticks.dec); svg.append(tx);
  }
  if (cap != null && hi >= cap) { const x = X(cap / metric.scale); const tx = s('text', { x, y: H - B + 16, class: 'ppg-tick', 'text-anchor': 'middle' }); tx.textContent = metric.capLabel; svg.append(tx); }
  if (metric.line != null) { const x = X(metric.line); svg.append(s('line', { x1: x, x2: x, y1: T - 2, y2: H - B + 2, class: 'ppg-thresh' })); }
  const unit = s('text', { x: W - R, y: H - 2, class: 'ppg-tick', 'text-anchor': 'end' }); unit.textContent = metric.unit; svg.append(unit);
  const rowY = { post: T + 22, prior: T + 58 };
  for (const g of ['post', 'prior']) {
    const lab = s('text', { x: L - 10, y: rowY[g] + 4, class: 'ppg-rowlab', 'text-anchor': 'end' }); lab.textContent = g === 'post' ? 'Posterior' : 'Prior'; svg.append(lab);
    const v = rows[g].map(r => clampV(r.v)).filter(Number.isFinite);
    if (v.length > 1) {
      const a = quantile(v, 0.05), b = quantile(v, 0.95);
      svg.append(s('rect', { x: X(a), y: rowY[g] - 12, width: Math.max(2, X(b) - X(a)), height: 24, rx: 6, fill: COL[g], opacity: 0.1 }));
    }
    const sorted = rows[g].map(r => ({ ...r })).filter(r => Number.isFinite(r.v)).sort((p, q) => clampV(p.v) - clampV(q.v));
    let lastX = -1e9, lane = 0;
    for (const r of sorted) {
      const x = X(r.v); lane = (x - lastX < 5) ? (lane + 1) % 3 : 0; lastX = x;
      const y = rowY[g] + [0, -6, 6][lane];
      const sel = r.idx === ui.selected;
      const c = s('circle', { cx: x, cy: y, r: sel ? 6.5 : 4.6, fill: r.fail ? '#fff' : COL[g], stroke: sel ? '#111' : (r.fail ? COL[g] : '#fff'), 'stroke-width': sel ? 2 : 1.6, class: 'ppg-pt' });
      c.addEventListener('mousemove', e => ui.tip.show(e, r.tip));
      c.addEventListener('mouseleave', () => ui.tip.hide());
      c.addEventListener('click', () => ui.select(r.idx));
      svg.append(c);
    }
  }
  if (Number.isFinite(opt.truth)) {
    const x = X(opt.truth);
    svg.append(s('line', { x1: x, x2: x, y1: T - 2, y2: H - B + 2, class: 'ppg-truth' }));
    const hit = s('rect', { x: x - 6, y: T, width: 12, height: H - B - T, fill: 'transparent', class: 'ppg-pt' });
    hit.addEventListener('mousemove', e => ui.tip.show(e, `<b>True world</b><br>${metric.label}: ${fmt(opt.truth * metric.scale, 1)} ${metric.unit}`));
    hit.addEventListener('mouseleave', () => ui.tip.hide());
    hit.addEventListener('click', () => ui.select(TRUE_IDX));
    svg.append(hit);
  }
  if (Number.isFinite(opt.obs)) {
    const x = X(opt.obs), y = (rowY.post + rowY.prior) / 2;
    svg.append(s('path', { d: `M${x - 6} ${y}L${x + 6} ${y}M${x} ${y - 6}L${x} ${y + 6}`, stroke: COL.obs, 'stroke-width': 2.4 }));
    const tx = s('text', { x: x + 8, y: y + 4, class: 'ppg-tick' }); tx.textContent = 'observed'; svg.append(tx);
  }
  host.append(svg);
}

function clipChart(host, cfg, ui) {
  host.innerHTML = '';
  const W = Math.max(280, host.clientWidth || 420), H = 184, L = 46, R = 12, T = 24, B = 30;
  const { tmin, tmax, curves, obs, window: win, ylab } = cfg;
  const ys = [];
  curves.forEach(c => c.y.forEach(v => Number.isFinite(v) && ys.push(v)));
  obs.forEach(o => ys.push(o[1]));
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (cfg.ymin != null) lo = Math.max(lo, cfg.ymin);
  if (cfg.ymax != null) hi = Math.min(hi, cfg.ymax);
  const pad = (hi - lo) * 0.08 || 0.01; lo -= pad; hi += pad;
  const X = t => L + (t - tmin) / (tmax - tmin) * (W - L - R), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': 'Observed clip' });
  const clip = s('clipPath', { id: ui.uid + 'c' }); clip.append(s('rect', { x: L, y: T, width: W - L - R, height: H - T - B })); svg.append(clip);
  if (win) svg.append(s('rect', { x: X(win[0]), y: T, width: Math.max(2, X(win[1]) - X(win[0])), height: H - T - B, class: 'ppg-window', rx: 4 }));
  const yt = niceTicks(lo * cfg.yscale, hi * cfg.yscale, 4);
  for (const tk0 of yt) {
    const tk = tk0 / cfg.yscale;
    svg.append(s('line', { x1: L, x2: W - R, y1: Y(tk), y2: Y(tk), class: 'ppg-grid' }));
    const tx = s('text', { x: L - 6, y: Y(tk) + 4, class: 'ppg-tick', 'text-anchor': 'end' }); tx.textContent = fmt(tk0, yt.dec); svg.append(tx);
  }
  const xs = cfg.xscale || 1, xt = niceTicks(tmin * xs, tmax * xs, W < 360 ? 4 : 5);
  for (const tk0 of xt) { const tx = s('text', { x: X(tk0 / xs), y: H - B + 16, class: 'ppg-tick', 'text-anchor': 'middle' }); tx.textContent = fmt(tk0, xt.dec); svg.append(tx); }
  const xl = s('text', { x: W - R, y: H - 2, class: 'ppg-tick', 'text-anchor': 'end' }); xl.textContent = cfg.xlab; svg.append(xl);
  const yl = s('text', { x: 4, y: 4, class: 'ppg-tick', 'text-anchor': 'start', 'dominant-baseline': 'hanging' }); yl.textContent = ylab; svg.append(yl);
  const g = s('g', { 'clip-path': `url(#${ui.uid}c)` });
  for (const c of curves) {
    if (c.group === 'truth') continue;
    let d = '';
    c.t.forEach((t, k) => { if (Number.isFinite(c.y[k])) d += (d ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(c.y[k]).toFixed(1); });
    const sel = c.idx === ui.selected;
    g.append(s('path', { d, fill: 'none', stroke: sel ? '#111' : COL[c.group], 'stroke-width': sel ? 2.2 : (c.group === 'post' ? 1.4 : 1.1), opacity: sel ? 1 : (c.group === 'post' ? 0.6 : 0.4) }));
  }
  svg.append(g);
  for (const o of obs) svg.append(s('circle', { cx: X(o[0]), cy: Y(o[1]), r: 2.6, fill: COL.obs, stroke: '#fff', 'stroke-width': 1 }));
  host.append(svg);
}

function comClipChart(host, pts, obs, ui) {
  host.innerHTML = '';
  const W = Math.max(280, host.clientWidth || 420), H = 184, L = 46, R = 12, T = 24, B = 30;
  const xs = [...pts.map(p => p.x), obs.x], ys = [...pts.map(p => p.y), obs.y];
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const px = (x1 - x0) * 0.08 || 1, py = (y1 - y0) * 0.08 || 1; x0 -= px; x1 += px; y0 -= py; y1 += py;
  const X = v => L + (v - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': 'Observed clip outcome' });
  const yt = niceTicks(y0, y1, 4), xt = niceTicks(x0, x1, W < 360 ? 4 : 5);
  for (const tk of yt) {
    svg.append(s('line', { x1: L, x2: W - R, y1: Y(tk), y2: Y(tk), class: 'ppg-grid' }));
    const tx = s('text', { x: L - 6, y: Y(tk) + 4, class: 'ppg-tick', 'text-anchor': 'end' }); tx.textContent = fmt(tk, yt.dec); svg.append(tx);
  }
  for (const tk of xt) {
    svg.append(s('line', { x1: X(tk), x2: X(tk), y1: T, y2: H - B, class: 'ppg-grid' }));
    const tx = s('text', { x: X(tk), y: H - B + 16, class: 'ppg-tick', 'text-anchor': 'middle' }); tx.textContent = fmt(tk, xt.dec); svg.append(tx);
  }
  const xl = s('text', { x: W - R, y: H - 2, class: 'ppg-tick', 'text-anchor': 'end' }); xl.textContent = 'distance traveled (cm)'; svg.append(xl);
  const yl = s('text', { x: 4, y: 4, class: 'ppg-tick', 'dominant-baseline': 'hanging' }); yl.textContent = 'rotation (°)'; svg.append(yl);
  for (const p of pts) {
    const sel = p.idx === ui.selected;
    const c = s('circle', { cx: X(p.x), cy: Y(p.y), r: sel ? 6 : 4.2, fill: COL[p.group], stroke: sel ? '#111' : '#fff', 'stroke-width': sel ? 2 : 1.3, opacity: p.group === 'prior' ? 0.85 : 1, class: 'ppg-pt' });
    c.addEventListener('mousemove', e => ui.tip.show(e, p.tip)); c.addEventListener('mouseleave', () => ui.tip.hide()); c.addEventListener('click', () => ui.select(p.idx));
    svg.append(c);
  }
  const ox = X(obs.x), oy = Y(obs.y);
  svg.append(s('path', { d: `M${ox - 6} ${oy}L${ox + 6} ${oy}M${ox} ${oy - 6}L${ox} ${oy + 6}`, stroke: COL.obs, 'stroke-width': 2.2 }));
  host.append(svg);
}

function clipConfig(ws) {
  const { kind, meta, T, W } = ws;
  const n = 140;
  if (kind === 'bounce') {
    const ts = W.observed.times, tmax = Math.min(1.2, ts[ts.length - 1] + 0.3);
    const tg = Array.from({ length: n + 1 }, (_, k) => tmax * k / n);
    return {
      tmin: 0, tmax, window: [ts[0], ts[ts.length - 1]], xlab: 'time (s)', ylab: 'ball height (cm)', yscale: 100, ymin: -0.02,
      obs: ts.map((t, k) => [t, W.observed.values[k]]),
      curves: meta.map((m, idx) => ({ idx, group: m.group, t: tg, y: tg.map(t => bounceHeight(m.p.e, m.p.height, Math.max(0, t + m.p.tau)) + m.p.bias) })),
    };
  }
  if (kind === 'incline') {
    const ts = W.observed.times, ang = T.config.support_angle_deg;
    const tg = Array.from({ length: n + 1 }, (_, k) => k / n);
    return {
      tmin: 0, tmax: 1, window: [ts[0], ts[ts.length - 1]], xlab: `time (s), ramp ${ang}°`, ylab: 'distance (cm)', yscale: 100,
      ymax: Math.max(...W.observed.values) * 3 + 0.02,
      obs: ts.map((t, k) => [t, W.observed.values[k]]),
      curves: meta.map((m, idx) => ({ idx, group: m.group, t: tg, y: tg.map(t => inclineDist(m.p.mu, ang, Math.max(0, t + m.p.tau)) + m.p.bias) })),
    };
  }
  const ts = W.observed.times, weak = !!T.config.support_force_note?.startsWith('positive clip: 0.2 N for all');
  const force = t => weak ? 0.2 : (t < 0.025 ? 0.2 : 0.8);
  const tg = Array.from({ length: 101 }, (_, k) => 0.05 * k / 100);
  return {
    tmin: 0, tmax: 0.05, window: [ts[0], ts[ts.length - 1]], xlab: weak ? 'time (ms), push 0.2 N' : 'time (ms), push 0.2 N then 0.8 N', xscale: 1000,
    ylab: 'position (mm)', yscale: 1000,
    obs: ts.map((t, k) => [t, W.observed.values[0][k]]),
    curves: meta.map((m, idx) => ({ idx, group: m.group, t: tg, y: slidePositions(m.p.mass, m.p.mu, force, 0.0005, tg.map(t => Math.max(0, t + m.p.tau))).map(v => v + m.p.bias) })),
  };
}

// ------------------------------------------------------------------ main widget
export async function mountPlayground(root, opts = {}) {
  root.classList.add('ppg');
  root.innerHTML = '';
  const uid = 'ppg' + Math.random().toString(36).slice(2, 7);
  const state = {
    scene: SCENES[opts.scene] ? opts.scene : 'grasp', slideMode: 'incline', exc: 'weak', world: 1, show: 'post', showTruth: true, selected: 0,
    revealCom: false, dh: -0.25, angle: 23, force: 0.6, face: 'side', s: 0.0, grip: 0.8, accel: 15, appleH: 0.4, appleV: 0.8,
  };

  const tabs = h('div', { class: 'ppg-tabs', role: 'tablist' });
  const intro = h('p', { class: 'ppg-intro' });
  const tags = h('div', { class: 'ppg-tags' });
  const sentence = h('p', { class: 'ppg-sentence' }, SENTENCE);
  const controls = h('div', { class: 'ppg-controls' });
  const viewHost = h('div', { class: 'ppg-view' });
  const loading = h('div', { class: 'ppg-loading' },
    h('div', { class: 'ppg-load-box' }, h('div', { class: 'ppg-load-txt' }, 'Loading the MuJoCo physics engine (WebAssembly)…'),
      h('div', { class: 'ppg-load-bar' }, h('i')), h('div', { class: 'ppg-load-sub' }, 'Starting download')));
  const viewBar = h('div', { class: 'ppg-viewbar' });
  const status = h('div', { class: 'ppg-status' }, '');
  const right = h('div', { class: 'ppg-right' });
  const succCard = h('div', { class: 'ppg-card ppg-succ' });
  const clipCard = h('div', { class: 'ppg-card' }, h('div', { class: 'ppg-card-title' }, 'Observed clip'), h('div', { class: 'ppg-card-sub' }), h('div', { class: 'ppg-chart' }));
  const outCard = h('div', { class: 'ppg-card' }, h('div', { class: 'ppg-card-title' }, 'Outcome under your action'), h('div', { class: 'ppg-card-sub' }), h('div', { class: 'ppg-charts' }));
  const selInfo = h('div', { class: 'ppg-sel' });
  right.append(legendRow(), succCard, outCard, clipCard, selInfo);
  const viewWrap = h('div', { class: 'ppg-viewwrap' }, viewHost, h('div', { class: 'ppg-badge' }, 'Simulated in your browser (MuJoCo)'), loading);
  const left = h('div', { class: 'ppg-card ppg-left' }, viewWrap, viewBar, status);
  const grid = h('div', { class: 'ppg-grid2' }, left, right);
  root.append(tabs, h('div', { class: 'ppg-card ppg-head' }, intro, tags, sentence, controls), grid);
  const tip = tooltip(root);

  let samples, com, apple, grasp;
  try {
    const j = p => fetch(new URL(p, BASE)).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
    [samples, com, apple, grasp] = await Promise.all([j('data/playground_samples.json'), j('data/com_illustrative.json'), j('data/apple_illustrative.json'), j('data/grasp_illustrative_v2.json')]);
  } catch (e) { return fallback(root, 'Could not load the sample files. Serve this folder over http(s); browsers block file:// fetches.'); }
  const data = { samples, com, apple, grasp };

  let view;
  try { view = new View3D(viewHost); } catch (e) { return fallback(root, 'WebGL is not available in this browser.'); }
  let mjInfo = null, lastRes = null, lastMs = null, ws = null, fps = 0, loadedBytes = 0, totalBytes = 9139270;
  view.onFps = f => { fps = f; renderStatus(); };
  const timeLbl = h('span', { class: 'ppg-time' }, 't = 0.00 s');
  view.onTime = t => { timeLbl.textContent = `t = ${t.toFixed(2)} s`; };

  // loading overlay: progress, and after SLOW_MS a preview picture of the current scene
  const t0 = performance.now();
  const loadSub = loading.querySelector('.ppg-load-sub'), loadBar = loading.querySelector('.ppg-load-bar i'), loadTxt = loading.querySelector('.ppg-load-txt');
  const slowTimer = setTimeout(() => {
    if (mjInfo) return;
    loading.classList.add('is-slow');
    const img = h('img', { class: 'ppg-load-poster', src: new URL(`posters/${state.scene}.jpg`, BASE).href, alt: 'Preview of the live demo' });
    loading.prepend(img);
    loadTxt.textContent = 'Still loading the physics engine. The picture shows what the live demo will look like; it starts by itself when the download finishes.';
  }, SLOW_MS);
  const runner = (() => {
    try {
      return new Runner({
        progress: m => {
          loadedBytes = m.loaded; totalBytes = m.total;
          const pct = Math.min(100, 100 * m.loaded / m.total);
          loadBar.style.width = pct.toFixed(1) + '%';
          loadSub.textContent = `${MB(m.loaded)} of ${MB(m.total)} MB · ${Math.round((performance.now() - t0) / 1000)} s`;
        },
        ready: info => { mjInfo = info; clearTimeout(slowTimer); loadSub.textContent = 'Compiling and running the first simulation…'; loadBar.style.width = '100%'; renderStatus(); rerun(); },
        error: msg => { clearTimeout(slowTimer); status.textContent = 'MuJoCo failed to load: ' + msg; fallback(left, 'MuJoCo WebAssembly could not start here (' + msg + ').', true); },
      });
    } catch (e) { fallback(left, 'This browser cannot start module workers.', true); return null; }
  })();

  function renderStatus() {
    if (!mjInfo) return;
    status.textContent = `MuJoCo ${mjInfo.version} (official WebAssembly build) · 33 worlds per update · ${lastMs != null ? Math.round(lastMs) + ' ms simulation' : 'simulating…'} · ${Math.round(fps)} fps render`;
  }

  // ---------- controls
  function seg(label, options, key, onChange) {
    const wrap = h('div', { class: 'ppg-seg', role: 'group', 'aria-label': label });
    for (const [val, txt, title] of options) {
      const b = h('button', { type: 'button', class: 'ppg-segbtn' + (state[key] === val ? ' is-on' : ''), title: title || '' }, txt);
      b.addEventListener('click', () => { state[key] = val; wrap.querySelectorAll('button').forEach(x => x.classList.toggle('is-on', x === b)); onChange(); });
      wrap.append(b);
    }
    return h('div', { class: 'ppg-ctl' }, h('div', { class: 'ppg-lab' }, label), wrap);
  }
  function slider(label, key, min, max, step, show) {
    const out = h('span', { class: 'ppg-val' }, show(state[key]));
    const inp = h('input', { type: 'range', min, max, step, value: state[key], 'aria-label': label });
    inp.addEventListener('input', () => { state[key] = +inp.value; out.textContent = show(state[key]); rerun(); });
    return h('div', { class: 'ppg-ctl ppg-ctl-slider' }, h('div', { class: 'ppg-lab' }, label, out), inp);
  }
  function check(label, key, onChange) {
    const inp = h('input', { type: 'checkbox' }); inp.checked = state[key];
    inp.addEventListener('change', () => { state[key] = inp.checked; onChange(); });
    return h('label', { class: 'ppg-check' }, inp, label);
  }

  function buildTabs() {
    tabs.innerHTML = '';
    for (const [id, sc] of Object.entries(SCENES)) {
      const b = h('button', { type: 'button', role: 'tab', class: 'ppg-tab' + (state.scene === id ? ' is-on' : ''), 'aria-selected': state.scene === id },
        sc.tab, sc.weighted ? null : h('span', { class: 'ppg-tab-tag' }, 'trained model'));
      b.addEventListener('click', () => { state.scene = id; state.selected = 0; buildTabs(); rebuild(); });
      tabs.append(b);
    }
  }

  function buildControls() {
    controls.innerHTML = '';
    const kind = SCENES[state.scene].kind(state);
    const row1 = h('div', { class: 'ppg-row' });
    if (state.scene === 'slide') row1.append(seg('Scene', [['incline', 'Ramp'], ['push', 'Push on table']], 'slideMode', () => { state.selected = 0; rebuild(); }));
    if (kind === 'bounce' || kind === 'incline' || kind === 'push') row1.append(seg('Observed clip', [['std', 'Standard', 'informative clip'], ['weak', 'Weak', 'short or low-excitation clip: less information']], 'exc', () => rebuild()));
    row1.append(seg('True world', [[0, '1'], [1, '2'], [2, '3']], 'world', () => rebuild()));
    const row2 = h('div', { class: 'ppg-row' });
    if (kind === 'grasp') {
      row2.append(slider('Grip force', 'grip', 0.3, 3, 0.05, v => `${v.toFixed(2)} N`));
      row2.append(slider('Carry acceleration', 'accel', 0, 25, 0.5, v => v === 0 ? 'lift only' : `${v.toFixed(1)} m/s²`));
    }
    if (kind === 'apple') {
      row2.append(slider('Drop height', 'appleH', 0.05, 1.2, 0.05, v => `${Math.round(v * 100)} cm`));
      row2.append(slider('Toss toward the edge', 'appleV', 0, 2, 0.05, v => v === 0 ? 'straight drop' : `${v.toFixed(2)} m/s`));
    }
    if (kind === 'bounce') row2.append(slider('Release offset from the clip', 'dh', -0.6, 0.8, 0.05, v => `${v >= 0 ? '+' : ''}${Math.round(v * 100)} cm`));
    if (kind === 'incline') row2.append(slider('Ramp angle', 'angle', 5, 50, 1, v => `${v}°`));
    if (kind === 'push') row2.append(slider('Push force (50 ms)', 'force', 0, 1.5, 0.02, v => `${v.toFixed(2)} N`));
    if (kind === 'com') {
      row2.append(seg('Push face', [['back', 'Back face'], ['side', 'Side face']], 'face', () => { buildControls(); rerun(); }));
      row2.append(slider('Push point along the face', 's', -0.9, 0.9, 0.05, v => v === 0 ? 'center' : `${Math.round(Math.abs(v) * 100)}% toward ${v < 0 ? (state.face === 'side' ? 'back' : 'right') : (state.face === 'side' ? 'front' : 'left')}`));
    }
    controls.append(row1, row2);
    viewBar.innerHTML = '';
    const play = h('button', { type: 'button', class: 'ppg-btn' }, view.playing ? 'Pause' : 'Play');
    play.addEventListener('click', () => { view.playing = !view.playing; play.textContent = view.playing ? 'Pause' : 'Play'; });
    const replay = h('button', { type: 'button', class: 'ppg-btn' }, 'Replay');
    replay.addEventListener('click', () => { view.t = 0; view.playing = true; play.textContent = 'Pause'; });
    const spd = h('select', { class: 'ppg-select', 'aria-label': 'Playback speed' });
    for (const v of [1, 0.5, 0.25]) spd.append(h('option', { value: v }, `${v}×`));
    spd.value = (kind === 'bounce' || kind === 'com' || kind === 'grasp' || kind === 'apple') ? '0.5' : '1'; view.speed = +spd.value;
    spd.addEventListener('change', () => { view.speed = +spd.value; });
    viewBar.append(
      h('div', { class: 'ppg-vb' }, play, replay, spd, timeLbl),
      h('div', { class: 'ppg-vb' },
        seg('Ghosts', [['post', 'Posterior'], ['prior', 'Prior'], ['both', 'Both']], 'show', () => view.applyStyle(state)),
        check('True world', 'showTruth', () => view.applyStyle(state)),
        kind === 'com' ? check('Reveal weight', 'revealCom', () => view.applyStyle(state)) : null,
        (kind === 'incline' || kind === 'push') ? check('Follow', 'follow', () => { view.follow = state.follow; if (!state.follow) view.frameCamera(kind, state, true); }) : null));
    view.follow = !!state.follow && (kind === 'incline' || kind === 'push');
  }

  function rebuild() {
    const sc = SCENES[state.scene];
    intro.textContent = typeof sc.intro === 'function' ? sc.intro(state) : sc.intro;
    tags.innerHTML = '';
    tags.append(sc.weighted
      ? h('span', { class: 'ppg-illus' }, 'Posterior from weighting simulated worlds by the observed clip')
      : h('span', { class: 'ppg-bench' }, 'Posterior samples from our trained model'));
    ws = worldSet(state, data);
    buildControls();
    view.build(ws.kind, ws.meta, state);
    view.setIncline(state.angle);
    lastRes = null;
    drawClip(); drawOutcomes();
    rerun();
  }

  const ui = {
    uid, tip, get selected() { return state.selected; },
    select(i) { state.selected = i; view.applyStyle(state); drawClip(); drawOutcomes(); },
  };

  function worldTip(i, extra) {
    const m = ws.meta[i];
    const name = m.group === 'truth' ? 'True world' : `${m.group === 'post' ? 'Posterior' : 'Prior'} world ${m.i + 1}`;
    return `<b>${name}</b><br>${paramText(ws.kind, m.p)}${extra ? '<br>' + extra : ''}`;
  }

  function drawClip() {
    const sub = clipCard.querySelector('.ppg-card-sub'), host = clipCard.querySelector('.ppg-chart');
    const k = ws.kind;
    if (k === 'com') {
      const W = ws.W, pts = [];
      W.posterior_clip_outcomes.forEach((o, i) => pts.push({ idx: i, group: 'post', x: Math.hypot(o[1], o[2]) * 100, y: o[0] }));
      com.prior_clip_outcomes.forEach((o, i) => pts.push({ idx: NPOST + i, group: 'prior', x: Math.hypot(o[1], o[2]) * 100, y: o[0] }));
      pts.forEach(p => { p.tip = worldTip(p.idx, `clip: ${fmt(p.y, 1)}°, ${fmt(p.x, 1)} cm`); });
      const ob = W.observed;
      sub.textContent = 'Push through the middle of the back face. Cross: observed outcome (with noise). Dots: what each world does in the same clip.';
      comClipChart(host, pts, { x: Math.hypot(ob.x_m, ob.y_m) * 100, y: ob.yaw_deg }, ui);
      return;
    }
    if (k === 'apple' || k === 'grasp') {
      const W = ws.W, D = ws.D;
      const post = k === 'apple' ? W.posterior_clip_apex_m : W.posterior_clip_slip_m, prior = k === 'apple' ? D.prior_clip_apex_m : D.prior_clip_slip_m;
      const metric = k === 'apple' ? { label: 'rebound of the 5 cm drop', unit: 'mm', scale: 1000 } : { label: 'slip in the lift test', unit: 'mm', scale: 1000, cap: 30, capLabel: '≥30' };
      const rows = { post: post.map((v, i) => ({ v, idx: i, tip: worldTip(i, `clip: ${fmt(v * 1000, 1)} mm`) })), prior: prior.map((v, i) => ({ v, idx: NPOST + i, tip: worldTip(NPOST + i, `clip: ${fmt(v * 1000, 1)} mm`) })) };
      sub.textContent = k === 'apple'
        ? 'Clip: the apple dropped from 5 cm. Cross: observed first rebound (with 2 mm noise). Dots: the same drop in each world.'
        : `Clip: lift test with a 0.8 N grip, no sideways motion. Cross: observed slip (with 2 mm noise)${W.observed.held ? '' : ' — the board fell out'}. Dots: the same lift in each world.`;
      stripChart(host, metric, rows, ui, { obs: k === 'apple' ? W.observed.apex_m : W.observed.slip_m });
      return;
    }
    const cfg = clipConfig(ws);
    const winTxt = k === 'push' ? `${fmt(cfg.window[0] * 1000, 1)}–${fmt(cfg.window[1] * 1000, 1)} ms` : `${fmt(cfg.window[0], 2)}–${fmt(cfg.window[1], 2)} s`;
    sub.textContent = `Dots: noisy observations (shaded window, ${winTxt}). Lines: each world replayed through the benchmark simulator.`;
    clipChart(host, cfg, ui);
  }

  function drawSuccess() {
    succCard.innerHTML = '';
    const spec = successOf(state);
    succCard.append(h('div', { class: 'ppg-card-title' }, 'Will it work?', h('span', { class: 'ppg-succ-goal' }, spec.label)));
    if (!lastRes) { succCard.append(h('div', { class: 'ppg-wait' }, mjInfo ? 'Simulating 33 worlds in MuJoCo…' : 'Waiting for the physics engine…')); return; }
    const outs = lastRes.outcomes;
    const groupRow = (g, label) => {
      const idx = ws.meta.map((m, i) => i).filter(i => ws.meta[i].group === g);
      const ok = idx.map(i => !!spec.test(outs[i]));
      const k = ok.filter(Boolean).length;
      const cells = h('div', { class: 'ppg-cells', 'aria-label': `${k} of ${idx.length} worlds succeed` });
      idx.forEach((i, j) => {
        const c = h('i', { class: 'ppg-cell' + (ok[j] ? ' is-ok' : '') + (i === state.selected ? ' is-sel' : ''), style: `--c:${COL[g]}`, title: `${ws.meta[i].group === 'post' ? 'Posterior' : 'Prior'} world ${ws.meta[i].i + 1}: ${ok[j] ? spec.ok : spec.bad}` });
        c.addEventListener('click', () => ui.select(i));
        cells.append(c);
      });
      return h('div', { class: 'ppg-succ-row' }, h('span', { class: 'ppg-succ-lab' }, label), cells,
        h('span', { class: 'ppg-succ-num' }, h('b', {}, `${Math.round(100 * k / idx.length)}%`), ` ${k} of ${idx.length} ${spec.ok}`));
    };
    const tOk = !!spec.test(outs[TRUE_IDX]);
    succCard.append(groupRow('post', 'Posterior'), groupRow('prior', 'Prior'),
      h('div', { class: 'ppg-succ-row' }, h('span', { class: 'ppg-succ-lab' }, 'True world'),
        h('span', { class: 'ppg-verdict' + (tOk ? ' is-ok' : ' is-bad') }, tOk ? `✓ ${spec.ok}` : `✗ ${spec.bad}`)));
  }

  function drawOutcomes() {
    drawSuccess();
    const host = outCard.querySelector('.ppg-charts'), sub = outCard.querySelector('.ppg-card-sub');
    host.innerHTML = '';
    if (!lastRes) { sub.textContent = actionText(ws.kind); host.append(h('div', { class: 'ppg-wait' }, mjInfo ? 'Simulating 33 worlds in MuJoCo…' : 'The live simulation starts when the physics engine has loaded.')); return; }
    const kind = ws.kind, outs = lastRes.outcomes, spec = successOf(state);
    sub.textContent = actionText(kind) + ' Hollow dots: worlds where it fails.';
    for (const metric of METRICS[kind]) {
      const rows = { post: [], prior: [] };
      outs.forEach((o, i) => {
        const g = ws.meta[i].group; if (g === 'truth') return;
        const v = metric.get(o);
        rows[g].push({ v, idx: i, fail: !spec.test(o), tip: worldTip(i, `${metric.label}: ${fmt(v * metric.scale, 1)} ${metric.unit} · ${spec.test(o) ? spec.ok : spec.bad}`) });
      });
      const truth = metric.get(outs[TRUE_IDX]);
      const pv = rows.post.map(r => r.v * metric.scale), qv = rows.prior.map(r => r.v * metric.scale);
      host.append(h('div', { class: 'ppg-mhead' }, h('span', { class: 'ppg-mname' }, metric.label),
        h('span', { class: 'ppg-msum' }, `true ${fmt(truth * metric.scale, 1)} ${metric.unit} · posterior 90% ${fmt(quantile(pv, .05), 1)}–${fmt(quantile(pv, .95), 1)} · prior ${fmt(quantile(qv, .05), 1)}–${fmt(quantile(qv, .95), 1)}`)));
      const ch = h('div', { class: 'ppg-strip' }); host.append(ch);
      stripChart(ch, metric, rows, ui, { truth, zone: spec.zone && spec.zone.key === metric.key ? { lo: spec.zone.lo / (metric.key === 'yaw' ? 1 : 1), hi: spec.zone.hi } : null });
    }
    const m = ws.meta[state.selected];
    selInfo.innerHTML = '';
    selInfo.append(h('span', {}, h('b', {}, 'Highlighted in 3D: '), (m.group === 'truth' ? 'true world' : `${m.group === 'post' ? 'posterior' : 'prior'} world ${m.i + 1}`) + ' — ' + paramText(kind, m.p) + '. Click any dot or square to highlight another world.'));
  }

  function actionText(kind) {
    if (kind === 'bounce') return `Release ${state.dh >= 0 ? Math.round(state.dh * 100) + ' cm higher' : Math.round(-state.dh * 100) + ' cm lower'} than in the clip, with 0.3 m/s sideways speed.`;
    if (kind === 'incline') return `Ramp at ${state.angle}°, block released at rest.`;
    if (kind === 'push') return `Push of ${state.force.toFixed(2)} N for 50 ms on a block already moving at 0.4 m/s.`;
    if (kind === 'apple') return `Drop from ${Math.round(state.appleH * 100)} cm, ${state.appleV > 0 ? `tossed at ${state.appleV.toFixed(2)} m/s toward the edge 35 cm away` : 'no toss'}.`;
    if (kind === 'grasp') return `Grip ${state.grip.toFixed(2)} N, lift 8 cm, then ${state.accel > 0 ? `carry 35 cm sideways at ${state.accel.toFixed(1)} m/s²` : 'hold'}.`;
    return `${state.face === 'side' ? 'Side' : 'Back'} face, ${state.s === 0 ? 'center' : Math.round(Math.abs(state.s) * 100) + '% off center'}; 1.8 N for 0.4 s. Rotation counts full turns.`;
  }

  let rerunQueued = false;
  function rerun() {
    if (!runner || !mjInfo || !ws || rerunQueued) return;
    rerunQueued = true;
    requestAnimationFrame(() => {
      rerunQueued = false;
      const kind = ws.kind, mySet = ws;
      if (kind === 'incline') view.setIncline(state.angle);
      runner.request({ kind, worlds: simWorlds(kind, ws.meta, state), action: simAction(kind, state) }, (res) => {
        if (res.type === 'error') { status.textContent = 'Simulation error: ' + res.message; return; }
        if (mySet !== ws) return;
        lastRes = res; lastMs = res.wall_ms;
        loading.classList.add('is-done');
        view.setIncline(state.angle);
        view.setResult(res, false);
        renderStatus(); drawOutcomes();
      });
    });
  }

  buildTabs();
  rebuild();
  if (opts.debugHandle) window.__ppg = { state, view };
  let rz; new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => { if (ws) { drawClip(); drawOutcomes(); } }, 120); }).observe(right);
  return { state, view };
}

function fallback(host, msg, keep) {
  const box = h('div', { class: 'ppg-fallback' },
    h('img', { src: new URL('fallback_desktop.png', BASE).href, alt: 'Screenshot of the physics playground' }),
    h('p', {}, msg + ' The image shows the interactive version.'));
  if (keep) { const v = host.querySelector('.ppg-viewwrap'); if (v) v.replaceWith(box); else host.append(box); }
  else { host.innerHTML = ''; host.append(box); }
}

// ------------------------------------------------------------------ auto-init near the viewport
export function autoInit(selector = '#pp-playground, [data-pp-playground]') {
  for (const el of document.querySelectorAll(selector)) {
    if (el.dataset.ppgInit) continue;
    el.dataset.ppgInit = '1';
    const start = () => mountPlayground(el, { scene: el.dataset.scene, debugHandle: el.dataset.debug !== undefined });
    if (!('IntersectionObserver' in window) || el.dataset.eager !== undefined) { start(); continue; }
    if (!el.firstChild) el.append(h('div', { class: 'ppg-pending' }, 'The interactive physics playground starts when you scroll here.'));
    const io = new IntersectionObserver((entries) => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '900px 0px' });
    io.observe(el);
  }
}
autoInit();
