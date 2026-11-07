/* Agent R2S comparison. Milestones from r2s_agent_open_compare_20261107_r01/scoring/results/*.json (delivered.milestones).
   Third-person videos: site_interactive_20261107/agent_replays/<id>_web.mp4 — each agent's saved states replayed with one
   common renderer, one fixed third-person camera, 7164 frames on the teleoperation clock (same clock as the head views). */
window.PP_AGENTS = [
  { name: "Claude Opus 5.5", id: "claude", replay: true, video: "./static/videos/agent_claude_third_web.mp4", poster: "./static/posters/agent_claude_third_web.jpg", ms: [1, 1, 1, 1, 1],
    note: "Completed all five milestones. After lowering friction from 0.4 to 0.3 and rerunning, it placed only one screw." },
  { name: "Kimi K3.1 Pro", id: "kimi", replay: true, video: "./static/videos/agent_kimi_third_web.mp4", poster: "./static/posters/agent_kimi_third_web.jpg", ms: [0, 0, 0, 0, 0], note: "No milestone completed." },
  { name: "GLM-5.3", id: "glm", replay: true, video: "./static/videos/agent_glm_v4_third_web.mp4", poster: "./static/posters/agent_glm_v4_third_web.jpg", ms: [0, 0, 0, 0, 0], note: "No milestone completed." },
  { name: "DeepSeek V4.1 Flash", id: "deepseek", replay: true, video: "./static/videos/agent_deepseek_v2_third_web.mp4", poster: "./static/posters/agent_deepseek_v2_third_web.jpg", ms: [0, 0, 0, 0, 0], note: "No milestone completed. Its output ends at 128.3 s and the last state is held." },
  { name: "Doubao Seed 2.1 Pro", id: "doubao", replay: true, video: "./static/videos/agent_doubao_third_web.mp4", poster: "./static/posters/agent_doubao_third_web.jpg", ms: [0, 0, 0, 0, 0], note: "No milestone completed. Its state time axis is invalid and a screw flies out of the scene, so the replay stops there (row 659) and holds." },
  { name: "MiMo V2.6 Pro", id: "mimo", replay: true, video: "./static/videos/agent_mimo_third_web.mp4", poster: "./static/posters/agent_mimo_third_web.jpg", ms: [0, 0, 0, 0, 0], note: "No milestone completed." }
];

/* Eight head-camera views on one teleoperation clock (7164 frames, 30 fps). Rendered on compute server by the render agent
   (site_interactive_20261107/agent_replays): agents replayed from their saved states with the PP scene's head camera. */
window.PP_AGENT_HEADS = [
  { name: "Real teleoperation", kind: "real", src: "real_cam_high_teleop_clock_web", screws: "4 / 4" },
  { name: "PhysPosterior", kind: "sim", src: "pp_sim_head_teleop_clock_web", screws: "4 / 4", ms: "5 / 5" },
  { name: "Claude Opus 5.5", kind: "sim", src: "agent_claude_head_web", screws: "4 / 4", ms: "5 / 5" },
  { name: "Kimi K3.1 Pro", kind: "sim", src: "agent_kimi_head_web", screws: "0 / 4", ms: "0 / 5" },
  { name: "GLM-5.3", kind: "sim", src: "agent_glm_v4_head_web", screws: "0 / 4", ms: "0 / 5", note: "fixture placed differently from PP" },
  { name: "DeepSeek V4.1 Flash", kind: "sim", src: "agent_deepseek_v2_head_web", screws: "0 / 4", ms: "0 / 5", note: "base 0.12 m lower; output ends at 128.3 s, then held" },
  { name: "Doubao Seed 2.1 Pro", kind: "sim", src: "agent_doubao_head_web", screws: "0 / 4", ms: "0 / 5", note: "time axis invalid and a screw flies off; replay stops at row 659" },
  { name: "MiMo V2.6 Pro", kind: "sim", src: "agent_mimo_head_web", screws: "0 / 4", ms: "0 / 5", note: "fixture placed differently from PP" }
];
