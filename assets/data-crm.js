/* ==========================================================================
   ATLAS · data-crm.js — dados fictícios do módulo CRM Comercial
   Estende App.data.crm sem alterar os arrays compartilhados (empresas, contatos,
   equipe, negocios, tarefas, eventos). Tudo é lido por ID.
   Conteúdo:
     consultores · indicadores · diario (produção diária gerada, determinística)
     metas por mês · tempoEtapa · movimentos (histórico de etapas gerado a partir
     de criadoEm/entrouEtapaEm/fechadoEm) · atividades (explícitas + as que
     justificam cada mudança de etapa) · tarefas extras e tarefas concluídas
     geradas pelas automações · documentos · perdas e descartes · importação
     de planilha · consulta pública de CNPJ · CPF (protegido) dos contatos
   IDs do módulo: tarefas 6101+ (abertas) e 6201+ (concluídas) · atividades 11001+
   (explícitas) e 12001+ (geradas) · movimentos 13001+ · documentos 14001+.
   Data de referência: App.HOJE = segunda-feira 09/11/2026 09:30.
   ========================================================================== */
(function () {
  'use strict';
  var App = window.App, D = App.data, util = App.util;
  var C = D.crm = D.crm || {};
  var HOJE = util.hojeIso();
  var negocio = function (id) { for (var i = 0; i < D.negocios.length; i++) if (D.negocios[i].id === id) return D.negocios[i]; return null; };
  var empresa = function (id) { for (var i = 0; i < D.empresas.length; i++) if (D.empresas[i].id === id) return D.empresas[i]; return null; };
  var decisorDa = function (empId) { var l = D.contatos.filter(function (c) { return c.empresaId === empId; }); return (l.filter(function (c) { return c.decisor; })[0] || l[0] || {}).id; };
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------- Quem aparece no painel comercial (ordem fixa) ---------------- */
  C.consultores = [3, 4, 5, 2];

  /* ---------------- Indicadores da proposta (3.1) ---------------- */
  /* meta: tem meta mensal · ruim: subir é ruim · moeda: valor em R$ */
  C.indicadores = [
    { key: 'ligacoes', nome: 'Ligações feitas', curto: 'Ligações', icon: 'phone', meta: true },
    { key: 'agendadas', nome: 'Reuniões agendadas', curto: 'Agendadas', icon: 'calendar', meta: true },
    { key: 'realizadas', nome: 'Reuniões realizadas', curto: 'Realizadas', icon: 'users', meta: true },
    { key: 'naoRealizadas', nome: 'Reuniões não realizadas', curto: 'Não realizadas', icon: 'x-circle', meta: false, ruim: true },
    { key: 'reagendadas', nome: 'Reuniões reagendadas', curto: 'Reagendadas', icon: 'refresh', meta: false, ruim: true },
    { key: 'cartas', nome: 'Cartas propostas enviadas', curto: 'Cartas propostas', icon: 'send', meta: true },
    { key: 'apresentacoes', nome: 'Apresentações realizadas', curto: 'Apresentações', icon: 'presentation', meta: true },
    { key: 'contratos', nome: 'Contratos fechados', curto: 'Contratos', icon: 'file-text', meta: true },
    { key: 'valor', nome: 'Crédito contratado (contratos fechados)', curto: 'Crédito contratado', icon: 'dollar', meta: true, moeda: true }
  ];

  /* ---------------- Produção diária por consultor (gerada, determinística) ----------------
     Cada linha: { data, pessoaId, ligacoes, agendadas, realizadas, naoRealizadas, reagendadas, cartas, apresentacoes, docs }
     docs = documentações completas recebidas (usado nos gargalos). Hoje conta só a manhã (até 09:30).
     Contratos e valor NÃO são gerados: vêm dos negócios ganhos (D.negocios, fechadoEm). */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* Volume compatível com o tamanho do funil: ~9 ligações por dia na equipe (leads novos + follow-ups dos negócios abertos) */
  var PERFIL = {
    3: { ligacoes: 2.6, agendadas: 0.19, realizadas: 0.15, naoRealizadas: 0.03, reagendadas: 0.025, cartas: 0.08, apresentacoes: 0.035, docs: 0.04 },
    4: { ligacoes: 3.1, agendadas: 0.16, realizadas: 0.11, naoRealizadas: 0.045, reagendadas: 0.035, cartas: 0.06, apresentacoes: 0.025, docs: 0.03 },
    5: { ligacoes: 2.8, agendadas: 0.2, realizadas: 0.16, naoRealizadas: 0.025, reagendadas: 0.02, cartas: 0.085, apresentacoes: 0.035, docs: 0.045 },
    2: { ligacoes: 1.1, agendadas: 0.1, realizadas: 0.09, naoRealizadas: 0.01, reagendadas: 0.012, cartas: 0.045, apresentacoes: 0.04, docs: 0.02 }
  };
  var REALIZA = { 3: 0.8, 4: 0.68, 5: 0.82, 2: 0.9 };
  var KEYS = ['ligacoes', 'agendadas', 'realizadas', 'naoRealizadas', 'reagendadas', 'cartas', 'apresentacoes', 'docs'];
  C.diario = [];
  (function () {
    var r = rng(20261109);
    for (var d = util.parse('2026-01-05'); util.iso(d) <= HOJE; d = util.addDias(d, 1)) {
      if (!util.ehDiaUtil(d)) continue;
      var iso = util.iso(d), parcial = iso === HOJE ? 0.18 : 1, dow = d.getDay(), fdow = dow === 1 ? 1.08 : dow === 5 ? 0.84 : 1;
      C.consultores.forEach(function (pid) {
        var p = PERFIL[pid], row = { data: iso, pessoaId: pid };
        KEYS.forEach(function (k) { row[k] = Math.floor(p[k] * fdow * parcial * (0.7 + 0.6 * r()) + r()); });
        /* o resultado sai das reuniões agendadas: realizadas + não realizadas + reagendadas = agendadas */
        var taxa = REALIZA[pid]; row.realizadas = 0; row.naoRealizadas = 0; row.reagendadas = 0;
        for (var a = 0; a < row.agendadas; a++) { var u = r(); if (u < taxa) row.realizadas++; else if (u < taxa + (1 - taxa) * 0.6) row.naoRealizadas++; else row.reagendadas++; }
        C.diario.push(row);
      });
    }
  })();

  /* ---------------- Metas mensais por consultor (Q8: indicadores e valores a confirmar) ---------------- */
  /* Só os indicadores com meta. valor em R$ = crédito contratado (crédito estimado dos contratos fechados).
     Se a Atlas preferir medir honorários contratados (fee de 12 meses + êxito estimado), muda na Q8. */
  function meta(l, a, r, c, ap, ct, v) { return { ligacoes: l, agendadas: a, realizadas: r, cartas: c, apresentacoes: ap, contratos: ct, valor: v }; }
  C.metas = {
    '2026-08': { 3: meta(55, 4, 3, 2, 1, 1, 1500000), 4: meta(65, 3, 2, 1, 1, 1, 800000), 5: meta(60, 4, 3, 2, 1, 1, 1500000), 2: meta(25, 2, 2, 1, 1, 1, 3000000) },
    '2026-09': { 3: meta(55, 4, 3, 2, 1, 1, 1500000), 4: meta(65, 3, 2, 1, 1, 1, 800000), 5: meta(60, 4, 3, 2, 1, 1, 1500000), 2: meta(25, 2, 2, 1, 1, 1, 3000000) },
    '2026-10': { 3: meta(55, 4, 3, 2, 1, 1, 1500000), 4: meta(65, 3, 2, 1, 1, 1, 600000), 5: meta(60, 4, 3, 2, 1, 1, 1500000), 2: meta(25, 2, 2, 1, 1, 1, 3000000) },
    '2026-11': { 3: meta(52, 4, 3, 2, 1, 1, 1500000), 4: meta(62, 3, 2, 1, 1, 1, 800000), 5: meta(58, 4, 3, 2, 1, 1, 1500000), 2: meta(24, 2, 2, 1, 1, 1, 3000000) },
    '2026-12': { 3: meta(44, 3, 3, 2, 1, 1, 1200000), 4: meta(52, 3, 2, 1, 1, 1, 600000), 5: meta(48, 3, 3, 2, 1, 1, 1200000), 2: meta(20, 2, 2, 1, 1, 1, 2500000) }
  };
  /* Regra do fechamento: "atingiu" quando bate 100% em todos os indicadores com meta (a confirmar: Q8) */
  C.regraFechamento = 'Atingiu quando chega a 100% em todos os indicadores com meta';

  /* ---------------- Tempo médio parado por etapa (últimos 90 dias) ---------------- */
  C.tempoEtapa = [
    { num: 1, media: 1.6, amostra: 21 }, { num: 2, media: 2.9, amostra: 19 }, { num: 3, media: 6.4, amostra: 16 },
    { num: 4, media: 5.2, amostra: 14 }, { num: 5, media: 1.9, amostra: 12 }, { num: 6, media: 14.8, amostra: 11 },
    { num: 7, media: 17.6, amostra: 9 }, { num: 8, media: 6.1, amostra: 8 }, { num: 9, media: 12.3, amostra: 6 }
  ];
  var PESO = C.tempoEtapa.map(function (t) { return t.media; });

  /* ---------------- Atividades explícitas (as demais são geradas pelos movimentos) ----------------
     tipo: ligacao | reuniao | comunicacao | documentacao | apresentacao | followup | calculo | nota
     etapaRef: esta atividade é o requisito da entrada nessa etapa (não gera a atividade automática). */
  function A(id, negocioId, tipo, resultado, quando, pessoaId, contatoId, obs, etapaRef) {
    return { id: id, negocioId: negocioId, tipo: tipo, resultado: resultado, quando: quando, pessoaId: pessoaId, contatoId: contatoId || null, obs: obs || '', etapaRef: etapaRef || null };
  }
  C.atividades = [
    A(11001, 1002, 'ligacao', 'Não atendeu', '2026-11-05T10:12', 4, 103, 'Telefone fixo sem resposta. Nova tentativa programada pela AUT-02.'),
    A(11002, 1002, 'ligacao', 'Pediu retorno', '2026-11-06T16:44', 4, 103, 'Sérgio pediu retorno na quarta, depois das 14h, para marcar a reunião.'),
    A(11003, 1003, 'comunicacao', 'E-mail enviado', '2026-11-04T17:30', 5, 105, 'Convite para a apresentação dos cálculos em 09/11, 14h, na empresa.'),
    A(11004, 1003, 'ligacao', 'Falou com o decisor', '2026-11-06T11:05', 5, 105, 'Marcelo confirmou presença e pediu o resumo do crédito por tributo.'),
    A(11005, 1005, 'ligacao', 'Não atendeu', '2026-08-14T10:20', 3, 108, ''),
    A(11006, 1005, 'ligacao', 'Falou com o decisor', '2026-08-17T15:10', 3, 108, 'Interesse em revisar o ICMS na base do PIS/Cofins e os créditos de insumos.', 3),
    A(11007, 1005, 'followup', 'Feito', '2026-10-30T09:40', 3, 109, 'Os XML de 2022 deram erro de leitura no levantamento. Pedido o reenvio à Aline.'),
    A(11008, 1005, 'reuniao', 'Realizada', '2026-11-04T11:00', 3, 109, 'Reunião na empresa com a Aline para conferir os arquivos da EFD. Os XML de 2022 foram reenviados no mesmo dia.'),
    A(11009, 1005, 'nota', 'Comentário', '2026-11-08T18:24', 3, null, '@Mariana Duarte, a Quimtec quer a apresentação com os sócios no dia 19. Pode participar?'),
    A(11010, 1006, 'ligacao', 'Atendeu', '2026-11-06T17:20', 4, 110, 'Vanessa pediu material sobre verbas indenizatórias antes da qualificação.', 2),
    A(11011, 1006, 'comunicacao', 'WhatsApp enviado', '2026-11-06T17:35', 4, 110, 'Enviado o resumo da tese e o vídeo institucional.'),
    A(11012, 1008, 'reuniao', 'Realizada', '2026-11-06T15:10', 3, 113, 'Reunião na empresa com o Paulo. Folha com 58 funcionários: bom potencial em verbas indenizatórias.', 5),
    A(11013, 1010, 'documentacao', 'Documento recebido', '2026-10-29T14:00', 4, 116, 'Contrato social e procuração.'),
    A(11014, 1010, 'followup', 'Sem retorno', '2026-11-03T09:50', 4, 116, 'Cobrança da EFD ICMS/IPI e da ECF. O Otávio está de férias até 10/11.'),
    A(11016, 1011, 'reuniao', 'Reagendada', '2026-11-09T09:05', 5, 118, 'Eduardo pediu para mudar para terça, 10/11, às 15h.'),
    A(11017, 1013, 'reuniao', 'Realizada', '2026-10-29T16:00', 2, 120, 'Negociação de honorários: proposta de 15% de êxito e R$ 9.500,00 por mês.'),
    A(11018, 1013, 'comunicacao', 'E-mail enviado', '2026-11-05T10:30', 2, 120, 'Minuta do contrato enviada para o jurídico da Mogiana.'),
    A(11019, 1015, 'followup', 'Sem retorno', '2026-10-21T10:00', 2, 125, 'Cobrança da documentação.'),
    A(11020, 1015, 'documentacao', 'Documento recebido', '2026-10-28T14:30', 2, 125, 'Contrato social, procuração, ECF e DCTF.'),
    A(11021, 1015, 'documentacao', 'Documento recebido', '2026-11-04T11:48', 3, 125, 'EFD-Contribuições 2021–2025 (48 MB). Documentação completa.'),
    A(11022, 1018, 'ligacao', 'Não atendeu', '2026-10-22T10:00', 5, 129, ''),
    A(11023, 1018, 'ligacao', 'Caixa postal', '2026-10-27T15:20', 5, 129, ''),
    A(11024, 1018, 'ligacao', 'Atendeu', '2026-11-03T11:10', 5, 129, 'A secretária pediu retorno: Carolina em viagem até 06/11.'),
    A(11025, 1018, 'reuniao', 'Agendada', '2026-11-06T16:00', 5, 129, 'Reunião online marcada para 09/11, às 10h30.', 4),
    A(11026, 1019, 'ligacao', 'Atendeu', '2026-11-06T09:30', 3, 130, 'Wagner aceitou a conversa de qualificação na terça (10/11, 11h, online).', 2),
    A(11027, 1021, 'calculo', 'Concluído', '2026-11-03T17:22', 8, null, 'Crédito apurado: R$ 2,2 milhões (ICMS-ST e PIS/Cofins na importação).'),
    A(11028, 1023, 'reuniao', 'Não realizada', '2026-11-06T11:20', 5, 136, 'Eliane cancelou por viagem. A AUT-04 criou a tarefa de reagendar.'),
    A(11029, 1026, 'calculo', 'Concluído', '2026-11-03T16:40', 8, null, 'Crédito apurado: R$ 520 mil (verbas indenizatórias de 2021 a 2026).', 8),
    A(11030, 1026, 'ligacao', 'Falou com o decisor', '2026-11-04T10:15', 3, 101, 'Apresentação marcada para 11/11, às 10h, na empresa.'),
    A(11031, 1027, 'apresentacao', 'Realizada', '2026-10-30T15:00', 2, 114, 'Roberta aprovou seguir e pediu desconto no honorário mensal.', 9),
    A(11032, 1027, 'reuniao', 'Realizada', '2026-11-06T17:30', 2, 114, 'Negociação: 18% de êxito e R$ 5.800,00 por mês. Minuta na próxima semana.'),
    A(11033, 1012, 'ligacao', 'Falou com o decisor', '2026-09-30T11:00', 4, 119, 'O contador da empresa desaconselhou a ação. Encerrado como perdido.', 'perdido'),
    A(11034, 1025, 'documentacao', 'Documento recebido', '2026-10-21T15:30', 4, 140, 'Contrato de honorários assinado (20% de êxito e R$ 3.200,00 por mês).', 'ganho'),
    A(11035, 1024, 'documentacao', 'Documento recebido', '2026-09-15T16:10', 3, 138, 'Contrato de honorários assinado (15% de êxito e R$ 7.600,00 por mês).', 'ganho'),
    A(11036, 1017, 'ligacao', 'Não atendeu', '2026-11-06T16:30', 4, 128, 'Cadastro feito a partir do evento da ACIC. Ninguém atendeu.'),
    A(11037, 1023, 'reuniao', 'Agendada', '2026-11-06T15:40', 5, 136, 'Reunião remarcada para 10/11, às 9h30, na empresa. Tarefa de reagendar concluída.')
  ];

  /* ---------------- Movimentos de etapa (histórico gerado) ----------------
     Distribui as entradas entre criadoEm e a data da etapa atual (ou do desfecho) pelo
     tempo médio de cada etapa. A etapa atual entra exatamente em entrouEtapaEm. */
  var CALC = { 1005: 8, 1021: 8, 1026: 8, 1003: 8, 1013: 8, 1027: 8 };
  /* Hora exata da entrada na etapa atual quando há registro (auditoria, execução AUT-21, notificação) */
  var ENTROU_HORA = { 1008: '09:14', 1018: '16:05', 1027: '17:40' };
  C.movimentos = [];
  C.geradas = [];
  var movId = 13001, atvId = 12001;
  function quando(iso, k, nid) { return iso + 'T' + pad(Math.min(18, 8 + k)) + ':' + pad((nid * 7 + k * 11) % 50 + 5); }
  function temRef(nid, para) { return C.atividades.some(function (a) { return a.negocioId === nid && String(a.etapaRef) === String(para); }); }
  function fantasia(n) { var e = empresa(n.empresaId); return e ? e.fantasia : ''; }
  function geraAtividade(n, para, em, por) {
    if (temRef(n.id, para)) return;
    var e = empresa(n.empresaId), dec = decisorDa(n.empresaId), menos = function (min) { var d = util.parse(em); d.setMinutes(d.getMinutes() - min); return util.isoHora(d); };
    var x = {
      2: ['ligacao', 'Atendeu', 'Primeiro contato com a empresa; cadastro mínimo conferido.'],
      3: ['ligacao', 'Falou com o decisor', 'Lead qualificado: ' + (e.regime || '') + ', faturamento estimado de R$ ' + Math.round((e.faturamento || 0) / 1e6) + ' milhões.'],
      4: ['reuniao', 'Agendada', 'Reunião de apresentação marcada com o decisor.'],
      5: ['reuniao', 'Realizada', 'Apresentação da Atlas e das teses aplicáveis.'],
      6: ['comunicacao', 'E-mail enviado', 'Carta proposta e lista de documentos enviadas.'],
      7: ['documentacao', 'Documento recebido', 'Documentação completa recebida.'],
      8: ['calculo', 'Concluído', 'Cálculos concluídos: crédito apurado de R$ ' + (n.creditoEstimado >= 1e6 ? (n.creditoEstimado / 1e6).toFixed(2).replace('.', ',') + (n.creditoEstimado >= 2e6 ? ' milhões' : ' milhão') : Math.round(n.creditoEstimado / 1e3) + ' mil') + '.'],
      9: ['apresentacao', 'Realizada', 'Apresentação dos cálculos ao decisor.'],
      ganho: ['documentacao', 'Documento recebido', 'Contrato de honorários assinado.'],
      perdido: ['nota', 'Perda registrada', 'Motivo da perda: ' + (n.motivoPerda || 'não informado') + '.'],
      descartado: ['nota', 'Descarte registrado', 'Motivo do descarte: ' + (n.motivoPerda || 'não informado') + '.']
    }[para];
    if (!x) return;
    var pessoa = para === 8 ? (CALC[n.id] || 8) : por;
    C.geradas.push({ id: atvId++, negocioId: n.id, tipo: x[0], resultado: x[1], quando: menos(para === 8 ? 90 : 25), pessoaId: pessoa, contatoId: para === 8 ? null : dec, obs: x[2], etapaRef: para, gerada: true });
  }
  D.negocios.forEach(function (n) {
    var L = n.desfecho === 'ganho' ? 9 : n.desfecho === 'perdido' ? 8 : n.desfecho === 'descartado' ? 2 : n.etapa;
    var ini = n.criadoEm, fim = n.desfecho ? n.fechadoEm : n.entrouEtapaEm;
    var span = util.diasEntre(ini, fim), datas = [ini];
    var totW = 0, w = [];
    for (var k = 1; k <= (n.desfecho ? L : L - 1); k++) { totW += PESO[k - 1]; w.push(totW); }
    for (var s = 2; s <= L; s++) {
      var frac = n.desfecho ? w[s - 2] / totW : w[s - 2] / (totW || 1);
      if (!n.desfecho && s === L) frac = 1;
      var dt = util.iso(util.addDias(ini, Math.round(span * frac)));
      if ((n.desfecho || s < L) && !util.ehDiaUtil(dt)) { var ant = util.iso(util.diaUtilAnterior(dt)); if (ant >= datas[datas.length - 1]) dt = ant; }
      datas.push(dt);
    }
    var por = n.consultorId, prev = null;
    var push = function (de, para, iso, k) {
      var em = (!n.desfecho && para === L && ENTROU_HORA[n.id]) ? iso + 'T' + ENTROU_HORA[n.id] : quando(iso, k, n.id);
      var dias = prev ? util.diasEntre(prev, iso) : null;
      C.movimentos.push({ id: movId++, negocioId: n.id, de: de, para: para, em: em, por: para === 'ganho' && n.consultorId !== 2 ? n.consultorId : por, dias: dias });
      if (de != null) geraAtividade(n, para, em, por);
      prev = iso;
    };
    push(null, 1, datas[0], 0);
    for (var e = 2; e <= L; e++) push(e - 1, e, datas[e - 1], e);
    if (n.desfecho) push(L, n.desfecho, n.fechadoEm, 10);
  });

  /* ---------------- Tarefas do CRM que não estão no núcleo ---------------- */
  /* Abertas (completam a regra "todo negócio ativo tem uma próxima tarefa") */
  C.tarefas = [
    { id: 6101, titulo: 'Preparar a apresentação dos cálculos (folha)', modulo: 'crm', responsavelId: 3, prazo: '2026-11-10T17:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-08', ref: { label: 'Metalatibaia · Verbas indenizatórias', hash: 'crm-negocio-1026' } },
    { id: 6102, titulo: 'Enviar a minuta do contrato de honorários', modulo: 'crm', responsavelId: 2, prazo: '2026-11-10T12:00', status: 'aberta', prioridade: 'alta', origem: 'Manual', ref: { label: 'Americana Fios · Insumos', hash: 'crm-negocio-1027' } },
    { id: 6103, titulo: 'Confirmar a presença dos sócios na apresentação de 19/11', modulo: 'crm', responsavelId: 3, prazo: '2026-11-16T10:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'Quimtec · ICMS e insumos', hash: 'crm-negocio-1005' } },
    { id: 6104, titulo: 'Conferir os XML de 2022 reenviados pela Quimtec', modulo: 'crm', responsavelId: null, filaId: 'calculo', prazo: '2026-11-10T18:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'Quimtec · ICMS e insumos', hash: 'crm-negocio-1005' } },
    { id: 6105, titulo: 'Ligar para a Roberta: retorno sobre o desconto no mensal', modulo: 'crm', responsavelId: 2, prazo: '2026-11-12T11:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'Americana Fios · Insumos', hash: 'crm-negocio-1027' } },
    /* PL Lubrificantes: a reunião foi remarcada para 10/11 (tarefa 6013 concluída); a próxima tarefa é registrar o resultado */
    { id: 6106, titulo: 'Registrar o resultado da reunião com a PL Lubrificantes', modulo: 'crm', responsavelId: 5, prazo: '2026-11-10T12:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'PL Lubrificantes · ICMS na base', hash: 'crm-negocio-1023' } }
  ];
  /* Concluídas: cada automação cria a tarefa ao entrar na etapa; ela é concluída na etapa seguinte */
  C.tarefasHist = [];
  (function () {
    var id = 6201;
    var CRIA = { 1: ['AUT-01', 'Qualificar lead', 1], 5: ['AUT-05', 'Enviar carta proposta e documentos', 2], 7: ['AUT-07', 'Levantamento de créditos', 5], 8: ['AUT-08', 'Agendar apresentação dos cálculos', 2], 9: ['AUT-09', 'Follow-up de fechamento', 3] };
    D.negocios.forEach(function (n) {
      var movs = C.movimentos.filter(function (m) { return m.negocioId === n.id; });
      movs.forEach(function (m, i) {
        var c = CRIA[m.para], prox = movs[i + 1];
        if (!c || !prox) return;
        var fila = m.para === 7;
        C.tarefasHist.push({ id: id++, titulo: c[1] + ': ' + fantasia(n), modulo: 'crm', responsavelId: fila ? null : n.consultorId, filaId: fila ? 'calculo' : null, prazo: util.iso(util.addDiasUteis(m.em.slice(0, 10), c[2])) + 'T18:00', status: 'concluida', concluidaEm: prox.em, prioridade: 'media', origem: c[0], ref: { label: fantasia(n) + ' · ' + n.titulo, hash: 'crm-negocio-' + n.id } });
      });
    });
  })();

  /* ---------------- Documentos do cliente (etapa 6 em diante) ---------------- */
  C.docsPadrao = ['Contrato social', 'Procuração', 'EFD-Contribuições', 'EFD ICMS/IPI', 'ECF', 'DCTF'];
  /* Teses da folha (verbas indenizatórias, Sistema S) pedem folha, eSocial, EFD-Reinf e DCTFWeb no lugar das EFD fiscais */
  C.docsFolha = ['Contrato social', 'Procuração', 'Folha de pagamento', 'eSocial', 'EFD-Reinf', 'DCTFWeb'];
  C.docsDe = function (n) {
    if (!n) return C.docsPadrao.slice();
    if (/verbas indenizat|sistema s|previdenci/i.test(n.titulo) && !/PIS|Cofins|ICMS/i.test(n.titulo)) return C.docsFolha.slice();
    var c = C.docsPadrao.slice(); if (/insumos|ICMS-ST|importa/i.test(n.titulo)) c.push('Notas fiscais (XML)'); return c;
  };
  var ARQ = { 'Contrato social': ['contrato-social-consolidado.pdf', 1.8], 'Procuração': ['procuracao-assinada.pdf', 0.4], 'EFD-Contribuições': ['efd-contribuicoes-2021-2025.zip', 48], 'EFD ICMS/IPI': ['efd-icms-ipi-2021-2025.zip', 36], 'ECF': ['ecf-2021-2025.zip', 12], 'DCTF': ['dctf-2021-2025.pdf', 3.2], 'Notas fiscais (XML)': ['xml-entradas-2021-2025.zip', 214], 'Carta proposta': ['carta-proposta-atlas.pdf', 0.9], 'Contrato de honorários': ['contrato-honorarios-assinado.pdf', 1.1], 'Planilha de cálculo': ['memoria-de-calculo.xlsx', 2.6], 'Folha de pagamento': ['folha-de-pagamento-2021-2026.zip', 64], 'eSocial': ['esocial-eventos-s1200-2021-2026.zip', 22], 'EFD-Reinf': ['efd-reinf-2021-2026.zip', 9.4], 'DCTFWeb': ['dctfweb-recibos-2021-2026.pdf', 4.1] };
  C.documentos = [];
  (function () {
    var id = 14001;
    var mov = function (nid, para) { var m = C.movimentos.filter(function (x) { return x.negocioId === nid && String(x.para) === String(para); })[0]; return m ? m.em.slice(0, 10) : null; };
    var add = function (n, cat, status, solic, receb, origem) { var a = ARQ[cat] || ['documento.pdf', 1]; C.documentos.push({ id: id++, negocioId: n.id, categoria: cat, status: status, solicitadoEm: solic, recebidoEm: receb, arquivo: status === 'recebido' ? a[0] : null, tamanhoMb: status === 'recebido' ? a[1] : null, origem: origem || 'cliente' }); };
    D.negocios.forEach(function (n) {
      var max = n.desfecho === 'ganho' ? 10 : n.desfecho === 'perdido' ? 8 : n.desfecho === 'descartado' ? 2 : n.etapa;
      if (max < 6) return;
      var d6 = mov(n.id, 6), d7 = mov(n.id, 7), cats = C.docsDe(n);
      add(n, 'Carta proposta', 'recebido', d6, d6, 'atlas');
      cats.forEach(function (cat, i) {
        if (max >= 7) { add(n, cat, 'recebido', d6, util.iso(util.addDias(d6, Math.min(util.diasEntre(d6, d7), 2 + i * 2))), 'cliente'); return; }
        if (n.id === 1010) { var ok = cat === 'Contrato social' || cat === 'Procuração'; add(n, cat, ok ? 'recebido' : 'pendente', d6, ok ? '2026-10-29' : null); return; }
        if (n.id === 1015) { add(n, cat, 'recebido', d6, cat === 'EFD-Contribuições' ? '2026-11-04' : '2026-10-28'); return; }
        add(n, cat, 'pendente', d6, null);
      });
      if (max >= 8) { var d8 = mov(n.id, 8); add(n, 'Planilha de cálculo', 'recebido', d8, d8, 'atlas'); }
      if (n.desfecho === 'ganho') add(n, 'Contrato de honorários', 'recebido', n.fechadoEm, n.fechadoEm, 'cliente');
    });
  })();

  /* Perdas e descartes: o painel de gargalos calcula dos próprios negócios (D.negocios), sem números à parte. */

  /* ---------------- CNPJ fictício válido (dígitos verificadores calculados) ---------------- */
  function dv(nums, pesos) { var s = 0; for (var i = 0; i < pesos.length; i++) s += nums[i] * pesos[i]; var r = s % 11; return r < 2 ? 0 : 11 - r; }
  function cnpjValido12(base) {
    var n = base.split('').map(Number);
    var d1 = dv(n, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]); n.push(d1);
    var d2 = dv(n, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]); n.push(d2);
    var s = n.join('');
    return s.slice(0, 2) + '.' + s.slice(2, 5) + '.' + s.slice(5, 8) + '/' + s.slice(8, 12) + '-' + s.slice(12);
  }

  /* ---------------- Importação de planilha (exemplo de arquivo enviado) ---------------- */
  C.importacao = {
    arquivo: 'leads-cafe-com-cfos-campinas.xlsx', tamanho: '38 KB', origem: 'Evento/palestra', consultorPadrao: 5,
    colunas: ['Razão social', 'CNPJ', 'Contato', 'Cargo', 'Telefone', 'E-mail', 'Segmento', 'Regime'],
    linhas: [
      { razao: 'Hortolândia Tintas e Vernizes Ltda', cnpj: cnpjValido12('417302580001'), contato: 'Márcio Ferraz', cargo: 'Diretor financeiro', telefone: '(19) 99421-3380', segmento: 'Química', regime: 'Lucro Real', status: 'ok' },
      { razao: 'Sumaré Plásticos Técnicos Ltda', cnpj: cnpjValido12('382691140001'), contato: 'Cristina Paes', cargo: 'Sócia-administradora', telefone: '(19) 99310-2275', segmento: 'Plásticos e embalagens', regime: 'Lucro Presumido', status: 'ok' },
      { razao: 'Monte Mor Alimentos Congelados Ltda', cnpj: cnpjValido12('295538670001'), contato: 'Renato Abreu', cargo: 'CFO', telefone: '(19) 99208-6614', segmento: 'Alimentos', regime: 'Lucro Real', status: 'ok' },
      { razao: 'Quimtec Paulínia Indústria Química Ltda', cnpj: (empresa(5) || {}).cnpj, contato: 'Lúcio Fagundes', cargo: 'Diretor industrial e sócio', telefone: '(19) 99237-4410', segmento: 'Química', regime: 'Lucro Real', status: 'duplicado', empresaId: 5, msg: 'CNPJ já cadastrado: a linha vira atividade na ficha existente (sem duplicar).' },
      { razao: 'Nova Veneza Transportes Ltda', cnpj: '11.111.111/1111-11', contato: 'Sílvio Matos', cargo: 'Gerente', telefone: '(19) 99107-5520', segmento: 'Logística', regime: 'Lucro Presumido', status: 'invalido', msg: 'CNPJ inválido (dígito verificador). Corrija na planilha ou na tela depois.' },
      { razao: 'Artur Nogueira Doces Caseiros Ltda', cnpj: cnpjValido12('513847220001'), contato: 'Lurdes Pires', cargo: 'Proprietária', telefone: '(19) 99096-4471', segmento: 'Alimentos', regime: 'Simples Nacional', status: 'simples', msg: 'Simples Nacional: entra como descartado (motivo automático).' },
      { razao: 'Paulínia Caldeiraria e Montagens Ltda', cnpj: cnpjValido12('460127930001'), contato: 'Hélio Barros', cargo: 'Sócio-diretor', telefone: '(19) 98985-3362', segmento: 'Metalurgia', regime: 'Lucro Presumido', status: 'ok' },
      { razao: 'Valinhos Logística Refrigerada Ltda', cnpj: cnpjValido12('338806120001'), contato: 'Tânia Rezende', cargo: 'Controller', telefone: '(19) 98874-2253', segmento: 'Logística', regime: 'Lucro Real', status: 'ok' }
    ]
  };

  /* ---------------- Consulta pública do CNPJ (fictícia) ---------------- */
  var CNAE = {
    'Metalurgia': ['2599-3/99', 'Fabricação de outros produtos de metal'], 'Plásticos e embalagens': ['2222-6/00', 'Fabricação de embalagens de material plástico'],
    'Logística': ['4930-2/02', 'Transporte rodoviário de carga intermunicipal'], 'Alimentos': ['1099-6/99', 'Fabricação de outros produtos alimentícios'],
    'Química': ['2029-1/00', 'Fabricação de produtos químicos orgânicos'], 'Têxtil': ['1321-9/00', 'Tecelagem de fios de algodão'],
    'Autopeças': ['4530-7/01', 'Comércio por atacado de peças para veículos'], 'Usinagem': ['2539-0/01', 'Serviços de usinagem, tornearia e solda'],
    'Distribuição': ['4673-7/00', 'Comércio atacadista de material elétrico'], 'Moveleiro': ['3101-2/00', 'Fabricação de móveis com predominância de madeira'],
    'Agronegócio': ['4683-4/00', 'Comércio atacadista de defensivos e fertilizantes'], 'Farmacêutico': ['2121-1/01', 'Fabricação de medicamentos alopáticos'],
    'Energia': ['1931-4/00', 'Fabricação de álcool'], 'Vidros': ['2319-2/00', 'Fabricação de artigos de vidro'], 'Cerâmica': ['2349-4/99', 'Fabricação de produtos cerâmicos não refratários'],
    'Eletrônicos': ['2610-8/00', 'Fabricação de componentes eletrônicos'], 'Comércio exterior': ['4619-2/00', 'Representantes comerciais de mercadorias em geral'],
    'Gráfica': ['1813-0/01', 'Impressão de material para uso publicitário'], 'Varejo': ['4711-3/02', 'Comércio varejista de mercadorias, supermercados'],
    'Cosméticos': ['2063-1/00', 'Fabricação de cosméticos e produtos de higiene']
  };
  C.receita = {};
  D.empresas.forEach(function (e) {
    var c = CNAE[e.segmento] || ['0000-0/00', '—'];
    C.receita[e.id] = { situacao: 'Ativa', abertura: (1988 + (e.id * 7) % 30) + '-' + pad(1 + (e.id * 5) % 12) + '-' + pad(1 + (e.id * 11) % 27), cnae: c[0], cnaeDesc: c[1], porte: e.faturamento > 4.8e6 ? 'Demais' : 'EPP', consultadoEm: '2026-' + pad(9 + e.id % 2) + '-' + pad(3 + e.id % 24) + 'T10:' + pad(10 + e.id) };
  });

  /* ---------------- CPF dos contatos (dado protegido por perfil: crm.contact.cpf) ---------------- */
  C.cpf = {};
  D.contatos.forEach(function (c) { C.cpf[c.id] = String(100000000 + (c.id * 7919123) % 899999999) + pad((c.id * 37) % 100); });
})();
