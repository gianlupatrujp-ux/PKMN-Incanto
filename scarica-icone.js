// Scarica il foglio delle icone dei Pokémon di Pokémon Showdown e prepara icone-data.js
// (posizione dell'icona di ogni Pokémon nel foglio: 12 icone da 40x30 per riga).
// Uso: node scarica-icone.js <cartella del pacchetto @pkmn/img>
//   (es. "npm pack @pkmn/img" in una cartella temporanea e poi estrarre il .tgz: serve la cartella "package")
// Le posizioni vengono dalla tabella del pacchetto @pkmn/img (MIT, github.com/pkmn/ps).
// Le icone sono © Nintendo/Creatures/GAME FREAK/The Pokémon Company e degli autori della community di Showdown: uso non commerciale.
const fs = require('fs'), path = require('path'), https = require('https');
const pkg = process.argv[2];
if (!pkg) { console.error('Indica la cartella del pacchetto @pkmn/img'); process.exit(1); }
const { Icons } = require(path.resolve(pkg, 'build', 'index.js'));
const read = (f, k) => { const g = {}; new Function('g', fs.readFileSync(f, 'utf8').replace('const ' + k, 'g.' + k))(g); return g[k]; };
const names = new Set([...read('pokemon-data.js', 'POKEMON_DATA').map(p => p.name), ...Object.keys(read('sprite-data.js', 'SPRITE_DATA'))]);
try { const M = read('mega-data.js', 'MEGA_DATA'); for (const k of Object.keys(M || {})) names.add(k); } catch (e) {}
const out = {}, miss = [];
for (const n of [...names].sort()) {
  const ic = Icons.getPokemon(n);
  if (!ic || ic.left === undefined) { miss.push(n); continue; }
  out[n] = (-ic.top / 30) * 12 + (-ic.left / 40);
  if (out[n] === 0) miss.push(n);   // 0 = punto interrogativo: icona mancante
}
fs.writeFileSync('icone-data.js', '// Generato da scarica-icone.js: indice dell\'icona nel foglio sprites/pokemonicons-sheet.png (12 per riga, 40x30)\nconst ICON_DATA = ' + JSON.stringify(out) + ';\n');
console.log('Icone:', Object.keys(out).length, 'senza icona:', miss.join(', ') || 'nessuno');
https.get('https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png', r => {
  if (r.statusCode !== 200) { console.error('Errore download', r.statusCode); return; }
  r.pipe(fs.createWriteStream(path.join('sprites', 'pokemonicons-sheet.png'))).on('finish', () => console.log('Foglio salvato in sprites/pokemonicons-sheet.png'));
});
