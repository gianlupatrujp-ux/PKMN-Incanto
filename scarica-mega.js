// Pokémon Incanto: set con Megaevoluzione per il gruppo "Nat Dex OU (Mega)".
// Uso (Node.js 18+, dopo scarica-pokemon.js e scarica-set.js):  node scarica-mega.js
// Produce: mega-data.js (const MEGA_DATA), caricato dal gioco.
//
// Il formato [Gen 9] National Dex (OU) di Pokémon Showdown vieta la Teracristallizzazione e permette le Megaevoluzioni.
// Si prendono le Megaevoluzioni con tier National Dex OU o UUBL (da data/formats-data.ts) e, come base dei set,
// i set Random Battle di generazione 7 (data/random-battles/gen7/sets.json, licenza MIT, l'ultima generazione con le Mega
// nelle Random Battle). Mosse controllate con i learnset di Showdown; strumento = Megapietra; EV e natura da regole semplici
// sulle statistiche della Mega. Tutto letto come testo/JSON, senza eseguire codice scaricato.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const DIR = __dirname, CACHE_DIR = path.join(DIR, 'cache');
const SD = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/';
const toId = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

async function scarica(url, json) {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
  const file = path.join(CACHE_DIR, 'showdown_' + url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_'));
  let t;
  if (fs.existsSync(file)) t = fs.readFileSync(file, 'utf8');
  else { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status + ' per ' + url); t = await r.text(); fs.writeFileSync(file, t); }
  return json ? JSON.parse(t) : t;
}

// motore di Showdown già impacchettato nel gioco (lib/pkmn-sim.js): serve il Pokédex (statistiche, abilità, Megapietre)
function motore() { const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(DIR, 'lib/pkmn-sim.js'), 'utf8'), c); return c.PkmnSim; }

const SETUP = ['swordsdance', 'dragondance', 'calmmind', 'nastyplot', 'bulkup', 'quiverdance', 'shellsmash', 'coil', 'agility', 'honeclaws', 'curse'];
const CURA = ['roost', 'recover', 'synthesis', 'moonlight', 'morningsun', 'slackoff', 'softboiled', 'wish', 'rest', 'shoreup', 'strengthsap'];
const VIETATE = ['hiddenpower', 'return', 'frustration', 'batonpass', 'assist', 'lastrespects', 'shedtail'];

(async () => {
  const P = motore(), Dex = P.Dex;
  const fd = await scarica(SD + 'formats-data.ts');
  const sets7 = await scarica(SD + 'random-battles/gen7/sets.json', true);
  const learn = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'showdown_play_pokemonshowdown_com_data_learnsets_json'), 'utf8'));
  const vmData = {}; vm.createContext(vmData); vm.runInContext(fs.readFileSync(path.join(DIR, 'pokemon-data.js'), 'utf8').replace(/^const /m, 'var '), vmData);
  const nelGioco = new Set(vmData.POKEMON_DATA.map(p => p.name));

  // Mega con tier National Dex OU o UUBL
  const megaOk = [];
  for (const m of fd.matchAll(/\n\t(\w*mega\w*): \{([^}]*)\}/g)) {
    const t = (/natDexTier: "([^"]+)"/.exec(m[2]) || /tier: "([^"]+)"/.exec(m[2]) || [])[1];
    if (t === 'OU' || t === 'UUBL') megaOk.push(m[1]);
  }
  // mosse imparabili: learnset della specie e delle sue pre-evoluzioni
  const impara = (sp, mv) => { let s = Dex.species.get(sp); const seen = new Set();
    while (s && s.exists && !seen.has(s.id)) { seen.add(s.id); const l = learn[s.id] && learn[s.id].learnset; if (l && l[mv]) return true;
      const base = s.changesFrom || s.baseSpecies; if (base && toId(base) !== s.id) { s = Dex.species.get(base); continue; } s = s.prevo ? Dex.species.get(s.prevo) : null; }
    return false; };

  const out = {}, report = [];
  for (const id of megaOk) {
    const mega = Dex.species.get(id); if (!mega.exists) { report.push('manca nel motore: ' + id); continue; }
    const base = Dex.species.get(mega.baseSpecies);
    if (!nelGioco.has(base.name)) { report.push('base non nel gioco: ' + base.name); continue; }
    const stone = mega.requiredItem; if (!stone || !Dex.items.get(stone).exists) { report.push('pietra? ' + id); continue; }
    const src = sets7[id]; if (!src) { report.push('senza set gen7: ' + id); continue; }
    const fisico0 = mega.baseStats.atk >= mega.baseStats.spa, lento = mega.baseStats.spe < 75;
    for (const s of src.sets) {
      const pool = [...new Set(s.movepool)].filter(mv => { const d = Dex.moves.get(mv); return d.exists && !VIETATE.includes(d.id) && !['Unobtainable', 'LGPE', 'CAP', 'Future'].includes(d.isNonstandard) && impara(base.id, d.id); });
      if (pool.length < 4) { report.push('poche mosse ' + id + ' ' + s.role); continue; }
      let fisico = fisico0;
      // scelta delle 4 mosse: al massimo una di potenziamento e una di cura, poi attacchi di tipi diversi (prima lo STAB)
      const scelte = [], tipi = new Set(), D = mv => Dex.moves.get(mv);
      const prendi = mv => { if (!scelte.includes(mv) && scelte.length < 4) { scelte.push(mv); if (D(mv).category !== 'Status') tipi.add(D(mv).type); } };
      const set1 = pool.find(m => SETUP.includes(m)); if (set1) prendi(set1);
      const cura = pool.find(m => CURA.includes(m)); if (cura) prendi(cura);
      const att = pool.filter(m => D(m).category !== 'Status').sort((a, b) => (mega.types.includes(D(b).type) - mega.types.includes(D(a).type)) || (D(b).basePower - D(a).basePower));
      for (const m of att) if (!tipi.has(D(m).type)) prendi(m);
      for (const m of att) prendi(m);
      for (const m of pool) prendi(m);
      // EV e natura seguono gli attacchi scelti (es. Diancie-Mega ha Attacco = Att. Sp. ma usa attacchi speciali)
      const nF = scelte.filter(m => D(m).category === 'Physical').length, nS = scelte.filter(m => D(m).category === 'Special').length;
      if (nF !== nS) fisico = nF > nS;
      const atkStat = fisico ? 'Atk' : 'SpA';
      const evs = lento ? { HP: 252, [atkStat]: 252, SpD: 4 } : { HP: 4, [atkStat]: 252, Spe: 252 };
      const natura = lento ? (fisico ? 'Adamant' : 'Modest') : (fisico ? 'Jolly' : 'Timid');
      const abil = Object.values(base.abilities).find(a => !['Shadow Tag', 'Arena Trap', 'Moody'].includes(a));
      const set = { ruolo: 'Mega ' + (mega.forme.replace('Mega', '').replace('-', ' ').trim() || '') + ' · ' + s.role, strumento: stone, abilita: abil, evs, natura, mosse: scelte.map(m => D(m).name), mega: mega.name };
      set.ruolo = set.ruolo.replace(/ {2,}/g, ' ').replace('Mega  ·', 'Mega ·');
      (out[base.name] = out[base.name] || []);
      if (!out[base.name].some(x => x.mosse.join() === set.mosse.join() && x.strumento === set.strumento)) out[base.name].push(set);
    }
  }
  const head = '// Generato da scarica-mega.js: set con Megaevoluzione per il gruppo Nat Dex OU (Mega).\n// Fonte: Pokémon Showdown (licenza MIT), set Random Battle gen 7 e tier National Dex.\n';
  fs.writeFileSync(path.join(DIR, 'mega-data.js'), head + 'const MEGA_DATA = ' + JSON.stringify(out, null, 1) + ';\n');
  console.log('Pokémon con Mega:', Object.keys(out).length, '- set:', Object.values(out).reduce((a, b) => a + b.length, 0));
  for (const [k, v] of Object.entries(out)) console.log(' ', k, '→', v.map(s => s.strumento + ': ' + s.mosse.join(', ')).join(' | '));
  if (report.length) console.log('Note:\n ' + report.join('\n '));
})().catch(e => { console.error(e); process.exit(1); });
