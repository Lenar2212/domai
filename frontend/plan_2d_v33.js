
// DomAI v33 — lightweight 2D/3D conceptual synchronizer
const canvas=document.getElementById('domai33Canvas');
const ctx=canvas?.getContext('2d');
let V={
 house:{width:10,depth:10,floors:1,height:2.8},
 rooms:[], openings:[], selected:null, scale:45, ox:350, oy:260, dragging:false, dragDX:0,dragDZ:0
};
const $=id=>document.getElementById(id);
const uid=p=>p+'_'+Date.now()+'_'+Math.floor(Math.random()*9999);
const snap=v=>Math.round(v/.25)*.25;
const say=t=>{if($('domai33Info'))$('domai33Info').textContent=t};

function sourceState(){
 const h=window.house||{};
 V.house.width=Number(h.width||10);V.house.depth=Number(h.depth||10);V.house.floors=Number(h.floors||1);
 if(!V.rooms.length){
  V.rooms=[
   {id:uid('r'),name:'Гостиная',width:4,depth:4,x:-2,z:-1,floor:1},
   {id:uid('r'),name:'Кухня',width:3,depth:3.5,x:1.5,z:-1.2,floor:1},
   {id:uid('r'),name:'Спальня',width:3.3,depth:3.2,x:-1.8,z:2.7,floor:1},
   {id:uid('r'),name:'Санузел',width:2,depth:2.2,x:1.7,z:2.4,floor:1}
  ];
 }
}
function worldToCanvas(x,z){return [V.ox+x*V.scale,V.oy+z*V.scale]}
function canvasToWorld(x,z){return [(x-V.ox)/V.scale,(z-V.oy)/V.scale]}
function fit(){
 const max=Math.max(V.house.width,V.house.depth);
 V.scale=Math.min(500/max,700/max);
 V.ox=canvas.width/2;V.oy=canvas.height/2;draw();
}
function draw(){
 if(!ctx)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#fafafa';ctx.fillRect(0,0,canvas.width,canvas.height);
 // grid
 ctx.strokeStyle='#e3e3e3';ctx.lineWidth=1;
 for(let x=0;x<canvas.width;x+=V.scale/2){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke()}
 for(let y=0;y<canvas.height;y+=V.scale/2){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke()}
 // house
 const [hx1,hy1]=worldToCanvas(-V.house.width/2,-V.house.depth/2);
 ctx.strokeStyle='#333';ctx.lineWidth=4;ctx.strokeRect(hx1,hy1,V.house.width*V.scale,V.house.depth*V.scale);
 // rooms
 V.rooms.forEach(r=>{
   const [x,y]=worldToCanvas(r.x-r.width/2,r.z-r.depth/2);
   const w=r.width*V.scale,d=r.depth*V.scale;
   ctx.fillStyle=r.id===V.selected?'#c8e3f5':'#e7eef2';
   ctx.fillRect(x,y,w,d);ctx.strokeStyle='#666';ctx.lineWidth=2;ctx.strokeRect(x,y,w,d);
   ctx.fillStyle='#222';ctx.font='14px sans-serif';ctx.textAlign='center';
   ctx.fillText(r.name,x+w/2,y+d/2-6);
   ctx.font='12px sans-serif';ctx.fillText(`${r.width.toFixed(1)} × ${r.depth.toFixed(1)} м`,x+w/2,y+d/2+12);
   ctx.fillText(`${(r.width*r.depth).toFixed(1)} м²`,x+w/2,y+d/2+28);
 });
 // dimensions
 ctx.fillStyle='#333';ctx.font='13px sans-serif';ctx.textAlign='left';
 ctx.fillText(`Участок/дом: ${V.house.width} × ${V.house.depth} м`,10,20);
 ctx.fillText(`Общая площадь помещений: ${V.rooms.reduce((a,r)=>a+r.width*r.depth,0).toFixed(1)} м²`,10,40);
}
function selectAt(px,py){
 for(let i=V.rooms.length-1;i>=0;i--){
  let r=V.rooms[i],[x,y]=worldToCanvas(r.x-r.width/2,r.z-r.depth/2);
  if(px>=x&&px<=x+r.width*V.scale&&py>=y&&py<=y+r.depth*V.scale){V.selected=r.id;load();return r}
 }
 V.selected=null;load();draw();return null;
}
function load(){
 let r=V.rooms.find(x=>x.id===V.selected);
 const s=$('v33Room');if(s){s.innerHTML='';V.rooms.forEach(x=>{let o=document.createElement('option');o.value=x.id;o.textContent=x.name;s.appendChild(o)});if(r)s.value=r.id}
 if(r){$('v33W').value=r.width;$('v33D').value=r.depth;$('v33X').value=r.x;$('v33Z').value=r.z;say(`${r.name}: ${(r.width*r.depth).toFixed(1)} м²`)}
 draw();
}
$('v33Room')?.addEventListener('change',e=>{V.selected=e.target.value;load()});
function pointer(e){
 const r=canvas.getBoundingClientRect();
 return [(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height];
}
canvas?.addEventListener('pointerdown',e=>{
 let [x,y]=pointer(e),r=selectAt(x,y);
 if(r){V.dragging=true;V.dragDX=r.x-(x-V.ox)/V.scale;V.dragDZ=r.z-(y-V.oy)/V.scale;canvas.setPointerCapture(e.pointerId)}
});
canvas?.addEventListener('pointermove',e=>{
 if(!V.dragging)return;let r=V.rooms.find(x=>x.id===V.selected);if(!r)return;
 let [x,y]=pointer(e);r.x=snap((x-V.ox)/V.scale+V.dragDX);r.z=snap((y-V.oy)/V.scale+V.dragDZ);
 clamp(r);load();say(`Перемещение ${r.name}: X ${r.x.toFixed(2)}, Z ${r.z.toFixed(2)}`);
});
canvas?.addEventListener('pointerup',()=>{V.dragging=false;syncToGlobal()});
function clamp(r){
 r.x=Math.max(-V.house.width/2+r.width/2+.1,Math.min(V.house.width/2-r.width/2-.1,r.x));
 r.z=Math.max(-V.house.depth/2+r.depth/2+.1,Math.min(V.house.depth/2-r.depth/2-.1,r.z));
}
function syncToGlobal(){
 window.dispatchEvent(new CustomEvent('domai:v33:state',{detail:{house:V.house,rooms:V.rooms,openings:V.openings}}));
 window.domai33Sync3D?.();
}
window.domai33Apply=()=>{
 let r=V.rooms.find(x=>x.id===$('v33Room').value);if(!r)return;
 r.width=Math.max(1,Number($('v33W').value)||r.width);r.depth=Math.max(1,Number($('v33D').value)||r.depth);
 r.x=snap(Number($('v33X').value)||r.x);r.z=snap(Number($('v33Z').value)||r.z);clamp(r);draw();syncToGlobal();say('Изменения применены и переданы в 3D.');
}
window.domai33Fit=fit;
window.domai33Sync3D=()=>{
 window.dispatchEvent(new CustomEvent('domai:v33:to3d',{detail:{house:V.house,rooms:V.rooms,openings:V.openings}}));
 say('2D-план синхронизирован с 3D.');
}
window.domai33Sync2D=()=>{draw();load();say('2D-план обновлён.')}
window.domai33Save=async()=>{
 const payload={version:'v33',house:V.house,rooms:V.rooms,openings:V.openings,
 areas:V.rooms.map(r=>({name:r.name,area:+(r.width*r.depth).toFixed(2)})),
 disclaimer:'Концептуальный план. Не является рабочей проектной документацией.'};
 try{
  const q=await fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'DomAI v33 2D 3D Sync',data:payload})});
  if(!q.ok)throw Error();say('Проект v33 сохранён на сервере.');
 }catch(e){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='domai_v33_project.json';a.click();say('Сервер недоступен — сохранён JSON.');
 }
}
sourceState();fit();load();syncToGlobal();
