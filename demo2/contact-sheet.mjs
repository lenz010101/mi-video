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

/* La fuente de Windows sirve para el drawtext de ffmpeg (las woff2 del repo no). */
const font = 'C\\:/Windows/Fonts/arial.ttf';
const vf = [
  `fps=${fps}`,
  `drawtext=fontfile='${font}':text='%{pts\\:hms}':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=6`,
  'scale=190:338',
  'tile=6x5',
].join(',');

execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', vf, '-frames:v', '1', out]);
console.log('hoja de contactos: ' + out);
