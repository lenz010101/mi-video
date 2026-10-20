/* Descarga tipografias de Google Fonts (OFL) para el set de motion graphics:
     Orbitron (neon/techno), Anton (sticker de papel rasgado) y
     Playfair Display (texto elegante con glow).
   Uso:  node demo2/get-fonts.mjs */
import fs from 'node:fs';
import path from 'node:path';

const FAMILIES = [
  ['Orbitron', 'Orbitron:wght@700'],
  ['Anton', 'Anton'],
  ['Playfair+Display', 'Playfair+Display:wght@600'],
];
const OUT = 'assets/fonts';
fs.mkdirSync(OUT, { recursive: true });
/* UA moderno para que Google Fonts devuelva woff2 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const cssParts = [];
for (const [slug, spec] of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  /* se queda con el bloque latin (el ultimo: no tiene unicode-range) */
  const blocks = css.split('@font-face').filter(b => b.includes('url('));
  let saved = 0;
  for (const b of blocks) {
    const family = (b.match(/font-family:\s*'([^']+)'/) || [])[1];
    const weight = (b.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
    const src = (b.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    /* solo el subconjunto latin: es el que tiene los glifos que usamos */
    const range = (b.match(/unicode-range:\s*([^;]+)/) || [])[1] || '';
    if (!/U\+0000-00FF/.test(range)) continue;
    if (!src) continue;
    const name = `${slug.toLowerCase().replace(/\s+/g, '-')}-${weight}.woff2`;
    const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer());
    fs.writeFileSync(path.join(OUT, name), buf);
    cssParts.push(`@font-face {
  font-family: '${family}';
  font-style: normal;
  font-weight: ${weight};
  font-display: block;
  src: url('./${name}') format('woff2');
}`);
    saved++;
    console.log(`+ ${name}  ${(buf.length / 1024).toFixed(0)} KB  (${family} ${weight})`);
  }
  if (!saved) console.log(`- ${slug}: no se descargo ninguna variante`);
}
fs.writeFileSync(path.join(OUT, 'fonts-extra.css'), cssParts.join('\n') + '\n');
console.log('\nCSS: assets/fonts/fonts-extra.css');
