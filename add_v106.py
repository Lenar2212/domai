from pathlib import Path
p=Path('/mnt/data/v106/frontend/index.html')
s=p.read_text()
insert=r'''
<style>
.a106grid{display:grid;grid-template-columns:340px 1fr;gap:14px}.a106panel{background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:14px}.a106canvas{min-height:560px;background:#e2e8f0;border-radius:12px;overflow:hidden}.a106three{height:560px;border-radius:12px;overflow:hidden;background:#dbeafe}.a106three canvas{display:block;width:100%;height:100%}.a106status{margin-top:10px;padding:10px;background:#eef2ff;border-radius:8px}.a106warn{margin-top:10px;padding:10px;background:#fff7ed;border-left:4px solid #f97316}.a106ok{margin-top:10px;padding:10px;background:#ecfdf5;border-left:4px solid #10b981}.a106table{margin-top:12px;overflow:auto}.a106table table{width:100%;border-collapse:collapse}.a106table th,.a106table td{border:1px solid #cbd5e1;padding:7px;text-align:left}.a106bar{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.a106bar button{padding:7px 10px;border-radius:8px;border:1px solid #94a3b8;background:#fff;cursor:pointer}.a106legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}.a106dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px}.a106dot.electric{background:#eab308}.a106dot.gas{background:#f97316}.a106dot.water{background:#0ea5e9}.a106dot.sewer{background:#64748b}.a106dot.heating{background:#ef4444}.a106dot.riser{background:#8b5cf6}@media(max-width:900px){.a106grid{grid-template-columns:1fr}}
</style>
<section id="domai106" style="margin-top:22px">
<h2>v106 — 3D BIM-координация инженерных сетей</h2>
<p class="muted">Пространственная координация инженерных сетей по этажам: высотные отметки, стояки, уровни прокладки и предварительная проверка 3D-конфликтов.</p>
<div class="a106bar">
<button onclick="d106Build()">▶ Построить 3D</button><button onclick="d106AutoLevels()">↕ Автоуровни</button><button onclick="d106AddRisers()">⇅ Стояки</button><button onclick="d106All()">👁 Все</button><button onclick="d106Report()">Отчёт</button><button onclick="d106Json()">JSON</button>
</div>
<div class="a106grid">
<div class="a106panel">
<h3>Параметры BIM</h3>
<label>Высота этажа, м<input id="d106FloorH" type="number" value="3" step="0.1" min="2"></label>
<label>Электрика, отметка над полом, м<input id="d106ZElectric" type="number" value="2.30" step="0.05" min="0"></label>
<label>Газ, отметка над полом, м<input id="d106ZGas" type="number" value="1.80" step="0.05" min="0"></label>
<label>Вода, отметка над полом, м<input id="d106ZWater" type="number" value="1.00" step="0.05" min="0"></label>
<label>Канализация, отметка над полом, м<input id="d106ZSewer" type="number" value="0.30" step="0.05" min="0"></label>
<label>Отопление, отметка над полом, м<input id="d106ZHeating" type="number" value="0.70" step="0.05" min="0"></label>
<label>Диаметр/радиус трассы для 3D, м<input id="d106Radius" type="number" value="0.035" step="0.005" min="0.005"></label>
<label>Минимальный 3D-разнос, м<input id="d106Sep" type="number" value="0.10" step="0.01" min="0"></label>
<label>Режим конфликтов<select id="d106ConflictMode"><option value="levels">Авторазнос по уровням</option><option value="report">Только контроль</option></select></label>
<div id="d106Status" class="a106status"></div>
<div class="a106legend"><span><i class="a106dot electric"></i>Электрика</span><span><i class="a106dot gas"></i>Газ</span><span><i class="a106dot water"></i>Вода</span><span><i class="a106dot sewer"></i>Канализация</span><span><i class="a106dot heating"></i>Отопление</span><span><i class="a106dot riser"></i>Стояк</span></div>
<div class="a106warn"><b>Ограничение:</b> уровни являются концептуальными. Для рабочего проекта необходимо проверить реальные конструкции, диаметры, уклоны, пожарные и газовые требования, электробезопасность и допустимые зоны прокладки.</div>
</div>
<div class="a106three" id="d106Three"></div>
</div>
<div class="a106table" id="d106Table"></div>
</section>
<script type="module">
import * as THREE106 from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {OrbitControls as OrbitControls106} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
(()=>{
const $=id=>document.getElementById(id);
const names={electric:'Электрика',gas:'Газ',water:'Водоснабжение',sewer:'Канализация',heating:'Отопление'};
const colors={electric:0xeab308,gas:0xf97316,water:0x0ea5e9,sewer:0x64748b,heating:0xef4444,riser:0x8b5cf6};
const levelIds=['sewer','water','heating','gas','electric'];
let data={source:{points:[],routes:[]},routes:[],risers:[],conflicts:[]};
let scene,camera,renderer,controls,group;
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{const x=JSON.parse(localStorage.getItem('domai105_coord')||'null');if(x&&x.routes)return x}catch(e){}return {routes:[],source:{points:[]}}}
function pointById(id){return (data.source.points||[]).find(p=>String(p.id)===String(id))}
function baseLevel(sys){return +$('d106Z'+sys.charAt(0).toUpperCase()+sys.slice(1)).value||0}
function floorOfRoute(r){const a=pointById(r.to)||pointById(r.from);return Number(a?.floor||r.floor||0)}
function zFor(r,p){const f=Number(p?.floor??r.floor??floorOfRoute(r));return f*(+$('d106FloorH').value||3)+baseLevel(r.sys)}
function autoLevels(){
  const h=+$('d106FloorH').value||3;
  const used={};
  for(const sys of levelIds){const el=$('d106Z'+sys.charAt(0).toUpperCase()+sys.slice(1));if(el)el.value=(sys==='sewer'?.30:sys==='water'?1.00:sys==='heating'?.70:sys==='gas'?1.80:2.30).toFixed(2)}
  // If levels are too close, spread non-gravity systems while preserving sewer low level.
  const vals=levelIds.map(s=>({s,z:baseLevel(s)})).sort((a,b)=>a.z-b.z);
  const min=+$('d106Sep').value||.1;
  for(let i=1;i<vals.length;i++) if(vals[i].z-vals[i-1].z<min){vals[i].z=vals[i-1].z+min;const el=$('d106Z'+vals[i].s.charAt(0).toUpperCase()+vals[i].s.slice(1));el.value=vals[i].z.toFixed(2)}
  $('d106Status').innerHTML='Автоуровни назначены: '+vals.map(v=>`${names[v.s]} ${v.z.toFixed(2)} м`).join(' · ');
}
function addRisers(){
  const by={};
  for(const p of data.source.points||[]){const key=`${Math.round((p.x||0)*10)/10}:${Math.round((p.y||0)*10)/10}:${p.sys||''}`;(by[key]??=[]).push(p)}
  const out=[];const h=+$('d106FloorH').value||3;
  for(const key of Object.keys(by)){
    const ps=by[key].sort((a,b)=>(a.floor||0)-(b.floor||0));
    for(let i=1;i<ps.length;i++) if(Number(ps[i].floor||0)!==Number(ps[i-1].floor||0)){
      const p=ps[i], q=ps[i-1]; out.push({id:`riser_${out.length+1}`,sys:p.sys||q.sys||'water',fromFloor:Number(q.floor||0),toFloor:Number(p.floor||0),x:p.x,y:p.y,z1:Number(q.floor||0)*h+baseLevel(p.sys||q.sys||'water'),z2:Number(p.floor||0)*h+baseLevel(p.sys||q.sys||'water')})
    }
  }
  data.risers=out;
}
function p3(p,r){const scale=.025;return new THREE106.Vector3(((p.x||0)-500)*scale,zFor(r,p),((p.y||0)-280)*scale)}
function tube(a,b,sys,radius){const mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b);const g=new THREE106.CylinderGeometry(radius,radius,Math.max(len,.001),8);const m=new THREE106.MeshStandardMaterial({color:colors[sys]||0xffffff});const o=new THREE106.Mesh(g,m);o.position.copy(mid);o.quaternion.setFromUnitVectors(new THREE106.Vector3(0,1,0),b.clone().sub(a).normalize());o.userData.domai106=true;group.add(o)}
function conflict(a,b,min){return a.distanceTo(b)<min}
function build(){
 if(!renderer)init3D(); while(group.children.length)group.remove(group.children[0]); data.conflicts=[];const radius=Math.max(.005,+$('d106Radius').value||.035),sep=Math.max(0,+$('d106Sep').value||.1);
 const segments=[];
 for(const r of data.routes){if(!r.points||r.points.length<2)continue;for(let i=1;i<r.points.length;i++){const a=p3(r.points[i-1],r),b=p3(r.points[i],r);segments.push({a,b,sys:r.sys,id:r.id||r.from+'_'+r.to});tube(a,b,r.sys,radius)}}
 for(const rr of data.risers){const a=new THREE106.Vector3((rr.x-500)*.025,rr.z1,(rr.y-280)*.025),b=new THREE106.Vector3((rr.x-500)*.025,rr.z2,(rr.y-280)*.025);segments.push({a,b,sys:'riser',id:rr.id});tube(a,b,'riser',radius*.9)}
 // Conservative 3D point-to-segment conflict approximation: endpoints/segment midpoints.
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){if(segments[i].sys===segments[j].sys)continue;const s1=segments[i],s2=segments[j];const samples=[s1.a,s1.b,s1.a.clone().add(s1.b).multiplyScalar(.5)];const samples2=[s2.a,s2.b,s2.a.clone().add(s2.b).multiplyScalar(.5)];let hit=false;for(const a of samples)for(const b of samples2)if(conflict(a,b,sep+radius*2))hit=true;if(hit)data.conflicts.push({a:s1.id,b:s2.id,systems:`${s1.sys}/${s2.sys}`,detail:'Предварительный 3D-конфликт'})}
 drawBuilding();
 const sysCount={};for(const r of data.routes)sysCount[r.sys]=(sysCount[r.sys]||0)+1;
 $('d106Status').innerHTML=`Трасс: <b>${data.routes.length}</b> · стояков: <b>${data.risers.length}</b> · 3D-конфликтов: <b>${data.conflicts.length}</b>`;
 let rows='';for(const s of levelIds){const rs=data.routes.filter(r=>r.sys===s),riser=data.risers.filter(r=>r.sys===s);rows+=`<tr><td>${names[s]}</td><td>${rs.length}</td><td>${riser.length}</td><td>${baseLevel(s).toFixed(2)} м</td><td>${data.conflicts.filter(c=>String(c.systems).includes(s)).length}</td></tr>`} $('d106Table').innerHTML=`<table><tr><th>Система</th><th>Трасс</th><th>Стояков</th><th>Уровень</th><th>Конфликты</th></tr>${rows}</table>`;
 localStorage.setItem('domai106_bim',JSON.stringify({version:'v106',settings:{floorHeight:+$('d106FloorH').value,z:{electric:+$('d106ZElectric').value,gas:+$('d106ZGas').value,water:+$('d106ZWater').value,sewer:+$('d106ZSewer').value,heating:+$('d106ZHeating').value},radius,sep},routes:data.routes,risers:data.risers,conflicts:data.conflicts}));
}
function drawBuilding(){const floors=5,h=+$('d106FloorH').value||3;for(let f=0;f<floors;f++){const mat=new THREE106.MeshStandardMaterial({color:0x94a3b8,transparent:true,opacity:.06,side:THREE106.DoubleSide});const floor=new THREE106.Mesh(new THREE106.BoxGeometry(19,.035,10),mat);floor.position.set(0,f*h,0);group.add(floor)}const ground=new THREE106.Mesh(new THREE106.BoxGeometry(24,.08,16),new THREE106.MeshStandardMaterial({color:0xb7c7a8}));ground.position.y=-.04;group.add(ground)}
function init3D(){const host=$('d106Three');scene=new THREE106.Scene();scene.background=new THREE106.Color(0xdbeafe);camera=new THREE106.PerspectiveCamera(45,1,.1,1000);camera.position.set(18,13,22);renderer=new THREE106.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.innerHTML='';host.appendChild(renderer.domElement);controls=new OrbitControls106(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,3,0);scene.add(new THREE106.HemisphereLight(0xffffff,0x667085,2));const l=new THREE106.DirectionalLight(0xffffff,1.5);l.position.set(10,20,10);scene.add(l);group=new THREE106.Group();scene.add(group);const resize=()=>{const w=host.clientWidth||700,h=host.clientHeight||560;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};window.addEventListener('resize',resize);resize();(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(scene,camera)})()}
function report(){const L=['DOMAI v106 — 3D BIM-КООРДИНАЦИЯ ИНЖЕНЕРНЫХ СЕТЕЙ','',`Трасс: ${data.routes.length}`,`Стояков: ${data.risers.length}`,`3D-конфликтов: ${data.conflicts.length}`,''];for(const s of levelIds)L.push(`${names[s]}: уровень ${baseLevel(s).toFixed(2)} м`);for(const c of data.conflicts)L.push(`КОНФЛИКТ: ${c.systems} — ${c.detail}`);L.push('','Результат концептуальный. Не является рабочей проектной документацией.');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\n')],{type:'text/plain;charset=utf-8'}));a.download='DomAI_v106_3d_bim_report.txt';a.click()}
function json(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:'v106',type:'conceptual-3d-bim-engineering-coordination',routes:data.routes,risers:data.risers,conflicts:data.conflicts,levels:{electric:+$('d106ZElectric').value,gas:+$('d106ZGas').value,water:+$('d106ZWater').value,sewer:+$('d106ZSewer').value,heating:+$('d106ZHeating').value}},null,2)],{type:'application/json'}));a.download='DomAI_v106_3d_bim_coordination.json';a.click()}
function init(){data=load();autoLevels();addRisers();build()}window.d106Build=build;window.d106AutoLevels=()=>{autoLevels();addRisers();build()};window.d106AddRisers=()=>{addRisers();build()};window.d106All=()=>build();window.d106Report=report;window.d106Json=json;init();
})();
</script>
'''
idx=s.rfind('</body>')
s=s[:idx]+insert+s[idx:]
p.write_text(s)
