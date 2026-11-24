// Genera statistiche-data.js: le statistiche base (PS, Att, Dif, AttSp, DifSp, Vel) di ogni Pokémon del gioco,
// usate dal computer per valutare i Pokémon all'asta. Fonte: il simulatore di Pokémon Showdown già nel progetto
// (lib/pkmn-sim.js, licenza MIT): nessun download. Uso: node genera-statistiche.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console }; ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'lib', 'pkmn-sim.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'pokemon-data.js'), 'utf8') + ';this.POKEMON_DATA=POKEMON_DATA;', ctx);
const Dex = ctx.PkmnSim.Dex, out = {}, mancanti = [];
for (const p of ctx.POKEMON_DATA) {
  const s = Dex.species.get(p.name);
  if (!s || !s.exists) { mancanti.push(p.name); continue; }
  const b = s.baseStats; out[p.name] = [b.hp, b.atk, b.def, b.spa, b.spd, b.spe];
}
fs.writeFileSync(path.join(__dirname, 'statistiche-data.js'),
  '// Generato da genera-statistiche.js: statistiche base [PS, Att, Dif, AttSp, DifSp, Vel] dal simulatore di Pokémon Showdown (MIT).\n' +
  'const STAT_DATA = ' + JSON.stringify(out) + ';\n');
console.log('Pokémon con statistiche:', Object.keys(out).length, mancanti.length ? '— mancanti: ' + mancanti.join(', ') : '— nessuno mancante');
