// Pokémon Incanto – lotta in singolo dentro il gioco.
// Motore: @pkmn/sim (simulatore di Pokémon Showdown, licenza MIT) in lib/pkmn-sim.js (va caricato prima, global PkmnSim).
// Grafica, animazioni e testi sono nostri. Uso: Lotta.open({teams:{p1:'testo Showdown',p2:'...'}, names:{p1,p2}, formatid,
//   showOpp, mode:'two'|'cpu', onClose, onNew}). Le squadre sono nel formato di testo di Showdown (lo stesso di "Copia testo").
(function(){
'use strict';
const CSS=`#lotta{position:fixed;inset:0;z-index:60;overflow:auto;background:#F6F1E4;color:#1F2A44;font:15px/1.45 'Inter',system-ui,sans-serif;padding:14px 12px 30px;--line:#2B3A63;--ink:#1F2A44;--muted:#56627A;--p1:#E3350D;--p2:#2A75BB}
#lotta .lt-wrap{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
#lotta .lt-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#lotta .lt-top .btn{margin-left:auto}
#lotta .lt-title{margin:0;font-family:'Luckiest Guy','Arial Black',sans-serif;font-weight:400;color:#FFCB05;font-size:30px;-webkit-text-stroke:2px #2A6BC0;paint-order:stroke fill;letter-spacing:.03em}
#lotta .lt-card{background:#fff;border:3px solid var(--line);border-radius:14px;box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 5px #D9E2F2,0 5px 0 var(--line);padding:14px}
#lotta [data-tip]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
#lotta .lt-muted{color:var(--muted);font-size:13px;margin:0}
#lotta /* ===== Campo di lotta ===== */
.arena{position:relative;aspect-ratio:16/9;max-height:56vh;width:100%;border:3px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 5px 0 var(--line);
  background:linear-gradient(#BFE6FF 0,#E4F5FF 42%,#A8DB7A 42.2%,#8CCB5E 100%)}
#lotta .arena::before{content:'';position:absolute;left:-10%;right:-10%;top:40%;height:6%;background:radial-gradient(ellipse at 50% 0,rgba(255,255,255,.55),transparent 70%)}
#lotta .pad{position:absolute;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#D8F0B4 0,#B4DD86 55%,#86BE59 100%);border:3px solid rgba(43,58,99,.25)}
#lotta .pad.p2,#lotta .haz.p2{right:7%;top:43%;width:34%;height:13%}
#lotta .pad.p1,#lotta .haz.p1{left:3%;bottom:4%;width:40%;height:15%}
#lotta .mon{position:absolute;display:flex;align-items:flex-end;justify-content:center;transition:opacity .4s,transform .4s;z-index:3}
#lotta .mon img{max-width:100%;max-height:100%;filter:drop-shadow(0 4px 2px rgba(0,0,0,.25))}
#lotta .mon.p2{right:10%;top:12%;width:28%;height:38%}
#lotta .mon.p1{left:6%;bottom:8%;width:34%;height:46%}
#lotta .mon.p1 img{transform:scale(1.35);transform-origin:50% 100%}
#lotta .mon.p1 img.flip{transform:scaleX(-1) scale(1.25)}
#lotta .mon.p2 img{transform:scale(1.05);transform-origin:50% 100%}
#lotta .mon.out{opacity:0;transform:translateY(30%) scale(.6)}
#lotta .mon.lunge.p1{animation:lungeR .45s ease} #lotta .mon.lunge.p2{animation:lungeL .45s ease}
@keyframes lungeR{40%{transform:translate(14%,-8%)}} @keyframes lungeL{40%{transform:translate(-14%,8%)}}
#lotta .mon.hit{animation:hit .5s steps(2,end)} @keyframes hit{0%,50%{opacity:.25}25%,75%,100%{opacity:1}}
#lotta .mon.faint{opacity:0;transform:translateY(60%);transition:opacity .7s,transform .7s}
#lotta .mon.sub img{opacity:.35}

#lotta /* HUD: riquadro nome/PS + cerchio dello strumento + finestrella delle statistiche */
.hud{position:absolute;display:flex;gap:6px;align-items:flex-start;z-index:5;max-width:56%}
#lotta .hud.p2{left:3%;top:5%} #lotta .hud.p1{right:3%;bottom:15%;flex-direction:row-reverse}
#lotta .hudcol{display:flex;flex-direction:column;gap:4px;min-width:0}
#lotta .hpbox{background:#FFFBEA;border:3px solid var(--line);border-radius:12px;padding:5px 10px 7px;min-width:210px;box-shadow:0 4px 0 var(--line);cursor:help}
#lotta .hpbox .nm{display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:clamp(12px,2.3vw,16px);white-space:nowrap}
#lotta .hpbox .nm small{font-weight:600;color:var(--muted)}
#lotta .bar{display:flex;align-items:center;gap:6px;margin-top:3px;font:800 11px 'Inter',sans-serif;color:#E8A317}
#lotta .bar .tr{flex:1;height:10px;background:#45505F;border:2px solid var(--line);border-radius:99px;overflow:hidden}
#lotta .bar .fill{height:100%;width:100%;background:#3FC864;border-radius:99px}
#lotta .bar .fill.mid{background:#F2C21B}#lotta .bar .fill.low{background:#E4533F}
#lotta .hpnum{font:800 12px 'Inter',sans-serif;text-align:right;margin-top:1px;font-variant-numeric:tabular-nums}
#lotta .st{display:inline-block;font:800 10px 'Inter',sans-serif;color:#fff;border-radius:5px;padding:1px 5px;margin-left:4px;vertical-align:middle}
#lotta .st.brn{background:#EE8130}#lotta .st.par{background:#C9A400}#lotta .st.slp{background:#8C8C8C}#lotta .st.psn,#lotta .st.tox{background:#A33EA1}#lotta .st.frz{background:#5FB6D9}
#lotta .itemc{flex:0 0 auto;width:38px;height:38px;border-radius:50%;border:3px solid var(--line);background:#fff;box-shadow:0 3px 0 var(--line);display:grid;place-items:center;padding:0;cursor:help}
#lotta .itemc.none{background:#EEF0F4;border-style:dashed}
#lotta .ico{width:24px;height:24px;background:url(sprites/itemicons-sheet.png) no-repeat;image-rendering:pixelated}
#lotta .boostwin{display:flex;gap:3px;flex-wrap:wrap;background:rgba(255,255,255,.88);border:2px solid var(--line);border-radius:8px;padding:2px 4px;align-self:flex-start}
#lotta .boostwin:empty{display:none}
#lotta .bchip{font:800 11px 'Inter',sans-serif;border-radius:5px;padding:0 5px;color:#fff}
#lotta .bchip.up{background:#2E8B3E}#lotta .bchip.down{background:#C21F1F}
#lotta .pop{position:absolute;z-index:8;font:900 clamp(13px,2.6vw,18px) 'Inter',sans-serif;padding:2px 10px;border-radius:99px;border:2px solid var(--line);color:#fff;pointer-events:none;animation:pop 1.3s ease-out forwards;white-space:nowrap}
#lotta .pop.up{background:#2E8B3E}#lotta .pop.down{background:#C21F1F}#lotta .pop.heal{background:#3FA9F5}
@keyframes pop{0%{opacity:0;transform:translate(-50%,10px) scale(.7)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}75%{opacity:1;transform:translate(-50%,-26px)}100%{opacity:0;transform:translate(-50%,-40px)}}

#lotta /* Poké Ball della squadra (si possono puntare per vedere i Pokémon) */
.balls{position:absolute;display:flex;gap:4px;z-index:5}
#lotta .balls.p2{left:3%;top:36%} #lotta .balls.p1{right:3%;bottom:4%}
#lotta .balls button{width:20px;height:20px;padding:0;border-radius:50%;border:2px solid var(--line);cursor:help;background:linear-gradient(#E3350D 0 44%,var(--line) 44% 56%,#fff 56%)}
#lotta .balls button.ko{background:#9AA3B5;opacity:.6}
#lotta .balls button.st{background:linear-gradient(#E3350D 0 44%,var(--line) 44% 56%,#F2C21B 56%)}

#lotta /* Rocce,#lotta punte,#lotta ragnatela,#lotta schermi (effetti a terra di ciascun lato) */
.haz{position:absolute;pointer-events:none;z-index:2}
#lotta .rock{position:absolute;width:14%;aspect-ratio:1;background:linear-gradient(135deg,#C9CED8,#7D8597 60%,#5A6172);clip-path:polygon(50% 0,95% 35%,80% 100%,18% 95%,0 40%);animation:bob 2.4s ease-in-out infinite;filter:drop-shadow(0 2px 0 rgba(0,0,0,.3))}
@keyframes bob{50%{transform:translateY(-22%) rotate(8deg)}}
#lotta .spike{position:absolute;width:7%;aspect-ratio:1;background:#3B3F4A;clip-path:polygon(50% 0,100% 100%,0 100%)}
#lotta .spike.tox{background:#9A3FD0}
#lotta .web{position:absolute;inset:-10% 5%;border-radius:50%;background:repeating-radial-gradient(ellipse,transparent 0 9%,rgba(255,255,255,.85) 9% 11%),repeating-conic-gradient(from 0deg,rgba(255,255,255,.85) 0 2deg,transparent 2deg 30deg);opacity:.85}
#lotta .screen{position:absolute;pointer-events:none;z-index:4;border-radius:40% 40% 12px 12px;border:2px solid;animation:shim 2s ease-in-out infinite}
#lotta .screen.p2{right:9%;top:12%;width:30%;height:40%} #lotta .screen.p1{left:7%;top:40%;width:32%;height:50%}
#lotta .screen.reflect{background:rgba(255,150,80,.08);border-color:rgba(255,130,60,.55)}
#lotta .screen.lightscreen{background:rgba(120,200,255,.08);border-color:rgba(70,160,255,.55)}
#lotta .screen.auroraveil{background:linear-gradient(120deg,rgba(255,120,200,.2),rgba(120,220,255,.2),rgba(150,255,170,.2));border-color:rgba(180,140,255,.6)}
#lotta .screen + .screen{transform:scale(1.04)}
@keyframes shim{50%{opacity:.55}}
#lotta .wind{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(170deg,transparent 0 18px,rgba(255,255,255,.5) 18px 20px,transparent 20px 60px);animation:wind 1s linear infinite}
#lotta .wind.p1{clip-path:inset(45% 50% 0 0)} #lotta .wind.p2{clip-path:inset(0 0 50% 50%)}
@keyframes wind{to{background-position:120px 0}}

#lotta /* Meteo e campi (strati sopra tutta l'arena) */
.wfx{position:absolute;inset:0;pointer-events:none;z-index:4}
#lotta .wfx.RainDance,#lotta .wfx.PrimordialSea{background:linear-gradient(rgba(40,70,140,.18),rgba(40,70,140,.18)),repeating-linear-gradient(105deg,transparent 0 22px,rgba(220,235,255,.75) 22px 24px,transparent 24px 46px);background-size:auto,200px 200px;animation:rain .45s linear infinite}
@keyframes rain{to{background-position:0 0,-50px 200px}}
#lotta .wfx.SunnyDay,#lotta .wfx.DesolateLand{background:radial-gradient(circle at 8% 0,rgba(255,240,150,.95) 0,rgba(255,200,60,.45) 22%,transparent 55%),linear-gradient(rgba(255,170,40,.16),rgba(255,170,40,.16));animation:sun 2.4s ease-in-out infinite}
@keyframes sun{50%{opacity:.75}}
#lotta .wfx.Sandstorm{background:linear-gradient(rgba(190,140,70,.32),rgba(190,140,70,.32)),radial-gradient(circle,rgba(120,80,30,.55) 0 1.5px,transparent 2px);background-size:auto,26px 18px;animation:sand .6s linear infinite}
@keyframes sand{to{background-position:0 0,-52px 18px}}
#lotta .wfx.Snowscape,#lotta .wfx.Hail{background:linear-gradient(rgba(220,235,255,.22),rgba(220,235,255,.22)),radial-gradient(circle,#fff 0 2.5px,transparent 3px),radial-gradient(circle,#fff 0 1.5px,transparent 2px);background-size:auto,60px 60px,34px 34px;animation:snow 3s linear infinite}
@keyframes snow{to{background-position:0 0,20px 60px,-10px 68px}}
#lotta .wfx.DeltaStream{background:repeating-linear-gradient(175deg,transparent 0 30px,rgba(255,255,255,.4) 30px 33px,transparent 33px 80px);animation:wind .8s linear infinite}
#lotta .tfx{position:absolute;left:0;right:0;top:42%;bottom:0;pointer-events:none;z-index:2;animation:shim 2.6s ease-in-out infinite}
#lotta .tfx.electricterrain{background:linear-gradient(rgba(255,215,0,.5),rgba(255,215,0,.5)),repeating-linear-gradient(60deg,transparent 0 30px,rgba(255,255,170,.7) 30px 32px,transparent 32px 70px)}
#lotta .tfx.grassyterrain{background:linear-gradient(rgba(20,150,50,.45),rgba(20,150,50,.45)),radial-gradient(circle,rgba(255,255,255,.6) 0 2px,transparent 3px);background-size:auto,28px 22px}
#lotta .tfx.mistyterrain{background:linear-gradient(rgba(255,130,200,.5),rgba(255,180,225,.4))}
#lotta .tfx.psychicterrain{background:linear-gradient(rgba(180,60,220,.45),rgba(180,60,220,.45)),repeating-radial-gradient(circle at 50% 120%,transparent 0 24px,rgba(255,170,255,.35) 24px 27px)}
#lotta .rfx{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-conic-gradient(rgba(120,60,200,.16) 0 25%,transparent 0 50%);background-size:48px 48px;animation:shim 1.6s ease-in-out infinite}
#lotta .orb{position:absolute;z-index:7;width:5%;aspect-ratio:1;border-radius:50%;border:2px solid #fff;box-shadow:0 0 14px 4px var(--c);background:var(--c);transform:translate(-50%,-50%);transition:left .38s ease-in,top .38s ease-in,opacity .2s}
#lotta .ring{position:absolute;z-index:7;width:12%;aspect-ratio:1;border-radius:50%;border:4px solid var(--c);transform:translate(-50%,-50%);animation:ring .6s ease-out forwards}
@keyframes ring{from{opacity:1;transform:translate(-50%,-50%) scale(.3)}to{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
#lotta .wlabel{position:absolute;left:50%;top:2%;transform:translateX(-50%);z-index:7;display:flex;gap:4px}
#lotta .wlabel span{font:800 11px 'Inter',sans-serif;background:rgba(255,255,255,.88);border:2px solid var(--line);border-radius:99px;padding:0 8px;white-space:nowrap}

#lotta /* Messaggi e comandi */
.lt-msg{min-height:72px;font:700 clamp(15px,2.8vw,19px)/1.4 'Inter',sans-serif;background:#fff;border:4px solid var(--line);border-radius:14px;box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 6px #E3350D,0 5px 0 var(--line);padding:16px 20px}
#lotta .who{font:800 13px 'Inter',sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:3px 12px;border-radius:99px;color:#fff;align-self:flex-start;border:2px solid var(--line)}
#lotta .who.p1{background:var(--p1)} #lotta .who.p2{background:var(--p2)}
#lotta .ctrl{display:flex;flex-direction:column;gap:10px}
#lotta .moves{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#lotta .mv{font:inherit;text-align:left;cursor:pointer;border:3px solid var(--line);border-radius:12px;padding:7px 12px 8px;box-shadow:0 4px 0 var(--line);color:#fff;display:flex;flex-direction:column;gap:1px;text-shadow:0 1px 0 rgba(0,0,0,.35);position:relative}
#lotta .mv b{font-size:16px;padding-right:86px} #lotta .mv span{font-size:12px;opacity:.95}
#lotta .mv:active{transform:translateY(3px);box-shadow:0 1px 0 var(--line)}
#lotta .mv:disabled{filter:grayscale(1);opacity:.5;cursor:not-allowed}
#lotta .eff{position:absolute;right:6px;top:6px;font:900 10px 'Inter',sans-serif;text-shadow:none;border-radius:6px;padding:2px 6px;border:2px solid var(--line);background:#fff;color:var(--ink);letter-spacing:.02em}
#lotta .eff.x4{background:#C21F1F;color:#fff}#lotta .eff.x2{background:#2E8B3E;color:#fff}#lotta .eff.x05{background:#F2C21B}#lotta .eff.x025{background:#E8A317}#lotta .eff.x0{background:#45505F;color:#fff}
#lotta .lt-team{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
#lotta .tm{font:inherit;background:#fff;border:3px solid var(--line);border-radius:10px;padding:4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;box-shadow:0 3px 0 var(--line)}
#lotta .tm img{height:44px;max-width:100%;object-fit:contain}
#lotta .tm small{font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
#lotta .tm .mini{width:100%;height:5px;background:#45505F;border-radius:99px;overflow:hidden}#lotta .tm .mini i{display:block;height:100%;background:#3FC864}
#lotta .tm:disabled{opacity:.45;cursor:not-allowed} #lotta .tm.act{background:#FFF6D1}
#lotta .lt-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
#lotta .lt-muted{color:var(--muted);font-size:13px}
#lotta .lt-err{color:#C21F1F;font-weight:700}
#lotta details.lt-log{font-size:13px}
#lotta details.lt-log div{max-height:220px;overflow:auto;white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:12px;background:#FBF8EF;border-radius:8px;padding:8px;margin-top:6px}
#lotta .pass{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:18px}
#lotta .end{font-family:'Luckiest Guy','Arial Black',sans-serif;font-size:30px;color:#FFCB05;-webkit-text-stroke:2px #2A6BC0;paint-order:stroke fill;text-align:center}

#lotta /* Schede informative (mouse sopra o pressione lunga) */
.lt-tip{position:fixed;z-index:50;max-width:min(330px,92vw);background:#FFFBEA;border:3px solid var(--line);border-radius:12px;box-shadow:0 5px 0 var(--line);padding:10px 12px;font-size:13px;line-height:1.4;pointer-events:none}
#lotta .lt-tip h4{margin:0 0 4px;font-size:16px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#lotta .lt-tip .tc{font:800 10px 'Inter',sans-serif;color:#fff;border-radius:5px;padding:1px 6px;text-shadow:0 1px 0 rgba(0,0,0,.3)}
#lotta .lt-tip dl{display:grid;grid-template-columns:auto 1fr;gap:1px 8px;margin:4px 0}
#lotta .lt-tip dt{font-weight:800;color:var(--muted)} #lotta .lt-tip dd{margin:0}
#lotta .lt-tip ul{margin:4px 0 0;padding-left:16px} #lotta .lt-tip .desc{margin-top:6px;border-top:2px dashed #E3D9B8;padding-top:6px}
#lotta .lt-tip .plus{color:#2E8B3E;font-weight:800}#lotta .lt-tip .minus{color:#C21F1F;font-weight:800}
@media (prefers-reduced-motion:reduce){#lotta .wfx,#lotta .tfx,#lotta .rfx,#lotta .rock,#lotta .wind,#lotta .screen{animation:none!important}}`;
const {BattleStreams, Teams, Dex} = PkmnSim;
const TYPE_COLORS={Normal:'#A8A77A',Fire:'#EE8130',Water:'#6390F0',Electric:'#D9B300',Grass:'#5FAE34',Ice:'#4FB8C9',Fighting:'#C22E28',
  Poison:'#A33EA1',Ground:'#C9A23E',Flying:'#8A6FE0',Psychic:'#F95587',Bug:'#8FA015',Rock:'#A8922A',Ghost:'#735797',Dragon:'#6F35FC',
  Dark:'#705746',Steel:'#8E8EAE',Fairy:'#D46AA0',Stellar:'#3A8FB7','???':'#68A090'};
const TIPI={Normal:'Normale',Fire:'Fuoco',Water:'Acqua',Electric:'Elettro',Grass:'Erba',Ice:'Ghiaccio',Fighting:'Lotta',Poison:'Veleno',Ground:'Terra',
  Flying:'Volo',Psychic:'Psico',Bug:'Coleottero',Rock:'Roccia',Ghost:'Spettro',Dragon:'Drago',Dark:'Buio',Steel:'Acciaio',Fairy:'Folletto',Stellar:'Astrale'};
const STAT={hp:'PS',atk:'Attacco',def:'Difesa',spa:'Att. Sp.',spd:'Dif. Sp.',spe:'Velocità',accuracy:'Precisione',evasion:'Elusione'};
const STATUS={brn:'è scottato',par:'è paralizzato e potrebbe non muoversi',slp:'si è addormentato',psn:'è avvelenato',tox:'è gravemente avvelenato',frz:'è congelato'};
const WEATHER={RainDance:'Pioggia',SunnyDay:'Sole intenso',Sandstorm:'Tempesta di sabbia',Snowscape:'Neve',Hail:'Grandine',DesolateLand:'Sole estremo',PrimordialSea:'Diluvio',DeltaStream:'Correnti misteriose'};
const WSTART={RainDance:'Inizia a piovere!',SunnyDay:'La luce del sole è intensa!',Sandstorm:'Si alza una tempesta di sabbia!',Snowscape:'Inizia a nevicare!',Hail:'Inizia a grandinare!',DesolateLand:'Il sole è diventato rovente!',PrimordialSea:'Inizia un diluvio!',DeltaStream:'Soffiano correnti misteriose!'};
const CAT={Physical:'Fisica',Special:'Speciale',Status:'Stato'};
const EVN={hp:'PS',atk:'Att',def:'Dif',spa:'AtSp',spd:'DfSp',spe:'Vel'};
const CAUSE={psn:'il veleno',tox:'il veleno',brn:'la scottatura','Stealth Rock':'le rocce aguzze',Spikes:'le punte',Sandstorm:'la tempesta di sabbia',Hail:'la grandine',Recoil:'il contraccolpo',confusion:'la confusione'};
const SIDECOND={stealthrock:['Rocce aguzze','Rocce aguzze fluttuano intorno alla squadra di'],spikes:['Punte','Punte sparse sotto la squadra di'],toxicspikes:['Fielepunte','Punte velenose sparse sotto la squadra di'],
  stickyweb:['Rete vischiosa','Una rete vischiosa è tesa sotto la squadra di'],reflect:['Riflesso','Riflesso protegge la squadra di'],lightscreen:['Schermoluce','Schermoluce protegge la squadra di'],
  auroraveil:['Velo Aurora','Velo Aurora protegge la squadra di'],tailwind:['Vento in coda','Il vento in coda soffia alle spalle di'],safeguard:['Salvaguardia','Salvaguardia protegge la squadra di'],mist:['Nebbia','La nebbia avvolge la squadra di']};
const CENTER={p1:[23,72],p2:[76,32]};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toID=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const other=s=>s==='p1'?'p2':'p1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SPR=()=>typeof SPRITE_DATA!=='undefined'?SPRITE_DATA:{};

let root=null, O=null, B=null, gen=0;
const $=id=>root.querySelector('#lt-'+id);
function PN(s){ return esc(O.names[s]); }

// ---------- sprite e icone ----------
function spritePath(name){ const sp=Dex.species.get(name), S=SPR(); for(const k of [sp.name,sp.baseSpecies]) if(S[k]) return S[k]; return null; }
function spriteImg(name,back,shiny){ let p=spritePath(name); if(!p) return `<b>${esc(name)}</b>`;
  if(shiny) p=p.replace(/^sprites\/(ani|gen5)\//,'sprites/$1-shiny/');
  if(!back) return `<img src="${esc(p)}" alt="${esc(name)}">`;
  const bp=p.replace(/^sprites\/(ani|gen5)(-shiny)?\//,(x,d,s)=>'sprites/'+d+'-back'+(s||'')+'/');
  return `<img src="${esc(bp)}" alt="${esc(name)}" data-front="${esc(p)}">`; }
const icon=item=>{ const it=Dex.items.get(item); if(!it.exists) return ''; const n=it.spritenum||0; return `<span class="ico" style="background-position:-${(n%16)*24}px -${Math.floor(n/16)*24}px"></span>`; };

// ---------- chi può vedere cosa ----------
// Il set completo (mosse, strumento, natura, EV) di un lato si vede se le squadre sono note (showOpp), oppure se è il lato
// di chi sta scegliendo (contro il computer: sempre il giocatore 1).
function viewer(){ return O.mode==='cpu'?'p1':(B.passTo||null); }
function setVisible(s){ return O.showOpp||viewer()===s; }
function exactHP(s){ return O.mode==='cpu'?s==='p1':O.showOpp; }

// ---------- stato ----------
function fresh(){ return {streams:null, nreq:0, req:{p1:null,p2:null}, answered:{p1:null,p2:null}, queue:[], busy:false, over:false, log:[],
  sets:{p1:[],p2:[]}, side:{p1:{act:null,team:{}},p2:{act:null,team:{}}}, cond:{p1:{},p2:{}}, weather:null, field:{}, err:'', passTo:null}; }
function parseId(s){ const m=/^(p[12])[a-z]?: (.*)$/.exec(s||''); return m?{side:m[1],nick:m[2]}:null; }
function parseHP(c){ if(!c) return null; const [hp,st]=c.split(' '); if(hp==='0') return {hp:0,max:0,st:'fnt'}; const [a,b]=hp.split('/').map(Number); return {hp:a,max:b||100,st:st||''}; }
function setOf(sid,species){ const sp=Dex.species.get(species); return B.sets[sid].find(s=>{ const x=Dex.species.get(s.species); return x.name===sp.name||x.baseSpecies===sp.baseSpecies; }); }
function mon(sid,nick){ const s=B.side[sid]; if(!s.team[nick]){ const set=B.sets[sid].find(x=>x.name===nick||Dex.species.get(x.species).baseSpecies===nick||x.species===nick)||{};
    s.team[nick]={nick,species:set.species||nick,hp:1,max:1,shown:1,st:'',boosts:{},item:set.item||null,itemSeen:false,shiny:set.shiny}; } return s.team[nick]; }
const label=id=>{ const p=parseId(id); if(!p) return id; const m=mon(p.side,p.nick); return esc(m.species)+(p.side==='p2'?' di '+PN('p2'):''); };

// ---------- disegno ----------
function boostChips(m){ return Object.entries(m.boosts).filter(([,v])=>v).map(([k,v])=>`<span class="bchip ${v>0?'up':'down'}">${STAT[k]||k} ${v>0?'+':''}${v}</span>`).join(''); }
function hpView(sid){ const m=B.side[sid].act&&B.side[sid].team[B.side[sid].act]; if(!m) return;
  const f=$('fill'+sid), n=$('num'+sid); if(!f) return; const pct=m.max?Math.max(0,m.shown/m.max*100):0;
  f.style.width=pct+'%'; f.className='fill '+(pct<=20?'low':pct<=50?'mid':'');
  n.textContent=exactHP(sid)?`${Math.max(0,Math.round(m.shown))} / ${m.max}`:`${Math.ceil(pct)}%`; }
function drawSide(sid){
  const s=B.side[sid], m=s.act?s.team[s.act]:null, hud=$('hud'+sid), el=$('mon'+sid);
  if(!m){ hud.hidden=true; return; }
  hud.hidden=false;
  const seeItem=setVisible(sid)||m.itemSeen;
  hud.innerHTML=`<div class="hudcol"><div class="hpbox" data-tip="act:${sid}"><div class="nm"><span>${esc(m.species)}${m.shiny?' ✨':''}${m.st&&m.st!=='fnt'?`<span class="st ${m.st}">${m.st.toUpperCase()}</span>`:''}${m.tera?`<span class="st" style="background:${TYPE_COLORS[m.tera]||'#666'}">TERA</span>`:''}</span><small>Lv100</small></div>
    <div class="bar">PS<div class="tr"><div class="fill" id="lt-fill${sid}"></div></div></div><div class="hpnum" id="lt-num${sid}"></div></div>
    <div class="boostwin">${boostChips(m)}</div></div>
    <button class="itemc${seeItem&&!m.item?' none':''}" data-tip="item:${sid}" aria-label="Strumento">${seeItem?(m.item?icon(m.item):''):'<b>?</b>'}</button>`;
  hpView(sid);
  const key=m.species+(m.shiny?'*':'');
  if(el.dataset.sp!==key){ el.dataset.sp=key; el.innerHTML=spriteImg(m.species,sid==='p1',m.shiny);
    const im=el.querySelector('img[data-front]'); if(im) im.onerror=()=>{ if(im.dataset.front){ im.src=im.dataset.front; im.dataset.front=''; im.classList.add('flip'); } }; }
  el.classList.toggle('sub',!!m.sub);
  $('balls'+sid).innerHTML=B.sets[sid].map((set,i)=>{ const t=Object.values(s.team).find(x=>setOf(sid,x.species)===set);
    const ko=!!t&&t.st==='fnt'; const cls=ko?'ko':(t&&t.st&&t.st!=='fnt'?'st':'');
    return `<button class="${cls}" ${setVisible(sid)?`data-tip="set:${sid}:${i}"`:''} aria-label="Pokémon ${i+1}"></button>`; }).join('');
}
function drawField(){
  for(const sid of ['p1','p2']){ const c=B.cond[sid]; let h='';
    if(c.stealthrock) h+=[[8,10],[30,-20],[55,5],[78,-15]].map(([x,y],i)=>`<i class="rock" style="left:${x}%;top:${y}%;animation-delay:${i*.3}s"></i>`).join('');
    for(let l=0;l<(c.spikes||0);l++) h+=[15,45,75].map(x=>`<i class="spike" style="left:${x+l*6}%;top:${40+l*14}%"></i>`).join('');
    for(let l=0;l<(c.toxicspikes||0);l++) h+=[25,55].map(x=>`<i class="spike tox" style="left:${x+l*8}%;top:${55-l*14}%"></i>`).join('');
    if(c.stickyweb) h+='<i class="web"></i>';
    $('haz'+sid).innerHTML=h;
    $('scr'+sid).innerHTML=['reflect','lightscreen','auroraveil'].filter(k=>c[k]).map(k=>`<div class="screen ${sid} ${k}"></div>`).join('')+(c.tailwind?`<div class="wind ${sid}"></div>`:'');
  }
  const w=$('wfx'); w.hidden=!B.weather; w.className='wfx '+(B.weather||'');
  const terr=Object.keys(B.field).find(k=>k.endsWith('terrain')); const tf=$('tfx'); tf.hidden=!terr; tf.className='tfx '+(terr||'');
  $('rfx').hidden=!B.field.trickroom;
  const lab=[]; if(B.weather) lab.push(WEATHER[B.weather]||B.weather); for(const k in B.field) lab.push(B.field[k]);
  $('wlabel').innerHTML=lab.map(x=>`<span>${esc(x)}</span>`).join('');
}
function draw(){ drawSide('p1'); drawSide('p2'); drawField(); }
function say(html){ $('msg').innerHTML=html; const d=document.createElement('div'); d.innerHTML=html; B.log.push(d.textContent); $('log').textContent=B.log.join('\n'); }
function cls(sid,c,ms){ const el=$('mon'+sid); el.classList.remove(c); void el.offsetWidth; el.classList.add(c); if(ms) setTimeout(()=>el.classList.remove(c),ms); }
function pop(sid,text,kind){ const d=document.createElement('div'); d.className='pop '+kind; d.textContent=text;
  d.style.left=CENTER[sid][0]+'%'; d.style.top=(CENTER[sid][1]-18)+'%'; $('arena').appendChild(d); setTimeout(()=>d.remove(),1400); }
async function shot(from,to,color,status){ const a=$('arena');
  if(status||from===to){ const r=document.createElement('div'); r.className='ring'; r.style.setProperty('--c',color); r.style.left=CENTER[to][0]+'%'; r.style.top=CENTER[to][1]+'%'; a.appendChild(r); setTimeout(()=>r.remove(),700); return; }
  const o=document.createElement('div'); o.className='orb'; o.style.setProperty('--c',color); o.style.left=CENTER[from][0]+'%'; o.style.top=CENTER[from][1]+'%'; a.appendChild(o);
  await sleep(20); o.style.left=CENTER[to][0]+'%'; o.style.top=CENTER[to][1]+'%'; await sleep(400); o.style.opacity=0; setTimeout(()=>o.remove(),250); }
// La barra scende (o sale) un PS alla volta: la durata dipende da quanti PS cambiano
function animHP(sid,m,to){ return new Promise(res=>{ const from=m.shown, d=Math.abs(to-from);
  if(!d||!m.max){ m.shown=to; hpView(sid); return res(); }
  const dur=Math.min(2200,Math.max(350,d/m.max*2400)), t0=performance.now();
  const step=now=>{ if(!root) return res(); const k=Math.min(1,(now-t0)/dur); m.shown=from+(to-from)*k; if(B.side[sid].team[B.side[sid].act]===m) hpView(sid); if(k<1) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step); }); }

// ---------- messaggi del motore ----------
const fromOf=p=>{ const f=p.find(x=>x&&x.startsWith('[from]')); return f?f.slice(7).replace(/^(item|ability|move): /,''):''; };
async function handle(line){
  const p=line.split('|'); const k=p[1]; const sideOf=id=>(parseId(id)||{}).side;
  switch(k){
    case 'switch': case 'drag': case 'replace': {
      const id=parseId(p[2]); const species=p[3].split(',')[0]; const m=mon(id.side,id.nick); m.species=species; m.shiny=p[3].includes('shiny');
      const h=parseHP(p[4]); if(h){ m.hp=h.hp; m.max=h.max||m.max; m.shown=h.hp; m.st=h.st; } m.boosts={}; m.sub=false;
      const s=B.side[id.side]; const el=$('mon'+id.side);
      if(s.act&&s.act!==id.nick){ el.classList.add('out'); await sleep(350); }
      s.act=id.nick; el.classList.remove('faint'); el.dataset.sp=''; draw(); el.classList.add('out'); void el.offsetWidth; el.classList.remove('out');
      say(`${PN(id.side)} manda in campo <b>${esc(species)}</b>!`); return 900; }
    case 'detailschange': case '-formechange': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.species=p[3].split(',')[0]; $('mon'+id.side).dataset.sp=''; draw(); say(`${label(p[2])} cambia forma!`); return 900; }
    case 'move': { const a=sideOf(p[2]), tg=sideOf(p[4])||a; const mv=Dex.moves.get(p[3]); cls(a,'lunge',450);
      say(`${label(p[2])} usa <b>${esc(p[3])}</b>!`); if(!p.includes('[still]')&&!p.some(x=>x&&x.startsWith('[miss]'))) shot(a,tg,TYPE_COLORS[mv.type]||'#999',mv.category==='Status'); return 950; }
    case '-damage': case '-heal': case '-sethp': {
      const id=parseId(p[2]); const m=mon(id.side,id.nick); const h=parseHP(p[3]); if(!h) return 0;
      const to=h.hp; if(h.max) m.max=h.max; const was=m.shown; if(h.st!=='fnt') m.st=h.st;
      const f=fromOf(p); const fi=f&&Dex.items.get(f); if(fi&&fi.exists){ m.item=fi.name; m.itemSeen=true; }
      if(k==='-damage'&&to<was) cls(id.side,'hit',500);
      if(k==='-heal'&&to>was) pop(id.side,'+'+Math.round(exactHP(id.side)?to-was:(to-was)/m.max*100)+(exactHP(id.side)?' PS':'%'),'heal');
      const anim=animHP(id.side,m,to); m.hp=to;
      if(k==='-heal') say(`${label(p[2])} recupera PS${f?' ('+esc(f)+')':''}.`);
      else if(f) say(`${label(p[2])} subisce danni per ${esc(CAUSE[f]||f)}.`);
      await anim; return k==='-damage'&&!f?150:500; }
    case 'faint': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.hp=0; m.st='fnt'; $('mon'+id.side).classList.add('faint'); say(`${label(p[2])} è esausto!`); await sleep(900); drawSide(id.side); return 300; }
    case '-supereffective': say('È superefficace!'); return 750;
    case '-resisted': say('Non è molto efficace…'); return 750;
    case '-immune': say(`Non ha effetto su ${label(p[2])}…`); return 800;
    case '-crit': say('Brutto colpo!'); return 700;
    case '-miss': say(`${label(p[2])} manca il bersaglio!`); return 800;
    case '-fail': say('Ma non ha effetto!'); return 700;
    case '-status': { const id=parseId(p[2]); mon(id.side,id.nick).st=p[3]; drawSide(id.side); say(`${label(p[2])} ${STATUS[p[3]]||esc(p[3])}!`); return 900; }
    case '-curestatus': { const id=parseId(p[2]); if(id){ mon(id.side,id.nick).st=''; drawSide(id.side); say(`${label(p[2])} è guarito.`); return 700; } return 0; }
    case 'cant': { const r={par:'è paralizzato! Non riesce a muoversi!',slp:'dorme profondamente.',frz:'è congelato!',flinch:'tentenna e non attacca!',recharge:'deve riprendersi.'}[p[3]]||'non può muoversi.'; say(`${label(p[2])} ${r}`); return 900; }
    case '-boost': case '-unboost': { const id=parseId(p[2]); const m=mon(id.side,id.nick); const n=+p[4]*(k==='-boost'?1:-1);
      m.boosts[p[3]]=Math.max(-6,Math.min(6,(m.boosts[p[3]]||0)+n)); drawSide(id.side);
      if(n) pop(id.side,`${STAT[p[3]]||p[3]} ${n>0?'↑'.repeat(Math.min(3,n)):'↓'.repeat(Math.min(3,-n))}`,n>0?'up':'down');
      const q=Math.abs(n)>=3?' tantissimo':Math.abs(n)===2?' molto':''; say(n?`${STAT[p[3]]||esc(p[3])} di ${label(p[2])} ${n>0?'aumenta':'diminuisce'}${q}!`:`${STAT[p[3]]||esc(p[3])} di ${label(p[2])} non può cambiare oltre!`); return 900; }
    case '-setboost': { const id=parseId(p[2]); mon(id.side,id.nick).boosts[p[3]]=+p[4]; drawSide(id.side); pop(id.side,`${STAT[p[3]]||p[3]} al massimo!`,'up'); return 800; }
    case '-clearallboost': for(const s of ['p1','p2']) for(const m of Object.values(B.side[s].team)) m.boosts={}; draw(); say('Tutte le modifiche alle statistiche spariscono!'); return 700;
    case '-clearboost': case '-clearnegativeboost': { const id=parseId(p[2]); if(id){ const m=mon(id.side,id.nick); if(k==='-clearboost') m.boosts={}; else for(const s in m.boosts) if(m.boosts[s]<0) m.boosts[s]=0; drawSide(id.side); } return 0; }
    case '-weather': { if(p[2]==='none'){ const was=B.weather; B.weather=null; drawField(); if(was){ say('Il tempo torna normale.'); return 700; } return 0; }
      if(p.includes('[upkeep]')) return 0; B.weather=p[2]; drawField(); say(WSTART[p[2]]||esc(p[2])); return 1000; }
    case '-fieldstart': { const n=p[2].replace('move: ',''); B.field[toID(n)]=n; drawField(); say(`${esc(n)}!`); return 900; }
    case '-fieldend': { const n=p[2].replace('move: ',''); delete B.field[toID(n)]; drawField(); say(`${esc(n)} svanisce.`); return 700; }
    case '-sidestart': case '-sideend': { const sid=p[2].slice(0,2); const n=p[3].replace('move: ',''); const id=toID(n); const c=B.cond[sid];
      if(k==='-sidestart'){ c[id]=(id==='spikes'||id==='toxicspikes')?Math.min(id==='spikes'?3:2,(c[id]||0)+1):1; drawField(); say(SIDECOND[id]?`${SIDECOND[id][1]} ${PN(sid)}!`:`${esc(n)}: ${PN(sid)}.`); return 1000; }
      delete c[id]; drawField(); say(`${SIDECOND[id]?SIDECOND[id][0]:esc(n)} sparisce dalla parte di ${PN(sid)}.`); return 700; }
    case '-terastallize': { const id=parseId(p[2]); mon(id.side,id.nick).tera=p[3]; drawSide(id.side); shot(id.side,id.side,TYPE_COLORS[p[3]]||'#fff',true); say(`${label(p[2])} si teracristallizza: tipo ${TIPI[p[3]]||esc(p[3])}!`); return 1100; }
    case '-ability': say(`[Abilità di ${label(p[2])}: ${esc(p[3])}]`); return 800;
    case '-item': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.item=p[3]; m.itemSeen=true; drawSide(id.side); say(`${label(p[2])} ottiene ${esc(p[3])}.`); return 800; }
    case '-enditem': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.item=null; m.itemSeen=true; drawSide(id.side); say(p.some(x=>x&&x.startsWith('[eat]'))?`${label(p[2])} mangia ${esc(p[3])}!`:`${label(p[2])} perde ${esc(p[3])}.`); return 800; }
    case '-start': { const id=parseId(p[2]); const n=p[3].replace('move: ','');
      if(n==='Substitute'){ mon(id.side,id.nick).sub=true; drawSide(id.side); say(`${label(p[2])} crea un sostituto!`); return 900; }
      if(n==='confusion'){ say(`${label(p[2])} è confuso!`); return 800; }
      say(`${label(p[2])}: ${esc(n)}.`); return 700; }
    case '-end': { const id=parseId(p[2]); const n=p[3].replace('move: ',''); if(n==='Substitute'){ mon(id.side,id.nick).sub=false; drawSide(id.side); say(`Il sostituto di ${label(p[2])} svanisce!`); return 800; } return 0; }
    case '-activate': { const n=(p[3]||'').replace('move: ',''); if(n==='Protect'||n==='Detect'){ say(`${label(p[2])} si protegge!`); return 800; } if(n==='Substitute'){ say('Il sostituto incassa il colpo!'); return 800; } return 0; }
    case '-singleturn': { const n=(p[3]||'').replace('move: ',''); if(n==='Protect'||n==='Detect'){ say(`${label(p[2])} si protegge!`); return 800; } return 0; }
    case '-mega': say(`${label(p[2])} megaevolve!`); return 1000;
    case 'turn': say(`— Turno ${esc(p[2])} —`); return 350;
    case 'win': B.over=true; say(`Vince ${esc(p[2])}!`); return 0;
    case 'tie': B.over=true; say('Pareggio!'); return 0;
  }
  return 0;
}
async function pump(){
  if(B.busy) return; B.busy=true; const g=gen; $('ctrl').innerHTML='<p class="lt-muted">…</p>';
  while(B.queue.length){ const line=B.queue.shift(); let ms=0; try{ ms=await handle(line); }catch(e){ console.error(e,line); } if(g!==gen) return; if(ms) await sleep(ms); if(g!==gen) return; }
  B.busy=false; prompt();
}

// ---------- efficacia delle mosse sul Pokémon avversario in campo ----------
function effOf(moveId,sid){
  const mv=Dex.moves.get(moveId); if(mv.category==='Status') return null;
  const o=B.side[other(sid)], m=o.act&&o.team[o.act]; if(!m) return null;
  const types=m.tera&&m.tera!=='Stellar'?[m.tera]:Dex.species.get(m.species).types;
  if(!Dex.getImmunity(mv.type,types)) return ['x0','Nessun effetto'];
  const e=Dex.getEffectiveness(mv.type,types);
  return e>=2?['x4','Iper efficace ×4']:e===1?['x2','Superefficace ×2']:e===-1?['x05','Poco efficace ×½']:e<=-2?['x025','Per niente efficace ×¼']:null;
}

// ---------- scelte ----------
function need(sid){ const r=B.req[sid]; return r&&!r.wait&&B.answered[sid]!==r.rqid; }
function send(sid,choice){ B.answered[sid]=B.req[sid].rqid; B.err=''; B.streams[sid].write(choice); $('ctrl').innerHTML='<p class="lt-muted">…</p>'; hideTip(); setTimeout(prompt,30); }
function cpuChoice(r){
  if(r.teamPreview) return 'team 1';
  const sw=r.side.pokemon.map((m,i)=>({m,i})).filter(x=>!x.m.active&&!x.m.condition.endsWith(' fnt'));
  if(r.forceSwitch) return sw.length?'switch '+(sw[Math.random()*sw.length|0].i+1):'pass';
  const mv=r.active[0].moves.map((m,i)=>({m,i})).filter(x=>!x.m.disabled&&(x.m.pp===undefined||x.m.pp>0));
  return mv.length?'move '+(mv[Math.random()*mv.length|0].i+1):'move 1';
}
function prompt(){
  if(!root||B.busy||B.queue.length) return;
  if(B.over){ $('ctrl').innerHTML=`<div class="end">${$('msg').innerHTML}</div><div class="lt-row" style="justify-content:center">${O.onNew?'<button class="btn" data-lt="new">Nuova lotta</button>':''}<button class="btn ghost" data-lt="close">${esc(O.closeLabel||'Chiudi la lotta')}</button></div>`; return; }
  if(O.mode==='cpu'&&need('p2')){ send('p2',cpuChoice(B.req.p2)); return; }
  const sid=need('p1')?'p1':(O.mode==='two'&&need('p2')?'p2':null);
  if(!sid){ $('ctrl').innerHTML=`<p class="lt-muted">In attesa…</p>`; return; }
  if(O.mode==='two'&&B.passTo!==sid){ B.passTo=null; draw();
    $('ctrl').innerHTML=`<div class="pass"><span class="who ${sid}">${PN(sid)}</span><p>Tocca a <b>${PN(sid)}</b> scegliere. Passa il dispositivo e premi il pulsante${O.showOpp?'':' (l\'altro non guardi: vedrai mosse e strumenti della tua squadra)'}.</p><button class="btn ${sid==='p2'?'play2':''}" data-lt="iam" data-s="${sid}">Sono ${PN(sid)}</button></div>`; return; }
  ui(sid);
}
function ui(sid){
  const r=B.req[sid], c=$('ctrl'); if(O.mode==='two') { B.passTo=sid; draw(); }
  const team=r.side.pokemon;
  const tm=(m,i,act)=>{ const h=parseHP(m.condition); const sp=m.details.split(',')[0]; const p=spritePath(sp); const ko=h.st==='fnt';
    return `<button class="tm${m.active?' act':''}" data-tip="req:${sid}:${i}" ${act&&!ko&&!m.active?`data-lt="pick" data-c="${act} ${i+1}"`:'disabled'}>${p?`<img src="${esc(p)}" alt="">`:''}<small>${esc(sp)}</small><span class="mini"><i style="width:${ko?0:Math.round(h.hp/h.max*100)}%"></i></span></button>`; };
  let h=`<span class="who ${sid}">${PN(sid)}</span>`;
  if(B.err) h+=`<p class="lt-err">Scelta non valida, riprova.</p>`;
  if(r.teamPreview){
    h+=`<p><b>Chi mandi in campo per primo?</b></p><div class="lt-team">${team.map((m,i)=>tm(Object.assign({},m,{active:false}),i,'team')).join('')}</div>`;
  } else if(r.forceSwitch){
    h+=`<p><b>Chi mandi in campo?</b></p><div class="lt-team">${team.map((m,i)=>tm(m,i,'switch')).join('')}</div>`;
  } else {
    const a=r.active[0];
    h+=`<div class="moves">${a.moves.map((m,i)=>{ const d=Dex.moves.get(m.id); const col=TYPE_COLORS[d.type]||'#666'; const e=effOf(m.id,sid);
      return `<button class="mv" style="background:${col}" data-tip="move:${esc(m.id)}:${sid}" ${m.disabled||m.pp===0?'disabled':`data-lt="pick" data-c="move ${i+1}"`}>${e?`<span class="eff ${e[0]}">${e[1]}</span>`:''}<b>${esc(m.move)}</b><span>${TIPI[d.type]||d.type} · ${CAT[d.category]||''}${d.basePower?' '+d.basePower:''} · PP ${m.pp??'–'}/${m.maxpp??'–'}</span></button>`; }).join('')}</div>`;
    if(a.canTerastallize) h+=`<label class="lt-row" style="font-weight:700"><input type="checkbox" id="lt-tera"> Teracristallizza (tipo ${TIPI[a.canTerastallize]||esc(a.canTerastallize)})</label>`;
    h+=`<p class="lt-muted" style="margin:4px 0 0">${a.trapped?'Non puoi cambiare Pokémon.':'Oppure cambia Pokémon:'}</p><div class="lt-team">${team.map((m,i)=>tm(m,i,a.trapped?null:'switch')).join('')}</div>`;
  }
  c.innerHTML=h;
}
function pick(sid,choice){ const t=$('tera'); if(t&&t.checked&&choice.startsWith('move')) choice+=' terastallize'; if(O.mode==='two') B.passTo=null; send(sid,choice); }

// ---------- schede informative ----------
const typeChip=t=>`<span class="tc" style="background:${TYPE_COLORS[t]||'#666'}">${TIPI[t]||esc(t)}</span>`;
function monTip(sid,set,live,stats){
  const sp=Dex.species.get(live&&live.species||set.species); const types=live&&live.tera&&live.tera!=='Stellar'?[live.tera]:sp.types;
  let h=`<h4>${esc(sp.name)}${live&&live.shiny||set.shiny?' ✨':''} ${types.map(typeChip).join('')}</h4><dl>`;
  if(live&&live.max&&live.st!=='fnt') h+=`<dt>PS</dt><dd>${exactHP(sid)||viewer()===sid?`${Math.round(live.hp)} / ${live.max}`:Math.ceil(live.hp/live.max*100)+'%'}${live.st?' · '+live.st.toUpperCase():''}</dd>`;
  if(live&&live.st==='fnt') h+=`<dt>PS</dt><dd>esausto</dd>`;
  if(!setVisible(sid)){
    if(live&&live.itemSeen) h+=`<dt>Strumento</dt><dd>${live.item?esc(live.item):'nessuno'}</dd>`;
    h+=`</dl><div class="lt-muted">Squadra nascosta: mosse, strumento e statistiche si scoprono in lotta.</div>`; return h; }
  const nat=Dex.natures.get(set.nature); const evs=Object.entries(set.evs||{}).filter(([,v])=>v).map(([k,v])=>`${v} ${EVN[k]}`).join(' / ');
  const item=live?live.item:set.item; const ab=Dex.abilities.get(set.ability);
  h+=`<dt>Abilità</dt><dd>${esc(set.ability)}</dd><dt>Strumento</dt><dd>${item?esc(item):'nessuno'}</dd>`;
  if(set.nature) h+=`<dt>Natura</dt><dd>${esc(set.nature)}${nat.plus?` (<span class="plus">+${STAT[nat.plus]}</span> <span class="minus">−${STAT[nat.minus]}</span>)`:''}</dd>`;
  if(evs) h+=`<dt>EV</dt><dd>${evs}</dd>`;
  if(set.teraType) h+=`<dt>Tera</dt><dd>${typeChip(set.teraType)}</dd>`;
  if(stats) h+=`<dt>Statistiche</dt><dd>${Object.entries(stats).map(([k,v])=>`${EVN[k]} ${v}`).join(' · ')}</dd>`;
  if(live&&Object.values(live.boosts||{}).some(v=>v)) h+=`<dt>Modifiche</dt><dd>${Object.entries(live.boosts).filter(([,v])=>v).map(([k,v])=>`${STAT[k]} ${v>0?'+':''}${v}`).join(', ')}</dd>`;
  h+=`</dl><ul>${set.moves.map(mn=>{ const mv=Dex.moves.get(mn); return `<li>${typeChip(mv.type)} ${esc(mv.name)}</li>`; }).join('')}</ul>`;
  if(ab.exists&&ab.shortDesc) h+=`<div class="desc"><b>${esc(ab.name)}:</b> ${esc(ab.shortDesc)}</div>`;
  return h;
}
function moveTip(id,sid){
  const mv=Dex.moves.get(id); const e=sid?effOf(id,sid):null;
  const sec=mv.secondary&&mv.secondary.chance?`<dt>Effetto extra</dt><dd>${mv.secondary.chance}% di probabilità</dd>`:'';
  return `<h4>${esc(mv.name)} ${typeChip(mv.type)}</h4><dl><dt>Categoria</dt><dd>${CAT[mv.category]||mv.category}</dd>
   <dt>Potenza</dt><dd>${mv.basePower||'—'}</dd><dt>Precisione</dt><dd>${mv.accuracy===true?'non manca mai':mv.accuracy+'%'}</dd><dt>PP</dt><dd>${Math.floor(mv.pp*1.6)}</dd>
   ${mv.priority?`<dt>Priorità</dt><dd>${mv.priority>0?'+':''}${mv.priority}</dd>`:''}${mv.flags&&mv.flags.contact?'<dt>Contatto</dt><dd>sì</dd>':''}${sec}
   ${e?`<dt>Sul bersaglio</dt><dd>${e[1]}</dd>`:''}</dl><div class="desc">${esc(mv.desc||mv.shortDesc||'')}</div>${e?'<div class="lt-muted">L\'efficacia non tiene conto delle abilità (es. Levitate).</div>':''}`;
}
function itemTip(sid){ const s=B.side[sid], m=s.act&&s.team[s.act]; if(!m) return '';
  if(!setVisible(sid)&&!m.itemSeen) return `<h4>Strumento sconosciuto</h4><div class="lt-muted">Lo scoprirai quando entra in azione.</div>`;
  if(!m.item) return `<h4>Nessuno strumento</h4><div class="lt-muted">${esc(m.species)} non ha (più) uno strumento.</div>`;
  const it=Dex.items.get(m.item); return `<h4>${icon(m.item)} ${esc(it.name||m.item)}</h4><div class="desc">${esc(it.desc||it.shortDesc||'')}</div>`; }
function tipHTML(key){
  const [kind,a,b]=key.split(':');
  if(kind==='move') return moveTip(a,b);
  if(kind==='item') return itemTip(a);
  if(kind==='act'){ const s=B.side[a], m=s.act&&s.team[s.act]; if(!m) return ''; const set=setOf(a,m.species)||{moves:[]};
    const rq=B.req[a]&&B.req[a].side&&B.req[a].side.pokemon.find(x=>x.active); return monTip(a,set,m,setVisible(a)&&rq?rq.stats:null); }
  if(kind==='set'){ const set=B.sets[a][+b]; if(!set||!setVisible(a)) return ''; const live=Object.values(B.side[a].team).find(x=>setOf(a,x.species)===set); return monTip(a,set,live,null); }
  if(kind==='req'){ const rp=B.req[a]&&B.req[a].side.pokemon[+b]; if(!rp) return ''; const sp=rp.details.split(',')[0]; const set=setOf(a,sp)||{moves:[]};
    const live=Object.values(B.side[a].team).find(x=>setOf(a,x.species)===set); const h=parseHP(rp.condition); const it=rp.item?Dex.items.get(rp.item).name:null;
    return monTip(a,Object.assign({},set,{item:it}),Object.assign({boosts:{}},live||{},{hp:h.hp,max:h.max||(live&&live.max)||1,st:h.st,item:it,itemSeen:true}),rp.stats); }
  return '';
}
let tipEl=null, lpTimer=null, lpFired=false;
function showTip(el){ const tip=$('tip'), h=tipHTML(el.dataset.tip); if(!h) return hideTip(); tip.innerHTML=h; tip.hidden=false; tipEl=el;
  const r=el.getBoundingClientRect(), tw=tip.offsetWidth, th=tip.offsetHeight;
  let x=r.left+r.width/2-tw/2, y=r.top-th-10; if(y<8) y=r.bottom+10; x=Math.max(8,Math.min(innerWidth-tw-8,x)); y=Math.max(8,Math.min(innerHeight-th-8,y));
  tip.style.left=x+'px'; tip.style.top=y+'px'; }
function hideTip(){ if(root) $('tip').hidden=true; tipEl=null; }
function onOver(e){ if(e.pointerType==='touch') return; const el=e.target.closest('#lotta [data-tip]'); if(el&&el!==tipEl) showTip(el); else if(!el) hideTip(); }
function onDown(e){ if(e.pointerType!=='touch') return; const el=e.target.closest('#lotta [data-tip]'); hideTip(); lpFired=false; clearTimeout(lpTimer);
  if(el) lpTimer=setTimeout(()=>{ lpFired=true; showTip(el); },450); }
function onUp(e){ if(e.pointerType==='touch'&&(e.type!=='pointermove'||Math.abs(e.movementX)+Math.abs(e.movementY)>6)) clearTimeout(lpTimer); }
function onClickCapture(e){ if(lpFired){ e.preventDefault(); e.stopPropagation(); lpFired=false; } }   // la pressione lunga non sceglie la mossa
function onMenu(e){ if(e.target.closest('#lotta [data-tip]')) e.preventDefault(); }
function onClick(e){ const b=e.target.closest('[data-lt]'); if(!b||!root.contains(b)) return; const a=b.dataset.lt;
  if(a==='pick'){ const sid=O.mode==='cpu'?'p1':B.passTo; if(sid&&need(sid)) pick(sid,b.dataset.c); }
  else if(a==='iam'){ B.passTo=b.dataset.s; prompt(); }
  else if(a==='new'){ const f=O.onNew; close(true); f&&f(); }
  else if(a==='close') close();
  else if(a==='exit'){ if(b.dataset.sure){ close(); } else { b.dataset.sure='1'; b.textContent='Sicuro? Premi di nuovo'; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent='Esci dalla lotta'; } },3000); } }
}
const EVTS=[['pointerover',onOver],['pointerdown',onDown],['pointerup',onUp],['pointercancel',onUp],['pointermove',onUp],['contextmenu',onMenu]];

// ---------- apertura e chiusura ----------
async function readSide(g,sid,stream){
  for await(const chunk of stream){ if(g!==gen) return;
    for(const line of chunk.split('\n')){
      if(line.startsWith('|request|')){ const r=JSON.parse(line.slice(9)); r.rqid=++B.nreq; B.req[sid]=r;
        if(r.side) for(const rp of r.side.pokemon){ const nick=rp.ident.split(': ')[1]; const m=B.side[sid].team[nick]; if(m) m.item=rp.item?Dex.items.get(rp.item).name:null; }
        setTimeout(prompt,0); }
      else if(line.startsWith('|error|')){ B.err=line; B.answered[sid]=null; setTimeout(prompt,0); }
    } }
}
async function readLog(g,stream){
  for await(const chunk of stream){ if(g!==gen) return; for(const line of chunk.split('\n')) if(line.startsWith('|')) B.queue.push(line); pump(); }
}
function close(silent){
  gen++; if(B&&B.streams) try{ B.streams.omniscient.writeEnd(); }catch(e){}
  for(const [ev,fn] of EVTS) document.removeEventListener(ev,fn); document.removeEventListener('click',onClickCapture,true); removeEventListener('scroll',hideTip);
  if(root) root.remove(); root=null; document.documentElement.style.overflow='';
  const f=O&&O.onClose; O=null; B=null; if(!silent&&f) f();
}
function open(opts){
  if(root) close(true);
  O=Object.assign({mode:'two',showOpp:true,names:{p1:'Giocatore 1',p2:'Giocatore 2'},formatid:'gen9nationaldexag'},opts);
  if(!document.getElementById('lotta-css')){ const s=document.createElement('style'); s.id='lotta-css'; s.textContent=CSS; document.head.appendChild(s); }
  root=document.createElement('div'); root.id='lotta'; root.setAttribute('role','dialog'); root.setAttribute('aria-label','Lotta');
  root.innerHTML=`<div class="lt-wrap"><div class="lt-top"><h2 class="lt-title">Lotta</h2><span class="lt-muted">${esc(O.formatName||'')}</span><button class="btn ghost" data-lt="exit">Esci dalla lotta</button></div>
   <div class="arena" id="lt-arena">
    <div class="tfx" id="lt-tfx" hidden></div><div class="rfx" id="lt-rfx" hidden></div>
    <div class="pad p2"></div><div class="pad p1"></div>
    <div class="haz p2" id="lt-hazp2"></div><div class="haz p1" id="lt-hazp1"></div>
    <div id="lt-scrp2"></div><div id="lt-scrp1"></div>
    <div class="mon p2 out" id="lt-monp2" data-tip="act:p2"></div><div class="mon p1 out" id="lt-monp1" data-tip="act:p1"></div>
    <div class="wfx" id="lt-wfx" hidden></div><div class="wlabel" id="lt-wlabel"></div>
    <div class="hud p2" id="lt-hudp2" hidden></div><div class="hud p1" id="lt-hudp1" hidden></div>
    <div class="balls p2" id="lt-ballsp2"></div><div class="balls p1" id="lt-ballsp1"></div>
   </div>
   <div class="lt-msg" id="lt-msg" aria-live="polite"></div>
   <section class="lt-card ctrl" id="lt-ctrl"></section>
   <p class="lt-muted">Punta col mouse (o tieni premuto, da telefono) Pokémon, Poké Ball, strumenti e mosse per vedere le informazioni. Calcoli del simulatore di Pokémon Showdown (MIT).</p>
   <details class="lt-log"><summary>Cronaca completa della lotta</summary><div id="lt-log"></div></details></div>
   <div class="lt-tip" id="lt-tip" hidden></div>`;
  document.body.appendChild(root); document.documentElement.style.overflow='hidden';
  for(const [ev,fn] of EVTS) document.addEventListener(ev,fn); document.addEventListener('click',onClickCapture,true); addEventListener('scroll',hideTip,{passive:true,capture:true});
  root.addEventListener('click',onClick);
  gen++; B=fresh(); const g=gen;
  B.sets.p1=Teams.import(O.teams.p1)||[]; B.sets.p2=Teams.import(O.teams.p2)||[];
  drawField(); say('La lotta sta per cominciare!');
  const streams=BattleStreams.getPlayerStreams(new BattleStreams.BattleStream()); B.streams=streams;
  readSide(g,'p1',streams.p1); readSide(g,'p2',streams.p2); readLog(g,streams.omniscient);
  const pl=s=>JSON.stringify({name:String(O.names[s]).slice(0,18),team:Teams.pack(B.sets[s])});
  streams.omniscient.write(`>start ${JSON.stringify({formatid:O.formatid})}\n>player p1 ${pl('p1')}\n>player p2 ${pl('p2')}`);
}
window.Lotta={open,close};
})();
