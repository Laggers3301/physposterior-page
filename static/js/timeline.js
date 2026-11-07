/* Multi-view synced timeline for the long-horizon PCB assembly section. All streams share the simulation clock; one master video drives the others. */
(function () {
  "use strict";
  var wrap = document.getElementById("tl");
  if (!wrap) return;
  var PH = window.PP_TIMELINE_PLACEHOLDER;
  // timeline.json from the render job: accepts {events:[{label|name, t|t_s|time_s}], duration_s?, streams?}
  function merge(J) {
    if (!J) return PH;
    var evs = (J.events || []).map(function (e) { return { label: e.label || e.name, t: +(e.t != null ? e.t : (e.t_s != null ? e.t_s : e.time_s)) }; })
      .filter(function (e) { return e.label && isFinite(e.t); });
    if (!evs.length) return PH;
    return { placeholder: false, duration_s: J.duration_s || PH.duration_s, master: J.master || PH.master,
             streams: (J.streams && J.streams.length && J.streams[0].src) ? J.streams : PH.streams, events: evs };
  }
  if (window.PP_TIMELINE) { init(merge(window.PP_TIMELINE)); return; }
  init(PH);

  function init(T) {
  if (!T) return;
  var grid = document.getElementById("tl-grid"), scrub = document.getElementById("tl-scrub"),
      marks = document.getElementById("tl-marks"), evBox = document.getElementById("tl-events"),
      timeEl = document.getElementById("tl-time"), playBtn = document.getElementById("tl-play");
  var dur = T.duration_s || 1, dragging = false;
  var vids = {}, order = [];
  document.getElementById("tl-flag").innerHTML = "";

  T.streams.forEach(function (s) {
    var f = document.createElement("figure"), v = document.createElement("video");
    v.className = "pp-media";
    v.muted = true; v.setAttribute("playsinline", ""); v.preload = "none"; v.poster = s.poster || "";
    v.dataset.src = s.src;
    var cap = document.createElement("figcaption"); cap.textContent = s.label;
    f.appendChild(v); f.appendChild(cap); grid.appendChild(f);
    vids[s.id] = v; order.push(s.id);
  });
  var info = document.createElement("div"); info.className = "tl-info";
  info.innerHTML = '<div class="small muted">Current step</div><div class="phase" id="tl-phase">—</div>' +
    '<div class="sub">Five views share one clock. Drag the bar or click a step to jump; all views follow.</div>';
  grid.appendChild(info);
  var phaseEl = info.querySelector("#tl-phase");

  T.events.forEach(function (e, k) {
    var b = document.createElement("button"); b.style.left = (100 * e.t / dur) + "%"; b.title = e.label;
    b.onclick = function () { seek(e.t); }; marks.appendChild(b);
    var c = document.createElement("button"); c.textContent = e.label; c.onclick = function () { seek(e.t); }; evBox.appendChild(c);
    e._m = b; e._c = c;
  });

  // one clock for all five views: the master stream first, the others follow (static/js/sync.js)
  var mid = vids[T.master] ? T.master : order[0];
  var list = [vids[mid]].concat(order.filter(function (k) { return k !== mid; }).map(function (k) { return vids[k]; }));
  var group = window.PPSync.create(grid, list, { rate: 4, autoplay: true, onTick: update });
  function seek(t) { t = Math.max(0, Math.min(dur - 0.05, t)); group.seek(t); update(t); }
  function update(t) {
    if (!dragging) scrub.value = Math.round(1000 * t / dur);
    timeEl.textContent = t.toFixed(1) + " s / " + dur.toFixed(1) + " s";
    var cur = -1; T.events.forEach(function (e, k) { if (t >= e.t) cur = k; });
    T.events.forEach(function (e, k) { e._m.classList.toggle("cur", k === cur); e._c.classList.toggle("cur", k === cur); });
    phaseEl.textContent = cur >= 0 ? T.events[cur].label : "Approach";
    playBtn.textContent = group.isPlaying() ? "Pause" : "Play";
  }
  playBtn.onclick = function () { group.toggle(); update(group.time()); };
  document.getElementById("tl-rate").onclick = function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
    group.setRate(+b.dataset.r);
  };
  scrub.addEventListener("input", function () { dragging = true; seek(dur * scrub.value / 1000); });
  scrub.addEventListener("change", function () { dragging = false; });
  window.PPTimeline = { group: group, seek: seek };
  update(0);
  }
})();
