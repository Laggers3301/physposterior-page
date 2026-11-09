(function () {
  "use strict";
  var host = document.getElementById("r2s-media");
  if (!host || !window.PPSync) return;
  var videos = Array.prototype.slice.call(host.querySelectorAll("video"));
  var play = document.getElementById("r2s-play"), scrub = document.getElementById("r2s-scrub");
  var group = window.PPSync.create(host, videos, { autoplay: false, onTick: function (t) {
    document.getElementById("r2s-time").textContent = t.toFixed(1) + " s / 171.7 s";
    if (document.activeElement !== scrub) scrub.value = Math.round(t / 171.666667 * 1000);
  }});
  play.addEventListener("click", function () {
    if (group.isPlaying()) { group.pause(); play.textContent = "Play"; }
    else { group.play(); play.textContent = "Pause"; }
  });
  scrub.addEventListener("input", function () { group.seek(Number(scrub.value) / 1000 * 171.666667); });
  document.querySelectorAll("#r2s-rate button").forEach(function (button) {
    button.addEventListener("click", function () {
      group.setRate(Number(button.dataset.r));
      document.querySelectorAll("#r2s-rate button").forEach(function (b) { b.classList.toggle("active", b === button); });
    });
  });
})();
