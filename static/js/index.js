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

  /* ---------- agent gallery ---------- */
  var ag = document.getElementById("agent-grid");
  if (ag && window.PP_AGENTS) {
    window.PP_AGENTS.forEach(function (a) {
      var score = a.ms.reduce(function (s, x) { return s + x; }, 0);
      var card = document.createElement("div");
      card.className = "agent-card";
      card.innerHTML =
        '<div class="media" title="Play the agent\'s render">' +
          '<img class="pp-media" loading="lazy" src="./static/posters/agent_' + a.id + '_final.jpg" alt="Final state of ' + a.name + '">' +
          '<span class="play">▶ play render</span></div>' +
        '<h4><span>' + a.name + '</span><span class="score">' + score + ' / 5</span></h4>' +
        '<div class="ms">' + a.ms.map(function (x, i) { return '<span class="' + (x ? "y" : "n") + '">M' + (i + 1) + (x ? " ✓" : " ✗") + "</span>"; }).join("") + "</div>" +
        "<p>" + a.note + "</p>";
      var media = card.querySelector(".media");
      media.addEventListener("click", function () {
        if (media.querySelector("video")) return;
        var v = document.createElement("video");
        v.className = "pp-media";
        v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.autoplay = true;
        v.poster = "./static/posters/agent_" + a.id + "_final.jpg";
        v.src = "./static/videos/agent_" + a.id + ".mp4";
        media.innerHTML = ""; media.appendChild(v);
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      });
      ag.appendChild(card);
    });
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
