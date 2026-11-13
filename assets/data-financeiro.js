/* ==========================================================================
   ATLAS · data-financeiro.js — dados fictícios do módulo Financeiro
   Cópia do financeiro do LajesTech (fin_contas_receber/_parcelas, fin_contas_pagar/_parcelas,
   fin_custos_adm/_parcelas, fin_plano_contas + tipo_dre, fin_contas_bancarias, fin_fluxo_caixa,
   notas de entrada com sugestão de categoria) adaptada à Atlas:
   - receita = honorários mensais dos contratos (App.data.contratos) e honorários de êxito
     sobre créditos compensados (PER/DCOMP), faturados conforme a compensação acontece;
   - despesas diretas (custas, certidões, perícias, correspondentes, comissões de parceiros)
     e custos administrativos (escritório, pessoal, sistemas…);
   - retenções na fonte sobre a NFS-e de consultoria: IRRF 1,5% (RIR/2018, art. 714) e
     PIS/Cofins/CSLL 4,65% (Lei 10.833/2003, art. 30); ISS retido quando o tomador é responsável.
     O boleto, o recebimento e a conciliação usam o valor LÍQUIDO; as retenções viram tributo a compensar.
   FONTE ÚNICA do crédito recuperado: F.compensacoes (cada PER/DCOMP ligado a um processo na etapa
     "Compensação (PER/DCOMP)" ou a um processo administrativo). F.creditoRecuperado(contratoId) soma as
     compensações realizadas e o valor é gravado em App.data.contratos[].creditoRecuperado na carga, para
     CRM, Jurídico e Financeiro lerem o mesmo número.
   Regras: não altera a estrutura dos arrays compartilhados; lê empresas/contratos/processos por ID.
   IDs: fornecedores 4001+ · contas a receber 12001+ · contas a pagar 13001+ · notas de entrada 15001+
   Referência de datas: App.HOJE = 09/11/2026 (segunda-feira).
   ========================================================================== */
(function () {
  'use strict';
  var App = window.App, D = App.data, util = App.util;
  var F = App.data.financeiro = App.data.financeiro || {};
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function vu(iso) { return util.iso(util.proximoDiaUtil(iso)); }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i]; return null; }
  var MESC = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function mesCurto(m) { return MESC[+m.slice(5, 7) - 1] + '/' + m.slice(0, 4); }
  F.mesCurto = mesCurto;
  var moeda = function (v) { return App.fmt.moeda(v); };
  var r2 = function (v) { return Math.round(v * 100) / 100; };
  /* processos do Jurídico (data.js + próprios do módulo), para ler número e etapa por ID */
  F.processo = function (id) {
    var p = find(D.processos || [], id); if (p) return p;
    var J = D.juridico || {}; return find(J.processos || [], id);
  };
  function numProc(id) { var p = F.processo(id); return p ? p.numero : 'processo #' + id; }

  /* ---------------- Retenções na fonte sobre a NFS-e (serviço de consultoria) ---------------- */
  /* Tomadores dos honorários são PJ do Lucro Real ou Presumido: retêm IRRF 1,5% e CSRF 4,65% (CSLL 1% + PIS 0,65% + Cofins 3%).
     ISS 3%: recolhido pela Atlas, salvo quando o cadastro do tomador indica retenção (responsável tributário em Campinas). */
  F.retencaoAliq = { irrf: 1.5, csll: 1, pis: 0.65, cofins: 3, iss: 3 };
  F.issRetido = function (empresaId) { var e = find(D.empresas || [], empresaId); return !!e && e.cidade === 'Campinas'; };
  F.retencao = function (empresaId, valor, tipo) {
    var A = F.retencaoAliq, servico = tipo !== 'reembolso';
    var o = { servico: servico, issRetido: servico && F.issRetido(empresaId), irrf: 0, csll: 0, pis: 0, cofins: 0, iss: 0, issValor: servico ? r2(valor * A.iss / 100) : 0 };
    if (servico) { o.irrf = r2(valor * A.irrf / 100); o.csll = r2(valor * A.csll / 100); o.pis = r2(valor * A.pis / 100); o.cofins = r2(valor * A.cofins / 100); if (o.issRetido) o.iss = o.issValor; }
    o.csrf = r2(o.csll + o.pis + o.cofins); o.federais = r2(o.irrf + o.csrf); o.total = r2(o.federais + o.iss); o.liquido = r2(valor - o.total);
    return o;
  };
  var liq = function (empresaId, valor, tipo) { return F.retencao(empresaId, valor, tipo || 'fee').liquido; };

  /* ---------------- Tipo DRE (option set dre_tipo do LajesTech, adaptado) ---------------- */
  /* custo_material_excluir (fábrica) não se aplica à Atlas: virou "variavel" (custos diretos dos casos). */
  F.tiposDre = [
    { key: 'receita', nome: 'Receita bruta', curto: 'Receita', tone: 'green' },
    { key: 'deducao', nome: 'Deduções da receita (ISS, PIS, Cofins)', curto: 'Dedução', tone: 'amber' },
    { key: 'variavel', nome: 'Custos diretos e despesas variáveis', curto: 'Variável', tone: 'violet' },
    { key: 'fixa', nome: 'Despesas fixas', curto: 'Fixa', tone: 'blue' },
    { key: 'financeiro', nome: 'Resultado financeiro', curto: 'Financeiro', tone: 'slate' },
    { key: 'ir_csll', nome: 'IRPJ e CSLL', curto: 'IRPJ/CSLL', tone: 'red' },
    { key: 'nao_dre', nome: 'Fora do DRE', curto: 'Fora do DRE', tone: 'gray' }
  ];
  F.centros = ['Diretoria', 'Comercial', 'Jurídico', 'Cálculo', 'Administrativo'];
  F.formas = [
    { key: 'boleto', nome: 'Boleto' }, { key: 'pix', nome: 'PIX' }, { key: 'transferencia', nome: 'Transferência bancária' },
    { key: 'debito', nome: 'Débito automático' }, { key: 'cartao', nome: 'Cartão corporativo' }, { key: 'gru', nome: 'Guia de tributo (GRU, DARF, FGTS Digital)' }, { key: 'dinheiro', nome: 'Dinheiro (caixa)' }
  ];

  /* ---------------- Categorias e subcategorias (Categoria-Custo-Adm / SubCategoria-Custo-Adm) ---------------- */
  /* natureza: receita | direto (contas a pagar ligadas a cliente/processo) | adm (custos administrativos) */
  F.categorias = [
    { key: 'honorarios', nome: 'Honorários', natureza: 'receita', icon: 'wallet', tone: 'gold', centro: 'Comercial', subs: [['Honorários mensais', 'receita', 108], ['Honorários de êxito', 'receita', 41], ['Pareceres e consultorias avulsas', 'receita', 4]] },
    { key: 'reembolsos', nome: 'Reembolsos de clientes', natureza: 'receita', icon: 'refresh', tone: 'slate', centro: 'Jurídico', subs: [['Reembolso de custas e perícias', 'nao_dre', 6]] },
    { key: 'rec_fin', nome: 'Receitas financeiras', natureza: 'receita', icon: 'trending-up', tone: 'green', centro: 'Diretoria', subs: [['Rendimento de aplicações', 'financeiro', 10], ['Juros e multas recebidos', 'financeiro', 3]] },

    { key: 'custas', nome: 'Custas e certidões (Jurídico)', natureza: 'direto', icon: 'gavel', tone: 'red', centro: 'Jurídico', subs: [['Custas judiciais (GRU)', 'variavel', 9], ['Certidões', 'variavel', 14], ['Diligências e cópias', 'variavel', 2], ['Depósito judicial', 'nao_dre', 0]] },
    { key: 'pericias', nome: 'Perícias e cálculos terceirizados', natureza: 'direto', icon: 'calculator', tone: 'violet', centro: 'Cálculo', subs: [['Perícia contábil', 'variavel', 5], ['Assistente técnico', 'variavel', 1]] },
    { key: 'correspondentes', nome: 'Correspondentes jurídicos', natureza: 'direto', icon: 'scale', tone: 'slate', centro: 'Jurídico', subs: [['Protocolo e despacho', 'variavel', 4], ['Audiências', 'variavel', 1]] },
    { key: 'comissoes', nome: 'Comissões de parceiros', natureza: 'direto', icon: 'users', tone: 'blue', centro: 'Comercial', subs: [['Comissão sobre êxito', 'variavel', 11], ['Comissão sobre honorário mensal', 'variavel', 6]] },

    { key: 'pessoal_adm', nome: 'Pessoal administrativo', natureza: 'adm', icon: 'users', tone: 'blue', centro: 'Administrativo', subs: [['Salários', 'fixa', 10], ['Encargos (INSS, FGTS)', 'fixa', 10], ['Benefícios', 'fixa', 10], ['Pró-labore', 'fixa', 10]] },
    { key: 'pessoal_tec', nome: 'Pessoal técnico (jurídico e cálculo)', natureza: 'adm', icon: 'briefcase', tone: 'violet', centro: 'Jurídico', subs: [['Salários', 'fixa', 10], ['Encargos (INSS, FGTS)', 'fixa', 10], ['Benefícios', 'fixa', 10], ['Estágio', 'fixa', 0]] },
    { key: 'infra', nome: 'Infraestrutura e escritório', natureza: 'adm', icon: 'building', tone: 'gold', centro: 'Administrativo', subs: [['Aluguel', 'fixa', 11], ['Condomínio', 'fixa', 11], ['Energia elétrica', 'fixa', 11], ['Água', 'fixa', 11], ['Internet e telefonia', 'fixa', 11], ['IPTU', 'fixa', 10], ['Limpeza', 'fixa', 11], ['Materiais de escritório', 'fixa', 9]] },
    { key: 'ti', nome: 'TI e sistemas', natureza: 'adm', icon: 'monitor', tone: 'blue', centro: 'Administrativo', subs: [['Sistema de gestão', 'fixa', 11], ['Pesquisa jurídica', 'fixa', 11], ['Pacote de escritório e e-mail', 'fixa', 11], ['Certificados digitais', 'fixa', 3], ['TI externo', 'fixa', 4], ['Equipamentos', 'nao_dre', 2]] },
    { key: 'marketing', nome: 'Comunicação e marketing', natureza: 'adm', icon: 'globe', tone: 'violet', centro: 'Comercial', subs: [['Site e identidade', 'fixa', 2], ['Eventos e palestras', 'fixa', 3], ['Anúncios pagos', 'fixa', 10], ['Brindes', 'fixa', 1]] },
    { key: 'frota', nome: 'Frota e deslocamentos', natureza: 'adm', icon: 'map-pin', tone: 'amber', centro: 'Comercial', subs: [['Combustível', 'fixa', 6], ['Pedágio e estacionamento', 'fixa', 9], ['Viagens', 'fixa', 2], ['Reembolso de quilometragem', 'fixa', 10]] },
    { key: 'bancario', nome: 'Financeiro / bancário', natureza: 'adm', icon: 'landmark', tone: 'slate', centro: 'Administrativo', subs: [['Tarifas bancárias', 'financeiro', 13], ['Tarifas de cobrança (boletos)', 'financeiro', 10], ['Juros e multas pagos', 'financeiro', 1], ['IOF', 'financeiro', 0]] },
    { key: 'manutencao', nome: 'Manutenção administrativa', natureza: 'adm', icon: 'settings', tone: 'gray', centro: 'Administrativo', subs: [['Manutenção do escritório', 'fixa', 3], ['Reformas', 'fixa', 0], ['Compras diversas', null, 4]] },
    { key: 'impostos', nome: 'Impostos e obrigações', natureza: 'adm', icon: 'percent', tone: 'amber', centro: 'Diretoria', subs: [['ISS sobre serviços', 'deducao', 10], ['PIS', 'deducao', 10], ['Cofins', 'deducao', 10], ['IRPJ', 'ir_csll', 3], ['CSLL', 'ir_csll', 3], ['Taxas e licenças', 'fixa', 2]] },
    { key: 'servicos', nome: 'Serviços terceirizados', natureza: 'adm', icon: 'briefcase', tone: 'slate', centro: 'Administrativo', subs: [['Contabilidade', 'fixa', 10], ['Segurança', 'fixa', 0], ['Limpeza terceirizada', 'fixa', 0], ['Serviços gerais de apoio', 'fixa', 1]] },
    { key: 'relacionamento', nome: 'Relacionamento com cliente', natureza: 'adm', icon: 'message', tone: 'green', centro: 'Comercial', subs: [['Almoços e reuniões', 'fixa', 7], ['Presentes institucionais', 'fixa', 1]] },
    { key: 'treinamento', nome: 'Treinamentos e capacitações', natureza: 'adm', icon: 'book', tone: 'gold', centro: 'Diretoria', subs: [['Cursos e congressos', 'fixa', 4], ['Anuidades (OAB, CRC)', 'fixa', 1], ['Livros e assinaturas técnicas', 'fixa', 2]] },
    { key: 'ajuste', nome: 'Ajuste de caixa', natureza: 'adm', icon: 'refresh', tone: 'gray', centro: 'Administrativo', subs: [['Ajuste de saldo', 'nao_dre', 0]] },

    /* patrimonial: retenções sofridas na fonte = antecipação de tributos (ativo), abatem as guias; não são despesa */
    { key: 'tributos_compensar', nome: 'Tributos retidos a compensar', natureza: 'patrimonial', icon: 'shield', tone: 'slate', centro: 'Diretoria', subs: [['IRRF retido a compensar', 'nao_dre', 31], ['CSLL retida a compensar', 'nao_dre', 31], ['PIS retido a compensar', 'nao_dre', 31], ['Cofins retida a compensar', 'nao_dre', 31], ['ISS retido pelo tomador', 'nao_dre', 6]] }
  ];
  /* Plano de contas (fin_plano_contas): uma linha por subcategoria, com código e tipo DRE */
  F.planoContas = [];
  var prefixo = { receita: '1', direto: '2', adm: '3', patrimonial: '4' }, contador = { receita: 0, direto: 0, adm: 0, patrimonial: 0 };
  F.categorias.forEach(function (c) {
    var ci = ++contador[c.natureza];
    c.subs.forEach(function (s, si) {
      F.planoContas.push({ id: c.key + '-' + si, cod: prefixo[c.natureza] + '.' + pad(ci) + '.' + pad(si + 1), categoria: c.key, catNome: c.nome, sub: s[0], natureza: c.natureza, tipoDre: s[1], centro: c.centro, ativo: !(s[2] === 0 && (s[0] === 'Reformas' || s[0] === 'IOF')), uso: s[2] });
    });
  });
  F.cat = function (key) { for (var i = 0; i < F.categorias.length; i++) if (F.categorias[i].key === key) return F.categorias[i]; return null; };
  F.plano = function (catKey, sub) { for (var i = 0; i < F.planoContas.length; i++) { var p = F.planoContas[i]; if (p.categoria === catKey && p.sub === sub) return p; } return null; };

  /* ---------------- Contas bancárias (fin_contas_bancarias) ---------------- */
  F.contas = [
    { id: 1, banco: 'Banco do Brasil', codigo: '001', agencia: '3412-7', conta: '28.551-0', apelido: 'Conta movimento', tipo: 'Conta corrente', saldo: 186420.55, uso: ['Pagamentos', 'Folha', 'Impostos'], conciliadoAte: '2026-11-08', naoConc: 3, tone: 'amber', hist: [212400, 205100, 198700, 251300, 244800, 186900, 190200, 186420.55] },
    { id: 2, banco: 'Itaú Unibanco', codigo: '341', agencia: '0457', conta: '61203-4', apelido: 'Conta de cobrança', tipo: 'Conta corrente', saldo: 94315.20, uso: ['Boletos', 'PIX de clientes'], cobranca: true, conciliadoAte: '2026-11-09', naoConc: 1, tone: 'blue', hist: [48200, 61500, 72900, 39400, 52700, 64015, 82315, 94315.20] },
    { id: 3, banco: 'Sicoob Campinas', codigo: '756', agencia: '4021', conta: '10.442-9', apelido: 'Reserva · CDB com liquidez diária', tipo: 'Aplicação', saldo: 412870.00, rendimentoMes: 3920.40, uso: ['Reserva de caixa'], conciliadoAte: '2026-10-31', naoConc: 0, tone: 'green', hist: [390100, 393800, 397500, 401300, 405100, 408950, 412870, 412870] },
    { id: 4, banco: 'Caixa do escritório', codigo: '—', agencia: '—', conta: '—', apelido: 'Caixa interno', tipo: 'Caixa', saldo: 1250.00, uso: ['Pequenas despesas'], conciliadoAte: '2026-11-06', naoConc: 0, tone: 'slate', hist: [1500, 1420, 1380, 1500, 1310, 1250, 1250, 1250] }
  ];
  F.conta = function (id) { return find(F.contas, id); };

  /* ---------------- Fornecedores (cadastro do Financeiro; IDs 4001+) ---------------- */
  F.fornecedores = [
    { id: 4001, razao: 'Central de Certidões Campinas Ltda', fantasia: 'Central de Certidões', cnpj: '33.418.207/0001-30', categoria: 'custas', sub: 'Certidões', contato: 'Aline Barros', email: 'pedidos@centralcertidoes.exemplo', telefone: '(19) 3233-4100', prazo: 'À vista', forma: 'pix', pix: '33.418.207/0001-30', status: 'ativo' },
    { id: 4002, razao: 'Bandeirantes Perícia Contábil S/S', fantasia: 'Bandeirantes Perícia', cnpj: '21.774.390/0001-27', categoria: 'pericias', sub: 'Perícia contábil', contato: 'Hélio Matsuda', email: 'helio@bandeirantespericia.exemplo', telefone: '(19) 3294-1180', prazo: '30 dias', forma: 'transferencia', banco: 'Itaú · ag. 0198 · cc 33420-1', status: 'ativo' },
    { id: 4003, razao: 'Fernandes & Lemos Correspondentes Jurídicos Ltda', fantasia: 'Fernandes & Lemos', cnpj: '19.552.803/0001-87', categoria: 'correspondentes', sub: 'Protocolo e despacho', contato: 'Dra. Paula Lemos', email: 'paula@fernandeslemos.exemplo', telefone: '(11) 3105-2290', prazo: '15 dias', forma: 'pix', pix: 'financeiro@fernandeslemos.exemplo', status: 'ativo' },
    { id: 4004, razao: 'Lexdata Pesquisa Jurídica Ltda', fantasia: 'Lexdata', cnpj: '24.661.019/0001-47', categoria: 'ti', sub: 'Pesquisa jurídica', contato: 'Suporte Lexdata', email: 'cobranca@lexdata.exemplo', telefone: '(11) 4003-1180', prazo: 'Mensal', forma: 'boleto', status: 'ativo' },
    { id: 4005, razao: 'Condomínio Edifício Cambuí Corporate', fantasia: 'Cambuí Corporate', cnpj: '12.903.554/0001-88', categoria: 'infra', sub: 'Condomínio', contato: 'Administração do condomínio', email: 'adm@cambuicorporate.exemplo', telefone: '(19) 3252-7700', prazo: 'Mensal (dia 10)', forma: 'boleto', status: 'ativo' },
    { id: 4006, razao: 'Imobiliária Jequitibá Administração de Bens Ltda', fantasia: 'Imobiliária Jequitibá', cnpj: '08.321.645/0001-38', categoria: 'infra', sub: 'Aluguel', contato: 'Rosana Pires', email: 'aluguel@imobjequitiba.exemplo', telefone: '(19) 3236-9020', prazo: 'Mensal (dia 10)', forma: 'boleto', status: 'ativo' },
    { id: 4007, razao: 'Energia Paulista Distribuidora S.A.', fantasia: 'Energia Paulista', cnpj: '15.207.338/0001-96', categoria: 'infra', sub: 'Energia elétrica', contato: 'Central de atendimento', email: 'fatura@energiapaulista.exemplo', telefone: '0800 000 1020', prazo: 'Mensal', forma: 'debito', status: 'ativo' },
    { id: 4008, razao: 'Conecta Fibra Telecom Ltda', fantasia: 'Conecta Fibra', cnpj: '27.884.120/0001-55', categoria: 'infra', sub: 'Internet e telefonia', contato: 'Atendimento empresarial', email: 'empresas@conectafibra.exemplo', telefone: '(19) 3500-0800', prazo: 'Mensal', forma: 'boleto', status: 'ativo' },
    { id: 4009, razao: 'Nuvem Sistemas de Gestão Ltda', fantasia: 'Nuvem Sistemas', cnpj: '31.476.902/0001-22', categoria: 'ti', sub: 'Sistema de gestão', contato: 'Gerente de conta', email: 'financeiro@nuvemsistemas.exemplo', telefone: '(19) 3112-4040', prazo: 'Mensal', forma: 'boleto', status: 'ativo' },
    { id: 4010, razao: 'Escritório Contábil Primavera Ltda', fantasia: 'Contábil Primavera', cnpj: '05.118.773/0001-90', categoria: 'servicos', sub: 'Contabilidade', contato: 'Sônia Primavera', email: 'sonia@contabilprimavera.exemplo', telefone: '(19) 3243-5511', prazo: 'Mensal (dia 10)', forma: 'pix', pix: '05.118.773/0001-90', status: 'ativo' },
    { id: 4011, razao: 'Moura & Lins Assessoria Contábil Ltda', fantasia: 'Moura & Lins', cnpj: '22.590.418/0001-39', categoria: 'comissoes', sub: 'Comissão sobre êxito', contato: 'Carlos Lins', email: 'carlos@mouralins.exemplo', telefone: '(19) 3869-2201', prazo: 'Após o recebimento do cliente', forma: 'pix', pix: 'carlos@mouralins.exemplo', status: 'ativo', obs: 'Parceiro contábil: indica clientes (Valinhos Autopeças, TecnoPack).' },
    { id: 4012, razao: 'Papelaria Central Campinas Ltda', fantasia: 'Papelaria Central', cnpj: '03.774.215/0001-58', categoria: 'infra', sub: 'Materiais de escritório', contato: 'Vendas corporativas', email: 'corporativo@papelariacentral.exemplo', telefone: '(19) 3231-0890', prazo: '14 dias', forma: 'boleto', status: 'ativo' },
    { id: 4013, razao: 'TechSuporte Informática Ltda', fantasia: 'TechSuporte', cnpj: '17.305.662/0001-72', categoria: 'ti', sub: 'Equipamentos', contato: 'Marcos Arantes', email: 'marcos@techsuporte.exemplo', telefone: '(19) 3307-6620', prazo: '30/60/90 dias', forma: 'boleto', status: 'ativo' },
    { id: 4014, razao: 'Justiça Federal da 3ª Região (GRU)', fantasia: 'Justiça Federal · GRU', cnpj: '—', categoria: 'custas', sub: 'Custas judiciais (GRU)', contato: '—', email: '—', telefone: '—', prazo: 'Conforme o prazo processual', forma: 'gru', status: 'ativo', publico: true },
    { id: 4015, razao: 'PagFácil Cobranças Ltda', fantasia: 'PagFácil (integração de cobrança)', cnpj: '29.840.117/0001-65', categoria: 'bancario', sub: 'Tarifas de cobrança (boletos)', contato: 'Suporte técnico', email: 'suporte@pagfacil.exemplo', telefone: '(11) 4020-3300', prazo: 'Débito mensal', forma: 'debito', status: 'ativo' },
    { id: 4016, razao: 'Office Cloud Revenda de Software Ltda', fantasia: 'Office Cloud', cnpj: '26.113.580/0001-17', categoria: 'ti', sub: 'Pacote de escritório e e-mail', contato: 'Atendimento', email: 'faturas@officecloud.exemplo', telefone: '(11) 3003-7788', prazo: 'Débito mensal', forma: 'debito', status: 'ativo' },
    { id: 4017, razao: 'Instituto Campinas de Estudos Fiscais', fantasia: 'ICEF', cnpj: '11.640.233/0001-75', categoria: 'treinamento', sub: 'Cursos e congressos', contato: 'Secretaria de eventos', email: 'eventos@icef.exemplo', telefone: '(19) 3201-4455', prazo: 'Parcelado em 3×', forma: 'boleto', status: 'ativo' },
    { id: 4018, razao: 'Buffet Jequitibá Eventos Ltda', fantasia: 'Buffet Jequitibá', cnpj: '09.871.306/0001-98', categoria: 'marketing', sub: 'Eventos e palestras', contato: 'Renato Siqueira', email: 'renato@buffetjequitiba.exemplo', telefone: '(19) 3254-6060', prazo: '20 dias', forma: 'boleto', status: 'ativo' },
    { id: 4019, razao: 'Auto Posto Rota 330 Ltda', fantasia: 'Posto Rota 330', cnpj: '20.456.991/0001-29', categoria: 'frota', sub: 'Combustível', contato: '—', email: 'nfe@postorota330.exemplo', telefone: '(19) 3271-0330', prazo: 'Cartão corporativo', forma: 'cartao', status: 'ativo' },
    { id: 4020, razao: 'Prefeitura Municipal (ISS e IPTU)', fantasia: 'Prefeitura · tributos municipais', cnpj: '—', categoria: 'impostos', sub: 'ISS sobre serviços', contato: '—', email: '—', telefone: '—', prazo: 'Calendário fiscal', forma: 'gru', status: 'ativo', publico: true },
    { id: 4021, razao: 'Receita Federal do Brasil (DARF)', fantasia: 'Receita Federal · DARF', cnpj: '—', categoria: 'impostos', sub: 'Cofins', contato: '—', email: '—', telefone: '—', prazo: 'Calendário fiscal', forma: 'gru', status: 'ativo', publico: true },
    { id: 4022, razao: 'Gráfica e Copiadora Barão Ltda', fantasia: 'Copiadora Barão', cnpj: '13.902.476/0001-60', categoria: 'custas', sub: 'Diligências e cópias', contato: 'Balcão', email: 'barao@copiadora.exemplo', telefone: '(19) 3289-1212', prazo: 'À vista', forma: 'pix', status: 'inativo' },
    { id: 4023, razao: 'FGTS Digital · Ministério do Trabalho e Emprego (guia GFD)', fantasia: 'FGTS Digital · guia GFD', cnpj: '—', categoria: 'pessoal_adm', sub: 'Encargos (INSS, FGTS)', contato: '—', email: '—', telefone: '—', prazo: 'Dia 20 (antecipa se não for dia útil)', forma: 'gru', status: 'ativo', publico: true, obs: 'Guia emitida no FGTS Digital e paga por PIX. O INSS da folha sai no DARF gerado pela DCTFWeb.' }
  ];
  F.fornecedor =function (id) { return find(F.fornecedores, id); };

  /* ---------------- CONTAS A RECEBER (fin_contas_receber + parcelas) ---------------- */
  /* tipo: fee | exito | avulso | reembolso. Cada parcela: { n, valor, venc, status: aberto|recebido|cancelado,
     recebidoEm, valorRecebido, juros, contaId, boleto: { status: gerado|enviado|cancelado, geradoEm, enviadoEm, para } } */
  F.receber = [];
  var rid = 12001;
  function contrato(id) { return find(D.contratos, id); }
  function boletoPago(venc) { var g = util.iso(util.addDias(venc, -7)); return { status: 'enviado', geradoEm: g, enviadoEm: g }; }

  /* Honorários mensais de set, out e nov/2026 (FIN-01 gera no dia 1º). valor = bruto da NFS-e; valorRecebido = líquido de retenções. */
  ['2026-09', '2026-10', '2026-11'].forEach(function (mes) {
    D.contratos.forEach(function (c) {
      if (c.status !== 'ativo' || c.inicio.slice(0, 7) >= mes) return;
      var venc = mes + '-' + pad(c.diaVencimento), v = vu(venc), L = liq(c.empresaId, c.honorarioMensal, 'fee');
      var p = { n: 1, valor: c.honorarioMensal, venc: venc, contaId: 2 };
      if (mes === '2026-09') Object.assign(p, { status: 'recebido', recebidoEm: v, valorRecebido: L, boleto: boletoPago(venc) });
      else if (mes === '2026-10') {
        if (c.id === 3003) Object.assign(p, { status: 'aberto', boleto: { status: 'enviado', geradoEm: '2026-10-02', enviadoEm: '2026-10-02' }, cobrancas: 2 });
        else if (c.id === 3001) Object.assign(p, { status: 'recebido', recebidoEm: '2026-10-14', valorRecebido: r2(L + 96), juros: 96, boleto: boletoPago(venc) });
        else Object.assign(p, { status: 'recebido', recebidoEm: v, valorRecebido: L, boleto: boletoPago(venc) });
      } else {
        if (c.id === 3002 || c.id === 3006) Object.assign(p, { status: 'recebido', recebidoEm: '2026-11-05', valorRecebido: L, boleto: { status: 'enviado', geradoEm: '2026-11-01', enviadoEm: '2026-11-01' } });
        else if (c.id === 3001 || c.id === 3003 || c.id === 3005) Object.assign(p, { status: 'aberto', boleto: { status: 'enviado', geradoEm: '2026-11-03', enviadoEm: '2026-11-03' } });
        else if (c.id === 3009) Object.assign(p, { status: 'aberto', boleto: { status: 'gerado', geradoEm: '2026-11-03', motivo: 'Aguardando o e-mail do financeiro do cliente' } });
        else Object.assign(p, { status: 'aberto' });
      }
      F.receber.push({ id: rid++, tipo: 'fee', contratoId: c.id, empresaId: c.empresaId, descricao: 'Honorários mensais · ' + mesCurto(mes), competencia: mes, cat: 'honorarios', sub: 'Honorários mensais', centro: 'Comercial', forma: 'boleto', contaId: 2, origem: 'FIN-01', criadoEm: mes + '-01', parcelas: [p] });
    });
  });

  /* ---------------- Compensações: FONTE ÚNICA do crédito recuperado e da base do êxito ---------------- */
  /* Cada PER/DCOMP transmitido fica ligado ao processo do Jurídico que está na etapa "Compensação (PER/DCOMP)"
     (judicial ou administrativo). situacao: realizada (conta no recuperado) | prevista (não conta).
     tituloId: título de êxito que cobrou a compensação (null = faturado antes de set/2026, já recebido).
     As compensações anteriores às listadas entram numa linha "consolidada" por processo, calculada para fechar
     com o recuperado do processo no Jurídico (App.data.juridico). Assim Jurídico, CRM e Financeiro mostram o mesmo número. */
  F.compensacoes = [
    /* Serra Azul (contrato 3002 · 15%): processo 2002 (cumprimento de sentença) e 2009 (PER/DCOMP na DRF) */
    { id: 1, contratoId: 3002, processoId: 2002, competencia: '2026-05', perdcomp: '11920.40381.150526.1.3.04-0108', tributo: 'PIS/Cofins', valor: 450000, tituloId: null },
    { id: 2, contratoId: 3002, processoId: 2002, competencia: '2026-06', perdcomp: '11920.40381.150626.1.3.04-0163', tributo: 'PIS/Cofins', valor: 500000, tituloId: null },
    { id: 3, contratoId: 3002, processoId: 2002, competencia: '2026-07', perdcomp: '11920.40381.150726.1.3.04-0221', tributo: 'PIS/Cofins', valor: 520000, tituloId: null },
    { id: 4, contratoId: 3002, processoId: 2002, competencia: '2026-08', perdcomp: '11920.40381.140826.1.3.04-0012', tributo: 'PIS/Cofins', valor: 470000, tituloId: null },
    { id: 5, contratoId: 3002, processoId: 2009, competencia: '2026-08', perdcomp: '11920.40381.140826.1.3.04-0019', tributo: 'PIS/Cofins', valor: 70000, tituloId: null },
    { id: 6, contratoId: 3002, processoId: 2009, competencia: '2026-09', perdcomp: '11920.40381.150926.1.3.04-0457', tributo: 'PIS/Cofins', valor: 540000, tituloId: 12102 },
    { id: 7, contratoId: 3002, processoId: 2009, competencia: '2026-10', perdcomp: '11920.40381.161026.1.3.04-1176', tributo: 'PIS/Cofins', valor: 570000, tituloId: 12106 },
    /* Cosmópolis Bioenergia (contrato 3006 · 12%): processo 4104, uma PER/DCOMP por mês desde jan/2025.
       Jan a jun/2026 foram cobrados num acordo em 6 parcelas (#12103); de jul em diante, um título por mês. */
    { id: 8, contratoId: 3006, processoId: 4104, competencia: '2026-01', perdcomp: '30418.55210.150126.1.3.04-5120', tributo: 'PIS/Cofins', valor: 230000, tituloId: 12103 },
    { id: 9, contratoId: 3006, processoId: 4104, competencia: '2026-02', perdcomp: '30418.55210.160226.1.3.04-5187', tributo: 'PIS/Cofins', valor: 240000, tituloId: 12103 },
    { id: 10, contratoId: 3006, processoId: 4104, competencia: '2026-03', perdcomp: '30418.55210.160326.1.3.04-5243', tributo: 'PIS/Cofins', valor: 245000, tituloId: 12103 },
    { id: 11, contratoId: 3006, processoId: 4104, competencia: '2026-04', perdcomp: '30418.55210.150426.1.3.04-5302', tributo: 'PIS/Cofins', valor: 250000, tituloId: 12103 },
    { id: 12, contratoId: 3006, processoId: 4104, competencia: '2026-05', perdcomp: '30418.55210.150526.1.3.04-5369', tributo: 'PIS/Cofins', valor: 245000, tituloId: 12103 },
    { id: 13, contratoId: 3006, processoId: 4104, competencia: '2026-06', perdcomp: '30418.55210.150626.1.3.04-5418', tributo: 'PIS/Cofins', valor: 250000, tituloId: 12103 },
    { id: 14, contratoId: 3006, processoId: 4104, competencia: '2026-07', perdcomp: '30418.55210.150726.1.3.04-6533', tributo: 'PIS/Cofins', valor: 340000, tituloId: null },
    { id: 15, contratoId: 3006, processoId: 4104, competencia: '2026-08', perdcomp: '30418.55210.150826.1.3.04-6604', tributo: 'PIS/Cofins', valor: 362000, tituloId: null },
    { id: 16, contratoId: 3006, processoId: 4104, competencia: '2026-09', perdcomp: '30418.55210.150926.1.3.04-7712', tributo: 'PIS/Cofins', valor: 385000, tituloId: 12101 },
    { id: 17, contratoId: 3006, processoId: 4104, competencia: '2026-10', perdcomp: '30418.55210.161026.1.3.04-8023', tributo: 'PIS/Cofins', valor: 410000, tituloId: 12105 },
    /* Valinhos Autopeças (contrato 3003 · 20%): PER/DCOMP administrativo do monofásico (processo 4106) */
    { id: 18, contratoId: 3003, processoId: 4106, competencia: '2026-08', perdcomp: '40227.10935.310826.1.3.04-5590', tributo: 'PIS/Cofins', valor: 38000, tituloId: 12107 },
    /* Americana Fios (contrato 3004 · 18%): trânsito em 23/10/2026; a habilitação na Receita está em preparo (prazo 5004 e perícia #13002).
       Nada compensado ainda: as primeiras compensações estão previstas para 2027 e não contam como recuperado. */
    { id: 19, contratoId: 3004, processoId: 2004, competencia: '2027-01', perdcomp: null, tributo: 'PIS/Cofins', valor: 480000, tituloId: null, situacao: 'prevista', obs: 'Depende do deferimento da habilitação na Receita' },
    { id: 20, contratoId: 3004, processoId: 2004, competencia: '2027-02', perdcomp: null, tributo: 'PIS/Cofins', valor: 480000, tituloId: null, situacao: 'prevista', obs: 'Estimativa pelo débito mensal de PIS/Cofins do cliente' }
  ];
  F.compensacoes.forEach(function (x) { if (!x.situacao) x.situacao = 'realizada'; });
  /* linha consolidada por processo: recuperado no Jurídico − compensações listadas acima */
  (function consolidar() {
    var J = D.juridico || {}, procs = J.todosProcessos ? J.todosProcessos() : [];
    var MES = function (m, d) { var dt = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + d, 1); return dt.getFullYear() + '-' + pad(dt.getMonth() + 1); };
    procs.forEach(function (p) {
      var R = J.recuperadoProcesso ? J.recuperadoProcesso(p) : (p.etapa === 'compensacao' ? p.recuperado || 0 : 0); if (!R) return;
      var ct = D.contratos.filter(function (c) { return c.empresaId === p.empresaId; })[0]; if (!ct) return;
      var lst = F.compensacoes.filter(function (x) { return x.processoId === p.id && x.situacao === 'realizada'; });
      var resto = R - lst.reduce(function (a, x) { return a + x.valor; }, 0);
      if (resto < -0.5) { console.warn('[financeiro] compensações do processo ' + p.numero + ' passam do recuperado no Jurídico'); return; }
      if (resto < 0.5) return;
      var prim = lst.map(function (x) { return x.competencia; }).sort()[0] || '2026-09', ate = MES(prim, -1);
      F.compensacoes.push({ id: 100 + p.id % 1000, contratoId: ct.id, processoId: p.id, competencia: ate, rotulo: 'até ' + mesCurto(ate), perdcomp: 'Compensações anteriores (consolidado)', tributo: 'PIS/Cofins', valor: resto, tituloId: null, situacao: 'realizada', consolidado: true });
    });
    F.compensacoes.sort(function (a, b) { return a.contratoId - b.contratoId || a.competencia.localeCompare(b.competencia) || a.id - b.id; });
  })();
  var realizadas = function (fn) { return F.compensacoes.filter(function (x) { return x.situacao === 'realizada' && fn(x); }); };
  var somaV = function (l) { return l.reduce(function (a, x) { return a + x.valor; }, 0); };
  F.creditoRecuperado = function (contratoId) { return somaV(realizadas(function (x) { return String(x.contratoId) === String(contratoId); })); };
  F.recuperadoProcesso = function (processoId) { return somaV(realizadas(function (x) { return String(x.processoId) === String(processoId); })); };
  F.compensacoesDo = function (contratoId) { return F.compensacoes.filter(function (x) { return String(x.contratoId) === String(contratoId); }); };
  F.compLabel = function (x) { return x.rotulo || mesCurto(x.competencia); };
  /* Grava o recuperado nos contratos compartilhados: CRM, Jurídico e Financeiro leem o mesmo número. */
  D.contratos.forEach(function (c) { c.creditoRecuperado = F.creditoRecuperado(c.id); });

  /* ---------------- Dados do contrato de honorários (vigência, reajuste, êxito, parceiro) ---------------- */
  /* Complementa App.data.contratos (valores) com o que o Financeiro administra. exitoBase: compensado | habilitado. */
  F.contratoInfo = {
    3001: { numero: 'ATL-2025-011', fim: '2027-08-11', indice: 'IPCA', mesReajuste: 8, ultimoReajuste: '2026-08-12', reajustePct: 4.6, exitoBase: 'compensado', parcelamentoMax: 4 },
    3002: { numero: 'ATL-2025-004', fim: '2027-03-03', indice: 'IGP-M', mesReajuste: 3, ultimoReajuste: '2026-03-04', reajustePct: 3.9, exitoBase: 'compensado', parcelamentoMax: 1 },
    3003: { numero: 'ATL-2026-003', fim: '2028-02-18', indice: 'IPCA', mesReajuste: 2, ultimoReajuste: null, exitoBase: 'compensado', parcelamentoMax: 4, parceiroId: 4011, comissaoMensal: 10, comissaoExito: 0, comissaoPrazo: '12 meses' },
    3004: { numero: 'ATL-2025-016', fim: '2027-11-02', indice: 'IPCA', mesReajuste: 11, ultimoReajuste: null, reajustePendente: true, exitoBase: 'habilitado', parcelamentoMax: 6 },
    3005: { numero: 'ATL-2026-008', fim: '2028-05-26', indice: 'IPCA', mesReajuste: 5, ultimoReajuste: null, exitoBase: 'compensado', parcelamentoMax: 4, parceiroId: 4011, comissaoMensal: 5, comissaoExito: 0, comissaoPrazo: '12 meses' },
    3006: { numero: 'ATL-2024-019', fim: '2026-12-31', indice: 'IGP-M', mesReajuste: 10, ultimoReajuste: '2026-10-14', reajustePct: 3.2, exitoBase: 'compensado', parcelamentoMax: 4 },
    3007: { numero: 'ATL-2026-012', fim: '2028-07-07', indice: 'IPCA', mesReajuste: 7, ultimoReajuste: null, exitoBase: 'compensado', parcelamentoMax: 4 },
    3008: { numero: 'ATL-2026-015', fim: '2028-09-14', indice: 'IPCA', mesReajuste: 9, ultimoReajuste: null, exitoBase: 'compensado', parcelamentoMax: 4 },
    3009: { numero: 'ATL-2026-018', fim: '2028-10-20', indice: 'IPCA', mesReajuste: 10, ultimoReajuste: null, exitoBase: 'compensado', parcelamentoMax: 4 }
  };

  /* Honorários de êxito: % do contrato sobre as compensações ligadas ao título (base = soma das compensações) */
  function exito(id, contratoId, desc, comp, parcelas, extra) {
    var c = contrato(contratoId), base = somaV(F.compensacoes.filter(function (x) { return x.tituloId === id; }));
    var tot = r2(base * c.exitoPct / 100), n = parcelas.length, cada = r2(tot / n);
    parcelas.forEach(function (p, i) {
      p.n = i + 1; p.valor = i < n - 1 ? cada : r2(tot - cada * (n - 1));
      if (p.status === 'recebido') { p.valorRecebido = liq(c.empresaId, p.valor, 'exito'); p.contaId = 2; }
    });
    F.receber.push(Object.assign({ id: id, tipo: 'exito', contratoId: contratoId, empresaId: c.empresaId, descricao: desc, competencia: comp, base: base, exitoPct: c.exitoPct, cat: 'honorarios', sub: 'Honorários de êxito', centro: 'Comercial', forma: 'boleto', contaId: 2, origem: 'Compensação', criadoEm: comp + '-28', parcelas: parcelas }, extra || {}));
  }
  exito(12101, 3006, 'Êxito sobre compensação de set/2026', '2026-09', [{ venc: '2026-10-13', status: 'recebido', recebidoEm: '2026-10-13', boleto: { status: 'enviado', geradoEm: '2026-10-06', enviadoEm: '2026-10-06' } }], { perdcomp: '30418.55210.150926.1.3.04-7712', processoId: 4104 });
  exito(12102, 3002, 'Êxito sobre compensação de set/2026', '2026-09', [{ venc: '2026-10-13', status: 'recebido', recebidoEm: '2026-10-14', boleto: { status: 'enviado', geradoEm: '2026-10-06', enviadoEm: '2026-10-06' } }], { perdcomp: '11920.40381.150926.1.3.04-0457', processoId: 2009 });
  exito(12103, 3006, 'Êxito sobre as compensações de jan a jun/2026 · acordo em 6 parcelas', '2026-07', [
    { venc: '2026-08-15', status: 'recebido', recebidoEm: '2026-08-17', boleto: { status: 'enviado', geradoEm: '2026-08-06', enviadoEm: '2026-08-06' } },
    { venc: '2026-09-15', status: 'recebido', recebidoEm: '2026-09-15', boleto: { status: 'enviado', geradoEm: '2026-09-04', enviadoEm: '2026-09-04' } },
    { venc: '2026-10-15', status: 'recebido', recebidoEm: '2026-10-15', boleto: { status: 'enviado', geradoEm: '2026-10-06', enviadoEm: '2026-10-06' } },
    { venc: '2026-11-15', status: 'aberto' }, { venc: '2026-12-15', status: 'aberto' }, { venc: '2027-01-15', status: 'aberto' }
  ], { processoId: 4104, criadoEm: '2026-07-28', perdcomp: '6 PER/DCOMP (jan a jun/2026)', acordo: 'Termo de acordo de 28/07/2026: 12% sobre R$ 1.460.000,00 compensados de jan a jun/2026 no processo ' + numProc(4104) + ', em 6 parcelas mensais iguais. De jul/2026 em diante o êxito é cobrado mês a mês.' });
  exito(12105, 3006, 'Êxito sobre compensação de out/2026', '2026-10', [{ venc: '2026-11-10', status: 'aberto', boleto: { status: 'enviado', geradoEm: '2026-11-04', enviadoEm: '2026-11-04' } }], { perdcomp: '30418.55210.161026.1.3.04-8023', processoId: 4104 });
  exito(12106, 3002, 'Êxito sobre compensação de out/2026', '2026-10', [{ venc: '2026-11-16', status: 'aberto', boleto: { status: 'gerado', geradoEm: '2026-11-06' } }], { perdcomp: '11920.40381.161026.1.3.04-1176', processoId: 2009 });
  exito(12107, 3003, 'Êxito sobre compensação de ago/2026', '2026-08', [{ venc: '2026-09-21', status: 'recebido', recebidoEm: '2026-09-21', boleto: { status: 'enviado', geradoEm: '2026-09-14', enviadoEm: '2026-09-14' } }], { perdcomp: '40227.10935.310826.1.3.04-5590', processoId: 4106 });

  /* Avulso e reembolso */
  F.receber.push({ id: 12201, tipo: 'avulso', contratoId: null, empresaId: 4, descricao: 'Parecer sobre subvenções de ICMS (avulso)', competencia: '2026-11', cat: 'honorarios', sub: 'Pareceres e consultorias avulsas', centro: 'Diretoria', forma: 'pix', contaId: 2, origem: 'Manual', criadoEm: '2026-10-28', parcelas: [{ n: 1, valor: 12000, venc: '2026-11-03', status: 'recebido', recebidoEm: '2026-11-03', valorRecebido: liq(4, 12000, 'avulso'), contaId: 2 }] });
  F.receber.push({ id: 12301, tipo: 'reembolso', contratoId: 3003, empresaId: 7, descricao: 'Reembolso de honorários periciais (adiantamento) · processo ' + numProc(2003), competencia: '2026-11', cat: 'reembolsos', sub: 'Reembolso de custas e perícias', centro: 'Jurídico', forma: 'boleto', contaId: 2, origem: 'Contas a pagar #13008', processoId: 2003, criadoEm: '2026-11-05', parcelas: [{ n: 1, valor: 3500, venc: '2026-11-23', status: 'aberto' }] });
  F.receberConta = function (id) { return find(F.receber, id); };

  /* ---------------- CONTAS A PAGAR (diretas) e CUSTOS ADMINISTRATIVOS ---------------- */
  /* tipo: direto (ligado a cliente/processo) | adm (indireto). parcelas: { n, valor, venc, status: aberto|pago|cancelado, pagoEm, contaId } */
  F.pagar = [];
  function P(o) { F.pagar.push(Object.assign({ origem: 'Manual', centro: (F.cat(o.cat) || {}).centro }, o)); }
  /* — diretas — */
  P({ id: 13001, tipo: 'direto', fornecedorId: 4014, descricao: 'Custas de apelação (GRU) · embargos à execução fiscal', cat: 'custas', sub: 'Custas judiciais (GRU)', empresaId: 9, processoId: 2010, reembolsavel: true, forma: 'gru', contaId: 1, competencia: '2026-11', parcelas: [{ n: 1, valor: 1284.50, venc: '2026-11-19', status: 'aberto' }], obs: 'Pagar antes do prazo interno da apelação (D-1).' });
  P({ id: 13002, tipo: 'direto', fornecedorId: 4002, descricao: 'Perícia contábil: cálculo para habilitação do crédito', cat: 'pericias', sub: 'Perícia contábil', centro: 'Cálculo', empresaId: 9, processoId: 2004, reembolsavel: false, forma: 'transferencia', contaId: 1, competencia: '2026-10', parcelas: [{ n: 1, valor: 4800, venc: '2026-10-30', status: 'pago', pagoEm: '2026-10-30', contaId: 1 }, { n: 2, valor: 4800, venc: '2026-11-30', status: 'aberto' }] });
  P({ id: 13003, tipo: 'direto', fornecedorId: 4003, descricao: 'Correspondente em São Paulo: protocolo e despacho no TRF3', cat: 'correspondentes', sub: 'Protocolo e despacho', empresaId: 1, processoId: 2001, reembolsavel: false, forma: 'pix', contaId: 1, competencia: '2026-11', parcelas: [{ n: 1, valor: 850, venc: '2026-11-13', status: 'aberto' }] });
  P({ id: 13004, tipo: 'direto', fornecedorId: 4001, descricao: 'Certidões negativas (federal, estadual e FGTS) para a habilitação', cat: 'custas', sub: 'Certidões', empresaId: 9, processoId: 2004, reembolsavel: false, forma: 'pix', contaId: 1, competencia: '2026-11', parcelas: [{ n: 1, valor: 186.40, venc: '2026-11-04', status: 'pago', pagoEm: '2026-11-04', contaId: 1 }] });
  /* comissões do parceiro contábil (Moura & Lins): 10% do êxito da Valinhos e 5% do honorário mensal da TecnoPack */
  P({ id: 13005, tipo: 'direto', fornecedorId: 4011, descricao: 'Comissão do parceiro contábil (10% do êxito recebido)', cat: 'comissoes', sub: 'Comissão sobre êxito', empresaId: 7, processoId: 4106, reembolsavel: false, forma: 'pix', contaId: 1, competencia: '2026-09', parcelas: [{ n: 1, valor: 1070, venc: '2026-09-10', status: 'pago', pagoEm: '2026-09-10', contaId: 1 }, { n: 2, valor: 1070, venc: '2026-10-10', status: 'pago', pagoEm: '2026-10-09', contaId: 1 }, { n: 3, valor: 1070, venc: '2026-11-10', status: 'aberto' }, { n: 4, valor: 1070, venc: '2026-12-10', status: 'aberto' }], obs: '10% sobre R$ 42.800,00 de êxito (20% de R$ 214.000,00 compensados), em 4 parcelas.' });
  var com = []; for (var k = 0; k < 12; k++) { var dt = util.iso(new Date(2026, 5 + k, 10)); com.push(k < 5 ? { n: k + 1, valor: 260, venc: dt, status: 'pago', pagoEm: vu(dt), contaId: 1 } : { n: k + 1, valor: 260, venc: dt, status: 'aberto' }); }
  P({ id: 13006, tipo: 'direto', fornecedorId: 4011, descricao: 'Comissão do parceiro contábil (5% do honorário mensal por 12 meses)', cat: 'comissoes', sub: 'Comissão sobre honorário mensal', empresaId: 14, reembolsavel: false, forma: 'pix', contaId: 1, competencia: '2026-06', parcelas: com });
  P({ id: 13007, tipo: 'direto', fornecedorId: 4014, descricao: 'Custas iniciais (GRU) · mandado de segurança', cat: 'custas', sub: 'Custas judiciais (GRU)', empresaId: 24, processoId: 2008, reembolsavel: true, reembolsoId: null, forma: 'gru', contaId: 1, competencia: '2026-10', parcelas: [{ n: 1, valor: 957.69, venc: '2026-10-06', status: 'pago', pagoEm: '2026-10-05', contaId: 1 }] });
  P({ id: 13008, tipo: 'direto', fornecedorId: 4002, descricao: 'Honorários periciais (adiantamento determinado pelo juízo)', cat: 'pericias', sub: 'Perícia contábil', empresaId: 7, processoId: 2003, reembolsavel: true, reembolsoId: 12301, forma: 'gru', contaId: 1, competencia: '2026-11', parcelas: [{ n: 1, valor: 3500, venc: '2026-11-05', status: 'aberto' }], obs: 'Depósito judicial dos honorários do perito. Reembolso já lançado no contas a receber.' });

  /* — custos administrativos — */
  var aluguel = []; for (var m = 0; m < 12; m++) { var d10 = util.iso(new Date(2026, m, 10)); aluguel.push(m < 10 ? { n: m + 1, valor: 14500, venc: d10, status: 'pago', pagoEm: util.iso(util.diaUtilAnterior(util.addDias(d10, 1))), contaId: 1 } : { n: m + 1, valor: 14500, venc: d10, status: 'aberto' }); }
  P({ id: 13101, tipo: 'adm', fornecedorId: 4006, descricao: 'Aluguel do escritório · contrato 2026', cat: 'infra', sub: 'Aluguel', forma: 'boleto', contaId: 1, competencia: '2026-01', recorrente: true, parcelas: aluguel });
  var aid = 13102;
  /* custos mensais recorrentes: [fornecedor, descrição, cat, sub, forma, valorOut, vencOut, valorNov, vencNov, pagoNov(data|null), centro, recebedor] */
  [
    [4005, 'Condomínio', 'infra', 'Condomínio', 'boleto', 3820, '2026-10-10', 3820, '2026-11-10', null],
    [4007, 'Energia elétrica', 'infra', 'Energia elétrica', 'debito', 2012.77, '2026-10-16', 1946.32, '2026-11-18', null],
    [4008, 'Internet dedicada e telefonia', 'infra', 'Internet e telefonia', 'boleto', 689.90, '2026-10-15', 689.90, '2026-11-16', null],
    [null, 'Salários da equipe administrativa', 'pessoal_adm', 'Salários', 'transferencia', 12600, '2026-10-05', 12600, '2026-11-05', '2026-11-05', 'Administrativo', 'Folha de pagamento (2 colaboradores)'],
    [null, 'Salários da equipe técnica (jurídico e cálculo)', 'pessoal_tec', 'Salários', 'transferencia', 42800, '2026-10-05', 42800, '2026-11-05', '2026-11-05', 'Jurídico', 'Folha de pagamento (6 colaboradores)'],
    [4021, 'INSS da folha (DARF da DCTFWeb)', 'pessoal_adm', 'Encargos (INSS, FGTS)', 'gru', 13170, '2026-10-20', 13170, '2026-11-19', null],
    [null, 'Benefícios (vale-refeição e plano de saúde)', 'pessoal_adm', 'Benefícios', 'transferencia', 10200, '2026-10-01', 10200, '2026-11-03', '2026-11-03', 'Administrativo', 'Operadoras de benefícios'],
    [null, 'Pró-labore dos sócios', 'pessoal_adm', 'Pró-labore', 'transferencia', 24000, '2026-10-05', 24000, '2026-11-05', '2026-11-05', 'Diretoria', 'Sócios (2)'],
    [4009, 'Mensalidade do sistema de gestão', 'ti', 'Sistema de gestão', 'boleto', 2490, '2026-10-15', 2490, '2026-11-16', null],
    [4004, 'Assinatura de pesquisa de jurisprudência', 'ti', 'Pesquisa jurídica', 'boleto', 459, '2026-10-13', 459, '2026-11-12', null],
    [4016, 'Pacote de escritório e e-mail (11 licenças)', 'ti', 'Pacote de escritório e e-mail', 'debito', 1180, '2026-10-06', 1180, '2026-11-06', '2026-11-06'],
    [4010, 'Honorários contábeis da Atlas', 'servicos', 'Contabilidade', 'pix', 3200, '2026-10-09', 3200, '2026-11-10', null],
    [4015, 'Tarifas da integração de cobrança (boletos e PIX)', 'bancario', 'Tarifas de cobrança (boletos)', 'debito', 81.20, '2026-10-05', 87, '2026-11-05', '2026-11-05'],
    [null, 'Pacote de serviços bancários', 'bancario', 'Tarifas bancárias', 'debito', 129.90, '2026-10-02', 129.90, '2026-11-03', '2026-11-03', 'Administrativo', 'Banco do Brasil'],
    [null, 'Reembolso de quilometragem dos consultores', 'frota', 'Reembolso de quilometragem', 'transferencia', 2050, '2026-10-09', 2140, '2026-11-10', null, 'Comercial', 'Consultores comerciais (3)'],
    [4020, 'ISS próprio (descontado o ISS retido pelos tomadores)', 'impostos', 'ISS sobre serviços', 'gru', 5544, '2026-10-09', 5259, '2026-11-10', null],
    [4023, 'FGTS da folha (guia do FGTS Digital)', 'pessoal_adm', 'Encargos (INSS, FGTS)', 'gru', 4430, '2026-10-20', 4430, '2026-11-19', null]
  ].forEach(function (r) {
    var base = { tipo: 'adm', fornecedorId: r[0], descricao: r[1], cat: r[2], sub: r[3], forma: r[4], contaId: 1, recorrente: true };
    if (r[10]) base.centro = r[10];
    if (r[11]) base.recebedor = r[11];
    P(Object.assign({ id: aid++, competencia: '2026-10', parcelas: [{ n: 1, valor: r[5], venc: r[6], status: 'pago', pagoEm: r[6], contaId: 1 }] }, base, { descricao: r[1] + ' · out/2026' }));
    P(Object.assign({ id: aid++, competencia: '2026-11', parcelas: [{ n: 1, valor: r[7], venc: r[8], status: r[9] ? 'pago' : 'aberto', pagoEm: r[9] || undefined, contaId: r[9] ? 1 : undefined }] }, base, { descricao: r[1] + ' · nov/2026' }));
  });
  /* Guias federais já líquidas das retenções sofridas (os valores são recalculados no fim do arquivo, a partir do DRE e dos títulos) */
  P({ id: 13201, tipo: 'adm', fornecedorId: 4021, descricao: 'PIS sobre faturamento · out/2026 (saldo após retenções)', cat: 'impostos', sub: 'PIS', forma: 'gru', contaId: 1, competencia: '2026-10', parcelas: [{ n: 1, valor: 0, venc: '2026-11-25', status: 'aberto' }] });
  P({ id: 13202, tipo: 'adm', fornecedorId: 4021, descricao: 'Cofins sobre faturamento · out/2026 (saldo após retenções)', cat: 'impostos', sub: 'Cofins', forma: 'gru', contaId: 1, competencia: '2026-10', parcelas: [{ n: 1, valor: 0, venc: '2026-11-25', status: 'aberto' }] });
  P({ id: 13203, tipo: 'adm', fornecedorId: 4021, descricao: 'IRPJ · 3º trimestre de 2026 (lucro presumido, já abatido o IRRF retido)', cat: 'impostos', sub: 'IRPJ', forma: 'gru', contaId: 1, competencia: '2026-09', parcelas: [{ n: 1, valor: 0, venc: '2026-10-30', status: 'pago', pagoEm: '2026-10-30', contaId: 1 }] });
  P({ id: 13204, tipo: 'adm', fornecedorId: 4021, descricao: 'CSLL · 3º trimestre de 2026 (lucro presumido, já abatida a CSLL retida)', cat: 'impostos', sub: 'CSLL', forma: 'gru', contaId: 1, competencia: '2026-09', parcelas: [{ n: 1, valor: 0, venc: '2026-10-30', status: 'pago', pagoEm: '2026-10-30', contaId: 1 }] });
  P({ id: 13205, tipo: 'adm', fornecedorId: 4020, descricao: 'IPTU 2026 do escritório', cat: 'infra', sub: 'IPTU', forma: 'gru', contaId: 1, competencia: '2026-02', parcelas: (function () { var a = []; for (var i = 0; i < 10; i++) { var dv = util.iso(new Date(2026, 1 + i, 16)); a.push(i < 9 ? { n: i + 1, valor: 1120, venc: dv, status: 'pago', pagoEm: vu(dv), contaId: 1 } : { n: i + 1, valor: 1120, venc: dv, status: 'aberto' }); } return a; })() });
  P({ id: 13206, tipo: 'adm', fornecedorId: 4017, descricao: 'Congresso de Direito Tributário (2 inscrições)', cat: 'treinamento', sub: 'Cursos e congressos', centro: 'Jurídico', forma: 'boleto', contaId: 1, competencia: '2026-09', parcelas: [{ n: 1, valor: 1320, venc: '2026-09-21', status: 'pago', pagoEm: '2026-09-21', contaId: 1 }, { n: 2, valor: 1320, venc: '2026-10-20', status: 'pago', pagoEm: '2026-10-20', contaId: 1 }, { n: 3, valor: 1320, venc: '2026-11-23', status: 'aberto' }] });
  P({ id: 13207, tipo: 'adm', fornecedorId: 4018, descricao: 'Café empresarial com 60 convidados (Associação Comercial)', cat: 'marketing', sub: 'Eventos e palestras', forma: 'boleto', contaId: 1, competencia: '2026-11', origem: 'Importação de NF', notaId: 15004, parcelas: [{ n: 1, valor: 4800, venc: '2026-11-25', status: 'aberto' }] });
  P({ id: 13208, tipo: 'adm', fornecedorId: 4012, descricao: 'Materiais de escritório (NF-e 18.442)', cat: 'infra', sub: 'Materiais de escritório', forma: 'boleto', contaId: 1, competencia: '2026-11', origem: 'Importação de NF', notaId: 15001, parcelas: [{ n: 1, valor: 642.18, venc: '2026-11-17', status: 'aberto' }] });
  F.pagarConta = function (id) { return find(F.pagar, id); };

  /* ---------------- Notas fiscais de fornecedor (XML) com sugestão de categoria ---------------- */
  /* status: sugestao (aguardando aceite) | aceita | vinculada (já virou conta a pagar). Item: sugestão cat/sub + confiança + motivo */
  F.notasEntrada = [
    { id: 15001, fornecedorId: 4012, modelo: 'NF-e', numero: '18.442', serie: '1', emissao: '2026-11-03', importadaEm: '2026-11-03T15:20', valor: 642.18, chave: '3526 1103 7742 1500 0186 5500 1000 0184 4210 0094 2186', status: 'vinculada', contaPagarId: 13208, por: 10,
      duplicatas: [{ n: 1, venc: '2026-11-17', valor: 642.18 }],
      itens: [
        { desc: 'Papel sulfite A4 75 g · caixa com 10 resmas', ncm: '4802.56.10', qtd: 1, valor: 289.90, cat: 'infra', sub: 'Materiais de escritório', conf: 'alta', motivo: 'Palavra-chave "papel A4" e NCM 4802 (papel)', aceito: true },
        { desc: 'Toner compatível para impressora laser', ncm: '8443.99.33', qtd: 1, valor: 186.00, cat: 'infra', sub: 'Materiais de escritório', conf: 'alta', motivo: 'Palavra-chave "toner"; 6 lançamentos anteriores iguais', aceito: true },
        { desc: 'Pasta suspensa kraft · pacote com 50', ncm: '4820.30.00', qtd: 1, valor: 74.38, cat: 'infra', sub: 'Materiais de escritório', conf: 'alta', motivo: 'Histórico do fornecedor: 100% em Materiais de escritório', aceito: true },
        { desc: 'Café torrado em grãos 1 kg', ncm: '0901.21.00', qtd: 2, valor: 91.90, cat: 'manutencao', sub: 'Compras diversas', conf: 'media', motivo: 'Sem regra para o item; usado o padrão "Compras diversas"', aceito: true }
      ] },
    { id: 15002, fornecedorId: 4013, modelo: 'NF-e', numero: '7.715', serie: '2', emissao: '2026-11-06', importadaEm: '2026-11-06T10:42', valor: 9418.00, chave: '3526 1117 3056 6200 0140 5500 2000 0077 1510 0571 5402', status: 'sugestao', por: 10,
      duplicatas: [{ n: 1, venc: '2026-12-07', valor: 3139.33 }, { n: 2, venc: '2027-01-05', valor: 3139.33 }, { n: 3, venc: '2027-02-04', valor: 3139.34 }],
      itens: [
        { desc: 'Notebook 14" Core i7, 16 GB, SSD 512 GB', ncm: '8471.30.12', qtd: 2, valor: 7980.00, cat: 'ti', sub: 'Equipamentos', conf: 'alta', motivo: 'NCM 8471.30 = equipamento de informática (imobilizado, fora do DRE)' },
        { desc: 'Mouse sem fio com receptor USB', ncm: '8471.60.53', qtd: 2, valor: 159.80, cat: 'infra', sub: 'Materiais de escritório', conf: 'media', motivo: 'Valor unitário baixo; poderia ser Equipamentos' },
        { desc: 'Licença de antivírus corporativo · 12 meses · 11 estações', ncm: '—', qtd: 1, valor: 1078.20, cat: 'ti', sub: 'Pacote de escritório e e-mail', conf: 'baixa', motivo: 'Software sem histórico; confirme a subcategoria' },
        { desc: 'Instalação e configuração dos equipamentos', ncm: '—', qtd: 1, valor: 200.00, cat: 'ti', sub: 'TI externo', conf: 'alta', motivo: 'CFOP 5.933 (prestação de serviço) e fornecedor de TI' }
      ] },
    { id: 15003, fornecedorId: 4019, modelo: 'NFC-e', numero: '51.203', serie: '1', emissao: '2026-11-07', importadaEm: '2026-11-08T08:05', valor: 412.60, chave: '3526 1120 4569 9100 0136 6500 1000 0512 0310 0812 6019', status: 'sugestao', por: 10,
      duplicatas: [{ n: 1, venc: '2026-11-07', valor: 412.60, pago: true }],
      itens: [
        { desc: 'Gasolina comum · 68,2 litros', ncm: '2710.12.59', qtd: 1, valor: 412.60, cat: 'frota', sub: 'Combustível', conf: 'alta', motivo: 'NCM 2710 (combustível) e fornecedor posto' }
      ] },
    { id: 15004, fornecedorId: 4018, modelo: 'NFS-e', numero: '2.318', serie: 'A', emissao: '2026-11-05', importadaEm: '2026-11-05T17:10', valor: 4800.00, chave: 'NFS-e nacional · código de verificação 7K2P-QX81', status: 'vinculada', contaPagarId: 13207, por: 10,
      duplicatas: [{ n: 1, venc: '2026-11-25', valor: 4800 }],
      itens: [
        { desc: 'Serviço de buffet: café da manhã empresarial para 60 pessoas', ncm: '—', qtd: 1, valor: 4800.00, cat: 'marketing', sub: 'Eventos e palestras', conf: 'alta', motivo: 'Fornecedor cadastrado com padrão Eventos e palestras', aceito: true }
      ] }
  ];
  F.nota = function (id) { return find(F.notasEntrada, id); };

  /* ---------------- Integração de cobrança (genérica) ---------------- */
  F.cobrancaConfig = { provedor: 'Integração de cobrança', parceiro: 'PagFácil Cobranças (exemplo)', ambiente: 'Produção', status: 'Conectada', contaId: 2, carteira: '109', multa: 2, juros: 1, desconto: 0, baixaDias: 60, envioAuto: true, diasAntes: 5, lembrete: true, pix: true, ultimaSinc: '2026-11-09T09:15' };
  /* valores dos boletos e pagamentos = líquido de retenções (o bruto é o da NFS-e) */
  F.cobrancaEventos = [
    { quando: '2026-11-09T09:15', tipo: 'Sincronização', texto: '14 boletos conferidos; nenhuma divergência.', tone: 'slate', icon: 'refresh' },
    { quando: '2026-11-09T06:00', tipo: 'Cobrança automática', texto: 'FIN-02 criou a tarefa "Cobrar honorário" (Valinhos Autopeças, 30 dias de atraso).', tone: 'amber', icon: 'zap', ref: 12010 },
    { quando: '2026-11-06T16:31', tipo: 'Boleto registrado', texto: 'Êxito out/2026 · Serra Azul · ' + moeda(liq(4, 85500, 'exito')) + ' líquido, NFS-e de ' + moeda(85500) + ' (aguardando envio).', tone: 'violet', icon: 'receipt', ref: 12106 },
    { quando: '2026-11-05T11:32', tipo: 'Pagamento confirmado', texto: 'Cosmópolis Bioenergia · honorários nov/2026 · ' + moeda(liq(16, 9800)) + ' líquido de retenções (baixa automática).', tone: 'green', icon: 'check-circle', ref: 12021 },
    { quando: '2026-11-05T09:48', tipo: 'Pagamento confirmado', texto: 'Serra Azul · honorários nov/2026 · ' + moeda(liq(4, 8500)) + ' líquido de retenções (baixa automática).', tone: 'green', icon: 'check-circle', ref: 12017 },
    { quando: '2026-11-04T14:02', tipo: 'E-mail aberto', texto: 'Mônica Freitas (Cosmópolis Bioenergia) abriu o boleto do êxito de out/2026.', tone: 'blue', icon: 'eye', ref: 12105 },
    { quando: '2026-11-04T10:20', tipo: 'Boleto enviado', texto: 'Êxito out/2026 · Cosmópolis Bioenergia · ' + moeda(liq(16, 49200, 'exito')) + ' líquido (NFS-e de ' + moeda(49200) + ') para 2 destinatários.', tone: 'blue', icon: 'send', ref: 12105 },
    { quando: '2026-11-03T16:40', tipo: 'Boletos enviados', texto: '3 boletos de honorários de novembro enviados por e-mail.', tone: 'blue', icon: 'send' },
    { quando: '2026-11-03T16:38', tipo: 'Boletos registrados', texto: '4 boletos de honorários de novembro registrados na integração.', tone: 'violet', icon: 'receipt' },
    { quando: '2026-10-13T06:00', tipo: 'Boleto vencido', texto: 'Valinhos Autopeças · honorários out/2026 · ' + moeda(liq(7, 2800)) + ' venceu sem pagamento.', tone: 'red', icon: 'alert-circle', ref: 12010 }
  ];

  /* ---------------- Fluxo de caixa mensal (realizado × previsto) ---------------- */
  /* nov/2026 é calculado na tela a partir dos títulos; dez/2026 é a previsão (13º salário e férias). */
  /* entradas = valor líquido que cai na conta (NFS-e menos retenções); saídas já com as guias líquidas das retenções */
  F.fluxoMensal = [
    { mes: '2026-06', entPrev: 101000, entReal: 97940, saiPrev: 167000, saiReal: 164400 },
    { mes: '2026-07', entPrev: 141000, entReal: 138010, saiPrev: 168500, saiReal: 167000 },
    { mes: '2026-08', entPrev: 197000, entReal: 194320, saiPrev: 171100, saiReal: 172000 },
    { mes: '2026-09', entPrev: 201000, entReal: 198770, saiPrev: 169400, saiReal: 166850 },
    { mes: '2026-10', entPrev: 192200, entReal: 189690, saiPrev: 195500, saiReal: 193000 },
    { mes: '2026-12', entPrev: 202000, entReal: null, saiPrev: 243000, saiReal: null, nota: '13º salário (R$ 55,4 mil) e férias coletivas' }
  ];

  /* ---------------- DRE mensal (competência) por linha do plano de contas ---------------- */
  /* meses: jul–out fechados/em revisão; nov = previsão do mês. Deduções e IRPJ/CSLL calculados (lucro presumido). */
  F.dre = {
    meses: ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11'],
    status: ['fechado', 'fechado', 'fechado', 'revisao', 'aberto'],
    linhas: {
      'honorarios|Honorários mensais': [37000, 41200, 41200, 48800, 52000],
      'honorarios|Honorários de êxito': [110200, 148000, 161240, 156400, 163900],
      'honorarios|Pareceres e consultorias avulsas': [0, 18000, 9500, 0, 12000],
      'rec_fin|Rendimento de aplicações': [3650, 3710, 3805, 3866, 3920.40],
      'rec_fin|Juros e multas recebidos': [0, 0, 0, 96, 0],
      'custas|Custas judiciais (GRU)': [0, 412.30, 0, 0, 0],
      'custas|Certidões': [124.60, 0, 98.20, 0, 186.40],
      'pericias|Perícia contábil': [0, 2800, 0, 4800, 4800],
      'correspondentes|Protocolo e despacho': [0, 850, 0, 0, 850],
      'comissoes|Comissão sobre êxito': [1070, 1070, 1070, 1070, 1070],
      'comissoes|Comissão sobre honorário mensal': [260, 260, 260, 260, 260],
      'pessoal_adm|Salários': [12600, 12600, 12600, 12600, 12600],
      'pessoal_adm|Encargos (INSS, FGTS)': [4000, 4000, 4000, 4000, 4000],
      'pessoal_adm|Benefícios': [2800, 2800, 2800, 2800, 2800],
      'pessoal_adm|Pró-labore': [24000, 24000, 24000, 24000, 24000],
      'pessoal_tec|Salários': [42800, 42800, 42800, 42800, 42800],
      'pessoal_tec|Encargos (INSS, FGTS)': [13600, 13600, 13600, 13600, 13600],
      'pessoal_tec|Benefícios': [7400, 7400, 7400, 7400, 7400],
      'infra|Aluguel': [14500, 14500, 14500, 14500, 14500],
      'infra|Condomínio': [3820, 3820, 3820, 3820, 3820],
      'infra|Energia elétrica': [2198.40, 2240.15, 2105.88, 2012.77, 1946.32],
      'infra|Água': [182, 175, 190, 186, 186],
      'infra|Internet e telefonia': [689.90, 689.90, 689.90, 689.90, 689.90],
      'infra|IPTU': [1120, 1120, 1120, 1120, 1120],
      'infra|Limpeza': [1600, 1600, 1600, 1600, 1600],
      'infra|Materiais de escritório': [388.40, 455, 297.30, 410, 550.28],
      'ti|Sistema de gestão': [2490, 2490, 2490, 2490, 2490],
      'ti|Pesquisa jurídica': [459, 459, 459, 459, 459],
      'ti|Pacote de escritório e e-mail': [1180, 1180, 1180, 1180, 1180],
      'ti|Certificados digitais': [0, 0, 389, 0, 0],
      'ti|TI externo': [0, 900, 0, 0, 200],
      'marketing|Site e identidade': [0, 2400, 0, 0, 0],
      'marketing|Eventos e palestras': [0, 0, 0, 0, 4800],
      'marketing|Anúncios pagos': [1200, 1200, 1200, 1200, 1200],
      'frota|Reembolso de quilometragem': [1960, 2210, 2050, 2140, 2140],
      'frota|Pedágio e estacionamento': [186, 214, 158, 201, 0],
      'frota|Combustível': [0, 0, 0, 0, 412.60],
      'bancario|Tarifas bancárias': [129.90, 129.90, 129.90, 129.90, 194.80],
      'bancario|Tarifas de cobrança (boletos)': [72.50, 78.30, 81.20, 87, 87],
      'servicos|Contabilidade': [3200, 3200, 3200, 3200, 3200],
      'relacionamento|Almoços e reuniões': [380, 620, 0, 450, 0],
      'treinamento|Cursos e congressos': [0, 0, 1320, 1320, 1320],
      'manutencao|Compras diversas': [0, 0, 0, 0, 91.90]
    }
  };
  (function calcularImpostos() {
    var L = F.dre.linhas, n = F.dre.meses.length, bruta = [];
    for (var i = 0; i < n; i++) bruta[i] = L['honorarios|Honorários mensais'][i] + L['honorarios|Honorários de êxito'][i] + L['honorarios|Pareceres e consultorias avulsas'][i];
    var r2 = function (v) { return Math.round(v * 100) / 100; };
    L['impostos|ISS sobre serviços'] = bruta.map(function (b) { return r2(b * 0.03); });
    L['impostos|PIS'] = bruta.map(function (b) { return r2(b * 0.0065); });
    L['impostos|Cofins'] = bruta.map(function (b) { return r2(b * 0.03); });
    L['impostos|IRPJ'] = bruta.map(function (b) { var base = b * 0.32; return r2(base * 0.15 + Math.max(0, (base - 20000) * 0.10)); });
    L['impostos|CSLL'] = bruta.map(function (b) { return r2(b * 0.32 * 0.09); });
  })();

  /* ---------------- Conciliação bancária ---------------- */
  /* Histórico do extrato montado com o nome e o CNPJ do cadastro (data.js), para não divergir dele. Recebimentos = valor líquido. */
  function histNome(eid) { var e = find(D.empresas || [], eid) || { razao: '' }; return e.razao.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 26).trim(); }
  function cnpjDe(eid) { var e = find(D.empresas || [], eid); return e ? e.cnpj : ''; }
  /* linhas do extrato ainda sem baixa */
  F.extrato = [
    { id: 1, contaId: 2, data: '2026-11-09', historico: 'PIX RECEBIDO · ' + histNome(1) + ' · ' + cnpjDe(1), valor: liq(1, 4500), sugestao: { tipo: 'r', id: 12016, empresaId: 1, label: 'Honorários mensais nov/2026 · Metalatibaia (vence 10/11)' }, conf: 'alta', motivo: 'Valor líquido (NFS-e de ' + moeda(4500) + ' menos IRRF, CSRF e ISS retidos) e CNPJ do pagador batem com um título em aberto' },
    { id: 2, contaId: 1, data: '2026-11-06', historico: 'DEB AUTOMATICO · OFFICE CLOUD REVENDA', valor: -1180, sugestao: { tipo: 'p', label: 'Pacote de escritório e e-mail · nov/2026' }, conf: 'alta', motivo: 'Débito recorrente com o mesmo valor todo mês', conciliado: false },
    { id: 3, contaId: 1, data: '2026-11-07', historico: 'COMPRA CARTAO · AUTO POSTO ROTA 330', valor: -412.60, sugestao: { tipo: 'nota', id: 15003, label: 'NFC-e 51.203 · Posto Rota 330 (nota aguardando aceite)' }, conf: 'media', motivo: 'Valor igual ao de uma nota importada que ainda não virou conta a pagar' },
    { id: 4, contaId: 1, data: '2026-11-08', historico: 'TARIFA MANUTENCAO CONTA', valor: -64.90, sugestao: null, conf: 'baixa', motivo: 'Nenhum lançamento com esse valor; crie um em Tarifas bancárias' }
  ];
  /* linhas já conciliadas (podem ser desfeitas, com motivo e registro na auditoria) */
  F.extratoConciliado = [
    { id: 11, contaId: 2, data: '2026-11-05', historico: 'LIQ COBRANCA · ' + histNome(16), valor: liq(16, 9800), titulo: { t: 'r', id: 12021 }, label: 'Honorários mensais nov/2026 · Cosmópolis Bioenergia', por: 'Integração de cobrança (automática)', em: '2026-11-05T11:32' },
    { id: 12, contaId: 2, data: '2026-11-05', historico: 'LIQ COBRANCA · ' + histNome(4), valor: liq(4, 8500), titulo: { t: 'r', id: 12017 }, label: 'Honorários mensais nov/2026 · Serra Azul', por: 'Integração de cobrança (automática)', em: '2026-11-05T09:48' },
    { id: 13, contaId: 2, data: '2026-11-03', historico: 'PIX RECEBIDO · ' + histNome(4) + ' · ' + cnpjDe(4), valor: liq(4, 12000, 'avulso'), titulo: { t: 'r', id: 12201 }, label: 'Parecer sobre subvenções de ICMS · Serra Azul', por: 'Larissa Campos', em: '2026-11-03T15:10' },
    { id: 14, contaId: 1, data: '2026-11-04', historico: 'PIX ENVIADO · CENTRAL DE CERTIDOES CAMPINAS', valor: -186.40, titulo: { t: 'p', id: 13004 }, label: 'Certidões negativas para a habilitação · Americana Fios', por: 'Larissa Campos', em: '2026-11-04T16:02' }
  ];

  /* ---------------- Retenções do DRE e guias líquidas (calculadas, para fechar com os títulos) ---------------- */
  (function retencoesEGuias() {
    var L = F.dre.linhas, ms = F.dre.meses, A = F.retencaoAliq;
    var bruta = ms.map(function (m, i) { return L['honorarios|Honorários mensais'][i] + L['honorarios|Honorários de êxito'][i] + L['honorarios|Pareceres e consultorias avulsas'][i]; });
    /* ISS retido: NFS-e do mês de tomadores responsáveis (honorários mensais de clientes em Campinas) */
    var issRet = ms.map(function (m) { return r2(D.contratos.filter(function (c) { return c.status === 'ativo' && c.inicio.slice(0, 7) < m && F.issRetido(c.empresaId); }).reduce(function (a, c) { return a + c.honorarioMensal * A.iss / 100; }, 0)); });
    /* NFS-e do mês ainda não pagas: a retenção só vira crédito quando o cliente paga */
    var aberto = ms.map(function (m) { var t = 0; F.receber.forEach(function (c) { if (c.tipo === 'reembolso') return; c.parcelas.forEach(function (p) { if (p.venc.slice(0, 7) === m && p.status === 'aberto' && p.venc < '2026-11-01') t += p.valor; }); }); return t; });
    var ret = function (k) { return bruta.map(function (b) { return r2(b * A[k] / 100); }); };
    F.dre.retencoes = { bruta: bruta, irrf: ret('irrf'), csll: ret('csll'), pis: ret('pis'), cofins: ret('cofins'), iss: issRet };
    var pago = function (k, i) { return r2((bruta[i] - aberto[i]) * A[k] / 100); };
    var setV = function (id, v) { var c = F.pagarConta(id); if (c) c.parcelas[0].valor = r2(Math.max(0, v)); };
    var iOut = ms.indexOf('2026-10'), iSet = ms.indexOf('2026-09');
    setV(13201, L['impostos|PIS'][iOut] - pago('pis', iOut));
    setV(13202, L['impostos|Cofins'][iOut] - pago('cofins', iOut));
    var tri = [0, 1, 2], sum = function (arr) { return tri.reduce(function (a, i) { return a + arr[i]; }, 0); };
    setV(13203, sum(L['impostos|IRPJ']) - tri.reduce(function (a, i) { return a + pago('irrf', i); }, 0));
    setV(13204, sum(L['impostos|CSLL']) - tri.reduce(function (a, i) { return a + pago('csll', i); }, 0));
    F.pagar.forEach(function (c) {
      if (c.sub !== 'ISS sobre serviços' || c.tipo !== 'adm') return;
      var i = c.competencia === '2026-10' ? iSet : c.competencia === '2026-11' ? iOut : -1;
      if (i >= 0) c.parcelas[0].valor = r2(L['impostos|ISS sobre serviços'][i] - issRet[i]);
    });
  })();
})();
