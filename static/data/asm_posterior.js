/* Generated on compute server by _h20_scripts/build_asm_posterior_massfix.py from the mass-fix re-runs (massfix_r01):
   ep0 pcb_long/05_posterior_massfix_r01/scores_massfix_r01_all.json; ep1 pcb_long_ep1/05_posterior_ep1_massfix_r01/query_ep1_F4/posterior_scores_massfix_r01.json.
   The fixed release check is the only label; for ep1 it agrees with the PPBench seat check on all 160 runs. */
window.PP_ASM = {
 "source": "massfix_r01",
 "w15": {
  "query_world": 15,
  "action": "teleop episode 0",
  "grip_force_N": 4.0,
  "truth": {
   "run": "truth",
   "mu": 0.2845,
   "mass_g": 23.09,
   "ok": false,
   "fail": "IN_HAND_SLIP",
   "stage": "s03_lift_pcb",
   "clip": "E_slip_lift"
  },
  "post": [
   {
    "run": "post00",
    "mu": 0.6916,
    "mass_g": 39.72,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post01",
    "mu": 0.3263,
    "mass_g": 20.62,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s03_lift_pcb",
    "clip": null
   },
   {
    "run": "post02",
    "mu": 0.2395,
    "mass_g": 20.3,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s03_lift_pcb",
    "clip": null
   },
   {
    "run": "post03",
    "mu": 0.2171,
    "mass_g": 34.93,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s03_lift_pcb",
    "clip": null
   },
   {
    "run": "post04",
    "mu": 0.2676,
    "mass_g": 37.93,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s03_lift_pcb",
    "clip": null
   },
   {
    "run": "post05",
    "mu": 0.3374,
    "mass_g": 36.53,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s03_lift_pcb",
    "clip": null
   },
   {
    "run": "post06",
    "mu": 0.3922,
    "mass_g": 29.54,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s04_seat_pcb_a_carry",
    "clip": "F_slip_carry"
   },
   {
    "run": "post07",
    "mu": 0.4304,
    "mass_g": 25.13,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": "B_lowmu_pass"
   }
  ],
  "prior": [
   {
    "run": "prior00",
    "mu": 0.6554,
    "mass_g": 31.3,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior01",
    "mu": 1.075,
    "mass_g": 32.3,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": "C_marginal_seat"
   },
   {
    "run": "prior02",
    "mu": 0.4581,
    "mass_g": 31.09,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior03",
    "mu": 0.7491,
    "mass_g": 38.61,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior04",
    "mu": 0.4785,
    "mass_g": 27.82,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior05",
    "mu": 0.515,
    "mass_g": 38.72,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior06",
    "mu": 0.8972,
    "mass_g": 20.81,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior07",
    "mu": 0.8323,
    "mass_g": 29.05,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   }
  ],
  "posterior_success": "2/8",
  "prior_success": "8/8",
  "changed_runs": [
   "prior06"
  ]
 },
 "w05": {
  "query_world": 5,
  "action": "teleop episode 0",
  "grip_force_N": 4.0,
  "truth": {
   "run": "truth",
   "mu": 0.6558,
   "mass_g": 39.42,
   "ok": true,
   "fail": null,
   "stage": null,
   "clip": "A_seated_ok"
  },
  "post": [
   {
    "run": "post00",
    "mu": 0.6858,
    "mass_g": 22.95,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post01",
    "mu": 0.8438,
    "mass_g": 39.81,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post02",
    "mu": 0.6806,
    "mass_g": 39.16,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post03",
    "mu": 1.0654,
    "mass_g": 20.59,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": "D_seat_unsupported"
   },
   {
    "run": "post04",
    "mu": 0.6083,
    "mass_g": 23.46,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post05",
    "mu": 0.6597,
    "mass_g": 39.53,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post06",
    "mu": 0.9533,
    "mass_g": 34.72,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "post07",
    "mu": 0.3931,
    "mass_g": 21.84,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   }
  ],
  "prior": [],
  "posterior_success": "8/8",
  "prior_success": "not run",
  "changed_runs": [
   "post03"
  ]
 },
 "w15_grip8N": {
  "posterior_success": "1/8",
  "prior_success": "not run",
  "truth_passed": false
 },
 "hidden": {
  "action": "teleop episode 1",
  "gate": "fixed release check (board mass of each world); agrees with the PPBench seat check on all 160 runs",
  "worlds": [
   {
    "w": 0,
    "truth": {
     "run": "w00_truth",
     "mu": 0.5828,
     "mass_g": 31.45,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 0.875,
    "post": [
     {
      "run": "w00_post00",
      "mu": 0.4477,
      "mass_g": 31.46,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w00_post01",
      "mu": 0.5446,
      "mass_g": 20.98,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w00_post02",
      "mu": 0.4641,
      "mass_g": 34.16,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w00_post03",
      "mu": 0.6947,
      "mass_g": 39.89,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w00_post04",
      "mu": 0.8228,
      "mass_g": 20.26,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w00_post05",
      "mu": 0.6407,
      "mass_g": 36.23,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w00_post06",
      "mu": 0.3694,
      "mass_g": 31.46,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w00_post07",
      "mu": 1.0865,
      "mass_g": 38.57,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 1,
    "truth": {
     "run": "w01_truth",
     "mu": 0.3189,
     "mass_g": 30.66,
     "ok": false,
     "fail": "IN_HAND_SLIP",
     "stage": "s03_lift_pcb",
     "clip": "ep1_w01_truth"
    },
    "p_post": 0.375,
    "post": [
     {
      "run": "w01_post00",
      "mu": 0.2903,
      "mass_g": 38.93,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w01_post01",
      "mu": 0.2836,
      "mass_g": 32.94,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w01_post02",
      "mu": 0.2722,
      "mass_g": 34.06,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w01_post03",
      "mu": 0.373,
      "mass_g": 35.07,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w01_post04",
      "mu": 0.5235,
      "mass_g": 39.12,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w01_post05",
      "mu": 0.6729,
      "mass_g": 35.55,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w01_post06",
      "mu": 0.2561,
      "mass_g": 35.53,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w01_post07",
      "mu": 0.4669,
      "mass_g": 38.74,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 2,
    "truth": {
     "run": "w02_truth",
     "mu": 0.6494,
     "mass_g": 20.57,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": "ep1_w02_truth"
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w02_post00",
      "mu": 0.9766,
      "mass_g": 36.61,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post01",
      "mu": 0.7201,
      "mass_g": 35.89,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post02",
      "mu": 0.6132,
      "mass_g": 20.93,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post03",
      "mu": 0.7887,
      "mass_g": 37.55,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post04",
      "mu": 0.8382,
      "mass_g": 39.38,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post05",
      "mu": 0.5426,
      "mass_g": 20.24,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post06",
      "mu": 0.5465,
      "mass_g": 22.1,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w02_post07",
      "mu": 0.5039,
      "mass_g": 20.1,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 3,
    "truth": {
     "run": "w03_truth",
     "mu": 1.093,
     "mass_g": 34.31,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 0.875,
    "post": [
     {
      "run": "w03_post00",
      "mu": 0.7551,
      "mass_g": 33.47,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w03_post01",
      "mu": 1.0695,
      "mass_g": 36.34,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w03_post02",
      "mu": 0.7425,
      "mass_g": 30.28,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w03_post03",
      "mu": 1.0428,
      "mass_g": 21.44,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w03_post04",
      "mu": 0.2116,
      "mass_g": 21.37,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w03_post05",
      "mu": 1.0969,
      "mass_g": 26.86,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w03_post06",
      "mu": 1.076,
      "mass_g": 35.98,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w03_post07",
      "mu": 0.7334,
      "mass_g": 21.09,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 4,
    "truth": {
     "run": "w04_truth",
     "mu": 0.6404,
     "mass_g": 32.39,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w04_post00",
      "mu": 1.0606,
      "mass_g": 37.38,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post01",
      "mu": 1.0446,
      "mass_g": 39.84,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post02",
      "mu": 0.4949,
      "mass_g": 21.63,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post03",
      "mu": 0.4862,
      "mass_g": 39.53,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post04",
      "mu": 0.7452,
      "mass_g": 37.06,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post05",
      "mu": 0.3888,
      "mass_g": 23.05,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post06",
      "mu": 0.8094,
      "mass_g": 23.82,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w04_post07",
      "mu": 0.6997,
      "mass_g": 39.55,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 5,
    "truth": {
     "run": "w05_truth",
     "mu": 0.6558,
     "mass_g": 39.42,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": "ep1_w05_truth"
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w05_post00",
      "mu": 0.6858,
      "mass_g": 22.95,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post01",
      "mu": 0.8438,
      "mass_g": 39.81,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post02",
      "mu": 0.6806,
      "mass_g": 39.16,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post03",
      "mu": 1.0654,
      "mass_g": 20.59,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post04",
      "mu": 0.6083,
      "mass_g": 23.46,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post05",
      "mu": 0.6597,
      "mass_g": 39.53,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post06",
      "mu": 0.9533,
      "mass_g": 34.72,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w05_post07",
      "mu": 0.3931,
      "mass_g": 21.84,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 6,
    "truth": {
     "run": "w06_truth",
     "mu": 0.2969,
     "mass_g": 25.03,
     "ok": false,
     "fail": "IN_HAND_SLIP",
     "stage": "s03_lift_pcb",
     "clip": null
    },
    "p_post": 0.125,
    "post": [
     {
      "run": "w06_post00",
      "mu": 0.2436,
      "mass_g": 23.23,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w06_post01",
      "mu": 0.2541,
      "mass_g": 34.24,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w06_post02",
      "mu": 0.3115,
      "mass_g": 34.78,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w06_post03",
      "mu": 0.4041,
      "mass_g": 30.26,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w06_post04",
      "mu": 0.2558,
      "mass_g": 20.57,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w06_post05",
      "mu": 0.2696,
      "mass_g": 20.93,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w06_post06",
      "mu": 0.689,
      "mass_g": 39.32,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w06_post07",
      "mu": 0.2706,
      "mass_g": 36.71,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     }
    ]
   },
   {
    "w": 7,
    "truth": {
     "run": "w07_truth",
     "mu": 0.5218,
     "mass_g": 34.04,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": "ep1_w07_truth"
    },
    "p_post": 0.25,
    "post": [
     {
      "run": "w07_post00",
      "mu": 0.3932,
      "mass_g": 33.48,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": "ep1_w07_post00"
     },
     {
      "run": "w07_post01",
      "mu": 0.3221,
      "mass_g": 22.26,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w07_post02",
      "mu": 0.3984,
      "mass_g": 30.92,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w07_post03",
      "mu": 0.4725,
      "mass_g": 31.69,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w07_post04",
      "mu": 0.4757,
      "mass_g": 31.45,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w07_post05",
      "mu": 0.3656,
      "mass_g": 21.07,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w07_post06",
      "mu": 0.2717,
      "mass_g": 20.42,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w07_post07",
      "mu": 0.2502,
      "mass_g": 34.3,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     }
    ]
   },
   {
    "w": 8,
    "truth": {
     "run": "w08_truth",
     "mu": 0.7799,
     "mass_g": 34.82,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w08_post00",
      "mu": 0.8659,
      "mass_g": 38.96,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post01",
      "mu": 0.4947,
      "mass_g": 34.83,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post02",
      "mu": 1.017,
      "mass_g": 39.89,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post03",
      "mu": 0.4891,
      "mass_g": 36.14,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post04",
      "mu": 1.0612,
      "mass_g": 39.2,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post05",
      "mu": 1.091,
      "mass_g": 38.39,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post06",
      "mu": 0.7049,
      "mass_g": 38.57,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w08_post07",
      "mu": 0.5439,
      "mass_g": 38.2,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 9,
    "truth": {
     "run": "w09_truth",
     "mu": 0.6062,
     "mass_g": 27.29,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 0.875,
    "post": [
     {
      "run": "w09_post00",
      "mu": 0.6802,
      "mass_g": 23.74,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post01",
      "mu": 0.7148,
      "mass_g": 36.12,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post02",
      "mu": 0.9026,
      "mass_g": 39.66,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post03",
      "mu": 0.4047,
      "mass_g": 21.25,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post04",
      "mu": 0.4675,
      "mass_g": 23.65,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post05",
      "mu": 0.4425,
      "mass_g": 21.86,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post06",
      "mu": 0.7395,
      "mass_g": 24.93,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w09_post07",
      "mu": 0.3777,
      "mass_g": 31.25,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     }
    ]
   },
   {
    "w": 10,
    "truth": {
     "run": "w10_truth",
     "mu": 0.7801,
     "mass_g": 37.49,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w10_post00",
      "mu": 1.0723,
      "mass_g": 39.68,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post01",
      "mu": 0.8151,
      "mass_g": 37.8,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post02",
      "mu": 0.5899,
      "mass_g": 27.02,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post03",
      "mu": 0.3961,
      "mass_g": 24.88,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post04",
      "mu": 0.4472,
      "mass_g": 36.55,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post05",
      "mu": 0.6181,
      "mass_g": 21.43,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post06",
      "mu": 1.0633,
      "mass_g": 37.18,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w10_post07",
      "mu": 0.6246,
      "mass_g": 39.6,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 11,
    "truth": {
     "run": "w11_truth",
     "mu": 1.036,
     "mass_g": 32.82,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": "ep1_w11_truth"
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w11_post00",
      "mu": 0.8116,
      "mass_g": 23.6,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post01",
      "mu": 1.081,
      "mass_g": 32.54,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post02",
      "mu": 1.0826,
      "mass_g": 23.15,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post03",
      "mu": 0.6914,
      "mass_g": 20.72,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post04",
      "mu": 1.0889,
      "mass_g": 39.83,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post05",
      "mu": 0.8168,
      "mass_g": 24.0,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post06",
      "mu": 1.0354,
      "mass_g": 33.51,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w11_post07",
      "mu": 0.8166,
      "mass_g": 22.33,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 12,
    "truth": {
     "run": "w12_truth",
     "mu": 0.9689,
     "mass_g": 24.67,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 1.0,
    "post": [
     {
      "run": "w12_post00",
      "mu": 0.6592,
      "mass_g": 26.98,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w12_post01",
      "mu": 0.6825,
      "mass_g": 20.54,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w12_post02",
      "mu": 0.5883,
      "mass_g": 20.36,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w12_post03",
      "mu": 1.0023,
      "mass_g": 34.69,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w12_post04",
      "mu": 0.9494,
      "mass_g": 24.04,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w12_post05",
      "mu": 0.8388,
      "mass_g": 24.62,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w12_post06",
      "mu": 1.0698,
      "mass_g": 22.61,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": "ep1_w12_post06"
     },
     {
      "run": "w12_post07",
      "mu": 0.9418,
      "mass_g": 23.0,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 13,
    "truth": {
     "run": "w13_truth",
     "mu": 0.942,
     "mass_g": 30.11,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 0.875,
    "post": [
     {
      "run": "w13_post00",
      "mu": 1.0662,
      "mass_g": 20.31,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": "ep1_w13_post00"
     },
     {
      "run": "w13_post01",
      "mu": 1.0777,
      "mass_g": 38.12,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w13_post02",
      "mu": 0.6527,
      "mass_g": 21.1,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w13_post03",
      "mu": 1.0718,
      "mass_g": 39.32,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w13_post04",
      "mu": 0.6257,
      "mass_g": 37.64,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w13_post05",
      "mu": 0.9894,
      "mass_g": 36.77,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w13_post06",
      "mu": 0.8581,
      "mass_g": 25.88,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w13_post07",
      "mu": 0.3563,
      "mass_g": 20.17,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": "ep1_w13_post07"
     }
    ]
   },
   {
    "w": 14,
    "truth": {
     "run": "w14_truth",
     "mu": 0.6561,
     "mass_g": 27.73,
     "ok": true,
     "fail": null,
     "stage": null,
     "clip": null
    },
    "p_post": 0.875,
    "post": [
     {
      "run": "w14_post00",
      "mu": 0.4354,
      "mass_g": 20.39,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w14_post01",
      "mu": 0.6029,
      "mass_g": 20.68,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w14_post02",
      "mu": 0.3795,
      "mass_g": 20.72,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w14_post03",
      "mu": 0.7557,
      "mass_g": 37.93,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w14_post04",
      "mu": 0.9739,
      "mass_g": 39.68,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w14_post05",
      "mu": 0.3606,
      "mass_g": 20.33,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w14_post06",
      "mu": 0.5461,
      "mass_g": 25.74,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w14_post07",
      "mu": 0.497,
      "mass_g": 22.84,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   },
   {
    "w": 15,
    "truth": {
     "run": "w15_truth",
     "mu": 0.2845,
     "mass_g": 23.09,
     "ok": false,
     "fail": "IN_HAND_SLIP",
     "stage": "s03_lift_pcb",
     "clip": null
    },
    "p_post": 0.25,
    "post": [
     {
      "run": "w15_post00",
      "mu": 0.6916,
      "mass_g": 39.72,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     },
     {
      "run": "w15_post01",
      "mu": 0.3263,
      "mass_g": 20.62,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w15_post02",
      "mu": 0.2395,
      "mass_g": 20.3,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w15_post03",
      "mu": 0.2171,
      "mass_g": 34.93,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": "ep1_w15_post03"
     },
     {
      "run": "w15_post04",
      "mu": 0.2676,
      "mass_g": 37.93,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w15_post05",
      "mu": 0.3374,
      "mass_g": 36.53,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s03_lift_pcb",
      "clip": null
     },
     {
      "run": "w15_post06",
      "mu": 0.3922,
      "mass_g": 29.54,
      "ok": false,
      "fail": "IN_HAND_SLIP",
      "stage": "s04_seat_pcb_a_carry",
      "clip": null
     },
     {
      "run": "w15_post07",
      "mu": 0.4304,
      "mass_g": 25.13,
      "ok": true,
      "fail": null,
      "stage": null,
      "clip": null
     }
    ]
   }
  ],
  "prior": [
   {
    "run": "prior00",
    "mu": 0.6554,
    "mass_g": 31.3,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior01",
    "mu": 1.075,
    "mass_g": 32.3,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior02",
    "mu": 0.4581,
    "mass_g": 31.09,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": "ep1_prior02"
   },
   {
    "run": "prior03",
    "mu": 0.7491,
    "mass_g": 38.61,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior04",
    "mu": 0.4785,
    "mass_g": 27.82,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior05",
    "mu": 0.515,
    "mass_g": 38.72,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior06",
    "mu": 0.8972,
    "mass_g": 20.81,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior07",
    "mu": 0.8323,
    "mass_g": 29.05,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior08",
    "mu": 0.5916,
    "mass_g": 32.47,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior09",
    "mu": 0.7392,
    "mass_g": 33.11,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior10",
    "mu": 0.3743,
    "mass_g": 21.38,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s04_seat_pcb_b_down",
    "clip": "ep1_prior10"
   },
   {
    "run": "prior11",
    "mu": 0.2857,
    "mass_g": 22.26,
    "ok": false,
    "fail": "IN_HAND_SLIP",
    "stage": "s03_lift_pcb",
    "clip": null
   },
   {
    "run": "prior12",
    "mu": 0.7333,
    "mass_g": 26.86,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior13",
    "mu": 1.0688,
    "mass_g": 26.64,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior14",
    "mu": 0.819,
    "mass_g": 31.45,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   },
   {
    "run": "prior15",
    "mu": 0.7552,
    "mass_g": 25.59,
    "ok": true,
    "fail": null,
    "stage": null,
    "clip": null
   }
  ],
  "p_prior": 0.875,
  "score_post": {
   "label": "pp posterior S1",
   "n_worlds": 16,
   "mean_predicted": 0.7734,
   "actual_success_rate": 0.8125,
   "brier": 0.0537,
   "brier_ci95": [
    0.0078,
    0.124
   ],
   "calibration_gap": 0.0391,
   "brier_climatology": 0.1523,
   "brier_skill_vs_climatology": 0.6474,
   "bss_note": null
  },
  "score_prior": {
   "label": "pp prior S1",
   "n_worlds": 16,
   "mean_predicted": 0.875,
   "actual_success_rate": 0.8125,
   "brier": 0.1562,
   "brier_ci95": [
    0.0156,
    0.2969
   ],
   "calibration_gap": 0.0625,
   "brier_climatology": 0.1523,
   "brier_skill_vs_climatology": -0.0256,
   "bss_note": null
  },
  "fixed_scores": {
   "worlds_scored": 16,
   "truth_success": "13/16",
   "prior_success": "14/16",
   "n_prior": 16,
   "p_prior": 0.875,
   "mean_p_posterior": 0.7734375,
   "brier_posterior": 0.0537109375,
   "brier_prior": 0.15625,
   "brier_climatology_truth_rate": 0.15234375
  }
 }
};
window.PP_ASM_WRIST = ["A_seated_ok", "B_lowmu_pass", "C_marginal_seat", "D_seat_unsupported", "E_slip_lift", "F_slip_carry"];
/* Clip ids whose corrected head render asmp_<id>_head_display.mp4 exists (the earlier *_head.mp4 renders were upside down and are not used). */
window.PP_ASM_HEAD = ["A_seated_ok", "B_lowmu_pass", "C_marginal_seat", "D_seat_unsupported", "E_slip_lift", "F_slip_carry"];
/* Rendered ep1 runs among the 16 hidden worlds (site_interactive_20261107/assembly_posterior/worlds.json "rendered"). */
window.PP_ASM_EP1_CLIPS = ["prior02", "prior10", "w01_truth", "w02_truth", "w05_truth", "w07_post00", "w07_truth", "w11_truth", "w12_post06", "w13_post00", "w13_post07", "w15_post03"];
PP_ASM_EP1_CLIPS.forEach(function (r) { PP_ASM_HEAD.push("ep1_" + r); PP_ASM_WRIST.push("ep1_" + r); });
(function () {
  var set = {}; PP_ASM_EP1_CLIPS.forEach(function (r) { set[r] = 1; });
  var tag = function (p) { if (set[p.run]) p.clip = "ep1_" + p.run; };
  PP_ASM.hidden.worlds.forEach(function (w) { tag(w.truth); w.post.forEach(tag); });
  PP_ASM.hidden.prior.forEach(tag);
})();
