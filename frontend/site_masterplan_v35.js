
// DomAI v35 — conceptual site masterplan generator
let M={plot:{w:20,d:30},objects:[],issues:[]};
const $=id=>document.getElementById(id);
const say=t=>{if($('v35Status'))$('v35Status').textContent=t};
const uid=p=>p+'_'+Date.now()+'_'+Math.floor(Math.random()*9999);
const snap=v=>Math.round(v/.5)*.5;

function req(){
 return {
  pw:+$('v35PlotW').value||20,pd:+$('v35PlotD').value||30,
  hw:+$('v35HouseW').value||10,hd:+$('v35HouseD').value||12,
  garage:+$('v35Garage').value||0,bath:$('v35Bath').value==='yes',
  parking:+$('v35Parking').value||2,garden:$('v35Garden').value==='yes',
  terrace:$('v35Terrace').value==='yes',bbq:$('v35Bbq').value==='yes'
 };
}
function add(type,name,w,d,x,z,extra={}){
 M.objects.push({id:uid(type),type,name,w,d,x,z,...extra});
}
function generate(){
 const r=req();M.plot={w:r.pw,d:r.pd};M.objects=[];M.issues=[];
 // Coordinate system: plot center = 0,0. Street assumed at front (negative Z).
 add('house','Дом',r.hw,r.hd,0,-r.pd/2+r.hd/2+3);
 if(r.terrace)add('terrace','Терраса',Math.min(r.hw-1,7),3,0,-r.pd/2+r.hd+4.8);
 if(r.garage){
   const gw=r.garage===2?6:3.5,gd=6;
   add('garage','Гараж',gw,gd,r.pw/2-gw/2-1,-r.pd/2+gd/2+1);
 }
 const parkW=Math.max(2.7,r.parking*2.7);
 add('parking','Парковка',parkW,5,-r.pw/2+parkW/2+1,-r.pd/2+2.5);
 if(r.bath)add('bathhouse','Баня',5,6,r.pw/2-3.5,3);
 if(r.garden)add('garden','Сад',Math.min(8,r.pw*.38),Math.min(10,r.pd*.28),-r.pw*.22,r.pd*.28);
 if(r.bbq)add('bbq','Мангальная зона',4,4,r.pw*.28,r.pd*.30);
 // Conceptual paths
 add('path','Дорожка к дому',2,r.pd*.45,-r.pw*.34,-r.pd*.05,{style:'path'});
 add('path','Дорожка к бане',1.5,8,r.pw*.32,-r.pd*.05,{style:'path'});
 // Keep everything in plot where possible
 M.objects.forEach(o=>clamp(o));
 check();
 draw();
 say(`Генплан создан: ${M.objects.length} объектов. ${M.issues.length?'Есть замечания: '+M.issues.length:'Конфликтов по границам не найдено.'}`);
}
function clamp(o){
 const pw=M.plot.w/2,pd=M.plot.d/2;
 o.x=Math.max(-pw+o.w/2+.3,Math.min(pw-o.w/2-.3,o.x));
 o.z=Math.max(-pd+o.d/2+.3,Math.min(pd-o.d/2-.3,o.z));
}
function overlap(a,b){
 return Math.abs(a.x-b.x)<(a.w+b.w)/2 && Math.abs(a.z-b.z)<(a.d+b.d)/2;
}
function check(){
 M.issues=[];
 const pw=M.plot.w/2,pd=M.plot.d/2;
 M.objects.forEach(o=>{
   if(Math.abs(o.x)+o.w/2>pw+.001||Math.abs(o.z)+o.d/2>pd+.001)
    M.issues.push(`${o.name}: выходит за границы участка`);
 });
 for(let i=0;i<M.objects.length;i++)for(let j=i+1;j<M.objects.length;j++){
   const a=M.objects[i],b=M.objects[j];
   if(['path','parking'].includes(a.type)||['path','parking'].includes(b.type))continue;
   if(overlap(a,b))M.issues.push(`Пересечение: ${a.name} ↔ ${b.name}`);
 }
 return M.issues;
}
function optimize(){
 // Iterative deterministic placement: prioritize house, then garage/parking, then recreation, then garden.
 const house=M.objects.find(o=>o.type==='house');
 if(house){house.x=0;house.z=-M.plot.d/2+house.d/2+3;clamp(house)}
 const garage=M.objects.find(o=>o.type==='garage');
 if(garage){garage.x=M.plot.w/2-garage.w/2-1;garage.z=-M.plot.d/2+garage.d/2+1;clamp(garage)}
 const park=M.objects.find(o=>o.type==='parking');
 if(park){park.x=-M.plot.w/2+park.w/2+1;park.z=-M.plot.d/2+park.d/2+1;clamp(park)}
 const bath=M.objects.find(o=>o.type==='bathhouse');
 if(bath){bath.x=M.plot.w/2-bath.w/2-1; bath.z=3;clamp(bath)}
 const garden=M.objects.find(o=>o.type==='garden');
 if(garden){garden.x=-M.plot.w*.2;garden.z=M.plot.d*.27;clamp(garden)}
 const bbq=M.objects.find(o=>o.type==='bbq');
 if(bbq){bbq.x=M.plot.w*.27;bbq.z=M.plot.d*.28;clamp(bbq)}
 check();draw();say(`Размещение оптимизировано. Замечаний: ${M.issues.length}.`);
}
function draw(){
 const c=$('domai35Canvas'),ctx=c?.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,c.width,c.height);
 const s=Math.min((c.width-80)/M.plot.w,(c.height-80)/M.plot.d);
 const ox=c.width/2,oy=c.height/2;
 ctx.fillStyle='#eef5e8';ctx.fillRect(40,40,c.width-80,c.height-80);
 ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.strokeRect(ox-M.plot.w*s/2,oy-M.plot.d*s/2,M.plot.w*s,M.plot.d*s);
 const colors={house:'#d8c2a8',garage:'#b8b8b8',bathhouse:'#d2a679',parking:'#999',garden:'#b7d69a',terrace:'#c8b07a',bbq:'#e1a46d',path:'#d5c6a6'};
 M.objects.forEach(o=>{
  const x=ox+(o.x-o.w/2)*s,y=oy+(o.z-o.d/2)*s;
  ctx.fillStyle=colors[o.type]||'#ddd';ctx.fillRect(x,y,o.w*s,o.d*s);
  ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.strokeRect(x,y,o.w*s,o.d*s);
  ctx.fillStyle='#222';ctx.font='13px sans-serif';ctx.textAlign='center';
  ctx.fillText(o.name,x+o.w*s/2,y+o.d*s/2,o.w*s);
 });
 ctx.fillStyle='#222';ctx.textAlign='left';ctx.font='14px sans-serif';
 ctx.fillText(`Участок ${M.plot.w} × ${M.plot.d} м`,10,20);
 if(M.issues.length){ctx.fillStyle='#b00020';ctx.fillText(`Замечаний: ${M.issues.length}`,10,c.height-12)}
}
function save(){
 const payload={version:'v35',plot:M.plot,objects:M.objects,issues:M.issues,
 disclaimer:'Концептуальный генеральный план. Не является рабочей проектной документацией.'};
 fetch('/api/projects/save',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({name:'DomAI v35 Site Masterplan',data:payload})})
 .then(r=>{if(!r.ok)throw Error();say('Генплан сохранён на сервере.')})
 .catch(()=>{let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='domai_v35_site_masterplan.json';a.click();say('Сервер недоступен — сохранён JSON.')});
}
window.domai35Generate=generate;window.domai35Optimize=optimize;window.domai35Check=()=>{check();draw();say(M.issues.length?`Найдено замечаний: ${M.issues.join(' | ')}`:'Проверка: пересечений и выхода за границы не обнаружено.');};window.domai35Save=save;
window.addEventListener('domai:v34:state',e=>{
 if(e.detail?.house){M.house=e.detail.house}
});
generate();
