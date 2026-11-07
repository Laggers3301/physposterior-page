/* "Change the physics, see what happens": scatter of executed worlds (friction x board mass) for the assembly task,
   with the selected run's third-person, head and wrist views on one clock (static/js/sync.js).
   Data: static/data/asm_posterior.js (window.PP_ASM). Wrist clips: list their clip ids in PP_ASM_WRIST; until then the
   wrist tile shows "wrist view rendering". Any element with class "asmx-root" is mounted; data-mode picks the first view
   (w15 | w05 | hidden). */
(function () {
  "use strict";
  var D = window.PP_ASM;
  if (!D || !window.PPSync) return;
  var WRIST = window.PP_ASM_WRIST || [], HEAD = window.PP_ASM_HEAD || [];
  var NS = "http://www.w3.org/2000/svg";
  var FAIL = { IN_HAND_SLIP: "board slips in the gripper", GATE_FAILED: "seat check fails" };
  var STG = { s03_lift_pcb: "during the lift", s04_carry_pcb: "during the carry", s04_seat_pcb_a_carry: "during the carry", s05_release_pcb_seat: "at the seat" };
  var pct = function (x) { return Math.round(100 * x) + "%"; };

  function mount(root) {
    var q = function (r) { return root.querySelector('[data-r="' + r + '"]'); };
    var svg = q("plot"), head = q("head"), info = q("info"), dsBox = q("ds"), stage = q("stage");
    var vShow = q("show"), vHead = q("headcam"), vWrist = q("wrist"), wristSoon = q("wrist-soon"), headSoon = q("head-soon");
    var grp = window.PPSync.create(stage, [vShow, vHead, vWrist], {});
    var X0 = 0.15, X1 = 1.15, Y0 = 19, Y1 = 41, W = 520, H = 380, L = 54, R = 14, T = 14, BOT = 46;
    var sx = function (x) { return L + (x - X0) / (X1 - X0) * (W - L - R); };
    var sy = function (y) { return T + (1 - (y - Y0) / (Y1 - Y0)) * (H - T - BOT); };
    var mode = root.dataset.mode || "w15", selW = null, selRun = null;

    function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    function star(cx, cy, r1, r2) { var s = ""; for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, r = i % 2 ? r2 : r1; s += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1); } return s + "Z"; }
    function axes() {
      svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      var g = el("g", {}, svg);
      [0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (x) { el("line", { x1: sx(x), x2: sx(x), y1: T, y2: H - BOT, "class": "grid" }, g); el("text", { x: sx(x), y: H - BOT + 16, "text-anchor": "middle" }, g).textContent = x.toFixed(1); });
      [20, 25, 30, 35, 40].forEach(function (y) { el("line", { x1: L, x2: W - R, y1: sy(y), y2: sy(y), "class": "grid" }, g); el("text", { x: L - 8, y: sy(y) + 4, "text-anchor": "end" }, g).textContent = y; });
      el("text", { x: (L + W - R) / 2, y: H - 8, "text-anchor": "middle", "class": "lab" }, g).textContent = "finger–board friction μ";
      el("text", { x: 14, y: (T + H - BOT) / 2, "text-anchor": "middle", "class": "lab", transform: "rotate(-90 14 " + (T + H - BOT) / 2 + ")" }, g).textContent = "board mass (g)";
      return el("g", {}, svg);
    }
    function mark(g, p, kind, onclick) {
      var x = sx(p.mu), y = sy(p.mass_g), c = p.ok ? "ok" : "bad", e;
      if (kind === "truth") e = el("path", { d: star(x, y, 9, 4), "class": "pt " + c + " truth" }, g);
      else if (kind === "prior") e = el("rect", { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, "class": "pt " + c + " prior" }, g);
      else e = el("circle", { cx: x, cy: y, r: 5.5, "class": "pt " + c + " post" }, g);
      if (p.clip) { e.classList.add("has-clip"); el("circle", { cx: x, cy: y, r: kind === "truth" ? 13 : 10, "class": "clip-ring" }, g); e.style.cursor = "pointer"; }
      if (selRun === p) e.classList.add("sel");
      el("title", {}, e).textContent = (kind === "truth" ? "true world" : kind === "prior" ? "prior draw" : "posterior draw") + ": μ " + p.mu.toFixed(2) + ", " + p.mass_g.toFixed(1) + " g, " +
        (p.ok ? "success" : "failure" + (FAIL[p.fail] ? " (" + FAIL[p.fail] + ")" : "")) + (p.clip ? " · click to play" : "");
      e.addEventListener("click", function () { onclick(p, kind); });
      return e;
    }
    function count(list) { return list.filter(function (p) { return p.ok; }).length + " / " + list.length; }
    function play(p, kind) {
      selRun = p;
      var label = kind === "truth" ? "True world" : kind === "prior" ? "Prior draw " + p.run.replace("prior", "") : "Posterior draw " + p.run.replace("post", "");
      var out = p.ok ? '<b class="badge-ok">success</b>' : '<b class="badge-bad">failure</b>' + (FAIL[p.fail] ? " · " + FAIL[p.fail] : "") +
        (p.stage ? " " + (STG[p.stage] || p.stage.replace(/^s\d+_/, "").replace(/_/g, " ")) : "");
      info.innerHTML = "<b>" + label + "</b> · μ " + p.mu.toFixed(2) + " · " + p.mass_g.toFixed(1) + " g · " + out +
        (p.clip ? "" : ' <span class="muted">· no rendered clip for this run; outlined points have one</span>');
      if (p.clip) {
        var b = "./static/videos/asmp_" + p.clip + "_", q2 = "./static/posters/asmp_" + p.clip + "_";
        var hasW = WRIST.indexOf(p.clip) >= 0, hasH = HEAD.indexOf(p.clip) >= 0;
        vWrist.style.display = hasW ? "" : "none"; wristSoon.style.display = hasW ? "none" : "";
        vHead.style.display = hasH ? "" : "none"; headSoon.style.display = hasH ? "none" : "";
        var pairs = [[b + "showcase.mp4", q2 + "showcase.jpg"]], idx = [0];
        if (hasH) { pairs.push([b + "head_display.mp4", q2 + "head_display.jpg"]); idx.push(1); }
        if (hasW) { pairs.push([b + "wrist.mp4", q2 + "wrist.jpg"]); idx.push(2); }
        grp.setSources(pairs, idx);
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
    function worldInfo(w) {
      return "<b>Hidden world " + w.w + "</b> · μ " + w.truth.mu.toFixed(2) + " · " + w.truth.mass_g.toFixed(1) + " g · true outcome " +
        (w.truth.ok ? '<b class="badge-ok">success</b>' : '<b class="badge-bad">failure</b>') + " · posterior " + pct(w.p_post) + " · prior " + pct(D.hidden.p_prior);
    }
    function renderHidden() {
      var h = D.hidden, g = axes();
      if (selW !== null) {
        h.prior.forEach(function (p) { mark(g, p, "prior", play); });
        h.worlds[selW].post.forEach(function (p) { mark(g, p, "post", play); });
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
    function render() { if (mode === "hidden") renderHidden(); else renderEp0(D[mode]); }

    var MODES = [["w15", "Query world 15 · low friction"], ["w05", "Query world 5"], ["hidden", "16 hidden worlds (PPBench)"]];
    function setMode(m) {
      mode = m; selW = null; selRun = null;
      dsBox.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x.dataset.m === m); });
      if (m !== "hidden") play(D[m].truth, "truth");
      else { info.innerHTML = '<span class="muted">Rendered clips exist for query worlds 15 and 5. The playing clip stays until you pick one there.</span>'; render(); }
    }
    MODES.forEach(function (m) {
      var b = document.createElement("button"); b.textContent = m[1]; b.dataset.m = m[0];
      b.onclick = function () { setMode(m[0]); }; dsBox.appendChild(b);
    });
    if (mode === "hidden") { play(D.w15.truth, "truth"); setMode("hidden"); } else setMode(mode);
  }
  document.querySelectorAll(".asmx-root").forEach(mount);
})();
