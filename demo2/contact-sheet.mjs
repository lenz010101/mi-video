/* Hoja de contactos numerada de un MP4: una imagen con todos los planos y su
   timecode. Sirve para revisar sin instalar nada: se señala "el 14" y se sabe
   que es el plano de las 6,5 s.
   Uso:  node demo2/contact-sheet.mjs <video.mp4> [salida.png] [fps] */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const mp4 = process.argv[2] || 'C:/Users/Admin/Desktop/veluxe-promo.mp4';
const out = process.argv[3] || 'demo2/qc9/contacto.png';
const fps = process.argv[4] || '2';
if (!fs.existsSync(mp4)) { console.error('no existe: ' + mp4); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });

/* Fuente para el drawtext de ffmpeg: la del sistema, la que exista.
   (Las woff2 del repo no valen para drawtext.) */
const FONT_CANDIDATES = [
  'C\\:/Windows/Fonts/arial.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
  '/usr/share/fonts/TTF/DejaVuSans.ttf',
];
const fsx = fs;
let font = FONT_CANDIDATES[0];
for (const f of FONT_CANDIDATES) {
  const p = f.replace(/\\:/g, ':').replace(/\\/g, '/');
  if (fsx.existsSync(p)) { font = f; break; }
}
const withText = [
  `fps=${fps}`,
  `drawtext=fontfile='${font}':text='%{pts\\:hms}':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=6`,
  'scale=190:338',
  'tile=6x5',
].join(',');
const withoutText = [`fps=${fps}`, 'scale=190:338', 'tile=6x5'].join(',');

/* El ffmpeg estatico del CI no trae drawtext (sin libfreetype). Si falla, se
   hace la hoja sin timecodes en vez de romper el pipeline. */
try {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', withText, '-frames:v', '1', out]);
} catch (e) {
  const msg = String(e.stderr || e.message || '');
  if (!/drawtext|No such filter/i.test(msg)) throw e;
  console.log('aviso: este ffmpeg no trae drawtext; la hoja sale sin timecodes.');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', withoutText, '-frames:v', '1', out]);
}
console.log('hoja de contactos: ' + out);
