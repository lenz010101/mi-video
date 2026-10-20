/* Busca clips libres de "otra persona" (distinta a la del video de referencia)
   en Mixkit: presenters, mujeres, gente hablando a camara en vertical 9:16.
   Descarga candidatos y deja un frame de vista previa de cada uno.
   Uso:  node demo2/get-clip-person.mjs [maximo]
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MAX = Number(process.argv[2] || 8);
const OUT = 'assets/clips/candidates';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const H = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

/* paginas distintas de las del script del hombre: otra persona, no el mismo presentador */
const pages = [
  'https://mixkit.co/free-stock-video/?q=woman+talking+to+camera',
  'https://mixkit.co/free-stock-video/?q=confident+woman',
  'https://mixkit.co/free-stock-video/?q=businesswoman',
  'https://mixkit.co/free-stock-video/?q=woman+portrait',
  'https://mixkit.co/free-stock-video/?q=presenter+woman',
  'https://mixkit.co/free-stock-video/?q=woman+smiling',
  'https://mixkit.co/free-stock-video/portrait-of-a-woman/',
  'https://mixkit.co/free-stock-video/woman-talking/',
  'https://mixkit.co/free-stock-video/business-woman/',
];

const seen = new Map();
for (const p of pages) {
  try {
    const html = await (await fetch(p, { headers: H })).text();
    for (const m of html.matchAll(/href="\/free-stock-video\/([a-z0-9-]+)-(\d+)\/[^"]*"[^>]*>\s*(?:<[^>]+>\s*)*([^<]{6,90})/gi)) {
      const id = m[2];
      if (!seen.has(id)) seen.set(id, { id, slug: m[1], title: m[3].trim() });
    }
    for (const m of html.matchAll(/assets\.mixkit\.co\/videos\/(\d+)\//g)) {
      const id = m[1];
      if (!seen.has(id)) seen.set(id, { id, slug: '', title: 'clip ' + id });
    }
  } catch (e) { console.log(`- ${p}: ${e.message}`); }
}
console.log(`candidatos encontrados: ${seen.size}`);

const UA2 = { 'User-Agent': UA, Referer: 'https://mixkit.co/' };
let n = 0;
for (const c of [...seen.values()]) {
  if (n >= MAX) break;
  let got = false;
  for (const q of ['1080', '720', '360']) {
    const url = `https://assets.mixkit.co/videos/${c.id}/${c.id}-${q}.mp4`;
    try {
      const r = await fetch(url, { headers: UA2 });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 400000) continue;
      const file = path.join(OUT, `p_${c.id}.mp4`);
      fs.writeFileSync(file, buf);
      const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_name', '-of', 'default=nw=1', file]).toString();
      const w = +(probe.match(/width=(\d+)/) || [])[1];
      const h = +(probe.match(/height=(\d+)/) || [])[1];
      const dur = +(probe.match(/duration=([\d.]+)/) || [])[1];
      const ratio = w / h;
      if (!(ratio > 0.5 && ratio < 0.7)) { fs.unlinkSync(file); continue; }   /* solo 9:16 */
      if (dur < 8) { fs.unlinkSync(file); continue; }
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.min(2, dur / 2)), '-i', file, '-frames:v', '1', path.join(OUT, `p_${c.id}.jpg`)]);
      console.log(`+ p_${c.id}.mp4  ${w}x${h}  ${dur.toFixed(1)}s  ${(buf.length / 1e6).toFixed(1)}MB  <- ${c.title || c.slug}`);
      got = true; n++;
      break;
    } catch { /* siguiente resolucion */ }
  }
  if (!got && c.title) console.log(`- ${c.id}: no descargado (${c.title})`);
}
console.log(`\ndescargados: ${n}`);
