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
/* ===== Campo di lotta ===== */
#lotta .arena{position:relative;aspect-ratio:16/9;max-height:56vh;width:100%;border:3px solid var(--line);border-radius:14px;overflow:hidden;box-shadow:0 5px 0 var(--line);
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

/* HUD: riquadro nome/PS + cerchio dello strumento + finestrella delle statistiche */
#lotta .hud{position:absolute;display:flex;gap:6px;align-items:flex-start;z-index:5;max-width:56%}
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
#lotta .shield{position:absolute;left:50%;top:52%;width:118%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;z-index:3;background:radial-gradient(circle,rgba(120,220,255,.05) 40%,rgba(120,220,255,.32) 66%,rgba(200,245,255,.6) 71%,rgba(120,220,255,0) 73%);box-shadow:0 0 14px rgba(120,220,255,.6);animation:shieldIn .35s ease-out,shieldGlow 1.6s ease-in-out infinite alternate}
@keyframes shieldIn{from{transform:translate(-50%,-50%) scale(.4);opacity:0}to{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes shieldGlow{from{filter:brightness(1)}to{filter:brightness(1.25)}}
#lotta .pop.miss{background:#fff;color:#1F2A44;font-style:italic}
#lotta .st.vol{background:#5B4A9E;color:#fff;font-weight:700}
#lotta .le.hp{color:#5B6684;font-size:.9em}
#lotta .abar{position:absolute;z-index:9;display:flex;flex-direction:column;background:#FFFFFF;border:3px solid #1F2A44;border-radius:10px;padding:3px 12px;font:600 clamp(11px,2.2vw,14px) 'Inter',sans-serif;color:#1F2A44;box-shadow:0 3px 0 #1F2A44;pointer-events:none;animation:abar 1.9s ease forwards;white-space:nowrap}
#lotta .abar b{font-size:.85em;color:#5B6684;font-weight:700}#lotta .abar span{font-weight:900}
#lotta .abar.foe{top:30%;right:2%}#lotta .abar.me{bottom:30%;left:2%}
@keyframes abar{0%{opacity:0;transform:translateX(var(--dx,30px))}12%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
#lotta .abar.me{--dx:-30px}
@keyframes pop{0%{opacity:0;transform:translate(-50%,10px) scale(.7)}15%{opacity:1;transform:translate(-50%,0) scale(1.08)}75%{opacity:1;transform:translate(-50%,-26px)}100%{opacity:0;transform:translate(-50%,-40px)}}

/* Poké Ball della squadra (si possono puntare per vedere i Pokémon) */
#lotta .balls{position:absolute;display:flex;gap:4px;z-index:5}
#lotta .balls.p2{left:3%;top:36%} #lotta .balls.p1{right:3%;bottom:4%}
#lotta .balls button{width:20px;height:20px;padding:0;border-radius:50%;border:2px solid var(--line);cursor:help;background:linear-gradient(#E3350D 0 44%,var(--line) 44% 56%,#fff 56%)}
#lotta .balls button.ko{background:#9AA3B5;opacity:.6}
#lotta .balls button.st{background:linear-gradient(#E3350D 0 44%,var(--line) 44% 56%,#F2C21B 56%)}

/* Rocce,#lotta punte,#lotta ragnatela,#lotta schermi (effetti a terra di ciascun lato) */
#lotta .haz{position:absolute;pointer-events:none;z-index:2}
#lotta .rock{position:absolute;width:14%;aspect-ratio:1;background:linear-gradient(135deg,#C9CED8,#7D8597 60%,#5A6172);clip-path:polygon(50% 0,95% 35%,80% 100%,18% 95%,0 40%);animation:bob 2.4s ease-in-out infinite;filter:drop-shadow(0 2px 0 rgba(0,0,0,.3))}
@keyframes bob{50%{transform:translateY(-22%) rotate(8deg)}}
#lotta .spike{position:absolute;width:7%;aspect-ratio:1;background:#3B3F4A;clip-path:polygon(50% 0,100% 100%,0 100%)}
#lotta .spike.tox{background:#9A3FD0}
#lotta .web{position:absolute;inset:-10% 5%;border-radius:50%;background:repeating-radial-gradient(ellipse,transparent 0 9%,rgba(255,255,255,.85) 9% 11%),repeating-conic-gradient(from 0deg,rgba(255,255,255,.85) 0 2deg,transparent 2deg 30deg);opacity:.85}
@keyframes wind{to{background-position:120px 0}}

/* Meteo e campi (strati sopra tutta l'arena) */
#lotta .orb{position:absolute;z-index:7;width:5%;aspect-ratio:1;border-radius:50%;border:2px solid #fff;box-shadow:0 0 14px 4px var(--c);background:var(--c);transform:translate(-50%,-50%);transition:left .38s ease-in,top .38s ease-in,opacity .2s}
#lotta .ring{position:absolute;z-index:7;width:12%;aspect-ratio:1;border-radius:50%;border:4px solid var(--c);transform:translate(-50%,-50%);animation:ring .6s ease-out forwards}
@keyframes ring{from{opacity:1;transform:translate(-50%,-50%) scale(.3)}to{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
#lotta .wlabel{position:absolute;left:50%;top:2%;transform:translateX(-50%);z-index:7;display:flex;gap:4px}
#lotta .wlabel span{font:800 11px 'Inter',sans-serif;background:rgba(255,255,255,.88);border:2px solid var(--line);border-radius:99px;padding:0 8px;white-space:nowrap}

/* Messaggi e comandi */
#lotta .lt-msg{min-height:72px;font:700 clamp(15px,2.8vw,19px)/1.4 'Inter',sans-serif;background:#fff;border:4px solid var(--line);border-radius:14px;box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 6px #E3350D,0 5px 0 var(--line);padding:16px 20px}
#lotta .who{font:800 13px 'Inter',sans-serif;letter-spacing:.05em;text-transform:uppercase;padding:3px 12px;border-radius:99px;color:#fff;align-self:flex-start;border:2px solid var(--line)}
#lotta .who.p1{background:var(--p1)} #lotta .who.p2{background:var(--p2)}
#lotta .ctrl{display:flex;flex-direction:column;gap:10px}
#lotta .moves{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#lotta .mv{font:inherit;text-align:left;cursor:pointer;border:3px solid var(--line);border-radius:12px;padding:7px 12px 8px;box-shadow:0 4px 0 var(--line);color:#fff;display:flex;flex-direction:column;gap:1px;text-shadow:0 1px 0 rgba(0,0,0,.35);position:relative}
#lotta .mv b{font-size:16px;padding-right:86px} #lotta .mv span{font-size:12px;opacity:.95}
#lotta .mv:active{transform:translateY(3px);box-shadow:0 1px 0 var(--line)}
#lotta .lock{margin:2px 0 6px;font:700 12px 'Inter',sans-serif;color:#8A5A00;background:#FFF3D1;border:1.5px solid #E9C46A;border-radius:8px;padding:3px 8px}#lotta .mv:disabled{filter:grayscale(1);opacity:.5;cursor:not-allowed}
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

/* Schede informative (mouse sopra o pressione lunga) */
#lotta .lt-tip{position:fixed;z-index:50;max-width:min(380px,94vw);background:#FFFBEA;border:3px solid var(--line);border-radius:12px;box-shadow:0 5px 0 var(--line);padding:10px 12px;font-size:13px;line-height:1.4;pointer-events:none}
#lotta .lt-tip h4{margin:0 0 4px;font-size:16px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
#lotta .lt-tip .tc{font:800 10px 'Inter',sans-serif;color:#fff;border-radius:5px;padding:1px 6px;text-shadow:0 1px 0 rgba(0,0,0,.3)}
#lotta .lt-tip dl{display:grid;grid-template-columns:auto 1fr;gap:1px 8px;margin:4px 0}
#lotta .lt-tip dt{font-weight:800;color:var(--muted)} #lotta .lt-tip dd{margin:0} #lotta .lt-tip .stmod.up{color:#1E7B34} #lotta .lt-tip .stmod.down{color:#B3261E} #lotta .lt-tip s{color:var(--muted)}
#lotta .tgrow{margin:2px 0 8px}#lotta .tglab{display:inline-block;font:800 11px 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:1px 8px;border-radius:99px;margin:0 0 4px;color:#fff}#lotta .tglab.foe{background:#C21F1F}#lotta .tglab.ally{background:#2E8B3E}
#lotta .lt-tip ul{margin:4px 0 0;padding-left:16px} #lotta .lt-tip .mvt{border-collapse:collapse;width:100%;margin:4px 0;font-size:12px}#lotta .lt-tip .mvt th{text-align:left;color:var(--muted);font-size:11px;padding:0 4px}#lotta .lt-tip .mvt td{padding:2px 4px;border-top:1px solid #EFE6C8;white-space:nowrap}#lotta .lt-tip ul.fx{margin:6px 0 0;padding-left:18px}#lotta .lt-tip ul.fx li{margin:1px 0}#lotta .lt-tip .desc .ico{vertical-align:middle;display:inline-block}#lotta .lt-tip .desc{margin-top:6px;border-top:2px dashed #E3D9B8;padding-top:6px}
#lotta .lt-tip .plus{color:#2E8B3E;font-weight:800}#lotta .lt-tip .minus{color:#C21F1F;font-weight:800}
#lotta .arena{background:#87C8F0}#lotta .arena::before{display:none}
#lotta .bg{position:absolute;inset:0;z-index:0}#lotta .bg svg{width:100%;height:100%;display:block}
#lotta .bg .drift{animation:ltDrift 9s ease-in-out infinite alternate}
@keyframes ltDrift{from{transform:translateX(-40px)}to{transform:translateX(40px)}}
#lotta .bg .wave{animation:ltWave 4s ease-in-out infinite}@keyframes ltWave{50%{transform:translateX(22px);opacity:.25}}
#lotta .bg .foam{animation:ltFoam 3.5s ease-in-out infinite}@keyframes ltFoam{50%{transform:translateY(7px)}}
#lotta .bg .ray{animation:ltRay 6s ease-in-out infinite}@keyframes ltRay{50%{opacity:.3}}
#lotta .bg .crys{animation:ltCrys 3s ease-in-out infinite}@keyframes ltCrys{50%{filter:drop-shadow(0 0 12px #A8E6FF) brightness(1.3)}}
#lotta .sc-spiaggia .pad{background:radial-gradient(ellipse at 50% 40%,#FFF4D6 0,#F2D898 60%,#D8B26A 100%);border-color:rgba(150,110,40,.4)}
#lotta .sc-foresta .pad{background:radial-gradient(ellipse at 50% 40%,#A6D673 0,#74AA4B 60%,#4E8034 100%);border-color:rgba(30,60,20,.4)}
#lotta .sc-grotta .pad{background:radial-gradient(ellipse at 50% 40%,#A397B8 0,#776C8F 60%,#554B6C 100%);border-color:rgba(20,10,40,.5)}
#lotta .sc-citta .pad{background:radial-gradient(ellipse at 50% 40%,#A9B6C5 0,#8593A5 60%,#66748A 100%);border:4px solid rgba(255,255,255,.9)}
#lotta .pad{box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)}
#lotta .sc-grotta .wlabel span,#lotta .sc-citta .wlabel span{background:rgba(255,255,255,.92)}
#lotta .wfx{position:absolute;inset:0;pointer-events:none;z-index:4;overflow:hidden}
#lotta .w-tint{position:absolute;inset:0}
#lotta .w-tint.rain{background:linear-gradient(rgba(25,45,95,.38),rgba(40,70,120,.2))}
#lotta .drop{position:absolute;top:-24px;width:2px;background:linear-gradient(rgba(210,230,255,0),#EAF4FF);border-radius:2px;animation:ltDrop .8s linear infinite}
@keyframes ltDrop{from{transform:translate(0,-24px) rotate(10deg)}to{transform:translate(-120px,720px) rotate(10deg)}}
#lotta .splash{position:absolute;width:22px;height:7px;margin-left:-11px;border:2px solid rgba(230,242,255,.85);border-radius:50%;opacity:0;animation:ltSplash 1.2s ease-out infinite}
@keyframes ltSplash{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.7);opacity:0}}
#lotta .w-tint.sun{background:radial-gradient(circle at 92% 6%,rgba(255,232,120,.55),rgba(255,180,60,.2) 45%,rgba(255,170,40,.12))}
#lotta .w-tint.sun.hot{background:radial-gradient(circle at 92% 6%,rgba(255,200,80,.7),rgba(255,110,30,.3) 45%,rgba(255,80,20,.22))}
#lotta .sunbox{position:absolute;right:-7%;top:-16%;width:36%;aspect-ratio:1}
#lotta .sundisc{position:absolute;inset:33%;border-radius:50%;background:radial-gradient(circle,#FFFDF0 0,#FFF3A8 45%,#FFD54A 100%);box-shadow:0 0 50px 26px rgba(255,220,100,.65)}
#lotta .sunrays{position:absolute;inset:0;border-radius:50%;background:repeating-conic-gradient(rgba(255,242,170,.6) 0 6deg,rgba(255,242,170,0) 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 28%,transparent 70%);mask:radial-gradient(circle,#000 28%,transparent 70%);animation:ltSpin 30s linear infinite}
@keyframes ltSpin{to{transform:rotate(360deg)}}
#lotta .flare{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.55),rgba(255,220,140,.18) 60%,transparent 72%);animation:ltPulse 3s ease-in-out infinite}
@keyframes ltPulse{50%{opacity:.45;transform:scale(1.15)}}
#lotta .haze{position:absolute;left:0;right:0;bottom:0;height:58%;background:repeating-linear-gradient(0deg,rgba(255,200,120,.07) 0 6px,transparent 6px 14px);animation:ltHaze 2s linear infinite}
@keyframes ltHaze{to{background-position:0 -28px}}
#lotta .w-tint.sand{background:linear-gradient(rgba(205,155,85,.5),rgba(175,125,65,.38))}
#lotta .swirl{position:absolute;left:-45%;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,rgba(236,196,128,.9) 40%,rgba(200,150,80,.8) 70%,transparent);animation:ltGust 1s linear infinite}#lotta .sandstreak{position:absolute;inset:0;background:repeating-linear-gradient(100deg,transparent 0 40px,rgba(240,200,130,.35) 40px 46px,transparent 46px 110px);animation:ltSand 1.2s linear infinite}
#lotta .sandstreak.s2{opacity:.55;background-size:220px 100%;animation-duration:.8s}
@keyframes ltSand{to{background-position:220px 0}}
#lotta .grain{position:absolute;left:-4%;border-radius:50%;background:#B9803C;animation:ltGrain 1.4s linear infinite}
@keyframes ltGrain{from{transform:translate(0,0)}to{transform:translate(1300px,70px)}}
#lotta .w-tint.snow{background:linear-gradient(rgba(215,232,255,.3),rgba(235,245,255,.2))}
#lotta .frost{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(235,245,255,.8) 100%)}
#lotta .flake{position:absolute;top:-14px;border-radius:50%;background:#fff;box-shadow:0 0 4px rgba(255,255,255,.95);animation:ltFall 5s linear infinite,ltSway 3s ease-in-out infinite alternate}
@keyframes ltFall{from{transform:translateY(-14px)}to{transform:translateY(720px)}}
@keyframes ltSway{from{margin-left:-16px}to{margin-left:16px}}
#lotta .pellet{position:absolute;top:-12px;border-radius:40%;background:linear-gradient(135deg,#fff,#BFE3FF);border:1px solid #9CCBEB;animation:ltHail 1s linear infinite,ltSway 3s ease-in-out infinite alternate}
@keyframes ltHail{from{transform:translate(0,-12px)}to{transform:translate(-70px,720px)}}
#lotta .w-tint.delta{background:linear-gradient(rgba(40,60,90,.28),rgba(60,90,120,.14))}
#lotta .wind2{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}#lotta .wind2.p1{clip-path:inset(40% 45% 0 0)}#lotta .wind2.p2{clip-path:inset(0 0 45% 45%)}#lotta .gust{position:absolute;left:-40%;width:40%;height:3px;border-radius:3px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);animation:ltGust 1.4s linear infinite}
@keyframes ltGust{to{transform:translateX(360%)}}
#lotta .tfx{position:absolute;left:0;right:0;top:42%;bottom:0;pointer-events:none;z-index:2;overflow:hidden}
#lotta .tfx svg{position:absolute;inset:0;width:100%;height:100%}
#lotta .t-tint{position:absolute;inset:0}
#lotta .t-tint.el{background:linear-gradient(rgba(255,230,60,.22),rgba(255,210,0,.45));box-shadow:inset 0 12px 30px rgba(255,240,120,.7);animation:ltPulse2 1.6s ease-in-out infinite}
@keyframes ltPulse2{50%{opacity:.65}}
#lotta .bolt{opacity:0;filter:drop-shadow(0 0 6px #FFE14D);animation:ltBolt 1.8s steps(1,end) infinite}
@keyframes ltBolt{0%,100%{opacity:0}8%{opacity:1}12%{opacity:.2}16%{opacity:1}24%{opacity:0}}
#lotta .spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#FFF9C4;box-shadow:0 0 8px 3px #FFE14D;animation:ltTw 1.5s ease-in-out infinite}
@keyframes ltTw{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.25)}}
#lotta .t-tint.gr{background:linear-gradient(rgba(60,190,80,.22),rgba(30,150,50,.42))}
#lotta .blade{animation:ltBlade 2.6s ease-in-out infinite}
@keyframes ltBlade{50%{transform:rotate(7deg)}}
#lotta .t-tint.mi{background:linear-gradient(rgba(255,175,225,.35),rgba(255,140,210,.5))}
#lotta .fog{position:absolute;width:60%;height:75%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,225,242,.8),rgba(255,200,235,0) 70%);animation:ltFog 14s ease-in-out infinite alternate}
@keyframes ltFog{to{transform:translateX(35%)}}
#lotta .twinkle{position:absolute;width:9px;height:9px;background:#fff;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);animation:ltTw 2s ease-in-out infinite}
#lotta .twinkle.ps{background:#F7C4FF}
#lotta .t-tint.ps{background:linear-gradient(rgba(190,80,230,.28),rgba(150,40,200,.5))}
#lotta .ripple{position:absolute;left:50%;top:55%;width:30%;height:22%;margin:-11% 0 0 -15%;border-radius:50%;border:4px solid rgba(240,170,255,.85);box-shadow:0 0 14px rgba(230,140,255,.7);animation:ltRip 4s ease-out infinite}
@keyframes ltRip{0%{transform:scale(.2);opacity:1}100%{transform:scale(3.3);opacity:0}}
#lotta .rfx{position:absolute;inset:0;pointer-events:none;z-index:3;background:rgba(80,30,140,.2);animation:ltPulse2 2s ease-in-out infinite}
#lotta .rfx svg{width:100%;height:100%;display:block}
#lotta .screen{position:absolute;pointer-events:none;z-index:4;border-radius:46% 46% 14% 14%/38% 38% 10% 10%;overflow:hidden;border:3px solid;background-size:26px 45px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='45' viewBox='0 0 26 45'%3E%3Cpath d='M13 0L26 7.5V22.5L13 30L0 22.5V7.5Z M13 30V45' fill='none' stroke='%23fff' stroke-opacity='.65' stroke-width='1.4'/%3E%3C/svg%3E");animation:ltScr 2.4s ease-in-out infinite}
@keyframes ltScr{50%{opacity:.7}}
#lotta .screen.p2{right:9%;top:10%;width:30%;height:44%}#lotta .screen.p1{left:6%;top:36%;width:34%;height:56%}
#lotta .screen.reflect{background-color:rgba(255,120,90,.22);border-color:rgba(255,140,110,.95);box-shadow:0 0 18px rgba(255,120,90,.6),inset 0 0 22px rgba(255,180,160,.6)}
#lotta .screen.lightscreen{background-color:rgba(255,230,90,.2);border-color:rgba(255,236,120,.95);box-shadow:0 0 18px rgba(255,220,80,.6),inset 0 0 22px rgba(255,245,170,.6)}
#lotta .screen.auroraveil{background-color:rgba(160,220,255,.22);border-color:#fff;box-shadow:0 0 22px rgba(170,140,255,.7),inset 0 0 26px rgba(160,255,220,.6);animation:ltScr 2.4s ease-in-out infinite,ltHue 4s linear infinite}
@keyframes ltHue{to{filter:hue-rotate(360deg)}}
#lotta .screen .shine{position:absolute;top:-20%;bottom:-20%;width:30%;left:-40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent);animation:ltShine 3s ease-in-out infinite}
@keyframes ltShine{0%{left:-40%}60%,100%{left:120%}}
#lotta .screen+.screen{transform:scale(1.07)}
#lotta .rock{background:linear-gradient(135deg,#E2E6EE 0,#9AA2B4 35%,#6B7385 70%,#4E5566)}
#lotta .spike{background:linear-gradient(90deg,#2B2F38,#6E7586 45%,#2B2F38)}
#lotta .spike.tox{background:linear-gradient(90deg,#5E1F8A,#C27BF0 45%,#5E1F8A)}
@media (prefers-reduced-motion:reduce){#lotta .drop,#lotta .splash,#lotta .flake,#lotta .pellet,#lotta .grain,#lotta .gust,#lotta .bolt,#lotta .spark,#lotta .twinkle,#lotta .ripple,#lotta .fog{display:none}#lotta .bg *,#lotta .blade,#lotta .sunrays,#lotta .screen,#lotta .shine{animation:none!important}}

/* ===== Disposizione stile Showdown ===== */
#lotta{padding:10px 10px 24px}
#lotta .lt-wrap{max-width:1180px;gap:8px}
#lotta .lt-top{gap:8px}#lotta .lt-title{font-size:26px}
#lotta .lt-main{display:grid;grid-template-columns:minmax(0,680px) minmax(260px,1fr);gap:12px;align-items:start}
#lotta .lt-left{display:flex;flex-direction:column;gap:8px;min-width:0}
#lotta .lt-right{position:sticky;top:0;display:flex;flex-direction:column;background:#fff;border:3px solid var(--line);border-radius:12px;box-shadow:0 4px 0 var(--line);max-height:calc(100vh - 90px);min-height:300px;overflow:hidden}
#lotta .lt-logh{font:800 12px 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#2B3A63;padding:6px 10px}
#lotta .lt-logbox{flex:1;overflow:auto;padding:8px 10px;font-size:13.5px;line-height:1.45}
#lotta .le{margin:1px 0}#lotta .le b{font-weight:800}
#lotta .le.turn{margin:10px -10px 4px;padding:3px 10px;background:#E9EEF7;border-top:1px solid #C9D3E6;border-bottom:1px solid #C9D3E6;font:800 15px 'Inter',sans-serif}
#lotta .le.win{font:800 16px 'Inter',sans-serif;color:#E3350D;margin-top:8px}
#lotta .arena{aspect-ratio:16/9;max-height:none;border-radius:10px;box-shadow:0 4px 0 var(--line)}
#lotta .lt-msg{min-height:0;padding:8px 14px;font:700 15px/1.35 'Inter',sans-serif;border-width:3px;border-radius:10px;box-shadow:inset 0 0 0 2px #fff,inset 0 0 0 4px #E3350D,0 3px 0 var(--line)}
#lotta .turnb{position:absolute;left:1.5%;top:3%;z-index:6;font:800 clamp(11px,1.9vw,15px) 'Inter',sans-serif;color:#fff;background:rgba(20,28,48,.78);border:2px solid rgba(255,255,255,.8);border-radius:6px;padding:1px 10px}
#lotta .wlabel{top:3%}
/* barre dei PS sopra i Pokémon */
#lotta .hud{flex-direction:row;align-items:flex-start;gap:4px;max-width:none;width:clamp(150px,31%,230px)}
#lotta .hud.p2{left:auto;right:6%;top:5%}#lotta .hud.p1{right:auto;left:5%;bottom:auto;top:30%}
#lotta .lt-series{font:800 12px 'Inter',sans-serif;background:#FFD23F;color:#1F2A44;border:2px solid #1F2A44;border-radius:99px;padding:2px 10px;white-space:nowrap}
#lotta .sb{flex:1;min-width:0;cursor:help;opacity:1;animation:none;transform:none}
#lotta .sbn{display:flex;align-items:baseline;gap:4px;color:#fff;font:800 clamp(11px,1.9vw,15px) 'Inter',sans-serif;text-shadow:0 0 2px #000,0 1px 2px #000,1px 0 2px #000,-1px 0 2px #000;white-space:nowrap;overflow:hidden}
#lotta .sbn b{overflow:hidden;text-overflow:ellipsis}#lotta .sbn small{font-size:.75em;opacity:.95}#lotta .sbn .shy{font-style:normal;font-size:.8em}
#lotta .sbbar{display:flex;align-items:center;gap:3px;margin-top:1px}
#lotta .sbbar .tr{flex:1;height:clamp(6px,1.2vw,9px);background:#3A4253;border:2px solid #1B2233;border-radius:3px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.4)}
#lotta .sbbar .fill{height:100%;background:linear-gradient(#7CF08A,#2FBF4C);border-radius:0}
#lotta .sbbar .fill.mid{background:linear-gradient(#FFE57A,#E8B417)}#lotta .sbbar .fill.low{background:linear-gradient(#FF8A7A,#D9361F)}
#lotta .pct{font:800 clamp(9px,1.5vw,11px) 'Inter',sans-serif;color:#1B2233;background:rgba(255,255,255,.9);border:1px solid #1B2233;border-radius:3px;padding:0 3px;min-width:2.6em;text-align:center}
#lotta .sbst{display:flex;flex-wrap:wrap;gap:2px;margin-top:2px;align-items:center;min-height:0}
#lotta .sbst .st{margin:0;font-size:clamp(8px,1.4vw,10px);padding:0 4px;border:1px solid rgba(0,0,0,.3)}
#lotta .bchip{font-size:clamp(8px,1.4vw,10px);padding:0 4px;border:1px solid rgba(0,0,0,.3);border-radius:4px}
#lotta .hpn{font:800 clamp(9px,1.5vw,11px) 'Inter',sans-serif;color:#fff;text-shadow:0 0 2px #000,0 1px 2px #000;margin-left:auto}
#lotta .hpn:empty{display:none}
#lotta .itemc{width:clamp(22px,3.6vw,30px);height:clamp(22px,3.6vw,30px);border-width:2px;box-shadow:0 2px 0 var(--line);margin-top:2px}
#lotta .itemc .ico{transform:scale(.85)}
#lotta .itemc b{font-size:12px}
/* squadre negli angoli */
#lotta .balls{gap:3px}#lotta .balls.p2{left:auto;right:1.5%;top:auto;bottom:47%}#lotta .balls.p1{right:auto;left:1.5%;bottom:3%}
#lotta .balls button{width:clamp(11px,1.9vw,16px);height:clamp(11px,1.9vw,16px)}
#lotta .balls.p2{right:1.5%;top:3%;bottom:auto}#lotta .wlabel{left:auto;right:auto;transform:none;left:50%;translate:-50% 0}
/* Pokémon: nemico più piccolo e lontano, il proprio più grande e vicino */
#lotta .mon.p2{right:12%;top:20%;width:26%;height:34%}
#lotta .mon.p1{left:8%;bottom:6%;width:32%;height:44%}
/* comandi */
#lotta .ctrl{background:#fff;border:3px solid var(--line);border-radius:12px;box-shadow:0 4px 0 var(--line);padding:10px 12px;display:flex;flex-direction:column;gap:6px;min-height:120px}
#lotta .lt-wait{color:var(--muted);font-weight:700;margin:auto 0;text-align:center}
#lotta .cq{font-size:15px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#lotta .cq .who{font-size:11px;padding:2px 9px}
#lotta .hpchip{font:700 12px 'Inter',sans-serif;border:1px solid #9AA6BC;border-radius:5px;padding:0 6px;color:var(--muted)}
#lotta .sec{font:italic 800 16px 'Inter',sans-serif;color:#B4361F;margin-top:2px}
#lotta .moves{grid-template-columns:repeat(4,1fr);gap:6px}
#lotta .mv{display:grid;grid-template-columns:1fr auto;align-items:end;gap:0 6px;padding:7px 8px 5px;border-radius:8px;color:#1F2A44;text-shadow:none;text-align:left;
  border:2px solid color-mix(in srgb,var(--tc) 75%,#000);box-shadow:0 3px 0 color-mix(in srgb,var(--tc) 60%,#1F2A44);
  background:linear-gradient(180deg,#fff 0,color-mix(in srgb,var(--tc) 22%,#fff) 55%,color-mix(in srgb,var(--tc) 42%,#fff) 100%)}
#lotta .mv:hover:not(:disabled){background:linear-gradient(180deg,#fff 0,color-mix(in srgb,var(--tc) 35%,#fff) 55%,color-mix(in srgb,var(--tc) 60%,#fff) 100%)}
#lotta .mv b{grid-column:1/-1;text-align:center;font-size:15px;padding:6px 0 4px;padding-right:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lotta .mv .mt{font-size:11px;font-weight:700;color:#3B4660;display:flex;align-items:center;gap:4px;opacity:1}
#lotta .mv .tdot{width:8px;height:8px;border-radius:50%;background:var(--tc);border:1px solid rgba(0,0,0,.35)}
#lotta .mv .pp{font-size:11px;font-weight:700;color:#3B4660;opacity:1}
#lotta .eff{position:absolute;left:4px;right:auto;top:-9px;font-size:9px;padding:0 5px;border-width:1.5px;border-radius:5px;white-space:nowrap}
#lotta .tera{display:inline-flex;align-items:center;gap:6px;align-self:center;font-weight:800;font-size:14px;border:2px solid #C9D3E6;border-radius:8px;padding:3px 12px;background:#F7F9FD;cursor:pointer}
#lotta .tera .st{margin:0}
#lotta .lt-team{grid-template-columns:repeat(6,1fr);gap:5px}
#lotta .tm{flex-direction:row;flex-wrap:wrap;justify-content:flex-start;gap:2px 4px;padding:3px 5px;border-width:2px;border-radius:7px;box-shadow:0 2px 0 var(--line)}
#lotta .tm img{height:28px;width:30px;object-fit:contain}
#lotta .tm small{flex:1;min-width:0;font-size:11px;text-align:left}
#lotta .tm .mini{flex:0 0 100%;height:4px}#lotta .tm .mini i.mid{background:#E8B417}#lotta .tm .mini i.low{background:#D9361F}
#lotta .tm.ko{opacity:.4}
#lotta .pass{padding:8px}
#lotta .lt-hint{text-align:center}
#lotta .w-tint.sunl{background:linear-gradient(160deg,rgba(255,236,150,.22),rgba(255,210,110,.06) 60%,transparent)}
#lotta .w-tint.sunl.hot{background:linear-gradient(160deg,rgba(255,170,80,.35),rgba(255,120,40,.12) 60%,rgba(255,90,30,.08))}
#lotta .beam{position:absolute;top:-30%;width:9%;height:170%;background:linear-gradient(180deg,rgba(255,248,205,.75),rgba(255,240,180,.25) 55%,rgba(255,240,180,0));transform:rotate(-28deg);transform-origin:50% 0;opacity:0;filter:blur(2px);animation:ltBeam 11.5s ease-in-out infinite}
#lotta .beam.hot{background:linear-gradient(180deg,rgba(255,220,150,.85),rgba(255,170,90,.3) 55%,rgba(255,160,80,0))}
@keyframes ltBeam{0%,100%{opacity:0}8%{opacity:.85}20%{opacity:0}}
#lotta .swirl{left:-15%;height:1.5px;background:linear-gradient(90deg,transparent,rgba(240,205,140,.75),transparent);animation:ltSwirl 4s linear infinite;transform:none}
@keyframes ltSwirl{0%{left:-15%;opacity:0}3%{opacity:.8}28%{left:105%;opacity:.8}29%,100%{left:105%;opacity:0}}
#lotta .grain{opacity:.8}
/* telefono */
@media (max-width:820px){
  #lotta{padding:6px 6px 20px}
  #lotta .lt-main{display:flex;flex-direction:column;gap:8px}
  #lotta .lt-right{position:static;max-height:190px;min-height:0;order:3}
  #lotta .lt-title{font-size:20px}#lotta .lt-top .btn{padding:6px 10px;font-size:13px}
  #lotta .arena{aspect-ratio:4/3;border-width:2px}
  #lotta .hud{width:44%}#lotta .hud.p2{right:3%;top:6%}#lotta .hud.p1{left:3%;top:40%}
  #lotta .mon.p2{right:6%;top:22%;width:36%;height:32%}#lotta .mon.p1{left:2%;bottom:5%;width:46%;height:40%}
  #lotta .pad.p2,#lotta .haz.p2{right:2%;top:44%;width:44%;height:11%}#lotta .pad.p1,#lotta .haz.p1{left:-2%;bottom:2%;width:54%;height:14%}
  #lotta .screen.p2{right:5%;top:16%;width:40%;height:40%}#lotta .screen.p1{left:1%;top:44%;width:48%;height:52%}
  #lotta .balls.p2{top:auto;bottom:3%;right:2%}
  #lotta .lt-msg{font-size:14px;padding:6px 10px}
  #lotta .moves{grid-template-columns:1fr 1fr}
  #lotta .mv b{font-size:14px;padding:5px 0 3px}
  #lotta .lt-team{grid-template-columns:repeat(3,1fr)}
  #lotta .cq{font-size:14px}
}

#lotta .hud.p2{right:16%;top:9%}
#lotta .mon.p1 img{transform:scale(1.6)}#lotta .mon.p1 img.flip{transform:scaleX(-1) scale(1.45)}
#lotta .mon.p2 img{transform:scale(1.25)}
@media (max-width:820px){#lotta .hud.p2{right:3%;top:9%}#lotta .mon.p1 img{transform:scale(1.4)}#lotta .mon.p2 img{transform:scale(1.1)}}
#lotta .eff{left:auto;right:4px;top:3px}#lotta .mv:has(.eff) b{padding-top:14px}
@media (max-width:820px){#lotta .lt-main{align-items:stretch}}
/* ===== Efficacia sotto la mossa ===== */
#lotta .mv:has(.eff) b{padding-top:6px}
#lotta .effl{grid-column:1/-1;font:800 10px/1.2 'Inter',sans-serif;text-align:center;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lotta .effl.x4{color:#B3150F}#lotta .effl.x2{color:#1E7A33}#lotta .effl.x05{color:#8A6A00}#lotta .effl.x025{color:#9A4A00}#lotta .effl.x0{color:#4A5366}
#lotta .hud{width:clamp(130px,30%,220px)}

/* ===== Striscia sopra il campo: turno e meteo ===== */
#lotta .lt-info{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:22px}
#lotta .lt-info .turnb{position:static;font:800 12px 'Inter',sans-serif;padding:1px 9px;border-radius:6px;background:#1F2A44;border:2px solid #1F2A44}
#lotta .lt-info .wlabel{position:static;transform:none;translate:none;display:flex;flex-wrap:wrap;gap:4px;margin-left:auto;justify-content:flex-end}
#lotta .lt-info .wlabel span{font:800 11px 'Inter',sans-serif;background:#fff;border:2px solid var(--line);border-radius:99px;padding:0 8px}
/* mini-schede dei cambi: sprite sopra, nome sotto (va a capo invece di tagliarsi) */
#lotta .tm{flex-direction:column;align-items:center;flex-wrap:nowrap;gap:1px;padding:3px 3px 4px}
#lotta .tm img{height:30px;width:auto;max-width:100%}
#lotta .tm small{flex:none;width:100%;text-align:center;font-size:10.5px;line-height:1.15;white-space:normal;overflow-wrap:anywhere}
#lotta .tm .mini{flex:none;width:100%}
#lotta .bchip{padding:0 3px}
/* ===== Telefono: disposizione classica dei giochi (niente si incrocia) =====
   avversario: barra in alto a sinistra, Pokémon a destra; mio: Pokémon in basso a sinistra, barra in basso a destra */
@media (max-width:820px){
  #lotta .arena{aspect-ratio:4/3}
  #lotta .hud{width:47%}
  #lotta .hud.p2{left:2%;right:auto;top:3%}
  #lotta .hud.p1{left:auto;right:2%;top:auto;bottom:11%;flex-direction:row}
  #lotta .balls.p2{left:auto;right:2%;top:3%;bottom:auto}
  #lotta .balls.p1{left:auto;right:2%;bottom:3%}
  #lotta .mon.p2{right:3%;top:14%;width:44%;height:38%}
  #lotta .mon.p1{left:1%;bottom:3%;width:48%;height:50%}
  #lotta .mon.p1 img{transform:scale(1.15)}#lotta .mon.p1 img.flip{transform:scaleX(-1) scale(1.1)}
  #lotta .mon.p2 img{transform:none}
  #lotta .pad.p2,#lotta .haz.p2{right:2%;top:44%;width:46%;height:11%}
  #lotta .pad.p1,#lotta .haz.p1{left:-1%;bottom:1%;width:52%;height:13%}
  #lotta .screen.p2{right:3%;top:10%;width:45%;height:46%}#lotta .screen.p1{left:1%;top:44%;width:48%;height:54%}
  #lotta .sbn small{display:none}
  #lotta .sbn{font-size:12px}
  #lotta .pct{font-size:10px}
  #lotta .sbst .st,#lotta .bchip{font-size:8.5px}
  #lotta .hpn{font-size:10px}
  #lotta .lt-team{grid-template-columns:repeat(3,1fr)}
  #lotta .mv{padding:6px 6px 5px}
  #lotta .mv b{font-size:13.5px}
}
@media (max-width:360px){
  #lotta .hud{width:48%}
  #lotta .sbn{font-size:11px}
  #lotta .mv b{font-size:12.5px}
  #lotta .mv .mt,#lotta .mv .pp{font-size:10px}
  #lotta .cq{font-size:13px}
}
/* telefono girato (largo ma basso): campo meno alto per vedere anche le mosse */
@media (max-height:500px) and (orientation:landscape){
  #lotta .lt-main{grid-template-columns:minmax(0,1fr) minmax(200px,34%);display:grid}
  #lotta .arena{aspect-ratio:16/9;max-height:62vh}
}

#lotta .effl{white-space:normal}
@media (max-width:820px){#lotta .mon.p1{width:46%}#lotta .mon.p1 img{transform:none}#lotta .mon.p1 img.flip{transform:scaleX(-1)}#lotta .hud{width:48%}}
/* ===== Disposizione classica per tutte le misure: avversario in alto (barra a sinistra, Pokémon a destra), mio in basso (Pokémon a sinistra, barra a destra) ===== */
#lotta .hud{width:clamp(150px,40%,250px)}
#lotta .hud.p2{left:2%;right:auto;top:3%;bottom:auto}
#lotta .hud.p1{left:auto;right:2%;top:auto;bottom:12%;flex-direction:row}
#lotta .balls.p2{left:auto;right:2%;top:3%;bottom:auto}
#lotta .balls.p1{left:auto;right:2%;bottom:3%;top:auto}
#lotta .mon.p2{right:5%;top:12%;width:38%;height:42%}
#lotta .mon.p1{left:3%;right:auto;bottom:3%;width:42%;height:54%}
#lotta .mon.p1 img{transform:scale(1.1)}#lotta .mon.p1 img.flip{transform:scaleX(-1) scale(1.05)}
#lotta .mon.p2 img{transform:none}
#lotta .pad.p2,#lotta .haz.p2{right:3%;left:auto;top:46%;width:42%;height:12%}
#lotta .pad.p1,#lotta .haz.p1{left:0;bottom:1%;width:50%;height:14%}
#lotta .screen.p2{right:5%;top:10%;width:39%;height:48%}#lotta .screen.p1{left:2%;top:40%;width:44%;height:58%}
@media (max-width:820px){
  #lotta .hud{width:48%}
  #lotta .mon.p2{right:3%;top:14%;width:44%;height:38%}
  #lotta .mon.p1{left:1%;bottom:3%;width:46%;height:50%}
  #lotta .mon.p1 img{transform:none}#lotta .mon.p1 img.flip{transform:scaleX(-1)}
  #lotta .pad.p2,#lotta .haz.p2{right:2%;top:44%;width:46%;height:11%}
  #lotta .pad.p1,#lotta .haz.p1{left:-1%;bottom:1%;width:52%;height:13%}
  #lotta .screen.p2{right:3%;top:10%;width:45%;height:46%}#lotta .screen.p1{left:1%;top:44%;width:48%;height:54%}
}

@media (max-height:500px) and (orientation:landscape){#lotta .lt-main{grid-template-columns:minmax(0,1fr) minmax(180px,28%)}#lotta .arena{max-height:64vh}#lotta .hud{width:37%}#lotta .sbn small{display:none}#lotta .sbn{font-size:11px}#lotta .sbst .st,#lotta .bchip{font-size:8px}#lotta .hud.p1{bottom:4%}#lotta .balls.p1{right:auto;left:2%;bottom:3%}#lotta .mon.p2{top:16%;height:36%}}
/* ===== Giro 3 ===== */
/* Poké Ball sotto la barra dei PS; gialle con uno stato alterato, grigie se esausto */
#lotta .arena > .balls{display:none}
#lotta .sb .balls{position:static;display:flex;gap:3px;margin-top:3px}
#lotta .sb .balls button{width:clamp(11px,1.8vw,14px);height:clamp(11px,1.8vw,14px);border-width:1.5px;box-shadow:0 1px 1px rgba(0,0,0,.35)}
#lotta .sb .balls button.stx{background:radial-gradient(circle at 50% 50%,#fff 0 16%,#1F2A44 17% 26%,transparent 27%),linear-gradient(#FFD43B 0 44%,#1F2A44 44% 56%,#FFE98A 56%)}
#lotta .bmark{font:900 10px/1 'Inter',sans-serif;color:#fff;background:#5B4BC4;border:1px solid rgba(0,0,0,.35);border-radius:4px;padding:1px 4px}
/* efficacia: solo simbolo */
#lotta .effl{font:900 11px/1.2 'Inter',sans-serif}
#lotta .effl.x4,#lotta .effl.x2{color:#178A33}#lotta .effl.x05,#lotta .effl.x025{color:#C62416}#lotta .effl.x0{color:#C62416;font-size:12px}
#lotta .lt-tip .bchip{display:inline-block;margin:1px 0}
/* grandine: cristalli di ghiaccio che cadono girando */
#lotta .icecr{position:absolute;top:-20px;background:linear-gradient(135deg,#FFFFFF,#BFE6FF 55%,#8CCBF0);clip-path:polygon(50% 0,62% 34%,100% 50%,62% 66%,50% 100%,38% 66%,0 50%,38% 34%);filter:drop-shadow(0 0 3px #E8F7FF);animation:ltIce 2.6s linear infinite,ltSpin 4s linear infinite}
@keyframes ltIce{from{top:-20px}to{top:105%}}
/* vento in coda: una folata ogni tanto */
#lotta .gust.occ{height:2px;width:30%;opacity:0;animation:ltGustOcc 7s ease-out infinite}
@keyframes ltGustOcc{0%{transform:translateX(0);opacity:0}2%{opacity:.9}14%{transform:translateX(420%);opacity:0}100%{transform:translateX(420%);opacity:0}}
#lotta .wind2.p1,#lotta .wind2.p2{clip-path:none}
#lotta .wind2.p1{top:45%;bottom:0;left:0;right:45%;inset:auto;position:absolute;top:45%;left:0;right:45%;bottom:0}
#lotta .wind2.p2{position:absolute;top:0;left:45%;right:0;bottom:50%}
/* schermi: un pannello davanti al Pokémon (dalla parte dell'avversario), non sopra */
#lotta .screen{border-radius:10px;animation:ltScr 2.4s ease-in-out infinite;transform-origin:50% 100%}
#lotta .screen.p2{left:49%;right:auto;top:22%;width:7%;height:34%;transform:skewY(-14deg)}
#lotta .screen.p1{left:41%;top:34%;width:7%;height:34%;transform:skewY(-14deg)}
#lotta .screen+.screen{transform:skewY(-14deg) translateX(-120%)}
#lotta .screen.p1+.screen.p1{transform:skewY(-14deg) translateX(120%)}
#lotta .screen.auroraveil{animation:ltScr 2.4s ease-in-out infinite,ltHue 4s linear infinite}
@media (max-width:820px){
  #lotta .screen.p2{left:46%;top:24%;width:6%;height:30%}
  #lotta .screen.p1{left:38%;top:30%;width:6%;height:32%}
}

#lotta .lt-info .wlabel{display:none!important}
@media (max-width:360px){#lotta .screen.p1{top:24%;height:22%;width:5%}#lotta .screen.p2{width:5%}}
#lotta .lt-tip .binfo{margin:2px 0 4px;padding:4px 6px;background:#EEF3FB;border-radius:6px;border:1px solid #C9D3E6}#lotta .lt-tip .binfo div{margin:1px 0}#lotta .lt-tip{max-height:calc(100vh - 16px);overflow:hidden}
/* ===== Giro 4 ===== */
/* efficacia: riga sopra il nome, sempre presente (nomi allineati) */
#lotta .mv .effl{grid-column:1/-1;grid-row:1;min-height:13px;margin:0 0 -4px;text-align:right;font-size:11px}
#lotta .mv b{grid-row:2}
#lotta .mv .mt,#lotta .mv .pp{grid-row:3}
#lotta .lt-tip .effl{font:900 11px 'Inter',sans-serif;white-space:nowrap}
/* telefono in orizzontale: la scheda va su due colonne così non viene tagliata */
@media (max-height:500px){ #lotta .lt-tip{max-width:min(780px,96vw);font-size:12px;line-height:1.3;columns:2;column-gap:16px;padding:8px 10px} #lotta .lt-tip h4{column-span:all} #lotta .lt-tip dl,#lotta .lt-tip table,#lotta .lt-tip .binfo,#lotta .lt-tip li{break-inside:avoid} #lotta .lt-tip .desc{margin-top:4px;padding-top:4px} }
/* schermi come su Showdown: riquadro trasparente davanti al Pokémon */
#lotta .screen{transform:none!important;border-radius:3px;border-width:2px;background-image:none;animation:none;z-index:4}
#lotta .screen.p2{left:auto;right:9%;top:17%;width:30%;height:35%}
#lotta .screen.p1{left:7%;top:44%;width:33%;height:44%}
#lotta .screen.reflect{background-color:rgba(255,110,150,.22);border-color:rgba(235,80,120,.65);box-shadow:none}
#lotta .screen.lightscreen{background-color:rgba(255,232,70,.3);border-color:rgba(220,190,30,.7);box-shadow:none}
#lotta .screen.auroraveil{background:linear-gradient(135deg,rgba(255,140,200,.25),rgba(140,220,255,.25),rgba(160,255,190,.25));border-color:rgba(255,255,255,.85);box-shadow:none;animation:ltHue 6s linear infinite}
#lotta .screen+.screen{transform:translate(5%,-5%)!important}
#lotta .screen .shine{opacity:.5}
@media (max-width:820px){
  #lotta .screen.p2{right:6%;top:18%;width:37%;height:32%}
  #lotta .screen.p1{left:4%;top:50%;width:40%;height:44%}
}
@media (max-width:360px){#lotta .screen.p1{top:50%;height:44%;width:40%}#lotta .screen.p2{width:37%}}

#lotta .screen.p1{z-index:2}
#lotta .sbst .bchip{font:800 8px/1.25 'Inter',sans-serif;padding:0 2px;border-radius:3px;border:1px solid rgba(0,0,0,.3)}
@media (max-width:820px){#lotta .sbst .bchip{font-size:7.5px}}
#lotta .hud.p1{bottom:3%}
@media (max-height:500px) and (orientation:landscape){#lotta .hud.p1{bottom:3%}}
#lotta .psfx,#lotta .pssp,#lotta .psbg{position:absolute;inset:0;pointer-events:none;overflow:hidden}#lotta .psfx{z-index:7}#lotta .pssp{z-index:3}#lotta .psbg{z-index:2}#lotta .psbgfx{position:absolute;inset:0;background-size:cover!important;background-position:center!important}#lotta .psfx img{max-width:none}
#lotta .lt-tools{display:flex;gap:4px;margin-left:auto}#lotta .lt-tools+.btn{margin-left:0}#lotta .tool{font:700 13px 'Inter',sans-serif;border:2px solid var(--line);border-radius:8px;background:#fff;padding:4px 8px;cursor:pointer;box-shadow:0 2px 0 var(--line)}#lotta .tool.off{opacity:.45;text-decoration:line-through}#lotta .lt-logh{all:unset;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font:800 12px 'Inter',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:#2B3A63;padding:6px 10px}#lotta .lt-right.min .lt-logbox{display:none}#lotta .lt-right.min{min-height:0}#lotta .lt-right.min .arr{transform:rotate(-90deg)}#lotta .arr{transition:transform .2s}#lotta .lt-foot{display:flex;justify-content:space-between;align-items:center;margin-top:4px;gap:8px}#lotta .ff{font-size:12px;padding:5px 10px;box-shadow:0 2px 0 var(--line)}#lotta .tmr{font:800 13px 'Inter',sans-serif;color:var(--muted)}#lotta .tmr.low{color:#C62416}#lotta .pass .tmr{display:block}
@media (max-width:820px){#lotta .lt-top{gap:6px}#lotta .lt-tools{order:3;margin-left:0}#lotta .tool{font-size:12px;padding:3px 7px}}
#lotta .ff{min-height:38px}#lotta .tool{min-height:34px}
#lotta .lt-top .ff{font-size:13px;padding:7px 10px;box-shadow:0 3px 0 var(--line)}#lotta .lt-top .ff[data-sure]{background:#FFE3DD;color:#B3150F}#lotta.logmin .lt-right{display:none}#lotta.logmin .lt-main{grid-template-columns:minmax(0,1fr)}#lotta.logmin .lt-left{max-width:760px;margin:0 auto;width:100%}#lotta .lt-reopen{display:none;position:fixed;right:12px;bottom:12px;z-index:65;width:44px;height:44px;border-radius:50%;border:3px solid var(--line);background:#fff;box-shadow:0 3px 0 var(--line);font-size:20px;cursor:pointer;padding:0}#lotta.logmin .lt-reopen{display:block}
@media (max-width:820px){#lotta .lt-top .ff{font-size:12px;padding:5px 8px}}
#lotta .lt-reopen{position:static;width:auto;height:auto;border-radius:8px;font-size:13px;padding:4px 8px;box-shadow:0 2px 0 var(--line);display:none}#lotta.logmin .lt-reopen{display:inline-block}#lotta.logmin .lt-reopen+.lt-tools{margin-left:4px}#lotta .lt-top .lt-reopen{margin-left:auto}
@media (max-width:820px){#lotta .lt-reopen{font-size:12px;padding:3px 7px}#lotta .lt-top .lt-reopen{margin-left:0;order:3}}
#lotta .haz.p1,#lotta .haz.p2{left:0!important;right:0!important;top:0!important;bottom:0!important;width:auto!important;height:auto!important;border-radius:0}#lotta .hzi{position:absolute;display:block;pointer-events:none;animation:hzIn .35s ease-out}@keyframes hzIn{from{opacity:0;transform:translateY(-30%)}}
#lotta .haz.p1,#lotta .haz.p2{z-index:4}
#lotta .haz.p1{z-index:2!important}
#lotta .lt-side{display:flex;flex-direction:column;gap:10px;min-width:0;position:sticky;top:0}#lotta .lt-side .lt-right{position:static}#lotta .lt-chatp{display:flex;flex-direction:column;background:#fff;border:3px solid var(--line);border-radius:12px;box-shadow:0 4px 0 var(--line);overflow:hidden;max-height:300px}#lotta .lt-chatp[hidden]{display:none}#lotta .lt-chatbox{flex:1;overflow:auto;padding:8px 10px;font-size:13.5px;min-height:90px;max-height:200px}#lotta .cm{margin:2px 0;overflow-wrap:anywhere}#lotta .cm.mine b{color:var(--p1)}#lotta .cm:not(.mine) b{color:var(--p2)}#lotta .lt-chatin{display:flex;gap:6px;padding:6px;border-top:2px solid #E3E8F2}#lotta .lt-chatin input{flex:1;min-width:0;font:15px 'Inter',sans-serif;border:2px solid var(--line);border-radius:8px;padding:7px 9px}#lotta .lt-chatin .btn{padding:6px 12px;font-size:14px;box-shadow:0 2px 0 var(--line)}#lotta .lt-chatopen{display:none}#lotta.online.chatmin .lt-chatopen{display:inline-block}#lotta.chatmin .lt-chatp{display:none}#lotta .unread{display:inline-block;margin-left:4px;background:#E3350D;color:#fff;border-radius:99px;font-size:10px;padding:0 5px}#lotta.logmin .lt-main{grid-template-columns:minmax(0,680px) minmax(260px,1fr)}#lotta.logmin:not(.online) .lt-main,#lotta.logmin.chatmin .lt-main{grid-template-columns:minmax(0,1fr)}#lotta.logmin.online:not(.chatmin) .lt-left{max-width:none;margin:0}#lotta.logmin:not(.online) .lt-side,#lotta.logmin.chatmin .lt-side{display:none}
@media (max-width:820px){#lotta .lt-side{position:static;order:3}#lotta .lt-chatbox{max-height:160px}#lotta .lt-top .lt-chatopen{order:3}}
#lotta .lt-chatin input{font-size:16px}
#lotta .mon.p1b,#lotta .mon.p2b,#lotta .hud.p1b,#lotta .hud.p2b{display:none}
#lotta.dbl .mon.p1b,#lotta.dbl .mon.p2b{display:flex}#lotta.dbl .hud.p1b:not([hidden]),#lotta.dbl .hud.p2b:not([hidden]){display:flex}
#lotta.dbl .hud{width:clamp(130px,34%,220px)}
#lotta.dbl .hud.p2{left:2%;right:auto;top:2%;bottom:auto}#lotta.dbl .hud.p2b{left:2%;right:auto;top:max(27%,calc(2% + 80px));bottom:auto}
#lotta.dbl .hud.p1{right:2%;left:auto;bottom:2%;top:auto}#lotta.dbl .hud.p1b{right:2%;left:auto;bottom:max(27%,calc(2% + 66px));top:auto}
#lotta.dbl .mon.p2{right:30%;left:auto;top:15%;width:24%;height:36%}#lotta.dbl .mon.p2b{right:4%;left:auto;top:19%;width:24%;height:36%}
#lotta.dbl .mon.p1{left:0;bottom:3%;width:30%;height:46%}#lotta.dbl .mon.p1b{left:27%;bottom:7%;width:27%;height:42%}
#lotta.dbl .mon.p1 img,#lotta.dbl .mon.p1b img{transform:none}
#lotta.dbl .pad.p2{right:2%;width:56%}#lotta.dbl .pad.p1{left:-2%;width:60%}
#lotta .slotn{font:800 11px 'Inter',sans-serif;color:#fff;background:#2B3A63;border-radius:99px;padding:1px 8px}
#lotta .back{font-size:12px;padding:4px 10px;margin-left:auto;box-shadow:0 2px 0 var(--line)}
#lotta .effrow{grid-column:1/-1;grid-row:1;display:flex;justify-content:flex-end;gap:3px;min-height:13px;margin-bottom:-4px;font:900 11px 'Inter',sans-serif}#lotta .effrow .effl{grid-column:auto;margin:0}#lotta .effsep{color:#9AA6BC}
#lotta .lt-team.tg{grid-template-columns:repeat(4,1fr)}#lotta .tgl{font:800 10px 'Inter',sans-serif;border-radius:5px;padding:0 5px;color:#fff}#lotta .tgl.foe{background:#C62416}#lotta .tgl.ally{background:#2E8B3E}
@media (max-width:820px){
  #lotta.dbl .hud{width:42%}#lotta.dbl .hud.p2b{top:max(25%,calc(2% + 72px))}#lotta.dbl .hud.p1b{bottom:max(25%,calc(2% + 62px))}
  #lotta.dbl .mon.p2{right:28%;width:28%;top:13%;height:33%}#lotta.dbl .mon.p2b{right:1%;width:28%;top:17%;height:33%}
  #lotta.dbl .mon.p1{left:0;width:28%;height:40%}#lotta.dbl .mon.p1b{left:26%;width:28%;height:36%;bottom:4%}#lotta.dbl .lt-team.tg{grid-template-columns:repeat(2,1fr)}
}
/* riquadri degli allenatori fuori dal campo (stile Showdown): avatar, nome e squadra */
#lotta .lt-stage{display:grid;grid-template-columns:124px minmax(0,1fr) 124px;grid-template-areas:"t1 ar t2";gap:8px;align-items:stretch}
#lotta .lt-stage>.arena{grid-area:ar;min-width:0}
#lotta .trainer{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;font:800 12px/1.2 'Inter',sans-serif;color:var(--line)}
#lotta .trainer.p1{grid-area:t1;justify-content:flex-end}#lotta .trainer.p2{grid-area:t2;justify-content:flex-start}
#lotta .trainer .avatar,#lotta .trainer .lt-av0{width:72px;height:72px;box-shadow:0 3px 0 var(--line)}
#lotta .lt-av0{display:inline-grid;place-items:center;flex:none;border-radius:12px;border:3px solid var(--line);background:#fff;font:900 26px 'Inter',sans-serif;color:var(--line)}
#lotta .trainer .tnm{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
#lotta .trainer{--k:1}
#lotta .tteam{display:grid;grid-template-columns:repeat(3,calc(40px*var(--k)));gap:2px 0;justify-content:center}
#lotta .tpk{width:calc(40px*var(--k));height:calc(30px*var(--k));display:grid;place-items:center;position:relative;padding:0;border:0;background:none;cursor:help}
#lotta .pkic{display:block;width:calc(40px*var(--k));height:calc(30px*var(--k));background:url(sprites/pokemonicons-sheet.png) no-repeat;background-size:calc(480px*var(--k)) auto;background-position:calc(var(--c)*-40px*var(--k)) calc(var(--r)*-30px*var(--k))}
#lotta .pkic{image-rendering:pixelated}@media (max-width:1199px),(max-height:500px){#lotta .pkic{image-rendering:auto}}
#lotta .tpk.ball img{width:calc(20px*var(--k));height:calc(20px*var(--k))}

#lotta .tpk.ball{cursor:default}
#lotta .tpk.ko .pkic{opacity:.35;filter:grayscale(1)}
#lotta .tpk.stx::after{content:'';position:absolute;right:1px;bottom:1px;width:7px;height:7px;border-radius:50%;background:#F2C21B;border:1.5px solid var(--line)}
@media (min-width:821px) and (min-height:501px){#lotta .lt-main{grid-template-columns:minmax(0,950px) minmax(260px,1fr)}#lotta.logmin .lt-left{max-width:1030px}}
@media (min-width:821px) and (max-width:1199px) and (min-height:501px){#lotta .lt-main{grid-template-columns:minmax(0,1fr) minmax(220px,30%)}#lotta .lt-stage{grid-template-columns:84px minmax(0,1fr) 84px;gap:6px}#lotta .trainer .avatar,#lotta .trainer .lt-av0{width:58px;height:58px}#lotta .trainer{--k:.65}}
@media (max-width:820px){
  #lotta .lt-stage{grid-template-columns:minmax(0,1fr);grid-template-areas:"t2" "ar" "t1";gap:5px}
  #lotta .trainer{flex-direction:row;justify-content:flex-start;gap:6px;background:#fff;border:2px solid var(--line);border-radius:10px;padding:2px 6px 2px 3px}
  #lotta .trainer .avatar,#lotta .trainer .lt-av0{width:32px;height:32px;border-width:2px;box-shadow:none;font-size:15px}
  #lotta .trainer .tnm{flex:1;text-align:left}
  #lotta .trainer{--k:.8}#lotta .tteam{display:flex;gap:0;margin-left:auto}
}
@media (max-width:360px){#lotta .trainer{--k:.65}#lotta .trainer .avatar,#lotta .trainer .lt-av0{width:28px;height:28px}}
@media (max-height:500px) and (orientation:landscape){
  #lotta .lt-stage{grid-template-columns:70px minmax(0,1fr) 70px;grid-template-areas:"t1 ar t2";gap:5px}
  #lotta .trainer{flex-direction:column;background:none;border:0;padding:0;gap:3px;font-size:10px}
  #lotta .trainer.p1{justify-content:flex-end}#lotta .trainer.p2{justify-content:flex-start}
  #lotta .trainer .avatar,#lotta .trainer .lt-av0{width:44px;height:44px;border-width:2px}
  #lotta .trainer .tnm{flex:none;text-align:center}
  #lotta .trainer{--k:.55}#lotta .tteam{display:grid;grid-template-columns:repeat(3,calc(40px*var(--k)));margin-left:0}
}`;
const {BattleStreams, Teams, Dex} = PkmnSim;
const TYPE_COLORS={Normal:'#A8A77A',Fire:'#EE8130',Water:'#6390F0',Electric:'#D9B300',Grass:'#5FAE34',Ice:'#4FB8C9',Fighting:'#C22E28',
  Poison:'#A33EA1',Ground:'#C9A23E',Flying:'#8A6FE0',Psychic:'#F95587',Bug:'#8FA015',Rock:'#A8922A',Ghost:'#735797',Dragon:'#6F35FC',
  Dark:'#705746',Steel:'#8E8EAE',Fairy:'#D46AA0',Stellar:'#3A8FB7','???':'#68A090'};
const TIPI={Normal:'Normale',Fire:'Fuoco',Water:'Acqua',Electric:'Elettro',Grass:'Erba',Ice:'Ghiaccio',Fighting:'Lotta',Poison:'Veleno',Ground:'Terra',
  Flying:'Volante',Psychic:'Psico',Bug:'Coleottero',Rock:'Roccia',Ghost:'Spettro',Dragon:'Drago',Dark:'Buio',Steel:'Acciaio',Fairy:'Folletto',Stellar:'Astrale'};
const STAT={hp:'PS',atk:'Attacco',def:'Difesa',spa:'Att. Sp.',spd:'Dif. Sp.',spe:'Velocità',accuracy:'Precisione',evasion:'Elusione'};
const STATUS={brn:'è scottato',par:'è paralizzato e potrebbe non muoversi',slp:'si è addormentato',psn:'è avvelenato',tox:'è gravemente avvelenato',frz:'è congelato'};
const WEATHER={RainDance:'Pioggia',SunnyDay:'Sole intenso',Sandstorm:'Tempesta di sabbia',Snowscape:'Neve',Hail:'Grandine',DesolateLand:'Sole estremo',PrimordialSea:'Diluvio',DeltaStream:'Correnti misteriose'};
const WSTART={RainDance:'Inizia a piovere!',SunnyDay:'La luce del sole è intensa!',Sandstorm:'Si alza una tempesta di sabbia!',Snowscape:'Inizia a nevicare!',Hail:'Inizia a grandinare!',DesolateLand:'Il sole è diventato rovente!',PrimordialSea:'Inizia un diluvio!',DeltaStream:'Soffiano correnti misteriose!'};
const CAT={Physical:'Fisica',Special:'Speciale',Status:'Stato'};
const EVN={hp:'PS',atk:'Att',def:'Dif',spa:'AtSp',spd:'DfSp',spe:'Vel'};
const CAUSE={psn:'il veleno',tox:'il veleno',brn:'la scottatura','Stealth Rock':'le rocce aguzze',Spikes:'le punte',Sandstorm:'la tempesta di sabbia',Hail:'la grandine',Recoil:'il contraccolpo',confusion:'la confusione'};
const SIDECOND={stealthrock:['Stealth Rock','Rocce aguzze fluttuano intorno alla squadra di'],spikes:['Spikes','Punte sparse sotto la squadra di'],toxicspikes:['Toxic Spikes','Punte velenose sparse sotto la squadra di'],
  stickyweb:['Sticky Web','Una rete vischiosa è tesa sotto la squadra di'],reflect:['Reflect','Reflect protegge la squadra di'],lightscreen:['Light Screen','Light Screen protegge la squadra di'],
  auroraveil:['Aurora Veil','Aurora Veil protegge la squadra di'],tailwind:['Tailwind','Tailwind soffia alle spalle di'],safeguard:['Safeguard','Safeguard protegge la squadra di'],mist:['Mist','La nebbia avvolge la squadra di']};
const CENTER={p1:[23,72],p2:[76,32]};
// descrizione in italiano se c'è (k: m mosse, a abilità, i strumenti), altrimenti quella inglese del motore
function descIt(k,id,en){ if(O&&O.lang==='en'||typeof DESC_IT==='undefined') return en; const D=DESC_IT[k]||{}; return D[id]||(k==='m'&&/^hiddenpower/.test(id)&&D.hiddenpower)||en; }
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toID=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const other=s=>s==='p1'?'p2':'p1';
// window.__LOTTA_FAST: modalità di prova senza animazioni (solo per i test automatici)
const sleep=ms=>new Promise(r=>setTimeout(r,window.__LOTTA_FAST?0:ms));
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
function viewer(){ return O.mode==='cpu'||O.role?'p1':(B.passTo||null); }
function setVisible(s){ return O.showOpp||viewer()===s; }
function exactHP(s){ return !(O&&O.role&&s==='p2'); }   // PS mostrati in numeri per entrambi (scelta dell'utente)

// ---------- stato ----------
function fresh(){ return {streams:null, nreq:0, req:{p1:null,p2:null}, answered:{p1:null,p2:null}, queue:[], busy:false, over:false, log:[],
  sets:{p1:[],p2:[]}, side:{p1:{act:null,actb:null,team:{}},p2:{act:null,actb:null,team:{}}}, cond:{p1:{},p2:{}}, weather:null, field:{}, err:'', passTo:null, fx:{}, turn:0, start:{}, timerOn:false, tSid:null, tEnd:0, timeouts:{}, eff:null}; }
function parseId(s){ const m=/^(p[12])([a-z]?): (.*)$/.exec(s||''); return m?{side:m[1],nick:m[3],pos:m[1]+(m[2]==='b'?'b':'')}:null; }
const isDbl=()=>!!(O&&O.dbl);
const sideOfPos=p=>String(p).slice(0,2);
const slotK=p=>String(p).length>2?'actb':'act';
function actMon(pos){ const s=B.side[sideOfPos(pos)]; if(!s) return null; const n=s[slotK(pos)]; return n?s.team[n]:null; }
// centro di un Pokémon in campo, in percentuale del campo
function cen(pos){ const ar=$('arena').getBoundingClientRect(), el=$('mon'+pos); if(!el||!ar.width) return [50,50]; const r=(el.querySelector('img')||el).getBoundingClientRect(); return [(r.left-ar.left+r.width/2)/ar.width*100,(r.top-ar.top+r.height/2)/ar.height*100]; }
function parseHP(c){ if(!c) return null; const [hp,st]=c.split(' '); if(hp==='0') return {hp:0,max:0,st:'fnt'}; const [a,b]=hp.split('/').map(Number); return {hp:a,max:b||100,st:st||''}; }
function setOf(sid,species){ const sp=Dex.species.get(species); return B.sets[sid].find(s=>{ const x=Dex.species.get(s.species); return x.name===sp.name||x.baseSpecies===sp.baseSpecies; }); }
function mon(sid,nick){ const s=B.side[sid]; if(!s.team[nick]){ const set=B.sets[sid].find(x=>x.name===nick||Dex.species.get(x.species).baseSpecies===nick||x.species===nick)||{};
    s.team[nick]={nick,species:set.species||nick,hp:1,max:1,shown:1,st:'',boosts:{},item:set.item||null,itemSeen:false,shiny:set.shiny}; } return s.team[nick]; }
const label=id=>{ const p=parseId(id); if(!p) return id; const m=mon(p.side,p.nick); return esc(m.species)+(p.side==='p2'?' di '+PN('p2'):''); };

// ---------- disegno ----------
function boostChips(m){ const S={atk:'Att',def:'Dif',spa:'AtSp',spd:'DfSp',spe:'Vel',accuracy:'Prec',evasion:'Elus'}; return Object.entries(m.boosts).filter(([,v])=>v).map(([k,v])=>`<span class="bchip ${v>0?'up':'down'}">${S[k]||k}${v>0?'+':'−'}${Math.abs(v)}</span>`).join(''); }
function hpView(sid){ const m=actMon(sid); if(!m) return;
  const f=$('fill'+sid), n=$('num'+sid), pc=$('pct'+sid); if(!f) return; const pct=m.max?Math.max(0,m.shown/m.max*100):0;
  f.style.width=pct+'%'; f.className='fill '+(pct<=20?'low':pct<=50?'mid':'');
  pc.textContent=Math.ceil(pct)+'%'; n.textContent=exactHP(sideOfPos(sid))?`${Math.max(0,Math.round(m.shown))}/${m.max}`:''; }
function drawSide(x){ if(String(x).length>2){ drawPos(x); ballsDbl(); return; } drawPos(x); drawPos(x+'b'); ballsDbl(); }
// in doppio le Poké Ball dell'avversario vanno sotto la sua seconda barra (così stanno sotto a entrambe, non in mezzo)
// in doppio le due barre di ogni lato stanno attaccate (si toccano quasi), in modo simmetrico: avversario dall'alto, proprio lato dal basso
function stackDbl(){ if(!isDbl()||!root) return; const ar=$('arena'), h2=$('hudp2'), h2b=$('hudp2b'), h1=$('hudp1'), h1b=$('hudp1b'); if(!ar) return; const gap=-3;
  if(h2&&h2b){ h2b.style.top=(!h2.hidden?h2.offsetTop+h2.offsetHeight+gap:h2.offsetTop)+'px'; }
  if(h1&&h1b){ h1b.style.bottom=(!h1.hidden?ar.clientHeight-h1.offsetTop+gap+3:ar.clientHeight-h1.offsetTop-h1.offsetHeight)+'px'; } }
function ballsDbl(){ if(isDbl()) setTimeout(stackDbl,0); }
// effetti temporanei mostrati come su Showdown (etichette sotto la barra dei PS)
const VOL={confusion:'Confuso',leechseed:'Leech Seed',taunt:'Taunt',encore:'Encore',yawn:'Yawn',focusenergy:'Focus Energy',attract:'Infatuato',curse:'Curse',disable:'Disable',embargo:'Embargo',healblock:'Heal Block',magnetrise:'Magnet Rise',aquaring:'Aqua Ring',ingrain:'Ingrain',flashfire:'Flash Fire',slowstart:'Slow Start',protosynthesis:'Protosynthesis',quarkdrive:'Quark Drive',charge:'Charge',torment:'Torment',nightmare:'Nightmare',powertrick:'Power Trick',smackdown:'Smack Down',telekinesis:'Telekinesis',throatchop:'Throat Chop',saltcure:'Salt Cure',syrupbomb:'Syrup Bomb',tarshot:'Tar Shot',imprison:'Imprison',laserfocus:'Laser Focus',miracleeye:'Miracle Eye',foresight:'Foresight',odorsleuth:'Odor Sleuth',noretreat:'No Retreat',octolock:'Octolock',partiallytrapped:'Intrappolato',doomdesire:'Doom Desire',futuresight:'Future Sight',gastroacid:'Gastro Acid',glaiverush:'Glaive Rush',minimize:'Minimize',defensecurl:'Defense Curl',dynamax:'Dynamax',substitute:'Substitute'};
const STATN={atk:'Att.',def:'Dif.',spa:'Att.Sp.',spd:'Dif.Sp.',spe:'Vel.'};
function volLabel(n,extra){ const id=toID(n); if(/^perish(\d)$/.test(id)) return 'Perish Song '+id.slice(-1); if(/^stockpile(\d)$/.test(id)) return 'Stockpile '+id.slice(-1);
  if((id==='protosynthesis'||id==='quarkdrive')&&extra){ const s=String(extra).replace(/^(protosynthesis|quarkdrive)/i,'').toLowerCase(); return VOL[id]+(STATN[s]?': '+STATN[s]:''); } return VOL[id]||n; }
function volChips(m){ const out=[]; if(m.tchange&&m.tchange.length) out.push(`<span class="st vol">${m.tchange.map(x=>(TIPI[x]||x)).join('/')}</span>`);
  for(const v of Object.values(m.vol||{})) if(v!=='Substitute') out.push(`<span class="st vol">${esc(v)}</span>`); return out.join(''); }
const VOLMSG={confusion:a=>`${a} è confuso!`,leechseed:a=>`${a} è stato colpito da Leech Seed!`,taunt:a=>`${a} cade nella provocazione!`,encore:a=>`${a} è costretto da Encore!`,yawn:a=>`${a} diventa sonnolento!`,focusenergy:a=>`${a} si concentra al massimo!`,attract:a=>`${a} si è infatuato!`,curse:a=>`${a} è maledetto!`,disable:(a,x)=>`La mossa ${esc(x||'')} di ${a} è bloccata!`,
  healblock:a=>`${a} non può curarsi!`,magnetrise:a=>`${a} levita grazie al magnetismo!`,aquaring:a=>`${a} si circonda di un velo d'acqua!`,ingrain:a=>`${a} mette radici!`,flashfire:a=>`La potenza delle mosse Fuoco di ${a} aumenta!`,slowstart:a=>`${a} non riesce a carburare!`,protosynthesis:(a,x)=>`Protosynthesis potenzia ${a}${STAT[x]?' ('+STAT[x]+')':''}!`,quarkdrive:(a,x)=>`Quark Drive potenzia ${a}${STAT[x]?' ('+STAT[x]+')':''}!`,charge:a=>`${a} si carica di elettricità!`,torment:a=>`${a} è tormentato!`,smackdown:a=>`${a} cade a terra!`,saltcure:a=>`${a} è colpito da Salt Cure!`,tarshot:a=>`${a} diventa più debole al fuoco!`,noretreat:a=>`${a} non può più fuggire!`,partiallytrapped:a=>`${a} è intrappolato!`,futuresight:a=>`${a} prevede un attacco!`,doomdesire:a=>`${a} sceglie Doom Desire come destino!`,gastroacid:a=>`L'abilità di ${a} viene annullata!`,laserfocus:a=>`${a} si concentra intensamente!`,minimize:a=>`${a} si rimpicciolisce!`};
const TEAM_GUARDS=['Wide Guard','Quick Guard','Crafty Shield','Mat Block'];
const PROTECTS=['Protect','Detect',"King's Shield",'Spiky Shield','Baneful Bunker','Silk Trap','Burning Bulwark','Obstruct','Max Guard'];
// scudo trasparente intorno al Pokémon protetto (fino alla fine del turno)
function shieldOn(pos){ const el=$('mon'+pos); if(!el||el.querySelector('.shield')) return; const s=document.createElement('div'); s.className='shield'; el.appendChild(s); }
function shieldsOff(){ if(root) root.querySelectorAll('#lotta .shield').forEach(x=>x.remove()); }
function drawPos(sid){ const side=sideOfPos(sid);
  const s=B.side[side], m=actMon(sid), hud=$('hud'+sid), el=$('mon'+sid); if(!hud||!el) return;
  if(!m||m.st==='fnt'){ hud.hidden=true; if(!m&&sid!==side){ el.innerHTML=''; el.dataset.sp=''; } if(m){ el.classList.add('faint'); setTimeout(stackDbl,0); } return; }
  hud.hidden=false;
  const seeItem=setVisible(side)||m.itemSeen;
  hud.innerHTML=`<div class="sb" data-tip="act:${sid}"><div class="sbn"><b>${esc(m.species)}</b>${m.shiny?'<i class="shy">✨</i>':''}<small>L100</small></div>
    <div class="sbbar"><div class="tr"><div class="fill" id="lt-fill${sid}"></div></div><span class="pct" id="lt-pct${sid}"></span></div>
    <div class="sbst">${m.st&&m.st!=='fnt'?`<span class="st ${m.st}">${m.st.toUpperCase()}</span>`:''}${m.tera?`<span class="st" style="background:${TYPE_COLORS[m.tera]||'#666'}">TERA ${(TIPI[m.tera]||m.tera).toUpperCase()}</span>`:''}${boostChips(m)}${volChips(m)}<span class="hpn" id="lt-num${sid}"></span></div></div>`;
  hpView(sid);
  const key=m.species+(m.shiny?'*':'');
  if(el.dataset.sp!==key){ el.dataset.sp=key; el.innerHTML=spriteImg(m.species,side==='p1',m.shiny);
    const im=el.querySelector('img[data-front]'); if(im) im.onerror=()=>{ if(im.dataset.front){ im.src=im.dataset.front; im.dataset.front=''; im.classList.add('flip'); } }; }
  el.classList.toggle('sub',!!m.sub);
}
// ---------- scenari del campo di lotta (disegni originali in SVG, ispirati ai campi dei giochi) ----------
const SCENES=['prato','spiaggia','foresta','grotta','citta'];
const SCENE_NAMES={prato:'Prato',spiaggia:'Spiaggia',foresta:'Foresta',grotta:'Grotta',citta:'Stadio in città'};
const rnd=(a,b)=>a+Math.random()*(b-a);
const rint=(a,b)=>Math.floor(rnd(a,b+1));
function sceneSVG(sc){
  const g=(id,stops,v)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${v?0:1}" y2="${v?1:0}">${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}"${op!=null?` stop-opacity="${op}"`:''}/>`).join('')}</linearGradient>`;
  const rg=(id,stops,cx,cy,r)=>`<radialGradient id="${id}" cx="${cx||.5}" cy="${cy||.5}" r="${r||.5}">${stops.map(([o,c,op])=>`<stop offset="${o}" stop-color="${c}"${op!=null?` stop-opacity="${op}"`:''}/>`).join('')}</radialGradient>`;
  const cloud=(x,y,s,o)=>`<g class="drift" style="animation-duration:${rint(60,110)}s;animation-delay:-${rint(0,60)}s" opacity="${o||.95}"><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="20" rx="90" ry="26" fill="#fff"/><circle cx="-40" cy="8" r="30" fill="#fff"/><circle cx="5" cy="-6" r="40" fill="#fff"/><circle cx="48" cy="10" r="28" fill="#fff"/><ellipse cx="0" cy="34" rx="86" ry="12" fill="#DDEBF7"/></g></g>`;
  const tuft=(x,y,s,c)=>`<path d="M${x} ${y} q${-4*s} ${-10*s} ${-9*s} ${-14*s} M${x} ${y} q${1*s} ${-12*s} ${2*s} ${-18*s} M${x} ${y} q${5*s} ${-9*s} ${11*s} ${-12*s}" stroke="${c}" stroke-width="${2.2*s}" fill="none" stroke-linecap="round"/>`;
  const tufts=(n,y0,y1,c)=>Array.from({length:n},()=>{ const y=rnd(y0,y1); return tuft(rnd(0,1600),y,.6+(y-y0)/(y1-y0)*1.6,c); }).join('');
  let s='';
  if(sc==='prato'){
    s=`<defs>${g('lts1',[[0,'#4FB3F6'],[.75,'#BFE7FF'],[1,'#E8F7FF']],1)}${g('ltg1',[[0,'#A6DC6F'],[.5,'#86C95A'],[1,'#5FAA3C']],1)}${rg('ltsun1',[[0,'#FFFDE8',.95],[1,'#FFFDE8',0]])}</defs>
    <rect width="1600" height="420" fill="url(#lts1)"/><circle cx="1320" cy="90" r="160" fill="url(#ltsun1)"/>
    ${cloud(200,90,1.1)}${cloud(760,60,.8,.9)}${cloud(1180,150,.7,.85)}${cloud(1500,70,.9)}
    <path d="M0 330 Q160 250 360 300 T760 280 T1180 290 T1600 270 V420 H0Z" fill="#9ED18A"/>
    <path d="M0 360 Q240 300 520 345 T1050 330 T1600 340 V420 H0Z" fill="#79BF63"/>
    ${Array.from({length:9},(_,i)=>{const x=80+i*185+rnd(-30,30),y=rnd(318,345),r=rnd(18,30);return `<rect x="${x-3}" y="${y}" width="6" height="${r*.9}" fill="#6B4A2B"/><circle cx="${x}" cy="${y-r*.3}" r="${r}" fill="#4E9A45"/><circle cx="${x-r*.5}" cy="${y}" r="${r*.7}" fill="#5DAA50"/><circle cx="${x+r*.5}" cy="${y-2}" r="${r*.7}" fill="#468E3E"/>`;}).join('')}
    <rect y="378" width="1600" height="522" fill="url(#ltg1)"/>
    <path d="M0 378 Q400 395 800 385 T1600 380" stroke="#C4EA95" stroke-width="6" fill="none" opacity=".7"/>
    ${tufts(140,400,900,'#4E9A3A')}
    ${Array.from({length:40},()=>`<circle cx="${rnd(0,1600)}" cy="${rnd(420,890)}" r="${rnd(3,6)}" fill="${['#FFF','#FFE14D','#FF8FC8','#FFFFFF'][rint(0,3)]}"/>`).join('')}`;
  } else if(sc==='spiaggia'){
    s=`<defs>${g('lts2',[[0,'#3FA9F5'],[.7,'#A9E2FF'],[1,'#FFF2D2']],1)}${g('ltsea2',[[0,'#1F7FC2'],[1,'#6BD3EC']],1)}${g('ltg2',[[0,'#FBE7B5'],[.5,'#F2D492'],[1,'#DDB86C']],1)}${rg('ltsun2',[[0,'#FFF7D0'],[.35,'#FFE89A',.9],[1,'#FFE89A',0]])}</defs>
    <rect width="1600" height="400" fill="url(#lts2)"/><circle cx="260" cy="110" r="190" fill="url(#ltsun2)"/>
    ${cloud(900,80,.8,.85)}${cloud(1350,130,.6,.8)}
    <path d="M1080 300 Q1160 230 1250 268 Q1300 240 1360 300Z" fill="#5E9C6A" opacity=".75"/>
    <rect y="298" width="1600" height="105" fill="url(#ltsea2)"/>
    ${Array.from({length:14},(_,i)=>`<path class="wave" style="animation-delay:-${rnd(0,4).toFixed(1)}s" d="M${rnd(0,1500)} ${310+i*6.5} q20 -5 40 0 t40 0" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('')}
    <rect y="396" width="1600" height="504" fill="url(#ltg2)"/>
    <path class="foam" d="M0 400 Q100 410 200 400 T400 402 T600 398 T800 404 T1000 399 T1200 403 T1400 398 T1600 402 V412 Q1500 418 1400 410 T1200 414 T1000 409 T800 415 T600 409 T400 414 T200 409 T0 414Z" fill="#fff" opacity=".9"/>
    ${Array.from({length:10},()=>`<path d="M${rnd(0,1600)} ${rnd(470,880)} q60 -14 120 0" stroke="#E7C67F" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
    ${Array.from({length:12},()=>{const x=rnd(0,1600),y=rnd(500,880);return rint(0,1)?`<path d="M${x} ${y} l6 -14 l6 14 l14 2 l-11 9 l4 14 l-13 -8 l-13 8 l4 -14 l-11 -9z" fill="#F08A5D"/>`:`<path d="M${x} ${y} a10 10 0 0 1 20 0z" fill="#FDF2E4" stroke="#E0B08A" stroke-width="2"/>`;}).join('')}
    ${[[-30,900,1],[1630,900,-1]].map(([x,y,d])=>`<g transform="translate(${x} ${y}) scale(${d} 1)"><path d="M0 0 Q40 -260 150 -480" stroke="#8A5A2B" stroke-width="34" fill="none" stroke-linecap="round"/>${Array.from({length:7},(_,i)=>`<path d="M${2+i*20} ${-i*68} q10 -4 22 0" stroke="#6E4520" stroke-width="5" fill="none"/>`).join('')}
      <g transform="translate(150 -480)">${[[-200,40],[-120,-60],[0,-90],[120,-40],[170,60],[-60,90]].map(([dx,dy])=>`<path d="M0 0 Q${dx/2} ${dy/2-50} ${dx} ${dy} Q${dx/2+20} ${dy/2-10} 0 0Z" fill="#3E9A4A" stroke="#2C7A37" stroke-width="3"/>`).join('')}<circle cx="0" cy="8" r="16" fill="#7A4A1E"/><circle cx="18" cy="4" r="13" fill="#6A3F18"/></g></g>`).join('')}`;
  } else if(sc==='foresta'){
    s=`<defs>${g('lts3',[[0,'#2D6A4F'],[.55,'#8FC9A0'],[1,'#CDEBC4']],1)}${g('ltg3',[[0,'#5C9A44'],[.5,'#4A8236'],[1,'#335F24']],1)}${g('ltray3',[[0,'#FFFBD1',.55],[1,'#FFFBD1',0]],1)}</defs>
    <rect width="1600" height="420" fill="url(#lts3)"/>
    ${Array.from({length:16},(_,i)=>{const x=i*105+rnd(-20,20),h=rnd(170,260);return `<path d="M${x} ${380} L${x+45} ${380-h} L${x+90} 380Z" fill="#3E7D55" opacity=".7"/>`;}).join('')}
    ${Array.from({length:12},(_,i)=>{const x=i*140+rnd(-30,30),h=rnd(200,300);return `<rect x="${x+38}" y="${380-h*.3}" width="14" height="${h*.3}" fill="#4A3524"/><path d="M${x} ${390-h*.25} L${x+45} ${390-h} L${x+90} ${390-h*.25}Z" fill="#2C5E40"/><path d="M${x+8} ${390-h*.5} L${x+45} ${390-h*1.08} L${x+82} ${390-h*.5}Z" fill="#336B48"/>`;}).join('')}
    ${[[300,120],[700,60],[1100,140]].map(([x,w],i)=>`<path class="ray" style="animation-delay:-${i*1.7}s" d="M${x} 0 L${x+w} 0 L${x+w+260} 620 L${x+120} 620Z" fill="url(#ltray3)"/>`).join('')}
    <rect y="378" width="1600" height="522" fill="url(#ltg3)"/>
    ${tufts(110,400,900,'#2F5E22')}
    ${Array.from({length:45},()=>{const x=rnd(0,1600).toFixed(0),y=rnd(410,890).toFixed(0);return `<ellipse cx="${x}" cy="${y}" rx="${rnd(5,9).toFixed(1)}" ry="${rnd(3,5).toFixed(1)}" fill="${['#C98B2E','#A8642A','#D9B04A','#7A9A3A'][rint(0,3)]}" transform="rotate(${rint(0,180)} ${x} ${y})"/>`;}).join('')}
    ${Array.from({length:6},()=>{const x=rnd(40,1560),y=rnd(560,860),k=rnd(.8,1.4);return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-4" y="-14" width="8" height="16" rx="3" fill="#F3E6CF"/><path d="M-16 -12 Q0 -34 16 -12Z" fill="#D7372E"/><circle cx="-6" cy="-19" r="3" fill="#fff"/><circle cx="5" cy="-16" r="2.4" fill="#fff"/></g>`;}).join('')}
    <path d="M-40 900 L-40 0 L60 0 Q40 300 90 520 Q120 700 70 900Z" fill="#3B2A1C"/><path d="M1640 900 L1640 0 L1530 0 Q1560 320 1510 560 Q1490 720 1540 900Z" fill="#3B2A1C"/>
    ${Array.from({length:22},(_,i)=>`<circle cx="${i*76+rnd(-20,20)}" cy="${rnd(-40,30)}" r="${rnd(60,95)}" fill="${['#1F4D33','#255A3B','#2E6B45'][i%3]}"/>`).join('')}`;
  } else if(sc==='grotta'){
    s=`<defs>${g('lts4',[[0,'#1E1A2E'],[.6,'#3B3152'],[1,'#4E4363']],1)}${g('ltg4',[[0,'#6A5D78'],[.5,'#54496A'],[1,'#3A3150']],1)}${rg('ltglow4',[[0,'#9FD8FF',.55],[1,'#9FD8FF',0]])}${rg('ltvig4',[[.55,'#000',0],[1,'#000',.55]])}</defs>
    <rect width="1600" height="420" fill="url(#lts4)"/>
    ${Array.from({length:20},()=>`<path d="M${rnd(0,1600)} ${rnd(40,360)} l${rnd(40,90)} ${rnd(-30,30)} l${rnd(-20,30)} ${rnd(30,70)} l${rnd(-90,-40)} ${rnd(-10,20)}Z" fill="#2B2440" opacity=".7"/>`).join('')}
    <circle cx="300" cy="300" r="220" fill="url(#ltglow4)"/><circle cx="1250" cy="260" r="200" fill="url(#ltglow4)"/>
    <rect y="378" width="1600" height="522" fill="url(#ltg4)"/>
    ${Array.from({length:14},()=>`<path d="M${rnd(0,1600)} ${rnd(420,880)} l${rnd(30,80)} ${rnd(-8,8)} l${rnd(10,40)} ${rnd(10,30)}" stroke="#3B3150" stroke-width="3" fill="none"/>`).join('')}
    ${Array.from({length:7},(_,i)=>{const x=[120,330,560,1050,1260,1480,820][i],y=[380,400,385,392,384,398,388][i],k=rnd(.7,1.3),c=['#8FE3FF','#C99BFF','#7FF0D2'][i%3];return `<g class="crys" style="animation-delay:-${rnd(0,3).toFixed(1)}s" transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 L-14 -60 L0 -92 L14 -60Z" fill="${c}" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="M-10 0 L-34 -38 L-26 -56 L-12 -30Z" fill="${c}" opacity=".85"/><path d="M10 0 L30 -44 L22 -62 L8 -34Z" fill="${c}" opacity=".85"/><path d="M0 -92 L4 -60 L0 0" stroke="#fff" stroke-opacity=".8" stroke-width="2"/></g>`;}).join('')}
    ${Array.from({length:18},(_,i)=>{const x=i*92+rnd(-20,20),h=rnd(50,150);return `<path d="M${x} -5 L${x+rnd(22,40)} -5 L${x+14} ${h}Z" fill="#2E2742"/><path d="M${x+10} -5 L${x+16} ${h*.8}" stroke="#5C5076" stroke-width="3"/>`;}).join('')}
    ${[[40,900,90,300],[1520,900,80,260],[260,900,40,130],[1380,900,46,150]].map(([x,y,w,h])=>`<path d="M${x-w} ${y} L${x} ${y-h} L${x+w} ${y}Z" fill="#3A3150"/><path d="M${x} ${y-h} L${x+w*.35} ${y}" stroke="#6A5D82" stroke-width="4"/>`).join('')}
    <rect width="1600" height="900" fill="url(#ltvig4)"/>`;
  } else {
    s=`<defs>${g('lts5',[[0,'#2D2A6E'],[.45,'#8C4F9E'],[.8,'#F08A5D'],[1,'#FFC27A']],1)}${g('ltg5',[[0,'#7D8DA0'],[1,'#566477']],1)}${rg('ltlamp5',[[0,'#FFF3B0',.9],[1,'#FFF3B0',0]])}</defs>
    <rect width="1600" height="420" fill="url(#lts5)"/>
    ${Array.from({length:30},()=>`<circle cx="${rnd(0,1600)}" cy="${rnd(10,140)}" r="${rnd(1,2.4)}" fill="#fff" opacity="${rnd(.4,.9).toFixed(2)}"/>`).join('')}
    ${(()=>{let x=-20,o='';while(x<1620){const w=rint(60,130),h=rint(110,280);o+=`<rect x="${x}" y="${380-h}" width="${w}" height="${h}" fill="${['#2E2F57','#3A3B68','#25264A'][rint(0,2)]}"/>`;
      for(let yy=380-h+14;yy<370;yy+=20) for(let xx=x+10;xx<x+w-12;xx+=18) if(Math.random()<.45) o+=`<rect x="${xx}" y="${yy}" width="8" height="10" fill="#FFD772" opacity="${rnd(.5,1).toFixed(2)}"/>`;
      x+=w+rint(0,10);} return o;})()}
    <rect y="318" width="1600" height="64" fill="#3B4156"/>
    ${Array.from({length:40},(_,i)=>`<circle cx="${i*41+rnd(-6,6)}" cy="${rnd(330,368)}" r="${rnd(7,10)}" fill="${['#E85C4A','#3E7BD6','#F2C14E','#6BBF59','#C58BFF','#F4F4F4'][rint(0,5)]}" opacity=".85"/>`).join('')}
    <rect y="374" width="1600" height="10" fill="#E3350D"/>
    <rect y="384" width="1600" height="516" fill="url(#ltg5)"/>
    ${Array.from({length:17},(_,i)=>`<path d="M${800+(i-8)*60} 384 L${800+(i-8)*230} 900" stroke="#6D7C8F" stroke-width="2"/>`).join('')}
    ${[430,500,600,740].map(y=>`<path d="M0 ${y} H1600" stroke="#6D7C8F" stroke-width="2"/>`).join('')}
    <path d="M330 410 L1270 410 L1560 880 L40 880Z" fill="none" stroke="#F5F5F5" stroke-width="7" opacity=".9"/>
    <path d="M800 410 L800 880" stroke="#F5F5F5" stroke-width="5" opacity=".8"/>
    <ellipse cx="800" cy="620" rx="160" ry="60" fill="none" stroke="#F5F5F5" stroke-width="6" opacity=".85"/>
    ${[[110,380],[1490,380]].map(([x,y])=>`<rect x="${x-4}" y="${y-170}" width="8" height="170" fill="#2A2D40"/><rect x="${x-26}" y="${y-182}" width="52" height="16" rx="4" fill="#2A2D40"/><circle cx="${x}" cy="${y-150}" r="140" fill="url(#ltlamp5)"/><rect x="${x-22}" y="${y-178}" width="44" height="8" fill="#FFF6C8"/>`).join('')}`;
  }
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
}

// ---------- meteo, campi e schermi (generati una volta sola quando cambiano) ----------
function weatherHTML(w){
  if(!w) return '';
  if(w==='RainDance'||w==='PrimordialSea'){ const n=w==='PrimordialSea'?110:75;
    return `<div class="w-tint rain"></div>${Array.from({length:n},()=>{const z=rnd(.5,1.3);return `<i class="drop" style="left:${rnd(-10,105).toFixed(1)}%;height:${(14*z).toFixed(0)}px;opacity:${(.35+z*.4).toFixed(2)};animation-duration:${(.75/z).toFixed(2)}s;animation-delay:-${rnd(0,1).toFixed(2)}s"></i>`;}).join('')}
      ${Array.from({length:18},()=>`<i class="splash" style="left:${rnd(2,96).toFixed(1)}%;top:${rnd(46,96).toFixed(1)}%;animation-delay:-${rnd(0,1.2).toFixed(2)}s"></i>`).join('')}`; }
  if(w==='SunnyDay'||w==='DesolateLand'){ const hot=w==='DesolateLand';
    return `<div class="w-tint sunl${hot?' hot':''}"></div>${[[8,0],[24,2.3],[44,4.6],[16,6.9],[34,9.2]].map(([x,d])=>`<i class="beam${hot?' hot':''}" style="left:${x}%;animation-delay:${d}s"></i>`).join('')}`; }
  if(w==='Sandstorm')
    return `<div class="w-tint sand"></div>${Array.from({length:12},()=>`<i class="swirl" style="top:${rnd(4,96).toFixed(1)}%;width:${rnd(5,11).toFixed(0)}%;animation-duration:${rnd(3,5).toFixed(2)}s;animation-delay:-${rnd(0,5).toFixed(2)}s"></i>`).join('')}${Array.from({length:30},()=>{const z=rnd(.5,1.1);return `<i class="grain" style="top:${rnd(0,100).toFixed(1)}%;width:${(2.5*z).toFixed(1)}px;height:${(2.5*z).toFixed(1)}px;animation-duration:${(2.2/z).toFixed(2)}s;animation-delay:-${rnd(0,3).toFixed(2)}s"></i>`;}).join('')}`;
  if(w==='Snowscape'||w==='Hail'){ const hail=w==='Hail';
    return `<div class="w-tint snow"></div><div class="frost"></div>${hail?Array.from({length:6},()=>{const z=rnd(.7,1.4);return `<i class="icecr" style="left:${rnd(0,96).toFixed(1)}%;width:${(14*z).toFixed(0)}px;height:${(14*z).toFixed(0)}px;animation-duration:${(5.5/z).toFixed(2)}s,${rnd(4,8).toFixed(1)}s;animation-delay:-${rnd(0,6).toFixed(2)}s,0s"></i>`;}).join(''):''}${Array.from({length:hail?22:70},()=>{const z=rnd(.5,1.4);return `<i class="${hail?'pellet':'flake'}" style="left:${rnd(-5,100).toFixed(1)}%;width:${((hail?5:7)*z).toFixed(1)}px;height:${((hail?5:7)*z).toFixed(1)}px;opacity:${(.5+z*.35).toFixed(2)};animation-duration:${((hail?2.6:5)/z).toFixed(2)}s,${rnd(2,4).toFixed(1)}s;animation-delay:-${rnd(0,5).toFixed(2)}s,-${rnd(0,3).toFixed(1)}s"></i>`;}).join('')}`; }
  if(w==='DeltaStream') return `<div class="w-tint delta"></div>${Array.from({length:16},()=>`<i class="gust" style="top:${rnd(5,90).toFixed(0)}%;animation-delay:-${rnd(0,2).toFixed(2)}s;animation-duration:${rnd(1,1.8).toFixed(2)}s"></i>`).join('')}`;
  return '';
}
function terrainHTML(t){
  if(!t) return '';
  if(t==='electricterrain') return `<div class="t-tint el"></div><svg viewBox="0 0 1600 520" preserveAspectRatio="none">${Array.from({length:9},()=>{let x=rnd(40,1560),y=rnd(30,480),d=`M${x.toFixed(0)} ${y.toFixed(0)}`;for(let i=0;i<5;i++){x+=rnd(-40,40);y+=rnd(-22,22);d+=` L${x.toFixed(0)} ${y.toFixed(0)}`;}
      return `<path class="bolt" style="animation-delay:-${rnd(0,1.6).toFixed(2)}s;animation-duration:${rnd(1.2,2.2).toFixed(2)}s" d="${d}" stroke="#FFF7A0" stroke-width="5" fill="none" stroke-linejoin="round"/>`;}).join('')}</svg>${Array.from({length:22},()=>`<i class="spark" style="left:${rnd(0,100).toFixed(1)}%;top:${rnd(0,100).toFixed(1)}%;animation-delay:-${rnd(0,1.5).toFixed(2)}s"></i>`).join('')}`;
  if(t==='grassyterrain') return `<div class="t-tint gr"></div><svg viewBox="0 0 1600 520" preserveAspectRatio="none">${Array.from({length:90},()=>{const x=rnd(0,1600),y=rnd(20,515),k=.5+y/520*1.4;
      return `<g class="blade" style="animation-delay:-${rnd(0,3).toFixed(2)}s;transform-origin:${x.toFixed(0)}px ${y.toFixed(0)}px"><path d="M${x} ${y} q${-6*k} ${-16*k} ${-3*k} ${-30*k} M${x} ${y} q${3*k} ${-18*k} ${9*k} ${-26*k} M${x} ${y} q${-1*k} ${-12*k} ${-14*k} ${-18*k}" stroke="${['#3FBF4A','#2FA43C','#6EDB5A'][rint(0,2)]}" stroke-width="${3*k}" fill="none" stroke-linecap="round"/>${Math.random()<.18?`<circle cx="${x+9*k}" cy="${y-26*k}" r="${4*k}" fill="${['#FF8FC8','#FFE14D','#fff'][rint(0,2)]}"/>`:''}</g>`;}).join('')}</svg>`;
  if(t==='mistyterrain') return `<div class="t-tint mi"></div>${Array.from({length:7},(_,i)=>`<i class="fog" style="left:${rnd(-20,80).toFixed(0)}%;top:${rnd(-10,70).toFixed(0)}%;animation-delay:-${(i*2.3).toFixed(1)}s"></i>`).join('')}${Array.from({length:18},()=>`<i class="twinkle" style="left:${rnd(0,100).toFixed(1)}%;top:${rnd(0,100).toFixed(1)}%;animation-delay:-${rnd(0,2).toFixed(2)}s"></i>`).join('')}`;
  if(t==='psychicterrain') return `<div class="t-tint ps"></div>${[0,1,2,3].map(i=>`<i class="ripple" style="animation-delay:-${i*1}s"></i>`).join('')}${Array.from({length:16},()=>`<i class="twinkle ps" style="left:${rnd(0,100).toFixed(1)}%;top:${rnd(0,100).toFixed(1)}%;animation-delay:-${rnd(0,2).toFixed(2)}s"></i>`).join('')}`;
  return '';
}
function trickRoomHTML(){ return `<svg viewBox="0 0 1600 900" preserveAspectRatio="none">${Array.from({length:13},(_,i)=>`<path d="M${800+(i-6)*40} 380 L${800+(i-6)*300} 900" stroke="#D9A8FF" stroke-width="4"/>`).join('')}${[420,480,570,700,880].map(y=>`<path d="M0 ${y} H1600" stroke="#C58BFF" stroke-width="3"/>`).join('')}${Array.from({length:13},(_,i)=>`<path d="M${800+(i-6)*40} 380 L${800+(i-6)*300} -140" stroke="#C58BFF" stroke-width="2" opacity=".5"/>`).join('')}</svg>`; }
function screenHTML(sid,k){ return `<div class="screen ${sid} ${k}"><i class="shine"></i></div>`; }

// Rocce, punte, punte velenose e ragnatela come su Showdown (addSideCondition in battle-animations.ts): stesse
// immagini e posizioni, convertite nel nostro campo e salvate in percentuale (restano giuste se lo schermo cambia).
function hazLayoutKey(){ const A=$('arena'); return A?Math.round(A.clientWidth/20)+'x'+Math.round(A.clientHeight/20):''; }
function hazardsHTML(sid,c){
  const ar=$('arena'), A=ar.getBoundingClientRect(); if(!A.width) return '';
  // punto di riferimento: il centro della pedana (il terreno), alzato come il centro di uno sprite di Showdown,
  // così con le stesse coordinate di Showdown le rocce e le punte cadono a terra attorno ai piedi del Pokémon
  const z=sid==='p1'?0:200, sc=(1.5-0.5*z/200)*(A.width/640), far=sid==='p2', leftof=o=>(far?1:-1)*o;
  const pad=ar.querySelector('.pad.'+sid).getBoundingClientRect(), cx=pad.left-A.left+pad.width/2, cy=pad.top-A.top+pad.height/2-38*sc;
  const big=Math.min(1.9,Math.max(1,560/A.width))*(sid==='p1'?0.6:1);   // dalla propria parte più piccole   // sui campi piccoli (telefono) le immagini restano visibili
  const im=(file,w,h,x,y,scale,op,cls)=>{ const W=w*sc*scale*big, H=h*sc*scale*big, L=cx+x*sc-W/2, T=cy-y*sc-H/2;
    return `<img class="hzi ${cls||''}" alt="" src="sprites/fx/${file}" style="left:${(L/A.width*100).toFixed(2)}%;top:${(T/A.height*100).toFixed(2)}%;width:${(W/A.width*100).toFixed(2)}%;height:${(H/A.height*100).toFixed(2)}%;opacity:${op}">`; };
  let h='';
  if(c.stealthrock) h+=im('rock1.png',64,80,leftof(-40),-10,.2,.5)+im('rock2.png',66,72,leftof(-20),-40,.2,.5)+im('rock1.png',64,80,leftof(30),-20,.2,.5)+im('rock2.png',66,72,leftof(10),-30,.2,.5);
  const sp=c.spikes||0; if(sp>=1) h+=im('caltrop.png',80,80,-25,-40,.3,1); if(sp>=2) h+=im('caltrop.png',80,80,30,-45,.3,1); if(sp>=3) h+=im('caltrop.png',80,80,50,-40,.3,1);
  const ts=c.toxicspikes||0; if(ts>=1) h+=im('poisoncaltrop.png',80,80,5,-40,.3,1); if(ts>=2) h+=im('poisoncaltrop.png',80,80,-15,-35,.3,1);
  if(c.stickyweb) h+=im('web.png',120,122,15,-35,.7,.4);
  return h;
}
function setFx(el,key,make){ if(B.fx[el.id]!==key){ B.fx[el.id]=key; el.innerHTML=make(); } }
function drawField(){
  for(const sid of ['p1','p2']){ const c=B.cond[sid], key=JSON.stringify(c);
    setFx($('haz'+sid),key+'|'+hazLayoutKey(),()=>hazardsHTML(sid,c));
    setFx($('scr'+sid),key,()=>['reflect','lightscreen','auroraveil'].filter(k=>c[k]).map(k=>screenHTML(sid,k)).join('')+(c.tailwind?`<div class="wind2 ${sid}">${Array.from({length:4},(_,i)=>`<i class="gust occ" style="top:${(20+i*18+rnd(-6,6)).toFixed(0)}%;animation-delay:${(i*1.7+rnd(0,.6)).toFixed(2)}s"></i>`).join('')}</div>`:''));
  }
  const w=$('wfx'); w.hidden=!B.weather; setFx(w,B.weather||'',()=>weatherHTML(B.weather));
  const terr=Object.keys(B.field).find(k=>k.endsWith('terrain')); const tf=$('tfx'); tf.hidden=!terr; setFx(tf,terr||'',()=>terrainHTML(terr));
  const rf=$('rfx'); rf.hidden=!B.field.trickroom; setFx(rf,B.field.trickroom?'t':'',()=>B.field.trickroom?trickRoomHTML():'');
  const lab=[]; if(B.weather) lab.push(WEATHER[B.weather]||B.weather); for(const k in B.field) lab.push(B.field[k]);
  $('wlabel').innerHTML=lab.map(x=>`<span>${esc(x)}</span>`).join('');
}
function draw(){ drawSide('p1'); drawSide('p2'); drawField(); drawTrainers(); }
// ---------- riquadri degli allenatori (avatar, nome e squadra, stile Showdown) ----------
function avId(sid){ const A=typeof Avatar!=='undefined'?Avatar:null; if(!A) return null; const id=O.avatars&&O.avatars[sid]; if(A.valid(id)) return id;
  if(sid==='p1') return A.def;   // avversario senza avatar: uno fisso ricavato dal nome (lo stesso allenatore ha sempre la stessa faccia)
  const L=A.trainers&&A.trainers.length?A.trainers:A.ids; let h=7; for(const c of String(O.names[sid]||'')) h=(h*31+c.charCodeAt(0))>>>0; return L[h%L.length]; }
function avHTML(sid){ const id=avId(sid); if(id) return Avatar.html(Avatar.fix(id),'lt-avatar',O.lang==='en'?'en':'it');
  return `<span class="lt-av0" aria-hidden="true">${esc((String(O.names[sid]||'?').trim().charAt(0)||'?').toUpperCase())}</span>`; }
function iconImg(species){ const D=typeof ICON_DATA!=='undefined'?ICON_DATA:{}, sp=Dex.species.get(species);
  let i=D[species]; if(i===undefined&&sp.exists) i=D[sp.name]!==undefined?D[sp.name]:D[sp.baseSpecies]!==undefined?D[sp.baseSpecies]:sp.num; i=Math.max(0,Math.min(1643,i|0));
  return `<i class="pkic" style="--c:${i%12};--r:${Math.floor(i/12)}" role="img" aria-label="${esc(species)}"></i>`; }
function teamSlots(sid){ const s=B.side[sid], sets=B.sets[sid]||[], ts=(B.tsize||{})[sid];
  const live=set=>Object.values(s.team).find(x=>setOf(sid,x.species)===set);
  const one=(m,tip,label)=>{ const cls=m&&m.st==='fnt'?' ko':(m&&m.st?' stx':''); return `<button class="tpk${cls}" data-tip="${tip}" aria-label="${esc(label)}">${iconImg(label)}</button>`; };
  if(setVisible(sid)){ // squadra visibile: icone di tutti (solo quelli portati in lotta, nell'ordine della squadra)
    let idx=sets.map((x,i)=>i); const rq=B.req[sid];
    if(rq&&!rq.teamPreview&&rq.side&&Array.isArray(rq.side.pokemon)){ const keep=new Set(rq.side.pokemon.map(p=>sets.indexOf(setOf(sid,String(p.details||'').split(',')[0]))).filter(i=>i>=0)); if(keep.size) idx=idx.filter(i=>keep.has(i)); }
    else if(ts) idx=idx.slice(0,ts);
    return idx.map(i=>{ const m=live(sets[i]); return one(m,`set:${sid}:${i}`,m?m.species:sets[i].species); }).join(''); }
  // squadra nascosta: icone solo dei Pokémon già visti, Poké Ball per gli altri
  const seen=Object.keys(s.team), n=Math.max(seen.length,Math.min(6,ts||sets.length||6));
  let h=seen.map((k,i)=>{ const m=s.team[k]; return one(m,`pk:${sid}:${i}`,m.species); }).join('');
  for(let i=seen.length;i<n;i++) h+=`<span class="tpk ball"><img src="sprites/fx/pokeball.png" alt="Poké Ball"></span>`;
  return h; }
function sendAv(){ if(O.net&&O.net.send&&typeof Avatar!=='undefined') O.net.send({t:'bav',a:Avatar.fix(O.avatars.p1||Avatar.def)}); }
function drawTrainers(){ if(!root||!B) return; for(const sid of ['p1','p2']){ const el=$('tr'+sid); if(!el) continue;
  const h=`${avHTML(sid)}<span class="tnm">${PN(sid)}</span><span class="tteam">${teamSlots(sid)}</span>`; if(el._h!==h){ el._h=h; el.innerHTML=h; } } }
// riga solo nella cronaca (senza cambiare il messaggio grande)
function logLine(html,kind){ const box=$('log'); if(!box) return; const d=document.createElement('div'); d.className='le'+(kind?' '+kind:''); d.innerHTML=html; box.appendChild(d); B.log.push(d.textContent); box.scrollTop=box.scrollHeight; }
// barra dell'abilità che entra in azione (come su Showdown): "Garchomp: Pelle Ruvida"
function abilBar(pos,ability){ const ar=$('arena'); if(!ar||!ability) return; const id=parseId(pos+': x'); const m=actMon(pos); if(!m) return;
  const d=document.createElement('div'); d.className='abar '+(sideOfPos(pos)==='p1'?'me':'foe'); d.innerHTML='<b>'+esc(m.species)+'</b><span>'+esc(ability)+'</span>';
  ar.appendChild(d); setTimeout(()=>d.remove(),1900); }
function say(html,kind){ $('msg').innerHTML=html; const box=$('log'); if(!box) return;
  const d=document.createElement('div'); d.className='le'+(kind?' '+kind:''); d.innerHTML=html; box.appendChild(d); B.log.push(d.textContent);
  box.scrollTop=box.scrollHeight; }
function cls(sid,c,ms){ const el=$('mon'+sid); el.classList.remove(c); void el.offsetWidth; el.classList.add(c); if(ms) setTimeout(()=>el.classList.remove(c),ms); }
function pop(sid,text,kind){ const d=document.createElement('div'); d.className='pop '+kind; d.textContent=text;
  const cc=cen(sid); d.style.left=cc[0]+'%'; d.style.top=(cc[1]-18)+'%'; $('arena').appendChild(d); setTimeout(()=>d.remove(),1400); }
async function shot(from,to,color,status){ const a=$('arena');
  if(status||from===to){ const r=document.createElement('div'); r.className='ring'; r.style.setProperty('--c',color); const ct=cen(to); r.style.left=ct[0]+'%'; r.style.top=ct[1]+'%'; a.appendChild(r); setTimeout(()=>r.remove(),700); return; }
  const o=document.createElement('div'); o.className='orb'; o.style.setProperty('--c',color); const cf=cen(from), ct2=cen(to); o.style.left=cf[0]+'%'; o.style.top=cf[1]+'%'; a.appendChild(o);
  await sleep(20); o.style.left=ct2[0]+'%'; o.style.top=ct2[1]+'%'; await sleep(400); o.style.opacity=0; setTimeout(()=>o.remove(),250); }
// La barra scende (o sale) un PS alla volta: la durata dipende da quanti PS cambiano
function animHP(sid,m,to){ return new Promise(res=>{ if(window.__LOTTA_FAST){ m.shown=to; for(const q of [sid,sid+'b']) if(actMon(q)===m) hpView(q); return res(); } const from=m.shown, d=Math.abs(to-from);
  if(!d||!m.max){ m.shown=to; hpView(sid); return res(); }
  const dur=Math.min(2200,Math.max(350,d/m.max*2400)), t0=performance.now();
  const step=now=>{ if(!root) return res(); const k=Math.min(1,(now-t0)/dur); m.shown=from+(to-from)*k; for(const q of [sid,sid+'b']) if(actMon(q)===m) hpView(q); if(k<1) requestAnimationFrame(step); else res(); };
  requestAnimationFrame(step); }); }

// ---------- animazioni delle mosse di Pokémon Showdown ----------
// Le animazioni (lib/ps-anims.js) vengono dal client di Pokémon Showdown: il motore delle animazioni è MIT, le
// animazioni delle mosse e quasi tutte le immagini in sprites/fx sono CC0 (vedi note legali). Qui c'è solo un "ponte"
// che fa girare le loro animazioni sul nostro campo: le loro coordinate (x, y, profondità z: 0 = lato del giocatore 1,
// 200 = lato del giocatore 2, campo 640×360) vengono convertite misurando dove stanno davvero i nostri Pokémon.
let psReady=null;
function loadJS(src){ return new Promise((res,rej)=>{ if(document.querySelector('script[data-src="'+src+'"]')) return res(); const s=document.createElement('script'); s.src=src; s.dataset.src=src; s.onload=res; s.onerror=()=>rej(new Error(src)); document.head.appendChild(s); }); }
function loadPS(){ if(window.__LOTTA_FAST) return Promise.resolve(false);
  if(!psReady) psReady=(async()=>{
    if(!window.jQuery) await loadJS('lib/jquery.min.js');
    if(!window.PSAnimData) await loadJS('lib/ps-anims.js');
    const E=window.PSAnimData.BattleEffects, own={rock3:'rock3.svg',rocks:'rocks.svg',bone:'bone.svg'};
    for(const id in E){ const e=E[id]; if(own[id]) e.url='sprites/fx/'+own[id]; else if(e.url&&!/^(sprites\/|data:|https?:)/.test(e.url)) e.url='sprites/fx/'+e.url; }
    return true; })().catch(e=>{ console.warn('animazioni non disponibili',e); return false; });
  return psReady;
}
// mossa senza animazione propria: una dello stesso tipo e categoria
const PS_FALLBACK={Normal:['hypervoice','bodyslam','growl'],Fire:['flamethrower','firepunch','willowisp'],Water:['hydropump','waterfall','raindance'],Electric:['thunderbolt','thunderpunch','thunderwave'],
  Grass:['energyball','leafblade','spore'],Ice:['icebeam','icepunch','haze'],Fighting:['aurasphere','closecombat','bulkup'],Poison:['sludgebomb','poisonjab','toxic'],Ground:['earthpower','earthquake','spikes'],
  Flying:['airslash','bravebird','roost'],Psychic:['psychic','zenheadbutt','calmmind'],Bug:['bugbuzz','xscissor','stringshot'],Rock:['powergem','stoneedge','stealthrock'],Ghost:['shadowball','shadowclaw','confuseray'],
  Dragon:['dragonpulse','dragonclaw','dragondance'],Dark:['darkpulse','crunch','nastyplot'],Steel:['flashcannon','ironhead','irondefense'],Fairy:['moonblast','playrough','charm']};
function psAnimFor(moveName){
  const D=window.PSAnimData, mv=Dex.moves.get(moveName), id=mv.id;
  if(D.BattleMoveAnims[id]) return D.BattleMoveAnims[id];
  const f=PS_FALLBACK[mv.type]; const pick=f?f[mv.category==='Special'?0:mv.category==='Physical'?1:2]:null;
  return (pick&&D.BattleMoveAnims[pick])||D.BattleMoveAnims.tackle;
}
function psRun(kind,name,attSid,defSid,missed,dry){
  if(!window.PSAnimData||!window.jQuery||!root) return Promise.resolve();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
  const $=window.jQuery, ar=document.getElementById('lt-arena'), A=ar.getBoundingClientRect(), k=A.width/640;
  // strati: effetti (sopra i Pokémon), copie dei Pokémon, sfondo
  const fx=$('<div class="psfx"></div>').appendTo(ar), sprL=$('<div class="pssp"></div>').appendTo(ar), bgE=$('<div class="psbg"></div>').appendTo(ar);
  const C={}; for(const s of (isDbl()?['p1','p1b','p2','p2b']:['p1','p2'])){ if(!document.getElementById('lt-mon'+s)) continue; const img=document.querySelector('#lt-mon'+s+' img'); const r=(img||document.getElementById('lt-mon'+s)).getBoundingClientRect(); C[s]={img,r,x:r.left-A.left+r.width/2,y:r.top-A.top+r.height/2}; }
  const avg=(a,b)=>a&&b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:(a||b); const Z0=isDbl()?avg(C.p1,C.p1b):C.p1, Z2=isDbl()?avg(C.p2,C.p2b):C.p2;
  const scaleZ=z=>Math.max(.1,1.5-.5*(z/200));
  const scene={ timeOffset:0, battle:{mySide:{x:0,y:0,z:0}}, $bg:$(document.createElement('div')), $fx:fx, $bgEffect:bgE, animating:true, acceleration:1, els:[],
    wait(t){ this.timeOffset+=t; }, waitFor(el){ this.els.push(el); },
    pos(loc,obj){ loc=Object.assign({x:0,y:0,z:0,scale:1,opacity:1},loc); if(!loc.xscale&&loc.xscale!==0) loc.xscale=loc.scale; if(!loc.yscale&&loc.yscale!==0) loc.yscale=loc.scale;
      const t=(loc.z||0)/200, sc=scaleZ(loc.z||0)*k;
      let left=Z0.x+(Z2.x-Z0.x)*t + Math.floor(loc.x*sc), top=Z0.y+(Z2.y-Z0.y)*t - Math.floor(loc.y*sc);
      const width=Math.floor(obj.w*sc*loc.xscale), height=Math.floor(obj.h*sc*loc.yscale), hoff=Math.floor((obj.h-(obj.y||0)*2)*sc*loc.yscale);
      left-=Math.floor(width/2); top-=Math.floor(hoff/2);
      const p={left,top,width,height,opacity:loc.opacity}; if(loc.display) p.display=loc.display; return p; },
    posT(loc,obj,transition,oldLoc){ const pos=this.pos(loc,obj), oldPos=oldLoc?this.pos(oldLoc,obj):null; const m={left:'linear',top:'linear',width:'linear',height:'linear',opacity:'linear'};
      if(transition==='ballistic') m.top=pos.top<oldPos.top?'ballisticUp':'ballisticDown';
      if(transition==='ballisticUnder') m.top=pos.top<oldPos.top?'ballisticDown':'ballisticUp';
      if(transition==='ballistic2') m.top=pos.top<oldPos.top?'quadUp':'quadDown';
      if(transition==='ballistic2Back') m.top=loc.z>0?'quadUp':'quadDown';
      if(transition==='ballistic2Under') m.top=pos.top<oldPos.top?'quadDown':'quadUp';
      if(transition==='swing') m.left=m.top=m.width=m.height='swing';
      if(transition==='accel') m.left=m.top=m.width=m.height='quadDown';
      if(transition==='decel') m.left=m.top=m.width=m.height='quadUp';
      return {left:[pos.left,m.left],top:[pos.top,m.top],width:[pos.width,m.width],height:[pos.height,m.height],opacity:[pos.opacity,m.opacity]}; },
    showEffect(effect,start,end,transition,after,css){ if(typeof effect==='string') effect=window.PSAnimData.BattleEffects[effect]; if(!effect||!effect.url) return $();
      let $e=$('<img alt="" style="display:block;position:absolute">').attr('src',effect.url); fx.append($e); if(css) $e.css(css); return this.animateEffect($e,effect,start,end,transition,after); },
    animateEffect($e,effect,start,end,transition,after){ if(typeof effect==='string') effect=window.PSAnimData.BattleEffects[effect];
      start=Object.assign({},start); end=Object.assign({},end);
      if(!start.time) start.time=0; if(!end.time) end.time=start.time+500; start.time+=this.timeOffset; end.time+=this.timeOffset;
      if(!end.scale&&end.scale!==0&&start.scale) end.scale=start.scale; if(!end.xscale&&end.xscale!==0&&start.xscale) end.xscale=start.xscale; if(!end.yscale&&end.yscale!==0&&start.yscale) end.yscale=start.yscale;
      end=Object.assign({},start,end);
      const sp=this.pos(start,effect), ep=this.posT(end,effect,transition,start);
      if(start.time){ $e.css(Object.assign({},sp,{opacity:0})); $e.delay(start.time).animate({opacity:sp.opacity},1); } else $e.css(sp);
      $e.animate(ep,end.time-start.time);
      if(after==='fade') $e.animate({opacity:0},100);
      if(after==='explode'){ if(end.scale) end.scale*=3; if(end.xscale) end.xscale*=3; if(end.yscale) end.yscale*=3; end.opacity=0; $e.animate(this.pos(end,effect),200); }
      this.waitFor($e); return $e; },
    backgroundEffect(bg,duration,opacity=1,delay=0){ if(String(bg).indexOf('url(')>=0) return; opacity=Math.min(1,opacity)*0.3; const $e=$('<div class="psbgfx"></div>').css({background:bg,display:'block',opacity:0}); bgE.append($e);
      $e.delay(delay).animate({opacity},250).delay(Math.max(0,duration-250)).animate({opacity:0},250); this.waitFor($e); } };
  // copie dei Pokémon che si possono muovere durante l'animazione
  const restore=[];
  const sprite=s=>{ const c=C[s], sd=sideOfPos(s), z=sd==='p1'?0:200, sc=scaleZ(z)*k, front=sd==='p2', base=z?Z2:Z0;
    const sp={w:c.r.width/sc,h:c.r.height/sc,url:c.img?c.img.src:'',shiny:!!(actMon(s)&&actMon(s).shiny)};
    let $el=$(); if(c.img){ $el=$('<img alt="" style="position:absolute;display:block">').attr('src',c.img.src).appendTo(sprL); if(c.img.classList.contains('flip')||(sd==='p1'&&getComputedStyle(c.img).transform.startsWith('matrix(-'))) $el.css('transform','scaleX(-1)');
      const rest={left:c.r.left-A.left,top:c.r.top-A.top,width:c.r.width,height:c.r.height,opacity:1}; $el.css(rest); $el.data('rest',rest); c.img.style.visibility='hidden'; restore.push(c.img); }
    const o={x:(c.x-base.x)/sc,y:-(c.y-base.y)/sc,z,sp,isFrontSprite:front,isMissedPokemon:false,$el,
      anim(end,transition){ end=Object.assign({x:this.x,y:this.y,z:this.z,scale:1,opacity:1,time:500},end); $el.animate(scene.posT(end,sp,transition,this),end.time); scene.waitFor($el); return this; },
      delay(t){ $el.delay(t); return this; },
      behindx(o2){ return this.x+(front?1:-1)*o2; }, behindy(o2){ return this.y+(front?-1:1)*o2; }, leftof(o2){ return this.x+(front?1:-1)*o2; }, behind(o2){ return this.z+(front?1:-1)*o2; } };
    return o; };
  const att=sprite(attSid), def=defSid&&defSid!==attSid?sprite(defSid):att; if(missed&&def!==att) def.isMissedPokemon=true;
  try{
    const D=window.PSAnimData;
    const entry=kind==='move'?psAnimFor(name):kind==='status'?D.BattleStatusAnims[name]:D.BattleOtherAnims[name];
    if(entry) entry.anim(scene,def===att?[att]:[att,def]);
  }catch(e){ console.warn('animazione',name,e); }
  const all=scene.els.concat([att.$el,def.$el]);
  if(dry){ all.forEach(e=>e.stop(true,false)); }
  const done=()=>{ fx.remove(); sprL.remove(); bgE.remove(); for(const img of restore) img.style.visibility=''; $(document.getElementById('lt-bg')).stop(true,true).css({left:'',top:''}); };
  return new Promise(res=>{ let fin=false; const end=()=>{ if(fin) return; fin=true; done(); res(); }; if(dry) return end();
    const back=()=>{ if(fin) return; const ps=[att.$el,def.$el].filter(e=>e.length&&e.data('rest')); ps.forEach(e=>e.stop(true,false).animate(e.data('rest'),220,'swing')); fx.children().animate({opacity:0},150);
      $.when.apply($,ps.map(e=>e.promise())).then(()=>setTimeout(end,20)); };
    $.when.apply($,all.map(e=>e.promise())).then(()=>setTimeout(back,30)); setTimeout(end,4800); });
}

// ---------- suoni ed musica (tutti generati dal browser: composizioni e suoni originali, nessun file audio dei giochi) ----------
const LS=(k,d)=>{ try{ const v=localStorage.getItem(k); return v===null?d:v==='1'; }catch(e){ return d; } };
const LSset=(k,v)=>{ try{ localStorage.setItem(k,v?'1':'0'); }catch(e){} };
const SND={ctx:null,out:null,sfx:LS('lt-sfx',true),music:LS('lt-music',true),mus:null};
// Su iPhone l'audio del browser tace con l'interruttore del silenzioso: un suono vuoto in un elemento <audio> fa passare
// l'audio in modalità "riproduzione" (come un video) e da lì si sente.
let SIL=null;
function audioUnlock(){ const c=ac(); if(c&&c.state!=='running') c.resume().catch(()=>{});
  musicResume();
  try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
  if(!SIL){ try{ SIL=new Audio('lib/silenzio.wav'); SIL.loop=true; SIL.volume=0.01; SIL.setAttribute('playsinline',''); SIL.play().catch(()=>{ SIL=null; }); }catch(e){ SIL=null; } } }
function ac(){ if(!SND.ctx){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; SND.ctx=new C(); SND.out=SND.ctx.createGain(); SND.out.gain.value=.9; SND.out.connect(SND.ctx.destination); }
  if(SND.ctx.state==='suspended') SND.ctx.resume(); return SND.ctx; }
function tone(f,dur,type,vol,when,slide,dest){ const c=ac(); if(!c) return; const t=c.currentTime+(when||0); const o=c.createOscillator(), g=c.createGain();
  o.type=type||'square'; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(slide,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||.1,t+.008); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(dest||SND.out); o.start(t); o.stop(t+dur+.03); }
let NOISE=null;
function noise(dur,vol,when,freq,q,slide,dest){ const c=ac(); if(!c) return; if(!NOISE){ NOISE=c.createBuffer(1,c.sampleRate,c.sampleRate); const d=NOISE.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
  const t=c.currentTime+(when||0), s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=NOISE; s.loop=true;
  f.type='bandpass'; f.frequency.setValueAtTime(freq||1500,t); if(slide) f.frequency.exponentialRampToValueAtTime(slide,t+dur); f.Q.value=q||.8;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||.2,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f).connect(g).connect(dest||SND.out); s.start(t); s.stop(t+dur+.03); }
// Effetti dei colpi (generati dal browser) più morbidi; musiche e versi sono quelli di Pokémon Showdown (audio/, audio-data.js)
function thump(f0,f1,dur,vol,when){ const c=ac(); if(!c) return; const t=c.currentTime+(when||0), o=c.createOscillator(), g=c.createGain();
  o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.006); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(SND.out); o.start(t); o.stop(t+dur+.02); }
const SFX={
  hit(){ thump(180,55,.16,.32); noise(.07,.1,0,1200,.7,400); },
  super(){ thump(240,60,.2,.4); noise(.12,.18,0,2600,.6,700); thump(420,140,.1,.12,.05); },
  weak(){ thump(120,50,.12,.18); noise(.05,.05,0,600,1,250); },
  faint(){ tone(392,.55,'triangle',.07,0,98); },
  heal(){ [659,784,988].forEach((f,i)=>tone(f,.18,'sine',.07,i*.08)); },
  up(){ tone(392,.3,'triangle',.06,0,1175); },
  down(){ tone(1175,.3,'triangle',.06,0,392); },
};
// suoni classici dei colpi, delle statistiche e del KO (audio/se, da PokéRogue: vedi note legali); la cura resta generata
const SE_FILE={hit:'hit',super:'hit_strong',weak:'hit_weak',up:'stat_up',down:'stat_down',faint:'faint'};
function sfx(name){ if(!SND.sfx) return; const f=SE_FILE[name];
  if(f){ try{ const a=new Audio('audio/se/'+f+'.wav'); a.volume=.6; a.play().catch(()=>{ if(SFX[name]) try{ SFX[name](); }catch(e){} }); }catch(e){} return; }
  if(SFX[name]) try{ SFX[name](); }catch(e){} }

// Versi: stessa regola di Showdown per il nome del file (forme speciali e Mega hanno il loro verso)
const CRY_FORME=['-bloodmoon','-crowned','-eternal','-eternamax','-four','-hangry','-hero','-lowkey','-noice','-primal','-rapidstrike','-roaming','-school','-sky','-starter','-super','-therian','-unbound'];
const CRY_BASI=['calyrex','kyurem','cramorant','indeedee','lycanroc','necrozma','oinkologne','oricorio','slowpoke','tatsugiri','zygarde'];
function cryUrl(name){ const sp=Dex.species.get(name); if(!sp.exists||sp.num<=0) return null; const base=toID(sp.baseSpecies); let id=base; const fid=sp.forme?'-'+toID(sp.forme):'';
  if(sp.isMega||(fid&&(CRY_FORME.includes(fid)||CRY_BASI.includes(base)))) id+=(sp.isMega&&(base==='meowstic'||base==='tatsugiri'))?'-mega':fid;
  return 'audio/cries/'+id+'.mp3'; }
function cry(name){ if(!SND.sfx) return; const u=cryUrl(name); if(!u) return; try{ const a=new Audio(u); a.volume=.45; a.play().catch(()=>{}); }catch(e){} }

// Musica: una delle 15 musiche di battaglia di Showdown a caso, con il loop nei punti giusti
// scelta a caso, ma mai uguale all'ultima volta (ricordata nel browser)
function pickNew(list,key,id){ id=id||(x=>x); let last=null; try{ last=localStorage.getItem(key); }catch(e){}
  const pool=list.length>1?list.filter(x=>id(x)!==last):list; const v=pool[Math.floor(Math.random()*pool.length)]; try{ localStorage.setItem(key,id(v)); }catch(e){} return v; }
function musicStart(){ if(!SND.music||SND.mus) return; const D=typeof AUDIO_DATA!=='undefined'?AUDIO_DATA:null; if(!D||!D.musiche||!D.musiche.length) return;
  const m=pickNew(D.musiche,'lt-lasttrack',x=>x.file), el=new Audio(m.file); el.preload='auto'; el.volume=.32;
  const loop=setInterval(()=>{ if(el.currentTime*1000>=m.fine) el.currentTime=(m.inizio+(el.currentTime*1000-m.fine))/1000; },25);
  el.addEventListener('ended',()=>{ el.currentTime=m.inizio/1000; el.play().catch(()=>{}); });
  SND.mus={el,loop,m}; el.play().catch(()=>{ SND.mus.blocked=true; }); }
function musicResume(){ const s=SND.mus; if(s&&s.blocked){ s.blocked=false; s.el.play().catch(()=>{ s.blocked=true; }); } else if(SND.music&&!s) musicStart(); }
function audioStopAll(){ musicStop(true); if(SIL){ try{ SIL.pause(); }catch(e){} SIL=null; } }
function musicStop(fast){ const s=SND.mus; if(!s) return; SND.mus=null; clearInterval(s.loop); const el=s.el, v0=el.volume, steps=fast?3:16; let k=0;
  const f=setInterval(()=>{ k++; try{ el.volume=Math.max(0,v0*(1-k/steps)); }catch(e){} if(k>=steps){ clearInterval(f); el.pause(); el.src=''; } },50); }

function toolsHTML(){ return `<button class="tool${SND.sfx?'':' off'}" data-lt="sfx" title="Effetti e versi">🔊</button><button class="tool${SND.music?'':' off'}" data-lt="music" title="Musica">🎵</button><button class="tool${B&&B.timerOn?'':' off'}" data-lt="timer" title="Timer: 60 secondi per scelta">⏱ ${B&&B.timerOn?'Timer attivo':'Timer'}</button>`; }
function drawTools(){ const t=$('tools'); if(t) t.innerHTML=toolsHTML(); }

// ---------- timer anti-AFK: 60 secondi per scelta; allo scadere mossa a caso, alla terza volta si perde ----------
const TURN_SECS=60;
function timerArm(sid){ if(!B.timerOn){ B.tSid=null; return; } if(B.tSid!==sid||!B.tEnd){ B.tSid=sid; B.tEnd=Date.now()+TURN_SECS*1000; } timerShow(); }
function timerClear(){ B.tSid=null; B.tEnd=0; }
function timerShow(){ const el=$('tm'); if(!el) return; if(!B.timerOn||!B.tSid){ el.textContent=''; return; } const s=Math.max(0,Math.ceil((B.tEnd-Date.now())/1000)); el.textContent='⏱ '+s+'s'; el.classList.toggle('low',s<=10); }
function timerTick(){ if(!root||!B||!B.timerOn||!B.tSid||B.over) return; timerShow(); if(Date.now()<B.tEnd) return;
  const sid=B.tSid; timerClear(); B.timeouts[sid]=(B.timeouts[sid]||0)+1;
  if(B.timeouts[sid]>=3){ say(`Tempo scaduto per la terza volta: ${PN(sid)} perde la lotta.`); loseBy(sid); return; }
  if(need(sid)){ say(`Tempo scaduto! Per ${PN(sid)} viene scelta una mossa a caso (${B.timeouts[sid]}/3).`); if(O.mode==='two') B.passTo=null; send(sid,cpuChoice(B.req[sid])); } }

// ---------- messaggi del motore ----------
const fromOf=p=>{ const f=p.find(x=>x&&x.startsWith('[from]')); return f?f.slice(7).replace(/^(item|ability|move): /,''):''; };
// Statistiche per il profilo: Pokémon mandati in campo, mosse usate e KO (il KO va a chi ha inflitto l'ultimo danno diretto)
const baseSp=s=>String(s||'').replace(/-Mega(-[XY])?$/,'').replace(/-(Busted|Blade|Hero|Primal|Crowned|Tera|Terastal|Stellar|Eternamax|Meteor|School|Complete|Zen|Pirouette|Sunshine|Gulping|Gorging|Hangry|Noice|Resolute)$/,'');
function track(p){ if(!B) return; const S=B.stats||(B.stats={p1:{used:{},moves:{},kos:{}},p2:{used:{},moves:{},kos:{}}}); const k=p[1];
  const who=x=>{ const id=parseId(x); if(!id||!S[id.side]) return null; const m=B.side[id.side]&&B.side[id.side].team[id.nick]; return {side:id.side,key:id.side+':'+id.nick,sp:baseSp(m&&m.species||id.nick)}; };
  if(k==='switch'||k==='drag'){ const id0=parseId(p[2]); if(id0) (B.aiFresh=B.aiFresh||{})[id0.pos]=(B.turn||0)+1; const w=who(p[2]); if(w){ const sp=baseSp(String(p[3]||'').split(',')[0]); S[w.side].used[sp]=1; } }
  else if(k==='move'&&!p.some(x=>x&&x.startsWith('[from]'))){ const w=who(p[2]); if(w){ S[w.side].moves[p[3]]=(S[w.side].moves[p[3]]||0)+1; B.lastActor=w; } }
  else if(k==='-damage'&&!p.slice(4).some(x=>x&&x.startsWith('[from]'))){ const w=who(p[2]); if(w&&B.lastActor&&B.lastActor.side!==w.side){ (B.lastHit||(B.lastHit={}))[w.key]=B.lastActor; } }
  else if(k==='faint'){ const w=who(p[2]); const h=w&&B.lastHit&&B.lastHit[w.key]; if(h){ S[h.side].kos[h.sp]=(S[h.side].kos[h.sp]||0)+1; delete B.lastHit[w.key]; } }
  else if(k==='turn') B.lastActor=null; }
async function handle(line){
  const p=line.split('|'); const k=p[1]; try{ track(p); }catch(e){}
  try{ const fa=p.find(x=>x&&x.startsWith('[from] ability: ')); if(fa&&k!=='-ability'){ const of=p.find(x=>x&&x.startsWith('[of] ')); const who=parseId(of?of.slice(5):p[2]); if(who){ mon(who.side,who.nick).abilitySeen=fa.slice(16); abilBar(who.pos,fa.slice(16)); } } }catch(e){} const sideOf=id=>(parseId(id)||{}).side;
  switch(k){
    case 'switch': case 'drag': case 'replace': {
      const id=parseId(p[2]); const species=p[3].split(',')[0]; const m=mon(id.side,id.nick); m.species=species; m.shiny=p[3].includes('shiny'); m.level=+((/, L(\d+)/.exec(p[3])||[])[1]||100);
      const h=parseHP(p[4]); if(h){ m.hp=h.hp; m.max=h.max||m.max; m.shown=h.hp; m.st=h.st; } const keep=k==='switch'&&['batonpass','shedtail'].includes((B.lastMv||{})[id.pos]); if(!keep){ m.boosts={}; m.sub=false; m.vol={}; } m.tchange=null; m.fadedAt0=false;
      const s=B.side[id.side], sk=slotK(id.pos); const el=$('mon'+id.pos);
      { const prev=s[sk]&&s[sk]!==id.nick?s.team[s[sk]]:null, lm=(B.lastMv||{})[id.pos];
        if(prev&&k==='switch'&&lm==='batonpass'){ m.boosts=Object.assign({},prev.boosts); m.vol=Object.assign({},prev.vol); for(const x of ['typechange','yawn','disable','encore','taunt','torment','attract','stockpile','protosynthesis','quarkdrive']) delete m.vol[x]; m.sub=!!prev.sub; }
        if(prev&&k==='switch'&&lm==='shedtail') m.sub=true;
        if(prev){ prev.boosts={}; prev.vol={}; prev.sub=false; prev.tchange=null; }
        if(B.lastMv) delete B.lastMv[id.pos]; }
      if(s[sk]&&s[sk]!==id.nick&&s.team[s[sk]]&&s.team[s[sk]].st!=='fnt'){ el.classList.add('out'); await sleep(350); }
      s[sk]=id.nick; cry(species); el.classList.remove('faint'); el.dataset.sp=''; draw(); el.classList.add('out'); void el.offsetWidth; el.classList.remove('out');
      say(`${PN(id.side)} manda in campo <b>${esc(species)}</b>!`); return 900; }
    case 'detailschange': case '-formechange': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.species=p[3].split(',')[0]; if(m.st==='fnt'||p.includes('[silent]')){ if(m.st!=='fnt'){ $('mon'+id.pos).dataset.sp=''; draw(); } return 0; } $('mon'+id.pos).dataset.sp=''; draw(); if(/-Mega/.test(p[3])&&k==='detailschange') return 300; say(`${label(p[2])} cambia forma!`); return 900; }
    case 'move': { const posOf=x=>(parseId(x)||{}).pos; const a=posOf(p[2]), tg=posOf(p[4])||a; const mv=Dex.moves.get(p[3]); B.eff=null; B.effT={}; B.spread=p.some(x=>x&&x.startsWith('[spread]')); (B.lastMv=B.lastMv||{})[a]=mv.id; 
      { const id=parseId(p[2]); if(id&&!p.some(x=>x&&x.startsWith('[from]'))){ const um=mon(id.side,id.nick); um.movesSeen=um.movesSeen||[]; if(!um.movesSeen.includes(p[3])) um.movesSeen.push(p[3]); } }
      say(`${label(p[2])} usa <b>${esc(p[3])}</b>!`);
      if(p.includes('[still]')) return 700;
      const miss=p.some(x=>x&&x.startsWith('[miss]'));
      if(await loadPS()){ await psRun('move',p[3],a,tg,miss); return 250; }
      cls(a,'lunge',450); shot(a,tg,TYPE_COLORS[mv.type]||'#999',mv.category==='Status'); return 950; }
    case '-damage': case '-heal': case '-sethp': {
      const id=parseId(p[2]); const m=mon(id.side,id.nick); const h=parseHP(p[3]); if(!h) return 0;
      const to=h.hp; if(h.max) m.max=h.max; const was=m.shown; if(h.st!=='fnt') m.st=h.st;
      const f=fromOf(p); const fi=f&&Dex.items.get(f); if(fi&&fi.exists){ m.item=fi.name; m.itemSeen=true; } const fr=p.find(x=>x&&x.startsWith('[from] ability: ')); if(fr) m.abilitySeen=fr.slice(16);
      if(k==='-damage'&&to<was){ cls(id.pos,'hit',500); const ef=f?'weak':((B.effT&&B.effT[id.pos])||((!B.effT||!Object.keys(B.effT).length)&&B.eff)||'hit'); if(f!=='Life Orb') sfx(ef); if(B.effT) delete B.effT[id.pos]; if(!B.effT||!Object.keys(B.effT).length) B.eff=null; }
      if(k==='-heal'&&to>was) sfx('heal');
      if(k==='-heal'&&to>was) pop(id.pos,'+'+Math.round(exactHP(id.side)?to-was:(to-was)/m.max*100)+(exactHP(id.side)?' PS':'%'),'heal');
      let pctDiff=m.max?Math.round(Math.abs(to-was)/m.max*100):0; if(pctDiff===100&&to>0) pctDiff=99; if(!pctDiff&&to!==was) pctDiff=1; const anim=animHP(id.side,m,to); m.hp=to;
      if(k==='-heal') say(`${label(p[2])} recupera PS${f?' ('+esc(f)+')':''}.`);
      else if(f) say(`${label(p[2])} subisce danni per ${esc(CAUSE[f]||f)}.`);
      if(pctDiff&&k==='-damage'&&to<was) logLine(`(${label(p[2])} perde il ${pctDiff}% dei PS!)`,'hp');
      else if(pctDiff&&k==='-heal'&&to>was) logLine(`(${label(p[2])} recupera il ${pctDiff}% dei PS!)`,'hp');
      await anim;
      if(to===0&&h.st==='fnt'&&!m.fadedAt0&&actMon(id.pos)===m){ m.fadedAt0=true; sfx('faint'); $('mon'+id.pos).classList.add('faint'); }
      const ps=B.pendItem&&B.pendItem[id.pos]; if(ps&&k==='-damage'){ delete B.pendItem[id.pos]; if(to>0){ say(ps); return 800; } }
      return k==='-damage'&&!f?150:500; }
    case 'faint': { const id=parseId(p[2]); const m=mon(id.side,id.nick); if(!m.fadedAt0) sfx('faint'); m.fadedAt0=true; m.hp=0; m.shown=0; m.st='fnt'; m.boosts={}; m.vol={}; m.sub=false; m.tchange=null; $('mon'+id.pos).classList.add('faint'); drawSide(id.side); say(`${label(p[2])} è esausto!`); await sleep(900); return 300; }
    case '-supereffective': case '-resisted': { const e=k==='-supereffective'?'super':'weak', id=parseId(p[2]); B.eff=e; if(id) (B.effT=B.effT||{})[id.pos]=e; const sp=B.spread||(B.effT&&Object.keys(B.effT).length>1); say(e==='super'?(sp&&id?`È superefficace su ${label(p[2])}!`:'È superefficace!'):(sp&&id?`Non è molto efficace su ${label(p[2])}…`:'Non è molto efficace…')); return 750; }
    case '-immune': { const id=parseId(p[2]); if(id) pop(id.pos,'Immune','miss'); say(`Non ha effetto su ${label(p[2])}…`); return 800; }
    case '-crit': say('Brutto colpo!'); return 700;
    case '-miss': { const tg=parseId(p[3]); if(tg) pop(tg.pos,'Miss','miss'); say(`${label(p[2])} manca il bersaglio!`); return 800; }
    case '-fail': { const id=parseId(p[2]); if(id) pop(id.pos,'Fail','miss'); say('Ma non ha effetto!'); return 700; }
    case '-status': { const id=parseId(p[2]); mon(id.side,id.nick).st=p[3]; drawSide(id.side); if(window.PSAnimData&&window.PSAnimData.BattleStatusAnims[p[3]]) psRun('status',p[3],id.pos,null); say(`${label(p[2])} ${STATUS[p[3]]||esc(p[3])}!`); return 900; }
    case '-curestatus': { const id=parseId(p[2]); if(id){ const was=p[3]; mon(id.side,id.nick).st=''; drawSide(id.side); drawTrainers(); say(`${label(p[2])} ${({slp:'si sveglia!',par:'non è più paralizzato!',brn:'guarisce dalla scottatura!',psn:'non è più avvelenato!',tox:'non è più avvelenato!',frz:'si scongela!'})[was]||'è guarito.'}`); return 700; } return 0; }
    case 'cant': { const r={par:'è paralizzato! Non riesce a muoversi!',slp:'dorme profondamente.',frz:'è congelato!',flinch:'tentenna e non attacca!',recharge:'deve riprendersi.',attract:'è infatuato e non attacca!',truant:'sta oziando.','ability: Truant':'sta oziando.',focuspunch:'perde la concentrazione e non attacca!','Focus Punch':'perde la concentrazione e non attacca!','move: Taunt':'non può usare la mossa per la provocazione!',Taunt:'non può usare la mossa per la provocazione!','move: Disable':'non può usare la mossa bloccata!','move: Imprison':'non può usare la mossa sigillata!','move: Heal Block':'non può curarsi!','move: Throat Chop':'non può usare mosse sonore!','move: Gravity':'non può usare la mossa per la gravità!',nopp:'non ha più PP per questa mossa!',Dynamax:'non può usare la mossa.'}[p[3]]||'non può muoversi.'; say(`${label(p[2])} ${r}`); return 900; }
    case '-boost': case '-unboost': { const id=parseId(p[2]); const m=mon(id.side,id.nick); const n=+p[4]*(k==='-boost'?1:-1); if(n) sfx(n>0?'up':'down');
      m.boosts[p[3]]=Math.max(-6,Math.min(6,(m.boosts[p[3]]||0)+n)); drawSide(id.side);
      if(n) pop(id.pos,`${STAT[p[3]]||p[3]} ${n>0?'↑'.repeat(Math.min(3,n)):'↓'.repeat(Math.min(3,-n))}`,n>0?'up':'down');
      const q=Math.abs(n)>=3?' tantissimo':Math.abs(n)===2?' molto':''; say(n?`${STAT[p[3]]||esc(p[3])} di ${label(p[2])} ${n>0?'aumenta':'diminuisce'}${q}!`:`${STAT[p[3]]||esc(p[3])} di ${label(p[2])} non può cambiare oltre!`); return 900; }
    case '-setboost': { const id=parseId(p[2]); mon(id.side,id.nick).boosts[p[3]]=+p[4]; drawSide(id.side); pop(id.pos,`${STAT[p[3]]||p[3]} al massimo!`,'up'); return 800; }
    case '-clearallboost': for(const s of ['p1','p2']) for(const m of Object.values(B.side[s].team)) m.boosts={}; draw(); say('Tutte le modifiche alle statistiche spariscono!'); return 700;
    case '-clearboost': case '-clearnegativeboost': { const id=parseId(p[2]); if(id){ const m=mon(id.side,id.nick); if(k==='-clearboost') m.boosts={}; else for(const s in m.boosts) if(m.boosts[s]<0) m.boosts[s]=0; drawSide(id.side); } return 0; }
    case '-weather': { if(p[2]==='none'){ const was=B.weather; B.weather=null; drawField(); if(was){ say('Il tempo torna normale.'); return 700; } return 0; }
      if(p.includes('[upkeep]')) return 0; B.weather=p[2]; B.start['w']=[B.turn,!!fromOf(p)]; drawField(); say(WSTART[p[2]]||esc(p[2])); return 1000; }
    case '-fieldstart': { const n=p[2].replace('move: ',''); B.field[toID(n)]=n; B.start['f'+toID(n)]=[B.turn]; drawField(); say(`${esc(n)}!`); return 900; }
    case '-fieldend': { const n=p[2].replace('move: ',''); delete B.field[toID(n)]; drawField(); say(`${esc(n)} svanisce.`); return 700; }
    case '-sidestart': case '-sideend': { const sid=p[2].slice(0,2); const n=p[3].replace('move: ',''); const id=toID(n); const c=B.cond[sid];
      if(k==='-sidestart'){ B.start[sid+id]=[B.turn]; c[id]=(id==='spikes'||id==='toxicspikes')?Math.min(id==='spikes'?3:2,(c[id]||0)+1):1; drawField(); say(SIDECOND[id]?`${SIDECOND[id][1]} ${PN(sid)}!`:`${esc(n)}: ${PN(sid)}.`); return 1000; }
      delete c[id]; drawField(); say(`${SIDECOND[id]?SIDECOND[id][0]:esc(n)} sparisce dalla parte di ${PN(sid)}.`); return 700; }
    case '-terastallize': { const id=parseId(p[2]); mon(id.side,id.nick).tera=p[3]; drawSide(id.side); shot(id.pos,id.pos,TYPE_COLORS[p[3]]||'#fff',true); say(`${label(p[2])} si teracristallizza: tipo ${TIPI[p[3]]||esc(p[3])}!`); return 1100; }
    case '-ability': { const id=parseId(p[2]); if(id){ mon(id.side,id.nick).abilitySeen=p[3]; abilBar(id.pos,p[3]); } }
      say(`[Abilità di ${label(p[2])}: ${esc(p[3])}]`); return 800;
    case '-item': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.item=p[3]; m.itemSeen=true; m.itemGone=null; drawSide(id.side); const fr=p.find(x=>x&&x.startsWith('[from] ability: ')); if(fr){ say(`${label(p[2])} tiene ${esc(p[3])} (rivelato da ${esc(fr.slice(16))}).`); return 800; } say(`${label(p[2])} ottiene ${esc(p[3])}.`); return 800; }
    case '-enditem': { const id=parseId(p[2]); const m=mon(id.side,id.nick); m.item=null; m.itemSeen=true; const it=esc(p[3]), fr=fromOf(p)||'', L=label(p[2]);
      m.itemGone={name:p[3],how:p.some(x=>x&&x.startsWith('[eat]'))?'eat':/Knock Off/i.test(fr)?'knock':/Incinerate/i.test(fr)?'burn':/Bug Bite|Pluck/i.test(fr)?'stolen':/Fling/i.test(fr)?'fling':/Trick|Switcheroo|Thief|Covet|Magician|Pickpocket/i.test(fr)?'taken':p[3]==='Air Balloon'?'pop':'used'}; drawSide(id.side);
      if(p.some(x=>x&&x.startsWith('[eat]'))){ say(`${L} mangia ${it}!`); return 800; }
      if(/Knock Off/i.test(fr)){ pop(id.pos,'Knock Off','miss'); say(`Lo strumento ${it} di ${L} è stato tolto!`); return 800; }
      if(/Incinerate/i.test(fr)){ say(`Lo strumento ${it} di ${L} è bruciato!`); return 800; }
      if(/Bug Bite|Pluck/i.test(fr)){ say(`Lo strumento ${it} di ${L} è stato rubato e mangiato!`); return 800; }
      if(/Fling/i.test(fr)){ say(`${L} lancia ${it}!`); return 600; }
      if(!fr&&/^(Focus Sash|Focus Band)$/.test(p[3])){ (B.pendItem=B.pendItem||{})[id.pos]=`${L} resiste grazie a ${it}!`; return 0; }   // il messaggio arriva dopo il danno (resta a 1 PS)
      if(!fr&&p[3]==='Air Balloon'){ say(`Il palloncino di ${L} scoppia!`); return 800; }
      if(!fr&&!/^(Booster Energy)$/.test(p[3])){ say(`${L} usa ${it}!`); return 800; }
      if(p[3]==='Booster Energy') return 0;
      say(`${L} perde ${it}.`); return 800; }
    case '-start': { const id=parseId(p[2]); let n=p[3].replace(/^(move|ability|item): /,''); const mm=mon(id.side,id.nick); { const pq=/^(protosynthesis|quarkdrive)(atk|def|spa|spd|spe)$/i.exec(toID(n)); if(pq){ n=pq[1]==='protosynthesis'?'Protosynthesis':'Quark Drive'; p[4]=pq[2]; mm.psStat=pq[2]; } }
      if(n==='typechange'){ mm.tchange=String(p[4]||'').split('/').filter(Boolean); drawSide(id.side); say(`${label(p[2])} diventa di tipo ${mm.tchange.map(x=>TIPI[x]||esc(x)).join('/')}!`); return 900; }
      if(VOL[toID(n)]||/^perish\d$/.test(toID(n))||/^stockpile\d$/.test(toID(n))){ (mm.vol=mm.vol||{})[/^perish/.test(toID(n))?'perish':/^stockpile/.test(toID(n))?'stockpile':toID(n)]=volLabel(n,p[4]); drawSide(id.side); }
      if(VOLMSG[toID(n)]){ say(VOLMSG[toID(n)](label(p[2]),p[4])); return 800; }
      if(n==='Substitute'){ mon(id.side,id.nick).sub=true; drawSide(id.side); say(`${label(p[2])} crea un sostituto!`); return 900; }
      if(n==='confusion'){ say(`${label(p[2])} è confuso!`); return 800; }
      say(`${label(p[2])}: ${esc(n)}.`); return 700; }
    case '-end': { const id=parseId(p[2]); const n=p[3].replace(/^(move|ability|item): /,''); { const mm=mon(id.side,id.nick); if(mm.vol&&p.includes('[partiallytrapped]')&&mm.vol.partiallytrapped){ delete mm.vol.partiallytrapped; drawSide(id.side); } if(mm.vol){ const kk=/^stockpile/.test(toID(n))?'stockpile':/^(protosynthesis|quarkdrive)/.test(toID(n))?toID(n).replace(/(atk|def|spa|spd|spe)$/,''):toID(n); if(mm.vol[kk]){ delete mm.vol[kk]; drawSide(id.side); } } if(toID(n)==='typechange'){ mm.tchange=null; drawSide(id.side); } } if(n==='Substitute'){ mon(id.side,id.nick).sub=false; drawSide(id.side); say(`Il sostituto di ${label(p[2])} svanisce!`); return 800; } return 0; }
    case '-activate': { const n=(p[3]||'').replace('move: ','');
      if(['Bind','Wrap','Fire Spin','Whirlpool','Sand Tomb','Magma Storm','Infestation','Clamp','Snap Trap','Thunder Cage'].includes(n)){ const id=parseId(p[2]); if(id){ const mm=mon(id.side,id.nick); (mm.vol=mm.vol||{}).partiallytrapped='Intrappolato'; drawSide(id.side); say(`${label(p[2])} è intrappolato da ${esc(n)}!`); return 800; } } if(PROTECTS.includes(n)){ const id=parseId(p[2]); if(id){ shieldOn(id.pos); pop(id.pos,n,'miss'); } say(`${label(p[2])} si protegge!`); return 800; } if(TEAM_GUARDS.includes(n)){ const id=parseId(p[2]); if(id){ shieldOn(id.pos); pop(id.pos,n,'miss'); } say(`${label(p[2])} è protetto da ${esc(n)}!`); return 800; }
      if(/^ability: /.test(p[3]||'')){ const id=parseId(p[2]); if(id){ const ab=p[3].slice(9); mon(id.side,id.nick).abilitySeen=ab; abilBar(id.pos,ab); if(p.includes('[fromitem]')) say(`${label(p[2])} usa Booster Energy!`); } return 700; } if(n==='Substitute'){ say('Il sostituto incassa il colpo!'); return 800; }
      if(['Feint','Shadow Force','Phantom Force','Hyperspace Fury','Hyperspace Hole'].includes(n)||p.includes('[broken]')){ shieldsOff(); say(`La protezione di ${label(p[2])} è stata spezzata!`); return 800; }
      if(n==='Brick Break'||n==='Psychic Fangs'||n==='Raging Bull'){ const sd=(parseId(p[2])||{}).side; if(sd){ delete B.cond[sd].reflect; delete B.cond[sd].lightscreen; delete B.cond[sd].auroraveil; drawField(); say(`Gli schermi della squadra di ${PN(sd)} vanno in frantumi!`); return 800; } }
      return 0; }
    case '-singleturn': { const n=(p[3]||'').replace('move: ',''); if(TEAM_GUARDS.includes(n)){ const id=parseId(p[2]); if(id){ for(const q of [id.side,id.side+'b']) if(actMon(q)&&actMon(q).st!=='fnt') shieldOn(q); say(`${esc(n)} protegge la squadra di ${PN(id.side)}!`); return 800; } return 0; } if(PROTECTS.includes(n)){ const id=parseId(p[2]); if(id) shieldOn(id.pos); say(`${label(p[2])} si protegge!`); return 800; } return 0; }
    case '-block': { const id=parseId(p[2]); const n=(p[3]||'').replace(/^(move|ability|item): /,''); if(id) pop(id.pos,n,'miss'); say(`${label(p[2])} è protetto da ${esc(n)}!`); return 800; }
    case '-clearpositiveboost': { const id=parseId(p[2]); if(id){ const m=mon(id.side,id.nick); for(const k2 in m.boosts) if(m.boosts[k2]>0) m.boosts[k2]=0; drawSide(id.side); say(`Gli aumenti delle statistiche di ${label(p[2])} spariscono!`); return 800; } return 0; }
    case '-swapboost': { const a=parseId(p[2]), b=parseId(p[3]); if(a&&b){ const ma=mon(a.side,a.nick), mb=mon(b.side,b.nick); const st=(p[4]&&!p[4].startsWith('[')?p[4].split(', '):['atk','def','spa','spd','spe','accuracy','evasion']); for(const x of st){ const t=ma.boosts[x]; ma.boosts[x]=mb.boosts[x]; mb.boosts[x]=t; if(!ma.boosts[x]) delete ma.boosts[x]; if(!mb.boosts[x]) delete mb.boosts[x]; } draw(); say(`${label(p[2])} scambia le modifiche alle statistiche con ${label(p[3])}!`); return 800; } return 0; }
    case '-invertboost': { const id=parseId(p[2]); if(id){ const m=mon(id.side,id.nick); for(const k2 in m.boosts) m.boosts[k2]=-m.boosts[k2]; drawSide(id.side); say(`Le modifiche alle statistiche di ${label(p[2])} si invertono!`); return 800; } return 0; }
    case '-copyboost': { const a=parseId(p[2]), b=parseId(p[3]); if(a&&b){ mon(a.side,a.nick).boosts=Object.assign({},mon(b.side,b.nick).boosts); drawSide(a.side); say(`${label(p[2])} copia le modifiche alle statistiche di ${label(p[3])}!`); return 800; } return 0; }
    case '-cureteam': { const sd=(parseId(p[2])||{}).side; if(sd){ for(const m of Object.values(B.side[sd].team)) if(m.st!=='fnt') m.st=''; drawSide(sd); drawTrainers(); say(`La squadra di ${PN(sd)} guarisce da tutti i problemi di stato!`); return 900; } return 0; }
    case '-transform': { const a=parseId(p[2]), b=parseId(p[3]); if(a&&b){ const ma=mon(a.side,a.nick), mb=mon(b.side,b.nick); ma.boosts=Object.assign({},mb.boosts); ma.transformed=mb.species; const el=$('mon'+a.pos); el.innerHTML=spriteImg(mb.species,a.side==='p1',mb.shiny); el.dataset.sp='T'+mb.species; drawSide(a.side); say(`${label(p[2])} si trasforma in ${esc(mb.species)}!`); return 1000; } return 0; }
    case '-prepare': { say(`${label(p[2])} si prepara a usare ${esc(p[3])}!`); return 800; }
    case '-mustrecharge': return 0;
    case '-hitcount': { const n=parseInt(p[3],10)||1; say(n===1?'Colpito 1 volta!':`Colpito ${n} volte!`); return 800; }
    case '-ohko': say('È un colpo KO!'); return 800;
    case '-notarget': say('Ma non c\'è nessun bersaglio…'); return 700;
    case '-nothing': say('Ma non succede niente!'); return 700;
    case '-center': return 0;
    case '-combine': say('Le mosse si uniscono!'); return 700;
    case '-waiting': say(`${label(p[2])} aspetta la mossa del compagno…`); return 700;
    case '-singlemove': { const n=(p[3]||'').replace('move: ',''); if(n==='Destiny Bond'){ say(`${label(p[2])} vuole trascinare con sé l'avversario!`); return 800; } if(n==='Grudge'){ say(`${label(p[2])} vuole vendicarsi!`); return 800; } return 0; }
    case '-fieldactivate': { const n=(p[2]||'').replace('move: ',''); if(n==='Perish Song'){ say('Tutti i Pokémon che sentono il canto andranno KO tra 3 turni!'); return 900; } return 0; }
    case '-swapsideconditions': { const t=B.cond.p1; B.cond.p1=B.cond.p2; B.cond.p2=t; drawField(); say('Gli effetti dei due lati del campo si scambiano!'); return 900; }
    case '-primal': say(`${label(p[2])} torna alla sua forma archeologica!`); return 1000;
    case '-message': say(esc(p[2]||'')); return 800;
    case '-hint': return 0;
    case 'swap': { const id=parseId(p[2]); if(id&&isDbl()){ const sd=B.side[id.side]; const a=slotK(id.side), b=slotK(id.side+'b'); const t=sd[a]; sd[a]=sd[b]; sd[b]=t; for(const q of [id.side,id.side+'b']){ const el=$('mon'+q); el.dataset.sp=''; el.classList.remove('faint'); } draw(); say(`${label(p[2])} cambia posto con il compagno!`); return 900; } return 0; }
    case '-mega': say(`${label(p[2])} megaevolve!`); return 1000;
    case 'turn': { shieldsOff(); B.turn=+p[2]||0; const tb=$('turn'); tb.hidden=false; tb.textContent='Turno '+p[2]; say(`Turno ${esc(p[2])}`,'turn'); return 350; }
    case 'win': { // il simulatore conosce solo i primi 18 caratteri del nome: si torna al nome intero
      const w=String(p[2]||''), sd=['p1','p2'].find(s=>String(O.names[s])===w)||['p1','p2'].find(s=>String(O.names[s]).slice(0,18)===w); p[2]=sd?String(O.names[sd]):w; }
      B.over=true; timerClear(); musicStop(); say(`Vince ${esc(p[2])}!`,'win'); seriesEnd(String(p[2]||'')); try{ if(O.onStats) O.onStats({winner:String(p[2]||''),names:Object.assign({},O.names),stats:B.stats||null,turns:B.turn||0}); }catch(e){} return 0;
    case 'tie': B.over=true; say('Pareggio!'); return 0;
    case 'teamsize': { const sd=p[2]; if(sd==='p1'||sd==='p2'){ (B.tsize=B.tsize||{})[sd]=Math.max(1,Math.min(6,parseInt(p[3],10)||6)); drawTrainers(); } return 0; }
  }
  return 0;
}
async function pump(){
  if(B.busy) return; B.busy=true; const g=gen; $('ctrl').innerHTML='<p class="lt-wait">Il turno è in corso…</p>';
  while(B.queue.length){ const line=B.queue.shift(); let ms=0; try{ ms=await handle(line); }catch(e){ console.error(e,line); } if(g!==gen) return; if(ms) await sleep(ms); if(g!==gen) return; }
  B.busy=false; prompt();
}

// ---------- efficacia delle mosse sul Pokémon avversario in campo ----------
const EFF_SYM={x4:'▲ ×4',x2:'▲ ×2',x05:'▼ ×½',x025:'▼ ×¼',x0:'🚫'};
const effSpan=e=>e?`<span class="effl ${e[0]}" title="${e[1]}">${EFF_SYM[e[0]]}</span>`:'';

function effOf(moveId,sid,fp){
  const mv=Dex.moves.get(moveId); if(mv.category==='Status') return null;
  const m=actMon(fp||other(sid)); if(!m) return null;
  const types=m.tera&&m.tera!=='Stellar'?[m.tera]:(m.tchange&&m.tchange.length?m.tchange:Dex.species.get(m.species).types);
  if(!Dex.getImmunity(mv.type,types)) return ['x0','Nessun effetto'];
  const e=Dex.getEffectiveness(mv.type,types);
  return e>=2?['x4','Iper efficace ×4']:e===1?['x2','Superefficace ×2']:e===-1?['x05','Poco efficace ×½']:e<=-2?['x025','Per niente efficace ×¼']:null;
}

// ---------- scelte ----------
function need(sid){ const r=B.req[sid]; return r&&!r.wait&&B.answered[sid]!==r.rqid; }
function send(sid,choice){ aiObserve(sid,choice); if(B.tSid===sid) timerClear(); B.answered[sid]=B.req[sid].rqid; B.err=''; if(O.role==='guest') O.net.send({t:'bc',c:choice}); else B.streams[sid].write(choice); $('ctrl').innerHTML='<p class="lt-wait">Il turno è in corso…</p>'; hideTip(); setTimeout(prompt,30); }
// ---------- Intelligenza del computer: 10 livelli ----------
// Livello 1: gioca quasi a caso. Dal 2 in poi l'abilità cresce sempre più in fretta fino al 10.
// Idee prese dall'IA di Run & Bun (conosce la tua squadra; KO veloce > KO lento; priorità quando sta per cadere ed è più lento;
// mai potenziarsi se l'avversario lo manda KO; regole per cure, trappole, Protect, paralisi) e dal gioco dei giocatori forti di
// VGC/Champions (guardare un turno avanti, prevedere cambi e Protect, attacchi concentrati, controllo della velocità, non sprecare
// il Pokémon che vince la partita, nei BO3 adattarsi a come gioca l'avversario: dal livello 8 la memoria O.aiMem passa da una lotta all'altra).
// rnd: probabilità di giocare a caso · noise: errore nei punteggi · sw: quanto spesso fa un cambio giusto · spd: tiene conto di chi è più veloce
// know: conosce i tuoi set veri (statistiche, mosse, strumento, abilità) · look: guarda avanti (1 = il turno, 2 = anche chi vince lo scontro)
// pred / mem: forza delle previsioni di cambi e Protect / peso della memoria · prev: scelta dei Pokémon all'inizio · tera: uso della Tera
const AIL=[null,
 {rnd:.6, noise:45, sw:0,   spd:0,know:0,look:0,pred:0,  mem:0,  prev:0,tera:0},
 {rnd:.08,noise:20, sw:.3,  spd:0,know:0,look:0,pred:0,  mem:0,  prev:1,tera:1},
 {rnd:.04,noise:14, sw:.45, spd:1,know:0,look:0,pred:0,  mem:0,  prev:1,tera:1},
 {rnd:.02,noise:10, sw:.6,  spd:1,know:0,look:0,pred:0,  mem:0,  prev:1,tera:1},
 {rnd:.01,noise:7,  sw:.75, spd:1,know:0,look:0,pred:0,  mem:0,  prev:1,tera:2},
 {rnd:0,  noise:4.5,sw:.9,  spd:1,know:1,look:0,pred:0,  mem:0,  prev:2,tera:2},
 {rnd:0,  noise:3,  sw:1,   spd:1,know:1,look:1,pred:0,  mem:0,  prev:2,tera:2},
 {rnd:0,  noise:2,  sw:1,   spd:1,know:1,look:1,pred:.5, mem:.5, prev:3,tera:2},
 {rnd:0,  noise:1,  sw:1,   spd:1,know:1,look:2,pred:.75,mem:.75,prev:3,tera:3,sim:1},
 {rnd:0,  noise:.3, sw:1,   spd:1,know:1,look:2,pred:1,  mem:1,  prev:3,tera:3,sim:2}];
const AI_SETUP={swordsdance:1,dragondance:1,nastyplot:1,calmmind:1,bulkup:1,quiverdance:1,shellsmash:1,coil:1,agility:1,rockpolish:1,autotomize:1,victorydance:1,tidyup:1,shiftgear:1,growth:1,honeclaws:1,workup:1,curse:1,bellydrum:1,filletaway:1,irondefense:.5,amnesia:.5,cosmicpower:.5,acidarmor:.5,cottonguard:.5};
const AI_HEAL={recover:1,roost:1,softboiled:1,slackoff:1,moonlight:1,morningsun:1,synthesis:1,shoreup:1,milkdrink:1,healorder:1,strengthsap:1,rest:1};
const AI_HAZ={stealthrock:'stealthrock',spikes:'spikes',toxicspikes:'toxicspikes',stickyweb:'stickyweb'};
const AI_STATUS={willowisp:'brn',thunderwave:'par',toxic:'tox',spore:'slp',sleeppowder:'slp',hypnosis:'slp',yawn:'slp',glare:'par',nuzzle:'par',stunspore:'par',poisonpowder:'psn',darkvoid:'slp',sing:'slp',lovelykiss:'slp'};
const AI_SPREAD=['allAdjacentFoes','allAdjacent'];
const PROTECTS_ID=new Set(['protect','detect','kingsshield','spikyshield','banefulbunker','silktrap','burningbulwark','obstruct','maxguard']);
// abilità che annullano un tipo di mossa (Run & Bun: l'IA conosce le tue abilità)
const AB_IMM={Levitate:'Ground','Earth Eater':'Ground','Flash Fire':'Fire','Well-Baked Body':'Fire','Water Absorb':'Water','Storm Drain':'Water','Dry Skin':'Water','Volt Absorb':'Electric','Lightning Rod':'Electric','Motor Drive':'Electric','Sap Sipper':'Grass'};
const AB_NOST={par:['Limber'],slp:['Insomnia','Vital Spirit','Sweet Veil'],brn:['Water Veil','Water Bubble','Thermal Exchange'],psn:['Immunity','Pastel Veil'],tox:['Immunity','Pastel Veil']};
const aiOther=s=>s==='p1'?'p2':'p1';
const aiMem=()=>O.aiMem||(O.aiMem={});
const aiW=()=>B.weather||'';
function aiStat(base,lvl,isHP){ return isHP?Math.floor((2*base+31+21)*lvl/100)+lvl+10:Math.floor(((2*base+31+21)*lvl/100+5)); }
function aiMul(st){ return st>0?(2+st)/2:2/(2-st); }
function aiEff(type,defTypes){ if(!Dex.getImmunity(type,defTypes)) return 0; return Math.pow(2,Dex.getEffectiveness(type,defTypes)); }
// descrizione "da giocatore" di un Pokémon: statistiche stimate dalle base (come farebbe un giocatore esperto senza vedere i set)
function aiMon(side,sp,extra){ const s=Dex.species.get(sp); const lvl=100, b=s.baseStats; const ab=Object.values(s.abilities);
  const o={sp:s.name,types:s.types.slice(),origTypes:s.types.slice(),lvl,hpStat:aiStat(b.hp,lvl,true),atk:aiStat(b.atk,lvl),def:aiStat(b.def,lvl),spa:aiStat(b.spa,lvl),spd:aiStat(b.spd,lvl),spe:aiStat(b.spe,lvl),boosts:{},st:'',ability:ab.length===1?ab[0]:null,item:'',hpPct:100,side};
  return Object.assign(o,extra||{}); }
// un Pokémon dalla richiesta del motore (dati veri): per il proprio lato sempre, per l'altro solo se l'IA conosce i set
function aiOwn(x,side){ const sp=x.details.split(',')[0]; const m=aiMon(side,sp); const S=x.stats||{};
  Object.assign(m,{atk:S.atk||m.atk,def:S.def||m.def,spa:S.spa||m.spa,spd:S.spd||m.spd,spe:S.spe||m.spe});
  const hp=parseHP(x.condition); m.hpStat=hp&&hp.max||m.hpStat; m.hpPct=hp&&hp.max?hp.hp/hp.max*100:0; m.st=hp&&hp.st||'';
  m.ability=Dex.abilities.get(x.ability||x.baseAbility).name; m.item=x.item?Dex.items.get(x.item).name:''; m.nick=String(x.ident).split(': ')[1]; m.active=!!x.active;
  m.moves=(x.moves||[]).map(id=>Dex.moves.get(id)).filter(d=>d.exists);
  const tm=B.side[side]&&B.side[side].team[m.nick]; if(tm){ m.boosts=tm.boosts||{}; if(tm.tera){ m.types=[tm.tera]; m.tera=tm.tera; } else if(tm.tchange&&tm.tchange.length) m.types=tm.tchange.slice(); }
  if(x.terastallized){ m.types=[x.terastallized]; m.tera=x.terastallized; } return m; }
// la squadra dell'altro lato vista dall'IA: con know i set veri, altrimenti specie (note dalla schermata della squadra), PS visti, mosse già usate
function aiOppTeam(F,know){ const out=[], acts=[B.side[F].act,B.side[F].actb].filter(Boolean);
  if(know&&B.req[F]&&B.req[F].side){ for(const x of B.req[F].side.pokemon){ const o=aiOwn(x,F); if(o.active) o.pos=B.side[F].act===o.nick?F:F+'b'; if(o.hpPct>0) out.push(o); } return out; }
  const team=Object.values(B.side[F].team), M=aiMem(), used=new Set();
  for(const s of B.sets[F]||[]){ const base=Dex.species.get(s.species).baseSpecies;
    const tm=team.find(t=>!used.has(t.nick)&&(t.nick===s.name||Dex.species.get(t.species).baseSpecies===base)); if(tm) used.add(tm.nick);
    const o=aiMon(F,tm?tm.species:s.species,{nick:tm?tm.nick:(s.name||s.species)});
    if(tm){ o.hpPct=tm.max?tm.hp/tm.max*100:100; o.st=tm.st||''; o.boosts=tm.boosts||{}; if(tm.tera){ o.types=[tm.tera]; o.tera=tm.tera; } else if(tm.tchange&&tm.tchange.length) o.types=tm.tchange.slice();
      if(tm.itemSeen) o.item=tm.item||''; if(tm.abilitySeen) o.ability=tm.abilitySeen; o.active=acts.includes(tm.nick); if(o.active) o.pos=B.side[F].act===tm.nick?F:F+'b'; }
    const seen=M.mv&&M.mv[baseSp(o.sp)]; o.moves=seen?Object.keys(seen).map(id=>Dex.moves.get(id)).filter(d=>d.exists):[]; o.partial=true;
    if(o.hpPct>0&&!(tm&&tm.st==='fnt')) out.push(o); }
  return out; }
function aiSpe(x){ if(!x) return 0; let s=x.spe*aiMul((x.boosts||{}).spe||0); if(x.st==='par'&&x.ability!=='Quick Feet') s*=.5; if(x.item==='Choice Scarf') s*=1.5; if(x.item==='Iron Ball') s*=.5;
  const ab=x.ability, w=aiW(); if((ab==='Swift Swim'&&/Rain|Primordial/.test(w))||(ab==='Chlorophyll'&&/Sunny|Desolate/.test(w))||(ab==='Sand Rush'&&/Sand/.test(w))||(ab==='Slush Rush'&&/Snow|Hail/.test(w))) s*=2;
  if(x.side&&B.cond[x.side]&&B.cond[x.side].tailwind) s*=2; return s; }
const aiTR=()=>!!(B.field&&B.field.trickroom);
function aiPrio(mv,x){ if(!mv) return 0; let p=mv.priority||0; if(x&&x.ability==='Prankster'&&mv.category==='Status') p++; if(x&&x.ability==='Gale Wings'&&mv.type==='Flying'&&x.hpPct>=99) p++;
  if(x&&x.ability==='Triage'&&mv.flags&&mv.flags.heal) p+=3; if(mv.id==='grassyglide'&&B.field&&B.field.grassyterrain) p++; return p; }
// chi agisce prima tra a (mossa ma) e b (mossa mb): priorità, poi velocità (Distorsione la inverte); a parità l'IA si crede più veloce (come Run & Bun)
function aiFirst(a,ma,b,mb){ const pa=aiPrio(ma,a), pb=aiPrio(mb,b); if(pa!==pb) return pa>pb; const sa=aiSpe(a), sb=aiSpe(b); return aiTR()?sa<=sb:sa>=sb; }
const aiSash=(x,d)=>x&&x.hpPct>=99.5&&(x.item==='Focus Sash'||x.ability==='Sturdy')&&d<200;
// danno stimato (in % dei PS massimi del difensore). roll: .925 media, .85 minimo, 1 massimo
function aiDmg(mv,A,D,roll){ if(!mv||!A||!D||mv.category==='Status') return 0; roll=roll||.925; const id=mv.id;
  if(id==='seismictoss'||id==='nightshade') return aiEff(id==='nightshade'?'Ghost':'Fighting',D.types)?100/D.hpStat*100:0;
  if(id==='superfang'||id==='ruination'||id==='naturesmadness') return aiEff(mv.type,D.types)?D.hpPct/2:0;
  if(id==='finalgambit'||id==='endeavor'||id==='counter'||id==='mirrorcoat'||id==='metalburst') return 0;
  let bp=mv.basePower||0;
  if(!bp) bp=id==='lowkick'||id==='grassknot'?80:id==='heavyslam'||id==='heatcrash'?80:id==='gyroball'||id==='electroball'?80:60;
  if(id==='acrobatics'&&!A.item) bp*=2; if(id==='knockoff'&&D.item) bp*=1.5; if(id==='hex'&&D.st) bp*=2; if(id==='facade'&&A.st&&A.st!=='slp') bp*=2;
  if(id==='venoshock'&&/psn|tox/.test(D.st)) bp*=2; if(id==='eruption'||id==='waterspout'||id==='dragonenergy') bp=Math.max(1,150*(A.hpPct||100)/100);
  if(id==='brine'&&D.hpPct<=50) bp*=2; if(id==='boltbeak'||id==='fishiousrend') bp*=1.5;
  if(mv.multihit) bp*=Array.isArray(mv.multihit)?(A.ability==='Skill Link'?mv.multihit[1]:mv.multihit[1]>=5?3.1:2):mv.multihit;
  let type=id==='terablast'&&A.tera?A.tera:mv.type; const ab=A.ability||'', dab=D.ability||'';
  const ate={Aerilate:'Flying',Pixilate:'Fairy',Refrigerate:'Ice',Galvanize:'Electric'}; if(type==='Normal'&&ate[ab]){ type=ate[ab]; bp*=1.2; }
  const eff=aiEff(type,D.types); if(!eff) return 0;
  if(dab&&AB_IMM[dab]===type&&ab!=='Mold Breaker') return 0; if(dab==='Wonder Guard'&&eff<2) return 0;
  if(mv.flags&&((dab==='Bulletproof'&&mv.flags.bullet)||(dab==='Soundproof'&&mv.flags.sound))) return 0;
  if(type==='Ground'&&D.item==='Air Balloon') return 0;
  const phys=mv.category==='Physical', hitsDef=phys||id==='psyshock'||id==='psystrike'||id==='secretsword';
  let atkS=id==='bodypress'?A.def:id==='foulplay'?D.atk:(phys?A.atk:A.spa), defS=hitsDef?D.def:D.spd;
  atkS*=aiMul(((id==='foulplay'?D.boosts:A.boosts)||{})[id==='bodypress'?'def':phys?'atk':'spa']||0);
  if(ab!=='Unaware') defS*=aiMul((D.boosts||{})[hitsDef?'def':'spd']||0);
  if(phys&&(ab==='Huge Power'||ab==='Pure Power')) atkS*=2; if(phys&&(ab==='Hustle'||(ab==='Guts'&&A.st))) atkS*=1.5;
  if(A.item==='Choice Band'&&phys) atkS*=1.5; if(A.item==='Choice Specs'&&!phys) atkS*=1.5;
  if(D.item==='Assault Vest'&&!hitsDef) defS*=1.5; if(D.item==='Eviolite'&&Dex.species.get(D.sp).nfe) defS*=1.5;
  const w=aiW(); if(/Sand/.test(w)&&!hitsDef&&D.types.includes('Rock')) defS*=1.5; if(/Snow/.test(w)&&hitsDef&&D.types.includes('Ice')) defS*=1.5;
  let d=Math.floor(Math.floor(2*A.lvl/5+2)*bp*atkS/Math.max(1,defS))/50+2;
  const orig=A.origTypes||A.types; if(A.types.includes(type)||orig.includes(type)||ab==='Protean'||ab==='Libero'){ let st=ab==='Adaptability'?2:1.5; if(A.tera&&A.tera===type&&orig.includes(type)) st=ab==='Adaptability'?2.25:2; d*=st; }
  d*=eff;
  if(/Sunny|Desolate/.test(w)){ if(type==='Fire') d*=1.5; if(type==='Water') d*=/Desolate/.test(w)?0:.5; }
  if(/Rain|Primordial/.test(w)){ if(type==='Water') d*=1.5; if(type==='Fire') d*=/Primordial/.test(w)?0:.5; }
  if(phys&&A.st==='brn'&&ab!=='Guts'&&id!=='facade') d*=.5;
  const fl=mv.flags||{};
  if(ab==='Technician'&&bp<=60) d*=1.5; if(ab==='Tough Claws'&&fl.contact) d*=1.3; if(ab==='Sheer Force'&&mv.secondaries) d*=1.3; if(ab==='Iron Fist'&&fl.punch) d*=1.2;
  if(ab==='Strong Jaw'&&fl.bite) d*=1.5; if(ab==='Sharpness'&&fl.slicing) d*=1.5; if(ab==='Mega Launcher'&&fl.pulse) d*=1.5; if(ab==='Punk Rock'&&fl.sound) d*=1.3;
  if(ab==='Tinted Lens'&&eff<1) d*=2; if(ab==='Water Bubble'&&type==='Water') d*=2; if(ab==='Steelworker'&&type==='Steel') d*=1.5; if(ab==='Transistor'&&type==='Electric') d*=1.3; if(ab==="Dragon's Maw"&&type==='Dragon') d*=1.5; if(ab==='Rocky Payload'&&type==='Rock') d*=1.5;
  if(dab==='Thick Fat'&&(type==='Fire'||type==='Ice')) d*=.5; if((dab==='Heatproof'||dab==='Water Bubble')&&type==='Fire') d*=.5; if(dab==='Purifying Salt'&&type==='Ghost') d*=.5;
  if(dab==='Fluffy'){ if(fl.contact) d*=.5; if(type==='Fire') d*=2; } if(dab==='Ice Scales'&&!phys) d*=.5; if(dab==='Fur Coat'&&phys) d*=.5; if(dab==='Punk Rock'&&fl.sound) d*=.5;
  if((dab==='Multiscale'||dab==='Shadow Shield')&&D.hpPct>=99.5) d*=.5; if((dab==='Filter'||dab==='Solid Rock'||dab==='Prism Armor')&&eff>1) d*=.75;
  if(A.item==='Life Orb') d*=1.3; if(A.item==='Expert Belt'&&eff>1) d*=1.2;
  const sc=(D.side&&B.cond[D.side])||{}; if(sc.auroraveil||(hitsDef?sc.reflect:sc.lightscreen)) d*=isDbl()?2732/4096:.5;
  let pct=d*roll/D.hpStat*100;
  if(pct>=D.hpPct&&aiSash(D,pct)&&!mv.multihit) pct=D.hpPct-.5;
  return pct; }
// danni da trappole entrando in campo
function aiHaz(x){ const c=(x.side&&B.cond[x.side])||{}; if(x.item==='Heavy-Duty Boots'||x.ability==='Magic Guard') return 0; let d=0;
  if(c.stealthrock) d+=12.5*aiEff('Rock',x.types);
  if(c.spikes&&!x.types.includes('Flying')&&x.ability!=='Levitate'&&x.item!=='Air Balloon') d+=[0,12.5,16.7,25][Math.min(3,c.spikes)]; return d; }
// mosse che l'IA considera per un Pokémon: quelle vere (o già viste); se ne conosce meno di 4 aggiunge un attacco del suo tipo da 90 di potenza
function aiMoves(x){ const l=(x.moves||[]).filter(m=>m.category!=='Status'); if(x.partial&&(x.moves||[]).length<4) for(const ty of x.types) l.push({id:'x',name:ty,type:ty,basePower:90,category:x.atk>=x.spa?'Physical':'Special',priority:0,flags:{}}); return l; }
function aiBest(A,D,roll){ let best={mv:null,d:0}; if(!A||!D) return best; for(const m of aiMoves(A)){ const d=aiDmg(m,A,D,roll)*(isDbl()&&AI_SPREAD.includes(m.target)?.75:1); if(d>best.d) best={mv:m,d}; } return best; }
function aiThreat(A,D,roll){ return aiBest(A,D,roll).d; }
// chi vince lo scontro uno contro uno (ognuno usa il suo attacco migliore): 1 vince a, -1 vince b
function aiRace(a,aHp,b,bHp){ if(aHp<=0) return -1; if(bHp<=0) return 1; const ba=aiBest(a,b), bb=aiBest(b,a);
  const ta=ba.d>0?Math.ceil(bHp/ba.d):99, tb=bb.d>0?Math.ceil(aHp/bb.d):99; if(ta===99&&tb===99) return 0; if(ta!==tb) return ta<tb?1:-1; return aiFirst(a,ba.mv,b,bb.mv)?1:-1; }
// quanto vale un Pokémon: quota degli avversari rimasti che batte uno contro uno (per non sprecare chi vince la partita)
function aiVal(x,opp){ if(!opp.length) return 0; let w=0; for(const o of opp) if(aiRace(x,x.hpPct,o,o.hpPct)>0) w++; return w/opp.length; }
const aiNoise=L=>Math.random()*AIL[L].noise;

// ---------- singolo ----------
function aiSingle(r,L,S){ const P=AIL[L], F=aiOther(S), M=aiMem();
  if(r.teamPreview) return aiPreview(r,L,S);
  if(Math.random()<P.rnd) return cpuSingle(r);
  const team=r.side.pokemon, opp=aiOppTeam(F,P.know), foe=opp.find(o=>o.active);
  const own=team.map((x,i)=>Object.assign(aiOwn(x,S),{idx:i,pos:S})).filter(o=>o.hpPct>0), bench=own.filter(o=>!team[o.idx].active);
  if(r.forceSwitch){ if(!bench.length) return 'pass'; return 'switch '+(aiReplace(bench,foe,opp,L).idx+1); }
  const a=r.active&&r.active[0], mine=own.find(o=>team[o.idx].active); if(!a||!mine||!foe) return cpuSingle(r);
  const opts=a.moves.map((m,i)=>({m,i,d:Dex.moves.get(m.id||m.move)})).filter(x=>!x.m.disabled&&(x.m.pp===undefined||x.m.pp>0));
  if(!opts.length) return 'move 1';
  const fBest=aiBest(foe,mine,P.look>=2?1:.925), danger=fBest.d;
  const c={P,L,S,F,M,mine,foe,opp,own,bench,danger,fBest,myHp:mine.hpPct,foeHp:foe.hpPct,faster:aiFirst(mine,null,foe,null)};
  for(const o of opts) o.s=aiScoreMove(o.d,c);
  // previsione: se l'avversario sta per cambiare, colpisce chi entra (o si potenzia/piazza trappole nel turno libero)
  c.pS=0; if(P.pred&&opp.length>1){ const pS=aiPSwitch(c); const Y=pS>.2?aiPredIn(c):null;
    if(Y){ c.pS=pS; c.Y=Y; for(const o of opts){ if(o.d.category!=='Status'){ const dy=aiDmg(o.d,mine,Y); o.s=(1-pS)*o.s+pS*(Math.min(dy,Y.hpPct+10)+(dy>=Y.hpPct?30:0)); } else if(AI_SETUP[o.d.id]||AI_HAZ[o.d.id]||AI_STATUS[o.d.id]) o.s+=pS*15; } } }
  const trapped=a.trapped||a.maybeTrapped; let pick=null;
  if(P.look){ // un turno avanti: quanto perdo restando (o cambiando) e chi vince poi lo scontro
    const acts=opts.map(o=>({o,s:o.s+aiLookMove(o,c)}));
    if(!trapped) for(const b of bench) acts.push({b,s:aiLookSwitch(b,c)});
    for(const x of acts) x.s+=aiNoise(L); acts.sort((x,y)=>y.s-x.s); pick=acts[0];
    // dal livello 9: le azioni migliori si provano sulla copia della lotta contro le risposte probabili
    if(P.sim&&aiSimInit()){ const replies=aiReplies(F,P.sim>=2?4:3); let bestS=null;
      if(replies.length) for(const x of acts.slice(0,P.sim>=2?7:5)){ const ch=x.b?'switch '+(x.b.idx+1):'move '+(x.o.i+1)+(a.canMegaEvo?' mega':a.canTerastallize&&aiTeraOk(a.canTerastallize,x.o,c)?' terastallize':'');
        const sc=aiSimEval(ch,replies,S,P.sim>=2?2:1); if(sc!=null&&(!bestS||sc+x.s*.05>bestS.s)) bestS={s:sc+x.s*.05,x}; }
      if(bestS) pick=bestS.x; }
  } else {
    for(const o of opts) o.s+=aiNoise(L); opts.sort((x,y)=>y.s-x.s); pick={o:opts[0],s:opts[0].s};
    // cambio "a regola": se resto vado KO e in panchina c'è chi regge molto meglio
    if(!trapped&&bench.length&&Math.random()<P.sw){ const b=bench.map(x=>({x,sc:aiSwScore(x,foe)})).sort((p,q)=>q.sc-p.sc)[0], best=opts[0], stay=-danger*1.2+best.s*.8+c.myHp*.3;
      if((danger>=c.myHp*.9&&best.s<60&&b.sc>stay+25)||(best.s<5&&b.sc>stay&&c.myHp>50)) pick={b:b.x}; } }
  (B.aiLog=B.aiLog||[]).push({L,me:mine.sp,foe:foe.sp,danger:Math.round(danger),hp:Math.round(c.myHp),pS:Math.round(c.pS*100),Y:c.Y&&c.Y.sp,pick:pick.b?'→'+pick.b.sp:pick.o.d.name,s:Math.round(pick.s)}); if(B.aiLog.length>60) B.aiLog.shift();
  if(pick.b){ B.aiSwT=B.turn; return 'switch '+(pick.b.idx+1); }
  const best=pick.o; let ch='move '+(best.i+1); aiProtMark(S,PROTECTS_ID.has(best.d.id));
  if(a.canMegaEvo) ch+=' mega'; else if(a.canTerastallize&&aiTeraOk(a.canTerastallize,best,c)) ch+=' terastallize';
  return ch; }
// punteggio di una mossa (scala: circa i "% di PS" tolti, più bonus come nell'IA di Run & Bun)
function aiScoreMove(mv,c){ const {P,L,mine,foe,danger,faster,myHp,foeHp}=c, id=mv.id; let s=0;
  const dead=danger>=myHp&&!aiSash(mine,danger), slower=!faster, foeInc=foe.st==='slp'||foe.st==='frz';
  if(mv.category!=='Status'){
    const dAvg=aiDmg(mv,mine,foe), dKO=L>=8?aiDmg(mv,mine,foe,.85):dAvg; s=Math.min(dAvg,foeHp+10);
    const pr=aiPrio(mv,mine)>0&&!(B.field&&B.field.psychicterrain), first=pr||faster;
    if(dKO>=foeHp){ s+=!P.spd?60:first?70:(dead?0:35); }
    if(P.spd&&dead&&slower&&pr) s+=40;
    if(P.spd&&dead&&!first) s*=.35;
    if(mv.self&&mv.self.boosts&&Object.values(mv.self.boosts).some(v=>v<0)&&dKO<foeHp) s-=8;
    if(mv.recoil||mv.mindBlownRecoil) s-=myHp<30?15:3;
    if(mv.flags&&mv.flags.charge&&mine.item!=='Power Herb'&&!(id==='solarbeam'&&/Sunny|Desolate/.test(aiW()))) s-=30;
    if(mv.flags&&mv.flags.recharge&&dKO<foeHp) s-=20;
    if(L>=2&&mv.accuracy!==true&&mv.accuracy<100) s*=mv.accuracy/100;
    if(id==='fakeout'||id==='firstimpression'){ const fresh=B.aiFresh&&B.aiFresh[mine.pos||c.S]===B.turn; s=fresh?s+(id==='fakeout'?(foe.types.includes('Ghost')||foe.ability==='Inner Focus'?-40:14):0):-60; }
    if(id==='suckerpunch'&&B.aiSucker===B.turn-1) s*=.5;
    if(id==='knockoff'&&foe.item) s+=6;
    if(['uturn','voltswitch','flipturn'].includes(id)&&c.bench.length) s+=danger>=myHp*.6?15:3;
    if(mv.drain) s+=Math.min(dAvg,foeHp)*mv.drain[0]/mv.drain[1]*(myHp<70?.5:.15);
    if(['icywind','electroweb','rocktomb','bulldoze','mudshot','lowsweep'].includes(id)&&slower&&!dead&&!['Clear Body','White Smoke','Contrary'].includes(foe.ability)) s+=8;
    if((id==='explosion'||id==='selfdestruct'||id==='mistyexplosion')&&myHp>40) s-=40;
    return s; }
  const fm=foe.moves||[], boosted=Object.values(mine.boosts||{}).reduce((a,b)=>a+Math.max(0,b),0);
  if(AI_SETUP[id]){ if(dead||foe.ability==='Unaware'&&id!=='swordsdance') return -20;
    s=boosted>=4?0:30*AI_SETUP[id]; if(slower&&danger*2>=myHp) s-=20; if(foeInc) s+=20; if(L>=9) s+=aiSetupGain(mv,c);
    if(id==='bellydrum') s=myHp>75&&danger<myHp-50?45:0; if(id==='shellsmash') s=danger<myHp*.5?50:5; if((id==='agility'||id==='rockpolish'||id==='autotomize')&&faster) s=-10;
    if(id==='curse'&&mine.types.includes('Ghost')) s=myHp>60&&foe.hpPct>50?18:0; return s; }
  if(AI_HEAL[id]) return myHp>=99?-20:aiShouldHeal(c,id)?55:(myHp>=85?-6:5);
  if(AI_HAZ[id]){ const cnd=B.cond[c.F]||{}, lv=cnd[AI_HAZ[id]]||0, ok=id==='spikes'?lv<3:id==='toxicspikes'?lv<2:!lv;
    if(!ok) return -20; s=10+c.opp.length*5+(B.aiFresh&&B.aiFresh[mine.pos||c.S]===B.turn?8:0)-(B.turn>10?8:0); if(dead) s-=25; if(id==='stickyweb') s+=5; return s; }
  if(AI_STATUS[id]){ const t=AI_STATUS[id]; if(foe.st||(AB_NOST[t]||[]).includes(foe.ability)||foe.ability==='Purifying Salt'||foe.ability==='Good as Gold'||foe.ability==='Magic Bounce') return -20;
    if(t==='slp'&&(B.field&&(B.field.electricterrain||B.field.mistyterrain))) return -20;
    s=22; if(t==='brn'&&(foe.types.includes('Fire')||foe.ability==='Guts')) return -20; if(t==='brn'&&foe.atk>foe.spa) s+=15;
    if(t==='par'&&(foe.types.includes('Electric')||(id==='thunderwave'&&(foe.types.includes('Ground')||foe.ability==='Volt Absorb')))) return -20;
    if(t==='par'&&!faster&&aiSpe(mine)>aiSpe(foe)/2) s+=15; if((t==='tox'||t==='psn')&&(foe.types.includes('Steel')||foe.types.includes('Poison'))) return -20;
    if(t==='slp'&&(id==='sleeppowder'||id==='spore')&&(foe.types.includes('Grass')||foe.ability==='Overcoat'||foe.item==='Safety Goggles')) return -20; if(t==='slp') s+=12;
    if(mv.accuracy!==true&&L>=2) s*=mv.accuracy/100; if(dead&&slower) s-=15; return s; }
  if(PROTECTS_ID.has(id)){ if(!aiProtOk(c.S,foe)) return -40; s=((B.aiProt||{})[c.S]===B.turn-1?2:4)+(aiStall(foe)?14:0); if(/psn|tox|brn/.test(mine.st)) s-=4; if(/psn|tox|brn/.test(foe.st)) s+=8; if((B.cond[c.S]||{}).wish) s+=25; return s; }
  if(id==='substitute') return myHp<=50||fm.some(m=>m.flags&&m.flags.sound)?-20:foeInc?28:(danger<25?18:0);
  if(['defog','rapidspin','mortalspin','courtchange'].includes(id)){ const mc=B.cond[c.S]||{}; return (mc.stealthrock||mc.spikes||mc.toxicspikes||mc.stickyweb)?30:0; }
  if(id==='taunt') return fm.some(m=>m.category==='Status')?(faster?26:16):6;
  if(id==='encore'){ const lm=M_last(c,foe); return lm&&lm.category==='Status'&&faster?40:4; }
  if(id==='trick'||id==='switcheroo') return /Choice|Toxic Orb|Flame Orb|Iron Ball|Lagging Tail|Sticky Barb|Black Sludge/.test(mine.item||'')?24:6;
  if(id==='destinybond') return dead&&faster?45:dead?12:0;
  if(id==='trickroom') return aiTR()?-40:(slower?32:-10);
  if(id==='tailwind') return (B.cond[c.S]||{}).tailwind?-30:(slower?30:6);
  if(id==='painsplit') return myHp<foe.hpPct-20?35:0;
  if(id==='wish') return myHp<60?28:8;
  if(id==='healingwish'||id==='lunardance'||id==='memento') return myHp<30&&c.bench.length?30:0;
  if(id==='reflect'||id==='lightscreen'||id==='auroraveil'){ const sc=B.cond[c.S]||{}; return sc[id]||(id==='auroraveil'&&!/Snow|Hail/.test(aiW()))?-20:18; }
  if(id==='haze'||id==='roar'||id==='whirlwind'){ const fb=Object.values(foe.boosts||{}).reduce((a,b)=>a+Math.max(0,b),0); return fb>=2?40:(id!=='haze'&&Object.keys(B.cond[c.F]||{}).some(k=>AI_HAZ[k])?14:2); }
  if(id==='leechseed') return foe.types.includes('Grass')?-20:18;
  return 8; }
const M_last=(c,foe)=>{ const id=c.M.last&&c.M.last[foe.nick]; return id?Dex.moves.get(id):null; };
// Run & Bun "conviene curarsi?"
function aiShouldHeal(c,id){ const {mine,danger,faster,myHp}=c, heal=id==='rest'?100:50; if(mine.st==='tox') return false; if(danger>=heal&&danger<myHp) return false;
  if(faster){ if(danger>=myHp) return danger<myHp+heal; if(myHp<40) return true; if(myHp<66) return Math.random()<.5; }
  else { if(myHp<50) return true; if(myHp<70) return Math.random()<.75; } return false; }
// livello 9+: dopo il potenziamento divento abbastanza forte (o veloce) da vincere?
function aiSetupGain(mv,c){ const bo=mv.boosts||(mv.self&&mv.self.boosts)||{}; const m2=Object.assign({},c.mine,{boosts:Object.assign({},c.mine.boosts)});
  for(const k in bo) m2.boosts[k]=Math.max(-6,Math.min(6,(m2.boosts[k]||0)+bo[k]));
  const before=aiBest(c.mine,c.foe).d, after=aiBest(m2,c.foe).d, fast=aiFirst(m2,null,c.foe,null); let g=0;
  if(after>before*1.25) g+=8; if(after>=c.foeHp&&fast) g+=18; if(c.danger*2>=c.myHp) g-=15;
  if(c.opp.length>1&&c.opp.filter(o=>!o.active).every(o=>aiThreat(o,m2)<c.myHp*.5)) g+=10; return g; }
// probabilità che l'avversario cambi Pokémon: di base (35% se minacciato) corretta con quello che ha fatto finora
function aiPSwitch(c){ const thr=aiBest(c.mine,c.foe).d>=c.foe.hpPct*.8||c.foe.hpPct<50, prior=thr?.35:.06, k=c.M[thr?'thr':'calm'];
  let p=prior; if(k&&c.P.mem) p=prior+c.P.mem*((k.sw+prior*3)/(k.n+3)-prior); return Math.min(.9,p)*Math.min(1,c.P.pred+.25); }
// chi entrerà: quello che ha già usato contro questo Pokémon (memoria), altrimenti chi resiste meglio al mio attacco migliore
function aiPredIn(c){ const cand=c.opp.filter(o=>!o.active); if(!cand.length) return null;
  const sw=c.P.mem&&c.M.swTo&&c.M.swTo[baseSp(c.mine.sp)]; if(sw){ const top=cand.map(o=>({o,n:sw[baseSp(o.sp)]||0})).sort((a,b)=>b.n-a.n)[0]; if(top.n) return top.o; }
  return cand.map(o=>({o,s:-aiBest(c.mine,o).d+aiThreat(o,c.mine)*.5})).sort((a,b)=>b.s-a.s)[0].o; }
// guardare un turno avanti, restando con una mossa: quanto danno ricevo prima/dopo, vado KO prima di agire?, chi vince poi lo scontro
function aiLookMove(o,c){ const {mine,foe,fBest,P}=c, mv=o.d; let v=0;
  const first=aiFirst(mine,mv,foe,fBest.mv), dealt=mv.category==='Status'?0:aiDmg(mv,mine,foe), kill=dealt>=c.foeHp;
  let taken=(first&&kill)?0:Math.min(c.danger,c.myHp); if(PROTECTS_ID.has(mv.id)&&aiProtOk(c.S,foe)) taken=0;
  const dies=taken>=c.myHp&&!aiSash(mine,taken);
  taken*=(1-c.pS); v-=taken*(1+(P.mem?.4*aiVal(mine,c.opp):0)); if(dies&&!first) v-=o.s*.6; if(dies) v-=30*(1-c.pS);
  if(P.look>=2&&!dies&&!kill){ const r=aiRace(mine,c.myHp-taken,foe,c.foeHp-dealt); v+=r*18; }
  return v; }
function aiLookSwitch(b,c){ const {foe,fBest,P}=c; let taken=aiDmg(fBest.mv,foe,b)*(1-c.pS)+aiHaz(b); taken=Math.min(taken,b.hpPct);
  let v=-taken*(1+(P.mem?.4*aiVal(b,c.opp):0))-8; if(taken>=b.hpPct) v-=40; if(B.aiSwT===B.turn-1) v-=12;
  if(P.look>=2&&taken<b.hpPct) v+=aiRace(b,b.hpPct-taken,foe,c.foeHp)*22; else { const hit=aiBest(b,foe).d; v+=Math.min(hit,c.foeHp)*.3; }
  return v; }
function aiSwScore(x,foe){ const hit=aiBest(x,foe).d; return -aiThreat(foe,x)*1.2+hit*.8+x.hpPct*.3-aiHaz(x); }
// chi mandare in campo dopo un KO: dal livello 5 come Run & Bun (prima chi è più veloce e lo manda KO, poi chi lo manda KO e regge il colpo),
// dal 7 chi vince lo scontro, dall'8 senza sacrificare il Pokémon più prezioso
function aiReplace(bench,foe,opp,L){ if(L<=1||!foe) return bench[Math.random()*bench.length|0];
  const sc=bench.map(x=>{ let s=aiSwScore(x,foe); if(L>=5){ const bx=aiBest(x,foe), bf=aiBest(foe,x), hz=aiHaz(x);
      if(bx.d>=foe.hpPct&&aiFirst(x,bx.mv,foe,bf.mv)) s+=200; else if(bx.d>=foe.hpPct&&bf.d<x.hpPct-hz) s+=150;
      if(L>=7){ const rc=aiRace(x,x.hpPct-hz,foe,foe.hpPct); s+=rc*40; if(L>=8&&rc<0) s-=aiVal(x,opp)*40; } }
    return {x,s:s+aiNoise(L)}; }).sort((a,b)=>b.s-a.s); return sc[0].x; }
// Tera: 1 = quando l'attacco è del tipo Tera ed è forte; 2 = anche per assicurare un KO o per non andare KO; 3 = solo quando serve davvero
function aiTeraOk(tt,best,c){ const T=c.P.tera; if(!T) return false; const mv=best.d, off=mv.category!=='Status'&&(mv.type===tt||mv.id==='terablast');
  if(T===1) return off&&(best.s>=60||c.myHp<60);
  const m2=Object.assign({},c.mine,{types:[tt],tera:tt}), dNow=aiDmg(mv,c.mine,c.foe), dT=off?aiDmg(mv,m2,c.foe):0;
  const killT=dT>=c.foeHp&&dNow<c.foeHp, saves=c.danger>=c.myHp&&aiThreat(c.foe,m2)<c.myHp*.6;
  if(T===2) return killT||saves||(off&&best.s>=70);
  const v=aiVal(c.mine,c.opp); return (killT&&(v>=.5||c.opp.length<=2))||(saves&&v>=.34)||(c.opp.length===1&&(killT||saves)); }

// ---------- scelta dei Pokémon alla schermata della squadra ----------
// prev 1: stima dalle statistiche base; 2: conosce i tuoi set; 3: + ricorda chi hai portato e con chi hai iniziato (BO3)
function aiPreview(r,L,S){ const P=AIL[L], N=pickN(r)||(isDbl()?2:1), team=r.side.pokemon, need=Math.max(N,isDbl()?2:1), F=aiOther(S), M=aiMem();
  if(!P.prev) return 'team '+shuffleArr(team.map((x,i)=>i+1)).slice(0,need).join('');
  const foes=P.prev>=2&&B.req[F]&&B.req[F].side?B.req[F].side.pokemon.map(x=>aiOwn(x,F)):(B.sets[F]||[]).map(s=>Object.assign(aiMon(F,s.species),{partial:true,moves:[]}));
  const cnt=(l,sp)=>(l||[]).filter(g=>g.includes(sp)).length, games=(M.brought||[]).length;
  const w=foes.map(f=>{ const sp=baseSp(f.sp); return P.prev>=3&&games?.5+cnt(M.brought,sp)/games:1; });
  const mine=team.map((p,i)=>Object.assign(aiOwn(p,S),{i}));
  const mu=(me,f)=>Math.min(aiBest(me,f).d,100)-Math.min(aiThreat(f,me),100)*.8;
  const score=mine.map(me=>{ let s=0; foes.forEach((f,j)=>{ s+=w[j]*mu(me,f); });
    if(isDbl()&&(team[me.i].moves||[]).some(m=>['fakeout','tailwind','trickroom','followme','ragepowder','helpinghand'].includes(m))) s+=40;
    return {i:me.i,me,s:s+aiNoise(L)*2}; }).sort((a,b)=>b.s-a.s);
  let chosen=score.slice(0,need);
  // dal livello 8: chi è probabile che tu mandi in campo per primo (BO3) → scelgo l'apertura migliore contro di lui
  if(P.prev>=3&&(M.leads||[]).length){ const lc={}; for(const g of M.leads) for(const sp of g) lc[sp]=(lc[sp]||0)+1;
    const nl=isDbl()?2:1, lead=Object.entries(lc).sort((a,b)=>b[1]-a[1]).slice(0,nl).map(([sp])=>foes.find(f=>baseSp(f.sp)===sp)).filter(Boolean);
    if(lead.length){ const ls=x=>lead.reduce((t,f)=>t+mu(x.me,f)+aiRace(x.me,100,f,100)*25,0); const ord=chosen.slice().sort((a,b)=>ls(b)-ls(a)); chosen=ord.slice(0,nl).concat(chosen.filter(x=>!ord.slice(0,nl).includes(x))); } }
  return 'team '+chosen.map(x=>x.i+1).join(''); }

// ---------- doppio ----------
// Attacchi concentrati (bonus se insieme si fa KO), mosse ad area, Fake Out al primo turno, Protect quando i due avversari possono
// mandarlo KO, Tailwind/Trick Room se più lenti, Follow Me/Helping Hand/Wide Guard, stati sul più pericoloso, cambi in grave pericolo.
// Dal livello 8 prevede i Protect (memoria) e non spreca attacchi su chi si protegge; ricorda se concentri gli attacchi.
function aiDouble(r,L,S){ const P=AIL[L], F=aiOther(S), M=aiMem(), team=r.side.pokemon;
  if(r.teamPreview) return aiPreview(r,L,S);
  if(Math.random()<P.rnd) return cpuDbl(r);
  const opp=aiOppTeam(F,P.know), fPos=[F,F+'b'], myPos=[S,S+'b'];
  const foes=fPos.map(p=>{ const m=actMon(p); if(!m||m.st==='fnt'||!m.hp) return null; return opp.find(o=>o.nick===m.nick)||null; });
  const own=team.map((x,i)=>Object.assign(aiOwn(x,S),{idx:i,pos:i<2?myPos[i]:S}));
  const bench=own.filter((o,i)=>!team[i].active&&o.hpPct>0);
  const benchScore=x=>{ let s=x.hpPct*.3-aiHaz(x); for(const f of foes) if(f){ s-=aiThreat(f,x)*.9; const h=aiBest(x,f).d; s+=Math.min(h,f.hpPct)*.5; if(L>=5&&h>=f.hpPct) s+=aiFirst(x,null,f,null)?40:20; } return s+aiNoise(L); };
  const used=[];
  if(r.forceSwitch){ if(L<=1) return cpuDbl(r); return r.forceSwitch.map(need=>{ if(!need) return 'pass'; const c=bench.filter(x=>!used.includes(x.idx)).map(x=>({x,s:benchScore(x)})).sort((a,b)=>b.s-a.s)[0]; if(!c) return 'pass'; used.push(c.x.idx); return 'switch '+(c.x.idx+1); }).join(', '); }
  const mine=[0,1].map(i=>team[i]&&!team[i].condition.endsWith(' fnt')?own[i]:null);
  const tailOn=!!(B.cond[S]&&B.cond[S].tailwind), trOn=aiTR();
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, slower=avg(mine.filter(Boolean).map(aiSpe))<avg(foes.filter(Boolean).map(aiSpe));
  const foc=M.foc&&P.mem?.55+P.mem*((M.foc.same+.55*3)/(M.foc.n+3)-.55):.55;   // quanto l'avversario concentra gli attacchi
  const pProt=foes.map(f=>aiPProtect(f,mine,P,M));
  const plans=[null,null], cand=[null,null]; let megaUsed=false, teraUsed=false;
  for(let i=0;i<2;i++){
    const a=r.active&&r.active[i], me=mine[i]; if(!a||!me){ plans[i]='pass'; continue; }
    const ally=mine[1-i];
    const th=foes.map(f=>f?aiThreat(f,me):0), single=Math.max(0,...th), sum=th[0]+th[1], danger=single+foc*(sum-single);
    const before=foes.reduce((t,f,k)=>t+(f&&!aiFirst(me,null,f,null)?th[k]:0),0), deadFirst=P.spd&&before>=me.hpPct&&!aiSash(me,before);
    const opts=[];
    a.moves.forEach((m,j)=>{ if(m.disabled||(m.pp!==undefined&&m.pp<=0)) return; const d=Dex.moves.get(m.id); const locked=a.moves.length===1&&!m.target, t=locked?'self':(m.target||d.target);
      const add=(tgt,s)=>opts.push({j,tgt,s,d});
      if(d.category!=='Status'){ const pr=aiPrio(d,me)>0, slow=deadFirst&&!pr?.4:1, acc=L>=2&&d.accuracy!==true?d.accuracy/100:1;
        if(AI_SPREAD.includes(t)){ let s=0, kos=0; foes.forEach((f,k)=>{ if(!f) return; const dm=aiDmg(d,me,f)*.75; s+=Math.min(dm,f.hpPct)*(1-pProt[k]); if(dm>=f.hpPct) kos+=1-pProt[k]; });
          if(t==='allAdjacent'&&ally){ const hurt=aiDmg(d,me,ally)*.75; s-=hurt*1.3; if(hurt>=ally.hpPct) s-=80; }
          if(['icywind','electroweb','bulldoze','snarl','breakingswipe'].includes(d.id)) s+=12; add(null,(s+kos*45)*slow*acc); }
        else if(!['normal','any','adjacentFoe'].includes(t)){ let s=0; foes.forEach(f=>{ if(f) s=Math.max(s,Math.min(aiDmg(d,me,f),f.hpPct)); }); add(null,(locked?s+20:s)*slow*acc); } // senza bersaglio: Counter, mosse bloccate (Phantom Force, ricarica)…
        else { foes.forEach((f,k)=>{ if(!f) return;
            if(foes.some((g,q)=>g&&q!==k&&((d.type==='Electric'&&g.ability==='Lightning Rod')||(d.type==='Water'&&g.ability==='Storm Drain')))) return;
            const dm=aiDmg(d,me,f); let s=Math.min(dm,f.hpPct); if(dm>=f.hpPct) s+=50+(pr?20:0);
            if(P.spd) s+=Math.max(aiThreat(f,mine[0]||me),aiThreat(f,mine[1]||me))*.12;
            if(d.id==='fakeout'){ if(B.aiFresh&&B.aiFresh[myPos[i]]===B.turn&&!f.types.includes('Ghost')&&f.ability!=='Inner Focus') s+=48+aiThreat(f,ally||me)*.2+(L>=7&&(f.moves||[]).some(x=>['trickroom','tailwind','spore'].includes(x.id))?20:0); else s=-50; }
            s*=(1-pProt[k]); add(String(k+1),s*slow*acc); }); }
      } else {
        const id=d.id; let s=0;
        if(PROTECTS_ID.has(id)) s=!aiProtOk(myPos[i],foes.find(f=>f&&aiStall(f)))?-40:((B.aiProt||{})[myPos[i]]===B.turn-1)?6:(danger>=me.hpPct?42:single>=me.hpPct*.7?22:4)+(ally&&foes.some(f=>f&&aiThreat(ally,f)>=f.hpPct)?10:0)+(deadFirst?10:0);
        else if(id==='tailwind') s=tailOn?-30:(slower?46:18);
        else if(id==='trickroom') s=trOn?-40:(slower?50:-20);
        else if(id==='followme'||id==='ragepowder') s=ally&&ally.hpPct>40&&foes.some(f=>f&&aiThreat(f,ally)>=ally.hpPct*.6)?36:6;
        else if(id==='helpinghand') s=ally?14+Math.min(40,foes.reduce((t,f)=>t+(f?aiThreat(ally,f):0),0)*.2):-20;
        else if(id==='wideguard') s=foes.some(f=>f&&(f.moves||[]).some(m=>AI_SPREAD.includes(m.target)&&m.category!=='Status'))?34:(P.know?0:8);
        else if(AI_STATUS[id]||id==='taunt'||id==='encore'){ const tgt=foes.map((f,k)=>({f,k})).filter(x=>x.f&&!(AI_STATUS[id]&&x.f.st)&&!(id==='thunderwave'&&(x.f.types.includes('Ground')||x.f.types.includes('Electric')))&&!(id==='willowisp'&&x.f.types.includes('Fire'))&&!((id==='spore'||id==='sleeppowder')&&x.f.types.includes('Grass'))).sort((x,y)=>aiThreat(y.f,me)-aiThreat(x.f,me))[0];
          if(tgt){ const st=AI_STATUS[id]; opts.push({j,tgt:String(tgt.k+1),s:(st==='slp'?(id==='spore'?48:36):id==='willowisp'&&tgt.f.atk>tgt.f.spa?34:id==='taunt'?18:22)*(1-pProt[tgt.k]),d}); } return; }
        else if(AI_SETUP[id]) s=danger<me.hpPct*.5?30*AI_SETUP[id]:0;
        else if(AI_HEAL[id]) s=me.hpPct<45?40:me.hpPct<65?12:0;
        else if(id==='partingshot') s=danger>=me.hpPct&&bench.length?30:10;
        else s=6;
        const needT=T_ONE.includes(t)&&t!=='adjacentAlly'&&t!=='adjacentAllyOrSelf';
        if(needT){ const k=foes.findIndex(f=>f); add(k>=0?String(k+1):null,s); }
        else if(t==='adjacentAlly'){ if(ally) add(String(-((i===0)?2:1)),s); }
        else if(t==='adjacentAllyOrSelf') add(String(-(i+1)),s);
        else add(null,s); }
    });
    if(!opts.length){ plans[i]='move 1'; continue; }
    // dal livello 7 le due mosse si scelgono insieme (aiJoint)
    if(P.look){ cand[i]={opts,me,a,danger}; plans[i]='joint'; continue; }
    if(i===1&&plans[0]&&plans[0].tgt){ const f=foes[+plans[0].tgt-1]; if(f) for(const o of opts) if(o.tgt===plans[0].tgt&&o.d.category!=='Status'){ const dm=aiDmg(o.d,me,f); if(plans[0].dmg<f.hpPct&&plans[0].dmg+dm>=f.hpPct) o.s+=40; else if(plans[0].dmg>=f.hpPct&&L>=5) o.s*=.3; } }
    for(const o of opts) o.s+=aiNoise(L);
    opts.sort((x,y)=>y.s-x.s); const best=opts[0];
    if(L>=2&&bench.length&&!a.trapped&&!a.maybeTrapped&&danger>=me.hpPct*1.1&&best.s<45&&Math.random()<P.sw){ const c=bench.filter(x=>!used.includes(x.idx)).map(x=>({x,s:benchScore(x)})).sort((p,q)=>q.s-p.s)[0];
      if(c&&c.s>-danger*.6){ used.push(c.x.idx); plans[i]={sw:c.x.idx}; continue; } }
    plans[i]={j:best.j,tgt:best.tgt,d:best.d,s:best.s,dmg:best.tgt&&foes[+best.tgt-1]?aiDmg(best.d,me,foes[+best.tgt-1]):0,canMega:a.canMegaEvo,canTera:a.canTerastallize,me,danger};
  }
  const build=(pl,mark)=>{ let megaU=false, teraU=false; return pl.map((p,i)=>{ if(p==='pass'||typeof p==='string') return p; if(p.sw!=null) return 'switch '+(p.sw+1);
    let ch='move '+(p.j+1)+(p.tgt?' '+p.tgt:'');
    if(mark) aiProtMark(myPos[i],PROTECTS_ID.has(p.d.id));
    if(p.canMega&&!megaU){ ch+=' mega'; megaU=true; }
    else if(p.canTera&&!teraU&&P.tera){ const tt=p.canTera, off=p.d.category!=='Status'&&p.d.type===tt; const m2=Object.assign({},p.me,{types:[tt],tera:tt});
      const saves=P.tera>=2&&p.danger>=p.me.hpPct&&foes.reduce((t,f)=>t+(f?aiThreat(f,m2):0),0)<p.me.hpPct*.7;
      if((off&&p.s>=(P.tera>=3?70:50))||saves){ ch+=' terastallize'; teraU=true; } }
    return ch; }).join(', '); };
  if(cand[0]||cand[1]){ const ranked=aiJoint(cand,foes,mine,pProt,L,bench,foc);
    const toPlans=sel=>plans.map((p,i)=>{ if(!cand[i]) return p; const o=sel[i], c=cand[i]; return o.sw!=null?{sw:o.sw}:{j:o.j,tgt:o.tgt,d:o.d,s:o.s,canMega:c.a.canMegaEvo,canTera:c.a.canTerastallize,me:c.me,danger:c.danger}; });
    let chosen=ranked[0].sel;
    // dal livello 9: le coppie migliori si provano sulla copia della lotta contro le risposte probabili
    if(P.sim&&aiSimInit()){ const top=ranked.slice(0,P.sim>=2?12:8), replies=aiReplies(aiOther(S),P.sim>=2?4:3); let bestS=null;
      if(replies.length) for(const x of top){ const sc=aiSimEval(build(toPlans(x.sel),false),replies,S,P.sim>=2?2:1); if(sc!=null&&(!bestS||sc+x.v*.05>bestS.s)) bestS={s:sc+x.v*.05,sel:x.sel}; }
      if(bestS) chosen=bestS.sel; }
    const pl=toPlans(chosen); for(let i=0;i<2;i++) if(cand[i]) plans[i]=pl[i]; }
  B.aiProt=B.aiProt||{};
  return build(plans,true); }
// Doppio, livello 7+: valuta le coppie di scelte (le migliori 5 mosse per posto, più i cambi) come un giocatore forte:
// KO insieme, niente attacchi sprecati su chi va già KO, chi va KO prima di attaccare non fa danni (minaccia tolta),
// danni che si ricevono (ogni avversario colpisce chi gli conviene; Protect li annulla; chi entra col cambio li prende lui).
function aiJoint(cand,foes,mine,pProt,L,bench,foc){ const J=Object.assign({tk:.7,sw:-15,rm1:.6,rm2:.25,ko:40,waste:.6,die:30},AIL[L].j);
  const lists=cand.map((c,i)=>{ if(!c) return [null]; const l=c.opts.slice().sort((x,y)=>y.s-x.s).slice(0,5);
    if(bench.length&&!c.a.trapped&&!c.a.maybeTrapped) for(const x of bench) l.push({sw:x.idx,x,s:J.sw});
    return l; });
  const fBest=foes.map(f=>f?mine.map(m=>m?aiBest(f,m):{d:0,mv:null}):null);
  const all=[];
  for(const o0 of lists[0]) for(const o1 of lists[1]){ const sel=[o0,o1];
    if(o0&&o1&&o0.sw!=null&&o0.sw===o1.sw) continue;
    let v=0; const dealt=[0,0], alone=[0,0], att=[[],[]];
    sel.forEach((o,i)=>{ if(!o) return; v+=o.d&&PROTECTS_ID.has(o.d.id)?Math.min(o.s,4):o.s; if(o.sw!=null||o.d.category==='Status') return; const me=cand[i].me;  // Protect: il suo valore viene dai danni evitati (sotto)
      if(o.tgt&&+o.tgt>0){ const k=+o.tgt-1, f=foes[k]; if(!f) return; const d=aiDmg(o.d,me,f)*(1-pProt[k]); dealt[k]+=d; alone[k]=Math.max(alone[k],d); att[k].push(i); }
      else if(AI_SPREAD.includes(o.d.target)) foes.forEach((f,k)=>{ if(!f) return; const d=aiDmg(o.d,me,f)*.75*(1-pProt[k]); dealt[k]+=d; att[k].push(i); }); });
    const deadFirst=[false,false];
    foes.forEach((f,k)=>{ if(!f) return; const ko=dealt[k]>=f.hpPct;
      if(ko&&alone[k]<f.hpPct&&att[k].length>1) v+=J.ko;                                   // KO solo insieme
      if(att[k].length>1&&alone[k]>=f.hpPct*1.15) v-=Math.min(...att[k].map(i=>sel[i].s))*J.waste;  // attacco sprecato
      if(ko){ const first=att[k].every(i=>aiFirst(cand[i].me,sel[i].d,f,(fBest[k][i]||{}).mv)); deadFirst[k]=first;
        v+=Math.max(0,...mine.map(m=>m?aiThreat(f,m):0))*(first?J.rm1:J.rm2); } });
    // danni ricevuti: ogni avversario vivo (e non già KO prima di agire) colpisce chi gli conviene
    const taken=[0,0], who=sel.map((o,i)=>o&&o.sw!=null?o.x:cand[i]?cand[i].me:null);
    foes.forEach((f,k)=>{ if(!f||deadFirst[k]) return; let bi=-1, bd=0; who.forEach((m,i)=>{ if(!m) return; const d=aiThreat(f,m); if(d>bd){ bd=d; bi=i; } }); if(bi<0) return;
      const prot=sel[bi]&&sel[bi].d&&PROTECTS_ID.has(sel[bi].d.id); if(!prot) taken[bi]+=bd*(foc+(1-foc)*.6); });
    who.forEach((m,i)=>{ if(!m) return; const hp=m.hpPct-(sel[i]&&sel[i].sw!=null?aiHaz(m):0), t=Math.min(taken[i],hp); v-=t*J.tk; if(taken[i]>=hp) v-=J.die; });
    v+=aiNoise(L); all.push({v,sel}); }
  return all.sort((a,b)=>b.v-a.v); }
// probabilità che un avversario usi Protect: niente se non ce l'ha, poca se l'ha appena usato, di più se è in pericolo; corretta dalla memoria
function aiPProtect(f,mine,P,M){ if(!f||!P.pred) return 0; const fm=f.moves||[]; if(fm.length&&!fm.some(m=>PROTECTS_ID.has(m.id))&&(!f.partial||fm.length>=4)) return 0;
  if(M.lastProt&&M.lastProt[f.nick]===B.turn-1) return .05*P.pred;
  const thr=mine.some(me=>me&&aiThreat(me,f)>=f.hpPct*.7), prior=thr?.3:.1, k=M[thr?'pThr':'pCalm'];
  let p=prior; if(k&&P.mem) p=prior+P.mem*((k.u+prior*3)/(k.n+3)-prior); if(f.partial&&!fm.some(m=>PROTECTS_ID.has(m.id))) p*=.6; return Math.min(.8,p)*P.pred; }
// due Protect di fila hanno senso solo se l'avversario sta perdendo PS da solo (veleno, scottatura, Leech Seed, Perish Song…)
function aiStall(f){ if(!f) return false; const lm=actMon(f.pos||'p1')||{}; const st=f.st||lm.st, v=lm.vol||{}; return st==='tox'||st==='psn'||st==='brn'||!!v.leechseed||!!v.perish||!!v.partiallytrapped||!!v.saltcure; }
// Protect: mai due volte di fila, tranne quando l'avversario perde PS da solo (allora al massimo 2 di fila: il secondo riesce solo 1 volta su 3)
function aiProtOk(pos,foe){ const P=B.aiProt||{}, R=B.aiProtRun||{}; if(P[pos]!==B.turn-1) return true; return !!(foe&&aiStall(foe))&&(R[pos]||0)<2; }
function aiProtMark(pos,used){ B.aiProt=B.aiProt||{}; B.aiProtRun=B.aiProtRun||{}; if(used){ B.aiProtRun[pos]=B.aiProt[pos]===B.turn-1?(B.aiProtRun[pos]||1)+1:1; B.aiProt[pos]=B.turn; } else B.aiProtRun[pos]=0; }

// ---------- livelli 9-10: provare le mosse su una copia della lotta (motore vero di Showdown) ----------
// La copia ha dadi nuovi (il computer non conosce i tiri futuri) e i set veri (dal livello 6 li conosce già).
// Il computer prova le sue scelte migliori contro le risposte più probabili dell'avversario e guarda come resta la lotta dopo un turno.
let AI_SIMOK=null;
function aiSimInit(){ if(AI_SIMOK!==null) return AI_SIMOK&&!!(B.bs&&B.bs.battle); try{ const b=B.bs&&B.bs.battle; if(!b) return false; const D=b.dex;
    // la libreria è compressa: i nomi delle classi servono alla copia (toJSON/fromJSON) e vanno rimessi
    const fix=(C,n)=>{ if(C&&C.name!==n) Object.defineProperty(C,'name',{value:n}); };
    fix(b.constructor,'Battle'); fix(b.field.constructor,'Field'); fix(b.sides[0].constructor,'Side'); fix(b.sides[0].pokemon[0].constructor,'Pokemon');
    fix(D.conditions.get('brn').constructor,'Condition'); fix(D.abilities.get('levitate').constructor,'Ability'); fix(D.items.get('leftovers').constructor,'Item'); fix(D.moves.get('tackle').constructor,'Move'); fix(D.species.get('pikachu').constructor,'Species');
    const c=aiClone(); AI_SIMOK=!!(c&&c.sides[0].pokemon.every(p=>p.side)); }catch(e){ console.warn('IA copia',e); AI_SIMOK=false; } return AI_SIMOK; }
// copia completa (JSON in testo): toJSON condivide alcuni oggetti con la lotta vera (set, registro) e la copia li modificherebbe
let AI_SNAP=null;
function aiClone(){ const b=B.bs.battle; if(!AI_SNAP||AI_SNAP.b!==b||AI_SNAP.n!==B.nreq) AI_SNAP={b,n:B.nreq,s:JSON.stringify(b.toJSON())}; const j=JSON.parse(AI_SNAP.s); j.prng=[0,0,0,0].map(()=>Math.random()*65536|0).join(','); const c=b.constructor.fromJSON(j); c.send=()=>{}; return c; }
function aiSideVal(sd){ let v=0; for(const p of sd.pokemon){ if(!p.hp) continue; v+=40+100*p.hp/p.maxhp; if(p.status) v-=p.status==='slp'||p.status==='frz'?15:8;
    if(p.isActive) for(const k of ['atk','spa','spe','def','spd']) v+=Math.max(-2,Math.min(3,p.boosts[k]||0))*(k==='def'||k==='spd'?2:4); }
  for(const k of ['stealthrock','spikes','toxicspikes','stickyweb']) if(sd.sideConditions[k]) v-=8*sd.pokemon.filter(p=>p.hp&&!p.isActive).length/5;
  if(sd.sideConditions.tailwind) v+=10; if(sd.sideConditions.reflect||sd.sideConditions.lightscreen||sd.sideConditions.auroraveil) v+=8; return v; }
// valore di una scelta: media (65%) e caso peggiore (35%) sulle risposte probabili, ripetendo i dadi
function aiSimEval(myCh,foeChs,S,reps){ const vals=[], me=S==='p1'?0:1;
  for(const fc of foeChs) for(let k=0;k<reps;k++){ try{ const c=aiClone(); if(me===1) c.makeChoices(fc,myCh); else c.makeChoices(myCh,fc); vals.push(aiSideVal(c.sides[me])-aiSideVal(c.sides[1-me])); }catch(e){ return null; } }
  if(!vals.length) return null; return vals.reduce((a,b)=>a+b,0)/vals.length*.65+Math.min(...vals)*.35; }
// risposte probabili dell'avversario: l'IA di livello 6 dal suo punto di vista, più volte (con un po' di errore), senza ripetizioni
function aiReplies(F,n){ const r=B.req[F]; if(!r||r.wait||r.teamPreview) return []; const keep={prot:B.aiProt,run:B.aiProtRun,log:B.aiLog,sw:B.aiSwT}; const out=new Set();
  B.aiProt=Object.assign({},B.aiProt); B.aiProtRun=Object.assign({},B.aiProtRun);
  try{ for(let i=0;i<n*2&&out.size<n;i++) out.add(isDbl()?aiDouble(r,6,F):aiSingle(r,6,F)); }catch(e){}
  B.aiProt=keep.prot; B.aiProtRun=keep.run; B.aiLog=keep.log; B.aiSwT=keep.sw; return [...out]; }

// ---------- memoria: come gioca l'avversario (per i BO3, dal livello 8) ----------
// Si registrano solo le scelte del giocatore 1 contro il computer: con chi inizia, chi porta, se cambia quando è in pericolo e
// verso chi, quanto usa Protect, se concentra gli attacchi, le mosse preferite di ogni Pokémon, quando usa la Tera.
function aiObserve(sid,choice){ try{ if(!O||O.mode!=='cpu'||sid!=='p1'||!B||!B.req[sid]) return; const M=aiMem(), r=B.req[sid], S='p2';
  if(r.teamPreview){ const ord=String(choice).replace(/^team\s*/,'').split('').map(n=>r.side.pokemon[+n-1]).filter(Boolean).map(x=>baseSp(x.details.split(',')[0]));
    (M.leads=M.leads||[]).push(ord.slice(0,isDbl()?2:1)); (M.brought=M.brought||[]).push(ord.slice(0,pickN(r)||ord.length)); return; }
  if(r.forceSwitch||!r.active) return;
  const mineAI=((B.req[S]&&B.req[S].side&&B.req[S].side.pokemon)||[]).filter(x=>x.active&&!x.condition.endsWith(' fnt')).map(x=>aiOwn(x,S));
  const parts=String(choice).split(',').map(s=>s.trim());
  parts.forEach((ch,i)=>{ const a=r.active[i], x=r.side.pokemon[i]; if(!a||!x||x.condition.endsWith(' fnt')) return;
    const me=aiOwn(x,'p1'), sp=baseSp(me.sp), thr=Math.max(0,...mineAI.map(o=>aiThreat(o,me)))>=me.hpPct*.8||me.hpPct<50, k=thr?'thr':'calm';
    M[k]=M[k]||{n:0,sw:0}; M[k].n++;
    if(ch.startsWith('switch')){ M[k].sw++; const to=r.side.pokemon[+ch.split(' ')[1]-1]; if(to) for(const o of mineAI){ const key=baseSp(o.sp); const t=(M.swTo=M.swTo||{})[key]=M.swTo[key]||{}; const ts=baseSp(to.details.split(',')[0]); t[ts]=(t[ts]||0)+1; } return; }
    if(!ch.startsWith('move')) return; const mv=a.moves[+ch.split(' ')[1]-1]; if(!mv) return;
    const mm=(M.mv=M.mv||{})[sp]=M.mv[sp]||{}; mm[mv.id]=(mm[mv.id]||0)+1; (M.last=M.last||{})[me.nick]=mv.id;
    if(a.moves.some(m=>PROTECTS_ID.has(m.id))){ const pk=thr?'pThr':'pCalm'; M[pk]=M[pk]||{n:0,u:0}; M[pk].n++; if(PROTECTS_ID.has(mv.id)){ M[pk].u++; (M.lastProt=M.lastProt||{})[me.nick]=B.turn; } }
    if(/terastallize/.test(ch)) (M.tera=M.tera||[]).push({sp,turn:B.turn}); });
  if(isDbl()&&parts.length===2){ const t=parts.map(c=>c.startsWith('move')?+(c.split(' ')[2]||0):0); if(t[0]>0&&t[1]>0){ M.foc=M.foc||{n:0,same:0}; M.foc.n++; if(t[0]===t[1]) M.foc.same++; } }
}catch(e){ console.warn('memoria IA',e); } }

function cpuChoice(r){ const S=r&&r.side&&r.side.id||'p2', L=O&&O.level||0;
  // se il motore ha rifiutato la scelta di prima per questa richiesta, si sceglie a caso (mai la stessa all'infinito)
  if(B.err&&B.aiRq===(r&&r.rqid)) return isDbl()?cpuDbl(r):cpuSingle(r); B.aiRq=r&&r.rqid;
  if(S==='p2'&&L>0){ try{ return isDbl()?aiDouble(r,L,S):aiSingle(r,L,S); }catch(e){ console.warn('IA',e); } }
  return isDbl()?cpuDbl(r):cpuSingle(r); }
// solo per le prove automatiche: l'IA di livello L sceglie per il lato sid
function aiChoiceFor(sid,L){ const r=B.req[sid]; try{ return isDbl()?aiDouble(r,L,sid):aiSingle(r,L,sid); }catch(e){ console.warn('IA',e); return isDbl()?cpuDbl(r):cpuSingle(r); } }
function cpuSingle(r){
  if(r.teamPreview) return pickN(r)?'team '+shuffleArr([1,2,3,4,5,6].slice(0,r.side.pokemon.length)).slice(0,pickN(r)).join(''):'team 1';
  const sw=r.side.pokemon.map((m,i)=>({m,i})).filter(x=>!x.m.active&&!x.m.condition.endsWith(' fnt'));
  if(r.forceSwitch) return sw.length?'switch '+(sw[Math.random()*sw.length|0].i+1):'pass';
  const mv=r.active[0].moves.map((m,i)=>({m,i})).filter(x=>!x.m.disabled&&(x.m.pp===undefined||x.m.pp>0));
  return mv.length?'move '+(mv[Math.random()*mv.length|0].i+1)+(r.active[0].canMegaEvo?' mega':''):'move 1';
}
// Serie (al meglio di 3): il gioco riceve il vincitore e risponde con il messaggio e il pulsante per la lotta successiva
function seriesEnd(winner){ if(!O.onEnd||B.seriesDone) return; B.seriesDone=true; const r=O.onEnd(winner); if(!r) return;
  if(r.msg) say(r.msg,'win'); const sl=root&&root.querySelector('.lt-series'); if(sl&&r.label) sl.textContent=r.label; O.newLabel=r.next||null; if(!r.next&&O.series) O.onNew=null; }
function prompt(){
  if(!root||B.busy||B.queue.length) return;
  if(B.over){ $('ctrl').innerHTML=`<div class="end">${$('msg').innerHTML}</div><div class="lt-row" style="justify-content:center">${O.onNew?`<button class="btn" data-lt="new">${esc(O.newLabel||'Nuova lotta')}</button>`:''}<button class="btn ghost" data-lt="close">${esc(O.closeLabel||'Chiudi la lotta')}</button></div>`; return; }
  if(O.mode==='cpu'&&need('p2')){ send('p2',cpuChoice(B.req.p2)); return; }
  const sid=need('p1')?'p1':(O.mode==='two'&&need('p2')?'p2':null);
  if(!sid){ $('ctrl').innerHTML=`<p class="lt-wait">${O.role?'In attesa di '+PN('p2')+'…':'In attesa…'}</p>`; return; }
  if(O.mode==='two'&&B.passTo!==sid){ B.passTo=null; draw();
    $('ctrl').innerHTML=`<div class="pass"><span class="who ${sid}">${PN(sid)}</span><p>${O.lang==='en'?`It's <b>${PN(sid)}</b>'s turn to choose. Pass the device and press the button${O.showOpp?'':' (the other player should look away: you will see your team\'s moves and items)'}.`:`Tocca a <b>${PN(sid)}</b> scegliere. Passa il dispositivo e premi il pulsante${O.showOpp?'':' (l\'altro non guardi: vedrai mosse e strumenti della tua squadra)'}.`}</p><button class="btn ${sid==='p2'?'play2':''}" data-lt="iam" data-s="${sid}">Sono ${PN(sid)}</button><span class="tmr" id="lt-tm"></span></div>`; timerArm(sid); return; }
  ui(sid);
}
const pickN=r=>r&&r.teamPreview&&r.maxChosenTeamSize&&r.maxChosenTeamSize<r.side.pokemon.length?r.maxChosenTeamSize:0;
function shuffleArr(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
function ui(sid){ if(isDbl()||pickN(B.req[sid])) return uiDbl(sid); return uiSingle(sid); }
// perché alcune mosse sono bloccate (strumenti Scelta, Encore, Taunt...): come Showdown le mostra grigie, qui c'è anche una riga che lo spiega
function lockNote(sid,a,rq){ if(!a||!a.moves||!a.moves.some(m=>m.disabled)) return ''; const free=a.moves.filter(m=>!m.disabled); const rp=rq||B.req[sid]&&B.req[sid].side&&B.req[sid].side.pokemon.find(x=>x.active&&!/fnt/.test(x.condition||'')&&(!a.pos||true)); const it=rp&&rp.item?Dex.items.get(rp.item).name:''; if(free.length===1&&/^Choice /.test(it)) return '<p class="lock">Bloccato su <b>'+esc(free[0].move)+'</b> da '+esc(it)+'</p>'; return '<p class="lock">Alcune mosse non si possono usare in questo turno.</p>'; }
function uiSingle(sid){
  const r=B.req[sid], c=$('ctrl'); if(O.mode==='two') { B.passTo=sid; draw(); }
  const team=r.side.pokemon;
  const tm=(m,i,act)=>{ const h=parseHP(m.condition); const sp=m.details.split(',')[0]; const p=spritePath(sp); const ko=h.st==='fnt'; const pct=ko?0:Math.round(h.hp/h.max*100);
    return `<button class="tm${m.active?' act':''}${ko?' ko':''}" data-tip="req:${sid}:${i}" ${act&&!ko&&!m.active?`data-lt="pick" data-c="${act} ${i+1}"`:'disabled'}>${p?`<img src="${esc(p)}" alt="">`:''}<small>${esc(sp)}</small><span class="mini"><i class="${pct<=20?'low':pct<=50?'mid':''}" style="width:${pct}%"></i></span></button>`; };
  let h='';
  if(B.err) h+=`<p class="lt-err">Scelta non valida, riprova.</p>`;
  if(r.teamPreview){
    h+=`<div class="cq"><span class="who ${sid}">${PN(sid)}</span> Chi mandi in campo per primo?</div><div class="lt-team">${team.map((m,i)=>tm(Object.assign({},m,{active:false}),i,'team')).join('')}</div>`;
  } else if(r.forceSwitch){
    h+=`<div class="cq"><span class="who ${sid}">${PN(sid)}</span> Chi mandi in campo?</div><div class="lt-team">${team.map((m,i)=>tm(m,i,'switch')).join('')}</div>`;
  } else {
    const a=r.active[0], me=team.find(x=>x.active), hp=me?parseHP(me.condition):null;
    h+=`<div class="cq"><span class="who ${sid}">${PN(sid)}</span> <span>${O.lang==='en'?'What will':'Cosa farà'} <b>${esc(me?me.details.split(',')[0]:'')}</b>${O.lang==='en'?' do':''}?</span> ${hp?`<span class="hpchip">PS ${hp.hp}/${hp.max}</span>`:''}</div>
     <div class="sec">Attacca</div>${lockNote(sid,a)}<div class="moves">${a.moves.map((m,i)=>{ const d=Dex.moves.get(m.id); const col=TYPE_COLORS[d.type]||'#666'; const e=effOf(m.id,sid);
      return `<button class="mv" style="--tc:${col}" data-tip="move:${esc(m.id)}:${sid}:${sid}" ${m.disabled||m.pp===0?'disabled':`data-lt="pick" data-c="move ${i+1}"`}>${e?effSpan(e):'<span class="effl none"></span>'}<b>${esc(m.move)}</b><span class="mt"><i class="tdot"></i>${TIPI[d.type]||d.type}</span><span class="pp">${m.pp??'–'}/${m.maxpp??'–'}</span></button>`; }).join('')}</div>`;
    if(a.canMegaEvo) h+=`<label class="tera mega"><input type="checkbox" id="lt-mega"> Megaevolvi <span class="st" style="background:linear-gradient(135deg,#F7A1D8,#7B3FC4)">MEGA</span></label>`;
    if(a.canTerastallize) h+=`<label class="tera"><input type="checkbox" id="lt-tera"> Teracristallizza <span class="st" style="background:${TYPE_COLORS[a.canTerastallize]||'#666'}">${(TIPI[a.canTerastallize]||esc(a.canTerastallize)).toUpperCase()}</span></label>`;
    h+=`<div class="sec">Cambia</div>${a.trapped?'<p class="lt-muted">Non puoi cambiare Pokémon.</p>':''}<div class="lt-team">${team.map((m,i)=>tm(m,i,a.trapped?null:'switch')).join('')}</div>`;
  }
  h+=`<div class="lt-foot"><span class="tmr" id="lt-tm"></span></div>`;
  c.innerHTML=h; timerArm(sid);
}
function pick(sid,choice){ if(isDbl()||pickN(B.req[sid])) return pickDbl(sid,choice); pickSingle(sid,choice); }
document.addEventListener('change',e=>{ const id=e.target&&e.target.id; if(id==='lt-mega'&&e.target.checked){ const t=document.getElementById('lt-tera'); if(t) t.checked=false; } if(id==='lt-tera'&&e.target.checked){ const m=document.getElementById('lt-mega'); if(m) m.checked=false; } });
function pickSingle(sid,choice){ const t=$('tera'), mg=$('mega'); if(t&&t.checked&&choice.startsWith('move')) choice+=' terastallize'; else if(mg&&mg.checked&&choice.startsWith('move')) choice+=' mega'; if(O.mode==='two') B.passTo=null; send(sid,choice); }


// ---------- doppio: due Pokémon per lato ----------
// A ogni turno si sceglie prima per il primo posto, poi per il secondo; le mosse a bersaglio singolo chiedono "contro chi".
// Bersagli come su Showdown: 1 e 2 = avversari (primo e secondo posto), -1 e -2 = i propri (primo e secondo posto).
const T_ONE=['normal','any','adjacentFoe','adjacentAlly','adjacentAllyOrSelf'];
function validTargets(sid,idx,t){ const foe=other(sid), alive=p=>{ const m=actMon(p); return m&&m.st!=='fnt'; }, out=[];
  const self=idx===0?sid:sid+'b', ally=idx===0?sid+'b':sid;
  if(['normal','any','adjacentFoe'].includes(t)) for(const [p,n] of [[foe,'1'],[foe+'b','2']]) if(alive(p)) out.push({n,p,foe:true});
  if(['normal','any','adjacentAlly','adjacentAllyOrSelf'].includes(t)&&alive(ally)) out.push({n:String(-(idx===0?2:1)),p:ally});
  if(t==='adjacentAllyOrSelf') out.push({n:String(-(idx+1)),p:self});
  return out; }
function cpuDbl(r){
  const team=r.side.pokemon; if(r.teamPreview) return pickN(r)?'team '+shuffleArr(team.map((x,i)=>i+1)).slice(0,pickN(r)).join(''):'team 12';
  const used=[], parts=[], n=r.forceSwitch?r.forceSwitch.length:(r.active?r.active.length:1);
  for(let i=0;i<n;i++){
    if(r.forceSwitch){ if(!r.forceSwitch[i]){ parts.push('pass'); continue; }
      const sw=team.map((m,j)=>({m,j})).filter(x=>!x.m.active&&!x.m.condition.endsWith(' fnt')&&!used.includes(x.j)); if(!sw.length){ parts.push('pass'); continue; }
      const k=sw[Math.random()*sw.length|0].j; used.push(k); parts.push('switch '+(k+1)); continue; }
    const a=r.active[i]; if(!a||!team[i]||team[i].condition.endsWith(' fnt')){ parts.push('pass'); continue; }
    const mv=a.moves.map((m,j)=>({m,j})).filter(x=>!x.m.disabled&&(x.m.pp===undefined||x.m.pp>0)); if(!mv.length){ parts.push('move 1'); continue; }
    const x=mv[Math.random()*mv.length|0]; let ch='move '+(x.j+1);
    if(['normal','any','adjacentFoe'].includes(x.m.target)) ch+=' '+(1+(Math.random()*2|0));
    else if(x.m.target==='adjacentAlly') ch+=' '+(-(i===0?2:1)); else if(x.m.target==='adjacentAllyOrSelf') ch+=' '+(-(i+1));
    parts.push(ch); }
  return parts.join(', '); }
function uiDbl(sid){
  const r=B.req[sid], c=$('ctrl'); if(O.mode==='two'){ B.passTo=sid; draw(); }
  if(!B.pick||B.pick.rq!==r.rqid||B.pick.sid!==sid) B.pick={rq:r.rqid,sid,parts:[],tgt:null};
  const P=B.pick, team=r.side.pokemon, en=O.lang==='en';
  const n=r.teamPreview?Math.min(2,team.length):(r.forceSwitch?r.forceSwitch.length:(r.active?r.active.length:1));
  if(!r.teamPreview) while(P.parts.length<n){ const i=P.parts.length;
    if(r.forceSwitch&&!r.forceSwitch[i]){ P.parts.push('pass'); continue; }
    // cambio obbligato ma nessuno rimasto in panchina (es. entrambi KO e un solo Pokémon dietro): quel posto passa
    if(r.forceSwitch){ const chosen=P.parts.filter(x=>x.startsWith('switch')).map(x=>+x.split(' ')[1]); if(!team.some((m,j)=>!m.active&&!m.condition.endsWith(' fnt')&&!chosen.includes(j+1))){ P.parts.push('pass'); continue; } }
    if(!r.forceSwitch&&(!r.active[i]||!team[i]||team[i].condition.endsWith(' fnt'))){ P.parts.push('pass'); continue; }
    break; }
  if(!r.teamPreview&&P.parts.length>=n){ const ch=P.parts.join(', '); B.pick=null; if(O.mode==='two') B.passTo=null; send(sid,ch); return; }
  const idx=P.parts.length, chosen=P.parts.filter(x=>x.startsWith('switch')).map(x=>+x.split(' ')[1]);
  const tm=(m,i,act)=>{ const h=parseHP(m.condition); const sp=m.details.split(',')[0]; const p=spritePath(sp); const ko=h.st==='fnt'; const pct=ko?0:Math.round(h.hp/h.max*100);
    const off=ko||(act==='switch'&&(m.active||chosen.includes(i+1)))||(act==='team'&&P.parts.includes(String(i+1)));
    return `<button class="tm${m.active&&act!=='team'?' act':''}${ko?' ko':''}" data-tip="req:${sid}:${i}" ${act&&!off?`data-lt="pick" data-c="${act} ${i+1}"`:'disabled'}>${p?`<img src="${esc(p)}" alt="">`:''}<small>${esc(sp)}</small><span class="mini"><i class="${pct<=20?'low':pct<=50?'mid':''}" style="width:${pct}%"></i></span></button>`; };
  const back=P.parts.some(x=>x!=='pass')||P.tgt?`<button class="btn ghost back" data-lt="pback">← ${en?'Back':'Indietro'}</button>`:'';
  const who=`<span class="who ${sid}">${PN(sid)}</span>`;
  let h=B.err?'<p class="lt-err">Scelta non valida, riprova.</p>':'';
  if(r.teamPreview){
    const N=pickN(r), lead=isDbl()?2:1;
    h+=`<div class="cq">${who} <span>${N?(en?`Choose ${N} Pokémon for this battle, in order (the first ${lead===1?'one goes':'two go'} in): ${P.parts.length}/${N}`:`Scegli ${N} Pokémon per questa lotta, in ordine (${lead===1?'il primo va':'i primi due vanno'} in campo): ${P.parts.length}/${N}`):P.parts.length?(en?'And the second one?':'E il secondo?'):(en?'Who will you send out first? (pick 2)':'Chi mandi in campo per primi? (scegline 2)')}</span> ${back}</div>${N&&P.parts.length?`<div class="lt-muted" style="margin:0 0 6px">${P.parts.map(x=>esc(team[+x-1].details.split(',')[0])).join(' → ')}</div>`:''}<div class="lt-team">${team.map((m,i)=>tm(Object.assign({},m,{active:false}),i,'team')).join('')}</div>`;
  } else if(r.forceSwitch){
    h+=`<div class="cq">${who} <span>${en?'Who will you send out?':'Chi mandi in campo?'}</span> ${back}</div><div class="lt-team">${team.map((m,i)=>tm(m,i,'switch')).join('')}</div>`;
  } else if(P.tgt){
    const a=r.active[idx], mv=a.moves[P.tgt.mi], list=validTargets(sid,idx,mv.target);
    h+=`<div class="cq">${who} <span><b>${esc(mv.move)}</b>: ${en?'which target?':'contro chi?'}</span> ${back}</div>${(()=>{ const btn=x=>{ const m=actMon(x.p), sp=spritePath(m.species), e=x.foe?effOf(mv.id,sid,x.p):null;
      return `<button class="tm" data-lt="pick" data-c="move ${P.tgt.mi+1} ${x.n}">${sp?`<img src="${esc(sp)}" alt="">`:''}<small>${esc(m.species)}</small><span class="tgl ${x.foe?'foe':'ally'}">${x.foe?(en?'foe':'avversario'):(x.p===(idx===0?sid:sid+'b')?(en?'self':'se stesso'):(en?'ally':'alleato'))}</span>${e?effSpan(e):''}</button>`; }; const foes=list.filter(x=>x.foe), allies=list.filter(x=>!x.foe);
      // avversari sopra, alleati sotto (come in campo), ognuno con la sua etichetta
      return (foes.length?`<div class="tgrow"><span class="tglab foe">${en?'Foes':'Avversari'}</span><div class="lt-team tg">${foes.map(btn).join('')}</div></div>`:'')+(allies.length?`<div class="tgrow"><span class="tglab ally">${en?'Allies':'Alleati'}</span><div class="lt-team tg">${allies.map(btn).join('')}</div></div>`:''); })()}`;
  } else {
    const a=r.active[idx], me=team[idx], hp=me?parseHP(me.condition):null, teraUsed=P.parts.some(x=>x.includes('terastallize')), megaUsed=P.parts.some(x=>x.endsWith(' mega'));
    const foes=[other(sid),other(sid)+'b'].filter(p=>{ const m=actMon(p); return m&&m.st!=='fnt'; });
    h+=`<div class="cq">${who} <span>${en?'What will':'Cosa farà'} <b>${esc(me?me.details.split(',')[0]:'')}</b>${en?' do':''}?</span> ${hp?`<span class="hpchip">PS ${hp.hp}/${hp.max}</span>`:''} <span class="slotn">${idx+1}/2</span> ${back}</div>
     <div class="sec">Attacca</div>${lockNote(sid,a,me)}<div class="moves">${a.moves.map((m,i)=>{ const d=Dex.moves.get(m.id); const col=TYPE_COLORS[d.type]||'#666';
      const effs=d.category==='Status'?[]:foes.map(p=>effOf(m.id,sid,p)); const ef=effs.some(Boolean)?effs.map(e=>e?effSpan(e):'<span class="effl">·</span>').join('<span class="effsep">|</span>'):'<span class="effl none"></span>';
      return `<button class="mv" style="--tc:${col}" data-tip="move:${esc(m.id)}:${sid}:${idx===0?sid:sid+'b'}" ${m.disabled||m.pp===0?'disabled':`data-lt="pick" data-c="move ${i+1}"`}><span class="effrow">${ef}</span><b>${esc(m.move)}</b><span class="mt"><i class="tdot"></i>${TIPI[d.type]||d.type}</span><span class="pp">${m.pp??'–'}/${m.maxpp??'–'}</span></button>`; }).join('')}</div>`;
    if(a.canMegaEvo&&!megaUsed) h+=`<label class="tera mega"><input type="checkbox" id="lt-mega"> Megaevolvi <span class="st" style="background:linear-gradient(135deg,#F7A1D8,#7B3FC4)">MEGA</span></label>`;
    if(a.canTerastallize&&!teraUsed) h+=`<label class="tera"><input type="checkbox" id="lt-tera"> Teracristallizza <span class="st" style="background:${TYPE_COLORS[a.canTerastallize]||'#666'}">${(TIPI[a.canTerastallize]||esc(a.canTerastallize)).toUpperCase()}</span></label>`;
    h+=`<div class="sec">Cambia</div>${a.trapped?'<p class="lt-muted">Non puoi cambiare Pokémon.</p>':''}<div class="lt-team">${team.map((m,i)=>tm(m,i,a.trapped?null:'switch')).join('')}</div>`;
  }
  h+=`<div class="lt-foot"><span class="tmr" id="lt-tm"></span></div>`;
  c.innerHTML=h; timerArm(sid);
}
function pickDbl(sid,choice){
  const r=B.req[sid], P=B.pick; if(!P) return;
  if(choice.startsWith('team ')){ P.parts.push(choice.split(' ')[1]); const need=pickN(r)||Math.min(2,r.side.pokemon.length);
    if(P.parts.length>=need){ const ch='team '+P.parts.join(''); B.pick=null; if(O.mode==='two') B.passTo=null; send(sid,ch); } else uiDbl(sid); return; }
  const w=choice.split(' ');
  if(w[0]==='move'&&w.length===2){ const idx=P.parts.length, mi=+w[1]-1, mv=r.active[idx].moves[mi];
    if(T_ONE.includes(mv.target)){ const list=validTargets(sid,idx,mv.target); if(list.length>1){ const te=$('tera'), mg=$('mega'); P.teraNext=!!(te&&te.checked); P.megaNext=!!(mg&&mg.checked); P.tgt={mi}; uiDbl(sid); return; } if(list.length===1) choice+=' '+list[0].n; } }
  if(w[0]==='move'){ const te=$('tera'), mg=$('mega'); if((te&&te.checked)||P.teraNext) choice+=' terastallize'; else if((mg&&mg.checked)||P.megaNext) choice+=' mega'; P.teraNext=false; P.megaNext=false; }
  if(P.tgt){ const te=$('tera'); P.tgt=null; }
  P.parts.push(choice); uiDbl(sid);
}

// ---------- schede informative ----------
const typeChip=t=>`<span class="tc" style="background:${TYPE_COLORS[t]||'#666'}">${TIPI[t]||esc(t)}</span>`;
// Spiegazione in italiano degli effetti di una mossa, ricavata dai dati del motore
const ST_IT={brn:'scottare',par:'paralizzare',psn:'avvelenare',tox:'avvelenare gravemente',slp:'addormentare',frz:'congelare'};
const VOL_IT={flinch:'far tentennare',confusion:'confondere',attract:'far innamorare',partiallytrapped:'intrappolare per 4-5 turni',taunt:'provocare (solo mosse d\'attacco per 3 turni)',encore:'costringere a ripetere la mossa',yawn:'far addormentare al turno dopo',leechseed:'piantare un seme che ruba PS ogni turno',curse:'maledire',saltcure:'salare (danni ogni turno)',torment:'impedire di usare la stessa mossa due volte',disable:'bloccare l\'ultima mossa usata'};
const frac=v=>Array.isArray(v)?(v[0]+'/'+v[1]):v;
const boostTxt=b=>Object.entries(b).map(([k,v])=>`${STAT[k]||k} ${v>0?'+':''}${v}`).join(', ');
function moveEffects(mv){
  const out=[];
  if(mv.ohko) out.push('KO in un colpo se va a segno');
  if(mv.multihit) out.push('Colpisce '+(Array.isArray(mv.multihit)?mv.multihit.join('-'):mv.multihit)+' volte');
  if(mv.willCrit) out.push('Sempre brutto colpo'); else if(mv.critRatio>1) out.push('Alta probabilità di brutto colpo');
  if(mv.status) out.push('Serve a '+(ST_IT[mv.status]||mv.status)+' il bersaglio');
  if(mv.volatileStatus&&VOL_IT[mv.volatileStatus]) out.push('Serve a '+VOL_IT[mv.volatileStatus]+' il bersaglio');
  if(mv.boosts) out.push((mv.target==='self'?'Cambia le statistiche di chi la usa: ':'Cambia le statistiche del bersaglio: ')+boostTxt(mv.boosts));
  const self=(mv.self&&mv.self.boosts)||(mv.selfBoost&&mv.selfBoost.boosts); if(self) out.push('Poi a chi la usa: '+boostTxt(self));
  for(const s of (mv.secondaries||[])){ const c=s.chance?s.chance+'% di probabilità di ':'';
    if(s.status) out.push(c+(ST_IT[s.status]||s.status)+' il bersaglio');
    if(s.volatileStatus&&VOL_IT[s.volatileStatus]) out.push(c+VOL_IT[s.volatileStatus]+' il bersaglio');
    if(s.boosts) out.push(c+'cambiare le statistiche del bersaglio: '+boostTxt(s.boosts));
    if(s.self&&s.self.boosts) out.push(c+'cambiare le statistiche di chi la usa: '+boostTxt(s.self.boosts)); }
  if(mv.recoil) out.push('Contraccolpo: perde '+frac(mv.recoil)+' del danno inflitto');
  if(mv.mindBlownRecoil) out.push('Chi la usa perde metà dei suoi PS');
  if(mv.drain) out.push('Recupera '+frac(mv.drain)+' del danno inflitto');
  if(mv.heal) out.push('Cura '+frac(mv.heal)+' dei PS massimi');
  if(mv.selfSwitch) out.push('Dopo, chi la usa torna nella squadra e ne entra un altro');
  if(mv.forceSwitch) out.push('Costringe il bersaglio a cambiare');
  if(mv.sideCondition) out.push('Effetto che resta sul campo: '+(SIDECOND[toID(mv.sideCondition)]?SIDECOND[toID(mv.sideCondition)][0]:mv.sideCondition));
  if(mv.weather) out.push('Cambia il meteo: '+(WEATHER[mv.weather]||mv.weather));
  if(mv.terrain) out.push('Crea il campo: '+mv.terrain);
  if(mv.pseudoWeather) out.push('Effetto su tutto il campo: '+mv.pseudoWeather);
  if(mv.stallingMove) out.push('Protegge per un turno (meno affidabile se ripetuta)');
  if(mv.breaksProtect) out.push('Supera le protezioni');
  if(mv.self&&mv.self.volatileStatus==='mustrecharge') out.push('Il turno dopo chi la usa deve riposare');
  if(mv.flags){ const f=[]; if(mv.flags.contact) f.push('contatto'); if(mv.flags.sound) f.push('sonora'); if(mv.flags.punch) f.push('pugno'); if(mv.flags.bite) f.push('morso');
    if(mv.flags.slicing) f.push('taglio'); if(mv.flags.pulse) f.push('aura/pulsar'); if(mv.flags.bullet) f.push('proiettile'); if(mv.flags.wind) f.push('vento'); if(mv.flags.charge) f.push('si carica per un turno');
    if(f.length) out.push('Tipo di mossa: '+f.join(', ')); }
  return out;
}
const accTxt=mv=>mv.accuracy===true?'infallibile':mv.accuracy+'%';
const LL=(it,en)=>O&&O.lang==='en'?en:it;
const evn=k=>LL(EVN[k],SHORT_EN[EVN[k]]);
const xN=v=>LL('×'+String(v).replace('.',','),'×'+v);
// statistiche dal set (livello, EV, IV, natura), come il simulatore
function calcStats(set,level){ const sp=Dex.species.get(set.species); if(!sp.exists) return null; const L=level||set.level||100, nat=Dex.natures.get(set.nature||'Serious'), o={};
  for(const k of ['hp','atk','def','spa','spd','spe']){ const iv=(set.ivs&&set.ivs[k]!=null)?set.ivs[k]:31, ev=(set.evs&&set.evs[k])||0, b=sp.baseStats[k];
    if(k==='hp'){ o.hp=sp.name==='Shedinja'?1:Math.floor((2*b+iv+Math.floor(ev/4))*L/100)+L+10; continue; }
    let v=Math.floor((2*b+iv+Math.floor(ev/4))*L/100)+5; if(nat.plus===k) v=Math.floor(v*1.1); if(nat.minus===k) v=Math.floor(v*.9); o[k]=v; }
  return o; }
// velocità possibile di un avversario (come Showdown: da 0 EV e natura sfavorevole a 252 EV e natura favorevole)
function speedRange(species,level){ const b=Dex.species.get(species).baseStats.spe, L=level||100;
  return [Math.floor(Math.floor(Math.floor(2*b)*L/100+5)*.9), Math.floor(Math.floor(Math.floor(2*b+31+63)*L/100+5)*1.1)]; }
const isGrounded=(m,ab,item)=>{ const t=monTypes(m); return !t.includes('Flying')&&toID(ab)!=='levitate'&&toID(item)!=='airballoon'; };
function monTypes(m){ return m.tera&&m.tera!=='Stellar'?[m.tera]:(m.tchange&&m.tchange.length?m.tchange:Dex.species.get(m.species).types); }
// statistiche con le modifiche note (aumenti, strumenti, abilità, meteo, campo, stato)
function modStats(sid,m,base,ab,item){
  const v=Object.assign({},base), why=[]; if(!m) return {v,why};
  const A=toID(ab), I=toID(item), w=toID(B.weather||''), sun=/sunnyday|desolateland/.test(w), rain=/raindance|primordialsea/.test(w), sand=w==='sandstorm', snow=/snow|hail/.test(w);
  const t=monTypes(m), st=m.st&&m.st!=='fnt'?m.st:'', mul=(k,x,r)=>{ if(v[k]==null) return; v[k]=Math.floor(v[k]*x); const t=evn(k)+' '+xN(x), j=why.findIndex(y=>y.startsWith(r+' (')); if(j>=0) why[j]=why[j].slice(0,-1)+', '+t+')'; else why.push(r+' ('+t+')'); };
  for(const k in v){ const n=(m.boosts||{})[k]; if(n){ v[k]=Math.floor(v[k]*(n>0?(2+n)/2:2/(2-n))); } }
  if((m.boosts||{}) && Object.keys(v).some(k=>(m.boosts||{})[k])) why.push(LL('aumenti e cali','stat changes'));
  const sp=Dex.species.get(m.species);
  if(I==='choiceband') mul('atk',1.5,'Choice Band'); if(I==='choicespecs') mul('spa',1.5,'Choice Specs'); if(I==='choicescarf') mul('spe',1.5,'Choice Scarf');
  if(I==='assaultvest') mul('spd',1.5,'Assault Vest'); if(I==='eviolite'&&sp.nfe){ mul('def',1.5,'Eviolite'); mul('spd',1.5,'Eviolite'); }
  if(I==='lightball'&&sp.baseSpecies==='Pikachu'){ mul('atk',2,'Light Ball'); mul('spa',2,'Light Ball'); } if(I==='thickclub'&&/Cubone|Marowak/.test(sp.baseSpecies)) mul('atk',2,'Thick Club');
  if(I==='ironball'||/^power(weight|bracer|belt|lens|band|anklet)$/.test(I)||I==='machobrace') mul('spe',.5,Dex.items.get(item).name);
  const abN=Dex.abilities.get(ab).name||ab;
  if(A==='hugepower'||A==='purepower') mul('atk',2,abN); if(A==='hustle'||A==='gorillatactics') mul('atk',1.5,abN);
  if(A==='guts'&&st) mul('atk',1.5,abN); if(A==='marvelscale'&&st) mul('def',1.5,abN); if(A==='quickfeet'&&st) mul('spe',1.5,abN); if(A==='furcoat') mul('def',2,abN);
  if(A==='chlorophyll'&&sun||A==='swiftswim'&&rain||A==='sandrush'&&sand||A==='slushrush'&&snow) mul('spe',2,abN);
  if(A==='solarpower'&&sun) mul('spa',1.5,abN); if(A==='surgesurfer'&&B.field.electricterrain) mul('spe',2,abN); if(A==='grasspelt'&&B.field.grassyterrain) mul('def',1.5,abN);
  if(A==='unburden'&&!m.item&&m.itemGone) mul('spe',2,abN);
  if(m.psStat&&m.vol&&(m.vol.protosynthesis||m.vol.quarkdrive)) mul(m.psStat,m.psStat==='spe'?1.5:1.3,m.vol.protosynthesis?'Protosynthesis':'Quark Drive');
  if(sand&&t.includes('Rock')) mul('spd',1.5,LL('tempesta di sabbia','Sandstorm')); if(snow&&t.includes('Ice')) mul('def',1.5,LL('neve','Snow'));
  if(st==='par'&&A!=='quickfeet') mul('spe',.5,LL('paralisi','paralysis'));
  if(B.cond[sid]&&B.cond[sid].tailwind) mul('spe',2,'Tailwind');
  return {v,why}; }
const TYPE_ITEM={blackbelt:'Fighting',blackglasses:'Dark',charcoal:'Fire',dragonfang:'Dragon',hardstone:'Rock',magnet:'Electric',metalcoat:'Steel',miracleseed:'Grass',mysticwater:'Water',nevermeltice:'Ice',poisonbarb:'Poison',sharpbeak:'Flying',silkscarf:'Normal',silverpowder:'Bug',softsand:'Ground',spelltag:'Ghost',twistedspoon:'Psychic',fairyfeather:'Fairy',seaincense:'Water',waveincense:'Water',roseincense:'Grass',oddincense:'Psychic',rockincense:'Rock'};
const ATE={aerilate:'Flying',pixilate:'Fairy',refrigerate:'Ice',galvanize:'Electric'};
// potenza della mossa con le modifiche note (come "Base power: 60 → 90" su Showdown)
function movePower(mv,u,ab,item,tg,side){
  let bp=mv.basePower, type=mv.type; const why=[]; if(!bp&&!['lowkick','grassknot','heavyslam','heatcrash'].includes(mv.id)||!u) return {bp,type,why};
  const A=toID(ab), I=toID(item), hpR=u.max?u.hp/u.max:1, w=toID(B.weather||''), sun=/sunnyday|desolateland/.test(w), rain=/raindance|primordialsea/.test(w);
  const set=(x,r)=>{ if(x!==bp){ bp=x; why.push(r); } }, mul=(x,r)=>{ bp=Math.floor(bp*x); why.push(r+' '+xN(x)); };
  const tst=tg&&tg.st&&tg.st!=='fnt'?tg.st:'', ust=u.st&&u.st!=='fnt'?u.st:'';
  if(['eruption','waterspout','dragonenergy'].includes(mv.id)) set(Math.max(1,Math.floor(150*hpR)),LL('in base ai PS','based on HP'));
  if(['flail','reversal'].includes(mv.id)){ const q=Math.floor(48*hpR); set(q<2?200:q<5?150:q<10?100:q<17?80:q<33?40:20,LL('in base ai PS','based on HP')); }
  if(mv.id==='facade'&&ust&&ust!=='slp') set(140,LL('ha un problema di stato','user has a status'));
  if(mv.id==='hex'&&tst) set(130,LL('bersaglio con un problema di stato','target has a status'));
  if(mv.id==='venoshock'&&/psn|tox/.test(tst)) set(130,LL('bersaglio avvelenato','target is poisoned'));
  if(mv.id==='brine'&&tg&&tg.max&&tg.hp*2<=tg.max) set(130,LL('bersaglio a metà PS o meno','target at half HP or less'));
  if(mv.id==='acrobatics'&&!u.item) set(110,LL('senza strumento','no item'));
  if(['storedpower','powertrip'].includes(mv.id)){ const n=Object.values(u.boosts||{}).filter(x=>x>0).reduce((a,b)=>a+b,0); set(20+20*n,LL('aumenti di statistiche','stat boosts')); }
  if(mv.id==='lastrespects'){ const n=Object.values(B.side[side].team).filter(x=>x.st==='fnt').length; set(50+50*n,LL('compagni esausti','fainted allies')); }
  if(mv.id==='weatherball'&&B.weather&&!/deltastream/.test(w)){ set(100,WEATHER[B.weather]||B.weather); type=sun?'Fire':rain?'Water':/sandstorm/.test(w)?'Rock':'Ice'; }
  if(mv.id==='knockoff'&&tg&&(tg.item||!tg.itemSeen)) mul(1.5,LL('se il bersaglio ha uno strumento','if the target has an item'));
  if(['lowkick','grassknot'].includes(mv.id)){ if(!tg) return {bp:0,type,why:[LL('dipende dal peso del bersaglio','depends on the target\'s weight')]}; const kg=Dex.species.get(tg.species).weightkg; set(kg<10?20:kg<25?40:kg<50?60:kg<100?80:kg<200?100:120,LL('peso del bersaglio','target\'s weight')); }
  if(['heavyslam','heatcrash'].includes(mv.id)){ if(!tg) return {bp:0,type,why:[LL('dipende dal peso','depends on weight')]}; const r=Dex.species.get(u.species).weightkg/Dex.species.get(tg.species).weightkg; set(r>=5?120:r>=4?100:r>=3?80:r>=2?60:40,LL('confronto dei pesi','weight ratio')); }
  const abN=Dex.abilities.get(ab).name||ab, F=mv.flags||{};
  if(ATE[A]&&type==='Normal'&&mv.category!=='Status'){ type=ATE[A]; mul(1.2,abN); }
  if(A==='technician'&&bp<=60) mul(1.5,abN); if(A==='toughclaws'&&F.contact) mul(1.3,abN); if(A==='strongjaw'&&F.bite) mul(1.5,abN); if(A==='ironfist'&&F.punch) mul(1.2,abN);
  if(A==='megalauncher'&&F.pulse) mul(1.5,abN); if(A==='sharpness'&&F.slicing) mul(1.5,abN); if(A==='punkrock'&&F.sound) mul(1.3,abN); if(A==='reckless'&&(mv.recoil||mv.hasCrashDamage)) mul(1.2,abN);
  if(A==='sheerforce'&&(mv.secondaries||mv.secondary)) mul(1.3,abN); if(A==='sandforce'&&/sandstorm/.test(w)&&['Rock','Ground','Steel'].includes(type)) mul(1.3,abN);
  if(A==='steelworker'&&type==='Steel'||A==='dragonsmaw'&&type==='Dragon'||A==='rockypayload'&&type==='Rock') mul(1.5,abN); if(A==='transistor'&&type==='Electric') mul(1.3,abN); if(A==='waterbubble'&&type==='Water') mul(2,abN);
  if(hpR<=1/3&&({blaze:'Fire',torrent:'Water',overgrow:'Grass',swarm:'Bug'})[A]===type) mul(1.5,abN);
  const it=Dex.items.get(item); if(TYPE_ITEM[I]===type||it.onPlate===type&&/plate$/.test(I)) mul(1.2,it.name);
  if(I==='muscleband'&&mv.category==='Physical') mul(1.1,it.name); if(I==='wiseglasses'&&mv.category==='Special') mul(1.1,it.name); if(I==='punchingglove'&&F.punch) mul(1.1,it.name);
  if(sun&&type==='Fire'||rain&&type==='Water') mul(1.5,WEATHER[B.weather]||B.weather); if(sun&&type==='Water'&&mv.id!=='hydrosteam'||rain&&type==='Fire') mul(.5,WEATHER[B.weather]||B.weather);
  if(isGrounded(u,ab,u.item)){ const T={electricterrain:'Electric',grassyterrain:'Grass',psychicterrain:'Psychic'}; for(const k in T) if(B.field[k]&&type===T[k]) mul(1.3,B.field[k]); }
  return {bp,type,why}; }
function movePrio(mv,u,ab){ let p=mv.priority||0; const A=toID(ab), why=[];
  if(A==='prankster'&&mv.category==='Status'){ p++; why.push('Prankster'); }
  if(A==='galewings'&&mv.type==='Flying'&&u&&u.hp>=u.max){ p++; why.push('Gale Wings'); }
  if(A==='triage'&&mv.flags&&mv.flags.heal){ p+=3; why.push('Triage'); }
  if(mv.id==='grassyglide'&&B.field.grassyterrain){ p++; why.push(B.field.grassyterrain); }
  return {p,why}; }
const GONE={eat:['mangiato','eaten'],knock:['tolto da Knock Off','knocked off'],burn:['bruciato','incinerated'],stolen:['rubato e mangiato','stolen and eaten'],fling:['lanciato','flung'],taken:['preso','taken'],pop:['scoppiato','popped'],used:['usato','consumed']};
const goneTxt=m=>m&&m.itemGone?`${esc(m.itemGone.name)} ${LL(...GONE[m.itemGone.how]||GONE.used)}`:'';
function monTip(sid,set,live,stats){ const b=monTipBase(sid,set,live,stats), i=b.indexOf('</h4>')+5; return b.slice(0,i)+battleInfo(sid,live)+b.slice(i); }
const DUR={reflect:[5,8],lightscreen:[5,8],auroraveil:[5,8],tailwind:[4],safeguard:[5],mist:[5],trickroom:[5],gravity:[5],magicroom:[5],wonderroom:[5],electricterrain:[5,8],grassyterrain:[5,8],mistyterrain:[5,8],psychicterrain:[5,8]};
function leftTxt(key,durs){ const s=B.start[key]; if(!s||!durs) return ''; const used=Math.max(0,B.turn-s[0]); const r=durs.map(d=>Math.max(1,d-used));
  return r.length>1?` (ancora ${r[0]} turni, ${r[1]} con lo strumento adatto)`:` (ancora ${r[0]} turn${r[0]===1?'o':'i'})`; }
function battleInfo(sid,live){
  let h='';
  const wrap=x=>x?'<div class="binfo">'+x+'</div>':'';
  const bo=live&&Object.entries(live.boosts||{}).filter(([,v])=>v);
  if(bo&&bo.length) h+=`<div><b>Statistiche modificate:</b> ${bo.map(([k,v])=>`<span class="bchip ${v>0?'up':'down'}">${STAT[k]||k} ${v>0?'+':'−'}${Math.abs(v)}</span>`).join(' ')}</div>`;
  const isAct=live&&(actMon(sid)===live||actMon(sid+'b')===live);
  if(isAct){ const f=[]; if(B.weather) f.push((WEATHER[B.weather]||B.weather)+(/Desolate|Primordial|Delta/.test(B.weather)?'':leftTxt('w',(B.start.w&&B.start.w[1])?[5,8]:[5,8]))); for(const k in B.field) f.push(B.field[k]+leftTxt('f'+k,DUR[k]));
    const c=Object.entries(B.cond[sid]).filter(([,v])=>v).map(([k,v])=>(SIDECOND[k]?SIDECOND[k][0]:k)+(v>1?' ×'+v:'')+leftTxt(sid+k,DUR[k]));
    if(f.length) h+=`<div><b>Sul campo:</b> ${f.map(esc).join(', ')}</div>`;
    if(c.length) h+=`<div><b>Dalla sua parte:</b> ${c.map(esc).join(', ')}</div>`; }
  return wrap(h); }
function monTipBase(sid,set,live,stats){
  const sp=Dex.species.get(live&&live.species||set.species); const types=live&&live.tera&&live.tera!=='Stellar'?[live.tera]:(live&&live.tchange&&live.tchange.length?live.tchange:sp.types);
  let h=`<h4>${esc(sp.name)}${live&&live.shiny||set.shiny?' ✨':''} ${types.map(typeChip).join('')}</h4><dl>`;
  if(live&&live.max&&live.st!=='fnt') h+=`<dt>PS</dt><dd>${exactHP(sid)||viewer()===sid?`${Math.round(live.hp)} / ${live.max}`:Math.ceil(live.hp/live.max*100)+'%'}${live.st?' · '+live.st.toUpperCase():''}</dd>`;
  if(live&&live.st==='fnt') h+=`<dt>PS</dt><dd>esausto</dd>`;
  const abDesc=n=>{ const ab=Dex.abilities.get(n); return ab.exists?`<div class="desc"><b>Abilità ${esc(ab.name)}:</b> ${esc(descIt('a',ab.id,ab.desc||ab.shortDesc||''))}</div>`:''; };
  const itDesc=n=>{ const it=Dex.items.get(n); return it.exists?`<div class="desc">${icon(n)} <b>${esc(it.name)}:</b> ${esc(descIt('i',it.id,it.desc||it.shortDesc||''))}</div>`:''; };
  if(!setVisible(sid)){
    if(live&&live.abilitySeen) h+=`<dt>Abilità</dt><dd>${esc(live.abilitySeen)}</dd>`;
    else h+=`<dt>Abilità possibili</dt><dd>${Object.values(sp.abilities).map(esc).join(', ')}</dd>`;
    if(live&&live.itemSeen) h+=`<dt>Strumento</dt><dd>${live.item?esc(live.item):'nessuno'}${!live.item&&live.itemGone?` <span class="lt-muted">(${goneTxt(live)})</span>`:''}</dd>`;
    h+=`<dt>Base</dt><dd>${Object.entries(sp.baseStats).map(([k,v])=>`${EVN[k]} ${v}`).join(' · ')}</dd>`;
    { const lv=live&&live.level||100, [lo,hi]=speedRange(sp.name,lv); h+=`<dt>${LL('Velocità','Speed')}</dt><dd>${lo} – ${hi} <span class="lt-muted">${LL('(possibile, senza modifiche)','(possible, before modifiers)')}</span>`;
      if(live&&live.st!=='fnt'&&(actMon(sid)===live||actMon(sid+'b')===live)){ const a=modStats(sid,live,{spe:lo},live.abilitySeen,live.itemSeen?live.item:null), b=modStats(sid,live,{spe:hi},live.abilitySeen,live.itemSeen?live.item:null); if(a.why.length) h+=`<br><b class="stmod">${a.v.spe} – ${b.v.spe}</b> <span class="lt-muted">(${LL('adesso','now')}: ${esc(a.why.join(', '))})</span>`; }
      h+=`</dd>`; }
    h+=`</dl>`;
    if(live&&live.abilitySeen) h+=abDesc(live.abilitySeen);
    if(live&&live.itemSeen&&live.item) h+=itDesc(live.item);
    if(live&&live.movesSeen&&live.movesSeen.length) h+=`<table class="mvt"><tr><th></th><th>Mosse viste</th><th></th><th>Cat.</th><th>Pot.</th><th>Prec.</th></tr>${live.movesSeen.map(mn=>{ const mv=Dex.moves.get(mn); return `<tr><td>${typeChip(mv.type)}</td><td><b>${esc(mv.name)}</b></td><td>${effSpan(effOf(mv.id,sid))}</td><td>${CAT[mv.category]||''}</td><td>${mv.basePower||'—'}</td><td>${accTxt(mv)}</td></tr>`; }).join('')}</table>`;
    h+=`<div class="lt-muted">Le mosse, lo strumento e l'abilità si scoprono durante la lotta.</div>`; return h; }
  const nat=Dex.natures.get(set.nature); const evs=Object.entries(set.evs||{}).filter(([,v])=>v).map(([k,v])=>`${v} ${EVN[k]}`).join(' / ');
  const item=live?live.item:set.item;
  h+=`<dt>Abilità</dt><dd>${esc(set.ability)}</dd><dt>Strumento</dt><dd>${item?esc(item):'nessuno'}${!item&&live&&live.itemGone?` <span class="lt-muted">(${goneTxt(live)})</span>`:''}</dd>`;
  if(set.nature) h+=`<dt>Natura</dt><dd>${esc(set.nature)}${nat.plus?` (<span class="plus">+${STAT[nat.plus]}</span> <span class="minus">−${STAT[nat.minus]}</span>)`:' (neutra)'}</dd>`;
  if(evs) h+=`<dt>EV</dt><dd>${evs}</dd>`;
  if(set.teraType) h+=`<dt>Tera</dt><dd>${typeChip(set.teraType)}</dd>`;
  if(!stats&&set.species) stats=calcStats(set,live&&live.level);
  if(stats){ const base=Object.assign({},stats); delete base.hp; const act=live&&live.st!=='fnt'&&(actMon(sid)===live||actMon(sid+'b')===live); const md=act?modStats(sid,live,base,live.abilitySeen||set.ability,live.item):{v:base,why:[]};
    h+=`<dt>${LL('Statistiche','Stats')}</dt><dd>${Object.entries(base).map(([k,v])=>md.v[k]!==v?`${evn(k)} <s>${v}</s> <b class="stmod ${md.v[k]>v?'up':'down'}">${md.v[k]}</b>`:`${evn(k)} ${v}`).join(' · ')}${md.why.length?`<br><span class="lt-muted">${LL('Con','With')}: ${esc(md.why.join(', '))}</span>`:''}</dd>`; }
  if(false) h+=`<dt>Modifiche</dt><dd>${Object.entries(live.boosts).filter(([,v])=>v).map(([k,v])=>`${STAT[k]} ${v>0?'+':''}${v}`).join(', ')}</dd>`;
  h+=`</dl><table class="mvt"><tr><th></th><th>Mossa</th><th></th><th>Cat.</th><th>Pot.</th><th>Prec.</th></tr>${set.moves.map(mn=>{ const mv=Dex.moves.get(mn);
    return `<tr><td>${typeChip(mv.type)}</td><td><b>${esc(mv.name)}</b></td><td>${effSpan(effOf(mv.id,sid))}</td><td>${CAT[mv.category]||''}</td><td>${mv.basePower||'—'}</td><td>${accTxt(mv)}</td></tr>`; }).join('')}</table>`;
  h+=abDesc(set.ability); if(item) h+=itDesc(item);
  return h;
}
function moveTip(id,sid,pos){
  const mv=Dex.moves.get(id); const fpos=sid&&isDbl()?[other(sid),other(sid)+'b'].filter(p=>{ const m=actMon(p); return m&&m.st!=='fnt'; }):null; const e=sid&&!fpos?effOf(id,sid):null; const effD=fpos&&fpos.length&&mv.category!=='Status'?fpos.map(p=>esc(actMon(p).species)+': '+((effOf(id,sid,p)||[0,LL('normale','neutral')])[1])):null; const fx=moveEffects(mv);
  const u=pos?actMon(pos):null, set=u?setOf(sid,u.species)||{}:{}, ab=u?(u.abilitySeen||set.ability||''):'', it=u?u.item:null;
  const foes=sid?[other(sid),other(sid)+'b'].map(actMon).filter(x=>x&&x.st!=='fnt'):[], tg=foes.length===1?foes[0]:null;
  const pw=movePower(mv,u,ab,it,tg,sid), pr=movePrio(mv,u,ab), sign=n=>(n>0?'+':n<0?'−':'')+Math.abs(n);
  const tags=[]; const F=mv.flags||{}; const selfish=['self','allySide','allyTeam','foeSide','all'].includes(mv.target);
  if(mv.category!=='Status'||!selfish){ if(!F.protect&&!selfish) tags.push(LL('Non viene fermata da Protect','Not blocked by Protect')); if(F.bypasssub) tags.push(LL('Passa attraverso il sostituto','Bypasses Substitute')); if(F.reflectable) tags.push(LL('Respinta da Magic Bounce','Bounced back by Magic Bounce')); }
  if(isDbl()&&mv.target==='allAdjacentFoes') tags.push(LL('Colpisce tutti e due gli avversari (danno ridotto a ×0,75)','Hits both foes (damage ×0.75)'));
  if(isDbl()&&mv.target==='allAdjacent') tags.push(LL('Colpisce tutti gli altri Pokémon in campo, anche il compagno (danno ×0,75)','Hits all other Pokémon, ally included (damage ×0.75)'));
  if(F.contact&&toID(it)==='punchingglove'&&F.punch||F.contact&&toID(ab)==='longreach') tags.push(LL('Con '+(toID(ab)==='longreach'?'Long Reach':'Punching Glove')+' non fa contatto','No contact thanks to '+(toID(ab)==='longreach'?'Long Reach':'Punching Glove')));
  return `<h4>${esc(mv.name)} ${typeChip(pw.type)}${pw.type!==mv.type?` <span class="lt-muted">(${LL('di solito','usually')} ${TIPI[mv.type]||mv.type})</span>`:''}</h4><dl><dt>Categoria</dt><dd>${CAT[mv.category]||mv.category}</dd>
   <dt>Potenza</dt><dd>${pw.bp!==mv.basePower&&pw.bp?`${mv.basePower?mv.basePower+' → ':''}<b class="stmod ${pw.bp>mv.basePower?'up':'down'}">${pw.bp}</b>`:(mv.basePower||(pw.why.length?'?':'—'))}${pw.why.length?` <span class="lt-muted">(${esc(pw.why.join(', '))})</span>`:''}</dd><dt>Precisione</dt><dd>${mv.accuracy===true?'infallibile':mv.accuracy+'%'}</dd><dt>PP</dt><dd>${Math.floor(mv.pp*1.6)}</dd>
   ${pr.p?`<dt>Priorità</dt><dd>${sign(pr.p)}: ${pr.p>0?LL('di solito agisce per prima','usually moves first'):LL('di solito agisce per ultima','usually moves last')}${pr.why.length?` <span class="lt-muted">(${esc(pr.why.join(', '))})</span>`:''}</dd>`:''}
   ${tags.length?`<dt>${LL('Note','Notes')}</dt><dd>${tags.map(esc).join('<br>')}</dd>`:''}
   ${e?`<dt>Sul bersaglio</dt><dd>${e[1]}</dd>`:''}${effD?`<dt>Sul bersaglio</dt><dd>${effD.join('<br>')}</dd>`:''}</dl>
   ${fx.length?`<ul class="fx">${fx.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
   <div class="desc">${esc(descIt('m',mv.id,mv.desc||mv.shortDesc||''))}</div>${(e||effD)?'<div class="lt-muted">L\'efficacia non tiene conto delle abilità (es. Levitate).</div>':''}`;
}
function itemTip(pos){ const sid=sideOfPos(pos), m=actMon(pos); if(!m) return '';
  if(!setVisible(sid)&&!m.itemSeen) return `<h4>Strumento sconosciuto</h4><div class="lt-muted">Lo scoprirai quando entra in azione.</div>`;
  if(!m.item) return m.itemGone?`<h4>${icon(m.itemGone.name)} ${esc(m.itemGone.name)} <span class="lt-muted">(${LL(...GONE[m.itemGone.how]||GONE.used)})</span></h4><div class="lt-muted">${LL(esc(m.species)+' non ha più uno strumento.',esc(m.species)+' no longer holds an item.')}</div>`:`<h4>Nessuno strumento</h4><div class="lt-muted">${esc(m.species)} non ha (più) uno strumento.</div>`;
  const it=Dex.items.get(m.item); return `<h4>${icon(m.item)} ${esc(it.name||m.item)}</h4><div class="desc">${esc(descIt('i',it.id,it.desc||it.shortDesc||''))}</div>`; }
function tipHTML(key){
  const [kind,a,b,c]=key.split(':');
  if(kind==='move') return moveTip(a,b,c);
  if(kind==='item') return itemTip(a);
  if(kind==='act'){ const sd=sideOfPos(a), m=actMon(a); if(!m) return ''; const set=setOf(sd,m.species)||{moves:[]};
    const rq=B.req[sd]&&B.req[sd].side&&B.req[sd].side.pokemon.find(x=>String(x.ident||'').split(': ')[1]===m.nick); return monTip(sd,set,m,setVisible(sd)&&rq?rq.stats:null); }
  if(kind==='pk'){ const k=Object.keys(B.side[a].team)[+b], m=k&&B.side[a].team[k]; if(!m) return ''; return monTip(a,setOf(a,m.species)||{moves:[]},m,null); }
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
  if(a==='pick'){ const sid=O.mode==='cpu'||O.role?'p1':B.passTo; if(sid&&need(sid)) pick(sid,b.dataset.c); }
  else if(a==='iam'){ B.passTo=b.dataset.s; prompt(); }
  else if(a==='new'){ const f=O.onNew; close(true); f&&f(); }
  else if(a==='close') close();
  else if(a==='sfx'){ SND.sfx=!SND.sfx; LSset('lt-sfx',SND.sfx); if(SND.sfx) sfx('hit'); drawTools(); }
  else if(a==='music'){ SND.music=!SND.music; LSset('lt-music',SND.music); if(SND.music) musicStart(); else musicStop(); drawTools(); }
  else if(a==='timer'){ B.timerOn=!B.timerOn; if(!B.timerOn) timerClear(); else { const s=O.mode==='cpu'||O.role?(need('p1')?'p1':null):(need('p1')?'p1':need('p2')?'p2':null); if(s) timerArm(s); } say(B.timerOn?'Timer attivato: 60 secondi per ogni scelta.':'Timer disattivato.'); drawTools(); timerShow(); }
  else if(a==='chatmin'){ root.classList.toggle('chatmin'); LSset('lt-chatmin',root.classList.contains('chatmin')); if(!root.classList.contains('chatmin')){ B.unread=0; drawUnread(); const box=$('chat'); box.scrollTop=box.scrollHeight; } }
  else if(a==='chatsend') chatSend();
  else if(a==='pback'){ const P=B.pick; if(P){ if(P.tgt) P.tgt=null; else { P.parts.pop(); while(P.parts.length&&P.parts[P.parts.length-1]==='pass') P.parts.pop(); } const s=O.mode==='cpu'||O.role?'p1':B.passTo; if(s) ui(s); } }
  else if(a==='logmin'){ root.classList.toggle('logmin'); LSset('lt-logmin',root.classList.contains('logmin')); const box=$('log'); if(box) box.scrollTop=box.scrollHeight; }
  else if(a==='ff'){ if(!B||B.over) return; const sid=O.mode==='cpu'||O.role?'p1':(B.passTo||(need('p1')?'p1':need('p2')?'p2':'p1'));
    if(b.dataset.sure){ delete b.dataset.sure; b.textContent='🏳 Arrenditi'; timerClear(); say(`${PN(sid)} si arrende!`); loseBy(sid); }
    else { b.dataset.sure='1'; b.textContent=O.mode==='cpu'||O.role?'Sicuro? Premi di nuovo':`Si arrende ${O.names[sid]}? Premi di nuovo`; setTimeout(()=>{ if(b.isConnected&&b.dataset.sure){ delete b.dataset.sure; b.textContent='🏳 Arrenditi'; } },3500); } }
  else if(a==='exit'){ if(b.dataset.sure){ close(); } else { b.dataset.sure='1'; b.textContent='Sicuro? Premi di nuovo'; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.sure; b.textContent='Esci dalla lotta'; } },3000); } }
}
const EVTS=[['pointerover',onOver],['pointerdown',onDown],['pointerup',onUp],['pointercancel',onUp],['pointermove',onUp],['contextmenu',onMenu]];


// ---------- lotta online (collegamento diretto già aperto dal gioco, vedi pokemon-incanto.html) ----------
// L'host fa girare il motore; all'amico arrivano solo i messaggi del motore per il suo lato (quello che vedrebbe su Showdown)
// e lui manda solo le sue scelte, che l'host controlla. L'amico vede la lotta dal suo punto di vista: i lati p1/p2 vengono scambiati.
const swapPS=s=>String(s).replace(/\bp([12])(?=[a-d]?[:|\s,"]|[a-d]?$)/g,(m,n)=>'p'+(3-n));
const CHOICE_OK=/^(?:(?:move [1-4](?: -?[12])?(?: terastallize| mega)?|switch [1-6]|pass|default)(?:, (?:move [1-4](?: -?[12])?(?: terastallize| mega)?|switch [1-6]|pass|default))?|team [1-6]{1,6})$/;
function loseBy(sid){ if(O.role==='guest'){ O.net.send({t:'bff'}); } else B.streams.omniscient.write('>forcelose '+sid); }
function drawUnread(){ const u=$('unread'); if(!u) return; u.hidden=!B.unread; u.textContent=B.unread>9?'9+':String(B.unread||''); }
function chatAdd(who,text,mine){ const box=$('chat'); if(!box) return; const d=document.createElement('div'); d.className='cm'+(mine?' mine':'');
  d.innerHTML='<b>'+esc(who)+':</b> '+esc(text); box.appendChild(d); while(box.children.length>200) box.removeChild(box.firstChild); box.scrollTop=box.scrollHeight;
  if(!mine&&root.classList.contains('chatmin')){ B.unread=(B.unread||0)+1; drawUnread(); } }
function chatSend(){ const i=$('chatin'); if(!i) return; const x=i.value.replace(/\s+/g,' ').trim().slice(0,200); if(!x) return;
  const now=Date.now(); B.sent=(B.sent||[]).filter(t=>now-t<8000); if(B.sent.length>=6){ chatAdd('Sistema','Troppi messaggi: aspetta qualche secondo.',true); return; }
  B.sent.push(now); O.net.send({t:'chat',x}); chatAdd(O.names.p1,x,true); i.value=''; }
function onChatKey(e){ if(e.key==='Enter'&&e.target&&e.target.id==='lt-chatin'){ e.preventDefault(); chatSend(); } }
// messaggi dall'altro giocatore (chiamata dal gioco)
function net(m){
  if(!root||!B||!O||!O.net||!m||typeof m!=='object') return;
  if(m.t==='chat'){ const now=Date.now(); B.rcv=(B.rcv||[]).filter(t=>now-t<8000); if(B.rcv.length>=10) return; B.rcv.push(now);
    chatAdd(O.names.p2,String(m.x||'').replace(/\s+/g,' ').trim().slice(0,200),false); sfxChat(); return; }
  if(m.t==='bav'){ const a=String(m.a||''); if(/^[a-z0-9-]{1,24}$/.test(a)){ O.avatars.p2=typeof Avatar==='undefined'?a:Avatar.fix(a); drawTrainers(); } return; }   // id = nome del file dell'allenatore; uno sconosciuto (anche i vecchi a01…a20) diventa quello predefinito
  if(m.t==='bexit'){ if(B.over) return; timerClear(); say(`${PN('p2')} ha lasciato la lotta.`); if(O.role==='host') B.streams.omniscient.write('>forcelose p2'); else { B.over=true; say(`Vince ${PN('p1')}!`,'win'); musicStop(); prompt(); } return; }
  if(O.role==='host'){
    if(m.t==='bc'){ const c=String(m.c||''); if(CHOICE_OK.test(c)&&!B.over) B.streams.p2.write(c); }
    else if(m.t==='bff'){ if(!B.over){ say(`${PN('p2')} si arrende!`); B.streams.omniscient.write('>forcelose p2'); } }
    return; }
  if(O.role==='guest'&&m.t==='bl'){ const chunk=String(m.c||''); if(chunk.length>200000) return;
    if(!B.started){ B.started=true; say('La lotta sta per cominciare!'); }
    for(const raw of chunk.split('\n')){ if(!raw.startsWith('|')) continue; const line=swapPS(raw);
      if(line.startsWith('|request|')){ let r; try{ r=JSON.parse(line.slice(9)); }catch(e){ continue; } if(!r||typeof r!=='object') continue; r.rqid=++B.nreq; B.req.p1=r;
        if(r.side&&Array.isArray(r.side.pokemon)) for(const rp of r.side.pokemon){ const nick=String(rp.ident||'').split(': ')[1]; const mm=B.side.p1.team[nick]; if(mm) mm.item=rp.item?Dex.items.get(rp.item).name:null; }
        setTimeout(prompt,0); }
      else if(line.startsWith('|error|')){ B.err=line; B.answered.p1=null; setTimeout(prompt,0); }
      else B.queue.push(line); }
    pump(); }
}
function sfxChat(){ if(SND.sfx) try{ tone(880,.08,'sine',.05); tone(1175,.1,'sine',.05,.07); }catch(e){} }

// ---------- lotta in inglese: i testi italiani mostrati nella schermata vengono tradotti al volo (O.lang==='en') ----------
const TYPE_EN={Normale:'Normal',Fuoco:'Fire',Acqua:'Water',Elettro:'Electric',Erba:'Grass',Ghiaccio:'Ice',Lotta:'Fighting',Veleno:'Poison',Terra:'Ground',Volante:'Flying',Psico:'Psychic',Coleottero:'Bug',Roccia:'Rock',Spettro:'Ghost',Drago:'Dragon',Buio:'Dark',Acciaio:'Steel',Folletto:'Fairy',Astrale:'Stellar'};
const STAT_EN={'PS':'HP','Attacco':'Attack','Difesa':'Defense','Att. Sp.':'Sp. Atk','Dif. Sp.':'Sp. Def','Velocità':'Speed','Precisione':'accuracy','Elusione':'evasiveness'};
const SHORT_EN={PS:'HP',Att:'Atk',Dif:'Def',AtSp:'SpA',DfSp:'SpD',Vel:'Spe',Prec:'Acc',Elus:'Eva'};
const WEATHER_EN={'Pioggia':'Rain','Sole intenso':'Harsh sunlight','Tempesta di sabbia':'Sandstorm','Neve':'Snow','Grandine':'Hail','Sole estremo':'Extremely harsh sunlight','Diluvio':'Heavy rain','Correnti misteriose':'Strong winds'};
const COND_EN={'Rocce aguzze':'Stealth Rock','Punte':'Spikes','Fielepunte':'Toxic Spikes','Rete vischiosa':'Sticky Web','Riflesso':'Reflect','Schermoluce':'Light Screen','Velo Aurora':'Aurora Veil','Vento in coda':'Tailwind','Salvaguardia':'Safeguard','Nebbia':'Mist'};
const CAUSE_EN={'il veleno':'poison','la scottatura':'its burn','le rocce aguzze':'the pointed stones','le punte':'the spikes','la tempesta di sabbia':'the sandstorm','la grandine':'the hail','il contraccolpo':'recoil','la confusione':'confusion'};
const VERB_EN={'scottare':'burn','paralizzare':'paralyze','avvelenare':'poison','avvelenare gravemente':'badly poison','addormentare':'put to sleep','congelare':'freeze','far tentennare':'make flinch','confondere':'confuse','far innamorare':'infatuate','intrappolare per 4-5 turni':'trap for 4-5 turns','provocare (solo mosse d\'attacco per 3 turni)':'taunt (attacks only for 3 turns)','costringere a ripetere la mossa':'force to repeat its move','far addormentare al turno dopo':'make drowsy (sleeps next turn)','piantare un seme che ruba PS ogni turno':'seed (drains HP every turn)','maledire':'curse','salare (danni ogni turno)':'salt cure (damage every turn)','impedire di usare la stessa mossa due volte':'torment','bloccare l\'ultima mossa usata':'disable the last move used'};
const SCENE_EN={'Prato':'Meadow','Spiaggia':'Beach','Foresta':'Forest','Grotta':'Cave','Stadio in città':'City stadium'};
const SIDE_EN={'Rocce aguzze fluttuano intorno alla squadra di':n=>`Pointed stones float in the air around ${n}'s team!`,'Punte sparse sotto la squadra di':n=>`Spikes were scattered on the ground around ${n}'s team!`,
  'Punte velenose sparse sotto la squadra di':n=>`Poison spikes were scattered on the ground around ${n}'s team!`,'Una rete vischiosa è tesa sotto la squadra di':n=>`A sticky web spreads out on the ground around ${n}'s team!`,
  'Reflect protegge la squadra di':n=>`Reflect made ${n}'s team stronger against physical moves!`,'Light Screen protegge la squadra di':n=>`Light Screen made ${n}'s team stronger against special moves!`,
  'Aurora Veil protegge la squadra di':n=>`Aurora Veil made ${n}'s team stronger against physical and special moves!`,'Tailwind soffia alle spalle di':n=>`The Tailwind blew from behind ${n}'s team!`,
  'Safeguard protegge la squadra di':n=>`${n}'s team cloaked itself in a mystical veil!`,'La nebbia avvolge la squadra di':n=>`${n}'s team became shrouded in mist!`};
const EN_EXACT={"Confuso":"Confused","Parassiseme":"Leech Seed","Provocato":"Taunt","Ripeti":"Encore","Sonnolenza":"Drowsy","Focalizzato":"Focus Energy","Infatuato":"Attract","Maledetto":"Curse","Inibitore":"Disable","Embargo":"Embargo","Anticura":"Heal Block","Magnetascesa":"Magnet Rise","Acquanello":"Aqua Ring","Radicamento":"Ingrain","Fuocodentro":"Flash Fire","Avvio lento":"Slow Start","Paleosintesi":"Protosynthesis","Carica quark":"Quark Drive","Carica":"Charge","Attaccalite":"Torment","Incubo":"Nightmare","Ingannoforza":"Power Trick","A terra":"Smacked Down","Telecinesi":"Telekinesis","Gola tagliata":"Throat Chop","Salatura":"Salt Cure","Sciroppo":"Syrup Bomb","Catrame":"Tar Shot","Esclusiva":"Imprison","Concentrato":"Laser Focus","Miracolvista":"Miracle Eye","Preveggenza":"Foresight","Segugio":"Odor Sleuth","Nessuna fuga":"No Retreat","Polipresa":"Octolock","Intrappolato":"Trapped","Desiderio":"Doom Desire","Divinazione":"Future Sight","Gastroacido":"Gastro Acid","Lama lanciata":"Glaive Rush","Minimizzato":"Minimize","Ricciolscudo":"Defense Curl",'Lotta':'Battle','Esci dalla lotta':'Leave battle','Sicuro? Premi di nuovo':'Sure? Press again','🏳 Arrenditi':'🏳 Forfeit','📜 Cronaca':'📜 Log','💬 Chat':'💬 Chat','⏱ Timer':'⏱ Timer','⏱ Timer attivo':'⏱ Timer on',
  'Cronaca della lotta':'Battle log','Scrivi al tuo avversario. Sii gentile!':'Write to your opponent. Be nice!','Invia':'Send','Scrivi un messaggio…':'Write a message…','Attacca':'Attack','Cambia':'Switch',
  'Teracristallizza':'Terastallize','Chi mandi in campo per primo?':'Who will you send out first?','Chi mandi in campo?':'Who will you send out?','Non puoi cambiare Pokémon.':'You can\'t switch.','Il turno è in corso…':'The turn is in progress…','Scelta non valida, riprova.':'Invalid choice, try again.',
  'In attesa…':'Waiting…','Nuova lotta':'New battle','Chiudi la lotta':'Close the battle','Chiudi':'Close','La lotta sta per cominciare!':'The battle is about to begin!','È superefficace!':'It\'s super effective!','Non è molto efficace…':'It\'s not very effective…',
  'Brutto colpo!':'A critical hit!','Ma non ha effetto!':'But it failed!','Tutte le modifiche alle statistiche spariscono!':'All stat changes were eliminated!','Il tempo torna normale.':'The weather became clear.','Il sostituto incassa il colpo!':'The substitute took damage for it!',
  'Pareggio!':'Tie!','Timer attivato: 60 secondi per ogni scelta.':'Timer on: 60 seconds for each choice.','Timer disattivato.':'Timer off.','Troppi messaggi: aspetta qualche secondo.':'Too many messages: wait a few seconds.','Sistema':'System',
  'Inizia a piovere!':'It started to rain!','La luce del sole è intensa!':'The sunlight turned harsh!','Si alza una tempesta di sabbia!':'A sandstorm kicked up!','Inizia a nevicare!':'It started to snow!','Inizia a grandinare!':'It started to hail!',
  'Il sole è diventato rovente!':'The sunlight turned extremely harsh!','Inizia un diluvio!':'A heavy rain began to fall!','Soffiano correnti misteriose!':'Mysterious strong winds are protecting Flying-type Pokémon!',
  'Fisica':'Physical','Speciale':'Special','Stato':'Status','Mossa':'Move','Cat.':'Cat.','Pot.':'Pow.','Prec.':'Acc.','Mosse viste':'Moves seen','Abilità':'Ability','Abilità possibili':'Possible abilities','Strumento':'Item','nessuno':'none','Natura':'Nature',
  'EV':'EVs','Tera':'Tera','Statistiche':'Stats','Base':'Base stats','Modifiche':'Boosts','Categoria':'Category','Potenza':'Power','Precisione':'Accuracy','PP':'PP','Priorità':'Priority','Sul bersaglio':'On the target','Contatto':'Contact','sì':'yes',
  'Statistiche modificate:':'Stat changes:','Sul campo:':'Field:','Dalla sua parte:':'Its side:','infallibile':'never misses','esausto':'fainted','(neutra)':'(neutral)','Nessun effetto':'No effect','Iper efficace ×4':'Super effective ×4','Superefficace ×2':'Super effective ×2',
  'Poco efficace ×½':'Not very effective ×½','Per niente efficace ×¼':'Barely effective ×¼','Le mosse, lo strumento e l\'abilità si scoprono durante la lotta.':'Moves, item and ability are revealed during the battle.',
  'L\'efficacia non tiene conto delle abilità (es. Levitate).':'Effectiveness ignores abilities (e.g. Levitate).','Strumento sconosciuto':'Unknown item','Lo scoprirai quando entra in azione.':'You\'ll find out when it activates.','Nessuno strumento':'No item',
  'KO in un colpo se va a segno':'One-hit KO if it hits','Sempre brutto colpo':'Always lands a critical hit','Alta probabilità di brutto colpo':'High critical-hit ratio','Chi la usa perde metà dei suoi PS':'The user loses half its max HP',
  'Dopo, chi la usa torna nella squadra e ne entra un altro':'Afterwards the user switches out','Costringe il bersaglio a cambiare':'Forces the target to switch out','Protegge per un turno (meno affidabile se ripetuta)':'Protects for one turn (less reliable if repeated)',
  'Supera le protezioni':'Bypasses protection','Il turno dopo chi la usa deve riposare':'The user must recharge next turn',
  'Punta col mouse (o tieni premuto, da telefono) Pokémon, Poké Ball, strumenti e mosse per vedere le informazioni. Calcoli del simulatore di Pokémon Showdown (MIT).':'Hover (or long-press on a phone) Pokémon, Poké Balls, items and moves to see their details. Calculations by the Pokémon Showdown simulator (MIT).',
  'Riduci la cronaca':'Collapse the log','Apri la cronaca della lotta':'Open the battle log','Riduci la chat':'Collapse the chat','Apri la chat':'Open the chat','Messaggio':'Message','Effetti e versi':'Sound effects and cries','Musica':'Music','Timer: 60 secondi per scelta':'Timer: 60 seconds per choice','Strumento ':'Item ','PS':'HP'};
for(const k in TYPE_EN){ EN_EXACT[k]=TYPE_EN[k]; EN_EXACT[k.toUpperCase()]=TYPE_EN[k].toUpperCase(); }
for(const k in WEATHER_EN) EN_EXACT[k]=WEATHER_EN[k]; for(const k in COND_EN) EN_EXACT[k]=COND_EN[k];
const stRx='(Attacco|Difesa|Att\\. Sp\\.|Dif\\. Sp\\.|Velocità|Precisione|Elusione|PS)';
const statsIn=s=>s.replace(new RegExp(stRx,'g'),m=>STAT_EN[m]||m);
const lab=s=>{ const m=/^(.+) di (.+)$/.exec(s); return m?`${m[2]}'s ${m[1]}`:s; };
const EN_STAT={Attacco:'Attack',Difesa:'Defense','Att. Sp.':'Sp. Atk','Dif. Sp.':'Sp. Def','Velocità':'Speed'};
const CANT_EN={'è infatuato e non attacca!':'is immobilized by love!','sta oziando.':'is loafing around!','perde la concentrazione e non attacca!':'lost its focus and couldn\'t move!','non può usare la mossa per la provocazione!':'can\'t use that move after the taunt!','non può usare la mossa bloccata!':'can\'t use its disabled move!','non può usare la mossa sigillata!':'can\'t use its sealed move!','non può usare mosse sonore!':'can\'t use sound-based moves!','non può usare la mossa per la gravità!':'can\'t use that move because of gravity!','non ha più PP per questa mossa!':'has no PP left for this move!','non può usare la mossa.':'can\'t use the move.'};
const CURE_EN={'si sveglia!':'woke up!','non è più paralizzato!':'was cured of paralysis!','guarisce dalla scottatura!':'was healed of its burn!','non è più avvelenato!':'was cured of its poisoning!','si scongela!':'thawed out!'};
const EN_RX=[
  [/^(.+?) (è infatuato e non attacca!|sta oziando\.|perde la concentrazione e non attacca!|non può usare la mossa per la provocazione!|non può usare la mossa bloccata!|non può usare la mossa sigillata!|non può usare mosse sonore!|non può usare la mossa per la gravità!|non ha più PP per questa mossa!|non può usare la mossa\.)$/,(m,a,b)=>`${lab(a)} ${CANT_EN[b]}`],
  [/^(.+?) (si sveglia!|non è più paralizzato!|guarisce dalla scottatura!|non è più avvelenato!|si scongela!)$/,(m,a,b)=>`${lab(a)} ${CURE_EN[b]}`],
  [/^Gli aumenti delle statistiche di (.+) spariscono!$/,(m,a)=>`${lab(a)}'s stat boosts were removed!`],
  [/^(.+?) scambia le modifiche alle statistiche con (.+)!$/,(m,a,b)=>`${lab(a)} switched stat changes with ${lab(b)}!`],
  [/^Le modifiche alle statistiche di (.+) si invertono!$/,(m,a)=>`${lab(a)}'s stat changes were inverted!`],
  [/^(.+?) copia le modifiche alle statistiche di (.+)!$/,(m,a,b)=>`${lab(a)} copied ${lab(b)}'s stat changes!`],
  [/^La squadra di (.+) guarisce da tutti i problemi di stato!$/,(m,a)=>`${a}'s team was cured of its status conditions!`],
  [/^(.+?) si trasforma in (.+)!$/,(m,a,b)=>`${lab(a)} transformed into ${b}!`],
  [/^(.+?) si prepara a usare (.+)!$/,(m,a,b)=>`${lab(a)} is preparing ${b}!`],
  [/^Colpito 1 volta!$/,()=>'The Pokémon was hit 1 time!'],[/^Colpito (\d+) volte!$/,(m,a)=>`The Pokémon was hit ${a} times!`],
  [/^È un colpo KO!$/,()=>"It's a one-hit KO!"],[/^Ma non c'è nessun bersaglio…$/,()=>'But there was no target…'],[/^Ma non succede niente!$/,()=>'But nothing happened!'],
  [/^Le mosse si uniscono!$/,()=>'The two moves have become one!'],[/^(.+?) aspetta la mossa del compagno…$/,(m,a)=>`${lab(a)} is waiting for its ally's move…`],
  [/^(.+?) vuole trascinare con sé l'avversario!$/,(m,a)=>`${lab(a)} is hoping to take its attacker down with it!`],[/^(.+?) vuole vendicarsi!$/,(m,a)=>`${lab(a)} wants its target to bear a grudge!`],
  [/^Tutti i Pokémon che sentono il canto andranno KO tra 3 turni!$/,()=>'All Pokémon that heard the song will faint in three turns!'],
  [/^Gli effetti dei due lati del campo si scambiano!$/,()=>'The effects on each side of the field were swapped!'],
  [/^(.+?) torna alla sua forma archeologica!$/,(m,a)=>`${lab(a)}'s Primal Reversion! It reverted to its primal form!`],
  [/^(.+?) cambia posto con il compagno!$/,(m,a)=>`${lab(a)} switched places with its ally!`],
  [/^La protezione di (.+) è stata spezzata!$/,(m,a)=>`It broke through ${lab(a)}'s protection!`],
  [/^Gli schermi della squadra di (.+) vanno in frantumi!$/,(m,a)=>`${a}'s team's screens shattered!`],
  [/^Bloccato su (.+) da (.+)$/,(m,a,b)=>`Locked into ${a} by ${b}`],[/^Alcune mosse non si possono usare in questo turno\.$/,()=>"Some moves can't be used this turn."],
  [/^(Protosynthesis|Quark Drive) potenzia (.+?) \((.+)\)!$/,(m,a,b,c)=>`${a} boosted ${lab(b)}'s ${EN_STAT[c]||c}!`],
  [/^È superefficace su (.+)!$/,(m,a)=>`It's super effective on ${lab(a)}!`],[/^Non è molto efficace su (.+)…$/,(m,a)=>`It's not very effective on ${lab(a)}…`],
  [/^Lo strumento (.+?) di (.+) è stato tolto!$/,(m,a,b)=>`${lab(b)}'s ${a} was knocked off!`],[/^Lo strumento (.+?) di (.+) è bruciato!$/,(m,a,b)=>`${lab(b)}'s ${a} was burned up!`],
  [/^Lo strumento (.+?) di (.+) è stato rubato e mangiato!$/,(m,a,b)=>`${lab(b)}'s ${a} was stolen and eaten!`],[/^(.+?) lancia (.+)!$/,(m,a,b)=>`${lab(a)} flung its ${b}!`],
  [/^(.+?) resiste grazie a (.+)!$/,(m,a,b)=>`${lab(a)} hung on using its ${b}!`],[/^Il palloncino di (.+) scoppia!$/,(m,a)=>`${lab(a)}'s Air Balloon popped!`],
  [/^(Wide Guard|Quick Guard|Crafty Shield|Mat Block) protegge la squadra di (.+)!$/,(m,a,b)=>`${a} protected ${b}'s team!`],[/^(.+?) è protetto da (.+)!$/,(m,a,b)=>`${lab(a)} was protected by ${b}!`],
  [/^\((.+?) perde il (\d+)% dei PS!\)$/,(m,a,n)=>`(${lab(a)} lost ${n}% of its health!)`],[/^\((.+?) recupera il (\d+)% dei PS!\)$/,(m,a,n)=>`(${lab(a)} had its HP restored: ${n}%!)`],
  [/^(Protosynthesis|Quark Drive): (Att\.|Dif\.|Att\.Sp\.|Dif\.Sp\.|Vel\.)$/,(m,a,s)=>a+': '+({'Att.':'Atk','Dif.':'Def','Att.Sp.':'SpA','Dif.Sp.':'SpD','Vel.':'Spe'})[s]],
  [/^(.+?) diventa di tipo (.+)!$/,(m,a,t)=>`${lab(a)} transformed into the ${t.split('/').map(x=>TYPE_EN[x]||x).join('/')} type!`],
  [/^(.+?) è confuso!$/,(m,a)=>`${lab(a)} became confused!`],[/^(.+?) è stato colpito da Leech Seed!$/,(m,a)=>`${lab(a)} was seeded!`],[/^(.+?) cade nella provocazione!$/,(m,a)=>`${lab(a)} fell for the taunt!`],[/^(.+?) è costretto da Encore!$/,(m,a)=>`${lab(a)} must do an encore!`],[/^(.+?) diventa sonnolento!$/,(m,a)=>`${lab(a)} grew drowsy!`],[/^(.+?) si concentra al massimo!$/,(m,a)=>`${lab(a)} is getting pumped!`],[/^(.+?) si è infatuato!$/,(m,a)=>`${lab(a)} fell in love!`],[/^(.+?) è maledetto!$/,(m,a)=>`${lab(a)} was cursed!`],[/^La mossa (.*) di (.+?) è bloccata!$/,(m,x,a)=>`${lab(a)}'s ${x} was disabled!`],
  [/^(.+?) non può curarsi!$/,(m,a)=>`${lab(a)} was prevented from healing!`],[/^(.+?) levita grazie al magnetismo!$/,(m,a)=>`${lab(a)} levitated with electromagnetism!`],[/^(.+?) si circonda di un velo d'acqua!$/,(m,a)=>`${lab(a)} surrounded itself with a veil of water!`],[/^(.+?) mette radici!$/,(m,a)=>`${lab(a)} planted its roots!`],[/^La potenza delle mosse Fuoco di (.+?) aumenta!$/,(m,a)=>`The power of ${lab(a)}'s Fire-type moves rose!`],[/^(.+?) non riesce a carburare!$/,(m,a)=>`${lab(a)} can't get it going!`],[/^Protosynthesis potenzia (.+?)!$/,(m,a)=>`Protosynthesis boosted ${lab(a)}!`],[/^Quark Drive potenzia (.+?)!$/,(m,a)=>`Quark Drive boosted ${lab(a)}!`],[/^(.+?) si carica di elettricità!$/,(m,a)=>`${lab(a)} began charging power!`],[/^(.+?) è tormentato!$/,(m,a)=>`${lab(a)} was subjected to torment!`],[/^(.+?) cade a terra!$/,(m,a)=>`${lab(a)} fell straight down!`],[/^(.+?) è colpito da Salt Cure!$/,(m,a)=>`${lab(a)} is being salt cured!`],[/^(.+?) diventa più debole al fuoco!$/,(m,a)=>`${lab(a)} became weaker to fire!`],[/^(.+?) non può più fuggire!$/,(m,a)=>`${lab(a)} can no longer escape!`],[/^(.+?) tiene (.+) \(rivelato da (.+)\)\.$/,(m,a,i,ab)=>`${lab(a)} is holding ${i} (revealed by ${ab}).`],[/^(.+?) è intrappolato da (.+)!$/,(m,a,x)=>`${lab(a)} was trapped by ${x}!`],[/^(.+?) è intrappolato!$/,(m,a)=>`${lab(a)} is trapped!`],[/^(.+?) prevede un attacco!$/,(m,a)=>`${lab(a)} foresaw an attack!`],[/^(.+?) sceglie Doom Desire come destino!$/,(m,a)=>`${lab(a)} chose Doom Desire as its destiny!`],[/^L'abilità di (.+?) viene annullata!$/,(m,a)=>`${lab(a)}'s Ability was suppressed!`],[/^(.+?) si concentra intensamente!$/,(m,a)=>`${lab(a)} concentrated intensely!`],[/^(.+?) si rimpicciolisce!$/,(m,a)=>`${lab(a)} shrank!`],
  [/^(.+?) usa$/,(m,a)=>`${lab(a)} used`],[/^(.+) manda in campo$/,(m,a)=>`${a} sent out`],
  [/^(.+?) recupera PS( \((.+)\))?\.$/,(m,a,b,c)=>`${lab(a)} restored HP${c?' ('+c+')':''}.`],[/^(.+?) subisce danni per (.+)\.$/,(m,a,b)=>`${lab(a)} was hurt by ${CAUSE_EN[b]||b}.`],
  [/^(.+?) è esausto!$/,(m,a)=>`${lab(a)} fainted!`],[/^Non ha effetto su (.+?)…$/,(m,a)=>`It doesn't affect ${lab(a)}…`],[/^(.+?) manca il bersaglio!$/,(m,a)=>`${lab(a)}'s attack missed!`],
  [/^(.+?) è scottato!$/,(m,a)=>`${lab(a)} was burned!`],[/^(.+?) è paralizzato e potrebbe non muoversi!$/,(m,a)=>`${lab(a)} is paralyzed! It may be unable to move!`],[/^(.+?) si è addormentato!$/,(m,a)=>`${lab(a)} fell asleep!`],
  [/^(.+?) è gravemente avvelenato!$/,(m,a)=>`${lab(a)} was badly poisoned!`],[/^(.+?) è avvelenato!$/,(m,a)=>`${lab(a)} was poisoned!`],[/^(.+?) è congelato!$/,(m,a)=>`${lab(a)} was frozen solid!`],
  [/^(.+?) è guarito\.$/,(m,a)=>`${lab(a)} was cured.`],[/^(.+?) è paralizzato! Non riesce a muoversi!$/,(m,a)=>`${lab(a)} is paralyzed! It can't move!`],[/^(.+?) dorme profondamente\.$/,(m,a)=>`${lab(a)} is fast asleep.`],
  [/^(.+?) tentenna e non attacca!$/,(m,a)=>`${lab(a)} flinched and couldn't move!`],[/^(.+?) deve riprendersi\.$/,(m,a)=>`${lab(a)} must recharge!`],[/^(.+?) non può muoversi\.$/,(m,a)=>`${lab(a)} can't move!`],
  [new RegExp('^'+stRx+' di (.+?) (aumenta|diminuisce)( molto| tantissimo)?!$'),(m,s,a,v,q)=>`${lab(a)}'s ${STAT_EN[s]} ${v==='aumenta'?'rose':'fell'}${q===' molto'?(v==='aumenta'?' sharply':' harshly'):q===' tantissimo'?' drastically':''}!`],
  [new RegExp('^'+stRx+' di (.+?) non può cambiare oltre!$'),(m,s,a)=>`${lab(a)}'s ${STAT_EN[s]} won't go any further!`],
  [new RegExp('^'+stRx+' al massimo!$'),(m,s)=>`${STAT_EN[s]} maximized!`],[new RegExp('^'+stRx+' (↑+|↓+)$'),(m,s,a)=>`${STAT_EN[s]} ${a}`],
  [/^(.+?) svanisce\.$/,(m,a)=>`${a} ended.`],[/^(.+?) sparisce dalla parte di (.+)\.$/,(m,a,b)=>`${COND_EN[a]||a} disappeared from ${b}'s side.`],
  [/^(.+?) si teracristallizza: tipo (.+)!$/,(m,a,b)=>`${lab(a)} has Terastallized into the ${TYPE_EN[b]||b} type!`],[/^\[Abilità di (.+?): (.+)\]$/,(m,a,b)=>`[${lab(a)}'s ${b}]`],
  [/^(.+?) ottiene (.+)\.$/,(m,a,b)=>`${lab(a)} obtained ${b}.`],[/^(.+?) mangia (.+)!$/,(m,a,b)=>`${lab(a)} ate its ${b}!`],[/^(.+?) perde (.+)\.$/,(m,a,b)=>`${lab(a)} lost its ${b}.`],
  [/^(.+?) crea un sostituto!$/,(m,a)=>`${lab(a)} put in a substitute!`],[/^(.+?) è confuso!$/,(m,a)=>`${lab(a)} became confused!`],[/^Il sostituto di (.+?) svanisce!$/,(m,a)=>`${lab(a)}'s substitute faded!`],
  [/^(.+?) si protegge!$/,(m,a)=>`${lab(a)} protected itself!`],[/^Megaevolvi$/,()=>'Mega Evolve'],[/^(.+?) megaevolve!$/,(m,a)=>`${lab(a)} has Mega Evolved!`],[/^(.+?) cambia forma!$/,(m,a)=>`${lab(a)} transformed!`],
  [/^Turno (\d+)$/,(m,a)=>`Turn ${a}`],[/^— Turno (\d+) —$/,(m,a)=>`— Turn ${a} —`],[/^Vince (.+)!$/,(m,a)=>`${a} won the battle!`],[/^(.+?) si arrende!$/,(m,a)=>`${a} forfeited.`],[/^(.+?) ha lasciato la lotta\.$/,(m,a)=>`${a} left the battle.`],
  [/^In attesa che (.+) faccia partire la lotta…$/,(m,a)=>`Waiting for ${a} to start the battle…`],[/^In attesa di (.+)…$/,(m,a)=>`Waiting for ${a}…`],[/^Sono (.+)$/,(m,a)=>`I'm ${a}`],
  [/^Si arrende (.+)\? Premi di nuovo$/,(m,a)=>`Does ${a} forfeit? Press again`],[/^Tempo scaduto per la terza volta: (.+) perde la lotta\.$/,(m,a)=>`Time ran out for the third time: ${a} loses the battle.`],
  [/^Tempo scaduto! Per (.+) viene scelta una mossa a caso \((\d)\/3\)\.$/,(m,a,b)=>`Time's up! A random move was chosen for ${a} (${b}/3).`],
  [/^Tocca a $/,()=>'It\'s '],[/^ scegliere\. Passa il dispositivo e premi il pulsante(.*)\.$/,(m,a)=>`'s turn to choose. Pass the device and press the button${a?' (the other player should look away: you will see your team\'s moves and items)':''}.`],
  [/^Cosa farà $/,()=>'What will '],[/^ do\?$/,()=>' do?'],[/^PS (\d+)\/(\d+)$/,(m,a,b)=>`HP ${a}/${b}`],[/^\+(\d+) PS$/,(m,a)=>`+${a} HP`],
  [/^TERA (.+)$/,(m,a)=>`TERA ${(TYPE_EN[a.charAt(0)+a.slice(1).toLowerCase()]||a).toUpperCase()}`],[/^(Att|Dif|AtSp|DfSp|Vel|Prec|Elus)([+−]\d)$/,(m,a,b)=>SHORT_EN[a]+b],
  [/^· Sfondo: (.+)$/,(m,a)=>`· Background: ${SCENE_EN[a]||a}`],[/^Serve a (.+) il bersaglio$/,(m,a)=>`Used to ${VERB_EN[a]||a} the target`],
  [/^(\d+)% di probabilità di (.+?) il bersaglio$/,(m,a,b)=>`${a}% chance to ${VERB_EN[b]||b} the target`],[/^(\d+)% di probabilità di cambiare le statistiche del bersaglio: (.+)$/,(m,a,b)=>`${a}% chance to change the target's stats: ${statsIn(b)}`],
  [/^(\d+)% di probabilità di cambiare le statistiche di chi la usa: (.+)$/,(m,a,b)=>`${a}% chance to change the user's stats: ${statsIn(b)}`],[/^Cambia le statistiche di chi la usa: (.+)$/,(m,a)=>`Changes the user's stats: ${statsIn(a)}`],
  [/^Cambia le statistiche del bersaglio: (.+)$/,(m,a)=>`Changes the target's stats: ${statsIn(a)}`],[/^Poi a chi la usa: (.+)$/,(m,a)=>`Then to the user: ${statsIn(a)}`],
  [/^Colpisce (.+) volte$/,(m,a)=>`Hits ${a} times`],[/^Contraccolpo: perde (.+) del danno inflitto$/,(m,a)=>`Recoil: loses ${a} of the damage dealt`],[/^Recupera (.+) del danno inflitto$/,(m,a)=>`Heals ${a} of the damage dealt`],
  [/^Cura (.+) dei PS massimi$/,(m,a)=>`Heals ${a} of max HP`],[/^Effetto che resta sul campo: (.+)$/,(m,a)=>`Lasting side effect: ${COND_EN[a]||a}`],[/^Cambia il meteo: (.+)$/,(m,a)=>`Changes the weather: ${WEATHER_EN[a]||a}`],
  [/^Crea il campo: (.+)$/,(m,a)=>`Sets the terrain: ${a}`],[/^Effetto su tutto il campo: (.+)$/,(m,a)=>`Field effect: ${a}`],
  [/^Tipo di mossa: (.+)$/,(m,a)=>'Move flags: '+a.replace('contatto','contact').replace('sonora','sound').replace('pugno','punch').replace('morso','bite').replace('taglio','slicing').replace('aura/pulsar','pulse').replace('proiettile','bullet').replace('vento','wind').replace('si carica per un turno','charges for a turn')],
  [/^(.+?) \(agisce (prima|dopo)\)$/,(m,a,b)=>`${a} (moves ${b==='prima'?'first':'last'})`],[/^(.+?) non ha \(più\) uno strumento\.$/,(m,a)=>`${a} has no item (anymore).`],[/^Abilità (.+?):$/,(m,a)=>`Ability ${a}:`],
  [/^(Rocce aguzze fluttuano intorno alla squadra di|Punte sparse sotto la squadra di|Punte velenose sparse sotto la squadra di|Una rete vischiosa è tesa sotto la squadra di|Reflect protegge la squadra di|Light Screen protegge la squadra di|Aurora Veil protegge la squadra di|Tailwind soffia alle spalle di|Safeguard protegge la squadra di|La nebbia avvolge la squadra di) (.+)!$/,(m,a,b)=>SIDE_EN[a](b)],
  [/^(.+) \(ancora (\d+) turni, (\d+) con lo strumento adatto\)$/,(m,a,b,c)=>`${a} (${b} turns left, ${c} with the right item)`],[/^(.+) \(ancora (\d+) turn[oi]\)$/,(m,a,b)=>`${a} (${b} turn${b==='1'?'':'s'} left)`],
  [/^[\d ]+(PS|Att|Dif|AtSp|DfSp|Vel)( \/ [\d ]+(PS|Att|Dif|AtSp|DfSp|Vel))*$/,m=>m.replace(/PS|AtSp|DfSp|Att|Dif|Vel/g,x=>SHORT_EN[x])],
  [/^(PS|Att|Dif|AtSp|DfSp|Vel) \d+( · (PS|Att|Dif|AtSp|DfSp|Vel) \d+)*$/,m=>m.replace(/PS|AtSp|DfSp|Att|Dif|Vel/g,x=>SHORT_EN[x])],
  [/^([+−])(Attacco|Difesa|Att\. Sp\.|Dif\. Sp\.|Velocità)$/,(m,a,b)=>a+STAT_EN[b]],[/^(.+?), (.+)$/,m=>m.split(', ').every(x=>WEATHER_EN[x]||COND_EN[x]||/Terrain|Room|Gravity/.test(x))?m.split(', ').map(x=>WEATHER_EN[x]||COND_EN[x]||x).join(', '):m],
];
function trText(s){
  const t=s.trim(); if(!t) return s; let r=EN_EXACT[t];
  if(r===undefined){ for(const [re,f] of EN_RX){ if(re.test(t)){ r=t.replace(re,f); break; } } }
  if(r===undefined||r===t) return s; return s.replace(t,r); }
function trTree(n){
  if(n.nodeType===3){ const v=trText(n.nodeValue); if(v!==n.nodeValue) n.nodeValue=v; return; }
  if(n.nodeType!==1) return;
  for(const at of ['placeholder','title','aria-label']) if(n.hasAttribute&&n.hasAttribute(at)){ const v=trText(n.getAttribute(at)); if(v!==n.getAttribute(at)) n.setAttribute(at,v); }
  for(const c of n.childNodes) trTree(c); }
let TR_OBS=null;
function startTranslate(){ if(TR_OBS) TR_OBS.disconnect(); TR_OBS=null; if(!O||O.lang!=='en') return; trTree(root);
  TR_OBS=new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData') trTree(m.target); else for(const a of m.addedNodes) trTree(a); } });
  TR_OBS.observe(root,{subtree:true,childList:true,characterData:true}); }

// ---------- apertura e chiusura ----------
async function readSide(g,sid,stream){
  for await(const chunk of stream){ if(g!==gen) return;
    // il collegamento diretto perde i messaggi oltre ~16 KB: i pezzi lunghi si dividono tra una riga e l'altra (l'amico legge riga per riga)
    if(O.role==='host'&&sid==='p2'){ let buf=''; for(const ln of chunk.split('\n')){ if(buf&&buf.length+ln.length>12000){ O.net.send({t:'bl',c:buf}); buf=''; } buf+=(buf?'\n':'')+ln; } if(buf) O.net.send({t:'bl',c:buf}); continue; }
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
  if(O&&O.net&&B&&!B.over) try{ O.net.send({t:'bexit'}); }catch(e){}
  audioStopAll(); if(B&&B.tick) clearInterval(B.tick);
  gen++; if(B&&B.streams) try{ B.streams.omniscient.writeEnd(); }catch(e){}
  for(const [ev,fn] of EVTS) document.removeEventListener(ev,fn); document.removeEventListener('click',onClickCapture,true); removeEventListener('scroll',hideTip);
  if(TR_OBS){ TR_OBS.disconnect(); TR_OBS=null; }
  if(root) root.remove(); root=null; document.documentElement.style.overflow='';
  const f=O&&O.onClose; O=null; B=null; if(!silent&&f) f();
}
function open(opts){
  if(root) close(true);
  O=Object.assign({mode:'two',showOpp:true,names:{p1:'Giocatore 1',p2:'Giocatore 2'},formatid:'gen9nationaldexag'},opts);
  O.dbl=/doubles|vgc/.test(O.formatid);
  // livello dell'IA 1-10 (level); i vecchi valori ai 0-4 si convertono. aiMem: memoria che passa da una lotta all'altra di un BO3
  O.level=O.mode==='cpu'?Math.max(0,Math.min(10,Math.round(+O.level)||({1:2,2:4,3:6,4:8})[O.ai]||0)):0; if(O.aiMem) O.aiMem.games=(O.aiMem.games||0)+1;
  O.avatars=Object.assign({},O.avatars);
  try{ const pa=typeof profAvatar==='function'&&profAvatar(); if(pa){ if(O.mode!=='two'){ if(!O.avatars.p1) O.avatars.p1=pa; }
      else { const me=typeof profMe==='function'&&profMe(); for(const sd of ['p1','p2']) if(me&&me.nick&&O.names[sd]===me.nick&&!O.avatars[sd]) O.avatars[sd]=pa; } } }catch(e){}
  if(!document.getElementById('lotta-css')){ const s=document.createElement('style'); s.id='lotta-css'; s.textContent=CSS; document.head.appendChild(s); }
  root=document.createElement('div'); root.id='lotta'; root.setAttribute('role','dialog'); root.setAttribute('aria-label','Lotta');
  root.innerHTML=`<div class="lt-wrap"><div class="lt-top"><h2 class="lt-title">${O.lang==='en'?'Battle':'Lotta'}</h2><span class="lt-muted">${esc(O.formatName||'')}<span id="lt-scene"></span></span>${O.series?`<span class="lt-series">${esc(O.series)}</span>`:''}<button class="tool lt-chatopen" data-lt="chatmin" aria-label="Apri la chat">💬 Chat<b class="unread" id="lt-unread" hidden></b></button><button class="tool lt-reopen" data-lt="logmin" aria-label="Apri la cronaca della lotta" title="Apri la cronaca della lotta">📜 Cronaca</button><span class="lt-tools" id="lt-tools"></span><button class="btn ghost ff" data-lt="ff">🏳 Arrenditi</button><button class="btn ghost" data-lt="exit">Esci dalla lotta</button></div>
   <div class="lt-main"><div class="lt-left">
   <div class="lt-info"><span class="turnb" id="lt-turn" hidden></span><span class="wlabel" id="lt-wlabel" hidden></span></div>
   <div class="lt-stage"><div class="trainer p1" id="lt-trp1"></div><div class="trainer p2" id="lt-trp2"></div>
   <div class="arena" id="lt-arena">
    <div class="bg" id="lt-bg"></div>
    <div class="tfx" id="lt-tfx" hidden></div><div class="rfx" id="lt-rfx" hidden></div>
    <div class="pad p2"></div><div class="pad p1"></div>
    <div class="haz p2" id="lt-hazp2"></div><div class="haz p1" id="lt-hazp1"></div>
    <div id="lt-scrp2"></div><div id="lt-scrp1"></div>
    <div class="mon p2 out" id="lt-monp2" data-tip="act:p2"></div><div class="mon p2b out" id="lt-monp2b" data-tip="act:p2b"></div><div class="mon p1b out" id="lt-monp1b" data-tip="act:p1b"></div><div class="mon p1 out" id="lt-monp1" data-tip="act:p1"></div>
    <div class="wfx" id="lt-wfx" hidden></div>
    <div class="hud p2" id="lt-hudp2" hidden></div><div class="hud p2b" id="lt-hudp2b" hidden></div><div class="hud p1" id="lt-hudp1" hidden></div><div class="hud p1b" id="lt-hudp1b" hidden></div>
   </div></div>
   <div class="lt-msg" id="lt-msg" aria-live="polite"></div>
   <section class="ctrl" id="lt-ctrl"></section></div>
   <div class="lt-side"><aside class="lt-right" id="lt-right"><button class="lt-logh" data-lt="logmin" aria-label="Riduci la cronaca">Cronaca della lotta <span class="arr">▾</span></button><div class="lt-logbox" id="lt-log"></div></aside>
   <aside class="lt-chatp" id="lt-chatp" hidden><button class="lt-logh" data-lt="chatmin" aria-label="Riduci la chat">Chat <span class="arr">▾</span></button><div class="lt-chatbox" id="lt-chat"><p class="lt-muted">Scrivi al tuo avversario. Sii gentile!</p></div>
    <div class="lt-chatin"><input type="text" id="lt-chatin" maxlength="200" placeholder="Scrivi un messaggio…" autocomplete="off" aria-label="Messaggio"><button class="btn" data-lt="chatsend">Invia</button></div></aside></div></div>
   <p class="lt-muted lt-hint">Punta col mouse (o tieni premuto, da telefono) Pokémon, Poké Ball, strumenti e mosse per vedere le informazioni. Calcoli del simulatore di Pokémon Showdown (MIT).</p></div>
   <div class="lt-tip" id="lt-tip" hidden></div>`;
  if(O.dbl) root.classList.add('dbl');
  document.body.appendChild(root); document.documentElement.style.overflow='hidden'; startTranslate();
  for(const [ev,fn] of EVTS) document.addEventListener(ev,fn); document.addEventListener('click',onClickCapture,true); addEventListener('scroll',hideTip,{passive:true,capture:true});
  root.addEventListener('click',onClick); addEventListener('resize',()=>{ if(root&&B){ drawField(); stackDbl(); } }); if(LS('lt-logmin',false)) root.classList.add('logmin');
  root.addEventListener('pointerdown',audioUnlock); root.addEventListener('keydown',audioUnlock); root.addEventListener('keydown',onChatKey);
  gen++; B=fresh(); const g=gen;
  B.sets.p1=Teams.import(O.teams.p1)||[];
  // l'amico conosce della squadra dell'host solo le specie (come nell'anteprima squadre di Showdown)
  B.sets.p2=O.role==='guest'?(O.oppSpecies||[]).map(s=>({species:s,name:'',moves:[],ability:'',item:''})):(Teams.import(O.teams.p2)||[]);
  if(O.net){ root.classList.add('online'); $('chatp').hidden=false; if(LS('lt-chatmin',false)) root.classList.add('chatmin'); }
  const sc=SCENES.includes(O.scene)?O.scene:pickNew(SCENES,'lt-lastscene');
  $('arena').className='arena sc-'+sc; $('bg').innerHTML=sceneSVG(sc); $('scene').textContent=' · Sfondo: '+SCENE_NAMES[sc];
  drawField(); drawTrainers(); if(typeof ICON_DATA==='undefined') loadJS('icone-data.js').then(()=>{ if(root){ for(const sd of ['p1','p2']){ const el=$('tr'+sd); if(el) el._h=''; } drawTrainers(); } }).catch(()=>{});
  if(typeof Avatar==='undefined') loadJS('avatar.js').then(()=>{ if(root){ drawTrainers(); sendAv(); } }).catch(()=>{}); else sendAv();

  say('La lotta sta per cominciare!'); loadPS(); drawTools(); loadJS('descrizioni-data.js').catch(()=>{}); loadJS('audio-data.js').then(()=>{ if(root) musicStart(); }).catch(()=>{}); B.tick=setInterval(timerTick,250);
  if(O.intro) say(esc(O.intro),'turn');
  if(O.role==='guest'){ say(`In attesa che ${PN('p2')} faccia partire la lotta…`); return; }   // l'amico non ha il motore: riceve tutto dall'host
  const bstream=new BattleStreams.BattleStream(); B.bs=bstream; const streams=BattleStreams.getPlayerStreams(bstream); B.streams=streams;
  readSide(g,'p1',streams.p1); readSide(g,'p2',streams.p2); readLog(g,streams.omniscient);
  const pl=s=>JSON.stringify({name:String(O.names[s]).slice(0,18),team:Teams.pack(B.sets[s])});
  streams.omniscient.write(`>start ${JSON.stringify({formatid:O.formatid})}\n>player p1 ${pl('p1')}\n>player p2 ${pl('p2')}`);
}
// Solo per l'anteprima: mostra meteo, campi e schermi senza aspettare che qualcuno li usi in lotta
function demo(o){ if(!B) return; if('weather' in o) B.weather=o.weather||null; if('terrain' in o){ for(const k of Object.keys(B.field)) if(k.endsWith('terrain')) delete B.field[k]; if(o.terrain) B.field[o.terrain]=({electricterrain:'Electric Terrain',grassyterrain:'Grassy Terrain',mistyterrain:'Misty Terrain',psychicterrain:'Psychic Terrain'})[o.terrain]; }
  if('trickroom' in o){ if(o.trickroom) B.field.trickroom='Trick Room'; else delete B.field.trickroom; }
  if(o.cond) for(const s of ['p1','p2']) if(o.cond[s]) B.cond[s]=o.cond[s];
  if(o.scene&&SCENES.includes(o.scene)){ $('arena').className='arena sc-'+o.scene; $('bg').innerHTML=sceneSVG(o.scene); $('scene').textContent=' · Sfondo: '+SCENE_NAMES[o.scene]; }
  draw(); }
// Solo anteprima: prova un'animazione di mossa
async function demoMove(name,from,dry){ await loadPS(); return psRun('move',name,from||'p1',(from||'p1')==='p1'?'p2':'p1',false,dry); }
window.Lotta={net,isOpen:()=>!!(root&&B),_ai:()=>B&&B.aiLog,_play:(sid,L,fn)=>{ if(B&&need(sid)) send(sid,fn?fn(B.req[sid],()=>aiChoiceFor(sid,L)):aiChoiceFor(sid,L)); },_mem:()=>O&&O.aiMem,_ail:()=>AIL,_audio:()=>({ctx:SND.ctx&&SND.ctx.state,music:!!SND.mus,track:SND.mus&&SND.mus.m.file,playing:!!(SND.mus&&!SND.mus.el.paused),sfx:SND.sfx,sil:!!SIL}),open,close,demo,demoMove,SCENES,SCENE_NAMES,_B:()=>B};
})();
