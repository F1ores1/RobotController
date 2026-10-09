import * as THREE from 'three';

// One envelope for every wall; leave equal clearance to both track rails.
export const WALL_HALF_WIDTH=1.08;
export const WALL_BOTTOM=.12;
export const WALL_TOP=1.38;
export const RAIL_OFFSET=WALL_HALF_WIDTH+.14;
// Shared pedestal centre; each opening is centred on the arm's actual zero/90/180
// degree mesh envelope, with ~35 mm clearance. Only joint angles change between waves.
export function obstacleBoxes(shape:number,baseX:number){
 const stemLeft=-.15,stemRight=.13;
 const branchBottom=shape===2?.535:.60;
 const branchTop=shape===2?.755:.80;
 const top=shape===1?1.235:branchTop;
 const xs=[-WALL_HALF_WIDTH,-.63,stemLeft,stemRight,.53,WALL_HALF_WIDTH];
 const ys=[WALL_BOTTOM,branchBottom,branchTop,1.235,WALL_TOP].sort((a,b)=>a-b);
 const boxes:THREE.Box3[]=[];
 for(let x=0;x<xs.length-1;x++)for(let y=0;y<ys.length-1;y++){
  const cx=(xs[x]+xs[x+1])/2,cy=(ys[y]+ys[y+1])/2;
  const stem=cx>stemLeft&&cx<stemRight&&cy<top;
  const branch=shape===0?cx>-.63&&cx<stemRight&&cy>branchBottom&&cy<branchTop:shape===2?cx>stemLeft&&cx<.53&&cy>branchBottom&&cy<branchTop:false;
  if(!stem&&!branch)boxes.push(new THREE.Box3(new THREE.Vector3(baseX+xs[x],ys[y],-.09),new THREE.Vector3(baseX+xs[x+1],ys[y+1],.09)));
 }
 return boxes;
}
// The final walls turn 90 degrees into the YZ plane and travel along world X.
// Their L-shaped openings follow the +90/-90 base poses, not their end-on projection.
export function waveBoxes(shape:number,base:THREE.Vector3){
 if(shape>=5)return shoulderOpening(shape,base);
 if(shape<3)return obstacleBoxes(shape,base.x);
 const transform=new THREE.Matrix4().makeRotationY(shape===3?Math.PI/2:-Math.PI/2);
 transform.setPosition(0,0,base.z);
 return obstacleBoxes(0,0).map(box=>box.applyMatrix4(transform));
}
export function travelAxis(shape:number):'x'|'z'{return shape===3||shape===4?'x':'z';}
// Deliberately simple orthogonal openings, matching the original block patterns.
// Each is a union of a few broad rectangular bars, never a sampled mesh outline.
export function shoulderOpening(shape:number,base:THREE.Vector3){
 const openings:Record<number,number[][]>={
  5:[[-.15,.13,.12,.44],[-.51,.13,.19,.44],[-.51,-.29,-.27,.44]],
  6:[[-.16,.13,.12,.44],[-.16,.45,.16,.44],[.18,.45,.16,.87]],
  7:[[-.16,.13,.12,.50],[-.96,.13,.25,.50]],
 };
 const holes=openings[shape];
 if(!holes)throw new Error('Unknown shoulder opening.');
 const xs=[...new Set([-WALL_HALF_WIDTH,WALL_HALF_WIDTH,...holes.flatMap(h=>[h[0],h[1]])])].sort((a,b)=>a-b);
 // Clip the downward wrist opening at the shared wall bottom. The pedestal
 // opening begins at that same edge, so no solid strip closes it underneath.
 const ys=[...new Set([WALL_BOTTOM,WALL_TOP,...holes.flatMap(h=>[h[2],h[3]]).filter(y=>y>WALL_BOTTOM&&y<WALL_TOP)])].sort((a,b)=>a-b);
 const boxes:THREE.Box3[]=[];
 for(let y=0;y<ys.length-1;y++){
  let start=-1;
  for(let x=0;x<xs.length;x++){
   const cx=(xs[x]+xs[x+1])/2,cy=(ys[y]+ys[y+1])/2;
   const solid=x<xs.length-1&&!holes.some(([left,right,bottom,top])=>cx>left&&cx<right&&cy>bottom&&cy<top);
   if(solid&&start<0)start=x;
   if(!solid&&start>=0){
    boxes.push(new THREE.Box3(new THREE.Vector3(base.x+xs[start],ys[y],-.09),new THREE.Vector3(base.x+xs[x],ys[y+1],.09)));
    start=-1;
   }
  }
 }
 return boxes;
}
// Broad-phase bounds, then actual transformed mesh triangles against solid boxes.
// Sweeping the wall's depth between frames also catches contact at low frame rates.
export function robotTouchesWall(robot:THREE.Object3D,boxes:THREE.Box3[],fromZ:number,toZ:number,axis:'x'|'z'='z'){
 robot.updateWorldMatrix(true,true);
 const solids=boxes.map(box=>{const swept=box.clone();swept.min[axis]+=Math.min(fromZ,toZ);swept.max[axis]+=Math.max(fromZ,toZ);return swept;});
 const bounds=new THREE.Box3(),triangle=new THREE.Triangle();let hit=false;
 robot.traverse(object=>{
  if(hit||!(object instanceof THREE.Mesh)||!object.visible)return;
  const geometry=object.geometry;if(!geometry.boundingBox)geometry.computeBoundingBox();
  bounds.copy(geometry.boundingBox!).applyMatrix4(object.matrixWorld);
  const near=solids.filter(box=>box.intersectsBox(bounds));if(!near.length)return;
  const positions=geometry.getAttribute('position'),index=geometry.index;
  const count=index?index.count:positions.count;
  for(let i=0;i<count;i+=3){
   triangle.a.fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(object.matrixWorld);
   triangle.b.fromBufferAttribute(positions,index?index.getX(i+1):i+1).applyMatrix4(object.matrixWorld);
   triangle.c.fromBufferAttribute(positions,index?index.getX(i+2):i+2).applyMatrix4(object.matrixWorld);
   if(near.some(box=>box.intersectsTriangle(triangle))){hit=true;break;}
  }
 });return hit;
}


