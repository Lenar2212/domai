
let v40Plans=[],v40Selected=0;
const q40=id=>document.getElementById(id);
const status40=t=>{if(q40('v40Status'))q40('v40Status').textContent=t};
function esc40(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function score40(p){
 let issues=0,used=0;const a=p.objects||[],w=p.plot.w,d=p.plot.d;
 for(let i=0;i<a.length;i++){
  const o=a[i];used+=(o.w||0)*(o.d||0);
  if(Math.abs(o.x)+o.w/2>w/2 || Math.abs(o.z)+o.d/2>d/2)issues++;
  for(let j=i+1;j<a.length;j++){const x=a[j];
   if(o.type!=='parking'&&x.type!=='parking'&&o.type!=='path'&&x.type!=='path'&&Math.abs(o.x-x.x)<(o.w+x.w)/2&&Math.abs(o.z-x.z)<(o.d+x.d)/2)issues++;
  }
 }
 return {score:Math.max(0,Math.min(100,100-issues*20)),used,issues};
}
function draw40(canvas,p){
 const ctx=canvas.getContext('2d'),W=360,H=220;ctx.clearRect(0,0,W,H);
 ctx.fillStyle='#d9ead3';ctx.fillRect(8,8,W-16,H-16);
 const sx=(W-30)/p.plot.w,sz=(H-30)/p.plot.d;
 const ox=W/2,oz=H/2;
 ctx.strokeStyle='#777';ctx.strokeRect(15,15,W-30,H-30);
 const colors={house:'#c99062',garage:'#888',bathhouse:'#a96f4e',garden:'#62a05b',parking:'#666',terrace:'#bd9a67',bbq:'#c46c45'};
 (p.objects||[]).forEach(o=>{
  const x=ox+o.x*sx-o.w*sx/2,z=oz+o.z*sz-o.d*sz/2;
  ctx.fillStyle=colors[o.type]||'#b8b8b8';ctx.fillRect(x,z,Math.max(3,o.w*sx),Math.max(3,o.d*sz));
  ctx.strokeStyle='#444';ctx.strokeRect(x,z,Math.max(3,o.w*sx),Math.max(3,o.d*sz));
 });
}
function render40(){
 const grid=q40('v40Grid');grid.innerHTML='';
 v40Plans.forEach((p,i)=>{
  const s=score40(p),card=document.createElement('div');
  card.style.cssText=`border:2px solid ${i===v40Selected?'#222':'#bbb'};border-radius:12px;padding:10px;background:${i===v40Selected?'#f3f3f3':'#fff'}`;
  card.innerHTML=`<h3 style="margin:0 0 6px">Вариант ${i+1}</h3>
  <canvas width="360" height="220" style="width:100%;border-radius:8px"></canvas>
  <div style="margin-top:7px">Показатель: <b>${s.score}/100</b><br>Объектов: ${p.objects.length}<br>Занято: ${Math.round(s.used)} м²<br>Проблем: ${s.issues}</div>
  <button style="margin-top:8px">Выбрать</button>`;
  card.querySelector('button').onclick=()=>{v40Selected=i;render40();status40(`Выбран вариант ${i+1}.`)};
  grid.appendChild(card);draw40(card.querySelector('canvas'),p);
 });
}
window.domai40Load=()=>{
 try{
  const raw=JSON.parse(localStorage.getItem('domai_v39_selected')||'null');
  const old=JSON.parse(localStorage.getItem('domai_v39_plans')||'null');
  if(Array.isArray(old)&&old.length)v40Plans=old; else if(raw)v40Plans=[raw];
  render40();status40(v40Plans.length?`Загружено вариантов: ${v40Plans.length}.`:'Варианты не найдены. Сначала создайте их в v39.');
 }catch(e){status40('Не удалось загрузить варианты.')}
};
window.domai40Compare=()=>{domai40Load()};
window.domai40Apply=()=>{
 if(!v40Plans.length)domai40Load();
 if(!v40Plans.length)return;
 const p=v40Plans[v40Selected];localStorage.setItem('domai_v37_state',JSON.stringify(p));localStorage.setItem('domai_v40_selected',JSON.stringify(p));
 status40(`Вариант ${v40Selected+1} применён. Откройте 3D-редактор и обновите сцену.`);
};
setTimeout(()=>window.domai40Load(),600);
