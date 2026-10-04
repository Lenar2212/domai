
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

let scene,camera,renderer,controls,root,raycaster,pointer,selected,dragging=false;
let state={version:'v31',house:{width:10,depth:10,floors:1,height:2.8},
 rooms:[],openings:[],walls:{north:0,south:0,west:0,east:0}};

const $=id=>document.getElementById(id);
const say=t=>{if($('v31Status'))$('v31Status').textContent=t};
const snap=v=>{let g=Math.max(.05,Number($('v31Grid')?.value)||.25);return Math.round(v/g)*g};
const uid=p=>p+'_'+Date.now()+'_'+Math.floor(Math.random()*9999);

function mount(){return $('threeHouse')||document.querySelector('[id*="three"]')}
function init(){
 const m=mount();if(!m)return;
 const h=window.house||{};
 state.house={width:Number(h.width||10),depth:Number(h.depth||10),floors:Number(h.floors||1),height:2.8};
 if(!state.rooms.length)seed();
 scene=new THREE.Scene();scene.background=new THREE.Color(0xf3f6f8);
 camera=new THREE.PerspectiveCamera(45,1,.1,500);camera.position.set(16,12,18);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setSize(Math.max(320,m.clientWidth||700),520);m.innerHTML='';m.appendChild(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,2,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2));
 let l=new THREE.DirectionalLight(0xffffff,2);l.position.set(10,18,8);scene.add(l);
 scene.add(new THREE.GridHelper(40,80,0x999999,0xdddddd));
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',pick);
 renderer.domElement.addEventListener('pointerup',()=>{dragging=false;controls.enabled=true});
 renderer.domElement.addEventListener('pointermove',drag);
 window.addEventListener('resize',resize);rebuild();loop();
}
function seed(){
 state.rooms=[
  {id:uid('r'),name:'Гостиная',width:4,depth:4,x:-2,z:-1,floor:1},
  {id:uid('r'),name:'Кухня',width:3,depth:4,x:1.5,z:-1,floor:1},
  {id:uid('r'),name:'Спальня',width:3.5,depth:3.2,x:-1.8,z:2.8,floor:1},
  {id:uid('r'),name:'Санузел',width:2,depth:2.2,x:1.8,z:2.5,floor:1}
 ];
 state.openings=[
  {id:uid('d'),type:'door',name:'Вход',width:.9,wall:'south',t:.15,floor:1},
  {id:uid('w'),type:'window',name:'Окно гостиной',width:1.4,wall:'north',t:-.15,floor:1}
 ];
}
function cube(name,w,h,d,x,y,z,c,u={}){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,transparent:c===0x6fa8dc,opacity:c===0x6fa8dc?.7:1}));o.name=name;o.position.set(x,y,z);o.userData=u;return o}
function wallMesh(side,offset,f){
 const h=state.house,hh=h.height,y=f*hh+hh/2,t=.22;
 if(side==='north')return cube('Стена север',h.width+2*offset,t*0+hh,t,0,y,-h.depth/2+offset,0xb0b0b0,{kind:'wall',side,floor:f+1});
 if(side==='south')return cube('Стена юг',h.width,hh,t,0,y,h.depth/2+offset,0xb0b0b0,{kind:'wall',side,floor:f+1});
 if(side==='west')return cube('Стена запад',t,hh,h.depth,-h.width/2+offset,y,0,0xb0b0b0,{kind:'wall',side,floor:f+1});
 return cube('Стена восток',t,hh,h.depth,h.width/2+offset,y,0,0xb0b0b0,{kind:'wall',side,floor:f+1});
}
function rebuild(){
 if(root)scene.remove(root);root=new THREE.Group();
 let h=state.house,t=.22;
 for(let f=0;f<h.floors;f++){
  ['north','south','west','east'].forEach(s=>root.add(wallMesh(s,state.walls[s],f)));
  root.add(cube('Плита',h.width,.12,h.depth,0,f*h.height-.06,0,0xaaaaaa,{kind:'slab'}));
 }
 state.rooms.forEach(r=>{
  let y=(r.floor-1)*h.height+.08;
  root.add(cube(r.name,r.width,.16,r.depth,r.x,y,r.z,0xdde8ef,{kind:'room',id:r.id}));
 });
 state.openings.forEach(o=>root.add(openingMesh(o)));
 scene.add(root);
 say(`v31: стены ${Object.values(state.walls).map(x=>x.toFixed(2)).join(' / ')} м`);
}
function openingMesh(o){
 let h=state.house,y=(o.floor-1)*h.height+(o.type==='door'?1:.55),p=o.t||0;
 let x=0,z=0;
 if(o.wall==='north'){x=o.offset||0;z=-h.depth/2-p}
 if(o.wall==='south'){x=o.offset||0;z=h.depth/2+p}
 if(o.wall==='west'){x=-h.width/2-p;z=o.offset||0}
 if(o.wall==='east'){x=h.width/2+p;z=o.offset||0}
 let vertical=o.wall==='east'||o.wall==='west';
 return cube(o.name,o.type==='door'?.9:1.4,o.type==='door'?2:.9,vertical?.12:.12,x,y,z,o.type==='door'?0x9b6b43:0x6fa8dc,{kind:o.type,id:o.id,wall:o.wall});
}
function pick(e){
 let r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;
 raycaster.setFromCamera(pointer,camera);let hit=raycaster.intersectObjects(root.children)[0];if(!hit)return;
 selected=hit.object;
 if(['wall','room','door','window'].includes(selected.userData.kind)){dragging=true;controls.enabled=false}
}
function drag(e){
 if(!dragging||!selected)return;
 let r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;
 raycaster.setFromCamera(pointer,camera);
 let plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),p=new THREE.Vector3();
 if(!raycaster.ray.intersectPlane(plane,p))return;
 let k=selected.userData.kind;
 if(k==='wall'){
  let s=selected.userData.side;
  state.walls[s]=snap((s==='north'||s==='south')?p.z-(s==='north'?-state.house.depth/2:state.house.depth/2):p.x-(s==='west'?-state.house.width/2:state.house.width/2));
  state.walls[s]=Math.max(-2,Math.min(2,state.walls[s]));
  applyWallGeometryLive(s);adjustRoomsForWall(s);adjustOpeningsForWall(s);
  say(`Стена ${s}: ${state.walls[s].toFixed(2)} м`);
 }else if(k==='room'){
  let room=state.rooms.find(x=>x.id===selected.userData.id);if(room){room.x=snap(p.x);room.z=snap(p.z);clampRoom(room);selected.position.x=room.x;selected.position.z=room.z}
 }
}
function applyWallGeometryLive(s){
 root.children.filter(x=>x.userData?.kind==='wall'&&x.userData.side===s).forEach(o=>{
  if(s==='north')o.position.z=-state.house.depth/2+state.walls[s];
  if(s==='south')o.position.z=state.house.depth/2+state.walls[s];
  if(s==='west')o.position.x=-state.house.width/2+state.walls[s];
  if(s==='east')o.position.x=state.house.width/2+state.walls[s];
 });
}
function adjustRoomsForWall(s){
 const h=state.house,o=state.walls[s];
 // Keep rooms inside the moved shell. If a wall moves inward, rooms are resized only when their edge crosses it.
 state.rooms.forEach(r=>{
  if(s==='west'){let edge=-h.width/2+o+.1;if(r.x-r.width/2<edge){r.width=Math.max(1,r.x+ r.width/2-edge)}}
  if(s==='east'){let edge=h.width/2+o-.1;if(r.x+r.width/2>edge){r.width=Math.max(1,edge-r.x+r.width/2)}}
  if(s==='north'){let edge=-h.depth/2+o+.1;if(r.z-r.depth/2<edge){r.depth=Math.max(1,r.z+r.depth/2-edge)}}
  if(s==='south'){let edge=h.depth/2+o-.1;if(r.z+r.depth/2>edge){r.depth=Math.max(1,edge-r.z+r.depth/2)}}
 });
}
function clampRoom(r){
 let h=state.house;
 r.x=Math.max(-h.width/2+r.width/2+.1+Math.min(0,state.walls.west),Math.min(h.width/2-r.width/2-.1+Math.max(0,state.walls.east),r.x));
 r.z=Math.max(-h.depth/2+r.depth/2+.1+Math.min(0,state.walls.north),Math.min(h.depth/2-r.depth/2-.1+Math.max(0,state.walls.south),r.z));
}
function adjustOpeningsForWall(s){
 state.openings.filter(o=>o.wall===s).forEach(o=>{
  const limit=(s==='north'||s==='south')?state.house.width/2:state.house.depth/2;
  o.offset=Math.max(-limit+o.width/2+.2,Math.min(limit-o.width/2-.2,o.offset||0));
 });
}
window.domai31MoveWall=d=>{
 let s=$('v31Wall').value;state.walls[s]=snap(state.walls[s]+d);rebuild();say(`Стена ${s}: ${state.walls[s].toFixed(2)} м`);
}
window.domai31ApplyWall=()=>{let s=$('v31Wall').value;state.walls[s]=snap(Number($('v31Offset').value)||0);adjustRoomsForWall(s);adjustOpeningsForWall(s);rebuild();say('Стена применена, соседние элементы скорректированы.')}
window.domai31AttachOpenings=()=>{
 state.openings.forEach(o=>{if(!o.wall)o.wall='south';adjustOpeningsForWall(o.wall)});
 rebuild();say('Двери и окна привязаны к стенам.');
}
window.domai31Sync=()=>{
 window.dispatchEvent(new CustomEvent('domai:v31:sync',{detail:{house:state.house,rooms:state.rooms,openings:state.openings,walls:state.walls}}));
 localStorage.setItem('domai_v31_state',JSON.stringify(state));say('Состояние 2D/3D синхронизировано локально.');
}
window.domai31Save=async()=>{
 const payload={version:'v31',...state,disclaimer:'Концептуальная модель; не рабочая проектная документация.'};
 try{let r=await fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'DomAI v31 Wall Plan',data:payload})});if(!r.ok)throw Error();say('v31 сохранён на сервере.')}
 catch(e){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='domai_v31_project.json';a.click();say('Сервер недоступен — сохранён JSON.')}
}
function resize(){let m=mount();if(!m)return;let w=Math.max(320,m.clientWidth||700);camera.aspect=w/520;camera.updateProjectionMatrix();renderer.setSize(w,520)}
function loop(){requestAnimationFrame(loop);controls?.update();renderer?.render(scene,camera)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));else setTimeout(init,500);
