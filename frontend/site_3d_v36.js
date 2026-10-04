
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

let scene,camera,renderer,controls,root,raycaster,pointer;
const $=id=>document.getElementById(id);
let data={plot:{w:20,d:30},objects:[]};
const say=t=>{if($('v36Status'))$('v36Status').textContent=t};

function readV35(){
 const saved=localStorage.getItem('domai_v35_state');
 if(saved){try{const x=JSON.parse(saved);if(x.plot)data.plot=x.plot;if(x.objects)data.objects=x.objects;return;}catch(e){}}
 // fallback from current v35 controls
 data.plot={w:Number($('v35PlotW')?.value||20),d:Number($('v35PlotD')?.value||30)};
 data.objects=[];
 const add=(type,name,w,d,x,z)=>data.objects.push({type,name,w,d,x,z});
 const hw=Number($('v35HouseW')?.value||10),hd=Number($('v35HouseD')?.value||12);
 add('house','Дом',hw,hd,0,-data.plot.d/2+hd/2+3);
}
function mat(c){return new THREE.MeshStandardMaterial({color:c,roughness:.8})}
function box(name,w,h,d,x,y,z,c,meta={}){
 const o=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,w),Math.max(.05,h),Math.max(.05,d)),mat(c));
 o.name=name;o.position.set(x,y,z);o.userData=meta;o.castShadow=true;o.receiveShadow=true;return o;
}
function init(){
 const m=$('domai36Mount');if(!m)return;
 readV35();
 scene=new THREE.Scene();scene.background=new THREE.Color(0xbfd8ee);
 camera=new THREE.PerspectiveCamera(45,1,.1,1000);camera.position.set(24,22,28);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.shadowMap.enabled=true;renderer.setSize(m.clientWidth||800,600);m.innerHTML='';m.appendChild(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,0,0);controls.maxPolarAngle=Math.PI*.48;
 scene.add(new THREE.HemisphereLight(0xffffff,0x607050,2));
 const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(20,35,15);sun.castShadow=true;scene.add(sun);
 scene.add(new THREE.GridHelper(Math.max(data.plot.w,data.plot.d)*2,40,0x778877,0xaabbaa));
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',pick);
 window.addEventListener('resize',resize);
 build();loop();
}
function build(){
 if(root)scene.remove(root);root=new THREE.Group();
 const p=data.plot;
 root.add(box('Участок',p.w,.05,p.d,0,-.04,0,0x86ad70,{type:'plot'}));
 // fence
 const f=.08,h=1.2;
 root.add(box('Ограждение север',p.w,h,f,0,h/2,-p.d/2,0x777777));
 root.add(box('Ограждение юг',p.w,h,f,0,h/2,p.d/2,0x777777));
 root.add(box('Ограждение запад',f,h,p.d,-p.w/2,h/2,0,0x777777));
 root.add(box('Ограждение восток',f,h,p.d,p.w/2,h/2,0,0x777777));
 data.objects.forEach(o=>{
  let color=0xcab89a,height=0.25,y=.13;
  if(o.type==='house'){color=0xd7b28b;height=2.8;y=height/2;addHouse(root,o)}
  else if(o.type==='garage'){color=0x999999;height=2.5;y=height/2;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}))}
  else if(o.type==='bathhouse'){color=0xb8794f;height=2.7;y=height/2;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}));addRoof(root,o,0xb04d3a)}
  else if(o.type==='garden'){color=0x65a45e;height=.25;y=.13;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}));trees(root,o)}
  else if(o.type==='parking'){color=0x777777;height=.05;y=.03;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}))}
  else if(o.type==='terrace'){color=0xb99563;height=.18;y=.09;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}))}
  else if(o.type==='bbq'){color=0xc56f48;height=.35;y=.18;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}));}
  else if(o.type==='path'){color=0xcbbf9c;height=.04;y=.02;root.add(box(o.name,o.w,height,o.d,o.x,y,o.z,color,{type:o.type,name:o.name}))}
 });
 scene.add(root);
 say(`3D-генплан: участок ${p.w} × ${p.d} м, объектов ${data.objects.length}.`);
}
function addHouse(g,o){
 g.add(box(o.name,o.w,2.8,o.d,o.x,1.4,o.z,0xd8b28d,{type:'house',name:o.name}));
 // roof
 g.add(box('Крыша',o.w+.5,.25,o.d+.5,o.x,2.9,o.z,0x9b5947,{type:'roof'}));
 // windows
 for(let i=-1;i<=1;i++){
   if(o.w>6)g.add(box('Окно',1.3,.9,.08,o.x+i*2,1.7,o.z-o.d/2-.04,0x78a9c4,{type:'window'}));
 }
 g.add(box('Вход',1,2,.12,o.x,1,o.z+o.d/2+.04,0x76513b,{type:'door'}));
}
function addRoof(g,o,c){
 g.add(box('Крыша '+o.name,o.w+.4,.25,o.d+.4,o.x,2.85,o.z,c,{type:'roof'}));
}
function trees(g,o){
 const n=Math.max(3,Math.floor(o.w*o.d/12));
 for(let i=0;i<n;i++){
  const x=o.x-o.w/2+.5+(i*1.73)%Math.max(.6,o.w-1);
  const z=o.z-o.d/2+.5+(i*2.11)%Math.max(.6,o.d-1);
  const trunk=box('Ствол',.12,1,.12,x,.5,z,0x76513b,{type:'tree'});
  const crown=new THREE.Mesh(new THREE.SphereGeometry(.65,12,10),mat(0x4e8d4d));
  crown.position.set(x,1.3,z);crown.userData={type:'tree'};crown.castShadow=true;g.add(trunk,crown);
 }
}
function pick(e){
 const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;
 raycaster.setFromCamera(pointer,camera);const h=raycaster.intersectObjects(root.children,true)[0];
 if(h){const n=h.object.userData?.name||h.object.name;say(`Выбрано: ${n}`)}
}
window.domai36Build=()=>{readV35();build()};
window.domai36Top=()=>{camera.position.set(0,Math.max(data.plot.w,data.plot.d)*1.3,0.01);controls.target.set(0,0,0);controls.update()};
window.domai36Perspective=()=>{camera.position.set(data.plot.w*1.25,data.plot.d*.85,data.plot.d*1.25);controls.target.set(0,1,0);controls.update()};
window.domai36Reset=()=>{camera.position.set(24,22,28);controls.target.set(0,0,0);controls.update()};
function resize(){const m=$('domai36Mount');if(!m)return;camera.aspect=(m.clientWidth||800)/600;camera.updateProjectionMatrix();renderer.setSize(m.clientWidth||800,600)}
function loop(){requestAnimationFrame(loop);controls?.update();renderer?.render(scene,camera)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));else setTimeout(init,500);
