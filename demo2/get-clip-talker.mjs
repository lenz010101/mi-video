/* Busca clips libres de "alguien hablando a camara" en Mixkit, baja los
   candidatos y deja un frame de vista previa para elegir.
   Uso:  node demo2/get-clip-talker.mjs [maximo] */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MAX = Number(process.argv[2] || 6);
const OUT = 'assets/clips';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const H = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

const pages = [
  'https://mixkit.co/free-stock-video/talking-to-camera/',
  'https://mixkit.co/free-stock-video/portrait-of-a-man/',
  'https://mixkit.co/free-stock-video/man-portrait/',
  'https://mixkit.co/free-stock-video/businessman/',
  'https://mixkit.co/free-stock-video/presenting/',
  'https://mixkit.co/free-stock-video/office-man/',
];

const seen = new Map();
for (const p of pages) {
  try {
    const html = await (await fetch(p, { headers: H })).text();
    /* cada item del grid: titulo + id del video */
    for (const m of html.matchAll(/href="\/free-stock-video\/([a-z0-9-]+)-(\d+)\/"[^>]*>\s*(?:<[^>]+>\s*)*([^<]{6,90})/gi)) {
      const slug = m[1], id = m[2], title = m[3].trim();
      if (!seen.has(id)) seen.set(id, { id, slug, title });
    }
    /* tambien los .mp4 sueltos que aparecen en la pagina */
    for (const m of html.matchAll(/assets\.mixkit\.co\/videos\/(\d+)\//g)) {
      const id = m[1];
      if (!seen.has(id)) seen.set(id, { id, slug: '', title: 'clip ' + id });
    }
  } catch (e) { console.log(`- ${p}: ${e.message}`); }
}
console.log(`candidatos: ${seen.size}`);

const UA2 = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', Referer: 'https://mixkit.co/' };
let n = 0;
for (const c of [...seen.values()].slice(0, MAX * 4)) {
  if (n >= MAX) break;
  /* se prueban las resoluciones de mayor a menor */
  let got = null;
  for (const q of ['1080', '720', '360']) {
    const url = `https://assets.mixkit.co/videos/${c.id}/${c.id}-${q}.mp4`;
    try {
      const r = await fetch(url, { headers: UA2 });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 400000) continue;
      const file = path.join(OUT, `talker_${c.id}.mp4`);
      fs.writeFileSync(file, buf);
      /* duracion y dimensiones */
      const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_name', '-of', 'default=nw=1', file]).toString().trim().split('\n');
      const w = (probe.find(l => l.startsWith('width=')) || '').replace('width=', '');
      const h = (probe.find(l => l.startsWith('height=')) || '').replace('height=', '');
      const dur = parseFloat((probe.find(l => l.startsWith('duration=')) || 'duration=0').replace('duration=', ''));
      const codec = (probe.find(l => l.startsWith('codec_name=')) || '').replace('codec_name=', '');
      if (dur < 8) { console.log(`- ${c.id}: muy corto (${dur}s)`); fs.unlinkSync(file); continue; }
      /* solo verticales 9:16: el frame de la replica es vertical */
      if (+w / +h < 0.55 || +w / +h > 0.65) { fs.unlinkSync(file); continue; }
      /* frame de vista previa para elegir */
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.min(2, dur / 2)), '-i', file, '-frames:v', '1', path.join(OUT, `talker_${c.id}.jpg`)]);
      console.log(`+ talker_${c.id}.mp4  ${w}x${h}  ${dur.toFixed(1)}s  ${codec}  ${(buf.length / 1e6).toFixed(1)} MB  <- ${c.title || c.slug}`);
      got = true; n++;
      break;
    } catch { /* siguiente resolucion */ }
  }
  if (!got && c.title) console.log(`- ${c.id}: sin descarga (${c.title})`);
}
console.log(`\ndescargados: ${n}`);
