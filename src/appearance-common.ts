import * as THREE from 'three';
export function addGround(scene:THREE.Scene,bounds:THREE.Box3){
 const center=bounds.getCenter(new THREE.Vector3());
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:0xe9edf2,toneMapped:false}));
 ground.rotation.x=-Math.PI/2;ground.position.set(center.x,bounds.min.y-.002,center.z);scene.add(ground);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x48515a,opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.copy(ground.position);shadow.position.y+=.0005;shadow.receiveShadow=true;scene.add(shadow);return ground;
}
export function shadowLight(scene:THREE.Scene,bounds:THREE.Box3,intensity:number){
 const center=bounds.getCenter(new THREE.Vector3());const light=new THREE.DirectionalLight(0xffffff,intensity);light.position.copy(center).add(new THREE.Vector3(-3,5,3));light.target.position.copy(center);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-1.4,right:1.4,top:1.4,bottom:-1.4,near:.1,far:15});light.shadow.normalBias=.002;light.shadow.bias=-.0001;light.shadow.radius=8;light.shadow.blurSamples=12;scene.add(light,light.target);return light;
}
