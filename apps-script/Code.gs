const SPREADSHEET_ID = "1TmRHJDv6IMlGwg761JV50M8vS4zXTdWBtjDziAleSQI";
const SHEET_NAME = "GOV";
const HEADERS = ["ID","Kraj","Władca","Funkcja","Kategoria","Poziom","Od","Do","Uwagi","Kolor"];

function normalizeText(v) {
  return String(v == null ? "" : v).trim();
}

function normalizeCategory(v) {
  const s = normalizeText(v).toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map = {
    wladza:"wladza",wladze:"wladza",rzady:"wladza",rzad:"wladza",
    kultura:"kultura",kulturalna:"kultura",
    religia:"religia",religijna:"religia",kosciol:"religia",
    nauka:"nauka",naukowa:"nauka",
    wojsko:"wojsko",wojskowa:"wojsko",militaria:"wojsko",
    gospodarka:"gospodarka",gospodarcza:"gospodarka",ekonomia:"gospodarka",
    spoleczenstwo:"spoleczenstwo",spoleczna:"spoleczenstwo",
    inne:"inne",nieokreslone:"nieokreslone",nieznana:"nieokreslone"
  };
  return map[s] || "";
}

function inferCategory(role) {
  const s = normalizeText(role).toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!s) return "";
  if (/bp\b|biskup|opat|proboszcz|wikary|wikariusz|ksiadz|duchown|kanonik|arcybiskup|papiez/.test(s)) return "religia";
  if (/general|wojsk|marszalek|dowodca|oficer|major|kapitan|pulownik/.test(s)) return "wojsko";
  if (/premier|prezydent|burmistrz|nadburmistrz|wojt|kanclerz|komisarz rzadu|senatu|senator|ksiaze|krol|cesarz|sultan|car|wladca|minister|przewodniczacy|prezes rady/.test(s)) return "wladza";
  if (/malarz|architekt|rzezbiarz|zlotnik|bursztynnik|muzyk|kompozytor|pisarz|poeta|artyst|aktor|budownic|projektant|fotograf|grafik/.test(s)) return "kultura";
  if (/profesor|naukow|uczony|lekarz|astronom|matematyk|historyk|filozof|badacz/.test(s)) return "nauka";
  if (/kupiec|bankier|przemyslow|przedsiebior|rzemieslnik|handlarz|ekonom|finans/.test(s)) return "gospodarka";
  if (/chlop|robotnik|dzialacz|spolecz|radny|mieszczan|szlachcic/.test(s)) return "spoleczenstwo";
  return "";
}

function normalizeDateValue(value) {
  const s = normalizeText(value);
  if (!s) return "";
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n >= 30000 && n <= 80000) {
      const d = new Date(Date.UTC(1899,11,30) + Math.round(n) * 86400000);
      return Utilities.formatDate(d, "UTC", "yyyy-MM-dd");
    }
  }
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) return m[3] + "-" + String(+m[2]).padStart(2,"0") + "-" + String(+m[1]).padStart(2,"0");
  m = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (m) return m[1] + "-" + String(+m[2]).padStart(2,"0") + "-" + String(+m[3]).padStart(2,"0");
  m = s.match(/^(\d{1,2})[./-](\d{4})$/);
  if (m) return String(+m[2]) + "-" + String(+m[1]).padStart(2,"0");
  return s.replace(/\s+/g, " ").trim();
}

function normalizeHeader(v) {
  return normalizeText(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ");
}

function columnMap(headers) {
  const map = {};
  headers.forEach((h,i) => map[normalizeHeader(h)] = i);
  return map;
}

function getByAliases(row, map, aliases) {
  for (const alias of aliases) {
    const i = map[normalizeHeader(alias)];
    if (i != null && row[i] != null && normalizeText(row[i]) !== "") return normalizeText(row[i]);
  }
  return "";
}

function readRows(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0] || [];
  const map = columnMap(headers);
  return values.slice(1).map((row, i) => {
    const id = getByAliases(row,map,["ID","Id","id"]) || ("gov-" + (i + 2));
    const role = getByAliases(row,map,["Funkcja","Rola","Role","Stanowisko"]);
    let category = normalizeCategory(getByAliases(row,map,["Kategoria","Category"]));
    if (!category) category = inferCategory(role);
    return {
      id:id,
      country:getByAliases(row,map,["Kraj","Country","Państwo","Panstwo"]),
      name:getByAliases(row,map,["Władca","Wladca","Osoba","Person","Imię i nazwisko","Imie i nazwisko"]),
      role:role,
      category:category,
      level:Number(getByAliases(row,map,["Poziom","Level"])) || 1,
      start:normalizeDateValue(getByAliases(row,map,["Od","Start","Data od","Start date","Początek","Poczatek"])),
      end:normalizeDateValue(getByAliases(row,map,["Do","End","Data do","End date","Koniec"])),
      notes:getByAliases(row,map,["Uwagi","Notes","Opis"]),
      color:getByAliases(row,map,["Kolor","Color"]) || "#90caf9"
    };
  }).filter(r => r.country || r.name || r.role || r.start || r.end);
}

function writeCanonical(sheet, rows) {
  const values = [HEADERS].concat(rows.map(r => [
    r.id || Utilities.getUuid(),
    r.country || "",
    r.name || "",
    r.role || "",
    normalizeCategory(r.category) || inferCategory(r.role),
    Number(r.level) || 1,
    normalizeDateValue(r.start),
    normalizeDateValue(r.end),
    r.notes || "",
    r.color || "#90caf9"
  ]));
  sheet.clearContents();
  sheet.getRange(1,1,values.length,HEADERS.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,HEADERS.length).setFontWeight("bold");
  sheet.autoResizeColumns(1, HEADERS.length);
}

function doGet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Nie znaleziono zakładki GOV.");
    const rows = readRows(sheet);
    return ContentService.createTextOutput(JSON.stringify({
      ok:true, service:"Wielka tabela historyczna", sheet:SHEET_NAME,
      headers:HEADERS, rows:rows.map(r=>[
        r.id,r.country,r.name,r.role,r.category,r.level,r.start,r.end,r.notes,r.color
      ])
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData && e.postData.contents || "{}");
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Nie znaleziono zakładki GOV.");

    if (data.action === "replace") {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      writeCanonical(sheet, rows);
      return ContentService.createTextOutput(JSON.stringify({ok:true,count:rows.length,headers:HEADERS}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "normalize") {
      const before = readRows(sheet);
      writeCanonical(sheet, before);
      return ContentService.createTextOutput(JSON.stringify({
        ok:true, action:"normalize", count:before.length, headers:HEADERS
      })).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Nieznana operacja.");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
