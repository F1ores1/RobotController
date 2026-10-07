import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Replace the disconnected display meshes in the wrist's original millimeter CAD frame.
 * X = height, Y = forward reach, Z = jaw spacing. Joint pivots and TCP stay untouched.
 */
export function refineGripper(model: THREE.Object3D) {
  const wrist = model.getObjectByName('Axis6_node');
  if (!wrist) throw new Error('Gripper wrist frame is missing.');
  const replaced = new Set([
    'ADDED | Robot 1 can finger', 'ADDED | Robot 1 can finger.001',
    'ADDED | Robot 1 jaw slide', 'ADDED | Robot 1 jaw slide.001',
    'ADDED | Robot 1 parallel gripper body',
  ]);
  const originals = wrist.children.filter(child => replaced.has(child.userData.name));
  if (originals.length !== replaced.size) throw new Error('Gripper display meshes are missing.');
  originals.forEach(child => wrist.remove(child));

  const assembly = new THREE.Group();
  assembly.name = 'Connected_gripper';
  assembly.position.set(695, 499, 0);
  wrist.add(assembly);
  const aluminum = new THREE.MeshStandardMaterial({color: 0xabb1b5});
  const slideMetal = new THREE.MeshStandardMaterial({color: 0x747d84});
  const graphite = new THREE.MeshStandardMaterial({color: 0x30373c});
  const screwMetal = new THREE.MeshStandardMaterial({color: 0x454c52});

  function block(name: string, size: [number, number, number], position: [number, number, number], material: THREE.Material, bevel: number) {
    const part = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, bevel), material);
    part.name = name;
    part.position.set(...position);
    part.castShadow = true;
    part.receiveShadow = true;
    assembly.add(part);
    return part;
  }

  // Original housing envelope: 42 mm high, 52 mm long, 74 mm wide.
  block('Gripper_housing', [42, 52, 74], [0, 0, 0], aluminum, 2);
  // This bridge crosses the old air gaps and is physically embedded in both jaw slides.
  block('Cross_slide_bridge', [28, 16, 108], [0, 23, 0], slideMetal, 1.2);
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'left' : 'right';
    block('Jaw_carriage_' + suffix, [40, 14, 18], [0, 26, side * 53], aluminum, 1);
    // Seat the rear 3 mm inside the carriage. Different face heights remove coplanar flicker.
    // Tips remain at CAD Y=584 and centers at Z=+/-53; no change to reach or opening.
    block('Finger_' + suffix, [36, 55, 11], [0, 57.5, side * 53], graphite, 1);
    block('Finger_mount_' + suffix, [32, 15, 13], [0, 34, side * 53], slideMetal, .7);
  }

  // Four shallow hex sockets on the housing's visible top face.
  for (const y of [-16, 13]) for (const z of [-25, 25]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1, 16), screwMetal);
    head.rotation.z = -Math.PI / 2;
    head.position.set(20.8, y, z);
    head.name = 'Housing_fastener';
    assembly.add(head);
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .15, 6), graphite);
    socket.rotation.z = -Math.PI / 2;
    socket.position.set(21.34, y, z);
    socket.name = 'Fastener_socket';
    assembly.add(socket);
  }
  return assembly;
}
