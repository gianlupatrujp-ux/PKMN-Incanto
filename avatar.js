// Avatar del profilo di Pokémon Incanto: tutti disegnati da zero in SVG (originali, nessuna immagine esterna).
// Usato dal gioco (profilo) e dalla lotta. Uso: Avatar.html(id) → <span class="avatar">…svg…</span>; Avatar.valid(id); Avatar.name(id,lang).
// Gli id sono a01…a20 (allenatori) e t01…t12 (simboli dei tipi). Un id sconosciuto diventa Avatar.def.
const Avatar=(()=>{
// ===== Allenatori originali "stile anime" (mezzo busto), disegnati da zero in SVG =====
// Ispirati solo allo stile generale dei disegni dei fan (giacche, berretti, occhi grandi): nessun personaggio copiato.
const SKIN2=['#FCE0C8','#F2C29B','#D39462','#9A6440'];
const shade=(c,f)=>{ const n=parseInt(c.slice(1),16), m=x=>Math.max(0,Math.min(255,Math.round(x*f))); return '#'+[n>>16,n>>8&255,n&255].map(x=>m(x).toString(16).padStart(2,'0')).join(''); };
// simboli inventati sul berretto
const BADGE={
 stella:c=>`<path d="M50 26 L52 31 L57 31 L53 34 L55 39 L50 36 L45 39 L47 34 L43 31 L48 31Z" fill="${c}"/>`,
 fulmine:c=>`<path d="M52 25 L45 33 L50 33 L47 40 L55 31 L50 31Z" fill="${c}"/>`,
 ala:c=>`<path d="M43 37 Q47 27 57 27 Q53 30 55 31 Q50 32 51 34 Q47 34 43 37Z" fill="${c}"/>`,
 goccia:c=>`<path d="M50 25 Q55 32 55 35 Q55 39 50 39 Q45 39 45 35 Q45 32 50 25Z" fill="${c}"/>`,
 foglia:c=>`<path d="M44 39 Q44 28 56 26 Q57 37 44 39Z" fill="${c}"/>`,
 luna:c=>`<path d="M53 26 A7 7 0 1 0 53 39 A5.5 5.5 0 1 1 53 26Z" fill="${c}"/>`,
};
// a sfondo, s pelle, h capelli, hs pettinatura, hat copricapo, hc suo colore, b simbolo, e occhi, j giacca, t maglia, st tracolla, f ciglia, g occhiali
const ANIME=[
 {a:'#FDE3DC',s:0,h:'#2B2B3A',hs:'punte',hat:'cap',hc:'#E3350D',b:'stella',e:'#3A6FD8',j:'#2A75BB',t:'#fff',st:'#FFCB05',n:'Esploratore'},
 {a:'#FFF1CC',s:1,h:'#C2632A',hs:'lunghi',hat:'cap',hc:'#fff',b:'ala',e:'#2E8B3E',j:'#E3350D',t:'#1F2A44',st:'#1F2A44',f:1,n:'Viaggiatrice'},
 {a:'#DDEBFA',s:2,h:'#1F1F2E',hs:'ciuffo',hat:'band',hc:'#FFCB05',e:'#7A4A1E',j:'#F08030',t:'#2E8B3E',st:'#1F2A44',n:'Lottatore'},
 {a:'#EFE3FB',s:0,h:'#F2D27A',hs:'coda',hat:'none',e:'#8E3FD6',j:'#8E3FD6',t:'#fff',st:'#E86FA8',f:1,n:'Coordinatrice'},
 {a:'#E1F4E3',s:1,h:'#5B3A1E',hs:'liscio',hat:'capr',hc:'#2E8B3E',e:'#2E8B3E',j:'#3E5C3A',t:'#FFCB05',st:'#7A4A1E',n:'Ranger'},
 {a:'#FDE3EC',s:0,h:'#E86FA8',hs:'codini',hat:'beanie',hc:'#fff',e:'#E3350D',j:'#fff',t:'#E86FA8',st:'#2A75BB',f:1,n:'Idol'},
 {a:'#E7EEF2',s:3,h:'#1F1F2E',hs:'ricci',hat:'occhialoni',hc:'#7A4A1E',e:'#5B3A1E',j:'#1F2A44',t:'#E3350D',st:'#FFCB05',n:'Meccanico'},
 {a:'#DDEBFA',s:1,h:'#7EC8F0',hs:'lunghi',hat:'none',e:'#2A75BB',j:'#1F2A44',t:'#7EC8F0',st:'#fff',f:1,g:1,n:'Scienziata'},
 {a:'#FFF1CC',s:2,h:'#F5F5F5',hs:'punte',hat:'none',e:'#E3350D',j:'#C21F1F',t:'#1F1F2E',st:'#1F1F2E',n:'Rivale'},
 {a:'#E1F4E3',s:0,h:'#3B7A3A',hs:'coda',hat:'cap',hc:'#1F2A44',b:'foglia',e:'#E8B923',j:'#2E8B3E',t:'#fff',st:'#E3350D',f:1,n:'Campeggiatrice'},
 {a:'#EFE3FB',s:1,h:'#4B2A6E',hs:'liscio',hat:'none',e:'#8E3FD6',j:'#2B2B3A',t:'#8E3FD6',st:'#B8B8D0',g:1,n:'Medium'},
 {a:'#FDE3DC',s:3,h:'#C2410C',hs:'ciuffo',hat:'cap',hc:'#FFCB05',b:'fulmine',e:'#2A75BB',j:'#2A75BB',t:'#FFCB05',st:'#E3350D',n:'Fulmine'},
 {a:'#DDEBFA',s:2,h:'#1F1F2E',hs:'lunghi',hat:'beanie',hc:'#2A75BB',e:'#5B3A1E',j:'#7EC8F0',t:'#fff',st:'#1F2A44',f:1,n:'Sciatrice'},
 {a:'#E7EEF2',s:0,h:'#8C8C9A',hs:'liscio',hat:'cap',hc:'#2B2B3A',b:'luna',e:'#C21F1F',j:'#2B2B3A',t:'#C21F1F',st:'#8C8C9A',n:'Ombra'},
 {a:'#FFF1CC',s:1,h:'#E8B923',hs:'punte',hat:'band',hc:'#2A75BB',e:'#2A75BB',j:'#fff',t:'#2A75BB',st:'#E3350D',n:'Surfista'},
 {a:'#FDE3EC',s:2,h:'#5B3A1E',hs:'codini',hat:'cap',hc:'#E86FA8',b:'goccia',e:'#2A75BB',j:'#2A75BB',t:'#fff',st:'#FFCB05',f:1,n:'Nuotatrice'},
 {a:'#FDE3DC',s:0,h:'#1F1F2E',hs:'bob',hat:'basco',hc:'#C21F1F',e:'#2E8B3E',j:'#F2D27A',t:'#fff',st:'#7A4A1E',f:1,n:'Pittrice'},
 {a:'#DDEBFA',s:2,h:'#5B3A1E',hs:'corti',hat:'pescatore',hc:'#8BA05A',e:'#5B3A1E',j:'#E8B923',t:'#2A75BB',st:'#3E5C3A',n:'Pescatore'},
 {a:'#E1F4E3',s:1,h:'#7A4A1E',hs:'lunghi',hat:'bandana',hc:'#E3350D',e:'#7A4A1E',j:'#3E5C3A',t:'#F2D27A',st:'#C2632A',f:1,n:'Montanara'},
 {a:'#FFF1CC',s:3,h:'#F5F5F5',hs:'ciuffo',hat:'none',e:'#E8B923',j:'#1F2A44',t:'#FFCB05',st:'#FFCB05',sc:'#E3350D',n:'Campione'},
];
const FRONT={
 bob:'M29 54 Q26 28 50 26 Q74 28 71 54 L68 44 Q62 38 54 38 L50 33 L46 38 Q38 38 32 44 Z',
 corti:'M31 46 Q30 30 50 29 Q70 30 69 46 L66 40 L62 42 L59 37 L54 40 L50 36 L46 40 L41 37 L38 42 L34 40 Z',
 punte:'M29 50 L24 40 L31 40 L27 28 L37 32 L38 20 L47 28 L54 17 L58 29 L68 22 L67 33 L77 34 L71 42 L75 48 L68 46 L66 40 L60 45 L57 37 L51 44 L46 36 L41 44 L37 38 L33 46 Z',
 ciuffo:'M30 50 Q28 30 46 26 Q50 18 60 20 Q56 24 58 27 Q72 30 70 50 L66 40 L61 44 L58 36 L52 42 L47 34 L42 42 L38 37 L34 46 Z',
 liscio:'M30 52 Q28 28 50 26 Q72 28 70 52 L67 44 Q60 42 56 34 Q50 42 38 42 L34 48 Z',
 lunghi:'M30 54 Q28 28 50 26 Q72 28 70 54 L66 42 Q58 40 54 32 Q48 42 36 42 L33 50 Z',
 coda:'M31 50 Q29 28 50 26 Q71 28 69 50 L66 40 L60 43 L56 35 L50 41 L44 35 L38 42 L34 40 Z',
 codini:'M31 50 Q29 28 50 26 Q71 28 69 50 Q64 40 56 40 L52 34 L48 40 Q38 40 31 50Z',
 ricci:'M30 48 Q24 36 34 30 Q36 20 46 22 Q52 16 58 22 Q68 20 68 30 Q78 36 70 48 Q66 40 58 42 Q54 36 50 40 Q46 36 42 42 Q34 40 30 48Z'};
function animeSVG(o){
 const sk=SKIN2[o.s], sk2=shade(sk,.86), dk='#1F2A44', h=o.h, h2=shade(h,.72), hl=shade(h,1.3), j=o.j, j2=shade(j,.8);
 const W=o.hc==='#fff', hc=o.hc, hc2=hc&&(W?'#D9E2F2':shade(hc,.75));
 let back='', hat='';
 if(o.hs==='lunghi') back=`<path d="M30 44 Q22 70 24 92 L40 92 Q36 76 37 62 L63 62 Q64 76 60 92 L76 92 Q78 70 70 44 Z" fill="${h2}" stroke="${dk}" stroke-width="1.6"/>`;
 if(o.hs==='coda') back=`<path d="M64 34 Q86 34 84 58 Q82 74 74 82 Q76 66 70 54 Z" fill="${h2}" stroke="${dk}" stroke-width="1.6"/>`;
 if(o.hs==='codini') back=`<path d="M32 46 Q16 52 18 74 Q24 66 32 62Z M68 46 Q84 52 82 74 Q76 66 68 62Z" fill="${h2}" stroke="${dk}" stroke-width="1.6"/>`;
 if(o.hs==='bob') back=`<path d="M29 44 Q22 64 30 74 L40 72 Q35 62 36 52 L64 52 Q65 62 60 72 L70 74 Q78 64 71 44Z" fill="${h2}" stroke="${dk}" stroke-width="1.6"/>`;
 if(o.hs==='ricci') back=`<g fill="${h2}" stroke="${dk}" stroke-width="1.6"><circle cx="31" cy="42" r="9"/><circle cx="69" cy="42" r="9"/><circle cx="30" cy="54" r="7"/><circle cx="70" cy="54" r="7"/></g>`;
 const front=`<path d="${FRONT[o.hs]}" fill="${h}" stroke="${dk}" stroke-width="1.6" stroke-linejoin="round"/><path d="M40 31 Q48 27 58 29" fill="none" stroke="${hl}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;
 if(o.hat==='cap') hat=`<path d="M29 44 Q28 22 50 21 Q72 22 71 44 Q50 38 29 44Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/>
   <path d="M39 26 Q50 21 61 26 L59 40 Q50 38 41 40Z" fill="${W?'#E3350D':'#fff'}" stroke="${dk}" stroke-width="1"/>${BADGE[o.b]?BADGE[o.b](W?'#fff':hc):''}
   <path d="M27 44 Q50 36 73 44 Q74 50 64 49 Q50 45 36 49 Q26 50 27 44Z" fill="${hc2}" stroke="${dk}" stroke-width="1.8"/>`;
 if(o.hat==='capr') hat=`<path d="M29 42 Q28 22 50 21 Q72 22 71 42 Q50 37 29 42Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/><path d="M60 24 Q74 18 82 24 Q76 30 66 30Z" fill="${hc2}" stroke="${dk}" stroke-width="1.8"/><rect x="41" y="36" width="18" height="4" rx="2" fill="${hc2}"/>`;
 if(o.hat==='beanie') hat=`<path d="M29 44 Q27 18 50 18 Q73 18 71 44Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/><path d="M36 22 L36 42 M43 19 L43 42 M50 18 L50 42 M57 19 L57 42 M64 22 L64 42" stroke="${hc2}" stroke-width="1.4"/><rect x="27" y="39" width="46" height="8" rx="4" fill="${hc2}" stroke="${dk}" stroke-width="1.8"/><circle cx="50" cy="16" r="5" fill="${W?'#E86FA8':'#fff'}" stroke="${dk}" stroke-width="1.6"/>`;
 if(o.hat==='band') hat=`<path d="M30 40 Q50 32 70 40 L70 45 Q50 37 30 45Z" fill="${hc}" stroke="${dk}" stroke-width="1.5"/><path d="M69 41 Q78 40 84 32 Q82 42 76 46 Q80 48 84 52 Q76 50 69 45Z" fill="${hc}" stroke="${dk}" stroke-width="1.5"/>`;
 if(o.hat==='occhialoni') hat=`<path d="M29 40 Q50 33 71 40" fill="none" stroke="${hc}" stroke-width="4"/><g stroke="${dk}" stroke-width="1.8"><rect x="35" y="31" width="13" height="10" rx="4" fill="#FFCB05"/><rect x="52" y="31" width="13" height="10" rx="4" fill="#FFCB05"/></g><path d="M38 34 l4 0 M55 34 l4 0" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
 if(o.hat==='basco') hat=`<path d="M27 42 Q24 24 48 21 Q76 20 74 38 Q52 34 27 42Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/><path d="M30 40 Q50 34 72 37" fill="none" stroke="${hc2}" stroke-width="2"/><path d="M50 21 l2 -4" stroke="${dk}" stroke-width="2.4" stroke-linecap="round"/>`;
 if(o.hat==='pescatore') hat=`<path d="M33 40 Q32 21 50 21 Q68 21 67 40Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/><rect x="33" y="33" width="34" height="5" fill="${hc2}"/><path d="M20 44 Q50 32 80 44 Q82 49 74 48 Q50 40 26 48 Q18 49 20 44Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/><path d="M60 30 l6 -8 l2 2 Z" fill="#E3350D" stroke="${dk}" stroke-width="1"/>`;
 if(o.hat==='bandana') hat=`<path d="M29 44 Q27 22 50 22 Q73 22 71 44 Q50 36 29 44Z" fill="${hc}" stroke="${dk}" stroke-width="1.8"/><g fill="#fff"><circle cx="40" cy="30" r="1.6"/><circle cx="50" cy="27" r="1.6"/><circle cx="60" cy="30" r="1.6"/><circle cx="45" cy="36" r="1.6"/><circle cx="56" cy="36" r="1.6"/></g><path d="M70 40 Q80 44 82 54 Q76 50 72 50 Q76 56 74 60 Q68 52 68 44Z" fill="${hc}" stroke="${dk}" stroke-width="1.5"/>`;
 const eye=(x,fl)=>`<path d="M${x-5} 53 Q${x} 48 ${x+5} 53" fill="none" stroke="${dk}" stroke-width="${o.f?2.6:2}" stroke-linecap="round"/>
  <ellipse cx="${x}" cy="57" rx="3.9" ry="5" fill="#fff" stroke="${dk}" stroke-width=".8"/><ellipse cx="${x}" cy="57.6" rx="3.1" ry="4.3" fill="${o.e}"/><ellipse cx="${x}" cy="58.2" rx="1.6" ry="2.3" fill="${dk}"/>
  <circle cx="${x+(fl?-1.2:1.2)}" cy="55.4" r="1.3" fill="#fff"/><circle cx="${x+(fl?1:-1)}" cy="59.8" r=".6" fill="#fff"/>${o.f?`<path d="M${fl?x-5:x+5} 53 l${fl?-2:2} -1.6" stroke="${dk}" stroke-width="1.6" stroke-linecap="round"/>`:''}`;
 const brows=`<path d="M37 46 Q41 43.6 45 45.6 M55 45.6 Q59 43.6 63 46" fill="none" stroke="${h2}" stroke-width="${o.f?1.3:1.7}" stroke-linecap="round"/>`;
 const glasses=o.g?`<g fill="none" stroke="${dk}" stroke-width="1.6"><rect x="35" y="51" width="12" height="11" rx="3" fill="#fff" fill-opacity=".25"/><rect x="53" y="51" width="12" height="11" rx="3" fill="#fff" fill-opacity=".25"/><path d="M47 55 h6"/></g>`:'';
 const body=`<path d="M10 100 Q12 82 32 77 L68 77 Q88 82 90 100Z" fill="${j}" stroke="${dk}" stroke-width="2"/>
  <path d="M41 77 L50 92 L59 77Z" fill="${o.t}" stroke="${dk}" stroke-width="1.5"/>
  <path d="M33 76 L41 77 L46 88 L38 84Z M67 76 L59 77 L54 88 L62 84Z" fill="${j2}" stroke="${dk}" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M18 100 Q20 88 26 84 M82 100 Q80 88 74 84" fill="none" stroke="${j2}" stroke-width="2"/>
  <path d="M30 79 L70 100 L62 100 L26 82Z" fill="${o.st}" stroke="${dk}" stroke-width="1.5"/><rect x="47" y="88" width="7" height="5" rx="1.5" fill="#D9E2F2" stroke="${dk}" stroke-width="1.2" transform="rotate(28 50 90)"/>`;
 const scarf=o.sc?`<path d="M36 74 Q50 84 64 74 L66 80 Q50 90 34 80Z" fill="${o.sc}" stroke="${dk}" stroke-width="1.6"/><path d="M58 82 L64 100 L72 100 L64 80Z" fill="${shade(o.sc,.8)}" stroke="${dk}" stroke-width="1.5"/>`:'';
 return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="${o.a}"/>
  <path d="M-10 70 L70 -10 L90 -10 L10 70Z M30 110 L110 30 L110 50 L50 110Z" fill="#fff" opacity=".45"/>
  ${back}${body}
  <path d="M44 66 L44 79 Q50 82 56 79 L56 66Z" fill="${sk2}" stroke="${dk}" stroke-width="1.5"/>
  <ellipse cx="31" cy="58" rx="3.2" ry="4.5" fill="${sk}" stroke="${dk}" stroke-width="1.4"/><ellipse cx="69" cy="58" rx="3.2" ry="4.5" fill="${sk}" stroke="${dk}" stroke-width="1.4"/>
  <path d="M31 46 Q30 66 41 72 Q50 77 59 72 Q70 66 69 46 Q69 30 50 30 Q31 30 31 46Z" fill="${sk}" stroke="${dk}" stroke-width="1.8"/>${scarf}
  ${brows}${eye(41,false)}${eye(59,true)}${glasses}
  <path d="M50 62 l-1 3 h2" fill="none" stroke="${sk2}" stroke-width="1.2" stroke-linecap="round"/>
  <ellipse cx="37" cy="65" rx="3.4" ry="1.8" fill="#F28B82" opacity=".45"/><ellipse cx="63" cy="65" rx="3.4" ry="1.8" fill="#F28B82" opacity=".45"/>
  <path d="M46 68 Q50 71.5 54 68" fill="${o.f?'#fff':'none'}" stroke="${dk}" stroke-width="1.6" stroke-linecap="round"/>
  ${front}${hat}</svg>`;
}
// simboli dei tipi, disegnati da zero (non sono le icone ufficiali)
const EMB=[
 ['Fuoco','#F08030','<path d="M50 18 Q64 38 60 50 Q70 44 70 34 Q82 54 72 70 Q62 84 50 84 Q34 84 28 70 Q22 54 36 40 Q38 52 44 54 Q38 34 50 18Z" fill="#FFCB05" stroke="#1F2A44" stroke-width="3"/><path d="M50 52 Q60 62 56 72 Q52 78 46 76 Q40 72 44 64 Q46 60 50 52Z" fill="#fff"/>'],
 ['Acqua','#6890F0','<path d="M50 16 Q74 46 74 62 Q74 84 50 84 Q26 84 26 62 Q26 46 50 16Z" fill="#DDEBFA" stroke="#1F2A44" stroke-width="3"/><path d="M38 62 Q38 74 48 76" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'],
 ['Erba','#78C850','<path d="M24 76 Q24 30 76 22 Q80 70 34 78Z" fill="#C8F0A8" stroke="#1F2A44" stroke-width="3"/><path d="M30 72 Q48 52 66 32" fill="none" stroke="#1F2A44" stroke-width="3" stroke-linecap="round"/>'],
 ['Elettro','#F8D030','<path d="M56 14 L28 56 L48 56 L40 86 L72 40 L52 40 Z" fill="#fff" stroke="#1F2A44" stroke-width="3" stroke-linejoin="round"/>'],
 ['Ghiaccio','#98D8D8','<g stroke="#fff" stroke-width="6" stroke-linecap="round"><path d="M50 18V82M22 34L78 66M22 66L78 34"/></g><g stroke="#1F2A44" stroke-width="2" stroke-linecap="round" fill="none"><path d="M42 24L50 30L58 24M42 76L50 70L58 76"/></g>'],
 ['Psico','#F85888','<circle cx="50" cy="50" r="28" fill="#FDE3EC" stroke="#1F2A44" stroke-width="3"/><path d="M50 50 m0 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -20 0 a16 16 0 1 1 32 0" fill="none" stroke="#F85888" stroke-width="4" stroke-linecap="round"/>'],
 ['Buio','#705848','<circle cx="50" cy="50" r="28" fill="#FFF1CC" stroke="#1F2A44" stroke-width="3"/><circle cx="62" cy="42" r="24" fill="#705848"/>'],
 ['Drago','#7038F8','<path d="M20 70 Q30 30 60 24 Q52 36 58 42 Q72 34 82 40 Q70 46 70 58 Q66 74 44 78 Q30 80 20 70Z" fill="#E4D8FF" stroke="#1F2A44" stroke-width="3"/><circle cx="62" cy="48" r="3.5" fill="#1F2A44"/>'],
 ['Folletto','#EE99AC','<path d="M50 18 L58 42 L82 42 L62 56 L70 80 L50 66 L30 80 L38 56 L18 42 L42 42Z" fill="#fff" stroke="#1F2A44" stroke-width="3" stroke-linejoin="round"/>'],
 ['Spettro','#705898','<path d="M28 84 L28 48 Q28 22 50 22 Q72 22 72 48 L72 84 L64 76 L57 84 L50 76 L43 84 L36 76Z" fill="#EDE4FA" stroke="#1F2A44" stroke-width="3" stroke-linejoin="round"/><ellipse cx="42" cy="48" rx="4" ry="6" fill="#1F2A44"/><ellipse cx="58" cy="48" rx="4" ry="6" fill="#1F2A44"/>'],
 ['Lotta','#C03028','<rect x="28" y="34" width="44" height="40" rx="12" fill="#FDE3DC" stroke="#1F2A44" stroke-width="3"/><path d="M39 34v14M50 34v14M61 34v14" stroke="#1F2A44" stroke-width="3"/><path d="M28 56 Q20 50 26 42" fill="none" stroke="#1F2A44" stroke-width="3"/>'],
 ['Acciaio','#B8B8D0','<circle cx="50" cy="50" r="26" fill="#fff" stroke="#1F2A44" stroke-width="3" stroke-dasharray="10 5"/><circle cx="50" cy="50" r="10" fill="#B8B8D0" stroke="#1F2A44" stroke-width="3"/>'],
];
const embSVG=(e)=>`<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="${e[1]}"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="6"/>${e[2]}</svg>`;

// ---------- elenco e funzioni pubbliche ----------
const EN={Esploratore:'Explorer',Viaggiatrice:'Traveler',Lottatore:'Brawler',Coordinatrice:'Coordinator',Ranger:'Ranger',Idol:'Idol',Meccanico:'Mechanic',Scienziata:'Scientist',Rivale:'Rival',Campeggiatrice:'Camper',Medium:'Medium',Fulmine:'Bolt',Sciatrice:'Skier',Ombra:'Shadow',Surfista:'Surfer',Nuotatrice:'Swimmer',Pittrice:'Painter',Pescatore:'Fisher',Montanara:'Mountaineer',Campione:'Champion',
  Fuoco:'Fire',Acqua:'Water',Erba:'Grass',Elettro:'Electric',Ghiaccio:'Ice',Psico:'Psychic',Buio:'Dark',Drago:'Dragon',Folletto:'Fairy',Spettro:'Ghost',Lotta:'Fighting',Acciaio:'Steel'};
const LIST=[], BY={};
ANIME.forEach((o,i)=>{ const id='a'+String(i+1).padStart(2,'0'); LIST.push(id); BY[id]={n:o.n,draw:()=>animeSVG(o)}; });
EMB.forEach((e,i)=>{ const id='t'+String(i+1).padStart(2,'0'); LIST.push(id); BY[id]={n:e[0],draw:()=>embSVG(e)}; });
const cache={};
// stile di base (cerchio con bordo come i riquadri del gioco); chi lo usa può cambiarlo con le sue regole CSS
if(typeof document!=='undefined'&&!document.getElementById('avatar-css')){ const st=document.createElement('style'); st.id='avatar-css';
  st.textContent='.avatar{display:inline-block;flex:none;width:56px;height:56px;border-radius:50%;overflow:hidden;border:3px solid #2B3A63;background:#fff;line-height:0;vertical-align:middle}.avatar svg{display:block;width:100%;height:100%}';
  (document.head||document.documentElement).appendChild(st); }
const valid=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(BY,id);
const fix=id=>valid(id)?id:'a01';
return {
  ids:LIST.slice(),                                   // tutti gli id, nell'ordine di scelta
  trainers:LIST.filter(x=>x[0]==='a'), types:LIST.filter(x=>x[0]==='t'),
  def:'a01',
  valid, fix,                                         // fix: id sicuro (sconosciuto → a01)
  name:(id,lang)=>{ const n=BY[fix(id)].n; return lang==='en'?(EN[n]||n):n; },
  svg:id=>{ id=fix(id); return cache[id]||(cache[id]=BY[id].draw()); },
  // <span class="avatar CLS" role="img" aria-label="nome">svg</span>; il testo viene solo da questo file (sicuro)
  html:(id,cls,lang)=>{ id=fix(id); const n=lang==='en'?(EN[BY[id].n]||BY[id].n):BY[id].n; return '<span class="avatar'+(cls?' '+String(cls).replace(/[^\w -]/g,''):'')+'" role="img" aria-label="'+n+'">'+(cache[id]||(cache[id]=BY[id].draw()))+'</span>'; },
  random:(only)=>{ const l=only==='trainers'?LIST.filter(x=>x[0]==='a'):LIST; return l[Math.random()*l.length|0]; }
};
})();
if(typeof module!=="undefined") module.exports=Avatar;
