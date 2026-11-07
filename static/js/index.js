/* Common page logic: title/BibTeX from the DOM, lazy video loading, synced groups, view switcher, agent gallery. */
(function () {
  "use strict";

  /* ---------- title + BibTeX (single source: #pp-title and .author-name) ---------- */
  var titleEl = document.getElementById("pp-title");
  var title = titleEl ? titleEl.textContent.trim() : "PhysPosterior";
  document.title = title;
  var names = Array.prototype.map.call(document.querySelectorAll("#pp-authors .author-name"), function (n) { return n.textContent.trim(); });
  var bib = names.map(function (n) { var p = n.split(/\s+/); var last = p.pop(); return last + ", " + p.join(" "); }).join(" and ");
  var key = (names.length ? names[0].split(/\s+/).pop().toLowerCase() : "anon") + "2026physposterior";
  var bibEl = document.getElementById("pp-bibtex");
  if (bibEl) {
    bibEl.textContent = "@misc{" + key + ",\n" +
      "  title  = {" + title + "},\n" +
      "  author = {" + bib + "},\n" +
      "  year   = {2026}\n}";
  }

  /* ---------- lazy videos ---------- */
  // A <video class="lazy" data-src=...> gets its src when it comes near the viewport,
  // plays while visible and pauses when it leaves.
  var visible = new WeakMap();
  function activate(v) {
    if (v.dataset.src && v.getAttribute("src") !== v.dataset.src) {
      v.setAttribute("src", v.dataset.src);
    }
    if (v.getAttribute("src") && v.dataset.noautoplay !== "1") {
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
  }
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      visible.set(v, e.isIntersecting);
      if (e.isIntersecting) activate(v); else if (!v.paused) v.pause();
    });
  }, { rootMargin: "200px 0px" }) : null;

  function observe(v) {
    if (io) io.observe(v); else activate(v);
  }
  document.querySelectorAll("video.lazy").forEach(observe);

  // Swap a lazy video's source. keepTime keeps the playback position (view switcher).
  window.PPLazy = {
    observe: observe,
    setSrc: function (v, url, poster, keepTime) {
      var t = keepTime ? v.currentTime : 0;
      v.dataset.src = url;
      if (poster) v.setAttribute("poster", poster);
      if (v.getAttribute("src") || visible.get(v)) {
        v.setAttribute("src", url);
        if (keepTime && t > 0) {
          v.addEventListener("loadedmetadata", function once() { v.removeEventListener("loadedmetadata", once); try { v.currentTime = Math.min(t, (v.duration || t) - 0.05); } catch (e) {} });
        }
        if (visible.get(v)) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      }
    },
    isVisible: function (v) { return !!visible.get(v); }
  };

  /* synced groups are handled by static/js/sync.js (PPSync) */

  /* ---------- agent gallery: six videos on one normalised clock ----------
     Clips of different length run at playbackRate = own duration / longest duration, so all start and end together.
     Any video buffering pauses all six; play / pause / scrub act on the shared clock. */
  var ag = document.getElementById("agent-grid");
  if (ag && window.PP_AGENTS) {
    var vids = [], P = 0, clock = 0, last = 0, want = true, ready = false, started = false, frozen = false;
    var ctrl = document.createElement("div"); ctrl.className = "agent-ctrl";
    ctrl.innerHTML = '<button class="btn-plain" id="ag-play">Pause</button><input type="range" id="ag-scrub" min="0" max="1000" value="0" aria-label="agent videos"><span class="small muted" id="ag-t"></span>';
    ag.parentNode.insertBefore(ctrl, ag);
    window.PP_AGENTS.forEach(function (a) {
      var score = a.ms.reduce(function (s, x) { return s + x; }, 0);
      var card = document.createElement("div"); card.className = "agent-card";
      var src = a.video || ("./static/videos/agent_" + a.id + ".mp4"), poster = a.poster || ("./static/posters/agent_" + a.id + "_final.jpg");
      card.innerHTML = '<div class="media"><video class="pp-media" muted playsinline preload="none" poster="' + poster + '"></video></div>' +
        '<h4><span>' + a.name + '</span><span class="score">' + score + ' / 5</span></h4>' +
        '<div class="ms">' + a.ms.map(function (x, i) { return '<span class="' + (x ? "y" : "n") + '">M' + (i + 1) + (x ? " ✓" : " ✗") + "</span>"; }).join("") + "</div>" +
        "<p>" + a.note + (a.replay ? ' <span class="muted">Replayed from the agent\'s saved states with a common renderer.</span>' : "") + "</p>";
      var v = card.querySelector("video"); v.dataset.src = src; v.setAttribute("muted", ""); v.muted = true;
      v.addEventListener("click", function () { toggle(); });
      vids.push(v); ag.appendChild(card);
    });
    var playBtn = document.getElementById("ag-play"), scrub = document.getElementById("ag-scrub"), tEl = document.getElementById("ag-t"), dragging = false;
    function okBuf(v) { if (v.readyState >= 4) return true; var t = v.currentTime, b = v.buffered; for (var i = 0; i < b.length; i++) if (b.start(i) <= t + .05 && b.end(i) >= Math.min(t + 1, v.duration - .05)) return true; return false; }
    function toggle() { want = !want; playBtn.textContent = want ? "Pause" : "Play"; if (!want) vids.forEach(function (v) { v.pause(); }); }
    function seekNorm(f) { clock = f * P; vids.forEach(function (v) { if (isFinite(v.duration)) try { v.currentTime = f * v.duration; } catch (e) {} }); }
    playBtn.onclick = toggle;
    scrub.addEventListener("input", function () { dragging = true; seekNorm(scrub.value / 1000); });
    scrub.addEventListener("change", function () { dragging = false; });
    function tick(now) {
      if (!started) return;
      var dt = last ? (now - last) / 1000 : 0; last = now;
      if (!ready) {
        if (vids.every(function (v) { return v.readyState >= 2 && isFinite(v.duration); })) {
          P = Math.max.apply(null, vids.map(function (v) { return v.duration; }));
          vids.forEach(function (v) { v.playbackRate = Math.max(0.0625, Math.min(16, v.duration / P)); });
          ready = vids.every(okBuf);
        }
        requestAnimationFrame(tick); return;
      }
      var busy = vids.some(function (v) { return v.seeking || (v.readyState < 3 && v.currentTime < v.duration - .2); });
      if (busy || !want) { if (!frozen) { vids.forEach(function (v) { v.pause(); }); frozen = true; } }
      else {
        if (frozen) { frozen = false; }
        clock += dt;
        if (clock >= P - 0.05) { seekNorm(0); }
        var f = clock / P;
        vids.forEach(function (v) {
          var target = f * v.duration;
          if (Math.abs(v.currentTime - target) > 0.25 * Math.max(1, v.playbackRate)) { try { v.currentTime = target; } catch (e) {} }
          if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        });
      }
      if (!dragging) scrub.value = Math.round(1000 * clock / P);
      tEl.textContent = Math.round(100 * clock / P) + "%";
      requestAnimationFrame(tick);
    }
    var inView = false, loaded = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        inView = e.isIntersecting;
        if (inView) {
          if (!loaded) { loaded = true; vids.forEach(function (v) { v.src = v.dataset.src; v.preload = "auto"; }); }
          if (!started) { started = true; last = 0; requestAnimationFrame(tick); }
        } else if (started) { vids.forEach(function (v) { v.pause(); }); started = false; frozen = true; }
      });
    }, { rootMargin: "200px 0px" }).observe(ag);
  }
})();

/* ---------- long-horizon assembly: third-person segment + two wrist close-ups on one clock; Orbit is a single clip ---------- */
(function () {
  var btns = document.getElementById("asm-btns"), host = document.getElementById("asm-group");
  if (!btns || !host || !window.PPSync) return;
  var show = document.getElementById("asm-show"), rw = document.getElementById("asm-rw"), sw = document.getElementById("asm-sw");
  var side = document.getElementById("asm-side"), cap = document.getElementById("asm-cap");
  var CAP = {
    grasp_pcb: "Grasp the circuit board.", seat_pcb: "Seat the board in the fixture.", align_posts: "Align the board on its posts.",
    place_screw1: "Place the first screw.", finish: "Last screw placed; the arm retreats.", orbit: "Orbit around the finished assembly."
  };
  var g = window.PPSync.create(host, [show, rw, sw], {});
  btns.addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    btns.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
    var c = b.dataset.c, V = "./static/videos/asm_" + c, P = "./static/posters/asm_" + c;
    cap.textContent = CAP[c] || "";
    if (c === "orbit") {
      side.style.display = "none";
      g.setSources([[V + "_show.mp4", P + "_show.jpg"]], [0]);
    } else {
      side.style.display = "";
      g.setSources([[V + "_show.mp4", P + "_show.jpg"], [V + "_realwrist.mp4", P + "_realwrist.jpg"], [V + "_simwrist.mp4", P + "_simwrist.jpg"]], [0, 1, 2]);
    }
  });
})();
