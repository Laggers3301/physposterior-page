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
    { id: "real_head",  label: "Real · head",     kind: "real", src: "./static/videos/pcbs_real_head_w.mp4",  poster: "./static/posters/pcbs_real_head.jpg" },
    { id: "sim_head",   label: "Sim · head",      kind: "sim",  src: "./static/videos/pcbs_sim_head_w.mp4",   poster: "./static/posters/pcbs_sim_head.jpg" },
    { id: "sim_exo",    label: "Sim · external",  kind: "sim",  src: "./static/videos/pcbs_sim_exo_w.mp4",    poster: "./static/posters/pcbs_sim_exo.jpg" },
    { id: "real_wrist", label: "Real · wrist",    kind: "real", src: "./static/videos/pcbs_real_wrist_w.mp4", poster: "./static/posters/pcbs_real_wrist.jpg" },
    { id: "sim_wrist",  label: "Sim · wrist",     kind: "sim",  src: "./static/videos/pcbs_sim_wrist_w.mp4",  poster: "./static/posters/pcbs_sim_wrist.jpg" }
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

/* Teleop episode 1 (run d01, cold run passed every check). Real cam_high / cam_left of episode_000001 re-ordered
   frame by frame with pcb_long_ep1/media/d01/fullsync_frame_map.json (teleop_frame_per_row); 30 fps, 4971 frames,
   165.7 s. Event times: frame-map group starts (cumulative rows / 30), same event definitions as episode 0. */
window.PP_TIMELINE_EP1 = {
  label: "Teleop episode 1",
  duration_s: 165.7,
  master: "sim_head",
  stats: "Episode 1: board-on-post error <b>0.0064 mm</b>, screw lateral error <b>≤ 0.024 mm</b>",
  streams: [
    { id: "real_head",  label: "Real · head",    src: "./static/videos/pcbs1_real_head_w.mp4",  poster: "./static/posters/pcbs1_real_head.jpg" },
    { id: "sim_head",   label: "Sim · head",     src: "./static/videos/pcbs1_sim_head_w.mp4",   poster: "./static/posters/pcbs1_sim_head.jpg" },
    { id: "sim_exo",    label: "Sim · external", src: "./static/videos/pcbs1_sim_exo_w.mp4",    poster: "./static/posters/pcbs1_sim_exo.jpg" },
    { id: "real_wrist", label: "Real · wrist",   src: "./static/videos/pcbs1_real_wrist_w.mp4", poster: "./static/posters/pcbs1_real_wrist.jpg" },
    { id: "sim_wrist",  label: "Sim · wrist",    src: "./static/videos/pcbs1_sim_wrist_w.mp4",  poster: "./static/posters/pcbs1_sim_wrist.jpg" }
  ],
  events: [
    { label: "Grasp board",    t: 10.967 },
    { label: "Seat board",     t: 21.6 },
    { label: "Place base",     t: 44.867 },
    { label: "Align on posts", t: 66.233 },
    { label: "Screw 1",        t: 88.133 },
    { label: "Screw 2",        t: 116.633 },
    { label: "Screw 3",        t: 136.767 },
    { label: "Screw 4",        t: 159.633 },
    { label: "Retreat",        t: 162.033 }
  ]
};
window.PP_TIMELINE.label = "Teleop episode 0";
window.PP_TIMELINE.stats = "Episode 0: board-on-post error <b>0.007 mm</b>, screw lateral error <b>≤ 0.028 mm</b>";
window.PP_TIMELINE_EPISODES = [window.PP_TIMELINE, window.PP_TIMELINE_EP1];
