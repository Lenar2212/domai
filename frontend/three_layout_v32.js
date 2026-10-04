
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

let scene,camera,renderer,controls,root,raycaster,pointer,selectedId=null;
const S={version:'v32',house:{width:10,depth:10,floors:1,height:2.8},
 rooms:[],openings:[],walls:{north:0,south:0,west:0,east:0},partitions:[]};

const $=id=>document.getElementById(id);
const say=t=>{if($('domai32Status'))$('domai32Status').textContent=t};
const uid=p=>p+'_'+Date.now()+'_'+Math.floor(Math.random()*9999);
const snap=v=>Math.round(v/.25)*.25;

function mount(){return $('threeHouse')||document.querySelector('[id*="three"]')}
function seed(){
 S.rooms=[
  {id:uid('r'),name:'Гостиная',width:4,depth:4,x:-2,z:-1,floor:1},
  {id:uid('r'),name:'Кухня',width:3,depth:3.5,x:1.5,z:-1.2,floor:1},
  {id:uid('r'),name:'Спальня',width:3.3,depth:3.2,x:-1.8,z:2.7,floor:1},
  {id:uid('r'),name:'Санузел',width:2,depth:2.2,x:1.7,z:2.4,floor:1}
 ];
}
function init(){
 let m=mount();if(!m)return;
 let h=window.house||{};
 S.house={width:Number(h.width||10),depth:Number(h.depth||10),floors:Number(h.floors||1),height:2.8};
 if(!S.rooms.length)seed();
 scene=new THREE.Scene();scene.background=new THREE.Color(0xf3f6f8);
 camera=new THREE.PerspectiveCamera(45,1,.1,500);camera.position.set(15,11,17);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.setSize(Math.max(320,m.clientWidth||700),520);m.innerHTML='';m.appendChild(renderer.domElement);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,2,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2));
 let sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(10,18,8);scene.add(sun);
 scene.add(new THREE.GridHelper(40,80,0x999999,0xdddddd));
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',pick);
 window.addEventListener('resize',resize);
 rebuild();loop();
}
function box(name,w,h,d,x,y,z,c,u){
 let o=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.03,w),Math.max(.03,h),Math.max(.03,d)),
 new THREE.MeshStandardMaterial({color:c,transparent:c===0x6fa8dc,opacity:c===0x6fa8dc?.7:1}));
 o.name=name;o.position.set(x,y,z);o.userData=u||{};return o;
}
function rebuild(){
 if(root)scene.remove(root);root=new THREE.Group();let h=S.house,t=.22;
 for(let f=0;f<h.floors;f++){
  let y=f*h.height+h.height/2;
  root.add(box('Север',h.width,h.height,t,0,y,-h.depth/2+S.walls.north,0xb0b0b0,{kind:'wall'}));
  root.add(box('Юг',h.width,h.height,t,0,y,h.depth/2+S.walls.south,0xb0b0b0,{kind:'wall'}));
  root.add(box('Запад',t,h.height,h.depth,-h.width/2+S.walls.west,y,0,0xb0b0b0,{kind:'wall'}));
  root.add(box('Восток',t,h.height,h.depth,h.width/2+S.walls.east,y,0,0xb0b0b0,{kind:'wall'}));
  root.add(box('Плита',h.width,.12,h.depth,0,f*h.height-.06,0,0xaaaaaa,{kind:'slab'}));
 }
 S.rooms.forEach(r=>{
  let y=(r.floor-1)*h.height+.08;
  root.add(box(r.name,r.width,.16,r.depth,r.x,y,r.z,0xdde8ef,{kind:'room',id:r.id}));
 });
 // Explicit conceptual partitions around room boundaries
 S.rooms.forEach(r=>{
  let y=(r.floor-1)*h.height+h.height/2;
  root.add(box('Перегородка '+r.name,r.width,.12,.08,r.x,y,r.z-r.depth/2,0x888888,{kind:'partition',room:r.id}));
  root.add(box('Перегородка '+r.name,r.width,.12,.08,r.x,y,r.z+r.depth/2,0x888888,{kind:'partition',room:r.id}));
  root.add(box('Перегородка '+r.name,.08,.12,r.depth,r.x-r.width/2,y,r.z,0x888888,{kind:'partition',room:r.id}));
  root.add(box('Перегородка '+r.name,.08,.12,r.depth,r.x+r.width/2,y,r.z,0x888888,{kind:'partition',room:r.id}));
 });
 S.openings.forEach(o=>{
  let h=S.house,y=(o.floor-1)*h.height+(o.type==='door'?1:.55),x=o.x||0,z=o.z||0;
  if(o.wall==='north')z=-h.depth/2; if(o.wall==='south')z=h.depth/2;
  if(o.wall==='west')x=-h.width/2; if(o.wall==='east')x=h.width/2;
  root.add(box(o.name,o.width,o.type==='door'?2:.9,.12,x,y,z,o.type==='door'?0x9b6b43:0x6fa8dc,{kind:o.type,id:o.id}));
 });
 scene.add(root);fillSelect();recalc();
}
function fillSelect(){
 let s=$('v32Room');if(!s)return;s.innerHTML='';
 S.rooms.forEach(r=>{let o=document.createElement('option');o.value=r.id;o.textContent=r.name;s.appendChild(o)});
 if(selectedId)s.value=selectedId;loadSelected();
}
function selected(){return S.rooms.find(r=>r.id==$('v32Room')?.value)||S.rooms[0]}
function loadSelected(){
 let r=selected();if(!r)return;
 selectedId=r.id;$('v32Name').value=r.name;$('v32W').value=r.width;$('v32D').value=r.depth;$('v32X').value=r.x;$('v32Z').value=r.z;
}
$('v32Room')?.addEventListener('change',loadSelected);
function pick(e){
 let r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;
 raycaster.setFromCamera(pointer,camera);let hit=raycaster.intersectObjects(root.children)[0];if(!hit)return;
 if(hit.object.userData.kind==='room'){selectedId=hit.object.userData.id;let s=$('v32Room');if(s)s.value=selectedId;loadSelected();say('Выбрано: '+hit.object.name)}
}
window.domai32ApplyRoom=()=>{
 let r=selected();if(!r)return;
 r.name=$('v32Name').value||r.name;r.width=Math.max(1,Number($('v32W').value)||r.width);
 r.depth=Math.max(1,Number($('v32D').value)||r.depth);r.x=snap(Number($('v32X').value)||r.x);r.z=snap(Number($('v32Z').value)||r.z);
 clamp(r);rebuild();say('Комната изменена, перегородки пересчитаны.');
}
function clamp(r){
 r.x=Math.max(-S.house.width/2+r.width/2+.1,Math.min(S.house.width/2-r.width/2-.1,r.x));
 r.z=Math.max(-S.house.depth/2+r.depth/2+.1,Math.min(S.house.depth/2-r.depth/2-.1,r.z));
}
window.domai32AddRoom=()=>{
 let n=S.rooms.length+1;
 let r={id:uid('r'),name:'Комната '+n,width:3,depth:3,x:0,z:0,floor:1};
 r.x=-S.house.width/2+2+(n%3)*3;r.z=-S.house.depth/2+2+Math.floor(n/3)*3;clamp(r);S.rooms.push(r);selectedId=r.id;rebuild();say('Добавлена '+r.name);
}
window.domai32SplitRoom=()=>{
 let r=selected();if(!r)return;
 if(r.width>=r.depth){
  let w=r.width/2-.05;r.width=w;
  let nr={...r,id:uid('r'),name:r.name+' 2',width:w,depth:r.depth,x:r.x+w+.1,z:r.z};
  S.rooms.push(nr);selectedId=nr.id;
 }else{
  let d=r.depth/2-.05;r.depth=d;
  let nr={...r,id:uid('r'),name:r.name+' 2',width:r.width,depth:d,x:r.x,z:r.z+d+.1};
  S.rooms.push(nr);selectedId=nr.id;
 }
 rebuild();say('Комната разделена на два помещения.');
}
window.domai32DeleteRoom=()=>{
 let r=selected();if(!r)return;
 S.rooms=S.rooms.filter(x=>x.id!==r.id);S.openings=S.openings.filter(x=>x.roomId!==r.id);selectedId=null;rebuild();say('Комната удалена.');
}
window.domai32AutoDoors=()=>{
 S.openings=S.openings.filter(x=>x.type!=='door');
 S.rooms.forEach((r,i)=>{
  if(i===0)return;
  let left=r.x-r.width/2,houseLeft=-S.house.width/2;
  S.openings.push({id:uid('d'),type:'door',name:'Дверь '+r.name,width:.9,wall:Math.abs(left-houseLeft)<1?'west':'south',roomId:r.id,floor:r.floor});
 });
 rebuild();say('Концептуальные двери расставлены для помещений.');
}
window.domai32AutoWindows=()=>{
 S.openings=S.openings.filter(x=>x.type!=='window');
 S.rooms.forEach((r,i)=>{
  let wall=(Math.abs(r.z+ r.depth/2-S.house.depth/2)<1)?'south':'north';
  S.openings.push({id:uid('w'),type:'window',name:'Окно '+r.name,width:1.4,wall,roomId:r.id,floor:r.floor});
 });
 rebuild();say('Концептуальные окна расставлены по внешним сторонам.');
}
window.domai32Recalc=()=>{recalc();say('Площади пересчитаны.')}
function recalc(){
 let total=0;let parts=[];
 S.rooms.forEach(r=>{let a=r.width*r.depth;total+=a;parts.push(r.name+': '+a.toFixed(1)+' м²')});
 if($('domai32Areas'))$('domai32Areas').textContent='Площади: '+parts.join(' · ')+' | Итого: '+total.toFixed(1)+' м²';
}
window.domai32Save=async()=>{
 let payload={version:'v32',...S,areas:S.rooms.map(r=>({id:r.id,name:r.name,area:+(r.width*r.depth).toFixed(2)})),disclaimer:'Концептуальная модель; не является рабочей проектной документацией.'};
 try{let q=await fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'DomAI v32 Layout Editor',data:payload})});if(!q.ok)throw Error();say('v32 сохранён на сервере.')}
 catch(e){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='domai_v32_project.json';a.click();say('Сервер недоступен — сохранён JSON.')}
}
function resize(){let m=mount();if(!m)return;let w=Math.max(320,m.clientWidth||700);camera.aspect=w/520;camera.updateProjectionMatrix();renderer.setSize(w,520)}
function loop(){requestAnimationFrame(loop);controls?.update();renderer?.render(scene,camera)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500));else setTimeout(init,500);
