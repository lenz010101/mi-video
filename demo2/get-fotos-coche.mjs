/* Fotos de coche por marca (para el set del reel): se toma la imagen principal
   del articulo de Wikipedia del MODELO (foto real del coche, licencia libre).
   Uso:  node demo2/get-fotos-coche.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MODELOS = [
  ['toyota', 'Toyota Camry', 'TOYOTA'],
  ['honda', 'Honda Civic', 'HONDA'],
  ['bmw', 'BMW 3 Series', 'BMW'],
  ['mercedes', 'Mercedes-Benz C-Class', 'MERCEDES'],
  ['porsche', 'Porsche 911', 'PORSCHE'],
  ['nissan', 'Nissan Leaf', 'NISSAN'],
];

const OUT = 'assets/coches';
fs.mkdirSync(OUT, { recursive: true });
const UA = { 'User-Agent': 'opencode-fotos/1.0 (reel educativo)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const credits = [];

for (const [slug, modelo, marca] of MODELOS) {
  try {
    const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(modelo), { headers: UA });
    if (!r.ok) { console.log(`- ${slug}: HTTP ${r.status}`); await sleep(1200); continue; }
    const j = await r.json();
    /* la foto grande: se resuelve el fichero original en Commons a 1600 px */
    let url = j.originalimage?.source;
    if (url) {
      const q = new URLSearchParams({
        action: 'query', format: 'json', origin: '*',
        titles: 'File:' + decodeURIComponent(url.split('/').pop()),
        prop: 'imageinfo', iiprop: 'url', iiurlwidth: '1600',
      });
      const ir = await fetch('https://commons.wikimedia.org/w/api.php?' + q, { headers: UA });
      if (ir.ok) {
        const ij = await ir.json();
        const pg = Object.values(ij.query?.pages || {})[0];
        const ii = pg?.imageinfo?.[0];
        if (ii?.thumburl) url = ii.thumburl;
      }
      await sleep(900);
    } else {
      url = j.thumbnail?.source;
    }
    if (!url) { console.log(`- ${slug}: sin imagen`); await sleep(1200); continue; }
    const img = await fetch(url, { headers: UA });
    if (!img.ok) { console.log(`- ${slug}: descarga HTTP ${img.status}`); await sleep(1200); continue; }
    const buf = Buffer.from(await img.arrayBuffer());
    const file = path.join(OUT, `${slug}.jpg`);
    fs.writeFileSync(file, buf);

    /* la foto debe ser apaisada y grande: se pide el thumbnail grande */
    const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_entries', 'stream=width,height', '-of', 'json', file]).toString());
    const st = meta.streams?.[0] || {};
    const w = st.width, h = st.height;
    if (!w || w / h < 1.2) { console.log(`- ${slug}: no es apaisada (${w}x${h})`); await sleep(1000); continue; }
    credits.push({ slug, marca, modelo, file: path.basename(file), w, h, autor: j.originalimage?.source || url });
    console.log(`+ ${slug}.jpg  ${w}x${h}  <- ${modelo}`);
    await sleep(1100);
  } catch (e) {
    console.log(`- ${slug}: ${e.message}`);
    await sleep(1200);
  }
}
fs.writeFileSync(path.join(OUT, 'CREDITOS.md'),
`# Fotos de coches

Imagen principal del articulo de Wikipedia de cada modelo (licencia libre,
credito en la pagina del articulo). Se usan con fines editoriales (reel).

| fichero | marca | modelo | tamano | origen |
|---|---|---|---|---|
${credits.map(c => `| ${c.file} | ${c.marca} | ${c.modelo} | ${c.w}x${c.h} | ${c.autor} |`).join('\n')}
`);
console.log('\nfotos: ' + credits.length + '/' + MODELOS.length);
