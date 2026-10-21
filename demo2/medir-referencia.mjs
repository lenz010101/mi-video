// Mide un video de referencia en un comando: perfil de movimiento (tabla de
// cortes), hoja de contactos y tiras por zonas (arriba / medio). Es el paso
// obligatorio antes de clonar un montaje: antes se hacia a mano y eran 20
// minutos; esto son ~40 s.
//
//   node demo2/medir-referencia.mjs "C:/Users/Admin/Downloads/ref.mp4" [salida]
//
// La salida: <salida>/motion.txt, hoja.png, tira-arriba.png, tira-medio.png
// y un resumen por pantalla con la tabla de cortes.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const entrada = process.argv[2];
if (!entrada) { console.log('uso: node demo2/medir-referencia.mjs <video.mp4> [carpeta]'); process.exit(1); }
if (!fs.existsSync(entrada)) { console.log('no existe: ' + entrada); process.exit(1); }

const salida = path.resolve(process.argv[3] || path.join('demo2', 'new', 'ref'));
fs.mkdirSync(salida, { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });

// ── 1) dimensiones y duracion ────────────────────────────────────────
const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries',
  'format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames',
  '-of', 'default=nw=1', entrada], { encoding: 'utf8' });
console.log('--- archivo ---');
console.log(probe.trim());

// ── 2) perfil de movimiento (diferencia entre fotogramas) ───────────
// La metadata va a stderr (no a un fichero: las rutas con espacios rompen
// el filtro file= de ffmpeg).
const motion = path.join(salida, 'motion.txt');
let stderr = '';
try {
  execFileSync('ffmpeg', ['-v', 'info', '-i', entrada, '-vf',
    'tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG',
    '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) { stderr = String(e.stderr || ''); }
if (!stderr) {
  // si no hubo error, ffmpeg escribe en stderr igualmente: se repite capturando
  stderr = execFileSync('ffmpeg', ['-v', 'info', '-i', entrada, '-vf',
    'tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG',
    '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
fs.writeFileSync(motion, stderr, 'utf8');

const txt = fs.readFileSync(motion, 'utf8');
const frames = [];
const re = /pts_time:([0-9.]+)[\s\S]*?YAVG=([0-9.]+)/g;
let m;
while ((m = re.exec(txt))) frames.push({ t: +m[1], v: +m[2] });
console.log(`\n--- movimiento: ${frames.length} fotogramas ---`);

// cortes = picos de movimiento por encima del umbral
const UMBRAL = 12;
const cortes = [];
for (let i = 1; i < frames.length; i++) {
  if (frames[i].v > UMBRAL && frames[i - 1].v <= UMBRAL) cortes.push(frames[i]);
}
console.log('cortes (movimiento > ' + UMBRAL + '):');
for (const c of cortes.slice(0, 40)) console.log('  ' + c.t.toFixed(2) + ' s   mov=' + c.v.toFixed(0));
if (cortes.length > 40) console.log('  ... y ' + (cortes.length - 40) + ' mas');

// ── 3) hojas y tiras ────────────────────────────────────────────────
const hojas = [
  ['hoja.png', 'fps=1/2,scale=200:-1,tile=4x4:margin=6:padding=4:color=0x202020'],
  ['tira-arriba.png', 'fps=2,crop=iw:ih*0.48:0:0,scale=150:-1,tile=8x8:margin=4:padding=3:color=0x303030'],
  ['tira-medio.png', 'fps=2,crop=iw:ih*0.55:0:ih*0.16,scale=150:-1,tile=8x8:margin=4:padding=3:color=0x303030'],
];
for (const [nombre, vf] of hojas) {
  const destino = path.join(salida, nombre);
  ff(['-i', entrada, '-vf', vf, '-frames:v', '1', destino]);
  console.log('  ' + nombre + '  (' + Math.round(fs.statSync(destino).size / 1024) + ' KB)');
}
console.log('\nlisto: ' + salida);
console.log('lee las tiras para copiar los tiempos de cada elemento y la hoja para el estilo.');
