/* Descarga clips NUEVOS de Mixkit para un reel vertical 9:16.
   Solo material PREMIUM: nada de paisaje de naturaleza. Vertical de verdad.
   Uso:  node demo2/get-new-clips.mjs [max] [destino] */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MAX = Number(process.argv[2] || 8);
const OUT = process.argv[3] || 'assets/nuevo';
fs.mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const H = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

/* Paginas de Mixkit con material abstracto / noir / urbano: nada de naturaleza. */
const PAGES = [
  'https://mixkit.co/free-stock-video/smoke/',
  'https://mixkit.co/free-stock-video/ink-in-water/',
  'https://mixkit.co/free-stock-video/particles/',
  'https://mixkit.co/free-stock-video/light-leaks/',
  'https://mixkit.co/free-stock-video/abstract-background/',
  'https://mixkit.co/free-stock-video/neon/',
  'https://mixkit.co/free-stock-video/city-night/',
  'https://mixkit.co/free-stock-video/gold/',
  'https://mixkit.co/free-stock-video/liquid/',
  'https://mixkit.co/free-stock-video/portrait-of-a-man/',
];

/* Palabras de naturaleza: fuera, no encajan en un reel premium de estudio. */
const NATURE = /\b(sun|sunset|sunrise|palm|tree|trees|flower|flowers|wave|waves|sea|ocean|beach|hill|hills|mountain|cloud|clouds|sky|forest|grass|leaf|leaves|river|lake|rain|snow|butterfly|bee|bird|cat|dog|horse|food|coffee|beach)\b/i;

const FFPROBE = process.env.FFPROBE || 'ffprobe';
function probe(file) {
  try {
    const o = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim().split(/[,\n]/);
    const d = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
    const w = parseInt(o[0], 10), h = parseInt(o[1], 10), dur = parseFloat(d);
    if (!w || !h || !dur) return null;
    return { w, h, d: dur };
  } catch { return null; }
}

const H2 = { 'User-Agent': UA, Referer: 'https://mixkit.co/' };
const picked = [];
const seen = new Set();

for (const page of PAGES) {
  if (picked.length >= MAX) break;
  let ids = [];
  try {
    const html = await (await fetch(page, { headers: H })).text();
    for (const m of html.matchAll(/href="\/free-stock-video\/([a-z0-9-]+)-(\d+)\/"/gi)) {
      const slug = m[1], id = m[2];
      if (seen.has(id)) continue;
      if (NATURE.test(slug)) continue;
      seen.add(id);
      ids.push({ id, slug });
    }
  } catch (e) { console.log(`- ${page}: ${e.message}`); continue; }
  console.log(`- ${page.split('/').filter(Boolean).pop()}: ${ids.length} candidatos`);

  for (const c of ids) {
    if (picked.length >= MAX) break;
    let ok = false;
    for (const q of ['1080', '720']) {
      const url = `https://assets.mixkit.co/videos/${c.id}/${c.id}-${q}.mp4`;
      try {
        const r = await fetch(url, { headers: H2 });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 1200000 || buf.length > 26000000) continue;   /* ni polvo ni 100 MB */
        const tmp = path.join(OUT, `_tmp_${c.id}.mp4`);
        fs.writeFileSync(tmp, buf);
        const p = probe(tmp);
        if (!p || p.d < 4 || p.d > 40) { fs.rmSync(tmp, { force: true }); continue; }
        const vertical = p.h > p.w;
        const file = path.join(OUT, `${c.slug}.mp4`);
        fs.renameSync(tmp, file);
        try {
          execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '1.5', '-i', file, '-frames:v', '1',
            '-vf', 'scale=270:480:force_original_aspect_ratio=decrease,pad=270:480:(ow-iw)/2:(oh-ih)/2:color=0x0B0A08',
            file.replace(/\.mp4$/, '.jpg')]);
        } catch { /* preview opcional */ }
        picked.push({ file: path.basename(file), id: c.id, slug: c.slug, w: p.w, h: p.h, dur: +p.d.toFixed(1), vertical, mb: +(buf.length / 1048576).toFixed(1) });
        console.log(`  ${vertical ? 'V' : 'H'} ${picked[picked.length - 1].file.padEnd(34)} ${p.w}x${p.h} ${p.d.toFixed(1)}s ${picked[picked.length - 1].mb}MB`);
        ok = true;
        break;
      } catch { /* siguiente */ }
    }
    if (ok) continue;
  }
}

fs.writeFileSync(path.join(OUT, '_clips.json'), JSON.stringify(picked, null, 2));
console.log(`\n${picked.length} clips en ${OUT} (${picked.filter(c => c.vertical).length} verticales)`);
