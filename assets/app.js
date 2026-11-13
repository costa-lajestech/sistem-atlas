/* ==========================================================================
   ATLAS · app.js — núcleo do protótipo navegável
   - App.screen(def)            registra uma tela
   - roteador por hash simples   #crm-funil, #crm-negocio-1042 (sufixo numérico → params.id)
   - shell                       menu lateral, topo, tema claro/escuro, rodapé com ID da tela
   - App.ui.*                    helpers que devolvem HTML (string) + comportamentos globais
   - App.icon(nome)              ícones SVG inline (traço 1.5)
   - App.fmt / App.util / App.db formatação pt-BR, datas e dias úteis, busca nos dados
   Scripts clássicos (sem import/export) para funcionar em file://.
   ========================================================================== */
(function () {
  'use strict';

  var App = window.App = window.App || {};
  App.version = '0.1.0';
  App.data = App.data || {};
  App.state = App.state || {};
  App.screens = [];
  App._byHash = {};
  App.ui = App.ui || {};
  App.ui.sheets = App.ui.sheets || {};
  App.ui.dialogs = App.ui.dialogs || {};

  /* Data de referência FIXA do protótipo (screenshots reproduzíveis): segunda-feira, 09/11/2026 09:30 */
  App.HOJE = new Date(2026, 10, 9, 9, 30, 0);
  /* Usuário logado (fictício) — id em App.data.equipe */
  App.meId = 1;

  /* ------------------------------------------------------------------ */
  /* ÍCONES (estilo lucide, traço 1.5)                                   */
  /* ------------------------------------------------------------------ */
  var I = {
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'calendar-clock': '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5"/><circle cx="16" cy="16" r="6"/><path d="M16 14v2l1 1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    gavel: '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"/><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>',
    video: '<path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.76-.43L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    presentation: '<path d="M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M7 21l5-5 5 5"/>',
    spreadsheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
    play: '<path d="M6 3 20 12 6 21Z"/>',
    'play-circle': '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4Z"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
    'arrow-left': '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
    'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    'trending-down': '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
    'more-h': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    'more-v': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
    'minus-circle': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
    'check-square': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>',
    'list-checks': '<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    map: '<path d="M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2L21 16V3z"/><path d="M9.9 4v13M14.1 6v13"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>',
    'chart-bar': '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    'chart-line': '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    'git-branch': '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    workflow: '<rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    sidebar: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
    type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    dot: '<circle cx="12" cy="12" r="3"/>'
  };
  App.icons = I;
  App.icon = function (nome, cls) {
    var p = I[nome] || I.circle;
    return '<svg class="lt-icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  };

  /* ------------------------------------------------------------------ */
  /* FORMATAÇÃO e UTILITÁRIOS                                             */
  /* ------------------------------------------------------------------ */
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  var DIAS_CURTOS = ['dom','seg','ter','qua','qui','sex','sáb'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var util = App.util = {
    MESES: MESES, MESES_CURTOS: MESES_CURTOS, DIAS: DIAS, DIAS_CURTOS: DIAS_CURTOS,
    /* aceita Date, 'YYYY-MM-DD', 'YYYY-MM-DDTHH:MM' → Date local */
    parse: function (d) {
      if (d instanceof Date) return new Date(d.getTime());
      if (typeof d === 'number') return new Date(d);
      if (!d) return null;
      var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
      if (!m) return new Date(d);
      return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
    },
    iso: function (d) { d = util.parse(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    isoHora: function (d) { d = util.parse(d); return util.iso(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    hoje: function () { return new Date(App.HOJE.getTime()); },
    hojeIso: function () { return util.iso(App.HOJE); },
    addDias: function (d, n) { d = util.parse(d); d.setDate(d.getDate() + n); return d; },
    /* diferença em dias de calendário (b - a) */
    diasEntre: function (a, b) {
      a = util.parse(a); b = util.parse(b);
      var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()), ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
      return Math.round((ub - ua) / 86400000);
    },
    mesmoDia: function (a, b) { return util.iso(a) === util.iso(b); },
    inicioSemana: function (d) { d = util.parse(d); var w = d.getDay(); return util.addDias(d, w === 0 ? -6 : 1 - w); },
    /* feriado (objeto de App.data.feriados) ou null.
       opts.escopo: calendário do órgão ('jf' = padrão, Campinas + Justiça Federal · 'tjsp' = Justiça Estadual).
       Feriado sem escopo vale para todos; com escopo só conta no calendário daquele órgão. */
    feriado: function (d, opts) {
      var s = util.iso(d), f = App.data.feriados || [], esc = (opts && opts.escopo) || 'jf';
      for (var i = 0; i < f.length; i++) if (f[i].data === s && (!f[i].escopo || f[i].escopo === esc)) return f[i];
      return null;
    },
    /* suspensão de prazo (recesso/portaria) ou null */
    suspensao: function (d) {
      var s = util.iso(d), l = App.data.suspensoes || [];
      for (var i = 0; i < l.length; i++) if (s >= l[i].inicio && s <= l[i].fim) return l[i];
      return null;
    },
    fimDeSemana: function (d) { d = util.parse(d); return d.getDay() === 0 || d.getDay() === 6; },
    /* dia útil = não é sábado/domingo nem feriado (nacional, estadual, municipal ou forense).
       opts.contarSuspensao=true também exclui dias de suspensão de prazo */
    ehDiaUtil: function (d, opts) {
      if (util.fimDeSemana(d) || util.feriado(d, opts)) return false;
      if (opts && opts.contarSuspensao && util.suspensao(d)) return false;
      return true;
    },
    diaUtilAnterior: function (d, opts) {
      var x = util.addDias(d, -1);
      var guard = 0;
      while (!util.ehDiaUtil(x, opts) && guard++ < 60) x = util.addDias(x, -1);
      return x;
    },
    proximoDiaUtil: function (d, opts) {
      var x = util.parse(d), guard = 0;
      while (!util.ehDiaUtil(x, opts) && guard++ < 60) x = util.addDias(x, 1);
      return x;
    },
    addDiasUteis: function (d, n, opts) {
      var x = util.parse(d), step = n < 0 ? -1 : 1, c = Math.abs(n), guard = 0;
      while (c > 0 && guard++ < 400) { x = util.addDias(x, step); if (util.ehDiaUtil(x, opts)) c--; }
      return x;
    },
    /* REGRA D-1: prazo interno = 1 dia útil antes do fatal → 'YYYY-MM-DD' */
    prazoInterno: function (fatal) { return util.iso(util.diaUtilAnterior(fatal)); },
    /* explica o cálculo D-1 em texto (para tooltips e simulador) */
    explicarD1: function (fatal) {
      var f = util.parse(fatal), passos = [], x = util.addDias(f, -1), guard = 0;
      while (!util.ehDiaUtil(x) && guard++ < 60) {
        var fer = util.feriado(x);
        passos.push(App.fmt.data(x) + ' (' + DIAS[x.getDay()] + ') não é dia útil' + (fer ? ': ' + fer.nome : ''));
        x = util.addDias(x, -1);
      }
      passos.push('Prazo interno: ' + App.fmt.data(x) + ' (' + DIAS[x.getDay()] + ')');
      return passos;
    },
    uid: function (p) { return (p || 'id') + '-' + Math.random().toString(36).slice(2, 8); },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    soma: function (arr, fn) { var s = 0; arr.forEach(function (x) { s += (fn ? fn(x) : x) || 0; }); return s; },
    agrupar: function (arr, fn) { var o = {}; arr.forEach(function (x) { var k = fn(x); (o[k] = o[k] || []).push(x); }); return o; },
    store: {
      get: function (k, def) { try { var v = window.localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
      set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    }
  };

  var nfMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var nfMoeda0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  var fmt = App.fmt = {
    moeda: function (v, semCentavos) { if (v == null || isNaN(v)) return '—'; return (semCentavos ? nfMoeda0 : nfMoeda).format(v); },
    /* R$ 1,2 mi · R$ 480 mil · R$ 950 */
    moedaCurta: function (v) {
      if (v == null || isNaN(v)) return '—';
      var a = Math.abs(v), s = v < 0 ? '-' : '';
      if (a >= 1e6) return s + 'R$ ' + fmt.num(a / 1e6, a >= 1e7 ? 1 : 2).replace(/,0+$/, '') + ' mi';
      if (a >= 1e3) return s + 'R$ ' + fmt.num(a / 1e3, a >= 1e5 ? 0 : 1).replace(/,0$/, '') + ' mil';
      return s + 'R$ ' + fmt.num(a, 0);
    },
    num: function (v, dec) { if (v == null || isNaN(v)) return '—'; dec = dec || 0; return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); },
    /* pct(42.5) → "42,5%" */
    pct: function (v, dec) { if (v == null || isNaN(v)) return '—'; return fmt.num(v, dec == null ? 0 : dec) + '%'; },
    data: function (d) { d = util.parse(d); if (!d) return '—'; return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); },
    dataCurta: function (d) { d = util.parse(d); if (!d) return '—'; return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); },
    dataHora: function (d) { d = util.parse(d); if (!d) return '—'; return fmt.data(d) + ' ' + fmt.hora(d); },
    hora: function (d) { d = util.parse(d); if (!d) return '—'; return pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    diaMes: function (d) { d = util.parse(d); return pad(d.getDate()) + ' ' + MESES_CURTOS[d.getMonth()]; },
    mesAno: function (d) { d = util.parse(d); var m = MESES[d.getMonth()]; return m.charAt(0).toUpperCase() + m.slice(1) + ' de ' + d.getFullYear(); },
    diaSemana: function (d) { return DIAS[util.parse(d).getDay()]; },
    diaSemanaCurto: function (d) { return DIAS_CURTOS[util.parse(d).getDay()]; },
    dataExtenso: function (d) { d = util.parse(d); return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); },
    /* hoje · amanhã · ontem · em 3 dias · há 2 dias */
    relativo: function (d) {
      var n = util.diasEntre(App.HOJE, d);
      if (n === 0) return 'hoje'; if (n === 1) return 'amanhã'; if (n === -1) return 'ontem';
      return n > 0 ? 'em ' + n + ' dias' : 'há ' + (-n) + ' dias';
    },
    /* há 5 min · há 2 h · ontem 14:30 · 03/11 */
    quando: function (d) {
      d = util.parse(d); var diff = (App.HOJE - d) / 60000;
      if (diff >= 0 && diff < 60) return 'há ' + Math.max(1, Math.round(diff)) + ' min';
      if (diff >= 60 && diff < 60 * 12 && util.mesmoDia(d, App.HOJE)) return 'há ' + Math.round(diff / 60) + ' h';
      var n = util.diasEntre(App.HOJE, d);
      if (n === 0) return 'hoje ' + fmt.hora(d);
      if (n === -1) return 'ontem ' + fmt.hora(d);
      if (n === 1) return 'amanhã ' + fmt.hora(d);
      return fmt.dataCurta(d) + ' ' + fmt.hora(d);
    },
    cnpj: function (s) { var d = String(s || '').replace(/\D/g, '').slice(0, 14); return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2'); },
    cpf: function (s) { var d = String(s || '').replace(/\D/g, '').slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); },
    /* CPF protegido por perfil: ***.456.789-** */
    cpfMascarado: function (s) { var f = fmt.cpf(s); return '***' + f.slice(3, 11) + '-**'; },
    telefone: function (s) { var d = String(s || '').replace(/\D/g, '').slice(0, 11); if (d.length > 10) return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3'); return d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3'); },
    cep: function (s) { var d = String(s || '').replace(/\D/g, '').slice(0, 8); return d.replace(/^(\d{5})(\d)/, '$1-$2'); },
    iniciais: function (nome) { var p = String(nome || '').replace(/^(Dra?\.)\s+/, '').trim().split(/\s+/); return ((p[0] || '')[0] || '').toUpperCase() + ((p.length > 1 ? p[p.length - 1][0] : '') || '').toUpperCase(); },
    plural: function (n, s, p) { return fmt.num(n) + ' ' + (n === 1 ? s : (p || s + 's')); },
    bytes: function (b) { if (b < 1024) return b + ' B'; if (b < 1048576) return fmt.num(b / 1024, 0) + ' KB'; return fmt.num(b / 1048576, 1) + ' MB'; }
  };

  /* Busca nos dados compartilhados (data.js) */
  App.db = {
    _find: function (list, id) { list = list || []; for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i]; return null; },
    pessoa: function (id) { return App.db._find(App.data.equipe, id); },
    me: function () { return App.db.pessoa(App.meId); },
    empresa: function (id) { return App.db._find(App.data.empresas, id); },
    contato: function (id) { return App.db._find(App.data.contatos, id); },
    contatosDa: function (empresaId) { return (App.data.contatos || []).filter(function (c) { return String(c.empresaId) === String(empresaId); }); },
    negocio: function (id) { return App.db._find(App.data.negocios, id); },
    processo: function (id) { return App.db._find(App.data.processos, id); },
    contrato: function (id) { return App.db._find(App.data.contratos, id); },
    papel: function (key) { return App.db._find((App.data.papeis || []).map(function (p) { return Object.assign({ id: p.key }, p); }), key); },
    etapa: function (num) { var e = (App.data.funis && App.data.funis.comercial.etapas) || []; for (var i = 0; i < e.length; i++) if (String(e[i].num) === String(num) || e[i].key === num) return e[i]; return null; },
    lista: function (key) { return (App.data.listas && App.data.listas[key]) || []; },
    /* Todas as tarefas: núcleo (D.tarefas) + as do CRM (App.data.crm.tarefas 6101+ e o histórico 6201+) */
    tarefas: function () { var C = App.data.crm || {}; return (App.data.tarefas || []).concat(C.tarefas || [], C.tarefasHist || []); }
  };

  /* Mapa de status → [rótulo, tom]. Módulos podem acrescentar: App.status.meu_status = ['Rótulo','green'] */
  App.status = {
    pendente: ['Pendente', 'amber'], cumprido: ['Cumprido', 'green'], perdido: ['Perdido', 'red'], atrasado: ['Atrasado', 'red'],
    hoje: ['Hoje', 'amber'], ativo: ['Ativo', 'green'], inativo: ['Inativo', 'gray'], convidado: ['Convite enviado', 'blue'],
    aberto: ['Em aberto', 'blue'], pago: ['Pago', 'green'], recebido: ['Recebido', 'green'], vencido: ['Vencido', 'red'], cancelado: ['Cancelado', 'gray'],
    ganho: ['Ganho', 'green'], descartado: ['Descartado', 'gray'], concluida: ['Concluída', 'green'], em_andamento: ['Em andamento', 'blue'],
    ligado: ['Ligado', 'green'], desligado: ['Desligado', 'gray'], falhou: ['Falhou', 'red'], rodou: ['Rodou', 'green'], nao_rodou: ['Não rodou', 'gray'],
    agendado: ['Agendado', 'violet'], rascunho: ['Rascunho', 'slate'], aprovada: ['Aprovada', 'green'], ajustar: ['Ajustar', 'amber']
  };

  /* ------------------------------------------------------------------ */
  /* TEMA                                                                 */
  /* ------------------------------------------------------------------ */
  App.theme = {
    KEY: 'atlas-tema',
    get: function () { return document.documentElement.getAttribute('data-theme'); },
    effective: function () {
      var t = App.theme.get();
      if (t === 'dark' || t === 'light') return t;
      try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
    },
    set: function (t, persist) {
      document.documentElement.setAttribute('data-theme', t);
      if (persist !== false) { try { window.localStorage.setItem(App.theme.KEY, t); } catch (e) { /* sem storage */ } }
      App.theme.syncButton();
      document.dispatchEvent(new CustomEvent('lt:tema', { detail: { tema: t } }));
    },
    toggle: function () { App.theme.set(App.theme.effective() === 'dark' ? 'light' : 'dark'); },
    syncButton: function () {
      var b = document.getElementById('lt-theme-btn'); if (!b) return;
      var dark = App.theme.effective() === 'dark';
      b.innerHTML = App.icon(dark ? 'sun' : 'moon');
      b.setAttribute('aria-label', dark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
      b.setAttribute('data-tip', dark ? 'Modo claro' : 'Modo escuro');
    }
  };

  /* ------------------------------------------------------------------ */
  /* REGISTRO DE TELAS e ROTEADOR                                         */
  /* ------------------------------------------------------------------ */
  var HASH_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var RESERVADAS = ['settings', 'sidebar', 'customize', 'upgrade', 'downloads'];

  /* def: { id, hash, module, title, nav, navGroup, navLabel, navIcon, navOrder, navParent, layout:'app'|'blank', render(params), mount(root, params) } */
  App.screen = function (def) {
    if (!def || !def.id || !def.hash || typeof def.render !== 'function') { console.error('[App.screen] definição inválida', def); return; }
    if (!HASH_OK.test(def.hash) || RESERVADAS.indexOf(def.hash) >= 0 || /^comment-/.test(def.hash)) { console.error('[App.screen] hash inválido: ' + def.hash + ' (use só a-z, 0-9 e hífen; sem palavras reservadas)'); return; }
    if (/-\d+$/.test(def.hash)) console.warn('[App.screen] evite hash terminado em -número (' + def.hash + '): o roteador usa o sufixo numérico como params.id');
    if (App._byHash[def.hash]) { console.error('[App.screen] hash duplicado: ' + def.hash); return; }
    def.module = def.module || 'core';
    def.layout = def.layout || 'app';
    App.screens.push(def);
    App._byHash[def.hash] = def;
  };

  App.parseHash = function (h) {
    h = (h == null ? window.location.hash : h).replace(/^#/, '');
    if (!h) return { screen: App._byHash.inicio || App.screens[0], params: {} };
    if (App._byHash[h]) return { screen: App._byHash[h], params: {} };
    var m = h.match(/^(.*)-(\d+)$/);
    if (m && App._byHash[m[1]]) return { screen: App._byHash[m[1]], params: { id: +m[2] } };
    return { screen: null, params: { hash: h } };
  };

  App.go = function (hash) { if (('#' + hash) === window.location.hash) App.render(); else window.location.hash = hash; };
  App.refresh = function () { App.render(true); };

  App.navGroups = [
    { key: 'inicio', label: 'Início', icon: 'home' },
    { key: 'agenda', label: 'Agenda', icon: 'calendar' },
    { key: 'crm', label: 'CRM', icon: 'briefcase' },
    { key: 'juridico', label: 'Jurídico', icon: 'scale' },
    { key: 'financeiro', label: 'Financeiro', icon: 'wallet' },
    { key: 'intranet', label: 'Intranet', icon: 'folder' },
    { key: 'config', label: 'Configurações', icon: 'settings' }
  ];
  App.moduleNames = { core: 'Núcleo', crm: 'CRM Comercial', juridico: 'Jurídico', financeiro: 'Financeiro', intranet: 'Intranet' };

  /* Atalhos do botão "+ Novo": cada item abre a sheet registrada pelo módulo (App.ui.sheets[nome]) */
  App.quickCreate = [
    { label: 'Novo lead / negócio', icon: 'briefcase', sheet: 'crm-novo-negocio', modulo: 'CRM', grupo: 'crm' },
    { label: 'Registrar atividade', icon: 'phone', sheet: 'crm-nova-atividade', modulo: 'CRM', grupo: 'crm' },
    { label: 'Novo processo', icon: 'scale', sheet: 'jur-novo-processo', modulo: 'Jurídico', grupo: 'juridico' },
    { label: 'Novo prazo', icon: 'calendar-clock', sheet: 'jur-novo-prazo', modulo: 'Jurídico', grupo: 'juridico' },
    { label: 'Novo lançamento', icon: 'receipt', sheet: 'fin-novo-lancamento', modulo: 'Financeiro', grupo: 'financeiro' },
    { label: 'Enviar material', icon: 'upload', sheet: 'int-novo-material', modulo: 'Intranet', grupo: 'intranet' },
    { label: 'Novo compromisso', icon: 'calendar', sheet: 'core-novo-compromisso', modulo: 'Agenda', grupo: 'agenda' }
  ];

  var esc = App.ui.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  function navHtml(current) {
    var curScreen = current || {};
    var curGroup = curScreen.navGroup;
    var curNavHash = curScreen.nav ? curScreen.hash : curScreen.navParent;
    var out = '';
    App.navGroups.forEach(function (g) {
      var items = App.screens.filter(function (s) { return s.nav && s.navGroup === g.key; })
        .sort(function (a, b) { return (a.navOrder || 50) - (b.navOrder || 50); });
      if (App.podeVerGrupo && !App.podeVerGrupo(g.key)) return;
      if (g.key === 'config') out += '<div class="lt-nav__sep"></div>';
      if (items.length === 1 && (g.key === 'inicio' || g.key === 'agenda')) {
        var s = items[0];
        out += '<div class="lt-nav__group"><a class="lt-nav__item' + (curNavHash === s.hash ? ' is-active' : '') + '" href="#' + s.hash + '">' + App.icon(s.navIcon || g.icon) + '<span>' + esc(s.navLabel || g.label) + '</span></a></div>';
        return;
      }
      var open = curGroup === g.key || App.state['nav-open-' + g.key];
      out += '<div class="lt-nav__group' + (open ? ' is-open' : '') + '" data-group="' + g.key + '">';
      out += '<button type="button" class="lt-nav__group-head' + (curGroup === g.key ? ' is-current' : '') + '" data-nav-toggle="' + g.key + '">' + App.icon(g.icon) + '<span>' + esc(g.label) + '</span>' +
        (items.length ? App.icon('chevron-right', 'lt-nav__chev') : '<span class="lt-nav__soon">em breve</span>') + '</button>';
      if (items.length) {
        out += '<div class="lt-nav__children">';
        items.forEach(function (s) {
          out += '<a class="lt-nav__item' + (curNavHash === s.hash ? ' is-active' : '') + '" href="#' + s.hash + '"><span class="lt-truncate">' + esc(s.navLabel || s.title) + '</span></a>';
        });
        out += '</div>';
      }
      out += '</div>';
    });
    return out;
  }

  function naoLidas() { return (App.data.notificacoes || []).filter(function (n) { return !n.lida; }).length; }

  function shellHtml() {
    var me = App.db.me() || { nome: 'Usuário', cargoCurto: '' };
    var n = naoLidas();
    return '' +
      '<div class="lt-shell" id="lt-shell">' +
      '<aside class="lt-sidebar" aria-label="Menu principal">' +
      '<div class="lt-sidebar__brand"><a href="#inicio" aria-label="Atlas Corporate · Início">' +
      '<img class="lt-logo lt-logo--for-light" src="assets/img/logo-atlas-fundo-claro.webp" alt="Atlas Corporate" width="122" height="30">' +
      '<img class="lt-logo lt-logo--for-dark" src="assets/img/logo-atlas.webp" alt="Atlas Corporate" width="122" height="30">' +
      '</a></div>' +
      '<nav class="lt-sidebar__nav" id="lt-nav"></nav>' +
      '<div class="lt-sidebar__foot">' +
      '<a class="lt-nav__item" href="#mapa" data-foot-link="mapa">' + App.icon('map') + '<span>Mapa de telas</span><span class="lt-nav__count" id="lt-mapa-count"></span></a>' +
      '<a class="lt-nav__item" href="#componentes" data-foot-link="componentes">' + App.icon('grid') + '<span>Componentes</span><span class="lt-nav__count">CORE-00</span></a>' +
      '</div>' +
      '</aside>' +
      '<div class="lt-drawer-backdrop" data-drawer-close></div>' +
      '<div class="lt-main">' +
      '<header class="lt-topbar">' +
      '<button type="button" class="lt-iconbtn lt-topbar__menu" data-drawer-open aria-label="Abrir menu">' + App.icon('menu') + '</button>' +
      '<div class="lt-topbar__search">' + App.icon('search') + '<input type="search" id="lt-busca" placeholder="Buscar em todo o sistema" aria-label="Busca global: empresas, negócios, processos"><span class="lt-kbd">/</span></div>' +
      '<div class="lt-topbar__actions">' +
      '<div style="position:relative"><button type="button" class="lt-btn lt-btn--primary lt-btn--sm" data-menu="novo">' + App.icon('plus') + '<span>Novo</span></button></div>' +
      '<button type="button" class="lt-iconbtn lt-tooltip" id="lt-theme-btn" data-theme-toggle></button>' +
      '<a class="lt-iconbtn lt-tooltip" id="lt-bell" href="#notificacoes" aria-label="Notificações" data-tip="Notificações">' + App.icon('bell') + (n ? '<span class="lt-badge" id="lt-notif-badge">' + n + '</span>' : '') + '</a>' +
      '<div style="position:relative"><button type="button" class="lt-topbar__user" data-menu="usuario">' + App.ui.avatar(me, 'sm') +
      '<span class="lt-topbar__user-text"><span class="lt-topbar__user-name">' + esc(me.nome) + '</span><span class="lt-topbar__user-role" style="display:block">' + esc(me.cargoCurto || me.cargo) + '</span></span>' +
      App.icon('chevron-down') + '</button></div>' +
      '</div>' +
      '</header>' +
      '<main class="lt-content" id="lt-content" tabindex="-1"></main>' +
      '<footer class="lt-screen-id" id="lt-screen-id"></footer>' +
      '</div>' +
      '</div>';
  }

  function updateMapaCount() {
    var el = document.getElementById('lt-mapa-count'); if (!el) return;
    var apr = util.store.get('atlas-aprovacoes', {}) || {};
    var ok = App.screens.filter(function (s) { return apr[s.id] && apr[s.id].status === 'aprovada'; }).length;
    el.textContent = ok + '/' + App.screens.length;
  }
  App.updateMapaCount = updateMapaCount;

  /* ---------- "Ver como": simula o papel para a Atlas aprovar o que cada perfil enxerga ----------
     Troca o usuário logado (App.meId) por uma pessoa do papel escolhido. Nesta rodada o papel muda
     o menu (grupos sem permissão somem e a rota mostra "Sem acesso"), o botão Novo, o Início e a Intranet.
     Módulos podem ler App.escopo('crm.deal.read') → 'todos' | 'proprios' | 'equipe' | null. */
  App.meIdReal = App.meId;
  App.verComoOpcoes = [
    { id: 1, rotulo: 'Sócia · administradora' },
    { id: 3, rotulo: 'Consultora comercial' },
    { id: 7, rotulo: 'Advogada' },
    { id: 10, rotulo: 'Financeiro' }
  ];
  var NAV_PERM = { crm: ['crm.deal.read'], juridico: ['jur.case.read'], financeiro: ['fin.read'], intranet: ['int.read'], config: ['core.users.manage', 'core.settings.manage', 'core.flow.read', 'core.audit.read'] };
  App.perm = function (key, papel) { var v = null; (App.data.permissoes || []).forEach(function (g) { g.itens.forEach(function (it) { if (it.key === key) v = it.v[papel] || null; }); }); return v; };
  App.escopo = function (key) { var me = App.db.me(); return !me || me.papel === 'socio' ? 'todos' : App.perm(key, me.papel); };
  App.podeVerGrupo = function (grupo) {
    var me = App.db.me(); if (!me || me.papel === 'socio') return true;
    var ks = NAV_PERM[grupo]; if (!ks) return true;
    return ks.some(function (k) { return !!App.perm(k, me.papel); });
  };
  function podeAbrir(screen) { return !screen || !screen.navGroup || App.podeVerGrupo(screen.navGroup); }
  function papelNome(p) { var r = (App.data.papeis || []).find(function (x) { return x.key === p.papel; }); return r ? r.nome : p.cargoCurto; }
  function semAcessoHtml(screen) {
    var me = App.db.me() || {}, g = App.navGroups.find(function (x) { return x.key === screen.navGroup; }) || { label: screen.navGroup };
    return App.ui.empty({ icon: 'lock', title: 'Sem acesso com este papel', text: 'Vendo como ' + esc(me.nome) + ' (' + esc(papelNome(me)) + '). Este papel não vê ' + esc(g.label) + '. As permissões ficam em Configurações → Usuários e papéis.', action: '<button type="button" class="lt-btn lt-btn--primary" data-ver-como="' + App.meIdReal + '">' + App.icon('arrow-left') + '<span>Voltar a ver como sócia</span></button>' });
  }
  function viewAsBanner() {
    var main = document.querySelector('.lt-main'); if (!main) return;
    var el = document.getElementById('lt-viewas');
    if (App.meId === App.meIdReal) { if (el) el.remove(); return; }
    var me = App.db.me() || {};
    if (!el) { el = document.createElement('div'); el.id = 'lt-viewas'; el.className = 'lt-viewas'; el.setAttribute('role', 'status'); main.insertBefore(el, main.firstChild); }
    el.innerHTML = App.icon('eye') + '<span>Vendo como <b>' + esc(me.nome) + '</b> · ' + esc(papelNome(me)) + '. O papel muda o menu, o Início e as listas (só os próprios registros).</span>' +
      '<button type="button" class="lt-btn lt-btn--xs lt-btn--outline" data-ver-como="' + App.meIdReal + '">Voltar a ver como sócia</button>';
  }
  App.verComo = function (id, silencioso) {
    if (!App.db.pessoa(id)) return;
    App.meId = id; App.state.inicioPessoa = null;
    var root = document.getElementById('app'); if (root) root.innerHTML = '';
    App.render();
    if (!silencioso) { var p = App.db.me(); ui.toast(id === App.meIdReal ? 'De volta ao seu acesso' : 'Vendo como ' + p.nome, 'info', id === App.meIdReal ? 'Você vê tudo de novo, como sócia.' : esc(papelNome(p)) + ': o menu mostra só o que este papel acessa.'); }
  };

  App.render = function () {
    var root = document.getElementById('app');
    if (!root) return;
    var r = App.parseHash();
    var screen = r.screen, params = r.params;
    App.ui.closeAll(true);
    closeMenus();
    if (!screen) screen = App._notFound;
    App.current = { screen: screen, params: params };

    var hashShown = screen.hash + (params.id != null ? '-' + params.id : '');
    if (screen.layout === 'blank') {
      root.innerHTML = '<div class="lt-blank" id="lt-content">' + safeRender(screen, params) + '</div>' +
        '<footer class="lt-screen-id lt-screen-id--float"><span>ID da tela: <code>' + esc(screen.id) + '</code> · <code>#' + esc(hashShown) + '</code></span></footer>';
      document.title = screen.title + ' · Atlas';
      safeMount(screen, document.getElementById('lt-content'), params);
      App.ui.enhance(root);
      return;
    }
    if (!document.getElementById('lt-shell')) {
      root.innerHTML = shellHtml();
      App.theme.syncButton();
    }
    var shell = document.getElementById('lt-shell');
    shell.classList.remove('is-drawer-open');
    document.getElementById('lt-nav').innerHTML = navHtml(screen);
    /* destaque dos atalhos do rodapé do menu (Mapa, Componentes) e do sino (Notificações) */
    [].forEach.call(shell.querySelectorAll('[data-foot-link]'), function (a) { var on = a.getAttribute('data-foot-link') === screen.hash; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var bell = document.getElementById('lt-bell'); if (bell) { if (screen.hash === 'notificacoes') bell.setAttribute('aria-current', 'page'); else bell.removeAttribute('aria-current'); }
    var badge = document.getElementById('lt-notif-badge'); if (badge) { var n = naoLidas(); badge.textContent = n; badge.hidden = !n; }
    viewAsBanner();
    var content = document.getElementById('lt-content');
    content.innerHTML = podeAbrir(screen) ? safeRender(screen, params) : semAcessoHtml(screen);
    document.getElementById('lt-screen-id').innerHTML =
      '<span>ID da tela: <code>' + esc(screen.id) + '</code> · <code>#' + esc(hashShown) + '</code></span>' +
      '<span>Protótipo navegável · dados fictícios · <a href="#mapa">Mapa de telas</a></span>';
    document.title = (screen.title || 'Atlas') + ' · Atlas';
    window.scrollTo(0, 0);
    if (podeAbrir(screen)) safeMount(screen, content, params);
    App.ui.enhance(content);
    updateMapaCount();
    progressBar();
  };

  function safeRender(screen, params) {
    try { return screen.render(params || {}) || ''; }
    catch (e) {
      console.error(e);
      return App.ui.callout({ tone: 'danger', icon: 'alert-triangle', title: 'Erro ao desenhar a tela ' + screen.id, text: esc(e.message) });
    }
  }
  function safeMount(screen, root, params) {
    if (typeof screen.mount !== 'function') return;
    try { screen.mount(root, params || {}); } catch (e) { console.error(e); App.ui.toast('Erro no script da tela', 'danger', esc(e.message)); }
  }
  function progressBar() {
    var b = document.getElementById('lt-progress');
    if (!b) { b = document.createElement('div'); b.id = 'lt-progress'; b.className = 'lt-progress-top'; document.body.appendChild(b); }
    b.style.opacity = '1'; b.style.width = '70%';
    setTimeout(function () { b.style.width = '100%'; setTimeout(function () { b.style.opacity = '0'; b.style.width = '0'; }, 250); }, 120);
  }

  App._notFound = {
    id: 'core.notfound', hash: 'nao-encontrada', title: 'Tela não encontrada', module: 'core', layout: 'app',
    render: function (p) {
      return App.ui.empty({ icon: 'map', title: 'Esta tela ainda não existe', text: 'O endereço #' + esc(p.hash || '') + ' não corresponde a nenhuma tela registrada. Ela pode pertencer a um módulo que ainda está sendo montado.', action: '<a class="lt-btn lt-btn--primary" href="#mapa">' + App.icon('map') + '<span>Abrir o mapa de telas</span></a>' });
    }
  };

  /* ------------------------------------------------------------------ */
  /* HELPERS DE UI (todos devolvem string HTML)                           */
  /* ------------------------------------------------------------------ */
  var ui = App.ui;
  function attrs(o) {
    if (!o) return '';
    return Object.keys(o).map(function (k) { var v = o[k]; if (v === false || v == null) return ''; return ' ' + k + (v === true ? '' : '="' + esc(v) + '"'); }).join('');
  }
  ui.attrs = attrs;

  /* Botão. ui.btn({ label, variant:'primary'|'secondary'|'outline'|'default'|'ghost'|'danger'|'danger-outline'|'add', icon, iconRight, size:'xs'|'sm'|'lg',
       acao:'salvar' (liga spinner+toast), toast:'Negócio salvo', toastText, loading:'Salvando…', confirm:'Excluir negócio?', confirmText, fechar:'sheet'|'dialog', ir:'hash',
       sheet:'nome' (abre sheet registrada), dialog:'nome', href:'#hash', block, disabled, attrs:{}, title }) */
  ui.btn = function (o) {
    o = o || {};
    var cls = 'lt-btn lt-btn--' + (o.variant || 'default') + (o.size ? ' lt-btn--' + o.size : '') + (o.block ? ' lt-btn--block' : '') + (!o.label ? ' lt-btn--icon' : '') + (o.cls ? ' ' + o.cls : '');
    var inner = (o.icon ? App.icon(o.icon) : '') + (o.label ? '<span>' + esc(o.label) + '</span>' : '') + (o.iconRight ? App.icon(o.iconRight) : '');
    var a = Object.assign({}, o.attrs || {});
    if (o.acao) a['data-acao'] = o.acao;
    if (o.toast) a['data-toast'] = o.toast;
    if (o.toastText) a['data-toast-text'] = o.toastText;
    if (o.toastTone) a['data-toast-tone'] = o.toastTone;
    if (o.loading) a['data-loading'] = o.loading;
    if (o.confirm) a['data-confirm'] = o.confirm;
    if (o.confirmText) a['data-confirm-text'] = o.confirmText;
    if (o.confirmLabel) a['data-confirm-label'] = o.confirmLabel;
    if (o.fechar) a['data-fechar'] = o.fechar;
    if (o.ir) a['data-ir'] = o.ir;
    if (o.sheet) a['data-sheet'] = o.sheet;
    if (o.dialog) a['data-dialog'] = o.dialog;
    if (o.title || (!o.label && o.tip)) { a['aria-label'] = o.title || o.tip; a.title = o.title || o.tip; }
    if (o.disabled) a.disabled = true;
    if (o.href) return '<a class="' + cls + '" href="' + esc(o.href) + '"' + attrs(a) + '>' + inner + '</a>';
    return '<button type="button" class="' + cls + '"' + attrs(a) + '>' + inner + '</button>';
  };

  /* Chip de status. ui.chip('Em aberto','blue',{dot:true, icon:'clock', solid:false, lg:false}) */
  ui.chip = function (label, tone, o) {
    o = o || {};
    return '<span class="lt-chip' + (o.dot ? ' lt-chip--dot' : '') + (o.solid ? ' lt-chip--solid' : '') + (o.lg ? ' lt-chip--lg' : '') + '"' + (tone ? ' data-tone="' + tone + '"' : '') + (o.title ? ' title="' + esc(o.title) + '"' : '') + '>' + (o.icon ? App.icon(o.icon) : '') + esc(label) + '</span>';
  };
  /* Chip a partir de App.status: ui.status('pendente') */
  ui.status = function (key, o) { var s = App.status[key] || [key, 'gray']; return ui.chip(s[0], s[1], Object.assign({ dot: true }, o || {})); };
  ui.badge = function (n, variant) { return '<span class="lt-badge' + (variant ? ' lt-badge--' + variant : '') + '">' + esc(n) + '</span>'; };

  /* Avatar: aceita pessoa {nome, tone}, id da equipe ou nome. size: 'xs'|'sm'|''|'lg'|'xl' */
  ui.avatar = function (p, size) {
    if (typeof p === 'number' || (typeof p === 'string' && /^\d+$/.test(p))) p = App.db.pessoa(p);
    if (typeof p === 'string') p = { nome: p };
    p = p || { nome: '?' };
    return '<span class="lt-avatar' + (size ? ' lt-avatar--' + size : '') + '"' + (p.tone ? ' data-tone="' + p.tone + '"' : '') + ' title="' + esc(p.nome) + '">' + esc(fmt.iniciais(p.nome)) + '</span>';
  };
  /* Pessoa com avatar e nome (+ meta opcional) */
  ui.person = function (p, meta, size) {
    if (typeof p === 'number' || (typeof p === 'string' && /^\d+$/.test(p))) p = App.db.pessoa(p);
    if (typeof p === 'string') p = { nome: p };
    p = p || { nome: '—' };
    return '<span class="lt-person">' + ui.avatar(p, size || 'sm') + '<span class="lt-truncate"><span class="lt-person__name">' + esc(p.nome) + '</span>' + (meta ? '<span class="lt-person__meta">' + meta + '</span>' : '') + '</span></span>';
  };

  /* Cabeçalho de página. ui.pageHeader({ eyebrow, title, sub, breadcrumb:[{label,hash}], actions: html, meta: html }) */
  ui.pageHeader = function (o) {
    return '<div class="lt-page-header"><div class="lt-page-header__titles">' +
      (o.breadcrumb ? ui.breadcrumb(o.breadcrumb) : '') +
      (o.eyebrow ? '<span class="lt-eyebrow">' + esc(o.eyebrow) + '</span>' : '') +
      '<h1 class="lt-page-title">' + esc(o.title) + '</h1>' +
      (o.sub ? '<p class="lt-page-sub">' + o.sub + '</p>' : '') +
      (o.meta ? '<div class="lt-page-header__meta">' + o.meta + '</div>' : '') +
      '</div>' + (o.actions ? '<div class="lt-page-header__actions">' + o.actions + '</div>' : '') + '</div>';
  };
  ui.breadcrumb = function (items) {
    return '<nav class="lt-breadcrumb" aria-label="Caminho">' + items.map(function (it, i) {
      var last = i === items.length - 1;
      return (i ? App.icon('chevron-right') : '') + (last || !it.hash ? '<span' + (last ? ' aria-current="page"' : '') + '>' + esc(it.label) + '</span>' : '<a href="#' + esc(it.hash) + '">' + esc(it.label) + '</a>');
    }).join('') + '</nav>';
  };

  /* Card. ui.card({ title, icon, sub, actions, body, foot, flush, accent, cls, attrs }) */
  ui.card = function (o) {
    return '<section class="lt-card' + (o.accent ? ' lt-card--accent' : '') + (o.cls ? ' ' + o.cls : '') + '"' + attrs(o.attrs) + '>' +
      (o.title ? '<header class="lt-card__head"><div style="min-width:0"><h2 class="lt-card__title">' + (o.icon ? App.icon(o.icon) : '') + esc(o.title) + '</h2>' + (o.sub ? '<div class="lt-card__sub">' + o.sub + '</div>' : '') + '</div>' + (o.actions ? '<div class="lt-card__actions">' + o.actions + '</div>' : '') + '</header>' : '') +
      '<div class="lt-card__body' + (o.flush ? ' lt-card__body--flush' : '') + '">' + (o.body || '') + '</div>' +
      (o.foot ? '<footer class="lt-card__foot">' + o.foot + '</footer>' : '') + '</section>';
  };

  /* Card de seção de formulário colorido.
     ui.section({ title, sub, tone:'gold'|'blue'|'green'|'amber'|'violet'|'slate'|'red', icon, cols:1|2|3|4, body, aside }) */
  ui.section = function (o) {
    var body = o.cols ? '<div class="lt-grid lt-grid--' + o.cols + '">' + (o.body || '') + '</div>' : (o.body || '');
    return '<section class="lt-section" data-tone="' + (o.tone || 'gold') + '"' + attrs(o.attrs) + '>' +
      '<header class="lt-section__head"><span class="lt-section__icon">' + App.icon(o.icon || 'file-text') + '</span><div><div class="lt-section__title">' + esc(o.title) + '</div>' + (o.sub ? '<div class="lt-section__sub">' + o.sub + '</div>' : '') + '</div>' + (o.aside ? '<div class="lt-section__aside">' + o.aside + '</div>' : '') + '</header>' +
      '<div class="lt-section__body">' + body + '</div></section>';
  };

  /* Campo. ui.field({ label, name, type, value, options, placeholder, hint, error, required, span:2|3|'full', disabled, readonly, rows, prefix, suffix, checked })
     type: text|email|password|number|date|time|datetime-local|money|percent|cnpj|cpf|phone|cep|select|multiselect|textarea|toggle|checkbox|checks|radio|upload|search|static */
  ui.field = function (o) {
    o = o || {};
    var id = o.id || (o.name ? 'f-' + o.name + '-' + Math.random().toString(36).slice(2, 6) : util.uid('f'));
    var t = o.type || 'text';
    var spanCls = o.span === 'full' ? ' lt-span-full' : (o.span ? ' lt-span-' + o.span : '');
    var common = attrs({ id: id, name: o.name, placeholder: o.placeholder, disabled: !!o.disabled, readonly: !!o.readonly, required: !!o.required, 'aria-invalid': o.error ? 'true' : null });
    var control = '';
    var opts = (o.options || []).map(function (x) { return typeof x === 'object' ? x : { value: x, label: x }; });
    switch (t) {
      case 'select':
      case 'multiselect':
        control = '<select class="lt-select"' + common + (t === 'multiselect' ? ' multiple style="height:auto;min-height:80px;padding:6px"' : '') + '>' +
          (o.placeholder && t === 'select' ? '<option value="">' + esc(o.placeholder) + '</option>' : '') +
          opts.map(function (x) { var sel = Array.isArray(o.value) ? o.value.indexOf(x.value) >= 0 : String(x.value) === String(o.value); return '<option value="' + esc(x.value) + '"' + (sel ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '</select>';
        break;
      case 'textarea':
        control = '<textarea class="lt-textarea"' + common + ' rows="' + (o.rows || 3) + '">' + esc(o.value || '') + '</textarea>';
        break;
      case 'money':
        control = '<div class="lt-input-group"><span class="lt-input-group__addon">R$</span><input class="lt-input lt-input--num" inputmode="decimal" data-mask="money"' + common + ' value="' + esc(o.value != null && o.value !== '' ? fmt.num(o.value, 2) : '') + '"></div>';
        break;
      case 'percent':
        control = '<div class="lt-input-group"><input class="lt-input lt-input--num" inputmode="decimal"' + common + ' value="' + esc(o.value != null ? fmt.num(o.value, o.dec == null ? 1 : o.dec) : '') + '"><span class="lt-input-group__addon">%</span></div>';
        break;
      case 'cnpj': case 'cpf': case 'phone': case 'cep':
        var ph = { cnpj: '00.000.000/0000-00', cpf: '000.000.000-00', phone: '(19) 90000-0000', cep: '00000-000' }[t];
        var v = o.value ? (t === 'cnpj' ? fmt.cnpj(o.value) : t === 'cpf' ? fmt.cpf(o.value) : t === 'phone' ? fmt.telefone(o.value) : fmt.cep(o.value)) : '';
        control = '<input class="lt-input" inputmode="numeric" data-mask="' + t + '"' + attrs({ id: id, name: o.name, placeholder: o.placeholder || ph, disabled: !!o.disabled, readonly: !!o.readonly }) + ' value="' + esc(v) + '">';
        break;
      case 'toggle':
        return '<div class="lt-field' + spanCls + '">' + (o.label && o.toggleLabel ? '<span class="lt-label">' + esc(o.label) + '</span>' : '') +
          '<label class="lt-toggle"><input type="checkbox"' + attrs({ id: id, name: o.name, checked: !!o.checked || !!o.value, disabled: !!o.disabled }) + '><span class="lt-toggle__track"></span><span>' + esc(o.toggleLabel || o.label) + '</span></label>' +
          (o.hint ? '<span class="lt-hint">' + o.hint + '</span>' : '') + '</div>';
      case 'checkbox':
        return '<div class="lt-field' + spanCls + '"><label class="lt-check"><input type="checkbox"' + attrs({ id: id, name: o.name, checked: !!o.checked || !!o.value, disabled: !!o.disabled }) + '><span>' + esc(o.label) + '</span></label>' + (o.hint ? '<span class="lt-hint" style="padding-left:24px">' + o.hint + '</span>' : '') + '</div>';
      case 'checks':
      case 'radio':
        var isR = t === 'radio', nm = o.name || id;
        var val = o.value;
        control = '<div class="' + (o.inline ? 'lt-choice-row' : 'lt-choice-list') + '" role="' + (isR ? 'radiogroup' : 'group') + '">' + opts.map(function (x) {
          var on = Array.isArray(val) ? val.indexOf(x.value) >= 0 : String(val) === String(x.value);
          return '<label class="' + (isR ? 'lt-radio' : 'lt-check') + '"><input type="' + (isR ? 'radio' : 'checkbox') + '" name="' + esc(nm) + '" value="' + esc(x.value) + '"' + (on ? ' checked' : '') + (o.disabled ? ' disabled' : '') + '><span>' + esc(x.label) + (x.hint ? '<span class="lt-hint" style="display:block">' + esc(x.hint) + '</span>' : '') + '</span></label>';
        }).join('') + '</div>';
        break;
      case 'upload':
        control = '<label class="lt-upload" data-upload>' + App.icon('upload') + '<span><strong>Arraste o arquivo</strong> ou clique para escolher</span><span class="lt-hint">' + esc(o.accept || 'PDF, DOCX, XLSX, JPG ou PNG · até 25 MB') + '</span><input type="file" class="lt-sr"' + (o.multiple ? ' multiple' : '') + '></label>' +
          (o.files ? o.files.map(function (f) { return '<div class="lt-upload__file">' + App.icon('file-text') + '<span class="lt-truncate" style="flex:1">' + esc(f.nome) + '</span><span class="lt-hint">' + esc(f.tamanho || '') + '</span>' + ui.btn({ icon: 'x', variant: 'ghost', size: 'xs', tip: 'Remover arquivo' }) + '</div>'; }).join('') : '');
        break;
      case 'static':
        control = '<div style="min-height:38px;display:flex;align-items:center;font-weight:500">' + (o.html || esc(o.value || '—')) + '</div>';
        break;
      case 'search':
        control = '<div class="lt-input-icon">' + App.icon('search') + '<input class="lt-input" type="search"' + common + ' value="' + esc(o.value || '') + '"></div>';
        break;
      default:
        control = '<input class="lt-input' + (t === 'number' ? ' lt-input--num' : '') + '" type="' + t + '"' + common + ' value="' + esc(o.value == null ? '' : o.value) + '">';
        if (o.prefix || o.suffix) control = '<div class="lt-input-group">' + (o.prefix ? '<span class="lt-input-group__addon">' + esc(o.prefix) + '</span>' : '') + control + (o.suffix ? '<span class="lt-input-group__addon">' + esc(o.suffix) + '</span>' : '') + '</div>';
    }
    return '<div class="lt-field' + spanCls + (o.error ? ' is-invalid' : '') + '">' +
      (o.label ? '<label class="lt-label" for="' + id + '">' + esc(o.label) + (o.required ? '<span class="lt-req" aria-hidden="true">*</span>' : '') + '</label>' : '') +
      control +
      (o.error ? '<span class="lt-error-text">' + App.icon('alert-circle') + esc(o.error) + '</span>' : (o.hint ? '<span class="lt-hint">' + o.hint + '</span>' : '')) + '</div>';
  };

  /* KPI. ui.kpi({ label, value, unit, icon, delta:'+12%', dir:'up'|'down'|'flat', good:true (verde quando sobe), foot, progress:{value,max,tone}, href }) */
  ui.kpi = function (o) {
    var dir = o.dir || 'flat';
    var good = o.good == null ? true : o.good;
    var dcls = dir === 'flat' ? 'is-flat' : ((dir === 'up') === good ? 'is-up' : 'is-down');
    var foot = '';
    if (o.delta) foot += '<span class="lt-delta ' + dcls + '">' + App.icon(dir === 'up' ? 'trending-up' : dir === 'down' ? 'trending-down' : 'minus') + esc(o.delta) + '</span>';
    if (o.foot) foot += '<span>' + o.foot + '</span>';
    var prog = o.progress ? '<div class="lt-progress" data-tone="' + (o.progress.tone || '') + '" title="' + fmt.pct(100 * o.progress.value / o.progress.max) + '"><span style="width:' + util.clamp(100 * o.progress.value / o.progress.max, 0, 100) + '%"></span></div>' : '';
    var tag = o.href ? 'a' : 'div';
    return '<' + tag + ' class="lt-kpi' + (o.href ? ' lt-card--hover' : '') + '"' + (o.href ? ' href="' + esc(o.href) + '" style="text-decoration:none"' : '') + '>' +
      '<div class="lt-kpi__head"><span class="lt-kpi__label">' + esc(o.label) + '</span>' + (o.icon ? '<span class="lt-kpi__icon">' + App.icon(o.icon) + '</span>' : '') + '</div>' +
      '<div class="lt-kpi__value">' + esc(o.value) + (o.unit ? '<small>' + esc(o.unit) + '</small>' : '') + '</div>' + prog +
      (foot ? '<div class="lt-kpi__foot">' + foot + '</div>' : '') + '</' + tag + '>';
  };
  ui.kpis = function (arr) { return '<div class="lt-kpi-grid">' + arr.map(ui.kpi).join('') + '</div>'; };
  ui.progress = function (value, max, tone, lg) { return '<div class="lt-progress' + (lg ? ' lt-progress--lg' : '') + '"' + (tone ? ' data-tone="' + tone + '"' : '') + '><span style="width:' + util.clamp(100 * value / (max || 1), 0, 100) + '%"></span></div>'; };

  /* Estado vazio. ui.empty({ icon, title, text, action (html), small }) */
  ui.empty = function (o) {
    return '<div class="lt-empty' + (o.small ? ' lt-empty--sm' : '') + '"><span class="lt-empty__icon">' + App.icon(o.icon || 'inbox') + '</span><div class="lt-empty__title">' + esc(o.title) + '</div>' + (o.text ? '<p class="lt-empty__text">' + o.text + '</p>' : '') + (o.action ? '<div class="lt-row" style="justify-content:center;margin-top:8px">' + o.action + '</div>' : '') + '</div>';
  };
  /* Skeleton. ui.skeleton({ lines:4, title:true, avatar:false }) */
  ui.skeleton = function (o) {
    o = o || {}; var s = '';
    if (o.title !== false) s += '<div class="lt-skel lt-skel--title"></div>';
    for (var i = 0; i < (o.lines || 4); i++) s += '<div class="lt-row lt-row--nowrap">' + (o.avatar ? '<div class="lt-skel lt-skel--circle"></div>' : '') + '<div class="lt-skel lt-skel--line" style="flex:1;width:' + (60 + (i * 13) % 40) + '%"></div></div>';
    return '<div aria-busy="true" aria-label="Carregando">' + s + '</div>';
  };
  /* Aviso em linha. ui.callout({ tone:'info'|'success'|'warning'|'danger'|'gold', icon, title, text, actions }) */
  ui.callout = function (o) {
    var ic = o.icon || { success: 'check-circle', warning: 'alert-triangle', danger: 'alert-circle', gold: 'info' }[o.tone] || 'info';
    return '<div class="lt-callout"' + (o.tone ? ' data-tone="' + o.tone + '"' : '') + ' role="' + (o.tone === 'danger' ? 'alert' : 'status') + '">' + App.icon(ic) + '<div style="min-width:0">' + (o.title ? '<div class="lt-callout__title">' + o.title + '</div>' : '') + (o.text ? '<div class="lt-callout__text">' + o.text + '</div>' : '') + '</div>' + (o.actions ? '<div class="lt-callout__actions">' + o.actions + '</div>' : '') + '</div>';
  };
  /* Lista de definição (resumo de ficha). ui.dl([['CNPJ','12.345…'], ['Regime', ui.chip(...)]], {stack}) — valores são HTML */
  ui.dl = function (pairs, o) { return '<dl class="lt-dl' + (o && o.stack ? ' lt-dl--stack' : '') + '">' + pairs.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + (p[1] == null || p[1] === '' ? '—' : p[1]) + '</dd>'; }).join('') + '</dl>'; };
  /* Faixa de resumo. ui.summary([{label, value}]) */
  ui.summary = function (items) { return '<div class="lt-summary">' + items.map(function (i) { return '<div class="lt-summary__item"><div class="lt-summary__label">' + esc(i.label) + '</div><div class="lt-summary__value">' + i.value + '</div></div>'; }).join('') + '</div>'; };
  /* Caixa de data (dia/mês). ui.dateBox('2026-11-10','red') */
  ui.dateBox = function (d, tone) { d = util.parse(d); return '<span class="lt-date-box"' + (tone ? ' data-tone="' + tone + '"' : '') + '><span class="lt-date-box__m" style="display:block">' + MESES_CURTOS[d.getMonth()] + '</span><span class="lt-date-box__d" style="display:block">' + pad(d.getDate()) + '</span></span>'; };
  /* Lista de linhas. ui.list([{ icon, tone, lead(html no lugar do ícone), title, meta(html), aside(html), href, sheet, unread, attrs }]) */
  ui.list = function (items, o) {
    if (!items.length) return ui.empty(Object.assign({ small: true, icon: 'inbox', title: 'Nada por aqui' }, (o && o.empty) || {}));
    return '<ul class="lt-list">' + items.map(function (it) {
      var lead = it.lead || (it.icon ? '<span class="lt-list__icon"' + (it.tone ? ' data-tone="' + it.tone + '"' : '') + '>' + App.icon(it.icon) + '</span>' : '');
      var inner = lead + '<div class="lt-list__body"><div class="lt-list__title lt-truncate">' + it.title + '</div>' + (it.meta ? '<div class="lt-list__meta">' + it.meta + '</div>' : '') + '</div>' + (it.aside ? '<div class="lt-list__aside">' + it.aside + '</div>' : '');
      var a = Object.assign({}, it.attrs || {});
      if (it.sheet) { a['data-sheet'] = it.sheet; }
      var cls = 'lt-list__item' + (it.unread ? ' is-unread' : '') + (it.sheet ? ' is-link' : '');
      if (it.href) return '<li><a class="' + cls + '" href="' + esc(it.href) + '"' + attrs(a) + '>' + inner + '</a></li>';
      return '<li class="' + cls + '"' + attrs(a) + (it.sheet ? ' role="button" tabindex="0"' : '') + '>' + inner + '</li>';
    }).join('') + '</ul>';
  };

  /* Filtros. ui.filters({ busca:'Buscar…', selects:[{ label:'Consultor', options:[...], value }], chips:[{label, active, value}], chipGroup:'single'|'multi', extra:html }) */
  ui.filters = function (o) {
    var s = '<div class="lt-filters">';
    if (o.busca) s += '<div class="lt-filters__search">' + App.icon('search') + '<input class="lt-input" type="search" placeholder="' + esc(o.busca) + '" aria-label="' + esc(o.busca) + '" data-filter-search></div>';
    (o.selects || []).forEach(function (f) {
      s += '<select class="lt-select" aria-label="' + esc(f.label) + '"' + (f.name ? ' name="' + esc(f.name) + '"' : '') + '><option value="">' + esc(f.label) + ': todos</option>' +
        (f.options || []).map(function (x) { x = typeof x === 'object' ? x : { value: x, label: x }; return '<option value="' + esc(x.value) + '"' + (String(x.value) === String(f.value) ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '</select>';
    });
    if (o.chips) s += '<div class="lt-chips" data-filter-group="' + (o.chipGroup || 'multi') + '">' + o.chips.map(function (c) { return '<button type="button" class="lt-filter-chip' + (c.active ? ' is-active' : '') + '" data-value="' + esc(c.value || c.label) + '">' + (c.tone ? '<span class="lt-filter-chip__dot" style="color:var(--tone-' + c.tone + '-solid)"></span>' : '') + esc(c.label) + (c.count != null ? ' <span class="lt-muted lt-num">' + c.count + '</span>' : '') + '</button>'; }).join('') + '</div>';
    s += '<span class="lt-filters__spacer"></span>' + (o.extra || '') + '</div>';
    return s;
  };
  /* Botões segmentados. ui.segmented([{label, value, active}], {name}) — dispara 'lt:segment' {name, value} */
  ui.segmented = function (items, o) {
    return '<div class="lt-segmented" role="group"' + (o && o.name ? ' data-seg="' + esc(o.name) + '"' : '') + '>' + items.map(function (i) { return '<button type="button" data-value="' + esc(i.value) + '"' + (i.tab ? ' data-tab="' + esc(i.tab) + '"' : '') + ' class="' + (i.active ? 'is-active' : '') + '">' + (i.icon ? App.icon(i.icon) : '') + esc(i.label) + '</button>'; }).join('') + '</div>';
  };

  /* Abas. ui.tabs({ id, active, tabs:[{ key, label, icon, count, content }] }) — troca sem recarregar; dispara 'lt:tab' */
  ui.tabs = function (o) {
    var active = (o.id && App.state['tab-' + o.id]) || o.active || (o.tabs[0] && o.tabs[0].key);
    if (!o.tabs.some(function (t) { return t.key === active; })) active = o.tabs[0].key;
    return '<div class="lt-tabs-root"' + (o.id ? ' data-tabs-id="' + esc(o.id) + '"' : '') + '><div class="lt-tabs' + (o.small ? ' lt-tabs--sm' : '') + '" role="tablist">' +
      o.tabs.map(function (t) { return '<button type="button" role="tab" class="lt-tab' + (t.key === active ? ' is-active' : '') + '" data-tab="' + esc(t.key) + '" aria-selected="' + (t.key === active) + '">' + (t.icon ? App.icon(t.icon) : '') + esc(t.label) + (t.count != null ? '<span class="lt-tab__count">' + esc(t.count) + '</span>' : '') + '</button>'; }).join('') +
      '</div>' + o.tabs.map(function (t) { return '<div class="lt-tabpanel" role="tabpanel" data-panel="' + esc(t.key) + '"' + (t.key === active ? '' : ' hidden') + '>' + (t.content || '') + '</div>'; }).join('') + '</div>';
  };

  /* Linha do tempo. ui.timeline([{ icon, tone, title, meta(html), text(html), day:'Hoje' (separador) }]) */
  ui.timeline = function (items) {
    var s = '<ol class="lt-timeline">';
    items.forEach(function (it) {
      if (it.day) s += '<li class="lt-timeline__day">' + esc(it.day) + '</li>';
      if (!it.title) return;
      s += '<li class="lt-timeline__item"><span class="lt-timeline__dot"' + (it.tone ? ' data-tone="' + it.tone + '"' : '') + '>' + App.icon(it.icon || 'dot') + '</span><div style="min-width:0"><div class="lt-timeline__title">' + it.title + '</div>' + (it.meta ? '<div class="lt-timeline__meta">' + it.meta + '</div>' : '') + (it.text ? '<div class="lt-timeline__text">' + it.text + '</div>' : '') + '</div></li>';
    });
    return s + '</ol>';
  };

  /* Tabela de dados.
     ui.table({ id, columns:[{ key, label, align:'right'|'center', width, sortable, render(row,i)→html, value(row)→valor de ordenação, cls }],
                rows, selectable, rowActions(row)→html, rowHref(row)→'#hash', rowSheet(row)→{sheet, params}, rowClass(row),
                pageSize, maxHeight, compact, empty:{icon,title,text,action}, bulk: html (ações em lote), foot:[html por coluna] }) */
  ui.table = function (o) {
    var cols = o.columns || [], rows = o.rows || [];
    if (!rows.length) return '<div class="lt-table-card">' + ui.empty(Object.assign({ icon: 'inbox', title: 'Nenhum registro encontrado', text: 'Ajuste os filtros ou cadastre um novo registro.' }, o.empty || {})) + '</div>';
    var ps = o.pageSize || 0;
    var h = '<div class="lt-table-card" data-lt-table' + (o.id ? ' id="' + esc(o.id) + '"' : '') + (ps ? ' data-page-size="' + ps + '"' : '') + '>';
    if (o.selectable) h += '<div class="lt-table-toolbar" hidden data-bulkbar><span><b data-sel-count>0</b> <span data-sel-label>selecionados</span></span>' + (o.bulk || '') + '<span class="lt-push"></span>' + '<button type="button" class="lt-btn lt-btn--ghost lt-btn--xs" data-sel-clear>Limpar seleção</button></div>';
    h += '<div class="lt-table-wrap' + (o.maxHeight ? ' lt-table-wrap--fixed' : '') + '"' + (o.maxHeight ? ' style="max-height:' + o.maxHeight + 'px"' : '') + '><table class="lt-table' + (o.compact ? ' lt-table--compact' : '') + (o.cls ? ' ' + o.cls : '') + '"><thead><tr>';
    if (o.selectable) h += '<th class="lt-table__check"><label class="lt-check"><input type="checkbox" data-check-all aria-label="Selecionar todos"></label></th>';
    cols.forEach(function (c, i) {
      var cl = (c.sortable ? 'is-sortable ' : '') + (c.align === 'right' ? 'lt-num ' : c.align === 'center' ? 'lt-center ' : '') + (c.sorted ? 'is-sorted-' + c.sorted : '');
      h += '<th' + (cl.trim() ? ' class="' + cl.trim() + '"' : '') + ' data-col="' + i + '"' + (c.width ? ' style="width:' + c.width + '"' : '') + (c.title ? ' title="' + esc(c.title) + '"' : '') + (c.sortable ? ' aria-sort="' + (c.sorted === 'asc' ? 'ascending' : c.sorted === 'desc' ? 'descending' : 'none') + '"' : '') + '>' + esc(c.label) + (c.sortable ? '<span class="lt-sort" aria-hidden="true"></span>' : '') + '</th>';
    });
    if (o.rowActions) h += '<th class="lt-table__actions"><span class="lt-sr">Ações</span></th>';
    h += '</tr></thead><tbody>';
    rows.forEach(function (r, ri) {
      var a = { 'data-ri': ri };
      if (o.rowHref) { var href = o.rowHref(r); if (href) { a['data-href'] = href; } }
      if (o.rowSheet) { var sh = o.rowSheet(r); if (sh) { a['data-sheet'] = sh.sheet; Object.keys(sh.params || {}).forEach(function (k) { a['data-' + k] = sh.params[k]; }); } }
      var rc = (a['data-href'] || a['data-sheet'] ? 'is-link ' : '') + (o.rowClass ? o.rowClass(r) || '' : '');
      if (ps && ri >= ps) a.hidden = true;
      h += '<tr' + (rc.trim() ? ' class="' + rc.trim() + '"' : '') + attrs(a) + '>';
      if (o.selectable) h += '<td class="lt-table__check"><label class="lt-check"><input type="checkbox" data-check-row aria-label="Selecionar linha"></label></td>';
      cols.forEach(function (c, i) {
        var v = c.render ? c.render(r, ri) : esc(r[c.key]);
        var sv = c.value ? c.value(r) : r[c.key];
        /* objeto sem value(row) não vira "[object Object]": usa label/nome (ou nada) */
        if (sv != null && typeof sv === 'object') sv = sv.label != null ? sv.label : sv.nome != null ? sv.nome : '';
        h += '<td data-col="' + i + '" data-v="' + esc(sv == null ? '' : sv) + '"' + (c.align === 'right' ? ' class="lt-num"' : c.align === 'center' ? ' class="lt-center"' : c.cls ? ' class="' + c.cls + '"' : '') + '>' + (v == null ? '' : v) + '</td>';
      });
      if (o.rowActions) h += '<td class="lt-table__actions"><div class="lt-row-actions">' + o.rowActions(r) + '</div></td>';
      h += '</tr>';
    });
    h += '</tbody>';
    if (o.foot) h += '<tfoot><tr>' + (o.selectable ? '<td></td>' : '') + o.foot.map(function (f, i) { var c = cols[i] || {}; return '<td' + (c.align === 'right' ? ' class="lt-num"' : '') + '>' + (f || '') + '</td>'; }).join('') + (o.rowActions ? '<td></td>' : '') + '</tr></tfoot>';
    h += '</table></div>';
    if (ps && rows.length > ps) h += '<div class="lt-pagination" data-pagination></div>';
    else h += '<div class="lt-pagination"><span>' + fmt.plural(rows.length, 'registro') + '</span></div>';
    return h + '</div>';
  };

  /* Kanban.
     ui.kanban({ id, colunas:[{ id, num, titulo, cor:'var(--tone-blue-solid)', itens:[], total (número, opcional), desfecho:true (recolhida) }],
                 card(item, coluna) → html (use ui.kanbanCard) })
     Arrastar dispara no container o evento cancelável 'lt:kanban-move' { cardId, de, para, card } — chame e.preventDefault() para devolver o cartão. */
  ui.kanban = function (o) {
    return '<div class="lt-kanban" data-kanban' + (o.id ? ' id="' + esc(o.id) + '"' : '') + '>' + o.colunas.map(function (c) {
      var itens = c.itens || [];
      var total = c.total != null ? c.total : null;
      return '<section class="lt-kanban__col' + (c.desfecho ? ' is-outcome' : '') + '" data-col-id="' + esc(c.id) + '" style="--col-color:' + (c.cor || 'var(--gold)') + '"' + (c.desfecho ? ' title="' + esc(c.titulo) + ' · ' + itens.length + '"' : '') + '>' +
        '<header class="lt-kanban__col-head"><div class="lt-kanban__col-title">' + (c.num != null ? '<span class="lt-kanban__col-num">' + esc(c.num) + '</span>' : '') + '<span class="lt-truncate">' + esc(c.titulo) + '</span><span class="lt-kanban__col-count" data-col-count>' + itens.length + '</span></div>' +
        (total != null ? '<div class="lt-kanban__col-total" data-col-total>' + fmt.moedaCurta(total) + '</div>' : '') + '</header>' +
        '<div class="lt-kanban__cards" data-dropzone>' + itens.map(function (it) { return o.card(it, c); }).join('') + '</div></section>';
    }).join('') + '</div>';
  };
  /* Cartão de kanban. ui.kanbanCard({ id, href, title, sub, value (número), chips(html), meta(html), avatar(pessoa|id), late, warn }) */
  ui.kanbanCard = function (o) {
    return '<a class="lt-kanban__card' + (o.late ? ' is-late' : o.warn ? ' is-warn' : '') + '" draggable="true" data-card-id="' + esc(o.id) + '"' + (o.value != null ? ' data-valor="' + o.value + '"' : '') + ' href="' + esc(o.href || '#') + '">' +
      '<div class="lt-kanban__card-title">' + esc(o.title) + '</div>' + (o.sub ? '<div class="lt-kanban__card-sub lt-truncate">' + esc(o.sub) + '</div>' : '') +
      (o.chips ? '<div class="lt-chips">' + o.chips + '</div>' : '') +
      '<div class="lt-kanban__card-row">' + (o.value != null ? '<span class="lt-kanban__card-value">' + fmt.moedaCurta(o.value) + '</span>' : '<span></span>') + '<span class="lt-row lt-row--nowrap" style="gap:6px">' + (o.meta || '') + (o.avatar ? ui.avatar(o.avatar, 'xs') : '') + '</span></div></a>';
  };

  /* ---------- Gráficos SVG simples ---------- */
  var CH = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];
  /* máximo do eixo = 4 passos "redondos" (1, 2, 2,5, 5 ou 10 × 10^n) */
  function niceMax(v) { if (v <= 0) return 4; var raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; var m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10; return m * p * 4; }
  function legend(series, negativo) { return '<div class="lt-legend">' + series.map(function (s, i) { return '<span class="lt-legend__item"><span class="lt-legend__sw" style="background:' + (s.color || CH[i % 6]) + '"></span>' + esc(s.name) + '</span>'; }).join('') + (negativo ? '<span class="lt-legend__item"><span class="lt-legend__sw" style="background:var(--danger)"></span>Valor negativo</span>' : '') + '</div>'; }
  ui.chart = {
    COLORS: CH,
    /* ui.chart.bar({ labels, series:[{ name, values, color, negColor }], height:220, stacked:false, format:fn, legend:true, showValues:false })
       Aceita valores negativos: o eixo vai de min(0, menor valor) até o maior, a linha de base fica no zero
       e a barra negativa desce em var(--danger) (ou se.negColor). */
    bar: function (o) {
      var W = o.width || 520, H = o.height || 220, padL = 48, padB = 26, padT = 12, padR = 8;
      var labels = o.labels, series = o.series, f = o.format || function (v) { return fmt.num(v); };
      var max = 0, min = 0;
      labels.forEach(function (_, i) {
        if (o.stacked) { var sp = 0, sn = 0; series.forEach(function (se) { var v = se.values[i] || 0; if (v >= 0) sp += v; else sn += v; }); max = Math.max(max, sp); min = Math.min(min, sn); }
        else series.forEach(function (se) { var v = se.values[i] || 0; max = Math.max(max, v); min = Math.min(min, v); });
      });
      var top, bottom, step;
      if (min >= 0) { top = niceMax(max * 1.02); bottom = 0; step = top / 4; }
      else {
        step = niceMax((max - min) * 1.02) / 4;
        top = max > 0 ? Math.ceil(max * 1.02 / step) * step : 0;
        bottom = Math.floor(min * 1.02 / step) * step;
        if (top === bottom) top = bottom + step;
      }
      padL = Math.max(padL, Math.round(Math.max(String(f(top)).length, String(f(bottom)).length) * 6.6 + 14));
      var iw = W - padL - padR, ih = H - padT - padB, gw = iw / labels.length;
      var Y = function (v) { return padT + ih * (top - v) / (top - bottom); }, y0 = Y(0);
      var bw = o.stacked ? Math.min(36, gw * .55) : Math.min(22, gw * .7 / series.length);
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Gráfico de barras') + '">';
      var nTicks = Math.round((top - bottom) / step);
      for (var g = 0; g <= nTicks; g++) { var tv = bottom + step * g, y = Y(tv); s += '<line class="lt-chart__grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text x="' + (padL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + esc(f(Math.abs(tv) < 1e-9 ? 0 : tv)) + '</text>'; }
      labels.forEach(function (lb, i) {
        var cx = padL + gw * i + gw / 2, accP = 0, accN = 0;
        series.forEach(function (se, si) {
          var v = se.values[i] || 0, neg = v < 0, x = o.stacked ? cx - bw / 2 : cx - (bw * series.length) / 2 + bw * si, yTop, yBot;
          if (o.stacked) { if (neg) { yTop = Y(accN); accN += v; yBot = Y(accN); } else { yBot = Y(accP); accP += v; yTop = Y(accP); } }
          else { yTop = neg ? y0 : Y(v); yBot = neg ? Y(v) : y0; }
          var fill = neg ? (se.negColor || 'var(--danger)') : (se.color || CH[si % 6]);
          s += '<rect class="lt-chart__bar" x="' + x.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + (bw - (o.stacked ? 0 : 2)).toFixed(1) + '" height="' + Math.max(0, yBot - yTop).toFixed(1) + '" rx="1.5" style="fill:' + fill + '"><title>' + esc(se.name + ' · ' + lb + ': ' + f(v)) + '</title></rect>';
          if (o.showValues && !o.stacked && v) s += '<text class="lt-chart__value" x="' + (x + bw / 2 - 1).toFixed(1) + '" y="' + (neg ? yBot + 12 : yTop - 4).toFixed(1) + '" text-anchor="middle">' + esc(f(v)) + '</text>';
        });
        s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(lb) + '</text>';
      });
      s += '<line class="lt-chart__axis" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '"/></svg>';
      var temNeg = min < 0 && series.some(function (se) { return !se.negColor; });
      return '<div class="lt-chart">' + s + (o.legend !== false && (series.length > 1 || temNeg) ? legend(series, temNeg) : '') + '</div>';
    },
    /* ui.chart.line({ labels, series:[{ name, values, color, dashed }], height, format, area:true }) */
    line: function (o) {
      var W = o.width || 520, H = o.height || 220, padL = 48, padB = 26, padT = 12, padR = 12;
      var labels = o.labels, series = o.series, f = o.format || function (v) { return fmt.num(v); };
      var max = 0, min = 0; series.forEach(function (se) { se.values.forEach(function (v) { max = Math.max(max, v || 0); min = Math.min(min, v || 0); }); });
      var top, bottom, tstep;
      if (min >= 0) { top = niceMax(max * 1.02); bottom = 0; tstep = top / 4; }
      else { tstep = niceMax((max - min) * 1.02) / 4; top = max > 0 ? Math.ceil(max * 1.02 / tstep) * tstep : 0; bottom = Math.floor(min * 1.02 / tstep) * tstep; if (top === bottom) top = bottom + tstep; }
      padL = Math.max(padL, Math.round(Math.max(String(f(top)).length, String(f(bottom)).length) * 6.6 + 14));
      var iw = W - padL - padR, ih = H - padT - padB, step = labels.length > 1 ? iw / (labels.length - 1) : iw;
      var Y = function (v) { return padT + ih * (top - v) / (top - bottom); }, y0 = Y(0);
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Gráfico de linha') + '">';
      var nT = Math.round((top - bottom) / tstep);
      for (var g = 0; g <= nT; g++) { var tv = bottom + tstep * g, y = Y(tv); s += '<line class="lt-chart__grid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/><text x="' + (padL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + esc(f(Math.abs(tv) < 1e-9 ? 0 : tv)) + '</text>'; }
      if (min < 0) s += '<line class="lt-chart__axis" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '"/>';
      series.forEach(function (se, si) {
        var col = se.color || CH[si % 6];
        var pts = se.values.map(function (v, i) { return [padL + step * i, Y(v || 0)]; });
        var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
        if (o.area !== false && si === 0) s += '<path d="' + d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + y0.toFixed(1) + ' L' + padL + ' ' + y0.toFixed(1) + 'Z" style="fill:' + col + ';opacity:.12"/>';
        s += '<path d="' + d + '" style="fill:none;stroke:' + col + ';stroke-width:2' + (se.dashed ? ';stroke-dasharray:5 4' : '') + '"/>';
        pts.forEach(function (p, i) { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" style="fill:var(--surface);stroke:' + col + ';stroke-width:2"><title>' + esc(se.name + ' · ' + labels[i] + ': ' + f(se.values[i])) + '</title></circle>'; });
      });
      labels.forEach(function (lb, i) { s += '<text x="' + (padL + step * i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(lb) + '</text>'; });
      s += '</svg>';
      return '<div class="lt-chart">' + s + (o.legend !== false && series.length > 1 ? legend(series) : '') + '</div>';
    },
    /* ui.chart.donut({ items:[{ label, value, color }], size:180, centerValue, centerLabel, format, legend:'side'|'bottom'|false }) */
    donut: function (o) {
      var size = o.size || 180, r = size / 2 - 4, ri = r * .64, cx = size / 2, cy = size / 2;
      var total = util.soma(o.items, function (i) { return i.value; }) || 1, a0 = -Math.PI / 2, f = o.format || function (v) { return fmt.num(v); };
      var s = '<svg viewBox="0 0 ' + size + ' ' + size + '" style="max-width:' + size + 'px" role="img" aria-label="' + esc(o.title || 'Gráfico de rosca') + '">';
      o.items.forEach(function (it, i) {
        var frac = it.value / total; if (frac <= 0) return;
        var a1 = a0 + frac * Math.PI * 2 - (frac >= 1 ? 0.0001 : 0);
        var large = frac > .5 ? 1 : 0;
        var p = 'M' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1)) +
          ' L' + (cx + ri * Math.cos(a1)) + ' ' + (cy + ri * Math.sin(a1)) + ' A' + ri + ' ' + ri + ' 0 ' + large + ' 0 ' + (cx + ri * Math.cos(a0)) + ' ' + (cy + ri * Math.sin(a0)) + 'Z';
        s += '<path class="lt-chart__slice" d="' + p + '" style="fill:' + (it.color || CH[i % 6]) + ';stroke:var(--surface);stroke-width:2"><title>' + esc(it.label + ': ' + f(it.value) + ' (' + fmt.pct(100 * frac) + ')') + '</title></path>';
        a0 = a1;
      });
      if (o.centerValue != null) s += '<text class="lt-chart__center-value" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle">' + esc(o.centerValue) + '</text>';
      if (o.centerLabel) s += '<text class="lt-chart__center-label" x="' + cx + '" y="' + (cy + 22) + '" text-anchor="middle">' + esc(o.centerLabel) + '</text>';
      s += '</svg>';
      var lg = '<div class="lt-legend lt-legend--col">' + o.items.map(function (it, i) { return '<span class="lt-legend__item"><span class="lt-row lt-row--nowrap" style="gap:6px"><span class="lt-legend__sw" style="background:' + (it.color || CH[i % 6]) + '"></span>' + esc(it.label) + '</span><b class="lt-num">' + esc(f(it.value)) + '</b></span>'; }).join('') + '</div>';
      if (o.legend === false) return '<div class="lt-chart">' + s + '</div>';
      if (o.legend === 'bottom') return '<div class="lt-chart" style="display:flex;flex-direction:column;align-items:center">' + s + lg + '</div>';
      return '<div class="lt-chart" style="display:grid;grid-template-columns:' + size + 'px 1fr;gap:20px;align-items:center">' + s + lg + '</div>';
    },
    /* Barras horizontais / funil. ui.chart.funnel([{ label, value, sub, color }], { format, max }) */
    funnel: function (items, o) {
      o = o || {}; var max = o.max || Math.max.apply(null, items.map(function (i) { return i.value; })) || 1, f = o.format || function (v) { return fmt.num(v); };
      return '<div class="lt-funnel">' + items.map(function (it) { return '<div class="lt-funnel__row"><span class="lt-truncate" title="' + esc(it.label) + '">' + esc(it.label) + '</span><div class="lt-funnel__bar"><span style="width:' + (100 * it.value / max).toFixed(1) + '%;' + (it.color ? 'background:' + it.color : '') + '"></span></div><span class="lt-num" style="text-align:right;font-weight:600">' + esc(f(it.value)) + (it.sub ? ' <span class="lt-muted" style="font-weight:400">' + esc(it.sub) + '</span>' : '') + '</span></div>'; }).join('') + '</div>';
    },
    /* Mini linha sem eixos. ui.chart.spark([valores], { width:120, height:32, color }) */
    spark: function (values, o) {
      o = o || {}; var W = o.width || 120, H = o.height || 32, max = Math.max.apply(null, values), min = Math.min.apply(null, values), rg = max - min || 1;
      var d = values.map(function (v, i) { return (i ? 'L' : 'M') + (W * i / (values.length - 1)).toFixed(1) + ' ' + (H - 2 - (H - 4) * (v - min) / rg).toFixed(1); }).join(' ');
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><path d="' + d + '" style="fill:none;stroke:' + (o.color || 'var(--chart-1)') + ';stroke-width:1.6"/></svg>';
    }
  };

  /* ---------- Calendários ---------- */
  /* Mês. ui.calMonth({ ano, mes (0–11), eventos:[{ data:'YYYY-MM-DD', titulo, hora, tone, sheet, params, href }], max:3, mini:false, onDaySheet }) */
  ui.calMonth = function (o) {
    var first = new Date(o.ano, o.mes, 1), start = util.inicioSemana(first), max = o.max || 3;
    var byDay = util.agrupar(o.eventos || [], function (e) { return util.iso(e.data); });
    var s = '<div class="lt-cal' + (o.mini ? ' lt-cal--mini' : '') + '"><div class="lt-cal__weekdays">' + ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(function (d) { return '<div>' + (o.mini ? d.charAt(0).toUpperCase() : d) + '</div>'; }).join('') + '</div><div class="lt-cal__grid">';
    for (var i = 0; i < 42; i++) {
      var d = util.addDias(start, i);
      if (i >= 35 && d.getMonth() !== o.mes) break;
      var iso = util.iso(d), fer = util.feriado(d), sus = util.suspensao(d);
      var cls = 'lt-cal__day' + (d.getMonth() !== o.mes ? ' is-out' : '') + (util.fimDeSemana(d) ? ' is-weekend' : '') + (fer ? ' is-holiday' : '') + (sus ? ' is-suspended' : '') + (iso === util.hojeIso() ? ' is-today' : '');
      var evs = byDay[iso] || [];
      s += '<div class="' + cls + '" data-date="' + iso + '"' + (fer ? ' title="' + esc(fer.nome) + '"' : sus ? ' title="' + esc(sus.nome) + '"' : '') + '><div class="lt-cal__day-head"><span class="lt-cal__num">' + d.getDate() + '</span>' + (!o.mini && fer ? '<span class="lt-cal__holiday">' + esc(fer.nome) + '</span>' : '') + '</div>';
      if (!o.mini) {
        evs.slice(0, max).forEach(function (e) { s += calEvent(e, 'lt-cal__event'); });
        if (evs.length > max) s += '<button type="button" class="lt-cal__more" data-cal-more="' + iso + '">+' + (evs.length - max) + ' mais</button>';
      } else if (evs.length) s += '<span class="lt-dot" style="width:5px;height:5px"></span>';
      s += '</div>';
    }
    return s + '</div></div>';
  };
  /* mode (só semana): 'full' título + horário/local · 'compact' só o título (evento baixo, < 44 px) ·
     'narrow' só hora e iniciais (3 ou mais eventos lado a lado). O texto completo fica sempre no title. */
  function calEvent(e, cls, style, mode) {
    var horario = e.inicio ? e.inicio + (e.fim ? '–' + e.fim : '') : (e.hora || '');
    var a = { 'data-tone': e.tone || 'gold', title: (horario ? horario + ' · ' : '') + e.titulo + (e.sub ? ' · ' + e.sub : '') };
    if (e.sheet) { a['data-sheet'] = e.sheet; Object.keys(e.params || {}).forEach(function (k) { a['data-' + k] = e.params[k]; }); }
    if (style) a.style = style;
    var inner;
    if (cls === 'lt-week__event') {
      if (mode === 'narrow') {
        var ini = e.iniciais || ((e.pessoas || []).map(function (id) { var p = App.db.pessoa(id); return p ? fmt.iniciais(p.nome) : ''; }).filter(Boolean).slice(0, 2).join(' ')) || fmt.iniciais(e.titulo);
        inner = '<b>' + esc(e.inicio || '') + '</b><span>' + esc(ini) + '</span>';
        cls += ' is-narrow';
      } else if (mode === 'compact') { inner = '<b>' + esc(e.titulo) + '</b>'; cls += ' is-compact'; }
      else inner = '<b>' + esc(e.titulo) + '</b><span>' + esc(horario + (e.sub ? ' · ' + e.sub : '')) + '</span>';
    } else inner = (e.hora ? '<b>' + esc(e.hora) + '</b> ' : '') + '<span class="lt-truncate">' + esc(e.titulo) + '</span>';
    if (e.href) return '<a class="' + cls + '" href="' + esc(e.href) + '"' + attrs(a) + '>' + inner + '</a>';
    return '<button type="button" class="' + cls + '"' + attrs(a) + '>' + inner + '</button>';
  }
  /* Semana. ui.calWeek({ inicio:'YYYY-MM-DD' (segunda), dias:5|7, horaIni:8, horaFim:19,
       eventos:[{ data, inicio:'09:00', fim:'10:00', titulo, sub, tone, sheet, params }], diaInteiro:[{ data, titulo, tone }] }) */
  ui.calWeek = function (o) {
    var dias = o.dias || 5, hi = o.horaIni == null ? 8 : o.horaIni, hf = o.horaFim || 19, PX = 48;
    var ini = util.parse(o.inicio), days = [];
    for (var i = 0; i < dias; i++) days.push(util.addDias(ini, i));
    var s = '<div class="lt-week" style="--days:' + dias + '"><div class="lt-week__head"><div></div>' + days.map(function (d) {
      var fer = util.feriado(d), today = util.iso(d) === util.hojeIso();
      return '<div class="' + (today ? 'is-today' : '') + (fer ? ' is-holiday' : '') + '">' + DIAS_CURTOS[d.getDay()] + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '<small>' + (fer ? esc(fer.nome) : today ? 'Hoje' : '&nbsp;') + '</small></div>';
    }).join('') + '</div>';
    var ad = util.agrupar(o.diaInteiro || [], function (e) { return util.iso(e.data); });
    s += '<div class="lt-week__allday"><div>Dia todo</div>' + days.map(function (d) { return '<div>' + (ad[util.iso(d)] || []).map(function (e) { return calEvent(e, 'lt-cal__event'); }).join('') + '</div>'; }).join('') + '</div>';
    s += '<div class="lt-week__body"><div class="lt-week__hours">';
    for (var h = hi; h < hf; h++) s += '<div>' + pad(h) + ':00</div>';
    s += '</div>';
    var byDay = util.agrupar(o.eventos || [], function (e) { return util.iso(e.data); });
    days.forEach(function (d) {
      var iso = util.iso(d), today = iso === util.hojeIso();
      s += '<div class="lt-week__col' + (today ? ' is-today' : '') + (util.feriado(d) ? ' is-holiday' : '') + '" style="height:' + ((hf - hi) * PX) + 'px">';
      if (today) { var nowM = App.HOJE.getHours() * 60 + App.HOJE.getMinutes() - hi * 60; s += '<div class="lt-week__now" style="top:' + (nowM * PX / 60) + 'px"></div>'; }
      /* eventos sobrepostos dividem a largura (faixas) */
      var evs = (byDay[iso] || []).map(function (e) { var a = e.inicio.split(':'), b = (e.fim || e.inicio).split(':'); return { e: e, s: +a[0] * 60 + +a[1], f: Math.max(+b[0] * 60 + +b[1], +a[0] * 60 + +a[1] + 25) }; }).sort(function (x, y) { return x.s - y.s; });
      var grupo = [], fimGrupo = -1;
      var fechar = function () { var lanes = []; grupo.forEach(function (it) { var l = 0; while (lanes[l] != null && lanes[l] > it.s) l++; lanes[l] = it.f; it.lane = l; }); grupo.forEach(function (it) { it.n = lanes.length; }); grupo = []; };
      evs.forEach(function (it) { if (it.s >= fimGrupo && grupo.length) fechar(); grupo.push(it); fimGrupo = Math.max(fimGrupo, it.f); });
      if (grupo.length) fechar();
      evs.forEach(function (it) {
        var top = (it.s - hi * 60) * PX / 60, hgt = Math.max(22, (it.f - hi * 60) * PX / 60 - top - 2);
        var w = 100 / it.n, mode = it.n >= 3 ? 'narrow' : hgt < 44 ? 'compact' : 'full';
        s += calEvent(it.e, 'lt-week__event', 'top:' + top + 'px;height:' + hgt + 'px;left:calc(' + (w * it.lane) + '% + 3px);right:auto;width:calc(' + w + '% - 6px)', mode);
      });
      s += '</div>';
    });
    return s + '</div></div>';
  };

  /* ---------- Fluxos (diagrama em blocos) ---------- */
  App.flowCats = {
    trigger: { label: 'Gatilho', icon: 'zap' }, condition: { label: 'Condição', icon: 'git-branch' }, action: { label: 'Ação', icon: 'database' },
    notify: { label: 'Notificar', icon: 'bell' }, task: { label: 'Criar tarefa', icon: 'check-square' }, wait: { label: 'Aguardar', icon: 'hourglass' }
  };
  /* ui.flow(fluxo, { run, selected }) — fluxo.blocos:[{ id, cat, titulo, detalhe, quando, col, linha, de:['id'], off }]
     run (opcional): { passos: { idBloco: { estado:'ok'|'barrou'|'skip'|'fail', hora, nota, tentativa } } }
       ok = rodou (verde) · barrou = condição falsa (âmbar) · skip = não rodou (cinza tracejado) · fail = erro (vermelho)
     As ligações são desenhadas automaticamente depois de montar (App.ui.flowEdges). */
  ui.flow = function (f, o) {
    o = o || {};
    var blocos = f.blocos || [];
    var maxCol = 0, maxLin = 0; blocos.forEach(function (b) { maxCol = Math.max(maxCol, b.col || 0); maxLin = Math.max(maxLin, b.linha || 0); });
    var s = '<div class="lt-flow" data-flow><div class="lt-flow__canvas" style="grid-template-columns:repeat(' + (maxCol + 1) + ',var(--node-w))">';
    s += '<svg class="lt-flow__svg" aria-hidden="true"></svg>';
    blocos.forEach(function (b, i) {
      var cat = App.flowCats[b.cat] || App.flowCats.action;
      var st = o.run && o.run.passos ? o.run.passos[b.id] : null;
      var cls = 'lt-flow__node' + (b.off ? ' is-off' : '') + (st ? ' is-' + st.estado : '') + (o.selected === b.id ? ' is-selected' : '');
      s += '<button type="button" class="' + cls + '" data-cat="' + b.cat + '" data-node="' + esc(b.id) + '"' + (b.de ? ' data-de="' + esc(b.de.join(',')) + '"' : '') + ' style="grid-column:' + ((b.col || 0) + 1) + ';grid-row:' + ((b.linha || 0) + 1) + '">' +
        '<span class="lt-flow__node-head">' + App.icon(cat.icon) + esc(b.off ? cat.label + ' · desligado' : cat.label) + '<span class="lt-flow__node-num">' + (i + 1) + '</span></span>' +
        '<span class="lt-flow__node-body"><span class="lt-flow__node-title">' + esc(b.titulo) + '</span>' + (b.detalhe ? '<span class="lt-flow__node-detail">' + esc(b.detalhe) + '</span>' : '') +
        (b.quando ? '<span class="lt-flow__cond">' + App.icon('filter') + '<span>Somente quando ' + esc(b.quando) + '</span></span>' : '') + '</span>' +
        (st ? '<span class="lt-flow__run">' + App.icon(st.estado === 'ok' ? 'check-circle' : st.estado === 'fail' ? 'x-circle' : st.estado === 'barrou' ? 'filter' : 'minus-circle') + esc(st.estado === 'ok' ? 'Rodou' : st.estado === 'fail' ? 'Falhou' : st.estado === 'barrou' ? 'Condição não atendida' : 'Não rodou') + (st.hora ? ' · ' + esc(st.hora) : '') + (st.tentativa > 1 ? ' · tentativa ' + st.tentativa : '') + '</span>' : '') +
        '</button>';
    });
    return s + '</div></div>';
  };
  ui.flowEdges = function (scope) {
    (scope || document).querySelectorAll('[data-flow]').forEach(function (flow) {
      var canvas = flow.querySelector('.lt-flow__canvas'), svg = flow.querySelector('.lt-flow__svg');
      if (!canvas || !svg || !canvas.offsetWidth) return;
      var cr = canvas.getBoundingClientRect();
      svg.setAttribute('width', canvas.scrollWidth); svg.setAttribute('height', canvas.scrollHeight);
      svg.setAttribute('viewBox', '0 0 ' + canvas.scrollWidth + ' ' + canvas.scrollHeight);
      var paths = '<defs><marker id="lt-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8z" style="fill:var(--flow-edge);stroke:none"/></marker></defs>';
      canvas.querySelectorAll('[data-de]').forEach(function (n) {
        var r2 = n.getBoundingClientRect();
        n.getAttribute('data-de').split(',').forEach(function (fromId) {
          var src = canvas.querySelector('[data-node="' + fromId + '"]'); if (!src) return;
          var r1 = src.getBoundingClientRect();
          var x1 = r1.right - cr.left, y1 = r1.top - cr.top + Math.min(26, r1.height / 2), x2 = r2.left - cr.left - 2, y2 = r2.top - cr.top + Math.min(26, r2.height / 2);
          var dx = Math.max(24, (x2 - x1) / 2);
          var st = (n.classList.contains('is-ok') || n.classList.contains('is-barrou')) && src.classList.contains('is-ok') ? 'is-ok' : (n.classList.contains('is-skip') || n.classList.contains('is-off')) ? 'is-skip' : '';
          paths += '<path class="' + st + '" marker-end="url(#lt-arrow)" d="M' + x1 + ' ' + y1 + ' C' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2 + '"/>';
        });
      });
      svg.innerHTML = paths;
    });
  };

  /* ---------- Toast ---------- */
  ui.toast = function (title, tone, text) {
    var box = document.getElementById('lt-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'lt-toasts'; box.className = 'lt-toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    tone = tone || 'success';
    var t = document.createElement('div');
    t.className = 'lt-toast'; t.setAttribute('data-tone', tone); t.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
    t.innerHTML = App.icon({ success: 'check-circle', info: 'info', warning: 'alert-triangle', danger: 'alert-circle' }[tone] || 'info') + '<div style="min-width:0"><div class="lt-toast__title">' + esc(title) + '</div>' + (text ? '<div class="lt-toast__text">' + text + '</div>' : '') + '</div><button type="button" class="lt-toast__close" aria-label="Fechar aviso">' + App.icon('x') + '</button>';
    box.appendChild(t);
    var kill = function () { t.classList.add('is-leaving'); setTimeout(function () { t.remove(); }, 260); };
    t.querySelector('.lt-toast__close').onclick = kill;
    setTimeout(kill, tone === 'danger' ? 7000 : 4200);
    return t;
  };

  /* ---------- Overlay / Sheet / Dialog ---------- */
  function overlay(kind) {
    var o = document.createElement('div'); o.className = 'lt-overlay'; o.setAttribute('data-overlay', kind);
    document.body.appendChild(o); requestAnimationFrame(function () { o.classList.add('is-open'); });
    o.addEventListener('click', function () { kind === 'sheet' ? ui.closeSheet() : ui.closeDialog(); });
    return o;
  }
  /* ui.sheet({ title, sub, body, foot, size:'sm'|'lg', mount(el) }) → abre a gaveta lateral. Rodapé padrão: Cancelar. */
  ui.sheet = function (o) {
    ui.closeSheet(true);
    overlay('sheet');
    var el = document.createElement('aside');
    el.className = 'lt-sheet' + (o.size ? ' lt-sheet--' + o.size : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', o.title || 'Painel');
    el.innerHTML = '<header class="lt-sheet__head"><div style="min-width:0">' + (o.eyebrow ? '<div class="lt-eyebrow">' + esc(o.eyebrow) + '</div>' : '') + '<h2 class="lt-sheet__title">' + esc(o.title || '') + '</h2>' + (o.sub ? '<div class="lt-sheet__sub">' + o.sub + '</div>' : '') + '</div>' +
      '<button type="button" class="lt-iconbtn lt-sheet__close" data-fechar-sheet aria-label="Fechar">' + App.icon('x') + '</button></header>' +
      '<div class="lt-sheet__body">' + (o.body || '') + '</div>' +
      '<footer class="lt-sheet__foot">' + (o.foot != null ? o.foot : ui.btn({ label: 'Fechar', variant: 'default', attrs: { 'data-fechar-sheet': true } })) + '</footer>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    ui.enhance(el);
    if (o.mount) { try { o.mount(el); } catch (e) { console.error(e); } }
    setTimeout(function () { var f = el.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea'); if (f && !o.noFocus) f.focus({ preventScroll: true }); }, 320);
    return el;
  };
  ui.closeSheet = function (instant) {
    document.querySelectorAll('.lt-sheet').forEach(function (s) { s.classList.remove('is-open'); setTimeout(function () { s.remove(); }, instant ? 0 : 320); });
    document.querySelectorAll('[data-overlay="sheet"]').forEach(function (o) { o.classList.remove('is-open'); setTimeout(function () { o.remove(); }, instant ? 0 : 220); });
  };
  /* ui.dialog({ title, text, icon, iconTone:'danger'|'warning', body, foot, size:'sm'|'lg', mount(el) }) */
  ui.dialog = function (o) {
    ui.closeDialog(true);
    overlay('dialog');
    var wrap = document.createElement('div'); wrap.className = 'lt-dialog-wrap';
    wrap.innerHTML = '<div class="lt-dialog' + (o.size ? ' lt-dialog--' + o.size : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
      '<div class="lt-dialog__head">' + (o.icon ? '<span class="lt-dialog__icon' + (o.iconTone ? ' is-' + o.iconTone : '') + '">' + App.icon(o.icon) + '</span>' : '') + '<div style="flex:1;min-width:0"><h2 class="lt-dialog__title">' + esc(o.title) + '</h2>' + (o.text ? '<p class="lt-dialog__text">' + o.text + '</p>' : '') + '</div><button type="button" class="lt-iconbtn" data-fechar-dialog aria-label="Fechar">' + App.icon('x') + '</button></div>' +
      (o.body ? '<div class="lt-dialog__body">' + o.body + '</div>' : '') +
      '<div class="lt-dialog__foot">' + (o.foot != null ? o.foot : ui.btn({ label: 'Fechar', attrs: { 'data-fechar-dialog': true } })) + '</div></div>';
    document.body.appendChild(wrap);
    var dlg = wrap.querySelector('.lt-dialog');
    requestAnimationFrame(function () { dlg.classList.add('is-open'); });
    ui.enhance(wrap);
    if (o.mount) { try { o.mount(dlg); } catch (e) { console.error(e); } }
    return dlg;
  };
  ui.closeDialog = function (instant) {
    document.querySelectorAll('.lt-dialog-wrap').forEach(function (w) { var d = w.querySelector('.lt-dialog'); if (d) d.classList.remove('is-open'); setTimeout(function () { w.remove(); }, instant ? 0 : 200); });
    document.querySelectorAll('[data-overlay="dialog"]').forEach(function (o) { o.classList.remove('is-open'); setTimeout(function () { o.remove(); }, instant ? 0 : 200); });
  };
  ui.closeAll = function (instant) { ui.closeDialog(instant); ui.closeSheet(instant); };
  /* Confirmação única para tudo que é irreversível.
     ui.confirm({ title, text, confirmLabel:'Excluir', tone:'danger'|'primary', loading:'Excluindo…', toast:'Registro excluído', onConfirm() }) */
  ui.confirm = function (o) {
    var danger = (o.tone || 'danger') === 'danger';
    var dlg = ui.dialog({
      title: o.title || 'Confirmar ação', text: o.text || 'Esta ação não pode ser desfeita.', icon: danger ? 'alert-triangle' : 'help', iconTone: danger ? 'danger' : 'warning', size: 'sm',
      foot: ui.btn({ label: 'Cancelar', variant: 'default', attrs: { 'data-fechar-dialog': true } }) + '<button type="button" class="lt-btn lt-btn--' + (danger ? 'danger' : 'primary') + '" data-confirm-ok><span>' + esc(o.confirmLabel || 'Confirmar') + '</span></button>'
    });
    dlg.querySelector('[data-confirm-ok]').addEventListener('click', function (e) {
      var b = e.currentTarget;
      ui.loading(b, true, o.loading || 'Processando…');
      setTimeout(function () {
        ui.loading(b, false); ui.closeDialog();
        if (o.toast) ui.toast(o.toast, o.toastTone || 'success', o.toastText);
        if (o.onConfirm) o.onConfirm();
      }, 1200);
    });
    return dlg;
  };
  /* Liga/desliga o estado "carregando" de um botão (spinner + texto, desabilitado, aria-busy) */
  ui.loading = function (btn, on, text) {
    if (!btn) return;
    if (on) {
      if (btn.classList.contains('is-loading')) return;
      btn._html = btn.innerHTML; btn.style.minWidth = btn.offsetWidth + 'px';
      btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
      btn.innerHTML = '<span class="lt-btn__spinner" aria-hidden="true"></span>' + (btn.classList.contains('lt-btn--icon') ? '' : '<span>' + esc(text || 'Salvando…') + '</span>');
    } else {
      btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); btn.disabled = false;
      if (btn._html != null) btn.innerHTML = btn._html; btn.style.minWidth = '';
    }
  };
  /* Executa o comportamento padrão de botão que processa: spinner ~1,2 s → toast. Pode ser chamado por código. */
  ui.run = function (btn, cb) {
    var d = btn.dataset;
    var defaults = { salvar: 'Salvando…', enviar: 'Enviando…', gerar: 'Gerando…', aprovar: 'Aprovando…', excluir: 'Excluindo…', importar: 'Importando…', exportar: 'Exportando…', entrar: 'Entrando…', verificar: 'Verificando…', recalcular: 'Recalculando…', copiar: 'Copiando…', executar: 'Executando…', concluir: 'Concluindo…', convidar: 'Enviando convite…', publicar: 'Publicando…', mover: 'Movendo…', registrar: 'Registrando…' };
    ui.loading(btn, true, d.loading || defaults[d.acao] || 'Processando…');
    setTimeout(function () {
      ui.loading(btn, false);
      if (d.toast !== 'off') ui.toast(d.toast || 'Pronto.', d.toastTone || 'success', d.toastText);
      if (d.fechar === 'sheet') ui.closeSheet(); else if (d.fechar === 'dialog') ui.closeDialog(); else if (d.fechar === 'tudo') ui.closeAll();
      btn.dispatchEvent(new CustomEvent('lt:acao', { bubbles: true, detail: { acao: d.acao } }));
      if (cb) cb();
      if (d.ir) setTimeout(function () { App.go(d.ir); }, 150);
    }, 1200);
  };
  /* Registro de sheets e diálogos abríveis por atributo: <button data-sheet="crm-novo-negocio" data-id="1042">
     App.ui.registerSheet('crm-novo-negocio', function (params, trigger) { return { title, sub, body, foot, size, mount } }) */
  ui.registerSheet = function (nome, fn) { ui.sheets[nome] = fn; };
  ui.registerDialog = function (nome, fn) { ui.dialogs[nome] = fn; };
  ui.openSheet = function (nome, params, trigger) {
    var fn = ui.sheets[nome];
    if (!fn) { ui.toast('Formulário ainda não montado', 'info', 'A gaveta "' + esc(nome) + '" pertence a um módulo em construção.'); return; }
    return ui.sheet(fn(params || {}, trigger) || {});
  };
  ui.openDialog = function (nome, params, trigger) {
    var fn = ui.dialogs[nome];
    if (!fn) { ui.toast('Diálogo ainda não montado', 'info', esc(nome)); return; }
    return ui.dialog(fn(params || {}, trigger) || {});
  };
  function dataParams(el) {
    var p = {}; Object.keys(el.dataset).forEach(function (k) { if (k !== 'sheet' && k !== 'dialog') { var v = el.dataset[k]; p[k] = /^\d+$/.test(v) ? +v : v; } }); return p;
  }

  /* Botões de rodapé prontos para sheet de formulário:
     ui.sheetFoot({ label:'Salvar negócio', toast:'Negócio salvo', acao:'salvar', info:'Campos com * são obrigatórios' }) */
  ui.sheetFoot = function (o) {
    o = o || {};
    return (o.info ? '<span class="lt-sheet__foot-info">' + o.info + '</span>' : '') + ui.btn({ label: o.cancel || 'Cancelar', variant: 'default', attrs: { 'data-fechar-sheet': true } }) +
      ui.btn({ label: o.label || 'Salvar', variant: 'primary', icon: o.icon || 'check', acao: o.acao || 'salvar', toast: o.toast || 'Salvo com sucesso', toastText: o.toastText, fechar: o.fechar === false ? null : 'sheet', ir: o.ir, loading: o.loading });
  };

  /* Pós-render: desenha ligações dos fluxos e paginação das tabelas */
  ui.enhance = function (scope) {
    scope = scope || document;
    scope.querySelectorAll('[data-lt-table][data-page-size]').forEach(function (t) { applyPage(t, 1); });
    setTimeout(function () { ui.flowEdges(scope); }, 30);
  };

  /* ---------- Tabelas: ordenação, paginação, seleção ---------- */
  function applyPage(t, page) {
    var ps = +t.getAttribute('data-page-size'); if (!ps) return;
    var rows = [].slice.call(t.querySelectorAll('tbody tr')), total = rows.length, pages = Math.max(1, Math.ceil(total / ps));
    page = util.clamp(page, 1, pages); t._page = page;
    rows.forEach(function (r, i) { r.hidden = !(i >= (page - 1) * ps && i < page * ps); });
    var pg = t.querySelector('[data-pagination]'); if (!pg) return;
    var a = (page - 1) * ps + 1, b = Math.min(total, page * ps), btns = '';
    btns += '<button type="button" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + ' aria-label="Página anterior">‹</button>';
    for (var i = 1; i <= pages; i++) { if (pages > 7 && i > 2 && i < pages - 1 && Math.abs(i - page) > 1) { if (btns.slice(-3) !== '…</span>') btns += '<span class="lt-muted">…</span>'; continue; } btns += '<button type="button" data-page="' + i + '" class="' + (i === page ? 'is-active' : '') + '">' + i + '</button>'; }
    btns += '<button type="button" data-page="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + ' aria-label="Próxima página">›</button>';
    pg.innerHTML = '<span>Mostrando <b class="lt-num">' + a + '–' + b + '</b> de <b class="lt-num">' + total + '</b></span><div class="lt-pagination__pages">' + btns + '</div>';
  }
  function sortTable(th) {
    var t = th.closest('[data-lt-table]'), col = th.getAttribute('data-col'), tbody = t.querySelector('tbody');
    var dir = th.classList.contains('is-sorted-asc') ? 'desc' : 'asc';
    t.querySelectorAll('th').forEach(function (x) { x.classList.remove('is-sorted-asc', 'is-sorted-desc'); if (x.hasAttribute('aria-sort')) x.setAttribute('aria-sort', 'none'); });
    th.classList.add('is-sorted-' + dir); th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
    var rows = [].slice.call(tbody.querySelectorAll('tr'));
    var vals = rows.map(function (r) { var c = r.querySelector('td[data-col="' + col + '"]'); return c ? c.getAttribute('data-v') : ''; });
    var numeric = vals.every(function (v) { return v === '' || !isNaN(parseFloat(v)) && isFinite(v); });
    rows.map(function (r, i) { return { r: r, v: vals[i] }; }).sort(function (a, b) {
      var x = numeric ? parseFloat(a.v || 0) : a.v, y = numeric ? parseFloat(b.v || 0) : b.v;
      var c = numeric ? x - y : String(x).localeCompare(String(y), 'pt-BR', { sensitivity: 'base' });
      return dir === 'asc' ? c : -c;
    }).forEach(function (o) { tbody.appendChild(o.r); });
    applyPage(t, 1);
  }
  function syncSelection(t) {
    var boxes = [].slice.call(t.querySelectorAll('[data-check-row]'));
    var on = boxes.filter(function (b) { return b.checked; });
    boxes.forEach(function (b) { b.closest('tr').classList.toggle('is-selected', b.checked); });
    var all = t.querySelector('[data-check-all]'); if (all) { all.checked = on.length && on.length === boxes.length; all.indeterminate = on.length > 0 && on.length < boxes.length; }
    var bar = t.querySelector('[data-bulkbar]'); if (bar) { bar.hidden = !on.length; var c = bar.querySelector('[data-sel-count]'); if (c) c.textContent = on.length; var lb = bar.querySelector('[data-sel-label]'); if (lb) lb.textContent = on.length === 1 ? 'selecionado' : 'selecionados'; }
  }

  /* ---------- Menus suspensos (Novo / Usuário) ---------- */
  function closeMenus() { document.querySelectorAll('.lt-menu').forEach(function (m) { m.remove(); }); }
  function openMenu(btn) {
    var kind = btn.getAttribute('data-menu'); closeMenus();
    var m = document.createElement('div'); m.className = 'lt-menu'; m.setAttribute('role', 'menu');
    if (kind === 'novo') {
      m.innerHTML = App.quickCreate.filter(function (q) { return !q.grupo || App.podeVerGrupo(q.grupo); }).map(function (q) { return '<button type="button" class="lt-menu__item" role="menuitem" data-sheet="' + q.sheet + '">' + App.icon(q.icon) + '<span style="flex:1">' + esc(q.label) + '</span><span class="lt-hint">' + esc(q.modulo) + '</span></button>'; }).join('');
      m.style.right = '0'; m.style.minWidth = '260px';
    } else if (kind === 'usuario') {
      var me = App.db.me();
      m.innerHTML = '<div style="padding:10px 10px 8px"><div class="lt-strong">' + esc(me.nome) + '</div><div class="lt-hint">' + esc(me.email) + '</div></div><div class="lt-menu__sep"></div>' +
        '<button type="button" class="lt-menu__item" data-acao-menu="perfil">' + App.icon('user') + 'Meu perfil</button>' +
        '<button type="button" class="lt-menu__item" data-theme-toggle>' + App.icon('moon') + 'Alternar modo claro/escuro</button>' +
        '<a class="lt-menu__item" href="#mapa">' + App.icon('map') + 'Mapa de telas</a>' +
        '<div class="lt-menu__sep"></div><div class="lt-menu__label">Ver como (simulação)</div>' +
        App.verComoOpcoes.map(function (o) { var p = App.db.pessoa(o.id) || { nome: '' }, cur = App.meId === o.id; return '<button type="button" class="lt-menu__item' + (cur ? ' is-current' : '') + '" role="menuitemradio" aria-checked="' + cur + '" data-ver-como="' + o.id + '">' + App.icon(cur ? 'check' : 'eye') + '<span style="flex:1">' + esc(o.rotulo) + '</span><span class="lt-hint">' + esc(p.nome.split(' ')[0]) + '</span></button>'; }).join('') +
        '<div class="lt-menu__sep"></div><a class="lt-menu__item" href="#login">' + App.icon('log-out') + 'Sair</a>';
      m.style.right = '0'; m.style.minWidth = '280px';
    } else if (App.menus && App.menus[kind]) {
      m.innerHTML = App.menus[kind](btn);
      m.style.right = '0';
    }
    m.style.top = (btn.offsetHeight + 6) + 'px';
    btn.parentNode.style.position = btn.parentNode.style.position || 'relative';
    btn.parentNode.appendChild(m);
  }
  /* Módulos podem registrar menus: App.menus['crm-acoes'] = function (btn) { return '<button class="lt-menu__item">…</button>' } e usar data-menu="crm-acoes" */
  App.menus = App.menus || {};

  /* ---------- Delegação global de eventos ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var el;
    /* menus */
    if ((el = t.closest('[data-menu]'))) { e.preventDefault(); var open = el.parentNode.querySelector('.lt-menu'); if (open) closeMenus(); else openMenu(el); return; }
    if (!t.closest('.lt-menu')) closeMenus(); else if (t.closest('.lt-menu__item')) setTimeout(closeMenus, 0);
    if ((el = t.closest('[data-acao-menu="perfil"]'))) { ui.toast('Meu perfil', 'info', 'Tela de perfil fica para a próxima rodada.'); return; }
    if ((el = t.closest('[data-ver-como]'))) { e.preventDefault(); closeMenus(); App.verComo(+el.getAttribute('data-ver-como')); return; }
    /* tema */
    if (t.closest('[data-theme-toggle]')) { App.theme.toggle(); return; }
    /* gaveta do menu (celular) */
    if (t.closest('[data-drawer-open]')) { document.getElementById('lt-shell').classList.add('is-drawer-open'); return; }
    if (t.closest('[data-drawer-close]')) { document.getElementById('lt-shell').classList.remove('is-drawer-open'); return; }
    /* grupos do menu lateral */
    if ((el = t.closest('[data-nav-toggle]'))) { var g = el.closest('.lt-nav__group'); g.classList.toggle('is-open'); App.state['nav-open-' + el.getAttribute('data-nav-toggle')] = g.classList.contains('is-open'); return; }
    /* fechar sheet/dialog */
    if (t.closest('[data-fechar-sheet]')) { ui.closeSheet(); return; }
    if (t.closest('[data-fechar-dialog]')) { ui.closeDialog(); return; }
    /* abas */
    if ((el = t.closest('.lt-tabs-root [data-tab]'))) {
      var rootT = el.closest('.lt-tabs-root'), key = el.getAttribute('data-tab');
      el.parentNode.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('is-active', b === el); if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', b === el); });
      [].forEach.call(rootT.querySelectorAll(':scope > .lt-tabpanel'), function (p) { p.hidden = p.getAttribute('data-panel') !== key; });
      if (rootT.dataset.tabsId) App.state['tab-' + rootT.dataset.tabsId] = key;
      rootT.dispatchEvent(new CustomEvent('lt:tab', { bubbles: true, detail: { id: rootT.dataset.tabsId, tab: key } }));
      setTimeout(function () { ui.flowEdges(rootT); }, 20);
      return;
    }
    /* segmentado (sem abas) */
    if ((el = t.closest('.lt-segmented button'))) {
      el.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-active', b === el); });
      el.dispatchEvent(new CustomEvent('lt:segment', { bubbles: true, detail: { name: el.parentNode.getAttribute('data-seg'), value: el.getAttribute('data-value') } }));
      return;
    }
    /* chips de filtro */
    if ((el = t.closest('.lt-filter-chip'))) {
      var grp = el.closest('[data-filter-group]');
      if (grp && grp.getAttribute('data-filter-group') === 'single') grp.querySelectorAll('.lt-filter-chip').forEach(function (c) { c.classList.toggle('is-active', c === el); });
      else el.classList.toggle('is-active');
      el.dispatchEvent(new CustomEvent('lt:filter', { bubbles: true, detail: { value: el.getAttribute('data-value'), active: el.classList.contains('is-active') } }));
      return;
    }
    /* tabelas */
    if ((el = t.closest('[data-lt-table] th.is-sortable'))) { sortTable(el); return; }
    if ((el = t.closest('[data-lt-table] [data-page]'))) { applyPage(el.closest('[data-lt-table]'), +el.getAttribute('data-page')); return; }
    if ((el = t.closest('[data-sel-clear]'))) { var tb = el.closest('[data-lt-table]'); tb.querySelectorAll('[data-check-row],[data-check-all]').forEach(function (c) { c.checked = false; }); syncSelection(tb); return; }
    if ((el = t.closest('[data-acao]'))) {
      e.preventDefault();
      if (el.dataset.confirm) { ui.confirm({ title: el.dataset.confirm, text: el.dataset.confirmText, confirmLabel: el.dataset.confirmLabel || 'Confirmar', tone: el.dataset.confirmTone || 'danger', toast: el.dataset.toast || 'Feito.', onConfirm: function () { el.dispatchEvent(new CustomEvent('lt:acao', { bubbles: true, detail: { acao: el.dataset.acao } })); if (el.dataset.ir) App.go(el.dataset.ir); } }); return; }
      ui.run(el); return;
    }
    if ((el = t.closest('[data-sheet]')) && !(el.tagName === 'TR' && t.closest('a,button,input,label,select,textarea'))) { e.preventDefault(); ui.openSheet(el.getAttribute('data-sheet'), dataParams(el), el); return; }
    if ((el = t.closest('[data-dialog]'))) { e.preventDefault(); ui.openDialog(el.getAttribute('data-dialog'), dataParams(el), el); return; }
    if ((el = t.closest('tr[data-href]')) && !t.closest('a,button,input,label,select,textarea')) { App.go(el.getAttribute('data-href').replace(/^#/, '')); return; }
    if ((el = t.closest('[data-upload]')) && t.tagName !== 'INPUT') { /* deixa o input abrir */ }
    if ((el = t.closest('[data-copy]'))) { App.copy(el.getAttribute('data-copy'), el.getAttribute('data-copy-label') || 'Copiado'); return; }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-check-all]')) { var tb = t.closest('[data-lt-table]'); tb.querySelectorAll('tbody tr:not([hidden]) [data-check-row]').forEach(function (c) { c.checked = t.checked; }); syncSelection(tb); }
    else if (t.matches('[data-check-row]')) syncSelection(t.closest('[data-lt-table]'));
    else if (t.matches('[data-upload] input[type=file]') && t.files && t.files.length) {
      var lab = t.closest('[data-upload]');
      var f = t.files[0];
      var row = document.createElement('div'); row.className = 'lt-upload__file';
      row.innerHTML = App.icon('file-text') + '<span class="lt-truncate" style="flex:1">' + esc(f.name) + '</span><span class="lt-upload__bar"><span style="width:0%"></span></span><span class="lt-hint">' + fmt.bytes(f.size) + '</span>';
      lab.parentNode.insertBefore(row, lab.nextSibling);
      var bar = row.querySelector('.lt-upload__bar span'), p = 0;
      var iv = setInterval(function () { p += 18; bar.style.width = Math.min(100, p) + '%'; if (p >= 100) { clearInterval(iv); row.querySelector('.lt-upload__bar').outerHTML = ui.chip('Enviado', 'green', { dot: true }); } }, 160);
    }
  });
  /* máscaras */
  document.addEventListener('input', function (e) {
    var t = e.target, m = t.getAttribute && t.getAttribute('data-mask'); if (!m) return;
    if (m === 'cnpj') t.value = fmt.cnpj(t.value); else if (m === 'cpf') t.value = fmt.cpf(t.value); else if (m === 'phone') t.value = fmt.telefone(t.value); else if (m === 'cep') t.value = fmt.cep(t.value);
    else if (m === 'money') { var d = t.value.replace(/\D/g, ''); t.value = d ? fmt.num(parseInt(d, 10) / 100, 2) : ''; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (document.querySelector('.lt-dialog-wrap')) ui.closeDialog(); else if (document.querySelector('.lt-sheet')) ui.closeSheet(); closeMenus(); var sh = document.getElementById('lt-shell'); if (sh) sh.classList.remove('is-drawer-open'); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && document.getElementById('lt-busca')) { e.preventDefault(); document.getElementById('lt-busca').focus(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'lt-busca') { ui.toast('Busca global', 'info', 'A busca em todos os módulos entra na Fase 2. Nesta rodada, use os filtros de cada lista.'); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('li[data-sheet],[role=button][data-sheet]')) { e.preventDefault(); e.target.click(); }
  });
  /* Kanban: arrastar e soltar (HTML5) */
  var drag = null;
  document.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('.lt-kanban__card'); if (!c) return; drag = { card: c, from: c.closest('[data-col-id]') }; c.classList.add('is-dragging'); try { e.dataTransfer.setData('text/plain', c.getAttribute('data-card-id')); e.dataTransfer.effectAllowed = 'move'; } catch (x) { /* */ } });
  document.addEventListener('dragend', function () { if (drag) drag.card.classList.remove('is-dragging'); document.querySelectorAll('.lt-kanban__cards.is-over').forEach(function (z) { z.classList.remove('is-over'); z.style.outline = ''; }); drag = null; });
  document.addEventListener('dragover', function (e) { if (!drag) return; var z = e.target.closest && e.target.closest('[data-dropzone]'); if (!z) return; e.preventDefault(); z.style.outline = '1.5px dashed var(--gold)'; z.style.outlineOffset = '-4px'; });
  document.addEventListener('dragleave', function (e) { var z = e.target.closest && e.target.closest('[data-dropzone]'); if (z && !z.contains(e.relatedTarget)) z.style.outline = ''; });
  document.addEventListener('drop', function (e) {
    if (!drag) return; var z = e.target.closest && e.target.closest('[data-dropzone]'); if (!z) return; e.preventDefault(); z.style.outline = '';
    var to = z.closest('[data-col-id]'), from = drag.from, card = drag.card;
    if (to === from) return;
    var board = z.closest('[data-kanban]');
    var ev = new CustomEvent('lt:kanban-move', { bubbles: true, cancelable: true, detail: { cardId: card.getAttribute('data-card-id'), de: from.getAttribute('data-col-id'), para: to.getAttribute('data-col-id'), card: card } });
    if (!board.dispatchEvent(ev)) return; /* módulo cancelou (ex.: abriu MoveStageDialog) */
    App.ui.kanbanMove(card, to);
  });
  /* Move o cartão para outra coluna e atualiza contagem e soma (use depois de confirmar o MoveStageDialog) */
  ui.kanbanMove = function (card, toCol) {
    var from = card.closest('[data-col-id]');
    if (typeof toCol === 'string') toCol = card.closest('[data-kanban]').querySelector('[data-col-id="' + toCol + '"]');
    toCol.querySelector('[data-dropzone]').prepend(card);
    [from, toCol].forEach(function (col) {
      var cards = col.querySelectorAll('.lt-kanban__card'), c = col.querySelector('[data-col-count]'), tt = col.querySelector('[data-col-total]');
      if (c) c.textContent = cards.length;
      if (tt) { var s = 0; cards.forEach(function (k) { s += +(k.getAttribute('data-valor') || 0); }); tt.textContent = fmt.moedaCurta(s); }
    });
    card.animate && card.animate([{ boxShadow: '0 0 0 3px var(--gold-focus)' }, { boxShadow: 'none' }], { duration: 900 });
  };

  /* Copiar para a área de transferência (dentro do clique), com alternativa de selecionar o texto */
  App.copy = function (text, okMsg) {
    var done = function () { ui.toast(okMsg || 'Copiado', 'success'); };
    var fallback = function () {
      ui.dialog({
        title: 'Copie o texto abaixo', text: 'O navegador bloqueou a cópia automática. O texto já está selecionado: use Ctrl+C (ou ⌘C).', icon: 'copy', size: 'lg',
        body: '<textarea class="lt-textarea" rows="12" readonly data-copy-area>' + esc(text) + '</textarea>',
        mount: function (d) { var ta = d.querySelector('[data-copy-area]'); ta.focus(); ta.select(); try { if (document.execCommand('copy')) { /* copiado */ } } catch (x) { /* */ } }
      });
    };
    try {
      if (navigator.clipboard && window.isSecureContext !== false) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    } catch (x) { fallback(); }
  };

  window.addEventListener('resize', function () { clearTimeout(App._rz); App._rz = setTimeout(function () { ui.flowEdges(document); }, 120); });
  window.addEventListener('hashchange', function () { App.render(); });
  window.addEventListener('error', function (e) { try { ui.toast('Erro de script', 'danger', esc((e.message || '') + (e.filename ? ' · ' + e.filename.split('/').pop() + ':' + e.lineno : ''))); } catch (x) { /* */ } });

  App.start = function () {
    /* tema: ?tema=escuro|claro (revisores) > localStorage > sistema */
    var q = (window.location.search.match(/[?&]tema=([a-z]+)/) || [])[1];
    if (q) App.theme.set(q === 'escuro' || q === 'dark' ? 'dark' : 'light', false);
    else { var saved = null; try { saved = window.localStorage.getItem(App.theme.KEY); } catch (e) { /* */ } if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved); }
    if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', App.theme.syncButton); } catch (e) { /* */ } }
    /* ?vercomo=3 abre já simulando o papel da pessoa 3 (usado pelos revisores para screenshots) */
    var vc = +((window.location.search.match(/[?&]vercomo=(\d+)/) || [])[1] || 0);
    if (vc && App.db.pessoa(vc)) App.meId = vc;
    App.render();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', App.start); else setTimeout(App.start, 0);
})();
