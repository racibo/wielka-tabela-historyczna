const SHEET_NAME = "GOV";
const HEADERS = ["Kraj","Władca","Funkcja","Poziom","Od","Do","Uwagi","Kolor"];

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Nie znaleziono zakładki GOV.");
    const values = sheet.getDataRange().getDisplayValues();
    return ContentService
      .createTextOutput(JSON.stringify({ok:true,service:"Wielka tabela historyczna",sheet:SHEET_NAME,headers:values[0]||[],rows:values.slice(1)}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:String(err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    if (data.action !== "replace") throw new Error("Nieznana operacja.");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("Nie znaleziono zakładki GOV.");

    const rows = Array.isArray(data.rows) ? data.rows : [];
    const values = [HEADERS].concat(rows.map(r => [
      r.country || "",
      r.name || "",
      r.role || "",
      Number(r.level) || 1,
      r.start || "",
      r.end || "",
      r.notes || "",
      r.color || ""
    ]));

    sheet.clearContents();
    sheet.getRange(1, 1, values.length, HEADERS.length).setValues(values);
    sheet.setFrozenRows(1);

    return ContentService
      .createTextOutput(JSON.stringify({ok:true,count:rows.length}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:String(err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}