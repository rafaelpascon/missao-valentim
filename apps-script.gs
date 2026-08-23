/**
 * RSVP — Missão 6 Anos do Valentim
 * ----------------------------------
 * Este script grava as confirmações vindas do site direto numa Google Sheet.
 *
 * COMO USAR:
 * 1. Crie uma Google Sheet nova.
 * 2. Na primeira linha, coloque exatamente estes cabeçalhos:
 *    Timestamp | Nome | Pessoas | Dias | Mensagem | Cor
 * 3. Menu Extensões > Apps Script.
 * 4. Apague o conteúdo padrão e cole este arquivo inteiro.
 * 5. Clique em "Implantar" (Deploy) > "Nova implantação".
 *    - Tipo: "App da Web" (Web app)
 *    - Executar como: "Eu" (sua conta)
 *    - Quem pode acessar: "Qualquer pessoa" (Anyone)
 * 6. Copie a URL gerada (termina em /exec) e cole na constante RSVP_ENDPOINT
 *    dentro do missao-valentim.html.
 * 7. Toda vez que editar este script, precisa criar uma NOVA implantação
 *    (ou "Gerenciar implantações" > editar) pra atualizar a URL em produção.
 */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('RSVPs') || ss.getSheets()[0];
}

function doGet(e) {
  var sheet = getSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  var rows = data
    .filter(function (row) { return row.join('') !== ''; })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = getSheet_();
  var body = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    body.name || '',
    body.people || '',
    Array.isArray(body.days) ? body.days.join(', ') : (body.days || ''),
    body.msg || '',
    body.color || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
