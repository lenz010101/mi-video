/* Prepara el material NUEVO del reel en la nube (nunca en el PC del usuario).
   Lee assets/nuevo/fuentes.json, descarga los clips y la musica de Mixkit
   (licencia libre, sin clave), los recorta a 9:16, les aplica el grado de
   color y los deja listos para HyperFrames:
     - H.264 Constrained Baseline nivel 3.1 (Chrome headless solo decodifica eso)
     - yuv420p, faststart, CRF 23 (calidad alta, peso bajo)
   Idempotente: si el fichero ya esta, no lo vuelve a hacer.

   Uso:  node demo2/preparar-nuevo.mjs [manifiesto]
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const MAN = process.argv[2] || 'assets/nuevo/fuentes.json';
const man = JSON.parse(fs.readFileSync(path.join(ROOT, MAN), 'utf8'));
const OUT = path.join(ROOT, man.salida || 'assets/nuevo/procesado');
fs.mkdirSync(OUT, { recursive: true });

const P = man.perfil || {};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const ffmpeg = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
  if (r.status !== 0) throw new Error('ffmpeg: ' + (r.stderr || '').toString().slice(-400));
};

const have = (f) => fs.existsSync(f) && fs.statSync(f).size > 20000;
let fallos = 0;

/* ── Clips ── */
for (const c of man.clips || []) {
  const out = path.join(OUT, `${c.slug}.mp4`);
  if (have(out)) { console.log(`  cache  ${c.slug}.mp4`); continue; }
  const url = `https://assets.mixkit.co/videos/${c.id}/${c.id}-${c.calidad || '720'}.mp4`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://mixkit.co/' } });
    if (!r.ok) throw new Error('http ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const tmp = path.join(OUT, `_src_${c.id}.mp4`);
    fs.writeFileSync(tmp, buf);
    /* encuadre: el fuente puede ser horizontal (se recorta a 9:16) o vertical */
    const w = P.ancho, h = P.alto;
    const enc = c.encuadre || 'centro';
    const cx = enc === 'izquierda' ? '(iw-1080)/2*0.15' : enc === 'derecha' ? '(iw-1080)/2*0.85' : '(iw-1080)/2';
    const vf = [
      `scale=-2:${h}:flags=lanczos`,
      `crop=${w}:${h}:${cx}:0`,
      P.gradado || 'null',
      'format=yuv420p',
    ].join(',');
    ffmpeg([
      '-ss', String(c.inicio || 0), '-i', tmp, '-t', String(c.duracion || 5),
      '-vf', vf,
      '-c:v', 'libx264', '-profile:v', P.perfil_h264 || 'baseline', '-level', P.nivel_h264 || '3.1',
      '-preset', P.preset || 'veryfast', '-crf', String(P.crf ?? 23),
      '-pix_fmt', P.pix_fmt || 'yuv420p', '-movflags', '+faststart', '-an',
      out,
    ]);
    fs.rmSync(tmp, { force: true });
    console.log(`  listo  ${c.slug}.mp4  ${(fs.statSync(out).size / 1048576).toFixed(1)}MB`);
  } catch (e) {
    fallos++;
    console.log(`  [warning] ${c.slug}: ${e.message}`);
  }
}

/* ── Musica ── */
for (const m of man.musica || []) {
  const out = path.join(OUT, m.archivo || `music-${m.id}.mp3`);
  if (have(out)) { console.log(`  cache  ${m.archivo}`); continue; }
  try {
    const url = `https://assets.mixkit.co/music/${m.id}/${m.id}.mp3`;
    const r = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://mixkit.co/' } });
    if (!r.ok) throw new Error('http ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const tmp = path.join(OUT, `_src_${m.id}.mp3`);
    fs.writeFileSync(tmp, buf);
    ffmpeg([
      '-ss', String(m.inicio || 0), '-i', tmp, '-t', String(m.duracion || 30),
      '-af', 'afade=t=in:st=0:d=1.2,afade=t=out:st=28:d=2,volume=0.85',
      '-c:a', 'libmp3lame', '-q:a', '3', '-ar', '44100', '-ac', '2',
      out,
    ]);
    fs.rmSync(tmp, { force: true });
    console.log(`  listo  ${m.archivo}  ${(fs.statSync(out).size / 1048576).toFixed(1)}MB`);
  } catch (e) {
    fallos++;
    console.log(`  [warning] musica ${m.id}: ${e.message}`);
  }
}

console.log(`\n${man.clips?.length || 0} clips + ${man.musica?.length || 0} pistas listos en ${man.salida} (${fallos} fallo(s))`);
