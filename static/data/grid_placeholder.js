/* PLACEHOLDER data for the Posterior Explorer (internal model, see explorer.js).
   Success pattern and probability masses are synthetic; every cell reuses one of two existing clips
   (a posterior success draw and a posterior failure draw). Axis values are the grid design of the render job.
   Real data: static/interactive/explorer/<task>/grid.json (schema pp-site-posterior-explorer-v1), loaded automatically over http. */
(function () {
  var MU = [0.15, 0.25, 0.35, 0.5, 0.7, 1.0], FS = [0.2, 0.35, 0.5, 0.8, 1.2];
  function gauss(ci, cj, s) {
    var m = [], tot = 0, i, j;
    for (i = 0; i < 6; i++) { m.push([]); for (j = 0; j < 5; j++) { var v = Math.exp(-((i - ci) * (i - ci) + (j - cj) * (j - cj)) / (2 * s * s)); m[i].push(v); tot += v; } }
    for (i = 0; i < 6; i++) for (j = 0; j < 5; j++) m[i][j] /= tot;
    return m;
  }
  function uniform() { var m = [], i, j; for (i = 0; i < 6; i++) { m.push([]); for (j = 0; j < 5; j++) m[i].push(1 / 30); } return m; }
  function cells(prefix, rule) {
    var c = [], i, j;
    for (i = 0; i < 6; i++) {
      c.push([]);
      for (j = 0; j < 5; j++) {
        var ok = rule(i, j), clip = ok ? prefix + "_post_success_head" : prefix + "_post_fail_head";
        c[i].push({ video: "./static/videos/" + clip + ".mp4", poster: "./static/posters/" + clip + ".jpg",
                    success: ok, failure: ok ? null : "placeholder", lift_mm: null, tilt_deg: null });
      }
    }
    return c;
  }
  window.PP_GRID_PLACEHOLDER = {
    placeholder: true,
    tasks: [
      { id: "pcb", label: "Dexterous PCB transfer", mu: MU, force: FS,
        real: { video: "./static/videos/dex_real_head.mp4", poster: "./static/posters/dex_real_head.jpg",
                outcome: "Real outcome: the PCB slipped out of the hand during the carry (failed take)." },
        actions: [
          { id: "default", label: "Default", cells: cells("dex", function (i, j) { return i + j >= 2; }) },
          { id: "stress", label: "Weak grip + fast carry", cells: cells("dex", function (i, j) { return i + j >= 5; }) }
        ],
        prior: [{ id: "uniform", label: "Uniform prior", m: uniform() }],
        posterior: [{ id: "p", label: "Posterior", m: gauss(2, 2, 1.0) }] },
      { id: "apple", label: "Apple", mu: MU, force: FS,
        real: { video: "./static/videos/apple_real_head.mp4", poster: "./static/posters/apple_real_head.jpg",
                outcome: "Real outcome: the apple was lifted, then dropped when the hand opened in the air." },
        actions: [
          { id: "default", label: "Default", cells: cells("apple", function (i, j) { return i + 2 * j >= 3; }) },
          { id: "stress", label: "Weak grip + fast carry", cells: cells("apple", function (i, j) { return i + 2 * j >= 6; }) }
        ],
        prior: [{ id: "uniform", label: "Uniform prior", m: uniform() }],
        posterior: [{ id: "p", label: "Posterior", m: gauss(3, 2, 1.0) }] }
    ]
  };
})();
