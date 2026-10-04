
let v39Plans=[],v39Selected=0;
const $39=id=>document.getElementById(id);
function p39(){return {pw:+$39('v39PW').value,pd:+$39('v39PD').value,hw:+$39('v39HW').value,hd:+$39('v39HD').value,n:+$39('v39N').value,garage:+$39('v39Garage').value,bath:+$39('v39Bath').value,garden:+$39('v39Garden').value}}
function ov39(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)/2 && Math.abs(a.z-b.z)<(a.d+b.d)/2}
function in39(o,p){return Math.abs(o.x)+o.w/2<=p.pw/2-.2&&Math.abs(o.z)+o.d/2<=p.pd/2-.2}
function ok39(o,a,p){if(!in39(o,p))return false;for(const x of a)if(o.type!=='path'&&x.type!=='path'&&o.type!=='parking'&&x.type!=='parking'&&ov39(o,x))return false;return true}
function find39(base,a,p,zone){
 let best=null,bs=1e9;
 for(let z=-p.pd/2+base.d/2+.3;z<=p.pd/2-base.d/2-.3;z+=.5)
  for(let x=-p.pw/2+base.w/2+.3;x<=p.pw/2-base.w/2-.3;x+=.5){
   const o={...base,x,z};if(!ok39(o,a,p))continue;
   let s=Math.abs(x-zone.x)+Math.abs(z-zone.z);
   if(s<bs){bs=s;best=o}
  }
 return best;
}
function build39(p,seed){
 const a=[], phase=seed%4;
 const zones=[
  {house:{x:0,z:-p.pd*.25},garden:{x:0,z:p.pd*.25},garage:{x:-p.pw*.3,z:-p.pd*.28},bath:{x:p.pw*.3,z:p.pd*.28}},
  {house:{x:p.pw*.18,z:-p.pd*.15},garden:{x:-p.pw*.18,z:p.pd*.22},garage:{x:-p.pw*.32,z:-p.pd*.3},bath:{x:p.pw*.3,z:p.pd*.3}},
  {house:{x:-p.pw*.18,z:-p.pd*.15},garden:{x:p.pw*.18,z:p.pd*.22},garage:{x:p.pw*.32,z:-p.pd*.3},bath:{x:-p.pw*.3,z:p.pd*.3}},
  {house:{x:0,z:0},garden:{x:0,z:p.pd*.3},garage:{x:-p.pw*.3,z:-p.pd*.3},bath:{x:p.pw*.3,z:p.pd*.3}}
 ][phase];
 let h=find39({type:'house',name:'Дом',w:p.hw,d:p.hd},a,p,zones.house);if(h)a.push(h);
 if(p.garage){let g=find39({type:'garage',name:p.garage===2?'Гараж на 2 машины':'Гараж',w:p.garage===2?6.2:3.4,d:6.2},a,p,zones.garage);if(g)a.push(g)}
 if(p.bath){let b=find39({type:'bathhouse',name:'Баня',w:5,d:6},a,p,zones.bath);if(b)a.push(b)}
 let pk=find39({type:'parking',name:'Парковка',w:5.5,d:5.2},a,p,{x:-p.pw*.35,z:-p.pd*.35});if(pk)a.push(pk)
 if(p.garden){let gr=find39({type:'garden',name:'Сад',w:Math.max(5,p.pw*.42),d:Math.max(5,p.pd*.28)},a,p,zones.garden);if(gr)a.push(gr)}
 if(h){let t={type:'terrace',name:'Терраса',w:Math.min(7,p.hw*.65),d:3,x:h.x,z:h.z+p.hd/2+1.8};if(ok39(t,a,p))a.push(t)}
 let bbq=find39({type:'bbq',name:'Мангал',w:2.2,d:2.2},a,p,{x:p.pw*.25,z:p.pd*.1});if(bbq)a.push(bbq)
 return {plot:{w:p.pw,d:p.pd},objects:a,seed};
}
function score39(plan){
 const p=plan.plot,issues=[];for(let i=0;i<plan.objects.length;i++){let o=plan.objects[i];if(!in39(o,{pw:p.w,pd:p.d}))issues.push(o.name+' за границей');for(let j=i+1;j<plan.objects.length;j++){let x=plan.objects[j];if(o.type!=='parking'&&x.type!=='parking'&&ov39(o,x))issues.push(o.name+' ↔ '+x.name)}}
 let score=100-issues.length*20;
 const g=plan.objects.find(o=>o.type==='garden');if(g)score+=5;
 const h=plan.objects.find(o=>o.type==='house');if(h&&Math.abs(h.x)<p.w*.3)score+=3;
 const used=plan.objects.reduce((v,o)=>v+o.w*o.d,0);score-=Math.max(0,(used/(p.w*p.d)-.65))*25;
 return {score:Math.max(0,Math.min(100,Math.round(score))),issues,used};
}
function render39(){
 const box=$39('v39Variants');box.innerHTML='';
 v39Plans.forEach((plan,i)=>{const s=score39(plan),sel=i===v39Selected;
  const el=document.createElement('div');el.style.cssText=`border:2px solid ${sel?'#333':'#bbb'};border-radius:10px;padding:10px;background:${sel?'#f1f1f1':'white'}`;
  el.innerHTML=`<b>Вариант ${i+1}</b><br>Технический показатель: <b>${s.score}/100</b><br>Объектов: ${plan.objects.length}<br>Занято: ${Math.round(s.used)} м²<br><button>Выбрать</button>`;
  el.querySelector('button').onclick=()=>{v39Selected=i;render39();$39('v39Status').textContent=`Выбран вариант ${i+1}.`};
  box.appendChild(el);
 });
}
window.domai39Generate=()=>{const p=p39();v39Plans=[];for(let i=0;i<p.n;i++)v39Plans.push(build39(p,i));v39Selected=0;localStorage.setItem('domai_v39_plans',JSON.stringify(v39Plans));render39();$39('v39Status').textContent=`Создано вариантов: ${v39Plans.length}.`};
window.domai39Apply=()=>{if(!v39Plans.length)window.domai39Generate();const plan=v39Plans[v39Selected];localStorage.setItem('domai_v37_state',JSON.stringify(plan));localStorage.setItem('domai_v39_selected',JSON.stringify(plan));$39('v39Status').textContent=`Вариант ${v39Selected+1} сохранён и готов для 3D-редактора.`};
