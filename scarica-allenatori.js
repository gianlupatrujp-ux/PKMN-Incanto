// Pokémon Incanto: scarica da Pokémon Showdown le immagini degli allenatori usate come avatar del profilo.
// Uso (Node.js 18+):  node scarica-allenatori.js
// Produce: sprites/trainers/<nome>.png (80x80). L'elenco dei nomi è lo stesso di avatar.js (Avatar.trainers).
// Le immagini sono © Nintendo / Creatures Inc. / GAME FREAK inc. / The Pokémon Company: uso amatoriale e non
// commerciale, rimosse su richiesta. Se interrompi, rilancia: i file già scaricati vengono saltati.
const fs = require('fs');
const path = require('path');
global.document = undefined;
const Avatar = require('./avatar.js');
const DIR = path.join(__dirname, 'sprites', 'trainers');
const BASE = 'https://play.pokemonshowdown.com/sprites/trainers/';
const CONCORRENZA = 8;

async function scarica(nome) {
  const dest = path.join(DIR, nome + '.png');
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'già presente';
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(BASE + nome + '.png');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.toString('ascii', 1, 4) !== 'PNG') throw new Error('non è un PNG');
      fs.writeFileSync(dest, b); return 'ok';
    } catch (e) { if (t === 3) return 'ERRORE ' + e.message; }
  }
}

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const nomi = Avatar.trainers.slice();
  let errori = 0;
  for (let i = 0; i < nomi.length; i += CONCORRENZA) {
    const parte = nomi.slice(i, i + CONCORRENZA);
    const esiti = await Promise.all(parte.map(scarica));
    parte.forEach((n, j) => { if (esiti[j].startsWith('ERRORE')) errori++; console.log(n + ': ' + esiti[j]); });
  }
  console.log(errori ? errori + ' errori: rilancia lo script.' : 'Fatto: ' + nomi.length + ' allenatori.');
})();
