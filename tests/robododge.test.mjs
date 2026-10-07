import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DodgeRun,COURSE,GATE_SECONDS,POSES,waveSeconds} from '../src/robododge-rules.ts';
import {obstacleBoxes,waveBoxes,travelAxis,robotTouchesWall} from '../src/robododge-collision.ts';
import {refineGripper} from '../src/gripper.ts';
test('six waves repeat the first opening before the slower rotated wall',()=>{
 const r=new DodgeRun();r.start();
 assert.deepEqual([...COURSE],[0,1,2,0,3,4]);
 assert.deepEqual(COURSE.map((_,i)=>waveSeconds(i)),[5,5,5,5,10,5]);
 for(let i=0;i<COURSE.length;i++){
  assert.equal(r.remaining,waveSeconds(i));
  assert.equal(r.tick(waveSeconds(i)-.1,false),null);
  assert.equal(r.tick(.1,false),'clear');
 }
 assert.equal(r.phase,'won');assert.equal(r.cleared,6);assert.equal(r.tick(50,false),null);assert.equal(r.gate,5);
});
test('first collision fails immediately and retry resets the run',()=>{const r=new DodgeRun();r.start();assert.equal(r.tick(.016,true),'hit');assert.equal(r.phase,'lost');assert.equal(r.cleared,0);assert.equal(r.tick(50,false),null);r.start();assert.equal(r.phase,'running');assert.equal(r.gate,0);});
test('pause freezes motion',()=>{const r=new DodgeRun();r.start();r.pause();r.tick(100,true);assert.equal(r.remaining,GATE_SECONDS);assert.equal(r.phase,'paused');});
test('actual robot clears each stepped opening; mismatched extended arms touch solid blocks only at depth overlap',async()=>{
 const file=await readFile(new URL('../public/robot.glb',import.meta.url));
 const model=(await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
 refineGripper(model);model.updateMatrixWorld(true);
 const robot=model.getObjectByName('J1_Pivot'),base=robot.getWorldPosition(new THREE.Vector3());
 const elbow=model.getObjectByName('J3_Pivot');
 for(let shape=0;shape<POSES.length;shape++){
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






