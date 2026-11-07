// PhysPosterior playground physics: MuJoCo (official @mujoco/mujoco WASM) scenes built from
// geometric primitives only. Shared by the browser page and the offline calibration script.
// One MjModel per scene holds N independent bodies (one per world); bodies collide with the
// ground only, never with each other, so a single mj_step advances every world at once.

export const G = 9.81;

// e_eff -> contact damping ratio. Linear spring-damper gives e = exp(-pi z / sqrt(1 - z^2));
// RESTITUTION_TABLE (filled from the calibration run, see README) corrects the residual
// MuJoCo soft-contact bias. Pairs are [measured e, dampratio], sorted by e.
export let RESTITUTION_TABLE = null;
export function setRestitutionTable(t) { RESTITUTION_TABLE = t; }

export function dampFromE(e) {
  e = Math.min(Math.max(e, 0.02), 0.98);
  const T = RESTITUTION_TABLE;
  if (T && T.length > 1) {
    if (e <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++) {
      if (e <= T[i][0]) {
        const [e0, z0] = T[i - 1], [e1, z1] = T[i];
        return z0 + (z1 - z0) * (e - e0) / (e1 - e0);
      }
    }
    return T[T.length - 1][1];
  }
  const l = Math.log(e);
  return -l / Math.sqrt(Math.PI * Math.PI + l * l);
}

export async function loadMujoco(moduleUrl) {
  const mod = await import(moduleUrl);
  return await mod.default();
}

// ---------------------------------------------------------------- scene geometry
export const BALL_R = 0.03;
export const BOX_SLIDE = [0.05, 0.035, 0.025];   // half sizes (m)
export const BOX_COM = [0.10, 0.06, 0.04];       // half sizes (m), hidden-COM box
export const COM_MASS = 0.4, COM_MU = 0.35;      // known for the hidden-COM scene
export const PUSH_FORCE_COM = 1.8, PUSH_T0 = 0.05, PUSH_T1 = 0.45, COM_DURATION = 1.2;
export const SLIDE_PUSH_DURATION = 0.05;         // push window on the table (same length as the clip)

const FREE = '<freejoint/>';

// Chosen from the solver sweep (code/calib2.mjs): bounce e(z) independent of drop height within 1%;
// incline/push within ~2-4% of the benchmark analytic dynamics at about 0.1-0.25 s per 33-world rollout.
export const SOLVER = { bounceDt: 0.00025, bounceOmega: 600, boxDt: 0.002, noslip: 0 };

function xmlBounce(n) {
  let b = '';
  for (let i = 0; i < n; i++) {
    b += `<body name="w${i}" pos="0 0 1"> ${FREE}<geom type="sphere" size="${BALL_R}" mass="0.05" priority="1" condim="1" ` +
      `contype="1" conaffinity="0" solref="-${SOLVER.bounceOmega ** 2} -100" solimp="0.99 0.99 0.001 0.5 2" friction="0 0 0"/></body>`;
  }
  return `<mujoco model="bounce"><option timestep="${SOLVER.bounceDt}" integrator="Euler"/>` +
    `<worldbody><geom name="plate" type="plane" size="3 3 0.1" contype="0" conaffinity="1" condim="1"/>${b}</worldbody></mujoco>`;
}

function xmlBoxes(n, half, mass, name) {
  let b = '';
  const [hx, hy, hz] = half;
  const I = [(hy * hy + hz * hz) / 3, (hx * hx + hz * hz) / 3, (hx * hx + hy * hy) / 3].map(v => (v * mass).toExponential(5));
  for (let i = 0; i < n; i++) {
    b += `<body name="w${i}" pos="0 0 ${hz}"> ${FREE}<inertial pos="0 0 0" mass="${mass}" diaginertia="${I.join(' ')}"/>` +
      `<geom type="box" size="${hx} ${hy} ${hz}" priority="1" condim="3" contype="1" conaffinity="0" friction="0.3 0.005 0.0001" ` +
      `solref="0.004 1" solimp="0.95 0.99 0.001 0.5 2"/></body>`;
  }
  return `<mujoco model="${name}"><option timestep="${SOLVER.boxDt}" integrator="implicitfast" cone="elliptic" impratio="10" noslip_iterations="${SOLVER.noslip}"/>` +
    `<worldbody><geom name="ground" type="plane" size="20 20 0.1" contype="0" conaffinity="1" friction="0.001 0.001 0.0001"/>${b}</worldbody></mujoco>`;
}

// ---------------------------------------------------------------- batch runner
export class Batch {
  constructor(mj, kind, n) {
    this.mj = mj; this.kind = kind; this.n = n;
    const xml = kind === 'bounce' ? xmlBounce(n)
      : kind === 'com' ? xmlBoxes(n, BOX_COM, COM_MASS, 'com')
        : xmlBoxes(n, BOX_SLIDE, 0.1, kind);
    this.model = mj.MjModel.from_xml_string(xml);
    this.data = new mj.MjData(this.model);
    this.mass0 = Array.from({ length: n }, (_, i) => this.model.body_mass[i + 1]);
    this.inertia0 = Array.from({ length: n }, (_, i) => [0, 1, 2].map(k => this.model.body_inertia[3 * (i + 1) + k]));
  }
  dispose() { this.data.delete(); this.model.delete(); }

  // worlds: array (length <= n) of objects with scene parameters; unused slots are parked far away.
  // Returns { outcomes: [...], frames: Float32Array [F, n, 7], fps, nFrames, wall_ms, steps }
  run(worlds, action, opt = {}) {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const { mj, model: m, data: d, n } = this;
    const fps = opt.fps || 60;
    const k = this.kind;
    let duration, dt = m.opt.timestep;
    const active = Math.min(worlds.length, n);
    // ---- parameters first; mj_setConst refreshes derived constants (invweight etc.) after mass / COM edits
    for (let i = 0; i < n; i++) {
      const w = worlds[Math.min(i, active - 1)];
      const gi = i + 1; // geom 0 is the ground; geom i+1 belongs to body i+1
      if (k === 'bounce') {
        const om = SOLVER.bounceOmega;
        m.geom_solref[2 * gi] = -om * om; m.geom_solref[2 * gi + 1] = -2 * dampFromE(w.e) * om;
      } else {
        m.geom_friction[3 * gi] = k === 'com' ? COM_MU : w.mu;
        const mass = k === 'push' ? w.mass : this.mass0[i];
        m.body_mass[i + 1] = mass;
        for (let c = 0; c < 3; c++) m.body_inertia[3 * (i + 1) + c] = this.inertia0[i][c] * mass / this.mass0[i];
        if (k === 'com') { m.body_ipos[3 * (i + 1)] = w.cx; m.body_ipos[3 * (i + 1) + 1] = w.cy; m.body_ipos[3 * (i + 1) + 2] = 0; }
      }
    }
    if (k !== 'bounce') mj.mj_setConst(m, d);
    mj.mj_resetData(m, d);
    const qp = d.qpos, qv = d.qvel;
    for (let i = 0; i < n; i++) {
      const w = worlds[Math.min(i, active - 1)];
      const a = 7 * i, v = 6 * i;
      qp[a + 3] = 1; qp[a + 4] = qp[a + 5] = qp[a + 6] = 0;
      if (k === 'bounce') { qp[a] = 0; qp[a + 1] = 0; qp[a + 2] = BALL_R + w.drop; qv[v] = action.vx ?? 0.3; }
      else {
        const half = k === 'com' ? BOX_COM : BOX_SLIDE;
        qp[a] = 0; qp[a + 1] = 0; qp[a + 2] = half[2] - 0.0002;
        if (k === 'push') qv[v] = 0.4;
      }
      if (i >= active) qp[a + 1] = 1000 + i; // park unused bodies
    }
    const g = m.opt.gravity;
    if (k === 'incline') {
      const th = action.angle * Math.PI / 180;
      g[0] = G * Math.sin(th); g[1] = 0; g[2] = -G * Math.cos(th);
      duration = action.duration ?? 1.0;
    } else { g[0] = 0; g[1] = 0; g[2] = -G; }
    if (k === 'bounce') duration = action.duration ?? 2.0;
    if (k === 'push') duration = action.duration ?? 2.5;
    if (k === 'com') duration = COM_DURATION;
    mj.mj_forward(m, d);

    const steps = Math.round(duration / dt);
    const every = Math.max(1, Math.round(1 / (fps * dt)));
    const nFrames = Math.floor(steps / every) + 1;
    const frames = new Float32Array(nFrames * n * 7);
    const rec = (f) => { frames.set(qp.subarray ? qp.subarray(0, 7 * n) : Array.from(qp).slice(0, 7 * n), f * n * 7); };
    rec(0);
    // per-world trackers
    const st = Array.from({ length: n }, () => ({ bounced: false, apex: 0, prevVz: 0, x2: null, t2: null, stopT: null, yaw: 0, prevYaw: 0 }));
    const xf = d.xfrc_applied, xpos = d.xpos, xmat = d.xmat, xipos = d.xipos;
    let f = 1, nUsed = null;
    for (let s = 1; s <= steps; s++) {
      const t = s * dt;
      if (k === 'push') {
        const on = t <= SLIDE_PUSH_DURATION;
        for (let i = 0; i < active; i++) xf[6 * (i + 1)] = on ? action.force : 0;
      } else if (k === 'com') {
        const on = t >= PUSH_T0 && t <= PUSH_T1;
        for (let i = 0; i < active; i++) {
          const o = 6 * (i + 1);
          if (!on) { for (let c = 0; c < 6; c++) xf[o + c] = 0; continue; }
          // body-frame contact point and push direction
          const [hx, hy] = BOX_COM;
          let p, fb;
          if (action.face === 'side') { p = [action.s * hx, -hy, 0]; fb = [0, 1, 0]; } else { p = [-hx, action.s * hy, 0]; fb = [1, 0, 0]; }
          const R = 9 * (i + 1), b3 = 3 * (i + 1);
          const pw = [0, 1, 2].map(r => xpos[b3 + r] + xmat[R + 3 * r] * p[0] + xmat[R + 3 * r + 1] * p[1] + xmat[R + 3 * r + 2] * p[2]);
          const Fw = [0, 1, 2].map(r => PUSH_FORCE_COM * (xmat[R + 3 * r] * fb[0] + xmat[R + 3 * r + 1] * fb[1]));
          const rr = [pw[0] - xipos[b3], pw[1] - xipos[b3 + 1], pw[2] - xipos[b3 + 2]];
          xf[o] = Fw[0]; xf[o + 1] = Fw[1]; xf[o + 2] = 0;
          xf[o + 3] = rr[1] * Fw[2] - rr[2] * Fw[1];
          xf[o + 4] = rr[2] * Fw[0] - rr[0] * Fw[2];
          xf[o + 5] = rr[0] * Fw[1] - rr[1] * Fw[0];
        }
      }
      mj.mj_step(m, d);
      if (k === 'bounce') {
        for (let i = 0; i < active; i++) {
          const z = qp[7 * i + 2] - BALL_R, vz = qv[6 * i + 2], S = st[i];
          if (!S.bounced) { if (S.prevVz < 0 && vz > 0) S.bounced = true; }
          else if (S.x2 === null) {
            if (z > S.apex) S.apex = z;
            if (S.prevVz < 0 && vz >= 0 && z < 0.002) { S.x2 = qp[7 * i]; S.t2 = t; }
          }
          S.prevVz = vz;
        }
      } else if (k === 'com') {
        // unwrapped yaw: accumulate the wrapped increment each step, so spins beyond 180 degrees are counted
        for (let i = 0; i < active; i++) {
          const a = 7 * i, y = 2 * Math.atan2(qp[a + 6], qp[a + 3]), S = st[i];
          let dy = y - S.prevYaw; dy -= 2 * Math.PI * Math.round(dy / (2 * Math.PI));
          S.yaw += dy; S.prevYaw = y;
        }
      } else if (k === 'push') {
        for (let i = 0; i < active; i++) if (st[i].stopT === null && t > SLIDE_PUSH_DURATION && Math.abs(qv[6 * i]) < 1e-3) st[i].stopT = t;
      }
      if (s % every === 0 && f < nFrames) rec(f++);
      if (opt.earlyStop !== false && s % every === 0) {
        let done = true;
        if (k === 'push') { for (let i = 0; i < active; i++) if (st[i].stopT === null) { done = false; break; } }
        else if (k === 'com') {
          if (t < PUSH_T1 + 0.05) done = false;
          else for (let i = 0; i < active; i++) { const v = 6 * i; if (Math.hypot(qv[v], qv[v + 1]) > 2e-3 || Math.abs(qv[v + 5]) > 2e-2) { done = false; break; } }
        }
        else if (k === 'bounce') { for (let i = 0; i < active; i++) if (st[i].x2 === null) { done = false; break; } }
        else done = false;
        if (done) { nUsed = f; break; }
      }
    }
    if (nUsed === null) nUsed = f;
    const outcomes = [];
    for (let i = 0; i < active; i++) {
      const a = 7 * i;
      if (k === 'bounce') outcomes.push({ apex: st[i].apex, x2: st[i].x2, t2: st[i].t2 });
      else if (k === 'incline') outcomes.push({ dist: qp[a] });
      else if (k === 'push') outcomes.push({ dist: qp[a], stopped: st[i].stopT !== null });
      else {
        outcomes.push({ yaw: st[i].yaw * 180 / Math.PI, x: qp[a], y: qp[a + 1] });
      }
    }
    const t1 = (typeof performance !== 'undefined' ? performance : Date).now();
    return { outcomes, frames: frames.subarray(0, nUsed * n * 7), fps: 1 / (every * dt), nFrames: nUsed, steps, wall_ms: t1 - t0 };
  }
}

// ---------------------------------------------------------------- benchmark clip (analytic reference)
// Same formulas as the benchmark generator (physposterior reference_dynamics); used only to draw
// the observed clip and show that posterior worlds reproduce it.
export function bounceHeight(e, h, t) {
  let tt = t, v = 0, z = h;
  const t1 = Math.sqrt(2 * h / G);
  if (t < t1) return h - 0.5 * G * t * t;
  tt = t - t1; v = e * G * t1;
  for (let k = 0; k < 200; k++) {
    const T = 2 * v / G;
    if (tt < T) return v * tt - 0.5 * G * tt * tt;
    tt -= T; v *= e;
    if (v < 1e-4) return 0;
  }
  return z * 0;
}

export function inclineDist(mu, angleDeg, t) {
  const a = angleDeg * Math.PI / 180;
  const acc = Math.max(G * (Math.sin(a) - mu * Math.cos(a)), 0);
  return 0.5 * acc * t * t;
}

// Coulomb slide with piecewise-constant force, v0 = 0.4 m/s, like coulomb_slide in the benchmark.
export function slidePositions(mass, mu, forceFn, dt, times) {
  let x = 0, v = 0.4, t = 0;
  const out = [];
  let j = 0;
  const tmax = times[times.length - 1] + dt;
  while (t <= tmax && j < times.length) {
    while (j < times.length && times[j] <= t + 1e-12) { out.push(x); j++; }
    const drive = forceFn(t) / mass;
    let acc;
    if (v === 0) acc = Math.sign(drive) * Math.max(Math.abs(drive) - mu * G, 0);
    else acc = drive - Math.sign(v) * mu * G;
    let nv = v + acc * dt;
    if (v !== 0 && Math.sign(nv) !== Math.sign(v) && Math.abs(drive) <= mu * G) {
      const tc = -v / acc; x += v * tc + 0.5 * acc * tc * tc; v = 0;
    } else { x += v * dt + 0.5 * acc * dt * dt; v = nv; }
    t += dt;
  }
  while (out.length < times.length) out.push(x);
  return out;
}

// ================================================================ application scenes (v2)
// Apple drop and grasp slip. Same conventions as Batch: one model, N independent worlds,
// run(worlds, action) -> { outcomes, frames [F, N*tracks, 7] (xpos + xquat), tracks, fps, nFrames }.
export const APPLE_R = 0.04, TABLE_HALF = [0.5, 0.35, 0.02], TABLE_EDGE = 0.5, APPLE_X0 = 0.15, FLOOR_Z = -0.75;
export const APPLE_MU = 0.6, APPLE_ROLL = 0.004;

export function makeBatch(mj, kind, n) {
  if (kind === 'apple') return new AppleBatch(mj, n);
  if (kind === 'grasp') return new GraspBatch(mj, n);
  return new Batch(mj, kind, n);
}

const now = () => (typeof performance !== 'undefined' ? performance : Date).now();

class AppleBatch {
  constructor(mj, n) {
    this.mj = mj; this.kind = 'apple'; this.n = n; this.tracks = 1;
    let b = '';
    for (let i = 0; i < n; i++) {
      b += `<body name="a${i}" pos="0 0 0.5">${FREE}<geom type="sphere" size="${APPLE_R}" mass="0.2" priority="1" condim="6" contype="1" conaffinity="0" ` +
        `solref="-${SOLVER.bounceOmega ** 2} -100" solimp="0.99 0.99 0.001 0.5 2" friction="${APPLE_MU} ${APPLE_ROLL} ${APPLE_ROLL}"/></body>`;
    }
    const [hx, hy, hz] = TABLE_HALF;
    const xml = `<mujoco model="apple"><option timestep="${SOLVER.bounceDt}" integrator="Euler" cone="elliptic"/><worldbody>` +
      `<geom name="table" type="box" size="${hx} ${hy} ${hz}" pos="0 0 ${-hz}" contype="0" conaffinity="1"/>` +
      `<geom name="floor" type="plane" size="5 5 0.1" pos="0 0 ${FLOOR_Z}" contype="0" conaffinity="1"/>${b}</worldbody></mujoco>`;
    this.model = mj.MjModel.from_xml_string(xml);
    this.data = new mj.MjData(this.model);
    this.mass0 = 0.2; this.inertia0 = [0, 1, 2].map(k => this.model.body_inertia[3 + k]);
  }
  dispose() { this.data.delete(); this.model.delete(); }
  // worlds: {e, mass}; action: {h (release height above table), vx (toss speed toward the edge), x0}
  run(worlds, action, opt = {}) {
    const t0 = now(), { mj, model: m, data: d, n } = this, active = Math.min(worlds.length, n);
    for (let i = 0; i < n; i++) {
      const w = worlds[Math.min(i, active - 1)], gi = i + 2, om = SOLVER.bounceOmega;
      m.geom_solref[2 * gi] = -om * om; m.geom_solref[2 * gi + 1] = -2 * dampFromE(w.e) * om;
      m.body_mass[i + 1] = w.mass;
      for (let c = 0; c < 3; c++) m.body_inertia[3 * (i + 1) + c] = this.inertia0[c] * w.mass / this.mass0;
    }
    mj.mj_setConst(m, d); mj.mj_resetData(m, d);
    const qp = d.qpos, qv = d.qvel;
    for (let i = 0; i < n; i++) {
      const a = 7 * i;
      qp[a] = action.x0 ?? APPLE_X0; qp[a + 1] = i < active ? 0 : 1000 + i; qp[a + 2] = APPLE_R + action.h; qp[a + 3] = 1;
      qv[6 * i] = action.vx ?? 0;
    }
    mj.mj_forward(m, d);
    const dt = m.opt.timestep, duration = action.duration ?? 3.0, steps = Math.round(duration / dt);
    const every = Math.max(1, Math.round(1 / ((opt.fps || 60) * dt))), nF = Math.floor(steps / every) + 1;
    const frames = new Float32Array(nF * n * 7), xp = d.xpos, xq = d.xquat;
    const rec = f => { for (let i = 0; i < n; i++) { const o = (f * n + i) * 7, b = i + 1; for (let c = 0; c < 3; c++) frames[o + c] = xp[3 * b + c]; for (let c = 0; c < 4; c++) frames[o + 3 + c] = xq[4 * b + c]; } };
    rec(0);
    const st = Array.from({ length: n }, () => ({ bounced: false, apex: 0, prevVz: 0, rest: null }));
    let f = 1, used = null;
    for (let s = 1; s <= steps; s++) {
      mj.mj_step(m, d);
      const t = s * dt;
      for (let i = 0; i < active; i++) {
        const z = qp[7 * i + 2] - APPLE_R, vz = qv[6 * i + 2], S = st[i];
        if (!S.bounced) { if (S.prevVz < 0 && vz > 0) S.bounced = true; }
        else if (S.prevVz >= 0 && vz < 0 && S.apex === 0) S.apex = Math.max(z, 1e-6);
        S.prevVz = vz;
        if (S.rest === null && t > 0.2) {
          const sp = Math.hypot(qv[6 * i], qv[6 * i + 1], qv[6 * i + 2]);
          if ((sp < 2e-3 && z < 0.002) || qp[7 * i + 2] < FLOOR_Z + APPLE_R + 0.01) S.rest = t;
        }
      }
      if (s % every === 0 && f < nF) {
        rec(f++);
        if (opt.earlyStop !== false) { let done = true; for (let i = 0; i < active; i++) if (st[i].rest === null) { done = false; break; } if (done) { used = f; break; } }
      }
    }
    if (used === null) used = f;
    const outcomes = [];
    for (let i = 0; i < active; i++) {
      const x = qp[7 * i], z = qp[7 * i + 2];
      outcomes.push({ apex: st[i].apex, x, onTable: z > -0.05 && x < TABLE_EDGE, success: z > -0.05 && x < TABLE_EDGE });
    }
    return { outcomes, frames: frames.subarray(0, used * n * 7), tracks: 1, fps: 1 / (every * dt), nFrames: used, steps, wall_ms: now() - t0 };
  }
}

// Two-finger gripper holding a thin upright board (PCB-like) by its top edge.
// Hand: slide joints x, z with prescribed position and velocity (kinematic). Fingers: slide joints along y,
// squeezed by motors with force F. Unknown per world: finger-board friction mu, board mass.
export const BOARD_HALF = [0.045, 0.0016, 0.03], PAD_HALF = [0.012, 0.004, 0.016];
export const GRASP = { settle: 0.3, liftT0: 0.3, liftT1: 0.75, lift: 0.08, moveT0: 0.85, move: 0.35, hold: 0.35, slipOk: 0.006 };
const minjerk = u => { u = Math.min(1, Math.max(0, u)); return u * u * u * (10 - 15 * u + 6 * u * u); };
const minjerkV = u => (u <= 0 || u >= 1) ? 0 : 30 * u * u * (1 - u) * (1 - u);

export function handTrajectory(t, accel) {
  const G_ = GRASP;
  const Tl = G_.liftT1 - G_.liftT0, ul = (t - G_.liftT0) / Tl;
  const z = G_.lift * minjerk(ul), vz = G_.lift * minjerkV(ul) / Tl;
  let x = 0, vx = 0;
  if (accel > 0) {
    const T1 = Math.sqrt(G_.move / accel), tau = t - G_.moveT0;
    if (tau <= 0) { x = 0; vx = 0; }
    else if (tau < T1) { x = 0.5 * accel * tau * tau; vx = accel * tau; }
    else if (tau < 2 * T1) { const r = 2 * T1 - tau; x = G_.move - 0.5 * accel * r * r; vx = accel * r; }
    else { x = G_.move; vx = 0; }
  }
  return { x, z, vx, vz };
}
export function graspDuration(accel) { return accel > 0 ? GRASP.moveT0 + 2 * Math.sqrt(GRASP.move / accel) + GRASP.hold : GRASP.liftT1 + GRASP.hold; }

class GraspBatch {
  constructor(mj, n) {
    this.mj = mj; this.kind = 'grasp'; this.n = n; this.tracks = 4; // hand, left finger, right finger, board
    const [bx, by, bz] = BOARD_HALF, [px, py, pz] = PAD_HALF;
    const handZ = 2 * bz - pz - 0.002; // pads cover the top 3 cm of the board
    this.handZ = handZ;
    let b = '', pairs = '', act = '';
    // pads: a horizontal capsule (line contact, 2 contact points) or a box (4 points)
    const padGeom = name => GRASP_PAD === 'capsule'
      ? `<geom name="${name}" type="capsule" fromto="${-px} 0 0 ${px} 0 0" size="${py}" mass="0.03" contype="0" conaffinity="0"/>`
      : `<geom name="${name}" type="box" size="${px} ${py} ${pz}" mass="0.03" contype="0" conaffinity="0"/>`;
    for (let i = 0; i < n; i++) {
      const y0 = by + py + 0.0015;
      b += `<body name="h${i}" pos="0 0 ${handZ}" gravcomp="1"><joint name="hx${i}" type="slide" axis="1 0 0"/><joint name="hz${i}" type="slide" axis="0 0 1"/>` +
        `<geom type="box" size="0.02 0.03 0.008" pos="0 0 ${pz + 0.012}" mass="5" contype="0" conaffinity="0"/>` +
        `<body name="fl${i}" pos="0 ${y0} 0" gravcomp="1"><joint name="jl${i}" type="slide" axis="0 1 0" range="-0.004 0.02" damping="1" armature="0.001"/>` +
        padGeom(`pl${i}`) + `</body>` +
        `<body name="fr${i}" pos="0 ${-y0} 0" gravcomp="1"><joint name="jr${i}" type="slide" axis="0 1 0" range="-0.02 0.004" damping="1" armature="0.001"/>` +
        padGeom(`pr${i}`) + `</body></body>` +
        `<body name="b${i}" pos="0 0 ${bz}">${FREE}<geom name="bd${i}" type="box" size="${bx} ${by} ${bz}" mass="0.05" contype="0" conaffinity="0"/></body>`;
      pairs += `<pair geom1="pl${i}" geom2="bd${i}" condim="${GRASP_CONDIM}" friction="0.5 0.5 0.004 0 0"/><pair geom1="pr${i}" geom2="bd${i}" condim="${GRASP_CONDIM}" friction="0.5 0.5 0.004 0 0"/>` +
        `<pair geom1="bd${i}" geom2="table" condim="3" friction="0.6 0.6 0.005 0 0"/>`;
      act += `<motor joint="jl${i}" gear="-1" ctrlrange="0 10"/><motor joint="jr${i}" gear="1" ctrlrange="0 10"/>`;
    }
    const xml = `<mujoco model="grasp"><option timestep="${GRASP_DT}" integrator="implicitfast" cone="elliptic" impratio="10" noslip_iterations="${GRASP_NOSLIP}" solver="${GRASP_SOLVER}"><flag island="${GRASP_ISLAND}"/></option>` +
      `<worldbody><geom name="table" type="plane" size="5 5 0.1" contype="0" conaffinity="0"/>${b}</worldbody>` +
      `<contact>${pairs}</contact><actuator>${act}</actuator></mujoco>`;
    this.model = mj.MjModel.from_xml_string(xml);
    this.data = new mj.MjData(this.model);
    const m = this.model;
    this.adr = Array.from({ length: n }, (_, i) => ({
      hx: m.jnt_qposadr[5 * i], hz: m.jnt_qposadr[5 * i + 1], bq: m.jnt_qposadr[5 * i + 4],
      vhx: m.jnt_dofadr[5 * i], vhz: m.jnt_dofadr[5 * i + 1], bv: m.jnt_dofadr[5 * i + 4],
      body: [1 + 4 * i, 2 + 4 * i, 3 + 4 * i, 4 + 4 * i],
    }));
    // the compiler may reorder <pair> elements: map finger-board pairs to worlds through their geoms
    this.fingerPairs = Array.from({ length: n }, () => []);
    for (let p = 0; p < m.npair; p++) {
      for (const g of [m.pair_geom1[p], m.pair_geom2[p]]) {
        const bid = m.geom_bodyid[g];
        if (bid > 0 && ((bid - 1) % 4 === 1 || (bid - 1) % 4 === 2)) { this.fingerPairs[Math.floor((bid - 1) / 4)].push(p); break; }
      }
    }
    if (this.fingerPairs.some(a => a.length !== 2)) throw new Error('grasp pair mapping failed');
    this.mass0 = m.body_mass[4]; this.inertia0 = [0, 1, 2].map(k => m.body_inertia[3 * 4 + k]);
  }
  dispose() { this.data.delete(); this.model.delete(); }
  // worlds: {mu, mass}; action: {grip (N), accel (m/s^2, 0 = lift only)}
  run(worlds, action, opt = {}) {
    const t0 = now(), { mj, model: m, data: d, n } = this, active = Math.min(worlds.length, n);
    for (let i = 0; i < n; i++) {
      const w = worlds[Math.min(i, active - 1)];
      for (const p of this.fingerPairs[i]) { m.pair_friction[5 * p] = w.mu; m.pair_friction[5 * p + 1] = w.mu; m.pair_friction[5 * p + 2] = w.mu * 0.008; }
      const bb = this.adr[i].body[3];
      m.body_mass[bb] = w.mass;
      for (let c = 0; c < 3; c++) m.body_inertia[3 * bb + c] = this.inertia0[c] * w.mass / this.mass0;
    }
    mj.mj_setConst(m, d); mj.mj_resetData(m, d);
    const qp = d.qpos, qv = d.qvel, ctrl = d.ctrl;
    for (let i = 0; i < n; i++) {
      const A = this.adr[i];
      if (i >= active) { qp[A.bq + 1] = 1000 + i; }
    }
    // park inactive worlds far away in y via the board; their hands are irrelevant
    const accel = action.accel || 0, duration = graspDuration(accel);
    const dt = m.opt.timestep, steps = Math.round(duration / dt);
    const every = Math.max(1, Math.round(1 / ((opt.fps || 60) * dt))), nF = Math.floor(steps / every) + 1;
    const T = this.tracks, frames = new Float32Array(nF * n * T * 7), xp = d.xpos, xq = d.xquat;
    const rec = f => {
      for (let i = 0; i < n; i++) for (let k = 0; k < T; k++) {
        const o = ((f * n + i) * T + k) * 7, b = this.adr[i].body[k];
        for (let c = 0; c < 3; c++) frames[o + c] = xp[3 * b + c];
        for (let c = 0; c < 4; c++) frames[o + 3 + c] = xq[4 * b + c];
      }
    };
    const grip = t => action.grip * Math.min(1, t / 0.15);
    const setHand = t => {
      const h = handTrajectory(t, accel);
      for (let i = 0; i < active; i++) {
        const A = this.adr[i];
        qp[A.hx] = h.x; qp[A.hz] = h.z; qv[A.vhx] = h.vx; qv[A.vhz] = h.vz;
        ctrl[2 * i] = ctrl[2 * i + 1] = grip(t);
      }
    };
    setHand(0); mj.mj_forward(m, d); rec(0);
    let ref = null, f = 1;
    const rel = (i) => { const A = this.adr[i]; return [qp[A.bq] - qp[A.hx], qp[A.bq + 2] - qp[A.hz]]; };
    const maxSlip = new Float64Array(active);
    for (let s = 1; s <= steps; s++) {
      const t = s * dt;
      setHand(t);
      mj.mj_step(m, d);
      if (ref === null && t >= GRASP.liftT0) ref = Array.from({ length: active }, (_, i) => rel(i));
      if (ref) for (let i = 0; i < active; i++) { const r = rel(i); maxSlip[i] = Math.max(maxSlip[i], Math.hypot(r[0] - ref[i][0], r[1] - ref[i][1])); }
      if (s % every === 0 && f < nF) rec(f++);
    }
    const outcomes = [];
    for (let i = 0; i < active; i++) {
      const r = rel(i), slip = Math.hypot(r[0] - ref[i][0], r[1] - ref[i][1]);
      const dropped = slip > 0.03;
      outcomes.push({ slip, maxSlip: maxSlip[i], dropped, success: slip < GRASP.slipOk });
    }
    return { outcomes, frames: frames.subarray(0, f * n * T * 7), tracks: T, fps: 1 / (every * dt), nFrames: f, steps, wall_ms: now() - t0 };
  }
}
export let GRASP_NOSLIP = 0, GRASP_DT = 0.003; // compute server sweep (code/grasp_sweep.mjs): 145/145 agreement with the static slip bound at 3 ms
export function setGraspDt(v) { GRASP_DT = v; }
export let GRASP_SOLVER = 'Newton', GRASP_ISLAND = 'enable', GRASP_PAD = 'box', GRASP_CONDIM = 4;
export function setGraspPad(p, c) { GRASP_PAD = p; GRASP_CONDIM = c; }
export function setGraspSolver(sv, isl) { GRASP_SOLVER = sv; GRASP_ISLAND = isl; }
export function setGraspNoslip(v) { GRASP_NOSLIP = v; }
