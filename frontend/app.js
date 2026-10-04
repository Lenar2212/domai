let project={id:null,name:'',rooms:[]};const API='http://localhost:8000';
function check(){if(!legal.checked||!privacy.checked){alert('Для работы подтвердите оба пункта.');return false}return true}
function parse(t){let m=t.match(/(\d+(?:[.,]\d+)?)\s*м²/);let area=m?+m[1].replace(',','.'):180;let b=t.match(/(\d+)\s*спаль/i),n=b?+b[1]:3;let rooms=[];for(let i=0;i<n;i++)rooms.push({name:'Спальня '+(i+1),area:18});rooms.push({name:'Кухня-гостиная',area:35});return {area,rooms}}
function render(){json.textContent=JSON.stringify(project,null,2)}
async function newProject(){if(!check())return;let x=parse(prompt.value);project={id:null,name:name.value,rooms:x.rooms,area:x.area,classification:'Эскизный вариант'};render();log.textContent='Эскиз создан. Проверка специалистом обязательна перед строительством.'}
async function save(){if(!check())return;let r=await fetch(API+'/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(project)});project=await r.json();render();log.textContent='Сохранено.'}
async function editProject(){if(!check())return;let r=await fetch(API+'/api/projects/edit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,instruction:cmd.value})});let x=await r.json();project=x.project;render();log.textContent=x.message+' '+x.warning}
function log(x){document.getElementById('log').textContent=x}
newProject()


window.saveV24Project=async()=>{
 try{
   const name=document.getElementById('projectName').value||'Мой проект';
   const x=await req('/api/projects/save',{name,project:{house,finish:finishLevel.value,region:document.getElementById('priceRegion')?.value||'Москва'}});
   alert('Проект сохранён: #'+x.id);
 }catch(e){alert('Сохранение: '+e.message)}
};
window.loadV24Projects=async()=>{
 try{
   const xs=await req('/api/projects');
   document.getElementById('projectsBox').innerHTML=xs.length?xs.map(p=>`<div>📁 <b>${p.name}</b> #${p.id} — ${p.updated_at}</div>`).join(''):'Проектов пока нет.';
 }catch(e){alert('Проекты: '+e.message)}
};
window.loadV24Favorites=async()=>{
 try{
   const xs=await req('/api/favorites');
   document.getElementById('favoritesBox').innerHTML=xs.length?xs.map(p=>`⭐ ${p.material_id} — ${p.created_at}`).join('<br>'):'Избранных материалов пока нет.';
 }catch(e){alert('Избранное: '+e.message)}
};
window.favoriteMaterial=async(id)=>{
 try{await req('/api/favorites/toggle',{material_id:id});loadV24Favorites()}catch(e){alert(e.message)}
};
window.loadV24PriceHistory=async()=>{
 try{
   const xs=await req('/api/price-history');
   document.getElementById('priceHistoryBox').innerHTML=xs.length?
     `<table style="width:100%"><tr><th>Материал</th><th>Поставщик</th><th>Цена</th><th>Дата</th></tr>`+
     xs.map(p=>`<tr><td>${p.material_id}</td><td>${p.supplier_id}</td><td>${Number(p.price).toLocaleString('ru-RU')} ₽</td><td>${p.checked_at}</td></tr>`).join('')+
     '</table>':'История пока пуста.';
 }catch(e){alert('История: '+e.message)}
};


window.buildCommercialProject=async()=>{
 try{
   const p={name:document.getElementById('commercialName').value||'Мой дом',
     plot:{w:Number(document.getElementById('plotW').value||20),d:Number(document.getElementById('plotD').value||30)},
     house:{w:Number(document.getElementById('houseW').value||10),h:Number(document.getElementById('houseD').value||10),floors:Number(document.getElementById('houseFloors').value||2)},
     finish:document.getElementById('finishLevel')?.value||'standard',
     region:document.getElementById('priceRegion')?.value||'Москва'};
   window.commercialProject=p;
   const save=await req('/api/projects/save',{name:p.name,project:p});
   p.project_id=save.id; window.commercialProject=p;
   const report=await req('/api/report',{project:p});
   document.getElementById('commercialBox').innerHTML=
     `<b>Проект #${save.id}</b><br>Участок: ${p.plot.w}×${p.plot.d} м<br>`+
     `Дом: ${p.house.w}×${p.house.h} м, ${p.house.floors} этажа<br>`+
     `Площадь этажей: ${report.calculated_area_m2} м²<br><span class="muted">${report.disclaimer}</span>`;
 }catch(e){alert('Проект: '+e.message)}
};
window.downloadCommercialReport=()=>{
 const p=window.commercialProject;
 if(!p){alert('Сначала соберите проект');return}
 const r={generated_at:new Date().toISOString(),...p,
   disclaimer:'Концептуальный отчёт. Не является рабочей проектной документацией, строительной сметой, инженерными изысканиями или разрешением на строительство.'};
 const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);
 a.download=(p.name||'DomAI_project').replace(/[^a-zA-Zа-яА-Я0-9_-]/g,'_')+'.json';a.click();
};
window.sendCommercialLead=async()=>{
 try{
   const p=window.commercialProject||{};
   const x=await req('/api/lead',{project:{project_id:p.project_id},name:document.getElementById('leadName').value,
      phone:document.getElementById('leadPhone').value,email:document.getElementById('leadEmail').value,
      comment:document.getElementById('leadComment').value});
   document.getElementById('leadBox').innerHTML=`Заявка №${x.lead_id} сохранена.`;
 }catch(e){alert('Заявка: '+e.message)}
};


window.downloadPDFOffer=async()=>{
 try{
   const p=window.commercialProject;
   if(!p){alert('Сначала соберите проект');return}
   const res=await fetch((window.API_BASE||'http://localhost:8080')+'/api/pdf-offer',{
     method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:p})
   });
   if(!res.ok) throw new Error('PDF: '+res.status);
   const blob=await res.blob();
   const u=URL.createObjectURL(blob); const a=document.createElement('a');
   a.href=u;a.download=(p.name||'DomAI_offer').replace(/[^a-zA-Zа-яА-Я0-9_-]/g,'_')+'.pdf';a.click();
   setTimeout(()=>URL.revokeObjectURL(u),1000);
 }catch(e){alert('PDF: '+e.message)}
};

window.downloadVisualPDF=async()=>{
 try{
   const p=window.commercialProject;
   if(!p){alert('Сначала соберите проект');return}
   const res=await fetch((window.API_BASE||'http://localhost:8080')+'/api/visual-pdf-offer',{
     method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:p})
   });
   if(!res.ok) throw new Error('PDF: '+res.status);
   const blob=await res.blob(), u=URL.createObjectURL(blob), a=document.createElement('a');
   a.href=u;a.download=(p.name||'DomAI_visual_offer').replace(/[^a-zA-Zа-яА-Я0-9_-]/g,'_')+'.pdf';a.click();
   setTimeout(()=>URL.revokeObjectURL(u),1000);
 }catch(e){alert('PDF: '+e.message)}
};
