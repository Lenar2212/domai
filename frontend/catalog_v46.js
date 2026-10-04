
(function(){
const cats={
 facade:[
  ["plaster","Штукатурка","plaster"],["brick","Кирпич","brick"],["wood","Дерево","wood"],["stone","Камень","stone"],["siding","Сайдинг","siding"]
 ],
 roof:[["metal","Металл","metal"],["tile","Черепица","tile"],["soft","Мягкая кровля","soft"],["wood","Дерево","wood"]],
 fence:[["profile","Профнастил","profile"],["wood","Дерево","wood"],["picket","Штакетник","picket"],["mesh","Сетка","mesh"]],
 window:[["clear","Прозрачное","window-clear"],["dark","Тёмное","window-dark"],["warm","Тёплое","window-warm"]],
 door:[["oak","Дуб","door-oak"],["graphite","Графит","door-graphite"],["light","Светлое","door-light"]]
};
let category="facade";
const labels={facade:"Фасад",roof:"Крыша",fence:"Забор",window:"Окна",door:"Двери"};
const $=id=>document.getElementById(id);

function fallbackTexture(kind){
 const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d");
 const colors={plaster:"#d7cdbd",brick:"#9b5b46",wood:"#8f623f",stone:"#777871",siding:"#a8adb0",metal:"#4e5962",tile:"#9b5947",soft:"#34383e",profile:"#59636b",picket:"#8b6748",mesh:"#aeb3b5",
 "window-clear":"#b9d9ea","window-dark":"#33424e","window-warm":"#d7c6a4","door-oak":"#9a6943","door-graphite":"#3f454a","door-light":"#d4c4aa"};
 x.fillStyle=colors[kind]||"#aaa";x.fillRect(0,0,256,256);x.strokeStyle="rgba(30,30,30,.38)";x.lineWidth=3;
 if(kind==="brick"){for(let y=0;y<256;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke();for(let xx=(y/32%2)*32;xx<256;xx+=64){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+32);x.stroke()}}}
 else if(["wood","profile","metal"].includes(kind)){for(let xx=0;xx<256;xx+=22){x.beginPath();x.moveTo(xx,0);x.lineTo(xx,256);x.stroke()}}
 else if(kind==="stone"){for(let i=0;i<38;i++){x.beginPath();x.ellipse(Math.random()*256,Math.random()*256,12+Math.random()*18,8+Math.random()*12,Math.random(),0,7);x.stroke()}}
 else if(kind==="tile"){for(let y=0;y<256;y+=28)for(let xx=0;xx<256;xx+=35){x.beginPath();x.arc(xx,y+16,16,Math.PI,0);x.stroke()}}
 else if(kind==="siding"){for(let y=0;y<256;y+=24){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke()}}
 else if(kind==="mesh"){for(let i=-256;i<512;i+=18){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke();x.beginPath();x.moveTo(i,256);x.lineTo(i+256,0);x.stroke()}}
 else if(kind.startsWith("window")){x.strokeStyle="rgba(255,255,255,.55)";x.lineWidth=8;x.strokeRect(12,12,232,232);x.beginPath();x.moveTo(128,12);x.lineTo(128,244);x.moveTo(12,128);x.lineTo(244,128);x.stroke()}
 else if(kind.startsWith("door")){x.strokeStyle="rgba(40,30,20,.4)";x.strokeRect(28,8,200,240);x.fillStyle="rgba(255,255,255,.18)";x.fillRect(50,25,80,55)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function texture(k){return window.domai44CanvasTexture?window.domai44CanvasTexture(k)||fallbackTexture(k):fallbackTexture(k)}
function root(){return window.domai45Root||window.domai43Root||window.root||window.sceneRoot||null}
function semantic(o){
 const z=((o.name||"")+" "+((o.userData&&o.userData.type)||"")).toLowerCase();
 if(/roof|кров|кры/.test(z))return "roof";
 if(/fence|забор|ограж/.test(z))return "fence";
 if(/window|окн/.test(z))return "window";
 if(/door|двер/.test(z))return "door";
 if(/gate|ворот/.test(z))return "fence";
 if(/house|wall|facade|стен|дом|фасад/.test(z))return "facade";
 return null;
}
function apply(cat,kind){
 const r=root();let n=0;
 if(r)r.traverse(o=>{if(!o.isMesh||!o.material||semantic(o)!==cat)return;const m=Array.isArray(o.material)?o.material[0].clone():o.material.clone();m.map=texture(kind);m.color?.set("#ffffff");m.needsUpdate=true;o.material=m;n++});
 localStorage.setItem("domai_v46_selection",JSON.stringify({category:cat,material:kind}));
 $("v46Status").textContent=n?`✅ «${kind}» применён к ${n} объектам.`:`💾 «${kind}» выбран для «${labels[cat]}». Если 3D-сцена ещё не загрузилась, материал будет сохранён.`;
}
function render(){
 const box=$("v46Catalog");box.innerHTML="";
 (cats[category]||[]).forEach(([id,name,kind])=>{
   const card=document.createElement("button");card.type="button";card.style.cssText="padding:7px;border:1px solid #bbb;border-radius:10px;background:#fff;cursor:pointer;text-align:left";
   const cv=document.createElement("canvas");cv.width=180;cv.height=105;cv.style.cssText="width:100%;height:90px;border-radius:7px;display:block;margin-bottom:6px";
   card.appendChild(cv);const title=document.createElement("div");title.textContent=name;title.style.fontWeight="700";card.appendChild(title);
   const sub=document.createElement("div");sub.textContent=labels[category];sub.style.fontSize="12px";sub.style.opacity=".65";card.appendChild(sub);
   box.appendChild(card);
   const old=window.domai44CanvasTexture;
   // Render preview into 2D canvas by drawing the same procedural source when available.
   const tmp=document.createElement("canvas");tmp.width=tmp.height=256;
   if(kind.startsWith("window")||kind.startsWith("door")){
     const g=tmp.getContext("2d");g.fillStyle=kind==="window-dark"?"#33424e":kind==="window-warm"?"#d7c6a4":kind==="window-clear"?"#b9d9ea":kind==="door-oak"?"#9a6943":kind==="door-graphite"?"#3f454a":"#d4c4aa";g.fillRect(0,0,256,256);
   } else {
     const t=texture(kind); // source texture is used by Three.js; preview has a simple representation below
     const g=tmp.getContext("2d");g.fillStyle="#ddd";g.fillRect(0,0,256,256);
     if(kind==="brick"){g.fillStyle="#9b5b46";g.fillRect(0,0,256,256);g.strokeStyle="#dfc0b2";for(let y=0;y<256;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();}}
     else if(kind==="wood"){g.fillStyle="#8f623f";g.fillRect(0,0,256,256);g.fillStyle="#6f4c34";for(let y=0;y<256;y+=30)g.fillRect(0,y,256,5);}
     else if(kind==="stone"){g.fillStyle="#777871";g.fillRect(0,0,256,256);g.fillStyle="#999a94";for(let i=0;i<25;i++)g.fillRect(Math.random()*230,Math.random()*230,18+Math.random()*25,12+Math.random()*18);}
     else if(kind==="plaster"){g.fillStyle="#d7cdbd";g.fillRect(0,0,256,256);}
     else {g.fillStyle={metal:"#4e5962",tile:"#9b5947",soft:"#34383e",profile:"#59636b",picket:"#8b6748",mesh:"#aeb3b5",siding:"#a8adb0"}[kind]||"#aaa";g.fillRect(0,0,256,256);}
   }
   cv.getContext("2d").drawImage(tmp,0,0,180,105);
   card.onclick=()=>apply(category,kind);
 });
}
window.domai46Category=function(c){category=c;render();$("v46Status").textContent=`Категория: ${labels[c]}`};
document.addEventListener("DOMContentLoaded",()=>render());
})();
