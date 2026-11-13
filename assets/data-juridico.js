/* ==========================================================================
   ATLAS · data-juridico.js — dados fictícios do módulo Jurídico
   - Estende App.data.juridico. NÃO altera os arrays compartilhados de data.js:
     lê processos 2001–2010 e prazos 5001–5013 por ID e acrescenta campos aqui (J.extra, J.prazoExtra).
   - Faixas próprias: processos 4101+ · prazos 5101+ · andamentos 41001+ · documentos 42001+
     tarefas 43001+ · eventos 7101+ · partes contrárias 4501+.
   - Datas de prazo conferidas com App.util (dias úteis + feriados de data.js). Referência: 09/11/2026.
   - Tudo inventado: números de processo, CNPJs, valores e nomes.
   ========================================================================== */
(function () {
  'use strict';
  var App = window.App, util = App.util, D = App.data;
  var J = App.data.juridico = App.data.juridico || {};
  /* número do processo de data.js lido por ID (os textos citam o número atual, sem copiar) */
  var numProc = function (id) { for (var i = 0; i < D.processos.length; i++) if (D.processos[i].id === id) return D.processos[i].numero; return ''; };

  /* ---------------- Partes contrárias (cadastro 4.1 da proposta: nome + CPF/CNPJ) ---------------- */
  J.partes = [
    { id: 4501, nome: 'União Federal (Fazenda Nacional)', tipo: 'Ente público', documento: '00.394.411/0001-09', representacao: 'PGFN · Procuradoria-Seccional em Campinas', email: 'procuradoria.campinas@pgfn.exemplo', telefone: '(19) 3731-6000' },
    { id: 4502, nome: 'Delegado da Receita Federal do Brasil em Campinas', tipo: 'Autoridade coatora', documento: null, representacao: 'Receita Federal · DRF Campinas (informações pela PGFN)', email: 'drf.campinas@rfb.exemplo', telefone: '(19) 3734-8800' },
    { id: 4503, nome: 'Receita Federal do Brasil (DRF Campinas)', tipo: 'Órgão público', documento: '00.394.460/0412-55', representacao: 'Atendimento pelo e-CAC', email: 'atendimento.campinas@rfb.exemplo', telefone: '(19) 3734-8810' },
    { id: 4504, nome: 'Fazenda do Estado de São Paulo', tipo: 'Ente público', documento: '46.377.222/0001-29', representacao: 'PGE-SP · Procuradoria Regional de Campinas', email: 'pr5@pge.exemplo', telefone: '(19) 3243-4700' },
    { id: 4505, nome: 'Delegado da Receita Federal do Brasil em Limeira', tipo: 'Autoridade coatora', documento: null, representacao: 'Receita Federal · DRF Limeira', email: 'drf.limeira@rfb.exemplo', telefone: '(19) 3404-2200' }
  ];
  /* nome da parte em data.js → id da parte */
  J.partePorNome = { 'União Federal (Fazenda Nacional)': 4501, 'Delegado da Receita Federal em Campinas': 4502, 'Receita Federal do Brasil': 4503, 'Fazenda do Estado de São Paulo': 4504 };

  /* ---------------- Campos do Jurídico para os processos 2001–2010 (data.js) ---------------- */
  /* tipo: judicial | administrativo · status: ativo | suspenso | encerrado (proposta 4.2) */
  J.extra = {
    2001: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Recursal', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Deferida', parteId: 4501, recuperado: 0, objeto: 'Excluir o ICMS destacado nas notas da base do PIS/Cofins e compensar o que foi pago a maior nos últimos 5 anos.' },
    2002: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Cumprimento de sentença', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Indeferida', parteId: 4501, recuperado: 1940000, objeto: 'Reconhecer créditos extemporâneos de PIS/Cofins (2020–2024) e autorizar a compensação.' },
    2003: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Conhecimento', status: 'ativo', polo: 'Autora', sistema: 'PJe', liminar: 'Não se aplica', parteId: 4501, recuperado: 0, objeto: 'Crédito de PIS/Cofins na compra de autopeças monofásicas para revenda (ponto controverso). O PIS/Cofins pago a maior na própria revenda é recuperado em PER/DCOMP, no processo administrativo da Receita.' },
    2004: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Americana', instancia: '2ª instância (TRF3)', orgaoJulgador: '3ª Turma do TRF3', fase: 'Recursal', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Deferida', parteId: 4501, recuperado: 0, objeto: 'Exclusão do ICMS da base do PIS/Cofins. Pendente só o agravo interno da União sobre a correção pela Selic.' },
    2005: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Conhecimento', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Aguardando', parteId: 4502, recuperado: 0, objeto: 'Exclusão do ICMS da base do PIS/Cofins, com pedido de liminar para os recolhimentos futuros.' },
    2006: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Cumprimento de sentença', status: 'ativo', polo: 'Autora', sistema: 'PJe', liminar: 'Não se aplica', parteId: 4501, recuperado: 0, objeto: 'Excluir as subvenções de ICMS da base do IRPJ/CSLL e habilitar o crédito reconhecido.' },
    2007: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Limeira', instancia: '1ª instância', fase: 'Conhecimento', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Aguardando', parteId: 4501, recuperado: 0, objeto: 'Créditos de PIS/Cofins sobre insumos essenciais à produção (embalagens, manutenção e fretes).' },
    2008: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Conhecimento', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Aguardando', parteId: 4502, recuperado: 0, objeto: 'Créditos de PIS/Cofins no varejo (bonificações e fretes) e exclusão do ICMS-ST da base.' },
    2009: { tipo: 'administrativo', tribunal: 'Receita Federal do Brasil', subsecao: 'Campinas', instancia: 'Administrativo · DRF', fase: 'Habilitação e compensação', status: 'ativo', polo: 'Requerente', sistema: 'e-CAC', liminar: 'Não se aplica', parteId: 4503, recuperado: 1180000, objeto: 'Pedido de compensação (PER/DCOMP) do crédito reconhecido no processo ' + numProc(2002) + '.' },
    2010: { tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Conhecimento', status: 'ativo', polo: 'Embargante', sistema: 'PJe', liminar: 'Não se aplica', parteId: 4501, recuperado: 0, objeto: 'Embargos à execução fiscal de PIS/Cofins: afastar a multa de 75% e recalcular o débito.' }
  };

  /* ---------------- Processos próprios do módulo (4101+) ---------------- */
  J.processos = [
    { id: 4101, numero: '10830.724318/2025-62', empresaId: 4, negocioId: 1004, classe: 'Processo administrativo (recurso voluntário)', tese: 'Glosa de créditos de PIS/Cofins sobre insumos (auto de infração)', parteContraria: 'União Federal (Fazenda Nacional)', vara: 'CARF · 3ª Seção · 2ª Turma Ordinária', etapa: 'recurso', advogadoId: 6, valorCausa: 2140000, distribuidoEm: '2025-07-14',
      tipo: 'administrativo', tribunal: 'CARF · Conselho Administrativo de Recursos Fiscais', subsecao: 'Brasília (sessão virtual)', instancia: 'Administrativo · CARF', fase: 'Recurso administrativo', status: 'ativo', polo: 'Recorrente', sistema: 'e-Processo', liminar: 'Não se aplica', parteId: 4501, recuperado: 0, objeto: 'Cancelar o auto de infração que glosou créditos de PIS/Cofins sobre insumos (2020–2021).' },
    { id: 4102, numero: '13888.720915/2026-40', empresaId: 16, negocioId: 1016, classe: 'Processo administrativo (habilitação de crédito)', tese: 'Habilitação de crédito judicial (subvenções de ICMS)', parteContraria: 'Receita Federal do Brasil', vara: 'DRF Campinas', etapa: 'habilitacao', advogadoId: 6, valorCausa: 4130000, distribuidoEm: '2026-06-02',
      tipo: 'administrativo', tribunal: 'Receita Federal do Brasil', subsecao: 'Campinas', instancia: 'Administrativo · DRF', fase: 'Habilitação e compensação', status: 'ativo', polo: 'Requerente', sistema: 'e-CAC', liminar: 'Não se aplica', parteId: 4503, recuperado: 0, objeto: 'Habilitar na Receita o crédito reconhecido no processo ' + numProc(2006) + ' para compensação.' },
    { id: 4103, numero: 'AIIM 4.137.592-0', empresaId: 24, negocioId: 1024, classe: 'Processo administrativo tributário (defesa em AIIM)', tese: 'ICMS-ST: MVA aplicada em bebidas e higiene', parteContraria: 'Fazenda do Estado de São Paulo', vara: 'Delegacia Tributária de Julgamento de Campinas', etapa: 'instrucao', advogadoId: 7, valorCausa: 840000, distribuidoEm: '2026-08-18',
      tipo: 'administrativo', tribunal: 'SEFAZ-SP · Tribunal de Impostos e Taxas', subsecao: 'Campinas', instancia: 'Administrativo · 1ª instância', fase: 'Defesa administrativa', status: 'ativo', polo: 'Autuada (impugnante)', sistema: 'AIIM Digital (SEFAZ-SP)', liminar: 'Não se aplica', parteId: 4504, recuperado: 0, objeto: 'Defesa contra autuação de ICMS-ST por suposta MVA menor que a da portaria (2022–2024).' },
    { id: 4104, numero: '5001934-95.2023.4.03.6105', empresaId: 16, negocioId: 1016, classe: 'Mandado de segurança', tese: 'Créditos extemporâneos de PIS/Cofins', parteContraria: 'União Federal (Fazenda Nacional)', vara: '7ª Vara Federal de Campinas', etapa: 'compensacao', advogadoId: 6, valorCausa: 6400000, distribuidoEm: '2023-03-20',
      tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Habilitação e compensação', status: 'ativo', polo: 'Impetrante', sistema: 'PJe', liminar: 'Deferida', parteId: 4501, recuperado: 6050000, objeto: 'Créditos extemporâneos de PIS/Cofins (2018–2022). Crédito de R$ 6,4 milhões habilitado na Receita e compensado mês a mês desde jan/2025.' },
    { id: 4105, numero: '5007315-38.2024.4.03.6109', empresaId: 9, negocioId: 1009, classe: 'Ação de procedimento comum', tese: 'Exclusão do PIS/Cofins da própria base de cálculo (Tema 1.067/STF)', parteContraria: 'União Federal (Fazenda Nacional)', vara: '1ª Vara Federal de Americana', etapa: 'instrucao', advogadoId: 7, valorCausa: 410000, distribuidoEm: '2024-05-06',
      tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Americana', instancia: '1ª instância', fase: 'Conhecimento', status: 'suspenso', suspensoMotivo: 'Sobrestado até o STF julgar o Tema 1.067 (repercussão geral)', polo: 'Autora', sistema: 'PJe', liminar: 'Indeferida', parteId: 4501, recuperado: 0, objeto: 'Excluir o PIS e a Cofins da própria base de cálculo e restituir o que foi pago a maior nos últimos 5 anos.' },
    { id: 4106, numero: '10830.722403/2026-17', empresaId: 7, negocioId: 1007, classe: 'Processo administrativo (PER/DCOMP)', tese: 'PIS/Cofins monofásico (revenda)', parteContraria: 'Receita Federal do Brasil', vara: 'DRF Campinas', etapa: 'compensacao', advogadoId: 7, valorCausa: 260000, distribuidoEm: '2026-04-06',
      tipo: 'administrativo', tribunal: 'Receita Federal do Brasil', subsecao: 'Campinas', instancia: 'Administrativo · DRF', fase: 'Habilitação e compensação', status: 'ativo', polo: 'Requerente', sistema: 'e-CAC', liminar: 'Não se aplica', parteId: 4503, recuperado: 214000, objeto: 'PER/DCOMP do PIS/Cofins pago a maior na revenda de autopeças monofásicas (2021–2025), depois de retificar a EFD-Contribuições. Não depende da ação judicial.' },
    { id: 4107, numero: '5000817-98.2025.4.03.6105', empresaId: 4, negocioId: 1004, classe: 'Mandado de segurança', tese: 'Certidão positiva com efeitos de negativa', parteContraria: 'Delegado da Receita Federal em Campinas', vara: '4ª Vara Federal de Campinas', etapa: 'sentenca', advogadoId: 6, valorCausa: 10000, distribuidoEm: '2025-02-10',
      tipo: 'judicial', tribunal: 'TRF3 · Justiça Federal da 3ª Região', subsecao: 'Campinas', instancia: '1ª instância', fase: 'Conhecimento', status: 'encerrado', encerradoEm: '2025-09-30', polo: 'Impetrante', sistema: 'PJe', liminar: 'Deferida', parteId: 4502, recuperado: 0, objeto: 'Emitir a certidão bloqueada por débito já compensado em PER/DCOMP. Segurança concedida e certidão emitida (ação defensiva, sem crédito a recuperar).' }
  ];

  /* ---------------- Como cada prazo de data.js foi contado (para a coluna "Contagem") ---------------- */
  /* forma: dje (disponibilização no Diário) | eletronica (ciência no PJe) | ecac (ciência no e-CAC) | dec (ciência no DEC da SEFAZ-SP) | data (data designada) */
  J.prazoExtra = {
    5001: { forma: 'dje', data: '2026-10-30', dias: 5, contagem: 'uteis', andamentoId: 41019 },
    5002: { forma: 'dje', data: '2026-10-15', dias: 15, contagem: 'uteis', andamentoId: 41005 },
    5003: { forma: 'dje', data: '2026-11-03', dias: 5, contagem: 'uteis', andamentoId: 41035 },
    5004: { forma: 'dje', data: '2026-11-06', dias: 5, contagem: 'uteis', andamentoId: 41029 },
    5005: { forma: 'dje', data: '2026-10-28', dias: 15, contagem: 'uteis', andamentoId: 41063 },
    5006: { forma: 'dje', data: '2026-11-05', dias: 5, contagem: 'uteis', andamentoId: 41043 },
    5007: { forma: 'dje', data: '2026-11-04', dias: 15, contagem: 'uteis', andamentoId: 41046 },
    5008: { forma: 'ecac', data: '2026-11-03', dias: 30, contagem: 'corridos', andamentoId: 41057 },
    5009: { forma: 'dje', data: '2026-10-27', dias: 5, contagem: 'uteis', andamentoId: 41015 },
    5010: { forma: 'dje', data: '2026-10-23', dias: 5, contagem: 'uteis', andamentoId: 41049 },
    5011: { forma: 'dje', data: '2026-10-20', dias: 5, contagem: 'uteis', andamentoId: 41006 },
    5012: { forma: 'dje', data: '2026-09-28', dias: 15, contagem: 'uteis', andamentoId: 41022 },
    5013: { forma: 'data', data: '2026-11-18', dias: 0, contagem: 'data', andamentoId: 41028 }
  };

  /* ---------------- Prazos próprios (5101+) ---------------- */
  var D1 = function (f) { return util.prazoInterno(f); };
  J.prazos = [
    { id: 5101, processoId: 4101, tipo: 'Manifestação', descricao: 'Memoriais para a sessão de julgamento do CARF', fatal: '2026-11-24', responsavelId: 6, status: 'pendente', forma: 'data', data: '2026-11-24', dias: 0, contagem: 'data', andamentoId: 41071 },
    { id: 5102, processoId: 4103, tipo: 'Cumprimento de exigência', descricao: 'Juntar laudo técnico sobre a MVA aplicada', fatal: '2026-11-12', responsavelId: 7, status: 'pendente', forma: 'dec', data: '2026-10-28', dias: 15, contagem: 'corridos', andamentoId: 41083 },
    { id: 5103, processoId: 4102, tipo: 'Cumprimento de exigência', descricao: 'Certidão de inteiro teor e desistência da execução judicial', fatal: '2026-11-30', responsavelId: 6, status: 'pendente', forma: 'ecac', data: '2026-10-29', dias: 30, contagem: 'corridos', andamentoId: 41076 },
    { id: 5104, processoId: 4101, tipo: 'Sustentação oral', descricao: 'Sessão virtual de julgamento do recurso voluntário (CARF)', fatal: '2026-12-09', hora: '09:00', responsavelId: 6, status: 'pendente', forma: 'data', data: '2026-12-09', dias: 0, contagem: 'data', andamentoId: 41071 },
    { id: 5105, processoId: 4104, tipo: 'Manifestação', descricao: 'Manifestação sobre os embargos de declaração da União', fatal: '2026-06-15', responsavelId: 6, status: 'perdido', motivoPerda: 'Intimação publicada em nome de advogado que saiu do processo; capturada só em 17/06. Sem prejuízo: os embargos da União foram rejeitados.', forma: 'dje', data: '2026-06-05', dias: 5, contagem: 'uteis', andamentoId: 41094 },
    { id: 5106, processoId: 4105, tipo: 'Manifestação', descricao: 'Manifestação sobre o sobrestamento do processo', fatal: '2026-09-21', responsavelId: 7, status: 'cumprido', cumpridoEm: '2026-09-18', forma: 'dje', data: '2026-09-11', dias: 5, contagem: 'uteis', andamentoId: 41103 },
    { id: 5107, processoId: 2002, tipo: 'Manifestação', descricao: 'Manifestação sobre o cálculo de liquidação da União', fatal: '2026-10-07', responsavelId: 6, status: 'cumprido', cumpridoEm: '2026-10-07', forma: 'dje', data: '2026-09-29', dias: 5, contagem: 'uteis', andamentoId: 41013 },
    { id: 5108, processoId: 2006, tipo: 'Manifestação', descricao: 'Manifestação sobre os cálculos de liquidação', fatal: '2026-10-16', responsavelId: 6, status: 'cumprido', cumpridoEm: '2026-10-15', forma: 'dje', data: '2026-10-07', dias: 5, contagem: 'uteis', andamentoId: 41041 }
  ];
  J.prazos.forEach(function (p) { p.interno = D1(p.fatal); });

  /* Sugestão de prazo por tipo (CPC e Decreto 70.235/72). A Atlas confere no despacho. */
  J.diasSugeridos = {
    'Contestação': { dias: 15, contagem: 'uteis' }, 'Manifestação': { dias: 5, contagem: 'uteis' }, 'Réplica': { dias: 15, contagem: 'uteis' },
    'Recurso de apelação': { dias: 15, contagem: 'uteis' }, 'Contrarrazões': { dias: 15, contagem: 'uteis' }, 'Embargos de declaração': { dias: 5, contagem: 'uteis' },
    'Agravo de instrumento': { dias: 15, contagem: 'uteis' }, 'Cumprimento de exigência': { dias: 30, contagem: 'corridos', forma: 'ecac' },
    'Sustentação oral': { forma: 'data' }, 'Audiência': { forma: 'data' }
  };
  J.formasIntimacao = [
    { value: 'dje', label: 'Publicação no Diário (data de disponibilização)' },
    { value: 'eletronica', label: 'Intimação eletrônica no PJe (data da ciência)' },
    { value: 'ecac', label: 'Intimação no e-CAC · Receita Federal (ciência)' },
    { value: 'dec', label: 'Intimação no DEC · Domicílio Eletrônico do Contribuinte da SEFAZ-SP (ciência)' },
    { value: 'pessoal', label: 'Intimação pessoal ou por carta (data da juntada)' },
    { value: 'data', label: 'Data designada pelo juízo (pauta, sessão, audiência)' }
  ];

  /* Motivos de perda de prazo (lista do diálogo "Registrar perda"; alimenta o callout "Por que foi perdido") */
  J.motivosPerdaPrazo = ['Intimação não capturada a tempo', 'Publicação em nome de advogado que saiu do processo', 'Falha no protocolo (sistema indisponível)', 'Documento do cliente não chegou a tempo', 'Erro na contagem do prazo', 'Decisão de não recorrer (estratégia)', 'Outro'];

  /* ---------------- Tipos de andamento ---------------- */
  J.tiposAndamento = {
    distribuicao: { nome: 'Distribuição', icon: 'flag', tone: 'slate' },
    publicacao: { nome: 'Publicação / intimação', icon: 'mail', tone: 'blue' },
    intimacao_adm: { nome: 'Intimação administrativa', icon: 'mail', tone: 'blue' },
    despacho: { nome: 'Despacho', icon: 'file-text', tone: 'slate' },
    decisao: { nome: 'Decisão', icon: 'gavel', tone: 'violet' },
    sentenca: { nome: 'Sentença', icon: 'scale', tone: 'violet' },
    acordao: { nome: 'Acórdão', icon: 'scale', tone: 'violet' },
    peticao: { nome: 'Petição protocolada', icon: 'send', tone: 'green' },
    juntada: { nome: 'Juntada', icon: 'paperclip', tone: 'slate' },
    certidao: { nome: 'Certidão', icon: 'file', tone: 'slate' },
    transito: { nome: 'Trânsito em julgado', icon: 'check-circle', tone: 'gold' },
    alerta: { nome: 'Alerta do sistema', icon: 'bell', tone: 'amber' }
  };
  J.fontesAndamento = ['Diário eletrônico (DJe)', 'PJe', 'e-CAC', 'e-Processo (CARF)', 'DEC (SEFAZ-SP)', 'AIIM Digital (SEFAZ-SP)', 'E-mail do cliente', 'Sistema'];

  /* ---------------- Andamentos (linha do tempo de cada processo) ---------------- */
  /* por: id da equipe ou null (sistema). prazoId: prazo gerado a partir do andamento. */
  function A(id, processoId, data, tipo, titulo, texto, por, fonte, prazoId) { return { id: id, processoId: processoId, data: data, tipo: tipo, titulo: titulo, texto: texto || '', por: por, fonte: fonte || 'PJe', prazoId: prazoId || null }; }
  J.andamentos = [
    /* 2001 · Metalatibaia · MS ICMS na base */
    A(41001, 2001, '2025-09-02T10:14', 'distribuicao', 'Mandado de segurança distribuído à 2ª Vara Federal de Campinas', 'Pedido de liminar para suspender a inclusão do ICMS destacado na base do PIS/Cofins.', 7),
    A(41002, 2001, '2025-09-10T16:40', 'decisao', 'Liminar deferida', 'Suspensa a exigibilidade do PIS/Cofins sobre o ICMS destacado a partir da competência de setembro/2025.', 7, 'Diário eletrônico (DJe)'),
    A(41003, 2001, '2026-09-18T14:02', 'sentenca', 'Sentença: segurança concedida', 'Reconhecido o direito à exclusão e à compensação dos últimos 5 anos após o trânsito, corrigida pela Selic.', 7, 'Diário eletrônico (DJe)'),
    A(41004, 2001, '2026-10-14T11:25', 'juntada', 'Apelação da Fazenda Nacional juntada', 'A União pede a reforma integral e, subsidiariamente, a modulação dos efeitos.', 7),
    A(41005, 2001, '2026-10-15T08:00', 'publicacao', 'Intimação para contrarrazões à apelação', 'Ato ordinatório: vista à impetrante para contrarrazões, no prazo legal (15 dias úteis).', 7, 'Diário eletrônico (DJe)', 5002),
    A(41006, 2001, '2026-10-20T17:31', 'decisao', 'Decisão sobre os efeitos da apelação', 'Apelação recebida só no efeito devolutivo. Omissão quanto ao pedido de compensação imediata.', 7, 'Diário eletrônico (DJe)', 5011),
    A(41007, 2001, '2026-10-27T15:48', 'peticao', 'Embargos de declaração protocolados', 'Embargos apontando a omissão sobre a compensação imediata. Prazo 5011 cumprido no D-1.', 7),
    A(41008, 2001, '2026-11-06T07:00', 'alerta', 'Alerta do prazo interno (D-1): contrarrazões', 'Hoje é o prazo interno (D-1): protocole até o fim do dia. Alerta à responsável (AUT-13).', null, 'Sistema'),
    A(41009, 2001, '2026-11-09T07:00', 'alerta', 'Alerta crítico: prazo fatal hoje', 'Alerta enviado a Beatriz Sampaio e a Eduardo Lacerda. Tarefa "Protocolar contrarrazões" criada até 12:00 (AUT-14).', null, 'Sistema'),
    /* 2002 · Serra Azul · créditos extemporâneos */
    A(41010, 2002, '2025-04-15T09:30', 'distribuicao', 'Mandado de segurança distribuído à 6ª Vara Federal de Campinas', '', 6),
    A(41011, 2002, '2025-08-29T13:12', 'sentenca', 'Sentença: segurança concedida', 'Reconhecidos os créditos extemporâneos de 2020 a 2024.', 6, 'Diário eletrônico (DJe)'),
    A(41012, 2002, '2026-03-25T10:05', 'transito', 'Trânsito em julgado certificado', 'TRF3 negou provimento à apelação da União em 10/02/2026.', 6),
    A(41013, 2002, '2026-09-29T09:00', 'publicacao', 'Intimação sobre o cálculo de liquidação da União', 'Prazo de 5 dias úteis.', 6, 'Diário eletrônico (DJe)', 5107),
    A(41014, 2002, '2026-10-07T17:52', 'peticao', 'Manifestação sobre o cálculo da União protocolada', 'Protocolada no dia fatal.', 6),
    A(41015, 2002, '2026-10-27T08:00', 'publicacao', 'Intimação sobre os cálculos da contadoria', 'Manifestem-se as partes em 5 dias úteis.', 6, 'Diário eletrônico (DJe)', 5009),
    A(41016, 2002, '2026-11-04T16:20', 'peticao', 'Concordância com os cálculos da contadoria', 'Crédito homologado de R$ 1.940.000,00 (valor de setembro/2026).', 6),
    /* 2003 · Valinhos Autopeças · monofásico */
    A(41020, 2003, '2026-03-23T11:00', 'distribuicao', 'Ação distribuída à 4ª Vara Federal de Campinas', '', 7),
    A(41021, 2003, '2026-09-25T15:30', 'juntada', 'Contestação da União juntada', 'A União defende que a revenda monofásica não gera crédito.', 7),
    A(41022, 2003, '2026-09-28T08:00', 'publicacao', 'Intimação para réplica', 'Prazo de 15 dias úteis.', 7, 'Diário eletrônico (DJe)', 5012),
    A(41023, 2003, '2026-10-20T18:05', 'peticao', 'Réplica protocolada', 'Cumprida no D-1.', 7),
    A(41024, 2003, '2026-10-28T10:44', 'juntada', 'União juntou parecer da Receita Federal', 'Parecer sobre a lista de NCMs sujeitas à tributação monofásica.', 7),
    A(41019, 2003, '2026-10-30T13:15', 'despacho', 'Manifeste-se a autora sobre os documentos da União', 'Prazo de 5 dias úteis.', 7, 'Diário eletrônico (DJe)', 5001),
    /* 2004 · Americana Fios · MS ICMS (Americana) */
    A(41025, 2004, '2025-12-01T09:10', 'distribuicao', 'Mandado de segurança distribuído à 1ª Vara Federal de Americana', '', 6),
    A(41026, 2004, '2026-04-14T15:00', 'sentenca', 'Sentença: segurança concedida', '', 6, 'Diário eletrônico (DJe)'),
    A(41027, 2004, '2026-10-23T12:00', 'transito', 'Trânsito em julgado do capítulo principal', 'Resta só o agravo interno da União sobre a correção pela Selic.', 6),
    A(41028, 2004, '2026-10-26T08:00', 'publicacao', 'Agravo interno incluído em pauta: sessão de 18/11, 14:00', '3ª Turma do TRF3, por videoconferência. Inscrição para sustentação oral feita.', 6, 'Diário eletrônico (DJe)', 5013),
    A(41029, 2004, '2026-11-06T16:30', 'despacho', 'Junte a impetrante a certidão de trânsito e a memória de cálculo', 'Para habilitação do crédito na Receita Federal. Prazo de 5 dias úteis.', 6, 'Diário eletrônico (DJe)', 5004),
    /* 2005 · TecnoPack · MS ICMS (liminar) */
    A(41031, 2005, '2026-06-30T10:20', 'distribuicao', 'Mandado de segurança distribuído à 8ª Vara Federal de Campinas', 'Com pedido de liminar.', 7),
    A(41032, 2005, '2026-07-02T17:05', 'despacho', 'Liminar será analisada depois das informações', '', 7, 'Diário eletrônico (DJe)'),
    A(41033, 2005, '2026-07-20T11:40', 'certidao', 'Autoridade coatora notificada', '', 7),
    A(41034, 2005, '2026-10-28T14:12', 'juntada', 'Informações do Delegado da Receita Federal em Campinas', '', 7),
    A(41035, 2005, '2026-11-03T08:00', 'despacho', 'Manifeste-se a impetrante sobre as informações', 'Prazo de 5 dias úteis. Despacho com o juiz marcado para 12/11.', 7, 'Diário eletrônico (DJe)', 5003),
    /* 2006 · Cosmópolis Bioenergia · subvenções */
    A(41037, 2006, '2024-11-25T09:00', 'distribuicao', 'Ação distribuída à 3ª Vara Federal de Campinas', '', 6),
    A(41038, 2006, '2025-06-10T15:22', 'sentenca', 'Sentença: pedido procedente', 'Subvenções de ICMS excluídas da base do IRPJ/CSLL.', 6, 'Diário eletrônico (DJe)'),
    A(41039, 2006, '2026-05-20T10:00', 'transito', 'Trânsito em julgado', 'TRF3 negou provimento à apelação da União em 17/03/2026.', 6),
    A(41040, 2006, '2026-06-02T11:30', 'peticao', 'Habilitação do crédito pedida na Receita', 'Processo administrativo 13888.720915/2026-40.', 6, 'e-CAC'),
    A(41041, 2006, '2026-10-07T08:00', 'publicacao', 'Intimação sobre os cálculos de liquidação', 'Prazo de 5 dias úteis.', 6, 'Diário eletrônico (DJe)', 5108),
    A(41042, 2006, '2026-10-15T17:10', 'peticao', 'Manifestação sobre os cálculos protocolada', 'Cumprida no D-1.', 6),
    A(41043, 2006, '2026-11-05T16:45', 'decisao', 'Cálculos da contadoria homologados', 'A decisão não tratou da correção pela Selic. Cabem embargos de declaração (5 dias úteis).', 6, 'Diário eletrônico (DJe)', 5006),
    /* 2007 · SB Componentes */
    A(41045, 2007, '2026-08-12T09:45', 'distribuicao', 'Mandado de segurança distribuído à 1ª Vara Federal de Limeira', '', 7),
    A(41046, 2007, '2026-11-04T13:30', 'despacho', 'Emende a impetrante a inicial', 'Comprovar os recolhimentos de PIS/Cofins dos últimos 5 anos. Prazo de 15 dias úteis.', 7, 'Diário eletrônico (DJe)', 5007),
    /* 2008 · Supermercados Taquaral */
    A(41048, 2008, '2026-10-05T10:10', 'distribuicao', 'Mandado de segurança distribuído à 2ª Vara Federal de Campinas', '', 6),
    A(41049, 2008, '2026-10-23T15:00', 'despacho', 'Regularize a representação processual', 'Juntar procuração e contrato social atualizados. Prazo de 5 dias úteis.', 6, 'Diário eletrônico (DJe)', 5010),
    A(41050, 2008, '2026-11-03T17:40', 'peticao', 'Procuração e contrato social juntados', 'Cumprido no dia fatal.', 6),
    /* 2009 · Serra Azul · PER/DCOMP */
    A(41054, 2009, '2026-04-08T10:00', 'peticao', 'Pedido de habilitação do crédito transmitido', 'Crédito de R$ 1.180.000,00 reconhecido no mandado de segurança.', 7, 'e-CAC'),
    A(41055, 2009, '2026-06-30T09:00', 'decisao', 'Despacho decisório: habilitação deferida', '', 7, 'e-CAC'),
    A(41056, 2009, '2026-07-15T14:20', 'peticao', 'Primeira compensação transmitida (PER/DCOMP)', 'R$ 310.000,00 compensados com PIS/Cofins de junho/2026.', 7, 'e-CAC'),
    A(41057, 2009, '2026-11-03T09:12', 'intimacao_adm', 'Termo de intimação fiscal no e-CAC', 'Apresentar memória de cálculo e notas fiscais em 30 dias (contagem em dias corridos).', 7, 'e-CAC', 5008),
    /* 2010 · Americana Fios · embargos à execução */
    A(41060, 2010, '2025-06-17T11:00', 'distribuicao', 'Embargos distribuídos por dependência à execução fiscal', '5ª Vara Federal de Campinas.', 7),
    A(41061, 2010, '2025-07-08T16:00', 'decisao', 'Embargos recebidos com efeito suspensivo', 'Execução garantida por seguro-garantia.', 7, 'Diário eletrônico (DJe)'),
    A(41063, 2010, '2026-10-28T15:20', 'sentenca', 'Sentença: embargos parcialmente procedentes', 'Afastada a multa de 75%; mantido o principal. Cabe apelação (15 dias úteis).', 7, 'Diário eletrônico (DJe)', 5005),
    A(41064, 2010, '2026-11-05T09:10', 'alerta', 'Prazo interno recalculado: 20/11 → 19/11', 'Feriado de 20/11 (Dia da Consciência Negra) cadastrado no calendário (CORE-01).', null, 'Sistema'),
    /* 4101 · Serra Azul · CARF */
    A(41068, 4101, '2025-07-14T10:00', 'intimacao_adm', 'Auto de infração: glosa de créditos de PIS/Cofins sobre insumos', 'Período de 2020 a 2021.', 6, 'e-CAC'),
    A(41069, 4101, '2025-08-12T16:30', 'peticao', 'Impugnação apresentada à DRJ', '', 6, 'e-CAC'),
    A(41070, 4101, '2026-05-19T10:00', 'decisao', 'Acórdão da DRJ: impugnação improcedente', '', 6, 'e-CAC'),
    A(41072, 4101, '2026-06-17T15:15', 'peticao', 'Recurso voluntário protocolado ao CARF', '', 6, 'e-Processo (CARF)'),
    A(41071, 4101, '2026-10-21T08:00', 'publicacao', 'Recurso incluído na pauta da sessão virtual de 09/12', 'Memoriais até 24/11. Inscrição para sustentação oral aberta.', 6, 'e-Processo (CARF)', 5104),
    /* 4102 · Cosmópolis · habilitação na RFB */
    A(41075, 4102, '2026-06-02T11:30', 'peticao', 'Pedido de habilitação de crédito judicial transmitido', '', 6, 'e-CAC'),
    A(41076, 4102, '2026-10-29T10:40', 'intimacao_adm', 'Intimação no e-CAC: certidão de inteiro teor e desistência da execução', 'Prazo de 30 dias corridos.', 6, 'e-CAC', 5103),
    /* 4103 · Taquaral · AIIM ICMS-ST */
    A(41080, 4103, '2026-08-18T09:00', 'intimacao_adm', 'AIIM lavrado: ICMS-ST sobre bebidas e higiene', 'Fiscalização entendeu que a MVA aplicada foi menor que a da portaria.', 7, 'AIIM Digital (SEFAZ-SP)'),
    A(41081, 4103, '2026-09-16T17:00', 'peticao', 'Defesa administrativa apresentada', '', 7, 'AIIM Digital (SEFAZ-SP)'),
    A(41083, 4103, '2026-10-28T11:20', 'intimacao_adm', 'Intimação no DEC: juntar laudo técnico sobre a MVA', 'Ciência no Domicílio Eletrônico do Contribuinte. Prazo de 15 dias corridos.', 7, 'DEC (SEFAZ-SP)', 5102),
    /* 4104 · Cosmópolis · MS encerrado */
    A(41090, 4104, '2023-03-20T09:00', 'distribuicao', 'Mandado de segurança distribuído à 7ª Vara Federal de Campinas', '', 6),
    A(41091, 4104, '2023-11-07T15:00', 'sentenca', 'Sentença: segurança concedida', '', 6, 'Diário eletrônico (DJe)'),
    A(41092, 4104, '2024-09-10T10:00', 'transito', 'Trânsito em julgado', '', 6),
    A(41097, 4104, '2024-12-02T15:30', 'decisao', 'Habilitação do crédito deferida pela Receita', 'Crédito de R$ 6.400.000,00 habilitado para compensação (despacho decisório no e-CAC).', 6, 'e-CAC'),
    A(41098, 4104, '2025-01-15T10:40', 'peticao', 'Primeira compensação transmitida (PER/DCOMP)', 'R$ 280.000,00 compensados com PIS/Cofins de dezembro/2024. Daqui em diante, uma PER/DCOMP por mês.', 6, 'e-CAC'),
    A(41094, 4104, '2026-06-05T08:00', 'publicacao', 'Intimação sobre embargos de declaração da União', 'Prazo de 5 dias úteis. Publicada em nome de advogado que já tinha saído do processo.', null, 'Diário eletrônico (DJe)', 5105),
    A(41095, 4104, '2026-06-22T14:00', 'decisao', 'Embargos da União rejeitados', '', 6, 'Diário eletrônico (DJe)'),
    A(41096, 4104, '2026-10-16T11:10', 'peticao', 'Compensação de out/2026 transmitida (PER/DCOMP)', 'R$ 410.000,00 compensados. Total compensado: R$ 6.050.000,00 de R$ 6.400.000,00 (saldo de R$ 350.000,00). O êxito do mês vai para o Financeiro.', 6, 'e-CAC'),
    /* 4105 · Americana Fios · PIS/Cofins na própria base (suspenso, Tema 1.067/STF) */
    A(41100, 4105, '2024-05-06T10:00', 'distribuicao', 'Ação distribuída à 1ª Vara Federal de Americana', '', 7),
    A(41101, 4105, '2024-07-02T16:00', 'decisao', 'Tutela de urgência indeferida', '', 7, 'Diário eletrônico (DJe)'),
    A(41103, 4105, '2026-09-11T13:00', 'despacho', 'Processo sobrestado até o julgamento do Tema 1.067 no STF', 'Manifestem-se as partes em 5 dias úteis.', 7, 'Diário eletrônico (DJe)', 5106),
    A(41104, 4105, '2026-09-18T11:30', 'peticao', 'Manifestação sobre o sobrestamento', 'Concordância com a suspensão e pedido para manter a prescrição interrompida desde a distribuição.', 7),
    /* 4106 · Valinhos Autopeças · PER/DCOMP do monofásico */
    A(41110, 4106, '2026-04-06T10:30', 'peticao', 'EFD-Contribuições retificada (2021–2025)', 'Receitas de revenda de autopeças monofásicas retiradas da base do PIS/Cofins.', 7, 'e-CAC'),
    A(41111, 4106, '2026-04-20T15:10', 'peticao', 'PER/DCOMP transmitidos', 'Crédito de pagamento indevido de R$ 260.000,00. Primeira compensação com o PIS/Cofins de março/2026.', 7, 'e-CAC'),
    A(41112, 4106, '2026-08-31T11:00', 'peticao', 'Compensação de ago/2026 transmitida', 'R$ 38.000,00 compensados. Total compensado: R$ 214.000,00 de R$ 260.000,00.', 7, 'e-CAC'),
    /* 4107 · Serra Azul · MS da certidão (encerrado) */
    A(41120, 4107, '2025-02-10T09:20', 'distribuicao', 'Mandado de segurança distribuído à 4ª Vara Federal de Campinas', 'Pedido de liminar para emitir a certidão.', 6),
    A(41121, 4107, '2025-02-13T17:40', 'decisao', 'Liminar deferida', 'Certidão positiva com efeitos de negativa emitida em 14/02/2025.', 6, 'Diário eletrônico (DJe)'),
    A(41122, 4107, '2025-06-03T14:00', 'sentenca', 'Sentença: segurança concedida', '', 6, 'Diário eletrônico (DJe)'),
    A(41123, 4107, '2025-09-30T12:00', 'certidao', 'Trânsito em julgado · processo arquivado', 'Sem crédito a recuperar: ação só para liberar a certidão.', 6)
  ];

  /* ---------------- Documentos dos processos ---------------- */
  /* categoria: D.listas.categoriasDocumento · tamanho em bytes */
  function Doc(id, processoId, nome, categoria, por, quando, tamanho, versao) { return { id: id, processoId: processoId, nome: nome, categoria: categoria, por: por, quando: quando, tamanho: tamanho, versao: versao || 1 }; }
  J.documentos = [
    Doc(42001, 2001, 'peticao-inicial-ms-metalatibaia.pdf', 'Petição', 7, '2025-09-02T10:10', 1843200),
    Doc(42002, 2001, 'procuracao-metalatibaia-2025.pdf', 'Procuração', 7, '2025-08-28T16:30', 248000),
    Doc(42003, 2001, 'decisao-liminar-10-09-2025.pdf', 'Decisão ou sentença', 7, '2025-09-10T17:05', 312000),
    Doc(42004, 2001, 'sentenca-18-09-2026.pdf', 'Decisão ou sentença', 7, '2026-09-18T14:30', 506000),
    Doc(42005, 2001, 'apelacao-fazenda-nacional.pdf', 'Petição', 7, '2026-10-14T11:40', 922000),
    Doc(42006, 2001, 'embargos-declaracao-27-10-2026.pdf', 'Petição', 7, '2026-10-27T15:50', 418000),
    Doc(42007, 2001, 'minuta-contrarrazoes.docx', 'Petição', 7, '2026-11-09T08:40', 96000, 2),
    Doc(42008, 2001, 'efd-contribuicoes-2020-2025.zip', 'EFD-Contribuições', 8, '2025-08-20T09:00', 51380224),
    Doc(42010, 2002, 'calculos-contadoria-out-2026.pdf', 'Decisão ou sentença', 6, '2026-10-27T09:20', 688000),
    Doc(42011, 2002, 'certidao-transito-25-03-2026.pdf', 'Decisão ou sentença', 6, '2026-03-25T10:30', 156000),
    Doc(42012, 2002, 'procuracao-serra-azul.pdf', 'Procuração', 6, '2025-04-10T15:00', 231000),
    Doc(42020, 2003, 'peticao-inicial-valinhos.pdf', 'Petição', 7, '2026-03-23T11:00', 1320000),
    Doc(42021, 2003, 'contestacao-uniao.pdf', 'Petição', 7, '2026-09-25T15:40', 845000),
    Doc(42022, 2003, 'notas-fiscais-revenda-2021-2025.zip', 'Notas fiscais (XML)', 8, '2026-03-10T14:00', 38797312),
    Doc(42030, 2004, 'certidao-transito-23-10-2026.pdf', 'Decisão ou sentença', 6, '2026-10-23T12:30', 142000),
    Doc(42031, 2004, 'acordao-trf3-01-09-2026.pdf', 'Decisão ou sentença', 6, '2026-09-01T18:00', 734000),
    Doc(42040, 2005, 'informacoes-autoridade-coatora.pdf', 'Petição', 7, '2026-10-28T14:20', 590000),
    Doc(42041, 2005, 'peticao-inicial-tecnopack.pdf', 'Petição', 7, '2026-06-30T10:20', 1510000),
    Doc(42050, 2006, 'decisao-homologacao-05-11-2026.pdf', 'Decisão ou sentença', 6, '2026-11-05T17:00', 276000),
    Doc(42051, 2006, 'contrato-honorarios-cosmopolis.pdf', 'Contrato de honorários', 1, '2024-10-14T11:00', 402000),
    Doc(42060, 2009, 'termo-intimacao-ecac-03-11-2026.pdf', 'Decisão ou sentença', 7, '2026-11-03T09:20', 188000),
    Doc(42061, 2009, 'perdcomp-recibo-transmissao.pdf', 'Guias de recolhimento', 7, '2026-07-15T14:25', 96000),
    Doc(42070, 2010, 'sentenca-embargos-28-10-2026.pdf', 'Decisão ou sentença', 7, '2026-10-28T15:30', 612000),
    Doc(42080, 4101, 'recurso-voluntario-carf.pdf', 'Petição', 6, '2026-06-17T15:20', 2280000),
    Doc(42081, 4101, 'acordao-drj.pdf', 'Decisão ou sentença', 6, '2026-05-19T10:30', 958000),
    Doc(42090, 4103, 'aiim-4137592-0.pdf', 'Decisão ou sentença', 7, '2026-08-18T09:30', 1104000),
    Doc(42091, 4103, 'defesa-administrativa-taquaral.pdf', 'Petição', 7, '2026-09-16T17:05', 1690000),
    Doc(42100, 4106, 'efd-contribuicoes-retificadora-2021-2025.zip', 'EFD-Contribuições', 8, '2026-04-06T10:20', 21495808),
    Doc(42101, 4106, 'recibos-perdcomp-2026.pdf', 'Guias de recolhimento', 7, '2026-08-31T11:05', 88000),
    Doc(42110, 4107, 'sentenca-ms-certidao.pdf', 'Decisão ou sentença', 6, '2025-06-03T14:10', 298000)
  ];

  /* ---------------- Tarefas do Jurídico (além das de data.js) ---------------- */
  J.tarefas = [
    { id: 43001, titulo: 'Revisar a minuta de contrarrazões (Metalatibaia)', processoId: 2001, responsavelId: 6, prazo: '2026-11-09T10:30', status: 'aberta', prioridade: 'alta', origem: 'Manual' },
    { id: 43002, titulo: 'Preparar memória de cálculo para habilitação (Americana Fios)', processoId: 2004, responsavelId: null, filaId: 'calculo', prazo: '2026-11-12T18:00', status: 'aberta', prioridade: 'alta', origem: 'Manual' },
    { id: 43003, titulo: 'Minutar manifestação sobre os documentos da União (Valinhos)', processoId: 2003, responsavelId: 7, prazo: '2026-11-09T18:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-13' },
    { id: 43004, titulo: 'Pedir ao cliente o laudo técnico de MVA (Taquaral)', processoId: 4103, responsavelId: 7, prazo: '2026-11-10T12:00', status: 'aberta', prioridade: 'media', origem: 'Manual' },
    { id: 43005, titulo: 'Preparar memoriais para o CARF (Serra Azul)', processoId: 4101, responsavelId: 6, prazo: '2026-11-19T18:00', status: 'aberta', prioridade: 'media', origem: 'Manual' },
    { id: 43006, titulo: 'Levantar comprovantes de recolhimento 2021–2026 (SB Componentes)', processoId: 2007, responsavelId: null, filaId: 'calculo', prazo: '2026-11-18T18:00', status: 'aberta', prioridade: 'media', origem: 'Manual' },
    { id: 43007, titulo: 'Enviar a certidão de trânsito ao cliente (Americana Fios)', processoId: 2004, responsavelId: 11, prazo: '2026-11-05T17:00', status: 'concluida', prioridade: 'baixa', origem: 'Manual' },
    { id: 43008, titulo: 'Conferir a correção pela Selic antes dos embargos (Cosmópolis)', processoId: 2006, responsavelId: null, filaId: 'calculo', prazo: '2026-11-10T18:00', status: 'aberta', prioridade: 'alta', origem: 'Manual' }
  ];

  /* ---------------- Agenda jurídica (além de D.eventos 7007, 7016, 7020) ---------------- */
  J.eventos = [
    { id: 7101, tipo: 'reuniao', titulo: 'Reunião com a Cosmópolis Bioenergia (habilitação)', data: '2026-11-11', inicio: '10:00', fim: '11:00', pessoas: [6], local: 'Online · videochamada', modulo: 'juridico', ref: { label: 'Cosmópolis · habilitação na RFB', hash: 'jur-processo-4102' } },
    { id: 7102, tipo: 'audiencia', titulo: 'Despacho com o relator (CARF)', data: '2026-11-17', inicio: '15:00', fim: '15:30', pessoas: [6], local: 'CARF · videoconferência', modulo: 'juridico', ref: { label: 'Serra Azul · recurso voluntário', hash: 'jur-processo-4101' } },
    { id: 7103, tipo: 'reuniao', titulo: 'Reunião com o Supermercados Taquaral (AIIM)', data: '2026-11-10', inicio: '14:00', fim: '15:00', pessoas: [7, 1], local: 'Na empresa · Campinas', modulo: 'juridico', ref: { label: 'Taquaral · AIIM ICMS-ST', hash: 'jur-processo-4103' } },
    { id: 7104, tipo: 'interno', titulo: 'Protocolo da manifestação (Valinhos)', data: '2026-11-09', inicio: '15:00', fim: '15:30', pessoas: [7], local: 'PJe', modulo: 'juridico', ref: { label: 'Valinhos Autopeças · monofásico', hash: 'jur-processo-2003' } },
    { id: 7105, tipo: 'audiencia', titulo: 'Sessão virtual de julgamento (CARF)', data: '2026-12-09', inicio: '09:00', fim: '12:00', pessoas: [6], local: 'CARF · sessão virtual', modulo: 'juridico', ref: { label: 'Serra Azul · recurso voluntário', hash: 'jur-processo-4101' } },
    { id: 7106, tipo: 'interno', titulo: 'Comitê jurídico: prazos da semana', data: '2026-11-17', inicio: '08:30', fim: '09:15', pessoas: [6, 7, 1], local: 'Escritório Atlas · sala 1', modulo: 'juridico' },
    { id: 7107, tipo: 'treinamento', titulo: 'Treinamento: PER/DCOMP Web e e-CAC', data: '2026-11-13', inicio: '14:00', fim: '15:30', pessoas: [6, 7, 11], local: 'Escritório Atlas · auditório', modulo: 'juridico' },
    { id: 7108, tipo: 'reuniao', titulo: 'Alinhamento com a equipe de cálculo (habilitações)', data: '2026-11-11', inicio: '16:00', fim: '16:45', pessoas: [6, 8, 9], local: 'Escritório Atlas · sala 2', modulo: 'juridico' }
  ];

  /* ---------------- Histórico mensal de cumprimento (para o painel e os relatórios) ---------------- */
  /* d1 = cumpridos até o interno · fatal = cumpridos no dia fatal · perdido = fatal sem cumprimento · andamentos = registrados no mês */
  J.historico = [
    { mes: '2026-06', advogadoId: 6, d1: 5, fatal: 1, perdido: 1, andamentos: 21 }, { mes: '2026-06', advogadoId: 7, d1: 4, fatal: 2, perdido: 0, andamentos: 26 },
    { mes: '2026-07', advogadoId: 6, d1: 5, fatal: 1, perdido: 0, andamentos: 18 }, { mes: '2026-07', advogadoId: 7, d1: 6, fatal: 1, perdido: 0, andamentos: 24 },
    { mes: '2026-08', advogadoId: 6, d1: 7, fatal: 0, perdido: 0, andamentos: 23 }, { mes: '2026-08', advogadoId: 7, d1: 5, fatal: 2, perdido: 0, andamentos: 27 },
    { mes: '2026-09', advogadoId: 6, d1: 6, fatal: 2, perdido: 0, andamentos: 19 }, { mes: '2026-09', advogadoId: 7, d1: 7, fatal: 1, perdido: 0, andamentos: 29 },
    { mes: '2026-10', advogadoId: 6, d1: 8, fatal: 1, perdido: 0, andamentos: 25 }, { mes: '2026-10', advogadoId: 7, d1: 6, fatal: 2, perdido: 0, andamentos: 31 },
    { mes: '2026-11', advogadoId: 6, d1: 1, fatal: 1, perdido: 0, andamentos: 7 }, { mes: '2026-11', advogadoId: 7, d1: 0, fatal: 0, perdido: 0, andamentos: 6 }
  ];

  /* Códigos de origem do número CNJ usados no protótipo (subseções da Justiça Federal em SP) */
  J.origensCnj = { '6105': 'Campinas', '6109': 'Americana', '6134': 'Limeira', '6100': 'São Paulo' };

  /* ==================================================================
     FUNÇÕES DE LEITURA (fonte única para Jurídico, CRM e Financeiro)
     Avaliadas na hora da tela, sem alterar os arrays compartilhados.
     ================================================================== */
  /* Todos os processos: data.js (com os campos de J.extra) + os do módulo */
  J.todosProcessos = function () {
    return D.processos.map(function (p) { var o = {}, k, x = J.extra[p.id] || {}; for (k in p) o[k] = p[k]; for (k in x) o[k] = x[k]; return o; }).concat(J.processos);
  };
  /* Crédito recuperado. Só conta processo na etapa "Compensação (PER/DCOMP)": processo em recurso ou
     com trânsito recente ainda não compensa (CTN, art. 170-A). Base do honorário de êxito. */
  J.podeCompensar = function (p) { return !!p && p.etapa === 'compensacao'; };
  J.recuperadoProcesso = function (p) {
    if (p && typeof p !== 'object') { var id = p; p = J.todosProcessos().filter(function (x) { return String(x.id) === String(id); })[0]; }
    return J.podeCompensar(p) ? (p.recuperado || 0) : 0;
  };
  J.recuperadoEmpresa = function (empresaId) {
    return J.todosProcessos().filter(function (p) { return p.empresaId === empresaId; }).reduce(function (s, p) { return s + J.recuperadoProcesso(p); }, 0);
  };
  /* contrato: objeto de D.contratos ou id. Um contrato por cliente no protótipo. */
  J.recuperadoContrato = function (ct) {
    if (ct && typeof ct !== 'object') { var id = ct; ct = D.contratos.filter(function (c) { return String(c.id) === String(id); })[0]; }
    return ct ? J.recuperadoEmpresa(ct.empresaId) : 0;
  };

  /* Cumprimento de prazos: mesma série (J.historico) e mesma janela em todas as telas */
  J.janelaD1 = { meses: ['2026-08', '2026-09', '2026-10', '2026-11'], rotulo: 'ago a nov/2026' };
  J.cumprimentoD1 = function (advId, meses) {
    meses = meses || J.janelaD1.meses;
    var l = J.historico.filter(function (h) { return (!advId || h.advogadoId === advId) && meses.indexOf(h.mes) >= 0; });
    var s = { d1: 0, fatal: 0, perdido: 0, andamentos: 0 };
    l.forEach(function (h) { s.d1 += h.d1; s.fatal += h.fatal; s.perdido += h.perdido; s.andamentos += h.andamentos; });
    s.total = s.d1 + s.fatal + s.perdido; s.pct = s.total ? 100 * s.d1 / s.total : 0;
    return s;
  };

  /* Próximos disparos das regras de prazo, calculados pelo calendário (AUT-12, AUT-13, AUT-14).
     AUT-12: 3 dias úteis antes do interno · AUT-13: no interno · AUT-14: no fatal (responsável + gestor). */
  J.disparosPrazo = function (p) {
    if (!p || p.status !== 'pendente') return [];
    var gestor = 6, f12 = (D.fluxos.filter(function (f) { return f.codigo === 'AUT-12'; })[0] || {}), dias = ((f12.params || [])[0] || {}).valor || 3;
    var para = function (l) { return l.filter(function (v, i, a) { return v && a.indexOf(v) === i; }); };
    return [
      { cod: 'AUT-12', quando: util.iso(util.addDiasUteis(p.interno, -dias)) + 'T07:00', txt: 'Aviso ' + dias + ' dias úteis antes do interno', para: para([p.responsavelId]) },
      { cod: 'AUT-13', quando: p.interno + 'T07:00', txt: 'Alerta no dia do prazo interno (D-1)', para: para([p.responsavelId]) },
      { cod: 'AUT-14', quando: p.fatal + 'T07:00', txt: 'Alerta crítico no dia fatal (se pendente)', para: para([p.responsavelId, gestor]) }
    ].map(function (x) { x.prazo = p; x.ja = x.quando <= util.isoHora(App.HOJE); return x; });
  };
  /* Todos os prazos pendentes (data.js + módulo), em ordem de data. Use { futuros: true } para só os que ainda vão rodar. */
  J.disparos = function (o) {
    o = o || {};
    var l = D.prazos.map(function (p) { var x = {}, k, e = J.prazoExtra[p.id] || {}; for (k in e) x[k] = e[k]; for (k in p) x[k] = p[k]; return x; }).concat(J.prazos);
    var out = [];
    l.forEach(function (p) { J.disparosPrazo(p).forEach(function (x) { if (!o.futuros || !x.ja) out.push(x); }); });
    return out.sort(function (a, b) { return a.quando.localeCompare(b.quando); });
  };
})();
