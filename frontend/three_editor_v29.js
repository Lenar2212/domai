
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, raycaster, pointer;
let root = null;
let selected = null;
let initialized = false;
let editorState = {
  rooms: [],
  openings: [],
  floor: 1,
  house: {width: 10, depth: 10, floors: 1, height: 2.8}
};

function el(id){ return document.getElementById(id); }
function status(msg){ const e=el('domaiEditorStatus'); if(e)e.textContent=msg; }

function getProjectState(){
  // Reuse common DomAI variables where present.
  let h = window.house || {};
  const width = Number(h.width || h.houseWidth || 10);
  const depth = Number(h.depth || h.houseDepth || 10);
  const floors = Number(h.floors || 1);
  return {width, depth, floors, height: 2.8};
}

function ensureMount(){
  let mount = document.getElementById('threeHouse');
  if(!mount){
    mount = document.querySelector('[id*="three"]');
  }
  return mount;
}

function init3D(){
  if(initialized) return;
  const mount = ensureMount();
  if(!mount) return;
  initialized=true;
  editorState.house=getProjectState();

  scene=new THREE.Scene();
  scene.background=new THREE.Color(0xf3f6f8);
  camera=new THREE.PerspectiveCamera(45, 1, .1, 500);
  camera.position.set(16,12,18);

  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(Math.max(320,mount.clientWidth||700), 520);
  renderer.shadowMap.enabled=true;
  mount.innerHTML='';
  mount.appendChild(renderer.domElement);

  controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  controls.target.set(0,2,0);

  scene.add(new THREE.HemisphereLight(0xffffff,0x667788,2));
  const sun=new THREE.DirectionalLight(0xffffff,2.2);
  sun.position.set(10,18,8); sun.castShadow=true; scene.add(sun);
  scene.add(new THREE.GridHelper(40,40,0x999999,0xdddddd));

  raycaster=new THREE.Raycaster();
  pointer=new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown',onPick);
  window.addEventListener('resize',resize);
  rebuild();
  animate();
}

function box(name,w,h,d,x,y,z,kind,meta={}){
  const g=new THREE.BoxGeometry(Math.max(.05,w),Math.max(.05,h),Math.max(.05,d));
  const m=new THREE.MeshStandardMaterial({color:kind==='room'?0xdde8ef:kind==='window'?0x6fa8dc:kind==='door'?0x9b6b43:0xb0b0b0,transparent:kind==='window',opacity:kind==='window'?.72:1});
  const o=new THREE.Mesh(g,m);
  o.position.set(x,y,z);
  o.name=name;
  o.userData={kind,...meta};
  o.castShadow=true; o.receiveShadow=true;
  return o;
}

function makeRoom(r, index){
  const y=(r.floor-1)*editorState.house.height + editorState.house.height/2;
  const floor=box(r.name||`Комната ${index+1}`,r.width,.12,r.depth,r.x,y-.12,r.z,'room',{roomId:r.id});
  return floor;
}

function rebuild(){
  if(!scene) return;
  if(root) scene.remove(root);
  root=new THREE.Group();
  root.name='DomAI_V29_Editor';

  const h=editorState.house;
  const totalH=h.floors*h.height;
  const wallT=.22;

  // Outer shell
  for(let f=0;f<h.floors;f++){
    const y=f*h.height+h.height/2;
    root.add(box('Наружная стена север',h.width,h.height,wallT,0,y,-h.depth/2,'wall',{side:'north'}));
    root.add(box('Наружная стена юг',h.width,h.height,wallT,0,y,h.depth/2,'wall',{side:'south'}));
    root.add(box('Наружная стена запад',wallT,h.height,h.depth,-h.width/2,y,0,'wall',{side:'west'}));
    root.add(box('Наружная стена восток',wallT,h.height,h.depth,h.width/2,y,0,'wall',{side:'east'}));
    root.add(box(`Плита ${f+1}`,h.width,.12,h.depth,0,f*h.height-.06,0,'wall',{floor:f+1}));
  }

  (editorState.rooms||[]).forEach((r,i)=>root.add(makeRoom(r,i)));

  (editorState.openings||[]).forEach((o,i)=>{
    const y=(o.floor-1)*h.height+h.height*.58;
    let obj;
    if(o.type==='window'){
      obj=box(o.name||`Окно ${i+1}`,o.width,.9,.08,o.x,y,o.z,'window',{openingId:o.id,type:o.type});
    }else{
      obj=box(o.name||`Дверь ${i+1}`,o.width,2.0,.1,o.x,y-.25,o.z,'door',{openingId:o.id,type:o.type});
    }
    root.add(obj);
  });

  // roof
  const roof=box('Крыша',h.width+0.5,.18,h.depth+0.5,0,totalH+.1,0,'wall',{roof:true});
  root.add(roof);

  scene.add(root);
  status(`Модель обновлена: ${editorState.rooms.length} комнат, ${editorState.openings.length} проёмов.`);
}

function onPick(ev){
  if(!renderer) return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((ev.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((ev.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(root.children,true);
  if(!hits.length) return;
  const obj=hits[0].object;
  selectObject(obj);
}

function selectObject(obj){
  if(selected && selected.material && selected.material.emissive){
    selected.material.emissive.setHex(0x000000);
  }
  selected=obj;
  if(selected.material && selected.material.emissive) selected.material.emissive.setHex(0x333333);

  const d=selected.userData||{};
  el('edType').value=d.type || (d.kind==='room'?'room':d.kind==='wall'?'wall':'room');
  el('edName').value=selected.name||'';
  if(d.roomId){
    const r=editorState.rooms.find(x=>x.id===d.roomId);
    if(r){el('edWidth').value=r.width;el('edDepth').value=r.depth;el('edFloor').value=r.floor;}
  } else if(d.openingId){
    const o=editorState.openings.find(x=>x.id===d.openingId);
    if(o){el('edWidth').value=o.width;el('edDepth').value=o.depth||.1;el('edFloor').value=o.floor;}
  }
  status(`Выбрано: ${selected.name}`);
}

function uuid(prefix){return prefix+'_'+Date.now()+'_'+Math.floor(Math.random()*10000);}

window.domaiEditorApply=function(){
  if(!selected){status('Сначала выберите элемент на 3D-модели.');return;}
  const type=el('edType').value;
  const name=el('edName').value.trim()||selected.name;
  const width=Math.max(.5,Number(el('edWidth').value)||1);
  const depth=Math.max(.1,Number(el('edDepth').value)||.1);
  const floor=Math.max(1,Number(el('edFloor').value)||1);

  if(selected.userData.roomId){
    const r=editorState.rooms.find(x=>x.id===selected.userData.roomId);
    if(r){r.name=name;r.width=width;r.depth=Math.max(.5,depth);r.floor=floor;}
  } else if(selected.userData.openingId){
    const o=editorState.openings.find(x=>x.id===selected.userData.openingId);
    if(o){o.name=name;o.width=width;o.floor=floor;o.type=type==='window'?'window':'door';}
  } else if(selected.userData.kind==='wall'){
    // Conceptual wall thickness/length editing: width/depth apply to the selected mesh.
    selected.scale.x=width/Math.max(.01,selected.geometry.parameters.width||1);
    selected.scale.z=depth/Math.max(.01,selected.geometry.parameters.depth||1);
    selected.name=name;
    status('Размер стены изменён в концептуальной модели.');
    return;
  }
  rebuild();
};

window.domaiEditorAddRoom=function(){
  const h=editorState.house;
  const id=uuid('room');
  const n=editorState.rooms.length+1;
  const room={id,name:`Комната ${n}`,width:3.5,depth:3.5,x:0,z:0,floor:1};
  // place in a simple grid to avoid exact overlap
  const cols=3;
  const col=(n-1)%cols, row=Math.floor((n-1)/cols);
  room.x=-h.width/2+2+col*3.7;
  room.z=-h.depth/2+2+row*3.7;
  room.x=Math.min(h.width/2-room.width/2-.2,room.x);
  room.z=Math.min(h.depth/2-room.depth/2-.2,room.z);
  editorState.rooms.push(room);
  rebuild();
  status(`Добавлена ${room.name}.`);
};

window.domaiEditorAddOpening=function(type){
  const id=uuid(type);
  const opening={id,type,name:type==='door'?'Новая дверь':'Новое окно',width:type==='door'?.9:1.2,depth:.1,x:0,z:-editorState.house.depth/2-.03,floor:1};
  editorState.openings.push(opening);
  rebuild();
  status(`Добавлен объект: ${opening.name}.`);
};

window.domaiEditorDeleteSelected=function(){
  if(!selected){status('Ничего не выбрано.');return;}
  const d=selected.userData||{};
  if(d.roomId){
    editorState.rooms=editorState.rooms.filter(x=>x.id!==d.roomId);
  }else if(d.openingId){
    editorState.openings=editorState.openings.filter(x=>x.id!==d.openingId);
  }else{
    status('Элемент оболочки дома удаляется только вместе с конструкцией дома.');
    return;
  }
  selected=null;
  rebuild();
};

window.domaiEditorSave=async function(){
  const payload={
    version:'v29',
    house:editorState.house,
    rooms:editorState.rooms,
    openings:editorState.openings,
    disclaimer:'Концептуальная 3D-модель DomAI. Не является рабочей проектной/конструкторской документацией.'
  };
  try{
    const r=await fetch('/api/projects/save',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:'DomAI v29 3D Editor',data:payload})
    });
    if(r.ok) status('Проект сохранён на сервере.');
    else status('Сохранение не выполнено: сервер вернул ошибку.');
  }catch(e){
    // Still offer local export
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='domai_v29_project.json';a.click();
    status('Сервер недоступен — сохранён локальный JSON-файл.');
  }
};

function resize(){
  const mount=ensureMount(); if(!mount||!renderer)return;
  const w=Math.max(320,mount.clientWidth||700), h=520;
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);
}
function animate(){
  requestAnimationFrame(animate);
  if(controls)controls.update();
  if(renderer)renderer.render(scene,camera);
}

// Initialize after DOM and after v28 code had a chance to create the mount.
function boot(){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init3D,400));
  else setTimeout(init3D,400);
}
boot();
