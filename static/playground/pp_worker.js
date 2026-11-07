// Module worker: downloads mujoco.wasm with progress reports, owns the MuJoCo instance and runs all
// 33 worlds of a scene in one model.
import { makeBatch, setRestitutionTable } from './pp_physics.js';

const N_WORLDS = 33; // 16 posterior + 16 prior + 1 true world
const WASM_BYTES = 9139270; // size of vendor/mujoco/mujoco.wasm, used when the server sends no usable length
let mj = null;
const batches = {};

async function fetchWithProgress(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for mujoco.wasm`);
  const len = +res.headers.get('content-length') || 0;
  // with gzip transfer the header holds the compressed size while the stream yields decompressed bytes
  const total = len >= WASM_BYTES * 0.9 ? len : WASM_BYTES;
  if (!res.body || !res.body.getReader) { const b = await res.arrayBuffer(); postMessage({ type: 'progress', loaded: b.byteLength, total }); return b; }
  const reader = res.body.getReader(), chunks = [];
  let loaded = 0, last = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); loaded += value.byteLength;
    const t = performance.now();
    if (t - last > 120) { last = t; postMessage({ type: 'progress', loaded, total }); }
  }
  postMessage({ type: 'progress', loaded, total: Math.max(total, loaded) });
  const out = new Uint8Array(loaded);
  let o = 0; for (const c of chunks) { out.set(c, o); o += c.byteLength; }
  return out.buffer;
}

const ready = (async () => {
  const t0 = performance.now();
  const [wasm, cal, mod] = await Promise.all([
    fetchWithProgress(new URL('./vendor/mujoco/mujoco.wasm', import.meta.url)),
    fetch(new URL('./data/mujoco_calibration.json', import.meta.url)).then(r => r.json()),
    import('./vendor/mujoco/mujoco.js')]);
  const tDl = performance.now();
  mj = await mod.default({ wasmBinary: wasm });
  setRestitutionTable(cal.restitution.table);
  return { version: mj.mj_versionString(), load_ms: performance.now() - t0, download_ms: tDl - t0 };
})();

ready.then(info => postMessage({ type: 'ready', ...info }), err => postMessage({ type: 'error', message: String(err && err.message || err) }));

onmessage = async (ev) => {
  const msg = ev.data;
  if (msg.type !== 'run') return;
  try {
    await ready;
    const b = batches[msg.kind] || (batches[msg.kind] = makeBatch(mj, msg.kind, N_WORLDS));
    const r = b.run(msg.worlds, msg.action, { fps: 60 });
    const frames = r.frames.slice();
    postMessage({ type: 'result', id: msg.id, kind: msg.kind, outcomes: r.outcomes, frames, fps: r.fps, nFrames: r.nFrames, n: N_WORLDS,
      tracks: r.tracks || 1, wall_ms: r.wall_ms }, [frames.buffer]);
  } catch (err) {
    postMessage({ type: 'error', id: msg.id, message: String(err && err.message || err) });
  }
};
