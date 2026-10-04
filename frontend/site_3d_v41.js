
const V41_DEFAULT={
 facade:"#d8b28d",roof:"#9b5947",windows:"#78a9c4",doors:"#76513b",
 gates:"#555555",fence:"#777777",grass:"#86ad70",trees:"#4e8d4d",fenceStyle:"solid"
};
const v41q=id=>document.getElementById(id);
function v41Get(){
 return {facade:v41q("v41Facade").value,roof:v41q("v41Roof").value,windows:v41q("v41Windows").value,
 doors:v41q("v41Doors").value,gates:v41q("v41Gates").value,fence:v41q("v41Fence").value,
 grass:v41q("v41Grass").value,trees:v41q("v41Trees").value,fenceStyle:v41q("v41FenceStyle").value};
}
function v41Set(x){
 Object.entries(x).forEach(([k,v])=>{const e=v41q("v41"+k.charAt(0).toUpperCase()+k.slice(1));if(e)e.value=v});
}
function v41Style(){try{return JSON.parse(localStorage.getItem("domai_v41_style")||"null")||V41_DEFAULT}catch(e){return V41_DEFAULT}}
window.domai41Apply=()=>{
 const style=v41Get();localStorage.setItem("domai_v41_style",JSON.stringify(style));
 window.dispatchEvent(new CustomEvent("domai41style",{detail:style}));
 v41q("v41Status").textContent="🎨 Стиль применён к текущей концепции и сохранён.";
};
window.domai41Random=()=>{
 const sets={
  v41Facade:["#d8b28d","#f2eee5","#d9d0c1","#b8794f","#9f8b72","#7b6a5a","#d7d1c5"],
  v41Roof:["#9b5947","#343a40","#4b5563","#263b2a","#6b4f3a","#b9b9b9"],
  v41Windows:["#78a9c4","#d9eef7","#334155","#f3e7c9"],
  v41Doors:["#76513b","#222222","#8b4513","#5b7055","#e5e5e5"],
  v41Gates:["#555555","#222222","#777777","#76513b","#f1f1f1"],
  v41Fence:["#777777","#222222","#d8d0c0","#76513b","#4f6250"],
  v41Grass:["#86ad70","#5e9652","#789c62","#a6b879","#4f7d48"],
  v41Trees:["#4e8d4d","#2f6b3b","#789b45","#6f5b3e"],
  v41FenceStyle:["solid","slat","wood","mesh"]
 };
 for(const [id,a] of Object.entries(sets))v41q(id).value=a[Math.floor(Math.random()*a.length)];
 domai41Apply();v41q("v41Status").textContent="✨ Создан случайный стиль.";
};
window.domai41Reset=()=>{v41Set(V41_DEFAULT);domai41Apply();v41q("v41Status").textContent="↺ Стиль сброшен.";
};
window.domai41Save=()=>{const x=v41Get();localStorage.setItem("domai_v41_style",JSON.stringify(x));v41q("v41Status").textContent="💾 Стиль сохранён.";
};
document.addEventListener("DOMContentLoaded",()=>{setTimeout(()=>v41Set(v41Style()),400)});
