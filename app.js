const DEFAULT_SHEET_URL="https://docs.google.com/spreadsheets/d/1TmRHJDv6IMlGwg761JV50M8vS4zXTdWBtjDziAleSQI/edit?gid=1757130608#gid=1757130608";
const DEFAULT_SCRIPT_URL="https://script.google.com/macros/s/AKfycbwrk-U1vMirSYRVmq2Fqaw1waW4TUIifx8jB_J5hWxEvWgBrnW9I8oWx64dirmbVfo/exec";
const state={countries:[],rulers:[],scale:18,showGrid:true,range:"auto"};
const LEVEL_WIDTHS=[2.1,1.35,.9,.65];
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
function parseDate(s,isEnd){if(!s)return new Date();s=String(s).trim().replace(/\./g,"/");let m;if(/^[-+]?\d{1,6}$/.test(s)){const y=Number(s);return new Date(Date.UTC(y,6,1))}m=s.match(/^(\d{1,2})[\/-](\d{4})$/);if(m){const y=+m[2],mo=+m[1]-1;return new Date(Date.UTC(y,mo,isEnd?new Date(Date.UTC(y,mo+1,0)).getUTCDate():1))}m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return new Date(Date.UTC(+m[3],+m[2]-1,+m[1]));m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(m)return new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return new Date(s)}
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
function normalizeRulerDates(r){
 const range=splitDateRange(r.start);
 if(range){r.start=range.start;if(!r.end)r.end=range.end;}
 return r;
}
function yf(d){return d.getTime()/31557600000}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",[String.fromCharCode(34)]:"&quot;","'":"&#39;"}[c]))}
function bounds(){const ds=[];state.rulers.forEach(r=>{ds.push(parseDate(r.start,false),parseDate(r.end,true))});const now=new Date();let max=ds.length?new Date(Math.max(...ds)):now;let min=ds.length?new Date(Math.min(...ds)):new Date(now.getFullYear()-100,0,1);if(state.range!=="auto"){max=now;min=new Date(now.getFullYear()-Number(state.range),0,1)}const pad=365.25*24*60*60*1000;max=new Date(max.getTime()+pad);min=new Date(min.getTime()-pad);return{min,max}}
function render(){
 const b=bounds();
 const top=62;
 const axisX=58;
 const left=92;
 const yearH=(yf(b.max)-yf(b.min))*state.scale;
 const countryW=190;
 const gap=18;
 const width=left+state.countries.length*(countryW+gap)+30;
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
   const nowLabel=document.createElementNS(NS,"text");nowLabel.setAttribute("x",axisX+16);nowLabel.setAttribute("y",nowY-6);nowLabel.setAttribute("font-size","11");nowLabel.setAttribute("font-weight","700");nowLabel.setAttribute("fill","#c2410c");nowLabel.textContent="TERAŹNIEJSZOŚĆ";svg.appendChild(nowLabel);
 }
 state.countries.forEach((c,ci)=>{
   const x=left+ci*(countryW+gap);
   const head=document.createElementNS(NS,"rect");head.setAttribute("x",x);head.setAttribute("y",10);head.setAttribute("width",countryW);head.setAttribute("height",40);head.setAttribute("rx",6);head.setAttribute("fill","#eef2f6");head.setAttribute("stroke","#c9d0d8");svg.appendChild(head);
   const ct=document.createElementNS(NS,"text");ct.setAttribute("x",x+countryW/2);ct.setAttribute("y",35);ct.setAttribute("text-anchor","middle");ct.setAttribute("font-size","14");ct.setAttribute("font-weight","700");ct.textContent=c.name;svg.appendChild(ct);
   const rs=state.rulers.filter(r=>r.countryId===c.id);
   const unit=countryW/5;
   const offsets=[0,LEVEL_WIDTHS[0],LEVEL_WIDTHS[0]+LEVEL_WIDTHS[1],LEVEL_WIDTHS[0]+LEVEL_WIDTHS[1]+LEVEL_WIDTHS[2]];
   for(let level=1;level<=4;level++){
     const laneX=x+offsets[level-1]*unit;
     const laneW=LEVEL_WIDTHS[level-1]*unit;
     const rr=rs.filter(r=>+r.level===level);
     const slots=[];
     rr.sort((a,b)=>parseDate(a.start)-parseDate(b.start));
     rr.forEach(r=>{
       const s=parseDate(r.start,false),e=parseDate(r.end,true);
       let slot=0;while(slots[slot]&&slots[slot].some(o=>o.s<e&&s<o.e))slot++;
       if(!slots[slot])slots[slot]=[];slots[slot].push({s,e});r._slot=slot;
     });
     const slotCount=Math.max(1,slots.length);
     rr.forEach(r=>{
       const startDate=parseDate(r.start,false),endDate=parseDate(r.end,true);
       const yStart=yFor(startDate),yEnd=yFor(endDate);
       const ry=Math.min(yStart,yEnd),rh=Math.max(4,Math.abs(yEnd-yStart)),rw=laneW/slotCount,rx=laneX+(r._slot||0)*rw+1;
       const rect=document.createElementNS(NS,"rect");rect.setAttribute("x",rx);rect.setAttribute("y",ry);rect.setAttribute("width",Math.max(4,rw-2));rect.setAttribute("height",rh);rect.setAttribute("rx",3);rect.setAttribute("fill",r.color||"hsl("+((ci*71+level*43)%360)+" 62% 78%)");rect.setAttribute("stroke","#59636f");rect.setAttribute("stroke-width","1");rect.setAttribute("class","ruler-block");rect.addEventListener("click",()=>showDetails(r));svg.appendChild(rect);
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
 document.getElementById("countryCount").textContent=state.countries.length;
 document.getElementById("rulerCount").textContent=state.rulers.length;
 document.getElementById("scaleLabel").textContent="1 rok ≈ "+state.scale.toFixed(1)+" px";
}
let selectedRuler=null;
function showDetails(r){
 selectedRuler=r;
 const c=state.countries.find(x=>x.id===r.countryId);
 document.getElementById("detailsContent").innerHTML="<h3>"+esc(r.name)+"</h3><div class='detail-row'><b>Państwo:</b> "+esc(c?.name||"")+"</div><div class='detail-row'><b>Rola:</b> "+esc(r.role||"—")+"</div><div class='detail-row'><b>Poziom:</b> "+r.level+"</div><div class='detail-row'><b>Okres:</b> "+esc(r.start)+" – "+esc(r.end||"dziś")+"</div>"+(r.notes?"<div class='detail-row'><b>Uwagi:</b><br>"+esc(r.notes)+"</div>":"")+"<div class='dialog-actions'><button id='editRulerBtn' class='primary'>Edytuj</button></div>";
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
 const sourceUrl=normalizeSheetUrl(url),res=await fetch(sourceUrl,{cache:"no-store"});
 if(!res.ok)throw Error("Nie udało się pobrać arkusza. Sprawdź, czy arkusz jest publiczny lub opublikowany.");
 const text=await res.text();if(!text.trim())throw Error("Arkusz jest pusty.");
 const rows=splitCsv(text);if(rows.length<2)throw Error("Arkusz nie zawiera wierszy danych.");
 const normalizeHeader=v=>String(v??"").replace(/^\uFEFF/,"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
 const h=rows[0].map(normalizeHeader);
 console.groupCollapsed("[WTH] Diagnostyka GOV — nagłówki");
 console.log("URL źródłowy:",sourceUrl);
 console.log("Nagłówki surowe:",rows[0]);
 console.log("Nagłówki znormalizowane:",h);
 console.log("Pierwszy wiersz danych:",rows[1]||[]);
 console.groupEnd();
 const get=(r,...ns)=>{for(const n of ns){const wanted=normalizeHeader(n);for(let i=0;i<h.length;i++){if(h[i]===wanted){const v=String(r[i]??"").trim();if(v)return v}}}return ""};
 const dateValue=(r,...ns)=>{const v=get(r,...ns);if(v)return v;const fallback=ns.includes("od")?r[4]:ns.includes("do")?r[5]:"";return String(fallback??"").trim()};
 const cs=[],rs=[],map=new Map();
 rows.slice(1).forEach((row,i)=>{const cn=get(row,"kraj","country","państwo","panstwo");if(!cn)return;let id=map.get(cn);if(!id){id="c"+map.size;map.set(cn,id);cs.push({id,name:cn,code:"",order:cs.length+1})}const name=get(row,"władca","wladca","osoba","person","imię i nazwisko","imie i nazwisko");if(name){const start=dateValue(row,"od","start","data od","start_date","początek","poczatek"),end=dateValue(row,"do","end","data do","end_date","koniec");const parsed={id:"s"+i,countryId:id,name,role:get(row,"funkcja","rola","role","stanowisko"),level:+get(row,"poziom","level")||1,start,end,notes:get(row,"uwagi","notes","opis"),color:get(row,"kolor","color")||"#90caf9"};rs.push(parsed);if(/^(Bronisław Komorowski|Andrzej Duda)$/i.test(name)){console.group("[WTH] Diagnostyka osoby:",name);console.log("Numer wiersza CSV (od 0):",i+1);console.log("Cały wiersz:",row);console.log("Wartości E/F:",row[4],row[5]);console.log("Odczyt Od:",start,"Odczyt Do:",end);console.log("Obiekt zapisany do state.rulers:",parsed);console.groupEnd()}}}});
 if(!rs.length)throw Error("Arkusz został pobrany, ale nie znaleziono osób. W pierwszym wierszu muszą być kolumny np. Kraj | Władca | Funkcja | Poziom | Od | Do | Uwagi.");
 state.countries=cs;state.rulers=rs;render();
}
document.getElementById("addCountryBtn").onclick=()=>document.getElementById("countryDialog").showModal();
document.getElementById("saveEditRulerBtn").onclick=e=>{e.preventDefault();const name=document.getElementById("editRulerName").value.trim(),start=document.getElementById("editRulerStart").value.trim();if(!name||!start){alert("Imię i nazwisko oraz data rozpoczęcia są wymagane.");return}saveEditedRuler()};
document.getElementById("addRulerBtn").onclick=()=>{document.getElementById("rulerCountry").innerHTML=state.countries.map(c=>"<option value='"+c.id+"'>"+esc(c.name)+"</option>").join("");document.getElementById("rulerDialog").showModal()};
document.querySelector("#countryForm button[value='cancel']").onclick=e=>{e.preventDefault();document.getElementById("countryDialog").close()};document.querySelector("#rulerForm button[value='cancel']").onclick=e=>{e.preventDefault();document.getElementById("rulerDialog").close()};document.querySelector("#settingsForm button[value='cancel']").onclick=e=>{e.preventDefault();document.getElementById("settingsDialog").close()};document.getElementById("saveCountryBtn").onclick=e=>{e.preventDefault();const n=document.getElementById("countryName").value.trim();if(n){addCountry(n,document.getElementById("countryCode").value.trim());document.getElementById("countryDialog").close();document.getElementById("countryForm").reset()}};
document.getElementById("saveRulerBtn").onclick=e=>{e.preventDefault();const r={countryId:document.getElementById("rulerCountry").value,name:document.getElementById("rulerName").value.trim(),role:document.getElementById("rulerRole").value.trim(),level:document.getElementById("rulerLevel").value,start:document.getElementById("rulerStart").value.trim(),end:document.getElementById("rulerEnd").value.trim(),notes:document.getElementById("rulerNotes").value.trim(),color:document.getElementById("rulerColor").value};if(r.name&&r.start){addRuler(r);document.getElementById("rulerDialog").close();document.getElementById("rulerForm").reset()}};
document.getElementById("settingsBtn").onclick=()=>{document.getElementById("sheetUrl").value=localStorage.getItem("wthSheetUrl")||DEFAULT_SHEET_URL;document.getElementById("scriptUrl").value=localStorage.getItem("wthScriptUrl")||DEFAULT_SCRIPT_URL;document.getElementById("showGrid").checked=state.showGrid;document.getElementById("settingsDialog").showModal()};
document.getElementById("reloadSheetBtn").onclick=async e=>{e.preventDefault();const u=document.getElementById("sheetUrl").value.trim(),scriptUrl=document.getElementById("scriptUrl").value.trim();localStorage.setItem("wthSheetUrl",u||DEFAULT_SHEET_URL);localStorage.setItem("wthScriptUrl",scriptUrl||DEFAULT_SCRIPT_URL);state.showGrid=document.getElementById("showGrid").checked;if(!u){render();document.getElementById("settingsDialog").close();return}try{await loadSheet(u);document.getElementById("settingsDialog").close()}catch(err){alert("Błąd: "+err.message)}};
document.getElementById("showGrid").onchange=e=>{state.showGrid=e.target.checked;render()};document.getElementById("rangeSelect").onchange=e=>{state.range=e.target.value;render()};document.getElementById("zoomInBtn").onclick=()=>{state.scale=Math.min(100,state.scale*1.25);render()};document.getElementById("zoomOutBtn").onclick=()=>{state.scale=Math.max(3,state.scale/1.25);render()};document.getElementById("fitBtn").onclick=()=>{const v=document.getElementById("diagramViewport"),b=bounds(),span=yf(b.max)-yf(b.min);state.scale=Math.max(3,Math.min(60,(v.clientHeight-90)/span));render()};document.getElementById("closeDetails").onclick=()=>document.getElementById("detailsPanel").classList.add("hidden");window.addEventListener("resize",render);
state.countries=countries;state.rulers=rulers;render();
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