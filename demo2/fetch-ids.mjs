/* Descarga clips concretos de Mixkit por id (720) y deja preview.
   Uso:  node demo2/fetch-ids.mjs 52187 24228 42323
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT = 'assets/clips/candidates';
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const H = { 'User-Agent': UA, Referer: 'https://mixkit.co/' };

for (const id of process.argv.slice(2)) {
  for (const q of ['720', '1080']) {
    const url = `https://assets.mixkit.co/videos/${id}/${id}-${q}.mp4`;
    try {
      const ctl = AbortSignal.timeout(90000);
      const r = await fetch(url, { headers: H, signal: ctl });
      if (!r.ok) { console.log(`- ${id} ${q}: HTTP ${r.status}`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      const file = path.join(OUT, `c_${id}.mp4`);
      fs.writeFileSync(file, buf);
      const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'default=nw=1', file]).toString();
      const w = (probe.match(/width=(\d+)/) || [])[1];
      const h = (probe.match(/height=(\d+)/) || [])[1];
      const dur = (probe.match(/duration=([\d.]+)/) || [])[1];
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.min(2, (+dur) / 2)), '-i', file, '-frames:v', '1', path.join(OUT, `c_${id}.jpg`)]);
      console.log(`+ c_${id}.mp4  ${w}x${h}  ${(+dur).toFixed(1)}s  ${(buf.length / 1e6).toFixed(1)}MB`);
      break;
    } catch (e) { console.log(`- ${id} ${q}: ${e.message}`); }
  }
}
