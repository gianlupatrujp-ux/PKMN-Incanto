// Pokémon Incanto: scarica in locale i font usati dal gioco (Google Fonts) e le loro licenze.
// Uso (Node.js 18+):  node scarica-font.js
// Produce: fonts/*.woff2, fonts/fonts.css (da collegare nella pagina), fonts/LICENZE/*.txt
// Così il sito non contatta i server di Google (meglio per la privacy dei visitatori).

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'fonts');
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&family=Luckiest+Guy&family=Cinzel+Decorative:wght@700;900&display=swap';
// Solo latino e latino esteso: bastano per italiano e inglese
const SUBSET = /\/\* (latin|latin-ext) \*\//;
const LICENZE = {
  'Inter-OFL.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt',
  'SpaceGrotesk-OFL.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/OFL.txt',
  'CinzelDecorative-OFL.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/cinzeldecorative/OFL.txt',
  'LuckiestGuy-LICENSE-Apache-2.0.txt': 'https://raw.githubusercontent.com/google/fonts/main/apache/luckiestguy/LICENSE.txt',
};

async function main() {
  fs.mkdirSync(path.join(DIR, 'LICENZE'), { recursive: true });
  // Con un browser moderno come "User-Agent" Google restituisce i font in formato woff2
  const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' } })).text();
  const blocchi = css.split('@font-face').slice(1).map(b => '@font-face' + b);
  let out = '/* Generato da scarica-font.js: font ospitati in locale (licenze in fonts/LICENZE) */\n';
  let n = 0;
  for (let i = 0; i < blocchi.length; i++) {
    const commento = (css.split('@font-face')[i].match(/\/\* [a-z-]+ \*\//g) || []).pop() || '';
    if (!SUBSET.test(commento)) continue;
    const b = blocchi[i];
    const fam = b.match(/font-family: '([^']+)'/)[1], peso = (b.match(/font-weight: (\d+)/) || [, '400'])[1];
    const url = b.match(/url\((https:[^)]+\.woff2)\)/)[1];
    const nome = fam.replace(/\s+/g, '') + '-' + peso + '-' + commento.replace(/[^a-z-]/g, '') + '.woff2';
    const dest = path.join(DIR, nome);
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, Buffer.from(await (await fetch(url)).arrayBuffer()));
    out += commento + '\n' + b.replace(url, nome).trim() + '\n';
    n++;
  }
  fs.writeFileSync(path.join(DIR, 'fonts.css'), out);
  for (const [f, u] of Object.entries(LICENZE)) {
    const r = await fetch(u);
    if (!r.ok) throw new Error('Licenza non trovata: ' + u);
    fs.writeFileSync(path.join(DIR, 'LICENZE', f), await r.text());
  }
  console.log('Fatto: ' + n + ' file di font e ' + Object.keys(LICENZE).length + ' licenze in fonts/.');
}

main().catch(e => { console.error('Errore: ' + e.message); process.exit(1); });
