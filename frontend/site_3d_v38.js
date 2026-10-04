
let v38Plan=null;
const q=id=>document.getElementById(id);
const st=t=>{if(q('v38Status'))q('v38Status').textContent=t};
function dims(){return {pw:+q('v38PW').value,pd:+q('v38PD').value,hw:+q('v38HW').value,hd:+q('v38HD').value,garage:+q('v38Garage').value,bath:+q('v38Bath').value,park:+q('v38Park').value,garden:+q('v38Garden').value}}
function rect(o){return {l:o.x-o.w/2,r:o.x+o.w/2,t:o.z-o.d/2,b:o.z+o.d/2}}
function overlap(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2 && Math.abs(a.z-b.z)<(a.d+b.d)/2}
function inside(o,p,pad=.15){return Math.abs(o.x)+o.w/2<=p.pw/2-pad && Math.abs(o.z)+o.d/2<=p.pd/2-pad}
function candidate(type,name,w,d,x,z){return {type,name,w,d,x,z}}
function valid(o,arr,p){
 if(!inside(o,p))return false;
 for(const x of arr) if(x.type!=='path' && o.type!=='path' && x.type!=='parking' && o.type!=='parking' && overlap(o,x))return false;
 return true;
}
function search(o,arr,p,zone){
 const xs=[],zs=[];
 for(let x=-p.pw/2+o.w/2+.3;x<=p.pw/2-o.w/2-.3;x+=.5)xs.push(x);
 for(let z=-p.pd/2+o.d/2+.3;z<=p.pd/2-o.d/2-.3;z+=.5)zs.push(z);
 let best=null,bestScore=1e9;
 for(const z of zs)for(const x of xs){
  const c={...o,x,z};
  if(!valid(c,arr,p))continue;
  let score=Math.abs(x-zone.x)+Math.abs(z-zone.z);
  // Prefer perimeter/service zones, then separation from house.
  if(typeIsService(o.type))score+=Math.max(0,4-Math.abs(x))*0.2;
  if(o.type==='garden')score+=Math.abs(z-p.pd*.18)*.15;
  if(score<bestScore){best=c;bestScore=score}
 }
 return best;
}
function typeIsService(t){return t==='garage'||t==='bathhouse'}
function optimize(){
 const p=dims(), plan=[];
 // House near front/central but leaves rear for garden.
 const house=candidate('house','Дом',p.hw,p.hd,0,-p.pd/2+p.hd/2+4);
 let h=search(house,plan,p,{x:0,z:-p.pd*.25}); if(!h)h=house;plan.push(h);
 if(p.garage){
  const gw=p.garage===2?6.2:3.4,gd=6.2;
  const g=candidate('garage',p.garage===2?'Гараж на 2 машины':'Гараж',gw,gd,0,0);
  const gg=search(g,plan,p,{x:p.pw/2-gw/2-1,z:-p.pd/2+gd/2+2});
  if(gg)plan.push(gg);
 }
 if(p.bath){
  const b=candidate('bathhouse','Баня',5,6,0,0);
  const bb=search(b,plan,p,{x:p.pw/2-3,z:p.pd/2-4});
  if(bb)plan.push(bb);
 }
 const pw=Math.max(2.8,p.park*2.7),pd=5.5;
 const park=candidate('parking',`Парковка ${p.park} места`,pw,pd,0,0);
 const pp=search(park,plan,p,{x:-p.pw/2+pw/2+1,z:-p.pd/2+pd/2+1});
 if(pp)plan.push(pp);
 if(p.garden){
  const gd=Math.max(5,p.pd*.32),gw=Math.max(5,p.pw*.42);
  const garden=candidate('garden','Сад',gw,gd,0,p.pd/2-gd/2-1);
  const gr=search(garden,plan,p,{x:0,z:p.pd/2-gd/2-1});
  if(gr)plan.push(gr);
 }
 const terrace=candidate('terrace','Терраса',Math.min(7,p.hw*.65),3,h.x,h.z+p.hd/2+1.8);
 if(valid(terrace,plan,p))plan.push(terrace);
 const bbq=candidate('bbq','Мангал',2.2,2.2,0,p.pd/2-3);
 if(valid(bbq,plan,p))plan.push(bbq);
 return {plot:{w:p.pw,d:p.pd},objects:plan};
}
function issues(plan){
 const p={pw:plan.plot.w,pd:plan.plot.d},a=[];
 plan.objects.forEach((o,i)=>{
  if(!inside(o,p))a.push(`${o.name}: за границами`);
  for(let j=i+1;j<plan.objects.length;j++){
   const x=plan.objects[j];
   if(o.type!=='parking'&&x.type!=='parking'&&o.type!=='path'&&x.type!=='path'&&overlap(o,x))a.push(`${o.name} ↔ ${x.name}: пересечение`);
  }
 });
 return a;
}
function score(plan){
 const p=plan.plot,iss=issues(plan),n=plan.objects.length;
 let score=Math.max(0,100-iss.length*18);
 // compactness and usable garden bonus
 const garden=plan.objects.find(x=>x.type==='garden');
 if(garden)score+=8;
 const house=plan.objects.find(x=>x.type==='house');
 if(house && Math.abs(house.x)<p.w*.3)score+=4;
 return {score:Math.min(100,Math.round(score)),issues:iss,count:n};
}
window.domai38Optimize=()=>{
 v38Plan=optimize();const s=score(v38Plan);
 q('v38Report').innerHTML=`<b>Результат:</b> ${s.score}/100<br>Объектов: ${s.count}<br>${s.issues.length?'⚠️ '+s.issues.join('<br>'):'✅ Простые геометрические проверки пройдены.'}`;
 st('🤖 Концептуальная оптимизация завершена.');
};
window.domai38Apply=()=>{
 if(!v38Plan)window.domai38Optimize();
 if(!v38Plan)return;
 localStorage.setItem('domai_v37_state',JSON.stringify(v38Plan));
 localStorage.setItem('domai_v38_plan',JSON.stringify(v38Plan));
 window.dispatchEvent(new StorageEvent('storage',{key:'domai_v37_state',newValue:JSON.stringify(v38Plan)}));
 st('✅ План применён и сохранён. Нажмите «Построить 3D» в редакторе v36/v37, если сцена не обновилась автоматически.');
};
window.domai38Score=()=>{
 if(!v38Plan)window.domai38Optimize(); else {
  const s=score(v38Plan);q('v38Report').innerHTML=`<b>Оценка:</b> ${s.score}/100<br>${s.issues.length?'⚠️ '+s.issues.join('<br>'):'✅ Простые проверки пройдены.'}`;
 }
};
