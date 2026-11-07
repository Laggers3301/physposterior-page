/* "Change the physics, see what happens": scatter of executed worlds (friction x board mass) for the assembly task,
   with the selected run's third-person and head-camera clips on one clock. Data: static/data/asm_posterior.js. */
(function () {
  "use strict";
  var D = window.PP_ASM, root = document.getElementById("asmx");
  if (!D || !root || !window.PPSync) return;
  var $ = function (id) { return document.getElementById(id); };
  var svg = $("asmx-plot"), head = $("asmx-head"), info = $("asmx-info"), dsBox = $("asmx-ds");
  var vShow = $("asmx-show"), vHead = $("asmx-headcam"), stage = $("asmx-stage");
  var grp = window.PPSync.create(stage, [vShow, vHead], {});
  var X0 = 0.15, X1 = 1.15, Y0 = 19, Y1 = 41, W = 520, H = 380, L = 54, R = 14, T = 14, BOT = 46;
  var sx = function (x) { return L + (x - X0) / (X1 - X0) * (W - L - R); };
  var sy = function (y) { return T + (1 - (y - Y0) / (Y1 - Y0)) * (H - T - BOT); };
  var NS = "http://www.w3.org/2000/svg";
  var mode = "w15", selW = null, selRun = null;
  var pct = function (x) { return Math.round(100 * x) + "%"; };
  var FAIL = { IN_HAND_SLIP: "board slips in the gripper", GATE_FAILED: "seat check fails", null: "" };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }
  function axes() {
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var g = el("g", { "class": "ax" }, svg);
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (x) {
      el("line", { x1: sx(x), x2: sx(x), y1: T, y2: H - BOT, "class": "grid" }, g);
      el("text", { x: sx(x), y: H - BOT + 16, "text-anchor": "middle" }, g).textContent = x.toFixed(1);
    });
    [20, 25, 30, 35, 40].forEach(function (y) {
      el("line", { x1: L, x2: W - R, y1: sy(y), y2: sy(y), "class": "grid" }, g);
      el("text", { x: L - 8, y: sy(y) + 4, "text-anchor": "end" }, g).textContent = y;
    });
    el("text", { x: (L + W - R) / 2, y: H - 8, "text-anchor": "middle", "class": "lab" }, g).textContent = "finger–board friction μ";
    var yl = el("text", { x: 14, y: (T + H - BOT) / 2, "text-anchor": "middle", "class": "lab", transform: "rotate(-90 14 " + (T + H - BOT) / 2 + ")" }, g);
    yl.textContent = "board mass (g)";
    return el("g", {}, svg);
  }
  function mark(g, p, kind, onclick) {
    var x = sx(p.mu), y = sy(p.mass_g), c = p.ok ? "ok" : "bad", e;
    if (kind === "truth") e = el("path", { d: star(x, y, 9, 4), "class": "pt " + c + " truth" }, g);
    else if (kind === "prior") e = el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, "class": "pt " + c + " prior" }, g);
    else e = el("circle", { cx: x, cy: y, r: 5.5, "class": "pt " + c + " post" }, g);
    if (p.clip) { e.classList.add("has-clip"); el("circle", { cx: x, cy: y, r: kind === "truth" ? 13 : 10, "class": "clip-ring" }, g); }
    if (selRun && selRun === p) e.classList.add("sel");
    var t = el("title", {}, e);
    t.textContent = (kind === "truth" ? "true world" : kind === "prior" ? "prior draw" : "posterior draw") + ": μ " + p.mu.toFixed(2) + ", " + p.mass_g.toFixed(1) + " g, " +
      (p.ok ? "success" : "failure" + (FAIL[p.fail] ? " (" + FAIL[p.fail] + ")" : "")) + (p.clip ? " · click to play" : "");
    e.addEventListener("click", function () { onclick(p, kind); });
    if (p.clip) e.style.cursor = "pointer";
    return e;
  }
  function star(cx, cy, r1, r2) {
    var s = "";
    for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, r = i % 2 ? r2 : r1; s += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1); }
    return s + "Z";
  }
  function count(list) { return list.filter(function (p) { return p.ok; }).length + " / " + list.length; }

  function play(p, kind) {
    selRun = p;
    var label = (kind === "truth" ? "True world" : kind === "prior" ? "Prior draw " + p.run.replace("prior", "") : "Posterior draw " + p.run.replace("post", ""));
    var STG = { s03_lift_pcb: "during the lift", s04_carry_pcb: "during the carry", s05_release_pcb_seat: "at the seat" };
    var out = p.ok ? '<b class="badge-ok">success</b>' : '<b class="badge-bad">failure</b>' + (FAIL[p.fail] ? " · " + FAIL[p.fail] : "") +
      (p.stage ? " " + (STG[p.stage] || p.stage.replace(/^s\d+_/, "").replace(/_/g, " ")) : "");
    info.innerHTML = "<div><b>" + label + "</b></div><div>μ " + p.mu.toFixed(2) + " · " + p.mass_g.toFixed(1) + " g</div><div>" + out + "</div>" +
      (p.clip ? "" : '<div class="muted small">No rendered clip for this run; outlined points have one.</div>');
    if (p.clip) {
      var b = "./static/videos/asmp_" + p.clip + "_", q = "./static/posters/asmp_" + p.clip + "_";
      grp.setSources([[b + "showcase.mp4", q + "showcase.jpg"], [b + "head.mp4", q + "head.jpg"]], [0, 1]);
    }
    render();
  }

  function renderEp0(d) {
    var g = axes();
    d.prior.forEach(function (p) { mark(g, p, "prior", play); });
    d.post.forEach(function (p) { mark(g, p, "post", play); });
    mark(g, d.truth, "truth", play);
    var t = d.truth, ps = d.post.filter(function (p) { return p.ok; }).length, pr = d.prior.filter(function (p) { return p.ok; }).length;
    head.innerHTML = "<b>Query world " + d.query_world + "</b> (μ " + t.mu.toFixed(2) + ", " + t.mass_g.toFixed(0) + " g), teleop episode 0 action. " +
      "Posterior draws succeed in <b>" + count(d.post) + "</b>" + (d.prior.length ? ", prior draws in <b>" + count(d.prior) + "</b>" : "") +
      "; in the true world the run <b class=\"" + (t.ok ? "badge-ok" : "badge-bad") + "\">" + (t.ok ? "succeeds" : "fails") + "</b>" +
      (!t.ok && d.prior.length && ps < d.post.length / 2 && pr > d.prior.length / 2 ? ". The posterior predicts the failure; the prior does not." : ".");
  }
  function renderHidden() {
    var h = D.hidden, g = axes();
    if (selW !== null) {
      var w = h.worlds[selW];
      h.prior.forEach(function (p) { mark(g, p, "prior", function (p, k) { play(p, k); }); });
      w.post.forEach(function (p) { mark(g, p, "post", function (p, k) { play(p, k); }); });
    }
    h.worlds.forEach(function (w, k) {
      var e = mark(g, w.truth, "truth", function () { selW = k; selRun = w.truth; info.innerHTML = worldInfo(w); render(); });
      if (selW === k) e.classList.add("sel");
    });
    var sp = h.score_post, sq = h.score_prior, fails = h.worlds.filter(function (w) { return !w.truth.ok; });
    var lo = Math.min.apply(null, fails.map(function (w) { return w.p_post; })), hi = Math.max.apply(null, fails.map(function (w) { return w.p_post; }));
    head.innerHTML = "<b>16 sealed hidden worlds</b>, teleop episode 1 action: " + Math.round(16 * sp.actual_success_rate) + " / 16 succeed. " +
      "Posterior mean prediction <b>" + sp.mean_predicted.toFixed(2) + "</b> (Brier <b>" + sp.brier.toFixed(3) + "</b>); prior <b>" + sq.mean_predicted.toFixed(2) + "</b> (Brier " + sq.brier.toFixed(3) + "). " +
      "In the " + fails.length + " low-friction worlds that fail, the posterior gives " + lo.toFixed(2) + "–" + hi.toFixed(2) + ", the prior " + h.p_prior.toFixed(2) + ". Click a star to show its draws.";
  }
  function worldInfo(w) {
    return "<div><b>Hidden world " + w.w + "</b></div><div>μ " + w.truth.mu.toFixed(2) + " · " + w.truth.mass_g.toFixed(1) + " g</div>" +
      "<div>true outcome: " + (w.truth.ok ? '<b class="badge-ok">success</b>' : '<b class="badge-bad">failure</b>') + "</div>" +
      "<div>posterior success " + pct(w.p_post) + " · prior " + pct(D.hidden.p_prior) + "</div>";
  }
  function render() { if (mode === "hidden") renderHidden(); else renderEp0(D[mode]); }

  var MODES = [["w15", "Query world 15 · low friction"], ["w05", "Query world 5"], ["hidden", "16 hidden worlds (PPBench)"]];
  MODES.forEach(function (m, k) {
    var b = document.createElement("button"); b.textContent = m[1]; if (k === 0) b.className = "active";
    b.onclick = function () {
      dsBox.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
      mode = m[0]; selW = null; selRun = null;
      if (mode !== "hidden") play(D[mode].truth, "truth"); else { info.innerHTML = '<div class="muted small">Rendered clips exist for query worlds 15 and 5; this view shows outcomes only.</div>'; render(); }
    };
    dsBox.appendChild(b);
  });
  play(D.w15.truth, "truth");
})();
