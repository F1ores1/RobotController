# Robot Controller

An interactive 3D viewer for a FANUC LR Mate 200iD robot arm, built with Three.js and TypeScript. Drive all six joints with angle inputs or sliders, orbit the model, and play **RoboLimbo**, a built-in obstacle game where you pose the arm to slip through moving walls.

**Live demo: [robolimbo.pages.dev](https://robolimbo.pages.dev/)**

> Visualization only. Model joint limits are enforced; collisions and physical robot safety are not checked. J3 uses an independent model angle, not a teach-pendant angle.

## Features

- **Six-axis control.** Type an angle (arrow keys step by 1°) or drag a slider for each joint. Values are clamped to the model's joint limits.
- **Interactive 3D view.** Drag to orbit, scroll or pinch to zoom, and use **Reset view** to return to the isometric view with all axes zeroed.
- **MatCap rendering.** Spring-green robot paint, with a rebuilt, connected gripper (see [RENDERING.md](RENDERING.md)).
- **RoboLimbo.** A nine-wave obstacle course. Walls sweep toward the robot and you reposition joints to fit through the cutouts. Touching a wall ends the run, and clearing all nine waves wins.
- **Mobile friendly.** Joint controls are split into axes 1–3 and 4–6 for small screens.
- **WebMCP tools.** In browsers that expose `document.modelContext`, the app registers `read_robot_joints` and `set_robot_joint_angles` so an AI agent can read or set the simulated joints. These only affect the on-screen model and never connect to a physical robot.

## Joint limits

| Joint | Range (degrees) |
|---|---|
| J1 | -170 to +170 |
| J2 | -100 to +145 |
| J3 | -70 to +205 |
| J4 | -190 to +190 |
| J5 | -125 to +125 |
| J6 | -360 to +360 |

These are independent serial-model limits matching the ROS-Industrial LR Mate 200iD model. See [RIG-NOTES.md](RIG-NOTES.md) for pivot positions, axis conventions, why J3 differs from the teach-pendant angle, and sources.

## Getting started

Requires Node.js and npm.

```bash
npm ci
npm run dev
```

The dev server listens on all interfaces. To pick a port and host:

```bash
npm run dev -- --port 5183 --host 127.0.0.1
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks with `tsc` and builds to `dist/` |
| `npm run preview` | Serves the production build locally |

## Project structure

```
index.html            App shell
public/
  robot.glb           Rigged LR Mate model
  robolimbo-logo.png  RoboLimbo button art
  robolimbo-wall.svg  Wall graphic
src/
  main.ts             Entry point; wires state, GUI, renderer, game, and tools
  state.ts            Joint definitions, limits, and shared robot state
  gui.ts              Angle inputs, sliders, and axis group toggle
  renderer.ts         Three.js scene, camera, and model loading
  appearance*.ts      MatCap look and paint
  gripper.ts          Connected gripper geometry
  robododge.ts        RoboLimbo game loop and HUD
  robododge-rules.ts  Course order, wave timing, and run state
  robododge-collision.ts  Wall boxes and robot-vs-wall contact
  webmcp.ts           Optional WebMCP tool registration
  style.css           Styles
tests/
  robododge.test.mjs  Game rules and collision tests
RENDERING.md          Rendering and gripper notes
RIG-NOTES.md          Rig, joint limit, and model identification notes
```

## Tech stack

- [Three.js](https://threejs.org/) for rendering
- TypeScript
- [Vite](https://vitejs.dev/) for dev server and bundling
- Hosted on Cloudflare Pages

## Notes on the model

The source CAD model matches the standard LR Mate 200iD (717 mm reach). That is a model identification only, not verification of any specific physical machine's options, mounting, payload, or tool clearance. Anything intended for a real robot would need separate validation.

## Author

Braden Fioresi: [linkedin.com/in/braden-fioresi](https://www.linkedin.com/in/braden-fioresi)
