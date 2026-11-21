// Pokémon Incanto: scarica da PokéAPI l'elenco dei Pokémon per le aste.
// Uso (serve Node.js 18 o più recente):  node scarica-pokemon.js
// Produce: pokemon.json, pokemon-data.js, riepilogo.txt
// I dati scaricati vengono salvati in "cache/": se interrompi, rilancia e riparte da dove era.

const fs = require('fs');
const path = require('path');

const API = 'https://pokeapi.co/api/v2';
const DIR = __dirname;
const CACHE_DIR = path.join(DIR, 'cache');
const CONCORRENZA = 6; // richieste in parallelo: tenute basse per rispettare la fair use di PokéAPI
const REGIONI = ['alola', 'galar', 'hisui', 'paldea'];
const PAROLE_ESCLUSE = new Set(['mega', 'gmax', 'totem', 'cap', 'zen', 'primal', 'starter', 'cosplay']);
const GEN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };

const toId = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const maiuscola = t => t.charAt(0).toUpperCase() + t.slice(1);

function leggiConfig(nome, predefinito) {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, nome), 'utf8')); }
  catch (e) { console.warn('Attenzione: non riesco a leggere ' + nome + ' (' + e.message + '), uso i valori predefiniti.'); return predefinito; }
}

// Scarica un JSON (con cache su disco e nuovi tentativi). "riduci" tiene solo i campi che servono.
async function getJson(url, riduci) {
  const file = path.join(CACHE_DIR, url.replace(API + '/', '').replace(/[^a-z0-9]+/gi, '_') + '.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  let ultimo;
  for (let t = 1; t <= 4; t++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status + ' per ' + url);
      let j = await r.json();
      if (riduci) j = riduci(j);
      fs.writeFileSync(file, JSON.stringify(j));
      return j;
    } catch (e) { ultimo = e; await new Promise(res => setTimeout(res, 500 * t * t)); }
  }
  throw ultimo;
}

async function inParallelo(voci, n, fn, etichetta) {
  let i = 0, fatti = 0;
  const out = new Array(voci.length);
  await Promise.all(Array.from({ length: Math.min(n, voci.length) }, async () => {
    for (;;) {
      const k = i++;
      if (k >= voci.length) return;
      out[k] = await fn(voci[k], k);
      if (++fatti % 100 === 0) console.log('  ' + etichetta + ': ' + fatti + '/' + voci.length);
    }
  }));
  return out;
}

const riduciSpecie = j => ({
  id: j.id, name: j.name, color: j.color && j.color.name,
  evolution_chain: j.evolution_chain, is_legendary: j.is_legendary, is_mythical: j.is_mythical, is_baby: j.is_baby,
  generation: j.generation && j.generation.name,
  nomeEn: ((j.names || []).find(n => n.language.name === 'en') || {}).name,
  varieties: (j.varieties || []).map(v => ({ is_default: v.is_default, name: v.pokemon.name }))
});
const riduciPokemon = j => ({ name: j.name, types: j.types.slice().sort((a, b) => a.slot - b.slot).map(t => t.type.name) });

function segnaCatena(nodo, mappa) {
  mappa.set(nodo.species.name, nodo.evolves_to.length === 0);
  nodo.evolves_to.forEach(n => segnaCatena(n, mappa));
}

// Nome per Pokémon Showdown: se il nome inglese si normalizza come lo slug lo uso, altrimenti derivo dallo slug.
function nomeShowdown(slug, nomeEn) {
  if (nomeEn && toId(nomeEn) === slug.replace(/-/g, '')) return nomeEn;
  return slug.split('-').map(maiuscola).join('-');
}

async function main() {
  if (typeof fetch !== 'function') { console.error('Serve Node.js 18 o più recente (controlla con: node --version).'); process.exit(1); }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const eccezioni = new Set((leggiConfig('eccezioni.json', { specie: [] }).specie || []).map(s => s.toLowerCase().trim()));
  const correzioni = leggiConfig('correzioni.json', {});

  console.log('1/4 Elenco delle specie...');
  const lista = await getJson(API + '/pokemon-species?limit=3000', j => ({ results: j.results.map(r => ({ name: r.name, url: r.url })) }));
  console.log('    ' + lista.results.length + ' specie trovate.');

  console.log('2/4 Dati delle specie...');
  const specie = await inParallelo(lista.results, CONCORRENZA, r => getJson(r.url, riduciSpecie), 'specie');

  console.log('3/4 Catene evolutive...');
  const urlCatene = [...new Set(specie.filter(s => s.evolution_chain).map(s => s.evolution_chain.url))];
  const catene = await inParallelo(urlCatene, CONCORRENZA, u => getJson(u, j => ({ chain: j.chain })), 'catene');
  const finale = new Map();
  catene.forEach(c => segnaCatena(c.chain, finale));

  const nomiSpecie = new Set(specie.map(s => s.name));
  const eccezioniSconosciute = [...eccezioni].filter(e => !nomiSpecie.has(e));

  // Quali specie e quali forme entrano nel pool
  const daCreare = [];
  for (const s of specie) {
    const èFinale = finale.has(s.name) ? finale.get(s.name) : true;
    const èEccezione = !èFinale && eccezioni.has(s.name);
    if (!èFinale && !èEccezione) continue;
    for (const v of s.varieties) {
      if (v.is_default) { daCreare.push({ s, v, regione: null, èFinale, èEccezione }); continue; }
      const token = v.name.split('-');
      const regione = REGIONI.find(r => token.includes(r));
      if (!regione || token.some(t => PAROLE_ESCLUSE.has(t)) || !v.name.startsWith(s.name + '-')) continue;
      daCreare.push({ s, v, regione, èFinale, èEccezione });
    }
  }

  console.log('4/4 Tipi di ' + daCreare.length + ' Pokémon...');
  const dettagli = await inParallelo(daCreare, CONCORRENZA, d => getJson(API + '/pokemon/' + d.v.name, riduciPokemon), 'Pokémon');

  // Tier National Dex di Showdown (per i formati OU/UU/RU). Il file è codice TypeScript: lo leggo solo come testo,
  // cercando i blocchi "id: { tier: "...", natDexTier: "..." }", senza eseguirlo.
  console.log('    Tier di Pokémon Showdown...');
  let tiers = {};
  try {
    const r = await fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/formats-data.ts');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const testo = await r.text();
    for (const m of testo.matchAll(/^\t([a-z0-9]+): \{([^}]*)\}/gm)) {
      const o = {}; for (const k of m[2].matchAll(/(\w+): "([^"]*)"/g)) o[k[1]] = k[2];
      tiers[m[1]] = o;
    }
  } catch (e) { console.warn('Attenzione: tier non scaricati (' + e.message + '): tutti i Pokémon avranno tier "?"'); }
  // Roster di Pokémon Champions (mod "champions" di Showdown), stesso metodo: solo lettura del testo.
  // Esclusi i Pokémon vietati nei formati Champions di Showdown (Uber/AG in OU, DUber nel doppio).
  let champions = null;
  try {
    const r = await fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/formats-data.ts');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    champions = {};
    for (const m of (await r.text()).matchAll(/^\t([a-z0-9]+): \{([^}]*)\}/gm)) {
      const o = {}; for (const k of m[2].matchAll(/(\w+): "([^"]*)"/g)) o[k[1]] = k[2];
      champions[m[1]] = o;
    }
  } catch (e) { console.warn('Attenzione: roster di Pokémon Champions non scaricato (' + e.message + ')'); }
  const inChampions = name => { const c = champions && champions[toId(name)];
    return !!c && !c.isNonstandard && !['Uber', 'AG'].includes(c.tier) && c.doublesTier !== 'DUber'; };
  const tierDi = name => { const t = tiers[toId(name)]; if (!t) return '?'; return t.natDexTier || (t.tier === 'NFE' || t.tier === 'LC' ? t.tier : null) || 'NFE'; };

  const pool = daCreare.map((d, k) => {
    const s = d.s, basePd = nomeShowdown(s.name, s.nomeEn);
    let name = basePd, display = s.nomeEn || basePd;
    if (d.regione) {
      const suff = d.v.name.slice(s.name.length + 1).split('-').filter(t => t !== 'standard' && t !== 'breed');
      name = basePd + '-' + suff.map(maiuscola).join('-');
      display = (s.nomeEn || basePd) + ' ' + suff.map(maiuscola).join(' ');
    }
    const e = {
      id: d.v.name, dex: s.id, name, display, form: d.regione ? maiuscola(d.regione) : null,
      types: dettagli[k].types, color: s.color, gen: GEN[(s.generation || '').replace('generation-', '')] || null,
      legendary: !!s.is_legendary, mythical: !!s.is_mythical, baby: !!s.is_baby, exception: d.èEccezione
    };
    e.tier = tierDi(name);
    e.champions = inChampions(name);
    return Object.assign(e, correzioni[name] || {});
  }).sort((a, b) => a.dex - b.dex || a.name.localeCompare(b.name));

  fs.writeFileSync(path.join(DIR, 'pokemon.json'), JSON.stringify(pool, null, 1));
  fs.writeFileSync(path.join(DIR, 'pokemon-data.js'), '// Generato da scarica-pokemon.js\nconst POKEMON_DATA = ' + JSON.stringify(pool) + ';\n');

  const forme = pool.filter(p => p.form), ecc = pool.filter(p => p.exception);
  const righe = [
    'RIEPILOGO',
    'Pokémon nel pool: ' + pool.length + ' (di cui ' + forme.length + ' forme regionali e ' + ecc.length + ' eccezioni non completamente evolute)',
    'Leggendari: ' + pool.filter(p => p.legendary).length + ' · Misteriosi: ' + pool.filter(p => p.mythical).length,
    'Pokémon Champions: ' + pool.filter(p => p.champions).length + ' (esclusi quelli vietati nei formati Champions)',
    'Tier National Dex: ' + Object.entries(pool.reduce((a, p) => (a[p.tier] = (a[p.tier] || 0) + 1, a), {})).map(([k, v]) => k + ' ' + v).join(' · '),
    '', 'ECCEZIONI INCLUSE', ecc.map(p => '  ' + p.display + ' (' + p.types.join('/') + ')').join('\n') || '  nessuna',
    eccezioniSconosciute.length ? '\nATTENZIONE: in eccezioni.json ci sono nomi non riconosciuti: ' + eccezioniSconosciute.join(', ') : '',
    '', 'FORME REGIONALI (PokéAPI dà il colore della specie base: le correzioni sono in correzioni.json)',
    forme.map(p => '  ' + p.display + ' - ' + p.types.join('/') + ' - colore ' + p.color).join('\n') || '  nessuna',
    '', 'MANCANO DATI', pool.filter(p => !p.color || !p.types.length).map(p => '  ' + p.name).join('\n') || '  nessuno'
  ];
  fs.writeFileSync(path.join(DIR, 'riepilogo.txt'), righe.join('\n') + '\n');
  console.log('\nFatto: ' + pool.length + ' Pokémon. File creati: pokemon.json, pokemon-data.js, riepilogo.txt');
}

if (require.main === module) main().catch(e => { console.error('\nErrore: ' + e.message + '\nRilancia lo script: riparte da dove si era fermato.'); process.exit(1); });
module.exports = { main };
