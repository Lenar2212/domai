
// DomAI v34 — deterministic conceptual AI planner.
// No external LLM is required; requirements are converted into a reproducible layout.
const $=id=>document.getElementById(id);
let V34={house:{width:10,depth:15,floors:1},rooms:[],openings:[],spec:{}};

const uid=p=>p+'_'+Date.now()+'_'+Math.floor(Math.random()*9999);
const say=t=>{if($('v34Summary'))$('v34Summary').textContent=t};
function getGlobalHouse(){
 const h=window.house||{};
 let area=Number($('v34Area')?.value||150);
 let floors=Number($('v34Floors')?.value||1);
 let width=Number(h.width||Math.max(8,Math.sqrt(area/floors)*1.15));
 let depth=Number(h.depth||Math.max(8,area/floors/width));
 return {width,depth,floors,height:2.8};
}
function req(){
 return {
 bedrooms:+$('v34Bedrooms').value||0,
 bathrooms:+$('v34Bathrooms').value||0,
 wardrobes:+$('v34Wardrobes').value||0,
 boiler:$('v34Boiler').value==='yes',
 kitchen:$('v34Kitchen').value==='yes',
 office:$('v34Office').value==='yes',
 laundry:$('v34Laundry').value==='yes',
 floors:+$('v34Floors').value||1,
 area:+$('v34Area').value||150,
 prompt:($('v34Prompt').value||'').toLowerCase()
 };
}
function add(name,w,d,x,z,f=1,type='room'){
 V34.rooms.push({id:uid('r'),name,width:w,depth:d,x,z,floor:f,type});
}
function normalizeRoom(r){
 r.width=Math.max(1.5,r.width);r.depth=Math.max(1.5,r.depth);
 const h=V34.house;
 r.x=Math.max(-h.width/2+r.width/2+.1,Math.min(h.width/2-r.width/2-.1,r.x));
 r.z=Math.max(-h.depth/2+r.depth/2+.1,Math.min(h.depth/2-r.depth/2-.1,r.z));
}
function gridPlace(list,floor){
 const h=V34.house;
 const cols=Math.max(1,Math.floor(h.width/3.2));
 list.forEach((r,i)=>{
   let col=i%cols,row=Math.floor(i/cols);
   r.x=-h.width/2+r.width/2+.2+col*3.1;
   r.z=-h.depth/2+r.depth/2+.2+row*3.1;
   r.floor=floor;normalizeRoom(r);
 });
}
function parsePrompt(r){
 let p=r.prompt;
 if(/мастер|master/.test(p)) r.wardrobes=Math.max(r.wardrobes,1);
 if(/кабинет|офис/.test(p)) r.office=true;
 if(/постироч|прачеч/.test(p)) r.laundry=true;
 if(/гостин/.test(p)) r.kitchen=true;
 if(/гараж/.test(p)) r.garage=true;
 if(/террас/.test(p)) r.terrace=true;
 if(/баня/.test(p)) r.bathhouse=true;
}
function generate(){
 let r=req();parsePrompt(r);
 V34.house=getGlobalHouse();V34.house.floors=r.floors;V34.rooms=[];V34.openings=[];
 // Target area per floor; allocate practical conceptual room sizes.
 let floor=1, y=0;
 const usable=Math.max(40,V34.house.width*V34.house.depth*.78);
 let rooms=[];
 if(r.kitchen) rooms.push(['Кухня-гостиная',Math.max(22,Math.min(40,usable*.24)),1]);
 for(let i=1;i<=r.bedrooms;i++) rooms.push([i===1&&r.wardrobes?'Мастер-спальня':`Спальня ${i}`,Math.max(12,Math.min(22,usable*.12)),1]);
 for(let i=1;i<=r.bathrooms;i++) rooms.push([`Санузел ${i}`,i===1?5:4,2]);
 for(let i=1;i<=r.wardrobes;i++) rooms.push([`Гардеробная ${i}`,5,2]);
 if(r.boiler) rooms.push(['Котельная',6,2]);
 if(r.office) rooms.push(['Кабинет',10,1]);
 if(r.laundry) rooms.push(['Постирочная',6,2]);
 // mandatory circulation
 rooms.push(['Холл / коридор',Math.max(10,usable*.10),1]);
 if(r.garage) rooms.push(['Гараж',30,3]);
 if(r.terrace) rooms.push(['Терраса',18,4,'external']);
 if(r.bathhouse) rooms.push(['Баня',20,4,'external']);

 // Distribute by floors using simple rules.
 let perFloor=[[]];for(const x of rooms){
   if(x[3]==='external')continue;
   let target=perFloor[0];
   if(r.floors>1 && (x[0].startsWith('Спальня')||x[0].startsWith('Гардероб')||x[0].startsWith('Санузел')||x[0]==='Кабинет')) {
     let f=(perFloor.length<r.floors)?perFloor.length-1:((perFloor[0].length>5)?1:0);
     if(!perFloor[f])perFloor[f]=[];target=perFloor[f];
   }
   target.push(x);
 }
 perFloor=perFloor.slice(0,r.floors);
 perFloor.forEach((arr,fi)=>{
   const baseZ=-V34.house.depth/2+1.6;
   let idx=0;
   arr.forEach(x=>{
     let area=x[1],w=Math.max(2,Math.min(V34.house.width-1,Math.sqrt(area)*1.35)),d=Math.max(2,area/w);
     add(x[0],w,d,0,baseZ+idx*3.0,fi+1,x[2]===2?'wet':'room');idx++;
   });
 });
 // Place external objects as conceptual rooms beyond house.
 const ext=rooms.filter(x=>x[3]==='external');
 ext.forEach((x,i)=>add(x[0],Math.sqrt(x[1])*1.5,Math.sqrt(x[1])/1.5,0,V34.house.depth/2+2+i*4,1,'external'));

 // Grid-pack rooms floor by floor.
 for(let f=1;f<=r.floors;f++){
   const arr=V34.rooms.filter(x=>x.floor===f && x.type!=='external');
   gridPlace(arr,f);
 }
 // Create conceptual openings.
 V34.rooms.filter(x=>x.type!=='external').forEach((room,i)=>{
   V34.openings.push({id:uid('d'),type:'door',name:'Дверь '+room.name,width:.9,wall:'south',roomId:room.id,floor:room.floor});
   if(i<Math.max(1,r.bedrooms))V34.openings.push({id:uid('w'),type:'window',name:'Окно '+room.name,width:1.4,wall:'north',roomId:room.id,floor:room.floor});
 });
 V34.spec=r;
 sync();
 summarize();
}
function optimize(){
 if(!V34.rooms.length){generate();return}
 const target=(Number($('v34Area').value)||150)/Math.max(1,V34.house.floors);
 const fixed=V34.rooms.filter(r=>['wet','external'].includes(r.type));
 const flex=V34.rooms.filter(r=>!fixed.includes(r));
 let fixedArea=fixed.reduce((a,r)=>a+r.width*r.depth,0);
 let remaining=Math.max(0,target-fixedArea);
 let each=flex.length?remaining/flex.length:0;
 flex.forEach(r=>{
   let ratio=r.width/Math.max(.1,r.depth);
   r.width=Math.max(2.2,Math.sqrt(each*ratio));
   r.depth=Math.max(2.2,each/r.width);
   normalizeRoom(r);
 });
 sync();summarize();say('Площади помещений оптимизированы под заданную площадь дома.');
}
function summarize(){
 let total=V34.rooms.reduce((a,r)=>a+r.width*r.depth,0);
 let by={};V34.rooms.forEach(r=>by[r.floor]=(by[r.floor]||0)+r.width*r.depth);
 say(`Создано ${V34.rooms.length} помещений. Концептуальная площадь: ${total.toFixed(1)} м². `+
     Object.entries(by).map(([f,a])=>`этаж ${f}: ${a.toFixed(1)} м²`).join(' | '));
}
function sync(){
 window.dispatchEvent(new CustomEvent('domai:v34:state',{detail:V34}));
 // Try to update known 2D v33 state if exposed by event listener.
 window.dispatchEvent(new CustomEvent('domai:v34:to2d',{detail:V34}));
 window.dispatchEvent(new CustomEvent('domai:v34:to3d',{detail:V34}));
 localStorage.setItem('domai_v34_state',JSON.stringify(V34));
}
window.domai34Generate=generate;
window.domai34Optimize=optimize;
window.domai34Reset=()=>{
 V34.rooms=[];V34.openings=[];V34.spec={};localStorage.removeItem('domai_v34_state');sync();say('План сброшен.');
}
window.domai34Save=async()=>{
 const payload={version:'v34',...V34,
  areas:V34.rooms.map(r=>({id:r.id,name:r.name,floor:r.floor,area:+(r.width*r.depth).toFixed(2)})),
  disclaimer:'Автоматически созданная концептуальная планировка. Не является рабочей проектной документацией.'};
 try{
  let q=await fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({name:'DomAI v34 AI Planner',data:payload})});
  if(!q.ok)throw Error();say('План v34 сохранён на сервере.');
 }catch(e){
  let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  a.download='domai_v34_ai_plan.json';a.click();say('Сервер недоступен — сохранён JSON.');
 }
}
window.addEventListener('domai:v33:state',e=>{if(e.detail){V34.rooms=e.detail.rooms||V34.rooms;V34.openings=e.detail.openings||V34.openings;summarize()}})
