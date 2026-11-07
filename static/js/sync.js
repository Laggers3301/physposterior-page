/* PPSync: one clock per group of videos.
   - The first active video is the clock (master). Every animation frame each follower is compared with it:
     drift > 0.2 s -> seek; drift > 1 frame (1/30 s) -> nudge playbackRate; otherwise run at the group rate.
   - Playback starts only after every active video has loaded and buffered a first stretch (START_AHEAD s).
   - If any active video runs short of buffer (readyState < 3, seeking, or less than LOW_AHEAD x rate seconds
     buffered ahead), the whole group pauses and resumes together once every video has RESUME_AHEAD x rate seconds
     buffered again. One video never runs while another waits.
   - play / pause / seek / setRate / restart act on the group clock only; followers follow.
   - Videos use preload="auto" once the group is near the viewport. A small spinner shows while loading or buffering.
   Markup: <div data-sync-group="name"> ... <video data-src="..."> ... </div>  (auto-initialised)
   Script use: PPSync.create(hostElement, [video, ...], {autoplay, rate, onTick}) */
(function () {
  "use strict";
  var FRAME = 1 / 30, BIG = 0.2, START_AHEAD = 1.5, LOW_AHEAD = 0.35, RESUME_AHEAD = 1.2;

  function ahead(v) { // seconds buffered after currentTime
    var t = v.currentTime, b = v.buffered;
    for (var i = 0; i < b.length; i++) if (b.start(i) <= t + 0.05 && b.end(i) >= t) return b.end(i) - t;
    return 0;
  }
  function remaining(v) { return isFinite(v.duration) ? Math.max(0, v.duration - v.currentTime) : Infinity; }
  function enough(v, need) { return v.readyState >= 4 || ahead(v) >= Math.min(need, remaining(v) - 0.05); }

  function Group(host, videos, opts) {
    opts = opts || {};
    this.host = host; this.v = videos; this.on = videos.map(function () { return true; });
    this.rate = opts.rate || 1; this.want = opts.autoplay !== false; this.onTick = opts.onTick || null;
    this.loaded = false; this.ready = false; this.frozen = false; this.inView = false; this.raf = 0; this.badgeTimer = 0;
    host.classList.add("sync-host");
    var badge = document.createElement("span"); badge.className = "sync-loader"; badge.setAttribute("aria-label", "loading");
    host.appendChild(badge); this.badge = badge;
    var self = this;
    videos.forEach(function (v) {
      v.muted = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.playsInline = true;
      v.loop = false; v.removeAttribute("loop"); v.removeAttribute("autoplay"); v.preload = "none";
      v.addEventListener("waiting", function () { if (self._isOn(v)) self._freeze(); });
      v.addEventListener("stalled", function () { if (self._isOn(v) && v.readyState < 3) self._freeze(); });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          self.inView = e.isIntersecting;
          if (e.isIntersecting) { self.load(); self._loop(); } else self._pauseAll();
        });
      }, { rootMargin: "300px 0px" }).observe(host);
    } else { this.inView = true; this.load(); this._loop(); }
  }
  var G = Group.prototype;

  G._isOn = function (v) { var i = this.v.indexOf(v); return i >= 0 && this.on[i]; };
  G._act = function () { var on = this.on; return this.v.filter(function (v, i) { return on[i]; }); };
  G._master = function () { return this._act()[0] || this.v[0]; };
  G._busy = function (flag) { // spinner, shown only if waiting lasts > 300 ms
    var self = this;
    if (flag) { if (!this.badgeTimer) this.badgeTimer = setTimeout(function () { self.host.classList.add("is-loading"); }, 300); }
    else { clearTimeout(this.badgeTimer); this.badgeTimer = 0; this.host.classList.remove("is-loading"); }
  };
  G.load = function () {
    if (this.loaded) return; this.loaded = true; this._busy(true);
    var self = this;
    this.v.forEach(function (v, i) {
      if (!self.on[i]) return;
      if (v.dataset.src && v.getAttribute("src") !== v.dataset.src) v.setAttribute("src", v.dataset.src);
      v.preload = "auto"; try { v.load(); } catch (e) {}
    });
  };
  G._checkReady = function () {
    if (this.ready) return true;
    var act = this._act();
    if (act.length && act.every(function (v) { return v.getAttribute("src") && v.readyState >= 2 && enough(v, START_AHEAD); })) {
      this.ready = true; this.frozen = false; this._busy(false); this._applyRate();
      if (this.want && this.inView) this._playAll();
      return true;
    }
    return false;
  };
  G._eligible = function (f) { // followers of a different length are not time-locked (they loop on their own)
    var a = this._master().duration, b = f.duration;
    return !(isFinite(a) && isFinite(b) && Math.abs(a - b) > 0.5);
  };
  G._playAll = function () {
    this._act().forEach(function (v) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
  };
  G._pauseAll = function () { this.v.forEach(function (v) { if (!v.paused) v.pause(); }); };
  G._applyRate = function () { var r = this.rate; this.v.forEach(function (v) { v.playbackRate = r; }); };
  G._short = function () {
    var r = this.rate;
    return this._act().some(function (v) {
      var nearEnd = remaining(v) < 0.2;
      return v.seeking || (!nearEnd && (v.readyState < 3 || ahead(v) < LOW_AHEAD * r));
    });
  };
  G._refilled = function () {
    var r = this.rate;
    return this._act().every(function (v) { return !v.seeking && v.readyState >= 3 && enough(v, RESUME_AHEAD * r); });
  };
  G._freeze = function () {
    if (!this.ready || this.frozen) return;
    this.frozen = true; this._pauseAll(); this._busy(true);
  };
  G._loop = function () {
    if (this.raf) return;
    var self = this;
    var step = function () {
      self.raf = 0;
      if (!self.inView) return;
      self._tick();
      self.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  };
  G._tick = function () {
    var self = this, m = this._master();
    this.v.forEach(function (v, i) { if (!self.on[i] && !v.paused) v.pause(); });
    if (!this.ready) { this._checkReady(); return; }
    if (this.frozen) {
      if (this._refilled()) { this.frozen = false; this._busy(false); if (this.want) this._playAll(); }
      else { if (this.onTick) this.onTick(m.currentTime || 0); return; }
    } else if (this.want && this._short()) { this._freeze(); if (this.onTick) this.onTick(m.currentTime || 0); return; }
    var t = m.currentTime || 0, dur = m.duration;
    if (this.want && (m.ended || (isFinite(dur) && t >= dur - FRAME))) { this.seek(0); return; }
    if (this.want && m.paused) { var p = m.play(); if (p && p.catch) p.catch(function () {}); }
    if (!this.want && !m.paused) m.pause();
    this._act().forEach(function (f) {
      if (f === m) return;
      if (!self._eligible(f)) {
        f.loop = true;
        if (self.want && f.paused) { var q = f.play(); if (q && q.catch) q.catch(function () {}); }
        if (!self.want && !f.paused) f.pause();
        return;
      }
      var d = f.currentTime - t, ad = Math.abs(d);
      if (ad > BIG || (!self.want && ad > FRAME)) { try { f.currentTime = t; } catch (e) {} }
      else if (ad > FRAME) f.playbackRate = self.rate * Math.max(0.85, Math.min(1.15, 1 - d * 2));
      else if (f.playbackRate !== self.rate) f.playbackRate = self.rate;
      if (self.want && f.paused) { var r = f.play(); if (r && r.catch) r.catch(function () {}); }
      if (!self.want && !f.paused) f.pause();
    });
    if (this.onTick) this.onTick(t);
  };

  /* public API: act on the clock only */
  G.play = function () { this.want = true; if (this.ready && !this.frozen && this.inView) this._playAll(); };
  G.pause = function () { this.want = false; this._pauseAll(); };
  G.toggle = function () { if (this.want) this.pause(); else this.play(); return this.want; };
  G.seek = function (t) {
    var self = this;
    this._act().forEach(function (v) {
      var tt = self._eligible(v) ? t : (isFinite(v.duration) ? t % v.duration : t);
      try { v.currentTime = Math.max(0, tt); } catch (e) {}
    });
    if (this.onTick) this.onTick(t);
  };
  G.restart = function () { this.seek(0); };
  G.setRate = function (r) { this.rate = r; this._applyRate(); };
  G.time = function () { return this._master().currentTime || 0; };
  G.duration = function () { return this._master().duration; };
  G.isPlaying = function () { return this.want; };
  // replace sources of several videos at once; only the listed indices stay active (others pause and are ignored)
  G.setSources = function (pairs, idxs) {
    var self = this;
    this.on = this.v.map(function (v, i) { return idxs.indexOf(i) >= 0; });
    this.ready = false; this.frozen = false; this._pauseAll(); this._busy(true);
    idxs.forEach(function (i, k) {
      var v = self.v[i], url = pairs[k][0], poster = pairs[k][1];
      if (poster) v.setAttribute("poster", poster);
      v.dataset.src = url;
      if (!self.loaded) return;
      if (v.getAttribute("src") !== url) { v.setAttribute("src", url); v.preload = "auto"; try { v.load(); } catch (e) {} }
      else { try { v.currentTime = 0; } catch (e) {} }
    });
    if (!this.loaded && this.inView) this.load();
  };
  // replace one video's source (Posterior Explorer); the group waits for it, then re-locks to the clock
  G.setSource = function (i, url, poster) {
    var v = this.v[i]; if (!v) return;
    if (poster) v.setAttribute("poster", poster);
    v.dataset.src = url;
    if (!this.loaded) return;
    if (v.getAttribute("src") === url) return;
    var t = this.time(), self = this;
    this.ready = false; this._busy(true); this._pauseAll();
    v.setAttribute("src", url); v.preload = "auto"; try { v.load(); } catch (e) {}
    v.addEventListener("loadeddata", function once() {
      v.removeEventListener("loadeddata", once);
      if (self._eligible(v)) { try { v.currentTime = t; } catch (e) {} }
    });
  };

  window.PPSync = {
    create: function (host, videos, opts) { var g = new Group(host, videos, opts); host._ppsync = g; window.PPSync.groups.push(g); return g; },
    groups: []
  };
  document.querySelectorAll("[data-sync-group]").forEach(function (host) {
    var vids = Array.prototype.slice.call(host.querySelectorAll("video"));
    if (vids.length) window.PPSync.create(host, vids, {});
  });
})();
