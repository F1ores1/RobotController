# LR Mate browser rig

## Files
- `LR_Mate_gripper_platform_rigged.glb`: same original geometry, materials and rest pose, plus six serial pivot nodes
- `lr-mate-rig.js`: optional Three.js binding helper and degree clamping
- `rig_verification.json`: numerical preservation and inheritance tests
- `create_web_rig.py`: reproducible builder; does not invoke Blender or re-export meshes

## Model identification
The source model is named `LRMate200iD-3d1`. Its measured shoulder-to-elbow distance is 330 mm; elbow-to-forearm offset 35 mm; forearm-to-wrist offset 335 mm; wrist-to-flange 80 mm; and shoulder lateral offset 50 mm. These match the standard LR Mate 200iD 717 mm reach model, rather than the /4S or /7L variants. Treat this as CAD/model identification, not verification of any physical machine's serial number or configured options.

## Serial chain
`Transform2_node` keeps the fixed `LinkBase_node` and gains `J1_Pivot`. J1 owns Axis1_node and J2; J2 owns Axis2_node and J3; this continues through J6. The gripper meshes and TCP remain under Axis6_node. Every table object remains outside the moving hierarchy.

Coordinate values below use Transform2_node's local GLB basis and millimeters. The GLB already has its original unit scale and orientation above this node; do not apply another 0.001 scale. The base mount is the original position, and all angle zero offsets are 0 degrees.

| Joint | Absolute rest pivot in CAD basis | Child offset from preceding pivot | Local positive axis | Degree limits |
|---|---|---|---|---|
| J1 | 330, 0, 0 | 330, 0, 0 | 1, 0, 0 | -170 to +170 |
| J2 | 330, 50, 0 | 0, 50, 0 | 0, 0, 1 | -100 to +145 |
| J3 | 660, 50, 0 | 330, 0, 0 | 0, 0, -1 | -70 to +205 |
| J4 | 695, 50, 0 | 35, 0, 0 | 0, -1, 0 | -190 to +190 |
| J5 | 695, 385, 0 | 0, 335, 0 | 0, 0, -1 | -125 to +125 |
| J6 | 695, 465, 0 | 0, 80, 0 | 0, -1, 0 | -360 to +360 |

Set `J1_Pivot` through `J6_Pivot` quaternions from each axis and the input degree angle. Each pivot has identity rest rotation. The asset's six original Axis nodes contain the required inverse pivot translation, so leave their translations alone.

## Limit and angle convention
Use the explicit independent serial-model joint ranges above and label them as model joint limits. They match the ROS-Industrial LR Mate 200iD model, whose package cites FANUC mechanical manuals B-83494EN/03 and B-83574EN/03. Do not replace J3 with ±210 degrees: the manufacturer's headline 420-degree J3 operating range and the independent serial-joint angle are different representations, owing to the J2/J3 interaction. FANUC's own driver documentation explicitly distinguishes its teach-pendant J3 angle from the serial-model J3 angle.

Recommended short UI disclosure: “Visualization only. Model joint limits are enforced; collisions and physical robot safety are not checked. J3 uses an independent model angle, not a teach-pendant angle.”

FANUC official product data verifies the standard LR Mate 200iD's 717 mm reach, 6 axes, and headline ranges 340, 245, 420, 380, 250, 720 degrees. It does not establish this uploaded CAD asset's machine-specific setup. Configured stop options, mounting, payload, tool clearance and collision limits would require separate validation on a physical system.

## Sources
- FANUC product page: https://www.fanucamerica.com/products/robot/lr-mate-200id
- FANUC dimensioned datasheet: https://www.fanucamerica.com/docs/default-source/robotics-files/lr-mate/lr-mate-200id-data-sheet.pdf
- ROS-Industrial exact serial model with signed limits: https://github.com/ros-industrial/fanuc/blob/noetic-devel/fanuc_lrmate200id_support/urdf/lrmate200id_macro.xacro
- ROS-Industrial source and manual provenance: https://github.com/ros-industrial/fanuc/blob/noetic-devel/fanuc_lrmate200id_support/package.xml
- FANUC official J3 convention explanation: https://fanuc-corporation.github.io/fanuc_driver_doc/v2.1.0/docs/troubleshooting/troubleshooting.html#j3-value-differs-from-the-value-on-the-teach-pendant

## Verified preservation
The original 71 nodes become 77 nodes. All 40 mesh-bearing nodes, the mesh dictionaries, material dictionaries, accessors, buffer views and complete original binary data remain unchanged. The largest rest world-matrix element difference is 4.44e-16. For each individual +15-degree move, fixed table and upstream nodes remain fixed and all downstream links and the gripper inherit the movement.
