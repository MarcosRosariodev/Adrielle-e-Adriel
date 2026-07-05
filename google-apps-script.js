var SHEET_ID = '18p10aoJBfD9ZAEzcOyueSiu5aNcLa0Nioofa2K3LMhE';

function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.tipo || '',
    data.nome || data.convidado || '',
    data.presenca || '',
    data.adultos || '',
    data.criancas || '',
    data.presente || '',
    data.valor || '',
    data.email || '',
    data.telefone || data.whatsapp || '',
    data.obs || '',
    data.txid || ''
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
