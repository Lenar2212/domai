import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js";

let scene,camera,renderer,controls,group,level=0,topView=false;

function init(){
 const canvas=document.getElementById("domai3d"); if(!canvas)return;
 scene=new THREE.Scene();
 scene.background=new THREE.Color(0xf5f7fa);
 camera=new THREE.PerspectiveCamera(45,canvas.clientWidth/420,.1,1000);
 camera.position.set(14,12,16);
 renderer=new THREE.WebGLRenderer({canvas,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(canvas.clientWidth,420,false);
 controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2));
 const g=new THREE.GridHelper(30,30); scene.add(g);
 group=new THREE.Group(); scene.add(group);
 window.addEventListener("resize",()=>{renderer.setSize(canvas.clientWidth,420,false);camera.aspect=canvas.clientWidth/420;camera.updateProjectionMatrix()});
 (function loop(){requestAnimationFrame(loop);controls.update();renderer.render(scene,camera)})();
}
function box(x,y,z,w,h,d,mat){
 const m=new THREE.MeshStandardMaterial({color:mat});
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);group.add(o);return o;
}
function build(){
 if(!scene)init(); while(group.children.length)group.remove(group.children[0]);
 const house=window.commercialProject?.house||{w:10,h:10,floors:2};
 const W=Number(house.w||10),D=Number(house.h||10),F=Math.min(3,Math.max(1,Number(house.floors||1)));
 const floorH=3, wall=.22;
 for(let f=0;f<F;f++){
   if(f!==level)continue;
   const y=f*floorH+floorH/2;
   // four conceptual walls
   box(0,y,-D/2,W, floorH,wall,0xd7d7d7);
   box(0,y,D/2,W, floorH,wall,0xd7d7d7);
   box(-W/2,y,0,wall,floorH,D,0xd7d7d7);
   box(W/2,y,0,wall,floorH,D,0xd7d7d7);
   // floor slab
   box(0,f*floorH-.08,0,W,.16,D,0xb7c3cc);
   // interior partitions
   box(0,y,0,wall,floorH,D*.92,0xe3e3e3);
   box(0,y,0,W*.92,wall,.18,0xe3e3e3);
   // windows on front/back
   [-D/2-.13,D/2+.13].forEach(z=>{for(let x of [-W*.25,W*.25]) box(x,y,z,W*.18,floorH*.42,.08,0x87b7d8)});
   // entrance door
   box(-W*.15,1.05,-D/2-.15,W*.12,2.1,.10,0x8b5a3c);
 }
 // roof
 if(level===F-1) box(0,F*floorH+.2,0,W*1.05,.35,D*1.05,0x555555);
 document.getElementById("domai3dInfo").innerHTML=`Этаж ${level+1} из ${F} · ${W} × ${D} м · концептуальная модель`;
}
window.renderDomAI3D=build;
window.toggle3DFloor=()=>{
 const F=Math.min(3,Math.max(1,Number(window.commercialProject?.house?.floors||1)));
 level=(level+1)%F; build();
};
window.toggle3DView=()=>{
 topView=!topView;
 if(topView) camera.position.set(0,22,0.1); else camera.position.set(14,12,16);
 controls.target.set(0,1.5,0);controls.update();
};
window.addEventListener("load",()=>setTimeout(()=>{init();build()},150));
