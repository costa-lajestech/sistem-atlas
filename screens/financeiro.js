/* ==========================================================================
   ATLAS · screens/financeiro.js — telas do FINANCEIRO
   Cópia do financeiro do LajesTech (fin_*) adaptada à Atlas: receita = honorários
   mensais (App.data.contratos) e honorários de êxito sobre créditos recuperados.
   Prefixo de hash: fin-  ·  prefixo de ID: fin.
   Telas: painel · contas a receber (+ficha) · contas a pagar (+ficha) · custos adm · lançamento
          fluxo de caixa · DRE · honorários e êxito · cobranças e boletos · notas emitidas
          notas de fornecedor (XML + sugestão de categoria) · contas bancárias · plano de contas · fornecedores
   Gavetas: fin-novo-lancamento (botão "+ Novo"), fin-nova-conta-receber, fin-nova-conta-pagar,
            fin-novo-custo-adm, fin-baixa, fin-enviar-boleto, fin-contrato, fin-novo-fornecedor,
            fin-nova-conta-plano, fin-nova-conta-bancaria, fin-importar-extrato, fin-transferencia
            fin-contrato-form (novo/editar contrato de honorários)
   Diálogos: fin-gerar-boletos, fin-segunda-via, fin-tipo-dre-lote, fin-desfazer-baixa, fin-cancelar-titulo, fin-suspender-mensal
   Valores: título a receber guarda o BRUTO da NFS-e; boleto, recebimento, fluxo de caixa e conciliação usam o LÍQUIDO
   (bruto − IRRF 1,5% − CSRF 4,65% − ISS quando o tomador retém). Crédito recuperado = App.data.juridico.recuperadoContrato (fonte única; F.compensacoes fecha com ele).
   CSS próprio: bloco pequeno prefixado .fin-* (só variáveis), injetado abaixo.
   ========================================================================== */
(function () {
  'use strict';
  const App = window.App, ui = App.ui, esc = ui.esc, fmt = App.fmt, util = App.util, db = App.db, D = App.data, I = App.icon;
  const F = D.financeiro;
  if (!F || !F.receber) { console.error('[financeiro] App.data.financeiro não carregou'); return; }
  const HOJE = util.hojeIso();

  /* ------------------------------------------------------------------ */
  /* CSS mínimo do módulo (prefixo .fin-, só variáveis de tokens.css)     */
  /* ------------------------------------------------------------------ */
  (function () {
    if (document.getElementById('fin-css')) return;
    const s = document.createElement('style'); s.id = 'fin-css';
    s.textContent = [
      '.fin-show{display:contents}.fin-show[hidden]{display:none}',
      '.fin-dre th,.fin-dre td{white-space:nowrap}',
      '.fin-dre tr.fin-dre__grupo td{font-weight:600;background:var(--surface-2)}',
      '.fin-dre tr.fin-dre__cat td:first-child{padding-left:26px}',
      '.fin-dre tr.fin-dre__cat{cursor:pointer}',
      '.fin-dre tr.fin-dre__sub td{font-size:12.5px;color:var(--text-2)}',
      '.fin-dre tr.fin-dre__sub td:first-child{padding-left:44px}',
      '.fin-dre tr.fin-dre__total td{font-weight:700;background:var(--surface-3);border-top:1px solid var(--border)}',
      '.fin-dre tr.fin-dre__result td{font-weight:700;background:var(--gold-subtle);border-top:1px solid var(--gold-border)}',
      '.fin-dre td.is-foco,.fin-dre th.is-foco{box-shadow:inset 1px 0 0 var(--gold-border),inset -1px 0 0 var(--gold-border)}',
      '.fin-dre tr.fin-dre__cat .lt-icon{width:13px;height:13px;vertical-align:-2px;color:var(--text-muted);transition:transform var(--dur-1)}',
      '.fin-dre tr.fin-dre__cat.is-open .lt-icon{transform:rotate(90deg)}',
      '.lt-table tbody tr.fin-row-in td:first-child{box-shadow:inset 3px 0 0 var(--success)}',
      '.lt-table tbody tr.fin-row-out td:first-child{box-shadow:inset 3px 0 0 var(--danger)}',
      '.lt-table tbody tr.fin-hoje td{background:var(--gold-subtle)}',
      '.fin-boleto{border:1px dashed var(--border-strong);border-radius:var(--r-md);padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--surface)}',
      '.fin-boleto__linha{font-family:var(--ff-mono);font-size:13px;letter-spacing:.02em;overflow-wrap:anywhere;color:var(--text)}',
      '.fin-barcode{height:44px;border-radius:2px;background:repeating-linear-gradient(90deg,var(--text) 0 1px,transparent 1px 3px,var(--text) 3px 6px,transparent 6px 7px,var(--text) 7px 8px,transparent 8px 11px,var(--text) 11px 13px,transparent 13px 15px,var(--text) 15px 16px,transparent 16px 17px)}',
      '.fin-bank-code{font-weight:700;font-size:11px;letter-spacing:.02em}',
      '.fin-sel{height:32px;font-size:12.5px;min-width:260px;width:auto;max-width:100%}',
      '.fin-sw-dash{display:inline-block;width:14px;height:0;border-top:2px dashed currentColor;vertical-align:middle}',
      '.fin-sw-solid{display:inline-block;width:14px;height:0;border-top:2px solid currentColor;vertical-align:middle}',
      '.fin-chart text{font-size:11px;fill:var(--text-muted)}',
      '.fin-chart .fin-chart__hoje{stroke:var(--gold);stroke-width:1;stroke-dasharray:2 3}',
      '.fin-chart .fin-chart__hoje-lbl{fill:var(--gold-text);font-weight:600}',
      '.fin-ret td:first-child{white-space:nowrap}',
      '.fin-nw{white-space:nowrap}.fin-r{text-align:right}'
    ].join('\n');
    document.head.appendChild(s);
  })();

  /* Status do módulo (prefixo fin_) */
  Object.assign(App.status, {
    fin_avencer: ['A vencer', 'blue'], fin_hoje: ['Vence hoje', 'amber'], fin_vencido: ['Vencido', 'red'], fin_recebido: ['Recebido', 'green'], fin_pago: ['Pago', 'green'], fin_cancelado: ['Cancelado', 'gray'],
    fin_b_nao: ['Sem boleto', 'gray'], fin_b_gerado: ['Gerado', 'violet'], fin_b_enviado: ['Enviado', 'blue'], fin_b_pago: ['Pago', 'green'], fin_b_vencido: ['Vencido', 'red'], fin_b_cancelado: ['Cancelado', 'gray'],
    fin_nf_autorizada: ['Autorizada', 'green'], fin_nf_pendente: ['A emitir', 'amber'], fin_nf_cancelada: ['Cancelada', 'gray'],
    fin_fechado: ['Fechado', 'green'], fin_revisao: ['Em revisão', 'amber'], fin_aberto: ['Previsão', 'blue'],
    fin_sugestao: ['Aguardando aceite', 'violet'], fin_aceita: ['Aceita', 'blue'], fin_vinculada: ['Vinculada', 'green'],
    fin_conciliado: ['Conciliado', 'green'], fin_a_conciliar: ['A conciliar', 'amber'],
    fin_comp_realizada: ['Compensada', 'green'], fin_comp_prevista: ['Prevista', 'blue']
  });

  /* ------------------------------------------------------------------ */
  /* Utilitários                                                          */
  /* ------------------------------------------------------------------ */
  const vu = (iso) => util.iso(util.proximoDiaUtil(iso));
  const emp = (id) => db.empresa(id) || { id: 0, fantasia: '—', razao: '—', cnpj: '—' };
  const forn = (id) => F.fornecedor(id);
  const M = (v, cls) => '<span class="lt-num fin-nw' + (cls ? ' ' + cls : '') + '">' + fmt.moeda(v) + '</span>';
  const MC = (v) => fmt.moedaCurta(v);
  /* eixo dos gráficos: sem "R$" para caber na margem do SVG */
  const EIXO = (v) => { const a = Math.abs(v); return a >= 1e6 ? fmt.num(v / 1e6, a % 1e6 ? 1 : 0) + ' mi' : a >= 1e3 ? fmt.num(v / 1e3, 0) + ' mil' : fmt.num(v, 0); };
  const mesC = F.mesCurto;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const parseMoney = (s) => { const v = parseFloat(String(s == null ? '' : s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isNaN(v) ? 0 : v; };
  const soma = util.soma;
  const BANCO_CURTO = { 1: 'BB', 2: 'Itaú', 3: 'Sicoob', 4: 'Caixa' };
  const BANCO_TOM = { 1: 'amber', 2: 'blue', 3: 'green', 4: 'gold' };
  const contaNome = (id) => { const c = F.conta(id); return c ? c.banco + ' · ' + c.apelido : '—'; };
  const formaNome = (k) => (F.formas.find((f) => f.key === k) || { nome: k || '—' }).nome;
  const FORMA_CURTA = { boleto: 'Boleto', pix: 'PIX', transferencia: 'TED', debito: 'Débito aut.', cartao: 'Cartão', gru: 'Guia', dinheiro: 'Dinheiro' };
  const TIPO_R = { fee: ['Honorário mensal', 'gold'], exito: ['Êxito', 'green'], avulso: ['Avulso', 'violet'], reembolso: ['Reembolso', 'slate'] };
  const TIPO_P = { direto: ['Direto', 'violet'], adm: ['Custo adm', 'slate'] };
  const tipoChipR = (t) => ui.chip(TIPO_R[t][0], TIPO_R[t][1]);
  const tipoChipP = (t) => ui.chip(TIPO_P[t][0], TIPO_P[t][1]);
  const dreInfo = (k) => F.tiposDre.find((t) => t.key === k);
  const dreChip = (k) => { const t = dreInfo(k); return t ? ui.chip(t.curto, t.tone) : ui.chip('Sem tipo DRE', 'red', { icon: 'alert-triangle' }); };
  const ENC = F.cobrancaConfig;
  const r2 = (v) => Math.round(v * 100) / 100;
  /* valor atualizado = boleto + multa + juros pro rata (cada parcela arredondada, igual à baixa) */
  const atualizado = (valor, dias) => dias > 0 ? r2(valor + r2(valor * ENC.multa / 100) + r2(valor * ENC.juros / 100 * dias / 30)) : valor;
  const bankTile = (id) => { const c = F.conta(id) || {}; return '<span class="lt-list__icon fin-bank-code" data-tone="' + (BANCO_TOM[id] || 'gold') + '">' + (c.codigo && c.codigo !== '—' ? esc(c.codigo) : I('wallet')) + '</span>'; };
  const ATLAS = { razao: 'Atlas Corporate Consultoria Empresarial Ltda', cnpj: '41.226.508/0001-90' };
  const PERIODOS = [{ value: '2026-09', label: 'Setembro de 2026' }, { value: '2026-10', label: 'Outubro de 2026' }, { value: '2026-11', label: 'Novembro de 2026' }, { value: '2026-12', label: 'Dezembro de 2026' }, { value: '2027-01', label: 'Janeiro de 2027' }];
  const crumb = (label, extra) => [{ label: 'Financeiro', hash: 'fin-painel' }].concat(extra || []).concat([{ label }]);
  /* Retenções na fonte e valor líquido (boleto) de uma parcela a receber */
  const RTc = (c, p) => F.retencao(c.empresaId, p.valor, c.tipo);
  const RT = (r) => RTc(r.c, r.p);
  const LQ = (r) => RT(r).liquido;
  const LQc = (c, p) => RTc(c, p).liquido;
  const liqSec = (r) => RT(r).total ? '<span class="lt-table__secondary" style="white-space:nowrap" title="Valor do boleto: bruto menos as retenções na fonte">líq. ' + fmt.moeda(LQ(r)) + '</span>' : '';
  const procF = (id) => F.processo(id);
  const etapaJ = (k) => (D.funis.juridico.etapas.find((et) => et.key === k) || { nome: k || '—' }).nome;
  /* Fonte única do crédito recuperado: o Jurídico (só processos em "Compensação (PER/DCOMP)", CTN art. 170-A).
     F.compensacoes fecha com esse número (linha consolidada por processo). */
  const recuperado = (ct) => (D.juridico && D.juridico.recuperadoContrato ? D.juridico.recuperadoContrato(ct) : F.creditoRecuperado(ct.id));
  const EXPORTAR = 'Exportar Excel';

  /* Situação de parcelas */
  function sitR(p) { if (p.status === 'recebido') return 'fin_recebido'; if (p.status === 'cancelado') return 'fin_cancelado'; const v = vu(p.venc); return v < HOJE ? 'fin_vencido' : v === HOJE ? 'fin_hoje' : 'fin_avencer'; }
  function sitP(p) { if (p.status === 'pago') return 'fin_pago'; if (p.status === 'cancelado') return 'fin_cancelado'; const v = vu(p.venc); return v < HOJE ? 'fin_vencido' : v === HOJE ? 'fin_hoje' : 'fin_avencer'; }
  function bolR(c, p) {
    if (c.forma !== 'boleto') return null;
    if (p.status === 'recebido') return p.boleto ? 'fin_b_pago' : null;
    if (!p.boleto) return 'fin_b_nao';
    if (p.boleto.status === 'cancelado') return 'fin_b_cancelado';
    if (vu(p.venc) < HOJE) return 'fin_b_vencido';
    return 'fin_b_' + p.boleto.status;
  }
  const isAberto = (r) => r.sit === 'fin_avencer' || r.sit === 'fin_hoje' || r.sit === 'fin_vencido';
  const atraso = (r) => util.diasEntre(r.venc, HOJE);
  const valorPago = (r) => r.p.valorRecebido != null ? r.p.valorRecebido : r.p.valor;
  function rowsR() {
    const out = [];
    F.receber.forEach((c) => c.parcelas.forEach((p) => { const e = emp(c.empresaId); out.push({ key: c.id + '-' + p.n, c, p, e, venc: p.venc, vu: vu(p.venc), sit: sitR(p), bol: bolR(c, p) }); }));
    return out;
  }
  function rowsP() {
    const out = [];
    F.pagar.forEach((c) => c.parcelas.forEach((p) => { const f = forn(c.fornecedorId); out.push({ key: c.id + '-' + p.n, c, p, f, nome: f ? f.fantasia : (c.recebedor || '—'), venc: p.venc, vu: vu(p.venc), sit: sitP(p) }); }));
    return out;
  }
  const rowR = (id, n) => rowsR().find((r) => r.c.id === +id && r.p.n === +(n || 1));
  const rowP = (id, n) => rowsP().find((r) => r.c.id === +id && r.p.n === +(n || 1));
  const proxAbertaR = (c) => c.parcelas.find((p) => sitR(p) !== 'fin_recebido' && sitR(p) !== 'fin_cancelado');
  const proxAbertaP = (c) => c.parcelas.find((p) => sitP(p) !== 'fin_pago' && sitP(p) !== 'fin_cancelado');

  /* Boleto fictício (linha digitável, nosso número, PIX) */
  const nossoNumero = (c, p) => '109/' + String(10000000 + (c.id % 1000) * 97 + p.n * 13).slice(-8) + '-' + ((c.id + p.n) % 9);
  function linhaDig(c, p) {
    const fator = String(util.diasEntre('2025-02-22', vu(p.venc)) + 1000);
    const val = String(Math.round(LQc(c, p) * 100)).padStart(10, '0');
    const s = String(c.id * 7919 + p.n * 104729).padStart(12, '0');
    return '34191.09' + s.slice(0, 3) + ' ' + s.slice(3, 8) + '.' + s.slice(6, 12) + ' 04572.612034 ' + ((c.id + p.n) % 9 + 1) + ' ' + fator + val;
  }
  const pixCopia = (c, p) => '00020101021226870014br.gov.bcb.pix2565pix.integracao-cobranca.exemplo/qr/v2/cobv/' + c.id + p.n + 'a7f3e1' + '5204000053039865406' + LQc(c, p).toFixed(2) + '5802BR5915ATLAS CORPORATE6008CAMPINAS62070503***6304B1E4';

  /* Fluxo mensal com novembro calculado a partir dos títulos */
  function fluxoMeses() {
    const R = rowsR(), P = rowsP();
    const nov = (r) => r.venc.slice(0, 7) === '2026-11';
    const n = {
      mes: '2026-11',
      entPrev: soma(R.filter((r) => nov(r) && r.sit !== 'fin_cancelado'), LQ),
      entReal: soma(R.filter((r) => r.p.recebidoEm && r.p.recebidoEm.slice(0, 7) === '2026-11'), valorPago),
      saiPrev: soma(P.filter((r) => nov(r) && r.sit !== 'fin_cancelado'), (r) => r.p.valor),
      saiReal: soma(P.filter((r) => r.p.pagoEm && r.p.pagoEm.slice(0, 7) === '2026-11'), (r) => r.p.valor),
      parcial: true
    };
    const out = F.fluxoMensal.filter((m) => m.mes < '2026-11').concat([n]).concat(F.fluxoMensal.filter((m) => m.mes > '2026-11'));
    return out;
  }

  /* Ouvintes de tela: #lt-content é reaproveitado entre telas, então cada ouvinte se desliga
     sozinho quando o conteúdo da tela é trocado (o primeiro filho deixa de estar no documento). */
  function on(root, type, fn) {
    const marca = root.firstElementChild;
    const h = (e) => { if (!marca || !marca.isConnected) { root.removeEventListener(type, h); return; } fn(e); };
    root.addEventListener(type, h);
  }
  /* Filtros ao vivo (lista sem recarregar a tela) */
  function bindFiltros(root, S, redraw) {
    let t;
    on(root, 'lt:filter', (e) => { if (!e.target.closest('.lt-filters')) return; S.chip = e.detail.active ? e.detail.value : 'todos'; redraw(); });
    on(root, 'change', (e) => { const n = e.target.getAttribute && e.target.getAttribute('name'); if (n && /^f-/.test(n) && e.target.closest('.lt-filters')) { S[n.slice(2)] = e.target.value; redraw(); } });
    on(root, 'input', (e) => { if (e.target.matches && e.target.matches('[data-filter-search]')) { S.busca = e.target.value; clearTimeout(t); t = setTimeout(redraw, 160); } });
  }
  function selecionados(btn, rows) {
    const tb = btn.closest('[data-lt-table]'); if (!tb) return [];
    return [].slice.call(tb.querySelectorAll('tbody tr')).filter((tr) => { const c = tr.querySelector('[data-check-row]'); return c && c.checked; }).map((tr) => rows[+tr.getAttribute('data-ri')]).filter(Boolean);
  }
  function ativarChip(root, v) { root.querySelectorAll('.lt-filters .lt-filter-chip').forEach((c) => c.classList.toggle('is-active', c.getAttribute('data-value') === v)); }

  /* Contatos de cobrança de uma empresa (financeiro/decisor primeiro) */
  function contatosCobranca(eid) {
    const l = db.contatosDa(eid);
    const peso = (c) => (/financ|fiscal|tribut|control|cfo|impost/i.test(c.cargo) ? 0 : 1) + (c.decisor ? 0 : 0.5);
    return l.slice().sort((a, b) => peso(a) - peso(b));
  }

  /* Histórico de um título a receber (linha do tempo) */
  function historicoR(c) {
    const it = [];
    const origem = c.origem === 'FIN-01' ? 'Título criado pela automação FIN-01 (honorários mensais)' : c.origem === 'Compensação' ? (c.acordo ? 'Título de êxito criado pelo termo de acordo (' + c.perdcomp + ')' : 'Título de êxito criado a partir do PER/DCOMP ' + (c.perdcomp || '')) : 'Título lançado manualmente';
    it.push({ when: c.criadoEm, icon: c.origem === 'FIN-01' ? 'zap' : 'plus', tone: 'gold', title: esc(origem), meta: c.origem === 'FIN-01' ? 'Automação' : 'Larissa Campos' });
    const cont = contatosCobranca(c.empresaId)[0];
    c.parcelas.forEach((p) => {
      const tot = c.parcelas.length > 1 ? ' (parcela ' + p.n + '/' + c.parcelas.length + ')' : '';
      if (p.boleto && p.boleto.geradoEm <= HOJE) it.push({ when: p.boleto.geradoEm, icon: 'receipt', tone: 'violet', title: 'Boleto registrado na integração de cobrança' + tot, meta: 'Nosso número ' + nossoNumero(c, p) });
      if (p.boleto && p.boleto.enviadoEm && p.boleto.enviadoEm <= HOJE) it.push({ when: p.boleto.enviadoEm, icon: 'send', tone: 'blue', title: 'Boleto e NFS-e enviados por e-mail' + tot, meta: cont ? esc(cont.nome) + ' · ' + esc(cont.email) : '' });
      if (p.status === 'recebido' && p.recebidoEm <= HOJE) it.push({ when: p.recebidoEm, icon: 'check-circle', tone: 'green', title: 'Recebido: ' + fmt.moeda(p.valorRecebido) + tot + (RTc(c, p).total ? ' · líquido; ' + fmt.moeda(RTc(c, p).total) + ' retidos na fonte' : '') + (p.juros ? ' (inclui ' + fmt.moeda(p.juros) + ' de multa e juros)' : ''), meta: (c.forma === 'boleto' ? 'Baixa automática pela integração' : 'Baixa manual por Larissa Campos') + ' · ' + esc(contaNome(p.contaId || c.contaId)) });
      else if (p.status === 'aberto' && vu(p.venc) < HOJE) {
        it.push({ when: util.iso(util.addDias(vu(p.venc), 1)), icon: 'alert-circle', tone: 'red', title: 'Venceu sem pagamento' + tot, meta: 'Vencimento em ' + fmt.data(vu(p.venc)) });
        if (p.cobrancas) it.push({ when: util.iso(util.addDias(vu(p.venc), 3)), icon: 'zap', tone: 'amber', title: 'FIN-02 criou a tarefa "Cobrar honorário" para Larissa Campos', meta: 'Automação · aviso ao sócio responsável' });
      }
    });
    it.sort((a, b) => b.when.localeCompare(a.when));
    const out = []; let dia = '';
    it.forEach((x) => { const d = x.when === HOJE ? 'Hoje' : fmt.dataExtenso(x.when).replace(/^[^,]+, /, ''); if (d !== dia) { out.push({ day: d }); dia = d; } out.push(x); });
    return ui.timeline(out);
  }

  /* NFS-e emitidas (derivadas dos títulos de out e nov) */
  let _nfse = null;
  function nfseLista() {
    if (_nfse) return _nfse;
    const rows = rowsR().filter((r) => r.c.tipo !== 'reembolso' && r.venc >= '2026-10-01' && r.venc <= '2026-11-30').sort((a, b) => a.venc.localeCompare(b.venc) || a.c.id - b.c.id);
    let num = 1201; const out = [];
    rows.forEach((r) => {
      const emitida = r.p.status === 'recebido' || !!r.p.boleto;
      const rt = RT(r);
      out.push({ r, rt, numero: emitida ? num++ : null, emissao: emitida ? (r.p.boleto ? r.p.boleto.geradoEm : (r.p.recebidoEm || r.venc)) : null, valor: r.p.valor, iss: rt.issValor, status: emitida ? 'fin_nf_autorizada' : 'fin_nf_pendente' });
    });
    const metalOut = rows.find((r) => r.c.tipo === 'fee' && r.c.contratoId === 3001 && r.venc.slice(0, 7) === '2026-10');
    if (metalOut) out.push({ r: metalOut, rt: F.retencao(metalOut.c.empresaId, 4800, 'fee'), numero: 1199, emissao: '2026-10-01', valor: 4800, iss: 144, status: 'fin_nf_cancelada', obs: 'Valor errado (R$ 4.800,00). Substituída na mesma data.' });
    _nfse = out; return out;
  }

  /* ================================================================== */
  /* PAINEL FINANCEIRO                                                    */
  /* ================================================================== */
  App.screen({
    id: 'fin.dashboard', hash: 'fin-painel', module: 'financeiro', title: 'Painel financeiro', nav: true, navGroup: 'financeiro', navLabel: 'Painel', navOrder: 1,
    render: () => {
      const R = rowsR(), P = rowsP();
      const nov = (r) => r.venc.slice(0, 7) === '2026-11';
      const rNov = R.filter(nov), pNov = P.filter(nov);
      const saldo = soma(F.contas, (c) => c.saldo), aplic = soma(F.contas.filter((c) => c.tipo === 'Aplicação'), (c) => c.saldo);
      const aReceber = soma(rNov.filter(isAberto), LQ), recebido = soma(rNov.filter((r) => r.sit === 'fin_recebido'), valorPago);
      const aPagar = soma(pNov.filter(isAberto), (r) => r.p.valor), pago = soma(pNov.filter((r) => r.sit === 'fin_pago'), (r) => r.p.valor);
      const venc = R.filter((r) => r.sit === 'fin_vencido').sort((a, b) => a.vu.localeCompare(b.vu)), vencVal = soma(venc, (r) => r.p.valor);
      const ini90 = util.iso(util.addDias(HOJE, -90));
      const devido90 = soma(R.filter((r) => r.vu >= ini90 && r.vu < HOJE && r.sit !== 'fin_cancelado'), (r) => r.p.valor);
      const inad = devido90 ? 100 * vencVal / devido90 : 0;

      const header = ui.pageHeader({
        eyebrow: 'Financeiro · ' + fmt.mesAno(HOJE), title: 'Painel financeiro',
        sub: 'Saldo, honorários a receber, contas a pagar e inadimplência. Valores de novembro incluem o que ainda vai vencer; entradas pelo líquido de retenções.',
        actions: ui.segmented([{ label: 'Mês', value: 'mes', active: true }, { label: 'Trimestre', value: 'tri' }, { label: 'Ano', value: 'ano' }], { name: 'fin-painel-periodo' }) +
          ui.btn({ label: EXPORTAR, icon: 'download', acao: 'exportar', toast: 'Relatório exportado', toastText: 'painel-financeiro-nov-2026.xlsx' }) +
          ui.btn({ label: 'Novo lançamento', icon: 'plus', variant: 'primary', sheet: 'fin-novo-lancamento' })
      });
      const fechamento = ui.callout({ tone: 'gold', icon: 'calendar-clock', title: 'Fechamento de outubro aguardando aprovação', text: 'O DRE de outubro está em revisão: resultado líquido de ' + fmt.moeda(dreModel().tot.liq[3]) + '. A tarefa de aprovação vence amanhã às 12:00.', actions: '<a class="lt-btn lt-btn--sm lt-btn--outline" href="#fin-dre">' + I('chart-bar') + '<span>Revisar DRE</span></a>' + ui.btn({ label: 'Aprovar fechamento', size: 'sm', variant: 'primary', icon: 'check', acao: 'aprovar', toast: 'Fechamento de outubro aprovado', toastText: 'O mês foi travado para novos lançamentos. A tarefa foi concluída.' }) });

      const kpis = ui.kpis([
        { label: 'Saldo em contas', value: fmt.moeda(saldo, true), icon: 'landmark', foot: F.contas.length + ' contas · ' + MC(aplic) + ' em aplicação', href: '#fin-contas-bancarias' },
        { label: 'A receber em novembro', value: fmt.moeda(aReceber, true), icon: 'arrow-down', progress: { value: recebido, max: recebido + aReceber, tone: 'green' }, foot: 'líquido · ' + MC(recebido) + ' já recebidos · ' + fmt.plural(rNov.filter(isAberto).length, 'título') + ' em aberto', href: '#fin-receber' },
        { label: 'A pagar em novembro', value: fmt.moeda(aPagar, true), icon: 'arrow-up', progress: { value: pago, max: pago + aPagar, tone: 'amber' }, foot: MC(pago) + ' já pagos · folha de outubro quitada', href: '#fin-pagar' },
        { label: 'Inadimplência', value: fmt.moeda(vencVal, true), icon: 'alert-triangle', delta: fmt.pct(inad, 1), dir: 'up', good: false, foot: 'do faturado em 90 dias · ' + fmt.plural(venc.length, 'título'), href: '#fin-receber' }
      ]);

      const meses = fluxoMeses();
      const lbl = meses.map((m) => mesC(m.mes).slice(0, 3));
      const cardFluxo = ui.card({ title: 'Entradas e saídas', icon: 'chart-bar', sub: 'Em R$ · junho a outubro realizado · novembro e dezembro previstos', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#fin-fluxo-caixa">Fluxo de caixa</a>',
        body: ui.chart.bar({ labels: lbl, width: 660, height: 230, format: EIXO, series: [{ name: 'Entradas', color: 'var(--chart-4)', values: meses.map((m) => m.entReal != null && !m.parcial ? m.entReal : m.entPrev) }, { name: 'Saídas', color: 'var(--chart-1)', values: meses.map((m) => m.saiReal != null && !m.parcial ? m.saiReal : m.saiPrev) }] }) +
          '<p class="lt-hint" style="margin-top:6px">Dezembro: ' + esc(meses[meses.length - 1].nota || '') + '.</p>' });
      const cardSaldos = ui.card({ title: 'Saldo por conta', icon: 'landmark', flush: true, foot: '<span class="lt-muted lt-small" style="margin-right:auto">Total</span><b class="lt-num">' + fmt.moeda(saldo) + '</b>',
        body: ui.list(F.contas.map((c) => ({ lead: bankTile(c.id), title: esc(c.apelido), meta: esc(c.banco) + (c.tipo === 'Aplicação' ? ' · rende ' + MC(c.rendimentoMes) + '/mês' : ' · conciliado até ' + fmt.dataCurta(c.conciliadoAte)), aside: '<b class="lt-num" style="color:var(--text)">' + fmt.moeda(c.saldo) + '</b>', href: '#fin-contas-bancarias' }))) });

      const L = F.dre.linhas, ms = F.dre.meses;
      const feeV = L['honorarios|Honorários mensais'], exV = L['honorarios|Honorários de êxito'], avV = L['honorarios|Pareceres e consultorias avulsas'];
      const cardReceita = ui.card({ title: 'Receita por tipo', icon: 'chart-bar', sub: 'Em R$ · honorários mensais × êxito × avulsos (competência, valor bruto da NFS-e)',
        body: ui.chart.bar({ labels: ms.map((m) => mesC(m).slice(0, 3)), stacked: true, width: 580, height: 220, format: EIXO, series: [{ name: 'Honorários mensais', color: 'var(--chart-1)', values: feeV }, { name: 'Êxito', color: 'var(--chart-4)', values: exV }, { name: 'Avulsos', color: 'var(--chart-6)', values: avV }] }) });
      const i4 = 4, totNov = feeV[i4] + exV[i4] + avV[i4];
      const cardDonut = ui.card({ title: 'Receita de novembro', icon: 'pie', sub: 'Êxito representa ' + fmt.pct(100 * exV[i4] / totNov, 0) + ' do faturamento do mês',
        body: ui.chart.donut({ size: 168, centerValue: EIXO(totNov), centerLabel: 'faturados', format: (v) => fmt.moeda(v, true), items: [{ label: 'Honorários de êxito', value: exV[i4], color: 'var(--chart-4)' }, { label: 'Honorários mensais (9 contratos)', value: feeV[i4], color: 'var(--chart-1)' }, { label: 'Avulsos', value: avV[i4], color: 'var(--chart-6)' }] }) });

      const cardInad = ui.card({ title: 'Inadimplência', icon: 'alert-triangle', sub: 'Boleto (líquido) atualizado com multa de ' + ENC.multa + '% e juros de ' + ENC.juros + '% ao mês', flush: true,
        body: ui.table({ rows: venc, compact: true, rowHref: (r) => '#fin-conta-receber-' + r.c.id, empty: { icon: 'check-circle', title: 'Nenhum título vencido' }, columns: [
          { label: 'Cliente', key: 'cli', render: (r) => '<span class="lt-table__primary">' + esc(r.e.fantasia) + '</span><span class="lt-table__secondary">' + esc(r.c.descricao) + '</span>' },
          { label: 'Venceu', key: 'v', render: (r) => '<span class="lt-num">' + fmt.dataCurta(r.venc) + '</span><span class="lt-table__secondary lt-danger">há ' + atraso(r) + ' dias</span>' },
          { label: 'Atualizado', key: 'a', align: 'right', render: (r) => M(atualizado(LQ(r), atraso(r))) + '<span class="lt-table__secondary">boleto ' + fmt.moeda(LQ(r)) + ' · NFS-e ' + fmt.moeda(r.p.valor) + '</span>' }
        ], rowActions: (r) => ui.btn({ label: 'Cobrar', size: 'xs', variant: 'outline', icon: 'send', sheet: 'fin-enviar-boleto', attrs: { 'data-id': r.c.id, 'data-n': r.p.n, 'data-modo': 'cobranca' } }) }) });

      const fim7 = util.iso(util.addDias(HOJE, 7));
      const prox = R.filter((r) => isAberto(r) && r.sit !== 'fin_vencido' && r.vu <= fim7).map((r) => ({ r, tipo: 'r', v: LQ(r) })).concat(P.filter((r) => isAberto(r) && r.vu <= fim7).map((r) => ({ r, tipo: 'p', v: r.p.valor }))).sort((a, b) => a.r.vu.localeCompare(b.r.vu) || b.v - a.v);
      const proxR = soma(prox.filter((x) => x.tipo === 'r'), (x) => x.v), proxP = soma(prox.filter((x) => x.tipo === 'p'), (x) => x.v);
      const cardProx = ui.card({ title: 'Vence nos próximos 7 dias', icon: 'calendar-clock', sub: prox.length ? MC(proxR) + ' a receber (líquido) · ' + MC(proxP) + ' a pagar · ' + fmt.plural(prox.length, 'título') : '', flush: true,
        body: ui.list(prox.slice(0, 5).map((x) => ({ lead: ui.dateBox(x.r.vu, x.r.sit === 'fin_vencido' ? 'red' : x.r.vu === HOJE ? 'amber' : ''), title: esc(x.tipo === 'r' ? x.r.e.fantasia : x.r.nome) + ' <span class="lt-muted" style="font-weight:400">· ' + esc(x.tipo === 'r' ? TIPO_R[x.r.c.tipo][0] : x.r.c.sub) + '</span>', meta: ui.chip(x.tipo === 'r' ? 'Entrada' : 'Saída', x.tipo === 'r' ? 'green' : 'red', { icon: x.tipo === 'r' ? 'arrow-down' : 'arrow-up' }) + (x.r.sit === 'fin_vencido' ? ui.status('fin_vencido') : ''), aside: '<b class="lt-num" style="color:var(--text)">' + fmt.moeda(x.v) + '</b>', href: '#fin-conta-' + (x.tipo === 'r' ? 'receber-' : 'pagar-') + x.r.c.id })), { empty: { icon: 'check-circle', title: 'Nada vence nos próximos 7 dias' } }),
        foot: '<span class="lt-muted lt-small" style="margin-right:auto">' + (prox.length > 5 ? 'Mais ' + fmt.plural(prox.length - 5, 'título') : 'Todos listados') + '</span><a class="lt-btn lt-btn--ghost lt-btn--sm" href="#fin-fluxo-caixa">Ver todos os vencimentos' + I('arrow-right') + '</a>' });

      const contratos = D.contratos.filter((c) => c.status === 'ativo').sort((a, b) => b.creditoEstimado - a.creditoEstimado);
      const cardCred = ui.card({ title: 'Créditos recuperados × estimados', icon: 'target', sub: 'Em R$ · barra = crédito já compensado (PER/DCOMP); % = parte do estimado. O êxito é faturado conforme a compensação acontece.', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#fin-honorarios">Honorários e êxito</a>',
        body: ui.chart.funnel(contratos.map((c) => ({ label: emp(c.empresaId).fantasia + ' · ' + fmt.pct(100 * recuperado(c) / c.creditoEstimado, 0), value: recuperado(c), color: recuperado(c) ? 'var(--chart-4)' : '' })), { format: EIXO, max: Math.max.apply(null, contratos.map((c) => c.creditoEstimado)) }) });
      const rs = rNov.filter((r) => r.c.tipo !== 'reembolso' && r.sit !== 'fin_cancelado').map((r) => ({ r, t: RT(r), ok: r.sit === 'fin_recebido' }));
      const sR = (k, f) => soma(rs.filter(f || (() => true)), (x) => x.t[k]);
      const sK = (ks, f) => ks.reduce((a, k) => a + sR(k, f), 0);
      const retRows = [['IRRF 1,5%', ['irrf'], 'IRPJ do 4º trimestre'], ['CSLL 1%', ['csll'], 'CSLL do 4º trimestre'], ['PIS 0,65% e Cofins 3%', ['pis', 'cofins'], 'DARF de novembro'], ['ISS retido pelo tomador', ['iss'], 'guia municipal de novembro']].map((x) => ({ nome: x[0], abate: x[2], ja: sK(x[1], (y) => y.ok), tot: sK(x[1]) }));
      const cardRet = ui.card({ title: 'Retenções a compensar no mês', icon: 'shield', sub: 'Retidas pelos clientes nas NFS-e de novembro. Não são despesa: abatem as guias.', flush: true,
        body: ui.table({ rows: retRows, compact: true, columns: [
          { label: 'Retenção', key: 'nome', render: (x) => '<span class="lt-table__primary">' + esc(x.nome) + '</span>' },
          { label: 'Abate', key: 'abate', render: (x) => '<span class="lt-small lt-muted">' + esc(x.abate) + '</span>' },
          { label: 'Já retido', key: 'ja', align: 'right', render: (x) => x.ja ? M(x.ja) : '<span class="lt-muted">—</span>' },
          { label: 'No mês', key: 'tot', align: 'right', render: (x) => '<b class="lt-num">' + fmt.moeda(x.tot) + '</b>' }
        ], foot: ['<span class="lt-muted">Total</span>', '', M(soma(retRows, (x) => x.ja)), '<b class="lt-num">' + fmt.moeda(sR('total')) + '</b>'] }) });

      return header + fechamento + '<div class="lt-mt-4"></div>' + kpis +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c8">' + cardFluxo + '</div><div class="lt-c4">' + cardSaldos + '</div></div>' +
        '<div class="lt-g12 lt-mt-4"><div class="lt-c7">' + cardReceita + '</div><div class="lt-c5">' + cardDonut + '</div></div>' +
        '<div class="lt-g12 lt-mt-4"><div class="lt-c7 lt-stack">' + cardInad + cardRet + '</div><div class="lt-c5">' + cardProx + '</div></div>' +
        '<div class="lt-mt-4">' + cardCred + '</div>';
    },
    mount: (root) => on(root, 'lt:segment', (e) => { if (e.detail.name === 'fin-painel-periodo' && e.detail.value !== 'mes') ui.toast('Visão por ' + (e.detail.value === 'tri' ? 'trimestre' : 'ano'), 'info', 'No protótipo os números mostram o mês. A versão final soma o período escolhido.'); })
  });

  /* ================================================================== */
  /* CONTAS A RECEBER                                                     */
  /* ================================================================== */
  function stR() { const S = App.state.finR || (App.state.finR = { per: '2026-11', tipo: '', conta: '', chip: 'todos' }); S.busca = ''; return S; }
  function filtraR(S) {
    return rowsR().filter((r) => {
      if (S.chip === 'vencidos') { if (r.sit !== 'fin_vencido') return false; }
      else if (S.per && r.venc.slice(0, 7) !== S.per) return false;
      if (S.chip === 'avencer' && !(r.sit === 'fin_avencer' || r.sit === 'fin_hoje')) return false;
      if (S.chip === 'recebidos' && r.sit !== 'fin_recebido') return false;
      if (S.chip === 'semboleto' && r.bol !== 'fin_b_nao') return false;
      if (S.tipo && r.c.tipo !== S.tipo) return false;
      if (S.conta && String(r.c.contaId) !== String(S.conta)) return false;
      if (S.busca && norm(r.e.fantasia + ' ' + r.e.razao + ' ' + r.e.cnpj + ' ' + r.c.descricao).indexOf(norm(S.busca)) < 0) return false;
      return true;
    }).sort((a, b) => a.vu.localeCompare(b.vu) || a.e.fantasia.localeCompare(b.e.fantasia));
  }
  function kpisR(S) {
    const base = rowsR().filter((r) => !S.per || r.venc.slice(0, 7) === S.per);
    const av = base.filter((r) => r.sit === 'fin_avencer' || r.sit === 'fin_hoje'), rec = base.filter((r) => r.sit === 'fin_recebido'), venc = rowsR().filter((r) => r.sit === 'fin_vencido');
    return ui.kpis([
      { label: 'Todos os lançamentos', value: fmt.moeda(soma(base, (r) => r.p.valor)), icon: 'list', foot: 'bruto das NFS-e · ' + fmt.plural(base.length, 'parcela') + ' · ' + (S.per ? mesC(S.per) : 'todos os períodos') },
      { label: 'A vencer', value: fmt.moeda(soma(av, (r) => r.p.valor)), icon: 'clock', foot: MC(soma(av, LQ)) + ' líquido · ' + fmt.plural(av.length, 'título') + (av.filter((r) => r.bol === 'fin_b_nao').length ? ' · ' + av.filter((r) => r.bol === 'fin_b_nao').length + ' sem boleto' : '') },
      { label: 'Recebidos (líquido)', value: fmt.moeda(soma(rec, valorPago)), icon: 'check-circle', foot: fmt.plural(rec.length, 'título') + ' · ' + MC(soma(rec, (r) => RT(r).total)) + ' retidos na fonte' },
      { label: 'Vencidos', value: fmt.moeda(soma(venc, (r) => r.p.valor)), icon: 'alert-triangle', foot: fmt.plural(venc.length, 'título') + ' · todos os meses' }
    ]);
  }
  function vencCellR(r) {
    let s = '<span class="lt-num" style="white-space:nowrap">' + fmt.data(r.venc) + '</span>';
    if (r.sit === 'fin_recebido') s += '<span class="lt-table__secondary">recebido em ' + fmt.dataCurta(r.p.recebidoEm) + '</span>';
    else if (r.sit === 'fin_vencido') s += '<span class="lt-table__secondary lt-danger">há ' + atraso(r) + ' dias</span>';
    else if (r.vu !== r.venc) { const f = util.feriado(r.venc); s += '<span class="lt-table__secondary" title="' + esc(f ? f.nome : fmt.diaSemana(r.venc)) + '">pagável em ' + fmt.dataCurta(r.vu) + '</span>'; }
    return s;
  }
  function acoesR(r) {
    let s = '';
    if (isAberto(r)) s += ui.btn({ icon: 'check', variant: 'ghost', size: 'xs', tip: 'Registrar recebimento', sheet: 'fin-baixa', attrs: { 'data-t': 'r', 'data-id': r.c.id, 'data-n': r.p.n } });
    if (r.bol === 'fin_b_nao') s += ui.btn({ icon: 'receipt', variant: 'ghost', size: 'xs', tip: 'Gerar boleto', dialog: 'fin-gerar-boletos', attrs: { 'data-keys': r.key } });
    else if (r.bol && r.bol !== 'fin_b_pago') s += ui.btn({ icon: 'mail', variant: 'ghost', size: 'xs', tip: r.sit === 'fin_vencido' ? 'Enviar cobrança' : 'Enviar boleto por e-mail', sheet: 'fin-enviar-boleto', attrs: { 'data-id': r.c.id, 'data-n': r.p.n, 'data-modo': r.sit === 'fin_vencido' ? 'cobranca' : 'envio' } });
    s += ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar lançamento', href: '#fin-lancamento-' + r.c.id });
    return s;
  }
  function tabelaR(rows) {
    return ui.table({
      rows, selectable: true, pageSize: 10, rowHref: (r) => '#fin-conta-receber-' + r.c.id,
      empty: { icon: 'receipt', title: 'Nenhum título neste filtro', text: 'Troque o período ou limpe os filtros.' },
      bulk: ui.btn({ label: 'Gerar boletos', icon: 'receipt', size: 'xs', variant: 'outline', attrs: { 'data-fin-lote': 'boletos' } }) +
        ui.btn({ label: 'Enviar por e-mail', icon: 'send', size: 'xs', variant: 'outline', acao: 'enviar', toast: 'Boletos reenviados', toastText: 'O contato de cobrança de cada cliente recebeu o boleto e a NFS-e.' }) +
        ui.btn({ label: EXPORTAR, icon: 'download', size: 'xs', variant: 'ghost', acao: 'exportar', toast: 'Planilha exportada', toastText: 'contas-a-receber.xlsx' }),
      columns: [
        { label: 'Cliente / descrição', key: 'cli', sortable: true, value: (r) => r.e.fantasia, render: (r) => '<span class="lt-table__primary">' + esc(r.e.fantasia) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:290px" title="' + esc(r.c.descricao) + '">' + esc(r.c.descricao) + '</span>' },
        { label: 'Tipo', key: 'tipo', render: (r) => tipoChipR(r.c.tipo) },
        { label: 'Vencimento', key: 'venc', sortable: true, value: (r) => r.vu, render: vencCellR },
        { label: 'Parc.', key: 'parc', align: 'center', render: (r) => '<span class="lt-num">' + r.p.n + '/' + r.c.parcelas.length + '</span>' },
        { label: 'Valor bruto', key: 'valor', align: 'right', sortable: true, value: (r) => r.p.valor, render: (r) => M(r.p.valor) + liqSec(r) },
        { label: 'Boleto', key: 'bol', render: (r) => r.bol ? ui.status(r.bol) : '<span class="lt-muted lt-small">' + esc(formaNome(r.c.forma)) + '</span>' },
        { label: 'Situação', key: 'sit', sortable: true, value: (r) => r.sit, render: (r) => ui.status(r.sit) }
      ],
      foot: ['<span class="lt-muted">Total</span>', '', '', '', M(soma(rows, (r) => r.p.valor)), '', ''],
      rowActions: acoesR
    });
  }
  App.screen({
    id: 'fin.receivable.list', hash: 'fin-receber', module: 'financeiro', title: 'Contas a receber', nav: true, navGroup: 'financeiro', navOrder: 2,
    render: () => {
      const S = stR(), rows = filtraR(S), venc = rowsR().filter((r) => r.sit === 'fin_vencido'), semBol = rowsR().filter((r) => r.bol === 'fin_b_nao' && r.venc.slice(0, 7) === '2026-11');
      return ui.pageHeader({ breadcrumb: crumb('Contas a receber'), title: 'Contas a receber', sub: 'Honorários mensais, êxito sobre créditos compensados, avulsos e reembolsos de custas. Cada linha é uma parcela; valor bruto da NFS-e e, abaixo, o líquido do boleto.',
          actions: ui.btn({ label: 'Gerar boletos (' + semBol.length + ')', icon: 'receipt', dialog: 'fin-gerar-boletos' }) + ui.btn({ label: 'Nova conta a receber', icon: 'plus', variant: 'primary', sheet: 'fin-nova-conta-receber' }) }) +
        (venc.length ? ui.callout({ tone: 'danger', title: fmt.plural(venc.length, 'título vencido', 'títulos vencidos') + (venc.length === 1 ? ' soma ' : ' somam ') + fmt.moeda(soma(venc, (r) => r.p.valor)), text: venc.map((r) => esc(r.e.fantasia) + ' (' + esc(TIPO_R[r.c.tipo][0].toLowerCase()) + ' ' + esc(mesC(r.c.competencia)) + ', ' + atraso(r) + ' dias)').join(' e ') + '. A automação FIN-02 já criou as tarefas de cobrança.', actions: '<button type="button" class="lt-btn lt-btn--sm lt-btn--outline" data-fin-ver-vencidos>' + I('filter') + '<span>Ver vencidos</span></button>' }) + '<div class="lt-mt-4"></div>' : '') +
        '<div data-fin-kpis>' + kpisR(S) + '</div><div class="lt-mt-6"></div>' +
        ui.filters({ busca: 'Buscar cliente ou CNPJ', selects: [{ label: 'Período', name: 'f-per', options: PERIODOS, value: S.per }, { label: 'Tipo', name: 'f-tipo', value: S.tipo, options: Object.keys(TIPO_R).map((k) => ({ value: k, label: TIPO_R[k][0] })) }, { label: 'Conta', name: 'f-conta', value: S.conta, options: F.contas.map((c) => ({ value: c.id, label: BANCO_CURTO[c.id] + ' · ' + c.apelido })) }],
          chipGroup: 'single', chips: [{ label: 'Todos', value: 'todos', active: S.chip === 'todos' }, { label: 'A vencer', value: 'avencer', tone: 'blue', active: S.chip === 'avencer' }, { label: 'Vencidos', value: 'vencidos', tone: 'red', count: venc.length, active: S.chip === 'vencidos' }, { label: 'Recebidos', value: 'recebidos', tone: 'green', active: S.chip === 'recebidos' }, { label: 'Sem boleto', value: 'semboleto', tone: 'gray', active: S.chip === 'semboleto' }] }) +
        '<div data-fin-lista>' + tabelaR(rows) + '</div>';
    },
    mount: (root) => {
      const S = stR(); let rows = filtraR(S);
      const redraw = () => { rows = filtraR(S); root.querySelector('[data-fin-kpis]').innerHTML = kpisR(S); const box = root.querySelector('[data-fin-lista]'); box.innerHTML = tabelaR(rows); ui.enhance(box); };
      bindFiltros(root, S, redraw);
      on(root, 'click', (e) => {
        const b = e.target.closest('[data-fin-lote]');
        if (b) { const sel = selecionados(b, rows); ui.openDialog('fin-gerar-boletos', { keys: sel.map((r) => r.key).join(',') }); return; }
        if (e.target.closest('[data-fin-ver-vencidos]')) { S.chip = 'vencidos'; ativarChip(root, 'vencidos'); redraw(); }
      });
    }
  });

  /* ---------- Ficha da conta a receber ---------- */
  function boletoCard(c, p) {
    const e = emp(c.empresaId), b = bolR(c, p), r = rowR(c.id, p.n), rt = RTc(c, p), lq = rt.liquido;
    if (b === 'fin_b_nao') return ui.empty({ icon: 'receipt', title: 'Parcela ' + p.n + ' ainda sem boleto', text: 'Gere o boleto pela integração de cobrança. A NFS-e é emitida junto e os dois seguem por e-mail ao contato de cobrança. O boleto sai pelo valor líquido de retenções.', action: ui.btn({ label: 'Gerar boleto', icon: 'receipt', variant: 'primary', dialog: 'fin-gerar-boletos', attrs: { 'data-keys': c.id + '-' + p.n } }) });
    if (!b) return ui.callout({ tone: 'info', title: 'Recebido por ' + esc(formaNome(c.forma)), text: 'Este título não usa boleto. Recebido em ' + fmt.data(p.recebidoEm) + ' na conta ' + esc(contaNome(p.contaId || c.contaId)) + '.' });
    const dias = r ? Math.max(0, atraso(r)) : 0;
    return '<div class="fin-boleto">' +
      '<div class="lt-row lt-row--between"><span class="lt-row" style="gap:10px">' + bankTile(2) + '<span><span class="lt-strong" style="display:block">Itaú Unibanco · 341</span><span class="lt-hint">Carteira ' + ENC.carteira + ' · integração de cobrança</span></span></span>' + ui.status(b, { lg: true }) + '</div>' +
      '<div><div class="lt-label-caps" style="margin-bottom:4px">Linha digitável</div><div class="fin-boleto__linha">' + linhaDig(c, p) + '</div></div>' +
      '<div class="fin-barcode" role="img" aria-label="Código de barras (ilustrativo)"></div>' +
      ui.dl([['Beneficiário', esc(ATLAS.razao) + '<span class="lt-hint" style="display:block">' + ATLAS.cnpj + '</span>'], ['Pagador', esc(e.razao) + '<span class="lt-hint" style="display:block">' + esc(e.cnpj) + '</span>'], ['Vencimento', fmt.data(vu(p.venc)) + (vu(p.venc) !== p.venc ? ' <span class="lt-hint">(original ' + fmt.dataCurta(p.venc) + ', dia não útil)</span>' : '')],
        ['Valor do boleto', M(lq) + (dias ? ' <span class="lt-danger lt-small">· atualizado ' + fmt.moeda(atualizado(lq, dias)) + '</span>' : '') + (rt.total ? '<span class="lt-hint" style="display:block">NFS-e de ' + fmt.moeda(p.valor) + ' menos ' + fmt.moeda(rt.total) + ' retidos na fonte</span>' : '')], ['Nosso número', '<span class="lt-mono">' + nossoNumero(c, p) + '</span>'], ['Encargos após o vencimento', 'Multa de ' + ENC.multa + '% e juros de ' + ENC.juros + '% ao mês']]) +
      '<div class="lt-row">' + '<button type="button" class="lt-btn lt-btn--outline lt-btn--sm" data-copy="' + esc(linhaDig(c, p).replace(/[ .]/g, '')) + '" data-copy-label="Linha digitável copiada">' + I('copy') + '<span>Copiar linha digitável</span></button>' +
      '<button type="button" class="lt-btn lt-btn--outline lt-btn--sm" data-copy="' + esc(pixCopia(c, p)) + '" data-copy-label="PIX copia e cola copiado">' + I('copy') + '<span>Copiar PIX</span></button>' +
      ui.btn({ label: 'Baixar PDF', icon: 'download', size: 'sm', variant: 'outline', acao: 'exportar', loading: 'Gerando PDF…', toast: 'PDF do boleto baixado', toastText: 'boleto-' + c.id + '-' + p.n + '.pdf' }) +
      (b !== 'fin_b_pago' ? ui.btn({ label: '2ª via', icon: 'refresh', size: 'sm', variant: 'outline', dialog: 'fin-segunda-via', attrs: { 'data-id': c.id, 'data-n': p.n } }) + ui.btn({ label: 'Cancelar boleto', icon: 'x', size: 'sm', variant: 'danger-outline', acao: 'excluir', confirm: 'Cancelar o boleto da parcela ' + p.n + '?', confirmText: 'O boleto é baixado na integração e deixa de ser pagável. O título continua em aberto.', confirmLabel: 'Cancelar boleto', toast: 'Boleto cancelado na integração' }) : '') + '</div></div>';
  }
  /* Card de retenções na fonte de um título (soma das parcelas) */
  function retencoesCard(c) {
    const ts = c.parcelas.filter((p) => p.status !== 'cancelado').map((p) => RTc(c, p)), sm = (k) => soma(ts, (t) => t[k]), bruto = soma(c.parcelas.filter((p) => p.status !== 'cancelado'), (p) => p.valor), A = F.retencaoAliq;
    if (!ts.length || !ts[0].servico) return ui.card({ title: 'Retenções na fonte', icon: 'shield', body: '<p class="lt-hint">Reembolso de custas não é prestação de serviço: sem NFS-e e sem retenções.</p>' });
    const iss = ts[0].issRetido;
    return ui.card({ title: 'NFS-e e retenções', icon: 'shield', sub: 'Tomador ' + esc(emp(c.empresaId).regime || 'PJ') + ' · retenção feita pelo cliente no pagamento', flush: true,
      body: '<table class="lt-trail fin-ret" style="margin:0"><tbody>' +
        [['Valor da NFS-e (bruto)', bruto, ''], ['IRRF ' + fmt.pct(A.irrf, 1), sm('irrf'), 'RIR/2018, art. 714'], ['CSLL ' + fmt.pct(A.csll, 0), sm('csll'), 'Lei 10.833/2003, art. 30'], ['PIS ' + fmt.pct(A.pis, 2), sm('pis'), 'idem'], ['Cofins ' + fmt.pct(A.cofins, 0), sm('cofins'), 'idem'], ['ISS ' + fmt.pct(A.iss, 0) + (iss ? ' retido pelo tomador' : ' recolhido pela Atlas'), iss ? sm('iss') : 0, iss ? 'responsável tributário' : fmt.moeda(sm('issValor')) + ' na guia municipal']]
          .map((x, i) => '<tr><td>' + (i ? '<span class="lt-muted">(−)</span> ' : '') + esc(x[0]) + (x[2] ? '<span class="lt-hint" style="display:block">' + esc(x[2]) + '</span>' : '') + '</td><td class="lt-num fin-r">' + fmt.moeda(x[1]) + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td class="lt-strong">Líquido (boletos)</td><td class="lt-num lt-strong fin-r">' + fmt.moeda(sm('liquido')) + '</td></tr></tfoot></table>',
      foot: '<span class="lt-hint">IRRF, CSLL, PIS e Cofins retidos ficam em "Tributos retidos a compensar" e abatem as guias.</span>' });
  }
  App.screen({
    id: 'fin.receivable.detail', hash: 'fin-conta-receber', module: 'financeiro', title: 'Conta a receber', nav: false, navGroup: 'financeiro', navParent: 'fin-receber', exemplo: 12103,
    render: (params) => {
      const c = F.receberConta(params.id);
      if (!c) return ui.pageHeader({ breadcrumb: crumb('Não encontrado', [{ label: 'Contas a receber', hash: 'fin-receber' }]), title: 'Título não encontrado' }) + ui.empty({ icon: 'receipt', title: 'Não existe conta a receber #' + esc(params.id), action: '<a class="lt-btn lt-btn--primary" href="#fin-receber">Voltar para contas a receber</a>' });
      const e = emp(c.empresaId), ct = c.contratoId ? db.contrato(c.contratoId) : null, proc = c.processoId ? procF(c.processoId) : null;
      const rows = rowsR().filter((r) => r.c.id === c.id), vivas = rows.filter((r) => r.sit !== 'fin_cancelado'), tot = soma(vivas, (r) => r.p.valor), rec = soma(rows.filter((r) => r.sit === 'fin_recebido'), valorPago), venc = rows.filter((r) => r.sit === 'fin_vencido');
      const prox = proxAbertaR(c), foco = prox || c.parcelas[c.parcelas.length - 1];
      const sitConta = rows.every((r) => r.sit === 'fin_cancelado') ? 'fin_cancelado' : venc.length ? 'fin_vencido' : vivas.every((r) => r.sit === 'fin_recebido') ? 'fin_recebido' : 'fin_avencer';
      const pl = F.plano(c.cat, c.sub);
      const header = ui.pageHeader({
        breadcrumb: crumb('#' + c.id, [{ label: 'Contas a receber', hash: 'fin-receber' }]), eyebrow: 'Conta a receber #' + c.id, title: e.fantasia + ' · ' + TIPO_R[c.tipo][0],
        sub: esc(c.descricao), meta: tipoChipR(c.tipo) + ui.status(sitConta) + (ct ? ui.chip('Contrato #' + ct.id, 'slate', { icon: 'file-text' }) : '') + ui.chip('Competência ' + mesC(c.competencia), 'gray'),
        actions: (prox ? ui.btn({ label: 'Cancelar título', icon: 'x-circle', variant: 'ghost', dialog: 'fin-cancelar-titulo', attrs: { 'data-t': 'r', 'data-id': c.id } }) : '') + ui.btn({ label: 'Editar', icon: 'edit', href: '#fin-lancamento-' + c.id }) + (prox && bolR(c, prox) && bolR(c, prox) !== 'fin_b_nao' ? ui.btn({ label: venc.length ? 'Enviar cobrança' : 'Enviar por e-mail', icon: 'send', sheet: 'fin-enviar-boleto', attrs: { 'data-id': c.id, 'data-n': prox.n, 'data-modo': venc.length ? 'cobranca' : 'envio' } }) : '') + (prox ? ui.btn({ label: 'Registrar recebimento', icon: 'check', variant: 'primary', sheet: 'fin-baixa', attrs: { 'data-t': 'r', 'data-id': c.id, 'data-n': prox.n } }) : '')
      });
      const retT = soma(vivas, (r) => RT(r).total), abertoL = soma(vivas.filter(isAberto), LQ);
      const resumo = ui.summary([{ label: 'Valor bruto (NFS-e)', value: M(tot) }, { label: 'Retenções na fonte (−)', value: retT ? M(retT) : '<span class="lt-muted">—</span>' }, { label: 'Líquido', value: M(tot - retT) }, { label: 'Recebido', value: M(rec) + '<span class="lt-hint" style="display:block">' + rows.filter((r) => r.sit === 'fin_recebido').length + ' de ' + fmt.plural(vivas.length, 'parcela') + '</span>' }, { label: venc.length ? 'Em aberto · vencido' : 'Em aberto', value: abertoL ? M(abertoL, venc.length ? 'lt-danger' : '') : '<span class="lt-muted">—</span>' }]);
      const tParcelas = ui.table({ rows, compact: true, columns: [
        { label: 'Nº', key: 'n', render: (r) => '<span class="lt-num">' + r.p.n + '/' + rows.length + '</span>' },
        { label: 'Vencimento', key: 'v', render: vencCellR },
        { label: 'Valor bruto', key: 'valor', align: 'right', render: (r) => M(r.p.valor) + liqSec(r) },
        { label: 'Boleto', key: 'b', render: (r) => r.bol ? ui.status(r.bol) : '<span class="lt-muted lt-small">' + esc(formaNome(c.forma)) + '</span>' },
        { label: 'Situação', key: 's', render: (r) => ui.status(r.sit) },
        { label: 'Recebido', key: 'rv', align: 'right', render: (r) => r.p.status === 'recebido' ? M(r.p.valorRecebido) + (r.p.juros ? '<span class="lt-table__secondary">+ ' + fmt.moeda(r.p.juros) + ' encargos</span>' : '') : '<span class="lt-muted">—</span>' }
      ], rowActions: (r) => (isAberto(r) ? ui.btn({ icon: 'check', variant: 'ghost', size: 'xs', tip: 'Registrar recebimento', sheet: 'fin-baixa', attrs: { 'data-t': 'r', 'data-id': c.id, 'data-n': r.p.n } }) : '') + (r.sit === 'fin_recebido' ? ui.btn({ icon: 'history', variant: 'ghost', size: 'xs', tip: 'Desfazer baixa', dialog: 'fin-desfazer-baixa', attrs: { 'data-t': 'r', 'data-id': c.id, 'data-n': r.p.n } }) : '') + (r.bol === 'fin_b_nao' ? ui.btn({ icon: 'receipt', variant: 'ghost', size: 'xs', tip: 'Gerar boleto', dialog: 'fin-gerar-boletos', attrs: { 'data-keys': r.key } }) : r.bol && r.bol !== 'fin_b_pago' && r.bol !== 'fin_b_cancelado' ? ui.btn({ icon: 'refresh', variant: 'ghost', size: 'xs', tip: '2ª via', dialog: 'fin-segunda-via', attrs: { 'data-id': c.id, 'data-n': r.p.n } }) + ui.btn({ icon: 'mail', variant: 'ghost', size: 'xs', tip: 'Enviar por e-mail', sheet: 'fin-enviar-boleto', attrs: { 'data-id': c.id, 'data-n': r.p.n } }) : '') });
      const tabs = [
        { key: 'parcelas', label: 'Parcelas', icon: 'list', count: rows.length, content: tParcelas + (c.acordo ? '<div class="lt-mt-4">' + ui.callout({ tone: 'gold', icon: 'file-text', title: 'Acordo de pagamento', text: esc(c.acordo) }) + '</div>' : '') },
        { key: 'boleto', label: 'Boleto', icon: 'receipt', content: '<div class="lt-hint lt-mb-4">Parcela ' + foco.n + ' de ' + c.parcelas.length + (prox ? ' (próxima em aberto)' : '') + '</div>' + boletoCard(c, foco) }
      ];
      if (c.tipo === 'exito' && ct) {
        const comps = F.compensacoesDo(ct.id).filter((x) => x.situacao === 'realizada');
        tabs.push({ key: 'calculo', label: 'Cálculo do êxito', icon: 'calculator', content: ui.callout({ tone: 'gold', icon: 'calculator', title: 'Base ' + fmt.moeda(c.base) + ' × ' + fmt.pct(c.exitoPct) + ' = ' + fmt.moeda(c.base * c.exitoPct / 100), text: 'O êxito é cobrado sobre o crédito efetivamente compensado (PER/DCOMP transmitido no processo que reconheceu o crédito), conforme o contrato de honorários.' }) +
          '<div class="lt-mt-4">' + ui.dl([['Contrato', 'Contrato #' + ct.id + ' · desde ' + fmt.data(ct.inicio)], ['Percentual de êxito', fmt.pct(ct.exitoPct)], ['Crédito compensado (base)', M(c.base)], ['PER/DCOMP', c.perdcomp ? '<span class="lt-mono">' + esc(c.perdcomp) + '</span>' : '—'], ['Processo', proc ? '<a href="#jur-processo-' + proc.id + '">' + esc(proc.numero) + '</a><span class="lt-hint" style="display:block">' + esc(proc.tese) + ' · ' + esc(etapaJ(proc.etapa)) + '</span>' : '—'], ['Crédito recuperado no contrato', M(recuperado(ct)) + ' de ' + fmt.moeda(ct.creditoEstimado) + ' estimados']]) + '</div>' +
          '<div class="lt-label-caps lt-mt-6" style="margin-bottom:8px">Compensações deste contrato</div>' +
          '<table class="lt-trail"><thead><tr><th>Competência</th><th>PER/DCOMP</th><th>Processo</th><th style="text-align:right">Compensado</th><th style="text-align:right">Êxito</th><th>Título</th></tr></thead><tbody>' + comps.map((x) => { const px = procF(x.processoId); return '<tr><td>' + esc(F.compLabel(x)) + '</td><td class="lt-mono">' + esc(x.perdcomp || '—') + '</td><td class="lt-small">' + (px ? '<a href="#jur-processo-' + px.id + '">' + esc(px.numero) + '</a>' : '—') + '</td><td class="lt-num fin-r">' + fmt.moeda(x.valor) + '</td><td class="lt-num fin-r">' + fmt.moeda(x.valor * ct.exitoPct / 100) + '</td><td>' + (x.tituloId ? (x.tituloId === c.id ? '<b>este título</b>' : '<a href="#fin-conta-receber-' + x.tituloId + '">#' + x.tituloId + '</a>') : '<span class="lt-muted">' + (x.consolidado ? 'consolidado' : 'histórico') + '</span>') + '</td></tr>'; }).join('') + '</tbody></table>' });
      }
      tabs.push({ key: 'historico', label: 'Histórico', icon: 'history', content: historicoR(c) });
      const execs = (D.fluxoExecucoes || []).filter((x) => x.fluxoId === 17 || x.fluxoId === 18);
      tabs.push({ key: 'automacoes', label: 'Automações', icon: 'workflow', content: ui.list([{ icon: 'zap', tone: 'violet', title: 'FIN-01 · Gerar honorários mensais', meta: 'Todo dia 1º às 06:00 · cria o título e a tarefa "Emitir boletos"', href: '#fluxos' }, { icon: 'zap', tone: 'violet', title: 'FIN-02 · Cobrança de honorário vencido', meta: 'Diário às 06:00 · título vencido há 3 dias → tarefa de cobrança e aviso ao sócio', href: '#fluxos' }].concat(execs.map((x) => ({ icon: x.estado === 'rodou' ? 'check-circle' : 'minus-circle', tone: x.estado === 'rodou' ? 'green' : 'gray', title: 'Execução de ' + fmt.dataHora(x.quando), meta: esc((x.registro || {}).label || ''), href: '#fluxos-execucao-' + x.id })))) });

      const contatos = contatosCobranca(c.empresaId).slice(0, 3);
      const right = ui.card({ title: 'Resumo', icon: 'file-text', body: ui.dl([
          ['Cliente', '<a href="#crm-empresa-' + e.id + '">' + esc(e.razao) + '</a>'], ['CNPJ', '<span class="lt-num">' + esc(e.cnpj) + '</span>'],
          ['Contrato', ct ? 'Honorário mensal de ' + fmt.moeda(ct.honorarioMensal) + ' (dia ' + ct.diaVencimento + ') + ' + fmt.pct(ct.exitoPct) + ' de êxito' : 'Sem contrato (avulso)'],
          ['Plano de contas', esc(c.sub) + '<span class="lt-hint" style="display:block">' + esc((F.cat(c.cat) || {}).nome) + (pl ? ' · ' + pl.cod : '') + '</span>'], ['Tipo DRE', dreChip(pl && pl.tipoDre)],
          ['Centro de custo', esc(c.centro)], ['Forma', esc(formaNome(c.forma))], ['Conta de recebimento', esc(contaNome(c.contaId))], ['Origem', esc(c.origem)]
        ]) }) +
        retencoesCard(c) +
        ui.card({ title: 'Contato de cobrança', icon: 'users', flush: true, body: ui.list(contatos.map((x) => ({ lead: ui.avatar(x.nome, 'sm'), title: esc(x.nome) + (x.decisor ? ' ' + ui.chip('Decisor', 'gold') : ''), meta: esc(x.cargo) + ' · ' + esc(x.email) }))) }) +
        (venc.length ? ui.callout({ tone: 'danger', title: 'Vencido há ' + atraso(venc[0]) + ' dias', text: 'Boleto atualizado: <b>' + fmt.moeda(atualizado(LQ(venc[0]), atraso(venc[0]))) + '</b> (multa de ' + ENC.multa + '% e juros de ' + ENC.juros + '% ao mês sobre o líquido).', actions: ui.btn({ label: '2ª via', size: 'sm', variant: 'outline', dialog: 'fin-segunda-via', attrs: { 'data-id': c.id, 'data-n': venc[0].p.n } }) }) : '');
      return header + resumo + '<div class="lt-split lt-mt-6"><div style="min-width:0">' + ui.card({ body: ui.tabs({ id: 'fin-receber-ficha', tabs }) }) + '</div><div class="lt-stack">' + right + '</div></div>';
    }
  });

  /* ================================================================== */
  /* CONTAS A PAGAR                                                       */
  /* ================================================================== */
  function stP() { const S = App.state.finP || (App.state.finP = { per: '2026-11', tipo: '', cat: '', centro: '', chip: 'todos' }); S.busca = ''; return S; }
  function filtraP(S, soAdm) {
    return rowsP().filter((r) => {
      if (soAdm && r.c.tipo !== 'adm') return false;
      if (S.chip === 'vencidos') { if (r.sit !== 'fin_vencido') return false; }
      else if (S.per && r.venc.slice(0, 7) !== S.per) return false;
      if (S.chip === 'avencer' && !(r.sit === 'fin_avencer' || r.sit === 'fin_hoje')) return false;
      if (S.chip === 'pagos' && r.sit !== 'fin_pago') return false;
      if (S.tipo && r.c.tipo !== S.tipo) return false;
      if (S.cat && r.c.cat !== S.cat) return false;
      if (S.centro && r.c.centro !== S.centro) return false;
      if (S.busca && norm(r.nome + ' ' + (r.f ? r.f.razao + ' ' + r.f.cnpj : '') + ' ' + r.c.descricao + ' ' + r.c.sub).indexOf(norm(S.busca)) < 0) return false;
      return true;
    }).sort((a, b) => a.vu.localeCompare(b.vu) || b.p.valor - a.p.valor);
  }
  function kpisP(S, soAdm) {
    const base = rowsP().filter((r) => (!soAdm || r.c.tipo === 'adm') && (!S.per || r.venc.slice(0, 7) === S.per));
    const av = base.filter((r) => r.sit === 'fin_avencer' || r.sit === 'fin_hoje'), pg = base.filter((r) => r.sit === 'fin_pago'), venc = rowsP().filter((r) => (!soAdm || r.c.tipo === 'adm') && r.sit === 'fin_vencido');
    return ui.kpis([
      { label: 'Todos os lançamentos', value: fmt.moeda(soma(base, (r) => r.p.valor)), icon: 'list', foot: fmt.plural(base.length, 'parcela') + ' · ' + (S.per ? mesC(S.per) : 'todos os períodos') },
      { label: 'A pagar', value: fmt.moeda(soma(av, (r) => r.p.valor)), icon: 'clock', foot: fmt.plural(av.length, 'parcela') + ' a vencer' },
      { label: 'Pagos', value: fmt.moeda(soma(pg, (r) => r.p.valor)), icon: 'check-circle', foot: fmt.plural(pg.length, 'parcela') },
      { label: 'Vencidos', value: fmt.moeda(soma(venc, (r) => r.p.valor)), icon: 'alert-triangle', foot: venc.length ? fmt.plural(venc.length, 'parcela') + ' · pagar hoje' : 'nada atrasado' }
    ]);
  }
  function vencCellP(r) {
    let s = '<span class="lt-num" style="white-space:nowrap">' + fmt.data(r.venc) + '</span>';
    if (r.sit === 'fin_pago') s += '<span class="lt-table__secondary">pago em ' + fmt.dataCurta(r.p.pagoEm) + '</span>';
    else if (r.sit === 'fin_vencido') s += '<span class="lt-table__secondary lt-danger">há ' + atraso(r) + ' dias</span>';
    else if (r.vu !== r.venc) s += '<span class="lt-table__secondary">pagável em ' + fmt.dataCurta(r.vu) + '</span>';
    return s;
  }
  function tabelaP(rows, adm) {
    const cols = [];
    if (!adm) cols.push({ label: 'Tipo', key: 'tipo', render: (r) => tipoChipP(r.c.tipo) });
    cols.push({ label: adm ? 'Recebedor / descrição' : 'Fornecedor / descrição', key: 'f', sortable: true, value: (r) => r.nome, render: (r) => '<span class="lt-table__primary lt-truncate" style="display:block;max-width:220px">' + esc(r.nome) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:220px" title="' + esc(r.c.descricao) + '">' + esc(r.c.descricao) + '</span>' });
    cols.push({ label: 'Categoria · centro', key: 'cat', sortable: true, value: (r) => r.c.cat + r.c.sub, render: (r) => '<span class="lt-truncate" style="display:block;max-width:170px" title="' + esc(r.c.sub) + '">' + esc(r.c.sub) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:170px" title="' + esc((F.cat(r.c.cat) || {}).nome) + '">' + esc(r.c.centro) + (r.c.processoId ? ' · processo' : '') + '</span>' });
    cols.push({ label: 'Vencimento', key: 'venc', sortable: true, value: (r) => r.vu, render: vencCellP });
    cols.push({ label: 'Nº', key: 'n', align: 'center', render: (r) => '<span class="lt-num">' + r.p.n + '/' + r.c.parcelas.length + '</span>' });
    cols.push({ label: 'Valor', key: 'valor', align: 'right', sortable: true, value: (r) => r.p.valor, render: (r) => M(r.p.valor) + '<span class="lt-table__secondary" style="white-space:nowrap">' + esc(FORMA_CURTA[r.c.forma] || '') + ' · ' + BANCO_CURTO[r.p.contaId || r.c.contaId] + '</span>' });
    cols.push({ label: 'Situação', key: 'sit', sortable: true, value: (r) => r.sit, render: (r) => ui.status(r.sit) });
    const foot = cols.map((c) => c.key === 'valor' ? M(soma(rows, (r) => r.p.valor)) : '');
    foot[0] = '<span class="lt-muted">Total</span>';
    return ui.table({
      rows, selectable: true, pageSize: 10, rowHref: (r) => '#fin-conta-pagar-' + r.c.id,
      empty: { icon: 'wallet', title: 'Nada a pagar neste filtro', text: 'Troque o período ou limpe os filtros.' },
      bulk: ui.btn({ label: 'Registrar pagamento', icon: 'check', size: 'xs', variant: 'outline', acao: 'registrar', toast: 'Pagamentos registrados', toastText: 'As parcelas selecionadas foram baixadas na conta movimento.' }) + ui.btn({ label: EXPORTAR, icon: 'download', size: 'xs', variant: 'ghost', acao: 'exportar', toast: 'Planilha exportada', toastText: 'contas-a-pagar.xlsx' }) + ui.btn({ label: 'Excluir', icon: 'trash', size: 'xs', variant: 'danger-outline', acao: 'excluir', confirm: 'Excluir as parcelas selecionadas?', confirmText: 'Saem do contas a pagar e do fluxo de caixa. A exclusão fica registrada na auditoria.', confirmLabel: 'Excluir parcelas', toast: 'Parcelas excluídas' }),
      columns: cols, foot,
      rowActions: (r) => (isAberto(r) ? ui.btn({ icon: 'check', variant: 'ghost', size: 'xs', tip: 'Registrar pagamento', sheet: 'fin-baixa', attrs: { 'data-t': 'p', 'data-id': r.c.id, 'data-n': r.p.n } }) : '') + ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar', href: '#fin-lancamento-' + r.c.id })
    });
  }
  App.screen({
    id: 'fin.payable.list', hash: 'fin-pagar', module: 'financeiro', title: 'Contas a pagar', nav: true, navGroup: 'financeiro', navOrder: 3,
    render: () => {
      const S = stP(), rows = filtraP(S), venc = rowsP().filter((r) => r.sit === 'fin_vencido');
      return ui.pageHeader({ breadcrumb: crumb('Contas a pagar'), title: 'Contas a pagar', sub: 'Custos diretos de clientes e processos (custas, perícias, correspondentes, comissões) e custos administrativos do escritório.',
          actions: ui.btn({ label: 'Importar NF (XML)', icon: 'upload', href: '#fin-importar-nota' }) + ui.btn({ label: 'Custo adm', icon: 'plus', sheet: 'fin-novo-custo-adm' }) + ui.btn({ label: 'Conta a pagar', icon: 'plus', variant: 'primary', sheet: 'fin-nova-conta-pagar' }) }) +
        (venc.length ? ui.callout({ tone: 'danger', title: fmt.plural(venc.length, 'parcela vencida', 'parcelas vencidas') + ': ' + fmt.moeda(soma(venc, (r) => r.p.valor)), text: venc.map((r) => esc(r.nome) + ' · ' + esc(r.c.descricao) + ' (venceu em ' + fmt.dataCurta(r.vu) + ')').join('; ') + '.', actions: '<button type="button" class="lt-btn lt-btn--sm lt-btn--outline" data-fin-ver-vencidos>' + I('filter') + '<span>Ver vencidas</span></button>' }) + '<div class="lt-mt-4"></div>' : '') +
        '<div data-fin-kpis>' + kpisP(S) + '</div><div class="lt-mt-6"></div>' +
        ui.filters({ busca: 'Buscar fornecedor ou CNPJ', selects: [{ label: 'Período', name: 'f-per', options: PERIODOS, value: S.per }, { label: 'Tipo', name: 'f-tipo', value: S.tipo, options: [{ value: 'direto', label: 'Custo direto' }, { value: 'adm', label: 'Custo administrativo' }] }, { label: 'Categoria', name: 'f-cat', value: S.cat, options: F.categorias.filter((c) => c.natureza === 'direto' || c.natureza === 'adm').map((c) => ({ value: c.key, label: c.nome })) }, { label: 'Centro', name: 'f-centro', value: S.centro, options: F.centros }],
          chipGroup: 'single', chips: [{ label: 'Todos', value: 'todos', active: S.chip === 'todos' }, { label: 'A vencer', value: 'avencer', tone: 'blue', active: S.chip === 'avencer' }, { label: 'Vencidos', value: 'vencidos', tone: 'red', count: venc.length, active: S.chip === 'vencidos' }, { label: 'Pagos', value: 'pagos', tone: 'green', active: S.chip === 'pagos' }] }) +
        '<div data-fin-lista>' + tabelaP(rows) + '</div>';
    },
    mount: (root) => {
      const S = stP();
      const redraw = () => { root.querySelector('[data-fin-kpis]').innerHTML = kpisP(S); const box = root.querySelector('[data-fin-lista]'); box.innerHTML = tabelaP(filtraP(S)); ui.enhance(box); };
      bindFiltros(root, S, redraw);
      on(root, 'click', (e) => { if (e.target.closest('[data-fin-ver-vencidos]')) { S.chip = 'vencidos'; ativarChip(root, 'vencidos'); redraw(); } });
    }
  });

  /* ---------- Ficha da conta a pagar ---------- */
  App.screen({
    id: 'fin.payable.detail', hash: 'fin-conta-pagar', module: 'financeiro', title: 'Conta a pagar', nav: false, navGroup: 'financeiro', navParent: 'fin-pagar', exemplo: 13002,
    render: (params) => {
      const c = F.pagarConta(params.id);
      if (!c) return ui.pageHeader({ breadcrumb: crumb('Não encontrado', [{ label: 'Contas a pagar', hash: 'fin-pagar' }]), title: 'Conta não encontrada' }) + ui.empty({ icon: 'wallet', title: 'Não existe conta a pagar #' + esc(params.id), action: '<a class="lt-btn lt-btn--primary" href="#fin-pagar">Voltar para contas a pagar</a>' });
      const f = forn(c.fornecedorId), nome = f ? f.fantasia : (c.recebedor || '—'), e = c.empresaId ? emp(c.empresaId) : null, proc = c.processoId ? db.processo(c.processoId) : null, pl = F.plano(c.cat, c.sub);
      const rows = rowsP().filter((r) => r.c.id === c.id), tot = soma(rows, (r) => r.p.valor), pago = soma(rows.filter((r) => r.sit === 'fin_pago'), (r) => r.p.valor), venc = rows.filter((r) => r.sit === 'fin_vencido');
      const prox = proxAbertaP(c);
      const sitConta = venc.length ? 'fin_vencido' : rows.every((r) => r.sit === 'fin_pago') ? 'fin_pago' : 'fin_avencer';
      const header = ui.pageHeader({
        breadcrumb: crumb('#' + c.id, [{ label: c.tipo === 'adm' ? 'Custos administrativos' : 'Contas a pagar', hash: c.tipo === 'adm' ? 'fin-custos-adm' : 'fin-pagar' }]), eyebrow: (c.tipo === 'adm' ? 'Custo administrativo #' : 'Conta a pagar #') + c.id, title: nome,
        sub: esc(c.descricao), meta: tipoChipP(c.tipo) + ui.status(sitConta) + ui.chip(c.sub, 'gray', { icon: 'tag' }) + (c.reembolsavel ? ui.chip('Reembolsável pelo cliente', 'amber', { icon: 'refresh' }) : '') + (c.origem === 'Importação de NF' ? ui.chip('Importada de NF', 'violet', { icon: 'file-text' }) : ''),
        actions: (prox ? ui.btn({ label: 'Cancelar conta', icon: 'x-circle', variant: 'ghost', dialog: 'fin-cancelar-titulo', attrs: { 'data-t': 'p', 'data-id': c.id } }) : '') + ui.btn({ label: 'Editar', icon: 'edit', href: '#fin-lancamento-' + c.id }) + (prox ? ui.btn({ label: 'Registrar pagamento', icon: 'check', variant: 'primary', sheet: 'fin-baixa', attrs: { 'data-t': 'p', 'data-id': c.id, 'data-n': prox.n } }) : '')
      });
      const resumo = ui.summary([{ label: 'Valor total', value: M(tot) }, { label: 'Pago', value: M(pago) }, { label: 'Em aberto', value: M(tot - pago) }, { label: 'Vencido', value: venc.length ? M(soma(venc, (r) => r.p.valor), 'lt-danger') : '<span class="lt-muted">—</span>' }, { label: 'Parcelas', value: rows.filter((r) => r.sit === 'fin_pago').length + ' de ' + rows.length + (rows.length === 1 ? ' paga' : ' pagas') }]);
      const tParc = ui.table({ rows, compact: true, pageSize: rows.length > 12 ? 12 : 0, columns: [
        { label: 'Nº', key: 'n', render: (r) => '<span class="lt-num">' + r.p.n + '/' + rows.length + '</span>' },
        { label: 'Vencimento', key: 'v', render: vencCellP },
        { label: 'Valor', key: 'valor', align: 'right', render: (r) => M(r.p.valor) },
        { label: 'Conta', key: 'conta', value: (r) => contaNome(r.p.contaId || c.contaId), render: (r) => esc(contaNome(r.p.contaId || c.contaId)) },
        { label: 'Situação', key: 'sit', value: (r) => r.sit, render: (r) => ui.status(r.sit) }
      ], rowActions: (r) => isAberto(r) ? ui.btn({ label: 'Pagar', icon: 'check', variant: 'outline', size: 'xs', sheet: 'fin-baixa', attrs: { 'data-t': 'p', 'data-id': c.id, 'data-n': r.p.n } }) : r.sit === 'fin_pago' ? ui.btn({ icon: 'download', variant: 'ghost', size: 'xs', tip: 'Comprovante', acao: 'exportar', toast: 'Comprovante baixado' }) + ui.btn({ icon: 'history', variant: 'ghost', size: 'xs', tip: 'Desfazer baixa', dialog: 'fin-desfazer-baixa', attrs: { 'data-t': 'p', 'data-id': c.id, 'data-n': r.p.n } }) : '' });
      const nota = c.notaId ? F.nota(c.notaId) : null;
      const docs = ui.list([].concat(nota ? [{ icon: 'file-text', tone: 'violet', title: esc(nota.modelo + ' ' + nota.numero + ' · ' + (f ? f.fantasia : '')), meta: 'XML importado em ' + fmt.dataHora(nota.importadaEm), href: '#fin-importar-nota-' + nota.id }] : []).concat(c.parcelas.filter((p) => p.status === 'pago').slice(-3).map((p) => ({ icon: 'paperclip', tone: 'green', title: 'Comprovante de pagamento · parcela ' + p.n, meta: fmt.data(p.pagoEm) + ' · PDF · 84 KB' }))).concat(c.forma === 'boleto' || c.forma === 'gru' ? [{ icon: 'receipt', tone: 'gold', title: (c.forma === 'gru' ? 'Guia (GRU/DARF)' : 'Boleto do fornecedor') + (prox ? ' · parcela ' + prox.n : ''), meta: 'PDF · anexado por Larissa Campos' }] : []), { empty: { icon: 'paperclip', title: 'Nenhum documento' } }) +
        '<div class="lt-mt-4">' + ui.field({ type: 'upload', label: 'Anexar documento', accept: 'NF, boleto, guia ou comprovante · PDF, XML ou imagem' }) + '</div>';
      const hist = ui.timeline([{ day: 'Histórico' }].concat(c.parcelas.filter((p) => p.status === 'pago' && p.pagoEm <= HOJE).slice(-4).reverse().map((p) => ({ icon: 'check-circle', tone: 'green', title: 'Parcela ' + p.n + ' paga: ' + fmt.moeda(p.valor), meta: fmt.data(p.pagoEm) + ' · ' + esc(contaNome(p.contaId)) + ' · Larissa Campos' }))).concat(venc.map((r) => ({ icon: 'alert-circle', tone: 'red', title: 'Parcela ' + r.p.n + ' venceu sem pagamento', meta: fmt.data(r.vu) }))).concat([{ icon: c.origem === 'Importação de NF' ? 'file-text' : 'plus', tone: 'gold', title: c.origem === 'Importação de NF' ? 'Criada a partir do XML da nota fiscal' : 'Conta lançada por Larissa Campos', meta: 'Competência ' + mesC(c.competencia) }]));
      const right = ui.card({ title: 'Resumo', icon: 'file-text', body: ui.dl([
          [c.fornecedorId ? 'Fornecedor' : 'Recebedor', f ? esc(f.razao) + '<span class="lt-hint" style="display:block">' + esc(f.cnpj) + '</span>' : esc(c.recebedor || '—')],
          ['Plano de contas', esc(c.sub) + '<span class="lt-hint" style="display:block">' + esc((F.cat(c.cat) || {}).nome) + (pl ? ' · ' + pl.cod : '') + '</span>'], ['Tipo DRE', dreChip(pl && pl.tipoDre)], ['Centro de custo', esc(c.centro)],
          ['Cliente vinculado', e ? '<a href="#crm-empresa-' + e.id + '">' + esc(e.fantasia) + '</a>' : '—'], ['Processo', proc ? '<a href="#jur-processo-' + proc.id + '">' + esc(proc.numero) + '</a>' : '—'],
          ['Forma', esc(formaNome(c.forma))], ['Conta de pagamento', esc(contaNome(c.contaId))], ['Competência', mesC(c.competencia)]
        ]) }) +
        (f ? ui.card({ title: 'Dados de pagamento', icon: 'landmark', body: ui.dl([['Prazo', esc(f.prazo)], ['Forma preferida', esc(formaNome(f.forma))], ['Chave PIX', f.pix ? '<button type="button" class="lt-link-btn" data-copy="' + esc(f.pix) + '" data-copy-label="Chave PIX copiada">' + esc(f.pix) + '</button>' : '—'], ['Banco', esc(f.banco || '—')], ['Contato', esc(f.contato) + '<span class="lt-hint" style="display:block">' + esc(f.email) + '</span>']]) }) : '') +
        (c.reembolsavel ? (c.reembolsoId ? ui.callout({ tone: 'success', title: 'Reembolso lançado', text: 'O valor será cobrado do cliente na <a href="#fin-conta-receber-' + c.reembolsoId + '">conta a receber #' + c.reembolsoId + '</a>.' }) : ui.callout({ tone: 'warning', title: 'Reembolsável pelo cliente', text: 'Gere o reembolso para cobrar ' + esc(e ? e.fantasia : 'o cliente') + ' junto com o próximo boleto.', actions: ui.btn({ label: 'Gerar reembolso', size: 'sm', variant: 'outline', icon: 'refresh', acao: 'gerar', toast: 'Reembolso lançado no contas a receber', toastText: 'Vence com o próximo honorário mensal do cliente.' }) })) : '') +
        (c.obs ? ui.callout({ tone: 'info', title: 'Observação', text: esc(c.obs) }) : '');
      return header + resumo + '<div class="lt-split lt-mt-6"><div style="min-width:0">' + ui.card({ body: ui.tabs({ id: 'fin-pagar-ficha', tabs: [{ key: 'parcelas', label: 'Parcelas', icon: 'list', count: rows.length, content: tParc }, { key: 'docs', label: 'Documentos', icon: 'paperclip', content: docs }, { key: 'hist', label: 'Histórico', icon: 'history', content: hist }] }) }) + '</div><div class="lt-stack">' + right + '</div></div>';
    }
  });

  /* ================================================================== */
  /* CUSTOS ADMINISTRATIVOS                                               */
  /* ================================================================== */
  function stA() { const S = App.state.finA || (App.state.finA = { per: '2026-11', tipo: '', cat: '', centro: '', chip: 'todos' }); S.busca = ''; return S; }
  function porCategoria(S) {
    const base = rowsP().filter((r) => r.c.tipo === 'adm' && (!S.per || r.venc.slice(0, 7) === S.per));
    const g = util.agrupar(base, (r) => r.c.cat);
    return Object.keys(g).map((k) => ({ label: (F.cat(k) || {}).nome || k, value: soma(g[k], (r) => r.p.valor) })).sort((a, b) => b.value - a.value);
  }
  App.screen({
    id: 'fin.admin_costs', hash: 'fin-custos-adm', module: 'financeiro', title: 'Custos administrativos', nav: true, navGroup: 'financeiro', navOrder: 4,
    render: () => {
      const S = stA(), rows = filtraP(S, true), cats = porCategoria(S);
      return ui.pageHeader({ breadcrumb: crumb('Custos administrativos'), title: 'Custos administrativos', sub: 'Gastos indiretos do escritório, com categoria e subcategoria. Custos ligados a um cliente ou processo vão em Contas a pagar.',
          actions: ui.btn({ label: EXPORTAR, icon: 'download', acao: 'exportar', toast: 'Planilha exportada', toastText: 'custos-administrativos.xlsx' }) + ui.btn({ label: 'Novo custo adm', icon: 'plus', variant: 'primary', sheet: 'fin-novo-custo-adm' }) }) +
        '<div data-fin-kpis>' + kpisP(S, true) + '</div>' +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c7">' + ui.card({ title: 'Por categoria', icon: 'pie', sub: '<span data-fin-cats-sub>' + (S.per ? mesC(S.per) : 'Todos os períodos') + '</span> · inclui pagos e a pagar', body: '<div data-fin-cats>' + ui.chart.funnel(cats, { format: MC }) + '</div>' }) + '</div>' +
        '<div class="lt-c5">' + ui.card({ title: 'Recorrentes do mês', icon: 'refresh', sub: 'Lançados todo mês com o mesmo valor', flush: true, body: ui.list([['Folha (salários)', '2 + 6 colaboradores · dia 5', 55400], ['Pró-labore', 'Sócios · dia 5', 24000], ['Aluguel', 'Imobiliária Jequitibá · dia 10', 14500], ['INSS da folha', 'DARF gerado pela DCTFWeb · dia 20', 13170], ['Benefícios', 'Vale-refeição e plano de saúde', 10200], ['FGTS da folha', 'Guia do FGTS Digital · dia 20', 4430], ['Condomínio', 'Cambuí Corporate · dia 10', 3820]].map((x) => ({ icon: 'refresh', tone: 'blue', title: esc(x[0]), meta: esc(x[1]), aside: '<b class="lt-num" style="color:var(--text)">' + fmt.moeda(x[2]) + '</b>' }))) }) + '</div></div>' +
        '<div class="lt-mt-6"></div>' +
        ui.filters({ busca: 'Buscar recebedor ou gasto', selects: [{ label: 'Período', name: 'f-per', options: PERIODOS, value: S.per }, { label: 'Categoria', name: 'f-cat', value: S.cat, options: F.categorias.filter((c) => c.natureza === 'adm').map((c) => ({ value: c.key, label: c.nome })) }, { label: 'Centro', name: 'f-centro', value: S.centro, options: F.centros }],
          chipGroup: 'single', chips: [{ label: 'Todos', value: 'todos', active: S.chip === 'todos' }, { label: 'A pagar', value: 'avencer', tone: 'blue', active: S.chip === 'avencer' }, { label: 'Vencidos', value: 'vencidos', tone: 'red', active: S.chip === 'vencidos' }, { label: 'Pagos', value: 'pagos', tone: 'green', active: S.chip === 'pagos' }] }) +
        '<div data-fin-lista>' + tabelaP(rows, true) + '</div>';
    },
    mount: (root) => {
      const S = stA();
      bindFiltros(root, S, () => {
        root.querySelector('[data-fin-kpis]').innerHTML = kpisP(S, true);
        const box = root.querySelector('[data-fin-lista]'); box.innerHTML = tabelaP(filtraP(S, true), true); ui.enhance(box);
        root.querySelector('[data-fin-cats]').innerHTML = ui.chart.funnel(porCategoria(S), { format: MC });
        root.querySelector('[data-fin-cats-sub]').textContent = S.per ? mesC(S.per) : 'Todos os períodos';
      });
    }
  });

  /* ================================================================== */
  /* LANÇAMENTO (formulário completo em cards) + gavetas                  */
  /* ================================================================== */
  const NAT = { receber: 'receita', pagar: 'direto', adm: 'adm' };
  const catOptions = (nat) => F.categorias.filter((c) => c.natureza === nat).map((c) => ({ value: c.key, label: c.nome }));
  const subOptions = (k) => { const c = F.cat(k); return c ? c.subs.map((s) => ({ value: s[0], label: s[0] })) : []; };
  const contratoOpts = (eid) => D.contratos.filter((c) => String(c.empresaId) === String(eid)).map((c) => ({ value: c.id, label: 'Contrato #' + c.id + ' · mensal ' + fmt.moeda(c.honorarioMensal) + ' + ' + c.exitoPct + '% de êxito' })).concat([{ value: '', label: 'Sem contrato (avulso)' }]);
  const RECEITA_PLANO = { fee: ['honorarios', 'Honorários mensais'], exito: ['honorarios', 'Honorários de êxito'], avulso: ['honorarios', 'Pareceres e consultorias avulsas'], reembolso: ['reembolsos', 'Reembolso de custas e perícias'] };
  const show = (tipos, html) => '<div class="fin-show" data-fin-show="' + tipos + '">' + html + '</div>';
  function gerarParcelas(valor, qtd, venc, intervalo) {
    const out = []; if (!venc) return out;
    const d0 = util.parse(venc), base = Math.floor(valor * 100 / qtd) / 100; let acc = 0;
    for (let i = 0; i < qtd; i++) {
      let d;
      if (intervalo === 'quinzenal') d = util.addDias(d0, 15 * i);
      else if (intervalo === 'semanal') d = util.addDias(d0, 7 * i);
      else { const last = new Date(d0.getFullYear(), d0.getMonth() + i + 1, 0).getDate(); d = new Date(d0.getFullYear(), d0.getMonth() + i, Math.min(d0.getDate(), last)); }
      const v = i < qtd - 1 ? base : Math.round((valor - acc) * 100) / 100; acc += v;
      out.push({ n: i + 1, venc: util.iso(d), vu: vu(d), valor: v });
    }
    return out;
  }
  function parcelasPreview(valor, qtd, venc, intervalo) {
    const ps = gerarParcelas(valor || 0, qtd || 1, venc, intervalo);
    if (!ps.length) return '<span class="lt-hint">Informe valor e vencimento para ver as parcelas.</span>';
    return '<div class="lt-label-caps" style="margin-bottom:6px">Parcelas geradas</div><table class="lt-trail"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Dia útil</th><th style="text-align:right">Valor</th></tr></thead><tbody>' +
      ps.map((p) => { const f = util.feriado(p.venc); return '<tr><td class="lt-num">' + p.n + '/' + ps.length + '</td><td class="lt-num">' + fmt.data(p.venc) + ' <span class="lt-hint">' + fmt.diaSemanaCurto(p.venc) + '</span></td><td>' + (p.vu !== p.venc ? ui.chip('Pagável em ' + fmt.dataCurta(p.vu), 'amber', { title: f ? f.nome : 'Fim de semana' }) : '<span class="lt-muted">—</span>') + '</td><td class="lt-num fin-r">' + fmt.moeda(p.valor) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td colspan="3" class="lt-strong">Total</td><td class="lt-num lt-strong fin-r">' + fmt.moeda(soma(ps, (p) => p.valor)) + '</td></tr></tfoot></table>';
  }
  /* o: { tipo: receber|pagar|adm, lock: bool, v: valores para edição } */
  function formLanc(o) {
    o = o || {};
    const tipo = o.tipo || 'receber', v = o.v || {};
    const cat = v.cat || (tipo === 'receber' ? 'honorarios' : tipo === 'pagar' ? 'custas' : 'infra');
    const sub = v.sub || F.cat(cat).subs[0][0];
    const pl = F.plano(cat, sub);
    const receita = v.tipoReceita || 'fee';
    const eid = v.empresaId || '';
    const ct = v.contratoId ? db.contrato(v.contratoId) : null;
    const sec = [];
    if (!o.lock) sec.push(ui.section({ title: 'Tipo de lançamento', sub: 'Define o plano de contas, as listas e onde o valor entra no fluxo de caixa.', tone: 'gold', icon: 'layers',
      body: '<div class="lt-grid lt-grid--3">' + [['receber', 'A receber', 'Honorários mensais e de êxito, avulsos e reembolsos'], ['pagar', 'Conta a pagar', 'Custo direto de cliente ou processo: custas, perícias, comissões'], ['adm', 'Custo administrativo', 'Gasto do escritório: pessoal, aluguel, sistemas, impostos']].map((x) => '<label class="lt-choice-card"><span class="lt-radio"><input type="radio" name="fin-tipo" value="' + x[0] + '"' + (x[0] === tipo ? ' checked' : '') + '></span><span><span class="lt-strong" style="display:block">' + x[1] + '</span><span class="lt-hint">' + x[2] + '</span></span></label>').join('') + '</div>' }));
    else sec.push('<input type="hidden" name="fin-tipo" value="' + tipo + '">');
    sec.push(ui.section({ title: tipo === 'receber' && o.lock ? 'Cliente' : 'Cliente ou fornecedor', sub: 'Quem paga ou quem recebe, e a que contrato ou processo o valor se liga.', tone: 'blue', icon: 'building', cols: 2,
      body: show('receber', ui.field({ label: 'Cliente', name: 'fin-cliente', type: 'select', value: eid, required: true, placeholder: 'Escolha o cliente', options: D.empresas.filter((e) => e.relacao === 'cliente').map((e) => ({ value: e.id, label: e.fantasia + ' · ' + e.cnpj })) }) +
          ui.field({ label: 'Contrato de honorários', name: 'fin-contrato', type: 'select', value: v.contratoId || '', options: eid ? contratoOpts(eid) : [{ value: '', label: 'Escolha o cliente primeiro' }] }) +
          ui.field({ label: 'Tipo de receita', name: 'fin-receita', type: 'select', value: receita, options: Object.keys(TIPO_R).map((k) => ({ value: k, label: TIPO_R[k][0] })) })) +
        show('pagar adm', ui.field({ label: 'Fornecedor', name: 'fin-forn', type: 'select', value: v.fornecedorId || '', placeholder: 'Sem fornecedor (folha, reembolso a colaborador…)', options: F.fornecedores.filter((x) => x.status === 'ativo').map((x) => ({ value: x.id, label: x.fantasia + (x.cnpj !== '—' ? ' · ' + x.cnpj : '') })), hint: '<button type="button" class="lt-link-btn" data-sheet="fin-novo-fornecedor">+ Cadastrar fornecedor</button>' }) +
          ui.field({ label: 'Recebedor (sem fornecedor)', name: 'fin-recebedor', value: v.recebedor || '', placeholder: 'Ex.: Folha de pagamento (6 colaboradores)' })) +
        show('pagar', ui.field({ label: 'Cliente vinculado', name: 'fin-cliente-p', type: 'select', value: v.empresaId || '', placeholder: 'Nenhum', options: D.empresas.filter((e) => e.relacao === 'cliente').map((e) => ({ value: e.id, label: e.fantasia })) })) +
        show('receber pagar', ui.field({ label: 'Processo vinculado', name: 'fin-processo', type: 'select', value: v.processoId || '', placeholder: 'Nenhum', options: D.processos.map((p) => ({ value: p.id, label: p.numero + ' · ' + emp(p.empresaId).fantasia })) })) +
        show('pagar', ui.field({ type: 'toggle', name: 'fin-reemb', label: 'Reembolsável pelo cliente', checked: !!v.reembolsavel, hint: 'Gera a cobrança do reembolso no contas a receber.' })) +
        ui.field({ label: 'Descrição', name: 'fin-desc', span: 2, required: true, value: v.descricao || '', placeholder: tipo === 'receber' ? 'Ex.: Honorários mensais · dez/2026' : 'Ex.: Custas de apelação (GRU)' }) }));
    sec.push(ui.section({ title: 'Classificação', sub: 'Plano de contas: a subcategoria define a linha do DRE.', tone: 'violet', icon: 'tag', cols: 3,
      body: ui.field({ label: 'Categoria', name: 'fin-cat', type: 'select', value: cat, required: true, options: catOptions(NAT[tipo]) }) +
        ui.field({ label: 'Subcategoria', name: 'fin-sub', type: 'select', value: sub, required: true, options: subOptions(cat) }) +
        ui.field({ label: 'Tipo DRE', type: 'static', html: '<span data-fin-dre>' + dreChip(pl && pl.tipoDre) + '</span>', hint: 'Vem do plano de contas' }) +
        ui.field({ label: 'Centro de custo', name: 'fin-centro', type: 'select', value: v.centro || F.cat(cat).centro, options: F.centros }) +
        ui.field({ label: 'Competência', name: 'fin-comp', type: 'month', value: v.competencia || '2026-11' }) }));
    const pc = v.parcelas || [];
    sec.push(ui.section({ title: 'Valores e parcelamento', sub: 'Vencimento em feriado ou fim de semana passa para o próximo dia útil (calendário do sistema).', tone: 'green', icon: 'dollar', cols: 3,
      body: '<div class="fin-show" data-fin-only="exito">' + ui.field({ label: 'Crédito compensado (base)', name: 'fin-base', type: 'money', value: v.base || '', hint: 'Valor do PER/DCOMP ou da habilitação' }) + ui.field({ label: '% de êxito', name: 'fin-pct', type: 'percent', value: v.exitoPct != null ? v.exitoPct : (ct ? ct.exitoPct : 20) }) + ui.field({ label: 'Cálculo', type: 'static', html: '<span class="lt-hint">base × % = valor total</span>' }) + '</div>' +
        ui.field({ label: 'Valor total', name: 'fin-valor', type: 'money', required: true, value: pc.length ? soma(pc, (p) => p.valor) : '' }) +
        ui.field({ label: 'Nº de parcelas', name: 'fin-qtd', type: 'select', value: pc.length || 1, options: Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: i ? (i + 1) + ' parcelas' : 'À vista (1)' })) }) +
        ui.field({ label: 'Primeiro vencimento', name: 'fin-venc', type: 'date', required: true, value: pc.length ? pc[0].venc : util.iso(util.addDias(HOJE, 10)) }) +
        ui.field({ label: 'Intervalo', name: 'fin-intervalo', type: 'select', value: 'mensal', options: [{ value: 'mensal', label: 'Mensal' }, { value: 'quinzenal', label: 'Quinzenal' }, { value: 'semanal', label: 'Semanal' }] }) +
        ui.field({ label: 'Forma de pagamento', name: 'fin-forma', type: 'select', value: v.forma || (tipo === 'receber' ? 'boleto' : 'pix'), options: F.formas.map((x) => ({ value: x.key, label: x.nome })) }) +
        ui.field({ label: 'Recorrência', name: 'fin-rec', type: 'select', value: v.recorrente ? 'mensal' : 'unica', options: [{ value: 'unica', label: 'Lançamento único' }, { value: 'mensal', label: 'Repetir todo mês' }] }) +
        '<div class="lt-span-full" data-fin-parcelas></div>' }));
    sec.push(ui.section({ title: tipo === 'receber' ? 'Conta e cobrança' : 'Conta de pagamento', sub: 'Conta bancária que recebe ou paga e o que acontece ao salvar.', tone: 'amber', icon: 'landmark', cols: 2,
      body: ui.field({ label: 'Conta bancária', name: 'fin-conta', type: 'select', value: v.contaId || (tipo === 'receber' ? 2 : 1), options: F.contas.map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido })) }) + '<div></div>' +
        show('receber', ui.field({ label: 'Retenções na fonte', type: 'static', span: 2, html: '<span class="lt-small">IRRF 1,5% + CSRF 4,65% (CSLL, PIS e Cofins) e ISS 3% quando o tomador é responsável. Calculadas pelo cadastro do cliente; o boleto sai pelo líquido.</span>' }) + ui.field({ type: 'toggle', name: 'fin-gerar-boleto', label: 'Gerar boleto ao salvar', checked: !v.id, hint: 'Registra na integração de cobrança.' }) + ui.field({ type: 'toggle', name: 'fin-email', label: 'Enviar boleto e NFS-e por e-mail', checked: !v.id, hint: 'Para o contato de cobrança do cliente.' }) + ui.field({ type: 'toggle', name: 'fin-nfse', label: 'Emitir NFS-e junto com o boleto', checked: !v.id })) +
        show('pagar adm', ui.field({ type: 'toggle', name: 'fin-pago', label: 'Já está pago', hint: 'Baixa a 1ª parcela com a data de hoje.' }) + ui.field({ type: 'toggle', name: 'fin-aprov', label: 'Pedir aprovação do sócio', hint: 'Obrigatório acima de R$ 10.000,00.' })) }));
    sec.push(ui.section({ title: 'Anexos e observações', tone: 'slate', icon: 'paperclip', cols: 2,
      body: ui.field({ type: 'upload', label: 'Anexos', multiple: true, accept: 'NF, contrato, boleto ou comprovante · PDF, XML ou imagem · até 25 MB' }) + ui.field({ type: 'textarea', label: 'Observações', name: 'fin-obs', rows: 5, value: v.obs || '', placeholder: 'Informações para quem vai conferir ou pagar' }) }));
    return '<div class="lt-sections" data-fin-form>' + sec.join('') + '</div>';
  }
  function bindLanc(el) {
    const q = (n) => el.querySelector('[name="' + n + '"]');
    const tipoAtual = () => { const r = el.querySelector('[name="fin-tipo"]:checked') || el.querySelector('input[type=hidden][name="fin-tipo"]'); return r ? r.value : 'receber'; };
    const receita = () => (q('fin-receita') || {}).value;
    const setOpts = (sel, opts, val) => { if (!sel) return; sel.innerHTML = opts.map((o) => '<option value="' + esc(o.value) + '"' + (String(o.value) === String(val) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join(''); };
    const aplicar = () => {
      const t = tipoAtual(), rc = receita();
      el.querySelectorAll('[data-fin-show]').forEach((x) => { x.hidden = x.getAttribute('data-fin-show').split(' ').indexOf(t) < 0; });
      el.querySelectorAll('[data-fin-only]').forEach((x) => { x.hidden = !(t === 'receber' && rc === x.getAttribute('data-fin-only')); });
      const salvar = document.querySelector('[data-fin-salvar]'); if (salvar) salvar.setAttribute('data-ir', t === 'receber' ? 'fin-receber' : t === 'adm' ? 'fin-custos-adm' : 'fin-pagar');
    };
    const atualizaDre = () => { const p = F.plano(q('fin-cat').value, q('fin-sub').value), box = el.querySelector('[data-fin-dre]'); if (box) box.innerHTML = dreChip(p && p.tipoDre); };
    const onCat = (subVal) => { setOpts(q('fin-sub'), subOptions(q('fin-cat').value), subVal); atualizaDre(); const c = F.cat(q('fin-cat').value); if (c && q('fin-centro')) q('fin-centro').value = c.centro; };
    const recalc = () => { const box = el.querySelector('[data-fin-parcelas]'); if (box) box.innerHTML = parcelasPreview(parseMoney(q('fin-valor').value), +q('fin-qtd').value || 1, q('fin-venc').value, q('fin-intervalo').value); };
    const calcExito = () => { if (tipoAtual() !== 'receber' || receita() !== 'exito') return; const b = parseMoney(q('fin-base').value), pct = parseMoney(q('fin-pct').value); if (b && pct) q('fin-valor').value = fmt.num(b * pct / 100, 2); recalc(); };
    const onTipo = () => { const t = tipoAtual(), opts = catOptions(NAT[t]); setOpts(q('fin-cat'), opts, opts[0].value); if (t === 'receber') { const m = RECEITA_PLANO[receita()] || RECEITA_PLANO.fee; q('fin-cat').value = m[0]; onCat(m[1]); } else onCat(); if (q('fin-forma')) q('fin-forma').value = t === 'receber' ? 'boleto' : 'pix'; if (q('fin-conta')) q('fin-conta').value = t === 'receber' ? 2 : 1; aplicar(); recalc(); };
    const onReceita = () => { const m = RECEITA_PLANO[receita()]; if (m) { q('fin-cat').value = m[0]; onCat(m[1]); } aplicar(); calcExito(); };
    const syncPct = () => { const c = db.contrato(q('fin-contrato').value); if (c && q('fin-pct')) q('fin-pct').value = fmt.num(c.exitoPct, 1); if (c && receita() === 'fee' && !parseMoney(q('fin-valor').value)) { q('fin-valor').value = fmt.num(c.honorarioMensal, 2); recalc(); } calcExito(); };
    const onCliente = () => { setOpts(q('fin-contrato'), contratoOpts(q('fin-cliente').value)); syncPct(); };
    on(el, 'change', (e) => {
      const n = e.target.name;
      if (n === 'fin-tipo') onTipo(); else if (n === 'fin-cat') onCat(); else if (n === 'fin-sub') atualizaDre(); else if (n === 'fin-receita') onReceita();
      else if (n === 'fin-cliente') onCliente(); else if (n === 'fin-contrato') syncPct(); else if (n === 'fin-qtd' || n === 'fin-venc' || n === 'fin-intervalo') recalc();
      else if (n === 'fin-forn') { const f = forn(e.target.value); if (f && q('fin-cat')) { const opts = catOptions(NAT[tipoAtual()]); if (opts.some((o) => o.value === f.categoria)) { q('fin-cat').value = f.categoria; onCat(f.sub); ui.toast('Categoria sugerida', 'info', 'Padrão do fornecedor ' + esc(f.fantasia) + ': ' + esc(f.sub) + '.'); } } }
    });
    on(el, 'input', (e) => { const n = e.target.name; if (n === 'fin-valor') setTimeout(recalc, 0); else if (n === 'fin-base' || n === 'fin-pct') setTimeout(calcExito, 0); });
    aplicar(); recalc();
  }
  function valoresDe(id) {
    const r = F.receberConta(id);
    if (r) return { tipo: 'receber', v: Object.assign({ tipoReceita: r.tipo, contaId: r.contaId }, r) };
    const p = F.pagarConta(id);
    if (p) return { tipo: p.tipo === 'adm' ? 'adm' : 'pagar', v: Object.assign({}, p) };
    return null;
  }
  App.screen({
    id: 'fin.entry.new', hash: 'fin-lancamento', module: 'financeiro', title: 'Lançamento financeiro', nav: false, navGroup: 'financeiro', navParent: 'fin-receber',
    render: (params) => {
      const ed = params.id ? valoresDe(params.id) : null;
      const tipo = ed ? ed.tipo : (App.state.finLancTipo || 'receber');
      const voltar = tipo === 'receber' ? 'fin-receber' : tipo === 'adm' ? 'fin-custos-adm' : 'fin-pagar';
      return ui.pageHeader({ breadcrumb: crumb(ed ? 'Editar #' + params.id : 'Novo lançamento', [{ label: tipo === 'receber' ? 'Contas a receber' : 'Contas a pagar', hash: voltar }]), eyebrow: ed ? 'Lançamento #' + params.id : 'Novo lançamento', title: ed ? 'Editar lançamento' : 'Novo lançamento',
          sub: ed ? esc(ed.v.descricao) : 'A receber, conta a pagar ou custo administrativo. As parcelas aparecem no fluxo de caixa na data de vencimento.' }) +
        (params.id && !ed ? ui.callout({ tone: 'warning', title: 'Lançamento #' + esc(params.id) + ' não encontrado', text: 'Abrimos um formulário em branco.' }) + '<div class="lt-mt-4"></div>' : '') +
        formLanc({ tipo, v: ed ? ed.v : {} }) +
        '<div class="lt-form-actions"><span class="lt-form-actions__info">Campos com * são obrigatórios · alterações ficam na auditoria</span>' +
        (ed ? ui.btn({ label: 'Excluir', icon: 'trash', variant: 'danger-outline', acao: 'excluir', confirm: 'Excluir o lançamento #' + params.id + '?', confirmText: 'Todas as parcelas em aberto saem do financeiro. Parcelas já pagas ou recebidas impedem a exclusão.', confirmLabel: 'Excluir lançamento', toast: 'Lançamento excluído', ir: voltar }) : '') +
        '<a class="lt-btn lt-btn--default" href="#' + voltar + '"><span>Sair sem salvar</span></a>' +
        (ed ? '' : ui.btn({ label: 'Salvar e lançar outro', acao: 'salvar', toast: 'Lançamento salvo', toastText: 'O formulário continua aberto para o próximo.' })) +
        ui.btn({ label: ed ? 'Salvar alterações' : 'Salvar lançamento', variant: 'primary', icon: 'check', acao: 'salvar', toast: ed ? 'Alterações salvas' : 'Lançamento salvo', toastText: 'Parcelas atualizadas no fluxo de caixa.', ir: voltar, attrs: { 'data-fin-salvar': true } }) + '</div>';
    },
    mount: (root) => bindLanc(root)
  });
  function sheetLanc(tipo, lock, titulo, nota) {
    return () => ({
      eyebrow: 'Financeiro', title: titulo, size: 'lg', sub: nota || 'Preencha os cards na ordem. As parcelas são geradas pelo valor, quantidade e primeiro vencimento.',
      body: formLanc({ tipo, lock }),
      foot: '<a class="lt-btn lt-btn--ghost" href="#fin-lancamento" data-fechar-sheet>' + I('external') + '<span>Tela cheia</span></a>' + ui.sheetFoot({ label: 'Salvar lançamento', toast: 'Lançamento salvo', toastText: 'As parcelas entraram no fluxo de caixa.', info: 'Campos com * são obrigatórios' }),
      mount: (el) => { bindLanc(el); App.state.finLancTipo = tipo; }
    });
  }
  ui.registerSheet('fin-novo-lancamento', (p) => sheetLanc(p.tipo || 'receber', false, 'Novo lançamento')());
  ui.registerSheet('fin-nova-conta-receber', sheetLanc('receber', true, 'Nova conta a receber', 'Honorário mensal, êxito sobre compensação, avulso ou reembolso de custas. Informe o valor bruto da NFS-e: as retenções e o líquido do boleto são calculados.'));
  ui.registerSheet('fin-nova-conta-pagar', sheetLanc('pagar', true, 'Nova conta a pagar', 'Contas a pagar são os gastos ligados a um cliente ou processo: custas, certidões, perícias, correspondentes e comissões de parceiros. Gastos do escritório vão em Custo administrativo.'));
  ui.registerSheet('fin-novo-custo-adm', sheetLanc('adm', true, 'Novo custo administrativo', 'Gastos indiretos do escritório: pessoal, aluguel, sistemas, impostos, marketing. Escolha categoria e subcategoria.'));

  /* ---------- Gaveta: registrar recebimento / pagamento (baixa manual) ---------- */
  ui.registerSheet('fin-baixa', (p) => {
    const rec = p.t !== 'p', r = rec ? rowR(p.id, p.n) : rowP(p.id, p.n);
    if (!r) return { title: 'Parcela não encontrada', body: ui.empty({ icon: 'receipt', title: 'Parcela não encontrada' }) };
    const rt = rec ? RT(r) : null, base = rec ? rt.liquido : r.p.valor;
    const dias = Math.max(0, atraso(r)), multa = dias ? Math.round(base * ENC.multa) / 100 : 0, juros = dias ? Math.round(base * ENC.juros / 100 * dias / 30 * 100) / 100 : 0;
    const quem = rec ? r.e.fantasia : r.nome;
    return {
      eyebrow: rec ? 'Contas a receber' : 'Contas a pagar', title: rec ? 'Registrar recebimento' : 'Registrar pagamento', sub: esc(quem) + ' · parcela ' + r.p.n + '/' + r.c.parcelas.length,
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Parcela', tone: 'gold', icon: 'file-text', body: ui.dl([[rec ? 'Cliente' : 'Fornecedor', esc(quem)], ['Descrição', esc(r.c.descricao)], ['Vencimento', fmt.data(r.venc) + (r.vu !== r.venc ? ' (pagável em ' + fmt.dataCurta(r.vu) + ')' : '')]].concat(rec && rt.total ? [['Valor da NFS-e (bruto)', M(r.p.valor)], ['Retenções na fonte (−)', M(rt.total) + '<span class="lt-hint" style="display:block">IRRF ' + fmt.moeda(rt.irrf) + ' · CSRF ' + fmt.moeda(rt.csrf) + (rt.iss ? ' · ISS ' + fmt.moeda(rt.iss) : '') + '</span>'], ['Valor do boleto (líquido)', M(base)]] : [['Valor original', M(base)]])) + (dias ? '<div class="lt-mt-4">' + ui.callout({ tone: 'warning', title: 'Vencida há ' + dias + ' dias', text: rec ? 'Multa e juros calculados sobre o líquido, pelo contrato. Ajuste se houve negociação.' : 'Confira se o fornecedor cobrou multa ou juros.' }) + '</div>' : '') }) +
        ui.section({ title: rec ? 'Recebimento' : 'Pagamento', tone: 'green', icon: 'check-circle', cols: 2, body:
          ui.field({ label: rec ? 'Data do recebimento' : 'Data do pagamento', type: 'date', value: HOJE, required: true }) +
          ui.field({ label: 'Conta bancária', type: 'select', value: r.c.contaId, options: F.contas.map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido })) }) +
          ui.field({ label: 'Multa', name: 'fb-multa', type: 'money', value: multa }) + ui.field({ label: 'Juros', name: 'fb-juros', type: 'money', value: juros }) +
          ui.field({ label: 'Desconto', name: 'fb-desc', type: 'money', value: 0 }) + ui.field({ label: 'Forma', type: 'select', value: r.c.forma, options: F.formas.map((x) => ({ value: x.key, label: x.nome })) }) +
          (rec && rt.total ? ui.field({ type: 'toggle', name: 'fb-ret', span: 2, label: 'Cliente reteve os tributos na fonte', checked: true, hint: 'Desligue se o cliente pagou o bruto sem reter; o valor esperado volta a ser o da NFS-e.' }) : '') +
          '<div class="lt-span-full">' + ui.summary([{ label: rec ? 'Valor esperado' : 'Valor original', value: '<span data-fb-base class="lt-num">' + fmt.moeda(base) + '</span>' }, { label: rec ? 'Valor recebido' : 'Valor pago', value: '<span data-fb-total class="lt-num">' + fmt.moeda(base + multa + juros) + '</span>' }]) + '</div>' }) +
        ui.section({ title: 'Comprovante', tone: 'slate', icon: 'paperclip', body: ui.field({ type: 'upload', label: 'Comprovante', accept: 'PDF ou imagem · até 10 MB' }) + '<div class="lt-mt-4"></div>' + ui.field({ type: 'textarea', label: 'Observação', placeholder: rec ? 'Ex.: pago por PIX, sem o boleto' : 'Ex.: pago com desconto à vista', rows: 2 }) }) + '</div>',
      foot: ui.sheetFoot({ label: rec ? 'Confirmar recebimento' : 'Confirmar pagamento', toast: rec ? 'Recebimento registrado' : 'Pagamento registrado', toastText: 'Parcela ' + r.p.n + '/' + r.c.parcelas.length + ' baixada. O fluxo de caixa foi atualizado.', info: 'A baixa fica na auditoria' }),
      mount: (el) => {
        const num = (n) => parseMoney((el.querySelector('[name="' + n + '"]') || {}).value);
        const esperado = () => { const t = el.querySelector('[name="fb-ret"]'); return rec && t && !t.checked ? r.p.valor : base; };
        const tot = () => { const b0 = esperado(), v = b0 + num('fb-multa') + num('fb-juros') - num('fb-desc'); el.querySelector('[data-fb-base]').textContent = fmt.moeda(b0); el.querySelector('[data-fb-total]').textContent = fmt.moeda(v); return v; };
        el.addEventListener('input', () => setTimeout(tot, 0)); el.addEventListener('change', () => setTimeout(tot, 0));
        const b = el.querySelector('.lt-sheet__foot [data-acao]');
        if (b) b.addEventListener('lt:acao', () => {
          const v = tot(), b0 = esperado();
          if (rec) Object.assign(r.p, { status: 'recebido', recebidoEm: HOJE, valorRecebido: v, juros: v - b0 > 0 ? Math.round((v - b0) * 100) / 100 : undefined, contaId: r.c.contaId });
          else Object.assign(r.p, { status: 'pago', pagoEm: HOJE, contaId: r.c.contaId });
          _nfse = null; setTimeout(() => App.refresh(), 200);
        });
      }
    };
  });

  /* ---------- Diálogo: desfazer baixa (estorno de recebimento/pagamento ou desconciliar extrato) ---------- */
  ui.registerDialog('fin-desfazer-baixa', (p) => {
    const conc = p.t === 'conc', lin = conc ? (F.extratoConciliado || []).find((x) => x.id === +p.id) : null;
    const rec = conc ? lin && lin.titulo.t === 'r' : p.t !== 'p';
    const r = conc ? null : rec ? rowR(p.id, p.n) : rowP(p.id, p.n);
    if (conc ? !lin : !r) return { title: 'Baixa não encontrada', icon: 'info', size: 'sm' };
    const quando = conc ? lin.data : rec ? r.p.recebidoEm : r.p.pagoEm, valor = conc ? lin.valor : rec ? r.p.valorRecebido : r.p.valor;
    const motivos = conc ? ['Lançamento errado para esta linha do extrato', 'Valor dividido entre dois títulos', 'Linha duplicada no extrato', 'Outro'] : rec ? ['Pagamento devolvido pelo banco (estorno)', 'Baixa lançada no título errado', 'Valor ou data incorretos', 'PIX ou TED devolvido', 'Outro'] : ['Pagamento não compensou no banco', 'Baixa lançada na conta errada', 'Valor ou data incorretos', 'Outro'];
    return {
      title: conc ? 'Desfazer conciliação' : 'Desfazer baixa', icon: 'history', iconTone: 'warning',
      text: conc ? esc(lin.label) + ' · linha de ' + fmt.dataCurta(lin.data) : esc(rec ? r.e.fantasia : r.nome) + ' · parcela ' + r.p.n + '/' + r.c.parcelas.length,
      body: '<div class="lt-sections">' +
        ui.section({ title: 'O que volta', tone: 'amber', icon: 'alert-triangle', body: ui.dl([[conc ? 'Linha do extrato' : rec ? 'Recebido em' : 'Pago em', fmt.data(quando) + (conc ? ' · ' + esc(BANCO_CURTO[lin.contaId]) : '')], ['Valor', M(valor)], ['Depois de desfazer', conc ? 'A linha volta para "A conciliar" e o título volta para Em aberto.' : 'A parcela volta para Em aberto e sai do fluxo realizado.' + (rec ? ' O boleto, se houver, segue válido.' : '')]]) }) +
        ui.section({ title: 'Motivo', tone: 'slate', icon: 'file-text', body: ui.field({ label: 'Motivo', name: 'fd-motivo', type: 'select', required: true, value: motivos[0], options: motivos }) + '<div class="lt-mt-4"></div>' + ui.field({ type: 'textarea', label: 'Observação', rows: 2, placeholder: 'Ex.: o banco devolveu o PIX em 10/11' }) }) + '</div>',
      foot: ui.btn({ label: 'Voltar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: conc ? 'Desfazer conciliação' : 'Desfazer baixa', icon: 'history', variant: 'danger', acao: 'salvar', loading: 'Desfazendo…', toast: conc ? 'Conciliação desfeita' : 'Baixa desfeita', toastText: 'Registrado na auditoria com o motivo. ' + (conc ? 'A linha voltou para a fila de conciliação.' : 'O fluxo de caixa foi atualizado.'), fechar: 'dialog' }),
      mount: (d) => { const b = d.querySelector('[data-acao]'); if (b) b.addEventListener('lt:acao', () => {
        if (conc) { const i = F.extratoConciliado.indexOf(lin); if (i >= 0) F.extratoConciliado.splice(i, 1); F.extrato.push({ id: lin.id, contaId: lin.contaId, data: lin.data, historico: lin.historico, valor: lin.valor, sugestao: { tipo: lin.titulo.t, id: lin.titulo.id, label: lin.label }, conf: 'alta', motivo: 'Conciliação desfeita: confirme o lançamento certo' }); }
        else if (rec) { r.p.status = 'aberto'; delete r.p.recebidoEm; delete r.p.valorRecebido; delete r.p.juros; }
        else { r.p.status = 'aberto'; delete r.p.pagoEm; }
        _nfse = null; if (App.current && App.current.screen.module === 'financeiro') setTimeout(() => App.refresh(), 200);
      }); }
    };
  });

  /* ---------- Diálogo: cancelar título (a receber) ou conta (a pagar), com motivo ---------- */
  ui.registerDialog('fin-cancelar-titulo', (p) => {
    const rec = p.t !== 'p', c = rec ? F.receberConta(p.id) : F.pagarConta(p.id);
    if (!c) return { title: 'Título não encontrado', icon: 'info', size: 'sm' };
    const abertas = c.parcelas.filter((x) => x.status === 'aberto'), quitadas = c.parcelas.filter((x) => x.status === 'recebido' || x.status === 'pago');
    const comBoleto = rec ? abertas.filter((x) => x.boleto && x.boleto.status !== 'cancelado').length : 0;
    const motivos = rec ? ['Lançado em duplicidade', 'Valor ou cliente errado', 'Serviço não prestado ou contrato encerrado', 'Acordo com o cliente', 'Outro'] : ['Lançado em duplicidade', 'Fornecedor cancelou a cobrança', 'Valor errado', 'Outro'];
    return {
      title: rec ? 'Cancelar título #' + c.id : 'Cancelar conta #' + c.id, icon: 'x-circle', iconTone: 'danger', text: esc(c.descricao),
      body: '<div class="lt-sections">' +
        ui.section({ title: 'O que acontece', tone: 'amber', icon: 'alert-triangle', body: ui.dl([['Parcelas canceladas', fmt.plural(abertas.length, 'parcela') + ' em aberto · ' + fmt.moeda(soma(abertas, (x) => x.valor))], ['Parcelas quitadas', quitadas.length ? fmt.plural(quitadas.length, 'parcela') + ' continuam como estão' : 'nenhuma']].concat(rec ? [['Boletos', comBoleto ? fmt.plural(comBoleto, 'boleto baixado', 'boletos baixados') + ' na integração' : 'sem boleto em aberto'], ['NFS-e', 'Notas autorizadas precisam de pedido de cancelamento na prefeitura (em Notas emitidas)']] : [])) }) +
        ui.section({ title: 'Motivo', tone: 'slate', icon: 'file-text', body: ui.field({ label: 'Motivo', type: 'select', required: true, value: motivos[0], options: motivos }) + '<div class="lt-mt-4"></div>' + ui.field({ type: 'textarea', label: 'Observação', rows: 2, placeholder: 'Fica na auditoria junto com o motivo' }) }) + '</div>',
      foot: ui.btn({ label: 'Voltar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: rec ? 'Cancelar título' : 'Cancelar conta', icon: 'x-circle', variant: 'danger', acao: 'excluir', loading: 'Cancelando…', toast: rec ? 'Título cancelado' : 'Conta cancelada', toastText: 'Parcelas em aberto canceladas. O motivo ficou registrado na auditoria.', fechar: 'dialog' }),
      mount: (d) => { const b = d.querySelector('[data-acao]'); if (b) b.addEventListener('lt:acao', () => { abertas.forEach((x) => { x.status = 'cancelado'; if (x.boleto) x.boleto.status = 'cancelado'; }); _nfse = null; setTimeout(() => App.refresh(), 200); }); }
    };
  });

  /* ---------- Gaveta: enviar boleto por e-mail (fin_pdf_boleto_email) / cobrança ---------- */
  ui.registerSheet('fin-enviar-boleto', (p) => {
    const r = rowR(p.id, p.n);
    if (!r) return { title: 'Título não encontrado', body: ui.empty({ icon: 'mail', title: 'Título não encontrado' }) };
    const cob = p.modo === 'cobranca' || r.sit === 'fin_vencido';
    const dias = Math.max(0, atraso(r)), nova = util.iso(util.proximoDiaUtil(util.addDias(HOJE, 3))), rt = RT(r), lq = rt.liquido;
    const cts = contatosCobranca(r.c.empresaId);
    const assunto = cob ? 'Atlas Corporate · Boleto vencido em ' + fmt.data(r.vu) + ' · ' + r.e.fantasia : 'Atlas Corporate · ' + (r.c.tipo === 'exito' ? 'Honorários de êxito' : 'Honorários') + ' ' + mesC(r.c.competencia) + ' · vence ' + fmt.data(r.vu);
    const ola = cts[0] ? cts[0].nome.split(' ')[0] : 'equipe';
    const retTxt = rt.total ? '\n\nO boleto já vem líquido das retenções na fonte: NFS-e de ' + fmt.moeda(r.p.valor) + ' menos IRRF (' + fmt.moeda(rt.irrf) + '), CSLL/PIS/Cofins (' + fmt.moeda(rt.csrf) + ')' + (rt.iss ? ' e ISS (' + fmt.moeda(rt.iss) + ')' : '') + ', que devem ser recolhidos por vocês.' : '';
    const corpo = cob
      ? 'Olá, ' + ola + '.\n\nO boleto de ' + fmt.moeda(lq) + ' (' + r.c.descricao + ') venceu em ' + fmt.data(r.vu) + ' e ainda consta em aberto.\n\nSegue a 2ª via com vencimento em ' + fmt.data(nova) + ', no valor atualizado de ' + fmt.moeda(atualizado(lq, dias)) + ' (multa de ' + ENC.multa + '% e juros de ' + ENC.juros + '% ao mês).\n\nSe o pagamento já foi feito, por favor desconsidere esta mensagem e nos envie o comprovante.\n\nAtenciosamente,\nLarissa Campos\nFinanceiro · Atlas Corporate'
      : 'Olá, ' + ola + '.\n\nSegue o boleto de ' + fmt.moeda(lq) + ' referente a ' + r.c.descricao.toLowerCase() + ', com vencimento em ' + fmt.data(r.vu) + '.' + (r.c.tipo === 'exito' ? '\n\nO êxito corresponde a ' + fmt.pct(r.c.exitoPct) + ' sobre o crédito compensado de ' + fmt.moeda(r.c.base) + ', conforme o contrato' + (r.c.parcelas.length > 1 ? ' (parcela ' + r.p.n + ' de ' + r.c.parcelas.length + ')' : '') + '.' : '') + retTxt + '\n\nA nota fiscal de serviço segue anexa.\n\nAtenciosamente,\nLarissa Campos\nFinanceiro · Atlas Corporate';
    return {
      eyebrow: cob ? 'Cobrança' : 'Envio de boleto', title: cob ? 'Enviar cobrança' : 'Enviar boleto por e-mail', sub: esc(r.e.fantasia) + ' · boleto de ' + fmt.moeda(lq) + ' · vence ' + fmt.data(r.vu),
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Destinatários', tone: 'blue', icon: 'users', body: ui.field({ type: 'checks', label: 'Contatos do cliente', value: cts.slice(0, 2).map((c) => String(c.id)), options: cts.map((c) => ({ value: String(c.id), label: c.nome + ' · ' + c.email, hint: c.cargo + (c.decisor ? ' · decisor' : '') })) }) + '<div class="lt-grid lt-grid--2 lt-mt-4">' + ui.field({ label: 'Outros e-mails', placeholder: 'separe por vírgula' }) + ui.field({ type: 'toggle', label: 'Cópia para mim', checked: true, hint: 'larissa.campos@atlas.exemplo' }) + '</div>' }) +
        ui.section({ title: 'Mensagem', tone: 'gold', icon: 'message', body: ui.field({ label: 'Assunto', value: assunto }) + '<div class="lt-mt-4"></div>' + ui.field({ type: 'textarea', label: 'Texto', rows: 12, value: corpo }) }) +
        ui.section({ title: 'Anexos', tone: 'slate', icon: 'paperclip', body: ui.field({ type: 'checks', value: ['boleto', 'nfse'].concat(r.c.tipo === 'exito' ? ['calc'] : []), options: [{ value: 'boleto', label: (cob ? '2ª via do boleto' : 'Boleto') + ' (PDF)', hint: 'Gerado pela integração de cobrança' }, { value: 'nfse', label: 'NFS-e (PDF)', hint: 'Com as retenções destacadas' }].concat(r.c.tipo === 'exito' ? [{ value: 'calc', label: 'Demonstrativo do cálculo do êxito (PDF)' }] : []) }) }) + '</div>',
      foot: ui.sheetFoot({ label: cob ? 'Enviar cobrança' : 'Enviar e-mail', icon: 'send', acao: 'enviar', toast: 'E-mail enviado', toastText: 'Para ' + fmt.plural(Math.min(2, cts.length), 'destinatário') + '. A abertura do e-mail aparece no histórico do título.' })
    };
  });

  /* ---------- Diálogo: 2ª via ---------- */
  ui.registerDialog('fin-segunda-via', (p) => {
    const r = rowR(p.id, p.n); if (!r) return { title: 'Título não encontrado' };
    const nova = util.iso(util.proximoDiaUtil(util.addDias(HOJE, 3))), lq = LQ(r);
    const calc = (d) => atualizado(lq, Math.max(0, util.diasEntre(r.vu, d)));
    return {
      title: 'Gerar 2ª via do boleto', icon: 'refresh', text: esc(r.e.fantasia) + ' · ' + esc(r.c.descricao),
      body: ui.dl([['Boleto original (líquido)', M(lq)], ['Vencimento original', fmt.data(r.vu)], ['Situação', ui.status(r.sit)]]) +
        '<div class="lt-sections lt-mt-4">' + ui.section({ title: 'Nova via', tone: 'blue', icon: 'send', cols: 2, body: ui.field({ label: 'Novo vencimento', name: 'sv-data', type: 'date', value: nova }) + ui.field({ type: 'toggle', name: 'sv-enc', label: 'Cobrar multa e juros', checked: r.sit === 'fin_vencido' }) }) + '</div>' +
        '<div class="lt-mt-4">' + ui.summary([{ label: 'Valor da 2ª via', value: '<span data-sv-total class="lt-num">' + fmt.moeda(r.sit === 'fin_vencido' ? calc(nova) : lq) + '</span>' }]) + '</div>',
      foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Gerar 2ª via', icon: 'refresh', variant: 'primary', acao: 'gerar', toast: '2ª via gerada', toastText: 'O boleto anterior foi baixado na integração. Envie a 2ª via pelo e-mail.', fechar: 'dialog' }),
      mount: (d) => { const upd = () => { const on = d.querySelector('[name="sv-enc"]').checked; d.querySelector('[data-sv-total]').textContent = fmt.moeda(on ? calc(d.querySelector('[name="sv-data"]').value || HOJE) : lq); }; d.addEventListener('change', upd); }
    };
  });

  /* ---------- Diálogo: gerar boletos em lote (fin_gerar_boletos + fin_confirm-gerar-boleto) ---------- */
  ui.registerDialog('fin-gerar-boletos', (p) => {
    const keys = String(p.keys || '').split(',').filter(Boolean);
    let rows = keys.length ? rowsR().filter((r) => keys.indexOf(r.key) >= 0) : rowsR().filter((r) => r.bol === 'fin_b_nao' && r.venc.slice(0, 7) === '2026-11');
    const ignorados = rows.filter((r) => r.bol !== 'fin_b_nao');
    rows = rows.filter((r) => r.bol === 'fin_b_nao');
    if (!rows.length) return { title: 'Nenhum título sem boleto', icon: 'info', text: ignorados.length ? 'Os títulos selecionados já têm boleto ou foram recebidos. Use 2ª via ou reenvio por e-mail.' : 'Selecione títulos sem boleto na lista.', size: 'sm' };
    const ajust = rows.filter((r) => r.vu !== r.venc);
    return {
      title: 'Gerar ' + fmt.plural(rows.length, 'boleto'), icon: 'receipt', size: 'lg', text: 'Os boletos são registrados na integração de cobrança da conta Itaú · Conta de cobrança, pelo valor líquido de retenções. Confira antes de confirmar.',
      body: '<table class="lt-trail"><thead><tr><th>Cliente</th><th>Título</th><th>Vencimento</th><th style="text-align:right">NFS-e</th><th style="text-align:right">Boleto (líquido)</th></tr></thead><tbody>' + rows.map((r) => '<tr><td class="lt-strong">' + esc(r.e.fantasia) + '</td><td>' + esc(r.c.descricao) + (r.c.parcelas.length > 1 ? ' · ' + r.p.n + '/' + r.c.parcelas.length : '') + '</td><td class="lt-num">' + fmt.data(r.vu) + (r.vu !== r.venc ? ' <span class="lt-hint">(era ' + fmt.dataCurta(r.venc) + ')</span>' : '') + '</td><td class="lt-num fin-r">' + fmt.moeda(r.p.valor) + '</td><td class="lt-num fin-r">' + fmt.moeda(LQ(r)) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" class="lt-strong">Total</td><td class="lt-num lt-strong fin-r">' + fmt.moeda(soma(rows, (r) => r.p.valor)) + '</td><td class="lt-num lt-strong fin-r">' + fmt.moeda(soma(rows, LQ)) + '</td></tr></tfoot></table>' +
        (ajust.length ? '<div class="lt-mt-4">' + ui.callout({ tone: 'warning', title: fmt.plural(ajust.length, 'vencimento cai', 'vencimentos caem') + ' em feriado ou fim de semana', text: 'Ficam pagáveis no próximo dia útil sem encargos: ' + ajust.map((r) => fmt.dataCurta(r.venc) + ' → ' + fmt.dataCurta(r.vu) + (util.feriado(r.venc) ? ' (' + esc(util.feriado(r.venc).nome) + ')' : '')).filter((x, i, a) => a.indexOf(x) === i).join(', ') + '.' }) + '</div>' : '') +
        (ignorados.length ? '<div class="lt-mt-2">' + ui.callout({ tone: 'info', title: fmt.plural(ignorados.length, 'título ignorado', 'títulos ignorados'), text: 'Já tinham boleto ou foram recebidos.' }) + '</div>' : '') +
        '<div class="lt-sections lt-mt-4">' + ui.section({ title: 'Envio', tone: 'blue', icon: 'send', cols: 3, body: ui.field({ type: 'toggle', label: 'Enviar por e-mail após gerar', checked: true }) + ui.field({ type: 'toggle', label: 'Emitir NFS-e junto', checked: true }) + ui.field({ type: 'toggle', label: 'Incluir PIX no boleto', checked: ENC.pix }) }) + '</div>',
      foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Gerar ' + fmt.plural(rows.length, 'boleto'), icon: 'receipt', variant: 'primary', acao: 'gerar', loading: 'Registrando na integração…', toast: fmt.plural(rows.length, 'boleto gerado', 'boletos gerados'), toastText: 'Registrados na integração, com NFS-e emitida e e-mail enviado aos contatos de cobrança.', fechar: 'dialog' }),
      mount: (d) => { const b = d.querySelector('[data-acao="gerar"]'); if (b) b.addEventListener('lt:acao', () => { rows.forEach((r) => { r.p.boleto = { status: 'enviado', geradoEm: HOJE, enviadoEm: HOJE }; }); _nfse = null; if (App.current && App.current.screen.module === 'financeiro') setTimeout(() => App.refresh(), 200); }); }
    };
  });

  /* ================================================================== */
  /* FLUXO DE CAIXA                                                       */
  /* ================================================================== */
  function movimentosNov(contaId) {
    const dias = [];
    for (let d = 1; d <= 30; d++) dias.push({ iso: '2026-11-' + (d < 10 ? '0' : '') + d, entPrev: 0, entReal: 0, saiPrev: 0, saiReal: 0 });
    const idx = (iso) => +iso.slice(8, 10) - 1;
    const naConta = (cid) => !contaId || String(cid) === String(contaId);
    const lanc = [];
    rowsR().forEach((r) => {
      if (r.p.status === 'recebido') { if (r.p.recebidoEm.slice(0, 7) === '2026-11' && naConta(r.p.contaId || r.c.contaId)) { dias[idx(r.p.recebidoEm)].entReal += valorPago(r); lanc.push({ r, t: 'r', data: r.p.recebidoEm, real: true, valor: valorPago(r) }); } }
      else if (isAberto(r) && r.venc.slice(0, 7) === '2026-11' && naConta(r.c.contaId)) { const d = r.vu < HOJE ? HOJE : r.vu; if (d.slice(0, 7) === '2026-11') { dias[idx(d)].entPrev += LQ(r); lanc.push({ r, t: 'r', data: d, real: false, valor: LQ(r) }); } }
    });
    rowsP().forEach((r) => {
      if (r.p.status === 'pago') { if (r.p.pagoEm.slice(0, 7) === '2026-11' && naConta(r.p.contaId || r.c.contaId)) { dias[idx(r.p.pagoEm)].saiReal += r.p.valor; lanc.push({ r, t: 'p', data: r.p.pagoEm, real: true, valor: r.p.valor }); } }
      else if (isAberto(r) && r.venc.slice(0, 7) === '2026-11' && naConta(r.c.contaId)) { const d = r.vu < HOJE ? HOJE : r.vu; if (d.slice(0, 7) === '2026-11') { dias[idx(d)].saiPrev += r.p.valor; lanc.push({ r, t: 'p', data: d, real: false, valor: r.p.valor }); } }
    });
    const saldoHoje = contaId ? (F.conta(contaId) || { saldo: 0 }).saldo : soma(F.contas, (c) => c.saldo);
    const realAteHoje = soma(dias.filter((d) => d.iso <= HOJE), (d) => d.entReal - d.saiReal);
    let s = saldoHoje - realAteHoje; const inicial = s;
    dias.forEach((d) => { s += d.entReal + d.entPrev - d.saiReal - d.saiPrev; d.saldo = s; });
    return { dias, inicial, final: s, lanc: lanc.sort((a, b) => a.data.localeCompare(b.data)) };
  }
  /* Saldo dia a dia: realizado (linha sólida) até hoje, previsto (tracejada) depois, com marcador "hoje" */
  function graficoSaldo(dias) {
    const W = 1000, H = 230, padL = 52, padR = 14, padT = 22, padB = 26, iw = W - padL - padR, ih = H - padT - padB;
    const vals = dias.map((d) => d.saldo), mn0 = Math.min.apply(null, vals), mx0 = Math.max.apply(null, vals);
    /* eixo com 4 passos redondos (10, 20, 25, 50 mil…) cobrindo o mínimo e o máximo do mês */
    let raw = Math.max(1, mx0 - mn0) * 1.3 / 4, pw = Math.pow(10, Math.floor(Math.log10(raw))), nn = raw / pw, stp = (nn <= 1 ? 1 : nn <= 2 ? 2 : nn <= 2.5 ? 2.5 : nn <= 5 ? 5 : 10) * pw;
    let mn = Math.max(0, Math.floor((mn0 - stp * 0.4) / stp) * stp); while (mn + 4 * stp < mx0 + stp * 0.2) stp = stp * 2 >= pw * 10 ? stp * 2 : stp * 2;
    mn = Math.max(0, Math.floor((mn0 - stp * 0.4) / stp) * stp); const mx = mn + 4 * stp;
    const step = iw / (dias.length - 1), X = (i) => padL + step * i, Y = (v) => padT + ih - ih * (v - mn) / (mx - mn);
    const iH = Math.max(0, dias.findIndex((d) => d.iso === HOJE));
    const path = (a, b) => dias.slice(a, b + 1).map((d, k) => (k ? 'L' : 'M') + X(a + k).toFixed(1) + ' ' + Y(d.saldo).toFixed(1)).join(' ');
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Saldo dia a dia: realizado até hoje e previsto até o fim do mês">';
    for (let g = 0; g <= 4; g++) { const v = mn + (mx - mn) * g / 4, y = Y(v); s += '<line class="lt-chart__grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text x="' + (padL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + esc(EIXO(v)) + '</text>'; }
    s += '<path d="' + path(0, iH) + ' L' + X(iH).toFixed(1) + ' ' + (padT + ih) + ' L' + padL + ' ' + (padT + ih) + 'Z" style="fill:var(--chart-1);opacity:.12"/>';
    s += '<path d="' + path(0, iH) + '" style="fill:none;stroke:var(--chart-1);stroke-width:2"/>';
    s += '<path d="' + path(iH, dias.length - 1) + '" style="fill:none;stroke:var(--chart-1);stroke-width:2;stroke-dasharray:4 4"/>';
    s += '<line class="fin-chart__hoje" x1="' + X(iH).toFixed(1) + '" x2="' + X(iH).toFixed(1) + '" y1="' + (padT - 6) + '" y2="' + (padT + ih) + '"/><text class="fin-chart__hoje-lbl" x="' + (X(iH) + 6).toFixed(1) + '" y="' + (padT - 8) + '">hoje · ' + fmt.dataCurta(HOJE) + '</text>';
    dias.forEach((d, i) => { const real = i <= iH; s += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(d.saldo).toFixed(1) + '" r="' + (i === iH ? 4 : 2.5) + '" style="fill:' + (real ? 'var(--chart-1)' : 'var(--surface)') + ';stroke:var(--chart-1);stroke-width:1.5"><title>' + esc(fmt.dataCurta(d.iso) + (real ? ' (realizado)' : ' (previsto)') + ': ' + fmt.moeda(d.saldo)) + '</title></circle>'; if (i === 0 || (i + 1) % 5 === 0) s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + String(i + 1).padStart(2, '0') + '</text>'; });
    s += '</svg>';
    return '<div class="lt-chart fin-chart">' + s + '<div class="lt-legend"><span class="lt-legend__item" style="color:var(--chart-1)"><span class="fin-sw-solid"></span><span style="color:var(--text-2)">Realizado (até ' + fmt.dataCurta(HOJE) + ')</span></span><span class="lt-legend__item" style="color:var(--chart-1)"><span class="fin-sw-dash"></span><span style="color:var(--text-2)">Previsto (títulos em aberto)</span></span></div></div>';
  }
  App.screen({
    id: 'fin.cashflow', hash: 'fin-fluxo-caixa', module: 'financeiro', title: 'Fluxo de caixa', nav: true, navGroup: 'financeiro', navOrder: 5,
    render: () => {
      const contaId = App.state.finFluxoConta || '';
      const m = movimentosNov(contaId), dias = m.dias;
      const ent = soma(dias, (d) => d.entReal + d.entPrev), sai = soma(dias, (d) => d.saiReal + d.saiPrev), entR = soma(dias, (d) => d.entReal), saiR = soma(dias, (d) => d.saiReal);
      const header = ui.pageHeader({ breadcrumb: crumb('Fluxo de caixa'), title: 'Fluxo de caixa', sub: 'Previsto × realizado. Realizado = recebimentos e pagamentos baixados; previsto = títulos em aberto na data em que ficam pagáveis (dia útil). Entradas pelo líquido de retenções.',
        actions: '<label class="lt-row lt-row--nowrap lt-small lt-muted" style="gap:8px">Conta<select class="lt-select fin-sel" data-fin-fluxo-conta><option value="">Todas as contas</option>' + F.contas.map((c) => '<option value="' + c.id + '"' + (String(c.id) === String(contaId) ? ' selected' : '') + '>' + esc(BANCO_CURTO[c.id] + ' · ' + c.apelido) + '</option>').join('') + '</select></label>' + ui.btn({ label: EXPORTAR, icon: 'download', acao: 'exportar', toast: 'Fluxo exportado', toastText: 'fluxo-de-caixa-nov-2026.xlsx' }) });
      const kpis = ui.kpis([
        { label: 'Saldo em 01/11', value: fmt.moeda(m.inicial, true), icon: 'landmark', foot: contaId ? esc(contaNome(contaId)) : 'todas as contas' },
        { label: 'Entradas de novembro', value: fmt.moeda(ent, true), icon: 'arrow-down', progress: { value: entR, max: ent || 1, tone: 'green' }, foot: MC(entR) + ' realizadas · ' + MC(ent - entR) + ' previstas' },
        { label: 'Saídas de novembro', value: fmt.moeda(sai, true), icon: 'arrow-up', progress: { value: saiR, max: sai || 1, tone: 'amber' }, foot: MC(saiR) + ' realizadas · ' + MC(sai - saiR) + ' previstas' },
        { label: 'Saldo previsto em 30/11', value: fmt.moeda(m.final, true), icon: 'trending-up', delta: (m.final >= m.inicial ? '+' : '') + MC(m.final - m.inicial), dir: m.final >= m.inicial ? 'up' : 'down', foot: 'no mês' }
      ]);
      const graf = ui.card({ title: 'Saldo dia a dia · novembro de 2026', icon: 'chart-line', sub: 'Em R$ · linha sólida = realizado até hoje (' + fmt.dataCurta(HOJE) + '); tracejada = previsto com os títulos em aberto', body: graficoSaldo(dias) });
      const tDiario = ui.table({ rows: dias, compact: true, maxHeight: 430, rowClass: (d) => (d.iso === HOJE ? 'fin-hoje' : (!util.ehDiaUtil(d.iso) ? 'is-muted' : '')), columns: [
        { label: 'Dia', key: 'iso', render: (d) => { const f = util.feriado(d.iso); return '<span class="lt-num lt-strong">' + fmt.dataCurta(d.iso) + '</span> <span class="lt-hint">' + fmt.diaSemanaCurto(d.iso) + '</span>' + (f ? '<span class="lt-table__secondary">' + esc(f.nome) + '</span>' : d.iso === HOJE ? '<span class="lt-table__secondary lt-gold">Hoje</span>' : ''); } },
        { label: 'Entradas previstas', key: 'ep', align: 'right', render: (d) => d.entPrev ? M(d.entPrev) : '<span class="lt-muted">—</span>' },
        { label: 'Entradas realizadas', key: 'er', align: 'right', render: (d) => d.entReal ? M(d.entReal, 'lt-success') : '<span class="lt-muted">—</span>' },
        { label: 'Saídas previstas', key: 'sp', align: 'right', render: (d) => d.saiPrev ? M(d.saiPrev) : '<span class="lt-muted">—</span>' },
        { label: 'Saídas realizadas', key: 'sr', align: 'right', render: (d) => d.saiReal ? M(d.saiReal, 'lt-danger') : '<span class="lt-muted">—</span>' },
        { label: 'Saldo do dia', key: 'saldo', align: 'right', render: (d) => '<b class="lt-num">' + fmt.moeda(d.saldo) + '</b>' }
      ], foot: ['<span class="lt-muted">Total do mês</span>', M(soma(dias, (d) => d.entPrev)), M(entR), M(soma(dias, (d) => d.saiPrev)), M(saiR), M(m.final)] });
      const ms = fluxoMeses(); let sf = m.inicial; const finais = {};
      for (let i = ms.findIndex((x) => x.mes === '2026-11') - 1; i >= 0; i--) { finais[ms[i].mes] = sf; sf -= (ms[i].entReal - ms[i].saiReal); }
      finais['2026-11'] = m.final; const dez = ms.find((x) => x.mes === '2026-12'); if (dez) finais['2026-12'] = m.final + dez.entPrev - dez.saiPrev;
      const tMensal = ui.table({ rows: ms, compact: true, rowClass: (x) => x.mes === '2026-11' ? 'fin-hoje' : '', columns: [
        { label: 'Mês', key: 'mes', render: (x) => '<span class="lt-strong">' + esc(mesC(x.mes)) + '</span>' + (x.mes === '2026-11' ? '<span class="lt-table__secondary">em andamento</span>' : x.entReal == null ? '<span class="lt-table__secondary">previsão</span>' : '') },
        { label: 'Entradas prev.', key: 'ep', align: 'right', render: (x) => M(x.entPrev) },
        { label: 'Entradas real.', key: 'er', align: 'right', render: (x) => x.entReal != null ? M(x.entReal) + (x.mes !== '2026-11' ? '<span class="lt-table__secondary ' + (x.entReal >= x.entPrev ? 'lt-success' : 'lt-danger') + '">' + fmt.pct(100 * (x.entReal - x.entPrev) / x.entPrev, 1) + '</span>' : '') : '<span class="lt-muted">—</span>' },
        { label: 'Saídas prev.', key: 'sp', align: 'right', render: (x) => M(x.saiPrev) },
        { label: 'Saídas real.', key: 'sr', align: 'right', render: (x) => x.saiReal != null ? M(x.saiReal) : '<span class="lt-muted">—</span>' },
        { label: 'Resultado', key: 'res', align: 'right', render: (x) => { const v = x.entReal != null && x.mes !== '2026-11' ? x.entReal - x.saiReal : x.entPrev - x.saiPrev; return M(v, v < 0 ? 'lt-danger' : 'lt-success'); } },
        { label: 'Saldo final', key: 'sf', align: 'right', render: (x) => finais[x.mes] != null ? '<b class="lt-num">' + fmt.moeda(finais[x.mes]) + '</b>' : '—' }
      ] });
      const grafM = ui.chart.bar({ labels: ms.map((x) => mesC(x.mes).slice(0, 3)), width: 1000, height: 200, format: EIXO, series: [{ name: 'Entradas', color: 'var(--chart-4)', values: ms.map((x) => x.entReal != null && x.mes !== '2026-11' ? x.entReal : x.entPrev) }, { name: 'Saídas', color: 'var(--chart-1)', values: ms.map((x) => x.saiReal != null && x.mes !== '2026-11' ? x.saiReal : x.saiPrev) }] });
      const tLanc = ui.table({ rows: m.lanc, compact: true, pageSize: 12, rowClass: (x) => x.t === 'r' ? 'fin-row-in' : 'fin-row-out', rowHref: (x) => '#fin-conta-' + (x.t === 'r' ? 'receber-' : 'pagar-') + x.r.c.id, columns: [
        { label: 'Tipo', key: 't', render: (x) => ui.chip(x.t === 'r' ? 'Entrada' : 'Saída', x.t === 'r' ? 'green' : 'red', { icon: x.t === 'r' ? 'arrow-down' : 'arrow-up' }) },
        { label: 'Cliente / fornecedor', key: 'n', render: (x) => '<span class="lt-table__primary">' + esc(x.t === 'r' ? x.r.e.fantasia : x.r.nome) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:280px">' + esc(x.r.c.descricao) + '</span>' },
        { label: 'Forma · conta', key: 'f', render: (x) => '<span class="lt-small">' + esc(formaNome(x.r.c.forma)) + '</span><span class="lt-table__secondary">' + esc(BANCO_CURTO[x.r.p.contaId || x.r.c.contaId]) + '</span>' },
        { label: 'Data', key: 'data', render: (x) => '<span class="lt-num">' + fmt.dataCurta(x.data) + '</span>' },
        { label: 'Parc.', key: 'p', align: 'center', render: (x) => '<span class="lt-num">' + x.r.p.n + '/' + x.r.c.parcelas.length + '</span>' },
        { label: 'Valor', key: 'v', align: 'right', render: (x) => M(x.t === 'r' ? x.valor : -x.valor, x.t === 'r' ? 'lt-success' : 'lt-danger') },
        { label: 'Situação', key: 's', render: (x) => x.real ? ui.chip('Realizado', 'green', { dot: true }) : x.r.sit === 'fin_vencido' ? ui.status('fin_vencido') : ui.chip('Previsto', 'blue', { dot: true }) }
      ] });
      return header + kpis + '<div class="lt-mt-6"></div>' + ui.card({ body: ui.tabs({ id: 'fin-fluxo', tabs: [
        { key: 'diario', label: 'Diário', icon: 'calendar', content: graf + '<div class="lt-mt-4"></div>' + tDiario },
        { key: 'mensal', label: 'Mensal', icon: 'chart-bar', content: ui.card({ title: 'Entradas e saídas por mês', icon: 'chart-bar', sub: 'Em R$ · realizado até outubro; novembro e dezembro previstos', body: grafM }) + '<div class="lt-mt-4">' + tMensal + '</div>' + '<div class="lt-mt-4">' + ui.callout({ tone: 'warning', title: 'Dezembro pressiona o caixa', text: 'Previsão de saídas de ' + fmt.moeda(dez ? dez.saiPrev : 0) + ' com ' + esc(dez ? dez.nota : '') + '. O saldo continua positivo porque a reserva em CDB cobre o mês.' }) + '</div>' },
        { key: 'lanc', label: 'Lançamentos', icon: 'list', count: m.lanc.length, content: tLanc }
      ] }) });
    },
    mount: (root) => { const s = root.querySelector('[data-fin-fluxo-conta]'); if (s) s.addEventListener('change', () => { App.state.finFluxoConta = s.value; App.refresh(); }); }
  });

  /* ================================================================== */
  /* DRE                                                                   */
  /* ================================================================== */
  function dreModel() {
    const n = F.dre.meses.length, L = F.dre.linhas, zeros = () => Array(n).fill(0);
    const grupos = {}, semTipo = [];
    Object.keys(L).forEach((k) => {
      const parts = k.split('|'), cat = parts[0], sub = parts[1], pl = F.plano(cat, sub), vals = L[k];
      if (!pl || !pl.tipoDre) { semTipo.push({ cat, sub, vals }); return; }
      if (pl.tipoDre === 'nao_dre') return;
      const sign = pl.tipoDre === 'receita' ? 1 : pl.tipoDre === 'financeiro' ? (pl.natureza === 'receita' ? 1 : -1) : -1;
      const g = grupos[pl.tipoDre] = grupos[pl.tipoDre] || { cats: {}, ordem: [], tot: zeros() };
      if (!g.cats[cat]) { g.cats[cat] = { cat, nome: (F.cat(cat) || {}).nome, subs: [], tot: zeros() }; g.ordem.push(cat); }
      const sv = vals.map((v) => v * sign);
      g.cats[cat].subs.push({ sub, vals: sv }); sv.forEach((v, i) => { g.cats[cat].tot[i] += v; g.tot[i] += v; });
    });
    const t = (k) => (grupos[k] || { tot: zeros() }).tot, add = (a, b) => a.map((v, i) => v + b[i]);
    const tot = { bruta: t('receita') }; tot.rl = add(tot.bruta, t('deducao')); tot.mc = add(tot.rl, t('variavel')); tot.op = add(tot.mc, t('fixa')); tot.air = add(tot.op, t('financeiro')); tot.liq = add(tot.air, t('ir_csll'));
    return { grupos, tot, semTipo, n };
  }
  const DRE_ORDEM = [
    { tipo: 'receita', titulo: 'Receita bruta' }, { tipo: 'deducao', titulo: '(−) Deduções da receita' }, { total: 'rl', titulo: '(=) Receita líquida' },
    { tipo: 'variavel', titulo: '(−) Custos diretos e despesas variáveis' }, { total: 'mc', titulo: '(=) Margem de contribuição' },
    { tipo: 'fixa', titulo: '(−) Despesas fixas' }, { total: 'op', titulo: '(=) Resultado operacional' },
    { tipo: 'financeiro', titulo: '(±) Resultado financeiro' }, { total: 'air', titulo: '(=) Resultado antes do IRPJ e da CSLL' },
    { tipo: 'ir_csll', titulo: '(−) IRPJ e CSLL (lucro presumido)' }, { total: 'liq', titulo: '(=) Resultado líquido', result: true }
  ];
  function dreTabela(md, foco, detalhar) {
    const meses = F.dre.meses, bruta = md.tot.bruta;
    const nv = (v) => (v < 0 ? '−' : '') + fmt.num(Math.abs(v), 0);
    const tds = (vals, cls) => {
      let s = '';
      vals.forEach((v, i) => { s += '<td class="lt-num' + (i === foco ? ' is-foco' : '') + (cls && v < 0 ? ' lt-danger' : '') + '">' + (Math.abs(v) < 0.5 ? '<span class="lt-muted">—</span>' : nv(v)) + '</td>'; });
      const acc = vals.slice(0, foco + 1).reduce((a, b) => a + b, 0);
      s += '<td class="lt-num">' + nv(acc) + '</td>';
      s += '<td class="lt-num">' + (bruta[foco] ? fmt.pct(100 * vals[foco] / bruta[foco], 1) : '—') + '</td>';
      const ant = foco > 0 ? vals[foco - 1] : null, dv = ant ? 100 * (vals[foco] - ant) / Math.abs(ant) : null;
      s += '<td class="lt-num">' + (dv == null || !isFinite(dv) || Math.abs(ant) < 0.5 ? '<span class="lt-muted">—</span>' : '<span class="' + (Math.abs(dv) < 0.05 ? 'lt-muted' : dv > 0 ? 'lt-success' : 'lt-danger') + '">' + (dv > 0 ? '+' : '') + fmt.num(dv, 1) + '%</span>') + '</td>';
      return s;
    };
    let h = '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact fin-dre"><thead><tr><th style="min-width:250px">Conta (valores em R$)</th>' +
      meses.map((m, i) => '<th class="lt-num' + (i === foco ? ' is-foco' : '') + '">' + esc(mesC(m)) + (F.dre.status[i] === 'aberto' ? ' (prev.)' : '') + '</th>').join('') +
      '<th class="lt-num">Acum. até ' + esc(mesC(meses[foco]).slice(0, 3)) + '</th><th class="lt-num">AV %</th><th class="lt-num">Δ mês</th></tr></thead><tbody>';
    DRE_ORDEM.forEach((o) => {
      if (o.total) { h += '<tr class="' + (o.result ? 'fin-dre__result' : 'fin-dre__total') + '"><td>' + esc(o.titulo) + '</td>' + tds(md.tot[o.total], true) + '</tr>'; return; }
      const g = md.grupos[o.tipo]; if (!g) return;
      h += '<tr class="fin-dre__grupo"><td>' + esc(o.titulo) + '</td>' + tds(g.tot) + '</tr>';
      g.ordem.forEach((ck) => {
        const c = g.cats[ck];
        h += '<tr class="fin-dre__cat' + (detalhar ? ' is-open' : '') + '" data-fin-dre-cat="' + o.tipo + '-' + ck + '"><td>' + I('chevron-right') + ' ' + esc(c.nome) + ' <span class="lt-hint">(' + c.subs.length + ')</span></td>' + tds(c.tot) + '</tr>';
        c.subs.forEach((s) => { h += '<tr class="fin-dre__sub" data-fin-dre-sub="' + o.tipo + '-' + ck + '"' + (detalhar ? '' : ' hidden') + '><td>' + esc(s.sub) + '</td>' + tds(s.vals) + '</tr>'; });
      });
    });
    return h + '</tbody></table></div></div>';
  }
  App.screen({
    id: 'fin.dre', hash: 'fin-dre', module: 'financeiro', title: 'DRE gerencial', nav: true, navGroup: 'financeiro', navLabel: 'DRE', navOrder: 6,
    render: () => {
      const S = App.state.finDre || (App.state.finDre = { foco: 3, detalhar: false });
      const md = dreModel(), foco = S.foco, meses = F.dre.meses, T = md.tot;
      const dl = (k) => foco > 0 ? T[k][foco] - T[k][foco - 1] : 0;
      const header = ui.pageHeader({ breadcrumb: crumb('DRE gerencial'), title: 'DRE gerencial', sub: 'Demonstrativo mensal por competência. Cada linha vem do tipo DRE da subcategoria no plano de contas. Lucro presumido: ISS 3%, PIS 0,65%, Cofins 3%. Retenções na fonte não são despesa: aparecem abaixo, como antecipação.',
        actions: '<label class="lt-row lt-row--nowrap lt-small lt-muted" style="gap:8px">Mês em foco<select class="lt-select" data-fin-dre-foco style="height:34px;width:auto">' + meses.map((m, i) => '<option value="' + i + '"' + (i === foco ? ' selected' : '') + '>' + esc(fmt.mesAno(m + '-01')) + '</option>').join('') + '</select></label>' +
          ui.segmented([{ label: 'Competência', value: 'comp', active: true }, { label: 'Caixa', value: 'caixa' }], { name: 'fin-dre-regime' }) +
          ui.btn({ label: EXPORTAR, icon: 'download', acao: 'exportar', toast: 'DRE exportado', toastText: 'dre-jul-nov-2026.xlsx' }) });
      const status = '<div class="lt-row lt-mb-4" style="gap:14px">' + meses.map((m, i) => '<span class="lt-row lt-row--nowrap lt-small" style="gap:6px"><span class="lt-strong">' + esc(mesC(m)) + '</span>' + ui.status('fin_' + F.dre.status[i]) + '</span>').join('') + '<span class="lt-push"></span>' +
        (F.dre.status[foco] === 'revisao' ? ui.btn({ label: 'Aprovar fechamento de ' + fmt.mesAno(meses[foco] + '-01').split(' ')[0].toLowerCase(), icon: 'check', variant: 'primary', size: 'sm', acao: 'aprovar', toast: 'Fechamento aprovado', toastText: 'Novos lançamentos nesta competência pedem reabertura pelo sócio.' }) : F.dre.status[foco] === 'fechado' ? ui.btn({ label: 'Reabrir mês', icon: 'lock', size: 'sm', acao: 'salvar', confirm: 'Reabrir ' + mesC(meses[foco]) + '?', confirmText: 'O mês volta para revisão e aceita lançamentos. A reabertura fica na auditoria.', confirmLabel: 'Reabrir', toast: 'Mês reaberto para revisão' }) : '') + '</div>';
      const kpis = ui.kpis([
        { label: 'Receita bruta', value: fmt.moeda(T.bruta[foco], true), icon: 'wallet', delta: foco ? (dl('bruta') >= 0 ? '+' : '') + MC(dl('bruta')) : null, dir: dl('bruta') > 0 ? 'up' : dl('bruta') < 0 ? 'down' : 'flat', foot: mesC(meses[foco]) + ' vs. mês anterior' },
        { label: 'Margem de contribuição', value: fmt.pct(100 * T.mc[foco] / T.bruta[foco], 1), icon: 'percent', foot: fmt.moeda(T.mc[foco], true) + ' depois de impostos e custos diretos' },
        { label: 'Resultado operacional', value: fmt.moeda(T.op[foco], true), icon: 'chart-bar', delta: foco ? (dl('op') >= 0 ? '+' : '') + MC(dl('op')) : null, dir: dl('op') > 0 ? 'up' : 'down', foot: 'antes do financeiro e do IR' },
        { label: 'Resultado líquido', value: fmt.moeda(T.liq[foco], true), icon: T.liq[foco] >= 0 ? 'trending-up' : 'trending-down', foot: 'margem líquida de ' + fmt.pct(100 * T.liq[foco] / T.bruta[foco], 1) }
      ]);
      const chart = ui.card({ title: 'Receita × resultado', icon: 'chart-bar', sub: 'Em R$ por mês', body: ui.chart.bar({ labels: meses.map((m) => mesC(m).slice(0, 3)), width: 580, height: 200, format: EIXO, series: [{ name: 'Receita bruta', color: 'var(--chart-1)', values: T.bruta }, { name: 'Resultado líquido', color: 'var(--chart-4)', values: T.liq }] }) + (T.liq.some((v) => v < 0) ? '<p class="lt-hint">Barra vermelha abaixo do eixo = prejuízo no mês: ' + meses.map((m, i) => (T.liq[i] < 0 ? mesC(m) + ' (' + fmt.moeda(-T.liq[i], true) + ')' : '')).filter(Boolean).join(', ') + '.</p>' : '') });
      const sem = md.semTipo.filter((s) => s.vals.some((v) => v)), RD = F.dre.retencoes;
      const atencao = ui.card({ title: 'Pontos de atenção', icon: 'alert-triangle', flush: true, body: ui.list([
        { icon: 'trending-down', tone: 'red', title: 'Julho: resultado negativo', meta: 'Êxito abaixo da média (' + MC(F.dre.linhas['honorarios|Honorários de êxito'][0]) + ') com despesas fixas estáveis.' },
        { icon: 'users', tone: 'amber', title: 'Pessoal = ' + fmt.pct(100 * Math.abs(md.grupos.fixa.cats.pessoal_adm.tot[foco] + md.grupos.fixa.cats.pessoal_tec.tot[foco]) / Math.abs(md.grupos.fixa.tot[foco]), 0) + ' das despesas fixas', meta: 'Dezembro terá 13º salário fora da média (ver fluxo de caixa).' },
        { icon: 'calculator', tone: 'violet', title: 'Perícia de outubro (' + MC(4800) + ') não é reembolsável', meta: 'Contrato da Americana Fios não prevê repasse. Confirme na revisão.', href: '#fin-conta-pagar-13002' },
        { icon: 'shield', tone: 'slate', title: 'Retenções cobrem ' + fmt.pct(100 * (RD.pis[foco] + RD.cofins[foco]) / Math.max(1, F.dre.linhas['impostos|PIS'][foco] + F.dre.linhas['impostos|Cofins'][foco]), 0) + ' do PIS/Cofins do mês', meta: 'O DARF sai só pelo saldo: ' + fmt.moeda(soma([13201, 13202], (id) => (F.pagarConta(id) || { parcelas: [{ valor: 0 }] }).parcelas[0].valor)) + ' em out/2026, do que os clientes ainda não pagaram. IRRF e CSLL retidos abatem o IRPJ e a CSLL do trimestre.', href: '#fin-conta-pagar-13202' }
      ].concat(sem.length ? [{ icon: 'alert-circle', tone: 'red', title: sem.length + ' subcategoria sem tipo DRE: ' + esc(sem.map((s) => s.sub).join(', ')), meta: fmt.moeda(soma(sem, (s) => s.vals[foco] || s.vals[4] || 0)) + ' fora do DRE · classifique no plano de contas', href: '#fin-plano-contas' }] : [])) });
      return header + status + kpis + '<div class="lt-g12 lt-mt-6"><div class="lt-c7">' + chart + '</div><div class="lt-c5">' + atencao + '</div></div>' +
        '<div class="lt-row lt-mt-6 lt-mb-4"><span class="lt-label-caps">Demonstrativo</span><span class="lt-push"></span>' + ui.field({ type: 'toggle', name: 'fin-dre-detalhar', label: 'Detalhar subcategorias', checked: S.detalhar }) + '</div>' +
        '<div data-fin-dre-tabela>' + dreTabela(md, foco, S.detalhar) + '</div>' +
        '<p class="lt-hint lt-mt-2">AV % = análise vertical sobre a receita bruta do mês em foco. Δ mês = variação contra o mês anterior. Linhas "Fora do DRE" (equipamentos, depósitos judiciais, reembolsos de custas e tributos retidos a compensar) não entram.</p>' +
        '<div class="lt-mt-6">' + ui.card({ title: 'Tributos retidos na fonte · antecipação (fora do DRE)', icon: 'shield', sub: 'Retidos pelos clientes nas NFS-e do mês. Ficam em "Tributos retidos a compensar" (plano 4.01) e abatem as guias: PIS/Cofins no DARF do mês, IRRF e CSLL no fechamento do trimestre.', flush: true,
          body: '<div class="lt-table-wrap"><table class="lt-table lt-table--compact fin-dre"><thead><tr><th style="min-width:250px">Retenção (valores em R$)</th>' + meses.map((m, i) => '<th class="lt-num' + (i === foco ? ' is-foco' : '') + '">' + esc(mesC(m)) + '</th>').join('') + '<th>Abate</th></tr></thead><tbody>' +
            [['IRRF 1,5%', RD.irrf, 'IRPJ do trimestre'], ['CSLL 1%', RD.csll, 'CSLL do trimestre'], ['PIS 0,65%', RD.pis, 'DARF de PIS do mês'], ['Cofins 3%', RD.cofins, 'DARF de Cofins do mês'], ['ISS retido pelo tomador', RD.iss, 'guia municipal']].map((x) => '<tr><td>' + esc(x[0]) + '</td>' + x[1].map((v, i) => '<td class="lt-num' + (i === foco ? ' is-foco' : '') + '">' + (v ? fmt.num(v, 0) : '<span class="lt-muted">—</span>') + '</td>').join('') + '<td class="lt-small lt-muted">' + esc(x[2]) + '</td></tr>').join('') +
            '<tr class="fin-dre__total"><td>Total retido</td>' + meses.map((m, i) => '<td class="lt-num' + (i === foco ? ' is-foco' : '') + '">' + fmt.num(RD.irrf[i] + RD.csll[i] + RD.pis[i] + RD.cofins[i] + RD.iss[i], 0) + '</td>').join('') + '<td></td></tr></tbody></table></div>' }) + '</div>';
    },
    mount: (root) => {
      const S = App.state.finDre;
      const f = root.querySelector('[data-fin-dre-foco]'); if (f) f.addEventListener('change', () => { S.foco = +f.value; App.refresh(); });
      on(root, 'change', (e) => { if (e.target.name === 'fin-dre-detalhar') { S.detalhar = e.target.checked; root.querySelectorAll('[data-fin-dre-sub]').forEach((tr) => { tr.hidden = !S.detalhar; }); root.querySelectorAll('[data-fin-dre-cat]').forEach((tr) => tr.classList.toggle('is-open', S.detalhar)); } });
      on(root, 'click', (e) => { const tr = e.target.closest('[data-fin-dre-cat]'); if (!tr) return; const k = tr.getAttribute('data-fin-dre-cat'), open = !tr.classList.contains('is-open'); tr.classList.toggle('is-open', open); root.querySelectorAll('[data-fin-dre-sub="' + k + '"]').forEach((x) => { x.hidden = !open; }); });
      on(root, 'lt:segment', (e) => { if (e.detail.name === 'fin-dre-regime' && e.detail.value === 'caixa') ui.toast('Regime de caixa', 'info', 'Na versão final os valores passam a considerar a data do recebimento e do pagamento. No protótipo a tabela mostra a competência.'); });
    }
  });

  /* ================================================================== */
  /* HONORÁRIOS E ÊXITO (contratos ganhos no CRM)                         */
  /* ================================================================== */
  const MESES_N = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const BASE_EXITO = { compensado: 'Crédito efetivamente compensado (PER/DCOMP transmitido)', habilitado: 'Crédito habilitado na Receita (deferimento da habilitação)' };
  const cInfo = (id) => F.contratoInfo[id] || {};
  /* Êxito do contrato a partir das compensações (fonte única): faturado = compensações realizadas × %. */
  function contratoFin(c) {
    const comps = F.compensacoesDo(c.id).filter((x) => x.situacao === 'realizada');
    const R = rowsR().filter((r) => r.c.contratoId === c.id && r.c.tipo === 'exito');
    const hist = soma(comps.filter((x) => !x.tituloId), (x) => x.valor) * c.exitoPct / 100;
    const faturado = hist + soma(R.filter((r) => r.sit !== 'fin_cancelado'), (r) => r.p.valor), recebido = hist + soma(R.filter((r) => r.sit === 'fin_recebido'), (r) => r.p.valor);
    const rec = recuperado(c), potencial = Math.max(0, c.creditoEstimado - rec) * c.exitoPct / 100;
    const prox = rowsR().filter((r) => r.c.contratoId === c.id && isAberto(r)).sort((a, b) => a.vu.localeCompare(b.vu))[0];
    return { faturado, recebido, aReceber: faturado - recebido, potencial, prox, rec };
  }
  App.screen({
    id: 'fin.contract.list', hash: 'fin-honorarios', module: 'financeiro', title: 'Honorários e êxito', nav: true, navGroup: 'financeiro', navOrder: 7,
    render: () => {
      const cs = D.contratos.filter((c) => c.status === 'ativo').map((c) => Object.assign({ e: emp(c.empresaId), fin: contratoFin(c), info: cInfo(c.id) }, c));
      const mensal = soma(cs, (c) => c.honorarioMensal), rec = soma(cs, (c) => c.fin.rec), est = soma(cs, (c) => c.creditoEstimado);
      const reaj = cs.filter((c) => c.info.reajustePendente), venceVig = cs.filter((c) => c.info.fim && c.info.fim <= '2027-01-31');
      return ui.pageHeader({ breadcrumb: crumb('Honorários e êxito'), title: 'Honorários e êxito', sub: 'Contratos ganhos no CRM: honorários mensais e êxito sobre o crédito efetivamente compensado. O crédito recuperado vem das compensações ligadas aos processos do Jurídico.',
          actions: ui.btn({ label: 'Ver funil no CRM', icon: 'briefcase', href: '#crm-funil' }) + ui.btn({ label: 'Novo contrato', icon: 'plus', variant: 'primary', sheet: 'fin-contrato-form' }) }) +
        ui.kpis([
          { label: 'Honorários mensais', value: fmt.moeda(mensal, true), icon: 'refresh', foot: cs.length + ' contratos ativos · gerados no dia 1º (FIN-01)' },
          { label: 'Crédito recuperado', value: MC(rec), icon: 'target', progress: { value: rec, max: est, tone: 'green' }, foot: fmt.pct(100 * rec / est, 0) + ' de ' + MC(est) + ' estimados · só compensações transmitidas' },
          { label: 'Êxito a receber', value: fmt.moeda(soma(cs, (c) => c.fin.aReceber), true), icon: 'clock', foot: 'faturado e ainda não pago (bruto)' },
          { label: 'Êxito potencial', value: MC(soma(cs, (c) => c.fin.potencial)), icon: 'trending-up', foot: '(estimado − recuperado) × % de cada contrato' }
        ]) +
        (reaj.length || venceVig.length ? '<div class="lt-mt-4">' + ui.callout({ tone: 'warning', icon: 'calendar-clock', title: [reaj.length ? fmt.plural(reaj.length, 'reajuste anual', 'reajustes anuais') + ' neste mês' : '', venceVig.length ? fmt.plural(venceVig.length, 'vigência termina', 'vigências terminam') + ' até janeiro' : ''].filter(Boolean).join(' · '), text: reaj.map((c) => esc(c.e.fantasia) + ': ' + esc(c.info.indice) + ' em ' + MESES_N[c.info.mesReajuste - 1]).concat(venceVig.map((c) => esc(c.e.fantasia) + ': vigência até ' + fmt.data(c.info.fim))).join(' · ') + '.' }) + '</div>' : '') +
        '<div class="lt-mt-6"></div>' +
        ui.table({ rows: cs, rowSheet: (c) => ({ sheet: 'fin-contrato', params: { id: c.id } }), columns: [
          { label: 'Cliente / contrato', key: 'e', sortable: true, value: (c) => c.e.fantasia, render: (c) => '<span class="lt-table__primary">' + esc(c.e.fantasia) + '</span><span class="lt-table__secondary">' + esc(c.info.numero || '#' + c.id) + ' · desde ' + fmt.dataCurta(c.inicio) + '/' + c.inicio.slice(2, 4) + ' · ' + esc(c.e.regime) + '</span>' },
          { label: 'Mensal', key: 'fee', align: 'right', sortable: true, value: (c) => c.honorarioMensal, render: (c) => M(c.honorarioMensal) + '<span class="lt-table__secondary">dia ' + c.diaVencimento + (c.info.indice ? ' · ' + esc(c.info.indice) : '') + '</span>' },
          { label: 'Êxito', key: 'pct', align: 'right', sortable: true, value: (c) => c.exitoPct, render: (c) => '<span class="lt-num">' + fmt.pct(c.exitoPct) + '</span>' },
          { label: 'Crédito recuperado', key: 'rec', sortable: true, value: (c) => c.fin.rec / c.creditoEstimado, render: (c) => '<div style="min-width:190px"><div class="lt-row lt-row--between lt-row--nowrap lt-small"><span class="lt-num">' + MC(c.fin.rec) + '</span><span class="lt-muted lt-num">de ' + MC(c.creditoEstimado) + '</span></div>' + ui.progress(c.fin.rec, c.creditoEstimado, c.fin.rec ? 'green' : '') + '</div>' },
          { label: 'Êxito faturado', key: 'fat', align: 'right', sortable: true, value: (c) => c.fin.faturado, render: (c) => c.fin.faturado ? M(c.fin.faturado) + '<span class="lt-table__secondary">' + MC(c.fin.recebido) + ' recebidos</span>' : '<span class="lt-muted">' + (F.compensacoesDo(c.id).some((x) => x.situacao === 'prevista') ? 'compensação prevista' : 'aguardando decisão') + '</span>' },
          { label: 'A receber', key: 'ar', align: 'right', sortable: true, value: (c) => c.fin.aReceber, render: (c) => c.fin.aReceber ? M(c.fin.aReceber) : '<span class="lt-muted">—</span>' },
          { label: 'Potencial', key: 'pot', align: 'right', sortable: true, value: (c) => c.fin.potencial, render: (c) => M(c.fin.potencial, 'lt-gold') }
        ], foot: ['<span class="lt-muted">Total</span>', M(mensal), '', '', M(soma(cs, (c) => c.fin.faturado)), M(soma(cs, (c) => c.fin.aReceber)), M(soma(cs, (c) => c.fin.potencial))] });
    }
  });
  /* Gaveta do contrato: títulos (honorário mensal + êxito), compensações e dados do contrato */
  ui.registerSheet('fin-contrato', (p) => {
    const c = db.contrato(p.id); if (!c) return { title: 'Contrato não encontrado' };
    const e = emp(c.empresaId), fin = contratoFin(c), info = cInfo(c.id), comps = F.compensacoesDo(c.id);
    const procs = D.processos.concat((D.juridico && D.juridico.processos) || []).filter((x) => x.negocioId === c.negocioId).sort((a, b) => (b.etapa === 'compensacao') - (a.etapa === 'compensacao'));
    const vencT = util.iso(util.proximoDiaUtil(util.addDias(HOJE, 10)));
    const tit = rowsR().filter((r) => r.c.contratoId === c.id).sort((a, b) => b.venc.localeCompare(a.venc) || a.c.id - b.c.id);
    const vivos = tit.filter((r) => r.sit !== 'fin_cancelado');
    const contratado = soma(vivos, (r) => r.p.valor), recebidoB = soma(vivos.filter((r) => r.sit === 'fin_recebido'), (r) => r.p.valor), pendente = soma(vivos.filter(isAberto), (r) => r.p.valor);
    const parc = F.fornecedor(info.parceiroId);
    const tTit = ui.table({ rows: tit, compact: true, rowHref: (r) => '#fin-conta-receber-' + r.c.id, empty: { icon: 'receipt', title: 'Nenhum título deste contrato' }, columns: [
      { label: 'Título', key: 'tit', value: (r) => r.c.descricao, render: (r) => '<span class="lt-table__primary">' + esc(TIPO_R[r.c.tipo][0]) + (r.c.parcelas.length > 1 ? ' · ' + r.p.n + '/' + r.c.parcelas.length : '') + '</span><span class="lt-table__secondary lt-truncate" style="max-width:220px">#' + r.c.id + ' · ' + esc(r.c.descricao) + '</span>' },
      { label: 'Vencimento', key: 'venc', value: (r) => r.vu, render: vencCellR },
      { label: 'Valor bruto', key: 'valor', align: 'right', value: (r) => r.p.valor, render: (r) => M(r.p.valor) + liqSec(r) },
      { label: 'Situação', key: 'sit', value: (r) => r.sit, render: (r) => ui.status(r.sit) }
    ], rowActions: (r) => isAberto(r) ? ui.btn({ label: 'Registrar', icon: 'check', size: 'xs', variant: 'outline', sheet: 'fin-baixa', attrs: { 'data-t': 'r', 'data-id': r.c.id, 'data-n': r.p.n } }) : '' });
    const tabTitulos = ui.summary([{ label: 'Contratado (títulos)', value: M(contratado) }, { label: 'Recebido', value: M(recebidoB) }, { label: 'Pendente', value: pendente ? M(pendente, vivos.some((r) => r.sit === 'fin_vencido') ? 'lt-danger' : '') : '<span class="lt-muted">—</span>' }, { label: 'Saldo de êxito a faturar', value: M(fin.potencial, 'lt-gold') }]) +
      '<p class="lt-hint lt-mt-2">Títulos de set/2026 em diante (honorário mensal, êxito e reembolsos). Valores brutos da NFS-e; o boleto sai pelo líquido.</p><div class="lt-mt-4">' + tTit + '</div>';
    const tabComp = (comps.length ? '<table class="lt-trail"><thead><tr><th>Competência</th><th>PER/DCOMP · processo</th><th style="text-align:right">Compensado</th><th style="text-align:right">Êxito</th><th>Situação</th></tr></thead><tbody>' + comps.map((x) => { const px = procF(x.processoId), t = x.tituloId ? F.receberConta(x.tituloId) : null, s = x.situacao === 'prevista' ? null : t ? sitR(proxAbertaR(t) || t.parcelas[t.parcelas.length - 1]) : 'fin_recebido'; return '<tr><td>' + esc(F.compLabel(x)) + '</td><td><span class="lt-mono lt-small">' + esc(x.perdcomp || 'a transmitir') + '</span><span class="lt-hint" style="display:block">' + (px ? '<a href="#jur-processo-' + px.id + '" data-fechar-sheet>' + esc(px.numero) + '</a> · ' + esc(etapaJ(px.etapa)) : '—') + '</span></td><td class="lt-num fin-r">' + fmt.moeda(x.valor) + '</td><td class="lt-num fin-r">' + fmt.moeda(x.valor * c.exitoPct / 100) + '</td><td>' + (x.situacao === 'prevista' ? ui.status('fin_comp_prevista') + (x.obs ? '<span class="lt-hint" style="display:block">' + esc(x.obs) + '</span>' : '') : (t ? '<a href="#fin-conta-receber-' + t.id + '" data-fechar-sheet>#' + t.id + '</a> ' : '<span class="lt-hint">histórico </span>') + ui.status(s)) + '</td></tr>'; }).join('') + '</tbody></table>' : ui.empty({ small: true, icon: 'hourglass', title: 'Nenhuma compensação ainda', text: 'O êxito começa a ser faturado quando o crédito for compensado ou habilitado.' })) +
      '<p class="lt-hint lt-mt-2">Recuperado = soma das compensações transmitidas: ' + fmt.moeda(fin.rec) + ' de ' + fmt.moeda(c.creditoEstimado) + ' estimados. Compensações previstas não contam.</p>' +
      (procs.length ? '<div class="lt-hint lt-mt-2">Processos: ' + procs.map((x) => '<a href="#jur-processo-' + x.id + '" data-fechar-sheet>' + esc(x.numero) + '</a> (' + esc(etapaJ(x.etapa)) + ')').join(' · ') + '</div>' : '') +
      '<div class="lt-sections lt-mt-6">' + ui.section({ title: 'Lançar nova compensação', sub: 'Cada PER/DCOMP transmitido gera o título de êxito no contas a receber. Só entra no recuperado com o processo na etapa de compensação.', tone: 'green', icon: 'plus', cols: 2, body:
        ui.field({ label: 'Competência', type: 'month', value: '2026-11' }) + ui.field({ label: 'Nº do PER/DCOMP', placeholder: '00000.00000.000000.0.0.00-0000' }) +
        ui.field({ label: 'Processo que reconheceu o crédito', type: 'select', span: 2, value: procs[0] ? procs[0].id : '', options: procs.map((x) => ({ value: x.id, label: x.numero + ' · ' + etapaJ(x.etapa) })).concat([{ value: '', label: 'Processo administrativo novo (cadastrar no Jurídico)' }]) }) +
        ui.field({ label: 'Tributo compensado', type: 'select', options: ['PIS/Cofins', 'IRPJ/CSLL', 'Contribuição previdenciária', 'IPI'] }) + ui.field({ label: 'Valor compensado', name: 'fc-base', type: 'money', required: true, placeholder: '0,00' }) +
        ui.field({ label: 'Êxito (' + fmt.pct(c.exitoPct) + ')', type: 'static', html: '<span class="lt-num lt-strong" data-fc-exito>R$ 0,00</span>' }) + ui.field({ label: 'Vencimento do título', type: 'date', value: vencT }) +
        '<div class="lt-span-full lt-row" style="justify-content:flex-end">' + ui.btn({ label: 'Gerar título de êxito', icon: 'receipt', variant: 'primary', acao: 'gerar', toast: 'Título de êxito criado', toastText: 'Boleto (líquido de retenções) e NFS-e entram na fila de emissão.', fechar: 'sheet' }) + '</div>' }) + '</div>';
    const tabContrato = ui.dl([['Número', esc(info.numero || '#' + c.id)], ['Vigência', fmt.data(c.inicio) + ' a ' + (info.fim ? fmt.data(info.fim) : 'indeterminado') + ' · renovação automática por 12 meses'], ['Honorário mensal', M(c.honorarioMensal) + ' · vence dia ' + c.diaVencimento],
        ['Reajuste anual', info.indice ? esc(info.indice) + ' em ' + MESES_N[info.mesReajuste - 1] + (info.ultimoReajuste ? ' · último em ' + fmt.data(info.ultimoReajuste) + ' (+' + fmt.num(info.reajustePct, 1) + '%)' : ' · primeiro reajuste em ' + MESES_N[info.mesReajuste - 1] + ' de ' + (+c.inicio.slice(0, 4) + 1)) + (info.reajustePendente ? ' ' + ui.chip('Reajuste deste mês pendente', 'amber', { dot: true }) : '') : 'Sem reajuste'],
        ['Êxito', fmt.pct(c.exitoPct) + ' · ' + esc(BASE_EXITO[info.exitoBase] || BASE_EXITO.compensado) + (info.parcelamentoMax > 1 ? ' · até ' + info.parcelamentoMax + ' parcelas' : ' · à vista')],
        ['Parceiro', parc ? esc(parc.fantasia) + ' · ' + fmt.num(info.comissaoMensal, 0) + '% do honorário mensal por ' + esc(info.comissaoPrazo) + (info.comissaoExito ? ' + ' + info.comissaoExito + '% do êxito' : '') : 'Sem parceiro'],
        ['Negócio de origem', '<a href="#crm-negocio-' + c.negocioId + '" data-fechar-sheet>#' + c.negocioId + '</a>']]) +
      '<div class="lt-row lt-mt-6">' + ui.btn({ label: 'Editar contrato', icon: 'edit', size: 'sm', sheet: 'fin-contrato-form', attrs: { 'data-id': c.id } }) + ui.btn({ label: 'Suspender honorário mensal', icon: 'pause', size: 'sm', dialog: 'fin-suspender-mensal', attrs: { 'data-id': c.id } }) +
        ui.btn({ label: 'Encerrar contrato', icon: 'x-circle', size: 'sm', variant: 'danger-outline', acao: 'excluir', loading: 'Encerrando…', confirm: 'Encerrar o contrato ' + (info.numero || '#' + c.id) + '?', confirmText: 'O honorário mensal deixa de ser gerado a partir de dez/2026. Títulos em aberto continuam a receber e o êxito sobre compensações já transmitidas segue devido. O encerramento fica na auditoria.', confirmLabel: 'Encerrar contrato', toast: 'Contrato encerrado', toastText: 'FIN-01 não gera mais o honorário mensal deste cliente.' }) + '</div>';
    return {
      eyebrow: 'Contrato ' + (info.numero || '#' + c.id), title: e.fantasia, size: 'lg', sub: esc(e.razao) + ' · ' + esc(e.cnpj),
      body: ui.summary([{ label: 'Honorário mensal', value: M(c.honorarioMensal) }, { label: 'Êxito', value: fmt.pct(c.exitoPct) }, { label: 'Estimado', value: MC(c.creditoEstimado) }, { label: 'Recuperado', value: MC(fin.rec) }]) +
        '<div class="lt-mt-2">' + ui.progress(fin.rec, c.creditoEstimado, 'green', true) + '</div><div class="lt-mt-4"></div>' +
        ui.tabs({ id: 'fin-contrato-abas', small: true, tabs: [{ key: 'titulos', label: 'Títulos do contrato', icon: 'receipt', count: tit.length, content: tabTitulos }, { key: 'comp', label: 'Compensações', icon: 'calculator', count: comps.length, content: tabComp }, { key: 'dados', label: 'Contrato', icon: 'file-text', content: tabContrato }] }),
      foot: '<span class="lt-sheet__foot-info">Próxima cobrança: ' + (fin.prox ? fmt.data(fin.prox.vu) + ' · ' + fmt.moeda(LQ(fin.prox)) + ' líquido' : '—') + '</span>' + ui.btn({ label: 'Fechar', attrs: { 'data-fechar-sheet': true } }) + ui.btn({ label: 'Editar contrato', icon: 'edit', sheet: 'fin-contrato-form', attrs: { 'data-id': c.id } }) + (fin.prox ? ui.btn({ label: 'Registrar pagamento', icon: 'check', variant: 'primary', sheet: 'fin-baixa', attrs: { 'data-t': 'r', 'data-id': fin.prox.c.id, 'data-n': fin.prox.p.n } }) : ''),
      mount: (el) => el.addEventListener('input', () => setTimeout(() => { const o = el.querySelector('[data-fc-exito]'), b = el.querySelector('[name="fc-base"]'); if (o && b) o.textContent = fmt.moeda(parseMoney(b.value) * c.exitoPct / 100); }, 0))
    };
  });
  /* Gaveta: novo contrato / editar contrato (cards por seção) */
  ui.registerSheet('fin-contrato-form', (p) => {
    const c = p.id ? db.contrato(p.id) : null, info = c ? cInfo(c.id) : {}, e = c ? emp(c.empresaId) : null;
    const clientes = D.empresas.filter((x) => x.relacao === 'cliente' || D.negocios.some((n) => n.empresaId === x.id && n.desfecho === 'ganho'));
    const parceiros = F.fornecedores.filter((x) => x.categoria === 'comissoes');
    return {
      eyebrow: c ? 'Contrato ' + (info.numero || '#' + c.id) : 'Honorários e êxito', title: c ? 'Editar contrato · ' + e.fantasia : 'Novo contrato de honorários', size: 'lg',
      sub: c ? 'Mudanças de valor valem a partir do próximo honorário mensal gerado pelo FIN-01.' : 'Normalmente nasce do negócio ganho no CRM. Use aqui para contratos assinados fora do funil.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'file-text', cols: 3, body:
          ui.field({ label: 'Cliente', type: 'select', required: true, span: 2, value: c ? c.empresaId : '', placeholder: 'Escolha o cliente', options: clientes.map((x) => ({ value: x.id, label: x.fantasia + ' · ' + x.cnpj })) }) + ui.field({ label: 'Nº do contrato', value: info.numero || 'ATL-2026-019' }) +
          ui.field({ label: 'Início da vigência', type: 'date', required: true, value: c ? c.inicio : HOJE }) + ui.field({ label: 'Término da vigência', type: 'date', value: info.fim || '2028-11-08' }) + ui.field({ label: 'Renovação', type: 'select', value: 'auto', options: [{ value: 'auto', label: 'Automática por 12 meses' }, { value: 'manual', label: 'Manual (avisar 60 dias antes)' }, { value: 'nao', label: 'Sem renovação' }] }) }) +
        ui.section({ title: 'Honorário mensal', tone: 'green', icon: 'dollar', cols: 3, body:
          ui.field({ label: 'Valor mensal (bruto da NFS-e)', type: 'money', required: true, value: c ? c.honorarioMensal : '' }) + ui.field({ label: 'Dia de vencimento', type: 'number', value: c ? c.diaVencimento : 10, suffix: 'do mês' }) + ui.field({ label: 'Forma', type: 'select', value: 'boleto', options: F.formas.filter((x) => x.key === 'boleto' || x.key === 'pix' || x.key === 'transferencia').map((x) => ({ value: x.key, label: x.nome })) }) +
          ui.field({ label: 'Conta de recebimento', type: 'select', value: 2, span: 2, options: F.contas.filter((x) => x.tipo === 'Conta corrente').map((x) => ({ value: x.id, label: x.banco + ' · ' + x.apelido })) }) + ui.field({ type: 'toggle', label: 'ISS retido pelo tomador', checked: c ? F.issRetido(c.empresaId) : false, hint: 'Pelo cadastro do cliente' }) }) +
        ui.section({ title: 'Reajuste anual', tone: 'amber', icon: 'calendar-clock', cols: 3, body:
          ui.field({ label: 'Índice', type: 'select', value: info.indice || 'IPCA', options: ['IPCA', 'IGP-M', 'INPC', 'Sem reajuste'] }) + ui.field({ label: 'Mês de aniversário', type: 'select', value: info.mesReajuste || 11, options: MESES_N.map((m, i) => ({ value: i + 1, label: m.charAt(0).toUpperCase() + m.slice(1) })) }) +
          ui.field({ label: 'Último reajuste', type: 'static', html: info.ultimoReajuste ? fmt.data(info.ultimoReajuste) + ' · +' + fmt.num(info.reajustePct, 1) + '%' : '<span class="lt-muted">ainda não houve</span>' }) +
          ui.field({ type: 'toggle', span: 3, label: 'Aplicar o reajuste automaticamente', checked: true, hint: 'No mês de aniversário o FIN-01 aplica o índice acumulado de 12 meses e avisa o cliente por e-mail.' }) }) +
        ui.section({ title: 'Honorário de êxito', tone: 'violet', icon: 'percent', cols: 3, body:
          ui.field({ label: '% de êxito', type: 'percent', required: true, value: c ? c.exitoPct : 20 }) + ui.field({ label: 'Crédito estimado', type: 'money', value: c ? c.creditoEstimado : '' }) + ui.field({ label: 'Parcelamento máximo', type: 'select', value: info.parcelamentoMax || 4, options: [1, 2, 3, 4, 6].map((n) => ({ value: n, label: n === 1 ? 'À vista' : 'Até ' + n + ' parcelas' })) }) +
          ui.field({ label: 'Base do êxito', type: 'radio', span: 3, name: 'fc-base-exito', value: info.exitoBase || 'compensado', options: Object.keys(BASE_EXITO).map((k) => ({ value: k, label: BASE_EXITO[k] })) }) }) +
        ui.section({ title: 'Parceiro e comissão', tone: 'blue', icon: 'users', cols: 3, body:
          ui.field({ label: 'Parceiro que indicou', type: 'select', value: info.parceiroId || '', placeholder: 'Sem parceiro', options: parceiros.map((x) => ({ value: x.id, label: x.fantasia })) }) + ui.field({ label: 'Comissão sobre o mensal', type: 'percent', value: info.comissaoMensal || 0 }) + ui.field({ label: 'Comissão sobre o êxito', type: 'percent', value: info.comissaoExito || 0 }) +
          ui.field({ label: 'Prazo da comissão', type: 'select', value: info.comissaoPrazo || '12 meses', options: ['12 meses', '24 meses', 'Toda a vigência'] }) + ui.field({ label: 'Quando pagar', type: 'static', span: 2, html: '<span class="lt-small">No dia 10 do mês seguinte, só depois que o cliente pagar (conta a pagar gerada sozinha).</span>' }) }) +
        ui.section({ title: 'Documento', tone: 'slate', icon: 'paperclip', body: ui.field({ type: 'upload', label: 'Contrato assinado', accept: 'PDF · até 25 MB' }) }) + '</div>',
      foot: ui.sheetFoot({ label: c ? 'Salvar contrato' : 'Criar contrato', toast: c ? 'Contrato atualizado' : 'Contrato criado', toastText: c ? 'Alterações registradas na auditoria.' : 'O FIN-01 passa a gerar o honorário mensal a partir do próximo dia 1º.', info: 'Campos com * são obrigatórios' })
    };
  });
  ui.registerDialog('fin-suspender-mensal', (p) => {
    const c = db.contrato(p.id); if (!c) return { title: 'Contrato não encontrado', size: 'sm' };
    return {
      title: 'Suspender honorário mensal', icon: 'pause', iconTone: 'warning', text: esc(emp(c.empresaId).fantasia) + ' · ' + fmt.moeda(c.honorarioMensal) + ' por mês. O êxito continua valendo.',
      body: '<div class="lt-sections">' + ui.section({ title: 'Suspensão', tone: 'amber', icon: 'pause', cols: 2, body:
        ui.field({ label: 'A partir de', type: 'month', value: '2026-12', required: true }) + ui.field({ label: 'Até', type: 'month', value: '2027-02', hint: 'Deixe vazio se for por prazo indeterminado' }) +
        ui.field({ label: 'Motivo', type: 'select', span: 2, required: true, options: ['Acordo comercial (carência)', 'Processo suspenso ou sobrestado', 'Cliente em recuperação judicial', 'Outro'] }) +
        ui.field({ type: 'textarea', label: 'Observação', span: 2, rows: 2, placeholder: 'Fica na auditoria e na ficha do contrato' }) }) + '</div>',
      foot: ui.btn({ label: 'Voltar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Suspender honorário mensal', icon: 'pause', variant: 'primary', acao: 'salvar', loading: 'Suspendendo…', toast: 'Honorário mensal suspenso', toastText: 'O FIN-01 não gera o título nos meses escolhidos. Registrado na auditoria.', fechar: 'dialog' })
    };
  });

  /* ================================================================== */
  /* COBRANÇAS E BOLETOS (integração de cobrança genérica)               */
  /* ================================================================== */
  /* boletos de outubro e novembro (e vencidos anteriores) */
  const cobAll = () => rowsR().filter((r) => r.bol && r.venc <= '2026-11-30' && (r.venc >= '2026-10-01' || r.sit === 'fin_vencido')).sort((a, b) => { const pa = a.bol === 'fin_b_pago', pb = b.bol === 'fin_b_pago'; if (pa !== pb) return pa ? 1 : -1; return pa ? b.p.recebidoEm.localeCompare(a.p.recebidoEm) : a.vu.localeCompare(b.vu); });
  const cobTable = (rows) => ui.table({ rows, pageSize: 10, rowHref: (r) => '#fin-conta-receber-' + r.c.id, empty: { icon: 'receipt', title: 'Nenhum boleto neste filtro' }, columns: [
        { label: 'Cliente / título', key: 'cli', value: (r) => r.e.fantasia, render: (r) => '<span class="lt-table__primary">' + esc(r.e.fantasia) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:260px">' + esc(r.c.descricao) + (r.c.parcelas.length > 1 ? ' · ' + r.p.n + '/' + r.c.parcelas.length : '') + '</span>' },
        { label: 'Nosso número', key: 'nn', value: (r) => r.p.boleto ? nossoNumero(r.c, r.p) : '', render: (r) => r.p.boleto ? '<span class="lt-mono" style="font-size:12px">' + nossoNumero(r.c, r.p) + '</span>' : '<span class="lt-muted">—</span>' },
        { label: 'Vencimento', key: 'venc', value: (r) => r.vu, render: vencCellR },
        { label: 'Valor líquido', key: 'valor', align: 'right', value: (r) => LQ(r), render: (r) => M(LQ(r)) + (RT(r).total ? '<span class="lt-table__secondary" style="white-space:nowrap">NFS-e ' + fmt.moeda(r.p.valor) + '</span>' : '') },
        { label: 'Boleto', key: 'bol', value: (r) => r.bol, render: (r) => ui.status(r.bol) },
        { label: 'Último evento', key: 'ev', value: (r) => (r.p.boleto && (r.p.boleto.enviadoEm || r.p.boleto.geradoEm)) || r.p.recebidoEm || '', render: (r) => { const b = r.p.boleto; if (r.bol === 'fin_b_pago') return '<span class="lt-small">Pago em ' + fmt.dataCurta(r.p.recebidoEm) + '</span>'; if (!b) return '<span class="lt-small lt-muted">Aguardando emissão</span>'; if (b.enviadoEm) return '<span class="lt-small">Enviado em ' + fmt.dataCurta(b.enviadoEm) + '</span>' + (r.sit === 'fin_vencido' ? '<span class="lt-table__secondary lt-danger">sem pagamento</span>' : ''); return '<span class="lt-small">Registrado em ' + fmt.dataCurta(b.geradoEm) + '</span>' + (b.motivo ? '<span class="lt-table__secondary">' + esc(b.motivo) + '</span>' : '<span class="lt-table__secondary">não enviado</span>'); } }
      ], rowActions: (r) => r.bol === 'fin_b_nao' ? ui.btn({ label: 'Gerar', icon: 'receipt', size: 'xs', variant: 'outline', dialog: 'fin-gerar-boletos', attrs: { 'data-keys': r.key } }) : r.bol === 'fin_b_pago' ? ui.btn({ icon: 'download', variant: 'ghost', size: 'xs', tip: 'Comprovante', acao: 'exportar', toast: 'Comprovante baixado' }) :
        '<button type="button" class="lt-btn lt-btn--ghost lt-btn--xs lt-btn--icon" title="Copiar linha digitável" aria-label="Copiar linha digitável" data-copy="' + esc(linhaDig(r.c, r.p).replace(/[ .]/g, '')) + '" data-copy-label="Linha digitável copiada">' + I('copy') + '</button>' +
        ui.btn({ icon: 'refresh', variant: 'ghost', size: 'xs', tip: '2ª via', dialog: 'fin-segunda-via', attrs: { 'data-id': r.c.id, 'data-n': r.p.n } }) + ui.btn({ icon: 'send', variant: 'ghost', size: 'xs', tip: r.sit === 'fin_vencido' ? 'Enviar cobrança' : 'Reenviar e-mail', sheet: 'fin-enviar-boleto', attrs: { 'data-id': r.c.id, 'data-n': r.p.n, 'data-modo': r.sit === 'fin_vencido' ? 'cobranca' : 'envio' } }) });
  App.screen({
    id: 'fin.billing', hash: 'fin-cobrancas', module: 'financeiro', title: 'Cobranças e boletos', nav: true, navGroup: 'financeiro', navOrder: 8,
    render: () => {
      const S = App.state.finCob || (App.state.finCob = { chip: 'todos' });
      const all = cobAll();
      const cnt = (k) => all.filter((r) => r.bol === k);
      const vSoma = (l) => soma(l, LQ);
      const pagosNov = all.filter((r) => r.bol === 'fin_b_pago' && r.p.recebidoEm >= '2026-11-01');
      const filtro = (chip) => chip === 'todos' ? all : all.filter((r) => r.bol === chip);
      const evs = []; let dia = '';
      F.cobrancaEventos.forEach((x) => { const d = x.quando.slice(0, 10) === HOJE ? 'Hoje' : fmt.dataExtenso(x.quando).replace(/^[^,]+, /, ''); if (d !== dia) { evs.push({ day: d }); dia = d; } evs.push({ icon: x.icon, tone: x.tone, title: esc(x.tipo) + ' <span class="lt-muted" style="font-weight:400">· ' + fmt.hora(x.quando) + '</span>', text: esc(x.texto) + (x.ref ? ' <a href="#fin-conta-receber-' + x.ref + '">Ver título</a>' : '') }); });
      const config = '<div class="lt-sections">' +
        ui.section({ title: 'Conexão', tone: 'gold', icon: 'link', cols: 3, aside: ui.chip(ENC.status, 'green', { dot: true }), body: ui.field({ label: 'Integração', type: 'static', value: ENC.provedor + ' · ' + ENC.parceiro }) + ui.field({ label: 'Ambiente', type: 'select', value: 'prod', options: [{ value: 'prod', label: 'Produção' }, { value: 'homolog', label: 'Homologação (testes)' }] }) + ui.field({ label: 'Última sincronização', type: 'static', value: fmt.dataHora(ENC.ultimaSinc) }) + ui.field({ label: 'Conta de cobrança', type: 'select', value: ENC.contaId, options: F.contas.filter((c) => c.tipo === 'Conta corrente').map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido })) }) + ui.field({ label: 'Carteira', value: ENC.carteira }) + ui.field({ label: 'Credenciais', type: 'static', html: '<span class="lt-muted">Guardadas no cofre do servidor · </span><button type="button" class="lt-link-btn" data-acao="verificar" data-toast="Conexão verificada" data-toast-text="A integração respondeu em 320 ms.">Testar conexão</button>' }) }) +
        ui.section({ title: 'Encargos e prazos', tone: 'amber', icon: 'percent', cols: 4, body: ui.field({ label: 'Multa após o vencimento', type: 'percent', value: ENC.multa }) + ui.field({ label: 'Juros ao mês', type: 'percent', value: ENC.juros }) + ui.field({ label: 'Desconto até o vencimento', type: 'percent', value: ENC.desconto }) + ui.field({ label: 'Baixa automática após', type: 'number', value: ENC.baixaDias, suffix: 'dias' }) }) +
        ui.section({ title: 'Envio e lembretes', tone: 'blue', icon: 'send', cols: 2, body: ui.field({ type: 'toggle', label: 'Enviar boleto e NFS-e por e-mail ao gerar', checked: ENC.envioAuto }) + ui.field({ type: 'toggle', label: 'Lembrete no dia do vencimento', checked: ENC.lembrete }) + ui.field({ label: 'Lembrete antes do vencimento', type: 'number', value: ENC.diasAntes, suffix: 'dias antes' }) + ui.field({ type: 'toggle', label: 'Incluir PIX (QR Code) no boleto', checked: ENC.pix }) + '<div class="lt-span-full">' + ui.callout({ tone: 'info', icon: 'workflow', title: 'Cobrança após o vencimento é uma automação', text: 'A regra FIN-02 cria a tarefa "Cobrar honorário" quando o título está vencido há 3 dias. Ajuste em <a href="#fluxos">Fluxos e automações</a>.' }) + '</div>' }) +
        '<div class="lt-form-actions lt-form-actions--inline"><span class="lt-form-actions__info">Alterações valem para os próximos boletos.</span>' + ui.btn({ label: 'Salvar configuração', icon: 'check', variant: 'primary', acao: 'salvar', toast: 'Configuração salva' }) + '</div></div>';
      return ui.pageHeader({ breadcrumb: crumb('Cobranças e boletos'), title: 'Cobranças e boletos', sub: 'Boletos registrados na integração de cobrança pelo valor líquido de retenções, com envio por e-mail, 2ª via e baixa automática quando o pagamento é confirmado.',
          meta: ui.chip('Integração conectada', 'green', { dot: true }) + '<span class="lt-small lt-muted">' + esc(ENC.parceiro) + ' · Itaú · conta de cobrança · sincronizado hoje às ' + fmt.hora(ENC.ultimaSinc) + '</span>',
          actions: ui.btn({ label: 'Sincronizar agora', icon: 'refresh', acao: 'sincronizar', loading: 'Sincronizando…', toast: 'Sincronizado', toastText: 'Nenhum pagamento novo desde 09:15.' }) + ui.btn({ label: 'Gerar boletos pendentes (' + cnt('fin_b_nao').length + ')', icon: 'receipt', variant: 'primary', dialog: 'fin-gerar-boletos' }) }) +
        ui.kpis([
          { label: 'Sem boleto', value: String(cnt('fin_b_nao').length), unit: 'títulos', icon: 'inbox', foot: MC(vSoma(cnt('fin_b_nao'))) + ' · tarefa vence hoje 17:00' },
          { label: 'Gerados e enviados', value: String(cnt('fin_b_gerado').length + cnt('fin_b_enviado').length), unit: 'boletos', icon: 'send', foot: MC(vSoma(cnt('fin_b_gerado').concat(cnt('fin_b_enviado')))) + ' · ' + cnt('fin_b_gerado').length + ' ainda não enviados' },
          { label: 'Pagos em novembro', value: String(pagosNov.length), unit: 'boletos', icon: 'check-circle', foot: MC(soma(pagosNov, valorPago)) + ' com baixa automática' },
          { label: 'Vencidos', value: String(cnt('fin_b_vencido').length), unit: 'boletos', icon: 'alert-triangle', foot: MC(vSoma(cnt('fin_b_vencido'))) + ' · cobrança em andamento' }
        ]) + '<div class="lt-mt-6"></div>' +
        ui.card({ body: ui.tabs({ id: 'fin-cobrancas', tabs: [
          { key: 'boletos', label: 'Boletos', icon: 'receipt', count: all.length, content: ui.filters({ chipGroup: 'single', chips: [['todos', 'Todos'], ['fin_b_nao', 'Sem boleto', 'gray'], ['fin_b_gerado', 'Gerados', 'violet'], ['fin_b_enviado', 'Enviados', 'blue'], ['fin_b_pago', 'Pagos', 'green'], ['fin_b_vencido', 'Vencidos', 'red']].map((x) => ({ value: x[0], label: x[1], tone: x[2], count: x[0] === 'todos' ? all.length : cnt(x[0]).length, active: S.chip === x[0] })) }) + '<div data-fin-lista>' + cobTable(filtro(S.chip)) + '</div>' },
          { key: 'eventos', label: 'Eventos da integração', icon: 'history', count: F.cobrancaEventos.length, content: ui.timeline(evs) },
          { key: 'config', label: 'Configuração', icon: 'settings', content: config }
        ] }) });
    },
    mount: (root) => {
      const S = App.state.finCob;
      on(root, 'lt:filter', (e) => {
        if (!e.target.closest('[data-panel="boletos"]')) return;
        S.chip = e.detail.active ? e.detail.value : 'todos';
        const all = cobAll(), box = root.querySelector('[data-fin-lista]');
        box.innerHTML = cobTable(S.chip === 'todos' ? all : all.filter((r) => r.bol === S.chip)); ui.enhance(box);
      });
    }
  });

  /* ================================================================== */
  /* NOTAS EMITIDAS (NFS-e de honorários)                                 */
  /* ================================================================== */
  App.screen({
    id: 'fin.invoice.issued', hash: 'fin-notas-emitidas', module: 'financeiro', title: 'Notas fiscais emitidas', nav: true, navGroup: 'financeiro', navLabel: 'Notas emitidas (NFS-e)', navOrder: 9,
    render: () => {
      const S = App.state.finNf || (App.state.finNf = { per: '2026-11', chip: 'todos' });
      const base = nfseLista().filter((x) => !S.per || x.r.venc.slice(0, 7) === S.per);
      const rows = base.filter((x) => S.chip === 'todos' || x.status === S.chip).sort((a, b) => (b.numero || 9999) - (a.numero || 9999));
      const aut = base.filter((x) => x.status === 'fin_nf_autorizada'), pend = base.filter((x) => x.status === 'fin_nf_pendente');
      const issRet = soma(aut.filter((x) => x.rt.issRetido), (x) => x.iss), issProp = soma(aut.filter((x) => !x.rt.issRetido), (x) => x.iss);
      return ui.pageHeader({ breadcrumb: crumb('Notas emitidas'), title: 'Notas fiscais emitidas', sub: 'NFS-e de honorários, com as retenções na fonte destacadas (IRRF 1,5% e CSRF 4,65%; ISS 3% retido quando o tomador é responsável). A nota sai junto com o boleto, que vai pelo líquido.',
          meta: ui.chip('Emissor de NFS-e conectado', 'green', { dot: true }) + '<span class="lt-small lt-muted">Padrão nacional · série única · ambiente de produção</span>',
          actions: ui.btn({ label: 'Emitir pendentes (' + pend.length + ')', icon: 'file-text', variant: 'primary', acao: 'emitir', loading: 'Emitindo…', toast: fmt.plural(pend.length, 'NFS-e emitida', 'NFS-e emitidas'), toastText: 'Autorizadas pela prefeitura. PDFs anexados aos títulos.', disabled: !pend.length }) }) +
        ui.kpis([
          { label: 'Valor faturado (bruto)', value: fmt.moeda(soma(aut, (x) => x.valor), true), icon: 'receipt', foot: (S.per ? mesC(S.per) : 'todos os períodos') + ' · ' + fmt.plural(aut.length, 'nota autorizada', 'notas autorizadas') },
          { label: 'Retenções federais', value: fmt.moeda(soma(aut, (x) => x.rt.federais), true), icon: 'shield', foot: 'IRRF ' + MC(soma(aut, (x) => x.rt.irrf)) + ' · CSRF ' + MC(soma(aut, (x) => x.rt.csrf)) + ' · a compensar' },
          { label: 'ISS do período', value: fmt.moeda(issRet + issProp), icon: 'percent', foot: MC(issProp) + ' na guia municipal · ' + MC(issRet) + ' retidos' },
          { label: 'A emitir', value: String(pend.length), unit: 'notas', icon: 'clock', foot: MC(soma(pend, (x) => x.valor)) + ' · saem junto com os boletos' }
        ]) + '<div class="lt-mt-6"></div>' +
        ui.filters({ busca: 'Buscar tomador ou número', selects: [{ label: 'Período', name: 'f-per', options: PERIODOS.slice(1, 3), value: S.per }], chipGroup: 'single', chips: [{ label: 'Todas', value: 'todos', active: S.chip === 'todos' }, { label: 'Autorizadas', value: 'fin_nf_autorizada', tone: 'green', active: S.chip === 'fin_nf_autorizada' }, { label: 'A emitir', value: 'fin_nf_pendente', tone: 'amber', active: S.chip === 'fin_nf_pendente' }, { label: 'Canceladas', value: 'fin_nf_cancelada', tone: 'gray', active: S.chip === 'fin_nf_cancelada' }] }) +
        ui.table({ rows, rowHref: (x) => '#fin-conta-receber-' + x.r.c.id, empty: { icon: 'file-text', title: 'Nenhuma nota neste filtro', text: 'Troque o período ou a situação.' }, columns: [
          { label: 'Nº NFS-e', key: 'numero', sortable: true, value: (x) => x.numero || 0, render: (x) => x.numero ? '<span class="lt-num lt-strong">' + x.numero + '</span>' : '<span class="lt-muted">—</span>' },
          { label: 'Tomador', key: 't', sortable: true, value: (x) => x.r.e.fantasia, render: (x) => '<span class="lt-table__primary" title="' + esc(x.r.e.razao) + '">' + esc(x.r.e.fantasia) + '</span><span class="lt-table__secondary" style="white-space:nowrap">' + esc(x.r.e.cnpj) + '</span>' },
          { label: 'Serviço', key: 's', value: (x) => x.r.c.descricao, render: (x) => '<span class="lt-small lt-truncate" style="display:block;max-width:150px" title="' + esc(x.r.c.descricao) + '">' + esc(x.r.c.descricao) + '</span>' + (x.obs ? '<span class="lt-table__secondary lt-truncate" style="max-width:150px" title="' + esc(x.obs) + '">' + esc(x.obs) + '</span>' : '<span class="lt-table__secondary">' + (x.emissao ? 'emitida em ' + fmt.dataCurta(x.emissao) : 'a emitir') + '</span>') },
          { label: 'Valor bruto', key: 'valor', align: 'right', sortable: true, value: (x) => x.valor, render: (x) => M(x.valor) },
          { label: 'Retenções', key: 'ret', align: 'right', value: (x) => x.rt.total, render: (x) => '<span title="' + esc('IRRF ' + fmt.moeda(x.rt.irrf) + ' · CSLL ' + fmt.moeda(x.rt.csll) + ' · PIS ' + fmt.moeda(x.rt.pis) + ' · Cofins ' + fmt.moeda(x.rt.cofins) + (x.rt.iss ? ' · ISS ' + fmt.moeda(x.rt.iss) : '')) + '">' + M(x.rt.total) + '<span class="lt-table__secondary" style="white-space:nowrap">IRRF + CSRF' + (x.rt.iss ? ' + ISS' : '') + '</span></span>' },
          { label: 'ISS 3%', key: 'iss', align: 'right', value: (x) => x.iss, render: (x) => M(x.iss) + '<span class="lt-table__secondary" style="white-space:nowrap">' + (x.rt.issRetido ? 'retido' : 'a recolher') + '</span>' },
          { label: 'Líquido', key: 'liq', align: 'right', sortable: true, value: (x) => x.rt.liquido, render: (x) => '<b class="lt-num fin-nw">' + fmt.moeda(x.rt.liquido) + '</b>' },
          { label: 'Situação', key: 'st', value: (x) => x.status, render: (x) => ui.status(x.status) }
        ], rowActions: (x) => x.status === 'fin_nf_pendente' ? ui.btn({ tip: 'Emitir NFS-e', size: 'xs', variant: 'ghost', icon: 'send', acao: 'emitir', loading: 'Emitindo…', toast: 'NFS-e emitida', toastText: 'Autorizada pela prefeitura.' }) : ui.btn({ icon: 'download', variant: 'ghost', size: 'xs', tip: 'PDF', acao: 'exportar', toast: 'PDF baixado', toastText: 'nfse-' + x.numero + '.pdf' }) + ui.btn({ icon: 'file', variant: 'ghost', size: 'xs', tip: 'XML', acao: 'exportar', toast: 'XML baixado', toastText: 'nfse-' + x.numero + '.xml' }) + (x.status === 'fin_nf_autorizada' ? ui.btn({ icon: 'x', variant: 'ghost', size: 'xs', tip: 'Cancelar NFS-e', acao: 'excluir', confirm: 'Cancelar a NFS-e ' + x.numero + '?', confirmText: 'O cancelamento é enviado à prefeitura e não pode ser desfeito. Depois, emita uma nota substituta.', confirmLabel: 'Cancelar NFS-e', toast: 'Pedido de cancelamento enviado' }) : '') });
    },
    mount: (root) => {
      const S = App.state.finNf;
      on(root, 'lt:filter', (e) => { S.chip = e.detail.active ? e.detail.value : 'todos'; App.refresh(); });
      on(root, 'change', (e) => { if (e.target.name === 'f-per') { S.per = e.target.value; App.refresh(); } });
      let t; on(root, 'input', (e) => { if (e.target.matches('[data-filter-search]')) { clearTimeout(t); const q = norm(e.target.value); t = setTimeout(() => root.querySelectorAll('[data-lt-table] tbody tr').forEach((tr) => { tr.hidden = q && norm(tr.textContent).indexOf(q) < 0; }), 150); } });
    }
  });

  /* ================================================================== */
  /* NOTAS DE FORNECEDOR: importar XML com sugestão de categoria          */
  /* ================================================================== */
  const CONF = { alta: ['Alta', 'green'], media: ['Média', 'amber'], baixa: ['Baixa', 'red'] };
  /* select de subcategoria agrupado por categoria: o texto escolhido é só a subcategoria (cabe sem cortar); a categoria aparece abaixo */
  function selPlano(item, disabled) {
    return '<select class="lt-select fin-sel" style="min-width:0;width:236px" data-fin-item' + (disabled ? ' disabled' : '') + ' aria-label="Categoria do item">' + F.categorias.filter((c) => c.natureza === 'direto' || c.natureza === 'adm').map((c) => '<optgroup label="' + esc(c.nome) + '">' + c.subs.map((s) => '<option value="' + c.key + '|' + esc(s[0]) + '"' + (c.key === item.cat && s[0] === item.sub ? ' selected' : '') + '>' + esc(s[0]) + '</option>').join('') + '</optgroup>').join('') + '</select>';
  }
  function notaDetalhe(n) {
    const f = forn(n.fornecedorId), vinc = n.status === 'vinculada', pendentes = n.itens.filter((i) => !i.aceito).length;
    const itens = '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact"><thead><tr><th class="lt-table__check"><label class="lt-check"><input type="checkbox" data-fin-itens-todos' + (vinc ? ' disabled' : '') + ' aria-label="Selecionar todos"></label></th><th>Item</th><th class="lt-num">Valor</th><th>Categoria sugerida e confiança</th><th>Tipo DRE</th></tr></thead><tbody>' +
      n.itens.map((it, i) => { const pl = F.plano(it.cat, it.sub); return '<tr data-fin-linha="' + i + '"><td class="lt-table__check"><label class="lt-check"><input type="checkbox" data-fin-item-check' + (it.aceito ? ' disabled checked' : '') + ' aria-label="Selecionar item"></label></td><td style="min-width:200px"><span class="lt-table__primary" style="white-space:normal">' + esc(it.desc) + '</span><span class="lt-table__secondary">Qtd ' + it.qtd + ' · NCM ' + esc(it.ncm) + '</span></td><td class="lt-num fin-r">' + fmt.moeda(it.valor) + '</td><td><div class="lt-row lt-row--nowrap" style="gap:8px">' + ui.chip(CONF[it.conf][0], CONF[it.conf][1], { dot: true, title: 'Confiança da sugestão' }) + selPlano(it, vinc || it.aceito) + '</div><span class="lt-table__secondary" style="white-space:normal;margin-top:4px" data-fin-item-motivo>' + (it.aceito ? '<span class="lt-success">' + I('check') + ' aceita</span> · ' : '') + '<span data-fin-item-cat>' + esc((F.cat(it.cat) || {}).nome || '') + '</span> · ' + esc(it.motivo) + '</span></td><td data-fin-item-dre>' + dreChip(pl && pl.tipoDre) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><td></td><td>Total da nota</td><td class="lt-num fin-r">' + fmt.moeda(n.valor) + '</td><td colspan="2"></td></tr></tfoot></table></div></div>';
    const dup = '<table class="lt-trail"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Pagável em</th><th style="text-align:right">Valor</th></tr></thead><tbody>' + n.duplicatas.map((d) => '<tr><td class="lt-num">' + d.n + '/' + n.duplicatas.length + '</td><td class="lt-num">' + fmt.data(d.venc) + '</td><td>' + (d.pago ? ui.chip('Pago no cartão', 'green') : vu(d.venc) !== d.venc ? ui.chip(fmt.dataCurta(vu(d.venc)), 'amber') : '<span class="lt-muted">—</span>') + '</td><td class="lt-num fin-r">' + fmt.moeda(d.valor) + '</td></tr>').join('') + '</tbody></table>';
    return ui.card({ title: n.modelo + ' ' + n.numero + ' · ' + (f ? f.fantasia : ''), icon: 'file-text', sub: '<span class="lt-mono">' + esc(n.chave) + '</span>', actions: ui.status('fin_' + n.status),
      body: ui.summary([{ label: 'Fornecedor', value: '<span class="lt-small" style="display:block">' + esc(f ? f.razao : '—') + '</span><span class="lt-hint lt-num">' + esc(f ? f.cnpj : '—') + '</span>' }, { label: 'Emissão', value: fmt.data(n.emissao) }, { label: 'Valor', value: M(n.valor) }, { label: 'Parcelas', value: String(n.duplicatas.length) }]) +
        '<div class="lt-mt-4">' + (vinc ? ui.callout({ tone: 'success', title: 'Nota vinculada à conta a pagar #' + n.contaPagarId, text: 'Categorias aceitas e parcelas lançadas.', actions: '<a class="lt-btn lt-btn--sm lt-btn--outline" href="#fin-conta-pagar-' + n.contaPagarId + '">Abrir conta a pagar</a>' }) : ui.callout({ tone: 'gold', icon: 'zap', title: 'Sugestão automática de categoria', text: 'Cada item foi classificado pelo NCM, por palavras-chave e pelo histórico do fornecedor. Confira os itens de confiança média ou baixa, troque a categoria se precisar e aceite.' })) + '</div>' +
        '<div class="lt-row lt-mt-4 lt-mb-4"><span class="lt-label-caps">Itens da nota</span><span class="lt-push"></span>' + (vinc ? '' : ui.btn({ label: 'Sugerir de novo', icon: 'refresh', size: 'sm', variant: 'ghost', acao: 'recalcular', loading: 'Analisando itens…', toast: 'Sugestões atualizadas', toastText: 'Nenhuma mudança: as regras e o histórico continuam os mesmos.' }) + ui.btn({ label: 'Aceitar selecionadas', icon: 'check', size: 'sm', variant: 'outline', acao: 'aprovar', toast: 'Sugestões aceitas', toastText: 'Itens marcados ficam com a categoria escolhida.', attrs: { 'data-fin-aceitar': true } })) + '</div>' + itens +
        '<div class="lt-sections lt-mt-6">' + ui.section({ title: 'Conta a pagar', sub: 'Duplicatas da nota viram as parcelas.', tone: 'green', icon: 'wallet', cols: 3, body: '<div class="lt-span-full">' + dup + '</div>' + ui.field({ label: 'Conta de pagamento', type: 'select', value: 1, options: F.contas.map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido })), disabled: vinc }) + ui.field({ label: 'Forma', type: 'select', value: n.modelo === 'NFC-e' ? 'cartao' : 'boleto', options: F.formas.map((x) => ({ value: x.key, label: x.nome })), disabled: vinc }) + ui.field({ label: 'Centro de custo', type: 'select', value: 'Administrativo', options: F.centros, disabled: vinc }) }) + '</div>',
      foot: vinc ? '<span class="lt-hint" style="margin-right:auto">Importada em ' + fmt.dataHora(n.importadaEm) + ' por ' + esc((db.pessoa(n.por) || {}).nome) + '</span>' : '<span class="lt-hint" style="margin-right:auto">' + (pendentes ? fmt.plural(pendentes, 'item', 'itens') + ' aguardando aceite' : 'Todos os itens aceitos') + '</span>' + ui.btn({ label: 'Descartar nota', variant: 'ghost', acao: 'excluir', confirm: 'Descartar a ' + n.modelo + ' ' + n.numero + '?', confirmText: 'O XML sai da fila. Você pode importar de novo depois.', confirmLabel: 'Descartar', toast: 'Nota descartada' }) + ui.btn({ label: n.modelo === 'NFC-e' ? 'Gerar conta já paga' : 'Gerar conta a pagar', icon: 'check', variant: 'primary', acao: 'gerar', toast: 'Conta a pagar criada', toastText: 'Conta #13209 com ' + fmt.plural(n.duplicatas.length, 'parcela') + '. A nota ficou vinculada.' }) });
  }
  App.screen({
    id: 'fin.invoice_import', hash: 'fin-importar-nota', module: 'financeiro', title: 'Notas de fornecedor', nav: true, navGroup: 'financeiro', navOrder: 10,
    render: (params) => {
      const sel = F.nota(params.id) || F.nota(App.state.finNota) || F.notasEntrada.find((n) => n.status === 'sugestao') || F.notasEntrada[0];
      const aguard = F.notasEntrada.filter((n) => n.status === 'sugestao');
      const lista = ui.list(F.notasEntrada.slice().sort((a, b) => b.importadaEm.localeCompare(a.importadaEm)).map((n) => { const f = forn(n.fornecedorId); return { icon: 'file-text', tone: n.status === 'vinculada' ? 'green' : 'violet', title: esc(n.modelo + ' ' + n.numero + ' · ' + (f ? f.fantasia : '')), meta: fmt.moeda(n.valor) + ' · ' + fmt.plural(n.itens.length, 'item', 'itens') + ' ' + ui.status('fin_' + n.status), href: '#fin-importar-nota-' + n.id, attrs: n.id === sel.id ? { 'aria-current': 'true', style: 'background:var(--gold-subtle)' } : null }; }));
      return ui.pageHeader({ breadcrumb: crumb('Notas de fornecedor'), title: 'Notas de fornecedor', sub: 'Importe o XML da NF-e, NFC-e ou NFS-e. O sistema lê os itens, sugere a categoria de cada um e gera a conta a pagar com as duplicatas.',
          actions: ui.btn({ label: 'Contas a pagar', icon: 'wallet', href: '#fin-pagar' }) }) +
        '<div class="lt-split lt-split--left"><div class="lt-stack">' +
        ui.card({ title: 'Importar XML', icon: 'upload', body: ui.field({ type: 'upload', multiple: true, accept: 'XML de NF-e, NFC-e ou NFS-e · até 5 MB cada' }) + '<p class="lt-hint lt-mt-2">Também chegam sozinhas pelo e-mail <b>notas@atlas.exemplo</b>.</p><div data-fin-upload-status></div>' }) +
        ui.card({ title: 'Notas importadas', icon: 'inbox', sub: fmt.plural(aguard.length, 'nota aguardando aceite', 'notas aguardando aceite'), flush: true, body: lista }) +
        '</div><div style="min-width:0" data-fin-nota>' + notaDetalhe(sel) + '</div></div>';
    },
    mount: (root, params) => {
      const sel = F.nota(params.id); if (sel) App.state.finNota = sel.id;
      on(root, 'change', (e) => {
        const s = e.target.closest('[data-fin-item]');
        if (s) { const p = s.value.split('|'), pl = F.plano(p[0], p[1]), cb = s.closest('tr').querySelector('[data-fin-item-cat]'); if (cb) cb.textContent = (F.cat(p[0]) || {}).nome || ''; s.closest('tr').querySelector('[data-fin-item-dre]').innerHTML = dreChip(pl && pl.tipoDre); const ck = s.closest('tr').querySelector('[data-fin-item-check]'); if (ck && !ck.disabled) ck.checked = true; return; }
        if (e.target.matches('[data-fin-itens-todos]')) { root.querySelectorAll('[data-fin-item-check]:not(:disabled)').forEach((c) => { c.checked = e.target.checked; }); return; }
        if (e.target.matches('[data-upload] input[type=file]') && e.target.files && e.target.files.length) {
          const f = e.target.files[0], box = root.querySelector('[data-fin-upload-status]'), det = root.querySelector('[data-fin-nota]');
          if (!/\.xml$/i.test(f.name)) { box.innerHTML = '<div class="lt-mt-2">' + ui.callout({ tone: 'danger', title: 'Arquivo não é um XML de nota fiscal', text: esc(f.name) + ' foi recusado. Envie o arquivo .xml que o fornecedor mandou junto com o PDF.' }) + '</div>'; return; }
          box.innerHTML = '';
          const antes = det.innerHTML;
          det.innerHTML = ui.card({ title: 'Lendo ' + esc(f.name) + '…', icon: 'file-text', body: ui.skeleton({ lines: 6 }) });
          setTimeout(() => { det.innerHTML = antes; ui.toast('XML lido', 'success', esc(f.name) + ': itens classificados e prontos para aceite.'); }, 1400);
        }
      });
      on(root, 'lt:acao', (e) => {
        if (e.detail.acao !== 'aprovar' || !e.target.closest('[data-fin-aceitar]')) return;
        root.querySelectorAll('[data-fin-item-check]:checked:not(:disabled)').forEach((c) => { const tr = c.closest('tr'); c.disabled = true; tr.querySelector('[data-fin-item]').disabled = true; tr.querySelector('[data-fin-item-motivo]').insertAdjacentHTML('afterbegin', '<span class="lt-success">' + I('check') + ' aceita</span> · '); });
      });
    }
  });

  /* ================================================================== */
  /* CONTAS BANCÁRIAS e conciliação                                       */
  /* ================================================================== */
  App.screen({
    id: 'fin.bank_accounts', hash: 'fin-contas-bancarias', module: 'financeiro', title: 'Contas bancárias', nav: true, navGroup: 'financeiro', navOrder: 11,
    render: () => {
      const tot = soma(F.contas, (c) => c.saldo), cc = soma(F.contas.filter((c) => c.tipo === 'Conta corrente'), (c) => c.saldo), apl = soma(F.contas.filter((c) => c.tipo === 'Aplicação'), (c) => c.saldo), nc = F.extrato.length;
      const cards = F.contas.map((c) => ui.card({ cls: 'lt-card--hover', body:
        '<div class="lt-row lt-row--nowrap" style="gap:10px;min-width:0">' + bankTile(c.id) + '<span style="min-width:0"><span class="lt-strong lt-truncate" style="display:block">' + esc(c.apelido) + '</span><span class="lt-hint lt-truncate" style="display:block">' + esc(c.banco) + '</span></span></div>' +
        '<div class="lt-row lt-row--between lt-row--nowrap lt-mt-4"><span class="lt-kpi__value" style="font-size:24px">' + fmt.moeda(c.saldo) + '</span>' + ui.chart.spark(c.hist, { width: 56, height: 24, color: 'var(--chart-' + (c.tipo === 'Aplicação' ? 4 : 1) + ')' }) + '</div>' +
        '<div class="lt-mono lt-muted lt-mt-2 lt-truncate">' + (c.codigo !== '—' ? 'Ag. ' + esc(c.agencia) + ' · CC ' + esc(c.conta) : 'Dinheiro em espécie') + '</div>' +
        '<div class="lt-chips lt-mt-2">' + ui.chip(c.tipo, c.tipo === 'Aplicação' ? 'green' : c.tipo === 'Caixa' ? 'gray' : 'blue') + c.uso.map((u) => ui.chip(u, 'gray')).join('') + '</div>' +
        '<div class="lt-row lt-row--between lt-mt-4 lt-small"><span class="lt-muted">Conciliado até ' + fmt.dataCurta(c.conciliadoAte) + '</span>' + (c.naoConc ? ui.chip(fmt.plural(c.naoConc, 'pendência'), 'amber', { dot: true }) : ui.chip('Em dia', 'green', { dot: true })) + '</div>' }));
      const conc = ui.table({ rows: F.extrato, columns: [
        { label: 'Data', key: 'data', render: (x) => '<span class="lt-num">' + fmt.dataCurta(x.data) + '</span><span class="lt-table__secondary">' + BANCO_CURTO[x.contaId] + '</span>' },
        { label: 'Histórico do extrato', key: 'historico', render: (x) => '<span class="lt-mono" style="font-size:12px">' + esc(x.historico) + '</span>' },
        { label: 'Valor', key: 'valor', align: 'right', render: (x) => M(x.valor, x.valor < 0 ? 'lt-danger' : 'lt-success') },
        { label: 'Lançamento sugerido', key: 'sug', render: (x) => (x.sugestao ? '<span class="lt-strong lt-small" style="display:block">' + esc(x.sugestao.label) + '</span>' : '<span class="lt-muted lt-small" style="display:block">Sem correspondência</span>') + '<span class="lt-table__secondary">' + ui.chip('Confiança ' + CONF[x.conf][0].toLowerCase(), CONF[x.conf][1]) + ' ' + esc(x.motivo) + '</span>' }
      ], rowActions: (x) => x.sugestao ? ui.btn({ label: 'Conciliar', icon: 'check', size: 'xs', variant: 'outline', acao: 'concluir', loading: 'Conciliando…', toast: 'Conciliado', toastText: esc(x.sugestao.label) + ' baixado em ' + fmt.dataCurta(x.data) + '.' }) + ui.btn({ icon: 'search', variant: 'ghost', size: 'xs', tip: 'Escolher outro lançamento', sheet: 'fin-novo-lancamento' }) : ui.btn({ label: 'Criar lançamento', icon: 'plus', size: 'xs', variant: 'outline', sheet: 'fin-novo-custo-adm' }) + ui.btn({ icon: 'eye-off', variant: 'ghost', size: 'xs', tip: 'Ignorar', acao: 'salvar', toast: 'Linha ignorada' }) });
      const concOk = ui.table({ rows: F.extratoConciliado || [], compact: true, empty: { icon: 'list-checks', title: 'Nenhuma conciliação recente' }, columns: [
        { label: 'Data', key: 'data', render: (x) => '<span class="lt-num">' + fmt.dataCurta(x.data) + '</span><span class="lt-table__secondary">' + BANCO_CURTO[x.contaId] + '</span>' },
        { label: 'Histórico do extrato', key: 'historico', render: (x) => '<span class="lt-mono" style="font-size:12px">' + esc(x.historico) + '</span>' },
        { label: 'Valor', key: 'valor', align: 'right', render: (x) => M(x.valor, x.valor < 0 ? 'lt-danger' : 'lt-success') },
        { label: 'Baixado em', key: 'label', render: (x) => '<a class="lt-strong lt-small" style="display:block" href="#fin-conta-' + (x.titulo.t === 'r' ? 'receber-' : 'pagar-') + x.titulo.id + '">' + esc(x.label) + '</a><span class="lt-table__secondary">' + ui.status('fin_conciliado') + ' ' + esc(x.por) + ' · ' + fmt.dataHora(x.em) + '</span>' }
      ], rowActions: (x) => ui.btn({ icon: 'history', variant: 'ghost', size: 'xs', tip: 'Desfazer conciliação', dialog: 'fin-desfazer-baixa', attrs: { 'data-t': 'conc', 'data-id': x.id } }) });
      return ui.pageHeader({ breadcrumb: crumb('Contas bancárias'), title: 'Contas bancárias', sub: 'Saldos, extratos e conciliação. O extrato importado (OFX) é cruzado com os títulos em aberto por valor líquido, data e CNPJ.',
          actions: ui.btn({ label: 'Transferir entre contas', icon: 'refresh', sheet: 'fin-transferencia' }) + ui.btn({ label: 'Importar extrato (OFX)', icon: 'upload', sheet: 'fin-importar-extrato' }) + ui.btn({ label: 'Nova conta', icon: 'plus', variant: 'primary', sheet: 'fin-nova-conta-bancaria' }) }) +
        ui.kpis([
          { label: 'Saldo total', value: fmt.moeda(tot, true), icon: 'landmark', foot: F.contas.length + ' contas' },
          { label: 'Em conta corrente', value: fmt.moeda(cc, true), icon: 'wallet', foot: 'disponível para pagamentos' },
          { label: 'Em aplicação', value: fmt.moeda(apl, true), icon: 'trending-up', foot: 'CDB com liquidez diária · ' + MC(F.contas[2].rendimentoMes) + ' no mês' },
          { label: 'A conciliar', value: String(nc), unit: 'lançamentos', icon: 'list-checks', foot: 'linhas do extrato sem baixa' }
        ]) +
        '<div class="lt-grid lt-grid--4 lt-mt-6">' + cards.join('') + '</div>' +
        '<div class="lt-mt-6">' + ui.card({ title: 'Conciliação bancária', icon: 'list-checks', sub: 'Linhas do extrato ainda sem baixa no sistema · importado hoje às 08:40 · recebimentos de clientes chegam líquidos de retenções', flush: true, actions: ui.btn({ label: 'Conciliar sugestões de alta confiança', icon: 'check', size: 'sm', variant: 'primary', acao: 'concluir', loading: 'Conciliando…', toast: '2 lançamentos conciliados', toastText: 'Metalatibaia (PIX de ' + fmt.moeda((F.extrato.find((x) => x.id === 1) || { valor: 0 }).valor) + ', líquido da NFS-e de R$ 4.500,00) e Office Cloud (R$ 1.180,00).' }), body: conc }) + '</div>' +
        '<div class="lt-mt-6">' + ui.card({ title: 'Conciliadas recentemente', icon: 'check-circle', sub: 'Baixas feitas pelo extrato nos últimos 7 dias. Se casou com o título errado, desfaça: a linha volta para a fila e o título volta para Em aberto.', flush: true, body: concOk }) + '</div>';
    }
  });
  ui.registerSheet('fin-nova-conta-bancaria', () => ({
    eyebrow: 'Contas bancárias', title: 'Nova conta bancária',
    body: '<div class="lt-sections">' + ui.section({ title: 'Banco', tone: 'gold', icon: 'landmark', cols: 2, body: ui.field({ label: 'Banco', type: 'select', required: true, placeholder: 'Escolha o banco', options: ['001 · Banco do Brasil', '033 · Santander', '104 · Caixa Econômica', '237 · Bradesco', '341 · Itaú Unibanco', '756 · Sicoob', '748 · Sicredi', '077 · Inter'] }) + ui.field({ label: 'Tipo', type: 'select', options: ['Conta corrente', 'Aplicação', 'Caixa'] }) + ui.field({ label: 'Agência', placeholder: '0000-0' }) + ui.field({ label: 'Conta', placeholder: '00000-0' }) + ui.field({ label: 'Apelido', span: 2, placeholder: 'Ex.: Conta de cobrança' }) }) +
      ui.section({ title: 'Uso', tone: 'blue', icon: 'sliders', body: ui.field({ type: 'checks', options: ['Recebimento de boletos', 'PIX de clientes', 'Pagamentos', 'Folha', 'Impostos', 'Reserva'] }) }) +
      ui.section({ title: 'Saldo inicial', tone: 'green', icon: 'dollar', cols: 2, body: ui.field({ label: 'Saldo', type: 'money' }) + ui.field({ label: 'Data do saldo', type: 'date', value: HOJE }) }) + '</div>',
    foot: ui.sheetFoot({ label: 'Salvar conta', toast: 'Conta bancária cadastrada' })
  }));
  ui.registerSheet('fin-importar-extrato', () => ({
    eyebrow: 'Contas bancárias', title: 'Importar extrato',
    body: '<div class="lt-sections">' + ui.section({ title: 'Conta', tone: 'gold', icon: 'landmark', body: ui.field({ label: 'Conta bancária', type: 'select', value: 1, options: F.contas.map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido })) }) }) +
      ui.section({ title: 'Arquivo', tone: 'slate', icon: 'upload', body: ui.field({ type: 'upload', accept: 'OFX ou CSV exportado do internet banking · até 10 MB' }) + '<p class="lt-hint lt-mt-2">Linhas já conciliadas são ignoradas. As demais recebem sugestão de lançamento por valor, data e CNPJ.</p>' }) + '</div>',
    foot: ui.sheetFoot({ label: 'Importar extrato', icon: 'upload', acao: 'importar', toast: 'Extrato importado', toastText: '12 linhas lidas · 9 conciliadas sozinhas · 3 para revisar.' })
  }));
  ui.registerSheet('fin-transferencia', () => ({
    eyebrow: 'Contas bancárias', title: 'Transferir entre contas', sub: 'Não entra no DRE: só move saldo entre contas da Atlas.',
    body: '<div class="lt-sections">' + ui.section({ title: 'Origem e destino', tone: 'blue', icon: 'refresh', cols: 2, body: ui.field({ label: 'De', type: 'select', value: 3, options: F.contas.map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido + ' (' + MC(c.saldo) + ')' })) }) + ui.field({ label: 'Para', type: 'select', value: 1, options: F.contas.map((c) => ({ value: c.id, label: c.banco + ' · ' + c.apelido })) }) }) +
      ui.section({ title: 'Valor', tone: 'green', icon: 'dollar', cols: 2, body: ui.field({ label: 'Valor', type: 'money', required: true }) + ui.field({ label: 'Data', type: 'date', value: HOJE }) + ui.field({ label: 'Motivo', span: 2, placeholder: 'Ex.: reforço de caixa para o 13º salário' }) }) + '</div>',
    foot: ui.sheetFoot({ label: 'Registrar transferência', acao: 'registrar', toast: 'Transferência registrada', toastText: 'Saldos das duas contas atualizados.' })
  }));

  /* ================================================================== */
  /* PLANO DE CONTAS                                                       */
  /* ================================================================== */
  const NATUREZA = { receita: ['Receita', 'green'], direto: ['Custo direto', 'violet'], adm: ['Administrativo', 'slate'], patrimonial: ['Patrimonial', 'gray'] };
  function stPl() { const S = App.state.finPl || (App.state.finPl = { chip: 'todos', dre: '' }); S.busca = ''; return S; }
  function filtraPl(S) { return F.planoContas.filter((p) => (S.chip === 'todos' || p.natureza === S.chip || (S.chip === 'semtipo' && !p.tipoDre)) && (!S.dre || p.tipoDre === S.dre) && (!S.busca || norm(p.cod + ' ' + p.catNome + ' ' + p.sub).indexOf(norm(S.busca)) >= 0)); }
  function tabelaPl(rows) {
    return ui.table({ rows, selectable: true, pageSize: 15, rowClass: (p) => p.ativo ? '' : 'is-muted', empty: { icon: 'list', title: 'Nenhuma conta neste filtro' },
      bulk: ui.btn({ label: 'Alterar tipo DRE', icon: 'tag', size: 'xs', variant: 'outline', attrs: { 'data-fin-lote': 'dre' } }) + ui.btn({ label: 'Desativar', icon: 'eye-off', size: 'xs', variant: 'ghost', acao: 'salvar', toast: 'Contas desativadas', toastText: 'Não aparecem mais nos formulários. O histórico continua no DRE.' }),
      columns: [
        { label: 'Código', key: 'cod', sortable: true, render: (p) => '<span class="lt-mono">' + p.cod + '</span>' },
        { label: 'Subcategoria', key: 'sub', sortable: true, value: (p) => p.sub, render: (p) => { const c = F.cat(p.categoria); return '<span class="lt-row lt-row--nowrap" style="gap:10px"><span class="lt-list__icon" data-tone="' + (c.tone === 'slate' || c.tone === 'gray' ? 'gold' : c.tone) + '" style="width:28px;height:28px">' + I(c.icon) + '</span><span><span class="lt-table__primary">' + esc(p.sub) + '</span><span class="lt-table__secondary">' + esc(p.catNome) + '</span></span></span>'; } },
        { label: 'Natureza', key: 'nat', render: (p) => ui.chip(NATUREZA[p.natureza][0], NATUREZA[p.natureza][1]) },
        { label: 'Tipo DRE', key: 'dre', sortable: true, value: (p) => p.tipoDre || '', render: (p) => dreChip(p.tipoDre) },
        { label: 'Centro de custo', key: 'centro', render: (p) => '<span class="lt-small">' + esc(p.centro) + '</span>' },
        { label: 'Lançamentos 2026', key: 'uso', align: 'right', sortable: true, value: (p) => p.uso, render: (p) => p.uso ? '<span class="lt-num">' + p.uso + '</span>' : '<span class="lt-muted">0</span>' },
        { label: 'Ativa', key: 'ativo', align: 'center', render: (p) => '<label class="lt-toggle lt-toggle--sm" title="' + (p.ativo ? 'Ativa' : 'Inativa') + '"><input type="checkbox"' + (p.ativo ? ' checked' : '') + ' data-fin-ativa aria-label="Conta ativa"><span class="lt-toggle__track"></span></label>' }
      ],
      rowActions: (p) => ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar', sheet: 'fin-nova-conta-plano', attrs: { 'data-id': p.id } }) });
  }
  App.screen({
    id: 'fin.chart_of_accounts', hash: 'fin-plano-contas', module: 'financeiro', title: 'Plano de contas', nav: true, navGroup: 'financeiro', navOrder: 12,
    render: () => {
      const S = stPl(), sem = F.planoContas.filter((p) => !p.tipoDre);
      return ui.pageHeader({ breadcrumb: crumb('Plano de contas'), title: 'Plano de contas', sub: 'Categorias e subcategorias usadas em todos os lançamentos. O tipo DRE de cada subcategoria define a linha do demonstrativo. As contas patrimoniais (tributos retidos a compensar) ficam fora do DRE.',
          actions: ui.btn({ label: 'Restaurar plano padrão', icon: 'copy', acao: 'copiar', loading: 'Restaurando…', confirm: 'Restaurar o plano padrão da Atlas?', confirmText: 'Subcategorias criadas por vocês continuam. As padrão voltam ao tipo DRE original.', confirmLabel: 'Restaurar', confirmTone: 'primary', toast: 'Plano padrão restaurado' }) + ui.btn({ label: 'Nova subcategoria', icon: 'plus', variant: 'primary', sheet: 'fin-nova-conta-plano' }) }) +
        (sem.length ? ui.callout({ tone: 'warning', title: fmt.plural(sem.length, 'subcategoria sem tipo DRE'), text: esc(sem.map((p) => p.catNome + ' › ' + p.sub).join(', ')) + ': os lançamentos dela ficam fora do DRE até receberem um tipo.', actions: ui.btn({ label: 'Classificar', size: 'sm', variant: 'outline', sheet: 'fin-nova-conta-plano', attrs: { 'data-id': sem[0].id } }) }) + '<div class="lt-mt-4"></div>' : '') +
        ui.summary(F.tiposDre.map((t) => ({ label: t.curto, value: '<span class="lt-num">' + F.planoContas.filter((p) => p.tipoDre === t.key).length + '</span> <span class="lt-hint">contas</span>' }))) + '<div class="lt-mt-6"></div>' +
        ui.filters({ busca: 'Buscar código ou categoria', selects: [{ label: 'Tipo DRE', name: 'f-dre', value: S.dre, options: F.tiposDre.map((t) => ({ value: t.key, label: t.curto })) }], chipGroup: 'single', chips: [{ label: 'Todas', value: 'todos', active: S.chip === 'todos', count: F.planoContas.length }, { label: 'Receitas', value: 'receita', tone: 'green', active: S.chip === 'receita' }, { label: 'Custos diretos', value: 'direto', tone: 'violet', active: S.chip === 'direto' }, { label: 'Administrativas', value: 'adm', tone: 'slate', active: S.chip === 'adm' }, { label: 'Patrimoniais', value: 'patrimonial', tone: 'gray', active: S.chip === 'patrimonial' }, { label: 'Sem tipo DRE', value: 'semtipo', tone: 'red', count: sem.length, active: S.chip === 'semtipo' }] }) +
        '<div data-fin-lista>' + tabelaPl(filtraPl(S)) + '</div>';
    },
    mount: (root) => {
      const S = stPl(); let rows = filtraPl(S);
      bindFiltros(root, S, () => { rows = filtraPl(S); const box = root.querySelector('[data-fin-lista]'); box.innerHTML = tabelaPl(rows); ui.enhance(box); });
      on(root, 'click', (e) => { const b = e.target.closest('[data-fin-lote="dre"]'); if (b) ui.openDialog('fin-tipo-dre-lote', { n: selecionados(b, rows).length }); });
      on(root, 'change', (e) => { if (e.target.matches('[data-fin-ativa]')) { e.target.closest('tr').classList.toggle('is-muted', !e.target.checked); ui.toast(e.target.checked ? 'Conta ativada' : 'Conta desativada', 'info', e.target.checked ? 'Volta a aparecer nos formulários.' : 'Some dos formulários; o histórico continua no DRE.'); } });
    }
  });
  ui.registerDialog('fin-tipo-dre-lote', (p) => ({
    title: 'Alterar tipo DRE', icon: 'tag', text: fmt.plural(p.n || 0, 'subcategoria selecionada', 'subcategorias selecionadas') + '. Os lançamentos do ano são reclassificados no DRE.',
    body: ui.field({ type: 'radio', name: 'dre-lote', value: 'fixa', options: F.tiposDre.map((t) => ({ value: t.key, label: t.nome })) }) + '<div class="lt-mt-4">' + ui.callout({ tone: 'warning', text: 'Meses fechados não mudam. A reclassificação vale para os meses em revisão e abertos.' }) + '</div>',
    foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Aplicar', icon: 'check', variant: 'primary', acao: 'salvar', loading: 'Reclassificando…', toast: 'Tipo DRE alterado', toastText: 'DRE de outubro e novembro recalculado.', fechar: 'dialog' })
  }));
  ui.registerSheet('fin-nova-conta-plano', (p) => {
    const pl = p.id ? F.planoContas.find((x) => x.id === p.id) : null;
    return {
      eyebrow: 'Plano de contas', title: pl ? 'Editar ' + pl.sub : 'Nova subcategoria', sub: pl ? 'Código ' + pl.cod + ' · ' + fmt.plural(pl.uso, 'lançamento') + ' em 2026' : 'Entra nos formulários de lançamento e no DRE.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'tag', cols: 2, body: ui.field({ label: 'Natureza', type: 'select', value: pl ? pl.natureza : 'adm', options: Object.keys(NATUREZA).map((k) => ({ value: k, label: NATUREZA[k][0] })) }) + ui.field({ label: 'Categoria', type: 'select', value: pl ? pl.categoria : 'infra', options: F.categorias.map((c) => ({ value: c.key, label: c.nome })) }) + ui.field({ label: 'Subcategoria', required: true, value: pl ? pl.sub : '', placeholder: 'Ex.: Seguro do escritório' }) + ui.field({ label: 'Código', value: pl ? pl.cod : '3.03.09', hint: 'Sugerido pela posição na categoria' }) }) +
        ui.section({ title: 'DRE e centro de custo', tone: 'violet', icon: 'chart-bar', cols: 2, body: ui.field({ label: 'Tipo DRE', type: 'select', required: true, value: pl ? pl.tipoDre || '' : 'fixa', placeholder: 'Escolha o tipo', options: F.tiposDre.map((t) => ({ value: t.key, label: t.nome })), error: pl && !pl.tipoDre ? 'Sem tipo DRE: lançamentos ficam fora do demonstrativo.' : '' }) + ui.field({ label: 'Centro de custo padrão', type: 'select', value: pl ? pl.centro : 'Administrativo', options: F.centros }) }) +
        ui.section({ title: 'Sugestão automática', sub: 'Usado na importação de notas e na conciliação.', tone: 'green', icon: 'zap', cols: 2, body: ui.field({ label: 'Palavras-chave', span: 2, value: pl && pl.sub === 'Materiais de escritório' ? 'papel, toner, caneta, pasta, envelope' : '', placeholder: 'separe por vírgula' }) + ui.field({ label: 'NCM (início)', placeholder: 'Ex.: 4802, 8443' }) + ui.field({ type: 'toggle', label: 'Ativa nos formulários', checked: pl ? pl.ativo : true }) }) + '</div>',
      foot: ui.sheetFoot({ label: pl ? 'Salvar alterações' : 'Criar subcategoria', toast: 'Plano de contas atualizado' })
    };
  });

  /* ================================================================== */
  /* FORNECEDORES                                                          */
  /* ================================================================== */
  App.screen({
    id: 'fin.supplier.list', hash: 'fin-fornecedores', module: 'financeiro', title: 'Fornecedores', nav: true, navGroup: 'financeiro', navOrder: 13,
    render: () => {
      const P = rowsP();
      const rows = F.fornecedores.map((f) => Object.assign({ aberto: soma(P.filter((r) => r.c.fornecedorId === f.id && isAberto(r)), (r) => r.p.valor), ano: soma(P.filter((r) => r.c.fornecedorId === f.id && r.sit === 'fin_pago'), (r) => r.p.valor) }, f));
      return ui.pageHeader({ breadcrumb: crumb('Fornecedores'), title: 'Fornecedores', sub: 'Quem a Atlas paga. A categoria padrão de cada fornecedor alimenta a sugestão automática nas notas e nos lançamentos.', actions: ui.btn({ label: 'Novo fornecedor', icon: 'plus', variant: 'primary', sheet: 'fin-novo-fornecedor' }) }) +
        ui.filters({ busca: 'Buscar fornecedor ou CNPJ', selects: [{ label: 'Categoria', options: F.categorias.filter((c) => c.natureza === 'direto' || c.natureza === 'adm').map((c) => ({ value: c.key, label: c.nome })) }], chipGroup: 'single', chips: [{ label: 'Ativos', value: 'ativo', active: true, count: rows.filter((f) => f.status === 'ativo').length }, { label: 'Inativos', value: 'inativo', tone: 'gray', count: rows.filter((f) => f.status !== 'ativo').length }, { label: 'Órgãos públicos', value: 'publico', tone: 'slate', count: rows.filter((f) => f.publico).length }] }) +
        ui.table({ rows, rowSheet: (f) => ({ sheet: 'fin-novo-fornecedor', params: { id: f.id } }), rowClass: (f) => 'fin-f-' + f.status + (f.publico ? ' fin-f-publico' : ''), columns: [
          { label: 'Fornecedor', key: 'f', sortable: true, value: (f) => f.fantasia, render: (f) => '<span class="lt-table__primary">' + esc(f.fantasia) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:220px" title="' + esc(f.razao) + '">' + esc(f.razao) + '</span>' },
          { label: 'CNPJ', key: 'cnpj', render: (f) => '<span class="lt-num lt-small" style="white-space:nowrap">' + esc(f.cnpj) + '</span>' },
          { label: 'Categoria padrão', key: 'cat', render: (f) => '<span class="lt-small" style="display:block">' + esc(f.sub) + '</span><span class="lt-table__secondary">' + esc((F.cat(f.categoria) || {}).nome) + '</span>' },
          { label: 'Contato', key: 'c', render: (f) => '<span class="lt-small" style="display:block">' + esc(f.contato) + '</span><span class="lt-table__secondary">' + esc(f.telefone) + '</span>' },
          { label: 'Prazo · forma', key: 'p', render: (f) => '<span class="lt-small" style="display:block">' + esc(f.prazo) + '</span><span class="lt-table__secondary">' + esc(formaNome(f.forma)) + '</span>' },
          { label: 'Em aberto', key: 'ab', align: 'right', sortable: true, value: (f) => f.aberto, render: (f) => f.aberto ? M(f.aberto) : '<span class="lt-muted">—</span>' },
          { label: 'Situação', key: 's', render: (f) => ui.status(f.status) }
        ], rowActions: (f) => (f.pix ? '<button type="button" class="lt-btn lt-btn--ghost lt-btn--xs lt-btn--icon" title="Copiar chave PIX" aria-label="Copiar chave PIX" data-copy="' + esc(f.pix) + '" data-copy-label="Chave PIX copiada">' + I('copy') + '</button>' : '') + ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar', sheet: 'fin-novo-fornecedor', attrs: { 'data-id': f.id } }) });
    },
    mount: (root) => {
      const apply = () => {
        const q = norm((root.querySelector('[data-filter-search]') || {}).value), chip = (root.querySelector('.lt-filter-chip.is-active') || {}).getAttribute ? root.querySelector('.lt-filter-chip.is-active').getAttribute('data-value') : 'ativo', cat = (root.querySelector('.lt-filters select') || {}).value;
        root.querySelectorAll('[data-lt-table] tbody tr').forEach((tr) => { const f = F.fornecedores[+tr.getAttribute('data-ri')]; const ok = (chip === 'publico' ? f.publico : f.status === chip) && (!cat || f.categoria === cat) && (!q || norm(f.razao + ' ' + f.fantasia + ' ' + f.cnpj).indexOf(q) >= 0); tr.hidden = !ok; });
      };
      let t; on(root, 'input', () => { clearTimeout(t); t = setTimeout(apply, 150); }); on(root, 'change', apply); on(root, 'lt:filter', apply);
      setTimeout(apply, 0);
    }
  });
  ui.registerSheet('fin-novo-fornecedor', (p) => {
    const f = p.id ? forn(p.id) : null;
    return {
      eyebrow: 'Fornecedores', title: f ? f.fantasia : 'Novo fornecedor', sub: f ? esc(f.razao) : 'Comece pelo CNPJ: os dados da Receita preenchem o restante.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'building', cols: 2, aside: ui.field({ type: 'toggle', label: 'Ativo', checked: !f || f.status === 'ativo' }), body: '<div class="lt-span-full lt-row lt-row--nowrap" style="align-items:flex-end">' + '<div style="flex:1">' + ui.field({ label: 'CNPJ', type: 'cnpj', value: f && f.cnpj !== '—' ? f.cnpj : '', required: true }) + '</div>' + ui.btn({ label: 'Buscar dados', icon: 'search', variant: 'outline', acao: 'verificar', loading: 'Consultando…', toast: 'Dados encontrados', toastText: 'Razão social e endereço preenchidos pela consulta pública do CNPJ.' }) + '</div>' + ui.field({ label: 'Razão social', required: true, value: f ? f.razao : '' }) + ui.field({ label: 'Nome fantasia', value: f ? f.fantasia : '' }) }) +
        ui.section({ title: 'Contato', tone: 'blue', icon: 'user', cols: 3, body: ui.field({ label: 'Nome', value: f ? f.contato : '' }) + ui.field({ label: 'E-mail', type: 'email', value: f ? f.email : '' }) + ui.field({ label: 'Telefone', value: f ? f.telefone : '' }) }) +
        ui.section({ title: 'Classificação padrão', sub: 'Sugerida automaticamente nas notas e nos lançamentos deste fornecedor.', tone: 'violet', icon: 'tag', cols: 2, body: ui.field({ label: 'Categoria', type: 'select', value: f ? f.categoria : 'infra', options: F.categorias.filter((c) => c.natureza === 'direto' || c.natureza === 'adm').map((c) => ({ value: c.key, label: c.nome })) }) + ui.field({ label: 'Subcategoria', type: 'select', value: f ? f.sub : '', options: subOptions(f ? f.categoria : 'infra') }) }) +
        ui.section({ title: 'Pagamento', tone: 'green', icon: 'wallet', cols: 2, body: ui.field({ label: 'Forma preferida', type: 'select', value: f ? f.forma : 'boleto', options: F.formas.map((x) => ({ value: x.key, label: x.nome })) }) + ui.field({ label: 'Prazo', value: f ? f.prazo : '', placeholder: 'Ex.: 30 dias' }) + ui.field({ label: 'Chave PIX', value: f && f.pix ? f.pix : '' }) + ui.field({ label: 'Banco · agência · conta', value: f && f.banco ? f.banco : '' }) }) +
        ui.section({ title: 'Observações', tone: 'slate', icon: 'file-text', body: ui.field({ type: 'textarea', rows: 2, value: f && f.obs ? f.obs : '' }) }) + '</div>',
      foot: ui.sheetFoot({ label: f ? 'Salvar fornecedor' : 'Cadastrar fornecedor', toast: f ? 'Fornecedor atualizado' : 'Fornecedor cadastrado' })
    };
  });
})();
