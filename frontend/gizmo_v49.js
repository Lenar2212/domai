
(function(){
let enabled=false,step=0.5,selected=null,drag=false,plane=null,ray=null,mouse=null,offset=null,canvas=null;
const $=id=>document.getElementById(id);
function root(){return window.domai45Root||window.domai43Root||window.root||window.sceneRoot||null}
function cam(){return window.domai47Camera||window.camera||window.domaiCamera||null}
function getCanvas(){return canvas&&canvas.isConnected?canvas:(canvas=document.querySelector("canvas"))}
function getSelected(){return window.domai47GetSelected?.()||null}
function snap(v){return step>0?Math.round(v/step)*step:v}
function pos(){selected=getSelected();return selected}
function point(e){
 const c=getCanvas(),c2=cam();if(!c||!c2||!window.THREE)return null;
 const r=c.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 ray.setFromCamera(mouse,c2);
 if(!plane)plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const p=new THREE.Vector3();return ray.ray.intersectPlane(plane,p)?p:null;
}
function down(e){
 if(!enabled)return;selected=pos();if(!selected)return;
 const p=point(e);if(!p)return;
 drag=true;offset=new THREE.Vector3(p.x-selected.position.x,0,p.z-selected.position.z);
 $("v49Status").textContent="🟢 Перетаскивание активно.";
 e.preventDefault();
}
function move(e){
 if(!drag||!selected)return;const p=point(e);if(!p)return;
 selected.position.x=snap(p.x-offset.x);selected.position.z=snap(p.z-offset.z);
 $("v49Status").textContent=`📍 X ${selected.position.x.toFixed(1)} / Z ${selected.position.z.toFixed(1)} м`;
}
function up(){if(drag){drag=false;localStorage.setItem("domai_v49_position",JSON.stringify({name:selected?.name||"",x:selected?.position.x||0,y:selected?.position.y||0,z:selected?.position.z||0}));$("v49Status").textContent="✓ Позиция сохранена."}}
function attach(){
 const c=getCanvas();if(!c)return;
 c.addEventListener("pointerdown",down);c.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
}
window.domai49Toggle=function(){enabled=!enabled;$("v49Status").textContent=enabled?"🟢 Режим перетаскивания включён.":"⚪ Режим перетаскивания выключен."}
window.domai49Grid=function(){step=.5;$("v49Status").textContent="▦ Привязка к сетке 0.5 м."}
window.domai49Grid1=function(){step=1;$("v49Status").textContent="▦ Привязка к сетке 1 м."}
window.domai49GridOff=function(){step=0;$("v49Status").textContent="▧ Свободное перемещение без привязки."}
window.domai49GetStep=()=>step;
document.addEventListener("DOMContentLoaded",()=>{ray=new THREE.Raycaster();mouse=new THREE.Vector2();setTimeout(attach,1000)});
})();
