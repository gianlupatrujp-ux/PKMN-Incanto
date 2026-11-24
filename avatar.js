// Avatar del profilo di Pokémon Incanto (usato dal profilo, dalla lotta e dalla Torre).
// Allenatori: immagini degli allenatori dei giochi Pokémon prese da Pokémon Showdown (scarica-allenatori.js →
// sprites/trainers/<id>.png, 80x80), © Nintendo / Creatures Inc. / GAME FREAK inc. / The Pokémon Company, uso amatoriale
// e non commerciale, rimosse su richiesta. Simboli dei tipi: disegni originali in SVG.
// Uso: Avatar.html(id,cls,lang) → <span class="avatar">…</span>; Avatar.valid(id); Avatar.fix(id); Avatar.name(id,lang);
// Avatar.gender(id); Avatar.random('trainers','f'|'m'); Avatar.groups. Gli id sono i nomi dei file (es. 'red', 'cynthia')
// e t01…t12 per i simboli; un id sconosciuto (anche quelli vecchi a01…a20) diventa Avatar.def.
const Avatar=(()=>{
const DIR='sprites/trainers/';
// gruppi: chiave, nome IT, nome EN, id. Genere: in F le ragazze, tutti gli altri ragazzi.
const GROUPS=[
 ['prot','Protagonisti','Protagonists',['red','green','ethan','lyra','kris','brendan','may','lucas','dawn','hilbert','hilda','nate','rosa','calem','serena','elio','selene','victor','gloria','florian-s','juliana-s','akari','rei']],
 ['anime','Anime','Anime',['ash','ash-kalos','ash-alola','serena-anime','cynthia-anime','liko','roy']],
 ['rival','Rivali e amici','Rivals and friends',['blue','silver','barry','n','hugh','shauna','hau','gladion','lillie','hop','marnie','bede','nemona-v','arven-v','penny','kieran']],
 ['champ','Campioni e capipalestra','Champions and Gym Leaders',['cynthia','steven','lance','wallace','diantha','leon','iris','alder','geeta','iono','raihan','misty','brock','elesa','skyla','korrina','nessa','kukui','sycamore','giovanni','guzma','plumeria','volo']],
 ['class','Allenatori comuni','Trainer classes',['acetrainer','acetrainerf','hiker','fisherman','swimmerf','blackbelt','battlegirl','scientist','psychicf','pokemonranger','pokemonrangerf','backpacker','idol','kimonogirl','furisodegirl-pink','punkguy','punkgirl']],
];
const F=new Set(['green','lyra','kris','may','dawn','hilda','rosa','serena','selene','gloria','juliana-s','akari','serena-anime','cynthia-anime','liko','shauna','lillie','marnie','nemona-v','penny','cynthia','diantha','iris','geeta','iono','misty','elesa','skyla','korrina','nessa','plumeria','acetrainerf','swimmerf','battlegirl','psychicf','pokemonrangerf','idol','kimonogirl','furisodegirl-pink','punkgirl']);
// nomi propri come nei giochi in inglese; le classi di allenatori tradotte
const NAME={n:'N','florian-s':'Florian','juliana-s':'Juliana','nemona-v':'Nemona','arven-v':'Arven','ash-kalos':'Ash (Kalos)','ash-alola':'Ash (Alola)',
 'serena-anime':'Serena (anime)','cynthia-anime':'Cynthia (anime)'};
const CLASS={acetrainer:['Fantallenatore','Ace Trainer'],acetrainerf:['Fantallenatrice','Ace Trainer'],hiker:['Montanaro','Hiker'],fisherman:['Pescatore','Fisherman'],
 swimmerf:['Nuotatrice','Swimmer'],blackbelt:['Karateka','Black Belt'],battlegirl:['Lottatrice','Battle Girl'],scientist:['Scienziato','Scientist'],psychicf:['Sensitiva','Psychic'],
 pokemonranger:['Pokémon Ranger','Pokémon Ranger'],pokemonrangerf:['Pokémon Ranger','Pokémon Ranger'],backpacker:['Escursionista','Backpacker'],idol:['Idol','Idol'],
 kimonogirl:['Ragazza in kimono','Kimono Girl'],'furisodegirl-pink':['Ragazza in furisode','Furisode Girl'],punkguy:['Punk','Punk Guy'],punkgirl:['Punk','Punk Girl']};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
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
const EN={Fuoco:'Fire',Acqua:'Water',Erba:'Grass',Elettro:'Electric',Ghiaccio:'Ice',Psico:'Psychic',Buio:'Dark',Drago:'Dragon',Folletto:'Fairy',Spettro:'Ghost',Lotta:'Fighting',Acciaio:'Steel'};
const BY={}, TRAINERS=[], TYPES=[];
for(const [,,,ids] of GROUPS) for(const id of ids){ TRAINERS.push(id); const c=CLASS[id], n=NAME[id]||cap(id); BY[id]={it:c?c[0]:n,en:c?c[1]:n,g:F.has(id)?'f':'m',img:true}; }
EMB.forEach((e,i)=>{ const id='t'+String(i+1).padStart(2,'0'); TYPES.push(id); BY[id]={it:e[0],en:EN[e[0]]||e[0],g:null,svg:embSVG(e)}; });
// stile di base: riquadro con angoli arrotondati, l'allenatore intero appoggiato in basso (niente cerchio che taglia)
if(typeof document!=='undefined'&&document&&!document.getElementById('avatar-css')){ const st=document.createElement('style'); st.id='avatar-css';
  st.textContent='.avatar{display:inline-flex;align-items:flex-end;justify-content:center;flex:none;width:64px;height:64px;border:3px solid #2B3A63;border-radius:12px;overflow:hidden;background:linear-gradient(#EAF2FC,#fff 70%);line-height:0;vertical-align:middle;position:relative}'
   +'.avatar img{width:100%;height:100%;object-fit:contain;object-position:50% 100%;image-rendering:pixelated;display:block;position:relative;z-index:1}'
   +'.avatar.img::after{content:"";position:absolute;left:14%;right:14%;bottom:4%;height:8%;border-radius:50%;background:rgba(31,42,68,.12)}'
   +'.avatar svg{display:block;width:100%;height:100%}';
  (document.head||document.documentElement).appendChild(st); }
const has=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(BY,id);
const DEF='red';
const fix=id=>has(id)?id:DEF;
return {
  ids:TRAINERS.concat(TYPES), trainers:TRAINERS.slice(), types:TYPES.slice(), def:DEF,
  // gruppi per la scelta: [{key, it, en, ids}], ultimo i simboli dei tipi
  groups:GROUPS.map(([key,it,en,ids])=>({key,it,en,ids:ids.slice()})).concat([{key:'types',it:'Simboli dei tipi',en:'Type symbols',ids:TYPES.slice()}]),
  valid:has, fix,
  name:(id,lang)=>{ const o=BY[fix(id)]; return lang==='en'?o.en:o.it; },
  gender:id=>BY[fix(id)].g,                            // 'f' / 'm' per gli allenatori, null per i simboli
  src:id=>{ id=fix(id); return BY[id].img?DIR+id+'.png':null; },
  // <span class="avatar img CLS" role="img" aria-label="nome">…</span>: id e testi vengono solo da questo file (sicuro)
  html:(id,cls,lang)=>{ id=fix(id); const o=BY[id], c=cls?' '+String(cls).replace(/[^\w -]/g,''):'';
    return '<span class="avatar'+(o.img?' img':'')+c+'" role="img" aria-label="'+(lang==='en'?o.en:o.it)+'">'+(o.img?'<img src="'+DIR+id+'.png" alt="" draggable="false">':o.svg)+'</span>'; },
  // random('trainers') solo allenatori; random('trainers','f'|'m') anche per genere
  random:(only,g)=>{ let l=only==='trainers'?TRAINERS:TRAINERS.concat(TYPES); if(g==='f'||g==='m') l=l.filter(x=>BY[x].g===g); return l[Math.random()*l.length|0]; }
};
})();
if(typeof module!=='undefined') module.exports=Avatar;
