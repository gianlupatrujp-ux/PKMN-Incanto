// Pokémon Incanto: genera i set per Pokémon Showdown (strumento, abilità, Tera, EV, natura, 4 mosse).
// Uso (serve Node.js 18+, e prima va lanciato scarica-pokemon.js):  node scarica-set.js
// Produce: set.json, set-data.js (const SET_DATA), riepilogo-set.txt
//
// Fonte: i set delle "Random Battle" nel codice di Pokémon Showdown (licenza MIT,
// https://github.com/smogon/pokemon-showdown, cartella data/random-battles). Quei set indicano ruolo,
// mosse possibili, abilità e Tera; strumento, EV, natura e la scelta delle 4 mosse li decide questo script
// con regole semplici. I Pokémon senza set in nessuna generazione stanno in set-manuali.json.

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const CACHE_DIR = path.join(DIR, 'cache');
const GH = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/random-battles/';
const PLAY = 'https://play.pokemonshowdown.com/data/';
// Ordine di preferenza: si usa la generazione più recente che ha il Pokémon.
const FONTI_SINGOLO = ['gen9/sets.json', 'gen8/sets.json', 'gen7/sets.json', 'gen6/sets.json', 'gen5/sets.json', 'gen4/sets.json'];
const FONTE_DOPPIO = 'gen9/doubles-sets.json';

const toId = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Come scarica(), ma restituisce il testo (per i file .ts di Showdown, che leggo solo come testo, senza eseguirli)
async function scaricaTesto(url) {
  const file = path.join(CACHE_DIR, 'showdown_' + url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_'));
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' per ' + url);
  const t = await r.text();
  fs.writeFileSync(file, t);
  return t;
}
const blocchiTs = t => { const F = {}; for (const m of t.matchAll(/^\t([a-z0-9]+): \{([^}]*)\}/gm)) { const o = {}; for (const k of m[2].matchAll(/(\w+): "([^"]*)"/g)) o[k[1]] = k[2]; F[m[1]] = o; } return F; };
const conStato = (t, stato) => new Set([...t.matchAll(new RegExp('^\\t([a-z0-9]+): \\{\\s*inherit: true,\\s*isNonstandard: ' + stato, 'gm'))].map(m => m[1]));

// Dati di Pokémon Champions: set Random Battle, strumenti e mosse disponibili, Megapietre.
async function datiChampions() {
  const D = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/';
  const [sets, dsets] = await Promise.all([scarica(GH + 'champions/sets.json'), scarica(GH + 'champions/doubles-sets.json')]);
  const [items, moves, fd, baseItems] = await Promise.all(['mods/champions/items.ts', 'mods/champions/moves.ts', 'mods/champions/formats-data.ts', 'items.ts'].map(f => scaricaTesto(D + f)));
  const stones = {}; // id della forma Mega -> nome della Megapietra
  for (const b of baseItems.split(/\n\t(?=[a-z0-9]+: \{\n)/)) {
    const n = b.match(/^\t?[a-z0-9]+: \{\n\t\tname: "([^"]+)"/), ms = b.match(/megaStone: \{ "[^"]+": "([^"]+)" \}/);
    if (n && ms) stones[toId(ms[1])] = n[1];
  }
  return { sets: sets || {}, dsets: dsets || {}, itemPast: conStato(items, '"Past"'), movePast: conStato(moves, '"Past"'), moveOk: conStato(moves, 'null'), fd: blocchiTs(fd), stones };
}

// Primo formato "[Gen 9 Champions] VGC <anno> Reg <lettere>" (non Bo3) che non sia nascosto (searchShow: false).
// Stessa funzione che usa il gioco nel browser.
function trovaVgcChampions(testo) {
  for (const b of testo.split(/\n\t\{\n/)) {
    const n = b.match(/name: "(\[Gen 9 Champions\] VGC \d{4} Reg [A-Za-z-]+)"/);
    if (n && !/searchShow: false/.test(b)) return n[1];
  }
  return null;
}

async function scarica(url) {
  const file = path.join(CACHE_DIR, 'showdown_' + url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_'));
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  let ultimo;
  for (let t = 1; t <= 4; t++) {
    try {
      const r = await fetch(url);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('HTTP ' + r.status + ' per ' + url);
      const testo = await r.text();
      fs.writeFileSync(file, testo);
      return JSON.parse(testo);
    } catch (e) { ultimo = e; await new Promise(res => setTimeout(res, 800 * t * t)); }
  }
  throw ultimo;
}

// ---------- Regole ----------
const SETUP = new Set(['swordsdance', 'nastyplot', 'calmmind', 'dragondance', 'bulkup', 'quiverdance', 'shellsmash', 'curse',
  'coil', 'agility', 'rockpolish', 'bellydrum', 'shiftgear', 'victorydance', 'tidyup', 'workup', 'growth', 'irondefense',
  'cottonguard', 'trailblaze', 'filletaway', 'clangoroussoul', 'noretreat', 'geomancy', 'tailglow', 'autotomize', 'honeclaws']);
const RECUPERO = new Set(['recover', 'roost', 'softboiled', 'slackoff', 'milkdrink', 'moonlight', 'morningsun', 'synthesis',
  'shoreup', 'strengthsap', 'wish', 'rest', 'healorder', 'junglehealing', 'lunarblessing', 'painsplit', 'leechseed']);
const TRAPPOLE = new Set(['stealthrock', 'spikes', 'toxicspikes', 'stickyweb']);
const STATO = new Set(['toxic', 'willowisp', 'thunderwave', 'spore', 'sleeppowder', 'glare', 'yawn', 'hypnosis', 'nuzzle', 'stunspore']);
const SCAMBIO = new Set(['uturn', 'voltswitch', 'flipturn', 'partingshot', 'teleport', 'chillyreception', 'shedtail']);
const UTILI = new Set(['defog', 'rapidspin', 'mortalspin', 'tidyup', 'knockoff', 'encore', 'taunt', 'trick', 'haze', 'whirlwind', 'roar',
  'healbell', 'aromatherapy', 'substitute', 'protect', 'fakeout', 'followme', 'ragepowder', 'tailwind', 'trickroom', 'helpinghand',
  'reflect', 'lightscreen', 'auroraveil', 'memento', 'destinybond', 'switcheroo', 'sleeptalk', 'icywind', 'electroweb', 'snarl']);
// Attacchi che non vanno scelti come "migliore attacco" solo per la potenza
const ATTACCHI_SCOMODI = new Set(['hyperbeam', 'gigaimpact', 'solarbeam', 'solarblade', 'skyattack', 'focuspunch', 'selfdestruct',
  'explosion', 'mistyexplosion', 'lastresort', 'dreameater', 'synchronoise', 'belch', 'steelbeam', 'mindblown', 'shelltrap', 'futuresight']);
// Vietate in quasi tutti i formati National Dex (tranne AG/Ubers): il gioco non le usa mai, così ogni set va bene ovunque.
const ABILITA_VIETATE = new Set(['Shadow Tag', 'Arena Trap', 'Moody', 'Sand Veil', 'Snow Cloak']);
const MOSSE_VIETATE = new Set(['shedtail']);
// Vietate solo in National Dex UU e RU: per questi c'è una versione alternativa del set ("basso").
const ABILITA_VIETATE_BASSE = new Set(['Drizzle', 'Drought']);
const STRUMENTI_VIETATI_BASSI = new Set(['Light Clay']);
// Pokémon Champions, singolo ([Gen 9 Champions] OU): Sleep Moves Clause (niente mosse che addormentano) e mosse vietate
const CHAMPIONS_VIETATE_SINGOLO = new Set(['spore', 'sleeppowder', 'hypnosis', 'yawn', 'lovelykiss', 'sing', 'grasswhistle',
  'darkvoid', 'relicsong', 'lastrespects', 'batonpass', 'shedtail']);
// Mosse di stato permesse con uno strumento Scelta (decisione dell'utente del 24/11/2026): Trick/Switcheroo danno lo
// strumento all'avversario; le altre si usano una volta o fanno uscire il Pokémon, e uscendo il blocco della Scelta si azzera.
const SCELTA_STATO_OK = new Set(['trick', 'switcheroo', 'healingwish', 'lunardance', 'memento', 'partingshot', 'teleport', 'chillyreception', 'batonpass']);
const RUOLI_VELOCI = /Fast|Setup Sweeper|Wallbreaker|Offensive Protect|Choice Item|Tera Blast/;
const RUOLI_SPECIALI_ATTACCO = /Wallbreaker/;

function creaRegole(dati) {
  const { moves, dex, learnsets } = dati;
  const mossa = id => moves[toId(id)];
  // Mosse "Past" (tolte in Scarlatto/Violetto, es. Bolt Beak, Hidden Power) permesse solo ai Pokémon che non sono
  // in Scarlatto/Violetto: quelli si giocano comunque in National Dex, dove sono valide.
  let permettiPast = false;
  const setPast = v => { permettiPast = v; };
  // In modalità Champions valgono le mosse disponibili in Pokémon Champions
  let champ = null;
  const setChampions = c => { champ = c; };
  const legale = id => { const m = mossa(id), i = toId(id);
    if (!m || MOSSE_VIETATE.has(i) || m.isMax || m.isZ) return false;
    if (champ) return !(champ.ban && champ.ban.has(i)) && (champ.moveOk.has(i) || (!m.isNonstandard && !champ.movePast.has(i)));
    return !m.isNonstandard || (permettiPast && m.isNonstandard === 'Past'); };
  const attacco = m => m.category !== 'Status';

  // La mossa si impara (in qualunque generazione) dal Pokémon, dalla sua forma base o dalle preevoluzioni?
  function impara(specieId, mossaId) {
    if (mossaId.startsWith('hiddenpower')) mossaId = 'hiddenpower';
    if (specieId === 'smeargle') return !['chatter', 'struggle'].includes(mossaId); // Smeargle copia le mosse con Sketch
    const visti = new Set();
    let coda = [specieId];
    while (coda.length) {
      const id = coda.shift();
      if (!id || visti.has(id)) continue;
      visti.add(id);
      const l = learnsets[id] && learnsets[id].learnset;
      if (l && l[mossaId]) return true;
      const d = dex[id];
      if (!d) continue;
      if (d.prevo) coda.push(toId(d.prevo));
      if (d.baseSpecies && toId(d.baseSpecies) !== id && (!l || d.changesFrom)) coda.push(toId(d.baseSpecies));
      if (d.changesFrom) coda.push(toId(d.changesFrom));
    }
    return false;
  }

  // La mossa si ottiene solo da eventi in cui il Pokémon era cromatico? (es. Genesect) Allora il set va segnato "Shiny: Yes".
  function soloEventoShiny(specieId, mossaId) {
    const ls = learnsets[specieId];
    const fonti = ls && ls.learnset && ls.learnset[mossaId];
    if (!fonti || !fonti.length || !fonti.every(f => /^\dS\d+$/.test(f))) return false;
    return fonti.every(f => { const ev = (ls.eventData || [])[+f.split('S')[1]]; return ev && ev.shiny === true; });
  }

  // Sceglie 4 mosse dal "movepool" di un set Random Battle, in base al ruolo.
  // "riserva": mosse degli altri set dello stesso Pokémon, usate solo se questo set resta con meno di 4 mosse
  // (succede quando una mossa del set non esiste più in gen 9, es. Hidden Power).
  function scegliMosse(specie, set, doppio, riserva) {
    const scelte = scegliDa(specie, set, doppio, set.movepool);
    if (scelte.length < 4 && riserva) {
      const altre = scegliDa(specie, set, doppio, [...scelte, ...riserva]);
      for (const id of altre) if (scelte.length < 4 && !scelte.includes(id) && !(SETUP.has(id) && scelte.some(s => SETUP.has(s)))) scelte.push(id);
    }
    return scelte;
  }
  function scegliDa(specie, set, doppio, movepool) {
    const tipi = specie.types;
    const pool = [...new Set(movepool.map(toId))].filter(legale);
    const scelte = [];
    const aggiungi = id => { if (id && !scelte.includes(id) && scelte.length < 4 && pool.includes(id)) scelte.push(id); };
    const valore = id => { const m = mossa(id); const acc = m.accuracy === true ? 100 : m.accuracy;
      let bp = m.basePower || (['seismictoss', 'nightshade'].includes(id) ? 75 : 60);
      if (m.multihit) bp *= Array.isArray(m.multihit) ? 3 : m.multihit;
      return bp * acc / 100 * (tipi.includes(m.type) ? 1.5 : 1) - (ATTACCHI_SCOMODI.has(id) ? 60 : 0) + (m.priority > 0 ? 5 : 0); };
    const attacchi = pool.filter(id => attacco(mossa(id))).sort((a, b) => valore(b) - valore(a));
    const ruolo = set.role || '';

    if (ruolo === 'Tera Blast user') aggiungi('terablast');
    if (/Setup|Tera Blast/.test(ruolo)) aggiungi(pool.find(id => SETUP.has(id)));
    if (doppio && /Protect/.test(ruolo)) aggiungi('protect');
    // Un attacco STAB per ogni tipo del Pokémon (il più forte)
    for (const t of tipi) aggiungi(attacchi.find(id => mossa(id).type === t));
    if (!/Fast Attacker|Wallbreaker|Choice/.test(ruolo)) aggiungi(pool.find(id => RECUPERO.has(id) && id !== 'rest'));
    if (scelte.includes('rest')) aggiungi('sleeptalk');
    if (/Support|Staller|Bulky Protect/.test(ruolo)) {
      aggiungi(pool.find(id => TRAPPOLE.has(id)));
      aggiungi(pool.find(id => STATO.has(id)));
      aggiungi(pool.find(id => SCAMBIO.has(id)));
      if (doppio) aggiungi(pool.find(id => ['fakeout', 'followme', 'ragepowder', 'tailwind', 'trickroom', 'helpinghand'].includes(id)));
    }
    // Copertura: attacchi di tipi non ancora coperti
    for (const id of attacchi) { if (!scelte.some(s => attacco(mossa(s)) && mossa(s).type === mossa(id).type)) aggiungi(id); }
    // Poi mosse utili, poi qualunque cosa resti (massimo una mossa di potenziamento)
    for (const id of pool) if (UTILI.has(id) || SCAMBIO.has(id) || TRAPPOLE.has(id) || STATO.has(id)) aggiungi(id);
    for (const id of attacchi) aggiungi(id);
    for (const id of pool) if (!(SETUP.has(id) && scelte.some(s => SETUP.has(s)))) aggiungi(id);
    return scelte;
  }

  function categoriaAttacco(scelte) {
    let fis = 0, spe = 0;
    for (const id of scelte) { const m = mossa(id); if (!attacco(m) || ['bodypress', 'foulplay', 'seismictoss', 'nightshade', 'superfang', 'ruination'].includes(id)) continue;
      if (m.category === 'Physical') fis++; else spe++; }
    // Body Press usa la Difesa: conta come "difesa" solo se gli altri attacchi sono al massimo uno
    // (prima bastava averla per dare Choice Band o nature sbagliate a set con attacchi speciali, es. Magnezone)
    // (contano solo gli attacchi da almeno 60 di potenza: Rapid Spin, U-turn ecc. non cambiano il ruolo)
    const forti = scelte.filter(id => { const m = mossa(id); return attacco(m) && id !== 'bodypress' && (m.basePower || 0) >= 60 && !['foulplay', 'seismictoss', 'nightshade', 'superfang', 'ruination'].includes(id); }).length;
    if (scelte.includes('bodypress') && forti <= 1) return 'difesa';
    if (!fis && !spe) return 'nessuno';
    return fis >= spe ? 'fisico' : 'speciale';
  }

  function scegliStrumento(specie, set, scelte, abilita, doppio) {
    const ruolo = set.role || '', attacchi = scelte.filter(id => attacco(mossa(id))).length;
    const cat = categoriaAttacco(scelte), veloce = RUOLI_VELOCI.test(ruolo), ab = toId(abilita);
    if (specie.evos && specie.evos.length && !specie.battleOnly) return 'Eviolite';
    if (['guts', 'quickfeet', 'flareboost'].includes(ab) && scelte.includes('facade')) return 'Flame Orb';
    if (ab === 'poisonheal' || ab === 'toxicboost') return 'Toxic Orb';
    if (scelte.includes('rest') && !scelte.includes('sleeptalk')) return 'Chesto Berry';
    if (['geomancy', 'meteorbeam', 'electroshot'].some(id => scelte.includes(id))) return 'Power Herb';
    if ((scelte.includes('reflect') && scelte.includes('lightscreen')) || scelte.includes('auroraveil')) return 'Light Clay';
    if (scelte.includes('trick') || scelte.includes('switcheroo')) {
      // in Champions Band e Specs non esistono: Choice Scarf, così Trick ha sempre uno strumento da scambiare
      if (champ) return 'Choice Scarf';
      if (/Wallbreaker/.test(ruolo) || !veloce) return cat === 'fisico' ? 'Choice Band' : 'Choice Specs';
      return 'Choice Scarf';
    }
    if (/Choice Item/.test(ruolo) || (attacchi === 4 && /Fast Attacker|Wallbreaker/.test(ruolo))) {
      if (/Fast/.test(ruolo) && specie.baseStats.spe >= 70 && specie.baseStats.spe <= 105) return 'Choice Scarf';
      return cat === 'speciale' ? 'Choice Specs' : 'Choice Band';
    }
    if (ruolo === 'AV Pivot' || (attacchi === 4 && /Bulky Attacker/.test(ruolo))) return 'Assault Vest';
    if (doppio) {
      if (/Support|Bulky/.test(ruolo)) return 'Sitrus Berry';
      return specie.baseStats.hp + specie.baseStats.def + specie.baseStats.spd < 220 ? 'Focus Sash' : 'Life Orb';
    }
    if (/Setup Sweeper|Wallbreaker|Fast Attacker|Tera Blast/.test(ruolo) && ab !== 'sheerforce' || ab === 'magicguard') return 'Life Orb';
    if (specie.types.includes('Poison')) return 'Black Sludge';
    return 'Leftovers';
  }

  // C'è almeno un attacco fisico oltre a Body Press / Foul Play?
  const haFisici = scelte => scelte.some(id => { const m = mossa(id); return attacco(m) && m.category === 'Physical' && !['bodypress', 'foulplay', 'seismictoss', 'nightshade', 'superfang', 'ruination'].includes(id); });
  function scegliEvNatura(specie, set, scelte, strumento) {
    const ruolo = set.role || '', cat = categoriaAttacco(scelte), b = specie.baseStats;
    const lento = b.spe <= 45 || scelte.includes('trickroom') || scelte.includes('gyroball');
    const atk = cat === 'speciale' ? 'SpA' : 'Atk';
    const offensivo = RUOLI_VELOCI.test(ruolo) || strumento === 'Choice Scarf';
    if (offensivo && !lento) {
      const forte = RUOLI_SPECIALI_ATTACCO.test(ruolo) || /Band|Specs/.test(strumento);
      const natura = cat === 'speciale' ? (forte ? 'Modest' : 'Timid') : cat === 'nessuno' || cat === 'difesa' ? 'Jolly' : (forte ? 'Adamant' : 'Jolly');
      if (cat === 'nessuno' || cat === 'difesa') return { evs: { HP: 252, Def: 4, Spe: 252 }, natura: 'Jolly' };
      return { evs: { HP: 4, [atk]: 252, Spe: 252 }, natura };
    }
    if (/Bulky Attacker|AV Pivot|Doubles Bulky Attacker|Doubles Wallbreaker/.test(ruolo) || (lento && !/Support|Staller|Bulky Setup|Bulky Protect/.test(ruolo))) {
      if (cat === 'nessuno' || cat === 'difesa') return { evs: { HP: 252, Def: 252, SpD: 4 }, natura: haFisici(scelte) ? 'Impish' : 'Bold' };
      return { evs: { HP: 252, [atk]: 252, SpD: 4 }, natura: cat === 'speciale' ? (lento ? 'Quiet' : 'Modest') : (lento ? 'Brave' : 'Adamant') };
    }
    // Ruoli difensivi: punti in PS e nella difesa più bassa delle due
    // (con Body Press si investe sempre in Difesa; la natura abbassa la statistica d'attacco che non si usa)
    const dif = scelte.includes('bodypress') || b.def <= b.spd ? 'Def' : 'SpD';
    const meno = cat === 'fisico' || (cat !== 'speciale' && haFisici(scelte)) ? 'SpA' : 'Atk';
    const nature = { Def: { Atk: 'Bold', SpA: 'Impish' }, SpD: { Atk: 'Calm', SpA: 'Careful' } };
    return { evs: { HP: 252, [dif]: 252, [dif === 'Def' ? 'SpD' : 'Def']: 4 }, natura: nature[dif][meno] };
  }

  function scegliAbilita(specie, set) {
    const legali = Object.values(specie.abilities || {});
    const ok = a => legali.includes(a) && !ABILITA_VIETATE.has(a);
    return (set.abilities || []).find(ok) || legali.find(ok) || (set.abilities || []).find(a => legali.includes(a)) || legali[0];
  }
  // Nei tier bassi (National Dex UU e RU) alcune abilità e strumenti sono vietati: preparo un'alternativa
  // che il gioco usa solo in quei formati.
  function versioneBassa(specie, s) {
    const b = {};
    if (ABILITA_VIETATE_BASSE.has(s.abilita)) {
      const alt = Object.values(specie.abilities || {}).find(a => a !== s.abilita && !ABILITA_VIETATE.has(a) && !ABILITA_VIETATE_BASSE.has(a));
      if (alt) b.abilita = alt;
    }
    if (STRUMENTI_VIETATI_BASSI.has(s.strumento)) b.strumento = specie.types.includes('Poison') ? 'Black Sludge' : 'Leftovers';
    return Object.keys(b).length ? b : null;
  }

  function creaSet(specie, setOrig, doppio, riserva) {
    // I ruoli delle vecchie generazioni legati a meccaniche sparite diventano ruoli normali
    const set = Object.assign({}, setOrig);
    if (/Z-Move|Dynamax/.test(set.role || '')) set.role = set.movepool.map(toId).some(id => SETUP.has(id)) ? 'Setup Sweeper' : 'Fast Attacker';
    const scelte = scegliMosse(specie, set, doppio, riserva);
    const abilita = scegliAbilita(specie, set);
    let strumento = scegliStrumento(specie, set, scelte, abilita, doppio);
    // Con uno strumento Scelta si è bloccati su una mossa: le mosse di stato (tranne quelle di SCELTA_STATO_OK) diventano
    // attacchi dello stesso set; se non ce ne sono abbastanza, niente Scelta (es. Houndstone con Will-O-Wisp)
    if (/^Choice /.test(strumento)) {
      const stato = scelte.filter(id => !attacco(mossa(id)) && !SCELTA_STATO_OK.has(id));
      const altri = [...new Set([...set.movepool, ...(riserva || [])].map(toId))].filter(id => legale(id) && attacco(mossa(id)) && !scelte.includes(id));
      if (stato.length && altri.length >= stato.length) stato.forEach((id, i) => { scelte[scelte.indexOf(id)] = altri[i]; });
      else if (stato.length) { strumento = champ ? 'Life Orb' : (doppio ? 'Sitrus Berry' : 'Leftovers');
        // senza Scelta, Trick non ha niente di utile da scambiare
        for (const t of ['trick', 'switcheroo']) if (scelte.includes(t)) { const a = altri.find(x => !scelte.includes(x)); if (a) scelte[scelte.indexOf(t)] = a; } }
    }
    const { evs, natura } = scegliEvNatura(specie, set, scelte, strumento);
    const tera = (set.teraTypes && set.teraTypes[0]) || specie.types[0];
    // Hidden Power di un tipo si scrive "Hidden Power [Fuoco]" nel formato di Showdown
    const nome = id => mossa(id).name.replace(/^Hidden Power (\w+)$/, 'Hidden Power [$1]');
    const risultato = { ruolo: set.role || 'Set', strumento, abilita, tera, evs, natura, mosse: scelte.map(nome) };
    if (scelte.some(id => soloEventoShiny(toId(specie.name), id))) risultato.shiny = true;
    const basso = versioneBassa(specie, risultato);
    if (basso) risultato.basso = basso;
    return risultato;
  }

  return { creaSet, impara, legale, mossa, setPast, versioneBassa, setChampions };
}

async function main() {
  if (typeof fetch !== 'function') { console.error('Serve Node.js 18 o più recente.'); process.exit(1); }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const pool = JSON.parse(fs.readFileSync(path.join(DIR, 'pokemon.json'), 'utf8'));
  const manuali = JSON.parse(fs.readFileSync(path.join(DIR, 'set-manuali.json'), 'utf8'));

  console.log('1/3 Scarico i dati di Pokémon Showdown...');
  const [moves, dex, learnsets] = await Promise.all(['moves.json', 'pokedex.json', 'learnsets.json'].map(f => scarica(PLAY + f)));
  const fonti = {};
  for (const f of [...FONTI_SINGOLO, FONTE_DOPPIO]) fonti[f] = (await scarica(GH + f)) || {};
  const R = creaRegole({ moves, dex, learnsets });
  const C = await datiChampions();

  console.log('2/3 Creo i set per ' + pool.length + ' Pokémon...');
  const out = {}, problemi = [], origine = {};
  for (const p of pool) {
    const id = toId(p.name), specie = dex[id];
    if (!specie) { problemi.push(p.name + ': non trovato nel Pokédex di Showdown'); continue; }
    const voce = { singolo: [], doppio: [] };
    R.setPast(specie.isNonstandard === 'Past'); // il Pokémon non è in Scarlatto/Violetto
    const fonteS = FONTI_SINGOLO.find(f => fonti[f][id]);
    if (manuali[p.name]) {
      voce.singolo = manuali[p.name].singolo || [];
      voce.doppio = manuali[p.name].doppio || voce.singolo;
      origine[p.name] = 'manuale';
    } else if (fonteS) {
      const d = fonti[FONTE_DOPPIO][id];
      // Riserva: tutte le mosse di tutti i set di questo Pokémon, in tutte le generazioni
      const riserva = [...FONTI_SINGOLO, FONTE_DOPPIO].flatMap(f => fonti[f][id] ? fonti[f][id].sets.flatMap(s => s.movepool) : []);
      voce.singolo = fonti[fonteS][id].sets.map(s => R.creaSet(specie, s, false, riserva));
      voce.doppio = (d || fonti[fonteS][id]).sets.map(s => R.creaSet(specie, s, true, riserva));
      origine[p.name] = fonteS.split('/')[0] + (d ? '' : ' (doppio adattato dal singolo)');
    } else { problemi.push(p.name + ': nessun set, da aggiungere in set-manuali.json'); continue; }
    // Toglie i set identici e controlla che ogni mossa sia imparabile
    for (const k of ['singolo', 'doppio']) {
      const visti = new Set();
      voce[k] = voce[k].filter(s => { const c = JSON.stringify([s.strumento, s.abilita, s.mosse.slice().sort()]); if (visti.has(c)) return false; visti.add(c); return true; });
      for (const s of voce[k]) {
        if (s.mosse.length < 4 && id !== 'ditto' && id !== 'unown') problemi.push(p.name + ' (' + k + ', ' + s.ruolo + '): solo ' + s.mosse.length + ' mosse');
        if (!Object.values(specie.abilities || {}).includes(s.abilita)) problemi.push(p.name + ': abilità non valida "' + s.abilita + '"');
        for (const m of s.mosse) {
          if (!R.legale(m)) problemi.push(p.name + ': mossa non valida in gen 9 "' + m + '"');
          else if (!R.impara(id, toId(m))) problemi.push(p.name + ': non impara "' + m + '"');
        }
      }
    }
    if (p.champions) {
      const ch = creaChampions(id, specie);
      if (ch) voce.champions = ch; else problemi.push(p.name + ': nessun set Champions');
    }
    out[p.name] = voce;
  }

  // Set per Pokémon Champions: dai set Random Battle di Champions, con le regole di quel gioco:
  // niente Tera, solo strumenti disponibili lì, "Stat Points" (66 in tutto, max 32 per statistica) al posto degli EV,
  // e un set in più con la Megapietra per chi ha una Mega permessa.
  function creaChampions(id, specie) {
    const src = C.sets[id];
    if (!src) return null;
    R.setPast(false);
    const riserva = [...src.sets, ...((C.dsets[id] || {}).sets || [])].flatMap(s => s.movepool);
    // Singolo ([Gen 9 Champions] OU): Sleep Moves Clause e mosse vietate; doppio: regole Champions normali
    const CS = Object.assign({}, C, { ban: CHAMPIONS_VIETATE_SINGOLO }), CD = C;
    R.setChampions(CS);
    const singolo = src.sets.map(s => adatta(R.creaSet(specie, s, false, riserva)));
    R.setChampions(CD);
    const doppio = (C.dsets[id] || src).sets.map(s => adatta(R.creaSet(specie, s, true, riserva)));
    const ch = { singolo, doppio };
    const abilitaBase = ch.singolo[0].abilita;
    for (const megaId of Object.keys(C.sets).filter(k => k.startsWith(id + 'mega'))) {
      const ms = dex[megaId], pietra = C.stones[megaId], t = C.fd[megaId] || {};
      if (!ms || !pietra || t.isNonstandard) continue;
      const ris = [...riserva, ...C.sets[megaId].sets.flatMap(s => s.movepool)];
      const mega = (fonte, doppio) => fonte.sets.map(s => {
        const r = adatta(R.creaSet(ms, s, doppio, ris));
        return Object.assign(r, { ruolo: 'Mega: ' + r.ruolo, strumento: pietra, abilita: abilitaBase, mega: ms.name });
      });
      R.setChampions(CS);
      if (!['Uber', 'AG'].includes(t.tier)) ch.singolo.push(...mega(C.sets[megaId], false));
      R.setChampions(CD);
      if (t.doublesTier !== 'DUber') ch.doppio.push(...mega(C.dsets[megaId] || C.sets[megaId], true));
    }
    R.setChampions(null);
    for (const k of ['singolo', 'doppio']) {
      const visti = new Set();
      ch[k] = ch[k].filter(s => { const c = JSON.stringify([s.strumento, s.mosse.slice().sort()]); if (visti.has(c)) return false; visti.add(c); return true; });
    }
    return ch;
  }
  function adatta(s) {
    const SOST = { 'Choice Band': 'Life Orb', 'Choice Specs': 'Life Orb', 'Eviolite': 'Leftovers', 'Black Sludge': 'Leftovers',
      'Flame Orb': 'Leftovers', 'Toxic Orb': 'Leftovers', 'Power Herb': 'Life Orb', 'Assault Vest': 'Sitrus Berry',
      'Heavy-Duty Boots': 'Leftovers', 'Weakness Policy': 'Sitrus Berry', 'Light Clay': 'Leftovers' };
    let it = SOST[s.strumento] || s.strumento;
    if (C.itemPast.has(toId(it))) it = 'Leftovers';
    const sp = {};
    for (const [k, v] of Object.entries(s.evs)) if (v) sp[k] = v >= 200 ? 32 : 2;
    const r = Object.assign({}, s, { strumento: it, evs: sp });
    delete r.tera; delete r.basso; delete r.shiny;
    return r;
  }

  // Regolamento VGC di Pokémon Champions attualmente visibile su Showdown (es. "[Gen 9 Champions] VGC 2026 Reg M-C"):
  // il gioco lo usa come formato del doppio Champions. Lo cerco leggendo config/formats.ts come testo.
  let champVgc = null;
  try {
    const t = await (await fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/config/formats.ts')).text();
    champVgc = trovaVgcChampions(t);
  } catch (e) { console.warn('Attenzione: regolamento VGC non trovato (' + e.message + ')'); }
  console.log('    Regolamento VGC di Champions: ' + (champVgc || 'non trovato'));

  console.log('3/3 Salvo i file...');
  fs.writeFileSync(path.join(DIR, 'set.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(DIR, 'set-data.js'), '// Generato da scarica-set.js\nconst SET_DATA = ' + JSON.stringify(out) + ';\n' +
    'const SHOWDOWN_INFO = ' + JSON.stringify({ champVgc, aggiornato: new Date().toISOString().slice(0, 10) }) + ';\n');
  const conteggio = {};
  for (const o of Object.values(origine)) conteggio[o] = (conteggio[o] || 0) + 1;
  const nSet = k => Object.values(out).reduce((a, v) => a + v[k].length, 0);
  fs.writeFileSync(path.join(DIR, 'riepilogo-set.txt'), [
    'RIEPILOGO SET',
    'Pokémon con set: ' + Object.keys(out).length + ' su ' + pool.length,
    'Set singolo: ' + nSet('singolo') + ' · Set doppio: ' + nSet('doppio'),
    'Pokémon Champions: ' + Object.values(out).filter(v => v.champions).length + ' Pokémon, ' +
      Object.values(out).reduce((a, v) => a + (v.champions ? v.champions.singolo.length : 0), 0) + ' set singolo, ' +
      Object.values(out).reduce((a, v) => a + (v.champions ? v.champions.doppio.length : 0), 0) + ' set doppio (di cui Mega: ' +
      Object.values(out).reduce((a, v) => a + (v.champions ? v.champions.singolo.filter(s => s.mega).length : 0), 0) + ' singolo)',
    '', 'DA DOVE VENGONO', ...Object.entries(conteggio).sort().map(([k, v]) => '  ' + k + ': ' + v),
    '', 'PROBLEMI', ...(problemi.length ? problemi.map(x => '  ' + x) : ['  nessuno'])
  ].join('\n') + '\n');
  console.log('\nFatto: set per ' + Object.keys(out).length + ' Pokémon, ' + problemi.length + ' problemi (vedi riepilogo-set.txt).');
}

if (require.main === module) main().catch(e => { console.error('\nErrore: ' + e.message + '\nRilancia lo script: riparte da dove si era fermato.'); process.exit(1); });
module.exports = { main };
