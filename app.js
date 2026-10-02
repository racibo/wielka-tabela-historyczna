const DEFAULT_SHEET_URL="https://docs.google.com/spreadsheets/d/1TmRHJDv6IMlGwg761JV50M8vS4zXTdWBtjDziAleSQI/edit?gid=1757130608#gid=1757130608";
const DEFAULT_SCRIPT_URL="https://script.google.com/macros/s/AKfycbwrk-U1vMirSYRVmq2Fqaw1waW4TUIifx8jB_J5hWxEvWgBrnW9I8oWx64dirmbVfo/exec";
const state={countries:[],rulers:[],scale:18,showGrid:true,range:"auto"};
const LEVEL_WIDTHS=[1.95,1.2,.85,.65,.35];
const COUNTRY_ORDER_KEY="wthCountryOrder";
const COUNTRY_WIDTHS_KEY="wthCountryWidths";
const DEFAULT_COUNTRY_WIDTH=190;
const MIN_COUNTRY_WIDTH=45;
function loadCountryWidths(){try{const x=JSON.parse(localStorage.getItem(COUNTRY_WIDTHS_KEY)||"{}");return x&&typeof x==="object"?x:{}}catch(e){return {}}}
function saveCountryWidths(){const x={};state.countries.forEach(c=>{if(c.width&&c.width!==DEFAULT_COUNTRY_WIDTH)x[c.name]=c.width});localStorage.setItem(COUNTRY_WIDTHS_KEY,JSON.stringify(x))}
function getCountryWidth(c){const w=Number(c.width);return Number.isFinite(w)&&w>=MIN_COUNTRY_WIDTH?w:DEFAULT_COUNTRY_WIDTH}
function applySavedCountryWidths(){const x=loadCountryWidths();state.countries.forEach(c=>{if(Number.isFinite(Number(x[c.name])))c.width=Math.max(MIN_COUNTRY_WIDTH,Number(x[c.name]))})}
function countryX(index){let x=92;for(let i=0;i<index;i++)x+=getCountryWidth(state.countries[i])+18;return x}
function totalDiagramWidth(){return countryX(state.countries.length)+30}
const selectedRulerIds=new Set();
let bulkColor="#90caf9";
let bulkMode=false;
function applySavedCountryOrder(){
 try{
   const saved=JSON.parse(localStorage.getItem(COUNTRY_ORDER_KEY)||"[]");
   if(!Array.isArray(saved)||!saved.length)return;
   const rank=new Map(saved.map((name,i)=>[String(name),i]));
   state.countries.sort((a,b)=>{
     const ra=rank.has(a.name)?rank.get(a.name):999999;
     const rb=rank.has(b.name)?rank.get(b.name):999999;
     return ra-rb || (a.order||0)-(b.order||0);
   });
 }catch(e){console.warn("Nie udało się odczytać kolejności państw:",e)}
}
function saveCountryOrder(){
 localStorage.setItem(COUNTRY_ORDER_KEY,JSON.stringify(state.countries.map(c=>c.name)));
}
function toggleBulkRuler(r){
 if(!bulkMode)return;
 if(selectedRulerIds.has(r.id))selectedRulerIds.delete(r.id);else selectedRulerIds.add(r.id);
 render();
}
function setBulkColor(color){bulkColor=color;document.querySelectorAll(".bulk-color").forEach(b=>b.classList.toggle("active",b.dataset.color===color));}
function applyBulkColor(){
 state.rulers.forEach(r=>{if(selectedRulerIds.has(r.id))r.color=bulkColor;});
 render();
}
function clearBulkSelection(){selectedRulerIds.clear();render();}
function toggleBulkMode(){
 bulkMode=!bulkMode;
 if(!bulkMode)selectedRulerIds.clear();
 document.body.classList.toggle("bulk-mode",bulkMode);
 const btn=document.getElementById("bulkColorBtn");if(btn)btn.textContent=bulkMode?"✕ Zakończ kolory":"🎨 Kolory";
 const panel=document.getElementById("bulkColorPanel");if(panel)panel.classList.toggle("hidden",!bulkMode);
 render();
}
function moveCountry(index,direction){
 const target=index+direction;
 if(target<0||target>=state.countries.length)return;
 const tmp=state.countries[index];
 state.countries[index]=state.countries[target];
 state.countries[target]=tmp;
 saveCountryOrder();
 render();
}
const NS="http://www.w3.org/2000/svg";
const countries=[{id:"pl",name:"Polska",code:"PL",order:1},{id:"pt",name:"Portugalia",code:"PT",order:2},{id:"es",name:"Hiszpania",code:"ES",order:3}];
const rulers=[
{id:"1",countryId:"pl",name:"Andrzej Duda",role:"prezydent",level:1,start:"2015",end:"2025",notes:"Dane demonstracyjne."},
{id:"2",countryId:"pl",name:"Donald Tusk",role:"premier",level:2,start:"2023",end:"2026"},
{id:"3",countryId:"pl",name:"Mateusz Morawiecki",role:"premier",level:2,start:"2017",end:"2023"},
{id:"4",countryId:"pt",name:"Marcelo Rebelo de Sousa",role:"prezydent",level:1,start:"2016",end:"2026"},
{id:"5",countryId:"pt",name:"António Costa",role:"premier",level:2,start:"2015",end:"2024"},
{id:"6",countryId:"pt",name:"Luís Montenegro",role:"premier",level:2,start:"2024",end:"2026"},
{id:"7",countryId:"es",name:"Felipe VI",role:"król",level:1,start:"2014",end:"2026"},
{id:"8",countryId:"es",name:"Pedro Sánchez",role:"premier",level:2,start:"2018",end:"2026"}
];
function uid(){return (crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()))}
function parseDate(s,isEnd){
 if(!s)return new Date();
 s=String(s).trim().replace(/\./g,"/");
 if(/^(dziś|dzisiaj|obecnie|aktualnie|today)$/i.test(s))return new Date();
 let m;
 if(/^[-+]?\d{1,6}$/.test(s)){
   const y=Number(s);
   // Jeśli znamy tylko rok: początek = 1 lipca, koniec = 30 czerwca.
   // Dzięki temu zakres "1188-1200" oznacza 01.07.1188 – 30.06.1200.
   return new Date(Date.UTC(y,isEnd?5:6,isEnd?30:1));
 }
 m=s.match(/^(\d{1,2})[\/-](\d{4})$/);
 if(m){const y=+m[2],mo=+m[1]-1;return new Date(Date.UTC(y,mo,isEnd?new Date(Date.UTC(y,mo+1,0)).getUTCDate():1))}
 m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
 if(m)return new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));
 m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(m)return new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
 return new Date(s)
}
function splitDateRange(value){
 const s=String(value||"").trim().replace(/\s+/g,"");
 if(!s)return null;
 let m=s.match(/^([+-]?\d{1,6})[–—]([+-]?\d{1,6})$/);
 if(m)return{start:m[1],end:m[2]};
 m=s.match(/^([+-]?\d{1,6})-([+-]?\d{1,6})$/);
 if(m)return{start:m[1],end:m[2]};
 m=s.match(/^(\d{1,2}[\/.]\d{1,2}[\/.]\d{4})[–—-](\d{1,2}[\/.]\d{1,2}[\/.]\d{4}|\d{1,2}[\/.]\d{4}|\d{4})$/);
 if(m)return{start:m[1],end:m[2]};
 m=s.match(/^(\d{1,2}[\/.]\d{1,2}[\/.]\d{4})-(\d{1,2}[\/.]\d{4}|\d{4})$/);
 if(m)return{start:m[1],end:m[2]};
 m=s.match(/^(\d{1,2}[\/.]\d{4})[–—-](\d{1,2}[\/.]\d{4}|\d{4})$/);
 if(m)return{start:m[1],end:m[2]};
 return null;
}
function cleanImportedText(value){
 let s=String(value??"").trim();
 if(!s)return "";
 s=s.replace(/\[([^\]]+)\]\((?:[^()]|\([^()]*\))*\)/g,"$1");
 s=s.replace(/\[([^\]]+)\]/g,"$1");
 s=s.replace(/[*_~]/g,"");
 s=s.replace(/\s*\[\d+(?:,\s*\d+)*\]\s*/g," ");
 return s.replace(/\s+/g," ").trim();
}
function normalizeRulerDates(r){
 const startRange=splitDateRange(r.start);
 const endRange=splitDateRange(r.end);
 if(startRange){
   r.start=startRange.start;
   if(!String(r.end||"").trim())r.end=startRange.end;
 }
 if(endRange){
   if(!String(r.start||"").trim())r.start=endRange.start;
   r.end=endRange.end;
 }
 return r;
}
function parseRulerEnd(r){
 const raw=String(r.end??"").trim();
 // Puste pole "Do" oznacza pojedynczy rok/datę, nie automatycznie "dziś".
 return raw?parseDate(raw,true):parseDate(r.start,false);
}
function isCurrentRuler(r){
 return /^(dziś|dzisiaj|obecnie|aktualnie|today)$/i.test(String(r.end??"").trim());
}
function isValidRulerDateRange(r){
 const start=parseDate(r.start,false);
 const end=parseRulerEnd(r);
 return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&start<=end;
}
function yf(d){return d.getTime()/31557600000}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",[String.fromCharCode(34)]:"&quot;","'":"&#39;"}[c]))}
function bounds(){const ds=[];state.rulers.forEach(r=>{ds.push(parseDate(r.start,false),parseRulerEnd(r))});const now=new Date();let max=ds.length?new Date(Math.max(...ds)):now;let min=ds.length?new Date(Math.min(...ds)):new Date(now.getFullYear()-100,0,1);if(state.range!=="auto"){max=now;min=new Date(now.getFullYear()-Number(state.range),0,1)}const pad=365.25*24*60*60*1000;max=new Date(max.getTime()+pad);min=new Date(min.getTime()-pad);return{min,max}}
function renderFixedAxis(b){
 const viewport=document.getElementById("diagramViewport");
 if(!viewport)return;
 let axisHost=document.getElementById("fixedTimelineAxis");
 if(!axisHost){
   axisHost=document.createElement("div");
   axisHost.id="fixedTimelineAxis";
   axisHost.setAttribute("aria-hidden","true");
   viewport.prepend(axisHost);
 }
 const w=92,h=Math.max(1,viewport.clientHeight);
 axisHost.innerHTML="";
 const svg=document.createElementNS(NS,"svg");
 svg.setAttribute("width",w);svg.setAttribute("height",h);svg.setAttribute("viewBox","0 0 "+w+" "+h);
 svg.style.display="block";
 const bg=document.createElementNS(NS,"rect");bg.setAttribute("width",w);bg.setAttribute("height",h);bg.setAttribute("fill","#fff");svg.appendChild(bg);
 const scrollTop=viewport.scrollTop;
 const top=62,axisX=58;
 const yearH=(yf(b.max)-yf(b.min))*state.scale;
 const yFor=d=>top+(yf(b.max)-yf(d))*state.scale-scrollTop;
 const axis=document.createElementNS(NS,"line");axis.setAttribute("x1",axisX);axis.setAttribute("x2",axisX);axis.setAttribute("y1",Math.max(0,top-scrollTop));axis.setAttribute("y2",Math.min(h,top+yearH-scrollTop));axis.setAttribute("stroke","#263746");axis.setAttribute("stroke-width","3");svg.appendChild(axis);
 const firstYear=b.min.getUTCFullYear(),lastYear=b.max.getUTCFullYear();
 for(let y=firstYear;y<=lastYear;y++){
   const yy=yFor(new Date(Date.UTC(y,0,1)));if(yy<-2||yy>h+2)continue;
   const tick=document.createElementNS(NS,"line");tick.setAttribute("x1",axisX-7);tick.setAttribute("x2",axisX+7);tick.setAttribute("y1",yy);tick.setAttribute("y2",yy);tick.setAttribute("stroke","#263746");tick.setAttribute("stroke-width",y%10===0?"2":"1");svg.appendChild(tick);
   const label=document.createElementNS(NS,"text");label.setAttribute("x",axisX-12);label.setAttribute("y",yy+4);label.setAttribute("text-anchor","end");label.setAttribute("font-size",y%10===0?"12":"10");label.setAttribute("font-weight",y%10===0?"700":"400");label.setAttribute("fill","#263746");label.textContent=y;svg.appendChild(label);
 }
 const nowY=yFor(new Date());
 if(nowY>=-2&&nowY<=h+2){const nowTick=document.createElementNS(NS,"line");nowTick.setAttribute("x1",axisX-12);nowTick.setAttribute("x2",axisX+12);nowTick.setAttribute("y1",nowY);nowTick.setAttribute("y2",nowY);nowTick.setAttribute("stroke","#c2410c");nowTick.setAttribute("stroke-width","3");svg.appendChild(nowTick);}
 axisHost.appendChild(svg);
}
function renderFixedCountryHeader(){
 const viewport=document.getElementById("diagramViewport");
 if(!viewport)return;
 let host=document.getElementById("fixedCountryHeader");
 if(!host){
   host=document.createElement("div");
   host.id="fixedCountryHeader";
   host.setAttribute("aria-hidden","true");
   viewport.prepend(host);
 }
 const left=92,gap=18;
 const totalWidth=Math.max(1,totalDiagramWidth()-left);
 host.innerHTML="";
 const svg=document.createElementNS(NS,"svg");
 svg.setAttribute("width",totalWidth);
 svg.setAttribute("height","52");
 svg.setAttribute("viewBox","0 0 "+totalWidth+" 52");
 svg.style.display="block";
 const group=document.createElementNS(NS,"g");
 group.setAttribute("transform","translate("+(-viewport.scrollLeft)+" 0)");
 state.countries.forEach((c,ci)=>{
   const x=countryX(ci)-left;
   const countryW=getCountryWidth(c);
   const head=document.createElementNS(NS,"rect");
   head.setAttribute("x",x);head.setAttribute("y",10);head.setAttribute("width",countryW);head.setAttribute("height",40);head.setAttribute("rx",6);head.setAttribute("fill","#eef2f6");head.setAttribute("stroke","#c9d0d8");
   group.appendChild(head);
   const leftArrow=document.createElementNS(NS,"text");
   leftArrow.setAttribute("x",x+14);leftArrow.setAttribute("y",35);leftArrow.setAttribute("text-anchor","middle");leftArrow.setAttribute("font-size","18");leftArrow.setAttribute("font-weight","700");leftArrow.setAttribute("fill",ci===0?"#c7cdd4":"#334155");leftArrow.textContent="‹";
   if(ci>0){leftArrow.setAttribute("pointer-events","auto");leftArrow.style.pointerEvents="auto";leftArrow.addEventListener("click",e=>{e.stopPropagation();moveCountry(ci,-1)});}
   group.appendChild(leftArrow);
   const rightArrow=document.createElementNS(NS,"text");
   rightArrow.setAttribute("x",x+countryW-14);rightArrow.setAttribute("y",35);rightArrow.setAttribute("text-anchor","middle");rightArrow.setAttribute("font-size","18");rightArrow.setAttribute("font-weight","700");rightArrow.setAttribute("fill",ci===state.countries.length-1?"#c7cdd4":"#334155");rightArrow.textContent="›";
   if(ci<state.countries.length-1){rightArrow.setAttribute("pointer-events","auto");rightArrow.style.pointerEvents="auto";rightArrow.addEventListener("click",e=>{e.stopPropagation();moveCountry(ci,1)});}
   group.appendChild(rightArrow);
   const ct=document.createElementNS(NS,"text");
   ct.setAttribute("x",x+countryW/2);ct.setAttribute("y",35);ct.setAttribute("text-anchor","middle");ct.setAttribute("font-size","14");ct.setAttribute("font-weight","700");ct.setAttribute("fill","#20242a");ct.textContent=c.name;
   group.appendChild(ct);
   if(ci<state.countries.length-1){
     const handle=document.createElementNS(NS,"rect");
     handle.setAttribute("x",x+countryW+gap/2-4);handle.setAttribute("y",6);handle.setAttribute("width",8);handle.setAttribute("height",44);
     handle.setAttribute("fill","transparent");handle.style.cursor="col-resize";
     handle.addEventListener("pointerdown",e=>{
       e.preventDefault();e.stopPropagation();
       const startX=e.clientX,startW=countryW;
       const move=ev=>{c.width=Math.max(MIN_COUNTRY_WIDTH,startW+ev.clientX-startX);render();renderFixedCountryHeader()};
       const up=()=>{saveCountryWidths();window.removeEventListener("pointermove",move)};
       window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});
     });
     group.appendChild(handle);
   }
 });
 svg.appendChild(group);
 host.appendChild(svg);
}
function render(){
 const b=bounds();
 const top=62;
 const axisX=58;
 const left=92;
 const yearH=(yf(b.max)-yf(b.min))*state.scale;
 
 const gap=18;
 const width=state.countries.reduce((sum,c)=>sum+getCountryWidth(c)+gap,left)+30;
 const height=top+yearH+40;
 const div=document.getElementById("diagram");
 div.innerHTML="";
 const svg=document.createElementNS(NS,"svg");
 svg.setAttribute("width",width);
 svg.setAttribute("height",height);
 svg.setAttribute("viewBox","0 0 "+width+" "+height);
 const bg=document.createElementNS(NS,"rect");
 bg.setAttribute("width",width);
 bg.setAttribute("height",height);
 bg.setAttribute("fill","#fff");
 svg.appendChild(bg);
 const yFor=d=>top+(yf(b.max)-yf(d))*state.scale;
 if(state.showGrid){
   for(let y=Math.ceil(yf(b.min));y<=Math.floor(yf(b.max));y++){
     const yy=yFor(new Date(Date.UTC(y,0,1)));
     if(yy<top||yy>top+yearH)continue;
     const line=document.createElementNS(NS,"line");
     line.setAttribute("x1",axisX+8);line.setAttribute("x2",width);line.setAttribute("y1",yy);line.setAttribute("y2",yy);
     line.setAttribute("stroke",y%10===0?"#d7dce2":"#eceff2");line.setAttribute("stroke-width",y%10===0?"1.2":".7");svg.appendChild(line);
   }
 }
 const axis=document.createElementNS(NS,"line");
 axis.setAttribute("x1",axisX);axis.setAttribute("x2",axisX);axis.setAttribute("y1",top);axis.setAttribute("y2",top+yearH);axis.setAttribute("stroke","#263746");axis.setAttribute("stroke-width","3");svg.appendChild(axis);
 const firstYear=b.min.getUTCFullYear();
 const lastYear=b.max.getUTCFullYear();
 for(let y=firstYear;y<=lastYear;y++){
   const yy=yFor(new Date(Date.UTC(y,0,1)));if(yy<top||yy>top+yearH)continue;
   const tick=document.createElementNS(NS,"line");tick.setAttribute("x1",axisX-7);tick.setAttribute("x2",axisX+7);tick.setAttribute("y1",yy);tick.setAttribute("y2",yy);tick.setAttribute("stroke","#263746");tick.setAttribute("stroke-width",y%10===0?"2":"1");svg.appendChild(tick);
   const label=document.createElementNS(NS,"text");label.setAttribute("x",axisX-12);label.setAttribute("y",yy+4);label.setAttribute("text-anchor","end");label.setAttribute("font-size",y%10===0?"12":"10");label.setAttribute("font-weight",y%10===0?"700":"400");label.setAttribute("fill","#263746");label.textContent=y;svg.appendChild(label);
 }
 const nowY=yFor(new Date());
 if(nowY>=top&&nowY<=top+yearH){
   const nowTick=document.createElementNS(NS,"line");nowTick.setAttribute("x1",axisX-12);nowTick.setAttribute("x2",axisX+12);nowTick.setAttribute("y1",nowY);nowTick.setAttribute("y2",nowY);nowTick.setAttribute("stroke","#c2410c");nowTick.setAttribute("stroke-width","3");svg.appendChild(nowTick);
   
 }
 state.countries.forEach((c,ci)=>{
   const x=countryX(ci);
   const countryW=getCountryWidth(c);
   const head=document.createElementNS(NS,"rect");head.setAttribute("x",x);head.setAttribute("y",10);head.setAttribute("width",countryW);head.setAttribute("height",40);head.setAttribute("rx",6);head.setAttribute("fill","#eef2f6");head.setAttribute("stroke","#c9d0d8");svg.appendChild(head);
   const leftArrow=document.createElementNS(NS,"text");
   leftArrow.setAttribute("x",x+14);leftArrow.setAttribute("y",35);leftArrow.setAttribute("text-anchor","middle");leftArrow.setAttribute("font-size","18");leftArrow.setAttribute("font-weight","700");leftArrow.setAttribute("fill",ci===0?"#c7cdd4":"#334155");leftArrow.setAttribute("cursor",ci===0?"default":"pointer");leftArrow.textContent="‹";
   if(ci>0)leftArrow.addEventListener("click",e=>{e.stopPropagation();moveCountry(ci,-1)});
   svg.appendChild(leftArrow);
   const rightArrow=document.createElementNS(NS,"text");
   rightArrow.setAttribute("x",x+countryW-14);rightArrow.setAttribute("y",35);rightArrow.setAttribute("text-anchor","middle");rightArrow.setAttribute("font-size","18");rightArrow.setAttribute("font-weight","700");rightArrow.setAttribute("fill",ci===state.countries.length-1?"#c7cdd4":"#334155");rightArrow.setAttribute("cursor",ci===state.countries.length-1?"default":"pointer");rightArrow.textContent="›";
   if(ci<state.countries.length-1)rightArrow.addEventListener("click",e=>{e.stopPropagation();moveCountry(ci,1)});
   svg.appendChild(rightArrow);
   const ct=document.createElementNS(NS,"text");ct.setAttribute("x",x+countryW/2);ct.setAttribute("y",35);ct.setAttribute("text-anchor","middle");ct.setAttribute("font-size","14");ct.setAttribute("font-weight","700");ct.textContent=c.name;svg.appendChild(ct);
   const rs=state.rulers.filter(r=>r.countryId===c.id);
   // Pokazujemy tylko poziomy, dla których dane rzeczywiście istnieją w tej grupie.
   // Jeśli istnieje tylko jeden poziom (np. 5), dostaje całą szerokość grupy.
   const visibleLevels=[1,2,3,4,5].filter(level=>rs.some(r=>+r.level===level));
   const visibleWeightSum=visibleLevels.reduce((sum,level)=>sum+LEVEL_WIDTHS[level-1],0);
   let visibleOffset=0;
   for(const level of visibleLevels){
     const laneX=x+visibleOffset/visibleWeightSum*countryW;
     const laneW=LEVEL_WIDTHS[level-1]/visibleWeightSum*countryW;
     visibleOffset+=LEVEL_WIDTHS[level-1];
     const rr=rs.filter(r=>+r.level===level);
     const slots=[];
     rr.sort((a,b)=>parseDate(a.start)-parseDate(b.start));
     rr.forEach(r=>{
       const s=parseDate(r.start,false),e=parseRulerEnd(r);
       let slot=0;while(slots[slot]&&slots[slot].some(o=>o.s<e&&s<o.e))slot++;
       if(!slots[slot])slots[slot]=[];slots[slot].push({s,e});r._slot=slot;
     });
     const slotCount=Math.max(1,slots.length);
     rr.forEach(r=>{
       const startDate=parseDate(r.start,false),endDate=parseRulerEnd(r);
       const yStart=yFor(startDate),yEnd=yFor(endDate);
       const ry=Math.min(yStart,yEnd),rh=Math.max(4,Math.abs(yEnd-yStart)),rw=laneW/slotCount,rx=laneX+(r._slot||0)*rw+1;
       const rect=document.createElementNS(NS,"rect");rect.setAttribute("x",rx);rect.setAttribute("y",ry);rect.setAttribute("width",Math.max(4,rw-2));rect.setAttribute("height",rh);rect.setAttribute("rx",3);rect.setAttribute("fill",r.color||"hsl("+((ci*71+level*43)%360)+" 62% 78%)");rect.setAttribute("stroke","#59636f");rect.setAttribute("stroke-width","1");rect.setAttribute("class","ruler-block");
       if(bulkMode&&selectedRulerIds.has(r.id)){rect.setAttribute("stroke","#1f6feb");rect.setAttribute("stroke-width","3");rect.setAttribute("filter","drop-shadow(0 0 2px #1f6feb)");}
       rect.addEventListener("click",e=>{e.stopPropagation();if(bulkMode)toggleBulkRuler(r);else showDetails(r)});svg.appendChild(rect);
       const parts=String(r.name||"").trim().split(/\s+/).filter(Boolean);
       const initials=parts.map(p=>p[0]).join("").toUpperCase();
       const fullName=String(r.name||"");
       const surname=parts.length>1?parts.slice(1).join(" "):fullName;
       const firstInitial=parts.length>1?(parts[0][0].toUpperCase()+". "):"";
       const durationYears=Math.abs(endDate-startDate)/(365.2425*24*60*60*1000);
       let labelText;if(durationYears<=2)labelText=initials;else if(durationYears<6)labelText=firstInitial+surname;else labelText=fullName;
       const textLength=labelText.length,shortName=textLength<=11,vertical=!shortName,availableHeight=Math.max(8,rh-8),availableWidth=Math.max(8,rw-4);
       let fontSize=Math.max(7,Math.min(12,availableWidth/Math.max(4,textLength)*1.8));
       if(vertical){fontSize=Math.max(7,Math.min(12,availableWidth/3.2));fontSize=Math.min(fontSize,availableHeight/Math.max(4,textLength)*1.8);}
       if(rh>=12){
         const tx=document.createElementNS(NS,"text");const textX=rx+Math.max(4,rw-2)/2,textY=ry+Math.max(4,rh)/2;
         tx.setAttribute("x",textX);tx.setAttribute("y",textY);tx.setAttribute("text-anchor","middle");tx.setAttribute("dominant-baseline","middle");tx.setAttribute("font-size",fontSize);tx.setAttribute("font-weight","600");tx.setAttribute("fill","#1e293b");tx.setAttribute("pointer-events","none");
         if(vertical)tx.setAttribute("transform","rotate(-90 "+textX+" "+textY+")");
         tx.textContent=labelText;svg.appendChild(tx);
       }
     });
     const lane=document.createElementNS(NS,"rect");lane.setAttribute("x",laneX);lane.setAttribute("y",top);lane.setAttribute("width",laneW);lane.setAttribute("height",yearH);lane.setAttribute("fill","none");lane.setAttribute("stroke","#dfe3e8");lane.setAttribute("stroke-width","1");svg.appendChild(lane);
   }
   const border=document.createElementNS(NS,"rect");border.setAttribute("x",x);border.setAttribute("y",top);border.setAttribute("width",countryW);border.setAttribute("height",yearH);border.setAttribute("fill","none");border.setAttribute("stroke","#9da6b2");border.setAttribute("stroke-width","1.5");svg.appendChild(border);
 });
 div.appendChild(svg);
 renderFixedAxis(b);
 renderFixedCountryHeader();
 document.getElementById("countryCount").textContent=state.countries.length;
 document.getElementById("rulerCount").textContent=state.rulers.length;
 document.getElementById("scaleLabel").textContent="1 rok ≈ "+state.scale.toFixed(1)+" px";
 const bulkCount=document.getElementById("bulkSelectedCount");if(bulkCount)bulkCount.textContent=selectedRulerIds.size;
}
let selectedRuler=null;
function showDetails(r){
 selectedRuler=r;
 const c=state.countries.find(x=>x.id===r.countryId);
 const periodText=isCurrentRuler(r)?(String(r.start)+" – dziś"):(String(r.end??"").trim()?(String(r.start)+" – "+String(r.end).trim()):String(r.start));
 document.getElementById("detailsContent").innerHTML="<h3>"+esc(r.name)+"</h3><div class='detail-row'><b>Państwo:</b> "+esc(c?.name||"")+"</div><div class='detail-row'><b>Rola:</b> "+esc(r.role||"—")+"</div><div class='detail-row'><b>Poziom:</b> "+r.level+"</div><div class='detail-row'><b>Okres:</b> "+esc(periodText)+"</div>"+(r.notes?"<div class='detail-row'><b>Uwagi:</b><br>"+esc(r.notes)+"</div>":"")+"<div class='dialog-actions'><button id='editRulerBtn' class='primary'>Edytuj</button></div>";
 document.getElementById("editRulerBtn").onclick=()=>openEditRuler(r);
 document.getElementById("detailsPanel").classList.remove("hidden")
}
function openEditRuler(r){
 selectedRuler=r;
 document.getElementById("editRulerCountry").innerHTML=state.countries.map(c=>"<option value='"+esc(c.id)+"'>"+esc(c.name)+"</option>").join("");
 document.getElementById("editRulerCountry").value=r.countryId;
 document.getElementById("editRulerName").value=r.name||"";
 document.getElementById("editRulerRole").value=r.role||"";
 document.getElementById("editRulerLevel").value=String(r.level||1);
 document.getElementById("editRulerStart").value=r.start||"";
 document.getElementById("editRulerEnd").value=r.end||"";
 document.getElementById("editRulerNotes").value=r.notes||"";
 document.getElementById("editRulerColor").value=r.color||"#90caf9";
 document.getElementById("editRulerDialog").showModal()
}
function saveEditedRuler(){
 if(!selectedRuler)return;
 selectedRuler.countryId=document.getElementById("editRulerCountry").value;
 selectedRuler.name=document.getElementById("editRulerName").value.trim();
 selectedRuler.role=document.getElementById("editRulerRole").value.trim();
 selectedRuler.level=+document.getElementById("editRulerLevel").value||1;
 selectedRuler.start=document.getElementById("editRulerStart").value.trim();
 selectedRuler.end=document.getElementById("editRulerEnd").value.trim();
 normalizeRulerDates(selectedRuler);
 selectedRuler.notes=document.getElementById("editRulerNotes").value.trim();
 selectedRuler.color=document.getElementById("editRulerColor").value;
 render();
 showDetails(selectedRuler);
 document.getElementById("editRulerDialog").close()
}
function addCountry(name,code){state.countries.push({id:uid(),name,code,order:state.countries.length+1});render()}
function addRuler(r){normalizeRulerDates(r);state.rulers.push({...r,id:uid(),level:+r.level});render()}
async function saveSheet(){
 const url=String(localStorage.getItem("wthScriptUrl")||DEFAULT_SCRIPT_URL).trim();
 if(!url){alert("Najpierw w Ustawieniach wpisz adres Google Apps Script do zapisu.");return false}
 const rows=state.rulers.map(r=>{const c=state.countries.find(x=>x.id===r.countryId);return{country:c?.name||"",name:r.name,role:r.role||"",level:+r.level||1,start:r.start||"",end:r.end||"",notes:r.notes||"",color:r.color||""}});
 try{
   await fetch(url,{method:"POST",redirect:"follow",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"replace",sheet:"GOV",rows})});
   alert("Dane zostały wysłane do tabeli GOV.");return true;
 }catch(err){alert("Nie udało się zapisać danych do GOV: "+err.message);return false}
}
function splitCsv(t){const rows=[];let row=[],cell="",q=false;for(let i=0;i<t.length;i++){const c=t[i],n=t[i+1];if(c==='"'){if(q&&n==='"'){cell+='"';i++}else q=!q}else if(c===','&&!q){row.push(cell);cell=""}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=""}else cell+=c}row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows}
function normalizeSheetUrl(url){url=String(url||"").trim();if(!url)return "";const m=url.match(/docs\.google\.com\/spreadsheets\/d\/([^/]+)/);if(m){const id=m[1];return "https://docs.google.com/spreadsheets/d/"+id+"/gviz/tq?tqx=out:csv&sheet=GOV"}return url}
async function loadSheet(url){
 const scriptUrl=String(localStorage.getItem("wthScriptUrl")||DEFAULT_SCRIPT_URL).trim();
 if(!scriptUrl)throw Error("Brak adresu Google Apps Script.");
 const res=await fetch(scriptUrl,{cache:"no-store"});
 if(!res.ok)throw Error("Nie udało się pobrać danych z Google Apps Script.");
 const data=await res.json();
 if(!data.ok)throw Error(data.error||"Google Apps Script zwrócił błąd.");
 const headers=Array.isArray(data.headers)?data.headers:[];
 const rows=Array.isArray(data.rows)?data.rows:[];
 if(!headers.length)throw Error("Arkusz GOV nie zawiera nagłówków.");
 const normalizeHeader=v=>String(v??"").replace(/^\uFEFF/,"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
 const h=headers.map(normalizeHeader);
 console.groupCollapsed("[WTH] Diagnostyka GOV — Apps Script");
 console.log("URL źródłowy:",scriptUrl);
 console.log("Nagłówki:",headers);
 console.log("Pierwszy wiersz danych:",rows[0]||[]);
 console.groupEnd();
 const get=(r,...ns)=>{for(const n of ns){const wanted=normalizeHeader(n);for(let i=0;i<h.length;i++){if(h[i]===wanted){const v=String(r[i]??"").trim();if(v)return v}}}return ""};
 const cs=[],rs=[],map=new Map();
 rows.forEach((row,i)=>{
   const cn=get(row,"kraj","country","państwo","panstwo");if(!cn)return;
   let id=map.get(cn);
   if(!id){id="c"+map.size;map.set(cn,id);cs.push({id,name:cn,code:"",order:cs.length+1})}
   const rawName=get(row,"władca","wladca","osoba","person","imię i nazwisko","imie i nazwisko");
   const name=cleanImportedText(rawName);
   if(name){
     const parsed={id:"s"+i,countryId:id,name,role:cleanImportedText(get(row,"funkcja","rola","role","stanowisko")),level:+get(row,"poziom","level")||1,start:get(row,"od","start","data od","start_date","początek","poczatek"),end:get(row,"do","end","data do","end_date","koniec"),notes:get(row,"uwagi","notes","opis"),color:get(row,"kolor","color")||"#90caf9"};
     normalizeRulerDates(parsed);
     if(!parsed.start)parsed.start=parsed.end;
     if(isValidRulerDateRange(parsed)){
       rs.push(parsed);
     }else{
       console.warn("[WTH] Pominięto rekord z nieprawidłowym okresem:",{wiersz:i+2,nazwa:name,od:parsed.start,do:parsed.end,row});
     }
     if(/^(Bronisław Komorowski|Andrzej Duda)$/i.test(name)){
       console.group("[WTH] Diagnostyka osoby:",name);
       console.log("Cały wiersz:",row);
       console.log("Odczyt Od:",parsed.start,"Odczyt Do:",parsed.end);
       console.log("Obiekt zapisany do state.rulers:",parsed);
       console.groupEnd();
     }
   }
 });
 if(!rs.length)throw Error("Arkusz został pobrany, ale nie znaleziono osób.");
 state.countries=cs;state.rulers=rs;applySavedCountryOrder();applySavedCountryWidths();render();
}
document.getElementById("addCountryBtn").onclick=()=>document.getElementById("countryDialog").showModal();
document.getElementById("saveEditRulerBtn").onclick=e=>{e.preventDefault();const name=document.getElementById("editRulerName").value.trim(),start=document.getElementById("editRulerStart").value.trim();if(!name||!start){alert("Imię i nazwisko oraz data rozpoczęcia są wymagane.");return}saveEditedRuler()};
document.getElementById("addRulerBtn").onclick=()=>{document.getElementById("rulerCountry").innerHTML=state.countries.map(c=>"<option value='"+c.id+"'>"+esc(c.name)+"</option>").join("");document.getElementById("rulerDialog").showModal()};
document.querySelector("#countryForm button[value='cancel']").onclick=e=>{e.preventDefault();document.getElementById("countryDialog").close()};document.querySelector("#rulerForm button[value='cancel']").onclick=e=>{e.preventDefault();document.getElementById("rulerDialog").close()};document.querySelector("#settingsForm button[value='cancel']").onclick=e=>{e.preventDefault();document.getElementById("settingsDialog").close()};document.getElementById("saveCountryBtn").onclick=e=>{e.preventDefault();const n=document.getElementById("countryName").value.trim();if(n){addCountry(n,document.getElementById("countryCode").value.trim());document.getElementById("countryDialog").close();document.getElementById("countryForm").reset()}};
document.getElementById("saveRulerBtn").onclick=e=>{e.preventDefault();const r={countryId:document.getElementById("rulerCountry").value,name:document.getElementById("rulerName").value.trim(),role:document.getElementById("rulerRole").value.trim(),level:document.getElementById("rulerLevel").value,start:document.getElementById("rulerStart").value.trim(),end:document.getElementById("rulerEnd").value.trim(),notes:document.getElementById("rulerNotes").value.trim(),color:document.getElementById("rulerColor").value};if(r.name&&r.start){addRuler(r);document.getElementById("rulerDialog").close();document.getElementById("rulerForm").reset()}};
document.getElementById("settingsBtn").onclick=()=>{document.getElementById("sheetUrl").value=localStorage.getItem("wthSheetUrl")||DEFAULT_SHEET_URL;document.getElementById("scriptUrl").value=localStorage.getItem("wthScriptUrl")||DEFAULT_SCRIPT_URL;document.getElementById("showGrid").checked=state.showGrid;document.getElementById("settingsDialog").showModal()};
document.getElementById("reloadSheetBtn").onclick=async e=>{e.preventDefault();const u=document.getElementById("sheetUrl").value.trim(),scriptUrl=document.getElementById("scriptUrl").value.trim();localStorage.setItem("wthSheetUrl",u||DEFAULT_SHEET_URL);localStorage.setItem("wthScriptUrl",scriptUrl||DEFAULT_SCRIPT_URL);state.showGrid=document.getElementById("showGrid").checked;if(!u){render();document.getElementById("settingsDialog").close();return}try{await loadSheet(u);document.getElementById("settingsDialog").close()}catch(err){alert("Błąd: "+err.message)}};
document.getElementById("showGrid").onchange=e=>{state.showGrid=e.target.checked;render()};document.getElementById("rangeSelect").onchange=e=>{state.range=e.target.value;render()};document.getElementById("zoomInBtn").onclick=()=>{state.scale=Math.min(100,state.scale*1.25);render()};document.getElementById("zoomOutBtn").onclick=()=>{state.scale=Math.max(3,state.scale/1.25);render()};document.getElementById("fitBtn").onclick=()=>{const v=document.getElementById("diagramViewport"),b=bounds(),span=yf(b.max)-yf(b.min);state.scale=Math.max(3,Math.min(60,(v.clientHeight-90)/span));render()};document.getElementById("closeDetails").onclick=()=>document.getElementById("detailsPanel").classList.add("hidden");window.addEventListener("resize",render);
document.getElementById("diagramViewport").addEventListener("scroll",()=>{const b=bounds();renderFixedAxis(b);renderFixedCountryHeader()});
state.countries=[...countries];state.rulers=[...rulers];applySavedCountryOrder();applySavedCountryWidths();render();
async function initFromGOV(){
 const url=String(localStorage.getItem("wthSheetUrl")||DEFAULT_SHEET_URL).trim();
 if(!url)return;
 try{
   await loadSheet(url);
 }catch(err){
   console.warn("Nie udało się automatycznie wczytać GOV:",err);
 }
}
initFromGOV();
document.getElementById("saveSheetBtn").onclick=saveSheet;
document.getElementById("bulkColorBtn").onclick=toggleBulkMode;
document.getElementById("bulkApplyColorBtn").onclick=applyBulkColor;
document.getElementById("bulkClearBtn").onclick=clearBulkSelection;
document.querySelectorAll(".bulk-color").forEach(b=>b.onclick=()=>setBulkColor(b.dataset.color));
setBulkColor(bulkColor);