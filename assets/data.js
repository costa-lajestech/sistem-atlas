/* ==========================================================================
   ATLAS · data.js — DADOS COMPARTILHADOS (fictícios) usados por TODOS os módulos
   Regras:
   - Nada aqui é dado real. Nomes, CNPJs, telefones, e-mails e valores são inventados.
   - IDs são estáveis: os módulos referenciam estes IDs (não renumerar).
       equipe 1–11 · empresas 1–25 · contatos 101–140 · negócios 1001–1028
       processos 2001–2010 · contratos 3001–3009 · prazos 5001–5013 · tarefas 6001+ · eventos 7001+
   - Cada módulo ESTENDE em assets/data-<modulo>.js (App.data.crm, App.data.juridico…),
     sem alterar os registros daqui. Pode acrescentar campos novos lendo por ID.
   - Data de referência do protótipo: App.HOJE = segunda-feira 09/11/2026 09:30.
   ========================================================================== */
(function () {
  'use strict';
  var App = window.App, D = App.data;

  /* ---------------- Equipe Atlas (papéis em D.papeis) ---------------- */
  D.equipe = [
    { id: 1, nome: 'Mariana Duarte', cargo: 'Sócia-diretora', cargoCurto: 'Sócia', papel: 'socio', area: 'Diretoria', email: 'mariana.duarte@atlas.exemplo', telefone: '(19) 98811-2040', tone: 'gold', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T09:12' },
    { id: 2, nome: 'Ricardo Fontana', cargo: 'Sócio · Gestor comercial', cargoCurto: 'Gestor comercial', papel: 'gestor_comercial', area: 'Comercial', email: 'ricardo.fontana@atlas.exemplo', telefone: '(19) 98822-3151', tone: 'blue', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T08:47' },
    { id: 3, nome: 'Camila Nogueira', cargo: 'Consultora comercial', cargoCurto: 'Consultora', papel: 'consultor', area: 'Comercial', email: 'camila.nogueira@atlas.exemplo', telefone: '(19) 99134-7710', tone: 'violet', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T08:58' },
    { id: 4, nome: 'Thiago Bertolini', cargo: 'Consultor comercial', cargoCurto: 'Consultor', papel: 'consultor', area: 'Comercial', email: 'thiago.bertolini@atlas.exemplo', telefone: '(19) 99245-0832', tone: 'green', mfa: false, status: 'ativo', ultimoAcesso: '2026-11-06T18:20' },
    { id: 5, nome: 'Juliana Prado', cargo: 'Consultora comercial', cargoCurto: 'Consultora', papel: 'consultor', area: 'Comercial', email: 'juliana.prado@atlas.exemplo', telefone: '(19) 99356-1943', tone: 'slate', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T09:05' },
    { id: 6, nome: 'Eduardo Lacerda', cargo: 'Advogado sênior · Gestor jurídico', cargoCurto: 'Gestor jurídico', papel: 'gestor_juridico', area: 'Jurídico', oab: 'OAB/SP 198.452', email: 'eduardo.lacerda@atlas.exemplo', telefone: '(19) 98877-6204', tone: 'slate', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T08:31' },
    { id: 7, nome: 'Beatriz Sampaio', cargo: 'Advogada tributarista', cargoCurto: 'Advogada', papel: 'advogado', area: 'Jurídico', oab: 'OAB/SP 312.077', email: 'beatriz.sampaio@atlas.exemplo', telefone: '(19) 99468-3355', tone: 'gold', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T09:20' },
    { id: 8, nome: 'Felipe Moretti', cargo: 'Analista de cálculo tributário', cargoCurto: 'Cálculo', papel: 'calculo', area: 'Cálculo', email: 'felipe.moretti@atlas.exemplo', telefone: '(19) 99579-4466', tone: 'blue', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T08:15' },
    { id: 9, nome: 'Gustavo Ramos', cargo: 'Analista de cálculo tributário', cargoCurto: 'Cálculo', papel: 'calculo', area: 'Cálculo', email: 'gustavo.ramos@atlas.exemplo', telefone: '(19) 99680-5577', tone: 'green', mfa: false, status: 'convidado', ultimoAcesso: null },
    { id: 10, nome: 'Larissa Campos', cargo: 'Analista financeira', cargoCurto: 'Financeiro', papel: 'financeiro', area: 'Financeiro', email: 'larissa.campos@atlas.exemplo', telefone: '(19) 99791-6688', tone: 'violet', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-09T08:40' },
    { id: 11, nome: 'Renata Oliveira', cargo: 'Assistente administrativa', cargoCurto: 'Administrativo', papel: 'administrativo', area: 'Administrativo', email: 'renata.oliveira@atlas.exemplo', telefone: '(19) 99802-7799', tone: 'green', mfa: true, status: 'ativo', ultimoAcesso: '2026-11-08T17:02' }
  ];
  /* Filas de trabalho (tarefa atribuída a um grupo — AUT-09) */
  D.filas = [{ id: 'calculo', nome: 'Equipe de cálculo', membros: [8, 9] }, { id: 'juridico', nome: 'Equipe jurídica', membros: [6, 7] }];

  D.papeis = [
    { key: 'socio', nome: 'Sócio / Administrador', tone: 'gold', descricao: 'Vê tudo, configura o sistema, gerencia usuários e aprova exportações.' },
    { key: 'gestor_comercial', nome: 'Gestor comercial', tone: 'blue', descricao: 'Todos os leads, indicadores e metas da equipe comercial; recebe alertas de etapa parada.' },
    { key: 'consultor', nome: 'Consultor comercial', tone: 'violet', descricao: 'Só os próprios leads e negócios; registra atividades e cuida das próprias tarefas.' },
    { key: 'gestor_juridico', nome: 'Gestor jurídico', tone: 'slate', descricao: 'Todos os processos e prazos; recebe o alerta crítico do dia fatal.' },
    { key: 'advogado', nome: 'Advogado', tone: 'slate', descricao: 'Processos, andamentos e prazos sob sua responsabilidade (escopo a confirmar: Q4).' },
    { key: 'calculo', nome: 'Analista de cálculo', tone: 'green', descricao: 'Fila da equipe de cálculo: documentos recebidos, levantamento e apresentação.' },
    { key: 'financeiro', nome: 'Financeiro', tone: 'green', descricao: 'Contas a receber e a pagar, honorários, conciliação e relatórios financeiros.' },
    { key: 'administrativo', nome: 'Administrativo', tone: 'gray', descricao: 'Cadastros de apoio, agenda e intranet; sem acesso a valores.' }
  ];

  /* ---------------- Calendário: feriados 2026 e suspensões ---------------- */
  /* tipo: nacional | estadual | municipal | forense. Fonte BrasilAPI (nacionais) + cadastro manual (demais).
     escopo: sem escopo = vale para todos · 'jf' = só Justiça Federal (Lei 5.010/66, art. 62) · 'tjsp' = só Justiça Estadual de SP.
     O cálculo D-1 usa o calendário padrão (Campinas + Justiça Federal: escopo 'jf'); feriados do TJSP só contam
     com util.ehDiaUtil(d, { escopo: 'tjsp' }), para processos estaduais. */
  D.feriados = [
    { data: '2026-01-01', nome: 'Confraternização Universal', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-02-16', nome: 'Carnaval', tipo: 'forense', abrangencia: 'Justiça Federal', escopo: 'jf', fonte: 'Manual' },
    { data: '2026-02-17', nome: 'Carnaval', tipo: 'forense', abrangencia: 'Justiça Federal', escopo: 'jf', fonte: 'Manual' },
    { data: '2026-04-01', nome: 'Quarta-feira Santa', tipo: 'forense', abrangencia: 'Justiça Federal', escopo: 'jf', fonte: 'Manual' },
    { data: '2026-04-02', nome: 'Quinta-feira Santa', tipo: 'forense', abrangencia: 'Justiça Federal', escopo: 'jf', fonte: 'Manual' },
    { data: '2026-04-03', nome: 'Paixão de Cristo', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-04-21', nome: 'Tiradentes', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-05-01', nome: 'Dia do Trabalho', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-06-04', nome: 'Corpus Christi', tipo: 'municipal', abrangencia: 'Campinas', fonte: 'Manual', obs: 'Confirmar com a Atlas' },
    { data: '2026-07-09', nome: 'Revolução Constitucionalista', tipo: 'estadual', abrangencia: 'São Paulo', fonte: 'Manual' },
    { data: '2026-08-11', nome: 'Dia do Advogado (instalação dos cursos jurídicos)', tipo: 'forense', abrangencia: 'Justiça Federal', escopo: 'jf', fonte: 'Manual' },
    { data: '2026-09-07', nome: 'Independência do Brasil', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-10-12', nome: 'Nossa Senhora Aparecida', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-11-01', nome: 'Todos os Santos', tipo: 'forense', abrangencia: 'Justiça Federal', escopo: 'jf', fonte: 'Manual' },
    { data: '2026-11-02', nome: 'Finados', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-11-15', nome: 'Proclamação da República', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-11-20', nome: 'Dia da Consciência Negra', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    { data: '2026-12-08', nome: 'Nossa Senhora da Conceição', tipo: 'municipal', abrangencia: 'Campinas', fonte: 'Manual', obs: 'Também Dia da Justiça (forense)' },
    { data: '2026-12-25', nome: 'Natal', tipo: 'nacional', abrangencia: 'Brasil', fonte: 'BrasilAPI' },
    /* Justiça Estadual (TJSP): calendário próprio, não entra no D-1 dos processos federais */
    { data: '2026-02-16', nome: 'Carnaval (TJSP)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual' },
    { data: '2026-02-17', nome: 'Carnaval (TJSP)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual' },
    { data: '2026-02-18', nome: 'Quarta-feira de Cinzas (expediente a partir das 13h)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual', obs: 'Prazo que vence no dia passa para o dia útil seguinte (CPC, art. 224, § 1º)' },
    { data: '2026-04-02', nome: 'Quinta-feira Santa (TJSP)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual' },
    { data: '2026-06-04', nome: 'Corpus Christi (TJSP)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual', obs: 'Expediente suspenso em todo o estado' },
    { data: '2026-10-28', nome: 'Dia do Servidor Público (TJSP)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual', obs: 'Confirmar no provimento do Conselho Superior da Magistratura de 2026' },
    { data: '2026-12-08', nome: 'Dia da Justiça (TJSP)', tipo: 'forense', abrangencia: 'TJSP · Justiça Estadual', escopo: 'tjsp', fonte: 'Manual' }
  ];
  /* lista em ordem de data (o calendário do TJSP fica ao lado do feriado equivalente da Justiça Federal) */
  D.feriados.sort(function (a, b) { return a.data.localeCompare(b.data) || (a.escopo === 'tjsp') - (b.escopo === 'tjsp'); });
  D.suspensoes = [
    { id: 1, nome: 'Indisponibilidade do PJe (portaria do TRF3)', tipo: 'portaria', inicio: '2026-09-14', fim: '2026-09-14', abrangencia: 'TRF3', obs: 'Prazos prorrogados para o 1º dia útil seguinte' },
    { id: 2, nome: 'Recesso forense da Justiça Federal', tipo: 'recesso', inicio: '2026-12-20', fim: '2027-01-06', abrangencia: 'Justiça Federal', obs: 'Lei 5.010/66, art. 62, I' },
    { id: 3, nome: 'Suspensão de prazos processuais', tipo: 'suspensao', inicio: '2026-12-20', fim: '2027-01-20', abrangencia: 'Todos os tribunais', obs: 'CPC, art. 220' }
  ];

  /* ---------------- Empresas (clientes e prospects) ---------------- */
  /* relacao: cliente | prospect | perdido. faturamento = estimativa anual em R$. consultorId → equipe. */
  D.empresas = [
    { id: 1, razao: 'Metalúrgica Vale do Atibaia Ltda', fantasia: 'Metalatibaia', cnpj: '12.418.337/0001-00', segmento: 'Metalurgia', regime: 'Lucro Real', faturamento: 48000000, funcionarios: 210, cidade: 'Campinas', uf: 'SP', origem: 'Indicação de cliente', consultorId: 3, relacao: 'cliente', desde: '2025-08-12' },
    { id: 2, razao: 'Plastiform Embalagens Ltda', fantasia: 'Plastiform', cnpj: '07.552.910/0001-26', segmento: 'Plásticos e embalagens', regime: 'Lucro Presumido', faturamento: 22000000, funcionarios: 95, cidade: 'Hortolândia', uf: 'SP', origem: 'Parceiro contábil', consultorId: 4, relacao: 'prospect' },
    { id: 3, razao: 'Rota Bandeirantes Transportes e Logística Ltda', fantasia: 'Rota Bandeirantes', cnpj: '18.903.442/0001-03', segmento: 'Logística', regime: 'Lucro Real', faturamento: 65000000, funcionarios: 340, cidade: 'Sumaré', uf: 'SP', origem: 'LinkedIn', consultorId: 5, relacao: 'prospect' },
    { id: 4, razao: 'Serra Azul Alimentos S.A.', fantasia: 'Serra Azul', cnpj: '04.771.256/0001-53', segmento: 'Alimentos', regime: 'Lucro Real', faturamento: 120000000, funcionarios: 520, cidade: 'Vinhedo', uf: 'SP', origem: 'Evento/palestra', consultorId: 2, relacao: 'cliente', desde: '2025-03-04' },
    { id: 5, razao: 'Quimtec Paulínia Indústria Química Ltda', fantasia: 'Quimtec', cnpj: '22.164.583/0001-29', segmento: 'Química', regime: 'Lucro Real', faturamento: 85000000, funcionarios: 260, cidade: 'Paulínia', uf: 'SP', origem: 'Prospecção ativa', consultorId: 3, relacao: 'prospect' },
    { id: 6, razao: 'Têxtil Nova Odessa Ltda', fantasia: 'Têxtil Nova Odessa', cnpj: '09.318.774/0001-30', segmento: 'Têxtil', regime: 'Lucro Presumido', faturamento: 18000000, funcionarios: 130, cidade: 'Nova Odessa', uf: 'SP', origem: 'Site', consultorId: 4, relacao: 'prospect' },
    { id: 7, razao: 'Valinhos Autopeças e Distribuição Ltda', fantasia: 'Valinhos Autopeças', cnpj: '15.640.219/0001-22', segmento: 'Autopeças', regime: 'Lucro Presumido', faturamento: 26000000, funcionarios: 64, cidade: 'Valinhos', uf: 'SP', origem: 'Parceiro contábil', consultorId: 5, relacao: 'cliente', desde: '2026-02-19' },
    { id: 8, razao: 'Indaiá Usinagem de Precisão Ltda', fantasia: 'Indaiá Usinagem', cnpj: '28.055.631/0001-27', segmento: 'Usinagem', regime: 'Lucro Presumido', faturamento: 14000000, funcionarios: 58, cidade: 'Indaiatuba', uf: 'SP', origem: 'Indicação de cliente', consultorId: 3, relacao: 'prospect' },
    { id: 9, razao: 'Americana Fios e Tecidos S.A.', fantasia: 'Americana Fios', cnpj: '03.297.468/0001-88', segmento: 'Têxtil', regime: 'Lucro Real', faturamento: 72000000, funcionarios: 410, cidade: 'Americana', uf: 'SP', origem: 'Evento/palestra', consultorId: 2, relacao: 'cliente', desde: '2025-11-03' },
    { id: 10, razao: 'Jaguari Laticínios Ltda', fantasia: 'Jaguari Laticínios', cnpj: '11.582.903/0001-44', segmento: 'Alimentos', regime: 'Lucro Real', faturamento: 54000000, funcionarios: 230, cidade: 'Jaguariúna', uf: 'SP', origem: 'LinkedIn', consultorId: 4, relacao: 'prospect' },
    { id: 11, razao: 'Campinas Distribuidora de Materiais Elétricos Ltda', fantasia: 'CDME', cnpj: '19.734.120/0001-40', segmento: 'Distribuição', regime: 'Lucro Presumido', faturamento: 31000000, funcionarios: 72, cidade: 'Campinas', uf: 'SP', origem: 'Prospecção ativa', consultorId: 5, relacao: 'prospect' },
    { id: 12, razao: 'Itatiba Móveis Corporativos Ltda', fantasia: 'Itatiba Móveis', cnpj: '24.906.385/0001-19', segmento: 'Moveleiro', regime: 'Lucro Presumido', faturamento: 12000000, funcionarios: 80, cidade: 'Itatiba', uf: 'SP', origem: 'Site', consultorId: 4, relacao: 'perdido' },
    { id: 13, razao: 'Mogiana Agro Insumos Ltda', fantasia: 'Mogiana Agro', cnpj: '06.413.877/0001-90', segmento: 'Agronegócio', regime: 'Lucro Real', faturamento: 96000000, funcionarios: 150, cidade: 'Mogi Mirim', uf: 'SP', origem: 'Indicação de cliente', consultorId: 2, relacao: 'prospect' },
    { id: 14, razao: 'TecnoPack Embalagens Flexíveis Ltda', fantasia: 'TecnoPack', cnpj: '30.128.664/0001-00', segmento: 'Plásticos e embalagens', regime: 'Lucro Real', faturamento: 58000000, funcionarios: 190, cidade: 'Monte Mor', uf: 'SP', origem: 'Parceiro contábil', consultorId: 3, relacao: 'cliente', desde: '2026-05-27' },
    { id: 15, razao: 'Barão Geraldo Farmacêutica Ltda', fantasia: 'BG Farma', cnpj: '02.865.390/0001-98', segmento: 'Farmacêutico', regime: 'Lucro Real', faturamento: 140000000, funcionarios: 380, cidade: 'Campinas', uf: 'SP', origem: 'Evento/palestra', consultorId: 2, relacao: 'prospect' },
    { id: 16, razao: 'Cosmópolis Bioenergia S.A.', fantasia: 'Cosmópolis Bioenergia', cnpj: '13.570.218/0001-23', segmento: 'Energia', regime: 'Lucro Real', faturamento: 210000000, funcionarios: 620, cidade: 'Cosmópolis', uf: 'SP', origem: 'Indicação de cliente', consultorId: 2, relacao: 'cliente', desde: '2024-10-14' },
    { id: 17, razao: 'Sumaré Ferramentaria e Estampos Ltda', fantasia: 'Sumaré Ferramentaria', cnpj: '26.381.045/0001-47', segmento: 'Metalurgia', regime: 'Lucro Presumido', faturamento: 9500000, funcionarios: 41, cidade: 'Sumaré', uf: 'SP', origem: 'Prospecção ativa', consultorId: 4, relacao: 'prospect' },
    { id: 18, razao: 'Jundiaí Vidros Técnicos Ltda', fantasia: 'JVT Vidros', cnpj: '08.672.913/0001-66', segmento: 'Vidros', regime: 'Lucro Presumido', faturamento: 27000000, funcionarios: 115, cidade: 'Jundiaí', uf: 'SP', origem: 'LinkedIn', consultorId: 5, relacao: 'prospect' },
    { id: 19, razao: 'Pedreira Porcelanas Artísticas Ltda', fantasia: 'Pedreira Porcelanas', cnpj: '17.209.556/0001-95', segmento: 'Cerâmica', regime: 'Lucro Presumido', faturamento: 16000000, funcionarios: 98, cidade: 'Pedreira', uf: 'SP', origem: 'Site', consultorId: 3, relacao: 'prospect' },
    { id: 20, razao: 'Santa Bárbara Componentes Eletrônicos Ltda', fantasia: 'SB Componentes', cnpj: '21.448.702/0001-02', segmento: 'Eletrônicos', regime: 'Lucro Real', faturamento: 44000000, funcionarios: 175, cidade: 'Santa Bárbara d\'Oeste', uf: 'SP', origem: 'Parceiro contábil', consultorId: 5, relacao: 'cliente', desde: '2026-07-08' },
    { id: 21, razao: 'Viracopos Comércio Exterior Ltda', fantasia: 'Viracopos Comex', cnpj: '05.936.481/0001-65', segmento: 'Comércio exterior', regime: 'Lucro Real', faturamento: 78000000, funcionarios: 66, cidade: 'Campinas', uf: 'SP', origem: 'Evento/palestra', consultorId: 3, relacao: 'prospect' },
    { id: 22, razao: 'Hortolândia Gráfica e Editora Ltda', fantasia: 'Gráfica Hortolândia', cnpj: '29.517.364/0001-25', segmento: 'Gráfica', regime: 'Lucro Presumido', faturamento: 11000000, funcionarios: 52, cidade: 'Hortolândia', uf: 'SP', origem: 'Planilha importada', consultorId: 4, relacao: 'perdido' },
    { id: 23, razao: 'Paulínia Lubrificantes Industriais Ltda', fantasia: 'PL Lubrificantes', cnpj: '10.264.897/0001-14', segmento: 'Química', regime: 'Lucro Real', faturamento: 63000000, funcionarios: 140, cidade: 'Paulínia', uf: 'SP', origem: 'Prospecção ativa', consultorId: 5, relacao: 'prospect' },
    { id: 24, razao: 'Taquaral Supermercados Ltda', fantasia: 'Supermercados Taquaral', cnpj: '14.893.026/0001-10', segmento: 'Varejo', regime: 'Lucro Real', faturamento: 105000000, funcionarios: 690, cidade: 'Campinas', uf: 'SP', origem: 'Indicação de cliente', consultorId: 3, relacao: 'cliente', desde: '2026-09-15' },
    { id: 25, razao: 'Vinhedo Cosméticos e Higiene Ltda', fantasia: 'Vinhedo Cosméticos', cnpj: '27.340.615/0001-13', segmento: 'Cosméticos', regime: 'Lucro Presumido', faturamento: 23000000, funcionarios: 88, cidade: 'Vinhedo', uf: 'SP', origem: 'Site', consultorId: 4, relacao: 'cliente', desde: '2026-10-21' }
  ];

  /* ---------------- Contatos (decisor: aprova a contratação) ---------------- */
  D.contatos = [
    { id: 101, empresaId: 1, nome: 'Rogério Albuquerque', cargo: 'Diretor financeiro', telefone: '(19) 3251-4400', whatsapp: '(19) 99712-3048', email: 'rogerio.albuquerque@metalatibaia.exemplo', decisor: true },
    { id: 102, empresaId: 1, nome: 'Patrícia Menezes', cargo: 'Coordenadora fiscal', telefone: '(19) 3251-4412', whatsapp: '(19) 99631-2207', email: 'patricia.menezes@metalatibaia.exemplo', decisor: false },
    { id: 103, empresaId: 2, nome: 'Sérgio Tavares', cargo: 'Sócio-administrador', telefone: '(19) 3865-1020', whatsapp: '(19) 99820-5513', email: 'sergio@plastiform.exemplo', decisor: true },
    { id: 104, empresaId: 3, nome: 'Fernanda Lopes', cargo: 'Gerente de controladoria', telefone: '(19) 3838-7700', whatsapp: '(19) 99744-6120', email: 'fernanda.lopes@rotabandeirantes.exemplo', decisor: false },
    { id: 105, empresaId: 3, nome: 'Marcelo Antunes', cargo: 'CFO', telefone: '(19) 3838-7701', whatsapp: '(19) 99502-8841', email: 'marcelo.antunes@rotabandeirantes.exemplo', decisor: true },
    { id: 106, empresaId: 4, nome: 'Cláudia Sanches', cargo: 'Diretora administrativa e financeira', telefone: '(19) 3876-2200', whatsapp: '(19) 99415-0076', email: 'claudia.sanches@serraazul.exemplo', decisor: true },
    { id: 107, empresaId: 4, nome: 'Henrique Bastos', cargo: 'Gerente tributário', telefone: '(19) 3876-2231', whatsapp: '(19) 99328-1145', email: 'henrique.bastos@serraazul.exemplo', decisor: false },
    { id: 108, empresaId: 5, nome: 'Lúcio Fagundes', cargo: 'Diretor industrial e sócio', telefone: '(19) 3844-9100', whatsapp: '(19) 99237-4410', email: 'lucio.fagundes@quimtec.exemplo', decisor: true },
    { id: 109, empresaId: 5, nome: 'Aline Rezende', cargo: 'Analista fiscal sênior', telefone: '(19) 3844-9122', whatsapp: '(19) 99146-7781', email: 'aline.rezende@quimtec.exemplo', decisor: false },
    { id: 110, empresaId: 6, nome: 'Vanessa Moraes', cargo: 'Proprietária', telefone: '(19) 3466-3300', whatsapp: '(19) 99855-2093', email: 'vanessa@textilnovaodessa.exemplo', decisor: true },
    { id: 111, empresaId: 7, nome: 'Gilberto Rocha', cargo: 'Sócio-diretor', telefone: '(19) 3869-4500', whatsapp: '(19) 99764-3382', email: 'gilberto@valinhosautopecas.exemplo', decisor: true },
    { id: 112, empresaId: 7, nome: 'Daniela Cruz', cargo: 'Contadora (escritório parceiro)', telefone: '(19) 3869-4521', whatsapp: '(19) 99673-8810', email: 'daniela.cruz@contabilparceira.exemplo', decisor: false },
    { id: 113, empresaId: 8, nome: 'Paulo Henrique Viana', cargo: 'Sócio-gerente', telefone: '(19) 3875-6600', whatsapp: '(19) 99582-1174', email: 'paulo.viana@indaiausinagem.exemplo', decisor: true },
    { id: 114, empresaId: 9, nome: 'Roberta Kühl', cargo: 'Diretora financeira', telefone: '(19) 3407-8800', whatsapp: '(19) 99491-6627', email: 'roberta.kuhl@americanafios.exemplo', decisor: true },
    { id: 115, empresaId: 9, nome: 'André Pacheco', cargo: 'Coordenador de impostos', telefone: '(19) 3407-8814', whatsapp: '(19) 99310-4458', email: 'andre.pacheco@americanafios.exemplo', decisor: false },
    { id: 116, empresaId: 10, nome: 'Otávio Mendes', cargo: 'Gerente administrativo', telefone: '(19) 3837-1500', whatsapp: '(19) 99229-7735', email: 'otavio.mendes@jaguarilaticinios.exemplo', decisor: false },
    { id: 117, empresaId: 10, nome: 'Silvana Prates', cargo: 'Sócia-diretora', telefone: '(19) 3837-1501', whatsapp: '(19) 99138-0062', email: 'silvana.prates@jaguarilaticinios.exemplo', decisor: true },
    { id: 118, empresaId: 11, nome: 'Eduardo Rangel', cargo: 'Diretor comercial e sócio', telefone: '(19) 3272-2900', whatsapp: '(19) 99047-5519', email: 'eduardo.rangel@cdme.exemplo', decisor: true },
    { id: 119, empresaId: 12, nome: 'Márcia Bittencourt', cargo: 'Gerente financeira', telefone: '(11) 4524-3100', whatsapp: '(11) 99856-1430', email: 'marcia@itatibamoveis.exemplo', decisor: true },
    { id: 120, empresaId: 13, nome: 'Fábio Guimarães', cargo: 'CFO', telefone: '(19) 3806-4700', whatsapp: '(19) 99765-9081', email: 'fabio.guimaraes@mogianaagro.exemplo', decisor: true },
    { id: 121, empresaId: 13, nome: 'Tatiane Lemos', cargo: 'Supervisora fiscal', telefone: '(19) 3806-4718', whatsapp: '(19) 99674-2236', email: 'tatiane.lemos@mogianaagro.exemplo', decisor: false },
    { id: 122, empresaId: 14, nome: 'Leonardo Brandão', cargo: 'Diretor-presidente', telefone: '(19) 3889-5500', whatsapp: '(19) 99583-4407', email: 'leonardo.brandao@tecnopack.exemplo', decisor: true },
    { id: 123, empresaId: 14, nome: 'Isabela Fontes', cargo: 'Controller', telefone: '(19) 3889-5523', whatsapp: '(19) 99492-6618', email: 'isabela.fontes@tecnopack.exemplo', decisor: false },
    { id: 124, empresaId: 15, nome: 'Ricardo Saldanha', cargo: 'Diretor financeiro', telefone: '(19) 3289-6600', whatsapp: '(19) 99301-8829', email: 'ricardo.saldanha@bgfarma.exemplo', decisor: true },
    { id: 125, empresaId: 15, nome: 'Juliana Arruda', cargo: 'Gerente tributária', telefone: '(19) 3289-6644', whatsapp: '(19) 99210-0035', email: 'juliana.arruda@bgfarma.exemplo', decisor: false },
    { id: 126, empresaId: 16, nome: 'Augusto Ventura', cargo: 'CFO', telefone: '(19) 3872-9000', whatsapp: '(19) 99129-2241', email: 'augusto.ventura@cosmopolisbio.exemplo', decisor: true },
    { id: 127, empresaId: 16, nome: 'Mônica Freitas', cargo: 'Gerente de tributos', telefone: '(19) 3872-9033', whatsapp: '(19) 99038-4452', email: 'monica.freitas@cosmopolisbio.exemplo', decisor: false },
    { id: 128, empresaId: 17, nome: 'José Carlos Peixoto', cargo: 'Proprietário', telefone: '(19) 3854-1200', whatsapp: '(19) 98947-6663', email: 'jcpeixoto@sumareferramentaria.exemplo', decisor: true },
    { id: 129, empresaId: 18, nome: 'Carolina Dutra', cargo: 'Diretora administrativa', telefone: '(11) 4582-7300', whatsapp: '(11) 98856-8874', email: 'carolina.dutra@jvtvidros.exemplo', decisor: true },
    { id: 130, empresaId: 19, nome: 'Wagner Toledo', cargo: 'Sócio-administrador', telefone: '(19) 3893-2600', whatsapp: '(19) 98765-0085', email: 'wagner@pedreiraporcelanas.exemplo', decisor: true },
    { id: 131, empresaId: 20, nome: 'Simone Carvalho', cargo: 'Gerente financeira', telefone: '(19) 3454-8100', whatsapp: '(19) 98674-2296', email: 'simone.carvalho@sbcomponentes.exemplo', decisor: false },
    { id: 132, empresaId: 20, nome: 'Rafael Domingues', cargo: 'Diretor-geral', telefone: '(19) 3454-8101', whatsapp: '(19) 98583-4407', email: 'rafael.domingues@sbcomponentes.exemplo', decisor: true },
    { id: 133, empresaId: 21, nome: 'Bruno Nakamura', cargo: 'Sócio-diretor', telefone: '(19) 3725-4400', whatsapp: '(19) 98492-6618', email: 'bruno.nakamura@viracoposcomex.exemplo', decisor: true },
    { id: 134, empresaId: 21, nome: 'Letícia Amaral', cargo: 'Analista de comércio exterior', telefone: '(19) 3725-4415', whatsapp: '(19) 98301-8829', email: 'leticia.amaral@viracoposcomex.exemplo', decisor: false },
    { id: 135, empresaId: 22, nome: 'Antônio Siqueira', cargo: 'Proprietário', telefone: '(19) 3819-5100', whatsapp: '(19) 98210-0030', email: 'antonio@graficahortolandia.exemplo', decisor: true },
    { id: 136, empresaId: 23, nome: 'Eliane Batista', cargo: 'Diretora financeira', telefone: '(19) 3874-3300', whatsapp: '(19) 98129-2245', email: 'eliane.batista@pllubrificantes.exemplo', decisor: true },
    { id: 137, empresaId: 23, nome: 'Rodrigo Pimentel', cargo: 'Gerente fiscal', telefone: '(19) 3874-3316', whatsapp: '(19) 98038-4456', email: 'rodrigo.pimentel@pllubrificantes.exemplo', decisor: false },
    { id: 138, empresaId: 24, nome: 'Helena Vasconcelos', cargo: 'CFO', telefone: '(19) 3255-7000', whatsapp: '(19) 97947-6667', email: 'helena.vasconcelos@supertaquaral.exemplo', decisor: true },
    { id: 139, empresaId: 24, nome: 'Diego Moura', cargo: 'Coordenador fiscal', telefone: '(19) 3255-7022', whatsapp: '(19) 97856-8878', email: 'diego.moura@supertaquaral.exemplo', decisor: false },
    { id: 140, empresaId: 25, nome: 'Priscila Andrade', cargo: 'Sócia-diretora', telefone: '(19) 3886-1900', whatsapp: '(19) 97765-0089', email: 'priscila@vinhedocosmeticos.exemplo', decisor: true }
  ];

  /* ---------------- Listas configuráveis (Configurações → Listas) ---------------- */
  D.listas = {
    origens: ['Indicação de cliente', 'Parceiro contábil', 'Site', 'LinkedIn', 'Evento/palestra', 'Prospecção ativa', 'Planilha importada'],
    segmentos: ['Agronegócio', 'Alimentos', 'Autopeças', 'Cerâmica', 'Comércio exterior', 'Cosméticos', 'Distribuição', 'Eletrônicos', 'Energia', 'Farmacêutico', 'Gráfica', 'Logística', 'Metalurgia', 'Moveleiro', 'Plásticos e embalagens', 'Química', 'Têxtil', 'Usinagem', 'Varejo', 'Vidros'],
    regimes: ['Lucro Real', 'Lucro Presumido', 'Simples Nacional'],
    teses: [
      'Exclusão do ICMS da base do PIS/Cofins', 'Créditos de PIS/Cofins sobre insumos', 'PIS/Cofins monofásico (revenda)', 'Contribuição previdenciária sobre verbas indenizatórias',
      'IRPJ/CSLL sobre a Selic na repetição de indébito (Tema 962/STF)', 'Exclusão do ISS da base do PIS/Cofins', 'Créditos extemporâneos de PIS/Cofins', 'Recuperação de ICMS-ST', 'Subvenções de ICMS na base do IRPJ/CSLL'
    ],
    /* Valores desativados: continuam nos registros antigos, mas saem das opções dos formulários (Configurações → Listas). */
    inativos: {
      teses: [{ valor: 'Limite de 20 salários mínimos (terceiros / Sistema S)', motivo: 'Desativada: o STJ decidiu contra o contribuinte (Tema 1.079, mar/2024). Fica só nos negócios perdidos e descartados.', uso: '2 negócios encerrados' }]
    },
    motivosPerda: ['Honorários acima do esperado', 'Optou por outra consultoria', 'Contador do cliente desaconselhou', 'Crédito pequeno após o cálculo', 'Receio de fiscalização', 'Decisor parou de responder'],
    motivosDescarte: ['Empresa do Simples Nacional', 'Faturamento abaixo do mínimo', 'Sem perfil para as teses', 'Contato inválido', 'Já atendida por outra consultoria'],
    tiposAtividade: [
      { key: 'ligacao', nome: 'Ligação', icon: 'phone', tone: 'blue', resultados: ['Atendeu', 'Não atendeu', 'Caixa postal', 'Falou com o decisor', 'Pediu retorno'] },
      { key: 'reuniao', nome: 'Reunião', icon: 'users', tone: 'violet', resultados: ['Agendada', 'Realizada', 'Não realizada', 'Reagendada'] },
      { key: 'comunicacao', nome: 'Comunicação', icon: 'mail', tone: 'slate', resultados: ['E-mail enviado', 'WhatsApp enviado'] },
      { key: 'documentacao', nome: 'Documentação', icon: 'file-text', tone: 'amber', resultados: ['Documento solicitado', 'Documento recebido'] },
      { key: 'apresentacao', nome: 'Apresentação dos cálculos', icon: 'presentation', tone: 'gold', resultados: ['Realizada', 'Não realizada'] },
      { key: 'followup', nome: 'Follow-up', icon: 'refresh', tone: 'green', resultados: ['Feito', 'Sem retorno'] }
    ],
    tiposPrazo: ['Contestação', 'Manifestação', 'Réplica', 'Recurso de apelação', 'Contrarrazões', 'Embargos de declaração', 'Agravo de instrumento', 'Cumprimento de exigência', 'Sustentação oral', 'Audiência'],
    categoriasDocumento: ['Contrato social', 'Procuração', 'EFD ICMS/IPI', 'EFD-Contribuições', 'ECF', 'DCTF', 'Folha de pagamento', 'eSocial', 'EFD-Reinf', 'DCTFWeb', 'Notas fiscais (XML)', 'Guias de recolhimento', 'Carta proposta', 'Contrato de honorários', 'Petição', 'Decisão ou sentença']
  };

  /* ---------------- Funis ---------------- */
  /* requisitos: tipo campos | atividade | resultado | motivo | anexo. acoes: o que acontece ao entrar (automações em D.fluxos). */
  D.funis = {
    comercial: {
      id: 'comercial', nome: 'Funil comercial', descricao: 'Da entrada do lead ao contrato assinado. 10 etapas definidas na proposta.',
      etapas: [
        { num: 1, key: 'lead_novo', nome: 'Lead novo', cor: 'var(--tone-slate-solid)', tone: 'slate', sla: 1, requisitos: [{ tipo: 'campos', texto: 'Cadastro mínimo: razão social, CNPJ, regime, contato e origem' }], acoes: ['Cria a tarefa "Qualificar lead" com prazo de 24 h (AUT-01)'] },
        { num: 2, key: 'qualificacao', nome: 'Qualificação', cor: 'var(--tone-slate-solid)', tone: 'slate', sla: 3, requisitos: [{ tipo: 'resultado', texto: 'Registrar "qualificado" ou "descartado"' }, { tipo: 'motivo', texto: 'Motivo obrigatório quando descartado' }], acoes: [] },
        { num: 3, key: 'contato_decisor', nome: 'Contato com o decisor', cor: 'var(--tone-blue-solid)', tone: 'blue', sla: 5, requisitos: [{ tipo: 'atividade', texto: 'Reunião agendada com data e hora' }], acoes: ['Ligação sem sucesso → nova tentativa em 2 dias (AUT-02)'] },
        { num: 4, key: 'reuniao_agendada', nome: 'Reunião agendada', cor: 'var(--tone-blue-solid)', tone: 'blue', sla: 7, requisitos: [{ tipo: 'resultado', texto: 'Resultado da reunião: realizada ou não realizada' }], acoes: ['Lembretes 1 dia antes e no dia (AUT-03)', 'Não realizada → tarefa "Reagendar reunião" (AUT-04)'] },
        { num: 5, key: 'reuniao_realizada', nome: 'Reunião realizada', cor: 'var(--tone-violet-solid)', tone: 'violet', sla: 2, requisitos: [], acoes: ['Cria a tarefa "Enviar carta proposta e documentos" (AUT-05)'] },
        { num: 6, key: 'proposta_documentos', nome: 'Carta proposta e documentos', cor: 'var(--tone-violet-solid)', tone: 'violet', sla: 10, requisitos: [{ tipo: 'atividade', texto: 'Documentação do cliente recebida' }], acoes: ['Documentos pendentes há 5 dias → follow-up (AUT-06)', 'Documentação recebida → tarefa para a equipe de cálculo (AUT-07)'] },
        { num: 7, key: 'levantamento', nome: 'Levantamento das oportunidades', cor: 'var(--tone-amber-solid)', tone: 'amber', sla: 15, requisitos: [{ tipo: 'resultado', texto: 'Cálculos concluídos (valor do crédito estimado)' }], acoes: ['Cálculos concluídos → tarefa "Agendar apresentação" (AUT-08)'] },
        { num: 8, key: 'apresentacao', nome: 'Apresentação dos cálculos', cor: 'var(--tone-amber-solid)', tone: 'amber', sla: 7, requisitos: [{ tipo: 'resultado', texto: 'Resultado: realizada ou não realizada' }], acoes: ['Apresentação feita → follow-up de fechamento em 3 dias (AUT-09)'] },
        { num: 9, key: 'negociacao', nome: 'Negociação e fechamento', cor: 'var(--tone-gold-solid)', tone: 'gold', sla: 15, requisitos: [{ tipo: 'anexo', texto: 'Contrato assinado (anexo) ou registro da perda' }], acoes: ['Contrato assinado → Jurídico (AUT-15, a confirmar)'] },
        { num: 10, key: 'desfecho', nome: 'Ganho ou perdido', cor: 'var(--tone-green-solid)', tone: 'green', sla: null, desfecho: true, requisitos: [{ tipo: 'motivo', texto: 'Motivo obrigatório quando perdido' }], acoes: ['Ganho → conclui tarefas e cria o contrato no Financeiro'] }
      ],
      desfechos: [
        { key: 'ganho', nome: 'Ganho', tone: 'green', exige: 'Contrato de honorários assinado' },
        { key: 'perdido', nome: 'Perdido', tone: 'red', exige: 'Motivo da perda (lista)' },
        { key: 'descartado', nome: 'Descartado', tone: 'gray', exige: 'Motivo do descarte (lista)' }
      ]
    },
    juridico: {
      id: 'juridico', nome: 'Andamento processual', descricao: 'Situação dos processos de recuperação de crédito até a compensação.',
      etapas: [
        { num: 1, key: 'distribuido', nome: 'Distribuído', tone: 'slate', cor: 'var(--tone-slate-solid)', sla: null, requisitos: [{ tipo: 'campos', texto: 'Número CNJ, vara e parte contrária' }], acoes: [] },
        { num: 2, key: 'liminar', nome: 'Aguardando liminar', tone: 'blue', cor: 'var(--tone-blue-solid)', sla: 30, requisitos: [], acoes: [] },
        { num: 3, key: 'instrucao', nome: 'Em instrução', tone: 'blue', cor: 'var(--tone-blue-solid)', sla: null, requisitos: [], acoes: [] },
        { num: 4, key: 'sentenca', nome: 'Sentença', tone: 'violet', cor: 'var(--tone-violet-solid)', sla: null, requisitos: [{ tipo: 'anexo', texto: 'Anexar a sentença' }], acoes: [] },
        { num: 5, key: 'recurso', nome: 'Em recurso (TRF3)', tone: 'amber', cor: 'var(--tone-amber-solid)', sla: null, requisitos: [], acoes: [] },
        { num: 6, key: 'transito', nome: 'Trânsito em julgado', tone: 'gold', cor: 'var(--tone-gold-solid)', sla: null, requisitos: [{ tipo: 'anexo', texto: 'Certidão de trânsito em julgado' }], acoes: ['Avisar o Financeiro para preparar o honorário de êxito'] },
        { num: 7, key: 'habilitacao', nome: 'Habilitação do crédito', tone: 'green', cor: 'var(--tone-green-solid)', sla: 30, requisitos: [], acoes: [] },
        { num: 8, key: 'compensacao', nome: 'Compensação (PER/DCOMP)', tone: 'green', cor: 'var(--tone-green-solid)', sla: null, requisitos: [], acoes: ['Cada compensação gera o título de êxito no Financeiro'] }
      ]
    }
  };

  /* ---------------- Negócios (espinha do CRM) ---------------- */
  /* etapa: 1–9 em andamento; desfecho: ganho | perdido | descartado. creditoEstimado em R$. entrouEtapaEm → dias parado. */
  D.negocios = [
    { id: 1001, empresaId: 1, titulo: 'Exclusão do ICMS da base do PIS/Cofins', desfecho: 'ganho', etapa: 10, consultorId: 3, creditoEstimado: 1850000, exitoPct: 20, criadoEm: '2025-05-20', entrouEtapaEm: '2025-08-12', fechadoEm: '2025-08-12' },
    { id: 1002, empresaId: 2, titulo: 'PIS/Cofins monofásico e verbas indenizatórias', etapa: 3, consultorId: 4, creditoEstimado: 420000, exitoPct: 20, criadoEm: '2026-10-21', entrouEtapaEm: '2026-11-05' },
    { id: 1003, empresaId: 3, titulo: 'Créditos de PIS/Cofins sobre insumos (frete e combustível)', etapa: 8, consultorId: 5, creditoEstimado: 2650000, exitoPct: 18, criadoEm: '2026-07-02', entrouEtapaEm: '2026-11-04' },
    { id: 1004, empresaId: 4, titulo: 'Créditos extemporâneos de PIS/Cofins', desfecho: 'ganho', etapa: 10, consultorId: 2, creditoEstimado: 4300000, exitoPct: 15, criadoEm: '2024-12-10', entrouEtapaEm: '2025-03-04', fechadoEm: '2025-03-04' },
    { id: 1005, empresaId: 5, titulo: 'Exclusão do ICMS da base do PIS/Cofins + insumos', etapa: 7, consultorId: 3, creditoEstimado: 3100000, exitoPct: 18, criadoEm: '2026-08-14', entrouEtapaEm: '2026-10-19' },
    { id: 1006, empresaId: 6, titulo: 'Verbas indenizatórias (folha)', etapa: 2, consultorId: 4, creditoEstimado: 260000, exitoPct: 22, criadoEm: '2026-11-03', entrouEtapaEm: '2026-11-07' },
    { id: 1007, empresaId: 7, titulo: 'PIS/Cofins monofásico (autopeças)', desfecho: 'ganho', etapa: 10, consultorId: 5, creditoEstimado: 780000, exitoPct: 20, criadoEm: '2025-11-18', entrouEtapaEm: '2026-02-19', fechadoEm: '2026-02-19' },
    { id: 1008, empresaId: 8, titulo: 'Contribuição previdenciária sobre verbas indenizatórias', etapa: 5, consultorId: 3, creditoEstimado: 310000, exitoPct: 22, criadoEm: '2026-09-29', entrouEtapaEm: '2026-11-09' },
    { id: 1009, empresaId: 9, titulo: 'Exclusão do ICMS da base do PIS/Cofins', desfecho: 'ganho', etapa: 10, consultorId: 2, creditoEstimado: 2900000, exitoPct: 18, criadoEm: '2025-07-01', entrouEtapaEm: '2025-11-03', fechadoEm: '2025-11-03' },
    { id: 1010, empresaId: 10, titulo: 'Créditos de PIS/Cofins sobre insumos', etapa: 6, consultorId: 4, creditoEstimado: 1450000, exitoPct: 20, criadoEm: '2026-08-25', entrouEtapaEm: '2026-10-22' },
    { id: 1011, empresaId: 11, titulo: 'PIS/Cofins monofásico (materiais elétricos)', etapa: 4, consultorId: 5, creditoEstimado: 540000, exitoPct: 20, criadoEm: '2026-10-08', entrouEtapaEm: '2026-11-05' },
    { id: 1012, empresaId: 12, titulo: 'Sistema S e verbas indenizatórias', desfecho: 'perdido', etapa: 10, consultorId: 4, creditoEstimado: 190000, exitoPct: 22, criadoEm: '2026-06-10', entrouEtapaEm: '2026-09-30', fechadoEm: '2026-09-30', motivoPerda: 'Contador do cliente desaconselhou' },
    { id: 1013, empresaId: 13, titulo: 'Subvenções de ICMS na base do IRPJ/CSLL', etapa: 9, consultorId: 2, creditoEstimado: 5200000, exitoPct: 15, criadoEm: '2026-05-12', entrouEtapaEm: '2026-10-27' },
    { id: 1014, empresaId: 14, titulo: 'Exclusão do ICMS da base do PIS/Cofins', desfecho: 'ganho', etapa: 10, consultorId: 3, creditoEstimado: 1680000, exitoPct: 18, criadoEm: '2026-02-03', entrouEtapaEm: '2026-05-27', fechadoEm: '2026-05-27' },
    { id: 1015, empresaId: 15, titulo: 'Créditos de PIS/Cofins e verbas indenizatórias', etapa: 6, consultorId: 2, creditoEstimado: 3800000, exitoPct: 15, criadoEm: '2026-09-08', entrouEtapaEm: '2026-10-14' },
    { id: 1016, empresaId: 16, titulo: 'Créditos extemporâneos e subvenções de ICMS', desfecho: 'ganho', etapa: 10, consultorId: 2, creditoEstimado: 7400000, exitoPct: 12, criadoEm: '2024-06-18', entrouEtapaEm: '2024-10-14', fechadoEm: '2024-10-14' },
    { id: 1017, empresaId: 17, titulo: 'Exclusão do ICMS da base do PIS/Cofins', etapa: 1, consultorId: 4, creditoEstimado: 95000, exitoPct: 25, criadoEm: '2026-11-06', entrouEtapaEm: '2026-11-06' },
    { id: 1018, empresaId: 18, titulo: 'Exclusão do ICMS da base do PIS/Cofins', etapa: 4, consultorId: 5, creditoEstimado: 610000, exitoPct: 20, criadoEm: '2026-10-15', entrouEtapaEm: '2026-11-06' },
    { id: 1019, empresaId: 19, titulo: 'Verbas indenizatórias', etapa: 2, consultorId: 3, creditoEstimado: 180000, exitoPct: 22, criadoEm: '2026-11-02', entrouEtapaEm: '2026-11-06' },
    { id: 1020, empresaId: 20, titulo: 'Créditos de PIS/Cofins sobre insumos', desfecho: 'ganho', etapa: 10, consultorId: 5, creditoEstimado: 1240000, exitoPct: 18, criadoEm: '2026-03-30', entrouEtapaEm: '2026-07-08', fechadoEm: '2026-07-08' },
    { id: 1021, empresaId: 21, titulo: 'Recuperação de ICMS-ST e PIS/Cofins importação', etapa: 7, consultorId: 3, creditoEstimado: 2200000, exitoPct: 18, criadoEm: '2026-07-20', entrouEtapaEm: '2026-10-27' },
    { id: 1022, empresaId: 22, titulo: 'Sistema S e verbas indenizatórias', desfecho: 'descartado', etapa: 2, consultorId: 4, creditoEstimado: 70000, exitoPct: 25, criadoEm: '2026-08-04', entrouEtapaEm: '2026-08-11', fechadoEm: '2026-08-11', motivoPerda: 'Faturamento abaixo do mínimo' },
    { id: 1023, empresaId: 23, titulo: 'Exclusão do ICMS da base do PIS/Cofins', etapa: 4, consultorId: 5, creditoEstimado: 1950000, exitoPct: 18, criadoEm: '2026-09-17', entrouEtapaEm: '2026-11-03' },
    { id: 1024, empresaId: 24, titulo: 'Créditos de PIS/Cofins (varejo) e ICMS-ST', desfecho: 'ganho', etapa: 10, consultorId: 3, creditoEstimado: 3600000, exitoPct: 15, criadoEm: '2026-05-05', entrouEtapaEm: '2026-09-15', fechadoEm: '2026-09-15' },
    { id: 1025, empresaId: 25, titulo: 'PIS/Cofins monofásico (cosméticos)', desfecho: 'ganho', etapa: 10, consultorId: 4, creditoEstimado: 690000, exitoPct: 20, criadoEm: '2026-08-19', entrouEtapaEm: '2026-10-21', fechadoEm: '2026-10-21' },
    { id: 1026, empresaId: 1, titulo: 'Verbas indenizatórias (folha)', etapa: 8, consultorId: 3, creditoEstimado: 520000, exitoPct: 20, criadoEm: '2026-09-01', entrouEtapaEm: '2026-11-03' },
    { id: 1027, empresaId: 9, titulo: 'Créditos de PIS/Cofins sobre insumos', etapa: 9, consultorId: 2, creditoEstimado: 1350000, exitoPct: 18, criadoEm: '2026-08-10', entrouEtapaEm: '2026-11-06' },
    { id: 1028, empresaId: 10, titulo: 'IRPJ/CSLL sobre a Selic na repetição de indébito', etapa: 1, consultorId: 4, creditoEstimado: 140000, exitoPct: 25, criadoEm: '2026-11-09', entrouEtapaEm: '2026-11-09' }
  ];

  /* ---------------- Contratos de honorários (espinha do Financeiro) ---------------- */
  /* honorarioMensal: fixo mensal (R$). exitoPct: % sobre crédito efetivamente recuperado/compensado. */
  D.contratos = [
    { id: 3001, empresaId: 1, negocioId: 1001, inicio: '2025-08-12', honorarioMensal: 4500, exitoPct: 20, creditoEstimado: 1850000, creditoRecuperado: 0, diaVencimento: 10, status: 'ativo' },
    { id: 3002, empresaId: 4, negocioId: 1004, inicio: '2025-03-04', honorarioMensal: 8500, exitoPct: 15, creditoEstimado: 4300000, creditoRecuperado: 3120000, diaVencimento: 5, status: 'ativo' },
    { id: 3003, empresaId: 7, negocioId: 1007, inicio: '2026-02-19', honorarioMensal: 2800, exitoPct: 20, creditoEstimado: 780000, creditoRecuperado: 214000, diaVencimento: 10, status: 'ativo' },
    { id: 3004, empresaId: 9, negocioId: 1009, inicio: '2025-11-03', honorarioMensal: 6200, exitoPct: 18, creditoEstimado: 2900000, creditoRecuperado: 0, diaVencimento: 15, status: 'ativo' },
    { id: 3005, empresaId: 14, negocioId: 1014, inicio: '2026-05-27', honorarioMensal: 5200, exitoPct: 18, creditoEstimado: 1680000, creditoRecuperado: 0, diaVencimento: 10, status: 'ativo' },
    { id: 3006, empresaId: 16, negocioId: 1016, inicio: '2024-10-14', honorarioMensal: 9800, exitoPct: 12, creditoEstimado: 7400000, creditoRecuperado: 6050000, diaVencimento: 5, status: 'ativo' },
    { id: 3007, empresaId: 20, negocioId: 1020, inicio: '2026-07-08', honorarioMensal: 4200, exitoPct: 18, creditoEstimado: 1240000, creditoRecuperado: 0, diaVencimento: 20, status: 'ativo' },
    { id: 3008, empresaId: 24, negocioId: 1024, inicio: '2026-09-15', honorarioMensal: 7600, exitoPct: 15, creditoEstimado: 3600000, creditoRecuperado: 0, diaVencimento: 15, status: 'ativo' },
    { id: 3009, empresaId: 25, negocioId: 1025, inicio: '2026-10-21', honorarioMensal: 3200, exitoPct: 20, creditoEstimado: 690000, creditoRecuperado: 0, diaVencimento: 10, status: 'ativo' }
  ];

  /* ---------------- Processos (espinha do Jurídico) ---------------- */
  /* Número no padrão CNJ fictício: NNNNNNN-DD.AAAA.J.TR.OOOO (4.03.6105 = Justiça Federal · TRF3 · Campinas) */
  D.processos = [
    { id: 2001, numero: '5003127-77.2025.4.03.6105', empresaId: 1, negocioId: 1001, classe: 'Mandado de segurança', tese: 'Exclusão do ICMS da base do PIS/Cofins', parteContraria: 'União Federal (Fazenda Nacional)', vara: '2ª Vara Federal de Campinas', etapa: 'recurso', advogadoId: 7, valorCausa: 1850000, distribuidoEm: '2025-09-02' },
    { id: 2002, numero: '5011845-63.2025.4.03.6105', empresaId: 4, negocioId: 1004, classe: 'Mandado de segurança', tese: 'Créditos extemporâneos de PIS/Cofins', parteContraria: 'União Federal (Fazenda Nacional)', vara: '6ª Vara Federal de Campinas', etapa: 'compensacao', advogadoId: 6, valorCausa: 4300000, distribuidoEm: '2025-04-15' },
    { id: 2003, numero: '5000462-54.2026.4.03.6105', empresaId: 7, negocioId: 1007, classe: 'Ação de procedimento comum', tese: 'PIS/Cofins monofásico (revenda)', parteContraria: 'União Federal (Fazenda Nacional)', vara: '4ª Vara Federal de Campinas', etapa: 'instrucao', advogadoId: 7, valorCausa: 780000, distribuidoEm: '2026-03-23' },
    { id: 2004, numero: '5008733-74.2025.4.03.6109', empresaId: 9, negocioId: 1009, classe: 'Mandado de segurança', tese: 'Exclusão do ICMS da base do PIS/Cofins', parteContraria: 'União Federal (Fazenda Nacional)', vara: '1ª Vara Federal de Americana', etapa: 'transito', advogadoId: 6, valorCausa: 2900000, distribuidoEm: '2025-12-01' },
    { id: 2005, numero: '5004219-56.2026.4.03.6105', empresaId: 14, negocioId: 1014, classe: 'Mandado de segurança', tese: 'Exclusão do ICMS da base do PIS/Cofins', parteContraria: 'Delegado da Receita Federal em Campinas', vara: '8ª Vara Federal de Campinas', etapa: 'liminar', advogadoId: 7, valorCausa: 1680000, distribuidoEm: '2026-06-30' },
    { id: 2006, numero: '0012384-51.2024.4.03.6105', empresaId: 16, negocioId: 1016, classe: 'Ação de procedimento comum', tese: 'Subvenções de ICMS na base do IRPJ/CSLL', parteContraria: 'União Federal (Fazenda Nacional)', vara: '3ª Vara Federal de Campinas', etapa: 'habilitacao', advogadoId: 6, valorCausa: 7400000, distribuidoEm: '2024-11-25' },
    { id: 2007, numero: '5006655-95.2026.4.03.6134', empresaId: 20, negocioId: 1020, classe: 'Mandado de segurança', tese: 'Créditos de PIS/Cofins sobre insumos', parteContraria: 'União Federal (Fazenda Nacional)', vara: '1ª Vara Federal de Limeira', etapa: 'distribuido', advogadoId: 7, valorCausa: 1240000, distribuidoEm: '2026-08-12' },
    { id: 2008, numero: '5009902-74.2026.4.03.6105', empresaId: 24, negocioId: 1024, classe: 'Mandado de segurança', tese: 'Créditos de PIS/Cofins (varejo)', parteContraria: 'Delegado da Receita Federal em Campinas', vara: '2ª Vara Federal de Campinas', etapa: 'distribuido', advogadoId: 6, valorCausa: 3600000, distribuidoEm: '2026-10-05' },
    { id: 2009, numero: '10830.721456/2026-11', empresaId: 4, negocioId: 1004, classe: 'Processo administrativo (PER/DCOMP)', tese: 'Compensação de créditos de PIS/Cofins', parteContraria: 'Receita Federal do Brasil', vara: 'DRF Campinas', etapa: 'compensacao', advogadoId: 7, valorCausa: 1180000, distribuidoEm: '2026-04-08' },
    { id: 2010, numero: '5002871-37.2025.4.03.6105', empresaId: 9, negocioId: 1009, classe: 'Embargos à execução fiscal', tese: 'Defesa em execução fiscal (PIS/Cofins)', parteContraria: 'União Federal (Fazenda Nacional)', vara: '5ª Vara Federal de Campinas', etapa: 'sentenca', advogadoId: 7, valorCausa: 365000, distribuidoEm: '2025-06-17' }
  ];

  /* ---------------- Prazos processuais (regra D-1 calculada pelo calendário) ---------------- */
  var D1 = function (fatal) { return App.util.prazoInterno(fatal); };
  D.prazos = [
    { id: 5001, processoId: 2003, tipo: 'Manifestação', descricao: 'Manifestação sobre a contestação da União', fatal: '2026-11-10', responsavelId: 7, status: 'pendente' },
    { id: 5002, processoId: 2001, tipo: 'Contrarrazões', descricao: 'Contrarrazões à apelação da Fazenda Nacional', fatal: '2026-11-09', responsavelId: 7, status: 'pendente' },
    { id: 5003, processoId: 2005, tipo: 'Manifestação', descricao: 'Manifestação sobre as informações da autoridade coatora', fatal: '2026-11-11', responsavelId: 7, status: 'pendente' },
    { id: 5004, processoId: 2004, tipo: 'Cumprimento de exigência', descricao: 'Juntar certidão de trânsito e cálculo para habilitação', fatal: '2026-11-16', responsavelId: 6, status: 'pendente' },
    { id: 5005, processoId: 2010, tipo: 'Recurso de apelação', descricao: 'Apelação contra a sentença parcialmente procedente', fatal: '2026-11-23', responsavelId: 7, status: 'pendente' },
    { id: 5006, processoId: 2006, tipo: 'Embargos de declaração', descricao: 'Embargos sobre a omissão quanto à correção pela Selic', fatal: '2026-11-13', responsavelId: 6, status: 'pendente' },
    { id: 5007, processoId: 2007, tipo: 'Manifestação', descricao: 'Emenda à inicial: comprovar recolhimentos', fatal: '2026-11-27', responsavelId: 7, status: 'pendente' },
    { id: 5008, processoId: 2009, tipo: 'Cumprimento de exigência', descricao: 'Responder intimação da DRF sobre a compensação', fatal: '2026-12-03', responsavelId: 7, status: 'pendente' },
    { id: 5009, processoId: 2002, tipo: 'Manifestação', descricao: 'Manifestação sobre os cálculos da contadoria', fatal: '2026-11-05', responsavelId: 6, status: 'cumprido', cumpridoEm: '2026-11-04' },
    { id: 5010, processoId: 2008, tipo: 'Manifestação', descricao: 'Juntada de procuração e documentos', fatal: '2026-11-03', responsavelId: 6, status: 'cumprido', cumpridoEm: '2026-11-03' },
    { id: 5011, processoId: 2001, tipo: 'Embargos de declaração', descricao: 'Embargos contra a decisão de admissibilidade', fatal: '2026-10-28', responsavelId: 7, status: 'cumprido', cumpridoEm: '2026-10-27' },
    { id: 5012, processoId: 2003, tipo: 'Réplica', descricao: 'Réplica à contestação', fatal: '2026-10-21', responsavelId: 7, status: 'cumprido', cumpridoEm: '2026-10-20' },
    { id: 5013, processoId: 2004, tipo: 'Sustentação oral', descricao: 'Sessão de julgamento da 3ª Turma do TRF3 (videoconferência)', fatal: '2026-11-18', hora: '14:00', responsavelId: 6, status: 'pendente' }
  ];
  D.prazos.forEach(function (p) { p.interno = D1(p.fatal); });

  /* ---------------- Tarefas (todas as áreas; o Início filtra por pessoa) ---------------- */
  /* origem: 'Manual' ou o código da automação (D.fluxos). ref: registro vinculado (link). */
  D.tarefas = [
    { id: 6001, titulo: 'Aprovar a carta proposta da Mogiana Agro', modulo: 'crm', responsavelId: 1, prazo: '2026-11-09T11:00', status: 'aberta', prioridade: 'alta', origem: 'Manual', ref: { label: 'Mogiana Agro · Subvenções de ICMS', hash: 'crm-negocio-1013' } },
    { id: 6002, titulo: 'Revisar a minuta do contrato de honorários (BG Farma)', modulo: 'crm', responsavelId: 1, prazo: '2026-11-09T16:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'BG Farma · Créditos de PIS/Cofins', hash: 'crm-negocio-1015' } },
    { id: 6003, titulo: 'Assinar a procuração do processo da Americana Fios', modulo: 'juridico', responsavelId: 1, prazo: '2026-11-06T18:00', status: 'aberta', prioridade: 'alta', origem: 'Manual', ref: { label: 'Processo 5008733-74.2025.4.03.6109', hash: 'jur-processo-2004' } },
    { id: 6004, titulo: 'Aprovar o fechamento financeiro de outubro', modulo: 'financeiro', responsavelId: 1, prazo: '2026-11-10T12:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'Fechamento de outubro/2026', hash: 'fin-painel' } },
    { id: 6005, titulo: 'Qualificar lead: Sumaré Ferramentaria', modulo: 'crm', responsavelId: 4, prazo: '2026-11-07T10:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-01', ref: { label: 'Sumaré Ferramentaria · ICMS na base', hash: 'crm-negocio-1017' } },
    { id: 6006, titulo: 'Qualificar lead: Jaguari Laticínios (Selic no indébito)', modulo: 'crm', responsavelId: 4, prazo: '2026-11-10T09:00', status: 'aberta', prioridade: 'media', origem: 'AUT-01', ref: { label: 'Jaguari Laticínios · Selic no indébito', hash: 'crm-negocio-1028' } },
    { id: 6007, titulo: 'Enviar carta proposta e documentos à Indaiá Usinagem', modulo: 'crm', responsavelId: 3, prazo: '2026-11-09T18:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-05', ref: { label: 'Indaiá Usinagem · Verbas indenizatórias', hash: 'crm-negocio-1008' } },
    { id: 6008, titulo: 'Follow-up de documentação: Jaguari Laticínios', modulo: 'crm', responsavelId: 4, prazo: '2026-11-05T15:00', status: 'aberta', prioridade: 'media', origem: 'AUT-06', ref: { label: 'Jaguari Laticínios · Insumos', hash: 'crm-negocio-1010' } },
    { id: 6009, titulo: 'Levantamento de créditos: BG Farma (documentos recebidos)', modulo: 'crm', responsavelId: null, filaId: 'calculo', prazo: '2026-11-13T18:00', status: 'aberta', prioridade: 'media', origem: 'AUT-07', ref: { label: 'BG Farma · Créditos de PIS/Cofins', hash: 'crm-negocio-1015' } },
    { id: 6010, titulo: 'Concluir cálculos: Quimtec (ICMS + insumos)', modulo: 'crm', responsavelId: 8, prazo: '2026-11-11T18:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-07', ref: { label: 'Quimtec · ICMS e insumos', hash: 'crm-negocio-1005' } },
    { id: 6011, titulo: 'Agendar apresentação dos cálculos: Viracopos Comex', modulo: 'crm', responsavelId: 3, prazo: '2026-11-10T12:00', status: 'aberta', prioridade: 'media', origem: 'AUT-08', ref: { label: 'Viracopos Comex · ICMS-ST', hash: 'crm-negocio-1021' } },
    { id: 6012, titulo: 'Preparar apresentação: Rota Bandeirantes', modulo: 'crm', responsavelId: 5, prazo: '2026-11-09T12:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-08', ref: { label: 'Rota Bandeirantes · Insumos', hash: 'crm-negocio-1003' } },
    { id: 6013, titulo: 'Reagendar reunião com a PL Lubrificantes', modulo: 'crm', responsavelId: 5, prazo: '2026-11-11T18:00', status: 'concluida', concluidaEm: '2026-11-06T15:40', prioridade: 'media', origem: 'AUT-04', ref: { label: 'PL Lubrificantes · ICMS na base', hash: 'crm-negocio-1023' } },
    { id: 6014, titulo: 'Nova tentativa de contato: Plastiform', modulo: 'crm', responsavelId: 4, prazo: '2026-11-09T10:30', status: 'aberta', prioridade: 'baixa', origem: 'AUT-02', ref: { label: 'Plastiform · Monofásico', hash: 'crm-negocio-1002' } },
    { id: 6015, titulo: 'Protocolar contrarrazões (Metalatibaia)', modulo: 'juridico', responsavelId: 7, prazo: '2026-11-09T12:00', status: 'aberta', prioridade: 'alta', origem: 'AUT-14', ref: { label: 'Processo 5003127-77.2025.4.03.6105', hash: 'jur-processo-2001' } },
    { id: 6016, titulo: 'Revisar embargos de declaração (Cosmópolis Bioenergia)', modulo: 'juridico', responsavelId: 6, prazo: '2026-11-11T18:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'Processo 0012384-51.2024.4.03.6105', hash: 'jur-processo-2006' } },
    { id: 6017, titulo: 'Emitir boletos de honorários de novembro', modulo: 'financeiro', responsavelId: 10, prazo: '2026-11-09T17:00', status: 'aberta', prioridade: 'alta', origem: 'FIN-01', ref: { label: 'Contas a receber · novembro', hash: 'fin-receber' } },
    { id: 6018, titulo: 'Cobrar honorário vencido: Valinhos Autopeças', modulo: 'financeiro', responsavelId: 10, prazo: '2026-11-06T12:00', status: 'aberta', prioridade: 'alta', origem: 'FIN-02', ref: { label: 'Valinhos Autopeças · outubro', hash: 'fin-receber' } },
    { id: 6019, titulo: 'Atualizar vídeo de integração no Intranet', modulo: 'intranet', responsavelId: 11, prazo: '2026-11-12T18:00', status: 'aberta', prioridade: 'baixa', origem: 'Manual', ref: { label: 'Biblioteca de materiais', hash: 'int-biblioteca' } },
    { id: 6020, titulo: 'Preparar pauta da reunião comercial semanal', modulo: 'crm', responsavelId: 2, prazo: '2026-11-09T09:00', status: 'concluida', prioridade: 'media', origem: 'Manual', ref: { label: 'Painel comercial', hash: 'crm-painel' } },
    { id: 6021, titulo: 'Validar metas de novembro por consultor', modulo: 'crm', responsavelId: 2, prazo: '2026-11-10T18:00', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'Metas de novembro', hash: 'crm-metas' } },
    { id: 6022, titulo: 'Conferir o cálculo D-1 dos prazos após o feriado de 20/11', modulo: 'juridico', responsavelId: 6, prazo: '2026-11-12T12:00', status: 'aberta', prioridade: 'baixa', origem: 'CORE-01', ref: { label: 'Calendário e feriados', hash: 'cfg-calendario' } },
    { id: 6023, titulo: 'Ligar para o decisor da JVT Vidros', modulo: 'crm', responsavelId: 5, prazo: '2026-11-09T15:30', status: 'aberta', prioridade: 'media', origem: 'Manual', ref: { label: 'JVT Vidros · ICMS na base', hash: 'crm-negocio-1018' } }
  ];

  /* ---------------- Agenda (eventos com hora; prazos entram pela lista de prazos) ---------------- */
  /* tipo: reuniao | ligacao | apresentacao | audiencia | interno | treinamento */
  D.eventos = [
    { id: 7001, tipo: 'interno', titulo: 'Reunião comercial semanal', data: '2026-11-09', inicio: '09:00', fim: '10:00', pessoas: [1, 2, 3, 4, 5], local: 'Escritório Atlas · sala 1', modulo: 'core' },
    { id: 7002, tipo: 'reuniao', titulo: 'Reunião com a JVT Vidros', data: '2026-11-09', inicio: '10:30', fim: '11:30', pessoas: [5], local: 'Online · videochamada', modulo: 'crm', ref: { label: 'JVT Vidros', hash: 'crm-negocio-1018' } },
    { id: 7003, tipo: 'apresentacao', titulo: 'Apresentação dos cálculos: Rota Bandeirantes', data: '2026-11-09', inicio: '14:00', fim: '15:30', pessoas: [5, 8, 1], local: 'Na empresa · Sumaré', modulo: 'crm', ref: { label: 'Rota Bandeirantes', hash: 'crm-negocio-1003' } },
    { id: 7004, tipo: 'ligacao', titulo: 'Ligação: Silvana Prates (Jaguari)', data: '2026-11-09', inicio: '16:00', fim: '16:30', pessoas: [4], local: 'Telefone', modulo: 'crm', ref: { label: 'Jaguari Laticínios', hash: 'crm-negocio-1010' } },
    { id: 7005, tipo: 'reuniao', titulo: 'Alinhamento de teses: Mogiana Agro', data: '2026-11-09', inicio: '17:00', fim: '18:00', pessoas: [1, 2, 6], local: 'Escritório Atlas · sala 2', modulo: 'crm', ref: { label: 'Mogiana Agro', hash: 'crm-negocio-1013' } },
    { id: 7006, tipo: 'reuniao', titulo: 'Reunião com a PL Lubrificantes', data: '2026-11-10', inicio: '09:30', fim: '10:30', pessoas: [5], local: 'Na empresa · Paulínia', modulo: 'crm', ref: { label: 'PL Lubrificantes', hash: 'crm-negocio-1023' } },
    { id: 7007, tipo: 'interno', titulo: 'Comitê jurídico: prazos da semana', data: '2026-11-10', inicio: '08:30', fim: '09:15', pessoas: [6, 7, 1], local: 'Escritório Atlas · sala 1', modulo: 'juridico' },
    { id: 7008, tipo: 'reuniao', titulo: 'Reunião de qualificação: Pedreira Porcelanas', data: '2026-11-10', inicio: '11:00', fim: '11:45', pessoas: [3], local: 'Online · videochamada', modulo: 'crm', ref: { label: 'Pedreira Porcelanas', hash: 'crm-negocio-1019' } },
    { id: 7009, tipo: 'reuniao', titulo: 'Reunião com a CDME', data: '2026-11-10', inicio: '15:00', fim: '16:00', pessoas: [5, 2], local: 'Na empresa · Campinas', modulo: 'crm', ref: { label: 'CDME', hash: 'crm-negocio-1011' } },
    { id: 7010, tipo: 'interno', titulo: 'Fechamento financeiro de outubro', data: '2026-11-10', inicio: '10:00', fim: '11:00', pessoas: [1, 10], local: 'Escritório Atlas · sala 2', modulo: 'financeiro' },
    { id: 7011, tipo: 'apresentacao', titulo: 'Apresentação dos cálculos: Metalatibaia (folha)', data: '2026-11-11', inicio: '10:00', fim: '11:30', pessoas: [3, 8], local: 'Na empresa · Campinas', modulo: 'crm', ref: { label: 'Metalatibaia · Verbas indenizatórias', hash: 'crm-negocio-1026' } },
    { id: 7012, tipo: 'ligacao', titulo: 'Ligação: Sérgio Tavares (Plastiform)', data: '2026-11-11', inicio: '14:00', fim: '14:20', pessoas: [4], local: 'Telefone', modulo: 'crm', ref: { label: 'Plastiform', hash: 'crm-negocio-1002' } },
    { id: 7013, tipo: 'reuniao', titulo: 'Negociação: Americana Fios (insumos)', data: '2026-11-11', inicio: '16:00', fim: '17:00', pessoas: [2, 1], local: 'Na empresa · Americana', modulo: 'crm', ref: { label: 'Americana Fios', hash: 'crm-negocio-1027' } },
    { id: 7014, tipo: 'treinamento', titulo: 'Treinamento: novo fluxo do funil', data: '2026-11-12', inicio: '09:00', fim: '10:30', pessoas: [2, 3, 4, 5, 11], local: 'Escritório Atlas · auditório', modulo: 'core' },
    { id: 7015, tipo: 'reuniao', titulo: 'Reunião de kickoff: Vinhedo Cosméticos', data: '2026-11-12', inicio: '14:00', fim: '15:00', pessoas: [4, 7, 10], local: 'Online · videochamada', modulo: 'crm', ref: { label: 'Vinhedo Cosméticos', hash: 'crm-negocio-1025' } },
    { id: 7016, tipo: 'audiencia', titulo: 'Despacho com o juiz: 8ª Vara Federal', data: '2026-11-12', inicio: '15:30', fim: '16:00', pessoas: [7], local: 'Justiça Federal · Campinas', modulo: 'juridico', ref: { label: 'TecnoPack · MS', hash: 'jur-processo-2005' } },
    { id: 7017, tipo: 'reuniao', titulo: 'Reunião com a Viracopos Comex', data: '2026-11-13', inicio: '10:00', fim: '11:00', pessoas: [3], local: 'Na empresa · Campinas', modulo: 'crm', ref: { label: 'Viracopos Comex', hash: 'crm-negocio-1021' } },
    { id: 7018, tipo: 'interno', titulo: 'Revisão mensal de metas', data: '2026-11-13', inicio: '16:00', fim: '17:00', pessoas: [1, 2], local: 'Escritório Atlas · sala 1', modulo: 'crm' },
    { id: 7019, tipo: 'interno', titulo: 'Reunião comercial semanal', data: '2026-11-16', inicio: '09:00', fim: '10:00', pessoas: [1, 2, 3, 4, 5], local: 'Escritório Atlas · sala 1', modulo: 'core' },
    { id: 7020, tipo: 'audiencia', titulo: 'Sessão de julgamento TRF3 (sustentação oral)', data: '2026-11-18', inicio: '14:00', fim: '16:00', pessoas: [6], local: 'Videoconferência TRF3', modulo: 'juridico', ref: { label: 'Americana Fios · MS', hash: 'jur-processo-2004' } },
    { id: 7021, tipo: 'apresentacao', titulo: 'Apresentação dos cálculos: Quimtec', data: '2026-11-19', inicio: '10:00', fim: '11:30', pessoas: [3, 8, 1], local: 'Na empresa · Paulínia', modulo: 'crm', ref: { label: 'Quimtec', hash: 'crm-negocio-1005' } },
    { id: 7022, tipo: 'interno', titulo: 'Reunião comercial semanal', data: '2026-11-23', inicio: '09:00', fim: '10:00', pessoas: [1, 2, 3, 4, 5], local: 'Escritório Atlas · sala 1', modulo: 'core' },
    { id: 7023, tipo: 'reuniao', titulo: 'Assinatura do contrato: Mogiana Agro', data: '2026-11-24', inicio: '15:00', fim: '16:00', pessoas: [1, 2], local: 'Na empresa · Mogi Mirim', modulo: 'crm', ref: { label: 'Mogiana Agro', hash: 'crm-negocio-1013' } },
    { id: 7024, tipo: 'interno', titulo: 'Reunião comercial semanal', data: '2026-11-30', inicio: '09:00', fim: '10:00', pessoas: [1, 2, 3, 4, 5], local: 'Escritório Atlas · sala 1', modulo: 'core' },
    { id: 7025, tipo: 'reuniao', titulo: 'Reunião com a Quimtec (documentos)', data: '2026-11-04', inicio: '10:00', fim: '11:00', pessoas: [3], local: 'Na empresa · Paulínia', modulo: 'crm', ref: { label: 'Quimtec', hash: 'crm-negocio-1005' } },
    { id: 7026, tipo: 'interno', titulo: 'Reunião comercial semanal', data: '2026-11-03', inicio: '09:00', fim: '10:00', pessoas: [1, 2, 3, 4, 5], local: 'Escritório Atlas · sala 1', modulo: 'core' },
    { id: 7027, tipo: 'reuniao', titulo: 'Reunião realizada: Indaiá Usinagem', data: '2026-11-06', inicio: '14:00', fim: '15:00', pessoas: [3], local: 'Na empresa · Indaiatuba', modulo: 'crm', ref: { label: 'Indaiá Usinagem', hash: 'crm-negocio-1008' } }
  ];
  D.tiposEvento = {
    reuniao: { nome: 'Reunião', tone: 'violet', icon: 'users' }, ligacao: { nome: 'Ligação', tone: 'blue', icon: 'phone' },
    apresentacao: { nome: 'Apresentação dos cálculos', tone: 'gold', icon: 'presentation' }, audiencia: { nome: 'Audiência / sessão', tone: 'red', icon: 'gavel' },
    interno: { nome: 'Interno', tone: 'slate', icon: 'building' }, treinamento: { nome: 'Treinamento', tone: 'green', icon: 'book' },
    prazo_interno: { nome: 'Prazo interno (D-1)', tone: 'amber', icon: 'calendar-clock' }, prazo_fatal: { nome: 'Prazo fatal', tone: 'red', icon: 'alert-triangle' }
  };

  /* ---------------- Notificações ---------------- */
  D.notificacoes = [
    { id: 8001, tipo: 'prazo', modulo: 'juridico', icon: 'alert-triangle', tone: 'red', titulo: 'Prazo fatal HOJE: contrarrazões (Metalatibaia)', texto: 'O prazo interno venceu na sexta (06/11). Responsável: Beatriz Sampaio. Gestor jurídico avisado.', quando: '2026-11-09T07:00', lida: false, href: '#jur-processo-2001', origem: 'AUT-14' },
    { id: 8002, tipo: 'prazo', modulo: 'juridico', icon: 'calendar-clock', tone: 'amber', titulo: 'Prazo interno hoje (D-1): manifestação (Valinhos Autopeças)', texto: 'Fatal amanhã, 10/11. Processo 5000462-54.2026.4.03.6105.', quando: '2026-11-09T07:00', lida: false, href: '#jur-processo-2003', origem: 'AUT-13' },
    { id: 8003, tipo: 'etapa', modulo: 'crm', icon: 'hourglass', tone: 'amber', titulo: 'Negócio parado há 26 dias: BG Farma', texto: 'Etapa "Carta proposta e documentos" (SLA de 10 dias). Consultor: Ricardo Fontana.', quando: '2026-11-09T06:00', lida: false, href: '#crm-negocio-1015', origem: 'AUT-10' },
    { id: 8004, tipo: 'tarefa', modulo: 'crm', icon: 'check-square', tone: 'blue', titulo: 'Nova tarefa: aprovar a carta proposta da Mogiana Agro', texto: 'Atribuída por Ricardo Fontana. Prazo hoje, 11:00.', quando: '2026-11-09T08:52', lida: false, href: '#crm-negocio-1013', origem: 'Manual' },
    { id: 8005, tipo: 'financeiro', modulo: 'financeiro', icon: 'receipt', tone: 'red', titulo: 'Honorário vencido: Valinhos Autopeças', texto: 'Parcela de outubro (R$ 2.800,00) vencida há 30 dias.', quando: '2026-11-09T06:00', lida: false, href: '#fin-receber', origem: 'FIN-02' },
    { id: 8006, tipo: 'automacao', modulo: 'core', icon: 'workflow', tone: 'red', titulo: 'Automação falhou: e-mail de lembrete de reunião', texto: 'AUT-03 não enviou o e-mail para fernanda.lopes@… (caixa cheia). Nova tentativa às 10:00.', quando: '2026-11-09T08:01', lida: false, href: '#fluxos-execucao-9104', origem: 'AUT-03' },
    { id: 8007, tipo: 'mencao', modulo: 'crm', icon: 'message', tone: 'violet', titulo: 'Camila Nogueira mencionou você', texto: '"Mariana, a Quimtec quer a apresentação com os sócios no dia 19. Pode participar?"', quando: '2026-11-08T18:24', lida: true, href: '#crm-negocio-1005', origem: 'Manual' },
    { id: 8008, tipo: 'etapa', modulo: 'crm', icon: 'trending-up', tone: 'green', titulo: 'Negócio avançou: Americana Fios → Negociação e fechamento', texto: 'Movido por Ricardo Fontana. Crédito estimado: R$ 1,35 mi.', quando: '2026-11-06T17:40', lida: true, href: '#crm-negocio-1027', origem: 'Manual' },
    { id: 8009, tipo: 'sistema', modulo: 'core', icon: 'calendar', tone: 'slate', titulo: 'Feriado de 20/11 aplicado aos prazos', texto: '2 prazos internos foram recalculados (fatal 23/11 → interno 19/11).', quando: '2026-11-05T09:10', lida: true, href: '#cfg-calendario', origem: 'CORE-01' },
    { id: 8010, tipo: 'tarefa', modulo: 'crm', icon: 'alert-circle', tone: 'amber', titulo: 'Lead sem próxima tarefa: Têxtil Nova Odessa', texto: 'Todo lead ativo precisa de uma próxima tarefa agendada (AUT-11).', quando: '2026-11-05T08:00', lida: true, href: '#crm-negocio-1006', origem: 'AUT-11' },
    { id: 8011, tipo: 'financeiro', modulo: 'financeiro', icon: 'check-circle', tone: 'green', titulo: 'Honorário recebido: Cosmópolis Bioenergia', texto: 'R$ 9.800,00 (novembro) conciliado no extrato.', quando: '2026-11-05T11:32', lida: true, href: '#fin-receber', origem: 'Conciliação' },
    { id: 8012, tipo: 'sistema', modulo: 'intranet', icon: 'video', tone: 'blue', titulo: 'Novo material na Intranet: "Como registrar uma reunião"', texto: 'Vídeo de 4 min na categoria Treinamentos do sistema.', quando: '2026-11-04T16:05', lida: true, href: '#int-biblioteca', origem: 'Manual' }
  ];

  /* ---------------- Fluxos e automações (painel Fluxos) ---------------- */
  /* Gera blocos lineares: gatilho → condições → ações */
  function linear(gat, conds, acoes) {
    var b = [{ id: 'g', cat: 'trigger', titulo: gat[0], detalhe: gat[1], col: 0, linha: 0 }], prev = 'g', col = 1;
    (conds || []).forEach(function (c, i) { var id = 'c' + i; b.push({ id: id, cat: 'condition', titulo: c[0], detalhe: c[1], quando: c[2], col: col++, linha: 0, de: [prev] }); prev = id; });
    (acoes || []).forEach(function (a, i) { var id = 'a' + i; b.push({ id: id, cat: a[0], titulo: a[1], detalhe: a[2], col: col, linha: i, de: [prev], off: !!a[3] }); });
    return b;
  }
  D.fluxos = [
    { id: 1, codigo: 'AUT-21', nome: 'Mover etapa do negócio', modulo: 'crm', tipo: 'Fluxo', ligado: true, versao: 4, arquivo: 'clients/atlas/flows/crm-mover-etapa.ts', gatilhoTxt: 'Botão "Mover etapa" (kanban e ficha)', acaoTxt: 'Valida requisitos, registra o movimento e dispara as automações da etapa', ultimaExec: '2026-11-09T09:14', exec7d: 64, falhas7d: 0, naoRodou7d: 3,
      params: [], blocos: [
        { id: 'g', cat: 'trigger', titulo: 'Botão "Mover etapa"', detalhe: 'Kanban (arrastar) ou ficha do negócio', col: 0, linha: 0 },
        { id: 'd', cat: 'action', titulo: 'Diálogo de requisitos', detalhe: 'Coleta os campos exigidos pela etapa de destino', col: 1, linha: 0, de: ['g'] },
        { id: 'm', cat: 'action', titulo: 'Comando crm.deal.move_stage', detalhe: 'Grava a etapa, carimba a data e calcula dias na etapa anterior', quando: 'os requisitos da etapa forem atendidos', col: 2, linha: 0, de: ['d'] },
        { id: 'e', cat: 'notify', titulo: 'Evento: etapa mudou', detalhe: 'core.pipeline.stage_changed', col: 3, linha: 0, de: ['m'] },
        { id: 'r1', cat: 'task', titulo: 'Criar tarefa "Enviar carta proposta"', detalhe: 'Para o consultor · prazo 2 dias úteis', quando: 'etapa = Reunião realizada', col: 4, linha: 0, de: ['e'] },
        { id: 'r2', cat: 'action', titulo: 'Concluir tarefas pendentes', detalhe: 'Fecha as tarefas abertas do negócio', quando: 'etapa = Ganho', col: 4, linha: 1, de: ['e'] },
        { id: 'r3', cat: 'wait', titulo: 'Recalcular disparos de SLA', detalhe: 'Reprograma o alerta de etapa parada', col: 4, linha: 2, de: ['e'] }
      ] },
    { id: 2, codigo: 'AUT-01', nome: 'Qualificar lead novo', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 2, arquivo: 'clients/atlas/automations/crm-qualificar-lead.ts', gatilhoTxt: 'Lead cadastrado', acaoTxt: 'Tarefa "Qualificar lead" em [24] horas', ultimaExec: '2026-11-09T08:02', exec7d: 9, falhas7d: 0, naoRodou7d: 1,
      params: [{ key: 'prazoHoras', label: 'Prazo da tarefa', valor: 24, unidade: 'horas' }],
      blocos: linear(['Lead cadastrado', 'crm.lead.created'], [['Lead está ativo', 'Não descartado na entrada', 'o lead não for duplicado (CNPJ)']], [['task', 'Criar tarefa "Qualificar lead"', 'Para o consultor responsável · prazo 24 h']]) },
    { id: 3, codigo: 'AUT-02', nome: 'Nova tentativa após ligação sem sucesso', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/crm-nova-tentativa.ts', gatilhoTxt: 'Ligação registrada', acaoTxt: 'Nova tentativa em [2] dias úteis', ultimaExec: '2026-11-06T16:44', exec7d: 14, falhas7d: 0, naoRodou7d: 22,
      params: [{ key: 'dias', label: 'Nova tentativa em', valor: 2, unidade: 'dias úteis' }, { key: 'maxTentativas', label: 'Máximo de tentativas', valor: 4, unidade: 'tentativas' }],
      blocos: linear(['Atividade registrada', 'crm.activity.logged'], [['Tipo = Ligação', '', 'tipo = Ligação'], ['Resultado sem sucesso', '', 'resultado ∈ {Não atendeu, Caixa postal}']], [['task', 'Criar tarefa "Nova tentativa de contato"', 'Prazo: 2 dias úteis'], ['notify', 'Avisar o gestor na 4ª tentativa', 'Notificação no sistema', true]]) },
    { id: 4, codigo: 'AUT-03', nome: 'Lembretes de reunião', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 3, arquivo: 'clients/atlas/automations/crm-lembretes-reuniao.ts', gatilhoTxt: 'Reunião agendada', acaoTxt: 'Lembrete [1] dia antes e no dia', ultimaExec: '2026-11-09T08:00', exec7d: 18, falhas7d: 1, naoRodou7d: 0,
      params: [{ key: 'diasAntes', label: 'Lembrete antes', valor: 1, unidade: 'dia' }, { key: 'horaDia', label: 'Horário do lembrete no dia', valor: '08:00', unidade: '' }, { key: 'emailCliente', label: 'Enviar e-mail ao cliente', valor: true, tipo: 'toggle' }],
      blocos: linear(['Reunião agendada', 'Atividade Reunião com resultado "Agendada"'], [], [['wait', 'Agendar disparo D-1', '1 dia antes, 08:00'], ['wait', 'Agendar disparo no dia', 'No dia, 08:00'], ['notify', 'Notificar o consultor', 'No sistema e por e-mail'], ['notify', 'E-mail de confirmação ao cliente', 'Modelo "Confirmação de reunião"']]) },
    { id: 5, codigo: 'AUT-04', nome: 'Reagendar reunião não realizada', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/crm-reagendar.ts', gatilhoTxt: 'Reunião não realizada', acaoTxt: 'Tarefa "Reagendar reunião" em [1] dia útil', ultimaExec: '2026-11-06T11:20', exec7d: 3, falhas7d: 0, naoRodou7d: 5,
      params: [{ key: 'dias', label: 'Prazo para reagendar', valor: 1, unidade: 'dia útil' }],
      blocos: linear(['Resultado de reunião registrado', 'crm.activity.result_set'], [['Resultado = Não realizada', '', 'resultado = Não realizada']], [['task', 'Criar tarefa "Reagendar reunião"', 'Para o consultor · 1 dia útil'], ['action', 'Voltar o negócio para "Contato com o decisor"', 'Só se o gestor ligar esta opção', true]]) },
    { id: 6, codigo: 'AUT-05', nome: 'Carta proposta após reunião realizada', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 2, arquivo: 'clients/atlas/automations/crm-carta-proposta.ts', gatilhoTxt: 'Reunião realizada', acaoTxt: 'Tarefa "Enviar carta proposta e documentos"', ultimaExec: '2026-11-06T15:05', exec7d: 4, falhas7d: 0, naoRodou7d: 2,
      params: [{ key: 'dias', label: 'Prazo da tarefa', valor: 2, unidade: 'dias úteis' }],
      blocos: linear(['Resultado de reunião registrado', 'crm.activity.result_set'], [['Resultado = Realizada', '', 'resultado = Realizada']], [['task', 'Criar tarefa "Enviar carta proposta e documentos"', 'Para o consultor · 2 dias úteis'], ['action', 'Mover para "Reunião realizada"', 'Se ainda estiver em "Reunião agendada"']]) },
    { id: 7, codigo: 'AUT-06', nome: 'Follow-up de documentação pendente', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/crm-docs-pendentes.ts', gatilhoTxt: 'Documentos pendentes há [5] dias', acaoTxt: 'Tarefa de follow-up', ultimaExec: '2026-11-05T06:00', exec7d: 2, falhas7d: 0, naoRodou7d: 0,
      params: [{ key: 'dias', label: 'Pendente há', valor: 5, unidade: 'dias' }],
      blocos: linear(['Tempo decorrido', 'Verificação diária às 06:00'], [['Etapa = Carta proposta e documentos', '', 'documentos pendentes há 5 dias ou mais']], [['task', 'Criar tarefa "Follow-up de documentação"', 'Para o consultor · hoje']]) },
    { id: 8, codigo: 'AUT-07', nome: 'Documentação recebida → equipe de cálculo', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 2, arquivo: 'clients/atlas/automations/crm-docs-calculo.ts', gatilhoTxt: 'Documentação recebida', acaoTxt: 'Tarefa para a fila "Equipe de cálculo"', ultimaExec: '2026-11-04T11:48', exec7d: 2, falhas7d: 0, naoRodou7d: 0,
      params: [{ key: 'dias', label: 'Prazo para o levantamento', valor: 5, unidade: 'dias úteis' }],
      blocos: linear(['Atividade registrada', 'Documentação · Documento recebido'], [['Todos os documentos obrigatórios recebidos', '', 'a lista de pendências estiver vazia']], [['task', 'Criar tarefa para a equipe de cálculo', 'Fila "Equipe de cálculo" · 5 dias úteis'], ['action', 'Mover para "Levantamento das oportunidades"', 'Carimba a data de início do cálculo']]) },
    { id: 9, codigo: 'AUT-08', nome: 'Cálculos concluídos → agendar apresentação', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/crm-agendar-apresentacao.ts', gatilhoTxt: 'Cálculos concluídos', acaoTxt: 'Tarefa "Agendar apresentação dos cálculos"', ultimaExec: '2026-11-03T17:22', exec7d: 1, falhas7d: 0, naoRodou7d: 0, params: [],
      blocos: linear(['Campo alterado', 'Cálculo concluído = sim'], [], [['task', 'Criar tarefa "Agendar apresentação"', 'Para o consultor · 2 dias úteis'], ['notify', 'Avisar o sócio responsável', 'No sistema']]) },
    { id: 10, codigo: 'AUT-09', nome: 'Follow-up de fechamento', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/crm-followup-fechamento.ts', gatilhoTxt: 'Apresentação dos cálculos feita', acaoTxt: 'Follow-up em [3] dias úteis', ultimaExec: '2026-11-04T18:10', exec7d: 2, falhas7d: 0, naoRodou7d: 0,
      params: [{ key: 'dias', label: 'Follow-up em', valor: 3, unidade: 'dias úteis' }],
      blocos: linear(['Resultado registrado', 'Apresentação dos cálculos'], [['Resultado = Realizada', '', 'resultado = Realizada']], [['task', 'Criar tarefa "Follow-up de fechamento"', '3 dias úteis'], ['action', 'Mover para "Negociação e fechamento"', '']]) },
    { id: 11, codigo: 'AUT-10', nome: 'Alerta de etapa parada', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 2, arquivo: 'clients/atlas/automations/crm-etapa-parada.ts', gatilhoTxt: 'Etapa parada há mais que o SLA', acaoTxt: 'Alerta ao consultor e ao gestor', ultimaExec: '2026-11-09T06:00', exec7d: 7, falhas7d: 0, naoRodou7d: 0,
      params: [{ key: 'usarSla', label: 'Usar o SLA de cada etapa', valor: true, tipo: 'toggle' }, { key: 'repetir', label: 'Repetir o alerta a cada', valor: 3, unidade: 'dias' }],
      blocos: linear(['Tempo decorrido', 'Verificação diária às 06:00'], [['Dias na etapa > SLA', '', 'dias na etapa forem maiores que o SLA da etapa']], [['notify', 'Alertar o consultor', 'No sistema e por e-mail'], ['notify', 'Alertar o gestor comercial', 'No sistema'], ['wait', 'Reprogramar em 3 dias', 'Se continuar parado']]) },
    { id: 12, codigo: 'AUT-11', nome: 'Lead ativo sem próxima tarefa', modulo: 'crm', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/crm-proxima-tarefa.ts', gatilhoTxt: 'Lead ativo sem tarefa aberta', acaoTxt: 'Aviso ao consultor responsável', ultimaExec: '2026-11-09T06:00', exec7d: 5, falhas7d: 0, naoRodou7d: 0, params: [],
      blocos: linear(['Tarefa concluída ou verificação diária', 'crm.task.completed · 06:00'], [['Negócio em andamento', '', 'o negócio não tiver desfecho'], ['Sem tarefa aberta', '', 'não existir tarefa aberta no negócio']], [['notify', 'Avisar o consultor', '"Agende a próxima tarefa"']]) },
    { id: 13, codigo: 'AUT-12', nome: 'Aviso antes do prazo interno', modulo: 'juridico', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/jur-aviso-prazo.ts', gatilhoTxt: '[3] dias úteis antes do prazo interno', acaoTxt: 'Aviso ao responsável', ultimaExec: '2026-11-09T07:00', exec7d: 6, falhas7d: 0, naoRodou7d: 0,
      params: [{ key: 'dias', label: 'Avisar com antecedência de', valor: 3, unidade: 'dias úteis' }],
      blocos: linear(['Data relativa', '3 dias úteis antes do prazo interno · 07:00'], [['Prazo pendente', '', 'status = Pendente']], [['notify', 'Avisar o advogado responsável', 'No sistema e por e-mail']]) },
    { id: 14, codigo: 'AUT-13', nome: 'Alerta no dia do prazo interno (D-1)', modulo: 'juridico', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/jur-alerta-d1.ts', gatilhoTxt: 'Dia do prazo interno', acaoTxt: 'Alerta ao responsável', ultimaExec: '2026-11-09T07:00', exec7d: 5, falhas7d: 0, naoRodou7d: 0, params: [{ key: 'hora', label: 'Horário do alerta', valor: '07:00', unidade: '' }],
      blocos: linear(['Data relativa', 'No prazo interno · 07:00'], [['Prazo pendente', '', 'status = Pendente']], [['notify', 'Alertar o advogado responsável', 'No sistema e por e-mail'], ['action', 'Destacar no Início e na agenda jurídica', '']]) },
    { id: 15, codigo: 'AUT-14', nome: 'Alerta crítico no dia fatal', modulo: 'juridico', tipo: 'Automação', ligado: true, versao: 2, arquivo: 'clients/atlas/automations/jur-alerta-fatal.ts', gatilhoTxt: 'Chegou o dia fatal sem cumprimento', acaoTxt: 'Alerta crítico ao responsável e ao gestor', ultimaExec: '2026-11-09T07:00', exec7d: 1, falhas7d: 0, naoRodou7d: 4, params: [],
      blocos: linear(['Data relativa', 'No dia fatal · 07:00'], [['Prazo ainda pendente', '', 'status = Pendente']], [['notify', 'Alerta crítico ao advogado', 'No sistema, e-mail e destaque vermelho'], ['notify', 'Alerta crítico ao gestor jurídico', 'No sistema e e-mail'], ['task', 'Criar tarefa "Protocolar hoje"', 'Para o responsável · até 12:00']]) },
    { id: 16, codigo: 'AUT-15', nome: 'Negócio ganho → Jurídico', modulo: 'crm', tipo: 'Automação', ligado: false, versao: 1, arquivo: 'clients/atlas/automations/crm-contrato-assinado.ts', gatilhoTxt: 'Negócio ganho', acaoTxt: 'Tarefa "Preparar a ação" para a fila "Equipe jurídica" (a confirmar: Q3). O contrato no Financeiro não depende desta regra.', ultimaExec: null, exec7d: 0, falhas7d: 0, naoRodou7d: 0, params: [],
      blocos: linear(['Negócio ganho', 'crm.deal.won'], [], [['task', 'Tarefa para o Jurídico: preparar a ação', 'Fila "Equipe jurídica"', true]]) },
    { id: 17, codigo: 'FIN-01', nome: 'Gerar honorários mensais', modulo: 'financeiro', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/fin-honorarios-mensais.ts', gatilhoTxt: 'Todo dia 1º às 06:00', acaoTxt: 'Gera os títulos a receber dos contratos ativos', ultimaExec: '2026-11-01T06:00', exec7d: 1, falhas7d: 0, naoRodou7d: 0, params: [{ key: 'dia', label: 'Dia de geração', valor: 1, unidade: 'do mês' }],
      blocos: linear(['Horário agendado', 'Dia 1º · 06:00'], [['Contrato ativo', '', 'status do contrato = Ativo']], [['action', 'Criar título a receber', 'Valor do honorário mensal · vencimento do contrato'], ['task', 'Tarefa "Emitir boletos"', 'Para o Financeiro']]) },
    { id: 18, codigo: 'FIN-02', nome: 'Cobrança de honorário vencido', modulo: 'financeiro', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'clients/atlas/automations/fin-cobranca.ts', gatilhoTxt: 'Título vencido há [3] dias', acaoTxt: 'Tarefa de cobrança e aviso ao sócio', ultimaExec: '2026-11-09T06:00', exec7d: 2, falhas7d: 0, naoRodou7d: 0, params: [{ key: 'dias', label: 'Vencido há', valor: 3, unidade: 'dias' }],
      blocos: linear(['Tempo decorrido', 'Verificação diária às 06:00'], [['Título em aberto e vencido', '', 'vencido há 3 dias ou mais']], [['task', 'Tarefa "Cobrar honorário"', 'Para o Financeiro'], ['notify', 'Avisar o sócio responsável', 'No sistema']]) },
    { id: 19, codigo: 'CORE-01', nome: 'Feriado cadastrado → recalcular prazos internos', modulo: 'core', tipo: 'Automação', ligado: true, versao: 1, arquivo: 'platform/core/automations/recalcular-prazos.ts', gatilhoTxt: 'Feriado ou suspensão cadastrada', acaoTxt: 'Recalcula o D-1 dos prazos pendentes afetados', ultimaExec: '2026-11-05T09:10', exec7d: 1, falhas7d: 0, naoRodou7d: 0, params: [],
      blocos: linear(['Calendário alterado', 'core.calendar.changed'], [['Prazos pendentes afetados', '', 'existir prazo pendente na janela do feriado']], [['action', 'Recalcular o prazo interno (D-1)', 'Pelo calendário de dias úteis'], ['notify', 'Avisar os responsáveis', 'Lista do que mudou']]) }
  ];

  /* Execuções recentes (trilha "por que rodou / por que não rodou") */
  D.fluxoExecucoes = [
    { id: 9101, fluxoId: 1, quando: '2026-11-09T09:14', estado: 'rodou', duracao: '420 ms', registro: { label: 'Indaiá Usinagem · Verbas indenizatórias', hash: 'crm-negocio-1008' }, por: 3,
      passos: { g: { estado: 'ok', hora: '09:14:02' }, d: { estado: 'ok', hora: '09:14:09' }, m: { estado: 'ok', hora: '09:14:10' }, e: { estado: 'ok', hora: '09:14:10' }, r1: { estado: 'ok', hora: '09:14:10' }, r2: { estado: 'barrou', hora: '09:14:10' }, r3: { estado: 'ok', hora: '09:14:11' } },
      trilha: [{ bloco: 'm', cond: 'requisitos da etapa atendidos', esperado: 'sim', real: 'sim', ok: true }, { bloco: 'r1', cond: 'etapa = Reunião realizada', esperado: 'Reunião realizada', real: 'Reunião realizada', ok: true }, { bloco: 'r2', cond: 'etapa = Ganho', esperado: 'Ganho', real: 'Reunião realizada', ok: false }],
      saidas: [{ label: 'Tarefa criada: Enviar carta proposta e documentos', hash: 'crm-negocio-1008' }] },
    { id: 9102, fluxoId: 5, quando: '2026-11-09T08:40', estado: 'nao_rodou', duracao: '35 ms', registro: { label: 'CDME · Monofásico', hash: 'crm-negocio-1011' }, por: 5,
      passos: { g: { estado: 'ok', hora: '08:40:12' }, c0: { estado: 'barrou', hora: '08:40:12' }, a0: { estado: 'skip' }, a1: { estado: 'skip' } },
      trilha: [{ bloco: 'c0', cond: 'resultado = Não realizada', esperado: 'Não realizada', real: 'Reagendada', ok: false }],
      porque: 'A reunião foi marcada como "Reagendada", não como "Não realizada". Reagendar já cria um novo compromisso, então a tarefa "Reagendar reunião" não é necessária.' },
    { id: 9103, fluxoId: 15, quando: '2026-11-09T07:00', estado: 'rodou', duracao: '1,2 s', registro: { label: 'Prazo 5002 · Contrarrazões (Metalatibaia)', hash: 'jur-processo-2001' }, por: null,
      passos: { g: { estado: 'ok', hora: '07:00:00' }, c0: { estado: 'ok', hora: '07:00:00' }, a0: { estado: 'ok', hora: '07:00:01' }, a1: { estado: 'ok', hora: '07:00:01' }, a2: { estado: 'ok', hora: '07:00:01' } },
      trilha: [{ bloco: 'c0', cond: 'status = Pendente', esperado: 'Pendente', real: 'Pendente', ok: true }],
      saidas: [{ label: 'Tarefa criada: Protocolar contrarrazões', hash: 'jur-processo-2001' }, { label: '2 notificações enviadas', hash: 'notificacoes' }] },
    { id: 9104, fluxoId: 4, quando: '2026-11-09T08:00', estado: 'falhou', duracao: '3,8 s', tentativa: 1, registro: { label: 'Reunião com a JVT Vidros · 10:30', hash: 'crm-negocio-1018' }, por: null,
      passos: { g: { estado: 'ok', hora: '08:00:00' }, a0: { estado: 'ok', hora: '08:00:00' }, a1: { estado: 'ok', hora: '08:00:00' }, a2: { estado: 'ok', hora: '08:00:01' }, a3: { estado: 'fail', hora: '08:00:04', tentativa: 1 } },
      trilha: [], erro: 'O servidor de e-mail do destinatário recusou a mensagem: caixa postal cheia (552). Nova tentativa programada para 10:00; depois, 12:00.' },
    { id: 9105, fluxoId: 2, quando: '2026-11-09T08:02', estado: 'rodou', duracao: '180 ms', registro: { label: 'Jaguari Laticínios · Selic no indébito', hash: 'crm-negocio-1028' }, por: 4,
      passos: { g: { estado: 'ok', hora: '08:02:31' }, c0: { estado: 'ok', hora: '08:02:31' }, a0: { estado: 'ok', hora: '08:02:31' } },
      trilha: [{ bloco: 'c0', cond: 'lead não duplicado (CNPJ)', esperado: 'sem duplicidade', real: 'empresa já existe, negócio novo', ok: true }], saidas: [{ label: 'Tarefa criada: Qualificar lead', hash: 'crm-negocio-1028' }] },
    { id: 9106, fluxoId: 3, quando: '2026-11-06T16:44', estado: 'nao_rodou', duracao: '22 ms', registro: { label: 'Plastiform · Monofásico', hash: 'crm-negocio-1002' }, por: 4,
      passos: { g: { estado: 'ok', hora: '16:44:10' }, c0: { estado: 'ok', hora: '16:44:10' }, c1: { estado: 'barrou', hora: '16:44:10' }, a0: { estado: 'skip' }, a1: { estado: 'skip' } },
      trilha: [{ bloco: 'c0', cond: 'tipo = Ligação', esperado: 'Ligação', real: 'Ligação', ok: true }, { bloco: 'c1', cond: 'resultado ∈ {Não atendeu, Caixa postal}', esperado: 'Não atendeu ou Caixa postal', real: 'Pediu retorno', ok: false }],
      porque: 'O contato pediu retorno. Nesse caso o consultor agenda o retorno manualmente com a data combinada.' },
    { id: 9107, fluxoId: 11, quando: '2026-11-09T06:00', estado: 'rodou', duracao: '2,4 s', registro: { label: '7 negócios verificados · 3 parados', hash: 'crm-funil' }, por: null,
      passos: { g: { estado: 'ok', hora: '06:00:00' }, c0: { estado: 'ok', hora: '06:00:01' }, a0: { estado: 'ok', hora: '06:00:02' }, a1: { estado: 'ok', hora: '06:00:02' }, a2: { estado: 'ok', hora: '06:00:02' } },
      trilha: [{ bloco: 'c0', cond: 'dias na etapa > SLA', esperado: '> 10 dias', real: '26 dias (BG Farma)', ok: true }], saidas: [{ label: '3 alertas enviados', hash: 'notificacoes' }] },
    { id: 9108, fluxoId: 17, quando: '2026-11-01T06:00', estado: 'rodou', duracao: '1,9 s', registro: { label: '9 contratos ativos', hash: 'fin-receber' }, por: null,
      passos: { g: { estado: 'ok', hora: '06:00:00' }, c0: { estado: 'ok', hora: '06:00:00' }, a0: { estado: 'ok', hora: '06:00:01' }, a1: { estado: 'ok', hora: '06:00:01' } },
      trilha: [{ bloco: 'c0', cond: 'status do contrato = Ativo', esperado: 'Ativo', real: '9 de 9', ok: true }], saidas: [{ label: '9 títulos a receber criados', hash: 'fin-receber' }] }
  ];

  /* Próximos disparos agendados (o "Scheduled workflows" do Bubble).
     CRM e Jurídico NÃO ficam aqui: o painel #fluxos-proximos calcula pelas regras ligadas
     (App.data.crm.disparos() e App.data.juridico.disparos({ futuros: true })). Aqui só as rotinas do Financeiro. */
  D.disparos = [
    { id: 9509, fluxoId: 18, quando: '2026-11-13T06:00', registro: { label: 'Honorários de novembro vencidos (dia 10)', hash: 'fin-receber' }, para: 'Larissa Campos', motivo: 'Vencido há 3 dias' },
    { id: 9510, fluxoId: 17, quando: '2026-12-01T06:00', registro: { label: 'Honorários de dezembro', hash: 'fin-receber' }, para: 'Financeiro', motivo: 'Rotina mensal' }
  ];

  /* ---------------- Auditoria ---------------- */
  D.auditoria = [
    { id: 1, quando: '2026-11-09T09:14', pessoaId: 3, modulo: 'crm', acao: 'Alterou', entidade: 'Negócio', registro: { label: 'Indaiá Usinagem · Verbas indenizatórias', hash: 'crm-negocio-1008' }, campo: 'Etapa', antes: 'Reunião agendada', depois: 'Reunião realizada', ip: '177.84.22.10' },
    { id: 2, quando: '2026-11-09T09:12', pessoaId: 1, modulo: 'core', acao: 'Entrou', entidade: 'Sessão', registro: null, campo: 'Login com MFA', antes: '', depois: 'Sucesso', ip: '189.40.113.7' },
    { id: 3, quando: '2026-11-09T09:05', pessoaId: 5, modulo: 'crm', acao: 'Criou', entidade: 'Atividade', registro: { label: 'CDME · Reunião reagendada', hash: 'crm-negocio-1011' }, campo: 'Resultado', antes: '', depois: 'Reagendada', ip: '177.84.22.14' },
    { id: 4, quando: '2026-11-09T08:58', pessoaId: 2, modulo: 'crm', acao: 'Exportou', entidade: 'Relatório', registro: { label: 'Painel do consultor · outubro', hash: 'crm-painel' }, campo: 'Excel (.xlsx)', antes: '', depois: '142 linhas', ip: '177.84.22.11' },
    { id: 5, quando: '2026-11-09T08:47', pessoaId: 7, modulo: 'juridico', acao: 'Alterou', entidade: 'Prazo', registro: { label: 'Prazo 5011 · Embargos (Metalatibaia)', hash: 'jur-processo-2001' }, campo: 'Status', antes: 'Pendente', depois: 'Cumprido (27/10)', ip: '177.84.22.18' },
    { id: 6, quando: '2026-11-09T08:31', pessoaId: 6, modulo: 'juridico', acao: 'Acessou dado protegido', entidade: 'Contato', registro: { label: 'Rogério Albuquerque · CPF', hash: 'crm-empresa-1' }, campo: 'CPF', antes: '', depois: 'Visualizado', ip: '177.84.22.16' },
    { id: 7, quando: '2026-11-08T18:24', pessoaId: 3, modulo: 'crm', acao: 'Criou', entidade: 'Comentário', registro: { label: 'Quimtec · ICMS e insumos', hash: 'crm-negocio-1005' }, campo: 'Comentário', antes: '', depois: 'Menção a Mariana Duarte', ip: '201.17.80.4' },
    { id: 8, quando: '2026-11-06T17:40', pessoaId: 2, modulo: 'crm', acao: 'Alterou', entidade: 'Negócio', registro: { label: 'Americana Fios · Insumos', hash: 'crm-negocio-1027' }, campo: 'Etapa', antes: 'Apresentação dos cálculos', depois: 'Negociação e fechamento', ip: '177.84.22.11' },
    { id: 9, quando: '2026-11-06T16:02', pessoaId: 10, modulo: 'financeiro', acao: 'Alterou', entidade: 'Título a receber', registro: { label: 'Cosmópolis Bioenergia · nov/2026', hash: 'fin-receber' }, campo: 'Situação', antes: 'Em aberto', depois: 'Recebido', ip: '177.84.22.20' },
    { id: 10, quando: '2026-11-06T11:15', pessoaId: 1, modulo: 'core', acao: 'Alterou', entidade: 'Usuário', registro: { label: 'Gustavo Ramos', hash: 'cfg-usuarios' }, campo: 'Papel', antes: '—', depois: 'Analista de cálculo (convite enviado)', ip: '189.40.113.7' },
    { id: 11, quando: '2026-11-05T09:10', pessoaId: 6, modulo: 'core', acao: 'Criou', entidade: 'Feriado', registro: { label: '20/11 · Dia da Consciência Negra', hash: 'cfg-calendario' }, campo: 'Calendário', antes: '', depois: 'Nacional', ip: '177.84.22.16' },
    { id: 12, quando: '2026-11-05T09:10', pessoaId: null, modulo: 'core', acao: 'Automação', entidade: 'Prazo', registro: { label: 'Prazo 5005 · Apelação', hash: 'jur-processo-2010' }, campo: 'Prazo interno', antes: '20/11/2026', depois: '19/11/2026', ip: 'sistema' },
    { id: 13, quando: '2026-11-04T15:22', pessoaId: 1, modulo: 'core', acao: 'Alterou', entidade: 'Automação', registro: { label: 'AUT-06 · Follow-up de documentação', hash: 'fluxos-parametros' }, campo: 'Pendente há', antes: '7 dias', depois: '5 dias', ip: '189.40.113.7' },
    { id: 14, quando: '2026-11-04T11:48', pessoaId: 3, modulo: 'crm', acao: 'Criou', entidade: 'Documento', registro: { label: 'BG Farma · EFD-Contribuições 2021–2025', hash: 'crm-negocio-1015' }, campo: 'Arquivo', antes: '', depois: 'efd-contribuicoes.zip (48 MB)', ip: '177.84.22.12' },
    { id: 15, quando: '2026-11-03T10:30', pessoaId: 1, modulo: 'core', acao: 'Excluiu', entidade: 'Negócio', registro: { label: 'Lead duplicado · Plastiform', hash: 'crm-negocios' }, campo: 'Registro', antes: 'Negócio 1029', depois: 'Excluído (duplicado)', ip: '189.40.113.7' },
    { id: 16, quando: '2026-11-02T08:05', pessoaId: 11, modulo: 'intranet', acao: 'Criou', entidade: 'Material', registro: { label: 'Como registrar uma reunião', hash: 'int-biblioteca' }, campo: 'Vídeo', antes: '', depois: 'Publicado', ip: '177.84.22.22' },
    { id: 17, quando: '2026-10-31T17:58', pessoaId: 2, modulo: 'crm', acao: 'Alterou', entidade: 'Meta', registro: { label: 'Metas de novembro', hash: 'crm-metas' }, campo: 'Reuniões realizadas (Thiago)', antes: '12', depois: '10', ip: '177.84.22.11' },
    { id: 18, quando: '2026-10-30T09:40', pessoaId: 4, modulo: 'core', acao: 'Falha de login', entidade: 'Sessão', registro: null, campo: 'Senha incorreta (2ª tentativa)', antes: '', depois: 'Bloqueio em 3 tentativas', ip: '200.150.4.91' }
  ];

  /* ---------------- Permissões (matriz papel × permissão) ---------------- */
  /* valores: 'todos' | 'proprios' | 'equipe' | 'sim' | '' (sem acesso) */
  var P = function (k, n, v) { return { key: k, nome: n, v: v }; };
  D.permissoes = [
    { grupo: 'Núcleo', itens: [
      P('core.agenda.read', 'Ver a agenda compartilhada', { socio: 'todos', gestor_comercial: 'todos', consultor: 'todos', gestor_juridico: 'todos', advogado: 'todos', calculo: 'todos', financeiro: 'todos', administrativo: 'todos' }),
      P('core.users.manage', 'Gerenciar usuários e papéis', { socio: 'sim' }),
      P('core.settings.manage', 'Alterar configurações (funis, listas, calendário, marca)', { socio: 'sim', gestor_juridico: 'calendário' }),
      P('core.flow.read', 'Ver o painel Fluxos', { socio: 'sim', gestor_comercial: 'sim', gestor_juridico: 'sim' }),
      P('core.flow.params', 'Alterar parâmetros e ligar/desligar automações', { socio: 'sim' }),
      P('core.audit.read', 'Ver a auditoria', { socio: 'sim', gestor_comercial: 'equipe', gestor_juridico: 'equipe' }),
      P('core.export', 'Exportar para Excel', { socio: 'sim', gestor_comercial: 'sim', gestor_juridico: 'sim', financeiro: 'sim' })
    ] },
    { grupo: 'CRM Comercial', itens: [
      P('crm.deal.read', 'Ver empresas, leads e negócios', { socio: 'todos', gestor_comercial: 'todos', consultor: 'proprios', gestor_juridico: 'todos', calculo: 'todos' }),
      P('crm.deal.write', 'Criar e editar negócios', { socio: 'todos', gestor_comercial: 'todos', consultor: 'proprios' }),
      P('crm.deal.move', 'Mover etapa', { socio: 'todos', gestor_comercial: 'todos', consultor: 'proprios', calculo: 'etapa 7' }),
      P('crm.activity.write', 'Registrar atividades', { socio: 'todos', gestor_comercial: 'todos', consultor: 'proprios', calculo: 'todos' }),
      P('crm.goal.manage', 'Definir metas e ver o fechamento mensal', { socio: 'sim', gestor_comercial: 'sim' }),
      P('crm.contact.cpf', 'Ver CPF de contatos', { socio: 'sim', gestor_comercial: 'sim' })
    ] },
    { grupo: 'Jurídico', itens: [
      P('jur.case.read', 'Ver processos e andamentos', { socio: 'todos', gestor_juridico: 'todos', advogado: 'proprios', gestor_comercial: 'todos' }),
      P('jur.case.write', 'Criar e editar processos', { socio: 'todos', gestor_juridico: 'todos', advogado: 'proprios' }),
      P('jur.deadline.write', 'Cadastrar e cumprir prazos', { socio: 'todos', gestor_juridico: 'todos', advogado: 'proprios' }),
      P('jur.report.read', 'Relatórios de produtividade e prazos', { socio: 'sim', gestor_juridico: 'sim' })
    ] },
    { grupo: 'Financeiro', itens: [
      P('fin.read', 'Ver contas a receber e a pagar', { socio: 'todos', financeiro: 'todos', gestor_comercial: 'honorários' }),
      P('fin.write', 'Lançar, baixar e conciliar', { socio: 'sim', financeiro: 'sim' }),
      P('fin.approve', 'Aprovar pagamentos e fechamento', { socio: 'sim' })
    ] },
    { grupo: 'Intranet', itens: [
      P('int.read', 'Ver documentos e vídeos', { socio: 'todos', gestor_comercial: 'todos', consultor: 'todos', gestor_juridico: 'todos', advogado: 'todos', calculo: 'todos', financeiro: 'todos', administrativo: 'todos' }),
      P('int.manage', 'Publicar e organizar materiais', { socio: 'sim', administrativo: 'sim', gestor_comercial: 'sim' })
    ] }
  ];

  /* Configuração de marca (Configurações → Marca) */
  D.marca = { nome: 'Atlas Corporate', nomeSistema: 'Atlas · Gestão', dominio: 'atlas.exemplo', remetente: 'Atlas Corporate <nao-responda@atlas.exemplo>', corPrimaria: '#C4923A', corTextoDourado: '#8A6320', fonteTitulos: 'Source Serif 4', fonteTexto: 'Inter', temaPadrao: 'sistema', licencas: 30 };
})();
