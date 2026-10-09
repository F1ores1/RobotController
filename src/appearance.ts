import * as THREE from 'three';
import {shadowLight} from './appearance-common';
// A neutral lit-sphere texture; its shading stays relative to the camera.
// Byte pixels support linear filtering without optional float-texture extensions.
function makeMatcap(contrast:number){const size=256;const data=new Uint8Array(size*size*4);const key=new THREE.Vector3(-.55,.65,.7).normalize();const fill=new THREE.Vector3(.7,.15,.5).normalize();for(let y=0;y<size;y++){for(let x=0;x<size;x++){const nx=(x+.5)/size*2-1,ny=(y+.5)/size*2-1;const z=Math.sqrt(Math.max(0,1-nx*nx-ny*ny));const normal=new THREE.Vector3(nx,ny,z).normalize();const diffuse=Math.max(0,normal.dot(key));const rim=Math.pow(1-z,3);const shade=THREE.MathUtils.lerp(.72,.2+.8*diffuse+.12*Math.max(0,normal.dot(fill))+.12*rim,contrast);const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(THREE.MathUtils.clamp(shade,0,1)*255);data[i+3]=255;}}const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);texture.colorSpace=THREE.LinearSRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;}
export function setupAppearance(scene:THREE.Scene,model:THREE.Object3D,camera:THREE.Camera,renderer:THREE.WebGLRenderer,bounds:THREE.Box3){
 renderer.toneMapping=THREE.NoToneMapping;renderer.shadowMap.type=THREE.VSMShadowMap;scene.background=new THREE.Color(0xe9edf2);shadowLight(scene,bounds,1);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x52606b,opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=bounds.min.y-.002;floor.receiveShadow=true;scene.add(floor);
 const texture=makeMatcap(.8);const cache=new Map<THREE.Material,THREE.MeshMatcapMaterial>();model.traverse(o=>{if(o instanceof THREE.Mesh){const convert=(m:THREE.Material)=>{if(!cache.has(m)){const src=m as THREE.MeshStandardMaterial;cache.set(m,new THREE.MeshMatcapMaterial({color:src.color,matcap:texture,side:src.side}));}return cache.get(m)!;};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);}});
 return {render:()=>renderer.render(scene,camera),resize:(_w:number,_h:number)=>{}};
}

