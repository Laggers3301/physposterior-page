/* Five-view timeline for the long-horizon precision assembly. All streams of an episode share the simulation clock;
   one master video drives the others (static/js/sync.js). "Teleop episode 0 / 1" swaps all five sources at once. */
(function () {
  "use strict";
  var wrap = document.getElementById("tl");
  var EPS = window.PP_TIMELINE_EPISODES || (window.PP_TIMELINE ? [window.PP_TIMELINE] : null);
  if (!wrap || !EPS || !window.PPSync) return;

  var grid = document.getElementById("tl-grid"), scrub = document.getElementById("tl-scrub"),
      marks = document.getElementById("tl-marks"), evBox = document.getElementById("tl-events"),
      timeEl = document.getElementById("tl-time"), playBtn = document.getElementById("tl-play"),
      epBox = document.getElementById("tl-ep"), statEl = document.getElementById("tl-ep-stats");
  var T = EPS[0], dur = T.duration_s, dragging = false, vids = {}, ids = [];
  document.getElementById("tl-flag").innerHTML = "";

  T.streams.forEach(function (s) {
    var f = document.createElement("figure"), v = document.createElement("video");
    v.className = "pp-media"; v.muted = true; v.setAttribute("playsinline", ""); v.preload = "none";
    v.poster = s.poster || ""; v.dataset.src = s.src;
    var cap = document.createElement("figcaption"); cap.textContent = s.label;
    f.appendChild(v); f.appendChild(cap); grid.appendChild(f);
    vids[s.id] = v; ids.push(s.id);
  });
  var info = document.createElement("div"); info.className = "tl-info";
  info.innerHTML = '<div class="small muted">Current step</div><div class="phase" id="tl-phase">—</div>' +
    '<div class="sub">Five views share one clock. Drag the bar or click a step to jump; all views follow.</div>';
  grid.appendChild(info);
  var phaseEl = info.querySelector("#tl-phase");

  var mid = vids[T.master] ? T.master : ids[0];
  var order = [mid].concat(ids.filter(function (k) { return k !== mid; }));
  var group = window.PPSync.create(grid, order.map(function (k) { return vids[k]; }), { rate: 4, autoplay: true, onTick: update });

  function renderEvents() {
    marks.innerHTML = ""; evBox.innerHTML = "";
    T.events.forEach(function (e) {
      var b = document.createElement("button"); b.style.left = (100 * e.t / dur) + "%"; b.title = e.label;
      b.onclick = function () { seek(e.t); }; marks.appendChild(b);
      var c = document.createElement("button"); c.textContent = e.label; c.onclick = function () { seek(e.t); }; evBox.appendChild(c);
      e._m = b; e._c = c;
    });
    if (statEl) statEl.innerHTML = T.stats || "";
  }
  function seek(t) { t = Math.max(0, Math.min(dur - 0.05, t)); group.seek(t); update(t); }
  function update(t) {
    if (!dragging) scrub.value = Math.round(1000 * t / dur);
    timeEl.textContent = t.toFixed(1) + " s / " + dur.toFixed(1) + " s";
    var cur = -1; T.events.forEach(function (e, k) { if (t >= e.t) cur = k; });
    T.events.forEach(function (e, k) { if (e._m) { e._m.classList.toggle("cur", k === cur); e._c.classList.toggle("cur", k === cur); } });
    phaseEl.textContent = cur >= 0 ? T.events[cur].label : "Approach";
    playBtn.textContent = group.isPlaying() ? "Pause" : "Play";
  }
  function setEpisode(k) {
    T = EPS[k]; dur = T.duration_s;
    var by = {}; T.streams.forEach(function (s) { by[s.id] = s; });
    group.setSources(order.map(function (id) { return [by[id].src, by[id].poster]; }), order.map(function (_, i) { return i; }));
    renderEvents(); update(0);
  }
  if (epBox && EPS.length > 1) {
    EPS.forEach(function (e, k) {
      var b = document.createElement("button"); b.textContent = e.label; if (k === 0) b.className = "active";
      b.onclick = function () { epBox.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); }); setEpisode(k); };
      epBox.appendChild(b);
    });
  } else if (epBox) epBox.style.display = "none";

  playBtn.onclick = function () { group.toggle(); update(group.time()); };
  document.getElementById("tl-rate").onclick = function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
    group.setRate(+b.dataset.r);
  };
  scrub.addEventListener("input", function () { dragging = true; seek(dur * scrub.value / 1000); });
  scrub.addEventListener("change", function () { dragging = false; });
  window.PPTimeline = { group: group, seek: seek, setEpisode: setEpisode };
  renderEvents(); update(0);
})();
