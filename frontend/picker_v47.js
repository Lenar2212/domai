
(function(){
let enabled=false, selected=null, oldEmissive=null, oldColor=null, ray=null, mouse=null, canvas=null;
const $=id=>document.getElementById(id);
function root(){return window.domai45Root||window.domai43Root||window.root||window.sceneRoot||null}
function label(o){
 const z=((o?.name||"")+" "+((o?.userData&&o.userData.type)||"")).toLowerCase();
 if(/roof|кров|кры/.test(z))return "Крыша";
 if(/fence|забор|ограж/.test(z))return "Забор";
 if(/window|окн/.test(z))return "Окно";
 if(/door|двер/.test(z))return "Дверь";
 if(/gate|ворот/.test(z))return "Ворота";
 if(/wall|house|facade|стен|дом|фасад/.test(z))return "Фасад/стена";
 return o?.name||"3D-объект";
}
function restore(){
 if(!selected)return;
 if(selected.material){
   const m=Array.isArray(selected.material)?selected.material[0]:selected.material;
   if(oldEmissive && m.emissive)m.emissive.copy(oldEmissive);
   if(oldColor && m.color)m.color.copy(oldColor);
 }
}
function select(o){
 restore();selected=o;
 const m=o.material;
 const mm=Array.isArray(m)?m[0]:m;
 if(mm){
   oldEmissive=mm.emissive?mm.emissive.clone():null;
   oldColor=mm.color?mm.color.clone():null;
   if(mm.emissive)mm.emissive.set("#33aaff");
   else if(mm.color)mm.color.set("#66bfff");
 }
 $("v47Selected").textContent=`🎯 Выбрано: ${label(o)}${o.name?" — "+o.name:""}`;
 window.dispatchEvent(new CustomEvent("domai47selected",{detail:{object:o,type:label(o)}}));
}
function findCanvas(){
 if(canvas&&canvas.isConnected)return canvas;
 canvas=document.querySelector("canvas");
 return canvas;
}
function onMove(e){
 if(!enabled)return;
 const c=findCanvas();if(!c)return;
 const r=c.getBoundingClientRect();
 mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
}
function onClick(e){
 if(!enabled)return;
 const r=root();const c=findCanvas();if(!r||!c||!window.THREE)return;
 const rect=c.getBoundingClientRect();
 mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
 mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
 if(!ray)ray=new THREE.Raycaster();
 ray.setFromCamera(mouse,window.domai47Camera||window.camera);
 const hits=ray.intersectObjects(r.children,true);
 if(hits.length)select(hits[0].object);
}
function attach(){
 const c=findCanvas();if(!c)return;
 c.addEventListener("pointermove",onMove);
 c.addEventListener("click",onClick);
 $("v47Hint").textContent="🟢 Выбор активен. Кликайте по элементам 3D-модели.";
}
window.domai47Enable=function(){enabled=true;attach();$("v47Selected").textContent="🖱️ Режим выбора включён."}
window.domai47Clear=function(){restore();selected=null;$("v47Selected").textContent="Объект не выбран."}
window.domai47GetSelected=function(){return selected}
document.addEventListener("DOMContentLoaded",()=>setTimeout(attach,800));
})();
