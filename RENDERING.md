# Selected robot controller rendering

MatCap is the selected renderer. Its fixed shape contrast is 0.8, the robot paint is Spring (#78B84C), and startup/reset uses 2x isometric zoom focused on the robot. All six joint inputs and sliders are retained.

## Connected gripper

The original GLB is preserved. `src/gripper.ts` replaces five disconnected gripper display meshes under Axis6_node with a beveled housing, connected cross-slide, two jaw carriages and graphite fingers with mounting collars. Four recessed-style fasteners complete the housing. This is a visual design, not manufacturing geometry.

The original wrist adapter and TCP are preserved. Housing envelope, fingertip reach (CAD Y=584 mm), finger centers (Z=+/-53 mm), finger thickness (11 mm), opening width (95 mm), and the overall gripper envelope are retained. The fingers are seated inside the carriages rather than separated by an air gap. Differing face heights avoid coplanar overlap.

Run `npm ci` then `npm run dev -- --port 5183 --host 127.0.0.1`.
