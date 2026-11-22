// Pokémon Incanto: descrizioni ufficiali in italiano di mosse, abilità e strumenti usati nel gioco.
// Uso (Node.js 18+, dopo scarica-set.js e scarica-mega.js):  node scarica-descrizioni.js
// Produce: descrizioni-data.js (const DESC_IT = {m:{id:testo}, a:{...}, i:{...}}), caricato dalla lotta.
//
// Fonte: PokéAPI (pokeapi.co), testi "flavor text" in italiano dei giochi Pokémon (© Nintendo / Creatures / GAME FREAK /
// The Pokémon Company). Si prende la versione più recente disponibile in italiano. I nomi restano in inglese (quelli di
// Showdown); le descrizioni in inglese restano quelle di Showdown (licenza MIT). Usa la cartella cache/ per riprendere.
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = __dirname, CACHE = path.join(DIR, 'cache');
const API = 'https://pokeapi.co/api/v2/';
// dalla più recente alla più vecchia: si usa il primo testo italiano trovato
const VERSIONI = ['scarlet-violet', 'legends-arceus', 'brilliant-diamond-and-shining-pearl', 'sword-shield', 'lets-go-pikachu-lets-go-eevee', 'ultra-sun-ultra-moon', 'sun-moon', 'omega-ruby-alpha-sapphire', 'x-y', 'black-2-white-2', 'black-white'];

async function prendi(tipo, slug) {
  const f = path.join(CACHE, 'desc_' + tipo + '_' + slug + '.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  for (let t = 0; t < 3; t++) {
    try { const r = await fetch(API + tipo + '/' + slug); if (r.status === 404) { fs.writeFileSync(f, 'null'); return null; } if (!r.ok) throw new Error(r.status);
      const j = await r.json(); const keep = { flavor_text_entries: j.flavor_text_entries }; fs.writeFileSync(f, JSON.stringify(keep)); return keep; }
    catch (e) { await new Promise(r => setTimeout(r, 800 * (t + 1))); }
  }
  return null;
}
// nome Showdown → nome PokéAPI (es. "King's Shield" → kings-shield, "U-turn" → u-turn, "Will-O-Wisp" → will-o-wisp)
const slug = n => n.toLowerCase().replace(/[’']/g, '').replace(/[.:]/g, '').replace(/é/g, 'e').replace(/\s+/g, '-');
function testoIt(j) {
  if (!j || !j.flavor_text_entries) return null;
  const it = j.flavor_text_entries.filter(e => e.language && e.language.name === 'it');
  if (!it.length) return null;
  it.sort((a, b) => { const va = a.version_group ? VERSIONI.indexOf(a.version_group.name) : (a.version ? 99 : 98), vb = b.version_group ? VERSIONI.indexOf(b.version_group.name) : 98;
    return (va < 0 ? 50 : va) - (vb < 0 ? 50 : vb); });
  return String(it[0].flavor_text||it[0].text||"").replace(/[\n\f­]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/ - /g, '').trim();
}
(async () => {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);
  const c = {}; vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(DIR, 'lib/pkmn-sim.js'), 'utf8'), c);
  for (const f of ['pokemon-data.js', 'set-data.js', 'mega-data.js']) vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8').replace(/^const /m, 'var '), c);
  const D = c.PkmnSim.Dex, mv = new Map(), ab = new Map(), it = new Map();
  const addM = x => { const d = D.moves.get(x); if (d.exists) mv.set(d.id, d.name); }, addA = x => { const d = D.abilities.get(x); if (d.exists) ab.set(d.id, d.name); }, addI = x => { const d = D.items.get(x); if (d.exists) it.set(d.id, d.name); };
  const add = s => { if (!s) return; (s.mosse || []).forEach(addM); if (s.abilita) addA(s.abilita); if (s.strumento) addI(s.strumento); if (s.basso) { if (s.basso.abilita) addA(s.basso.abilita); if (s.basso.strumento) addI(s.basso.strumento); } };
  for (const v of Object.values(c.SET_DATA)) { for (const k of ['singolo', 'doppio']) (v[k] || []).forEach(add); if (v.champions) for (const k of ['singolo', 'doppio']) (v.champions[k] || []).forEach(add); }
  for (const v of Object.values(c.MEGA_DATA)) v.forEach(add);
  // abilità possibili di ogni Pokémon e delle sue forme di lotta (Mega, ecc.): si vedono nelle schede
  for (const p of c.POKEMON_DATA) { const s = D.species.get(p.name); if (!s.exists) continue; Object.values(s.abilities).forEach(addA); for (const f of s.otherFormes || []) { const fs2 = D.species.get(f); if (fs2.exists && fs2.baseSpecies === s.baseSpecies) Object.values(fs2.abilities).forEach(addA); } }
  ['struggle', 'terablast'].forEach(addM);
  const out = { m: {}, a: {}, i: {} }, manca = { m: [], a: [], i: [] };
  const lavora = async (mappa, tipo, chiave) => { const voci = [...mappa]; let k = 0;
    await Promise.all(Array.from({ length: 6 }, async () => { while (k < voci.length) { const [id, nome] = voci[k++]; const tx = testoIt(await prendi(tipo, slug(nome))); if (tx) out[chiave][id] = tx; else manca[chiave].push(nome); } })); };
  await lavora(mv, 'move', 'm'); await lavora(ab, 'ability', 'a'); await lavora(it, 'item', 'i');
  // testi scritti da noi (descrizioni-manuali.json) e Megapietre nuove con la stessa frase dei giochi
  const man = JSON.parse(fs.readFileSync(path.join(DIR, 'descrizioni-manuali.json'), 'utf8'));
  for (const k of ['m', 'a', 'i']) for (const [id, tx] of Object.entries(man[k] || {})) if (!out[k][id]) out[k][id] = tx;
  for (const [id] of it) { const x = D.items.get(id); if (!out.i[id] && x.megaStone) { const sp = Object.keys(x.megaStone)[0]; out.i[id] = 'Un esemplare delle misteriose Megapietre. Data a ' + sp + ', gli permette di megaevolversi durante la lotta.'; } }
  const head = '// Generato da scarica-descrizioni.js: descrizioni in italiano dai giochi Pokémon (© Nintendo / Creatures / GAME FREAK / The Pokémon Company), via PokéAPI.\n';
  fs.writeFileSync(path.join(DIR, 'descrizioni-data.js'), head + 'const DESC_IT = ' + JSON.stringify(out) + ';\n');
  console.log('Mosse ' + Object.keys(out.m).length + '/' + mv.size + ', abilità ' + Object.keys(out.a).length + '/' + ab.size + ', strumenti ' + Object.keys(out.i).length + '/' + it.size);
  for (const k of ['m', 'a', 'i']) if (manca[k].length) console.log('Senza testo italiano (' + k + '): ' + manca[k].join(', '));
})().catch(e => { console.error(e); process.exit(1); });
