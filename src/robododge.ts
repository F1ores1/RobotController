import * as THREE from 'three';
import type { createRenderer } from './renderer';
import { RobotState } from './state';
import { COURSE, POSES, waveSeconds, DodgeRun } from './robododge-rules';
import { waveBoxes, travelAxis, robotTouchesWall } from './robododge-collision';
type View = Awaited<ReturnType<typeof createRenderer>>;

export function createRoboLimbo(state:RobotState,view:View){
 const viewport=document.querySelector<HTMLElement>('.viewport')!;
 const toggle=document.querySelector<HTMLButtonElement>('#robododge-toggle')!;
 const root=document.querySelector<HTMLElement>('.controller')!;
 const hud=document.createElement('section');hud.className='dodge-ui';hud.hidden=true;hud.setAttribute('aria-label','RoboLimbo obstacle course');
 hud.innerHTML=`<div class="dodge-result" hidden role="status" aria-live="polite"><strong></strong><p></p><button type="button">Play again</button></div>`;
 viewport.append(hud);
 const resultPanel=hud.querySelector<HTMLElement>('.dodge-result')!;
 const run=new DodgeRun();let active=false;let savedPose=state.values;
 const robot=view.model.getObjectByName('J1_Pivot')!;
 const base=robot.getWorldPosition(new THREE.Vector3());
 const course=new THREE.Group();course.visible=false;view.scene.add(course);
 let matcap:THREE.Texture|null=null;
 view.model.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshMatcapMaterial)matcap=o.material.matcap;});
 const colors=[0x388fa7,0xd49a43,0x8076bd,0x458ca0,0xb08058];
 const walls=POSES.map((_,shape)=>{
  const group=new THREE.Group();const boxes=waveBoxes(shape,base);
  const material=new THREE.MeshMatcapMaterial({matcap,color:colors[shape]});
  boxes.forEach(box=>{
   const size=box.getSize(new THREE.Vector3());
   const geometry=new THREE.BoxGeometry(size.x,size.y,size.z);
   const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(box.getCenter(new THREE.Vector3()));mesh.castShadow=true;
   const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0x233944,transparent:true,opacity:.25}));mesh.add(edge);group.add(mesh);
  });course.add(group);return {group,boxes,material,axis:travelAxis(shape)};
 });
 const rails= [new THREE.Group(),new THREE.Group()];rails.forEach(group=>course.add(group));
 for(const offset of [-.94,.94]){
  const material=new THREE.MeshBasicMaterial({color:0xabbcc8});
  const alongZ=new THREE.Mesh(new THREE.BoxGeometry(.016,.016,2.6),material);alongZ.position.set(base.x+offset,.105,base.z-.35);rails[0].add(alongZ);
  const alongX=new THREE.Mesh(new THREE.BoxGeometry(2.6,.016,.016),material);alongX.position.set(base.x-.35,.105,base.z+offset);rails[1].add(alongX);
 }
 const wallPosition=(remaining:number,axis:'x'|'z')=>base[axis]-1.5+2.3*(1-remaining/waveSeconds(run.gate));
 function positionWall(){
  const current=COURSE[run.gate];
  rails[0].visible=current<3;rails[1].visible=current>=3;
  walls.forEach((wall,i)=>{wall.group.visible=i===current&&run.phase!=='won';wall.group.position[wall.axis]=wallPosition(run.remaining,wall.axis);});
 }
 function start(){
  run.start();resultPanel.hidden=true;
  state.setJoints({0:0,1:0,2:0,3:0,4:0,5:0});
  walls.forEach((wall,i)=>wall.material.color.set(colors[i]));positionWall();
 }
 resultPanel.querySelector('button')!.addEventListener('click',start);
 document.addEventListener('visibilitychange',()=>{
  if(!active)return;
  if(document.hidden&&run.phase==='running')run.pause();
  else if(!document.hidden&&run.phase==='paused')run.pause();
 });
 toggle.disabled=false;
 toggle.addEventListener('click',()=>{
  active=!active;toggle.setAttribute('aria-pressed',String(active));toggle.textContent=active?'Exit RoboLimbo':'RoboLimbo';hud.hidden=!active;course.visible=active;root.classList.toggle('is-dodging',active);
  if(active){savedPose=state.values;view.setSideView(true);start();}
  else{view.setSideView(false);state.setJoints(Object.fromEntries(savedPose.map((v,i)=>[i,v])));}
 });
 view.onFrame(dt=>{
  if(!active||run.phase!=='running')return;
  const wall=walls[COURSE[run.gate]],from=wallPosition(run.remaining,wall.axis),to=wallPosition(Math.max(0,run.remaining-dt),wall.axis);
  const contact=robotTouchesWall(robot,wall.boxes,from,to,wall.axis);
  const result=run.tick(dt,contact);
  if(result==='hit'){
   wall.group.position[wall.axis]=to;wall.material.color.set(0xc44949);
   resultPanel.querySelector('strong')!.textContent='Collision';
   resultPanel.querySelector('p')!.textContent='The robot touched the wall. Try again.';
   resultPanel.hidden=false;
  }else{
   positionWall();
   if(String(run.phase)==='won'){
    resultPanel.querySelector('strong')!.textContent='Congratulations!';
    resultPanel.querySelector('p')!.textContent=`You cleared all ${COURSE.length} waves.`;
    resultPanel.hidden=false;
   }
  }
 });
}



