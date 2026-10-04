
const V43_DEFAULT={facade:"#d8b28d",roof:"#9b5947",windows:"#78a9c4",doors:"#76513b",gates:"#555555",fence:"#777777",grass:"#86ad70",trees:"#4e8d4d"};
const q43=id=>document.getElementById(id);
function style43(){
 try{
  const x=JSON.parse(localStorage.getItem("domai_v41_style")||"null")||{};
  const m=JSON.parse(localStorage.getItem("domai_v42_materials")||"null")||{};
  return {...V43_DEFAULT,...x};
 }catch(e){return V43_DEFAULT}
}
function materialColor43(cat,id){
 const map={
 facade:{plaster:"#d8cbb7",brick:"#a95f45",wood:"#9a6b43",stone:"#8c8b84",siding:"#a9adb0"},
 roof:{metal:"#4c5560",soft:"#30343a",tile:"#9b5947",green:"#31513b"},
 fence:{profile:"#59636b",picket:"#8a6747",wood:"#76513b",mesh:"#62686b"},
 window:{clear:"#9ed2e8",dark:"#283746",warm:"#ead7a4"},
 door:{oak:"#8b5a36",graphite:"#292d31",white:"#e4e0d6"},
 gate:{graphite:"#363b40",wood:"#76513b",white:"#d9d9d4"}
 };
 return map[cat]?.[id]||null;
}
function applyMeshColor43(obj,color){
 if(!obj||!color)return;
 obj.traverse?.(x=>{if(x.isMesh&&x.material){x.material=x.material.clone();x.material.color.set(color);x.material.needsUpdate=true}});
}
function findBy43(root,fn){const a=[];root?.traverse?.(o=>{if(fn(o))a.push(o)});return a}
function apply43(){
 const root=window.domai43Root||window.root||null;
 const st=style43();
 const mats=JSON.parse(localStorage.getItem("domai_v42_materials")||"null")||{};
 if(root){
  findBy43(root,o=>o.userData?.type==="house"||o.userData?.type==="house_body").forEach(o=>applyMeshColor43(o,materialColor43("facade",mats.facade)||st.facade));
  findBy43(root,o=>o.userData?.type==="roof"||String(o.name||"").toLowerCase().includes("крыша")).forEach(o=>applyMeshColor43(o,materialColor43("roof",mats.roof)||st.roof));
  findBy43(root,o=>o.userData?.type==="window"||String(o.name||"").toLowerCase().includes("окно")).forEach(o=>applyMeshColor43(o,materialColor43("window",mats.window)||st.windows));
  findBy43(root,o=>o.userData?.type==="door"||String(o.name||"").toLowerCase().includes("двер")).forEach(o=>applyMeshColor43(o,materialColor43("door",mats.door)||st.doors));
  findBy43(root,o=>o.userData?.type==="gate"||String(o.name||"").toLowerCase().includes("ворот")).forEach(o=>applyMeshColor43(o,materialColor43("gate",mats.gate)||st.gates));
  findBy43(root,o=>o.userData?.type==="fence"||String(o.name||"").toLowerCase().includes("ограждение")).forEach(o=>applyMeshColor43(o,materialColor43("fence",mats.fence)||st.fence));
  findBy43(root,o=>o.userData?.type==="plot").forEach(o=>applyMeshColor43(o,st.grass));
  findBy43(root,o=>o.userData?.type==="tree").forEach(o=>applyMeshColor43(o,st.trees));
 }
 q43("v43Status").textContent="🎨 Материалы применены к 3D-сцене.";
}
window.domai43Apply3D=()=>{
 apply43();
 window.dispatchEvent(new CustomEvent("domai43apply",{detail:style43()}));
};
window.domai43Reset3D=()=>{
 localStorage.removeItem("domai_v41_style");localStorage.removeItem("domai_v42_materials");apply43();
 q43("v43Status").textContent="↺ Возвращён стандартный вид.";
};
window.domai43Snapshot=()=>{
 localStorage.setItem("domai_v43_visual_state",JSON.stringify({style:style43(),materials:JSON.parse(localStorage.getItem("domai_v42_materials")||"null")}));
 q43("v43Status").textContent="💾 Оформление сохранено.";
};
window.addEventListener("domai42materials",()=>setTimeout(apply43,100));
window.addEventListener("domai41style",()=>setTimeout(apply43,100));
setTimeout(()=>{},700);
