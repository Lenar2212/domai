
(function(){
const $=id=>document.getElementById(id);
let selected=null, baseScale=null;
function get(){return window.domai47GetSelected?.()||null}
function bounds(o){
 const b=new THREE.Box3().setFromObject(o);const v=new THREE.Vector3();b.getSize(v);return v;
}
function read(){
 selected=get(); if(!selected){$("v48Status").textContent="Сначала выберите объект в v47.";return}
 const b=bounds(selected);
 $("v48X").value=(selected.position.x||0).toFixed(2);
 $("v48Y").value=(selected.position.y||0).toFixed(2);
 $("v48Z").value=(selected.position.z||0).toFixed(2);
 $("v48W").value=Math.max(.1,b.x).toFixed(2);
 $("v48H").value=Math.max(.1,b.y).toFixed(2);
 $("v48D").value=Math.max(.1,b.z).toFixed(2);
 $("v48R").value=((selected.rotation.y||0)*180/Math.PI).toFixed(0);
 baseScale=selected.scale.clone();
 $("v48Status").textContent="Объект считан: "+(selected.name||"3D-объект");
}
function apply(){
 selected=get();if(!selected){$("v48Status").textContent="Сначала выберите объект.";return}
 const x=+$("v48X").value||0,y=+$("v48Y").value||0,z=+$("v48Z").value||0;
 const w=Math.max(.1,+$("v48W").value||1),h=Math.max(.1,+$("v48H").value||1),d=Math.max(.1,+$("v48D").value||1);
 selected.position.set(x,y,z);selected.rotation.y=(+$("v48R").value||0)*Math.PI/180;
 const old=bounds(selected);
 if(old.x>0&&old.y>0&&old.z>0){
   selected.scale.x*=w/old.x;selected.scale.y*=h/old.y;selected.scale.z*=d/old.z;
 }
 localStorage.setItem("domai_v48_transform",JSON.stringify({name:selected.name||"",x,y,z,w,h,d,r:+$("v48R").value||0}));
 $("v48Status").textContent="✓ Трансформация применена.";
}
function reset(){
 selected=get();if(!selected){$("v48Status").textContent="Сначала выберите объект.";return}
 selected.position.set(0,0,0);selected.rotation.set(0,0,0);selected.scale.set(1,1,1);
 read();$("v48Status").textContent="↺ Трансформация сброшена.";
}
window.domai48Read=read;window.domai48Apply=apply;window.domai48Reset=reset;
["v48X","v48Y","v48Z","v48W","v48H","v48D","v48R"].forEach(id=>{
 document.addEventListener("input",e=>{if(e.target.id===id&&get())apply()});
});
window.addEventListener("domai47selected",()=>setTimeout(read,30));
})();
