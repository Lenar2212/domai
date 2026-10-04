
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

let scene,camera,renderer,controls,raycaster,pointer,dragPlane;
let root=null, selected=null, dragging=false, dragOffset=new THREE.Vector3();
let state={version:'v30',house:{width:10,depth:10,floors:1,height:2.8},rooms:[],openings:[]};

const $=id=>document.getElementById(id);
const msg=t=>{if($('v30Status'))$('v30Status').textContent=t};
const uid=p=>p+'_'+Date.now()+'_'+Math.floor(Math.random()*9999);
const snap=v=>{const g=Math.max(.05,Number($('v30Grid')?.value)||.25);return Math.round(v/g)*g};

function mount(){return $('threeHouse')||document.querySelector('[id*="three"]')}
function init(){
 const m=mount(); if(!m)return;
 const h=window.house||{};
 state.house={width:Number(h.width||10),depth:Number(h.depth||10),floors:Number(h.floors||1),height:2.8};
 if(!state.rooms.length) seedRooms();
 scene=new THREE.Scene(); scene.background=new THREE.Color(0xf3f6f8);
 camera=new THREE.PerspectiveCamera(45,1,.1,500); camera.position.set(15,11,17);
 renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setSize(Math.max(320,m.clientWidth||700),520); renderer.shadowMap.enabled=true;
 m.innerHTML='';m.appendChild(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,2,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2));
 const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(10,18,8);sun.castShadow=true;scene.add(sun);
 scene.add(new THREE.GridHelper(40,80,0x999999,0xdddddd));
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 renderer.domElement.addEventListener('pointerdown',pick);
 renderer.domElement.addEventListener('pointermove',move);
 renderer.domElement.addEventListener('pointerup',drop);
 window.addEventListener('resize',resize);
 rebuild(); loop();
}
function seedRooms(){
 const w=state.house.width,d=state.house.depth;
 state.rooms=[
  {id:uid('room'),name:'Гостиная',width:4,depth:4,x:-2,z:-1,floor:1},
  {id:uid('room'),name:'Кухня',width:3,depth:3.2,x:2,z:-1,floor:1},
  {id:uid('room'),name:'Спальня',width:3.2,depth:3.2,x:-2,z:2.8,floor:1}
 ];
}
function mesh(name,w,h,d,x,y,z,color,meta){
 const o=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,w),Math.max(.05,h),Math.max(.05,d)),
   new THREE.MeshStandardMaterial({color,transparent:color===0x6fa8dc,opacity:color===0x6fa8dc?.72:1}));
 o.name=name;o.position.set(x,y,z);o.userData=meta||{};o.castShadow=true;o.receiveShadow=true;return o;
}
function rebuild(){
 if(root)scene.remove(root);root=new THREE.Group();
 const h=state.house,t=.22;
 for(let f=0;f<h.floors;f++){
  const y=f*h.height+h.height/2;
  root.add(mesh('Северная стена',h.width,h.height,t,0,y,-h.depth/2,0xb0b0b0,{kind:'wall',side:'north'}));
  root.add(mesh('Южная стена',h.width,h.height,t,0,y,h.depth/2,0xb0b0b0,{kind:'wall',side:'south'}));
  root.add(mesh('Западная стена',t,h.height,h.depth,-h.width/2,y,0,0xb0b0b0,{kind:'wall',side:'west'}));
  root.add(mesh('Восточная стена',t,h.height,h.depth,h.width/2,y,0,0xb0b0b0,{kind:'wall',side:'east'}));
  root.add(mesh('Плита '+(f+1),h.width,.12,h.depth,0,f*h.height-.06,0,0xaaaaaa,{kind:'slab',floor:f+1}));
 }
 state.rooms.forEach(r=>{
  const y=(r.floor-1)*h.height+.08;
  root.add(mesh(r.name,r.width,.16,r.depth,r.x,y,r.z,0xdde8ef,{kind:'room',id:r.id}));
 });
 state.openings.forEach(o=>{
  const y=(o.floor-1)*h.height+(o.type==='door'?1.0:1.8);
  root.add(mesh(o.name,o.width,o.type==='door'?2:.9,.12,o.x,y,o.z,o.type==='door'?0x9b6b43:0x6fa8dc,{kind:o.type,id:o.id}));
 });
 scene.add(root);msg(`v30: ${state.rooms.length} комнат, ${state.openings.length} проёмов.`);
}
function pick(e){
 const r=renderer.domElement.getBoundingClientRect();
 pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;
 raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects(root.children,true)[0];
 if(!hit)return;
 const o=hit.object;
 if(!['room','door','window'].includes(o.userData.kind))return;
 select(o);dragging=true;controls.enabled=false;
 const p=new THREE.Vector3();raycaster.ray.intersectPlane(dragPlane,p);dragOffset.copy(o.position).sub(p);
}
function move(e){
 if(!dragging||!selected)return;
 const r=renderer.domElement.getBoundingClientRect();
 pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;
 raycaster.setFromCamera(pointer,camera);
 const p=new THREE.Vector3();if(!raycaster.ray.intersectPlane(dragPlane,p))return;
 selected.position.x=snap(p.x+dragOffset.x);selected.position.z=snap(p.z+dragOffset.z);
 updateDataFromSelected();updateInputs();msg(`Перемещение: X=${selected.position.x.toFixed(2)}, Z=${selected.position.z.toFixed(2)}`);
}
function drop(){if(dragging){dragging=false;controls.enabled=true;clampSelected();rebuild();selectById(selected?.userData?.id)}}
function select(o){
 if(selected?.material)selected.material.emissive?.setHex(0);
 selected=o;if(selected.material.emissive)selected.material.emissive.setHex(0x333333);
 updateInputs();msg('Выбрано: '+o.name);
}
function selectById(id){
 if(!id)return;const o=root.children.find(x=>x.userData?.id===id);if(o)select(o);
}
function data(){return state.rooms.find(x=>x.id===selected?.userData?.id)||state.openings.find(x=>x.id===selected?.userData?.id)}
function updateDataFromSelected(){
 const d=data();if(d){d.x=selected.position.x;d.z=selected.position.z;}
}
function updateInputs(){
 if(!selected)return;const d=data();if(!d)return;
 $('v30X').value=d.x.toFixed(2);$('v30Z').value=d.z.toFixed(2);
 $('v30W').value=(d.width||selected.geometry.parameters.width||1).toFixed(2);
 $('v30D').value=(d.depth||selected.geometry.parameters.depth||.1).toFixed(2);
}
function clampSelected(){
 const d=data();if(!d)return;
 const h=state.house;const hw=(d.width||1)/2,hd=(d.depth||.1)/2;
 d.x=Math.max(-h.width/2+hw+.1,Math.min(h.width/2-hw-.1,d.x));
 d.z=Math.max(-h.depth/2+hd+.1,Math.min(h.depth/2-hd-.1,d.z));
}
window.domai30Apply=()=>{
 if(!selected){msg('Выберите комнату, дверь или окно.');return}
 const d=data();if(!d)return;
 d.x=Number($('v30X').value)||0;d.z=Number($('v30Z').value)||0;
 d.width=Math.max(.5,Number($('v30W').value)||1);
 if(d.type==='door'||d.type==='window')d.depth=.1;else d.depth=Math.max(.5,Number($('v30D').value)||1);
 clampSelected();rebuild();selectById(d.id);
};
window.domai30Snap=()=>{
 if(!selected)return;const d=data();if(!d)return;
 d.x=snap(d.x);d.z=snap(d.z);rebuild();selectById(d.id);msg('Элемент привязан к сетке.');
};
window.domai30Center=()=>{
 if(!selected)return;const d=data();if(!d)return;
 d.x=0;d.z=0;rebuild();selectById(d.id);msg('Элемент центрирован.');
};
window.domai30Sync2D=()=>{
 // Export a neutral event for the existing 2D planner to consume.
 window.dispatchEvent(new CustomEvent('domai:v30:sync2d',{detail:{rooms:state.rooms,openings:state.openings}}));
 msg('Данные v30 переданы в 2D-план (если модуль v30 поддерживается).');
};
window.domai30Save=async()=>{
 const payload={version:'v30',house:state.house,rooms:state.rooms,openings:state.openings,
 disclaimer:'Концептуальная модель. Не является рабочей проектной документацией.'};
 try{
  const r=await fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'DomAI v30 Parametric 3D',data:payload})});
  if(!r.ok)throw Error();
  msg('Проект v30 сохранён на сервере.');
 }catch(e){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  a.download='domai_v30_project.json';a.click();msg('Сервер недоступен — сохранён JSON.');
 }
};
function resize(){const m=mount();if(!m)return;const w=Math.max(320,m.clientWidth||700);camera.aspect=w/520;camera.updateProjectionMatrix();renderer.setSize(w,520)}
function loop(){requestAnimationFrame(loop);controls?.update();renderer?.render(scene,camera)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));else setTimeout(init,500);
