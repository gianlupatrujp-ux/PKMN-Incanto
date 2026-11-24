// Pokémon Incanto: set di Pokémon Champions presi da come si gioca davvero (statistiche d'uso di Pokémon Showdown).
// Uso (Node.js 18+, dopo scarica-set.js):  node scarica-champions-uso.js [AAAA-MM]
// Produce: champions-uso-data.js (const CHAMP_USO = {nome: {singolo:[set], doppio:[set]}}, CHAMP_USO_INFO), caricato dal gioco.
//
// Fonte: statistiche mensili pubblicate da Smogon per Pokémon Showdown (smogon.com/stats, file "chaos"): numeri d'uso di
// strumenti, mosse, abilità e distribuzioni dei Stat Points nelle lotte con punteggio 1630+. Singolo = [Gen 9 Champions] OU,
// doppio = VGC di Champions. Sono solo statistiche (numeri), non analisi scritte. Per ogni Pokémon si creano fino a 2 set
// "normali" (i due strumenti più usati) e uno per ogni Megaevoluzione giocata, con le 4 mosse più usate scelte in modo
// coerente con lo strumento (con uno strumento Scelta niente mosse di stato, tranne Trick/Switcheroo).
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = __dirname, CACHE = path.join(DIR, 'cache');
const SOGLIA = 1630, MIN_USO = 0.002, MIN_LOTTE = 150;

async function testo(url) {
  const f = path.join(CACHE, 'uso_' + url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_'));
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status + ' per ' + url); const t = await r.text(); fs.writeFileSync(f, t); return t;
}
(async () => {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);
  let mese = process.argv[2];
  if (!mese) { const idx = await (await fetch('https://www.smogon.com/stats/')).text(); mese = [...idx.matchAll(/href="(\d{4}-\d{2})\/"/g)].map(m => m[1]).sort().pop(); }
  const lista = await (await fetch('https://www.smogon.com/stats/' + mese + '/chaos/')).text();
  const ou = 'gen9championsou-' + SOGLIA, vgc = ([...lista.matchAll(/href="(gen9championsvgc\d{4}reg[a-z]+)-\d+\.json"/g)].map(m => m[1]).sort().pop() || 'gen9championsvgc2026regmc') + '-' + SOGLIA;
  const c = {}; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(DIR, 'lib/pkmn-sim.js'), 'utf8'), c);
  for (const f of ['pokemon-data.js', 'set-data.js']) vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8').replace(/^const /m, 'var '), c);
  const D = c.PkmnSim.Dex, pool = c.POKEMON_DATA.filter(p => p.champions).map(p => p.name);
  // con uno strumento Scelta: Trick/Switcheroo (danno via lo strumento) e mosse che si usano una volta o fanno uscire
  // il Pokémon (decisione dell'utente del 24/11/2026); Trick/Switcheroo invece solo con uno strumento Scelta
  const STATO_OK = new Set(['trick', 'switcheroo', 'healingwish', 'lunardance', 'memento', 'partingshot', 'teleport', 'chillyreception', 'batonpass']);
  const SOLO_SCELTA = new Set(['trick', 'switcheroo']);
  // Regole dei formati (controllo del 23/11/2026 con il validatore di Showdown): Megaevoluzioni Uber vietate in
  // [Gen 9 Champions] OU (es. Raichu-Mega-Y) e DUber nel VGC, lette come testo da data/mods/champions/formats-data.ts;
  // abilità che alzano l'elusione vietate (Evasion Abilities Clause); nel singolo anche strumenti e mosse vietati
  // in OU e la Sleep Moves Clause. Trick/Switcheroo solo con uno strumento Scelta (altrimenti non hanno senso).
  const fd = await testo('https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/formats-data.ts');
  const tierDi = id => { const b = fd.split(/\n\t(?=[a-z0-9]+: \{)/).find(x => x.startsWith(id + ':')) || ''; const t = b.match(/\btier: "([^"]+)"/), d = b.match(/doublesTier: "([^"]+)"/); return { tier: t && t[1], doublesTier: d && d[1] }; };
  const ABIL_NO = new Set(['Sand Veil', 'Snow Cloak', 'Moody', 'Shadow Tag', 'Arena Trap']);
  const VIETATI = { singolo: { items: new Set(['damprock', 'kingsrock', 'lightclay', 'quickclaw']),
    moves: new Set(['batonpass', 'lastrespects', 'shedtail', 'spore', 'sleeppowder', 'hypnosis', 'yawn', 'lovelykiss', 'sing', 'grasswhistle', 'darkvoid', 'relicsong']) },
    doppio: { items: new Set(), moves: new Set() } };
  const top = o => Object.entries(o || {}).filter(([k]) => k && k !== 'nothing' && k !== '').sort((a, b) => b[1] - a[1]);
  const out = {}, info = { mese, singolo: ou, doppio: vgc, lotte: {} };
  for (const [fmt, file] of [['singolo', ou], ['doppio', vgc]]) {
    const j = JSON.parse(await testo('https://www.smogon.com/stats/' + mese + '/chaos/' + file + '.json')); info.lotte[fmt] = j.info['number of battles'];
    const d = j.data;
    const crea = (base, e, item, ruolo) => {
      const it = D.items.get(item); if (!it.exists || VIETATI[fmt].items.has(it.id)) return null; const scelta = /^Choice /.test(it.name);
      const sp = top(e.Spreads)[0]; if (!sp) return null; const [nat, nums] = sp[0].split(':'); const v = nums.split('/').map(Number), K = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'], evs = {};
      // coerenza: chi investe solo in Attacco non usa attacchi speciali (e viceversa), tranne le mosse di utilità
      const fis = v[1] > 0 && !v[3], spe = v[3] > 0 && !v[1], UTIL = new Set(['fakeout', 'uturn', 'voltswitch', 'flipturn', 'knockoff', 'rapidspin', 'icywind', 'electroweb', 'snarl', 'bulldoze', 'rocktomb', 'nuzzle', 'mortalspin', 'seismictoss', 'nightshade', 'foulplay', 'bodypress']);
      const mosse = [];
      for (const [id] of top(e.Moves)) { if (mosse.length >= 4) break; const m = D.moves.get(id); if (!m.exists) continue;
        if (scelta && m.category === 'Status' && !STATO_OK.has(m.id)) continue; if (mosse.includes(m.name)) continue;
        if (VIETATI[fmt].moves.has(m.id) || (!scelta && SOLO_SCELTA.has(m.id))) continue;
        if (!UTIL.has(m.id) && ((fis && m.category === 'Special') || (spe && m.category === 'Physical'))) continue; mosse.push(m.name); }
      if (mosse.length < 4) return null;
      K.forEach((k, i) => { if (v[i]) evs[k] = Math.min(32, v[i]); });
      const sb = D.species.get(base); const abBase = Object.values(sb.abilities);
      const abOk = abBase.filter(a => !ABIL_NO.has(a));
      let ab = top(e.Abilities).map(([id]) => D.abilities.get(id).name).find(a => abOk.includes(a)) || abOk[0] || abBase[0];
      return { ruolo, strumento: it.name, abilita: ab, evs, natura: nat, mosse };
    };
    for (const name of pool) {
      const sp = D.species.get(name); if (!sp.exists) continue; const sets = [];
      const e = d[sp.name];
      if (e && e.usage >= MIN_USO && e['Raw count'] >= MIN_LOTTE) {
        const items = top(e.Items).map(([id]) => id).filter(id => !D.items.get(id).megaStone).slice(0, 2);
        items.forEach((id, i) => { const s = crea(sp.name, e, id, i ? 'Seconda scelta (uso Showdown)' : 'Più usato (uso Showdown)'); if (s) sets.push(s); });
      }
      // Megaevoluzioni giocate: una voce separata nelle statistiche (es. "Charizard-Mega-Y")
      for (const k of Object.keys(d).filter(k => k.startsWith(sp.name + '-Mega'))) {
        const me = d[k]; if (!(me.usage >= MIN_USO && me['Raw count'] >= MIN_LOTTE)) continue; const ms = D.species.get(k); if (!ms.exists || !ms.requiredItem) continue;
        const tm = tierDi(ms.id); if (fmt === 'singolo' ? ['Uber', 'AG'].includes(tm.tier) : tm.doublesTier === 'DUber') continue;
        const s = crea(sp.name, me, D.items.get(ms.requiredItem).id, 'Mega (uso Showdown)'); if (s) { s.mega = ms.name; sets.push(s); }
      }
      if (sets.length) (out[name] = out[name] || {})[fmt] = sets;
    }
  }
  const head = '// Generato da scarica-champions-uso.js: set Champions dalle statistiche d\'uso di Pokémon Showdown pubblicate da Smogon (smogon.com/stats, ' + mese + ', lotte ' + SOGLIA + '+).\n';
  fs.writeFileSync(path.join(DIR, 'champions-uso-data.js'), head + 'const CHAMP_USO = ' + JSON.stringify(out) + ';\nconst CHAMP_USO_INFO = ' + JSON.stringify(info) + ';\n');
  const n = f => Object.values(out).filter(x => x[f]).length, ns = f => Object.values(out).reduce((a, x) => a + ((x[f] || []).length), 0);
  console.log('Mese ' + mese + ' (' + ou + ' / ' + vgc + '). Singolo: ' + n('singolo') + ' Pokémon, ' + ns('singolo') + ' set. Doppio: ' + n('doppio') + ' Pokémon, ' + ns('doppio') + ' set. Pool Champions: ' + pool.length + '.');
  for (const k of ['Greninja', 'Charizard', 'Incineroar', 'Garchomp']) if (out[k]) console.log(k, JSON.stringify(out[k]).slice(0, 400));
})().catch(e => { console.error(e); process.exit(1); });
