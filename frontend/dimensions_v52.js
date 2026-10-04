
(function(){
const $=id=>document.getElementById(id);
const get=()=>({L:+$("v52L").value||10,W:+$("v52W").value||8,wall:+$("v52Wall").value||300,H:+$("v52H").value||3});
function save(){const p=get();localStorage.setItem("domai_v52_dimensions",JSON.stringify(p));return p}
function dim(x1,y1,x2,y2,text,offset=0){
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
 const a=[x1+nx*offset,y1+ny*offset],b=[x2+nx*offset,y2+ny*offset];
 return `<g stroke="#222" fill="#222" font-size="12"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><line x1="${a[0]-ny*5}" y1="${a[1]+nx*5}" x2="${a[0]+ny*5}" y2="${a[1]-nx*5}"/><line x1="${b[0]-ny*5}" y1="${b[1]+nx*5}" x2="${b[0]+ny*5}" y2="${b[1]-nx*5}"/><text x="${(a[0]+b[0])/2+nx*10}" y="${(a[1]+b[1])/2+ny*10}" text-anchor="middle">${text}</text></g>`;
}
function plan(p){
 const S=45,scale=42,x=170,y=110,w=p.L*scale,h=p.W*scale;
 const rw=w*.45,rh=h*.55;
 return `<svg viewBox="0 0 760 560" style="width:100%;border:1px solid #999;background:#fff">
 <defs><marker id="arr52" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"/></marker></defs>
 <g stroke="#888" stroke-dasharray="5 5"><line x1="${x}" y1="35" x2="${x}" y2="500"/><line x1="${x+w}" y1="35" x2="${x+w}" y2="500"/><line x1="60" y1="${y}" x2="700" y2="${y}"/><line x1="60" y1="${y+h}" x2="700" y2="${y+h}"/></g>
 <text x="${x}" y="28" text-anchor="middle">A</text><text x="${x+w}" y="28" text-anchor="middle">B</text><text x="45" y="${y}" text-anchor="middle">1</text><text x="45" y="${y+h}" text-anchor="middle">2</text>
 <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eee" stroke="#111" stroke-width="4"/>
 <line x1="${x+rw}" y1="${y}" x2="${x+rw}" y2="${y+h}" stroke="#333" stroke-width="2"/>
 <line x1="${x+rw}" y1="${y+rh}" x2="${x+w}" y2="${y+rh}" stroke="#333" stroke-width="2"/>
 <rect x="${x+rw-4}" y="${y+h*.35}" width="8" height="70" fill="#9bd"/><rect x="${x+w*.70}" y="${y-4}" width="70" height="8" fill="#9bd"/>
 <rect x="${x+w*.72}" y="${y+h-4}" width="70" height="8" fill="#9bd"/>
 <path d="M${x+rw/2} ${y+h} A45 45 0 0 1 ${x+rw+45} ${y+h-45}" fill="none" stroke="#a66"/>
 <text x="${x+rw/2}" y="${y+rh/2}" text-anchor="middle" font-size="14">Комната<br>${(p.L*.45*p.W*.55).toFixed(1)} м²</text>
 <text x="${x+(rw+w)/2}" y="${y+rh*.45}" text-anchor="middle" font-size="14">Кухня-гостиная<br>${((p.L-rw/scale)*p.W*rh/h).toFixed(1)} м²</text>
 <text x="${x+(rw+w)/2}" y="${y+rh+(h-rh)/2}" text-anchor="middle" font-size="14">Спальня / холл</text>
 ${dim(x,y+h+35,x+w,y+h+35,p.L.toFixed(1)+" м",0)}
 ${dim(x+w+45,y,x+w+45,y+h,p.W.toFixed(1)+" м",0)}
 ${dim(x,y-30,x+rw,y-30,(rw/scale).toFixed(1)+" м",0)}
 <text x="${x+w/2}" y="${y+h+85}" text-anchor="middle" font-size="11">Размеры концептуальные</text>
 </svg>`;
}
function report(){
 const p=save();
 return `<!doctype html><html><head><meta charset="utf-8"><title>DomAI v52 — размерный чертёж</title>
 <style>body{font:14px Arial;margin:0;background:#ddd}.sheet{box-sizing:border-box;width:210mm;min-height:297mm;background:#fff;margin:10mm auto;padding:14mm;page-break-after:always}.head{border-bottom:1px solid #222;padding-bottom:6px;display:flex;justify-content:space-between}.note{background:#fff3cd;border:1px solid #d3b85b;padding:10px;margin:12px 0}table{border-collapse:collapse;width:100%}td{border:1px solid #aaa;padding:6px}@media print{body{background:#fff}.sheet{margin:0}}button{padding:10px;margin:10px}</style></head><body>
 <section class="sheet"><div class="head"><b>DOMAI</b><b>52</b></div><h1>План с размерами</h1><table><tr><td>Длина</td><td>${p.L} м</td></tr><tr><td>Ширина</td><td>${p.W} м</td></tr><tr><td>Толщина стены</td><td>${p.wall} мм</td></tr><tr><td>Высота этажа</td><td>${p.H} м</td></tr></table><div class="note">Все размеры на этом листе являются концептуальными и должны быть проверены по окончательной геометрии и исходным данным участка.</div>${plan(p)}</section>
 <section class="sheet"><div class="head"><b>DOMAI</b><b>52-02</b></div><h1>Ведомость размеров и площадей</h1><table><tr><td>Габариты здания</td><td>${p.L} × ${p.W} м</td></tr><tr><td>Пятно застройки</td><td>${(p.L*p.W).toFixed(1)} м²</td></tr><tr><td>Периметр</td><td>${(2*(p.L+p.W)).toFixed(1)} м</td></tr><tr><td>Толщина стены</td><td>${p.wall} мм</td></tr><tr><td>Высота этажа</td><td>${p.H} м</td></tr></table><h2>Элементы</h2><ul><li>Оси A–B / 1–2</li><li>Оконные проёмы — концептуально</li><li>Дверной проём — концептуально</li><li>Размерные цепочки — наружные и внутренние</li></ul><div class="note">Это не рабочий архитектурный или конструктивный чертёж.</div></section>
 <button onclick="print()">Печать / сохранить PDF</button></body></html>`;
}
window.domai52Generate=function(){const p=save();$("v52Status").textContent=`📐 Размерный комплект создан: ${p.L} × ${p.W} м, площадь ${(p.L*p.W).toFixed(1)} м².`}
window.domai52Preview=function(){const w=window.open("","_blank");if(!w){$("v52Status").textContent="Разрешите новое окно.";return}w.document.write(report());w.document.close()}
window.domai52Print=window.domai52Preview;
window.domai52Save=function(){save();$("v52Status").textContent="💾 Параметры сохранены."}
document.addEventListener("DOMContentLoaded",()=>{try{const p=JSON.parse(localStorage.getItem("domai_v52_dimensions")||"null");if(p)Object.entries(p).forEach(([k,v])=>{const e=$("v52"+k[0].toUpperCase()+k.slice(1));if(e)e.value=v})}catch(e){}});
})();
