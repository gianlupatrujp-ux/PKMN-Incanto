// Pokémon Incanto: scarica gli sprite dei Pokémon da Pokémon Showdown in una cartella locale.
// Uso (serve Node.js 18+, e prima va lanciato scarica-pokemon.js):  node scarica-sprite.js
// Stile scelto: animati 3D (cartella "ani" di Showdown, GIF). Se un Pokémon non ce l'ha si usa lo sprite
// in pixel stile Nero/Bianco (cartella "gen5", PNG).
// Produce: sprites/ani/*.gif, sprites/gen5/*.png, sprite-data.js (const SPRITE_DATA = { nomeShowdown: percorso }).
// Gli sprite restano proprietà di Nintendo/Game Freak/The Pokémon Company (alcuni sono fatti dalla community):
// uso solo amatoriale e non commerciale. Se interrompi, rilancia: i file già scaricati vengono saltati.

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SPRITE_DIR = path.join(DIR, 'sprites');
const BASE = 'https://play.pokemonshowdown.com/sprites/';
const STILI = [['ani', 'gif'], ['gen5', 'png']]; // in ordine di preferenza
const EXTRA = ['vivillon-icysnow']; // sprite in più usati dall'interfaccia (Vivillon bianco della schermata iniziale)
const CONCORRENZA = 6;

const toId = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

async function pokedex() {
  const cache = path.join(DIR, 'cache');
  const f = fs.existsSync(cache) && fs.readdirSync(cache).find(x => x.startsWith('showdown_') && x.includes('pokedex_json'));
  if (f) return JSON.parse(fs.readFileSync(path.join(cache, f), 'utf8'));
  const r = await fetch('https://play.pokemonshowdown.com/data/pokedex.json');
  if (!r.ok) throw new Error('HTTP ' + r.status + ' scaricando il Pokédex di Showdown');
  return r.json();
}

// Nome del file sprite su Showdown: specie base + "-" + forma, es. "ninetales-alola", "tauros-paldeacombat"
function spriteId(dex, nome) {
  const d = dex[toId(nome)];
  if (!d) return toId(nome);
  return d.forme ? toId(d.baseSpecies) + '-' + toId(d.forme) : toId(d.name);
}

async function scaricaFile(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return true;
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(url);
      if (r.status === 404) return false;
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      return true;
    } catch (e) { if (t === 3) throw new Error(e.message + ' per ' + url); await new Promise(res => setTimeout(res, 700 * t * t)); }
  }
}

async function main() {
  if (typeof fetch !== 'function') { console.error('Serve Node.js 18 o più recente.'); process.exit(1); }
  for (const [s] of STILI) fs.mkdirSync(path.join(SPRITE_DIR, s), { recursive: true });
  const pool = JSON.parse(fs.readFileSync(path.join(DIR, 'pokemon.json'), 'utf8'));
  const dex = await pokedex();
  const voci = [...pool.map(p => ({ chiave: p.name, id: spriteId(dex, p.name) })), ...EXTRA.map(id => ({ chiave: id, id }))];

  console.log('Scarico gli sprite di ' + voci.length + ' Pokémon...');
  const mappa = {}, mancanti = [], ripiego = [];
  let i = 0, fatti = 0;
  await Promise.all(Array.from({ length: CONCORRENZA }, async () => {
    for (;;) {
      const v = voci[i++];
      if (!v) return;
      for (const [stile, ext] of STILI) {
        const rel = 'sprites/' + stile + '/' + v.id + '.' + ext;
        if (await scaricaFile(BASE + stile + '/' + v.id + '.' + ext, path.join(DIR, rel))) {
          mappa[v.chiave] = rel;
          if (stile !== STILI[0][0]) ripiego.push(v.chiave);
          break;
        }
      }
      if (!mappa[v.chiave]) mancanti.push(v.chiave);
      if (++fatti % 100 === 0) console.log('  ' + fatti + '/' + voci.length);
    }
  }));

  // Versioni shiny (stessa cartella con "-shiny", es. sprites/ani-shiny/garchomp.gif): il gioco le usa quando esce
  // un Pokémon shiny, senza dover contattare siti esterni.
  console.log('Scarico le versioni shiny...');
  const shinyMancanti = [];
  const daFare = pool.filter(p => mappa[p.name]).map(p => mappa[p.name]);
  let j = 0;
  await Promise.all(Array.from({ length: CONCORRENZA }, async () => {
    for (;;) {
      const rel = daFare[j++];
      if (!rel) return;
      const relShiny = rel.replace(/^sprites\/(ani|gen5)\//, 'sprites/$1-shiny/');
      fs.mkdirSync(path.dirname(path.join(DIR, relShiny)), { recursive: true });
      if (!await scaricaFile(BASE + relShiny.slice('sprites/'.length), path.join(DIR, relShiny))) shinyMancanti.push(rel);
    }
  }));
  if (shinyMancanti.length) console.log('Shiny non trovati (' + shinyMancanti.length + '): ' + shinyMancanti.join(', '));

  // Sprite di schiena per la lotta (il proprio Pokémon si vede da dietro): stessa cartella con "-back"
  // (sprites/ani-back, sprites/ani-back-shiny, sprites/gen5-back...). Se manca, la lotta usa quello frontale girato.
  console.log('Scarico gli sprite di schiena...');
  const backMancanti = [];
  const daFareBack = [];
  for (const rel of daFare) { daFareBack.push(rel.replace(/^sprites\/(ani|gen5)\//, 'sprites/$1-back/'), rel.replace(/^sprites\/(ani|gen5)\//, 'sprites/$1-back-shiny/')); }
  let b = 0;
  await Promise.all(Array.from({ length: CONCORRENZA }, async () => {
    for (;;) {
      const rel = daFareBack[b++];
      if (!rel) return;
      fs.mkdirSync(path.dirname(path.join(DIR, rel)), { recursive: true });
      if (!await scaricaFile(BASE + rel.slice('sprites/'.length), path.join(DIR, rel))) backMancanti.push(rel);
    }
  }));
  if (backMancanti.length) console.log('Di schiena non trovati (' + backMancanti.length + '): ' + backMancanti.slice(0, 30).join(', ') + (backMancanti.length > 30 ? '...' : ''));

  // Forme che compaiono solo in lotta (Mimikyu-Busted, Megaevoluzioni, Aegislash-Blade, Minior-Meteor, Palafin-Hero,
  // Ogerpon/Terapagos teracristallizzati...) dei Pokémon del pool: servono alla lotta dentro il gioco (lotta.js).
  // Niente Gigamax e Totem, che nei nostri formati non esistono.
  console.log('Scarico le forme di lotta...');
  const basi = new Set(pool.map(p => (dex[toId(p.name)] || {}).baseSpecies || p.name));
  const forme = Object.values(dex).filter(d => d && d.name && basi.has(d.baseSpecies || d.name) && !pool.some(p => p.name === d.name)
    && (d.battleOnly || d.changesFrom || /^(Mega|Primal)/.test(d.forme || '')) && !/Gmax|Totem/.test(d.forme || '') && d.num > 0);
  const formeMancanti = [];
  let f = 0;
  await Promise.all(Array.from({ length: CONCORRENZA }, async () => {
    for (;;) {
      const d = forme[f++];
      if (!d) return;
      const id = spriteId(dex, d.name);
      for (const [stile, ext] of STILI) {
        const rel = 'sprites/' + stile + '/' + id + '.' + ext;
        if (await scaricaFile(BASE + stile + '/' + id + '.' + ext, path.join(DIR, rel))) {
          mappa[d.name] = rel;
          for (const v of ['-shiny', '-back', '-back-shiny']) {
            fs.mkdirSync(path.join(SPRITE_DIR, stile + v), { recursive: true });
            await scaricaFile(BASE + stile + v + '/' + id + '.' + ext, path.join(DIR, 'sprites/' + stile + v + '/' + id + '.' + ext));
          }
          break;
        }
      }
      if (!mappa[d.name]) formeMancanti.push(d.name);
    }
  }));
  console.log('Forme di lotta: ' + (forme.length - formeMancanti.length) + '/' + forme.length + (formeMancanti.length ? ' (mancano: ' + formeMancanti.join(', ') + ')' : ''));

  // Icone degli strumenti (un solo foglio con tutte le icone 24x24, 16 per riga; la posizione è "spritenum" nei dati di Showdown)
  await scaricaFile(BASE + 'itemicons-sheet.png', path.join(SPRITE_DIR, 'itemicons-sheet.png'));

  fs.writeFileSync(path.join(DIR, 'sprite-data.js'), '// Generato da scarica-sprite.js\nconst SPRITE_DATA = ' + JSON.stringify(mappa) + ';\n');
  let byte = 0;
  for (const s of fs.readdirSync(SPRITE_DIR)) { const p = path.join(SPRITE_DIR, s);
    if (fs.statSync(p).isDirectory()) { for (const f of fs.readdirSync(p)) byte += fs.statSync(path.join(p, f)).size; } else byte += fs.statSync(p).size; }
  console.log('\nFatto: ' + Object.keys(mappa).length + ' sprite (' + (byte / 1048576).toFixed(1) + ' MB).');
  if (ripiego.length) console.log('In pixel perché manca l\'animato (' + ripiego.length + '): ' + ripiego.join(', '));
  if (mancanti.length) console.log('SENZA sprite (' + mancanti.length + '): ' + mancanti.join(', '));
}

if (require.main === module) main().catch(e => { console.error('\nErrore: ' + e.message + '\nRilancia lo script: riparte da dove si era fermato.'); process.exit(1); });
module.exports = { main };
