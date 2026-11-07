/* Posterior Explorer: switches between pre-rendered worlds on a friction x finger-force grid.
   No physics runs in the browser. Data sources, in order:
   1. window.PP_GRID_SITE = { pcb: <grid.json>, apple: <grid.json> }   (file:// use, see README)
   2. over http: ./static/interactive/explorer/<task>/grid.json        (schema pp-site-posterior-explorer-v1)
   3. window.PP_GRID_PLACEHOLDER                                       (synthetic, clearly flagged) */
(function () {
  "use strict";
  var root = document.getElementById("explorer");
  if (!root) return;
  var EXP = "./static/interactive/explorer/";
  var TASKS = [
    { id: "pcb", label: "Dexterous PCB transfer", real: { video: "./static/videos/dex_real_head.mp4", poster: "./static/posters/dex_real_head.jpg",
      outcome: "Real outcome: the PCB slipped out of the hand during the carry (failed take)." } },
    { id: "apple", label: "Apple", real: { video: "./static/videos/apple_real_head.mp4", poster: "./static/posters/apple_real_head.jpg",
      outcome: "Real outcome: the apple was lifted, then dropped when the hand opened in the air." } }
  ];
  var STRESS_LABEL = { weak_fast: "Weak grip + fast carry", light_fast: "Light grip + fast carry" };

  /* ---------- adapter for pp-site-posterior-explorer-v1 ---------- */
  function fromSite(meta, G) {
    var mu = G.axes.mu.values, fs = G.axes.finger_force_scale.values, nI = mu.length, nJ = fs.length, base = EXP + meta.id + "/";
    var acts = [{ id: "default", label: "Default" }];
    var sname = G.actions && G.actions.stress && G.actions.stress.name;
    acts.push({ id: "stress", label: STRESS_LABEL[sname] || "Weak grip + fast carry" });
    acts.forEach(function (a) {
      a.cells = []; for (var i = 0; i < nI; i++) { a.cells.push([]); for (var j = 0; j < nJ; j++) a.cells[i].push({ success: null }); }
    });
    var any = { default: false, stress: false };
    (G.cells || []).forEach(function (c) {
      acts.forEach(function (a) {
        var r = c.runs && c.runs[a.id]; if (!r) return; any[a.id] = true;
        a.cells[c.i_mu][c.i_f] = {
          video: r.video ? base + r.video : null, poster: null, success: r.success,
          failure: r.fail_type || (r.error ? "error" : null),
          lift_mm: r.max_lift_m != null ? 1000 * r.max_lift_m : null, tilt_deg: r.final_tilt_deg
        };
      });
    });
    acts.forEach(function (a) { a.disabled = !any[a.id]; });
    var prior = [];
    if (G.prior && G.prior.uniform_analytic) prior.push({ id: "uniform", label: "Prior", m: G.prior.uniform_analytic.mass, pred: G.prior.grid_predicted_success });
    if (G.prior && G.prior.exec_prior_draws) prior.push({ id: "exec", label: "Prior draws (32)", m: G.prior.exec_prior_draws.mass });
    var post = [];
    ((G.posterior && G.posterior.featured) || []).forEach(function (f) {
      post.push({ id: "q" + f.query_index, label: "Posterior · query world " + f.query_index, short: "query world " + f.query_index, m: f.mass, pred: f.grid_predicted_success,
                  truth: { default: f.truth_success_default_existing_exec, stress: f.truth_success_stress_existing_exec } });
    });
    if (G.posterior && G.posterior.per_query_world)
      G.posterior.per_query_world.forEach(function (f) {
        if (post.some(function (x) { return x.id === "q" + f.query_index; })) return;
        post.push({ id: "q" + f.query_index, label: "Posterior · query world " + f.query_index, short: "query world " + f.query_index, m: f.mass, pred: f.grid_predicted_success,
                    truth: { default: f.truth_success_default_existing_exec, stress: f.truth_success_stress_existing_exec }, all: true });
      });
    if (G.posterior && G.posterior.pooled_all_query)
      post.push({ id: "pooled", label: "All query worlds (pooled)", short: "all query worlds", m: G.posterior.pooled_all_query.mass, pred: G.posterior.pooled_all_query.grid_predicted_success,
                  note: "Pooling all query posteriors spreads the mass again; the posterior is sharp for one recording at a time." });
    return { id: meta.id, label: meta.label, real: meta.real, mu: mu, force: fs, nI: nI, nJ: nJ, actions: acts, prior: prior, posterior: post, tp: null };
  }
  function fromPlaceholder(P) {
    return { placeholder: true, tasks: P.tasks.map(function (t) {
      return { id: t.id, label: t.label, real: t.real, mu: t.mu, force: t.force, nI: t.mu.length, nJ: t.force.length,
               actions: t.actions, prior: t.prior, posterior: t.posterior };
    }) };
  }

  /* ---------- state ---------- */
  var D, task, action, mi = 2, fj = 2, massKind = "posterior", postIdx = 0, priorIdx = 0;
  var $ = function (id) { return document.getElementById(id); };
  var vReal = $("px-real"), vWorld = $("px-world");
  // real recording + selected world share one clock (static/js/sync.js); clips of a different length loop on their own
  var vBody = $("px-real-body");
  var grp = window.PPSync.create(root.querySelector(".px"), [vReal, vWorld, vBody], {});
  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  function fmt(x, d) { return (x === null || x === undefined || x === "") ? "—" : (typeof x === "number" ? x.toFixed(d) : String(x).replace(/_/g, " ")); }
  function muLabel(i) { return task.mu ? fmt(task.mu[i], 2) : "level " + (i + 1); }
  function fLabel(j) { return task.force ? fmt(task.force[j], 2) : "level " + (j + 1); }

  function seg(el, items, cur, cb) {
    el.innerHTML = "";
    items.forEach(function (it) {
      var b = document.createElement("button"); b.textContent = it.label; if (it.id === cur) b.className = "active";
      if (it.disabled) { b.disabled = true; b.title = "Coming soon"; }
      b.onclick = function () { cb(it); }; el.appendChild(b);
    });
  }
  function belief() { return massKind === "posterior" ? task.posterior[postIdx] : task.prior[priorIdx]; }

  function renderBeliefSel() {
    var list = massKind === "posterior" ? task.posterior : task.prior, sel = $("px-postsel"), idx = massKind === "posterior" ? postIdx : priorIdx;
    sel.innerHTML = "";
    var feat = document.createElement("optgroup"); feat.label = "Featured"; var rest = document.createElement("optgroup"); rest.label = "All query worlds";
    list.forEach(function (b, k) {
      var o = document.createElement("option"); o.value = k; o.textContent = b.label; if (k === idx) o.selected = true;
      (b.all ? rest : feat).appendChild(o);
    });
    sel.appendChild(feat); if (rest.children.length) sel.appendChild(rest);
    sel.hidden = list.length < 2;
    var b = list[idx]; $("px-postnote").textContent = (b && b.note) ? b.note : "";
  }

  function predOf(b) { // weighted success of the current action under belief b
    if (!b) return null;
    if (b.pred && b.pred[action.id] != null) return b.pred[action.id];
    var tot = 0, ok = 0, known = 0;
    for (var i = 0; i < task.nI; i++) for (var j = 0; j < task.nJ; j++) {
      var w = (b.m[i] && b.m[i][j]) || 0, c = action.cells[i][j]; tot += w;
      if (c.success === true) ok += w; if (c.success !== null && c.success !== undefined) known += w;
    }
    return known > 0 ? ok / known : null;
  }
  function renderPred() {
    var el = $("px-pred"); if (!el) return;
    var pb = task.posterior[postIdx], qb = task.prior[0];
    if (D.placeholder || !pb || !qb) { el.innerHTML = ""; return; }
    var pp = predOf(pb), qp = predOf(qb), tr = pb.truth ? pb.truth[action.id] : null;
    var pct = function (x) { return x == null ? "—" : Math.round(100 * x) + "%"; };
    el.innerHTML = '<div><span class="muted">Predicted success, this action</span></div>' +
      '<div class="px-pred-row"><span>posterior (' + (pb.short || "") + ')</span><b>' + pct(pp) + '</b></div>' +
      '<div class="px-pred-row"><span>prior</span><b>' + pct(qp) + '</b></div>' +
      (tr === true || tr === false ? '<div class="px-pred-row"><span>what happens in this world</span><b class="' + (tr ? "badge-ok" : "badge-bad") + '">' + (tr ? "success" : "failure") + '</b></div>' : "");
  }

  function renderHeat() {
    var h = $("px-heat"), b = belief(), m = b ? b.m : [], max = 0, i, j;
    for (i = 0; i < task.nI; i++) for (j = 0; j < task.nJ; j++) max = Math.max(max, (m[i] && m[i][j]) || 0);
    h.style.gridTemplateColumns = "44px repeat(" + task.nJ + ", minmax(0, 1fr))";
    h.innerHTML = "";
    var corner = document.createElement("div"); corner.className = "axis"; corner.textContent = "μ \\ F"; h.appendChild(corner);
    for (j = 0; j < task.nJ; j++) { var ax = document.createElement("div"); ax.className = "axis"; ax.textContent = fLabel(j); h.appendChild(ax); }
    for (i = 0; i < task.nI; i++) {
      var ay = document.createElement("div"); ay.className = "axis"; ay.textContent = muLabel(i); h.appendChild(ay);
      for (j = 0; j < task.nJ; j++) {
        var c = action.cells[i][j], d = document.createElement("div"), mv = (m[i] && m[i][j]) || 0;
        d.className = "cell " + (c.success === true ? "ok" : c.success === false ? "bad" : "na") + (i === mi && j === fj ? " sel" : "");
        d.title = "μ " + muLabel(i) + ", finger force " + fLabel(j) + ": " + (c.success === true ? "success" : c.success === false ? "failure" : "coming soon") +
                  "; " + (b ? b.label : massKind) + " mass " + (100 * mv).toFixed(1) + "%";
        if (mv > 0 && max > 0) { var dot = document.createElement("span"), s = Math.sqrt(mv / max) * 72; dot.className = "mass"; dot.style.width = dot.style.height = s + "%"; d.appendChild(dot); }
        (function (ii, jj) { d.onclick = function () { select(ii, jj); }; })(i, j);
        h.appendChild(d);
      }
    }
  }

  function select(i, j) {
    mi = i; fj = j;
    $("px-mu").value = i; $("px-f").value = j;
    $("px-mu-out").textContent = muLabel(i); $("px-f-out").textContent = fLabel(j);
    var c = action.cells[i][j];
    if (c.video) grp.setSource(1, c.video, c.poster);
    var o = $("px-outcome");
    o.textContent = c.success === true ? "Success" : c.success === false ? "Failure" : "—";
    o.className = c.success === true ? "badge-ok" : c.success === false ? "badge-bad" : "";
    $("px-failure").textContent = c.success === true ? "none" : fmt(c.failure);
    $("px-lift").textContent = c.lift_mm == null ? "—" : fmt(c.lift_mm, 0) + " mm";
    $("px-tilt").textContent = c.tilt_deg == null ? "—" : fmt(c.tilt_deg, 1) + "°";
    renderHeat(); renderPred();
  }

  function draw(kind) {
    var b = kind === "posterior" ? task.posterior[postIdx] : task.prior[priorIdx];
    if (!b) return;
    var m = b.m, cum = [], tot = 0, i, j, picks = [], ok = 0, exp = 0, known = 0;
    for (i = 0; i < task.nI; i++) for (j = 0; j < task.nJ; j++) {
      var w = (m[i] && m[i][j]) || 0; tot += w; cum.push([tot, i, j]);
      var s = action.cells[i][j].success; if (s === true) exp += w; if (s !== null && s !== undefined) known += w;
    }
    if (tot <= 0) return;
    for (var k = 0; k < 8; k++) {
      var r = Math.random() * tot, hit = cum[cum.length - 1];
      for (var q = 0; q < cum.length; q++) if (r <= cum[q][0]) { hit = cum[q]; break; }
      picks.push([hit[1], hit[2]]);
    }
    var box = $("px-samples"); box.innerHTML = "";
    picks.forEach(function (p) {
      var c = action.cells[p[0]][p[1]]; if (c.success === true) ok++;
      var s = document.createElement("div"); s.className = "s"; s.title = "μ " + muLabel(p[0]) + ", finger force " + fLabel(p[1]);
      var media;
      if (!c.video || (isMobile && c.poster)) { media = document.createElement("img"); media.className = "pp-media is-thumb"; if (c.poster) media.src = c.poster; media.alt = "sampled world"; }
      else { media = document.createElement("video"); media.muted = true; media.loop = true; media.setAttribute("playsinline", ""); media.preload = "metadata";
             if (c.poster) media.poster = c.poster; media.className = "lazy pp-media is-thumb"; media.dataset.src = c.video; window.PPLazy.observe(media); }
      var tag = document.createElement("span"); tag.className = c.success ? "ok" : "bad"; tag.textContent = c.success === true ? "✓" : c.success === false ? "✗" : "?";
      s.appendChild(media); s.appendChild(tag);
      s.onclick = function () { select(p[0], p[1]); };
      box.appendChild(s);
    });
    $("px-draw-summary").innerHTML = "<b>" + ok + " / 8</b> succeed in worlds drawn from the <b>" + b.label.toLowerCase() + "</b>" +
      (known > 0 ? " · success mass on rendered cells: " + (100 * exp / known).toFixed(0) + "%" : "") + "";
  }

  function setAction(a) {
    if (a.disabled) return;
    action = a;
    seg($("px-action"), task.actions, a.id, setAction);
    $("px-samples").innerHTML = ""; $("px-draw-summary").textContent = "";
    select(Math.min(mi, task.nI - 1), Math.min(fj, task.nJ - 1));
  }
  function renderTP() {
    var panel = $("px-tp-panel"); if (!panel) return;
    var sel = task.tp && task.tp.selections;
    if (!sel || !sel.length) { panel.style.display = "none"; return; }
    panel.style.display = "";
    var box = $("px-tp-btns"); box.innerHTML = "";
    sel.forEach(function (s, k) {
      var b = document.createElement("button"); if (k === 0) b.className = "active";
      var act = task.actions.filter(function (a) { return a.id === s.action; })[0];
      b.textContent = (s.success ? "✓ " : "✗ ") + s.cell.replace("mu", "μ ").replace("_f", ", F ") + " · " + (act ? act.label : s.action);
      b.onclick = function () {
        box.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
        playTP(s);
        if (act && !act.disabled && act !== action) setAction(act);
        var m = /mu([\d.]+)_f([\d.]+)/.exec(s.cell);
        if (m) { var i = task.mu.indexOf(+m[1]), j = task.force.indexOf(+m[2]); if (i >= 0 && j >= 0) select(i, j); }
      };
      box.appendChild(b);
    });
    var first = sel.filter(function (x) { return x.action === action.id; })[0] || sel[0];
    box.children[sel.indexOf(first)].classList.add("active"); if (sel.indexOf(first) !== 0) box.children[0].classList.remove("active");
    playTP(first);
  }
  function playTP(s) {
    var v = $("px-tp"), url = EXP + task.id + "/" + s.video, poster = "./static/posters/tp/" + task.id + "_" + s.video.split("/").pop().replace(".mp4", ".jpg");
    $("px-tp-note").textContent = s.why || "";
    window.PPLazy.setSrc(v, url, poster, false);
  }

  function setTask(t) {
    task = t; postIdx = 0; priorIdx = 0;
    seg($("px-task"), D.tasks, t.id, setTask);
    $("px-mu").max = t.nI - 1; $("px-f").max = t.nJ - 1;
    if (t.real.video) grp.setSource(0, t.real.video, t.real.poster);
    var body = { pcb: ["./static/videos/dex_real_body.mp4", "./static/posters/dex_real_body.jpg"] }[t.id];
    vBody.parentNode.querySelector(".pip-lbl").style.display = body ? "" : "none";
    vBody.style.display = body ? "" : "none"; $("px-real-nobody").style.display = body ? "none" : "";
    grp.setSource(2, body ? body[0] : t.real.video, body ? body[1] : t.real.poster);
    $("px-real-note").textContent = t.real.outcome;
    renderBeliefSel();
    // open on the action where the featured posterior and the prior disagree (PCB: weak grip + fast carry; apple: default)
    var PREF = { pcb: "stress", apple: "default" };
    var en = t.actions.filter(function (a) { return !a.disabled; });
    setAction(en.filter(function (a) { return a.id === PREF[t.id]; })[0] || en[0] || t.actions[0]);
    renderTP();
  }

  function start(model) {
    D = model;
    $("px-flag").innerHTML = "";
    $("px-mu").oninput = function () { select(+this.value, fj); };
    $("px-f").oninput = function () { select(mi, +this.value); };
    $("px-mass").onclick = function (ev) {
      var b = ev.target.closest("button"); if (!b) return; massKind = b.dataset.m;
      this.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); }); renderBeliefSel(); renderHeat(); renderPred();
    };
    $("px-postsel").onchange = function () { if (massKind === "posterior") postIdx = +this.value; else priorIdx = +this.value; renderBeliefSel(); renderHeat(); renderPred(); };
    $("px-draw-prior").onclick = function () { draw("prior"); };
    $("px-draw-post").onclick = function () { draw("posterior"); };
    setTask(D.tasks[0]);
    buildDomains();
  }

  // top-level task tabs: Precision assembly (default, scatter view of #px-asm) + the grid tasks
  function buildDomains() {
    var dom = $("px-domain"), asm = $("px-asm"), gridUI = $("px-grid-ui"), act = $("px-action").parentNode;
    if (!dom) return;
    dom.innerHTML = "";
    var items = [{ id: "asm", label: "Precision assembly" }].concat(D.tasks.map(function (t) { return { id: t.id, label: t.label, t: t }; }));
    function show(it) {
      dom.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b.dataset.id === it.id); });
      var isAsm = it.id === "asm";
      if (asm) asm.style.display = isAsm ? "" : "none";
      gridUI.style.display = isAsm ? "none" : ""; act.style.display = isAsm ? "none" : "";
      if (!isAsm) setTask(it.t);
    }
    items.forEach(function (it) { var b = document.createElement("button"); b.textContent = it.label; b.dataset.id = it.id; b.onclick = function () { show(it); }; dom.appendChild(b); });
    show(asm ? items[0] : items[1]);
  }

  function siteModel(byTask) {
    var tasks = TASKS.filter(function (t) { return byTask[t.id]; }).map(function (t) { var m = fromSite(t, byTask[t.id]); m.tp = byTask[t.id].__tp || null; return m; });
    return tasks.length ? { placeholder: false, tasks: tasks } : null;
  }

  var ph = fromPlaceholder(window.PP_GRID_PLACEHOLDER);
  if (window.PP_GRID_SITE) start(siteModel(window.PP_GRID_SITE) || ph);
  else if (/^https?:/.test(location.protocol) && window.fetch) {
    var got = {};
    Promise.all(TASKS.map(function (t) {
      return fetch(EXP + t.id + "/grid.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { if (j && j.schema === "pp-site-posterior-explorer-v1") got[t.id] = j; })
        .then(function () { return fetch(EXP + t.id + "/third_person/selection.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }); })
        .then(function (sj) { if (got[t.id] && sj) got[t.id].__tp = sj; }).catch(function () {});
    })).then(function () { start(siteModel(got) || ph); });
  } else start(ph);
})();
