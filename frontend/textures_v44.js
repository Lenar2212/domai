
const V44_DEFAULT={facade:"plaster",roof:"metal",fence:"profile"};
const q44=id=>document.getElementById(id);
function v44Get(){return {facade:q44("v44Facade").value,roof:q44("v44Roof").value,fence:q44("v44Fence").value}}
function v44Set(x){for(const [k,v] of Object.entries(x)){const e=q44("v44"+k.charAt(0).toUpperCase()+k.slice(1));if(e)e.value=v}}
function canvasTex44(kind){
 const c=document.createElement("canvas");c.width=256;c.height=256;const x=c.getContext("2d");
 x.fillStyle="#b7b1a6";x.fillRect(0,0,256,256);
 if(kind==="brick"){
  x.fillStyle="#9b5b46";x.fillRect(0,0,256,256);x.strokeStyle="#d2b4a4";x.lineWidth=4;
  for(let y=0;y<256;y+=32){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke();for(let xx=(y/32%2)*32;xx<256;xx+=64){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+32);x.stroke()}}
 } else if(kind==="wood"){
  x.fillStyle="#8f623f";x.fillRect(0,0,256,256);for(let y=0;y<256;y+=28){x.fillStyle=y%56?"#a8754b":"#795333";x.fillRect(0,y,256,22);x.strokeStyle="#5f402b";x.strokeRect(0,y,256,22)}
 } else if(kind==="stone"){
  x.fillStyle="#777871";x.fillRect(0,0,256,256);for(let i=0;i<45;i++){const xx=Math.random()*256,yy=Math.random()*256,rr=10+Math.random()*20;x.fillStyle=i%2?"#96958d":"#5f605b";x.beginPath();x.ellipse(xx,yy,rr,rr*.7,Math.random(),0,Math.PI*2);x.fill()}}
 else if(kind==="plaster"){x.fillStyle="#d7cdbd";x.fillRect(0,0,256,256);for(let i=0;i<1200;i++){const v=180+Math.random()*45;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.fillRect(Math.random()*256,Math.random()*256,1,1)}}
 else if(kind==="siding"){x.fillStyle="#a8adb0";x.fillRect(0,0,256,256);x.strokeStyle="#70777b";for(let y=0;y<256;y+=24){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke()}}
 else if(kind==="metal"){x.fillStyle="#4e5962";x.fillRect(0,0,256,256);x.strokeStyle="#303840";x.lineWidth=5;for(let x0=0;x0<256;x0+=22){x.beginPath();x.moveTo(x0,0);x.lineTo(x0,256);x.stroke()}}
 else if(kind==="tile"){x.fillStyle="#9b5947";x.fillRect(0,0,256,256);x.strokeStyle="#62382e";for(let y=0;y<256;y+=25){for(let xx=(y%50?0:12);xx<256;xx+=34){x.beginPath();x.arc(xx,y+15,15,Math.PI,0);x.stroke()}}}
 else if(kind==="soft"){x.fillStyle="#34383e";x.fillRect(0,0,256,256);x.strokeStyle="#565c63";for(let y=0;y<256;y+=18){x.beginPath();x.moveTo(0,y);x.lineTo(256,y);x.stroke()}}
 else if(kind==="profile"){x.fillStyle="#59636b";x.fillRect(0,0,256,256);x.strokeStyle="#343b40";for(let xx=0;xx<256;xx+=18){x.beginPath();x.moveTo(xx,0);x.lineTo(xx,256);x.stroke()}}
 else if(kind==="picket"){x.fillStyle="#8b6748";x.fillRect(0,0,256,256);x.fillStyle="#6f5139";for(let xx=0;xx<256;xx+=24){x.fillRect(xx,0,14,256)}}
 else if(kind==="mesh"){x.fillStyle="#aeb3b5";x.fillRect(0,0,256,256);x.strokeStyle="#62686b";x.lineWidth=2;for(let i=-256;i<512;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke();x.beginPath();x.moveTo(i,256);x.lineTo(i+256,0);x.stroke()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.colorSpace=THREE.SRGBColorSpace;return t
}
function setTexture44(o,t){if(!o||!t)return;o.traverse?.(m=>{if(m.isMesh&&m.material){m.material=m.material.clone();m.material.map=t;m.material.color.set("#ffffff");m.material.needsUpdate=true}})}
window.domai44Apply=()=>{
 const st=v44Get();localStorage.setItem("domai_v44_textures",JSON.stringify(st));
 window.dispatchEvent(new CustomEvent("domai44textures",{detail:st}));
 q44("v44Status").textContent="🧱 Текстуры применены к визуальной концепции.";
}
window.domai44Random=()=>{
 const pick=(a)=>a[Math.floor(Math.random()*a.length)];
 v44Set({facade:pick(["plaster","brick","wood","stone","siding"]),roof:pick(["metal","tile","soft","wood"]),fence:pick(["profile","wood","picket","mesh"])});
 domai44Apply();q44("v44Status").textContent="✨ Случайный комплект текстур создан.";
}
window.domai44Reset=()=>{v44Set(V44_DEFAULT);domai44Apply();q44("v44Status").textContent="↺ Стандартные текстуры восстановлены."}
window.domai44CanvasTexture=canvasTex44;window.domai44SetTexture=setTexture44;
document.addEventListener("DOMContentLoaded",()=>{try{v44Set(JSON.parse(localStorage.getItem("domai_v44_textures")||"null")||V44_DEFAULT)}catch(e){}});
