/* ==========================================================================
   ATLAS · data-intranet.js — dados fictícios do módulo Intranet
   Réplica da "Materiais LT" do Admin Master do LajesTech (tipo adm_material_lt):
     título, descrição, tipo (option set adm_material_tipo), categoria (adm_material_categoria,
     com cor, ícone e ordem), capa, arquivo ou link, tags, ordem, ativo, destaque.
   Acrescentado para a Atlas: quem pode ver (papéis), confirmação de leitura, versão,
   registro de "visto por" e trilhas de onboarding com prazo em dias úteis.
   IDs: categorias 1–8 · materiais 4101–4137 · trilhas 4201–4203.
   Pessoas, papéis e calendário vêm de data.js (lidos por ID, sem alterar).
   ========================================================================== */
(function () {
  'use strict';
  var App = window.App, D = App.data, util = App.util;
  var DI = D.intranet = D.intranet || {};

  /* ---------------- Tipos (option set adm_material_tipo) ---------------- */
  DI.tipos = [
    { key: 'video', nome: 'Vídeo', plural: 'Vídeos', icon: 'video', ext: 'MP4', aceita: 'MP4 ou MOV · até 2 GB' },
    { key: 'apresentacao', nome: 'Apresentação', plural: 'Apresentações', icon: 'presentation', ext: 'PPTX', aceita: 'PPTX, KEY ou PDF · até 100 MB' },
    { key: 'pdf', nome: 'PDF', plural: 'PDFs', icon: 'file-text', ext: 'PDF', aceita: 'PDF · até 50 MB' },
    { key: 'imagem', nome: 'Imagem', plural: 'Imagens', icon: 'image', ext: 'PNG', aceita: 'PNG, JPG ou SVG · até 20 MB' },
    { key: 'link', nome: 'Link', plural: 'Links', icon: 'link', ext: 'URL', aceita: 'Endereço que começa com https://' },
    { key: 'planilha', nome: 'Planilha', plural: 'Planilhas', icon: 'spreadsheet', ext: 'XLSX', aceita: 'XLSX ou CSV · até 25 MB' },
    { key: 'documento', nome: 'Documento', plural: 'Documentos', icon: 'file', ext: 'DOCX', aceita: 'DOCX ou ODT · até 25 MB' }
  ];

  /* ---------------- Paleta e ícones permitidos para categorias ---------------- */
  /* As cores são os 8 tons do sistema (contraste conferido em claro e escuro em tokens.css). */
  DI.cores = [
    { key: 'gold', nome: 'Dourado' }, { key: 'blue', nome: 'Azul' }, { key: 'green', nome: 'Verde' }, { key: 'amber', nome: 'Âmbar' },
    { key: 'violet', nome: 'Violeta' }, { key: 'slate', nome: 'Grafite' }, { key: 'red', nome: 'Vermelho' }, { key: 'gray', nome: 'Cinza' }
  ];
  DI.icones = ['briefcase', 'landmark', 'gavel', 'scale', 'play-circle', 'video', 'shield-check', 'lock', 'star', 'palette', 'monitor', 'book',
    'user-plus', 'users', 'file-text', 'presentation', 'calculator', 'percent', 'target', 'globe', 'folder', 'layers', 'flag', 'message'];

  /* ---------------- Categorias (option set adm_material_categoria: cor, ícone, ordem) ---------------- */
  DI.categorias = [
    { id: 1, nome: 'Comercial e propostas', cor: 'gold', icone: 'briefcase', ordem: 1, ativo: true, curadorId: 2, descricao: 'Apresentações, roteiros de reunião, modelos de proposta e materiais de apoio à venda de recuperação de créditos.' },
    { id: 2, nome: 'Teses tributárias', cor: 'green', icone: 'landmark', ordem: 2, ativo: true, curadorId: 6, descricao: 'Resumos das teses que a Atlas trabalha: fundamento, período recuperável, documentos, cálculo e riscos.' },
    { id: 3, nome: 'Modelos jurídicos', cor: 'slate', icone: 'gavel', ordem: 3, ativo: true, curadorId: 6, descricao: 'Petições, procurações e pedidos administrativos prontos para adaptar ao caso.' },
    { id: 4, nome: 'Treinamentos e vídeos', cor: 'blue', icone: 'video', ordem: 4, ativo: true, curadorId: 11, descricao: 'Aulas gravadas, webinars e treinamentos práticos da equipe.' },
    { id: 5, nome: 'Políticas e compliance', cor: 'red', icone: 'shield-check', ordem: 5, ativo: true, curadorId: 1, descricao: 'Código de conduta, LGPD, segurança da informação e regras internas. Alguns exigem confirmação de leitura.' },
    { id: 6, nome: 'Institucional e marca', cor: 'violet', icone: 'star', ordem: 6, ativo: true, curadorId: 11, descricao: 'Manual de marca, modelos de apresentação, assinatura de e-mail e textos institucionais.' },
    { id: 7, nome: 'Manuais do sistema', cor: 'gray', icone: 'monitor', ordem: 7, ativo: true, curadorId: 11, descricao: 'Como usar o Atlas · Gestão: CRM, jurídico, financeiro e intranet.' },
    { id: 8, nome: 'RH e onboarding', cor: 'amber', icone: 'user-plus', ordem: 8, ativo: true, curadorId: 11, descricao: 'Guia do novo colaborador, benefícios, calendário e organograma.' }
  ];

  /* ---------------- Materiais (adm_material_lt) ---------------- */
  var COM = ['socio', 'gestor_comercial', 'consultor', 'financeiro'];
  var JUR = ['socio', 'gestor_juridico', 'advogado'];
  var M = function (o) {
    return Object.assign({ ativo: true, destaque: false, status: 'publicado', papeis: null, tags: [], aceite: false, versao: 1, download: true }, o, { atualizadoEm: o.atualizadoEm || o.publicadoEm });
  };
  DI.materiais = [
    /* 1 · Comercial e propostas */
    M({ id: 4101, categoriaId: 1, ordem: 1, tipo: 'apresentacao', titulo: 'Apresentação institucional Atlas 2026', destaque: true,
      descricao: 'Deck oficial para a primeira reunião com a empresa: quem somos, como funciona a recuperação de créditos, método em quatro etapas e modelo de honorários. Use sempre a versão mais recente.',
      slides: 24, slideTitulos: ['Atlas Corporate', 'Quem somos', 'Onde atuamos', 'Como recuperamos créditos', 'Teses que trabalhamos', 'Método em quatro etapas', 'Diagnóstico sem custo', 'Levantamento e cálculo', 'Segurança jurídica', 'Modelo de honorários', 'Acompanhamento mensal', 'Próximos passos'],
      arquivo: { nome: 'Atlas_Institucional_2026_v3.pptx', tamanho: '18,4 MB' }, tags: ['institucional', 'reunião', 'primeiro contato'], autorId: 2, publicadoEm: '2026-08-18', atualizadoEm: '2026-10-27', versao: 3 }),
    M({ id: 4102, categoriaId: 1, ordem: 2, tipo: 'pdf', titulo: 'Roteiro da reunião de diagnóstico',
      descricao: 'Perguntas para a reunião de diagnóstico (etapa 4 do funil): regime, faturamento, folha, benefícios fiscais e histórico de autuações. Inclui a lista de documentos para pedir no fim da conversa.',
      paginas: 8, secoes: ['Antes da reunião', 'Abertura e objetivo', 'Perguntas sobre o regime tributário', 'Faturamento, folha e benefícios', 'Autuações e parcelamentos', 'Documentos para solicitar', 'Próxima tarefa obrigatória'],
      arquivo: { nome: 'Roteiro_Diagnostico_v2.pdf', tamanho: '1,1 MB' }, tags: ['reunião', 'diagnóstico', 'roteiro', 'etapa 4'], autorId: 2, publicadoEm: '2026-06-02', atualizadoEm: '2026-09-15', versao: 2 }),
    M({ id: 4103, categoriaId: 1, ordem: 3, tipo: 'documento', titulo: 'Modelo de proposta de recuperação de créditos', modelo: true, papeis: COM,
      descricao: 'Modelo editável da carta proposta: escopo, teses, período analisado, honorário mensal e percentual de êxito. Os campos entre colchetes são preenchidos pelo consultor antes do envio.',
      paginas: 6, secoes: ['Apresentação', 'Escopo do trabalho', 'Teses analisadas', 'Período e documentos', 'Honorários', 'Prazo e condições', 'Aceite'],
      arquivo: { nome: 'Proposta_Recuperacao_Creditos_MODELO.docx', tamanho: '320 KB' }, tags: ['proposta', 'honorários', 'modelo', 'etapa 9'], autorId: 2, publicadoEm: '2026-05-11', atualizadoEm: '2026-11-05', versao: 5 }),
    M({ id: 4104, categoriaId: 1, ordem: 4, tipo: 'planilha', titulo: 'Calculadora de honorários de êxito', papeis: COM, planilha: 'honorarios',
      descricao: 'Simula o honorário de êxito e o parcelamento a partir do crédito estimado. Os percentuais seguem a tabela aprovada pelos sócios para 2026.',
      abas: 3, arquivo: { nome: 'Calculadora_Honorarios_Exito.xlsx', tamanho: '86 KB' }, tags: ['honorários', 'êxito', 'simulação'], autorId: 10, publicadoEm: '2026-07-20', atualizadoEm: '2026-10-30', versao: 4 }),
    M({ id: 4105, categoriaId: 1, ordem: 5, tipo: 'pdf', titulo: 'Objeções frequentes e como responder',
      descricao: 'As objeções que mais aparecem nas reuniões (preço, receio de fiscalização, "meu contador já faz") com respostas testadas pela equipe e exemplos de follow-up.',
      paginas: 12, secoes: ['"O honorário está alto"', '"Tenho receio de fiscalização"', '"Meu contador já faz isso"', '"Agora não é o momento"', '"Preciso falar com o sócio"', 'Follow-up depois da objeção'],
      arquivo: { nome: 'Objecoes_Frequentes.pdf', tamanho: '2,3 MB' }, tags: ['objeções', 'vendas', 'follow-up'], autorId: 3, publicadoEm: '2026-09-08' }),
    M({ id: 4106, categoriaId: 1, ordem: 6, tipo: 'video', titulo: 'Como conduzir a apresentação do levantamento',
      descricao: 'Treinamento gravado sobre a etapa 8 do funil: apresentar os cálculos ao decisor, mostrar o crédito por tese, responder ao contador e conduzir para a assinatura.',
      duracao: 965, capitulos: [[0, 'Abertura'], [95, 'Preparar os números'], [310, 'Mostrar o crédito por tese'], [560, 'Responder dúvidas do contador'], [790, 'Conduzir para a assinatura']],
      arquivo: { nome: 'Apresentacao_Levantamento.mp4', tamanho: '412 MB' }, tags: ['apresentação dos cálculos', 'etapa 8', 'reunião'], autorId: 2, publicadoEm: '2026-10-20' }),

    /* 2 · Teses tributárias */
    M({ id: 4107, categoriaId: 2, ordem: 1, tipo: 'pdf', titulo: 'Exclusão do ICMS da base do PIS/Cofins: guia prático', destaque: true,
      descricao: 'Resumo da tese do Tema 69 do STF para a equipe: quem tem direito, período recuperável, documentos, forma de cálculo e cuidados na compensação.',
      paginas: 18, secoes: ['Contexto: Tema 69 do STF', 'Quem tem direito', 'Período recuperável', 'Documentos necessários', 'Cálculo passo a passo', 'Compensação e habilitação', 'Riscos e cuidados', 'Perguntas frequentes'],
      arquivo: { nome: 'Guia_ICMS_PIS_Cofins_v4.pdf', tamanho: '3,6 MB' }, tags: ['ICMS', 'PIS/Cofins', 'Tema 69', 'Lucro Real', 'Lucro Presumido'], autorId: 7, publicadoEm: '2026-03-10', atualizadoEm: '2026-10-02', versao: 4 }),
    M({ id: 4108, categoriaId: 2, ordem: 2, tipo: 'apresentacao', titulo: 'Créditos de PIS/Cofins sobre insumos',
      descricao: 'Aula sobre o conceito de insumo pelos critérios de essencialidade e relevância, com exemplos por segmento industrial e o que costuma ser glosado.',
      slides: 32, slideTitulos: ['Créditos de PIS/Cofins sobre insumos', 'O que é insumo', 'Essencialidade e relevância', 'Exemplos na indústria', 'Exemplos em logística', 'O que costuma ser glosado', 'Como documentar', 'Resumo'],
      arquivo: { nome: 'Insumos_PIS_Cofins.pptx', tamanho: '9,8 MB' }, tags: ['insumos', 'PIS/Cofins', 'Lucro Real', 'essencialidade'], autorId: 6, publicadoEm: '2026-04-22' }),
    M({ id: 4109, categoriaId: 2, ordem: 3, tipo: 'video', titulo: 'Subvenções de ICMS na base do IRPJ/CSLL',
      descricao: 'Webinar interno sobre o tratamento das subvenções de ICMS, as mudanças na legislação e como avaliar o histórico das empresas do Lucro Real.',
      duracao: 1360, capitulos: [[0, 'Introdução'], [240, 'O que mudou na legislação'], [610, 'Como avaliar o histórico'], [980, 'Casos práticos'], [1220, 'Perguntas']],
      arquivo: { nome: 'Subvencoes_ICMS.mp4', tamanho: '780 MB' }, tags: ['subvenção', 'IRPJ', 'CSLL', 'Lucro Real'], autorId: 6, publicadoEm: '2026-09-29' }),
    M({ id: 4110, categoriaId: 2, ordem: 4, tipo: 'pdf', titulo: 'PIS/Cofins monofásico na revenda',
      descricao: 'Quando há crédito a recuperar na revenda de produtos com tributação concentrada (autopeças, cosméticos, farmacêuticos) e como montar o levantamento por NCM.',
      paginas: 10, secoes: ['O que é tributação monofásica', 'Segmentos com mais aderência', 'Levantamento por NCM', 'Cálculo e período', 'Documentos', 'Cuidados'],
      arquivo: { nome: 'Monofasico_Revenda.pdf', tamanho: '1,4 MB' }, tags: ['monofásico', 'revenda', 'autopeças', 'cosméticos', 'NCM'], autorId: 7, publicadoEm: '2026-07-14' }),
    M({ id: 4111, categoriaId: 2, ordem: 5, tipo: 'pdf', titulo: 'IRPJ e CSLL sobre a Selic na repetição de indébito (Tema 962/STF)',
      descricao: 'Resumo da decisão do STF que afastou o IRPJ e a CSLL sobre a Selic recebida na restituição ou na compensação de tributos: quem pode recuperar, período e como calcular. Conteúdo a validar pelos sócios tributaristas.',
      paginas: 9, secoes: ['O que o STF decidiu', 'Quem pode recuperar', 'Restituição e compensação', 'Cálculo e período', 'Documentos', 'Riscos'],
      arquivo: { nome: 'Selic_Indebito_Tema962.pdf', tamanho: '1,2 MB' }, tags: ['Selic', 'IRPJ', 'CSLL', 'indébito', 'Tema 962'], autorId: 7, publicadoEm: '2026-08-05' }),
    M({ id: 4112, categoriaId: 2, ordem: 6, tipo: 'planilha', titulo: 'Matriz de teses por regime e segmento', destaque: true, planilha: 'matriz',
      descricao: 'Tabela de triagem usada no diagnóstico: quais teses se aplicam a cada regime tributário e quais segmentos têm mais aderência.',
      abas: 2, arquivo: { nome: 'Matriz_Teses_2026.xlsx', tamanho: '64 KB' }, tags: ['teses', 'regime', 'segmento', 'triagem'], autorId: 8, publicadoEm: '2026-10-12' }),

    /* 3 · Modelos jurídicos */
    M({ id: 4113, categoriaId: 3, ordem: 1, tipo: 'documento', titulo: 'Modelo de mandado de segurança: exclusão do ICMS', modelo: true, papeis: JUR,
      descricao: 'Petição inicial padrão para a tese do ICMS na base do PIS/Cofins, com pedido de compensação. Revise a qualificação, o período e a jurisprudência antes de protocolar.',
      paginas: 14, secoes: ['Qualificação', 'Dos fatos', 'Do direito', 'Da compensação', 'Do pedido liminar', 'Dos pedidos'],
      arquivo: { nome: 'MS_Exclusao_ICMS_MODELO.docx', tamanho: '540 KB' }, tags: ['mandado de segurança', 'petição', 'ICMS'], autorId: 6, publicadoEm: '2026-02-19', atualizadoEm: '2026-09-03', versao: 3 }),
    M({ id: 4114, categoriaId: 3, ordem: 2, tipo: 'documento', titulo: 'Procuração ad judicia et extra', modelo: true,
      descricao: 'Modelo de procuração para representação judicial e administrativa. O consultor envia este modelo à empresa depois da assinatura do contrato de honorários.',
      paginas: 2, secoes: ['Outorgante', 'Outorgados', 'Poderes', 'Assinatura'],
      arquivo: { nome: 'Procuracao_MODELO.docx', tamanho: '48 KB' }, tags: ['procuração', 'modelo', 'contrato'], autorId: 7, publicadoEm: '2026-01-26' }),
    M({ id: 4115, categoriaId: 3, ordem: 3, tipo: 'pdf', titulo: 'Checklist de habilitação de crédito (PER/DCOMP)', papeis: ['socio', 'gestor_juridico', 'advogado', 'calculo', 'financeiro'],
      descricao: 'Passo a passo e documentos para habilitar o crédito reconhecido judicialmente e transmitir as compensações.',
      paginas: 5, secoes: ['Antes de começar', 'Documentos do processo', 'Pedido de habilitação', 'Transmissão do PER/DCOMP', 'Acompanhamento'],
      arquivo: { nome: 'Checklist_PERDCOMP.pdf', tamanho: '640 KB' }, tags: ['PER/DCOMP', 'habilitação', 'compensação', 'checklist'], autorId: 8, publicadoEm: '2026-06-30' }),
    M({ id: 4116, categoriaId: 3, ordem: 4, tipo: 'documento', titulo: 'Pedido de habilitação de crédito judicial', modelo: true, papeis: JUR,
      descricao: 'Requerimento à Receita Federal para habilitar crédito decorrente de decisão transitada em julgado, com a lista de anexos.',
      paginas: 4, secoes: ['Requerente', 'Do crédito', 'Dos documentos anexos', 'Do pedido'],
      arquivo: { nome: 'Habilitacao_Credito_MODELO.docx', tamanho: '96 KB' }, tags: ['habilitação', 'Receita Federal', 'trânsito em julgado'], autorId: 6, publicadoEm: '2026-07-07' }),

    /* 4 · Treinamentos e vídeos */
    M({ id: 4117, categoriaId: 4, ordem: 1, tipo: 'video', titulo: 'Integração Atlas: mensagem dos sócios', novaVersao: { responsavelId: 11, ate: '2026-11-12' },
      descricao: 'Boas-vindas de Mariana Duarte e Ricardo Fontana: a história da Atlas, como trabalhamos com as empresas clientes e o que esperamos de cada área. É o primeiro item da trilha de integração.',
      duracao: 750, capitulos: [[0, 'Boas-vindas'], [120, 'Nossa história'], [290, 'Como trabalhamos com os clientes'], [480, 'O que esperamos de cada área'], [650, 'Próximos passos']],
      arquivo: { nome: 'Integracao_Socios_2026.mp4', tamanho: '320 MB' }, tags: ['integração', 'boas-vindas', 'cultura'], autorId: 1, publicadoEm: '2026-02-02' }),
    M({ id: 4118, categoriaId: 4, ordem: 2, tipo: 'video', titulo: 'Como registrar uma reunião',
      descricao: 'Tutorial rápido do CRM: registrar a reunião no negócio, escolher o resultado e criar a próxima tarefa obrigatória.',
      duracao: 252, capitulos: [[0, 'Abrir o negócio'], [48, 'Registrar a atividade'], [130, 'Escolher o resultado'], [190, 'Criar a próxima tarefa']],
      arquivo: { nome: 'Tutorial_Registrar_Reuniao.mp4', tamanho: '58 MB' }, tags: ['CRM', 'reunião', 'atividade', 'tutorial'], autorId: 11, publicadoEm: '2026-11-04' }),
    M({ id: 4119, categoriaId: 4, ordem: 3, tipo: 'video', titulo: 'Leitura de SPED Fiscal e EFD-Contribuições',
      descricao: 'Aula da equipe de cálculo: como abrir os arquivos, quais registros importam para cada tese e como conferir os totais com a escrituração.',
      duracao: 2295, capitulos: [[0, 'Visão geral dos arquivos'], [420, 'Registros do SPED Fiscal'], [1050, 'Registros da EFD-Contribuições'], [1680, 'Conferência dos totais'], [2080, 'Erros comuns']],
      arquivo: { nome: 'SPED_EFD_Leitura.mp4', tamanho: '1,2 GB' }, tags: ['SPED', 'EFD', 'cálculo', 'arquivos fiscais'], autorId: 8, publicadoEm: '2026-05-18' }),
    M({ id: 4120, categoriaId: 4, ordem: 4, tipo: 'link', titulo: 'Webinar: reforma tributária e os créditos em andamento', destaque: true, download: false,
      descricao: 'Gravação do webinar para clientes sobre a transição para o IBS e a CBS e o que acontece com os créditos já em discussão. Fica hospedado na plataforma de eventos.',
      duracao: 3480, link: { url: 'https://eventos.atlas.exemplo/webinar-reforma-tributaria', dominio: 'eventos.atlas.exemplo', resumo: 'Webinar gravado · 58 min · acesso com o e-mail da Atlas' },
      tags: ['reforma tributária', 'IBS', 'CBS', 'webinar'], autorId: 1, publicadoEm: '2026-10-28' }),
    M({ id: 4121, categoriaId: 4, ordem: 5, tipo: 'video', titulo: 'Atendimento ao cliente (versão 2025)', ativo: false,
      descricao: 'Versão antiga, substituída pelo treinamento "Como conduzir a apresentação do levantamento".',
      duracao: 1100, arquivo: { nome: 'Atendimento_2025.mp4', tamanho: '460 MB' }, tags: ['atendimento'], autorId: 2, publicadoEm: '2025-03-10' }),
    M({ id: 4122, categoriaId: 4, ordem: 6, tipo: 'video', titulo: 'Workshop: cálculo de créditos de insumos na prática', status: 'processando', processamento: 68,
      descricao: 'Gravação do workshop interno de 06/11 com dois casos anonimizados, de indústria e de logística, do levantamento até a planilha final.',
      duracao: 2822, capitulos: [[0, 'Abertura'], [380, 'Caso 1: indústria'], [1420, 'Caso 2: logística'], [2390, 'Perguntas']],
      arquivo: { nome: 'Workshop_Insumos.mp4', tamanho: '1,6 GB' }, tags: ['insumos', 'cálculo', 'workshop'], autorId: 8, publicadoEm: '2026-11-06' }),

    /* 5 · Políticas e compliance */
    M({ id: 4123, categoriaId: 5, ordem: 1, tipo: 'pdf', titulo: 'Código de conduta e ética', aceite: true,
      descricao: 'Princípios e regras de conduta da Atlas com clientes, parceiros e colegas. A leitura precisa ser confirmada por todos.',
      paginas: 14, secoes: ['Nossos princípios', 'Relação com clientes', 'Conflito de interesses', 'Confidencialidade', 'Uso de recursos da empresa', 'Canal para dúvidas', 'Confirmação de leitura'],
      arquivo: { nome: 'Codigo_Conduta_v2.pdf', tamanho: '1,8 MB' }, tags: ['conduta', 'ética', 'leitura obrigatória'], autorId: 1, publicadoEm: '2026-01-12', atualizadoEm: '2026-06-01', versao: 2 }),
    M({ id: 4124, categoriaId: 5, ordem: 2, tipo: 'pdf', titulo: 'Política de privacidade e proteção de dados (LGPD)', aceite: true,
      descricao: 'Como tratamos os dados pessoais de clientes, contatos e colaboradores: bases legais, retenção, compartilhamento e resposta a incidentes.',
      paginas: 11, secoes: ['Escopo', 'Dados que tratamos', 'Bases legais', 'Retenção e descarte', 'Compartilhamento', 'Incidentes', 'Direitos dos titulares'],
      arquivo: { nome: 'Politica_LGPD.pdf', tamanho: '1,3 MB' }, tags: ['LGPD', 'dados pessoais', 'privacidade', 'leitura obrigatória'], autorId: 1, publicadoEm: '2026-01-12' }),
    M({ id: 4125, categoriaId: 5, ordem: 3, tipo: 'pdf', titulo: 'Política de segurança da informação e senhas', aceite: true,
      descricao: 'Regras de acesso ao sistema, verificação em duas etapas, senhas, uso do e-mail e envio de arquivos de clientes.',
      paginas: 7, secoes: ['Acesso ao sistema', 'Verificação em duas etapas', 'Senhas', 'E-mail e anexos', 'Arquivos de clientes', 'Incidentes'],
      arquivo: { nome: 'Politica_Seguranca.pdf', tamanho: '820 KB' }, tags: ['segurança', 'senhas', 'MFA', 'leitura obrigatória'], autorId: 1, publicadoEm: '2026-03-02' }),
    M({ id: 4126, categoriaId: 5, ordem: 4, tipo: 'documento', titulo: 'Política de brindes, presentes e hospitalidade',
      descricao: 'Limites e registro de brindes e convites recebidos ou oferecidos a clientes, contadores parceiros e servidores públicos.',
      paginas: 3, secoes: ['Objetivo', 'Limites', 'Registro', 'Exceções'],
      arquivo: { nome: 'Politica_Brindes.docx', tamanho: '74 KB' }, tags: ['brindes', 'compliance', 'clientes'], autorId: 1, publicadoEm: '2026-04-15' }),

    /* 6 · Institucional e marca */
    M({ id: 4127, categoriaId: 6, ordem: 1, tipo: 'pdf', titulo: 'Manual de marca Atlas Corporate',
      descricao: 'Logotipo, cores (preto e dourado), tipografia (Source Serif 4 e Inter), aplicações e o que não fazer com a marca.',
      paginas: 28, secoes: ['Logotipo', 'Área de proteção', 'Cores', 'Tipografia', 'Aplicações', 'O que evitar'],
      arquivo: { nome: 'Manual_Marca_Atlas.pdf', tamanho: '12,6 MB' }, tags: ['marca', 'logo', 'cores', 'tipografia'], autorId: 11, publicadoEm: '2026-02-09' }),
    M({ id: 4128, categoriaId: 6, ordem: 2, tipo: 'imagem', titulo: 'Assinatura de e-mail padrão', imagem: 'assinatura',
      descricao: 'Modelo da assinatura de e-mail com nome, cargo, telefone e a marca da Atlas. Siga o modelo; não use imagens soltas na assinatura.',
      arquivo: { nome: 'Assinatura_Email_Atlas.png', tamanho: '240 KB' }, tags: ['assinatura', 'e-mail', 'marca'], autorId: 11, publicadoEm: '2026-02-09', atualizadoEm: '2026-08-12', versao: 2 }),
    M({ id: 4129, categoriaId: 6, ordem: 3, tipo: 'apresentacao', titulo: 'Modelo de apresentação em branco',
      descricao: 'Modelo com capa, divisórias, tabelas e gráficos no padrão da marca para apresentações a clientes.',
      slides: 12, slideTitulos: ['Título da apresentação', 'Agenda', 'Divisória de seção', 'Texto com destaque', 'Tabela', 'Gráfico', 'Encerramento'],
      arquivo: { nome: 'Modelo_Apresentacao_Atlas.pptx', tamanho: '6,1 MB' }, tags: ['modelo', 'PowerPoint', 'marca'], autorId: 11, publicadoEm: '2026-02-09' }),

    /* 7 · Manuais do sistema */
    M({ id: 4130, categoriaId: 7, ordem: 1, tipo: 'pdf', titulo: 'Manual do CRM: o funil de 10 etapas',
      descricao: 'O que cada etapa do funil exige, como registrar atividades e por que todo negócio precisa de uma próxima tarefa.',
      paginas: 16, secoes: ['Visão geral do funil', 'Etapas 1 a 3: prospecção', 'Etapas 4 a 6: diagnóstico e documentos', 'Etapas 7 e 8: cálculo e apresentação', 'Etapas 9 e 10: proposta e contrato', 'Próxima tarefa obrigatória', 'Painel do consultor'],
      arquivo: { nome: 'Manual_CRM.pdf', tamanho: '2,9 MB' }, tags: ['CRM', 'funil', 'etapas', 'próxima tarefa'], autorId: 2, publicadoEm: '2026-09-21', atualizadoEm: '2026-10-26', versao: 2 }),
    M({ id: 4131, categoriaId: 7, ordem: 2, tipo: 'video', titulo: 'Regra D-1: como o sistema calcula o prazo interno', destaque: true,
      descricao: 'Explica o prazo interno um dia útil antes do fatal, como feriados e suspensões entram no cálculo e o que acontece no dia fatal.',
      duracao: 408, capitulos: [[0, 'Por que D-1'], [75, 'Dias úteis e feriados'], [180, 'Suspensões e recesso'], [290, 'Alertas do dia fatal'], [360, 'Exemplo no sistema']],
      arquivo: { nome: 'Regra_D1.mp4', tamanho: '96 MB' }, tags: ['prazos', 'D-1', 'dias úteis', 'jurídico'], autorId: 6, publicadoEm: '2026-09-14', atualizadoEm: '2026-10-30', versao: 2 }),
    M({ id: 4132, categoriaId: 7, ordem: 3, tipo: 'pdf', titulo: 'Guia rápido do financeiro: honorários mensais e de êxito', papeis: ['socio', 'gestor_comercial', 'financeiro'],
      descricao: 'Como lançar o honorário mensal, registrar o êxito quando o crédito é compensado e acompanhar o contas a receber.',
      paginas: 9, secoes: ['Honorário mensal', 'Honorário de êxito', 'Boletos e cobrança', 'Contas a receber', 'Fechamento do mês'],
      arquivo: { nome: 'Guia_Financeiro.pdf', tamanho: '1,5 MB' }, tags: ['financeiro', 'honorários', 'boletos'], autorId: 10, publicadoEm: '2026-10-19' }),
    M({ id: 4133, categoriaId: 7, ordem: 4, tipo: 'link', titulo: 'Central de ajuda do sistema', download: false,
      descricao: 'Perguntas frequentes e contato do suporte do Atlas · Gestão.',
      link: { url: 'https://ajuda.atlas.exemplo', dominio: 'ajuda.atlas.exemplo', resumo: 'Perguntas frequentes, novidades da versão e formulário de suporte' },
      tags: ['ajuda', 'suporte', 'dúvidas'], autorId: 11, publicadoEm: '2026-10-26' }),

    /* 8 · RH e onboarding */
    M({ id: 4134, categoriaId: 8, ordem: 1, tipo: 'pdf', titulo: 'Guia do novo colaborador', aceite: true, destaque: true,
      descricao: 'O que você precisa na primeira semana: rotina, ferramentas, quem procurar em cada área, horários e regras do escritório em Campinas.',
      paginas: 16, secoes: ['Bem-vindo à Atlas', 'Primeira semana', 'Ferramentas e acessos', 'Quem procurar', 'Horários e escritório', 'Reembolso e benefícios', 'Confirmação de leitura'],
      arquivo: { nome: 'Guia_Novo_Colaborador_v3.pdf', tamanho: '4,2 MB' }, tags: ['onboarding', 'boas-vindas', 'rotina'], autorId: 11, publicadoEm: '2026-01-20', atualizadoEm: '2026-09-01', versao: 3 }),
    M({ id: 4135, categoriaId: 8, ordem: 2, tipo: 'imagem', titulo: 'Calendário de feriados e recesso 2026', imagem: 'calendario',
      descricao: 'Feriados nacionais, estaduais, de Campinas e forenses, e o recesso da Justiça Federal. É o mesmo calendário usado no cálculo dos prazos.',
      arquivo: { nome: 'Calendario_2026.png', tamanho: '410 KB' }, tags: ['feriados', 'recesso', 'calendário'], autorId: 11, publicadoEm: '2026-01-05', atualizadoEm: '2026-10-15', versao: 2 }),
    M({ id: 4136, categoriaId: 8, ordem: 3, tipo: 'imagem', titulo: 'Organograma Atlas 2026', imagem: 'organograma',
      descricao: 'Áreas, responsáveis e a quem cada pessoa se reporta. Atualizado com a chegada da equipe de cálculo.',
      arquivo: { nome: 'Organograma_2026.png', tamanho: '380 KB' }, tags: ['organograma', 'equipe', 'áreas'], autorId: 11, publicadoEm: '2026-03-16', atualizadoEm: '2026-11-03', versao: 3 }),
    M({ id: 4137, categoriaId: 8, ordem: 4, tipo: 'documento', titulo: 'Benefícios e reembolso de despesas',
      descricao: 'Benefícios da Atlas, como pedir reembolso de deslocamento a clientes e o prazo para enviar comprovantes.',
      paginas: 5, secoes: ['Benefícios', 'Deslocamento a clientes', 'Como pedir reembolso', 'Prazos', 'Dúvidas'],
      arquivo: { nome: 'Beneficios_Reembolso.docx', tamanho: '150 KB' }, tags: ['benefícios', 'reembolso', 'despesas'], autorId: 11, publicadoEm: '2026-02-23' })
  ];

  /* Conteúdo das planilhas de exemplo (pré-visualização) */
  DI.planilhas = {
    honorarios: {
      abas: ['Simulação', 'Tabela de percentuais', 'Histórico'],
      colunas: ['Item', 'Valor', 'Observação'],
      linhas: [
        ['Empresa (exemplo)', 'Metalúrgica Vale do Atibaia Ltda', ''],
        ['Regime tributário', 'Lucro Real', ''],
        ['Tese', 'Exclusão do ICMS da base do PIS/Cofins', ''],
        ['Período analisado', 'nov/2021 a out/2026', '60 meses'],
        ['Crédito estimado', { v: 1850000, f: 'moeda' }, 'Levantamento da equipe de cálculo'],
        ['Percentual de êxito', { v: 20, f: 'pct', formula: '=PROCV(B6;\'Tabela de percentuais\'!A:B;2)' }, 'Pela faixa do crédito'],
        ['Honorário de êxito', { v: 370000, f: 'moeda', formula: '=B6*B7' }, ''],
        ['Honorário mensal', { v: 4500, f: 'moeda' }, 'Durante o processo'],
        ['Parcelas do êxito', { v: 10, f: 'num' }, 'Conforme compensação'],
        ['Valor por parcela', { v: 37000, f: 'moeda', formula: '=B8/B10' }, '']
      ],
      extras: [
        [['Faixa de crédito estimado', 'Êxito'], ['Até R$ 500 mil', '25%'], ['De R$ 500 mil a R$ 2 mi', '20%'], ['De R$ 2 mi a R$ 5 mi', '18%'], ['Acima de R$ 5 mi', '15%']],
        [['Versão', 'Data', 'Alteração'], ['4', '30/10/2026', 'Faixa acima de R$ 5 mi passa a 15%'], ['3', '02/09/2026', 'Campo de honorário mensal'], ['2', '11/08/2026', 'Parcelamento do êxito'], ['1', '20/07/2026', 'Primeira versão']]
      ]
    },
    matriz: {
      abas: ['Matriz', 'Legenda'],
      colunas: ['Tese', 'Lucro Real', 'Lucro Presumido', 'Mais aderência', 'Prazo'],
      linhas: [
        ['Exclusão do ICMS da base do PIS/Cofins', 'Sim', 'Sim', 'Indústria e comércio', '5 anos'],
        ['Créditos de PIS/Cofins sobre insumos', 'Sim', 'Não', 'Indústria e logística', '5 anos'],
        ['PIS/Cofins monofásico (revenda)', 'Avaliar', 'Avaliar', 'Autopeças, cosméticos, farma', '5 anos'],
        ['Previdenciária sobre verbas indenizatórias', 'Sim', 'Sim', 'Folha relevante', '5 anos'],
        ['IRPJ/CSLL sobre a Selic no indébito (Tema 962)', 'Sim', 'Sim', 'Quem já restituiu ou compensou tributos', '5 anos'],
        ['Exclusão do ISS da base do PIS/Cofins', 'Sim', 'Sim', 'Serviços', '5 anos'],
        ['Créditos extemporâneos de PIS/Cofins', 'Sim', 'Não', 'Indústria', '5 anos'],
        ['Recuperação de ICMS-ST', 'Avaliar', 'Avaliar', 'Varejo e distribuição', '5 anos'],
        ['Subvenções de ICMS na base do IRPJ/CSLL', 'Sim', 'Não', 'Indústria com benefício de ICMS', '5 anos']
      ],
      extras: [
        [['Valor', 'Significado'], ['Sim', 'A tese se aplica ao regime'], ['Não', 'Não se aplica ao regime'], ['Avaliar', 'Depende da operação: confirmar no diagnóstico']]
      ]
    }
  };

  /* ---------------- Trilhas de onboarding ---------------- */
  /* prazoDias = dias ÚTEIS (calendário de feriados do sistema) contados da inclusão da pessoa na trilha
     ou da publicação do material, o que for mais tarde. aceite = exige "Confirmo que li". */
  DI.trilhas = [
    { id: 4201, nome: 'Integração Atlas', cor: 'amber', publico: 'Todos os novos colaboradores', papeis: null, criadaEm: '2026-02-02', responsavelId: 11,
      descricao: 'Primeiros dias na Atlas: mensagem dos sócios, políticas obrigatórias e o básico do sistema.',
      etapas: [
        { materialId: 4117, prazoDias: 1, obrigatorio: true },
        { materialId: 4134, prazoDias: 1, obrigatorio: true, aceite: true },
        { materialId: 4123, prazoDias: 3, obrigatorio: true, aceite: true },
        { materialId: 4125, prazoDias: 3, obrigatorio: true, aceite: true },
        { materialId: 4124, prazoDias: 5, obrigatorio: true, aceite: true },
        { materialId: 4131, prazoDias: 5, obrigatorio: true },
        { materialId: 4130, prazoDias: 10, obrigatorio: true },
        { materialId: 4127, prazoDias: 10, obrigatorio: false },
        { materialId: 4135, prazoDias: 10, obrigatorio: false }
      ] },
    { id: 4202, nome: 'Trilha comercial', cor: 'gold', publico: 'Consultores comerciais', papeis: ['consultor'], criadaEm: '2026-10-26', responsavelId: 2,
      descricao: 'Método comercial da Atlas no funil novo: reunião de diagnóstico, objeções, proposta e apresentação dos cálculos.',
      etapas: [
        { materialId: 4101, prazoDias: 5, obrigatorio: true },
        { materialId: 4102, prazoDias: 5, obrigatorio: true },
        { materialId: 4105, prazoDias: 7, obrigatorio: true },
        { materialId: 4103, prazoDias: 7, obrigatorio: true },
        { materialId: 4106, prazoDias: 10, obrigatorio: true },
        { materialId: 4107, prazoDias: 10, obrigatorio: true },
        { materialId: 4112, prazoDias: 15, obrigatorio: true },
        { materialId: 4104, prazoDias: 15, obrigatorio: false }
      ] },
    { id: 4203, nome: 'Trilha jurídica e de cálculo', cor: 'slate', publico: 'Advogados e analistas de cálculo', papeis: ['advogado', 'calculo'], criadaEm: '2026-10-26', responsavelId: 6,
      descricao: 'Teses, arquivos fiscais e modelos jurídicos para quem entra no jurídico ou na equipe de cálculo.',
      etapas: [
        { materialId: 4119, prazoDias: 5, obrigatorio: true },
        { materialId: 4107, prazoDias: 5, obrigatorio: true },
        { materialId: 4108, prazoDias: 7, obrigatorio: true },
        { materialId: 4115, prazoDias: 7, obrigatorio: true },
        { materialId: 4113, prazoDias: 10, obrigatorio: true },
        { materialId: 4116, prazoDias: 10, obrigatorio: true },
        { materialId: 4109, prazoDias: 15, obrigatorio: false }
      ] }
  ];

  /* Inclusões: quem está em cada trilha e desde quando.
     motivo: 'lancamento' (incluído quando a trilha foi criada) · 'admissao' (novo colaborador) */
  DI.inscricoes = [
    { pessoaId: 9, trilhaId: 4201, inicio: '2026-11-03', motivo: 'admissao' },
    { pessoaId: 9, trilhaId: 4203, inicio: '2026-11-03', motivo: 'admissao' },
    { pessoaId: 3, trilhaId: 4202, inicio: '2026-10-26', motivo: 'lancamento' },
    { pessoaId: 4, trilhaId: 4202, inicio: '2026-10-26', motivo: 'lancamento' },
    { pessoaId: 5, trilhaId: 4202, inicio: '2026-10-26', motivo: 'lancamento' }
  ];
  [3, 4, 5, 6, 7, 8, 10, 11].forEach(function (pid) { DI.inscricoes.push({ pessoaId: pid, trilhaId: 4201, inicio: '2026-02-02', motivo: 'lancamento' }); });
  /* Admissão e convite do novo colaborador (Gustavo Ramos é "convidado" em data.js: nunca acessou) */
  DI.admissoes = { 9: { admissao: '2026-11-03', conviteEm: '2026-11-03T10:12', gestorId: 6 } };

  /* ---------------- Conclusões (pessoa × material) ---------------- */
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hora(d, r) { d = util.parse(d); d.setHours(8 + Math.floor(r() * 10), Math.floor(r() * 60), 0, 0); return d; }
  var mat = function (id) { for (var i = 0; i < DI.materiais.length; i++) if (DI.materiais[i].id === id) return DI.materiais[i]; return null; };
  DI.conclusoes = {}; /* chave 'pessoaId:materialId' → 'YYYY-MM-DDTHH:MM' */
  var conc = function (pid, mid, quando) { DI.conclusoes[pid + ':' + mid] = quando; };

  /* Integração Atlas: todos foram incluídos no lançamento (02/02). Itens acrescentados depois
     (Regra D-1 em 14/09 e Manual do CRM em 21/09) contam da publicação. */
  var pulaInt = { 4: [4131, 4130], 3: [4130], 8: [4127], 7: [4135] };
  var atrasaInt = { '4:4123': 4, '6:4125': 2 };
  [3, 4, 5, 6, 7, 8, 10, 11].forEach(function (pid) {
    DI.trilhas[0].etapas.forEach(function (e) {
      var m = mat(e.materialId); if (m.autorId === pid) return;
      if ((pulaInt[pid] || []).indexOf(e.materialId) >= 0) return;
      var r = rng(pid * 1000 + e.materialId), ini = util.parse(m.publicadoEm > '2026-02-02' ? m.publicadoEm : '2026-02-02');
      var dias = atrasaInt[pid + ':' + e.materialId] != null ? e.prazoDias + atrasaInt[pid + ':' + e.materialId] : Math.floor(r() * (e.prazoDias + 1));
      conc(pid, e.materialId, util.isoHora(hora(dias ? util.addDiasUteis(ini, dias) : util.proximoDiaUtil(ini), r)));
    });
  });
  /* Trilha comercial (desde 26/10) */
  [[3, 4101, '2026-10-27T10:05'], [3, 4102, '2026-10-27T15:40'], [3, 4103, '2026-10-29T09:20'], [3, 4106, '2026-11-04T17:10'], [3, 4107, '2026-11-05T11:30'],
   [5, 4101, '2026-10-28T09:45'], [5, 4102, '2026-10-30T14:15'], [5, 4105, '2026-11-04T10:20'], [5, 4103, '2026-11-05T16:50'],
   [4, 4101, '2026-10-30T18:05']
  ].forEach(function (x) { conc(x[0], x[1], x[2]); });

  /* ---------------- Visto por (registro de visualização) ---------------- */
  /* Gerado de forma determinística (mesmo resultado a cada carga) e depois ajustado às conclusões das trilhas. */
  var HOJE = App.HOJE;
  var naTrilha = {}; DI.trilhas.forEach(function (t) { t.etapas.forEach(function (e) { naTrilha[e.materialId] = true; }); });
  DI.materiais.forEach(function (m) {
    var r = rng(m.id * 7919), pub = util.parse(m.publicadoEm), diasPub = Math.max(1, util.diasEntre(pub, HOJE));
    var base = m.status === 'processando' ? 0 : m.aceite ? 0.96 : m.destaque ? 0.85 : !m.ativo ? 0.55 : diasPub < 10 ? 0.4 : 0.62;
    m.vistoPor = [];
    D.equipe.forEach(function (p) {
      if (p.status !== 'ativo' || p.id === m.autorId) return;
      if (m.papeis && m.papeis.indexOf(p.papel) < 0) return;
      if (r() > base) return;
      var d = util.addDias(pub, Math.floor(r() * Math.min(diasPub, 120)));
      if (util.fimDeSemana(d)) d = util.proximoDiaUtil(d);
      if (util.diasEntre(d, HOJE) <= 0) d = util.addDias(HOJE, -1 - Math.floor(r() * 2));
      var prog = m.tipo === 'video' ? (r() < 0.72 ? 100 : 15 + Math.floor(r() * 70)) : 100;
      m.vistoPor.push({ pessoaId: p.id, quando: util.isoHora(hora(d, r)), progresso: prog });
    });
    /* trilhas: quem concluiu viu na data da conclusão; quem está inscrito e não concluiu ainda não abriu */
    if (naTrilha[m.id]) {
      DI.inscricoes.forEach(function (ins) {
        var t = DI.trilhas.filter(function (x) { return x.id === ins.trilhaId; })[0];
        if (!t.etapas.some(function (e) { return e.materialId === m.id; })) return;
        var q = DI.conclusoes[ins.pessoaId + ':' + m.id];
        m.vistoPor = m.vistoPor.filter(function (v) { return v.pessoaId !== ins.pessoaId; });
        if (q) m.vistoPor.push({ pessoaId: ins.pessoaId, quando: q, progresso: 100 });
      });
    }
    if (m.aceite) m.vistoPor.forEach(function (v) { v.aceite = true; });
    m.vistoPor.sort(function (a, b) { return a.quando < b.quando ? 1 : -1; });
    m.visualizacoes = m.vistoPor.length + Math.floor(r() * m.vistoPor.length * 1.6);
    m.downloads = (m.tipo === 'video' || m.tipo === 'link' || !m.download) ? 0 : Math.floor(r() * 26) + (m.destaque ? 12 : 0);
  });
  /* Mariana (usuária logada) parou dois vídeos no meio: aparecem em "Continuar assistindo" */
  [[4106, 45, '2026-11-06T18:20'], [4109, 30, '2026-11-03T12:40']].forEach(function (x) {
    var m = mat(x[0]);
    m.vistoPor = m.vistoPor.filter(function (v) { return v.pessoaId !== 1; });
    m.vistoPor.unshift({ pessoaId: 1, quando: x[2], progresso: x[1] });
  });
  /* O tutorial novo ainda não foi visto pela Mariana */
  mat(4118).vistoPor = mat(4118).vistoPor.filter(function (v) { return v.pessoaId !== 1; });

  /* Histórico de versões e de edição (ficha de edição) */
  DI.historico = {
    4107: [
      { quando: '2026-10-02T16:40', pessoaId: 7, acao: 'Enviou a versão 4', nota: 'Inclui a seção "Compensação e habilitação".' },
      { quando: '2026-07-21T10:05', pessoaId: 6, acao: 'Revisou a versão 3', nota: 'Ajuste no período recuperável.' },
      { quando: '2026-05-04T14:30', pessoaId: 11, acao: 'Trocou a capa', nota: '' },
      { quando: '2026-03-10T09:12', pessoaId: 7, acao: 'Publicou o material', nota: 'Versão 1 na categoria Teses tributárias.' }
    ]
  };
})();
