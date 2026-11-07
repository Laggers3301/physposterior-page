# PhysPosterior project page

Source of the project page at https://laggers3301.github.io/physposterior-page/.

PhysPosterior infers a distribution over physical worlds from a short interaction and runs each of them, so disagreement on a new action is visible before execution. The page shows long-horizon precision assembly, humanoid dexterous manipulation, an in-browser physics playground (MuJoCo WebAssembly), posterior explorers, and agent and benchmark comparisons.

## Viewing locally

Serve the folder over HTTP (videos need range requests), for example:

```sh
python3 -m http.server 8000
```

then open http://localhost:8000/.

## Credits and licenses

- Page template adapted from [Nerfies](https://github.com/nerfies/nerfies.github.io), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Physics in the playground: [MuJoCo](https://github.com/google-deepmind/mujoco) WebAssembly build (Apache-2.0); rendering with [three.js](https://threejs.org/) (MIT).
- Font: Noto Sans, SIL Open Font License 1.1 (see `static/fonts/OFL.txt`).
- Page content, videos and figures: Copyright (c) 2026 Yijun Guo, CC BY-NC 4.0.
