/* Logos de marca de verdad: Wikidata P154 ("imagen del logo") -> fichero en
   Commons -> PNG. Una consulta por marca, con pausa (Wikimedia no gusta el
   abuseo). Valida que el PNG tenga recorte transparente.
   Uso:  node demo2/get-logos.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const BRANDS = [
  ['toyota', 'Toyota', 'automobile'],
  ['honda', 'Honda', 'automobile'],
  ['bmw', 'BMW', 'automobile'],
  ['mercedes', 'Mercedes-Benz', 'automobile'],
  ['porsche', 'Porsche', 'automobile'],
  ['nissan', 'Nissan', 'automobile'],
  ['lexus', 'Lexus', 'automobile'],
  ['ford', 'Ford Motor Company', 'automobile'],
  ['audi', 'Audi', 'automobile'],
  ['volkswagen', 'Volkswagen', 'automobile'],
];

const OUT = 'assets/logos';
fs.mkdirSync(OUT, { recursive: true });
const UA = { 'User-Agent': 'opencode-logos/1.0 (reel educativo)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const get = async (url, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.status === 429) { await sleep(4000 * (i + 1)); continue; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }
  throw new Error('429 (rate limit) tras ' + tries + ' intentos');
};
const q = o => new URLSearchParams({ format: 'json', origin: '*', ...o });

const credits = [];
for (const [slug, label, kind] of BRANDS) {
  try {
    /* 1) item de Wikidata de la marca: se prueban varios candidatos hasta que
       uno tenga P154 (imagen del logo) */
    const s = await get('https://www.wikidata.org/w/api.php?' + q({
      action: 'wbsearchentities', search: label, language: 'en', type: 'item', limit: '10',
    }));
    const cands = (s.search || []).filter(x => {
      const d = (x.description || '').toLowerCase();
      return /motor|automobile|automotive|car manufacturer|company|japanese|german/.test(d);
    });
    const ordered = [...cands, ...(s.search || [])];
    let fileName = null, usedItem = null;
    for (const c of ordered.slice(0, 6)) {
      const cl = await get('https://www.wikidata.org/w/api.php?' + q({
        action: 'wbgetclaims', entity: c.id, property: 'P154', format: 'json',
      }));
      const v = cl.claims?.P154?.[0]?.mainsnak?.datavalue?.value;
      if (v) { fileName = v; usedItem = c.id + ' (' + c.label + ')'; break; }
      await sleep(700);
    }
    if (!fileName) { console.log(`- ${slug}: ningun item con P154`); await sleep(900); continue; }
    if (!/^File:/i.test(fileName)) fileName = 'File:' + fileName;

    /* 3) URL del PNG en Commons */
    const info = await get('https://commons.wikimedia.org/w/api.php?' + q({
      action: 'query', titles: fileName, prop: 'imageinfo', iiprop: 'url|size', iiurlwidth: '520',
    }));
    const page = Object.values(info.query?.pages || {})[0];
    const ii = page?.imageinfo?.[0];
    if (!ii) { console.log(`- ${slug}: sin imageinfo para ${fileName}`); await sleep(900); continue; }
    const url = ii.thumburl || ii.url;

    const img = await fetch(url, { headers: UA });
    if (!img.ok) { console.log(`- ${slug}: descarga HTTP ${img.status}`); await sleep(900); continue; }
    const buf = Buffer.from(await img.arrayBuffer());
    const file = path.join(OUT, `${slug}.png`);
    fs.writeFileSync(file, buf);

    const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_entries', 'stream=pix_fmt,width,height', '-of', 'json', file]).toString());
    const st = meta.streams?.[0] || {};
    const pix = st.pix_fmt || '', w = st.width, h = st.height;

    /* recorte: convertimos a rgba y medimos el canal alfa */
    let cut = 0;
    try {
      const a = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'format=rgba,alphaextract,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { encoding: 'utf8' });
      cut = 100 - (parseFloat((a.match(/YAVG=([0-9.]+)/) || [])[1] ?? '255') / 2.55);
    } catch { cut = -1; }
    const s2 = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'], { encoding: 'utf8' });
    const bright = parseFloat((s2.match(/YAVG=([0-9.]+)/) || [])[1] ?? '255') / 255;

    credits.push({ slug, brand: label, file: path.basename(file), commons: fileName, w, h, bright: +bright.toFixed(2), invert: bright < 0.5 });
    console.log(`+ ${slug}.png  ${w}x${h}  ${pix}  recorte ${cut.toFixed(0)}%  brillo ${(bright * 100).toFixed(0)}%${bright < 0.5 ? '  (invertir a blanco)' : ''}  <- ${fileName}`);
    await sleep(1000);
  } catch (e) {
    console.log(`- ${slug}: ${e.message}`);
    await sleep(1200);
  }
}

fs.writeFileSync(path.join(OUT, 'CREDITOS.md'),
`# Logos de marcas

Descargados de Wikimedia Commons (fichero indicado abajo, obtenido via
Wikidata P154 "imagen del logo"). Cada logo es marca registrada de su titular y
se usa con fines editoriales (comentario / reel). La licencia concreta de cada
fichero esta en su pagina de Commons.

| fichero | marca | fichero en Commons | tamano | invertir a blanco |
|---|---|---|---|---|
${credits.map(c => `| ${c.file} | ${c.brand} | ${c.commons} | ${c.w}x${c.h} | ${c.invert ? 'si' : 'no'} |`).join('\n')}
`);
console.log(`\nlogos: ${credits.length}/${BRANDS.length}`);
