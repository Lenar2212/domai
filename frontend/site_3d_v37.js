
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/DragControls.js';

let scene,camera,renderer,orbit,drag,root,raycaster,pointer,dragPlane;
let data={plot:{w:20,d:30},objects:[]}, selected=-1, dragMeshes=[];
const $=id=>document.getElementById(id);
const say=t=>{if($('v37Status'))$('v37Status').textContent=t};

function readState(){
 const keys=['domai_v37_state','domai_v35_state'];
 for(const k of keys){try{const x=JSON.parse(localStorage.getItem(k)||'null');if(x?.plot&&x?.objects){data=x;return}}catch(e){}}
 data.plot={w:Number($('v35PlotW')?.value||20),d:Number($('v35PlotD')?.value||30)};
 data.objects=[{type:'house',name:'Дом',w:10,d:12,x:0,z:-6}];
}
function mat(c){return new THREE.MeshStandardMaterial({color:c,roughness:.82})}
function box(name,w,h,d,x,y,z,c,meta={}){
 const o=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,w),Math.max(.05,h),Math.max(.05,d)),mat(c));
 o.name=name;o.position.set(x,y,z);o.userData={...meta,name};o.castShadow=true;o.receiveShadow=true;return o;
}
function init(){
 const m=$('domai36Mount'); if(!m)return;
 readState();
 scene=new THREE.Scene();scene.background=new THREE.Color(0xbfd8ee);
 camera=new THREE.PerspectiveCamera(45,1,.1,1000);camera.position.set(24,22,28);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.setSize(m.clientWidth||800,600);m.innerHTML='';m.appendChild(renderer.domElement);
 orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.48;orbit.target.set(0,0,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x607050,2));
 const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(20,35,15);sun.castShadow=true;scene.add(sun);
 scene.add(new THREE.GridHelper(Math.max(data.plot.w,data.plot.d)*2,40,0x778877,0xaabbaa));
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 window.addEventListener('resize',resize);
 build(); fillSelect(); loop();
}
function build(){
 if(root)scene.remove(root);root=new THREE.Group();dragMeshes=[];
 const p=data.plot;
 root.add(box('Участок',p.w,.05,p.d,0,-.04,0,0x86ad70,{type:'plot',static:true}));
 const f=.08,h=1.2;
 root.add(box('Ограждение север',p.w,h,f,0,h/2,-p.d/2,0x777777,{static:true}));
 root.add(box('Ограждение юг',p.w,h,f,0,h/2,p.d/2,0x777777,{static:true}));
 root.add(box('Ограждение запад',f,h,p.d,-p.w/2,h/2,0,0x777777,{static:true}));
 root.add(box('Ограждение восток',f,h,p.d,p.w/2,h/2,0x777777,{static:true}));
 data.objects.forEach((o,i)=>{
   if(o.type==='path'||o.type==='parking'||o.type==='garden'||o.type==='terrace'||o.type==='bbq'){
     const c={path:0xcbbf9c,parking:0x777777,garden:0x65a45e,terrace:0xb99563,bbq:0xc56f48}[o.type];
     const m=box(o.name,o.w,.25,o.d,o.x,.13,o.z,c,{index:i,type:o.type,editable:true});
     root.add(m);dragMeshes.push(m);
   } else {
     const c={house:0xd8b28d,garage:0x999999,bathhouse:0xb8794f}[o.type]||0xcab89a;
     const h=o.type==='house'?2.8:2.5;
     const m=box(o.name,o.w,h,o.d,o.x,h/2,o.z,c,{index:i,type:o.type,editable:true});
     root.add(m);dragMeshes.push(m);
     const roof=box('Крыша',o.w+.4,.25,o.d+.4,o.x,h+.12,o.z,0x9b5947,{static:true});
     root.add(roof);
   }
 });
 scene.add(root);
 if(drag)drag.dispose();
 drag=new DragControls(dragMeshes,camera,renderer.domElement);
 drag.addEventListener('hoveron',e=>{orbit.enabled=false;selectIndex(e.object.userData.index)});
 drag.addEventListener('hoveroff',()=>orbit.enabled=true);
 drag.addEventListener('dragstart',e=>{orbit.enabled=false;});
 drag.addEventListener('drag',e=>{e.object.position.y=Math.max(.13,e.object.position.y);const i=e.object.userData.index;data.objects[i].x=e.object.position.x;data.objects[i].z=e.object.position.z;updateForm();});
 drag.addEventListener('dragend',e=>{orbit.enabled=true;checkObject(data.objects[e.object.userData.index],e.object.userData.index,true)});
 say(`3D-редактор: ${data.objects.length} объектов. Перетаскивайте их мышью.`);
}
function selectIndex(i){selected=i;fillForm();$('v37Object').value=String(i)}
function fillSelect(){
 const sel=$('v37Object'); if(!sel)return; sel.innerHTML=data.objects.map((o,i)=>`<option value="${i}">${o.name||o.type} (${i+1})</option>`).join('');
 sel.onchange=()=>{selected=Number(sel.value);fillForm()};
 selected=data.objects.length?0:-1;fillForm();
}
function fillForm(){
 if(selected<0)return;const o=data.objects[selected];$('v37Object').value=String(selected);
 $('v37X').value=Number(o.x||0).toFixed(2);$('v37Z').value=Number(o.z||0).toFixed(2);
 $('v37W').value=Number(o.w||1).toFixed(2);$('v37D').value=Number(o.d||1).toFixed(2);
}
function updateForm(){if(selected>=0)fillForm()}
function rebuildKeep(){const old=selected;build();fillSelect();selected=Math.min(old,data.objects.length-1);fillForm();}
window.domai37Apply=()=>{
 if(selected<0)return;
 const o=data.objects[selected];
 o.x=Number($('v37X').value);o.z=Number($('v37Z').value);o.w=Math.max(.2,Number($('v37W').value));o.d=Math.max(.2,Number($('v37D').value));
 rebuildKeep();domai37Check();
};
function checkObject(o,i,one=false){
 const p=data.plot, issues=[];
 if(Math.abs(o.x)+o.w/2>p.w/2+1e-6)issues.push('выходит за границу по X');
 if(Math.abs(o.z)+o.d/2>p.d/2+1e-6)issues.push('выходит за границу по Z');
 for(let j=0;j<data.objects.length;j++){if(j===i)continue;const q=data.objects[j];
  if(o.type==='path'||q.type==='path'||o.type==='parking'||q.type==='parking')continue;
  if(Math.abs(o.x-q.x)<(o.w+q.w)/2 && Math.abs(o.z-q.z)<(o.d+q.d)/2)issues.push(`пересечение с «${q.name||q.type}»`);
 }
 return issues;
}
window.domai37Check=()=>{
 const all=[];data.objects.forEach((o,i)=>{const a=checkObject(o,i);if(a.length)all.push(`${o.name||o.type}: ${a.join(', ')}`)});
 say(all.length?`⚠️ Найдены проблемы: ${all.join(' | ')}`:`✅ Границы и простые пересечения не обнаружены.`);
};
window.domai37Center=()=>{
 if(selected<0)return;const o=data.objects[selected];o.x=0;o.z=0;rebuildKeep();say(`🎯 «${o.name||o.type}» перемещён в центр участка.`);
};
window.domai37Save=()=>{
 localStorage.setItem('domai_v37_state',JSON.stringify(data));
 try{fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'DomAI v37 3D Site',payload:data})}).catch(()=>{})}catch(e){}
 say('💾 Генплан сохранён локально; при наличии сервера отправлен в проект.');
};
function resize(){const m=$('domai36Mount');if(!m)return;camera.aspect=(m.clientWidth||800)/600;camera.updateProjectionMatrix();renderer.setSize(m.clientWidth||800,600)}
function loop(){requestAnimationFrame(loop);orbit?.update();renderer?.render(scene,camera)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,450));else setTimeout(init,450);
