/* Agent R2S comparison. Milestones from r2s_agent_open_compare_20261107_r01/scoring/results/*.json
   (delivered.milestones), extracted on compute server. Videos: runs/full/<id>/task/out/render.mp4, re-encoded on compute server;
   MiMo uses scoring/rerun/mimo because its own render file was truncated. */
/* replay: set to true and point video/poster to agent_replays/ once the common-renderer replays exist. */
window.PP_AGENTS = [
  { name: "Claude Opus 5.5", id: "claude", ms: [1, 1, 1, 1, 1],
    note: "Completed all five milestones. After lowering friction from 0.4 to 0.3 and rerunning, it placed only one screw." },
  { name: "Kimi K3.1 Pro", id: "kimi", ms: [0, 0, 0, 0, 0], note: "No milestone completed." },
  { name: "GLM-5.3", id: "glm", ms: [0, 0, 0, 0, 0], note: "No milestone completed." },
  { name: "DeepSeek V4.1 Flash", id: "deepseek", ms: [0, 0, 0, 0, 0], note: "No milestone completed." },
  { name: "Doubao Seed 2.1 Pro", id: "doubao", ms: [0, 0, 0, 0, 0], note: "No milestone completed. Its render shows almost none of the scene; scored by manual inspection." },
  { name: "MiMo V2.6 Pro", id: "mimo", ms: [0, 0, 0, 0, 0], note: "No milestone completed. Video from the scorer's rerun of its code." }
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
