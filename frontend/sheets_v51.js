
(function(){
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function project(){
 let p={};
 try{p=JSON.parse(localStorage.getItem("domai_v50_project")||"{}")}catch(e){}
 return p;
}
function canvasSnapshot(){
 const c=document.querySelector("canvas");
 return c?c.toDataURL("image/png"):null;
}
function collect(){
 const p=project();
 return {
  format:"DomAI-Project-Sheets-v51",
  createdAt:new Date().toISOString(),
  title:"Предварительный комплект проекта дома",
  object:{
   owner:p.owner||"",
   address:p.address||"",
   cadastre:p.cadastre||"",
   region:p.region||"",
   plotArea:p.plotArea||0,
   houseArea:p.houseArea||0,
   floors:p.floors||1,
   purpose:p.purpose||"",
   description:p.description||""
  },
  sheets:[
   {no:"01",code:"ТЛ",name:"Титульный лист"},
   {no:"02",code:"СП",name:"Ситуационный план / исходные сведения"},
   {no:"03",code:"ГП",name:"Генеральный план участка"},
   {no:"04",code:"ПЛ-01",name:"План первого этажа"},
   {no:"05",code:"ПЛ-02",name:"План второго этажа"},
   {no:"06",code:"ФС",name:"Фасады"},
   {no:"07",code:"Р-01",name:"Концептуальный разрез"},
   {no:"08",code:"3D",name:"3D-визуализация"},
   {no:"09",code:"ЭКС",name:"Экспликация помещений"},
   {no:"10",code:"ВП",name:"Ведомость основных параметров"}
  ],
  visual:{canvas:canvasSnapshot(),materials:localStorage.getItem("domai_v46_selection")||null,transform:localStorage.getItem("domai_v48_transform")||null,position:localStorage.getItem("domai_v49_position")||null},
  disclaimer:"Предварительный концептуальный комплект. Не является гарантированно принимаемой официальной проектной документацией."
 };
}
function sheet(n,title,body){
 return `<section class="sheet"><div class="sheethead"><span>DOMAI</span><b>${n}</b></div><h1>${title}</h1>${body}<div class="foot">DomAI • предварительная концепция • ${new Date().toLocaleDateString()}</div></section>`;
}
function svgPlan(p){
 return `<svg viewBox="0 0 700 420" style="width:100%;border:1px solid #aaa;background:#fafafa">
 <rect x="50" y="45" width="600" height="330" fill="#edf3e8" stroke="#666"/>
 <rect x="220" y="115" width="260" height="150" fill="#ddd" stroke="#222" stroke-width="3"/>
 <rect x="245" y="140" width="90" height="55" fill="#fff" stroke="#555"/>
 <rect x="345" y="140" width="110" height="55" fill="#fff" stroke="#555"/>
 <rect x="245" y="205" width="90" height="35" fill="#fff" stroke="#555"/>
 <rect x="345" y="205" width="110" height="35" fill="#fff" stroke="#555"/>
 <text x="350" y="95" text-anchor="middle" font-size="18">Дом</text>
 <text x="290" y="173" text-anchor="middle" font-size="12">Комната</text>
 <text x="400" y="173" text-anchor="middle" font-size="12">Комната</text>
 <text x="290" y="228" text-anchor="middle" font-size="12">Холл</text>
 <text x="400" y="228" text-anchor="middle" font-size="12">Кухня</text>
 <path d="M90 335 L180 335" stroke="#333" stroke-width="5"/><text x="135" y="325" text-anchor="middle" font-size="12">въезд</text>
 </svg>`;
}
function htmlPack(p){
 const o=p.object;
 const rows=`<table><tr><td>Заказчик</td><td>${esc(o.owner)}</td></tr><tr><td>Адрес</td><td>${esc(o.address)}</td></tr><tr><td>Кадастровый номер</td><td>${esc(o.cadastre)}</td></tr><tr><td>Регион</td><td>${esc(o.region)}</td></tr><tr><td>Площадь участка</td><td>${o.plotArea} м²</td></tr><tr><td>Площадь дома</td><td>${o.houseArea} м²</td></tr><tr><td>Этажность</td><td>${o.floors}</td></tr><tr><td>Назначение</td><td>${esc(o.purpose)}</td></tr></table>`;
 const sheets=[];
 sheets.push(sheet("01","Титульный лист",`<h2>${esc(o.purpose||"Дом")}</h2>${rows}<p>${esc(o.description)}</p>`));
 sheets.push(sheet("02","Ситуационный план / исходные сведения",`<p>Участок: ${esc(o.address)}</p><p>Кадастровые сведения: ${esc(o.cadastre)||"не заполнены"}</p><p>Регион: ${esc(o.region)}</p><div class="notice">Точные границы участка и градостроительные ограничения должны быть подтверждены по исходным официальным данным.</div>`));
 sheets.push(sheet("03","Генеральный план участка",`<p>Концептуальная схема размещения дома на участке.</p>${svgPlan(p)}<p>Площадь участка: ${o.plotArea||"—"} м².</p>`));
 for(let i=1;i<=Math.max(1,Number(o.floors)||1);i++) sheets.push(sheet(String(3+i).padStart(2,"0"),`План ${i}-го этажа`,`<p>Концептуальный план этажа. Геометрия и помещения должны быть проверены и уточнены перед официальным проектированием.</p>${svgPlan(p)}`));
 sheets.push(sheet("06","Фасады",`<div class="facades"><div>Главный фасад</div><div>Боковой фасад</div><div>Дворовый фасад</div><div>Боковой фасад</div></div><p>Материалы фасада: по сохранённому оформлению DomAI.</p>`));
 sheets.push(sheet("07","Концептуальный разрез",`<svg viewBox="0 0 700 350" style="width:100%;border:1px solid #aaa"><path d="M150 280V130L350 55 550 130V280" fill="#eee" stroke="#222" stroke-width="4"/><path d="M150 215H550M150 280H550" stroke="#555" stroke-width="3"/><text x="350" y="205" text-anchor="middle">Этаж</text><text x="350" y="270" text-anchor="middle">Фундамент / основание — концептуально</text></svg>`));
 let img=p.visual.canvas?`<img src="${p.visual.canvas}" style="max-width:100%;max-height:430px;border:1px solid #aaa">`:"<p>3D-кадр недоступен до открытия сцены.</p>";
 sheets.push(sheet("08","3D-визуализация",`${img}<p>Визуализация предназначена для представления архитектурной концепции.</p>`));
 sheets.push(sheet("09","Экспликация помещений",`<table><tr><th>№</th><th>Помещение</th><th>Площадь</th></tr><tr><td>1</td><td>Холл</td><td>—</td></tr><tr><td>2</td><td>Кухня</td><td>—</td></tr><tr><td>3</td><td>Жилая комната</td><td>—</td></tr><tr><td>4</td><td>Санузел</td><td>—</td></tr></table><p>Точные площади должны формироваться из окончательной геометрии помещений.</p>`));
 sheets.push(sheet("10","Ведомость основных параметров",`<table><tr><td>Площадь участка</td><td>${o.plotArea||"—"} м²</td></tr><tr><td>Площадь дома</td><td>${o.houseArea||"—"} м²</td></tr><tr><td>Этажность</td><td>${o.floors}</td></tr><tr><td>Назначение</td><td>${esc(o.purpose)}</td></tr></table><div class="notice">${esc(p.disclaimer)}</div>`));
 return sheets.join("");
}
function openPack(){
 const p=collect();localStorage.setItem("domai_v51_project_sheets",JSON.stringify(p));
 const w=window.open("","_blank");if(!w)return;
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>DomAI v51 — комплект листов</title><style>
 body{margin:0;background:#ddd;font:14px Arial;color:#222}.sheet{box-sizing:border-box;width:210mm;min-height:297mm;margin:10mm auto;padding:16mm;background:#fff;position:relative;page-break-after:always}.sheethead{display:flex;justify-content:space-between;border-bottom:1px solid #222;padding-bottom:6px}.foot{position:absolute;bottom:8mm;left:16mm;right:16mm;border-top:1px solid #aaa;padding-top:4px;font-size:10px}.notice{padding:12px;background:#fff3cd;border:1px solid #d5b65c;margin:15px 0}table{border-collapse:collapse;width:100%;margin:12px 0}td,th{border:1px solid #aaa;padding:7px;text-align:left}.facades{display:grid;grid-template-columns:1fr 1fr;gap:10px}.facades div{height:150px;border:2px solid #777;display:flex;align-items:center;justify-content:center;background:linear-gradient(#ddd,#aaa)}button{padding:10px 16px;margin:10px}@media print{body{background:#fff}.sheet{margin:0;width:210mm;min-height:297mm}button{display:none}}</style></head><body>${htmlPack(p)}<button onclick="print()">Печать / сохранить PDF</button></body></html>`);
 w.document.close();
}
window.domai51Build=function(){const p=collect();localStorage.setItem("domai_v51_project_sheets",JSON.stringify(p));$("v51Status").textContent=`📚 Сформировано ${p.sheets.length} листов предварительного проекта.`}
window.domai51Preview=openPack;window.domai51Print=openPack;
window.domai51Download=function(){const p=collect();const b=new Blob([JSON.stringify(p,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="DomAI_v51_Project_Sheets.json";a.click();URL.revokeObjectURL(a.href);$("v51Status").textContent="⬇️ JSON-комплект скачан."}
})();
