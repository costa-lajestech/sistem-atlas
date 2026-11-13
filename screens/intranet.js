/* ==========================================================================
   ATLAS · screens/intranet.js — INTRANET (biblioteca de documentos e vídeos)
   Réplica da "Materiais LT" do Admin Master do LajesTech (adm_material_lt) para a equipe da Atlas.
   Telas
     int.library.grid      #int-biblioteca          Biblioteca (destaques, filtros, grade/lista)
     int.category.detail   #int-categoria-<id>      Página de uma categoria
     int.item.detail       #int-material-<id>       Visualizar material (vídeo, PDF, apresentação, planilha, imagem, link)
     int.admin.list        #int-gerenciar           Gerenciar materiais (ordem arrastável, ativo, destaque)
     int.admin.edit        #int-editar / -<id>      Cadastrar ou editar material (cards coloridos)
     int.admin.categories  #int-categorias          Gerenciar categorias (nome, cor, ícone, ordem)
     int.onboarding.track  #int-onboarding          Trilha de onboarding com progresso por pessoa
   Gavetas: int-novo-material · int-categoria · int-vistos · int-onboarding-pessoa
   Diálogos: int-incluir-trilha · int-add-etapa · int-mover-categoria
   CSS: capa, card de mídia, grade e player são da fundação (components.css §18: .lt-cover, .lt-media-card,
   .lt-media-grid, .lt-player, tons por data-mtone). Aqui fica só o bloco .m-int-* próprio da Intranet
   (visualizadores de PDF/slides/planilha, faixa de destaques, categorias, trilha), só com variáveis.
   ========================================================================== */
(function () {
  'use strict';
  const App = window.App, ui = App.ui, esc = ui.esc, fmt = App.fmt, util = App.util, db = App.db, D = App.data, I = App.icon;
  const DI = D.intranet;
  if (!DI || !DI.materiais) { console.error('[intranet] assets/data-intranet.js não carregou'); return; }

  const addStatus = (k, v) => { if (!App.status[k]) App.status[k] = v; };
  addStatus('int_em_dia', ['Em dia', 'blue']);
  addStatus('int_atrasada', ['Atrasada', 'red']);
  addStatus('int_nao_iniciou', ['Não iniciou', 'amber']);
  addStatus('int_processando', ['Em processamento', 'amber']);

  /* ------------------------------------------------------------------ */
  /* CSS do módulo (prefixo .m-int-, só variáveis)                        */
  /* ------------------------------------------------------------------ */
  /* Capa, card de mídia, grade e player foram para components.css (.lt-cover, .lt-media-card, .lt-media-grid, .lt-player,
     tons por data-mtone). Aqui fica só o que é próprio da Intranet. */
  const CSS = `
.m-int-tipo .lt-icon{width:15px;height:15px;color:var(--text-muted)}
.m-int-band{background:var(--gold-subtle);border:1px solid var(--gold-border);border-radius:var(--r-md);padding:12px 14px 14px;margin-bottom:var(--sp-5)}
.m-int-band__head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.m-int-band__head .lt-eyebrow{display:inline-flex;align-items:center;gap:6px}
.m-int-band__head .lt-eyebrow .lt-icon{width:14px;height:14px}
.m-int-rail{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 2 * var(--sp-3)) / 3);gap:var(--sp-3);overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;scroll-behavior:smooth}
.m-int-rail::-webkit-scrollbar{display:none}
.m-int-feat{scroll-snap-align:start;display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;align-items:center;padding:8px;min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text);text-decoration:none;transition:border-color var(--dur-1),box-shadow var(--dur-2)}
.m-int-feat:hover{border-color:var(--gold-border);box-shadow:var(--shadow-md);text-decoration:none}
.m-int-feat .lt-cover{border-radius:var(--r-sm)}
.m-int-feat__body{min-width:0;display:flex;flex-direction:column;gap:5px;padding-right:4px}
.m-int-feat__title{font-family:var(--ff-serif);font-size:15px;font-weight:600;line-height:1.25;color:var(--text);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.m-int-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--sp-3)}
.m-int-cat{display:flex;gap:12px;align-items:center;padding:12px 14px;min-width:0;border:1px solid var(--border);border-left:3px solid var(--c-solid);border-radius:var(--r-md);background:var(--surface);color:var(--text);text-decoration:none}
.m-int-cat:hover{border-color:var(--c-border);border-left-color:var(--c-solid);box-shadow:var(--shadow-sm);text-decoration:none}
.m-int-cat__icon{width:36px;height:36px;border-radius:var(--r-sm);display:grid;place-items:center;flex-shrink:0;background:var(--c-subtle);color:var(--c-strong);border:1px solid var(--c-border)}
.m-int-cat__name{display:block;font-weight:600;font-size:13.5px}
.m-int-cat__count{display:block;font-size:12px;color:var(--text-muted)}
.m-int-cat__chev{margin-left:auto;width:16px!important;height:16px!important;color:var(--text-faint)}
.m-int-cathead{display:flex;gap:16px;align-items:flex-start;min-width:0}.m-int-cathead>div{flex:1;min-width:0}
.m-int-cathead__icon{width:52px;height:52px;margin-top:26px;border-radius:var(--r-md);display:grid;place-items:center;flex-shrink:0;background:var(--c-subtle);color:var(--c-strong);border:1px solid var(--c-border)}.m-int-cathead__icon .lt-icon{width:26px;height:26px}
.m-int-chapters{display:flex;flex-direction:column}
.m-int-chapters button{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 18px;border:0;border-bottom:1px solid var(--divider);background:none;text-align:left;cursor:pointer;color:var(--text);font-size:13px}
.m-int-chapters button:last-child{border-bottom:0}
.m-int-chapters button:hover{background:var(--surface-3)}
.m-int-chapters button.is-active{background:var(--gold-subtle);font-weight:600}
.m-int-chapters button .lt-num{color:var(--gold-text);font-weight:600}
.m-int-chapters .lt-icon{width:15px;height:15px;color:var(--text-muted)}
.m-int-viewer{border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;background:var(--surface);min-width:0}
.m-int-viewer__bar{display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid var(--border);background:var(--surface-2);flex-wrap:wrap;font-size:12.5px;color:var(--text-2)}
.m-int-viewer__bar .lt-input{height:28px;width:46px;padding:0 6px;text-align:center}
.m-int-viewer__sep{width:1px;height:20px;background:var(--border);margin:0 4px}
.m-int-viewer__file{display:inline-flex;align-items:center;gap:6px;min-width:0;color:var(--text-muted);font-size:12px}
.m-int-viewer__file .lt-icon{width:14px;height:14px}
.m-int-viewer__body{display:grid;grid-template-columns:112px minmax(0,1fr);height:540px;background:var(--surface-sunken)}
.m-int-viewer__body.is-nothumbs{grid-template-columns:minmax(0,1fr)}
.m-int-viewer__body.is-nothumbs .m-int-viewer__thumbs{display:none}
.m-int-viewer__thumbs{overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:12px;align-items:center;border-right:1px solid var(--border);background:var(--surface-2)}
.m-int-viewer__canvas{overflow:auto;padding:24px;display:flex;justify-content:center;align-items:flex-start;min-width:0}
.m-int-thumb{position:relative;width:78px;flex-shrink:0;aspect-ratio:1/1.414;background:var(--surface);border:1px solid var(--border);border-radius:2px;padding:9px 7px;display:flex;flex-direction:column;gap:4px;cursor:pointer;overflow:hidden}
.m-int-thumb .m-int-line{height:3px}
.m-int-thumb.is-active{outline:2px solid var(--gold);outline-offset:2px}
.m-int-thumb__band{position:absolute;left:0;right:0;top:0;height:32%;background:var(--c-solid)}
.m-int-thumb__n{position:absolute;right:4px;bottom:2px;font-size:9px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.m-int-line{display:block;height:6px;border-radius:2px;background:var(--surface-3);flex-shrink:0}
.m-int-page{zoom:var(--z,1);position:relative;flex-shrink:0;width:440px;min-height:622px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-md);padding:44px 46px 52px;display:flex;flex-direction:column;gap:8px;font-size:11px;line-height:1.55;color:var(--text-2)}
.m-int-page h4{font-family:var(--ff-serif);font-size:16px;font-weight:600;color:var(--text);margin:2px 0 6px}
.m-int-page__num{position:absolute;right:22px;bottom:16px;font-size:9.5px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.m-int-page--cover{justify-content:flex-end;gap:14px;padding-bottom:76px}
.m-int-page__band{position:absolute;left:0;right:0;top:0;height:250px;background:linear-gradient(135deg,var(--c-solid),color-mix(in srgb,var(--c-solid) 55%,var(--on-gold)))}
.m-int-page__eyebrow{font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--c-strong)}
.m-int-page__title{font-family:var(--ff-serif);font-size:27px;line-height:1.15;font-weight:600;color:var(--text)}
.m-int-page__rule{width:46px;height:2px;background:var(--gold)}
.m-int-page__lead{font-size:12px;color:var(--text-2);line-height:1.6}
.m-int-page__foot{margin-top:14px;font-size:10px;color:var(--text-muted);letter-spacing:.04em}
.m-int-page__box{border:1px solid var(--c-border);border-left:3px solid var(--c-solid);background:var(--c-subtle);padding:10px 12px;display:flex;flex-direction:column;gap:7px;margin:4px 0}
.m-int-page__table{display:grid;grid-template-columns:2fr 1fr 1fr;border:1px solid var(--border);border-bottom:0;border-right:0;margin:4px 0}
.m-int-page__table>span{height:18px;border-bottom:1px solid var(--border);border-right:1px solid var(--border)}
.m-int-page__table>span:nth-child(-n+3){background:var(--c-subtle)}
.m-int-doc{display:flex;flex-direction:column;gap:12px;font-size:11.5px;line-height:1.65;color:var(--text)}
.m-int-doc p{margin:0}
.m-int-doc__c{text-align:center}
.m-int-doc__r{text-align:right}
.m-int-ph{background:var(--gold-subtle);color:var(--gold-text);border-radius:2px;padding:0 3px;font-weight:600}
.m-int-stage{padding:20px;background:var(--surface-sunken);display:flex;justify-content:center}
.m-int-slidebox{width:min(100%,680px);container-type:inline-size}
.m-int-slide{position:relative;aspect-ratio:16/9;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-md);padding:5cqw 6cqw 5cqw 7cqw;display:flex;flex-direction:column;gap:3cqw;overflow:hidden;font-size:2cqw;color:var(--text-2)}
.m-int-slide::before{content:'';position:absolute;left:0;top:0;bottom:0;width:1.2cqw;background:var(--c-solid)}
.m-int-slide .m-int-line{height:1.1cqw}
.m-int-slide__t{font-family:var(--ff-serif);font-size:4.2cqw;font-weight:600;color:var(--text);line-height:1.15}
.m-int-slide__num{position:absolute;right:3cqw;bottom:2.4cqw;font-size:1.6cqw;color:var(--text-muted)}
.m-int-slide--title{background:var(--on-gold);border-color:var(--on-gold);justify-content:center;gap:2.4cqw}
.m-int-slide--title::before{background:var(--gold)}
.m-int-slide__eyebrow{font-size:1.7cqw;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-hover)}
.m-int-slide__h{font-family:var(--ff-serif);font-size:5.4cqw;font-weight:600;line-height:1.1;color:var(--gold-hover);max-width:82%}
.m-int-slide__rule{width:9cqw;height:.5cqw;background:var(--gold)}
.m-int-slide__sub{font-size:1.9cqw;color:var(--gold-hover);opacity:.75}
.m-int-slide--title .m-int-slide__num{color:var(--gold-hover)}
.m-int-slide__grid{display:grid;grid-template-columns:1.2fr 1fr;gap:4cqw;flex:1;align-items:end}
.m-int-slide__bars{display:flex;align-items:flex-end;gap:2cqw;height:22cqw;border-bottom:1px solid var(--border)}
.m-int-slide__bars>span{flex:1;background:var(--c-solid);border-radius:.4cqw .4cqw 0 0}
.m-int-slide__col{display:flex;flex-direction:column;gap:1.8cqw}
.m-int-slide__bul>div{display:flex;align-items:center;gap:2cqw;margin-bottom:2.6cqw}
.m-int-slide__bul i{width:1.4cqw;height:1.4cqw;border-radius:50%;background:var(--c-solid);flex-shrink:0}
.m-int-slide__cards{display:grid;grid-template-columns:repeat(3,1fr);gap:2.4cqw;flex:1}
.m-int-slide__cards>div{border:1px solid var(--c-border);background:var(--c-subtle);border-radius:.5cqw;padding:2.4cqw;display:flex;flex-direction:column;gap:1.4cqw}
.m-int-slide__cards b{font-family:var(--ff-serif);font-size:3.4cqw;color:var(--c-strong);line-height:1}
.m-int-strip{display:flex;gap:10px;overflow-x:auto;padding:10px 12px;border-top:1px solid var(--border);background:var(--surface-2)}
.m-int-sthumb{flex:0 0 112px;container-type:inline-size;border:0;padding:0;background:none;cursor:pointer;border-radius:2px;outline:2px solid transparent;outline-offset:2px}
.m-int-sthumb.is-active{outline-color:var(--gold)}
.m-int-sthumb .m-int-slide{box-shadow:none}
.m-int-xls__fx{display:flex;align-items:center;gap:10px;padding:6px 10px;border-bottom:1px solid var(--border);background:var(--surface-2);font-family:var(--ff-mono);font-size:12px;color:var(--text);min-width:0}
.m-int-xls__ref{min-width:44px;padding:2px 6px;border:1px solid var(--border);border-radius:var(--r-xs);background:var(--surface);text-align:center}
.m-int-xls__fxl{font-style:italic;color:var(--text-muted)}
.m-int-xls__wrap{overflow:auto;max-height:430px;background:var(--surface)}
.m-int-xls table{border-collapse:collapse;font-size:12.5px;min-width:100%}
.m-int-xls th{position:sticky;top:0;z-index:2;background:var(--surface-2);color:var(--text-muted);font-weight:600;font-size:11px;border:1px solid var(--border);padding:4px 8px;text-align:center}
.m-int-xls tbody th{left:0;top:auto;z-index:1;width:38px}
.m-int-xls td{border:1px solid var(--divider);padding:5px 10px;white-space:nowrap;cursor:cell;color:var(--text);min-width:96px;height:28px}
.m-int-xls td.is-head{font-weight:700;background:var(--surface-2)}
.m-int-xls td.is-num{text-align:right;font-variant-numeric:tabular-nums}
.m-int-xls td.is-yes{color:var(--success-text);font-weight:600}
.m-int-xls td.is-no{color:var(--danger-text)}
.m-int-xls td.is-maybe{color:var(--warning-text);font-weight:600}
.m-int-xls td.is-sel{outline:2px solid var(--success);outline-offset:-2px;background:var(--success-subtle)}
.m-int-xls__tabs{display:flex;gap:2px;padding:0 8px;background:var(--surface-2);border-top:1px solid var(--border);overflow-x:auto}
.m-int-xls__tabs button{border:0;border-top:2px solid transparent;background:none;padding:7px 14px;font-size:12px;color:var(--text-muted);cursor:pointer;white-space:nowrap;margin-top:-1px}
.m-int-xls__tabs button.is-active{background:var(--surface);color:var(--success-text);font-weight:600;border-top-color:var(--success)}
.m-int-imgframe{zoom:var(--z,1);flex-shrink:0;width:680px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-md);padding:26px}
.m-int-org__top{display:flex;justify-content:center;gap:14px;padding-bottom:22px;position:relative}
.m-int-org__top::after{content:'';position:absolute;left:50%;bottom:0;height:22px;border-left:1.5px solid var(--border-strong)}
.m-int-org__areas{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;border-top:1.5px solid var(--border-strong);padding-top:18px}
.m-int-org__area{display:flex;flex-direction:column;gap:8px;position:relative;min-width:0}
.m-int-org__area::before{content:'';position:absolute;left:50%;top:-18px;height:18px;border-left:1.5px solid var(--border-strong)}
.m-int-org__name{font-size:9.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-text);text-align:center}
.m-int-org__p{display:flex;align-items:center;gap:7px;padding:7px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);min-width:0}
.m-int-org__p>span{min-width:0}
.m-int-org__p b{display:block;font-size:11px;line-height:1.25;color:var(--text)}
.m-int-org__p small{display:block;font-size:9.5px;color:var(--text-muted);line-height:1.3}
.m-int-org__p.is-lead{border-color:var(--gold-border);background:var(--gold-subtle)}
.m-int-org__top .m-int-org__p{width:220px}
.m-int-cal__head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;border-bottom:2px solid var(--gold);padding-bottom:10px;margin-bottom:14px}
.m-int-cal__head b{font-family:var(--ff-serif);font-size:20px;color:var(--text)}
.m-int-cal__head span{font-size:11px;color:var(--text-muted)}
.m-int-cal__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.m-int-cal__m{border:1px solid var(--border);border-radius:var(--r-sm);padding:8px;min-height:92px;display:flex;flex-direction:column;gap:5px}
.m-int-cal__mn{font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-text);margin-bottom:2px}
.m-int-cal__d{display:flex;gap:6px;align-items:flex-start;font-size:10.5px;line-height:1.3;color:var(--text-2)}
.m-int-cal__d b{min-width:22px;height:18px;display:inline-grid;place-items:center;border-radius:2px;background:var(--c-subtle);color:var(--c-strong);border:1px solid var(--c-border);font-size:10px;flex-shrink:0}
.m-int-cal__none{font-size:10.5px;color:var(--text-muted)}
.m-int-cal__foot{margin-top:12px;font-size:10.5px;color:var(--text-muted);display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.m-int-sig{display:flex;flex-direction:column;gap:10px;font-size:12px;color:var(--text-2)}
.m-int-sig__line{border-bottom:1px solid var(--divider);padding-bottom:6px}
.m-int-sig__body{display:flex;flex-direction:column;gap:7px;padding:6px 0 10px}
.m-int-sig__card{display:flex;gap:16px;align-items:center;padding:14px 0;border-top:2px solid var(--gold)}
.m-int-sig__logo{padding-right:16px;border-right:1px solid var(--border)}
.m-int-sig__logo .lt-logo{height:34px;width:auto}
.m-int-sig__txt{display:flex;flex-direction:column;gap:2px;font-size:11.5px}
.m-int-sig__txt b{font-family:var(--ff-serif);font-size:15px;color:var(--text)}
.m-int-sig__legal{font-size:9.5px;color:var(--text-muted);line-height:1.5}
.m-int-link{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;background:var(--surface)}
.m-int-link__preview{position:relative;min-height:240px}
.m-int-link__preview .lt-cover{position:absolute;inset:0;aspect-ratio:auto}
.m-int-link__body{padding:22px;display:flex;flex-direction:column;gap:10px;min-width:0}
.m-int-link__title{font-family:var(--ff-serif);font-size:20px;font-weight:600;line-height:1.25;color:var(--text)}
.m-int-link__url{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface-2);min-width:0;color:var(--text-2)}
.m-int-link__url .lt-icon{width:15px;height:15px;color:var(--text-muted)}
.m-int-toc{margin:6px 0 0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 16px;counter-reset:toc}
.m-int-toc button{display:flex;gap:8px;align-items:baseline;width:100%;padding:5px 0;border:0;border-bottom:1px dashed var(--divider);background:none;text-align:left;font-size:13px;color:var(--text);cursor:pointer}
.m-int-toc button:hover{color:var(--gold-text)}
.m-int-toc button span{color:var(--text-muted);font-variant-numeric:tabular-nums;min-width:18px}
.m-int-tags{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:38px;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--r-sm);background:var(--surface)}
.m-int-tags:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px var(--gold-focus)}
.m-int-tags__input{flex:1;min-width:140px;border:0;outline:0;background:none;height:26px;font-size:13.5px;color:var(--text)}
.m-int-types{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.m-int-types .lt-choice-card{align-items:center;padding:10px;gap:8px;font-size:13px;font-weight:500;color:var(--text)}
.m-int-types .lt-choice-card .lt-icon{width:16px;height:16px;color:var(--text-muted)}
.m-int-types .lt-choice-card:has(input:checked) .lt-icon{color:var(--gold-text)}
.m-int-swatches{display:flex;gap:10px;flex-wrap:wrap}
.m-int-swatch{position:relative;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;color:var(--text-muted)}
.m-int-swatch input,.m-int-iconopt input{position:absolute;opacity:0;width:0;height:0}
.m-int-swatch span{width:36px;height:36px;border-radius:var(--r-sm);display:grid;place-items:center;background:var(--c-solid);color:var(--c-subtle);border:2px solid var(--surface);box-shadow:0 0 0 1px var(--border-strong)}
.m-int-swatch span .lt-icon{width:16px;height:16px;opacity:0}
.m-int-swatch input:checked+span{box-shadow:0 0 0 2px var(--gold)}
.m-int-swatch input:checked+span .lt-icon{opacity:1}
.m-int-swatch input:focus-visible+span,.m-int-iconopt input:focus-visible+span{outline:2px solid var(--gold);outline-offset:3px}
.m-int-icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:6px}
.m-int-iconopt{position:relative}
.m-int-iconopt span{height:40px;display:grid;place-items:center;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--surface);color:var(--text-2);cursor:pointer}
.m-int-iconopt span:hover{border-color:var(--border-strong)}
.m-int-iconopt input:checked+span{border-color:var(--gold);background:var(--gold-subtle);color:var(--gold-text)}
.m-int-star{border:0;background:none;padding:4px;border-radius:var(--r-sm);color:var(--text-muted);cursor:pointer;display:inline-flex}
.m-int-star:hover{background:var(--surface-3);color:var(--gold-text)}
.m-int-star.is-on{color:var(--gold)}
.m-int-star.is-on .lt-icon{fill:currentColor}
.m-int-grip{border:0;background:none;padding:2px;border-radius:var(--r-xs);cursor:grab;color:var(--text-muted)}
.m-int-grip:focus-visible{outline:2px solid var(--gold)}
.m-int-dragging{opacity:.5}
tr.m-int-dragging td{background:var(--gold-subtle)}
.m-int-catrow{display:grid;grid-template-columns:24px 40px minmax(0,1fr) auto auto auto;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--divider);background:var(--surface)}
.m-int-catrow:last-child{border-bottom:0}
.m-int-catrow__icon{width:40px;height:40px;border-radius:var(--r-sm);display:grid;place-items:center;background:var(--c-solid);color:var(--c-subtle)}
.m-int-catrow__name{font-weight:600;color:var(--text)}
.m-int-catrow__desc{font-size:12px;color:var(--text-muted)}
.m-int-catrow__meta{font-size:12px;color:var(--text-2);text-align:right;white-space:nowrap}
.m-int-steps{list-style:none;margin:0;padding:0}
.m-int-step{display:grid;grid-template-columns:22px 22px 52px minmax(0,1fr);gap:10px;align-items:center;padding:9px 14px;border-bottom:1px solid var(--divider);background:var(--surface)}
.m-int-step:last-child{border-bottom:0}
.m-int-step__num{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;background:var(--surface-3);color:var(--text-2)}
.m-int-step__t{font-size:13px;font-weight:500;color:var(--text)}
.m-int-step__m{font-size:11.5px;color:var(--text-muted);display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:2px}
.m-int-spot{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;padding:18px 20px;align-items:center;margin-bottom:var(--sp-5)}
.m-int-spot__main{display:flex;gap:16px;align-items:center;min-width:0}
.m-int-spot__name{font-family:var(--ff-serif);font-size:22px;font-weight:600;line-height:1.2;color:var(--text)}
.m-int-mx{display:inline-flex;vertical-align:middle}
.m-int-mx .lt-icon{width:18px;height:18px}
.m-int-mxt th .lt-avatar{display:grid;margin:0 auto 3px}
.m-int-mx__nm{display:block;font-size:10.5px;letter-spacing:0;text-transform:none;font-weight:600;color:var(--text-2)}
.m-int-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-2);padding:10px 14px;border-top:1px solid var(--divider)}
.m-int-legend span{display:inline-flex;align-items:center;gap:5px}
.m-int-legend .lt-icon{width:15px;height:15px}
.m-int-sticky{position:sticky;top:calc(var(--topbar-h) + 16px)}
.m-int-catprev{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;align-items:center;padding:12px;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);margin-bottom:var(--sp-4)}
.m-int-catprev .lt-cover{border-radius:var(--r-sm)}
.m-int-more{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600}
.m-int-scrollx{max-width:100%;min-width:0;overflow-x:auto;scrollbar-width:none}
.m-int-scrollx::-webkit-scrollbar{display:none}
@media (max-width:1100px){.m-int-rail{grid-auto-columns:calc((100% - var(--sp-3)) / 2)}.m-int-spot,.m-int-link{grid-template-columns:minmax(0,1fr)}}
@media (max-width:767px){.m-int-rail{grid-auto-columns:88%}.m-int-feat{grid-template-columns:116px minmax(0,1fr)}.m-int-viewer__body{grid-template-columns:minmax(0,1fr);height:460px}.m-int-viewer__thumbs{display:none}.m-int-hide-sm{display:none!important}.m-int-catrow{grid-template-columns:22px 36px minmax(0,1fr) auto}.m-int-catrow__extra{display:none}.m-int-cathead__icon{display:none}.m-int-cats{grid-template-columns:minmax(0,1fr)}.m-int-toc{grid-template-columns:minmax(0,1fr)}.m-int-catprev{grid-template-columns:110px minmax(0,1fr)}}
`;
  (function injetarCss() {
    if (document.getElementById('m-int-css')) return;
    const s = document.createElement('style'); s.id = 'm-int-css'; s.textContent = CSS; document.head.appendChild(s);
  })();

  /* ------------------------------------------------------------------ */
  /* Utilitários                                                          */
  /* ------------------------------------------------------------------ */
  const cat = (id) => DI.categorias.find((c) => String(c.id) === String(id)) || null;
  const tipo = (k) => DI.tipos.find((t) => t.key === k) || DI.tipos[2];
  const mat = (id) => DI.materiais.find((m) => String(m.id) === String(id)) || null;
  const trilha = (id) => DI.trilhas.find((t) => String(t.id) === String(id)) || null;
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const me = () => db.me() || { id: 0, papel: 'socio', nome: 'Usuário' };
  const primeiro = (p) => (p ? p.nome.split(' ')[0] : '—');
  const podeGerenciar = () => ['socio', 'administrativo', 'gestor_comercial'].indexOf(me().papel) >= 0;
  const podeVer = (m, p) => !m.papeis || p.papel === 'socio' || m.papeis.indexOf(p.papel) >= 0;
  const comAcesso = (m) => D.equipe.filter((p) => p.id !== m.autorId && (p.status === 'ativo' || p.status === 'convidado') && podeVer(m, p));
  const catsOrdenadas = () => DI.categorias.slice().sort((a, b) => a.ordem - b.ordem);
  const porCuradoria = (a, b) => (((cat(a.categoriaId) || {}).ordem || 99) - ((cat(b.categoriaId) || {}).ordem || 99)) || (a.ordem - b.ordem);
  const visiveis = () => DI.materiais.filter((m) => m.ativo && podeVer(m, me()));
  const durFmt = (s) => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60; return h ? h + ':' + pad2(mi) + ':' + pad2(se) : mi + ':' + pad2(se); };
  const minutos = (s) => Math.max(1, Math.round((s || 0) / 60)) + ' min';
  function medida(m) {
    switch (m.tipo) {
      case 'video': return durFmt(m.duracao);
      case 'pdf': case 'documento': return m.paginas ? m.paginas + ' p.' : '';
      case 'apresentacao': return m.slides ? m.slides + ' slides' : '';
      case 'planilha': return fmt.plural(m.abas || 1, 'aba');
      case 'imagem': return ((m.arquivo && m.arquivo.nome.split('.').pop()) || 'png').toUpperCase();
      case 'link': return m.duracao ? minutos(m.duracao) : 'Externo';
      default: return '';
    }
  }
  function medidaLonga(m) {
    const tam = m.arquivo ? ' · ' + m.arquivo.tamanho : '';
    switch (m.tipo) {
      case 'video': return durFmt(m.duracao) + tam;
      case 'pdf': case 'documento': return fmt.plural(m.paginas || 1, 'página') + tam;
      case 'apresentacao': return fmt.plural(m.slides || 1, 'slide') + tam;
      case 'planilha': return fmt.plural(m.abas || 1, 'aba') + tam;
      case 'imagem': return m.arquivo ? m.arquivo.tamanho : '';
      case 'link': return m.link ? m.link.dominio : 'Link externo';
      default: return '';
    }
  }
  const ehNovo = (m) => m.ativo && util.diasEntre(m.publicadoEm, App.HOJE) <= 14;
  const meuVisto = (m) => (m.vistoPor || []).find((v) => v.pessoaId === App.meId) || null;
  const trilhasDo = (m) => DI.trilhas.map((t) => { const i = t.etapas.findIndex((e) => e.materialId === m.id); return i >= 0 ? { t: t, e: t.etapas[i], pos: i + 1 } : null; }).filter(Boolean);
  const catChip = (c) => (c ? ui.chip(c.nome, c.cor, { dot: true }) : '');
  const tipoTag = (m) => { const t = tipo(m.tipo); return '<span class="lt-row lt-row--nowrap m-int-tipo" style="gap:6px">' + I(t.icon) + esc(t.nome) + '</span>'; };
  const naoEncontrado = (titulo, texto) => ui.empty({ icon: 'search', title: titulo || 'Material não encontrado', text: texto || 'Ele pode ter sido excluído ou o endereço está incompleto.', action: ui.btn({ label: 'Voltar para a biblioteca', variant: 'primary', icon: 'arrow-left', href: '#int-biblioteca' }) });
  const crumbs = (extra) => [{ label: 'Intranet', hash: 'int-biblioteca' }].concat(extra || []);
  const linkAbs = (hash) => location.href.split('#')[0].split('?')[0] + '#' + hash;

  /* Reordenar por arrastar (linhas de tabela ou listas) + setas do teclado no puxador */
  function arrastavel(container, itemSel, aoSoltar) {
    if (!container) return;
    let arr = null;
    container.addEventListener('mousedown', (e) => { const g = e.target.closest('[data-int-grip]'); if (!g) return; const it = g.closest(itemSel); if (it) it.setAttribute('draggable', 'true'); });
    container.addEventListener('mouseup', () => { container.querySelectorAll(itemSel + '[draggable]').forEach((x) => { if (x !== arr) x.removeAttribute('draggable'); }); });
    container.addEventListener('dragstart', (e) => { const it = e.target.closest && e.target.closest(itemSel); if (!it || it.getAttribute('draggable') !== 'true') return; arr = it; it.classList.add('m-int-dragging'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'ordem'); } catch (x) { /* */ } });
    container.addEventListener('dragover', (e) => {
      if (!arr) return; const over = e.target.closest && e.target.closest(itemSel); if (!over || over === arr || over.parentNode !== arr.parentNode) return;
      e.preventDefault(); const r = over.getBoundingClientRect(); over.parentNode.insertBefore(arr, (e.clientY - r.top) > r.height / 2 ? over.nextSibling : over);
    });
    container.addEventListener('drop', (e) => { if (arr) e.preventDefault(); });
    container.addEventListener('dragend', () => { if (!arr) return; const el = arr; arr = null; el.classList.remove('m-int-dragging'); el.removeAttribute('draggable'); if (aoSoltar) aoSoltar(el); });
    container.addEventListener('keydown', (e) => {
      const g = e.target.closest('[data-int-grip]'); if (!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      const it = g.closest(itemSel), sib = e.key === 'ArrowUp' ? it.previousElementSibling : it.nextElementSibling; if (!sib || !sib.matches(itemSel)) return;
      e.preventDefault(); it.parentNode.insertBefore(it, e.key === 'ArrowUp' ? sib : sib.nextSibling); g.focus(); if (aoSoltar) aoSoltar(it);
    });
  }
  const grip = (label) => '<button type="button" class="lt-drag m-int-grip" data-int-grip aria-label="' + esc(label || 'Arrastar para mudar a ordem (ou use as setas)') + '" title="Arraste ou use as setas ↑ ↓">' + I('grip') + '</button>';

  /* ------------------------------------------------------------------ */
  /* CAPAS geradas (SVG + CSS, cor da categoria + ícone do tipo)          */
  /* ------------------------------------------------------------------ */
  const sheetRect = (x, y, w, h) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" style="fill:var(--surface);stroke:var(--c-border)"/>';
  const bar = (x, y, w, h, fill, op) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + (h || 4) + '" rx="1.5" style="fill:' + fill + (op != null ? ';opacity:' + op : '') + '"/>';
  const etq = (x, y, txt) => '<rect x="' + x + '" y="' + y + '" width="' + (txt.length * 6 + 12) + '" height="14" rx="2" style="fill:var(--c-solid)"/><text x="' + (x + 6) + '" y="' + (y + 10) + '" style="fill:var(--c-subtle);font:700 8px var(--ff-sans);letter-spacing:.08em">' + txt + '</text>';
  const LN = 'var(--c-border)';
  const ART = {
    pdf: () => '<g transform="rotate(-6 112 96)">' + sheetRect(64, 34, 92, 120) + '</g>' + sheetRect(76, 26, 92, 122) +
      '<rect x="76" y="26" width="92" height="22" rx="3" style="fill:var(--c-solid)"/><rect x="76" y="40" width="92" height="8" style="fill:var(--c-solid)"/>' +
      bar(86, 58, 50, 6, 'var(--c-strong)', 0.75) + bar(86, 71, 72, 4, LN) + bar(86, 80, 66, 4, LN) + bar(86, 89, 72, 4, LN) + bar(86, 98, 52, 4, LN) + bar(86, 110, 72, 4, LN) + bar(86, 119, 60, 4, LN) + etq(86, 128, 'PDF'),
    documento: () => sheetRect(72, 22, 100, 132) + bar(84, 34, 36, 4, 'var(--c-solid)') + bar(84, 45, 74, 6, 'var(--c-strong)', 0.75) +
      [58, 67, 76, 85, 94, 103].map((y, i) => bar(84, y, [76, 70, 76, 64, 76, 58][i], 4, LN)).join('') +
      '<path d="M116 126h44" style="stroke:var(--c-strong);stroke-width:1;opacity:.6"/>' + etq(84, 132, 'DOCX'),
    apresentacao: () => '<path d="M116 132v14M100 152l16-6 16 6" style="fill:none;stroke:var(--c-strong);stroke-width:2;stroke-linecap:round;opacity:.45"/>' +
      '<rect x="40" y="34" width="152" height="98" rx="3" style="fill:var(--surface);stroke:var(--c-border)"/>' +
      '<rect x="40" y="34" width="152" height="12" rx="3" style="fill:var(--c-solid)"/><rect x="40" y="40" width="152" height="6" style="fill:var(--c-solid)"/>' +
      bar(52, 56, 62, 6, 'var(--c-strong)', 0.75) + [80, 90, 100, 110].map((y, i) => '<circle cx="55" cy="' + (y + 2) + '" r="2" style="fill:var(--c-solid)"/>' + bar(61, y, [44, 50, 38, 46][i], 4, LN)).join('') +
      [[122, 100, 22], [140, 88, 34], [158, 76, 46], [176, 64, 58]].map((b) => '<rect x="' + b[0] + '" y="' + b[1] + '" width="12" height="' + b[2] + '" style="fill:var(--c-solid);opacity:.85"/>').join('') +
      '<path d="M118 122h66" style="stroke:var(--c-border)"/>',
    planilha: () => '<rect x="44" y="30" width="144" height="112" rx="3" style="fill:var(--surface);stroke:var(--c-border)"/>' +
      '<rect x="44" y="30" width="144" height="18" rx="3" style="fill:var(--c-solid)"/><rect x="44" y="40" width="144" height="8" style="fill:var(--c-solid)"/>' +
      '<rect x="116" y="86" width="36" height="19" style="fill:var(--c-solid);opacity:.22"/><rect x="152" y="105" width="36" height="19" style="fill:var(--c-solid);opacity:.4"/>' +
      '<path d="M80 48V142M116 48V142M152 48V142M44 67H188M44 86H188M44 105H188M44 124H188" style="stroke:var(--c-border);stroke-width:1"/>' +
      bar(50, 55, 22, 4, 'var(--c-strong)', 0.6) + bar(50, 74, 24, 4, LN) + bar(50, 93, 20, 4, LN) + bar(50, 112, 24, 4, LN) + bar(124, 74, 22, 4, LN) + bar(160, 93, 20, 4, LN) + etq(52, 150, 'XLSX'),
    imagem: () => '<rect x="40" y="30" width="150" height="114" rx="3" style="fill:var(--surface);stroke:var(--c-border)"/>' +
      '<rect x="48" y="38" width="134" height="98" rx="2" style="fill:var(--c-subtle)"/><circle cx="152" cy="62" r="10" style="fill:var(--gold)"/>' +
      '<path d="M48 136L90 86l26 30 18-18 48 38Z" style="fill:var(--c-solid);opacity:.85"/><path d="M48 136l28-28 24 28Z" style="fill:var(--c-strong);opacity:.45"/>',
    link: () => '<rect x="36" y="32" width="160" height="110" rx="4" style="fill:var(--surface);stroke:var(--c-border)"/><path d="M36 50H196" style="stroke:var(--c-border)"/>' +
      '<circle cx="46" cy="41" r="2.6" style="fill:var(--c-border)"/><circle cx="54" cy="41" r="2.6" style="fill:var(--c-border)"/><circle cx="62" cy="41" r="2.6" style="fill:var(--c-border)"/>' +
      '<rect x="74" y="36" width="114" height="10" rx="5" style="fill:var(--c-subtle);stroke:var(--c-border)"/>' +
      '<g transform="translate(92 62) scale(2)" style="fill:none;stroke:var(--c-solid);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round">' + App.icons.link + '</g>' +
      bar(60, 118, 112, 4, LN) + bar(60, 127, 80, 4, LN),
    video: (o) => '<path d="M0 180L120 0h70L70 180Z" style="fill:var(--c-solid);opacity:.24"/><path d="M150 180L250 0h22L172 180Z" style="fill:var(--c-solid);opacity:.14"/>' +
      (o.noPlay ? '' : '<circle cx="160" cy="90" r="37" style="fill:none;stroke:var(--gold);opacity:.45"/><circle cx="160" cy="90" r="27" style="fill:var(--gold)"/><path d="M152 77l22 13-22 13Z" style="fill:var(--on-gold)"/>')
  };
  function coverArt(tp, icone, o) {
    const vid = tp === 'video', P = App.icons[icone] || App.icons.folder;
    return '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<g style="fill:none;stroke:' + (vid ? 'var(--gold)' : 'var(--c-solid)') + ';stroke-width:1"><circle cx="300" cy="10" r="64" style="opacity:.32"/><circle cx="300" cy="10" r="100" style="opacity:.2"/><circle cx="300" cy="10" r="138" style="opacity:.12"/></g>' +
      '<g transform="translate(226 86) scale(3.3)" style="fill:none;stroke:' + (vid ? 'var(--gold-hover)' : 'var(--c-solid)') + ';stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round;opacity:' + (vid ? '.16' : '.26') + '">' + P + '</g>' +
      (ART[tp] || ART.pdf)(o || {}) + '</svg>';
  }
  /* cover(m, { mini, compact, bare, noPlay, noFlag, progress, tone, icone, cls }) */
  function cover(m, o) {
    o = o || {};
    const c = cat(m.categoriaId) || DI.categorias[0], t = tipo(m.tipo), video = m.tipo === 'video' && !m.capaUrl;
    let h = '<div class="lt-cover' + (video ? ' lt-cover--video' : '') + (o.mini ? ' lt-cover--mini' : '') + (o.cls ? ' ' + o.cls : '') + '" data-mtone="' + (o.tone || c.cor) + '">';
    h += m.capaUrl ? '<img src="' + esc(m.capaUrl) + '" alt="">' : coverArt(m.tipo, o.icone || c.icone, o);
    if (!o.mini && !o.bare) {
      if (!o.compact) {
        h += '<span class="lt-cover__type">' + I(t.icon) + esc(t.nome) + '</span>';
        const md = medida(m); if (md) h += '<span class="lt-cover__meta">' + (m.tipo === 'video' ? I('play') : '') + esc(md) + '</span>';
        if (!o.noFlag) {
          if (m.status === 'processando') h += '<span class="lt-cover__flag" data-mtone="amber">Processando</span>';
          else if (ehNovo(m)) h += '<span class="lt-cover__flag is-solid">Novo</span>';
          else if (m.aceite) h += '<span class="lt-cover__flag" data-mtone="red" title="Leitura obrigatória com confirmação">Obrigatória</span>';
        }
      }
      if (o.progress != null && o.progress > 0 && o.progress < 100) h += '<span class="lt-cover__progress" title="Você assistiu ' + o.progress + '%"><span style="width:' + o.progress + '%"></span></span>';
    }
    return h + '</div>';
  }

  /* Card da biblioteca */
  function card(m, o) {
    o = o || {};
    const c = cat(m.categoriaId) || {}, a = db.pessoa(m.autorId), mv = meuVisto(m);
    const tag = o.estatico ? 'div' : 'a';
    return '<' + tag + ' class="lt-media-card"' + (o.estatico ? '' : ' href="#int-material-' + m.id + '"') + ' data-mtone="' + (c.cor || 'gold') + '">' + cover(m, { progress: mv && m.tipo === 'video' ? mv.progresso : null }) +
      '<div class="lt-media-card__body"><div class="lt-media-card__cat"><i aria-hidden="true"></i><span class="lt-truncate">' + esc(c.nome || 'Sem categoria') + '</span></div>' +
      '<div class="lt-media-card__title" title="' + esc(m.titulo) + '">' + esc(m.titulo) + '</div>' +
      '<div class="lt-media-card__meta">' + ui.avatar(a || me(), 'xs') + '<span class="lt-truncate">' + esc(primeiro(a || me())) + ' · ' + fmt.data(m.atualizadoEm) + '</span>' +
      '<span class="lt-media-card__views" title="' + esc(fmt.plural((m.vistoPor || []).length, 'pessoa viu', 'pessoas viram')) + '">' + I('eye') + '<span class="lt-num">' + (m.vistoPor || []).length + '</span></span></div></div></' + tag + '>';
  }
  function feat(m) {
    const c = cat(m.categoriaId) || {}, mv = meuVisto(m);
    return '<a class="m-int-feat" href="#int-material-' + m.id + '" data-mtone="' + c.cor + '">' + cover(m, { compact: true, progress: mv && m.tipo === 'video' ? mv.progresso : null }) +
      '<div class="m-int-feat__body"><div class="lt-media-card__cat"><i aria-hidden="true"></i><span class="lt-truncate">' + esc(c.nome) + '</span></div><div class="m-int-feat__title">' + esc(m.titulo) + '</div>' +
      '<div class="lt-media-card__meta"><span class="lt-row lt-row--nowrap m-int-tipo" style="gap:6px" title="' + esc(tipo(m.tipo).nome) + '">' + I(tipo(m.tipo).icon) + '<span class="lt-num">' + esc(medida(m)) + '</span></span></div></div></a>';
  }
  const thumbMini = (m, sm) => '<div class="lt-cover-thumb' + (sm ? ' lt-cover-thumb--sm' : '') + '">' + cover(m, { mini: true }) + '</div>';

  /* ================================================================== */
  /* BIBLIOTECA                                                          */
  /* ================================================================== */
  const LIB = () => (App.state.intLib = App.state.intLib || { cats: [], tipo: '', busca: '', ordem: 'recentes', view: 'grade' });
  const ORDENS = [['recentes', 'Mais recentes'], ['vistos', 'Mais vistos'], ['az', 'Título (A a Z)'], ['curadoria', 'Ordem da curadoria']];
  function filtrar(st, base) {
    const q = norm(st.busca);
    let r = (base || visiveis()).slice();
    if (st.cats && st.cats.length) r = r.filter((m) => st.cats.indexOf(String(m.categoriaId)) >= 0);
    if (st.tipo) r = r.filter((m) => m.tipo === st.tipo);
    if (q) r = r.filter((m) => norm(m.titulo + ' ' + m.tags.join(' ') + ' ' + m.descricao + ' ' + ((cat(m.categoriaId) || {}).nome || '')).indexOf(q) >= 0);
    const ord = {
      recentes: (a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : a.atualizadoEm > b.atualizadoEm ? -1 : b.id - a.id),
      vistos: (a, b) => b.vistoPor.length - a.vistoPor.length || b.visualizacoes - a.visualizacoes,
      az: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'),
      curadoria: porCuradoria
    };
    return r.sort(ord[st.ordem] || ord.recentes);
  }
  function listaTabela(r) {
    return ui.table({
      rows: r, pageSize: 12, rowHref: (m) => '#int-material-' + m.id,
      columns: [
        { key: 'titulo', label: 'Material', sortable: true, value: (m) => m.titulo, render: (m) => '<div class="lt-row lt-row--nowrap" style="gap:12px">' + thumbMini(m) + '<div style="min-width:0"><span class="lt-table__primary">' + esc(m.titulo) + '</span><span class="lt-table__secondary lt-truncate" style="max-width:380px">' + esc(m.descricao) + '</span></div></div>' },
        { key: 'cat', label: 'Categoria', sortable: true, value: (m) => (cat(m.categoriaId) || {}).nome, render: (m) => catChip(cat(m.categoriaId)) },
        { key: 'tipo', label: 'Tipo', sortable: true, value: (m) => tipo(m.tipo).nome, render: tipoTag },
        { key: 'med', label: 'Tamanho', render: (m) => '<span class="lt-text-2 lt-num">' + esc(medidaLonga(m)) + '</span>' },
        { key: 'upd', label: 'Atualizado', sortable: true, value: (m) => m.atualizadoEm, render: (m) => fmt.data(m.atualizadoEm) },
        { key: 'vis', label: 'Vistos', align: 'right', sortable: true, value: (m) => m.vistoPor.length, render: (m) => '<span class="lt-row lt-row--nowrap" style="gap:4px;justify-content:flex-end">' + I('eye') + m.vistoPor.length + '</span>' }
      ]
    });
  }
  function resultados(st) {
    const r = filtrar(st), n = (st.cats.length ? 1 : 0) + (st.tipo ? 1 : 0) + (st.busca ? 1 : 0);
    let h = '<div class="lt-row lt-row--between lt-mb-4"><span class="lt-small lt-text-2"><b class="lt-num">' + r.length + '</b> ' + (r.length === 1 ? 'material' : 'materiais') + (st.busca ? ' para "' + esc(st.busca) + '"' : '') + (n ? ' com os filtros aplicados' : '') + '</span>' +
      (n ? '<button type="button" class="lt-link-btn lt-small" data-int-limpar>Limpar filtros</button>' : '<span class="lt-hint">' + esc((ORDENS.find((o) => o[0] === st.ordem) || ORDENS[0])[1]) + '</span>') + '</div>';
    if (!r.length) {
      return h + '<div class="lt-card">' + ui.empty({ icon: 'search', title: 'Nenhum material encontrado', text: 'Tente outra palavra, outra categoria ou outro tipo. A busca procura no título, na descrição e nas tags.', action: '<button type="button" class="lt-btn lt-btn--default" data-int-limpar>' + I('x') + '<span>Limpar filtros</span></button>' + ui.btn({ label: 'Enviar material', variant: 'primary', icon: 'upload', sheet: 'int-novo-material' }) }) + '</div>';
    }
    return h + (st.view === 'lista' ? listaTabela(r) : '<div class="lt-media-grid">' + r.map((m) => card(m)).join('') + '</div>');
  }
  function faixaDestaques() {
    const ds = visiveis().filter((m) => m.destaque).sort(porCuradoria);
    if (!ds.length) return '';
    return '<section class="m-int-band" aria-label="Materiais em destaque"><div class="m-int-band__head"><div class="lt-row" style="gap:12px"><span class="lt-eyebrow">' + I('star') + 'Em destaque</span><span class="lt-hint">Escolhidos pela coordenação · ' + ds.length + ' materiais</span></div>' +
      '<div class="lt-row" style="gap:2px">' + ui.btn({ icon: 'chevron-left', variant: 'ghost', size: 'sm', tip: 'Destaques anteriores', attrs: { 'data-int-rail': '-1' } }) + ui.btn({ icon: 'chevron-right', variant: 'ghost', size: 'sm', tip: 'Próximos destaques', attrs: { 'data-int-rail': '1' } }) + '</div></div>' +
      '<div class="m-int-rail" data-int-railbox>' + ds.map(feat).join('') + '</div></section>';
  }
  function navCategorias() {
    const ativos = visiveis();
    return '<div class="lt-row lt-row--between lt-mb-4"><h2 class="lt-card__title">' + I('layers') + 'Navegar por categoria</h2>' + (podeGerenciar() ? '<a class="m-int-more" href="#int-categorias">Organizar categorias' + I('chevron-right') + '</a>' : '') + '</div>' +
      '<div class="m-int-cats">' + catsOrdenadas().filter((c) => c.ativo).map((c) => {
        const n = ativos.filter((m) => m.categoriaId === c.id).length;
        return '<a class="m-int-cat" href="#int-categoria-' + c.id + '" data-mtone="' + c.cor + '"><span class="m-int-cat__icon">' + I(c.icone) + '</span><span style="min-width:0"><span class="m-int-cat__name lt-truncate">' + esc(c.nome) + '</span><span class="m-int-cat__count">' + fmt.plural(n, 'material', 'materiais') + '</span></span>' + I('chevron-right', 'm-int-cat__chev') + '</a>';
      }).join('') + '</div>';
  }

  App.screen({
    id: 'int.library.grid', hash: 'int-biblioteca', module: 'intranet', title: 'Biblioteca', nav: true, navGroup: 'intranet', navLabel: 'Biblioteca', navOrder: 1,
    render: () => {
      const st = LIB();
      if (App.state.intBuscaTag) { st.busca = App.state.intBuscaTag; st.cats = []; st.tipo = ''; delete App.state.intBuscaTag; }
      const vis = visiveis(), cats = catsOrdenadas().filter((c) => c.ativo);
      const filtros = ui.filters({
        busca: 'Buscar por título ou tag',
        selects: [{ label: 'Tipo', name: 'int-tipo', value: st.tipo, options: DI.tipos.map((t) => ({ value: t.key, label: t.plural })) }],
        extra: '<select class="lt-select" name="int-ordem" aria-label="Ordenar">' + ORDENS.map((o) => '<option value="' + o[0] + '"' + (o[0] === st.ordem ? ' selected' : '') + '>Ordenar: ' + esc(o[1]) + '</option>').join('') + '</select>' +
          ui.segmented([{ label: 'Grade', value: 'grade', icon: 'grid', active: st.view !== 'lista' }, { label: 'Lista', value: 'lista', icon: 'list', active: st.view === 'lista' }], { name: 'int-view' })
      });
      const chips = '<div data-int-catfilter>' + ui.filters({
        chipGroup: 'multi',
        chips: [{ label: 'Todas', value: 'todas', active: !st.cats.length, count: vis.length }].concat(cats.map((c) => ({ label: c.nome, value: String(c.id), tone: c.cor, active: st.cats.indexOf(String(c.id)) >= 0, count: vis.filter((m) => m.categoriaId === c.id).length })))
      }) + '</div>';
      return ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Biblioteca' }]), title: 'Biblioteca',
        sub: fmt.plural(vis.length, 'material', 'materiais') + ' da equipe: documentos, apresentações, modelos e vídeos de treinamento.',
        actions: (podeGerenciar() ? ui.btn({ label: 'Gerenciar', icon: 'sliders', href: '#int-gerenciar' }) : '') + ui.btn({ label: 'Enviar material', variant: 'primary', icon: 'upload', sheet: 'int-novo-material' })
      }) + faixaDestaques() + filtros + chips + '<div data-int-res>' + resultados(st) + '</div><div class="lt-mt-6">' + navCategorias() + '</div>';
    },
    mount: (root) => {
      const st = LIB(), box = root.querySelector('[data-int-res]');
      const redraw = () => { box.innerHTML = resultados(st); ui.enhance(box); };
      const busca = root.querySelector('[data-filter-search]');
      if (busca) {
        busca.value = st.busca; let t = null;
        busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { st.busca = busca.value.trim(); redraw(); }, 160); });
      }
      root.addEventListener('lt:filter', (e) => {
        const grp = e.target.closest('[data-filter-group]'); if (!grp || !grp.closest('[data-int-catfilter]')) return;
        const v = e.detail.value;
        if (v === 'todas') st.cats = [];
        else { const i = st.cats.indexOf(v); if (i >= 0) st.cats.splice(i, 1); else st.cats.push(v); }
        grp.querySelectorAll('.lt-filter-chip').forEach((b) => { const val = b.getAttribute('data-value'); b.classList.toggle('is-active', val === 'todas' ? !st.cats.length : st.cats.indexOf(val) >= 0); });
        redraw();
      });
      root.addEventListener('lt:segment', (e) => { if (e.detail.name === 'int-view') { st.view = e.detail.value; redraw(); } });
      root.addEventListener('change', (e) => {
        if (e.target.name === 'int-tipo') { st.tipo = e.target.value; redraw(); }
        if (e.target.name === 'int-ordem') { st.ordem = e.target.value; redraw(); }
      });
      root.addEventListener('click', (e) => {
        if (e.target.closest('[data-int-limpar]')) { Object.assign(st, { cats: [], tipo: '', busca: '' }); App.refresh(); return; }
        const r = e.target.closest('[data-int-rail]');
        if (r) { const rail = root.querySelector('[data-int-railbox]'); if (rail) rail.scrollBy({ left: +r.getAttribute('data-int-rail') * rail.clientWidth, behavior: 'smooth' }); }
      });
    }
  });

  /* ================================================================== */
  /* CATEGORIA                                                           */
  /* ================================================================== */
  App.screen({
    id: 'int.category.detail', hash: 'int-categoria', module: 'intranet', title: 'Categoria da biblioteca', navGroup: 'intranet', navParent: 'int-biblioteca', exemplo: 2,
    render: (p) => {
      const c = cat(p.id);
      if (!c) return naoEncontrado('Categoria não encontrada', 'Escolha uma categoria na biblioteca.');
      const lista = visiveis().filter((m) => m.categoriaId === c.id).sort(porCuradoria);
      const tiposPresentes = DI.tipos.filter((t) => lista.some((m) => m.tipo === t.key));
      const cur = db.pessoa(c.curadorId), st = App.state['intCat' + c.id] || 'todos';
      const vistos = util.soma(lista, (m) => m.vistoPor.length);
      /* cabeçalho padrão (ui.pageHeader); a cor da categoria fica só no ícone quadrado e nos chips */
      const hero = '<div class="m-int-cathead" data-mtone="' + c.cor + '"><span class="m-int-cathead__icon" aria-hidden="true">' + I(c.icone) + '</span><div>' + ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Biblioteca', hash: 'int-biblioteca' }, { label: c.nome }]), eyebrow: 'Categoria', title: c.nome, sub: esc(c.descricao),
        meta: ui.chip(fmt.plural(lista.length, 'material', 'materiais'), c.cor, { icon: c.icone }) + ui.chip(fmt.plural(lista.filter((m) => m.tipo === 'video').length, 'vídeo'), 'gray', { icon: 'video' }) + ui.chip(fmt.plural(vistos, 'visualização', 'visualizações'), 'gray', { icon: 'eye' }) +
          '<span class="lt-row lt-row--nowrap lt-small lt-muted" style="gap:6px">Curadoria: ' + ui.avatar(cur, 'xs') + esc(cur ? cur.nome : '—') + '</span>',
        actions: (podeGerenciar() ? ui.btn({ label: 'Editar categoria', icon: 'edit', sheet: 'int-categoria', attrs: { 'data-id': c.id } }) : '') + ui.btn({ label: 'Enviar material', variant: 'primary', icon: 'upload', sheet: 'int-novo-material', attrs: { 'data-categoria': c.id } })
      }) + '</div></div>';
      const seg = ui.segmented([{ label: 'Todos · ' + lista.length, value: 'todos', active: st === 'todos' }].concat(tiposPresentes.map((t) => ({ label: t.plural + ' · ' + lista.filter((m) => m.tipo === t.key).length, value: t.key, icon: t.icon, active: st === t.key }))), { name: 'int-cat-tipo' });
      const outras = catsOrdenadas().filter((x) => x.ativo && x.id !== c.id);
      const top = lista.slice().sort((a, b) => b.vistoPor.length - a.vistoPor.length).slice(0, 3);
      const lado = ui.card({ title: 'Mais vistos aqui', icon: 'trending-up', flush: true, body: ui.list(top.map((m) => ({ lead: thumbMini(m, true), title: esc(m.titulo), meta: '<span>' + esc(tipo(m.tipo).nome) + '</span><span>' + fmt.plural(m.vistoPor.length, 'pessoa', 'pessoas') + '</span>', href: '#int-material-' + m.id }))) }) +
        ui.card({ title: 'Outras categorias', icon: 'layers', flush: true, body: ui.list(outras.map((x) => ({ icon: x.icone, tone: x.cor === 'gray' || x.cor === 'slate' ? null : x.cor, title: esc(x.nome), meta: fmt.plural(visiveis().filter((m) => m.categoriaId === x.id).length, 'material', 'materiais'), href: '#int-categoria-' + x.id }))) });
      return hero + '<div class="lt-split"><div style="min-width:0"><div class="lt-row lt-row--between lt-mb-4"><div class="m-int-scrollx">' + seg + '</div><span class="lt-hint">Na ordem definida pela curadoria</span></div><div data-int-catgrid>' + catGrid(lista, st) + '</div></div><div class="lt-stack">' + lado + '</div></div>';
    },
    mount: (root, p) => {
      const c = cat(p.id); if (!c) return;
      root.addEventListener('lt:segment', (e) => {
        if (e.detail.name !== 'int-cat-tipo') return;
        App.state['intCat' + c.id] = e.detail.value;
        root.querySelector('[data-int-catgrid]').innerHTML = catGrid(visiveis().filter((m) => m.categoriaId === c.id).sort(porCuradoria), e.detail.value);
      });
    }
  });
  function catGrid(lista, st) {
    const r = st && st !== 'todos' ? lista.filter((m) => m.tipo === st) : lista;
    if (!r.length) return '<div class="lt-card">' + ui.empty({ icon: 'folder', title: 'Nada nesta categoria ainda', text: 'Quando alguém publicar um material aqui, ele aparece nesta página.', action: ui.btn({ label: 'Enviar material', variant: 'primary', icon: 'upload', sheet: 'int-novo-material' }) }) + '</div>';
    return '<div class="lt-media-grid lt-media-grid--sm">' + r.map((m) => card(m)).join('') + '</div>';
  }

  /* ================================================================== */
  /* VISUALIZAR MATERIAL                                                 */
  /* ================================================================== */
  const LINHAS = [92, 100, 96, 84, 100, 72, 98, 90, 100, 64];
  const linhas = (n, seed) => { let s = ''; for (let i = 0; i < n; i++) s += '<span class="m-int-line" style="width:' + LINHAS[(i + (seed || 0)) % LINHAS.length] + '%"></span>'; return s; };
  const PH = (t) => '<span class="m-int-ph">[' + esc(t) + ']</span>';
  const MODELOS = {
    4103: () => '<p class="m-int-doc__r">Campinas, ' + PH('data') + '</p><p>À<br><b>' + PH('RAZÃO SOCIAL') + '</b><br>A/C ' + PH('nome do decisor') + '</p><p><b>Ref.: Proposta de recuperação de créditos tributários</b></p><p>Prezado(a) ' + PH('nome') + ', agradecemos a reunião de diagnóstico. A Atlas Corporate propõe analisar o período de ' + PH('período') + ' para as teses abaixo, com honorário mensal de ' + PH('valor') + ' e honorário de êxito de ' + PH('percentual') + ' sobre o crédito efetivamente compensado.</p>',
    4113: () => '<p class="m-int-doc__c"><b>EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A) FEDERAL DA ' + PH('nº') + ' VARA FEDERAL DE CAMPINAS/SP</b></p><p><b>' + PH('RAZÃO SOCIAL') + '</b>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ' + PH('CNPJ') + ', com sede em ' + PH('endereço') + ', por seus advogados (procuração anexa), vem impetrar <b>MANDADO DE SEGURANÇA</b>, com pedido liminar, contra ato do Delegado da Receita Federal do Brasil em Campinas/SP, pelos fatos e fundamentos a seguir.</p>',
    4114: () => '<p class="m-int-doc__c"><b>PROCURAÇÃO AD JUDICIA ET EXTRA</b></p><p><b>OUTORGANTE:</b> ' + PH('RAZÃO SOCIAL') + ', inscrita no CNPJ sob o nº ' + PH('CNPJ') + ', representada por ' + PH('representante legal') + '.</p><p><b>OUTORGADOS:</b> Eduardo Lacerda (OAB/SP 198.452) e Beatriz Sampaio (OAB/SP 312.077), com escritório em Campinas/SP.</p><p><b>PODERES:</b> para o foro em geral e para representar a outorgante perante a Receita Federal do Brasil, podendo ' + PH('poderes específicos') + '.</p>',
    4116: () => '<p><b>À DELEGACIA DA RECEITA FEDERAL DO BRASIL EM CAMPINAS/SP</b></p><p><b>' + PH('RAZÃO SOCIAL') + '</b>, CNPJ ' + PH('CNPJ') + ', vem requerer a <b>HABILITAÇÃO DE CRÉDITO</b> decorrente de decisão judicial transitada em julgado nos autos nº ' + PH('número do processo') + ', conforme os documentos anexos.</p>'
  };
  function paginaHtml(m, p) {
    const c = cat(m.categoriaId) || {}, n = m.paginas || 1, secs = m.secoes && m.secoes.length ? m.secoes : ['Introdução', 'Desenvolvimento', 'Conclusão'];
    let inner, capa = false;
    if (p === 1 && m.modelo && MODELOS[m.id]) inner = '<div class="m-int-doc">' + MODELOS[m.id]() + linhas(7, 2) + '</div>';
    else if (p === 1) {
      capa = true;
      inner = '<div class="m-int-page__band"></div><div class="m-int-page__eyebrow">Atlas Corporate · ' + esc(c.nome) + '</div><div class="m-int-page__title">' + esc(m.titulo) + '</div><div class="m-int-page__rule"></div><div class="m-int-page__lead">' + esc(m.descricao) + '</div><div class="m-int-page__foot">Versão ' + m.versao + ' · ' + esc(fmt.mesAno(m.atualizadoEm).toLowerCase()) + ' · uso interno</div>';
    } else {
      const si = (p - 2) % secs.length;
      inner = '<h4>' + (si + 1) + '. ' + esc(secs[si]) + '</h4>' + linhas(5, p) + (p % 3 === 0 ? '<div class="m-int-page__box">' + linhas(3, p + 2) + '</div>' : '') + linhas(4, p + 3) +
        (p % 4 === 0 ? '<div class="m-int-page__table">' + Array.from({ length: 12 }, () => '<span></span>').join('') + '</div>' : '') + linhas(6, p + 5);
    }
    return '<div class="m-int-page' + (capa ? ' m-int-page--cover' : '') + '" data-mtone="' + (c.cor || 'gold') + '">' + inner + '<span class="m-int-page__num">' + p + ' / ' + n + '</span></div>';
  }
  function docViewer(m) {
    const n = m.paginas || 1, c = cat(m.categoriaId) || {};
    const thumbs = Array.from({ length: n }, (_, i) => '<button type="button" class="m-int-thumb' + (i ? '' : ' is-active') + '" data-int-page="' + (i + 1) + '" aria-label="Página ' + (i + 1) + '">' + (i ? '' : '<span class="m-int-thumb__band"></span>') + '<span style="height:' + (i ? 2 : 34) + 'px"></span>' + linhas(i ? 9 : 4, i) + '<span class="m-int-thumb__n">' + (i + 1) + '</span></button>').join('');
    return '<div class="m-int-viewer" data-int-doc data-pages="' + n + '" data-mtone="' + c.cor + '"><div class="m-int-viewer__bar">' +
      ui.btn({ icon: 'sidebar', variant: 'ghost', size: 'sm', tip: 'Mostrar ou esconder miniaturas', attrs: { 'data-int-thumbs': true } }) + '<span class="m-int-viewer__sep"></span>' +
      ui.btn({ icon: 'chevron-left', variant: 'ghost', size: 'sm', tip: 'Página anterior', attrs: { 'data-int-prev': true } }) + '<span>Página</span><input class="lt-input lt-num" value="1" data-int-pageinput aria-label="Ir para a página"><span>de <b class="lt-num">' + n + '</b></span>' +
      ui.btn({ icon: 'chevron-right', variant: 'ghost', size: 'sm', tip: 'Próxima página', attrs: { 'data-int-next': true } }) + '<span class="m-int-viewer__sep"></span>' +
      ui.btn({ icon: 'minus', variant: 'ghost', size: 'sm', tip: 'Diminuir zoom', attrs: { 'data-int-zoom': '-1' } }) + '<span class="lt-num" data-int-zoomlabel style="min-width:40px;text-align:center">100%</span>' + ui.btn({ icon: 'plus', variant: 'ghost', size: 'sm', tip: 'Aumentar zoom', attrs: { 'data-int-zoom': '1' } }) +
      '<span class="lt-push"></span><span class="m-int-viewer__file m-int-hide-sm">' + I(tipo(m.tipo).icon) + '<span class="lt-truncate" style="max-width:220px">' + esc(m.arquivo ? m.arquivo.nome : '') + '</span></span></div>' +
      '<div class="m-int-viewer__body"><div class="m-int-viewer__thumbs">' + thumbs + '</div><div class="m-int-viewer__canvas" data-int-canvas style="--z:1">' + paginaHtml(m, 1) + '</div></div></div>';
  }
  function slideHtml(m, s) {
    const c = cat(m.categoriaId) || {}, tt = m.slideTitulos && m.slideTitulos.length ? m.slideTitulos : [m.titulo], n = m.slides || tt.length;
    if (s === 1) return '<div class="m-int-slide m-int-slide--title" data-mtone="' + c.cor + '"><span class="m-int-slide__eyebrow">Atlas Corporate · ' + esc(c.nome) + '</span><span class="m-int-slide__h">' + esc(tt[0]) + '</span><span class="m-int-slide__rule"></span><span class="m-int-slide__sub">' + esc(fmt.mesAno(m.atualizadoEm)) + '</span><span class="m-int-slide__num">1 / ' + n + '</span></div>';
    const title = tt.length > 1 ? tt[1 + ((s - 2) % (tt.length - 1))] : 'Slide ' + s, v = s % 3;
    let body;
    if (v === 0) body = '<div class="m-int-slide__grid"><div class="m-int-slide__bars">' + [38, 62, 50, 84, 70].map((h, i) => '<span style="height:' + ((h + s * 7 * (i + 1)) % 60 + 35) + '%"></span>').join('') + '</div><div class="m-int-slide__col">' + linhas(5, s) + '</div></div>';
    else if (v === 1) body = '<div class="m-int-slide__bul">' + [0, 1, 2, 3].map((i) => '<div><i></i><span class="m-int-line" style="width:' + LINHAS[(i + s) % 10] * 0.8 + '%"></span></div>').join('') + '</div>';
    else body = '<div class="m-int-slide__cards">' + [0, 1, 2].map((i) => '<div><b>' + (i + 1) + '</b>' + linhas(3, s + i) + '</div>').join('') + '</div>';
    return '<div class="m-int-slide" data-mtone="' + c.cor + '"><span class="m-int-slide__t">' + esc(title) + '</span>' + body + '<span class="m-int-slide__num">' + s + ' / ' + n + '</span></div>';
  }
  function slidesViewer(m) {
    const n = m.slides || 1;
    return '<div class="m-int-viewer" data-int-slides data-pages="' + n + '"><div class="m-int-viewer__bar">' +
      ui.btn({ icon: 'chevron-left', variant: 'ghost', size: 'sm', tip: 'Slide anterior', attrs: { 'data-int-prev': true } }) + '<span>Slide <b class="lt-num" data-int-cur>1</b> de <b class="lt-num">' + n + '</b></span>' + ui.btn({ icon: 'chevron-right', variant: 'ghost', size: 'sm', tip: 'Próximo slide', attrs: { 'data-int-next': true } }) +
      '<span class="lt-push"></span><span class="m-int-viewer__file m-int-hide-sm">' + I('presentation') + '<span class="lt-truncate" style="max-width:220px">' + esc(m.arquivo ? m.arquivo.nome : '') + '</span></span>' +
      ui.btn({ label: 'Apresentar', icon: 'monitor', size: 'sm', attrs: { 'data-int-apresentar': true } }) + '</div>' +
      '<div class="m-int-stage"><div class="m-int-slidebox" data-int-canvas>' + slideHtml(m, 1) + '</div></div>' +
      '<div class="m-int-strip">' + Array.from({ length: n }, (_, i) => '<button type="button" class="m-int-sthumb' + (i ? '' : ' is-active') + '" data-int-page="' + (i + 1) + '" aria-label="Slide ' + (i + 1) + '">' + slideHtml(m, i + 1) + '</button>').join('') + '</div></div>';
  }
  function xlsTabela(P, aba) {
    const rows = aba === 0 ? [P.colunas].concat(P.linhas) : ((P.extras && P.extras[aba - 1]) || [['Sem conteúdo nesta pré-visualização']]);
    const L = 'ABCDEFGH', ncol = Math.max.apply(null, rows.map((r) => r.length)) + 1, total = Math.max(rows.length + 4, 14);
    let h = '<table><thead><tr><th></th>' + Array.from({ length: ncol }, (_, i) => '<th>' + L[i] + '</th>').join('') + '</tr></thead><tbody>';
    for (let r = 0; r < total; r++) {
      const row = rows[r] || [];
      h += '<tr><th>' + (r + 1) + '</th>';
      for (let c = 0; c < ncol; c++) {
        const cell = row[c];
        let txt = '', fx = '', cls = '';
        if (cell != null && typeof cell === 'object') { txt = cell.f === 'moeda' ? fmt.moeda(cell.v) : cell.f === 'pct' ? fmt.pct(cell.v) : fmt.num(cell.v); fx = cell.formula || String(cell.v); cls = 'is-num'; }
        else if (cell != null) { txt = String(cell); fx = txt; }
        if (r === 0 && txt) cls += ' is-head';
        if (r > 0 && txt === 'Sim') cls += ' is-yes'; else if (r > 0 && txt === 'Não') cls += ' is-no'; else if (r > 0 && txt === 'Avaliar') cls += ' is-maybe';
        h += '<td' + (cls.trim() ? ' class="' + cls.trim() + '"' : '') + ' data-ref="' + L[c] + (r + 1) + '" data-fx="' + esc(fx) + '">' + esc(txt) + '</td>';
      }
      h += '</tr>';
    }
    return h + '</tbody></table>';
  }
  function xlsViewer(m) {
    const P = DI.planilhas[m.planilha] || DI.planilhas.honorarios;
    return '<div class="m-int-viewer m-int-xls" data-int-xls><div class="m-int-viewer__bar">' + I('spreadsheet') + '<span class="lt-strong lt-truncate">' + esc(m.arquivo ? m.arquivo.nome : m.titulo) + '</span><span class="lt-push"></span><span class="lt-hint m-int-hide-sm">Pré-visualização somente leitura · clique numa célula para ver a fórmula</span></div>' +
      '<div class="m-int-xls__fx"><span class="m-int-xls__ref" data-int-ref>A1</span><span class="m-int-xls__fxl">fx</span><span class="lt-truncate" data-int-fx>' + esc(P.colunas[0]) + '</span></div>' +
      '<div class="m-int-xls__wrap" data-int-xlsbody>' + xlsTabela(P, 0) + '</div>' +
      '<div class="m-int-xls__tabs" role="tablist">' + P.abas.map((a, i) => '<button type="button" role="tab" class="' + (i ? '' : 'is-active') + '" data-int-aba="' + i + '">' + esc(a) + '</button>').join('') + '</div></div>';
  }
  function organograma() {
    const by = (area) => D.equipe.filter((p) => p.area === area);
    const box = (p, lead) => '<div class="m-int-org__p' + (lead ? ' is-lead' : '') + '">' + ui.avatar(p, 'xs') + '<span><b>' + esc(p.nome) + '</b><small>' + esc(p.cargo) + '</small></span></div>';
    const areas = [['Comercial', 2], ['Jurídico', 6], ['Cálculo', 8], ['Financeiro', 10], ['Administrativo', 11]];
    return '<div class="m-int-cal__head"><b>Organograma 2026</b><span>Atlas Corporate · atualizado em 03/11/2026</span></div>' +
      '<div class="m-int-org__top">' + [db.pessoa(1), db.pessoa(2)].filter(Boolean).map((p) => box(p, true)).join('') + '</div><div class="m-int-org__areas">' +
      areas.map((a) => '<div class="m-int-org__area"><div class="m-int-org__name">' + esc(a[0]) + '</div>' + by(a[0]).map((p) => box(p, p.id === a[1] && a[0] !== 'Comercial')).join('') + '</div>').join('') + '</div>';
  }
  function calendarioImg() {
    const tone = { nacional: 'gold', estadual: 'blue', municipal: 'violet', forense: 'slate' };
    /* calendário do escritório (Campinas + Justiça Federal): o do TJSP tem escopo próprio e fica em Configurações → Calendário */
    const meses = util.agrupar((D.feriados || []).filter((f) => f.escopo !== 'tjsp'), (f) => +f.data.slice(5, 7) - 1);
    return '<div class="m-int-cal__head"><b>Calendário 2026</b><span>Feriados e recesso · Atlas Corporate · Campinas/SP</span></div><div class="m-int-cal__grid">' +
      util.MESES.map((nm, i) => '<div class="m-int-cal__m"><div class="m-int-cal__mn">' + esc(nm) + '</div>' + ((meses[i] || []).map((f) => '<div class="m-int-cal__d" data-mtone="' + tone[f.tipo] + '"><b class="lt-num">' + f.data.slice(8) + '</b><span>' + esc(f.nome) + '</span></div>').join('') || '<div class="m-int-cal__none">Sem feriados</div>') + '</div>').join('') +
      '</div><div class="m-int-cal__foot">' + Object.keys(tone).map((k) => ui.chip(k.charAt(0).toUpperCase() + k.slice(1), tone[k], { dot: true })).join('') + '<span>Recesso da Justiça Federal: 20/12/2026 a 06/01/2027</span></div>';
  }
  function assinatura() {
    const p = me();
    return '<div class="m-int-sig"><div class="m-int-sig__line"><span class="lt-muted">Para:</span> contato@empresa.exemplo</div><div class="m-int-sig__line"><span class="lt-muted">Assunto:</span> Documentos para o levantamento</div><div class="m-int-sig__body">' + linhas(4, 2) + '</div>' +
      '<div class="m-int-sig__card"><div class="m-int-sig__logo"><img class="lt-logo lt-logo--for-light" src="assets/img/logo-atlas-fundo-claro.webp" alt="Atlas Corporate" width="139" height="34"><img class="lt-logo lt-logo--for-dark" src="assets/img/logo-atlas.webp" alt="Atlas Corporate" width="139" height="34"></div>' +
      '<div class="m-int-sig__txt"><b>' + esc(p.nome) + '</b><span>' + esc(p.cargo || '') + '</span><span>' + esc(p.telefone || '') + ' · ' + esc(p.email || '') + '</span><span>Campinas/SP · atlas.exemplo</span></div></div>' +
      '<div class="m-int-sig__legal">Esta mensagem pode conter informação confidencial. Se você a recebeu por engano, avise o remetente e apague-a. Tratamos dados pessoais conforme a nossa Política de Privacidade.</div></div>';
  }
  function imgViewer(m) {
    const conteudo = m.imagem === 'organograma' ? organograma() : m.imagem === 'calendario' ? calendarioImg() : assinatura();
    return '<div class="m-int-viewer" data-int-img><div class="m-int-viewer__bar">' + I('image') + '<span class="lt-strong lt-truncate">' + esc(m.arquivo ? m.arquivo.nome : m.titulo) + '</span><span class="lt-push"></span>' +
      ui.btn({ icon: 'minus', variant: 'ghost', size: 'sm', tip: 'Diminuir zoom', attrs: { 'data-int-zoom': '-1' } }) + '<span class="lt-num" data-int-zoomlabel style="min-width:40px;text-align:center">100%</span>' + ui.btn({ icon: 'plus', variant: 'ghost', size: 'sm', tip: 'Aumentar zoom', attrs: { 'data-int-zoom': '1' } }) +
      ui.btn({ label: 'Ajustar', variant: 'ghost', size: 'sm', attrs: { 'data-int-zoom': '0' } }) + '</div>' +
      '<div class="m-int-viewer__body is-nothumbs"><div class="m-int-viewer__canvas" data-int-canvas style="--z:1"><div class="m-int-imgframe">' + conteudo + '</div></div></div></div>';
  }
  function linkViewer(m) {
    const L = m.link || { url: '', dominio: '', resumo: '' };
    return '<div class="m-int-link" data-mtone="' + (cat(m.categoriaId) || {}).cor + '"><div class="m-int-link__preview">' + cover(m, { bare: true }) + '</div><div class="m-int-link__body"><span class="lt-eyebrow">Link externo</span><div class="m-int-link__title">' + esc(m.titulo) + '</div><div class="lt-small lt-text-2">' + esc(L.resumo) + '</div>' +
      '<div class="m-int-link__url">' + I('globe') + '<span class="lt-mono lt-truncate">' + esc(L.url) + '</span></div><div class="lt-row">' +
      ui.btn({ label: 'Abrir link', variant: 'primary', icon: 'external', acao: 'abrir', loading: 'Abrindo…', toast: 'Link aberto em nova aba', toastText: esc(L.dominio) + ' · simulado no protótipo' }) +
      ui.btn({ label: 'Copiar endereço', icon: 'copy', attrs: { 'data-copy': L.url, 'data-copy-label': 'Endereço copiado' } }) + '</div>' +
      '<div class="lt-hint lt-row lt-row--nowrap lt-row--top" style="gap:6px">' + I('info') + '<span>O conteúdo fica fora do Atlas · Gestão; o sistema registra quem abriu o link.</span></div></div></div>';
  }
  function playerHtml(m) {
    const mv = meuVisto(m), ini = mv && mv.progresso < 100 ? Math.round(m.duracao * mv.progresso / 100) : 0, c = cat(m.categoriaId) || {};
    const caps = m.capitulos || [];
    const pb = (icon, label, attr, cls) => '<button type="button" class="lt-player__btn' + (cls ? ' ' + cls : '') + '" ' + attr + ' aria-label="' + esc(label) + '" title="' + esc(label) + '">' + I(icon) + '</button>';
    return '<div class="lt-player" data-int-player data-pos="' + ini + '">' +
      '<div class="lt-player__screen" data-int-toggle>' + cover(m, { bare: true, noPlay: true }) +
      '<div class="lt-player__title"><span>Atlas · ' + esc(c.nome) + '</span><b>' + esc(m.titulo) + '</b></div>' +
      '<button type="button" class="lt-player__big" aria-label="Reproduzir vídeo">' + I('play') + '</button><div class="lt-player__sub" data-int-sub hidden></div></div>' +
      '<div class="lt-player__bar">' + pb('play', 'Reproduzir', 'data-int-pp') + pb('history', 'Voltar 10 segundos', 'data-int-back', 'm-int-hide-sm') +
      '<span class="lt-player__time" data-int-time>' + durFmt(ini) + ' / ' + durFmt(m.duracao) + '</span>' +
      '<div class="lt-player__track" data-int-track role="slider" aria-label="Posição do vídeo" aria-valuemin="0" aria-valuemax="' + m.duracao + '" aria-valuenow="' + ini + '"><span data-int-fill style="width:' + (100 * ini / m.duracao).toFixed(1) + '%"></span>' + caps.slice(1).map((x) => '<i style="left:' + (100 * x[0] / m.duracao).toFixed(1) + '%" title="' + esc(x[1]) + '"></i>').join('') + '</div>' +
      '<button type="button" class="lt-player__btn lt-player__speed" data-int-speed aria-label="Velocidade" title="Velocidade">1x</button>' + pb('message', 'Legendas', 'data-int-cc') + pb('monitor', 'Tela cheia', 'data-int-full', 'm-int-hide-sm') + '</div></div>' +
      (caps.length ? ui.card({ title: 'Capítulos', icon: 'list', sub: fmt.plural(caps.length, 'capítulo') + ' · clique para pular', flush: true, body: '<div class="m-int-chapters">' + caps.map((x) => '<button type="button" data-int-seek="' + x[0] + '"><span class="lt-num">' + durFmt(x[0]) + '</span><span class="lt-truncate">' + esc(x[1]) + '</span>' + I('play-circle') + '</button>').join('') + '</div>' }) : '');
  }
  function viewer(m) {
    if (m.status === 'processando') return '<div class="lt-player"><div class="lt-player__screen">' + cover(m, { bare: true, noPlay: true }) + '<div class="lt-player__proc"><span class="lt-spinner lt-spinner--lg" aria-hidden="true"></span><span>Convertendo o vídeo · ' + m.processamento + '%</span></div></div></div>';
    switch (m.tipo) {
      case 'video': return playerHtml(m);
      case 'apresentacao': return slidesViewer(m);
      case 'planilha': return xlsViewer(m);
      case 'imagem': return imgViewer(m);
      case 'link': return linkViewer(m);
      default: return docViewer(m);
    }
  }
  /* registra a visita do usuário logado (uma vez por sessão) — alimenta "Visto por" */
  function registrarVisita(m) {
    if (m.status === 'processando') return;
    App.state.intVisitas = App.state.intVisitas || {};
    let v = meuVisto(m);
    if (!App.state.intVisitas[m.id]) {
      App.state.intVisitas[m.id] = true; m.visualizacoes = (m.visualizacoes || 0) + 1;
      if (!v) { v = { pessoaId: App.meId, quando: util.isoHora(App.HOJE), progresso: m.tipo === 'video' ? 0 : 100 }; m.vistoPor.unshift(v); }
      else { v.quando = util.isoHora(App.HOJE); m.vistoPor = [v].concat(m.vistoPor.filter((x) => x !== v)); }
      v.agora = true;
    }
  }
  function situacaoVisto(m, v) {
    if (v.aceite) return ui.chip('Leitura confirmada', 'green', { icon: 'check' });
    if (m.tipo === 'video') return v.progresso >= 100 ? ui.chip('Assistiu tudo', 'green') : v.progresso > 0 ? ui.chip('Assistiu ' + v.progresso + '%', 'amber') : ui.chip('Abriu agora', 'gray');
    if (m.tipo === 'link') return ui.chip('Abriu o link', 'gray');
    return ui.chip('Abriu', 'gray');
  }
  function vistoCard(m) {
    if (m.status === 'processando') return ui.card({ title: 'Visto por', icon: 'eye', body: ui.empty({ small: true, icon: 'hourglass', title: 'Ainda não publicado', text: 'O registro começa quando o vídeo terminar de processar.' }) });
    const el = comAcesso(m), ids = el.map((p) => p.id), viram = m.vistoPor.filter((v) => ids.indexOf(v.pessoaId) >= 0 || v.pessoaId === App.meId);
    const nViram = Math.min(el.length, viram.filter((v) => ids.indexOf(v.pessoaId) >= 0).length), faltam = el.length - nViram;
    const stack = '<span class="lt-avatar-stack">' + viram.slice(0, 7).map((v) => ui.avatar(v.pessoaId, 'sm')).join('') + '</span>' + (viram.length > 7 ? '<span class="lt-hint">+' + (viram.length - 7) + '</span>' : '');
    const lista = ui.list(viram.slice(0, 5).map((v) => {
      const p = db.pessoa(v.pessoaId) || { nome: '—' };
      return { lead: ui.avatar(p, 'sm'), title: esc(v.pessoaId === App.meId ? 'Você' : p.nome), meta: '<span>' + (v.agora ? 'agora' : esc(fmt.quando(v.quando))) + '</span>', aside: situacaoVisto(m, v) };
    }), { empty: { title: 'Ninguém viu ainda', text: 'Avise a equipe quando publicar.' } });
    return ui.card({
      title: 'Visto por', icon: 'eye', sub: '<span class="lt-num">' + nViram + '</span> de <span class="lt-num">' + el.length + '</span> pessoas com acesso · ' + fmt.plural(m.visualizacoes || 0, 'visualização', 'visualizações'), flush: true,
      body: '<div style="padding:12px 18px 10px" class="lt-stack lt-stack--sm">' + ui.progress(nViram, el.length || 1, faltam ? '' : 'green') + '<div class="lt-row" style="gap:8px">' + stack + '</div></div>' + lista,
      foot: ui.btn({ label: 'Ver todos', variant: 'ghost', size: 'sm', sheet: 'int-vistos', attrs: { 'data-id': m.id } }) + (faltam ? ui.btn({ label: 'Lembrar quem não viu', size: 'sm', icon: 'bell', acao: 'enviar', loading: 'Enviando…', toast: 'Lembrete enviado', toastText: fmt.plural(faltam, 'pessoa recebeu', 'pessoas receberam') + ' notificação e e-mail.' }) : '')
    });
  }
  function detalhesCard(m) {
    const c = cat(m.categoriaId), a = db.pessoa(m.autorId), t = tipo(m.tipo);
    const pares = [['Tipo', tipoTag(m)], ['Categoria', '<a href="#int-categoria-' + c.id + '">' + catChip(c) + '</a>']];
    if (m.tipo === 'link') pares.push(['Endereço', '<span class="lt-mono" style="font-size:11.5px">' + esc(m.link ? m.link.dominio : '') + '</span>']);
    else if (m.arquivo) pares.push(['Arquivo', '<span class="lt-truncate" style="display:block;font-size:12.5px" title="' + esc(m.arquivo.nome) + '">' + esc(m.arquivo.nome) + '</span><span class="lt-hint" style="display:block">' + esc(t.ext) + ' · ' + esc(m.arquivo.tamanho) + '</span>']);
    const md = medidaLonga(m).split(' · ')[0];
    if (m.tipo !== 'imagem' && m.tipo !== 'link') pares.push([m.tipo === 'video' ? 'Duração' : 'Tamanho', '<span class="lt-num">' + esc(md) + '</span>']);
    pares.push(['Versão', 'v' + m.versao + ' · ' + fmt.data(m.atualizadoEm)]);
    pares.push(['Publicado', fmt.data(m.publicadoEm) + ' por ' + esc(a ? a.nome : '—')]);
    pares.push(['Quem pode ver', !m.papeis ? 'Toda a equipe' : '<span class="lt-chips">' + m.papeis.map((k) => { const p = (D.papeis || []).find((x) => x.key === k); return ui.chip(p ? p.nome : k, p ? p.tone : 'gray'); }).join('') + '</span>']);
    if (m.downloads) pares.push(['Downloads', '<span class="lt-num">' + m.downloads + '</span>']);
    return ui.card({ title: 'Detalhes', icon: 'file-text', body: ui.dl(pares) });
  }
  function trilhasCard(m) {
    const ts = trilhasDo(m); if (!ts.length) return '';
    return ui.card({ title: 'Nas trilhas de onboarding', icon: 'list-checks', flush: true, body: ui.list(ts.map((x) => ({ icon: 'flag', tone: x.t.cor === 'slate' ? null : x.t.cor, title: esc(x.t.nome), meta: '<span>Etapa ' + x.pos + ' de ' + x.t.etapas.length + '</span><span>até D+' + x.e.prazoDias + (x.e.prazoDias === 1 ? ' útil' : ' úteis') + '</span>' + (x.e.obrigatorio ? '' : '<span>opcional</span>'), href: '#int-onboarding' }))) });
  }
  function relacionados(m) {
    const rel = visiveis().filter((x) => x.id !== m.id).map((x) => ({ x: x, s: x.tags.filter((t) => m.tags.indexOf(t) >= 0).length * 2 + (x.categoriaId === m.categoriaId ? 1 : 0) })).filter((o) => o.s > 0).sort((a, b) => b.s - a.s || b.x.vistoPor.length - a.x.vistoPor.length).slice(0, 3).map((o) => o.x);
    if (!rel.length) return '';
    return ui.card({ title: 'Materiais relacionados', icon: 'layers', sub: 'Mesma categoria ou mesmas tags', actions: '<a class="m-int-more" href="#int-categoria-' + m.categoriaId + '">Ver a categoria' + I('chevron-right') + '</a>', body: '<div class="lt-media-grid lt-media-grid--sm">' + rel.map((x) => card(x)).join('') + '</div>' });
  }
  function sobreCard(m) {
    const toc = m.secoes && (m.tipo === 'pdf' || m.tipo === 'documento') ? '<div class="lt-label-caps lt-mt-4">Conteúdo</div><ol class="m-int-toc">' + m.secoes.map((s, i) => '<li><button type="button" data-int-goto="' + Math.min((m.paginas || 1), i + 2) + '"><span>' + (i + 1) + '.</span>' + esc(s) + '</button></li>').join('') + '</ol>' : '';
    return ui.card({ title: 'Sobre este material', icon: 'info', body: '<p class="lt-text-2" style="font-size:14px;line-height:1.6;max-width:760px">' + esc(m.descricao) + '</p>' + toc +
      '<div class="lt-label-caps lt-mt-4">Tags</div><div class="lt-chips lt-mt-2">' + m.tags.map((t) => '<a class="lt-chip" data-tone="gray" href="#int-biblioteca" data-int-tag="' + esc(t) + '" title="Buscar materiais com esta tag">' + I('tag') + esc(t) + '</a>').join('') + '</div>' });
  }
  function aceiteBox(m) {
    if (!m.aceite || m.status === 'processando') return '';
    if (m.autorId === App.meId) return ui.callout({ tone: 'gold', icon: 'shield-check', title: 'Leitura obrigatória · você é a responsável', text: 'Cada pessoa precisa clicar em "Confirmo que li". Acompanhe quem falta em "Visto por".' });
    const v = meuVisto(m);
    if (v && v.aceite) return ui.callout({ tone: 'success', title: 'Leitura confirmada', text: 'Você confirmou a leitura em ' + fmt.dataHora(v.quandoAceite || v.quando) + '.' });
    return ui.callout({ tone: 'warning', icon: 'shield-check', title: 'Este material exige confirmação de leitura', text: 'Leia até o fim e confirme. A confirmação fica registrada com data e hora.', actions: ui.btn({ label: 'Confirmo que li', variant: 'primary', size: 'sm', icon: 'check', acao: 'concluir', loading: 'Registrando…', toast: 'Leitura confirmada', toastText: esc(m.titulo), attrs: { 'data-int-aceite': m.id } }) });
  }

  App.screen({
    id: 'int.item.detail', hash: 'int-material', module: 'intranet', title: 'Visualizar material', navGroup: 'intranet', navParent: 'int-biblioteca', exemplo: 4117,
    render: (p) => {
      const m = mat(p.id);
      if (!m) return naoEncontrado();
      if (!podeVer(m, me())) return naoEncontrado('Sem acesso a este material', 'Ele está disponível só para alguns papéis. Peça acesso a quem publicou.');
      registrarVisita(m);
      const c = cat(m.categoriaId), t = tipo(m.tipo), resp = m.novaVersao ? db.pessoa(m.novaVersao.responsavelId) : null;
      const meta = catChip(c) + ui.chip('v' + m.versao, 'gray') + (m.destaque ? ui.chip('Destaque', 'gold', { icon: 'star' }) : '') + (ehNovo(m) ? ui.chip('Novo', 'gold', { solid: true }) : '') + (m.aceite ? ui.chip('Leitura obrigatória', 'red', { icon: 'shield-check' }) : '') +
        (!m.ativo ? ui.status('inativo') : '') + (m.status === 'processando' ? ui.status('int_processando') : '') + trilhasDo(m).map((x) => ui.chip(x.t.nome, x.t.cor, { icon: 'flag' })).join('');
      const principal = m.tipo === 'link' ? ui.btn({ label: 'Abrir link', variant: 'primary', icon: 'external', acao: 'abrir', loading: 'Abrindo…', toast: 'Link aberto em nova aba', toastText: esc(m.link ? m.link.dominio : '') + ' · simulado no protótipo' })
        : m.status === 'processando' ? ui.btn({ label: 'Baixar', variant: 'primary', icon: 'download', disabled: true, title: 'Disponível depois do processamento' })
        : m.download === false ? '' : ui.btn({ label: 'Baixar', variant: 'primary', icon: 'download', acao: 'baixar', loading: 'Preparando…', toast: 'Download iniciado', toastText: esc((m.arquivo ? m.arquivo.nome + ' · ' + m.arquivo.tamanho : m.titulo)) });
      const head = ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Biblioteca', hash: 'int-biblioteca' }, { label: c.nome, hash: 'int-categoria-' + c.id }, { label: m.titulo }]),
        eyebrow: t.nome + ' · ' + medidaLonga(m), title: m.titulo, meta: meta,
        actions: ui.btn({ label: 'Copiar link', icon: 'link', attrs: { 'data-copy': linkAbs('int-material-' + m.id), 'data-copy-label': 'Link do material copiado' } }) + (podeGerenciar() ? ui.btn({ label: 'Editar', icon: 'edit', href: '#int-editar-' + m.id }) : '') + principal
      });
      const avisos = (m.status === 'processando' ? ui.callout({ tone: 'warning', icon: 'hourglass', title: 'Vídeo em processamento · ' + m.processamento + '%', text: 'Enviado em ' + fmt.data(m.publicadoEm) + ' por ' + esc((db.pessoa(m.autorId) || {}).nome) + '. Ele aparece para a equipe quando a conversão terminar; você recebe uma notificação.' + '<div class="lt-mt-2" style="max-width:360px">' + ui.progress(m.processamento, 100, 'amber') + '</div>' }) : '') +
        (m.novaVersao ? ui.callout({ tone: 'info', icon: 'refresh', title: 'Nova versão em produção', text: esc(resp ? resp.nome : '') + ' atualiza este vídeo até ' + fmt.data(m.novaVersao.ate) + '. Quem já assistiu não precisa ver de novo.' }) : '');
      const esquerda = avisos + aceiteBox(m) + viewer(m) + sobreCard(m) + relacionados(m);
      const direita = detalhesCard(m) + vistoCard(m) + trilhasCard(m);
      return head + '<div class="lt-split"><div class="lt-stack" style="min-width:0">' + esquerda + '</div><div class="lt-stack">' + direita + '</div></div>';
    },
    mount: (root, p) => {
      const m = mat(p.id); if (!m) return;
      root.addEventListener('click', (e) => {
        const tg = e.target.closest('[data-int-tag]'); if (tg) { App.state.intBuscaTag = tg.getAttribute('data-int-tag'); return; }
        const go = e.target.closest('[data-int-goto]'); if (go) { const v = root.querySelector('[data-int-doc]'); if (v && v._ir) { v._ir(+go.getAttribute('data-int-goto')); v.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
      });
      root.addEventListener('lt:acao', (e) => {
        const b = e.target.closest('[data-int-aceite]'); if (!b) return;
        let v = meuVisto(m); if (!v) { v = { pessoaId: App.meId, quando: util.isoHora(App.HOJE), progresso: 100 }; m.vistoPor.unshift(v); }
        v.aceite = true; v.quandoAceite = util.isoHora(App.HOJE); setTimeout(App.refresh, 300);
      });
      montarPlayer(root, m); montarDoc(root, m); montarSlides(root, m); montarXls(root, m); montarImg(root);
    }
  });

  function montarPlayer(root, m) {
    const pl = root.querySelector('[data-int-player][data-pos]'); if (!pl) return;
    const dur = m.duracao, caps = m.capitulos || [], fill = pl.querySelector('[data-int-fill]'), time = pl.querySelector('[data-int-time]'), pp = pl.querySelector('[data-int-pp]'), sub = pl.querySelector('[data-int-sub]'), track = pl.querySelector('[data-int-track]');
    let pos = +pl.getAttribute('data-pos') || 0, timer = null, speed = 1, cc = false, avisou = false;
    const capAt = (s) => { let c = caps[0] || null; caps.forEach((x) => { if (s >= x[0]) c = x; }); return c; };
    const draw = () => {
      fill.style.width = (100 * pos / dur).toFixed(2) + '%'; time.textContent = durFmt(pos) + ' / ' + durFmt(dur); track.setAttribute('aria-valuenow', Math.round(pos));
      const c = capAt(pos);
      root.querySelectorAll('[data-int-seek]').forEach((b) => b.classList.toggle('is-active', !!c && +b.getAttribute('data-int-seek') === c[0]));
      if (cc && c && pl.classList.contains('is-playing')) { sub.hidden = false; sub.textContent = 'Legenda · ' + c[1]; } else sub.hidden = true;
    };
    const parar = () => { clearInterval(timer); timer = null; pl.classList.remove('is-playing'); pp.innerHTML = I('play'); pp.setAttribute('aria-label', 'Reproduzir'); draw(); };
    const tick = () => {
      if (!document.body.contains(pl)) { clearInterval(timer); return; }
      pos = Math.min(dur, pos + 5 * speed); draw();
      const v = meuVisto(m); if (v) v.progresso = Math.max(v.progresso || 0, Math.round(100 * pos / dur));
      if (!avisou && pos / dur >= 0.9) { avisou = true; if (v) v.progresso = 100; ui.toast('Vídeo concluído', 'success', 'Registrado em "Visto por"' + (trilhasDo(m).length ? ' e na trilha de onboarding.' : '.')); }
      if (pos >= dur) parar();
    };
    const tocar = () => { if (pos >= dur) pos = 0; pl.classList.add('is-playing'); pp.innerHTML = I('pause'); pp.setAttribute('aria-label', 'Pausar'); clearInterval(timer); timer = setInterval(tick, 250); draw(); };
    pl.addEventListener('click', (e) => {
      if (e.target.closest('[data-int-pp]') || e.target.closest('[data-int-toggle]')) { timer ? parar() : tocar(); return; }
      if (e.target.closest('[data-int-back]')) { pos = Math.max(0, pos - 10); draw(); return; }
      const sp = e.target.closest('[data-int-speed]');
      if (sp) { const s = [1, 1.25, 1.5, 2]; speed = s[(s.indexOf(speed) + 1) % s.length]; sp.textContent = String(speed).replace('.', ',') + 'x'; return; }
      const ccb = e.target.closest('[data-int-cc]'); if (ccb) { cc = !cc; ccb.classList.toggle('is-on', cc); draw(); ui.toast(cc ? 'Legendas ligadas' : 'Legendas desligadas', 'info'); return; }
      if (e.target.closest('[data-int-full]')) { ui.toast('Tela cheia', 'info', 'No protótipo o vídeo é simulado; no sistema abre em tela cheia.'); return; }
      if (e.target.closest('[data-int-track]')) { const r = track.getBoundingClientRect(); pos = dur * util.clamp((e.clientX - r.left) / r.width, 0, 1); draw(); }
    });
    root.addEventListener('click', (e) => { const s = e.target.closest('[data-int-seek]'); if (s) { pos = +s.getAttribute('data-int-seek'); if (!timer) tocar(); else draw(); } });
    draw();
  }
  function montarZoom(root, v, min, max) {
    const canvas = v.querySelector('[data-int-canvas]'), lab = v.querySelector('[data-int-zoomlabel]'); let z = 1;
    v.addEventListener('click', (e) => {
      const b = e.target.closest('[data-int-zoom]'); if (!b) return;
      const d = +b.getAttribute('data-int-zoom'); z = d === 0 ? 1 : util.clamp(Math.round((z + d * 0.2) * 10) / 10, min, max);
      canvas.style.setProperty('--z', z); if (lab) lab.textContent = Math.round(z * 100) + '%';
    });
  }
  function montarDoc(root, m) {
    const v = root.querySelector('[data-int-doc]'); if (!v) return;
    const n = +v.getAttribute('data-pages'), canvas = v.querySelector('[data-int-canvas]'), input = v.querySelector('[data-int-pageinput]'); let pg = 1;
    const ir = (p) => {
      pg = util.clamp(p || 1, 1, n); canvas.innerHTML = paginaHtml(m, pg); input.value = pg; canvas.scrollTop = 0;
      v.querySelectorAll('[data-int-page]').forEach((t) => { const on = +t.getAttribute('data-int-page') === pg; t.classList.toggle('is-active', on); if (on) t.scrollIntoView({ block: 'nearest' }); });
    };
    v._ir = ir;
    v.addEventListener('click', (e) => {
      const t = e.target.closest('[data-int-page]'); if (t) { ir(+t.getAttribute('data-int-page')); return; }
      if (e.target.closest('[data-int-prev]')) ir(pg - 1);
      else if (e.target.closest('[data-int-next]')) ir(pg + 1);
      else if (e.target.closest('[data-int-thumbs]')) v.querySelector('.m-int-viewer__body').classList.toggle('is-nothumbs');
    });
    input.addEventListener('change', () => ir(parseInt(input.value, 10)));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ir(parseInt(input.value, 10)); });
    montarZoom(root, v, 0.6, 1.6);
  }
  function montarSlides(root, m) {
    const v = root.querySelector('[data-int-slides]'); if (!v) return;
    const n = +v.getAttribute('data-pages'), canvas = v.querySelector('[data-int-canvas]'), cur = v.querySelector('[data-int-cur]'); let s = 1;
    const ir = (x) => {
      s = util.clamp(x, 1, n); canvas.innerHTML = slideHtml(m, s); cur.textContent = s;
      v.querySelectorAll('[data-int-page]').forEach((t) => { const on = +t.getAttribute('data-int-page') === s; t.classList.toggle('is-active', on); if (on) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
    };
    v.addEventListener('click', (e) => {
      const t = e.target.closest('[data-int-page]'); if (t) { ir(+t.getAttribute('data-int-page')); return; }
      if (e.target.closest('[data-int-prev]')) ir(s - 1);
      else if (e.target.closest('[data-int-next]') || e.target.closest('[data-int-canvas]')) ir(s + 1);
      else if (e.target.closest('[data-int-apresentar]')) ui.toast('Modo apresentação', 'info', 'No sistema abre em tela cheia e avança com as setas do teclado.');
    });
  }
  function montarXls(root, m) {
    const v = root.querySelector('[data-int-xls]'); if (!v) return;
    const P = DI.planilhas[m.planilha] || DI.planilhas.honorarios, body = v.querySelector('[data-int-xlsbody]'), ref = v.querySelector('[data-int-ref]'), fx = v.querySelector('[data-int-fx]');
    v.addEventListener('click', (e) => {
      const td = e.target.closest('td[data-ref]');
      if (td) { v.querySelectorAll('td.is-sel').forEach((x) => x.classList.remove('is-sel')); td.classList.add('is-sel'); ref.textContent = td.getAttribute('data-ref'); fx.textContent = td.getAttribute('data-fx') || ''; return; }
      const ab = e.target.closest('[data-int-aba]');
      if (ab) { v.querySelectorAll('[data-int-aba]').forEach((x) => x.classList.toggle('is-active', x === ab)); body.innerHTML = xlsTabela(P, +ab.getAttribute('data-int-aba')); ref.textContent = 'A1'; fx.textContent = ''; }
    });
  }
  function montarImg(root) { const v = root.querySelector('[data-int-img]'); if (v) montarZoom(root, v, 0.6, 1.8); }

  /* ================================================================== */
  /* GERENCIAR MATERIAIS                                                  */
  /* ================================================================== */
  const ADM = () => (App.state.intAdm = App.state.intAdm || { busca: '', cat: '', tipo: '', situ: 'todos' });
  function admTabela(st) {
    let r = DI.materiais.slice().sort(porCuradoria);
    if (st.cat) r = r.filter((m) => String(m.categoriaId) === String(st.cat));
    if (st.tipo) r = r.filter((m) => m.tipo === st.tipo);
    if (st.situ === 'ativos') r = r.filter((m) => m.ativo); else if (st.situ === 'inativos') r = r.filter((m) => !m.ativo); else if (st.situ === 'destaque') r = r.filter((m) => m.destaque); else if (st.situ === 'aceite') r = r.filter((m) => m.aceite);
    if (st.busca) { const q = norm(st.busca); r = r.filter((m) => norm(m.titulo + ' ' + m.tags.join(' ')).indexOf(q) >= 0); }
    return ui.table({
      id: 'int-adm-tabela', rows: r, selectable: true, rowHref: (m) => '#int-editar-' + m.id, rowClass: (m) => (m.ativo ? '' : 'is-muted'),
      bulk: ui.btn({ label: 'Ativar', size: 'xs', icon: 'eye', acao: 'salvar', toast: 'Materiais ativados', toastText: 'Voltam a aparecer na biblioteca.' }) + ui.btn({ label: 'Desativar', size: 'xs', icon: 'eye-off', acao: 'salvar', toast: 'Materiais desativados', toastText: 'Saem da biblioteca e continuam no histórico.' }) +
        ui.btn({ label: 'Mover de categoria', size: 'xs', icon: 'folder', dialog: 'int-mover-categoria' }) + ui.btn({ label: 'Excluir', size: 'xs', variant: 'danger-outline', icon: 'trash', acao: 'excluir', confirm: 'Excluir os materiais selecionados?', confirmText: 'O arquivo e o registro de "visto por" são apagados. Se a ideia é só tirar da biblioteca, prefira desativar.', confirmLabel: 'Excluir', toast: 'Materiais excluídos' }),
      empty: { icon: 'search', title: 'Nenhum material com esses filtros', text: 'Ajuste a busca ou cadastre um novo material.', action: ui.btn({ label: 'Novo material', variant: 'primary', icon: 'plus', href: '#int-editar' }) },
      columns: [
        { key: 'grip', label: '', width: '30px', render: () => grip() },
        { key: 'ordem', label: 'Ordem', width: '64px', align: 'center', render: (m) => '<span class="lt-num lt-strong" data-int-ordem="' + m.id + '">' + m.ordem + '</span>' },
        { key: 'titulo', label: 'Material', render: (m) => '<div class="lt-row lt-row--nowrap" style="gap:12px">' + thumbMini(m) + '<div style="min-width:0"><span class="lt-table__primary">' + esc(m.titulo) + '</span><span class="lt-table__secondary lt-row lt-row--nowrap m-int-tipo" style="gap:5px">' + I(tipo(m.tipo).icon) + esc(tipo(m.tipo).nome) + ' · ' + esc(medida(m) || '') + ' · ' + fmt.data(m.atualizadoEm) + (m.status === 'processando' ? ' · processando ' + m.processamento + '%' : '') + '</span></div></div>' },
        { key: 'cat', label: 'Categoria', render: (m) => catChip(cat(m.categoriaId)) },
        { key: 'vistos', label: 'Vistos', align: 'right', render: (m) => '<span class="lt-num">' + m.vistoPor.length + '</span><span class="lt-muted lt-num"> / ' + comAcesso(m).length + '</span>' },
        { key: 'ativo', label: 'Ativo', align: 'center', render: (m) => '<label class="lt-toggle lt-toggle--sm"><input type="checkbox" data-int-ativo="' + m.id + '"' + (m.ativo ? ' checked' : '') + ' aria-label="Ativo: ' + esc(m.titulo) + '"><span class="lt-toggle__track"></span></label>' },
        { key: 'dest', label: 'Destaque', align: 'center', render: (m) => '<button type="button" class="m-int-star' + (m.destaque ? ' is-on' : '') + '" data-int-dest="' + m.id + '" aria-pressed="' + m.destaque + '" aria-label="Destaque: ' + esc(m.titulo) + '" title="' + (m.destaque ? 'Em destaque · clique para remover' : 'Marcar como destaque') + '">' + I('star') + '</button>' }
      ],
      rowActions: (m) => ui.btn({ icon: 'eye', variant: 'ghost', size: 'xs', tip: 'Ver na biblioteca', href: '#int-material-' + m.id }) + ui.btn({ icon: 'edit', variant: 'ghost', size: 'xs', tip: 'Editar', href: '#int-editar-' + m.id }) +
        ui.btn({ icon: 'trash', variant: 'ghost', size: 'xs', tip: 'Excluir', acao: 'excluir', confirm: 'Excluir "' + m.titulo + '"?', confirmText: 'O arquivo e o registro de "visto por" são apagados. Prefira desativar se quiser só tirar da biblioteca.', confirmLabel: 'Excluir', toast: 'Material excluído' })
    });
  }
  App.screen({
    id: 'int.admin.list', hash: 'int-gerenciar', module: 'intranet', title: 'Gerenciar materiais', nav: true, navGroup: 'intranet', navLabel: 'Gerenciar materiais', navOrder: 3,
    render: () => {
      if (!podeGerenciar()) return naoEncontrado('Sem permissão', 'Publicar e organizar materiais é dos papéis Sócio, Gestor comercial e Administrativo.');
      const st = ADM(), all = DI.materiais, ativos = all.filter((m) => m.ativo);
      const vistos30 = util.soma(all, (m) => m.vistoPor.filter((v) => util.diasEntre(v.quando, App.HOJE) <= 30).length);
      const parados = ativos.filter((m) => m.status !== 'processando' && !m.vistoPor.some((v) => util.diasEntre(v.quando, App.HOJE) <= 90)).length;
      const pend = util.soma(all.filter((m) => m.aceite && m.ativo), (m) => comAcesso(m).length - m.vistoPor.filter((v) => v.aceite).length);
      return ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Gerenciar materiais' }]), title: 'Gerenciar materiais',
        sub: 'O que aparece na biblioteca, em que ordem e com destaque. Arraste as linhas para mudar a ordem dentro da categoria.',
        actions: ui.btn({ label: 'Categorias', icon: 'layers', href: '#int-categorias' }) + ui.btn({ label: 'Novo material', variant: 'primary', icon: 'plus', href: '#int-editar' })
      }) +
        ui.summary([
          { label: 'Materiais', value: '<span class="lt-num">' + all.length + '</span> <span class="lt-muted" style="font-weight:400;font-size:12px">· ' + fmt.plural(ativos.length, 'ativo') + '</span>' },
          { label: 'Em destaque', value: '<span class="lt-num">' + all.filter((m) => m.ativo && m.destaque).length + '</span> <span class="lt-muted" style="font-weight:400;font-size:12px">de 6 vagas</span>' },
          { label: 'Vistas em 30 dias', value: '<span class="lt-num">' + vistos30 + '</span>' },
          { label: 'Leituras pendentes', value: '<span class="lt-num lt-warning">' + pend + '</span> <span class="lt-muted" style="font-weight:400;font-size:12px">confirmações</span>' },
          { label: 'Parados há 90 dias', value: '<span class="lt-num">' + parados + '</span> <span class="lt-muted" style="font-weight:400;font-size:12px">sem acesso</span>' }
        ]) + '<div class="lt-mt-4"></div>' +
        ui.filters({
          busca: 'Buscar por título ou tag',
          selects: [{ label: 'Categoria', name: 'int-adm-cat', value: st.cat, options: catsOrdenadas().map((c) => ({ value: c.id, label: c.nome })) }, { label: 'Tipo', name: 'int-adm-tipo', value: st.tipo, options: DI.tipos.map((t) => ({ value: t.key, label: t.nome })) }],
          chips: [['todos', 'Todos'], ['ativos', 'Ativos'], ['inativos', 'Inativos'], ['destaque', 'Em destaque'], ['aceite', 'Leitura obrigatória']].map((x) => ({ label: x[1], value: x[0], active: st.situ === x[0] })), chipGroup: 'single'
        }) +
        '<div data-int-ordembar hidden class="lt-mb-4">' + ui.callout({ tone: 'gold', icon: 'grip', title: 'Ordem alterada', text: 'A biblioteca e as páginas de categoria passam a mostrar os materiais nesta ordem depois de salvar.', actions: '<button type="button" class="lt-btn lt-btn--ghost lt-btn--sm" data-int-desfazer>Desfazer</button>' + ui.btn({ label: 'Salvar ordem', variant: 'primary', size: 'sm', icon: 'check', acao: 'salvar', toast: 'Ordem salva', toastText: 'A biblioteca já mostra a nova ordem.', attrs: { 'data-int-salvarordem': true } }) }) + '</div>' +
        '<div data-int-adm>' + admTabela(st) + '</div>';
    },
    mount: (root) => {
      if (!podeGerenciar()) return;
      const st = ADM(), box = root.querySelector('[data-int-adm]'), bar = root.querySelector('[data-int-ordembar]');
      const ligarArrasto = () => arrastavel(box.querySelector('tbody'), 'tr', renumerar);
      const redraw = () => { box.innerHTML = admTabela(st); ui.enhance(box); bar.hidden = true; ligarArrasto(); };
      function renumerar() {
        const cont = {};
        box.querySelectorAll('tbody tr [data-int-ordem]').forEach((s) => { const m = mat(s.getAttribute('data-int-ordem')); cont[m.categoriaId] = (cont[m.categoriaId] || 0) + 1; s.textContent = cont[m.categoriaId]; s.classList.toggle('lt-gold', +s.textContent !== m.ordem); });
        bar.hidden = false;
      }
      ligarArrasto();
      const busca = root.querySelector('[data-filter-search]');
      if (busca) { busca.value = st.busca; let t = null; busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { st.busca = busca.value.trim(); redraw(); }, 160); }); }
      root.addEventListener('change', (e) => {
        if (e.target.name === 'int-adm-cat') { st.cat = e.target.value; redraw(); return; }
        if (e.target.name === 'int-adm-tipo') { st.tipo = e.target.value; redraw(); return; }
        const at = e.target.closest('[data-int-ativo]');
        if (at) { const m = mat(at.getAttribute('data-int-ativo')); m.ativo = at.checked; at.closest('tr').classList.toggle('is-muted', !m.ativo); ui.toast(m.ativo ? 'Material ativado' : 'Material desativado', 'success', esc(m.titulo) + (m.ativo ? ' volta para a biblioteca.' : ' sai da biblioteca e continua no histórico.')); }
      });
      root.addEventListener('lt:filter', (e) => { st.situ = e.detail.active ? e.detail.value : 'todos'; redraw(); });
      root.addEventListener('click', (e) => {
        const s = e.target.closest('[data-int-dest]');
        if (s) {
          const m = mat(s.getAttribute('data-int-dest')), n = DI.materiais.filter((x) => x.ativo && x.destaque).length;
          if (!m.destaque && n >= 6) { ui.toast('Limite de 6 destaques', 'warning', 'Tire um material da faixa de destaques antes de incluir outro.'); return; }
          m.destaque = !m.destaque; s.classList.toggle('is-on', m.destaque); s.setAttribute('aria-pressed', m.destaque);
          ui.toast(m.destaque ? 'Marcado como destaque' : 'Removido dos destaques', 'success', esc(m.titulo)); return;
        }
        if (e.target.closest('[data-int-desfazer]')) { redraw(); ui.toast('Ordem restaurada', 'info'); }
      });
      root.addEventListener('lt:acao', (e) => {
        if (!e.target.closest('[data-int-salvarordem]')) return;
        box.querySelectorAll('tbody tr [data-int-ordem]').forEach((s) => { const m = mat(s.getAttribute('data-int-ordem')); m.ordem = +s.textContent; s.classList.remove('lt-gold'); });
        bar.hidden = true;
      });
    }
  });

  ui.registerDialog('int-mover-categoria', () => ({
    title: 'Mover de categoria', text: 'Os materiais selecionados vão para o fim da categoria escolhida.', icon: 'folder',
    body: '<div class="lt-sections">' + ui.section({ title: 'Destino', tone: 'violet', icon: 'layers', body: ui.field({ label: 'Nova categoria', type: 'select', name: 'destino', required: true, options: catsOrdenadas().map((c) => ({ value: c.id, label: c.nome })), value: 2 }) }) + '</div>',
    foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Mover materiais', variant: 'primary', icon: 'check', acao: 'mover', toast: 'Materiais movidos', fechar: 'dialog' })
  }));

  /* ================================================================== */
  /* CADASTRAR / EDITAR MATERIAL                                          */
  /* ================================================================== */
  const medidaCampo = (t, m) => {
    m = m || {};
    if (t === 'video') return ui.field({ label: 'Duração', name: 'duracao', value: m.duracao ? durFmt(m.duracao) : '', placeholder: '12:30', hint: 'Lida do arquivo; ajuste se precisar.' });
    if (t === 'pdf' || t === 'documento') return ui.field({ label: 'Páginas', name: 'paginas', type: 'number', value: m.paginas || '' });
    if (t === 'apresentacao') return ui.field({ label: 'Slides', name: 'slides', type: 'number', value: m.slides || '' });
    if (t === 'planilha') return ui.field({ label: 'Abas', name: 'abas', type: 'number', value: m.abas || '' });
    return '';
  };
  function arquivoCampos(t, m) {
    const tp = tipo(t);
    if (t === 'link') return '<div class="lt-stack">' + ui.field({ label: 'Endereço (URL)', name: 'url', type: 'url', required: true, value: m && m.link ? m.link.url : '', placeholder: 'https://', hint: 'O link abre em nova aba. O sistema registra quem abriu.' }) + ui.field({ label: 'Duração (se for vídeo ou webinar)', name: 'duracao', value: m && m.duracao ? minutos(m.duracao) : '', placeholder: '58 min' }) + '</div>';
    const atual = m && m.arquivo && m.tipo === t ? '<div class="lt-upload__file">' + I(tp.icon) + '<span class="lt-truncate" style="flex:1">' + esc(m.arquivo.nome) + '</span><span class="lt-hint">' + esc(m.arquivo.tamanho) + '</span>' + ui.chip('Atual', 'green', { dot: true }) + '</div>' : '';
    return '<div class="lt-stack">' + ui.field({ label: m && m.arquivo && m.tipo === t ? 'Trocar arquivo' : 'Arquivo', type: 'upload', accept: tp.aceita, required: !m }) + atual +
      (medidaCampo(t, m) ? '<div class="lt-grid lt-grid--2">' + medidaCampo(t, m) + '</div>' : '') + ui.field({ type: 'toggle', label: 'Permitir download', name: 'download', checked: !m || m.download !== false, hint: 'Desligado, a pessoa só visualiza no sistema.' }) + '</div>';
  }
  function tiposPicker(sel, name) {
    return '<div class="m-int-types" role="radiogroup" aria-label="Tipo do material">' + DI.tipos.map((t) => '<label class="lt-choice-card"><span class="lt-radio"><input type="radio" name="' + (name || 'tipo') + '" value="' + t.key + '"' + (t.key === sel ? ' checked' : '') + '></span>' + I(t.icon) + '<span>' + esc(t.nome) + '</span></label>').join('') + '</div>';
  }
  const tagChip = (t) => '<span class="lt-chip" data-tone="violet" data-int-tagval="' + esc(t) + '">' + esc(t) + '<button type="button" class="lt-chip-x" data-int-tagx aria-label="Remover tag ' + esc(t) + '">' + I('x') + '</button></span>';
  function previewCard(w) {
    const base = w.base || {};
    const fake = Object.assign({}, base, {
      id: base.id || 0, titulo: w.titulo || 'Título do material', categoriaId: +w.categoriaId, tipo: w.tipo, capaUrl: w.capa === 'upload' ? w.capaUrl : null,
      vistoPor: base.vistoPor || [], atualizadoEm: util.hojeIso(), publicadoEm: base.publicadoEm || util.hojeIso(), ativo: true, autorId: base.autorId || App.meId,
      duracao: base.duracao || 300, paginas: base.paginas || 1, slides: base.slides || 10, abas: base.abas || 1, tags: w.tags, aceite: w.aceite, status: 'publicado', arquivo: base.arquivo || { nome: 'arquivo.' + tipo(w.tipo).ext.toLowerCase(), tamanho: '—' }
    });
    return card(fake, { estatico: true });
  }
  App.screen({
    id: 'int.admin.edit', hash: 'int-editar', module: 'intranet', title: 'Cadastrar ou editar material', navGroup: 'intranet', navParent: 'int-gerenciar', exemplo: 4107,
    render: (p) => {
      if (!podeGerenciar()) return naoEncontrado('Sem permissão', 'Publicar e organizar materiais é dos papéis Sócio, Gestor comercial e Administrativo.');
      const m = p.id ? mat(p.id) : null;
      if (p.id && !m) return naoEncontrado();
      const ts = m ? trilhasDo(m) : [], cid = m ? m.categoriaId : (App.state.intNovoCat || 1);
      const w = App.state.intEdit = { base: m || {}, titulo: m ? m.titulo : '', categoriaId: cid, tipo: m ? m.tipo : 'pdf', tags: m ? m.tags.slice() : [], aceite: m ? m.aceite : false, capa: 'auto', capaUrl: null };
      const autor = m ? db.pessoa(m.autorId) : null;
      const papeisSel = m && m.papeis ? m.papeis : D.papeis.map((x) => x.key);
      const proxOrdem = DI.materiais.filter((x) => x.categoriaId === cid).length + 1;
      const head = ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Gerenciar materiais', hash: 'int-gerenciar' }, { label: m ? m.titulo : 'Novo material' }]),
        eyebrow: m ? 'Material #' + m.id + ' · v' + m.versao : 'Novo material', title: m ? 'Editar material' : 'Cadastrar material',
        sub: m ? 'Publicado em ' + fmt.data(m.publicadoEm) + ' por ' + esc(autor ? autor.nome : '—') + ' · atualizado em ' + fmt.data(m.atualizadoEm) + '.' : 'Preencha os cards e publique. O material aparece na biblioteca para os papéis escolhidos.',
        actions: m ? ui.btn({ label: 'Ver na biblioteca', icon: 'eye', href: '#int-material-' + m.id }) : ''
      });
      const s1 = ui.section({ title: 'Identificação', sub: 'Como o material aparece no card e na busca', tone: 'gold', icon: 'file-text', body: '<div class="lt-stack">' +
        ui.field({ label: 'Título', name: 'titulo', required: true, value: w.titulo, placeholder: 'Ex.: Guia prático da tese do ICMS', hint: 'Até 90 caracteres. Comece pelo assunto.' }) +
        ui.field({ label: 'Descrição', name: 'descricao', type: 'textarea', rows: 3, value: m ? m.descricao : '', placeholder: 'Para que serve, quando usar e para quem é.' }) + '</div>' });
      const s2 = ui.section({ title: 'Classificação', sub: 'Categoria, tipo e palavras-chave', tone: 'violet', icon: 'layers', body: '<div class="lt-stack">' +
        '<div class="lt-grid lt-grid--2">' + ui.field({ label: 'Categoria', name: 'categoria', type: 'select', required: true, value: cid, options: catsOrdenadas().map((c) => ({ value: c.id, label: c.nome })) }) + ui.field({ label: 'Ordem na categoria', name: 'ordem', type: 'number', value: m ? m.ordem : proxOrdem, hint: 'Também dá para arrastar em Gerenciar materiais.' }) + '</div>' +
        '<div class="lt-field"><span class="lt-label">Tipo<span class="lt-req" aria-hidden="true">*</span></span>' + tiposPicker(w.tipo) + '</div>' +
        '<div class="lt-field"><label class="lt-label" for="int-tag-input">Tags</label><div class="m-int-tags" data-int-tags>' + w.tags.map(tagChip).join('') + '<input id="int-tag-input" class="m-int-tags__input" placeholder="Nova tag e Enter" aria-label="Nova tag"></div><span class="lt-hint">Ajudam na busca. Ex.: ICMS, Lucro Real, etapa 4.</span></div></div>' });
      const capaPrev = '<div data-int-capaprev>' + cover(Object.assign({}, m || { categoriaId: cid, tipo: w.tipo, titulo: '' }, { categoriaId: cid, tipo: w.tipo }), { bare: true }) + '</div>';
      const s3 = ui.section({ title: 'Arquivo, link e capa', sub: 'O que a pessoa abre e a imagem do card', tone: 'slate', icon: 'paperclip', cols: 2, body:
        '<div data-int-arq>' + arquivoCampos(w.tipo, m) + '</div>' +
        '<div class="lt-stack lt-stack--sm"><span class="lt-label">Capa</span>' + capaPrev +
        ui.field({ type: 'radio', name: 'capa', value: 'auto', options: [{ value: 'auto', label: 'Capa automática', hint: 'Cor da categoria e ícone do tipo' }, { value: 'upload', label: 'Enviar imagem', hint: '1280 × 720 px (16:9), JPG ou PNG' }] }) +
        '<label class="lt-upload" data-upload data-int-capaup hidden>' + I('image') + '<span><strong>Escolha a imagem da capa</strong></span><span class="lt-hint">A pré-visualização aparece na hora</span><input type="file" accept="image/*" class="lt-sr" data-int-capainput></label></div>' });
      const s4 = ui.section({ title: 'Visibilidade e destaque', sub: 'Quem vê o material na biblioteca', tone: 'blue', icon: 'users', body: '<div class="lt-stack">' +
        ui.field({ type: 'toggle', label: 'Toda a equipe pode ver', name: 'todos', checked: !m || !m.papeis, hint: 'Desligue para escolher os papéis.' }) +
        '<div data-int-papeis' + (!m || !m.papeis ? ' hidden' : '') + '>' + ui.field({ label: 'Papéis com acesso', type: 'checks', name: 'papeis', value: papeisSel, options: D.papeis.map((x) => ({ value: x.key, label: x.nome })) }) + '</div>' +
        '<div class="lt-grid lt-grid--2">' + ui.field({ type: 'toggle', label: 'Ativo na biblioteca', name: 'ativo', checked: !m || m.ativo, hint: 'Inativo sai da biblioteca e fica no histórico.' }) + ui.field({ type: 'toggle', label: 'Em destaque', name: 'destaque', checked: !!(m && m.destaque), hint: 'Aparece na faixa do topo (máximo de 6).' }) + '</div></div>' });
      const s5 = ui.section({ title: 'Leitura e onboarding', sub: 'Confirmação de leitura e trilhas para novos colaboradores', tone: 'amber', icon: 'list-checks', cols: 2, body:
        ui.field({ type: 'toggle', label: 'Exigir "Confirmo que li"', name: 'aceite', checked: w.aceite, hint: 'Para políticas e regras internas.' }) +
        ui.field({ type: 'toggle', label: 'Avisar a equipe ao salvar', name: 'avisar', checked: !m, hint: 'Notificação no sistema e e-mail.' }) +
        ui.field({ label: 'Incluir na trilha', name: 'trilha', type: 'select', value: ts[0] ? ts[0].t.id : '', placeholder: 'Nenhuma trilha', options: DI.trilhas.map((t) => ({ value: t.id, label: t.nome })) }) +
        ui.field({ label: 'Prazo depois da inclusão', name: 'prazo', type: 'number', value: ts[0] ? ts[0].e.prazoDias : 5, suffix: 'dias úteis', hint: 'Conta pelo calendário de feriados do sistema.' }) });
      const hist = m ? (DI.historico[m.id] || [{ quando: m.atualizadoEm + 'T10:00', pessoaId: m.autorId, acao: m.versao > 1 ? 'Enviou a versão ' + m.versao : 'Publicou o material', nota: '' }].concat(m.versao > 1 ? [{ quando: m.publicadoEm + 'T09:00', pessoaId: m.autorId, acao: 'Publicou o material', nota: '' }] : [])) : [];
      const lado = '<div class="m-int-sticky lt-stack">' + ui.card({ title: 'Pré-visualização', icon: 'eye', sub: 'Como o card aparece na biblioteca', body: '<div data-int-preview>' + previewCard(w) + '</div>' }) +
        (m ? ui.card({ title: 'Histórico', icon: 'history', body: ui.timeline(hist.map((h) => ({ icon: 'edit', tone: 'gold', title: esc(h.acao), meta: esc((db.pessoa(h.pessoaId) || {}).nome || '') + ' · ' + fmt.dataHora(h.quando), text: h.nota ? esc(h.nota) : '' }))) }) +
          ui.card({ title: 'Remover', icon: 'trash', body: '<p class="lt-small lt-text-2" style="margin-bottom:12px">Desativar tira da biblioteca e mantém o histórico de quem viu. Excluir apaga tudo.</p><div class="lt-row">' + ui.btn({ label: 'Excluir material', variant: 'danger-outline', icon: 'trash', size: 'sm', acao: 'excluir', confirm: 'Excluir "' + m.titulo + '"?', confirmText: 'O arquivo, a capa e o registro de "visto por" são apagados. Não dá para desfazer.', confirmLabel: 'Excluir', toast: 'Material excluído', ir: 'int-gerenciar' }) + '</div>' }) : '') + '</div>';
      return head + '<div class="lt-split"><div class="lt-sections" data-int-form>' + s1 + s2 + s3 + s4 + s5 + '</div>' + lado + '</div>' +
        '<div class="lt-form-actions"><span class="lt-form-actions__info">Campos com * são obrigatórios</span>' + ui.btn({ label: 'Cancelar', href: '#int-gerenciar' }) +
        ui.btn({ label: m ? 'Salvar alterações' : 'Publicar material', variant: 'primary', icon: 'check', acao: m ? 'salvar' : 'publicar', toast: m ? 'Material salvo' : 'Material publicado', toastText: m ? 'A biblioteca já mostra a versão nova.' : 'Já aparece na biblioteca para quem tem acesso.', ir: 'int-gerenciar', attrs: { 'data-int-salvar': true } }) + '</div>';
    },
    mount: (root, p) => {
      const w = App.state.intEdit; if (!w || !root.querySelector('[data-int-form]')) return;
      const m = p.id ? mat(p.id) : null;
      const prev = root.querySelector('[data-int-preview]'), capaPrev = root.querySelector('[data-int-capaprev]'), arq = root.querySelector('[data-int-arq]'), tagsBox = root.querySelector('[data-int-tags]'), tagIn = root.querySelector('#int-tag-input');
      const sync = () => {
        prev.innerHTML = previewCard(w);
        capaPrev.innerHTML = w.capa === 'upload' && w.capaUrl ? '<div class="lt-cover"><img src="' + esc(w.capaUrl) + '" alt="Capa enviada"></div>' : cover(Object.assign({}, w.base, { categoriaId: +w.categoriaId, tipo: w.tipo, capaUrl: null }), { bare: true });
      };
      const addTag = (v) => { v = String(v || '').trim().replace(/,$/, ''); if (!v || w.tags.indexOf(v) >= 0) return; w.tags.push(v); tagIn.insertAdjacentHTML('beforebegin', tagChip(v)); sync(); };
      tagIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagIn.value); tagIn.value = ''; }
        else if (e.key === 'Backspace' && !tagIn.value && w.tags.length) { w.tags.pop(); const last = tagsBox.querySelectorAll('[data-int-tagval]'); if (last.length) last[last.length - 1].remove(); sync(); }
      });
      tagIn.addEventListener('blur', () => { if (tagIn.value.trim()) { addTag(tagIn.value); tagIn.value = ''; } });
      root.addEventListener('input', (e) => { if (e.target.name === 'titulo') { w.titulo = e.target.value; e.target.closest('.lt-field').classList.remove('is-invalid'); const er = e.target.closest('.lt-field').querySelector('.lt-error-text'); if (er) er.remove(); sync(); } });
      root.addEventListener('change', (e) => {
        const n = e.target.name;
        if (n === 'tipo') { w.tipo = e.target.value; arq.innerHTML = arquivoCampos(w.tipo, m); sync(); }
        else if (n === 'categoria') { w.categoriaId = e.target.value; sync(); }
        else if (n === 'aceite') { w.aceite = e.target.checked; sync(); }
        else if (n === 'todos') root.querySelector('[data-int-papeis]').hidden = e.target.checked;
        else if (n === 'capa') { w.capa = e.target.value; root.querySelector('[data-int-capaup]').hidden = w.capa !== 'upload'; sync(); }
        else if (e.target.matches('[data-int-capainput]') && e.target.files && e.target.files[0]) {
          try { w.capaUrl = URL.createObjectURL(e.target.files[0]); } catch (x) { w.capaUrl = null; }
          sync();
        }
        else if (n === 'destaque' && e.target.checked && !(m && m.destaque) && DI.materiais.filter((x) => x.ativo && x.destaque).length >= 6) { ui.toast('Faixa de destaques cheia', 'warning', 'Já há 6 destaques. Ao salvar, o mais antigo sai da faixa.'); }
      });
      root.addEventListener('click', (e) => {
        const x = e.target.closest('[data-int-tagx]');
        if (x) { const ch = x.closest('[data-int-tagval]'), v = ch.getAttribute('data-int-tagval'); w.tags = w.tags.filter((t) => t !== v); ch.remove(); sync(); return; }
        if (e.target.closest('.m-int-tags') && !e.target.closest('button')) tagIn.focus();
        const sv = e.target.closest('[data-int-salvar]');
        if (sv && !w.titulo.trim()) {
          e.stopPropagation(); e.preventDefault();
          const f = root.querySelector('[name="titulo"]'), fld = f.closest('.lt-field');
          if (!fld.classList.contains('is-invalid')) { fld.classList.add('is-invalid'); fld.insertAdjacentHTML('beforeend', '<span class="lt-error-text">' + I('alert-circle') + 'Informe o título do material.</span>'); }
          f.focus(); ui.toast('Falta o título', 'warning', 'O título é obrigatório para publicar.');
        }
      }, true);
      root.addEventListener('lt:acao', (e) => {
        if (!e.target.closest('[data-int-salvar]')) return;
        const val = (n) => { const el = root.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value) : null; };
        const dados = { titulo: w.titulo.trim(), descricao: val('descricao') || '', categoriaId: +w.categoriaId, tipo: w.tipo, tags: w.tags.slice(), ativo: val('ativo'), destaque: val('destaque'), aceite: w.aceite };
        if (m) { Object.assign(m, dados, { atualizadoEm: util.hojeIso(), versao: m.versao + (m.tipo !== w.tipo ? 1 : 0) }); if (w.capa === 'upload' && w.capaUrl) m.capaUrl = w.capaUrl; }
        else {
          const id = Math.max.apply(null, DI.materiais.map((x) => x.id)) + 1;
          DI.materiais.push(Object.assign({ id: id, ordem: +val('ordem') || 99, status: 'publicado', papeis: null, versao: 1, download: true, autorId: App.meId, publicadoEm: util.hojeIso(), atualizadoEm: util.hojeIso(), vistoPor: [], visualizacoes: 0, downloads: 0, duracao: 300, paginas: +val('paginas') || 1, slides: +val('slides') || 1, abas: +val('abas') || 1, arquivo: { nome: 'novo_material.' + tipo(w.tipo).ext.toLowerCase(), tamanho: '—' }, link: w.tipo === 'link' ? { url: val('url') || 'https://', dominio: String(val('url') || '').replace(/^https?:\/\//, '').split('/')[0] || 'link externo', resumo: '' } : null, capaUrl: w.capa === 'upload' ? w.capaUrl : null }, dados));
        }
      });
    }
  });

  /* ================================================================== */
  /* CATEGORIAS                                                          */
  /* ================================================================== */
  function catRow(c) {
    const n = DI.materiais.filter((m) => m.categoriaId === c.id).length, nAtivos = DI.materiais.filter((m) => m.categoriaId === c.id && m.ativo).length, cur = db.pessoa(c.curadorId);
    return '<div class="m-int-catrow" data-int-catid="' + c.id + '" data-mtone="' + c.cor + '">' + grip() + '<span class="m-int-catrow__icon">' + I(c.icone) + '</span>' +
      '<div style="min-width:0"><div class="lt-row" style="gap:8px"><span class="m-int-catrow__name">' + esc(c.nome) + '</span><span class="lt-chip" data-tone="gray" data-int-catord>' + c.ordem + 'º</span></div><div class="m-int-catrow__desc lt-truncate">' + esc(c.descricao) + '</div></div>' +
      '<div class="m-int-catrow__meta m-int-catrow__extra"><b class="lt-num">' + n + '</b> ' + (n === 1 ? 'material' : 'materiais') + (nAtivos !== n ? ' · <b class="lt-num">' + nAtivos + '</b> ' + (nAtivos === 1 ? 'ativo' : 'ativos') : '') + '<div class="lt-hint">' + (nAtivos !== n ? fmt.plural(n - nAtivos, 'inativo') + ' · ' : '') + 'Curadoria: ' + esc(cur ? cur.nome.split(' ')[0] : '—') + '</div></div>' +
      '<label class="lt-toggle lt-toggle--sm m-int-catrow__extra" title="Ativa"><input type="checkbox" data-int-catativo="' + c.id + '"' + (c.ativo ? ' checked' : '') + ' aria-label="Categoria ativa: ' + esc(c.nome) + '"><span class="lt-toggle__track"></span></label>' +
      '<div class="lt-row lt-row--nowrap" style="gap:2px">' + ui.btn({ icon: 'edit', variant: 'ghost', size: 'sm', tip: 'Editar categoria', sheet: 'int-categoria', attrs: { 'data-id': c.id } }) +
      ui.btn({ icon: 'trash', variant: 'ghost', size: 'sm', tip: n ? 'Mova os materiais antes de excluir' : 'Excluir categoria', disabled: !!n, acao: 'excluir', confirm: 'Excluir a categoria "' + c.nome + '"?', confirmLabel: 'Excluir', toast: 'Categoria excluída' }) + '</div></div>';
  }
  App.screen({
    id: 'int.admin.categories', hash: 'int-categorias', module: 'intranet', title: 'Categorias da biblioteca', nav: true, navGroup: 'intranet', navLabel: 'Categorias', navOrder: 4,
    render: () => {
      if (!podeGerenciar()) return naoEncontrado('Sem permissão', 'Organizar categorias é dos papéis Sócio, Gestor comercial e Administrativo.');
      const cs = catsOrdenadas();
      const amostra = (c) => '<div style="min-width:0"><div class="lt-cover-thumb" style="width:100%">' + cover({ categoriaId: c.id, tipo: 'pdf' }, { mini: true }) + '</div><div class="lt-hint lt-truncate" style="margin-top:4px">' + esc(c.nome) + '</div></div>';
      return ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Categorias' }]), title: 'Categorias da biblioteca',
        sub: 'Nome, cor, ícone e ordem aparecem nos filtros, nas capas automáticas e na página de cada categoria.',
        actions: ui.btn({ label: 'Gerenciar materiais', icon: 'sliders', href: '#int-gerenciar' }) + ui.btn({ label: 'Nova categoria', variant: 'primary', icon: 'plus', sheet: 'int-categoria' })
      }) + '<div class="lt-split"><div style="min-width:0">' +
        ui.card({ title: 'Categorias', icon: 'layers', sub: cs.length + ' categorias · arraste para mudar a ordem', flush: true, body: '<div data-int-catlist>' + cs.map(catRow).join('') + '</div>',
          foot: '<span class="lt-small lt-muted" style="margin-right:auto" data-int-catmsg>Categoria desativada some dos filtros; os materiais dela ficam inativos.</span>' + ui.btn({ label: 'Salvar ordem', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Ordem das categorias salva', attrs: { 'data-int-catsalvar': true } }) }) +
        '</div><div class="lt-stack">' +
        ui.card({ title: 'Como aparece', icon: 'eye', sub: 'Filtros da biblioteca e capas automáticas', body: '<div class="lt-chips">' + cs.filter((c) => c.ativo).map((c) => '<span class="lt-filter-chip"><span class="lt-filter-chip__dot" style="color:var(--tone-' + c.cor + '-solid)"></span>' + esc(c.nome) + '</span>').join('') + '</div>' +
          '<div class="lt-grid lt-grid--2 lt-mt-4" style="gap:12px">' + cs.map(amostra).join('') + '</div>' }) +
        ui.callout({ tone: 'gold', icon: 'palette', title: 'Cores da paleta do sistema', text: 'As 8 cores disponíveis têm contraste conferido nos modos claro e escuro. Por isso não há cor livre.' }) +
        '</div></div>';
    },
    mount: (root) => {
      const list = root.querySelector('[data-int-catlist]'); if (!list) return;
      const renum = () => { list.querySelectorAll('[data-int-catord]').forEach((s, i) => { s.textContent = (i + 1) + 'º'; }); const msg = root.querySelector('[data-int-catmsg]'); msg.textContent = 'Ordem alterada. Salve para aplicar na biblioteca.'; msg.classList.add('lt-gold'); };
      arrastavel(list, '.m-int-catrow', renum);
      root.addEventListener('change', (e) => {
        const t = e.target.closest('[data-int-catativo]'); if (!t) return;
        const c = cat(t.getAttribute('data-int-catativo')); c.ativo = t.checked;
        ui.toast(c.ativo ? 'Categoria ativada' : 'Categoria desativada', 'success', esc(c.nome) + (c.ativo ? ' volta para os filtros.' : ' sai dos filtros da biblioteca.'));
      });
      root.addEventListener('lt:acao', (e) => {
        if (!e.target.closest('[data-int-catsalvar]')) return;
        list.querySelectorAll('[data-int-catid]').forEach((r, i) => { const c = cat(r.getAttribute('data-int-catid')); if (c) c.ordem = i + 1; });
        const msg = root.querySelector('[data-int-catmsg]'); msg.textContent = 'Ordem salva.'; msg.classList.remove('lt-gold');
      });
    }
  });

  function catPreview(c) {
    return '<div class="m-int-catprev" data-mtone="' + c.cor + '">' + cover({ categoriaId: c.id || 1, tipo: 'pdf' }, { bare: true, tone: c.cor, icone: c.icone }) +
      '<div style="min-width:0" class="lt-stack lt-stack--sm"><span class="lt-label-caps">Pré-visualização</span><span class="lt-filter-chip is-active" style="align-self:flex-start"><span class="lt-filter-chip__dot" style="color:var(--tone-' + c.cor + '-solid)"></span>' + esc(c.nome || 'Nome da categoria') + '</span>' +
      '<a class="m-int-cat" data-mtone="' + c.cor + '" style="pointer-events:none"><span class="m-int-cat__icon">' + I(c.icone) + '</span><span style="min-width:0"><span class="m-int-cat__name lt-truncate">' + esc(c.nome || 'Nome da categoria') + '</span><span class="m-int-cat__count">Página da categoria</span></span></a></div></div>';
  }
  ui.registerSheet('int-categoria', (p) => {
    const orig = p.id ? cat(p.id) : null;
    const c = Object.assign({}, orig || { id: 0, nome: '', descricao: '', cor: 'blue', icone: 'folder', ordem: DI.categorias.length + 1, ativo: true, curadorId: 11 });
    const corOpts = '<div class="m-int-swatches" role="radiogroup" aria-label="Cor">' + DI.cores.map((x) => '<label class="m-int-swatch" data-mtone="' + x.key + '"><input type="radio" name="cor" value="' + x.key + '"' + (x.key === c.cor ? ' checked' : '') + ' aria-label="' + esc(x.nome) + '"><span>' + I('check') + '</span>' + esc(x.nome) + '</label>').join('') + '</div>';
    const iconOpts = '<div class="m-int-icons" role="radiogroup" aria-label="Ícone">' + DI.icones.map((k) => '<label class="m-int-iconopt" title="' + esc(k) + '"><input type="radio" name="icone" value="' + k + '"' + (k === c.icone ? ' checked' : '') + ' aria-label="Ícone ' + esc(k) + '"><span>' + I(k) + '</span></label>').join('') + '</div>';
    return {
      eyebrow: orig ? 'Categoria #' + orig.id : 'Intranet', title: orig ? 'Editar categoria' : 'Nova categoria', sub: 'Cor e ícone aparecem nos filtros, nas capas automáticas e na página da categoria.',
      body: '<div data-int-catprevbox>' + catPreview(c) + '</div><div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'file-text', body: '<div class="lt-stack">' + ui.field({ label: 'Nome', name: 'nome', required: true, value: c.nome, placeholder: 'Ex.: Teses tributárias' }) + ui.field({ label: 'Descrição', name: 'descricao', type: 'textarea', rows: 2, value: c.descricao, placeholder: 'Aparece no topo da página da categoria.' }) + '</div>' }) +
        ui.section({ title: 'Aparência', tone: 'violet', icon: 'palette', body: '<div class="lt-stack"><div class="lt-field"><span class="lt-label">Cor<span class="lt-req">*</span></span>' + corOpts + '</div><div class="lt-field"><span class="lt-label">Ícone<span class="lt-req">*</span></span>' + iconOpts + '</div></div>' }) +
        ui.section({ title: 'Organização', tone: 'slate', icon: 'sliders', cols: 2, body: ui.field({ label: 'Ordem', name: 'ordem', type: 'number', value: c.ordem }) + ui.field({ label: 'Curadoria', name: 'curador', type: 'select', value: c.curadorId, options: D.equipe.filter((x) => x.status === 'ativo').map((x) => ({ value: x.id, label: x.nome })), hint: 'Quem revisa os materiais desta categoria.' }) + ui.field({ type: 'toggle', label: 'Categoria ativa', name: 'ativo', checked: c.ativo, span: 'full' }) }) + '</div>',
      foot: ui.sheetFoot({ label: 'Salvar categoria', toast: 'Categoria salva', info: 'Campos com * são obrigatórios', toastText: orig ? esc(orig.nome) : 'Já aparece nos filtros da biblioteca.' }),
      mount: (el) => {
        const box = el.querySelector('[data-int-catprevbox]');
        const ler = () => { const f = (n) => el.querySelector('[name="' + n + '"]'); const cor = el.querySelector('[name="cor"]:checked'), ic = el.querySelector('[name="icone"]:checked'); c.nome = f('nome').value; c.cor = cor ? cor.value : c.cor; c.icone = ic ? ic.value : c.icone; box.innerHTML = catPreview(c); };
        el.addEventListener('input', ler); el.addEventListener('change', ler);
        el.addEventListener('lt:acao', () => {
          const desc = el.querySelector('[name="descricao"]').value, cur = +el.querySelector('[name="curador"]').value || 11, at = el.querySelector('[name="ativo"]').checked;
          if (orig) Object.assign(orig, { nome: c.nome || orig.nome, cor: c.cor, icone: c.icone, descricao: desc, curadorId: cur, ativo: at });
          else if (c.nome.trim()) DI.categorias.push({ id: Math.max.apply(null, DI.categorias.map((x) => x.id)) + 1, nome: c.nome.trim(), descricao: desc, cor: c.cor, icone: c.icone, ordem: +el.querySelector('[name="ordem"]').value || DI.categorias.length + 1, ativo: at, curadorId: cur });
          setTimeout(() => { if (App.current && App.current.screen && /^int-/.test(App.current.screen.hash)) App.refresh(); }, 350);
        });
      }
    };
  });

  /* ================================================================== */
  /* TRILHA DE ONBOARDING                                                */
  /* ================================================================== */
  function etapaInfo(ins, e) {
    const m = mat(e.materialId), pid = ins.pessoaId, ini = m.publicadoEm > ins.inicio ? m.publicadoEm : ins.inicio;
    const prazo = util.iso(util.addDiasUteis(ini, e.prazoDias));
    let feito = null, st;
    if (m.autorId === pid) { feito = m.publicadoEm; st = 'autor'; }
    else if (DI.conclusoes[pid + ':' + m.id]) { feito = DI.conclusoes[pid + ':' + m.id]; st = util.iso(feito) <= prazo ? 'ok' : 'tarde'; }
    else if (!e.obrigatorio) st = 'opcional';
    else st = prazo < util.hojeIso() ? 'vencido' : 'pendente';
    return { m: m, e: e, prazo: prazo, feito: feito, st: st };
  }
  function inscricaoInfo(ins) {
    const t = trilha(ins.trilhaId), its = t.etapas.map((e) => etapaInfo(ins, e));
    const obr = its.filter((i) => i.e.obrigatorio), ok = obr.filter((i) => i.feito), venc = its.filter((i) => i.st === 'vencido');
    const pend = its.filter((i) => !i.feito && i.e.obrigatorio).sort((a, b) => (a.prazo < b.prazo ? -1 : 1));
    return { ins: ins, t: t, its: its, obr: obr, ok: ok, venc: venc, prox: pend[0] || null, concl: ok.length === obr.length, pct: obr.length ? Math.round(100 * ok.length / obr.length) : 100 };
  }
  const SITU_ORD = { int_nao_iniciou: 0, int_atrasada: 1, int_em_dia: 2, concluida: 3 };
  function pessoaOnb(pid) {
    const lst = DI.inscricoes.filter((i) => i.pessoaId === pid).map(inscricaoInfo), p = db.pessoa(pid);
    const obr = util.soma(lst, (x) => x.obr.length), ok = util.soma(lst, (x) => x.ok.length), venc = util.soma(lst, (x) => x.venc.length);
    const prox = lst.map((x) => x.prox).filter(Boolean).sort((a, b) => (a.prazo < b.prazo ? -1 : 1))[0] || null;
    let situ = ok === obr ? 'concluida' : venc ? 'int_atrasada' : 'int_em_dia';
    if (p && p.status === 'convidado' && ok === 0) situ = 'int_nao_iniciou';
    return { p: p, lst: lst, obr: obr, ok: ok, venc: venc, prox: prox, adm: DI.admissoes[pid] || null, situ: situ, pct: obr ? Math.round(100 * ok / obr) : 100 };
  }
  const participantes = () => Array.from(new Set(DI.inscricoes.map((i) => i.pessoaId))).map(pessoaOnb).filter((x) => x.p).sort((a, b) => (SITU_ORD[a.situ] - SITU_ORD[b.situ]) || (b.venc - a.venc) || a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
  const CEL = { ok: ['check-circle', 'lt-success', 'Concluído em '], tarde: ['check-circle', 'lt-warning', 'Concluído com atraso em '], autor: ['edit', 'lt-gold', 'Autor do material'], vencido: ['alert-circle', 'lt-danger', 'Vencido desde '], pendente: ['circle', 'lt-muted', 'Pendente · até '], opcional: ['minus-circle', 'lt-muted', 'Opcional · sugerido até '] };
  function celTip(it) { const c = CEL[it.st]; return it.st === 'ok' || it.st === 'tarde' ? c[2] + fmt.data(it.feito) + (it.st === 'tarde' ? ' (prazo ' + fmt.data(it.prazo) + ')' : '') : it.st === 'autor' ? c[2] : c[2] + fmt.data(it.prazo); }
  const celIcon = (it) => '<span class="m-int-mx ' + CEL[it.st][1] + '" title="' + esc(celTip(it)) + '" role="img" aria-label="' + esc(celTip(it)) + '">' + I(CEL[it.st][0]) + '</span>';
  const legenda = () => '<div class="m-int-legend">' + [['ok', 'Concluído no prazo'], ['tarde', 'Concluído com atraso'], ['vencido', 'Vencido'], ['pendente', 'Pendente'], ['opcional', 'Opcional'], ['autor', 'Autor do material']].map((x) => '<span class="' + CEL[x[0]][1] + '">' + I(CEL[x[0]][0]) + '<span class="lt-text-2">' + x[1] + '</span></span>').join('') + '</div>';
  function proxTexto(it) {
    if (!it) return '<span class="lt-muted">—</span>';
    const d = util.diasEntre(App.HOJE, it.prazo);
    return '<span class="lt-truncate" style="display:block;max-width:260px">' + esc(it.m.titulo) + '</span><span class="lt-table__secondary ' + (d < 0 ? 'lt-danger' : d <= 1 ? 'lt-warning' : '') + '">até ' + fmt.dataCurta(it.prazo) + ' · ' + (d < 0 ? 'venceu ' + fmt.relativo(it.prazo) : fmt.relativo(it.prazo)) + '</span>';
  }
  function spotlight(x) {
    const a = x.adm, g = db.pessoa(a.gestorId);
    return '<section class="lt-card lt-card--accent m-int-spot"><div class="m-int-spot__main">' + ui.avatar(x.p, 'xl') + '<div style="min-width:0"><span class="lt-eyebrow">Chegou esta semana</span><div class="m-int-spot__name">' + esc(x.p.nome) + '</div>' +
      '<div class="lt-small lt-text-2">' + esc(x.p.cargo) + ' · admissão em ' + fmt.data(a.admissao) + ' · gestor: ' + esc(g ? g.nome : '—') + '</div>' +
      '<div class="lt-chips lt-mt-2">' + ui.status(x.situ) + x.lst.map((l) => ui.chip(l.t.nome + ' · ' + l.ok.length + '/' + l.obr.length, l.t.cor, { icon: 'flag' })).join('') + '</div></div></div>' +
      '<div>' + ui.callout({ tone: 'warning', title: 'Ainda não acessou o sistema', text: 'Convite enviado em ' + fmt.dataHora(a.conviteEm) + ' para ' + esc(x.p.email) + '. ' + (x.venc ? fmt.plural(x.venc, 'item obrigatório já venceu', 'itens obrigatórios já venceram') + '.' : '') }) +
      '<div class="lt-row lt-mt-2">' + ui.btn({ label: 'Ver progresso', icon: 'list-checks', size: 'sm', sheet: 'int-onboarding-pessoa', attrs: { 'data-id': x.p.id } }) + ui.btn({ label: 'Reenviar convite', variant: 'primary', size: 'sm', icon: 'send', acao: 'enviar', loading: 'Reenviando…', toast: 'Convite reenviado', toastText: esc(x.p.email) }) + '</div></div></section>';
  }
  function tabelaPessoas(ps) {
    return ui.table({
      rows: ps, rowSheet: (x) => ({ sheet: 'int-onboarding-pessoa', params: { id: x.p.id } }),
      columns: [
        { key: 'p', label: 'Pessoa', sortable: true, value: (x) => x.p.nome, render: (x) => ui.person(x.p, esc(x.p.cargoCurto || x.p.cargo)) },
        { key: 't', label: 'Trilhas', render: (x) => '<div class="lt-chips">' + x.lst.map((l) => ui.chip(l.t.nome, l.t.cor)).join('') + '</div>' },
        { key: 'pr', label: 'Obrigatórios', sortable: true, value: (x) => x.pct, render: (x) => '<div style="min-width:140px"><div class="lt-row lt-row--between lt-small"><span class="lt-num">' + x.ok + ' de ' + x.obr + '</span><span class="lt-num lt-muted">' + x.pct + '%</span></div>' + ui.progress(x.ok, x.obr || 1, x.situ === 'concluida' ? 'green' : x.venc ? 'red' : '') + '</div>' },
        { key: 'v', label: 'Vencidos', align: 'center', sortable: true, value: (x) => x.venc, render: (x) => (x.venc ? ui.chip(String(x.venc), 'red', { dot: true }) : '<span class="lt-muted">—</span>') },
        { key: 'px', label: 'Próximo item', render: (x) => proxTexto(x.prox) },
        { key: 's', label: 'Situação', sortable: true, value: (x) => SITU_ORD[x.situ], render: (x) => ui.status(x.situ) }
      ],
      rowActions: (x) => (x.situ === 'concluida' ? '' : ui.btn({ icon: 'bell', variant: 'ghost', size: 'xs', tip: 'Enviar lembrete', acao: 'enviar', loading: 'Enviando…', toast: 'Lembrete enviado', toastText: esc(x.p.nome) + ' · ' + fmt.plural(x.obr - x.ok, 'item pendente', 'itens pendentes') }))
    });
  }
  function matrizHtml(tid) {
    const t = trilha(tid), ins = DI.inscricoes.filter((i) => i.trilhaId === t.id).map(inscricaoInfo).sort((a, b) => a.pct - b.pct || (db.pessoa(a.ins.pessoaId).nome).localeCompare(db.pessoa(b.ins.pessoaId).nome));
    const head = '<tr><th style="width:36px">#</th><th>Material</th><th>Prazo</th>' + ins.map((x) => { const p = db.pessoa(x.ins.pessoaId); return '<th class="lt-center" title="' + esc(p.nome) + '">' + ui.avatar(p, 'xs') + '<span class="m-int-mx__nm">' + esc(primeiro(p)) + '</span></th>'; }).join('') + '</tr>';
    const rows = t.etapas.map((e, i) => { const m = mat(e.materialId); return '<tr><td class="lt-num lt-muted">' + (i + 1) + '</td><td><div class="lt-row lt-row--nowrap" style="gap:10px">' + thumbMini(m, true) + '<a href="#int-material-' + m.id + '" class="lt-truncate" style="max-width:280px;color:var(--text);font-weight:500">' + esc(m.titulo) + '</a>' + (e.obrigatorio ? '' : ui.chip('Opcional', 'gray')) + (e.aceite ? ui.chip('Confirma leitura', 'red') : '') + '</div></td><td class="lt-muted" style="white-space:nowrap">D+' + e.prazoDias + (e.prazoDias === 1 ? ' útil' : ' úteis') + '</td>' + ins.map((x) => '<td class="lt-center">' + celIcon(x.its[i]) + '</td>').join('') + '</tr>'; }).join('');
    const foot = '<tr><td></td><td class="lt-strong">Obrigatórios concluídos</td><td></td>' + ins.map((x) => '<td class="lt-center lt-num lt-strong ' + (x.concl ? 'lt-success' : x.venc.length ? 'lt-danger' : '') + '">' + x.pct + '%</td>').join('') + '</tr>';
    return '<div class="lt-table-card"><div class="lt-table-wrap"><table class="lt-table lt-table--compact m-int-mxt"><thead>' + head + '</thead><tbody>' + rows + '</tbody><tfoot>' + foot + '</tfoot></table></div>' + legenda() + '</div>';
  }
  function etapasCard(t) {
    const nIns = DI.inscricoes.filter((i) => i.trilhaId === t.id).length, resp = db.pessoa(t.responsavelId);
    return ui.card({
      title: t.nome, icon: 'flag', sub: esc(t.publico) + ' · ' + fmt.plural(nIns, 'pessoa', 'pessoas') + ' · responsável: ' + esc(resp ? resp.nome : '—'), flush: true,
      actions: ui.chip(fmt.plural(t.etapas.length, 'etapa'), t.cor),
      body: '<p class="lt-small lt-text-2" style="padding:12px 16px 4px">' + esc(t.descricao) + '</p><ol class="m-int-steps" data-int-steps="' + t.id + '">' + t.etapas.map((e, i) => {
        const m = mat(e.materialId);
        return '<li class="m-int-step">' + grip('Arrastar etapa') + '<span class="m-int-step__num" data-int-stepnum>' + (i + 1) + '</span>' + thumbMini(m, true) + '<div style="min-width:0"><a class="m-int-step__t lt-truncate" style="display:block" href="#int-material-' + m.id + '">' + esc(m.titulo) + '</a><div class="m-int-step__m"><span>' + esc(tipo(m.tipo).nome) + '</span><span>·</span><span>até D+' + e.prazoDias + (e.prazoDias === 1 ? ' útil' : ' úteis') + '</span>' + (e.obrigatorio ? ui.chip('Obrigatório', 'amber') : ui.chip('Opcional', 'gray')) + (e.aceite ? ui.chip('Confirma leitura', 'red') : '') + '</div></div></li>';
      }).join('') + '</ol>',
      foot: ui.btn({ label: 'Adicionar etapa', variant: 'add', size: 'sm', icon: 'plus', dialog: 'int-add-etapa', attrs: { 'data-trilha': t.id } }) + ui.btn({ label: 'Salvar ordem', variant: 'primary', size: 'sm', icon: 'check', acao: 'salvar', toast: 'Ordem da trilha salva', toastText: esc(t.nome) })
    });
  }
  App.screen({
    id: 'int.onboarding.track', hash: 'int-onboarding', module: 'intranet', title: 'Trilha de onboarding', nav: true, navGroup: 'intranet', navLabel: 'Trilha de onboarding', navOrder: 2,
    render: () => {
      const ps = participantes(), novos = ps.filter((x) => x.adm);
      const emAndamento = ps.filter((x) => x.situ !== 'concluida').length, venc = util.soma(ps, (x) => x.venc);
      const feitos = []; ps.forEach((x) => x.lst.forEach((l) => l.its.forEach((it) => { if (it.e.obrigatorio && (it.st === 'ok' || it.st === 'tarde')) feitos.push(it); })));
      const noPrazo = feitos.length ? Math.round(100 * feitos.filter((it) => it.st === 'ok').length / feitos.length) : 100;
      const mats = new Set(); DI.trilhas.forEach((t) => t.etapas.forEach((e) => mats.add(e.materialId)));
      const segTrilha = App.state.intMx || DI.trilhas[0].id;
      const tabs = ui.tabs({ id: 'int-onb', tabs: [
        { key: 'pessoas', label: 'Por pessoa', icon: 'users', count: ps.length, content: tabelaPessoas(ps) },
        { key: 'matriz', label: 'Matriz de progresso', icon: 'grid', content: '<div class="lt-row lt-row--between lt-mb-4"><div class="m-int-scrollx">' + ui.segmented(DI.trilhas.map((t) => ({ label: t.nome, value: String(t.id), active: String(segTrilha) === String(t.id) })), { name: 'int-mx' }) + '</div><span class="lt-hint">Passe o mouse no ícone para ver a data</span></div><div data-int-mx>' + matrizHtml(segTrilha) + '</div>' },
        { key: 'etapas', label: 'Etapas das trilhas', icon: 'list-checks', count: DI.trilhas.length, content: '<div class="lt-g12">' + DI.trilhas.map((t) => '<div class="lt-c4">' + etapasCard(t) + '</div>').join('') + '</div>' }
      ] });
      return ui.pageHeader({
        breadcrumb: crumbs([{ label: 'Trilha de onboarding' }]), title: 'Trilha de onboarding',
        sub: 'Materiais obrigatórios para quem chega, com prazo em dias úteis contado da inclusão na trilha.',
        actions: ui.btn({ label: 'Ver materiais', icon: 'folder', href: '#int-biblioteca' }) + ui.btn({ label: 'Incluir colaborador', variant: 'primary', icon: 'user-plus', dialog: 'int-incluir-trilha' })
      }) + ui.kpis([
        { label: 'Em andamento', value: String(emAndamento), unit: 'pessoas', icon: 'users', foot: fmt.plural(novos.length, 'admissão nova', 'admissões novas') + ' esta semana' },
        { label: 'Itens vencidos', value: String(venc), icon: 'alert-triangle', good: false, dir: venc ? 'up' : 'flat', delta: venc ? 'atenção' : null, foot: 'obrigatórios fora do prazo' },
        { label: 'Concluídos no prazo', value: fmt.pct(noPrazo), icon: 'check-circle', progress: { value: noPrazo, max: 100, tone: noPrazo >= 85 ? 'green' : 'amber' }, foot: fmt.plural(feitos.length, 'item obrigatório concluído', 'itens obrigatórios concluídos') },
        { label: 'Trilhas ativas', value: String(DI.trilhas.length), icon: 'flag', foot: fmt.plural(mats.size, 'material', 'materiais') + ' nas trilhas' }
      ]) + '<div class="lt-mt-6"></div>' + novos.map(spotlight).join('') + tabs;
    },
    mount: (root) => {
      root.addEventListener('lt:segment', (e) => { if (e.detail.name !== 'int-mx') return; App.state.intMx = e.detail.value; root.querySelector('[data-int-mx]').innerHTML = matrizHtml(e.detail.value); });
      root.querySelectorAll('[data-int-steps]').forEach((ol) => arrastavel(ol, '.m-int-step', () => { ol.querySelectorAll('[data-int-stepnum]').forEach((s, i) => { s.textContent = i + 1; }); }));
    }
  });

  ui.registerSheet('int-onboarding-pessoa', (p) => {
    const x = pessoaOnb(+p.id);
    if (!x.p) return { title: 'Pessoa não encontrada', body: ui.empty({ icon: 'user', title: 'Pessoa não encontrada' }) };
    const ins = x.lst.map((l) => {
      const resp = l.ins.motivo === 'admissao' ? 'Admissão em ' + fmt.data(l.ins.inicio) : 'Incluída no lançamento da trilha (' + fmt.data(l.ins.inicio) + ')';
      return ui.card({
        title: l.t.nome, icon: 'flag', sub: resp, actions: ui.chip(l.ok.length + ' de ' + l.obr.length + ' obrigatórios', l.concl ? 'green' : l.venc.length ? 'red' : 'blue'), flush: true,
        body: ui.list(l.its.map((it) => {
          const d = util.diasEntre(App.HOJE, it.prazo);
          const metaTxt = it.feito ? (it.st === 'autor' ? 'Autor do material' : 'Concluído em ' + fmt.data(it.feito) + (it.st === 'tarde' ? ' · prazo era ' + fmt.data(it.prazo) : '')) : 'Prazo ' + fmt.data(it.prazo) + ' (D+' + it.e.prazoDias + (it.e.prazoDias === 1 ? ' útil' : ' úteis') + ')' + (it.e.obrigatorio ? '' : ' · opcional');
          const aside = it.st === 'vencido' ? ui.chip('Venceu ' + fmt.relativo(it.prazo), 'red') + ui.btn({ label: 'Concluir', size: 'xs', icon: 'check', acao: 'concluir', toast: 'Etapa marcada como concluída', toastText: esc(it.m.titulo) })
            : it.st === 'pendente' || it.st === 'opcional' ? (d <= 1 && it.e.obrigatorio ? ui.chip(fmt.relativo(it.prazo), 'amber') : '') + ui.btn({ label: 'Concluir', size: 'xs', icon: 'check', acao: 'concluir', toast: 'Etapa marcada como concluída', toastText: esc(it.m.titulo) })
            : it.st === 'tarde' ? ui.chip('Com atraso', 'amber') : it.st === 'autor' ? ui.chip('Autor', 'gold') : ui.chip('No prazo', 'green');
          return { lead: '<span class="lt-list__icon">' + celIcon(it) + '</span>', title: '<a href="#int-material-' + it.m.id + '" style="color:var(--text)">' + esc(it.m.titulo) + '</a>', meta: '<span>' + esc(metaTxt) + '</span>', aside: aside };
        }))
      });
    }).join('');
    const topo = '<div class="lt-row lt-mb-4" style="gap:14px">' + ui.avatar(x.p, 'lg') + '<div style="min-width:0"><div class="lt-strong">' + esc(x.p.nome) + '</div><div class="lt-hint">' + esc(x.p.cargo) + ' · ' + esc(x.p.email) + '</div></div><span class="lt-push">' + ui.status(x.situ) + '</span></div>' +
      '<div class="lt-mb-4">' + ui.summary([{ label: 'Obrigatórios', value: x.ok + ' de ' + x.obr }, { label: 'Progresso', value: x.pct + '%' }, { label: 'Vencidos', value: '<span class="' + (x.venc ? 'lt-danger' : '') + '">' + x.venc + '</span>' }]) + '</div>' +
      (x.situ === 'int_nao_iniciou' && x.adm ? '<div class="lt-mb-4">' + ui.callout({ tone: 'warning', title: 'Ainda não acessou o sistema', text: 'Convite enviado em ' + fmt.dataHora(x.adm.conviteEm) + '. Os prazos já estão contando desde a admissão.' }) + '</div>' : '');
    return {
      eyebrow: 'Trilha de onboarding', title: x.p.nome, sub: fmt.plural(x.lst.length, 'trilha') + ' · progresso por etapa', size: 'lg',
      body: topo + '<div class="lt-stack">' + ins + '</div>',
      foot: ui.btn({ label: 'Fechar', attrs: { 'data-fechar-sheet': true } }) + (x.situ === 'concluida' ? '' : ui.btn({ label: x.situ === 'int_nao_iniciou' ? 'Reenviar convite' : 'Enviar lembrete', variant: 'primary', icon: 'send', acao: 'enviar', loading: 'Enviando…', toast: x.situ === 'int_nao_iniciou' ? 'Convite reenviado' : 'Lembrete enviado', toastText: esc(x.p.email) }))
    };
  });

  ui.registerDialog('int-incluir-trilha', () => ({
    title: 'Incluir colaborador', text: 'Os prazos contam em dias úteis a partir da data de inclusão.', icon: 'user-plus',
    body: '<div class="lt-sections">' + ui.section({ title: 'Quem e quando', tone: 'blue', icon: 'user', cols: 2, body: ui.field({ label: 'Colaborador', name: 'pessoa', type: 'select', required: true, value: 9, options: D.equipe.map((p) => ({ value: p.id, label: p.nome })) }) + ui.field({ label: 'Data de inclusão', name: 'inicio', type: 'date', value: util.hojeIso() }) }) +
      ui.section({ title: 'Trilhas', tone: 'amber', icon: 'flag', body: ui.field({ type: 'checks', name: 'trilhas', value: [String(DI.trilhas[0].id)], options: DI.trilhas.map((t) => ({ value: String(t.id), label: t.nome, hint: t.publico + ' · ' + fmt.plural(t.etapas.length, 'etapa') })) }) + '<div class="lt-mt-4">' + ui.field({ type: 'toggle', name: 'boasvindas', label: 'Enviar e-mail de boas-vindas com o link da trilha', checked: true }) + '</div>' }) + '</div>',
    foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Incluir na trilha', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Colaborador incluído', toastText: 'Ele recebe o e-mail e a lista de etapas.', fechar: 'dialog' })
  }));
  ui.registerDialog('int-add-etapa', (p) => {
    const t = trilha(p.trilha) || DI.trilhas[0], ja = t.etapas.map((e) => e.materialId);
    return {
      title: 'Adicionar etapa', text: 'Trilha: ' + esc(t.nome), icon: 'plus',
      body: '<div class="lt-sections">' + ui.section({ title: 'Material e prazo', tone: 'amber', icon: 'list-checks', cols: 2, body: ui.field({ label: 'Material', name: 'material', type: 'select', required: true, span: 'full', options: DI.materiais.filter((m) => m.ativo && ja.indexOf(m.id) < 0).sort(porCuradoria).map((m) => ({ value: m.id, label: m.titulo })) }) +
        ui.field({ label: 'Prazo', name: 'prazo', type: 'number', value: 5, suffix: 'dias úteis' }) + '<div class="lt-stack lt-stack--sm" style="justify-content:flex-end">' + ui.field({ type: 'toggle', name: 'obrigatorio', label: 'Obrigatório', checked: true }) + ui.field({ type: 'toggle', name: 'aceite', label: 'Exigir "Confirmo que li"' }) + '</div>' }) + '</div>',
      foot: ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-dialog': true } }) + ui.btn({ label: 'Adicionar etapa', variant: 'primary', icon: 'check', acao: 'salvar', toast: 'Etapa adicionada', toastText: esc(t.nome), fechar: 'dialog' })
    };
  });

  /* ================================================================== */
  /* GAVETAS: enviar material · visto por                                 */
  /* ================================================================== */
  function arqSimples(t) {
    if (t === 'link') return ui.field({ label: 'Endereço (URL)', name: 'url', type: 'url', required: true, placeholder: 'https://', hint: 'Abre em nova aba; o sistema registra quem abriu.' });
    return ui.field({ label: 'Arquivo', type: 'upload', accept: tipo(t).aceita, required: true });
  }
  ui.registerSheet('int-novo-material', (p) => {
    const cid = p.categoria || App.state.intNovoCat || 1;
    return {
      eyebrow: 'Intranet', title: 'Enviar material', sub: 'Publique um documento, vídeo ou link na biblioteca da equipe.',
      body: '<div class="lt-sections">' +
        ui.section({ title: 'Identificação', tone: 'gold', icon: 'file-text', body: '<div class="lt-stack">' + ui.field({ label: 'Título', name: 'titulo', required: true, placeholder: 'Ex.: Guia prático da tese do ICMS' }) + ui.field({ label: 'Descrição', name: 'descricao', type: 'textarea', rows: 2, placeholder: 'Para que serve e quando usar' }) + '</div>' }) +
        ui.section({ title: 'Classificação', tone: 'violet', icon: 'layers', body: '<div class="lt-stack"><div class="lt-grid lt-grid--2">' + ui.field({ label: 'Categoria', name: 'categoria', type: 'select', required: true, value: cid, options: catsOrdenadas().filter((c) => c.ativo).map((c) => ({ value: c.id, label: c.nome })) }) + ui.field({ label: 'Tags', name: 'tags', placeholder: 'ICMS, Lucro Real, etapa 4', hint: 'Separe por vírgula.' }) + '</div>' +
          '<div class="lt-field"><span class="lt-label">Tipo<span class="lt-req">*</span></span>' + tiposPicker('pdf', 'tipo') + '</div></div>' }) +
        ui.section({ title: 'Arquivo ou link', tone: 'slate', icon: 'paperclip', body: '<div data-int-sheetarq>' + arqSimples('pdf') + '</div>' }) +
        ui.section({ title: 'Publicação', tone: 'blue', icon: 'users', cols: 2, body: ui.field({ label: 'Quem pode ver', name: 'publico', type: 'select', value: 'todos', options: [{ value: 'todos', label: 'Toda a equipe' }].concat((D.papeis || []).map((x) => ({ value: x.key, label: 'Só ' + x.nome }))), hint: 'Vários papéis: use o formulário completo.' }) +
          '<div class="lt-stack lt-stack--sm" style="justify-content:center">' + ui.field({ type: 'toggle', label: 'Ativo na biblioteca', name: 'ativo', checked: true }) + ui.field({ type: 'toggle', label: 'Avisar a equipe', name: 'avisar', checked: true }) + '</div>' }) + '</div>',
      foot: '<span style="margin-right:auto">' + ui.btn({ label: 'Formulário completo', variant: 'ghost', icon: 'external', href: '#int-editar', attrs: { 'data-int-completo': true } }) + '</span>' +
        ui.btn({ label: 'Cancelar', attrs: { 'data-fechar-sheet': true } }) + ui.btn({ label: 'Publicar material', variant: 'primary', icon: 'upload', acao: 'publicar', toast: 'Material publicado', toastText: 'Já aparece na biblioteca para quem tem acesso.', fechar: 'sheet' }),
      mount: (el) => {
        el.addEventListener('change', (e) => { if (e.target.name === 'tipo') el.querySelector('[data-int-sheetarq]').innerHTML = arqSimples(e.target.value); });
        el.addEventListener('click', (e) => { if (e.target.closest('[data-int-completo]')) { const s = el.querySelector('[name="categoria"]'); App.state.intNovoCat = s ? +s.value : 1; } });
      }
    };
  });
  ui.registerSheet('int-vistos', (p) => {
    const m = mat(p.id); if (!m) return { title: 'Material não encontrado', body: naoEncontrado() };
    const el = comAcesso(m), viu = (pid) => m.vistoPor.find((v) => v.pessoaId === pid);
    const sim = el.filter((x) => viu(x.id)).sort((a, b) => (viu(a.id).quando < viu(b.id).quando ? 1 : -1)), nao = el.filter((x) => !viu(x.id));
    const linha = (x) => { const v = viu(x.id); return { lead: ui.avatar(x, 'sm'), title: esc(x.id === App.meId ? 'Você' : x.nome), meta: '<span>' + esc(x.cargoCurto || x.cargo) + '</span>' + (v ? '<span>' + (v.agora ? 'agora' : esc(fmt.quando(v.quando))) + '</span>' : ''), aside: v ? situacaoVisto(m, v) : (x.status === 'convidado' ? ui.chip('Ainda não acessou o sistema', 'amber') : ui.chip('Não viu', 'gray')) }; };
    return {
      eyebrow: 'Visto por', title: m.titulo, sub: sim.length + ' de ' + fmt.plural(el.length, 'pessoa') + ' com acesso' + (m.aceite ? ' · leitura obrigatória' : ''), size: 'sm',
      body: ui.tabs({ small: true, tabs: [{ key: 'sim', label: 'Viram', count: sim.length, content: '<div class="lt-card">' + ui.list(sim.map(linha), { empty: { title: 'Ninguém viu ainda' } }) + '</div>' }, { key: 'nao', label: 'Ainda não viram', count: nao.length, content: '<div class="lt-card">' + ui.list(nao.map(linha), { empty: { icon: 'check-circle', title: 'Todo mundo já viu', text: 'Todas as pessoas com acesso abriram este material.' } }) + '</div>' }] }),
      foot: ui.btn({ label: 'Fechar', attrs: { 'data-fechar-sheet': true } }) + (nao.length ? ui.btn({ label: 'Lembrar quem não viu', variant: 'primary', icon: 'bell', acao: 'enviar', loading: 'Enviando…', toast: 'Lembrete enviado', toastText: fmt.plural(nao.length, 'pessoa', 'pessoas') + ' · notificação e e-mail' }) : '')
    };
  });
})();
