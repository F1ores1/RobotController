import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DodgeRun,COURSE,GATE_SECONDS,POSES,waveSeconds} from '../src/robododge-rules.ts';
import {obstacleBoxes,waveBoxes,travelAxis,robotTouchesWall,WALL_HALF_WIDTH,WALL_BOTTOM,WALL_TOP,RAIL_OFFSET} from '../src/robododge-collision.ts';
import {refineGripper} from '../src/gripper.ts';
test('nine waves include three slower shoulder variations',()=>{
 const r=new DodgeRun();r.start();
 assert.deepEqual([...COURSE],[0,1,2,5,6,7,0,3,4]);
 assert.deepEqual(COURSE.map((_,i)=>waveSeconds(i)),[5,5,5,10,10,10,10,10,5]);
 assert.deepEqual(COURSE.map(travelAxis),['z','z','z','z','z','z','z','x','x'],'only one direction transition, after the original fourth wave');
 for(let i=0;i<COURSE.length;i++){
  assert.equal(r.remaining,waveSeconds(i));
  assert.equal(r.tick(waveSeconds(i)-.1,false),null);
  assert.equal(r.tick(.1,false),'clear');
 }
 assert.equal(r.phase,'won');assert.equal(r.cleared,9);assert.equal(r.tick(50,false),null);assert.equal(r.gate,8);
});
test('first collision fails immediately and retry resets the run',()=>{const r=new DodgeRun();r.start();assert.equal(r.tick(.016,true),'hit');assert.equal(r.phase,'lost');assert.equal(r.cleared,0);assert.equal(r.tick(50,false),null);r.start();assert.equal(r.phase,'running');assert.equal(r.gate,0);});
test('pause freezes motion',()=>{const r=new DodgeRun();r.start();r.pause();r.tick(100,true);assert.equal(r.remaining,GATE_SECONDS);assert.equal(r.phase,'paused');});

test('every wall is centered inside the rails with its pedestal cutout open at the bottom',()=>{
 const base=new THREE.Vector3(.556,.33,1.101);
 for(let shape=0;shape<POSES.length;shape++){
  const boxes=waveBoxes(shape,base),crossAxis=travelAxis(shape)==='z'?'x':'z';
  const envelope=boxes.reduce((bounds,box)=>bounds.union(box),new THREE.Box3());
  assert.ok(Math.abs(envelope.min[crossAxis]-(base[crossAxis]-WALL_HALF_WIDTH))<1e-9);
  assert.ok(Math.abs(envelope.max[crossAxis]-(base[crossAxis]+WALL_HALF_WIDTH))<1e-9);
  assert.equal(envelope.min.y,WALL_BOTTOM);assert.equal(envelope.max.y,WALL_TOP);
  assert.ok(envelope.min[crossAxis]>base[crossAxis]-RAIL_OFFSET+.008);
  assert.ok(envelope.max[crossAxis]<base[crossAxis]+RAIL_OFFSET-.008);
  const opening=new THREE.Box3(new THREE.Vector3(-.09,WALL_BOTTOM-.01,-.09),new THREE.Vector3(.09,.18,.09));
  opening.min[crossAxis]+=base[crossAxis];opening.max[crossAxis]+=base[crossAxis];
  assert.equal(boxes.some(box=>box.intersectsBox(opening)),false,`wave shape ${shape} must be bottom-open`);
 }
});
test('actual robot clears each stepped opening; mismatched extended arms touch solid blocks only at depth overlap',async()=>{
 const file=await readFile(new URL('../public/robot.glb',import.meta.url));
 const model=(await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
 refineGripper(model);model.updateMatrixWorld(true);
 const robot=model.getObjectByName('J1_Pivot'),base=robot.getWorldPosition(new THREE.Vector3());
 const elbow=model.getObjectByName('J3_Pivot');
 for(let shape=0;shape<5;shape++){
  robot.quaternion.identity();elbow.quaternion.identity();const {axis,angle}=POSES[shape];model.getObjectByName(`J${axis}_Pivot`).quaternion.setFromAxisAngle(new THREE.Vector3(...(axis===1?[1,0,0]:[0,0,-1])),THREE.MathUtils.degToRad(angle));model.updateMatrixWorld(true);
  const boxes=waveBoxes(shape,base);const direction=travelAxis(shape);
  assert.equal(robotTouchesWall(robot,boxes,base[direction]-1.5,base[direction]+.8,direction),false,`pose ${angle} must pass`);
 }
 robot.quaternion.identity();elbow.quaternion.identity();model.updateMatrixWorld(true);
 for(const shape of [3,4]){robot.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),(shape===3?-90:90)*Math.PI/180);model.updateMatrixWorld(true);assert.equal(travelAxis(shape),'x');assert.equal(robotTouchesWall(robot,waveBoxes(shape,base),base.x-1.5,base.x+.8,'x'),true,'opposite base turn must hit the perpendicular wall');}
 robot.quaternion.identity();model.updateMatrixWorld(true);const tall=obstacleBoxes(1,base.x);
 assert.equal(robotTouchesWall(robot,tall,base.z-2,base.z-1),false,'distant walls cannot hit');
 assert.equal(robotTouchesWall(robot,tall,base.z-.3,base.z+.3),true,'swept wall must hit the extended arm');
});
test('3D depth matters even with identical side projection',()=>{
 const robot=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1));robot.position.set(0,.5,3);
 const boxes=[new THREE.Box3(new THREE.Vector3(-1,0,-.1),new THREE.Vector3(1,1,.1))];
 assert.equal(robotTouchesWall(robot,boxes,0,1),false);
 assert.equal(robotTouchesWall(robot,boxes,2.8,3.2),true);
});

test('shoulder waves clear their reference poses and require axis 2 movement',async()=>{
 const file=await readFile(new URL('../public/robot.glb',import.meta.url));
 const model=(await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
 refineGripper(model);model.updateMatrixWorld(true);
 const robot=model.getObjectByName('J1_Pivot'),shoulder=model.getObjectByName('J2_Pivot'),elbow=model.getObjectByName('J3_Pivot');
 const base=robot.getWorldPosition(new THREE.Vector3());
 for(let shape=5;shape<POSES.length;shape++){
  const saved=[robot,shoulder,elbow].map(p=>p.quaternion.clone());
  const boxes=waveBoxes(shape,base);
  [robot,shoulder,elbow].forEach((p,i)=>assert.ok(p.quaternion.equals(saved[i]),'opening generation restores pose'));
  assert.ok(boxes.length>0);assert.equal(travelAxis(shape),'z');
  shoulder.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),THREE.MathUtils.degToRad(POSES[shape].angle));
  elbow.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,-1),THREE.MathUtils.degToRad(POSES[shape].elbow));
  model.updateMatrixWorld(true);
  assert.equal(robotTouchesWall(robot,boxes,base.z-1.5,base.z+.8),false,`${POSES[shape].name} clears`);
  shoulder.quaternion.identity();model.updateMatrixWorld(true);
  assert.equal(robotTouchesWall(robot,boxes,base.z-1.5,base.z+.8),true,`${POSES[shape].name} needs axis 2`);
  shoulder.quaternion.identity();elbow.quaternion.identity();model.updateMatrixWorld(true);
 }
});






