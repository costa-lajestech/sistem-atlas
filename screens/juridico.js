/* ==========================================================================
   ATLAS · screens/juridico.js — telas do JURÍDICO
   Processos, andamentos, documentos, prazos com regra D-1 (App.util.prazoInterno),
   agenda jurídica compartilhada, alertas, painel de produtividade e cumprimento de prazos.
   Prefixo de hash: jur-  ·  prefixo de ID: jur.

   Telas:   jur.dashboard (#jur-painel) · jur.case.list (#jur-processos) · jur.case.detail (#jur-processo-<id>)
            jur.case.new (#jur-processo-cadastro[-<id>]) · jur.movement.new (#jur-andamento-novo[-<processo>])
            jur.deadline.list (#jur-prazos) · jur.deadline.new (#jur-prazo-novo[-<processo>])
            jur.calendar (#jur-agenda) · jur.clients (#jur-clientes) · jur.reports (#jur-relatorios)
            jur.ui.states (#jur-estados)
   Gavetas: jur-novo-processo · jur-novo-prazo · jur-novo-andamento · jur-novo-documento · jur-prazo
            jur-evento · jur-cliente · jur-nova-parte      Diálogo: jur-cumprir-prazo
   CSS próprio: só o bloco .m-jur-* abaixo (destaque de linha hoje/atrasado e régua da contagem).
   ========================================================================== */
(function () {
  'use strict';
  const App = window.App, ui = App.ui, esc = ui.esc, fmt = App.fmt, util = App.util, db = App.db, D = App.data, I = App.icon;
  const J = D.juridico = D.juridico || {};
  ['partes', 'processos', 'prazos', 'andamentos', 'documentos', 'tarefas', 'eventos', 'historico', 'formasIntimacao', 'fontesAndamento'].forEach((k) => { if (!J[k]) J[k] = []; });
  ['extra', 'prazoExtra', 'tiposAndamento', 'diasSugeridos', 'origensCnj', 'partePorNome'].forEach((k) => { if (!J[k]) J[k] = {}; });

  /* ------------------------------------------------------------------ */
  /* CSS mínimo do módulo (prefixo .m-jur-, só variáveis)                */
  /* ------------------------------------------------------------------ */
  (function () {
    if (document.getElementById('m-jur-css') || !document.head) return;
    const s = document.createElement('style'); s.id = 'm-jur-css';
    s.textContent = [
      '.lt-table tr.m-jur-row-atraso>td:first-child{box-shadow:inset 3px 0 0 var(--tone-red-solid)}',
      '.lt-table tr.m-jur-row-hoje>td:first-child{box-shadow:inset 3px 0 0 var(--tone-amber-solid)}',
      '.lt-table tr.m-jur-row-amanha>td:first-child{box-shadow:inset 3px 0 0 var(--tone-amber-border)}',
      '.m-jur-regua{display:flex;flex-wrap:wrap;gap:3px}',
      '.m-jur-dia{width:38px;border:1px solid var(--border);border-radius:var(--r-xs);background:var(--surface);text-align:center;padding:3px 0 2px;font-size:10px;line-height:1.25;color:var(--text-muted)}',
      '.m-jur-dia b{display:block;font-size:12.5px;color:var(--text);font-variant-numeric:tabular-nums}',
      '.m-jur-dia i{display:block;font-style:normal;font-weight:600;color:var(--gold-text);font-variant-numeric:tabular-nums;min-height:13px}',
      '.m-jur-dia.is-fds{background:var(--surface-3)}',
      '.m-jur-dia.is-fer{background:var(--danger-subtle);border-color:var(--danger-border);color:var(--danger-text)}',
      '.m-jur-dia.is-sus{background-image:repeating-linear-gradient(135deg,transparent 0 5px,var(--surface-3) 5px 6px)}',
      '.m-jur-dia.is-pub{border-color:var(--tone-blue-solid);box-shadow:inset 0 -2px 0 var(--tone-blue-solid)}',
      '.m-jur-dia.is-int{background:var(--tone-amber-subtle);border-color:var(--tone-amber-solid)}',
      '.m-jur-dia.is-int i{color:var(--tone-amber-strong)}',
      '.m-jur-dia.is-fatal{background:var(--danger-subtle);border-color:var(--danger)}',
      '.m-jur-dia.is-fatal i,.m-jur-dia.is-fatal b{color:var(--danger-text)}',
      '.m-jur-sw{display:inline-block;width:12px;height:12px;border-radius:2px;border:1px solid var(--border);vertical-align:-2px;margin-right:5px}'
    ].join('');
    document.head.appendChild(s);
  })();

  /* ------------------------------------------------------------------ */
  /* Dados e utilitários do módulo                                       */
  /* ------------------------------------------------------------------ */
  const HOJE_ISO = util.hojeIso();
  const SEG = util.iso(util.inicioSemana(App.HOJE)), SEX = util.iso(util.addDias(SEG, 4));
  const AMANHA = util.iso(util.addDias(App.HOJE, 1));
  const ADV_IDS = D.equipe.filter((p) => p.area === 'Jurídico').map((p) => p.id);
  const AGENDA_PESSOAS = ADV_IDS.concat([1]);
  const STATUS_PROC = { ativo: ['Ativo', 'green'], suspenso: ['Suspenso', 'amber'], encerrado: ['Encerrado', 'gray'] };
  const statusChip = (s) => { const x = STATUS_PROC[s] || [s, 'gray']; return ui.chip(x[0], x[1], { dot: true }); };

  let _procs = null;
  function procs() {
    if (!_procs) _procs = D.processos.map((p) => Object.assign({}, p, J.extra[p.id] || {})).concat(J.processos.map((p) => Object.assign({}, p)));
    return _procs;
  }
  const proc = (id) => procs().find((p) => String(p.id) === String(id)) || null;
  const emp = (id) => db.empresa(id) || { id: 0, fantasia: '—', razao: '—', cnpj: '', regime: '' };
  const pes = (id) => db.pessoa(id) || { nome: '—', cargoCurto: '' };
  const nome1 = (id) => pes(id).nome.split(' ')[0];
  const etapaJ = (key) => D.funis.juridico.etapas.find((e) => e.key === key) || { nome: key || '—', tone: 'gray', cor: 'var(--tone-gray-solid)' };
  const parte = (id) => J.partes.find((x) => x.id === id) || null;
  const parteDo = (p) => parte(p.parteId || J.partePorNome[p.parteContraria]) || { nome: p.parteContraria, tipo: '—', documento: null, representacao: '' };
  const contratoDa = (empresaId) => D.contratos.find((c) => c.empresaId === empresaId) || null;
  const fluxoCod = (c) => D.fluxos.find((f) => f.codigo === c) || null;
  /* Origem da tarefa: abre a execução registrada (quando existe) ou o diagrama da automação no painel Fluxos */
  function origemChip(cod, hash) {
    if (!cod || cod === 'Manual') return ui.chip('Manual', 'gray');
    const f = fluxoCod(cod), chip = ui.chip(cod, 'violet', { icon: 'zap' }); if (!f) return chip;
    const ex = D.fluxoExecucoes.filter((x) => x.fluxoId === f.id && x.estado === 'rodou' && x.registro && x.registro.hash === hash).sort((a, b) => b.quando.localeCompare(a.quando))[0];
    return '<a href="' + (ex ? '#fluxos-execucao-' + ex.id : '#fluxos-diagrama-' + f.id) + '" style="display:inline-flex;text-decoration:none" title="Criada pela automação ' + esc(cod) + ' · abrir no painel Fluxos">' + chip + '</a>';
  }
  /* Crédito recuperado: fonte única (J.recuperadoProcesso), a mesma do CRM e do contrato */
  const recProc = (p) => (J.recuperadoProcesso ? J.recuperadoProcesso(p) : p.recuperado || 0);
  const recEmpresa = (id) => (J.recuperadoEmpresa ? J.recuperadoEmpresa(id) : 0);
  const DEFESA = /Embargante|Autuada|Recorrente/;
  function recuperadoTxt(p) {
    const v = recProc(p);
    if (v) return '<span class="lt-num lt-success">' + fmt.moeda(v) + '</span>';
    if (DEFESA.test(p.polo || '') || /Certidão/.test(p.tese || '')) return '<span class="lt-muted">não se aplica (defesa)</span>';
    if (p.etapa === 'transito' || p.etapa === 'habilitacao') return '<span class="lt-muted">ainda não</span><span class="lt-table__secondary">habilitação do crédito em andamento</span>';
    return '<span class="lt-muted">ainda não</span><span class="lt-table__secondary">' + (p.tipo === 'judicial' ? 'compensa só depois do trânsito em julgado (CTN, art. 170-A)' : 'sem compensação transmitida') + '</span>';
  }
  const classeCurta = (c) => String(c || '').replace('Processo administrativo tributário', 'PAT').replace('Processo administrativo', 'Proc. administrativo').replace('Ação de procedimento comum', 'Procedimento comum').replace('Mandado de segurança', 'MS');

  /* Prazos: data.js + extras do módulo + cumprimentos feitos nesta sessão (sem alterar os arrays compartilhados) */
  function prazosAll() {
    const ov = App.state.jurCumpridos || {}, pd = App.state.jurPerdidos || {};
    return D.prazos.map((p) => Object.assign({}, J.prazoExtra[p.id] || {}, p)).concat(J.prazos.map((p) => Object.assign({}, p)))
      .map((p) => (pd[p.id] && p.status === 'pendente' ? Object.assign(p, { status: 'perdido', motivoPerda: pd[p.id].motivo + (pd[p.id].obs ? '. ' + pd[p.id].obs : ''), perdidoEm: pd[p.id].em }) : p))
      .map((p) => (ov[p.id] && p.status === 'pendente' ? Object.assign(p, { status: 'cumprido', cumpridoEm: ov[p.id] }) : p));
  }
  const prazo = (id) => prazosAll().find((p) => String(p.id) === String(id)) || null;
  const prazosDo = (pid) => prazosAll().filter((p) => p.processoId === pid);
  const pendentes = () => prazosAll().filter((p) => p.status === 'pendente');
  /* "Ver como" (?vercomo=7): com escopo 'proprios' (perfil Advogado) as listas mostram só os processos e prazos da pessoa */
  const soMeus = () => App.escopo('jur.case.read') === 'proprios';
  const meuProc = (p) => !soMeus() || p.advogadoId === App.meId;
  const meuPrazo = (p) => !soMeus() || p.responsavelId === App.meId || meuProc(proc(p.processoId) || {});

  /* Dias úteis entre hoje e a data (0 = hoje; negativo = já passou) */
  function diasUteisAte(iso) {
    const alvo = util.iso(iso); if (alvo === HOJE_ISO) return 0;
    const step = alvo > HOJE_ISO ? 1 : -1; let d = util.hoje(), n = 0, guard = 0;
    while (util.iso(d) !== alvo && guard++ < 900) { d = util.addDias(d, step); if (util.ehDiaUtil(d)) n += step; }
    return n;
  }
  const uteisTxt = (n) => fmt.plural(Math.abs(n), 'dia útil', 'dias úteis');

  /* Situação de um prazo. grupo: atrasado | hoje | amanha | semana | depois | cumprido | perdido */
  function pinfo(p) {
    const pr = proc(p.processoId), e = pr ? emp(pr.empresaId) : emp(0);
    const dI = util.diasEntre(App.HOJE, p.interno), dF = util.diasEntre(App.HOJE, p.fatal);
    const duI = diasUteisAte(p.interno), duF = diasUteisAte(p.fatal);
    let grupo, st, relI;
    if (p.status === 'cumprido') {
      const noD1 = p.cumpridoEm <= p.interno;
      grupo = 'cumprido'; st = noD1 ? ['Cumprido no D-1', 'green'] : ['Cumprido no fatal', 'amber']; relI = 'cumprido em ' + fmt.dataCurta(p.cumpridoEm);
    } else if (p.status === 'perdido' || dF < 0) { grupo = 'perdido'; st = ['Perdido', 'red']; relI = 'fatal passou sem protocolo'; }
    else if (dF === 0) { grupo = 'atrasado'; st = ['Fatal hoje', 'red']; relI = uteisTxt(duI) + ' de atraso no D-1'; }
    else if (dI < 0) { grupo = 'atrasado'; st = ['Atrasado', 'red']; relI = uteisTxt(duI) + ' de atraso'; }
    else if (dI === 0) { grupo = 'hoje'; st = ['Hoje', 'amber']; relI = 'vence hoje'; }
    else if (dI === 1) { grupo = 'amanha'; st = ['Amanhã', 'amber']; relI = 'vence amanhã'; }
    else { grupo = p.interno <= SEX ? 'semana' : 'depois'; st = ['Pendente', 'blue']; relI = 'em ' + uteisTxt(duI); }
    const relF = p.status !== 'pendente' ? '' : duF === 0 ? 'hoje' : duF > 0 ? 'em ' + uteisTxt(duF) : 'venceu';
    return { pr, e, dI, dF, duI, duF, grupo, st, relI, relF };
  }
  const toneBox = (i) => (i.grupo === 'atrasado' || i.grupo === 'perdido' ? 'red' : i.grupo === 'hoje' || i.grupo === 'amanha' ? 'amber' : '');
  const FORMA_CURTA = { dje: 'DJe', eletronica: 'ciência PJe', ecac: 'ciência e-CAC', dec: 'ciência DEC (SEFAZ-SP)', pessoal: 'juntada', data: '' };
  function contagemTxt(p) {
    if (!p.forma) return 'Contagem não informada';
    if (p.forma === 'data') return 'Data designada' + (p.hora ? ' · ' + p.hora : '');
    return p.dias + ' dias ' + (p.contagem === 'corridos' ? 'corridos' : 'úteis') + ' · ' + FORMA_CURTA[p.forma] + ' ' + fmt.dataCurta(p.data);
  }
  function proximoPrazo(pid) { return prazosDo(pid).filter((p) => p.status === 'pendente').sort((a, b) => a.interno.localeCompare(b.interno))[0] || null; }

  /* Andamentos, documentos, tarefas */
  const andamentosDo = (pid) => J.andamentos.filter((a) => a.processoId === pid).sort((a, b) => b.data.localeCompare(a.data));
  const docsDo = (pid) => J.documentos.filter((d) => d.processoId === pid).sort((a, b) => b.quando.localeCompare(a.quando));
  function tarefasDo(pid) {
    const sh = D.tarefas.filter((t) => t.ref && t.ref.hash === 'jur-processo-' + pid).map((t) => Object.assign({}, t, { processoId: pid }));
    return sh.concat(J.tarefas.filter((t) => t.processoId === pid)).sort((a, b) => a.prazo.localeCompare(b.prazo));
  }

  /* Agenda jurídica: compromissos do módulo + prazos (interno e fatal) */
  function agendaItens() {
    const out = D.eventos.filter((e) => e.modulo === 'juridico').concat(J.eventos).map((e) => Object.assign({ kind: 'evento' }, e));
    pendentes().forEach((p) => {
      const pr = proc(p.processoId), nome = pr ? emp(pr.empresaId).fantasia : '';
      out.push({ id: 'i' + p.id, kind: 'prazo', prazoId: p.id, tipo: 'prazo_interno', titulo: 'D-1 · ' + nome + ' · ' + p.tipo, data: p.interno, pessoas: [p.responsavelId], allDay: true });
      out.push({ id: 'f' + p.id, kind: 'prazo', prazoId: p.id, tipo: 'prazo_fatal', titulo: 'Fatal · ' + nome + ' · ' + p.tipo, data: p.fatal, pessoas: [p.responsavelId], allDay: true });
    });
    return out;
  }
  const ordemAgenda = (a, b) => (a.allDay === b.allDay ? (a.inicio || '').localeCompare(b.inicio || '') : a.allDay ? -1 : 1);

  /* Próximos disparos das automações de prazo (AUT-12, AUT-13, AUT-14) para um conjunto de prazos */
  function disparosDe(lista) {
    const out = [];
    lista.filter((p) => p.status === 'pendente').forEach((p) => { const i = pinfo(p); J.disparosPrazo(p).forEach((x) => out.push(Object.assign(x, { info: i }))); });
    return out.sort((a, b) => a.quando.localeCompare(b.quando));
  }

  /* ------------------------------------------------------------------ */
  /* Cálculo do prazo (fatal pela contagem, interno pela regra D-1)      */
  /* o: { forma: dje|eletronica|ecac|pessoal|data, data, dias, contagem: uteis|corridos, susp }       */
  /* ------------------------------------------------------------------ */
  function calcPrazo(o) {
    if (!o || !o.data || !/^\d{4}-\d{2}-\d{2}/.test(o.data)) return null;
    const opts = o.susp === false ? null : { contarSuspensao: true };
    const r = { notas: [], feriados: [], suspensoes: [], fds: 0, pub: null, inicio: null };
    if (o.forma === 'data') {
      r.fatal = util.iso(o.data);
      if (!util.ehDiaUtil(o.data)) r.notas.push('A data designada cai em dia não útil. Confira a pauta.');
    } else {
      r.pub = o.forma === 'dje' ? util.iso(util.proximoDiaUtil(util.addDias(o.data, 1))) : util.iso(o.data);
      r.inicio = util.iso(util.proximoDiaUtil(util.addDias(r.pub, 1), opts));
      const n = Math.max(1, parseInt(o.dias, 10) || 1);
      if (o.contagem === 'corridos') {
        let f = util.addDias(r.inicio, n - 1);
        r.fimContagem = util.iso(f);
        if (!util.ehDiaUtil(f, opts)) { const f2 = util.proximoDiaUtil(f, opts); r.notas.push('O último dia da contagem (' + fmt.data(f) + ', ' + fmt.diaSemana(f) + ') não é dia útil: o prazo vence no dia útil seguinte.'); f = f2; }
        r.fatal = util.iso(f);
      } else r.fatal = util.iso(util.addDiasUteis(r.pub, n, opts));
      const sus = {};
      for (let d = util.addDias(r.pub, 1), g = 0; util.iso(d) <= r.fatal && g < 400; d = util.addDias(d, 1), g++) {
        const fer = util.feriado(d), s = opts && util.suspensao(d);
        if (util.fimDeSemana(d)) r.fds++;
        else if (fer) r.feriados.push({ data: util.iso(d), nome: fer.nome, tipo: fer.tipo });
        else if (s) sus[s.nome] = (sus[s.nome] || 0) + 1;
      }
      r.suspensoes = Object.keys(sus).map((k) => ({ nome: k, dias: sus[k] }));
    }
    r.interno = util.prazoInterno(r.fatal);
    return r;
  }
  function regua(r, o) {
    if (!r.pub) return '';
    const opts = o.susp === false ? null : { contarSuspensao: true };
    let s = '<div class="m-jur-regua" role="img" aria-label="Dias da contagem, da publicação ao prazo fatal">', n = 0, g = 0;
    for (let d = util.parse(r.pub); util.iso(d) <= r.fatal && g < 75; d = util.addDias(d, 1), g++) {
      const iso = util.iso(d), fer = util.feriado(d), sus = opts && util.suspensao(d), fds = util.fimDeSemana(d);
      let cls = 'm-jur-dia', mark = '';
      if (iso === r.pub) { cls += ' is-pub'; mark = o.forma === 'dje' ? 'publ.' : 'ciên.'; }
      else if (o.contagem === 'corridos') { if (iso >= r.inicio && iso <= r.fimContagem) mark = String(++n); else if (iso > r.fimContagem) mark = '+1'; }
      else if (iso >= r.inicio && util.ehDiaUtil(d, opts)) mark = String(++n);
      if (fer) cls += ' is-fer'; else if (fds) cls += ' is-fds'; else if (sus) cls += ' is-sus';
      if (iso === r.interno) cls += ' is-int';
      if (iso === r.fatal) cls += ' is-fatal';
      const tip = fmt.data(iso) + (fer ? ' · ' + fer.nome : fds ? ' · fim de semana' : sus ? ' · ' + sus.nome : '') + (iso === r.interno ? ' · prazo interno (D-1)' : '') + (iso === r.fatal ? ' · prazo fatal' : '');
      s += '<span class="' + cls + '" title="' + esc(tip) + '">' + util.DIAS_CURTOS[d.getDay()] + '<b>' + d.getDate() + '</b><i>' + mark + '</i></span>';
    }
    s += '</div>';
    const sw = (st, t) => '<span class="lt-legend__item"><span class="m-jur-sw" style="' + st + '"></span>' + t + '</span>';
    return s + '<div class="lt-legend">' + sw('box-shadow:inset 0 -2px 0 var(--tone-blue-solid);border-color:var(--tone-blue-solid)', o.forma === 'dje' ? 'Publicação' : 'Ciência') + sw('background:var(--surface-3)', 'Fim de semana') + sw('background:var(--danger-subtle);border-color:var(--danger-border)', 'Feriado') + (r.suspensoes.length ? sw('background-image:repeating-linear-gradient(135deg,transparent 0 3px,var(--border-strong) 3px 4px)', 'Suspensão') : '') + sw('background:var(--tone-amber-subtle);border-color:var(--tone-amber-solid)', 'Interno (D-1)') + sw('background:var(--danger-subtle);border-color:var(--danger)', 'Fatal') + '</div>';
  }
  function calcHtml(o, compact) {
    const r = calcPrazo(o);
    if (!r) return ui.empty({ small: true, icon: 'calendar-clock', title: 'Informe a data', text: 'Preencha a data da intimação para ver o prazo fatal e o interno.' });
    const dw = (iso) => ' <span class="lt-muted" style="font-weight:400">' + fmt.diaSemanaCurto(iso) + '</span>';
    const item = (label, iso, extra, st) => '<div class="lt-summary__item"' + (st ? ' style="' + st + '"' : '') + '><div class="lt-summary__label">' + label + '</div><div class="lt-summary__value' + (extra || '') + '">' + fmt.data(iso) + dw(iso) + '</div></div>';
    let s = '<div class="lt-summary">' + (r.pub ? item(o.forma === 'dje' ? 'Publicação' : 'Ciência', r.pub) : '') +
      item('Prazo fatal', r.fatal, ' lt-danger') + item('Prazo interno (D-1)', r.interno, ' lt-gold', 'background:var(--gold-subtle)') + '</div>';
    const passos = [];
    if (o.forma === 'dje') passos.push('Disponibilizado no Diário em ' + fmt.data(o.data) + ' (' + fmt.diaSemanaCurto(o.data) + '). Publicação: ' + fmt.data(r.pub) + ', 1º dia útil seguinte (Lei 11.419/06, art. 4º).');
    else if (o.forma === 'data') passos.push('Data designada pelo juízo ou pelo órgão: ' + fmt.data(r.fatal) + (o.hora ? ', ' + o.hora : '') + '. Não há contagem.');
    else passos.push('Ciência em ' + fmt.data(r.pub) + ' (' + fmt.diaSemanaCurto(r.pub) + ').');
    if (r.inicio) passos.push('Contagem de ' + fmt.plural(Math.max(1, +o.dias || 1), o.contagem === 'corridos' ? 'dia corrido' : 'dia útil', o.contagem === 'corridos' ? 'dias corridos' : 'dias úteis') + ' a partir de ' + fmt.data(r.inicio) + ' (' + fmt.diaSemanaCurto(r.inicio) + ')' + (o.contagem === 'corridos' ? ' · Decreto 70.235/72, art. 5º.' : ' · CPC, arts. 219 e 224.'));
    if (r.inicio && o.contagem !== 'corridos') {
      const fora = [r.fds ? fmt.plural(r.fds, 'dia de fim de semana', 'dias de fim de semana') : ''].concat(r.feriados.map((f) => fmt.dataCurta(f.data) + ' ' + f.nome + ' (' + f.tipo + ')')).concat(r.suspensoes.map((x) => x.nome + ' (' + fmt.plural(x.dias, 'dia', 'dias') + ')')).filter(Boolean);
      passos.push(fora.length ? 'Fora da contagem: ' + fora.join(' · ') + '.' : 'Nenhum dia não útil no período.');
    } else if (r.inicio && r.feriados.length) passos.push('Feriados no período não param a contagem em dias corridos: ' + r.feriados.map((f) => fmt.dataCurta(f.data) + ' ' + f.nome).join(' · ') + '.');
    r.notas.forEach((n) => passos.push(n));
    passos.push('Prazo fatal: ' + fmt.data(r.fatal) + ' (' + fmt.diaSemana(r.fatal) + ').');
    util.explicarD1(r.fatal).forEach((t) => passos.push(t));
    s += '<ol class="lt-mt-4" style="margin-bottom:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--text-2)">' + passos.map((t, i) => '<li' + (i === passos.length - 1 ? ' class="lt-strong" style="color:var(--text)"' : '') + '>' + esc(t) + '</li>').join('') + '</ol>';
    if (r.pub) s += '<div class="lt-demo-label" style="margin-top:14px">Dia a dia da contagem</div>' + regua(r, o);
    if (!compact) {
      const du = diasUteisAte(r.interno);
      s += '<div class="lt-mt-4">' + ui.callout({ tone: du < 0 ? 'danger' : du <= 1 ? 'warning' : 'gold', icon: 'calendar-clock', title: du < 0 ? 'O interno já passou' : du === 0 ? 'O interno vence hoje' : 'Faltam ' + uteisTxt(du) + ' até o interno', text: 'A equipe trabalha pelo interno; o fatal aparece como referência. Alertas: 3 dias úteis antes, no dia do interno e no fatal.' }) + '</div>';
    }
    return s;
  }

  /* ------------------------------------------------------------------ */
  /* Campos de formulário reaproveitados (página e gaveta)               */
  /* ------------------------------------------------------------------ */
  const optsProcessos = (soAtivos) => procs().filter((p) => !soAtivos || p.status !== 'encerrado').map((p) => ({ value: p.id, label: emp(p.empresaId).fantasia + ' · ' + classeCurta(p.classe) + ' · ' + p.numero }));
  const optsAdv = () => ADV_IDS.map((id) => ({ value: id, label: pes(id).nome }));
  const PRE_PRAZO = { tipo: 'Contrarrazões', forma: 'dje', data: HOJE_ISO, dias: 15, contagem: 'uteis', susp: true };
  function camposPrazo(pr, pre) {
    pre = Object.assign({}, PRE_PRAZO, pre || {});
    return ui.field({ label: 'Tipo de prazo', name: 'pz_tipo', type: 'select', required: true, value: pre.tipo, options: D.listas.tiposPrazo }) +
      ui.field({ label: 'Responsável', name: 'pz_resp', type: 'select', required: true, value: pr ? pr.advogadoId : 7, options: optsAdv() }) +
      ui.field({ label: 'Descrição', name: 'pz_desc', span: 2, value: pre.desc || '', placeholder: 'Ex.: Contrarrazões à apelação da Fazenda Nacional' });
  }
  function camposContagem(pre) {
    pre = Object.assign({}, PRE_PRAZO, pre || {});
    return ui.field({ label: 'Forma da intimação', name: 'pz_forma', type: 'select', span: 2, value: pre.forma, options: J.formasIntimacao, hint: 'Define a data de início: o Diário conta da publicação; as demais, da ciência.' }) +
      ui.field({ label: pre.forma === 'dje' ? 'Data de disponibilização' : pre.forma === 'data' ? 'Data designada' : 'Data da ciência', name: 'pz_data', type: 'date', required: true, value: pre.data }) +
      ui.field({ label: 'Prazo', name: 'pz_dias', type: 'number', value: pre.dias, suffix: 'dias', hint: '<span data-pz-sugestao>Sugestão pelo tipo: ' + ((J.diasSugeridos[pre.tipo] || {}).dias || '—') + ' dias.</span>' }) +
      ui.field({ label: 'Contagem', name: 'pz_contagem', type: 'radio', inline: true, span: 2, value: pre.contagem, options: [{ value: 'uteis', label: 'Dias úteis (CPC, art. 219)' }, { value: 'corridos', label: 'Dias corridos (processo administrativo)' }] }) +
      ui.field({ type: 'toggle', name: 'pz_susp', span: 2, checked: pre.susp !== false, label: 'Considerar suspensões de prazo (recesso forense e portarias)', hint: 'Feriados nacionais, estaduais, municipais e forenses sempre ficam fora da contagem em dias úteis.' });
  }
  function secAlertas() {
    const t = (cod, txt, fixo) => { const f = fluxoCod(cod); return '<label class="lt-toggle lt-toggle--sm" style="width:100%"><input type="checkbox" checked' + (fixo ? ' disabled' : '') + '><span class="lt-toggle__track"></span><span style="flex:1">' + esc(txt) + '</span>' + ui.chip(cod, 'violet', { icon: 'zap', title: f ? f.nome : cod }) + '</label>'; };
    return ui.section({ title: 'Alertas automáticos', sub: 'Programados ao salvar. Aparecem em Fluxos → Próximos disparos.', tone: 'blue', icon: 'bell', body: '<div class="lt-stack lt-stack--sm">' + t('AUT-12', 'Aviso ao responsável 3 dias úteis antes do interno') + t('AUT-13', 'Alerta no dia do prazo interno (D-1)') + t('AUT-14', 'Alerta crítico no dia fatal ao responsável e ao gestor jurídico', true) + '</div><p class="lt-hint lt-mt-2">O alerta do dia fatal é obrigatório e não pode ser desligado.</p>' });
  }
  /* Liga o cálculo ao vivo em qualquer formulário com campos pz_* e um [data-jur-calc] */
  function mountCalc(root, compact) {
    const q = (n) => root.querySelector('[name="' + n + '"]');
    const out = root.querySelector('[data-jur-calc]'); if (!out || !q('pz_data')) return;
    const fieldOf = (n) => { const x = q(n); return x ? x.closest('.lt-field') : null; };
    const ler = () => ({ forma: q('pz_forma').value, data: q('pz_data').value, dias: q('pz_dias').value, contagem: (root.querySelector('[name="pz_contagem"]:checked') || {}).value || 'uteis', susp: q('pz_susp') ? q('pz_susp').checked : true });
    const upd = () => {
      const o = ler();
      const lab = fieldOf('pz_data') && fieldOf('pz_data').querySelector('.lt-label');
      if (lab) lab.firstChild.nodeValue = o.forma === 'dje' ? 'Data de disponibilização' : o.forma === 'data' ? 'Data designada' : o.forma === 'pessoal' ? 'Data da juntada' : 'Data da ciência';
      ['pz_dias', 'pz_susp'].forEach((n) => { const f = fieldOf(n); if (f) f.hidden = o.forma === 'data'; });
      const fc = root.querySelector('[name="pz_contagem"]'); if (fc) fc.closest('.lt-field').hidden = o.forma === 'data';
      out.innerHTML = calcHtml(o, compact);
      const r = calcPrazo(o);
      root.querySelectorAll('[data-jur-toast-prazo]').forEach((b) => { b.setAttribute('data-toast-text', r ? 'Interno ' + fmt.data(r.interno) + ' · fatal ' + fmt.data(r.fatal) + '. Alertas AUT-12, 13 e 14 programados.' : 'Alertas programados.'); });
    };
    const tipo = q('pz_tipo');
    if (tipo) tipo.addEventListener('change', () => {
      const sug = J.diasSugeridos[tipo.value] || {};
      if (sug.forma) q('pz_forma').value = sug.forma; else if (q('pz_forma').value === 'data') q('pz_forma').value = 'dje';
      if (sug.dias) q('pz_dias').value = sug.dias;
      if (sug.contagem) { const rb = root.querySelector('[name="pz_contagem"][value="' + sug.contagem + '"]'); if (rb) rb.checked = true; }
      const h = root.querySelector('[data-pz-sugestao]'); if (h) h.textContent = sug.dias ? 'Sugestão pelo tipo: ' + sug.dias + ' dias ' + (sug.contagem === 'corridos' ? 'corridos' : 'úteis') + '.' : 'Data fixada pelo juízo.';
      upd();
    });
    root.addEventListener('input', (e) => { if (e.target.name && /^pz_(data|dias)$/.test(e.target.name)) upd(); });
    root.addEventListener('change', (e) => { if (e.target.name && /^pz_(forma|data|dias|contagem|susp)$/.test(e.target.name)) upd(); });
    upd();
  }

  /* ------------------------------------------------------------------ */
  /* Componentes de lista reaproveitados                                 */
  /* ------------------------------------------------------------------ */
  function tabelaPrazos(rows, o) {
    o = o || {};
    const cols = [
      { label: 'Prazo interno (D-1)', key: 'interno', sortable: true, width: '175px', render: (p) => { const i = pinfo(p); return '<span class="lt-row lt-row--nowrap" style="gap:10px">' + ui.dateBox(p.interno, toneBox(i)) + '<span style="min-width:0"><span class="lt-table__primary">' + fmt.diaSemanaCurto(p.interno) + ', ' + fmt.dataCurta(p.interno) + '</span><span class="lt-table__secondary">' + esc(i.relI) + '</span></span></span>'; } },
      { label: 'Fatal', key: 'fatal', sortable: true, width: '155px', render: (p) => '<span class="lt-num lt-strong">' + fmt.data(p.fatal) + '</span> <span class="lt-muted lt-small">' + fmt.diaSemanaCurto(p.fatal) + '</span><span class="lt-table__secondary">' + esc(contagemTxt(p)) + '</span>' },
      { label: 'Prazo', key: 'tipo', sortable: true, render: (p) => '<span class="lt-table__primary">' + esc(p.tipo) + '</span><span class="lt-table__secondary">' + esc(p.descricao) + '</span>' }
    ];
    if (!o.semProcesso) cols.push({ label: 'Processo', key: 'processoId', width: '190px', value: (p) => pinfo(p).e.fantasia, sortable: true, render: (p) => { const i = pinfo(p); return '<a href="#jur-processo-' + p.processoId + '" class="lt-strong">' + esc(i.e.fantasia) + '</a><span class="lt-table__secondary lt-mono" style="white-space:nowrap">' + esc(i.pr ? i.pr.numero : '') + '</span>'; } });
    cols.push({ label: 'Resp.', key: 'responsavelId', width: '56px', value: (p) => nome1(p.responsavelId), render: (p) => ui.avatar(p.responsavelId, 'sm') });
    cols.push({ label: 'Status', key: 'status', width: '128px', value: (p) => pinfo(p).st[0], render: (p) => { const i = pinfo(p); return ui.chip(i.st[0], i.st[1], { dot: true }); } });
    return ui.table({
      rows, compact: o.compact !== false, pageSize: o.pageSize || 0,
      empty: o.empty || { icon: 'calendar-clock', title: 'Nenhum prazo aqui', text: 'Ajuste os filtros ou cadastre um prazo.' },
      rowSheet: (p) => ({ sheet: 'jur-prazo', params: { id: p.id } }),
      rowClass: (p) => { const g = pinfo(p).grupo; return g === 'atrasado' ? 'm-jur-row-atraso' : g === 'hoje' ? 'm-jur-row-hoje' : g === 'amanha' ? 'm-jur-row-amanha' : ''; },
      columns: cols,
      rowActions: o.semAcoes ? null : (p) => (p.status === 'pendente' ? ui.btn({ label: 'Cumprir', size: 'xs', variant: 'outline', icon: 'check', dialog: 'jur-cumprir-prazo', attrs: { 'data-id': p.id } }) : '')
    });
  }
  function itemTarefa(t) {
    const late = t.status !== 'concluida' && t.prazo < util.isoHora(App.HOJE), fila = t.filaId ? D.filas.find((f) => f.id === t.filaId) : null;
    const quem = t.responsavelId ? ui.avatar(t.responsavelId, 'xs') + '<span>' + esc(pes(t.responsavelId).nome) + '</span>' : ui.chip('Fila: ' + (fila ? fila.nome : t.filaId), 'blue', { icon: 'users' });
    const origem = origemChip(t.origem, 'jur-processo-' + t.processoId);
    return '<li class="lt-list__item"' + (t.status === 'concluida' ? ' style="opacity:.6"' : '') + '><label class="lt-check" style="margin-top:2px"><input type="checkbox" data-jur-tarefa="' + t.id + '"' + (t.status === 'concluida' ? ' checked' : '') + ' aria-label="Concluir tarefa"></label>' +
      '<div class="lt-list__body"><div class="lt-list__title"' + (t.status === 'concluida' ? ' style="text-decoration:line-through"' : '') + '>' + esc(t.titulo) + '</div><div class="lt-list__meta">' + quem + origem + '</div></div>' +
      '<div class="lt-list__aside"><span class="lt-small lt-num ' + (late ? 'lt-danger lt-strong' : 'lt-muted') + '">' + (late ? 'Atrasada · ' : '') + fmt.dataCurta(t.prazo) + ' ' + fmt.hora(t.prazo) + '</span></div></li>';
  }
  function bindTarefas(root) {
    root.addEventListener('change', (e) => {
      const c = e.target.closest('[data-jur-tarefa]'); if (!c) return;
      const li = c.closest('li'); li.style.opacity = c.checked ? '.6' : ''; li.querySelector('.lt-list__title').style.textDecoration = c.checked ? 'line-through' : '';
      ui.toast(c.checked ? 'Tarefa concluída' : 'Tarefa reaberta', c.checked ? 'success' : 'info', esc(li.querySelector('.lt-list__title').textContent));
    });
  }
  const pessoaLinha = (id, meta) => ui.person(id, meta);
  const crumbs = (extra) => [{ label: 'Jurídico', hash: 'jur-painel' }].concat(extra);
  const exportBtn = (arquivo, linhas, label) => ui.btn({ label: label || 'Exportar Excel', icon: 'download', acao: 'exportar', toast: 'Planilha gerada', toastText: esc(arquivo) + ' · ' + fmt.plural(linhas, 'linha') + '. A exportação fica registrada na auditoria.' });

  /* Atualizações de estado (cumprimento ou perda) disparadas pelos botões com data-jur-cumprir / data-jur-perda */
  document.addEventListener('lt:acao', (e) => {
    const b = e.target && e.target.closest ? e.target.closest('[data-jur-cumprir],[data-jur-perda]') : null; if (!b) return;
    if (b.hasAttribute('data-jur-perda')) {
      const pd = App.state.jurPerdidos = App.state.jurPerdidos || {};
      pd[b.getAttribute('data-jur-perda')] = { motivo: b.getAttribute('data-jur-motivo') || 'Motivo não informado', obs: b.getAttribute('data-jur-obs') || '', em: b.getAttribute('data-jur-data') || HOJE_ISO };
    } else {
      const st = App.state.jurCumpridos = App.state.jurCumpridos || {};
      st[b.getAttribute('data-jur-cumprir')] = b.getAttribute('data-jur-data') || HOJE_ISO;
    }
    setTimeout(() => { if (App.current && App.current.screen && App.current.screen.module === 'juridico') App.refresh(); }, 250);
  });
  /* Seção "Registrar perda" (lista de motivos + observação), usada no diálogo de cumprimento e no de perda */
  const MOTIVOS_PERDA = J.motivosPerdaPrazo && J.motivosPerdaPrazo.length ? J.motivosPerdaPrazo : ['Intimação não capturada a tempo', 'Publicação em nome de advogado que saiu do processo', 'Falha no protocolo (sistema indisponível)', 'Documento do cliente não chegou a tempo', 'Erro na contagem do prazo', 'Decisão de não recorrer (estratégia)', 'Outro'];
  const secPerda = () => ui.section({ title: 'Registrar perda', sub: 'Data depois do fatal: o prazo entra como perdido no relatório, com o motivo.', tone: 'amber', icon: 'alert-triangle', cols: 2, body:
    ui.field({ label: 'Motivo da perda', name: 'pp_motivo', type: 'select', required: true, span: 2, placeholder: 'Escolha o motivo', options: MOTIVOS_PERDA }) +
    ui.field({ label: 'O que aconteceu', name: 'pp_obs', type: 'textarea', span: 2, rows: 2, placeholder: 'Ex.: a intimação saiu no nome de advogado que já tinha deixado o processo. Houve prejuízo?' }) });
  /* Copia motivo e observação para o botão antes do spinner; sem motivo, segura a ação */
  function ligarPerda(dlg, btn) {
    btn.addEventListener('click', (ev) => {
      const m = dlg.querySelector('[name="pp_motivo"]'), o = dlg.querySelector('[name="pp_obs"]'), f = m && m.closest('.lt-field');
      if (!m || !m.value) { if (f) f.classList.add('is-invalid'); if (m) m.focus(); ev.stopPropagation(); ev.preventDefault(); return; }
      if (f) f.classList.remove('is-invalid');
      btn.setAttribute('data-jur-motivo', m.value); btn.setAttribute('data-jur-obs', o ? o.value.trim() : '');
    }, true);
  }

  /* ================================================================== */
  /* PAINEL (jur.dashboard)                                              */
  /* ================================================================== */
  const MESES_H = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  /* Cumprimento de prazos: J.cumprimentoD1 (mesma série e mesma janela do Início, do painel e dos relatórios) */
  const JANELA = (J.janelaD1 || { meses: ['2026-08', '2026-09', '2026-10', '2026-11'], rotulo: 'ago a nov/2026' });
  const hist = (advId, meses) => J.cumprimentoD1(advId, meses || MESES_H);
  const mesRot = (m) => util.MESES_CURTOS[+m.slice(5, 7) - 1];

  App.screen({
    id: 'jur.dashboard', hash: 'jur-painel', module: 'juridico', title: 'Painel jurídico', nav: true, navGroup: 'juridico', navLabel: 'Painel', navOrder: 1,
    render: () => {
      const S = App.state.jurPainel = App.state.jurPainel || { adv: '' };
      const advF = S.adv ? +S.adv : null;
      const pend = pendentes().filter((p) => !advF || p.responsavelId === advF).map((p) => [p, pinfo(p)]);
      const atrasados = pend.filter((x) => x[1].grupo === 'atrasado');
      const semana = pend.filter((x) => x[0].interno >= SEG && x[0].interno <= SEX && x[1].grupo !== 'atrasado');
      const hojeN = pend.filter((x) => x[1].grupo === 'hoje').length, amanhaN = pend.filter((x) => x[1].grupo === 'amanha').length;
      const ativos = procs().filter((p) => p.status === 'ativo' && (!advF || p.advogadoId === advF));
      const h90 = hist(advF, JANELA.meses);
      const header = ui.pageHeader({
        eyebrow: 'Jurídico · semana de ' + fmt.dataCurta(SEG) + ' a ' + fmt.dataCurta(SEX), title: 'Painel jurídico',
        sub: 'Prazos pela regra D-1, produtividade da equipe e carteira de processos. Valores e prazos fictícios.',
        actions: '<select class="lt-select" data-jur-painel-adv style="width:auto;min-width:200px;height:34px" aria-label="Filtrar por advogado"><option value="">Toda a equipe jurídica</option>' + ADV_IDS.map((id) => '<option value="' + id + '"' + (String(id) === String(S.adv) ? ' selected' : '') + '>' + esc(pes(id).nome) + '</option>').join('') + '</select>' +
          exportBtn('painel-juridico-nov-2026.xlsx', 48) + ui.btn({ label: 'Novo prazo', variant: 'primary', icon: 'plus', sheet: 'jur-novo-prazo' })
      });
      const kpis = ui.kpis([
        { label: 'Prazos internos na semana', value: fmt.num(semana.length), icon: 'calendar-clock', foot: hojeN + ' hoje · ' + amanhaN + ' amanhã', href: '#jur-prazos' },
        { label: 'Atrasados (D-1 vencido)', value: fmt.num(atrasados.length), icon: 'alert-triangle', dir: atrasados.length ? 'up' : 'flat', good: false, delta: atrasados.length ? 'fatal hoje' : '', foot: atrasados.length ? 'gestor avisado (AUT-14)' : 'nenhum atraso', href: '#jur-prazos' },
        { label: 'Cumpridos no D-1 · ' + JANELA.rotulo, value: fmt.pct(h90.pct, 0), icon: 'check-circle', progress: { value: h90.d1, max: h90.total || 1, tone: 'green' }, foot: h90.d1 + ' de ' + h90.total + ' · ' + h90.fatal + ' no fatal · ' + fmt.plural(h90.perdido, 'perdido'), href: '#jur-relatorios' },
        { label: 'Processos ativos', value: fmt.num(ativos.length), icon: 'scale', foot: fmt.moedaCurta(util.soma(ativos, (p) => p.valorCausa)) + ' em discussão', href: '#jur-processos' }
      ]);
      /* gráfico mensal */
      const series = [['No D-1', 'd1', 'var(--tone-green-solid)'], ['No dia fatal', 'fatal', 'var(--tone-amber-solid)'], ['Perdidos', 'perdido', 'var(--tone-red-solid)']].map((x) => ({ name: x[0], color: x[2], values: MESES_H.map((m) => hist(advF, [m])[x[1]]) }));
      const cardChart = ui.card({ title: 'Cumprimento de prazos por mês', icon: 'chart-bar', sub: 'Cumpridos no prazo interno (D-1) × no dia fatal × perdidos · novembro até hoje', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#jur-relatorios">Relatório</a>', body: ui.chart.bar({ labels: MESES_H.map(mesRot), series, stacked: true, width: 760, height: 236, title: 'Cumprimento de prazos por mês' }) });
      /* próximos 7 dias */
      const lim = util.iso(util.addDias(App.HOJE, 7));
      const prox = pend.filter((x) => x[0].interno <= lim).sort((a, b) => a[0].interno.localeCompare(b[0].interno)).map((x) => ({ d: x[0].interno, html: { lead: ui.dateBox(x[0].interno, toneBox(x[1])), title: esc(x[0].tipo + ' · ' + x[1].e.fantasia), meta: ui.chip(x[1].st[0], x[1].st[1], { dot: true }) + '<span>Fatal ' + fmt.dataCurta(x[0].fatal) + ' · ' + esc(nome1(x[0].responsavelId)) + '</span>', attrs: { 'data-id': x[0].id }, sheet: 'jur-prazo' } }));
      const evs = agendaItens().filter((e) => e.kind === 'evento' && e.tipo === 'audiencia' && e.data >= HOJE_ISO && e.data <= lim && (!advF || e.pessoas.indexOf(advF) >= 0)).map((e) => ({ d: e.data, html: { lead: ui.dateBox(e.data), title: esc(e.titulo), meta: ui.chip('Audiência / sessão', 'red') + '<span>' + esc(e.inicio + ' · ' + e.local) + '</span>', attrs: { 'data-ev': e.id }, sheet: 'jur-evento' } }));
      const cardProx = ui.card({ title: 'Próximos 7 dias', icon: 'calendar', sub: 'Prazos internos e sessões', flush: true, actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#jur-agenda">Agenda</a>', body: ui.list(prox.concat(evs).sort((a, b) => a.d.localeCompare(b.d)).map((x) => x.html), { empty: { icon: 'check-circle', title: 'Semana tranquila', text: 'Nenhum prazo interno nem sessão nos próximos 7 dias.' } }) });
      /* produtividade */
      const prodRows = ADV_IDS.filter((id) => !advF || id === advF).map((id) => {
        const h = hist(id, JANELA.meses), out = hist(id, ['2026-10']);
        const pp = pendentes().filter((p) => p.responsavelId === id), pi = pp.map(pinfo);
        return { id, ativos: procs().filter((p) => p.advogadoId === id && p.status === 'ativo').length, andOut: out.andamentos, andNov: hist(id, ['2026-11']).andamentos, pend: pp.length, semana: pp.filter((p) => p.interno >= SEG && p.interno <= SEX).length, atras: pi.filter((i) => i.grupo === 'atrasado').length, pct: h.pct, d1: h.d1, tot: h.total };
      });
      const tabProd = ui.table({ compact: true, rows: prodRows, columns: [
        { label: 'Advogado', key: 'id', render: (r) => pessoaLinha(r.id, esc(pes(r.id).oab || '')) },
        { label: 'Ativos', key: 'ativos', align: 'right', sortable: true },
        { label: 'Andamentos out · nov', key: 'andOut', align: 'right', render: (r) => r.andOut + ' · ' + r.andNov },
        { label: 'Pendentes', key: 'pend', align: 'right', sortable: true, render: (r) => r.pend + '<span class="lt-table__secondary">' + r.semana + ' na semana</span>' },
        { label: 'Atrasados', key: 'atras', align: 'right', render: (r) => (r.atras ? '<span class="lt-danger lt-strong">' + r.atras + '</span>' : '0') },
        { label: 'No D-1 (' + JANELA.rotulo + ')', key: 'pct', align: 'right', width: '150px', render: (r) => '<span class="lt-strong">' + fmt.pct(r.pct, 0) + '</span><span class="lt-table__secondary">' + r.d1 + ' de ' + r.tot + '</span>' + ui.progress(r.d1, r.tot || 1, r.pct >= 85 ? 'green' : 'amber') }
      ] });
      const cardProd = ui.card({ title: 'Produtividade por advogado', icon: 'users', sub: 'Carteira, andamentos registrados e cumprimento de prazos', flush: true, body: tabProd });
      /* processos por situação e por cliente */
      const base = procs().filter((p) => !advF || p.advogadoId === advF);
      const porEtapa = D.funis.juridico.etapas.map((e) => ({ label: e.nome, value: base.filter((p) => p.etapa === e.key && p.status !== 'encerrado').length, color: e.cor }));
      const stTxt = Object.keys(STATUS_PROC).map((k) => ui.chip(STATUS_PROC[k][0] + ' · ' + base.filter((p) => p.status === k).length, STATUS_PROC[k][1], { dot: true })).join('');
      const cardSit = ui.card({ title: 'Processos por situação', icon: 'layers', sub: 'Etapa do acompanhamento (ativos e suspensos)', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#jur-processos">Processos</a>', body: '<div class="lt-chips lt-mb-4">' + stTxt + '</div>' + ui.chart.funnel(porEtapa) });
      const clientes = util.agrupar(base.filter((p) => p.status !== 'encerrado'), (p) => p.empresaId);
      const porCliente = Object.keys(clientes).map((k) => ({ label: emp(+k).fantasia, value: util.soma(clientes[k], (p) => p.valorCausa), sub: '· ' + clientes[k].length })).sort((a, b) => b.value - a.value).slice(0, 7);
      const cardCli = ui.card({ title: 'Processos por cliente', icon: 'building', sub: 'Valor em discussão · quantidade de processos', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#jur-clientes">Clientes</a>', body: ui.chart.funnel(porCliente, { format: fmt.moedaCurta }) });
      const disp = disparosDe(pendentes().filter((p) => !advF || p.responsavelId === advF)).filter((x) => !x.ja).slice(0, 6);
      const cardAut = ui.card({ title: 'Próximos alertas automáticos', icon: 'zap', sub: 'Regras de prazo AUT-12, AUT-13 e AUT-14', flush: true, actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#fluxos-proximos">Todos os disparos</a>',
        body: ui.list(disp.map((x) => ({ icon: x.cod === 'AUT-14' ? 'alert-triangle' : x.cod === 'AUT-13' ? 'calendar-clock' : 'bell', tone: x.cod === 'AUT-14' ? 'red' : x.cod === 'AUT-13' ? 'amber' : 'blue', title: esc(x.txt), meta: ui.chip(x.cod, 'violet') + '<span>' + esc(x.prazo.tipo + ' · ' + x.info.e.fantasia + ' → ' + x.para.map(nome1).join(' e ')) + '</span>', aside: '<span class="lt-small lt-num lt-muted">' + esc(fmt.quando(x.quando)) + '</span>', attrs: { 'data-id': x.prazo.id }, sheet: 'jur-prazo' })), { empty: { icon: 'zap', title: 'Nenhum alerta programado' } }) });
      return header + kpis +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c8">' + cardChart + '</div><div class="lt-c4">' + cardProx + '</div></div>' +
        '<div class="lt-g12 lt-mt-4"><div class="lt-c7">' + cardProd + '</div><div class="lt-c5">' + cardSit + '</div></div>' +
        '<div class="lt-g12 lt-mt-4"><div class="lt-c6">' + cardCli + '</div><div class="lt-c6">' + cardAut + '</div></div>';
    },
    mount: (root) => {
      const s = root.querySelector('[data-jur-painel-adv]');
      if (s) s.addEventListener('change', () => { App.state.jurPainel.adv = s.value; App.refresh(); });
    }
  });

  /* ================================================================== */
  /* PROCESSOS · lista (jur.case.list)                                   */
  /* ================================================================== */
  function procFiltrados(S) {
    return procs().filter(meuProc).filter((p) => {
      if (S.status !== 'todos' && p.status !== S.status) return false;
      if (S.cliente && String(p.empresaId) !== String(S.cliente)) return false;
      if (S.adv && String(p.advogadoId) !== String(S.adv)) return false;
      if (S.classe && p.classe !== S.classe) return false;
      if (S.inst && p.instancia !== S.inst) return false;
      if (S.q) { const e = emp(p.empresaId), t = (p.numero + ' ' + e.fantasia + ' ' + e.razao + ' ' + e.cnpj + ' ' + p.tese + ' ' + p.vara + ' ' + p.classe).toLowerCase(); if (t.indexOf(S.q.toLowerCase()) < 0) return false; }
      return true;
    }).sort((a, b) => { const pa = proximoPrazo(a.id), pb = proximoPrazo(b.id); return (pa ? pa.interno : '9999') .localeCompare(pb ? pb.interno : '9999') || b.distribuidoEm.localeCompare(a.distribuidoEm); });
  }
  function tabelaProcessos(rows) {
    return ui.table({
      rows, rowHref: (p) => '#jur-processo-' + p.id, rowClass: (p) => (p.status === 'encerrado' ? 'is-muted' : ''),
      empty: { icon: 'scale', title: 'Nenhum processo com esses filtros', text: 'Limpe a busca ou troque a situação para "Todos".', action: ui.btn({ label: 'Limpar filtros', icon: 'refresh', attrs: { 'data-jur-limpar': true } }) },
      columns: [
        { label: 'Processo', key: 'numero', sortable: true, width: '230px', render: (p) => '<span class="lt-table__primary lt-mono" style="white-space:nowrap">' + esc(p.numero) + '</span><span class="lt-table__secondary">' + esc(classeCurta(p.classe) + ' · ' + p.vara) + '</span>' },
        { label: 'Cliente e tese', key: 'empresaId', sortable: true, value: (p) => emp(p.empresaId).fantasia, render: (p) => '<span class="lt-table__primary">' + esc(emp(p.empresaId).fantasia) + '</span><span class="lt-table__secondary">' + esc(p.tese) + '</span>' },
        { label: 'Etapa', key: 'etapa', sortable: true, width: '170px', value: (p) => etapaJ(p.etapa).num, render: (p) => { const e = etapaJ(p.etapa); return '<span class="lt-chips" style="flex-wrap:nowrap">' + ui.chip(e.nome, e.tone) + (p.status !== 'ativo' ? statusChip(p.status) : '') + '</span><span class="lt-table__secondary">' + esc(p.instancia) + '</span>'; } },
        { label: 'Responsável', key: 'advogadoId', sortable: true, width: '120px', value: (p) => nome1(p.advogadoId), render: (p) => '<span class="lt-row lt-row--nowrap" style="gap:6px">' + ui.avatar(p.advogadoId, 'xs') + esc(nome1(p.advogadoId)) + '</span>' },
        { label: 'Valor da causa', key: 'valorCausa', align: 'right', sortable: true, width: '120px', render: (p) => '<span title="' + esc(fmt.moeda(p.valorCausa)) + '">' + fmt.moedaCurta(p.valorCausa) + '</span>' },
        { label: 'Próximo prazo', key: 'id', sortable: true, value: (p) => { const x = proximoPrazo(p.id); return x ? x.interno : '9999'; }, width: '170px', render: (p) => { const x = proximoPrazo(p.id); if (!x) return '<span class="lt-muted">—</span>'; const i = pinfo(x); return '<span class="lt-num lt-strong">' + fmt.dataCurta(x.interno) + '</span> ' + ui.chip(i.st[0], i.st[1], { dot: true }) + '<span class="lt-table__secondary">' + esc(x.tipo) + '</span>'; } }
      ],
      rowActions: (p) => ui.btn({ icon: 'file-text', variant: 'ghost', size: 'xs', tip: 'Registrar andamento', sheet: 'jur-novo-andamento', attrs: { 'data-id': p.id } }) + ui.btn({ icon: 'calendar-clock', variant: 'ghost', size: 'xs', tip: 'Novo prazo', sheet: 'jur-novo-prazo', attrs: { 'data-processo': p.id } })
    });
  }
  App.screen({
    id: 'jur.case.list', hash: 'jur-processos', module: 'juridico', title: 'Processos', nav: true, navGroup: 'juridico', navOrder: 2,
    render: () => {
      const S = App.state.jurProc = App.state.jurProc || { status: 'ativo', q: '', cliente: '', adv: '', classe: '', inst: '' };
      const all = procs().filter(meuProc), ativos = all.filter((p) => p.status === 'ativo');
      const pend = pendentes().filter(meuPrazo).map((p) => [p, pinfo(p)]);
      const semana = pend.filter((x) => x[0].interno >= SEG && x[0].interno <= SEX && x[1].grupo !== 'atrasado');
      const atras = pend.filter((x) => x[1].grupo === 'atrasado'), fatais = pend.filter((x) => x[0].fatal >= SEG && x[0].fatal <= SEX);
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Processos' }]), title: 'Processos', sub: fmt.plural(all.length, 'processo') + ' · ' + ativos.length + ' ativos · ' + fmt.moedaCurta(util.soma(ativos, (p) => p.valorCausa)) + ' em discussão. Judiciais (TRF3) e administrativos (Receita, CARF, SEFAZ-SP).',
        actions: exportBtn('processos-juridico.xlsx', all.length) + ui.btn({ label: 'Cadastro rápido', icon: 'plus', sheet: 'jur-novo-processo' }) + ui.btn({ label: 'Novo processo', variant: 'primary', icon: 'plus', href: '#jur-processo-cadastro' }) });
      const kpis = ui.kpis([
        { label: 'Prazos internos nesta semana', value: fmt.num(semana.length), icon: 'calendar-clock', foot: semana.filter((x) => x[1].grupo === 'hoje').length + ' hoje · ' + semana.filter((x) => x[1].grupo === 'amanha').length + ' amanhã', href: '#jur-prazos' },
        { label: 'Atrasados (D-1 vencido)', value: fmt.num(atras.length), icon: 'alert-triangle', foot: atras.length ? esc(atras[0][0].tipo + ' · ' + atras[0][1].e.fantasia) : 'nenhum', dir: atras.length ? 'up' : 'flat', good: false, href: '#jur-prazos' },
        { label: 'Fatais nesta semana', value: fmt.num(fatais.length), icon: 'flag', foot: 'até sexta, ' + fmt.dataCurta(SEX), href: '#jur-prazos' },
        { label: 'Sessões e despachos', value: fmt.num(agendaItens().filter((e) => e.kind === 'evento' && e.tipo === 'audiencia' && e.data >= HOJE_ISO && e.data <= util.iso(util.addDias(App.HOJE, 14))).length), icon: 'gavel', foot: 'próximos 14 dias', href: '#jur-agenda' }
      ]);
      const clientesComProc = D.empresas.filter((e) => all.some((p) => p.empresaId === e.id));
      const uniq = (k) => all.map((p) => p[k]).filter((v, i, a) => v && a.indexOf(v) === i).sort();
      const filtros = ui.filters({
        busca: 'Buscar número ou cliente',
        selects: [{ label: 'Cliente', name: 'f_cliente', value: S.cliente, options: clientesComProc.map((e) => ({ value: e.id, label: e.fantasia })) }, { label: 'Advogado', name: 'f_adv', value: S.adv, options: optsAdv() }, { label: 'Tipo de ação', name: 'f_classe', value: S.classe, options: uniq('classe') }, { label: 'Instância', name: 'f_inst', value: S.inst, options: uniq('instancia') }],
        chipGroup: 'single', chips: [['ativo', 'Ativos', 'green'], ['suspenso', 'Suspensos', 'amber'], ['encerrado', 'Encerrados', 'gray'], ['todos', 'Todos', '']].map((c) => ({ value: c[0], label: c[1], tone: c[2] || null, active: S.status === c[0], count: c[0] === 'todos' ? all.length : all.filter((p) => p.status === c[0]).length }))
      });
      return header + kpis + '<div class="lt-mt-6"></div>' + filtros + '<div data-jur-lista>' + tabelaProcessos(procFiltrados(S)) + '</div>' +
        '<p class="lt-hint lt-mt-4">Clique na linha para abrir a ficha. Estados da lista (carregando, vazio e erro): <a href="#jur-estados">ver exemplos</a>.</p>';
    },
    mount: (root) => {
      const S = App.state.jurProc, box = root.querySelector('[data-jur-lista]');
      const redraw = () => { box.innerHTML = tabelaProcessos(procFiltrados(S)); ui.enhance(box); };
      const busca = root.querySelector('[data-filter-search]'); if (busca) { busca.value = S.q; busca.addEventListener('input', () => { S.q = busca.value.trim(); redraw(); }); }
      root.addEventListener('change', (e) => { const n = e.target.getAttribute('name'); const map = { f_cliente: 'cliente', f_adv: 'adv', f_classe: 'classe', f_inst: 'inst' }; if (map[n]) { S[map[n]] = e.target.value; redraw(); } });
      root.addEventListener('lt:filter', (e) => { S.status = e.detail.value; redraw(); });
      root.addEventListener('click', (e) => { if (e.target.closest('[data-jur-limpar]')) { Object.assign(S, { status: 'todos', q: '', cliente: '', adv: '', classe: '', inst: '' }); App.refresh(); } });
    }
  });

  /* ================================================================== */
  /* PROCESSO · ficha (jur.case.detail)                                  */
  /* ================================================================== */
  const FILTROS_AND = { todos: null, decisoes: ['decisao', 'sentenca', 'acordao', 'transito'], intimacoes: ['publicacao', 'intimacao_adm', 'despacho'], peticoes: ['peticao', 'juntada', 'distribuicao', 'certidao'], sistema: ['alerta'] };
  function timelineAndamentos(pid, filtro) {
    const tipos = FILTROS_AND[filtro || 'todos'];
    const l = andamentosDo(pid).filter((a) => !tipos || tipos.indexOf(a.tipo) >= 0);
    if (!l.length) return ui.empty({ small: true, icon: 'history', title: 'Nenhum andamento neste filtro' });
    const items = []; let mes = '';
    l.forEach((a) => {
      const m = fmt.mesAno(a.data); if (m !== mes) { items.push({ day: m }); mes = m; }
      const t = J.tiposAndamento[a.tipo] || { nome: a.tipo, icon: 'dot', tone: 'slate' };
      const pz = a.prazoId ? prazo(a.prazoId) : null, pzi = pz ? pinfo(pz) : null;
      const gerou = pz ? ' ' + ui.chip('Gerou prazo · interno ' + fmt.dataCurta(pz.interno), pzi.st[1] === 'green' ? 'green' : 'amber', { icon: 'calendar-clock' }) : '';
      items.push({ icon: t.icon, tone: t.tone, title: esc(a.titulo) + gerou,
        meta: fmt.dataCurta(a.data) + ' ' + fmt.hora(a.data) + ' · ' + esc(t.nome) + ' · ' + (a.por ? esc(pes(a.por).nome) + ' · ' + esc(a.fonte) : 'automático'),
        text: a.texto ? esc(a.texto) + (pz ? ' <button type="button" class="lt-link-btn" data-sheet="jur-prazo" data-id="' + pz.id + '">Ver o cálculo do prazo</button>' : '') : (pz ? '<button type="button" class="lt-link-btn" data-sheet="jur-prazo" data-id="' + pz.id + '">Ver o cálculo do prazo</button>' : '') });
    });
    return ui.timeline(items);
  }
  function abaAutomacoes(p) {
    const execs = D.fluxoExecucoes.filter((x) => x.registro && x.registro.hash === 'jur-processo-' + p.id);
    const disp = disparosDe(prazosDo(p.id));
    const regras = ['AUT-12', 'AUT-13', 'AUT-14', 'CORE-01'].map(fluxoCod).filter(Boolean);
    const listaRegras = ui.list(regras.map((f) => ({ icon: 'zap', tone: f.ligado ? 'green' : '', title: esc(f.codigo + ' · ' + f.nome), meta: esc(f.gatilhoTxt + ' → ' + f.acaoTxt), aside: (f.ligado ? ui.chip('Ligada', 'green', { dot: true }) : ui.chip('Desligada', 'gray', { dot: true })), href: '#fluxos-diagrama-' + f.id })));
    const listaDisp = ui.list(disp.map((x) => ({ icon: x.ja ? 'check-circle' : 'clock', tone: x.ja ? 'green' : x.cod === 'AUT-14' ? 'red' : 'amber', title: esc(x.txt) + ' · ' + esc(x.prazo.tipo), meta: ui.chip(x.cod, 'violet') + '<span>' + esc(fmt.dataHora(x.quando)) + ' · para ' + esc(x.para.map(nome1).join(' e ')) + '</span>', aside: x.ja ? ui.chip('Rodou', 'green') : ui.chip('Agendado', 'violet') })), { empty: { icon: 'clock', title: 'Nada agendado', text: 'Sem prazos pendentes, não há alertas programados.' } });
    let exec = '';
    if (execs.length) {
      const run = execs[0], f = D.fluxos.find((x) => x.id === run.fluxoId);
      exec = ui.card({ title: 'Última execução · ' + f.codigo + ' · ' + f.nome, icon: 'play-circle', sub: fmt.dataHora(run.quando) + ' · ' + esc(run.duracao) + ' · rodou do começo ao fim', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#fluxos-execucao-' + run.id + '">Passo a passo</a>', body: ui.flow(f, { run }) });
    } else exec = ui.card({ title: 'Execuções', icon: 'play-circle', body: ui.empty({ small: true, icon: 'play-circle', title: 'Nenhuma execução registrada', text: 'As automações ainda não rodaram para este processo.' }) });
    return '<div class="lt-stack">' + ui.callout({ tone: 'info', icon: 'workflow', title: 'Alertas de prazo são automáticos', text: 'Cada prazo pendente gera 3 disparos: aviso 3 dias úteis antes do interno, alerta no dia do interno e alerta crítico no fatal (responsável e gestor jurídico).' }) +
      ui.card({ title: 'Próximos disparos deste processo', icon: 'clock', flush: true, body: listaDisp }) + exec + ui.card({ title: 'Regras que se aplicam', icon: 'workflow', flush: true, body: listaRegras }) + '</div>';
  }
  App.screen({
    id: 'jur.case.detail', hash: 'jur-processo', module: 'juridico', title: 'Ficha do processo', navGroup: 'juridico', navParent: 'jur-processos', exemplo: 2001,
    render: (params) => {
      const p = proc(params.id);
      if (!p) return ui.pageHeader({ breadcrumb: crumbs([{ label: 'Processos', hash: 'jur-processos' }, { label: 'Não encontrado' }]), title: 'Processo não encontrado' }) + ui.empty({ icon: 'scale', title: 'Este processo não existe', text: 'O número #' + esc(params.id || '') + ' não corresponde a nenhum processo cadastrado.', action: '<a class="lt-btn lt-btn--primary" href="#jur-processos">' + I('arrow-left') + '<span>Voltar aos processos</span></a>' });
      const e = emp(p.empresaId), et = etapaJ(p.etapa), adv = pes(p.advogadoId), pt = parteDo(p), ct = contratoDa(p.empresaId);
      const pzs = prazosDo(p.id).sort((a, b) => (a.status === 'pendente' ? 0 : 1) - (b.status === 'pendente' ? 0 : 1) || a.interno.localeCompare(b.interno));
      const prox = proximoPrazo(p.id), pi = prox ? pinfo(prox) : null;
      const ands = andamentosDo(p.id), docs = docsDo(p.id), tars = tarefasDo(p.id);
      const header = ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Processos', hash: 'jur-processos' }, { label: p.numero }]),
        eyebrow: (p.tipo === 'administrativo' ? 'Processo administrativo' : 'Processo judicial') + ' · ' + classeCurta(p.classe),
        title: e.fantasia + ' · ' + p.tese,
        sub: '<span class="lt-mono" style="font-size:13px">' + esc(p.numero) + '</span> <button type="button" class="lt-link-btn lt-small" data-copy="' + esc(p.numero) + '" data-copy-label="Número copiado">' + I('copy') + ' copiar</button>',
        meta: statusChip(p.status) + ui.chip(et.nome, et.tone) + ui.chip(p.instancia, 'slate') + (p.liminar && p.liminar !== 'Não se aplica' ? ui.chip('Liminar: ' + p.liminar.toLowerCase(), p.liminar === 'Deferida' ? 'green' : p.liminar === 'Indeferida' ? 'red' : 'amber') : '') + ui.chip(e.regime, 'gold'),
        actions: '<a class="lt-btn lt-btn--default" href="#jur-processo-cadastro-' + p.id + '">' + I('edit') + '<span>Editar</span></a>' + ui.btn({ label: 'Novo prazo', icon: 'calendar-clock', sheet: 'jur-novo-prazo', attrs: { 'data-processo': p.id } }) + ui.btn({ label: 'Registrar andamento', variant: 'primary', icon: 'plus', sheet: 'jur-novo-andamento', attrs: { 'data-id': p.id } })
      });
      let alerta = '';
      if (pi && pi.grupo === 'atrasado') alerta = ui.callout({ tone: 'danger', icon: 'alert-triangle', title: (pi.dF === 0 ? 'Prazo fatal HOJE: ' : 'Prazo atrasado: ') + esc(prox.tipo), text: esc(prox.descricao) + '. O interno venceu em ' + fmt.data(prox.interno) + ' (' + fmt.diaSemana(prox.interno) + '). Responsável: ' + esc(pes(prox.responsavelId).nome) + '; gestor jurídico avisado (AUT-14).', actions: ui.btn({ label: 'Cumprir prazo', size: 'sm', variant: 'primary', icon: 'check', dialog: 'jur-cumprir-prazo', attrs: { 'data-id': prox.id } }) });
      else if (p.status === 'suspenso') alerta = ui.callout({ tone: 'warning', icon: 'pause', title: 'Processo suspenso', text: esc(p.suspensoMotivo || 'Sem motivo informado.') + ' Os prazos voltam a correr quando o processo for retomado.' });
      else if (p.status === 'encerrado') alerta = ui.callout({ tone: 'info', icon: 'check-circle', title: 'Processo encerrado em ' + fmt.data(p.encerradoEm), text: (recProc(p) ? 'Crédito recuperado: ' + fmt.moeda(recProc(p)) + '. ' : (p.recuperado ? '' : 'Sem crédito a recuperar. ')) + 'A ficha fica disponível para consulta.' });
      const filtrosAnd = '<div class="lt-row lt-row--between lt-mb-4">' + ui.segmented([['todos', 'Todos'], ['decisoes', 'Decisões'], ['intimacoes', 'Intimações'], ['peticoes', 'Petições'], ['sistema', 'Alertas']].map((x, i) => ({ value: x[0], label: x[1], active: i === 0 })), { name: 'jur-and' }) + ui.btn({ label: 'Registrar andamento', icon: 'plus', size: 'sm', sheet: 'jur-novo-andamento', attrs: { 'data-id': p.id } }) + '</div>';
      const tabDocs = '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2">' + fmt.plural(docs.length, 'documento') + ' · acesso conforme as permissões do processo</span>' + ui.btn({ label: 'Enviar documento', icon: 'upload', size: 'sm', sheet: 'jur-novo-documento', attrs: { 'data-id': p.id } }) + '</div>' +
        ui.table({ compact: true, rows: docs, empty: { icon: 'folder', title: 'Nenhum documento anexado', text: 'Envie a petição inicial, a procuração e as decisões.', action: ui.btn({ label: 'Enviar documento', icon: 'upload', sheet: 'jur-novo-documento', attrs: { 'data-id': p.id } }) },
          columns: [
            { label: 'Arquivo', key: 'nome', sortable: true, render: (d) => '<span class="lt-row lt-row--nowrap" style="gap:8px">' + I(/\.zip$/.test(d.nome) ? 'database' : /\.docx$/.test(d.nome) ? 'file-text' : 'file') + '<span style="min-width:0"><span class="lt-table__primary">' + esc(d.nome) + '</span>' + (d.versao > 1 ? '<span class="lt-table__secondary">versão ' + d.versao + '</span>' : '') + '</span></span>' },
            { label: 'Categoria', key: 'categoria', sortable: true, render: (d) => ui.chip(d.categoria, d.categoria === 'Petição' ? 'blue' : d.categoria === 'Decisão ou sentença' ? 'violet' : d.categoria === 'Procuração' ? 'gold' : 'slate') },
            { label: 'Enviado por', key: 'por', render: (d) => '<span class="lt-row lt-row--nowrap" style="gap:6px">' + ui.avatar(d.por, 'xs') + esc(nome1(d.por)) + '</span><span class="lt-table__secondary">' + esc(fmt.quando(d.quando)) + '</span>' },
            { label: 'Tamanho', key: 'tamanho', align: 'right', sortable: true, render: (d) => fmt.bytes(d.tamanho) }
          ],
          rowActions: (d) => ui.btn({ icon: 'download', variant: 'ghost', size: 'xs', tip: 'Baixar', acao: 'baixar', loading: 'Baixando…', toast: 'Download iniciado', toastText: esc(d.nome) }) + ui.btn({ icon: 'trash', variant: 'ghost', size: 'xs', tip: 'Excluir', acao: 'excluir', confirm: 'Excluir ' + d.nome + '?', confirmText: 'O arquivo vai para a lixeira por 30 dias e a exclusão fica na auditoria.', confirmLabel: 'Excluir arquivo', toast: 'Documento excluído' }) });
      const tabTar = '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2">Tarefas manuais e criadas pelas automações de prazo</span>' + ui.btn({ label: 'Nova tarefa', icon: 'plus', size: 'sm', sheet: 'core-nova-tarefa' }) + '</div>' +
        (tars.length ? '<ul class="lt-list" style="border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface)">' + tars.map(itemTarefa).join('') + '</ul>' : ui.empty({ small: true, icon: 'check-square', title: 'Nenhuma tarefa', text: 'Todo processo ativo deveria ter a próxima tarefa agendada.' }));
      const tabs = ui.tabs({ id: 'jur-ficha', tabs: [
        { key: 'andamentos', label: 'Andamentos', icon: 'history', count: ands.length, content: filtrosAnd + '<div data-jur-timeline>' + timelineAndamentos(p.id) + '</div>' },
        { key: 'prazos', label: 'Prazos', icon: 'calendar-clock', count: pzs.length, content: '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2">Interno (D-1) e fatal pelo calendário de dias úteis. Clique para ver o cálculo.</span>' + ui.btn({ label: 'Novo prazo', icon: 'plus', size: 'sm', sheet: 'jur-novo-prazo', attrs: { 'data-processo': p.id } }) + '</div>' + tabelaPrazos(pzs, { semProcesso: true, empty: { icon: 'calendar-clock', title: 'Nenhum prazo cadastrado', text: 'Registre um andamento que abra prazo ou cadastre o prazo direto.' } }) },
        { key: 'documentos', label: 'Documentos', icon: 'folder', count: docs.length, content: tabDocs },
        { key: 'tarefas', label: 'Tarefas', icon: 'check-square', count: tars.filter((t) => t.status !== 'concluida').length, content: tabTar },
        { key: 'automacoes', label: 'Automações', icon: 'zap', content: abaAutomacoes(p) }
      ] });
      /* coluna lateral */
      const cardProx = prox ? ui.card({ title: 'Próximo prazo', icon: 'calendar-clock', accent: true, body: '<div class="lt-stack lt-stack--sm">' +
        '<div class="lt-summary"><div class="lt-summary__item" style="background:var(--gold-subtle)"><div class="lt-summary__label">Interno (D-1)</div><div class="lt-summary__value lt-gold">' + fmt.data(prox.interno) + '</div></div><div class="lt-summary__item"><div class="lt-summary__label">Fatal</div><div class="lt-summary__value">' + fmt.data(prox.fatal) + '</div></div></div>' +
        '<div class="lt-row">' + ui.chip(pi.st[0], pi.st[1], { dot: true }) + '<span class="lt-small lt-text-2">' + esc(pi.relI) + '</span></div><div class="lt-strong">' + esc(prox.tipo) + '</div><div class="lt-small lt-text-2">' + esc(prox.descricao) + '</div>' +
        '<div class="lt-row lt-mt-2">' + ui.btn({ label: 'Ver cálculo', size: 'sm', icon: 'calculator', sheet: 'jur-prazo', attrs: { 'data-id': prox.id } }) + ui.btn({ label: 'Cumprir prazo', size: 'sm', variant: 'primary', icon: 'check', dialog: 'jur-cumprir-prazo', attrs: { 'data-id': prox.id } }) + '</div></div>' })
        : ui.card({ title: 'Próximo prazo', icon: 'calendar-clock', body: ui.empty({ small: true, icon: 'check-circle', title: 'Sem prazos pendentes' }) });
      const cardDados = ui.card({ title: 'Dados do processo', icon: 'file-text', body: ui.dl([
        ['Tipo de ação', esc(p.classe)], ['Tribunal / órgão', esc(p.tribunal)], [p.tipo === 'administrativo' ? 'Unidade' : 'Vara', esc(p.vara) + (p.orgaoJulgador ? '<span class="lt-table__secondary">Hoje na ' + esc(p.orgaoJulgador) + '</span>' : '')], [p.tipo === 'administrativo' ? 'Local' : 'Subseção / comarca', esc(p.subsecao)],
        ['Fase processual', esc(p.fase)], ['Sistema', esc(p.sistema)], ['Distribuído em', fmt.data(p.distribuidoEm)], ['Valor da causa', '<span class="lt-num">' + fmt.moeda(p.valorCausa) + '</span>'], ['Recuperado', recuperadoTxt(p)]
      ]) + (p.objeto ? '<p class="lt-small lt-text-2 lt-mt-4" style="margin-bottom:0">' + esc(p.objeto) + '</p>' : '') });
      const cardPartes = ui.card({ title: 'Partes', icon: 'users', body: '<div class="lt-stack lt-stack--sm"><div><div class="lt-label-caps">' + esc(p.polo) + ' · cliente</div><div class="lt-strong lt-mt-2"><a href="#crm-empresa-' + e.id + '">' + esc(e.razao) + '</a></div><div class="lt-small lt-muted lt-num">CNPJ ' + esc(e.cnpj) + ' · ' + esc(e.cidade) + '/' + esc(e.uf) + '</div></div><div class="lt-divider"></div>' +
        '<div><div class="lt-label-caps">Parte contrária</div><div class="lt-strong lt-mt-2">' + esc(pt.nome) + '</div><div class="lt-small lt-muted">' + esc(pt.tipo) + (pt.documento ? ' · CNPJ ' + esc(pt.documento) : '') + '</div>' + (pt.representacao ? '<div class="lt-small lt-text-2">' + esc(pt.representacao) + '</div>' : '') + '</div></div>' });
      const neg = db.negocio(p.negocioId);
      const cardContrato = ui.card({ title: 'Contrato e CRM', icon: 'briefcase', body: ct ? ui.dl([['Honorário mensal', '<span class="lt-num">' + fmt.moeda(ct.honorarioMensal) + '</span>'], ['Êxito', fmt.pct(ct.exitoPct) + ' do crédito recuperado'], ['Recuperado no cliente', '<span class="lt-num">' + fmt.moedaCurta(recEmpresa(p.empresaId)) + '</span><span class="lt-table__secondary">soma dos processos em compensação · base do êxito</span>'], ['Negócio de origem', neg ? '<a href="#crm-negocio-' + neg.id + '">#' + neg.id + ' · ' + esc(neg.titulo) + '</a>' : '—'], ['Financeiro', '<a href="#fin-honorarios">Honorários e êxito</a>']]) : ui.empty({ small: true, icon: 'briefcase', title: 'Sem contrato vinculado' }) });
      const cardEquipe = ui.card({ title: 'Responsável', icon: 'user', body: '<div class="lt-stack lt-stack--sm">' + ui.person(adv, esc(adv.cargo) + (adv.oab ? ' · ' + esc(adv.oab) : '')) + ui.person(6, 'Gestor jurídico · recebe o alerta do dia fatal') + '</div>' });
      return header + (alerta ? '<div class="lt-mb-4">' + alerta + '</div>' : '') + '<div class="lt-split"><div style="min-width:0">' + tabs + '</div><div class="lt-stack">' + cardProx + cardDados + cardPartes + cardContrato + (p.advogadoId !== 6 ? cardEquipe : '') + '</div></div>';
    },
    mount: (root, params) => {
      const p = proc(params.id); if (!p) return;
      root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'jur-and') root.querySelector('[data-jur-timeline]').innerHTML = timelineAndamentos(p.id, e.detail.value); });
      bindTarefas(root);
    }
  });

  /* ================================================================== */
  /* PROCESSO · cadastro e edição (jur.case.new)                         */
  /* ================================================================== */
  const OPT = {
    classe: ['Mandado de segurança', 'Ação de procedimento comum', 'Embargos à execução fiscal', 'Ação anulatória de débito fiscal', 'Agravo de instrumento', 'Processo administrativo (PER/DCOMP)', 'Processo administrativo (habilitação de crédito)', 'Processo administrativo (recurso voluntário)', 'Processo administrativo tributário (defesa em AIIM)'],
    tribunal: ['TRF3 · Justiça Federal da 3ª Região', 'STJ · Superior Tribunal de Justiça', 'STF · Supremo Tribunal Federal', 'TJSP · Tribunal de Justiça de São Paulo', 'Receita Federal do Brasil', 'CARF · Conselho Administrativo de Recursos Fiscais', 'SEFAZ-SP · Tribunal de Impostos e Taxas'],
    instancia: ['1ª instância', '2ª instância (TRF3)', 'Tribunais superiores', 'Administrativo · DRF', 'Administrativo · 1ª instância', 'Administrativo · CARF'],
    subsecao: ['Campinas', 'Americana', 'Limeira', 'Jundiaí', 'Piracicaba', 'São Paulo', 'Brasília (sessão virtual)'],
    fase: ['Conhecimento', 'Recursal', 'Cumprimento de sentença', 'Habilitação e compensação', 'Defesa administrativa', 'Recurso administrativo'],
    polo: ['Impetrante', 'Autora', 'Embargante', 'Requerente', 'Recorrente', 'Autuada (impugnante)'],
    sistema: ['PJe', 'e-CAC', 'e-Processo (CARF)', 'AIIM Digital (SEFAZ-SP)', 'e-SAJ (TJSP)'],
    liminar: ['Aguardando', 'Deferida', 'Indeferida', 'Não se aplica']
  };
  const clientesJur = () => D.empresas.filter((e) => D.contratos.some((c) => c.empresaId === e.id));
  function formProcesso(p, compact, pre) {
    p = p || {}; pre = pre || {};
    const empId = p.empresaId || pre.empresa || '', ct = empId ? contratoDa(+empId) : null;
    const ctTxt = (c) => (c ? 'Contrato ' + c.id + ': ' + fmt.moeda(c.honorarioMensal) + '/mês + ' + fmt.pct(c.exitoPct) + ' de êxito' : 'Escolha o cliente para ver o contrato de honorários.');
    const negs = D.negocios.filter((n) => n.desfecho === 'ganho');
    const sCliente = ui.section({ title: 'Cliente e partes', sub: 'Proposta 4.1: cliente (nome, CNPJ/CPF, telefone, e-mail) e parte contrária (nome, CNPJ/CPF).', tone: 'gold', icon: 'building', cols: 2, body:
      ui.field({ label: 'Cliente', name: 'pr_cliente', type: 'select', required: true, span: 2, value: empId, placeholder: 'Escolha o cliente', options: clientesJur().map((e) => ({ value: e.id, label: e.fantasia + ' · ' + e.cnpj })).concat([{ value: 'novo', label: '+ Cadastrar cliente (pessoa física ou jurídica)' }]), hint: '<span data-jur-contrato>' + esc(ctTxt(ct)) + '</span> · <button type="button" class="lt-link-btn" data-sheet="jur-novo-cliente">+ Cadastrar cliente</button>' }) +
      ui.field({ label: 'Polo do cliente', name: 'pr_polo', type: 'select', value: p.polo || 'Impetrante', options: OPT.polo }) +
      ui.field({ label: 'Negócio de origem (CRM)', name: 'pr_negocio', type: 'select', value: p.negocioId || (empId ? (negs.find((n) => n.empresaId === +empId) || {}).id : ''), placeholder: 'Sem vínculo', options: negs.map((n) => ({ value: n.id, label: '#' + n.id + ' · ' + emp(n.empresaId).fantasia })) }) +
      ui.field({ label: 'Parte contrária', name: 'pr_parte', type: 'select', required: true, value: p.parteId || 4501, options: J.partes.map((x) => ({ value: x.id, label: x.nome })), hint: '<button type="button" class="lt-link-btn" data-sheet="jur-nova-parte">+ Cadastrar nova parte contrária</button>' }) +
      ui.field({ label: 'CNPJ/CPF da parte', name: 'pr_parte_doc', type: 'cnpj', value: (parte(p.parteId || 4501) || {}).documento || '', readonly: true, hint: 'Vem do cadastro da parte.' }) });
    const sIdent = ui.section({ title: 'Identificação', tone: 'violet', icon: 'tag', cols: 2, body:
      ui.field({ label: 'Natureza', name: 'pr_tipo', type: 'radio', inline: true, span: 2, value: p.tipo || 'judicial', options: [{ value: 'judicial', label: 'Judicial' }, { value: 'administrativo', label: 'Administrativo' }] }) +
      ui.field({ label: 'Número do processo', name: 'pr_numero', required: true, span: 2, value: p.numero || '', placeholder: '0000000-00.0000.0.00.0000', hint: '<span data-jur-cnj>Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO. Administrativo federal: 00000.000000/AAAA-00.</span>' }) +
      ui.field({ label: 'Tipo de ação', name: 'pr_classe', type: 'select', required: true, value: p.classe || 'Mandado de segurança', options: OPT.classe }) +
      ui.field({ label: 'Tese', name: 'pr_tese', type: 'select', value: p.tese || D.listas.teses[0], options: D.listas.teses.concat(p.tese && D.listas.teses.indexOf(p.tese) < 0 ? [p.tese] : []) }) +
      (compact ? '' : ui.field({ label: 'Objeto', name: 'pr_objeto', type: 'textarea', span: 2, rows: 2, value: p.objeto || '', placeholder: 'O que se pede, em uma ou duas frases' })) });
    const sOrgao = ui.section({ title: 'Órgão e localização', tone: 'blue', icon: 'landmark', cols: 2, body:
      ui.field({ label: 'Tribunal / órgão', name: 'pr_tribunal', type: 'select', value: p.tribunal || OPT.tribunal[0], options: OPT.tribunal }) +
      ui.field({ label: 'Instância', name: 'pr_instancia', type: 'select', value: p.instancia || '1ª instância', options: OPT.instancia }) +
      ui.field({ label: 'Vara / turma / unidade', name: 'pr_vara', required: true, value: p.vara || '', placeholder: 'Ex.: 2ª Vara Federal de Campinas' }) +
      ui.field({ label: 'Subseção / comarca', name: 'pr_subsecao', type: 'select', value: p.subsecao || 'Campinas', options: OPT.subsecao, hint: 'Define o calendário de feriados municipais (pergunta Q7).' }) +
      (compact ? '' : ui.field({ label: 'Sistema', name: 'pr_sistema', type: 'select', value: p.sistema || 'PJe', options: OPT.sistema })) });
    const sSit = ui.section({ title: 'Fase e situação', sub: 'Status da proposta 4.2: ativo, suspenso ou encerrado.', tone: 'amber', icon: 'flag', cols: 2, body:
      ui.field({ label: 'Fase processual', name: 'pr_fase', type: 'select', value: p.fase || 'Conhecimento', options: OPT.fase }) +
      ui.field({ label: 'Etapa do acompanhamento', name: 'pr_etapa', type: 'select', value: p.etapa || 'distribuido', options: D.funis.juridico.etapas.map((x) => ({ value: x.key, label: x.num + '. ' + x.nome })) }) +
      ui.field({ label: 'Status', name: 'pr_status', type: 'radio', inline: true, span: 2, value: p.status || 'ativo', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'suspenso', label: 'Suspenso' }, { value: 'encerrado', label: 'Encerrado' }] }) +
      ui.field({ label: 'Distribuído em', name: 'pr_dist', type: 'date', value: p.distribuidoEm || HOJE_ISO }) +
      ui.field({ label: 'Liminar / tutela', name: 'pr_liminar', type: 'select', value: p.liminar || 'Aguardando', options: OPT.liminar }) });
    const sValores = ui.section({ title: 'Valores', tone: 'green', icon: 'dollar', cols: 2, body:
      ui.field({ label: 'Valor da causa', name: 'pr_valor', type: 'money', required: true, value: p.valorCausa || '' }) +
      ui.field({ label: 'Crédito já recuperado', name: 'pr_recuperado', type: 'money', value: p.recuperado || 0, hint: 'Atualizado a cada compensação (gera o êxito no Financeiro).' }) });
    const sResp = ui.section({ title: 'Responsáveis', tone: 'blue', icon: 'users', cols: 2, body:
      ui.field({ label: 'Advogado responsável', name: 'pr_adv', type: 'select', required: true, value: p.advogadoId || 7, options: optsAdv() }) +
      ui.field({ label: 'Gestor que recebe o alerta crítico', type: 'static', html: ui.person(6, 'Gestor jurídico') }) +
      (compact ? '' : ui.field({ type: 'toggle', name: 'pr_avisar', span: 2, checked: true, label: 'Avisar o advogado por e-mail ao salvar' })) });
    const sDocs = ui.section({ title: 'Documentos iniciais', sub: 'Petição inicial, procuração, contrato social. Ficam na aba Documentos.', tone: 'slate', icon: 'paperclip', body: ui.field({ type: 'upload', multiple: true, accept: 'PDF, DOCX, ZIP · até 50 MB por arquivo' }) });
    return '<div class="lt-sections">' + sCliente + sIdent + sOrgao + (compact ? '' : sSit + sValores) + sResp + (compact ? ui.section({ title: 'Valor', tone: 'green', icon: 'dollar', cols: 2, body: ui.field({ label: 'Valor da causa', name: 'pr_valor', type: 'money', required: true, value: p.valorCausa || '' }) + ui.field({ label: 'Status', name: 'pr_status', type: 'select', value: 'ativo', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'suspenso', label: 'Suspenso' }] }) }) : sDocs) + '</div>';
  }
  /* Número CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO. Válido quando (NNNNNNN AAAA J TR OOOO DD) mod 97 = 1 (Res. CNJ 65/2008) */
  const mod97 = (str) => { let r = 0; for (let i = 0; i < str.length; i++) r = (r * 10 + +str[i]) % 97; return r; };
  function cnjValido(v) { const m = String(v || '').match(/^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/); return !!m && mod97(m[1] + m[3] + m[4] + m[5] + m[6] + m[2]) === 1; }
  function cnjCorrigido(v) { const m = String(v || '').match(/^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/); if (!m) return v; const dd = 98 - mod97(m[1] + m[3] + m[4] + m[5] + m[6] + '00'); return m[1] + '-' + (dd < 10 ? '0' : '') + dd + '.' + m[3] + '.' + m[4] + '.' + m[5] + '.' + m[6]; }
  /* Máscara e leitura do número (CNJ e administrativo) + contrato do cliente + documento da parte */
  function mountProcesso(root) {
    const q = (n) => root.querySelector('[name="' + n + '"]');
    const num = q('pr_numero'), out = root.querySelector('[data-jur-cnj]');
    const ler = () => {
      const v = num.value.trim(), tipo = (root.querySelector('[name="pr_tipo"]:checked') || {}).value || 'judicial';
      let m;
      if (!v) { out.innerHTML = 'Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO. Administrativo federal: 00000.000000/AAAA-00.'; num.removeAttribute('aria-invalid'); return; }
      if ((m = v.match(/^(\d{7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/))) {
        const just = { 4: 'Justiça Federal', 8: 'Justiça Estadual', 5: 'Justiça do Trabalho' }[m[4]] || 'Segmento ' + m[4];
        const trib = m[4] === '4' ? 'TRF' + (+m[5]) : m[4] === '8' && m[5] === '26' ? 'TJSP' : 'Tribunal ' + m[5];
        const orig = J.origensCnj[m[6]];
        if (!cnjValido(v)) { out.innerHTML = '<span class="lt-danger">Dígito verificador não confere (' + m[2] + '). Pelo módulo 97 da Resolução CNJ 65/2008, o número esperado é ' + esc(cnjCorrigido(v)) + '. Confira na capa do processo.</span>'; num.setAttribute('aria-invalid', 'true'); return; }
        out.innerHTML = ui.chip('Número CNJ válido', 'green', { icon: 'check' }) + ' Dígito verificador conferido · ano ' + m[3] + ' · ' + just + ' · ' + trib + ' · origem ' + m[6] + (orig ? ' (' + orig + ')' : '');
        num.removeAttribute('aria-invalid');
        if (m[4] === '4' && m[5] === '03' && q('pr_tribunal')) q('pr_tribunal').value = OPT.tribunal[0];
        if (orig && q('pr_subsecao') && OPT.subsecao.indexOf(orig) >= 0) q('pr_subsecao').value = orig;
      } else if (/^\d{5}\.\d{6}\/\d{4}-\d{2}$/.test(v)) { out.innerHTML = ui.chip('Administrativo federal', 'blue', { icon: 'check' }) + ' Receita Federal ou CARF (e-CAC / e-Processo)'; num.removeAttribute('aria-invalid'); }
      else if (/^AIIM/i.test(v)) { out.innerHTML = ui.chip('AIIM (SEFAZ-SP)', 'blue', { icon: 'check' }) + ' Auto de infração estadual'; num.removeAttribute('aria-invalid'); }
      else { out.innerHTML = '<span class="lt-danger">' + (tipo === 'judicial' ? 'Número incompleto. Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO (20 dígitos).' : 'Formato não reconhecido. Ex.: 10830.721456/2026-11 ou AIIM 4.137.592-0.') + '</span>'; num.setAttribute('aria-invalid', 'true'); }
    };
    if (num) {
      num.addEventListener('input', () => {
        const tipo = (root.querySelector('[name="pr_tipo"]:checked') || {}).value || 'judicial';
        if (tipo === 'judicial' && /^[\d.-]*$/.test(num.value)) {
          const d = num.value.replace(/\D/g, '').slice(0, 20);
          num.value = d.replace(/^(\d{7})(\d)/, '$1-$2').replace(/^(\d{7}-\d{2})(\d)/, '$1.$2').replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, '$1.$2').replace(/^(\d{7}-\d{2}\.\d{4}\.\d)(\d)/, '$1.$2').replace(/^(\d{7}-\d{2}\.\d{4}\.\d\.\d{2})(\d)/, '$1.$2');
        }
        ler();
      });
      ler();
    }
    root.addEventListener('change', (e) => {
      const n = e.target.getAttribute('name');
      if (n === 'pr_cliente' && e.target.value === 'novo') { e.target.value = ''; ui.openSheet('jur-novo-cliente', {}); return; }
      if (n === 'pr_cliente') {
        const c = contratoDa(+e.target.value), h = root.querySelector('[data-jur-contrato]');
        if (h) h.textContent = c ? 'Contrato ' + c.id + ': ' + fmt.moeda(c.honorarioMensal) + '/mês + ' + fmt.pct(c.exitoPct) + ' de êxito' : 'Cliente sem contrato de honorários.';
        const ng = D.negocios.find((x) => x.empresaId === +e.target.value && x.desfecho === 'ganho'); if (ng && q('pr_negocio')) q('pr_negocio').value = ng.id;
      }
      if (n === 'pr_parte') { const pt = parte(+e.target.value); if (q('pr_parte_doc')) q('pr_parte_doc').value = pt && pt.documento ? pt.documento : ''; }
      if (n === 'pr_tipo') {
        const adm = e.target.value === 'administrativo';
        if (q('pr_tribunal')) q('pr_tribunal').value = adm ? 'Receita Federal do Brasil' : OPT.tribunal[0];
        if (q('pr_instancia')) q('pr_instancia').value = adm ? 'Administrativo · DRF' : '1ª instância';
        num.placeholder = adm ? '00000.000000/0000-00' : '0000000-00.0000.0.00.0000'; ler();
      }
    });
  }
  App.screen({
    id: 'jur.case.new', hash: 'jur-processo-cadastro', module: 'juridico', title: 'Cadastro de processo', navGroup: 'juridico', navParent: 'jur-processos',
    render: (params) => {
      const p = params.id ? proc(params.id) : null;
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Processos', hash: 'jur-processos' }].concat(p ? [{ label: p.numero, hash: 'jur-processo-' + p.id }, { label: 'Editar' }] : [{ label: 'Novo processo' }])),
        title: p ? 'Editar processo' : 'Novo processo', sub: p ? esc(emp(p.empresaId).fantasia + ' · ' + p.numero) : 'Campos do item 4.2 da proposta, organizados por assunto. Os alertas de prazo ficam ligados automaticamente.' });
      const campos = ['Número do processo', 'Tribunal', 'Vara', 'Comarca', 'Tipo de ação', 'Fase processual', 'Advogado responsável', 'Valor da causa', 'Status (ativo, suspenso, encerrado)', 'Andamentos (aba da ficha)', 'Documentos anexos'];
      const aside = ui.card({ title: 'Ao salvar', icon: 'zap', body: ui.list([
        { icon: 'folder', tone: 'slate', title: 'Cria a pasta de documentos', meta: 'com acesso só da equipe jurídica e dos sócios' },
        { icon: 'bell', tone: 'blue', title: 'Liga os alertas de prazo', meta: 'AUT-12, AUT-13 e AUT-14 para cada prazo cadastrado' },
        { icon: 'calendar', tone: 'amber', title: 'Entra na agenda jurídica', meta: 'prazos internos, fatais e sessões' },
        { icon: 'mail', tone: 'violet', title: 'Avisa o advogado responsável', meta: 'no sistema e por e-mail' }
      ]) }) + ui.card({ title: 'Campos pedidos na proposta (4.2)', icon: 'list-checks', body: '<ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:13px">' + campos.map((c) => '<li class="lt-row lt-row--nowrap" style="gap:8px"><span class="lt-success">' + I('check') + '</span>' + esc(c) + '</li>').join('') + '</ul>' }) +
        ui.callout({ tone: 'gold', title: 'Pergunta em aberto (Q3)', text: 'Contrato ganho no CRM cria o cliente e uma tarefa "Preparar ação" para o Jurídico? Hoje a regra AUT-15 está desligada.' });
      return header + '<div class="lt-g12"><div class="lt-c8">' + formProcesso(p, false) + '</div><div class="lt-c4"><div class="lt-stack">' + aside + '</div></div></div>' +
        '<div class="lt-form-actions"><span class="lt-form-actions__info">Campos com * são obrigatórios</span><a class="lt-btn lt-btn--default" href="#' + (p ? 'jur-processo-' + p.id : 'jur-processos') + '">Cancelar</a>' +
        ui.btn({ label: p ? 'Salvar alterações' : 'Salvar processo', variant: 'primary', icon: 'check', acao: 'salvar', toast: p ? 'Processo atualizado' : 'Processo cadastrado', toastText: p ? 'As mudanças ficaram na auditoria.' : 'Pasta criada, alertas ligados e advogado avisado.', ir: p ? 'jur-processo-' + p.id : 'jur-processo-2005' }) + '</div>';
    },
    mount: (root) => mountProcesso(root)
  });
  ui.registerSheet('jur-novo-processo', (prm) => ({
    eyebrow: 'Jurídico', title: 'Novo processo', sub: 'Cadastro rápido. Fase, situação e documentos ficam no formulário completo.', size: 'lg',
    body: formProcesso(null, true, { empresa: prm.empresa }),
    foot: '<a class="lt-btn lt-btn--ghost" href="#jur-processo-cadastro">' + I('external') + '<span>Formulário completo</span></a>' + ui.sheetFoot({ label: 'Salvar processo', toast: 'Processo cadastrado', toastText: 'Alertas de prazo ligados e advogado avisado.', info: 'Campos com * são obrigatórios' }),
    mount: (el) => mountProcesso(el)
  }));

  /* ================================================================== */
  /* ANDAMENTO · registrar (jur.movement.new)                            */
  /* ================================================================== */
  function formAndamento(pid, compact) {
    const p = pid ? proc(pid) : null, et = p ? etapaJ(p.etapa) : null;
    const sProc = ui.section({ title: 'Processo', tone: 'gold', icon: 'scale', body: ui.field({ label: 'Processo', name: 'an_proc', type: 'select', required: true, value: pid || '', placeholder: 'Escolha o processo', options: optsProcessos(true) }) });
    const sQue = ui.section({ title: 'O que aconteceu', tone: 'violet', icon: 'file-text', cols: 2, body:
      ui.field({ label: 'Data do andamento', name: 'an_data', type: 'date', required: true, value: HOJE_ISO }) +
      ui.field({ label: 'Tipo', name: 'an_tipo', type: 'select', required: true, value: 'publicacao', options: Object.keys(J.tiposAndamento).filter((k) => k !== 'alerta').map((k) => ({ value: k, label: J.tiposAndamento[k].nome })) }) +
      ui.field({ label: 'Resumo', name: 'an_titulo', required: true, span: 2, placeholder: 'Ex.: Intimação para contrarrazões à apelação da União' }) +
      ui.field({ label: 'Teor ou observações', name: 'an_texto', type: 'textarea', span: 2, rows: compact ? 2 : 3, placeholder: 'Cole o trecho da publicação ou descreva a decisão' }) +
      ui.field({ label: 'Fonte', name: 'an_fonte', type: 'select', value: 'Diário eletrônico (DJe)', options: J.fontesAndamento.filter((f) => f !== 'Sistema'), hint: 'Captura automática dos tribunais: pergunta Q9.' }) +
      ui.field({ label: 'Atualizar a etapa', name: 'an_etapa', type: 'select', placeholder: et ? 'Manter: ' + et.nome : 'Manter a etapa atual', options: D.funis.juridico.etapas.map((x) => ({ value: x.key, label: x.num + '. ' + x.nome })) }) +
      '<div class="lt-span-full" data-jur-req></div>' });
    const tgl = '<label class="lt-toggle lt-toggle--sm"><input type="checkbox" name="an_gera" checked><span class="lt-toggle__track"></span><span>Abre prazo</span></label>';
    const sPrazo = ui.section({ title: 'Gerar prazo a partir deste andamento', sub: 'O fatal sai da contagem; o interno, da regra D-1.', tone: 'amber', icon: 'calendar-clock', aside: tgl, body:
      '<div data-jur-gera><div class="lt-grid lt-grid--2">' + camposPrazo(p) + camposContagem() + '</div>' + (compact ? '<div class="lt-divider" style="margin:16px 0"></div><div data-jur-calc></div>' : '') + '</div>' +
      '<div data-jur-sem-prazo hidden>' + ui.empty({ small: true, icon: 'history', title: 'Sem prazo', text: 'O andamento só entra na linha do tempo do processo.' }) + '</div>' });
    const sAnexo = ui.section({ title: 'Anexo', tone: 'slate', icon: 'paperclip', body: ui.field({ type: 'upload', accept: 'PDF da publicação ou da decisão · até 25 MB' }) });
    return '<div class="lt-sections">' + sProc + sQue + sPrazo + sAnexo + '</div>';
  }
  function mountAndamento(root, compact) {
    const gera = root.querySelector('[name="an_gera"]');
    const sync = () => { root.querySelector('[data-jur-gera]').hidden = !gera.checked; root.querySelector('[data-jur-sem-prazo]').hidden = gera.checked; const c = root.querySelector('[data-jur-calc-card]'); if (c) c.hidden = !gera.checked; };
    gera.addEventListener('change', sync); sync();
    root.addEventListener('change', (e) => {
      if (e.target.getAttribute('name') === 'an_etapa') {
        const et = D.funis.juridico.etapas.find((x) => x.key === e.target.value), box = root.querySelector('[data-jur-req]');
        const req = et && et.requisitos.length ? et.requisitos.map((r) => r.texto).join(' · ') : '';
        box.innerHTML = et ? ui.callout({ tone: req ? 'warning' : 'info', icon: req ? 'paperclip' : 'info', title: 'Mover para "' + esc(et.nome) + '"', text: (req ? 'Exige: ' + esc(req) + '. ' : '') + (et.acoes.length ? 'Ao salvar: ' + esc(et.acoes.join(' · ')) + '.' : 'Sem ações automáticas nesta etapa.') }) : '';
      }
      if (e.target.getAttribute('name') === 'an_proc' && !compact && e.target.value) App.go('jur-andamento-novo-' + e.target.value);
      if (e.target.getAttribute('name') === 'an_proc' && compact) { const p = proc(e.target.value), r = root.querySelector('[name="pz_resp"]'); if (p && r) r.value = p.advogadoId; }
    });
    mountCalc(root, compact);
  }
  App.screen({
    id: 'jur.movement.new', hash: 'jur-andamento-novo', module: 'juridico', title: 'Registrar andamento', navGroup: 'juridico', navParent: 'jur-processos', exemplo: 2010,
    render: (params) => {
      const p = params.id ? proc(params.id) : null;
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Processos', hash: 'jur-processos' }].concat(p ? [{ label: p.numero, hash: 'jur-processo-' + p.id }] : []).concat([{ label: 'Registrar andamento' }])),
        title: 'Registrar andamento', sub: p ? esc(emp(p.empresaId).fantasia + ' · ' + p.tese) : 'Publicação, decisão, petição ou intimação. Se abrir prazo, o sistema já calcula o interno (D-1).' });
      const ultimos = p ? andamentosDo(p.id).slice(0, 4) : [];
      const aside = '<div class="lt-stack" style="position:sticky;top:calc(var(--topbar-h) + 16px)">' + '<div data-jur-calc-card>' + ui.card({ title: 'Cálculo do prazo', icon: 'calculator', sub: 'Atualiza enquanto você preenche', body: '<div data-jur-calc></div>' }) + '</div>' +
        (p ? ui.card({ title: 'Últimos andamentos', icon: 'history', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#jur-processo-' + p.id + '">Ficha</a>', body: ui.timeline(ultimos.map((a) => { const t = J.tiposAndamento[a.tipo] || {}; return { icon: t.icon, tone: t.tone, title: esc(a.titulo), meta: fmt.data(a.data) + ' · ' + esc(t.nome || '') }; })) }) : '') + '</div>';
      return header + '<div class="lt-g12"><div class="lt-c7">' + formAndamento(p ? p.id : null, false) + '</div><div class="lt-c5">' + aside + '</div></div>' +
        '<div class="lt-form-actions"><span class="lt-form-actions__info">O andamento entra na linha do tempo e na auditoria</span><a class="lt-btn lt-btn--default" href="#' + (p ? 'jur-processo-' + p.id : 'jur-processos') + '">Cancelar</a>' +
        ui.btn({ label: 'Registrar andamento', variant: 'primary', icon: 'check', acao: 'registrar', toast: 'Andamento registrado', toastText: 'Prazo criado e alertas programados.', attrs: { 'data-jur-toast-prazo': true }, ir: p ? 'jur-processo-' + p.id : 'jur-processos' }) + '</div>';
    },
    mount: (root) => mountAndamento(root, false)
  });
  ui.registerSheet('jur-novo-andamento', (prm) => {
    const p = prm.id ? proc(prm.id) : null;
    return { eyebrow: p ? p.numero : 'Jurídico', title: 'Registrar andamento', sub: p ? esc(emp(p.empresaId).fantasia + ' · ' + p.tese) : 'Escolha o processo e descreva o que aconteceu.', size: 'lg',
      body: formAndamento(p ? p.id : null, true),
      foot: (p ? '<a class="lt-btn lt-btn--ghost" href="#jur-andamento-novo-' + p.id + '">' + I('external') + '<span>Abrir em página</span></a>' : '') + ui.sheetFoot({ label: 'Registrar andamento', acao: 'registrar', toast: 'Andamento registrado', toastText: 'Prazo criado e alertas programados.' }).replace('data-acao="registrar"', 'data-acao="registrar" data-jur-toast-prazo'),
      mount: (el) => mountAndamento(el, true) };
  });

  /* ================================================================== */
  /* PRAZOS · lista (jur.deadline.list)                                  */
  /* ================================================================== */
  function prazosFiltrados(S) {
    return prazosAll().filter(meuPrazo).filter((p) => {
      const i = pinfo(p);
      if (S.adv && String(p.responsavelId) !== String(S.adv)) return false;
      if (S.cliente && String(i.e.id) !== String(S.cliente)) return false;
      if (S.tipo && p.tipo !== S.tipo) return false;
      if (S.q) { const t = (p.tipo + ' ' + p.descricao + ' ' + i.e.fantasia + ' ' + i.e.razao + ' ' + (i.pr ? i.pr.numero : '')).toLowerCase(); if (t.indexOf(S.q.toLowerCase()) < 0) return false; }
      switch (S.chip) {
        case 'pendentes': return ['atrasado', 'hoje', 'amanha', 'semana', 'depois'].indexOf(i.grupo) >= 0;
        case 'atrasados': return i.grupo === 'atrasado';
        case 'hojeamanha': return i.grupo === 'hoje' || i.grupo === 'amanha';
        case 'semana': return ['atrasado', 'hoje', 'amanha', 'semana'].indexOf(i.grupo) >= 0;
        case 'cumpridos': return i.grupo === 'cumprido';
        case 'perdidos': return i.grupo === 'perdido';
        default: return true;
      }
    });
  }
  function gruposPrazos(S) {
    const l = prazosFiltrados(S);
    if (!l.length) return ui.empty({ icon: S.chip === 'perdidos' ? 'shield-check' : 'calendar-clock', title: S.chip === 'perdidos' ? 'Nenhum prazo perdido com esses filtros' : 'Nenhum prazo com esses filtros', text: 'Troque o filtro rápido ou limpe a busca.', action: ui.btn({ label: 'Ver todos os pendentes', icon: 'refresh', attrs: { 'data-jur-prazos-reset': true } }) });
    const G = [
      ['atrasado', 'Atrasados', 'alert-triangle', 'red', 'O interno (D-1) já passou. Protocolar com prioridade.'],
      ['hoje', 'Hoje · ' + fmt.diaSemana(HOJE_ISO) + ', ' + fmt.dataCurta(HOJE_ISO), 'clock', 'amber', 'Prazo interno vence hoje.'],
      ['amanha', 'Amanhã · ' + fmt.diaSemana(AMANHA) + ', ' + fmt.dataCurta(AMANHA), 'calendar', 'amber', 'Último dia útil antes do fatal.'],
      ['semana', 'Ainda nesta semana', 'calendar', 'blue', 'Internos até sexta, ' + fmt.dataCurta(SEX) + '.'],
      ['depois', 'Próximas semanas', 'calendar-clock', 'slate', ''],
      ['cumprido', 'Cumpridos', 'check-circle', 'green', 'Do mais recente para o mais antigo.'],
      ['perdido', 'Perdidos', 'x-circle', 'red', 'Fatal sem cumprimento. Ficam no relatório de cumprimento.']
    ];
    const by = util.agrupar(l, (p) => pinfo(p).grupo);
    return '<div class="lt-stack">' + G.filter((g) => by[g[0]]).map((g) => {
      const rows = by[g[0]].sort((a, b) => (g[0] === 'cumprido' ? b.cumpridoEm.localeCompare(a.cumpridoEm) : g[0] === 'perdido' ? b.fatal.localeCompare(a.fatal) : a.interno.localeCompare(b.interno)));
      return ui.card({ title: g[1], icon: g[2], sub: g[4], flush: true, actions: ui.chip(fmt.plural(rows.length, 'prazo'), g[3], { dot: true }), body: tabelaPrazos(rows) });
    }).join('') + '</div>';
  }
  App.screen({
    id: 'jur.deadline.list', hash: 'jur-prazos', module: 'juridico', title: 'Prazos', nav: true, navGroup: 'juridico', navOrder: 3,
    render: () => {
      const S = App.state.jurPrazos = App.state.jurPrazos || { chip: 'pendentes', q: '', adv: '', cliente: '', tipo: '' };
      const all = prazosAll().filter(meuPrazo), inf = all.map((p) => [p, pinfo(p)]);
      const cnt = (fn) => inf.filter((x) => fn(x[1], x[0])).length;
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Prazos' }]), title: 'Prazos', sub: 'A equipe trabalha pelo <b>prazo interno (D-1)</b>: 1 dia útil antes do fatal, pelo calendário de feriados e suspensões. O fatal aparece como referência.',
        actions: exportBtn('prazos-juridico-nov-2026.xlsx', all.length) + '<a class="lt-btn lt-btn--default" href="#jur-agenda">' + I('calendar') + '<span>Ver na agenda</span></a>' + ui.btn({ label: 'Novo prazo', variant: 'primary', icon: 'plus', sheet: 'jur-novo-prazo' }) });
      const kpis = ui.kpis([
        { label: 'Atrasados', value: fmt.num(cnt((i) => i.grupo === 'atrasado')), icon: 'alert-triangle', foot: 'D-1 vencido · gestor avisado', dir: cnt((i) => i.grupo === 'atrasado') ? 'up' : 'flat', good: false },
        { label: 'Internos hoje', value: fmt.num(cnt((i) => i.grupo === 'hoje')), icon: 'clock', foot: fmt.dataExtenso(HOJE_ISO).split(',')[0] + ', ' + fmt.dataCurta(HOJE_ISO) },
        { label: 'Internos amanhã', value: fmt.num(cnt((i) => i.grupo === 'amanha')), icon: 'calendar', foot: fmt.diaSemana(AMANHA) + ', ' + fmt.dataCurta(AMANHA) },
        { label: 'Até sexta', value: fmt.num(cnt((i, p) => p.status === 'pendente' && p.interno <= SEX && i.grupo !== 'atrasado')), icon: 'calendar-clock', foot: 'internos de ' + fmt.dataCurta(SEG) + ' a ' + fmt.dataCurta(SEX) }
      ]);
      const tipos = all.map((p) => p.tipo).filter((v, i, a) => a.indexOf(v) === i).sort();
      const filtros = ui.filters({
        busca: 'Buscar cliente ou número',
        selects: [{ label: 'Responsável', name: 'f_adv', value: S.adv, options: optsAdv() }, { label: 'Cliente', name: 'f_cliente', value: S.cliente, options: clientesJur().filter((e) => inf.some((x) => x[1].e.id === e.id)).map((e) => ({ value: e.id, label: e.fantasia })) }, { label: 'Tipo', name: 'f_tipo', value: S.tipo, options: tipos }],
        chipGroup: 'single', chips: [
          { value: 'pendentes', label: 'Pendentes', count: cnt((i, p) => p.status === 'pendente' && i.grupo !== 'perdido') }, { value: 'atrasados', label: 'Atrasados', tone: 'red', count: cnt((i) => i.grupo === 'atrasado') },
          { value: 'hojeamanha', label: 'Hoje e amanhã', tone: 'amber', count: cnt((i) => i.grupo === 'hoje' || i.grupo === 'amanha') }, { value: 'semana', label: 'Esta semana', tone: 'blue', count: cnt((i) => ['atrasado', 'hoje', 'amanha', 'semana'].indexOf(i.grupo) >= 0) },
          { value: 'cumpridos', label: 'Cumpridos', tone: 'green', count: cnt((i) => i.grupo === 'cumprido') }, { value: 'perdidos', label: 'Perdidos', tone: 'red', count: cnt((i) => i.grupo === 'perdido') }, { value: 'todos', label: 'Todos', count: all.length }
        ].map((c) => Object.assign(c, { active: c.value === S.chip }))
      });
      return header + kpis + '<div class="lt-mt-6"></div>' + filtros + '<div data-jur-prazos>' + gruposPrazos(S) + '</div>';
    },
    mount: (root) => {
      const S = App.state.jurPrazos, box = root.querySelector('[data-jur-prazos]');
      const redraw = () => { box.innerHTML = gruposPrazos(S); ui.enhance(box); };
      const busca = root.querySelector('[data-filter-search]'); if (busca) { busca.value = S.q; busca.addEventListener('input', () => { S.q = busca.value.trim(); redraw(); }); }
      root.addEventListener('change', (e) => { const map = { f_adv: 'adv', f_cliente: 'cliente', f_tipo: 'tipo' }, k = map[e.target.getAttribute('name')]; if (k) { S[k] = e.target.value; redraw(); } });
      root.addEventListener('lt:filter', (e) => { S.chip = e.detail.value; redraw(); });
      root.addEventListener('click', (e) => { if (e.target.closest('[data-jur-prazos-reset]')) { Object.assign(S, { chip: 'pendentes', q: '', adv: '', cliente: '', tipo: '' }); App.refresh(); } });
    }
  });

  /* ================================================================== */
  /* PRAZO · cadastrar (jur.deadline.new)                                */
  /* ================================================================== */
  function formPrazo(pid, compact, pre) {
    const p = pid ? proc(pid) : null;
    const ands = p ? andamentosDo(p.id).filter((a) => a.tipo !== 'alerta') : [];
    const sProc = ui.section({ title: 'Processo', tone: 'gold', icon: 'scale', cols: 2, body:
      ui.field({ label: 'Processo', name: 'pz_proc', type: 'select', required: true, span: 2, value: pid || '', placeholder: 'Escolha o processo', options: optsProcessos(true) }) +
      ui.field({ label: 'Andamento de origem', name: 'pz_and', type: 'select', span: 2, placeholder: p ? 'Sem andamento de origem' : 'Escolha o processo primeiro', options: ands.map((a) => ({ value: a.id, label: fmt.dataCurta(a.data) + ' · ' + a.titulo })), hint: 'Liga o prazo à publicação ou decisão que o abriu.' }) });
    const sPrazo = ui.section({ title: 'Prazo', tone: 'violet', icon: 'flag', cols: 2, body: camposPrazo(p, pre) });
    const sCont = ui.section({ title: 'Contagem', sub: 'Dias úteis excluem fins de semana, feriados e suspensões do calendário.', tone: 'amber', icon: 'calendar-clock', cols: 2, body: camposContagem(pre) });
    const sCalc = compact ? ui.section({ title: 'Cálculo pelo calendário', tone: 'gold', icon: 'calculator', body: '<div data-jur-calc></div>' }) : '';
    return '<div class="lt-sections">' + sProc + sPrazo + sCont + sCalc + secAlertas() + '</div>';
  }
  function mountPrazoForm(root, compact) {
    root.addEventListener('change', (e) => {
      if (e.target.getAttribute('name') !== 'pz_proc') return;
      const p = proc(e.target.value);
      if (!compact && p) { App.go('jur-prazo-novo-' + p.id); return; }
      const r = root.querySelector('[name="pz_resp"]'), a = root.querySelector('[name="pz_and"]');
      if (p && r) r.value = p.advogadoId;
      if (a) a.innerHTML = '<option value="">Sem andamento de origem</option>' + (p ? andamentosDo(p.id).filter((x) => x.tipo !== 'alerta').map((x) => '<option value="' + x.id + '">' + esc(fmt.dataCurta(x.data) + ' · ' + x.titulo) + '</option>').join('') : '');
    });
    mountCalc(root, compact);
  }
  App.screen({
    id: 'jur.deadline.new', hash: 'jur-prazo-novo', module: 'juridico', title: 'Cadastrar prazo', navGroup: 'juridico', navParent: 'jur-prazos', exemplo: 2003,
    render: (params) => {
      const p = params.id ? proc(params.id) : null;
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Prazos', hash: 'jur-prazos' }, { label: 'Cadastrar prazo' }]), title: 'Cadastrar prazo',
        sub: 'Informe a intimação e o prazo: o sistema calcula o fatal pela contagem e o interno (D-1) pelo calendário, mostrando os feriados e as suspensões considerados.' });
      return header + '<div class="lt-g12"><div class="lt-c7">' + formPrazo(p ? p.id : null, false) + '</div><div class="lt-c5"><div style="position:sticky;top:calc(var(--topbar-h) + 16px)">' + ui.card({ title: 'Cálculo do prazo', icon: 'calculator', accent: true, sub: 'Atualiza enquanto você preenche', body: '<div data-jur-calc></div>' }) + '</div></div></div>' +
        '<div class="lt-form-actions"><span class="lt-form-actions__info">Campos com * são obrigatórios</span><a class="lt-btn lt-btn--default" href="#jur-prazos">Cancelar</a>' +
        ui.btn({ label: 'Salvar prazo', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Prazo cadastrado', toastText: 'Alertas programados.', attrs: { 'data-jur-toast-prazo': true }, ir: 'jur-prazos' }) + '</div>';
    },
    mount: (root) => mountPrazoForm(root, false)
  });
  ui.registerSheet('jur-novo-prazo', (prm) => {
    const pid = prm.processo || null, p = pid ? proc(pid) : null;
    return { eyebrow: p ? p.numero : 'Jurídico', title: 'Novo prazo', sub: 'Fatal pela contagem, interno pela regra D-1.', size: 'lg',
      body: formPrazo(pid, true),
      foot: '<a class="lt-btn lt-btn--ghost" href="#jur-prazo-novo' + (pid ? '-' + pid : '') + '">' + I('external') + '<span>Abrir em página</span></a>' + ui.sheetFoot({ label: 'Salvar prazo', toast: 'Prazo cadastrado', toastText: 'Alertas programados.' }).replace('data-acao="salvar"', 'data-acao="salvar" data-jur-toast-prazo'),
      mount: (el) => mountPrazoForm(el, true) };
  });

  /* Gaveta: detalhe de um prazo (com o cálculo refeito a partir da intimação) */
  ui.registerSheet('jur-prazo', (prm) => {
    const p = prazo(prm.id);
    if (!p) return { title: 'Prazo não encontrado', body: ui.empty({ icon: 'calendar-clock', title: 'Este prazo não existe' }) };
    const i = pinfo(p), and = p.andamentoId ? J.andamentos.find((a) => a.id === p.andamentoId) : null;
    const disp = disparosDe([p]);
    const calc = p.forma ? calcHtml({ forma: p.forma, data: p.data, dias: p.dias, contagem: p.contagem, susp: true, hora: p.hora }, true) : '<ol style="margin:0;padding-left:18px">' + util.explicarD1(p.fatal).map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>';
    const resumo = '<div class="lt-summary"><div class="lt-summary__item" style="background:var(--gold-subtle)"><div class="lt-summary__label">Interno (D-1)</div><div class="lt-summary__value lt-gold">' + fmt.data(p.interno) + '</div></div><div class="lt-summary__item"><div class="lt-summary__label">Fatal</div><div class="lt-summary__value">' + fmt.data(p.fatal) + (p.hora ? ' · ' + p.hora : '') + '</div></div><div class="lt-summary__item"><div class="lt-summary__label">Status</div><div class="lt-summary__value">' + ui.chip(i.st[0], i.st[1], { dot: true }) + '</div></div></div>';
    const extraPerdido = p.status === 'perdido' && p.motivoPerda ? ui.callout({ tone: 'danger', title: 'Por que foi perdido', text: esc(p.motivoPerda) + (p.perdidoEm ? ' · registrado em ' + fmt.data(p.perdidoEm) : '') })
      : i.grupo === 'perdido' ? ui.callout({ tone: 'danger', title: 'Fatal passou sem protocolo', text: 'Registre a perda com o motivo para o relatório de cumprimento.', actions: ui.btn({ label: 'Registrar perda', size: 'sm', variant: 'danger', icon: 'x-circle', dialog: 'jur-perda-prazo', attrs: { 'data-id': p.id } }) }) : '';
    return { eyebrow: 'Prazo #' + p.id + ' · ' + p.tipo, title: p.tipo + ' · ' + i.e.fantasia, sub: '<span class="lt-mono">' + esc(i.pr ? i.pr.numero : '') + '</span>', size: 'lg', noFocus: true,
      body: '<div class="lt-stack">' + resumo + extraPerdido +
        ui.section({ title: 'Como o prazo foi contado', tone: 'amber', icon: 'calculator', body: calc }) +
        ui.section({ title: 'Detalhes', tone: 'slate', icon: 'file-text', body: ui.dl([['Descrição', esc(p.descricao)], ['Responsável', ui.person(p.responsavelId)], ['Processo', i.pr ? '<a href="#jur-processo-' + i.pr.id + '" data-fechar-sheet>' + esc(i.e.fantasia + ' · ' + classeCurta(i.pr.classe)) + '</a>' : '—'], ['Andamento de origem', and ? esc(fmt.dataCurta(and.data) + ' · ' + and.titulo) : '—'], ['Cumprido em', p.cumpridoEm ? fmt.data(p.cumpridoEm) + (p.cumpridoEm <= p.interno ? ' · no D-1' : ' · no dia fatal') : '—']]) }) +
        (p.status === 'pendente' ? ui.section({ title: 'Alertas automáticos', tone: 'blue', icon: 'bell', body: ui.list(disp.map((x) => ({ icon: x.ja ? 'check-circle' : 'clock', tone: x.ja ? 'green' : 'amber', title: esc(x.txt), meta: ui.chip(x.cod, 'violet') + '<span>' + esc(fmt.dataHora(x.quando)) + ' · ' + esc(x.para.map(nome1).join(' e ')) + '</span>', aside: x.ja ? ui.chip('Rodou', 'green') : ui.chip('Agendado', 'violet') }))) }) : '') + '</div>',
      foot: (i.pr ? '<a class="lt-btn lt-btn--default" href="#jur-processo-' + i.pr.id + '">' + I('external') + '<span>Abrir processo</span></a>' : '') + '<span class="lt-push"></span>' +
        (p.status === 'pendente' ? (i.dF < 0 ? ui.btn({ label: 'Registrar perda', variant: 'danger-outline', icon: 'x-circle', dialog: 'jur-perda-prazo', attrs: { 'data-id': p.id } }) : '') + ui.btn({ label: 'Cumprir prazo', variant: 'primary', icon: 'check', dialog: 'jur-cumprir-prazo', attrs: { 'data-id': p.id } }) : ui.btn({ label: 'Fechar', attrs: { 'data-fechar-sheet': true } })) };
  });

  /* Diálogo: cumprir prazo (data de cumprimento alimenta o relatório D-1 × fatal) */
  ui.registerDialog('jur-cumprir-prazo', (prm) => {
    const p = prazo(prm.id); if (!p) return { title: 'Prazo não encontrado' };
    const i = pinfo(p);
    const aviso = (d) => (d <= p.interno ? ui.callout({ tone: 'success', title: 'Cumprido no D-1', text: 'Conta como cumprido no prazo interno.' }) : d <= p.fatal ? ui.callout({ tone: 'warning', title: 'Cumprido no dia fatal', text: 'Entra no relatório como cumprido fora do D-1.' }) : ui.callout({ tone: 'danger', title: 'Depois do fatal (' + fmt.data(p.fatal) + ')', text: 'Protocolo depois do fatal não conta como cumprimento. Registre a perda com o motivo abaixo.' }));
    return { title: 'Cumprir prazo', icon: 'check-circle', text: esc(p.tipo + ' · ' + i.e.fantasia) + '<br>Interno ' + fmt.data(p.interno) + ' · fatal ' + fmt.data(p.fatal),
      body: ui.section({ title: 'Cumprimento', tone: 'green', icon: 'check', cols: 2, body: ui.field({ label: 'Data do protocolo', name: 'cp_data', type: 'date', required: true, value: HOJE_ISO }) + ui.field({ label: 'Nº do protocolo', name: 'cp_prot', placeholder: 'Ex.: 2026110900123' }) + ui.field({ label: 'Comprovante', type: 'upload', span: 2, accept: 'PDF do protocolo · até 10 MB' }) }) + '<div class="lt-mt-4" data-cp-aviso>' + aviso(HOJE_ISO) + '</div><div class="lt-mt-4" data-cp-perda hidden>' + secPerda() + '</div>',
      foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) +
        ui.btn({ label: 'Confirmar cumprimento', variant: 'primary', icon: 'check', acao: 'concluir', toast: 'Prazo cumprido', toastText: esc(p.tipo + ' · ' + i.e.fantasia) + '. Alertas pendentes cancelados.', fechar: 'tudo', attrs: { 'data-jur-cumprir': p.id, 'data-jur-data': HOJE_ISO } }) +
        ui.btn({ label: 'Registrar perda', variant: 'danger', icon: 'x-circle', acao: 'registrar', toast: 'Perda registrada', toastTone: 'warning', toastText: esc(p.tipo + ' · ' + i.e.fantasia) + '. Entra no relatório de cumprimento com o motivo.', fechar: 'tudo', attrs: { 'data-jur-perda': p.id, 'data-jur-data': HOJE_ISO, hidden: true } }),
      mount: (dlg) => {
        const inp = dlg.querySelector('[name="cp_data"]'), b = dlg.querySelector('[data-jur-cumprir]'), bp = dlg.querySelector('[data-jur-perda]'), box = dlg.querySelector('[data-cp-perda]');
        ligarPerda(dlg, bp);
        inp.addEventListener('change', () => {
          const depois = inp.value > p.fatal;
          dlg.querySelector('[data-cp-aviso]').innerHTML = aviso(inp.value); b.setAttribute('data-jur-data', inp.value); bp.setAttribute('data-jur-data', inp.value);
          box.hidden = !depois; b.hidden = depois; bp.hidden = !depois;
        });
      } };
  });

  ui.registerDialog('jur-perda-prazo', (prm) => {
    const p = prazo(prm.id); if (!p) return { title: 'Prazo não encontrado' };
    const i = pinfo(p);
    return { title: 'Registrar perda do prazo', icon: 'alert-triangle', iconTone: 'red', text: esc(p.tipo + ' · ' + i.e.fantasia) + '<br>Fatal ' + fmt.data(p.fatal) + ' sem protocolo',
      body: secPerda(),
      foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Registrar perda', variant: 'danger', icon: 'x-circle', acao: 'registrar', toast: 'Perda registrada', toastTone: 'warning', toastText: esc(p.tipo + ' · ' + i.e.fantasia) + '. O motivo aparece na gaveta do prazo e no relatório.', fechar: 'tudo', attrs: { 'data-jur-perda': p.id, 'data-jur-data': HOJE_ISO } }),
      mount: (dlg) => ligarPerda(dlg, dlg.querySelector('[data-jur-perda]')) };
  });

  /* ================================================================== */
  /* AGENDA JURÍDICA (jur.calendar)                                      */
  /* ================================================================== */
  function agState() { return App.state.jurAgenda || (App.state.jurAgenda = { view: 'quadro', semana: SEG, ano: App.HOJE.getFullYear(), mes: App.HOJE.getMonth(), pessoas: [], tipos: ['prazo_interno', 'prazo_fatal', 'audiencia', 'reuniao', 'interno', 'treinamento'] }); }
  function agFiltrados() { const S = agState(); return agendaItens().filter((e) => S.tipos.indexOf(e.tipo) >= 0 && (!S.pessoas.length || e.pessoas.some((p) => S.pessoas.indexOf(p) >= 0))); }
  function pill(e) {
    const t = D.tiposEvento[e.tipo] || { tone: 'gold' };
    const a = e.kind === 'prazo' ? ' data-sheet="jur-prazo" data-id="' + e.prazoId + '"' : ' data-sheet="jur-evento" data-ev="' + e.id + '"';
    return '<button type="button" class="lt-cal__event" data-tone="' + t.tone + '"' + a + ' style="white-space:normal;display:block;line-height:1.3;padding:3px 6px" title="' + esc((e.inicio ? e.inicio + ' · ' : '') + e.titulo) + '">' + (e.inicio ? '<b>' + e.inicio + '</b> ' : '') + esc(e.titulo) + '</button>';
  }
  const toCal = (e) => ({ data: e.data, inicio: e.inicio, fim: e.fim, hora: e.inicio, titulo: e.titulo, sub: e.local, tone: (D.tiposEvento[e.tipo] || {}).tone, sheet: e.kind === 'prazo' ? 'jur-prazo' : 'jur-evento', params: e.kind === 'prazo' ? { id: e.prazoId } : { ev: e.id } });
  function quadro() {
    const S = agState(), itens = agFiltrados(), dias = [0, 1, 2, 3, 4].map((k) => util.addDias(S.semana, k));
    const pessoas = S.pessoas.length ? S.pessoas : AGENDA_PESSOAS;
    let h = '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table" style="table-layout:fixed;min-width:900px"><thead><tr><th style="width:190px">Pessoa</th>' + dias.map((d) => {
      const fer = util.feriado(d), hj = util.iso(d) === HOJE_ISO;
      return '<th' + (hj ? ' style="color:var(--gold-text)"' : '') + '>' + fmt.diaSemanaCurto(d) + ' ' + fmt.dataCurta(d) + (hj ? ' · hoje' : '') + (fer ? '<span class="lt-table__secondary" style="color:var(--danger-text);text-transform:none;letter-spacing:0;font-weight:600">' + esc(fer.nome) + '</span>' : '') + '</th>';
    }).join('') + '</tr></thead><tbody>';
    pessoas.forEach((pid) => {
      const p = pes(pid), meus = itens.filter((e) => e.pessoas.indexOf(pid) >= 0);
      const nPz = meus.filter((e) => e.kind === 'prazo' && e.data >= util.iso(dias[0]) && e.data <= util.iso(dias[4])).length, nEv = meus.filter((e) => e.kind === 'evento' && e.data >= util.iso(dias[0]) && e.data <= util.iso(dias[4])).length;
      h += '<tr><td style="vertical-align:top">' + ui.person(p, esc(p.cargoCurto)) + '<div class="lt-small lt-muted lt-mt-2">' + fmt.plural(nPz, 'prazo') + ' · ' + fmt.plural(nEv, 'compromisso') + '</div></td>' + dias.map((d) => {
        const iso = util.iso(d), evs = meus.filter((e) => e.data === iso).sort(ordemAgenda);
        const bg = util.feriado(d) ? 'background:var(--danger-subtle);' : iso === HOJE_ISO ? 'background:var(--gold-subtle);' : '';
        return '<td style="vertical-align:top;' + bg + '"><div class="lt-stack" style="gap:4px">' + (evs.map(pill).join('') || '<span class="lt-muted lt-small">—</span>') + '</div></td>';
      }).join('') + '</tr>';
    });
    return h + '</tbody></table></div></div>';
  }
  function agCal() {
    const S = agState(), itens = agFiltrados();
    if (S.view === 'mes') return ui.calMonth({ ano: S.ano, mes: S.mes, eventos: itens.map(toCal), max: 3 });
    if (S.view === 'semana') return ui.calWeek({ inicio: S.semana, dias: 5, horaIni: 8, horaFim: 19, eventos: itens.filter((e) => !e.allDay).map(toCal), diaInteiro: itens.filter((e) => e.allDay).map(toCal) });
    return quadro();
  }
  function agRotulo() {
    const S = agState();
    if (S.view === 'mes') return fmt.mesAno(new Date(S.ano, S.mes, 1));
    const a = util.parse(S.semana), b = util.addDias(a, 4);
    return a.getDate() + (a.getMonth() !== b.getMonth() ? ' de ' + util.MESES[a.getMonth()] : '') + ' a ' + b.getDate() + ' de ' + util.MESES[b.getMonth()] + ' de ' + b.getFullYear();
  }
  function agRodape() {
    const S = agState(), lim = util.iso(util.addDias(App.HOJE, 21));
    const fatais = pendentes().filter((p) => p.fatal >= HOJE_ISO && p.fatal <= lim && (!S.pessoas.length || S.pessoas.indexOf(p.responsavelId) >= 0)).sort((a, b) => a.fatal.localeCompare(b.fatal));
    const sess = agendaItens().filter((e) => e.kind === 'evento' && e.tipo === 'audiencia' && e.data >= HOJE_ISO && (!S.pessoas.length || e.pessoas.some((p) => S.pessoas.indexOf(p) >= 0))).sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
    return '<div class="lt-c6">' + ui.card({ title: 'Prazos fatais nas próximas 3 semanas', icon: 'flag', flush: true, body: ui.list(fatais.map((p) => { const i = pinfo(p); return { lead: ui.dateBox(p.fatal, i.grupo === 'atrasado' ? 'red' : ''), title: esc(p.tipo + ' · ' + i.e.fantasia), meta: 'Interno ' + fmt.dataCurta(p.interno) + ' · ' + esc(nome1(p.responsavelId)) + ' · ' + ui.chip(i.st[0], i.st[1], { dot: true }), attrs: { 'data-id': p.id }, sheet: 'jur-prazo' }; }), { empty: { icon: 'flag', title: 'Nenhum fatal no período' } }) }) + '</div>' +
      '<div class="lt-c6">' + ui.card({ title: 'Audiências, sessões e despachos', icon: 'gavel', flush: true, body: ui.list(sess.map((e) => ({ lead: ui.dateBox(e.data), title: esc(e.titulo), meta: esc(e.inicio + '–' + e.fim + ' · ' + e.local + ' · ' + e.pessoas.map(nome1).join(', ')), attrs: { 'data-ev': e.id }, sheet: 'jur-evento' })), { empty: { icon: 'gavel', title: 'Nenhuma sessão marcada' } }) }) + '</div>';
  }
  App.screen({
    id: 'jur.calendar', hash: 'jur-agenda', module: 'juridico', title: 'Agenda jurídica', nav: true, navGroup: 'juridico', navLabel: 'Agenda jurídica', navOrder: 4,
    render: () => {
      const S = agState();
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Agenda jurídica' }]), title: 'Agenda jurídica', sub: 'Prazos internos e fatais, audiências, sessões e reuniões de toda a equipe jurídica, compartilhada com os sócios. Feriados vêm do calendário.',
        actions: ui.btn({ label: 'Novo compromisso', icon: 'calendar', sheet: 'core-novo-compromisso' }) + ui.btn({ label: 'Novo prazo', variant: 'primary', icon: 'plus', sheet: 'jur-novo-prazo' }) });
      const pessoas = '<div class="lt-chips" data-grp="pessoas" data-filter-group="multi" aria-label="Filtrar por pessoa">' + AGENDA_PESSOAS.map((id) => { const p = pes(id); return '<button type="button" class="lt-filter-chip' + (S.pessoas.indexOf(id) >= 0 ? ' is-active' : '') + '" data-value="' + id + '" title="' + esc(p.nome) + '">' + ui.avatar(p, 'xs') + esc(p.nome.split(' ')[0]) + '</button>'; }).join('') + '</div>';
      const tipos = '<div class="lt-chips" data-grp="tipos" data-filter-group="multi" aria-label="Filtrar por tipo">' + ['prazo_interno', 'prazo_fatal', 'audiencia', 'reuniao', 'interno', 'treinamento'].map((k) => { const t = D.tiposEvento[k]; return '<button type="button" class="lt-filter-chip' + (S.tipos.indexOf(k) >= 0 ? ' is-active' : '') + '" data-value="' + k + '"><span class="lt-filter-chip__dot" style="color:var(--tone-' + t.tone + '-solid)"></span>' + esc(t.nome) + '</button>'; }).join('') + '</div>';
      const barra = '<div class="lt-row lt-row--between lt-mb-4"><div class="lt-row">' + ui.btn({ icon: 'chevron-left', size: 'sm', tip: 'Anterior', attrs: { 'data-ag-nav': '-1' } }) + ui.btn({ label: 'Hoje', size: 'sm', attrs: { 'data-ag-nav': '0' } }) + ui.btn({ icon: 'chevron-right', size: 'sm', tip: 'Próximo', attrs: { 'data-ag-nav': '1' } }) +
        '<h2 class="lt-serif" style="font-size:19px;font-weight:600;margin-left:8px" data-ag-rotulo>' + esc(agRotulo()) + '</h2></div>' +
        ui.segmented([{ label: 'Por pessoa', value: 'quadro', icon: 'users', active: S.view === 'quadro' }, { label: 'Semana', value: 'semana', active: S.view === 'semana' }, { label: 'Mês', value: 'mes', active: S.view === 'mes' }], { name: 'jur-ag-view' }) + '</div>';
      return header + '<div class="lt-stack lt-stack--sm lt-mb-4"><div class="lt-row" style="gap:12px"><span class="lt-label-caps" style="width:56px">Pessoas</span>' + pessoas + '</div><div class="lt-row" style="gap:12px"><span class="lt-label-caps" style="width:56px">Tipos</span>' + tipos + '</div></div>' +
        barra + '<div data-ag-cal>' + agCal() + '</div><div class="lt-g12 lt-mt-6" data-ag-rodape>' + agRodape() + '</div>';
    },
    mount: (root) => {
      const S = agState();
      const redraw = () => { root.querySelector('[data-ag-cal]').innerHTML = agCal(); root.querySelector('[data-ag-rotulo]').textContent = agRotulo(); root.querySelector('[data-ag-rodape]').innerHTML = agRodape(); };
      root.addEventListener('lt:filter', (e) => {
        const g = e.target.closest('[data-grp]'); if (!g) return;
        const vals = [].map.call(g.querySelectorAll('.lt-filter-chip.is-active'), (c) => c.getAttribute('data-value'));
        if (g.dataset.grp === 'pessoas') S.pessoas = vals.map(Number); else S.tipos = vals;
        redraw();
      });
      root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'jur-ag-view') { S.view = e.detail.value; if (S.view === 'mes') { const d = util.parse(S.semana); S.ano = d.getFullYear(); S.mes = d.getMonth(); } redraw(); } });
      root.querySelectorAll('[data-ag-nav]').forEach((b) => b.addEventListener('click', () => {
        const n = +b.getAttribute('data-ag-nav');
        if (n === 0) { S.semana = SEG; S.ano = App.HOJE.getFullYear(); S.mes = App.HOJE.getMonth(); }
        else if (S.view === 'mes') { const d = new Date(S.ano, S.mes + n, 1); S.ano = d.getFullYear(); S.mes = d.getMonth(); }
        else { S.semana = util.iso(util.addDias(S.semana, 7 * n)); const d = util.parse(S.semana); S.ano = d.getFullYear(); S.mes = d.getMonth(); }
        redraw();
      }));
      root.addEventListener('click', (e) => { const m = e.target.closest('[data-cal-more]'); if (m) { S.view = 'quadro'; S.semana = util.iso(util.inicioSemana(m.getAttribute('data-cal-more'))); App.refresh(); } });
    }
  });
  ui.registerSheet('jur-evento', (prm) => {
    const e = agendaItens().find((x) => String(x.id) === String(prm.ev));
    if (!e) return { title: 'Compromisso não encontrado', body: ui.empty({ icon: 'calendar', title: 'Este compromisso não existe' }) };
    const t = D.tiposEvento[e.tipo] || { nome: e.tipo, tone: 'gold' };
    return { eyebrow: t.nome, title: e.titulo, sub: fmt.dataExtenso(e.data) + ' · ' + e.inicio + '–' + e.fim, noFocus: true,
      body: '<div class="lt-stack">' + ui.section({ title: 'Quando e onde', tone: 'amber', icon: 'clock', body: ui.dl([['Data', fmt.data(e.data) + ' (' + fmt.diaSemana(e.data) + ')'], ['Horário', e.inicio + ' às ' + e.fim], ['Local', esc(e.local)], ['Lembretes', '1 dia antes e no dia, às 08:00']]) }) +
        ui.section({ title: 'Participantes', tone: 'blue', icon: 'users', body: '<div class="lt-stack lt-stack--sm">' + e.pessoas.map((pid) => ui.person(pid, esc(pes(pid).cargo))).join('') + '</div>' }) +
        (e.ref ? ui.section({ title: 'Vinculado a', tone: 'gold', icon: 'link', body: '<a href="#' + esc(e.ref.hash) + '" data-fechar-sheet>' + esc(e.ref.label) + '</a>' }) : '') + '</div>',
      foot: ui.btn({ label: 'Cancelar compromisso', variant: 'danger-outline', confirm: 'Cancelar este compromisso?', confirmText: 'Os participantes serão avisados e os lembretes cancelados.', confirmLabel: 'Cancelar compromisso', acao: 'excluir', toast: 'Compromisso cancelado', fechar: 'sheet' }) + '<span class="lt-push"></span>' +
        (e.ref ? '<a class="lt-btn lt-btn--default" href="#' + esc(e.ref.hash) + '">' + I('external') + '<span>Abrir processo</span></a>' : '') + ui.btn({ label: 'Editar', variant: 'primary', icon: 'edit', sheet: 'core-novo-compromisso', attrs: { 'data-ev': e.id } }) };
  });

  /* ================================================================== */
  /* CLIENTES E PARTES (jur.clients)                                     */
  /* ================================================================== */
  function linhaCliente(e) {
    const ps = procs().filter((p) => p.empresaId === e.id), ct = contratoDa(e.id);
    const ativos = ps.filter((p) => p.status === 'ativo'), prox = ps.map((p) => proximoPrazo(p.id)).filter(Boolean).sort((a, b) => a.interno.localeCompare(b.interno))[0] || null;
    const advs = ps.map((p) => p.advogadoId).filter((v, i, a) => a.indexOf(v) === i);
    return { e, ps, ct, ativos, prox, advs, discussao: util.soma(ativos, (p) => p.valorCausa), recuperado: recEmpresa(e.id) };
  }
  App.screen({
    id: 'jur.clients', hash: 'jur-clientes', module: 'juridico', title: 'Clientes e partes', nav: true, navGroup: 'juridico', navLabel: 'Clientes e partes', navOrder: 5,
    render: () => {
      const rows = clientesJur().map(linhaCliente).sort((a, b) => b.discussao - a.discussao);
      const sem = rows.filter((r) => !r.ps.length);
      const header = ui.pageHeader({ breadcrumb: crumbs([{ label: 'Clientes e partes' }]), title: 'Clientes e partes', sub: 'Clientes com contrato ganho no CRM e clientes que chegam direto ao Jurídico (indicação), pessoa física ou jurídica. As partes contrárias ficam no mesmo lugar.',
        actions: ui.btn({ label: 'Nova parte contrária', icon: 'plus', sheet: 'jur-nova-parte' }) + ui.btn({ label: 'Novo cliente', icon: 'user-plus', sheet: 'jur-novo-cliente' }) + ui.btn({ label: 'Novo processo', variant: 'primary', icon: 'plus', href: '#jur-processo-cadastro' }) });
      const callout = sem.length ? ui.callout({ tone: 'gold', icon: 'briefcase', title: 'Contrato ganho sem processo aberto: ' + sem.map((r) => esc(r.e.fantasia)).join(', '), text: sem.map((r) => { const n = D.negocios.find((x) => x.empresaId === r.e.id && x.desfecho === 'ganho'); return 'Negócio #' + (n ? n.id : '—') + ' ganho em ' + fmt.data(n ? n.fechadoEm : r.ct.inicio) + ' · ' + esc(n ? n.titulo : ''); }).join('<br>') + '<br><span class="lt-small">Hoje a abertura é manual. Integração automática com o CRM: pergunta Q3 (regra AUT-15, desligada).</span>', actions: ui.btn({ label: 'Preparar ação', size: 'sm', variant: 'primary', icon: 'plus', sheet: 'jur-novo-processo', attrs: { 'data-empresa': sem[0].e.id } }) }) : '';
      const tabCli = ui.table({ rows, rowSheet: (r) => ({ sheet: 'jur-cliente', params: { id: r.e.id } }), columns: [
        { label: 'Cliente', key: 'e', sortable: true, value: (r) => r.e.fantasia, render: (r) => '<span class="lt-row lt-row--nowrap" style="gap:8px"><span class="lt-table__primary">' + esc(r.e.fantasia) + '</span>' + ui.chip(r.e.regime, r.e.regime === 'Lucro Real' ? 'gold' : 'blue') + '</span><span class="lt-table__secondary">' + esc(r.e.razao) + '</span><span class="lt-table__secondary" style="white-space:nowrap;font-variant-numeric:tabular-nums">CNPJ ' + esc(r.e.cnpj) + '</span>' },
        { label: 'Contrato', key: 'ct', align: 'right', width: '170px', value: (r) => r.ct ? r.ct.honorarioMensal : 0, sortable: true, render: (r) => (r.ct ? '<span class="lt-strong">' + fmt.moeda(r.ct.honorarioMensal) + '/mês</span><span class="lt-table__secondary" style="white-space:nowrap">+ ' + fmt.pct(r.ct.exitoPct) + ' de êxito · desde ' + fmt.dataCurta(r.ct.inicio).slice(3) + '/' + r.ct.inicio.slice(2, 4) + '</span>' : '—') },
        { label: 'Processos', key: 'ps', align: 'right', width: '125px', value: (r) => r.ps.length, sortable: true, render: (r) => (r.ps.length ? '<span class="lt-strong">' + r.ativos.length + '</span> <span class="lt-muted">' + (r.ativos.length === 1 ? 'ativo' : 'ativos') + ' de ' + r.ps.length + '</span>' : ui.chip('Aguardando abertura', 'amber', { dot: true })) },
        { label: 'Em discussão', key: 'discussao', align: 'right', width: '120px', sortable: true, render: (r) => (r.discussao ? fmt.moedaCurta(r.discussao) : '<span class="lt-muted">—</span>') },
        { label: 'Recuperado', key: 'recuperado', align: 'right', width: '110px', sortable: true, render: (r) => (r.recuperado ? '<span class="lt-success lt-strong">' + fmt.moedaCurta(r.recuperado) + '</span>' : '<span class="lt-muted">—</span>') },
        { label: 'Equipe', key: 'advs', width: '80px', value: (r) => r.advs.map(nome1).join(', '), render: (r) => '<span class="lt-avatar-stack">' + r.advs.map((id) => ui.avatar(id, 'sm')).join('') + '</span>' },
        { label: 'Próximo prazo', key: 'prox', value: (r) => (r.prox ? r.prox.interno : '9999'), sortable: true, render: (r) => { if (!r.prox) return '<span class="lt-muted">—</span>'; const i = pinfo(r.prox); return '<span class="lt-num lt-strong">' + fmt.dataCurta(r.prox.interno) + '</span> ' + ui.chip(i.st[0], i.st[1], { dot: true }); } }
      ] });
      const partes = J.partes.map((x) => Object.assign({}, x, { n: procs().filter((p) => (p.parteId || J.partePorNome[p.parteContraria]) === x.id).length }));
      const tabPartes = '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2">Proposta 4.1: nome e CPF ou CNPJ, com validação.</span>' + ui.btn({ label: 'Nova parte contrária', icon: 'plus', size: 'sm', sheet: 'jur-nova-parte' }) + '</div>' +
        ui.table({ rows: partes, columns: [
          { label: 'Parte contrária', key: 'nome', sortable: true, render: (x) => '<span class="lt-table__primary">' + esc(x.nome) + '</span><span class="lt-table__secondary">' + esc(x.representacao) + '</span>' },
          { label: 'Tipo', key: 'tipo', sortable: true, render: (x) => ui.chip(x.tipo, x.tipo === 'Autoridade coatora' ? 'violet' : x.tipo === 'Ente público' ? 'slate' : 'blue') },
          { label: 'CNPJ', key: 'documento', render: (x) => (x.documento ? '<span class="lt-num">' + esc(x.documento) + '</span>' : '<span class="lt-muted">Não se aplica (autoridade)</span>') },
          { label: 'Contato', key: 'email', render: (x) => esc(x.email) + '<span class="lt-table__secondary">' + esc(x.telefone) + '</span>' },
          { label: 'Processos', key: 'n', align: 'right', sortable: true }
        ], rowActions: (x) => ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar parte', sheet: 'jur-nova-parte', attrs: { 'data-id': x.id } }) });
      const tot = rows.reduce((a, r) => ({ d: a.d + r.discussao, r: a.r + r.recuperado, m: a.m + (r.ct ? r.ct.honorarioMensal : 0) }), { d: 0, r: 0, m: 0 });
      return header + ui.kpis([{ label: 'Clientes do Jurídico', value: String(rows.length), icon: 'building', foot: sem.length + ' aguardando abertura de processo' }, { label: 'Honorários mensais', value: fmt.moedaCurta(tot.m), unit: '/mês', icon: 'wallet', href: '#fin-painel' }, { label: 'Em discussão', value: fmt.moedaCurta(tot.d), icon: 'scale', foot: 'processos ativos' }, { label: 'Crédito recuperado', value: fmt.moedaCurta(tot.r), icon: 'trending-up', foot: 'compensado em processos aptos · base do êxito' }]) +
        (callout ? '<div class="lt-mt-4">' + callout + '</div>' : '') + '<div class="lt-mt-4"></div>' +
        ui.tabs({ id: 'jur-clientes', tabs: [{ key: 'clientes', label: 'Clientes', icon: 'building', count: rows.length, content: tabCli }, { key: 'partes', label: 'Partes contrárias', icon: 'landmark', count: partes.length, content: tabPartes }] });
    }
  });
  ui.registerSheet('jur-cliente', (prm) => {
    const e = db.empresa(prm.id); if (!e) return { title: 'Cliente não encontrado' };
    const r = linhaCliente(e), dec = db.contatosDa(e.id).find((c) => c.decisor) || db.contatosDa(e.id)[0] || {};
    return { eyebrow: 'Cliente do Jurídico', title: e.fantasia, sub: esc(e.razao) + ' · CNPJ <span class="lt-num">' + esc(e.cnpj) + '</span>', size: 'lg', noFocus: true,
      body: '<div class="lt-stack">' + ui.summary([{ label: 'Processos ativos', value: String(r.ativos.length) }, { label: 'Em discussão', value: fmt.moedaCurta(r.discussao) }, { label: 'Recuperado', value: '<span class="lt-success">' + fmt.moedaCurta(r.recuperado) + '</span>' }, { label: 'Próximo prazo', value: r.prox ? fmt.dataCurta(r.prox.interno) : '—' }]) +
        ui.section({ title: 'Dados do cliente', sub: 'Proposta 4.1: nome, CNPJ, telefone e e-mail.', tone: 'gold', icon: 'building', body: ui.dl([['Razão social', esc(e.razao)], ['CNPJ', '<span class="lt-num">' + esc(e.cnpj) + '</span> ' + (docValido(e.cnpj) ? ui.chip('Validado', 'green', { icon: 'check' }) : ui.chip('Dígito inválido', 'red', { icon: 'alert-circle', title: 'Os dígitos verificadores não conferem' }))], ['Regime', esc(e.regime)], ['Cidade', esc(e.cidade + '/' + e.uf)], ['Contato principal', esc((dec.nome || '—') + (dec.cargo ? ' · ' + dec.cargo : ''))], ['Telefone', esc(dec.telefone || '—')], ['E-mail', esc(dec.email || '—')]]) }) +
        ui.section({ title: 'Contrato de honorários', tone: 'green', icon: 'wallet', body: r.ct ? ui.dl([['Contrato', '#' + r.ct.id + ' · desde ' + fmt.data(r.ct.inicio)], ['Honorário mensal', fmt.moeda(r.ct.honorarioMensal) + ' · vence dia ' + r.ct.diaVencimento], ['Êxito', fmt.pct(r.ct.exitoPct) + ' sobre o crédito recuperado'], ['Crédito estimado', fmt.moeda(r.ct.creditoEstimado)], ['Crédito recuperado', fmt.moeda(r.recuperado) + '<span class="lt-table__secondary">soma dos processos em compensação</span>']]) : ui.empty({ small: true, icon: 'wallet', title: 'Sem contrato' }) }) +
        ui.section({ title: 'Processos', tone: 'violet', icon: 'scale', body: r.ps.length ? ui.list(r.ps.map((p) => { const et = etapaJ(p.etapa); return { icon: 'scale', tone: p.status === 'ativo' ? 'violet' : '', title: esc(classeCurta(p.classe) + ' · ' + p.tese), meta: '<span class="lt-mono">' + esc(p.numero) + '</span>' + ui.chip(et.nome, et.tone) + (p.status !== 'ativo' ? statusChip(p.status) : '') + (recProc(p) ? ui.chip(fmt.moedaCurta(recProc(p)) + ' recuperado', 'green') : ''), href: '#jur-processo-' + p.id }; })) : ui.empty({ small: true, icon: 'scale', title: 'Nenhum processo aberto', action: ui.btn({ label: 'Preparar ação', icon: 'plus', variant: 'primary', sheet: 'jur-novo-processo', attrs: { 'data-empresa': e.id } }) }) }) + '</div>',
      foot: '<a class="lt-btn lt-btn--default" href="#crm-empresa-' + e.id + '">' + I('external') + '<span>Abrir no CRM</span></a><span class="lt-push"></span>' + ui.btn({ label: 'Novo processo', variant: 'primary', icon: 'plus', sheet: 'jur-novo-processo', attrs: { 'data-empresa': e.id } }) };
  });
  /* Validação de CPF e CNPJ (dígitos verificadores) */
  function docValido(v) {
    const d = String(v || '').replace(/\D/g, '');
    if (d.length === 11) { if (/^(\d)\1+$/.test(d)) return false; const dv = (n) => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; }; return dv(9) === +d[9] && dv(10) === +d[10]; }
    if (d.length === 14) { if (/^(\d)\1+$/.test(d)) return false; const dv = (n) => { const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < n; i++) s += +d[i] * w[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; }; return dv(12) === +d[12] && dv(13) === +d[13]; }
    return null;
  }
  ui.registerSheet('jur-novo-cliente', () => {
    const origens = ['Indicação de cliente', 'Indicação de escritório contábil', 'Indicação de advogado parceiro', 'Site', 'Outro'];
    return { eyebrow: 'Jurídico · Clientes', title: 'Novo cliente', sub: 'Proposta 4.1: nome, CPF ou CNPJ com validação, telefone e e-mail. Para quem chega direto ao Jurídico, sem passar pelo funil comercial.', size: 'lg',
      body: '<div class="lt-sections" data-jc-form>' +
        ui.section({ title: 'Tipo de cliente', tone: 'gold', icon: 'user', body: ui.field({ name: 'jc_tipo', type: 'radio', inline: true, value: 'pj', options: [{ value: 'pj', label: 'Pessoa jurídica (CNPJ)' }, { value: 'pf', label: 'Pessoa física (CPF)' }] }) }) +
        ui.section({ title: 'Identificação', tone: 'violet', icon: 'tag', cols: 2, body:
          ui.field({ label: 'Razão social', name: 'jc_nome', required: true, span: 2, placeholder: 'Como está no cartão CNPJ' }) +
          ui.field({ label: 'CNPJ', name: 'jc_doc', type: 'cnpj', required: true, hint: '<span data-jc-status>Digite para validar os dígitos.</span>' }) +
          '<div data-jc-pj>' + ui.field({ label: 'Nome fantasia', name: 'jc_fantasia' }) + '</div>' }) +
        ui.section({ title: 'Contato', tone: 'blue', icon: 'phone', cols: 2, body:
          ui.field({ label: 'Telefone', name: 'jc_tel', type: 'phone', required: true }) + ui.field({ label: 'E-mail', name: 'jc_email', type: 'email', required: true, placeholder: 'nome@empresa.com.br' }) +
          ui.field({ label: 'Cidade', name: 'jc_cidade', placeholder: 'Ex.: Campinas' }) + ui.field({ label: 'Como chegou', name: 'jc_origem', type: 'select', value: origens[0], options: origens }) }) +
        ui.section({ title: 'Vínculo com o CRM', sub: 'Opcional. Liga o cliente a uma empresa já cadastrada no CRM (por exemplo, o sócio de um cliente).', tone: 'green', icon: 'link', body:
          ui.field({ label: 'Empresa no CRM', name: 'jc_empresa', type: 'select', placeholder: 'Sem vínculo', options: D.empresas.map((x) => ({ value: x.id, label: x.fantasia + ' · ' + x.cnpj })), hint: 'Com o vínculo, os processos aparecem também na ficha 360° da empresa.' }) }) +
        '<div data-jc-pf hidden>' + ui.section({ title: 'Dado protegido', sub: 'CPF completo só para sócios e gestor jurídico', tone: 'slate', icon: 'lock', body: '<p class="lt-small lt-text-2" style="margin:0">Depois de salvo, o CPF aparece mascarado (ex.: <span class="lt-num">' + esc(fmt.cpfMascarado('12345678909')) + '</span>) para os demais perfis. Cada vez que alguém mostra o número completo, fica na auditoria.</p>' }) + '</div>' +
        '<div data-jc-erro></div></div>',
      foot: ui.sheetFoot({ label: 'Salvar cliente', toast: 'Cliente cadastrado', toastText: 'Já aparece no cadastro de processos e em Clientes e partes.', info: 'Campos com * são obrigatórios' }),
      mount: (el) => {
        const q = (n) => el.querySelector('[name="' + n + '"]'), doc = q('jc_doc'), st = el.querySelector('[data-jc-status]');
        const lab = (n) => q(n).closest('.lt-field').querySelector('.lt-label').firstChild;
        const tipo = () => (el.querySelector('[name="jc_tipo"]:checked') || {}).value || 'pj';
        const check = () => { const ok = docValido(doc.value); st.innerHTML = ok === null ? (doc.value ? 'Documento incompleto.' : 'Digite para validar os dígitos.') : ok ? ui.chip(tipo() === 'pf' ? 'CPF válido' : 'CNPJ válido', 'green', { icon: 'check' }) : '<span class="lt-danger">Dígitos verificadores não conferem. Revise o número.</span>'; doc.setAttribute('aria-invalid', ok === false ? 'true' : 'false'); return ok; };
        doc.addEventListener('input', check);
        el.addEventListener('change', (e) => {
          const n = e.target.getAttribute('name');
          if (n === 'jc_tipo') {
            const pf = tipo() === 'pf';
            lab('jc_nome').nodeValue = pf ? 'Nome completo' : 'Razão social'; q('jc_nome').placeholder = pf ? 'Como está no documento' : 'Como está no cartão CNPJ';
            lab('jc_doc').nodeValue = pf ? 'CPF' : 'CNPJ'; doc.setAttribute('data-mask', pf ? 'cpf' : 'cnpj'); doc.placeholder = pf ? '000.000.000-00' : '00.000.000/0000-00'; doc.value = ''; check();
            q('jc_email').placeholder = pf ? 'nome@email.com.br' : 'nome@empresa.com.br';
            el.querySelector('[data-jc-pj]').hidden = pf; el.querySelector('[data-jc-pf]').hidden = !pf;
          }
          if (n === 'jc_empresa' && e.target.value && tipo() === 'pj') { const x = db.empresa(+e.target.value); if (x) { q('jc_nome').value = x.razao; q('jc_fantasia').value = x.fantasia; doc.value = x.cnpj; q('jc_cidade').value = x.cidade; check(); } }
        });
        el.querySelector('.lt-sheet__foot [data-acao]').addEventListener('click', (ev) => {
          el.querySelectorAll('.lt-field.is-invalid').forEach((f) => f.classList.remove('is-invalid'));
          const falta = [].slice.call(el.querySelectorAll('[data-jc-form] [required]')).filter((x) => !x.closest('[hidden]') && !String(x.value || '').trim());
          falta.forEach((x) => x.closest('.lt-field').classList.add('is-invalid'));
          const okDoc = doc.value ? check() : null, msgs = falta.map((x) => x.closest('.lt-field').querySelector('.lt-label').textContent.replace('*', '').trim());
          if (doc.value && okDoc !== true) { msgs.push((tipo() === 'pf' ? 'CPF' : 'CNPJ') + ' válido'); doc.closest('.lt-field').classList.add('is-invalid'); }
          el.querySelector('[data-jc-erro]').innerHTML = msgs.length ? ui.callout({ tone: 'danger', title: 'Falta preencher', text: msgs.map(esc).join(' · ') }) : '';
          if (msgs.length) { ev.stopPropagation(); ev.preventDefault(); }
        }, true);
      } };
  });
  ui.registerSheet('jur-nova-parte', (prm) => {
    const x = prm.id ? parte(prm.id) : null;
    return { title: x ? 'Editar parte contrária' : 'Nova parte contrária', sub: 'Nome e CPF ou CNPJ (proposta 4.1). Autoridade coatora não tem documento próprio.', size: 'sm',
      body: '<div class="lt-sections">' + ui.section({ title: 'Identificação', tone: 'gold', icon: 'landmark', cols: 2, body:
          ui.field({ label: 'Nome', name: 'pt_nome', required: true, span: 2, value: x ? x.nome : '', placeholder: 'Ex.: Fazenda do Município de Campinas' }) +
          ui.field({ label: 'Tipo', name: 'pt_tipo', type: 'radio', span: 2, inline: true, value: x ? (x.documento ? 'pj' : 'aut') : 'pj', options: [{ value: 'pj', label: 'Pessoa jurídica / ente' }, { value: 'pf', label: 'Pessoa física' }, { value: 'aut', label: 'Autoridade coatora' }] }) +
          ui.field({ label: 'CNPJ', name: 'pt_doc', type: 'cnpj', span: 2, value: x && x.documento ? x.documento : '', hint: '<span data-pt-status>Digite para validar os dígitos.</span>' }) }) +
        ui.section({ title: 'Representação e contato', tone: 'blue', icon: 'phone', cols: 2, body:
          ui.field({ label: 'Representação', name: 'pt_rep', type: 'select', span: 2, value: x ? x.representacao : '', placeholder: 'Escolha', options: ['PGFN · Procuradoria-Seccional em Campinas', 'PGE-SP · Procuradoria Regional de Campinas', 'Receita Federal · DRF Campinas (informações pela PGFN)', 'Advogado próprio', 'Atendimento pelo e-CAC'] }) +
          ui.field({ label: 'Telefone', name: 'pt_tel', type: 'phone', value: x ? x.telefone : '' }) + ui.field({ label: 'E-mail', name: 'pt_email', type: 'email', value: x ? x.email : '' }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar parte', toast: 'Parte contrária salva', toastText: 'Disponível no cadastro de processos.', info: 'Campos com * são obrigatórios' }),
      mount: (el) => {
        const doc = el.querySelector('[name="pt_doc"]'), st = el.querySelector('[data-pt-status]'), lab = doc.closest('.lt-field').querySelector('.lt-label');
        const check = () => { const ok = docValido(doc.value); st.innerHTML = ok === null ? (doc.value ? 'Documento incompleto.' : 'Digite para validar os dígitos.') : ok ? ui.chip('Documento válido', 'green', { icon: 'check' }) : '<span class="lt-danger">Dígitos verificadores não conferem. Revise o número.</span>'; doc.setAttribute('aria-invalid', ok === false ? 'true' : 'false'); };
        doc.addEventListener('input', check);
        el.addEventListener('change', (e) => {
          if (e.target.getAttribute('name') !== 'pt_tipo') return;
          const t = e.target.value; doc.closest('.lt-field').hidden = t === 'aut';
          doc.setAttribute('data-mask', t === 'pf' ? 'cpf' : 'cnpj'); doc.placeholder = t === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'; lab.firstChild.nodeValue = t === 'pf' ? 'CPF' : 'CNPJ'; doc.value = ''; check();
        });
        if (x && !x.documento) doc.closest('.lt-field').hidden = true;
      } };
  });

  /* ================================================================== */
  /* RELATÓRIOS (jur.reports) · proposta 4.5                             */
  /* ================================================================== */
  function relPrazos(per) {
    const ini = per === 'mes' ? '2026-11-01' : SEG, fim = per === 'mes' ? '2026-11-30' : SEX;
    const l = prazosAll().filter((p) => (p.status === 'pendente' && (p.interno <= fim)) || (p.interno >= ini && p.interno <= fim) || (p.cumpridoEm && p.cumpridoEm >= ini && p.cumpridoEm <= fim));
    const resumo = ADV_IDS.map((id) => {
      const m = l.filter((p) => p.responsavelId === id), inf = m.map(pinfo);
      const cump = m.filter((p) => p.status === 'cumprido');
      return { id, pend: m.filter((p) => p.status === 'pendente').length, hoje: inf.filter((i) => i.grupo === 'hoje').length, atras: inf.filter((i) => i.grupo === 'atrasado').length, fatais: m.filter((p) => p.status === 'pendente' && p.fatal >= ini && p.fatal <= fim).length, cump: cump.length, d1: cump.filter((p) => p.cumpridoEm <= p.interno).length };
    });
    const tRes = ui.table({ compact: true, rows: resumo, columns: [
      { label: 'Advogado', key: 'id', render: (r) => ui.person(r.id, esc(pes(r.id).cargoCurto)) },
      { label: 'Pendentes', key: 'pend', align: 'right' }, { label: 'Internos hoje', key: 'hoje', align: 'right' },
      { label: 'Atrasados', key: 'atras', align: 'right', render: (r) => (r.atras ? '<span class="lt-danger lt-strong">' + r.atras + '</span>' : '0') },
      { label: 'Fatais no período', key: 'fatais', align: 'right' }, { label: 'Cumpridos', key: 'cump', align: 'right' },
      { label: 'No D-1', key: 'd1', align: 'right', render: (r) => (r.cump ? fmt.pct(100 * r.d1 / r.cump, 0) : '—') }
    ], foot: ['<b>Equipe</b>', '<b>' + util.soma(resumo, (r) => r.pend) + '</b>', '<b>' + util.soma(resumo, (r) => r.hoje) + '</b>', '<b>' + util.soma(resumo, (r) => r.atras) + '</b>', '<b>' + util.soma(resumo, (r) => r.fatais) + '</b>', '<b>' + util.soma(resumo, (r) => r.cump) + '</b>', ''] });
    return { html: '<div class="lt-row lt-row--between lt-mb-4">' + ui.segmented([{ label: 'Semana (' + fmt.dataCurta(SEG) + '–' + fmt.dataCurta(SEX) + ')', value: 'semana', active: per !== 'mes' }, { label: 'Mês (novembro)', value: 'mes', active: per === 'mes' }], { name: 'jur-rel-per' }) + '</div>' +
      ui.card({ title: 'Resumo por advogado', icon: 'users', flush: true, body: tRes }) + '<div class="lt-mt-4"></div>' + ui.card({ title: 'Prazos do período', icon: 'calendar-clock', sub: 'Pendentes até o fim do período e cumpridos dentro dele', flush: true, body: tabelaPrazos(l.sort((a, b) => a.interno.localeCompare(b.interno)), { semAcoes: true }) }), linhas: l.length };
  }
  function relCumprimento(adv) {
    const advF = adv ? +adv : null;
    const series = [['No D-1', 'd1', 'var(--tone-green-solid)'], ['No dia fatal', 'fatal', 'var(--tone-amber-solid)'], ['Perdidos', 'perdido', 'var(--tone-red-solid)']].map((x) => ({ name: x[0], color: x[2], values: MESES_H.map((m) => hist(advF, [m])[x[1]]) }));
    const rows = []; MESES_H.slice().reverse().forEach((m) => ADV_IDS.filter((id) => !advF || id === advF).forEach((id) => { const h = hist(id, [m]); rows.push({ m, id, h }); }));
    const tot = hist(advF, MESES_H);
    return '<div class="lt-row lt-row--between lt-mb-4"><select class="lt-select" data-jur-rel-adv style="width:auto;min-width:220px" aria-label="Advogado"><option value="">Toda a equipe jurídica</option>' + ADV_IDS.map((id) => '<option value="' + id + '"' + (String(id) === String(adv) ? ' selected' : '') + '>' + esc(pes(id).nome) + '</option>').join('') + '</select></div>' +
      '<div class="lt-g12"><div class="lt-c7">' + ui.card({ title: 'Cumpridos no D-1 × no dia fatal', icon: 'chart-bar', sub: 'Indicador (' + JANELA.rotulo + ', o mesmo do painel e do Início): ' + fmt.pct(hist(advF, JANELA.meses).pct, 0) + ' no D-1 · histórico de jun a nov/2026: ' + fmt.pct(tot.pct, 0), body: ui.chart.bar({ labels: MESES_H.map(mesRot), series, height: 240, showValues: true, title: 'Cumpridos no D-1 × no fatal' }) }) + '</div>' +
      '<div class="lt-c5">' + ui.card({ title: 'Por mês e advogado', icon: 'list', flush: true, body: ui.table({ compact: true, rows, maxHeight: 330, columns: [
        { label: 'Mês', key: 'm', render: (r) => esc(fmt.mesAno(r.m + '-01')) }, { label: 'Advogado', key: 'id', value: (r) => nome1(r.id), render: (r) => esc(nome1(r.id)) },
        { label: 'D-1', key: 'd1', align: 'right', value: (r) => r.h.d1, render: (r) => r.h.d1 }, { label: 'Fatal', key: 'fatal', align: 'right', value: (r) => r.h.fatal, render: (r) => r.h.fatal }, { label: 'Perdidos', key: 'p', align: 'right', value: (r) => r.h.perdido, render: (r) => (r.h.perdido ? '<span class="lt-danger lt-strong">' + r.h.perdido + '</span>' : '0') },
        { label: '% D-1', key: 'pct', align: 'right', value: (r) => Math.round(r.h.pct), render: (r) => (r.h.total ? fmt.pct(r.h.pct, 0) : '—') }
      ] }) }) + '</div></div>';
  }
  function relStatus() {
    const all = procs(), et = D.funis.juridico.etapas;
    const rows = et.map((e) => { const l = all.filter((p) => p.etapa === e.key); return { e, a: l.filter((p) => p.status === 'ativo').length, s: l.filter((p) => p.status === 'suspenso').length, x: l.filter((p) => p.status === 'encerrado').length, t: l.length, v: util.soma(l.filter((p) => p.status !== 'encerrado'), (p) => p.valorCausa) }; });
    return '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2">Status da proposta (ativo, suspenso, encerrado) cruzado com a etapa do acompanhamento.</span></div>' +
      '<div class="lt-g12"><div class="lt-c7">' + ui.card({ title: 'Processos por etapa e status', icon: 'layers', flush: true, body: ui.table({ compact: true, rows, columns: [
        { label: 'Etapa', key: 'e', value: (r) => r.e.num, render: (r) => ui.chip(r.e.num + '. ' + r.e.nome, r.e.tone) }, { label: 'Ativos', key: 'a', align: 'right' }, { label: 'Suspensos', key: 's', align: 'right' }, { label: 'Encerrados', key: 'x', align: 'right' }, { label: 'Total', key: 't', align: 'right', render: (r) => '<b>' + r.t + '</b>' }, { label: 'Em discussão', key: 'v', align: 'right', render: (r) => (r.v ? fmt.moedaCurta(r.v) : '—') }
      ], foot: ['<b>Total</b>', '<b>' + util.soma(rows, (r) => r.a) + '</b>', '<b>' + util.soma(rows, (r) => r.s) + '</b>', '<b>' + util.soma(rows, (r) => r.x) + '</b>', '<b>' + all.length + '</b>', '<b>' + fmt.moedaCurta(util.soma(rows, (r) => r.v)) + '</b>'] }) }) + '</div>' +
      '<div class="lt-c5">' + ui.card({ title: 'Status', icon: 'pie', body: ui.chart.donut({ items: Object.keys(STATUS_PROC).map((k, i) => ({ label: STATUS_PROC[k][0], value: all.filter((p) => p.status === k).length, color: ['var(--tone-green-solid)', 'var(--tone-amber-solid)', 'var(--tone-gray-solid)'][i] })), centerValue: String(all.length), centerLabel: 'processos', size: 170 }) }) + '</div></div>';
  }
  function relCliente() {
    const rows = clientesJur().map(linhaCliente).sort((a, b) => b.discussao - a.discussao);
    return '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2">Carteira de cada cliente com contrato de honorários.</span></div>' +
      ui.card({ title: 'Processos por cliente', icon: 'building', flush: true, body: ui.table({ rows, rowSheet: (r) => ({ sheet: 'jur-cliente', params: { id: r.e.id } }), columns: [
        { label: 'Cliente', key: 'e', sortable: true, value: (r) => r.e.fantasia, render: (r) => '<span class="lt-table__primary">' + esc(r.e.fantasia) + '</span><span class="lt-table__secondary">' + esc(r.e.regime) + '</span>' },
        { label: 'Ativos', key: 'a', align: 'right', sortable: true, value: (r) => r.ativos.length, render: (r) => r.ativos.length },
        { label: 'Suspensos', key: 's', align: 'right', value: (r) => r.ps.filter((p) => p.status === 'suspenso').length, render: (r) => r.ps.filter((p) => p.status === 'suspenso').length },
        { label: 'Encerrados', key: 'x', align: 'right', value: (r) => r.ps.filter((p) => p.status === 'encerrado').length, render: (r) => r.ps.filter((p) => p.status === 'encerrado').length },
        { label: 'Em discussão', key: 'discussao', align: 'right', sortable: true, render: (r) => (r.discussao ? fmt.moeda(r.discussao, true) : '—') },
        { label: 'Recuperado', key: 'recuperado', align: 'right', sortable: true, render: (r) => (r.recuperado ? '<span class="lt-success">' + fmt.moeda(r.recuperado, true) + '</span>' : '—') },
        { label: 'Próximo prazo', key: 'prox', value: (r) => (r.prox ? r.prox.interno : '9999'), sortable: true, render: (r) => (r.prox ? fmt.dataCurta(r.prox.interno) + ' · ' + esc(r.prox.tipo) : '<span class="lt-muted">—</span>') }
      ], foot: ['<b>Total</b>', '<b>' + util.soma(rows, (r) => r.ativos.length) + '</b>', '', '', '<b>' + fmt.moeda(util.soma(rows, (r) => r.discussao), true) + '</b>', '<b>' + fmt.moeda(util.soma(rows, (r) => r.recuperado), true) + '</b>', ''] }) });
  }
  /* Exportação do relatório da aba aberta (arquivo e linhas conforme o filtro) */
  function relExportBtn(aba, S) {
    S = S || {};
    if (aba === 'cumprimento') { const n = MESES_H.length * ADV_IDS.filter((id) => !S.adv || String(id) === String(S.adv)).length; return exportBtn('cumprimento-d1-x-fatal-jun-nov-2026' + (S.adv ? '-' + nome1(+S.adv).toLowerCase() : '') + '.xlsx', n); }
    if (aba === 'status') return exportBtn('processos-por-status.xlsx', procs().length);
    if (aba === 'cliente') return exportBtn('processos-por-cliente.xlsx', clientesJur().length);
    return exportBtn('prazos-por-advogado-' + (S.per === 'mes' ? 'nov-2026' : 'semana-09-11') + '.xlsx', relPrazos(S.per).linhas + ADV_IDS.length);
  }
  App.screen({
    id: 'jur.reports', hash: 'jur-relatorios', module: 'juridico', title: 'Relatórios jurídicos', nav: true, navGroup: 'juridico', navLabel: 'Relatórios', navOrder: 6,
    render: () => {
      const S = App.state.jurRel = App.state.jurRel || { per: 'semana', adv: '' };
      const rp = relPrazos(S.per);
      /* um só botão de exportação: exporta o relatório da aba aberta (o texto do aviso acompanha a aba) */
      const aba = App.state['tab-jur-rel'] || 'prazos';
      return ui.pageHeader({ breadcrumb: crumbs([{ label: 'Relatórios' }]), title: 'Relatórios jurídicos', sub: 'Os quatro relatórios do item 4.5 da proposta. Exportam para Excel; cada exportação fica na auditoria.', actions: '<span data-jur-rel-export>' + relExportBtn(aba, S) + '</span>' }) +
        ui.tabs({ id: 'jur-rel', tabs: [
          { key: 'prazos', label: 'Prazos por advogado', icon: 'calendar-clock', content: '<div data-jur-rel-prazos>' + rp.html + '</div>' },
          { key: 'cumprimento', label: 'D-1 × dia fatal', icon: 'chart-bar', content: '<div data-jur-rel-cump>' + relCumprimento(S.adv) + '</div>' },
          { key: 'status', label: 'Processos por status', icon: 'layers', content: relStatus() },
          { key: 'cliente', label: 'Processos por cliente', icon: 'building', content: relCliente() }
        ] });
    },
    mount: (root) => {
      const S = App.state.jurRel;
      const expo = (aba) => { const w = root.querySelector('[data-jur-rel-export]'); if (w) { S.aba = aba || S.aba || 'prazos'; w.innerHTML = relExportBtn(S.aba, S); } };
      root.addEventListener('lt:tab', (e) => { if (e.detail.id === 'jur-rel') expo(e.detail.tab); });
      root.addEventListener('lt:segment', (e) => { if (e.detail.name !== 'jur-rel-per') return; S.per = e.detail.value; const b = root.querySelector('[data-jur-rel-prazos]'); b.innerHTML = relPrazos(S.per).html; ui.enhance(b); expo(); });
      root.addEventListener('change', (e) => { if (!e.target.matches('[data-jur-rel-adv]')) return; S.adv = e.target.value; const b = root.querySelector('[data-jur-rel-cump]'); b.innerHTML = relCumprimento(S.adv); ui.enhance(b); expo(); });
    }
  });

  /* ================================================================== */
  /* ESTADOS DAS LISTAS (jur.ui.states)                                  */
  /* ================================================================== */
  App.screen({
    id: 'jur.ui.states', hash: 'jur-estados', module: 'juridico', title: 'Estados das listas do Jurídico', navGroup: 'juridico', navParent: 'jur-processos',
    render: () => ui.pageHeader({ breadcrumb: crumbs([{ label: 'Processos', hash: 'jur-processos' }, { label: 'Estados das listas' }]), title: 'Estados das listas', sub: 'Como as listas do Jurídico aparecem enquanto carregam, quando não há nada e quando algo dá errado. Vale para processos, prazos, andamentos e documentos.' }) +
      '<div class="lt-g12"><div class="lt-c6">' + ui.card({ title: 'Carregando · lista de processos', icon: 'refresh', body: ui.skeleton({ lines: 6, avatar: true }) }) + '</div>' +
      '<div class="lt-c6">' + ui.card({ title: 'Vazio · prazos da semana', icon: 'calendar-clock', body: ui.empty({ icon: 'check-circle', title: 'Nenhum prazo interno nesta semana', text: 'Quando um andamento abrir prazo, ele aparece aqui com o interno (D-1) e o fatal.', action: ui.btn({ label: 'Novo prazo', icon: 'plus', variant: 'primary', sheet: 'jur-novo-prazo' }) }) }) + '</div>' +
      '<div class="lt-c6">' + ui.card({ title: 'Erro · documentos do processo', icon: 'alert-circle', body: ui.callout({ tone: 'danger', title: 'Não foi possível carregar os documentos', text: 'O armazenamento não respondeu a tempo. Nada foi perdido: os arquivos continuam salvos.', actions: ui.btn({ label: 'Tentar de novo', size: 'sm', variant: 'danger', icon: 'refresh', acao: 'recalcular', loading: 'Carregando…', toast: 'Documentos carregados', toastText: '8 arquivos.' }) }) }) + '</div>' +
      '<div class="lt-c6">' + ui.card({ title: 'Sem permissão · processo de outro advogado', icon: 'lock', body: ui.empty({ icon: 'lock', title: 'Este processo é de outro advogado', text: 'Pelo seu papel você vê só os processos sob sua responsabilidade (escopo do perfil Advogado: pergunta Q4). Peça acesso ao gestor jurídico.', action: ui.btn({ label: 'Pedir acesso', icon: 'send', acao: 'enviar', toast: 'Pedido enviado', toastText: 'Eduardo Lacerda foi avisado.' }) }) }) + '</div>' +
      '<div class="lt-c12">' + ui.card({ title: 'Vazio com filtro · busca sem resultado', icon: 'search', flush: true, body: tabelaProcessos([]) }) + '</div></div>'
  });

  /* API de leitura do módulo (QA e outros módulos): cálculo de prazo e situação */
  App.juridico = { calcPrazo, pinfo, prazosAll, processos: procs, processo: proc };

  /* ================================================================== */
  /* GAVETA · enviar documento                                           */
  /* ================================================================== */
  ui.registerSheet('jur-novo-documento', (prm) => {
    const p = prm.id ? proc(prm.id) : null;
    return { title: 'Enviar documento', sub: p ? esc(emp(p.empresaId).fantasia + ' · ' + p.numero) : 'Anexe ao processo.', size: 'sm',
      body: '<div class="lt-sections">' + ui.section({ title: 'Arquivo', tone: 'gold', icon: 'upload', body: ui.field({ type: 'upload', accept: 'PDF, DOCX, XLSX, ZIP ou imagem · até 50 MB' }) }) +
        ui.section({ title: 'Classificação', tone: 'violet', icon: 'tag', cols: 2, body: ui.field({ label: 'Processo', type: 'select', span: 2, required: true, value: p ? p.id : '', placeholder: 'Escolha o processo', options: optsProcessos(false) }) + ui.field({ label: 'Categoria', type: 'select', span: 2, required: true, value: 'Petição', options: D.listas.categoriasDocumento }) + ui.field({ label: 'Descrição', span: 2, placeholder: 'Ex.: Minuta final das contrarrazões' }) }) +
        ui.section({ title: 'Acesso', tone: 'slate', icon: 'lock', body: ui.field({ type: 'toggle', checked: true, label: 'Só a equipe jurídica e os sócios veem este arquivo' }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Enviar documento', acao: 'enviar', icon: 'upload', toast: 'Documento enviado', toastText: 'Disponível na aba Documentos do processo.' }) };
  });
})();
