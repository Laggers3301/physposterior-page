/* Five-view timeline for the long-horizon precision assembly (run c09).
   Source: site_interactive_20261107/pcb_long_sync/timeline.json (schema pp-site-sync-timeline-v1):
   30 fps, 5150 frames, 171.667 s; frame k of every clip is shown at k/30 s. Event times are the "t_s" values
   of that file (English labels added here). Videos: the five pcb_long_sync clips; the three files above 10 MB
   were re-encoded on compute server with all 5150 frames kept. */
window.PP_TIMELINE = {
  placeholder: false,
  source: "pcb_long_sync/timeline.json",
  duration_s: 171.667,
  master: "sim_head",
  streams: [
    { id: "real_head",  label: "Real · head",     kind: "real", src: "./static/videos/pcbs_real_head.mp4",  poster: "./static/posters/pcbs_real_head.jpg" },
    { id: "sim_head",   label: "Sim · head",      kind: "sim",  src: "./static/videos/pcbs_sim_head.mp4",   poster: "./static/posters/pcbs_sim_head.jpg" },
    { id: "sim_exo",    label: "Sim · external",  kind: "sim",  src: "./static/videos/pcbs_sim_exo.mp4",    poster: "./static/posters/pcbs_sim_exo.jpg" },
    { id: "real_wrist", label: "Real · wrist",    kind: "real", src: "./static/videos/pcbs_real_wrist.mp4", poster: "./static/posters/pcbs_real_wrist.jpg" },
    { id: "sim_wrist",  label: "Sim · wrist",     kind: "sim",  src: "./static/videos/pcbs_sim_wrist.mp4",  poster: "./static/posters/pcbs_sim_wrist.jpg" }
  ],
  events: [
    { label: "Grasp board",    t: 11.333 },
    { label: "Seat board",     t: 22.267 },
    { label: "Place base",     t: 47.833 },
    { label: "Align on posts", t: 68.5 },
    { label: "Screw 1",        t: 91.167 },
    { label: "Screw 2",        t: 115.1 },
    { label: "Screw 3",        t: 135.9 },
    { label: "Screw 4",        t: 164.833 },
    { label: "Retreat",        t: 167.267 }
  ]
};
window.PP_TIMELINE_PLACEHOLDER = window.PP_TIMELINE;
