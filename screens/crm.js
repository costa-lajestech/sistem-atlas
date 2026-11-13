/* ==========================================================================
   ATLAS · screens/crm.js — telas do CRM COMERCIAL
   Telas (ID · hash):
     crm.deal.kanban     #crm-funil                 funil de 10 etapas (arrastar abre "Mover etapa")
     crm.deal.list       #crm-negocios              lista de negócios
     crm.deal.detail     #crm-negocio-<id>          ficha do negócio
     crm.deal.move       #crm-mover-etapa-<n>       requisitos por etapa + diálogo "Mover etapa"
     crm.deal.new        #crm-novo-lead             gaveta "Novo lead / negócio" (CNPJ validado)
     crm.lead.list       #crm-empresas              leads e empresas
     crm.lead.import     #crm-importar              diálogo de importação de planilha
     crm.company.detail  #crm-empresa-<id>          ficha 360° da empresa
     crm.contact.list    #crm-contatos              contatos (decisor / não decisor)
     crm.activity.new    #crm-registrar-atividade   gaveta "Registrar atividade"
     crm.task.list       #crm-tarefas               tarefas comerciais
     crm.dashboard       #crm-painel                indicadores por consultor
     crm.goals           #crm-metas                 metas e fechamento mensal
     crm.bottlenecks     #crm-gargalos              gargalos do funil
     crm.automations     #crm-automacoes            regras automáticas (2.4 e 2.5 da proposta)
   Gavetas: crm-novo-negocio · crm-nova-atividade · crm-contato · crm-novo-contato · crm-editar-empresa · crm-documento
   Diálogos: crm-mover-etapa · crm-importar
   CSS próprio: bloco pequeno .m-crm-* (rastreador de etapas, linha "próxima tarefa" do cartão, células do painel).
   ========================================================================== */
(function () {
  'use strict';
  const App = window.App, ui = App.ui, esc = ui.esc, fmt = App.fmt, util = App.util, db = App.db, D = App.data, I = App.icon;
  const C = D.crm;
  const HOJE = util.hojeIso();

  /* ------------------------------------------------------------------ */
  /* CSS mínimo do módulo (prefixo .m-crm-, só variáveis de cor)          */
  /* ------------------------------------------------------------------ */
  (function () {
    if (document.getElementById('m-crm-css')) return;
    const s = document.createElement('style'); s.id = 'm-crm-css';
    s.textContent = [
      '.m-crm-board .lt-kanban__col{flex:0 0 240px;width:240px;min-width:0}',
      '.m-crm-board .lt-kanban__card,.m-crm-board .lt-kanban__card .lt-chips{min-width:0}',
      '.m-crm-next{flex-basis:100%;width:100%;display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;font-size:11.5px;color:var(--text-2);font-weight:500}',
      '.m-crm-next>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
      '.m-crm-next .lt-icon,.m-crm-days .lt-icon{width:13px;height:13px;flex-shrink:0}',
      '.m-crm-next.is-late{color:var(--danger-text)}.m-crm-next.is-none{color:var(--warning-text)}',
      '.m-crm-days{display:inline-flex;align-items:center;gap:3px;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.m-crm-days.is-late{color:var(--danger-text);font-weight:600}',
      '.m-crm-stages{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px;margin:0 0 var(--sp-5)}',
      '.m-crm-stage{display:flex;flex-direction:column;gap:6px;min-width:0;padding:0;border:0;background:none;text-align:left;font:inherit;font-size:11.5px;color:var(--text-muted);cursor:pointer}',
      '.m-crm-stage:disabled{cursor:default}',
      '.m-crm-stage__bar{display:block;height:6px;border-radius:2px;background:var(--surface-3)}',
      '.m-crm-stage.is-done .m-crm-stage__bar{background:var(--gold);opacity:.45}',
      '.m-crm-stage.is-current .m-crm-stage__bar{background:var(--gold);box-shadow:0 0 0 2px var(--gold-focus)}',
      '.m-crm-stage.is-current{color:var(--text);font-weight:600}',
      '.m-crm-stage.is-won .m-crm-stage__bar{background:var(--success);opacity:1}',
      '.m-crm-stage.is-lost .m-crm-stage__bar{background:var(--danger);opacity:1}',
      '.m-crm-stage:not(:disabled):hover .m-crm-stage__bar{background:var(--gold-hover);opacity:1}',
      '.m-crm-stage__name{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.m-crm-cell{display:flex;flex-direction:column;gap:4px;min-width:64px}',
      '.m-crm-cell .lt-progress{height:4px}',
      '.m-crm-goal{width:76px;height:32px;text-align:right}',
      '.lt-table tbody tr.m-crm-late td:first-child{box-shadow:inset 3px 0 0 var(--danger)}',
      '.m-crm-goal--money{width:128px}',
      '.m-crm-flow{display:inline-flex;text-decoration:none;border-radius:999px}.m-crm-flow:hover .lt-chip,.m-crm-flow:focus-visible .lt-chip{box-shadow:0 0 0 1px var(--tone-violet-solid)}',
      '@media (max-width:767px){.m-crm-stage__name{display:none}.m-crm-stages{margin-bottom:var(--sp-4)}}'
    ].join('\n');
    document.head.appendChild(s);
  })();

  App.status.prospect = ['Prospect', 'blue'];
  App.status.cliente = ['Cliente', 'green'];

  /* ------------------------------------------------------------------ */
  /* Dados: atalhos                                                       */
  /* ------------------------------------------------------------------ */
  const ETAPAS = D.funis.comercial.etapas;
  const ABERTAS = ETAPAS.filter((e) => !e.desfecho);
  const DESF = {
    ganho: { key: 'ganho', nome: 'Ganho', tone: 'green', icon: 'check-circle', cor: 'var(--tone-green-solid)' },
    perdido: { key: 'perdido', nome: 'Perdido', tone: 'red', icon: 'x-circle', cor: 'var(--tone-red-solid)' },
    descartado: { key: 'descartado', nome: 'Descartado', tone: 'gray', icon: 'minus-circle', cor: 'var(--tone-gray-solid)' }
  };
  const TIPOS = {};
  D.listas.tiposAtividade.forEach((t) => { TIPOS[t.key] = t; });
  TIPOS.calculo = { key: 'calculo', nome: 'Cálculo', icon: 'calculator', tone: 'green', resultados: ['Concluído'] };
  TIPOS.nota = { key: 'nota', nome: 'Comentário', icon: 'message', tone: 'violet', resultados: [] };
  const TIPOS_FORM = ['ligacao', 'reuniao', 'comunicacao', 'documentacao', 'apresentacao', 'followup'];
  const IKEYS = ['ligacoes', 'agendadas', 'realizadas', 'naoRealizadas', 'reagendadas', 'cartas', 'apresentacoes', 'docs'];
  const MKEYS = ['ligacoes', 'agendadas', 'realizadas', 'cartas', 'apresentacoes', 'contratos', 'valor'];
  const IND = {}; C.indicadores.forEach((i) => { IND[i.key] = i; });

  const pessoa = (id) => db.pessoa(id) || { nome: '—' };
  const nome1 = (id) => pessoa(id).nome.split(' ')[0];
  const emp = (id) => db.empresa(id) || { id: 0, fantasia: '—', razao: '—', cnpj: '', regime: '', segmento: '', origem: '' };
  const neg = (id) => db.negocio(id);
  const aberto = (n) => !n.desfecho;
  const etapaDe = (n) => db.etapa(n.etapa);
  const diasEtapa = (n) => util.diasEntre(n.entrouEtapaEm, App.HOJE);
  const parado = (n) => { if (!aberto(n)) return false; const e = etapaDe(n); return !!(e && e.sla && diasEtapa(n) > e.sla); };
  const negsDa = (eid) => D.negocios.filter((n) => n.empresaId === eid);
  const abertos = () => D.negocios.filter(aberto);
  /* "Ver como" (?vercomo=3): com escopo 'proprios' (perfil Consultor) as listas mostram só os registros da pessoa (App.escopo) */
  const soMeus = () => App.escopo('crm.deal.read') === 'proprios';
  const meuNeg = (n) => !soMeus() || n.consultorId === App.meId;
  const minhaEmp = (e) => !soMeus() || e.consultorId === App.meId || D.negocios.some((n) => n.empresaId === e.id && n.consultorId === App.meId);
  const decisor = (eid) => { const l = db.contatosDa(eid); return l.find((c) => c.decisor) || l[0] || null; };
  const negIdDe = (t) => { if (t.negocioId) return t.negocioId; const m = t.ref && String(t.ref.hash).match(/^crm-negocio-(\d+)$/); return m ? +m[1] : null; };
  const todasTarefas = () => D.tarefas.filter((t) => t.modulo === 'crm').concat(C.tarefas, C.tarefasHist);
  const porPrazo = (a, b) => String(a.prazo).localeCompare(String(b.prazo));
  const tarefasNeg = (id) => todasTarefas().filter((t) => negIdDe(t) === id);
  const abertasNeg = (id) => tarefasNeg(id).filter((t) => t.status !== 'concluida').sort(porPrazo);
  const proxima = (n) => abertasNeg(n.id)[0] || null;
  const semProxima = (n) => aberto(n) && !proxima(n);
  const atrasada = (t) => t.status !== 'concluida' && util.parse(t.prazo) < App.HOJE;
  const ehHoje = (d) => util.iso(d) === HOJE;
  const atividadesNeg = (id) => C.atividades.concat(C.geradas).filter((a) => a.negocioId === id);
  const movsNeg = (id) => C.movimentos.filter((m) => m.negocioId === id).sort((a, b) => a.em.localeCompare(b.em));
  const docsNeg = (id) => C.documentos.filter((d) => d.negocioId === id);
  const docsCliente = (id) => docsNeg(id).filter((d) => d.origem === 'cliente' && d.categoria !== 'Contrato de honorários');
  const contratoDe = (n) => D.contratos.find((c) => c.negocioId === n.id) || null;
  const principal = (eid) => negsDa(eid).filter(aberto).sort((a, b) => b.etapa - a.etapa)[0] || null;
  const honorarioExito = (n) => n.creditoEstimado * (n.exitoPct || 0) / 100;
  /* Crédito recuperado: fonte única do Jurídico (compensações em processo apto); sem o módulo, o campo do contrato */
  const recuperadoCt = (ct) => (D.juridico && D.juridico.recuperadoContrato ? D.juridico.recuperadoContrato(ct) : ct.creditoRecuperado || 0);
  /* Honorários contratados de um negócio: fee de 12 meses + êxito estimado (fee do contrato ou a sugestão do fechamento) */
  const mensalDe = (n) => { const ct = D.contratos.find((c) => c.negocioId === n.id); return ct ? ct.honorarioMensal : Math.max(1500, Math.round(n.creditoEstimado * 0.0018 / 100) * 100); };
  const honorariosContratados = (n) => 12 * mensalDe(n) + honorarioExito(n);
  const maxEtapa = (n) => { if (n.desfecho === 'ganho') return 10; const v = movsNeg(n.id).map((m) => (typeof m.para === 'number' ? m.para : 0)); if (aberto(n)) v.push(n.etapa); return Math.max.apply(null, v.concat([1])); };
  const etapaNome = (k) => (typeof k === 'number' ? (db.etapa(k) || {}).nome : (DESF[k] || {}).nome) || '—';
  const chave = (k) => (/^\d+$/.test(String(k)) ? +k : String(k));
  const colChave = (c) => { const m = String(c).match(/^e(\d+)$/); return m ? +m[1] : c; };
  const toEl = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let seq = 6900;
  const novoId = () => seq++;
  const temTese = (n) => /insumos|ICMS-ST|importa/i.test(n.titulo);

  /* CNPJ: dígitos verificadores (CAD-03) */
  function cnpjValido(s) {
    const d = String(s || '').replace(/\D/g, '');
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const calc = (len) => { let soma = 0, pos = len - 7; for (let i = len; i >= 1; i--) { soma += +d.charAt(len - i) * pos--; if (pos < 2) pos = 9; } const r = soma % 11; return r < 2 ? 0 : 11 - r; };
    return calc(12) === +d.charAt(12) && calc(13) === +d.charAt(13);
  }
  const empresaPorCnpj = (s) => { const d = String(s || '').replace(/\D/g, ''); return D.empresas.find((e) => e.cnpj.replace(/\D/g, '') === d) || null; };

  /* ------------------------------------------------------------------ */
  /* UI: pedaços reutilizados                                              */
  /* ------------------------------------------------------------------ */
  const REGIME_TOM = { 'Lucro Real': 'gold', 'Lucro Presumido': 'violet', 'Simples Nacional': 'gray' };
  const regimeChip = (r) => ui.chip(r || '—', REGIME_TOM[r] || 'gray');
  const etapaChip = (n, o) => {
    if (n.desfecho) { const d = DESF[n.desfecho]; return ui.chip(d.nome, d.tone, Object.assign({ icon: d.icon }, o || {})); }
    const e = etapaDe(n); return ui.chip(e.num + ' · ' + e.nome, e.tone, Object.assign({ dot: true }, o || {}));
  };
  const etapaCurta = (n) => {
    if (n.desfecho) { const d = DESF[n.desfecho]; return ui.chip(d.nome, d.tone, { icon: d.icon }) + (n.fechadoEm ? '<span class="lt-table__secondary">em ' + fmt.data(n.fechadoEm) + '</span>' : ''); }
    const e = etapaDe(n);
    return ui.chip('Etapa ' + e.num, e.tone, { dot: true }) + '<span class="lt-table__secondary">' + esc(e.nome) + '</span>';
  };
  const chipDe = (k, lg) => {
    if (typeof k === 'number') { const e = db.etapa(k); return ui.chip(e.num + ' · ' + e.nome, e.tone, { dot: true, lg: lg !== false }); }
    const d = DESF[k]; return ui.chip(d.nome, d.tone, { icon: d.icon, lg: lg !== false });
  };
  const fluxoPorCod = (c) => D.fluxos.find((f) => f.codigo === c) || null;
  const fluxoPorId = (id) => D.fluxos.find((f) => f.id === id) || {};
  /* Execução registrada (D.fluxoExecucoes) em que a automação rodou para o registro; sem ela, abre o diagrama */
  const linkFluxo = (cod, hash) => {
    const f = fluxoPorCod(cod); if (!f) return null;
    const ex = hash ? D.fluxoExecucoes.filter((x) => x.fluxoId === f.id && x.estado === 'rodou' && x.registro && x.registro.hash === hash).sort((a, b) => b.quando.localeCompare(a.quando))[0] : null;
    return ex ? '#fluxos-execucao-' + ex.id : '#fluxos-diagrama-' + f.id;
  };
  const origemChip = (o, hash) => {
    if (o === 'Manual') return ui.chip('Manual', 'gray');
    const href = linkFluxo(o, hash), chip = ui.chip(o, 'violet', { icon: 'zap' });
    return href ? '<a class="m-crm-flow" href="' + href + '" title="Criada pela automação ' + esc(o) + ' · abrir no painel Fluxos">' + chip + '</a>' : chip;
  };
  const codLink = (cod) => { const f = fluxoPorCod(cod); return f ? '<a href="#fluxos-diagrama-' + f.id + '" title="Abrir ' + esc(cod) + ' no painel Fluxos">' + esc(cod) + '</a>' : esc(cod); };
  const relChip = (e) => (e.relacao === 'cliente' ? ui.chip('Cliente', 'green', { dot: true }) : e.relacao === 'perdido' ? ui.chip('Perdido', 'red', { dot: true }) : ui.chip('Prospect', 'blue', { dot: true }));
  const prioChip = (p) => ui.chip({ alta: 'Alta', media: 'Média', baixa: 'Baixa' }[p] || p, { alta: 'red', media: 'amber', baixa: 'gray' }[p] || 'gray');
  const diasHtml = (n) => {
    if (!aberto(n)) return '';
    const e = etapaDe(n), d = diasEtapa(n);
    return '<span class="m-crm-days' + (parado(n) ? ' is-late' : '') + '" title="Dias na etapa' + (e.sla ? ' (SLA de ' + fmt.plural(e.sla, 'dia') + ')' : '') + '">' + I('clock') + d + ' d</span>';
  };
  const proxHtml = (n) => {
    if (!aberto(n)) return '<span class="lt-muted">—</span>';
    const t = proxima(n);
    if (!t) return '<span class="m-crm-next is-none">' + I('alert-circle') + '<span>Sem próxima tarefa</span></span>';
    return '<span class="m-crm-next' + (atrasada(t) ? ' is-late' : '') + '" title="' + esc(t.titulo) + '">' + I(t.origem !== 'Manual' ? 'zap' : 'check-square') + '<span>' + esc(fmt.quando(t.prazo)) + ' · ' + esc(t.titulo) + '</span></span>';
  };
  const optsConsultor = () => C.consultores.map((id) => ({ value: id, label: pessoa(id).nome }));
  const optsEtapa = () => ABERTAS.map((e) => ({ value: e.num, label: e.num + ' · ' + e.nome }));
  const optsLista = (k) => db.lista(k).map((x) => ({ value: x, label: x }));
  const optsContatos = (eid) => db.contatosDa(eid).map((c) => ({ value: c.id, label: c.nome + (c.decisor ? ' (decisor)' : '') + ' · ' + c.cargo }));
  const optsNegocios = () => abertos().map((x) => ({ value: x.id, label: emp(x.empresaId).fantasia + ' · ' + x.titulo }));
  /* Trilha do cabeçalho (mesmo padrão do Jurídico e das Configurações): CRM › página */
  const crumbsCrm = (label) => [{ label: 'CRM', hash: 'crm-funil' }, { label }];
  const btnExportar = (arq) => ui.btn({ label: 'Exportar Excel', icon: 'download', acao: 'exportar', toast: 'Planilha gerada', toastText: esc(arq) + ' · a exportação fica registrada na auditoria.' });
  const limparBtn = '<button type="button" class="lt-btn lt-btn--sm" data-crm-limpar>' + I('refresh') + '<span>Limpar filtros</span></button>';
  const labelDe = (i) => { const f = i.closest('.lt-field'), l = f && f.querySelector('.lt-label'); return l ? l.textContent.replace('*', '').trim() : (i.name || 'campo'); };

  /* Valida campos [required] dentro de "escopo"; devolve true se tudo ok. Mostra erro em "alvo". */
  function validar(escopo, alvo, titulo, extra) {
    escopo.querySelectorAll('.lt-field.is-invalid').forEach((f) => f.classList.remove('is-invalid'));
    const falta = [].slice.call(escopo.querySelectorAll('[required]')).filter((i) => !i.closest('[hidden]') && !i.disabled && !String(i.value || '').trim());
    falta.forEach((i) => { const f = i.closest('.lt-field'); if (f) f.classList.add('is-invalid'); });
    const msgs = falta.map(labelDe).concat(extra || []);
    if (alvo) alvo.innerHTML = msgs.length ? ui.callout({ tone: 'danger', title: titulo || 'Falta preencher', text: msgs.map(esc).join(' · ') }) : '';
    if (falta[0]) falta[0].focus();
    return !msgs.length;
  }

  /* O núcleo reaproveita o mesmo #lt-content entre telas, então ouvintes ligados no mount ficariam ativos
     nas telas seguintes. escopo(root) devolve um "root" cujos ouvintes só rodam enquanto esta montagem
     for a atual (mesma tela e mesma geração). Use no início de todo mount do CRM. */
  let GEN = 0;
  function escopo(el) {
    const g = ++GEN, scr = App.current && App.current.screen;
    el._crmGen = g;
    const vivo = () => el._crmGen === g && !!App.current && App.current.screen === scr;
    return { el, vivo, addEventListener: (type, fn) => el.addEventListener(type, (e) => { if (vivo()) fn(e); }), querySelector: (q) => el.querySelector(q), querySelectorAll: (q) => el.querySelectorAll(q) };
  }

  /* Liga busca, selects (com name) e chips de um filtro a um estado; "redesenha" atualiza só a lista */
  function ligarFiltros(root, st, padrao, redesenha) {
    const sb = root.querySelector('.lt-filters [data-filter-search]'); if (sb && st.busca) sb.value = st.busca;
    let tm;
    root.addEventListener('input', (e) => { if (!e.target.matches('.lt-filters [data-filter-search]')) return; clearTimeout(tm); tm = setTimeout(() => { st.busca = e.target.value; redesenha(); }, 220); });
    root.addEventListener('change', (e) => { const s = e.target.closest('.lt-filters select[name]'); if (!s) return; st[s.name] = s.value; redesenha(); });
    root.addEventListener('lt:filter', (e) => { if (!e.target.closest('.lt-filters')) return; st.chip = e.detail.value; redesenha(); });
    root.addEventListener('click', (e) => { if (!e.target.closest('[data-crm-limpar]')) return; Object.assign(st, padrao()); App.refresh(); });
  }
  /* Redesenha uma região com o estado "carregando" (skeleton) por um instante */
  function redesenhar(root, sel, html) {
    const box = root.querySelector(sel); if (!box) return;
    clearTimeout(box._t);
    box.innerHTML = '<div class="lt-card" style="padding:18px">' + ui.skeleton({ lines: 5, title: false }) + '</div>';
    box._t = setTimeout(() => { box.innerHTML = html(); ui.enhance(box); }, 240);
  }

  /* Filtro comum de negócios */
  function filtraNegocios(list, s) {
    const q = String(s.busca || '').trim().toLowerCase();
    return list.filter((n) => {
      if (!meuNeg(n)) return false;
      const e = emp(n.empresaId);
      if (q && (e.fantasia + ' ' + e.razao + ' ' + e.cnpj + ' ' + e.cnpj.replace(/\D/g, '') + ' ' + n.titulo).toLowerCase().indexOf(q) < 0) return false;
      if (s.consultor && String(n.consultorId) !== String(s.consultor)) return false;
      if (s.regime && e.regime !== s.regime) return false;
      if (s.origem && e.origem !== s.origem) return false;
      if (s.segmento && e.segmento !== s.segmento) return false;
      if (s.etapa && (n.desfecho || String(n.etapa) !== String(s.etapa))) return false;
      return true;
    });
  }

  /* Cartão do kanban */
  function cardNegocio(n) {
    const e = emp(n.empresaId);
    let chips = regimeChip(e.regime);
    if (parado(n)) chips += ui.chip('Parado ' + diasEtapa(n) + ' d', 'red', { icon: 'hourglass', title: 'Acima do SLA de ' + fmt.plural(etapaDe(n).sla, 'dia') });
    if (aberto(n)) chips += proxHtml(n);
    return ui.kanbanCard({ id: n.id, href: '#crm-negocio-' + n.id, title: e.fantasia, sub: n.titulo, value: n.creditoEstimado, chips, meta: diasHtml(n), avatar: n.consultorId, late: parado(n), warn: semProxima(n) });
  }

  /* ------------------------------------------------------------------ */
  /* Linha do tempo de um ou mais negócios (ATV-01)                        */
  /* ------------------------------------------------------------------ */
  const AUT_ENTRADA = {
    1: ['AUT-01', 'criou a tarefa "Qualificar lead" com prazo de 24 h'], 4: ['AUT-03', 'programou os lembretes 1 dia antes e no dia da reunião'],
    5: ['AUT-05', 'criou a tarefa "Enviar carta proposta e documentos"'], 7: ['AUT-07', 'criou a tarefa de levantamento para a fila "Equipe de cálculo"'],
    8: ['AUT-08', 'criou a tarefa "Agendar apresentação dos cálculos"'], 9: ['AUT-09', 'programou o follow-up de fechamento em 3 dias úteis'],
    ganho: ['AUT-21', 'concluiu as tarefas pendentes e criou o contrato de honorários no Financeiro']
  };
  function eventosTimeline(ids, tipo) {
    const itens = [];
    ids.forEach((id) => {
      const n = neg(id), e = emp(n.empresaId), rot = ids.length > 1 ? esc(e.fantasia) + ' · ' : '';
      if (!tipo || tipo === 'atividades') atividadesNeg(id).forEach((a) => {
        const t = TIPOS[a.tipo] || TIPOS.nota, c = a.contatoId ? db.contato(a.contatoId) : null;
        itens.push({ q: a.quando, icon: t.icon, tone: t.tone, title: rot + esc(t.nome) + (a.resultado && a.tipo !== 'nota' ? ' · ' + esc(a.resultado) : ''), meta: esc(pessoa(a.pessoaId).nome) + (c ? ' com ' + esc(c.nome) : '') + ' · ' + fmt.hora(a.quando), text: a.obs ? esc(a.obs) : '' });
      });
      if (!tipo || tipo === 'etapas') movsNeg(id).forEach((m) => {
        itens.push({ q: m.em, icon: m.de == null ? 'plus' : (typeof m.para === 'number' && typeof m.de === 'number' && m.para < m.de ? 'arrow-left' : 'arrow-right'), tone: m.para === 'ganho' ? 'green' : m.para === 'perdido' ? 'red' : 'gold',
          title: rot + (m.de == null ? 'Negócio criado em "1 · Lead novo"' : 'Moveu para "' + esc(etapaNome(m.para)) + '"'), meta: esc(pessoa(m.por).nome) + ' · ' + fmt.hora(m.em) + (m.dias != null && m.de != null ? ' · ficou ' + fmt.plural(m.dias, 'dia') + ' em "' + esc(etapaNome(m.de)) + '"' : '') });
      });
      if (!tipo || tipo === 'automacoes') {
        movsNeg(id).forEach((m) => { const a = AUT_ENTRADA[m.para]; if (a) { const d = util.parse(m.em); d.setMinutes(d.getMinutes() + 1); itens.push({ q: util.isoHora(d), icon: 'zap', tone: 'violet', title: rot + codLink(a[0]) + ' ' + a[1], meta: 'Automação · ' + fmt.hora(d) }); } });
        tarefasNeg(id).filter((t) => t.status === 'concluida' && t.concluidaEm).forEach((t) => itens.push({ q: t.concluidaEm, icon: 'check-square', tone: 'green', title: rot + 'Tarefa concluída: ' + esc(t.titulo), meta: esc(t.filaId ? 'Equipe de cálculo' : pessoa(t.responsavelId).nome) + ' · ' + fmt.hora(t.concluidaEm) }));
      }
    });
    itens.sort((a, b) => b.q.localeCompare(a.q));
    const out = []; let dia = null;
    itens.forEach((it) => {
      const d = it.q.slice(0, 10);
      if (d !== dia) { dia = d; const n = util.diasEntre(App.HOJE, d); out.push({ day: n === 0 ? 'Hoje' : n === -1 ? 'Ontem' : fmt.diaSemana(d).replace('-feira', '') + ', ' + fmt.data(d) }); }
      out.push(it);
    });
    return out;
  }
  function timelineHtml(ids, tipo, limite) {
    let it = eventosTimeline(ids, tipo);
    if (limite && it.length > limite) it = it.slice(0, limite);
    return it.length ? ui.timeline(it) : ui.empty({ small: true, icon: 'history', title: 'Nada registrado ainda' });
  }
  const timelineFiltros = (alvo) => ui.segmented([{ label: 'Tudo', value: '', active: true }, { label: 'Atividades', value: 'atividades' }, { label: 'Etapas', value: 'etapas' }, { label: 'Tarefas e automações', value: 'automacoes' }], { name: 'crm-tl-' + alvo });

  /* ------------------------------------------------------------------ */
  /* DIÁLOGO "MOVER ETAPA" (único caminho para mudar de etapa)            */
  /* ------------------------------------------------------------------ */
  let pendente = null; /* { id, card } quando a mudança veio do kanban */
  const ENTRADA = {
    2: ['Começa a contar o SLA da Qualificação (3 dias)'],
    3: ['Ligação sem sucesso cria nova tentativa em 2 dias úteis (AUT-02)', 'SLA de 5 dias para chegar ao decisor'],
    4: ['Cria o compromisso na agenda compartilhada', 'Programa lembretes 1 dia antes e no dia, às 08:00 (AUT-03)'],
    5: ['Cria a tarefa "Enviar carta proposta e documentos" para o consultor, prazo de 2 dias úteis (AUT-05)'],
    6: ['Documentos pendentes há 5 dias geram follow-up (AUT-06)', 'Documentação completa avisa a equipe de cálculo (AUT-07)'],
    7: ['Cria a tarefa de levantamento para a fila "Equipe de cálculo", prazo de 5 dias úteis (AUT-07)'],
    8: ['Cria a tarefa "Agendar apresentação dos cálculos" para o consultor (AUT-08)', 'Avisa o sócio responsável'],
    9: ['Programa o follow-up de fechamento em 3 dias úteis (AUT-09)'],
    ganho: ['Conclui as tarefas pendentes do negócio', 'Cria o contrato de honorários no Financeiro (fee mensal + êxito). A FIN-01 gera o título do fee todo dia 1º', 'Encaminhar ao Jurídico (AUT-15): desligada até a decisão Q3'],
    perdido: ['Conclui as tarefas abertas do negócio', 'O motivo entra no relatório "Motivos de perda"'],
    descartado: ['Conclui as tarefas abertas do negócio', 'O motivo entra no relatório de descartes']
  };
  const TAREFA_AUTO = { 5: ['AUT-05', 'Enviar carta proposta e documentos', 2], 7: ['AUT-07', 'Levantamento de créditos', 5, 'calculo'], 8: ['AUT-08', 'Agendar apresentação dos cálculos', 2], 9: ['AUT-09', 'Follow-up de fechamento', 3] };

  function requisito(n, de, para) {
    const e = emp(n.empresaId), dec = decisor(n.empresaId), prox1 = util.iso(util.addDiasUteis(App.HOJE, 1));
    const r = { titulo: '', sub: '', cols: 2, body: '', aviso: '', bloqueio: '', botao: { label: 'Mover etapa', variant: 'primary', icon: 'arrow-right' }, toast: 'Negócio movido para "' + etapaNome(para) + '"', toastText: '', alt: null };
    const deNum = typeof de === 'number' ? de : 10;
    const full = (h) => '<div class="lt-span-full">' + h + '</div>';
    if (String(para) === String(de)) { r.bloqueio = ui.callout({ tone: 'info', text: 'O negócio já está nesta etapa. Escolha outra etapa acima.' }); r.botao.disabled = true; return r; }
    if (para === 'perdido') {
      r.titulo = 'Motivo da perda'; r.sub = 'Obrigatório quando a oportunidade é perdida (etapa 10)';
      r.body = ui.field({ label: 'Motivo da perda', type: 'select', name: 'motivo', required: true, placeholder: 'Escolha o motivo', options: optsLista('motivosPerda') }) +
        ui.field({ label: 'Concorrente (se houver)', name: 'concorrente', placeholder: 'Ex.: outra consultoria da região' }) +
        ui.field({ label: 'Observação', type: 'textarea', span: 2, rows: 2, placeholder: 'O que pesou na decisão do cliente?' });
      r.botao = { label: 'Registrar perda', variant: 'danger', icon: 'x-circle' }; r.toast = 'Perda registrada'; r.toastText = esc(e.fantasia) + ' saiu do funil. As tarefas abertas foram concluídas.';
      return r;
    }
    if (para === 'descartado') {
      r.titulo = 'Motivo do descarte'; r.sub = 'Obrigatório quando o lead não se qualifica (etapa 2)';
      r.body = ui.field({ label: 'Motivo do descarte', type: 'select', name: 'motivo', required: true, span: 2, placeholder: 'Escolha o motivo', options: optsLista('motivosDescarte') }) +
        ui.field({ label: 'Observação', type: 'textarea', span: 2, rows: 2, placeholder: 'Ex.: empresa migrou para o Simples em 2025' });
      r.botao = { label: 'Descartar lead', variant: 'danger', icon: 'minus-circle' }; r.toast = 'Lead descartado'; r.toastText = esc(e.fantasia) + ' saiu do funil com o motivo registrado.';
      return r;
    }
    if (para === 'ganho') {
      if (deNum !== 9 && !n.desfecho) { r.titulo = 'Não dá para pular etapas'; r.bloqueio = ui.callout({ tone: 'danger', title: 'O contrato só é registrado em "9 · Negociação e fechamento"', text: 'Avance etapa por etapa: cada uma tem a condição definida na proposta.', actions: ui.btn({ label: 'Mover para ' + (deNum + 1), size: 'sm', icon: 'arrow-right', attrs: { 'data-crm-para': deNum + 1 } }) }); r.botao.disabled = true; return r; }
      const mensal = Math.max(1500, Math.round(n.creditoEstimado * 0.0018 / 100) * 100);
      r.titulo = 'Contrato assinado'; r.sub = 'Condição da etapa 9: anexe o contrato de honorários';
      r.body = ui.field({ label: 'Contrato de honorários assinado', type: 'upload', span: 2, accept: 'PDF assinado · até 25 MB', files: [{ nome: 'contrato-honorarios-' + slug(e.fantasia) + '.pdf', tamanho: '1,1 MB' }] }) +
        ui.field({ label: 'Honorário mensal', type: 'money', name: 'mensal', required: true, value: mensal }) +
        ui.field({ label: 'Honorário de êxito', type: 'percent', name: 'exito', required: true, value: n.exitoPct, dec: 0, hint: 'Sobre o crédito efetivamente recuperado' }) +
        ui.field({ label: 'Início da vigência', type: 'date', name: 'inicio', required: true, value: HOJE }) +
        ui.field({ label: 'Dia de vencimento', type: 'number', name: 'venc', value: 10, suffix: 'do mês' });
      r.botao = { label: 'Marcar como ganho', variant: 'primary', icon: 'check-circle' }; r.toast = 'Negócio ganho'; r.toastText = 'Contrato de honorários criado no Financeiro (fee mensal + êxito). <a href="#fin-honorarios">Ver em Honorários e êxito</a>';
      return r;
    }
    /* volta de etapa ou reabertura */
    if (n.desfecho || para < deNum) {
      r.titulo = (n.desfecho ? 'Reabrir em "' : 'Voltar para "') + etapaNome(para) + '"'; r.sub = 'Voltar de etapa exige justificativa e fica no histórico';
      r.body = ui.field({ label: 'Motivo do retorno', type: 'textarea', name: 'motivoRetorno', required: true, span: 2, rows: 3, placeholder: 'Ex.: a reunião foi cancelada pelo cliente e precisa ser remarcada' });
      r.botao = { label: n.desfecho ? 'Reabrir negócio' : 'Voltar etapa', variant: 'primary', icon: 'arrow-left' }; r.toast = 'Negócio voltou para "' + etapaNome(para) + '"'; r.toastText = 'O SLA da etapa recomeça a contar.';
      return r;
    }
    /* pulo de etapa */
    if (para > deNum + 1) {
      r.titulo = 'Não dá para pular etapas';
      r.bloqueio = ui.callout({ tone: 'danger', title: 'Não dá para pular etapas', text: 'Cada etapa tem uma condição da proposta. Mova primeiro para <b>' + (deNum + 1) + ' · ' + esc(etapaNome(deNum + 1)) + '</b> e registre o que ela pede.', actions: ui.btn({ label: 'Mover para ' + (deNum + 1), size: 'sm', icon: 'arrow-right', attrs: { 'data-crm-para': deNum + 1 } }) });
      r.botao.disabled = true; return r;
    }
    /* avanço de uma etapa: condição da etapa atual (tabela 2.2 da proposta) */
    switch (para) {
      case 2: {
        const itens = [['Razão social', !!e.razao], ['CNPJ validado (dígitos verificadores)', cnpjValido(e.cnpj)], ['Regime tributário', !!e.regime], ['Contato com telefone', db.contatosDa(e.id).length > 0], ['Origem do lead', !!e.origem], ['Consultor responsável', !!n.consultorId]];
        r.titulo = 'Cadastro mínimo'; r.sub = 'Condição da etapa 1 · conferido automaticamente'; r.cols = 0;
        r.body = '<div class="lt-grid lt-grid--2" style="gap:8px">' + itens.map((i) => '<div class="lt-row lt-row--nowrap lt-small" style="gap:8px"><span class="' + (i[1] ? 'lt-success' : 'lt-danger') + '">' + I(i[1] ? 'check-circle' : 'x-circle') + '</span><span>' + i[0] + '</span></div>').join('') + '</div>';
        if (itens.some((i) => !i[1])) { r.bloqueio = ui.callout({ tone: 'danger', title: 'Cadastro incompleto', text: (cnpjValido(e.cnpj) ? '' : 'O CNPJ ' + esc(e.cnpj) + ' não confere nos dígitos verificadores. ') + 'Complete o cadastro da empresa para avançar.', actions: ui.btn({ label: 'Editar empresa', size: 'sm', icon: 'edit', sheet: 'crm-editar-empresa', attrs: { 'data-id': e.id } }) }); r.botao.disabled = true; }
        break;
      }
      case 3: {
        const tese = D.listas.teses.find((t) => n.titulo.toLowerCase().indexOf(t.toLowerCase().slice(0, 18)) >= 0) || D.listas.teses[0];
        r.titulo = 'Resultado da qualificação'; r.sub = 'Condição da etapa 2: qualificado ou descartado (com motivo)';
        r.body = ui.field({ label: 'Resultado', type: 'radio', name: 'crm-qualif', inline: true, span: 2, value: 'qualificado', options: [{ value: 'qualificado', label: 'Qualificado' }, { value: 'descartado', label: 'Descartado' }] }) +
          ui.field({ label: 'Tese principal', type: 'select', name: 'tese', span: 2, value: tese, options: D.listas.teses }) +
          ui.field({ label: 'Observação da qualificação', type: 'textarea', span: 2, rows: 2, placeholder: 'Regime, faturamento, perfil para a tese' });
        r.toastText = 'Agora o objetivo é marcar a reunião com o decisor.';
        break;
      }
      case 4: {
        const ag = atividadesNeg(n.id).filter((a) => a.tipo === 'reuniao' && a.resultado === 'Agendada').sort((a, b) => b.quando.localeCompare(a.quando))[0];
        const ev = D.eventos.find((x) => x.ref && x.ref.hash === 'crm-negocio-' + n.id && x.data >= HOJE);
        r.titulo = 'Reunião com data e hora'; r.sub = 'Condição da etapa 3: registrar o agendamento';
        if (ag) r.aviso = ui.callout({ tone: 'success', text: 'Agendamento registrado em ' + fmt.dataHora(ag.quando) + ' por ' + esc(nome1(ag.pessoaId)) + '. Confira os dados abaixo.' });
        r.body = ui.field({ label: 'Data da reunião', type: 'date', name: 'data', required: true, value: ev ? ev.data : prox1 }) +
          ui.field({ label: 'Horário', type: 'time', name: 'hora', required: true, value: ev ? ev.inicio : '10:00' }) +
          ui.field({ label: 'Formato', type: 'select', name: 'formato', options: ['Na empresa', 'Videochamada', 'Escritório Atlas'], value: ev && /online|vídeo|video/i.test(ev.local) ? 'Videochamada' : 'Na empresa' }) +
          ui.field({ label: 'Com quem', type: 'select', name: 'contato', options: optsContatos(e.id), value: dec && dec.id }) +
          ui.field({ type: 'toggle', label: 'Enviar confirmação por e-mail ao cliente', checked: true, span: 2 });
        r.toastText = 'Compromisso criado na agenda. Lembretes programados (AUT-03).';
        break;
      }
      case 5:
        r.titulo = 'Resultado da reunião'; r.sub = 'Condição da etapa 4: realizada ou não realizada';
        r.body = ui.field({ label: 'Resultado', type: 'radio', name: 'crm-resultado', inline: true, span: 2, value: 'realizada', options: [{ value: 'realizada', label: 'Realizada' }, { value: 'nao', label: 'Não realizada' }] }) +
          ui.field({ label: 'Data da reunião', type: 'date', name: 'data', required: true, value: HOJE }) +
          ui.field({ label: 'Participante do cliente', type: 'select', name: 'contato', options: optsContatos(e.id), value: dec && dec.id }) +
          ui.field({ label: 'Resumo da reunião', type: 'textarea', name: 'resumo', span: 2, rows: 2, placeholder: 'Principais pontos e próximos passos' });
        r.toastText = 'A AUT-05 criou a tarefa "Enviar carta proposta e documentos".';
        r.alt = { valor: 'nao', label: 'Registrar e manter na etapa', icon: 'refresh', toast: 'Reunião não realizada', toastText: 'O negócio ficou em "Reunião agendada". A AUT-04 criou a tarefa "Reagendar reunião" para ' + fmt.dataCurta(prox1) + '.', aviso: 'Reunião não realizada não avança: o negócio fica em "4 · Reunião agendada" e a AUT-04 cria a tarefa "Reagendar reunião" em 1 dia útil.' };
        break;
      case 6: {
        const cats = C.docsDe(n);
        r.titulo = 'Carta proposta enviada'; r.sub = 'A etapa 5 não tem condição; registre o envio e os documentos pedidos';
        r.body = ui.field({ label: 'Enviada em', type: 'date', name: 'data', required: true, value: HOJE }) +
          ui.field({ label: 'Enviada por', type: 'select', options: ['E-mail', 'WhatsApp', 'Em mãos'], value: 'E-mail' }) +
          ui.field({ label: 'Documentos solicitados ao cliente', type: 'checks', span: 2, inline: true, value: cats, options: cats });
        r.toastText = 'A lista de documentos pendentes foi criada. Follow-up automático em 5 dias (AUT-06).';
        break;
      }
      case 7: {
        const docs = docsCliente(n.id), pend = docs.filter((d) => d.status === 'pendente');
        const ultimo = docs.filter((d) => d.recebidoEm).map((d) => d.recebidoEm).sort().pop();
        r.titulo = 'Documentação do cliente recebida'; r.sub = 'Condição da etapa 6'; r.cols = 0;
        r.body = '<div class="lt-stack lt-stack--sm"><div class="lt-grid lt-grid--2" style="gap:6px 16px">' + docs.map((d) => '<div class="lt-row lt-row--nowrap lt-small" style="gap:8px"><span class="' + (d.status === 'recebido' ? 'lt-success' : 'lt-warning') + '">' + I(d.status === 'recebido' ? 'check-circle' : 'clock') + '</span><span class="lt-truncate" style="flex:1">' + esc(d.categoria) + '</span><span class="lt-muted lt-num">' + (d.status === 'recebido' ? fmt.dataCurta(d.recebidoEm) : 'pendente') + '</span></div>').join('') + '</div>' +
          ui.field({ label: 'Equipe de cálculo', type: 'select', name: 'calc', options: [{ value: 'fila', label: 'Fila: Equipe de cálculo' }, { value: 8, label: 'Felipe Moretti' }, { value: 9, label: 'Gustavo Ramos' }], value: 'fila' }) + '</div>';
        if (!docs.length) { r.bloqueio = ui.callout({ tone: 'danger', title: 'Nenhum documento solicitado', text: 'Registre a carta proposta e os documentos pedidos antes.' }); r.botao.disabled = true; }
        else if (pend.length) { r.bloqueio = ui.callout({ tone: 'danger', title: 'Faltam ' + fmt.plural(pend.length, 'documento'), text: esc(pend.map((d) => d.categoria).join(', ')) + '. Registre o recebimento antes de mover.', actions: ui.btn({ label: 'Registrar documento', size: 'sm', icon: 'paperclip', attrs: { 'data-crm-doc': n.id } }) }); r.botao.disabled = true; }
        else r.aviso = ui.callout({ tone: 'success', text: 'Documentação completa desde ' + fmt.data(ultimo) + '.' });
        r.toastText = 'A AUT-07 criou a tarefa de levantamento para a equipe de cálculo.';
        break;
      }
      case 8: {
        const calc = atividadesNeg(n.id).filter((a) => a.tipo === 'calculo').sort((a, b) => b.quando.localeCompare(a.quando))[0];
        r.titulo = 'Conclusão dos cálculos'; r.sub = 'Condição da etapa 7';
        if (calc) r.aviso = ui.callout({ tone: 'success', text: 'Cálculo registrado em ' + fmt.dataHora(calc.quando) + ' por ' + esc(pessoa(calc.pessoaId).nome) + '. ' + esc(calc.obs) });
        r.body = ui.field({ label: 'Crédito apurado', type: 'money', name: 'credito', required: true, value: n.creditoEstimado }) +
          ui.field({ label: 'Período analisado', name: 'periodo', value: 'nov/2021 a out/2026' }) +
          ui.field({ label: 'Responsável pelo cálculo', type: 'select', name: 'resp', value: calc ? calc.pessoaId : 8, options: [{ value: 8, label: 'Felipe Moretti' }, { value: 9, label: 'Gustavo Ramos' }] }) +
          ui.field({ label: 'Concluído em', type: 'date', name: 'concluido', required: true, value: calc ? calc.quando.slice(0, 10) : HOJE });
        r.toastText = 'A AUT-08 criou a tarefa "Agendar apresentação dos cálculos".';
        break;
      }
      case 9:
        r.titulo = 'Resultado da apresentação dos cálculos'; r.sub = 'Condição da etapa 8: realizada ou não realizada';
        r.body = ui.field({ label: 'Resultado', type: 'radio', name: 'crm-resultado', inline: true, span: 2, value: 'realizada', options: [{ value: 'realizada', label: 'Realizada' }, { value: 'nao', label: 'Não realizada' }] }) +
          ui.field({ label: 'Data', type: 'date', name: 'data', required: true, value: HOJE }) +
          ui.field({ label: 'Sócio da Atlas presente', type: 'select', name: 'socio', value: 1, options: [{ value: 1, label: 'Mariana Duarte' }, { value: 2, label: 'Ricardo Fontana' }, { value: 0, label: 'Nenhum' }] }) +
          ui.field({ label: 'Próximos passos combinados', type: 'textarea', span: 2, rows: 2, placeholder: 'Ex.: cliente vai levar ao conselho na próxima semana' });
        r.toastText = 'Follow-up de fechamento programado em 3 dias úteis (AUT-09).';
        r.alt = { valor: 'nao', label: 'Registrar e manter na etapa', icon: 'refresh', toast: 'Apresentação não realizada', toastText: 'O negócio ficou em "Apresentação dos cálculos" com a tarefa "Reagendar apresentação".', aviso: 'Apresentação não realizada não avança: o negócio fica em "8 · Apresentação dos cálculos" com a tarefa "Reagendar apresentação".' };
        break;
    }
    if (r.aviso && r.cols) r.aviso = full(r.aviso);
    return r;
  }

  function aplicarMovimento(n, para, manter) {
    const de = n.desfecho || n.etapa;
    if (manter) {
      const reuniao = de === 4;
      C.atividades.push({ id: novoId(), negocioId: n.id, tipo: reuniao ? 'reuniao' : 'apresentacao', resultado: 'Não realizada', quando: util.isoHora(App.HOJE), pessoaId: App.meId, contatoId: (decisor(n.empresaId) || {}).id, obs: 'Registrado pelo diálogo "Mover etapa".' });
      C.tarefas.push({ id: novoId(), titulo: reuniao ? 'Reagendar reunião' : 'Reagendar apresentação dos cálculos', modulo: 'crm', responsavelId: n.consultorId, prazo: util.iso(util.addDiasUteis(App.HOJE, 1)) + 'T18:00', status: 'aberta', prioridade: 'alta', origem: reuniao ? 'AUT-04' : 'Manual', ref: { label: emp(n.empresaId).fantasia + ' · ' + n.titulo, hash: 'crm-negocio-' + n.id } });
      pendente = null; App.refresh(); return;
    }
    C.movimentos.push({ id: novoId(), negocioId: n.id, de, para, em: util.isoHora(App.HOJE), por: App.meId, dias: util.diasEntre(n.entrouEtapaEm, App.HOJE) });
    if (typeof para === 'number') { delete n.desfecho; delete n.fechadoEm; n.etapa = para; } else { n.desfecho = para; n.etapa = 10; n.fechadoEm = HOJE; abertasNeg(n.id).forEach((t) => { t.status = 'concluida'; t.concluidaEm = util.isoHora(App.HOJE); }); }
    n.entrouEtapaEm = HOJE;
    const ta = TAREFA_AUTO[para];
    if (ta) C.tarefas.push({ id: novoId(), titulo: ta[1] + ': ' + emp(n.empresaId).fantasia, modulo: 'crm', responsavelId: ta[3] ? null : n.consultorId, filaId: ta[3] || null, prazo: util.iso(util.addDiasUteis(App.HOJE, ta[2])) + 'T18:00', status: 'aberta', prioridade: 'media', origem: ta[0], ref: { label: emp(n.empresaId).fantasia + ' · ' + n.titulo, hash: 'crm-negocio-' + n.id } });
    if (pendente && pendente.id === n.id && pendente.card && document.body.contains(pendente.card)) {
      const card = pendente.card; pendente = null;
      ui.kanbanMove(card, typeof para === 'number' ? 'e' + para : para);
      card.replaceWith(toEl(cardNegocio(n)));
    } else { pendente = null; App.refresh(); }
  }

  ui.registerDialog('crm-mover-etapa', (p) => {
    const n = neg(p.id);
    if (!n) return { title: 'Negócio não encontrado', text: 'Abra o diálogo a partir do funil ou da ficha do negócio.', icon: 'alert-circle' };
    if (!p.kanban) pendente = null;
    const de = n.desfecho || n.etapa;
    const para = p.para != null && p.para !== '' ? chave(p.para) : (n.desfecho ? 9 : n.etapa === 9 ? 'ganho' : n.etapa + 1);
    const r = requisito(n, de, para), e = emp(n.empresaId);
    const opts = ABERTAS.map((x) => ({ value: x.num, label: x.num + ' · ' + x.nome })).concat([{ value: 'ganho', label: '10 · Ganho' }, { value: 'perdido', label: '10 · Perdido' }, { value: 'descartado', label: 'Descartado' }]);
    const sel = '<select class="lt-select" data-crm-para-sel style="width:auto;min-width:250px;height:34px" aria-label="Mover para">' + opts.map((o) => '<option value="' + o.value + '"' + (String(o.value) === String(para) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select>';
    const acoes = ENTRADA[para] || [];
    const trans = '<div class="lt-row" style="gap:10px"><span class="lt-small lt-muted">De</span>' + chipDe(de) + '<span class="lt-muted">' + I('arrow-right') + '</span><span class="lt-small lt-muted">para</span>' + sel + '</div>';
    const secReq = r.titulo && (r.body || r.aviso) ? ui.section({ title: r.titulo, sub: r.sub, tone: 'amber', icon: 'filter', cols: r.cols || null, body: (r.aviso || '') + r.body }) : '';
    const secAcoes = acoes.length ? ui.section({ title: 'O que acontece ao mover', tone: 'violet', icon: 'zap', body: '<div class="lt-stack lt-stack--sm">' + acoes.map((a) => '<div class="lt-row lt-row--nowrap lt-row--top lt-small" style="gap:8px"><span class="lt-gold">' + I('zap') + '</span><span>' + esc(a) + '</span></div>').join('') + '</div>' }) : '';
    const body = '<div class="lt-stack">' + trans + (r.bloqueio || '') + '<div class="lt-sections" data-crm-req>' + secReq + secAcoes + '</div><div data-crm-alt></div><div data-crm-erro></div></div>';
    const foot = ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) +
      ui.btn({ label: r.botao.label, variant: r.botao.variant, icon: r.botao.icon, acao: 'mover', loading: 'Movendo…', toast: r.toast, toastText: r.toastText || ('Requisito registrado no histórico de ' + esc(e.fantasia) + '.'), fechar: 'dialog', disabled: !!r.botao.disabled, attrs: { 'data-crm-mover': 1 } });
    return {
      title: 'Mover etapa', text: '<b>' + esc(e.fantasia) + '</b> · ' + esc(n.titulo), icon: 'arrow-right', size: 'lg', body, foot,
      mount: (dlg) => {
        const reabrir = (novo) => ui.openDialog('crm-mover-etapa', { id: n.id, para: novo, kanban: p.kanban ? 1 : '' });
        dlg.querySelector('[data-crm-para-sel]').addEventListener('change', (ev) => reabrir(ev.target.value));
        dlg.addEventListener('click', (ev) => {
          const b = ev.target.closest('[data-crm-para]'); if (b) { reabrir(b.getAttribute('data-crm-para')); return; }
          if (ev.target.closest('[data-crm-doc]')) { ui.closeDialog(); setTimeout(() => ui.openSheet('crm-documento', { id: n.id }), 230); }
        });
        const btn = dlg.querySelector('[data-crm-mover]');
        dlg.addEventListener('change', (ev) => {
          if (ev.target.name === 'crm-qualif' && ev.target.value === 'descartado') { reabrir('descartado'); return; }
          if (ev.target.name === 'crm-resultado' && r.alt) {
            const alt = ev.target.value === r.alt.valor;
            btn.dataset.manter = alt ? '1' : '';
            btn.querySelector('span:last-child').textContent = alt ? r.alt.label : r.botao.label;
            btn.dataset.toast = alt ? r.alt.toast : r.toast; btn.dataset.toastText = alt ? r.alt.toastText : r.toastText;
            dlg.querySelector('[data-crm-alt]').innerHTML = alt ? ui.callout({ tone: 'warning', text: esc(r.alt.aviso) }) : '';
          }
        });
        if (btn) btn.addEventListener('click', (ev) => {
          const semArquivo = para === 'ganho' && !dlg.querySelector('[data-crm-req] .lt-upload__file');
          if (!validar(dlg.querySelector('[data-crm-req]'), dlg.querySelector('[data-crm-erro]'), 'Falta o requisito da etapa. O negócio continua em "' + etapaNome(de) + '".', semArquivo ? ['Contrato assinado (anexo)'] : [])) { ev.stopPropagation(); ev.preventDefault(); }
        });
        dlg.addEventListener('lt:acao', () => aplicarMovimento(n, para, btn && btn.dataset.manter === '1'));
      }
    };
  });

  /* ------------------------------------------------------------------ */
  /* GAVETA "REGISTRAR ATIVIDADE" (ATV-02/03 + automações 2.4)            */
  /* ------------------------------------------------------------------ */
  function automacaoDe(n, tipo, res) {
    const d = (k) => fmt.dataCurta(util.addDiasUteis(App.HOJE, k));
    if (tipo === 'ligacao' && (res === 'Não atendeu' || res === 'Caixa postal')) return { codigo: 'AUT-02', texto: 'Cria a tarefa "Nova tentativa de contato" para ' + d(2) + ' (2 dias úteis). Na 4ª tentativa sem sucesso, avisa o gestor.', tarefa: { titulo: 'Nova tentativa de contato', dias: 2 } };
    if (tipo === 'ligacao' && res === 'Pediu retorno') return { texto: 'Sem automação: agende o retorno abaixo, com a data combinada com o cliente.' };
    if (tipo === 'ligacao' && res === 'Falou com o decisor') return { texto: 'Conta como contato com o decisor no painel. Se a reunião foi marcada, registre também a reunião "Agendada".' };
    if (tipo === 'ligacao') return { texto: 'Entra no painel do consultor como ligação feita.' };
    if (tipo === 'reuniao' && res === 'Agendada') return { codigo: 'AUT-03', texto: 'Cria o compromisso na agenda compartilhada e programa os lembretes 1 dia antes e no dia, às 08:00.' + (n && n.etapa === 3 ? ' Depois, mova o negócio para "4 · Reunião agendada".' : '') };
    if (tipo === 'reuniao' && res === 'Realizada') return { codigo: 'AUT-05', texto: 'Cria a tarefa "Enviar carta proposta e documentos" (2 dias úteis)' + (n && n.etapa === 4 ? ' e move o negócio para "5 · Reunião realizada".' : '.'), tarefa: { titulo: 'Enviar carta proposta e documentos', dias: 2 } };
    if (tipo === 'reuniao' && res === 'Não realizada') return { codigo: 'AUT-04', texto: 'Cria a tarefa "Reagendar reunião" para ' + d(1) + ' (1 dia útil).', tarefa: { titulo: 'Reagendar reunião', dias: 1 } };
    if (tipo === 'reuniao' && res === 'Reagendada') return { codigo: 'AUT-03', texto: 'Atualiza o compromisso na agenda e reprograma os lembretes. Não cria a tarefa de reagendar, porque já existe nova data.' };
    if (tipo === 'comunicacao') return { texto: 'Fica no histórico do negócio. Não dispara automação.' };
    if (tipo === 'documentacao' && res === 'Documento solicitado') return { codigo: 'AUT-06', texto: 'Entra na lista de pendências. Se continuar pendente por 5 dias, a AUT-06 cria o follow-up de documentação.' };
    if (tipo === 'documentacao') return { codigo: 'AUT-07', texto: 'Quando todos os documentos obrigatórios chegarem, cria a tarefa para a equipe de cálculo e move para "7 · Levantamento das oportunidades".' };
    if (tipo === 'apresentacao' && res === 'Realizada') return { codigo: 'AUT-09', texto: 'Programa o follow-up de fechamento para ' + d(3) + ' (3 dias úteis) e move para "9 · Negociação e fechamento".', tarefa: { titulo: 'Follow-up de fechamento', dias: 3 } };
    if (tipo === 'apresentacao') return { texto: 'Sem automação: agende abaixo a nova data da apresentação.' };
    return { texto: 'Registra o acompanhamento. O follow-up vale em qualquer etapa (FUN-07).' };
  }
  function sugestaoTarefa(n, tipo, res) {
    const c = n ? decisor(n.empresaId) : null, nm = c ? c.nome.split(' ')[0] : 'o contato';
    if (res === 'Pediu retorno') return 'Retornar a ligação para ' + nm;
    if (res === 'Falou com o decisor') return 'Agendar a reunião com ' + nm;
    if (res === 'Agendada') return 'Preparar a reunião com ' + nm;
    if (res === 'Reagendada') return 'Confirmar a nova data da reunião com ' + nm;
    if (tipo === 'comunicacao') return 'Confirmar o recebimento com ' + nm;
    if (tipo === 'documentacao') return 'Cobrar os documentos pendentes';
    if (tipo === 'apresentacao') return 'Reagendar a apresentação dos cálculos';
    return 'Follow-up com ' + nm;
  }
  const campoContato = (n) => ui.field({ label: 'Contato', type: 'select', name: 'crm-contato', options: n ? optsContatos(n.empresaId) : [], placeholder: n ? null : 'Escolha o negócio primeiro', value: n ? (decisor(n.empresaId) || {}).id : '', disabled: !n });
  const campoResultado = (tipo, res) => ui.field({ label: 'Resultado', type: 'radio', name: 'crm-res', inline: true, value: res, options: TIPOS[tipo].resultados });
  function extraAtividade(n, tipo, res) {
    if (tipo === 'reuniao' && (res === 'Agendada' || res === 'Reagendada')) {
      return ui.section({ title: res === 'Agendada' ? 'Dados da reunião' : 'Nova data da reunião', tone: 'blue', icon: 'calendar', cols: 2, body: ui.field({ label: 'Data', type: 'date', name: 'reuData', required: true, value: util.iso(util.addDiasUteis(App.HOJE, 2)) }) + ui.field({ label: 'Horário', type: 'time', name: 'reuHora', required: true, value: '10:00' }) + ui.field({ label: 'Formato', type: 'select', options: ['Na empresa', 'Videochamada', 'Escritório Atlas'], value: 'Na empresa' }) + ui.field({ label: 'Local ou link', placeholder: 'Endereço ou link da videochamada' }) });
    }
    if (tipo === 'documentacao') {
      const pend = n ? docsCliente(n.id).filter((d) => d.status === 'pendente').map((d) => d.categoria) : [];
      const opts = pend.length ? pend : C.docsDe(n);
      return ui.section({ title: res === 'Documento recebido' ? 'Quais documentos chegaram' : 'Quais documentos foram pedidos', tone: 'amber', icon: 'paperclip', body: ui.field({ type: 'checks', inline: true, options: opts, value: pend.length ? [pend[0]] : [] }) + (res === 'Documento recebido' ? '<div class="lt-mt-4">' + ui.field({ type: 'upload', label: 'Arquivos (opcional)', multiple: true, accept: 'PDF, ZIP, XML ou XLSX · até 250 MB' }) + '</div>' : '') });
    }
    return '';
  }
  function depoisAtividade(n, tipo, res) {
    const a = automacaoDe(n, tipo, res);
    return ui.section({ title: 'O que o sistema faz depois', tone: 'violet', icon: 'zap', body: '<div class="lt-row lt-row--nowrap lt-row--top" style="gap:10px">' + (a.codigo ? ui.chip(a.codigo, 'violet', { icon: 'zap' }) : ui.chip('Sem automação', 'gray')) + '<span class="lt-small lt-text-2">' + esc(a.texto) + '</span></div>' });
  }
  function proximaAtividade(n, tipo, res) {
    const a = automacaoDe(n, tipo, res);
    const campos = ui.field({ label: 'O que fazer', name: 'proxTitulo', required: true, span: 2, value: sugestaoTarefa(n, tipo, res) }) + ui.field({ label: 'Data', type: 'date', name: 'proxData', required: true, value: util.iso(util.addDiasUteis(App.HOJE, 2)) }) + ui.field({ label: 'Horário', type: 'time', name: 'proxHora', value: '10:00' });
    if (a.tarefa) {
      return ui.section({ title: 'Próxima tarefa', tone: 'amber', icon: 'check-square', sub: 'Todo negócio ativo precisa de uma próxima tarefa (regra 2.5)', body: '<div class="lt-stack">' + ui.callout({ tone: 'gold', icon: 'zap', title: a.codigo + ' cria a próxima tarefa', text: '"' + esc(a.tarefa.titulo) + '" · ' + fmt.dataCurta(util.addDiasUteis(App.HOJE, a.tarefa.dias)) + ' às 18:00 · ' + esc(n ? pessoa(n.consultorId).nome : 'consultor do negócio') }) +
        ui.field({ type: 'toggle', label: 'Agendar outra tarefa também', name: 'crm-outra' }) + '<div class="lt-grid lt-grid--2" data-crm-outra hidden>' + campos + '</div></div>' });
    }
    return ui.section({ title: 'Próxima tarefa', tone: 'amber', icon: 'check-square', sub: 'Obrigatória: todo negócio ativo precisa de uma próxima tarefa (regra 2.5)', cols: 2, body: campos });
  }

  ui.registerSheet('crm-nova-atividade', (p) => {
    const n = p.id ? neg(p.id) : null;
    const tipo0 = p.tipo && TIPOS[p.tipo] ? p.tipo : 'ligacao';
    const res0 = p.resultado || TIPOS[tipo0].resultados[0];
    const tipos = '<div class="lt-grid lt-grid--3" role="radiogroup" aria-label="Tipo de atividade" style="gap:8px">' + TIPOS_FORM.map((k) => { const t = TIPOS[k]; return '<label class="lt-choice-card"><span class="lt-radio"><input type="radio" name="crm-tipo" value="' + k + '"' + (k === tipo0 ? ' checked' : '') + '></span><span style="min-width:0"><span class="lt-row lt-row--nowrap" style="gap:6px;font-weight:600;font-size:13px">' + I(t.icon) + '<span class="lt-truncate">' + esc(t.nome) + '</span></span><span class="lt-hint" style="display:block">' + fmt.plural(t.resultados.length, 'resultado') + '</span></span></label>'; }).join('') + '</div>';
    return {
      eyebrow: 'CRM · Atividade', title: 'Registrar atividade', sub: n ? '<b>' + esc(emp(n.empresaId).fantasia) + '</b> · ' + esc(n.titulo) : 'Tipo, data, resultado e observação (proposta 2.3)',
      body: '<div class="lt-sections" data-crm-atv>' +
        ui.section({ title: 'Negócio e contato', tone: 'gold', icon: 'briefcase', cols: 2, body: ui.field({ label: 'Negócio', type: 'select', name: 'crm-neg', required: true, span: 2, placeholder: 'Escolha o negócio', options: optsNegocios(), value: n ? n.id : '' }) + '<div class="lt-span-2" data-crm-contato>' + campoContato(n) + '</div>' }) +
        ui.section({ title: 'Tipo e resultado', tone: 'blue', icon: 'list-checks', body: '<div class="lt-stack">' + tipos + '<div data-crm-res>' + campoResultado(tipo0, res0) + '</div><div class="lt-grid lt-grid--2">' + ui.field({ label: 'Data', type: 'date', name: 'data', required: true, value: HOJE }) + ui.field({ label: 'Hora', type: 'time', name: 'hora', value: '09:30' }) + '</div></div>' }) +
        '<div data-crm-extra' + (extraAtividade(n, tipo0, res0) ? '' : ' hidden') + '>' + extraAtividade(n, tipo0, res0) + '</div>' +
        ui.section({ title: 'Observação', tone: 'slate', icon: 'file-text', body: ui.field({ type: 'textarea', name: 'obs', rows: 3, placeholder: 'O que foi conversado, combinado ou recebido' }) }) +
        '<div data-crm-depois>' + depoisAtividade(n, tipo0, res0) + '</div>' +
        '<div data-crm-prox>' + proximaAtividade(n, tipo0, res0) + '</div>' +
        '<div data-crm-erro></div></div>',
      foot: ui.sheetFoot({ label: 'Registrar atividade', acao: 'registrar', toast: 'Atividade registrada', info: 'Campos com * são obrigatórios · <code class="lt-code">crm.activity.new</code>' }),
      mount: (el) => {
        const negSel = () => neg(+((el.querySelector('[name="crm-neg"]') || {}).value)) || null;
        const tipo = () => (el.querySelector('[name="crm-tipo"]:checked') || {}).value || 'ligacao';
        const res = () => (el.querySelector('[name="crm-res"]:checked') || {}).value || TIPOS[tipo()].resultados[0];
        const atualizar = () => {
          const nn = negSel(), t = tipo(), r = res(), x = extraAtividade(nn, t, r), box = el.querySelector('[data-crm-extra]');
          box.innerHTML = x; box.hidden = !x;
          el.querySelector('[data-crm-depois]').innerHTML = depoisAtividade(nn, t, r);
          el.querySelector('[data-crm-prox]').innerHTML = proximaAtividade(nn, t, r);
        };
        el.addEventListener('change', (ev) => {
          const nm = ev.target.name;
          if (nm === 'crm-tipo') { el.querySelector('[data-crm-res]').innerHTML = campoResultado(ev.target.value, TIPOS[ev.target.value].resultados[0]); atualizar(); }
          else if (nm === 'crm-res') atualizar();
          else if (nm === 'crm-neg') { el.querySelector('[data-crm-contato]').innerHTML = campoContato(negSel()); atualizar(); }
          else if (nm === 'crm-outra') { const b = el.querySelector('[data-crm-outra]'); if (b) b.hidden = !ev.target.checked; }
        });
        const btn = el.querySelector('.lt-sheet__foot [data-acao]');
        btn.addEventListener('click', (ev) => {
          if (!validar(el.querySelector('[data-crm-atv]'), el.querySelector('[data-crm-erro]'), 'Falta preencher')) { ev.stopPropagation(); ev.preventDefault(); return; }
          const nn = negSel(), a = automacaoDe(nn, tipo(), res());
          btn.dataset.toastText = esc(TIPOS[tipo()].nome + ' · ' + res()) + ' em ' + esc(nn ? emp(nn.empresaId).fantasia : '') + '.' + (a.tarefa ? ' A ' + a.codigo + ' criou a tarefa "' + esc(a.tarefa.titulo) + '".' : a.codigo ? ' ' + a.codigo + ' acionada.' : '');
        });
        el.addEventListener('lt:acao', () => {
          const nn = negSel(); if (!nn) return;
          const t = tipo(), r = res(), a = automacaoDe(nn, t, r), obs = (el.querySelector('[name="obs"]') || {}).value || '';
          const dt = (el.querySelector('[name="data"]') || {}).value || HOJE, hr = (el.querySelector('[name="hora"]') || {}).value || '09:30';
          C.atividades.push({ id: novoId(), negocioId: nn.id, tipo: t, resultado: r, quando: dt + 'T' + hr, pessoaId: App.meId, contatoId: +((el.querySelector('[name="crm-contato"]') || {}).value) || null, obs });
          const ref = { label: emp(nn.empresaId).fantasia + ' · ' + nn.titulo, hash: 'crm-negocio-' + nn.id };
          if (a.tarefa) C.tarefas.push({ id: novoId(), titulo: a.tarefa.titulo, modulo: 'crm', responsavelId: nn.consultorId, prazo: util.iso(util.addDiasUteis(App.HOJE, a.tarefa.dias)) + 'T18:00', status: 'aberta', prioridade: 'media', origem: a.codigo, ref });
          const tt = el.querySelector('[name="proxTitulo"]');
          if (tt && !tt.closest('[hidden]') && tt.value.trim()) C.tarefas.push({ id: novoId(), titulo: tt.value.trim(), modulo: 'crm', responsavelId: nn.consultorId, prazo: (el.querySelector('[name="proxData"]').value || HOJE) + 'T' + ((el.querySelector('[name="proxHora"]') || {}).value || '10:00'), status: 'aberta', prioridade: 'media', origem: 'Manual', ref });
          if (App.current && /^crm-/.test(App.current.screen.hash)) setTimeout(() => App.refresh(), 330);
        });
      }
    };
  });

  /* ------------------------------------------------------------------ */
  /* GAVETA "NOVO LEAD / NEGÓCIO" (CAD-01/02/03/05 + AUT-01)               */
  /* ------------------------------------------------------------------ */
  ui.registerSheet('crm-novo-negocio', (p) => {
    const e0 = p.empresa ? db.empresa(p.empresa) : null;
    const prazo = util.addDias(App.HOJE, 1);
    const cnpjCampo = '<div class="lt-field lt-span-2"><label class="lt-label" for="crm-cnpj">CNPJ<span class="lt-req" aria-hidden="true">*</span></label><div class="lt-row lt-row--nowrap"><input class="lt-input" id="crm-cnpj" name="cnpj" inputmode="numeric" data-mask="cnpj" placeholder="00.000.000/0000-00" required style="max-width:240px">' + ui.btn({ label: 'Validar CNPJ', icon: 'shield-check', attrs: { 'data-crm-validar': 1 } }) + '</div><span class="lt-hint">Confere os dígitos verificadores e se a empresa já está cadastrada</span><div data-crm-cnpj-res class="lt-mt-2"></div></div>';
    const empresaBody = e0
      ? ui.dl([['Empresa', '<b>' + esc(e0.fantasia) + '</b> · ' + esc(e0.razao)], ['CNPJ', '<span class="lt-mono">' + esc(e0.cnpj) + '</span> ' + (cnpjValido(e0.cnpj) ? ui.chip('Validado', 'green', { icon: 'shield-check' }) : ui.chip('Dígito verificador inválido', 'red', { icon: 'alert-circle' }))], ['Regime', regimeChip(e0.regime)], ['Consultor', esc(pessoa(e0.consultorId).nome)]])
      : '<div class="lt-stack">' + ui.field({ type: 'radio', name: 'crm-modo', inline: true, value: 'nova', options: [{ value: 'nova', label: 'Empresa nova' }, { value: 'existente', label: 'Empresa já cadastrada' }] }) +
        '<div class="lt-grid lt-grid--2" data-crm-nova>' + ui.field({ label: 'Razão social', name: 'razao', required: true, span: 2, placeholder: 'Como está no cartão CNPJ' }) + cnpjCampo +
        ui.field({ label: 'Nome fantasia', name: 'fantasia' }) + ui.field({ label: 'Segmento', type: 'select', name: 'segmento', placeholder: 'Escolha', options: optsLista('segmentos') }) +
        ui.field({ label: 'Regime tributário', type: 'select', name: 'regime', required: true, placeholder: 'Escolha', options: optsLista('regimes') }) + ui.field({ label: 'Faturamento anual estimado', type: 'money', name: 'faturamento' }) +
        ui.field({ label: 'Cidade', name: 'cidade', placeholder: 'Ex.: Campinas' }) + ui.field({ label: 'Funcionários', type: 'number', name: 'func', placeholder: 'Ex.: 120' }) + '</div>' +
        '<div data-crm-existente hidden>' + ui.field({ label: 'Empresa', type: 'select', name: 'empresaId', required: true, placeholder: 'Buscar na lista', options: D.empresas.map((x) => ({ value: x.id, label: x.fantasia + ' · ' + x.cnpj })) }) + '</div></div>';
    return {
      eyebrow: e0 ? 'CRM · Novo negócio' : 'CRM · Novo lead', title: e0 ? 'Novo negócio' : 'Novo lead', sub: e0 ? 'Nova oportunidade para uma empresa já cadastrada.' : 'Cadastro mínimo exigido na etapa 1: razão social, CNPJ válido, regime, contato e origem.', size: 'lg',
      body: '<div class="lt-sections" data-crm-lead>' +
        ui.section({ title: 'Empresa', tone: 'gold', icon: 'building', sub: e0 ? null : 'CNPJ com validação e checagem de duplicidade', body: empresaBody }) +
        (e0 ? '' : ui.section({ title: 'Contato principal', tone: 'blue', icon: 'user', cols: 2, body: ui.field({ label: 'Nome', name: 'contato', required: true }) + ui.field({ label: 'Cargo', name: 'cargo', placeholder: 'Ex.: Diretor financeiro' }) + ui.field({ label: 'Telefone', type: 'phone', name: 'tel', required: true }) + ui.field({ label: 'WhatsApp', type: 'phone', name: 'whats' }) + ui.field({ label: 'E-mail', type: 'email', name: 'email', span: 2, placeholder: 'nome@empresa.com.br' }) + ui.field({ type: 'toggle', label: 'É o decisor (aprova a contratação)', checked: true, span: 2 }) })) +
        ui.section({ title: 'Oportunidade', tone: 'green', icon: 'dollar', cols: 2, body: ui.field({ label: 'Tese principal', type: 'select', name: 'tese', required: true, span: 2, placeholder: 'Escolha a tese', options: D.listas.teses }) + ui.field({ label: 'Crédito estimado', type: 'money', name: 'credito', hint: 'Pode ficar em branco até o levantamento' }) + ui.field({ label: 'Honorário de êxito', type: 'percent', name: 'exito', value: 20, dec: 0 }) + ui.field({ label: 'Origem do lead', type: 'select', name: 'origem', required: true, placeholder: 'Escolha', options: optsLista('origens'), value: e0 ? e0.origem : '' }) + ui.field({ label: 'Consultor responsável', type: 'select', name: 'consultor', required: true, placeholder: 'Escolha', options: optsConsultor(), value: e0 ? e0.consultorId : '' }) }) +
        ui.section({ title: 'Primeira tarefa (automática)', tone: 'amber', icon: 'zap', body: ui.callout({ tone: 'gold', icon: 'zap', title: 'A AUT-01 cria a tarefa "Qualificar lead"', text: 'Para o consultor responsável, com prazo de 24 horas (até ' + fmt.dataHora(prazo) + '). O negócio entra em "1 · Lead novo".' }) }) +
        '<div data-crm-erro></div></div>',
      foot: ui.sheetFoot({ label: e0 ? 'Salvar negócio' : 'Salvar lead', toast: e0 ? 'Negócio criado' : 'Lead cadastrado', toastText: 'Entrou em "1 · Lead novo". A AUT-01 criou a tarefa "Qualificar lead".', info: 'Campos com * são obrigatórios · <code class="lt-code">crm.deal.new</code>' }),
      mount: (el) => {
        const modo = () => (el.querySelector('[name="crm-modo"]:checked') || {}).value || 'nova';
        el.addEventListener('change', (ev) => {
          if (ev.target.name !== 'crm-modo') return;
          el.querySelector('[data-crm-nova]').hidden = modo() !== 'nova';
          el.querySelector('[data-crm-existente]').hidden = modo() !== 'existente';
        });
        const resBox = el.querySelector('[data-crm-cnpj-res]'), inp = el.querySelector('#crm-cnpj');
        const checar = (mostrarOk) => {
          if (!inp) return true;
          const f = inp.closest('.lt-field'); f.classList.remove('is-invalid');
          const v = inp.value, dup = empresaPorCnpj(v);
          if (!v.replace(/\D/g, '')) { resBox.innerHTML = ''; return false; }
          if (dup) { resBox.innerHTML = ui.callout({ tone: 'warning', title: 'Empresa já cadastrada', text: '<b>' + esc(dup.fantasia) + '</b> · ' + esc(dup.razao) + ' · consultor ' + esc(pessoa(dup.consultorId).nome) + '. Para não duplicar, o negócio novo entra na ficha existente (CAD-05).', actions: '<a class="lt-btn lt-btn--sm" href="#crm-empresa-' + dup.id + '">Abrir ficha</a>' + ui.btn({ label: 'Usar esta empresa', size: 'sm', variant: 'primary', attrs: { 'data-crm-usar': dup.id } }) }); return false; }
          if (!cnpjValido(v)) { f.classList.add('is-invalid'); resBox.innerHTML = '<span class="lt-error-text">' + I('alert-circle') + 'CNPJ inválido: confira os dígitos verificadores.</span>'; return false; }
          if (mostrarOk) resBox.innerHTML = ui.callout({ tone: 'success', title: 'CNPJ válido · situação ATIVA na Receita', text: 'Consulta pública: CNAE 2222-6/00 · aberta em 14/03/2009 · porte Demais. Confira a razão social acima.' });
          return true;
        };
        el.addEventListener('click', (ev) => {
          const b = ev.target.closest('[data-crm-validar]');
          if (b) { ui.loading(b, true, 'Validando…'); setTimeout(() => { ui.loading(b, false); if (!inp.value.replace(/\D/g, '')) { inp.closest('.lt-field').classList.add('is-invalid'); resBox.innerHTML = '<span class="lt-error-text">' + I('alert-circle') + 'Informe o CNPJ.</span>'; } else checar(true); }, 900); return; }
          const u = ev.target.closest('[data-crm-usar]');
          if (u) { const r = el.querySelector('[name="crm-modo"][value="existente"]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); el.querySelector('[name="empresaId"]').value = u.getAttribute('data-crm-usar'); resBox.innerHTML = ''; inp.value = ''; }
        });
        if (inp) inp.addEventListener('input', () => { if (inp.value.replace(/\D/g, '').length === 14) checar(true); else resBox.innerHTML = ''; });
        const btn = el.querySelector('.lt-sheet__foot [data-acao]');
        btn.addEventListener('click', (ev) => {
          const extra = [];
          if (!e0 && modo() === 'nova' && inp.value.replace(/\D/g, '') && !checar(false)) extra.push(empresaPorCnpj(inp.value) ? 'CNPJ já cadastrado' : 'CNPJ válido');
          if (!validar(el.querySelector('[data-crm-lead]'), el.querySelector('[data-crm-erro]'), 'Cadastro mínimo incompleto', extra)) { ev.stopPropagation(); ev.preventDefault(); }
        });
      }
    };
  });

  /* ------------------------------------------------------------------ */
  /* DIÁLOGO "IMPORTAR PLANILHA" (CAD-06/12)                              */
  /* ------------------------------------------------------------------ */
  /* Conferência da linha: duplicidade pelo CNPJ, dígitos verificadores e regime (Simples entra como descartado) */
  function conferirLinha(l) {
    const dup = empresaPorCnpj(l.cnpj);
    if (dup) return Object.assign({}, l, { status: 'duplicado', msg: 'CNPJ já cadastrado (' + dup.fantasia + '): a linha vira atividade na ficha existente, sem duplicar.' });
    if (!cnpjValido(l.cnpj)) return Object.assign({}, l, { status: 'invalido', msg: 'CNPJ inválido (dígito verificador). Corrija na planilha ou cadastre pela tela.' });
    if (l.regime === 'Simples Nacional') return Object.assign({}, l, { status: 'simples', msg: 'Simples Nacional: entra como descartado (motivo automático).' });
    return Object.assign({}, l, { status: 'ok', msg: '' });
  }
  ui.registerDialog('crm-importar', () => {
    const imp = C.importacao, L = imp.linhas.map(conferirLinha);
    const cont = (s) => L.filter((l) => l.status === s).length;
    const invalidas = L.map((l, i) => (l.status === 'invalido' ? i + 2 : null)).filter((x) => x != null);
    const st = { ok: ['Pronta', 'green', 'check-circle'], duplicado: ['Já cadastrada', 'amber', 'copy'], invalido: ['CNPJ inválido', 'red', 'x-circle'], simples: ['Simples Nacional', 'gray', 'minus-circle'] };
    const tabela = '<div class="lt-table-wrap" style="max-height:250px;overflow:auto"><table class="lt-table lt-table--compact"><thead><tr><th>Linha</th><th>Empresa</th><th>CNPJ</th><th>Conferência</th></tr></thead><tbody>' +
      L.map((l, i) => '<tr><td class="lt-num lt-muted">' + (i + 2) + '</td><td style="min-width:230px"><span class="lt-table__primary">' + esc(l.razao) + '</span><span class="lt-table__secondary">' + esc(l.contato + ' · ' + l.regime + ' · ' + l.segmento) + '</span></td><td class="lt-mono" style="white-space:nowrap">' + esc(l.cnpj) + '</td><td>' + ui.chip(st[l.status][0], st[l.status][1], { icon: st[l.status][2] }) + (l.msg ? '<span class="lt-table__secondary" style="max-width:200px;white-space:normal">' + esc(l.msg) + '</span>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
    return {
      title: 'Importar leads de planilha', text: 'Use a planilha modelo (.xlsx ou .csv). O sistema confere CNPJ, duplicidade e regime antes de importar.', icon: 'upload', size: 'lg',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Arquivo', tone: 'gold', icon: 'spreadsheet', cols: 2, aside: ui.btn({ label: 'Baixar modelo', icon: 'download', size: 'xs', variant: 'ghost', acao: 'gerar', toast: 'Modelo baixado', toastText: 'modelo-importacao-leads.xlsx' }), body: '<div class="lt-upload__file lt-span-2">' + I('spreadsheet') + '<span class="lt-truncate" style="flex:1"><b>' + esc(imp.arquivo) + '</b> · ' + esc(imp.tamanho) + ' · ' + L.length + ' linhas · colunas conferidas</span><label class="lt-btn lt-btn--ghost lt-btn--xs" style="cursor:pointer">' + I('upload') + '<span>Trocar arquivo</span><input type="file" class="lt-sr" accept=".xlsx,.csv"></label></div>' + ui.field({ label: 'Origem dos leads', type: 'select', options: optsLista('origens'), value: imp.origem }) + ui.field({ label: 'Consultor responsável', type: 'select', options: optsConsultor(), value: imp.consultorPadrao }) }) +
        ui.section({ title: 'Conferência das ' + L.length + ' linhas', tone: 'blue', icon: 'list-checks', sub: fmt.plural(cont('ok'), 'pronta') + ' · ' + fmt.plural(cont('duplicado'), 'já cadastrada', 'já cadastradas') + ' · ' + cont('invalido') + ' com erro · ' + fmt.plural(cont('simples'), 'descartada'), body: tabela }) +
        (invalidas.length ? ui.callout({ tone: 'danger', title: fmt.plural(invalidas.length, 'linha com erro fica', 'linhas com erro ficam') + ' de fora', text: 'Corrija o CNPJ ' + (invalidas.length === 1 ? 'da linha ' : 'das linhas ') + invalidas.join(', ') + ' e envie de novo, ou cadastre pela tela.' }) : '') + '</div>',
      foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Importar ' + fmt.plural(cont('ok'), 'lead'), variant: 'primary', icon: 'upload', acao: 'importar', toast: 'Importação concluída', toastText: fmt.plural(cont('ok'), 'lead criado', 'leads criados') + ' em "1 · Lead novo" com a tarefa "Qualificar lead" (AUT-01).' + (cont('duplicado') ? ' ' + fmt.plural(cont('duplicado'), 'linha virou atividade', 'linhas viraram atividade') + ' na ficha existente.' : ''), fechar: 'dialog' })
    };
  });

  /* ------------------------------------------------------------------ */
  /* GAVETAS: contato, novo contato, editar empresa, documento             */
  /* ------------------------------------------------------------------ */
  ui.registerSheet('crm-contato', (p) => {
    const c = db.contato(p.id); if (!c) return { title: 'Contato não encontrado' };
    const e = emp(c.empresaId), n = principal(e.id);
    const atv = C.atividades.concat(C.geradas).filter((a) => a.contatoId === c.id).sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 5);
    const linha = (ic, txt, copiar) => '<div class="lt-row lt-row--between lt-row--nowrap" style="padding:6px 0;border-bottom:1px solid var(--divider)"><span class="lt-row lt-row--nowrap" style="gap:8px"><span class="lt-muted">' + I(ic) + '</span><span class="lt-num">' + esc(txt) + '</span></span>' + ui.btn({ icon: 'copy', variant: 'ghost', size: 'xs', tip: 'Copiar', attrs: { 'data-copy': copiar || txt, 'data-copy-label': 'Copiado' } }) + '</div>';
    return {
      eyebrow: c.decisor ? 'Decisor' : 'Não decisor', title: c.nome, sub: esc(c.cargo) + ' · <a href="#crm-empresa-' + e.id + '">' + esc(e.fantasia) + '</a>', size: 'sm',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Como falar', tone: 'blue', icon: 'phone', body: linha('phone', c.telefone) + linha('message', c.whatsapp + ' (WhatsApp)', c.whatsapp) + linha('mail', c.email) }) +
        ui.section({ title: 'Papel na decisão', tone: 'violet', icon: 'users', body: (c.decisor ? ui.chip('Decisor', 'gold', { icon: 'star' }) : ui.chip('Não decisor', 'gray')) + '<p class="lt-small lt-text-2 lt-mt-2">' + (c.decisor ? 'Aprova a contratação. A etapa 3 do funil exige contato com o decisor.' : 'Influencia ou operacionaliza. Para avançar, fale com o decisor da empresa.') + '</p>' }) +
        ui.section({ title: 'Dado protegido', tone: 'slate', icon: 'lock', sub: 'Só sócio e gestor comercial veem o CPF completo', body: '<div class="lt-row lt-row--between"><span>CPF <b class="lt-num" data-crm-cpf>' + esc(fmt.cpfMascarado(C.cpf[c.id])) + '</b></span>' + ui.btn({ label: 'Mostrar CPF', icon: 'eye', size: 'sm', acao: 'verificar', loading: 'Verificando…', toast: 'CPF exibido', toastText: 'O acesso ficou registrado na auditoria (crm.contact.cpf).', attrs: { 'data-crm-revelar': c.id } }) + '</div>' }) +
        ui.section({ title: 'Atividades com este contato', tone: 'gold', icon: 'history', body: atv.length ? ui.timeline(atv.map((a) => { const t = TIPOS[a.tipo] || TIPOS.nota; return { icon: t.icon, tone: t.tone, title: esc(t.nome + ' · ' + a.resultado), meta: fmt.dataHora(a.quando) + ' · ' + esc(nome1(a.pessoaId)), text: esc(a.obs) }; })) : ui.empty({ small: true, icon: 'history', title: 'Nenhuma atividade com este contato' }) }) + '</div>',
      foot: ui.btn({ label: 'Editar contato', icon: 'edit', sheet: 'crm-novo-contato', attrs: { 'data-id': c.id } }) + (n ? ui.btn({ label: 'Registrar atividade', variant: 'primary', icon: 'plus', sheet: 'crm-nova-atividade', attrs: { 'data-id': n.id } }) : ''),
      mount: (el) => el.addEventListener('lt:acao', (ev) => { if (ev.target.closest('[data-crm-revelar]')) el.querySelector('[data-crm-cpf]').textContent = fmt.cpf(C.cpf[c.id]); })
    };
  });

  ui.registerSheet('crm-novo-contato', (p) => {
    const c = p.id ? db.contato(p.id) : null, eid = c ? c.empresaId : p.empresa;
    return {
      eyebrow: 'CRM · Contatos', title: c ? 'Editar contato' : 'Novo contato', sub: 'Nome, cargo, telefone, WhatsApp, e-mail e papel na decisão (CAD-02).',
      body: '<div class="lt-sections" data-crm-ct>' +
        ui.section({ title: 'Empresa', tone: 'gold', icon: 'building', body: ui.field({ label: 'Empresa', type: 'select', required: true, placeholder: 'Escolha a empresa', options: D.empresas.map((x) => ({ value: x.id, label: x.fantasia + ' · ' + x.cnpj })), value: eid || '' }) }) +
        ui.section({ title: 'Contato', tone: 'blue', icon: 'user', cols: 2, body: ui.field({ label: 'Nome', required: true, value: c ? c.nome : '' }) + ui.field({ label: 'Cargo', value: c ? c.cargo : '' }) + ui.field({ label: 'Telefone', type: 'phone', required: true, value: c ? c.telefone : '' }) + ui.field({ label: 'WhatsApp', type: 'phone', value: c ? c.whatsapp : '' }) + ui.field({ label: 'E-mail', type: 'email', span: 2, value: c ? c.email : '' }) }) +
        ui.section({ title: 'Papel na decisão', tone: 'violet', icon: 'users', body: ui.field({ type: 'radio', name: 'crm-papel', inline: true, value: c && !c.decisor ? 'nao' : 'decisor', options: [{ value: 'decisor', label: 'Decisor' }, { value: 'nao', label: 'Não decisor' }] }) + '<p class="lt-hint lt-mt-2">O decisor aprova a contratação. A etapa 3 do funil exige contato com ele.</p>' }) + '<div data-crm-erro></div></div>',
      foot: ui.sheetFoot({ label: 'Salvar contato', toast: 'Contato salvo', info: 'Campos com * são obrigatórios' }),
      mount: (el) => el.querySelector('.lt-sheet__foot [data-acao]').addEventListener('click', (ev) => { if (!validar(el.querySelector('[data-crm-ct]'), el.querySelector('[data-crm-erro]'))) { ev.stopPropagation(); ev.preventDefault(); } })
    };
  });

  ui.registerSheet('crm-editar-empresa', (p) => {
    const e = db.empresa(p.id); if (!e) return { title: 'Empresa não encontrada' };
    return {
      eyebrow: 'Empresa #' + e.id, title: 'Editar empresa', sub: esc(e.razao), size: 'lg',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'building', cols: 2, body: ui.field({ label: 'Razão social', span: 2, required: true, value: e.razao }) + ui.field({ label: 'Nome fantasia', value: e.fantasia }) + ui.field({ label: 'CNPJ', type: 'cnpj', value: e.cnpj, readonly: !!cnpjValido(e.cnpj), error: cnpjValido(e.cnpj) ? null : 'Dígitos verificadores não conferem. Corrija pelo cartão CNPJ.', hint: cnpjValido(e.cnpj) ? 'Validado no cadastro · não pode ser alterado' : null }) + ui.field({ label: 'Cidade', value: e.cidade }) + ui.field({ label: 'UF', value: e.uf }) }) +
        ui.section({ title: 'Perfil tributário', tone: 'violet', icon: 'percent', cols: 2, body: ui.field({ label: 'Regime tributário', type: 'select', options: optsLista('regimes'), value: e.regime, required: true }) + ui.field({ label: 'Segmento', type: 'select', options: optsLista('segmentos'), value: e.segmento }) + ui.field({ label: 'Faturamento anual estimado', type: 'money', value: e.faturamento }) + ui.field({ label: 'Funcionários', type: 'number', value: e.funcionarios }) }) +
        ui.section({ title: 'Comercial', tone: 'blue', icon: 'briefcase', cols: 2, body: ui.field({ label: 'Origem do lead', type: 'select', options: optsLista('origens'), value: e.origem }) + ui.field({ label: 'Consultor responsável', type: 'select', options: optsConsultor(), value: e.consultorId }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar empresa', toast: 'Empresa atualizada', toastText: 'A alteração ficou na auditoria.' })
    };
  });

  ui.registerSheet('crm-documento', (p) => {
    const n = neg(p.id); if (!n) return { title: 'Negócio não encontrado' };
    const docs = docsCliente(n.id), pend = docs.filter((d) => d.status === 'pendente');
    const cats = pend.map((d) => d.categoria).concat(D.listas.categoriasDocumento.filter((c) => !pend.some((d) => d.categoria === c)));
    return {
      eyebrow: 'Documentação · etapa 6', title: 'Registrar documento recebido', sub: '<b>' + esc(emp(n.empresaId).fantasia) + '</b> · ' + esc(n.titulo),
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Documento', tone: 'amber', icon: 'paperclip', cols: 2, body: ui.field({ label: 'Categoria', type: 'select', name: 'cat', required: true, span: 2, options: cats, value: p.cat || cats[0] }) + ui.field({ label: 'Recebido em', type: 'date', value: HOJE }) + ui.field({ label: 'Enviado por', type: 'select', options: optsContatos(n.empresaId), value: (decisor(n.empresaId) || {}).id }) + ui.field({ label: 'Arquivo', type: 'upload', span: 2, accept: 'PDF, ZIP, XML ou XLSX · até 250 MB' }) }) +
        (pend.length === 1 ? ui.callout({ tone: 'gold', icon: 'zap', title: 'É o último documento pendente', text: 'Ao registrar, a AUT-07 cria a tarefa para a equipe de cálculo e o negócio pode ir para "7 · Levantamento das oportunidades".' }) : pend.length ? ui.callout({ tone: 'info', text: 'Pendentes: ' + esc(pend.map((d) => d.categoria).join(', ')) + '.' }) : '') + '</div>',
      foot: ui.sheetFoot({ label: 'Registrar documento', acao: 'registrar', toast: 'Documento registrado', toastText: 'Entrou na lista de documentos do negócio.' }),
      mount: (el) => el.addEventListener('lt:acao', () => {
        const cat = el.querySelector('[name="cat"]').value, d = docsNeg(n.id).find((x) => x.categoria === cat && x.status === 'pendente');
        if (d) { d.status = 'recebido'; d.recebidoEm = HOJE; d.arquivo = slug(cat) + '.pdf'; d.tamanhoMb = 1.2; }
        C.atividades.push({ id: novoId(), negocioId: n.id, tipo: 'documentacao', resultado: 'Documento recebido', quando: util.isoHora(App.HOJE), pessoaId: App.meId, contatoId: (decisor(n.empresaId) || {}).id, obs: cat + '.' });
        if (App.current && /^crm-/.test(App.current.screen.hash)) setTimeout(() => App.refresh(), 330);
      })
    };
  });

  /* ================================================================== */
  /* TELAS                                                              */
  /* ================================================================== */

  /* ---------- Funil (kanban) ---------- */
  const padraoFunil = () => ({ busca: '', consultor: '', regime: '', origem: '', segmento: '', chip: 'todos' });
  const stFunil = () => App.state.crmFunil || (App.state.crmFunil = padraoFunil());
  function quadro() {
    const s = stFunil();
    const list = filtraNegocios(D.negocios, s).filter((n) => (s.chip === 'parados' ? parado(n) : s.chip === 'semtarefa' ? semProxima(n) : true));
    const ordem = (a, b) => (parado(b) - parado(a)) || (semProxima(b) - semProxima(a)) || (diasEtapa(b) - diasEtapa(a));
    const cols = ABERTAS.map((e) => { const it = list.filter((n) => aberto(n) && n.etapa === e.num).sort(ordem); return { id: 'e' + e.num, num: e.num, titulo: e.nome, cor: e.cor, itens: it, total: util.soma(it, (n) => n.creditoEstimado) }; });
    ['ganho', 'perdido', 'descartado'].forEach((k) => { const it = list.filter((n) => n.desfecho === k); cols.push({ id: k, num: k === 'descartado' ? null : 10, titulo: DESF[k].nome, cor: DESF[k].cor, itens: it, desfecho: true, total: util.soma(it, (n) => n.creditoEstimado) }); });
    return ui.kanban({ id: 'crm-kanban', colunas: cols, card: cardNegocio });
  }
  const visao = (atual) => ui.segmented([{ label: 'Kanban', value: 'crm-funil', icon: 'kanban', active: atual === 'crm-funil' }, { label: 'Lista', value: 'crm-negocios', icon: 'list', active: atual === 'crm-negocios' }], { name: 'crm-visao' });
  App.screen({
    id: 'crm.deal.kanban', hash: 'crm-funil', module: 'crm', title: 'Funil de vendas', nav: true, navGroup: 'crm', navLabel: 'Funil', navOrder: 1,
    render: () => {
      const s = stFunil(), ab = abertos().filter(meuNeg), par = ab.filter(parado).length, sem = ab.filter(semProxima).length;
      return ui.pageHeader({
        breadcrumb: crumbsCrm('Funil'), title: 'Funil de vendas', sub: 'Arraste o cartão para mudar de etapa; o diálogo pede o requisito.',
        meta: ui.chip(fmt.plural(ab.length, 'negócio') + ' em andamento', 'blue') + ui.chip(fmt.moedaCurta(util.soma(ab, (n) => n.creditoEstimado)) + ' em créditos estimados', 'green') + ui.chip(fmt.plural(par, 'parado'), 'red', { icon: 'hourglass' }) + ui.chip(sem + ' sem próxima tarefa', 'amber', { icon: 'alert-circle' }),
        actions: btnExportar('funil-comercial-' + HOJE + '.xlsx') + ui.btn({ label: 'Novo negócio', variant: 'primary', icon: 'plus', sheet: 'crm-novo-negocio' })
      }) +
        ui.filters({ busca: 'Buscar empresa, CNPJ, tese', selects: [{ label: 'Consultor', name: 'consultor', options: optsConsultor(), value: s.consultor }, { label: 'Regime', name: 'regime', options: optsLista('regimes'), value: s.regime }, { label: 'Origem', name: 'origem', options: optsLista('origens'), value: s.origem }],
          chipGroup: 'single', chips: [{ label: 'Todos', value: 'todos', active: s.chip === 'todos' }, { label: 'Parados', value: 'parados', tone: 'red', count: par, active: s.chip === 'parados' }, { label: 'Sem próxima tarefa', value: 'semtarefa', tone: 'amber', count: sem, active: s.chip === 'semtarefa' }], extra: visao('crm-funil') }) +
        '<div class="m-crm-board" data-crm-board>' + quadro() + '</div>' +
        '<div class="lt-row lt-small lt-muted" style="gap:16px"><span class="lt-row" style="gap:6px"><span class="lt-dot" style="background:var(--danger)"></span>Faixa vermelha: parado acima do SLA da etapa (AUT-10)</span><span class="lt-row" style="gap:6px"><span class="lt-dot" style="background:var(--warning)"></span>Faixa âmbar: sem próxima tarefa (AUT-11)</span><span class="lt-row" style="gap:6px">' + I('zap') + 'tarefa criada por automação</span></div>';
    },
    mount: (root) => {
      root = escopo(root);
      ligarFiltros(root, stFunil(), padraoFunil, () => { root.querySelector('[data-crm-board]').innerHTML = quadro(); });
      root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'crm-visao') App.go(e.detail.value); });
      root.addEventListener('lt:kanban-move', (e) => {
        e.preventDefault();
        const id = +e.detail.cardId; pendente = { id, card: e.detail.card };
        ui.openDialog('crm-mover-etapa', { id, para: colChave(e.detail.para), kanban: 1 });
      });
    }
  });

  /* ---------- Negócios (lista) ---------- */
  const padraoNeg = () => ({ busca: '', consultor: '', etapa: '', origem: '', segmento: '', regime: '', chip: 'andamento' });
  const stNeg = () => App.state.crmNeg || (App.state.crmNeg = padraoNeg());
  function tabelaNegocios() {
    const s = stNeg();
    const rows = filtraNegocios(D.negocios, s).filter((n) => ({ andamento: aberto(n), parados: parado(n), semtarefa: semProxima(n), ganhos: n.desfecho === 'ganho', perdidos: n.desfecho === 'perdido' || n.desfecho === 'descartado', todos: true }[s.chip || 'andamento'])).sort((a, b) => (a.desfecho ? 1 : 0) - (b.desfecho ? 1 : 0) || (b.etapa - a.etapa) || (diasEtapa(b) - diasEtapa(a)));
    return ui.table({
      rows, pageSize: 10, selectable: true, rowHref: (n) => '#crm-negocio-' + n.id, rowClass: (n) => (parado(n) ? 'm-crm-late' : ''),
      bulk: ui.btn({ label: 'Atribuir consultor', size: 'xs', icon: 'user', acao: 'salvar', toast: 'Consultor atribuído', toastText: 'Os negócios selecionados mudaram de responsável. As tarefas abertas foram junto.' }) + ui.btn({ label: 'Exportar seleção', size: 'xs', icon: 'download', acao: 'exportar', toast: 'Planilha gerada' }),
      empty: { icon: 'briefcase', title: 'Nenhum negócio com esses filtros', text: 'Mude os filtros ou cadastre um novo negócio.', action: limparBtn },
      columns: [
        { label: 'Negócio', key: 'empresaId', sortable: true, value: (n) => emp(n.empresaId).fantasia, render: (n) => '<span class="lt-table__primary">' + esc(emp(n.empresaId).fantasia) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:250px" title="' + esc(n.titulo) + '">' + esc(n.titulo) + '</span>' },
        { label: 'Etapa', key: 'etapa', sortable: true, value: (n) => (n.desfecho ? 20 : n.etapa), render: (n) => etapaCurta(n) },
        { label: 'Na etapa', key: 'dias', sortable: true, value: (n) => (aberto(n) ? diasEtapa(n) : -1), render: (n) => (aberto(n) ? diasHtml(n) + '<span class="lt-table__secondary">SLA ' + (etapaDe(n).sla || '—') + ' d</span>' : '<span class="lt-muted">—</span>') },
        { label: 'Crédito estimado', key: 'creditoEstimado', sortable: true, align: 'right', render: (n) => '<span class="lt-num lt-strong">' + fmt.moedaCurta(n.creditoEstimado) + '</span><span class="lt-table__secondary">' + fmt.pct(n.exitoPct) + ' de êxito</span>' },
        { label: 'Consultor', key: 'consultorId', sortable: true, value: (n) => pessoa(n.consultorId).nome, render: (n) => ui.person(n.consultorId) },
        { label: 'Próxima tarefa', key: 'prox', render: (n) => '<div style="max-width:210px">' + proxHtml(n) + '</div>' }
      ],
      foot: ['<b>' + fmt.plural(rows.length, 'negócio') + '</b>', '', '', '<b class="lt-num">' + fmt.moedaCurta(util.soma(rows, (n) => n.creditoEstimado)) + '</b>', '', ''],
      rowActions: (n) => (aberto(n) ? ui.btn({ icon: 'arrow-right', variant: 'ghost', size: 'xs', tip: 'Mover etapa', dialog: 'crm-mover-etapa', attrs: { 'data-id': n.id } }) : '') + ui.btn({ icon: 'phone', variant: 'ghost', size: 'xs', tip: 'Registrar atividade', sheet: 'crm-nova-atividade', attrs: { 'data-id': n.id } })
    });
  }
  App.screen({
    id: 'crm.deal.list', hash: 'crm-negocios', module: 'crm', title: 'Negócios', nav: true, navGroup: 'crm', navOrder: 2,
    render: () => {
      const s = stNeg(), ab = abertos().filter(meuNeg), meus = D.negocios.filter(meuNeg);
      const cnt = { andamento: ab.length, parados: ab.filter(parado).length, semtarefa: ab.filter(semProxima).length, ganhos: meus.filter((n) => n.desfecho === 'ganho').length, perdidos: meus.filter((n) => n.desfecho === 'perdido' || n.desfecho === 'descartado').length };
      return ui.pageHeader({ breadcrumb: crumbsCrm('Negócios'), title: 'Negócios', sub: 'Mesma base do funil, em lista. Clique na linha para abrir a ficha.', actions: btnExportar('negocios-' + HOJE + '.xlsx') + ui.btn({ label: 'Novo negócio', variant: 'primary', icon: 'plus', sheet: 'crm-novo-negocio' }) }) +
        ui.filters({ busca: 'Buscar empresa, CNPJ, tese', selects: [{ label: 'Consultor', name: 'consultor', options: optsConsultor(), value: s.consultor }, { label: 'Etapa', name: 'etapa', options: optsEtapa(), value: s.etapa }, { label: 'Origem', name: 'origem', options: optsLista('origens'), value: s.origem }, { label: 'Segmento', name: 'segmento', options: optsLista('segmentos'), value: s.segmento }, { label: 'Regime', name: 'regime', options: optsLista('regimes'), value: s.regime }],
          chipGroup: 'single', chips: [{ label: 'Em andamento', value: 'andamento', count: cnt.andamento, active: s.chip === 'andamento' }, { label: 'Parados', value: 'parados', tone: 'red', count: cnt.parados, active: s.chip === 'parados' }, { label: 'Sem próxima tarefa', value: 'semtarefa', tone: 'amber', count: cnt.semtarefa, active: s.chip === 'semtarefa' }, { label: 'Ganhos', value: 'ganhos', tone: 'green', count: cnt.ganhos, active: s.chip === 'ganhos' }, { label: 'Perdidos e descartados', value: 'perdidos', tone: 'gray', count: cnt.perdidos, active: s.chip === 'perdidos' }, { label: 'Todos', value: 'todos', count: meus.length, active: s.chip === 'todos' }], extra: visao('crm-negocios') }) +
        '<div data-crm-lista>' + tabelaNegocios() + '</div>';
    },
    mount: (root) => {
      root = escopo(root);
      ligarFiltros(root, stNeg(), padraoNeg, () => redesenhar(root, '[data-crm-lista]', tabelaNegocios));
      root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'crm-visao') App.go(e.detail.value); });
    }
  });

  /* ---------- Ficha do negócio ---------- */
  function rastreador(n) {
    const atual = n.desfecho ? 10 : n.etapa;
    const segs = ABERTAS.map((e) => {
      const cls = e.num < atual ? 'is-done' : e.num === atual ? 'is-current' : '';
      return '<button type="button" class="m-crm-stage ' + cls + '"' + (aberto(n) && e.num !== atual ? ' data-dialog="crm-mover-etapa" data-id="' + n.id + '" data-para="' + e.num + '" title="Mover para ' + esc(e.nome) + '"' : ' disabled title="' + esc(e.num + ' · ' + e.nome) + '"') + '><span class="m-crm-stage__bar"></span><span class="m-crm-stage__name">' + e.num + ' · ' + esc(e.nome) + '</span></button>';
    });
    const fim = n.desfecho ? DESF[n.desfecho] : null;
    segs.push('<button type="button" class="m-crm-stage ' + (n.desfecho === 'ganho' ? 'is-won is-current' : n.desfecho ? 'is-lost is-current' : '') + '"' + (aberto(n) ? ' data-dialog="crm-mover-etapa" data-id="' + n.id + '" data-para="' + (n.etapa === 9 ? 'ganho' : 'perdido') + '" title="Ganho ou perdido"' : ' disabled') + '><span class="m-crm-stage__bar"></span><span class="m-crm-stage__name">10 · ' + (fim ? fim.nome : 'Ganho ou perdido') + '</span></button>');
    return '<nav class="m-crm-stages" aria-label="Etapas do funil">' + segs.join('') + '</nav>';
  }
  /* A condição da etapa atual já foi registrada? (habilita o aviso "pode mover") */
  function reqCumprido(n) {
    if (!aberto(n)) return false;
    const atv = atividadesNeg(n.id).filter((a) => a.quando.slice(0, 10) >= n.entrouEtapaEm);
    if (n.etapa === 1) return true;
    if (n.etapa === 3) return atv.some((a) => a.tipo === 'reuniao' && a.resultado === 'Agendada');
    if (n.etapa === 4) return atv.some((a) => a.tipo === 'reuniao' && a.resultado === 'Realizada');
    if (n.etapa === 6) { const d = docsCliente(n.id); return d.length > 0 && d.every((x) => x.status === 'recebido'); }
    if (n.etapa === 7) return atv.some((a) => a.tipo === 'calculo');
    if (n.etapa === 8) return atv.some((a) => a.tipo === 'apresentacao' && a.resultado === 'Realizada');
    return false;
  }
  function cardProxima(n) {
    if (!aberto(n)) return ui.card({ title: 'Próxima tarefa', icon: 'check-square', body: '<p class="lt-small lt-muted">Negócio encerrado. Não precisa de próxima tarefa.</p>' });
    const t = proxima(n);
    if (!t) return ui.card({ title: 'Próxima tarefa', icon: 'check-square', body: ui.callout({ tone: 'warning', title: 'Sem próxima tarefa', text: 'Todo negócio ativo precisa de uma próxima tarefa (regra 2.5). A AUT-11 já avisou o consultor.', actions: ui.btn({ label: 'Agendar tarefa', size: 'sm', variant: 'primary', icon: 'plus', sheet: 'core-nova-tarefa' }) }) });
    const outras = abertasNeg(n.id).length - 1;
    return ui.card({ title: 'Próxima tarefa', icon: 'check-square', actions: ui.btn({ icon: 'plus', variant: 'ghost', size: 'sm', tip: 'Nova tarefa', sheet: 'core-nova-tarefa' }), body: '<div class="lt-stack lt-stack--sm"><div class="lt-strong">' + esc(t.titulo) + '</div><div class="lt-row">' + ui.chip(fmt.quando(t.prazo), atrasada(t) ? 'red' : ehHoje(t.prazo) ? 'amber' : 'blue', { icon: 'clock' }) + origemChip(t.origem, t.ref && t.ref.hash) + '</div><div class="lt-small lt-muted">' + (t.filaId ? 'Fila: Equipe de cálculo' : esc(pessoa(t.responsavelId).nome)) + (outras > 0 ? ' · mais ' + fmt.plural(outras, 'tarefa aberta', 'tarefas abertas') : '') + '</div>' + ui.btn({ label: 'Concluir tarefa', size: 'sm', icon: 'check', acao: 'concluir', toast: 'Tarefa concluída', toastText: 'Lembre de agendar a próxima, se for o caso.', attrs: { 'data-crm-concluir-t': t.id } }) + '</div>' });
  }
  function abaTarefas(n) {
    const ts = tarefasNeg(n.id).sort((a, b) => (a.status === 'concluida') - (b.status === 'concluida') || (a.status === 'concluida' ? String(b.concluidaEm).localeCompare(String(a.concluidaEm)) : porPrazo(a, b)));
    if (!ts.length) return ui.empty({ icon: 'check-square', title: 'Nenhuma tarefa', action: ui.btn({ label: 'Nova tarefa', variant: 'primary', icon: 'plus', sheet: 'core-nova-tarefa' }) });
    return '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-muted">' + fmt.plural(ts.filter((t) => t.status !== 'concluida').length, 'aberta') + ' · ' + fmt.plural(ts.filter((t) => t.status === 'concluida').length, 'concluída') + '</span>' + ui.btn({ label: 'Nova tarefa', size: 'sm', icon: 'plus', sheet: 'core-nova-tarefa' }) + '</div>' +
      ui.card({ flush: true, body: '<ul class="lt-list">' + ts.map((t) => { const done = t.status === 'concluida'; return '<li class="lt-list__item"' + (done ? ' style="opacity:.6"' : '') + '><label class="lt-check" title="Concluir"><input type="checkbox" data-crm-tarefa="' + t.id + '"' + (done ? ' checked' : '') + ' aria-label="Concluir: ' + esc(t.titulo) + '"></label><div class="lt-list__body"><div class="lt-list__title"' + (done ? ' style="text-decoration:line-through"' : '') + '>' + esc(t.titulo) + '</div><div class="lt-list__meta">' + origemChip(t.origem, t.ref && t.ref.hash) + '<span>' + (t.filaId ? 'Equipe de cálculo' : esc(pessoa(t.responsavelId).nome)) + '</span></div></div><div class="lt-list__aside lt-num ' + (atrasada(t) ? 'lt-danger lt-strong' : 'lt-muted') + '">' + (done ? 'concluída ' + esc(fmt.quando(t.concluidaEm)) : (atrasada(t) ? 'Atrasada · ' : '') + esc(fmt.quando(t.prazo))) + '</div></li>'; }).join('') + '</ul>' });
  }
  function abaDocumentos(n) {
    const docs = docsNeg(n.id);
    if (!docs.length) return ui.empty({ icon: 'paperclip', title: 'Documentos entram na etapa 6', text: 'Na etapa "Carta proposta e documentos" a carta é enviada e a lista de documentos pedidos ao cliente aparece aqui, com pendentes e recebidos.', action: aberto(n) ? ui.btn({ label: 'Enviar documento', icon: 'upload', sheet: 'crm-documento', attrs: { 'data-id': n.id } }) : '' });
    const cli = docsCliente(n.id), ok = cli.filter((d) => d.status === 'recebido').length;
    return '<div class="lt-row lt-row--between lt-mb-4"><div style="min-width:220px;flex:1;max-width:360px"><div class="lt-small lt-muted">Documentos do cliente: <b class="lt-num">' + ok + ' de ' + cli.length + '</b> recebidos</div>' + ui.progress(ok, cli.length || 1, ok === cli.length ? 'green' : 'amber') + '</div>' + ui.btn({ label: 'Registrar documento', size: 'sm', icon: 'paperclip', sheet: 'crm-documento', attrs: { 'data-id': n.id } }) + '</div>' +
      ui.table({
        compact: true, rows: docs.sort((a, b) => (a.status === 'pendente' ? 0 : 1) - (b.status === 'pendente' ? 0 : 1)), rowClass: (d) => (d.status === 'pendente' ? 'm-crm-late' : ''),
        columns: [
          { label: 'Documento', key: 'categoria', render: (d) => '<span class="lt-row lt-row--nowrap" style="gap:8px"><span class="' + (d.status === 'recebido' ? 'lt-success' : 'lt-warning') + '">' + I(d.status === 'recebido' ? 'check-circle' : 'clock') + '</span><span><span class="lt-table__primary">' + esc(d.categoria) + '</span>' + (d.arquivo ? '<span class="lt-table__secondary">' + esc(d.arquivo) + ' · ' + fmt.num(d.tamanhoMb, d.tamanhoMb < 10 ? 1 : 0) + ' MB</span>' : '') + '</span></span>' },
          { label: 'Origem', key: 'origem', render: (d) => (d.origem === 'atlas' ? ui.chip('Enviado pela Atlas', 'gold') : ui.chip('Cliente', 'blue')) },
          { label: 'Situação', key: 'status', render: (d) => (d.status === 'recebido' ? ui.chip('Recebido', 'green', { dot: true }) + '<span class="lt-table__secondary">' + fmt.data(d.recebidoEm) + '</span>' : ui.chip('Pendente', 'amber', { dot: true }) + '<span class="lt-table__secondary">há ' + fmt.plural(util.diasEntre(d.solicitadoEm, App.HOJE), 'dia') + '</span>') }
        ],
        rowActions: (d) => (d.status === 'pendente' ? ui.btn({ label: 'Recebido', size: 'xs', variant: 'outline', icon: 'check', sheet: 'crm-documento', attrs: { 'data-id': n.id, 'data-cat': d.categoria } }) + ui.btn({ icon: 'send', variant: 'ghost', size: 'xs', tip: 'Cobrar o cliente', acao: 'enviar', toast: 'Cobrança enviada', toastText: 'E-mail para ' + esc((decisor(n.empresaId) || {}).nome || 'o contato') + ' com a lista de pendências.' }) : ui.btn({ icon: 'download', variant: 'ghost', size: 'xs', tip: 'Baixar', acao: 'exportar', toast: 'Download iniciado', toastText: esc(d.arquivo) }))
      });
  }
  /* AUT-10: primeira verificação depois de estourar o SLA e repetição a cada [3] dias (parâmetro da regra) */
  function alertasSla(n) {
    const e = aberto(n) ? etapaDe(n) : null; if (!e || !e.sla) return { feitos: [], proximo: null };
    const f = fluxoPorCod('AUT-10'), rep = (((f && f.params) || []).find((x) => x.key === 'repetir') || {}).valor || 3, agora = util.isoHora(App.HOJE);
    const feitos = []; let d = util.addDias(n.entrouEtapaEm, e.sla + 1);
    while (util.iso(d) + 'T06:00' <= agora) { feitos.push(util.iso(d) + 'T06:00'); d = util.addDias(d, rep); }
    return { feitos, proximo: util.iso(d) + 'T06:00' };
  }
  const maiusc = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  /* Execuções de um negócio: as registradas em D.fluxoExecucoes (abrem o passo a passo) e as que a linha do tempo
     mostra (entrada de etapa, ligação sem sucesso, reunião não realizada, alerta de SLA), que abrem o diagrama. */
  function execucoesNeg(n) {
    const hash = 'crm-negocio-' + n.id, out = [];
    D.fluxoExecucoes.filter((x) => x.registro && x.registro.hash === hash).forEach((x) => out.push({ fluxoId: x.fluxoId, quando: x.quando, estado: x.estado, txt: x.porque || x.erro || ((x.saidas || [])[0] || {}).label || 'Execução registrada', href: '#fluxos-execucao-' + x.id, real: true, negocioId: n.id }));
    const add = (cod, quando, txt) => { const f = fluxoPorCod(cod); if (!f) return; if (out.some((x) => x.real && x.fluxoId === f.id && x.quando.slice(0, 10) === quando.slice(0, 10))) return; out.push({ fluxoId: f.id, quando, estado: 'rodou', txt, href: '#fluxos-diagrama-' + f.id, negocioId: n.id }); };
    movsNeg(n.id).forEach((m) => {
      if (m.de != null) add('AUT-21', m.em, 'Moveu para "' + etapaNome(m.para) + '" e registrou o histórico');
      const a = AUT_ENTRADA[m.para]; if (a) { const d = util.parse(m.em); d.setMinutes(d.getMinutes() + 1); add(a[0], util.isoHora(d), maiusc(a[1])); }
    });
    atividadesNeg(n.id).forEach((a) => {
      if (a.tipo === 'ligacao' && (a.resultado === 'Não atendeu' || a.resultado === 'Caixa postal')) add('AUT-02', a.quando, 'Criou a tarefa "Nova tentativa de contato" (' + a.resultado.toLowerCase() + ')');
      if (a.tipo === 'reuniao' && a.resultado === 'Não realizada') add('AUT-04', a.quando, 'Criou a tarefa "Reagendar reunião"');
    });
    alertasSla(n).feitos.forEach((q) => add('AUT-10', q, 'Alertou o consultor e o gestor: ' + fmt.plural(util.diasEntre(n.entrouEtapaEm, q.slice(0, 10)), 'dia') + ' em "' + etapaDe(n).nome + '" (SLA de ' + etapaDe(n).sla + ')'));
    return out.sort((a, b) => b.quando.localeCompare(a.quando));
  }
  /* Próximos disparos de um negócio, calculados dos dados (mesma regra do painel Fluxos) */
  function disparosNeg(n) {
    const hash = 'crm-negocio-' + n.id, agora = util.isoHora(App.HOJE), out = [], e = emp(n.empresaId);
    const add = (cod, quando, motivo, para) => { const f = fluxoPorCod(cod); if (f && f.ligado && quando > agora) out.push({ fluxoId: f.id, cod, quando, motivo, para, negocioId: n.id, registro: { label: e.fantasia + ' · ' + n.titulo, hash } }); };
    if (aberto(n)) {
      const sla = alertasSla(n), et = etapaDe(n);
      if (sla.proximo) add('AUT-10', sla.proximo, parado(n) ? 'Repetir o alerta de etapa parada' : 'Alerta se continuar em "' + et.nome + '" (SLA de ' + fmt.plural(et.sla, 'dia') + ')', n.consultorId === 2 ? pessoa(2).nome : pessoa(n.consultorId).nome + ' e ' + pessoa(2).nome);
      if (semProxima(n)) add('AUT-11', util.iso(util.addDias(App.HOJE, 1)) + 'T06:00', 'Aviso: negócio sem próxima tarefa', pessoa(n.consultorId).nome);
    }
    const f3 = fluxoPorCod('AUT-03'), pr = (k, d) => ((((f3 && f3.params) || []).find((x) => x.key === k)) || {}).valor || d;
    D.eventos.filter((x) => x.ref && x.ref.hash === hash && x.data >= HOJE).forEach((x) => {
      const quem = x.pessoas.map(nome1).join(', ');
      add('AUT-03', util.iso(util.addDias(x.data, -pr('diasAntes', 1))) + 'T' + pr('horaDia', '08:00'), 'Lembrete 1 dia antes: ' + x.titulo + ' (' + x.inicio + ')', quem);
      add('AUT-03', x.data + 'T' + pr('horaDia', '08:00'), 'Lembrete no dia: ' + x.titulo + ' (' + x.inicio + ')', quem);
    });
    D.fluxoExecucoes.filter((x) => x.estado === 'falhou' && x.registro && x.registro.hash === hash).forEach((x) => {
      const c = decisor(n.empresaId), f = fluxoPorId(x.fluxoId), m = String(x.erro || '').match(/(\d{2}:\d{2})/);
      add(f.codigo, x.quando.slice(0, 10) + 'T' + (m ? m[1] : '10:00'), 'Nova tentativa do e-mail de confirmação ao cliente', c ? c.nome + ' (cliente)' : 'cliente');
    });
    return out.sort((a, b) => a.quando.localeCompare(b.quando));
  }
  /* Para o painel Fluxos e outros módulos: todos os próximos disparos do CRM */
  C.disparos = () => [].concat.apply([], D.negocios.map(disparosNeg)).sort((a, b) => a.quando.localeCompare(b.quando));
  C.execucoes = (id) => (neg(id) ? execucoesNeg(neg(id)) : []);
  function abaAutomacoes(ids) {
    const multi = ids.length > 1, rot = (x) => (multi ? '#' + x.negocioId + ' · ' : '');
    const execs = [].concat.apply([], ids.map((id) => execucoesNeg(neg(id)))).sort((a, b) => b.quando.localeCompare(a.quando));
    const disp = [].concat.apply([], ids.map((id) => disparosNeg(neg(id)))).sort((a, b) => a.quando.localeCompare(b.quando));
    const estado = (e) => (e === 'rodou' ? ['check-circle', 'green', 'Rodou'] : e === 'falhou' ? ['x-circle', 'red', 'Falhou'] : ['minus-circle', 'amber', 'Condição não atendida']);
    const LIM = 12, mais = execs.length - LIM;
    return '<div class="lt-g12"><div class="lt-c7">' + ui.card({ title: 'Execuções neste registro', icon: 'play-circle', sub: 'As mesmas da linha do tempo. Clique para abrir no painel Fluxos.', flush: true,
      body: ui.list(execs.slice(0, LIM).map((x) => { const f = fluxoPorId(x.fluxoId), st = estado(x.estado); return { icon: st[0], tone: st[1], title: esc(rot(x) + f.codigo + ' · ' + f.nome), meta: ui.chip(st[2], st[1]) + '<span>' + esc(fmt.quando(x.quando)) + ' · ' + esc(x.txt) + '</span>', aside: '<span class="lt-small lt-muted" style="white-space:nowrap">' + (x.real ? 'Passo a passo' : 'Diagrama') + '</span>' + I('chevron-right'), href: x.href }; }), { empty: { icon: 'workflow', title: 'Nenhuma execução ainda', text: 'As automações aparecem aqui quando rodam para este registro.' } }) +
        (mais > 0 ? '<div class="lt-pagination"><span>Mostrando as ' + LIM + ' mais recentes de ' + execs.length + '</span><a href="#fluxos">Ver todas no painel Fluxos</a></div>' : '') }) + '</div>' +
      '<div class="lt-c5">' + ui.card({ title: 'Próximos disparos', icon: 'clock', sub: 'Calculados pelas regras ligadas', flush: true, body: ui.list(disp.map((x) => ({ icon: 'clock', tone: 'violet', title: esc(rot(x) + x.cod + ' · ' + x.motivo), meta: esc(fmt.dataHora(x.quando)) + ' · para ' + esc(x.para), href: '#fluxos-diagrama-' + x.fluxoId })), { empty: { icon: 'clock', title: 'Nada programado', text: 'Sem SLA correndo nem compromisso futuro neste registro.' } }) }) +
      '<div class="lt-mt-4">' + ui.callout({ tone: 'info', icon: 'workflow', text: 'As regras e os prazos [X] ficam em <a href="#crm-automacoes">Automações comerciais</a>. O diagrama de cada uma está no <a href="#fluxos">painel Fluxos</a>.' }) + '</div></div></div>';
  }
  App.screen({
    id: 'crm.deal.detail', hash: 'crm-negocio', module: 'crm', title: 'Ficha do negócio', navGroup: 'crm', navParent: 'crm-negocios', exemplo: 1005,
    render: (params) => {
      const n = neg(params.id || 1005);
      if (!n) return ui.empty({ icon: 'briefcase', title: 'Negócio não encontrado', text: 'O número ' + esc(params.id) + ' não existe nos dados do protótipo (negócios 1001 a 1028).', action: '<a class="lt-btn lt-btn--primary" href="#crm-funil">Abrir o funil</a>' });
      const e = emp(n.empresaId), et = aberto(n) ? etapaDe(n) : null, ct = contratoDe(n);
      const movs = movsNeg(n.id), atv = atividadesNeg(n.id), docs = docsNeg(n.id), abertasT = abertasNeg(n.id);
      const proxEt = aberto(n) ? (n.etapa === 9 ? 'ganho' : n.etapa + 1) : null;
      const req = et ? (et.requisitos || []).map((r) => r.texto) : [];
      const reqOk = reqCumprido(n);
      const alertas = (parado(n) ? ui.callout({ tone: 'danger', icon: 'hourglass', title: 'Parado há ' + diasEtapa(n) + ' dias em "' + esc(et.nome) + '"', text: 'O SLA da etapa é de ' + et.sla + ' dias. O consultor e o gestor comercial foram avisados (AUT-10).' }) : '') +
        (semProxima(n) ? ui.callout({ tone: 'warning', title: 'Sem próxima tarefa', text: 'Todo negócio ativo precisa de uma próxima tarefa agendada (regra 2.5).', actions: ui.btn({ label: 'Agendar tarefa', size: 'sm', icon: 'plus', sheet: 'core-nova-tarefa' }) }) : '');
      const cardDados = ui.card({ title: 'Dados do negócio', icon: 'briefcase', actions: ui.btn({ icon: 'edit', variant: 'ghost', size: 'sm', tip: 'Editar', sheet: 'crm-novo-negocio', attrs: { 'data-empresa': e.id } }), body: ui.dl([
        ['Tese', esc(n.titulo)], ['Crédito estimado', '<span class="lt-num">' + fmt.moeda(n.creditoEstimado) + '</span>'], ['Honorário de êxito', fmt.pct(n.exitoPct) + ' · <span class="lt-num">' + fmt.moedaCurta(honorarioExito(n)) + '</span> estimado'],
        ['Honorário mensal', ct ? '<span class="lt-num">' + fmt.moeda(ct.honorarioMensal) + '</span>' : '<span class="lt-muted">definido no fechamento</span>'], ['Origem', esc(e.origem)], ['Consultor', ui.person(n.consultorId)], ['Criado em', fmt.data(n.criadoEm) + ' · há ' + fmt.plural(util.diasEntre(n.criadoEm, App.HOJE), 'dia')],
        n.desfecho ? ['Encerrado em', fmt.data(n.fechadoEm) + (n.motivoPerda ? ' · ' + esc(n.motivoPerda) : '')] : ['Na etapa desde', fmt.data(n.entrouEtapaEm) + ' · ' + diasHtml(n)]
      ]) });
      const cardAvancar = aberto(n) ? ui.card({ title: 'Para avançar', icon: 'filter', accent: true, body: '<div class="lt-stack lt-stack--sm"><div class="lt-small lt-muted">Próxima etapa</div><div>' + chipDe(proxEt, false) + '</div><div class="lt-small lt-muted lt-mt-2">Condição da etapa atual (proposta 2.2)</div>' +
        (req.length ? req.map((t) => '<div class="lt-row lt-row--nowrap lt-row--top lt-small" style="gap:8px"><span class="' + (reqOk ? 'lt-success' : 'lt-warning') + '">' + I(reqOk ? 'check-circle' : 'clock') + '</span><span>' + esc(t) + '</span></div>').join('') : '<div class="lt-small">Sem condição: a tarefa da etapa é criada automaticamente.</div>') +
        (reqOk ? '<div class="lt-small lt-success lt-strong">Requisito registrado: pode mover.</div>' : '') + '<div class="lt-mt-2">' + ui.btn({ label: 'Mover etapa', variant: 'primary', icon: 'arrow-right', dialog: 'crm-mover-etapa', attrs: { 'data-id': n.id } }) + '</div></div>' }) :
        ui.card({ title: 'Desfecho', icon: DESF[n.desfecho].icon, body: '<div class="lt-stack lt-stack--sm">' + chipDe(n.desfecho, false) + '<div class="lt-small lt-text-2">' + (n.desfecho === 'ganho' ? 'Contrato de honorários assinado em ' + fmt.data(n.fechadoEm) + '.' + (ct ? ' Crédito já recuperado (compensado): <b class="lt-num">' + fmt.moedaCurta(recuperadoCt(ct)) + '</b>.' : '') : 'Motivo: ' + esc(n.motivoPerda || 'não informado') + '.') + '</div>' + (n.desfecho === 'ganho' && ct ? '<a class="lt-btn lt-btn--sm" href="#fin-honorarios">' + I('wallet') + '<span>Ver honorários no Financeiro</span></a>' : ui.btn({ label: 'Reabrir negócio', size: 'sm', icon: 'refresh', dialog: 'crm-mover-etapa', attrs: { 'data-id': n.id, 'data-para': 2 } })) + '</div>' });
      const hist = '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact"><thead><tr><th>Etapa</th><th>Entrou em</th><th class="lt-num">Dias</th><th class="lt-num">SLA</th><th>Por</th></tr></thead><tbody>' +
        movs.map((m, i) => { const prox = movs[i + 1], d = prox ? prox.dias : (typeof m.para === 'number' && aberto(n) ? diasEtapa(n) : null), sla = typeof m.para === 'number' ? (db.etapa(m.para) || {}).sla : null; return '<tr><td>' + chipDe(m.para, false) + '</td><td class="lt-num">' + fmt.data(m.em) + '</td><td class="lt-num"><span class="' + (sla && d > sla ? 'lt-danger lt-strong' : '') + '">' + (d == null ? '—' : d + (prox ? '' : ' (atual)')) + '</span></td><td class="lt-num lt-muted">' + (sla || '—') + '</td><td>' + esc(nome1(m.por)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
      const resumo = '<div class="lt-stack">' + ui.summary([{ label: 'Crédito estimado', value: '<span class="lt-num">' + fmt.moedaCurta(n.creditoEstimado) + '</span>' }, { label: 'Êxito estimado', value: '<span class="lt-num">' + fmt.moedaCurta(honorarioExito(n)) + '</span>' }, { label: 'Na etapa', value: aberto(n) ? diasHtml(n) + ' <span class="lt-small lt-muted">/ SLA ' + et.sla + ' d</span>' : '—' }, { label: 'Atividades', value: '<span class="lt-num">' + atv.length + '</span>' }]) +
        '<div class="lt-g12"><div class="lt-c7">' + cardDados + '</div><div class="lt-c5">' + cardAvancar + '</div></div>' + ui.card({ title: 'Histórico de etapas', icon: 'history', sub: 'De, para, quando e dias em cada etapa (FUN-05)', flush: true, body: hist }) + '</div>';
      const tabs = ui.tabs({ id: 'crm-negocio', tabs: [
        { key: 'resumo', label: 'Resumo', icon: 'grid', content: resumo },
        { key: 'linha', label: 'Linha do tempo', icon: 'history', count: atv.length + movs.length, content: '<div class="lt-row lt-row--between lt-mb-4">' + timelineFiltros('neg') + ui.btn({ label: 'Registrar atividade', size: 'sm', icon: 'plus', sheet: 'crm-nova-atividade', attrs: { 'data-id': n.id } }) + '</div><div data-crm-tl>' + timelineHtml([n.id]) + '</div>' },
        { key: 'tarefas', label: 'Tarefas', icon: 'check-square', count: abertasT.length, content: abaTarefas(n) },
        { key: 'documentos', label: 'Documentos', icon: 'paperclip', count: docs.length ? docsCliente(n.id).filter((d) => d.status === 'recebido').length + '/' + docsCliente(n.id).length : 0, content: abaDocumentos(n) },
        { key: 'automacoes', label: 'Automações', icon: 'workflow', count: execucoesNeg(n).length, content: abaAutomacoes([n.id]) }
      ] });
      const dec = decisor(e.id);
      const eventos = D.eventos.filter((x) => x.ref && x.ref.hash === 'crm-negocio-' + n.id && x.data >= HOJE).sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
      const aside = '<div class="lt-stack">' + cardProxima(n) +
        ui.card({ title: 'Empresa', icon: 'building', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#crm-empresa-' + e.id + '">Ficha 360°</a>', body: ui.dl([['Razão social', esc(e.razao)], ['CNPJ', '<span class="lt-mono">' + esc(e.cnpj) + '</span>'], ['Regime', regimeChip(e.regime)], ['Faturamento', '<span class="lt-num">' + fmt.moedaCurta(e.faturamento) + '</span>/ano'], ['Cidade', esc(e.cidade + '/' + e.uf)]]) }) +
        ui.card({ title: 'Contatos', icon: 'users', flush: true, body: ui.list(db.contatosDa(e.id).map((c) => ({ lead: ui.avatar(c.nome, 'sm'), title: esc(c.nome), meta: esc(c.cargo) + (c.decisor ? ui.chip('Decisor', 'gold') : ''), sheet: 'crm-contato', attrs: { 'data-id': c.id } }))) }) +
        ui.card({ title: 'Agenda deste negócio', icon: 'calendar', flush: true, body: ui.list(eventos.map((x) => ({ lead: ui.dateBox(x.data, ehHoje(x.data) ? 'amber' : ''), title: esc(x.titulo), meta: esc(x.inicio + ' · ' + x.local), href: '#agenda' })), { empty: { icon: 'calendar', title: 'Nenhum compromisso marcado' } }) }) + '</div>';
      return ui.pageHeader({
        breadcrumb: [{ label: 'CRM', hash: 'crm-funil' }, { label: 'Negócios', hash: 'crm-negocios' }, { label: e.fantasia }],
        eyebrow: 'Negócio #' + n.id, title: e.fantasia, sub: esc(n.titulo) + (dec ? ' · decisor: ' + esc(dec.nome) : ''),
        meta: etapaChip(n, { lg: true }) + (aberto(n) ? ui.chip(diasEtapa(n) + ' dias na etapa', parado(n) ? 'red' : 'gray', { icon: 'clock' }) : '') + regimeChip(e.regime) + ui.chip(fmt.moedaCurta(n.creditoEstimado) + ' de crédito estimado', 'green') + ui.chip(pessoa(n.consultorId).nome, 'blue', { icon: 'user' }),
        actions: ui.btn({ label: 'Registrar atividade', icon: 'phone', sheet: 'crm-nova-atividade', attrs: { 'data-id': n.id } }) + (aberto(n) ? ui.btn({ label: 'Mover etapa', variant: 'primary', icon: 'arrow-right', dialog: 'crm-mover-etapa', attrs: { 'data-id': n.id } }) : '')
      }) + rastreador(n) + (alertas ? '<div class="lt-stack lt-mb-6">' + alertas + '</div>' : '') + '<div class="lt-split"><div style="min-width:0">' + tabs + '</div>' + aside + '</div>';
    },
    mount: (root, params) => {
      root = escopo(root);
      const n = neg(params.id || 1005); if (!n) return;
      root.addEventListener('lt:segment', (e) => { if (e.detail.name !== 'crm-tl-neg') return; root.querySelector('[data-crm-tl]').innerHTML = timelineHtml([n.id], e.detail.value); });
      ligarConcluir(root);
    }
  });
  /* Concluir tarefa por checkbox (lista) ou botão (card) */
  function ligarConcluir(root) {
    root.addEventListener('change', (e) => {
      const c = e.target.closest('[data-crm-tarefa]'); if (!c) return;
      const t = todasTarefas().find((x) => x.id === +c.getAttribute('data-crm-tarefa')), li = c.closest('li,tr');
      if (t) { t.status = c.checked ? 'concluida' : 'aberta'; t.concluidaEm = c.checked ? util.isoHora(App.HOJE) : null; }
      if (li) { li.style.opacity = c.checked ? '.6' : ''; const tt = li.querySelector('.lt-list__title,.lt-table__primary'); if (tt) tt.style.textDecoration = c.checked ? 'line-through' : ''; }
      const n = t && neg(negIdDe(t));
      ui.toast(c.checked ? 'Tarefa concluída' : 'Tarefa reaberta', c.checked ? 'success' : 'info', esc(t ? t.titulo : '') + (c.checked && n && semProxima(n) ? '<br><b>Agende a próxima tarefa deste negócio.</b>' : ''));
    });
    root.addEventListener('lt:acao', (e) => {
      const b = e.target.closest('[data-crm-concluir-t]'); if (!b) return;
      const t = todasTarefas().find((x) => x.id === +b.getAttribute('data-crm-concluir-t')); if (t) { t.status = 'concluida'; t.concluidaEm = util.isoHora(App.HOJE); }
      App.refresh();
    });
  }

  /* ---------- Mover etapa: requisitos por etapa (abre o diálogo) ---------- */
  const EXEMPLO_MOVER = { 2: [1017, 2], 3: [1019, 3], 4: [1002, 4], 5: [1011, 5], 6: [1008, 6], 7: [1015, 7], 8: [1021, 8], 9: [1003, 9], 10: [1013, 'ganho'], 11: [1027, 'perdido'], 12: [1006, 'descartado'] };
  App.screen({
    id: 'crm.deal.move', hash: 'crm-mover-etapa', module: 'crm', title: 'Mover etapa · requisitos por etapa', navGroup: 'crm', navParent: 'crm-funil', exemplo: 4,
    render: () => {
      const linhas = Object.keys(EXEMPLO_MOVER).map((k) => {
        const ex = EXEMPLO_MOVER[k], n = neg(ex[0]), para = ex[1], deE = typeof para === 'number' ? db.etapa(para - 1) : para === 'descartado' ? db.etapa(2) : db.etapa(9);
        const r = requisito(n, n.desfecho || n.etapa, para);
        return '<tr><td>' + chipDe(para, false) + '</td><td><span class="lt-table__primary">' + esc(r.titulo) + '</span><span class="lt-table__secondary" style="white-space:normal">' + esc(((deE && deE.requisitos && deE.requisitos[0]) || {}).texto || r.sub || '') + '</span></td><td class="lt-small lt-text-2" style="white-space:normal;min-width:260px">' + esc((ENTRADA[para] || []).join(' · ') || '—') + '</td><td><span class="lt-small" style="white-space:nowrap">' + esc(emp(n.empresaId).fantasia) + '</span></td><td>' + ui.btn({ label: 'Ver diálogo', size: 'xs', variant: 'outline', icon: 'arrow-right', dialog: 'crm-mover-etapa', attrs: { 'data-id': n.id, 'data-para': para } }) + '</td></tr>';
      }).join('');
      return ui.pageHeader({ breadcrumb: [{ label: 'CRM', hash: 'crm-funil' }, { label: 'Funil', hash: 'crm-funil' }, { label: 'Mover etapa' }], eyebrow: 'Diálogo do funil', title: 'Mover etapa: requisitos por etapa', sub: 'O diálogo "Mover etapa" é o único caminho para mudar a etapa (no kanban e na ficha). Ele pede a condição da tabela 2.2 da proposta e mostra o que acontece depois.' }) +
        ui.card({ title: 'Condição de cada etapa', icon: 'filter', sub: 'Clique em "Ver diálogo" para abrir com um negócio de exemplo', flush: true, body: '<div class="lt-table-wrap" style="border:0;border-radius:0"><table class="lt-table lt-table--compact"><thead><tr><th>Destino</th><th>O que o diálogo pede</th><th>O que acontece ao entrar</th><th>Exemplo</th><th></th></tr></thead><tbody>' + linhas + '</tbody></table></div>' }) +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c8">' + ui.card({ title: 'Regras gerais', icon: 'info', body: '<div class="lt-grid lt-grid--2 lt-small" style="gap:10px 20px">' + ['Não dá para pular etapas: cada uma tem sua condição.', 'Voltar de etapa exige justificativa e fica no histórico.', 'Reunião ou apresentação "não realizada" não avança: cria a tarefa de reagendar.', 'Perda e descarte exigem motivo da lista (Configurações → Listas).', 'Ganho exige o contrato assinado em anexo.', 'Todo movimento grava de, para, quem, quando e dias na etapa anterior.'].map((t) => '<div class="lt-row lt-row--nowrap lt-row--top" style="gap:8px"><span class="lt-gold">' + I('check') + '</span><span>' + t + '</span></div>').join('') + '</div>' }) + '</div>' +
        '<div class="lt-c4">' + ui.callout({ tone: 'info', icon: 'workflow', text: 'O movimento roda o fluxo <a href="#fluxos-diagrama-1">AUT-21 · Mover etapa do negócio</a>, visível no painel Fluxos.' }) + '</div></div>';
    },
    mount: (root, params) => {
      root = escopo(root);
      const ex = EXEMPLO_MOVER[params.id || 4]; if (!ex) return;
      setTimeout(() => ui.openDialog('crm-mover-etapa', { id: ex[0], para: ex[1] }), 60);
    }
  });

  /* ---------- Leads e empresas ---------- */
  const padraoEmp = () => ({ busca: '', consultor: '', etapa: '', origem: '', segmento: '', regime: '', chip: 'todos' });
  const stEmp = () => App.state.crmEmp || (App.state.crmEmp = padraoEmp());
  function situacaoEmpresa(e) {
    const pr = principal(e.id);
    if (pr) return etapaCurta(pr) + (e.relacao === 'cliente' ? '<span class="lt-table__secondary">' + ui.chip('Cliente', 'green') + '</span>' : '');
    if (e.relacao === 'cliente') return ui.chip('Cliente', 'green', { dot: true }) + '<span class="lt-table__secondary">desde ' + fmt.data(e.desde) + '</span>';
    if (e.relacao === 'perdido') { const n = negsDa(e.id).find((x) => x.desfecho); return ui.chip(n && n.desfecho === 'descartado' ? 'Descartado' : 'Perdido', n && n.desfecho === 'descartado' ? 'gray' : 'red', { dot: true }) + (n && n.motivoPerda ? '<span class="lt-table__secondary" style="white-space:normal;max-width:170px">' + esc(n.motivoPerda) + '</span>' : ''); }
    return ui.chip('Sem negócio', 'gray');
  }
  function tabelaEmpresas() {
    const s = stEmp(), q = String(s.busca || '').trim().toLowerCase();
    const rows = D.empresas.filter((e) => {
      if (!minhaEmp(e)) return false;
      const pr = principal(e.id);
      if (q && (e.fantasia + ' ' + e.razao + ' ' + e.cnpj + ' ' + e.cnpj.replace(/\D/g, '') + ' ' + e.cidade).toLowerCase().indexOf(q) < 0) return false;
      if (s.consultor && String(e.consultorId) !== String(s.consultor)) return false;
      if (s.origem && e.origem !== s.origem) return false;
      if (s.segmento && e.segmento !== s.segmento) return false;
      if (s.regime && e.regime !== s.regime) return false;
      if (s.etapa && (!pr || String(pr.etapa) !== String(s.etapa))) return false;
      if (s.chip && s.chip !== 'todos' && e.relacao !== s.chip) return false;
      return true;
    });
    return ui.table({
      rows, pageSize: 10, rowHref: (e) => '#crm-empresa-' + e.id,
      empty: { icon: 'building', title: 'Nenhuma empresa com esses filtros', text: 'Mude os filtros ou cadastre um novo lead.', action: limparBtn },
      columns: [
        { label: 'Empresa', key: 'fantasia', sortable: true, render: (e) => '<span class="lt-table__primary" title="' + esc(e.razao) + '">' + esc(e.fantasia) + '</span><span class="lt-table__secondary lt-mono" style="white-space:nowrap">' + esc(e.cnpj) + '</span>' },
        { label: 'Regime e segmento', key: 'regime', sortable: true, render: (e) => regimeChip(e.regime) + '<span class="lt-table__secondary">' + esc(e.segmento) + ' · ' + esc(e.cidade) + '</span>' },
        { label: 'Faturamento', key: 'faturamento', sortable: true, align: 'right', render: (e) => '<span class="lt-num">' + fmt.moedaCurta(e.faturamento) + '</span><span class="lt-table__secondary">' + e.funcionarios + ' func.</span>' },
        { label: 'Consultor e origem', key: 'consultorId', sortable: true, value: (e) => pessoa(e.consultorId).nome, render: (e) => ui.person(e.consultorId, esc(e.origem)) },
        { label: 'Situação no funil', key: 'situacao', sortable: true, value: (e) => { const pr = principal(e.id); return pr ? pr.etapa : e.relacao === 'cliente' ? 20 : 30; }, render: situacaoEmpresa },
        { label: 'Próxima tarefa', key: 'prox', render: (e) => { const pr = principal(e.id); return pr ? '<div style="max-width:200px">' + proxHtml(pr) + '</div>' : '<span class="lt-muted">—</span>'; } }
      ],
      rowActions: (e) => { const pr = principal(e.id); return (pr ? ui.btn({ icon: 'phone', variant: 'ghost', size: 'xs', tip: 'Registrar atividade', sheet: 'crm-nova-atividade', attrs: { 'data-id': pr.id } }) : '') + ui.btn({ icon: 'plus', variant: 'ghost', size: 'xs', tip: 'Novo negócio nesta empresa', sheet: 'crm-novo-negocio', attrs: { 'data-empresa': e.id } }); }
    });
  }
  function telaEmpresas() {
    const s = stEmp(), cnt = (r) => D.empresas.filter((e) => e.relacao === r).length;
    return ui.pageHeader({ breadcrumb: crumbsCrm('Leads e empresas'), title: 'Leads e empresas', sub: 'Cadastro único de empresas: CNPJ validado, regime, faturamento, origem e consultor responsável.', actions: ui.btn({ label: 'Importar planilha', icon: 'upload', dialog: 'crm-importar' }) + btnExportar('empresas-' + HOJE + '.xlsx') + ui.btn({ label: 'Novo lead', variant: 'primary', icon: 'plus', sheet: 'crm-novo-negocio' }) }) +
      ui.filters({ busca: 'Buscar nome, CNPJ, cidade', selects: [{ label: 'Consultor', name: 'consultor', options: optsConsultor(), value: s.consultor }, { label: 'Etapa', name: 'etapa', options: optsEtapa(), value: s.etapa }, { label: 'Origem', name: 'origem', options: optsLista('origens'), value: s.origem }, { label: 'Segmento', name: 'segmento', options: optsLista('segmentos'), value: s.segmento }, { label: 'Regime', name: 'regime', options: optsLista('regimes'), value: s.regime }],
        chipGroup: 'single', chips: [{ label: 'Todas', value: 'todos', count: D.empresas.length, active: s.chip === 'todos' }, { label: 'Prospects', value: 'prospect', tone: 'blue', count: cnt('prospect'), active: s.chip === 'prospect' }, { label: 'Clientes', value: 'cliente', tone: 'green', count: cnt('cliente'), active: s.chip === 'cliente' }, { label: 'Perdidas', value: 'perdido', tone: 'red', count: cnt('perdido'), active: s.chip === 'perdido' }] }) +
      '<div data-crm-lista>' + tabelaEmpresas() + '</div>';
  }
  const montaEmpresas = (root) => ligarFiltros(escopo(root), stEmp(), padraoEmp, () => redesenhar(root, '[data-crm-lista]', tabelaEmpresas));
  App.screen({ id: 'crm.lead.list', hash: 'crm-empresas', module: 'crm', title: 'Leads e empresas', nav: true, navGroup: 'crm', navOrder: 3, render: telaEmpresas, mount: montaEmpresas });
  App.screen({ id: 'crm.lead.import', hash: 'crm-importar', module: 'crm', title: 'Importar leads de planilha', navGroup: 'crm', navParent: 'crm-empresas', render: telaEmpresas, mount: (root) => { montaEmpresas(root); setTimeout(() => ui.openDialog('crm-importar'), 60); } });
  App.screen({ id: 'crm.deal.new', hash: 'crm-novo-lead', module: 'crm', title: 'Novo lead', navGroup: 'crm', navParent: 'crm-empresas', render: telaEmpresas, mount: (root) => { montaEmpresas(root); setTimeout(() => ui.openSheet('crm-novo-negocio', {}), 60); } });

  /* ---------- Ficha 360° da empresa ---------- */
  App.screen({
    id: 'crm.company.detail', hash: 'crm-empresa', module: 'crm', title: 'Ficha da empresa', navGroup: 'crm', navParent: 'crm-empresas', exemplo: 1,
    render: (params) => {
      const e = db.empresa(params.id || 1);
      if (!e) return ui.empty({ icon: 'building', title: 'Empresa não encontrada', text: 'O número ' + esc(params.id) + ' não existe nos dados do protótipo (empresas 1 a 25).', action: '<a class="lt-btn lt-btn--primary" href="#crm-empresas">Abrir a lista</a>' });
      const negs = negsDa(e.id), contatos = db.contatosDa(e.id), pr = principal(e.id), rec = C.receita[e.id] || {};
      const ids = negs.map((n) => n.id);
      const tarefas = [].concat.apply([], ids.map(tarefasNeg)).sort((a, b) => (a.status === 'concluida') - (b.status === 'concluida') || porPrazo(a, b));
      const docs = [].concat.apply([], ids.map(docsNeg));
      const procs = (App.juridico ? App.juridico.processos() : D.processos).filter((x) => x.empresaId === e.id), contratos = D.contratos.filter((x) => x.empresaId === e.id);
      const cardsContato = contatos.length ? '<div class="lt-grid lt-grid--2">' + contatos.map((c) => ui.card({ body: '<div class="lt-stack lt-stack--sm"><div class="lt-row lt-row--between lt-row--nowrap">' + ui.person(c.nome, esc(c.cargo), 'lg') + (c.decisor ? ui.chip('Decisor', 'gold', { icon: 'star' }) : ui.chip('Não decisor', 'gray')) + '</div>' +
        '<div class="lt-small lt-text-2 lt-stack" style="gap:4px"><span class="lt-row lt-row--nowrap" style="gap:6px">' + I('phone') + '<span class="lt-num">' + esc(c.telefone) + '</span></span><span class="lt-row lt-row--nowrap" style="gap:6px">' + I('message') + '<span class="lt-num">' + esc(c.whatsapp) + '</span></span><span class="lt-row lt-row--nowrap" style="gap:6px">' + I('mail') + '<span class="lt-truncate">' + esc(c.email) + '</span></span></div>' +
        '<div class="lt-row">' + (pr ? ui.btn({ label: 'Registrar ligação', size: 'xs', icon: 'phone', sheet: 'crm-nova-atividade', attrs: { 'data-id': pr.id, 'data-tipo': 'ligacao' } }) : '') + ui.btn({ label: 'Detalhes', size: 'xs', variant: 'ghost', sheet: 'crm-contato', attrs: { 'data-id': c.id } }) + '</div></div>' })).join('') + '</div>' : ui.empty({ icon: 'users', title: 'Nenhum contato cadastrado' });
      const tabNeg = ui.table({ compact: true, rows: negs, rowHref: (n) => '#crm-negocio-' + n.id, columns: [
        { label: 'Negócio', key: 'titulo', render: (n) => '<span class="lt-table__primary">#' + n.id + ' · ' + esc(n.titulo) + '</span><span class="lt-table__secondary">criado em ' + fmt.data(n.criadoEm) + '</span>' },
        { label: 'Etapa', key: 'etapa', render: etapaCurta },
        { label: 'Crédito', key: 'creditoEstimado', align: 'right', render: (n) => '<span class="lt-num">' + fmt.moedaCurta(n.creditoEstimado) + '</span>' },
        { label: 'Consultor', key: 'consultorId', render: (n) => ui.avatar(n.consultorId, 'sm') }
      ] });
      const listaTarefas = tarefas.length ? ui.card({ flush: true, body: '<ul class="lt-list">' + tarefas.slice(0, 14).map((t) => { const done = t.status === 'concluida'; return '<li class="lt-list__item"' + (done ? ' style="opacity:.6"' : '') + '><label class="lt-check"><input type="checkbox" data-crm-tarefa="' + t.id + '"' + (done ? ' checked' : '') + ' aria-label="Concluir"></label><div class="lt-list__body"><div class="lt-list__title"' + (done ? ' style="text-decoration:line-through"' : '') + '>' + esc(t.titulo) + '</div><div class="lt-list__meta">' + origemChip(t.origem, t.ref && t.ref.hash) + '<a href="#' + esc(t.ref.hash) + '">#' + negIdDe(t) + '</a></div></div><div class="lt-list__aside lt-num ' + (atrasada(t) ? 'lt-danger lt-strong' : 'lt-muted') + '">' + (done ? 'concluída' : esc(fmt.quando(t.prazo))) + '</div></li>'; }).join('') + '</ul>' }) : ui.empty({ icon: 'check-square', title: 'Nenhuma tarefa' });
      const tabDocs = docs.length ? ui.table({ compact: true, rows: docs, pageSize: 8, columns: [
        { label: 'Documento', key: 'categoria', render: (d) => '<span class="lt-table__primary">' + esc(d.categoria) + '</span><span class="lt-table__secondary">Negócio #' + d.negocioId + '</span>' },
        { label: 'Situação', key: 'status', render: (d) => (d.status === 'recebido' ? ui.chip('Recebido', 'green', { dot: true }) : ui.chip('Pendente', 'amber', { dot: true })) },
        { label: 'Data', key: 'recebidoEm', render: (d) => '<span class="lt-num">' + (d.recebidoEm ? fmt.data(d.recebidoEm) : 'pedido em ' + fmt.data(d.solicitadoEm)) + '</span>' },
        { label: 'Arquivo', key: 'arquivo', render: (d) => (d.arquivo ? '<span class="lt-small lt-text-2">' + esc(d.arquivo) + '</span>' : '<span class="lt-muted">—</span>') }
      ] }) : ui.empty({ icon: 'paperclip', title: 'Nenhum documento ainda', text: 'Os documentos entram na etapa 6 do funil.' });
      const tabs = ui.tabs({ id: 'crm-empresa', small: true, tabs: [
        { key: 'contatos', label: 'Contatos', count: contatos.length, content: '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-muted">' + fmt.plural(contatos.filter((c) => c.decisor).length, 'decisor', 'decisores') + ' · ' + fmt.plural(contatos.filter((c) => !c.decisor).length, 'não decisor', 'não decisores') + '</span>' + ui.btn({ label: 'Novo contato', size: 'sm', icon: 'user-plus', sheet: 'crm-novo-contato', attrs: { 'data-empresa': e.id } }) + '</div>' + cardsContato },
        { key: 'negocios', label: 'Negócios', count: negs.length, content: '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-muted">' + fmt.plural(negs.filter(aberto).length, 'em andamento', 'em andamento') + ' · ' + fmt.plural(negs.filter((n) => n.desfecho === 'ganho').length, 'ganho') + '</span>' + ui.btn({ label: 'Novo negócio', size: 'sm', icon: 'plus', sheet: 'crm-novo-negocio', attrs: { 'data-empresa': e.id } }) + '</div>' + tabNeg },
        { key: 'atividades', label: 'Atividades', count: [].concat.apply([], ids.map(atividadesNeg)).length, content: '<div class="lt-row lt-row--between lt-mb-4">' + timelineFiltros('emp') + (pr ? ui.btn({ label: 'Registrar atividade', size: 'sm', icon: 'plus', sheet: 'crm-nova-atividade', attrs: { 'data-id': pr.id } }) : '') + '</div><div data-crm-tl>' + timelineHtml(ids, '', 40) + '</div>' },
        { key: 'tarefas', label: 'Tarefas', count: tarefas.filter((t) => t.status !== 'concluida').length, content: listaTarefas },
        { key: 'documentos', label: 'Documentos', count: docs.length, content: tabDocs },
        { key: 'automacoes', label: 'Automações', content: abaAutomacoes(ids) }
      ] });
      const aside = '<div class="lt-stack">' +
        ui.card({ title: 'Dados cadastrais', icon: 'building', actions: ui.btn({ icon: 'edit', variant: 'ghost', size: 'sm', tip: 'Editar empresa', sheet: 'crm-editar-empresa', attrs: { 'data-id': e.id } }), body: ui.dl([
          ['Razão social', esc(e.razao)], ['CNPJ', '<span class="lt-mono">' + esc(e.cnpj) + '</span>'], ['Regime', regimeChip(e.regime)], ['Segmento', esc(e.segmento)], ['Faturamento', '<span class="lt-num">' + fmt.moedaCurta(e.faturamento) + '</span> por ano'], ['Funcionários', '<span class="lt-num">' + e.funcionarios + '</span>'], ['Cidade', esc(e.cidade + '/' + e.uf)], ['Origem', esc(e.origem)], ['Consultor', ui.person(e.consultorId)]]) }) +
        ui.card({ title: 'Receita Federal', icon: 'shield-check', sub: 'Consulta pública do CNPJ (CAD-03)', actions: ui.btn({ icon: 'refresh', variant: 'ghost', size: 'sm', tip: 'Consultar de novo', acao: 'verificar', toast: 'CNPJ consultado', toastText: 'Situação ativa. Nenhuma mudança desde a última consulta.' }), body: ui.dl([['Situação', ui.chip(rec.situacao || 'Ativa', 'green', { dot: true })], ['CNAE principal', '<span class="lt-mono">' + esc(rec.cnae) + '</span> · ' + esc(rec.cnaeDesc)], ['Abertura', fmt.data(rec.abertura)], ['Porte', esc(rec.porte)], ['Consultado em', fmt.dataHora(rec.consultadoEm)]]) }) +
        ui.card({ title: 'Em outros módulos', icon: 'layers', flush: true, body: ui.list(procs.map((x) => ({ icon: 'scale', tone: 'red', title: '<span class="lt-mono">' + esc(x.numero) + '</span>', meta: esc(x.classe), href: '#jur-processo-' + x.id })).concat(contratos.map((x) => ({ icon: 'wallet', tone: 'green', title: 'Contrato de honorários #' + x.id, meta: fmt.moeda(x.honorarioMensal) + '/mês · ' + fmt.pct(x.exitoPct) + ' de êxito · ' + fmt.moedaCurta(recuperadoCt(x)) + ' recuperado', href: '#fin-honorarios' }))), { empty: { icon: 'layers', title: 'Sem processos nem contratos', text: 'Aparecem aqui quando a empresa vira cliente.' } }) }) + '</div>';
      return ui.pageHeader({
        breadcrumb: [{ label: 'CRM', hash: 'crm-funil' }, { label: 'Leads e empresas', hash: 'crm-empresas' }, { label: e.fantasia }],
        eyebrow: 'Empresa #' + e.id, title: e.fantasia, sub: esc(e.razao) + ' · <span class="lt-mono">' + esc(e.cnpj) + '</span>',
        meta: relChip(e) + (cnpjValido(e.cnpj) ? ui.chip('CNPJ validado', 'green', { icon: 'shield-check' }) : ui.chip('CNPJ com dígito inválido', 'red', { icon: 'alert-circle', title: 'Os dígitos verificadores não conferem' })) + regimeChip(e.regime) + ui.chip(e.segmento, 'slate') + (pr ? etapaChip(pr) : '') + (e.desde ? ui.chip('Cliente desde ' + fmt.data(e.desde), 'green', { icon: 'star' }) : ''),
        actions: ui.btn({ label: 'Novo negócio', icon: 'plus', sheet: 'crm-novo-negocio', attrs: { 'data-empresa': e.id } }) + (pr ? ui.btn({ label: 'Registrar atividade', variant: 'primary', icon: 'phone', sheet: 'crm-nova-atividade', attrs: { 'data-id': pr.id } }) : '')
      }) + ui.summary([{ label: 'Negócios', value: '<span class="lt-num">' + negs.length + '</span> <span class="lt-small lt-muted">(' + negs.filter(aberto).length + ' em andamento)</span>' }, { label: 'Crédito em negociação', value: '<span class="lt-num">' + fmt.moedaCurta(util.soma(negs.filter(aberto), (n) => n.creditoEstimado)) + '</span>' }, { label: 'Crédito contratado', value: '<span class="lt-num">' + fmt.moedaCurta(util.soma(negs.filter((n) => n.desfecho === 'ganho'), (n) => n.creditoEstimado)) + '</span>' }, { label: 'Próxima tarefa', value: pr ? '<div style="max-width:260px">' + proxHtml(pr) + '</div>' : '<span class="lt-muted">—</span>' }]) +
        '<div class="lt-split lt-mt-6"><div style="min-width:0">' + tabs + '</div>' + aside + '</div>';
    },
    mount: (root, params) => {
      root = escopo(root);
      const e = db.empresa(params.id || 1); if (!e) return;
      const ids = negsDa(e.id).map((n) => n.id);
      root.addEventListener('lt:segment', (ev) => { if (ev.detail.name !== 'crm-tl-emp') return; root.querySelector('[data-crm-tl]').innerHTML = timelineHtml(ids, ev.detail.value, 40); });
      ligarConcluir(root);
    }
  });

  /* ---------- Contatos ---------- */
  const padraoCont = () => ({ busca: '', consultor: '', relacao: '', chip: 'todos' });
  const stCont = () => App.state.crmCont || (App.state.crmCont = padraoCont());
  function tabelaContatos() {
    const s = stCont(), q = String(s.busca || '').trim().toLowerCase();
    const rows = D.contatos.filter((c) => {
      const e = emp(c.empresaId);
      if (!minhaEmp(e)) return false;
      if (q && (c.nome + ' ' + c.cargo + ' ' + c.email + ' ' + e.fantasia).toLowerCase().indexOf(q) < 0) return false;
      if (s.consultor && String(e.consultorId) !== String(s.consultor)) return false;
      if (s.relacao && e.relacao !== s.relacao) return false;
      if (s.chip === 'decisor' && !c.decisor) return false;
      if (s.chip === 'nao' && c.decisor) return false;
      return true;
    });
    return ui.table({
      rows, pageSize: 12, rowSheet: (c) => ({ sheet: 'crm-contato', params: { id: c.id } }),
      empty: { icon: 'users', title: 'Nenhum contato com esses filtros', action: limparBtn },
      columns: [
        { label: 'Contato', key: 'nome', sortable: true, render: (c) => ui.person(c.nome, esc(c.cargo)) },
        { label: 'Empresa', key: 'empresaId', sortable: true, value: (c) => emp(c.empresaId).fantasia, render: (c) => '<a href="#crm-empresa-' + c.empresaId + '" class="lt-strong" style="white-space:nowrap">' + esc(emp(c.empresaId).fantasia) + '</a><span class="lt-table__secondary">' + relChip(emp(c.empresaId)) + '</span>' },
        { label: 'Papel', key: 'decisor', sortable: true, value: (c) => (c.decisor ? 0 : 1), render: (c) => (c.decisor ? ui.chip('Decisor', 'gold', { icon: 'star' }) : ui.chip('Não decisor', 'gray')) },
        { label: 'Telefone', key: 'telefone', render: (c) => '<span class="lt-num" style="white-space:nowrap">' + esc(c.telefone) + '</span><span class="lt-table__secondary lt-num" style="white-space:nowrap">' + I('message') + ' ' + esc(c.whatsapp) + '</span>' },
        { label: 'E-mail', key: 'email', render: (c) => '<span class="lt-small lt-truncate" style="display:block;max-width:240px">' + esc(c.email) + '</span>' },
        { label: 'Consultor', key: 'consultor', render: (c) => ui.avatar(emp(c.empresaId).consultorId, 'sm') }
      ],
      rowActions: (c) => ui.btn({ icon: 'copy', variant: 'ghost', size: 'xs', tip: 'Copiar e-mail', attrs: { 'data-copy': c.email, 'data-copy-label': 'E-mail copiado' } }) + ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar', sheet: 'crm-novo-contato', attrs: { 'data-id': c.id } })
    });
  }
  App.screen({
    id: 'crm.contact.list', hash: 'crm-contatos', module: 'crm', title: 'Contatos', nav: true, navGroup: 'crm', navOrder: 4,
    render: () => {
      const s = stCont(), dec = D.contatos.filter((c) => c.decisor).length;
      return ui.pageHeader({ breadcrumb: crumbsCrm('Contatos'), title: 'Contatos', sub: 'Pessoas das empresas, marcadas como decisor (aprova a contratação) ou não decisor. CPF só aparece para quem tem permissão.', actions: btnExportar('contatos-' + HOJE + '.xlsx') + ui.btn({ label: 'Novo contato', variant: 'primary', icon: 'user-plus', sheet: 'crm-novo-contato' }) }) +
        ui.filters({ busca: 'Buscar contato ou empresa', selects: [{ label: 'Consultor', name: 'consultor', options: optsConsultor(), value: s.consultor }, { label: 'Empresa', name: 'relacao', options: [{ value: 'prospect', label: 'Prospects' }, { value: 'cliente', label: 'Clientes' }, { value: 'perdido', label: 'Perdidas' }], value: s.relacao }],
          chipGroup: 'single', chips: [{ label: 'Todos', value: 'todos', count: D.contatos.length, active: s.chip === 'todos' }, { label: 'Decisores', value: 'decisor', tone: 'gold', count: dec, active: s.chip === 'decisor' }, { label: 'Não decisores', value: 'nao', count: D.contatos.length - dec, active: s.chip === 'nao' }] }) +
        '<div data-crm-lista>' + tabelaContatos() + '</div>';
    },
    mount: (root) => ligarFiltros(escopo(root), stCont(), padraoCont, () => redesenhar(root, '[data-crm-lista]', tabelaContatos))
  });

  /* ---------- Registrar atividade (página de referência + gaveta) ---------- */
  App.screen({
    id: 'crm.activity.new', hash: 'crm-registrar-atividade', module: 'crm', title: 'Registrar atividade', navGroup: 'crm', navParent: 'crm-negocios',
    render: () => {
      const linhas = TIPOS_FORM.map((k) => { const t = TIPOS[k]; return t.resultados.map((r, i) => { const a = automacaoDe(neg(1005), k, r); return '<tr>' + (i === 0 ? '<td rowspan="' + t.resultados.length + '" style="vertical-align:top"><span class="lt-row lt-row--nowrap" style="gap:8px"><span class="lt-list__icon" data-tone="' + t.tone + '">' + I(t.icon) + '</span><b>' + esc(t.nome) + '</b></span></td>' : '') + '<td>' + esc(r) + '</td><td>' + (a.codigo ? ui.chip(a.codigo, 'violet', { icon: 'zap' }) : '<span class="lt-muted">—</span>') + '</td><td class="lt-small lt-text-2" style="white-space:normal">' + esc(a.texto) + '</td></tr>'; }).join(''); }).join('');
      const ult = C.atividades.slice().sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 6);
      return ui.pageHeader({ breadcrumb: [{ label: 'CRM', hash: 'crm-funil' }, { label: 'Negócios', hash: 'crm-negocios' }, { label: 'Registrar atividade' }], eyebrow: 'Gaveta lateral', title: 'Registrar atividade', sub: 'Abre pelo botão "Registrar atividade" da ficha, da lista ou do "+ Novo". Cada registro tem tipo, data, resultado e observação (proposta 2.3).', actions: ui.btn({ label: 'Abrir a gaveta', variant: 'primary', icon: 'plus', sheet: 'crm-nova-atividade', attrs: { 'data-id': 1002 } }) }) +
        '<div class="lt-g12"><div class="lt-c8">' + ui.card({ title: 'Tipos, resultados e o que acontece depois', icon: 'list-checks', sub: 'Os resultados são listas fechadas porque alimentam o painel do consultor', flush: true, body: '<div class="lt-table-wrap" style="border:0;border-radius:0"><table class="lt-table lt-table--compact"><thead><tr><th>Tipo</th><th>Resultado</th><th>Automação</th><th>O que o sistema faz</th></tr></thead><tbody>' + linhas + '</tbody></table></div>' }) + '</div>' +
        '<div class="lt-c4">' + ui.card({ title: 'Últimos registros', icon: 'history', flush: true, body: ui.list(ult.map((a) => { const t = TIPOS[a.tipo] || TIPOS.nota, n = neg(a.negocioId); return { icon: t.icon, tone: t.tone, title: esc(t.nome + ' · ' + a.resultado), meta: esc(emp(n.empresaId).fantasia) + ' · ' + esc(fmt.quando(a.quando)), href: '#crm-negocio-' + n.id }; })) }) + '</div></div>';
    },
    mount: () => setTimeout(() => ui.openSheet('crm-nova-atividade', { id: 1002, tipo: 'ligacao', resultado: 'Não atendeu' }), 60)
  });

  /* ---------- Tarefas ---------- */
  const padraoTar = () => ({ escopo: 'equipe', pessoa: '', chip: 'abertas', origem: '' });
  const stTar = () => App.state.crmTar || (App.state.crmTar = padraoTar());
  function tarefasFiltradas(s, ignorarChip) {
    const filas = (pid) => D.filas.filter((f) => f.membros.indexOf(pid) >= 0).map((f) => f.id);
    return todasTarefas().filter((t) => {
      if (soMeus() && t.responsavelId !== App.meId && !(t.filaId && filas(App.meId).indexOf(t.filaId) >= 0)) return false;
      if (s.escopo === 'minhas') { const pid = +s.pessoa || App.meId; if (t.responsavelId !== pid && !(t.filaId && filas(pid).indexOf(t.filaId) >= 0)) return false; }
      else if (s.pessoa && String(t.responsavelId) !== String(s.pessoa)) return false;
      if (s.origem === 'auto' && t.origem === 'Manual') return false;
      if (s.origem === 'manual' && t.origem !== 'Manual') return false;
      if (ignorarChip) return true;
      const aberta = t.status !== 'concluida', d = util.diasEntre(App.HOJE, t.prazo);
      if (s.chip === 'atrasadas') return aberta && atrasada(t);
      if (s.chip === 'hoje') return aberta && !atrasada(t) && ehHoje(t.prazo);
      if (s.chip === 'proximas') return aberta && !atrasada(t) && d > 0 && d <= 7;
      if (s.chip === 'concluidas') return !aberta && t.concluidaEm && util.diasEntre(t.concluidaEm, App.HOJE) <= 30;
      return aberta;
    }).sort((a, b) => (s.chip === 'concluidas' ? String(b.concluidaEm).localeCompare(String(a.concluidaEm)) : porPrazo(a, b)));
  }
  function tabelaTarefas() {
    const s = stTar(), rows = tarefasFiltradas(s);
    return ui.table({
      rows, pageSize: 12, rowHref: (t) => '#' + t.ref.hash, rowClass: (t) => (atrasada(t) ? 'm-crm-late' : ''),
      empty: { icon: 'check-circle', title: s.chip === 'atrasadas' ? 'Nada atrasado' : 'Nenhuma tarefa aqui', text: 'Mude o filtro para ver outras tarefas.' },
      columns: [
        { label: '', key: 'ok', width: '36px', render: (t) => '<label class="lt-check" title="Concluir"><input type="checkbox" data-crm-tarefa="' + t.id + '"' + (t.status === 'concluida' ? ' checked' : '') + ' aria-label="Concluir: ' + esc(t.titulo) + '"></label>' },
        { label: 'Tarefa', key: 'titulo', sortable: true, render: (t) => '<span class="lt-table__primary"' + (t.status === 'concluida' ? ' style="text-decoration:line-through"' : '') + '>' + esc(t.titulo) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:320px">' + esc(t.ref.label) + '</span>' },
        { label: 'Responsável', key: 'responsavelId', sortable: true, value: (t) => (t.filaId ? 'Equipe' : pessoa(t.responsavelId).nome), render: (t) => (t.filaId ? ui.chip('Equipe de cálculo', 'blue', { icon: 'users' }) : ui.person(t.responsavelId)) },
        { label: 'Prazo', key: 'prazo', sortable: true, render: (t) => (t.status === 'concluida' ? '<span class="lt-num lt-muted">concluída ' + esc(fmt.quando(t.concluidaEm)) + '</span>' : '<span class="lt-num ' + (atrasada(t) ? 'lt-danger lt-strong' : ehHoje(t.prazo) ? 'lt-warning lt-strong' : '') + '" style="white-space:nowrap">' + (atrasada(t) ? 'Atrasada · ' : '') + esc(fmt.quando(t.prazo)) + '</span><span class="lt-table__secondary">' + esc(fmt.relativo(t.prazo)) + '</span>') },
        { label: 'Origem', key: 'origem', sortable: true, render: (t) => origemChip(t.origem, t.ref && t.ref.hash) },
        { label: 'Prioridade', key: 'prioridade', sortable: true, value: (t) => ({ alta: 0, media: 1, baixa: 2 }[t.prioridade]), render: (t) => prioChip(t.prioridade) }
      ],
      rowActions: (t) => (t.status !== 'concluida' ? ui.btn({ icon: 'calendar', variant: 'ghost', size: 'xs', tip: 'Reagendar', sheet: 'core-nova-tarefa' }) : '') + '<a class="lt-btn lt-btn--ghost lt-btn--xs lt-btn--icon" href="#' + esc(t.ref.hash) + '" title="Abrir negócio" aria-label="Abrir negócio">' + I('external') + '</a>'
    });
  }
  App.screen({
    id: 'crm.task.list', hash: 'crm-tarefas', module: 'crm', title: 'Tarefas comerciais', nav: true, navGroup: 'crm', navLabel: 'Tarefas', navOrder: 5,
    render: () => {
      const s = stTar(), base = tarefasFiltradas(s, true), ab = base.filter((t) => t.status !== 'concluida');
      const at = ab.filter(atrasada).length, hj = ab.filter((t) => !atrasada(t) && ehHoje(t.prazo)).length, px = ab.filter((t) => { const d = util.diasEntre(App.HOJE, t.prazo); return !atrasada(t) && d > 0 && d <= 7; }).length, au = ab.filter((t) => t.origem !== 'Manual').length;
      const pessoaSel = '<label class="lt-row lt-row--nowrap lt-small lt-muted" style="gap:8px">Pessoa<select class="lt-select" data-crm-pessoa style="height:34px;width:auto;min-width:190px"><option value="">' + (s.escopo === 'minhas' ? esc(db.me().nome) + ' (eu)' : 'Toda a equipe') + '</option>' + C.consultores.concat([8, 9]).map((id) => '<option value="' + id + '"' + (String(s.pessoa) === String(id) ? ' selected' : '') + '>' + esc(pessoa(id).nome) + '</option>').join('') + '</select></label>';
      return ui.pageHeader({ breadcrumb: crumbsCrm('Tarefas'), title: 'Tarefas comerciais', sub: 'Tarefas dos negócios, manuais ou criadas pelas automações (ícone de raio). Todo negócio ativo precisa de uma próxima tarefa.', actions: ui.segmented([{ label: 'Minhas', value: 'minhas', icon: 'user', active: s.escopo === 'minhas' }, { label: 'Equipe', value: 'equipe', icon: 'users', active: s.escopo === 'equipe' }], { name: 'crm-escopo' }) + pessoaSel + ui.btn({ label: 'Nova tarefa', variant: 'primary', icon: 'plus', sheet: 'core-nova-tarefa' }) }) +
        ui.kpis([{ label: 'Atrasadas', value: String(at), icon: 'alert-triangle', foot: at ? 'resolva ou reagende hoje' : 'nada atrasado' }, { label: 'Para hoje', value: String(hj), icon: 'clock', foot: fmt.dataExtenso(App.HOJE).split(',')[0] }, { label: 'Próximos 7 dias', value: String(px), icon: 'calendar' }, { label: 'Criadas por automação', value: fmt.pct(ab.length ? 100 * au / ab.length : 0), icon: 'zap', progress: { value: au, max: ab.length || 1, tone: 'violet' }, foot: au + ' de ' + ab.length + (ab.length === 1 ? ' aberta' : ' abertas') }]) +
        '<div class="lt-mt-6"></div>' + ui.filters({ selects: [{ label: 'Origem', name: 'origem', options: [{ value: 'auto', label: 'Automação' }, { value: 'manual', label: 'Manual' }], value: s.origem }], chipGroup: 'single', chips: [{ label: 'Todas abertas', value: 'abertas', count: ab.length, active: s.chip === 'abertas' }, { label: 'Atrasadas', value: 'atrasadas', tone: 'red', count: at, active: s.chip === 'atrasadas' }, { label: 'Hoje', value: 'hoje', tone: 'amber', count: hj, active: s.chip === 'hoje' }, { label: 'Próximos 7 dias', value: 'proximas', tone: 'blue', count: px, active: s.chip === 'proximas' }, { label: 'Concluídas (30 dias)', value: 'concluidas', tone: 'green', active: s.chip === 'concluidas' }] }) +
        '<div data-crm-lista>' + tabelaTarefas() + '</div>';
    },
    mount: (root) => {
      root = escopo(root);
      const s = stTar();
      ligarFiltros(root, s, padraoTar, () => redesenhar(root, '[data-crm-lista]', tabelaTarefas));
      root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'crm-escopo') { s.escopo = e.detail.value; s.pessoa = ''; App.refresh(); } });
      root.querySelector('[data-crm-pessoa]').addEventListener('change', (e) => { s.pessoa = e.target.value; App.refresh(); });
      ligarConcluir(root);
    }
  });

  /* ---------- Painel de indicadores ---------- */
  const cacheBd = {};
  function diasUteis(ini, fim) { const out = []; for (let d = util.parse(ini); util.iso(d) <= fim; d = util.addDias(d, 1)) if (util.ehDiaUtil(d)) out.push(util.iso(d)); return out; }
  function bdMes(mes) { if (cacheBd[mes] == null) { const d = util.parse(mes + '-01'); cacheBd[mes] = diasUteis(mes + '-01', util.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))).length; } return cacheBd[mes]; }
  const fimMes = (mes) => { const d = util.parse(mes + '-01'); return util.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
  function fator(pid, s) { if (!s.origem && !s.segmento) return 1; const es = D.empresas.filter((e) => e.consultorId === pid); if (!es.length) return 0; return es.filter((e) => (!s.origem || e.origem === s.origem) && (!s.segmento || e.segmento === s.segmento)).length / es.length; }
  /* Soma produção e metas de um conjunto de pessoas no intervalo (metas proporcionais aos dias úteis; contratos e valor pela meta do mês) */
  function apurar(pids, ini, fim, s, gran) {
    s = s || {};
    const out = { v: {}, m: {} };
    IKEYS.concat(['contratos', 'valor', 'honor']).forEach((k) => { out.v[k] = 0; });
    MKEYS.forEach((k) => { out.m[k] = 0; });
    const dias = diasUteis(ini, fim);
    pids.forEach((pid) => {
      const f = fator(pid, s), v = {};
      IKEYS.forEach((k) => { v[k] = 0; });
      C.diario.forEach((r) => { if (r.pessoaId === pid && r.data >= ini && r.data <= fim) IKEYS.forEach((k) => { v[k] += r[k]; }); });
      IKEYS.forEach((k) => { out.v[k] += Math.round(v[k] * f); });
      const iniC = gran === 'mes' ? ini : ini.slice(0, 8) + '01';
      D.negocios.forEach((n) => { if (n.desfecho === 'ganho' && n.consultorId === pid && n.fechadoEm >= iniC && n.fechadoEm <= fim) { const e = emp(n.empresaId); if ((!s.origem || e.origem === s.origem) && (!s.segmento || e.segmento === s.segmento)) { out.v.contratos++; out.v.valor += n.creditoEstimado; out.v.honor += honorariosContratados(n); } } });
      dias.forEach((d) => { const mm = (C.metas[d.slice(0, 7)] || {})[pid]; if (!mm) return; MKEYS.forEach((k) => { if ((k === 'contratos' || k === 'valor') && gran !== 'mes') return; out.m[k] += mm[k] / bdMes(d.slice(0, 7)); }); });
      if (gran !== 'mes') { const mm = (C.metas[ini.slice(0, 7)] || {})[pid]; if (mm) { out.m.contratos += mm.contratos; out.m.valor += mm.valor; } }
    });
    MKEYS.forEach((k) => { out.m[k] = k === 'valor' ? out.m[k] : Math.round(out.m[k] * 10) / 10; });
    return out;
  }
  function ritmo(ini, fim) {
    const dias = diasUteis(ini, fim); if (!dias.length) return 1;
    if (fim < HOJE) return 1;
    const passados = dias.filter((d) => d < HOJE).length + (dias.indexOf(HOJE) >= 0 ? 0.18 : 0);
    return passados / dias.length;
  }
  const tomPct = (pct, rit) => (pct >= rit * 100 ? 'green' : pct >= rit * 80 ? 'amber' : 'red');
  function periodos(gran) {
    if (gran === 'mes') return ['2026-11', '2026-10', '2026-09', '2026-08', '2026-07', '2026-06'].map((m, i) => ({ value: m, label: fmt.mesAno(m + '-01') + (i === 0 ? ' (até hoje)' : ''), curto: util.MESES_CURTOS[+m.slice(5) - 1], ini: m + '-01', fim: fimMes(m) }));
    if (gran === 'semana') { const out = []; let seg = util.inicioSemana(App.HOJE); for (let i = 0; i < 8; i++) { const sx = util.addDias(seg, 4); out.push({ value: util.iso(seg), label: fmt.dataCurta(seg) + ' a ' + fmt.dataCurta(sx) + (i === 0 ? ' (esta semana)' : ''), curto: fmt.dataCurta(seg), ini: util.iso(seg), fim: util.iso(util.addDias(seg, 6)) }); seg = util.addDias(seg, -7); } return out; }
    const out = []; let d = util.parse(HOJE), g = 0;
    while (out.length < 10 && g++ < 30) { if (util.ehDiaUtil(d)) { const iso = util.iso(d); out.push({ value: iso, label: (out.length === 0 ? 'Hoje, ' : fmt.diaSemanaCurto(d) + ', ') + fmt.dataCurta(d) + (out.length === 0 ? ' (até 09:30)' : ''), curto: fmt.dataCurta(d), ini: iso, fim: iso }); } d = util.addDias(d, -1); }
    return out;
  }
  const padraoPainel = () => ({ gran: 'mes', ref: '2026-11', consultor: '', origem: '', segmento: '' });
  const stPainel = () => App.state.crmPainel || (App.state.crmPainel = padraoPainel());
  const numMeta = (k, v) => (k === 'valor' ? fmt.moedaCurta(v) : fmt.num(v, v > 0 && v < 10 && v % 1 ? 1 : 0));
  function celula(v, m, k, rit) {
    if (!m) return '<div class="m-crm-cell"><b class="lt-num">' + (k === 'valor' ? fmt.moedaCurta(v) : fmt.num(v)) + '</b></div>';
    const pct = 100 * v / m;
    return '<div class="m-crm-cell" title="' + fmt.pct(pct) + ' da meta"><span style="white-space:nowrap"><b class="lt-num">' + (k === 'valor' ? fmt.moedaCurta(v) : fmt.num(v)) + '</b> <span class="lt-muted lt-small lt-num">/ ' + numMeta(k, m) + '</span></span>' + ui.progress(v, m, tomPct(pct, rit)) + '</div>';
  }
  App.screen({
    id: 'crm.dashboard', hash: 'crm-painel', module: 'crm', title: 'Painel de indicadores', nav: true, navGroup: 'crm', navLabel: 'Painel do consultor', navOrder: 6,
    render: () => {
      const s = stPainel(), pers = periodos(s.gran), per = pers.find((p) => p.value === s.ref) || pers[0];
      const pids = s.consultor ? [+s.consultor] : C.consultores;
      const tot = apurar(pids, per.ini, per.fim, s, s.gran), rit = ritmo(per.ini, per.fim);
      const ritTxt = rit < 1 ? ' · ritmo esperado ' + fmt.pct(rit * 100) : '';
      const kpi = (k, label, icon, extra) => { const v = tot.v[k], m = tot.m[k], pct = m ? 100 * v / m : 0; return ui.kpi({ label, value: k === 'valor' ? fmt.moedaCurta(v) : fmt.num(v), icon, progress: m ? { value: v, max: m, tone: tomPct(pct, rit) } : null, foot: (m ? '<b class="' + (tomPct(pct, rit) === 'red' ? 'lt-danger' : tomPct(pct, rit) === 'amber' ? 'lt-warning' : 'lt-success') + '">' + fmt.pct(pct) + '</b> da meta de ' + numMeta(k, m) + ((k === 'contratos' || k === 'valor') && s.gran !== 'mes' ? ' (mês)' : '') : 'sem meta') + (extra || '') }); };
      const nr = tot.v.naoRealizadas + tot.v.reagendadas;
      const kpis = '<div class="lt-grid lt-grid--4">' + kpi('ligacoes', 'Ligações feitas', 'phone') + kpi('agendadas', 'Reuniões agendadas', 'calendar') + kpi('realizadas', 'Reuniões realizadas', 'users') +
        ui.kpi({ label: 'Não realizadas e reagendadas', value: fmt.num(nr), icon: 'refresh', foot: fmt.plural(tot.v.naoRealizadas, 'não realizada', 'não realizadas') + ' · ' + fmt.plural(tot.v.reagendadas, 'reagendada') + ' · ' + fmt.pct(tot.v.agendadas ? 100 * nr / tot.v.agendadas : 0) + ' das agendadas' }) +
        kpi('cartas', 'Cartas propostas enviadas', 'send') + kpi('apresentacoes', 'Apresentações realizadas', 'presentation') + kpi('contratos', 'Contratos fechados', 'file-text') + kpi('valor', 'Crédito contratado', 'dollar', '<br><span title="Fee de 12 meses + êxito estimado sobre o crédito">Honorários contratados: <b class="lt-num">' + fmt.moedaCurta(tot.v.honor) + '</b></span>') + '</div>';
      const serie = pers.slice(0, s.gran === 'mes' ? 6 : s.gran === 'semana' ? 8 : 10).reverse();
      const grafLig = ui.chart.bar({ labels: serie.map((p) => p.curto), stacked: true, height: 210, series: pids.map((pid) => ({ name: nome1(pid), values: serie.map((p) => apurar([pid], p.ini, p.fim, s, s.gran).v.ligacoes) })) });
      const porPessoa = pids.map((pid) => ({ pid, a: apurar([pid], per.ini, per.fim, s, s.gran) }));
      const grafReu = ui.chart.bar({ labels: porPessoa.map((x) => nome1(x.pid)), width: 430, height: 230, showValues: true, series: [{ name: 'Agendadas', values: porPessoa.map((x) => x.a.v.agendadas) }, { name: 'Realizadas', values: porPessoa.map((x) => x.a.v.realizadas) }, { name: 'Não realizadas e reagendadas', values: porPessoa.map((x) => x.a.v.naoRealizadas + x.a.v.reagendadas) }] });
      const linhas = porPessoa.map((x) => { const pcts = MKEYS.filter((k) => x.a.m[k]).map((k) => Math.min(150, 100 * x.a.v[k] / x.a.m[k])), med = pcts.length ? util.soma(pcts) / pcts.length : 0; return '<tr><td>' + ui.person(x.pid, esc(pessoa(x.pid).cargoCurto)) + '</td>' + ['ligacoes', 'agendadas', 'realizadas'].map((k) => '<td>' + celula(x.a.v[k], x.a.m[k], k, rit) + '</td>').join('') + '<td><div class="m-crm-cell"><span><b class="lt-num">' + (x.a.v.naoRealizadas + x.a.v.reagendadas) + '</b></span><span class="lt-small lt-muted" style="white-space:nowrap">' + x.a.v.naoRealizadas + ' não · ' + x.a.v.reagendadas + ' reag.</span></div></td>' + ['cartas', 'apresentacoes', 'contratos', 'valor'].map((k) => '<td>' + celula(x.a.v[k], x.a.m[k], k, rit) + '</td>').join('') + '<td>' + ui.chip(fmt.pct(med), tomPct(med, rit)) + '</td></tr>'; }).join('');
      const tabela = '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact"><thead><tr><th>Consultor</th><th>Ligações</th><th>Agendadas</th><th>Realizadas</th><th>Não realiz. e reag.</th><th>Cartas</th><th>Apresent.</th><th>Contratos</th><th>Crédito contratado</th><th>Média</th></tr></thead><tbody>' + linhas + '</tbody></table></div><div class="lt-pagination"><span>Barra verde: no ritmo da meta' + ritTxt + '. Âmbar: até 20% abaixo. Vermelha: mais de 20% abaixo.</span><span>Metas proporcionais aos dias úteis do período · contratos e crédito contratado pela meta do mês</span></div></div>';
      const ctrl = ui.segmented([{ label: 'Diário', value: 'dia', active: s.gran === 'dia' }, { label: 'Semanal', value: 'semana', active: s.gran === 'semana' }, { label: 'Mensal', value: 'mes', active: s.gran === 'mes' }], { name: 'crm-gran' }) +
        '<select class="lt-select" data-crm-ref style="height:34px;width:auto;min-width:210px" aria-label="Período">' + pers.map((p) => '<option value="' + p.value + '"' + (p.value === per.value ? ' selected' : '') + '>' + esc(p.label) + '</option>').join('') + '</select>';
      return ui.pageHeader({ breadcrumb: crumbsCrm('Painel do consultor'), title: 'Painel de indicadores', sub: 'Produção por consultor com acompanhamento diário, semanal e mensal, comparada com a meta de cada indicador (proposta 3.1).', actions: ctrl + btnExportar('painel-consultores-' + per.value + '.xlsx') }) +
        ui.filters({ selects: [{ label: 'Consultor', name: 'consultor', options: optsConsultor(), value: s.consultor }, { label: 'Origem', name: 'origem', options: optsLista('origens'), value: s.origem }, { label: 'Segmento', name: 'segmento', options: optsLista('segmentos'), value: s.segmento }], extra: '<span class="lt-small lt-muted">' + esc(per.label) + ' · ' + fmt.plural(diasUteis(per.ini, per.fim).length, 'dia útil', 'dias úteis') + ritTxt + '</span>' }) +
        kpis + '<div class="lt-g12 lt-mt-6"><div class="lt-c7">' + ui.card({ title: 'Ligações por ' + ({ mes: 'mês', semana: 'semana', dia: 'dia' })[s.gran], icon: 'chart-bar', sub: 'Empilhado por consultor', body: grafLig }) + '</div><div class="lt-c5">' + ui.card({ title: 'Reuniões no período', icon: 'users', sub: esc(per.label), body: grafReu }) + '</div></div>' +
        '<div class="lt-mt-6">' + ui.card({ title: 'Indicadores por consultor', icon: 'target', sub: 'Feito / meta do período. Metas em <a href="#crm-metas">Metas e fechamento</a>.', flush: true, body: tabela }) + '</div>';
    },
    mount: (root) => {
      root = escopo(root);
      const s = stPainel();
      root.addEventListener('lt:segment', (e) => { if (e.detail.name !== 'crm-gran') return; s.gran = e.detail.value; s.ref = periodos(s.gran)[0].value; App.refresh(); });
      root.querySelector('[data-crm-ref]').addEventListener('change', (e) => { s.ref = e.target.value; App.refresh(); });
      root.addEventListener('change', (e) => { const sel = e.target.closest('.lt-filters select[name]'); if (!sel) return; s[sel.name] = sel.value; App.refresh(); });
    }
  });

  /* ---------- Metas e fechamento mensal ---------- */
  const stMetas = () => App.state.crmMetas || (App.state.crmMetas = { mes: '2026-11', fech: '2026-10' });
  const MESES_META = ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
  function gradeMetas(mes) {
    const M = C.metas[mes] || {}, mesAtual = HOJE.slice(0, 7), temReal = mes <= mesAtual;
    const ini = mes + '-01', fim = mes === mesAtual ? HOJE : fimMes(mes), rit = ritmo(ini, fimMes(mes));
    const cab = '<tr><th>Consultor</th>' + MKEYS.map((k) => '<th class="lt-num">' + esc(IND[k].curto) + '</th>').join('') + '</tr>';
    const linhas = C.consultores.map((pid) => {
      const a = temReal ? apurar([pid], ini, fim, {}, 'mes') : null;
      return '<tr><td>' + ui.person(pid, esc(pessoa(pid).cargoCurto)) + '</td>' + MKEYS.map((k) => {
        const val = (M[pid] || {})[k] || 0, real = a ? a.v[k] : null, pct = real != null && val ? 100 * real / val : null;
        return '<td class="lt-num"><input class="lt-input lt-input--num m-crm-goal' + (k === 'valor' ? ' m-crm-goal--money' : '') + '" inputmode="numeric" value="' + (k === 'valor' ? fmt.num(val) : val) + '" data-crm-meta="' + pid + ':' + k + '" aria-label="Meta de ' + esc(IND[k].nome) + ' · ' + esc(pessoa(pid).nome) + '">' + (real != null ? '<span class="lt-table__secondary lt-num">feito ' + (k === 'valor' ? fmt.moedaCurta(real) : real) + (pct != null ? ' · <b class="' + (tomPct(pct, rit) === 'red' ? 'lt-danger' : tomPct(pct, rit) === 'amber' ? 'lt-warning' : 'lt-success') + '">' + fmt.pct(pct) + '</b>' : '') + '</span>' : '') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    const tot = '<tr><td><b>Equipe</b></td>' + MKEYS.map((k) => { const t = util.soma(C.consultores, (pid) => ((M[pid] || {})[k] || 0)); return '<td class="lt-num"><b data-crm-tot="' + k + '">' + (k === 'valor' ? fmt.moedaCurta(t) : fmt.num(t)) + '</b></td>'; }).join('') + '</tr>';
    return '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact"><thead>' + cab + '</thead><tbody>' + linhas + '</tbody><tfoot>' + tot + '</tfoot></table></div>' +
      '<div class="lt-pagination"><span>' + (mes === mesAtual ? 'Mês em andamento: ritmo esperado de ' + fmt.pct(rit * 100) + ' até hoje.' : mes < mesAtual ? 'Mês encerrado: veja o fechamento na outra aba.' : 'Mês futuro: ainda sem produção.') + '</span><span>Última alteração: Ricardo Fontana · 31/10 17:58 · Reuniões realizadas (Thiago): 12 → 10</span></div></div>';
  }
  function fechamento(mes) {
    const ini = mes + '-01', fim = fimMes(mes);
    const res = C.consultores.map((pid) => { const a = apurar([pid], ini, fim, {}, 'mes'), M = (C.metas[mes] || {})[pid] || {}; const pcts = {}; MKEYS.forEach((k) => { pcts[k] = M[k] ? 100 * a.v[k] / M[k] : null; }); const bateu = MKEYS.filter((k) => pcts[k] != null && pcts[k] >= 100); return { pid, a, M, pcts, bateu, atingiu: bateu.length === MKEYS.length }; });
    const ok = res.filter((r) => r.atingiu), nao = res.filter((r) => !r.atingiu);
    const medInd = MKEYS.map((k) => ({ k, med: util.soma(res, (r) => Math.min(150, r.pcts[k] || 0)) / res.length })).sort((a, b) => a.med - b.med);
    const medGeral = util.soma(res, (r) => util.soma(MKEYS, (k) => Math.min(150, r.pcts[k] || 0)) / MKEYS.length) / res.length;
    const ct = util.soma(res, (r) => r.a.v.contratos), vl = util.soma(res, (r) => r.a.v.valor);
    const chipPct = (p) => (p == null ? '<span class="lt-muted">—</span>' : ui.chip(fmt.pct(p), p >= 100 ? 'green' : p >= 80 ? 'amber' : 'red'));
    const item = (r) => ({ lead: ui.avatar(r.pid, 'sm'), title: esc(pessoa(r.pid).nome), meta: r.bateu.length + ' de ' + MKEYS.length + ' indicadores' + (r.atingiu ? '' : ' · faltou: ' + esc(MKEYS.filter((k) => r.bateu.indexOf(k) < 0).map((k) => IND[k].curto.toLowerCase()).join(', '))), aside: ui.chip(fmt.pct(util.soma(MKEYS, (k) => Math.min(150, r.pcts[k] || 0)) / MKEYS.length), r.atingiu ? 'green' : 'amber') });
    return ui.kpis([{ label: 'Atingiram todas as metas', value: ok.length + ' de ' + res.length, icon: 'target', progress: { value: ok.length, max: res.length, tone: 'green' } }, { label: 'Atingimento médio', value: fmt.pct(medGeral), icon: 'chart-line', foot: 'média dos indicadores (limite de 150%)' }, { label: 'Indicador mais difícil', value: IND[medInd[0].k].curto, icon: 'alert-triangle', foot: fmt.pct(medInd[0].med) + ' de atingimento médio' }, { label: 'Contratos fechados', value: String(ct), icon: 'file-text', foot: fmt.moedaCurta(vl) + ' de crédito contratado · ' + fmt.moedaCurta(util.soma(res, (r) => r.a.v.honor)) + ' em honorários contratados' }]) +
      '<div class="lt-g12 lt-mt-6"><div class="lt-c6">' + ui.card({ title: 'Atingiram as metas', icon: 'check-circle', flush: true, body: ui.list(ok.map(item), { empty: { icon: 'target', title: 'Ninguém atingiu todas as metas' } }) }) + '</div><div class="lt-c6">' + ui.card({ title: 'Não atingiram as metas', icon: 'x-circle', flush: true, body: ui.list(nao.map(item), { empty: { icon: 'check-circle', title: 'Todos atingiram' } }) }) + '</div></div>' +
      '<div class="lt-mt-6">' + ui.card({ title: 'Percentual de atingimento por indicador', icon: 'target', sub: esc(C.regraFechamento) + ' (a confirmar: Q8)', flush: true, body: '<div class="lt-table-wrap" style="border:0;border-radius:0"><table class="lt-table lt-table--compact"><thead><tr><th>Consultor</th>' + MKEYS.map((k) => '<th>' + esc(IND[k].curto) + '</th>').join('') + '<th>Resultado</th></tr></thead><tbody>' +
        res.map((r) => '<tr><td>' + ui.person(r.pid) + '</td>' + MKEYS.map((k) => '<td><span class="lt-num lt-small">' + (k === 'valor' ? fmt.moedaCurta(r.a.v[k]) : r.a.v[k]) + ' / ' + (k === 'valor' ? fmt.moedaCurta(r.M[k]) : r.M[k]) + '</span><div>' + chipPct(r.pcts[k]) + '</div></td>').join('') + '<td>' + (r.atingiu ? ui.chip('Atingiu', 'green', { icon: 'check-circle' }) : ui.chip('Não atingiu', 'red', { icon: 'x-circle' })) + '</td></tr>').join('') + '</tbody></table></div>' }) + '</div>';
  }
  App.screen({
    id: 'crm.goals', hash: 'crm-metas', module: 'crm', title: 'Metas e fechamento mensal', nav: true, navGroup: 'crm', navLabel: 'Metas', navOrder: 7,
    render: () => {
      const s = stMetas(), ant = MESES_META[MESES_META.indexOf(s.mes) - 1];
      const selMes = (name, val, lista) => '<select class="lt-select" data-crm-sel="' + name + '" style="height:34px;width:auto;min-width:190px" aria-label="Mês">' + lista.map((m) => '<option value="' + m + '"' + (m === val ? ' selected' : '') + '>' + esc(fmt.mesAno(m + '-01')) + '</option>').join('') + '</select>';
      const abaMetas = '<div class="lt-row lt-row--between lt-mb-4"><div class="lt-row">' + selMes('mes', s.mes, MESES_META) + (ant ? ui.btn({ label: 'Copiar de ' + fmt.mesAno(ant + '-01').split(' ')[0].toLowerCase(), icon: 'copy', size: 'sm', acao: 'copiar', toast: 'Metas copiadas', toastText: 'Valores de ' + esc(fmt.mesAno(ant + '-01')) + ' aplicados. Revise e salve.', attrs: { 'data-crm-copiar': ant } }) : '') + '</div>' + ui.btn({ label: 'Salvar metas', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Metas salvas', toastText: esc(fmt.mesAno(s.mes + '-01')) + ' · a alteração ficou na auditoria.' }) + '</div>' +
        '<div data-crm-grade>' + gradeMetas(s.mes) + '</div>' + '<div class="lt-mt-4">' + ui.callout({ tone: 'info', title: 'Indicadores e valores a definir com a Atlas', text: 'A proposta deixa os indicadores com meta e seus valores para a etapa de alinhamento (pergunta Q8). Os números são sugestão para aprovar a tela. "Não realizadas" e "reagendadas" ficam sem meta: são acompanhadas como taxa no painel. A meta de valor usa o crédito contratado; se a Atlas preferir os honorários contratados (fee de 12 meses + êxito estimado), a troca também entra na Q8.' }) + '</div>';
      const abaFech = '<div class="lt-row lt-row--between lt-mb-4"><div class="lt-row">' + selMes('fech', s.fech, MESES_META.filter((m) => m < HOJE.slice(0, 7))) + '<span class="lt-small lt-muted">Relatório de fechamento mensal (proposta 3.2)</span></div><div class="lt-row">' + btnExportar('fechamento-' + s.fech + '.xlsx') + ui.btn({ label: 'Enviar à equipe', icon: 'send', acao: 'enviar', toast: 'Relatório enviado', toastText: 'Enviado por e-mail aos consultores e ao gestor comercial.', confirm: 'Enviar o fechamento à equipe?', confirmText: 'Os 4 consultores e o gestor comercial recebem o relatório por e-mail, com o resultado de cada um.', confirmLabel: 'Enviar', attrs: { 'data-confirm-tone': 'primary' } }) + '</div></div>' + fechamento(s.fech);
      return ui.pageHeader({ breadcrumb: crumbsCrm('Metas'), title: 'Metas e fechamento mensal', sub: 'Meta mensal de cada indicador por consultor e o relatório de quem atingiu e quem não atingiu.' }) +
        ui.tabs({ id: 'crm-metas', tabs: [{ key: 'metas', label: 'Metas do mês', icon: 'target', content: abaMetas }, { key: 'fechamento', label: 'Fechamento mensal', icon: 'check-circle', content: abaFech }] });
    },
    mount: (root) => {
      root = escopo(root);
      const s = stMetas();
      root.addEventListener('change', (e) => {
        const sel = e.target.closest('[data-crm-sel]'); if (sel) { s[sel.getAttribute('data-crm-sel')] = sel.value; App.refresh(); return; }
        const inp = e.target.closest('[data-crm-meta]'); if (!inp) return;
        const pk = inp.getAttribute('data-crm-meta').split(':'), v = +String(inp.value).replace(/\./g, '').replace(',', '.') || 0;
        C.metas[s.mes] = C.metas[s.mes] || {}; C.metas[s.mes][pk[0]] = C.metas[s.mes][pk[0]] || {}; C.metas[s.mes][pk[0]][pk[1]] = v;
        const t = util.soma(C.consultores, (pid) => ((C.metas[s.mes][pid] || {})[pk[1]] || 0)), el = root.querySelector('[data-crm-tot="' + pk[1] + '"]'); if (el) el.textContent = pk[1] === 'valor' ? fmt.moedaCurta(t) : fmt.num(t);
      });
      root.addEventListener('lt:acao', (e) => { const b = e.target.closest('[data-crm-copiar]'); if (!b) return; const ant = b.getAttribute('data-crm-copiar'); C.metas[s.mes] = JSON.parse(JSON.stringify(C.metas[ant] || {})); root.querySelector('[data-crm-grade]').innerHTML = gradeMetas(s.mes); });
    }
  });

  /* ---------- Gargalos do funil ---------- */
  const padraoGarg = () => ({ periodo: '90', consultor: '', origem: '', segmento: '', x: 10, usarSla: true });
  const stGarg = () => App.state.crmGarg || (App.state.crmGarg = padraoGarg());
  function tabelaParados() {
    const s = stGarg();
    const rows = filtraNegocios(abertos(), s).filter((n) => (s.usarSla ? parado(n) : diasEtapa(n) > (+s.x || 0))).sort((a, b) => diasEtapa(b) - diasEtapa(a));
    return ui.table({ compact: true, rows, rowHref: (n) => '#crm-negocio-' + n.id, empty: { icon: 'check-circle', title: 'Nenhum negócio parado', text: 'Todos dentro do limite escolhido.' },
      columns: [
        { label: 'Negócio e etapa', key: 'empresaId', render: (n) => '<span class="lt-table__primary">' + esc(emp(n.empresaId).fantasia) + '</span><span class="lt-table__secondary" style="white-space:nowrap">' + ui.chip('Etapa ' + etapaDe(n).num, etapaDe(n).tone, { dot: true }) + ' ' + esc(etapaDe(n).nome) + '</span>' },
        { label: 'Parado', key: 'dias', align: 'right', render: (n) => '<span class="lt-num lt-danger lt-strong" style="white-space:nowrap">' + diasEtapa(n) + ' dias</span><span class="lt-table__secondary" style="white-space:nowrap">SLA de ' + etapaDe(n).sla + ' d</span>' },
        { label: 'Consultor', key: 'consultorId', render: (n) => ui.avatar(n.consultorId, 'sm') },
        { label: 'Próxima tarefa', key: 'prox', render: (n) => '<div style="max-width:230px">' + proxHtml(n) + '</div>' }
      ],
      rowActions: (n) => ui.btn({ icon: 'arrow-right', variant: 'ghost', size: 'xs', tip: 'Mover etapa', dialog: 'crm-mover-etapa', attrs: { 'data-id': n.id } }) });
  }
  App.screen({
    id: 'crm.bottlenecks', hash: 'crm-gargalos', module: 'crm', title: 'Gargalos do funil', nav: true, navGroup: 'crm', navLabel: 'Gargalos', navOrder: 8,
    render: () => {
      const s = stGarg(), dias = +s.periodo, ini = util.iso(util.addDias(App.HOJE, -dias)), pids = s.consultor ? [+s.consultor] : C.consultores;
      const iniAnt = util.iso(util.addDias(App.HOJE, -2 * dias)), fimAnt = util.iso(util.addDias(App.HOJE, -dias - 1));
      const a = apurar(pids, ini, HOJE, s, 'mes'), b = apurar(pids, iniAnt, fimAnt, s, 'mes');
      const taxa = (x, y) => (y ? 100 * x / y : 0);
      /* Base "negócios": entradas de etapa no período (histórico de movimentos), as mesmas do funil e da ficha */
      const baseNeg = filtraNegocios(D.negocios, s);
      const entrou = (k, de, ate) => baseNeg.filter((n) => C.movimentos.some((m) => m.negocioId === n.id && String(m.para) === String(k) && m.em.slice(0, 10) >= de && m.em.slice(0, 10) <= ate));
      const conv2 = (k1, k2, de, ate) => { const l = entrou(k1, de, ate); return [l.filter((n) => (k2 === 'ganho' ? n.desfecho === 'ganho' : maxEtapa(n) >= k2)).length, l.length]; };
      const r5 = conv2(5, 7, ini, HOJE), r5b = conv2(5, 7, iniAnt, fimAnt), r9 = conv2(9, 'ganho', ini, HOJE), r9b = conv2(9, 'ganho', iniAnt, fimAnt);
      const conv = [
        ['Ligações → reuniões agendadas', 'Base: atividades · prospecção', taxa(a.v.agendadas, a.v.ligacoes), taxa(b.v.agendadas, b.v.ligacoes), a.v.agendadas + ' de ' + fmt.num(a.v.ligacoes) + ' ligações', 'phone'],
        ['Agendadas → realizadas', 'Base: atividades · não comparecimento ' + fmt.pct(taxa(a.v.naoRealizadas, a.v.agendadas)), taxa(a.v.realizadas, a.v.agendadas), taxa(b.v.realizadas, b.v.agendadas), a.v.realizadas + ' de ' + a.v.agendadas + ' agendadas', 'users'],
        ['Reunião realizada → documentos', 'Base: negócios · aceite da proposta', taxa(r5[0], r5[1]), taxa(r5b[0], r5b[1]), r5[0] + ' de ' + fmt.plural(r5[1], 'negócio') + ' que entraram na etapa 5', 'paperclip'],
        ['Apresentação → contrato', 'Base: negócios · taxa de fechamento', taxa(r9[0], r9[1]), taxa(r9b[0], r9b[1]), r9[0] + ' de ' + fmt.plural(r9[1], 'negócio') + ' que entraram na etapa 9', 'file-text']
      ];
      const kpis = ui.kpis(conv.map((c) => { const d = c[2] - c[3]; return { label: c[0], value: fmt.pct(c[2], 1), icon: c[5], delta: (d >= 0 ? '+' : '') + fmt.num(d, 1) + ' p.p.', dir: Math.abs(d) < 0.5 ? 'flat' : d > 0 ? 'up' : 'down', foot: esc(c[1]) + ' · ' + esc(c[4]) }; }));
      const negs = filtraNegocios(D.negocios.filter((n) => n.criadoEm >= '2026-01-01'), s);
      const chegou = (k) => negs.filter((n) => maxEtapa(n) >= k).length;
      const fun = ABERTAS.map((e, i) => { const v = chegou(e.num), ant = i ? chegou(e.num - 1) : v; return { label: e.num + ' · ' + e.nome, value: v, sub: i ? fmt.pct(taxa(v, ant)) : '', color: 'var(--tone-' + e.tone + '-solid)' }; });
      fun.push({ label: '10 · Ganho', value: negs.filter((n) => n.desfecho === 'ganho').length, sub: fmt.pct(taxa(negs.filter((n) => n.desfecho === 'ganho').length, chegou(9))), color: 'var(--tone-green-solid)' });
      /* Tempo em cada etapa (base: negócios): permanências encerradas no período + as que ainda estão abertas */
      const tempo = ABERTAS.map((e) => {
        const l = C.movimentos.filter((m) => m.de === e.num && m.dias != null && m.em.slice(0, 10) >= ini && baseNeg.some((n) => n.id === m.negocioId)).map((m) => m.dias)
          .concat(baseNeg.filter((n) => aberto(n) && n.etapa === e.num).map(diasEtapa));
        return { num: e.num, media: l.length ? util.soma(l) / l.length : 0, amostra: l.length };
      });
      const acima = tempo.filter((t) => t.amostra && t.media > (db.etapa(t.num).sla || 99));
      const grafTempo = ui.chart.bar({ labels: tempo.map((t) => String(t.num)), height: 200, format: (v) => fmt.num(v, 0) + ' d', series: [{ name: 'Tempo médio na etapa (dias)', values: tempo.map((t) => Math.round(t.media * 10) / 10) }, { name: 'SLA da etapa (referência)', values: tempo.map((t) => db.etapa(t.num).sla || 0), color: 'var(--chart-2)' }] });
      const sem = filtraNegocios(abertos(), s).filter(semProxima);
      /* Perdas e descartes dos últimos 6 meses: dos próprios negócios, com o motivo obrigatório do diálogo "Mover etapa" */
      const ini6 = util.iso(util.addDias(App.HOJE, -183));
      const motivos = (k) => { const g = util.agrupar(baseNeg.filter((n) => n.desfecho === k && n.fechadoEm >= ini6), (n) => n.motivoPerda || 'Motivo não informado'); return Object.keys(g).map((m) => ({ motivo: m, qtd: g[m].length, negs: g[m] })).sort((x, y) => y.qtd - x.qtd); };
      const perdas = motivos('perdido'), descartes = motivos('descartado'), totP = util.soma(perdas, (x) => x.qtd), totD = util.soma(descartes, (x) => x.qtd);
      const nomes = (l) => [].concat.apply([], l.map((x) => x.negs)).map((n) => esc(emp(n.empresaId).fantasia) + ' em ' + fmt.dataCurta(n.fechadoEm)).join(', ');
      const amostra = (l, n, um, varios) => '<p class="lt-hint lt-mt-4" style="margin-bottom:0">' + (n && n < 5 ? 'Amostra pequena: ' + fmt.plural(n, um, varios) + ' em 6 meses (' + nomes(l) + '). ' : '') + 'Base: negócios do funil, com o motivo obrigatório do diálogo "Mover etapa".</p>';
      const ctrlParados = '<div class="lt-row" style="gap:12px"><label class="lt-toggle lt-toggle--sm"><input type="checkbox" data-crm-sla' + (s.usarSla ? ' checked' : '') + '><span class="lt-toggle__track"></span><span class="lt-small">Usar o SLA de cada etapa</span></label><label class="lt-row lt-row--nowrap lt-small" style="gap:6px">Parados há mais de<input class="lt-input lt-input--num" type="number" min="1" data-crm-x value="' + s.x + '" style="width:64px;height:30px"' + (s.usarSla ? ' disabled' : '') + '>dias</label></div>';
      return ui.pageHeader({ breadcrumb: crumbsCrm('Gargalos'), title: 'Gargalos do funil', sub: 'Onde os negócios travam: conversão entre fases, tempo parado por etapa, negócios sem próxima tarefa e motivos de perda (proposta 3.3).', actions: btnExportar('gargalos-' + HOJE + '.xlsx') }) +
        ui.filters({ selects: [{ label: 'Período', name: 'periodo', options: [{ value: '30', label: 'Últimos 30 dias' }, { value: '90', label: 'Últimos 90 dias' }, { value: '150', label: 'Últimos 150 dias' }], value: s.periodo }, { label: 'Consultor', name: 'consultor', options: optsConsultor(), value: s.consultor }, { label: 'Origem', name: 'origem', options: optsLista('origens'), value: s.origem }, { label: 'Segmento', name: 'segmento', options: optsLista('segmentos'), value: s.segmento }], extra: '<span class="lt-small lt-muted">Comparação com os ' + dias + ' dias anteriores</span>' }) +
        kpis +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c6">' + ui.card({ title: 'Conversão por etapa', icon: 'filter', sub: 'Negócios criados em 2026 que chegaram a cada etapa · % sobre a anterior', body: ui.chart.funnel(fun) }) + '</div>' +
        '<div class="lt-c6">' + ui.card({ title: 'Tempo médio em cada etapa', icon: 'hourglass', sub: 'Últimos ' + dias + ' dias · etapas 1 a 9 · base: negócios · SLA em grafite, só como referência', body: grafTempo + '<div class="lt-stack lt-stack--sm lt-mt-4">' + acima.map((t) => '<div class="lt-row lt-row--between lt-small"><span>' + chipDe(t.num, false) + '</span><span class="lt-danger lt-strong lt-num">' + fmt.num(t.media, 1) + ' d · SLA ' + db.etapa(t.num).sla + ' d</span></div>').join('') + '</div>' }) + '</div></div>' +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c8">' + ui.card({ title: 'Negócios parados', icon: 'hourglass', sub: 'Mesma regra da AUT-10 (alerta ao consultor e ao gestor)', actions: ctrlParados, flush: true, body: '<div data-crm-parados>' + tabelaParados() + '</div>' }) + '</div>' +
        '<div class="lt-c4">' + ui.card({ title: 'Leads sem próxima tarefa', icon: 'alert-circle', sub: 'Regra 2.5 · aviso da AUT-11', flush: true, body: ui.list(sem.map((n) => ({ icon: 'alert-circle', tone: 'amber', title: esc(emp(n.empresaId).fantasia), meta: esc(etapaDe(n).num + ' · ' + etapaDe(n).nome) + ' · ' + esc(nome1(n.consultorId)), href: '#crm-negocio-' + n.id })), { empty: { icon: 'check-circle', title: 'Todos com próxima tarefa' } }) }) + '</div></div>' +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c6">' + ui.card({ title: 'Motivos de perda mais frequentes', icon: 'pie', sub: 'Últimos 6 meses · ' + fmt.plural(totP, 'negócio perdido', 'negócios perdidos'), body: (totP ? ui.chart.donut({ items: perdas.map((x) => ({ label: x.motivo, value: x.qtd })), centerValue: String(totP), centerLabel: totP === 1 ? 'perda' : 'perdas', size: 170 }) : ui.empty({ small: true, icon: 'check-circle', title: 'Nenhuma perda no período' })) + amostra(perdas, totP, 'negócio perdido', 'negócios perdidos') }) + '</div>' +
        '<div class="lt-c6">' + ui.card({ title: 'Motivos de descarte na qualificação', icon: 'minus-circle', sub: 'Últimos 6 meses · ' + fmt.plural(totD, 'lead descartado', 'leads descartados'), body: (totD ? ui.chart.funnel(descartes.map((x) => ({ label: x.motivo, value: x.qtd, color: 'var(--tone-slate-solid)' }))) : ui.empty({ small: true, icon: 'check-circle', title: 'Nenhum descarte no período' })) + amostra(descartes, totD, 'lead descartado', 'leads descartados') }) + '</div></div>';
    },
    mount: (root) => {
      root = escopo(root);
      const s = stGarg();
      root.addEventListener('change', (e) => {
        const sel = e.target.closest('.lt-filters select[name]'); if (sel) { s[sel.name] = sel.value; App.refresh(); return; }
        if (e.target.matches('[data-crm-sla]')) { s.usarSla = e.target.checked; root.querySelector('[data-crm-x]').disabled = s.usarSla; redesenhar(root, '[data-crm-parados]', tabelaParados); }
        if (e.target.matches('[data-crm-x]')) { s.x = +e.target.value || 1; redesenhar(root, '[data-crm-parados]', tabelaParados); }
      });
    }
  });

  /* ---------- Automações comerciais ---------- */
  const ORDEM_AUT = [['AUT-01', '1'], ['AUT-02', '2'], ['AUT-03', '3'], ['AUT-04', '4'], ['AUT-05', '5'], ['AUT-06', '6'], ['AUT-07', '7'], ['AUT-08', '8'], ['AUT-09', '9'], ['AUT-10', '10'], ['AUT-11', '2.5'], ['AUT-15', 'Q3'], ['AUT-21', 'Base']];
  function paramHtml(f, p) {
    if (p.tipo === 'toggle') return '<label class="lt-toggle lt-toggle--sm" title="' + esc(p.label) + '"><input type="checkbox" data-crm-param="' + f.id + ':' + p.key + '"' + (p.valor ? ' checked' : '') + '><span class="lt-toggle__track"></span><span class="lt-small">' + esc(p.label) + '</span></label>';
    if (/:/.test(String(p.valor))) return '<label class="lt-row lt-row--nowrap lt-small" style="gap:6px"><span class="lt-muted">' + esc(p.label) + '</span><input class="lt-input" type="time" value="' + esc(p.valor) + '" data-crm-param="' + f.id + ':' + p.key + '" style="width:104px;height:30px"></label>';
    return '<label class="lt-row lt-row--nowrap lt-small" style="gap:6px"><span class="lt-muted">' + esc(p.label) + '</span><input class="lt-input lt-input--num" type="number" min="1" value="' + esc(p.valor) + '" data-crm-param="' + f.id + ':' + p.key + '" style="width:62px;height:30px"><span class="lt-muted">' + esc(p.unidade || '') + '</span></label>';
  }
  const comX = (txt, f) => esc(txt).replace(/\[(\d+)\]/g, (m, v) => { const p = (f.params || []).find((x) => String(x.valor) === v); return '<b class="lt-gold lt-num" data-crm-x-de="' + f.id + ':' + (p ? p.key : '') + '">' + v + '</b>'; });
  App.screen({
    id: 'crm.automations', hash: 'crm-automacoes', module: 'crm', title: 'Automações comerciais', nav: true, navGroup: 'crm', navLabel: 'Automações', navOrder: 9,
    render: () => {
      /* AUT-15 cuida só do encaminhamento ao Jurídico; o contrato no Financeiro é criado no próprio ganho (AUT-21). Textos vêm de D.fluxos. */
      const fl = ORDEM_AUT.map((o) => { const f = D.fluxos.find((x) => x.codigo === o[0]); return f ? Object.assign({ ref: o[1] }, f) : null; }).filter(Boolean);
      const lig = fl.filter((f) => f.ligado).length;
      const linhas = fl.map((f) => {
        const real = D.fluxos.find((x) => x.id === f.id);
        return '<tr class="' + (real.ligado ? '' : 'is-muted') + '" data-crm-aut="' + f.id + '"><td><span class="lt-code">' + esc(f.codigo) + '</span><span class="lt-table__secondary">' + (/^\d/.test(f.ref) ? 'proposta 2.' + (f.ref === '2.5' ? '5' : '4 · ' + f.ref) : f.ref === 'Q3' ? 'pendência Q3' : 'padrão da base') + '</span></td>' +
          '<td style="white-space:normal;min-width:180px"><span class="lt-table__primary">' + esc(f.nome) + '</span><span class="lt-table__secondary">' + I('zap') + ' ' + comX(f.gatilhoTxt, f) + '</span></td>' +
          '<td class="lt-small lt-text-2" style="white-space:normal;min-width:200px">' + comX(f.acaoTxt, f) + '</td>' +
          '<td><div class="lt-stack lt-stack--sm">' + (f.params.length ? f.params.map((p) => paramHtml(f, p)).join('') : '<span class="lt-small lt-muted">Sem parâmetro</span>') + '</div></td>' +
          '<td><label class="lt-toggle lt-toggle--sm" title="Ligar ou desligar"><input type="checkbox" data-crm-liga="' + f.id + '"' + (real.ligado ? ' checked' : '') + '><span class="lt-toggle__track"></span></label></td>' +
          '<td class="lt-num"><span class="lt-row lt-row--nowrap" style="gap:4px">' + ui.chip(String(f.exec7d), 'green', { title: 'Rodou' }) + ui.chip(String(f.naoRodou7d), 'gray', { title: 'Não rodou (condição)' }) + (f.falhas7d ? ui.chip(String(f.falhas7d), 'red', { title: 'Falhou' }) : '') + '</span><span class="lt-table__secondary">' + (f.ultimaExec ? esc(fmt.quando(f.ultimaExec)) : 'nunca rodou') + '</span></td>' +
          '<td class="lt-table__actions"><div class="lt-row lt-row--nowrap" style="gap:2px"><a class="lt-btn lt-btn--ghost lt-btn--xs" href="#fluxos-diagrama-' + f.id + '">' + I('git-branch') + '<span>Diagrama</span></a></div></td></tr>';
      }).join('');
      return ui.pageHeader({ breadcrumb: crumbsCrm('Automações'), title: 'Automações comerciais', sub: 'As regras da proposta (2.4 e 2.5): quando acontece um evento, o sistema cria a tarefa ou o alerta. Os prazos [X] são editáveis aqui; o passo a passo de cada uma está no painel Fluxos.', actions: '<a class="lt-btn" href="#fluxos">' + I('workflow') + '<span>Painel Fluxos</span></a>' + ui.btn({ label: 'Salvar parâmetros', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Parâmetros salvos', toastText: 'Valem a partir do próximo gatilho. A mudança ficou na auditoria.' }) }) +
        ui.kpis([{ label: 'Regras ligadas', value: lig + ' de ' + fl.length, icon: 'power', progress: { value: lig, max: fl.length, tone: 'green' } }, { label: 'Rodaram (7 dias)', value: fmt.num(util.soma(fl, (f) => f.exec7d)), icon: 'check-circle' }, { label: 'Não rodaram (condição)', value: fmt.num(util.soma(fl, (f) => f.naoRodou7d)), icon: 'minus-circle', foot: '<a href="#fluxos-execucao-9102">veja o porquê</a>' }, { label: 'Falhas (7 dias)', value: fmt.num(util.soma(fl, (f) => f.falhas7d)), icon: 'x-circle', foot: '<a href="#fluxos-execucao-9104">nova tentativa programada</a>' }]) +
        '<div class="lt-mt-6">' + ui.callout({ tone: 'gold', icon: 'sliders', title: 'Valores [X] em destaque dourado', text: 'São a sugestão inicial. A Atlas confirma cada prazo na reunião de alinhamento (pergunta Q2). No ganho, o contrato de honorários (fee mensal + êxito) é criado no Financeiro pelo próprio movimento de etapa (AUT-21), sempre ligado: veja em <a href="#fin-honorarios">Honorários e êxito</a>. Só a AUT-15 (ganho → Jurídico) fica desligada até a decisão Q3.' }) + '</div>' +
        '<div class="lt-mt-4 lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact"><thead><tr><th>Código</th><th>Quando (evento)</th><th>O que o sistema faz</th><th>Parâmetros [X]</th><th>Ligada</th><th title="Execuções nos últimos 7 dias: rodaram · não rodaram (condição) · falhas">7 dias<span class="lt-table__secondary" style="font-weight:400;text-transform:none;letter-spacing:0">rodaram · não rodaram · falhas</span></th><th class="lt-table__actions"><span class="lt-sr">Ações</span></th></tr></thead><tbody>' + linhas + '</tbody></table></div><div class="lt-pagination"><span>' + fl.length + ' regras do CRM · nível 1 (parâmetros) e nível 2 (liga/desliga)</span><span>Montar regras novas pela tela fica para a Fase 2</span></div></div>';
    },
    mount: (root) => {
      root = escopo(root);
      root.addEventListener('change', (e) => {
        const t = e.target.closest('[data-crm-liga]');
        if (t) { const f = D.fluxos.find((x) => x.id === +t.getAttribute('data-crm-liga')); f.ligado = t.checked; t.closest('tr').classList.toggle('is-muted', !t.checked); ui.toast(f.codigo + (t.checked ? ' ligada' : ' desligada'), t.checked ? 'success' : 'warning', t.checked ? 'Volta a rodar nos próximos gatilhos.' : 'Os disparos programados foram pausados. A mudança ficou na auditoria.'); return; }
        const p = e.target.closest('[data-crm-param]'); if (!p) return;
        const k = p.getAttribute('data-crm-param').split(':'), f = D.fluxos.find((x) => x.id === +k[0]), par = f && f.params.find((x) => x.key === k[1]);
        if (par) { par.valor = p.type === 'checkbox' ? p.checked : p.type === 'number' ? +p.value : p.value; root.querySelectorAll('[data-crm-x-de="' + k[0] + ':' + k[1] + '"]').forEach((b) => { b.textContent = par.valor; }); }
      });
    }
  });
})();
