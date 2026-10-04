const DEFAULT_SHEET_URL="https://docs.google.com/spreadsheets/d/1TmRHJDv6IMlGwg761JV50M8vS4zXTdWBtjDziAleSQI/edit?gid=1757130608#gid=1757130608";
const DEFAULT_SCRIPT_URL="https://script.google.com/macros/s/AKfycbwrk-U1vMirSYRVmq2Fqaw1waW4TUIifx8jB_J5hWxEvWgBrnW9I8oWx64dirmbVfo/exec";
const state={countries:[],rulers:[],scale:18,showGrid:true,range:"auto",sourceRows:[],activeCategories:new Set(["wladza","kultura","religia","nauka","wojsko","gospodarka","spoleczenstwo","inne","nieokreslone"])};
const LEVEL_WIDTHS=[1.95,1.2,.85,.65,.35];
const CATEGORY_ORDER=["wladza","kultura","religia","nauka","wojsko","gospodarka","spoleczenstwo","inne","nieokreslone"];
const CATEGORY_LABELS={wladza:"Władza",kultura:"Kultura",religia:"Religia",nauka:"Nauka",wojsko:"Wojsko",gospodarka:"Gospodarka",spoleczenstwo:"Społeczeństwo",inne:"Inne",nieokreslone:"Nieokreślone"};
const CATEGORY_WEIGHTS={wladza:3.0,kultura:1.9,religia:1.6,nauka:1.5,wojsko:1.5,gospodarka:1.4,spoleczenstwo:1.2,inne:1.0,nieokreslone:1.0};
function normalizeCategoryText(v){return String(v||"").toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
const CATEGORY_ALIASES={
 wladza:"wladza",wladze:"wladza",rzady:"wladza",rzad:"wladza",wladza:"wladza",
 kultura:"kultura",kulturalna:"kultura",
 religia:"religia",religijna:"religia",kosciol:"religia",
 nauka:"nauka",naukowa:"nauka",
 wojsko:"wojsko",wojskowa:"wojsko",militaria:"wojsko",
 gospodarka:"gospodarka",gospodarcza:"gospodarka",ekonomia:"gospodarka",
 spoleczenstwo:"spoleczenstwo",spoleczna:"spoleczenstwo",
 inne:"inne",nieokreslone:"nieokreslone",nieokreslona:"nieokreslone",
 nieznana:"nieokreslone","":""
};
function normalizeCategory(v){
 const key=normalizeCategoryText(v);
 return Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES,key)?CATEGORY_ALIASES[key]:"";
}
function inferCategory(r,c){
 const group=normalizeCategoryText(c?.name);
 if(group==="kultura gdanska")return "kultura";
 if(group==="cystersi i kosciol")return "religia";
 const role=normalizeCategoryText(r?.role).replace(/\s+/g," ").trim();
 if(!role)return "";
 if(/\bbp\.?\b|\bbiskup\b|\barcybiskup\b|\bopat\b|\bproboszcz\b|\bwikary\b|\bwikariusz\b|\bks\.?\b|\bksiadz\b|\bduchown/.test(role))return "religia";
 if(/\bgeneral\b|\bwojsk|\bmarszalek\b|\bdowodca\b|\boficer\b|\bmajor\b|\bkapitan\b|\bpulownik\b|\bpułkownik\b/.test(role))return "wojsko";
 if(/\bpremier\b|\bprezydent\b|\bburmistrz\b|\bnadburmistrz\b|\bwojt\b|\bkanclerz\b|\bkomisarz rzadu\b|\bsenatu\b|\bsenator\b|\bksiaze\b|\bkrol\b|\bcesarz\b|\bsultan\b|\bcar\b|\bwladca\b|\bminister\b|\bprzewodniczacy\b|\bprezes rady\b|\bstarosta\b|\bwojewoda\b/.test(role))return "wladza";
 if(/\bmalarz\b|\barchitekt\b|\brzezbiarz\b|\bzlotnik\b|\bbursztynnik\b|\bmuzyk\b|\bkompozytor\b|\bpisarz\b|\bpoeta\b|\bartyst|\baktor\b|\bbudownic|\bprojektant\b|\bfotograf\b|\bgrafik\b|\bdesigner\b/.test(role))return "kultura";
 if(/\bprofesor\b|\bnaukow|\buczony\b|\blekarz\b|\bastronom\b|\bmatematyk\b|\bhistoryk\b|\bfilozof\b|\bbadacz\b|\binzynier\b/.test(role))return "nauka";
 if(/\bkupiec\b|\bbankier\b|\bprzemyslow|\bprzedsiebior|\brzemieslnik\b|\bhandlarz\b|\bekonom|\bfinans/.test(role))return "gospodarka";
 if(/\bchlop\b|\brobotnik\b|\bdzialacz\b|\bspolecz|\bradny\b|\bmieszczan|\bszlachcic\b/.test(role))return "spoleczenstwo";
 return "";
}
function getRulerCategory(r){
 const explicit=normalizeCategory(r?.category);
 if(explicit)return explicit;
 const c=state.countries.find(x=>x.id===r.countryId);
 return inferCategory(r,c);
}
function getStoredCategory(r){
 return normalizeCategory(r?.category);
}
function renderCategoryFilter(){
 const host=document.getElementById("categoryFilter");if(!host)return;
 host.innerHTML="";
 CATEGORY_ORDER.forEach(key=>{
   const label=document.createElement("label");label.className="category-toggle";
   const cb=document.createElement("input");cb.type="checkbox";cb.checked=state.activeCategories.has(key);
   cb.addEventListener("change",()=>{if(cb.checked)state.activeCategories.add(key);else state.activeCategories.delete(key);render();});
   const span=document.createElement("span");span.textContent=CATEGORY_LABELS[key];
   label.append(cb,span);host.appendChild(label);
 });
}

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
{id:"1",countryId:"pl",name:"Andrzej Duda",role:"prezydent",category:"wladza",level:1,start:"2015",end:"2025",notes:"Dane demonstracyjne."},
{id:"2",countryId:"pl",name:"Donald Tusk",role:"premier",category:"wladza",level:2,start:"2023",end:"2026"},
{id:"3",countryId:"pl",name:"Mateusz Morawiecki",role:"premier",category:"wladza",level:2,start:"2017",end:"2023"},
{id:"4",countryId:"pt",name:"Marcelo Rebelo de Sousa",role:"prezydent",category:"wladza",level:1,start:"2016",end:"2026"},
{id:"5",countryId:"pt",name:"António Costa",role:"premier",category:"wladza",level:2,start:"2015",end:"2024"},
{id:"6",countryId:"pt",name:"Luís Montenegro",role:"premier",category:"wladza",level:2,start:"2024",end:"2026"},
{id:"7",countryId:"es",name:"Felipe VI",role:"król",category:"wladza",level:1,start:"2014",end:"2026"},
{id:"8",countryId:"es",name:"Pedro Sánchez",role:"premier",category:"wladza",level:2,start:"2018",end:"2026"}
];
function uid(){return (crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()))}
function normalizeSheetDateValue(value){
 if(value===null||value===undefined)return "";
 const serialToIso=n=>{
   if(!Number.isFinite(n)||n<30000||n>80000)return "";
   const d=new Date(Date.UTC(1899,11,30)+Math.round(n)*86400000);
   if(!Number.isFinite(d.getTime()))return "";
   const y=d.getUTCFullYear(),m=String(d.getUTCMonth()+1).padStart(2,"0"),day=String(d.getUTCDate()).padStart(2,"0");
   return y+"-"+m+"-"+day;
 };
 if(typeof value==="number"){
   const iso=serialToIso(value);
   if(iso)return iso;
 }
 let s=String(value).trim();
 if(!s)return "";
 if(/^\d+(?:\.\d+)?$/.test(s)){
   const iso=serialToIso(Number(s));
   if(iso)return iso;
 }
 s=s.replace(/\s+/g," ").trim();
 let m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
 if(m)return m[3]+"-"+String(+m[2]).padStart(2,"0")+"-"+String(+m[1]).padStart(2,"0");
 m=s.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
 if(m)return m[1]+"-"+String(+m[2]).padStart(2,"0")+"-"+String(+m[3]).padStart(2,"0");
 m=s.match(/^(\d{1,2})[.\/-](\d{4})$/);
 if(m)return String(+m[2])+"-"+String(+m[1]).padStart(2,"0");
 return s;
}
function formatDisplayDateValue(value){
 const s=String(value??"").trim();
 if(!s)return "";
 const iso=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(iso)return Number(iso[3])+"."+Number(iso[2])+"."+iso[1];
 const ym=s.match(/^(\d{4})-(\d{1,2})$/);
 if(ym)return Number(ym[2])+"."+ym[1];
 if(/^\d+(?:\.\d+)?$/.test(s)){
   const normalized=normalizeSheetDateValue(s);
   if(normalized!==s)return formatDisplayDateValue(normalized);
 }
 return s;
}
function parseDate(s,isEnd){
 if(!s)return new Date();
 s=normalizeSheetDateValue(s).replace(/\./g,"/");
 if(/^(dziś|dzisiaj|obecnie|aktualnie|today)$/i.test(s))return new Date();
 let m;
 if(/^[-+]?\d{1,6}$/.test(s)){
   const y=Number(s);
   // Rok bez dnia/miesiąca oznacza pełny rok kalendarzowy.
   return new Date(Date.UTC(y,isEnd?11:0,isEnd?31:1));
 }
 m=s.match(/^(\d{1,2})[\/-](\d{4})$/);
 if(m){const y=+m[2],mo=+m[1]-1;return new Date(Date.UTC(y,mo,isEnd?new Date(Date.UTC(y,mo+1,0)).getUTCDate():1))}
 m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
 if(m)return new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));
 m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
 if(m)return new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
 return new Date(s)
}
function yearOnly(value){
 const s=String(value??"").trim();
 return /^[-+]?\d{1,6}$/.test(s);
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
const CURRENT_REIGN_YEARS=10;
function getEffectiveRulerEndValue(r){
 const raw=String(r.end??"").trim();
 if(raw)return raw;
 const start=parseDate(String(r.start??"").trim(),false);
 if(!Number.isFinite(start.getTime()))return "";
 const currentYear=new Date().getFullYear();
 const startYear=start.getUTCFullYear();
 // Puste "Do" oznacza "do dziś" tylko dla rozpoczęć z ostatnich 10 lat.
 return currentYear-startYear<=CURRENT_REIGN_YEARS ? "__TODAY__" : String(startYear);
}
function parseRulerEnd(r){
 const effective=getEffectiveRulerEndValue(r);
 return effective==="__TODAY__"?new Date():parseDate(effective,true);
}
function isCurrentRuler(r){
 const raw=String(r.end??"").trim();
 if(/^(dziś|dzisiaj|obecnie|aktualnie|today)$/i.test(raw))return true;
 return !raw&&getEffectiveRulerEndValue(r)==="__TODAY__";
}
function isValidRulerDateRange(r){
 const start=parseDate(r.start,false);
 const end=parseRulerEnd(r);
 return Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&start<=end;
}
function yf(d){return d.getTime()/31557600000}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",[String.fromCharCode(34)]:"&quot;","'":"&#39;"}[c]))}
function bounds(){const now=new Date();const ds=[];state.rulers.forEach(r=>{const start=parseDate(r.start,false);const end=parseRulerEnd(r);if(Number.isFinite(start.getTime())&&start<=now)ds.push(start);if(Number.isFinite(end.getTime()))ds.push(end>now?now:end)});let max=now;let min=ds.length?new Date(Math.min(...ds)):new Date(now.getFullYear()-100,0,1);if(state.range!=="auto"){min=new Date(now.getFullYear()-Number(state.range),0,1)}const pad=365.25*24*60*60*1000;max=new Date(now.getTime()+pad);min=new Date(min.getTime()-pad);return{min,max}}
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
 const viewportRect=viewport.getBoundingClientRect();
 axisHost.style.top=Math.round(viewportRect.top)+"px";
 axisHost.style.height=h+"px";
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
;