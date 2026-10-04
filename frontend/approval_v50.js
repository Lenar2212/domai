
(function(){
const $=id=>document.getElementById(id);
const checks=[
 ["site","Сведения об участке заполнены"],
 ["cadastre","Кадастровые сведения проверены пользователем"],
 ["house","Основные параметры дома заполнены"],
 ["layout","Планировка/этажи сформированы"],
 ["setbacks","Отступы и размещение проверены пользователем"],
 ["utilities","Инженерные подключения указаны/проверены"],
 ["appearance","Фасад и внешний вид выбраны"],
 ["documents","Необходимые исходные документы собраны"],
 ["regional","Требования конкретного региона/муниципалитета проверены"],
 ["engineer","При необходимости привлечён профильный специалист"]
];
function renderChecks(){
 const box=$("v50Checklist"); if(!box)return;
 box.innerHTML=checks.map(([id,t])=>`<label style="display:block;margin:5px 0"><input type="checkbox" id="v50c_${id}"> ${t}</label>`).join("");
}
function val(id){return $(id)?.value||""}
function data(){
 const checked={};checks.forEach(([id])=>checked[id]=!!$(`v50c_${id}`)?.checked);
 const project={
  format:"DomAI-Approval-Preparation-v50",
  createdAt:new Date().toISOString(),
  owner:val("v50Owner"),address:val("v50Address"),cadastre:val("v50Cadastre"),
  region:val("v50Region"),plotArea:Number(val("v50Plot")||0),houseArea:Number(val("v50House")||0),
  floors:Number(val("v50Floors")||1),purpose:val("v50Purpose"),description:val("v50Desc"),
  checklist:checked,
  visualConcept:{
   materialSelection:localStorage.getItem("domai_v46_selection")||null,
   objectMaterial:localStorage.getItem("domai_v47_last_object_material")||null,
   transform:localStorage.getItem("domai_v48_transform")||null,
   position:localStorage.getItem("domai_v49_position")||null
  },
  status:"PRELIMINARY_PREPARATION"
 };
 const done=Object.values(checked).filter(Boolean).length;
 project.readiness={completed:done,total:checks.length,percent:Math.round(done/checks.length*100)};
 return project;
}
function save(){const p=data();localStorage.setItem("domai_v50_project",JSON.stringify(p));return p}
function esc(x){return String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
window.domai50Build=function(){
 const p=save();
 $("v50Status").textContent=`📑 Пакет сформирован. Готовность чек-листа: ${p.readiness.percent}% (${p.readiness.completed}/${p.readiness.total}).`;
}
window.domai50Preview=function(){
 const p=save();
 const w=window.open("","_blank");if(!w){$("v50Status").textContent="Разрешите открытие нового окна для предпросмотра.";return}
 const rows=[
 ["Заказчик",p.owner],["Адрес участка",p.address],["Кадастровый номер",p.cadastre],
 ["Регион",p.region],["Площадь участка",p.plotArea+" м²"],["Площадь дома",p.houseArea+" м²"],
 ["Этажность",p.floors],["Назначение",p.purpose],["Готовность чек-листа",p.readiness.percent+"%"]
 ].map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td></tr>`).join("");
 const cl=checks.map(([id,t])=>`<li>${p.checklist[id]?"☑":"☐"} ${esc(t)}</li>`).join("");
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>DomAI — подготовительный пакет</title><style>body{font:14px Arial;margin:35px;line-height:1.45}h1{font-size:24px}table{border-collapse:collapse;width:100%}td{border:1px solid #bbb;padding:7px}.warn{padding:12px;background:#fff3cd;border:1px solid #e1c46a;margin:15px 0}@media print{button{display:none}}</style></head><body>
 <h1>DomAI — подготовительный пакет проекта</h1>
 <div class="warn"><b>Статус:</b> концептуальная/предварительная документация для подготовки к дальнейшему согласованию. Не является гарантированно принимаемой официальной проектной документацией.</div>
 <h2>1. Сведения об объекте</h2><table>${rows}</table>
 <h2>2. Описание</h2><p>${esc(p.description)||"Не заполнено"}</p>
 <h2>3. Чек-лист</h2><ul>${cl}</ul>
 <h2>4. Визуальная концепция</h2><p>Включает сохранённые параметры материалов, трансформаций и положения 3D-объектов из DomAI.</p>
 <h2>5. Следующий этап</h2><p>Проверить актуальные требования уполномоченного органа для конкретного участка и при необходимости передать материалы профильному проектировщику/специалисту.</p>
 <button onclick="print()">Печать / Сохранить в PDF</button>
 </body></html>`);
 w.document.close();
}
window.domai50Download=function(){
 const p=save();const blob=new Blob([JSON.stringify(p,null,2)],{type:"application/json;charset=utf-8"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="DomAI_Approval_Preparation_Project.json";a.click();URL.revokeObjectURL(a.href);
 $("v50Status").textContent="⬇️ JSON-пакет проекта скачан.";
}
window.domai50Print=function(){domai50Preview()}
document.addEventListener("DOMContentLoaded",()=>{
 renderChecks();
 try{
  const p=JSON.parse(localStorage.getItem("domai_v50_project")||"null");
  if(p){["Owner","Address","Cadastre","Plot","House","Floors","Purpose","Region","Desc"].forEach(k=>{const map={Owner:"owner",Address:"address",Cadastre:"cadastre",Plot:"plotArea",House:"houseArea",Floors:"floors",Purpose:"purpose",Region:"region",Desc:"description"};if($(("v50"+k)))$(("v50"+k)).value=p[map[k]]??""});
   checks.forEach(([id])=>{if(p.checklist?.[id])$("v50c_"+id).checked=true});
  }
 }catch(e){}
});
})();
