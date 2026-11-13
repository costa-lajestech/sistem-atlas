/* ==========================================================================
   ATLAS · screens/core.js — telas do NÚCLEO
   login (+MFA) · recuperar senha · Início · Agenda · Notificações
   Configurações: usuários e papéis · funis e etapas · listas · calendário · marca · auditoria
   Fluxos: FLX-01 lista · FLX-02 diagrama · FLX-03 execução · FLX-04 parâmetros · próximos disparos
   CORE-00 catálogo de componentes · Mapa de telas
   ========================================================================== */
(function () {
  'use strict';
  const App = window.App, ui = App.ui, esc = ui.esc, fmt = App.fmt, util = App.util, db = App.db, D = App.data, I = App.icon;

  /* ------------------------------------------------------------------ */
  /* Utilitários do núcleo                                               */
  /* ------------------------------------------------------------------ */
  const empresaNome = (id) => { const e = db.empresa(id); return e ? e.fantasia : '—'; };
  const diasNaEtapa = (n) => util.diasEntre(n.entrouEtapaEm, App.HOJE);
  const negociosAbertos = () => D.negocios.filter((n) => !n.desfecho);
  const negociosParados = () => negociosAbertos().filter((n) => { const e = db.etapa(n.etapa); return e && e.sla && diasNaEtapa(n) > e.sla; });
  const fila = (id) => D.filas.find((f) => f.id === id);
  const fluxo = (id) => D.fluxos.find((f) => String(f.id) === String(id));
  const fluxoPorCodigo = (c) => D.fluxos.find((f) => f.codigo === c);
  const tom = (key) => (App.status[key] || [key, 'gray'])[1];

  function prazoInfo(p) {
    const proc = db.processo(p.processoId), emp = proc ? db.empresa(proc.empresaId) : null;
    const dI = util.diasEntre(App.HOJE, p.interno), dF = util.diasEntre(App.HOJE, p.fatal);
    let situ;
    if (p.status === 'cumprido') situ = p.cumpridoEm <= p.interno ? { label: 'Cumprido no D-1', tone: 'green' } : { label: 'Cumprido no fatal', tone: 'amber' };
    else if (dF < 0) situ = { label: 'Perdido', tone: 'red' };
    else if (dF === 0) situ = { label: 'Fatal hoje', tone: 'red' };
    else if (dI < 0) situ = { label: 'Interno vencido', tone: 'red' };
    else if (dI === 0) situ = { label: 'Interno hoje', tone: 'amber' };
    else if (dI === 1) situ = { label: 'Interno amanhã', tone: 'amber' };
    else situ = { label: 'Em ' + dI + ' dias', tone: 'blue' };
    return { proc, emp, dI, dF, situ };
  }
  function tarefasDa(pid) {
    const filas = D.filas.filter((f) => f.membros.indexOf(pid) >= 0).map((f) => f.id);
    return db.tarefas().filter((t) => t.responsavelId === pid || (t.filaId && filas.indexOf(t.filaId) >= 0));
  }
  const atrasada = (t) => t.status !== 'concluida' && util.parse(t.prazo) < App.HOJE;
  const ehHoje = (d) => util.iso(d) === util.hojeIso();
  /* Origem da tarefa: a automação vira link para a execução que a criou (pelo registro da tarefa) ou, sem execução, para o diagrama (igual ao CRM) */
  const origemChip = (o, hash) => {
    if (o === 'Manual' || !o) return ui.chip('Manual', 'gray');
    const f = D.fluxos.find((x) => x.codigo === o), chip = ui.chip(o, 'violet', { icon: 'zap' });
    if (!f) return chip;
    const ex = hash ? D.fluxoExecucoes.filter((x) => x.fluxoId === f.id && x.estado === 'rodou' && x.registro && x.registro.hash === hash).sort((a, b) => b.quando.localeCompare(a.quando))[0] : null;
    return '<a class="lt-chip-link" href="' + (ex ? '#fluxos-execucao-' + ex.id : '#fluxos-diagrama-' + f.id) + '" title="Criada pela automação ' + esc(o) + ' · abrir no painel Fluxos">' + chip + '</a>';
  };

  /* Layout das Configurações (navegação lateral) */
  const CFG = [['cfg-usuarios', 'Usuários e papéis', 'users'], ['cfg-funis', 'Funis e etapas', 'kanban'], ['cfg-listas', 'Listas', 'list'], ['cfg-calendario', 'Calendário e feriados', 'calendar'], ['cfg-marca', 'Marca', 'palette'], ['fluxos', 'Fluxos e automações', 'workflow'], ['auditoria', 'Auditoria', 'history'], ['cfg-backup', 'Backup e segurança', 'database']];
  /* As páginas de Configurações já aparecem no menu lateral (grupo Configurações); não repetimos a navegação aqui. */
  function cfgLayout(active, inner) { return inner; }
  function cfgLayoutComSubnav(active, inner) {
    return '<div class="lt-settings"><nav class="lt-subnav" aria-label="Configurações"><div class="lt-subnav__title">Configurações</div>' +
      CFG.map((c) => '<a href="#' + c[0] + '" class="' + (c[0] === active ? 'is-active' : '') + '">' + I(c[2]) + '<span>' + c[1] + '</span></a>').join('') +
      '</nav><div style="min-width:0">' + inner + '</div></div>';
  }
  const crumbCfg = (label) => [{ label: 'Configurações', hash: 'cfg-usuarios' }, { label }];

  /* ================================================================== */
  /* LOGIN + MFA                                                         */
  /* ================================================================== */
  function authBrand() {
    return '<aside class="lt-auth__brand">' +
      '<img src="assets/img/logo-atlas.webp" alt="Atlas Corporate" width="163" height="40">' +
      '<div><div class="lt-auth__eyebrow">Sistema interno</div>' +
      '<h1 class="lt-auth__headline">Comercial, jurídico e financeiro <em>em um só lugar.</em></h1>' +
      '<div class="lt-auth__divider"></div>' +
      '<p class="lt-auth__lead">Do primeiro contato com a empresa até o crédito tributário recuperado: funil, prazos com regra D-1, honorários e a biblioteca da equipe.</p>' +
      '<ul class="lt-auth__points">' +
      '<li>' + I('briefcase') + '<span>Funil de 10 etapas com próxima tarefa obrigatória</span></li>' +
      '<li>' + I('calendar-clock') + '<span>Prazos internos calculados pelo calendário de dias úteis</span></li>' +
      '<li>' + I('wallet') + '<span>Honorários mensais e de êxito acompanhados no financeiro</span></li></ul></div>' +
      '<div class="lt-auth__foot">' + I('shield-check') + '<span>Acesso com verificação em duas etapas · ambiente monitorado</span></div></aside>';
  }
  function authTools() {
    return '<div class="lt-auth__tools"><button type="button" class="lt-iconbtn lt-iconbtn--bordered lt-tooltip" id="lt-theme-btn" data-theme-toggle></button></div>';
  }
  App.screen({
    id: 'core.auth.login', hash: 'login', module: 'core', layout: 'blank', title: 'Entrar',
    render: () => '<div class="lt-auth">' + authBrand() + '<main class="lt-auth__form">' + authTools() +
      '<div class="lt-auth__card" id="login-passo-1">' +
      '<img class="lt-auth__mobile-logo lt-logo lt-logo--for-light" src="assets/img/logo-atlas-fundo-claro.webp" alt="Atlas Corporate" style="height:34px;width:auto"><img class="lt-auth__mobile-logo lt-logo lt-logo--for-dark" src="assets/img/logo-atlas.webp" alt="" style="height:34px;width:auto">' +
      '<div><div class="lt-steps" aria-label="Etapa 1 de 2"><span class="is-done"></span><span></span>Etapa 1 de 2</div><h2 class="lt-auth__title" style="margin-top:10px">Entrar</h2><p class="lt-muted" style="margin-top:6px">Use o e-mail corporativo cadastrado pela Atlas.</p></div>' +
      ui.field({ label: 'E-mail', type: 'email', name: 'email', value: 'mariana.duarte@atlas.exemplo', required: true }) +
      '<div class="lt-field"><label class="lt-label" for="login-senha">Senha<span class="lt-req">*</span></label><div class="lt-input-group"><input class="lt-input" id="login-senha" type="password" value="exemplo-123" autocomplete="current-password"><button type="button" class="lt-input-group__addon" data-ver-senha style="cursor:pointer" aria-label="Mostrar senha">' + I('eye') + '</button></div></div>' +
      '<div class="lt-row lt-row--between">' + '<label class="lt-check"><input type="checkbox" checked><span>Lembrar este dispositivo por 30 dias</span></label><a href="#recuperar-senha" class="lt-small">Esqueci minha senha</a></div>' +
      '<button type="button" class="lt-btn lt-btn--primary lt-btn--lg lt-btn--block" data-login-entrar>' + I('arrow-right') + '<span>Entrar</span></button>' +
      '<p class="lt-hint" style="text-align:center">Problemas para entrar? Fale com o administrador do sistema.</p></div>' +
      '<div class="lt-auth__card" id="login-passo-2" hidden>' +
      '<div><div class="lt-steps" aria-label="Etapa 2 de 2"><span class="is-done"></span><span class="is-done"></span>Etapa 2 de 2</div><h2 class="lt-auth__title" style="margin-top:10px">Verificação em duas etapas</h2><p class="lt-muted" style="margin-top:6px">Digite o código de 6 dígitos do seu aplicativo autenticador.</p></div>' +
      '<div class="lt-otp" role="group" aria-label="Código de verificação">' + [1, 2, 3, 4, 5, 6].map((i) => '<input inputmode="numeric" maxlength="1" aria-label="Dígito ' + i + '" data-otp="' + i + '">').join('') + '</div>' +
      '<label class="lt-check"><input type="checkbox"><span>Confiar neste computador por 30 dias</span></label>' +
      '<button type="button" class="lt-btn lt-btn--primary lt-btn--lg lt-btn--block" data-login-verificar>' + I('shield-check') + '<span>Verificar e entrar</span></button>' +
      '<div class="lt-row lt-row--between lt-small"><button type="button" class="lt-link-btn" data-login-voltar>' + 'Voltar' + '</button><button type="button" class="lt-link-btn" data-acao="enviar" data-toast="Código de recuperação" data-toast-text="Use um dos 10 códigos de recuperação gerados na ativação do MFA." data-toast-tone="info">Usar código de recuperação</button></div></div>' +
      '</main></div>',
    mount: (root) => {
      App.theme.syncButton();
      const p1 = root.querySelector('#login-passo-1'), p2 = root.querySelector('#login-passo-2');
      root.querySelector('[data-ver-senha]').addEventListener('click', (e) => { const i = root.querySelector('#login-senha'); i.type = i.type === 'password' ? 'text' : 'password'; e.currentTarget.innerHTML = I(i.type === 'password' ? 'eye' : 'eye-off'); });
      root.querySelector('[data-login-entrar]').addEventListener('click', (e) => {
        const b = e.currentTarget; ui.loading(b, true, 'Entrando…');
        setTimeout(() => { ui.loading(b, false); p1.hidden = true; p2.hidden = false; const f = root.querySelector('[data-otp="1"]'); if (f) f.focus(); }, 1200);
      });
      root.querySelector('[data-login-voltar]').addEventListener('click', () => { p2.hidden = true; p1.hidden = false; });
      root.querySelectorAll('[data-otp]').forEach((inp, i, all) => {
        inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 1); if (inp.value && all[i + 1]) all[i + 1].focus(); });
        inp.addEventListener('keydown', (ev) => { if (ev.key === 'Backspace' && !inp.value && all[i - 1]) all[i - 1].focus(); });
        inp.addEventListener('paste', (ev) => { const t = (ev.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length) { ev.preventDefault(); all.forEach((x, k) => { x.value = t[k] || ''; }); } });
      });
      root.querySelector('[data-login-verificar]').addEventListener('click', (e) => {
        const b = e.currentTarget; ui.loading(b, true, 'Verificando…');
        setTimeout(() => { ui.loading(b, false); App.go('inicio'); setTimeout(() => ui.toast('Bem-vinda, Mariana', 'success', 'Acesso verificado com MFA.'), 200); }, 1200);
      });
    }
  });

  App.screen({
    id: 'core.auth.recover', hash: 'recuperar-senha', module: 'core', layout: 'blank', title: 'Recuperar senha',
    render: () => '<div class="lt-auth">' + authBrand() + '<main class="lt-auth__form">' + authTools() +
      '<div class="lt-auth__card"><div><a href="#login" class="lt-small">' + '← Voltar para o login' + '</a><h2 class="lt-auth__title" style="margin-top:12px">Recuperar senha</h2><p class="lt-muted" style="margin-top:6px">Enviaremos um link válido por 30 minutos para o e-mail cadastrado.</p></div>' +
      ui.field({ label: 'E-mail corporativo', type: 'email', placeholder: 'nome@atlas.exemplo', required: true }) +
      ui.btn({ label: 'Enviar link de recuperação', variant: 'primary', size: 'lg', block: true, icon: 'send', acao: 'enviar', toast: 'Pedido recebido', toastText: 'Se o e-mail estiver cadastrado, o link chega em instantes.' }) +
      ui.callout({ tone: 'info', text: 'Por segurança, a mensagem é a mesma exista ou não o e-mail. O link só funciona uma vez.' }) + '</div></main></div>',
    mount: () => App.theme.syncButton()
  });

  /* ================================================================== */
  /* INÍCIO — painel do dia por pessoa                                   */
  /* ================================================================== */
  function tarefaItem(t) {
    const late = atrasada(t), done = t.status === 'concluida';
    const resp = t.filaId ? ui.chip(fila(t.filaId).nome, 'blue', { icon: 'users' }) : '';
    return '<li class="lt-list__item" data-tarefa="' + t.id + '"' + (done ? ' style="opacity:.55"' : '') + '>' +
      '<label class="lt-check" title="Concluir tarefa"><input type="checkbox" data-concluir="' + t.id + '"' + (done ? ' checked' : '') + ' aria-label="Concluir: ' + esc(t.titulo) + '"></label>' +
      '<div class="lt-list__body"><div class="lt-list__title"' + (done ? ' style="text-decoration:line-through"' : '') + '>' + esc(t.titulo) + '</div><div class="lt-list__meta"><a href="#' + esc(t.ref.hash) + '">' + esc(t.ref.label) + '</a>' + origemChip(t.origem, t.ref && t.ref.hash) + resp + '</div></div>' +
      '<div class="lt-list__aside"><span class="lt-num ' + (late ? 'lt-danger lt-strong' : '') + '">' + (late ? 'Atrasada · ' : '') + esc(fmt.quando(t.prazo)) + '</span></div></li>';
  }
  function compromissosDa(pid) {
    const ini = util.hojeIso(), fim = util.iso(util.addDias(App.HOJE, 2));
    return D.eventos.filter((e) => e.pessoas.indexOf(pid) >= 0 && e.data >= ini && e.data <= fim).sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
  }
  function alertasDa(p) {
    const gestor = ['socio', 'gestor_comercial'].indexOf(p.papel) >= 0;
    const out = [];
    negociosParados().filter((n) => gestor || n.consultorId === p.id).forEach((n) => {
      const e = db.etapa(n.etapa);
      out.push({ icon: 'hourglass', tone: 'amber', title: empresaNome(n.empresaId) + ' parado há ' + fmt.plural(diasNaEtapa(n), 'dia'), meta: esc(e.nome) + ' · SLA de ' + fmt.plural(e.sla, 'dia') + ' · ' + esc((db.pessoa(n.consultorId) || {}).nome), href: '#crm-negocio-' + n.id });
    });
    const comTarefa = {}; db.tarefas().forEach((t) => { if (t.status !== 'concluida' && t.ref) comTarefa[t.ref.hash] = 1; });
    negociosAbertos().filter((n) => (gestor || n.consultorId === p.id) && !comTarefa['crm-negocio-' + n.id]).slice(0, 3).forEach((n) => {
      out.push({ icon: 'alert-circle', tone: 'red', title: 'Sem próxima tarefa: ' + empresaNome(n.empresaId), meta: 'Todo negócio ativo precisa de uma próxima tarefa (AUT-11)', href: '#crm-negocio-' + n.id });
    });
    if (p.papel === 'socio' || p.papel === 'financeiro') out.push({ icon: 'receipt', tone: 'red', title: 'Honorário vencido há 30 dias', meta: 'Valinhos Autopeças · R$ 2.800,00', href: '#fin-receber' });
    if (p.papel === 'socio') out.push({ icon: 'workflow', tone: 'red', title: 'Automação falhou: lembrete de reunião', meta: 'AUT-03 · nova tentativa às 10:00', href: '#fluxos-execucao-9104' });
    return out;
  }
  App.screen({
    id: 'core.home', hash: 'inicio', module: 'core', title: 'Início', nav: true, navGroup: 'inicio', navOrder: 1,
    render: () => {
      const pid = App.state.inicioPessoa || App.meId, p = db.pessoa(pid);
      const tarefas = tarefasDa(pid).filter((t) => t.status !== 'concluida' || ehHoje(t.prazo));
      const atrasadas = tarefas.filter(atrasada), hoje = tarefas.filter((t) => !atrasada(t) && ehHoje(t.prazo)), proximas = tarefas.filter((t) => !atrasada(t) && !ehHoje(t.prazo) && util.diasEntre(App.HOJE, t.prazo) <= 7);
      const juridico = ['advogado', 'gestor_juridico'].indexOf(p.papel) >= 0;
      const prazos = D.prazos.filter((x) => x.status === 'pendente' && util.diasEntre(App.HOJE, x.interno) <= 10 && (!juridico || p.papel === 'gestor_juridico' || x.responsavelId === pid)).sort((a, b) => a.interno.localeCompare(b.interno));
      const comp = compromissosDa(pid), alertas = alertasDa(p);
      /* escopo do papel de quem é o painel (Configurações → Usuários e papéis): o que a pessoa não acessa não aparece */
      const pode = (k) => p.papel === 'socio' || !!App.perm(k, p.papel);
      const soProprios = p.papel !== 'socio' && App.perm('crm.deal.read', p.papel) === 'proprios';
      const abertos = negociosAbertos().filter((n) => !soProprios || n.consultorId === pid), credito = util.soma(abertos, (n) => n.creditoEstimado);
      const parados = negociosParados().filter((n) => !soProprios || n.consultorId === pid);
      const mensal = util.soma(D.contratos.filter((c) => c.status === 'ativo'), (c) => c.honorarioMensal);
      /* mesma série e mesma janela do painel jurídico (#jur-painel) */
      const J = D.juridico || {}, janD1 = J.janelaD1 || { rotulo: 'últimos meses' };
      const cD1 = J.cumprimentoD1 ? J.cumprimentoD1() : (() => { const c = D.prazos.filter((x) => x.status === 'cumprido'), n = c.filter((x) => x.cumpridoEm <= x.interno).length; return { d1: n, total: c.length, pct: c.length ? 100 * n / c.length : 0 }; })();
      const prazosHoje = pode('jur.case.read') ? D.prazos.filter((x) => x.status === 'pendente' && (x.interno <= util.hojeIso()) && (!juridico || p.papel === 'gestor_juridico' || x.responsavelId === pid)).length : 0;
      const saud = App.HOJE.getHours() < 12 ? 'Bom dia' : App.HOJE.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
      /* só sócio e gestores abrem o painel de outra pessoa (com "Ver como" o seletor some para os demais papéis) */
      const veOutros = ['socio', 'gestor_comercial', 'gestor_juridico'].indexOf((db.me() || {}).papel) >= 0;
      const sel = veOutros ? '<label class="lt-row lt-row--nowrap lt-small lt-muted" style="gap:8px">Painel de<select class="lt-select" data-inicio-pessoa style="height:34px;width:auto;min-width:200px">' + D.equipe.map((x) => '<option value="' + x.id + '"' + (x.id === pid ? ' selected' : '') + '>' + esc(x.nome) + ' · ' + esc(x.cargoCurto) + '</option>').join('') + '</select></label>' : '';
      const header = ui.pageHeader({
        eyebrow: fmt.dataExtenso(App.HOJE), title: saud + ', ' + p.nome.split(' ')[0],
        sub: 'Você tem <b>' + hoje.length + '</b> ' + (hoje.length === 1 ? 'tarefa' : 'tarefas') + ' para hoje' + (pode('jur.case.read') ? ', ' : ' e ') + '<b class="' + (atrasadas.length ? 'lt-danger' : '') + '">' + atrasadas.length + (atrasadas.length === 1 ? ' atrasada' : ' atrasadas') + '</b>' + (pode('jur.case.read') ? ' e <b>' + prazosHoje + '</b> ' + (prazosHoje === 1 ? 'prazo interno vencendo ou vencido.' : 'prazos internos vencendo ou vencidos.') : '.'),
        actions: sel + ui.btn({ label: 'Nova tarefa', variant: 'primary', icon: 'plus', sheet: 'core-nova-tarefa' })
      });
      const listaKpis = [
        pode('crm.deal.read') && { label: soProprios ? 'Meus negócios em andamento' : 'Negócios em andamento', value: fmt.num(abertos.length), icon: 'briefcase', foot: fmt.moedaCurta(credito) + ' em créditos estimados', href: '#crm-funil' },
        pode('fin.read') && { label: 'Honorários mensais', value: fmt.moedaCurta(mensal), unit: '/mês', icon: 'wallet', delta: '+R$ 3,2 mil', dir: 'up', foot: D.contratos.length + ' contratos ativos', href: '#fin-painel' },
        pode('jur.case.read') && { label: 'Prazos cumpridos no D-1', value: fmt.pct(cD1.pct, 0), icon: 'calendar-clock', progress: { value: cD1.d1, max: cD1.total || 1, tone: 'green' }, foot: cD1.d1 + ' de ' + cD1.total + ' · ' + esc(janD1.rotulo), href: '#jur-painel' },
        pode('crm.deal.read') && { label: 'Etapas paradas', value: fmt.num(parados.length), icon: 'hourglass', delta: soProprios ? null : '+1 desde sexta', dir: 'up', good: false, foot: 'acima do SLA da etapa', href: '#crm-funil' }
      ].filter(Boolean);
      if (listaKpis.length < 4) listaKpis.push({ label: 'Tarefas abertas', value: fmt.num(tarefas.filter((t) => t.status !== 'concluida').length), icon: 'list-checks', foot: atrasadas.length ? '<span class="lt-danger">' + fmt.plural(atrasadas.length, 'atrasada') + '</span>' : 'nenhuma atrasada', href: '#agenda' });
      const kpis = ui.kpis(listaKpis);
      const tabsT = ui.tabs({ id: 'inicio-tarefas', small: true, active: atrasadas.length ? 'atrasadas' : 'hoje', tabs: [
        { key: 'atrasadas', label: 'Atrasadas', count: atrasadas.length, content: '<ul class="lt-list">' + (atrasadas.map(tarefaItem).join('') || '') + '</ul>' + (atrasadas.length ? '' : ui.empty({ small: true, icon: 'check-circle', title: 'Nada atrasado', text: 'Bom trabalho. Nenhuma tarefa vencida.' })) },
        { key: 'hoje', label: 'Hoje', count: hoje.length, content: hoje.length ? '<ul class="lt-list">' + hoje.map(tarefaItem).join('') + '</ul>' : ui.empty({ small: true, icon: 'check-square', title: 'Sem tarefas para hoje' }) },
        { key: 'proximas', label: 'Próximos 7 dias', count: proximas.length, content: proximas.length ? '<ul class="lt-list">' + proximas.map(tarefaItem).join('') + '</ul>' : ui.empty({ small: true, icon: 'calendar', title: 'Semana livre' }) }
      ] });
      const cardTarefas = ui.card({ title: 'Minhas tarefas', icon: 'list-checks', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#agenda">Ver na agenda</a>', flush: true, body: '<div style="padding:4px 18px 0">' + tabsT + '</div>' });
      const tabelaPrazos = ui.table({
        compact: true, rows: prazos, rowHref: (x) => '#jur-processo-' + x.processoId,
        empty: { icon: 'calendar-clock', title: 'Nenhum prazo nos próximos 10 dias' },
        columns: [
          { label: 'Prazo interno', key: 'interno', render: (x) => { const i = prazoInfo(x); return '<span class="lt-row lt-row--nowrap" style="gap:10px">' + ui.dateBox(x.interno, i.situ.tone === 'red' ? 'red' : i.situ.tone === 'amber' ? 'amber' : '') + ui.chip(i.situ.label, i.situ.tone, { dot: true }) + '</span>'; } },
          { label: 'Processo', key: 'tipo', render: (x) => { const i = prazoInfo(x); return '<span class="lt-table__primary">' + esc(x.tipo) + ' · ' + esc(i.emp ? i.emp.fantasia : '') + '</span><span class="lt-table__secondary lt-mono" style="white-space:nowrap">' + esc(i.proc.numero) + '</span>'; } },
          { label: 'Fatal', key: 'fatal', render: (x) => '<span class="lt-num" style="white-space:nowrap">' + fmt.data(x.fatal) + '</span><span class="lt-table__secondary">' + fmt.diaSemana(x.fatal).replace('-feira', '') + '</span>' },
          { label: 'Responsável', key: 'responsavelId', render: (x) => ui.avatar(x.responsavelId, 'sm') }
        ],
        rowActions: (x) => ui.btn({ label: 'Cumprir', size: 'xs', variant: 'outline', icon: 'check', acao: 'concluir', toast: 'Prazo cumprido', toastText: esc(x.tipo) + ' marcado como cumprido hoje (antes do fatal).' })
      });
      const cardPrazos = ui.card({ title: 'Prazos jurídicos · regra D-1', icon: 'calendar-clock', sub: 'Prazo interno = 1 dia útil antes do fatal, pelo calendário de feriados', actions: '<a class="lt-btn lt-btn--ghost lt-btn--sm" href="#jur-prazos">Todos os prazos</a>', flush: true, body: tabelaPrazos });
      const cardComp = ui.card({ title: 'Próximos compromissos', icon: 'calendar', flush: true, actions: ui.btn({ icon: 'plus', variant: 'ghost', size: 'sm', tip: 'Novo compromisso', sheet: 'core-novo-compromisso' }),
        body: ui.list(comp.map((e) => { const t = D.tiposEvento[e.tipo]; return { lead: '<span class="lt-date-box"' + (ehHoje(e.data) ? ' data-tone="amber"' : '') + '><span class="lt-date-box__m" style="display:block">' + (ehHoje(e.data) ? 'hoje' : fmt.diaSemanaCurto(e.data)) + '</span><span class="lt-date-box__d" style="display:block;font-size:14px">' + e.inicio + '</span></span>', title: esc(e.titulo), meta: ui.chip(t.nome, t.tone) + '<span>' + esc(e.local) + '</span>', attrs: { 'data-sheet': 'core-evento', 'data-ev': e.id }, sheet: 'core-evento' }; }), { empty: { icon: 'calendar', title: 'Agenda livre', text: 'Nenhum compromisso hoje nem nos próximos 2 dias.' } }) });
      const cardAlertas = ui.card({ title: 'Alertas', icon: 'bell', sub: fmt.plural(alertas.length, 'ponto de atenção', 'pontos de atenção'), flush: true, body: ui.list(alertas.slice(0, 6), { empty: { icon: 'check-circle', title: 'Tudo em dia' } }) });
      return header + kpis + '<div class="lt-g12 lt-mt-6"><div class="lt-c8 lt-stack">' + cardTarefas + (pode('jur.case.read') ? cardPrazos : '') + '</div><div class="lt-c4 lt-stack">' + cardComp + cardAlertas + '</div></div>';
    },
    mount: (root) => {
      const s = root.querySelector('[data-inicio-pessoa]');
      if (s) s.addEventListener('change', () => { App.state.inicioPessoa = +s.value; App.refresh(); });
      root.addEventListener('change', (e) => {
        const c = e.target.closest('[data-concluir]'); if (!c) return;
        const li = c.closest('li'), t = db.tarefas().find((x) => x.id === +c.getAttribute('data-concluir'));
        li.style.opacity = c.checked ? '.55' : ''; li.querySelector('.lt-list__title').style.textDecoration = c.checked ? 'line-through' : '';
        if (t) t.status = c.checked ? 'concluida' : 'aberta';
        ui.toast(c.checked ? 'Tarefa concluída' : 'Tarefa reaberta', c.checked ? 'success' : 'info', esc(t ? t.titulo : ''));
      });
    }
  });

  /* Sheet: nova tarefa */
  ui.registerSheet('core-nova-tarefa', () => ({
    title: 'Nova tarefa', sub: 'Toda tarefa tem responsável, prazo e registro vinculado.',
    body: '<div class="lt-sections">' +
      ui.section({ title: 'O que fazer', tone: 'gold', icon: 'check-square', cols: 2, body: ui.field({ label: 'Título', span: 2, required: true, placeholder: 'Ex.: Enviar carta proposta' }) + ui.field({ label: 'Vinculada a', type: 'select', span: 2, placeholder: 'Escolha um negócio ou processo', options: D.negocios.filter((n) => !n.desfecho).map((n) => ({ value: 'crm-negocio-' + n.id, label: 'Negócio · ' + empresaNome(n.empresaId) + ' · ' + n.titulo })).concat(D.processos.map((x) => ({ value: 'jur-processo-' + x.id, label: 'Processo · ' + x.numero }))) }) }) +
      ui.section({ title: 'Quem e quando', tone: 'amber', icon: 'clock', cols: 2, body: ui.field({ label: 'Responsável', type: 'select', value: App.meId, options: D.equipe.map((p) => ({ value: p.id, label: p.nome })).concat(D.filas.map((f) => ({ value: 'fila-' + f.id, label: 'Fila: ' + f.nome }))) }) + ui.field({ label: 'Prioridade', type: 'select', value: 'media', options: [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Média' }, { value: 'baixa', label: 'Baixa' }] }) + ui.field({ label: 'Prazo (data)', type: 'date', value: util.hojeIso(), required: true }) + ui.field({ label: 'Horário', type: 'time', value: '17:00' }) }) +
      ui.section({ title: 'Observações', tone: 'slate', icon: 'file-text', body: ui.field({ type: 'textarea', placeholder: 'Detalhes para quem vai executar (opcional)' }) }) + '</div>',
    foot: ui.sheetFoot({ label: 'Salvar tarefa', toast: 'Tarefa criada', toastText: 'O responsável foi notificado.', info: 'Campos com * são obrigatórios' })
  }));

  /* ================================================================== */
  /* AGENDA                                                              */
  /* ================================================================== */
  function agendaItens() {
    const out = D.eventos.map((e) => Object.assign({ kind: 'evento' }, e));
    D.prazos.filter((p) => p.status === 'pendente').forEach((p) => {
      const i = prazoInfo(p), nome = i.emp ? i.emp.fantasia : '';
      out.push({ id: 'pi' + p.id, kind: 'prazo', tipo: 'prazo_interno', titulo: 'D-1 · ' + p.tipo + ' · ' + nome, data: p.interno, pessoas: [p.responsavelId], prazoId: p.id, allDay: true });
      out.push({ id: 'pf' + p.id, kind: 'prazo', tipo: 'prazo_fatal', titulo: 'Fatal · ' + p.tipo + ' · ' + nome, data: p.fatal, pessoas: [p.responsavelId], prazoId: p.id, allDay: true });
    });
    return out;
  }
  function agendaState() {
    return App.state.agenda || (App.state.agenda = { view: 'semana', semana: util.iso(util.inicioSemana(App.HOJE)), dia: util.hojeIso(), ano: App.HOJE.getFullYear(), mes: App.HOJE.getMonth(), pessoas: [], tipos: Object.keys(D.tiposEvento) });
  }
  function agendaFiltrados() {
    const S = agendaState();
    return agendaItens().filter((e) => S.tipos.indexOf(e.tipo) >= 0 && (!S.pessoas.length || e.pessoas.some((p) => S.pessoas.indexOf(p) >= 0)));
  }
  function agendaCal() {
    const S = agendaState(), itens = agendaFiltrados();
    const map = (e) => ({ data: e.data, inicio: e.inicio, fim: e.fim, hora: e.inicio, titulo: e.titulo, sub: e.local, pessoas: e.pessoas, tone: D.tiposEvento[e.tipo].tone, sheet: 'core-evento', params: { ev: e.id } });
    if (S.view === 'mes') return ui.calMonth({ ano: S.ano, mes: S.mes, eventos: itens.map(map), max: 3 });
    if (S.view === 'dia') {
      const doDia = itens.filter((e) => e.data === S.dia);
      return ui.calWeek({ inicio: S.dia, dias: 1, horaIni: 8, horaFim: 19, eventos: doDia.filter((e) => !e.allDay).map(map), diaInteiro: doDia.filter((e) => e.allDay).map(map) });
    }
    return ui.calWeek({ inicio: S.semana, dias: 5, horaIni: 8, horaFim: 19, eventos: itens.filter((e) => !e.allDay).map(map), diaInteiro: itens.filter((e) => e.allDay).map(map) });
  }
  function agendaRotulo() {
    const S = agendaState();
    if (S.view === 'mes') return fmt.mesAno(new Date(S.ano, S.mes, 1));
    if (S.view === 'dia') { const t = fmt.dataExtenso(S.dia); return t.charAt(0).toUpperCase() + t.slice(1); }
    const a = util.parse(S.semana), b = util.addDias(a, 4);
    return a.getDate() + (a.getMonth() !== b.getMonth() ? ' de ' + util.MESES[a.getMonth()] : '') + ' a ' + b.getDate() + ' de ' + util.MESES[b.getMonth()] + ' de ' + b.getFullYear();
  }
  function agendaAside() {
    const S = agendaState();
    const base = S.view === 'dia' ? S.dia : S.semana;
    const ini = S.view === 'mes' ? util.iso(new Date(S.ano, S.mes, 1)) : base, fim = S.view === 'mes' ? util.iso(new Date(S.ano, S.mes + 1, 0)) : util.iso(util.addDias(base, 6));
    const pz = D.prazos.filter((p) => p.status === 'pendente' && p.interno >= ini && p.interno <= fim).sort((a, b) => a.interno.localeCompare(b.interno));
    const mini = ui.calMonth({ ano: S.ano, mes: S.mes, mini: true, eventos: agendaFiltrados().map((e) => ({ data: e.data, titulo: e.titulo })) });
    return ui.card({ title: fmt.mesAno(new Date(S.ano, S.mes, 1)), body: mini + '<div class="lt-legend" style="margin-top:12px"><span class="lt-legend__item"><span class="lt-legend__sw" style="background:var(--danger-subtle);border:1px solid var(--danger-border)"></span>Feriado</span><span class="lt-legend__item"><span class="lt-legend__sw" style="background:var(--gold)"></span>Hoje</span></div>' }) +
      ui.card({ title: 'Prazos internos no período', icon: 'calendar-clock', flush: true, body: ui.list(pz.map((p) => { const i = prazoInfo(p); return { lead: ui.dateBox(p.interno, i.situ.tone === 'red' ? 'red' : i.situ.tone === 'amber' ? 'amber' : ''), title: esc(p.tipo + ' · ' + (i.emp ? i.emp.fantasia : '')), meta: 'Fatal ' + fmt.dataCurta(p.fatal) + ' · ' + esc((db.pessoa(p.responsavelId) || {}).nome), href: '#jur-processo-' + p.processoId }; }), { empty: { icon: 'calendar-clock', title: 'Sem prazos no período' } }) });
  }
  App.screen({
    id: 'core.agenda', hash: 'agenda', module: 'core', title: 'Agenda', nav: true, navGroup: 'agenda', navOrder: 1,
    render: () => {
      const S = agendaState();
      const header = ui.pageHeader({ title: 'Agenda', sub: 'Compromissos do CRM, prazos do Jurídico e eventos internos numa só visão. Feriados e suspensões vêm do calendário.', actions: ui.btn({ label: 'Novo compromisso', variant: 'primary', icon: 'plus', sheet: 'core-novo-compromisso' }) });
      const pessoas = '<div class="lt-chips" data-grp="pessoas" data-filter-group="multi" aria-label="Filtrar por pessoa">' + D.equipe.filter((p) => p.status === 'ativo').map((p) => '<button type="button" class="lt-filter-chip' + (S.pessoas.indexOf(p.id) >= 0 ? ' is-active' : '') + '" data-value="' + p.id + '" title="' + esc(p.nome) + '">' + ui.avatar(p, 'xs') + esc(p.nome.split(' ')[0]) + '</button>').join('') + '</div>';
      const tipos = '<div class="lt-chips" data-grp="tipos" data-filter-group="multi" aria-label="Filtrar por tipo">' + Object.keys(D.tiposEvento).map((k) => { const t = D.tiposEvento[k]; return '<button type="button" class="lt-filter-chip' + (S.tipos.indexOf(k) >= 0 ? ' is-active' : '') + '" data-value="' + k + '"><span class="lt-filter-chip__dot" style="color:var(--tone-' + t.tone + '-solid)"></span>' + esc(t.nome) + '</button>'; }).join('') + '</div>';
      const barra = '<div class="lt-row lt-row--between lt-mb-4"><div class="lt-row">' + ui.btn({ icon: 'chevron-left', size: 'sm', tip: 'Anterior', attrs: { 'data-agenda-nav': '-1' } }) + ui.btn({ label: 'Hoje', size: 'sm', attrs: { 'data-agenda-nav': '0' } }) + ui.btn({ icon: 'chevron-right', size: 'sm', tip: 'Próximo', attrs: { 'data-agenda-nav': '1' } }) +
        '<h2 class="lt-serif" style="font-size:19px;font-weight:600;margin-left:8px" data-agenda-rotulo>' + esc(agendaRotulo()) + '</h2></div>' +
        ui.segmented([{ label: 'Dia', value: 'dia', active: S.view === 'dia' }, { label: 'Semana', value: 'semana', active: S.view === 'semana' }, { label: 'Mês', value: 'mes', active: S.view === 'mes' }], { name: 'agenda-view' }) + '</div>';
      /* coluna lateral de 280 px: a semana de 5 dias cabe em 1366 px com colunas de 140 px, sem rolagem lateral */
      return header + '<div class="lt-stack lt-stack--sm lt-mb-4"><div class="lt-row" style="gap:12px"><span class="lt-label-caps" style="width:56px">Pessoas</span>' + pessoas + '</div><div class="lt-row" style="gap:12px"><span class="lt-label-caps" style="width:56px">Tipos</span>' + tipos + '</div></div>' +
        '<div class="lt-split" style="grid-template-columns:minmax(0,1fr) 280px"><div style="min-width:0">' + barra + '<div data-agenda-cal>' + agendaCal() + '</div></div><div class="lt-stack" data-agenda-aside>' + agendaAside() + '</div></div>';
    },
    mount: (root) => {
      const S = agendaState();
      const redraw = () => { root.querySelector('[data-agenda-cal]').innerHTML = agendaCal(); root.querySelector('[data-agenda-rotulo]').textContent = agendaRotulo(); root.querySelector('[data-agenda-aside]').innerHTML = agendaAside(); };
      const syncMes = (iso) => { const d = util.parse(iso); S.ano = d.getFullYear(); S.mes = d.getMonth(); };
      root.addEventListener('lt:filter', (e) => {
        const g = e.target.closest('[data-grp]'); if (!g) return;
        const vals = [].map.call(g.querySelectorAll('.lt-filter-chip.is-active'), (c) => c.getAttribute('data-value'));
        if (g.dataset.grp === 'pessoas') S.pessoas = vals.map(Number); else S.tipos = vals;
        redraw();
      });
      root.addEventListener('lt:segment', (e) => {
        if (e.detail.name !== 'agenda-view') return;
        const antes = S.view; S.view = e.detail.value;
        if (S.view === 'dia' && antes !== 'dia') { const hoje = util.hojeIso(), fimSem = util.iso(util.addDias(S.semana, 6)); S.dia = hoje >= S.semana && hoje <= fimSem ? hoje : S.semana; }
        if (S.view === 'semana' && antes === 'dia') S.semana = util.iso(util.inicioSemana(S.dia));
        syncMes(S.view === 'dia' ? S.dia : S.semana);
        redraw();
      });
      root.querySelectorAll('[data-agenda-nav]').forEach((b) => b.addEventListener('click', () => {
        const n = +b.getAttribute('data-agenda-nav');
        if (n === 0) { S.semana = util.iso(util.inicioSemana(App.HOJE)); S.dia = util.hojeIso(); S.ano = App.HOJE.getFullYear(); S.mes = App.HOJE.getMonth(); }
        else if (S.view === 'mes') { const d = new Date(S.ano, S.mes + n, 1); S.ano = d.getFullYear(); S.mes = d.getMonth(); }
        else if (S.view === 'dia') { let d = util.addDias(S.dia, n); while (util.fimDeSemana(d)) d = util.addDias(d, n); S.dia = util.iso(d); syncMes(S.dia); }
        else { S.semana = util.iso(util.addDias(S.semana, 7 * n)); syncMes(S.semana); }
        redraw();
      }));
      root.addEventListener('click', (e) => { const m = e.target.closest('[data-cal-more]'); if (m) { S.view = 'semana'; S.semana = util.iso(util.inicioSemana(m.getAttribute('data-cal-more'))); App.refresh(); } });
    }
  });
  ui.registerSheet('core-evento', (p) => {
    const e = agendaItens().find((x) => String(x.id) === String(p.ev));
    if (!e) return { title: 'Compromisso não encontrado' };
    const t = D.tiposEvento[e.tipo];
    if (e.kind === 'prazo') {
      const pz = D.prazos.find((x) => x.id === e.prazoId), i = prazoInfo(pz);
      return { eyebrow: t.nome, title: pz.tipo + ' · ' + (i.emp ? i.emp.fantasia : ''), sub: '<span class="lt-mono">' + esc(i.proc.numero) + '</span>',
        body: '<div class="lt-stack">' + ui.summary([{ label: 'Prazo interno', value: fmt.data(pz.interno) }, { label: 'Fatal', value: fmt.data(pz.fatal) }, { label: 'Situação', value: ui.chip(i.situ.label, i.situ.tone, { dot: true }) }]) +
          ui.section({ title: 'Como o D-1 foi calculado', tone: 'amber', icon: 'calendar-clock', body: '<ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">' + util.explicarD1(pz.fatal).map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' }) +
          ui.section({ title: 'Detalhes', tone: 'slate', icon: 'file-text', body: ui.dl([['Descrição', esc(pz.descricao)], ['Responsável', ui.person(pz.responsavelId)], ['Vara', esc(i.proc.vara)], ['Parte contrária', esc(i.proc.parteContraria)]]) }) + '</div>',
        foot: '<a class="lt-btn lt-btn--default" href="#jur-processo-' + i.proc.id + '">' + I('external') + '<span>Abrir processo</span></a>' + ui.btn({ label: 'Marcar como cumprido', variant: 'primary', icon: 'check', acao: 'concluir', toast: 'Prazo cumprido', fechar: 'sheet' }) };
    }
    return { eyebrow: t.nome, title: e.titulo, sub: fmt.dataExtenso(e.data) + ' · ' + e.inicio + '–' + e.fim,
      body: '<div class="lt-stack">' + ui.section({ title: 'Quando e onde', tone: 'amber', icon: 'clock', body: ui.dl([['Data', fmt.data(e.data) + ' (' + fmt.diaSemana(e.data) + ')'], ['Horário', e.inicio + ' às ' + e.fim], ['Local', esc(e.local)], ['Lembretes', '1 dia antes e no dia, às 08:00 (AUT-03)']]) }) +
        ui.section({ title: 'Participantes', tone: 'blue', icon: 'users', body: '<div class="lt-stack lt-stack--sm">' + e.pessoas.map((pid) => { const pe = db.pessoa(pid); return ui.person(pe, esc(pe.cargo)); }).join('') + '</div>' }) +
        (e.ref ? ui.section({ title: 'Vinculado a', tone: 'gold', icon: 'link', body: '<a href="#' + esc(e.ref.hash) + '" data-fechar-sheet>' + esc(e.ref.label) + '</a>' }) : '') + '</div>',
      foot: ui.btn({ label: 'Cancelar compromisso', variant: 'danger-outline', confirm: 'Cancelar este compromisso?', confirmText: 'Os participantes serão avisados e os lembretes programados serão cancelados.', confirmLabel: 'Cancelar compromisso', acao: 'excluir', toast: 'Compromisso cancelado', fechar: 'sheet' }) +
        '<span class="lt-push"></span>' + (e.modulo === 'crm' ? ui.btn({ label: 'Registrar resultado', variant: 'outline', icon: 'check-square', sheet: 'crm-nova-atividade' }) : '') + ui.btn({ label: 'Editar', variant: 'primary', icon: 'edit', sheet: 'core-novo-compromisso', attrs: { 'data-ev': e.id } }) };
  });
  ui.registerSheet('core-novo-compromisso', (p) => {
    const e = p.ev ? D.eventos.find((x) => String(x.id) === String(p.ev)) : null;
    return { title: e ? 'Editar compromisso' : 'Novo compromisso', sub: 'Aparece na agenda de todos os participantes.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'O quê', tone: 'gold', icon: 'calendar', cols: 2, body: ui.field({ label: 'Título', span: 2, required: true, value: e ? e.titulo : '', placeholder: 'Ex.: Reunião com o decisor' }) + ui.field({ label: 'Tipo', type: 'select', value: e ? e.tipo : 'reuniao', options: Object.keys(D.tiposEvento).filter((k) => k.indexOf('prazo') < 0).map((k) => ({ value: k, label: D.tiposEvento[k].nome })) }) + ui.field({ label: 'Vinculado a', type: 'select', placeholder: 'Sem vínculo', options: D.negocios.filter((n) => !n.desfecho).map((n) => ({ value: n.id, label: empresaNome(n.empresaId) + ' · ' + n.titulo })) }) }) +
        ui.section({ title: 'Quando', tone: 'amber', icon: 'clock', cols: 3, body: ui.field({ label: 'Data', type: 'date', required: true, value: e ? e.data : util.hojeIso() }) + ui.field({ label: 'Início', type: 'time', value: e ? e.inicio : '14:00' }) + ui.field({ label: 'Fim', type: 'time', value: e ? e.fim : '15:00' }) + ui.field({ label: 'Lembrete', type: 'select', span: 3, value: 'padrao', options: [{ value: 'padrao', label: '1 dia antes e no dia, às 08:00 (padrão)' }, { value: '1h', label: '1 hora antes' }, { value: 'nenhum', label: 'Sem lembrete' }] }) }) +
        ui.section({ title: 'Quem e onde', tone: 'blue', icon: 'users', cols: 2, body: ui.field({ label: 'Participantes', type: 'checks', span: 2, inline: true, value: e ? e.pessoas.map(String) : [String(App.meId)], options: D.equipe.filter((x) => x.status === 'ativo').map((x) => ({ value: String(x.id), label: x.nome.split(' ')[0] + ' ' + x.nome.split(' ').slice(-1)[0] })) }) + ui.field({ label: 'Local', span: 2, value: e ? e.local : '', placeholder: 'Escritório, endereço do cliente ou videochamada' }) }) +
        ui.section({ title: 'Observações', tone: 'slate', icon: 'file-text', body: ui.field({ type: 'textarea', placeholder: 'Pauta, documentos a levar, contexto' }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar compromisso', toast: 'Compromisso salvo', toastText: 'Participantes avisados; lembretes programados.' }) };
  });

  /* ================================================================== */
  /* NOTIFICAÇÕES                                                        */
  /* ================================================================== */
  App.screen({
    id: 'core.notifications', hash: 'notificacoes', module: 'core', title: 'Notificações',
    render: () => {
      const naoLidas = D.notificacoes.filter((n) => !n.lida).length;
      const grupos = util.agrupar(D.notificacoes.slice().sort((a, b) => b.quando.localeCompare(a.quando)), (n) => { const d = util.diasEntre(n.quando, App.HOJE); return d === 0 ? 'Hoje' : d === 1 ? 'Ontem' : 'Anteriores'; });
      const item = (n) => ({ icon: n.icon, tone: n.tone, title: esc(n.titulo), meta: '<span>' + esc(n.texto) + '</span>', aside: '<span class="lt-num">' + esc(fmt.quando(n.quando)) + '</span>' + (n.lida ? '' : '<span class="lt-dot" title="Não lida"></span>'), href: n.href, unread: !n.lida, attrs: { 'data-mod': n.modulo, 'data-lida': n.lida ? '1' : '0' } });
      const lista = ['Hoje', 'Ontem', 'Anteriores'].filter((g) => grupos[g]).map((g) => '<div class="lt-demo-label" style="padding:0 18px">' + g + '</div>' + ui.list(grupos[g].map(item))).join('');
      return ui.pageHeader({ title: 'Notificações', sub: naoLidas + ' não lidas · os avisos de prazo e de automação também chegam por e-mail.', actions: ui.btn({ label: 'Preferências', icon: 'sliders', sheet: 'core-pref-notif' }) + ui.btn({ label: 'Marcar todas como lidas', variant: 'primary', icon: 'check', acao: 'salvar', loading: 'Marcando…', toast: 'Tudo lido', attrs: { 'data-marcar-lidas': true } }) }) +
        ui.filters({ chipGroup: 'single', chips: [{ label: 'Todas', value: 'todas', active: true }, { label: 'Não lidas', value: 'naolidas', count: naoLidas }, { label: 'Jurídico', value: 'juridico' }, { label: 'CRM', value: 'crm' }, { label: 'Financeiro', value: 'financeiro' }, { label: 'Sistema', value: 'core' }] }) +
        '<div class="lt-split"><div>' + ui.card({ flush: true, body: '<div style="padding:14px 0 4px" data-notif-lista>' + lista + '</div>' }) + '</div><div class="lt-stack">' +
        ui.card({ title: 'O que gera aviso', icon: 'info', body: '<ul class="lt-list" style="margin:-10px -18px">' + [['calendar-clock', 'amber', 'Prazos jurídicos', '3 dias úteis antes, no D-1 e no dia fatal'], ['hourglass', 'amber', 'Etapa parada', 'Quando passa do SLA da etapa'], ['check-square', 'blue', 'Tarefas', 'Novas, vencendo e atrasadas'], ['receipt', 'red', 'Financeiro', 'Honorário vencido e recebido'], ['workflow', 'violet', 'Automações', 'Falhas que precisam de atenção']].map((x) => '<li class="lt-list__item"><span class="lt-list__icon" data-tone="' + x[1] + '">' + I(x[0]) + '</span><div class="lt-list__body"><div class="lt-list__title">' + x[2] + '</div><div class="lt-list__meta">' + x[3] + '</div></div></li>').join('') + '</ul>' }) +
        ui.callout({ tone: 'gold', icon: 'shield', title: 'Sem conteúdo sensível por e-mail', text: 'O e-mail traz só o título e o link. O conteúdo completo fica dentro do sistema.' }) + '</div></div>';
    },
    mount: (root) => {
      root.addEventListener('lt:filter', (e) => {
        const v = e.detail.value;
        root.querySelectorAll('[data-notif-lista] .lt-list__item').forEach((li) => {
          const mod = li.getAttribute('data-mod'), lida = li.getAttribute('data-lida') === '1';
          li.parentNode.hidden = !(v === 'todas' || (v === 'naolidas' && !lida) || v === mod || (v === 'core' && (mod === 'core' || mod === 'intranet')));
        });
      });
      root.addEventListener('lt:acao', (e) => {
        if (!e.target.hasAttribute('data-marcar-lidas')) return;
        D.notificacoes.forEach((n) => { n.lida = true; });
        root.querySelectorAll('.lt-list__item.is-unread').forEach((li) => { li.classList.remove('is-unread'); li.setAttribute('data-lida', '1'); const d = li.querySelector('.lt-dot'); if (d) d.remove(); });
        const b = document.getElementById('lt-notif-badge'); if (b) b.hidden = true;
      });
    }
  });
  ui.registerSheet('core-pref-notif', () => {
    const tipos = [['Prazos jurídicos', true, true], ['Etapa parada', true, true], ['Novas tarefas', true, false], ['Menções', true, true], ['Financeiro', true, false], ['Falhas de automação', true, true]];
    return { title: 'Preferências de notificação', sub: 'Escolha por onde recebe cada tipo de aviso.', size: 'sm',
      body: '<div class="lt-sections">' + ui.section({ title: 'Canais por tipo', tone: 'blue', icon: 'bell', body: '<table class="lt-trail"><thead><tr><th>Tipo</th><th style="text-align:center">No sistema</th><th style="text-align:center">E-mail</th></tr></thead><tbody>' + tipos.map((t) => '<tr><td>' + t[0] + '</td><td style="text-align:center"><label class="lt-toggle lt-toggle--sm"><input type="checkbox"' + (t[1] ? ' checked' : '') + ' disabled><span class="lt-toggle__track"></span></label></td><td style="text-align:center"><label class="lt-toggle lt-toggle--sm"><input type="checkbox"' + (t[2] ? ' checked' : '') + '><span class="lt-toggle__track"></span></label></td></tr>').join('') + '</tbody></table><p class="lt-hint lt-mt-2">Avisos no sistema são obrigatórios para prazos e tarefas.</p>' }) +
        ui.section({ title: 'Resumo diário', tone: 'gold', icon: 'mail', body: ui.field({ type: 'toggle', label: 'Receber um resumo às 07:00 com tarefas e prazos do dia', checked: true }) + '<div class="lt-mt-4"></div>' + ui.field({ label: 'Horário do resumo', type: 'time', value: '07:00' }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar preferências', toast: 'Preferências salvas' }) };
  });

  /* ================================================================== */
  /* CONFIGURAÇÕES · USUÁRIOS E PAPÉIS                                   */
  /* ================================================================== */
  function papelChip(key) { const p = D.papeis.find((x) => x.key === key) || { nome: key, tone: 'gray' }; return ui.chip(p.nome, p.tone); }
  function permCell(v) {
    if (!v) return '<span class="lt-muted" aria-label="Sem acesso">—</span>';
    if (v === 'sim') return '<span class="lt-success" aria-label="Permitido">' + I('check') + '</span>';
    if (v === 'todos') return ui.chip('Todos', 'green');
    if (v === 'proprios') return ui.chip('Próprios', 'blue');
    if (v === 'equipe') return ui.chip('Equipe', 'violet');
    return ui.chip(v, 'amber');
  }
  App.screen({
    id: 'core.settings.users', hash: 'cfg-usuarios', module: 'core', title: 'Usuários e papéis', nav: true, navGroup: 'config', navOrder: 1,
    render: () => {
      const ativos = D.equipe.filter((p) => p.status !== 'inativo').length;
      const usuarios = ui.table({
        selectable: true, rows: D.equipe, bulk: ui.btn({ label: 'Reenviar convite', size: 'xs', icon: 'send', acao: 'enviar', toast: 'Convites reenviados' }) + ui.btn({ label: 'Desativar', size: 'xs', variant: 'danger-outline', icon: 'power', confirm: 'Desativar os usuários selecionados?', confirmText: 'Eles perdem o acesso na hora. Os registros e o histórico continuam.', confirmLabel: 'Desativar', acao: 'excluir', toast: 'Usuários desativados' }),
        rowSheet: (p) => ({ sheet: 'core-usuario', params: { id: p.id } }),
        columns: [
          { label: 'Pessoa', key: 'nome', sortable: true, render: (p) => ui.person(p, esc(p.email)) },
          { label: 'Papel', key: 'papel', sortable: true, render: (p) => papelChip(p.papel) },
          { label: 'Área', key: 'area', sortable: true },
          { label: 'MFA', key: 'mfa', render: (p) => p.mfa ? ui.chip('Ativo', 'green', { icon: 'shield-check' }) : ui.chip('Pendente', 'amber', { icon: 'alert-triangle' }) },
          { label: 'Último acesso', key: 'ultimoAcesso', sortable: true, render: (p) => p.ultimoAcesso ? '<span class="lt-num">' + esc(fmt.quando(p.ultimoAcesso)) + '</span>' : '<span class="lt-muted">Nunca</span>' },
          { label: 'Situação', key: 'status', render: (p) => ui.status(p.status) }
        ],
        rowActions: (p) => ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar ' + p.nome, sheet: 'core-usuario', attrs: { 'data-id': p.id } })
      });
      const roles = D.papeis.map((r) => '<th title="' + esc(r.descricao) + '">' + esc(r.nome) + '</th>').join('');
      let matriz = '<div class="lt-table-card"><div class="lt-table-wrap" style="max-height:560px"><table class="lt-table lt-table--compact lt-matrix"><thead><tr><th>Permissão</th>' + roles + '</tr></thead><tbody>';
      D.permissoes.forEach((g) => { matriz += '<tr class="is-group"><td colspan="' + (D.papeis.length + 1) + '">' + esc(g.grupo) + '</td></tr>'; g.itens.forEach((it) => { matriz += '<tr><td><span class="lt-table__primary">' + esc(it.nome) + '</span><span class="lt-table__secondary lt-mono">' + esc(it.key) + '</span></td>' + D.papeis.map((r) => '<td><button type="button" class="lt-btn lt-btn--ghost lt-btn--xs" data-perm="' + it.key + '|' + r.key + '" title="Alterar">' + permCell(it.v[r.key]) + '</button></td>').join('') + '</tr>'; }); });
      matriz += '</tbody></table></div></div>';
      const legenda = '<div class="lt-row lt-mb-4" style="gap:14px">' + ui.chip('Todos', 'green') + '<span class="lt-small lt-muted">todos os registros</span>' + ui.chip('Próprios', 'blue') + '<span class="lt-small lt-muted">só os que a pessoa é responsável</span>' + ui.chip('Equipe', 'violet') + '<span class="lt-small lt-muted">a equipe que gerencia</span>' + '<span class="lt-success">' + I('check') + '</span><span class="lt-small lt-muted">permitido</span><span class="lt-muted">—</span><span class="lt-small lt-muted">sem acesso</span></div>';
      const papeis = '<div class="lt-grid lt-grid--4 lt-mb-4">' + D.papeis.map((r) => '<div class="lt-card" style="padding:12px 14px"><div class="lt-row lt-row--between">' + ui.chip(r.nome, r.tone) + '<span class="lt-small lt-muted lt-num">' + fmt.plural(D.equipe.filter((p) => p.papel === r.key).length, 'pessoa') + '</span></div><p class="lt-small lt-text-2 lt-mt-2">' + esc(r.descricao) + '</p></div>').join('') + '</div>';
      const filas = '<div class="lt-grid lt-grid--2">' + D.filas.map((f) => ui.card({ title: f.nome, icon: 'users', sub: 'Tarefas atribuídas à fila aparecem para todos os membros (AUT-09)', body: '<div class="lt-stack lt-stack--sm">' + f.membros.map((m) => ui.person(m, esc(db.pessoa(m).cargo))).join('') + '</div>', foot: ui.btn({ label: 'Editar membros', size: 'sm', icon: 'edit', acao: 'salvar', toast: 'Fila atualizada' }) })).join('') + '</div>';
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Usuários e papéis'), title: 'Usuários e papéis', sub: '<b>' + ativos + '</b> de <b>' + D.marca.licencas + '</b> licenças em uso · MFA obrigatório para sócios e jurídico.', actions: ui.btn({ label: 'Convidar usuário', variant: 'primary', icon: 'user-plus', sheet: 'core-usuario' }) }) +
        ui.tabs({ id: 'cfg-usuarios', tabs: [
          { key: 'usuarios', label: 'Usuários', icon: 'users', count: D.equipe.length, content: ui.filters({ busca: 'Buscar por nome ou e-mail', selects: [{ label: 'Papel', options: D.papeis.map((r) => ({ value: r.key, label: r.nome })) }, { label: 'Situação', options: ['Ativo', 'Convite enviado', 'Inativo'] }] }) + usuarios },
          { key: 'papeis', label: 'Papéis e permissões', icon: 'shield', count: D.papeis.length, content: papeis + legenda + matriz + '<div class="lt-row lt-mt-4">' + ui.callout({ tone: 'info', text: 'Clique numa célula para alternar. Toda mudança de permissão fica registrada na auditoria.' }) + '<span class="lt-push"></span>' + ui.btn({ label: 'Salvar permissões', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Permissões salvas', toastText: 'Valem a partir do próximo acesso de cada pessoa.' }) + '</div>' },
          { key: 'filas', label: 'Filas de trabalho', icon: 'inbox', count: D.filas.length, content: filas }
        ] });
      return cfgLayout('cfg-usuarios', inner);
    },
    mount: (root) => {
      const ciclo = ['', 'proprios', 'equipe', 'todos'];
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-perm]'); if (!b) return;
        const [key, role] = b.getAttribute('data-perm').split('|');
        let it; D.permissoes.forEach((g) => g.itens.forEach((x) => { if (x.key === key) it = x; }));
        const cur = it.v[role] || '';
        const bin = ['sim', ''].indexOf(cur) >= 0 && !/read|agenda/.test(key);
        it.v[role] = bin ? (cur === 'sim' ? '' : 'sim') : ciclo[(ciclo.indexOf(cur) + 1) % ciclo.length];
        b.innerHTML = permCell(it.v[role]);
      });
    }
  });
  ui.registerSheet('core-usuario', (p) => {
    const u = p.id ? db.pessoa(p.id) : null;
    return { eyebrow: u ? 'Editar usuário' : 'Convidar usuário', title: u ? u.nome : 'Novo usuário', sub: u ? esc(u.email) : 'A pessoa recebe um e-mail para criar a senha e ativar o MFA.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'user', cols: 2, body: ui.field({ label: 'Nome completo', required: true, span: 2, value: u ? u.nome : '' }) + ui.field({ label: 'E-mail corporativo', type: 'email', required: true, value: u ? u.email : '', placeholder: 'nome@atlas.exemplo' }) + ui.field({ label: 'Celular', type: 'phone', value: u ? u.telefone : '' }) + ui.field({ label: 'Cargo', span: 2, value: u ? u.cargo : '' }) }) +
        ui.section({ title: 'Acesso', tone: 'violet', icon: 'shield', cols: 2, body: ui.field({ label: 'Papel', type: 'select', required: true, value: u ? u.papel : 'consultor', options: D.papeis.map((r) => ({ value: r.key, label: r.nome })), hint: 'Define o que a pessoa vê e faz. Detalhes na aba Papéis e permissões.' }) + ui.field({ label: 'Área', type: 'select', value: u ? u.area : 'Comercial', options: ['Diretoria', 'Comercial', 'Jurídico', 'Cálculo', 'Financeiro', 'Administrativo'] }) + ui.field({ label: 'Filas de trabalho', type: 'checks', span: 2, inline: true, value: D.filas.filter((f) => u && f.membros.indexOf(u.id) >= 0).map((f) => f.id), options: D.filas.map((f) => ({ value: f.id, label: f.nome })) }) }) +
        ui.section({ title: 'Segurança', tone: 'amber', icon: 'lock', body: '<div class="lt-stack">' + ui.field({ type: 'toggle', label: 'Exigir verificação em duas etapas (MFA)', checked: true, hint: 'Obrigatório para Sócio, Gestor jurídico e Advogado.' }) + ui.field({ type: 'toggle', label: 'Ver CPF de contatos', checked: u && ['socio', 'gestor_comercial'].indexOf(u.papel) >= 0, hint: 'Cada visualização de CPF fica registrada na auditoria.' }) + '</div>' }) +
        (u ? (() => { const at = D.auditoria.filter((a) => a.pessoaId === u.id).slice(0, 3); return ui.section({ title: 'Atividade recente', tone: 'slate', icon: 'history', body: at.length ? ui.timeline(at.map((a) => ({ icon: 'dot', tone: 'slate', title: esc(a.acao + ' · ' + a.entidade), meta: esc(fmt.quando(a.quando)) + (a.registro ? ' · ' + esc(a.registro.label) : '') }))) : '<p class="lt-muted lt-small">Sem atividade registrada.</p>' }); })() : '') + '</div>',
      foot: (u ? ui.btn({ label: 'Desativar', variant: 'danger-outline', icon: 'power', confirm: 'Desativar ' + u.nome + '?', confirmText: 'O acesso é cortado na hora. Tarefas abertas precisam ser redistribuídas.', confirmLabel: 'Desativar', acao: 'excluir', toast: 'Usuário desativado', fechar: 'sheet' }) + '<span class="lt-push"></span>' : '') +
        ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-sheet': true } }) + ui.btn({ label: u ? 'Salvar usuário' : 'Enviar convite', variant: 'primary', icon: u ? 'check' : 'send', acao: u ? 'salvar' : 'convidar', toast: u ? 'Usuário salvo' : 'Convite enviado', toastText: u ? '' : 'O link vale por 72 horas.', fechar: 'sheet' }) };
  });

  /* ================================================================== */
  /* CONFIGURAÇÕES · FUNIS E ETAPAS                                      */
  /* ================================================================== */
  const reqIcon = { campos: 'list-checks', atividade: 'calendar', resultado: 'check-circle', motivo: 'alert-circle', anexo: 'paperclip' };
  App.screen({
    id: 'core.settings.pipelines', hash: 'cfg-funis', module: 'core', title: 'Funis e etapas', nav: true, navGroup: 'config', navOrder: 2,
    render: () => {
      const fk = App.state.funil || 'comercial', f = D.funis[fk];
      const etapas = f.etapas.map((e) => {
        const reqs = e.requisitos.map((r) => ui.chip(r.texto, 'amber', { icon: reqIcon[r.tipo] })).join('');
        const acoes = e.acoes.map((a) => ui.chip(a, 'violet', { icon: 'zap' })).join('');
        return '<div class="lt-card" style="display:grid;grid-template-columns:24px 40px minmax(0,1fr) auto;gap:14px;align-items:start;padding:14px 16px;border-left:3px solid ' + e.cor + '">' +
          '<span class="lt-drag" title="Arrastar para reordenar" style="margin-top:6px">' + I('grip') + '</span>' +
          '<span class="lt-kpi__icon" style="width:36px;height:36px;font-family:var(--ff-serif);font-weight:600;font-size:16px;color:var(--text)">' + e.num + '</span>' +
          '<div style="min-width:0"><div class="lt-row"><span class="lt-strong" style="font-size:14.5px">' + esc(e.nome) + '</span>' + (e.sla ? ui.chip('SLA ' + e.sla + (e.sla === 1 ? ' dia' : ' dias'), 'slate', { icon: 'hourglass' }) : '') + (e.desfecho ? ui.chip('Desfecho', 'green') : '') + '</div>' +
          '<div class="lt-stack lt-stack--sm lt-mt-2">' + (reqs ? '<div class="lt-row lt-row--top" style="gap:8px"><span class="lt-label-caps" style="width:104px;padding-top:4px;white-space:nowrap">Para entrar</span><div class="lt-chips" style="flex:1">' + reqs + '</div></div>' : '<div class="lt-small lt-muted">Sem requisitos para entrar.</div>') +
          (acoes ? '<div class="lt-row lt-row--top" style="gap:8px"><span class="lt-label-caps" style="width:104px;padding-top:4px;white-space:nowrap">Ao entrar</span><div class="lt-chips" style="flex:1">' + acoes + '</div></div>' : '') + '</div></div>' +
          ui.btn({ label: 'Editar', size: 'sm', icon: 'edit', sheet: 'core-etapa', attrs: { 'data-funil': fk, 'data-num': e.num } }) + '</div>';
      }).join('');
      const desfechos = f.desfechos ? ui.card({ title: 'Desfechos', icon: 'flag', sub: 'Zonas recolhidas no fim do kanban', body: '<div class="lt-grid lt-grid--3">' + f.desfechos.map((d) => '<div class="lt-stack lt-stack--sm">' + ui.chip(d.nome, d.tone, { lg: true, dot: true }) + '<span class="lt-small lt-text-2">Exige: ' + esc(d.exige) + '</span></div>').join('') + '</div>' }) : '';
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Funis e etapas'), title: 'Funis e etapas', sub: esc(f.descricao), actions: ui.btn({ label: 'Novo funil', icon: 'plus', acao: 'salvar', toast: 'Novo funil', toastText: 'Criar funis pela tela entra na Fase 2; nesta rodada o funil vem da configuração da Atlas.', toastTone: 'info' }) + ui.btn({ label: 'Salvar ordem', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Ordem das etapas salva' }) }) +
        '<div class="lt-row lt-row--between lt-mb-4">' + ui.segmented([{ label: 'Funil comercial · 10 etapas', value: 'comercial', active: fk === 'comercial' }, { label: 'Andamento processual · 8 etapas', value: 'juridico', active: fk === 'juridico' }], { name: 'funil' }) + '</div>' +
        ui.callout({ tone: 'gold', icon: 'info', title: 'Mudança de etapa só pelo diálogo "Mover etapa"', text: 'Arrastar no kanban ou clicar em "Mover etapa" na ficha abre o mesmo diálogo, que cobra os requisitos abaixo antes de mover. O que acontece ao entrar está no painel Fluxos.', actions: '<a class="lt-btn lt-btn--sm lt-btn--outline" href="#fluxos-diagrama-1">Ver o fluxo</a>' }) +
        '<div class="lt-stack lt-stack--sm lt-mt-4">' + etapas + '</div>' + (desfechos ? '<div class="lt-mt-4">' + desfechos + '</div>' : '');
      return cfgLayout('cfg-funis', inner);
    },
    mount: (root) => root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'funil') { App.state.funil = e.detail.value; App.refresh(); } })
  });
  ui.registerSheet('core-etapa', (p) => {
    const f = D.funis[p.funil || 'comercial'], e = f.etapas.find((x) => x.num === +p.num);
    const tipos = (e.requisitos || []).map((r) => r.tipo);
    const automs = D.fluxos.filter((fl) => e.acoes.some((a) => a.indexOf(fl.codigo) >= 0));
    return { eyebrow: f.nome + ' · etapa ' + e.num, title: e.nome, sub: 'Requisitos e ações desta etapa.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'tag', cols: 2, body: ui.field({ label: 'Nome da etapa', value: e.nome, required: true, span: 2 }) + ui.field({ label: 'Ordem', type: 'number', value: e.num }) + ui.field({ label: 'Cor', type: 'select', value: e.tone, options: [{ value: 'slate', label: 'Cinza' }, { value: 'blue', label: 'Azul' }, { value: 'violet', label: 'Violeta' }, { value: 'amber', label: 'Âmbar' }, { value: 'gold', label: 'Dourado' }, { value: 'green', label: 'Verde' }] }) }) +
        ui.section({ title: 'Tempo na etapa (SLA)', tone: 'amber', icon: 'hourglass', cols: 2, body: ui.field({ label: 'Alertar quando parado há mais de', type: 'number', value: e.sla || '', suffix: 'dias', hint: 'Dispara a automação AUT-10.' }) + ui.field({ label: 'Quem recebe o alerta', type: 'checks', value: ['consultor', 'gestor'], options: [{ value: 'consultor', label: 'Consultor responsável' }, { value: 'gestor', label: 'Gestor comercial' }] }) }) +
        ui.section({ title: 'Requisitos para entrar', tone: 'violet', icon: 'list-checks', sub: 'O diálogo "Mover etapa" só conclui com tudo preenchido', body: ui.field({ type: 'checks', value: tipos, options: [
          { value: 'campos', label: 'Campos obrigatórios do cadastro', hint: 'Razão social, CNPJ, regime, contato e origem' },
          { value: 'atividade', label: 'Atividade registrada com data e hora', hint: 'Ex.: reunião agendada, documentação recebida' },
          { value: 'resultado', label: 'Resultado obrigatório', hint: 'Ex.: realizada ou não realizada' },
          { value: 'motivo', label: 'Motivo obrigatório (perda ou descarte)', hint: 'Escolhido da lista de motivos' },
          { value: 'anexo', label: 'Anexo obrigatório', hint: 'Ex.: contrato assinado' }] }) }) +
        ui.section({ title: 'Ao entrar nesta etapa', tone: 'blue', icon: 'zap', sub: 'Automações ligadas à etapa', body: automs.length ? '<div class="lt-stack lt-stack--sm">' + automs.map((a) => '<div class="lt-row lt-row--between"><span>' + ui.chip(a.codigo, 'violet') + ' ' + esc(a.nome) + '</span><a href="#fluxos-diagrama-' + a.id + '" data-fechar-sheet class="lt-small">Ver diagrama</a></div>').join('') + '</div>' : '<p class="lt-small lt-muted">Nenhuma automação nesta etapa.</p>' }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar etapa', toast: 'Etapa salva', toastText: 'Negócios já nesta etapa não são afetados.' }) };
  });

  /* ================================================================== */
  /* CONFIGURAÇÕES · LISTAS                                              */
  /* ================================================================== */
  const LISTAS = [
    ['origens', 'Origem do lead', 'Como a empresa chegou até a Atlas'], ['segmentos', 'Segmento', 'Setor de atuação da empresa'], ['regimes', 'Regime tributário', 'Simples Nacional é descartado na qualificação'],
    ['teses', 'Teses (oportunidades)', 'O que a Atlas pode recuperar. Lista a validar com os sócios tributaristas; tese encerrada nos tribunais fica desativada.'], ['motivosPerda', 'Motivo de perda', 'Obrigatório ao marcar o negócio como perdido'], ['motivosDescarte', 'Motivo de descarte', 'Obrigatório ao descartar na qualificação'],
    ['tiposAtividade', 'Tipos de atividade e resultados', 'Resultados estruturados alimentam os indicadores'], ['tiposPrazo', 'Tipos de prazo', 'Usados no cadastro de prazos do Jurídico'], ['categoriasDocumento', 'Categorias de documento', 'Para anexos em empresas, negócios e processos']
  ];
  const usoFake = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 97; return h % 23; };
  App.screen({
    id: 'core.settings.lists', hash: 'cfg-listas', module: 'core', title: 'Listas', nav: true, navGroup: 'config', navOrder: 3,
    render: () => {
      const sel = App.state.lista || 'origens', meta = LISTAS.find((l) => l[0] === sel), itens = db.lista(sel);
      const nav = '<div class="lt-card" style="padding:8px"><nav class="lt-subnav" style="position:static">' + LISTAS.map((l) => '<button type="button" class="' + (l[0] === sel ? 'is-active' : '') + '" data-lista="' + l[0] + '"><span class="lt-truncate" style="flex:1">' + l[1] + '</span><span class="lt-subnav__count">' + db.lista(l[0]).length + '</span></button>').join('') + '</nav></div>';
      let corpo;
      if (sel === 'tiposAtividade') {
        corpo = '<div class="lt-stack lt-stack--sm" data-lista-itens>' + itens.map((t) => '<div class="lt-card" style="padding:12px 14px;display:grid;grid-template-columns:20px 36px minmax(0,1fr) auto;gap:12px;align-items:center"><span class="lt-drag">' + I('grip') + '</span><span class="lt-list__icon" data-tone="' + t.tone + '">' + I(t.icon) + '</span><div><div class="lt-strong">' + esc(t.nome) + '</div><div class="lt-chips lt-mt-2">' + t.resultados.map((r) => ui.chip(r, t.tone)).join('') + ui.btn({ label: 'Resultado', variant: 'add', size: 'xs', icon: 'plus', acao: 'salvar', toast: 'Resultado adicionado' }) + '</div></div>' + ui.btn({ icon: 'edit', variant: 'ghost', size: 'sm', tip: 'Editar tipo' }) + '</div>').join('') + '</div>';
      } else {
        corpo = '<div class="lt-table-card"><table class="lt-table lt-table--compact"><thead><tr><th style="width:28px"></th><th>Valor</th><th class="lt-num" style="width:110px">Em uso</th><th style="width:90px">Ativo</th><th style="width:44px"></th></tr></thead><tbody data-lista-itens>' +
          itens.map((v) => '<tr><td><span class="lt-drag">' + I('grip') + '</span></td><td><input class="lt-input" value="' + esc(v) + '" style="height:32px" aria-label="Valor"></td><td class="lt-num lt-muted">' + usoFake(v) + ' registros</td><td><label class="lt-toggle lt-toggle--sm"><input type="checkbox"' + (v === 'Simples Nacional' ? '' : ' checked') + '><span class="lt-toggle__track"></span></label></td><td>' + ui.btn({ icon: 'trash', variant: 'ghost', size: 'xs', tip: 'Excluir valor', confirm: 'Excluir "' + v + '"?', confirmText: 'Registros que usam este valor continuam com ele, mas ele some das opções. Prefira desativar.', confirmLabel: 'Excluir', acao: 'excluir', toast: 'Valor excluído' }) + '</td></tr>').join('') +
          /* valores desativados: continuam nos registros antigos, mas saem das opções dos formulários */
          ((D.listas.inativos || {})[sel] || []).map((x) => '<tr class="is-muted"><td><span class="lt-drag">' + I('grip') + '</span></td><td><input class="lt-input" value="' + esc(x.valor) + '" style="height:32px" aria-label="Valor desativado" readonly><span class="lt-table__secondary" style="margin-top:4px">' + I('info') + ' ' + esc(x.motivo) + '</span></td><td class="lt-num lt-muted">' + esc(x.uso) + '</td><td><label class="lt-toggle lt-toggle--sm" title="Desativado"><input type="checkbox" aria-label="Ativo"><span class="lt-toggle__track"></span></label></td><td></td></tr>').join('') + '</tbody></table></div>';
      }
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Listas'), title: 'Listas', sub: 'Opções que aparecem nos formulários de todos os módulos.' }) +
        '<div class="lt-split lt-split--left" style="grid-template-columns:240px minmax(0,1fr)">' + nav + '<div>' +
        ui.card({ title: meta[1], sub: esc(meta[2]), actions: ui.btn({ label: 'Adicionar', variant: 'add', size: 'sm', icon: 'plus', attrs: { 'data-lista-add': true } }), body: corpo, foot: '<span class="lt-small lt-muted" style="margin-right:auto">Arraste para mudar a ordem. Desativar esconde a opção sem apagar o histórico.</span>' + ui.btn({ label: 'Salvar lista', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Lista salva', toastText: esc(meta[1]) }) }) + '</div></div>';
      return cfgLayout('cfg-listas', inner);
    },
    mount: (root) => {
      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-lista]'); if (b) { App.state.lista = b.getAttribute('data-lista'); App.refresh(); return; }
        if (e.target.closest('[data-lista-add]')) {
          const tb = root.querySelector('tbody[data-lista-itens]'); if (!tb) { ui.toast('Novo tipo de atividade', 'info', 'Edite os resultados depois de criar.'); return; }
          const tr = document.createElement('tr');
          tr.innerHTML = '<td><span class="lt-drag">' + I('grip') + '</span></td><td><input class="lt-input" placeholder="Novo valor" style="height:32px" aria-label="Novo valor"></td><td class="lt-num lt-muted">0 registros</td><td><label class="lt-toggle lt-toggle--sm"><input type="checkbox" checked><span class="lt-toggle__track"></span></label></td><td></td>';
          tb.appendChild(tr); tr.querySelector('input').focus();
        }
      });
    }
  });

  /* ================================================================== */
  /* CONFIGURAÇÕES · CALENDÁRIO E FERIADOS                               */
  /* ================================================================== */
  const tipoFeriadoTone = { nacional: 'gold', estadual: 'blue', municipal: 'violet', forense: 'slate' };
  function simuladorHtml(fatal) {
    const d = util.parse(fatal), passos = util.explicarD1(fatal), interno = util.prazoInterno(fatal);
    const fatalUtil = util.ehDiaUtil(d);
    return '<div class="lt-summary"><div class="lt-summary__item"><div class="lt-summary__label">Prazo fatal</div><div class="lt-summary__value">' + fmt.data(fatal) + ' <span class="lt-muted" style="font-weight:400">' + fmt.diaSemana(fatal) + '</span></div></div><div class="lt-summary__item" style="background:var(--gold-subtle)"><div class="lt-summary__label">Prazo interno (D-1)</div><div class="lt-summary__value lt-gold">' + fmt.data(interno) + ' <span style="font-weight:400">' + fmt.diaSemana(interno) + '</span></div></div><div class="lt-summary__item"><div class="lt-summary__label">Dias de antecedência</div><div class="lt-summary__value">' + util.diasEntre(interno, fatal) + ' corridos</div></div></div>' +
      (fatalUtil ? '' : '<div class="lt-mt-4">' + ui.callout({ tone: 'warning', text: 'A data fatal informada não é dia útil. Confira: pelo CPC, o prazo que vence em dia não útil é prorrogado para o próximo dia útil (' + fmt.data(util.proximoDiaUtil(d)) + ').' }) + '</div>') +
      '<ol class="lt-mt-4" style="margin-bottom:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px">' + passos.map((s, i) => '<li' + (i === passos.length - 1 ? ' class="lt-strong"' : '') + '>' + esc(s) + '</li>').join('') + '</ol>';
  }
  App.screen({
    id: 'core.settings.calendar', hash: 'cfg-calendario', module: 'core', title: 'Calendário e feriados', nav: true, navGroup: 'config', navOrder: 4,
    render: () => {
      const fer = ui.table({
        rows: D.feriados, compact: true, rowClass: (f) => 'cal-esc-' + (f.escopo || 'geral'),
        columns: [
          { label: 'Data', key: 'data', sortable: true, sorted: 'asc', render: (f) => '<span class="lt-num lt-strong">' + fmt.data(f.data) + '</span>' },
          { label: 'Dia', key: 'data', render: (f) => '<span class="' + (util.fimDeSemana(f.data) ? 'lt-muted' : '') + '">' + fmt.diaSemana(f.data).replace('-feira', '') + '</span>' },
          { label: 'Feriado', key: 'nome', sortable: true, render: (f) => esc(f.nome) + (f.obs ? '<span class="lt-table__secondary">' + esc(f.obs) + '</span>' : '') },
          { label: 'Tipo', key: 'tipo', sortable: true, render: (f) => ui.chip(f.tipo.charAt(0).toUpperCase() + f.tipo.slice(1), tipoFeriadoTone[f.tipo]) },
          { label: 'Abrangência', key: 'abrangencia' },
          { label: 'Fonte', key: 'fonte', render: (f) => f.fonte === 'BrasilAPI' ? ui.chip('BrasilAPI', 'blue', { icon: 'globe' }) : ui.chip('Manual', 'gray', { icon: 'edit' }) }
        ],
        rowActions: (f) => ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar feriado', sheet: 'core-feriado', attrs: { 'data-data': f.data } }) + ui.btn({ icon: 'trash', variant: 'ghost', size: 'xs', tip: 'Excluir feriado', confirm: 'Excluir o feriado de ' + fmt.data(f.data) + '?', confirmText: 'Os prazos internos afetados serão recalculados (CORE-01).', confirmLabel: 'Excluir e recalcular', acao: 'excluir', toast: 'Feriado excluído', toastText: 'Prazos internos recalculados.' })
      });
      const sus = ui.table({ rows: D.suspensoes, columns: [
        { label: 'Período', key: 'inicio', render: (s) => '<span class="lt-num lt-strong">' + fmt.data(s.inicio) + (s.fim !== s.inicio ? ' a ' + fmt.data(s.fim) : '') + '</span>' },
        { label: 'Suspensão', key: 'nome', render: (s) => esc(s.nome) + '<span class="lt-table__secondary">' + esc(s.obs) + '</span>' },
        { label: 'Tipo', key: 'tipo', render: (s) => ui.chip({ portaria: 'Portaria', recesso: 'Recesso', suspensao: 'Suspensão de prazos' }[s.tipo], s.tipo === 'portaria' ? 'blue' : 'slate') },
        { label: 'Abrangência', key: 'abrangencia' },
        { label: 'Dias', key: 'id', align: 'right', render: (s) => util.diasEntre(s.inicio, s.fim) + 1 }
      ], rowActions: () => ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar' }) });
      const nov = ui.calMonth({ ano: 2026, mes: 10, mini: true, eventos: [] }), dez = ui.calMonth({ ano: 2026, mes: 11, mini: true, eventos: [] });
      const sim = '<div class="lt-g12"><div class="lt-c5">' + ui.section({ title: 'Simular prazo interno', tone: 'amber', icon: 'calculator', body: '<div class="lt-stack">' + ui.field({ label: 'Data fatal', type: 'date', value: '2026-11-23', id: 'sim-fatal', hint: 'Escolha uma data e veja o prazo interno calculado.' }) +
        '<div class="lt-demo-label">Exemplos</div><div class="lt-chips">' + [['2026-10-19', 'Exemplo da proposta'], ['2026-11-23', 'Depois de feriado'], ['2026-11-03', 'Depois de Finados'], ['2027-01-21', 'Fim da suspensão']].map((x) => '<button type="button" class="lt-filter-chip" data-sim="' + x[0] + '">' + fmt.dataCurta(x[0]) + ' · ' + x[1] + '</button>').join('') + '</div></div>' }) + '</div>' +
        '<div class="lt-c7">' + ui.card({ title: 'Resultado', icon: 'calendar-clock', body: '<div data-sim-out>' + simuladorHtml('2026-11-23') + '</div>' }) + '</div></div>';
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Calendário e feriados'), title: 'Calendário de dias úteis', sub: 'Base da regra D-1: prazo interno = 1 dia útil antes do fatal. Exclui fins de semana e feriados nacionais, estaduais, municipais e forenses.',
        actions: ui.btn({ label: 'Importar da BrasilAPI', icon: 'download', acao: 'importar', toast: 'Feriados nacionais conferidos', toastText: '10 feriados nacionais de 2026 já estavam cadastrados. Nada mudou.' }) + ui.btn({ label: 'Novo feriado', variant: 'primary', icon: 'plus', sheet: 'core-feriado' }) }) +
        ui.callout({ tone: 'warning', icon: 'refresh', title: 'Recálculo automático (CORE-01)', text: 'Ao cadastrar ou excluir um feriado ou suspensão, os prazos pendentes afetados são recalculados e os responsáveis avisados. Último recálculo: 05/11/2026, 2 prazos alterados.', actions: ui.btn({ label: 'Recalcular agora', size: 'sm', variant: 'outline', icon: 'refresh', acao: 'recalcular', toast: 'Prazos conferidos', toastText: '8 prazos pendentes conferidos · nenhuma alteração.' }) }) +
        '<div class="lt-mt-4"></div>' + ui.tabs({ id: 'cfg-cal', tabs: [
          { key: 'feriados', label: 'Feriados 2026', icon: 'calendar', count: D.feriados.length, content: '<div class="lt-split"><div>' + ui.filters({ chipGroup: 'single', chips: [{ label: 'Todos', active: true, value: 'todos' }, { label: 'Nacional', value: 'nacional', tone: 'gold' }, { label: 'Estadual', value: 'estadual', tone: 'blue' }, { label: 'Municipal', value: 'municipal', tone: 'violet' }, { label: 'Forense', value: 'forense', tone: 'slate' }], extra: '<select class="lt-select" style="width:auto" data-cfg-escopo aria-label="Calendário"><option value="todos">Todos os calendários</option><option value="jf">Campinas e Justiça Federal (padrão do D-1)</option><option value="tjsp">Justiça Estadual (TJSP)</option></select>' }) + fer + '</div><div class="lt-stack">' + ui.card({ title: 'Novembro de 2026', body: nov }) + ui.card({ title: 'Dezembro de 2026', body: dez }) + ui.callout({ tone: 'info', title: 'Pergunta em aberto (Q7)', text: 'Calendário único ou por comarca? Quem na Atlas mantém os feriados locais e as suspensões?' }) + '</div></div>' },
          { key: 'suspensoes', label: 'Suspensões de prazo', icon: 'pause', count: D.suspensoes.length, content: '<div class="lt-row lt-row--between lt-mb-4"><p class="lt-small lt-text-2">Recesso forense, suspensões do CPC (art. 220) e portarias de tribunal.</p>' + ui.btn({ label: 'Nova suspensão', icon: 'plus', variant: 'outline', sheet: 'core-feriado', attrs: { 'data-tipo': 'suspensao' } }) + '</div>' + sus },
          { key: 'simulador', label: 'Simulador D-1', icon: 'calculator', content: sim }
        ] });
      return cfgLayout('cfg-calendario', inner);
    },
    mount: (root) => {
      const inp = root.querySelector('#sim-fatal'), out = root.querySelector('[data-sim-out]');
      const upd = (v) => { if (v) out.innerHTML = simuladorHtml(v); };
      if (inp) inp.addEventListener('input', () => upd(inp.value));
      root.addEventListener('click', (e) => { const c = e.target.closest('[data-sim]'); if (c) { inp.value = c.getAttribute('data-sim'); upd(inp.value); } });
      /* filtros combinados: tipo (chips) × calendário (select). Feriado sem escopo vale para os dois calendários. */
      const F = { tipo: 'todos', esc: 'todos' };
      const aplicar = () => root.querySelectorAll('[data-panel="feriados"] tbody tr').forEach((tr) => {
        const t = tr.querySelector('td[data-col="3"]').getAttribute('data-v'), m = (tr.className.match(/cal-esc-(\w+)/) || [])[1];
        tr.hidden = !((F.tipo === 'todos' || F.tipo === t) && (F.esc === 'todos' || m === 'geral' || m === F.esc));
      });
      root.addEventListener('lt:filter', (e) => {
        const v = e.detail.value; if (!/^(todos|nacional|estadual|municipal|forense)$/.test(v)) return;
        F.tipo = v; aplicar();
      });
      root.addEventListener('change', (e) => { if (!e.target.matches('[data-cfg-escopo]')) return; F.esc = e.target.value; aplicar(); });
    }
  });
  ui.registerSheet('core-feriado', (p) => {
    const f = p.data ? D.feriados.find((x) => x.data === p.data) : null, sus = p.tipo === 'suspensao';
    return { title: f ? 'Editar feriado' : sus ? 'Nova suspensão de prazo' : 'Novo feriado', sub: 'Os prazos internos afetados são recalculados ao salvar.', size: 'sm',
      body: '<div class="lt-sections">' + ui.section({ title: sus ? 'Período' : 'Data', tone: 'amber', icon: 'calendar', cols: 2, body: (sus ? ui.field({ label: 'Início', type: 'date', required: true }) + ui.field({ label: 'Fim', type: 'date', required: true }) : ui.field({ label: 'Data', type: 'date', required: true, value: f ? f.data : '', span: 2 })) + ui.field({ label: 'Nome', required: true, span: 2, value: f ? f.nome : '', placeholder: sus ? 'Ex.: Portaria TRF3 nº …' : 'Ex.: Aniversário da cidade' }) }) +
        ui.section({ title: 'Classificação', tone: 'violet', icon: 'tag', cols: 2, body: ui.field({ label: 'Tipo', type: 'select', value: f ? f.tipo : (sus ? 'suspensao' : 'municipal'), options: sus ? [{ value: 'suspensao', label: 'Suspensão de prazos' }, { value: 'recesso', label: 'Recesso' }, { value: 'portaria', label: 'Portaria de tribunal' }] : [{ value: 'nacional', label: 'Nacional' }, { value: 'estadual', label: 'Estadual' }, { value: 'municipal', label: 'Municipal' }, { value: 'forense', label: 'Forense' }] }) + ui.field({ label: 'Abrangência', type: 'select', value: f ? f.abrangencia : 'Campinas', options: ['Brasil', 'São Paulo', 'Campinas', 'Justiça Federal', 'TRF3', 'Todos os tribunais'] }) }) +
        ui.section({ title: 'Observação', tone: 'slate', icon: 'file-text', body: ui.field({ type: 'textarea', value: f && f.obs ? f.obs : '', placeholder: 'Fonte, número da portaria, link' }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar e recalcular', toast: 'Calendário atualizado', toastText: 'Prazos internos recalculados e responsáveis avisados.', loading: 'Recalculando…' }) };
  });

  /* ================================================================== */
  /* CONFIGURAÇÕES · MARCA                                               */
  /* ================================================================== */
  App.screen({
    id: 'core.settings.brand', hash: 'cfg-marca', module: 'core', title: 'Marca', nav: true, navGroup: 'config', navOrder: 5,
    render: () => {
      const M = D.marca;
      const pares = [['Texto sobre fundo claro', '#16130E', '#F7F4EE', '16,9'], ['Dourado escuro (texto) sobre branco', '#8A6320', '#FFFFFF', '5,4'], ['Preto sobre botão dourado', '#060606', '#C4923A', '7,3'], ['Dourado claro sobre fundo escuro', '#D4A85A', '#141414', '8,4'], ['Dourado #C4923A como texto no claro', '#C4923A', '#FFFFFF', '2,6']];
      const contraste = '<table class="lt-trail"><thead><tr><th>Par</th><th>Amostra</th><th style="text-align:right">Contraste</th><th>WCAG AA</th></tr></thead><tbody>' + pares.map((x) => { const ok = parseFloat(x[3].replace(',', '.')) >= 4.5; return '<tr><td>' + x[0] + '</td><td><span style="display:inline-block;padding:3px 10px;border-radius:2px;background:' + x[2] + ';color:' + x[1] + ';font-weight:600;border:1px solid var(--border)">Atlas Aa</span></td><td class="lt-num" style="text-align:right">' + x[3] + ':1</td><td>' + (ok ? ui.chip('Aprovado', 'green', { icon: 'check' }) : ui.chip('Reprovado · não usar', 'red', { icon: 'x' })) + '</td></tr>'; }).join('') + '</tbody></table>';
      const sw = (nome, cor, txt, token) => '<div class="lt-swatch-card"><div class="lt-swatch-card__color" style="background:' + cor + ';color:' + txt + '">Aa</div><div class="lt-swatch-card__body"><b>' + nome + '</b><code>' + token + ' · ' + cor + '</code></div></div>';
      const logos = '<div class="lt-grid lt-grid--2"><div class="lt-stack lt-stack--sm"><span class="lt-label">Logo para fundo claro</span><div style="background:#F7F4EE;border:1px solid var(--border);border-radius:var(--r-md);padding:20px;display:grid;place-items:center"><img src="assets/img/logo-atlas-fundo-claro.webp" alt="Logo Atlas para fundo claro" style="height:42px;width:auto"></div>' + ui.field({ type: 'upload', accept: 'SVG ou WEBP transparente · mín. 340 px de largura' }) + '</div><div class="lt-stack lt-stack--sm"><span class="lt-label">Logo para fundo escuro</span><div style="background:#060606;border:1px solid #262626;border-radius:var(--r-md);padding:20px;display:grid;place-items:center"><img src="assets/img/logo-atlas.webp" alt="Logo Atlas para fundo escuro" style="height:42px;width:auto"></div>' + ui.field({ type: 'upload', accept: 'SVG ou WEBP transparente · mín. 340 px de largura' }) + '</div></div>';
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Marca'), title: 'Marca', sub: 'Identidade aplicada ao sistema, aos e-mails e aos PDFs. Segue o site atlascorporate.com.br.' }) +
        '<div class="lt-sections">' +
        ui.section({ title: 'Identidade', tone: 'gold', icon: 'building', cols: 2, body: ui.field({ label: 'Nome da empresa', value: M.nome, required: true }) + ui.field({ label: 'Nome do sistema (aba do navegador)', value: M.nomeSistema }) + '<div class="lt-span-full">' + logos + '</div>' }) +
        ui.section({ title: 'Cores', tone: 'violet', icon: 'palette', sub: 'Vêm do site; o dourado só vira texto na versão escurecida', body: '<div class="lt-swatches">' + sw('Dourado', '#C4923A', '#060606', '--gold') + sw('Dourado claro', '#D4A85A', '#060606', '--gold-hover') + sw('Dourado escuro (texto)', '#8A6320', '#FFFFFF', '--gold-text') + sw('Preto', '#060606', '#D4A85A', 'escuro --sidebar-bg') + sw('Cartão escuro', '#141414', '#F2EEE7', 'escuro --surface') + sw('Off-white', '#F7F4EE', '#16130E', 'claro --bg') + '</div><div class="lt-demo-label lt-mt-4">Contraste conferido</div>' + contraste }) +
        ui.section({ title: 'Tipografia', tone: 'blue', icon: 'type', cols: 2, body: '<div class="lt-preview-mini"><span class="lt-label-caps">Títulos · ' + M.fonteTitulos + '</span><span class="lt-serif" style="font-size:28px;font-weight:600;line-height:1.15">Recuperação de créditos tributários</span></div><div class="lt-preview-mini"><span class="lt-label-caps">Interface · ' + M.fonteTexto + '</span><span style="font-size:14px">Prazo interno em 19/11/2026 · <b class="lt-num">R$ 1.245.380,00</b> em créditos estimados.</span></div>' }) +
        ui.section({ title: 'Tema', tone: 'slate', icon: 'moon', cols: 2, body: ui.field({ label: 'Tema padrão para novos usuários', type: 'radio', value: 'sistema', options: [{ value: 'sistema', label: 'Seguir o sistema operacional' }, { value: 'claro', label: 'Claro (off-white e dourado escurecido)' }, { value: 'escuro', label: 'Escuro (preto e dourado, como o site)' }] }) + '<div class="lt-stack lt-stack--sm"><span class="lt-label">Cada pessoa pode trocar</span><p class="lt-small lt-text-2">O botão ' + I('moon') + ' no topo alterna entre claro e escuro e lembra a escolha neste navegador.</p>' + ui.btn({ label: 'Alternar agora', icon: 'sun', size: 'sm', attrs: { 'data-theme-toggle': true } }) + '</div>' }) +
        ui.section({ title: 'E-mails do sistema', tone: 'green', icon: 'mail', cols: 2, body: ui.field({ label: 'Remetente', value: M.remetente, span: 2 }) + ui.field({ label: 'Assinatura', type: 'textarea', span: 2, value: 'Atlas Corporate · Consultoria tributária e empresarial\nCampinas/SP' }) }) +
        '</div><div class="lt-form-actions"><span class="lt-form-actions__info">Alterações valem para todos os usuários no próximo carregamento.</span>' + ui.btn({ label: 'Descartar' }) + ui.btn({ label: 'Salvar marca', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Marca salva' }) + '</div>';
      return cfgLayout('cfg-marca', inner);
    }
  });

  /* ================================================================== */
  /* AUDITORIA                                                           */
  /* ================================================================== */
  const acaoTone = { Alterou: 'blue', Criou: 'green', Excluiu: 'red', Exportou: 'amber', Entrou: 'slate', 'Falha de login': 'red', 'Acessou dado protegido': 'violet', Automação: 'gold' };
  App.screen({
    id: 'core.audit', hash: 'auditoria', module: 'core', title: 'Auditoria', nav: true, navGroup: 'config', navOrder: 7,
    render: () => {
      const tabela = ui.table({
        rows: D.auditoria, pageSize: 12, compact: true,
        rowSheet: (a) => ({ sheet: 'core-auditoria', params: { id: a.id } }),
        columns: [
          { label: 'Quando', key: 'quando', sortable: true, sorted: 'desc', render: (a) => '<span class="lt-num">' + fmt.dataHora(a.quando) + '</span>' },
          { label: 'Pessoa', key: 'pessoaId', render: (a) => a.pessoaId ? ui.person(a.pessoaId) : ui.chip('Sistema', 'gold', { icon: 'zap' }) },
          { label: 'Ação', key: 'acao', sortable: true, render: (a) => ui.chip(a.acao, acaoTone[a.acao] || 'gray') },
          { label: 'Registro', key: 'entidade', render: (a) => '<span class="lt-table__primary">' + esc(a.entidade) + '</span>' + (a.registro ? '<span class="lt-table__secondary">' + esc(a.registro.label) + '</span>' : '') },
          { label: 'Campo', key: 'campo', render: (a) => esc(a.campo) },
          { label: 'Antes → depois', key: 'depois', render: (a) => (a.antes ? '<span class="lt-muted" style="text-decoration:line-through">' + esc(a.antes) + '</span> ' + I('arrow-right') + ' ' : '') + '<span>' + esc(a.depois) + '</span>' },
          { label: 'IP', key: 'ip', render: (a) => '<span class="lt-mono lt-muted">' + esc(a.ip) + '</span>' }
        ]
      });
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Auditoria'), title: 'Auditoria', sub: 'Quem fez o quê, quando e de onde. Registros não podem ser editados nem excluídos.',
        actions: ui.btn({ label: 'Exportar Excel', icon: 'download', acao: 'exportar', toast: 'Exportação pronta', toastText: 'O download foi registrado na própria auditoria.' }) }) +
        ui.filters({ busca: 'Buscar no registro', selects: [{ label: 'Pessoa', options: D.equipe.map((p) => ({ value: p.id, label: p.nome })) }, { label: 'Módulo', options: [{ value: 'core', label: 'Núcleo' }, { value: 'crm', label: 'CRM' }, { value: 'juridico', label: 'Jurídico' }, { value: 'financeiro', label: 'Financeiro' }, { value: 'intranet', label: 'Intranet' }] }, { label: 'Ação', options: Object.keys(acaoTone) }], extra: '<span class="lt-filters__range">Período <input class="lt-input" type="date" value="2026-10-01" aria-label="De"> a <input class="lt-input" type="date" value="2026-11-09" aria-label="Até"></span>' }) +
        tabela + '<div class="lt-mt-4">' + ui.callout({ tone: 'info', icon: 'shield', text: 'Retenção sugerida: 5 anos (a confirmar com a Atlas). Acessos a CPF e exportações sempre ficam registrados.' }) + '</div>';
      return cfgLayout('auditoria', inner);
    }
  });
  ui.registerSheet('core-auditoria', (p) => {
    const a = D.auditoria.find((x) => x.id === +p.id), pe = a.pessoaId ? db.pessoa(a.pessoaId) : null;
    return { eyebrow: 'Registro de auditoria #' + a.id, title: a.acao + ' · ' + a.entidade, sub: fmt.dataExtenso(a.quando) + ', ' + fmt.hora(a.quando), size: 'sm',
      body: '<div class="lt-sections">' + ui.section({ title: 'Quem', tone: 'blue', icon: 'user', body: pe ? ui.person(pe, esc(pe.cargo) + ' · IP ' + esc(a.ip)) : ui.chip('Sistema (automação)', 'gold', { icon: 'zap' }) }) +
        ui.section({ title: 'O que mudou', tone: 'amber', icon: 'history', body: ui.dl([['Registro', a.registro ? '<a href="#' + esc(a.registro.hash) + '" data-fechar-sheet>' + esc(a.registro.label) + '</a>' : '—'], ['Campo', esc(a.campo)], ['Antes', a.antes ? '<span class="lt-danger">' + esc(a.antes) + '</span>' : '—'], ['Depois', '<span class="lt-success">' + esc(a.depois) + '</span>']]) }) +
        ui.section({ title: 'Dados técnicos', tone: 'slate', icon: 'database', body: '<pre class="lt-pre">' + esc(JSON.stringify({ id: a.id, modulo: a.modulo, acao: a.acao, entidade: a.entidade, campo: a.campo, ip: a.ip, quando: a.quando }, null, 2)) + '</pre>' }) + '</div>' };
  });

  /* ================================================================== */
  /* CONFIGURAÇÕES · BACKUP E SEGURANÇA (FND-09)                         */
  /* ================================================================== */
  const BACKUPS = [
    { quando: '2026-11-09T03:40', tipo: 'arquivos', tamanho: '18,6 GB · 4.812 arquivos', duracao: '38 min', ok: true },
    { quando: '2026-11-09T03:00', tipo: 'banco', tamanho: '412 MB', duracao: '6 min', ok: true },
    { quando: '2026-11-08T03:40', tipo: 'arquivos', tamanho: '18,5 GB · 4.790 arquivos', duracao: '37 min', ok: true },
    { quando: '2026-11-08T03:00', tipo: 'banco', tamanho: '410 MB', duracao: '6 min', ok: true },
    { quando: '2026-11-07T03:00', tipo: 'banco', tamanho: '409 MB', duracao: '5 min', ok: true },
    { quando: '2026-11-06T05:10', tipo: 'arquivos', tamanho: '18,4 GB · 4.751 arquivos', duracao: '41 min', ok: true, nota: 'Nova tentativa automática' },
    { quando: '2026-11-06T03:40', tipo: 'arquivos', tamanho: '—', duracao: '60 min', ok: false, nota: 'Tempo esgotado na cópia; nova tentativa às 05:10' },
    { quando: '2026-11-06T03:00', tipo: 'banco', tamanho: '407 MB', duracao: '6 min', ok: true }
  ];
  App.screen({
    id: 'core.settings.backup', hash: 'cfg-backup', module: 'core', title: 'Backup e segurança', nav: true, navGroup: 'config', navOrder: 8,
    render: () => {
      const hist = ui.table({
        rows: BACKUPS, compact: true,
        columns: [
          { label: 'Quando', key: 'quando', render: (b) => '<span class="lt-num lt-strong" style="white-space:nowrap">' + fmt.dataHora(b.quando) + '</span>' },
          { label: 'Tipo', key: 'tipo', render: (b) => b.tipo === 'banco' ? ui.chip('Banco de dados', 'blue', { icon: 'database' }) : ui.chip('Arquivos', 'violet', { icon: 'folder' }) },
          { label: 'Tamanho', key: 'tamanho', render: (b) => '<span class="lt-num lt-text-2" style="white-space:nowrap">' + esc(b.tamanho) + '</span>' },
          { label: 'Duração', key: 'duracao', align: 'right', render: (b) => '<span class="lt-num">' + esc(b.duracao) + '</span>' },
          { label: 'Situação', key: 'ok', render: (b) => (b.ok ? ui.chip('Concluído', 'green', { dot: true }) : ui.chip('Falhou', 'red', { dot: true })) + (b.nota ? '<span class="lt-table__secondary">' + esc(b.nota) + '</span>' : '') }
        ]
      });
      const retencao = ui.dl([['Backup diário', 'Guardado por 30 dias'], ['Backup mensal', '12 meses (1º dia de cada mês)'], ['Ponto no tempo', 'Últimos 7 dias, a confirmar (Q18)'], ['Auditoria', '5 anos, a confirmar'], ['Lixeira', '30 dias, depois apaga de vez'], ['Usuário desativado', 'Dados anonimizados após 5 anos (LGPD)']]);
      const teste = '<ol class="lt-list" style="margin:-10px -18px">' + [['Banco restaurado num ambiente separado', '18 min'], ['Arquivos conferidos por amostragem (200 de 4.812)', '12 min'], ['Login e 10 telas principais conferidos', '12 min']].map((x) => '<li class="lt-list__item"><span class="lt-list__icon" data-tone="green">' + I('check') + '</span><div class="lt-list__body"><div class="lt-list__title">' + esc(x[0]) + '</div></div><span class="lt-list__aside lt-num">' + x[1] + '</span></li>').join('') + '</ol>';
      const roteiro = ui.timeline([
        { icon: 'shield', tone: 'red', title: '1. Conter', meta: 'Primeira hora', text: 'Bloquear acessos suspeitos, trocar senhas expostas e pausar integrações.' },
        { icon: 'search', tone: 'amber', title: '2. Avaliar', meta: 'Até 24 horas', text: 'Quais dados, empresas e pessoas foram afetados, e desde quando.' },
        { icon: 'send', tone: 'blue', title: '3. Comunicar', meta: 'Sócios em até 2 h · ANPD e titulares em até 3 dias úteis, se houver risco', text: 'O texto da comunicação fica pronto no roteiro; a Mariana aprova antes do envio.' },
        { icon: 'refresh', tone: 'green', title: '4. Restaurar', meta: 'Pelo backup ou ponto no tempo', text: 'Restaurar só o que foi afetado; restauração completa só com aprovação da sócia.' },
        { icon: 'file-text', tone: 'slate', title: '5. Registrar e revisar', meta: 'Até 5 dias úteis', text: 'Relatório do incidente na auditoria e ajuste do que falhou.' }
      ]);
      const inner = ui.pageHeader({ breadcrumb: crumbCfg('Backup e segurança'), title: 'Backup e segurança', sub: 'Cópias automáticas do banco e dos arquivos, retenção por tipo de dado, teste de restauração e roteiro de incidente.',
        actions: ui.btn({ label: 'Pedir restauração', icon: 'refresh', sheet: 'core-restauracao' }) + ui.btn({ label: 'Fazer backup agora', variant: 'primary', icon: 'database', acao: 'gerar', loading: 'Copiando…', toast: 'Backup manual concluído', toastText: 'Banco copiado (412 MB). Os arquivos seguem na cópia da madrugada.' }) }) +
        ui.kpis([
          { label: 'Último backup do banco', value: 'Hoje, 03:00', icon: 'database', foot: ui.chip('Concluído', 'green', { dot: true }) + ' 412 MB · todo dia às 03:00' },
          { label: 'Cópia dos arquivos', value: 'Hoje, 03:40', icon: 'folder', foot: ui.chip('Concluída', 'green', { dot: true }) + ' 18,6 GB · documentos e vídeos' },
          { label: 'Ponto no tempo', value: '7', unit: 'dias', icon: 'history', foot: 'volta o banco a qualquer minuto · a confirmar (Q18)' },
          { label: 'Teste de restauração', value: '03/11/2026', icon: 'shield-check', foot: ui.chip('Aprovado', 'green', { dot: true }) + ' em 42 min · próximo 03/12' }
        ]) +
        '<div class="lt-g12 lt-mt-6"><div class="lt-c8 lt-stack">' +
        ui.card({ title: 'Histórico de cópias', icon: 'history', sub: 'Banco às 03:00 e arquivos às 03:40, todos os dias. Falha gera nova tentativa e aviso à sócia.', flush: true, body: hist }) +
        ui.card({ title: 'Roteiro de incidente', icon: 'alert-triangle', sub: 'O que fazer se houver vazamento, perda ou acesso indevido', body: roteiro }) + '</div>' +
        '<div class="lt-c4 lt-stack">' +
        ui.card({ title: 'Retenção por tipo de dado', icon: 'clock', body: retencao, foot: ui.btn({ label: 'Editar retenção', size: 'sm', icon: 'edit', acao: 'salvar', toast: 'Retenção salva', toastText: 'Vale para as próximas cópias. A mudança ficou na auditoria.' }) }) +
        ui.card({ title: 'Último teste de restauração', icon: 'shield-check', sub: '03/11/2026 · Felipe Moretti e suporte', body: teste, foot: ui.btn({ label: 'Agendar teste', size: 'sm', icon: 'calendar', acao: 'agendar', toast: 'Teste agendado', toastText: '03/12/2026, 19:00, fora do horário de uso.' }) }) +
        ui.callout({ tone: 'info', icon: 'help', title: 'Pergunta em aberto (Q18)', text: 'Por quantos dias a Atlas quer voltar o banco a um ponto no tempo? 7 dias é o padrão proposto.' }) +
        '</div></div>';
      return cfgLayout('cfg-backup', inner);
    }
  });
  ui.registerSheet('core-restauracao', () => ({
    title: 'Pedir restauração ao suporte', sub: 'O suporte confirma por telefone com a sócia antes de restaurar.',
    body: '<div class="lt-sections">' +
      ui.section({ title: 'O que restaurar', tone: 'gold', icon: 'database', body: '<div class="lt-stack">' + ui.field({ type: 'radio', value: 'registro', options: [{ value: 'registro', label: 'Um registro apagado ou alterado', hint: 'Ex.: um negócio, um processo, um lançamento' }, { value: 'arquivos', label: 'Arquivos (documentos ou vídeos)' }, { value: 'banco', label: 'O banco inteiro', hint: 'Desfaz tudo o que foi feito depois do ponto escolhido' }] }) + ui.field({ label: 'Qual registro', placeholder: 'Ex.: Negócio #1015 · BG Farma' }) + '</div>' }) +
      ui.section({ title: 'Ponto de restauração', tone: 'amber', icon: 'history', cols: 2, body: ui.field({ label: 'Data', type: 'date', required: true, value: '2026-11-08' }) + ui.field({ label: 'Horário', type: 'time', value: '18:00', hint: 'Até 7 dias atrás' }) }) +
      ui.section({ title: 'Motivo', tone: 'slate', icon: 'file-text', body: ui.field({ type: 'textarea', required: true, placeholder: 'O que aconteceu e desde quando' }) }) +
      ui.callout({ tone: 'warning', text: 'Restaurar o banco inteiro desfaz o que a equipe fez depois do ponto escolhido. Prefira restaurar só o registro.' }) + '</div>',
    foot: ui.sheetFoot({ label: 'Enviar pedido ao suporte', toast: 'Pedido enviado ao suporte', toastText: 'Protocolo SUP-2026-0142 · resposta em até 4 horas úteis.', loading: 'Enviando…' })
  }));

  /* ================================================================== */
  /* FLUXOS                                                              */
  /* ================================================================== */
  function fluxosTabs(active) {
    const t = [['fluxos', 'Automações', 'workflow'], ['fluxos-diagrama', 'Diagrama', 'git-branch'], ['fluxos-execucao', 'Execuções', 'play-circle'], ['fluxos-proximos', 'Próximos disparos', 'clock'], ['fluxos-parametros', 'Parâmetros', 'sliders']];
    return '<div class="lt-tabs" role="navigation" aria-label="Seções do painel Fluxos">' + t.map((x) => '<a class="lt-tab' + (x[0] === active ? ' is-active' : '') + '" href="#' + x[0] + '">' + I(x[2]) + x[1] + '</a>').join('') + '</div>';
  }
  function fluxosHeader(active, extra) {
    return ui.pageHeader({ breadcrumb: [{ label: 'Configurações', hash: 'cfg-usuarios' }, { label: 'Fluxos e automações' }], title: 'Fluxos e automações', sub: 'Cada automação em blocos: gatilho → condição → ações. Veja o que rodou, por que não rodou e ajuste os prazos.', actions: extra || '' }) + fluxosTabs(active);
  }
  const modTone = { crm: 'blue', juridico: 'red', financeiro: 'green', core: 'gold', intranet: 'violet' };
  const modChip = (m) => ui.chip(App.moduleNames[m] || m, modTone[m] || 'gray');
  const estadoChip = (e) => e === 'rodou' ? ui.chip('Rodou', 'green', { icon: 'check-circle' }) : e === 'falhou' ? ui.chip('Falhou', 'red', { icon: 'x-circle' }) : ui.chip('Não rodou', 'gray', { icon: 'minus-circle' });

  /* FLX-01 */
  App.screen({
    id: 'core.flows.list', hash: 'fluxos', module: 'core', title: 'Fluxos e automações', nav: true, navGroup: 'config', navOrder: 6, navLabel: 'Fluxos e automações',
    render: () => {
      const lig = D.fluxos.filter((f) => f.ligado).length, ex = util.soma(D.fluxos, (f) => f.exec7d), fal = util.soma(D.fluxos, (f) => f.falhas7d), nr = util.soma(D.fluxos, (f) => f.naoRodou7d);
      const tabela = ui.table({
        rows: D.fluxos, rowHref: (f) => '#fluxos-diagrama-' + f.id, rowClass: (f) => 'mod-' + f.modulo + (f.ligado ? '' : ' is-muted'),
        columns: [
          { label: 'Código', key: 'codigo', sortable: true, render: (f) => '<span class="lt-code">' + esc(f.codigo) + '</span>' },
          { label: 'Automação', key: 'nome', sortable: true, render: (f) => '<span class="lt-table__primary">' + esc(f.nome) + '</span><span class="lt-table__secondary">' + I('zap') + ' ' + esc(f.gatilhoTxt) + ' → ' + esc(f.acaoTxt) + '</span>' },
          { label: 'Módulo', key: 'modulo', sortable: true, render: (f) => modChip(f.modulo) },
          { label: 'Ligada', key: 'ligado', render: (f) => '<label class="lt-toggle lt-toggle--sm" title="Ligar ou desligar"><input type="checkbox" data-flx-toggle="' + f.id + '"' + (f.ligado ? ' checked' : '') + '><span class="lt-toggle__track"></span></label>' },
          { label: 'Última execução', key: 'ultimaExec', sortable: true, render: (f) => f.ultimaExec ? '<span class="lt-num">' + esc(fmt.quando(f.ultimaExec)) + '</span>' : '<span class="lt-muted">Nunca</span>' },
          { label: '7 dias', title: 'Rodaram · não rodaram · falhas, nos últimos 7 dias', key: 'exec7d', sortable: true, align: 'right', render: (f) => '<span class="lt-row lt-row--nowrap" style="justify-content:flex-end;gap:4px" title="' + f.exec7d + ' rodaram · ' + f.naoRodou7d + ' não rodaram · ' + f.falhas7d + ' falhas">' + ui.chip(String(f.exec7d), 'green', { title: 'Rodaram' }) + ui.chip(String(f.naoRodou7d), 'gray', { title: 'Não rodaram (condição)' }) + (f.falhas7d ? ui.chip(String(f.falhas7d), 'red', { title: 'Falhas' }) : '') + '</span>' }
        ],
        rowActions: (f) => '<a class="lt-btn lt-btn--ghost lt-btn--xs" href="#fluxos-diagrama-' + f.id + '">' + I('git-branch') + '<span>Diagrama</span></a>' + (f.params.length ? '<a class="lt-btn lt-btn--ghost lt-btn--xs" href="#fluxos-parametros-' + f.id + '">' + I('sliders') + '<span>Parâmetros</span></a>' : '')
      });
      const legenda7d = '<span class="lt-row lt-row--nowrap lt-small lt-muted" style="gap:6px">Últimos 7 dias:' + ui.chip('rodaram', 'green') + ui.chip('não rodaram', 'gray') + ui.chip('falhas', 'red') + '</span>';
      return fluxosHeader('fluxos', ui.chip('Montar automação pela tela · em breve', 'gray', { icon: 'clock', lg: true, title: 'Criar automações novas pela tela fica para a Fase 2. Hoje a Atlas vê, ajusta parâmetros e liga ou desliga.' })) +
        ui.kpis([{ label: 'Automações ligadas', value: lig + '/' + D.fluxos.length, icon: 'power' }, { label: 'Rodaram (7 dias)', value: fmt.num(ex), icon: 'check-circle' }, { label: 'Não rodaram (condição)', value: fmt.num(nr), icon: 'minus-circle', foot: 'veja o porquê em Execuções' }, { label: 'Falhas (7 dias)', value: fmt.num(fal), icon: 'x-circle', foot: fal ? '<a href="#fluxos-execucao-9104">1 com nova tentativa programada</a>' : 'nenhuma' }]) +
        '<div class="lt-mt-6"></div>' + ui.filters({ busca: 'Buscar automação', extra: legenda7d, chipGroup: 'single', chips: [{ label: 'Todas', value: 'todas', active: true, count: D.fluxos.length }, { label: 'CRM', value: 'crm', tone: 'blue', count: D.fluxos.filter((f) => f.modulo === 'crm').length }, { label: 'Jurídico', value: 'juridico', tone: 'red', count: D.fluxos.filter((f) => f.modulo === 'juridico').length }, { label: 'Financeiro', value: 'financeiro', tone: 'green', count: D.fluxos.filter((f) => f.modulo === 'financeiro').length }, { label: 'Núcleo', value: 'core', tone: 'gold', count: D.fluxos.filter((f) => f.modulo === 'core').length }] }) + tabela;
    },
    mount: (root) => {
      root.addEventListener('lt:filter', (e) => { const v = e.detail.value; root.querySelectorAll('tbody tr').forEach((tr) => { tr.hidden = !(v === 'todas' || tr.classList.contains('mod-' + v)); }); });
      root.addEventListener('change', (e) => {
        const t = e.target.closest('[data-flx-toggle]'); if (!t) return;
        const f = fluxo(t.getAttribute('data-flx-toggle')); f.ligado = t.checked; t.closest('tr').classList.toggle('is-muted', !t.checked);
        ui.toast(f.codigo + (t.checked ? ' ligada' : ' desligada'), t.checked ? 'success' : 'warning', t.checked ? 'Volta a rodar nos próximos gatilhos.' : 'Disparos agendados foram pausados. A mudança ficou na auditoria.');
      });
    }
  });

  /* FLX-02 diagrama */
  const blocoInfo = {
    trigger: 'Ponto de partida. Nada roda sem o gatilho.', condition: 'Só deixa passar quando a condição é verdadeira. Se for falsa, a execução para aqui e aparece como "não rodou".',
    action: 'Grava ou altera dados no sistema.', notify: 'Envia aviso no sistema e, se configurado, por e-mail (sem conteúdo sensível).', task: 'Cria uma tarefa com responsável e prazo.', wait: 'Agenda um disparo para depois (aparece em Próximos disparos).'
  };
  function blocoPainel(f, b) {
    const cat = App.flowCats[b.cat];
    const prompt = 'Altere o passo "' + b.titulo + '" (id ' + b.id + ') da automação ' + f.codigo + ' · ' + f.nome + ' (versão ' + f.versao + ').\nArquivo: ' + f.arquivo + '\nMudança desejada: <descreva aqui>\nMantenha a idempotência e atualize o teste do fluxo.';
    return ui.card({ title: 'Bloco selecionado', icon: cat.icon, body: '<div class="lt-stack">' +
      '<div><div class="lt-row">' + ui.chip(cat.label, b.cat === 'condition' ? 'amber' : b.cat === 'trigger' ? 'gold' : b.cat === 'task' ? 'green' : b.cat === 'notify' ? 'violet' : b.cat === 'wait' ? 'slate' : 'blue') + (b.off ? ui.chip('Desligado', 'gray') : '') + '</div><div class="lt-strong lt-mt-2" style="font-size:15px">' + esc(b.titulo) + '</div>' + (b.detalhe ? '<div class="lt-small lt-text-2">' + esc(b.detalhe) + '</div>' : '') + '</div>' +
      (b.quando ? ui.callout({ tone: 'warning', icon: 'filter', title: 'Somente quando', text: esc(b.quando) }) : '') +
      '<p class="lt-small lt-text-2">' + blocoInfo[b.cat] + '</p>' +
      ui.dl([['Entradas', b.cat === 'trigger' ? 'evento do sistema' : 'registro do gatilho'], ['Saídas', b.cat === 'task' ? 'tarefa criada (link)' : b.cat === 'notify' ? 'notificações enviadas' : b.cat === 'condition' ? 'verdadeiro / falso' : 'registro atualizado'], ['Novas tentativas', b.cat === 'notify' ? '3 · 1 min, 2 h, 4 h' : b.cat === 'condition' ? '—' : '3 · 1 min, 10 min, 1 h'], ['Arquivo', '<span class="lt-code">' + esc(f.arquivo.split('/').pop()) + '</span>']]) +
      ui.btn({ label: 'Copiar prompt de alteração', icon: 'copy', block: true, attrs: { 'data-copy': prompt, 'data-copy-label': 'Prompt copiado' } }) + '</div>' });
  }
  App.screen({
    id: 'core.flows.diagram', hash: 'fluxos-diagrama', module: 'core', title: 'Diagrama da automação', navGroup: 'config', navParent: 'fluxos', exemplo: 1,
    render: (params) => {
      const f = fluxo(params.id || 1) || D.fluxos[0];
      const selId = (f.blocos.find((b) => b.quando) || f.blocos[0]).id;
      const execs = D.fluxoExecucoes.filter((x) => x.fluxoId === f.id);
      const seletor = '<select class="lt-select" data-flx-sel style="width:auto;min-width:320px;height:34px" aria-label="Escolher automação">' + D.fluxos.map((x) => '<option value="' + x.id + '"' + (x.id === f.id ? ' selected' : '') + '>' + esc(x.codigo + ' · ' + x.nome) + '</option>').join('') + '</select>';
      const legenda = '<div class="lt-flow-legend">' + Object.keys(App.flowCats).map((k) => '<span><i style="background:var(--flow-' + k + ')"></i>' + App.flowCats[k].label + '</span>').join('') + '<span><i style="border:1.5px dashed var(--border-strong);background:transparent"></i>Passo desligado</span></div>';
      const arvore = '<ul class="lt-flow-tree">' + f.blocos.map((b, i) => '<li class="' + (i === 0 ? 'is-root' : b.col > 3 ? 'is-nested' : '') + '"><span class="lt-flow-tree__sw" style="background:var(--flow-' + b.cat + ')"></span><span class="lt-muted lt-num">' + (i + 1) + '.</span> ' + esc(b.titulo) + (b.quando ? ' <span class="lt-small lt-warning">· somente quando ' + esc(b.quando) + '</span>' : '') + (b.off ? ' ' + ui.chip('desligado', 'gray') : '') + '</li>').join('') + '</ul>';
      return fluxosHeader('fluxos-diagrama', '<a class="lt-btn" href="#fluxos-parametros-' + f.id + '">' + I('sliders') + '<span>Parâmetros</span></a>') +
        '<div class="lt-row lt-row--between lt-mb-4"><div class="lt-row">' + seletor + ui.chip(f.codigo, 'violet') + modChip(f.modulo) + (f.ligado ? ui.chip('Ligada', 'green', { dot: true }) : ui.chip('Desligada', 'gray', { dot: true })) + '<span class="lt-small lt-muted">versão ' + f.versao + ' · ' + esc(f.tipo) + '</span></div>' + legenda + '</div>' +
        ui.flow(f, { selected: selId }) +
        '<div class="lt-g12 lt-mt-4"><div class="lt-c5" data-bloco-painel>' + blocoPainel(f, f.blocos.find((b) => b.id === selId)) + '</div>' +
        '<div class="lt-c4">' + ui.card({ title: 'Passo a passo (texto)', icon: 'list', body: arvore }) + '</div>' +
        '<div class="lt-c3">' + ui.card({ title: 'Execuções recentes', icon: 'play-circle', flush: true, body: ui.list(execs.map((x) => ({ icon: x.estado === 'rodou' ? 'check-circle' : x.estado === 'falhou' ? 'x-circle' : 'minus-circle', tone: x.estado === 'rodou' ? 'green' : x.estado === 'falhou' ? 'red' : '', title: esc(x.registro.label), meta: esc(fmt.quando(x.quando)) + ' · ' + esc(x.duracao), href: '#fluxos-execucao-' + x.id })), { empty: { icon: 'play-circle', title: 'Sem execuções recentes' } }) }) + '</div></div>';
    },
    mount: (root, params) => {
      const f = fluxo(params.id || 1) || D.fluxos[0];
      root.querySelector('[data-flx-sel]').addEventListener('change', (e) => App.go('fluxos-diagrama-' + e.target.value));
      root.addEventListener('click', (e) => {
        const n = e.target.closest('.lt-flow__node'); if (!n) return;
        root.querySelectorAll('.lt-flow__node.is-selected').forEach((x) => x.classList.remove('is-selected')); n.classList.add('is-selected');
        root.querySelector('[data-bloco-painel]').innerHTML = blocoPainel(f, f.blocos.find((b) => b.id === n.getAttribute('data-node')));
      });
    }
  });

  /* FLX-03 execução */
  App.screen({
    id: 'core.flows.run', hash: 'fluxos-execucao', module: 'core', title: 'Execução passo a passo', navGroup: 'config', navParent: 'fluxos', exemplo: 9102,
    render: (params) => {
      const run = D.fluxoExecucoes.find((x) => x.id === params.id) || D.fluxoExecucoes[1], f = fluxo(run.fluxoId);
      const lista = '<div class="lt-card" style="padding:6px"><div class="lt-subnav__title" style="padding:8px 10px">Execuções recentes</div>' + D.fluxoExecucoes.slice().sort((a, b) => b.quando.localeCompare(a.quando)).map((x) => { const fx = fluxo(x.fluxoId); return '<a href="#fluxos-execucao-' + x.id + '" class="lt-list__item' + (x.id === run.id ? ' is-unread' : '') + '" style="padding:9px 10px;border-radius:var(--r-sm);border-bottom:0"><span class="lt-list__icon" data-tone="' + (x.estado === 'rodou' ? 'green' : x.estado === 'falhou' ? 'red' : '') + '">' + I(x.estado === 'rodou' ? 'check-circle' : x.estado === 'falhou' ? 'x-circle' : 'minus-circle') + '</span><div class="lt-list__body"><div class="lt-list__title lt-truncate" style="font-size:13px">' + esc(fx.codigo + ' · ' + fx.nome) + '</div><div class="lt-list__meta lt-truncate">' + esc(fmt.quando(x.quando)) + ' · ' + esc(x.registro.label) + '</div></div></a>'; }).join('') + '</div>';
      let aviso;
      if (run.estado === 'nao_rodou') aviso = ui.callout({ tone: 'warning', icon: 'help', title: 'Por que não rodou', text: esc(run.porque) });
      else if (run.estado === 'falhou') aviso = ui.callout({ tone: 'danger', title: 'Falhou no passo ' + (f.blocos.findIndex((b) => run.passos[b.id] && run.passos[b.id].estado === 'fail') + 1), text: esc(run.erro), actions: ui.btn({ label: 'Tentar de novo agora', size: 'sm', variant: 'danger', icon: 'refresh', acao: 'executar', toast: 'Nova tentativa enviada', toastText: 'Acompanhe o resultado nesta tela.' }) });
      else aviso = ui.callout({ tone: 'success', title: 'Rodou do começo ao fim', text: (run.saidas || []).map((s) => '<a href="#' + esc(s.hash) + '">' + esc(s.label) + ' →</a>').join(' · ') });
      const trilha = run.trilha && run.trilha.length ? '<table class="lt-trail"><thead><tr><th>Bloco</th><th>Condição ("somente quando")</th><th>Esperado</th><th>Real</th><th>Resultado</th></tr></thead><tbody>' + run.trilha.map((t) => { const bi = f.blocos.findIndex((b) => b.id === t.bloco); return '<tr class="' + (t.ok ? 'is-ok' : 'is-fail') + '"><td class="lt-num">' + (bi + 1) + '</td><td>' + esc(t.cond) + '</td><td>' + esc(t.esperado) + '</td><td class="lt-strong">' + esc(t.real) + '</td><td>' + (t.ok ? 'Passou' : 'Barrou') + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="lt-small lt-muted">Esta automação não tem condições.</p>';
      const pessoa = run.por ? ui.person(run.por) : ui.chip('Agendador do sistema', 'gold', { icon: 'clock' });
      return fluxosHeader('fluxos-execucao') +
        '<div class="lt-split lt-split--left" style="grid-template-columns:300px minmax(0,1fr)">' + lista + '<div class="lt-stack" style="min-width:0">' +
        '<div class="lt-row lt-row--between"><div><div class="lt-row">' + estadoChip(run.estado) + ui.chip(f.codigo, 'violet') + '<span class="lt-strong" style="font-size:16px">' + esc(f.nome) + '</span></div><div class="lt-small lt-muted lt-mt-2">Execução #' + run.id + ' · ' + fmt.dataHora(run.quando) + ' · ' + esc(run.duracao) + (run.tentativa ? ' · tentativa ' + run.tentativa + ' de 3' : '') + '</div></div><a class="lt-btn lt-btn--sm" href="#fluxos-diagrama-' + f.id + '">' + I('git-branch') + '<span>Abrir diagrama</span></a></div>' +
        ui.summary([{ label: 'Registro', value: '<a href="#' + esc(run.registro.hash) + '">' + esc(run.registro.label) + '</a>' }, { label: 'Disparado por', value: pessoa }, { label: 'Blocos', value: Object.keys(run.passos).filter((k) => run.passos[k].estado === 'ok').length + ' de ' + f.blocos.length + ' rodaram' }]) + aviso +
        ui.flow(f, { run }) +
        '<div class="lt-flow-legend"><span><i style="background:var(--success)"></i>Rodou</span><span><i style="background:var(--warning)"></i>Condição não atendida (parou aqui)</span><span><i style="border:1.5px dashed var(--border-strong)"></i>Não rodou</span><span><i style="background:var(--danger)"></i>Falhou (erro)</span></div>' +
        ui.card({ title: 'Trilha das condições · esperado × real', icon: 'filter', body: trilha }) + '</div></div>';
    }
  });

  /* FLX-04 parâmetros */
  App.screen({
    id: 'core.flows.params', hash: 'fluxos-parametros', module: 'core', title: 'Parâmetros e liga/desliga', navGroup: 'config', navParent: 'fluxos', exemplo: 4,
    render: (params) => {
      const f = fluxo(params.id || 4) || D.fluxos[3];
      const nav = '<div class="lt-card" style="padding:8px"><nav class="lt-subnav" style="position:static">' + D.fluxos.map((x) => '<a href="#fluxos-parametros-' + x.id + '" class="' + (x.id === f.id ? 'is-active' : '') + '"><span class="lt-code" style="font-size:10.5px">' + esc(x.codigo) + '</span><span class="lt-truncate" style="flex:1">' + esc(x.nome) + '</span>' + (x.ligado ? '' : '<span class="lt-dot" style="background:var(--text-faint)" title="Desligada"></span>') + '</a>').join('') + '</nav></div>';
      const campos = f.params.length ? f.params.map((p) => p.tipo === 'toggle' ? ui.field({ type: 'toggle', label: p.label, checked: p.valor, span: 2 }) : /:/.test(String(p.valor)) ? ui.field({ label: p.label, type: 'time', value: p.valor }) : ui.field({ label: p.label, type: 'number', value: p.valor, suffix: p.unidade, hint: 'Padrão do módulo: ' + p.valor })).join('') : '<p class="lt-small lt-muted lt-span-full">Esta automação não tem parâmetros ajustáveis.</p>';
      const passos = f.blocos.filter((b) => b.cat !== 'trigger').map((b) => '<div class="lt-row lt-row--between" style="padding:8px 0;border-bottom:1px solid var(--divider)"><span class="lt-row"><span class="lt-flow-tree__sw" style="background:var(--flow-' + b.cat + ')"></span><span>' + esc(b.titulo) + '</span>' + (b.quando ? '<span class="lt-small lt-muted">· somente quando ' + esc(b.quando) + '</span>' : '') + '</span><label class="lt-toggle lt-toggle--sm"><input type="checkbox"' + (b.off ? '' : ' checked') + (b.cat === 'condition' ? ' disabled title="Condições não podem ser desligadas"' : '') + '><span class="lt-toggle__track"></span></label></div>').join('');
      const hist = D.auditoria.filter((a) => a.entidade === 'Automação').map((a) => ({ icon: 'sliders', tone: 'amber', title: esc(a.campo + ': ' + a.antes + ' → ' + a.depois), meta: esc((db.pessoa(a.pessoaId) || {}).nome || 'Sistema') + ' · ' + esc(fmt.quando(a.quando)) }));
      hist.push({ icon: 'power', tone: 'green', title: 'Automação ligada', meta: 'Mariana Duarte · 12/10 10:02' }, { icon: 'git-branch', tone: 'slate', title: 'Versão ' + f.versao + ' publicada', meta: 'Lucas (Intencionare) · 08/10 18:40' });
      return fluxosHeader('fluxos-parametros') +
        '<div class="lt-split lt-split--left" style="grid-template-columns:280px minmax(0,1fr)">' + nav + '<div class="lt-sections" style="min-width:0">' +
        '<div class="lt-row lt-row--between"><div class="lt-row">' + ui.chip(f.codigo, 'violet') + '<span class="lt-strong" style="font-size:16px">' + esc(f.nome) + '</span>' + modChip(f.modulo) + '</div><a class="lt-btn lt-btn--sm" href="#fluxos-diagrama-' + f.id + '">' + I('git-branch') + '<span>Ver diagrama</span></a></div>' +
        ui.section({ title: 'Ligada', tone: 'gold', icon: 'power', sub: 'Desligar pausa os próximos disparos desta automação', aside: '<label class="lt-toggle"><input type="checkbox"' + (f.ligado ? ' checked' : '') + '><span class="lt-toggle__track"></span><span class="lt-small">' + (f.ligado ? 'Ligada' : 'Desligada') + '</span></label>', body: '<p class="lt-small lt-text-2">' + I('zap') + ' ' + esc(f.gatilhoTxt) + ' → ' + esc(f.acaoTxt) + '</p>' }) +
        ui.section({ title: 'Parâmetros (nível 1)', tone: 'amber', icon: 'sliders', sub: 'Os valores [X] da proposta, ajustáveis pela Atlas', cols: 2, body: campos }) +
        ui.section({ title: 'Passos (nível 2)', tone: 'violet', icon: 'git-branch', sub: 'Ligue ou desligue cada ação sem mexer no código', body: passos }) +
        ui.section({ title: 'Histórico de alterações', tone: 'slate', icon: 'history', body: ui.timeline(hist) }) +
        ui.callout({ tone: 'info', text: 'Montar automações novas pela tela (nível 3) fica para a Fase 2, sobre o mesmo formato.' }) +
        '<div class="lt-form-actions lt-form-actions--inline"><span class="lt-form-actions__info">A alteração vale a partir do próximo gatilho e fica na auditoria.</span>' + ui.btn({ label: 'Descartar' }) + ui.btn({ label: 'Salvar parâmetros', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Parâmetros salvos', toastText: esc(f.codigo + ' · ' + f.nome) }) + '</div></div></div>';
    }
  });

  /* Próximos disparos: calculados pelas regras ligadas (fonte única)
     CRM → App.data.crm.disparos() · Jurídico → App.data.juridico.disparos({ futuros: true }) · Financeiro → D.disparos (rotinas) */
  function proximosDisparos() {
    const agora = util.isoHora(App.HOJE), lim = util.iso(util.addDias(App.HOJE, 30)) + 'T23:59';
    const nomes = (ids) => (ids || []).map((i) => (db.pessoa(i) || {}).nome).filter(Boolean).join(' + ');
    const C = D.crm || {}, J = D.juridico || {}, procs = J.todosProcessos ? J.todosProcessos() : D.processos;
    const crm = (C.disparos ? C.disparos() : []).map((x) => ({ fluxoId: x.fluxoId, quando: x.quando, registro: x.registro, para: x.para, motivo: x.motivo }));
    const jur = (J.disparos ? J.disparos({ futuros: true }) : []).map((x) => {
      const f = D.fluxos.find((k) => k.codigo === x.cod) || {}, pr = procs.find((k) => k.id === x.prazo.processoId) || {}, e = db.empresa(pr.empresaId);
      return { fluxoId: f.id, quando: x.quando, registro: { label: 'Prazo ' + x.prazo.id + ' · ' + x.prazo.tipo + (e ? ' (' + e.fantasia + ')' : ''), hash: 'jur-processo-' + x.prazo.processoId }, para: nomes(x.para), motivo: x.txt };
    });
    return crm.concat(jur, D.disparos || []).filter((d) => d.quando > agora && d.quando <= lim && fluxo(d.fluxoId) && fluxo(d.fluxoId).ligado)
      .sort((a, b) => a.quando.localeCompare(b.quando)).map((d, i) => Object.assign({ id: d.id || 9600 + i }, d));
  }
  App.screen({
    id: 'core.flows.scheduled', hash: 'fluxos-proximos', module: 'core', title: 'Próximos disparos', navGroup: 'config', navParent: 'fluxos',
    render: () => {
      const rows = proximosDisparos();
      const hoje = rows.filter((d) => ehHoje(d.quando)).length, amanha = rows.filter((d) => util.diasEntre(App.HOJE, d.quando) === 1).length;
      return fluxosHeader('fluxos-proximos') +
        ui.kpis([{ label: 'Hoje', value: String(hoje), icon: 'clock', foot: 'disparos programados' }, { label: 'Amanhã', value: String(amanha), icon: 'calendar' }, { label: 'Próximos 30 dias', value: String(rows.length), icon: 'calendar-clock' }]) + '<div class="lt-mt-6"></div>' +
        ui.table({
          rows, pageSize: 15, rowClass: (d) => 'mod-' + fluxo(d.fluxoId).modulo,
          columns: [
            { label: 'Quando', key: 'quando', sortable: true, sorted: 'asc', render: (d) => '<span class="lt-num lt-strong">' + fmt.dataHora(d.quando) + '</span><span class="lt-table__secondary">' + fmt.relativo(d.quando) + '</span>' },
            { label: 'Automação', key: 'fluxoId', sortable: true, value: (d) => fluxo(d.fluxoId).codigo, render: (d) => { const f = fluxo(d.fluxoId); return '<span class="lt-code">' + esc(f.codigo) + '</span> ' + esc(f.nome); } },
            { label: 'Registro', key: 'registro', sortable: true, value: (d) => d.registro.label, render: (d) => '<a href="#' + esc(d.registro.hash) + '">' + esc(d.registro.label) + '</a>' },
            { label: 'Para', key: 'para' },
            { label: 'Motivo', key: 'motivo', render: (d) => '<span class="lt-text-2">' + esc(d.motivo) + '</span>' }
          ],
          rowActions: () => ui.btn({ icon: 'play', variant: 'ghost', size: 'xs', tip: 'Executar agora', acao: 'executar', toast: 'Disparo executado agora' }) + ui.btn({ icon: 'x', variant: 'ghost', size: 'xs', tip: 'Cancelar disparo', confirm: 'Cancelar este disparo?', confirmText: 'O aviso não será enviado. A automação continua ligada para os próximos casos.', confirmLabel: 'Cancelar disparo', acao: 'excluir', toast: 'Disparo cancelado' })
        }) + '<div class="lt-mt-4">' + ui.callout({ tone: 'info', icon: 'shield', text: 'Calculados pelas regras ligadas: CRM (etapa parada, sem próxima tarefa, lembretes de reunião), Jurídico (AUT-12, AUT-13 e AUT-14 pelo calendário) e rotinas do Financeiro. Cada disparo roda uma única vez (idempotência): se o servidor reiniciar, o aviso não é duplicado. Horários no fuso de São Paulo.' }) + '</div>';
    }
  });

  /* ================================================================== */
  /* CORE-00 · CATÁLOGO DE COMPONENTES                                   */
  /* ================================================================== */
  const demoSection = (n, id, title, body, sub) => '<section class="lt-card" id="cat-' + id + '" style="scroll-margin-top:72px"><header class="lt-card__head"><div><h2 class="lt-card__title"><span class="lt-muted lt-num" style="font-family:var(--ff-sans);font-size:13px">' + n + '</span> ' + esc(title) + '</h2>' + (sub ? '<div class="lt-card__sub">' + sub + '</div>' : '') + '</div><span class="lt-code">' + id + '</span></header><div class="lt-card__body">' + body + '</div></section>';
  const lbl = (t) => '<div class="lt-demo-label">' + t + '</div>';
  App.screen({
    id: 'core.ui.catalog', hash: 'componentes', module: 'core', title: 'CORE-00 · Catálogo de componentes',
    render: () => {
      const tones = ['gold', 'blue', 'green', 'amber', 'violet', 'slate', 'red', 'gray'];
      const swatch = (name, v) => '<div class="lt-swatch-card"><div class="lt-swatch-card__color" style="background:var(' + v + ')"></div><div class="lt-swatch-card__body"><b>' + name + '</b><code>' + v + '</code></div></div>';
      const S = [];
      S.push(demoSection('01', 'tokens', 'Cores e tokens', lbl('Marca') + '<div class="lt-swatches">' + swatch('Dourado', '--gold') + swatch('Dourado hover', '--gold-hover') + swatch('Dourado texto', '--gold-text') + swatch('Dourado sutil', '--gold-subtle') + swatch('Texto sobre dourado', '--on-gold') + '</div>' +
        lbl('Superfícies e texto') + '<div class="lt-swatches">' + swatch('Fundo', '--bg') + swatch('Superfície', '--surface') + swatch('Superfície 2', '--surface-2') + swatch('Superfície 3', '--surface-3') + swatch('Borda', '--border') + swatch('Texto', '--text') + swatch('Texto 2', '--text-2') + swatch('Texto apagado', '--text-muted') + '</div>' +
        lbl('Semânticas') + '<div class="lt-swatches">' + ['success', 'warning', 'danger', 'info'].map((k) => swatch(k, '--' + k) + swatch(k + ' texto', '--' + k + '-text') + swatch(k + ' sutil', '--' + k + '-subtle')).join('') + '</div>' +
        lbl('Tons dos cards e chips (subtle · strong)') + '<div class="lt-swatches">' + tones.map((t) => '<div class="lt-swatch-card"><div class="lt-swatch-card__color" style="background:var(--tone-' + t + '-subtle);color:var(--tone-' + t + '-strong);border-left:4px solid var(--tone-' + t + '-solid)">' + t + '</div><div class="lt-swatch-card__body"><code>--tone-' + t + '-*</code></div></div>').join('') + '</div>', 'Contraste calculado no topo de <span class="lt-code">assets/tokens.css</span>. Troque o tema no topo para conferir os dois.'));
      S.push(demoSection('02', 'tipografia', 'Tipografia', '<div class="lt-stack"><div><span class="lt-label-caps">Título da página · Source Serif 4 26/600</span><div class="lt-page-title">Funil comercial</div></div><div><span class="lt-label-caps">Título de card · Serif 16,5/600</span><div class="lt-card__title">Prazos jurídicos</div></div><div><span class="lt-label-caps">Título de seção · Inter 14/600</span><div class="lt-section__title">Identificação da empresa</div></div><div><span class="lt-label-caps">Corpo · Inter 14/400</span><p>Prazo interno em 19/11/2026, um dia útil antes do fatal.</p></div><div><span class="lt-label-caps">Dica · 12/400</span><p class="lt-hint">Campos com * são obrigatórios.</p></div><div><span class="lt-eyebrow">Rótulo dourado · caixa alta 11/600 · espaçamento .14em</span></div><div><span class="lt-label-caps">Número de KPI · Serif tabular</span><div class="lt-kpi__value">R$ 1.245.380,00</div></div></div>'));
      S.push(demoSection('03', 'botoes', 'Botões', lbl('Variantes') + '<div class="lt-demo-row">' + ['primary', 'secondary', 'outline', 'default', 'ghost', 'danger', 'danger-outline', 'add'].map((v) => ui.btn({ label: { primary: 'Salvar negócio', secondary: 'Gerar relatório', outline: 'Mover etapa', default: 'Cancelar', ghost: 'Ver todos', danger: 'Excluir', 'danger-outline': 'Desativar', add: 'Adicionar item' }[v], variant: v, icon: v === 'add' ? 'plus' : v === 'primary' ? 'check' : null })).join('') + '</div>' +
        lbl('Tamanhos') + '<div class="lt-demo-row">' + ui.btn({ label: 'Extra pequeno', size: 'xs', variant: 'primary' }) + ui.btn({ label: 'Pequeno', size: 'sm', variant: 'primary' }) + ui.btn({ label: 'Padrão', variant: 'primary' }) + ui.btn({ label: 'Grande', size: 'lg', variant: 'primary' }) + ui.btn({ icon: 'edit', tip: 'Só ícone' }) + ui.btn({ icon: 'trash', variant: 'ghost', tip: 'Só ícone fantasma' }) + '</div>' +
        lbl('Estados') + '<div class="lt-demo-row"><button type="button" class="lt-btn lt-btn--primary is-loading" aria-busy="true" disabled><span class="lt-btn__spinner"></span><span>Salvando…</span></button><button type="button" class="lt-btn lt-btn--default is-loading" aria-busy="true" disabled><span class="lt-btn__spinner"></span><span>Gerando…</span></button>' + ui.btn({ label: 'Desabilitado', variant: 'primary', disabled: true }) + ui.btn({ label: 'Desabilitado', disabled: true }) + '</div>' +
        lbl('Clique para testar o spinner (~1,2 s) e o toast') + '<div class="lt-demo-row">' + ui.btn({ label: 'Salvar negócio', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Negócio salvo' }) + ui.btn({ label: 'Gerar boleto', icon: 'receipt', acao: 'gerar', toast: 'Boleto gerado', toastText: 'Enviado ao cliente por e-mail.' }) + ui.btn({ label: 'Excluir registro', variant: 'danger-outline', icon: 'trash', acao: 'excluir', confirm: 'Excluir este registro?', confirmText: 'Esta ação não pode ser desfeita.', confirmLabel: 'Excluir', toast: 'Registro excluído' }) + '</div>'));
      S.push(demoSection('04', 'campos', 'Campos', '<div class="lt-grid lt-grid--3">' +
        ui.field({ label: 'Texto', placeholder: 'Razão social' }) + ui.field({ label: 'Com dica', value: 'Metalatibaia', hint: 'Como a empresa é conhecida.' }) + ui.field({ label: 'Obrigatório com erro', required: true, error: 'Informe o CNPJ.' }) +
        ui.field({ label: 'Moeda', type: 'money', value: 1850000 }) + ui.field({ label: 'Percentual', type: 'percent', value: 20 }) + ui.field({ label: 'CNPJ', type: 'cnpj', value: '12418337000100' }) +
        ui.field({ label: 'CPF (protegido)', type: 'static', html: '<span class="lt-num">' + fmt.cpfMascarado('12345678909') + '</span> ' + ui.btn({ label: 'Ver', size: 'xs', variant: 'ghost', icon: 'eye', acao: 'salvar', toast: 'Acesso ao CPF registrado na auditoria', toastTone: 'info' }) }) + ui.field({ label: 'Telefone', type: 'phone', value: '19997123048' }) + ui.field({ label: 'Data', type: 'date', value: '2026-11-19' }) +
        ui.field({ label: 'Hora', type: 'time', value: '14:00' }) + ui.field({ label: 'Seleção', type: 'select', value: 'Lucro Real', options: D.listas.regimes }) + ui.field({ label: 'Busca', type: 'search', placeholder: 'Buscar empresa' }) +
        ui.field({ label: 'Desabilitado', value: 'Somente leitura', disabled: true }) + ui.field({ label: 'Com sufixo', type: 'number', value: 5, suffix: 'dias úteis' }) + ui.field({ label: 'Texto longo', type: 'textarea', rows: 2, placeholder: 'Observações' }) +
        '</div>' + lbl('Alternância, caixa de seleção e rádio') + '<div class="lt-grid lt-grid--3">' +
        '<div class="lt-stack lt-stack--sm">' + ui.field({ type: 'toggle', label: 'Ligado', checked: true }) + ui.field({ type: 'toggle', label: 'Desligado' }) + ui.field({ type: 'toggle', label: 'Desabilitado', disabled: true, checked: true }) + '</div>' +
        ui.field({ label: 'Caixas de seleção', type: 'checks', value: ['a'], options: [{ value: 'a', label: 'Marcada' }, { value: 'b', label: 'Desmarcada' }, { value: 'c', label: 'Com dica', hint: 'Texto auxiliar da opção' }] }) +
        ui.field({ label: 'Rádio', type: 'radio', value: 'r1', options: [{ value: 'r1', label: 'Realizada' }, { value: 'r2', label: 'Não realizada' }, { value: 'r3', label: 'Reagendada' }] }) + '</div>' +
        lbl('Envio de arquivo') + '<div class="lt-grid lt-grid--2">' + ui.field({ type: 'upload' }) + ui.field({ type: 'upload', files: [{ nome: 'contrato-honorarios-assinado.pdf', tamanho: '412 KB' }, { nome: 'efd-contribuicoes-2021-2025.zip', tamanho: '48 MB' }] }) + '</div>'));
      S.push(demoSection('05', 'secoes', 'Cards de formulário coloridos', '<div class="lt-grid lt-grid--2">' + [['gold', 'Identificação', 'building'], ['blue', 'Contato', 'phone'], ['green', 'Valores e honorários', 'dollar'], ['amber', 'Prazos e pendências', 'calendar-clock'], ['violet', 'Classificação', 'tag'], ['slate', 'Observações', 'file-text']].map((x) => ui.section({ title: x[1], tone: x[0], icon: x[2], sub: 'data-tone="' + x[0] + '"', cols: 2, body: ui.field({ label: 'Campo', placeholder: 'Valor' }) + ui.field({ label: 'Outro campo', type: 'select', options: ['Opção A', 'Opção B'] }) })).join('') + '</div>', 'Obrigatório em todo formulário: cada grupo de campos num card com faixa, ícone e tom próprio.'));
      S.push(demoSection('06', 'chips', 'Chips, badges e avatares', lbl('Tons') + '<div class="lt-chips">' + tones.map((t) => ui.chip(t, t)).join('') + '</div>' + lbl('Com ponto, ícone, sólido e grande') + '<div class="lt-chips">' + ui.chip('Em andamento', 'blue', { dot: true }) + ui.chip('Automação', 'violet', { icon: 'zap' }) + ui.chip('Ganho', 'green', { solid: true }) + ui.chip('Fatal hoje', 'red', { lg: true, dot: true }) + '</div>' +
        lbl('Status padrão (App.status)') + '<div class="lt-chips">' + Object.keys(App.status).map((k) => ui.status(k)).join('') + '</div>' +
        lbl('Badges e avatares') + '<div class="lt-demo-row"><span class="lt-iconbtn lt-iconbtn--bordered">' + I('bell') + ui.badge(5) + '</span>' + ui.badge(12, 'gold') + ui.badge(3, 'neutral') + ui.avatar(D.equipe[0], 'xs') + ui.avatar(D.equipe[1], 'sm') + ui.avatar(D.equipe[2]) + ui.avatar(D.equipe[5], 'lg') + ui.avatar(D.equipe[6], 'xl') + '<span class="lt-avatar-stack">' + D.equipe.slice(0, 5).map((p) => ui.avatar(p, 'sm')).join('') + '</span>' + ui.person(D.equipe[2], 'Consultora comercial') + '</div>'));
      S.push(demoSection('07', 'kpi', 'KPIs', ui.kpis([{ label: 'Contratos no mês', value: 'R$ 186 mil', icon: 'briefcase', delta: '+12%', dir: 'up', foot: 'vs. outubro' }, { label: 'Tempo médio na etapa', value: '9,4', unit: 'dias', icon: 'hourglass', delta: '+2,1 dias', dir: 'up', good: false }, { label: 'Ligações', value: '148', icon: 'phone', delta: '0%', dir: 'flat' }, { label: 'Meta de reuniões', value: '34/40', icon: 'target', progress: { value: 34, max: 40, tone: 'green' }, foot: '85% atingido' }])));
      S.push(demoSection('08', 'graficos', 'Gráficos SVG', '<div class="lt-grid lt-grid--2">' +
        ui.card({ title: 'Barras agrupadas', body: ui.chart.bar({ labels: ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'], series: [{ name: 'Reuniões agendadas', values: [22, 28, 25, 31, 36, 14] }, { name: 'Realizadas', values: [18, 21, 22, 26, 30, 9] }], height: 200 }) }) +
        ui.card({ title: 'Linha', body: ui.chart.line({ labels: ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'], series: [{ name: 'Honorários recebidos', values: [41000, 44500, 47800, 47800, 52000, 18000] }, { name: 'Meta', values: [45000, 45000, 50000, 50000, 55000, 55000], dashed: true }], height: 200, format: fmt.moedaCurta }) }) +
        ui.card({ title: 'Rosca', body: ui.chart.donut({ items: [{ label: 'Lucro Real', value: 15 }, { label: 'Lucro Presumido', value: 10 }], centerValue: '25', centerLabel: 'empresas' }) }) +
        ui.card({ title: 'Funil / barras horizontais', body: ui.chart.funnel([{ label: 'Ligações', value: 148 }, { label: 'Reuniões agendadas', value: 40, sub: '27%' }, { label: 'Reuniões realizadas', value: 31, sub: '78%' }, { label: 'Documentos recebidos', value: 14, sub: '45%' }, { label: 'Contratos assinados', value: 5, sub: '36% · 2 novos' }]) + '<div class="lt-row lt-mt-4">' + ui.chart.spark([3, 5, 4, 7, 6, 9, 8, 11]) + '<span class="lt-small lt-muted">mini-linha (spark)</span></div>' }) +
        ui.card({ title: 'Barras com valor negativo', sub: 'O eixo desce abaixo de zero e a barra negativa fica em vermelho', body: ui.chart.bar({ labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov'], series: [{ name: 'Resultado líquido', values: [-15633, 18240, 21410, 10775, 22380], color: 'var(--chart-4)' }], height: 200, format: fmt.moedaCurta, showValues: true }) }) +
        ui.card({ title: 'Linha com valor negativo', sub: 'Linha de zero destacada', body: ui.chart.line({ labels: ['Jul', 'Ago', 'Set', 'Out', 'Nov'], series: [{ name: 'Resultado líquido', values: [-15633, 18240, 21410, 10775, 22380] }], height: 200, format: fmt.moedaCurta }) }) + '</div>'));
      S.push(demoSection('09', 'tabela', 'Tabela de dados', ui.table({ selectable: true, pageSize: 5, rows: D.empresas.slice(0, 12), bulk: ui.btn({ label: 'Exportar Excel', size: 'xs', icon: 'download', acao: 'exportar', toast: 'Exportado' }), rowHref: () => null,
        columns: [{ label: 'Empresa', key: 'fantasia', sortable: true, render: (e) => '<span class="lt-table__primary">' + esc(e.fantasia) + '</span><span class="lt-table__secondary">' + esc(e.cnpj) + '</span>' }, { label: 'Regime', key: 'regime', sortable: true, render: (e) => ui.chip(e.regime, e.regime === 'Lucro Real' ? 'gold' : 'blue') }, { label: 'Cidade', key: 'cidade', sortable: true }, { label: 'Faturamento', key: 'faturamento', sortable: true, align: 'right', render: (e) => fmt.moedaCurta(e.faturamento) }],
        rowActions: () => ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar' }) + ui.btn({ icon: 'more-h', variant: 'ghost', size: 'xs', tip: 'Mais ações' }) }) +
        lbl('Vazio e carregando') + '<div class="lt-grid lt-grid--2">' + ui.table({ rows: [], empty: { icon: 'briefcase', title: 'Nenhum negócio nesta etapa', text: 'Arraste um cartão para cá ou crie um novo negócio.', action: ui.btn({ label: 'Novo negócio', variant: 'primary', icon: 'plus', size: 'sm' }) } }) + '<div class="lt-card" style="padding:18px">' + ui.skeleton({ lines: 5, avatar: true }) + '</div></div>'));
      S.push(demoSection('10', 'kanban', 'Kanban', ui.kanban({ id: 'demo-kanban', colunas: [
        { id: 'k1', num: 3, titulo: 'Contato com o decisor', cor: 'var(--tone-blue-solid)', itens: D.negocios.filter((n) => n.etapa === 3), total: 1030000 },
        { id: 'k2', num: 4, titulo: 'Reunião agendada', cor: 'var(--tone-blue-solid)', itens: D.negocios.filter((n) => n.etapa === 4 && !n.desfecho), total: 2490000 },
        { id: 'k3', num: 5, titulo: 'Reunião realizada', cor: 'var(--tone-violet-solid)', itens: D.negocios.filter((n) => n.etapa === 5), total: 310000 },
        { id: 'k4', titulo: 'Ganho', cor: 'var(--tone-green-solid)', desfecho: true, itens: D.negocios.filter((n) => n.desfecho === 'ganho') },
        { id: 'k5', titulo: 'Perdido', cor: 'var(--tone-red-solid)', desfecho: true, itens: D.negocios.filter((n) => n.desfecho === 'perdido') }
      ], card: (n) => ui.kanbanCard({ id: n.id, href: '#crm-negocio-' + n.id, title: empresaNome(n.empresaId), sub: n.titulo, value: n.creditoEstimado, avatar: n.consultorId, late: diasNaEtapa(n) > ((db.etapa(n.etapa) || {}).sla || 99), meta: '<span class="lt-small lt-muted lt-num">' + diasNaEtapa(n) + 'd</span>' }) }), 'Arraste os cartões: o evento cancelável <span class="lt-code">lt:kanban-move</span> deixa o módulo abrir o diálogo "Mover etapa" antes.'));
      S.push(demoSection('11', 'calendario', 'Calendário (mês e semana)', '<div class="lt-grid lt-grid--2">' + ui.calMonth({ ano: 2026, mes: 10, eventos: D.eventos.slice(0, 14).map((e) => ({ data: e.data, hora: e.inicio, titulo: e.titulo, tone: D.tiposEvento[e.tipo].tone, sheet: 'core-evento', params: { ev: e.id } })), max: 2 }) + ui.calWeek({ inicio: '2026-11-09', dias: 3, horaIni: 8, horaFim: 18, eventos: D.eventos.filter((e) => e.data <= '2026-11-11').map((e) => ({ data: e.data, inicio: e.inicio, fim: e.fim, titulo: e.titulo, sub: e.local, tone: D.tiposEvento[e.tipo].tone, sheet: 'core-evento', params: { ev: e.id } })), diaInteiro: [{ data: '2026-11-09', titulo: 'D-1 · Manifestação', tone: 'amber' }, { data: '2026-11-09', titulo: 'Fatal · Contrarrazões', tone: 'red' }] }) + '</div>'));
      S.push(demoSection('12', 'timeline', 'Linha do tempo', ui.timeline([{ day: 'Hoje' }, { icon: 'trending-up', tone: 'green', title: 'Etapa: Reunião agendada → Reunião realizada', meta: ui.person(3) + '<span>09:14</span>' }, { icon: 'zap', tone: 'violet', title: 'Automação AUT-05 criou a tarefa "Enviar carta proposta"', meta: 'Sistema · 09:14' }, { day: 'Sexta, 6 de novembro' }, { icon: 'users', tone: 'blue', title: 'Reunião realizada na empresa', meta: 'Camila Nogueira · 14:00', text: 'Decisor interessado na tese de verbas indenizatórias. Pediu a carta proposta até quarta.' }, { icon: 'file-text', tone: 'amber', title: 'Documento recebido: contrato social', meta: 'Camila Nogueira · 11:20' }])));
      S.push(demoSection('13', 'navegacao', 'Abas, segmentado, filtros, breadcrumb e cabeçalho', ui.pageHeader({ breadcrumb: [{ label: 'CRM', hash: 'componentes' }, { label: 'Negócios', hash: 'componentes' }, { label: 'Quimtec' }], eyebrow: 'Negócio #1005', title: 'Quimtec · ICMS e insumos', meta: ui.chip('Levantamento das oportunidades', 'amber', { dot: true }) + ui.chip('Lucro Real', 'gold'), actions: ui.btn({ label: 'Registrar atividade', icon: 'plus' }) + ui.btn({ label: 'Mover etapa', variant: 'primary', icon: 'arrow-right' }) }) +
        ui.filters({ busca: 'Buscar negócio', selects: [{ label: 'Consultor', options: ['Camila', 'Thiago', 'Juliana'] }], chips: [{ label: 'Meus', active: true }, { label: 'Parados', tone: 'amber' }, { label: 'Sem próxima tarefa', tone: 'red' }], extra: ui.segmented([{ label: 'Kanban', value: 'k', active: true, icon: 'kanban' }, { label: 'Lista', value: 'l', icon: 'list' }]) }) +
        ui.tabs({ id: 'demo-tabs', tabs: [{ key: 'a', label: 'Resumo', icon: 'grid', content: '<p class="lt-small lt-text-2">Conteúdo da aba Resumo.</p>' }, { key: 'b', label: 'Linha do tempo', icon: 'history', count: 12, content: '<p class="lt-small lt-text-2">Conteúdo da aba Linha do tempo.</p>' }, { key: 'c', label: 'Tarefas', icon: 'check-square', count: 3, content: '<p class="lt-small lt-text-2">Conteúdo da aba Tarefas.</p>' }, { key: 'd', label: 'Documentos', icon: 'paperclip', count: 7, content: '' }, { key: 'e', label: 'Automações', icon: 'workflow', content: '' }] })));
      S.push(demoSection('14', 'sobreposicoes', 'Gaveta lateral, diálogo, confirmação e toasts', '<div class="lt-demo-row">' + ui.btn({ label: 'Abrir gaveta (sheet)', icon: 'sidebar', sheet: 'core-demo-sheet' }) + ui.btn({ label: 'Abrir diálogo', icon: 'help', dialog: 'core-demo-dialog' }) + ui.btn({ label: 'Confirmação (irreversível)', variant: 'danger-outline', icon: 'trash', confirm: 'Excluir o negócio?', confirmText: 'O negócio e suas atividades vão para a lixeira por 30 dias.', confirmLabel: 'Excluir negócio', acao: 'excluir', toast: 'Negócio excluído' }) + '</div>' + lbl('Toasts') + '<div class="lt-demo-row">' + [['success', 'Sucesso'], ['info', 'Informação'], ['warning', 'Atenção'], ['danger', 'Erro']].map((x) => '<button type="button" class="lt-btn lt-btn--sm" data-demo-toast="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>'));
      S.push(demoSection('15', 'estados', 'Estados: vazio, carregando, avisos', '<div class="lt-grid lt-grid--2">' + '<div class="lt-card">' + ui.empty({ icon: 'calendar-clock', title: 'Nenhum prazo nesta semana', text: 'Prazos cadastrados nos processos aparecem aqui com o D-1 calculado.', action: ui.btn({ label: 'Cadastrar prazo', variant: 'primary', icon: 'plus', size: 'sm' }) }) + '</div><div class="lt-card" style="padding:18px">' + ui.skeleton({ lines: 6 }) + '</div></div>' +
        '<div class="lt-stack lt-mt-4">' + ui.callout({ tone: 'info', title: 'Informação', text: 'O D-1 considera feriados nacionais, estaduais, municipais e forenses.' }) + ui.callout({ tone: 'success', title: 'Sucesso', text: 'Contrato assinado anexado.' }) + ui.callout({ tone: 'warning', title: 'Atenção', text: 'Negócio parado há 26 dias (SLA de 10).', actions: ui.btn({ label: 'Registrar follow-up', size: 'sm', variant: 'outline' }) }) + ui.callout({ tone: 'danger', title: 'Erro', text: 'Não foi possível salvar. Código do pedido: req_8f2a1c. Tente de novo.' }) + ui.callout({ tone: 'gold', title: 'Destaque da marca', text: 'Use com moderação.' }) + '</div>'));
      S.push(demoSection('16', 'fluxos', 'Blocos do painel Fluxos', ui.flow({ blocos: [
        { id: 'a', cat: 'trigger', titulo: 'Gatilho', detalhe: 'Evento ou horário', col: 0, linha: 0 }, { id: 'b', cat: 'condition', titulo: 'Condição', quando: 'resultado = Realizada', col: 1, linha: 0, de: ['a'] },
        { id: 'c', cat: 'task', titulo: 'Criar tarefa', detalhe: 'Para o consultor', col: 2, linha: 0, de: ['b'] }, { id: 'd', cat: 'notify', titulo: 'Notificar', detalhe: 'Sistema + e-mail', col: 2, linha: 1, de: ['b'] },
        { id: 'e', cat: 'action', titulo: 'Ação de dados', detalhe: 'Mover etapa', col: 3, linha: 0, de: ['c'] }, { id: 'f', cat: 'wait', titulo: 'Aguardar', detalhe: '3 dias úteis', col: 3, linha: 1, de: ['d'], off: true }
      ] }) + lbl('Estados de execução') + ui.flow({ blocos: [{ id: 'x', cat: 'trigger', titulo: 'Rodou', col: 0, linha: 0 }, { id: 'y', cat: 'condition', titulo: 'Condição barrou', quando: 'resultado = Não realizada', col: 1, linha: 0, de: ['x'] }, { id: 'z', cat: 'task', titulo: 'Não rodou', col: 2, linha: 0, de: ['y'] }, { id: 'w', cat: 'notify', titulo: 'Falhou', col: 1, linha: 1, de: ['x'] }] }, { run: { passos: { x: { estado: 'ok', hora: '08:00:00' }, y: { estado: 'barrou', hora: '08:00:00' }, z: { estado: 'skip' }, w: { estado: 'fail', hora: '08:00:04', tentativa: 2 } } } })));
      S.push(demoSection('17', 'listas', 'Listas, caixa de data, resumo e definição', '<div class="lt-grid lt-grid--2">' + ui.card({ flush: true, title: 'Lista', body: ui.list([{ icon: 'calendar-clock', tone: 'amber', title: 'Prazo interno hoje', meta: 'Manifestação · Valinhos Autopeças', aside: ui.chip('Hoje', 'amber') }, { lead: ui.dateBox('2026-11-10', 'red'), title: 'Com caixa de data', meta: 'Vermelha = vencido/fatal' }, { icon: 'bell', tone: 'violet', title: 'Não lida', meta: 'Fundo dourado sutil', unread: true }]) }) +
        '<div class="lt-stack">' + ui.summary([{ label: 'Crédito estimado', value: 'R$ 3,1 mi' }, { label: 'Êxito', value: '18%' }, { label: 'Dias na etapa', value: '21' }]) + ui.card({ title: 'Resumo (lista de definição)', body: ui.dl([['Razão social', 'Quimtec Paulínia Indústria Química Ltda'], ['CNPJ', '22.164.583/0001-29'], ['Regime', ui.chip('Lucro Real', 'gold')], ['Consultor', ui.person(3)]]) }) + '</div></div>'));
      const idx = '<div class="lt-catalog-index">' + [['tokens', 'Cores'], ['tipografia', 'Tipografia'], ['botoes', 'Botões'], ['campos', 'Campos'], ['secoes', 'Cards de formulário'], ['chips', 'Chips e avatares'], ['kpi', 'KPIs'], ['graficos', 'Gráficos'], ['tabela', 'Tabela'], ['kanban', 'Kanban'], ['calendario', 'Calendário'], ['timeline', 'Linha do tempo'], ['navegacao', 'Navegação'], ['sobreposicoes', 'Gaveta e diálogo'], ['estados', 'Estados'], ['fluxos', 'Fluxos'], ['listas', 'Listas']].map((k, i) => '<button type="button" class="lt-filter-chip" data-scroll="cat-' + k[0] + '"><span class="lt-muted lt-num">' + String(i + 1).padStart(2, '0') + '</span>' + k[1] + '</button>').join('') + '</div>';
      return ui.pageHeader({ eyebrow: 'CORE-00', title: 'Catálogo de componentes', sub: 'Todos os componentes .lt-* em todos os estados. É a referência para os módulos e para a comparação HTML × sistema construído.', actions: ui.btn({ label: 'Alternar tema', icon: 'moon', attrs: { 'data-theme-toggle': true } }) }) + idx + '<div class="lt-stack lt-stack--lg">' + S.join('') + '</div>';
    },
    mount: (root) => {
      root.addEventListener('click', (e) => {
        const s = e.target.closest('[data-scroll]'); if (s) { const el = document.getElementById(s.getAttribute('data-scroll')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        const t = e.target.closest('[data-demo-toast]'); if (t) { const k = t.getAttribute('data-demo-toast'); ui.toast({ success: 'Negócio salvo', info: 'Busca global na Fase 2', warning: 'Etapa parada há 26 dias', danger: 'Não foi possível salvar' }[k], k, { success: 'As alterações já estão visíveis para a equipe.', info: 'Use os filtros de cada lista por enquanto.', warning: 'BG Farma · Carta proposta e documentos.', danger: 'Código do pedido: req_8f2a1c.' }[k]); }
      });
      root.addEventListener('lt:kanban-move', (e) => { ui.toast('Cartão movido', 'info', 'No CRM, o módulo abre o diálogo "Mover etapa" antes de confirmar (de ' + esc(e.detail.de) + ' para ' + esc(e.detail.para) + ').'); });
    }
  });
  ui.registerSheet('core-demo-sheet', () => ({ title: 'Novo negócio', sub: 'Exemplo de gaveta lateral com cards de formulário.',
    body: '<div class="lt-sections">' + ui.section({ title: 'Empresa', tone: 'gold', icon: 'building', cols: 2, body: ui.field({ label: 'Empresa', type: 'select', required: true, span: 2, placeholder: 'Escolha', options: D.empresas.map((e) => ({ value: e.id, label: e.fantasia })) }) + ui.field({ label: 'Regime', type: 'select', options: D.listas.regimes }) + ui.field({ label: 'Origem', type: 'select', options: D.listas.origens }) }) +
      ui.section({ title: 'Oportunidade', tone: 'green', icon: 'dollar', cols: 2, body: ui.field({ label: 'Tese', type: 'select', span: 2, options: D.listas.teses }) + ui.field({ label: 'Crédito estimado', type: 'money' }) + ui.field({ label: 'Honorário de êxito', type: 'percent', value: 20 }) }) +
      ui.section({ title: 'Próxima tarefa (obrigatória)', tone: 'amber', icon: 'calendar-clock', cols: 2, body: ui.field({ label: 'O que fazer', required: true, span: 2, value: 'Qualificar lead' }) + ui.field({ label: 'Data', type: 'date', value: '2026-11-10' }) + ui.field({ label: 'Hora', type: 'time', value: '10:00' }) }) + '</div>',
    foot: ui.sheetFoot({ label: 'Salvar negócio', toast: 'Negócio salvo', info: 'Campos com * são obrigatórios' }) }));
  ui.registerDialog('core-demo-dialog', () => ({ title: 'Mover para "Reunião agendada"', text: 'Esta etapa exige uma reunião registrada com data e hora.', icon: 'arrow-right',
    body: ui.section({ title: 'Requisito da etapa', tone: 'amber', icon: 'calendar', cols: 2, body: ui.field({ label: 'Data da reunião', type: 'date', required: true, value: '2026-11-12' }) + ui.field({ label: 'Hora', type: 'time', required: true, value: '10:00' }) + ui.field({ label: 'Local', span: 2, value: 'Na empresa' }) }),
    foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Mover etapa', variant: 'primary', icon: 'arrow-right', acao: 'mover', toast: 'Etapa alterada', toastText: 'Lembretes da reunião programados (AUT-03).', fechar: 'dialog' }) }));

  /* ================================================================== */
  /* MAPA DE TELAS                                                       */
  /* ================================================================== */
  const APR_KEY = 'atlas-aprovacoes';
  const STATUS_APR = [['pendente', 'Pendente', 'gray'], ['aprovada', 'Aprovada', 'green'], ['ajustar', 'Ajustar', 'amber']];
  function aprovacoes() { return util.store.get(APR_KEY, {}) || {}; }
  function mapaKpis() {
    const a = aprovacoes(), n = App.screens.length;
    const ok = App.screens.filter((s) => a[s.id] && a[s.id].status === 'aprovada').length, aj = App.screens.filter((s) => a[s.id] && a[s.id].status === 'ajustar').length;
    return ui.kpis([{ label: 'Telas', value: String(n), icon: 'map' }, { label: 'Aprovadas', value: String(ok), icon: 'check-circle', progress: { value: ok, max: n, tone: 'green' } }, { label: 'Ajustar', value: String(aj), icon: 'edit' }, { label: 'Pendentes', value: String(n - ok - aj), icon: 'clock' }]);
  }
  function textoAprovacoes() {
    const a = aprovacoes(), linhas = ['Aprovações do protótipo Atlas — ' + fmt.data(new Date()), ''];
    STATUS_APR.slice().reverse().forEach((st) => {
      const l = App.screens.filter((s) => ((a[s.id] && a[s.id].status) || 'pendente') === st[0]);
      linhas.push(st[1].toUpperCase() + ' (' + l.length + ')');
      l.forEach((s) => linhas.push('- ' + s.id + ' · ' + s.title + (a[s.id] && a[s.id].nota ? ' — ' + a[s.id].nota : '')));
      linhas.push('');
    });
    return linhas.join('\n');
  }
  App.screen({
    id: 'core.map', hash: 'mapa', module: 'core', title: 'Mapa de telas',
    render: () => {
      const a = aprovacoes();
      const grupos = ['core', 'crm', 'juridico', 'financeiro', 'intranet'].map((m) => {
        const telas = App.screens.filter((s) => s.module === m);
        const body = telas.length ? '<div class="lt-table-wrap" style="border:0;border-radius:0"><table class="lt-table lt-table--compact"><thead><tr><th style="width:150px">Status</th><th>ID</th><th>Título</th><th>Abrir</th><th style="width:30%">Nota para ajuste</th></tr></thead><tbody>' + telas.map((s) => {
          const st = (a[s.id] && a[s.id].status) || 'pendente', link = s.hash + (s.exemplo ? '-' + s.exemplo : '');
          return '<tr data-tela="' + esc(s.id) + '"><td><select class="lt-select" data-apr-status style="height:32px" aria-label="Status de ' + esc(s.id) + '">' + STATUS_APR.map((x) => '<option value="' + x[0] + '"' + (x[0] === st ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></td><td><span class="lt-code">' + esc(s.id) + '</span></td><td><span class="lt-table__primary">' + esc(s.title) + '</span>' + (s.layout === 'blank' ? '<span class="lt-table__secondary">tela cheia, sem menu</span>' : '') + '</td><td><a href="#' + esc(link) + '" class="lt-mono">#' + esc(link) + '</a></td><td><input class="lt-input" data-apr-nota value="' + esc((a[s.id] && a[s.id].nota) || '') + '" placeholder="O que ajustar" style="height:32px"></td></tr>';
        }).join('') + '</tbody></table></div>' : ui.empty({ small: true, icon: 'layers', title: 'Módulo em construção', text: 'As telas aparecem aqui assim que o módulo registrar com App.screen().' });
        return ui.card({ title: App.moduleNames[m], icon: { core: 'grid', crm: 'briefcase', juridico: 'scale', financeiro: 'wallet', intranet: 'folder' }[m], sub: telas.length + ' telas', flush: true, body });
      }).join('');
      return ui.pageHeader({ title: 'Mapa de telas', sub: 'Aprove cada tela citando o ID. O status fica salvo neste navegador; use "Copiar aprovações" para mandar a lista.', actions: ui.btn({ label: 'Limpar status', variant: 'ghost', icon: 'refresh', attrs: { 'data-apr-limpar': true } }) + ui.btn({ label: 'Copiar aprovações', variant: 'primary', icon: 'copy', attrs: { 'data-apr-copiar': true } }) }) +
        '<div data-mapa-kpis>' + mapaKpis() + '</div><div class="lt-stack lt-mt-6">' + grupos + '</div>';
    },
    mount: (root) => {
      const salvar = (tr) => {
        const a = aprovacoes(), id = tr.getAttribute('data-tela');
        a[id] = { status: tr.querySelector('[data-apr-status]').value, nota: tr.querySelector('[data-apr-nota]').value.trim() };
        if (!util.store.set(APR_KEY, a)) ui.toast('Não foi possível salvar neste navegador', 'warning', 'O armazenamento local está bloqueado. Copie as aprovações antes de sair.');
        root.querySelector('[data-mapa-kpis]').innerHTML = mapaKpis(); App.updateMapaCount();
      };
      root.addEventListener('change', (e) => { const tr = e.target.closest('tr[data-tela]'); if (tr) { salvar(tr); if (e.target.matches('[data-apr-status]')) ui.toast('Status salvo', 'success', esc(tr.getAttribute('data-tela')) + ' · ' + e.target.options[e.target.selectedIndex].text); } });
      root.querySelector('[data-apr-copiar]').addEventListener('click', () => App.copy(textoAprovacoes(), 'Aprovações copiadas'));
      root.querySelector('[data-apr-limpar]').addEventListener('click', () => ui.confirm({ title: 'Limpar todos os status?', text: 'Todas as telas voltam para "Pendente" e as notas são apagadas neste navegador.', confirmLabel: 'Limpar', toast: 'Status limpos', onConfirm: () => { util.store.set(APR_KEY, {}); App.refresh(); } }));
    }
  });
})();
