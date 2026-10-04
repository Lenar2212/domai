
(function(){
const DEF={facade:"plaster",roof:"metal",fence:"profile"};
const $=id=>document.getElementById(id);
const key="domai_v45_material_editor";
let beforeState=null, compare=false;
function state(){return {facade:$("v45Facade").value,roof:$("v45Roof").value,fence:$("v45Fence").value}}
function setState(s){for(const k of Object.keys(DEF)){const e=$("v45"+k[0].toUpperCase()+k.slice(1));if(e&&s[k])e.value=s[k]}}
function sceneRoot(){
 return window.domai45Root||window.domai43Root||window.root||window.sceneRoot||null
}
function makeTexture(kind){
 if(window.domai44CanvasTexture)return window.domai44CanvasTexture(kind);
 const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d");
 const bg={brick:"#9b5b46",wood:"#8f623f",stone:"#777871",plaster:"#d7cdbd",siding:"#a8adb0",metal:"#4e5962",tile:"#9b5947",soft:"#34383e",profile:"#59636b",picket:"#8b6748",mesh:"#aeb3b5"}[kind]||"#aaa";
 x.fillStyle=bg;x.fillRect(0,0,256,256);
 x.strokeStyle="rgba(30,30,30,.45)";x.lineWidth=3;
 if(kind==="brick"){for(let y=0;y<256;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke();for(let xx=(y/32%2)*32;xx<256;xx+=64){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+32);x.stroke()}}}
 else if(["wood","picket","profile","metal"].includes(kind)){for(let xx=0;xx<256;xx+=22){x.beginPath();x.moveTo(xx,0);x.lineTo(xx,256);x.stroke()}}
 else if(kind==="stone"){for(let i=0;i<45;i++){x.beginPath();x.ellipse(Math.random()*256,Math.random()*256,12+Math.random()*18,8+Math.random()*12,Math.random(),0,7);x.stroke()}}
 else if(kind==="tile"){for(let y=0;y<256;y+=28)for(let xx=0;xx<256;xx+=35){x.beginPath();x.arc(xx,y+16,16,Math.PI,0);x.stroke()}}
 else if(kind==="siding"){for(let y=0;y<256;y+=24){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke()}}
 else if(kind==="mesh"){for(let i=-256;i<512;i+=18){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke();x.beginPath();x.moveTo(i,256);x.lineTo(i+256,0);x.stroke()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function semantic(o){
 const n=(o.name||"").toLowerCase(),t=(o.userData&&o.userData.type||"").toLowerCase();
 const z=n+" "+t;
 if(/roof|кров|кры/.test(z))return "roof";
 if(/fence|забор|ограж/.test(z))return "fence";
 if(/window|окн/.test(z))return "window";
 if(/door|двер/.test(z))return "door";
 if(/gate|ворот/.test(z))return "gate";
 if(/tree|дерев/.test(z))return "tree";
 if(/house|wall|facade|стен|дом|фасад/.test(z))return "facade";
 return null;
}
function applyTexture(kind,texture){
 const r=sceneRoot();if(!r)return 0;let count=0;
 r.traverse(o=>{
   if(!o.isMesh||!o.material)return;
   if(semantic(o)!==kind)return;
   const m=Array.isArray(o.material)?o.material[0].clone():o.material.clone();
   m.map=texture;m.color?.set("#ffffff");m.needsUpdate=true;o.material=m;count++;
 });
 return count;
}
window.domai45Apply=function(){
 const st=state();beforeState=beforeState||JSON.parse(localStorage.getItem(key+"_last")||"null")||DEF;
 localStorage.setItem(key,JSON.stringify(st));localStorage.setItem(key+"_last",JSON.stringify(st));
 let total=0;
 total+=applyTexture("facade",makeTexture(st.facade));
 total+=applyTexture("roof",makeTexture(st.roof));
 total+=applyTexture("fence",makeTexture(st.fence));
 $("v45Status").textContent=total?`🎨 Применено к ${total} 3D-объектам.`:"ℹ️ Сцена ещё не открыла редактируемые 3D-объекты — набор сохранён.";
}
window.domai45Save=function(){localStorage.setItem(key,JSON.stringify(state()));$("v45Status").textContent="💾 Оформление сохранено."}
window.domai45Compare=function(){
 compare=!compare;
 if(compare){beforeState=JSON.parse(localStorage.getItem(key+"_last")||"null")||DEF;$("v45Status").textContent="↔ Режим сравнения: можно переключаться между исходным и текущим оформлением."}
 else $("v45Status").textContent="↔ Режим сравнения выключен.";
}
window.domai45Random=function(){
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 setState({facade:pick(["plaster","brick","wood","stone","siding"]),roof:pick(["metal","tile","soft","wood"]),fence:pick(["profile","wood","picket","mesh"])});
 domai45Apply();$("v45Status").textContent="✨ Новый комплект применён.";
}
window.domai45Reset=function(){setState(DEF);domai45Apply();$("v45Status").textContent="↺ Исходное оформление восстановлено."}
document.addEventListener("DOMContentLoaded",()=>{
 try{setState(JSON.parse(localStorage.getItem(key)||"null")||DEF)}catch(e){setState(DEF)}
});
})();
