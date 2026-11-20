// Cole este código em Extensões > Apps Script, dentro da sua planilha.
// Compatível com o script.js novo: access, start, progress, abandon, complete e estatisticas (JSONP).

var ABA_ACESSOS = 'DISC_Acessos';
var ABA_RESPOSTAS = 'DISC_Respostas';
var CAB_ACESSOS = ['ID', 'Data/hora'];
var CAB_RESP = ['ID', 'Início', 'Última atualização', 'Status', 'P1', 'P2', 'P3', 'P4', 'P5', 'Resultado', 'D', 'I', 'S', 'C'];
var ST_INICIOU = 'Iniciou', ST_ANDAMENTO = 'Em andamento', ST_ABANDONOU = 'Abandonou', ST_CONCLUIDO = 'Concluído';

function aba_(nome, cab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(cab);
    sh.setFrozenRows(1);
  }
  return sh;
}

function saida_(obj, cb) {
  var txt = JSON.stringify(obj);
  if (cb && /^[A-Za-z0-9_.$]+$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + txt + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(txt).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!p.acao || p.acao === 'estatisticas') return saida_(estatisticas_(), p.callback);
  return saida_({ ok: false, erro: 'acao invalida' }, p.callback);
}

// última linha (mais recente) de um ID na aba de respostas; 0 se não existir
function ultimaLinha_(sh, id) {
  var n = sh.getLastRow();
  if (n < 2) return 0;
  var ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === id) return i + 2;
  }
  return 0;
}

function novaLinha_(sh, id) {
  var agora = new Date();
  sh.appendRow([id, agora, agora, ST_INICIOU, '', '', '', '', '', '', '', '', '', '']);
  return sh.getLastRow();
}

// linha em aberto do ID; cria uma nova se não existir ou se a anterior já foi concluída
function linhaAtiva_(sh, id) {
  var row = ultimaLinha_(sh, id);
  if (!row || sh.getRange(row, 4).getValue() === ST_CONCLUIDO) row = novaLinha_(sh, id);
  return row;
}

function respostasValidas_(r, completa) {
  if (!r || r.length !== 5) return false;
  for (var i = 0; i < 5; i++) {
    if (r[i] === '' && !completa) continue;
    if (typeof r[i] !== 'string' || r[i].length !== 1 || 'ABCD'.indexOf(r[i]) < 0) return false;
  }
  return true;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var travou = false;
  try {
    var d = JSON.parse(e.postData.contents);
    var id = String(d.id || '');
    if (!/^DISC-[A-Za-z0-9-]{5,60}$/.test(id)) return saida_({ ok: false, erro: 'id invalido' });
    lock.waitLock(20000);
    travou = true;
    var agora = new Date();

    if (d.acao === 'access') {
      var ac = aba_(ABA_ACESSOS, CAB_ACESSOS);
      var n = ac.getLastRow();
      var existe = false;
      if (n > 1) {
        var ids = ac.getRange(2, 1, n - 1, 1).getValues();
        for (var i = 0; i < ids.length; i++) { if (ids[i][0] === id) { existe = true; break; } }
      }
      if (!existe) ac.appendRow([id, agora]);

    } else {
      var sh = aba_(ABA_RESPOSTAS, CAB_RESP);

      if (d.acao === 'start') {
        linhaAtiva_(sh, id);

      } else if (d.acao === 'progress') {
        if (!respostasValidas_(d.respostas, false)) return saida_({ ok: false, erro: 'respostas invalidas' });
        var r1 = linhaAtiva_(sh, id);
        var tem = d.respostas.join('') !== '';
        sh.getRange(r1, 3).setValue(agora);
        sh.getRange(r1, 4).setValue(tem ? ST_ANDAMENTO : ST_INICIOU);
        sh.getRange(r1, 5, 1, 5).setValues([d.respostas]);

      } else if (d.acao === 'abandon') {
        var r2 = ultimaLinha_(sh, id);
        if (r2 && sh.getRange(r2, 4).getValue() !== ST_CONCLUIDO) {
          sh.getRange(r2, 3).setValue(agora);
          sh.getRange(r2, 4).setValue(ST_ABANDONOU);
        }

      } else if (d.acao === 'complete') {
        if (!respostasValidas_(d.respostas, true)) return saida_({ ok: false, erro: 'respostas invalidas' });
        var pt = d.pontuacoes || {};
        var v = [pt.D, pt.I, pt.S, pt.C].map(function (x) { return Math.max(0, Math.min(5, parseInt(x, 10) || 0)); });
        var r3 = ultimaLinha_(sh, id);
        if (!r3) r3 = novaLinha_(sh, id);
        if (sh.getRange(r3, 4).getValue() !== ST_CONCLUIDO) {   // ignora envio duplicado
          sh.getRange(r3, 3, 1, 12).setValues([[agora, ST_CONCLUIDO].concat(d.respostas, [String(d.resultado || '').slice(0, 80)], v)]);
        }
      } else {
        return saida_({ ok: false, erro: 'acao invalida' });
      }
    }
    return saida_({ ok: true });
  } catch (err) {
    return saida_({ ok: false, erro: String(err) });
  } finally {
    if (travou) lock.releaseLock();
  }
}

function estatisticas_() {
  var ac = aba_(ABA_ACESSOS, CAB_ACESSOS);
  var sh = aba_(ABA_RESPOSTAS, CAB_RESP);
  var out = { ok: true, totalAcessos: Math.max(0, ac.getLastRow() - 1), iniciados: 0, concluidos: 0, abandonados: 0,
              dominancia: 0, influencia: 0, estabilidade: 0, conformidade: 0 };
  var n = sh.getLastRow() - 1;
  if (n > 0) {
    var v = sh.getRange(2, 1, n, 14).getValues();
    for (var i = 0; i < v.length; i++) {
      var st = v[i][3];
      out.iniciados++;
      if (st === ST_ABANDONOU) out.abandonados++;
      if (st === ST_CONCLUIDO) {
        out.concluidos++;
        out.dominancia += Number(v[i][10]) || 0;
        out.influencia += Number(v[i][11]) || 0;
        out.estabilidade += Number(v[i][12]) || 0;
        out.conformidade += Number(v[i][13]) || 0;
      }
    }
  }
  return out;
}
