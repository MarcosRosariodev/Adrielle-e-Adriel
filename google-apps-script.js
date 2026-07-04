/*
 * Cole este código no Google Apps Script (Extensões > Apps Script) de uma
 * planilha do Google Sheets, para receber as confirmações de RSVP e as
 * seleções de presentes do site como novas linhas automaticamente.
 *
 * Troque SHEET_ID abaixo pelo ID da sua planilha — é o trecho da URL entre
 * "/d/" e "/edit", por exemplo:
 * https://docs.google.com/spreadsheets/d/ESTE_TRECHO_AQUI/edit
 *
 * Depois de colar:
 * 1. Implantar > Nova implantação > tipo "Aplicativo da Web"
 * 2. Executar como: Eu
 * 3. Quem pode acessar: Qualquer pessoa
 * 4. Copie a URL gerada e me envie — ela vai virar SHEETS_WEBHOOK_URL.
 */

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
