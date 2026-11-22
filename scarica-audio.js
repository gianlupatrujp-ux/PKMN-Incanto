// Pokémon Incanto: scarica da Pokémon Showdown le musiche di battaglia e i versi dei Pokémon usati nella lotta.
// Uso (Node.js 18+, dopo scarica-pokemon.js e scarica-sprite.js):  node scarica-audio.js
// Produce: audio/*.mp3 (musiche), audio/cries/*.mp3 (versi), audio-data.js (const AUDIO_DATA: musiche con i punti di loop).
// Musiche e versi sono opere di Nintendo / Creatures Inc. / GAME FREAK inc. / The Pokémon Company: uso amatoriale,
// gratuito, senza scopo di lucro, rimossi su richiesta dei titolari (vedi note legali). Se interrompi, rilancia.

const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const BASE = 'https://play.pokemonshowdown.com/';
const CONCORRENZA = 6;
const toId = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

// Le 15 musiche che Showdown usa a rotazione nelle lotte, con inizio e fine del loop in millisecondi
// (valori presi da play.pokemonshowdown.com/src/battle-animations.ts, setBgm)
const MUSICHE = [
  ['dpp-trainer', 13440, 96959], ['dpp-rival', 13888, 66352], ['hgss-johto-trainer', 23731, 125086],
  ['hgss-kanto-trainer', 13003, 94656], ['bw-trainer', 14629, 110109], ['bw-rival', 19180, 57373],
  ['bw-subway-trainer', 15503, 110984], ['bw2-kanto-gym-leader', 14626, 58986], ['bw2-rival', 7152, 68708],
  ['xy-trainer', 7802, 82469], ['xy-rival', 7802, 58634], ['oras-trainer', 13579, 91548],
  ['oras-rival', 14303, 69149], ['sm-trainer', 8323, 89230], ['sm-rival', 11389, 62158],
];

// Regole di Showdown per il nome del verso (play.pokemonshowdown.com/src/battle-dex.ts, getSpriteData)
const FORME_SPECIALI = ['-bloodmoon', '-crowned', '-eternal', '-eternamax', '-four', '-hangry', '-hero', '-lowkey', '-noice', '-primal', '-rapidstrike', '-roaming', '-school', '-sky', '-starter', '-super', '-therian', '-unbound'];
const BASI_SPECIALI = ['calyrex', 'kyurem', 'cramorant', 'indeedee', 'lycanroc', 'necrozma', 'oinkologne', 'oricorio', 'slowpoke', 'tatsugiri', 'zygarde'];
function cryId(d) {
  const base = toId(d.baseSpecies || d.name); let id = base;
  const formeid = d.forme ? '-' + toId(d.forme) : '';
  const mega = /^Mega/.test(d.forme || '');
  if (mega || (formeid && (FORME_SPECIALI.includes(formeid) || BASI_SPECIALI.includes(base)))) id += (mega && (base === 'meowstic' || base === 'tatsugiri')) ? '-mega' : formeid;
  return id;
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
async function pokedex() {
  const cache = path.join(DIR, 'cache');
  const f = fs.existsSync(cache) && fs.readdirSync(cache).find(x => x.startsWith('showdown_') && x.includes('pokedex_json'));
  if (f) return JSON.parse(fs.readFileSync(path.join(cache, f), 'utf8'));
  const r = await fetch(BASE + 'data/pokedex.json'); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
}

async function main() {
  if (typeof fetch !== 'function') { console.error('Serve Node.js 18 o più recente.'); process.exit(1); }
  fs.mkdirSync(path.join(DIR, 'audio', 'cries'), { recursive: true });
  console.log('Scarico ' + MUSICHE.length + ' musiche di battaglia...');
  const musiche = [];
  for (const [nome, inizio, fine] of MUSICHE) {
    if (await scaricaFile(BASE + 'audio/' + nome + '.mp3', path.join(DIR, 'audio', nome + '.mp3'))) musiche.push({ file: 'audio/' + nome + '.mp3', inizio, fine });
    else console.log('  manca: ' + nome);
  }
  // versi: tutti i Pokémon del pool e le forme di lotta che hanno uno sprite (sprite-data.js)
  const dex = await pokedex();
  const nomi = new Set(JSON.parse(fs.readFileSync(path.join(DIR, 'pokemon.json'), 'utf8')).map(p => p.name));
  try { const sd = fs.readFileSync(path.join(DIR, 'sprite-data.js'), 'utf8'); for (const k of Object.keys(JSON.parse(sd.slice(sd.indexOf('{'), sd.lastIndexOf('}') + 1)))) nomi.add(k); } catch (e) {}
  const ids = [...new Set([...nomi].map(n => dex[toId(n)]).filter(d => d && d.num > 0).map(cryId))];
  console.log('Scarico ' + ids.length + ' versi...');
  const mancanti = []; let i = 0;
  await Promise.all(Array.from({ length: CONCORRENZA }, async () => {
    for (;;) { const id = ids[i++]; if (!id) return;
      if (!await scaricaFile(BASE + 'audio/cries/' + id + '.mp3', path.join(DIR, 'audio', 'cries', id + '.mp3'))) mancanti.push(id); }
  }));
  // Suoni classici dei colpi (normale, super efficace, poco efficace), statistiche e KO: Showdown non li ha; vengono dal
  // repository pubblico di PokéRogue (github.com/pagefaultgames/pokerogue-assets, cartella audio/se), che li indica come
  // materiale di Nintendo / Creatures / GAME FREAK usato in fair use.
  fs.mkdirSync(path.join(DIR, 'audio', 'se'), { recursive: true });
  const SE = ['hit', 'hit_strong', 'hit_weak', 'stat_up', 'stat_down', 'faint'], se = [];
  for (const n of SE) if (await scaricaFile('https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/audio/se/' + n + '.wav', path.join(DIR, 'audio', 'se', n + '.wav'))) se.push(n);
  console.log('Suoni dei colpi: ' + se.length + '/' + SE.length);
  fs.writeFileSync(path.join(DIR, 'audio-data.js'), '// Generato da scarica-audio.js\nconst AUDIO_DATA = ' + JSON.stringify({ musiche }) + ';\n');
  let byte = 0; for (const d of ['audio', 'audio/cries']) for (const f of fs.readdirSync(path.join(DIR, d))) { const p = path.join(DIR, d, f); if (fs.statSync(p).isFile()) byte += fs.statSync(p).size; }
  console.log('\nFatto: ' + musiche.length + ' musiche, ' + (ids.length - mancanti.length) + ' versi (' + (byte / 1048576).toFixed(1) + ' MB).' + (mancanti.length ? '\nVersi non trovati (' + mancanti.length + '): ' + mancanti.join(', ') : ''));
}
// Mappa nome del Pokémon del gioco → file del verso (per l'asta "per verso"). Uso: node scarica-audio.js --mappa
async function mappaVersi() {
  const dex = await pokedex(), vm = require('vm'), c = {}; vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(DIR, 'pokemon-data.js'), 'utf8').replace(/^const /m, 'var '), c);
  const out = {}, manca = [];
  for (const p of c.POKEMON_DATA) { const d = dex[toId(p.name)]; const id = d ? cryId(d) : null;
    if (id && fs.existsSync(path.join(DIR, 'audio', 'cries', id + '.mp3'))) out[p.name] = id; else manca.push(p.name); }
  fs.writeFileSync(path.join(DIR, 'versi-data.js'), '// Generato da scarica-audio.js --mappa: file del verso di ogni Pokémon (audio/cries/<id>.mp3)\nconst CRY_DATA = ' + JSON.stringify(out) + ';\n');
  console.log('Versi: ' + Object.keys(out).length + '/' + c.POKEMON_DATA.length + (manca.length ? ' - mancano: ' + manca.join(', ') : ''));
}
if (require.main === module && process.argv.includes('--mappa')) mappaVersi().catch(e => { console.error(e); process.exit(1); });
else if (require.main === module) main().catch(e => { console.error('\nErrore: ' + e.message + '\nRilancia lo script: riparte da dove si era fermato.'); process.exit(1); });
module.exports = { cryId };
