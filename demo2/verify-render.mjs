/* Verificacion "9.9 visual" de un MP4 entregado (no del render en local):
     1) perfil de movimiento por frame (YAVG de la diferencia entre frames)
     2) deteccion de fotogramas CONGELADOS (frames identicos: YAVG == 0)
     3) lista de cortes y cambio de plano
     4) filmstrip + fotogramas clave para revision visual
   Uso:  node demo2/verify-render.mjs <video.mp4> [carpeta-salida] */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const mp4 = process.argv[2];
const outDir = process.argv[3] || 'demo2/qc9';
if (!mp4 || !fs.existsSync(mp4)) {
  console.error('uso: node demo2/verify-render.mjs <video.mp4> [carpeta]');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

/* ── 0) metadatos ── */
const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,r_frame_rate,nb_frames',
  '-of', 'default=nw=1', mp4]).toString().trim().split('\n');
console.log('== MP4 ==');
dur.forEach(l => console.log('  ' + l));

/* ── 1) perfil de movimiento ── */
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', mp4,
  '-vf', 'tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
  '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const frames = [];
const re = /pts_time:([0-9.]+)[\s\S]*?YAVG=([0-9.]+)/g;
let m;
while ((m = re.exec(raw))) frames.push({ t: +m[1], v: +m[2] });
console.log(`\nframes analizados: ${frames.length}`);

/* ── 2) fotogramas congelados: frames identicos (YAVG == 0) ── */
let frozen = 0, worstRun = 0, run = 0, runStart = 0, worstStart = 0;
for (const f of frames) {
  if (f.v === 0) {
    if (run === 0) runStart = f.t;
    run++; frozen++;
    if (run > worstRun) { worstRun = run; worstStart = runStart; }
  } else run = 0;
}
console.log(`\n== FOTOGRAMAS CONGELADOS (YAVG == 0) ==`);
console.log(frozen === 0
  ? '  NINGUNO: ningun frame es identico al anterior'
  : `  ${frozen} frames identicos (${(frozen / 30).toFixed(2)} s) - racha mas larga: ${worstRun} frames desde ${worstStart.toFixed(2)}s`);
const dead = frames.filter(f => f.v < 0.05).length;
console.log(`  frames casi-identicos (YAVG < 0.05): ${dead}`);

/* ── 3) cambios de plano ── */
const cuts = [];
for (let i = 0; i < frames.length; i++) {
  if (frames[i].v > 12 && frames[i + 1] && frames[i + 1].v > 8) {
    cuts.push(frames[i].t);
    i += 3;
  }
}
console.log(`\n== CAMBIOS DE PLANO (${cuts.length}) ==`);
console.log('  ' + cuts.map(t => t.toFixed(2) + 's').join('  '));

/* ── 4) fases: donde hay movimiento y donde esta quieto ── */
const buckets = new Map();
for (const f of frames) {
  const k = (Math.floor(f.t * 2) / 2).toFixed(1);
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push(f.v);
}
console.log('\n== FASES (0.5 s) ==');
let phase = null, start = null;
for (const [k, arr] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const p = avg < 0.6 ? 'CALMA' : avg < 8 ? 'movimiento' : 'TRANSICION';
  if (p !== phase) {
    if (phase) console.log(`  ${start}s .. ${(+k - 0.5).toFixed(1)}s   ${phase}`);
    phase = p; start = k;
  }
}
if (phase) console.log(`  ${start}s .. ${frames.at(-1).t.toFixed(1)}s   ${phase}`);

/* ── 5) filmstrip + fotogramas clave ── */
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', 'fps=2,scale=180:320,tile=6x5',
  '-frames:v', '1', path.join(outDir, 'filmstrip.png')]);
console.log('\n== IMAGENES ==');
console.log('  ' + path.join(outDir, 'filmstrip.png'));

/* Pocos frames y a media resolucion: el PC es lento y no hace falta mas. */
const keys = [0.1, 1.0, 2.1, 5.1, 6.5, 9.2, 11.7, 12.4];
for (const t of keys) {
  const p = path.join(outDir, `f_${String(t).replace('.', '_')}.jpg`);
  try {
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(t), '-i', mp4,
      '-frames:v', '1', '-vf', 'scale=540:-1', '-q:v', '4', p]);
  } catch { console.log('  (no se pudo extraer t=' + t + ')'); }
}
console.log('  fotogramas clave (540 px) en ' + outDir);
