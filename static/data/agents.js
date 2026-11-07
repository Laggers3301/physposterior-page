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
